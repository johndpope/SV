var async = require('async');
module.exports = function(app) {
  var svQueueJob  = app.svQueueJob = async.queue(function (task, next) {
    var data = {"userId": task.playerId};
    app.models.Mission.checkList(data, next);
  }, 1);
};