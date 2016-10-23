Meteor.startup( function(){

	if (typeof(Meteor.users.findOne({username: 'admin'})) == 'undefined'){
		Accounts.createUser({
			username: 'admin',
			password: Meteor.settings.admin_password
		});
		
	}
	Meteor.settings.public.instruction_quiz_questions = [
				{
					"prompt": "How many people will be in your group, including you?",
					"choices": ["Two","Three","Four","Five"]
				},
				{
					"prompt": "How many members of your group will report their attitude for each political issue?",
					"choices": ["One group member", "Half of the group members", "All of the group members"]
				}
			]; //fuck you meteor

});