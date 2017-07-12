var fs = require('fs')
  , uuidV1 = require('uuid/v1')
  , path = require('path')
  , async = require('async')
  , request = require('request')
  , azure = require('azure-storage')
  , loopback = require('loopback')
  , url =require('url')
  , svgexport = require('svgexport')
  ;
var configs = loopback.getConfigs()
  , fileUploadSettings = configs.dataSources.fileupload.settings;

module.exports = function(Upload) {
  Upload.prefixError = "UPL_";

  Upload.disableRemoteMethod('createContainer',true);
  Upload.disableRemoteMethod('destroyContainer',true);
  Upload.disableRemoteMethod('getContainer',true);
  Upload.disableRemoteMethod('getContainers',true);
  var azureStorage = azure.createBlobService(fileUploadSettings.storageAccount, fileUploadSettings.storageAccessKey);
  azureStorage.createContainerIfNotExists(fileUploadSettings.containerTemp, function (error) {
    if (!error) {
      var options = { publicAccessLevel: azure.BlobUtilities.BlobContainerPublicAccessType.BLOB };
      azureStorage.setContainerAcl(fileUploadSettings.containerTemp, null, options, function (error) {});
    }
  });
  var fn_adjustFileName = function(fileBaseName){
    fileBaseName = fileBaseName.toLowerCase().replace(/(  \.(gif|jpe?g|png)).*/g,'$1').replace(/\?.*$/g,'');
    if(fileBaseName.indexOf('.') == -1) {
      fileBaseName = fileBaseName +'.jpg';
    }
    else{
      var ext = fileBaseName.split('.').pop();
    }
    return Upload.app.strNoneSpecialChar(fileBaseName);
  }
  var fn_upload2Azure = function(fileBaseName, dest_path, callback){
    azureStorage.createBlockBlobFromLocalFile(fileUploadSettings.container, fileBaseName, dest_path, function(err, found){
      if(err) {
        callback(err);
      }else {
        if('gif|jpg|jpeg|png'.indexOf(fileBaseName.split('.').pop().toLowerCase()) >= 0){
          azureStorage.startCopyBlob("https://" + fileUploadSettings.storageAccount + ".blob.core.windows.net/" + fileUploadSettings.container + "/" + fileBaseName, fileUploadSettings.containerTemp, fileBaseName, function(err2, data2, res){});
        }
        callback(null);
      }
    });
  };
  var fn_rename = function(file, toName, callback){
    var sourceuri = "https://" + fileUploadSettings.storageAccount + ".blob.core.windows.net/" + fileUploadSettings.container + "/" + file.name;
    azureStorage.startCopyBlob(sourceuri, fileUploadSettings.container, toName, function(err2, data2, res){
      if(err2) {
        callback(err2);
      }else {
        if('gif|jpg|jpeg|png'.indexOf(toName.split('.').pop().toLowerCase()) >= 0){
          azureStorage.startCopyBlob("https://" + fileUploadSettings.storageAccount + ".blob.core.windows.net/" + fileUploadSettings.container + "/" + toName, fileUploadSettings.containerTemp, toName, function(err2, data2, res){});
        }
        azureStorage.deleteBlob(fileUploadSettings.container, file.name, function(err3, data){});
        file.name = toName;
        callback();
      }
    });
  };
  var fn_getNewName = function(inFileName, callback){
    var ext = inFileName.split('.').pop()
      , pre_name = inFileName.replace('.'+ext,'')
      , uuid = uuidV1();
    callback(null, pre_name + "_" + uuid + "." + ext);
  };

  var fn_UpdateResponse = function(file, callback){
    Upload.getFile(fileUploadSettings.container, file.originalFilename, function(err1, fileObj1) {
      if (err1) {//File is not exists
        fn_rename(file, file.originalFilename, function(){
          callback(null,{'container' : fileUploadSettings.container,'name' : file.originalFilename});
        });
      }else{
        fn_getNewName(file.originalFilename, function(err, outFileName){
          if(err){
            callback(null,null);
          }else{
            fn_rename(file, outFileName, function(){
              callback(null,{'container' : fileUploadSettings.container,'name' : outFileName});
            });
          }
        });
      }
    });
  };

  // Overwrite method createContainer of Upload model
  Upload.generateContainer = function(ctx, callback) {
    var accessToken = ctx.req ? ctx.req.accessToken : ctx.get('accessToken');
    if(accessToken && accessToken.userId) {
      var userId    = accessToken.userId;
      var today     = new Date();
      var time      = today.valueOf(); // 1412744798047 - total miliseconds from 1970 to now.
      var str_plain = userId.toString().concat(time, Math.random());
      var str_hash  = node_hash.sha1(str_plain);
      var container_name   = PREFIX_TEMP_DIR + str_hash;
      var containerOptions = {name: container_name};
      Upload.createContainer(containerOptions, function(err, container){
        if(!err){
          callback(null, container);
        } else if (err.code === 'EEXIST') {
          Upload.generateContainer(ctx, callback);
        } else {
          var error = new Error('Cannot create container');
          error.code = Upload.prefixError + "GC01";
          callback(error);
        }
      });
    } else {
      var error = new Error('Can not get accessToken');
      error.code = "BAD_REQUEST";
      callback(error);
    }
  };
  Upload.beforeRemote('**', function(ctx, unused, next) {
    switch(ctx.methodString){
      case 'Upload.upload':
        ctx.args.req.params.container = fileUploadSettings.container;
        next();
        break;
      case 'Upload.download':
        ctx.args.container = fileUploadSettings.container;
        if(typeof ctx.args.req.query.ratio != 'undefined'){

          var style = ctx.args.req.query.ratio
              file = ctx.args.req.params.file;
          if('gif|jpg|jpeg|png'.indexOf(file.split('.').pop().toLowerCase()) >= 0){
            if(Upload.app.models.Setting.configs.THUMBNAIL_RATIOS_PRODUCT[style]){
              style = Upload.app.models.Setting.configs.THUMBNAIL_RATIOS_PRODUCT[style];
              var fileBaseName = style + '/' + file;
              Upload.getFile(fileUploadSettings.container, fileBaseName, function(err, fileObj) {//Get style image
                if (err) {//The style or image is not exists
                  Upload.getFile(fileUploadSettings.container, file, function(err1, fileObj1) {
                    if (err1) {
                      var error = new Error('File not found');
                      error.code = Upload.prefixError + "DL01";
                       next(error);
                    }else{//Generate image style
                      var infor = null;
                      request({
                        url: configs.configs.thumbApi + fileBaseName, //URL to hit
                        method: 'GET', //Specify the method
                        json:true
                      }, function(err, response, body){
                        if(err) {
                          if (err && !err.code) {
                            err.code = Upload.prefixError + "DL02";
                          }
                          infor = {error:err,url:''};
                        } else {
                          infor = body;
                        }

                        ctx.res.json({data: {container: fileUploadSettings.container, name: fileBaseName},error: null});
                        return ;
                      });
                    }
                  });
                } else {//Return an exists style or orignal image
                  ctx.res.json({data: {container: fileUploadSettings.container, name: fileBaseName},error: null});
                  return;
                }
              });
            }  else{
              next();
            }
          }else{
            var error = new Error('The file is not image');
            error.code = Upload.prefixError + "DL03";
            next(error);
          }
        }else{
          if(ctx.args.req.params.file.split('.').pop().toLowerCase() == 'png'){
            ctx.res.header('Content-Type', 'image/png');
            azureStorage.createReadStream(fileUploadSettings.container,  ctx.args.req.params.file).pipe(ctx.res);
          }else{
            next();
          }
        }
        break;
      default:
        next();
    }
  });
  Upload.afterRemote('upload', function(ctx, unused, next) {
    var responseFiles = [],totalFiles = 0;
    var fieldKey = Object.keys(ctx.result.result.files);
    var totalFields = fieldKey.length;
    for (var i = 0; i < totalFields; i++) {
      var totalItems = ctx.result.result.files[fieldKey[i]].length;
      totalFiles += totalItems;
      for (var j = 0; j < totalItems; j++) {
        fn_UpdateResponse(ctx.result.result.files[fieldKey[i]][j],function(err,file){
          if(file) {
            responseFiles.push(file);
          }
          if(responseFiles.length >= totalFiles){
            ctx.result = responseFiles;
            return next();
          }
        });
      }
    }
  });

  function uploadFileToAzure(fileType, fileBaseName, mixedPath, responseFiles, nextFile) {
    fn_getNewName(fileBaseName, function(err, outFileName){
      if(err){
        nextFile();
      }else{
        var file_path = path.join(mixedPath, fileBaseName);
        if (fileType != 'image/svg+xml') {
          fn_upload2Azure(outFileName,file_path,function(err) {
            fs.unlink(file_path, function () {});
          });
          responseFiles.push({
            'container' : fileUploadSettings.container,
            'name' : outFileName
          });
          nextFile();
        } else {
          outFileName = outFileName.replace(".svg", ".png");
          var pngFile = path.join(mixedPath, outFileName);

          svgexport.render({
            "input": file_path,
            "output": pngFile,
            "format": "png"
          }, function(err) {
            if (err) {
              nextFile();
            }
            else {
              fn_upload2Azure(outFileName, pngFile,function(err) {
                fs.unlink(file_path, function () {});
                fs.unlink(pngFile, function () {});
              });
              responseFiles.push({
                'container' : fileUploadSettings.container,
                'name' : outFileName
              });
              nextFile();
            }
          });
        }
      }
    });
  };

  function base64_decode(base64str, fileBaseName, mixedPath, responseFiles, nextFile) {
    var matches = base64str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches.length !== 3) 
    {
      return nextFile(new Error('Invalid input string'));
    }
    var buff = Buffer.from(matches[2], 'base64');
    var file_path = path.join(mixedPath, fileBaseName);
    var ext = matches[1].split('/').pop().split('+').shift();
    var fileNew = file_path.replace(/(\.(gif|jpe?g|png)).*/g, "." + ext);
    fs.writeFile(fileNew, buff, function(err) {
      if(err) {
        nextFile(err);
      } else {
        fileBaseName = path.basename(fileNew);
        uploadFileToAzure(matches[1], fileBaseName, mixedPath, responseFiles, nextFile);
      }
    });
  }

  Upload.uploadURL = function(options, callback) {
    var files = options.files || [];
    if(typeof files !== 'undefined' && files) {
     // Convert to array if files is object
      if(!Array.isArray(files)) {
        files = [files];
      }
      var responseFiles = [];
      var mixedPath = path.join(configs.app_path,'images',fileUploadSettings.container);
      if( !fs.existsSync(mixedPath) ){
        try{
          fs.mkdirSync(mixedPath);
        }
        catch(err){
          callback(err);
        }
      }
      var fileType = '',fileBaseName = '',file_path = '';
      var options = {
        url: '',
        headers: {
          'User-Agent': 'request'
        }
      };
      async.eachSeries(files, function(uploadURL, nextFile) {
        var protocol=url.parse(uploadURL).protocol;
        if( uploadURL === ''|| ( protocol != 'http:' && protocol != 'https:' && protocol != 'data:')) nextFile();
        else {
          fileBaseName = fn_adjustFileName(path.basename(uploadURL));
          if (fileBaseName.length > 70) {
            fileBaseName = "too-long-name.jpg";
          }

          file_path = path.join(mixedPath, fileBaseName);
          if(protocol == 'data:') {
            base64_decode(uploadURL, fileBaseName, mixedPath, responseFiles, nextFile);
          } else {
            options.url = uploadURL;
            request.get(options)
            .on('error', function(err) {
              nextFile(err);
            })
            .on('response', function(response) {
              fileType = response.headers['content-type'];
            })
            .pipe(fs.createWriteStream(file_path)).on('close', function(){
              if(/^image\/.*$/.test(fileType)){
                uploadFileToAzure(fileType, fileBaseName, mixedPath, responseFiles, nextFile);
              }else{
                fs.unlink(file_path, function () {});
                nextFile();
              }
            });
          }
        }
      },function(err){
        if(err){
          callback(err);
        }
        else{
          callback(null,responseFiles);
        }
      });
    }
    else{
      callback(null,null)
    }
  };
  Upload.getFileName = function (url, next) {
    var fileBaseName = fn_adjustFileName(path.basename(url));
    return fileBaseName;
  };
  Upload.remoteMethod(
    'upload',
    {
      accepts: [
        {arg: 'req', type: 'object', 'http': {source: 'req'}},
        {arg: 'res', type: 'object', 'http': {source: 'res'}}
      ],
      description: 'Support more types of to-be-uploaded file',
      http: {verb: 'post', path: '/upload'},
      returns: {arg: 'result', type: 'object'}
    }
  );
  Upload.remoteMethod(
    'uploadURL',
    {
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'any', description: '{"files":["url1","url2"]}', required: true,
          http: {source: 'body'}
        }
      ],
      description: 'Support more types of to-be-uploaded file',
      http: {verb: 'post', path: '/uploadURL'},
      returns: {arg: 'data', type: 'any', root: true}
    }
  );
};
