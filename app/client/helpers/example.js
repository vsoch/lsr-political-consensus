Template.example.rendered = function(){
	if (Session.get('screen') == null){
		Session.set('screen',0);
		$('.instructions-0').show();
		$('.outline-0').css({'border-style':'solid','border-color': 'blue'});
	} else {
		$('.instructions-'+Session.get('screen')).show();
		$('.outline-'+Session.get('screen')).css({'border-style':'solid','border-color': 'blue'});
	}
};

Template.example.helpers({
	B: function(){
		var b_idx = (Workers.findOne().player_number +3) % 4;
		return String.fromCharCode(65 + b_idx);
	},

	D: function(){
		var d_idx = (Workers.findOne().player_number + 1) % 4;
		return String.fromCharCode(65 + d_idx);
	}

});

Template.example.events({
	'submit #example-continue': function(e,t){

		e.preventDefault();
		if (Session.get('screen') == 3){
			Session.set('screen',0);	
			Meteor.call('advanceToPractice');
		} else {
			$('.instructions-'+Session.get('screen')).hide();
			$('.outline-'+Session.get('screen')).css({'border-style':'none'});
			Session.set('screen', Session.get('screen') + 1);
			$('.instructions-'+Session.get('screen')).show();
			$('.outline-'+Session.get('screen')).css({'border-style':'solid','border-color': 'blue'});
		}
		return false;
	}
});