Meteor.reactivePublish('worker', function(){
	if (!this.userId) return this.ready();
	var user = Meteor.users.findOne(this.userId);
	if (user.username == 'admin'){
		return this.ready();
	}
	var worker = Workers.findOne(user.username);
	if (typeof(worker.post_game_responses.adequately_debriefed) != 'undefined'){
		return Workers.find(user.username);
	} else {
		return Workers.find(user.username, {fields: {'private': 0}});
	}
});

Meteor.reactivePublish('game', function(){
	if (!this.userId) return this.ready();
	var user = Meteor.users.findOne(this.userId);
	if (user.username == 'admin'){
		return this.ready();
	}
	var gameId = Workers.findOne(user.username, {reactive: true}).game_id;
	if (typeof(gameId) == 'undefined' || gameId == null){
		return this.ready();
	}
	return Games.find(gameId);
});

Meteor.reactivePublish('responses', function(){
	if (!this.userId) return this.ready();
	var user = Meteor.users.findOne(this.userId);
	if (user.username == 'admin'){
		return this.ready();
	}
	var worker = Workers.findOne(user.username);
	var gameId = Workers.findOne(user.username, {reactive: true}).game_id;
	if (typeof(gameId) == 'undefined' || gameId == null){
		return this.ready();
	}
	return Responses.find({game_id: gameId});
});

Meteor.reactivePublish('globals', function(){
	if (!this.userId) return this.ready();
	if (Meteor.users.findOne(this.userId).username == 'admin') {
		return Globals.find();
	} else {
		return this.ready();
	}
});