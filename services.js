var mongo = Npm.require('mongodb');

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});

Meteor.Router.add('/services/:database/:collection', function(database,coll){

    var MongoClient = mongo.MongoClient;    
    
    var res = Meteor.sync(function(done){
	MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
	    if(err) throw err;
	    
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
	console.log(res.result);
	return JSON.stringify(res.result);
    }
});
    
Meteor.Router.add('/services/:database/:collection/:id', function(database,coll,id){

    var MongoClient = mongo.MongoClient;    
    
    var res = Meteor.sync(function(done){
	MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
	    if(err) throw err;
	    
	    db.collection(coll)
		.find({'_id':new BSON.ObjectID(id)})
		.limit(1)
		.toArray(function(err, docs) {
		    done(err, docs[0]);
		});
	});
    });

    if(res.error)
    {
	throw new Meteor.Error(401, res.error.message);
    }
    else
    {
	console.log(res.result);
	return JSON.stringify(res.result);
    }
});