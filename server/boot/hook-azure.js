var loopback = require('loopback')
  ,crypto = require('crypto');
module.exports = function(app) {
  var strNoneSpecialChar  = app.strNoneSpecialChar = function(strIn){
    strIn = strIn.toLowerCase();
    strIn= strIn.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a");
    strIn= strIn.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e");
    strIn= strIn.replace(/ì|í|ị|ỉ|ĩ/g,"i");
    strIn= strIn.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o");
    strIn= strIn.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u");
    strIn= strIn.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y");
    strIn= strIn.replace(/đ/g,"d");
    strIn= strIn.replace(/!|@|\$|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\:|\'| |\"|\&|\#|\[|\]|~/g,"-");
    strIn= strIn.replace(/[^\040-\176\200-\377]/gi,"-");
    strIn= strIn.replace(/-+-/g,"-");
    strIn= strIn.replace(/^\-+|\-+$/g,"");
    return strIn;
  };
  var Upload = app.models.Upload;
  Upload.dataSource.connector.getFilename = function(file, req, res){
    file.originalFilename = file.name =  strNoneSpecialChar(file.name.toString());
    var today     = new Date();
    var time      = today.valueOf();
    var str_hash  = crypto.createHash('md5').update(time.toString().concat(Math.random(10) * 1 , file.name)).digest('hex').toString() + '_' + file.name;
    return str_hash;
  }
};
