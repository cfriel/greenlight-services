var name = "services";
var version = "1.0";

Meteor.startup(function(){
    
    console.log("loading services package");
    
    Greenlight.register_template(name, version);
    
});