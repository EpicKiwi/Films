var Display = require("./display");
var web = require("./web");
var fs = require("fs");
var localIp = require("my-local-ip");

var displaysConnected = {};
var id = 0;

function init(){
  var app = web.getApp();
  var io = web.getIo();

  app.get("/",function(req,res){
    res.sendFile(__dirname+"/partials/display.html");
  });

  app.get("/display/randomBackground",function(req,res){
    var imagePath = "/static/posters";
    try{
      var posters = fs.readdirSync(__dirname+imagePath);
      var poster = posters[Math.round(Math.random()*(posters.length-1))];
      imagePath += "/"+poster;
      res.setType = poster.replace(/.*\.(.*)/,"$1");
    } catch (e) {
      res.status(500);
      res.send(JSON.stringify(e));
      return;
    }
    res.redirect(imagePath);
  });
}

function socketConnection(socket){
  //Initialisation
  console.info("New display connected id:"+id);
  var display = new Display(id,socket);
  displaysConnected[id] = display;
  socket.emit("trusted",{
    id: id,
    ip: localIp()
  });
  //Test
  socket.on("ping",function(){
    console.log("Display "+display.id+" ping");
    socket.emit("pong");
  });
  //Suppression lors de la déconnexion
  socket.on("disconnect",function(){
    console.info("Display disconnected id : "+display.id);
    displaysConnected[display.id] = undefined;
  });
  id++;
}

exports.onConnection = socketConnection;
exports.init = init;
exports.getDisplaysConnected = function(){
  return displaysConnected;
}
