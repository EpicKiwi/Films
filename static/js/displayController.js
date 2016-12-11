var app = angular.module("films",["ngRoute","ngResource","monospaced.qrcode","btford.socket-io","ngSanitize"]);

app.config(function($routeProvider){
  $routeProvider
  .when("/",{
    templateUrl: "/partials/mainMenu.html",
    controller: "mainMenuController"
  })
  .when("/movie",{
    templateUrl: "/partials/moviesMenu.html",
    controller: "moviesController"
  })
  .when("/movie/:id",{
    templateUrl: "/partials/movie.html",
    controller: "movieController"
  })
  .when("/video",{
    templateUrl: "/partials/videos.html",
    controller: "videosController",
  })
  .when("/video/:id",{
    templateUrl: "/partials/video.html",
    controller: "videoController"
  })
  .when("/player/:type/:id",{
    templateUrl: "/partials/player.html",
    controller: "playerController"
  })
  .otherwise({
    redirectTo: "/"
  })
});

app.factory('socketIo', function (socketFactory) {
  return socketFactory();
});

app.factory("menuFactory",function(){
  return {
    menus : {},
    hfocus : null,
    wfocus : null
  }
});

app.factory("lightboxFactory",function(menuFactory){
  var factory = {
    showed: false,
    title: "Unknown",
    icon: null,
    content: "Unknown",
    options:[],
    lastFocus: {
      wfocus: null,
      hfocus: null
    },
    onClose: null,
    addOption: function(title,action){
      options.push(factory.options.push({
        title:title,
        action:action
    }))},
    show: function(){
      factory.lastFocus.hfocus = menuFactory.hfocus;
      factory.lastFocus.wfocus = menuFactory.wfocus;
      menuFactory.wfocus = "lightbox";
      menuFactory.hfocus = null;
      factory.showed = true;
    },
    hide: function(){
      menuFactory.hfocus = factory.lastFocus.hfocus;
      menuFactory.wfocus = factory.lastFocus.wfocus;
      factory.showed = false;
      if(factory.onClose){
        factory.onClose();
      }
    }
  }
  return factory;
});

app.factory("pathFactory",function(){
  return {
    states : []
  }
});

app.factory("displayFactory",function(){
  return {
    trusted : false,
    id: null,
    serverIp: null,
    hideInfo: false
  }
});

app.factory("timeFactory",function($interval){
  return {
    clock: new Date(),
    startClock : function(){
      var that = this;
      $interval(function () {
        that.clock = new Date();
      }, 1000);
    }
  }
});

app.factory("backgroundFactory",function($timeout,$interval){
  return {
    path: "/display/randomBackground",
    hidden: false,
    change : function(newPath){
      this.hidden = true;
      var that = this;
      $timeout(function(){
        that.path = newPath;
        that.hidden = false;
      },1000)
    },
    reset : function(){
      if(this.path != "/display/randomBackground")
        this.change("/display/randomBackground");
    }
  }
});

app.controller("videosController",function($scope,$resource,menuFactory){
  menuFactory.hfocus = "videosMenu";
  var videoResource = $resource("/api/video/:id");
  var movieResource = $resource("/api/movie/:id");
  $scope.videoNumber = 0;
  $scope.movies = movieResource.query();
  $scope.videos = videoResource.query(function(){
    var folders = {}
    for(var i = 0; i<$scope.videos.length; i++){
      var video = $scope.videos[i];
      if($scope.notAfilm(video)){
        $scope.videoNumber++;
        var attributes = video.path.replace(/^.+\/(.+)\/(.+)\..+$/,"$1|$2").split("|");
        video.name = attributes[1];
        if(folders[attributes[0]]){
          folders[attributes[0]].push(video);
        } else {
          folders[attributes[0]] = [video];
        }
      }
    }
    var newFolders = [];
    for(key in folders){
      var folder = {
        directory: key,
        videos: folders[key]
      }
      newFolders.push(folder);
    }
    $scope.videos = newFolders;
  });
  $scope.getVideoName = function(video){
    return video.path.replace(/^.+\/(.+)\..+$/,"$1");
  }
  $scope.notFilmVideos = function(){
    var videos = [];
    for(var i = 0; i<$scope.videos.length;i++){
      if($scope.notAfilm($scope.videos[i])){
        videos.push($scope.videos[i]);
      }
    }
    return videos;
  }
  $scope.notAfilm = function(value,index,array){
    for(var i = 0; i<$scope.movies.length;i++){
      if($scope.movies[i].video == value["_id"]){
        return false;
      }
    }
    return true;
  }

  $scope.$watch(function(){
    return menuFactory.menus.videosMenu.selected
  },function(newValue,oldValue){
    var newFolder = $(menuFactory.menus.videosMenu.items[newValue].element).data("folder");
    var oldFolder = $(menuFactory.menus.videosMenu.items[oldValue].element).data("folder");
    if(newFolder){
      menuFactory.wfocus = "videosIn"+newFolder;
    }
    if(oldFolder){
      menuFactory.menus["videosIn"+oldFolder].selected = null;
    }
  });
});

app.controller("mainController",function($scope,$timeout,lightboxFactory,timeFactory,$window,pathFactory,socketIo,menuFactory,socketIo,displayFactory,$location,backgroundFactory){
  $scope.menu = menuFactory;
  $scope.path = pathFactory;
  $scope.lightbox = lightboxFactory;
  timeFactory.startClock();
  $scope.time = timeFactory;
  $scope.display = displayFactory;
  $scope.background = backgroundFactory;
  $scope.connectedRemotes = 0;
  socketIo.emit("displayConnection");
  socketIo.on("trusted",function(display){
    displayFactory.trusted = true;
    displayFactory.id = display.id;
    displayFactory.serverIp = display.ip;
  });
  $scope.onKeyPress = function(event){
    switch(event.keyCode){
      case 38:
        if(menuFactory.hfocus){
          menuFactory.menus[menuFactory.hfocus].prevent();
        }
      break;
      case 37:
        if(menuFactory.wfocus){
          menuFactory.menus[menuFactory.wfocus].prevent();
        }
      break;
      case 40:
        if(menuFactory.hfocus){
          menuFactory.menus[menuFactory.hfocus].next();
        }
      break;
      case 39:
        if(menuFactory.wfocus){
          menuFactory.menus[menuFactory.wfocus].next();
        }
      break;
      case 13:
      var path = null;
      if(menuFactory.wfocus && menuFactory.menus[menuFactory.wfocus].items[menuFactory.menus[menuFactory.wfocus].selected]){
        path = menuFactory.menus[menuFactory.wfocus].items[menuFactory.menus[menuFactory.wfocus].selected].action
      } else if(menuFactory.hfocus) {
        path = menuFactory.menus[menuFactory.hfocus].items[menuFactory.menus[menuFactory.hfocus].selected].action
      }
      if(typeof path == "string"){
        $location.path(path);
      } else if(typeof path == "function") {
        path();
      }
      break;
    }
  }

  socketIo.on("remoteSwipe",function(e){
    switch(e.direction){
      case "up":
        if(menuFactory.hfocus){
          menuFactory.menus[menuFactory.hfocus].next();
        }
      break;
      case "down":
        if(menuFactory.hfocus){
          menuFactory.menus[menuFactory.hfocus].prevent();
        }
      break;
      case "left":
        if(menuFactory.wfocus){
          menuFactory.menus[menuFactory.wfocus].next();
        }
      break;
      case "right":
        if(menuFactory.wfocus){
          menuFactory.menus[menuFactory.wfocus].prevent();
        }
      break;
    }
  });

  socketIo.on("remoteTap",function(){
    var path = null;
    if(menuFactory.wfocus && menuFactory.menus[menuFactory.wfocus].items[menuFactory.menus[menuFactory.wfocus].selected]){
      path = menuFactory.menus[menuFactory.wfocus].items[menuFactory.menus[menuFactory.wfocus].selected].action
    } else if(menuFactory.hfocus && menuFactory.menus[menuFactory.hfocus].items[menuFactory.menus[menuFactory.hfocus].selected]) {
      path = menuFactory.menus[menuFactory.hfocus].items[menuFactory.menus[menuFactory.hfocus].selected].action
    }
    if(typeof path == "string"){
      $location.path(path);
    } else if(typeof path == "function") {
      path();
    }
  });

  socketIo.on("remoteBack",function(){
    socketIo.emit("exitVideoMode");
    $window.history.back();
  });

  socketIo.on("remoteConnected",function(){
    $scope.connectedRemotes++;
  });

  socketIo.on("remoteDisconnected",function(){
    $scope.connectedRemotes--;
  });
});

app.controller("mainMenuController",function($scope,$resource,menuFactory,pathFactory,backgroundFactory){
  menuFactory.hfocus = "main";
  backgroundFactory.reset();
  pathFactory.states = [];
  menuFactory.wfocus = null;
  if(menuFactory.menus.movies)
  {
    menuFactory.menus.movies.selected = null;
  }
  var movieResource = $resource("/api/movie/:id");
  var videoResource = $resource("/api/video/:id");
  $scope.movies = movieResource.query();
  $scope.videos = videoResource.query();
  $scope.getVideoName = function(video){
    return video.path.replace(/^.+\/(.+)\..+$/,"$1");
  }
  $scope.notAfilm = function(value,index,array){
    for(var i = 0; i<$scope.movies.length;i++){
      if($scope.movies[i].video == value["_id"]){
        return false;
      }
    }
    return true;
  }
  $scope.$watch(function(){
    if(menuFactory.menus.main)
      return menuFactory.menus.main.selected;
    else
      return false;
  },function(newValue,oldValue){
    if(menuFactory.menus.movies)
    {
      if(newValue == 0){
        menuFactory.menus.videos.selected = null;
        menuFactory.wfocus = "movies";
      }else if(newValue == 3){
        menuFactory.menus.movies.selected = null;
        menuFactory.wfocus = "videos";
      } else {
        menuFactory.wfocus = null;
        menuFactory.menus.movies.selected = null;
        menuFactory.menus.videos.selected = null;
      }
    }
  })
});

app.controller("moviesController",function($scope,pathFactory,menuFactory,$location,$resource){
  var movieResource = $resource("/api/movie/:id");
  pathFactory.states = ["Films"];
  menuFactory.wfocus = null;
  $scope.movies = movieResource.query(function(){
    menuFactory.wfocus = "movies";
  });
});

app.controller("videoController",function($scope,lightboxFactory,backgroundFactory,socketIo,menuFactory,$routeParams,$location,$resource){
  var videoResource = $resource("/api/video/:id");
  menuFactory.hfocus = "videoScroll";
  $scope.video = videoResource.get({id:$routeParams.id},function(){
    var randomBackground = Math.round(Math.random()*($scope.video.screenshots.length-1));
    if($scope.video.screenshots[randomBackground]){
      backgroundFactory.change($scope.video.screenshots[randomBackground]);
    }
  });
  $scope.getVideoName = function(video){
    return video.path.replace(/^.+\/(.+)\..+$/,"$1");
  }
  $scope.addToFilms = function(){
    lightboxFactory.title = "Ajouter aux films";
    lightboxFactory.icon = "smartphone";
    lightboxFactory.content = "Rendez vous sur votre télécommande pour séléctionner le film associé a \""+$scope.getVideoName($scope.video)+"\" sur allocine. Si vous ne trouvez pas ce film vous pouvez toujours l'ajouter mais il ne bénéficiera pas d'informations avancés comme le réalisateur, les acteurs ou le synopsis."
    lightboxFactory.onClose = function(){
      socketIo.emit("closetextmenu");
    }
    socketIo.once("closetextmenu",function(){
      lightboxFactory.hide();
    });
    socketIo.once("choicetextmenu",function(choice){
      if(choice == "back"){
        lightboxFactory.hide();
      }else{
        var movieResource = $resource("/api/movie/:id");
        var mov = new movieResource({
          name: $scope.getVideoName($scope.video),
          allocineId: choice,
          video: $scope.video["_id"]
        })
        console.log("MOV");
        console.log(mov);
        mov.$save(function(){
          lightboxFactory.hide();
          $location.path("/");
        });
      }
    });
    lightboxFactory.show();
    socketIo.emit("opentextmenu",{type:"film",synopsis:"Selectionnez votre film",placeholder:"Nom du film",apiUrl:"/api/allocine/search?f=movie&"});
  }
  $scope.$watch(function(){
    if($scope.menu.menus.videoScroll){
      return $scope.menu.menus.videoScroll.selected;
    }
  },function(newValue){
    if(newValue == 1){
      $scope.menu.wfocus = "videoAction";
      $scope.menu.menus.videoAction.selected = 0;
    } else if(newValue == 4){
        $scope.menu.wfocus = "videoActionMore";
        $scope.menu.menus.videoActionMore.selected = 0;
    }else {
      $scope.menu.wfocus = null;
      $scope.menu.menus.videoAction.selected = null;
      $scope.menu.menus.videoActionMore.selected = null;
    }
  });
  $scope.convertVideo = function(){
    lightboxFactory.title = "Convertir";
    lightboxFactory.icon = "loop";
    lightboxFactory.content = "Convertir \""+$scope.getVideoName($scope.video)+"\" permet de rendre compatible ce fichier video pour pouvoir le visionner dans le programme. Convertir ce film supprimera le fichier original et le remplacera par le fichier converti.";
    lightboxFactory.show();
  }
});

app.controller("movieController",function($scope,pathFactory,menuFactory,$resource,backgroundFactory,$routeParams){
  var movieResource = $resource("/api/movie/:id");
  menuFactory.wfocus = null;
  pathFactory.states = ["Films"];
  menuFactory.hfocus = "movieScroll";
  $scope.movie = movieResource.get({id:$routeParams.id},function(){
    if($scope.movie.outDate){
      $scope.movie.outDate = new Date($scope.movie.outDate);
    }
    if($scope.movie.image){
      backgroundFactory.change("/static/posters/"+$scope.movie.image);
    }
    pathFactory.states = ["Films",$scope.movie.name];
    //Chargement de la video associée
    var videoResource = $resource("/api/video/:id");
    $scope.video = videoResource.get({id:$scope.movie.video});
  });

  $scope.$watch(function(){
    if($scope.menu.menus.movieScroll){
      return $scope.menu.menus.movieScroll.selected;
    }
  },function(newValue){
    if(newValue == 1){
      $scope.menu.wfocus = "movieAction";
      $scope.menu.menus.movieAction.selected = 0;
    } else if(newValue == 4){
        $scope.menu.wfocus = "movieActionMore";
        $scope.menu.menus.movieActionMore.selected = 0;
    }else {
      $scope.menu.wfocus = null;
      $scope.menu.menus.movieAction.selected = null;
      $scope.menu.menus.movieActionMore.selected = null;
    }
  });

  $scope.secToString = function(seconds){
    var result = "";
    console.log(seconds)
    var hours = Math.floor(seconds / (60 * 60));
    var divisorMinutes = seconds % (60 * 60);
    var minutes = Math.floor(divisorMinutes / 60);

    if(hours > 0){
      result += hours+" h ";
    }
    if(minutes > 0){
     result += minutes+" min";
    }
    return result;
  }
});

app.controller("playerController",function($scope, socketIo,$timeout,$window,$resource,$routeParams,$timeout){
  $scope.videoId = null;
  $scope.menu.wfocus = "playerControl";
  $scope.progressTime = 0;
  $scope.fastf = 0;
  $scope.paused = false;
  switch($routeParams.type){
    case "movie":
      var movieResource = $resource("/api/movie/:id");
      var movie = movieResource.get({id:$routeParams.id},function(){
        $scope.videoId = "/getvideo/"+movie.video;
      });
    break;
    case "video":
      $scope.videoId = "/getvideo/"+$routeParams.id;
    break;
  }

  var hideTimeout = $timeout(function(){
    $scope.display.hideInfo = true;
  },2000);

  $scope.$watch(function(){
    if($scope.menu.menus.playerControl){
      return $scope.menu.menus.playerControl.selected;
    }
  },function(){
    showInfo();
  })

  $scope.progress = function(e){
    $scope.progressTime = (e.progress * 100) / e.total;
  }

  $scope.pause = function(){
    if($scope.paused){
      $scope.paused = false;
    } else {
      $scope.paused = true;
    }
  }

  $scope.foward = function(){
    $scope.fastf = 15;
  }

  $scope.backward = function(){
    $scope.fastb = 15;
  }

  $scope.ended = function(){
    $scope.videoId = null;
    socketIo.emit("exitVideoMode");
    $timeout(function(){
      $scope.display.hideInfo = false;
      $window.history.back();
    },500);
  }

  function showInfo(){
      $scope.display.hideInfo = false;
      $timeout.cancel(hideTimeout);
      hideTimeout = $timeout(function(){
        $scope.display.hideInfo = true;
      },2000);
  }

  socketIo.emit("enterVideoMode");
  socketIo.on("remoteFastFoward",function(){
    showInfo();
    $scope.foward();
  });
  socketIo.on("remoteFastRewind",function(){
    showInfo();
    $scope.backward();
  });
  socketIo.on("remotePause",function(){
    if($scope.display.hideInfo == false){
      $scope.pause();
    } else {
      showInfo();
    }
  });
});
