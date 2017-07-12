/*
* Hooks
* App ~ Deal.userInfo ~ get log-in User info
* App response
*/
const async = require('async');
const loopback = require('loopback');
const fs = require('fs');
const NodeCache = require( "node-cache" );

// This is used to validate unicode string and allow only - _ (space)  three special characters.
UNICODE_PATERN = "[\u0000-\u001F\u0021-\u002C\u002E-\u002F\u003A-\u0040\u005B-\u005E\u0060\u007B-\u00BF\u00D7\u00F7]";
// This class is used to generate filter
Filter = function Filter(filter) {
  if (filter instanceof Filter) {
    return filter;
  } else if(typeof filter === 'undefined' || filter == null) {
    return this;
  } else {
    var self = this;
    var properties = Object.keys(filter);
    async.each(properties, function(property, next_property) {
      if(filter[property] != null) {
        self[property] = filter[property];
      }
      next_property(null);
    }, function(err) {
      if(err) {
        return {};
      } else {
        return self;
      }
    });
  }
}
// Use this function to add condition to filter
// filter: current filter
// union_type: and - or
// conditions: where params. ex: {id: 'xxx'}
Filter.prototype.addConditions = function(conditions, union_type) {
  if(typeof union_type === 'undefined') {
    union_type = 'and';
  }
  if(typeof this.where === 'undefined') {
    this.where = {and: [conditions]};
  } else {
    // In case "where" not have both "and" and "or" operator
    if(typeof this.where.and === 'undefined' && typeof this.where.or === 'undefined') {
      if(union_type == 'and') {
        this.where = {and: [this.where]};
      } else {
        this.where = {or: [this.where]};
      }
    }
    // Add new conditions
    if(union_type == 'and') {
      if(typeof this.where.and === 'undefined') {
        this.where = {and: [{or: this.where.or}, conditions]};
      } else {
        this.where.and.push(conditions);
      }
    } else {
      if(typeof this.where.or === 'undefined') {
        this.where = {or: [{and: this.where.and}, conditions]};
      } else {
        this.where.or.push(conditions);
      }
    }
  }
}

// Add includes to filter
Filter.prototype.addInclude = function(include) {
  if(typeof include !== 'undefined' && include != null) {
    if(typeof this.include === 'undefined' || this.include == null) {
      this.include = include;
    } else {
      if(Array.isArray(this.include)) {
        this.include.push(include);
      } else {
        this.include = [this.include, include];
      }
    }
  }
}

Filter.prototype.existsInclude = function(include) {
  if(this.include) {
    if(Array.isArray(this.include)) {
      var blnExists = false;
      this.include.forEach(function(includeElement, index, arr) {
        if(typeof includeElement === 'string') {
          if(includeElement === include) {
            blnExists = true;
            return true;
          }
        } else if(typeof includeElement === 'object') {
          if(typeof includeElement.relation === include) {
            blnExists = true;
            return true;
          }
        }
      });
      return blnExists;
    } else {
      if(typeof this.include === 'string') {
        return (this.include === include);
      } else {
        if(typeof this.include.relation) {
          return (this.include.relation === include);
        } else {
          return false;
        }
      }
    }
  } else {
    return false;
  }
};

module.exports = function(server) {
  var remotes = server.remotes();
  var cacheConfigs = loopback.getConfigs().configs.caching;
  if (cacheConfigs.enable) {
    var myCache = new NodeCache(cacheConfigs.settings);
  }

  // Log restart Server.
  // Read logging-errors.txt.
  var now = new Date();
  var loggingMsg =   "RESTART on " + now + "\n";
  try {
    loggingMsg += "  " + fs.readFileSync("./iisnode/logging-errors.txt").toString();
    loggingMsg += "END\n\n";

    fs.writeFile("server.log", loggingMsg, { flag: 'a' }, function (err) {
      if (err) throw err;
    });
  } catch (e) {};

  // BEGIN: FORMATING THE RESPONSE
  // format response
  function formatResponse(data) {
    var finalResult = {
      "data": null, "error": null
    };

    // check if error happens
    if (typeof data !== 'undefined' && data) {
      if (typeof data.error !== 'undefined') {
        finalResult.error = data.error;

        // fulfill "details" if need
        finalResult.error.details = finalResult.error.details || null;
      }else {
        // else, set returned data
        finalResult.data = data;
      }
    }

    return finalResult;
  };

  // Generate key cache base on remote and args.
  function getCacheKey(ctx, plusCurrentUserIdRemoteMethods) {
    var data = {};
    for (var key in ctx.args) {
      if (key != 'ctx') {
        data[key] = ctx.args[key];
      }
    }
    var cacheKey = '';
    cacheKey = JSON.stringify(data, null);
    cacheKey = ctx.method.stringName + cacheKey;

    if (plusCurrentUserIdRemoteMethods.indexOf(ctx.method.stringName) > -1) {
      cacheKey += ctx.req.user.id.toString();
    }

    return cacheKey;
  };

  function preprocessBeforeRemote (ctx, userInfo) {
    var modelName = ctx.method.stringName;
    if(modelName && typeof modelName !== 'undefined' && modelName !== '') {
      modelName = modelName.split('.')[0];
      if(modelName !== 'Setting') {
        if(typeof ctx.method.name !== 'undefined' && (ctx.method.name == 'find' || ctx.method.name == 'count'
          || ctx.method.stringName === 'Stockroom.getListBrands' || ctx.method.stringName === 'Stockroom.getListProductsIncludedProduct')) {
          var filterLimit = server.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'] || 30;
          var filter = ctx.args.filter;

          if(typeof filter !== 'undefined') {
            try {
              filter = JSON.parse(filter);
            } catch(e) {};
            if(typeof filter.limit !== 'undefined') {
              var limit = filter.limit;
              if(limit > filterLimit) {
                filter.limit = filterLimit;
              }
            } else {
              filter["limit"] = filterLimit;
            }
            ctx.args.filter = filter;
          } else {
            ctx.args.filter = {"limit": filterLimit};
          }

          // Only apply default condition for these Model.
          var modelList = ['Customer', 'Store', 'MemberBooster', 'Order', 'CashOutMoney', 'Safebox', 'Staff'];
          var conditions = (ctx.args.filter ? ctx.args.filter["where"]: null) || ctx.args.where || {};
          if (modelList.indexOf(modelName) == -1) {
            return ;
          }

          if (conditions || typeof conditions != 'undefined') {
            try {
              conditions = JSON.parse(conditions);
            } catch (e) {};
          }

          if(userInfo && typeof userInfo.type !== 'undefined' && userInfo.type.indexOf(MEMBER_TYPES.USER) > -1 && userInfo.type.indexOf(MEMBER_TYPES.ADMIN) == -1 ) {
            if(modelName == 'Customer') {
              conditions.customerPlayerId = userInfo.id;
            }
            else if(modelName == 'Store') {
              conditions.id = userInfo.storeId;
            }
            else if(modelName == 'MemberBooster' || modelName == 'Order') {
              conditions.memberId = userInfo.id;
            }
            else if(modelName == 'CashOutMoney') {
              conditions.ownerId = userInfo.id;
            }
            else if(modelName == 'Safebox' || modelName == 'Staff') {
              conditions.storeId = userInfo.storeId;
            }
          }

          if (ctx.method.name == 'find') {
            ctx.args.filter["where"] = conditions;
          }
          else {
            ctx.args.where = conditions;
          }
        }
      }
    }
  };

  // Before remote, set request info into CurrentContext.
  remotes.before('**', function (ctx, next) {
    if (server.get('debugSV')) {
      var nowUTC = new Date();
      console.log('=====> START REQUEST', nowUTC);
      console.log('request: ' + ctx.req.method, ctx.req.originalUrl);
      console.log('request: Query string', ctx.req.query);
      console.log('request: Body', ctx.req.body);
      console.log('accessToken', ctx.req.accessToken);
    }

    server.models.Member.getCurrentUser(ctx, function(err, userInfo) {
      if (err) {
        return next(err);
      }
      ctx.req.user = userInfo;

      preprocessBeforeRemote(ctx, userInfo);
      if (!cacheConfigs.enable) {
        return next();
      }

      // Process common CACHE for GET method API.
      // We process cache here due to we hook and modify ctx.args here.
      if (ctx.req.method !== 'GET' || cacheConfigs.excludedRemoteMethods.indexOf(ctx.method.stringName) > -1) {
        return next();
      }

      var cacheKey = getCacheKey(ctx, cacheConfigs.cacheKeyPlusCurrentUserId);
      ctx.hookState = {};
      ctx.hookState.cacheKey = cacheKey;
      myCache.get(cacheKey, function(err, value) {
        if (err || !value || typeof value == 'undefined') {
          return next();
        }

        ctx.res.send(value);
      });
      // End CACHE.
    });
  });

  // modify format of successful response
  remotes.after('**', function (ctx, next) {
    var isSpecialResponse = false;
    var methodName = ctx.method.stringName;

    if(typeof ctx.result !== 'undefined' && ctx.result !== null && ctx.result.hasOwnProperty('keepFormat'))
      isSpecialResponse = true;

    if (isSpecialResponse === true){
      delete ctx.result.keepFormat;
    } else {
      ctx.result = formatResponse(ctx.result);
    }
    if (server.get('debugSV')) {
      var nowUTC = new Date();
      console.log('Response', ctx.result);
      console.log('END REQUEST', nowUTC);
    }

    if (!cacheConfigs.enable) {
      return next();
    }
    // Process CACHE for GET method API.
    // We process cache here due to we hook and modify ctx.result here.
    if (ctx.req.method !== 'GET' || cacheConfigs.excludedRemoteMethods.indexOf(ctx.method.stringName) > -1) {
      return next();
    }
    try {
      var cacheKey = ctx.hookState.cacheKey;
      myCache.set(cacheKey, ctx.result, function(err, success ){
        next();
      });
    } catch(e) {
      next();
    }
    // End CACHE.
  });

  // modify format of error-related response
  var opts = remotes.options || {};
  opts.errorHandler = {
    'handler': function restErrorHandler(err, req, res, next) {

      if(typeof err === 'string') {
        err = new Error(err);
        err.status = err.statusCode = 200;
      }

      res.statusCode = res.statusCode || err.statusCode || err.status || 200;

      //debug('Error in %s %s: %s', req.method, req.url, err.stack);
      var data = {
        name: err.name,
        status: res.statusCode,
        message: err.message || err.toString() || 'An unknown error occurred'
      };
      if (typeof err == 'object') {
        for (prop in err) {
          data[prop] = err[prop];
        }
      }

      if (err.name == 'ValidationError' && !err.code) {
        data.code = 'INVALID_PARAMETER';
      }

      data.code = data.code ? data.code + "" : "UNKNOWN_ERROR"; // make sure error.code is string.
      data.stack = undefined;
      if (process.env.NODE_ENV != 'production') {
        data.stack = err.stack || undefined;
      }
      loopback.stocket.writeErrorLog(err, req, res, "hook.js");

      if (res.statusCode !== 302) {
        var response = formatResponse({'error': data});
        if (server.get('debugSV')) {
          var nowUTC = new Date();
          console.log('Response - ERROR: ', response);
          console.log('END REQUEST', nowUTC);
        }
        res.send(response);
      } else {
        res.status(res.statusCode);
        res.location(err.location);
        res.send();
      }
    }
  }
  remotes.options =  opts;

  // END: FORMATING THE RESPONSE

  // BEGIN: LOAD SYSTEM SETTINGS
  server.models.Setting.encodeValue = function(type, value) {
    switch(type){
      case "integer":
        value = parseInt(value);
        break;
      case "float":
        value = parseFloat(value);
        break;
      case "json_object":
      case "json_array":
        value = JSON.parse(value);
        break;
    }
    return value;
  }

  server.models.Setting.configs = {};
  server.models.Setting.configs.modified = +new Date();
  server.models.Setting.find({"fields": ['configName', 'configValueType', 'configValue']}, function(err, settings){
    if(!err && settings && settings.length > 0) {
      settings.forEach(function(element) {
        server.models.Setting.configs[element.configName] = server.models.Setting.encodeValue(element.configValueType, element.configValue);
      });
    }
  });

  // END: LOAD SYSTEM SETTINGS
};

/*
  Re-define 'round', 'floor', 'ceil' to support precision as second argument (optional)
  - precision < 0, round/floor/ceil to the left
  - precision > 0, round/floor/ceil to the right

  var a = 48000.12345;
  var b = Math.round(a, -4); // 50000

  var a = 48000.12345;
  var b = Math.round(a, -4); // 40000

  var a = 48000.12345;
  var b = Math.round(a, 4); // 48000.1235
*/
var MathFns = ['round', 'floor', 'ceil' ];
async.each(MathFns, function(fnName, callback) {
  Math['_' + fnName] = Math[fnName];
  Math[fnName] = function(number, precision)
  {
    var blnToLeft = (precision < 0) ? true : false;

    precision = Math.abs(parseInt(precision)) || 0;
    var coefficient = Math.pow(10, precision);

    var result = null;
    if (blnToLeft) {
      result = Math['_' + fnName](number/coefficient)*coefficient;
    } else {
      result = Math['_' + fnName](number*coefficient)/coefficient;
    }
    return result;
  }
}, function(err){
    if( err ) {
      console.log('A fnName definition failed to process');
    } else {
      console.log('All fnName definitions have been processed successfully');
    }
});

Math.roundExcel = function(number, base) {
  base = parseInt(base);
  if (base >= 0) {
    return Math.round(number, base);
  }

  var str = "" + number;
  var absBase = Math.abs(base);
  var max = str.length - absBase;
  var prefix = "";
  for (var i = 0; i < max; i++) {
    prefix += "" + str[i];
  }

  var suffix = "";
  for (var i = max; i <= str.length; i++) {
    suffix += "" + str[i];
  }

  var pow = Math.pow(10, absBase);
  var div = parseInt(suffix) / pow;

  var rs = parseInt(prefix) * pow;
  if (div >= 0.5) {
    rs += pow;
  }

  return rs;
}
