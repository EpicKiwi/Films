var stepSize = 100;
var fullscreen = false;
var videoMode = false;

$(function(){
  var socket = io();
  socket.emit("remoteConnection",parseInt(window.location.href.replace(/.*\/([0-9]+)/,"$1")));
  var remote = {
    trusted: false,
    id: null,
    serverIp: null,
    displayId: null
  }
  var textMenu = null;
  socket.on("trusted",function(data){
    console.info("connected");
    remote.trusted = true;
    remote.id = data.remote;
    remote.serverIp = data.ip;
    remote.displayId = data.display;
    stepSize = data.stepSize;
  });

  socket.on("opentextmenu",function(attr){
    textMenu = attr;
    textMenu.onChange = debounce(function(value){
        $.ajax(attr.apiUrl+"q="+value)
        .done(function(data){
          $("#textMenuFreeSpace").html("");
          if(data.length>0){
            for(var i = 0; i<data.length; i++){
              var html = "<div class='oneElement element' data-element='"+data[i].id+"'>";
              if(data[i].image){
                html += "<div class='image'><img src='"+data[i].image+"'/></div>"
              }
              if(data[i].icon){
                html += "<div class='image'><i class='material-icons'>"+data[i].icon+"</i></div>"
              }
              html += "<p>"+data[i].title+"</p></div>";
              $("#textMenuFreeSpace").append(html);
            }
          } else {
            $("#textMenuFreeSpace").append("<div class='element'><p>Aucun resultat</p></div>");
          }
        });
    },1000)
    $("#textMenu #textMenuSynopsis").html(attr.synopsis);
    $("#textMenu input").focus();
    $("#textMenu").removeClass("hidden");
  });

  socket.on("closetextmenu",function(){
    $("#textMenu").addClass("hidden");
    $("#textMenu input").blur();
    textMenu = null;
  });

  var pointStart = null;
  var pointStep = null;
  var actualPoint = null;

  $("#touchArea").on("touchstart",function(e){
    e.preventDefault();
    console.log("Touch start");
    pointStep = pointStart = actualPoint = {
      x: e.originalEvent.touches[e.originalEvent.which].clientX,
      y: e.originalEvent.touches[e.originalEvent.which].clientY,
    }
    setTimeout(function (){
        if (!pointStep) {
            socket.emit("tap");
        }
    },100);
    refreshDom();
  });

  $("#touchArea").on("touchmove",function(e){
    e.preventDefault();
    actualPoint = {
      x: e.originalEvent.touches[e.originalEvent.which].clientX,
      y: e.originalEvent.touches[e.originalEvent.which].clientY,
    }
    var distance = Math.sqrt(Math.pow(actualPoint.x-pointStep.x,2)+Math.pow(actualPoint.y-pointStep.y,2));
    if(distance > stepSize){
      console.log("Step direction : "+getDirection(pointStep,actualPoint));
      socket.emit("step",{
        direction: getDirection(pointStep,actualPoint)
      });
      pointStep = actualPoint;
    }
    refreshDom();
  });

  $("#touchArea").on("touchend",function(e){
    e.preventDefault();
    pointStart = pointStep = actualPoint = null;
    refreshDom();
  });

  $("#fullscreenAction").on("click",function(){
    if(fullscreen){
      exitFullscreen();
      fullscreen = false;
      $("#fullscreenAction").html("fullscreen");
    } else {
      launchIntoFullscreen(document.documentElement);
      fullscreen = true;
      $("#fullscreenAction").html("fullscreen_exit");
    }
  });

  $("#backAction").on("click",function(){
    socket.emit("back");
  });

  $("#textMenuMenu").on("click",".element",function(e){
    e.preventDefault();
    var $button = $(e.currentTarget);
    var action = $button.data("element");
    socket.emit("choicetextmenu",action);
  });

  $("#textMenu input").on('keydown',function(e){
    if(textMenu){
      textMenu.onChange($("#textMenu input").val());
    }
  });

  function refreshDom(){
    if(actualPoint != null){
      $("#pointMove").removeClass("hidden");
      $("#pointMove").css({top:actualPoint.y,left:actualPoint.x});
    } else {
      $("#pointMove").addClass("hidden");
    }
  }

  function getDirection(from,to){
    if(from.y < to.y && Math.abs(to.x-from.x) < stepSize/2){
      //down
      return "down";
    } else if (from.y > to.y && Math.abs(to.x-from.x) < stepSize/2){
      //up
      return "up";
    }  else if(from.x < to.x){
      //Right
      return "right";
    }  else if(from.x > to.x){
      //Left
      return "left";
    } else {
      //Non trouvé
      return "unknown";
    }
  }
});

function launchIntoFullscreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if(document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};
