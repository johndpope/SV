var async = require('async'),
    _ = require('underscore'),
    validator = require('validator');
    require('date-utils');

BOOSTER_REQUEST_NEW = 'new';
BOOSTER_REQUEST_DONE = 'done';
BOOSTER_REQUEST_STATUS = [BOOSTER_REQUEST_NEW, BOOSTER_REQUEST_DONE];
HTTP_REDIRECT_CODE = 302;

module.exports = function(BoosterRequest) {
  BoosterRequest.prefixError = 'BRT_';
  // Workaround for https://github.com/strongloop/loopback/issues/292
  BoosterRequest.definition.rawProperties.created.default =
    BoosterRequest.definition.properties.created.default = function() {
    return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  BoosterRequest.definition.rawProperties.modified.default =
    BoosterRequest.definition.properties.modified.default = function() {
    return new Date();
  };

  BoosterRequest.beforeRemote("**", function(ctx, ints, next) {
    BoosterRequest.app.models.Member.getCurrentUser(ctx, function(err, userInfo) {
      if (err) {
        return next(err);
      }

      next();
    });
  });

  BoosterRequest.observe('before save', function(ctx, next) {
    if (ctx.currentInstance) {
      ctx.currentInstance.modified = new Date();
    }
    next();
  });

  BoosterRequest.createMultiple = function(data, ctx, next) {
    if(ctx.user){
      var userInfo = ctx.user;
      var storeId = userInfo.storeId.toString();
    } else {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    if(typeof data == 'object') {
      var missing = [];
      if(typeof data.requestTos == 'undefined') {
        missing.push("requestTos");
      }
      if (missing.length) {
        err = new Error('Missing information: ' + missing.join(' '));
        err.statusCode = 400;
        err.code = 'MISSING_PARAMETER';
        next(err);
      } else {
        if(!_.isArray(data.requestTos)) {
          error = new Error("Invalid parameters: requestTos must be an array");
          error.code = "INVALID_PARAMETER";
          error.field = "requestTos";
          return next(error);
        }
        var Member = BoosterRequest.app.models.Member;
        var Booster = BoosterRequest.app.models.Booster;
        var toPlayerIds = data.requestTos;
        if(typeof toPlayerIds === 'string') {
          toPlayerIds = [toPlayerIds];
        }
        async.series([
          function(ass_1) {
            if(validator.isIn(userInfo.id.toString(), toPlayerIds)) {
              var error = new Error("Invalid parameters: requestTos should not contain logged user");
              error.code = "INVALID_PARAMETER";
              error.field = "requestTos";
              ass_1(error);
            } else {
              ass_1(null, userInfo);
            }
          },
          function(ass_1) {
            Member.find({
              where: {
                id: {
                  inq: toPlayerIds
                }
              }
            }, function(err, foundMembers) {
              if(err) {
                ass_1(err);
              } else if(!foundMembers || foundMembers.length === 0) {
                var error = new Error("Invalid parameters: requestTos");
                error.code = "INVALID_PARAMETER";
                error.field = "requestTos";
                ass_1(error);
              } else {
                ass_1(null, foundMembers);
              }
            });
          },
          function(ass_1) {
            // Validate boosterKey
            Booster.findOne({
              where: {
                key: data.boosterKey
              }
            }, function(err, foundBooster) {
              if(err) {
                ass_1(err);
              } else if(!foundBooster) {
                var error = new Error("Invalid parameters: boosterKey");
                error.code = "INVALID_PARAMETER";
                error.field = "boosterKey";
                ass_1(error);
              } else {
                if (!validator.isIn(data.boosterKey, [BOOSTER_STORE_KEY, BOOSTER_HARD_HAT])) {
                  var error = new Error("This booterKey is not allowed to use here");
                  error.code = BoosterRequest.prefixError + "CM01";
                  ass_1(error);
                } else {
                  ass_1(null, foundBooster);
                }
              }
            });
          }
        ], function(err, res) {
          if(err) {
            next(err);
          } else {
            var fromPlayer= res[0];
            var toPlayers = res[1];
            var responses = [];
            var createdBoosterRequestIds = [];
            // Convert to array if we get a string here
            async.each(toPlayers, function(toPlayer, nextToPlayer) {
              BoosterRequest.create({
                from: fromPlayer.id,
                to: toPlayer.id,
                boosterKey: data.boosterKey,
                status: BOOSTER_REQUEST_NEW
              }, function(err, createdBoosterRequest) {
                if(err) {
                  nextToPlayer(err);
                } else if(!createdBoosterRequest) {
                  var error = new Error("Can not create BoosterRequest");
                  error.code = BoosterRequest.prefixError + "CM02";
                  nextToPlayer(error);
                } else {
                  responses.push({
                    to: toPlayer.id,
                    requestUrl: '/BoosterRequests/' + createdBoosterRequest.id
                  });
                  createdBoosterRequestIds.push(createdBoosterRequest.id);
                  nextToPlayer();
                }
              });
            }, function(err) {
              // Some cases invalid we remove all
              if(err || createdBoosterRequestIds.length != toPlayers.length) {
                if(!err) {
                  err = new Error('Invalid creating boosterRequest');
                  err.code = BoosterRequest.prefixError + "CM03";
                }
                BoosterRequest.destroyAll({ id:{ inq: createdBoosterRequestIds } }, function(deletedErr) {
                  if(deletedErr) {
                    next(deletedErr);
                  } else {
                    next(err);
                  }
                });
              } else {
                next(null, responses);
              }
            });
          }
        });
      }
    } else {
      err = new Error('Missing parameter: Data');
      err.statusCode = 400;
      err.code = 'MISSING_PARAMETER';
      next(err);
    }
  };

  BoosterRequest.acceptRequest = function(id, next) {
    if(typeof id !== 'undefined' || !id) {
      var Member = BoosterRequest.app.models.Member;
      var MemberBooster = BoosterRequest.app.models.MemberBooster;
      var Booster = BoosterRequest.app.models.Booster;
      var curBQ  = null;
      async.series([
        function(ass_1) {
          // Validate BoosterRequest is exists or not
          BoosterRequest.findOne({
            where: {
              id: id,
              status: BOOSTER_REQUEST_NEW
            }
          }, function(err, foundBoosterRequest) {
            if(err) {
              ass_1(err);
            } else if(!foundBoosterRequest) {
              var error = new Error('Invalid BoosterRequest');
              error.code = BoosterRequest.prefixError + "AR01";
              ass_1(error);
            } else {
              curBQ = foundBoosterRequest;
              ass_1(null, foundBoosterRequest);
            }
          });
        },
        function(ass_1) {
          // Validate player who accept boosterKey must be logged player
          if(curBQ) {
            Member.findById(curBQ.from, function(err, currentUser) {
              if(err) {
                err.code = BoosterRequest.prefixError + "AR02";
                ass_1(err);
              } else if(!currentUser) {
                error = new Error("Member not found");
                error.code = BoosterRequest.prefixError + "AR03";
                ass_1(error);
              } else {
                ass_1(null, currentUser);
              }
            });
          } else {
            ass_1();
          }
        },
        function(ass_1) {
          // Validate boosterKey
          Booster.findOne({
            where: {
              key: curBQ.boosterKey
            }
          }, function(err, foundBooster) {
            if(err) {
              err.code = BoosterRequest.prefixError + "AR04";
              ass_1(err);
            } else if(!foundBooster) {
              var error = new Error("Invalid boosterKey");
              error.code = BoosterRequest.prefixError + "AR05";
              ass_1(error);
            } else {
              ass_1(null, foundBooster);
            }
          });
        }
      ], function(err, res) {
        if(err) {
          next(BoosterRequest.redirectError(err));
        } else {
          MemberBooster.transferBooster(curBQ.to, curBQ.from, curBQ.boosterKey, 1, function(err, result) {
            if(err) {
              next(BoosterRequest.redirectError(err));
            } else {
              curBQ.__data.status = BOOSTER_REQUEST_DONE;
              curBQ.save({ validate: true }, function(err, savedBQ) {
                if(err) {
                  next(BoosterRequest.redirectError(err));
                } else {
                  next(null, {
                    boosterName: res[2].name,
                    playerName: res[1].getFullName()
                  });
                }
              });
            }
          });
        }
      });
    } else {
      err = new Error('Missing parameter: id');
      err.code = "MISSING_PARAMETER";
      next(BoosterRequest.redirectError(err));
    }
  };

  BoosterRequest.redirectError = function(err) {
    err.statusCode = HTTP_REDIRECT_CODE;
    err.location = BoosterRequest.app.get('publicWebAcceptFailedRedirectURL');
    err.location = err.location.replace('{userdomain}', BoosterRequest.app.get('domainShopping'));
    err.location = err.location.replace('{errorMessage}', err.message);
    return err;
  };

  BoosterRequest.redirectSuccess = function(inst) {
    var redirect = BoosterRequest.app.get('publicWebAcceptSuccessRedirectURL');
    redirect = redirect.replace('{userdomain}', BoosterRequest.app.get('domainShopping'));
    redirect = redirect.replace('{boosterName}', inst.boosterName);
    redirect = redirect.replace('{playerName}', inst.playerName);
    return redirect;
  };

  BoosterRequest.afterRemote('acceptRequest', function(ctx, inst, next) {
    if (!ctx.res) {
      return next(new Error(g.f('The transport does not support HTTP redirects.')));
    }
    ctx.res.location(BoosterRequest.redirectSuccess(inst));
    ctx.res.status(302);
    next();
  });

  BoosterRequest.setup = function() {
    BoosterRequest.disableRemoteMethod('createChangeStream',true);
    BoosterRequest.disableRemoteMethod('upsert',true);
    BoosterRequest.disableRemoteMethod('exists',true);
    //BoosterRequest.disableRemoteMethod('find',true);
    BoosterRequest.disableRemoteMethod('findOne',true);
    BoosterRequest.disableRemoteMethod('update',true);
    BoosterRequest.disableRemoteMethod('updateAll',true);
    //BoosterRequest.disableRemoteMethod('updateAttributes',false);
    //BoosterRequest.disableRemoteMethod('count',true);
    BoosterRequest.disableRemoteMethod('replaceById',true);
    BoosterRequest.disableRemoteMethod('replaceOrCreate',true);
    BoosterRequest.disableRemoteMethod('updateOrCreate',true);
    BoosterRequest.disableRemoteMethod('upsertWithWhere',true);

    // Validate from player
    function validateFrom(cb_err, done) {
      var self = this;
      if(typeof self.from !== 'undefined' && self.from) {
        BoosterRequest.app.models.Member.exists(self.from, function(err, exists) {
          if(err || !exists) {
            cb_err(new Error('Invalid from player: player does not exists'));
          }
          done();
        });
      } else {
        done();
      }
    }
    BoosterRequest.validateAsync('from', validateFrom, {message: 'Invalid from'});

    // Validate to player
    function validateTo(cb_err, done) {
      var self = this;
      if(typeof self.to !== 'undefined' && self.to) {
        BoosterRequest.app.models.Member.exists(self.to, function(err, exists) {
          if(err || !exists) {
            cb_err(new Error('Invalid to player: player does not exists'));
          }
          done();
        });
      } else {
        done();
      }
    }
    BoosterRequest.validateAsync('to', validateTo, {message: 'Invalid to'});

    // Validate to boosterKey
    function validateBoosterKey(cb_err, done) {
      var self = this;
      if(typeof self.boosterKey !== 'undefined' && self.boosterKey) {
        BoosterRequest.app.models.Booster.findOne({
          where: {
            key: self.boosterKey
          }
        }, function(err, foundBooster) {
          if(err || !foundBooster) {
            cb_err(new Error('Invalid boosterKey: boosterKey does not exists'));
          }
          done();
        });
      } else {
        done();
      }
    }
    BoosterRequest.validateAsync('boosterKey', validateBoosterKey, {message: 'Invalid boosterKey'});

    // Validate status
    function validateStatus(cb_err) {
      if (typeof this.status !== 'undefined' && this.status !== null) {
        if (!validator.isIn(this.status, BOOSTER_REQUEST_STATUS)) {
          cb_err();
        }
      }
    }
    BoosterRequest.validate('status', validateStatus, {message: 'Invalid status'});

    // check if created is valid
    function validateCreated(cb_err) {
      if (typeof this.created !== 'undefined') {
        if (!validator.isDate(this.created)) {
          cb_err();
        }
      }
    }
    BoosterRequest.validate('created', validateCreated, {message: 'Invalid created'});

    // check if modified is valid
    function validateModified(cb_err) {
      if (typeof this.modified !== 'undefined') {
        if (!validator.isDate(this.modified)) {
          cb_err();
        }
      }
    }
    BoosterRequest.validate('modified', validateModified, {message: 'Invalid modified'});

    // Request member boosters
    BoosterRequest.remoteMethod(
      'createMultiple',
      {
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'data', type: 'object', root: true,
            description: 'Model instance data', required: true,
            http: {source: 'body'}
          }
          , { arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
        ],
        description: 'Request member boosters.',
        http: {verb: 'POST', path: '/createMultiple'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );

    // Accept member booster request
    BoosterRequest.remoteMethod(
      'acceptRequest',
      {
        accessType: 'WRITE',
        accepts: [
          { arg: 'id', type: 'string', http: {source: 'path'} }
        ],
        description: 'Accept member booster request.',
        http: {verb: 'GET', path: '/:id/accept'},
        returns: {arg: 'data', type: 'object', root: true},
      }
    );
  };

  BoosterRequest.setup();

};