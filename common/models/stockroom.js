var async = require('async')
, validator = require('validator')
;

module.exports = function(Stockroom) {
  Stockroom.prefixError="STM_";
  Stockroom.definition.rawProperties.created.default =
      Stockroom.definition.properties.created.default = function() {
        return new Date();
  };

  Stockroom.definition.rawProperties.modified.default =
      Stockroom.definition.properties.modified.default = function() {
        return new Date();
  };

  Stockroom.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      ctx.instance.modified = new Date();
    } else {
      ctx.data.modified = new Date();
    }
    next();
  });

  Stockroom._moveAllProductToStockRoom = function(data, next) {
    var StockroomCollection = Stockroom.getDataSource().connector.collection(Stockroom.modelName);
    var Store = Stockroom.app.models.Store;
    var Product = Stockroom.app.models.Product;
    var ObjectID  = Store.getDataSource().ObjectID;
    var StoreCollection = Store.getDataSource().connector.collection(Store.modelName);
    var ProductCollection = Product.getDataSource().connector.collection(Product.modelName);
    if(typeof data.products == 'undefined' || typeof data.userInfo == 'undefined' || typeof data.brandId == 'undefined') {
      var error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    var products = data.products;
    var userInfo = data.userInfo;
    var brandId = data.brandId;
    async.parallel([
      function(cb) {
        StockroomCollection.update(
          {
            memberId: userInfo.id,
            brandId: ObjectID(brandId)
          },
          {
            $addToSet: {
              products: {
                $each: products
              }
            },
            $setOnInsert: { created: new Date()},
            $set: {modified: new Date()}
          },
          { multi: true , upsert : true},
          cb
        )
      },
      function(cb) {
        StoreCollection.update(
          {_id: ObjectID(userInfo.storeId)},
          { $inc: {noOfProducts : -(products.length)}},
          cb
        )
      },
      function(cb) {
        Product.find({
          where: {
            and: [ {id :{ inq : products} }, {"exclusive.ownerId": userInfo.id.toString()}]
          }
        }, function(err, products) {
          if(err) {
            cb(err);
          } else if(products && products.length == 0) {
            cb();
          } else {
            var productIds = [];
            var exHistory = [];
            for (var i = 0; i < products.length; i++) {
              productIds.push(products[i].id);
              exHistory.push({
                "ownerId": userInfo.id.toString(),
                "productId": products[i].id,
                "status" : EXCLUSIVE_HISTORY_STATUS_UNEXCLUSIVE,
                "created" : new Date()
              });
            }
            async.parallel([
              function(acs_one) {
                Store.app.models.ExclusiveHistory.create(exHistory, acs_one)
              },
              function(acs_one) {
                Product.update({
                  id: {inq: productIds}
                }, {exclusive: null} , acs_one);
              },
              function(acs_one) {
                Store.app.models.Notification._forMultiUnexclusive({ "products": products, "userInfo": userInfo }, acs_one)
              }
            ], cb)
          }
        })
      },
      function(cb) {
        ProductCollection.update({
          $and: [ { _id :{ $in : products} }, { stores: {$elemMatch: {$eq: userInfo.storeId.toString()}} }]
        }, {
          $pull: {stores: userInfo.storeId.toString()}
        }, {
          multi: true
        }, cb);
      }
    ], function(err, rs) {
      if(err) return next(err);
      return next(null, "Move all products to stockroom successfully");
    })
  }

  Stockroom.moveProductFromStoreToStockRoom = function(foundProduct, userInfo, next) {
    var Store = Stockroom.app.models.Store;
    var StoreCollection = Store.getDataSource().connector.collection(Store.modelName);
    var ObjectID  = Store.getDataSource().ObjectID;
    Store.findById(userInfo.storeId, function(err, foundStore) {
      if (err || !foundStore) {
        if (!foundStore) {
          err = new Error("Store is not found");
          err.code = Stockroom.prefixError+"MV01";
        }
        return next(err);
      }
      var cellInfo = Store.getCellNumberByProduct(foundProduct.id, foundStore);
      if (cellInfo.cellIndex != -1 && cellInfo.prodPosition != -1) {
        // Update store.
        var newCells = foundStore.cells;
        delete newCells[cellInfo.cellIndex].products[cellInfo.prodPosition];
        foundStore.updateAttributes({cells: newCells}, function(err, instance) {
          if(err) {
            return next(err);
          }

          return Store._moveProductToStockRoom(foundProduct, userInfo, true, function(error, msg) {
            if (error) {
              return next(error);
            }
            next(null, msg);
          });
        });
      }
      else {
        Store._moveProductToStockRoom(foundProduct, userInfo, true, next);
      }
    })

  };

  function checkExist(cells, productId) {
    for (var i = 0; i < cells.length; i++) {
      if(cells[i].products && JSON.stringify(cells[i].products).indexOf(productId) > -1) {
        return true;
      }
    }
    return false;
  }

  Stockroom.addProduct = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (typeof data.productId == 'undefined') {
      var err = new Error('Invalid parameters');
      err.code = 'MISSING_PARAMETER';
      err.statusCode = 400;
      return next(err);
    }
    if(typeof data.productId !== 'string'||data.productId =='') {
      var error = new Error("Invalid productId");
      error.code = "INVALID_PARAMETER";
      error.field= "productId";
      return next(error);
    }
    var Product = Stockroom.app.models.Product;
    var Store = Stockroom.app.models.Store;
    Store.findById(userInfo.storeId, function(err, foundStore) {
      Product.findById(data.productId, function(err, foundProduct) {
        if (err) {
          return next(err);
        }

        if (!foundProduct) {
          var error = new Error("Product is not exist");
          error.code = Stockroom.prefixError+"AP01";
          return next(error);
        }

        Stockroom._checkExistInStockRoom({
          "brandId": foundProduct.brand.id,
          "memberId": userInfo.id,
          "productId": foundProduct.id
        }, function(err, response) {
          if(err) return next(err);
          else if(response) {
            var error = new Error("The product already exists in your stock room.");
            error.code = Stockroom.prefixError + "AP02";
            return next(error);
          }
          else {
            if (checkExist(foundStore.cells, foundProduct.id.toString())) {
              return Stockroom.moveProductFromStoreToStockRoom(foundProduct, userInfo, next);
            }
            Store._moveProductToStockRoom(foundProduct, userInfo, true, next);
          }
        })
      });
    })
  };

  Stockroom._checkExistInStockRoom = function(data, next) {
    var ObjectID  = Stockroom.getDataSource().ObjectID;
    if(typeof data.brandId  == 'undefined' || typeof data.productId == 'undefined' || typeof data.memberId == 'undefined') {
      var err = new Error("Invalid parameters");
      err.code = 'MISSING_PARAMETER';
      err.statusCode = 400;
      return next(err);
    }
    Stockroom.findOne({
      where: {
        brandId: ObjectID(data.brandId),
        memberId: data.memberId,
        products: ObjectID(data.productId)
      }
    }, function(err, found) {
      if(err)
        return next(err);
      else if(!found)
        return next(null, false);
      else
        return next(null, true);
    })
  }

  Stockroom._removeProductFromStockroom = function(data, next) {
    var ObjectID  = Stockroom.getDataSource().ObjectID;
    if(typeof data.brandId  == 'undefined' || typeof data.productId == 'undefined' || typeof data.memberId == 'undefined') {
      var err = new Error("Invalid parameters");
      err.code = 'MISSING_PARAMETER';
      err.statusCode = 400;
      return next(err);
    }
    Stockroom.findOne({
      where: {
        brandId: ObjectID(data.brandId),
        memberId: data.memberId,
        products: ObjectID(data.productId)
      }
    }, function(err, found) {
      if(err || !found) {
        if(err)
          return next(err);
        else if(!found) {
          return next(null, "This product is not in your stock room.");
        }
      }
      var products = found.products;
      for (var i = 0; i < products.length; i++) {
        if(products[i].toString() === data.productId.toString()) {
          delete products[i];
        }
      }
      found.updateAttributes({
        products: products
      }, function(err) {
        if(err) {
          return next(err);
        }
        next(null, "Remove Product from stock room successfully.");
      })
    })
  }

  Stockroom.removeProduct = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (typeof data.productId == 'undefined') {
      var error = new Error('productId is required');
      error.code = "MISSING_PARAMETER";
      error.statusCode = 400;
      return next(error);
    }
    if(typeof data.productId !== 'string'||data.productId=='') {
      var err = new Error("Invalid productId");
      err.code = 'INVALID_PARAMETER';
      err.field = 'productId';
      err.statusCode = 400;
      return next(err);
    }
    var Product = Stockroom.app.models.Product;
    Product.findById(data.productId, function(err, foundProduct) {
      if (err || !foundProduct) {
        if (!foundProduct) {
          err = new Error("Product is not found");
          err.code = Stockroom.prefixError+"RP01";
        }
        return next(err);
      }

      Stockroom._removeProductFromStockroom({
        "brandId": foundProduct.brand.id,
        "memberId": userInfo.id,
        "productId": foundProduct.id
      }, function(err, response) {
        if(err) {
          return next(err);
        }
        return next(null, response);
      })
    });
  };

  Stockroom.addBrand = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var userId = userInfo.id;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (typeof data.brandId == 'undefined') {
      var err = new Error('brandId is required');
      err.code = 'MISSING_PARAMETER';
      err.statusCode = 400;
      return next(err);
    }
    if(typeof data.brandId !== 'string') {
      var error = new Error("Invalid brandId");
      error.code = "INVALID_PARAMETER";
      error.field= "brandId";
      return next(error);
    }
    var Brand = Stockroom.app.models.Brand;
    var ObjectID  = Stockroom.getDataSource().ObjectID;
    Brand.findById(data.brandId, function(err, foundBrand) {
      if (err || !foundBrand) {
        if (!foundBrand) {

          err = new Error("Brand is not found");
          err.code = Stockroom.prefixError+"AB01";
        }
        return next(err);
      }
      Stockroom.create({
        "memberId": userId,
        "brandId": ObjectID(data.brandId)
      }, function(err, inst) {
        if (err) {
          return next(err);
        }

        return next(null, "Add a Brand into stock room successfully.");
      });
    });
  };

  Stockroom.removeBrand = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var userId = userInfo.id;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (typeof data.brandId == 'undefined') {
      var err = new Error('missing brandId');
      err.code = 'MISSING_PARAMETER';
      err.statusCode = 400;
      return next(err);
    }
    if(typeof data.brandId !== 'string'||data.brandId=='') {
      var error = new Error("Invalid brandId");
      error.code = "INVALID_PARAMETER";
      error.field= "brandId";
      return next(error);
    }
    var ObjectID  = Stockroom.getDataSource().ObjectID;
    Stockroom.destroyAll({
      "memberId": userId,
      "brandId": ObjectID(data.brandId)
    }, function(err, inst) {
      if (err) {
        return next(err);
      }

      if (inst.count && inst.count > 0) {
        return next(null, "Remove a Brand from stock room successfully.");
      }
      var error = new Error("Brand is not exist in your stockroom. No brand is removed.");
      error.code = Stockroom.prefixError+"RB01";
      return next(error);

    });
  };

  Stockroom.getListBrands = function(all, filter, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var userId = userInfo.id;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var Brand = Stockroom.app.models.Brand;
    var collection = Stockroom.getDataSource().connector.collection(Stockroom.modelName);
    collection.distinct("brandId", (all == 1) ? {} : {
      memberId: userId
    }, function(err, ids) {
      if(err || !ids) {
        next(err);
      } else {
        var limit = Stockroom.app.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'] || 30;
        var offset = 0;
        if(filter) {
          if(typeof filter.limit !== 'undefined' && filter.limit < limit && filter.limit > 0) {
            limit = filter.limit;
          }

          if(typeof filter.offset !== 'undefined' && validator.isInt(filter.offset)) {
            offset = filter.offset;
          }
        }
        Brand.find({
          where: {
            id: {
              inq: ids
            }
          },
          limit: limit,
          offset: offset
        }, function(err, brands) {
          if(err) {
            next(err);
          } else {
            next(null, brands);
          }
        })
      }
    })
  }

  Stockroom.getListProducts = function(inputFilter, includedBrand, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var userId = userInfo.id;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var filter = {
      "limit": Stockroom.app.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'] || 30,
      "offset": 0,
      "where": {
        "memberId": userId
      }
    };
    var StockroomCollection = Stockroom.getDataSource().connector.collection(Stockroom.modelName);
    var ObjectID  = Stockroom.getDataSource().ObjectID;
    if(inputFilter) {
      if(inputFilter.limit && inputFilter.limit < filter.limit) {
        filter.limit = inputFilter.limit;
      }

      if(inputFilter.offset) {
        filter.offset = inputFilter.offset;
      }

      if(inputFilter.where) {
        filter.where = inputFilter.where;
        if (inputFilter.where.brandId) {
          filter.where.brandId = ObjectID(inputFilter.where.brandId);
        }
        filter.where.memberId = userId;
      }
    }

    // Remove empty product if not exist in product collection.
    filter.where.product = { $ne: [] };

    var aggregateOpts = [
      {"$unwind": "$products"}, // 0
      {"$lookup": {
        "from" : "Product",
        "localField" : "products",
        "foreignField" : "_id",
        "as" : "product"
      }}, // 1
      {"$lookup": {
        "from" : "Brand",
        "localField" : "brandId",
        "foreignField" : "_id",
        "as" : "brand"
      }}, // 2
      {"$match": filter.where
      }, // 3
      {"$project": {
        "product": 1,
        "brand": 1
      }}, // 4
      {"$skip": filter.offset}, // 5
      {"$limit": filter.limit} // 6
    ];

    // Not include brand.
    if (!includedBrand) {
      aggregateOpts.splice(2, 1);
    }
    else if (!inputFilter || !inputFilter.limit) { // unlimit for API include Brand.
      aggregateOpts.splice(6, 1);
    }

    // Get list product in stockroom included: product object, brand object.
    StockroomCollection.aggregate(aggregateOpts, function(err, foundStockProducts) {
      if (err) {
        return next(err);
      }
      if (!foundStockProducts) {
        return next(null, []);
      }

      var rs = [];
      var i = 0;
      var max = foundStockProducts.length;
      for (; i < max; i++) {
        var item = foundStockProducts[i];
        var rsItem = item.product[0];
        if (item.brand && item.brand[0]) {
          rsItem.brand = item.brand[0];

          // Hide some fields in brand.
          rsItem.brand.id = rsItem.brand._id;
          rsItem.brand._id = undefined;
          rsItem.brand.modified = undefined;
          rsItem.brand.created = undefined;
        }

        // Hide some fields in product.
        rsItem.id = rsItem._id;
        rsItem._id = undefined;
        rsItem.stores = undefined;
        rsItem.stockRooms = undefined;

        rs.push(rsItem);
      }
      next(null, rs);
    });
  };

  Stockroom.getListProductsIncludedProduct = function(filter, ctx, next) {
    Stockroom.getListProducts(filter, false, ctx, next);
  };
  Stockroom.getListProductsIncludedProductBrand = function(filter, ctx, next) {
    Stockroom.getListProducts(filter, true, ctx, next);
  };

  Stockroom._movetoCell = function(_id, productId, store, cells, callback) {
    var Product = Stockroom.app.models.Product;
    var StockroomCollection = Stockroom.getDataSource().connector.collection(Stockroom.modelName);
    var ProductCollection = Product.getDataSource().connector.collection(Product.modelName);
    var ObjectID  = Stockroom.getDataSource().ObjectID;
    async.parallel([
      function(cb) {
        //Remove product from stockroom
        StockroomCollection.update(
          {_id: _id},
          { $pull: { products: productId }},
          { multi: false },
          cb
        )
      },
      function(cb) {
        //Add product to cell
        store.updateAttributes({cells: cells, noOfProducts: store.noOfProducts + 1}, cb);
      },
      function(cb) {
        ProductCollection.update(
          { _id: productId },
          { $push: { stores: store.id.toString() }},
          { multi: false },
          cb
        )
      }
    ], callback)
  }

  Stockroom.setup = function() {
    Stockroom.remoteMethod(
      'addProduct',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{productId: string}', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Add a product into Stockroom',
        http: {verb: 'PUT', path: '/addProduct'},
        returns: {arg: 'data', type: 'any', root: true},
      }
    );
    Stockroom.remoteMethod(
      'removeProduct',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{productId: string}', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Remove a product from Stockroom',
        http: {verb: 'PUT', path: '/removeProduct'},
        returns: {arg: 'data', type: 'any', root: true},
      }
    );
    Stockroom.remoteMethod(
      'addBrand',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{brandId: string}', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Add a brand into Stockroom',
        http: {verb: 'PUT', path: '/addBrand'},
        returns: {arg: 'data', type: 'any', root: true},
      }
    );
    Stockroom.remoteMethod(
      'removeBrand',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{brandId: string}', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Remove a brand from Stockroom',
        http: {verb: 'PUT', path: '/removeBrand'},
        returns: {arg: 'data', type: 'any', root: true},
      }
    );

    Stockroom.remoteMethod(
      'getListBrands',
      {
        accessType: 'READ',
        accepts: [
          {
            arg: 'all', type: 'number', root: true,
            description: 'all', required: false, default: 0,
            http: {source: 'query'}
          },
          {
            arg: 'filter', type: 'object', http: {source: 'query' },
            description:'{"limit": limit, "offset": offset}'
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Get list brands in stockrooms',
        http: {verb: 'GET', path: '/brands'},
        returns: {arg: 'data', type: 'any', root: true},
      }
    );

    Stockroom.remoteMethod(
      'getListProductsIncludedProduct',
      {
        accessType: 'READ',
        accepts: [
          {
            arg: 'filter', type: 'object', http: {source: 'query' },
            description:'{"where": object, "limit": Int, "offset": Int}'
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Get list product in stockroom of a Player',
        http: {verb: 'GET', path: '/Products'},
        returns: {arg: 'data', type: 'any', root: true},
      }
    );
    Stockroom.remoteMethod(
      'getListProductsIncludedProductBrand',
      {
        accessType: 'READ',
        accepts: [
          {
            arg: 'filter', type: 'object', http: {source: 'query' },
            description:'{"where": object, "limit": Int, "offset": Int}'
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Get list product in stockroom of a Player include brand object',
        http: {verb: 'GET', path: '/'},
        returns: {arg: 'data', type: 'any', root: true},
      }
    );
  };
  Stockroom.setup();
};
