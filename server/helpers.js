shuffle = function(N){
	var o = [];
	for (var i = 0; i < N; i++){
		o.push(i);
	} 
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

clean_text_input = function(text){ // excel sucks at reading csv files properly
	return text.replace(/,/g,'|').replace(/\n/g, '||');
};


/*
	We want finding an available game and adding a worker to that game to be atomic. 
	Or like, we want the game_id we tell the worker to correspond to a game we know for sure
		has less than four players. So avoid the case where
		- We find game_id
		- some other rando gets added to the game
		- we add the worker to the game
		- there are now 5 people playing, oh no.
	Maybe we don't even need this, but I don't really understand Meteor's concurrency stuff. :/
*/
addWorkerToGame_safe = function(worker_id){
	var worker = Workers.findOne(worker_id);
	var result = Games.upsert({affiliation: worker.affiliation, status: 'waiting', $where: 'this.players.length < 4'},
					{$push: {players: worker_id}});
	var game = Games.findOne({players: worker_id, status: {$ne: 'abandoned'}}); // blargh

	Workers.update(worker_id, {$set: {game_id: game._id}});
	if (Games.findOne(game._id).players.length == Meteor.settings.public.n_players){
		startGame(game._id);
	}
};

addWorkerToGame =  function(worker_id, game_id){ 
	var worker = Workers.findOne(worker_id);
	var game = {};
	if (game_id){	
		game = Games.findOne(game_id);
	} else {
		game = Games.findOne({affiliation: worker.affiliation, status: 'waiting'});
	}
	
	if (game){
		
		Games.update(game._id, {$push: {players: worker_id}});
		Workers.update(worker_id, {$set: {game_id: game._id}});
		if (Games.findOne(game._id).players.length == Meteor.settings.public.n_players){
			startGame(game._id);
		}
	} else {
		var new_game = {
				affiliation: worker.affiliation,
				status: 'waiting',
				is_inter_round: false,
				players: [worker_id],
				round_order: shuffle(Meteor.settings.public.rounds.length),
				inactive_workers: {} 
			};
		var game_id = Games.insert(new_game);
		Workers.update(worker_id, {$set: {game_id: game_id}});
	}
};

startGame = function(game_id){
	var game = Games.findOne(game_id);
	Games.upsert(game_id, {$set: {status: 'started', curr_round: 0,
								curr_turn: 0, start_time: new Date(),
								num_players_instructed: 0,
								is_inter_round: false,
								inactive_workers: {},
								round_order: shuffle(Meteor.settings.public.rounds.length)}});
	game.players.forEach(function(worker_id, idx){
		Workers.upsert(worker_id, {$set: {status: 'instructions', 
										player_number: idx}});

	});
};

runGame = function(game_id){
	var game = Games.findOne(game_id);
	var players = game.players;
	Games.update(game_id, {$set: {status: 'running'}})
	players.forEach(function(worker_id){
		Workers.upsert(worker_id, {$set: {status: 'playing'}});
	});
	var round_number = game.round_order[0];
	var order = Meteor.settings.public.rounds[round_number].order;
	var curr_player_idx = order[0];
	Workers.update(players[curr_player_idx], {$set: {is_current_turn: true}});

};

advanceTurn = function(game_id){
	var game = Games.findOne(game_id);
	var round = game.round_order[game.curr_round];
	var turn_order = Meteor.settings.public.rounds[round].order;
	var curr_player = game.players[turn_order[game.curr_turn]];
	Workers.update(curr_player, {$set: {is_current_turn: false}});
	if (game.curr_turn == Meteor.settings.public.n_players - 1){
		var timeout = Meteor.settings.public.round_end_time;
		Games.update(game_id, {$set: {is_inter_round: true}});
		Meteor.setTimeout(function(){
			Games.update(game_id, {$set: {is_inter_round: false}});
			if (game.curr_round == Meteor.settings.public.rounds.length - 1){
				finishGame(game_id);
			} else {
				Games.update(game_id, {$inc: {curr_round: 1},
						$set:{curr_turn: 0}});
				var next_round = game.round_order[game.curr_round + 1];
				var next_order = Meteor.settings.public.rounds[next_round].order;
				var next_player = game.players[next_order[0]];
				Workers.update(next_player, {$set: {is_current_turn: true}});
			}
		}, timeout);
	} else {
		Games.update(game_id, {$inc: {curr_turn: 1}});
		var next_player = game.players[turn_order[game.curr_turn + 1]];
		Workers.update(next_player, {$set: {is_current_turn: true}});	
	}

};

finishGame = function(game_id){
	Games.update(game_id, {$set: {status: 'completed', end_time: new Date()}});
	var players = Games.findOne(game_id).players;
	for (var i = 0; i < players.length; i++){
		Workers.update(players[i], 
				{$set: {'status': 'summary', 'summary_start_time': new Date()}}
			);
	}
};

writePostgameFile = function(){
	var lines = [];
	var header = ['Worker ID'];
	header = header.concat(Meteor.settings.public.additional_questions_chart);
	header = header.concat(Meteor.settings.public.feel_questions);
	header = header.concat(Meteor.settings.public.interaction_questions);
	header = header.concat(['Suspicions','Comments','Adequately Debriefed?']);
	for (var i = 0; i < header.length; i++){
		header[i] = clean_text_input(header[i]);
	}
	lines.push(header);
	Workers.find({status: 'exited'}).forEach(function(worker){
		lines.push(worker._id + ',' + worker.additional_qs.join(',') + ','
						+ worker.feel_qs.join(',') + ',' + worker.interaction_qs.join(',') + ','
						+ worker.post_game_responses.suspicions + ',' + worker.post_game_responses.comments 
						+ ',' + worker.post_game_responses.adequately_debriefed);
	});
	return lines.join('\n');
};

writeResultFile = function(){

	var header = ['Game #',  'Game ID', 'Game Affiliation', 'Game Status', 'Game Start Time', 'Game End Time'];
	header = header.concat(['Worker ID', 'Worker Source', 'Completion Code', 'Summary Time']);
	header = header.concat(['Player #']);
	header = header.concat(['Round Order', 'Round', 'Attitude', 'Latency']);
	header = header.concat(['n-1 Response', 'n-2 Response', 'n-3 Response', 
							'# Prev Responses', 'Average Prev Responses']); 
	header = header.join(', ');
	header = [header];

	var num_rounds = Meteor.settings.public.rounds.length;
	var num_players = Meteor.settings.public.n_players;

	var lines = [];
	Games.find({status: {$in: ['completed','killed']}}, {sort: {end_time: 1}}).forEach(function(game, game_idx){
		var game_entries = [game_idx + 1, game._id, game.affiliation, game.status, game.start_time, game.end_time];
		var worker_entries = {};
		var worker_response_entries = {};
		game.players.forEach(function(worker, worker_idx){
			//console.log(worker_idx);
			var worker_data = Workers.findOne(worker);
			worker_entries[worker_idx] = [worker_data._id, worker_data.source, worker_data.private.completion_code, worker_data.summary_end_time - worker_data.summary_start_time, worker_idx + 1];
			worker_response_entries[worker_idx] = [];
		});
		game.round_order.forEach(function(real_idx, round_idx){

			var player_order = Meteor.settings.public.rounds[real_idx].order;
			var prev_responses = [];
			Responses.find({game_id: game._id, round: round_idx}, 
				{sort: {turn: 1}}).forEach(function(response, response_idx){
					var response_entries = [round_idx + 1, real_idx + 1, response.choice, response.time, '', '', ''];
					var total_so_far = 0;
					for (var i = 0; i < response_idx; i++){
						response_entries[4 + i] = prev_responses[prev_responses.length - 1 - i];
						total_so_far += parseInt(prev_responses[prev_responses.length  - 1 - i]);
					}
					prev_responses.push(response.choice);
					response_entries.push(response_idx);
					if (total_so_far == 0){
						response_entries.push('');
					} else {
						response_entries.push(total_so_far / response_idx);
					}
					var curr_player = player_order[response.turn];
					worker_response_entries[curr_player].push(response_entries.join(', '));
				});
		});
		game.players.forEach(function(worker, worker_idx){
			var line = game_entries.concat(worker_entries[worker_idx]);
			line = line.join(', ');
			worker_response_entries[worker_idx].forEach(function(response_entry){
				lines.push(line + ', ' + response_entry);
			});
		});
	});
	//console.log(lines);
	var all_data = header.concat(lines);
	return all_data.join('\n ');
};



removeSinglePlayer = function(worker_id, user_id){
	var worker = Workers.findOne(worker_id);
	if (worker.status != 'waiting'){
		throw new Meteor.Error(403, "You can't do that here");
	} else {
		Workers.remove(worker_id);
		Meteor.users.remove(user_id);

		Games.update(worker.game_id, {$pull: {players: worker_id}});
	}
};

notifyDeath = function(worker_id, user_id){
	var worker = Workers.findOne(worker_id);
	console.log(worker_id);
	var keystring = 'inactive_workers.' + worker_id;
	if (worker.status == 'waiting'){
		removeSinglePlayer(worker_id, user_id);
	} else {
		var placeholder = {};
		placeholder[keystring] = 1;
		Games.upsert(worker.game_id, {$set: placeholder});
	}
};

notifyRebirth = function(worker_id){
	var worker = Workers.findOne(worker_id);
	if (worker){
		var keystring = 'inactive_workers.' + worker_id;
		var placeholder = {};
		placeholder[keystring] = 1;
		Games.upsert(worker.game_id, {$unset: placeholder});
	}
};






