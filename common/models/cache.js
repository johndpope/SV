'use strict';

module.exports = function(Cache) {
  var ttl = 1800; // Default ttl: 30 minutes;

  /**
   * Build cache key.
   * @param  {string} funcName Model.functionName
   * @param  {mixed} options  String or object.
   * @return {[type]}          [description]
   */
  Cache.createKey = function(funcName, options) {
    let key = funcName;
    if (typeof options == 'string') {
      try {
        options = JSON.parse(options);
      } catch(e) {
        options = {};
      }
    }

    options = JSON.stringify(options, null);
    var crypto = require('crypto');
    key += "." + crypto.createHash('md5').update(options).digest("hex");

    return key;
  };

  Cache.get = function(cid, next) {
    Cache.find({
      "where": {
        "cid": cid
      }
    }, function(err, data) {
      if (err) {
        return next(err);
      }
      if (data.length === 0) {
        return next();
      }

      // Check cache expired.
      let cached = data[0];
      let now = +new Date();
      let created = +new Date(cached.created);
      let diff = (now - created) / 1000; // convert ms to s.
      if (diff < cached.ttl) {
        return next(null, cached.value);
      }

      return next();
    });
  };

  Cache.getMultiple = function(cids, next) {
    if (!Array.isArray(cids)) {
      return next();
    }

    Cache.find({
      "where": {
        "cid": {"inq": cids}
      }
    }, function(err, data) {
      if (err) {
        return next(err);
      }
      let max = data.length;
      if (max === 0) {
        return next();
      }

      let rs = {};
      for (let i = 0; i < max; i++) {
        // Check cache expired.
        let cached = data[i];
        let now = +new Date();
        let created = +new Date(cached.created);
        let diff = (now - created) / 1000; // convert ms to s.
        let value = null;
        if (diff < cached.ttl) {
          value = cached.value;
        }
        rs[cached.cid] = value;
      }

      return next(null, rs);
    });
  };

  /**
   * Cache set
   * @param {string}   cid   Cache ID
   * @param {any}      value Cache data
   * @param {number, object, function}   opts
   * @param {Function} next  [description]
   */
  Cache.set = function(cid, value, opts, next) {
    let typeofOpts = typeof opts;
    let cacheData = {
      "value": value,
      "ttl": ttl,
      "created": new Date()
    };

    if (typeofOpts === 'function') {
      next = opts;
    }
    else if (typeofOpts === 'number'){
      cacheData.ttl = opts;
    }
    else if (typeofOpts === 'object') {
      cacheData.ttl = opts.ttl ? opts.ttl : cacheData.ttl;
      cacheData.created = opts.created ? opts.created : cacheData.created;
    }

    var cacheCollection = Cache.getDataSource().connector.collection(Cache.modelName);
    cacheCollection.update({
      "cid": cid
    }, {
      "$set": cacheData
    }, {
      "upsert": true
    }, next);
  };

  Cache.del = function(cid, next) {
    Cache.destroyAll({"cid": cid}, next);
  };
};
