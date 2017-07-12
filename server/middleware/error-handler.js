var loopback = require("loopback");
module.exports = function() { 

  // Handle error by middleware.
  return function errorHandler(err, req, res, next) {
    loopback.stocket.writeErrorLog(err, req, res, "middleware");
    
    var errData = {
      name: err.name,
      status: res.statusCode || 403,
      message: err.message || 'An unknown error occurred'
    };

    if (typeof err == 'object') {
      for (prop in err) {
        errData[prop] = err[prop];
      }
    }

    errData.code = errData.code ? errData.code + "" : "UNKNOWN_ERROR"; // make sure error.code is string.
    errData.from = "MW";
    errData.stack = undefined;
    if (process.env.NODE_ENV != 'production') {
      errData.stack = err.stack || undefined;
    }

    res.send({"data": null, "error": errData});
    next();
  };
};
