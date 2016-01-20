Template.consentForm.helpers({
	n_other_players: function(){
		return Meteor.settings.public.n_players - 1;
	}
});

Template.consentForm.events({
	'submit #consent-form': function(e,t){
		e.preventDefault();
		var response = $("input[name=consent-response]:checked").val();
		Session.set('close_ditched_message', true);
		if (typeof(response) == 'undefined'){
			Session.set('form_message','Please select yes or no');
		} else {
			var consented = ($("input[name=consent-response]:checked").val() == 'yes');
			$("input[name=consent-response]:checked").prop('checked', false);
			Session.set('form_message', null);
			Meteor.call('registerConsentResponse', consented);
			Meteor.subscribe('game');
			Meteor.subscribe('responses');
		}
		return false;
	}
});


Template.waitingForPlayers.helpers({
	was_ditched: function(){
		return Workers.findOne().n_times_waited > 1;
	},

	n_other_players: function(){
		return Meteor.settings.public.n_players - 1;
	},

	num_waiting_on: function(){
		if (Games.findOne())
			return Meteor.settings.public.n_players - Games.findOne().players.length;
	},

	person_word: function(){
		if (Games.findOne()){
			var num_waiting_on = Meteor.settings.public.n_players - Games.findOne().players.length;
			if (num_waiting_on > 1){
				return 'people';
			} else {
				return 'person';
			}
		}
	},

	impatient: function(){
		return Session.get('is_impatient_waitforplayers');
	}
});

Template.waitingForPlayers.events({
	'submit #impatient-form': function(e,t){
		e.preventDefault();
		Session.set('is_impatient_waitforplayers', true);
		return false;
	},

	'submit #leave-form': function(e,t){
		e.preventDefault();
		Meteor.call('removeSinglePlayer');
		return false;
	}
});

Template.waitingForGameStart.helpers({

	num_waiting_on: function(){
		return Meteor.settings.public.n_players - Games.findOne().num_players_instructed;
	},

	player_is_ready: function(){
		return Workers.findOne().is_ready;
	},

	player_word: function(){
		var num_waiting_on = Meteor.settings.public.n_players - Games.findOne().num_players_instructed;
		if (num_waiting_on == 1){
			return 'player';
		} else {
			return 'players';
		}
	},

	impatient: function(){
		return Session.get('is_impatient_waitforgame');
	}
});

Template.waitingForGameStart.events({
	'submit #impatient-form': function(e,t){
		e.preventDefault();
		Session.set('is_impatient_waitforgame', true);
		return false;
	},

	'submit #leave-form': function(e,t){
		e.preventDefault();
		Meteor.call('relocatePlayers');
		return false;
	},

	impatient: function(){
		return Session.get('is_impatient_game');
	},

	'submit #ready-form': function(e,t){
		e.preventDefault();
		Meteor.call('playerReady');
		return false;
	}
});

Template.game.helpers({

	is_inter_round: function(){
		return Games.findOne().is_inter_round;
	},

	your_turn: function(){
		var your_turn = Workers.findOne().is_current_turn;
		if (your_turn && !Template.game.start_time){
			Session.set('is_impatient_game', false);
			Template.game.start_time = new Date();
		}
		return your_turn;
	},

	round_idx: function(){
		Session.set('is_impatient_game', false);
		return Games.findOne().curr_round + 1;
	},

	prompt: function(){
		var game = Games.findOne();
		var current_round = game.round_order[game.curr_round];
		return Meteor.settings.public.rounds[current_round].prompt;
	},

	curr_idx: function(){
		var game = Games.findOne();
		var curr_turn = game.curr_turn;
		var round = game.round_order[game.curr_round];
		var curr_turn_idx = Meteor.settings.public.rounds[round].order[curr_turn];
		return String.fromCharCode(curr_turn_idx + 65);
	},

	responses: function(){
		var game = Games.findOne();
		var curr_round = game.curr_round;
		var values = Meteor.settings.public.values_per_choice;
		var toReturn = [];
		Responses.find(
				{round: curr_round},
				{sort: {turn: 1}}).forEach(function(item){
					toReturn.push({
						curr_turn_idx: String.fromCharCode(item.player + 65),
						choice: item.choice + ' - ' + values[item.choice - 1].value,
						time: item.time
					})
				});
		return toReturn;
	},

	impatient: function(){
		return Session.get('is_impatient_game');
	}



});

Template.game.events({
	'submit #round-submit': function(e,t){
		e.preventDefault();
		var selector = 'input[name=choice]:checked';
		var choice = $(selector).val();
		if (typeof(choice) == 'undefined'){
			Session.set('submit_message','Please select your answer');
		} else {
			$(selector).prop('checked', false);
			var end_time = new Date();
			var timediff = end_time - Template.game.start_time;
			//console.log(end_time - start_time);
			Template.game.start_time = null;
			//Session.set('your_turn', false);
			Meteor.call('submitResponse', choice, timediff);
		}
		return false;
	},

	'submit #impatient-form': function(e,t){
		e.preventDefault();
		Session.set('is_impatient_game', true);
		return false;
	},

	'submit #leave-form': function(e,t){
		e.preventDefault();
		Meteor.call('killGame');
		return false;
	}

});

Template.summary.helpers({
	rounds: function(){
		var toReturn = [];
		var rounds = Meteor.settings.public.rounds;
		var round_order = Games.findOne({}).round_order;
		var values = Meteor.settings.public.values_per_choice;
		for (var i = 0; i < rounds.length; i++){
			var responses = [];
			Responses.find({round: i}, 
					{sort: {turn: 1}}).forEach(function(item){
						responses.push({
							curr_turn_idx: String.fromCharCode(item.player+65),
							choice: item.choice + '-' + values[item.choice-1].value,
							time: item.time
						})
					});
			var roundItem = {
					round_idx: i+1,
					prompt: rounds[round_order[i]].prompt,
					responses: responses 
				};
			toReturn.push(roundItem);
		}
		return toReturn;
	}
});

Template.summary.events({
	'submit #summary-continue': function(e,t){
		e.preventDefault();
		Meteor.call('finishSummary', new Date());
		return false;
	}
});

Template.exitScreen.helpers({
	noconsent: function(){
		return Workers.findOne().exit_reason == 'noconsent';
	},

	dead: function(){
		return Workers.findOne().exit_reason == 'killed' || Workers.findOne().exit_reason == 'quit';
	},

	killed: function(){
		return Workers.findOne().exit_reason == 'killed';
	},

	is_mturk: function(){
		return Workers.findOne().source == 'mturk';
	},

	answered_end_survey: function(){
		return typeof(Workers.findOne().post_game_responses.adequately_debriefed) != 'undefined';
	},

	completion_code: function(){
		var worker = Workers.findOne();
		if (worker.private){
			return worker.private.completion_code;
		} else {
			return null;
		}
	},

	sona_url: function(){
		var worker = Workers.findOne();
		if (worker.private){
			return worker.private.completion_url;
		} else {
			return null;
		}
	}
});



Template.postsurvey.events({
	'submit #postsurvey-form': function(e,t){
		e.preventDefault();
		var postsurvey_weird = $('#postsurvey-weird').val();
		var postsurvey_comments = $('#postsurvey-comments').val();
		Meteor.call('logPostsurveyResponse', postsurvey_weird, postsurvey_comments);
		return false;
	}
});

Template.exitScreen.events({

	'submit #enough-form': function(e,t){
		e.preventDefault();
		var response = $("input[name=enough-response]:checked").val();
		if (typeof(response) == 'undefined'){
			Session.set('form_message', 'Please select yes or no');
		} else {
			var adequate = (response == 'Yes');
			$("input[name=enough-response]:checked").prop('checked', false);
			Meteor.call('logEnoughResponse',adequate);
			Meteor.subscribe('worker');
			Session.set('form_message', null);
		}
		return false;
	}

});