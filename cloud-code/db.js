'use strict';
var fs = require('fs'),
	path = require('path'),
	_ = require('lodash');

var MEMBERS_FILE_PATH = path.join(__dirname, 'data', 'members.json');

var members = JSON.parse(fs.readFileSync(MEMBERS_FILE_PATH));

var assigned = {
	//masterID: apprenticeID
	'2': 7
};

var db;

var masterAPI = function (master) {
	return {
		toJSON: function () {
			return master;
		},
		assignApprentice: function (apprenticeID) {
			if (assigned.hasOwnProperty(master.id)) {
				if (assigned[master.id] !== apprenticeID) {
					throw new Error('master already has an apprentice!');
				}
				return;
			}
			assigned[master.id] = apprenticeID;
		},
		unassignApprentice: function (apprenticeID) {
			if (!assigned.hasOwnProperty(master.id.toString())) {
				console.log('master not assigned');
				return;
			}
			if (assigned[master.id] !== apprenticeID) {
				console.log('apprentice not assigned');
				return;
			}
			delete assigned[master.id];
		}
	};
};

var mastersAPI = function (allMasters) {
	return {
		toJSON: function () {
			return allMasters;
		},
		unassigned: function () {
			var assignedMasterIDs = Object.keys(assigned).map(Number);
			var unassignedMasters = _.filter(allMasters, function (master) {
				return !_.contains(assignedMasterIDs, master.id);
			});
			return unassignedMasters;
		},
		assigned: function () {
			var assignedMasterIDs = Object.keys(assigned).map(Number);
			var assignedMasters = _.filter(allMasters, function (master) {
				return _.contains(assignedMasterIDs, master.id);
			});
			return assignedMasters;
		},
		find: function (criteria) {
			var foundMasters = _.where(allMasters, criteria);
			return _.extend(Object.create(foundMasters), mastersAPI(foundMasters));
		},
		one: function (id) {
			var master = _.find(allMasters, {id: id});
			if (!master) {
				throw new Error('no master exists for that id');
			}
			return _.extend(Object.create(master), masterAPI(master));
		},
		forEach: function (cb) {
			allMasters.forEach(function (master, index) {
				cb(_.extend(Object.create(master), masterAPI(master)), index);
			});
		}
	};
};

var apprenticeAPI = function (apprentice) {
	var roleProgression = ['apprentice', 'master'];

	return {
		toJSON: function () {
			return apprentice;
		},
		promote: function (role) {
			if (!_.contains(roleProgression, role)) {
				throw new Error('cannot assign role to apprentice');
			}
			var currentRole = roleProgression.indexOf(apprentice.role);
			var newRole = roleProgression.indexOf(role);
			if (newRole < currentRole) {
				throw new Error('apprentice cannot be demoted');
			}
			if (newRole === currentRole) {
				throw new Error('apprentice already has that role');
			}
			apprentice.role = role;
			apprentice.name = 'Darth ' + apprentice.name.split(' ')[1];
			db.masters().forEach(function (master) {
				master.unassignApprentice(apprentice.id);
			});
		}
	};
};

var apprenticesAPI = function (allApprentices) {
	return {
		toJSON: function () {
			return allApprentices;
		},
		unassigned: function () {
			var assignedApprenticeIDs = _.values(assigned);
			var unassignedApprentices = _.filter(allApprentices, function (apprentice) {
				return !_.contains(assignedApprenticeIDs, apprentice.id);
			});
			return unassignedApprentices;
		},
		assigned: function () {
			var assignedApprenticeIDs = _.values(assigned);
			var unassignedApprentices = _.filter(allApprentices, function (apprentice) {
				return _.contains(assignedApprenticeIDs, apprentice.id);
			});
			return unassignedApprentices;
		},
		find: function (criteria) {
			var foundApprentices = _.where(allApprentices, criteria);
			return _.extend(Object.create(allApprentices), apprenticesAPI(foundApprentices));
		},
		one: function (id) {
			var apprentice = _.find(allApprentices, {id: id});
			if (!apprentice) {
				throw new Error('no apprentice exists for that id');
			}
			return _.extend(Object.create(apprentice), apprenticeAPI(apprentice));
		}
	};
};

db = module.exports = {
	masters: function () {
		var allMasters = _.where(members, {role: 'master'});
		return _.extend(Object.create(allMasters), mastersAPI(allMasters));
	},
	apprentices: function () {
		var allApprentices = _.where(members, {role: 'apprentice'});
		return _.extend(Object.create(allApprentices), apprenticesAPI(allApprentices));
	},
	assignments: function () {
		var masters = db.masters(),
			apprentices = db.apprentices();
		var assignments = _.map(assigned, function (apprenticeID, masterID) {
			return {
				apprentice: apprentices.one(apprenticeID),
				master: masters.one(Number(masterID))
			};
		});
		return assignments;
	}
};