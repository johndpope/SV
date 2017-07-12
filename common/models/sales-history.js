var validator = require('validator')
  , async = require('async');

module.exports = function(SalesHistory) {
  SalesHistory.prefixError = 'SHY_';

  SalesHistory.getFirstDateInWeek = function(date) {
    if (typeof date === 'undefined') {
      date = new Date();
    }
    let first = date.getDate() - date.getDay(); // First day is the day of the month - the day of the week
    let firstday = new Date(date.setDate(first));
    firstday.setHours(0,0,0,0);
    return firstday;
  };
  SalesHistory.getFistLastDateLastWeek = function(date) {
    if (typeof date === 'undefined') {
      date = new Date();
    }
    let last7days = new Date(date.setDate(date.getDate() - 7));

    let first = last7days.getDate() - last7days.getDay();
    let firstDay = new Date(last7days.setDate(first));
    let lastDay = new Date(last7days.setDate(first + 6));
    firstDay.setHours(0,0,0,0);
    lastDay.setHours(23,59,59,999);
    return [firstDay, lastDay];
  };

  // Write log per weeks.
  SalesHistory.writeLogs = function(logs, next) {
    let maxLen = logs.length;
    if (!maxLen) {
      return next();
    }

    var saleHistoryCollection = SalesHistory.getDataSource().connector.collection(SalesHistory.modelName);
    let createdDate = SalesHistory.getFirstDateInWeek(logs[0].created);
    for (let i = 0; i < maxLen; i++) {
      logs[i].created = createdDate;

      saleHistoryCollection.update({
        "created": createdDate,
        "ownerId": logs[i].ownerId,
        "productId": logs[i].productId
      }, {
        "$set": {
          "brandId": logs[i].brandId
        },
        "$inc": {
          "quantity": logs[i].quantity
        },
        "$push": {
          "customerType": logs[i].customerType
        }
      }, {
        "upsert": true
      }, function() {});
    }

    // No need to wait write log into db.
    next();
  };

  SalesHistory.buildCreatedFilter = function(where, isLastWeek) {
    if (typeof where !== 'object') {
      where = {};
    }
    if (typeof isLastWeek === 'undefined' || isLastWeek) {
      where.created = SalesHistory.getFistLastDateLastWeek();
    }

    if (!where.created || !Array.isArray(where.created) || where.created.length === 0) {
      return false;
    }

    var match = {};
    if (!Date.parse(where.created[0])) {
      return false;
    }
    if (where.created[1] && !Date.parse(where.created[1])) {
      return false;
    }

    var from = new Date(where.created[0]);
    from.setHours(0,0,0,0);
    match.created = {"$gte": from};
    if (where.created[1]) {
      var to = new Date(where.created[1]);
      to.setHours(23,59,59,999);
      match = {
        "$and": [
          {"created": {"$gte": from}},
          {"created": {"$lte": to}}
        ]
      }
    }
    return match;
  };

  // Check and get bestSellers, bestUsers from cache.
  SalesHistory.beforeRemote("**", function(ctx, ints, next) {
    if (ctx.method.stringName !== 'SalesHistory.bestSellers'
      && ctx.method.stringName !== 'SalesHistory.bestUsers') {
      return next();
    }

    var cache = SalesHistory.app.models.Cache;
    var cid = SalesHistory.app.models.Cache.createKey(ctx.method.stringName, ctx.req.query.filter || '');
    cache.get(cid, function(err, cached) {
      if (err || !cached) {
        return next();
      }
      ctx.res.send({
        "data": cached,
        "error": null
      });
    });
  });

  // Set cache: bestSellers, bestUsers
  SalesHistory.afterRemote("**", function(ctx, ints, next) {
    if (ctx.method.stringName !== 'SalesHistory.bestSellers'
      && ctx.method.stringName !== 'SalesHistory.bestUsers') {
      return next();
    }

    var cache = SalesHistory.app.models.Cache;
    var cid = SalesHistory.app.models.Cache.createKey(ctx.method.stringName, ctx.req.query.filter || '');
    var created = SalesHistory.getFirstDateInWeek();
    var ttl = 7 * 24 * 60 * 60;
    cache.set(cid, ctx.result, {"ttl": ttl, "created": created}, function() {});
    next();
  });

  SalesHistory.getStatsBestSellerUser = function(brandId, next) {
    var filter = '';
    let ObjectID = SalesHistory.getDataSource().ObjectID;
    if (brandId && ObjectID.isValid(brandId)) {
      filter = {
        "where": {
          "brandId": brandId
        }
      }
    }

    var cid1 = SalesHistory.app.models.Cache.createKey('SalesHistory.bestSellers', filter);
    var cid2 = SalesHistory.app.models.Cache.createKey('SalesHistory.bestUsers', filter);
    var cache = SalesHistory.app.models.Cache;

    var bestUser = false;
    var bestSeller = false;
    cache.getMultiple([cid1, cid2], function(err, cached) {
      if (cached) {
        let bestSellers = cached[cid1] || [];
        let bestUsers = cached[cid2] || [];

        if (bestSellers[0]) {
          bestSeller = bestSellers[0];
        }

        if (bestUsers[0]) {
          bestUser = bestUsers[0];
        }
      }

      var created = SalesHistory.getFirstDateInWeek();
      var ttl = 7 * 24 * 60 * 60;
      if (filter === '') {
        filter = {};
      }

      async.parallel([
        function(async_cb) {
          if (bestSeller) {
            return async_cb();
          }

          SalesHistory.bestSellers(filter, function(err, data) {
            if (err) {
              return async_cb(err);
            }

            cache.set(cid1, data, {"ttl": ttl, "created": created}, function() {});
            bestSeller = data[0] || null;
            async_cb(null, data[0]);
          });
        },
        function(async_cb) {
          if (bestUser) {
            return async_cb();
          }

          SalesHistory.bestUsers(filter, function(err, data) {
            if (err) {
              return async_cb(err);
            }

            cache.set(cid2, data, {"ttl": ttl, "created": created}, function() {});
            bestUser = data[0] || null;
            async_cb(null, data[0]);
          });
        }
      ], function(err, result) {
        if (err) {
          return next(err);
        }

        if (bestSeller) {
          delete bestSeller.exclusive;
          delete bestSeller.stores;
        }

        next(null, {
          "bestSeller": bestSeller,
          "bestUser": bestUser
        });
      });
    });
  };

  SalesHistory.bestSellers = function(filter, next) {
    filter = filter || {};

    var limit = SalesHistory.app.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'] || 30;
    var condition = {};
    var filterCreated = SalesHistory.buildCreatedFilter(filter.where);
    if (filterCreated) {
      condition = filterCreated;
    }

    var group = {"_id": "$productId", "totalSold": { "$sum": "$quantity" }};
    var lookup = { "from" : "Product", "localField" : "_id", "foreignField" : "_id", "as" : "product"};

    // best sell by brand.
    if (filter.where && (filter.where.perBrand == 1 || filter.where.perBrand == true)) {
      group = {"_id": "$brandId", "totalSold": { "$sum": "$quantity" }};
      lookup = { "from" : "Brand", "localField" : "_id", "foreignField" : "_id", "as" : "product"};
    }

    // best sell product in a specified brand.
    if (filter.where && filter.where.brandId) {
      let ObjectId = SalesHistory.getDataSource().ObjectID;
      if (!ObjectId.isValid(filter.where.brandId)) {
        var error = new Error("Invalid brand filter. Wrong brand ID");
        error.code = "INVALID_PARAMETER";
        error.field= "filter.where.brandId";
        return next(error);
      }
      condition.brandId = ObjectId(filter.where.brandId);
    }

    var saleHistoryCollection = SalesHistory.getDataSource().connector.collection(SalesHistory.modelName);
    var aggOpts = [
        { "$match": condition}
      , { "$group":  group}
      , { "$lookup": lookup }
      , { "$match": { "product": {"$ne": []} }} // check and only get product exist.
      , { "$sort": {"totalSold": -1} }
      , { "$skip": filter.offset || 0 }
      , { "$limit": filter.limit || limit }
    ];

    saleHistoryCollection.aggregate(aggOpts, function(err, products) {
      if(err) {
        return next(err);
      }
      if (!products || products.length === 0) {
        return next(null, []);
      }

      var rs = [];
      var i = 0;
      var max = products.length;
      for (; i < max; i++) {
        var item = products[i];
        if (item.product[0]) {
          // Product is exits.
          var rsItem = item.product[0];

          // Hide some fields in product.
          rsItem.totalSold = item.totalSold;
          rsItem.id = rsItem._id;
          delete rsItem._id;
          delete rsItem.stores;
          delete rsItem.stockRooms;
          rs.push(rsItem);
        }
        else {
          item.id = item._id;
          delete item._id;
          delete item.product;
          rs.push(item);
        }
      }
      next(null, rs);
    });
  };

  SalesHistory.bestUsers = function(filter, next) {
    filter = filter || {};

    var limit = SalesHistory.app.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'] || 30;
    var condition = {};
    var filterCreated = SalesHistory.buildCreatedFilter(filter.where);
    if (filterCreated) {
      condition = filterCreated;
    }

    // best sell product in a specified brand.
    if (filter.where && filter.where.brandId) {
      let ObjectId = SalesHistory.getDataSource().ObjectID;
      if (!ObjectId.isValid(filter.where.brandId)) {
        var error = new Error("Invalid brand filter. Wrong brand ID");
        error.code = "INVALID_PARAMETER";
        error.field= "filter.where.brandId";
        return next(error);
      }
      condition.brandId = ObjectId(filter.where.brandId);
    }

    var saleHistoryCollection = SalesHistory.getDataSource().connector.collection(SalesHistory.modelName);
    var aggOpts = [
        { "$match": condition}
      , { "$group": {"_id": "$ownerId", "totalSold": { "$sum": "$quantity" }} }
      , { "$lookup": { "from" : "Member", "localField" : "_id", "foreignField" : "_id", "as" : "owner"} }
      , { "$match": { "owner": {"$ne": []} }} // check and only get product exist.
      , { "$sort": {"totalSold": -1} }
      , { "$skip": filter.offset || 0 }
      , { "$limit": filter.limit || limit }
    ];
    saleHistoryCollection.aggregate(aggOpts, function(err, owners) {
      if(err) {
        return next(err);
      }
      if (!owners || owners.length === 0) {
        return next(null, []);
      }

      var rs = [];
      var i = 0;
      var max = owners.length;
      for (; i < max; i++) {
        var item = owners[i];
        if (item.owner[0]) {
          // Product is exits.
          var rsItem = item.owner[0];

          // Hide some fields in owner.
          rsItem.totalSold = item.totalSold;
          rsItem.id = rsItem._id;
          delete rsItem._id;
          delete rsItem.share;
          delete rsItem.events;
          delete rsItem.device;
          delete rsItem.noOfProdNotify;
          delete rsItem.password;
          rs.push(rsItem);
        }
        else {
          item.id = item._id;
          delete item._id;
          delete item.owner;
          rs.push(item);
        }
      }
      next(null, rs);
    });
  };

  SalesHistory.setup = function() {
    SalesHistory.disableRemoteMethod('create',true);
    SalesHistory.disableRemoteMethod('upsert',true);
    SalesHistory.disableRemoteMethod('createChangeStream',true);
    SalesHistory.disableRemoteMethod('exists',true);
    SalesHistory.disableRemoteMethod('findOne',true);
    SalesHistory.disableRemoteMethod('updateAll',true);
    SalesHistory.disableRemoteMethod('upsertWithWhere',true);
    SalesHistory.disableRemoteMethod('replaceOrCreate',true);
    SalesHistory.disableRemoteMethod('replaceById',true);
    SalesHistory.disableRemoteMethod('deleteById',true);
    SalesHistory.disableRemoteMethod('updateAttributes',false);

    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        if (!validator.isDate(this.created)) {
          cb();
        }
      }
    }
    SalesHistory.validate('created', validateCreated, {message: 'Invalid created'});
  };
  SalesHistory.setup();

  SalesHistory.remoteMethod(
    'bestSellers' ,
    {
      accessType: 'READ',
      accepts: [
        { arg: 'filter', type: 'object', description: 'Filter object', required: false, http: { source: 'query' }}
      ],
      description: 'Get best sellers.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'GET', path: '/bestSellers'}
    }
  );
  SalesHistory.remoteMethod(
    'bestUsers' ,
    {
      accessType: 'READ',
      accepts: [
        { arg: 'filter', type: 'object', description: 'Filter object', required: false, http: { source: 'query' }}
      ],
      description: 'Get best users.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'GET', path: '/bestUsers'}
    }
  );
};
