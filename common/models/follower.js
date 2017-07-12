var validator = require('validator')
  , async = require('async');

module.exports = function(Follower) {
  // Workaround for https://github.com/strongloop/loopback/issues/292
  Follower.definition.rawProperties.created.default =
    Follower.definition.properties.created.default = function() {
    return new Date();
  };

  // Get list connections of a member.
  Follower.getListConnections = function(membedId, next) {
    Follower.getNoOfConnections(membedId, false, next);
  };

  Follower.getNoOfConnections = function(membedId, returnCounter, next) {
    Follower.find({
      "where": {"or": [{"followeeId": membedId}, {"followerId": membedId}]}
    }, function(err, foundItems) {
      if (err) {
        next(err);
      }
      else if (!foundItems || foundItems.length == 0) {
        // Default return counter.
        if (typeof returnCounter === 'undefined' || returnCounter) {
          return next(null, 0);
        }

        return next(null, []);
      }
      else {
        var connections = {};
        async.each(foundItems, function(item, nextItem) {
          if (item.followerId.toString() === membedId.toString()) {
            connections[item.followeeId.toString()] = item.followerId;
          }
          else {
            connections[item.followerId.toString()] = item.followeeId;
          }
          nextItem();
        }, function(err) {
          var connectionsList = Object.keys(connections);
          var noOfConnections = connectionsList.length;

          // Default return counter.
          if (typeof returnCounter === 'undefined' || returnCounter) {
            return next(null, noOfConnections);
          }

          return next(null, connectionsList);
        });
      }
    });
  };

  Follower.updateNoOfConnections = function(followeeId, followerId, next) {
    var memberModel = Follower.app.models.Member;
    async.parallel([
      function(callback) {
        Follower.getNoOfConnections(followeeId, true, callback);
      },
      function(callback) {
        Follower.getNoOfConnections(followerId, true,callback);
      }
    ], function(err, results) {
      if (err) {
        return next(err);
      }

      // Update member.
      async.parallel([
        function(callback) {
          memberModel.setNoOfConnections(followeeId, results[0], callback);
        },
        function(callback) {
          memberModel.setNoOfConnections(followerId, results[1], callback);
        }
      ], function(err, res) {
        if (err) {
          return next(err);
        }
        next();
      });
    });
  };

  // Update member.noOfConnections after save and after delete.
  Follower.observe('after save', function(ctx, next) {
    var followeeId = ctx.instance.followeeId;
    var followerId = ctx.instance.followerId;
    Follower.updateNoOfConnections(followeeId, followerId, next);
  });

  // Update member.noOfConnections after save and after delete.
  Follower.observe('after delete', function(ctx, next) {
    var followeeId = ctx.where.followeeId;
    var followerId = ctx.where.followerId;
    Follower.updateNoOfConnections(followeeId, followerId, next);
  });

  // Init model
  Follower.setup = function () {
    // validate on followeeId and followerId pair is unique
    Follower.validatesUniquenessOf('followeeId', { scopedTo: ['followerId'], message: 'Already follow' });

    // check if followeeId is valid
    function validateFolloweeId(cb_err, done) {
      if (typeof this.followeeId !== 'undefined') {
        var self = this;
        Follower.getApp(function(err, app) {
          // check existence by id
          app.models.Member.exists(self.followeeId, function(err, isExist) {
            if (!isExist || err) {
              cb_err();
            } else if(self.followerId.toString() == self.followeeId.toString()) {
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
    Follower.validateAsync('followeeId', validateFolloweeId, {message: 'Invalid followeeId'});

    // check if followerId is valid
    function validateFollowerId(cb_err, done) {
      if (typeof this.followerId !== 'undefined') {
        var self = this;
        Follower.getApp(function(err, app) {
          // check existence by id
          app.models.Member.exists(self.followerId, function(err, isExist) {
            if (!isExist || err) {
              cb_err();
            } else if(self.followerId.toString() == self.followeeId.toString()) {
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
    Follower.validateAsync('followerId', validateFollowerId, {message: 'Invalid followerId'});
  };

  Follower.setup();
};
