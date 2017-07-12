var validator = require('validator')
  , async = require('async')
  , fs = require('fs')
  , request = require('request')
  , path = require('path')
  , clone = require('clone')
  , util = require('util')
  , urlUtil = require('url')
  , exec = require('child_process').exec, child
  ;
require('date-utils');
var PRODUCT_STATUS_EXCLUSIVE = 'exclusive';
module.exports = function(Product) {


  Product.prefixError="PRO_";

  Product.definition.rawProperties.created.default =
      Product.definition.properties.created.default = function() {
        return new Date();
  };

  Product.definition.rawProperties.modified.default =
      Product.definition.properties.modified.default = function() {
        return new Date();
  };

  Product.definition.rawProperties.exclusive.default =
      Product.definition.properties.exclusive.default = function() {
        return null;
  };

  // Only allow update brand if updated original URL, and url.
  Product.beforeRemote('prototype.updateAttributes', function(ctx, product, next) {
    // Skip validate if not update brand.
    if (!ctx.req.body["brand"]) {
      return next();
    }

    var updatedBrandRequire = ["originalUrl", "url"];
    var count = 0;
    updatedBrandRequire.forEach(function(fieldName) {
      if (!ctx.req.body[fieldName]) {
        count++;
      }
    });

    if (count > 0) {
      var error = new Error("Updating brand requires updating originalUrl and url too.");
      error.code = Product.prefixError + "BR01";
      return next(error);
    }
    next();
  });
  Product.observe('before save', function(ctx, next) {
    if(ctx.data && typeof ctx.data.originalUrl !== 'undefined') {
      Product.validatesUniquenessOf('originalUrl', {message: 'OriginalUrl is not unique'});
    }

    var ObjectID  = Product.getDataSource().ObjectID;
    var BrandCollection = Product.getDataSource().connector.collection(Product.app.models.Brand.modelName);
    if(typeof ctx.isNewInstance !== 'undefined' && ctx.isNewInstance == true) {
      var short_Brand = ctx.instance.originalUrl.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/);
      var split = short_Brand[1].split('.');
      short_Brand = split[split.length - 2] + '.' + split[split.length - 1];
      BrandCollection.find({
        website : {
          $elemMatch: { $regex : short_Brand[1].toLowerCase() }
        },
        _id : ObjectID(ctx.instance.brand.id)
      }).toArray(function(err, brands) {
        if(err || brands.length == 0) {
          var error = new Error("Brand not match with originalUrl");
          error.code = Product.prefixError+"BS01";
          next(error);
        } else {
          next();
        }
      });
    } else {
      var product = ctx.currentInstance;
      if(typeof product !== 'undefined' && typeof product.originalUrl !== 'undefined') {
        product.modified = new Date();
        if(typeof ctx.data.originalUrl !== 'undefined') {
          var short_Brand = ctx.data.originalUrl.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/);
        } else {
          var short_Brand = product.originalUrl.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/);
        }
        var split = short_Brand[1].split('.');
        short_Brand = split[split.length - 2] + '.' + split[split.length - 1];
        var brandId = (ctx.data.brand ? ctx.data.brand.id : null) || product.brand.id;
        if (!ObjectID.isValid(brandId)) {
          var error = new Error("Brand id is not valid.");
          error.code = Product.prefixError+"BS02";
          return next(error);
        }

        BrandCollection.find({
          website : {
            $elemMatch: { $regex : short_Brand[1].toLowerCase() }
          },
          _id : ObjectID(brandId)
        }).toArray(function(err, brands) {
          if(err || brands.length == 0) {
            var error = new Error("Brand not match with originalUrl");
            error.code = Product.prefixError+"BS03";
            next(error);
          } else {
            next();
          }
        });
      } else {
        next();
      }
    }
  })

  Product.observe('after save', function(ctx, next) {
    var ObjectID  = Product.getDataSource().ObjectID;
    if(ctx.isNewInstance === true) {
      Product.find({
        where: {
          "brand.id": ctx.instance.brand.id
        }
      }, function(err, products) {
        if(err || !products || products.length == 0) {
          next();
        } else {
          var memberIds = [];
          var notifications = [];
          var storeIds = [];
          var productIds = [];
          var MemberCollection = Product.getDataSource().connector.collection(Product.app.models.Member.modelName);
          var StockroomCollection = Product.getDataSource().connector.collection(Product.app.models.Stockroom.modelName);
          var ProductCollection = Product.getDataSource().connector.collection(Product.modelName);
          products.forEach(function(product) {
            productIds.push(product.id);
            if(product.stores !== null && product.stores.length > 0) {
              for (var i = 0; i < product.stores.length; i++) {
                storeIds.push(product.stores[i]);
              }
            }
          });
          StockroomCollection.find({
            "products": {
              "$elemMatch": {
                "$in": productIds
              }
            }
          }).toArray(function(err, products) {
            if(err) {
              next(err);
            } else {
              if(products && products.length > 0) {
                for (var i = 0; i < products.length; i++) {
                  memberIds.push(products[i].memberId);
                }
              }
              var data = {"storeIds": storeIds, "memberIds": memberIds, "brandId": ctx.instance.brand.id};
              var q = async.queue(function(task, callback) {
                async.parallel([
                  function(cb) {
                    Product.app.models.Brand.findById(task.brandId, cb);
                  },
                  function(cb) {
                    MemberCollection.find({
                      "$or": [ {
                          "storeId": {
                            "$in": task.storeIds
                          }
                        }, {
                          "_id": {
                            "$in": task.memberIds
                          }
                        }
                      ]
                    }).toArray(cb);
                  },
                  function(cb) {
                    cb(null, Product.app.models.Setting.configs['MEDIA_LINK']);
                  },
                  function(cb) {
                    Product.app.models.Upload.uploadURL({"files":ctx.instance.imageURLs},cb);
                  }
                ], function(err, results) {
                  if(err) {
                    callback(err);
                  } else {
                    var brandObj = results[0];
                    var members = results[1];
                    var brandUrl = mediaLink = results[2];
                    var memberUpdateInc = [];
                    var memberUpdateCrt = [];
                    brandUrl = brandUrl.replace("_container_", brandObj.picture.container);
                    brandUrl = brandUrl.replace("_filename_", brandObj.picture.name);
                    if(results[3].length > 0) {
                      mediaLink = mediaLink.replace("_container_", results[3][0].container);
                      mediaLink = mediaLink.replace("_filename_", results[3][0].name);
                    }
                    members.forEach(function(member) {
                      if(typeof member.device !== 'undefined' && member.device !== null) {
                        var flag = 0;
                        if(member._id.toString() !== ctx.instance.creatorId) {
                          if(typeof member.noOfProdNotify === 'undefined' || member.noOfProdNotify === null) {
                            memberUpdateCrt.push(member._id);
                            flag = 1;
                          } else {
                            if(typeof member.noOfProdNotify.count !== 'undefined' && typeof member.noOfProdNotify.date !== 'undefined') {
                              var lastCount = member.noOfProdNotify.date;
                              if(member.noOfProdNotify.count < 10 && new Date().setHours(0,0,0,0) == lastCount.setHours(0,0,0,0)) {
                                memberUpdateInc.push(member._id);
                                flag = 1;
                              }
                              if(lastCount.isBefore(new Date().clearTime())) {
                                memberUpdateCrt.push(member._id);
                                flag = 1;
                              }
                            }
                          }
                        }
                        if(flag == 1) {
                          notifications.push({
                            "data": {
                              "memberId": member._id,
                              "notificationId": 16,
                              "sentence": "Check out this product, "+ctx.instance.title+" , for "+ctx.instance.brand.name,
                              "product": {
                                "id": ctx.instance.id,
                                "name": ctx.instance.title,
                                "imageURL": mediaLink,
                                "pictures": ( results[3].length > 0 ) ? results[3] : ctx.instance.pictures
                              },
                              "brand": {
                                "id": brandObj.id,
                                "name": brandObj.name,
                                "imageURL": brandUrl,
                                "picture": brandObj.picture
                              }
                            },
                            "device": member.device
                          })
                        }
                      }
                    });
                    async.parallel([
                      function(cb) {
                        if(memberUpdateCrt.length > 0) {
                          MemberCollection.update({_id: {$in: memberUpdateCrt}}, {$set: {
                            noOfProdNotify : {
                              "count": 1,
                              "date": new Date()
                            }
                          }},{multi: true},cb);
                        } else {
                          cb();
                        }
                      },
                      function(cb) {
                        if(memberUpdateInc.length > 0) {
                          MemberCollection.update({_id: {$in: memberUpdateInc}}, {$inc: {"noOfProdNotify.count" : 1},$set: {
                            "noOfProdNotify.date": new Date()
                          }},{multi: true},cb);
                        } else {
                          cb();
                        }
                      },
                      function(cb) {
                         ProductCollection.update({_id: ctx.instance.id},{
                          $set: {pictures: ( results[3].length > 0 ) ? results[3] : ctx.instance.pictures }
                        }, function(err, instance) {
                          if(err) {
                            cb(err);
                          } else {
                            cb(null, notifications);
                          }
                        })
                      }
                    ], function(err, results) {
                      if(err) {
                        callback(err);
                      } else {
                        callback(results[2]);
                      }
                    })
                  }
                })
              }, 1);

              q.drain = function() {
                Product.app.models.Notification.create(notifications, function(err, instance) {
                });
              };

              q.push(data, function(err) {
              });

              next();
            }
          });
        }
      })
    } else {
      next();
    }
  })

  function checkExist(cells, productId) {
    for (var i = 0; i < cells.length; i++) {
      if(cells[i].products && JSON.stringify(cells[i].products).indexOf(productId) > -1) {
        return true;
      }
    }
    return false;
  }

  Product.isExistInStore = function(storeId, product) {
    if(product.stores && JSON.stringify(product.stores).indexOf(storeId.toString()) > -1) {
      return true;
    }
    return false;
  };

  Product.setExclusive = function(id, ctx, callback) {
    var userId = null;
    if(ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
      userId = userInfo.id.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return callback(error);
    }
    async.parallel([
      function(cb) {
       Product.findById(id, cb);
      },
      function(cb) {
        Product.app.models.Store.findById(storeId, cb);
      },
      function(cb) {
        Product.app.models.ExclusiveHistory.findOne({
          where: {
            ownerId: userId,
            productId: id,
            status: PRODUCT_STATUS_EXCLUSIVE
          },
          fields: {id: true}
        }, cb)
      }
    ], function(err, results){
      if(err) return callback(err);
      if(results[0] === null) {
        var error = new Error("Product not found");
        error.code = Product.prefixError+"SE01";
        return callback(error);
      }
      if(results[1] === null) {
        var error = new Error("Store not found");
        error.code = Product.prefixError+"SE02";
        return callback(error);
      }
      var foundProduct = results[0];
      var foundStore = results[1];
      var cells = foundStore.cells;
      if(results[2] !== null && parseFloat(userInfo.budget) < parseFloat(foundProduct.price)) {
        var error = new Error("You don't have enough money to set exclusive on this product");
        error.code = Product.prefixError+"SE04";
        return callback(error);
      } else {
        if(checkExist(cells, id)) {
          if(foundProduct.exclusive && foundProduct.exclusive !== null && typeof foundProduct.exclusive.exclusiveFrom !== 'undefined'){
            var exclusiveFrom = foundProduct.exclusive.exclusiveFrom;
            var currentTime = new Date();
            var diff = currentTime.getSecondsBetween(exclusiveFrom);
            if(diff < 0 ) diff = -diff;
            if(diff <= Product.app.models.Setting.configs['PRODUCT_EXCLUSIVE_EXPIRED_TIME']) {
              var error = new Error("Can't set exclusive for this product");
              error.code = Product.prefixError+"SE05";
              return callback(error);
            }
          }
          Product.app.models.MemberActionStatistic.actionCounter(userId, MISSION_ACTION_TOTAL_STOCK_EXCLUSIVE_PRODUCT, 1, function(err) {
            if(err) return next(err);
          });
          Product.update({id:id},{
            exclusive: {
              "ownerId" : userId,
              "exclusiveFrom" : new Date()
            }
          },function(err, cb) {
            if(err) {
              return callback(err);
            } else {
              if(results[2] !== null && parseFloat(userInfo.budget) >= parseFloat(foundProduct.price)) {
                userInfo.updateBudget({
                  budget: -foundProduct.price
                }, function(err) {
                  if(err) return callback(err);
                  callback(null,cb);
                })
                return ;
              }
              Product.app.models.ExclusiveHistory.create({
                ownerId: userId,
                productId : id,
                status : PRODUCT_STATUS_EXCLUSIVE,
                created : new Date()
              }, function(err, instance){
                if(err) {
                  return callback(err);
                }
                callback(null,cb);
              });
              return ;
            }
          });
        } else {
          var error = new Error("Can't set exclusive for this product ( Product is not exist in store )");
          error.code = Product.prefixError+"SE06";
          callback(error);
        }
      }
    })
  }

  function checkInStock(stockRooms, productId) {
    if(typeof stockRooms == 'object' && stockRooms.length > 0) {
      var isIn = false;
      stockRooms.forEach(function(elem) {
        for (products in elem) {
          if (elem.hasOwnProperty(products)) {
            if(JSON.stringify(elem.products).indexOf(productId) > -1) {
              isIn = true;
            }
          }
        }
      });
      return isIn;
    } else {
      return false;
    }
  }

  Product._checkStatusWithProductIds = function(productIds, userInfo, storeId, next) {
    if(productIds.length == 0) {
      var error = new Error("productIds can't be blank");
      error.code = Product.prefixError+"CP01";
      return next(error);
    }
    var response = [];
    var ObjectID = Product.getDataSource().ObjectID;
    var StockroomCollection = Product.getDataSource().connector.collection(Product.app.models.Stockroom.modelName);
    async.parallel([
      function(cb) {
        Product.find({
          where: {
            id: {
              inq: productIds
            }
          }
        }, cb);
      },
      function(cb) {
        StockroomCollection.find({
          "memberId": userInfo.id,
          "products": {
            "$elemMatch": {
              "$in": productIds.map(function(elem) {return elem})
            }
          }
        }, {"products": 1, "_id": 1 }).toArray(cb);
      }
    ], function(err, rs) {
      if(err) {
        return next(err);
      } else {
        var products = rs[0];
        for (var i = 0; i < productIds.length; i++) {
          if(typeof productIds[i] == 'object' && typeof productIds[i].status !== 'undefined' && productIds[i].status == -1) {
            response.push(productIds[i]);
          } else {
            var status = 0;
            var location = 'none';
            var exclusive = 'none';
            var message = '';
            for (var j = 0; j < products.length; j++) {
              if(products[j].id == productIds[i].toString()) {
                status =1;
                if(products[j].exclusive) {
                  if(products[j].exclusive.ownerId == userInfo.id.toString())
                    exclusive = 'player';
                  else
                    exclusive = 'other';
                }

                if(products[j].stores && products[j].stores.indexOf(storeId) > -1) {
                  location = 'store';
                } else {
                  if(checkInStock(rs[1], productIds[i])) {
                    location = 'stock';
                  }
                }
              }
            }
            response.push({"status": status, "location": location,"exclusive": exclusive});
          }
        }
        return next(null, response);
      }
    })
  }

  Product.checkStatus = function(data, ctx, next) {
    if(ctx.user) {
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    if("productUrls" in data && "productIds" in data) {
      var error = new Error("Can not coexist productUrls and productIds");
      error.code = Product.prefixError+"CS01";
      return next(error);
    }

    var ObjectID = Product.getDataSource().ObjectID;
    var storeId = userInfo.storeId.toString();
    var brandUrl = data.brand || '';
    var brandId, products;
    var productIds = [];
    var product_urls = data.productUrls || [];
    var BrandCollection = Product.getDataSource().connector.collection(Product.app.models.Brand.modelName);
    if("productIds" in data) {
      Product._checkStatusWithProductIds(data.productIds, userInfo, storeId, next);
    } else {
      async.series([
        function(acs_one) {
          if(brandUrl == '') {
            var error = new Error("Brand is required");
            error.code = Product.prefixError+"CS02";
            return acs_one(error);
          } else if(product_urls.length == 0) {
            var error = new Error("ProductUrls is required");
            error.code = Product.prefixError+"CS03";
            return acs_one(error);
          } else {
            var long_Brand = brandUrl.split('.');
            var short_Brand = long_Brand[0] + '.' + long_Brand[1];
            product_urls = product_urls.map(function(url) {return Product.app.models.Store.decodeUrl(url);})
            BrandCollection.find({
              'website' : {
                $regex : short_Brand.toLowerCase()
              }
            }, function(error, cursor) {
              if (error) {
                var error = new Error("Brand not found");
                error.code = Product.prefixError+"CS04";
                return acs_one(error);
              }
              else {
                function brandExist(err, brand) {
                  if(err) {
                    acs_one(err);
                    return cursor.nextObject(brandExist);
                  }
                  if(brand === null) {
                    var error = new Error("Brand not found");
                    error.code = Product.prefixError+"CS04";
                    return acs_one(error);
                  } else {
                    brandId = brand._id;
                    acs_one();
                  }
                };
                cursor.nextObject(brandExist);
              }
            })
          }
        },
        function(acs_one) {
          Product.find({
            where: {
              "brand.id": brandId.toString(),
              originalUrl: {
                inq: product_urls
              }
            },
            fields: {id: true, originalUrl: true}
          }, function(err, products) {
            if(err) {
              acs_one(err);
            } else {
              for (var i = 0; i < product_urls.length; i++) {
                var count = 0;
                if(!validator.isURL(product_urls[i])) {
                  productIds.push({
                    "status" : -1,
                    "message" : 'Error: URL : '+product_urls[i]+' is invalid',
                  })
                } else {
                  products.forEach(function(product) {
                    if(product.originalUrl == product_urls[i]) {
                      productIds.push(product.id.toString())
                      count++
                    }
                  });
                  if(count == 0) {
                    productIds.push({
                      "status" : 0,
                      "message" : 'Error : ProductUrl: '+ product_urls[i] +' not found',
                    });
                  }
                }
              }
              acs_one();
            }
          })
        }
      ],function(err) {
        if(err) next(err);
        else {
          Product._checkStatusWithProductIds(productIds, userInfo, storeId, next);
        }
      });
    }
  };

  function _getProductsOfCelll(cells, cellNumber) {
    var ObjectID  = Product.getDataSource().ObjectID;
    if(cells[cellNumber-1] && typeof cells[cellNumber-1].products != 'undefined') {
      var arr = Object.keys(cells[cellNumber-1].products).map(function(key) { return ObjectID(cells[cellNumber-1].products[key])});
      return arr;
    }
    return [];
  }

  Product.random = function(filter, ctx, next) {
    var ObjectID  = Product.getDataSource().ObjectID;
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if(filter&&filter.where.brandId&&!ObjectID.isValid(filter.where.brandId)){
      var error = new Error("Invalid brandId");
      error.code = "INVALID_PARAMETER";
      error.field = "brandId";
      return next(error);
    }

    if(Product.app.models.Setting.configs['LIST_RANDOM_PRODUCT_LIMIT'] === undefined) {
      var error = new Error("Please update settings");
      error.code = Product.prefixError+"RA01";
      return next(error);
    }
    if(filter && typeof filter.limit != 'undefined') {
      if(!(validator.isInt(filter.limit)) || filter.limit > Product.app.models.Setting.configs['LIST_RANDOM_PRODUCT_LIMIT']) {
        var error = new Error("Invalid limit");
        error.code = "INVALID_PARAMETER";
        error.field = "limit";
        return next(error);
      }
    }

    if(!storeId) {
      var error = new Error("Store not found");
      error.code = Product.prefixError+"RA02";
      return next(error);
    }
    async.parallel([
      function(cb) {
        if(filter && typeof filter.where != 'undefined' && filter.where && typeof filter.where.brandId != 'undefined') {
          Product.app.models.Stockroom.findOne({
            where: {
              memberId: userInfo.id,
              brandId: ObjectID(filter.where.brandId)
            },
            fields: { products: true}
          }, cb)
        } else {
          cb();
        }
      },
      function(cb) {
        Product.app.models.Store.findById(storeId, cb);
      }
    ], function(err, rs) {
      if(err) return next(err);
      var foundStore = rs[1];
      if(!foundStore) {
        var error = new Error("Store not found");
        error.code = Product.prefixError+"RA02";
        return next(error);
      }
      var condition = null;
      var cells = foundStore.cells;
      var brandId = null;
      if(filter && typeof filter.where != 'undefined') {
        condition = {};
        if(typeof filter.where.brandId != 'undefined') {
          brandId = filter.where.brandId;
          condition["brand.id"] = filter.where.brandId;
          condition.stores = {
            "$elemMatch": {"$eq": storeId }
          }
          if(rs[0] && typeof rs[0].products !== 'undefined' && rs[0].products.length > 0) {
            condition = {
              "$or": [
                { "_id": { "$in" : rs[0].products }},
                { "stores": { "$elemMatch": { "$eq": storeId }} }
              ],
              "brand.id": filter.where.brandId
            }
          }
        }
        if(typeof filter.where.cellNumber != 'undefined') {
          var ids = _getProductsOfCelll(cells, filter.where.cellNumber);
          condition._id = {"$in": ids};
        }
      }

      var lm = (filter && typeof filter.limit != 'undefined') ? filter.limit : Product.app.models.Setting.configs['LIST_RANDOM_PRODUCT_LIMIT'];
      if(lm <= 0) lm = Product.app.models.Setting.configs['LIST_RANDOM_PRODUCT_LIMIT'];

      lm = parseInt(lm);
      var ProductCollection = Product.getDataSource().connector.collection(Product.modelName);
      ProductCollection.aggregate([
        { "$match": (condition) ? condition : {}},
        { $sample: { size: lm } }
      ], function(err, products) {
        if(err) {
          return next(err);
        } else {
          var flagGetMore = false;
          if (!products) {
            products = [];
            flagGetMore = true;
          }
          var max = products.length;
          var i = 0;
          for (; i < max; i++) {
            products[i].id = products[i]._id;
            products[i]._id = undefined;
            products[i].stores = undefined;
          }

          if (max < lm) {
            flagGetMore = true;
            lm = lm - max;
          }

          if (flagGetMore) {
            // Get more products.
            ProductCollection.aggregate([
              { "$match": brandId ? {"brand.id": brandId} : {}},
              { $sample: { size: lm } }
            ], function(err, moreProducts) {
              var max = moreProducts.length;
              var i = 0;
              var item = {};
              for (; i < max; i++) {
                item = moreProducts[i];
                item.id = item._id;
                item._id = undefined;
                item.stores = undefined;

                products.push(item);
              }

              next(null, products);
            });

            return ;
          }

          return next(null, products);
        }
      })
    })
  }

  // Get Product contains no image.
  Product.getProductNoImages = function(filter, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var limit = Product.app.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'] || 30;
    var filterObj = null;
    var offset = 0;
    var fields = null;
    if(filter) {
      try {
        filterObj = JSON.parse(filter);
      } catch(e) {
        return next("filter is invalid ( "+e+" )");
      }

      if(typeof filterObj.limit !== 'undefined' && filterObj.limit < limit && filterObj.limit > 0) {
        limit = filterObj.limit;
      }

      if(typeof filterObj.offset !== 'undefined') {
        offset = filterObj.offset;
      }

      if(typeof filterObj.fields !== 'undefined') {
        fields = filterObj.fields;
      }
    }
    Product.find({
      where: {
        pictures: {
          elemMatch: {
            container: "",
            name: ""
          }
        }
      },
      fields: (fields) ? fields : {},
      limit: limit,
      offset: offset
    }, function(err, products) {
      if(err) {
        next(err);
      } else {
        next(null, products);
      }
    })
  }

  Product.trackingURL = function(originalURL, affiliateNetwork, mid, ctx, next) {
    if(ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
      userId = userInfo.id.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    // Check parameters exist?
    if(typeof originalURL == 'undefined' || typeof affiliateNetwork == 'undefined') {
      var error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      error.field= "originalURL, or affiliateNetwork";
      return next(error);
    }
    if (!validator.isURL(originalURL)) {
      var error = new Error("Invalid originalURL");
      error.code = "INVALID_PARAMETER";
      error.field= "originalURL";
      return next(error);
    }

    // Validation input
    if(affiliateNetwork.toLowerCase() !== 'cj' && affiliateNetwork.toLowerCase() !== 'ls' && affiliateNetwork.toLowerCase() !== 'fo') {
      var error = new Error("Invalid affiliateNetwork");
      error.code = "INVALID_PARAMETER";
      error.field= "affiliateNetwork";
      return next(error);
    }

    var lsToken = Product.app.models.Setting.configs['LINKSHARE_TOKEN'];
    var cjId = Product.app.models.Setting.configs['CJ_PID'];
    var foApi = Product.app.models.Setting.configs['FLEXOFFERS_API_KEY'];
    var url = '';
    if(!lsToken) {
      var error = new Error("Missing Linkshare token");
      error.code = "INVALID_PARAMETER";
      error.field= "LINKSHARE_TOKEN";
      return next(error);
    }
    if(!cjId) {
      var error = new Error("Missing CJ PID");
      error.code = "INVALID_PARAMETER";
      error.field= "CJ_PID";
      return next(error);
    }
    if(!foApi) {
      var error = new Error("Missing FO API");
      error.code = "INVALID_PARAMETER";
      error.field= "FO_API";
      return next(error);
    }
    if(affiliateNetwork.toLowerCase() == 'ls') {
      if(typeof mid == 'undefined') {
        var error = new Error("Missing parameter: mid");
        error.code = "INVALID_PARAMETER";
        error.field= "mid";
        return next(error);
      }
      if(!validator.isInt(mid)) {
        var error = new Error("Invalid mid");
        error.code = "INVALID_PARAMETER";
        error.field= "mid";
        return next(error);
      }
      url = "http://bento.linksynergy.com/bento_services/bookmarklet/linkproxytag2.php?token="+lsToken+"&mid="+mid+"&tag=bookmark-1&murl="+originalURL;
      request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          if(!validator.isURL(body)) {
            next(body);
          } else {
            next(null, body+"&u1=@commissionTrackingID");
          }
        } else {
          if(error) return next(error);
        }
      });
    } else if(affiliateNetwork.toLowerCase() == 'fo') {
      try{
        mid = JSON.parse(mid);
      } catch(e) {
        var error = new Error("Invalid mid");
        error.code = "INVALID_PARAMETER";
        error.field= "mid";
        return next(error);
      }
      if(typeof mid.advertiserId == 'undefined' || typeof mid.categoryIds == 'undefined') {
        var error = new Error("Missing parameters");
        error.code = "MISSING_PARAMETER";
        error.field= "advertiserId, or categoryIds";
        return next(error);
      }
      var advertiserId = mid.advertiserId,
        categoryIds = mid.categoryIds;
        // url = "http://api.flexoffers.com/links.json?advertiserIds="+advertiserId+"&categoryIds="+categoryIds+"&page=1&pageSize=10&sortOrder=desc";
        url = "https://publisherpro.flexoffers.com/tfshandler/links/links/1070193?deepOnly=true&pageNumber=1&pageSize=1&programIds="+advertiserId+"&sortColumn=created&sortOrder=desc";
        var options = {
          url: url,
          headers: {
            "ApiKey": foApi
          }
        }
        request(options, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            try {
              var info = JSON.parse(body);
            } catch(e) {
              return next("No records found for this domain.");
            }
            var results = info.results;
            if(results && results.length > 0) {
              var record = results[0];
              var redirectUrl = "https://track.flexlinkspro.com/a.ashx?foid=1070193."+record.productId+"&foc="+record.contentTypeId+"&fot=9999&fos=1&fobs=@commissionTrackingID" + "&url=" + encodeURIComponent(originalURL);
              return next(null, redirectUrl)
            }
            return next("No records found for this domain.");
          }
        })
    } else {
      url = "http://www.anrdoezrs.net/links/"+cjId+"/type/dlg/sid/@commissionTrackingID/"+originalURL;
      next(null, url);
    }
  };

  Product.getProductsByBrandCategory = function(brandCategoryId, filter, next) {
    Product.app.models.Brand.getListByCategoryId(brandCategoryId, ["id"], function(err, foundBrands) {
      if (err) {
        return next(err);
      }

      var queryFilter = {
        "limit": Product.app.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'],
        "offset": 0
      };
      if (filter.limit && filter.limit < queryFilter.limit) {
        queryFilter.limit = filter.limit;
      }
      if (filter.offset) {
        queryFilter.offset = filter.offset;
      }

      var max = foundBrands.length;
      var brandIds = [];
      for (var i = 0; i < max; i++) {
        brandIds.push(foundBrands[i].id.toString());
      }

      var ProductCollection = Product.getDataSource().connector.collection(Product.modelName);
      ProductCollection.find({
          "brand.id": {
            "$in": brandIds
          }
        }, {"stores": 0}).limit(queryFilter.limit).skip(queryFilter.offset).toArray(function(err, products) {
        if (err) {
          return next(err);
        }
        if (!products || products.length == 0) {
          return next(null, []);
        }

        var rs = [];
        var i = 0;
        var max = products.length;
        for (; i < max; i++) {
          var rsItem = products[i];

          // Hide some fields in product.
          rsItem.id = rsItem._id;
          rsItem._id = undefined;
          rsItem.stores = undefined;
          rsItem.stockRooms = undefined;

          rs.push(rsItem);
        }
        next(null, rs);
      });
    });
  };

  Product.updateVoteCategory = function(item, next) {
    var error;
    var ObjectID = Product.getDataSource().ObjectID;
    if (!item.pid || !ObjectID.isValid(item.pid)) {
      error = new Error("Invalid parameter: product ID (" + item.pid + ")");
      error.code = "INVALID_PARAMETER";
      error.field = "data.pid";
      return next(error);
    }

    if (!item.cid || !ObjectID.isValid(item.cid)) {
      error = new Error("Invalid parameter: category ID (" + item.cid + ")");
      error.code = "INVALID_PARAMETER";
      error.field = "data.cid";
      return next(error);
    }

    var ProductCollection = Product.getDataSource().connector.collection(Product.modelName);
    async.parallel([
      function(async_cb) {
        Product.findById(item.pid, {"fields": ["id", "categories"]}, async_cb);
      },
      function(async_cb) {
        Product.app.models.BrandCategory.findById(item.cid, async_cb);
      }
    ], function(err, result) {
      if (err) {
        return next(err);
      }

      var foundProduct = result[0] || false;
      var foundBrandCate = result[1] || false;
      if (!foundProduct) {
        error = new Error("Product not found (" + item.pid + ")");
        error.code = Product.prefixError + "UV01";
        error.field = "data.pid";
        return next(error);
      }
      if (!foundBrandCate) {
        error = new Error("Category not found (" + item.cid + ")");
        error.code = Product.prefixError + "UV02";
        error.field = "data.cid";
        return next(error);
      }

      var updateQuery = {
        "$set": {
          "categories": [{
            "id": foundBrandCate.id,
            "name": foundBrandCate.name,
            "votes": 1
          }],
          "modified": new Date()
        }
      };
      if (foundProduct.categories && foundProduct.categories.length) {
        let flagIncreased = false;
        updateQuery["$set"] = {};
        for (let i = 0; i < foundProduct.categories.length; i++) {
          let itemCate = foundProduct.categories[i];

          if (itemCate.id.toString() === item.cid) {
            flagIncreased++;
            updateQuery["$set"]["categories." + i + ".votes"] = itemCate.votes + 1;
          }
        }
        if (!flagIncreased) {
          updateQuery["$push"] = {
            "categories": {
              "id": foundBrandCate.id,
              "name": foundBrandCate.name,
              "votes": 1
            }
          };

          delete updateQuery["$set"];
        }
      }

      ProductCollection.update({
        "_id": foundProduct.id
      }, updateQuery, next);
    });
  };

  Product.updateResultMiniGame = function(data, ctx, next) {
    var error;
    if (!ctx.user){
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!Array.isArray(data)) {
      error = new Error("Invalid parameter");
      error.code = "INVALID_PARAMETER";
      error.field = "data";
      return next(error);
    }

    var maxLen = data.length;
    if (data.length === 0) {
      return next(null, ctx.user.budget);
    }

    var totalCorrect = 0;
    var ObjectID = Product.getDataSource().ObjectID;
    var coupleProCate = [];
    for (let i = 0; i < maxLen; i++) {
      let item = data[i];
      if (typeof item !== 'object') {
        error = new Error("Invalid parameter: an item is not object");
        error.code = "INVALID_PARAMETER";
        error.field = "data." + i;
        return next(error);
      }

      if (!item.pid || !ObjectID.isValid(item.pid)) {
        error = new Error("Invalid parameter: product ID");
        error.code = "INVALID_PARAMETER";
        error.field = "data." + i +".pid";
        return next(error);
      }

      if (!item.cid || !ObjectID.isValid(item.cid)) {
        error = new Error("Invalid parameter: category ID");
        error.code = "INVALID_PARAMETER";
        error.field = "data." + i +".cid";
        return next(error);
      }

      let pos = coupleProCate.findIndex(function(elem) {
        return (elem.cid === item.cid && elem.pid === item.pid);
      });

      if (pos > -1) {
        continue;
        // error = new Error("Invalid parameter: duplicated pid and cid in data list.");
        // error.code = "INVALID_PARAMETER";
        // error.field = "data." + i;
        // return next(error);
      }

      if (item.correct == 1) {
        totalCorrect++;
      }
      coupleProCate.push(item);
    }

    let maxCouple = coupleProCate.length;
    if (maxCouple > 0) {
      for (let i = 0; i < maxCouple; i++) {
        let item = coupleProCate[i];

        // Save product-category vote.
        Product.updateVoteCategory(item, function(err) {});
      }
    }

    if (totalCorrect === 0) {
      return next(null, ctx.user.budget);
    }

    var budgetPerCorrect = Product.app.models.Setting.configs["PLAYER_MINIGAME_DEFAULT_REWARD_BUDGET"] || 10;
    var rewards = totalCorrect * budgetPerCorrect;
    ctx.user.updateBudget({"budget": rewards}, function(err, updatedMember) {
      if (err) {
        return next(err);
      }

      return next(null, updatedMember.budget);
    });
  };

  Product.setup = function() {
    Product.disableRemoteMethod('upsert',true);
    Product.disableRemoteMethod('createChangeStream',true);
    Product.disableRemoteMethod('exists',true);
    Product.disableRemoteMethod('findOne',true);
    Product.disableRemoteMethod('updateAll',true);
    Product.disableRemoteMethod('__get__Product_Brand_fk',false);
    Product.disableRemoteMethod('upsertWithWhere',true);
    Product.disableRemoteMethod('replaceOrCreate',true);
    Product.disableRemoteMethod('replaceById',true);
    Product.disableRemoteMethod('deleteById',true);

    function validateBrand(cb_err , done) {
      var self = this;
      if(typeof self.brand !== 'undefined') {
        if(self.brand) {
          Product.app.models.Brand.findById(self.brand.id, function(err, inst) {
            if(!inst || err) {
              cb_err();
            }
            done();
          });
        } else {
          cb_err();
          done();
        }
      }
    }

    Product.validateAsync('brand', validateBrand, {message: 'Invalid brandId'});

    function validateAffiliateNetwork(err) {
      if(typeof this.affiliateNetwork !== 'undefined' && this.affiliateNetwork) {
        if(this.affiliateNetwork.toLowerCase() !== 'cj' && this.affiliateNetwork.toLowerCase() !== 'ls'
          && this.affiliateNetwork.toLowerCase() !== 'fo') {
          err();
        }
      }
    }
    Product.validate('affiliateNetwork', validateAffiliateNetwork, {message: 'Invalid affiliateNetwork'});

    Product.validatesLengthOf('title', {min: 2, max: 255, message: 'Invalid title'});
    function validateTitle(err) {
      if(typeof this.title !== 'undefined' && this.title) {
        if(typeof this.title !== 'string') {
          err();
        }
      }
    }
    Product.validate('title', validateTitle, {message: 'Invalid title'});

    //Validate Pictures
    function validatePictures(err) {
      if(typeof this.pictures !== 'undefined' && this.pictures) {
        if(typeof this.pictures !== 'object') {
          err();
        }
      }
    }
    Product.validate('pictures', validatePictures, {message: 'Invalid pictures'});

    //Validate Url
    function validateUrl(err) {
       if(typeof this.url !== 'undefined' && this.url) {
         if(!validator.isURL(this.url)) {
           err();
         }
       }
    }
    Product.validate('url', validateUrl, {message: 'Invalid url'});

     //Validate originalUrl
    function validateOriginalUrl(err) {
        if(typeof this.originalUrl !== 'undefined' && this.originalUrl) {
          if(!validator.isURL(this.originalUrl)) {
            err();
          }
        }
    }
    Product.validate('originalUrl', validateOriginalUrl, {message: 'Invalid originalUrl'});

    //Validate Price
    function validatePrice(err) {
      if(this.price < 0) {
        err();
      }
      if(typeof this.price !== 'undefined' && this.price) {
        if(!validator.isFloat(this.price.toString()) || this.price < 0) {
          err();
        }
      }
    }
    Product.validate('price', validatePrice, {message: 'Invalid price'});

    // check if created is valid
    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        if (!validator.isDate(this.created.toString())) {
          cb();
        }
      }
    }
    Product.validate('created', validateCreated, {message: 'Invalid created'});

    // check if modified is valid
    function validateModified(cb) {
      if (typeof this.modified !== 'undefined') {
        if (!validator.isDate(this.modified.toString())) {
          cb();
        }
      }
    }
    Product.validate('modified', validateModified, {message: 'Invalid modified'});
  }
  Product.checkImageProducts = function (limit, next) {
    var fileLog = 'handleProductLostImages.log';
    try {
      var contents = JSON.parse(fs.readFileSync(fileLog).toString());
    } catch (e) {
      contents = {};
    }

    if (!contents.loadProduct) {
      contents.loadProduct = limit;
    } else {
      contents.loadProduct = parseInt(contents.loadProduct) + limit;
    }

    var offset = contents.loadProduct - limit;
    Product.find({
      fields:["id","pictures","imageURLs"],
      where: {
        "pictures": {"neq": []},
        "imageURLs": {"neq": []}
      },
      limit: limit,
      offset: offset,
      order: 'created ASC'
    }, function (err, products) {
      if (err) {
        next(err);
      } else {
        //write log to config

        var dataUpdate = [];
        var dataUpload = [];
        if(products.length) {
          products.forEach(function (product, i) {
            var objUpdate = {
              id: product.id,
              pictures: []
            };
            var objUpload = {
              id: product.id,
              files: []
            };
            var flagUpdate = 0;
            var flagUpload = 0;

            //check picture null
            var pictures = [];
            if (product.pictures) {
              product.pictures.forEach(function (picture) {
                if (picture.name != "") {
                  pictures.push(picture);
                } else {
                  flagUpdate = 1;
                }
              });
            }

            if (product.imageURLs) {
              product.imageURLs.forEach(function (url, i2) {

                //parse name from URL
                var name = Product.app.models.Upload.getFileName(url);
                if (pictures.length) {

                  //check url upload success
                  var checkExists = 0;
                  pictures.forEach(function (picture, i3) {
                    if (name == picture.name) {
                      checkExists = 1;
                    } else {
                      var nameSplit1 = picture.name.split('.');
                      delete nameSplit1[nameSplit1.length - 1];
                      var name2 = nameSplit1.join('.').slice(0, -1);
                      var nameSplit2 = name2.split('_');
                      delete nameSplit2[nameSplit2.length - 1];
                      var newName = nameSplit2.join('_').slice(0, -1);

                      var pictureNameSplit = picture.name.split('.');
                      delete pictureNameSplit[pictureNameSplit.length - 1];

                      var pictureName = pictureNameSplit.join('.').slice(0, -1);

                      if (newName == pictureName) {
                        checkExists = 1;
                      } else {
                        var pictureNameSplit2 = pictureName.split('_');
                        delete pictureNameSplit2[pictureNameSplit2.length - 1];
                        var pictureName2 = pictureNameSplit2.join('_').slice(0, -1);
                        if (newName == pictureName2) {
                          checkExists = 1;
                        }
                      }
                    }
                  });

                  // if upload error ~~ checkExists =0;
                  if (!checkExists) {
                    flagUpload = 1;
                    objUpload.files.push(url);
                  }
                } else {
                  flagUpload = 1;
                  objUpload.files.push(url);
                }
              });
            }
            if (flagUpdate) {
              objUpdate.pictures = pictures;
              dataUpdate.push(objUpdate);
            }
            if (flagUpload) {
              dataUpload.push(objUpload);
            }
          });
        }
        var result = {
          dataUpdate: dataUpdate,
          dataUpload: dataUpload
        };

        fs.writeFile(fileLog, JSON.stringify(contents));
        next(null, result)
      }
    })
  };
  Product.updateDataImages = function (data, next) {
    data.forEach(function (element) {
      Product.updateAll({_id: element.id}, {pictures: element.pictures});
    });
    next(null);

  };
  Product.uploadLostImages = function (data, next) {
    var maxCounter = data.length;
    var counter = 0;
    var ProductCollection = Product.getDataSource().connector.collection(Product.modelName);
    data.forEach(function (element) {
      Product.app.models.Upload.uploadURL({"files": element.files}, function (err, res) {
        if (err) {
        } else {
          if (res.length > 0) {
            ProductCollection.update({_id: element.id}, {
              $set: {pictures: res}
            }, function (err, res2) {
            });
          }
        }

        counter++;
        if (counter >= maxCounter) {
          return next(null, "Handled " + maxCounter + " product lost image.");
        }
      });
    });
  };
  Product.handleLostImages = function (ctx, next) {
    var limit = ctx.query.limit ? parseInt(ctx.query.limit) : 150;
    Product.checkImageProducts(limit, function (err, result) {
      if (err) {
        var error=new Error("Check Image of Products error");
        error.code=Product.prefixError+"HLI01";
        next(error);
      } else {
        if (result.dataUpload.length === 0) {
          next(null, "All products is checked.");
        }
        Product.uploadLostImages(result.dataUpload, next);
      }
    });
  };

  Product.remoteMethod(
    'setExclusive' ,
    {
      accessType: 'EXECUTE',
      accepts: [
        { arg: 'id', type: 'string', description: 'Product Id', required: true, http: { source: 'path' }}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Set exclusive to single product in player\'s store.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'put', path: '/:id/exclusive'}
    }
  )

  Product.remoteMethod(
    'checkStatus' ,
    {
      accessType: 'EXECUTE',
      accepts:
      [
        {
          arg: 'data', type: 'any', description: 'Product Urls', required: true,
          http: {source: 'body'}
        }
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Check Status for product',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'post', path: '/checkStatus'}
    }
  )

  Product.remoteMethod(
    'random' ,
    {
      accessType: 'EXECUTE',
      accepts: [
        { arg: 'filter', type: 'object', description: '{"where": {"brandId": _BRAND_ID, "cellNumber": __CELLNUMBER_}, "limit": _LIMIT_', http: { source: 'query' }}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Check Status for product',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'get', path: '/random'}
    }
  )

  Product.remoteMethod(
    'getProductNoImages' ,
    {
      accessType: 'EXECUTE',
      accepts:[
        {
          arg: 'filter', type: 'string', http: {source: 'query' }, description:
          '{"fields": {}, "limit": limit , "offset": offset}'
        }
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Get list products don\'t have image or image is empty (upload error)',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'get', path: '/noImages'}
    }
  )

  Product.remoteMethod(
    'trackingURL' ,
    {
      accessType: 'EXECUTE',
      accepts:
      [
        {arg: 'originalURL', type: 'string', http: {source: 'query'}, description: 'original URL'},
        {arg: 'affiliateNetwork', type: 'string', http: {source: 'query' }, description: 'CJ or LS of FO'},
        {arg: 'mid', type: 'string', http: {source: 'query' }, description: 'Number if from LS, empty string if from CJ and object if from FO.'}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Get tracking URL',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'get', path: '/trackingURL'}
    }
  );

  Product.remoteMethod(
    'getProductsByBrandCategory' ,
    {
      accessType: 'EXECUTE',
      accepts:
      [
        {arg: 'cid', type: 'string', required: true, http: {source: 'query'}, description: 'Brand Category ID'},
        {arg: 'filter', type: 'object', required: true, http: {source: 'query'}, description: '{"limit": N, "offset": N}'}
      ],
      description: 'Get list product by Brand Category ID',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'get', path: '/byBrandCategory'}
    }
  )

  Product.remoteMethod(
    'handleLostImages',
    {
      accessType: 'EXECUTE',
      accepts: [
        { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Check uploading image error on Products and re-upload',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'put', path: '/handleLostImages'}
    }
  );

  Product.remoteMethod(
    'updateResultMiniGame',
    {
      accessType: 'EXECUTE',
      accepts: [
        {arg: 'data', type: 'object', required: true, http: {source: 'body' }, description: "Matching list result"}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Matching product-category mini game - update rewards.',
      http: {verb: 'POST', path: '/miniGame'},
      returns: {arg: 'data', type: 'any', root: true}
    }
  );

  Product.setup();
};
