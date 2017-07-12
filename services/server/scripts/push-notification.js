var async = require('async')
  , MongoClient = require("mongodb").MongoClient
  , FCM = require('fcm-push')
  , fs = require('fs')
  , common = require('../scripts/common');

var configs = common.getConfig();

function pushItem(item, fcm, callback){
  if(item.device && item.device.id){
    var message = {
      to: 'registration_token_or_topics', // required fill with device token or topics
      collapse_key: 'notification',
      data: {},
      notification: {
        title: 'Title of your push notification',
        body: 'Body of your push notification'
      }
    };
    message.to = item.device.id;
    message.notification.body = item.data.sentence;
    message.data = item.data;
    switch(item.device.os){
      case 'Android':
      case 'iOS':
      default:
        fcm.send(message, function(err, response){
          if (err) {
            callback(err);
          } else {
            callback();
          }
        });
    }
  }else{
    callback();
  }
}
function pushNotification(callback){
  MongoClient.connect(configs.mongodb, function (err, db) {
    if (err) {
      common.showDebug(err);
      callback(err);
    } else {
      var Notification = db.collection('Notification');
      Notification.find().sort({_id: 1}).limit(configs.limit).toArray(function (err, items) {
        if (err) {
          common.showDebug(err);
          callback(err);
        }
        else {
          var fcm = new FCM(configs.firebase.serverKey);
          var totalItems = items.length;
          var totalDone = 0;
          var pushedIds = [];
          if(totalItems){
            var errors = [];
            for(var i=0; i< totalItems; i++){
              pushedIds.push(items[i]._id);
              pushItem(items[i], fcm, function(err){
                if (err) {
                  errors.push(err);
                }

                if(++totalDone >= totalItems){
                  common.showDebug('Pushed ' + totalDone + ' items.', errors);
                  Notification.remove({'_id': {'$in': pushedIds}}, function(_error, res) {
                    callback(err);
                  });
                }
              });
            }
          }else{
            common.showDebug('All notifications is pushed');
            callback();
          }
        }
      });
    }
  });
}

pushNotification(function(err){
  process.exit();
});