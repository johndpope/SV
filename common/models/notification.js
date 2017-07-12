var async = require('async');

NOTIFICATION_DEVICE_OS_IOS     = 'iOS';
NOTIFICATION_DEVICE_OS_ANDROID = 'Android';
NOTIFICATION_DEVICE_OS = [NOTIFICATION_DEVICE_OS_IOS, NOTIFICATION_DEVICE_OS_ANDROID];

module.exports = function(Notification) {
  Notification.prefixError='NOT_';
  Notification.definition.rawProperties.created.default =
      Notification.definition.properties.created.default = function() {
        return new Date();
  };

  Notification.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      ctx.instance.modified = new Date();
    } else {
      ctx.data.modified = new Date();
    }
    next();
  });

  Notification._forMultiUnexclusive = function(data, next) {
    if(typeof data.products == 'undefined' || typeof data.userInfo == 'undefined') {
      var error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    var products = data.products;
    var userInfo = data.userInfo;
    async.each(products, function(product, callback) {
      Notification._forUnexclusive({
        "product": product,
        "userInfo": userInfo
      }, callback);
    }, next)
  }

  Notification._forUnexclusive = function(data, next) {
    if(typeof data.product == 'undefined' || typeof data.userInfo == 'undefined') {
      var error = new Error("Missing parameters");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    var MemberCollection = Notification.getDataSource().connector.collection(Notification.app.models.Member.modelName);
    var product = data.product;
    var userInfo = data.userInfo;
    var storeIds = [];
    var memberIds = [];
    MEDIA_LINK = Notification.app.models.Setting.configs['MEDIA_LINK'];
    var imageURL = MEDIA_LINK.replace('_container_', product.pictures[0].container);
    imageURL = imageURL.replace('_filename_',product.pictures[0].name);

    Notification.app.models.Brand.findById(product.brand.id, function(err, brand) {
      if(err || !brand) {
        var error = new Error("Brand not found");
        error.code = Notification.prefixError+"FU01";
        return next(error);
      }
      var brandURL = MEDIA_LINK.replace('_container_', brand.picture.container);
      brandURL = imageURL.replace('_filename_',brand.picture.name);
      var notifications = [{
        "data": {
          "memberId": userInfo.id,
          "product": {
            "id": product.id,
            "name": product.title,
            "imageURL": imageURL,
            "pictures": product.pictures
          },
          "brand": {
            "id": brand.id,
            "name": brand.name,
            "imageURL": brandURL,
            "picture": brand.picture
          },
          "notificationId": 14,
          "sentence": "Your exclusive for "+product.title+" of "+product.brand.name+" has expired"
        },
        "device": userInfo.device || null,
        "created": new Date(),
        "modified": new Date()
      }];
      if(product.stores && product.stores.length > 0) {
        for (var i = 0; i < product.stores.length; i++) {
          if(product.stores[i].toString() != userInfo.storeId.toString()) {
            storeIds.push(product.stores[i].toString());
          }
        }
      }
      Notification.app.models.Stockroom.find({
        where: {
          products: data.product.id
        },
        fields: { memberId: true }
      }, function(err, found) {
        if(err) return next(err);
        if(!found || (found && found.length == 0)) memberIds = [];
        for (var i = 0; i < found.length; i++) {
          memberIds.push(found[i].memberId);
        }
        MemberCollection.find({
          $or: [
            {_id: {$in: memberIds}},
            {storeId: {$in: storeIds}}
          ]
        }, {_id: 1, device: 1}).toArray(function(err, members) {
          if(err) return next(err);
          if(members && members.length > 0) {
            for (var i = 0; i < members.length; i++) {
              if(members[i]._id.toString() !== userInfo.id.toString()) {
                notifications.push({
                  "data": {
                    "memberId": members[i]._id,
                    "product": {
                      "id": product.id,
                      "name": product.title,
                      "imageURL": imageURL,
                      "pictures": product.pictures
                    },
                    "brand": {
                      "id": brand.id,
                      "name": brand.name,
                      "imageURL": brandURL,
                      "picture": brand.picture
                    },
                    "notificationId": 12,
                    "sentence": "An Exclusive is available for "+product.title+" of "+product.brand.name
                  },
                  "device": members[i].device || null,
                  "created": new Date(),
                  "modified": new Date()
                })
              }
            }
          }
          Notification.create(notifications, function(err, instaces) {
            if(err) return next(err);
            next();
          })
        })
      })
    })
  }
};
