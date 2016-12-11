var Remote = require("./remote");
var web = require("./web");
var fs = require("fs");
var localIp = require("my-local-ip");
var displayManager = require("./displayManager");

var remotesConnected = {};
var id = 0;

function init(){
  var app = web.getApp();
  var io = web.getIo();

  app.get("/remote/:id",function(req,res){
    res.sendFile(__dirname+"/partials/remote.html");
  });
}

function socketConnection(displayId,socket){
  //Initialisation
  console.info("New remote connected id:"+id+" to the display id:"+displayId);
  var remote = new Remote(id,displayId,socket);
  remotesConnected[id] = remote;
  socket.emit("trusted",{
    id: id,
    ip: localIp(),
    display: displayId,
    stepSize: 75
  });
  var display = displayManager.getDisplaysConnected()[remote.displayId]
  if(display)
  {
    display.socket.emit("remoteConnected");
  }
  //Suppression lors de la déconnexion
  socket.on("disconnect",function(){
    console.info("Remote disconnected id : "+remote.id);
    display.socket.emit("remoteDisconnected");
    remotesConnected[remote.id] = undefined;
  });
  id++;
}

exports.onConnection = socketConnection;
exports.init = init;
exports.getRemotesConnected = function(){
  return remotesConnected;
}
