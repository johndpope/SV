var validator = require('validator')
  , async = require('async')
  , clone = require('clone')
  ;
require('date-utils');

SAFE_TYPE_NONE = 'none';
SAFE_TYPE_COPPER = 'copper';
SAFE_TYPE_SILVER = 'silver';
SAFE_TYPE_GOLD   = 'gold';
SAFE_TYPE = [SAFE_TYPE_NONE, SAFE_TYPE_COPPER, SAFE_TYPE_SILVER, SAFE_TYPE_GOLD];

SAFE_STATUS_COLLECTABLE_TIME = 'collectable_time';
SAFE_STATUS_COLLECTABLE      = 'collectable';
SAFE_STATUS_ONGOING_TIMER    = 'ongoing_timer';
SAFE_STATUS_ONGOING_COUNTER  = 'ongoing_counter';
SAFE_STATUS_CHOICE           = 'choice';
SAFE_STATUS_CHOICE_LOCK      = 'choice_lock';
SAFE_STATUS = [SAFE_STATUS_COLLECTABLE_TIME,SAFE_STATUS_COLLECTABLE, SAFE_STATUS_ONGOING_TIMER, SAFE_STATUS_ONGOING_COUNTER, SAFE_STATUS_CHOICE, SAFE_STATUS_CHOICE_LOCK];


module.exports = function(Safebox) {
  Safebox.prefixError = "SAF_";
  Safebox.definition.rawProperties.created.default =
      Safebox.definition.properties.created.default = function() {
        return new Date();
  };

  Safebox.definition.rawProperties.modified.default =
      Safebox.definition.properties.modified.default = function() {
        return new Date();
  };

  Safebox.validateRequiredFields = function(fields, inputData) {
    var missingFields = [];
    fields.forEach(function(fieldName) {
      if(!(fieldName in inputData)) {
        missingFields.push(fieldName);
      }
    });

    return missingFields;
  };
  Safebox.validateSafeTypes = function(fields, inputData) {
    var fieldName = '';
    var errorFields = [];
    for (var i = 0; i < fields.length; i++) {
      fieldName = fields[i];

      if(typeof inputData[fieldName] !== 'string') {
        errorFields.push(fieldName);
      }
      else if(SAFE_TYPE.indexOf(inputData[fieldName]) == -1) {
        errorFields.push(fieldName);
      }
    }

    return errorFields;
  };
  Safebox.getSafeTime = function(type) {
    var safeTime = Safebox.app.models.Setting.configs['SAFE_COPPER_TIMER'];
    if(type === SAFE_TYPE_SILVER) {
      safeTime = Safebox.app.models.Setting.configs['SAFE_SILVER_TIMER'];
    }
    else if (type == SAFE_TYPE_GOLD) {
      safeTime = Safebox.app.models.Setting.configs['SAFE_GOLD_TIMER'];
    }

    return safeTime;
  };

  Safebox.choice = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if(!storeId) {
      var error = new Error("Store not found");
      error.code = Safebox.prefixError + "CH01";
      return next(error);
    }

    var fields = ["cellNumber", "safeTypeChoice", "safeTypeAvailable", "safeTypeNext", "safeStatus"];
    var missingFields = Safebox.validateRequiredFields(fields, data);
    if(missingFields.length > 0) {
      var error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      error.field = missingFields.join(', ');
      error.statusCode = 400;
      return next(error);
    }

    if(!validator.isInt(data.cellNumber) || data.cellNumber < 1 || data.cellNumber > 50) {
      var error = new Error("Invalid cellNumber");
      error.code = "INVALID_PARAMETER";
      error.field = "cellNumber";
      return next(error);
    }
    if(data.safeSaleCounter && (!validator.isFloat(data.safeSaleCounter) || data.safeSaleCounter < 0)) {
      var error = new Error("Invalid safeSaleCounter");
      error.code = "INVALID_PARAMETER";
      error.field = "safeSaleCounter";
      return next(error);
    }

    fields = ["safeTypeChoice", "safeTypeAvailable", "safeTypeNext"];
    var errorFields = Safebox.validateSafeTypes(fields, data);
    if (errorFields.length > 0) {
      var error = new Error("Invalid parameters");
      error.code = "INVALID_PARAMETER";
      error.field = errorFields.toString();
      return next(error);
    }

    if(typeof data.safeStatus !== 'string') return next(new Error("Invalid safeStatus"));
    if(SAFE_STATUS.indexOf(data.safeStatus) == -1) {
      var error = new Error("Invalid safeStatus");
      error.code = "INVALID_PARAMETER";
      error.field = "safeStatus";safeStatus
      return next(error);
    }

    var cells = null;
    async.series([
      function(callback) {
        Safebox.app.models.Store.findById(storeId, function(err, foundStore) {
          if(err || !foundStore) {
            if (!err) {
              err = new Error("Store not found");
              err.code = Safebox.prefixError + "CH02";
            }
            callback(err);
          } else{
            cells = foundStore.cells;
            callback(null);
          }
        })
      },
      function(callback) {
        if(data.cellNumber > cells.length) {
          var err = new Error("Invalid cellNumber");
          err.code = Safebox.prefixError + "CH03";
          callback(err);
        } else {
          if(cells[data.cellNumber - 1].status && cells[data.cellNumber - 1].status !== 'assigned') {
            var err = new Error("Can not insert the safebox ( Cell is not assigned )");
            err.code = Safebox.prefixError + "CH04";
            callback(err);
          } else if(cells[data.cellNumber - 1].safeIds && cells[data.cellNumber - 1].safeIds.length > 0) {
            var err = new Error("Can not insert the safebox ( Cell is already have safebox )");
            err.code = Safebox.prefixError + "CH05";
            callback(err);
          } else {
            var safeTime = 0;
            if(!Safebox.app.models.Setting.configs['SAFE_COPPER_TIMER'] || !Safebox.app.models.Setting.configs['SAFE_SILVER_TIMER'] || !Safebox.app.models.Setting.configs['SAFE_GOLD_TIMER']) {
              var err = new Error("Please update settings");
              err.code = Safebox.prefixError + "CH06";
              return callback(err);
            }
            var createData = {
              storeId: storeId,
              cellNumber: data.cellNumber,
              safeTypeChoice: data.safeTypeChoice,
              safeTypeAvailable: data.safeTypeAvailable,
              safeTypeNext: data.safeTypeNext,
              safeStatus: data.safeStatus
            };
            if (data.safeTypeChoice !== SAFE_TYPE_NONE) {
              createData.safeTime = Safebox.getSafeTime(data.safeTypeChoice);
              createData.startDate = new Date();
              createData.totalDuration = createData.safeTime;

              if (typeof data.safeSaleCounter == 'undefined') {
                var err = new Error("safeSaleCounter is required if safeTypeChoice is not none");
                err.code = Safebox.prefixError + "CH07";
                return callback(err);
              }
            }
            Safebox.create(createData, function(err, instance) {
              if(err) {
                callback(err);
              } else {
                if(!("safeIds" in cells[data.cellNumber -1])) {
                  cells[data.cellNumber -1].safeIds = [];
                }

                if (typeof data.safeSaleCounter != 'undefined' && data.safeTypeChoice !== SAFE_TYPE_NONE) {
                  cells[data.cellNumber -1].safeSaleCounter = data.safeSaleCounter;
                }
                cells[data.cellNumber -1].safeIds.push(instance.id.toString());
                callback(null, instance);
              }
            })
          }
        }
      },
      function(callback) {
        Safebox.app.models.Store.update({id: storeId}, {cells: cells}, function(err, instance) {
          if(err || !instance) {
            callback(err);
          } else {
            callback(null);
          }
        })
      }
    ],
    function(err, results) {
      if(err) {
        next(err);
      } else {
        next(null, results[1]);
      }
    });
  }

  Safebox.stateUpdateValidate1 = function(safeItem) {
    var errors = [];
    var error;

    var ObjectID  = Safebox.getDataSource().ObjectID;
    var fields = ["id", "safeStatus"];
    var missingFields = Safebox.validateRequiredFields(fields, safeItem);
    if(missingFields.length > 0) {
      error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      error.field = missingFields.join(', ');
      error.statusCode = 400;
      errors.push(error);
    }

    if(typeof safeItem.id !== 'string' || !ObjectID.isValid(safeItem.id)) {
      error = new Error("Invalid safeBox id");
      error.code = "INVALID_PARAMETER";
      error.field = 'id';
      errors.push(error);
    }
    if(typeof safeItem.safeTime !== 'undefined' && (!validator.isInt(safeItem.safeTime) || safeItem.safeTime < 0)) {
      error = new Error("Invalid safeTime");
      error.code = "INVALID_PARAMETER";
      error.field = 'safeTime';
      errors.push(error);
    }
    if(safeItem.safeSaleCounter && (!validator.isFloat(safeItem.safeSaleCounter) || safeItem.safeSaleCounter < 0)) {
      error = new Error("Invalid safeSaleCounter");
      error.code = "INVALID_PARAMETER";
      error.field = "safeSaleCounter";
      errors.push(error);
    }
    if(SAFE_STATUS.indexOf(safeItem.safeStatus) == -1 || typeof safeItem.safeStatus !== 'string') {
      error = new Error("Invalid safeStatus");
      error.code = "INVALID_PARAMETER";
      error.field = 'safeStatus';
      errors.push(error);
    }

    return errors;
  };

  Safebox.stateUpdateValidate2 = function(safeItem, foundSafe, storeId) {
    var errors = [];
    var error;

    if (foundSafe.safeStatus !== SAFE_STATUS_ONGOING_TIMER) {
      fields = ["safeTypeChoice", "safeTypeAvailable", "safeTypeNext"];
      missingFields = Safebox.validateRequiredFields(fields, safeItem);
      if(missingFields.length > 0) {
        error = new Error("Missing parameters");
        error.code = "MISSING_PARAMETER";
        error.field = missingFields.join(', ');
        error.statusCode = 400;
        errors.push(error);
      }

      fields = ["safeTypeChoice", "safeTypeAvailable", "safeTypeNext"];
      var errorFields = Safebox.validateSafeTypes(fields, safeItem);
      if (errorFields.length > 0) {
        error = new Error("Invalid parameters");
        error.code = "INVALID_PARAMETER";
        error.field = errorFields.toString();
        errors.push(error);
      }
    }

    if(foundSafe.storeId.toString() !== storeId) {
      error = new Error("Safebox is not belong to current user's store");
      error.code = Safebox.prefixError + "SU02";
      errors.push(error);
    }

    var flagChoosingSafe = (foundSafe.safeTypeChoice === SAFE_TYPE_NONE && safeItem.safeTypeChoice !== SAFE_TYPE_NONE);
    if (flagChoosingSafe) {
      if (typeof safeItem.safeSaleCounter == 'undefined') {
        error = new Error("Missing parameter: safeSaleCounter due to choosing a safe box.");
        error.code = "MISSING_PARAMETER";
        error.field = 'safeSaleCounter';
        errors.push(error);
      }
      if (foundSafe.safeTypeAvailable !== safeItem.safeTypeChoice) {
        error = new Error("Safe type choice is not available. Available safe type is " + foundSafe.safeTypeAvailable + " now.");
        error.code = "INVALID_PARAMETER";
        error.field = 'safeTypeChoice';
        errors.push(error);
      }
    }

    return errors;
  };

  Safebox._getUpdateDateSafe = function(inputSafe, foundSafe, flagChoosingSafe) {
    var now = new Date();
    var updateData = {
      safeStatus: inputSafe.safeStatus,
      safeTypeChoice: foundSafe.safeTypeChoice === SAFE_TYPE_NONE ? inputSafe.safeTypeChoice : foundSafe.safeTypeChoice,
      safeTypeAvailable: inputSafe.safeTypeAvailable,
      safeTypeNext: inputSafe.safeTypeNext,
      lastUpdate: now,
      modified: now
    };

    if (foundSafe.safeTypeChoice !== SAFE_TYPE_NONE && foundSafe.safeStatus === SAFE_STATUS_ONGOING_TIMER) {
      delete updateData.safeTypeChoice;
      delete updateData.safeTypeAvailable;
      delete updateData.safeTypeNext;
    }

    if (typeof inputSafe.safeTime !== 'undefined') {
      updateData.safeTime = inputSafe.safeTime;
    }

    if (flagChoosingSafe) {
      updateData.safeTime = Safebox.getSafeTime(inputSafe.safeTypeChoice);
      updateData.startDate = now;
      updateData.totalDuration = updateData.safeTime;
    }

    return updateData;
  };
  Safebox.stateUpdate = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var errors = Safebox.stateUpdateValidate1(data);
    if (errors.length > 0) {
      return next(errors.pop());
    }

    Safebox.findById(data.id, function(err, found) {
      if(err || !found) {
        if (!err) {
          err = new Error("Safebox not found");
          err.code = Safebox.prefixError + "SU01";
        }
        return next(err);
      } else {
        errors = Safebox.stateUpdateValidate2(data, found, storeId);
        if (errors.length > 0) {
          return next(errors.pop());
        }

        var flagChoosingSafe = (found.safeTypeChoice === SAFE_TYPE_NONE && data.safeTypeChoice !== SAFE_TYPE_NONE);
        async.parallel([
          function(async_cb) {
            var updateData = Safebox._getUpdateDateSafe(data, found, flagChoosingSafe);

            found.updateAttributes(updateData, function(err, instance) {
              if(err || !instance) {
                if (!instance) {
                  err = new Error("Safebox not found");
                  err.code = Safebox.prefixError + "SU03";
                }
                async_cb(err);
              } else {

                async_cb(null, instance);
              }
            });
          },
          function(async_cb) {
            if (flagChoosingSafe && typeof data.safeSaleCounter != 'undefined') {
              var StoreCollection = Safebox.getDataSource().connector.collection(Safebox.app.models.Store.modelName);
              var cellIndex = "cells." + (found.cellNumber - 1) + ".safeSaleCounter";
              var updateData = {"$set": {}};
              updateData["$set"][cellIndex] = data.safeSaleCounter;

              StoreCollection.update({"_id": found.storeId}, updateData, function(err, res) {
                if (err) {
                  return async_cb(err);
                }
                async_cb();
              });
            }
            else {
              async_cb();
            }
          }
        ], function(err, res) {
          if (err) {
            return next(err);
          }
          next(null, res[0]);
        });
      }
    })
  };

  // Multiple update stateStatus.
  Safebox.updateMultipleSafeStatus = function(data, ctx, next) {
    var error;
    if (!ctx.user) {
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!Array.isArray(data) || data.length === 0) {
      error = new Error("Invalid parameters: input body must be an Array.");
      error.code = "INVALID_PARAMETER";
      return next(error);
    }

    var errors;
    var storeId = ctx.user.storeId;
    var safeIds = [];
    var safeInput = {};
    var responses = [];
    for (var i = 0; i < data.length; i++) {
      errors = Safebox.stateUpdateValidate1(data[i]);
      var res = {"id": data[i].id, "status": 0, "errors": errors};
      if (errors.length === 0) {
        res.status = 1;
        safeIds.push(data[i].id);
        safeInput[data[i].id] = data[i];
        safeInput[data[i].id].resIdx = responses.length;
      }
      responses.push(res);
    }

    if (safeIds.length === 0) {
      return next(null, responses);
    }

    var preResponse = function(data, storeUpdateSafeCellCounter, storeId, next) {
      // Remove error.stack.
      for (var i = 0; i < data.length; i++) {
        if (data[i].errors && data[i].errors.length === 0) {
          continue;
        }
        for (var j = 0; j < data[i].errors.length; j++) {
          if (data[i].errors[j].stack) {
            delete data[i].errors[j].stack;
          }
        }
      }

      if (!storeUpdateSafeCellCounter.isUpdated) {
        return next(null, data);
      }

      delete storeUpdateSafeCellCounter.isUpdated;
      var StoreCollection = Safebox.getDataSource().connector.collection(Safebox.app.models.Store.modelName);
      StoreCollection.update({"_id": storeId}, storeUpdateSafeCellCounter, function(err, res) {
        return next(null, data);
      });
    };

    var notFoundSafeIds = clone(safeIds);
    Safebox.find({
      "where": { "id": {"inq": safeIds} }
    }, function(err, foundSafes) {
      if (err) {
        return next(err);
      }
      if (foundSafes.length === 0) {
        error = new Error("All safeboxes are not found.");
        error.code = Safebox.prefixError + "UM01";
        return next(error);
      }

      // Some safeId is not found.
      var updateSafeCellCounters = {"$set": {}, "isUpdated": false};
      for (var i = 0; i < foundSafes.length; i++) {
        var safeItem = foundSafes[i];
        var inputSafe = safeInput[safeItem.id] || {};

        var idx = notFoundSafeIds.indexOf(inputSafe.id);
        if (idx > -1) {
          notFoundSafeIds.splice(idx, 1);
        }
        errors = Safebox.stateUpdateValidate2(inputSafe, safeItem, storeId);
        if (errors.length > 0) {
          responses[inputSafe.resIdx].status = 0;
          responses[inputSafe.resIdx].errors = errors;
          continue;
        }

        var flagChoosingSafe = (safeItem.safeTypeChoice === SAFE_TYPE_NONE && inputSafe.safeTypeChoice !== SAFE_TYPE_NONE);
        if (flagChoosingSafe && typeof inputSafe.safeSaleCounter != 'undefined') {
          updateSafeCellCounters.isUpdated = true;

          var cellIndex = "cells." + (safeItem.cellNumber - 1) + ".safeSaleCounter";
          updateSafeCellCounters["$set"][cellIndex] = data.safeSaleCounter;
        }
      }

      if (notFoundSafeIds.length > 0) {
        for (var i = 0; i < notFoundSafeIds.length; i++) {
          var safeId = notFoundSafeIds[i];
          var inputSafe = safeInput[safeId] || {};

          error = new Error("The safe is not found.");
          error.code = Safebox.prefixError + "UM02";
          responses[inputSafe.resIdx].status = 0;
          responses[inputSafe.resIdx].errors = [];
          responses[inputSafe.resIdx].errors.push(error);
        }
      }

      var updateCounter = 0;
      var flag = true;
      for (var i = 0; i < foundSafes.length; i++) {
        var safeItem = foundSafes[i];
        var inputSafe = safeInput[safeItem.id] || {};

        responses[inputSafe.resIdx].data = {};
        if (responses[inputSafe.resIdx].status === 0) {
          updateCounter++;
          continue;
        }

        flag = false;
        var flagChoosingSafe = (safeItem.safeTypeChoice === SAFE_TYPE_NONE && inputSafe.safeTypeChoice !== SAFE_TYPE_NONE);
        var updateData = Safebox._getUpdateDateSafe(inputSafe, safeItem, flagChoosingSafe);

        safeItem.updateAttributes(updateData, function(err, updatedSafe) {
          updateCounter++;

          var _inputSafe = safeInput[updatedSafe.id] || {};
          if (err) {
            responses[_inputSafe.resIdx].status = 0;
            responses[_inputSafe.resIdx].errors = [];
            responses[_inputSafe.resIdx].errors.push(err);
          }
          else {
            responses[_inputSafe.resIdx].data = updatedSafe;
          }

          if (updateCounter >= foundSafes.length) {
            return preResponse(responses, updateSafeCellCounters, storeId, next);
          }
        });
      }

      if (flag) {
        next(null, responses);
      }
    });
  };

  Safebox.collect = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var fields = ["id", "useBooster", "rewardGift"];
    var missingFields = Safebox.validateRequiredFields(fields, data);
    if(missingFields.length > 0) {
      var error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      error.field = missingFields.join(', ');
      error.statusCode = 400;
      return next(error);
    }

    if(typeof data.id !== 'string') {
      var error = new Error("Invalid Id");
      error.code = "INVALID_PARAMETER";
      error.field= "id";
      return next(error);
    }
    if(typeof data.rewardGift !== 'string'){
      var error = new Error("Invalid rewardGift");
      error.code = "INVALID_PARAMETER";
      error.field= "rewardGift";
      return next(error);
    }
    var VALID_REWARD_GIFT = ['booster_small_gift', 'booster_big_gift', 'booster_giant_gift'];
    if(!validator.isInt(data.useBooster) || (data.useBooster !== 0 && data.useBooster !== 1)) {
      var error = new Error("Invalid useBooster");
      error.code = "INVALID_PARAMETER";
      error.field= "useBooster";
      return next(error);
    }
    if(VALID_REWARD_GIFT.indexOf(data.rewardGift) == -1) {
      var error = new Error("Invalid rewardGift");
      error.code = "INVALID_PARAMETER";
      error.field= "rewardGift";
      return next(error);
    }
    async.parallel([
      function(callback) {
        Safebox.findById(data.id, function(err, safebox) {
          if(err || !safebox) {
            var error = new Error("Safebox not found");
            error.code = Safebox.prefixError+"C0O1";
            return callback(error);
          } else {
            if(safebox.storeId.toString() !== storeId) {
              var error = new Error("Safebox is not belongs to current user's store.");
              error.code = Safebox.prefixError+"C0O2";
              return callback(error);
            }
            else if (safebox.safeTypeChoice === SAFE_TYPE_NONE) {
              var error = new Error("Safebox choice is none.");
              error.code = Safebox.prefixError + "C0O21";
              return callback(error);
            }
            else if (safebox.safeStatus !== SAFE_STATUS_ONGOING_TIMER && data.useBooster == 1) {
              var error = new Error("Safebox timer is not on going now. Can not use booster to collect.");
              error.code = Safebox.prefixError + "C0O22";
              return callback(error);
            }
            else {
              callback(null, safebox);
            }
          }
        })
      },
      function(callback) {
        Safebox.app.models.MemberBooster.findOne({
          where: {
            memberId: userInfo.id.toString(),
            boosterKey: "booster_store_key"
          }
        }, function(err, found) {
          if(err || !found) {
            var error = new Error("User does not have any booster store key");
            error.code = Safebox.prefixError+"C0O3";
            callback(error);
          } else {
            callback(null, found);
          }
        })
      },
      function(callback) {
        Safebox.app.models.Store.findById(storeId, callback);
      }
    ], function(err, results) {
      if(err) {
        next(err);
      } else {
        var noOfkey = results[1].number;
        var safeStatus = results[0].safeStatus;
        var cellNumber = results[0].cellNumber;
        var id = results[0].id.toString();
        var store = results[2];
        var storeCells = store.cells;
        var safeIds =  storeCells[cellNumber - 1].safeIds;
        if(data.useBooster == 1 && noOfkey > 0) {
          results[1].updateAttributes({
            number: noOfkey - 1
          }, function(err, instance) {
            if(err || !instance) {
              return next(err);
            }
          })
        } else {
          if(safeStatus !== SAFE_STATUS_COLLECTABLE) {
            var error = new Error("Can't collect safebox");
            error.code = Safebox.prefixError+"CO04";
            return next(error);
          }
        }
        async.parallel([
          function(cb) {
            var instance = null;
            var created = true;
            async.series([
              function(callback) {
                Safebox.app.models.MemberBooster.findOrCreate({
                  where: {
                    memberId: userInfo.id.toString(),
                    boosterKey: data.rewardGift
                  }
                }, {
                  memberId: userInfo.id.toString(),
                  boosterKey: data.rewardGift,
                  number: 1
                }, function(err, instance, created) {
                  if(err) {
                    callback(err);
                  } else {
                    var obj = {
                      "instance": instance,
                      "created": created
                    }
                    callback(null, obj);
                  }
                })
              }
            ], function(err, results) {
              if(err) {
                cb(err);
              } else {
                var created = results[0].created;
                var instance = results[0].instance;
                if(created === true) {
                  cb(null, instance);
                } else {
                  instance.updateAttributes({
                    number: instance.number +1
                  }, function(err, instance) {
                    if(err) {
                      cb(err);
                    } else {
                      cb(null, instance);
                    }
                  });
                }
              }
            });
          },
          function(cb) {
            if(safeIds !== undefined && safeIds.indexOf(id) > -1) {
              safeIds.splice(safeIds.indexOf(id),1);
            }
            storeCells[cellNumber - 1].safeSaleCounter = 0;
            store.updateAttributes({cells: storeCells}, cb);
          },
          function(cb) {
            Safebox.deleteById(id, cb);
          }
        ], function(err, results) {
          if(err) {
            next(err);
          } else {
            next(null, {
              "boosterKey": data.rewardGift,
              "number": results[0].number
            });
          }
        });
      }
    });
  };

  // Check perrmission and remove safebox out of store.
  Safebox.beforeRemote('deleteById', function(ctx, instance, next) {
    Safebox.app.models.Member.getCurrentUser(ctx, function(err, userInfo) {
      if (err) {
        return next(err);
      }
      var safeId = ctx.req.remotingContext.args.id || '';

      Safebox.findById(safeId, function(err, foundSafe) {
        if (err) {
          return next(err);
        }

        if (!foundSafe) {
          var error = new Error("Safebox is not found");
          error.code = Safebox.prefixError+"DB02";
          return next(error);
        }

        // Only allow ADMIN and owner delete safebox by ID.
        var isNotAdmin = (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1);
        if (isNotAdmin && foundSafe.storeId != userInfo.storeId) {
          var error = new Error("Permission denied.");
          error.code = Safebox.prefixError + "DB01";
          return next(error);
        }

        // Remove safeId out of store.
        var StoreCollection = Safebox.getDataSource().connector.collection(Safebox.app.models.Store.modelName);
        var cellIndex = "cells." + (foundSafe.cellNumber - 1) + ".safeIds";
        var updateData = {"$pull": {}};
        updateData["$pull"][cellIndex] = foundSafe.id.toString();

        StoreCollection.update({"_id": foundSafe.storeId}, updateData, function(err, res) {
          if (err) {
            return next(err);
          }

          next();
        });
      });
    });
  });

  Safebox.setup = function() {
    Safebox.disableRemoteMethod('create',true);
    Safebox.disableRemoteMethod('upsert',true);
    Safebox.disableRemoteMethod('createChangeStream',true);
    Safebox.disableRemoteMethod('exists',true);
    Safebox.disableRemoteMethod('findOne',true);
    Safebox.disableRemoteMethod('updateAll',true);
    Safebox.disableRemoteMethod('__get__store', false);
    Safebox.disableRemoteMethod('updateAttributes', false);
    Safebox.disableRemoteMethod('replaceById', true);
    Safebox.disableRemoteMethod('replaceOrCreate', true);
    Safebox.disableRemoteMethod('upsertWithWhere', true);

    function validateLastUpdate(cb) {
      if (typeof this.lastUpdate !== 'undefined') {
        if (!validator.isDate(this.lastUpdate)) {
          cb();
        }
      }
    }
    Safebox.validate('lastUpdate', validateLastUpdate, {message: 'Invalid lastUpdate'});

    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        if (!validator.isDate(this.created)) {
          cb();
        }
      }
    }
    Safebox.validate('created', validateCreated, {message: 'Invalid created'});

    function validateModified(cb) {
      if (typeof this.modified !== 'undefined') {
        if (!validator.isDate(this.modified)) {
          cb();
        }
      }
    }
    Safebox.validate('modified', validateModified, {message: 'Invalid modified'});

    function validateStoreId(cb_err, done) {
      var self = this;
      if(typeof self.storeId !== 'undefined' && self.storeId) {
        Safebox.app.models.Store.exists(self.storeId, function(err, exists) {
          if(err || !exists) {
            cb_err(new Error('Invalid storeId: store is not exists'));
          }
          done();
        });
      } else {
        done();
      }
    }
    Safebox.validateAsync('storeId', validateStoreId, {message: 'Invalid storeId'});

    function validateCellNumber(err) {
      if(typeof this.cellNumber !== 'undefined' && this.cellNumber) {
        if(!validator.isInt(this.cellNumber)) {
          err();
        } else {
          if(this.cellNumber < 1 || this.cellNumber > 50) {
            err();
          }
        }
      }
    }
    Safebox.validate('cellNumber', validateCellNumber, {message: 'Invalid cellNumber'});

    function validateSafeTypeChoice(err) {
      if(typeof this.safeTypeChoice !== 'undefined' && this.safeTypeChoice) {
        if(SAFE_TYPE.indexOf(this.safeTypeChoice) == -1) {
          err();
        }
      }
    }
    Safebox.validate('safeTypeChoice', validateSafeTypeChoice, {message: 'Invalid safeTypeChoice'});

    function validateSafeTypeAvailable(err) {
      if(typeof this.safeTypeAvailable !== 'undefined' && this.safeTypeAvailable) {
        if(SAFE_TYPE.indexOf(this.safeTypeAvailable) == -1) {
          err();
        }
      }
    }
    Safebox.validate('safeTypeAvailable', validateSafeTypeAvailable, {message: 'Invalid safeTypeAvailable'});

    function validateSafeTypeNext(err) {
      if(typeof this.safeTypeNext !== 'undefined' && this.safeTypeNext) {
        if(SAFE_TYPE.indexOf(this.safeTypeNext) == -1) {
          err();
        }
      }
    }
    Safebox.validate('safeTypeNext', validateSafeTypeNext, {message: 'Invalid safeTypeNext'});

    function validateSafeStatus(err) {
      if(typeof this.safeStatus !== 'undefined' && this.safeStatus) {
        if(SAFE_STATUS.indexOf(this.safeStatus) == -1) {
          err();
        }
      }
    }
    Safebox.validate('safeStatus', validateSafeStatus, {message: 'Invalid safeStatus'});
  }

  Safebox.remoteMethod(
    'choice',
    {
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', root: true,
          description: 'Safebox object', required: true,
          http: {source: 'body'}
        }
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Insert a safebox that player selected.',
      http: {verb: 'post', path: '/choice'},
      returns: {arg: 'data', type: 'object', root: true},
    }
  );

  Safebox.remoteMethod(
    'stateUpdate',
    {
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', root: true,
          description: 'Input object', required: true,
          http: {source: 'body'}
        }
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Update safeTime and safeStatus into safebox.',
      http: {verb: 'post', path: '/stateUpdate'},
      returns: {arg: 'data', type: 'object', root: true},
    }
  );
  Safebox.remoteMethod(
    'updateMultipleSafeStatus',
    {
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', root: true,
          description: 'Input object', required: true,
          http: {source: 'body'}
        }
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Update multiple Safe status.',
      http: {verb: 'post', path: '/updateMultipleSafeStatus'},
      returns: {arg: 'data', type: 'object', root: true},
    }
  );

  Safebox.remoteMethod(
    'collect',
    {
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', root: true,
          description: 'Input object', required: true,
          http: {source: 'body'}
        },
        { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Collect safebox.',
      http: {verb: 'post', path: '/collect'},
      returns: {arg: 'data', type: 'object', root: true},
    }
  );

  Safebox.setup();
};
