import random

BROWSERS = ['robb','chadly','chrystal','justine']
SOURCES = ['mturk','sona']
AFFLS = ['lib','cons']

ROOT = 'http://politicalattitudestudy.meteor.com/start?'



ITERS = 5

def choose_source():
	return SOURCES[random.random() < .5]

for i in range(ITERS):
	affl = AFFLS[random.random() < .5]
	worker_ids = [b + '_' + str(i) for b in BROWSERS]
	survey_codes = [b + '_code' + str(i) for b in BROWSERS]
	sources = [choose_source() for b in BROWSERS]
	print('URLS: ')
	for x,y,z in zip(worker_ids,survey_codes,sources):
		if z == 'mturk':
			print('\t' + ROOT + 'source=' + z +'&experiment_id=' + affl + '&worker_id=' + x)
		else:
			print ('\t' + ROOT + 'source=' + z +'&experiment_id=' + affl + '&survey_code=' + y)
			print ('\t\tsona ID: ' + x)
	print('WAIT EVENTS: ')
	exit_during_wait = random.randint(0,1)
	if exit_during_wait == 0:
		print ('\tnone')
	elif exit_during_wait == 1:
		print ('\t%s exits and returns' % BROWSERS[random.randint(0,3)])
	print('INSTR EVENTS: ')
	exit_during_instrs = random.randint(0,2)
	if exit_during_instrs == 0:
		print ('\tnone')
	elif exit_during_instrs == 1:
		choice = random.randint(0,3)
		print ('\t%s exits and game is not saved' % BROWSERS[choice])
		new_src = SOURCES[random.randint(0,1)]
		if new_src == 'mturk':
			print ('\tgo to %ssource=%s&experiment_id=%s&worker_id=%s_ret' % (ROOT, 'mturk', affl, worker_ids[choice]))
		else:
			print ('\tgo to %ssource=%s&experiment_id=%s&survey_code=%s_ret_code' % (ROOT, 'sona', affl, worker_ids[choice]))
			print ('\tsona ID: %s_ret' % worker_ids[choice])
	else:
		print ('\t%s exits but returns' % BROWSERS[random.randint(0,3)])
	print ('GAME EVENTS: ')
	exit_during_game = random.randint(0,1)
	if exit_during_game:
		print ('\t%s exits' % BROWSERS[random.randint(0,3)])
	else:
		print ('\tnone')
	print ('')

