/*
	Globals
	Bunch of global variables, yay?
*/
Globals = new Mongo.Collection('globals');

/*
	Games

	Stores information about each game.
	Format:
		{
			"_id"
			"affiliation" (liberal | conservative)
			"status" (waiting | started | running | completed | killed)
			"players" --> list of players
			"round_order" --> permutation of rounds
			"curr_round" --> current round [0,8)
							note this indexes into the permutation of rounds
			"curr_turn" --> current turn [0,4) 
							note that this indexes into a permutation of players
			"start_time"
			"end_time"
			"num_players_instructed" --> # finished instructions segment
		}
*/

Games = new Mongo.Collection('games');


/*
	Responses

	Stores each player response.
	Format:
		{
			"_id"
			"worker_id"
			"game_id"
			"round" --> indexes into the game's round permutation
			"turn" --> indexes into the permutation of players
			"player" --> number of the player that submitted the answer
			"choice" 
			"time"

		}
*/
	
Responses = new Mongo.Collection('responses');


/*
	Workers

	Stores information about each worker
	Note that we also keep track of users in the Meteor accounts builtin, but
		accessing subfields of "profile" is super annoying
	Format:
		{
			"_id" --> set to worker id
			"affiliation"
			"game_id"
			"player_number" [0,4)
			"status" (registered | waiting | ingame | completed | exited )
			"exit_reason" --> (completed | noconsent | unresponsive | killed)
			"source" (mturk | sona)
			"is_current_turn"
			"sona_username" --> SONA-systems workers only
			"n_times_waited" --> how many times they've been bored to death in waiting room
			"post_game_responses" --> responses to after-game survey
				{
					"comments"
					"suspicions"
					"adequately_debriefed" (true | false)
				}
			"private" --> not published to workers
				{
					"completion_code"
					"completion_url" --> for SONA users only
				}

		}
	Possible statuses:
		registered
		waiting

		noconsent
*/

Workers = new Mongo.Collection('workers');













