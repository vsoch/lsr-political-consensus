# lsr-political-consensus

This is an application developed by the [Stanford Laboratory for Social Research](https://sociology.stanford.edu/research/laboratory-social-research) run a Political Consensus experiment. The base application uses Meteor.js, JavaScript, and a flat file (.json) database called [MongoDB](https://www.mongodb.com/leading-nosql-database).

## Development
The development environment is Dockerized, meaning that you can build the image locally, and run. First, you need to [install Docker](http://54.71.194.30:4111/engine/installation) and [docker-compose](http://54.71.194.30:4111/compose/install/). Then fork this repo on Github, and clone your fork:


      git clone https://www.github.com/vsoch/lsr-political-consensus
      cd lsr-political-consensus

You should next build your image, and run the application with `docker-compose`:

      docker build -t vanessa/lsr-political-consensus .
      docker-compose up -d

The `-d` means detached, and that you won't see any output (or errors) to the console. You can easily restart and stop containers, either specifying the container name(s) or leaving blank to apply to all containers. Note that these commands must be run in the folder with the `docker-compose.yml`:

      docker-compose restart database app
      docker-compose stop


When you do `docker-compose up -d` the application should be available at `http://127.0.0.1:3000/`. Even if the application is crashing, you will see the error output printed here, and meteor will try to reload or restart the application given any file changes.


### Debugging
If you are debugging, there could be one of two issues. If there is an issue with the container, then you likely want to look at those logs (discussed below, first). More likely it's an issue with the application (discussed next)

#### Docker debugging
The first obvious thing to do is to stop your application, and start again without using `-d` (detached) mode:

      docker-compose stop
      docker-compose up

You will likely see some error(s) spit out into the console that you can then debug. To get more detail you can look at the logs for a particular container:

      docker-compose logs database

You can also shell into a container by getting it's id with `docker -ps` and then:

      docker exec -it $container_id bash

where `-it` corresponds to interactive terminal.

#### Meteor Debugging
The error messages for your application will be available at `http://127.0.0.1:3000/`, so you should start here. Here are a set of common errors that I (@vsoch) encountered when I first tried to get this working:


	/root/.meteor/packages/meteor-tool/.1.1.4.yg6231++os.linux.x86_64+web.browser+web.cordova/mt-os.linux.x86_64/dev_bundle/server-lib/node_modules/fibers/future.js:245
							throw(ex);
							      ^
	Error: Match error: Failed Match.OneOf or Match.Optional validation in field password
	    at checkSubtree (packages/check/match.js:244:1)
	    at packages/check/match.js:296:1
	    at Function._.each._.forEach (packages/underscore/underscore.js:113:1)
	    at checkSubtree (packages/check/match.js:290:1)
	    at check (packages/check/match.js:32:1)
	    at createUser (packages/accounts-password/password_server.js:696:1)
	    at Object.Accounts.createUser (packages/accounts-password/password_server.js:776:1)
	    at app/server/init.js:4:12
	    at /code/app/.meteor/local/build/programs/server/boot.js:229:5
	Exited with code: 8
	Your application is crashing. Waiting for file change.


This error is telling us (line 9) that there is some error in the init.js function. specifically the line being referenced is reading in the 'admin_password' from the settings.json file. If you see this error, there is something wrong with the admin password, or in my case, I had not set up the mongodb yet.


## Usage
The admin panel can be accessed via a password, not shared in this public documentation.



Log into the admin panel and set the liberal token to “lib” and conservative token to “cons”
Open four browsers (for instance, one Chrome, one Chrome incognito, one Firefox, one Firefox private)
Go to “https://political-consensus.herokuapp.com/start?source=mturk&experiment_id=lib&worker_id={SOMETHING THAT HASN’T BEEN USED BEFORE}” on each browser

You should be able to then complete the study switching between the four browsers
Database
For the Heroku deployment, all the data is stored on MongoLab, which is connected to the Heroku account
Originally created by Justine Zhang (jz727@cornell.edu), most recently deployed by Kyle Qian (kylecqian@gmail.com) 

Heroku dashboard login info:
redekopp@stanford.edu
Soclab12
OR
malinaj@stanford.edu
spaceman
Download additional responses

Go to project directory (lsr-political-consensus)
Command: mongoexport -h ds019068.mlab.com:19068 -d heroku_b85ffvv1 -c workers -u heroku_b85ffvv1 -p spaceman8 -o workers.csv --type=csv -f _id,additional_qs.0,additional_qs.1,additional_qs.2,additional_qs.3,additional_qs.4,additional_qs.5,additional_qs.6,additional_qs.7,additional_qs.8,additional_qs.9,additional_qs.10,additional_qs.11,additional_qs.12,additional_qs.13,feel_qs.0,feel_qs.1,feel_qs.2,feel_qs.3,feel_qs.4,feel_qs.5,feel_qs.6,feel_qs.7,feel_qs.8,feel_qs.9,feel_qs.10,feel_qs.11,feel_qs.12,feel_qs.13,feel_qs.14,feel_qs.15,feel_qs.16,feel_qs.17,post_game_responses.comments,post_game_responses.suspicions,post_game_responses.survey,post_game_responses.studies,post_game_responses.adequately_debriefed
Current TODOs (Keep updated!)



_______________________________________________________________________________________________



ACS Append (Flask, Python w/ SQLite) - https://github.com/stanford-soclab/acs-lookup
Allows users to append ACS county data to rows in a given CSV file, using the ‘zip codes’ column
Currently deployed on Stanford AFS using cgi-bin
The AFS directory is located at “/afs/.ir/group/lsr/cgi-bin/acs-lookup”
The current URL to access the deploy is at “http://web.stanford.edu/group/lsr/cgi-bin/acs-lookup/app.cgi/index”
Troubleshooting
When you copy paste an updated directory to the AFS folder, you may need to run “chmod 755 /location/of/app.cgi” or else you’ll get permissions errors when you try to access the updated site
If there is a file called “.suexecd” in the directory, the web app will run in “debug mode.” The file may be found as “suexecd”, in which case debug mode would be turned off.
Contact Kyle Qian (kylecqian@gmail.com) for deployment issues
Current TODOs (Keep updated!)
Better handling of raising exceptions, try/except blocks, and asserts
Make sure code can handle Unicode characters
SANITIZE THE SQL for accessing the DB
Write checks for if the zip code is valid
Handle case where the input file is not .CSV or when there is no ‘zip’ column
The app assumes the CSV is using commas as delimiters



