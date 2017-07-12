var validator = require('validator')
  , path = require('path')
  , loopback = require('loopback')
  , clone = require('clone')
  , async = require('async')
  , fs = require('fs')
  , util = require('util')
  , raw = require('facebook-api').raw
  , google = require('googleapis')
  , twitter = require('twitter')
  ;

var MEMBER_TYPES = { USER: 1, ADMIN: 2}
  , SALT_WORK_FACTOR = 10
  , LANGUAGES = ['EN','FR','ES']
  , SOCIAL_DEFAULT_EMAIL = '@stocket.com'
  , MALE = 1
  , FEMALE = 2
  , DEFAULT_MEMBER_TITLE = 'Member'
  , DEFAULT_SESSION_EXPIRED = 3600 * 999
  ;
var MEMBER_RANK_NAMES = ["Shop Maven", "Chief Ninja", "Bossy Boss", "Big Cheese", "Grand Tycoon"];

MEMBER_EVENT_VIP = 'vip';
MEMBER_EVENT_PARADE = 'parade';
MEMBER_EVENT_GRANDOPENING = 'grandOpening';
MEMBER_EVENTS = [MEMBER_EVENT_VIP, MEMBER_EVENT_PARADE, MEMBER_EVENT_GRANDOPENING];

var bcrypt;
try {
  // Try the native module first
  bcrypt = require('bcrypt');
  // Browserify returns an empty object
  if (bcrypt && typeof bcrypt.compare !== 'function') {
    bcrypt = require('bcryptjs');
  }
} catch (err) {
  // Fall back to pure JS impl
  bcrypt = require('bcryptjs');
}

module.exports = function(Member) {

  Member.prefixError = "MEM_";

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Member.definition.rawProperties.type.default =
    Member.definition.properties.type.default = function() {
    return [MEMBER_TYPES.USER];
  };

  Member.definition.rawProperties.lastLogin.default =
    Member.definition.properties.lastLogin.default = function() {
    return null;
  };

  Member.definition.rawProperties.moneyAmount.default =
    Member.definition.properties.moneyAmount.default = function() {
    return 0;
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Member.definition.rawProperties.created.default =
    Member.definition.properties.created.default = function() {
    return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Member.definition.rawProperties.modified.default =
    Member.definition.properties.modified.default = function() {
    return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Member.definition.rawProperties.dateOfBirth.default =
    Member.definition.properties.dateOfBirth.default = function() {
    return null;
  };
  Member.definition.rawProperties.budget.default =
    Member.definition.properties.budget.default = function() {
    return Member.app.models.Setting.configs.DEFAULT_MEMBER_BUDGET;
  };

  Member.definition.rawProperties.totalSale.default =
    Member.definition.properties.totalSale.default = function() {
    return 0;
  };
  Member.definition.rawProperties.total_spawned_customers.default =
    Member.definition.properties.total_spawned_customers.default = function() {
    return 0;
  };
  Member.definition.rawProperties.total_satisfied_customers.default =
    Member.definition.properties.total_satisfied_customers.default = function() {
    return 0;
  };
  Member.definition.rawProperties.level.default =
    Member.definition.properties.level.default = function() {
    return 1;
  };
  Member.definition.rawProperties.rank.default =
    Member.definition.properties.rank.default = function() {
    return MEMBER_RANK_NAMES[0];
  };

  Member.calcRankByTotalStar = function(totalStar) {
    // Calculate to update member.rank.
    var newRank = MEMBER_RANK_NAMES[0];
    if (totalStar > 32) {
      newRank = MEMBER_RANK_NAMES[4];
    }
    else if (totalStar > 18) {
      newRank = MEMBER_RANK_NAMES[3];
    }
    else if (totalStar > 8) {
      newRank = MEMBER_RANK_NAMES[2];
    }
    else if (totalStar > 2) {
      newRank = MEMBER_RANK_NAMES[1];
    }
    return newRank;
  };

  // Update "modified" property and generate verify token if create new Member.
  Member.observe('before save', function(ctx, next) {
    // Create new user.
    if(ctx.instance) {
      if (!ctx.instance.emailVerified) {
        ctx.instance.verificationToken = Member.generateVerificationToken();
      }
    }

    // Update current Member.
    if (ctx.currentInstance) {
      ctx.currentInstance.modified = new Date();
    }

    next();
  });

  Member.prototype.isAnyEventBySharing = function() {
    var isShared = false;
    if (this.share) {
      var now = new Date();
      for (var snName in this.share) {
        // skip loop if the property is from prototype
        if (!this.share.hasOwnProperty(snName)) {
          continue;
        }

        var sharingSN = this.share[snName];
        if (sharingSN.startedEvent) {
          isShared = true;
          break;
        }
      }
    }

    return isShared;
  };

  /**
   * Is event possible to start new?
   * ``js
   *   event = [{
   *     type: vip, parade, grandOpening
   *     startDate: date,
   *     duration: N
   *   }]
   * ``
   * @return {Mixed} [description]
   */
  Member.prototype.isAnyEventPossible = function(startByShare) {
    if (typeof startByShare === 'undefined') {
      startByShare = true;
    }

    // Check any event is started by Sharing.
    if (startByShare && this.isAnyEventBySharing()) {
      return false;
    }

    var isOk = true;
    var availableEvents = MEMBER_EVENTS;
    if (this.events && Array.isArray(this.events)) {
      isOk = false;
      var nEvents = this.events.length;

      // Check all eventType.
      availableEvents = [];
      var allEvents = clone(MEMBER_EVENTS);
      for (var i = 0; i < nEvents; i++) {
        var item = this.events[i];

        var idx = allEvents.indexOf(item.type);
        if (idx > -1) {
          allEvents.splice(idx, 1);
        }

        if (this.isEventObjectPossible(item)) {
          availableEvents.push(item.type);
          isOk = true;
        }
      }

      // Available event is in list.
      if (allEvents.length > 0) {
        allEvents.forEach(function(eventType) {
          availableEvents.push(eventType);
        });
      }

    }

    return isOk ? availableEvents : false;
  };

  Member.prototype.isEventObjectPossible = function(eventObj) {
    if (!eventObj) {
      return true;
    }
    var isOk = false;
    var now = +new Date();
    var startDate = +new Date(eventObj.startDate);

    var diff = (now - startDate) / 1000; // convert ms to s.
    if (diff >= eventObj.duration) {
      isOk = true;
    }

    return isOk;
  };

  Member.prototype.isEventTypePossible = function(eventType) {
    if (!this.events || !Array.isArray(this.events)) {
      return true;
    }

    var targetE;
    var nEvents = this.events.length;
    for (var i = 0; i < nEvents; i++) {
      var item = this.events[i];
      if (item.type === eventType) {
        targetE = item;
        break;
      }
    }

    return this.isEventObjectPossible(targetE);
  };

  /**
   * Is store shared today?
   *
   * @return {Boolean} [description]
   */
  Member.prototype.isAnySharing = function() {
    var isShared = false;
    if (this.share) {
      var now = new Date();
      for (var snName in this.share) {
        // skip loop if the property is from prototype
        if (!this.share.hasOwnProperty(snName)) {
          continue;
        }

        var sharingStatus = this.isAvailableSharing(snName);
        if (sharingStatus === 0 || sharingStatus === 3) {
          isShared = true;
          break;
        }
      }
    }

    return isShared;
  };

  /**
   * [isAvailableSharing description]
   * @param  {[type]}  snName [description]
   * @return {int}
   *   0: shared and full sharing holder;
   *   1: available;
   *   2: available and need reset counter;
   *   3: shared and available to continue sharing.
   */
  Member.prototype.isAvailableSharing = function(snName) {
    var limitSharing = Member.app.models.Setting.configs['BOOSTER_SHARE_LIMIT_PER_DATE'] || 1;
    var nextShareDuration = Member.app.models.Setting.configs['BOOSTER_SHARE_LIMIT_IN_PERIOD'] || 86400;
    var isOK = 1;
    if (this.share && this.share[snName]) {
      isOK = 2;
      var now = +new Date();

      var shareValue = this.share[snName];
      var sharedDate = +new Date(shareValue.sharedDate);
      var diff = (now - sharedDate) / 1000; // convert ms to s.
      if (diff < nextShareDuration) {
        isOK = 0; // shared
        if (limitSharing > shareValue.count) {
          isOK = 3; // shared and available to continue sharing.
        }
      }
    }

    return isOK;
  };

  /**
   * Verify a user's identity by sending them a confirmation email.
   *
   * ```js
   *    var options = {
   *      type: 'email',
   *      to: user.email,
   *      template: 'verify.ejs',
   *      redirect: '/'
   *    };
   *
   *    user.verify(options, next);
   * ```
   *
   * @param {Object} options
   */
  Member.prototype.verify = function (next) {
    var createUser    = this;
    var options       = {
      "to": createUser.email,
      "from": Member.app.get('emailFrom'),
      "subject": Member.app.get('emailRegistrationSubject'),
      "html": '',
      "text": ''
    };

    // Not send mail if in dev local.
    var configs = loopback.getConfigs();
    if (configs.dataSources.mandrillsmtp.settings.transports[0].auth.user === 'UserName') {
      console.log('On DEV local, didn\'t config send mail.');
      return next(null, {email: createUser.email, token: createUser.verificationToken, uid: createUser.id});
    }

    options.redirect  = Member.app.get('publicWebRegistrationRedirectURL');
    if(createUser.type.indexOf(MEMBER_TYPES.ADMIN) !== -1) {
      options.redirect = options.redirect.replace('{userdomain}', Member.app.get('domainAdmin'));
    } else {
      options.redirect = options.redirect.replace('{userdomain}', Member.app.get('domainShopping'));
    }
    options.redirect  = options.redirect + '?uid=' + createUser.id + '&token=' + createUser.verificationToken;

    options.template = path.resolve(path.join(__dirname, '..', '..', 'server', 'templates', 'verify.ejs'));
    options.lastName = createUser.lastName || createUser.firstName || createUser.fullName || createUser.email;

    // For plain/text
    options.text = 'Please verify your email by opening this link in a web browser:\n\t{href}';
    options.text = options.text.replace(/\{href\}/g, options.redirect);

    // For HTML mail.
    var template = loopback.template(options.template);
    options.html = template(options);

    // Email model.
    var Email = createUser.constructor.email || loopback.getModelByType(loopback.Email);
    Email.send(options, function (err, email) {
      if(err) {
        next(err);
      } else {
        next(null, {email: createUser.email, token: createUser.verificationToken, uid: createUser.id});
      }
    });
  };

  // Get owned store
  Member.prototype.getStore = function(next) {
    var currentUser = this;
    if (currentUser.storeId) {
      Member.app.models.Store.findById(currentUser.storeId, function(err, userStore) {
        if (err) {
          next(err);
        } else if (!userStore || !userStore.id){
          error = new Error("User's store not found");
          error.code = Member.prefixError + "GS01";
          next(error);
        } else {
          next(null, userStore);
        }
      });
    } else {
      error = new Error("User's store not found");
      error.code = Member.prefixError + "GS01";
      next(error);
    }
  };

  Member.prototype.getFullName = function(next) {
    var fullName = this.fullName;
    if(!fullName) {
      fullName = this.firstName + ' ' + this.lastName;
    }
    return fullName;
  };

  Member.initStore = function(user, next) {
    var userUpdateData = {
      "verificationToken": null,
      "emailVerified": true
    };

    // Auto fill fullName or lastName, firstName.
    if (!user.fullName) {
      user.fullName = '';
      if (user.firstName) {
        user.fullName += user.firstName;
      }
      if (user.lastName) {
        user.fullName += (user.fullName !== '' ? ' ' + user.lastName : user.lastName);
      }
      userUpdateData.fullName = user.fullName;
    }
    else {
      var names = user.fullName.split(" ");
      if (!user.lastName) {
        userUpdateData.lastName = names[names.length - 1];
      }

      if (!user.firstName && names.length > 1) {
        names.pop();
        userUpdateData.firstName = names.join(" ");
      }
    }

    var ObjectID  = Member.getDataSource().ObjectID;
    var storeId = ObjectID();
    async.parallel([
      function(callback) {
        Member.app.models.Store.create({"ownerId": user.id.toString(), "id": storeId}, function(error, createdStore) {
          if (error) {
            callback(error);
          } else if(!createdStore) {
            error = new Error("Can not initial new store now");
            error.code = Member.prefixError + "IS01";
            callback(error);
          } else {
            callback();
          }
        });
      },
      function(callback) {
        userUpdateData.storeId = storeId;
        user.updateAttributes(userUpdateData, function(err1, updatedMember) {
          if (err1) {
            // Delete store if update data Member error.
            Member.app.models.Store.deleteById(storeId);
            callback(err1);
            return ;
          }
          callback(null, updatedMember);
        });
      },
      function(callback) {
        Member.app.models.MemberBooster.initialForNewAccount(user.id, callback);
      }
    ], next);

    return storeId;
  };

  /**
   * Confirm the user's identity.
   *
   * @param {Any} userId
   * @param {String} token The validation token
   * @param {String} redirect URL to redirect the user to once confirmed
   * @callback {Function} callback
   * @param {Error} err
   */
  Member.confirm = function(uid, token, redirect, fn) {
    this.findById(uid, function(err, user) {
      if (err) {
        fn(err);
      } else {
        if(user && user.emailVerified) {
          err = new Error('This user account has already been verified');
          err.statusCode = 400;
          err.code = 'ALREADY_VERIFIED';
          fn(err);
        } else if (user && (user.verificationToken && user.verificationToken === token)) {
          Member.initStore(user, fn);
        } else {
          if (user) {
            err = new Error('Invalid token: ' + token);
            err.statusCode = 400;
            err.code = 'INVALID_TOKEN';
          } else {
            err = new Error('User not found: ' + uid);
            err.statusCode = 404;
            err.code = 'USER_NOT_FOUND';
          }
          fn(err);
        }
      }
    });
  };

  // check if user is verified or not with email
  Member.isVerifiedYet = function(email, cb) {
    this.findOne({ where:{ "email": email }}, function(err, user) {
      if(err || !user) {
        error = new Error("Email or Password is invalid");
        error.code = Member.prefixError + "IV01";
        cb(error);
      } else {
        if(!user.emailVerified || user.emailVerified === false) {
          error = new Error("Your account has not been activated. Check your email for the activation link.");
          error.code = Member.prefixError + "IV02";
          cb(error);
        } else {
          cb(null, user);
        }
      }
    });
  };

  // check if user is verified or not with userId
  Member.isVerifiedYetWithUserId = function(userId, cb) {
    this.findById(userId, function(err, user) {
      if(err || !user) {
        cb(err);
      } else {
        if(!user.emailVerified || user.emailVerified === false) {
          error = new Error("Your account has not been activated. Check your email for the activation link.");
          error.code = Member.prefixError + "IW01";
          cb(error);
        } else {
          cb(null, user);
        }
      }
    });
  };

  Member.generateVerificationToken = function() {
    var text = "";
    for( var i=0; i < 128; i++ ) {
      text += PATTERN_STRING.charAt(Math.floor(Math.random() * PATTERN_STRING.length));
    }
    return text;
  };

  // verify if social network account is valid
  Member.getSocialNetworkAccount = function(credentials, next) {
    var condition = {
      where: {
        and: [
          { socialNetworkId: credentials.provider },
          { userId: credentials.userId },
          { isDisabled: 0 }
        ]
      }
    };

    Member.app.models.SocialNetworkAccount.findOne(condition, function(err, foundedSocialNetworkAccount) {
      if(err) {
        next(err);
      } else if(!foundedSocialNetworkAccount) {
        next(null, null);
      } else {
        next(null, foundedSocialNetworkAccount);
      }
    });
  };

  Member.isValidSNAAccessToken = function(params, next) {
    if(params.provider) {
      switch(params.provider) {
        case SOCIAL_NETWORK.FACEBOOK:
          if(params.accessToken) {
            raw("GET", 'me', { access_token: params.accessToken }, function(err, data) {
              if(err) {
                var _err = new Error();
                _err.code = 'INVALID_TOKEN';
                _err.message = "Error validating access token.";
                if (err.data) {
                  try {
                    var _data = JSON.parse(err.data);
                    _err.message = _data.error.message;
                  }
                  catch (e) {};
                }
                next(_err);
              } else {
                if(data.id !== params.userId) {
                  error = new Error("Invalid parameters: userId");
                  error.code = "INVALID_PARAMETER";
                  error.field = "userId";
                  next(error);
                } else {
                  next();
                }
              }
            });
          } else {
            var error = new Error("Missing parameter: accessToken");
            error.code = "MISSING_PARAMETER";
            next(error);
          }
          break;
        case SOCIAL_NETWORK.GOOGLE:
          if(params.accessToken) {
            // Create authentication client
            var oauth2Client = new google.auth.OAuth2();

            // Init authentication information
            oauth2Client.setCredentials({ access_token: params.accessToken });

            google.plus('v1').people.get({ userId: 'me', auth: oauth2Client }, function(err, data) {
              if(err) {
                next(err);
              } else {
                next();
              }
            });
          } else {
            var error = new Error("Missing parameter: accessToken");
            error.code = "MISSING_PARAMETER";
            next(error);
          }
          break;
        case SOCIAL_NETWORK.TWITTER:
          if(params.accessToken && params.accessTokenSecret) {
            // Prepare client for twitter
            var client = new twitter({
              consumer_key: Member.app.models.Setting.configs.TWITTER_CONSUMER_KEY,
              consumer_secret: Member.app.models.Setting.configs.TWITTER_CONSUMER_SECRET,
              access_token_key: params.accessToken,
              access_token_secret: params.accessTokenSecret
            });

            client.get('account/verify_credentials', {}, function(err, data, response){
              if(err) {
                next(err);
              } else {
                next();
              }
            });
          } else {
            var error = new Error("Missing parameter: accessToken or accessTokenSecret");
            error.code = "MISSING_PARAMETER";
            next(error);
          }
          break;
        default:{
          error = new Error("This SocialNetwork is not supported yet");
          error.code = Member.prefixError + "IA01";
          next(error);
        }
      }
    } else {
      next();
    }
  };

  Member.loginByTwitter = function(params, next) {
    var credentials   = params.credentials;
    var include       = params.include;

    // Prepare client for twitter
    var client = new twitter({
      consumer_key: Member.app.models.Setting.configs.TWITTER_CONSUMER_KEY,
      consumer_secret: Member.app.models.Setting.configs.TWITTER_CONSUMER_SECRET,
      access_token_key: credentials.accessToken,
      access_token_secret: credentials.accessTokenSecret
    });

    client.get('account/verify_credentials', {}, function(err, data, response){
      if(err) {
        next(err);
      } else {
        // Create new member in case not exists
        var createdMemberParams = {
          type: [MEMBER_TYPES.USER],
          email: credentials.userId + SOCIAL_DEFAULT_EMAIL,
          emailVerified: true
        };

        // set email if email in in retrieved profile
        if(data.email) {
          createdMemberParams.email = data.email;
        }

        // set fullName if name in in retrieved profile
        if(data.name) {
          createdMemberParams.fullName = data.name;
        }

        Member.findOrCreateWithEmail({
          email: data.email,
          createdMemberParams: createdMemberParams
        }, function(err, member) {
          if(err) {
            next(err);
          } else {
            // This assigned only for Twitter
            params.accessTokenSecret = credentials.accessTokenSecret;
            member.generateSocialNetworkAccount(params, next);
          }
        });
      }
    });
  };

  Member.loginByGoogle = function(params, next) {
    var credentials   = params.credentials;
    var include       = params.include;

    // Create authentication client
    var oauth2Client = new google.auth.OAuth2();

    // Init authentication information
    oauth2Client.setCredentials({ access_token: credentials.accessToken });

    google.plus('v1').people.get({ userId: 'me', auth: oauth2Client }, function(err, data) {
      if(err) {
        next(err);
      } else {
        // Create new member in case not exists
        var createdMemberParams = {
          type: [MEMBER_TYPES.USER],
          email: credentials.userId + SOCIAL_DEFAULT_EMAIL,
          emailVerified: true
        };

        // set email if email in in retrieved profile
        // Google responds profile with many email "emails"
        // as confirmed by ms.Mai Huong we will use the first one for now - Wed, 18:34 27/01/2015
        if(data.emails && data.emails.length > 0) {
          createdMemberParams.email = data.emails[0].value;
          data.email = data.emails[0].value;
        }

        // set fullName if name in in retrieved profile
        if(data.displayName) {
          createdMemberParams.fullName = data.displayName;
        }

        // set gender if gender in in retrieved profile
        if(data.gender) {
          if(data.gender == 'male') {
            createdMemberParams.gender = MALE;
          } else if(data.gender == 'female') {
            createdMemberParams.gender = FEMALE;
          }
        }

        Member.findOrCreateWithEmail({
          email: data.email,
          createdMemberParams: createdMemberParams
        }, function(err, member) {
          if(err) {
            next(err);
          } else {
            member.generateSocialNetworkAccount(params, next);
          }
        });
      }
    });
  };

  Member.loginByFacebook = function(params, next) {
    var credentials   = params.credentials;
    var include       = params.include;
    var error;

    raw("GET", 'me', { access_token: credentials.accessToken, fields: 'id,name,email,picture,gender' }, function(err, data) {
      if(err) {
        error = err.data ? new Error(err.data) : err;
        next(error);
      } else {
        // Create new member in case not exists
        var createdMemberParams = {
          type: [MEMBER_TYPES.USER],
          email: credentials.userId + SOCIAL_DEFAULT_EMAIL,
          emailVerified: true
        };

        async.series([
          function(ass_1) {
            // validate userId and accessToken
            if (data.id != credentials.userId) {
              error = new Error("Invalid parameters: userId");
              error.code = "INVALID_PARAMETER";
              error.field = "userId";
              ass_1(error);
            } else {
              ass_1();
            }
          },
          function(ass_1) {
            // set email if email in in retrieved profile
            if (data.email){
              createdMemberParams.email = data.email;
            }

            // set fullName if name in in retrieved profile
            if (data.name){
              createdMemberParams.fullName = data.name;
            }

            // set gender if gender in in retrieved profile
            if (data.gender){
              if (data.gender == 'male'){
                createdMemberParams.gender = MALE;
              }else if (data.gender == 'female'){
                createdMemberParams.gender = FEMALE;
              }
            }

            // set picture if avatar appear in retrieved profile
            if (data.picture && data.picture.data && data.picture.data.url) {
              Member.app.models.Upload.uploadURL({ files: data.picture.data.url }, function(err, picture) {
                if(err) {
                  ass_1(err);
                } else {
                  if(typeof picture[0] != 'undefined') {
                    createdMemberParams.picture = picture[0];
                  }
                  ass_1();
                }
              });
            } else {
              ass_1();
            }
          }
        ], function(err) {
          if(err) {
            next(err);
          } else {
            Member.findOrCreateWithEmail({
              email: data.email,
              createdMemberParams: createdMemberParams
            }, function(err, member) {
              if(err) {
                next(err);
              } else if (!member) {
                error = new Error("Can't find or create player with email from social network.");
                error.code = Member.prefixError + "FB01";
                next(error);
              } else {
                member.generateSocialNetworkAccount(params, next);
              }
            });
          }
        });
      }
    });
  };

  // Find or Create member by email
  Member.findOrCreateWithEmail = function(params, next) {
    if(typeof params.email != 'undefined') {
      Member.findOne({
        where: {
          email: params.email
        }
      }, function(err, foundMember) {
        if(err) {
          next(err);
        } else if(!foundMember) {
          Member.create(params.createdMemberParams, function(err, createdMember) {
            if(err) {
              next(err);
            } else {
              createdMember.isNewAccount = true;
              next(null, createdMember);
            }
          });
        } else {
          next(null, foundMember);
        }
      });
    } else {
      Member.create(params.createdMemberParams, function(err, createdMember) {
        if(err) {
          next(err);
        } else {
          createdMember.isNewAccount = true;
          next(null, createdMember);
        }
      });
    }
  };

  /**
   * Generate SocialNetwork and SocialNetworkAccount for created member
   * @param {object} credentials
   * @param {array|string} include - include information from login
   */
  Member.prototype.generateSocialNetworkAccount = function(params, next) {
    // Init variables
    var member      = this,
        credentials = params.credentials,
        include     = params.include;
        force       = params.force;
    var SocialNetworkAccount = Member.app.models.SocialNetworkAccount;

    // create AccessToken for login
    member.createAccessToken(credentials.ttl, function(err, token) {
      if(err) {
        next(err);
      } else {
        if(Array.isArray(include) ? include.indexOf('user') !== -1 : include === 'user') {
          // NOTE(bajtos) We can't set token.user here:
          //  1. token.user already exists, it's a function injected by
          //     "AccessToken belongsTo User" relation
          //  2. ModelBaseClass.toJSON() ignores own properties, thus
          //     the value won't be included in the HTTP response
          // See also loopback#161 and loopback#162
          token.__data.user = member;
        }
        if (params.socialNetworkAccount) {
          var SNAParams = params.socialNetworkAccount.__data;
          SNAParams.accessToken = credentials.accessToken;
        } else {
          var SNAParams = {
            accessToken: credentials.accessToken,
            userId: credentials.userId,
            memberId: member.id,
            socialNetworkId: credentials.provider
          };
        }

        // This param is used for twitter
        if(credentials.accessTokenSecret) {
          SNAParams.accessTokenSecret = credentials.accessTokenSecret;
        }

        async.parallel([
          function(asp_1) {
            if(member.isNewAccount) {
              Member.initStore(member, asp_1);
            } else {
              asp_1();
            }
          },
          function(asp_1) {
            SocialNetworkAccount.updateOrCreate(SNAParams, function(err, createdSNA) {
              if(err) {
                asp_1(err);
              } else {
                asp_1();
              }
            });
          }
        ], function(err) {
          if(err) {
            next(err);
          } else {
            // Process after login success
            Member.processLoginSuccess({
              userInfo: member,
              token: token,
              force: force,
              device: credentials.device || null
            }, next);
          }
        });
      }
    });
  };

  Member.processLoginSuccess = function(params, next) {
    // Allow ADMIN logged in many times.
    if(params.userInfo.type.indexOf(MEMBER_TYPES.ADMIN) > -1) {
      return Member.updateLastLogin(params, next);
    }

    Member.app.models.AccessToken.find({ where: { userId: params.userInfo.id } }, function(err, userTokens) {
      if(err) {
        next(err);
      } else if(userTokens.length == 1) {
        if(!params.token) {
          params.token = userTokens[0];
        }
        Member.updateLastLogin(params, next);
      } else {
        Member.processForceLogin(params, next);
      }
    });
  };

  Member.processForceLogin = function(params, next)
  {
    if(!params.force) {
      // Logout and show error
      params.token.destroy(function(err) {
        if(err) {
          next(err);
        } else {
          var errorObj = new Error('Force 0: Login error');
          errorObj.code = Member.prefixError+"ML00";
          next(errorObj);
        }
      });
    } else {
      // Remove old tokens
      Member.app.models.AccessToken.destroyAll({
        id: { neq: params.token.id },
        userId: params.token.userId
      }, function(err, count) {
        if(err) {
          next(err);
        } else {
          Member.updateLastLogin(params, next);
        }
      });
    }
  };

  Member.updateLastLogin = function(params, next)
  {
    var res = params.token;
    if(!params.userInfo.lastLogin) {
      res.isFirstLogin = true;
    } else {
      res.isFirstLogin = false;
      res.lastLogin = params.userInfo.lastLogin;
    }
    params.userInfo.__data.lastLogin = new Date();
    if (params.device) {
      params.userInfo.__data.device = params.device;
    }

    async.parallel([
      // Check storeName is rename.
      function(asyc_cb) {
        if (typeof res.storeName !== 'undefined') {
          return asyc_cb();
        }
        Member.app.models.Store.findById(params.userInfo.storeId, {"fields": ["name"]}, function(err, foundStore) {
          if (err) {
            asyc_cb(err);
          }
          else {
            res.storeName = Member.app.models.Store.isNameUpdated(foundStore);
            asyc_cb(null);
          }
        });
      },
      function(asyc_cb) {
        params.userInfo.save({ validate: true }, function(err, savedMember) {
          if(err) {
            asyc_cb(err);
          } else {
            asyc_cb(null);
          }
        });
      }
    ], function(error) {
      if (error) {
        return next(error);
      }
      next(null, res);
    });
  };

  Member.linkWithFB = function(credentials, ctx, next) {
    var params = {
      "credentials": credentials
    };
    var error;

    if (!ctx.user) {
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if (!credentials.accessToken) {
      error = new Error("Invalid parameters: accessToken");
      error.code = "INVALID_PARAMETER";
      error.field = "accessToken";
      return next(error);
    }
    if (!credentials.userId) {
      error = new Error("Invalid parameters: userId");
      error.code = "INVALID_PARAMETER";
      error.field = "userId";
      return next(error);
    }

    raw("GET", 'me', { access_token: credentials.accessToken, fields: 'id,name,email,picture,gender' }, function(err, data) {
      if(err) {
        error = err.data ? new Error(err.data) : err;
        next(error);
      } else {
        // Create new member in case not exists
        var createdMemberParams = {};
        async.series([
          function(ass_1) {
            // validate userId and accessToken
            if (data.id != credentials.userId) {
              error = new Error("Invalid parameters: userId");
              error.code = "INVALID_PARAMETER";
              error.field = "userId";
              ass_1(error);
            } else {
              ass_1();
            }
          },
          function(ass_1) {
            if (ctx.user.email && data.email && (ctx.user.email !== data.email)) {
              error = new Error("Can not link this account with Facebook due to difference email.");
              error.code = Member.prefixError + "LF01";
              return ass_1(error);
            }

            // set email if email in in retrieved profile
            if (data.email){
              if (!ctx.user.email) {
                createdMemberParams.email = data.email;
              }
            }
            else {
              createdMemberParams.email = credentials.userId + SOCIAL_DEFAULT_EMAIL;
            }

            // set fullName if name in in retrieved profile
            if (data.name && !ctx.user.fullName){
              createdMemberParams.fullName = data.name;
            }

            // set gender if gender in in retrieved profile
            if (data.gender && !ctx.user.gender){
              if (data.gender == 'male'){
                createdMemberParams.gender = MALE;
              }else if (data.gender == 'female'){
                createdMemberParams.gender = FEMALE;
              }
            }

            // set picture if avatar appear in retrieved profile
            if (data.picture && data.picture.data && data.picture.data.url && !ctx.user.picture) {
              Member.app.models.Upload.uploadURL({ files: data.picture.data.url }, function(err, picture) {
                if(err) {
                  ass_1(err);
                } else {
                  if(typeof picture[0] != 'undefined') {
                    createdMemberParams.picture = picture[0];
                  }
                  ass_1();
                }
              });
            } else {
              ass_1();
            }
          }
        ], function(err) {
          if(err) {
            return next(err);
          }

          createdMemberParams.createdByDeviceId = false; // making link with SN.
          var MemberCollection = Member.getDataSource().connector.collection(Member.modelName);
          MemberCollection.update({"_id": ctx.user.id}, {"$set": createdMemberParams}, function(err, result) {
            if (err) {
              return next(err);
            }

            var SNAParams = {
              accessToken: credentials.accessToken,
              userId: credentials.userId,
              memberId: ctx.user.id,
              socialNetworkId: SOCIAL_NETWORK.FACEBOOK
            };

            Member.app.models.SocialNetworkAccount.updateOrCreate(SNAParams, function(err, createdSNA) {
              if(err) {
                return next(err);
              }

              next(null, createdSNA);
            });
          });
        });
      }
    });
  };

  Member.loginByDeviceID = function(credentials, include, force, next) {
    var crypto = require('crypto');
    var error;
    var privateKey = fs.readFileSync("./cert/private", "utf8");
    var secretKeyConfig = Member.app.models.Setting.configs["LOGIN_SECRET_KEY"] || "6RkitQhN?62cfMuqQMk#";

    try {
      var a = crypto.privateDecrypt({
        "key": privateKey,
        "padding": crypto.constants.RSA_PKCS1_PADDING
      }, new Buffer(credentials.directToken, "base64"));
    } catch(e) {
      var error = new Error("Invalid parameter: directToken is not correct.");
      error.code = "INVALID_PARAMETER";
      error.field = "directToken";
      return next(error);
    }

    if (credentials.os && NOTIFICATION_DEVICE_OS.indexOf(credentials.os) === -1) {
      var error = new Error("Invalid parameter: device.os");
      error.code = "INVALID_PARAMETER";
      error.field = "os";
      return next(error);
    }

    var rs = new Buffer(a.toString(), "base64").toString().split("/");
    var deviceID = rs[0] || "";
    var secretKey = rs[1] || "";
    if (secretKeyConfig !== secretKey) {
      error = new Error("Invalid parameter: secretKey is not correct.");
      error.code = Member.prefixError + "LD01";
      error.field = "directToken";
      return next(error);
    }

    Member.find({
      "where": {
        "device.id": deviceID
      },
      "fields": []
    }, function(err, foundMembers) {
      if (err) {
        return next(err);
      }
      var maxLen = foundMembers.length;
      var device = credentials.device || {"id": deviceID, "os": credentials.os || null};
      if (maxLen > 1) {
        error = new Error("Invalid parameter: More than one user has the same your deviceID.");
        error.code = Member.prefixError + "LD02";
        error.field = "directToken";
        return next(error);
      }
      else if (maxLen === 1) {
        return foundMembers[0].loginByPass({
          "device": device,
          "credentials": credentials,
          "include": include,
          "force": force
        }, next);
      }

      var cache = Member.app.models.Cache;
      var cid = cache.createKey("Member.loginByDeviceID", device);
      cache.get(cid, function(err, data) {
        if (data) {
          error = new Error("Can not login by this device ID now. One deviceID is used only in 24h.");
          error.code = Member.prefixError + "LD03";
          error.field = "directToken";
          return next(error);
        }

        Member.createAndLoginTmpUser({
          "device": device,
          "credentials": credentials,
          "include": include,
          "force": force
        }, next);
      });
    });
  };

  Member.prototype.loginByPass = function(data, next) {
    var device = data.device || {},
      credentials = data.credentials,
      include = data.include,
      force = data.force || 0;

    var member = this;
    member.createAccessToken(null, credentials, function(err, token) {
      if (err) {
        return next(err);
      }

      // Check include to load user object.
      if (Array.isArray(include) ? include.indexOf('user') !== -1 : include === 'user') {
        token.__data.user = member;
      }

      if (typeof data.storeName === 'boolean') {
        token.storeName = data.storeName;
      }

      Member.processLoginSuccess({
        userInfo: member,
        token: token,
        force: force,
        device: device
      }, next);
    });
  };

  Member.createAndLoginTmpUser = function(data, next) {
    var device = data.device || {},
      credentials = data.credentials,
      include = data.include,
      force = data.force || 0;

    Member.create({
      "device": device,
      "verificationToken": null,
      "emailVerified": true,
      "createdByDeviceId": true
    }, function(err, createdMember) {
      if (err) {
        return next(err);
      }

      var cache = Member.app.models.Cache;
      var cid = cache.createKey("Member.loginByDeviceID", device);
      var ttl = 24 * 60 * 60;
      cache.set(cid, device.id, {"ttl": ttl}, function() {});

      var storeId = Member.initStore(createdMember, function() {});
      createdMember.storeId = storeId;
      data.storeName = false;

      createdMember.loginByPass(data, next);
    });
  };

  // special process for login with normal way (email and password) or login with Social Network Account
  Member.processLogin = function (credentials, include, force, next) {
    // Validate device if exist.
    if (credentials.device) {
      if (typeof credentials.device != 'object' || !credentials.device.id || !credentials.device.os) {
        var error = new Error("Invalid parameter: device. device:{id: '__id__', os: '__os__'}");
        error.code = "INVALID_PARAMETER";
        error.field = "device";
        return next(error);
      }
      if (NOTIFICATION_DEVICE_OS.indexOf(credentials.device.os) === -1) {
        var error = new Error("Invalid parameter: device.os");
        error.code = "INVALID_PARAMETER";
        error.field = "device.os";
        return next(error);
      }
    }
    var self = this;
    force = (typeof force != 'undefined' ? parseInt(force) : 0);
    // Login by social network: Facebook, Google, Twitter.
    if('provider' in credentials && 'accessToken' in credentials && 'userId' in credentials) {
      // check if this social network account is valid
      Member.isValidSNAAccessToken(credentials, function(err) {
        if(err) {
          next(err);
        } else {
          Member.getSocialNetworkAccount(credentials, function(err, socialNetworkAccount) {
            if(err) {
              next(err);
            } else if(!socialNetworkAccount) {
              // Case login with SNA but no registered before we need to create new
              switch(credentials.provider) {
                case SOCIAL_NETWORK.FACEBOOK:
                  Member.loginByFacebook({credentials: credentials, include: include, force: force }, next);
                break;
                case SOCIAL_NETWORK.GOOGLE:
                  Member.loginByGoogle({credentials: credentials, include: include, force: force }, next);
                break;
                case SOCIAL_NETWORK.TWITTER:
                  Member.loginByTwitter({credentials: credentials, include: include, force: force }, next);
                break;
                default:{
                  error = new Error("This SocialNetwork is not supported yet");
                  error.code = Member.prefixError + "PL01";
                  next(error);
                }
              }
            } else {
              // check if owner of this social network exists and verified
              Member.isVerifiedYetWithUserId(socialNetworkAccount.memberId, function(err, member) {
                if(err) {
                  next(err);
                } else if (!member) {
                  error = new Error("Can't find player with email from social network.");
                  error.code = Member.prefixError + "PL02";
                  next(error);
                } else {
                  member.generateSocialNetworkAccount({
                    credentials: credentials,
                    include: include,
                    socialNetworkAccount: socialNetworkAccount,
                    force: force
                  }, next);
                }
              });
            }
          });
        }
      });

      return ;
    }

    if (credentials.directToken) {
      return Member.loginByDeviceID(credentials, include, force, next);
    }

    // Login by email.
    Member.isVerifiedYet(credentials.email, function(err, userInfo) {
      if(err){
        next(err);
      } else {
        Member.login(credentials, include, function (err, token) {
          if(err) {
            error = new Error("Email or Password is invalid");
            error.code = Member.prefixError + "PL03";
            next(error);
          } else {
            Member.processLoginSuccess({
              userInfo: userInfo,
              token: token,
              force: force,
              device: credentials.device || null
            }, next);
          }
        });
      }
    });
  };

  // Forgot password request
  // email of member
  Member.requestPasswordRecovery = function(request, next) {
    if(typeof request.email === 'undefined' || !validator.isEmail(request.email)) {
      error = new Error("Email is invalid");
      error.code = Member.prefixError + "RP01";
      next(error);
    } else {
      var email_cond  = {where: {email: request.email}};
      var user        = this;
      this.findOne(email_cond, function(err, member) {
        if(err || !member) {
          if (err) {
            next(err);
            return ;
          }
          error = new Error("Email is not exist.");
          error.code = Member.prefixError + "RP02";
          next(error);
        } else {
          var app     = Member.app;
          var options = {};
          options.to  = request.email;
          options.template = path.resolve(path.join(__dirname, '..', '..', 'server', 'templates', 'forgotPassword.ejs'));
          options.type = 'email';
          options.from = (app && app.get('emailFrom')) || '';
          options.subject = (app && app.get('emailForgotPasswordSubject')) || '';


          // Init data
          options.fullName = member.fullName || DEFAULT_MEMBER_TITLE;
          options.pwdRecoveryToken = app.models.PasswordRecovery.generateForgotPasswordCode();
          options.confirmURL = app.get('publicWebForgotPaswordRedirectURL');
          if(member.type.indexOf(MEMBER_TYPES.ADMIN) !== -1) {
            options.confirmURL = options.confirmURL.replace('{userdomain}', app.get('domainAdmin'));
          } else {
            options.confirmURL = options.confirmURL.replace('{userdomain}', app.get('domainShopping'));
          }
          options.confirmURL = options.confirmURL + member.id;

          app.models.PasswordRecovery.findOne({memberId: member.id}, function(err, existPasswordRecovery) {
            if(err) {
              next(err);
            } else {
              if(!existPasswordRecovery) {
                existPasswordRecovery = {};
              }
              existPasswordRecovery.memberId = member.id;
              existPasswordRecovery.pwdRecoveryToken = options.pwdRecoveryToken;
              app.models.PasswordRecovery.upsert(existPasswordRecovery, function(err, passwordRecovery) {
                if(err) {
                  next(err);
                } else {
                  options.text = (app && app.get('emailForgotPasswordContent')) || '';
                  options.text = options.text.replace('{pwdRecoveryToken}', options.pwdRecoveryToken);

                  var template = loopback.template(options.template);

                  // Email model
                  var Email = options.mailer || user.constructor.email || loopback.getModelByType(loopback.Email);
                  Email.send({
                    to: options.to,
                    from: options.from,
                    subject: options.subject,
                    text: options.text,
                    html: template(options)
                  }, function (err, email) {
                    if(err) {
                      next(err);
                    } else {
                      next(null, {uid: member.id.toString()});
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  };

  // Confirm password recovery
  // email of member
  Member.confirmPasswordRecovery = function(request, next) {
    var uid = request.uid;
    var pwdRecoveryToken = request.pwdRecoveryToken;
    var pwd = request.pwd + "";
    var missing = [];
    var self = this;
    if(typeof uid === 'undefined' || typeof pwdRecoveryToken === 'undefined' || typeof pwd === 'undefined' || pwd === '') {
      missing.push('Missing information: ');
      if(typeof uid === 'undefined') {
        missing.push('uid');
      }
      if(typeof pwdRecoveryToken === 'undefined') {
        missing.push('pwdRecoveryToken');
      }
      if(typeof pwd === 'undefined' || pwd === '') {
        missing.push('pwd');
      }
      var error = new Error(missing.join(' '));
      error.code = "MISSING_PARAMETER";
      next(error);
    } else {
      var passwordRecoveryCondition = {
        where:
        {
            memberId: uid
            , pwdRecoveryToken: pwdRecoveryToken
        }
      };
      // Find forgot password code
      Member.app.models.PasswordRecovery.findOne(passwordRecoveryCondition, function(err, passwordRecovery) {
        if(err) {
          next(err);
        } else if(!passwordRecovery) {
          // Because in MongoDB it automatic delete record after default time to live
          // So if we can't find it maybe it can be deleted
          error = new Error("Password Recovery Token is invalid");
          error.code = Member.prefixError + "CP01";
          next(error);
        } else {
          // We need to make sure forgot password user is available
          // and we can get email for responses to client
          Member.findById(passwordRecovery.memberId, function(err, member) {
            if(err || !member) {
              error = new Error("Current user is unavailable");
              error.code = Member.prefixError + "CP02";
              next(error);
            } else {
              // Process generate new password
              var tmpHashPwd = self.hashPassword(pwd);
              Member.update({id: member.id}, {password: tmpHashPwd}, function(err, count) {
                if(err || !count) {
                  error = new Error("Password invalid");
                  error.code = Member.prefixError + "CP03";
                  next(error);
                } else {
                  Member.app.models.PasswordRecovery.destroyById(passwordRecovery.id, function(err, count) {
                    if(err) {
                      next(err);
                    } else {
                      next(null, {email: member.email});
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  };

  // Reset this function for creating member with SNA
  Member.validatePassword = function(plain) {
    if(typeof plain === 'string' || plain === null) {
      return true;
    }
  }

  Member.hashPassword = function(plain) {
    var hashedPwd = null;
    if (plain !== null) {
      this.validatePassword(plain);
      var salt = bcrypt.genSaltSync(this.settings.saltWorkFactor || SALT_WORK_FACTOR);
      hashedPwd = bcrypt.hashSync(plain, salt);
    }
    return hashedPwd;
  };

  Member.getCurrentUser = function(ctx, next) {
    var userInfo = ctx.req.user || null;
    var accessToken = ctx.req.accessToken;
    async.parallel([
      function (async_cb) {
        // Check and get current user.
        if (accessToken && accessToken.userId && (typeof userInfo === 'undefined' || !userInfo || !userInfo.id)) {
          Member.findById(accessToken.userId, function(err, foundMember) {
            if(err) {
              async_cb(err);
            } else if(!foundMember) {
              error = new Error("Current logged user is not found.");
              error.code = Member.prefixError + "GC01";
              async_cb(error);
            } else {
              foundMember.id = foundMember.id.toString();
              ctx.req.user = foundMember;
              async_cb(null, foundMember);
            }
          });
        }
        else {
          async_cb(null, userInfo);
        }
      },
      function (async_cb) {
        // Check and re-load Settings config.
        Member.app.models.Setting.checkAndReloadSettingsConfigs(async_cb);
      }
    ], function(err, results) {
      if (err) {
        return next(err);
      }

      next(null, results[0]);
    });
  };

  /**
   * Update required current password to update some special fields: email, password and more.
   * @param  {[type]}   params [description]
   * @param  {[type]}   ctx    [description]
   * @param  {Function} next   [description]
   * @return {[type]}          [description]
   */
  Member.secureUpdate = function(params, ctx, next) {
    if (!ctx.user) {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var foundMember = ctx.user;
    var missing = [];
    var self = this;
    if(typeof params.password === 'undefined' || typeof params.updatedData === 'undefined') {
      missing.push('Missing information: ');
      if(typeof params.password === 'undefined') {
        missing.push('password');
      }
      if(typeof params.updatedData === 'undefined') {
        missing.push('updatedData');
      }
      var error = new Error(missing.join(' '));
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof params.updatedData !== 'object') {
      error = new Error("Invalid parameters: updatedData");
      error.code = "INVALID_PARAMETER";
      error.field = "updatedData";
      return next(error);
    }
    var profileFields = ["password","firstName","lastName","fullName","gender","dateOfBirth","phone","picture","email"];
    for(i in params.updatedData) {
      if(profileFields.indexOf(i) == -1) {
        delete params.updatedData[i];
      }
    }
    if (typeof params.updatedData.email != 'undefined') {
      if (!validator.isEmail(params.updatedData.email)) {
        var error = new Error("Invalid parameters: email");
        error.code = "INVALID_PARAMETER";
        error.field = "email";
        return next(error);
      }

      if (params.updatedData.email === foundMember.email) {
        delete params.updatedData.email;
      }
    }

    if(Object.keys(params.updatedData).length == 0) {
      var error = new Error("Invalid parameters: updatedData is empty or updated email is the same.");
      error.code = "INVALID_PARAMETER";
      error.field = "updatedData";
      return next(error);
    }

    if (typeof params.updatedData.password !== 'undefined' && params.updatedData.password.trim() == '') {
      var error = new Error("Updated password is empty or only has white space.");
      error.code = Member.prefixError + "SU02";
      return next(error);
    }
    async.parallel([
      // Load Social Network account.
      function(acp_one) {
        Member.app.models.SocialNetworkAccount.find({
          "fields": ["id"],
          "where": {
            "memberId": foundMember.id
          }
        }, function(err, foundSNA) {
          if (err) {
            return acp_one(error);
          }
          return acp_one(null, foundSNA);
        });
      },
      function(acp_one) {
        foundMember.hasPassword(params.password, function(err, isMatch) {
          if(err || isMatch === false) {
            error = new Error("Invalid parameters: password");
            error.code = "INVALID_PARAMETER";
            error.field = "password";
            acp_one(error);
          } else {
            acp_one(null);
          }
        });
      },
      function(acp_one) {
        if(params.updatedData.password) {
          if (params.updatedData.password != params.password ) {
            params.updatedData.password = self.hashPassword(params.updatedData.password);
          } else {
            delete params.updatedData.password;
          }
        }
        acp_one(null);
      },
      function(acp_one) {
        if(params.updatedData.email) {
          Member.count({email: params.updatedData.email}, function(err, count) {
            if(err) {
              acp_one(err);
            } else if(count) {
              error = new Error("Invalid parameters: email is exists");
              error.code = "INVALID_PARAMETER";
              error.field = "email";
              acp_one(error);
            } else {
              acp_one(null);
            }
          });
        } else {
          acp_one(null);
        }
      }
    ], function(err, results) {
      if(err) {
        next(err);
      } else {
        // Not allow change email if account linked with Social Network.
        var sna = results[0];
        if (params.updatedData.email && sna.length > 0) {
          error = new Error("Can not update email due to linking with an Social Network Account.");
          error.code = Member.prefixError + "SU03";
          return next(error);
        }

        Member.update({id: foundMember.id}, params.updatedData, function(err, count) {
          if(err) {
            next(err);
          } else {
            if(params.updatedData.password) {
              delete params.updatedData.password;
            }

            next(null, params.updatedData);
          }
        });
      }
    });
  };

  Member.resetPlayerData = function(data, next) {
    var memberId = data.memberId;
    var storeId = data.storeId;
    if(memberId) {
      async.parallel([
        function(acp_one) {
          // Remove all stores of member
          Member.app.models.Store.destroyAll({
            ownerId: memberId
          }, acp_one);
        },
        function(acp_one) {
          // Remove all Stockroom of member
          Member.app.models.Stockroom.destroyAll({
            memberId: memberId
          }, acp_one)
        },
        function(acp_one) {
          // Remove all SocialNetWorkAccount
          Member.app.models.SocialNetworkAccount.destroyAll({
            memberId: memberId
          }, acp_one)
        },
        function(acp_one) {
          // Remove all MemberStateEngine
          Member.app.models.MemberStateEngine.destroyAll({
            memberId: memberId.toString()
          }, acp_one)
        },
        function(acp_one) {
          // Remove all MemberBooster
          Member.app.models.MemberBooster.destroyAll({
            memberId: memberId
          }, acp_one)
        },
        function(acp_one) {
          // Remove all MemberActionStatistic
          Member.app.models.MemberActionStatistic.destroyAll({
            memberId: memberId.toString()
          }, acp_one)
        },
        function(acp_one) {
          // Remove all Safebox
          if(storeId) {
            Member.app.models.Safebox.destroyAll({
              storeId: storeId
            }, acp_one)
          } else {
            acp_one();
          }
        },
        function(acp_one) {
          // Remove all Customer
          Member.app.models.Customer.destroyAll({
            customerPlayerId: memberId.toString()
          }, acp_one)
        },
        function(acp_one) {
          // Remove all Staff
          if(storeId) {
            Member.app.models.Staff.destroyAll({
              storeId: storeId
            }, acp_one)
          } else {
            acp_one();
          }
        },
        function(acp_one) {
          // Remove exclusive from product
          Member.app.models.Product.update({
            "exclusive.ownerId" : memberId.toString()
          }, {
            exclusive : null
          }, acp_one)
        },
        function(acp_one) {
          // Pull storeId from Product.stores
          if(storeId) {
            var ProductCollection = Member.getDataSource().connector.collection(Member.app.models.Product.modelName);
            ProductCollection.update(
              { stores: {$ne: null }},
              { $pull: { stores: storeId.toString() }},
              { multi: true },
              acp_one
            )
          } else {
            acp_one();
          }
        },
        function(acp_one) {
          // Remove all exclusive history of user
          Member.app.models.ExclusiveHistory.destroyAll({
            ownerId: memberId.toString()
          }, acp_one)
        },
        function(acp_one) {
          // Remove all access token of user
          Member.app.models.AccessToken.destroyAll({
            userId: memberId
          }, acp_one)
        },
        function(acp_one) {
          // Remove booster request of user
          Member.app.models.BoosterRequest.destroyAll({
            from: memberId.toString()
          }, acp_one)
        },
        function(acp_one) {
          // Remove CashOutMoney of user
          Member.app.models.CashOutMoney.destroyAll({
            ownerId: memberId.toString()
          }, acp_one)
        },
        function(acp_one) {
          // Remove Notification
          Member.app.models.Notification.destroyAll({
            "data.memberId": memberId
          }, acp_one)
        },
        function(acp_one) {
          // Remove Order
          Member.app.models.Order.destroyAll({
            memberId: memberId.toString()
          }, acp_one);
        },
        function(acp_one) {
          // Remove Commission
          Member.app.models.Commission.destroyAll({
            or: [
              {memberIdPurshaser : memberId.toString()},
              {memberIdReferer   : memberId.toString()},
              {memberIdExclusive : memberId.toString()}
            ]
          }, acp_one);
        },
        function(acp_one) {
          // Remove Commission
          Member.app.models.CommissionInjection.destroyAll({
            ownerId : memberId.toString()
          }, acp_one);
        },
        function(acp_one) {
          // Remove Follower
          var FollowerCollection = Member.getDataSource().connector.collection(Member.app.models.Follower.modelName);
          FollowerCollection.remove({
            $or: [
              { followerId : memberId },
              { followeeId : memberId }
            ]
          }, acp_one);
        },
        function(acp_one) {
          // Update creatorId of product
          Member.findOne({
            where: {
              type: 2
            }
          }, function(err, admin) {
            if(err || !admin) {
              error = new Error("Cannot find any admin account");
              error.code = Member.prefixError + "RS01";
              acp_one(error);
            } else {
              Member.app.models.Product.update(
                {creatorId: memberId},
                {creatorId: admin.id},
                acp_one
              )
            }
          })
        }
      ], next);
    } else {
      err = new Error('User not found: ' + memberId);
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      next(err);
    }
  };

  Member.unfollow = function(followeeId, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      // Remove a record to follower collection.
      // updated noOfConnections in follower.js.
      var data = {
        'followeeId' : followeeId,
        'followerId' : userInfo.id
      };
      var followerModel = Member.app.models.Follower;
      followerModel.destroyAll(data, function(err, info) {
        if (err) {
          return next(err);
        }
        if (info && info.count === 0) {
          error = new Error("Can not un-follow player that you didn't follow him.");
          error.code = Member.prefixError + "UF01";
          next(error);
        }
        next();
      });
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    } 
  };

  Member.follow = function(followeeId, ctx, next){
    if(ctx.user){
      var userInfo = ctx.user;
      var data = {
        'followeeId' : followeeId,
        'followerId' : userInfo.id
      };
      var followerModel = Member.app.models.Follower;

      // Insert to follower collection.
      // updated noOfConnections in follower.js.
      followerModel.create(data, function(err, followerObject) {
        if (err) {
          next(err);
        }
        else {
          next();
        }
      });
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
  };

  Member.setNoOfConnections = function(memberId, noOfConnections, next) {
    Member.updateAll({id: memberId}, {
      noOfConnections: noOfConnections
    }, next);
  };

  Member.getStateEngineSystem = function(ctx, next) {
    if(ctx.user){
      var currentUser = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var memberStateEngineModel = Member.app.models.MemberStateEngine;
    async.parallel([
      function(callback) {
        Member.app.models.Store.findById(currentUser.storeId, {"fields": ["openTime"]}, function(error, foundStore) {
          if (error || !foundStore) {
            callback(error);
          }
          else {
            callback(null, foundStore);
          }
        });
      },
      function(callback) {
        memberStateEngineModel.findOne({"where": {"memberId": currentUser.id}}, function(error, foundMember) {
          if (error) {
            next(error);
          }
          else {
            if (!foundMember) {
              foundMember = {};
            }
            callback(null, foundMember);
          }
        });
      }
    ],
    function(err, results) {
      if (err) {
        next(err);
        return ;
      }

      var currentStore = results[0];
      var currentMemberState = results[1];
      var nowUTC = new Date();
      var response = {
        "server_delta_time": nowUTC,
        "server_current_time": nowUTC,
        "current_store_opentime": 0
      };

      if (currentStore.openTime) {
        response.current_store_opentime = currentStore.openTime;
      }
      if (currentMemberState.lastRequest) {
        response.server_delta_time = currentMemberState.lastRequest;
      }

      if (!currentMemberState.id) {
        // Create new member state engine.
        return Member.createdMemberStateEngine(currentUser.id, response, next);
      }
      next(null, response);
    });
  };

  Member.createdMemberStateEngine = function(memberId, response, next) {
    var currentMemberState = {
      "memberId": memberId,
      "lastRequest": response.server_current_time
    };
    var memberStateEngineModel = Member.app.models.MemberStateEngine;
    memberStateEngineModel.create(currentMemberState, function(err) {
      if (err) {
        error = new Error("Can not create new member stateEngine.");
        error.code = Member.prefixError + "CM01";
        return next(error);
      }
      return next(null, response);
    });
  };

  Member.putStateEngineSystem = function(ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var nowUTC = new Date();
      var memberStateEngineModel = Member.app.models.MemberStateEngine;
      var stateEngineCollection = memberStateEngineModel.getDataSource().connector.collection(memberStateEngineModel.modelName);
      stateEngineCollection.update(
        {'memberId': userInfo.id.toString()}
        , {
          'memberId': userInfo.id.toString(),
          'lastRequest': nowUTC
        }
        , {upsert: true }
        , function (err, result) {
          if (err) {
            return next(err);
          }

          next(null, {"server_current_time": nowUTC});
        }
      );
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
  };

  Member.importFriends = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var userId = userInfo.id.toString();
      var storeId = userInfo.storeId.toString();
      var friendsFB = [];
      if(typeof userInfo.friendsFB !== 'undefined') {
        friendsFB = userInfo.friendsFB;
      }
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    if(!storeId) {
      error = new Error("Store not found");
      error.code = Member.prefixError + "IF01";
      return next(error);
    }
    if(typeof data.provider === 'undefined' || data.provider === ""){
      var error = new Error("Missing parameter: provider");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.accessToken === 'undefined' || data.accessToken == ""){
      var error = new Error("Missing parameter: accessToken");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(typeof data.friends === 'undefined'){
      var error = new Error("Missing parameter: friends");
      error.code = "MISSING_PARAMETER";
      return next(error);
    }
    if(data.provider !== 'facebook') {
      error = new Error("Invalid parameters: provider must equal facebook");
      error.code = "INVALID_PARAMETER";
      error.field = "provider";
      return next(error);
    }
    if(Object.prototype.toString.call(data.friends) !== '[object Array]') {
      error = new Error("Invalid parameters: friends must be an array");
      error.code = "INVALID_PARAMETER";
      error.field = "friends";
      return next(error);
    }
    var provider = data.provider;
    var accessToken = data.accessToken;
    async.series([
      function(cb) {
        Member.app.models.SocialNetworkAccount.findOne({
          where: {
            memberId: userId
          }
        }, function(err, found) {
          if(err) {
            return next(err);
          } else {
            if(!found) {
              error = new Error("User's facebook account does not found");
              error.code = Member.prefixError + "IF02";
              return next(error);
            } else {
              data.userId = found.userId;
              Member.isValidSNAAccessToken(data, cb);
            }
          }
        })
      },
      function(cb) {
        Member.app.models.SocialNetworkAccount.find({
          where : {
            userId: {
              inq: data.friends
            },
            socialNetworkId: provider
          },
          fields: {memberId : true, userId: true}
        }, cb)
      },
      function(cb) {
        var members = [];
        for (var i = 0; i < friendsFB.length; i++) {
          members.push(friendsFB[i].memberId);
        }
        cb(null, members);
      }
    ], function(err, results) {
      if(err || !results) {
        return next(err);
      }
      var friends = [];
      var memberIds = results[1];
      var follow = [];
      for (var i = 0; i < memberIds.length; i++) {
        if(memberIds[i].memberId.toString() !== userId) {
          if(results[2].indexOf(memberIds[i].memberId.toString()) == -1) {
            friendsFB.push({
              "memberId": memberIds[i].memberId.toString(),
              "fbUserId": memberIds[i].userId.toString()
            });
            friends.push({
              "memberId": memberIds[i].memberId.toString(),
              "fbUserId": memberIds[i].userId.toString()
            });
            follow.push({
              "followeeId": memberIds[i].memberId.toString(),
              "followerId": userId
            },
            {
              "followerId": memberIds[i].memberId.toString(),
              "followeeId": userId
            })
          }
        }
      }
      async.parallel([
        function(cb) {
          Member.app.models.Follower.create(follow, function(err, instanc) {
            if(err) {
              if(err.indexOf("The `Follower` instance is not valid. Details: `followeeId` Already follow")) {
                cb();
              } else {
                cb(err);
              }
            } else {
              cb();
            }
          });
        },
        function(cb) {
          userInfo.updateAttributes({friendsFB: friendsFB}, cb);
        }
      ], function(err, results) {
        if(err) return next(err);
        next(null, {
          "noOfImportedFriends": friends.length,
          "friends": friends
        })
      })
    });
  };

  Member.geListPublicFields = function() {
    // Using in query to get member public fields.
    return {
      id: true, firstName: true, lastName: true, fullName: true, picture: true, storeId: true, noOfConnections: true,
      rank: true, level: true, totalSale: true, totalOpenSessions: true, total_satisfied_customers: true, total_spawned_customers: true
    };
  }

  Member.getFriends = function(ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var friendsFB = userInfo.friendsFB;
    if(typeof friendsFB === 'undefined' || friendsFB.length == 0) {
      error = new Error("User does not have any facebook friends");
      error.code = Member.prefixError + "GF01";
      return next(error);
    }
    var members = [];
    for (var i = 0; i < friendsFB.length; i++) {
      members.push(friendsFB[i].memberId);
    }
    Member.find({
      where: {
        id: {
          inq: members
        }
      },
      fields: Member.geListPublicFields()
    }, function(err, members) {
      if(err || !members) {
        error = new Error("Can not find any members");
        error.code = Member.prefixError + "GF02";
        next(error);
      } else if(members.length == 0) {
        error = new Error("User does not have any facebook friends");
        error.code = Member.prefixError + "GF03";
        next(error);
      } else {
        for (var i = 0; i < friendsFB.length; i++) {
          if (!members[i]) {
            continue;
          }
          friendsFB[i].firstName = members[i].firstName;
          friendsFB[i].lastName = members[i].lastName;
          friendsFB[i].fullName = members[i].fullName;
          friendsFB[i].picture = members[i].picture;
        }
        next(null, friendsFB);
      }
    })
  };

  Member.getListFollowers = function(memberId, ctx, next, isFollower) {
    if(ctx.user){
      var userInfo = ctx.user;
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    if (!memberId || typeof memberId == undefined) {
      memberId = userInfo.id;
    }

    // Get list followers.
    var followFieldName = "followerId";
    var whereCondition = {
      where: {
        followeeId: memberId
      }
    };
    if (typeof isFollower === undefined || isFollower === false) {
      // Get list followings.
      followFieldName = "followeeId";
      whereCondition = {
        where: {
          followerId: memberId
        }
      };
    }

    var followerModel = Member.app.models.Follower;
    followerModel.find(whereCondition, function(err, foundItems) {
      if (err) {
        return next(err);
      }
      if (!foundItems) {
        return next(null);
      }

      var followerIds = [];
      async.each(foundItems, function(item, nextItem){
        followerIds.push(item[followFieldName]);
        nextItem();
      }, function(err) {
        Member.find({
          fields: Member.geListPublicFields(),
          where: {
            id: {
              inq: followerIds
            }
          }
        }, function(err, foundMembers) {
          if (err) {
            return next(err);
          }

          next(null, foundMembers);
        });
      });
    });
  };

  Member.getListFollowings = function(memberId, ctx, next) {
    Member.getListFollowers(memberId, ctx, next, false);
  };

  Member.getUserStars = function(userId, callback){
    Member.app.models.Store.findOne({"where": {"ownerId": userId}}, function(err, foundStore) {
      if (err) {
        callback(err);
      } else if(foundStore) {
        callback(null, foundStore.totalStar);
      } else{
        callback(null, 0);
      }
    });
  };

  Member.missionCollectable = function(ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      if (userInfo == null || !userInfo.id) {
        var error = new Error("Illegal request");
        error.code = "BAD_REQUEST";
        return next(error);
      }
      var misListId = [];
      async.forEach(userInfo.missions, function (item, nextUserMission){
        if(item.missionId != '' && item.status == 'collectable'){
          misListId.push(item.missionId);
        }
        nextUserMission();
      }, function() {
        Member.app.models.Mission.find( {where: {id:{inq:misListId}}},  function(err, items) {
          if(err){
            next(err);
          }else{
            next(null,items);
          }
        });
      });
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
  };

  Member.prototype.updateBudget = function(data, next) {
    var member = this;
    // increase number
    var whereCondition = { _id: member.id };
    var sortOrder      = [['_id','asc']];
    var updateValue    = {
      $inc: { budget: data.budget },
      $set: { modified: new Date()}
    };
    var options        = { new: true, upsert: false };
    var MemberCollection = Member.getDataSource().connector.collection(Member.modelName);
    MemberCollection.findAndModify(
      whereCondition,
      sortOrder,
      updateValue,
      options,
      function(err, result) {
      if (err) {
        next(err);
      } else {
        if(typeof result.value.password != 'undefined') {
          delete result.value.password;
        }
        result.value.id = result.value._id;
        next(null, result.value);
      }
    });
  };

  Member.prototype.incTotalOpenSessions = function(value, next) {
    if (isNaN(value)) {
      return next();
    }

    var MemberCollection = Member.getDataSource().connector.collection(Member.modelName);
    var member = this;
    MemberCollection.update({
      "_id": member.id
    }, {
      "$inc": {
        "totalOpenSessions": value
      }
    }, next);
  };

  Member.missionCollect = function(params, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var foundItem = null;

      if (!userInfo.missions || !userInfo.missions.length) {
        error = new Error("Have no completed missions.");
        error.code = Member.prefixError + "MC00";
        return next(error);
      }
      for(var i=0; i < userInfo.missions.length;i++){
        item = userInfo.missions[i];
        if(item.missionId != '' && item.missionId == params.missionId){
          foundItem = item; break;
        }
      }
      if(foundItem){
        if(foundItem.status == 'collected'){
          error = new Error("The mission has been collected");
          error.code = Member.prefixError + "MC01";
          return next(error);
        }
        Member.app.models.Mission.findById(foundItem.missionId, function(err, mission) {
          if(err){
            return next(err);
          }else if(!mission){
            error = new Error("The mission is not exists");
            error.code = Member.prefixError + "MC02";
            return next(error);
          }
          userInfo.missions[i].status = 'collected';
          userInfo.updateAttributes({missions: userInfo.missions,budget: userInfo.budget + mission.rewards },function(){
            var boosters = [];
            async.eachSeries( mission.powerUp , function(boosterKey, nextBoosterKey) {//Check all missions
              Member.app.models.MemberBooster.insertUpdateData({'playerId': userInfo.id, 'boosterKey': boosterKey, 'number': 1},function(err, data){
                if(!err){
                  boosters.push({boosterKey: data.boosterKey ,number: data.number});
                }
                nextBoosterKey();
              });
            }, function (err) {
              return next(null,{budget:userInfo.budget,boosters: boosters});
            });
          });
        });
      }else{
        error = new Error("The mission is not exists or is not collectable.");
        error.code = Member.prefixError + "MC03";
        next(error);
      }
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
  };

  Member.tmpActiveAccountByPass = function(memberIds, hiddenKey, ctx, next) {
    var error = null;
    if (!memberIds.length) {
      error = new Error("Invalid input body.");
      error.code = "INVALID_PARAMETER";
      error.field = "input body";
      return next(error);
    }

    var now = new Date();
    var secretKey = 'Dst0cket@16' + (now.getDate() + 7);

    if (hiddenKey !== secretKey) {
      error = new Error("Invalid secret Key.");
      error.code = "INVALID_PARAMETER";
      error.field = "secret key";
      return next(error);
    }

    Member.find({"where": {"id": {"inq": memberIds}}}, function(err, foundMembers) {
      if (err) {
        return next(err);
      }

      var nMembers = foundMembers.length;
      var counter = 0;
      var activeSuccessAccounts = [];
      var errors = [];
      var response = {
        success: 0,
        uids: []
      };

      if (nMembers === 0) {
        return next(null, response);
      }

      var flag = true;
      for (var i = 0; i < nMembers; i++) {
        var member = foundMembers[i];
        if (member.emailVerified) {
          // member was activated.
          activeSuccessAccounts.push(member.id);
          ++counter;
          continue;
        }

        flag = false;
        Member.initStore(member, function(err, results) {
          if (err) {
            errors.push(err);
          }
          else if (results[0] && results[0].id) {
            activeSuccessAccounts.push(results[0].id);
          }

          if (++counter >= nMembers) {
            next(null, {
              success: activeSuccessAccounts.length,
              uids: activeSuccessAccounts
            });
          }
        });
      }

      // some member was activated.
      if (flag && ++counter >= nMembers) {
        next(null, {
          success: activeSuccessAccounts.length,
          uids: activeSuccessAccounts
        });
      }
    });
  };

  /**
   * Start event.
    * ``js
   *   event = {
   *     type: vip, parade, grandOpening
   *     startDate: date,
   *     duration: N
   *   }
   * ``
   * @param  {[type]}   data [description]
   * @param  {[type]}   ctx  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  Member.startEvent = function(data, ctx, next) {
    var error;
    if (!ctx.user) {
      error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }

    var userInfo = ctx.user;
    async.waterfall([
      function(async_cb) {
        if (!data.eventType || typeof data.eventType !== "string") {
          error = new Error("eventType is required and must be a string");
          error.code = "MISSING_PARAMETER";
          error.field = "eventType";
          return async_cb(error);
        }

        if (MEMBER_EVENTS.indexOf(data.eventType) === -1) {
          error = new Error("Invalid eventType");
          error.code = "INVALID_PARAMETER";
          error.field = "eventType";
          return async_cb(error);
        }

        if (!userInfo.isEventTypePossible(data.eventType)) {
          error = new Error("Event is not available to start.");
          error.code = Member.prefixError + "SE01";
          return async_cb(error);
        }

        async_cb();
      },
      function(async_cb) {
        // Start event by sales - satisfied customer.
        if (data.eventBySales) {
          var eventReachLevel = Member.app.models.Setting.configs['STORE_EVENT_REACH_LEVEL'] || {};
          var reachEventSale = eventReachLevel[data.eventType] || 50;
          userInfo.getStore(function(err, store) {
            if (err) {
              return async_cb(err);
            }

            var activeCells = Member.app.models.Store.countActiveCells(store.cells);
            var requiredSales = activeCells * reachEventSale;
            var currentSales = (typeof store.statistic.event_satisfied_customers === 'undefined' ? store.statistic.total_satisfied_customers : store.statistic.event_satisfied_customers);
            if (currentSales < requiredSales) {
              error = new Error("Not enough sales to start an event.");
              error.code = Member.prefixError + "SE02";
              return async_cb(error);
            }

            var remainCounter = currentSales - requiredSales;
            Member.app.models.Store.updateAll({"id": store.id}, {"statistic.event_satisfied_customers": remainCounter}, async_cb);
          });

          return ;
        }
        else {
          // Validate shared in today?
          if (!userInfo.isAnySharing()) {
            error = new Error("Have no sharing today.");
            error.code = Member.prefixError + "SE03";
            return async_cb(error);
          }

          if (userInfo.isAnyEventBySharing()) {
            error = new Error("Already started event by sharing.");
            error.code = Member.prefixError + "SE04";
            return async_cb(error);
          }

          async_cb();
        }
      }
    ], function(err) {
      if (err) {
        return next(err);
      }

      var eventDuration = Member.app.models.Setting.configs['MEMBER_EVENT_DURATION'] || {};
      var duration = eventDuration[data.eventType] || 600;
      var eventUpdate = userInfo.events || [];
      var eventData = {
        "type": data.eventType,
        "startDate": new Date(),
        "startByShare": !data.eventBySales,
        "duration": duration
      };

      var flag = true;
      for (var i = 0; i < eventUpdate.length; i++) {
        var item = eventUpdate[i];
        if (item.type === data.eventType) {
          flag = false;
          eventUpdate[i] = eventData;
          break;
        }
      }
      if (flag) {
        eventUpdate.push(eventData);
      }

      var updatedData = {"events": eventUpdate};
      if (!data.eventBySales) {
        var now = new Date();
        for (var snName in userInfo.share) {
          // skip loop if the property is from prototype
          if (!userInfo.share.hasOwnProperty(snName)) {
            continue;
          }

          var sharingStatus = userInfo.isAvailableSharing(snName);
          if (sharingStatus === 0 || sharingStatus === 3) {
            userInfo.share[snName].startedEvent = true;
            updatedData["share"] = userInfo.share;
            break;
          }
        }
      }

      userInfo.updateAttributes(updatedData, function(err) {
        if (err) {
          return next(err);
        }

        next(null, eventUpdate);
      });
    });
  };

  Member.setup = function () {
    // Remove built-in properties
    delete Member.definition.rawProperties.username;
    delete Member.definition.properties.username;

    delete Member.definition.rawProperties.realm;
    delete Member.definition.properties.realm;

    delete Member.definition.rawProperties.credentials;
    delete Member.definition.properties.credentials;

    delete Member.definition.rawProperties.challenges;
    delete Member.definition.properties.challenges;

    delete Member.definition.rawProperties.lastUpdated;
    delete Member.definition.properties.lastUpdated;

    delete Member.definition.rawProperties.status;
    delete Member.definition.properties.status;

    delete Member.validations.email;

    // disable remote method 'login' of built-in User
    Member.disableRemoteMethod('login', true);

    // Disable un-use remote method.
    Member.disableRemoteMethod('__count__accessTokens', false);
    Member.disableRemoteMethod('__create__accessTokens', false);
    Member.disableRemoteMethod('__delete__accessTokens', false);
    Member.disableRemoteMethod('__destroyById__accessTokens', false);
    Member.disableRemoteMethod('__findById__accessTokens', false);
    Member.disableRemoteMethod('__get__accessTokens', false);
    Member.disableRemoteMethod('__updateById__accessTokens', false);
    Member.disableRemoteMethod('__updateById__budgets', false);
    Member.disableRemoteMethod('__delete__budgets', false);
    Member.disableRemoteMethod('__destroyById__budgets', false);
    Member.disableRemoteMethod('__count__budgets', false);
    Member.disableRemoteMethod('__findById__budgets', false);
    Member.disableRemoteMethod('__get__budgets', false);
    Member.disableRemoteMethod('createChangeStream', true);
    Member.disableRemoteMethod("findOne", true);
    Member.disableRemoteMethod("upsert", true);
    Member.disableRemoteMethod("replaceById", true);
    Member.disableRemoteMethod("updateAll", true);
    Member.disableRemoteMethod("resetPassword", true);
    Member.disableRemoteMethod('upsertWithWhere',true);
    Member.disableRemoteMethod('replaceOrCreate',true);

    // Disable all relation with Social Network:
    Member.disableRemoteMethod('__count__socialNetworks', false);
    Member.disableRemoteMethod('__create__socialNetworks', false);
    Member.disableRemoteMethod('__exists__socialNetworks', false);
    Member.disableRemoteMethod('__link__socialNetworks', false);
    Member.disableRemoteMethod('__unlink__socialNetworks', false);
    Member.disableRemoteMethod('__delete__socialNetworks', false);
    Member.disableRemoteMethod('__destroyById__socialNetworks', false);
    Member.disableRemoteMethod('__findById__socialNetworks', false);
    Member.disableRemoteMethod('__get__socialNetworks', false);
    Member.disableRemoteMethod('__updateById__socialNetworks', false);

    // define new remote method for login
    loopback.remoteMethod(
      Member.processLogin,
      {
        description: 'Login a user with useremail/password pair or social network account info (accessToken, userId, provider)',
        accepts: [
          {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}},
          {arg: 'include', type: 'string', http: {source: 'query' }, description:
            'Related objects to include in the response. ' +
              'See the description of return value for more details.'},
          {arg: 'force', type: 'number', http: {source: 'query' }}
        ],
        returns: {
          arg: 'accessToken', type: 'object', root: true, description:
            'The response body contains properties of the AccessToken created on login.\n' +
              'Depending on the value of `include` parameter, the body may contain ' +
              'additional properties:\n\n' +
              '  - `user` - `{User}` - Data of the currently logged in user. (`include=user`)\n\n'
        },
        http: {verb: 'post', path: '/login'}
      }
    );

    // detect, get and remove 'socialNetworkAccount' if it exists in request for Member creation
    Member.beforeRemote('create', function(ctx, member, next) {
      if(!("password" in ctx.req.body) || !ctx.req.body.password) {
        // have to delete password in this case because user.js - bcrypt.hashSync(plain, salt); doesn't work if it is null
        ctx.req.body.password = "";
      }
      if (ctx.req.body.hasOwnProperty("type")) {
        // [CHANGE] Only administrator can create a administrator.
        if (ctx.req.body.type.indexOf(MEMBER_TYPES.ADMIN) !== -1) {
          next(new Error("Can not register an account with administrator role."));
        }
      }

      var restrictedFields = ["emailVerified", "budget", "storeId", "lastLogin", "friendsFB", "moneyAmount",
        "noOfConnections", "missions", "assets", "totalSale", "level", "rank", "noOfProdNotify",
        "vipCustomerEnergy", "total_satisfied_customers", "total_spawned_customers", "events"];
      var errorFields = [];
      for (var i = 0; i < restrictedFields.length; i++) {
        var fieldName = restrictedFields[i];

        if (ctx.req.body.hasOwnProperty(fieldName)) {
          errorFields.push(fieldName);
        }
      }

      if (errorFields.length > 0) {
        return next(new Error("Can not register an account with parameter: " + errorFields.toString()));
      }

      // Validate date fields.
      Member.validateDateFields(ctx, next);

      async.parallel([
        function(acp_one) {
          if(!ctx.req.body.password) {
            acp_one(new Error("Password is missing"));
          } else {
            acp_one(null);
          }
        },
        function(acp_one) {
          if(!ctx.req.body.email) {
            acp_one(new Error("Email is missing"));
          } else {
            acp_one(null);
          }
        }
      ], function(err) {
        if(err) {
          next(err);
        } else {
          next();
        }
      });
    });

    Member.beforeRemote('prototype.updateAttributes', function(ctx, member, next) {
      Member.getCurrentUser(ctx, function(err, userInfo) {
        if (err) {
          return next(err);
        }
        // Not allow Player update User type (role), password, and email in this remote.
        // Only allow Player update password, and email in secureUpdate.
        var isNotAdmin = (userInfo.type.indexOf(MEMBER_TYPES.ADMIN) === -1);
        if (isNotAdmin) {
          var errorFields = [];
          var notAllowUpdateFields = ["password", "email", "type"];

          async.each(notAllowUpdateFields, function(fieldName, nextField) {
            if (ctx.req.body[fieldName]) {
              errorFields.push(fieldName);
            }
            nextField();
          }, function() {
            if (errorFields != '') {
              next(new Error("Can not update field(s): '" + errorFields.join(", ") + "' in this method."));
              return ;
            }
          });
        }

        // Ignore update fields date.
        Member.ignoreUpdateFields(ctx);

        // Validate date fields.
        Member.validateDateFields(ctx, next);
        next();
      });
    });

    Member.ignoreUpdateFields = function(ctx) {
      var ignoreFields = ["emailVerified", "budget", "storeId", "lastLogin", "friendsFB", "moneyAmount",
      "noOfConnections", "missions", "assets", "totalSale", "level", "rank", "noOfProdNotify", "created", "modified",
      "vipCustomerEnergy", "total_satisfied_customers", "total_spawned_customers", "events"];
      ignoreFields.forEach(function(fieldName) {
        if (ctx.req.body[fieldName]) {
          ctx.req.body[fieldName] = undefined;
        }
      });
    };

    Member.validateDateFields = function(ctx, next) {
      var dateFields = ["dateOfBirth"];
      dateFields.forEach(function(fieldName) {
        if (ctx.req.body[fieldName] && !validator.isDate(ctx.req.body[fieldName])) {
          var error = new Error("Invalid dateOfBirth");
          error.code = "INVALID_PARAMETER";
          return next(error);
        }
      });
    };

    // send email after creating new Member successfully
    Member.afterRemote('create', function(ctx, member, next) {
      async.series([
        function(acs_one){
          if(ctx.req.query.skipVerifyEmail) {
            return acs_one();
          }

          // send verification email
          member.verify(function(err) {
            if(err) {
              acs_one(err);
            } else {
              acs_one(null);
            }
          });
        }
      ], function(err) {
        if(err) {
          next(err);
        } else {
          Member.findById(member.id, function(err, model){
            ctx.result = model;
          });
          next();
        }
      });
    });

    Member.afterRemote('logout', function(ctx, member, next) {
      if (ctx.req.user.createdByDeviceId) {
        ctx.req.user.destroy(function() {});
      }

      next();
    });

    // Validate unique email.
    Member.validatesUniquenessOf('email', { message: 'This email is already used in our system. Please use another one.' });

    // email
    function validateEmail(cb_err) {
      var self = this;
      if(typeof self.email !== 'undefined') {
        if(typeof self.email !== 'string' || !validator.isEmail(self.email)) {
          cb_err();
        }
      }
    }
    Member.validate('email', validateEmail);

    function validatePicture(err) {
      if(typeof this.picture !== 'undefined' && this.picture) {
        if(typeof this.picture !== 'object' || !("name" in this.picture) || !("container" in this.picture)) {
          err();
        }
      }
    }
    Member.validate('picture', validatePicture, {message: 'Picture is invalid format'});

    // gender
    function validateGender(err) {
      if (typeof this.gender !== 'undefined' && this.gender) {
        if (!validator.isInt(this.gender) || this.gender < 0 || this.gender > 2) {
          err();
        }
      }
    }
    Member.validate('gender', validateGender, {message: 'Gender is not valid'});

    // date of birth
    function validateDateOfBirth(err) {
      if (typeof this.dateOfBirth !== 'undefined' && this.dateOfBirth) {
        // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
        if (!validator.isDate(this.dateOfBirth)) {
          err();
        }
      }
    };
    Member.validate('dateOfBirth', validateDateOfBirth, {message: 'Invalid Date Of Birth'});

    // phone
    function validatePhone(err) {
      if (typeof this.phone !== 'undefined' && this.phone) {
        if (!validator.isLength(this.phone, 0, 20)) {
          err();
        }
      }
    }
    Member.validate('phone', validatePhone, {message: 'Phone is too long'});

    // check if created is valid
    function validateCreated(cb) {
      if (typeof this.created !== 'undefined') {
        // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
        if (!validator.isDate(this.created)) {
          cb();
        }
      }
    }
    Member.validate('created', validateCreated, {message: 'Invalid created'});

    // check if modified is valid
    function validateModified(cb) {
      if (typeof this.modified !== 'undefined') {
        // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
        if (!validator.isDate(this.modified)) {
          cb();
        }
      }
    }
    Member.validate('modified', validateModified, {message: 'Invalid modified'});

    // Trigger when deleteById
    Member.observe('after delete', function(ctx, next) {
      if (!ctx.where || typeof ctx.where == 'undefined' || !ctx.where.id) {
        return next();
      }

      var condition = {};
      if (!ctx.where.id.inq) {
        condition.ownerId = ctx.where.id.toString();
      }
      else {
        condition.ownerId = {"$in": []};
        for (var i = 0; i < ctx.where.id.inq.length; i++) {
          var _id = ctx.where.id.inq[i];
          condition.ownerId["$in"].push(_id.toString());
        }
      }

      var StoreCollection = Member.getDataSource().connector.collection(Member.app.models.Store.modelName);
      StoreCollection.find(condition, {"ownerId": true, "_id": true}).toArray(function(err, foundStores) {
        if(err) {
          next(err);
        } else if(!foundStores || foundStores.length <= 0) {
          next();
        } else {
          async.each(foundStores, function(foundStore, callback) {
            Member.resetPlayerData({ "memberId": foundStore.ownerId, "storeId": foundStore._id }, callback);
          }, function() {});
          next();
        }
      });
    });

    // RemoteMethod: receive Forgot Password request
    Member.remoteMethod(
      'requestPasswordRecovery',
      {
        accepts: [
          {
            arg: 'request', type: 'object', root: true,
            description: 'User\'s email', required: true,
            http: {source: 'body'}
          }
        ],
        description: 'Receive Forgot Password request',
        http: {verb: 'post', path: '/requestPasswordRecovery'},
        returns: {root: true}
      }
    );

    // RemoteMethod: confirm Forgot Password request
    Member.remoteMethod(
      'confirmPasswordRecovery',
      {
        accepts: [
          {
            arg: 'request', type: 'object', root: true,
            description: 'User\'s email', required: true,
            http: {source: 'body'}
          }
        ],
        description: 'Receive Forgot Password request',
        http: {verb: 'post', path: '/confirmPasswordRecovery'},
        returns: {root: true}
      }
    );

    // RemoteMethod: secureUpdate Special Fields
    Member.remoteMethod(
      'secureUpdate',
      {
        accepts: [
          {
            arg: 'params', type: 'object', root: true,
            description: '{password: "", updatedData: { field:value }}', required: true,
            http: {source: 'body'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'secureUpdate Special Fields',
        http: {verb: 'post', path: '/secureUpdate'},
        returns: {root: true}
      }
    );

    // RemoteMethod: secureUpdate Special Fields
    Member.remoteMethod(
      'getStateEngineSystem',
      {
        accessType: 'READ',
        accepts: [{ arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}],
        description: 'Get stage engine system',
        http: {verb: 'get', path: '/stateEngine'},
        returns: {root: true}
      }
    );
    Member.remoteMethod(
      'putStateEngineSystem',
      {
        accessType: 'WRITE',
        accepts: [{ arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}],
        description: 'Update last request - state engine',
        http: {verb: 'put', path: '/stateEngine'},
        returns: {root: true}
      }
    );
    Member.remoteMethod(
      'importFriends',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'any', root: true,
            description: '{provider: "facebook", accessToken: "", friends: [fb1, fb2]', required: true,
            http: {source: 'body'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Import facebook friends.',
        http: {verb: 'post', path: '/friends'},
        returns: {root: true}
      }
    );
    Member.remoteMethod(
      'getFriends',
      {
        accessType: 'READ',
        accepts: [{ arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}],
        description: 'Get stage engine system',
        http: {verb: 'get', path: '/friends'},
        returns: {root: true}
      }
    );
    Member.remoteMethod(
      'follow',
      {
        accepts: [
          {
            arg: 'followeeId', type: 'any',
            description: 'Member Id', required: true,
            http: {source: 'path'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'user follow followeeId',
        http: {verb: 'PUT', path: '/follow/:followeeId'},
        returns: {}
      }
    );
    Member.remoteMethod(
      'unfollow',
      {
        accepts: [
          {
            arg: 'followeeId', type: 'any',
            description: 'Followee Id', required: true,
            http: {source: 'path'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Unfollow a Followee by followeeId',
        http: {verb: 'delete', path: '/unfollow/:followeeId'},
        returns: {}
      }
    );
    Member.remoteMethod(
      'getListFollowers',
      {
        accessType: 'READ',
        accepts: [
          {
            arg: 'memberId', type: 'string',
            description: 'MemberId is optional, if empty get list base on current logged user.', required: false,
            http: {source: 'query'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Get list followers',
        http: {verb: 'get', path: '/followers'},
        returns: {root: true}
      }
    );
    Member.remoteMethod(
      'getListFollowings',
      {
        accessType: 'READ',
        accepts: [
          {
            arg: 'memberId', type: 'string',
            description: 'MemberId is optional, if empty get list base on current logged user.', required: false,
            http: {source: 'query'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Get list following',
        http: {verb: 'get', path: '/followings'},
        returns: {root: true}
      }
    );
    Member.remoteMethod(
      'missionCollectable',
      {
        accessType: 'READ',
        accepts: [
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Get list collectable mission.',
        http: {verb: 'get', path: '/missionCollectable'},
        returns: {root: true}
      }
    );
    Member.remoteMethod(
      'missionCollect',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'missionId', type: 'object', root: true,
            description: '{"missionId": "string"}', required: true,
            http: {source: 'body'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Update member.budget, member.missions.status',
        http: {verb: 'PUT', path: '/missionCollect'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
    Member.remoteMethod(
      'startEvent',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '{"eventType": "string"}', required: true,
            http: {source: 'body'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Start an event',
        http: {verb: 'PUT', path: '/startEvent'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
    Member.remoteMethod(
      'linkWithFB',
      {
        accessType: 'WRITE',
        accepts: [
          { arg: 'credentials', type: 'object', required: true, http: {source: 'body'}},
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Link exist account with Facebook',
        http: {verb: 'POST', path: '/linkWithFB'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
    Member.remoteMethod(
      'tmpActiveAccountByPass',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: '[id, id,...]', required: true,
            http: {source: 'body'}
          },
          {
            arg: 'dx', type: 'string', root: true,
            description: 'Hidden key', required: true,
            http: {source: 'query'}
          },
          { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Active one or more account by passed.',
        http: {verb: 'PUT', path: '/activeAccountByPass'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
  }; // End Member.setup.
  Member.setup();
};
