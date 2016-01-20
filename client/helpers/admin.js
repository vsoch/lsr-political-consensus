
Template.adminLogin.events({

	'submit #admin-login-form': function(e,t){
		
		e.preventDefault();
		var password = $('#admin-password')[0].value;
		if (password == ''){
			Session.set('login_message', 'Please enter a password');
		} else {
			Meteor.loginWithPassword('admin', password, function(err){
				if (err){
					Session.set('login_message', 'Error logging in, please try again');
				} else {
					Session.set('login_message', null);
					return Router.go('admin');
				}
			});
		}
		return false;

	}
});

Template.admin.helpers({

	sona_settings: function(){
		var globals = Globals.findOne({});
		if (globals){
			return {
					sona_lib_id: globals.sona_lib_id,
					sona_lib_cred_token: globals.sona_lib_cred_token,
					sona_cons_id: globals.sona_cons_id,
					sona_cons_cred_token: globals.sona_cons_cred_token
				};
		} else {
			return null;
		}
	}
});

Template.admin.events({

	'submit #edit-sona-settings': function(e,t){

		e.preventDefault();
		var sona_settings = {};

		$('#edit-sona-settings').find(':input').each(function(){
			if ($(this).val() != ''){
				if (typeof($(this).attr('id')) != 'undefined')
					sona_settings[$(this).attr('id')] = $(this).val();
			};
		});

		Meteor.call('updateSonaSettings', sona_settings);
		return false;
	}
});









