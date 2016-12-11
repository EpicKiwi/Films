var util = require('util');
var EventEmitter = require('events');
var web = require("./web");
var mongoose = require("mongoose");
var baseUrl = "/api/";

function Api(name,model){
  this.model = model;
  this.mongoModel = null;
  this.name = name;
  EventEmitter.call(this);

  this.init = function(){
    var that = this;
    this.emit("preinit",this);
    //Creation of mongoSchema
    var schema = mongoose.Schema(this.model);
    this.mongoModel = mongoose.model(this.name,schema);
    //Express route
    var app = web.getApp();
    app.get(baseUrl+this.name,function(req,res){
      that.findAll(req,res);
    });
    app.get(baseUrl+this.name+"/:id",function(req,res){
      that.findOne(req,res);
    });
    app.put(baseUrl+this.name+"/:id",function(req,res){
      that.updateOne(req,res);
    });
    app.delete(baseUrl+this.name+"/:id",function(req,res){
      that.deleteOne(req,res);
    });
    app.post(baseUrl+this.name,function(req,res){
      that.addOne(req,res);
    });
    //Finished
    console.info("Api "+name+" initialized");
    this.emit("postinit",this)
  }

  this.addOne = function(req,res){
    var that = this;
    var newInstance = this.getInstance(req.body);
    this.emit("preAdd",newInstance);
    var instance = new this.mongoModel(newInstance);
    instance.save(function(err,created){
      if(err){
        that.sendError(res,500,"Internal server error","Error during creation of instance",err);
        return;
      }
      that.sendObject(res,200,created);
      that.emit("postAdd",created);
    });
  }

  this.updateOne = function(req,res){
    var that = this;
    var newInstance = this.getInstance(req.query);
    this.emit("preUpdate",newInstance);
    this.mongoModel.findByIdAndUpdate(req.params.id,newInstance,function(err,created){
      if(err){
        that.sendError(res,500,"Internal server error","Error during update of instance",err);
        return;
      }
      that.sendObject(res,200,created);
      that.emit("postUpdate",created);
    });
  }

  this.findAll = function(req,res){
    var that = this;
    this.emit("preFindAll");
    this.mongoModel.find(function(err,data){
      if(err){
        that.sendError(res,500,"Internal server error","Error during getting instances",err);
        return;
      }
      that.sendObject(res,200,data);
      that.emit("postFindAll",data);
    });
  }

  this.findOne = function(req,res){
    var that = this;
    this.emit("preFind",req.params.id);
    this.mongoModel.findById(req.params.id,function(err,data){
      if(err){
        that.sendError(res,500,"Internal server error","Error during getting instance",err);
        return;
      }
      that.sendObject(res,200,data);
      that.emit("postFind",data);
    });
  }

  this.deleteOne = function(req,res){
    var that = this;
    this.emit("preDelete",req.params.id);
    this.mongoModel.findByIdAndRemove(req.params.id,function(err,data){
      if(err){
        that.sendError(res,500,"Internal server error","Error during deleting instance",err);
        return;
      }
      that.sendObject(res,200,data);
      that.emit("postDelete",data);
    });
  }

  this.getInstance = function(fromObject){
      var newInstance = {};
      for(field in this.model){
        if(fromObject[field]){
          newInstance[field] = fromObject[field];
        }
      }
      return newInstance;
  }

  this.sendError = function(res,code,name,description,object){
    var error = {
      code : code,
      name : name,
      description : description,
      object: object
    };
    this.sendObject(res,code,error);
  }

  this.sendObject = function(res,code,object){
    this.emit("preSend",object);
    res.status(code);
    res.type("json");
    res.send(JSON.stringify(object));
    this.emit("postSend",object);
  }

}


util.inherits(Api, EventEmitter);
module.exports = Api;
