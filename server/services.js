var name = "services";
var version = "1.0";

services = function(){};

services.prototype = new services();

Services = services.prototype;

Meteor.startup(function(){
    
    console.log("loading services package");
    
    Greenlight.register_template(name, version, Services);
    
});