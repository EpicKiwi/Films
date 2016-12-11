var mongoose = require("mongoose");
var Api = require("./api");
var web = require("./web");
var fs = require("fs");
var ffmpeg = require("fluent-ffmpeg");
var convert = require("./convertManager")

var video = {
  path: String,
  type: String,
  status: String,
  screenshots: [String]
}

var api = new Api("video",video);

api.on("postinit",function(){
  var app = web.getApp();
  app.get("/getvideo/:id",function(req,res){
    api.mongoModel.findById(req.params.id,function(err,data){
      if(err){
        api.sendError(res,500,"Internal server error","Error during getting instance",err);
        return;
      } else if(!data){
        api.sendError(res,404,"Not found","The video was not found");
        return;
      }

      res.type(data.type);
      var stat = fs.statSync(data.path);
      var total = stat.size;
      if (req.headers['range']) {
         var range = req.headers.range;
         var parts = range.replace(/bytes=/, "").split("-");
         var partialstart = parts[0];
         var partialend = parts[1];

         var start = parseInt(partialstart, 10);
         var end = partialend ? parseInt(partialend, 10) : total-1;
         var chunksize = (end-start)+1;

         var file = fs.createReadStream(data.path, {start: start, end: end});
         res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
         file.pipe(res);
       } else {
         res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
         fs.createReadStream(data.path).pipe(res);
       }

    });
  })
})

api.on("postUpdate",function(video){
  if(video){
    checkFormat(video);
    convert.screenshot(video);
  }
});

api.on("postAdd",function(video){
  if(video){
    checkFormat(video);
    convert.screenshot(video);
  }
});

function checkFormat(video){
  var modif = {};
  if(video.type == "mp4"){
    modif.status = "ready";
  } else {
    modif.status = "notConverted";
  }
  api.mongoModel.findByIdAndUpdate(video._id,modif,function(err,res){
    if(err){
      console.log("Error during update of "+video.path+" in the database");
    }
  })
}

module.exports = api;
