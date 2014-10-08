'use strict';

module.exports = {
	asJSON: function () {
		return {'Content-Type': 'application/json'}
	},
	asText: function () {
		return {'Content-Type': 'plain/text'}
	},
	asHTML: function () {
		return {'Content-Type': 'text/html'}
	}
};