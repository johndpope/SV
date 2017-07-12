var async = require('async'),
    validator = require('validator');
require('date-utils');
module.exports = function(MemberBooster) {
  MemberBooster.prefixError = "MBR_";

  MemberBooster.initialForNewAccount = function(memberId, next) {
    var boosterInitValues = MemberBooster.app.models.Setting.configs['BOOSTER_INITIAL_VALUES'] || null;
    var error = new Error();

    if (!boosterInitValues) {
      error.message = "BOOSTER_INITIAL_VALUES settings is not exist.";
      error.code = MemberBooster.prefixError + "IN01";
      return next(error);
    }

    var memberBooster = [];
    BOOSTER_KEYS.forEach(function(boosterKey) {
      var item = {
        "boosterKey": boosterKey,
        "memberId": memberId,
        "number": 0
      }

      if (boosterKey !== BOOSTER_FACEBOOK_SHARE && boosterKey !== BOOSTER_TWITTER_SHARE) {
        if (boosterInitValues[boosterKey]) {
          item.number = boosterInitValues[boosterKey];
        }
        else if (boosterInitValues["default"]){
          item.number = boosterInitValues["default"];
        }
      }

      memberBooster.push(item);
    });

    MemberBooster.create(memberBooster, function(err, instances) {
      if (err) {
        return next(err);
      }
      next(null, instances);
    });
  };
  /**
   * Check memberBooster for concurrent request to use booster on the same user.
   * @param  {[type]}   memberId   [description]
   * @param  {[type]}   boosterKey [description]
   * @param  {Function} next       [description]
   * @return {[type]}              [description]
   */
  MemberBooster.concurrentCheckAndUseBooster = function(memberId, boosterKey, next) {
    if (typeof memberId != 'object') {
      var ObjectID = MemberBooster.getDataSource().ObjectID();
      if (!ObjectID.isValid(memberId)) {
        var err = new Error("Invalid memberId.");
        err.code = "INVALID_PARAMETER";
        err.field = "memberId";
        return next(err);
      }

      memberId = ObjectID(memberId);
    }

    var updateNumber = -1;
    var whereCondition = {
      memberId: memberId,
      boosterKey: boosterKey,
      number: { $gt: 0 }
    };

    var sortOrder   = [['_id','asc']];
    var updateValue = { $inc: { number: updateNumber } };
    var options     = { new: true };
    var MemberBoosterCollection = MemberBooster.getDataSource().connector.collection(MemberBooster.modelName);
    MemberBoosterCollection.findAndModify(
      whereCondition,
      sortOrder,
      updateValue,
      options,
      function(err, result) {
      if (err) {
        next(err);
      } else {
        if (result.value) {
          result.value.id = result.value._id;
          result.value._id = undefined;
        }
        next(null, result.value);
      }
    });
  };
  MemberBooster.rollBackUseBooster = function(memberId, boosterKey, next) {
    MemberBooster.updateNumberBooster(memberId, boosterKey, 1, next);
  };
  MemberBooster.updateNumberBooster = function(memberId, boosterKey, number, next) {
    var MemberBoosterCollection = MemberBooster.getDataSource().connector.collection(MemberBooster.modelName);
    MemberBoosterCollection.update({
      memberId: memberId,
      boosterKey: boosterKey
    }, {
      $inc: { number: number }
    }, function(err, result) {
      if (err) {
        return next(err);
      }
      return next(null, result.count);
    });
  };

  MemberBooster.updateMemberBooster = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1) {
      error = new Error("Permission denied");
      error.code = MemberBooster.prefixError + "UB01";
      next(error);
    } else {
      MemberBooster.updateBooster(data, next);
    }
  };

  MemberBooster.updateBooster = function(data, next) {
    if (typeof data.playerId === 'undefined') {
      var error = new Error("Missing parameter: playerId");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else if (typeof data.boosterKey === 'undefined') {
      var error = new Error("Missing parameter: boosterKey");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else if (typeof data.number === 'undefined') {
      var error = new Error("Missing parameter: number");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else {
      if(typeof data.playerId === 'string') {
        data.playerId = MemberBooster.getDataSource().ObjectID(data.playerId);
      }
      if(typeof data.boosterKey !== 'string') return next(new Error("Invalid boosterKey"));
      var Booster = MemberBooster.app.models.Booster;
      var Member = MemberBooster.app.models.Member;
      var booster = null;
      var player  = null;
      var memberBooster = null;
      async.series([
        function(ass_1) {
          // Validate booster
          Booster.findOne({
            where: {
              key: data.boosterKey
            }
          }, function(err, foundBooster) {
            if(err) {
              ass_1(err);
            } else if(!foundBooster) {
              error = new Error("Booster not found");
              error.code = MemberBooster.prefixError + "UB02";
              ass_1(error);
            } else {
              booster = foundBooster;
              ass_1();
            }
          });
        },
        function(ass_1) {
          if(!validator.isInt(data.number)) {
            error = new Error("Invalid parameters: number");
            error.code = "INVALID_PARAMETER";
            error.field = "number";
            ass_1(error);
          } else {
            ass_1();
          }
        },
        function(ass_1) {
          // Validate Player
          Member.findById(data.playerId, function(err, foundMember) {
            if(err) {
              ass_1(err);
            } else {
              player = foundMember;
              ass_1();
            }
          });
        }
      ], function(err) {
        if(err) {
          next(err);
        } else {
          if(data.boosterKey === BOOSTER_MONEY) {
            player.updateBudget({ budget: data.number }, next);
          } else {
            MemberBooster.insertUpdateData(data, next);
          }
        }
      });
    }
  };

  MemberBooster.transferBooster = function(from, to, boosterKey, number, next) {

    var data = {
      from: from,
      to: to,
      boosterKey: boosterKey,
      number: number
    };

    if (typeof data.from === 'undefined') {
      var error = new Error("Missing parameter: from");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else if (typeof data.to === 'undefined') {
      var error = new Error("Missing parameter: to");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else if (typeof data.boosterKey === 'undefined') {
      var error = new Error("Missing parameter: boosterKey");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else {
      if(typeof data.number === 'undefined') {
        data.number = 1;
      }
      if(typeof data.from !== 'string') {
        error = new Error("Invalid parameters: from must be a string");
        error.code = "INVALID_PARAMETER";
        error.field = "from";
        return next(error);
      }
      if(typeof data.to !== 'string') {
        error = new Error("Invalid parameters: to must be a string");
        error.code = "INVALID_PARAMETER";
        error.field = "to";
        return next(error);
      }
      if(typeof data.boosterKey !== 'string') {
        error = new Error("Invalid parameters: boosterKey must be a string");
        error.code = "INVALID_PARAMETER";
        error.field = "boosterKey";
        return next(error);
      }
      var Member = MemberBooster.app.models.Member;
      async.series([
        function(asp_1) {
          MemberBooster.findOne({where: {
            memberId: data.from,
            boosterKey: data.boosterKey
          }}, function(err, foundMemberBooster) {
            if (err) {
              asp_1(err);
            } else if(!foundMemberBooster) {
              error = new Error("Can not find MemberBooster of member: "+ data.from);
              error.code = MemberBooster.prefixError + "TB01";
              asp_1(error);
            } else {
              if (foundMemberBooster.number <= 0) {
                error = new Error("Not Enough boosterKey");
                error.code = MemberBooster.prefixError + "TB02";
                asp_1(error);
              } else {
                asp_1(null, foundMemberBooster);
              }
            }
          });
        },
        function(asp_1) {
          // Update booster of from player
          MemberBooster.updateBooster({
            playerId: data.from,
            boosterKey: data.boosterKey,
            number: -1
          }, asp_1);
        },
        function(asp_1) {
          // Update booster of from player
          MemberBooster.updateBooster({
            playerId: data.to,
            boosterKey: data.boosterKey,
            number: 1
          }, asp_1);
        }
      ], function(err, res) {
        if(err) {
          next(err);
        } else {
          next(null, res[1]);
        }
      });
    }
  };

  MemberBooster.upsertMultiple = function(memberBoosters, isRollBack, next) {
    if (!memberBoosters || !memberBoosters.length) {
      return next();
    }

    var count = 0;
    var incVal = 0;
    var maxLen = memberBoosters.length;
    var results = [];
    var MemberBoosterCollection = MemberBooster.getDataSource().connector.collection(MemberBooster.modelName);
    memberBoosters.forEach(function(memberBooster) {
      if (memberBooster.memberId && memberBooster.boosterKey) {
        incVal = memberBooster.number;
        if (isRollBack) {
          incVal = -memberBooster.number;
        }

        MemberBoosterCollection.findAndModify({
          memberId: memberBooster.memberId,
          boosterKey: memberBooster.boosterKey
        },
        [['_id','asc']], {
          $inc: { number: incVal }
        }, {
          multi: true,
          upsert: true,
          new: true
        }, function(err, result) {
          count++;

          if (err) {
            return next(err, results);
          }
          else {
            if (result.value) {
              result.value.id = result.value._id;
              result.value._id = undefined;
            }
            results.push(result.value);
          }

          if (count >= maxLen) {
            return next(null, results);
          }
        });
      }
      else {
        count++;
      }
    });
  };

  MemberBooster.insertUpdateData = function(data, next){
    MemberBooster.findOne({
      where: {
        memberId: data.playerId,
        boosterKey: data.boosterKey
      }
    }, function(err, foundMemberBooster) {
      if (err) {
        next(err);
      } else if (!foundMemberBooster) {//Insert
        if (data.number >= 0) {
          MemberBooster.create({
            memberId: data.playerId,
            boosterKey: data.boosterKey,
            number: data.number
          }, next);
        } else {
          error = new Error("Invalid number");
          error.code = MemberBooster.prefixError + "IU01";
          next(error);
        }
      } else {
        // increase number
        var whereCondition = {
          memberId: foundMemberBooster.memberId,
          boosterKey: foundMemberBooster.boosterKey
        };
        if (data.number > 0) {
          whereCondition['number'] = { $gte: 0 };
        } else {
          whereCondition['number'] = { $gt: 0 };
        }
        var sortOrder   = [['_id','asc']];
        var updateValue = { $inc: { number: data.number } };
        var options     = { new: true };
        var MemberBoosterCollection = MemberBooster.getDataSource().connector.collection(MemberBooster.modelName);
        MemberBoosterCollection.findAndModify(
          whereCondition,
          sortOrder,
          updateValue,
          options,
          function(err, result) {
          if (err) {
            next(err);
          } else {
            // Update at least 1 record.
            if (result.value) {
              result.value.id = result.value._id;
              result.value._id = undefined;
              return next(null, result.value);
            }

            // Not update.
            whereCondition.number = 0;
            next(null, whereCondition);
          }
        });
      }
    });
  };

  MemberBooster.buy = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var userId = userInfo.id.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if(typeof data.boosterKey == 'undefined') {
      var error = new Error("Missing parameter: boosterKey");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof userInfo.budget == 'undefined') {
      var error = new Error("Missing parameter: budget of current user");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.boosterKey !== 'string' || BOOSTER_KEYS.indexOf(data.boosterKey) == -1) {
      error = new Error("Invalid parameters: boosterKey");
      error.code = "INVALID_PARAMETER";
      error.field = "boosterKey";
      return next(error);
    }
    if(typeof data.quantity !== 'undefined' && !validator.isInt(data.quantity)) {
      error = new Error("Invalid parameters: quantity must be a number");
      error.code = "INVALID_PARAMETER";
      error.field = "quantity";
      return next(error);
    }
    if(typeof data.quantity !== 'undefined' && parseInt(data.quantity) <= 0) {
      error = new Error("Invalid parameters: quantity must be greater than 0");
      error.code = "INVALID_PARAMETER";
      error.field = "quantity";
      return next(error);
    }
    var boosterKey = data.boosterKey;
    var quantity = parseInt(data.quantity) || 1;
    async.parallel([
      function(cb) {
        MemberBooster.app.models.Booster.findOne({
          where: {
            key: boosterKey,
            priceUnit: PRICE_UNIT_STOCKET
          },
          fields: {key: true, price: true, priceUnit: true}
        }, cb);
      }
    ], function(err, rs) {
      if(err) return next(err);
      var booster = rs[0];
      if(!booster) {
        error = new Error("Can't buy this booster by Stocket bucks!");
        error.code = MemberBooster.prefixError + "BU01";
        return next(error);
      }
      var totalPrice = booster.price * quantity;
      if(userInfo.budget >= totalPrice) {
        async.parallel([
          function(cb) {
            //Save boosterkey into memberBooster
            var mBoosters = [
              {
                memberId: userInfo.id,
                boosterKey: boosterKey,
                number: quantity
              }
            ];
            MemberBooster.upsertMultiple(mBoosters, false, cb);
          },
          function(cb) {
            //update currentBudget of player
            userInfo.updateBudget({budget: -totalPrice}, cb)
          }
        ], function(err, rs) {
          if(err) return next(err);
          var updatedMemberBoosters = rs[0];
          var updatedMember = rs[1];

          var mBooster = {};
          if (updatedMemberBoosters[0]) {
            mBooster = updatedMemberBoosters[0];
          }

          next(null, {
            "boosterKey": boosterKey,
            "number": mBooster.number,
            "remainsBudget": updatedMember.budget
          });
        })
      } else {
        error = new Error("User does not have enough budget to buy this booster");
        error.code = MemberBooster.prefixError + "BU02";
        return next(error);
      }
    })
  };

  MemberBooster.setup = function() {
    MemberBooster.disableRemoteMethod('create',true);
    MemberBooster.disableRemoteMethod('createChangeStream',true);
    MemberBooster.disableRemoteMethod('upsert',true);
    MemberBooster.disableRemoteMethod('exists',true);
    MemberBooster.disableRemoteMethod('findOne',true);
    MemberBooster.disableRemoteMethod('update',true);
    MemberBooster.disableRemoteMethod('updateAll',true);
    MemberBooster.disableRemoteMethod('replaceById',true);
    MemberBooster.disableRemoteMethod('replaceOrCreate',true);
    MemberBooster.disableRemoteMethod('updateOrCreate',true);
    MemberBooster.disableRemoteMethod('__get__member',false);
    MemberBooster.disableRemoteMethod('deleteById',true);
    MemberBooster.disableRemoteMethod('upsertWithWhere',true);

    // Validate number
    function validateNumber(cb_err) {
      if (typeof this.number !== 'undefined') {
        if (!validator.isInt(this.number)) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    MemberBooster.validate('number', validateNumber, {message: 'Invalid number'});

    function validateBoosterKey(cb_err) {
      if(typeof this.boosterKey !== 'undefined') {
        if(BOOSTER_KEYS.indexOf(this.boosterKey) == -1) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    MemberBooster.validate('boosterKey', validateBoosterKey, {message: 'Invalid boosterKey'});
    // Update member booster
    MemberBooster.remoteMethod(
      'updateMemberBooster',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: 'Model instance data', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Update member booster.',
        http: {verb: 'PUT', path: '/update'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );

    //Buy a booster by stocket bucks
    MemberBooster.remoteMethod(
      'buy',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{boosterKey: string , quantity: int}', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Buy a booster by stocket bucks.',
        http: {verb: 'POST', path: '/buy'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
  };

  MemberBooster.setup();

};