var mongo = Npm.require('mongodb');
var ObjectID = Npm.require('mongodb').ObjectID;
var Binary = Npm.require('mongodb').Binary;

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});

var getSchema = function(database, collection)
{
    if (typeof limit === "undefined") { var limit = 10000; }
    
    if (typeof maxDepth === "undefined") { var maxDepth = 99; }
    
    varietyCanHaveChildren = function (v) {
	var isArray = v && 
            typeof v === 'object' && 
            typeof v.length === 'number' && 
            !(v.propertyIsEnumerable('length'));
	var isObject = typeof v === 'object';
	var specialObject = v instanceof Date || 
            v instanceof ObjectID ||
            v instanceof Binary;
	return !specialObject && (isArray || isObject);
    }
    
    varietyTypeOf = function(thing) {
	if (typeof thing === "undefined") { throw "varietyTypeOf() requires an argument"; }
	
	if (typeof thing !== "object") {  
	    return (typeof thing)[0].toUpperCase() + (typeof thing).slice(1);
	}
	else {
	    if (thing && thing.constructor === Array) { 
		return "Array";
	    }
	    else if (thing === null) {
		return "null";
	    }
	    else if (thing instanceof Date) {
		return "Date";
	    }
	    else if (thing instanceof ObjectID) {
		return "ObjectID";
	    }
	    else if (thing instanceof Binary) {
		var binDataTypes = {};
		binDataTypes[0x00] = "generic";
		binDataTypes[0x01] = "function";
		binDataTypes[0x02] = "old";
		binDataTypes[0x03] = "UUID";
		binDataTypes[0x05] = "MD5";
		binDataTypes[0x80] = "user";
		return "BinData-" + binDataTypes[thing.subtype()];
	    }
	    else {
		return "Object";
	    }
	}
    }
    
    var addTypeToArray = function(arr, value) {
	var t = varietyTypeOf(value);
	var found = false;
	for(var i=0; i< arr.length; i++) {
	    if(arr[i] == t) {
		found = true;
		break;
	    }
	}
	if(!found) {
	    arr.push(t);
	}
    }
    
    var addRecordResult = function(key, value, result) {
	cur = result[key];
	if(cur == null) {
	    result[key] = {"_id":{"key":key},"value": {"type": varietyTypeOf(value)}, totalOccurrences:1};
	} else {
	    var type = varietyTypeOf(value);
	    if(cur.value.type != type) {
		cur.value.types = [cur.value.type];
		delete cur.value["type"];
		addTypeToArray(cur.value.types, type);
	    } else if(!cur.value.type) {
		addTypeToArray(cur.value.types, type);
	    }
	    result[key] = cur;
	}
    }
    
    var mapRecursive = function(parentKey, obj, level, result) {
	for (var key in obj) {
	    if(obj.hasOwnProperty(key)) {
		var value = obj[key];
		key = (parentKey + "." + key).replace(/\.\d+/g,'.XX');
		addRecordResult(key, value, result);
		if (level < maxDepth - 1 && varietyCanHaveChildren(value)) {
		    mapRecursive(key, value, level + 1, result);
		}
	    }
	}
    }
    
    var varietyResults = {};
    var numDocuments = 0;

    var addVarietyResults = function(result) {
	for(var key in result) {
	    if(result.hasOwnProperty(key)) {
		cur = varietyResults[key];
		var value = result[key];
		if(cur == null) {
		    varietyResults[key] = value;
		} else {
		    if(value.type && value.type == cur.value.type) {
			
		    } else {
			for(type in value.types) {
			    if(cur.value.type != type) {
				cur.value.types = [cur.value.type];
				delete cur.value["type"];
				addTypeToArray(cur.value.types, type);
			    } else if(!cur.value.type) {
				addTypeToArray(cur.value.types, type);
			    }
			}
		    }
		    cur.totalOccurrences++;
		    varietyResults[key] = cur;
		}
	    }
	}
    }

    var MongoClient = mongo.MongoClient;    
    
    var res = Meteor.sync(function(done){
	MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
	    
	    // main cursor
	    db.collection(collection).find().limit(limit).each(function(err,obj) {

		if(obj == null)
		{
		    done(err, varietyResults);
		}
		var recordResult = {};
		numDocuments++;
		for (var key in obj) {
		    if(obj.hasOwnProperty(key)) {
			var value = obj[key];
			addRecordResult(key, value, recordResult);
			if (maxDepth > 1 && varietyCanHaveChildren(value)) {
			    mapRecursive(key, value, 1, recordResult);
			}
		    }
		}
		addVarietyResults(recordResult);
	    });
	});
    });


    if(res.error)
    {
	throw new Meteor.Error(401, res.error.message);
    }
    else
    {
	var fields = res.result;
	
	for(var key in fields)
	{
	    fields[key].ratio = fields[key].totalOccurrences / numDocuments;
	}
	
	return res.result;
    }
    
}

Meteor.Router.add('/schema/:database/:collection', function(database, collection){
    
    return JSON.stringify(getSchema(database, collection));
    
});

Meteor.Router.add('/data', function(database){

    var MongoClient = mongo.MongoClient;    
    
    var res = Meteor.sync(function(done){
	MongoClient.connect('mongodb://127.0.0.1:27017/', function(err, db) {
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

    var MongoClient = mongo.MongoClient;    
    
    var res = Meteor.sync(function(done){
	MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
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
	//console.log(res.result);
	return JSON.stringify(res.result);
    }


});

Meteor.Router.add('/data/:database/:collection', function(database,coll){

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
	//console.log(res.result);
	return JSON.stringify(res.result);
    }
});
    
Meteor.Router.add('/data/:database/:collection/:id', function(database,coll,id){

    var MongoClient = mongo.MongoClient;    
    
    var res = Meteor.sync(function(done){
	MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
	    if(err) throw err;

	    //console.log(id);
	    
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
	//console.log(res.result);
	return JSON.stringify(res.result);
    }
});

Meteor.methods({

    schema : function(database, collection)
    {
	var s = getSchema(database, collection);

	return s;
    },

    databases : function()
    {
	var mongo = Npm.require('mongodb');
	var Fiber = Npm.require('fibers');
	
	var Server = mongo.Server,
	Db = mongo.Db,
	BSON = mongo.BSONPure;
	
	var server = new Server('localhost', 27017, {auto_reconnect: true});
	
	var MongoClient = mongo.MongoClient;    

	MongoClient.connect('mongodb://127.0.0.1:27017/', function(err, db) {
	    
	    if(err) throw err;
	    
	    db.executeDbCommand({'listDatabases':1}, function(err, doc) { 
		
		var databases = doc.documents[0].databases;
		
		for(var i = 0; i < databases.length; i++){
		    
		    var databaseParam = databases[i];

		    Fiber(function(database){
			
			var collections = Meteor.sync(function(done){
			    
			    MongoClient.connect('mongodb://127.0.0.1:27017/'+database.name, function(err, child) {
				
				if(err) throw err;
				
				child.collectionNames(function(err, collections){			    
				    done(err,collections);
				});
			    });
			});
			
			database.collections = collections.result;
			
			for(var j = 0; j < database.collections.length; j++)
			{
			    var name = database.collections[j].name;
			    var splits = name.split('.');

			    var databaseName = splits[0];
			    var collectionName = splits[1];

			    database.collections[j].database = databaseName;
			    database.collections[j].name = collectionName;
			}
			
			if(!Databases.findOne({ name : database.name }))
			{
			    Databases.insert(database);
			}

		    }).run(databaseParam);
		}
	    });
	});
    },

    load : function(database, collection, query, start, count)
    {
	var mongo = Npm.require('mongodb');
	var Fiber = Npm.require('fibers');
	
	var MongoClient = mongo.MongoClient;    
	
	Fiber(function(params){

	    var database = params[0];
	    var collection = params[1];
	    var query = params[2];
	    var start = params[3];
	    var count = params[4];
	    
	    var res = Meteor.sync(function(done){
		MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
		    if(err) throw err;
		    
		    db.collection(collection)
			.find(query)
			.limit(count)
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
		for(var i = 0; i < res.result.length; i++)
		{
		    res.result[i]._id = "" + res.result[i]._id;
		    res.result[i]._collection = collection;

		    if(!Data.findOne({_id : res.result[i]._id}))
		    {
			Data.insert(res.result[i]);
		    }
		}
	    }
	}).run([database, collection, query, start, count]);
	
	return;
    },

    item : function(database, collection, id)
    {
	var mongo = Npm.require('mongodb');
	var Fiber = Npm.require('fibers');
	
	var MongoClient = mongo.MongoClient;    
	
	Fiber(function(params){

	    var database = params[0];
	    var collection = params[1];
	    var id = params[2];
	    
	    var res = Meteor.sync(function(done){
		MongoClient.connect('mongodb://127.0.0.1:27017/'+database, function(err, db) {
		    if(err) throw err;
		    
		    db.collection(collection)
			.find({_id : id})
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
		for(var i = 0; i < res.result.length; i++)
		{
		    res.result[i]._id = "" + res.result[i]._id;
		    res.result[i]._collection = collection;

		    if(!Data.findOne({_id : res.result[i]._id}))
		    {
			Data.insert(res.result[i]);
		    }
		}
	    }
	}).run([database, collection, id]);
	
	return;
    }
});