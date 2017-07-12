// BASE SETUP
// =============================================================================
var express    = require('express');
var bodyParser = require('body-parser');
var MongoClient = require("mongodb").MongoClient;
var async = require('async');
var azure = require('azure-storage');
var im = require('imagemagick');
var fs = require('fs');

var app        = express();

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(express.static('server/scripts'));


var port     = process.env.PORT || 3000; // set our port

// =============================================================================
try {
  fs.statSync(__dirname + '/config.local.json').isFile();
  var configs = JSON.parse(
    fs.readFileSync(__dirname + '/config.local.json')
  );
}
catch (e) {
  var configs = JSON.parse(
    fs.readFileSync(__dirname + '/config.json')
  );
}

// create our router
var router = express.Router();
router.get('/', function(req, res) {
  res.json({ message: 'Welcome to our api!' });   
});

var blobService = azure.createBlobService(configs.storageAccount, configs.storageAccessKey);
var convertPath =  __dirname + '/convert';
var imResize = function(item, style, callback){
  var wh = style.split('x');
  //Create the name for the thum
  var ext = item.name.split('.').pop()
      ,pre_name = item.name.replace('.'+ext,'');
  var thumb = convertPath +'/'+ pre_name + style + '_thumb.' + ext;
  var imParams = {
    srcPath: convertPath +'/'+ item.name,
    dstPath: thumb,
    quality: 1,
    strip : false,
    width: wh[0]
  };
  if(wh[1]){
    imParams.height = wh[1];//+'^';
    imParams.customArgs = [
      "-gravity", "center"
      ,"-extent", wh[0] +"x" + wh[1]
    ]
  }
  im.resize(imParams,
    function (err, sdout, stderr) {
      callback(err, sdout, stderr, thumb);
  });
};

var generateStyle = function (item, style, callback){
  blobService.getBlobProperties(configs.container, style + '/' + item.name, function (error) {
    if (error) {//Blod is not exists
      imResize(item, style, function (err, sdout, stderr, thumb) {
        blobService.createBlockBlobFromLocalFile(configs.container, style + '/' + item.name , thumb, function(err, cb){
          if(err){
            console.log('generateStyle:createBlockBlobFromLocalFile',err);
            callback(err);
          } 
          else {
            try{
              fs.unlinkSync(thumb);
            } catch(ex) {
              console.log('generateStyle:unlinkSync',ex);
            }
            callback();
          }
        });
      });
    } else {
      callback();
    }
  });
}
var generateImage = function(item, styles ,callback){
  var ext = item.name.split('.').pop().toLowerCase();
  if(item.name && item.name.indexOf('/')<=0 && (ext == 'png' || ext == 'jpg' || ext == 'gif' || ext == 'jpeg' || ext == 'tif' )){
    blobService.getBlobToLocalFile(configs.container, item.name, convertPath +'/'+ item.name, function(err, serverBlob) {
      if(err) {
        console.log('generateImage:getBlobToLocalFile',err);
        callback(err);
      }else{
        var fieldKey = Object.keys(styles);
        var totalStyles = fieldKey.length;
        var doneStyles = 0, hasErr = false;
        for(var i=0; i < totalStyles; i++){
          generateStyle(item, styles[fieldKey[i]],function(err){
            if(err) { hasErr = true; console.log(err);}
            if(++doneStyles >= totalStyles){
              try{
                fs.unlinkSync(convertPath +'/'+ item.name);
              } catch(ex) {
                console.log('generateImage:unlinkSync',ex);
              }
              if(!hasErr) {
                blobService.deleteBlob(configs.containerTemp, item.name, function(err3, data){});
              }
              return callback();
            }
          });
        }
      }
    });  
  }else{
    callback();
  }
}
var executeGenerate = function(){
  var blobs = blobService.listBlobsSegmented(configs.containerTemp, null, function (error, result, response) {
    if (error) {
      console.log(error);
      return runProcessIMGService();
    }else{
      var totalFiles = (result.entries.length>0?Math.min(result.entries.length, configs.maxBlod):0);
      if(totalFiles){
        MongoClient.connect(configs.mongodb, function (err, db) {
          if (err) {
            console.error('Unable to connect to the mongoDB server. Error:', err);
            return runProcessIMGService();
          } 
          console.log('Connection established to', configs.mongodb);
          try {
            var collection = db.collection('Setting');
            var all = collection.find({ "configName": "THUMBNAIL_RATIOS_PRODUCT" }).toArray(function (err, settingValue) {
                if (err) {
                  console.error(err);
                  return runProcessIMGService();
                }
                else if (settingValue.length) {
                  styles = JSON.parse(settingValue[0].configValue);
                  var doneFiles = 0;
                  for (var i = 0; i < totalFiles; i++) {
                    generateImage(result.entries[i], styles,function(err){
                      if (err) {
                        // Move to errorImageLogs.
                      }

                      if( ++doneFiles >= totalFiles){
                        runProcessIMGService();
                      }
                    });
                  }
                }
                else {
                  console.log('There is not any imagestyles');
                  return runProcessIMGService();
                }
            });
          } catch(ex) {
            console.log(ex);
            return runProcessIMGService();
          }
        });
      }else{
        return runProcessIMGService();
      }
    }
  });
  console.log('Checking', new Date());
};


var runProcessIMGService = function() {
  setTimeout(function(){
    executeGenerate();
  },configs.schedule);
};
runProcessIMGService();

// ----------------------------------------------------
router.route('/:style/:filename')
  .get(function(req, res) {
    var item = {'name': req.params.filename};
    blobService.getBlobToLocalFile(configs.container, item.name, convertPath +'/'+ item.name, function(err, serverBlob) {
      if(err) {
        res.json({ error: err });
      }else{
        imResize(item, req.params.style, function (err, sdout, stderr, thumb) {
          if (err){
            res.json({ error: err });
          }else{
            try{
              fs.unlinkSync(convertPath +'/'+ item.name);
            } catch(ex) {
              console.log(ex);
            }
            blobService.createBlockBlobFromLocalFile(configs.container, req.params.style + '/' + item.name , thumb, function(err, cb){
              if(err){
                res.json({ error: err });
              } 
              else {
                try{
                  fs.unlinkSync(thumb);
                } catch(ex) {
                  console.log(ex);
                }
                res.json({ error: '',url: req.params.style + '/' + item.name});
              }
            });
          }
        });
      }
    });
  });
// REGISTER OUR ROUTES -------------------------------
app.use('/services', router);
// START THE SERVER
app.listen(port);
console.log('Start on port ' + port);
