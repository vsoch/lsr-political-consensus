Template.practice.rendered = function(){
	if (Session.get('screen') == null){
		Session.set('screen',0);
		$('.instructions-0').show();
	} else {
		$('.instructions-' + Session.get('screen')).show();
	}

	if (!this.rendered){
		Session.set('n_turns_elapsed',0);
		this.rendered = true;
		
		Template.practice.handle = null;
	} else {
		Meteor.clearInterval(Template.practice.handle);
	}
};

Template.practice.helpers({

	prompt: function(){
		return Meteor.settings.public.practice_prompt;
	},

	your_turn: function(){
		return Session.get('n_turns_elapsed') == 2;
	},

	curr_idx: function(){
		var n_turns_elapsed = Session.get('n_turns_elapsed');
		var your_idx = Workers.findOne().player_number;
		var n_players = Meteor.settings.public.n_players;
		var player_idxes = [];
		for (var i = n_players - 1; i >= 0; i--){
			if (i != your_idx){
				player_idxes.push(i);
			}
		}
		player_idxes.splice(2, 0, your_idx);
		return String.fromCharCode(65 + player_idxes[n_turns_elapsed]);
	},

	is_inter_round: function(){
		var n_players = Meteor.settings.public.n_players;
		return n_players == Session.get('n_turns_elapsed');
	},

	responses: function(){
		var response_vals = Meteor.settings.public.practice_responses;
		var responses = [];
		var your_idx = Workers.findOne().player_number;
		var n_players = Meteor.settings.public.n_players;
		var values = Meteor.settings.public.values_per_choice;
		var player_idxes = [];
		for (var i = n_players - 1; i >= 0; i--){
			if (i != your_idx){
				player_idxes.push(i);
			}
		}
		var n_turns_elapsed = Session.get('n_turns_elapsed');
		player_idxes.splice(2, 0, your_idx); //everything is jank
		for (var i = 0; i < n_turns_elapsed; i++){
			var curr_choice = {};
			if (i < 2){
				curr_choice = response_vals[i];
			} else if (i == 2) {
				curr_choice = Session.get('player_choice');
			} else {
				curr_choice = response_vals[i - 1];
			}
			responses.push({
				curr_turn_idx: String.fromCharCode(player_idxes[i] + 65),
				choice: curr_choice + ' - ' + values[curr_choice - 1].value
			});
		}

		return responses; 
	}


});

Template.practice.events({
	'submit #practice-continue': function(e,t){

		e.preventDefault();
		if (Session.get('screen') >= 1){
			throw new Meteor.Error(403, 'Stop');
		} else {
			$('.instructions-0').hide();
			Session.set('screen', 1);
			$('.instructions-1').show();
			Meteor.setTimeout(function(){
			Session.set('n_turns_elapsed', Session.get('n_turns_elapsed') + 1);
			Meteor.setTimeout(function(){
					Session.set('n_turns_elapsed', Session.get('n_turns_elapsed') + 1);
				}, 5000 );
			}, 5000 );
		}
		return false;
	},

	'submit #practice-round-submit': function(e,t){
		e.preventDefault();
		if (Session.get('n_turns_elapsed') == 2){
			var selector = 'input[name=choice]:checked';
			var choice = $(selector).val();
			if (typeof(choice) == 'undefined'){
				Session.set('submit_message','Please select your answer');
			} else {
				Session.set('submit_message', null); 
				Session.set('player_choice', choice);
				$(selector).prop('checked', false);
				Session.set('n_turns_elapsed', Session.get('n_turns_elapsed') + 1);
				Template.practice.handle = Meteor.setInterval(function(){
					Session.set('n_turns_elapsed', Session.get('n_turns_elapsed') + 1);
					if (Template.practice.handle && Session.get('n_turns_elapsed') == Meteor.settings.public.n_players){
						Meteor.clearInterval(Template.practice.handle);
						Meteor.setTimeout(function(){
							Meteor.call('finishPractice');
						}, 5000);
					}
				}, 5000);
			}
		}
		return false;
	}
});