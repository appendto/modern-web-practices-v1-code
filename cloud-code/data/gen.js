'use strict';
var fs = require('fs'),
	path = require('path');

var masters = [
	'Hildenbrand',
	'Headrick',
	'Vickers',
	'Walters'
];

var apprentices = [
	'Bushnell',
	'Cadenhead',
	'Cloud',
	'Conaway',
	'Creamer',
	'Hetzel',
	'Kasper',
	'Lopes',
	'Mullens',
	'Niemeyer',
	'Waller',
	'Yexley'
];

var memberID = 0;
fs.writeFileSync(path.join(__dirname, 'members.json'), JSON.stringify(
	masters.map(function (master) {
		return {
			id: ++memberID,
			name: 'Darth ' + master,
			role: 'master'
		};
	}).concat(apprentices.map(function (apprentice) {
		return {
			id: ++memberID,
			name: 'Apprentice ' + apprentice,
			role: 'apprentice'
		};
	})), null, '  '));

