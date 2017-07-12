var validator = require('validator')
  , async = require('async')
  ;

// Define constant.
ASSET_GROUP_TOYS = "Toys";
ASSET_GROUP_PROPERTIES = "Properties";
ASSET_GROUPS = [ASSET_GROUP_TOYS, ASSET_GROUP_PROPERTIES];

ASSET_STATUS_LOCK = 'lock';
ASSET_STATUS_UNLOCK = 'unlock';
ASSET_STATUS_OWNED = 'owned';

module.exports = function (Asset) {
  Asset.prefixError = 'AST_';

  // Default value.
  Asset.definition.rawProperties.created.default =
    Asset.definition.properties.created.default = function () {
      return new Date();
    };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Asset.definition.rawProperties.modified.default =
    Asset.definition.properties.modified.default = function () {
      return new Date();
    };

  // Hook to updating modified date.
  Asset.observe('before save', function (ctx, next) {
    if (ctx.currentInstance) {
      ctx.currentInstance.modified = new Date();
    }
    next();
  });

  // Remote functions.
  Asset.createDefaultList = function (next) {
    var defaultList = [
      {
        name: "SportCar1",
        description: "SportCar1",
        price: 75000,
        salesToUnlock: 1000,
        group: ASSET_GROUP_TOYS,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Yacht",
        description: "Yacht",
        price: 700000,
        salesToUnlock: 4000,
        group: ASSET_GROUP_TOYS,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Limousine",
        description: "Limousine",
        price: 250000,
        salesToUnlock: 5000,
        group: ASSET_GROUP_TOYS,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Helicopter",
        description: "Helicopter",
        price: 1300000,
        salesToUnlock: 6000,
        group: ASSET_GROUP_TOYS,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Jet",
        description: "Jet",
        price: 5000000,
        salesToUnlock: 10000,
        group: ASSET_GROUP_TOYS,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Stadium",
        description: "",
        price: 8000000,
        salesToUnlock: 4000,
        group: ASSET_GROUP_PROPERTIES,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Airport",
        description: "",
        price: 5000000,
        salesToUnlock: 2000,
        group: ASSET_GROUP_PROPERTIES,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Golf",
        description: "Golf course",
        price: 2000000,
        salesToUnlock: 3000,
        group: ASSET_GROUP_PROPERTIES,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Marina",
        description: "",
        price: 3000000,
        salesToUnlock: 5000,
        group: ASSET_GROUP_PROPERTIES,
        string3D: "",
        string2D: ""
      }
      , {
        name: "Casino",
        description: "",
        price: 10000000,
        salesToUnlock: 10000,
        group: ASSET_GROUP_PROPERTIES,
        string3D: "",
        string2D: ""
      }
    ];

    ObjectID = Asset.getDataSource().ObjectID;
    async.each(defaultList, function (item, nextItem) {
      item.id = ObjectID();
      Asset.findOrCreate({
        where: {
          key: item.name
        }
      }, item, function (err) {
        if (err) {
          nextItem(err);
        } else {
          nextItem();
        }
      });
    }, function (error) {
      if (error) {
        error.code = Asset.prefixError + "CD01";
        next(error);
      } else {
        next();
      }
    });
  };

  Asset.checkList = function (memberId, ctx, next) {
    if (!ctx.user) {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var userId = ctx.user.id,
      isNewMember = false;
    if (memberId && memberId != '') {
      userId = memberId;
      isNewMember = true;
    }
    if (!userId) {
      var err = new Error("Empty user ID");
      err.code = Asset.prefixError + "CL01";
      return next(err);
    }
    async.parallel([
      function (cb) {
        if (isNewMember) {
          Asset.app.models.Member.findById(userId, function (err, member) {
            if (err) {
              next(err);
            }
            cb(null, member);
          });
        } else {
          cb(null, ctx.user);
        }
      },
      function (cb) {
        Asset.find({}, function (err, assets) {
          if (err) {
            next(err);
          }
          cb(null, assets);
        });
      }
    ], function (err, res) {
      var member = res[0],
        assets = res[1],
        assetOfMember = [];
      if(!member){
        var err = new Error("Can not find Member");
        err.code = Asset.prefixError + "CL02";
        return next(err);
      }
      member.assets.forEach(function (asset) {
        assetOfMember[asset.id] = asset.status;
      });

      var data = [];
      assets.forEach(function (item) {
        if (assetOfMember[item.id]) {
          item.status = assetOfMember[item.id];
        }
        else if (item.salesToUnlock <= member.total_satisfied_customers) {
          item.status = ASSET_STATUS_UNLOCK;
          member.assets.push({
            id: item.id,
            status: item.status
          });
        } else {
          item.status = ASSET_STATUS_LOCK;
        }
        data.push(item);
      });
      Asset.app.models.Member.updateAll({_id: member.id}, {assets: member.assets}, function (err, updateData) {
        if (err) {
          next(err);
        }
        next(null, data)
      });
    });
  };
  Asset.buyAsset = function (data, ctx, next) {
    if (!ctx.user) {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    if (!data.id) {
      var err = new Error("Empty asset ID");
      err.code = Asset.prefixError + "BA01";
      return next(err);
    }
    var member = ctx.user;
    var assetId = data.id;
    if (member.assets && member.assets.length) {
      var isUnlock = false;
      var i = -1;
      async.eachSeries();
      member.assets.forEach(function (asset, index) {
        if (asset.id == assetId && asset.status == ASSET_STATUS_UNLOCK) {
          isUnlock = true;
          i = index;
        }
      });
      if (!isUnlock) {
        var err = new Error("Can not buy this asset");
        err.code = Asset.prefixError + "BA03";
        return next(err);
      } else {
        Asset.findById(assetId, function (err, assetData) {
          if (err) {
            return next(err);
          }
          if (!assetData) {
            var err = new Error("Can not find assetId");
            err.code = Asset.prefixError + "BA04";
            return next(err);
          }
          if (member.budget < assetData.price) {
            var err = new Error("Member is not enought money");
            err.code = Asset.prefixError + "BA02";
            return next(err);
          }
          member.assets[i].status = ASSET_STATUS_OWNED;
          async.parallel([
            function (cb1) {
              Asset.app.models.Member.updateAll({_id: member.id}, {assets: member.assets}, function (err, updateData) {
                if (err) {
                  cb1(err);
                }
                cb1(null, data)
              });
            },
            function (cb2) {
              member.updateBudget({budget: -assetData.price}, function (err, data) {
                if (err) {
                  cb2(err);
                }
                cb2(null, data);
              });
            }
          ], function (err, res) {
            if (err) {
              next(err);
            } else {
              assetData.status = ASSET_STATUS_OWNED;
              var result = {
                asset: assetData,
                remainsBudget: res[1].budget
              };
              next(null, result);
            }
          });

        });
      }
    } else {
      var err = new Error("Can not buy this asset");// change mess
      err.code = Asset.prefixError + "BA03";
      return next(err);
    }
  };

  Asset.getNetWealth = function (memberId, ctx, next) {
    if (!ctx.user) {
      var error = new Error("Illegal request");
      error.code = "BAD_REQUEST";
      return next(error);
    }
    var userId = ctx.user.id;
    var anotherMember = false;
    if (memberId) {
      userId = memberId;
      anotherMember = true;
    }
    if (!userId) {
      var err = new Error("Empty user ID");
      err.code = Asset.prefixError + "NW01";
      return next(err);
    }
    if (anotherMember) {
      Asset.app.models.Member.findById(userId, function (err, member) {
        if (err) {
          next(err);
        }
        if(!member){
          var err = new Error("Can not find Member");
          err.code = Asset.prefixError + "NW02";
          return next(err);
        }
        var count = Asset.countNetWealth(member);
        next(null, {count: count});
      });
    } else {
      var count = Asset.countNetWealth(ctx.user);
      next(null, {count: count});
    }
  };
  Asset.countNetWealth = function (data) {
    if (data.assets && data.assets.length) {
      var count = 0;
      data.assets.forEach(function (item) {
        if (item.status == ASSET_STATUS_OWNED) {
          count++;
        }
      });
      return count;
    } else {
      return 0;
    }

  };
  // END OF Remote functions.

  // Validator.
  function validateAssetGroup(cb_err) {
    if (typeof this.group !== 'undefined') {
      if (!validator.isIn(this.group, ASSET_GROUPS)) {
        cb_err();
      }
    }
  }

  Asset.validate('group', validateAssetGroup, {message: 'Group should in list: ' + ASSET_GROUPS.join(', ')});

  // Disable some remotes.
  Asset.disableRemoteMethod('createChangeStream', true);
  Asset.disableRemoteMethod('upsert', true);
  Asset.disableRemoteMethod('exists', true);
  Asset.disableRemoteMethod('findOne', true);
  Asset.disableRemoteMethod('updateAll', true);
  Asset.disableRemoteMethod('upsertWithWhere', true);
  Asset.disableRemoteMethod('replaceOrCreate', true);
  Asset.disableRemoteMethod('replaceById', true);

  // Register remote method.
  Asset.remoteMethod(
    'createDefaultList',
    {
      accessType: 'WRITE',
      description: 'Create default Asset data list',
      http: {verb: 'post', path: '/createDefaultList'},
      returns: {arg: 'data', type: 'object', root: true},
    }
  );
  Asset.remoteMethod(
    'checkList',
    {
      accessType: 'READ',
      accepts: [
        {
          arg: 'memberId', type: 'string',
          description: 'MemberId is optional, if empty get list base on current logged user.', required: false,
          http: {source: 'query'}
        },
        {arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Get and check list Assets included status.',
      http: {verb: 'get', path: '/checkList'},
      returns: {arg: 'data', type: 'object', root: true}
    }
  );
  Asset.remoteMethod(
    'buyAsset',
    {
      accessType: 'EXECUTE',
      accepts: [
        {
          arg: 'data', type: 'object', description: '{id: "string"}', required: true,
          http: {source: 'body'}
        },
        {arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Buy an asset.',
      http: {verb: 'PUT', path: '/buy'},
      returns: {root: true}
    }
  );
  Asset.remoteMethod(
    'getNetWealth',
    {
      accessType: 'READ',
      accepts: [
        {
          arg: 'memberId', type: 'string',
          description: 'MemberId is optional, if empty get list base on current logged user.', required: false,
          http: {source: 'query'}
        },
        {arg: 'ctx', type: 'object', description: 'Current context.', http: {source: 'req'}}
      ],
      description: 'Get total owned assets.',
      http: {verb: 'get', path: '/netWealth'},
      returns: {root: true}
    }
  );
};
