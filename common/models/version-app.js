var validator = require('validator');

APP_PLATFORM = ["IOS","WINDOW","ANDROID"];

module.exports = function(VersionApp) {
  VersionApp.prefixError = 'VAP_';

  // Workaround for https://github.com/strongloop/loopback/issues/292
  VersionApp.definition.rawProperties.description.default =
    VersionApp.definition.properties.description.default = function() {
      // string as default
    return "";
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  VersionApp.definition.rawProperties.created.default =
    VersionApp.definition.properties.created.default = function() {
      return new Date();
  };

  // Process uploaded files
  VersionApp.beforeSave = function(next, versionApp) {
    var self = this;
    var where = {};
    if(self.id){
      var platform = versionApp.platform || self.platform;
      var version = versionApp.version || self.version;
      where = {'id': {"ne": self.id},'version':version,'platform':platform};
    }
    else{
      where = {platform : self.platform,version:self.version};
    }
    VersionApp.count(where,function(err,num){
      if(err){
        next(err);
      }
      else if(num > 0){
        next(new Error("Version of this Platform was existed"));
      }
      else{
        next();
      }
    })
  };

  VersionApp.coolStocket = function(next) {
    next(null, "Stocket (SV) is very cool. We love it!!!");
  };

  VersionApp.setup = function() {
    // Disable unused remote methods
    //VersionApp.disableRemoteMethod('create', true);
    VersionApp.disableRemoteMethod('upsert', true);
    VersionApp.disableRemoteMethod('exists', true);
    VersionApp.disableRemoteMethod('findOne', true);
    VersionApp.disableRemoteMethod('updateAll', true);
    VersionApp.disableRemoteMethod('createChangeStream', true);
    VersionApp.disableRemoteMethod('replaceById', true);
    VersionApp.disableRemoteMethod('replaceOrCreate', true);
    VersionApp.disableRemoteMethod('upsertWithWhere', true);
    // -----------------------------

    // name
    VersionApp.validatesLengthOf('title', { min: 3, max: 100, message: 'is invalid' });

    // configName
    //VersionApp.validatesUniquenessOf('configName', {message: 'is not unique'});

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
    VersionApp.validate('description', validateDescription, { message: 'Invalid description' });

    // check if configName is valid
    function validateTitle(cb_err) {
      if(typeof this.title !== 'undefined') {
        if(typeof this.title !== 'string') {
          cb_err();
        } else {
          if(this.title.length > 100) {
            cb_err();
          }
        }
      }
    }
    VersionApp.validate('title', validateTitle, { message: 'Invalid Title' });

    // check if URL is valid
    function validateURL(cb_err) {
      if(typeof this.url !== 'undefined') {
        if(!validator.isURL(this.url)){
          cb_err();
        }
      }
    }
    VersionApp.validate('url', validateURL, { message: 'Invalid URL' });

    // check if configValue is valid
    function validateReleaseDate(cb_err) {
      if (typeof this.created !== 'undefined') {
        // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
        if (!validator.isDate(this.releaseDate)) {
          cb_err();
        }
      }
      else{
        cb_err();
      }
    }
    VersionApp.validate('releaseDate', validateReleaseDate, { message: 'The releaseDate is invalid' });

    // check if configValue is valid
    function validatePlatform(cb_err) {
      if(typeof this.platform !== 'undefined') {
        if(!validator.isIn(this.platform,APP_PLATFORM)){
          cb_err();
        }
      }
    }
    VersionApp.validate('platform', validatePlatform, { message: 'Platform is invalid. It must be  IOS or ANDROID or WINDOW' });

    // check if created is valid
    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
        if (!validator.isDate(this.created)) {
          cb();
        }
      }
    }
    VersionApp.validate('created', validateCreated, {message: 'Invalid created'});

    VersionApp.checkVersion = function(ctx, next){
      var platform = "";
      var version = "";
      var compareVersions = require('compare-versions');
      var res = {needUpdate : false, url : null};
      try {
        // https://docs.strongloop.com/display/public/LB/Using+current+context
        var request = ctx;
        if(request === null || typeof request === undefined) {
          var error = new Error('Get context error');
          error.code = VersionApp.prefixError + 'CV01';
          return next(error);
        }

        platform = request.headers['platform'];
        version = request.headers['version'];
      } catch(ex) {
        var error = new Error('Some eror occur when checking version');
        error.code = VersionApp.prefixError + 'CV02';
        return next(error);
      }

      if(typeof platform !== 'undefined' && platform !== null ){
        VersionApp.find({where:{'platform':platform},order: "releaseDate DESC","limit":1},function(err,appVers){
          if(err){
            next(err);
          }
          else if(appVers.length == 0){
            next(null,res);
          }
          else{
            var current = appVers[0];
            if(typeof version !== 'undefined' && version !== null ){
              if(compareVersions(version,current.version) == -1){
                res.needUpdate = true;
                res.url = current.url;
              }
            }
            next(null,res);
          }
        })
      } else {
        var error = new Error('Can not get platform');
        error.code = VersionApp.prefixError + 'CV03';
        return next(error);
      }
    }
    VersionApp.remoteMethod(
      'checkVersion', {
        accessType: 'READ',
        accepts: [
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        returns: {arg: 'data', type: 'any', root: true},
        http: {verb: 'get', path: '/checkVersion'}
      }
    );

    VersionApp.remoteMethod(
      'coolStocket',
      {
        accessType: 'READ',
        accepts: [
        ],
        description: 'Stocket (SV) is very cool.',
        http: {verb: 'GET', path: '/coolStocket'},
        returns: {arg: 'data', type: 'any', root: true}
      }
    );
  }
  VersionApp.setup();
};
