var name = "services";
var version = "1.0";

Meteor.startup(function(){
    
    console.log("loading services package");
    
    if(!SiteTemplates.findOne( { name: name, version: version }))
    {
	console.log("registering " + name + " site template");
	SiteTemplates.insert( { name : name, version : version } );
	Greenlight.register_template(name, version);
    }
    
});