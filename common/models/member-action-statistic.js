  var   _ = require('underscore')
  , async = require('async')
  ;

module.exports = function(MemberActionStatistic) {
  MemberActionStatistic.definition.rawProperties.created.default =
    MemberActionStatistic.definition.properties.created.default = function() {
    return new Date();
  };
  MemberActionStatistic.definition.rawProperties.modified.default =
    MemberActionStatistic.definition.properties.modified.default = function() {
    return new Date();
  };
  MemberActionStatistic.actionCounter = function(playerId, actionKey, value, next){
    this.findOne({
      where: {
        memberId: playerId,
        actionKey: actionKey
      }
    }, 
    function(err, instance) {
      if(!err) {
        if(instance){
          var updatedNumber = instance.number;
          if (value == -1){//reset counter of action : number = 0
            instance.number = 0; 
          }
          else{
            instance.number += value;
            updatedNumber = instance.number;
          }
          if (instance.bestNumber < updatedNumber) {
              instance.bestNumber = updatedNumber;
          }
          instance.modified = new Date();
          instance.save({ validate: true }, function(err, savedItem) {
            if(err){
              next(err);
            }else{
              MemberActionStatistic.app.svQueueJob.push({playerId: playerId, actionKey: actionKey, number: value});
              next();
            }
          });
        }else{//Create
          MemberActionStatistic.create({memberId:playerId, actionKey:actionKey, number: value, bestNumber:value}, function (err, instance) {
            if(err){
              next(err);
            }else{
              MemberActionStatistic.app.svQueueJob.push({playerId: playerId, actionKey: actionKey, number: value});
              next();
            }
          });
        }
      }else{
        next(err);
      }
  });
};

MemberActionStatistic.actionListCounter = function(playerId, actionArr, next) {
    // actionArr = [{actionKey: , value: }]
  var actionListKey = actionArr.map((action) => { return action.actionKey.trim(); });
  actionListKey = _.uniq(actionListKey);
  this.find({
    where: {
      memberId: playerId,
      actionKey: {
        inq: actionListKey
      }
    }
  }, function(err, instances) {
    if(err) return next(err);
    var updateArr = actionArr.filter( function(action) { return _.findLastIndex(instances, {actionKey: action.actionKey}) > -1 });
    var createArr = actionArr.filter( function(action) { return _.findLastIndex(instances, {actionKey: action.actionKey}) == -1 });
    async.parallel([
      function(cb) {
        createArr = createArr.map((elem) => { return {memberId: playerId, actionKey: elem.actionKey, number: elem.value, bestNumber: elem.value}});
        MemberActionStatistic.create(createArr, (err, instances) => {
          if(err) return cb(err);
          cb();
        })
      },
      function(cb) {
        // Update record , we will send all to queue
        async.each(updateArr, function(inst, nextInst) {
          var instUpdate = instances.filter(function(el) { return el.actionKey == inst.actionKey })[0];
          instUpdate.modified = new Date();
          var updatedNumber = instUpdate.number;
          if (inst.value == -1){//reset counter of action : number = 0
            instUpdate.number = 0;
          }
          else {
            // Reset and increase number.
            if (inst.set) {
              instUpdate.number = inst.value;
              if (updatedNumber < instUpdate.number) {
                updatedNumber = instUpdate.number;
              }
            }
            else {
              instUpdate.number += inst.value;
              updatedNumber = instUpdate.number;
            }
          }
          if (instUpdate.bestNumber < updatedNumber) {
              instUpdate.bestNumber = updatedNumber;
          }
          instUpdate.save({ validate: true }, nextInst);
        }, cb);
      }
    ], function(err, rs) {
      if(err) return next(err);
      MemberActionStatistic.app.svQueueJob.push({playerId: playerId});
      return next();
    })

  })
}


MemberActionStatistic.updateOpenStoreTime = function(playerId, value){
    this.findOne({
      where: {
        memberId: playerId,
        actionKey: MISSION_ACTION_TOTAL_OPEN_STORE_TIME
      }
    }, 
    function(err, instance) {
      if(!err) {
        if(instance){
          instance.number = value;
          if (value > instance.bestNumber){
              instance.bestNumber = value;
          }
          instance.modified = new Date();
          instance.save({ validate: true }, function(err, savedItem) {
            if(!err){
              MemberActionStatistic.app.svQueueJob.push({playerId: playerId, actionKey: MISSION_ACTION_TOTAL_OPEN_STORE_TIME, number: value});
            }
          });
        }else{
          MemberActionStatistic.create({memberId:playerId, actionKey:MISSION_ACTION_TOTAL_OPEN_STORE_TIME, number: value, bestNumber:value}, function (err, instance) {
            if(!err){
              MemberActionStatistic.app.svQueueJob.push({playerId: playerId, actionKey: MISSION_ACTION_TOTAL_OPEN_STORE_TIME, number: value});
            }
          });
        }        
      }
    });
  };
};