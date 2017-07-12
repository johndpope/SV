var validator = require('validator')
  , async = require('async')
  , request = require('request')
  , path = require('path')
  , loopback = require('loopback')
  , clone = require('clone')
  , util = require('util');

PRICE_UNIT_USD = 'USD';
PRICE_UNIT_STOCKET = 'Stocket bud';
PRICE_UNIT_STOCKET_SHARE = 'Stocket Share';
PRICE_UNIT = [PRICE_UNIT_USD, PRICE_UNIT_STOCKET, PRICE_UNIT_STOCKET_SHARE];

// Booster category list
BOOSTER_CATEGORY_MONEY = 'money';
BOOSTER_CATEGORY_STAFF = 'staff';
BOOSTER_CATEGORY_STORE = 'store';
BOOSTER_CATEGORY_CONSTRUCTON = 'construction';
BOOSTER_CATEGORY_GIFT = 'gift';

// Rarity list
BOOSTER_RARITY_NA = 'N/A';
BOOSTER_RARITY_COMMON = 'Common';
BOOSTER_RARITY_RARE = 'Rare';
BOOSTER_RARITY_EPIC = 'Epic';
BOOSTER_RARITY_LEGENDARY = 'Legendary';

BOOSTER_MONEY = 'booster_money';
BOOSTER_CHARM = 'booster_charm';
BOOSTER_LIGHTING_BOLT = 'booster_lighting_bolt';
BOOSTER_COFFEE_CUP = 'booster_coffee_cup';
BOOSTER_HAMBURGER = 'booster_hamburger';
BOOSTER_STORE_KEY = 'booster_store_key';
BOOSTER_SANDWICH_BOARD_GUY = 'booster_sandwich_board_guy';
BOOSTER_BILBOARDS = 'booster_bilboards';
BOOSTER_AD_TRUCK = 'booster_ad_truck';
BOOSTER_BUILDING_SIGN_SPOTLIGHT = 'booster_building_sign_spotlight';
BOOSTER_BLIMP = 'booster_blimp';
BOOSTER_PLANE_WITH_BANNER = 'booster_plane_with_banner';
BOOSTER_FACEBOOK_SHARE = 'booster_facebook_share';
BOOSTER_TWITTER_SHARE = 'booster_twitter_share';
BOOSTER_HARD_HAT = 'booster_hard_hat';
BOOSTER_SMALL_GIFT = 'booster_small_gift';
BOOSTER_BIG_GIFT = 'booster_big_gift';
BOOSTER_GIANT_GIFT = 'booster_giant_gift';

BOOSTER_GIFTS = [BOOSTER_SMALL_GIFT, BOOSTER_BIG_GIFT, BOOSTER_GIANT_GIFT];

BOOSTER_KEYS = [
  BOOSTER_CHARM, BOOSTER_LIGHTING_BOLT, BOOSTER_COFFEE_CUP, BOOSTER_HAMBURGER, BOOSTER_STORE_KEY,
  BOOSTER_SANDWICH_BOARD_GUY, BOOSTER_BILBOARDS, BOOSTER_BUILDING_SIGN_SPOTLIGHT, BOOSTER_BLIMP,
  BOOSTER_PLANE_WITH_BANNER, BOOSTER_FACEBOOK_SHARE, BOOSTER_TWITTER_SHARE, BOOSTER_HARD_HAT,
  BOOSTER_SMALL_GIFT, BOOSTER_BIG_GIFT, BOOSTER_GIANT_GIFT, BOOSTER_AD_TRUCK
];

boosterListNames = {};
boosterListNames[BOOSTER_MONEY] = 'Stocket bucks (money)';
boosterListNames[BOOSTER_CHARM] = 'Charm';
boosterListNames[BOOSTER_LIGHTING_BOLT] = 'Lighting bolt';
boosterListNames[BOOSTER_COFFEE_CUP] = 'Coffee cup';
boosterListNames[BOOSTER_HAMBURGER] = 'Hamburger';
boosterListNames[BOOSTER_STORE_KEY] = 'Key';
boosterListNames[BOOSTER_SANDWICH_BOARD_GUY] = 'Sandwich Board Guy';
boosterListNames[BOOSTER_BILBOARDS] = 'Billboards';
boosterListNames[BOOSTER_AD_TRUCK] = 'Ad Truck';
boosterListNames[BOOSTER_BUILDING_SIGN_SPOTLIGHT] = 'Building Sign and Spotlight';
boosterListNames[BOOSTER_BLIMP] = 'Blimp';
boosterListNames[BOOSTER_PLANE_WITH_BANNER] = 'Plane with banner';
boosterListNames[BOOSTER_FACEBOOK_SHARE] = 'Facebook sharing';
boosterListNames[BOOSTER_TWITTER_SHARE] = 'Twitter sharing';
boosterListNames[BOOSTER_HARD_HAT] = 'Hard hat';
boosterListNames[BOOSTER_SMALL_GIFT] = 'Small Gift Box';
boosterListNames[BOOSTER_BIG_GIFT] = 'Big Gift Box';
boosterListNames[BOOSTER_GIANT_GIFT] = 'Giant Gift Box';

boosterListActions = {};
boosterListActions[BOOSTER_MONEY] = 'bag of stocket bucks varying amounts';
boosterListActions[BOOSTER_CHARM] = 'add a charm to one staff';
boosterListActions[BOOSTER_LIGHTING_BOLT] = 'instantanious sale';
boosterListActions[BOOSTER_COFFEE_CUP] = 'add energy to one staff';
boosterListActions[BOOSTER_HAMBURGER] = 'fully wake up one staff';
boosterListActions[BOOSTER_STORE_KEY] = 'Open the store / safe or add time';
boosterListActions[BOOSTER_SANDWICH_BOARD_GUY] = 'Collectable - Boost crowd and time';
boosterListActions[BOOSTER_BILBOARDS] = 'Collectable - Boost crowd and time';
boosterListActions[BOOSTER_AD_TRUCK] = 'Collectable - Boost crowd and time';
boosterListActions[BOOSTER_BUILDING_SIGN_SPOTLIGHT] = 'Collectable - Boost crowd and time';
boosterListActions[BOOSTER_BLIMP] = 'Collectable - Boost crowd and time';
boosterListActions[BOOSTER_PLANE_WITH_BANNER] = 'Collectable - Boost crowd and time';
boosterListActions[BOOSTER_FACEBOOK_SHARE] = 'Instantanious - Boost crowd and time';
boosterListActions[BOOSTER_TWITTER_SHARE] = 'Instantanious - Boost crowd and time';
boosterListActions[BOOSTER_HARD_HAT] = 'Complete a construction';
boosterListActions[BOOSTER_SMALL_GIFT] = 'Common Powerups';
boosterListActions[BOOSTER_BIG_GIFT] = 'Common and Rare Powerups';
boosterListActions[BOOSTER_GIANT_GIFT] = 'Common, Rare, Epic and legendary Powerups';

module.exports = function(Booster) {
  Booster.prefixError = 'BTR_';
  Booster.definition.rawProperties.name.default =
    Booster.definition.properties.name.default = function() {
      return null;
  };

  Booster.definition.rawProperties.description.default =
    Booster.definition.properties.description.default = function() {
      return null;
  };

  Booster.definition.rawProperties.category.default =
    Booster.definition.properties.category.default = function() {
      return null;
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Booster.definition.rawProperties.created.default =
    Booster.definition.properties.created.default = function() {
      return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Booster.definition.rawProperties.modified.default =
    Booster.definition.properties.modified.default = function() {
      return new Date();
  };

  Booster.categories = function(next) {
    next(null, Booster.app.models.Setting.configs['BOOSTER_LIST_CATEGORY']);
  };

  Booster.beforeRemote("**", function(ctx, ints, next) {
    Booster.app.models.Member.getCurrentUser(ctx, function(err, userInfo) {
      if (err) {
        return next(err);
      }

      next();
    });
  });

  Booster.createDefaultList = function(ctx, next) {
    var configs = Booster.app.models.Setting.configs;
    var Member  = Booster.app.models.Member;
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    if (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1) {
      var error = new Error("Permission denied.");
      error.statusCode = 401;
      error.code = "AUTHORIZATION_REQUIRED";
      next(error);
    } else {
      var boosterList = [
        { key: BOOSTER_MONEY, name: 'Stocket bucks (money)', category: { code: BOOSTER_CATEGORY_MONEY, name: 'Money' }, rarity: BOOSTER_RARITY_COMMON, boostValue: { energy: null, times:null, crowd:null, finishConstruction:false }, price: 10, priceUnit: PRICE_UNIT_USD, restrictUnlock: null, requiredUnlock: null },
        { key: BOOSTER_CHARM, name: 'Charm', category: { code: BOOSTER_CATEGORY_STAFF, name: 'Staff' }, rarity: BOOSTER_RARITY_EPIC, boostValue: { energy: null, times:null, crowd:null, finishConstruction:false }, price: 10000, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: { restrict: { max: 3 } }, requiredUnlock: null },
        { key: BOOSTER_LIGHTING_BOLT, name: 'Lighting bolt', category: { code: BOOSTER_CATEGORY_STAFF, name: 'Staff' }, rarity: BOOSTER_RARITY_LEGENDARY, boostValue: { energy: null, times:null, crowd:null, finishConstruction:false }, price: 5000, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: { restrict: { max: 5 } }, requiredUnlock: null },
        { key: BOOSTER_COFFEE_CUP, name: 'Coffee cup', category: { code: BOOSTER_CATEGORY_STAFF, name: 'Staff' }, rarity: BOOSTER_RARITY_COMMON, boostValue: { energy: 0.1, times:null, crowd:null, finishConstruction:false }, price: 500, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: null, requiredUnlock: null },
        { key: BOOSTER_HAMBURGER, name: 'Hamburger', category: { code: BOOSTER_CATEGORY_STAFF, name: 'Staff' }, rarity: BOOSTER_RARITY_RARE, boostValue: { energy: null, times:null, crowd:null, finishConstruction:false }, price: 1000, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: null, requiredUnlock: null },
        { key: BOOSTER_STORE_KEY, name: 'Key', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_LEGENDARY, boostValue: { energy: null, times:600, crowd:100, finishConstruction:false }, price: 10, priceUnit: PRICE_UNIT_USD, restrictUnlock: null, requiredUnlock: null },
        { key: BOOSTER_SANDWICH_BOARD_GUY, name: 'Sandwich Board Guy', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_COMMON, boostValue: { energy: null, times:60, crowd:20, finishConstruction:false }, price: 500, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: null, requiredUnlock: { level: 1, stage: 1 } },
        { key: BOOSTER_BILBOARDS, name: 'Billboards', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_COMMON, boostValue: { energy: null, times:90, crowd:40, finishConstruction:false }, price: 1000, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: null, requiredUnlock: { level: 2, stage: 2 } },
        { key: BOOSTER_AD_TRUCK, name: 'Ad Truck', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_RARE, boostValue: { energy: null, times:120, crowd:60, finishConstruction:false }, price: 2000, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: null, requiredUnlock: { level: 3, stage: 1 } },
        { key: BOOSTER_BUILDING_SIGN_SPOTLIGHT, name: 'Building Sign and Spotlight', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_RARE, boostValue: { energy: null, times:150, crowd:80, finishConstruction:false }, price: 3000, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: null, requiredUnlock: { level: 3, stage: 2 } },
        { key: BOOSTER_BLIMP, name: 'Blimp', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_EPIC, boostValue: { energy: null, times:180, crowd:100, finishConstruction:false }, price: 4000, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: null, requiredUnlock: { level: 4, stage: 1 } },
        { key: BOOSTER_PLANE_WITH_BANNER, name: 'Plane with banner', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_LEGENDARY, boostValue: { energy: null, times:210, crowd:120, finishConstruction:false }, price: 5000, priceUnit: PRICE_UNIT_STOCKET, restrictUnlock: null, requiredUnlock: { level: 5, stage: 2 } },
        { key: BOOSTER_FACEBOOK_SHARE, name: 'Facebook sharing', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_NA, boostValue: { energy: null, times:180, crowd:50, finishConstruction:false }, price: 0, priceUnit: PRICE_UNIT_STOCKET_SHARE, restrictUnlock: { restrict: { max: 1 } }, requiredUnlock: null },
        { key: BOOSTER_TWITTER_SHARE, name: 'Twitter sharing', category: { code: BOOSTER_CATEGORY_STORE, name: 'Store' }, rarity: BOOSTER_RARITY_NA, boostValue: { energy: null, times:180, crowd:50, finishConstruction:false }, price: 0, priceUnit: PRICE_UNIT_STOCKET_SHARE, restrictUnlock: { restrict: { max: 1 } }, requiredUnlock: null },
        { key: BOOSTER_HARD_HAT, name: 'Hard hat', category: { code: BOOSTER_CATEGORY_CONSTRUCTON, name: 'Construction' }, rarity: BOOSTER_RARITY_LEGENDARY, boostValue: { energy: null, times:null, crowd:null, finishConstruction:true }, price: 5000, priceUnit: PRICE_UNIT_USD, restrictUnlock: null, requiredUnlock: null },
        { key: BOOSTER_SMALL_GIFT, name: 'Small Gift Box', category: { code: BOOSTER_CATEGORY_GIFT, name: 'Gift' }, rarity: BOOSTER_RARITY_RARE, boostValue: { energy: null, times:null, crowd:null, finishConstruction:false }, price: 10, priceUnit: PRICE_UNIT_USD, restrictUnlock: { restrict: { max: 1 } }, requiredUnlock: null },
        { key: BOOSTER_BIG_GIFT, name: 'Big Gift Box', category: { code: BOOSTER_CATEGORY_GIFT, name: 'Gift' }, rarity: BOOSTER_RARITY_EPIC, boostValue: { energy: null, times:null, crowd:null, finishConstruction:false }, price: 10, priceUnit: PRICE_UNIT_USD, restrictUnlock: { restrict: { max: 3 } }, requiredUnlock: null },
        { key: BOOSTER_GIANT_GIFT, name: 'Giant Gift Box', category: { code: BOOSTER_CATEGORY_GIFT, name: 'Gift' }, rarity: BOOSTER_RARITY_LEGENDARY, boostValue: { energy: null, times:null, crowd:null, finishConstruction:false }, price: 10, priceUnit: PRICE_UNIT_USD, restrictUnlock: { restrict: { max: 10 } }, requiredUnlock: null },
      ];

      ObjectID = Booster.getDataSource().ObjectID;

      async.each(boosterList, function(item, nextBooster) {
        item.id = ObjectID();
        item.name = boosterListNames[item.key];
        item.description = boosterListActions[item.key];
        Booster.findOrCreate({
          where: {
            key: item.key
          }
        }, item, function(err, log) {
          if (err) {
            nextBooster(err);
          } else {
            nextBooster();
          }
        });
      }, function(error) {
        if (error) {
          error.code = Booster.prefixError + "CD01";
          next(error);
        } else {
          next();
        }
      });
    }
  };

  // Use booster for staff
  Booster.staff = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var error = new Error();
    if (typeof data.staffId === 'undefined') {
      error.message = "Missing parameter: staffId";
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.staffId !== 'string') {
      error.message = "staffId is invalid";
      error.code = "INVALID_PARAMETER";
      error.field = "staffId";
      return next(error);
    }
    if (typeof data.boosterKey === 'undefined') {
      error.message = "boosterKey is invalid";
      error.code = "INVALID_PARAMETER";
      error.field = "boosterKey";
      return next(error);
    }
    if ((data.boosterKey === BOOSTER_HAMBURGER || data.boosterKey === BOOSTER_COFFEE_CUP) && typeof data.endurance === 'undefined') {
      error.message = "Missing parameter: endurance";
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    var configs       = Booster.app.models.Setting.configs;
    var Member        = Booster.app.models.Member;
    var Staff         = Booster.app.models.Staff;
    var MemberBooster = Booster.app.models.MemberBooster;
    var booster = null;
    var staff   = null;
    var player  = null;

    var updatedMemberBooster = false;
    async.series([
      function(ass_1) {
        // Validate Booster
        Booster.findOne({
          where: {
            key: data.boosterKey,
            'category.code': BOOSTER_CATEGORY_STAFF
          }
        }, function(err, foundBooster) {
          if(err) {
            ass_1(err);
          } else if(!foundBooster) {
            var error = new Error("Booster not found");
            error.code = Booster.prefixError + "ST01";
            ass_1(error);
          } else {
            booster = foundBooster;
            ass_1(null, foundBooster);
          }
        });
      },
      function(ass_1) {
        // Validate Staff
        Staff.findById(data.staffId, function(err, foundStaff) {
          if(err) {
            ass_1(err);
          } else if(!foundStaff) {
            var error = new Error("Staff not found");
            error.code = Booster.prefixError + "ST02";
            ass_1(error);
          } else {
            staff = foundStaff;
            ass_1(null, foundStaff);
          }
        });
      },
      function(ass_1) {
        // Validate Store
        player = userInfo;
        if(storeId != staff.storeId.toString()) {
          var error = new Error("Permission denied");
          error.code = Booster.prefixError + "ST03";
          ass_1(error);
        } else {
          ass_1(null, userInfo);
        }
      },
      function(ass_1) {
        // Validate MemberBooster
        MemberBooster.concurrentCheckAndUseBooster(userInfo.id, data.boosterKey, function(err, foundMemberBooster) {
          if(err) {
            return ass_1(err);
          }

          if (!foundMemberBooster) {
            error = new Error("Current player does not have any "+ data.boosterKey);
            error.code = Booster.prefixError + "ST04";
            return ass_1(error);
          }
          updatedMemberBooster = true;
          ass_1(null, foundMemberBooster);
        });
      },
      function(ass_1) {
        // update staff base on booterKey
        if(booster.key == BOOSTER_HAMBURGER || booster.key == BOOSTER_COFFEE_CUP || booster.key == BOOSTER_CHARM) {
          var saveOptions = { validate: true };
          switch(booster.key) {
            case BOOSTER_HAMBURGER:
            case BOOSTER_COFFEE_CUP:
              staff.__data.status.endurance = data.endurance;
            break;
            case BOOSTER_CHARM:
              staff.__data.status.hearts++;
              saveOptions['inc'] = { 'status.hearts': 1 }
            break;
          };
          var storeMaxHearts = Staff.app.models.Setting.configs['STAFF_MAX_HEARTS'];
          if (staff.__data.status.hearts > storeMaxHearts) {
            var error = new Error('Number of hearts reached to maximum');
            error.code = Booster.prefixError + "ST05";
            ass_1(error);
          } else {
            staff.save( saveOptions, function(err, savedStaff) {
              if(err) {
                return ass_1(err);
              }
              return ass_1();
            });
          }
        }
        else {
          ass_1();
        }
      }
    ], function(err, res) {
      if(err) {
        if (updatedMemberBooster) {
          MemberBooster.rollBackUseBooster(userInfo.id, data.boosterKey, function(err1) {
            if (err1) {
              return next(err1);
            }

            next(err);
          });
        }
        else {
          next(err);
        }
      } else {
        next(null, res[3]);
      }
    });
  };

  // Use booster for store
  Booster.store = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    if(typeof data !== 'object') {
      error = new Error("Invalid parameters: data must be an object");
      error.code = "INVALID_PARAMETER";
      error.field = "data";
      return next(error);
    }
    if(typeof data.boosterKey === 'undefined') {
      var error = new Error("Missing parameter: boosterKey")
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.boosterKey !== 'string') {
      error = new Error("Invalid parameters: boosterKey must be a string");
      error.code = "INVALID_PARAMETER";
      error.field = "boosterKey";
      return next(error);
    }

    if (data.boosterKey === BOOSTER_STORE_KEY && typeof data.storeStatus === 'undefined') {
      var error = new Error("Missing parameter: storeStatus")
      error.code = "MISSING_PARAMETER";
      return next(error);
    }

    if (typeof data.storeCrowd === 'undefined') {
      var error = new Error("Missing parameter: storeCrowd");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }

    if(!validator.isInt(data.storeCrowd)) {
      error = new Error("Invalid parameters: storeCrowd must be a number");
      error.code = "INVALID_PARAMETER";
      error.field = "storeCrowd";
      return next(error);
    }

    if (typeof data.openTime === 'undefined') {
      var error = new Error("Missing parameter: openTime");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }

    if(!validator.isInt(data.openTime)) {
      error = new Error("Invalid parameters: openTime must be a number");
      error.code = "INVALID_PARAMETER";
      error.field = "openTime";
      return next(error);
    }

    var Store   = Booster.app.models.Store;
    var Member  = Booster.app.models.Member;
    var MemberActionStatistic  = Booster.app.models.MemberActionStatistic;
    var MemberBooster  = Booster.app.models.MemberBooster;
    var configs  = Booster.app.models.Setting.configs;
    var booster = null;
    var memberBooster = null;
    var store   = null;
    var player  = null;
    var oldLastOpen = null;

    var updatedMemberBooster = false;
    async.series([
      function(ass_1) {
        // Validate Booster
        Booster.findOne({
          where: {
            key: data.boosterKey,
            'category.code': BOOSTER_CATEGORY_STORE
          }
        }, function(err, foundBooster) {
          if(err) {
            ass_1(err);
          } else if(!foundBooster) {
            error = new Error("Booster not found");
            error.code = Booster.prefixError + "SE01";
            ass_1(error);
          } else {
            booster = foundBooster;
            if(data.boosterKey === BOOSTER_STORE_KEY) {
              if(data.storeStatus == STORE_STATUS_OVERTIME && !validator.isInt(booster.boostValue.times)) {
                error = new Error("Invalid boostValue: times");
                error.code = Booster.prefixError + "SE02";
                ass_1(error);
              } else {
                ass_1(null, foundBooster);
              }
            } else {
              ass_1(null, foundBooster);
            }
          }
        });
      },
      function(ass_1) {
        // Get current store
        player = userInfo;
        userInfo.getStore(function(err, userStore) {
          if(err) {
            ass_1(err);
          } else {
            store = userStore;
            ass_1(null, userStore);
          }
        });
      },
      function(ass_1) {
        // Validate MemberBooster
        MemberBooster.concurrentCheckAndUseBooster(userInfo.id, data.boosterKey, function(err, foundMemberBooster) {
          if(err) {
            return ass_1(err);
          }

          if (!foundMemberBooster) {
            error = new Error("Current player does not have any "+ data.boosterKey);
            error.code = Booster.prefixError + "SE03";
            return ass_1(error);
          }
          updatedMemberBooster = true;
          ass_1(null, foundMemberBooster);
        });
      },
      function(ass_1) {
        // Validate data.storeStatus
        if (data.boosterKey === BOOSTER_STORE_KEY && typeof data.storeStatus !== 'undefined') {
          if(!validator.isIn(data.storeStatus, STORE_STATUS)) {
            error = new Error("Invalid parameters: storeStatus");
            error.code = "INVALID_PARAMETER";
            error.field = "storeStatus";
            ass_1(error);
          } else {
            ass_1();
          }
        } else {
          data.storeStatus = '';
          ass_1();
        }
      },
      function(ass_1) {
        var updateData = {};
        // Update store
        oldLastOpen = clone(store.__data.lastOpen);
        if(typeof oldLastOpen === 'undefined') {
          oldLastOpen = new Date();
        }
        if(data.boosterKey === BOOSTER_STORE_KEY) {
          if(data.storeStatus === STORE_STATUS_OPEN) {
            store.__data.lastOpen = new Date();
            store.__data.notified = 0;
            if(store.__data.openStatus === STORE_STATUS_CLOSED) {
              // Reset statistic in global store and in each cell.
              store.__data.totalOpenTime = data.openTime;
              userInfo.incTotalOpenSessions(1, function() {});
              store.__data.statistic.money = 0;
              store.__data.statistic.total_spawned_customers = 0;
              store.__data.statistic.event_satisfied_customers = 0;
              store.__data.statistic.total_satisfied_customers = 0;
              store.__data.statistic.customer_specific = 0;
              store.__data.statistic.customer_impulse = 0;
              store.__data.statistic.customer_window = 0;
              store.__data.statistic.customer_bigspender = 0;
              store.__data.statistic.customer_leprechaun = 0;
              store.__data.statistic.customer_specific_sold = 0;
              store.__data.statistic.customer_impulse_sold = 0;
              store.__data.statistic.customer_window_sold = 0;
              store.__data.statistic.customer_bigspender_sold = 0;
              store.__data.statistic.customer_leprechaun_sold = 0;

              var nOfCells = store.cells.length;
              for (var i = 0; i < nOfCells; i++) {
                store.__data.cells[i].total_satisfied_customers = 0;
              }
            }

            store.__data.openTime = data.openTime;
            store.__data.openStatus = STORE_STATUS_OPEN;
            store.__data.environment = STORE_ENV_DAY;
            store.__data.closingTime = 0;
            store.__data.displayCloseout = false;
            store.__data.crowd = data.storeCrowd;
            for(index in store.__data.cells) {
              store.__data.cells[index].safeSaleCounter = 0;
            }
          } else if(data.storeStatus === STORE_STATUS_OVERTIME) {
            store.__data.totalOpenTime += booster.boostValue.times;
            store.__data.openTime = data.openTime;
            store.__data.openStatus = STORE_STATUS_OVERTIME;
            store.__data.environment = STORE_ENV_NIGHT;
            store.__data.closingTime = 0;
            store.__data.notified = 0;
            store.__data.displayCloseout = true;
            store.__data.crowd = data.storeCrowd;
            updateData = {
              inc: {
                totalOpenTime: booster.boostValue.times
              }
            };
          } else {
            error = new Error("Invalid status");
            error.code = Booster.prefixError + "SE04";
            return ass_1(error);
          }
          // This is used for validation on store.save
          store.__data.openStatus = data.storeStatus;
        } else {
          // Other cases
          store.__data.crowd = data.storeCrowd;
          store.__data.openTime = data.openTime;
        }

        if (data.boosterKey === BOOSTER_STORE_KEY) {
          // This is used for validation on store.save
          store.__data.openStatus = data.storeStatus;
        }

        store.update(updateData, function(err, savedStore) {
          if(err) {
            ass_1(err);
          } else {
            ass_1();
          }
        });
      },
      function(ass_1) {
        if(data.boosterKey == BOOSTER_STORE_KEY) {
          var yesterday = Date.yesterday().setHours(0,0,0,0);
          var lastOpen = oldLastOpen || null;
          if(lastOpen === null) {
            MemberActionStatistic.actionCounter(player.id, MISSION_ACTION_TOTAL_OPEN_STORE_DAY, 1, function(err) {
              if(err) return next(err);
            })
          } else {
            lastOpen = lastOpen.setHours(0,0,0,0);
            if(lastOpen == yesterday) {
              MemberActionStatistic.actionCounter(player.id, MISSION_ACTION_TOTAL_OPEN_STORE_DAY, 1, function(err) {
                if(err) return next(err);
              })
            }
            if(new Date(lastOpen).isBefore(yesterday)) {
              MemberActionStatistic.update({ memberId: player.id.toString(), actionKey: MISSION_ACTION_TOTAL_OPEN_STORE_DAY} , {
                number: 1
              }, function(err) {
                if(err) return next(err);
              })
            }
          }
          ass_1();
        } else {
          ass_1();
        }
      }
    ], function(err, res) {
      if(err) {
        if (updatedMemberBooster) {
          MemberBooster.rollBackUseBooster(userInfo.id, data.boosterKey, function(err1) {
            if (err1) {
              return next(err1);
            }

            next(err);
          });
        }
        else {
          next(err);
        }
      } else {
        next(null, res[2]);
      }
    });
  };

  // Use booster for construction
  Booster.construction = function(ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var Member        = Booster.app.models.Member;
    var MemberBooster = Booster.app.models.MemberBooster;
    var Store   = Booster.app.models.Store;
    var booster = null;
    var store   = null;

    var data = {
      boosterKey: BOOSTER_HARD_HAT
    };
    var updatedMemberBooster = false;
    var cellConstructing = -1;
    async.series([
      function(ass_1) {
        Booster.findOne({
          where: {
            key: data.boosterKey,
            'category.code': BOOSTER_CATEGORY_CONSTRUCTON
          }
        }, function(err, foundBooster) {
          if(err) {
            ass_1(err);
          } else if(!foundBooster) {
            error = new Error("Booster not found");
            error.code = Booster.prefixError + "CO01";
            ass_1(error);
          } else {
            booster = foundBooster;
            ass_1(null, foundBooster);
          }
        });
      },
      function(ass_1) {
        player = userInfo;
        userInfo.getStore(function(err, userStore) {
          if(err) {
            ass_1(err);
          } else {
            store = userStore;
            for( i = 0; i < store.cells.length; i++ ) {
              if(store.cells[i].status === STORE_CELL_STATUS_UNDER_CONSTRUCTION) {
                cellConstructing = i;
                break;
              }
            }

            if (cellConstructing === -1) {
              error = new Error("There is no construction");
              error.code = Booster.prefixError + "CO03";
              return ass_1(error);
            }

            ass_1(null, userStore);
          }
        });
      },
      function(ass_1) {
        // Validate MemberBooster
        MemberBooster.concurrentCheckAndUseBooster(userInfo.id, data.boosterKey, function(err, foundMemberBooster) {
          if(err) {
            return ass_1(err);
          }

          if (!foundMemberBooster) {
            error = new Error("Current player does not have any "+ data.boosterKey);
            error.code = Booster.prefixError + "CO02";
            return ass_1(error);
          }
          updatedMemberBooster = true;
          ass_1(null, foundMemberBooster);
        });
      },
      function(ass_1) {
        // update store construction
        store.__data.constructionTime = 0;
        store.__data.constructionStatus = STORE_CONSTRUCTION_STATUS_FINISHED;
        store.__data.constructionType = null;
        store.__data.cells[cellConstructing].status = STORE_CELL_STATUS_UNASSIGNED;
        var activeCells = Store.countActiveCells(store.__data.cells);
        store.__data.activeCells = activeCells;
        store.save(function(err, savedStore) {
          if(err) {
            return ass_1(err);
          }
          return ass_1();
        });
      }
    ], function(err, res) {
      if(err) {
        if (updatedMemberBooster) {
          MemberBooster.rollBackUseBooster(userInfo.id, data.boosterKey, function(err1) {
            if (err1) {
              return next(err1);
            }

            next(err);
          });
        }
        else {
          next(err);
        }
      } else {
        next(null, res[2]);
      }
    });
  };

  // Use booster for safebox
  Booster.safebox = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    if(typeof data !== 'object') {
      error = new Error("Invalid parameters: data");
      error.code = "INVALID_PARAMETER";
      error.field = "data";
      return next(error);
    }
    if(typeof data.safeBoxId === 'undefined') {
      var error = new Error("Missing parameter: safeBoxId");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.safeBoxId !== 'string') {
      error = new Error("Invalid parameters: safeBoxId must be a string");
      error.code = "INVALID_PARAMETER";
      error.field = "safeBoxId";
      return next(error);
    }
    // Set default boosterKey for this action
    data.boosterKey   = BOOSTER_STORE_KEY;
    var Safebox       = Booster.app.models.Safebox;
    var Member        = Booster.app.models.Member;
    var MemberBooster = Booster.app.models.MemberBooster;
    var booster = null;
    var player  = null;
    var safebox = null;

    var updatedMemberBooster = false;
    async.series([
      function(ass_1) {
        // Check safeBox valid
        Safebox.findById(data.safeBoxId, function(err, foundSafeBox) {
          if(err) {
            ass_1(err);
          } else if(!foundSafeBox) {
            error = new Error("Safebox not found");
            error.code = Booster.prefixError + "SB01";
            ass_1(error);
          } else {
            safebox = foundSafeBox;
            if (foundSafeBox.safeStatus === SAFE_STATUS_COLLECTABLE) {
              error = new Error("Safebox is collectable now.");
              error.code = Booster.prefixError + "SB04";
              return ass_1(error);
            }
            else if (foundSafeBox.safeTypeChoice === SAFE_TYPE_NONE) {
              error = new Error("Safebox choice is none.");
              error.code = Booster.prefixError + "SB05";
              return ass_1(error);
            }
            else if (foundSafeBox.safeStatus !== SAFE_STATUS_ONGOING_TIMER) {
              error = new Error("Safebox timer is not on going now.");
              error.code = Booster.prefixError + "SB06";
              return ass_1(error);
            }
            ass_1(null, foundSafeBox);
          }
        });
      },
      function(ass_1) {
        player = userInfo;
        userInfo.getStore(function(err, userStore) {
          if(err) {
            ass_1(err);
          } else {
            if(safebox.storeId.toString() !== userStore.id.toString()) {
              error = new Error("Permission denied");
              error.code = Booster.prefixError + "SB02";
              ass_1(error);
            } else {
              ass_1(null, userInfo);
            }
          }
        });
      },
      function(ass_1) {
        // Validate MemberBooster
        MemberBooster.concurrentCheckAndUseBooster(userInfo.id, data.boosterKey, function(err, foundMemberBooster) {
          if(err) {
            return ass_1(err);
          }

          if (!foundMemberBooster) {
            error = new Error("Current player does not have any "+ data.boosterKey);
            error.code = Booster.prefixError + "SB03";
            return ass_1(error);
          }
          updatedMemberBooster = true;
          ass_1(null, foundMemberBooster);
        });
      },
      function(ass_1) {
        safebox.__data.safeTime = 0;
        safebox.__data.safeStatus = SAFE_STATUS_COLLECTABLE;
        safebox.save({ validate: true }, function(err, savedSafeBox) {
          if(err) {
            return ass_1(err);
          } else if(!savedSafeBox) {
            error = new Error("Invalid parameters: safeBoxId");
            error.code = "INVALID_PARAMETER";
            error.field = "safeBoxId";
            return ass_1(error);
          }

          ass_1();
        });
      }
    ], function(err, res) {
      if(err) {
        if (updatedMemberBooster) {
          MemberBooster.rollBackUseBooster(userInfo.id, data.boosterKey, function(err1) {
            if (err1) {
              return next(err1);
            }

            next(err);
          });
        }
        else {
          next(err);
        }
      } else {
        next(null, res[2]);
      }
    });
  };

  Booster.validateRequiredFields = function(fields, inputData, next) {
    var missingFields = [];
    fields.forEach(function(fieldName) {
      if(!(fieldName in inputData)) {
        missingFields.push(fieldName);
      }
    });

    return missingFields;
  };

  Booster.usingGiftbox = function(data, ctx, next) {
    var error = null;
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var MemberBooster = Booster.app.models.MemberBooster;
    var requiredFields = ["giftCode", "rewardBoosters"];
    var missingFields = Booster.validateRequiredFields(requiredFields, data, next);
    if(missingFields.length > 0) {
      error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      error.field = missingFields.join(', ');
      error.statusCode = 400;
      return next(error);
    }

    if (data.giftCode && BOOSTER_GIFTS.indexOf(data.giftCode) === -1) {
      error = new Error("Invalid parameter: giftCode is not exists in booster gift category.");
      error.code = "INVALID_PARAMETER";
      error.field = 'giftCode';
      return next(error);
    }
    if (data.rewardBoosters && !data.rewardBoosters.length) {
      error = new Error("Invalid parameter: rewardBoosters is empty.");
      error.code = "INVALID_PARAMETER";
      error.field = 'rewardBoosters';
      return next(error);
    }

    // Check reward booster.
    var rewardBoosters = [];
    var budget = 0;
    var flagError = true;
    data.rewardBoosters.forEach(function(item) {
      if (item.boosterKey) {
        flagError = false;
        if (item.boosterKey !== BOOSTER_MONEY) {
          if (BOOSTER_KEYS.indexOf(item.boosterKey) > -1) {
            item.memberId = userInfo.id;
            item.number = item.number ? parseInt(item.number) : 1;
            rewardBoosters.push(item);
          }
        }
        else {
          budget += parseInt(item.number);
        }
      }
    });

    if (flagError) {
      error = new Error("Invalid parameter: rewardBoosters is not contains boosterKey or boosterKey is invalid.");
      error.code = "INVALID_PARAMETER";
      error.field = 'rewardBoosters';
      return next(error);
    }

    if ((!rewardBoosters.length && !budget) || budget < 0) {
      error = new Error("Invalid parameter: booster_money required a number of added stocket buck.");
      error.code = "INVALID_PARAMETER";
      error.field = 'rewardBoosters';
      return next(error);
    }

    // Using gitbox.
    MemberBooster.concurrentCheckAndUseBooster(userInfo.id, data.giftCode, function(err, mBooster) {
      if (err) {
        return next(err);
      }

      async.parallel([
        function(async_cb) {
          if (budget) {
            return userInfo.updateBudget({"budget": budget}, async_cb);
          }
          async_cb();
        },
        function(async_cb) {
          MemberBooster.upsertMultiple(rewardBoosters, false, function(err, updatedMemberBoosters) {
            if (err) {
              if (!updatedMemberBoosters) {
                return async_cb(err);
              }

              // Rollback updated data.
              var rollbackMemberBoosters = [];
              updatedMemberBoosters.forEach(function(updatedItem) {
                rewardBoosters.forEach(function(item) {
                  if (updatedItem.boosterKey === item.boosterKey) {
                    rollbackMemberBoosters.push(item);
                  }
                });
              });
              return MemberBooster.upsertMultiple(rollbackMemberBoosters, true, function() {
                async_cb(err);
              });
            }
            async_cb(null, updatedMemberBoosters);
          });
        }
      ], function(err, results) {
        if (err) {
          MemberBooster.rollBackUseBooster(userInfo.id, data.giftCode, function() {
            return next(err);
          });
          return ;
        }
        var res = results[1] || [];
        if (budget) {
          var updateMember = results[0] || {};
          var item = {
            boosterKey: BOOSTER_MONEY,
            memberId: userInfo.id,
            number: updateMember.budget,
            id: userInfo.id
          };
          res.push(item);
        }

        next(null, res);
      });
    });
  };

  Booster.share = function(data, ctx, next) {
    var error = null;
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if(typeof data.boosterKey !== 'string') {
      error = new Error("Invalid parameters: boosterKey must be a string");
      error.code = "INVALID_PARAMETER";
      error.field = "boosterKey";
      return next(error);
    }
    if (data.boosterKey !== BOOSTER_FACEBOOK_SHARE && data.boosterKey !== BOOSTER_TWITTER_SHARE) {
      error = new Error("Invalid parameters: boosterKey invalid");
      error.code = "INVALID_PARAMETER";
      error.field = "boosterKey";
      return next(error);
    }

    var snName = SOCIAL_NETWORK.FACEBOOK;
    if (data.boosterKey === BOOSTER_TWITTER_SHARE) {
      snName = SOCIAL_NETWORK.TWITTER;
    }

    var limitSharing = Booster.app.models.Setting.configs['BOOSTER_SHARE_LIMIT_PER_DATE'] || 1;
    var period = Booster.app.models.Setting.configs['BOOSTER_SHARE_LIMIT_IN_PERIOD'] || 86400;
    var sharingStatus = userInfo.isAvailableSharing(snName);
    if (!sharingStatus) {
      error = new Error("Sharing on " + snName + " is over quota (" + limitSharing + " times in " + period + "s)");
      error.code = Booster.prefixError + "SH01";
      return next(error);
    }

    var now = new Date();
    async.parallel([
      function(ass_1) {
        if (data.boosterKey === BOOSTER_FACEBOOK_SHARE) {
          return Booster.app.models.MemberActionStatistic.actionCounter(userInfo.id, MISSION_ACTION_TOTAL_INVITATION_FRIEND, 1, ass_1);
        }
        ass_1();
      },
      function(ass_1) {
        if (typeof userInfo.share === 'undefined') {
          userInfo.share = {};
        }
        if (!userInfo.share[snName]) {
          userInfo.share[snName] = {};
          userInfo.share[snName].count = 1;
          userInfo.share[snName].sharedDate = now;
          userInfo.share[snName].startedEvent = false;
        }
        else {
          var count = userInfo.share[snName].count + 1;
          if (sharingStatus === 2) {
            userInfo.share[snName].sharedDate = now;
            userInfo.share[snName].startedEvent = false;
            count = 1;
          }
          userInfo.share[snName].count = count;
        }

        var eventPossible = userInfo.isAnyEventPossible();
        userInfo.updateAttributes({"share": userInfo.share}, function(err, updatedMember) {
          if (err) {
            return ass_1(err);
          }

          userInfo.share[snName].eventPossible = eventPossible ? true : false;
          userInfo.share[snName].eventAvailable = eventPossible ? eventPossible : [];
          ass_1(null, userInfo.share[snName]);
        });
      }
    ], function(err, res) {
      if (err) {
        return next(err);
      }

      next(null, res[1]);
    });
  };

  Booster.getCategories = function(next){
    var BoosterCollection = Booster.getDataSource().connector.collection(Booster.modelName);
    BoosterCollection.distinct( "category",
      function(err, records) {
        if(err) {
          next(err);
        } else {
          next(null,records);
        }
      });
  };

  Booster.getBoosterKeys = function(next) {
    next(null, BOOSTER_KEYS);
  };

  Booster.setup = function() {
    Booster.disableRemoteMethod('createChangeStream',true);
    Booster.disableRemoteMethod('create',true);
    Booster.disableRemoteMethod('upsert',true);
    Booster.disableRemoteMethod('exists',true);
    Booster.disableRemoteMethod('findOne',true);
    Booster.disableRemoteMethod('updateAll',true);
    Booster.disableRemoteMethod('replaceById',true);
    Booster.disableRemoteMethod('replaceOrCreate',true);
    Booster.disableRemoteMethod('upsertWithWhere',true);

    function validateName(err) {
      if(typeof this.name !== 'undefined' && this.name) {
        if(!validator.isLength(this.name, 1, 200)) {
          err();
        }
      }
    }
    Booster.validate('name', validateName, {message: 'Name is invalid'});

    Booster.validatesUniquenessOf('key', {message: 'key is used or invalid'});

    function validatePrice(err) {
      if(typeof this.price !== 'undefined' && this.price != null) {
        // number and equal or greater than 0
        if(!validator.isNumeric(this.price) || this.price < 0) {
          err();
        }
      }
    }
    Booster.validate('price', validatePrice, {message: 'Price is invalid'});

    function validatePriceUnit(cb_err) {
      if (typeof this.priceUnit !== 'undefined' && this.priceUnit) {
        if (!validator.isIn(this.priceUnit, PRICE_UNIT)) {
          cb_err();
        }
      }
    }
    Booster.validate('priceUnit', validatePriceUnit, {message: 'Invalid priceUnit'});

    Booster.validatesUniquenessOf('key', {message: 'key is used or invalid'});
    // -------------------------------------------------------------------------------

    Booster.remoteMethod(
      'categories',
      {
        description: 'Return all Booster categories',
        accessType: 'READ',
        returns: {arg: 'data', type: 'any', root: true},
        http: {verb: 'get', path : '/categories'}
      }
    );

    Booster.remoteMethod(
      'createDefaultList',
      {
        accessType: 'WRITE',
        accepts: { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}},
        description: 'Create a new instance of the model and persist it into the data source.',
        http: {verb: 'post', path: '/createDefaultList'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );

    // Use booster for staff
    Booster.remoteMethod(
      'staff',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: 'Model instance data', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Use booster for staff.',
        http: {verb: 'PUT', path: '/staff'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );

    // Use booster for store
    Booster.remoteMethod(
      'store',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: 'Model instance data', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Use booster for store.',
        http: {verb: 'PUT', path: '/store'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );

    // Use booster for construction
    Booster.remoteMethod(
      'construction',
      {
        accessType: 'WRITE',
        accepts: { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}},
        description: 'Use booster for construction.',
        http: {verb: 'PUT', path: '/construction'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );

    // Use booster for safebox
    Booster.remoteMethod(
      'safebox',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: 'Model instance data', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Use booster for store.',
        http: {verb: 'PUT', path: '/safebox'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );

    Booster.remoteMethod(
      'usingGiftbox',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{giftCode: "x", rewardBoosters: [{boosterKey: "x"}]}', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Use booster for store.',
        http: {verb: 'PUT', path: '/giftbox'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
    Booster.remoteMethod(
      'share',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{boosterKey: "x"}', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'After share to Social network (FB, Twitter), call this API to statistic.',
        http: {verb: 'PUT', path: '/share'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
    Booster.remoteMethod(
      'getCategories' ,
      {
        description: 'Get Categories form Booster.',
        returns: {arg: 'data', type: 'any', root: true},
        http: {verb: 'get', path: '/getCategories'}
      }
    );
    Booster.remoteMethod(
      'getBoosterKeys' ,
      {
        description: 'Get Categories form Booster.',
        returns: {arg: 'data', type: 'any', root: true},
        http: {verb: 'get', path: '/getBoosterKeys'}
      }
    )
  };

  Booster.setup();
}
