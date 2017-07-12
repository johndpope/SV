var async = require('async');
var common = require('../scripts/common');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var configs = common.getConfig();
var url = configs.mongodb;
require('date-utils');
var fs = require('fs');
PRODUCT_STATUS_UNEXCLUSIVE = 'un-exclusive';

MongoClient.connect(url, function(err, db) {
  function processComplete(_err) {
    common.showDebug(_err);
    db.close();
    process.exit();
  }

  if(err) {
    return processComplete(err);
  } else {
    async.parallel([
      function(cb) {
        common.getSettings(db, cb);
      },
      function(cb) {
        db.collection('Product', cb);
      },
      function(cb) {
        db.collection('ExclusiveHistory', cb);
      },
      function(cb) {
        db.collection('Notification', cb);
      },
      function(cb) {
        db.collection('Stockroom', cb);
      }
    ], function(err, results) {
      if(err) {
        return processComplete(err);
      }
      else {
        for (var i = 0; i < results[0].length; i++) {
          if(results[0][i].configName == "KEY_GENERATE_DURATION") {
            KEY_GENERATE_DURATION = results[0][i].configValue;
          }
          if(results[0][i].configName == "PRODUCT_EXCLUSIVE_EXPIRED_TIME") {
            PRODUCT_EXCLUSIVE_EXPIRED_TIME = results[0][i].configValue;
          }
          if(results[0][i].configName == "PRODUCT_CHECK_EXCLUSIVE_TIME") {
            PRODUCT_CHECK_EXCLUSIVE_TIME = results[0][i].configValue;
          }
          if(results[0][i].configName == "MEDIA_LINK") {
            MEDIA_LINK = results[0][i].configValue;
          }
        }
        var d                          = new Date();
        var n                          = d.getTime();
        var timeToCheck                = new Date(n - (PRODUCT_EXCLUSIVE_EXPIRED_TIME*1000));
        var Product                    = results[1];
        var ExclusiveHistory           = results[2];
        var Notification               = results[3];
        var Stockroom                  = results[4];

        var Member = db.collection('Member');
        var Brand = db.collection('Brand');

        function proccessInsertNotifications (members, memProducts, productObjectList, brandObjectList, next) {
          var notifications = [];
          for (var i = 0; i < members.length; i++) {
            var memberItem = members[i];
            var memberId = members[i]._id.toString();
            if (!memProducts[memberId]) {
              continue;
            }
            var flagProducts = [];
            var nProducts = memProducts[memberId].length;
            for (var j = 0; j < nProducts; j++) {
              var productId = memProducts[memberId][j];
              if (flagProducts.indexOf(productId) > -1) {
                continue;
              }

              var product = productObjectList[productId];
              var brandObj = brandObjectList[product.brand.id];
              var sentence = "An Exclusive is available for "+product.title+" of "+product.brand.name;
              var notificationId = 12;

              if(product.exclusive.ownerId == memberId) {
                sentence = "Your exclusive for "+product.title+" of "+product.brand.name+" has expired";
                notificationId = 14;
              }
              var imageURL = MEDIA_LINK.replace('_container_', product.pictures[0].container);
              imageURL = imageURL.replace('_filename_',product.pictures[0].name);
              notifications.push({
                "data": {
                  "memberId": members[i]._id,
                  "product": {
                    "id": product._id,
                    "name": product.title,
                    "imageURL": imageURL,
                    "pictures": product.pictures
                  },
                  "brand": brandObj,
                  "notificationId": notificationId,
                  "sentence": sentence
                },
                "device": members[i].device || null,
                "created": new Date(),
                "modified": new Date()
              });
            }
          }

          if (notifications.length > 0) {
            return Notification.insertMany(notifications, next);
          }
          next();
        };

        Product.find({
          "exclusive.exclusiveFrom" : {
            $lt: new Date(timeToCheck)
          }
        }).limit(configs.limit).toArray(function(err, products) {
          if(err || !products) {
            return processComplete(err);
          }
          else {
            var nOfProducts = products.length;
            if(nOfProducts > 0) {
              var memberIds = [];
              var memberProducts = {};
              var brandIds = [];
              var storeIds = [];
              var productIds = [];
              var exclusiveHistories = [];
              var productList = {};
              var now = new Date();

              var pushProductIdIntoMemberList = function(memberId, productId) {
                if (!memberProducts[memberId]) {
                  memberProducts[memberId] = [];
                }
                memberProducts[memberId].push(productId);
              };

              for (var i = 0; i < nOfProducts; i++) {
                var itemProduct = products[i];
                var productId = itemProduct._id.toString();
                productList[productId] = itemProduct;

                memberIds.push(ObjectID(itemProduct.exclusive.ownerId));
                pushProductIdIntoMemberList(itemProduct.exclusive.ownerId, productId);

                productIds.push(itemProduct._id);
                brandIds.push(ObjectID(itemProduct.brand.id));
                if (itemProduct.stores && itemProduct.stores.length > 0) {
                  itemProduct.stores.forEach(function (storeId) {
                    storeIds.push(storeId);
                  });
                }

                exclusiveHistories.push({
                  ownerId: itemProduct.exclusive.ownerId,
                  productId : productId,
                  status : PRODUCT_STATUS_UNEXCLUSIVE,
                  created : now
                });
              }

              async.parallel([
                function (async_cb) {
                  // Find stockroom to get memberID.
                  Stockroom.find({
                    products: {
                      $elemMatch: {
                        $in: productIds
                      }
                    }
                  }, {memberId: true, products: {$elemMatch: {$in: productIds}}}).toArray(function(err, stockrooms) {
                    if(err) {
                      async_cb(err);
                    } else {
                      if(stockrooms.length > 0) {
                        for (var i = 0; i < stockrooms.length; i++) {
                          var item = stockrooms[i];
                          var memberId = item.memberId.toString();
                          memberIds.push(item.memberId); // Need an ObjectId.

                          item.products.forEach(function(productId) {
                            pushProductIdIntoMemberList(memberId, productId.toString());
                          });
                        }
                      }

                      async_cb();
                    }
                  });
                },
                function (async_cb) {
                  Brand.find({
                    _id: { $in: brandIds }
                  }, {_id: 1, name: 1, picture: 1}).toArray(function(err, foundBrands) {
                    if(err) {
                      async_cb(err);
                    } else {
                      var brands = {};
                      if (foundBrands.length > 0) {
                        foundBrands.forEach(function(brand) {
                          var brandURL = MEDIA_LINK.replace('_container_', brand.picture.container);
                          brandURL = brandURL.replace('_filename_', brand.picture.name);

                          brandObj = {
                            "id": brand._id,
                            "name": brand.name,
                            "imageURL": brandURL,
                            "picture": brand.picture
                          }
                          brands[brand._id.toString()] = brandObj;
                        });
                      }
                      async_cb(null, brands);
                    }
                  });
                }
              ], function(err, res) {
                if (err) {
                  return processComplete(err);
                }
                var brandList = res[1];

                async.parallel([
                  function (async_cb) {
                    Product.updateMany({_id: {$in: productIds}}, {
                      $set: {
                        exclusive: null
                      }
                    }, function(err) {
                      if(err) {
                        return async_cb(err);
                      }
                      async_cb();
                    });
                  },
                  function (async_cb) {
                    ExclusiveHistory.insertMany(exclusiveHistories, function(err) {
                      if(err) {
                        return async_cb(err);
                      }
                      async_cb();
                    });
                  },
                  function(async_cb) {
                    if (memberIds.length === 0) {
                      return async_cb();
                    }

                    Member.find({
                      _id: { $in: memberIds }
                    }, {
                      _id:true, storeId: true, device:true
                    }).toArray(function(err, members) {
                      if(err) {
                        return async_cb(err);
                      }
                      proccessInsertNotifications(members, memberProducts, productList, brandList, async_cb);
                    });
                  },
                  function (async_cb) {
                    if (storeIds.length === 0) {
                      return async_cb();
                    }

                    var limitStores = 1000;
                    var maxLoop = Math.ceil(storeIds.length / limitStores);
                    var counter = 0;
                    for (var i = 0; i < maxLoop; i++) {
                      var fromIndex = i * limitStores;
                      var toIndex = (i + 1) * limitStores;
                      var _storeIds = storeIds.slice(fromIndex, toIndex);

                      Member.find({
                        storeId: { $in: storeIds }
                      }, {
                        _id:true, storeId: true, device:true
                      }).toArray(function(err, members) {
                        if(err) {
                          return async_cb(err);
                        }
                        var _memberProducts = {};
                        members.forEach(function(memberItem) {
                          for (var i = 0; i < nOfProducts; i++) {
                            var itemProduct = products[i];
                            var productId = itemProduct._id.toString();
                            var memberId = memberItem._id.toString();
                            var pushedNotified = memberProducts[memberId] && (memberProducts[memberId].indexOf(productId) > -1);
                            if (itemProduct.stores && itemProduct.stores.indexOf(memberItem.storeId) > -1 && !pushedNotified) {
                              if (!_memberProducts[memberId]) {
                                _memberProducts[memberId] = [];
                              }
                              _memberProducts[memberId].push(productId);
                            }
                          }
                        });

                        proccessInsertNotifications(members, _memberProducts, productList, brandList, function(err) {
                          if (err) {
                            common.showDebug(err);
                          }

                          if (++counter >= maxLoop) {
                            async_cb();
                          }
                        });
                      });
                    }
                  }
                ], function(err, rs) {
                  if (err) {
                    return processComplete(err);
                  }

                  processComplete("Un-exclusived " + nOfProducts + " products successfully.");
                });
              });
            }
            else {
              processComplete("All product has been updated");
            }
          }
        })
      }
    })
  }
})

