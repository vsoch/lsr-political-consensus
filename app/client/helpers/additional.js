Template.additionalQuestions.helpers({
	optionrange: function(){
		return Meteor.settings.public.values_per_end_choice;
	},

	optionrange_chart: function(){
		return Meteor.settings.public.values_per_end_choice_chart;
	},

	question: function(){
		var questions = Meteor.settings.public.additional_questions;
		var toReturn = [];

		var affl = Workers.findOne().affiliation;
		var cap_affl = affl.charAt(0).toUpperCase() + affl.substr(1);
		var other_affl = {};
		if (affl == 'liberal'){
			other_affl = 'conservative';
		} else if (affl == 'conservative'){
			other_affl = 'liberal';
		}
		questions.forEach(function(item, idx){
			var choices = [];
			for (var i = 0; i < Meteor.settings.public.values_per_end_choice.length; i++){
				choices.push({'value': i+1, 'idx': idx});
			}
				toReturn.push({'choices': choices, 
					'text': item.replace('{{affiliation}}', affl)
								.replace('{{cap_affiliation}}', cap_affl)
								.replace('{{other_affiliation}}', other_affl)});
			});
		return toReturn;
	},

	chart_question: function(){
		var n_earlier_questions = Meteor.settings.public.additional_questions.length;
		var questions = Meteor.settings.public.additional_questions_chart;
		var toReturn = [];
		
		var affl = Workers.findOne().affiliation;
		var cap_affl = affl.charAt(0).toUpperCase() + affl.substr(1);
		var other_affl = {};
		if (affl == 'liberal'){
			other_affl = 'conservative';
		} else if (affl == 'conservative'){
			other_affl = 'liberal';
		}
		questions.forEach(function(item, idx){
			var choices = [];
			for (var i = 0; i < Meteor.settings.public.values_per_end_choice_chart.length; i++){
				choices.push({'value': i+1, 'idx': idx});
			}
				toReturn.push({'choices': choices, 
					'text': item.replace('{{affiliation}}', affl)
								.replace('{{cap_affiliation}}', cap_affl)
								.replace('{{other_affiliation}}', other_affl)});
			});
		return toReturn;
	},

	post_form_message: function(){
		return Session.get('post_form_message');
	}

});

Template.feelQuestions.helpers({
	optionrange: function(){
		return Meteor.settings.public.values_per_feel_choice;
	},

	question: function(){
		var questions = Meteor.settings.public.feel_questions;
		var toReturn = [];

		questions.forEach(function(item, idx){
			var choices = [];
			for (var i = 0; i < Meteor.settings.public.values_per_feel_choice.length; i++){
				choices.push({'value': i+1, 'idx': idx});
			}
				toReturn.push({'choices': choices, 
					'text': item});
			});
		return toReturn;
	},

	post_form_message: function(){
		return Session.get('post_form_message');
	}

});

Template.interactionQuestions.helpers({


	question: function(){
		var questions = Meteor.settings.public.interaction_questions;
		var toReturn = [];

		questions.forEach(function(item, idx){

			toReturn.push({'idx': idx, 
					'prompt': item});
			});
		return toReturn;
	},

	post_form_message: function(){
		return Session.get('post_form_message');
	}

});

Template.additionalQuestions.events({
	'submit #add-qs': function(e,t){
		e.preventDefault();
		var num_add_qs = Meteor.settings.public.additional_questions_chart.length;
		var responses = [];
		var answered_all = true;
		for (var i = 0; i < num_add_qs; i++){
			var selector = 'input[name=question-' + String(i) + ']:checked';
			if (typeof($(selector).val()) == 'undefined'){
				answered_all = false;
			}
		}
		if (answered_all){
			for (var i = 0; i < num_add_qs; i++){
				var selector = 'input[name=question-' + String(i) + ']:checked';
				responses.push($(selector).val());
				$(selector).prop('checked',false); 
			}
			Session.set('post_form_message', null);
			Meteor.call('logAdditionalResponse', responses);
		} else {
			Session.set('post_form_message', 'Please respond to all of the questions.')
		}

		
		return false;
	}
});

Template.feelQuestions.events({
	'submit #feel-qs': function(e,t){
		e.preventDefault();
		var num_add_qs = Meteor.settings.public.feel_questions.length;
		var responses = [];
		var answered_all = true;
		for (var i = 0; i < num_add_qs; i++){
			var selector = 'input[name=question-' + String(i) + ']:checked';
			if (typeof($(selector).val()) == 'undefined'){
				answered_all = false;
			}
		}
		if (answered_all){
			for (var i = 0; i < num_add_qs; i++){
				var selector = 'input[name=question-' + String(i) + ']:checked';
				responses.push($(selector).val());
				$(selector).prop('checked',false); 
			}
			Session.set('post_form_message', null);
			console.log(responses);
			Meteor.call('logFeelResponse', responses);
		} else {
			Session.set('post_form_message', 'Please respond to all of the questions.')
		}

		
		return false;
	}
});

Template.interactionQuestions.events({
	'submit #interaction-form': function(e,t){
		e.preventDefault();
		var num_add_qs = Meteor.settings.public.interaction_questions.length;
		var responses = [];
		var answered_all = true;
		for (var i = 0; i < num_add_qs; i++){
			var selector = '#interaction-' + String(i);
			if ($(selector).val() == ''){
				answered_all = false;
			}
		}
		if (answered_all){
			for (var i = 0; i < num_add_qs; i++){
				var selector = '#interaction-' + String(i);
				responses.push($(selector).val());
			}
			Session.set('post_form_message', null);
			console.log(responses);
			Meteor.call('logInteractionResponse', responses);
		} else {
			Session.set('post_form_message', 'Please respond to all of the questions.')
		}

		
		return false;
	}
});