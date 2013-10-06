var name = "services";
var version = "1.0";

services = function(){};

services.prototype = new services();

services.prototype.metadata = function()
{
    
    return {
	description : "The services package exposes RESTful services to access databases, collections, and items within the system.  It also provides functionality for synchronization with the stream and search systems."
    };
}();


Greenlight.Packages.Services = services.prototype;

Meteor.startup(function(){
    
    Greenlight.log("loading services package");
    
    Greenlight.register_package(name, version, Greenlight.Packages.Services);
    
});

var Consumer = Npm.require('prozess').Consumer;

var options = {host : 'localhost', topic : 'social', partition : 0, offset : 0};
var consumer = new Consumer(options);

/* consumer.connect(function(err){
  if (err) {  throw err; }
  console.log("connected!!");
  setInterval(function(){
    console.log("===================================================================");
    console.log(new Date());
    console.log("consuming: " + consumer.topic);
    consumer.consume(function(err, messages){
      console.log(err, messages);
    });
  }, 7000);
});*/

var mongo = Npm.require('mongodb');
var ObjectID = Npm.require('mongodb').ObjectID;
var Binary = Npm.require('mongodb').Binary;

var MongoClient = mongo.MongoClient;    
var Server = mongo.Server;
var Db = mongo.Db;
var BSON = mongo.BSONPure;

var serverUrl = 'mongodb://127.0.0.1:27017/';

Meteor.Router.add('/autocomplete/:search', function(search){

    var elasticsearch = Npm.require('elasticsearch');

    var config = {
	_index : 'gist'
    };
    
    var es = elasticsearch(config);
    
    var res = Meteor.sync(function(done){

	/*es.search({
	    query : {
		query_string : {
		    fields : [
			'twitter.profile'
		    ],
		    query : search
		}
	    }
	}, function (err, data) {
	    done(err,data);
	    console.log(data);
	});
	*/

	var res = [];

	res[0] = {value: "foo", url: "/bar"};

	done(null, res);
    });
			  
    if(res.error)
    {
	throw new Meteor.Error(401, res.error.message);
    }
    else
    {
	console.log(res);
	return JSON.stringify(res.result);
    }
        
});



Meteor.Router.add('/mongo/schema/:database/:collection', function(database, collection){
    
    return JSON.stringify(Greenlight.Helpers.analyze_schema(serverUrl, database, collection));
    
});

Meteor.Router.add('/mongo/data', function(database){

    var res = Meteor.sync(function(done){
	MongoClient.connect(serverUrl, function(err, db) {
	    if(err) throw err;
	    
	    db.executeDbCommand({'listDatabases':1}, function(err, doc) { 
		done(err,doc.documents[0].databases);
	    });
	    
	})
    });

    if(res.error)
    {
	throw new Meteor.Error(401, res.error.message);
    }
    else
    {
	return JSON.stringify(res.result);
    }


});


Meteor.Router.add('/mongo/data/:database', function(database){

    var res = Meteor.sync(function(done){
	MongoClient.connect(serverUrl+database, function(err, db) {
	    if(err) throw err;
	    
	    db.collectionNames(function(err, collections){
		done(err, collections);
	    });
	    
	})
    });

    if(res.error)
    {
	throw new Meteor.Error(401, res.error.message);
    }
    else
    {
	return JSON.stringify(res.result);
    }


});

Meteor.Router.add('/mongo/data/:database/:collection', function(database,coll){

    var res = Meteor.sync(function(done){
	MongoClient.connect(serverUrl + database, function(err, db) {
	    
	    if(err) 
	    {
		throw err;
	    }
	    
	    db.collection(coll)
		.find({})
		.limit(10)
		.toArray(function(err, docs) {
		    done(err, docs);
		});
	});
    });

    if(res.error)
    {
	throw new Meteor.Error(401, res.error.message);
    }
    else
    {
	return JSON.stringify(res.result);
    }
});
    
Meteor.Router.add('/mongo/data/:database/:collection/:id', function(database,coll,id){

    var res = Meteor.sync(function(done){
	MongoClient.connect(serverUrl+database, function(err, db) {
	    if(err) 
	    {
		throw err;
	    }

	    var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
	    
	    if(checkForHexRegExp.test(id))
	    {
		db.collection(coll)
		    .findOne({'_id':new BSON.ObjectID(id)}, 
			     function(err, docs)
			     {
				 done(err, docs);
			     });
	    }
	    else
	    {
		db.collection(coll)
		    .findOne({'_id':id}, 
			     function(err, docs) {
				 done(err, docs);
			     });
	    }
	});
    });

    if(res.error)
    {
	throw new Meteor.Error(401, res.error.message);
    }
    else
    {
	return JSON.stringify(res.result);
    }
});

// deprecated
Meteor.methods({

    databases : function(server)
    {
	Greenlight.Helpers.load_databases(server);
	
	return;
    },

    load : function(server, database, collection, query, start, count)
    {
	Greenlight.Helpers.load_data(server, database, collection, query, start, count);

	return;
    },

    item : function(server, database, collection, id)
    {
	Greenlight.Helpers.load_item(server, database, collection, id);
	
	return;
    }
});