var validator = require('validator')
  , async = require('async')
  ;
require('date-utils');

CUSTOMER_TYPE_SPECIFIC = 'specific';
CUSTOMER_TYPE_IMPULSE = 'impulse';
CUSTOMER_TYPE_WINDOW = 'window';
CUSTOMER_TYPE_BIGSPENDER = 'bigspender';
CUSTOMER_TYPE_LEPRECHAUN = 'leprechaun';
CUSTOMER_TYPE_VIP = 'vip';
CUSTOMER_TYPE = [CUSTOMER_TYPE_SPECIFIC,CUSTOMER_TYPE_IMPULSE,CUSTOMER_TYPE_WINDOW,CUSTOMER_TYPE_BIGSPENDER,CUSTOMER_TYPE_LEPRECHAUN, CUSTOMER_TYPE_VIP];

CUSTOMER_CURRENT_STATUS_LOCATION_CELL_INLINE = 'cell_inline';
CUSTOMER_CURRENT_STATUS_LOCATION_STREET = 'street';
CUSTOMER_CURRENT_STATUS_LOCATION_CELL_ENGAGE = 'cell_engaged';
CUSTOMER_CURRENT_STATUS_LOCATION = [CUSTOMER_CURRENT_STATUS_LOCATION_STREET,CUSTOMER_CURRENT_STATUS_LOCATION_CELL_ENGAGE,CUSTOMER_CURRENT_STATUS_LOCATION_CELL_INLINE];

CUSTOMER_CURRENT_STATUS_CONDITION_NORMAL = 'normal';
CUSTOMER_CURRENT_STATUS_CONDITION_LEAVING = 'leaving';
CUSTOMER_CURRENT_STATUS_CONDITION_BUYING = 'buying';
CUSTOMER_CURRENT_STATUS_CONDITION_OUT = 'out';
CUSTOMER_CURRENT_STATUS_CONDITION = [CUSTOMER_CURRENT_STATUS_CONDITION_OUT,CUSTOMER_CURRENT_STATUS_CONDITION_BUYING,CUSTOMER_CURRENT_STATUS_CONDITION_LEAVING,CUSTOMER_CURRENT_STATUS_CONDITION_NORMAL];

module.exports = function(Customer) {
  Customer.prefixError = "CUS_";
  Customer.definition.rawProperties.customerStartsDate.default =
    Customer.definition.properties.customerStartsDate.default = function() {
      return new Date();
  };

  // Load current user.
  Customer.beforeRemote("**", function(ctx, ints, next) {
    Customer.app.models.Member.getCurrentUser(ctx, function(err, userInfo) {
      if (err) {
        return next(err);
      }

      next();
    });
  });

  Customer.createMultiple = function(data, ctx, next){
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!data.length) {
      error = new Error("Invalid parameters: input data is not correct");
      error.code = "INVALID_PARAMETER";
      error.field = "data";
      return next(error);
    }

    if(!storeId) {
      error = new Error("Store not found");
      error.code = Customer.prefixError + "CM02";
      return next(error);
    }

    var response = [];
    var count = 0;
    var brandId = [];
    var cellsLength = 0;
    var spawnLeprechaun = false;
    var spawningLimit = Customer.app.models.Setting.configs['CUSTOMER_CREATE_MULTIPLE_LIMIT'];
    if(data.length > spawningLimit) {
      var error = new Error("You can only create "+spawningLimit+" customers at the same time");
      error.code = Customer.prefixError + "CM01";
      return next(error);
    }

    var leprechaunLog = null;
    var LeprechaunHistory = Customer.app.models.LeprechaunHistory;
    Customer.app.models.Store.findById(storeId, function(err, foundStore) {
      if(err || !foundStore) {
        if(err) {
          return async_cb1(err);
        } else if(!foundStore) {
          error = new Error("Store not found");
          error.code = Customer.prefixError + "CM02";
          return async_cb1(error);
        }
      }

      var cellsLength = foundStore.cells.length;
      var customerIds = [];
      var leprechaunCustomers = [];
      for (var i = 0; i < data.length; i++) {
        var _customer = data[i];
        if(_customer.customerId && _customer.customerId !== '') {
          customerIds.push(_customer.customerId);
        }
      }
      async.each(data , function(customer, callback) {
        var error = [];
        count += 1;
        if (typeof customer !== 'object') {
          error.push("Customer object is invalid.");
          response.push({"errors": error,"status" : 0 });
          return callback();
        }

        if(typeof customer.customerId === 'undefined' || customer.customerId.trim() == ""){
          error.push("customerId is required");
        } else {
          if(countItems(customerIds, customer.customerId) > 1) {
            error.push("customerId is duplicated");
          }
        }

        if(typeof customer.customerType === 'undefined') {
          error.push("customerType is required");
        } else {
          if(CUSTOMER_TYPE.indexOf(customer.customerType) == -1) {
            error.push("customerType is invalid");
          }
          else if (customer.customerType == CUSTOMER_TYPE_BIGSPENDER) {
            if (!customer.customerProductsList || typeof customer.customerProductsList == 'undefined' || customer.customerProductsList.length < 1) {
              error.push("BigSpender is required customerProductsList values.");
            }
          }
          else if (customer.customerType !== CUSTOMER_TYPE_VIP && customer.customerType !== CUSTOMER_TYPE_LEPRECHAUN) {
            if (!customer.customerProduct || typeof customer.customerProduct == 'undefined') {
              error.push(customer.customerType + " is required customerProduct value.");
            }
          }
        }

        if(!customer.customerCurrentStatus || typeof customer.customerCurrentStatus !== 'object') {
          error.push("customerCurrentStatus is invalid");
        }
        else {
          if("linePosition" in customer.customerCurrentStatus) {
            if(customer.customerCurrentStatus.linePosition < 0 || customer.customerCurrentStatus.linePosition > 4) {
              error.push("linePosition is invalid");
            }
          }

          if("location" in customer.customerCurrentStatus && CUSTOMER_CURRENT_STATUS_LOCATION.indexOf(customer.customerCurrentStatus.location) == -1) {
            error.push("location is invalid");
          }

          if("mood" in customer.customerCurrentStatus && !validator.isFloat(customer.customerCurrentStatus.mood)) {
            error.push("mood is invalid");
          }

          if("condition" in customer.customerCurrentStatus) {
            if(CUSTOMER_CURRENT_STATUS_CONDITION.indexOf(customer.customerCurrentStatus.condition) == -1) {
              error.push("condition is invalid");
            }
          }
        }
        if("customerCellNumber" in customer && parseInt(customer.customerCellNumber) > cellsLength) {
          error.push("customerCellNumber is invalid");
        }

        if("customerProductsList" in customer && customer.customerProductsList.length > 5) {
          error.push("customerProductsList is invalid");
        }

        if("customerProductsListSize" in customer && !validator.isInt(customer.customerProductsListSize)) {
          error.push("customerProductsListSize is invalid");
        }

        if("customerMoodFactor" in customer && !validator.isFloat(customer.customerMoodFactor)) {
          error.push("customerMoodFactor is invalid");
        }
        if("customerBrand" in customer) {
          brandId.push(customer.customerBrand);
        }

        if(typeof customer.customerProduct !== 'undefined' && typeof customer.customerProductsList !== 'undefined') {
          error.push("customerProduct & customerProductsList can not coexist");
        }

        // Concurrent update lepre VARS.
        if (error.length === 0 && customer.customerType === CUSTOMER_TYPE_LEPRECHAUN) {
          // Log leprechaun log only once.
          if (leprechaunLog) {
            leprechaunCustomers.push(customer);

            response.push({"errors": error,"status" : 0 });
            return callback();
          }

          LeprechaunHistory.getLogByDate(function(err, log) {
            if (err) {
              error.push(err);
            } else {
              leprechaunCustomers.push(customer);
              leprechaunLog = log;
            }
            response.push({"errors": error,"status" : 0 });
            callback();
          });
        }
        else {
          response.push({"errors": error,"status" : 0 });
          callback();
        }
      }, function(err, results) {
        if(err) {
          return next(err);
        } else if (brandId.length === 0) {
          response.forEach(function(item) {
            item.errors.push("Brand empty");
          });

          return next(null, response);
        } else {
          async.parallel([
            function(async_cb) {
              Customer.app.models.Brand.find({"where": {id: {inq: brandId }}}, async_cb);
            },
            function(async_cb) {
              var maxLepre = leprechaunCustomers.length;
              if (maxLepre === 0) {
                return async_cb();
              }

              var lepreCustomers = [];
              var counter = 0;
              for (var i = 0; i < maxLepre; i++) {
                LeprechaunHistory.concurrentUpdateLepreVars(function(err, lepreVars) {
                  if (err) {
                    return async_cb(err);
                  }

                  lepreCustomers.push(lepreVars);
                  if (++counter >= maxLepre) {
                    return async_cb(null, lepreCustomers);
                  }
                });
              }
            }
          ], function(err, results) {
            if(err) {
              return next(err);
            }

            var brand = results[0];
            var leprechaunVars = results[1] || [];
            var brandString = JSON.stringify(brand);
            for (var i = 0; i < response.length; i++) {
              if(brandId[i] == '' || brandString.indexOf(brandId[i]) == -1) {
                response[i].errors.push("Brand not found");
              }
            }

            var lepreSpawnedLevels = [];
            var CustomerList = [];
            var objectUpdate = {
              "total_spawned_customers": 0,
              "customer_specific" : 0,
              "customer_impulse" : 0,
              "customer_window" : 0,
              "customer_bigspender" : 0,
              "customer_leprechaun" : 0,
              "customer_vip" : 0,
            };
            var updateLepreChaunLog = false;
            var lepreSpawnedMoney = 0;
            var productQuantity = Customer.app.models.Setting.configs['CUSTOMER_TYPE_PER_PRODUCT_QUANTITY'] || {};
            var vipCustomerQuantity = Customer.app.models.Setting.configs['CUSTOMER_VIP_QUANTITY'] || [];
            for (var i = 0; i < data.length; i++) {
              if(response[i].errors.length == 0) {
                response[i].status = 1;
                response[i].errors = null;
                response[i].customerId = data[i].customerId;
                response[i].customerId = data[i].customerId;
                response[i].customerType = data[i].customerType;

                // Update lastUpdateTime is now.
                data[i].customerCurrentStatus.lastUpdateTime = new Date();
                data[i].customerCurrentStatus.location = CUSTOMER_CURRENT_STATUS_LOCATION_STREET;
                data[i].customerCurrentStatus.condition = CUSTOMER_CURRENT_STATUS_CONDITION_NORMAL;

                var productList = data[i].customerProductsList || [];
                var quantity = (data[i].quantity ? data[i].quantity : null) || productQuantity[data[i].customerType] || 0;
                if (data[i].customerType === CUSTOMER_TYPE_VIP && quantity == 0) {
                  quantity = 1;
                  if (vipCustomerQuantity.length > 0) {
                    var pos = Math.floor(Math.random() * vipCustomerQuantity.length);
                    quantity = vipCustomerQuantity[pos];
                  }
                }
                else if (quantity == 0) {
                  quantity = 1;
                }

                response[i].quantity = quantity;
                var itemCus = {
                  "customerPlayerId": userInfo.id,
                  "customerId": data[i].customerId,
                  "customerType": data[i].customerType,
                  "customerCurrentStatus": data[i].customerCurrentStatus,
                  "customerBrand": data[i].customerBrand || '',
                  "customerProduct": data[i].customerProduct || '',
                  "quantity": quantity,
                  "customerCellNumber": 0,
                  "customer3dType": data[i].customer3dType || '',
                  "customerMoodFactor": data[i].customerMoodFactor || 0,
                  "customerProductsList": productList,
                  "customerProductsListSize": productList.length
                };

                if (data[i].customerType === CUSTOMER_TYPE_LEPRECHAUN) {
                  var _lepreVar = leprechaunVars.pop();
                  updateLepreChaunLog = true;
                  itemCus.level = _lepreVar.lepreLevel;
                  itemCus.rewardMoney = _lepreVar.rewardMoney;
                  lepreSpawnedMoney += _lepreVar.rewardMoney;

                  lepreSpawnedLevels.push(itemCus.level);
                }
                CustomerList.push(itemCus);

                objectUpdate["total_spawned_customers"]++;
                if (data[i].customerType == CUSTOMER_TYPE_SPECIFIC){
                  objectUpdate["customer_specific"] += 1
                }
                else if (data[i].customerType == CUSTOMER_TYPE_IMPULSE){
                  objectUpdate["customer_impulse"] += 1
                }
                else if (data[i].customerType == CUSTOMER_TYPE_WINDOW){
                  objectUpdate["customer_window"] += 1
                }
                else if (data[i].customerType == CUSTOMER_TYPE_BIGSPENDER){
                  objectUpdate["customer_bigspender"] += 1
                }
                else if (data[i].customerType == CUSTOMER_TYPE_LEPRECHAUN){
                  objectUpdate["customer_leprechaun"] += 1
                }
                else if (data[i].customerType == CUSTOMER_TYPE_VIP){
                  objectUpdate["customer_vip"]++;
                }
              }
            }

            if (CustomerList.length === 0) {
              return next(null, response);
            }
            Customer.create(CustomerList, function(err, instance) {
              if(err) {
                return next(err);
              } else {

                async.parallel([
                  function(asc_cb) {
                    // increase total of each customer type to be display in cashout section
                    var ObjectID  = Customer.getDataSource().ObjectID;
                    var whereCondition = { _id: ObjectID.isValid(foundStore.id) ? ObjectID(foundStore.id) : foundStore.id};
                    var updateValue    = { $inc: {
                          "statistic.total_spawned_customers": objectUpdate["total_spawned_customers"],
                          "statistic.customer_specific" : objectUpdate["customer_specific"],
                          "statistic.customer_impulse" : objectUpdate["customer_impulse"],
                          "statistic.customer_window" : objectUpdate["customer_window"],
                          "statistic.customer_bigspender" : objectUpdate["customer_bigspender"],
                          "statistic.customer_leprechaun" : objectUpdate["customer_leprechaun"],
                          "statistic.customer_vip" : objectUpdate["customer_vip"]
                        } };
                    var StoreCollection = Customer.getDataSource().connector.collection(Customer.app.models.Store.modelName);
                    StoreCollection.update(whereCondition, updateValue, function(err, result) {
                      if(err) {
                        return asc_cb(err);
                      } else {
                        asc_cb(null);
                      }
                    });
                  },
                  function(asc_cb) {
                    var whereCondition = { _id: userInfo.id};
                    var updateValue    = { $inc: { total_spawned_customers: objectUpdate["total_spawned_customers"] } };
                    var MemberCollection = Customer.getDataSource().connector.collection(Customer.app.models.Member.modelName);

                    if (objectUpdate["customer_vip"] > 0) {
                      updateValue["$set"] = {
                        "vipCustomerEnergy": 0
                      }
                    }

                    MemberCollection.update(whereCondition, updateValue, function(err, result) {
                      if(err) {
                        return asc_cb(err);
                      }
                      asc_cb();
                    });
                  },
                  function(asc_cb) {
                    if (!updateLepreChaunLog) {
                      return asc_cb();
                    }

                    LeprechaunHistory.writeLog(lepreSpawnedMoney, lepreSpawnedLevels, leprechaunLog, asc_cb);
                  }
                ], function(err) {
                  if (err) {
                    return next(err);
                  }
                  next(null, response);
                });
              }
            });
          });
        }
      });
    });

  }

  function countItems(arr, id){
    var count= 0;
    for (var i = 0; i < arr.length; i++) {
      if(arr[i] == id) count++;
    }
    return count;
  }

  Customer.engage = function(data, ctx, next) {
    var ObjectID  = Customer.getDataSource().ObjectID;
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
      var userIdOfAccessToken = userInfo.id.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if(!storeId) {
      error = new Error("Store not found");
      error.code = Customer.prefixError + "EN01";
      return next(error);
    }
    if(!("customerId" in data)) {
      var error = new Error("Missing parameter: customerId");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(!("customerCellNumber" in data)) {
      var error = new Error("Missing parameter: customerCellNumber");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(!("customerCurrentStatus" in data)) {
      var error = new Error("Missing parameter: customerCurrentStatus");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }

    if(typeof data.customerId !== 'string') {
      error = new Error("Invalid parameters: customerId must be a string");
      error.code = "INVALID_PARAMETER";
      error.field = "customerId";
      return next(error);
    }
    if(typeof data.customerCellNumber !== 'number' || !validator.isInt(data.customerCellNumber)) {
      error = new Error("Invalid parameters: customerCellNumber must be a number");
      error.code = "INVALID_PARAMETER";
      error.field = "customerCellNumber";
      return next(error);
    }
    if(typeof data.customerCurrentStatus !== 'object') return next(new Error("customerCurrentStatus is invalid"));
    var customerId = data.customerId;
    var customerCellNumber = data.customerCellNumber;
    var customerCurrentStatus = data.customerCurrentStatus;
    if(!("mood" in customerCurrentStatus) || !("location" in customerCurrentStatus) || !("condition" in customerCurrentStatus) || !("linePosition" in customerCurrentStatus)) {
      error = new Error("Invalid parameters: customerCurrentStatus");
      error.code = "INVALID_PARAMETER";
      error.field = "customerCurrentStatus";
      return next(error);
    }

    if(!validator.isFloat(customerCurrentStatus.mood)) return next(new Error("mood is invalid"));
    if(CUSTOMER_CURRENT_STATUS_LOCATION.indexOf(customerCurrentStatus.location) == -1) return next(new Error("location is invalid"));
    if(customerCurrentStatus.location === CUSTOMER_CURRENT_STATUS_LOCATION_STREET) return next(new Error("Can't engaged customer with location is street"));
    if(CUSTOMER_CURRENT_STATUS_CONDITION.indexOf(customerCurrentStatus.condition) == -1) return next(new Error("condition is invalid"));

    var maxCustomer = Customer.app.models.Setting.configs['MAX_CUSTOMERS_IN_A_CELL'] || 5;
    async.parallel([
      function(cb) {
        Customer.app.models.Store.findById(storeId, cb);
      },
      function(cb) {
        Customer.findOne({ 'where': { customerId : customerId }}, cb);
      },
      function(cb) {
        Customer.find({
          where: {
            customerPlayerId: userInfo.id.toString(),
            "customerCurrentStatus.location" : {
              inq: [CUSTOMER_CURRENT_STATUS_LOCATION_CELL_INLINE, CUSTOMER_CURRENT_STATUS_LOCATION_CELL_ENGAGE]
            },
            "customerCurrentStatus.condition": {
              inq: [CUSTOMER_CURRENT_STATUS_CONDITION_NORMAL, CUSTOMER_CURRENT_STATUS_CONDITION_BUYING]
            },
            customerCellNumber: customerCellNumber,
            "customerType": {
              "neq": CUSTOMER_TYPE_VIP
            }
          }
        }, cb)
      }
    ], function(err, rs) {
      if(err) return next(err);
      if(!rs[0]) {
        error = new Error("Store not found");
        error.code = Customer.prefixError + "EN01";
        return next(error);
      }
      if(!rs[1]) {
        error = new Error("Customer not found");
        error.code = Customer.prefixError + "EN02";
        return next(error);
      }
      var foundStore = rs[0], customer = rs[1];

      // Vip customer can engage into full populated cell.
      if (customer.customerType !== CUSTOMER_TYPE_VIP) {
        if(!validator.isInt(customerCurrentStatus.linePosition) || customerCurrentStatus.linePosition < 0 || customerCurrentStatus.linePosition > 4) {
          error = new Error("Invalid parameters: linePosition");
          error.code = "INVALID_PARAMETER";
          error.field = "linePosition";
          return next(error);
        }

        if(rs[2].length >= maxCustomer) {
          error = new Error("Can not engage anymore, you already have 5 customers in cell!");
          error.code = Customer.prefixError + "EN03";
          return next(error);
        }
      }

      // Check Cells
      var cells = foundStore.cells;
      if(cells && cells.length > 0) {
        if(customerCellNumber < 1 || customerCellNumber > cells.length) {
          error = new Error("Invalid parameters: customerCellNumber");
          error.code = "INVALID_PARAMETER";
          error.field = "customerCellNumber";
          return next(error);
        }
      }
      if(customer.customerPlayerId !== userInfo.id.toString() || customer.customerPlayerId !== userIdOfAccessToken) {
        error = new Error("customerPlayerId is not match with accessToken");
        error.code = Customer.prefixError + "EN04";
        return next(error);
      }
      var cell = cells[customerCellNumber -1];
      // This is for normal customer
      if(!customer.customerProductsList || ( customer.customerProductsList && customer.customerProductsList.length == 0 )) {
        // This is for normal customer
        if(!customer.customerProduct || customer.customerProduct == '') {
          return _response(customer, customerId, customerCurrentStatus, customerCellNumber, null, next);
        }

        if(cell && JSON.stringify(cell).indexOf(customer.customerProduct) == -1) {
          try {
            var objProductId = ObjectID(customer.customerProduct);
          } catch (e) {
            objProductId = '';
          }

          Customer.app.models.Stockroom.findOne({
            where: {
              memberId: userInfo.id,
              products: objProductId
            }
          }, function(err, stockRoom) {
            if(err) return next(err);
            if(!stockRoom) {
              return _response(customer, customerId, customerCurrentStatus, customerCellNumber, null, next);
            }

            if (stockRoom.brandId.toString() == cell.brandId && Object.keys(cell.products).length < 5) {
              // move product from stockroom to right cell
              var products = cell.products;
              var arr = Object.keys( products ).map(function ( key ) { return parseInt(key); });
              var pos = _getPos(arr);
              cell.products[pos.toString()] = customer.customerProduct;
              cells[customerCellNumber -1] = cell;
              Customer.app.models.Stockroom._movetoCell(stockRoom.id, objProductId, foundStore, cells, function(err) {
                if(err) return next(err);
                _response(customer, customerId, customerCurrentStatus, customerCellNumber, cell, next)
              });
            }
            else {
              _response(customer, customerId, customerCurrentStatus, customerCellNumber, null, next);
            }
          })
        } else {
          _response(customer, customerId, customerCurrentStatus, customerCellNumber, null, next)
        }
      } else {
        // This is for bigspender
        var listProducts = customer.customerProductsList;
        var sizeOfListPros = customer.customerProductsListSize;
        var stringifyCell = JSON.stringify(cell);
        var listProductsInStore = [];
        var listProductsInStock = [];
        if(!sizeOfListPros || (sizeOfListPros && sizeOfListPros != listProducts.length)) {
          error = new Error("Invalid parameters: customerProductsListSize");
          error.code = "INVALID_PARAMETER";
          error.field = "customerProductsListSize";
          return next(error);
        }
        // Check if any product is exist in cell engaged
        for (var i = 0; i < listProducts.length; i++) {
          if(stringifyCell.indexOf(listProducts[i]) > -1) {
            listProductsInStore.push(listProducts[i]);
          } else {
            try {
              listProductsInStock.push(ObjectID(listProducts[i]));
            } catch (e) {}
          }
        }

        if(listProductsInStock && listProductsInStock.length > 0) {
          Customer.app.models.Stockroom.find({
            where: {
              memberId: userInfo.id,
              products: {
                inq: listProductsInStock
              }
            }
          }, function(err, stockRooms) {
            if(err) return next(err);
            if(!stockRooms) {
              return _response(customer, customerId, customerCurrentStatus, customerCellNumber, null, next);
            }

            stockRooms.forEach(function(stockRoom) {
              for (var i = 0; i < listProductsInStock.length; i++) {
                if(JSON.stringify(stockRoom.products).indexOf(listProductsInStock[i]) > -1) {
                  if(stockRoom.brandId.toString() == cell.brandId && Object.keys(cell.products).length < 5) {
                    // move product from stockroom to right cell
                    var products = cell.products;
                    var arr = Object.keys( products ).map(function ( key ) { return parseInt(key); });
                    var pos = _getPos(arr);
                    cell.products[pos.toString()] = listProductsInStock[i].toString();
                    cells[customerCellNumber -1] = cell;
                    try {
                      var objProductId = listProductsInStock[i];
                      Customer.app.models.Stockroom._movetoCell(stockRoom.id, objProductId, foundStore, cells, function(err) {
                        if(err) return next(err);
                      });
                    } catch (e) {};
                  }
                }
              }
            });
            _response(customer, customerId, customerCurrentStatus, customerCellNumber, cell, next)
          })
        } else {
          _response(customer, customerId, customerCurrentStatus, customerCellNumber, null, next)
        }
      }
    })
  }

  function _response(customer, customerId, customerCurrentStatus, customerCellNumber, updatedCell,next) {
    customerCurrentStatus.lastUpdateTime = new Date();
    customer.updateAttributes({
      customerId: customerId,
      customerCurrentStatus: customerCurrentStatus,
      customerCellNumber: customerCellNumber
    }, function(err, instance) {
      if(err) return next(err);
      instance.updatedCell = updatedCell;
      next(null, instance);
    });
  }

  function _getPos(arr) {
    var pos;
    if(arr.indexOf(1) == -1) pos = 1;
    else if(arr.indexOf(2) == -1) pos = 2;
    else if(arr.indexOf(3) == -1) pos = 3;
    else if(arr.indexOf(4) == -1) pos = 4;
    else pos = 5;
    return pos;
  }

  Customer.updateMultiple = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
      var userId = userInfo.id.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    if (!data.length) {
      error = new Error("Invalid parameters: Input data is not correct");
      error.code = "INVALID_PARAMETER";
      error.field = "data";
      return next(error);
    }

    var ObjectID  = Customer.getDataSource().ObjectID;
    if(!storeId) {
      error = new Error("Store not found");
      error.code = Customer.prefixError + "UM01";
      return next(error);
    }

    var listCustomers = [];
    for (var i = 0; i < data.length; i++) {
      if("customerId" in data[i]) {
        listCustomers.push(data[i].customerId);
      } else {
        listCustomers.push('');
      }
    }

    async.parallel([
      function(async_cb) {
        Customer.app.models.Store.findById(storeId, ["id", "cells", "ownerId"], function(err, foundStore) {
          if (err) {
            return async_cb(err);
          }
          else if (!foundStore) {
            error = new Error("Store not found");
            error.code = Customer.prefixError + "UM01";
            return async_cb(error);
          }

          return async_cb(null, foundStore);
        });
      },
      function(async_cb) {
        Customer.find({
          where: {customerId: {inq: listCustomers}}
        }, function(error, customers) {
          if(error) {
            return async_cb(error);
          }
          else if (!customers || customers.length == 0) {
            error = new Error("Customers not found");
            error.code = Customer.prefixError + "UM02";
            return async_cb(error);
          }
          else {
            return async_cb(null, customers);
          }
        });
      }
    ], function(err, results) {
      if (err) {
        return next(err);
      }
      foundStore = results[0];
      customers = results[1];
      var cells = foundStore.cells;
      var customerListByIds = {};
      var productIds = [];
      var nCustomers = customers.length;
      var lepreLogCreatedDate = {};
      var LeprechaunHistory = Customer.app.models.LeprechaunHistory;
      for (var i = 0; i < nCustomers; i++) {
        var item = customers[i];
        customerListByIds[item.customerId] = item;

        if (item.customerType === CUSTOMER_TYPE_BIGSPENDER) {
          for (var j = 0; j < item.customerProductsList.length; j++) {
            productIds.push(item.customerProductsList[j]);
          }
        }
        else if (item.customerType === CUSTOMER_TYPE_LEPRECHAUN) {
          var createdDate = new Date(item.customerStartsDate);
          LeprechaunHistory.getMidnightDate(createdDate);
          lepreLogCreatedDate[createdDate] = 0;
        }
        else {
          productIds.push(item.customerProduct);
        }
      }

      var saleHistories = [];
      var objectUpdate = {
        "total_satisfied_customers": 0,
        "event_satisfied_customers": 0,
        "customer_specific_sold" : 0,
        "customer_impulse_sold" : 0,
        "customer_window_sold" : 0,
        "customer_bigspender_sold" : 0,
        "customer_leprechaun_sold" : 0
      };
      var incSatisfiedInCell = function(cellNumber, value) {
        if (cells[cellNumber - 1].total_satisfied_customers) {
          cells[cellNumber - 1].total_satisfied_customers += value;
        }
        else {
          cells[cellNumber - 1].total_satisfied_customers = value;
        }
      };

      Customer.app.models.Product.find({
        "fields": {"id": true, "exclusive": true},
        "where": {id: {inq: productIds }}
      }, function(err, Products) {
        if(err) {
          return next(err);
        }
        else {
          var configLepreRewards = Customer.app.models.Setting.configs['CUSTOMER_LEPRECHAUN_REWARDS'];
          var lepreRewards = {
            "money": 0,
            "gift": {},
            "budget": 0
          };

          var productsListByIds = {};
          var nProducts = Products.length;
          for (var i = 0; i < nProducts; i++) {
            var item = Products[i];
            productsListByIds[item.id] = item;
          }
          var response = [];
          var total_sale = 0;
          var customersUpdate = [];
          var counter_total_sale = 0;
          var counter_total_consecutive_sales = 0;
          var reset_consecutive_sales = false;
          var now = new Date();
          async.each(data, function(customer, nextCustomer) {
            var errors = [];
            var _customerProducts = [];

            // Make sure input not change these fields.
            var _dbCustomer = customerListByIds[customer.customerId] || {}; // customer in DB.
            customer.customerType = _dbCustomer.customerType;
            customer.customerProduct = _dbCustomer.customerProduct;
            customer.customerBrand = _dbCustomer.customerBrand;
            customer.customerCellNumber = _dbCustomer.customerCellNumber || 0;
            customer.customerProductsList = _dbCustomer.customerProductsList || [];
            customer.customerProductsListSize = _dbCustomer.customerProductsListSize || 0;
            customer.quantity = customer.quantity || _dbCustomer.quantity || null;

            errors = validateCustomerObject(userId, customer, customers, cells);
            if (_dbCustomer.customerCurrentStatus) {
              if (_dbCustomer.customerCurrentStatus.condition == CUSTOMER_CURRENT_STATUS_CONDITION_LEAVING) {
                errors.push("The customer is left.");
              }
              else if (_dbCustomer.customerCurrentStatus.condition == CUSTOMER_CURRENT_STATUS_CONDITION_OUT) {
                errors.push("The customer is out.");
              }
            }

            if (customer.customerCurrentStatus.condition === CUSTOMER_CURRENT_STATUS_CONDITION_BUYING) {
              if (!cells[customer.customerCellNumber - 1]) {
                errors.push("The customer is not engage any cell.");
              }
            }

            if(errors.length > 0) {
              response.push({"status": 0, "customerId":customer.customerId || null, "errors": errors});
            } else {
              var condition = customer.customerCurrentStatus.condition;
              if(condition == CUSTOMER_CURRENT_STATUS_CONDITION_BUYING) {
                var productQuantity = Customer.app.models.Setting.configs['CUSTOMER_TYPE_PER_PRODUCT_QUANTITY'] || {};
                var quantity = (customer.quantity ? customer.quantity : null) || productQuantity[customer.customerType] || 1;
                var noOfProducts = 1;

                // Sale History
                var _brandId = ObjectID.isValid(customer.customerBrand) ? ObjectID(customer.customerBrand) : null;
                var saleHistoryItem = {
                  "ownerId": userInfo.id,
                  "customerType": customer.customerType,
                  "brandId": _brandId,
                  "quantity": quantity,
                  "productId": ObjectID.isValid(customer.customerProduct) ? ObjectID(customer.customerProduct) : null,
                  "created": now
                };
                if (customer.customerType == CUSTOMER_TYPE_BIGSPENDER){
                  for (var i = 0; i < customer.customerProductsList.length; i++) {
                    var _productId = customer.customerProductsList[i];
                    saleHistories.push({
                      "ownerId": userInfo.id,
                      "customerType": customer.customerType,
                      "brandId": _brandId,
                      "quantity": quantity,
                      "productId": ObjectID.isValid(_productId) ? ObjectID(_productId) : null,
                      "created": now
                    });
                  }
                }
                else {
                  saleHistories.push(saleHistoryItem);
                }
                // end...

                if (customer.customerType == CUSTOMER_TYPE_SPECIFIC){
                  objectUpdate["customer_specific_sold"] += 1
                }
                else if (customer.customerType == CUSTOMER_TYPE_IMPULSE){
                  objectUpdate["customer_impulse_sold"] += 1
                }
                else if (customer.customerType == CUSTOMER_TYPE_WINDOW){
                  objectUpdate["customer_window_sold"] += 1
                }
                else if (customer.customerType == CUSTOMER_TYPE_BIGSPENDER){
                  objectUpdate["customer_bigspender_sold"] += 1;
                  noOfProducts = customer.customerProductsList.length;
                }
                else if (customer.customerType == CUSTOMER_TYPE_LEPRECHAUN){
                  objectUpdate["customer_leprechaun_sold"] += 1;

                  // LEPRECHAUN pay by real money and gift box.
                  var lepreLevel = _dbCustomer.level;
                  var rewards = configLepreRewards['lv' + lepreLevel];

                  // Make sure _dbCustomer.rewardMoney is number.
                  if (isNaN(_dbCustomer.rewardMoney)) {
                    _dbCustomer.rewardMoney = 0;
                  }

                  lepreRewards.money += _dbCustomer.rewardMoney;
                  lepreRewards.budget += rewards['budget'];
                  rewards.gift.forEach(function(giftCode) {
                    if (lepreRewards.gift[giftCode]) {
                      lepreRewards.gift[giftCode]++;
                    }
                    else {
                      lepreRewards.gift[giftCode] = 1;
                    }
                  });

                  // Update logs.
                  var createdDate = LeprechaunHistory.getMidnightDate(_dbCustomer.customerStartsDate);
                  lepreLogCreatedDate[createdDate] += _dbCustomer.rewardMoney;

                  counter_total_sale ++;
                  counter_total_consecutive_sales ++;

                  var satisfiedCus = quantity * noOfProducts;
                  incSatisfiedInCell(customer.customerCellNumber, satisfiedCus);

                  objectUpdate["total_satisfied_customers"] += satisfiedCus;
                  objectUpdate["event_satisfied_customers"] += satisfiedCus;
                  response.push({"status": 1, "customerId": customer.customerId, "rewards": rewards['budget'], "gift": rewards.gift, "money": _dbCustomer.rewardMoney, "errors": null});

                  Customer.update({ customerId: customer.customerId },
                  {
                    "customerCurrentStatus.condition" : CUSTOMER_CURRENT_STATUS_CONDITION_OUT,
                    "quantity": quantity
                  }, function (err, instance) {});
                  return nextCustomer();
                }

                // VIP is special customer: no rewards, no stats (satisfied,...).
                var stocket_bucks_value = 0;
                if (customer.customerType !== CUSTOMER_TYPE_VIP) {
                  var satisfiedCus = quantity * noOfProducts;
                  incSatisfiedInCell(customer.customerCellNumber, satisfiedCus);

                  objectUpdate["total_satisfied_customers"] += satisfiedCus;
                  objectUpdate["event_satisfied_customers"] += satisfiedCus;
                  stocket_bucks_value = ProductStocketBuckReward(productsListByIds, customer, userId);

                  counter_total_sale ++;
                  counter_total_consecutive_sales ++;
                }

                if(stocket_bucks_value !== 0){
                  total_sale += stocket_bucks_value;
                  if("safeSaleCounter" in cells[customer.customerCellNumber - 1]) {
                    cells[customer.customerCellNumber - 1].safeSaleCounter += stocket_bucks_value;
                  } else {
                    cells[customer.customerCellNumber - 1].safeSaleCounter = stocket_bucks_value;
                  }
                }

                Customer.update({ customerId: customer.customerId },
                {
                  "customerCurrentStatus.condition" : CUSTOMER_CURRENT_STATUS_CONDITION_OUT,
                  "quantity": quantity
                }, function (err, instance) {});

                response.push({"status": 1, "customerId": customer.customerId, "rewards": stocket_bucks_value, "errors": null});
              }else if( condition == CUSTOMER_CURRENT_STATUS_CONDITION_NORMAL ) {
                customer.customerCurrentStatus.lastUpdateTime = new Date();
                var updateStatusData = _dbCustomer.customerCurrentStatus;
                var updatedFields = Object.keys(customer.customerCurrentStatus);
                for (var k = 0; k < updatedFields.length; k++) {
                  var fieldName = updatedFields[k];
                  updateStatusData[fieldName] = customer.customerCurrentStatus[fieldName];
                }

                Customer.update({ customerId: customer.customerId },
                {
                  customerCurrentStatus: updateStatusData,
                  customerCellNumber: customer.customerCellNumber,
                  customer3dType: customer.customer3dType,
                  customerMoodFactor: customer.customerMoodFactor,
                }, function (err, instance) {
                  if(err) {
                    next(err);
                  }
                });
                response.push({"status": 1, "customerId": customer.customerId, "rewards": 0, "errors": null});
              } else {
                // VIP is special customer if set VIP = leaving/out, consecutive sale is not affected.
                if (customer.customerType !== CUSTOMER_TYPE_VIP && customer.customerCellNumber
                  && (condition == CUSTOMER_CURRENT_STATUS_CONDITION_LEAVING || condition == CUSTOMER_CURRENT_STATUS_CONDITION_OUT)) {
                  reset_consecutive_sales = true;
                  counter_total_consecutive_sales --;
                }

                customersUpdate.push(customer.customerId);
                response.push({"status": 1, "customerId": customer.customerId, "rewards": 0, "errors": null});
              }
            }
            nextCustomer();
          }, function(error) {
            if(error) {
              return next(error);
            } else {
              var listCounter = [];
              if(counter_total_sale != 0) {
                listCounter.push({actionKey: MISSION_ACTION_TOTAL_SALE, value: counter_total_sale});
              }
              if(reset_consecutive_sales || counter_total_consecutive_sales != 0) {
                var item = {actionKey: MISSION_ACTION_TOTAL_CONSECUTIVE_SALES, value: counter_total_consecutive_sales};
                if (reset_consecutive_sales) {
                  item["set"] = true;
                }
                listCounter.push(item);
              }

              // SaleHistory.
              if (saleHistories.length > 0) {
                Customer.app.models.SalesHistory.writeLogs(saleHistories, function() {});
              }

              // Statistic
              if (listCounter.length > 0) {
                Customer.app.models.MemberActionStatistic.actionListCounter( userId, listCounter, function() {});
              }

              // Leprechaun history.
              var createdDates = Object.keys(lepreLogCreatedDate);
              if (createdDates.length > 0) {
                var logs = [];
                for(var createdDate in lepreLogCreatedDate) {
                  var item = {};
                  item.created = createdDate;
                  item.rewardMoney = lepreLogCreatedDate[createdDate];

                  logs.push(item);
                }
                Customer.app.models.LeprechaunHistory.updateMultipleRealPaid(logs, false, function() {});
              }
              async.parallel([
                function(acp_one) {
                  if (customersUpdate.length === 0) {
                    return acp_one();
                  }

                  Customer.update({
                    customerId : {inq : customersUpdate}
                  }, { "customerCurrentStatus.condition" : CUSTOMER_CURRENT_STATUS_CONDITION_OUT },
                  function (err , inst) {
                    if(err) {
                      acp_one(err);
                    } else {
                      acp_one(null, "2");
                    }
                  })
                },
                function(acp_one) {
                  var giftCodes = Object.keys(lepreRewards.gift);
                  if (giftCodes.length === 0) {
                    return acp_one();
                  }

                  var mBoosters = [];
                  for(var giftCode in lepreRewards.gift) {
                    var item = {};
                    item.memberId = userInfo.id;
                    item.boosterKey = giftCode;
                    item.number = lepreRewards.gift[giftCode];

                    mBoosters.push(item);
                  }
                  Customer.app.models.MemberBooster.upsertMultiple(mBoosters, false, acp_one);
                },
                function(acp_one) {
                  if (total_sale === 0 && objectUpdate["total_satisfied_customers"] === 0) {
                    return acp_one();
                  }

                  var whereCondition = { _id: userInfo.id};
                  var updateValue    = { $inc: {
                    "budget": total_sale,
                    "totalSale": total_sale,
                    "total_satisfied_customers": objectUpdate["total_satisfied_customers"],
                    "vipCustomerEnergy": objectUpdate["total_satisfied_customers"]
                  }};
                  var MemberCollection = Customer.getDataSource().connector.collection(Customer.app.models.Member.modelName);

                  if (lepreRewards.money > 0) {
                    updateValue["$inc"].moneyAmount = lepreRewards.money;
                  }
                  if (lepreRewards.budget > 0) {
                    updateValue["$inc"].budget += lepreRewards.budget;
                  }

                  MemberCollection.findAndModify(
                    whereCondition
                    , [['_id','asc']]
                    , updateValue
                    , {
                      new: true
                    }, function(err, result) {
                      if(err) {
                        return acp_one(err);
                      }
                      var updatedMember = result.value || {};
                      var newTotalStar = Customer.app.models.Store.calcTotalStarByTotalSale(updatedMember.total_satisfied_customers);

                      // increase total sold of each customer type to be displayed in cashout section
                      var whereCondition = { _id: ObjectID(storeId)};
                      var updateValue    = {
                        $inc: {
                          "statistic.money" : total_sale,
                          "statistic.total_satisfied_customers" : objectUpdate["total_satisfied_customers"],
                          "statistic.event_satisfied_customers" : objectUpdate["event_satisfied_customers"],
                          "statistic.customer_specific_sold" : objectUpdate["customer_specific_sold"],
                          "statistic.customer_impulse_sold" : objectUpdate["customer_impulse_sold"],
                          "statistic.customer_window_sold" : objectUpdate["customer_window_sold"],
                          "statistic.customer_bigspender_sold" : objectUpdate["customer_bigspender_sold"],
                          "statistic.customer_leprechaun_sold" : objectUpdate["customer_leprechaun_sold"]
                        },
                        "$set": {
                          "totalStar": newTotalStar,
                          "cells": cells
                        }
                      };

                      async.parallel([
                        function (ascp_cb) {
                          var StoreCollection = Customer.getDataSource().connector.collection(Customer.app.models.Store.modelName);
                          StoreCollection.update(whereCondition, updateValue, function(err, result) {
                            if(err) {
                              ascp_cb(err);
                            } else {
                              ascp_cb();
                            }
                          });
                        },
                        function (ascp_cb) {
                          var newRank = Customer.app.models.Member.calcRankByTotalStar(newTotalStar);
                          if (updatedMember.rank != newRank) {
                            Customer.app.models.Member.updateAll({id: userInfo.id}, {"rank": newRank}, function(err) {
                               if(err) {
                                  ascp_cb(err);
                                } else {
                                  ascp_cb();
                                }
                            });
                          }
                          else {
                            ascp_cb();
                          }
                        }
                      ], function(err, res) {
                        if (err) {
                          return acp_one(err);
                        }

                        return acp_one();
                      });
                  });
                }
              ], function(error, results) {
                if(error) {
                  return next(error);
                } else {
                  return next(null, response);
                }
              });
            }
          });
        }
      });
    });
  };

  function validateCustomerObject(userId, customer, customers, cells) {
    var errors = [];
    var customerListString = JSON.stringify(customers);
    if(!("customerId" in customer) || customer.customerId == "") {
      errors.push("customerId is required");
    } else {
      if(customerListString.indexOf("customerId\":\""+customer.customerId) == -1) {
        errors.push("Customer not found");
      } else {
        if(customerListString.indexOf("customerId\":\""+customer.customerId+"\",\"customerPlayerId\":\""+userId) == -1) {
          errors.push("customerPlayerId is not match with accessToken");
        }
      }
    }
    if(!("customerType" in customer)) {
      errors.push("customerType is required");
    } else {
      if(CUSTOMER_TYPE.indexOf(customer.customerType) == -1) {
        errors.push("customerType is invalid");
      }
    }
    if(typeof customer.customerCurrentStatus !== 'object' || !("customerCurrentStatus" in customer)) {
      errors.push("customerCurrentStatus is required");
    } else {
      if("condition" in customer.customerCurrentStatus) {
        if(CUSTOMER_CURRENT_STATUS_CONDITION.indexOf(customer.customerCurrentStatus.condition) == -1) {
          errors.push("condition is invalid");
        } else if(customer.customerCurrentStatus.condition == CUSTOMER_CURRENT_STATUS_CONDITION_BUYING ) {
          if("location" in customer.customerCurrentStatus && customer.customerCurrentStatus.location == CUSTOMER_CURRENT_STATUS_LOCATION_STREET) {
            errors.push("Customer must be in cell when buying");
          }
        }
      } else {
        errors.push("condition is required");
      }

      if("linePosition" in customer.customerCurrentStatus) {
        if(customer.customerCurrentStatus.linePosition < 0 || customer.customerCurrentStatus.linePosition > 4) {
          errors.push("linePosition is invalid");
        }
      }

      if("location" in customer.customerCurrentStatus && CUSTOMER_CURRENT_STATUS_LOCATION.indexOf(customer.customerCurrentStatus.location) == -1) {
        errors.push("location is invalid");
      }

      if("mood" in customer.customerCurrentStatus && !validator.isFloat(customer.customerCurrentStatus.mood)) {
        errors.push("mood is invalid");
      }
    }

    if("customerMoodFactor" in customer && !validator.isFloat(customer.customerMoodFactor)) {
      errors.push("customerMoodFactor is invalid");
    }

    return errors;
  }

  function ProductStocketBuckReward(products, customer, user_id) {
    var productPrice = Customer.app.models.Setting.configs['CUSTOMER_TYPE_PER_PRODUCT_PRICE'] || {};
    var productQuantity = Customer.app.models.Setting.configs['CUSTOMER_TYPE_PER_PRODUCT_QUANTITY'] || {};
    var quantity = (customer.quantity ? customer.quantity : null) || productQuantity[customer.customerType] || 1;
    var pricePerProduct = productPrice[customer.customerType] || 1;
    var rewards = quantity * pricePerProduct;

    if (customer.customerType == CUSTOMER_TYPE_BIGSPENDER){
      var maxLength = customer.customerProductsList.length;
      var noOfProducts = maxLength;
      for (var i = 0; i < maxLength; i++) {
        var buyingProductId = customer.customerProductsList[i];
        var product = products[buyingProductId] || {};
        if (product.exclusive && product.exclusive.ownerId == user_id) {
          noOfProducts++;
        }
      }

      rewards = quantity * pricePerProduct * noOfProducts;
    }

    return rewards;
  }

  Customer.deleteCustomers = function(memberId, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
      var userId = userInfo.id.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var type = userInfo.type;
    if(type && type.length > 0 && type.indexOf(MEMBER_TYPES.ADMIN) > -1 && memberId) {
      userId = memberId;
    }
    Customer.destroyAll({
      customerPlayerId: userId
    }, function(err, info) {
      if(err) return next(err);
      next(null, "All your customers have been removed (" + info.count + ").");
    })
  }

  Customer.setup = function() {
    Customer.disableRemoteMethod('create',true);
    Customer.disableRemoteMethod('updateAttributes', false);
    Customer.disableRemoteMethod('upsert',true);
    Customer.disableRemoteMethod('createChangeStream',true);
    Customer.disableRemoteMethod('exists',true);
    Customer.disableRemoteMethod('findOne',true);
    Customer.disableRemoteMethod('updateAll',true);
    Customer.disableRemoteMethod('upsertWithWhere',true);
    Customer.disableRemoteMethod('replaceOrCreate',true);
    Customer.disableRemoteMethod('replaceById',true);
    Customer.disableRemoteMethod('deleteById',true);

    Customer.validatesUniquenessOf('customerId', {message: 'customerId is not unique'});
  }

  Customer.remoteMethod(
    'createMultiple' ,
    {
      accessType: 'WRITE',
      accepts: [
        { arg: 'data', type: 'any', description: 'Array of customers object', required: true, http: { source: 'body' }}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'After generated spawning customers. Device should call API to store customers with full properties.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'post', path: '/spawning'}
    }
  )


  Customer.remoteMethod(
    'engage' ,
    {
      accessType: 'WRITE',
      accepts: [
        { arg: 'data', type: 'any', description: 'Customer object', required: true, http: { source: 'body' }}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'This API will be called when a customer is drag to a cell.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'post', path: '/engage'}
    }
  )

  Customer.remoteMethod(
    'updateMultiple' ,
    {
      accessType: 'WRITE',
      accepts: [
        { arg: 'data', type: 'any', description: 'Array of customers object', required: true, http: { source: 'body' }}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Update Customers.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'post', path: '/updateMultiple'}
    }
  )

  Customer.remoteMethod(
    'deleteCustomers' ,
    {
      accessType: 'WRITE',
      accepts: [
        {arg: 'memberId', type: 'string', http: {source: 'query' }, description: 'MemberId'}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Delete customers of current user.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'delete', path: '/'}
    }
  )

  Customer.setup();
};
