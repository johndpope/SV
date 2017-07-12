module.exports = function(app) {
  var Role = app.models.Role;
  var Member = app.models.Member;

  Role.registerResolver('admin', function(role, context, next) {
    var accessToken = context.accessToken;
    if(accessToken && accessToken.userId) {
      Member.findById(accessToken.userId, {"fields": ["type"]}, function(err, userInfo) {
        if(err || !userInfo) {
          next(null, false);
        } else {
          if(userInfo.type.indexOf(MEMBER_TYPES.ADMIN) !== -1) {
            next(null, true);
          } else {
            next(null, false);
          }
        }
      });
    } else {
      next(null, false);
    }
  });

  Role.registerResolver('user', function(role, context, next) {
    var accessToken = context.accessToken;
    if(accessToken && accessToken.userId) {
      Member.findById(accessToken.userId, {"fields": ["type"]}, function(err, userInfo) {
        if(err || !userInfo) {
          next(null, false);
        } else {
          if(userInfo.type.indexOf(MEMBER_TYPES.USER) !== -1) {
            next(null, true);
          } else {
            next(null, false);
          }
        }
      });
    } else {
      next(null, false);
    }
  });

  Role.registerResolver('owner', function(role, context, next) {
    if(context && context.accessToken && context.modelId) {
      context.model.findById(context.modelId, {"fields": ["ownerId"]}, function(err, inst) {
        if(err || !inst || !inst.ownerId) {
          next(err, false);
        } else if(inst && inst.ownerId && context.accessToken.userId) {
          next(null, inst.ownerId.toString() === context.accessToken.userId.toString());
        }
      });
    } else {
      next(null, false);
    }
  });
};
