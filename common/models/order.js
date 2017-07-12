var validator = require('validator')
  , async = require('async')
  , loopback = require('loopback')
  ;
require('date-utils');

ORDER_PLATFORM_IOS = "iOS";
ORDER_PLATFORM_ANDROID = "Android";
ORDER_PLATFORM = [ORDER_PLATFORM_IOS, ORDER_PLATFORM_ANDROID];

module.exports = function(Order) {
  Order.prefixError="ORD_";

  Order.definition.rawProperties.priceUnit.default =
      Order.definition.properties.priceUnit.default = function() {
        return "USD";
  };

  Order.definition.rawProperties.status.default =
      Order.definition.properties.status.default = function() {
        return 0;
  };

  Order.definition.rawProperties.created.default =
      Order.definition.properties.created.default = function() {
        return new Date();
  };

  Order.definition.rawProperties.modified.default =
      Order.definition.properties.modified.default = function() {
        return new Date();
  };

  Order.createTrans = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if(typeof data.transactionId == 'undefined' || data.transactionId == '')
    {
      var error = new Error("transactionId is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.platform == 'undefined' || data.platform == ''){
      var error = new Error("platform is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.purchasePackageId == 'undefined' || data.purchasePackageId == ''){
      var error = new Error("purchasePackageId is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.transactionId !== 'string'){
      var error = new Error("Invalid transactionId");
      error.code = "INVALID_PARAMETER";
      error.field= "transactionId";
      return next(error);
    }
    if(typeof data.platform !== 'string'){
      var error = new Error("Invalid platform");
      error.code = "INVALID_PARAMETER";
      error.field= "platform";
      return next(error);
    }
    if(typeof data.purchasePackageId !== 'string'){
      var error = new Error("Invalid purchasePackageId");
      error.code = "INVALID_PARAMETER";
      error.field= "purchasePackageId";
      return next(error);
    }
    var purchasePackageId = data.purchasePackageId;
    Order.app.models.PurchasePackage.findById(purchasePackageId, {
      fields: {name: true, description: true, category: true, items: true, price: true, priceUnit:true}
    },function(err, found) {
      if(err || !found) {
        var error = new Error("PurchagePackage is not found");
        error.code = Order.prefixError+"CT01";
        return next(error);
      } else {
        var items = found.items;
        var budget = 0;
        var booster = [];
        var errors = [];
        var boosterKey = [];
        var memberBooster = [];
        data.purchasePackageLog = found;
        data.price = found.price;
        for (var i = 0; i < items.length; i++) {
          if(items[i].boosterKey == BOOSTER_MONEY) {
            var name = parseInt(found.name);
            var amount = items[i].number;
            budget += amount;
          } else {
            booster.push(found.items[i]);
            boosterKey.push(found.items[i].boosterKey);
          }
        }
        async.parallel([
          function(cb) {
            if(booster.length > 0 && boosterKey.length > 0) {
              Order.app.models.MemberBooster.find({
                where: {
                  memberId: userInfo.id,
                  boosterKey: {
                    inq: boosterKey
                  }
                }
              }, cb);
            } else {
              cb(null, "2");
            }
          },
          function(cb) {
            Order.findOne({where: {transactionId : data.transactionId}}, cb);
          }
        ], function(err, results) {
          if(err) {
            return next(err);
          } else {
            if((results[1] == null || results[1].length == 0 ) && results[0] != 2) {
              if(results[0].length > 0) {
                for (var i = 0; i < results[0].length; i++) {
                  if(boosterKey.indexOf(results[0][i].boosterKey) > -1) {
                    for (var j = 0; j < booster.length; j++) {
                      if(booster[j].boosterKey == results[0][i].boosterKey) {
                        results[0][i].updateAttributes({number: results[0][i].number + booster[j].number}, function(err) {
                          if(err) {
                            return next(err);
                          }
                        })
                      } else {
                        memberBooster.push({
                          "memberId": userInfo.id,
                          "boosterKey": booster[j].boosterKey,
                          "number": booster[j].number
                        });
                      }
                    }
                  }
                }
              } else {
                for (var k = 0; k < booster.length; k++) {
                  memberBooster.push({
                    "memberId": userInfo.id,
                    "boosterKey": booster[k].boosterKey,
                    "number": booster[k].number
                  })
                }
              }
            }
            data.memberId = userInfo.id.toString();
            Order.create(data, function(err, instance) {
              if(err) return next(err);
              if(budget > 0) {
                userInfo.updateBudget({budget: budget }, function(errors) {
                  if(errors) {
                    return next(errors);
                  }
                });
              }
              if(memberBooster.length > 0) {
                Order.app.models.MemberBooster.create(memberBooster, function(err) {
                  if(err) {
                    return next(err);
                  }
                })
              }
              next(null, {"budget": budget, "booster": booster});
            })
          }
        })
      }
    });
  }

  Order.setup = function() {
    Order.disableRemoteMethod('upsert',true);
    Order.disableRemoteMethod('createChangeStream',true);
    Order.disableRemoteMethod('exists',true);
    Order.disableRemoteMethod('findOne',true);
    Order.disableRemoteMethod('updateAll',true);
    Order.disableRemoteMethod('deleteById',true);
    Order.disableRemoteMethod('create', true);
    Order.disableRemoteMethod('upsertWithWhere',true);
    Order.disableRemoteMethod('replaceById',true);
    Order.disableRemoteMethod('replaceOrCreate',true);
    Order.disableRemoteMethod('updateOrCreate',true);

    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        if (!validator.isDate(this.created)) {
          cb();
        }
      }
    }
    Order.validate('created', validateCreated, {message: 'Invalid created'});

    function validateModified(cb) {
      if (typeof this.modified !== 'undefined') {
        if (!validator.isDate(this.modified)) {
          cb();
        }
      }
    }
    Order.validate('modified', validateModified, {message: 'Invalid modified'});

    function validatePrice(err) {
      if(typeof this.price !== 'undefined' && this.price) {
        if(!validator.isFloat(this.price)) {
          err();
        }
      }
    }
    Order.validate('price', validatePrice, {message: 'Price is invalid'});

    function validatePurchasePackageLog(err) {
      if(typeof this.purchasePackageLog !== 'undefined' && this.purchasePackageLog) {
        if(typeof this.purchasePackageLog !== 'object') {
          err();
        }
      }
    }
    Order.validate('purchasePackageLog', validatePurchasePackageLog, {message: 'Invalid purchasePackageLog'});

    function validatePlatform(err) {
      if(typeof this.platform !== 'undefined' && this.platform) {
        if(ORDER_PLATFORM.indexOf(this.platform) == -1) {
          err();
        }
      }
    }
    Order.validate('platform', validatePlatform, {message: 'Invalid platform'});

    Order.validatesUniquenessOf('transactionId', {message: 'transactionId is not unique'});

    loopback.remoteMethod(
      Order.createTrans,
      {
        accessType: 'WRITE',
        description: 'Add new Transaction',
        accepts: [
          {arg: 'data', type: 'object', required: true, http: {source: 'body'}}
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        returns: { root:true },
        http: {verb: 'post', path: '/'}
      }
    );
  }

  Order.setup();
};
