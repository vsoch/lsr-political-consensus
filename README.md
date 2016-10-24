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


When you do `docker-compose up -d` the application should be available at `http://127.0.0.1:3000/`. Even if the application is crashing, you will see the error output printed here, and meteor will try to reload or restart the application given any file changes. My recommendation is to do:

    docker-compse up

and then verify that the application is running, when it worked for me I saw:


	$ docker-compose up
	Starting lsrpoliticalconsensus_database_1
	Recreating lsrpoliticalconsensus_app_1
	Attaching to lsrpoliticalconsensus_database_1, lsrpoliticalconsensus_app_1
	app_1      | [[[[[ /code/app ]]]]]
	app_1      | 
	app_1      | => Started proxy.
	app_1      | I20161024-00:13:35.767(0)? Kadira: completed instrumenting the app
	app_1      | => Started your app.
	app_1      | 
	app_1      | => App running at: http://localhost:3000/
	app_1      | I20161024-00:13:36.157(0)? Kadira: successfully authenticated


You should then be able to go to `localhost:3000` or `127.0.0.1` in your browser to see the study console, with options for "Admin" and "Game." If this doesn't work, jump down to the Debugging section.


## Setting Up Admin
The following notes are old, and need to be updated as the application is. I (@vsoch) went through these steps to test. **NOTE: these is some kind of setup for Kadira via a file in [app/server/kadiera.js](app/server/kadiera.js). It is some kind of token that likely is for the production version, and someone should look into this. Ideally, we want one file for a new user to add these custom variables, and clear instructions on what is needed to do.


### 1. Set up Liberal and Conservative Tokens
Log into the admin panel and set the `Liberal experiment credit token` to "lib" and `Conservative experiment credit token` to "cons"


### 2. Test the experiments
Open four browsers (for instance, one Chrome, one Chrome incognito, one Firefox, one Firefox private)
Go to [http://127.0.0.1:3000/start?source=mturk&experiment_id=lib&worker_id={SOMETHING THAT HASN’T BEEN USED BEFORE}](http://127.0.0.1:3000/start?source=mturk&experiment_id=lib&worker_id={SOMETHING THAT HASN’T BEEN USED BEFORE}) on each browser

You should be able to then complete the study switching between the four browsers

### 3. Database
The mongodb can be accessed in the following ways. 

1. First, the data can be downloaded from the web interface in the "Admin" panel, click on "Download Results."
2. In the case that the admin panel isn't available, you can log into the database container directly. First (in a separate terminal if you ran docker-compose up without the -d) do `docker ps` to see all the running containers:

	CONTAINER ID  IMAGE      COMMAND      CREATED      STATUS      PORTS      NAMES
        bd38638c824c  vanessa/lsr-political-consensus  "meteor --settings se" 16 minutes ago  Up 16 minutes       0.0.0.0:3000->3000/tcp   lsrpoliticalconsensus_app_1
        a0c74e38f525  mongo:3.0   "/entrypoint.sh mongo"   25 minutes ago  Up 16 minutes  27017/tcp                lsrpoliticalconsensus_database_1


The above shows us that our mongo:3.0 database, called `lsrpoliticalconsensus_database_1` has container id `a0c74e38f525`. We can thus connect to it via:

      docker exec -it a0c74e38f525 bash

The format for export is generally the following:

      
      mongoexport -h {{ hostname }}:{{ port }} -d {{ database }} -c {{ collection }} -u {{ user }} -p {{ password }} -o workers.csv --type=csv -f 

Note that the names of the database fields are:

- globals
- games 
- responses workers


### Suggestions for Next Steps

Someone needs to test that:

1. the database is being connected to successfully from the application, meaning the connection is working between the containers!
2. Then generate test data, and likely a test to see that sona systems is working is needed (@vsoch doesn't know how this works)
3. Finally, when the data is generated and confirmed to exist in the database, the different options for export need to be properly written out. Ideally, there is an easy script/tool that can do the export if/when the web application is not working.

When the above is done, someone should read about a proper production environment for the application, likely looking into AWS or Google Cloud as options. Of high importance is that the authentication credentials, etc., are not shown publicly.

Finally, when the application is production ready, we can have a conversation about how to "template-ize" it, meaning make it more generalized to customize questions, variables, etc.

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
The error messages for your application will be available at `http://127.0.0.1:3000/`, so you should start here.


###### Meteor Version
Of high importance: **DO NOT UPDATE METEOR**. The application was developed using a very specific version of Meteor (version 1.1.0.3) and updating to a newer version will break it. This is one of the reasons we are using containers - if you look in the Dockerfile, we install meteor by running the command:

      /code/install-meteor.sh

This is the same install script that would be downloaded and run via `curl https://install.meteor.com/ | sh`, except the `RELEASE` variable is hard coded to be the one that we need. For this reason, it is very important that you do not try to update Meteor, unless you are wanting some functionality that the new version offers, and are willing to debug the errors.


###### Missing settings
When I (@vsoch) first set this up, I ran the command `meteor` in my [Dockerfile](Dockerfile) instead of `meteor --settings settings.json`. This means that none of the additional information like the admin password, etc., was available to the application, and it crashed:


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


This error is telling us (line 9) that there is some error in the init.js function. specifically the line being referenced is reading in the 'admin_password' from the settings.json file. This is because the application did not know about this file.
