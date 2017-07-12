var validator = require('validator');

SOCIAL_NETWORK = {FACEBOOK: 'facebook', GOOGLE: 'google', TWITTER: 'twitter'};
SOCIAL_NETWORK_ALLOWED = [
SOCIAL_NETWORK.FACEBOOK,
SOCIAL_NETWORK.GOOGLE,
SOCIAL_NETWORK.TWITTER
];

module.exports = function(SocialNetworkAccount) {
  SocialNetworkAccount.prefixError = "SNA_";
  // Workaround for https://github.com/strongloop/loopback/issues/292
  SocialNetworkAccount.definition.rawProperties.created.default =
    SocialNetworkAccount.definition.properties.created.default = function() {
    return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  SocialNetworkAccount.definition.rawProperties.modified.default =
    SocialNetworkAccount.definition.properties.modified.default = function() {
    return new Date();
  };

  // update "modified" property
  SocialNetworkAccount.beforeUpdate = function beforeUpdateAction(next, inst) {
    inst.modified = new Date();
    next();
  }

  // Workaround for https://github.com/strongloop/loopback/issues/292
  SocialNetworkAccount.definition.rawProperties.isDisabled.default =
    SocialNetworkAccount.definition.properties.isDisabled.default = function() {
    return 0;
  };

  /* check if specific Social Network Account is deletable
    get count of SNA relate to specific memberId
    > 1: ok
    = 1: check password
    password = null -> invalid
    password != null -> valid
  */
  SocialNetworkAccount.isDeletable = function(snaId, cb) {
    var self = this;
    var condition = {
      where: {id: snaId}
      , include: 'member'
    };

    self.findOne(condition, function(err, sna) {
      if(err || !sna) {
        if (!err) {
          err = new Error('Empty SocialNetworkAccount.');
          err.code = SocialNetworkAccount.prefixError + "ID01";
        }
        cb(err);
      } else {
        var member = sna.member();
        if (!member) {
          var err = new Error("Empty member");
          err.code = SocialNetworkAccount.prefixError + "ID02";
          return cb(err);
        }
        // if password is not set
        if (!('password' in member) || !member.password) {
          // check the total social network accounts
          var condition = {
            "memberId": member.id
          };
          self.count(condition, function(err, noOfSNA) {
            if (err || noOfSNA == 1) {
              if (!err) {
                err = new Error('Social Network Account - Deletion is not allowed');
              }
              err.code = SocialNetworkAccount.prefixError + "ID03";
              cb(err);
            }else{
              cb();
            }
          });
        }else {
          cb();
        }
      }
    });
  }

  SocialNetworkAccount.setup = function() {
    // userId - chars in length max 200 (?)
    SocialNetworkAccount.validatesLengthOf('userId', {min:2, max: 255, message: 'User Id is invalid'});

    // provider must be unique
    SocialNetworkAccount.validatesUniquenessOf('userId', { scopedTo: ['socialNetworkId'], message: 'Social Network - UserId pair is used or invalid' });

    // check if socialNetworkId is valid
    function validateSocialNetworkId(cb_err) {
      if (typeof this.socialNetworkId !== 'undefined') {
        if (!validator.isIn(this.socialNetworkId, SOCIAL_NETWORK_ALLOWED)) {
          cb_err();
        }
      } else {
        cb_err();
      }
    }
    SocialNetworkAccount.validate('socialNetworkId', validateSocialNetworkId, {message: 'Invalid socialNetworkId'});

    // check if memberId is valid
    function validateMemberId(cb_err, done) {
      if (typeof this.memberId !== 'undefined') {
        var self = this;
        SocialNetworkAccount.getApp(function(err, app) {
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
    SocialNetworkAccount.validateAsync('memberId', validateMemberId, {message: 'Invalid memberId'});

    // accessToken - chars in length max 200 (?)
    // API-159
    // SocialNetworkAccount.validatesLengthOf('accessToken', {min:2, max: 255, message: 'Access token is invalid'});

    // isDisabled must be number and 1 or 0
    SocialNetworkAccount.validatesNumericalityOf('isDisabled', { int: true, message: { int: 'isDisabled must be a number' }});
    SocialNetworkAccount.validatesInclusionOf('isDisabled', {in: [1, 0], message: 'isDisabled must be 1 or 0'});

    SocialNetworkAccount.observe('before delete', function(ctx, next) {
      if(typeof ctx.where.id !== 'undefined') {
        SocialNetworkAccount.isDeletable(ctx.where.id, function(err, sna) {
          if (err) {
            next(err);
          } else {
            next();
          }
        });
      } else {
        next();
      }
    });
  }

  SocialNetworkAccount.setup();
};
