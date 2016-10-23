Meteor.methods({

	updateSonaSettings: function(sona_dict){
		if (! Meteor.userId() || Meteor.user().username != 'admin'){
			throw new Meteor.Error(403, "you must be the admin to touch this");
		}
		Globals.upsert({},{$set:sona_dict});
	},

	createNewWorker: function(worker_id, experiment_id, source, survey_code){
		if (Meteor.userId() != null){
			throw new Meteor.Error(403, "You cannot create another user");
		}

		var affiliation = {};
		if (experiment_id == Globals.findOne({}).sona_lib_id){
			affiliation = 'liberal';
		} else if (experiment_id == Globals.findOne({}).sona_cons_id){
			affiliation = 'conservative';
		} else {
			throw new Meteor.Error(403, 
				"Nonexistent experiment ID, maybe we haven't posted studies yet!");
		}

		try {
			var uid = Accounts.createUser({
				username: worker_id,
				password: 'worker'
			});
			var completion_code = Random.id();
			var credit_token = {};
			if (affiliation == 'liberal'){
				credit_token = Globals.findOne({}).sona_lib_cred_token;
			} else {
				credit_token = Globals.findOne({}).sona_cons_cred_token;
			}

			var new_worker = {
				_id: worker_id,
				affiliation: affiliation,
				status: 'registered',
				source: source,
				n_times_waited: 0,
				is_current_turn: false,
				private: {
					completion_code: completion_code,
					completion_url: 'https://stanford-lsr.sona-systems.com/webstudy_credit.aspx?experiment_id=' + 
					experiment_id + '&credit_token=' + credit_token + '&survey_code=' + survey_code
				},
				post_game_responses: {}

			};

			Workers.insert(new_worker);
			return 0;
		} catch (err) {
			console.log('Failed to create worker ' + worker_id);
			console.log('Error: ');
			console.log(err);
			return 1
		}

	},

	updateSonaID: function(sona_id){
		if (! Meteor.userId()){
			throw new Meteor.Error(403, "No user currently logged in");
		}
		var old_id = Meteor.users.findOne(Meteor.userId()).username;
		Meteor.users.update({_id: Meteor.userId()}, {$set:{username: sona_id}});
		var worker_data = Workers.findOne(old_id);
		Workers.remove(old_id);
		worker_data._id = sona_id;
		Workers.insert(worker_data);
	},

	registerConsentResponse: function(consented){
		var user = Meteor.user();
		if (Workers.findOne(user.username).status != 'registered'){
			throw new Meteor.Error(403, 'Stop');
		}
		if (consented){
			Workers.upsert(user.username, {$inc: {n_times_waited: 1}});
			addWorkerToGame_safe(user.username);
			if (Workers.findOne(user.username).status == 'registered')
				Workers.update(user.username, {$set: {status: 'waiting'}})
		} else {
			Workers.upsert(user.username, {$set: {status: 'exited', exit_reason: 'noconsent'}});
		}
	},

	checkInstructionQuizAnswers: function(answers){
		var all_correct = true;
		var reference = Meteor.settings.instruction_quiz_answers;
		for (var i = 0; i < answers.length; i++){
			all_correct = (all_correct && (answers[i] == String(reference[i])));
		}
		if (all_correct){
			Workers.update(Meteor.user().username,{$set:{status: 'example'}});
		} 
		return all_correct;

	},

	advanceToPractice: function(){
		var user = Meteor.user();
		if (Workers.findOne(user.username).status != 'example'){
			throw new Meteor.Error(403, 'Stop');
		}
		Workers.update(user.username,{$set:{status: 'practice'}});
	},

	finishPractice: function(){
		var user = Meteor.user();
		var worker = Workers.findOne(user.username);
		if (worker.status != 'practice'){
			throw new Meteor.Error(403, 'Stop');
		}//todo: update game thing
		Workers.update(user.username, {$set: {status: 'waitingforgame'}});
		
	},

	playerReady: function(){
		var user = Meteor.user();
		var worker = Workers.findOne(user.username);
		if (!worker.is_ready && worker.status == 'waitingforgame'){
			Workers.update(user.username, {$set: {is_ready: true}});
			Games.update(worker.game_id, {$inc: {num_players_instructed: 1}});
			if (Games.findOne(worker.game_id).num_players_instructed == Meteor.settings.public.n_players){
				runGame(worker.game_id);
			}
		}
	},

	submitResponse: function(choice, timediff){
		var user = Meteor.user();
		var worker = Workers.findOne(user.username);
		var game = Games.findOne(worker.game_id);
		if (game && game.status == 'running'){
			if (worker.is_current_turn){
				Responses.insert({
						worker_id: user.username,
						game_id: game._id,
						round: game.curr_round,
						turn: game.curr_turn,
						player: worker.player_number,
						choice: choice,
						time: timediff
					});
				advanceTurn(worker.game_id);
			} else {
				throw new Meteor.Error(403, 'It is not your turn');
			}
		} else {
			throw new Meteor.Error(403, 'Your game is not running');
		}
	},

	finishSummary: function(newtime){
		var user = Meteor.user();
		var worker = Workers.findOne(user.username);
		if (worker.status == 'summary'){
			Workers.upsert(worker._id, {$set: {'summary_end_time': newtime, status: 'additionalqs'}});
		} else {
			throw new Meteor.Error(403, 'Stop');
		}
	},

	logAdditionalResponse: function(responses){
		var worker = Workers.findOne(Meteor.user().username);
		if (worker.status == 'additionalqs'){
			Workers.upsert(worker._id, {$set: {'additional_qs': responses, status: 'feelqs'}});
		} else {
			throw new Meteor.Error(403, 'Stop');
		}
	},

	logFeelResponse: function(responses){
		var worker = Workers.findOne(Meteor.user().username);
		if (worker.status == 'feelqs'){
			Workers.upsert(worker._id, {$set: {'feel_qs': responses, status: 'interactionqs'}});
		} else {
			throw new Meteor.Error(403, 'Stop');
		}
	},

	logInteractionResponse: function(responses){
		var worker = Workers.findOne(Meteor.user().username);
		var clean_responses = [];
		responses.forEach(function(text){
			clean_responses.push(clean_text_input(text));
		});
		if (worker.status == 'interactionqs'){
			Workers.upsert(worker._id, {$set: {'interaction_qs': clean_responses, status: 'postsurvey'}});
		} else {
			throw new Meteor.Error(403, 'Stop');
		}
	},

	logPostsurveyResponse: function(weird, comments){
		var worker = Workers.findOne(Meteor.user().username);
		if (worker.status == 'postsurvey'){
			Workers.upsert(worker._id, {$set: 
				{'post_game_responses.comments': clean_text_input(comments),
				'post_game_responses.suspicions': clean_text_input(weird),
				status: 'postsurvey2',
				exit_reason: 'completed'}});

		} else {
			throw new Meteor.Error(403, 'Stop');
		}
	},

	logPostsurvey2Response: function(survey, studies){
		var worker = Workers.findOne(Meteor.user().username);
		if (worker.status == 'postsurvey2'){
			Workers.upsert(worker._id, {$set: 
				{'post_game_responses.survey': clean_text_input(survey),
				'post_game_responses.studies': clean_text_input(studies),
				status: 'exited',
				exit_reason: 'completed'}});

		} else {
			throw new Meteor.Error(403, 'Stop');
		}
	},

	logEnoughResponse: function(enough){
		var worker = Workers.findOne(Meteor.user().username);
		if (worker.status == 'exited'){
			Workers.upsert(worker._id, {$set: 
				{'post_game_responses.adequately_debriefed': enough}});
		} else {
			throw new Meteor.Error(403, "You can't do that here");
		}
	},

	removeSinglePlayerMethod: function(){
		var worker = Workers.findOne(Meteor.user().username);
		if (worker.status != 'waiting'){
			throw new Meteor.Error(403, "You can't do that here");
		} else {
			//Workers.remove(worker._id);
			/*var game = Games.findOne(worker.game_id);
			Games.update(worker.game_id, {$set: {status: 'waiting-locked'}}); //argh
			var players = game.players;
			Games.update(worker.game_id, {$set: {players: []}});
			for (var i = 0; i < players.length; i++){
				if (!game.inactive_workers[players[i]]){
					addWorkerToGame(players[i], worker.game_id);
				}
			}*/
			Games.update(worker.game_id, {$pull: {players: worker._id}});

		}
	},

	relocatePlayers: function(){
		var worker = Workers.findOne(Meteor.user().username);
		if (worker.status != 'waitingforgame' && worker.status != 'practice'
			&& worker.status != 'example' && worker.status != 'instructions'){
			throw new Meteor.Error(403, "You can't do that here");
		} else {
			//Workers.update(worker._id, {$set: {status: 'exited', exit_reason: 'quit'}});
			var game = Games.findOne(worker.game_id);
			Games.update(game._id, {$set: {status: 'abandoned'}});
			var players = game.players;
			for (var i = 0; i < players.length; i++){
				if (!game.inactive_workers[players[i]]){
					Workers.upsert(players[i], {$inc: {n_times_waited: 1}, $set: {status: 'waiting', is_ready: false}});
					addWorkerToGame_safe(players[i]);
				} else {
					Workers.update(players[i], {$set: {game_id: null, status: 'registered', is_ready: false}});
				}
			}

		}
	},

	killGame: function(){
		var worker = Workers.findOne(Meteor.user().username);
		if (worker.status != 'playing' || worker.is_current_turn){
			throw new Meteor.Error(403, "You can't do that here");
		} else {
			Workers.update(worker._id, {$set: {status: 'exited', exit_reason: 'quit'}});
			var players = Games.findOne(worker.game_id).players;
			for (var i = 0; i < players.length; i++){
				if (players[i] != worker._id){
					Workers.upsert(players[i], {$set: {status: 'exited', exit_reason: 'killed'}});

				}
			}
			Games.update(worker.game_id, {$set: {status: 'killed', end_time: new Date()}});
		}
	}

});	