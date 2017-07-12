var loopback = require('loopback');
var boot = require('loopback-boot');
var fs = require('fs');

var app = module.exports = loopback();

// Add function to get app settings.
loopback.getConfigs = function() {
  return {
    // config in config.<env>.json.
    "configs": app.settings,
    // config in datasources.<env>.json.
    "dataSources": app.dataSources,
    "app_path": __dirname
  };
};

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // Remove for Azure.
  // start the server if `$ node server.js`
  // if (require.main === module)
    app.start();
});

// For simple log error.
var Stocket = {};
Stocket.settings = loopback.getConfigs();

Stocket.writeLog = function(data) {
  var logError = fs.createWriteStream('watchdog-log.log', { flags: 'a',encoding: 'utf-8',mode: 0777 });
  var logMsg = "\n\n" + Date().toString() + ": ";
  var cache = [];
  logMsg += "\n  Data: " + JSON.stringify(data, function(key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
          // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = null; // Enable garbage collection

  logError.write(logMsg);
}
Stocket.writeErrorLog = function(err, req, res, whereHandleError) {
  if (Stocket.settings.configs['debugSVError']) {
    if (err.name == 'Error' && whereHandleError === 'hook.js') {
      // Don't log error validate from hook.errorHanler.
      return ;
    }

    var userInfo = req.user;
    var shortUserInfo = {};
    if (userInfo && typeof userInfo !== 'undefined') {
      shortUserInfo.id = userInfo.id;
      shortUserInfo.storeId = userInfo.storeId;
    }

    var logError = fs.createWriteStream('error-log.log', { flags: 'a',encoding: 'utf-8',mode: 0777 });
    var logMsg = "\n" + Date().toString() + ": " + whereHandleError;

    logMsg += "\n  " + err.name + ": " + err.message;
    logMsg += "\n  " + req.method + " " + req.url;
    logMsg += "\n  QUERY STRING: " + JSON.stringify(req.query, null);
    logMsg += "\n  INPUT BODY: " + JSON.stringify(req.body, null);
    logMsg += "\n  * req.accessToken: " + JSON.stringify(req.accessToken, null);
    logMsg += "\n  * currentContext.userInfo: " + JSON.stringify(shortUserInfo, null);
    if (err.stack && err.name != 'Error' && err.name != 'ValidationError' && err.code != "INVALID_TOKEN") {
      logMsg += "\n  " + err.stack.toString();
    }

    logError.write(logMsg);
  }
};
loopback.stocket = Stocket;
