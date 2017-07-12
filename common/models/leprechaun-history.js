var validator = require('validator')
  , async = require('async')
  ;
module.exports = function(LeprechaunHistory) {
  LeprechaunHistory.prefixError = "LEP_";

  // Only allow admin access all remote method in this model.
  LeprechaunHistory.beforeRemote("**", function(ctx, ints, next) {
    LeprechaunHistory.app.models.Member.getCurrentUser(ctx, function(err, userInfo) {
      if (err) {
        return next(err);
      }

      if (!userInfo || userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1) {
        var error = new Error("Authorization Required. Only allow Admin role.");
        error.code = 'AUTHORIZATION_REQUIRED';
        error.statusCode = 401;
        return next(error);
      }

      next();
    });
  });
  LeprechaunHistory.getMidnightDate = function(date) {
    if (typeof date === 'undefined') {
      date = new Date();
    }
    date.setHours(0,0,0,0);

    return date;
  };

  LeprechaunHistory.getLogByDate = function(date, next) {
    var returnArray = false;
    if (typeof date === 'function') {
      next = date;
      date = new Date();
    }

    if (Array.isArray(date)) {
      returnArray = true;
    }
    else {
      LeprechaunHistory.getMidnightDate(date);
    }

    LeprechaunHistory.find({
      "where": {
        "created": date
      }
    }, function(err, log) {
      if (err) {
        return next(err);
      }
      else if (!log || log.length === 0) {
        if (returnArray) {
          var error = new Error("Empty logs");
          error.code = LeprechaunHistory.prefixError + "GL01";
          return next(error);
        }

        return LeprechaunHistory.getDefaultLog(next);
      }

      if (returnArray) {
        return next(null, log);
      }
      return next(null, log[0]);
    });
  };
  LeprechaunHistory.writeLog = function(rewardMoney, spawnedLevel, log, next) {
    var LepCollection = LeprechaunHistory.getDataSource().connector.collection(LeprechaunHistory.modelName);
    var updateValues = {
      "$set": {
        "created": log.created,
        "spawnPMonth": log.spawnPMonth,
        "moneyPMonth": log.moneyPMonth,
        "moneyPDay": log.moneyPDay,
        "modified": new Date()
      },
      "$inc": {
        "remainMoneyPMonth": -rewardMoney,
        "remainMoneyPDay": -rewardMoney
      }
    };
    spawnedLevel.forEach(function(level) {
      if (updateValues["$inc"]["spawnedTotal.lv" + level]) {
        updateValues["$inc"]["spawnedTotal.lv" + level]++;
      }
      else {
        updateValues["$inc"]["spawnedTotal.lv" + level] = 1;
      }
    });

    LepCollection.update( {"created": log.created}, updateValues,{"upsert": true}
      , function(err, result) {
      if (err) {
        return next(err);
      }

      return next(null, result);
    });
  };
  LeprechaunHistory.updateMultipleRealPaid = function(logs, isRollBack, next) {
    if (!logs || !logs.length) {
      return next();
    }

    var count = 0;
    var incVal = 0;
    var maxLen = logs.length;
    var results = [];
    var LepCollection = LeprechaunHistory.getDataSource().connector.collection(LeprechaunHistory.modelName);
    logs.forEach(function(log) {
      incVal = log.rewardMoney;
      if (isRollBack) {
        incVal = -log.rewardMoney;
      }

      LepCollection.findAndModify({
        "created": new Date(log.created)
      },
      [['_id','asc']], {
        "$inc": {
          "realPaid": incVal
        }
      }, {
        new: true
      }, function(err, result) {
        count++;

        if (err) {
          return next(err, results);
        }
        else {
          if (result.value) {
            result.value.id = result.value._id;
            result.value._id = undefined;
          }
          results.push(result.value);
        }

        if (count >= maxLen) {
          return next(null, results);
        }
      });
    });
  };

  // Get directly CUSTOMER_LEPRECHAUN_VARIABLES in db due to we scale up to multiple server,
  // so the value in Setting.configs maybe is updated in once but the other once is not updated.
  LeprechaunHistory.getLepreVars = function(next) {
    var Variable = LeprechaunHistory.app.models.Variable;
    Variable.find({
      "where": {"name": "CUSTOMER_LEPRECHAUN_VARIABLES"}
    }, function(err, foundConfigs) {
      if (err) {
        return next(err);
      }
      else if (foundConfigs.length === 0) {
        // Initial values.
        return LeprechaunHistory.initVarsInMonth(next);
      }

      foundConfigs[0].value.modified = foundConfigs[0].modified;
      LeprechaunHistory.checkAndResetVars(foundConfigs[0].value, next);
    });
  };
  LeprechaunHistory.getDefaultLog = function(next) {
    LeprechaunHistory.getLepreVars(function(err, leprechaunVars) {
      if (err) {
        return next(err);
      }

      var configs = LeprechaunHistory.app.models.Setting.configs;
      var logDate = LeprechaunHistory.getMidnightDate();
      var defaultLog = {
        "spawnPMonth": configs['CUSTOMER_LEPRECHAUN_LSCT'],
        "moneyPMonth": leprechaunVars['moneyPMonthLMP'],
        "moneyPDay": leprechaunVars['moneyPDayLDP'],
        "remainMoneyPMonth": leprechaunVars['remainMoneyPMonthLSMP'],
        "remainMoneyPDay": leprechaunVars['remainMoneyPDayLLDP'],
        "realPaid": 0,
        "spawnedTotal": {
          "lv1": 0,
          "lv2": 0,
          "lv3": 0,
          "lv4": 0,
          "lv5": 0
        },
        "created": logDate
      };

      // Create first log.
      LeprechaunHistory.findOrCreate({
        "where": {"created": logDate}
      }, defaultLog, function(err, log) {
        if (err) {
          return next(err);
        }

        next(null, log);
      });
    });
  };
  LeprechaunHistory.calcMoneyRewards = function(lepreLevel, lepreVars) {
    var configs = LeprechaunHistory.app.models.Setting.configs;
    var lsct = configs['CUSTOMER_LEPRECHAUN_LSCT'];
    var rates = configs['CUSTOMER_LEPRECHAUN_LEVEL_CHANCE'];
    var lmp = lepreVars['moneyPMonthLMP'];

    var rewards = configs['CUSTOMER_LEPRECHAUN_REWARDS']['lv' + lepreLevel];
    var lusc = rates['lv' + lepreLevel];
    var money = Math.ceil(lmp * rewards['moneyMul']) / (lsct * lusc);

    if (money > lepreVars.remainMoneyPDayLLDP) {
      return lepreVars.remainMoneyPDayLLDP;
    }
    return money;
  };

  LeprechaunHistory.getLastDateInCurrentMonth = function() {
    var date = new Date();
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return lastDay.getDate();
  };
  LeprechaunHistory.shuffle = function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  };

  LeprechaunHistory.concurrentUpdateLepreVars = function(next) {
    var Variable = LeprechaunHistory.app.models.Variable;
    var VariableCollection = Variable.getDataSource().connector.collection(Variable.modelName);

    var configs = LeprechaunHistory.app.models.Setting.configs;
    var totalSpawn = configs["CUSTOMER_LEPRECHAUN_LSCT"];
    var now = new Date();

    var whereCondition = {
      "name": "CUSTOMER_LEPRECHAUN_VARIABLES",
      "locked": 0,
      "value.remainMoneyPDayLLDP": {"$gt": 0},
      "value.leveListLUSC": {"$not": {"$size": 0} }
    };
    var sortOrder   = [['_id','asc']];
    var updateValue = {
      "$pop": {
        "value.leveListLUSC": -1 // Remove first value.
      },
      "$set": {
        "modified": now,
        "locked": 1
      }
    };
    var options     = {}; // get document before update to get remove element value.

    VariableCollection.findAndModify(
      whereCondition,
      sortOrder,
      updateValue,
      options,
      function(err, result) {
      if (err) {
        next(err);
      }
      else if (!result.value) {
        var error = new Error("Leprechaun quota is over in today or is locked.");
        error.code = LeprechaunHistory.prefixError + "UL01";
        return next(error);
      }
      else {
        var lepreVars = result.value.value;
        var lepreLevel = lepreVars.leveListLUSC.shift() || false;
        var rewardMoney = 0;
        if (lepreLevel) {
          rewardMoney = LeprechaunHistory.calcMoneyRewards(lepreLevel, lepreVars);
        }

        if (rewardMoney === 0) {
          var error = new Error("Leprechaun quota is over in today.");
          error.code = LeprechaunHistory.prefixError + "UL02";
          return next(error);
        }
        else if (result.value.value.remainMoneyPDayLLDP < rewardMoney) {
          rewardMoney = result.value.value.remainMoneyPDayLLDP;
        }

        delete whereCondition["value.leveListLUSC"];
        delete whereCondition["locked"];
        updateValue = {
          "$inc": {
            "value.remainMoneyPMonthLSMP": -rewardMoney,
            "value.remainMoneyPDayLLDP": -rewardMoney
          },
          "$set": {
            "locked": 0
          }
        }
        VariableCollection.findAndModify(
          whereCondition,
          sortOrder,
          updateValue,
          {"new": true},
          function(err, result) {
            if (err) {
              return next(err);
            }
            else if (!result.value) {
              var error = new Error("Leprechaun quota is over in today.");
              error.code = LeprechaunHistory.prefixError + "UL03";
              return next(error);
            }

            return next(null, {
              "lepreLevel": lepreLevel,
              "rewardMoney": rewardMoney
            });
          }
        );
      }
    });
  };
  LeprechaunHistory.initSpawedLevelLUSC = function(totalSpawn, leprechaunLevelChance) {
    var maxLevel = 5;
    var totalSpawnByLevel = 0;
    var spawnLevel = {};
    for (var i = 1; i <= maxLevel; i++) {
      spawnLevel["lv" + i] = Math.round(totalSpawn * leprechaunLevelChance["lv" + i]);
    }

    return spawnLevel;
  };
  LeprechaunHistory.initLeveListLUSC = function(totalSpawn, leprechaunLevelChance) {
    var maxLevel = 5;
    var totalSpawnByLevel = 0;
    var levelList = [];
    for (var i = 1; i <= maxLevel; i++) {
      totalSpawnByLevel = Math.round(totalSpawn * leprechaunLevelChance["lv" + i]);
      for (var j = 0; j < totalSpawnByLevel; j++) {
        levelList.push(i);
      }
    }

    // If not enough spawn due to Math.round, we will continue to spawn level 1 into list.
    var remainSpawn = totalSpawn - levelList.length;
    if (remainSpawn > 0) {
      for (var j = 0; j < remainSpawn; j++) {
        levelList.push(1);
      }
    }
    else if (remainSpawn < 0) {
      for (var j = remainSpawn; j < 0 ; j++) {
        levelList.pop();
      }
    }

    // Shuffle level in levelList.
    return LeprechaunHistory.shuffle(levelList);
  };
  LeprechaunHistory.initVarsInMonth = function(next) {
    var configs = LeprechaunHistory.app.models.Setting.configs;
    var now = new Date();

    var totalSpawn = configs["CUSTOMER_LEPRECHAUN_LSCT"];
    var lepreLCMIP = configs["CUSTOMER_LEPRECHAUN_LCMIP"];
    var leprechaunLevelChance = configs["CUSTOMER_LEPRECHAUN_LEVEL_CHANCE"];
    var lastDay = LeprechaunHistory.getLastDateInCurrentMonth();
    var leveListLUSC = LeprechaunHistory.initLeveListLUSC(totalSpawn, leprechaunLevelChance);
    // var leveListLUSC = LeprechaunHistory.initSpawedLevelLUSC(totalSpawn, leprechaunLevelChance);
    var leprechaunVars = {
      "moneyPMonthLMP": lepreLCMIP,
      "moneyPDayLDP": (lepreLCMIP / lastDay),
      "remainMoneyPMonthLSMP": lepreLCMIP,
      "remainMoneyPDayLLDP": (lepreLCMIP / lastDay),
      "leveListLUSC": leveListLUSC
      // "remainSpawedLevel": leveListLUSC
    };

    LeprechaunHistory.app.models.Variable.findOrCreate({
        "where": {
          "name": "CUSTOMER_LEPRECHAUN_VARIABLES"
        }
      }
      , {
        "name": "CUSTOMER_LEPRECHAUN_VARIABLES",
        "description": "Leprechaun customer variables: LMP, LDP, LSMP, LLDP, LUSC.",
        "value": leprechaunVars,
        "modified": now,
        "created": now
    }, next);
  };
  LeprechaunHistory.checkAndResetVars = function(currentVars, next) {
    var configs = LeprechaunHistory.app.models.Setting.configs;
    var now = new Date();

    var resetVars = false;
    var inDate = true;
    if (now.getDate() !== currentVars.modified.getDate()
      || now.getMonth() !== currentVars.modified.getMonth()
      || now.getFullYear() !== currentVars.modified.getFullYear()) {
      resetVars = true;

      if (now.getMonth() !== currentVars.modified.getMonth()
        || now.getFullYear() !== currentVars.modified.getFullYear()) {
        inDate = false;
      }
    }

    if (!resetVars) {
      return next(null, currentVars);
    }

    // Default reset by beigining of date.
    var updateValue = {
      "$set": {
        "value.remainMoneyPDayLLDP": currentVars["moneyPDayLDP"],
        "modified": now
      }
    };
    if (!inDate) {
      var totalSpawn = configs["CUSTOMER_LEPRECHAUN_LSCT"];
      var lepreLCMIP = configs["CUSTOMER_LEPRECHAUN_LCMIP"] + currentVars["remainMoneyPMonthLSMP"];
      var leprechaunLevelChance = configs["CUSTOMER_LEPRECHAUN_LEVEL_CHANCE"];
      var lastDay = LeprechaunHistory.getLastDateInCurrentMonth();
      var leveListLUSC = LeprechaunHistory.initLeveListLUSC(totalSpawn, leprechaunLevelChance);

      delete updateValue["$set"]["value.remainMoneyPDayLLDP"];
      updateValue["$set"]["value"] = {
        "moneyPMonthLMP": lepreLCMIP,
        "moneyPDayLDP": (lepreLCMIP / lastDay),
        "remainMoneyPMonthLSMP": lepreLCMIP,
        "remainMoneyPDayLLDP": (lepreLCMIP / lastDay),
        "leveListLUSC": leveListLUSC
      };
    }

    var Variable = LeprechaunHistory.app.models.Variable;
    var VariableCollection = Variable.getDataSource().connector.collection(Variable.modelName);

    var whereCondition = {
      "name": "CUSTOMER_LEPRECHAUN_VARIABLES"
    };
    var sortOrder   = [['_id','asc']];
    var options     = {"new": true};

    VariableCollection.findAndModify(
      whereCondition,
      sortOrder,
      updateValue,
      options,
      function(err, result) {
      if (err) {
        return next(err);
      }
      else if (!result.value) {
        var error = new Error("Leprechaun vars is not exist.");
        error.code = LeprechaunHistory.prefixError + "RV01";
        return next(error);
      }

      result.value.value.modified = result.value.modified;
      next(null, result.value.value);
    });
  };

  LeprechaunHistory.setup = function() {
    LeprechaunHistory.disableRemoteMethod('create',true);
    LeprechaunHistory.disableRemoteMethod('upsert',true);
    LeprechaunHistory.disableRemoteMethod('createChangeStream',true);
    LeprechaunHistory.disableRemoteMethod('exists',true);
    LeprechaunHistory.disableRemoteMethod('findOne',true);
    LeprechaunHistory.disableRemoteMethod('updateAll',true);
    LeprechaunHistory.disableRemoteMethod('upsertWithWhere',true);
    LeprechaunHistory.disableRemoteMethod('replaceOrCreate',true);
    LeprechaunHistory.disableRemoteMethod('replaceById',true);
    LeprechaunHistory.disableRemoteMethod('deleteById',true);
    LeprechaunHistory.disableRemoteMethod('updateAttributes',false);

    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        if (!validator.isDate(this.created)) {
          cb();
        }
      }
    }
    LeprechaunHistory.validate('created', validateCreated, {message: 'Invalid created'});
  };
  LeprechaunHistory.setup();
};
