Template.instructions.rendered = function(){
	if (Session.get('screen') == null){
		Session.set('in_quiz',null);
		Session.set('screen',0);
		$('.instructions-0').show();
	} else {
		$('.instructions-'+Session.get('screen')).show();
	}
};

Template.instructions.helpers({
	in_quiz: function(){
		return Session.get('screen') == 3;
	},

	instructions_message: function(){
		return Session.get('instructions_message');
	},

	instruction_quiz_questions: function(){
		var quiz_data = Meteor.settings.public.instruction_quiz_questions;
		var to_return = [];
		for (var i = 0; i < quiz_data.length; i++){
			var question = quiz_data[i];
			var choices = [];
			for (var j = 0; j < question.choices.length; j++){
				choices.push({
						'choice_text': question.choices[j],
						'choice_idx': j,
						'prompt_idx': i
					});
			}
			to_return.push({
					'prompt': question['prompt'],
					'choices': choices
				});
		}
		return to_return;
	}
});

Template.instructions.events({

	'submit #instructions-continue': function(e,t){
		e.preventDefault();
		$('.instructions-'+Session.get('screen')).hide();
		Session.set('screen', Session.get('screen') + 1);
		$('.instructions-'+Session.get('screen')).show();
		Session.set('close_ditched_message', true);
		return false;
	},

	'submit #instruction-check': function(e,t){
		e.preventDefault();
		var answers = [];
		var answered_all = true;
		var quiz_data = Meteor.settings.public.instruction_quiz_questions;
		for (var i = 0; i < quiz_data.length; i++){
			var selector = 'input[name=question-'+String(i)+']:checked';

			if (typeof($(selector).val()) == 'undefined'){
				answered_all = false;
			}
		}
		if (answered_all){
			
			for (var i = 0; i < quiz_data.length; i++){
				var selector = 'input[name=question-'+String(i)+']:checked';
				answers.push($(selector).val());
				$(selector).prop('checked', false);
			}
			Session.set('form_message', null);
			Meteor.call('checkInstructionQuizAnswers', answers, function(err, data){
				
				if (data){
					Session.set('screen',0);
				}
				else {
					Session.set('instructions_message','Some of your answers are incorrect. Please read the instructions carefully and try again.');
					Session.set('screen',2);
					$('.instructions-3').hide();
					$('.instructions-2').show();
				}

			});

		} else {
			Session.set('form_message', 'Please answer all of the questions.');
		}
		return false;
	}
});

