var ffmpeg = require("fluent-ffmpeg");
var mongoose = require("mongoose");
var fs = require("fs");

var convertionQueue = [];
var convertingId = [];
var parralelConvertion = 1;

function addToQueue(videoId){
  convertionQueue.push(videoId);
  if(convertingId.length < parralelConvertion){
    convert();
  }
}

function convert(){
  if(!convertionQueue[0])
    return false;
}

function screenshot(video){
  var command = ffmpeg(video.path);
  var files = [];
  var folder = __dirname+"/static/screenshots/"+video["_id"];
  command.on("filenames",filenames => {
    files = filenames;
  });
  command.on("start",function(command){
    console.log("Creating screenshots for "+video.path);
  });
  command.on("end",function(){
    var createdFiles = []
    for(var i = 0; i<files.length; i++){
      if(fileExist(__dirname+"/static/screenshots/"+video["_id"]+"/"+files[i])){
        createdFiles.push("/static/screenshots/"+video["_id"]+"/"+files[i]);
      }
    }
    var videoApi = require("./videoApi");
    videoApi.mongoModel.findByIdAndUpdate(video["_id"],{screenshots:createdFiles},function(err,doc){
      if(err){
        console.error("Error during saving screenshots");
        console.error(err);
      }
      console.log("Screenshots created for "+video.path);
    });
  });
  command.on("error",err =>{
    console.trace(err);
  });
  command.takeScreenshots({count: 5,timemarks: ['00:00:10.000','00:00:30.000','00:01:00.000','00:05:00.000','00:10:00.000']},folder);
}

function convertionRemaining(){
  return convertionQueue.length;
}

function fileExist(path){
  try{
    fs.accessSync(path);
  }catch(e){
    return false;
  }
  return true;
}

exports.screenshot = screenshot;
exports.convertionRemaining = convertionRemaining;
exports.convert = convert;
exports.addToQueue = addToQueue;
