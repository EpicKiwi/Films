var mongoose = require("mongoose");
var url = "mongodb://localhost:27017/mediacenter";
var db = null;

exports.connect = function(callback){

  console.info("Connecting to "+url);
  mongoose.connect(url);

  db = mongoose.connection;

  db.on("error",function(error){
    console.error(error);
    console.trace("Error while connecting to database");
    callback(error,null);
  });

  db.on("open",function(error){
    console.info("Database connection etablished");
    callback(null,db);
  });
}

exports.getDatabase = function(){
  return db;
}
