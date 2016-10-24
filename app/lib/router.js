Router.configure({
	loadingTemplate: 'loading',
	notFoundTemplate: 'notFound'
});

LoginController = RouteController.extend({

	onBeforeAction: function(){
		if (!Meteor.user()){
			if (Meteor.loggingIn()){
				this.render(this.loadingTemplate);
			} else {
				this.next();
			}
		} else if (Meteor.user().username == 'admin'){
			Router.go('admin');
		} else {
			Router.go('game');
		}
	}

});

AdminController = RouteController.extend({

	layoutTemplate: 'adminBase',
	onBeforeAction: function(){
		if (!Meteor.user()){
			if (Meteor.loggingIn()){
				this.render(this.loadingTemplate);
			} else {
				Router.go('adminLogin');
			}
		} else if (Meteor.user().username != 'admin'){
			this.render('accessDenied');
		} else {
			this.next();
		}
	}

});

GameController = RouteController.extend({
	layoutTemplate: 'siteBase',
	onBeforeAction: function(){
		if (! Meteor.user()) {
			if (Meteor.loggingIn()){
				this.render(this.loadingTemplate);
			} else {
				Router.go('login');
			}
		} else if (Meteor.user().username == 'admin'){
			Router.go('admin');
		} else {
			this.next();
		}
	}
});

Router.route('/', {
	name: 'home',
	layoutTemplate: 'siteBase'
});

Router.route('/admin-login', {
	name: 'adminLogin',
	layoutTemplate: 'adminBase',
	controller: LoginController
});

Router.route('/admin', {
	name: 'admin',
	controller: AdminController,
	waitOn: function(){
		return Meteor.subscribe('globals');
	}
});

Router.route('/postgame', {
	layoutTemplate: 'siteBase',
	waitOn: function(){
		return Meteor.subscribe('worker');
	},
	action: function(){
		this.render('interactionQuestions');
	}
});

Router.route('/start', {
	layoutTemplate: 'siteBase',
	onBeforeAction: function(){
		if (this.params.query.source == 'mturk'){
			var worker_id = this.params.query.worker_id;
			Meteor.call('createNewWorker', worker_id,
				this.params.query.experiment_id, 'mturk', function(err){
					if (err){
						Router.go('/login');
					} else {
						Meteor.loginWithPassword(worker_id, 'worker', function(err){
							if (err){
								Router.go('/login');
							} else {
								Router.go('/game');
							}
						});
					}
				});
		} else if (this.params.query.source == 'sona') {
			var worker_id = this.params.query.survey_code;
			Meteor.call('createNewWorker', worker_id, this.params.query.experiment_id,
				'sona', this.params.query.survey_code, function(err){
					if (err){
						Router.go('/login');
					} else {
						Meteor.loginWithPassword(worker_id, 'worker', function(err){
							if (err){
								Router.go('/login');
							} else {
								Router.go('/sona-login');
							}
						})
					}
				});
		}
	}
});

Router.route('/login', {
	name: 'login',
	layoutTemplate: 'siteBase',
	controller: LoginController
});

Router.route('/sona-login', {
	name: 'sonaLogin',
	layoutTemplate: 'siteBase'
});

Router.route('/game', {
	name: 'game',
	controller: GameController,
	waitOn: function(){
		return [Meteor.subscribe('worker'), 
				Meteor.subscribe('game'), 
				Meteor.subscribe('responses')];
	},
	action: function(){
		var worker = Workers.findOne();
		if (worker.status == 'registered'){
			this.render('consentForm');
		} else if (worker.status == 'exited'){
			this.render('exitScreen')
		} else {
			var game = Games.findOne({});
			if (worker.status == 'waiting'){
				this.render('waitingForPlayers');
			} else if (worker.status == 'instructions') {
				this.render('instructions');
			} else if (worker.status == 'example') {
				this.render('example');
			} else if (worker.status == 'practice'){
				this.render('practice');
			} else if (worker.status == 'waitingforgame'){
				this.render('waitingForGameStart');
			} else if (worker.status == 'playing'){
				this.render('game');
			} else if (worker.status == 'summary'){
				this.render('summary');
			} else if (worker.status == 'postsurvey') {
				this.render('postsurvey');
			} else if (worker.status == 'postsurvey2') {
				this.render('postsurvey2');
			} else if (worker.status == 'additionalqs'){
				this.render('additionalQuestions');
			} else if (worker.status == 'feelqs'){
				this.render('feelQuestions');
			} else if (worker.status == 'interactionqs'){
				this.render('interactionQuestions');
			} else {
				console.log('uncharted territory');
			}
		}
	}
});


Router.route('/results', {
	where: 'server',
	name: 'results',
	action: function(){
		var headers = {
			'Content-type': 'text/csv',
			'Content-Disposition': 'attachment; filename=results.csv'
		};
		this.response.writeHead(200, headers);
		return this.response.end(writeResultFile());
	}
});

Router.route('/additionalQuestions', {
	where: 'server',
	name: 'additionalQuestions',
	action: function(){
		var headers = {
			'Content-type': 'text/csv',
			'Content-Disposition': 'attachment; filename=additionalQuestions.csv'
		};
		this.response.writeHead(200, headers);
		return this.response.end(writePostgameFile());
	}
});









