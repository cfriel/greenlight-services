var mongo = Npm.require('mongodb');
var ObjectID = Npm.require('mongodb').ObjectID;
var Binary = Npm.require('mongodb').Binary;

var MongoClient = mongo.MongoClient;    
var Server = mongo.Server;
var Db = mongo.Db;
var BSON = mongo.BSONPure;

var serverUrl = 'mongodb://127.0.0.1:27017/';

Meteor.Router.add('/schema/:database/:collection', function(database, collection){
    
    return JSON.stringify(Greenlight.Helpers.analyze_schema(serverUrl, database, collection));
    
});

Meteor.Router.add('/data', function(database){

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


Meteor.Router.add('/data/:database', function(database){

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

Meteor.Router.add('/data/:database/:collection', function(database,coll){

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
	//console.log(res.result);
	return JSON.stringify(res.result);
    }
});
    
Meteor.Router.add('/data/:database/:collection/:id', function(database,coll,id){

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

Meteor.methods({

    schema : function(database, collection)
    {
	var s = getSchema(database, collection);

	return s;
    },

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