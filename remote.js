var displayManager = require("./displayManager");

function remote(id,display,socket){
  this.socket = socket;
  this.id = id;
  this.displayId = display;

  var that = this;
  socket.on("step",function(e){
    var display = displayManager.getDisplaysConnected()[that.displayId];
    if(display && display.videoMode == false){
      display.socket.emit("remoteSwipe",e);
    } else if(display && display.videoMode == true){
      switch(e.direction){
        case "left":
          display.socket.emit("remoteFastRewind",e);
        break;
        case "right":
        display.socket.emit("remoteFastFoward",e);
        break;
      }
    } else {
      console.error("Display "+that.displayId+" not defined");
    }
  });

  socket.on("tap",function(){
    var display = displayManager.getDisplaysConnected()[that.displayId];
    if(display && display.videoMode == false){
      display.socket.emit("remoteTap");
    } else if(display && display.videoMode == true){
      display.socket.emit("remotePause");
    } else {
      console.error("Display "+that.displayId+" not defined");
    }
  });

  socket.on("back",function(){
    var display = displayManager.getDisplaysConnected()[that.displayId];
    if(display){
      display.socket.emit("remoteBack");
    } else {
      console.error("Display "+that.displayId+" not defined");
    }
  });

  socket.on("choicetextmenu",function(id){
    var display = displayManager.getDisplaysConnected()[that.displayId];
    display.socket.emit("choicetextmenu",id);
  });
}

module.exports = remote;
