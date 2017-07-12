var validator = require('validator')
  , async = require('async')
  ;
require('date-utils');

module.exports = function(Purchasepackage) {

  Purchasepackage.definition.rawProperties.created.default =
      Purchasepackage.definition.properties.created.default = function() {
        return new Date();
  };

  Purchasepackage.definition.rawProperties.modified.default =
      Purchasepackage.definition.properties.modified.default = function() {
        return new Date();
  };

  Purchasepackage.definition.rawProperties.price.default =
      Purchasepackage.definition.properties.price.default = function() {
        return 0;
  };

  Purchasepackage.definition.rawProperties.items.default =
      Purchasepackage.definition.properties.items.default = function() {
        return null;
  };

  Purchasepackage.definition.rawProperties.priceUnit.default =
      Purchasepackage.definition.properties.priceUnit.default = function() {
        return "USD";
  };

  Purchasepackage.createDefaultList = function(ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var keys = ["1 Key", "5 Keys", "10 Keys", "1 Small Gift Box", "1 Big Gift Box", "1 Giant Gift Box", "5000", "10000", "25000", "100000", "1 Hard Hat", "5 Hard Hats", "10 Hard Hats"];
    var data = [{ name : "1 Key", description: "Opens Store", items:[{boosterKey: BOOSTER_STORE_KEY, number: 1}],category : "Keys", price : 0.99 }
      , { name : "5 Keys", description: "Opens Store", items:[{boosterKey: BOOSTER_STORE_KEY, number: 5}], category : "Keys", price : 2.99 }
      , { name : "10 Keys", description: "Opens Store", items:[{boosterKey: BOOSTER_STORE_KEY, number: 10}], category : "Keys", price : 4.99 }
      , { name : "1 Small Gift Box", description: "Common Powerups", items:[{boosterKey: BOOSTER_SMALL_GIFT, number: 1}], category : "Gift Box", price : 0.99 }
      , { name : "1 Big Gift Box", description: "Common and Rare Powerups", items:[{boosterKey: BOOSTER_BIG_GIFT, number: 1}], category : "Gift Box", price : 2.99 }
      , { name : "1 Giant Gift Box", description: "Common, Rare, Epic  and Legendary Powerups", items:[{boosterKey: BOOSTER_GIANT_GIFT, number: 1}], category : "Gift Box", price : 4.99 }
      , { name : "5000", description: "Stocket Bucks", items:[{boosterKey: BOOSTER_MONEY, number: 5000}], category : "Stocket Bucks", price : 0.99 }
      , { name : "10000", description: "Stocket Bucks", items:[{boosterKey: BOOSTER_MONEY, number: 10000}], category : "Stocket Bucks", price : 2.99 }
      , { name : "25000", description: "Stocket Bucks", items:[{boosterKey: BOOSTER_MONEY, number: 25000}], category : "Stocket Bucks", price : 4.99 }
      , { name : "100000", description: "Stocket Bucks", items:[{boosterKey: BOOSTER_MONEY, number: 100000}], category : "Stocket Bucks", price : 9.99 }
      , { name : "1 Hard Hat", description: "Construction booster", items:[{boosterKey: BOOSTER_HARD_HAT, number: 1}], category : "Hard Hat", price : 0.99 }
      , { name : "5 Hard Hats", description: "Construction booster", items:[{boosterKey: BOOSTER_HARD_HAT, number: 5}], category : "Hard Hat", price : 2.99 }
      , { name : "10 Hard Hats", description: "Construction booster", items:[{boosterKey: BOOSTER_HARD_HAT, number: 10}], category : "Hard Hat", price : 4.99 }
    ]

    Purchasepackage.findOrCreate({where: {name: {inq: keys}}}, data, function(err) {
      if(err) return next(err);
      return next();
    });
  }
  Purchasepackage.getCategories = function(next){
    var PurchasepackageCollection = Purchasepackage.getDataSource().connector.collection(Purchasepackage.modelName);
    PurchasepackageCollection.distinct( "category",
      function(err, records) {
        if(err) {
          next(err);
        } else {
          next(null,records);
        }
      });
  }

  Purchasepackage.setup = function() {
    Purchasepackage.disableRemoteMethod('upsert',true);
    Purchasepackage.disableRemoteMethod('createChangeStream',true);
    Purchasepackage.disableRemoteMethod('exists',true);
    Purchasepackage.disableRemoteMethod('findOne',true);
    Purchasepackage.disableRemoteMethod('updateAll',true);
    Purchasepackage.disableRemoteMethod('upsertWithWhere',true);
    Purchasepackage.disableRemoteMethod('replaceOrCreate',true);
    Purchasepackage.disableRemoteMethod('replaceById',true);

    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        if (!validator.isDate(this.created)) {
          cb();
        }
      }
    }
    Purchasepackage.validate('created', validateCreated, {message: 'Invalid created'});

    function validateModified(cb) {
      if (typeof this.modified !== 'undefined') {
        if (!validator.isDate(this.modified)) {
          cb();
        }
      }
    }
    Purchasepackage.validate('modified', validateModified, {message: 'Invalid modified'});

    function validatePrice(err) {
      if(typeof this.price !== 'undefined' && this.price) {
        if(!validator.isFloat(this.price)) {
          err();
        }
      }
    }
    Purchasepackage.validate('price', validatePrice, {message: 'Invalid price'});

  }

  Purchasepackage.remoteMethod(
    'createDefaultList' ,
    {
      description: 'Create list PurchasePackage with default data.',
      accepts: { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}},
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'post', path: '/createDefaultList'}
    }
  )

  Purchasepackage.remoteMethod(
    'getCategories' ,
    {
      description: 'Get Categories form PurchasePackage.',
      returns: {arg: 'data', type: 'any', root: true},
      http: {verb: 'get', path: '/getCategories'}
    }
  )

  Purchasepackage.setup();
};
