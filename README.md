greenlight-services
===================

Greenlight services site template.  Includes restful functionality to list databases, collections, and items within collections, retrieve items by id, and guess the document schema for the collection.

Services are routed from -

/data/ - list the databases
/data/:database - list the collections in database
/data/:database/:collection - list the documents for collection
/data/:database/:collection/:id - retrieve the document from collection by id

/schema/:database/:collection - introspect the schema for collection by sampling documents


