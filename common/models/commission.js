var fs = require('fs')
  , IncomingForm = require('formidable')
  , loopback = require('loopback')
  , parse = require('csv-parse')
  , async = require('async')
  , URLSafeBase64 = require('urlsafe-base64');
var configs = loopback.getConfigs();
module.exports = function(Commission) {
  Commission.prefixError = "CMN_";
  Commission.disableRemoteMethod('createChangeStream',true);
  Commission.disableRemoteMethod('upsert',true);
  Commission.disableRemoteMethod('exists',true);
  Commission.disableRemoteMethod('findOne',true);
  Commission.disableRemoteMethod('findById',true);
  Commission.disableRemoteMethod('create',true);
  Commission.disableRemoteMethod('updateAll',true);
  Commission.disableRemoteMethod('updateAttributes',false);
  Commission.disableRemoteMethod('replaceById',true);
  Commission.disableRemoteMethod('replaceOrCreate',true);
  Commission.disableRemoteMethod('updateOrCreate',true);
  Commission.disableRemoteMethod('upsertWithWhere',true);
  Commission.disableRemoteMethod('deleteById',true);
  
  Commission.definition.rawProperties.created.default =
    Commission.definition.properties.created.default = function() {
    return new Date();
  };
  Commission.definition.rawProperties.modified.default =
    Commission.definition.properties.modified.default = function() {
    return new Date();
  };
  Commission.loadData = function (file_path, callback){
    var csvData=[];
    fs.createReadStream(file_path)
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow) {
        csvData.push(csvrow);
    })
    .on('end',function() {
      callback(null,csvData);
    })
    .on('error', function(err) {
      callback(err);
    });
  };

  Commission._mapIndex = function(type, listTitle) {
    switch(type){
      case 'CJ':
        var mapIndex = {
          trackingId: listTitle.indexOf('SID'),//SID
          affiliateId: listTitle.indexOf('Commission ID'),//"CJ" + Commission ID (if from CJ)
          value: listTitle.indexOf('Sale Amount (USD)'),// CJ - Sale Amount (USD)
          commissionValue: listTitle.indexOf('Publisher Commission (USD)'),//CJ - Publisher Commission (USD)
          purchaseDate: listTitle.indexOf('Event Date')//CJ - Event Date
        };
        break;
      case 'FO':
        var mapIndex = {
          trackingId: listTitle.indexOf('OrderNumber'),// Order Number
          affiliateId: listTitle.indexOf('Id'),// TransactionId
          value: listTitle.indexOf('SaleAmount'), // FO- Sale Amount
          commissionValue: listTitle.indexOf('MerchantAmount'), // FO - Merchant Amount
          purchaseDate: listTitle.indexOf('TransactionDate') // FO - Date created transaction
        };
        break;
      default:
        var mapIndex = {
          trackingId: listTitle.indexOf('Member ID (U1)'),//Member ID (U1)
          affiliateId: listTitle.indexOf('Transaction ID'),//"LS" + Transaction ID (if from LinkShare)
          value: listTitle.indexOf('Sales'),//LS - Sales
          commissionValue: listTitle.indexOf('Total Commission'),//LS - Total Commission
          purchaseDate: [listTitle.indexOf('Transaction Created On Date'),listTitle.indexOf('Transaction Created On Time')]//LS - Transaction Date + Transaction Time
        };
      }
    return mapIndex;
  }

  Commission._decodeCommTrackID = function(commTrackId) {
    var purchaseObj = null;
    if(URLSafeBase64.validate(commTrackId)) {
      commTrackId = commTrackId.replace(/-/g, "+");
      commTrackId = commTrackId.replace(/_/g, "/");
      var url = URLSafeBase64.decode(commTrackId).toString('hex');
      if(url.length == 96) {
        purchaseObj = {
          memberIdPurshaser: url.substring(0,24),
          productId: (url.substring(24,48) == "000000000000000000000000") ? null : url.substring(24,48),
          memberIdReferer: (url.substring(48,72) == "000000000000000000000000") ? null : url.substring(48,72),
          memberIdExclusive: (url.substring(72,96) == "000000000000000000000000") ? null : url.substring(72,96)
        }
      }
    }
    return purchaseObj;
  }

  Commission._injectMoney = function(listStars) {
    setting = Commission.app.models.Setting.configs;
    listStars.forEach(function(star) {
      if(star.commissionValue != 0){
        Commission.app.models.CommissionInjection.injectMoneyToUser(star.commissionValue * setting.COMMISSION_CASHBACK * star.star / setting.CELL_ASSIGNMENT_MAX, star.id, function(){}) ;
        if (star.memberIdExclusive != null) {
          Commission.app.models.CommissionInjection.injectMoneyToUser(star.commissionValue * setting.COMMISSION_EXCLUSIVE, star.memberIdExclusive, function(){}) ;
        }
        if (star.memberIdReferer != null) {
          Commission.app.models.CommissionInjection.injectMoneyToUser(star.commissionValue * setting.COMMISSION_REFERER, star.memberIdReferer, function(){}) ;
        }
      }
    })
  }

  Commission.importCommission = function(request, response, type, next){
    var StoreCollection = Commission.getDataSource().connector.collection(Commission.app.models.Store.modelName);
    if(request.user) {
      var userInfo = request.user;
      if (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1) {
        var error = new Error("Permission denied.");
        error.statusCode = 401;
        error.code = "AUTHORIZATION_REQUIRED";
        return next(error);
      }
      //IF u have large file then. use this to avoid timeout..
      request.connection.setTimeout(16000);
      var form = new IncomingForm({});
      type = type.toUpperCase();
      form
        .on('file', function(field, file) {
          var ext = file.name.split('.').pop().toLowerCase();
          if(ext === 'csv') {
            Commission.loadData(file.path, function(err, data){
              if(err){
                return next(err);
              }else{
                fs.readFile(file.path, function (err, data) {//Backup file import
                  fs.writeFile(configs.app_path + "/images/" + Date.now() + "_" + file.name, data, function (err) {});
                });
                var listTitle = data.shift();//Get the title in first row
                var mapIndex = Commission._mapIndex(type, listTitle);
                var commIdObj = data.map(function(item) {return type + item[mapIndex.affiliateId];})
                Commission.find({"where": {"affiliateId": {"inq": commIdObj}}}, function(err, found) {
                  var dt = data;
                  if(found && found.length) {
                    var foundObj = found.map(function(item) {return item.affiliateId});
                    dt = data.filter(function(item) {return foundObj.indexOf(type + item[mapIndex.affiliateId]) == -1;})
                  }
                  var commObj = [];
                  var listIdPurchaser = [];
                  var listId = [];
                  async.each(dt,
                    function(item, nextItem) {
                      var CommId = type + item[mapIndex.affiliateId];
                      if(typeof item[mapIndex.trackingId] !== 'undefined' && item[mapIndex.trackingId] !== '') {
                        var purchaseObj = Commission._decodeCommTrackID(item[mapIndex.trackingId]);
                        if(purchaseObj) {
                          var CommissionObj = {
                            type: type,
                            affiliateId: CommId,
                            value: item[mapIndex.value].trim().replace(',','.'),
                            commissionValue:  item[mapIndex.commissionValue].trim().replace(',','.'),
                            purchaseDate: new Date(),
                            status: 'new',
                            memberIdPurshaser: purchaseObj.memberIdPurshaser,
                            productId: purchaseObj.productId,
                            memberIdReferer: purchaseObj.memberIdReferer,
                            memberIdExclusive: purchaseObj.memberIdExclusive,
                          };
                          listId.push(purchaseObj.memberIdPurshaser.toString())
                          listIdPurchaser.push({memberIdPurshaser: purchaseObj.memberIdPurshaser.toString(), commissionValue: CommissionObj.commissionValue});
                          if(type === 'LS'){
                            CommissionObj.purchaseDate = new Date(item[mapIndex.purchaseDate[0]] +' '+ item[mapIndex.purchaseDate[1]]);
                          }else{
                            CommissionObj.purchaseDate = new Date(item[mapIndex.purchaseDate]);
                          }
                          commObj.push(CommissionObj);
                          nextItem();
                        } else {
                          nextItem();
                        }
                      } else {
                        nextItem();
                      }
                    },
                    function(err){
                      StoreCollection.find({"ownerId":{$in: listId}}).toArray(function(err, foundStores) {
                        var listStars = listIdPurchaser.map(function(st) {
                          var star = 0;
                          var commissionValue = '';
                          var memberIdExclusive = '';
                          var memberIdReferer = '';
                          foundStores.forEach(function(store) {
                            if(st.memberIdPurshaser == store.ownerId) {
                              star = store.totalStar;
                            }
                          })
                          commObj.forEach(function(comm, index) {
                            if(st.memberIdPurshaser == comm.memberIdPurshaser && st.commissionValue == comm.commissionValue) {
                              commissionValue = comm.commissionValue;
                              memberIdExclusive = comm.memberIdExclusive;
                              memberIdReferer = comm.memberIdReferer;
                              commObj[index].status = 'injected';
                            }
                          })
                          return {id: st.memberIdPurshaser, star: star, commissionValue: commissionValue, memberIdExclusive : memberIdExclusive, memberIdReferer: memberIdReferer};
                        })
                        async.parallel([
                          function(cb) {
                            Commission._injectMoney(listStars);
                            cb();
                          },
                          function(cb) {
                            Commission.create(commObj, cb);
                          }
                        ], function(err) {})
                      })
                    }
                  );
                })
              }
            });
          }
        })
        .on('end', function(name, file) {
          next();
        });
      form.parse(request);
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
  };
  Commission.remoteMethod(
    'importCommission',
    {
      accessType: 'WRITE',
      accepts: [
        {arg: 'req', type: 'object', 'http': {source: 'req'}},
        {arg: 'res', type: 'object', 'http': {source: 'res'}},
        {arg: 'type', type: 'string', http: {source: 'path'}, description: 'cj or ls',required: true},
      ],
      description: 'Upload and import commission',
      http: {verb: 'post', path: '/import/:type'},
      returns: {arg: 'result', type: 'object'}
    }
  );
};
