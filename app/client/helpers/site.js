Template.login.events({
	'submit #game-login-form': function(e, t){
		e.preventDefault();
		var worker_id = $('#worker-id')[0].value;
		if (worker_id == ''){
			Session.set('login_message', 'Please enter your worker ID.');
		} else {
			Meteor.loginWithPassword(worker_id, 'worker', function(err){
				if (err){
					Session.set('login_message',
						'Error logging in, please check that your worker ID is correct.');
				} else {
					Session.set('login_message', null);
					return Router.go('/game');
				}
			});
		}
		return false;
	}
});

Template.siteBase.rendered = function(){
	if (!this.rendered){
		this.rendered = true;
		Template.siteBase.n_times_waited = 0;
	}
};

Template.siteBase.helpers({
	was_ditched: function(){
		var worker = Workers.findOne();
		if (worker){
			return worker.n_times_waited > 1;
		} else {
			return false;
		}
	},
	close_ditched_message: function(){
		var worker = Workers.findOne();
		if (worker){
			var n_times_waited = worker.n_times_waited;
			if (n_times_waited == Template.siteBase.n_times_waited){
				return Session.get('close_ditched_message')
			} else {
				Session.set('close_ditched_message', false);
				Template.siteBase.n_times_waited = n_times_waited;
				return false;
			}
		} else {
			return true;
		}
	}

});

Template.sonaLogin.events({
	'submit #sona-login-form': function(e, t){
		e.preventDefault();
		var sona_id = $('#sona-id')[0].value;
		if (sona_id == ''){
			Session.set('login_message', 'Please enter your sona ID.');
		} else {
			Meteor.call('updateSonaID', sona_id, function(err){
				if (err){
					Session.set('login_message', 
						'Error logging in, please try again');
				} else {
					Session.set('login_message', null);
					return Router.go('/game');
				}
			})
		}
		return false;
	}
});

