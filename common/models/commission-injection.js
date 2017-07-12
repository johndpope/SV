module.exports = function(CommissionInjection) {
  CommissionInjection.prefixError = "CMI_";
  CommissionInjection.disableRemoteMethod('createChangeStream',true);
  CommissionInjection.disableRemoteMethod('upsert',true);
  CommissionInjection.disableRemoteMethod('exists',true);
  CommissionInjection.disableRemoteMethod('findOne',true);
  CommissionInjection.disableRemoteMethod('findById',true);
  CommissionInjection.disableRemoteMethod('create',true);
  CommissionInjection.disableRemoteMethod('updateAll',true);
  CommissionInjection.disableRemoteMethod('updateAttributes',false);
  CommissionInjection.disableRemoteMethod('replaceById',true);
  CommissionInjection.disableRemoteMethod('replaceOrCreate',true);
  CommissionInjection.disableRemoteMethod('updateOrCreate',true);
  CommissionInjection.disableRemoteMethod('upsertWithWhere',true);
  CommissionInjection.disableRemoteMethod('deleteById',true);
  CommissionInjection.definition.rawProperties.created.default =
    CommissionInjection.definition.properties.created.default = function() {
    return new Date();
  };
  CommissionInjection.definition.rawProperties.modified.default =
    CommissionInjection.definition.properties.modified.default = function() {
    return new Date();
  };
  CommissionInjection.injectMoneyToUser = function(amount, userId, next){
    this.app.models.Member.findById(userId, function(err, userObj) {
      if (err) {
        next(err);
      } else if(!userObj) {
        error = new Error("User is not exists");
        error.code = CommissionInjection.prefixError + "IM01";
        next(error);
      } else {
        var CommInjectionObj = {
          amount: amount,
          ownerId: userId
        };
        if (amount < CommissionInjection.app.models.Setting.configs.COMMISSION_MAXIMUM_UNCHECK)  {      
          CommInjectionObj.status = 'done';
          var Member = CommissionInjection.getDataSource().connector.collection(CommissionInjection.app.models.Member.modelName);
          Member.update({ "_id": userObj.id} , { $inc: { moneyAmount: amount } }, function(err, result) {
            CommissionInjection.create(CommInjectionObj, function(err, instance) {
              if(err) {
                next(err);
              }else{
                next(null,instance);
              }
            });
          });
        } else { 
          CommInjectionObj.status = 'under_validation';
          CommissionInjection.create(CommInjectionObj, function(err, instance) {
            if(err) {
              next(err);
            }else{
              next(null,instance);
            }
          });
        }
      }
    });
  };
};
