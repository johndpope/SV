var async = require('async');
var common = require('../scripts/common');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var configs = common.getConfig();
var url = configs.mongodb;
require('date-utils');
var fs = require('fs');

SAFE_TYPE_NONE = 'none';
SAFE_TYPE_COPPER = 'copper';
SAFE_TYPE_SILVER = 'silver';
SAFE_TYPE_GOLD   = 'gold';

STORE_STATUS_CLOSED = 'closed';
MongoClient.connect(url, function(err, db) {
  if(err) {
    common.showDebug(err);
    db.close();
    process.exit();
  } else {
    async.parallel([
      function(callback) {
        var settings = [];
        async.series([
          function(cb) {
            common.getSettings(db, function(err, foundSettings) {
              if (err) {
                cb(null, "Error while finding Settings - safebox.");
              }
              settings = foundSettings;
              cb();
            });
          },
          function(cb) {
            var safeBox = db.collection('Safebox');
            var now = new Date().getTime();
            var copperTime = now - common.getSettingValue(settings, "SAFE_COPPER_TIMER");
            var silverTime = now - common.getSettingValue(settings, "SAFE_SILVER_TIMER");
            var goldTime = now - common.getSettingValue(settings, "SAFE_GOLD_TIMER");
            safeBox.find({
              safeStatus: 'ongoing_timer',
              "$or": [
                {
                  safeTypeChoice: SAFE_TYPE_COPPER,
                  startDate: {"$lte": new Date(copperTime)}
                },
                {
                  safeTypeChoice: SAFE_TYPE_SILVER,
                  startDate: {"$lte": new Date(silverTime)}
                },
                {
                  safeTypeChoice: SAFE_TYPE_GOLD,
                  startDate: {"$lte": new Date(goldTime)}
                }
              ]
            }).limit(configs.limit).toArray(cb);
          }
        ], function(err, results) {
          if(err) {
            callback(null, "Error while finding safebox.");
          } else {
            var Safeboxes = results[1];
            var Store = db.collection('Store');
            var Member = db.collection('Member');
            var Notification = db.collection('Notification');
            var now = new Date();
            var notifications = [];
            var storeIds = [];
            var brandIds = [];
            var memberIds = [];
            var safeIds = [];
            if(Safeboxes.length > 0 ) {
              for (var i = 0; i < Safeboxes.length; i++) {
                storeIds.push(ObjectID(Safeboxes[i].storeId));
                memberIds.push(Safeboxes[i].storeId.toString());
                safeIds.push(Safeboxes[i]._id);
                notifications.push({
                  "data": {
                    "notificationId": 15,
                    "cellNumber": Safeboxes[i].cellNumber,
                    "safeType": Safeboxes[i].safeTypeChoice
                  }
                });
              }
              async.parallel([
                function(cb) {
                  Store.find({_id: {$in: storeIds}}).toArray(cb);
                },
                function(cb) {
                  Member.find({storeId: {$in: memberIds}}).toArray(cb);
                }
              ], function(err, results) {
                if(err) {
                  callback(null, "Error while finding Store and Member of safebox.");
                } else {
                  var stores = results[0];
                  var members = results[1];
                  var Safebox = db.collection('Safebox');
                  for (var i = 0; i < stores.length; i++) {
                    notifications[i].data.memberId = stores[i].ownerId;
                    brandIds.push(ObjectID(stores[i].cells[notifications[i].data.cellNumber -1].brandId));
                    notifications[i].device = members[i].device || null;
                  }
                  var Brand = db.collection('Brand');
                  Brand.find({_id: {$in: brandIds}}).toArray(function(err, brands) {
                    if(err) {
                      callback(null, "Error while finding brand of Safebox.");
                    }
                    else if (brands.length == 0) {
                      Safebox.updateMany({_id: {$in: safeIds}}, {$set: {safeStatus: "collectable"}}, function() {
                        callback(null, "Brand not found while processing Safebox notification.");
                      });
                    }
                    else {
                      for (var i = 0; i < brands.length; i++) {
                        var imageUrl = common.getSettingValue(settings, "MEDIA_LINK");
                        imageUrl = imageUrl.replace("_container_",brands[i].picture.container);
                        imageUrl = imageUrl.replace("_filename_",brands[i].picture.name);
                        notifications[i].data.sentence = "A gift box is waiting for you in your "+brands[i].name+" store";
                        notifications[i].data.brand = {
                          "id": brands[i]._id,
                          "name": brands[i].name,
                          "imageUrl": imageUrl,
                          "picture": brands[i].picture
                        }
                      }
                      async.parallel([
                        function(cb) {
                          Notification.insertMany(notifications, cb);
                        },
                        function(cb) {
                          Safebox.updateMany({_id: {$in: safeIds}}, {$set: {safeStatus: "collectable"}}, cb);
                        }
                      ], function(err) {
                        if (err) {
                          return callback(null, "Error while updating safebox and inserting notifications.");
                        }
                        callback(null, "Successfully updating safebox and inserting notifications.");
                      })
                    }
                  })
                }
              });
            } else {
              callback(null, "We don't have any notification for safebox.");
            }
          }
        })
      },
      function(callback) {
        var Store = db.collection('Store');
        var Member = db.collection('Member');
        var Notification = db.collection('Notification');
        Store.find({
          notified: 0,
          openTime: {"$lte": 37}, // in spec required 30s, but we need to wait bg push notify, so need plus some seconds.
          openStatus: {"$ne": STORE_STATUS_CLOSED}
        }).limit(configs.limit).toArray(function(err, stores) {
          if(err) {
            callback(null, "Error while finding Store");
          } else {
            if(stores.length > 0) {
              var now = new Date();
              var storeIds = [];
              var memberIds = [];
              var notifications = [];
              for (var i = 0; i < stores.length; i++) {
                notifications.push({
                  "data": {
                    "memberId": stores[i].ownerId,
                    "notificationId": 13,
                    "sentence": "Your store is closing soon"
                  }
                });
                memberIds.push(ObjectID(stores[i].ownerId));
                storeIds.push(stores[i]._id);
              }
              if(notifications.length > 0) {
                Member.find({_id: {$in: memberIds}}).toArray(function(err, members){
                  if(err) {
                    callback(null, "Error while finding member of Store.");
                  }
                  else if (!members || members.length === 0) {
                    Store.updateMany({_id: {$in: storeIds}}, {$set: {notified: 1}}, function() {
                      callback(null, "Empty member owned Store.");
                    });
                  }
                  else {
                    var nMembers = members.length;
                    var i = 0;
                    var memberList = {};
                    for (i = 0; i < nMembers; i++) {
                      var item = members[i];
                      memberList[item._id.toString()] = item;
                    }

                    for (i = 0; i < notifications.length; i++) {
                      var memberId = notifications[i].data.memberId.toString();
                      if (memberList[memberId] && memberList[memberId].device) {
                        notifications[i].device = memberList[memberId].device;
                      }
                    }
                    async.parallel([
                      function(cb) {
                        Notification.insertMany(notifications, cb);
                      },
                      function(cb) {
                        Store.updateMany({_id: {$in: storeIds}}, {$set: {notified: 1}}, cb);
                      }
                    ], function(err) {
                      if (err) {
                        return callback(null, "Error while inserting notifications or updating Store.");
                      }
                      console.log(storeIds);
                      callback(null, "Successfully inserting notifications or updating Store.");
                    })
                  }
                });
              }
            } else {
              callback(null, "We don't have any notifications for Store");
            }
          }
        })
      }
    ], function(errors, rs) {
      if(errors) {
        common.showDebug(errors);
        db.close();
        process.exit();
      } else {
        common.showDebug(rs[0], rs[1]);
        db.close();
        process.exit();
      }
    })
  }
});
