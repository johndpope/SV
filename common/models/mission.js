var async = require('async');
MISSION_ACTION_TOTAL_SALE = 'total_sale'; //total sold product
MISSION_ACTION_TOTAL_CONSECUTIVE_SALES = 'total_consecutive_sales'; // total consecutive sales
MISSION_ACTION_TOTAL_MAKE_PRODUCT = 'total_make_product'; // increase when player add a product to system by js stock script,
MISSION_ACTION_TOTAL_STOCK_PRODUCT = 'total_stock_product';  // number stocked product of users,
MISSION_ACTION_TOTAL_STOCK_EXCLUSIVE_PRODUCT = 'total_stock_exclusive_product';  // number of exclusive product that player stocked
MISSION_ACTION_TOTAL_INVITATION_FRIEND = 'total_invitation_friend'; //  if user invite sucessfully a friend who join the app? ( NOT in MVP ).
MISSION_ACTION_TOTAL_OPEN_STORE_TIME = 'total_open_store_time'; // total time store open ( will be added when add new key )
MISSION_ACTION_TOTAL_OPEN_STORE_DAY = 'total_open_store_day'; // total day open continuesly
MISSION_ACTION_TOTAL_BRAND = 'total_brand', // Count number of brand in store.
MISSION_ACTION_ADD_A_FB_FRIEND_SUCCESS = 'add_social_connection', // Add social Connection: member.friendsFB != empty.
MISSION_ACTION_TOTAL_CONNECTIONS = 'total_connections', // Add social Connection: Total connections.
MISSION_ACTION_TOTAL_PURCHASE_IN_YOUR_STORE = 'total_purchase_in_your_store', // [CHANGE] NOT statistic now.
MISSION_ACTION_UPDATE_STORE_NAME = 'update_store_name'
MISSION_ACTION_PICK_A_PRODUCT = 'pick_a_product', // Add a product into store.
MISSION_ACTION_OPEN_STORE = 'open_store', // Open a store. check field store.lastOpen is not null, that mean this mission is completed.
MISSION_ACTION_BUILD_A_SECOND_FOOR = 'build_a_second_foor', // Total cells in store >= 2.
MISSION_ACTION_FIND_A_EXCLUSIVE_ON_MARKETPLACE = 'find_a_exclusive_on_marketplace', // Stock an exclusive in your store

MISSION_TYPE_NORMAL = "normal";
MISSION_TYPE_SECRET = "secret";
MISSION_TYPE_SALESHARK = "saleshark";
MISSION_TYPES = [MISSION_TYPE_NORMAL, MISSION_TYPE_SECRET, MISSION_TYPE_SALESHARK];

MISSION_STATUS_COLLECTABLE = "collectable";
MISSION_STATUS_COLLECTED = "collected";
MISSION_STATUS_ONGOING = "ongoing";

module.exports = function(Mission) {
  Mission.prefixError = "MIS_";
  Mission.disableRemoteMethod('upsert',true);
  Mission.disableRemoteMethod('exists',true);
  Mission.disableRemoteMethod('createChangeStream',true);
  Mission.disableRemoteMethod('findOne',true);
  Mission.disableRemoteMethod('updateAll',true);
  Mission.disableRemoteMethod('upsertWithWhere',true);
  Mission.disableRemoteMethod('replaceById',true);
  Mission.disableRemoteMethod('replaceOrCreate',true);
  Mission.disableRemoteMethod('updateOrCreate',true);

 // RemoteMethod: Add a new key if it is not exists
  Mission.createDefaultList = function(ctx, next){
    if(ctx.user) {
      var userInfo = ctx.user;
      if (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1) {
        var error = new Error("Permission denied.");
        error.statusCode = 401;
        error.code = "AUTHORIZATION_REQUIRED";
        return next(error);
      }
      var defaultList = [
        {"name": "Grand Opening", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "Update name of your store", "action": MISSION_ACTION_UPDATE_STORE_NAME, "number": 1}
          , {"actionName": "Pick a brand_new 1", "action": MISSION_ACTION_TOTAL_BRAND, "number": 2}
          , {"actionName": "Pick a product 2", "action": MISSION_ACTION_PICK_A_PRODUCT, "number": 1}
          , {"actionName": "Open a store 2", "action": MISSION_ACTION_OPEN_STORE, "number": 1}
          ], "rewards": 500, "powerUp": [BOOSTER_STORE_KEY]}

        ,{"name":"Anh bi", type:MISSION_TYPE_NORMAL, "criteria":[{"actionname": "libiAction", "action": MISSION_ACTION_TOTAL_SALE, "number":11}
          , {"actionName":"UnknowAction", "action":MISSION_ACTION_TOTAL_BRAND, "number": 22}
          ], "rewards":1000, "powerUp":[BOOSTER_SMALL_GIFT]}
        ,{"name": "Hot Wired", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "Add social Connection", "action": MISSION_ACTION_ADD_A_FB_FRIEND_SUCCESS, "number": 1}]
          , "rewards": 1000, "powerUp": [BOOSTER_STORE_KEY, BOOSTER_SMALL_GIFT]}
        ,{"name": "Deal maker", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "Make 5 sales", "action": MISSION_ACTION_TOTAL_SALE, "number": 5}
          , {"actionName": "Stock 5 products", "action": MISSION_ACTION_TOTAL_STOCK_PRODUCT, "number": 5}
          ], "rewards": 1000, "powerUp": [BOOSTER_SMALL_GIFT]}
        ,{"name": "Show me the money", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "Make 10 sales", "action": MISSION_ACTION_TOTAL_SALE, "number": 10}
          , {"actionName": "Invite one friend", "action": MISSION_ACTION_TOTAL_INVITATION_FRIEND, "number": 1}
          ], "rewards": 2000, "powerUp": [BOOSTER_SMALL_GIFT]}
        ,{"name": "Deal Hunter", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "Stock 1 exclusive product", "action": MISSION_ACTION_TOTAL_STOCK_EXCLUSIVE_PRODUCT, "number": 1}
          , {"actionName": "Find an exclusive product on the market place", "action": MISSION_ACTION_FIND_A_EXCLUSIVE_ON_MARKETPLACE, "number": 1}
          ], "rewards": 3000, "powerUp": [BOOSTER_SMALL_GIFT]}
        ,{"name": "Wheeler dealer", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "Make 10 consecutive sales without loosing a customer", "action": MISSION_ACTION_TOTAL_CONSECUTIVE_SALES, "number": 10}
          , {"actionName": "Build a second floor", "action": MISSION_ACTION_BUILD_A_SECOND_FOOR, "number": 1}
          ], "rewards": 5000, "powerUp": [BOOSTER_SMALL_GIFT]}
        ,{"name": "Go getter", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "Stock 5 exclusive products", "action": MISSION_ACTION_TOTAL_STOCK_EXCLUSIVE_PRODUCT, "number": 5}
          , {"actionName": "Build a second brand", "action": MISSION_ACTION_TOTAL_BRAND, "number": 2}
          ], "rewards": 7000, "powerUp": [BOOSTER_BIG_GIFT]}
        ,{"name": "Head Honcho", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "Stock 20 exclusive products", "action": MISSION_ACTION_TOTAL_STOCK_EXCLUSIVE_PRODUCT, "number": 20}
          , {"actionName": "Open store 5 days in a row", "action": MISSION_ACTION_TOTAL_OPEN_STORE_DAY, "number": 5}
          ], "rewards": 10000, "powerUp": [BOOSTER_BIG_GIFT]}
        ,{"name": "Social Butterfly", type: MISSION_TYPE_NORMAL, "criteria":[{"actionName": "10 new players join game by your invitations", "action": MISSION_ACTION_TOTAL_INVITATION_FRIEND, "number": 10}]
          , "rewards": 20000, "powerUp": [BOOSTER_GIANT_GIFT, BOOSTER_STORE_KEY, BOOSTER_HARD_HAT]}
        ,{"name": "S1", type: MISSION_TYPE_SECRET, "criteria":[{"actionName": "Reach 15 connections", "action": MISSION_ACTION_TOTAL_CONNECTIONS, "number": 15}
          , {"actionName": "Reach 50,000 overal in sales", "action": MISSION_ACTION_TOTAL_SALE, "number": 50000}
          , {"actionName": "Keep your store open for 10h", "action": MISSION_ACTION_TOTAL_OPEN_STORE_TIME, "number": 10 * 60 * 60} // 10h.
          ], "rewards": 10000, "powerUp": [BOOSTER_BIG_GIFT]} // powerUp = medium box but we don't have.
        ,{"name": "S2", type: MISSION_TYPE_SECRET, "criteria":[{"actionName": "Stock 20 Exclusive Products Cummulative", "action": MISSION_ACTION_TOTAL_STOCK_EXCLUSIVE_PRODUCT, "number": 20}
          , {"actionName": "Reach 100,000 in Sales", "action": MISSION_ACTION_TOTAL_SALE, "number": 100000}
          , {"actionName": "Add 4 Brands", "action": MISSION_ACTION_TOTAL_BRAND, "number": 4}
          ], "rewards": 20000, "powerUp": [BOOSTER_BIG_GIFT, BOOSTER_STORE_KEY]}
        ,{"name": "S3", type: MISSION_TYPE_SECRET, "criteria":[{"actionName": "Purchase 5 Items from your Store", "action": MISSION_ACTION_TOTAL_PURCHASE_IN_YOUR_STORE, "number": 5}
          , {"actionName": "Connect  to 20 Users", "action": MISSION_ACTION_TOTAL_CONNECTIONS, "number": 20}
          , {"actionName": "Reach 200,000 in Sales", "action": MISSION_ACTION_TOTAL_SALE, "number": 200000}
          ], "rewards": 30000, "powerUp": [BOOSTER_GIANT_GIFT, BOOSTER_STORE_KEY]}
        ,{"name": "S4", type: MISSION_TYPE_SECRET, "criteria":[{"actionName": "Keep Store Opened for 18 hours", "action": MISSION_ACTION_TOTAL_OPEN_STORE_TIME, "number": 18 * 60 * 60} // 18h
          , {"actionName": "Complete 100 Sales without loosing a customer", "action": MISSION_ACTION_TOTAL_CONSECUTIVE_SALES, "number": 100}
          , {"actionName": "Connect with 50 Users", "action": MISSION_ACTION_TOTAL_CONNECTIONS, "number": 50}
          ], "rewards": 50000, "powerUp": [BOOSTER_GIANT_GIFT, BOOSTER_STORE_KEY]}
        ,{"name": "S5", type: MISSION_TYPE_SECRET, "criteria":[{"actionName": "Keep Store Opened for 24 hours", "action": MISSION_ACTION_TOTAL_OPEN_STORE_TIME, "number": 24 * 60 * 60} // 24h
          , {"actionName": "Complete 200 Sales without loosing a customer", "action": MISSION_ACTION_TOTAL_CONSECUTIVE_SALES, "number": 200}
          , {"actionName": "Connect with 100 Users", "action": MISSION_ACTION_TOTAL_CONNECTIONS, "number": 100}
          ], "rewards": 100000, "powerUp": [BOOSTER_GIANT_GIFT, BOOSTER_STORE_KEY, BOOSTER_HARD_HAT]}
      ];

      // Sales Shark Missions default list.
      var targetTotalSales = [{
          value: 10,
          name: "First 10 sales badge",
          rewards: 0,
          powerUp: [BOOSTER_SMALL_GIFT]
        }
        , {
          value: 25,
          name: "First 25 sales badge",
          rewards: 0,
          powerUp: [BOOSTER_LIGHTING_BOLT, BOOSTER_LIGHTING_BOLT]
        }
        , {
          value: 50,
          name: "First 50 sales badge",
          rewards: 0,
          powerUp: [BOOSTER_STORE_KEY]
        }
        , {
          value: 100,
          name: "First 100 sales badge",
          rewards: 2500,
          powerUp: []
        }
        , {
          value: 200,
          name: "first 150 sales badge",
          rewards: 3000,
          powerUp: []
        }
      ];
      targetTotalSales.forEach(function(saleshark) {
        defaultList.push({"name": saleshark.name, type: MISSION_TYPE_SALESHARK, "criteria":[{"actionName": saleshark.name, "action": MISSION_ACTION_TOTAL_SALE, "number": saleshark.value}]
          , "rewards": saleshark.rewards, "powerUp": saleshark.powerUp});
      });

      async.eachSeries(defaultList, function(item, nextItem) {
        Mission.findOrCreate({
          where: {
            name: item.name
          }
        }, item , function (err, log) {
          if (err) {
            return nextItem(err);
          }
          return nextItem();
        });
      }, function(error) {
        if (error) {
          next(error);
        }else{
          next(null,null);
        }
      });
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
  };

  Mission.checkListRemote = function(filter, ctx, next) {
    if (!ctx.user) {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var userId = ctx.user.id || false;
    var storeId = ctx.user.storeId || false;
    Mission.checkList({"userId": userId, "storeId": storeId, "filter": filter}, next);
  };

  Mission.checkList = function(data, next) {
    var userId = data.userId || false;
    var storeId = data.storeId || false;
    var filter = data.filter || {};
    if (!userId) {
      var err = new Error("Empty user ID");
      err.code = Mission.prefixError + "CL01";
      return next(err);
    }

    var storeFields = ["id", "ownerId", "name", "cells", "bestScore", "noOfProducts", "lastOpen", "totalOpenTime"];
    async.parallel([
      //1 missions
      function(async_cb) {
        Mission.find(filter, function(err, missions) {
          if (err) {
            return async_cb(err);
          }

          async_cb(null, missions);
        });
      },

      //2 foundMember
      function(async_cb) {
        Mission.app.models.Member.findById(userId,{
          "fields": ["id", "email", "type", "missions", "storeId", "friendsFB", "noOfConnections"]
        },function(err, foundMember) {
          if (err) {
            return async_cb(err);
          }

          async_cb(null, foundMember);
        });
      },
      //3 actionStats
      function(async_cb) {
        Mission.app.models.MemberActionStatistic.find({
          "fields": {
            "created": 0, "modified": 0, "id": 0, "memberId": 0
          },
          "where": { 
            "memberId": userId
          }
          //4 foundStore
        }, function(err, stats) {
          if (err) {
            return async_cb(err);
          }

          var i = 0;
          var max = stats.length;
          var actionStats = {};
          for (; i< max; i++) {
            var item = stats[i];
            actionStats[item.actionKey] = item.bestNumber;
          }
          async_cb(null, actionStats);
        });
      },
      function(async_cb) {
        if (!storeId) {
          return async_cb(null, null);
        }

        Mission.app.models.Store.findById(storeId, {"fields": storeFields}, function(err, foundStore) {
          if (err) {
            return async_cb(err);
          }
          async_cb(null, foundStore);
        });
      }
    ], function(err, results) {
      if (err) {
        return next(err);
      }

      var missions = results[0];
      var foundMember = results[1];
      var actionStats = results[2];
      var foundStore = results[3];

      if (!foundStore) {
        Mission.app.models.Store.findById(foundMember.storeId, {"fields": storeFields}, function(err, foundStore) {
          Mission.checkListMissions(missions, actionStats, foundMember, foundStore, next);
        });

        return ;
      }

      Mission.checkListMissions(missions, actionStats, foundMember, foundStore, next);
    });
  };

  Mission.arrayMissionStatusToAssoc = function(missions) {
    if (typeof missions != 'object') {
      return missions;
    }

    var len = missions.length;
    var rs = {};
    for (var i = 0; i < len; i++) {
      var item = missions[i];

      if (item.missionId) {
        rs[item.missionId] = item.status;
      }
    }

    return rs;
  };

  Mission.checkListMissions = function(missions, actionStats, foundMember, foundStore, next) {
    var completedMissions = foundMember.missions || [];
    var missionComplete = completedMissions;
    completedMissions = Mission.arrayMissionStatusToAssoc(completedMissions);

    var updateMissions = false;
    for (var i = 0; i < missions.length; i++) {
      var mission = missions[i];
      var tasks = mission.criteria;
      var maxTasks = tasks.length;
      var completedTask = 0;
      var missionId = mission.id.toString();

      for (var k = 0; k < maxTasks; k++) {
        var task = tasks[k];
        var actionKey = task.action;
        var currentComplete = 0;

        // Check task is complete in actionStatistic.
        if (actionStats[actionKey]) {
          currentComplete = actionStats[actionKey];
          if (task.number <= actionStats[actionKey]) {
            completedTask++;
          }
        }
        else {
          currentComplete = Mission.checkListActionTarget(actionKey, foundMember, foundStore);
          if (task.number <= currentComplete) {
            completedTask++;
          }
        }

        mission.criteria[k].targetComplete = currentComplete + "/" + task.number;
        mission.criteria[k].done = (currentComplete < task.number) ? false : true;
      }

      mission.missionComplete = completedTask + "/" + maxTasks;
      mission.complete = (completedTask < maxTasks) ? false : true;
      mission.status = MISSION_STATUS_ONGOING;
      if (mission.complete) {
        mission.status = MISSION_STATUS_COLLECTABLE;
        if (completedMissions[missionId]) {
          mission.status = completedMissions[missionId];
        }
        else {
          updateMissions = true;
          missionComplete.push({"missionId": missionId, "status": mission.status});
        }
      }

      missions[i] = mission;
    }

    if (updateMissions) {
      foundMember.updateAttributes({"missions": missionComplete}, function(err, inst) {
        if (err) {
          return next(err);
        }

        next(null, missions);
      });
      return ;
    }

    next(null, missions);
  };

  Mission.checkListActionTarget = function(actionKey, foundMember, foundStore) {
    var currentComplete = 0;
    switch (actionKey) {
      case MISSION_ACTION_TOTAL_OPEN_STORE_TIME:
        currentComplete = Mission.app.models.Store.getTheBestOpenTime(foundStore);
        break;

      case MISSION_ACTION_TOTAL_BRAND:
        currentComplete = Mission.app.models.Store.getNoOfBrands(foundStore);
        break;

      case MISSION_ACTION_ADD_A_FB_FRIEND_SUCCESS:
        currentComplete = foundMember.friendsFB ? foundMember.friendsFB.length : 0;
        break;

      case MISSION_ACTION_TOTAL_CONNECTIONS:
        currentComplete = foundMember.noOfConnections || 0;
        break;

      case MISSION_ACTION_UPDATE_STORE_NAME:
        var flag = Mission.app.models.Store.isNameUpdated(foundStore);
        currentComplete = flag ? 1 : 0;
        break;

      case MISSION_ACTION_OPEN_STORE:
        currentComplete = foundStore.lastOpen ? 1 : 0;
        break;

      case MISSION_ACTION_BUILD_A_SECOND_FOOR:
        currentComplete = (foundStore.cells.length > 1) ? 1 : 0;
        break;
    }

    return currentComplete;
  };
  Mission.getActionList = function(next){
    var actionList = [MISSION_ACTION_TOTAL_SALE
      , MISSION_ACTION_TOTAL_CONSECUTIVE_SALES
      , MISSION_ACTION_TOTAL_MAKE_PRODUCT
      , MISSION_ACTION_TOTAL_STOCK_PRODUCT
      , MISSION_ACTION_TOTAL_STOCK_EXCLUSIVE_PRODUCT
      , MISSION_ACTION_TOTAL_INVITATION_FRIEND
      , MISSION_ACTION_TOTAL_OPEN_STORE_TIME
      , MISSION_ACTION_TOTAL_OPEN_STORE_DAY
      , MISSION_ACTION_TOTAL_BRAND
      , MISSION_ACTION_ADD_A_FB_FRIEND_SUCCESS
      , MISSION_ACTION_TOTAL_CONNECTIONS
      , MISSION_ACTION_TOTAL_PURCHASE_IN_YOUR_STORE
      , MISSION_ACTION_UPDATE_STORE_NAME
      , MISSION_ACTION_PICK_A_PRODUCT
      , MISSION_ACTION_OPEN_STORE
      , MISSION_ACTION_BUILD_A_SECOND_FOOR
      , MISSION_ACTION_FIND_A_EXCLUSIVE_ON_MARKETPLACE
    ];

    next(null, actionList);
  }

  // check if created is valid
  function validateMissionType(cb_err) {
    if (typeof this.type !== 'undefined') {
      if (MISSION_TYPES.indexOf(this.type) === -1) {
        cb_err();
      }
    }
  }
  Mission.validate('type', validateMissionType, {message: 'Invalid type'});

  Mission.remoteMethod(
    'createDefaultList',
      {
        accessType: 'WRITE',
        accepts: { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}},
        description: 'Create a new instance list',
        http: {verb: 'post', path: '/createDefaultList'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
  Mission.remoteMethod(
    'checkListRemote' ,
    {
      accessType: 'READ',
      accepts:
      [
        {arg: 'filter', type: 'object', http: {source: 'query'}, description: 'Filter defining fields, where, order, offset, and limit'}
        , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Get list mission included checking list.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'get', path: '/checkList'}
    }
  )
  Mission.remoteMethod(
    'getActionList' ,
    {
      description: 'Get Criteria form Mission.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'get', path: '/getActionList'}
    }
  )
};
