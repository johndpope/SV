var validator = require('validator')
  , loopback = require('loopback')
  , async = require('async')
  ;

CONFIG_VALUE_TYPE = {
  "float"       : "isFloat",
  "integer"     : "isInt",
  "string"      : "string",
  "json_object" : "isJSON",
  "json_array"  : "isJSON"
};

MEMBER_TYPES = { USER: 1, ADMIN: 2, MERCHANT : 3};

module.exports = function(Setting) {
  // Workaround for https://github.com/strongloop/loopback/issues/292
  Setting.definition.rawProperties.position.default =
    Setting.definition.properties.position.default = function() {
    return 0;
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Setting.definition.rawProperties.created.default =
    Setting.definition.properties.created.default = function() {
    return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Setting.definition.rawProperties.modified.default =
    Setting.definition.properties.modified.default = function() {
    return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Setting.definition.rawProperties.configValueType.default =
    Setting.definition.properties.configValueType.default = function() {
    // string as default
    return "string";
  };

  Setting.observe('before save', function(ctx, next) {
    var configs = {};

    // Update current Setting.
    if (ctx.currentInstance) {
      ctx.currentInstance.modified = new Date();

      configs = {
        name: ctx.data.configName || ctx.currentInstance.configName,
        type: ctx.data.configValueType || ctx.currentInstance.configValueType,
        value: ctx.data.configValue
      };
    }
    else {
      configs = {
        name: ctx.instance.configName,
        type: ctx.instance.configValueType,
        value: ctx.instance.configValue
      };
    }

    // Prevent set GET_LIST_DATA_DEFAULT_LIMIT = 0.
    if (configs.name === 'GET_LIST_DATA_DEFAULT_LIMIT' && configs.value == 0) {
      var error = new Error('Invalid parameter. GET_LIST_DATA_DEFAULT_LIMIT should have value > 0');
      error.code = 'INVALID_PARAMETER';
      error.field = 'configValue';
      return next(error);
    }

    Setting.configs[configs.name] = Setting.encodeValue(configs.type, configs.value);
    next();
  });

  Setting.checkAndReloadSettingsConfigs = function(next) {
    var now = +new Date(); // in ms.
    var cachedModified = Setting.configs.modified || 0;
    var settingList = Setting.getDefaultConfigs();
    var currentConfigs = Object.keys(Setting.configs);
    var forceReloadConfig = (settingList.length > (currentConfigs.length -1));

    var expired = (Setting.configs["SETTING_RELOAD_IN"] || 10800) * 1000;
    if (!forceReloadConfig && (now - cachedModified < expired)) {
      return next(null, Setting.configs);
    }

    // Re-load Settings config.
    Setting.find({"fields": ['configName', 'configValueType', 'configValue']}, function(err, settings){
      if (err) {
        return next(err);
      }

      settings.forEach(function(item) {
        Setting.configs[item.configName] = Setting.encodeValue(item.configValueType, item.configValue);
      });

      // Recheck if config is not inserted into db, we need to get setting config in settingDefault.
      for (var i = 0; i < settingList.length; i++) {
        var settingConfig = settingList[i];
        if (typeof Setting.configs[settingConfig.key] === 'undefined') {
          Setting.configs[settingConfig.key] = Setting.encodeValue(settingConfig.type, settingConfig.value);
        }
      }

      // Update modified date.
      Setting.configs.modified = +new Date();
      next(null, Setting.configs);
    });
  };

  Setting.getCategories = function(next) {
    var SettingCollection = Setting.getDataSource().connector.collection(Setting.modelName);
    SettingCollection.distinct('category', function(err, categories) {
      if(err) {
      next(err);
      } else {
      categories.sort();
      next(null, categories);
      }
    });
  };

  Setting.setup = function() {
  // Disable unused remote methods
  Setting.disableRemoteMethod('create', true);
  Setting.disableRemoteMethod('upsert', true);
  Setting.disableRemoteMethod('exists', true);
  Setting.disableRemoteMethod('findById', true);
  Setting.disableRemoteMethod('findOne', true);
  Setting.disableRemoteMethod('updateAll', true);
  Setting.disableRemoteMethod('deleteById', true);
  Setting.disableRemoteMethod('count', true);
  Setting.disableRemoteMethod('createChangeStream',true);
  Setting.disableRemoteMethod('upsertWithWhere',true);
  Setting.disableRemoteMethod('replaceOrCreate',true);
  Setting.disableRemoteMethod('replaceById',true);
  Setting.disableRemoteMethod('deleteById',true);
  // -----------------------------

  // name
  Setting.validatesLengthOf('name', { min: 3, max: 100, message: 'is invalid' });

  // configName
  Setting.validatesUniquenessOf('configName', {message: 'is not unique'});

  // check if description is valid
  function validateDescription(cb_err) {
    if(typeof this.description !== 'undefined') {
    if(typeof this.description !== 'string') {
      cb_err();
    } else {
      if(this.description.length > 255) {
      cb_err();
      }
    }
    }
  }
  Setting.validate('description', validateDescription, { message: 'Invalid description' });

  // check if configName is valid
  function validateConfigName(cb_err) {
    if(typeof this.configName !== 'undefined') {
    if(typeof this.configName !== 'string') {
      cb_err();
    } else {
      if(this.configName.length > 100) {
      cb_err();
      } else {
      var regexp = new RegExp('^[A-Z-_]+([A-Z-_0-9]+)?$','g');
      if(!regexp.test(this.configName)) {
        cb_err();
      }
      }
    }
    }
  }
  Setting.validate('configName', validateConfigName, { message: 'Invalid configName' });

  // check if configValue is valid
  function validateConfigValue(cb_err) {
    if(this.configValueType != "string"){
    // check if configValueType is valid and configValue is valid
    if (!validator.isIn(this.configValueType, CONFIG_VALUE_TYPE) ||
      !validator[CONFIG_VALUE_TYPE[this.configValueType]](this.configValue)){
      cb_err();
    }
    }
  }
  Setting.validate('configValue', validateConfigValue, { message: 'Invalid configValue' });

  // check if configValue is valid
  function validateConfigValueType(cb_err) {
    var arrValidConfigType = Object.keys(CONFIG_VALUE_TYPE);
    if (!validator.isIn(this.configValueType, arrValidConfigType)) {
    cb_err();
    }
  }
  Setting.validate('configValueType', validateConfigValueType, { message: 'Invalid configValueType' });

  // check if created is valid
  function validateCreated(cb_err) {
    if (typeof this.created !== 'undefined') {
    // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
    if (!validator.isDate(this.created)) {
      cb_err();
    }
    }
  }
  Setting.validate('created', validateCreated, {message: 'Invalid created'});

  // check if modified is valid
  function validateModified(cb_err) {
    if (typeof this.modified !== 'undefined') {
    // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
    if (!validator.isDate(this.modified)) {
      cb_err();
    }
    }
  }
  Setting.validate('modified', validateModified, {message: 'Invalid modified'});

  Setting.remoteMethod(
    'getCategories', {
    accessType: 'READ',
    returns: {arg: 'data', type: 'any', root: true},
    http: {verb: 'get', path: '/getCategories'}
    }
  );

  Setting.getDefaultConfigs = function() {
    var boosterInitValues = {
      "default": 10
    };
    boosterInitValues[BOOSTER_STORE_KEY] = 11;
    boosterInitValues[BOOSTER_HARD_HAT] = 2;
    boosterInitValues = JSON.stringify(boosterInitValues, null);

    var eventDuration = {};
    eventDuration[MEMBER_EVENT_VIP] = 30;
    eventDuration[MEMBER_EVENT_PARADE] = 30;
    eventDuration[MEMBER_EVENT_GRANDOPENING] = 30;
    eventDuration = JSON.stringify(eventDuration, null);

    var eventReachLevel = {};
    eventReachLevel[MEMBER_EVENT_VIP] = 50;
    eventReachLevel[MEMBER_EVENT_PARADE] = 50;
    eventReachLevel[MEMBER_EVENT_GRANDOPENING] = 50;
    eventReachLevel = JSON.stringify(eventReachLevel, null);

    var customerQuantity = {};
    customerQuantity[CUSTOMER_TYPE_SPECIFIC] = 1;
    customerQuantity[CUSTOMER_TYPE_IMPULSE] = 1;
    customerQuantity[CUSTOMER_TYPE_WINDOW] = 1;
    customerQuantity[CUSTOMER_TYPE_BIGSPENDER] = 5;
    customerQuantity[CUSTOMER_TYPE_LEPRECHAUN] = 1;
    customerQuantity = JSON.stringify(customerQuantity, null);

    var customerPrice = {};
    customerPrice[CUSTOMER_TYPE_SPECIFIC] = 10;
    customerPrice[CUSTOMER_TYPE_IMPULSE] = 30;
    customerPrice[CUSTOMER_TYPE_WINDOW] = 20;
    customerPrice[CUSTOMER_TYPE_BIGSPENDER] = 100;
    customerPrice[CUSTOMER_TYPE_LEPRECHAUN] = 100;
    customerPrice = JSON.stringify(customerPrice, null);

    var elevatorConfig = [
    {
        level: 1,
        capacity: 1,
        speed: 20,
        cost:0
    },
    {
        level: 2,
        capacity: 2,
        speed: 18,
        cost: 100000
    },
    {
        level: 3,
        capacity: 3,
        speed: 16,
        cost: 400000
    },
    {
        level: 4,
        capacity: 4,
        speed: 14,
        cost: 800000
    },
    {
        level: 5,
        capacity: 5,
        speed: 12,
        cost: 2000000
    },
    {
        level: 6,
        capacity: 6,
        speed: 10,
        cost: 5000000
    },
    {
        level: 7,
        capacity: 7,
        speed: 8,
        cost: 10000000
    },
    {  
        level: 8,
        capacity: 8,
        speed: 6,
        cost: 20000000
    },
    {
        level: 9,
        capacity: 9,
        speed: 4,
        cost: 30000000
    },
    {
        level: 10,
        capacity: 10,
        speed: 2,
        cost: 50000000
    }
    ];
    elevatorConfig = JSON.stringify(elevatorConfig, null);

    var leprechaunRewards = { "lv1": {"gift": [BOOSTER_SMALL_GIFT], "budget": 1000, "moneyMul": 0.2}
      , "lv2": {"gift": [BOOSTER_BIG_GIFT], "budget": 2000, "moneyMul": 0.2}
      , "lv3": {"gift": [BOOSTER_GIANT_GIFT], "budget": 3000, "moneyMul": 0.2}
      , "lv4": {"gift": [BOOSTER_SMALL_GIFT, BOOSTER_GIANT_GIFT], "budget": 4000, "moneyMul": 0.2}
      , "lv5": {"gift": [BOOSTER_BIG_GIFT, BOOSTER_GIANT_GIFT], "budget": 5000, "moneyMul": 0.2}
    };
    leprechaunRewards = JSON.stringify(leprechaunRewards, null);

    var leprechaunLevelChanceObj = { "lv1": 0.8, "lv2": 0.1, "lv3": 0.05, "lv4": 0.03, "lv5": 0.02};
    var leprechaunLevelChance = JSON.stringify(leprechaunLevelChanceObj, null);

    var lepreLSCT = 2000;
    var lepreLCMIP = 100;

    var priceUpgradeStoreByCell = Setting.app.models.Store.calcListPriceToUpgradeACell();
    priceUpgradeStoreByCell = JSON.stringify(priceUpgradeStoreByCell, null);

    var totalStatisfiedPStars = Setting.app.models.Store.calcListTotalStatisfiedToUpdateStars();
    totalStatisfiedPStars = JSON.stringify(totalStatisfiedPStars, null);

    var settingList = [
      {'key' : 'DEFAULT_MEMBER_BUDGET','value' : 20000,'type' : 'integer','cate' : 'Default','name' : 'Default Member Budget','desc':'This defines default budget for new Member registration.'},
      {'key' : 'LIMIT_PRODUCT_IN_BRAND','value' : 20,'type' : 'integer','cate' : 'Default','name' : 'Limit products in brand','desc':'Default limit products in brand.'},
      {'key' : 'SETTING_RELOAD_IN','value' : 10800,'type' : 'integer','cate' : 'Default','name' : 'The period to reload setting configs','desc':'The period to reload setting configs in second.'},
      {'key' : 'LOGIN_SECRET_KEY','value' : '6RkitQhN?62cfMuqQMk#','type' : 'string','cate' : 'Default','name' : 'Login secret key by device ID','desc':'Login secret key by device ID.'},
      {'key' : 'THUMBNAIL_RATIOS','value' : '{"2x2": "400x400","1x2": "200x400","2x1": "400x200","1x1": "200x200"}', 'type' : 'json_object','cate' : 'Default', 'name' : 'Thumbnail Ratios', 'desc':'This defines ratios for thumbnail generation.'},
      {'key' : 'THUMBNAIL_RATIOS_PRODUCT','value' : '{"2x2": "400x400","1x2": "200x400","2x1": "400x200","1x1": "200x200","2":"220","3":"300","4":"400"}', 'type' : 'json_object','cate' : 'Default', 'name' : 'Thumbnail Ratios Product', 'desc':'This defines ratios for Product thumbnail generation.'},
      {'key' : 'URL_TRANSFORMER_JS','value' : "https://api-dev.stocket.com/transformer/stockIt.js", 'type' : 'string','cate' : 'Default', 'name' : 'URL Stocket JS', 'desc':'URL Stocket JS.'},
      {'key' : 'MEDIA_LINK','value' : "https://devdiroxstorage.blob.core.windows.net/_container_/_filename_", 'type' : 'string','cate' : 'Default', 'name' : 'Media public link - Storage URL', 'desc':'Media public link from Azure Storage.'},
      {'key' : 'MEDIA_LINK_API','value' : "https://api-dev.stocket.com/api/Uploads/_container_/download/_filename_", 'type' : 'string','cate' : 'Default', 'name' : 'Media public link - API URL', 'desc':'API URL to create image base on ratio if not exist in storage.'},
      {'key' : 'TWITTER_CONSUMER_KEY','value' : "B8tcd5BdFU4EvwhO0zkB6i8eA", 'type' : 'string','cate' : 'Authenticate', 'name' : 'Twitter Consumer Key', 'desc':'This defines Twitter Consumer Key used for interacting with Twitter.'},
      {'key' : 'TWITTER_CONSUMER_SECRET','value' : "5l5mknNzDCGb2SCo1HzEYFExZaULU3AInEXf9L2cl9gyIxvFTi", 'type' : 'string','cate' : 'Authenticate', 'name' : 'Twitter Consumer Secret', 'desc':'This defines Twitter Consumer Secret used for interacting with Twitter.'},
      {'key' : 'STRIPE_PRIVATE_KEY','value' : "sk_test_nWXKCMgN9HFILwtbN41hbzfj", 'type' : 'string','cate' : 'Authenticate', 'name' : 'Stripe Private Key', 'desc':'Stripe Private Key.'},
      {'key' : 'STRIPE_PUBLIC_KEY','value' : "pk_test_XQsvd6fEur5wLSPENYhnaGbl", 'type' : 'string','cate' : 'Authenticate', 'name' : 'Stripe Public Key', 'desc':'Stripe Public Key.'},
      {'key' : 'KEY_GENERATE_DURATION','value' : 14400,'type' : 'integer','cate' : 'Stores','name' : 'The spent time to complete generating key','desc':'4h (14400s) to complete a generated key'},
      {'key' : 'KEY_MAX_GENERATED_KEYS','value' : 1,'type' : 'integer','cate' : 'Stores','name' : 'Maximun key','desc':'Maximum 1 generated key at a time'},
      {'key' : 'STORE_OPEN_IN_DURATION','value' : 600,'type' : 'integer','cate' : 'Stores','name' : 'Store open time','desc':'1 key can open a store in 600s (10 minutes)'},
      {'key' : 'STORE_INIT_NO_OF_CROWD','value' : 100,'type' : 'integer','cate' : 'Stores','name' : 'Init number of key customers (crowd).','desc':'Init number of key customers (crowd).'},
      {'key' : 'STORE_INIT_NO_OF_KEYS','value' : 11,'type' : 'integer','cate' : 'Stores','name' : 'Init number of key while create a store.','desc':'Init number of key while create a store.'},
      {'key' : 'STORE_MAX_LEVEL','value' : 5,'type' : 'integer','cate' : 'Stores','name' : 'Maximum level of a store is 5.','desc':'Maximum level of a store is 5.'},
      {'key' : 'STORE_MAX_STAGE_IN_LEVEL_1','value' : 2,'type' : 'integer','cate' : 'Stores','name' : 'Level 1 has maximum 2 stages (1 & 2).','desc':'Level 1 has maximum 2 stages (1 & 2).'},
      {'key' : 'STORE_MAX_STAGE_IN_LEVEL_N','value' : 3,'type' : 'integer','cate' : 'Stores','name' : 'Default maximum stage in a level is 3 (1, 2 & 3).','desc':'Default maximum stage in a level is 3 (1, 2 & 3).'},
      {'key' : 'STORE_EVENT_REACH_LEVEL','value' : eventReachLevel,'type' : 'json_object','cate' : 'Stores','name' : 'Event reach level to start event.','desc':'Event reach level base on amount of satisfied customer.'},
      {'key' : 'STAFF_MAX_HEARTS','value' : 3,'type' : 'integer','cate' : 'Stores','name' : 'Maximum hearts of a staff.','desc':'Maximum hearts of a staff.'},
      {'key' : 'CELL_ASSIGNMENT_MAX','value' : 50,'type' : 'integer','cate' : 'Stores','name' : 'Maximum assignment of a cell.','desc':'Maximum assignment of a cell.'},
      {'key' : 'STORE_UPGRADE_PRICE_LIST','value' : priceUpgradeStoreByCell,'type' : 'json_object','cate' : 'Stores','name' : 'Price list to upgrade store','desc':'Price list to upgrade store by cell number.'},
      {'key' : 'STORE_UPGRADE_STATISFIED_LIST','value' : totalStatisfiedPStars,'type' : 'json_object','cate' : 'Stores','name' : 'Total statisfied customer list','desc':'Total statisfied customer list to update total stars of store.'},
      {'key' : 'BOOSTER_LIST_CATEGORY','value' : '{"money": "Money", "staff": "Staff", "store": "Store", "construction": "Construction", "gift": "Gift"}', 'type' : 'json_object','cate' : 'Booster','name' : 'Booster categories.','desc':'Booster categories.'},
      {'key' : 'BOOSTER_INITIAL_VALUES','value' : boosterInitValues, 'type' : 'json_object','cate' : 'Booster','name' : 'Booster initial values.', "desc": "Booster initial values for new account."},
      {'key' : 'BOOSTER_SHARE_LIMIT_PER_DATE','value' : 1, 'type' : 'integer','cate' : 'Booster','name' : 'Limit sharing in a date', "desc": "Limit sharing in a date."},
      {'key' : 'BOOSTER_SHARE_LIMIT_IN_PERIOD','value' : 86400, 'type' : 'integer','cate' : 'Booster','name' : 'Limit sharing in a period', "desc": "Period to share N content (Default 1)."},
      {'key' : 'PRODUCT_EXCLUSIVE_EXPIRED_TIME','value' : 86400,'type' : 'integer','cate' : 'Default','name' : 'Default maximum customers were generated.','desc':'Default maximum customers were generated.'},
      {'key' : 'CUSTOMER_CREATE_MULTIPLE_LIMIT','value' : 15,'type' : 'integer','cate' : 'Customer','name' : 'Default maximum customers were generated.','desc':'Default maximum customers were generated.'},
      {'key' : 'CUSTOMER_TYPE_PER_PRODUCT_PRICE','value' : customerPrice,'type' : 'json_object','cate' : 'Customer','name' : 'Default price per customer type.','desc':'Default price per customer type.'},
      {'key' : 'CUSTOMER_TYPE_PER_PRODUCT_QUANTITY','value' : customerQuantity,'type' : 'json_object','cate' : 'Customer','name' : 'Default quantity per product per customer type.','desc':'Default quantity per product per customer type.'},
      {'key' : 'CUSTOMER_VIP_QUANTITY','value' : '[2,5,10]','type' : 'json_object','cate' : 'Customer','name' : 'Default quantity per product of VIP customer.','desc':'Default quantity per product of VIP customer. The specified quantity will be randomized base on these values.'},
      {'key' : 'CUSTOMER_VIP_TIME_TO_LIVE','value' : 120,'type' : 'integer','cate' : 'Customer','name' : 'VIP customer time to live.','desc':'VIP customer time to live.'},
      {'key' : 'CUSTOMER_LEPRECHAUN_REWARDS','value' : leprechaunRewards,'type' : 'json_object','cate' : 'Customer','name' : 'Leprechaun rewards per level.','desc':'Rewards per level: money, gift, budget.'},
      {'key' : 'CUSTOMER_LEPRECHAUN_LEVEL_CHANCE','value' : leprechaunLevelChance,'type' : 'json_object','cate' : 'Customer','name' : 'Leprechaun level appearance chance.','desc':'Leprechaun level appearance chance.'},
      {'key' : 'CUSTOMER_LEPRECHAUN_LSCT','value' : lepreLSCT,'type' : 'integer','cate' : 'Customer','name' : 'Leprechaun customer spawn count total (LSCT).','desc':'Total spawn per month.'},
      {'key' : 'CUSTOMER_LEPRECHAUN_LCMIP','value' : lepreLCMIP,'type' : 'integer','cate' : 'Customer','name' : 'Leprechaun Current Month Injection Pool (LCMIP).','desc':'Total money will be injected per month.'},
      {'key' : 'LIST_RANDOM_PRODUCT_LIMIT','value' : 15,'type' : 'integer','cate' : 'Default','name' : 'Default maximum products generated.','desc':'Default maximum products generated.'},
      {'key' : 'LINKSHARE_TOKEN','value' : "b07466bdeafacc843f09ed6b43a5a82189b0b620efd3040aa70921f49847a31b",'type' : 'string','cate' : 'Commission','name' : 'Default linkshare token.','desc':'Default linkshare token.'},
      {'key' : 'SAFE_COPPER_TIMER','value' : 14400,'type' : 'integer','cate' : 'Safebox','name' : 'Safebox copper time.','desc':'Safebox copper time.'},
      {'key' : 'SAFE_SILVER_TIMER','value' : 28800,'type' : 'integer','cate' : 'Safebox','name' : 'Safebox silver time.','desc':'Safebox silver time.'},
      {'key' : 'SAFE_GOLD_TIMER','value' : 72000,'type' : 'integer','cate' : 'Safebox','name' : 'Safebox gold time.','desc':'Safebox gold time.'},
      {'key' : 'CJ_PID','value' : "7854987",'type' : 'string','cate' : 'Commission','name' : 'Default CJ Publisher Id.','desc':'Default CJ Publisher Id.'},
      {'key' : 'COMMISSION_CASHBACK','value' : 0.30,'type' : 'float','cate' : 'Default','name' : 'Commission cashback','desc':'Maximum player cashback % of the global allocation.'},
      {'key' : 'COMMISSION_EXCLUSIVE','value' : 0.01,'type' : 'float','cate' : 'Default','name' : 'Commission exclusive','desc':'Maximum player exclusive % of the global allocation.'},
      {'key' : 'COMMISSION_REFERER','value' : 0.01,'type' : 'float','cate' : 'Default','name' : 'Commission referer','desc':'Maximum player referer % of the global allocation.'},
      {'key' : 'COMMISSION_MAXIMUM_UNCHECK','value' : 10,'type' : 'integer','cate' : 'Default','name' : 'Commission maximum uncheck','desc':'Maximum commission going without manual validation.'},
      {'key' : 'CASHOUT_MAXIMUM_UNCHECK','value' : 100,'type' : 'integer','cate' : 'Default','name' : 'Cashout maximum uncheck','desc':'Maximum cashout going without manual validation.'},
      {'key' : 'CASHOUT_MINIMUM','value' : 20,'type' : 'integer','cate' : 'Default','name' : 'Cashout minimum','desc':'Minimum cashout value.'},
      {'key' : 'PLAYER_STAR_CALC_VALUE_XA','value' : 150,'type' : 'integer','cate' : 'Game','name' : 'Star calculation value - Xa','desc':'Star calculation value - Xa'},
      {'key' : 'PLAYER_STAR_CALC_EXP_XB','value' : 1.16,'type' : 'float','cate' : 'Game','name' : 'Star calculation exp - Xb','desc':'Star calculation exp - Xb'},
      {'key' : 'PLAYER_STAR_CALC_ADDITION_XC','value' : 182,'type' : 'integer','cate' : 'Game','name' : 'Star calculation addition - Xc','desc':'Star calculation addition - Xc'},
      {'key' : 'MEMBER_EVENT_DURATION','value' : eventDuration,'type' : 'json_object','cate' : 'Game','name' : 'Event duration','desc':'List event duration of vip, parade, grand opening.'},
      {'key' : 'PLAYER_MINIGAME_DEFAULT_REWARD_BUDGET','value' : 10,'type' : 'integer','cate' : 'Game','name' : 'Product category minigame rewards','desc':'Product category minigame rewards.'},
      {'key' : 'NOTIFICATION_NEW_PRODUCT_AVAILABLE_LIMIT_PER_DAY','value' : 10,'type' : 'integer','cate' : 'Notification','name' : 'Notification new product available limit per day','desc':'Notification new product available limit per day.'},
      {'key' : 'GET_LIST_DATA_DEFAULT_LIMIT','value' : 30,'type' : 'integer','cate' : 'Default','name' : 'Filter limit default value','desc':'Filter limit default value.'},
      {'key' : 'MAX_CUSTOMERS_IN_A_CELL','value' : 5,'type' : 'integer','cate' : 'Customer','name' : 'Maximum customers in a cell','desc':'Maximum customers in a cell.'},
      {'key' : 'MAX_PRODUCTS_FOR_CHECK_UPLOADING_IMAGE','value' : 1000,'type' : 'integer','cate' : 'Product','name' : 'Maximum products for check uploading image','desc':'Maximum product per once get'},
      {'key' : 'FLEXOFFERS_API_KEY','value' : "95cc6b2a-b1ec-42de-9ab9-c5aef17991b2",'type' : 'string','cate' : 'Default','name' : 'Default Flex Offer Api Key','desc':'Default Flex Offer Api Key'},
      {'key' : 'STORE_ELEVATOR','value' : elevatorConfig,'type' : 'json_object', 'cate' : 'Store', 'name' : 'Setting ','desc':''}
    ];

    return settingList;
  };

  // RemoteMethod: Add a new key if it is not exists
  Setting.updateConfigs2016 = function(ctx, next){
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1) {
      var error = new Error("Permission denied.");
      error.code = "AUTHORIZATION_REQUIRED";
      return next(error);
    }

    // Init variables.
    Setting.app.models.Variable.initValues(function() {});

    var settingList = Setting.getDefaultConfigs();
    var missing = [];
    ObjectID = Setting.getDataSource().ObjectID;
    async.eachSeries(settingList, function(item, nextSetting) {
      var data = {
        'name' : item.name,
        'description' : item.desc,
        'configName' : item.key,
        'configValue' : item.value,
        'configValueType' : item.type,
        'created' : new Date(),
        'modified' : new Date(),
        'position' : 0,
        'category' : item.cate
      };
      data.id = ObjectID();
      Setting.findOrCreate({
        where: {
          configName: data.configName
        }
      }, data , function (err, log) {
        if (err) {
          return nextSetting(err);
        }
        return nextSetting();
      });
    }, function(error) {
      if (error) {
        next(error);
      }
      next();
    });

  };

  Setting.remoteMethod(
    'updateConfigs2016',
      {
        accessType: 'WRITE',
        accepts: [
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Create a new instance of the model and persist it into the data source.',
        http: {verb: 'post', path: '/updateConfigs2016'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
  };

  Setting.setup();
};
