        var validator = require('validator')
        , async = require('async')
        , util = require('util');
        require('date-utils');

        LOCATION_STAFF_ROOM = 'staff_room';
        LOCATION_IN_CELL = 'in_cell';
        LOCATION = [LOCATION_STAFF_ROOM, LOCATION_IN_CELL];

        module.exports = function(Staff) {
          Staff.prefixError = "STA_";
          Staff.definition.rawProperties.storeId.default =
            Staff.definition.properties.storeId.default = function() {
            return null;
          };

          Staff.definition.rawProperties.status.default =
            Staff.definition.properties.status.default = function() {
            return  [
              {
                "endurance": "",
                "location" : null,
                "location3D" : null,
                "toProcess" : false,
                "level" : 1,
                "hearts" : 0,
                "cellAssignment" : 1,
                "sales" : 0
              }
            ];
          };

          Staff.definition.rawProperties['string3D'].default =
            Staff.definition.properties['string3D'].default = function() {
            return null;
          };

          // Workaround for https://github.com/strongloop/loopback/issues/292
          Staff.definition.rawProperties.boltModifierActivate.default =
            Staff.definition.properties.boltModifierActivate.default = function() {
            return false;
          };

          Staff.definition.rawProperties.created.default =
            Staff.definition.properties.created.default = function() {
            return new Date();
          };

          // Workaround for https://github.com/strongloop/loopback/issues/292
          Staff.definition.rawProperties.modified.default =
            Staff.definition.properties.modified.default = function() {
            return new Date();
          };

          Staff.observe('before save', function(ctx, next) {
            if (ctx.instance) {
              ctx.instance.modified = new Date();
            } else {
              ctx.data.modified = new Date();
            }
            next();
          });

          Staff.prototype.save = function(data, next)
          {
            var model = this;
            async.series([
              function(ass_1) {
                if(data.validator) {
                  model.isValid(function(valid) {
                    var err = null;
                    if (!valid) {
                      err = new Error('Invalid parameters');
                      err.code = 'MISSING_PARAMETER';
                      err.statusCode = 400;
                      err.detail = model.errors;
                    }
                    ass_1(err);
                  });
                } else {
                  ass_1();
                }
              }
            ], function(err, res) {
              if(err) {
                next(err);
              } else {
                var dataSet = data.set;
                var dataInc = data.inc;
                var options = { new: true, upsert: false };

                if (typeof dataSet === 'undefined') {
                  dataSet = clone(model.__data);
                  if (typeof dataInc !== 'undefined') {
                    for(property in dataSet) {
                      if (typeof dataInc[property] !== 'undefined') {
                        delete dataSet[property];
                      }
                    }
                  }
                  dataSet.modified = new Date();
                  delete dataSet['id'];
                }

                if (typeof data.new !== 'undefined') {
                  options['new'] = data.new;
                }

                if (typeof data.upsert !== 'undefined') {
                  options['upsert'] = data.upsert;
                }

                var whereCondition = { _id: model.id };
                var updateValue    = { $set: dataSet };
                if (typeof dataInc !== 'undefined') {
                  updateValue['$inc'] = dataInc;
                }
                var sortOrder  = [['_id','asc']];
                var collection = SVBaseModel.getDataSource().connector.collection(model.modelName);
                collection.findAndModify(
                  whereCondition,
                  sortOrder,
                  updateValue,
                  options,
                  function(err, result) {
                    if (err) {
                      next(err);
                    } else if (!result.value) {
                      var error = new Error('Invalid update process');
                      error.code = Staff.prefixError + "SAVE01";
                      next(error);
                    } else {
                      model.__data = result.value;
                      next();
                    }
                  }
                );
              }
            });
          };
          Staff.find= function(err,cb){
            if (cb){
              var start = new Date().getTime();
              console.log(start);
            }
             }
          // #### Remote functions start ####
          Staff.updateStatus = function(id, data, ctx, next) {
            if(ctx.user){
              var userInfo = ctx.user;
            } else {
              var error = new Error("Illegal request");
              error.code = "BAD_REQUEST";
              return next(error);
            }

            if (typeof data.status !== 'undefined') {
            
              if(typeof data.status !== 'object') return next(new Error("Status is invalid"));
              Staff.findById(id, function(err, foundStaff) {
                if(err) {
                  next(err);
                } else if(!foundStaff) {
                  var error = new Error("Staff not found");
                  error.code = Staff.prefixError + "UPS01";
                  next(error);
                } else if(foundStaff.storeId.toString() !== userInfo.storeId.toString()) {
                 
                  var error = new Error("Permission denied. Can not update staff of the other player.");
                
               
                
                  error.code = Staff.prefixError + "UPS02";
                  next(error);
                } else {
                  // Prevent update cellAssignment in a staff.
                  if (foundStaff.status.cellAssignment) {
                    data.status.cellAssignment = foundStaff.status.cellAssignment;
                  }

                  foundStaff.status = data.status;
                  foundStaff.save({ validate: true }, next);
                }
              });
            } else {
              var error = new Error("Status is required");
              error.code = "MISSING_PARAMETER";
              error.field = "status";
              next(error);
            }
          };
          // #### Remote functions end ####

          Staff.swapBetweenCells = function(data, ctx, next) {
            if(ctx.user){
              var userInfo = ctx.user;
            } else {
              var error = new Error("Illegal request");
              error.code = "BAD_REQUEST";
              return next(error);
            }

            if (typeof data.cell1 == 'undefined' || typeof data.cell2 == 'undefined') {
              var err = new Error('Invalid parameters');
              err.code = 'MISSING_PARAMETER';
              err.field = "cell1, cell2";
              err.statusCode = 400;
              return next(err);
            }
            if(!validator.isInt(data.cell1)) {
              var err = new Error('Invalid Cell1');
              err.code = 'MISSING_PARAMETER';
              err.field = "cell1";
              err.statusCode = 400;
              return next(err);
            }
            if(!validator.isInt(data.cell2)) {
              var err = new Error('Invalid Cell2');
              err.code = 'MISSING_PARAMETER';
              err.field = "cell2";
              err.statusCode = 400;

              return next(err);
            }

            userInfo.getStore(function(error, userStore) {
              if (error) {
                return next(error);
              }
              var cell1 = userStore.cells[data.cell1 - 1] || null;
              var cell2 = userStore.cells[data.cell2 - 1] || null;
              console.log(userStore.cells[data.cell1 - 1 ]);
              console.log(userStore.cells[data.cell2 - 1 ]);
              var errMsg = '';
              if (cell1 === null) {
                errMsg = "Cell " + data.cell1 + " is not exists";
              }
              if (cell2 === null) {
                errMsg = "Cell " + data.cell2 + " is not exists";
              }

              if (errMsg !== '') {
                var error = new Error(errMsg);
                error.code = Staff.prefixError + "SWAP01";
                return next(error);
              }

              Staff.find({
                "where": {
                  "id": {
                    "inq": [cell1.staffId, cell2.staffId]
                  }
                }
              }, function(err, staffs) {
                if (err) {
                  return next(err);
                }
                if (staffs.length < 2) {
                  var error = new Error("Some staff is not exists.");
                  error.code = Staff.prefixError + "SWAP02";
                  return next(error);
                }
                var cellAssignment1 = staffs[0].status.cellAssignment;
                var cellAssignment2 = staffs[1].status.cellAssignment;
                async.parallel([
                  function(callback) {
                    // Update staff 0
                    var staffStatus = staffs[0].status;
                    staffStatus.cellAssignment = cellAssignment2;
                    staffs[0].updateAttributes({"status": staffStatus}, function(err, updatedStaff) {
                      if (err) {
                        return callback(err);
                      }
                      callback(null, updatedStaff);
                    });
                  },
                  function(callback) {
                    // Update staff 1
                    var staffStatus = staffs[1].status;
                    staffStatus.cellAssignment = cellAssignment1;
                    staffs[1].updateAttributes({"status": staffStatus}, function(err, updatedStaff) {
                      if (err) {
                        return callback(err);
                      }
                      callback(null, updatedStaff);
                    });
                  },
            
                  function(callback) {
                    // Swap staffId in 2 cells and update store.
                    var cells = userStore.cells;
                    var staffId1 = cell1.staffId;
                    cells[cell1.number - 1].staffId = cell2.staffId;
                    cells[cell2.number - 1].staffId = staffId1;
                    userStore.updateAttributes({"cells": cells}, function(err, updatedStore) {
                      if (err) {
                        return callback(err);
                      }
                      callback(null, updatedStore);
                    });
                  }
                ], function(error, results) {
                  if (error) {
                    return next(error);
                  }

                  next(null, [results[2].cells[data.cell1 - 1], results[2].cells[data.cell2 - 1]]);
                });
              });
            });
          };

          Staff.setup = function() {
            Staff.disableRemoteMethod('upsert', true);
            Staff.disableRemoteMethod('upsertWithWhere', true);
            Staff.disableRemoteMethod('replaceOrCreate', true);
            Staff.disableRemoteMethod('replaceById', true);
            Staff.disableRemoteMethod('deleteById', true);
            Staff.disableRemoteMethod('create', true);
            Staff.disableRemoteMethod('exists', true);
            Staff.disableRemoteMethod('count', true);
            Staff.disableRemoteMethod('findOne', true);
            Staff.disableRemoteMethod('updateAll', true);
            Staff.disableRemoteMethod('updateAttributes', false);
            Staff.disableRemoteMethod('createChangeStream', true);
            Staff.disableRemoteMethod('__get__store', false);
            // Staff.disableRemoteMethod('find', true);
            // check if name is valid
            function validateName(cb_err) {
              if (typeof this.name !== 'undefined') {
                if (!validator.isLength(validator.trim(this.name), 1, 100)) {
                  cb_err();
                }
              }
            }
            Staff.validate('name', validateName, {message: 'Invalid name'});

            // Validate storeId
            // function validateStoreId(cb_err, done) {
            //   var self = this;
            //   if(typeof self.storeId !== 'undefined' && self.storeId) {
            //     Staff.app.models.Member.getUserInfoOfCurrentContext(function(err, userInfo) {
            //       if(err) {
            //         cb_err(err);
            //         done();
            //       } else {
            //         if(!self.storeId.equals(userInfo.storeId)) {
            //           cb_err(err);
            //         }
            //         done();
            //       }
            //     });
            //   } else {
            //     done();
            //   }
            // }
            // Staff.validateAsync('storeId', validateStoreId, {message: 'Invalid storeId'});

            // Validate status
            function validateStatus(cb_err) {
              if (typeof this.status === 'object') {
                if (typeof this.status.endurance == 'undefined') {
                  cb_err('Missing parameters: endurance');
                } else if (typeof this.status.location == 'undefined') {
                  cb_err('Missing parameters: location');
                } else if (!validator.isIn(this.status.location, LOCATION)) {
                  cb_err('Invalid parameters: location');
                } else if (typeof this.status['location3D'] == 'undefined') {
                  cb_err('Missing parameters: location3D');
                } else if (!validator.isIn(this.status['location3D'], LOCATION)) {
                  cb_err('Invalid parameters: location3D');
                } else if (typeof this.status['toProcess'] == 'undefined') {
                  cb_err('Missing parameters: toProcess');
                } else if (typeof this.status['hearts'] == 'undefined') {
                  cb_err('Missing parameters: hearts');
                } else if (typeof this.status['cellAssignment'] == 'undefined') {
                  cb_err('Missing parameters: cellAssignment');
                } else if (typeof this.status['sales'] == 'undefined') {
                  cb_err('Missing parameters: sales');
                } else {
                  var storeMaxLevel = Staff.app.models.Setting.configs['STORE_MAX_LEVEL'];
                  var storeMaxHearts = Staff.app.models.Setting.configs['STAFF_MAX_HEARTS'];
                  var storeMaxCellAssignment = Staff.app.models.Setting.configs['CELL_ASSIGNMENT_MAX'];
                  if (!validator.isInt(this.status['level']) || this.status['level'] < 1 || this.status['level'] > storeMaxLevel) {
                    cb_err('Invalid level');
                  } else if (!validator.isInt(this.status['hearts']) || this.status['hearts'] < 0 || this.status['hearts'] > storeMaxHearts) {
                    cb_err('Number of hearts is invalid');
                  } else if (!validator.isInt(this.status['cellAssignment']) || this.status['cellAssignment'] < 1 || this.status['cellAssignment'] > storeMaxCellAssignment) {
                    cb_err('Invalid cellAssignment');
                  } else if (!validator.isFloat(this.status['endurance'])) {
                    cb_err('Invalid endurance');
                  }
                }
              } else {
                cb_err();
              }
            }
            Staff.validate('status', validateStatus, {message: 'Invalid status'});

            // check if created is valid
            function validateCreated(cb_err) {
              if (typeof this.created !== 'undefined') {
                if (!validator.isDate(this.created)) {
                  cb_err();
                }
              }
            }
            Staff.validate('created', validateCreated, {message: 'Invalid created'});

            // check if modified is valid
            function validateModified(cb_err) {
              if (typeof this.modified !== 'undefined') {
                if (!validator.isDate(this.modified)) {
                  cb_err();
                }
              }
            }
            Staff.validate('modified', validateModified, {message: 'Invalid modified'});

            // Update staff status
            Staff.remoteMethod(
              'updateStatus',
              {
                accessType: 'WRITE',
                accepts: [
                  {
                    arg: 'id', type: 'string', description: 'Model id', required: true
                  },
                  {
                    arg: 'data', type: 'object', root: true,
                    description: 'Update staff status', required: true,
                    http: {source: 'body'}
                  }
                  , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
                ],
                description: 'Update staff status',
                http: {verb: 'PUT', path: '/:id/update'},
                returns: {arg: 'data', type: 'any', root: true},
              }
            );
            Staff.remoteMethod(
              'swapBetweenCells',
              {
                accessType: 'WRITE',
                accepts: [
                  {
                    arg: 'data', type: 'object', root: true,
                    description: '{cell1: int, cell2: int}', required: true,
                    http: {source: 'body'}
                  }
                  , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
                ],
                description: 'Swap 2 staffs between 2 cells',
                http: {verb: 'PUT', path: '/swap'},
                returns: {arg: 'data', type: 'any', root: true},
              }
            );
          };

          Staff.setup();
        };

        // get all : 116ms