var fs = require('fs');

exports.getConfig = function() {
  try {
    fs.statSync(__dirname + '/../../config.local.json').isFile();
    var configs = JSON.parse(
      fs.readFileSync(__dirname + '/../../config.local.json')
    );
  }
  catch (e) {
    var configs = JSON.parse(
      fs.readFileSync(__dirname + '/../../config.json')
    );
  }
  this.configs = configs;
  return configs;
} 

exports.getSettings = function(db, next) {
  var Settings = db.collection('Setting');
  Settings.find({}, { configName:true, configValue: true }).toArray(next);
}

exports.getSettingValue = function(settings, key) {
  return settings.filter(function(setting) {return (setting.configName == key) ? setting.configValue : false})[0].configValue;
}

exports.lock = function(fileName, callback) {
  var lockObj = fs.createWriteStream(fileName, { flags: 'w' });
  lockObj.write(new Date().toString());
  callback();
}

exports.unlock = function(fileName, callback) {
  fs.unlinkSync(fileName);
  callback();
}

exports.check = function(path, callback) {
  try{
    return (fs.statSync(path)) ? true : false;
  } catch(err) {
    return false;
  }
}
exports.showDebug = function(){
  if (this.configs.debugSV) {
    console.log(new Date(), arguments);
    // var args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
    // console.log(new Date(), JSON.stringify(args, null));
  }
}