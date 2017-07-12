var validator = require('validator')
  , async = require('async')
  , request = require('request')
  , path = require('path')
  , clone = require('clone')
  , util = require('util');

module.exports = function(Brand) {
  Brand.prefixError = "BRA_";

  Brand.definition.rawProperties.name.default =
    Brand.definition.properties.name.default = function() {
      return null;
  };

  Brand.definition.rawProperties.description.default =
    Brand.definition.properties.description.default = function() {
      return null;
  };

  Brand.definition.rawProperties.category.default =
    Brand.definition.properties.category.default = function() {
      return [];
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Brand.definition.rawProperties.created.default =
    Brand.definition.properties.created.default = function() {
      return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Brand.definition.rawProperties.modified.default =
    Brand.definition.properties.modified.default = function() {
      return new Date();
  };

  Brand.definition.rawProperties.website.default =
    Brand.definition.properties.website.default = function() {
      return null;
  };

  Brand.getRandomByCategory = function(categoryIds, limit, next) {
    var BrandCollection = Brand.getDataSource().connector.collection(Brand.modelName);
    var ObjectID  = Brand.getDataSource().ObjectID;

    var ids = [];
    categoryIds.forEach(function(id) {
      if (ObjectID.isValid(id)) {
        ids.push(ObjectID(id));
      }
      else {
        ids.push(id);
      }
    });
    BrandCollection.aggregate([
      { "$match": {
        "$or": [
          { "category.id": { "$in" : ids }},
          { "category.name": "Trending" }
        ]
      }},
      { "$sample": { "size": limit } },
      { "$project": {"_id": true} }
    ], function(err, brands) {
      if (err) {
        return next(err);
      }

      next(null, brands);
    });
  };

  Brand.getListByCategoryId = function(brandCategoryId, fields, next) {
    if (!fields) {
      fields = [];
    }
    var ObjectID  = Brand.getDataSource().ObjectID;

    if(brandCategoryId.indexOf(',') > -1) {
      // 2 or more
      var brandCategories = brandCategoryId.split(",");
      brandCategories = brandCategories.map(function(category) {return ObjectID(category)});
      brandCategoryId = { "inq" : brandCategories };
    } else {
      // 1 category
      brandCategoryId = ObjectID(brandCategoryId.toString());
    }
    Brand.find({
      "fields": fields,
      "where": {"category.id": brandCategoryId}
    }, function(err, foundBrands) {
      if (err) {
        return next(err);
      }
      return next(null, foundBrands);
    });
  };

  // Re-build not reset, reset in the other function.
  Brand.rebuildStatByBrandIds = function(listBrandObj) {
    if (listBrandObj.length === 0) {
      // console.log("done");
      return ;
    }

    var brandId = listBrandObj.pop().id;
    var BrandCollection = Brand.getDataSource().connector.collection(Brand.modelName);
    var StoreCollection = Brand.app.models.Store.getDataSource().connector.collection(Brand.app.models.Store.modelName);

    // console.log("processing", brandId);
    StoreCollection.find({
      "cells": {
        "$elemMatch": {
          "brandId": brandId.toString()
        }
      }
    }, {
      "cells.brandId": true
    }).toArray(function(err, foundStores) {
      let maxStores = foundStores.length;
      if (maxStores === 0) {
        // console.log("next");
        return Brand.rebuildStatByBrandIds(listBrandObj);
      }

      let stats = {
        "inStores": maxStores,
        "inCells": 0
      }
      for (let j = 0; j < maxStores; j++) {
        if (!foundStores[j].cells || foundStores[j].cells.length === 0) {
          continue;
        }

        for (let k = 0; k < foundStores[j].cells.length; k++) {
          if (foundStores[j].cells[k].brandId == brandId) {
            stats.inCells++;
          }
        }
      }

      // console.log("\t Result", stats);
      BrandCollection.update({
        "_id": brandId
      }, {
        "$inc": {
          "stats.inStores": stats.inStores,
          "stats.inCells": stats.inCells
        }
      }, function() {
        Brand.rebuildStatByBrandIds(listBrandObj);
      });
    });
  }

  Brand.rebuildStats = function(ctx, next) {
    var error;
    if(!ctx.user){
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var Store = Brand.app.models.Store;
    var BrandCollection = Brand.getDataSource().connector.collection(Brand.modelName);
    var StoreCollection = Store.getDataSource().connector.collection(Store.modelName);
    async.parallel([
      function(async_cb) {
        // Reset Brand stats.
        BrandCollection.updateMany({
          "stats": {"$ne": null}
        }, {
          "$set": {"stats": {"inStores": 0, "inCells": 0}}
        }, async_cb);
      },
      function(async_cb) {
        // Get all brand id.
        Brand.find({
          "fields": ["id"],
          "where": {}
        }, async_cb);
      }
    ], function(err, results) {
      if (err) {
        return next(err);
      }

      Brand.rebuildStatByBrandIds(results[1]);
      return next(null, "All statistic of brands are started re-building.");
    });
  };

  Brand.incStatsMany = function(brandInStores, next) {
    for (var brandId in brandInStores) {
      // Skip loop if the property is from prototype.
      if (!brandInStores.hasOwnProperty(brandId)) {
        continue;
      }

      let updateData = brandInStores[brandId];
      updateData.brandId = brandId;
      Brand.incStats(updateData, function() {});
    }
    next();
  };

  Brand.incStats = function(data, next) {
    var ObjectID  = Brand.getDataSource().ObjectID;
    var BrandCollection = Brand.getDataSource().connector.collection(Brand.modelName);
    if (!ObjectID.isValid(data.brandId)) {
      return next();
    }

    var updateData = {
      "$inc": {
        "stats.inCells": data.inCells
      }
    };

    if (data.inStores) {
      updateData["$inc"]["stats.inStores"] = data.inStores;
    }

    BrandCollection.update({
      "_id": ObjectID(data.brandId)
    }, updateData, next);
  };

  Brand.getStatsById = function(id, full, next) {
    let getFullBrand = (full == 1);
    async.parallel([
      function(async_cb) {
        let fields = getFullBrand ? [] :  ["stats"];
        Brand.findById(id, {"fields": fields}, async_cb);
      },
      function(async_cb) {
        Brand.app.models.SalesHistory.getStatsBestSellerUser(id, async_cb);
      }
    ], function(err, results) {
      if (err) {
        return next(err);
      }

      let brand = results[0];
      let bestData = results[1];
      let res = {
        "stats": clone(brand.stats)
      }
      res["stats"]["inCellsAvg"] = 0;
      res["stats"]["bestProduct"] = bestData["bestSeller"];
      res["stats"]["bestUser"] = bestData["bestUser"];
      if (brand.stats["inStores"] && brand.stats["inCells"]) {
        res["stats"]["inCellsAvg"] = brand.stats["inCells"] / brand.stats["inStores"];
      }

      if (getFullBrand) {
        delete brand.stats;
        res["brand"] = brand;
        return next(null, res);
      }

      return next(null, res["stats"]);
    });
  };

  Brand.assignRandomProducts = function(brandId, next) {
    var ObjectID  = Brand.getDataSource().ObjectID;
   // console.log(ObjectID);
    if (!ObjectID.isValid(brandId)) {
      var error = new Error("Invalid brand Id");
      error.code = Brand.prefixError + "AR01";
      return next(error);
    }

    var limit = Brand.app.models.Setting.configs["LIMIT_PRODUCT_IN_BRAND"] || 20;
    var Product = Brand.app.models.Product;
    var ProductCollection = Product.getDataSource().connector.collection(Product.modelName);
    ProductCollection.aggregate([
      { "$match": {"brand.id": brandId.toString()}},
      { "$project": {"_id": true}},
      { "$sample": { "size": 20 } }
    ], function(err, products) {
      if (err) {
        return next(err);
      }

      let productIds = [];
      products.forEach(function(product) {
        productIds.push(product._id);
      });

      if (productIds.length === 0) {
        console.log(productIds.length);
        return next();
         
      }
      //trying console
     
      var BrandCollection = Brand.getDataSource().connector.collection(Brand.modelName);
      BrandCollection.update({
        "_id": ObjectID(brandId)
      }, {
        "$set": {
          "productIds": productIds
        }
      }, next);
    });
  };

  Brand.randomProductInBrands = function(ctx, next) {
    var error;
    Brand.find({
      "where": {
        "productIds": {"eq": null}
      },
      "fields": ["id"]
    }, function(err, foundBrands) {
      if (err) {
        return next(err);
      }

      var len = foundBrands.length;
      if (len === 0) {
        return next(null, "All brands contained product.");
      }
      // trying console
      console.log(len);  
      for (var i = 0; i < len; i++) {
        let brand = foundBrands[i];

        Brand.assignRandomProducts(brand.id, function() {});
      }

      next(null, "In-process assigning products into " + len + " brands.");
    });
  };

  Brand.beforeRemote("create", function(ctx, brand, next) {
    Brand.assignProducts(ctx, brand, false, next);
  });
  Brand.beforeRemote("prototype.updateAttributes", function(ctx, brand, next) {
    Brand.assignProducts(ctx, brand, ctx.req.params.id, next);
  });

  Brand.assignProducts = function(ctx, inst, brandId, next) {
    var error;
    var data = ctx.req.body;

    // Do nothing if productIds is empty.
    if (!data.productIds) {
      return next();
    }

    if (!brandId && data.productIds) {
      error = new Error("DO NOT allow to assign products while creating new brand.");
      error.code = error.code = Brand.prefixError + "AP00";
      return next(error);
    }

    if (!Array.isArray(data.productIds)) {
      error = new Error("Invalid parameters: list product IDs is not an array");
      error.code = "INVALID_PARAMETER";
      error.field = 'productIds';
      return next(error);
    }

    Brand.app.models.Product.find({
      "where": {
        "id": {"inq": data.productIds}
      },
      "fields": ["id", "brand"]
    }, function(err, foundProducts) {
      if (err) {
        return next(err);
      }
      var len = foundProducts.length;
      if (len === 0) {
        error = new Error("All product Ids are not found.");
        error.code = Brand.prefixError + "AP02";
        error.field = 'productIds';
        return next(error);
      }

      var productIds = [];
      var errorProductIds = [];
      for (var i = 0; i < len; i++) {
        let product = foundProducts[i];
        if (!product.brand || product.brand.id !== brandId) {
          errorProductIds.push(product.id);
        }
        else {
          productIds.push(product.id);
        }
      }

      if (errorProductIds.length > 0) {
        error = new Error("Some product Ids do not belongs to this brand: " + errorProductIds.toString());
        error.code = Brand.prefixError + "AP03";
        error.field = 'productIds';
        return next(error);
      }

      data.productIds = productIds;
      next();
    });
  };

  Brand.setup = function() {
    Brand.disableRemoteMethod('createChangeStream',true);
    Brand.disableRemoteMethod('upsert',true);
    Brand.disableRemoteMethod('exists',true);
    Brand.disableRemoteMethod('findOne',true);
    Brand.disableRemoteMethod('updateAll',true);
    Brand.disableRemoteMethod('upsertWithWhere',true);
    Brand.disableRemoteMethod('replaceOrCreate',true);
    Brand.disableRemoteMethod('replaceById',true);

    function validateName(err) {
      if(typeof this.name !== 'undefined' && this.name) {
        if(!validator.isLength(this.name, 1, 200)) {
          err();
        }
      }
    }
    Brand.validate('name', validateName, {message: 'Name is invalid'});

    Brand.validatesUniquenessOf('name', {message: 'name is used or invalid'});

    function validatePicture(err) {
      if(typeof this.picture !== 'undefined' && this.picture) {
        if(typeof this.picture !== 'object' || !this.picture.name || !this.picture.container) {
          err();
        }
      }
    }
    Brand.validate('picture', validatePicture, {message: 'Picture is invalid format'});

    function validateWebsite(cb_err, done) {
      var self = this;
      if(typeof this.website !== 'undefined' && this.website) {
        if( Object.prototype.toString.call( this.website ) === '[object Array]' ) {
          if(this.website.length > 0){
            var arrURLs = [];
            async.each(this.website, function(cururl,nextUrl){
              if(typeof cururl !== 'undefined' && cururl !== ""){
                var url = cururl;
                if(validator.isURL(url)){
                  if(arrURLs.indexOf(url) !== -1){
                    nextUrl(new Error("Website URL must be uinque"));
                  }
                  else{
                    arrURLs.push(url);
                    var where = {"website" : url};
                    if(self.id){
                      where.id = {"ne":self.id};
                    }
                    Brand.count(where,function(err,count){
                      if(err){
                        nextUrl(err);
                      }
                      else if(count > 0){
                        nextUrl(new Error("Website URL is already existed"));
                      }
                      else{
                        nextUrl();
                      }
                    })
                  }
                }
                else{
                  nextUrl(new Error("Website URL is invalid"));
                }
              }
              else{
                nextUrl(new Error("Website is invalid"));
              }
            },function(err){
              if(err){
                cb_err(err);
              }
              done();
            })
          }
          else{
            cb_err(new Error("Website is required"));
            done();
          }
        }
        else{
          cb_err(new Error("Website is required"));
          done();
        }
      } else{
        cb_err(new Error("Website is required"));
        done();
      }
    }
    Brand.validateAsync('website', validateWebsite, {message: 'Website is invalid'});

    function validateAffiliateNetwork(err) {
      if(typeof this.affiliateNetwork !== 'undefined' && this.affiliateNetwork) {
        if(this.affiliateNetwork.toLowerCase() !== 'cj' && this.affiliateNetwork.toLowerCase() !== 'ls' && this.affiliateNetwork.toLowerCase() !== 'fo') {
          err();
        }
      }
    }
    Brand.validate('affiliateNetwork', validateAffiliateNetwork, {message: 'Invalid affiliateNetwork'});
  }

  Brand.observe('before delete', function(ctx, next){
    var ObjectID  = Brand.getDataSource().ObjectID;
    if(typeof ctx.where.id === 'string') ctx.where.id = ObjectID(ctx.where.id);
    if( typeof ctx.where !== 'undefined' && ctx.where !== null){
      if( typeof ctx.where.id !== 'undefined' && ctx.where.id !== null){
        Brand.app.models.Product.findOne({
          'where' : {
            'brand.id' : ctx.where.id
          }
        }, function(err, found){
          if( err || found)
            next(new Error('Cannot delete'))
          else next();
        })

      } else next();
    } else next();
  })

  Brand.observe('before save', function (ctx, next) {
    var inst = {};
    /*
     *    prepare before Create
     */
    if(ctx.isNewInstance === true ) {
      if (ctx.instance && ctx.instance.name != '') {
        ctx.instance.name = ctx.instance.name.trim();
      }
      fn_beforeSave_one(ctx.instance, inst, next);
    }
    /*
     *  prepare before update
     *  PUT method or persistentModel.updateAttribute...... will apply this condition
     */
    else if(ctx.currentInstance){
      inst = ctx.currentInstance;
      fn_beforeSave_one(ctx.data,  inst, next);
    }
    /*
     *  prepare before update
     *  ***PersistentModel.updateAll, update .. with where condition
     */
    else if(!ctx.currentInstance && ctx.where){
      Brand.find({
        where : ctx.where
      }, function(err, arrList){
        if(err) next(err);
        else{
          async.each( arrList, function(item, cb_each){
            fn_beforeSave_one(ctx.data, item, cb_each);
          }, function(err){
            if(err) next(err);
            else next();
          })
        }
      })
    }
    else next(new Error('Something went wrong'));
  });

  /*
   *    data : input data use for create or update
   *    inst :  obj of current instance (for update only)
   */
  var fn_beforeSave_one = function(data, inst, next){
    var ObjectID  = Brand.getDataSource().ObjectID;
    var modelName = 'Brand';
    async.series([
      function(acs_one){
        if(inst.id){
          data.modified = new Date();
        }
        acs_one();
      },
      function(acs_one){
        if(!inst.id) {
          // add new
          if( typeof data.category === 'undefined' || data.category === null){
            var error = new Error("Missing parameter: category");
            error.code = "MISSING_PARAMETER";
            acs_one(error);
          }
          else if(data.category.length === 0) {
            error = new Error("Invalid parameters: category can not blank");
            error.code = "INVALID_PARAMETER";
            error.field = "category";
            acs_one(error);
          }
          else if(typeof data.affiliateNetwork === 'undefined') {
            var error = new Error("Missing parameter: affiliateNetwork");
            error.code = "MISSING_PARAMETER";
            acs_one(error);
          }
          else if(data.affiliateNetwork == '') {
            error = new Error("Invalid parameters: affiliateNetwork can not blank");
            error.code = "INVALID_PARAMETER";
            error.field = "affiliateNetwork";
            acs_one(error);
          }
          else acs_one();
        }
        else {
          // edit
          if(typeof data.category !== 'undefined' && data.category !== null) {
            if(data.category.length === 0) {
              error = new Error("Invalid parameters: category can not blank");
              error.code = "INVALID_PARAMETER";
              error.field = "category";
              acs_one(error);
            }
            else acs_one();
          }
          else if(typeof data.affiliateNetwork !== 'undefined' && data.affiliateNetwork !== '') {
            if(data.affiliateNetwork.toLowerCase() !== 'cj'
            && data.affiliateNetwork.toLowerCase() !== 'ls'
            && data.affiliateNetwork.toLowerCase() !== 'fo') {
              error = new Error("Invalid parameters: affiliateNetwork");
              error.code = "INVALID_PARAMETER";
              error.field = "affiliateNetwork";
              acs_one(error);
            }
            else
              acs_one();
          } 
          else acs_one();
        }
      },
      function(acs_one){
        if( data.category ) {
          async.each(data.category, function(itemCategory, cb_each){
            if(itemCategory.id) {
              if(typeof itemCategory.id === 'string') itemCategory.id = ObjectID(itemCategory.id);
              Brand.app.models.BrandCategory.findById(itemCategory.id, function(err, found){
                if(err || !found) {
                  if(err) cb_each(err);
                  else if(!found) {
                    error = new Error("Brand Category not found");
                    error.code = Brand.prefixError + "BS01";
                    cb_each(error);
                  }
                }
                else {
                  itemCategory['name'] = found.name;
                  cb_each();
                }
              })
            } else {
              error = new Error("Missing id in one or more of category items");
              error.code = Brand.prefixError + "BS02";
              cb_each(error);
            }
          }, acs_one)
        } else acs_one();
      },
      function(acs_one){
        if(inst.id && data.name) {
          Brand.app.models.Product.update({
            'brand.id': inst.id
          }, {
            'brand.name': data.name
          }, acs_one);
        } else {
          acs_one();
        }
      }
    ], function(err){
      if(err) next(err);
      else next();
    })
  }

  Brand.setup();
  Brand.remoteMethod(
    'rebuildStats' ,
    {
      accessType: 'WRITE',
      accepts: [
        { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Re-build brand statistic.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'put', path: '/rebuildStats'}
    }
  );

  Brand.remoteMethod(
    'randomProductInBrands' ,
    {
      accessType: 'WRITE',
      accepts: [
        { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Random products in brands.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'put', path: '/randomProductInBrands'}
    }
  );

  Brand.remoteMethod(
    'getStatsById' ,
    {
      accessType: 'READ',
      accepts: [
        {arg: 'id', type: 'string', required: true, http: {source: 'query'}, description: 'Brand ID'},
        {arg: 'full', type: 'string', http: {source: 'query'}, description: '1: get brand object detail, 0: Default - only get brand stats'},
      ],
      description: 'Get statistic by brandId',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'GET', path: '/stats'}
    }
  );
}
