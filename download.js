var fs = require("fs");

function downloadFile(url,dest,callback){
  var protocol = null;
  if(url.match("http")){
    protocol = require("http");
  } else if(url.match("https")){
    protocol = require("https");
  } else {
    callback({error:"Protocol error",description:"The protocol specified was not implemented"});
    return;
  }

  var file = fs.createWriteStream(dest);
  var request = protocol.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      callback(undefined,{
        dest:dest,
        filename:dest.replace(/.*\/(.*)$/,"$1"),
        extention:dest.replace(/.*\/.*\.(.*)$/,"$1")
      });
    });
  }).on('error', function(err) {
    fs.unlink(dest);
    console.log(err);
  });
}

exports.downloadFile = downloadFile;
