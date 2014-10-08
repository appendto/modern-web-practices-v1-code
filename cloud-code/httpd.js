'use strict';
var mach = require('mach'),
	app = mach.stack(),
	path = require('path'),
	db = require('./db');

app.use(mach.logger);
app.use(mach.contentType, 'application/json');
app.use(mach.params);
app.use(mach.file, {root: path.join(__dirname, 'public'), index: 'index.html'});

app.head('/api/heartbeat', function () {
	return mach.text('', 200);
});

app.get('/api/master', function (/*req*/) {
	return mach.json(db.masters(), 200);
});

app.get('/api/master/unassigned', function (/*req*/) {
	return mach.json(db.masters().unassigned(), 200);
});

app.get('/api/apprentice', function (/*req*/) {
	return mach.json(db.apprentices(), 200);
});

app.get('/api/apprentice/unassigned', function (/*req*/) {
	return mach.json(db.apprentices().unassigned(), 200);
});

/**
 * Assign apprentice
 */
app.post('/api/master/:masterID/apprentice/:apprenticeID', function (req) {
	var masterID = Number(req.params.masterID),
		apprenticeID = Number(req.params.apprenticeID);

	try {
		db.masters().one(masterID).assignApprentice(apprenticeID);
	} catch (e) {
		return mach.json({err: e.toString()}, 500);
	}

	return mach.json({}, 201);
});

/**
 * Unassign apprentice
 */
app.delete('/api/master/:masterID/apprentice/:apprenticeID', function (req) {
	var masterID = Number(req.params.masterID),
		apprenticeID = Number(req.params.apprenticeID);

	try {
		db.masters().one(masterID).unassignApprentice(apprenticeID);
	} catch (e) {
		return mach.json({err: e.toString()}, 500);
	}

	return mach.json({}, 200);
});

/**
 * Promote apprentice
 */
app.patch('/api/apprentice/:id/role', function (req) {
	var apprenticeID = Number(req.params.id),
		role = req.params.role || 'apprentice';

	try {
		var apprentice = db.apprentices().one(apprenticeID);
		apprentice.promote(role);
		return mach.json(apprentice, 200);
	} catch (e) {
		return mach.json({err: e.toString()}, 500);
	}
});

app.get('/api/assignments', function (/*req*/) {
	return mach.json(db.assignments(), 200);
});

mach.serve(app, 3000);