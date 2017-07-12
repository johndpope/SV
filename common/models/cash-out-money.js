var loopback = require('loopback')
  , async = require('async')
  , validator = require('validator')
  , configs = loopback.getConfigs().configs;
var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': configs.payPal.mode, //sandbox or live
  'client_id': configs.payPal.clientId,
  'client_secret': configs.payPal.clientSecret
});
var statusList = { 
  DONE : 'done',
  UNDER_VALIDATION: 'under_validation',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  PROCESSING: 'processing'
};
var STATUS_PAYOUT = 'payout'; // only for pay out, not store in db.
var options = configs.payPal;
module.exports = function(CashOutMoney) {
  // Hook to updating modified date.
  CashOutMoney.observe('before save', function (ctx, next) {
    if (ctx.currentInstance) {
      ctx.currentInstance.modified = new Date();
    }
    next();
  });

  CashOutMoney.prefixError = "COM_";
  CashOutMoney.disableRemoteMethod('createChangeStream',true);
  CashOutMoney.disableRemoteMethod('upsert',true);
  CashOutMoney.disableRemoteMethod('exists',true);
  CashOutMoney.disableRemoteMethod('findOne',true);
  CashOutMoney.disableRemoteMethod('create',true);
  CashOutMoney.disableRemoteMethod('updateAll',true);
  CashOutMoney.disableRemoteMethod('replaceById',true);
  CashOutMoney.disableRemoteMethod('replaceOrCreate',true);
  CashOutMoney.disableRemoteMethod('updateOrCreate',true);
  CashOutMoney.disableRemoteMethod('upsertWithWhere',true);
  CashOutMoney.disableRemoteMethod('deleteById',true);
  
  CashOutMoney.definition.rawProperties.created.default =
    CashOutMoney.definition.properties.created.default = function() {
    return new Date();
  };
  CashOutMoney.definition.rawProperties.modified.default =
    CashOutMoney.definition.properties.modified.default = function() {
    return new Date();
  };
  CashOutMoney.createPayout = function(senderItemId, payToEmail, amount, subject, note, callback){
    var create_payout_json = {
      "sender_batch_header": {
        "sender_batch_id": Math.random().toString(36).substring(9),
        "email_subject": subject
      },
      "items": [
        {
          "recipient_type": "EMAIL",
          "amount": {
              "value": amount,
              "currency": configs.payPal.currencyCode
            },
            "receiver": payToEmail,
            "note": note,
            "sender_item_id": senderItemId
          }
      ]
    };
    var sync_mode = 'true';
    paypal.payout.create(create_payout_json, sync_mode, function (error, payout) {
      callback(error,payout);
    });
  }

  CashOutMoney.payoutMoney = function(CashOutObj, userInfo, updateMoneyAmount, next) {
    if (typeof CashOutObj.email == 'undefined') {
      var err = new Error("Payment email is required");
      err.code = CashOutMoney.prefixError + "PM01";
      return next(err);
    }

    CashOutMoney.createPayout(CashOutObj.id, CashOutObj.email, CashOutObj.amount, "You have payment from your store on stocket","Payment from your store on stocket", function(err, response){///!\ Send to Paypal to send money by email.
      if (err) {
        err.code = "NOK";
        next(err);
      }
      else {
        var negative = ['BLOCKED','DENIED','FAILED'];
        var result = {};

        switch(response.batch_header.batch_status){
          case 'BLOCKED':
            result.message = 'The payout item is blocked.';
            break;
          case 'DENIED':
            result.message = 'The payout item was denied payment.';
            break;
          case 'FAILED':
            result.message = 'Processing for the payout item failed.';
            break;
          case 'NEW':
            result.message = 'The payment processing is delayed due to PayPal internal updates.';
            break;
          case 'ONHOLD':
            result.message = 'The payout item is on hold.';
            break;
          case 'PENDING':
            result.message = 'The payout item is awaiting payment.';
            break;
          case 'REFUNDED':
            result.message = 'The payment for the payout item was successfully refunded.';
            break;
          case 'RETURNED':
            result.message = 'The payout item is returned. If the recipient does not claim it in 30 days, the funds are returned.';
            break;
          case 'SUCCESS':
            result.message = 'The payout item was successfully processed.';
            break;
          case 'UNCLAIMED':
            result.message = 'The payout item is unclaimed. If it is not claimed within 30 days, the funds are returned to the sender.';
            break;
        }

        result.code = response.batch_header.batch_status;
        if (negative.indexOf(result.code) > -1) {
          result.message += ' (bank_transaction_not_ok)';
          CashOutObj.status = statusList.VALIDATED;
        }
        else {//positive
          result.message += ' (bank_transaction_ok)';
          CashOutObj.status = statusList.DONE;
        }

        async.parallel([
          function (async_cb) {
             CashOutObj.updateAttributes({
              status: CashOutObj.status,
              data: JSON.stringify(response, null)
            }, function(error) {
              if(error) {
                return async_cb(result);
              }

              async_cb();
            });
          },
          function (async_cb) {
            if (updateMoneyAmount === false) {
              return async_cb();
            }

            CashOutMoney.app.models.Member.update({id: userInfo.id}, { moneyAmount: updateMoneyAmount}, function(err, instance) {
              if(err) {
                return async_cb(error);
              }

              async_cb();
            });
          }
        ], function(err, res) {
          if (err) {
            return next(err);
          }

          next(null, result);
        });
      }
    });
  };

  CashOutMoney.cashOut = function(params, ctx, callback) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return callback(error);
    }

    if(typeof params.email == 'undefined') {
      var error = new Error("Missing parameter: email");
      error.code = "MISSING_PARAMETER";
      return callback(error);
    }
    if(typeof params.email !== 'string') {
      error = new Error("Invalid parameters: email must be a string");
      error.code = "INVALID_PARAMETER";
      error.field = "email";
      return callback(error);
    }
    if(!validator.isEmail(params.email)) {
      error = new Error("Invalid parameters: email");
      error.code = "INVALID_PARAMETER";
      error.field = "email";
      return callback(error);
    }

    var result = {code:null, message:''};
    if (userInfo.moneyAmount < this.app.models.Setting.configs.CASHOUT_MINIMUM){ 
      result.name = "Error";
      result.code = "LOW";
      result.message = "Too low amount";
      callback(result);
    }
    else {
      // Create Cashout Money Object
      // Status {done, under_validation, validated, rejected, processing}
      var CashOutObj = {
        ownerId: userInfo.id,
        email: params.email,
        amount: userInfo.moneyAmount
      };
      userInfo.moneyAmount = 0;
      if (CashOutObj.amount > this.app.models.Setting.configs.CASHOUT_MAXIMUM_UNCHECK){
        CashOutObj.status = statusList.UNDER_VALIDATION;
        async.parallel([
          function (async_cb) {
            CashOutMoney.create(CashOutObj, function(err, instance) {
              if(err) {
                return async_cb(err);
              }
              async_cb();
            });
          },
          function (async_cb) {
            CashOutMoney.app.models.Member.update({id: userInfo.id}, { moneyAmount: userInfo.moneyAmount}, function(err, instance) {
              if(err) {
                return async_cb(err);
              }
              async_cb();
            });
          }
        ], function(err) {
          result.name = "Error";
          result.code = "MUCH";
          result.message = "Too much money";
          callback(result);
        });
      }
      else {
        CashOutObj.status = statusList.PROCESSING;
        this.create(CashOutObj, function(err, instance) {
          if(err) {
            // Cannot create CashOut.
            err.code = CashOutMoney.prefixError + "CO01";
            callback(err);
          }
          else{
            // The CashOut has been created.
            CashOutMoney.payoutMoney(instance, userInfo, 0, callback);
          }
        });
      }
    } 
  };

  CashOutMoney.beforeRemote('prototype.updateAttributes', function(ctx, instance, next) {
    var currentCashOut = ctx.req.remotingContext.instance;
    var newStatus = ctx.req.body.status || statusList.PROCESSING;
    var ignoredFields = ["amount", "ownerId", "data", "created", "modified"];
    var listStatus = [STATUS_PAYOUT, statusList.PROCESSING, statusList.DONE, statusList.REJECTED, statusList.UNDER_VALIDATION, statusList.VALIDATED];
    var error = null;

    ignoredFields.forEach(function(fieldName) {
      if (ctx.req.body[fieldName]) {
        delete ctx.req.body[fieldName];
      }
    });
    if (listStatus.indexOf(newStatus) === -1) {
      error = new Error("Invalid parameters: status");
      error.code = "INVALID_PARAMETER";
      error.field = "status";
      return next(error);
    }

    if(ctx.req.body.email && !validator.isEmail(ctx.req.body.email)) {
      error = new Error("Invalid parameters: email");
      error.code = "INVALID_PARAMETER";
      error.field = "email";
      return next(error);
    }

    CashOutMoney.app.models.Member.getCurrentUser(ctx, function(err, userInfo) {
      if (err) {
        return next(err);
      }

      // Only allow owner to collect own transaction with current status is validated.
      var isNotAdmin = (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1);
      if (isNotAdmin && (userInfo.id != currentCashOut.ownerId || newStatus !== STATUS_PAYOUT || currentCashOut.status !== statusList.VALIDATED)) {
        error = new Error("Permission denied. Authenticated user is only allowed to collect money with status = payout.");
        error.code = "INVALID_PARAMETER";
        error.field = "status";
        if (userInfo.id != currentCashOut.ownerId) {
          error.message = "Permission denied. This transaction is owned.";
          error.code = "AUTHORIZATION_REQUIRED";
          delete error.field;
        }
        else if (currentCashOut.status !== statusList.VALIDATED) {
          error.message = "Permission denied. This transaction can not collect now.";
          error.code = "AUTHORIZATION_REQUIRED";
          delete error.field;
        }
        return next(error);
      }

      // Can not update status if current status is DONE.
      if (currentCashOut.status === statusList.DONE) {
        ctx.req.body.status = statusList.DONE;
        return next();
      }

      // Don't send to Paypal if newStatus is not equal payout.
      if (newStatus !== STATUS_PAYOUT) {
        return next();
      }

      // Payout money by Paypal.
      ctx.req.body.status = statusList.DONE;
      currentCashOut.email = ctx.req.body.email || currentCashOut.email;
      CashOutMoney.payoutMoney(currentCashOut, userInfo, false, function(err, data) {
        if (err) {
          return next(err);
        }

        // Re-define response data via cashOut create API.
        var res = {
          'data': data,
          'error': null
        };
        ctx.res.json(res);
      });
    });
  });

  CashOutMoney.remoteMethod(
    'cashOut',
    {
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', description: '{"email": "email address"}', required: true,
          http: {source: 'body'}
        }
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: '',
      http: {verb: 'post', path: '/'},
      returns: {arg: 'data', type: 'object', root: true},
    }
  );
};
