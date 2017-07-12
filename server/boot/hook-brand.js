/*
* Hooks
* Brand.Find
*/
var async = require('async');
var clone = require('clone');
var traverse = require('traverse');

module.exports = function(server) {
  var Brand = server.models.Brand;
  var find = Brand.find;
  var connector = Brand.getDataSource().connector;
  var ObjectID  = Brand.getDataSource().ObjectID;
  server.models.Brand.findBase = clone(Brand.find);


  // START: OVERWRITE METHOD BRAND.FIND
  Brand.find = function() {
    var filter  = arguments[0];
    var next    = arguments[1];
    if(arguments.length > 2) {
      options = arguments[1];
      next    = arguments[2];
    }

    var filters = new Filter(filter);

    // if client submit where it will be added to the final
    delete filters.where;

    async.parallel([
      // convert to ObjectId where elemMatch exist in filter
      // ex : filter={"where":{"warehouses":{"elemMatch":{"id":"wh1","memberId":"551cfeb676cce6df0f3536b1"}}}}
      function(acp_one){
        if(filter) {
          if(filter.where) {
            var elemMatch_obj= {}
            traverse(filter).forEach(function (x) {
              if(x){
                if(x.elemMatch) {
                  // get object in elemMatch
                  elemMatch_obj = x.elemMatch;
                  return;
                }
              }
            });
            for(var key in elemMatch_obj){
              if(ObjectID.isValid(elemMatch_obj[key])) {
                // if value of key is ObjectId
                // convert to ObjectId
                elemMatch_obj[key] = ObjectID(elemMatch_obj[key]);
              }
            }
          }
        }
        acp_one();
      },
      
    ], function(err) {
      if(err) {
        next(err);
      } else {
        // Add original where filters
        if(typeof filter !== 'undefined' && filter.where) {
          filters.addConditions(filter.where, 'and');
        } else {
          filter = {}
        }

        // execute find with new filter
        var override = function(err, brands) {
          if(err) {
            next(err);
          } else {
            filters.fields = filter.fields;
            next(null, brands);
          }
        };

        // Override arguments
        arguments[0] = filters;
    
        if(arguments.length > 2) {
          arguments[2] = override;
        } else {
          arguments[1] = override;
        }

        // Override arguments
        arguments[0] = filters;
        find.apply(Brand, arguments);
      }
    });
  }
  // END: OVERWRITE METHOD BRAND.FIND
};
