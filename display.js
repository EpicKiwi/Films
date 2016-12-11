var remoteManager = require("./remoteManager");

function display(id,socket){
  this.socket = socket;
  this.id = id;
  this.videoMode = false;

  var that = this;
  this.socket.on("enterVideoMode",function(){
    that.videoMode = true;
  });
  this.socket.on("exitVideoMode",function(){
    that.videoMode = false;
  });
  this.socket.on("opentextmenu",function(attr){
    var remotes = remoteManager.getRemotesConnected();
    for(key in remotes){
      if(remotes[key].displayId == that.id){
        remotes[key].socket.emit("opentextmenu",attr);
      }
    }
  });
  this.socket.on("closetextmenu",function(attr){
    var remotes = remoteManager.getRemotesConnected();
    for(key in remotes){
      if(remotes[key].displayId == that.id){
        remotes[key].socket.emit("closetextmenu",attr);
      }
    }
  });
}

module.exports = display;
