var express = require("express");
var displayManager = require("./displayManager");
var remoteManager = require("./remoteManager");
var bodyParser = require('body-parser');
var app = null;
var http = null;
var io = null;

exports.init = function(){
  app = express();
  http = require("http").Server(app);
  io = require("socket.io")(http);
  app.use("/static",express.static(__dirname+"/static"));
  app.use("/partials",express.static(__dirname+"/partials"));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.get("/ping",function(req,res){
    res.end("pong");
  });
  io.on("connection",function(socket){
    socket.on("displayConnection",function(){
      displayManager.onConnection(socket);
    });
    socket.on("remoteConnection",function(displayId){
      remoteManager.onConnection(displayId,socket);
    });
  });
}

exports.listen = function(){
  http.listen(80,function(){
    console.info("Listening on *:80");
  });
}

exports.getApp = function(){
  return app;
}

exports.getIo = function(){
  return io;
}
