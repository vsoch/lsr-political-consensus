Meteor.startup(function(){

	var handles = {};

	UserStatus.events.on('connectionLogout', function(fields){
		var username = Meteor.users.findOne(fields.userId).username;
		if (username != 'admin'){
			handles[username] = Meteor.setTimeout(function(){
				notifyDeath(username, fields.userId);
			}, Meteor.settings.public.logout_threshold);
		}
		
	});

	UserStatus.events.on('connectionLogin', function(fields){
		var username = Meteor.users.findOne(fields.userId).username;
		var uhandle = handles[username];
		if (typeof(uhandle) != 'undefined'){
			Meteor.clearTimeout(uhandle);
		}
		notifyRebirth(username);
	});

});