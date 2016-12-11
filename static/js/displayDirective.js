app.directive("flMenu",function(menuFactory,$location){
  return {
    restrict: "A",
    scope: {
      menu: "@flMenu",
      item: "=flItem",
      url: "@flUrl",
      action: "=flAction",
      selected: "=flSelected"
    },
    link: function($scope,element,attr,controllers){
      //Initialisation de l'objet s'il n'existe pas
      if(!menuFactory.menus[$scope.menu]){
        menuFactory.menus[$scope.menu] = {
          selected: null,
          items: {},
          first: $scope.item,
          last: $scope.item,
          nextTo: function(index){
            var prev = null;
            for(key in this.items){
              if(prev == index){
                return key;
              }
              prev = key;
            }
          },
          prevTo: function(index){
            var prev = null;
            for(key in this.items){
              if(key == index){
                return prev;
              }
              prev = key;
            }
          },
          next : function(){
            if(this.selected != null){
              for(var i = this.selected+1;i<=this.last;i++){
                if(this.items[i]){
                  this.selected = i;
                  return;
                }
              }
            } else {
              this.selected = this.first;
            }
          },
          prevent : function(){
            if(this.selected != null){
              for(var i = this.selected-1;i>=this.first;i--){
                if(this.items[i]){
                  this.selected = i;
                  return;
                }
              }
            } else {
              this.selected = this.last;
            }
          },
          getHeightOffset: function(){
            if(this.selected != null){
              var offset = 0;
              for(var i = this.first;i<this.selected;i++){
                if(this.items[i]){
                  offset += this.items[i].getHeight();
                }
              }
              offset = offset + (this.items[this.selected].getHeight()/2);
              return offset;
            } else {
              return 0;
            }
          },
          getWidthOffset: function(){
            if(this.selected != null){
              var offset = 0;
              for(var i = this.first;i<this.selected;i++){
                if(this.items[i]){
                  offset += this.items[i].getWidth();
                }
              }
              offset += this.items[this.selected].getWidth()/2;
              return offset;
            } else {
              return 0;
            }
          }
      }
    }
    if($scope.selected){
      menuFactory.menus[$scope.menu].selected = $scope.item;
    }
      menuFactory.menus[$scope.menu].items[$scope.item] = {
        action:getAction(),
        element: element,
        getHeight: function(){
          return $(element).innerHeight();
        },
        getWidth: function(){
          return $(element).innerWidth();
        }
      };
      if(menuFactory.menus[$scope.menu].last < $scope.item){
        menuFactory.menus[$scope.menu].last = $scope.item;
      }
      if(menuFactory.menus[$scope.menu].first > $scope.item){
        menuFactory.menus[$scope.menu].first = $scope.item;
      }
      //
      $scope.$watch(function(){
        return menuFactory.menus[$scope.menu].selected;
      },function(newValue,oldValue){
        if(newValue == $scope.item){
          $(element).addClass("active");
        } else {
          $(element).removeClass("active");
        }
      });
      $scope.$watch(getAction,function(newValue,oldValue){
        menuFactory.menus[$scope.menu].items[$scope.item].action = getAction();
      });

      $(element).one("remove",function(e){
        var menu = menuFactory.menus[$scope.menu];
        if(menu.frist == $scope.item){
          menu.first == menu.nextTo(menu.first);
        }
        if(menu.last == $scope.item){
          menu.first == menu.prevTo(menu.first);
        }
        menu.items[$scope.item] = undefined;
      });

      function getAction(){
        if($scope.url){
          return $scope.url;
        } else {
          return $scope.action;
        }
      }
    }
  }
});

app.directive("flVideo",function(){

  return {
    restrict: "E",
    template: "<video ng-src='{{src}}' autoplay></video>",
    scope: {
      pause: "=",
      fastFoward: "=",
      fastRewind: "=",
      progress: "&",
      ended: "&",
      src: "@"
    },
    link: function($scope,element,attr,controllers){
      videoElement = $(element).find("video");
      videoElement.one("canplay",function(){
        setPause($scope.pause);
        fastFoward($scope.fastFoward);
        fastRewind($scope.fastRewind);
        $scope.$watch("pause",setPause);
        $scope.$watch("fastFoward",fastFoward);
        $scope.$apply();
        $scope.$watch("fastRewind",fastRewind);
        videoElement.on("ended",function(){
          if($scope.ended){
            $scope.ended();
          }
        });
      });

      videoElement.on("progress",function(e){
        sendCurrentTime();
      });

      function setPause(pause){
        if(pause){
          videoElement.get(0).pause();
        } else {
          videoElement.get(0).play();
        }
      }

      function fastFoward(duration){
        if(duration > 0){
          videoElement.get(0).currentTime += duration;
          $scope.fastFoward = 0;
          sendCurrentTime();
        }
      }

      function fastRewind(duration){
        if(duration > 0){
          videoElement.get(0).currentTime -= duration;
          $scope.fastRewind = 0;
          sendCurrentTime();
        }
      }

      function sendCurrentTime(){
          var event = {
            progress: videoElement.get(0).currentTime,
            total: videoElement.get(0).duration
          }
          $scope.progress({$event:event});
      }

    }
  }
});
