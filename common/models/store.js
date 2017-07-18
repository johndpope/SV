var validator = require('validator')
  , async = require('async')
  , clone = require('clone')
  , loopback = require('loopback')
  , request = require('request')
  , assert = require('assert')
  , util = require('util')
  , url = require('url')
  , _ = require('underscore');
require('date-utils');

var airbrake = require('airbrake').createClient(
  '149693', // Project ID
  'b9b4e212b7bac3c5a069325a4e8e63fd' // Project key
);
KEY_UNLOCK_STATUS_COLLECTABLE = 'collectable';
KEY_UNLOCK_STATUS_COLLECTED = 'collected';
KEY_UNLOCK_STATUS_ONGOING = 'ongoing';
KEY_UNLOCK_STATUS = [KEY_UNLOCK_STATUS_ONGOING, KEY_UNLOCK_STATUS_COLLECTABLE, KEY_UNLOCK_STATUS_COLLECTED];

STORE_STATUS_OPEN = 'open';
STORE_STATUS_OVERTIME = 'overtime';
STORE_STATUS_CLOSING = 'closing';
STORE_STATUS_CLOSED = 'closed';
STORE_STATUS = [STORE_STATUS_OPEN, STORE_STATUS_OVERTIME, STORE_STATUS_CLOSING, STORE_STATUS_CLOSED];

STORE_ENV_DAY = 'day';
STORE_ENV_NIGHT = 'night';
STORE_ENV = [STORE_ENV_DAY, STORE_ENV_NIGHT];

STORE_CONSTRUCTION_STATUS_INACTIVE = 'inactive';
STORE_CONSTRUCTION_STATUS_READY = 'ready';
STORE_CONSTRUCTION_STATUS_ONGOING = 'ongoing';
STORE_CONSTRUCTION_STATUS_FINISHED = 'finished';
STORE_CONSTRUCTION_STATUS = [
  STORE_CONSTRUCTION_STATUS_INACTIVE,
  STORE_CONSTRUCTION_STATUS_READY,
  STORE_CONSTRUCTION_STATUS_ONGOING,
  STORE_CONSTRUCTION_STATUS_FINISHED
];

STORE_CONSTRUCTION_TYPE_LEVEL = 'level';
STORE_CONSTRUCTION_TYPE_STAGE = 'stage';
STORE_CONSTRUCTION_TYPE_CELL = 'cell';
STORE_CONSTRUCTION_TYPE = [
  STORE_CONSTRUCTION_TYPE_LEVEL,
  STORE_CONSTRUCTION_TYPE_STAGE,
  STORE_CONSTRUCTION_TYPE_CELL
];

STORE_CELL_STATUS_INVISIBLE = 'invisible';
STORE_CELL_STATUS_UNDER_CONSTRUCTION = 'under_construction';
STORE_CELL_STATUS_UNASSIGNED = 'unassigned';
STORE_CELL_STATUS_ASSIGNED = 'assigned';
STORE_CELL_STATUS_UNBUILT = 'unbuilt';
STORE_CELL_STATUS = [
  STORE_CELL_STATUS_INVISIBLE,
  STORE_CELL_STATUS_UNDER_CONSTRUCTION,
  STORE_CELL_STATUS_UNASSIGNED,
  STORE_CELL_STATUS_ASSIGNED,
  STORE_CELL_STATUS_UNBUILT
];

STORE_ELEVATOR_POSITION_LEFT = 'left';
STORE_ELEVATOR_POSITION_RIGHT = 'right';
STORE_ELEVATOR_POSITION = [
  STORE_ELEVATOR_POSITION_LEFT,
  STORE_ELEVATOR_POSITION_RIGHT
]
module.exports = function (Store) {

  Store.prefixError = "STO_";
  // Workaround for https://github.com/strongloop/loopback/issues/292
  Store.definition.rawProperties.name.default =
    Store.definition.properties.name.default = function () {
      return Store.getGeneratedStoreName();
    };

  //define evelator:
  Store.definition.rawProperties.elevator.default =
    Store.definition.properties.elevator.default = function () {
      return {
        "level": 1,
        "location": "left"
      }
    };

  Store.definition.rawProperties.cells.default =
    Store.definition.properties.cells.default = function () {
      return [
        {
          "number": 1,
          "products": {},
          "status": STORE_CELL_STATUS_UNASSIGNED
        }
        , {
          "number": 2,
          "products": {},
          "status": STORE_CELL_STATUS_UNASSIGNED
        }
        , {
          "number": 3,
          "products": {},
          "status": STORE_CELL_STATUS_UNASSIGNED
        }
      ];
    };

  Store.definition.rawProperties.keyGenerationStatus.default =
    Store.definition.properties.keyGenerationStatus.default = function () {
      return null;
    };

  Store.definition.rawProperties.openTime.default =
    Store.definition.properties.openTime.default = function () {
      return null;
    };

  Store.definition.rawProperties.openStatus.default =
    Store.definition.properties.openStatus.default = function () {
      return STORE_STATUS_CLOSED;
    };

  Store.definition.rawProperties.activeCells.default =
    Store.definition.properties.activeCells.default = function () {
      return 3;
    };

  Store.definition.rawProperties.closingTime.default =
    Store.definition.properties.closingTime.default = function () {
      return 0;
    };

  Store.definition.rawProperties.environment.default =
    Store.definition.properties.environment.default = function () {
      return STORE_ENV_DAY;
    };

  Store.definition.rawProperties.displayCloseout.default =
    Store.definition.properties.displayCloseout.default = function () {
      return false;
    };

  Store.definition.rawProperties.constructionTime.default =
    Store.definition.properties.constructionTime.default = function () {
      return 0;
    };

  Store.definition.rawProperties.constructionStatus.default =
    Store.definition.properties.constructionStatus.default = function () {
      return null;
    };

  Store.definition.rawProperties.constructionType.default =
    Store.definition.properties.constructionType.default = function () {
      return null;
    };

  Store.definition.rawProperties.constructionStartDate.default =
    Store.definition.properties.constructionStartDate.default = function () {
      return null;
    };

  Store.definition.rawProperties.constructionTotalDuration.default =
    Store.definition.properties.constructionTotalDuration.default = function () {
      return 0;
    };

  Store.definition.rawProperties.noOfProducts.default =
    Store.definition.properties.noOfProducts.default = function () {
      return 0;
    };

  Store.definition.rawProperties.crowd.default =
    Store.definition.properties.crowd.default = function () {
      return Store.app.models.Setting.configs['STORE_INIT_NO_OF_CROWD'];
    };

  Store.definition.rawProperties.lastOpen.default =
    Store.definition.properties.lastOpen.default = function () {
      return null;
    };

  Store.definition.rawProperties.totalStar.default =
    Store.definition.properties.totalStar.default = function () {
      return 1;
    };
  Store.definition.rawProperties.statistic.default =
    Store.definition.properties.statistic.default = function () {
      return {
        "money": 0,
        "total_spawned_customers": 0,
        "total_satisfied_customers": 0,
        "event_satisfied_customers": 0,
        "customer_specific": 0,
        "customer_impulse": 0,
        "customer_window": 0,
        "customer_bigspender": 0,
        "customer_leprechaun": 0,
        "customer_vip": 0,
        "customer_specific_sold": 0,
        "customer_impulse_sold": 0,
        "customer_window_sold": 0,
        "customer_bigspender_sold": 0,
        "customer_leprechaun_sold": 0
      }
    };
  Store.definition.rawProperties.bestScore.default =
    Store.definition.properties.bestScore.default = function () {
      return {
        "money": 0,
        "openTime": 0
      };
    };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Store.definition.rawProperties.created.default =
    Store.definition.properties.created.default = function () {
      return new Date();
    };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Store.definition.rawProperties.modified.default =
    Store.definition.properties.modified.default = function () {
      return new Date();
    };

  Store.observe('before save', function (ctx, next) {
    if (ctx.instance) {
      ctx.instance.modified = new Date();
    }
    next();
  });

  Store.startVipCustomerTimer = function () {
    return {
      "status": KEY_UNLOCK_STATUS_ONGOING, // ongoing, collectable, collected. Status the save Key generation.
      "startDate": new Date(),
      "totalDuration": Store.app.models.Setting.configs['CUSTOMER_VIP_GENERATE_DURATION']
    };
  };

  Store.prototype.update = function (data, next) {
    var store = this;
    store.isValid(function (valid) {
      if (!valid) {
        err = new Error('Invalid parameters');
        err.code = 'MISSING_PARAMETER';
        err.statusCode = 400;
        err.detail = store.errors;
        next(err);
      } else {
        var dataSet = data.set;
        var dataInc = data.inc;
        var options = { new: true, upsert: false };

        if (typeof dataSet === 'undefined') {
          dataSet = clone(store.__data);
          if (typeof dataInc !== 'undefined') {
            for (property in dataSet) {
              if (typeof dataInc[property] !== 'undefined') {
                delete dataSet[property];
              }
            }
          }
          dataSet.modified = new Date();
          delete dataSet['id'];
        }

        if (typeof data.new !== 'undefined') {
          options['new'] = data.new;
        }

        if (typeof data.upsert !== 'undefined') {
          options['upsert'] = data.upsert;
        }

        var whereCondition = { _id: store.id };
        var updateValue = { $set: dataSet };
        if (typeof dataInc !== 'undefined') {
          updateValue['$inc'] = dataInc;
        }
        var sortOrder = [['_id', 'asc']];
        var collection = Store.getDataSource().connector.collection(Store.modelName);
        collection.findAndModify(
          whereCondition,
          sortOrder,
          updateValue,
          options,
          function (err, result) {
            if (err) {
              next(err);
            } else if (!result.value) {
              next(new Error('Invalid update process'));
            } else {
              store.__data = result.value;
              next();
            }
          }
        );
      }
    });
  };

  Store.getGeneratedStoreName = function () {
    return "";
  };

  Store.isNameUpdated = function (store) {
    if (store && store.name != "") {
      return true;
    }

    return false;
  };

  Store.getTheBestOpenTime = function (store) {
    var totalOpenTime = 0;
    if (store.totalOpenTime) {
      totalOpenTime = store.totalOpenTime;
    }

    if (store.bestScore && store.bestScore.openTime) {
      if (store.bestScore.openTime > totalOpenTime) {
        totalOpenTime = store.bestScore.openTime;
      }
    }

    return totalOpenTime;
  };

  Store.getNoOfBrands = function (store) {
    var count = 0;
    for (var i = 0; i < store.cells.length; i++) {
      var cell = store.cells[i];
      if (cell.brandId) {
        count++;
      }
    }

    return count;
  }

  Store.tmpFunc = function (totalSale, ctx, next) {
    var totalStar = Store.calcTotalStarByTotalSale(totalSale);
    var updateData = { "totalStar": totalStar };

    if (ctx.user) {
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!userInfo.storeId) {
      updateData.msg = "Can not update totalStar into db.";
      return next(null, updateData);
    }

    Store.update({ "id": userInfo.storeId }, updateData, function (err, result) {
      if (err) {
        next(err);
      }
      else {
        if (result.count > 0) {
          return next(null, updateData);
        }
        return next(null, "Update store is failed.");
      }
    });
  };

  Store.tmpFunc2 = function (totalStars, ctx, next) {
    var rs = Store.calcTotalSaleByTotalStar(totalStars);
    var rank = Store.app.models.Member.calcRankByTotalStar(totalStars);
    next(null, { "totalSale": parseInt(rs), "rank": rank });
  };

  // Update statistic: "total_satisfied_customers" in Member collection.
  Store.tmpMigrateStatsCustomers = function (next) {
    var Member = Store.app.models.Member;
    Member.find({
      "fields": ["id", "storeId", "total_satisfied_customers", "total_spawned_customers"],
      "where": {
        "storeId": { "neq": null },
        "or": [
          { "total_satisfied_customers": { "eq": null } },
          { "total_spawned_customers": { "eq": null } }
        ]
      },
      "limit": 1000,
    }, function (err, foundMembers) {
      if (err) {
        return next(err);
      }
      if (foundMembers.length == 0) {
        return next(null, "Done migrating data.");
      }

      var maxLen = foundMembers.length;
      var count = 0;
      foundMembers.forEach(function (foundMember) {
        Store.findById(foundMember.storeId, { "fields": ["totalStar"] }, function (err, foundStore) {
          if (err) {
            return next(err);
          }

          var storeData = foundStore || {};
          var totalCustomers = Store.calcTotalSaleByTotalStar(storeData.totalStar);
          var updateData = {
            "total_satisfied_customers": totalCustomers,
            "total_spawned_customers": totalCustomers
          };
          if (foundMember.total_satisfied_customers) {
            delete updateData.total_satisfied_customers;
          }
          Member.updateAll({ "id": foundMember.id }, updateData, function (err) {
            count++;
            if (err) {
              return next(err);
            }

            if (count >= maxLen) {
              next(null, "Done " + maxLen + " documents.");
            }
          });
        });
      });
    });
  };

  Store.calcTotalSaleByTotalStar = function (totalStars) {
    if (totalStars <= 1) {
      return 0;
    }
    var maxCells = parseInt(Store.app.models.Setting.configs['CELL_ASSIGNMENT_MAX']);
    if (totalStars > maxCells) {
      totalStars = maxCells;
    }

    var xA = Store.app.models.Setting.configs['PLAYER_STAR_CALC_VALUE_XA'] || 150;
    var xB = Store.app.models.Setting.configs['PLAYER_STAR_CALC_EXP_XB'] || 1.16;
    var xC = Store.app.models.Setting.configs['PLAYER_STAR_CALC_ADDITION_XC'] || 182;

    var requiredPrice = Math.round(xA * (totalStars - 1) * Math.pow(xB, totalStars) - xC);
    var requiredPriceRound = Math.roundExcel(requiredPrice, -Math.floor(Math.log10(requiredPrice) / Math.log10(10) - 1, 0));

    return requiredPriceRound;
  }

  Store.calcTotalStarByTotalSale = function (totalSale) {
    var requiredPrice = 0;
    var rs = 1;
    var maxCells = parseInt(Store.app.models.Setting.configs['CELL_ASSIGNMENT_MAX']);
    var requiredStatisfiedList = Store.app.models.Setting.configs['STORE_UPGRADE_STATISFIED_LIST'];
    var prefix = "cell";
    if (isNaN(totalSale)) {
      return rs;
    }

    totalSale = parseInt(totalSale); // total in float, but requiredPrice is Int. So we don't care.
    for (var cellNo = 1; cellNo <= maxCells; cellNo++) {
      requiredPrice = requiredStatisfiedList[prefix + cellNo];

      if (totalSale < requiredPrice) {
        break;
      }

      rs = cellNo;
    }
    return rs;
  };

  Store.calcListPriceToUpgradeACell = function () {
    var maxCells = parseInt(Store.app.models.Setting.configs['CELL_ASSIGNMENT_MAX']);
    var stageCells = [2, 5, 7, 13, 16, 25, 29, 41, 46];
    var levelCells = [3, 9, 19, 33];
    var level = 1;
    var priceLevel = 1000000;
    var priceStage = 100000;
    var priceCell = 10000;

    var rs = {};
    var prefix = "cell";
    var price = 0;

    rs[prefix + 1] = price;
    for (var cellNo = 2; cellNo <= maxCells; cellNo++) {
      price = priceCell * level;
      if (stageCells.indexOf(cellNo) > -1) {
        price = priceStage * level;
      }
      else if (levelCells.indexOf(cellNo) > -1) {
        level++;
        price = priceLevel * level;
      }

      rs[prefix + cellNo] = price;
    }

    return rs;
  };
  Store.calcListTotalStatisfiedToUpdateStars = function () {
    var maxCells = parseInt(Store.app.models.Setting.configs['CELL_ASSIGNMENT_MAX']);

    var rs = {};
    var prefix = "cell";

    rs[prefix + 1] = 0;
    rs[prefix + 2] = 5;
    rs[prefix + 3] = 15;
    rs[prefix + 4] = 40;
    for (var cellNo = 5; cellNo <= maxCells; cellNo++) {
      requiredPrice = Store.calcTotalSaleByTotalStar(cellNo);

      rs[prefix + cellNo] = requiredPrice;
    }
    return rs;
  };

  Store.updateStatus = function (data, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (typeof data !== 'undefined') {
      var missing = [];
      if (typeof data.openTime === 'undefined') {
        missing.push('openTime');
      }
      if (typeof data.openStatus === 'undefined') {
        missing.push('openStatus');
      }

      if (typeof data.closingTime === 'undefined') {
        missing.push('closingTime');
      }
      if (typeof data.environment === 'undefined') {
        missing.push('environment');
      }
      if (typeof data.displayCloseout === 'undefined') {
        missing.push('displayCloseout');
      } else {
        if (!validator.isBoolean(data.displayCloseout)) {
          return next("Invalid displayCloseout");
        }
      }

      if (missing.length) {
        err = new Error('Missing information: ' + missing.join(' '));
        err.statusCode = 400;
        err.code = 'MISSING_PARAMETER';
        next(err);
      } else {
        Store.findById(userInfo.storeId, function (err, foundStore) {
          if (err) {
            next(err);
          } else {
            foundStore.openTime = data.openTime;
            foundStore.openStatus = data.openStatus;
            foundStore.closingTime = data.closingTime;
            foundStore.environment = data.environment;
            foundStore.displayCloseout = data.displayCloseout;
            foundStore.lastUpdate = new Date();
            if (data.openStatus == STORE_STATUS_CLOSED) {
              if (foundStore.statistic.money > foundStore.bestScore.money) {
                foundStore.bestScore.money = foundStore.statistic.money;
                foundStore.bestScore.openTime = foundStore.totalOpenTime;
              }
            }
            foundStore.isValid(function (valid) {
              if (!valid) {
                err = new Error('Invalid parameters');
                err.code = 'MISSING_PARAMETER';
                err.statusCode = 400;
                err.detail = foundStore.errors;
                next(err);
              } else {
                foundStore.save(function (err) {
                  if (err) {
                    next(err);
                  } else {
                    if (foundStore.openStatus === STORE_STATUS_CLOSED) {
                      Store.app.models.MemberActionStatistic.updateOpenStoreTime(userInfo.id, foundStore.totalOpenTime);
                    }
                    next(null, foundStore);
                  }
                });
              }
            });
          }
        });
      }
    } else {
      err = new Error('Missing parameter: Data');
      err.statusCode = 400;
      err.code = 'MISSING_PARAMETER';
      next(err);
    }
  };
  // #### Remote functions end ####

  function generateRedirectLink(data, callback) {
    var token = Store.app.models.Setting.configs['LINKSHARE_TOKEN'];
    var cjPid = Store.app.models.Setting.configs['CJ_PID'];
    var foApi = Store.app.models.Setting.configs['FLEXOFFERS_API_KEY'];
    var errors = [];
    var url, mid, murl;
    if (!token) errors.push("token not found");
    if (!cjPid) errors.push("CJ_PID not found");
    if (!foApi) errors.push("FlexOffers Api Key not found");
    if (!("mid" in data)) errors.push("mid");
    if (!("murl" in data)) errors.push("murl");
    if (errors.length > 0) {
      callback(errors);
    } else {
      mid = data.mid;
      murl = data.murl;
      if (validator.isInt(data.mid)) {
        url = "http://bento.linksynergy.com/bento_services/bookmarklet/linkproxytag2.php?token=" + token + "&mid=" + mid + "&tag=bookmark-1&murl=" + murl;
        request(url, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            if (!validator.isURL(body)) {
              callback(body);
            } else {
              callback(null, { "type": "LS", "url": body + "&u1=@commissionTrackingID" });
            }
          }
        });
      } else if (typeof data.mid == 'object'
        && typeof data.mid.advertiserId !== 'undefined'
        && typeof data.mid.categoryIds !== 'undefined') {
        var advertiserId = data.mid.advertiserId,
          categoryIds = data.mid.categoryIds;
        // url = "http://api.flexoffers.com/links.json?advertiserIds="+advertiserId+"&categoryIds="+categoryIds+"&page=1&pageSize=10&sortOrder=desc";
        url = "https://publisherpro.flexoffers.com/tfshandler/links/links/1070193?deepOnly=true&pageNumber=1&pageSize=1&programIds=" + advertiserId + "&sortColumn=created&sortOrder=desc";
        var options = {
          url: url,
          headers: {
            "ApiKey": foApi
          }
        }
        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            try {
              var info = JSON.parse(body);
            } catch (e) {
              return callback("No records found for this domain.");
            }
            var results = info.results;
            if (results && results.length > 0) {
              var record = results[0];
              var redirectUrl = "https://track.flexlinkspro.com/a.ashx?foid=1070193." + record.productId + "&foc=" + record.contentTypeId + "&fot=9999&fos=1&fobs=@commissionTrackingID" + "&url=" + encodeURIComponent(murl);
              return callback(null, { "type": "FO", "url": redirectUrl })
            }
            return callback("No records found for this domain.");
          }
        })
      } else {
        url = "http://www.anrdoezrs.net/links/" + cjPid + "/type/dlg/sid/@commissionTrackingID/" + murl;
        callback(null, { "type": "CJ", "url": url });
      }
    }
  }

  Store.decodeUrl = function (url) {
    while (url.indexOf('://') == -1) {
      url = decodeURIComponent(url);
    }
    return url;
  }

  Store.stockProduct = function (data, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!userInfo.storeId) {
      var error = new Error("Store not found");
      error.code = Store.prefixError + "SP08";
      return next(error);
    }

    var fields = ["brand", "title", "description", "originalUrl", "price", "imageURLs", "mid"];
    var missingFields = Store.app.models.Safebox.validateRequiredFields(fields, data, next);
    if (missingFields.length > 0) {
      var error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      error.field = missingFields.join(', ');
      error.statusCode = 400;
      return next(error);
    }

    if (data.imageURLs && Array !== data.imageURLs.constructor) {
      var error = new Error("imageURLs is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "imageURLs";
      return next(error);
    }
    if (typeof data.originalUrl !== 'string') {
      var error = new Error("Invalid originalUrl");
      error.code = "INVALID_PARAMETER";
      error.field = "originalUrl";
      return next(error);
    }

    var decodedOriginalUrl = Store.decodeUrl(data.originalUrl);
    if (!validator.isURL(decodedOriginalUrl) || decodedOriginalUrl.length > 1011) {
      var error = new Error("originalUrl is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "originalUrl";
      return next(error);
    }
    if (typeof data.brand !== 'string') {
      var error = new Error("Invalid brand");
      error.code = "INVALID_PARAMETER";
      error.field = "brand";
      return next(error);
    }
    if (typeof data.title !== 'string') {
      var error = new Error("Invalid title");
      error.code = "INVALID_PARAMETER";
      error.field = "title";
      return next(error);
    }
    if (typeof data.description !== 'string') {
      var error = new Error("Invalid description");
      error.code = "INVALID_PARAMETER";
      error.field = "description";
      return next(error);
    }
    if (!validator.isFloat(data.price)) {
      var error = new Error("Invalid Price");
      error.code = "INVALID_PARAMETER";
      error.field = "price";
      return next(error);
    }
    if (data.imageURLs.length > 0) {
      var regexBase64 = /^data:([A-Za-z-+\/]+);base64,(.+)$/;
      for (var i = 0; i < data.imageURLs.length; i++) {
        if (typeof data.imageURLs[i] !== 'string' || (!validator.isURL(data.imageURLs[i]) && !regexBase64.test(data.imageURLs[i]))) {
          var error = new Error("Invalid imageURLs");
          error.code = "INVALID_PARAMETER";
          error.field = "imageURLs";
          return next(error);
        }
      }
    }
    var affNetwork = (validator.isInt(data.mid)) ? "LS" : (typeof data.mid == 'object' ? "FO" : "CJ");
    affNetwork = affNetwork.toLowerCase();
    var storeId = userInfo.storeId.toString();
    var BrandCollection = Store.getDataSource().connector.collection(Store.app.models.Brand.modelName);
    var shortBrand = data.brand.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/)[1].toLowerCase();
    var brandObj, oriUrl, pictures;
    var isNew = 0;
    data.originalUrl = decodedOriginalUrl;
    BrandCollection.find({
      website: {
        $elemMatch: { $regex: "[^a-zA-Z0-9]" + shortBrand }
      },
      affiliateNetwork: affNetwork
    }).toArray(function (err, brands) {
      if (err || brands.length == 0) {
        var error = new Error("Brand not found");
        error.code = Store.prefixError + "SP09";
        return next(error);
      } else {
        brandObj = { "id": brands[0]._id.toString(), "name": brands[0].name };
        var oriUrl = data.originalUrl;
        if (oriUrl.indexOf(shortBrand.toLowerCase()) == -1) {
          var error = new Error("OriginalUrl do not match with Brand");
          error.code = Store.prefixError + "SP10";
          return next(error);
        }
        var obj = { "mid": data.mid, "murl": data.originalUrl };
        var type = 2;
        var position;
        var cellNo;
        Store.app.models.Product.findOne({
          where: { originalUrl: oriUrl }
        }, function (err, foundProduct) {
          if (err || !foundProduct) {
            async.parallel([
              function (cb) {
                Store.app.models.Product.create({
                  creatorId: userInfo.id.toString(),
                  brand: brandObj,
                  title: data.title,
                  url: data.originalUrl,
                  description: data.description,
                  originalUrl: data.originalUrl,
                  price: data.price,
                  imageURLs: data.imageURLs
                }, cb)
              },
              function (cb) {
                Store.findById(storeId, cb);
              }
            ], function (err, results) {
              if (err) {
                next(err);
              } else {
                var productInstance = results[0];
                var storeInstance = results[1];
                async.parallel([
                  function (callback) {
                    addtoStoreOrStockRoom(userInfo, storeId, productInstance, storeInstance.cells, position, cellNo, productInstance.brand.id.toString(), type, 0, ctx, callback);
                  },
                  function (callback) {
                    generateRedirectLink(obj, callback);
                  },
                  function (callback) {
                    Store.app.models.MemberActionStatistic.actionCounter(userInfo.id, MISSION_ACTION_TOTAL_MAKE_PRODUCT, 1, callback);
                  }
                ], function (errors, rs) {
                  if (errors) {
                    Store.app.models.Product.destroyById(productInstance.id, function (err) {
                      return next(errors);
                    })
                  } else if (!rs[1] || typeof rs[1].url == 'undefined') {
                    var error = new Error('Invalid redirect url');
                    error.code = Store.prefixError + "SP12";
                    Store.app.models.Product.destroyById(productInstance.id, function (err) {
                      return next(error);
                    })
                  } else {
                    var ProductCollection = Store.getDataSource().connector.collection(Store.app.models.Product.modelName);
                    var ObjectID = Store.getDataSource().ObjectID;
                    ProductCollection.update(
                      { _id: ObjectID(productInstance.id) },
                      {
                        $set:
                        {
                          url: rs[1].url,
                          affiliateNetwork: affNetwork
                        }
                      }, function (err, count) {
                        if (err || count.result.ok !== 1) {
                          var error = new Error("Can't upload Image");
                          error.code = Store.prefixError + "SP11";
                          return next(error);
                        } else {
                          next(null, rs[0]);
                        }
                      })
                  }
                })
              }
            })
          } else {
            async.parallel([
              function (cb) {
                Store.findById(storeId, function (err, found) {
                  if (err) {
                    return cb(err);
                  } else {
                    addtoStoreOrStockRoom(userInfo, storeId, foundProduct, found.cells, position, cellNo, foundProduct.brand.id.toString(), type, 1, ctx, cb);
                  }
                })
              },
              function (cb) {
                Store.app.models.Product.update({ id: foundProduct.id }, {
                  title: data.title,
                  description: data.description,
                  price: data.price
                }, cb);
              }
            ], function (err, rs) {
              if (err) return next(err);
              return next(null, rs[0]);
            })
          }
        })
      }
    });
  }

  function checkExist(cells, productId) {
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].products && JSON.stringify(cells[i].products).indexOf(productId) > -1) {
        return true;
      }
    }
    return false;
  };

  Store.isProductExist = function (cells, productId) {
    return checkExist(cells, productId);
  };
  Store.areProductsExist = function (cells, productIds, stockProducts) {
    var products = [];
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].products) {
        var item = cells[i];
        var posList = Object.keys(item.products);
        for (var j = 0; j < posList.length; j++) {
          var pos = posList[j];
          products.push(item.products[pos]);
        }
      }
    }

    for (var i = 0; i < productIds.length; i++) {
      var productId = productIds[i];
      if (products.indexOf(productId) === -1) {
        if (stockProducts && JSON.stringify(stockProducts).indexOf(productId) == -1) {
          return false;
        }
      }
    }

    return true;
  };

  Store.addProduct = function (data, ctx, next) {
    if (typeof data.product_id == 'undefined') {
      var error = new Error("product_id is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if (typeof data.product_id !== 'string') {
      var error = new Error("Invalid product_id");
      error.code = "INVALID_PARAMETER";
      error.field = "product_id";
      return next(error);
    }
    var product_id = data.product_id;
    var ObjectID = Store.getDataSource().ObjectID;
    var brandId;
    var type = 1;//1: Add Product ; 2: Stock Product
    var productExist = 0;

    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (data.cell_number && validator.isInt(data.cell_number)) {
      var cellNo = data.cell_number;
    }

    if (data.position && validator.isInt(data.position)) {
      var position = data.position;
      if (position < 0 || position > 5) {
        var error = new Error("Position is invalid");
        error.code = "INVALID_PARAMETER";
        error.field = "Position";
        return next(error);
      }
      if (typeof cellNo === 'undefined') {
        var error = new Error("cell_number is required");
        error.code = "MISSING_PARAMETER";
        return next(error);
      }
    }

    if (!storeId) {
      var error = new Error("Can't get StoreID");
      error.code = Store.prefixError + "AP02";
      return next(error);
    }
    Store.app.models.Product.findById(product_id, function (err, foundProduct) {
      if (err || !foundProduct) {
        var error = new Error("Product not found");
        error.code = Store.prefixError + "AP03";
        return next(error);
      } else {
        brandId = foundProduct.brand.id;
        Store.findById(storeId, function (err, foundStore) {
          if (err) {
            next(err);
          } else if (!foundStore) {
            var error = new Error("Store not found");
            error.code = Store.prefixError + "AP04";
            return next(error);
          } else {
            var cells = foundStore.cells;
            if (!cells) {
              var error = new Error("Cells is not defined");
              error.code = Store.prefixError + "AP05";
              return next(error);
            }
            var mapCells = _.map(cells, function (cell) { return _.values(cell.products).indexOf(product_id) > -1; });
            if (_.indexOf(mapCells, true) > -1) {
              var error = new Error("Product is exist in store");
              error.code = Store.prefixError + "AP06";
              return next(error);
            } else {
              if (cellNo === undefined) {
                addtoStoreOrStockRoom(userInfo, storeId, foundProduct, cells, position, cellNo, brandId, type, 1, ctx, next);
              } else {
                if (cellNo > cells.length) {
                  var error = new Error("Invalid cell_number ( cell is not built )");
                  error.code = "INVALID_PARAMETER";
                  error.field = "cell_number";
                  return next(error);
                } else {
                  addtoStoreOrStockRoom(userInfo, storeId, foundProduct, cells, position, cellNo, brandId, type, 1, ctx, next);
                }
              }
            }
          }
        });
      }
    });
  }

  function getPostion(object, position, productId, next) {
    var pos;
    if (position === undefined) {
      var arr = Object.keys(object).map(function (key) { return parseInt(key); });
      if (arr.indexOf(1) == -1) {
        pos = 1;
      } else if (arr.indexOf(2) == -1) {
        pos = 2;
      } else if (arr.indexOf(3) == -1) {
        pos = 3;
      } else if (arr.indexOf(4) == -1) {
        pos = 4;
      } else {
        pos = 5;
      }
    } else {
      if (JSON.stringify(object).indexOf(productId) > -1) {
        var error = new Error("Already has product in here");
        error.code = Store.prefixError + "SP12";
        return next(error);
      } else {
        pos = position;
      }
    }
    return pos;
  }

  function addToStore(userInfo, products, position, productInfo, cells, cell, cellNo, brandId, type, status, ctx, next) {
    var exReturn = '';
    var ObjectID = Store.getDataSource().ObjectID;
    var collection = Store.getDataSource().connector.collection(Store.modelName);
    var userId = userInfo.id.toString(), userStoreId = userInfo.storeId;
    var product_id = productInfo.id.toString();
    pos = getPostion(products, position, product_id, next);
    if (cellNo === undefined) {
      cells[cells.indexOf(cell)].products[pos.toString()] = product_id;
    } else {
      var productToMove = cells[cellNo - 1].products[pos.toString()];
      cells[cellNo - 1].products[pos.toString()] = product_id;
    }
    async.parallel([
      function (callback) {
        collection.update({ _id: ObjectID(userStoreId) }, { $set: { cells: cells } }, callback);
      },
      function (callback) {
        callback();
      },
      function (callback) {
        Store.app.models.Stockroom._checkExistInStockRoom({
          "brandId": brandId,
          "memberId": userInfo.id,
          "productId": product_id
        }, callback);
      },
      function (callback) {
        if (productToMove && productToMove !== undefined) {
          Store.app.models.Product.findById(productToMove, callback);
        } else {
          callback();
        }
      }
    ], function (err, rs) {
      if (err) return next(err);
      var found = productInfo;
      var isInStock = rs[2], isExclusive = false;
      var exclusive = found.exclusive, location = 'store', stores = found.stores;
      if (!stores) stores = [];
      stores.push(userStoreId);
      if (exclusive == null || exclusive === undefined || (exclusive && typeof exclusive.ownerId == 'undefined')) {
        exReturn = '';
      } else {
        if (exclusive.ownerId == userInfo.id.toString()) {
          isExclusive = true;
          exReturn = 'player';
        } else if (exclusive.ownerId !== userInfo.id.toString()) {
          async.parallel([
            function (cb) {
              Store.app.models.Member.findById(exclusive.ownerId, function (err, member) {
                if (err) cb(err);
                else if (!member) {
                  var error = new Error("Member not found");
                  error.code = Store.prefixError + "SP14";
                  return cb(error);
                }
                else
                  member.updateBudget({ budget: found.price }, cb);
              });
            }
          ], function (err, results) {
            if (err) return next(err);
          });
          exReturn = 'other';
        }
      }
      found.updateAttributes({
        stores: stores
      }, function (err, instance) {
        if (err) {
          next(null, err);
        } else {
          async.parallel([
            function (cb) {
              var actionCounter = [{ actionKey: MISSION_ACTION_TOTAL_STOCK_PRODUCT, value: 1 }, { actionKey: MISSION_ACTION_PICK_A_PRODUCT, value: 1 }];
              if (isExclusive && type == 1) {
                actionCounter.push({ actionKey: MISSION_ACTION_FIND_A_EXCLUSIVE_ON_MARKETPLACE, value: 1 });
              }
              Store.app.models.MemberActionStatistic.actionListCounter(userId, actionCounter, cb);
            },
            function (cb) {
              if (exReturn == '') {
                Store.app.models.Product.setExclusive(product_id, ctx, function (err, success) {
                  if (err) {
                    exReturn = 'none';
                  }
                  cb();
                });
              } else {
                cb();
              }
            },
            function (cb) {
              if (isInStock) {
                Store.app.models.Stockroom._removeProductFromStockroom({
                  "brandId": brandId,
                  "memberId": userInfo.id,
                  "productId": product_id
                }, cb)
              } else {
                cb();
              }
            },
            function (cb) {
              if (position && position !== undefined && rs[3] && rs[3] !== undefined) {
                Store._moveProductToStockRoom(rs[3], userInfo, true, cb);
              } else {
                cb();
              }
            }
          ], function (err, results) {
            if (err) return next(err);
            collection.update({ _id: ObjectID(userStoreId) }, {
              $inc: { noOfProducts: 1 }
            }, function (err, instance) {
              if (err) return next(err);
              if (exReturn == '') exReturn = 'player';
              if (type == 1) {
                if (cellNo === undefined) {
                  return next(null, cell);
                } else {
                  return next(null, cells[cellNo - 1]);
                }
              } else {
                return next(null, { "status": status, "location": location, "exclusive": exReturn });
              }
            })
          })
        }
      })
    })
  }

  function addtoStock(userInfo, brandId, productInfo, type, status, ctx, next) {
    var ObjectID = Store.getDataSource().ObjectID;
    var product_id = productInfo.id.toString();
    async.parallel([
      function (cb) {
        cb();
      },
      function (cb) {
        Store.app.models.Stockroom._checkExistInStockRoom({
          "brandId": brandId,
          "memberId": userInfo.id,
          "productId": product_id
        }, cb);
      }
    ], function (err, rs) {
      if (err) {
        next(err);
      } else {
        var foundProd = productInfo;
        var isInStock = rs[1];
        if (foundProd.exclusive !== null && foundProd.exclusive.ownerId == userInfo.id.toString()) {
          exReturn = "player";
        } else if (foundProd.exclusive !== null && foundProd.exclusive.ownerId !== userInfo.id.toString()) {
          exReturn = "other";
        } else {
          exReturn = "none";
        }
        if (foundProd.stores !== null && foundProd.stores.indexOf(userInfo.storeId.toString()) > -1 && type == 2) {
          if (exReturn == "none") {
            Store.app.models.Product.setExclusive(product_id, ctx, function (err) {
              if (err) {
                return next(err);
              } else {
                return next(null, { "status": status, "location": "store", "exclusive": "player" });
              }
            })
          } else {
            return next(null, { "status": status, "location": "store", "exclusive": exReturn });
          }
        } else {
          if (isInStock) {
            if (type == 1) {
              var error = new Error("Product is already in stock room");
              error.code = Store.prefixError + "SP15";
              return next(error);
            } else {
              return next(null, { "status": status, "location": "stock", "exclusive": exReturn });
            }
          } else {
            async.parallel([
              function (cb) {
                var StockroomCollection = Store.getDataSource().connector.collection(Store.app.models.Stockroom.modelName);
                StockroomCollection.findAndModify(
                  {
                    brandId: ObjectID(foundProd.brand.id),
                    memberId: userInfo.id
                  },
                  [["_id", "asc"]],
                  {
                    $set: {
                      brandId: ObjectID(foundProd.brand.id),
                      memberId: userInfo.id,
                    },
                    $push: {
                      products: ObjectID(foundProd.id)
                    }
                  },
                  {
                    new: true,
                    upsert: true
                  },
                  cb
                )
              }
            ], function (err) {
              if (err) {
                return next(err);
              } else {
                var response = null;
                if (type == 1) {
                  response = { "status": 200, "message": "Product is stored in stockroom" };
                } else {
                  var location = 'stock';
                  if (foundProd.stores !== null && foundProd.stores.indexOf(userInfo.storeId.toString()) > -1) {
                    location = 'store';
                  }

                  response = { "status": status, "location": location, "exclusive": exReturn };
                }
                next(null, response);
              }
            });
          }
        }
      }
    })
  }

  function addtoStoreOrStockRoom(userInfo, storeId, productInfo, cells, position, cellNo, brandId, type, status, ctx, next) {
    var exReturn = 'none';
    var ObjectID = Store.getDataSource().ObjectID;
    var collection = Store.getDataSource().connector.collection(Store.modelName);
    var product_id = productInfo.id.toString();
    async.each(cells, function (cell, cb_each) {
      var cell_number = cell.number;
      var pos;
      if (!brandId) {
        cb_each();
      } else {
        if (cellNo === undefined) {
          var products = cell.products;
          var brand = cell.brandId;
        } else {
          var products = cells[cellNo - 1].products;
          var brand = cells[cellNo - 1].brandId;
        }
        if (products !== undefined && brand !== undefined
          && (products === null
            || ((Object.keys(products).length < 6 && cellNo !== undefined)
              || (Object.keys(products).length < 5 && cellNo === undefined))
            && (brand.toString() === brandId.toString()) && !checkExist(cells, product_id))) {
          addToStore(userInfo, products, position, productInfo, cells, cell, cellNo, brandId, type, status, ctx, next);
        } else {
          cb_each();
        }
      }
    }, function (err) {
      if (err) return next(err);
      addtoStock(userInfo, brandId, productInfo, type, status, ctx, next);
    });
  };

  Store.getCellNumberByProduct = function (productId, foundStore) {
    var cells = foundStore.cells;
    var rs = {
      "cellIndex": -1,
      "prodPosition": -1,
    };
    for (var i = 0; i < cells.length; i++) {
      var item = cells[i];
      if (item.products) {
        for (var pos = 1; pos < 6; pos++) {
          if (typeof item.products[pos] != 'undefined' && item.products[pos] == productId.toString()) {
            rs.cellIndex = i;
            rs.prodPosition = pos;
            return rs;
          }
        }
      }
    }

    return rs;
  };

  Store._moveProductToStockRoom = function (foundProduct, userInfo, keepInStock, next) {
    var storeList, stockList = [],
      storeId = userInfo.storeId;
    var collection = Store.getDataSource().connector.collection(Store.modelName);
    var ObjectID = Store.getDataSource().ObjectID;
    var isUpdateNoOfProducts = false;
    if (Store.app.models.Product.isExistInStore(userInfo.storeId, foundProduct)) {
      isUpdateNoOfProducts = true;
    }
    if (foundProduct.exclusive !== null && foundProduct.exclusive.ownerId == userInfo.id.toString()) {
      var oldExclusive = foundProduct.exclusive;
      foundProduct.exclusive = null;
    }
    if (foundProduct.stores && foundProduct.stores !== null) {
      foundProduct.stores.splice(foundProduct.stores.indexOf(storeId.toString()), 1);
      storeList = foundProduct.stores;
    }
    foundProduct.updateAttributes({
      stores: storeList,
      exclusive: foundProduct.exclusive
    }, function (err, inst) {
      if (err) {
        next(err);
      } else {
        var msg = "Product is removed successfully";
        if (keepInStock) {
          msg = "Moved product to stock room successfully";
        }
        async.series([
          function (cb) {
            if (keepInStock) {
              Store.app.models.Stockroom.findOrCreate({
                where: {
                  brandId: ObjectID(foundProduct.brand.id),
                  memberId: userInfo.id
                }
              }, {
                  brandId: ObjectID(foundProduct.brand.id),
                  memberId: userInfo.id,
                  products: [ObjectID(foundProduct.id)]
                }, function (err, instance, created) {
                  if (err)
                    cb(err);
                  else if (!created) {
                    var products = instance.products;
                    if (products !== null && typeof products !== 'undefined' && products.length > 0) {
                      if (JSON.stringify(products).indexOf(foundProduct.id) == -1) {
                        products.push(ObjectID(foundProduct.id));
                      }
                    } else {
                      products = [ObjectID(foundProduct.id)];
                    }
                    instance.updateAttributes({ products: products }, cb);
                  } else {
                    cb();
                  }
                });
            } else {
              Store.app.models.Stockroom._removeProductFromStockroom({
                "brandId": foundProduct.brand.id,
                "memberId": userInfo.id,
                "productId": foundProduct.id
              }, cb);
            }
          },
          function (cb) {
            if (isUpdateNoOfProducts) {
              collection.update({ _id: ObjectID(storeId) }, { $inc: { noOfProducts: -1 } }, cb);
            } else {
              cb();
            }
          },
          function (cb) {
            if (oldExclusive && oldExclusive !== null && typeof oldExclusive.ownerId !== 'undefined' && oldExclusive.ownerId == userInfo.id.toString()) {
              async.parallel([
                function (acs_one) {
                  Store.app.models.ExclusiveHistory.create({
                    ownerId: oldExclusive.ownerId,
                    productId: foundProduct.id.toString(),
                    status: EXCLUSIVE_HISTORY_STATUS_UNEXCLUSIVE,
                    created: new Date()
                  }, acs_one)
                },
                function (acs_one) {
                  Store.app.models.Notification._forUnexclusive({
                    "product": foundProduct,
                    "userInfo": userInfo
                  }, acs_one)
                }
              ], cb);
            } else {
              cb();
            }
          }
        ], function (err, results) {
          if (err) return next(err);
          next(null, msg);
        })
      }
    })
  };

  Store.removeProduct = function (data, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var keepInStock = true, cell_num, position;
    var ObjectID = Store.getDataSource().ObjectID;
    if (!data.cell_num || !data.hasOwnProperty("cell_num")) {
      var error = new Error("Cell number is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else {
      if (!validator.isInt(data.cell_num)) {
        var error = new Error("Cell number is invalid");
        error.code = "INVALID_PARAMETER";
        error.field = "cell_num";
        return next(error);
      }
      cell_num = data.cell_num;
    }
    if (!data.position || !data.hasOwnProperty("position")) {
      var error = new Error("Position number is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else {
      if (!validator.isInt(data.position)) {
        var error = new Error("Position number is invalid");
        error.code = "INVALID_PARAMETER";
        error.field = "position";
        return next(error);
      }
      position = data.position;
    }
    if (data.hasOwnProperty("keep_in_stockroom")) keepInStock = data.keep_in_stockroom;

    Store.findById(storeId, function (err, foundStore) {
      if (err || !foundStore) {
        var error = new Error("Store not found");
        error.code = Store.prefixError + "AP04";
        return next(error);
      } else {
        var cells = foundStore.cells;
        if (cell_num > cells.length || cell_num <= 0) {
          next(new Error("cell_number is invalid"));
        } else if (position <= 0 || position > 5) {
          var error = new Error("position is invalid");
          error.code = "INVALID_PARAMETER";
          error.field = "position";
          return next(error);
        } else {
          if (cells[cell_num - 1] && cells[cell_num - 1] !== undefined && cells[cell_num - 1].products) {
            var products = cells[cell_num - 1].products;
          } else {
            var error = new Error("This cell doesn't have any product");
            error.code = Store.prefixError + "RP03";
            return next(error);
          }
          if (position && products.hasOwnProperty(position.toString()) && products[position.toString()] !== '') {
            var product_id = products[position.toString()];
            delete products[position.toString()];
            var newCells = cells;

            foundStore.updateAttributes({ cells: newCells }, function () { });
            Store.app.models.Product.findById(ObjectID(product_id), function (err, foundProduct) {
              if (err || !foundProduct) {
              } else {
                Store._moveProductToStockRoom(foundProduct, userInfo, keepInStock, function () { });
              }
            });

            return next(null, cells[cell_num - 1]);
          } else {
            var error = new Error("This cell doesn't have product in this position");
            error.code = Store.prefixError + "RP05";
            return next(error);

          }
        }
      }
    });
  }

  Store.collectKey = function (data, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!storeId) {
      var error = new Error("Store not found");
      error.code = Store.prefixError + "CK01";
      return next(error);
    } else {
      Store.findById(storeId, function (err, foundStore) {
        if (err || !foundStore) {
          var error = new Error("Store not found");
          error.code = Store.prefixError + "CK01";
          return next(error);
        } else {
          if (!("keyGenerationStatus" in foundStore) || foundStore.keyGenerationStatus == null) {
            var error = new Error("Can't collect key");
            error.code = Store.prefixError + "CK02";
            return next(error);
          } else {
            var keyStatus = foundStore.keyGenerationStatus;
            if (keyStatus.hasOwnProperty("keyUnlockStatus") && keyStatus.keyUnlockStatus !== null && keyStatus.keyUnlockStatus == KEY_UNLOCK_STATUS_COLLECTABLE) {
              var keyGenerationStatus = {
                keyTime: Store.app.models.Setting.configs['KEY_GENERATE_DURATION'],
                keyUnlockStatus: KEY_UNLOCK_STATUS_ONGOING,
                startDate: new Date(),
                totalDuration: Store.app.models.Setting.configs['KEY_GENERATE_DURATION']
              }
              var currentBooster = 0;
              async.parallel([
                function (callback) {
                  foundStore.updateAttributes({
                    keyGenerationStatus: keyGenerationStatus
                  }, function (err, inst) {
                    if (err) {
                      callback(err);
                    } else {
                      callback(null);
                    }
                  });
                },
                function (callback) {
                  Store.app.models.MemberBooster.findOne({
                    where: {
                      memberId: userInfo.id,
                      boosterKey: BOOSTER_STORE_KEY
                    }
                  }, function (err, found) {
                    if (err || !found) {
                      callback(null, 1);
                    } else {
                      callback(null, found);
                    }
                  })
                }
              ], function (err, results) {
                if (err || !results) {
                  next(err);
                } else {
                  if (results[1] === 1) {
                    Store.app.models.MemberBooster.create({
                      memberId: userInfo.id,
                      boosterKey: BOOSTER_STORE_KEY,
                      number: Store.app.models.Setting.configs['STORE_INIT_NO_OF_KEYS'] + 1
                    }, function (err, inst) {
                      if (err || !inst) {
                        return next(err);
                      } else {
                        next(null, { BOOSTER_STORE_KEY: inst.number });
                      }
                    });
                  } else {
                    var foundMemberBooster = results[1];
                    foundMemberBooster.updateAttributes({
                      number: foundMemberBooster.number + 1
                    }, function (err, instance) {
                      if (err || !instance) {
                        return next(err);
                      } else {
                        next(null, { BOOSTER_STORE_KEY: instance.number });
                      }
                    })
                  }
                }
              });
            } else {
              var error = new Error("Can't collect key");
              error.code = Store.prefixError + "CK02";
              return next(error);
            }
          }
        }
      });
    }
  }
  Store.gkeyStatus = function (data, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!("keyTime" in data) || data.keyTime == null) {
      var error = new Error("keyTime is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }

    if (!validator.isInt(data.keyTime)) {
      var error = new Error("keyTime is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "keyTime";
      return next(error);
    }

    if (data.keyTime < 0) {
      data.keyTime = 0;
    }

    var updateData = {
      'keyGenerationStatus.keyTime': parseInt(data.keyTime)
    }
    if ("keyUnlockStatus" in data && KEY_UNLOCK_STATUS.indexOf(data.keyUnlockStatus) == -1) {
      var error = new Error("keyUnlockStatus is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "keyUnlockStatus";
      return next(error);
    }

    if (data.keyUnlockStatus && data.keyUnlockStatus !== null && KEY_UNLOCK_STATUS.indexOf(data.keyUnlockStatus) > -1) {
      updateData = {
        'keyGenerationStatus.keyTime': parseInt(data.keyTime),
        'keyGenerationStatus.keyUnlockStatus': data.keyUnlockStatus
      }
    }
    if (!storeId) {
      var error = new Error("Store not found");
      error.code = Store.prefixError + "KS02";
      return next(error);
    }

    Store.findById(storeId, function (err, foundStore) {
      if (err) {
        return next(err);
      }
      else if (!foundStore) {
        var error = new Error("Store not found");
        error.code = Store.prefixError + "KS02";
        return next(error);
      }
      else if (!foundStore.keyGenerationStatus || typeof foundStore.keyGenerationStatus == 'undefined') {
        var error = new Error("Key generation is not started.");
        error.code = Store.prefixError + "KS03";
        return next(error);
      }

      Store.update({ id: storeId }, updateData, function (err, instance) {
        if (err) {
          return next(err);
        } else if (instance.count > 0) {
          Store.findById(storeId, function (err, foundStore) {
            if (err) {
              return next(err);
            }

            return next(null, foundStore.keyGenerationStatus);
          });
        }
        else {
          var error = new Error("Nothing is updated.");
          error.code = Store.prefixError + "CK04";
          return next(error);
        }
      });
    });
  }

  Store.assignBrand = function (data, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var ObjectID = Store.getDataSource().ObjectID;
    var cell_number, brand_id;

    if (!("cell_number" in data) || data.cell_number == null) {
      var error = new Error("cell_number is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else {
      if (!validator.isInt(data.cell_number)) {
        var error = new Error("cell_number is invalid");
        error.code = "INVALID_PARAMETER";
        error.field = "cell_number";
        return next(error);
      }
      if (data.cell_number < 0 || data.cell_number > 50) {
        var error = new Error("cell_number is invalid");
        error.code = "INVALID_PARAMETER";
        error.field = "cell_number";
        return next(error);
      }
      cell_number = data.cell_number;
    }

    if (!("brand_id" in data) || data.cell_number == null) {
      var error = new Error("The brand_id is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }

    if (!storeId) {
      var error = new Error("Store not found");
      error.code = Store.prefixError + "AB03";
      return next(error);
    }

    async.parallel([
      function (cb) {
        Store.app.models.Brand.findById(data.brand_id, cb);
      },
      function (cb) {
        Store.findById(storeId, cb);
      }
    ], function (err, rs) {
      if (err) return next(err);
      if (!rs[0]) {
        var error = new Error("The brand_id is invalid.");
        error.code = "INVALID_PARAMETER";
        error.field = "brand_id";
        return next(error);
      }

      if (!rs[1]) {
        var error = new Error("Store not found");
        error.code = Store.prefixError + "AB03";
        return next(error);
      }

      brand_id = data.brand_id;
      var foundStore = rs[1];
      var cells = foundStore.cells;
      var cell = cells[cell_number - 1];
      if (cell && cell !== null && cell.status == STORE_CELL_STATUS_UNASSIGNED) {
        cell.brandId = brand_id;
        cell.status = STORE_CELL_STATUS_ASSIGNED;
        cells[cell_number - 1] = cell;
        var newActiveCells = Store.countActiveCells(cells);
        foundStore.updateAttributes({ cells: cells, activeCells: newActiveCells }, function (err, instance) {
          if (err) {
            next(err);
          } else {
            // Update stats brand, don't care response data.
            let brandInStore = Store.countCellAssignedBrand(cells);
            Store.app.models.Brand.incStats({ "brandId": brand_id, "inCells": 1, "inStores": (brandInStore === 1 ? 1 : false) }, function () { });

            next(null, "Brand is assigned successfully");
          }
        })
      } else {
        if (cell == null) {
          var error = new Error("Cell has not been built yet.");
          error.code = Store.prefixError + "AB04";
          return next(error);
        } else {
          if (!("status" in cell)) {
            var error = new Error("status is undefined");
            error.code = Store.prefixError + "AB05";
            return next(error);
          } else {
            if (cell.status == STORE_CELL_STATUS_ASSIGNED) {
              // callback(new Error("Cell is already assigned"));
              if (typeof cell.brandId !== 'undefined' && cell.brandId == brand_id) {
                var error = new Error("This brand is already assigned to this cell");
                error.code = Store.prefixError + "AB06";
                return next(error);
              }
              var oldBrandId = cell.brandId;
              cell.brandId = brand_id;
              var products = Object.keys(cell.products).map(function (key) {
                return ObjectID(cell.products[key]);
              });
              cell.products = {};
              cells[cell_number - 1] = cell;
              async.parallel([
                function (cb) {
                  foundStore.updateAttributes({ cells: cells }, cb);
                },
                function (cb) {
                  if (products && products.length > 0) {
                    Store.app.models.Stockroom._moveAllProductToStockRoom({
                      "products": products,
                      "userInfo": userInfo,
                      "brandId": oldBrandId
                    }, cb);
                  } else {
                    cb();
                  }
                }
              ], function (err, rs) {
                if (err) return next(err);

                Store._updateBrandStats(oldBrandId, brand_id, cells);
                next(null, "Brand is assigned successfully");
              })
            } else {
              var error = new Error("Cell is " + cell.status);
              error.code = Store.prefixError + "AB07";
              return next(error);
            }
          }
        }
      }
    })
  }

  Store._updateBrandStats = function (oldBrandId, newBrandId, updatedCells) {
    oldBrandIdCounter = 0;
    newBrandIdCounter = 0;
    for (var i = 0; i < updatedCells.length; i++) {
      if (updatedCells[i].brandId === oldBrandId) {
        oldBrandIdCounter++;
      }
      else if (updatedCells[i].brandId === newBrandId) {
        newBrandIdCounter++;
      }
    }

    Store.app.models.Brand.incStats({ "brandId": oldBrandId, "inCells": -1, "inStores": (oldBrandIdCounter === 0 ? -1 : false) }, function () { });
    Store.app.models.Brand.incStats({ "brandId": newBrandId, "inCells": 1, "inStores": (newBrandIdCounter === 1 ? 1 : false) }, function () { });
  };

  Store.countActiveCells = function (cells) {
    var count = 0;
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].status
        && (cells[i].status == STORE_CELL_STATUS_ASSIGNED || cells[i].status == STORE_CELL_STATUS_UNASSIGNED)) {
        count++
      }
    }
    return count;
  }
  Store.countCellAssignedBrand = function (cells) {
    var count = 0;
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].brandId) {
        count++;
      }
    }
    return count;
  }

  Store.updateConstructionStatus = function (data, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var fields = ["construction_time", "construction_status"];
    var missingFields = Store.app.models.Safebox.validateRequiredFields(fields, data, next);
    if (missingFields.length > 0) {
      var error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      error.field = missingFields.join(', ');
      error.statusCode = 400;
      return next(error);
    }

    if (!validator.isInt(data.construction_time)) {
      var error = new Error("construction_time is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "construction_time";
      return next(error);
    }
    if (typeof data.construction_status !== 'string') {
      var error = new Error("construction_status is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "construction_status";
      return next(error);
    }
    if (STORE_CONSTRUCTION_STATUS.indexOf(data.construction_status) == -1) {
      var error = new Error("construction_status is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "construction_status";
      return next(error);
    }

    if (!storeId) {
      var error = new Error("Store not found");
      error.code = Store.prefixError + "UC04";
      return next(error);
    }

    var construction_time = data.construction_time;
    var construction_status = data.construction_status;

    Store.findById(storeId, function (err, foundStore) {
      if (err || !foundStore) {
        return next(err);
      } else {
        var cells = foundStore.cells;
        var activeCells = Store.countActiveCells(foundStore.cells);
        var needUpdate = false;
        for (var i = 0; i < cells.length; i++) {
          if (cells[i].status == STORE_CELL_STATUS_UNDER_CONSTRUCTION) {
            needUpdate = true;
            if (construction_status == STORE_CONSTRUCTION_STATUS_FINISHED) {
              activeCells++;
              cells[i].status = STORE_CELL_STATUS_UNASSIGNED;
            }
          }
        }

        if (!needUpdate) {
          var error = new Error("There is no construction to update.");
          error.code = Store.prefixError + "UC05";
          return next(error);
        }

        foundStore.updateAttributes({
          cells: cells,
          constructionTime: (construction_time > 0) ? construction_time : 0,
          constructionStatus: construction_status,
          activeCells: activeCells
        }, function (err, inst) {
          if (err) {
            return next(err);
          } else {
            return next(null, inst);
          }
        });
      }
    });
  };

  Store.geListPublicFields = function () {
    var storeFields = ["id", "name", "elevator", "ownerId", "cells", "constructionTime", "constructionStatus", "constructionType",
      "constructionStartDate", "constructionTotalDuration", "totalStar", "openStatus", "activeCells", "closingTime", "environment",
      "displayCloseout"];
    return storeFields;
  };
  Store.upgrade = function (data, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!("construction_status" in data) || data.construction_status == null) {
      var error = new Error("construction_status is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    } else {
      if (typeof data.construction_status !== 'object' || !("constructionTime" in data.construction_status)) {
        return next(new Error("construction_status is invalid"));
      } else {
        var construction_status = data.construction_status;
      }
    }

    var constructionTime = construction_status.constructionTime;
    var constructionType = construction_status.constructionType || '';
    var VALID_STAGE_UPGRADE = [2, 5, 7, 13, 16, 25, 29, 41, 46];
    var VALID_LEVEL_UPGRADE = [3, 9, 19, 33];
    if (constructionTime === undefined || validator.isInt(constructionTime) == false) {
      var error = new Error("ConstructionTime is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "ConstructionTime";
      return next(error);
    }

    if (!("staff" in data) || data.staff == null) {
      var error = new Error("staff is required");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }

    if (typeof data.staff != "object") {
      var error = new Error("staff is invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "staff";
      return next(error);
    }

    var staff = data.staff;

    staff.storeId = storeId;
    async.parallel([
      function (cb) {
        Store.app.models.Member.findById(userInfo.id, cb);
      },
      function (cb) {
        Store.findById(storeId, { "fields": Store.geListPublicFields() }, cb);
      }
    ], function (err, rs) {
      var foundStore = rs[1];
      var userInfo = rs[0];
      if (err) return next(err);
      if (!foundStore) {
        var error = new Error("Store not found");
        error.code = Store.prefixError + "UG02";
        return next(error);
      } else {
        var cells = foundStore.cells;
        var upgradeCellNumber = cells.length + 1;
        var constructionCost = construction_status.constructionCost || Store.app.models.Setting.configs['STORE_UPGRADE_PRICE_LIST']['cell' + upgradeCellNumber];
        console.log(constructionCost);
        if (userInfo.budget < constructionCost) {
          var error = new Error("You dont have enough budget to build this cell");
          error.code = Store.prefixError + "UG03";
          return next(error);
        }
        if (typeof foundStore.totalStar == 'undefined' || foundStore.totalStar < cells.length + 1) {
          var error = new Error("You don't have enough stars to upgrade");
          error.code = Store.prefixError + "UG04";
          return next(error);
        }
        if (upgradeCellNumber > 50) {
          var error = new Error("Store has no cell to upgrade");
          error.code = Store.prefixError + "UG05";
          return next(error);
        }
        for (var i = 0; i < cells.length; i++) {
          if (JSON.stringify(cells[i]).indexOf(STORE_CELL_STATUS_UNDER_CONSTRUCTION) > -1) {
            var error = new Error("Can't upgrade right now ( Another cell is being built )");
            error.code = Store.prefixError + "UG09";
            return next(error);
          }
        }
        if ("cellAssignment" in staff.status && staff.status.cellAssignment != (upgradeCellNumber)) {
          var error = new Error("Invalid cellAssignment");
          error.code = Store.prefixError + "UG10";
          return next(error);
        }

        if (typeof staff.id !== 'undefined') delete staff.id;
        if (typeof staff.staffId !== 'undefined') delete staff.staffId;
        if (typeof staff.created !== 'undefined') delete staff.created;
        if (typeof staff.modified !== 'undefined') delete staff.modified;

        else {
          // Update cellAssignment auto if not input
          staff.status.cellAssignment = upgradeCellNumber;
        }
        cells[cells.length] = {
          "number": upgradeCellNumber,
          "status": STORE_CELL_STATUS_UNDER_CONSTRUCTION,
          "products": {}
        }

        foundStore.isValid(function (valid) {
          if (!valid) {
            err = new Error('Invalid parameters');
            err.code = 'INVALID_PARAMETER';
            err.statusCode = 400;
            err.detail = foundStore.errors;
            return next(err);
          } else {
            staff.ownerId = storeId;
            Store.app.models.Staff.create(staff, function (err, instStaff) {
              if (err) {
                return next(err);
              } else {
                cells[cells.length - 1].staffId = instStaff.id;

                foundStore.updateAttributes({
                  cells: cells,
                  constructionTime: constructionTime,
                  constructionStatus: STORE_CONSTRUCTION_STATUS_ONGOING,
                  constructionType: constructionType,
                  constructionStartDate: new Date(),
                  constructionTotalDuration: constructionTime
                }, function (err, istance) {
                  if (err) {
                    return next(err);
                  } else {
                    memberUpdate = { budget: userInfo.budget - constructionCost }
                    if (VALID_LEVEL_UPGRADE.indexOf(upgradeCellNumber) > -1) {
                      memberUpdate['level'] = userInfo.level + 1
                    }
                    Store.app.models.Member.update({ id: userInfo.id }, memberUpdate, function (err, instance) {
                      if (err) {
                        return next(err);
                      } else {
                        cells[cells.length - 1].staff = instStaff;
                        foundStore.cells = [cells[cells.length - 1]];
                        return next(null, foundStore);
                      }
                    })
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  // Upgrade Elevator
  Store.upgradeElevator = function (location, ctx, next) {

    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId;
    } else {
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var VALID_LEVEL_UPGRADE_ELEVATOR = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    async.parallel([
      function (cb) {
        Store.app.models.Member.findById(userInfo.id, cb);
      },
      function (cb) {
        Store.findById(storeId, { "fields": Store.geListPublicFields() }, cb);
      }
    ], function (err, rs) {
      var userInfo = rs[0];
      var foundStore = rs[1];
      if (err) return next(err);
      if (!foundStore) {
        var error = new Error("Store not found");
        error.code = Store.prefixError + "_UE01";
        return next(error);
      }
      if (!location) {
        location = foundStore.elevator.location;
      }
      if (location.length > 30) {
        var error = new Error("Location must less than 30 charater");
        error.code = Store.prefixError + "_UE02";
        error.severity = 'critical';
        airbrake.notify(error, function (error, url) {
          if (error) throw error;
          // Error has been delivered, url links to the error in airbrake
        });
        return next(error);
      }
      var listElevator = Store.app.models.Setting.configs['STORE_ELEVATOR'];
      var currentLevel = foundStore.elevator.level;
      for (let i = 0; i < listElevator.length - 1; i++) {
        if ((currentLevel) === listElevator[i].level) {
          var elevatorNext = listElevator[i + 1];
        }
      }

      if (elevatorNext) {
        var costUpgradeElevator = elevatorNext.cost;
        if (userInfo.budget < costUpgradeElevator) {
          var error = new Error("You don't have enough budget to upgrade elevator");
          error.code = Store.prefixError + "_UE03";
          airbrake.notify(error, function (error, url) {
            if (error) throw error;
            // Error has been delivered, url links to the error in airbrake
          });
          return next(error);
        }
        if (userInfo.level * 2 < elevatorNext.level) {
          var error = new Error("You must upgrade your Store first");
          error.code = Store.prefixError + "_UE04";
          return next(error);
        }
        if (VALID_LEVEL_UPGRADE_ELEVATOR.indexOf(elevatorNext.level) > -1) {
          storeUpdate = { elevator: { level: foundStore.elevator.level + 1, location: location } };
        }
        else {
          var error = new Error("Level invalid");
          error.code = Store.prefixError + "_UE05";
          airbrake.notify(error, function (error, url) {
            if (error) throw error;
            // Error has been delivered, url links to the error in airbrake
          });
          return next(error);
        }
        var response = { elevator: { level: foundStore.elevator.level + 1, location: location }, remainsBudget: userInfo.budget - costUpgradeElevator };
        next(null, response);
        async.parallel([
          function (cb) {
            foundStore.updateAttributes(storeUpdate, cb);
          },
          function (cb) {
            userInfo.updateBudget({ budget: -costUpgradeElevator }, cb);
          }
        ], function (err, res) {
          if (err) throw err
        }
        );
      }
      else {
        var error = new Error("Level invalid");
        error.code = Store.prefixError + "_UE05";
        airbrake.notify(error, function (error, url) {
          if (error) throw error;
          // Error has been delivered, url links to the error in airbrake
        });
        return next(error);
      }
    });
  }
  Store.initial = function (data, ctx, next) {
    var error = null;
    if (ctx.user) {
      var userInfo = ctx.user;
      var storeId = userInfo.storeId;
    } else {
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var fields = ["categories", "staffs"];
    var missingFields = Store.app.models.Safebox.validateRequiredFields(fields, data);
    if (missingFields.length > 0) {
      error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      error.field = missingFields.join(', ');
      error.statusCode = 400;
      return next(error);
    }

    var limitInitialCell = 3;
    if (!Array.isArray(data.categories) || data.categories.length < limitInitialCell) {
      error = new Error("Invalid parameters");
      error.code = "INVALID_PARAMETER";
      error.field = "categories";
      error.statusCode = 400;
      return next(error);
    }

    var limitInitialCell = 3;
    if (!Array.isArray(data.staffs) || data.staffs.length < limitInitialCell) {
      error = new Error("Invalid parameters");
      error.code = "INVALID_PARAMETER";
      error.field = "staffs";
      error.statusCode = 400;
      return next(error);
    }

    async.parallel([
      function (async_cb) {
        Store.app.models.Brand.getRandomByCategory(data.categories, limitInitialCell, function (err, brands) {
          if (err) {
            return async_cb(err);
          }

          if (brands.length === 0) {
            error = new Error("Empty brand belongs to these categories.");
            error.code = Store.prefix + "IN02";
            return async_cb(error);
          }
          else if (brands.length < limitInitialCell) {
            error = new Error("Not enough brands belongs to these categories.");
            error.code = Store.prefix + "IN04";
            return async_cb(error);
          }

          async_cb(null, brands);
        });
      },
      function (async_cb) {
        userInfo.getStore(async_cb);
      }
    ], function (err, results) {
      if (err) {
        return next(err);
      }

      var brands = results[0];
      var userStore = results[1];
      var totalCells = userStore.cells.length;

      var wasInitStaff = true;
      var newStaffs = [];
      var newStaffIds = [];
      var wasAssignedBrand = true;
      var brandInStores = {};

      var ObjectID = Store.getDataSource().ObjectID;
      for (var i = 0; i < totalCells; i++) {
        if (i >= limitInitialCell) {
          break;
        }

        var cell = userStore.cells[i];
        if (!cell.staffId) {
          var staff = data.staffs.shift();
          if (!staff) {
            error = new Error("Staff is not enough quantity to initial store.");
            error.code = Store.prefix + "IN03";
            return next(error);
          }

          staff.id = ObjectID();
          if (!staff.status) {
            staff.status = {};
          }
          staff.status.cellAssignment = cell.number || (i + 1);
          staff.storeId = storeId;
          newStaffs.push(staff);

          newStaffIds.push(staff.id);
          userStore.cells[i].staffId = staff.id;
          wasInitStaff = false;
        }

        if (!cell.brandId) {
          var brand = brands.shift();
          var brandId = (brand.id || brand._id).toString();
          userStore.cells[i].brandId = brandId;
          userStore.cells[i].status = STORE_CELL_STATUS_ASSIGNED;

          wasAssignedBrand = false;
          if (!brandInStores[brandId]) {
            brandInStores[brandId] = {
              "inStores": 1,
              "inCells": 0
            };
          }
          brandInStores[brandId]["inCells"]++;
        }
      }

      if (wasInitStaff && wasAssignedBrand) {
        error = new Error("Can not re-initial a store.");
        error.code = Store.prefixError + "IN01";
        return next(error);
      }

      Store.app.models.Staff.create(newStaffs, function (err, inst) {
        if (err) {
          // Delete all inserted staffs success.
          Store.app.models.Staff.destroyAll({
            "id": { "inq": newStaffIds }
          }, function () {
            return next(err);
          });
          return;
        }

        if (!userStore.keyGenerationStatus) {
          userStore.keyGenerationStatus = {
            keyTime: Store.app.models.Setting.configs['KEY_GENERATE_DURATION'],
            keyUnlockStatus: KEY_UNLOCK_STATUS_ONGOING,
            startDate: new Date(),
            totalDuration: Store.app.models.Setting.configs['KEY_GENERATE_DURATION']
          };
        }

        userStore.isValid(function (valid) {
          if (!valid) {
            err = new Error('Invalid parameters');
            err.code = 'INVALID_PARAMETER';
            err.statusCode = 400;
            err.detail = userStore.errors;
            Store.app.models.Staff.deleteById(newStaffIds, function () {
              next(err);
            });
          } else {
            Store.app.models.Brand.incStatsMany(brandInStores, function () { });
            userStore.save(function (err, updatedStore) {
              if (err) {
                return Store.app.models.Staff.deleteById(newStaffIds, function () {
                  next(err);
                });
              }
              next(null, updatedStore);
            });
          }
        });
      });
    });
  };

  Store.leaderboard = function (filter, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
      var userId = userInfo.id.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var res = []

    limit = 5;
    skip = 0;
    connection = 0;
    if (typeof filter !== 'undefined') {
      if (typeof filter.limit !== 'undefined') {
        limit = filter.limit;
      }
      if (typeof filter.offset !== 'undefined') {
        skip = parseInt(filter.offset);
      }
      if (typeof filter.connection !== 'undefined') {
        connection = filter.connection;
      }
    }
    query = {
      "fields": { "ownerId": true, "bestScore": true }
      , "where": {}
      , "order": { "bestScore.money": -1 }
      , limit: limit
      , skip: skip
    };

    async.series([
      function (callback) {
        if (connection == 1) {
          var Follower = Store.app.models.Follower;
          Follower.getListConnections(userId, function (err, connections) {
            if (err) {
              return callback(err);
            }

            if (connections && connections.length > 0) {
              query['where'] = { "ownerId": { "$in": connections } };
            }
            return callback();
          });
        }
        else {
          callback();
        }

      },
    ], function (err, results) {
      if (err) {
        next(err);
      } else {
        var StoreCollection = Store.getDataSource().connector.collection(Store.modelName);
        StoreCollection.find(query.where, query.fields).sort(query.order).limit(query.limit).skip(query.skip).toArray(function (err, stores) {
          if (err) {
            next(err)
          }
          else {
            var playerIds = [];
            for (var i = 0; i < stores.length; i++) {
              playerIds.push(stores[i].ownerId.toString());
            }

            Store.app.models.Member.find({
              "fields": Store.app.models.Member.geListPublicFields(),
              "where": {
                "id": {
                  "inq": playerIds
                }
              }
            }, function (err, foundMembers) {
              if (err) {
                return next(err);
              }

              if (!foundMembers) {
                return next(null, []);
              }

              var res = [];
              var passedList = [];
              for (var i = 0; i < stores.length; i++) {
                var storeItem = stores[i];
                var ownerId = storeItem.ownerId.toString();
                var bestScore = storeItem.bestScore || { "money": 0, "openTime": 0 };
                for (var j = 0; j < foundMembers.length; j++) {
                  if (passedList.indexOf(j) == -1) {
                    var memberItem = foundMembers[j];
                    if (memberItem.id.toString() == ownerId) {
                      passedList.push(j);

                      memberItem.bestScore = bestScore;
                      res.push(memberItem);
                      break;
                    }
                  }
                }
              }

              return next(null, res);
            });
          }
        });
      }
    });
  };

  Store.getLevel = function (storeObj) {
    if (storeObj) {
      var noOfCells = storeObj.cells.length;
      return Store.getLevelByNoOfCells(noOfCells);
    }
    return 0;
  }
  Store.getLevelByNoOfCells = function (noOfCells) {
    if (noOfCells < 1) {
      return -1;
    }

    if (noOfCells < 3) return 1;
    if (noOfCells < 9) return 2;
    if (noOfCells < 19) return 3;
    if (noOfCells < 33) return 4;

    return 5;
  };

  Store.findByIdWithInclude = function (id, filter, include, next) {
    include = (typeof include != 'undefined' ? include : '');
    var condition = "";
    var validFilter = ["fields", "include"];
    if (typeof filter != 'undefined') {
      filter = JSON.parse(filter) || {};
      assert(typeof filter == 'object', 'The filter argument must be an object');
      for (cd in filter) {
        assert(validFilter.indexOf(cd) > -1, "Filter cannot contain :" + cd);
      }
      if (typeof filter.fields !== 'undefined') {
        filter.fields.id = true;
      }
      condition = filter;
    }

    Store.findById(id, condition, function (err, store) {
      if (err || !store) {
        var error = new Error("Store not found");
        error.code = Store.prefixError + "FB01";
        return next(error);
      } else {
        if (include && (include.indexOf("staff") == -1 && include.indexOf("safebox") == -1)) {
          var error = new Error("The include argument is invalid");
          error.code = "INVALID_PARAMETER";
          error.field = "include";
          return next(error);
        }
        if (include == '') {
          next(null, store);
        } else {
          async.parallel([
            function (cb) {
              if (include.indexOf("staff") > -1) {
                Store.app.models.Staff.find({ where: { storeId: store.id.toString() } }, cb);
              } else {
                cb();
              }
            },
            function (cb) {
              if (include.indexOf("safebox") > -1) {
                Store.app.models.Safebox.find({ where: { storeId: store.id.toString() } }, cb);
              } else {
                cb();
              }
            }
          ], function (err, results) {
            if (err) {
              return next(err);
            }
            next(null, { "store": store, "staffs": results[0], "safeboxes": results[1] });
          })
        }
      }
    })
  }

  Store.getListBrands = function (filter, ctx, next) {
    var error;
    if (!ctx.user) {
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    filter = typeof filter !== 'undefined' ? filter : {};
    var limit = Store.app.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'] || 30;
    var offset = filter.offset ? filter.offset : 0;
    if (filter.limit && (filter.limit > 0 && filter.limit < limit)) {
      limit = filter.limit;
    }

    var ObjectID = Store.getDataSource().ObjectID;
    ctx.user.getStore(function (err, foundStore) {
      if (err) {
        return next(err);
      }

      var brandIds = [];
      foundStore.cells.forEach(function (cell) {
        if (cell.brandId && ObjectID.isValid(cell.brandId)) {
          brandIds.push(ObjectID(cell.brandId));
        }
      });

      if (brandIds.length === 0) {
        error = new Error("Have no brands available in the store");
        error.code = Store.prefixError + "LB01";
        return next(error);
      }

      Store.app.models.Brand.find({
        "where": { "id": { "inq": brandIds } },
        "limit": limit,
        "offset": offset
      }, function (err, brands) {
        if (err) {
          return next(err);
        }

        return next(null, brands);
      });
    });
  };

  Store.getListProducts = function (filter, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var storeId = userInfo.storeId;
    if (!storeId || storeId == '' || typeof storeId == 'undefined') {
      var error = new Error("storeId not found");
      error.code = Store.prefixError + "GL01";
      return next(error);
    }

    Store.findById(storeId, function (err, foundStore) {
      if (err || !foundStore) {
        var error = new Error("storeId not found");
        error.code = Store.prefixError + "GL01";
        return next(error);
      }
      var limit = Store.app.models.Setting.configs['GET_LIST_DATA_DEFAULT_LIMIT'] || 30;
      var filterObj = null;
      var offset = 0;
      if (filter) {
        try {
          filterObj = JSON.parse(filter);
        } catch (e) {
          return next("filter is invalid ( " + e + " )");
        }

        if (typeof filterObj.limit !== 'undefined' && filterObj.limit < limit && filterObj.limit > 0) {
          limit = filterObj.limit;
        }

        if (typeof filterObj.offset !== 'undefined') {
          offset = filterObj.offset;
        }
      }
      Store.app.models.Product.find({
        fields: { "stores": false },
        where: {
          or: [
            { stores: storeId }
          ]
        },
        limit: limit,
        offset: offset
      }, function (err, products) {
        if (err) {
          next(err);
        } else {
          next(null, products);
        }
      })
    });
  }

  Store.updateStore = function (data, id, ctx, next) {
    if (ctx.user) {
      var userInfo = ctx.user;
    } else {
      var error = new Error("Current logged user is not found.");
      error.code = Store.prefixError + "US01";
      return next(error);
    }

    var storeId = userInfo.storeId;
    if (!storeId || storeId == '' || typeof storeId == 'undefined') {
      var error = new Error("storeId not found");
      error.code = Store.prefixError + "US02";
      return next(error);
    }
    if (storeId == id || userInfo.type.indexOf(MEMBER_TYPES.ADMIN) > -1) {
      Store.findById(id, function (err, found) {
        if (err) return next(err);
        if (!found) return next(new Error("Store not found"));
        if (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) > -1) {
          // Admin
          if (typeof data.cells !== 'undefined') delete data.cells;
          if (typeof data.bestScore !== 'undefined') delete data.bestScore;
          if (typeof data.created !== 'undefined') delete data.created;
          if (typeof data.modified !== 'undefined') delete data.modified;
          if (typeof data.lastOpen !== 'undefined') delete data.lastOpen;
          if (typeof data.lastUpdate !== 'undefined') delete data.lastUpdate;
          if (typeof data.statistic !== 'undefined') delete data.statistic;
          if (typeof data.ownerId !== 'undefined') delete data.ownerId;
        } else {
          if (typeof data.name == 'undefined') {
            var error = new Error("Store's name not found");
            error.code = Store.prefixError + "US03";
            return next(error);
          }
          data = { "name": data.name };
        }
        found.updateAttributes(data, function (err, instance) {
          if (err) return next(err);
          next(null, instance);
        })
      })
    } else {
      var error = new Error("You do not have permission to update the other's store");
      error.code = Store.prefixError + "US04";
      return next(error);
    }
  }

  Store.setup = function () {
    Store.disableRemoteMethod('create', true);
    Store.disableRemoteMethod('upsert', true);
    Store.disableRemoteMethod('findById', true);
    Store.disableRemoteMethod('exists', true);
    Store.disableRemoteMethod('count', true);
    Store.disableRemoteMethod('findOne', true);
    Store.disableRemoteMethod('updateAll', true);
    Store.disableRemoteMethod('createChangeStream', true);
    Store.disableRemoteMethod('deleteById', true);
    Store.disableRemoteMethod('__get__owner', false);
    Store.disableRemoteMethod('upsertWithWhere', true);
    Store.disableRemoteMethod('replaceOrCreate', true);
    Store.disableRemoteMethod('replaceById', true);
    Store.disableRemoteMethod('updateAttributes', false);

    // check if name is valid
    function validateName(cb_err) {
      if (typeof this.name !== 'undefined') {
        if (!validator.isLength(validator.trim(this.name), 0, 100)) {
          cb_err();
        }
      }
    }
    Store.validate('name', validateName, { message: 'Invalid name' });

    // Validate cells
    function validateCells(cb_err) {
      if (typeof this.cells === 'object') {
        if (!Object.prototype.toString.call(this.cells) === '[object Array]') {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    Store.validate('cells', validateCells, { message: 'Invalid cells' });

    // Validate keyGenerationStatus
    function validateKeyGenerationStatus(cb_err) {
      if (typeof this.keyGenerationStatus === 'object' && this.keyGenerationStatus !== null) {
        if (typeof this.keyGenerationStatus.keyTime !== 'undefined'
          && typeof this.keyGenerationStatus.keyUnlockStatus !== 'undefined') {
          if (!validator.isInt(this.keyGenerationStatus.keyTime)) {
            cb_err();
          } else if (!validator.isIn(this.keyGenerationStatus.keyUnlockStatus, KEY_UNLOCK_STATUS)) {
            cb_err();
          }
        }
      }
    }
    Store.validate('keyGenerationStatus', validateKeyGenerationStatus, { message: 'Invalid keyGenerationStatus' });

    // Validate openTime
    function validateOpenTime(cb_err) {
      if (typeof this.openTime !== 'undefined' && this.openTime !== null) {
        if (!validator.isInt(this.openTime)) {
          cb_err();
        }
      }
    }
    Store.validate('openTime', validateOpenTime, { message: 'Invalid openTime' });

    // Validate openStatus
    function validateStatusOpen(cb_err) {
      if (typeof this.openStatus !== 'undefined') {
        if (!validator.isIn(this.openStatus, STORE_STATUS)) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    Store.validate('openStatus', validateStatusOpen, { message: 'Invalid openStatus' });

    // Validate activeCells
    function validateActiveCells(cb_err) {
      if (typeof this.activeCells !== 'undefined') {
        if (!validator.isInt(this.activeCells) || this.activeCells < 0 || this.activeCells > 50) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    Store.validate('activeCells', validateActiveCells, { message: 'Invalid activeCells' });

    // Validate closingTime
    function validateClosingTime(cb_err) {
      if (typeof this.closingTime !== 'undefined') {
        if (!validator.isInt(this.closingTime)) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    Store.validate('closingTime', validateClosingTime, { message: 'Invalid closingTime' });

    // Validate environment
    function validateEnvironment(cb_err) {
      if (typeof this.environment !== 'undefined') {
        if (!validator.isIn(this.environment, STORE_ENV)) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    Store.validate('environment', validateEnvironment, { message: 'Invalid environment' });

    // Validate displayCloseout
    function validateDisplayCloseout(cb_err) {
      if (typeof this.displayCloseout !== 'undefined') {
        if (!validator.isBoolean(this.displayCloseout)) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    Store.validate('displayCloseout', validateDisplayCloseout, { message: 'Invalid displayCloseout' });

    // Validate constructionTime
    function validateConstructionTime(cb_err) {
      if (typeof this.constructionTime !== 'undefined') {
        if (!validator.isInt(this.constructionTime)) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    Store.validate('constructionTime', validateConstructionTime, { message: 'Invalid constructionTime' });

    // Validate constructionStatus
    function validateConstructionStatus(cb_err) {
      if (typeof this.constructionStatus !== 'undefined' && this.constructionStatus !== null) {
        if (!validator.isIn(this.constructionStatus, STORE_CONSTRUCTION_STATUS)) {
          cb_err();
        }
      }
    }
    Store.validate('constructionStatus', validateConstructionStatus, { message: 'Invalid constructionStatus' });

    function validateLastUpdate(cb_err) {
      if (typeof this.lastUpdate !== 'undefined') {
        if (!validator.isDate(this.lastUpdate)) {
          cb_err();
        }
      }
    }
    Store.validate('lastUpdate', validateLastUpdate, { message: 'Invalid lastUpdate' });

    // check if created is valid
    function validateCreated(cb_err) {
      if (typeof this.created !== 'undefined') {
        if (!validator.isDate(this.created)) {
          cb_err();
        }
      }
    }
    Store.validate('created', validateCreated, { message: 'Invalid created' });

    // check if modified is valid
    function validateModified(cb_err) {
      if (typeof this.modified !== 'undefined') {
        if (!validator.isDate(this.modified)) {
          cb_err();
        }
      }
    }
    Store.validate('modified', validateModified, { message: 'Invalid modified' });

    Store.validatesUniquenessOf('ownerId', { message: 'ownerId is not unique' });

    //  Validate elevator   
    function validateElevator(cb_err) {
      // if (typeof this.elevator === 'object' && this.elevator !== null) {
      if (typeof this.elevator.location !== 'undefined') {
        if (!validator.isLength(validator.trim(this.elevator.location), 1, 30)) {
          cb_err();
        }
      }
      // }
    }
    Store.validate('location', validateElevator, { message: 'Location must < 30 characher' });

    // Update Store status (after open store)
    Store.remoteMethod(
      'updateStatus',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{open_time: (int), open_status: string, closing_time : 0, environment: string, display_closeout : bool}',
            required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Update Store status (after open store).',
        http: { verb: 'PUT', path: '/updateStatus' },
        returns: { arg: 'data', type: 'object', root: true },
      }
    );

    //Stock a product from affiliate sites
    Store.remoteMethod(
      'stockProduct',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: 'Stock a product from affiliate sites', required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Stock a product from affiliate sites',
        http: { verb: 'POST', path: '/stockProduct' },
        returns: { arg: 'data', type: 'any', root: true },
      }
    );

    //Add Product From MarketPlace / Stockroom
    Store.remoteMethod(
      'addProduct',
      {
        accessType: 'WRITE',
        accepts:
        [
          {
            arg: 'data', type: 'object', description: 'Add Product From MarketPlace / Stockroom', required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Add Product From MarketPlace / Stockroom',
        returns: { arg: 'data', type: 'any', root: true },
        http: { verb: 'post', path: '/addProduct' }
      }
    )

    //Remove product
    Store.remoteMethod(
      'removeProduct',
      {
        accessType: 'WRITE',
        accepts:
        [
          {
            arg: 'data', type: 'object', description: 'Remove Product From MarketPlace / Stockroom', required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Player can remove product from Store to Stockroom or Market place.',
        returns: { arg: 'data', type: 'any', root: true },
        http: { verb: 'post', path: '/removeProduct' }
      }
    )

    // Collect Key
    Store.remoteMethod(
      'collectKey',
      {
        accessType: 'WRITE',
        accepts:
        [
          {
            arg: 'data', type: 'object', description: '{storeStatus: open/overtime/closing/closed }', required: false,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'After generating a key success, Player need to collect this key.',
        returns: { arg: 'data', type: 'any', root: true },
        http: { verb: 'put', path: '/collectKey' }
      }
    )

    // Assign Brand
    Store.remoteMethod(
      'assignBrand',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true, required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'when assign new branch to a cell, it will also assign a staff to that cell.',
        http: { verb: 'POST', path: '/assignBrand' },
        returns: { arg: 'data', type: 'any', root: true },
      }
    );

    //Update generated key status
    Store.remoteMethod(
      'gkeyStatus',
      {
        accessType: 'WRITE',
        accepts:
        [
          {
            arg: 'data', type: 'object', description: 'Update generated key status', required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Update generated key status.',
        returns: { arg: 'data', type: 'any', root: true },
        http: { verb: 'put', path: '/gkeyStatus' }
      }
    )

    //Update construction status
    Store.remoteMethod(
      'updateConstructionStatus',
      {
        accessType: 'WRITE',
        accepts:
        [
          {
            arg: 'data', type: 'object', description: '{construction_time: int, construction_status: string}', required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Update construction status.',
        returns: { arg: 'data', type: 'any', root: true },
        http: { verb: 'put', path: '/updateConstructionStatus' }
      }
    )

    //Upgrade a cell/stage/ or level
    Store.remoteMethod(
      'upgrade',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true, required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Upgrade a cell/stage/ or level.',
        http: { verb: 'POST', path: '/upgrade' },
        returns: { arg: 'data', type: 'any', root: true },
      }
    );

    //Init store with staff
    Store.remoteMethod(
      'initial',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: 'Init store with staff', required: true,
            http: { source: 'body' }
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Initial a store',
        http: { verb: 'POST', path: '/initial' },
        returns: { arg: 'data', type: 'any', root: true },
      }
    );

    //Get leader board for cashout
    Store.remoteMethod(
      'leaderboard',
      {
        accessType: 'READ',
        accepts: [
          { arg: 'filter', type: 'object' }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Get leaderboard of store.bestScore',
        http: { verb: 'get', path: '/leaderboard' },
        returns: { root: true }
      }
    )

    Store.remoteMethod(
      'getListBrands',
      {
        accessType: 'READ',
        accepts: [
          { arg: 'filter', type: 'object', http: { source: 'query' }, description: '{"limit": limit , "offset": offset}' }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Get list brands in store of current user',
        http: { verb: 'get', path: '/brands' },
        returns: { root: true }
      }
    );

    //Get list product of current user
    Store.remoteMethod(
      'getListProducts',
      {
        accessType: 'READ',
        accepts: [
          { arg: 'filter', type: 'string', http: { source: 'query' }, description: '{"limit": limit , "offset": offset}' }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Get list product in store of current user',
        http: { verb: 'get', path: '/products' },
        returns: { root: true }
      }
    );

    Store.remoteMethod(
      'tmpFunc',
      {
        accessType: 'READ',
        accepts: [
          { arg: 'total_satisfied_customers', type: 'string', http: { source: 'query' }, description: "cell Number" }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Input total Sale, output total stars.',
        http: { verb: 'get', path: '/testTotalStar' },
        returns: { root: true }
      }
    )
    Store.remoteMethod(
      'tmpFunc2',
      {
        accessType: 'READ',
        accepts: [
          { arg: 'totalStars', type: 'string', http: { source: 'query' }, description: "cell Number" }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        description: 'Input total stars, output total sale.',
        http: { verb: 'get', path: '/testTotalStar2' },
        returns: { root: true }
      }
    );
    Store.remoteMethod(
      'tmpMigrateStatsCustomers',
      {
        accessType: 'WRITE',
        description: 'Input total stars, output total sale.',
        http: { verb: 'POST', path: '/migrateStatsCustomers' },
        returns: { root: true }
      }
    );

    Store.remoteMethod(
      'updateStore',
      {
        description: 'Update store data',
        accepts: [
          {
            arg: 'data', type: 'object', http: { source: 'body' }, description:
            'An object of model property name/value pairs'
          },
          { arg: 'id', type: 'string', required: true, http: { source: 'path' }, description: 'PersistedModel id' }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
        ],
        returns: { arg: 'data', type: 'any', root: true },
        http: { verb: 'put', path: '/:id' }
      }
    )
  };

  // new Method Elevator
  Store.remoteMethod(
    'upgradeElevator',
    {
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'location', type: 'string', root: true,
          description: 'Location of elevator'
        }
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: { source: 'req' } }
      ],
      description: "Upgrade Elevator",
      http: { verb: 'POST', path: '/upgradeElevator' },
      return: { arg: 'data', type: 'any', root: true }

    }
  );

  loopback.remoteMethod(
    Store.findByIdWithInclude,
    {
      description: 'Find a store instance by id from the data source.',
      accepts: [
        { arg: 'id', type: 'string', required: true, http: { source: 'path' }, description: 'Store id' },
        {
          arg: 'filter', type: 'string', http: { source: 'query' }, description:
          'Filter defining fields'
        },
        { arg: 'include', type: 'string', http: { source: 'query' }, description: 'Include staff or safebox or both' }
      ],
      returns: { arg: 'data', type: 'any', root: true },
      http: { verb: 'get', path: '/:id' }
    }
  );
  Store.setup();
};
