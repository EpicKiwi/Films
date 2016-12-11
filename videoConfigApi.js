var mongoose = require("mongoose");
var fs = require("fs");
var Api = require("./api");
var videoApi = require("./videoApi");
var web = require("./web");
var express = require("express");

var rescentDelete = [];

var videoConfig = {
  path: String
}

var api = new Api("videoconfig",videoConfig);

api.on("postinit",function(){
  api.mongoModel.find(function(err,data){
    if(err){
      console.trace(err);
      return;
    }
    var app = web.getApp();
    for(var i = 0; i<data.length; i++){
      syncDirectory(api,data[i].path);
      app.use("/videosrc"+data[i].path,express.static(data[i].path));
    }
    purgeVideo();
  });

});

function syncDirectory(on,path){
  try {
    var dir = fs.readdirSync(path);
  } catch(e) {
    console.trace(e);
    return;
  }
  for(var i = 0; i<dir.length; i++){
    var thisPath = path+"/"+dir[i];
    try {
      var stats = fs.statSync(thisPath);
    } catch(e) {
      console.trace(e);
    }
    if(stats.isDirectory()){
      syncDirectory(on,thisPath);
    } else if(stats.isFile() && isVideo(dir[i])){
      addVideo(thisPath);
    }
  }
  watchDirectory(on,path);
}

function addVideo(path){
  videoApi.mongoModel.count({path:path}, function (err, count) {
    if(count == 0){
      var newVideo = {
        path: path,
        type: getType(path)
      };
      videoApi.emit("preAdd",newVideo);
      var instance = new videoApi.mongoModel(newVideo);
      instance.save(function(err,created){
        if(err){
          console.error("Error during creation of video "+path);
          console.trace(err);
          return;
        }
        videoApi.emit("postAdd",created);
        console.log("Added video "+path);
      });
    }
  });
}

function purgeVideo(){
  videoApi.mongoModel.find(function (err, videos) {
    for(var i = 0; i<videos.length; i++){
      if(!checkExistFile(videos[i].path)){
        deleteVideo(videos[i]);
      }
    }
  });
}

function deleteOneVideo(path,callback){
  videoApi.mongoModel.findOne({path:path},function (err, video) {
    deleteVideo(video,callback);
  });
}

function deleteVideo(video,callback){
  videoApi.mongoModel.findByIdAndRemove(video.id,function(err,res){
    if(err){
      console.error(err);
    }
    console.log("Deleted "+res.path);
    rescentDelete.push(res);
    if(callback) {callback(err,res)}
  });
}

function checkExistFile(file){
  try{
    fs.accessSync(file);
  }catch(e){
    if(e.code == "ENOENT"){
      return false;
      }
  }
  return true;
}

function isVideo(name){
  var type = getType(name);
  if(type == "avi" || type == "mkv" || type == "wmv" || type == "mp4"){
    return true;
  }
  return false;
}

function getType(name){
  return name.replace(/.*\.(.*)$/,"$1");
}

function indexRescentDeleted(path){
  for(var i = 0; i<rescentDelete.length;i++){
    if(path.replace(/.*\/(.*)$/,"$1") == rescentDelete[i].path.replace(/.*\/(.*)$/,"$1")){
      return i;
    }
  }
  return -1;
}

var pendingRemove = false;

function watchDirectory(on,path){
  console.info("Watching video directory "+path);
  fs.watch(path,function(event,filename){
    if (filename && event == "rename" && isVideo(path +"/"+ filename)) {
      var filepath = path +"/"+ filename;
      actionOnVideo(filepath);
      }
  });
}

function actionOnVideo(filepath){
  if(!checkExistFile(filepath)){
    console.info("File "+filepath+" removed");
    deleteOneVideo(filepath,function(){
      console.log("Remove finished");
      pendingRemove = false;
    });
    pendingRemove = true;
  } else if(checkExistFile(filepath)){
    var interval = setInterval(function(){
      if(!pendingRemove){
        clearInterval(interval);
        movedRecord(filepath);
      }
    },10);
  }
}

function movedRecord(filepath){
  var deletedIndex = indexRescentDeleted(filepath);
  if(deletedIndex == -1){
    console.info("File "+filepath+" added");
    addVideo(filepath);
  } else {
    console.info("File "+filepath+" moved");
    var instance = rescentDelete[deletedIndex];
    instance.path = filepath;
    instance = new videoApi.mongoModel(instance);
    instance.save(function(err,created){
      if(err){
        console.error("Error during creation of video "+filepath);
        console.trace(err);
        return;
      }
      console.log("Moved video "+filepath);
    });
    rescentDelete.splice(deletedIndex,1);
  }

}

module.exports = api;
