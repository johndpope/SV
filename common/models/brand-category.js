var loopback = require('loopback');
require('date-utils');
module.exports = function(Brandcategory) {
  Brandcategory.prefixError = "BRC_";
  Brandcategory.definition.rawProperties.created.default = 
    Brandcategory.definition.properties.created.default = function() {
    return new Date();
  };

  Brandcategory.observe('after save', function(ctx, next) {
    var Brand = Brandcategory.app.models.Brand;
    var instance = ctx.instance;
    var categoryId = instance.id;
    var categoryArr = [{
      id  : instance.id,
      name : instance.name
    }];
    Brand.updateAll({"category.id":categoryId}, {category:categoryArr}, function(err, info) {
      if(err) {
        next(err);
      } else {
        next();
      }
    });
  });

  Brandcategory.observe('before save', function(ctx, next) {
    if (ctx.currentInstance) {
      ctx.currentInstance.modified = new Date();
    }
    next();
  });

  Brandcategory.observe('before delete', function(ctx, next) {
    var Brand = Brandcategory.app.models.Brand;
    var id = ctx.where.id;
    Brand.find({
      'where' : {
        'category' : {
          elemMatch : {
            'id' : id
          }
        }
      }
    }, function(err, foundBrand) {
      if(err || !foundBrand) {
        next();
      } else {
        if(foundBrand.length > 0) {
          error = new Error("You need to remove categories in brand first");
          error.code = Brandcategory.prefixError + "BD01";
          next(error);
        } else {
          next();
        }
      }
    });
  });

  Brandcategory.setup = function() {
    Brandcategory.disableRemoteMethod('createChangeStream',true);
    Brandcategory.disableRemoteMethod('upsert',true);
    Brandcategory.disableRemoteMethod('exists',true);
    Brandcategory.disableRemoteMethod('findOne',true);
    Brandcategory.disableRemoteMethod('updateAll',true);
    Brandcategory.disableRemoteMethod('upsertWithWhere',true);
    Brandcategory.disableRemoteMethod('replaceOrCreate',true);
    Brandcategory.disableRemoteMethod('replaceById',true);
  }

  Brandcategory.setup();
};
