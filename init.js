var database = require("./database");
var videoApi = require("./videoApi");
var movieApi = require("./movieApi");
var allocineApi = require("./allocineApi");
var videoConfigApi = require("./videoConfigApi");
var displayManager = require("./displayManager");
var remoteManager = require("./remoteManager");
var web = require("./web");

database.connect(function(err,db){
  if(err){ return; }
  web.init();
  videoApi.init();
  movieApi.init();
  videoConfigApi.init();
  displayManager.init();
  remoteManager.init();
  allocineApi.init();
  web.listen();
  console.log("Everything is OK");
});
