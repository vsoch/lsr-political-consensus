Template.registerHelper('login_message', function(){
	return Session.get('login_message');
});

Template.registerHelper('form_message', function(){
	return Session.get('form_message');
});

Template.registerHelper('submit_message', function(){
	return Session.get('submit_message');
});

Template.registerHelper('n_players', function(){
	return Meteor.settings.public.n_players;
});

Template.registerHelper('n_other_players', function(){
	return Meteor.settings.public.n_players - 1;
});

Template.registerHelper('other_player_string', function(){

	var other_players = "Players ";
	var n_players = Meteor.settings.public.n_players;
	for (var i = 0; i < n_players - 1; i++){
		other_players += String.fromCharCode(i + 65) + ', ';
	}
	other_players += 'and '+String.fromCharCode(n_players - 1 + 65);
	return other_players;
	
});

Template.registerHelper('affiliation', function(){
	return Workers.findOne().affiliation;
});

Template.registerHelper('cap_affiliation', function(){
	var affl = Workers.findOne().affiliation;
	return affl.charAt(0).toUpperCase() + affl.substr(1);
});

Template.registerHelper('other_affiliation', function(){
	var affl = Workers.findOne().affiliation;
	if (affl == 'liberal'){
		return 'conservative';
	} else if (affl == 'conservative'){
		return 'liberal';
	}
});

Template.registerHelper('turn_idx', function(){
	return String.fromCharCode(Workers.findOne().player_number + 65); 
});

Template.registerHelper('n_rounds', function(){
	return Meteor.settings.public.rounds.length;
});


Template.registerHelper('choices_per_question', function(){
	return Meteor.settings.public.values_per_choice.length;
});


Template.registerHelper('min_opinion', function(){
	return Meteor.settings.public.values_per_choice[0].value;
});

Template.registerHelper('max_opinion', function(){
	var values = Meteor.settings.public.values_per_choice;
	return values[values.length - 1].value;
});

Template.registerHelper('optionrange', function(){
	var n_choices = Meteor.settings.public.values_per_choice.length;
	var toReturn = [];
	for (var i = 0; i < n_choices; i++){
		toReturn.push({index: i+1});
	}
	return toReturn;
});

Template.registerHelper('values_per_choice', function(){
	return Meteor.settings.public.values_per_choice;
});

Template.siteBase.helpers({
	player_missing: function(){
		var worker = Workers.findOne();
		if (!worker || worker.status == 'waiting'){
			return false;
		}
		var game = Games.findOne();
		if (game && game.inactive_workers) {
			return (Object.keys(game.inactive_workers).length >= 1 &&
					game.status != 'completed' && game.status != 'killed');
		} else {	
			return false;
		}
	},

	exit_bar_message: function(){
		var worker = Workers.findOne();
		if (worker){
			if (worker.status == 'playing' || worker.status == 'waitingforgame'){
				return 'terminate this game';
			} else {
				return 'get assigned to another game';
			}
		} else {
			return '';
		}
	}
});

Template.siteBase.events({
	'submit #exit-form': function(e,t){
		e.preventDefault();
		var worker = Workers.findOne();
		if (worker.status == 'waiting'){
			Meteor.call('removeSinglePlayerMethod');
		} else if (worker.status == 'playing'){
			Meteor.call('killGame');
		} else if (worker.status == 'summary' || 
				   worker.status == 'postsurvey' ||
				   worker.status == 'exited'){
			throw new Meteor.Error(403, 'Stop');
		} else {
			Meteor.call('relocatePlayers');
		}

		return false;
	}
});



