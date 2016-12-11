var allocine = require("allocine-api");
var web = require("./web");

function init(){
  var app = web.getApp();
  app.get("/api/allocine/search",searchRequest);
  console.info("Api allocine initialized");
}

function searchRequest(req,res){
  if(req.query.q){
    var params = {q:req.query.q};
    if(req.query.f){
      params.filter = req.query.f;
    }
    allocine.api("search",params,function(err,result){
      if(err){
        console.error("Error durinc access to allocine");
        console.error(err)
        sendError(res,500,"Internal server error","Error during acces to allocine",err);
      }
      result = result.feed;
      var toSend = [];
      if(result.results){
        for(var i = 0; i<result.results.length; i++){
          var resu = result.results[i].type;
          if(result[resu]){
            for(var j = 0; j<result[resu].length; j++){
              var oneResult = result[resu][j];
              var instance = {};
              if(oneResult.title){
                instance.title = oneResult.title;
              } else if(oneResult.originalTitle){
                instance.title = oneResult.originalTitle;
              }else {
                continue;
              }
              if(oneResult.poster){
                instance.image = oneResult.poster.href;
              }
              instance.id = oneResult.code;
              toSend.push(instance);
            }
          }
        }
      }
      sendObject(res,200,toSend);
    });
  } else {
    sendError(res,400,"Bad request","No q parameter",{});
  }
}


function sendError(res,code,name,description,object){
  var error = {
    code : code,
    name : name,
    description : description,
    object: object
  };
  sendObject(res,code,error);
}

function sendObject(res,code,object){
  res.status(code);
  res.type("json");
  res.send(JSON.stringify(object));
}

exports.init = init;
