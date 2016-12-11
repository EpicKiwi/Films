var mongoose = require("mongoose");
var Api = require("./api");
var allocine = require("allocine-api");
var download = require("./download");

var movie = {
  name: String,
  duration: Number,
  synopsis: String,
  type: [String],
  realisator: String,
  actors: [String],
  public: String,
  outDate: Date,
  nationality: String,
  image: String,
  allocineId: String,
  video: {type:mongoose.Schema.Types.ObjectId,ref:"video"}
}

var api = new Api("movie",movie);

api.on("postUpdate",function(movie){
  refreshMovie(movie);
});

api.on("postAdd",function(movie){
  refreshMovie(movie);
});

function refreshMovie(movie){
  api.mongoModel.findById(movie.id,function(err,newMovie){
    if(newMovie.allocineId){
      console.info("Refreshing movie informations for '"+newMovie.name+"' on Allocine");
      allocine.api("movie",{code:newMovie.allocineId},function(err,result){
        if(err){
          console.error("Error during refreshing movie '"+newMovie.name+"' informations");
          console.error(err);
          return;
        }
        if(result.error && result.error.code == 0){
          console.error("Movie id "+newMovie.allocineId+" not found on allocine");
          return;
        } else if(result.error){
          console.error(result.error);
          return;
        }
        result = result.movie;
        newMovie.image = result.poster.href;
        var dest = __dirname+"/static/posters/"+movie.id+"."+newMovie.image.replace(/.*\/.*\.(.*)$/,"$1");
        console.info("Downloading movie's poster");
        download.downloadFile(newMovie.image,dest,function(err,res){
          if(err){
            console.log("Can't download poster file for '"+movie.name+"'");
            console.log(err);
            return;
          }
          var update = {image:res.filename};
          api.mongoModel.findByIdAndUpdate(movie.id,update,function(err,result){
            if(err){
              console.error("Error while adding movie's poster");
              console.error(err);
              return;
            }
            if(!result){
              console.error("Movie '"+movie.name+"' not found");
              return;
            }
            console.info("Movie's poster '"+movie.name+"' updated");
          });

        });
        newMovie.name = result.title;
        newMovie.duration = result.runtime;
        newMovie.synopsis = result.synopsis;
        newMovie.type = [];
        for(var i = 0; i<result.genre.length; i++){
          newMovie.type.push(result.genre[i]["$"]);
        }
        newMovie.actors = [];
        for(var i = 0; i<result.castMember.length; i++){
          if(result.castMember[i].activity.code == 8001){
            newMovie.actors.push(result.castMember[i].person.name);
          } else if(result.castMember[i].activity.code == 8002){
            newMovie.realisator = result.castMember[i].person.name;
          }
        }
        if(result.movieCertificate){
          newMovie.public = result.movieCertificate.certificate["$"];
        }
        if(result.release){
          newMovie.outDate = new Date(result.release.releaseDate);
        }
        newMovie.nationality = result.nationality["$"];
        newMovie["_id"] = undefined;
        console.log("Saving new information into '"+movie.name+"'")
        api.mongoModel.findByIdAndUpdate(movie.id,newMovie,function(err,result){
          if(err){
            console.error("Error while updateing movie");
            console.error(err);
            return;
          }
          if(!result){
            console.error("Movie '"+movie.name+"' not found");
            return;
          }
          console.info("Movie '"+movie.name+"' updated");
        });
      })
    } else {
      console.log("No Allocine id for '"+newMovie.name+"' skipping");
    }
  });
}

module.exports = api;
