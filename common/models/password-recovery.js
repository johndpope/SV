PATTERN_STRING = "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
FORGOT_PASSWORD_CODE_LENGTH = 6;

module.exports = function(PasswordRecovery) {
  // Workaround for https://github.com/strongloop/loopback/issues/292
  PasswordRecovery.definition.rawProperties.created.default =
    PasswordRecovery.definition.properties.created.default = function() {
    return new Date();
  };

  PasswordRecovery.generateForgotPasswordCode = function() {
    var text = "";
    for( var i=0; i < FORGOT_PASSWORD_CODE_LENGTH; i++ ) {
      text += PATTERN_STRING.charAt(Math.floor(Math.random() * PATTERN_STRING.length));
    }
    return text;
  }

  PasswordRecovery.setup = function() {
    // check if memberId is valid
    function validateMemberId(cb_err, done) {
      if (typeof this.memberId !== 'undefined') {
        var self = this;
        PasswordRecovery.getApp(function(err, app) {
          // check existence by id
          app.models.Member.exists(self.memberId, function(err, isExist) {
            if (!isExist || err) {
              cb_err();
            }
            done();
          });
        });
      }else{
        // definition in .json will handle the 'required' case, so here, just done()
        done();
      }
    }
    PasswordRecovery.validateAsync('memberId', validateMemberId, {message: 'Invalid memberId'});

    // Validate unique memberId
    PasswordRecovery.validatesUniquenessOf('memberId', { message: 'memberId is used or invalid' });

    // check if created is valid
    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
        if (!validator.isDate(this.created)) {
          cb();
        }
      }
    }
    PasswordRecovery.validate('created', validateCreated, {message: 'Invalid created'});
  }
};
