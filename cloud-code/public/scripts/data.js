/**
 * Application data module. Calls AJAX APIs, handles
 * request caching and queueing.
 */
(function dataModule (app, $, _, async) {

	var storage = app.storage;
	var net = app.net;

	function getCacheable(url) {
		var deferred = new $.Deferred(function (def) {
			var data = JSON.parse(storage.getItem(url));
			if (!net.isOnline()) {
				if (data) {
					return def.resolve(data);
				}
			}
			$.get(url).done(function (data) {
				storage.setItem(url, JSON.stringify(data));
				def.resolve(data);
			}).fail(function (err) {
				if (!data) {
					return def.reject(new Error('a server error occurred: ' + err.responseText));
				}
				def.resolve(data);
			});
		});
		return deferred.promise();
	}

	/**
	 * Maps AJAX factory functions to keys for queue operations.
	 * @type {Object<String, Function>} - endpoint hash
	 */
	var queueableEndpoints = {
		'assign-apprentice': function (masterID, apprenticeID) {
			return $.post(_.template('/api/master/${ masterID }/apprentice/${ apprenticeID }')({
				masterID: masterID,
				apprenticeID: apprenticeID
			}), {});
		},
		'unassign-apprentice': function (masterID, apprenticeID) {
			return $.ajax({
				url: _.template('/api/master/${ masterID }/apprentice/${ apprenticeID }')({
					masterID: masterID,
					apprenticeID: apprenticeID
				}),
				method: 'DELETE',
				dataType: 'json'
			});
		},
		'promote-apprentice': function (apprenticeID, role) {
			return $.ajax({
				url: _.template('/api/apprentice/${ apprenticeID }/role')({
					apprenticeID: apprenticeID
				}),
				data: {role: role},
				method: 'PATCH',
				dataType: 'json'
			});
		}
	};

	/**
	 * Delivery queue is in-memory *only*.
	 * Will be emptied whenever the application flushes.
	 * @type {Array}
	 */
	var requestQueue = [];

	/**
	 * Enqueues requests that may be flushed now, if the application
	 * is online, or later if the application is offline.
	 * @param {String} key - endpoint key
	 * @returns {Promise}
	 */
	function enqueue(key/*, args...*/) {
		var args = Array.prototype.slice.call(arguments, 1);

		var deferred = new $.Deferred(function (def) {
			if (!queueableEndpoints.hasOwnProperty(key)) {
				return def.reject(new Error('invalid endpoint key'));
			}

			var id = key + '@' + JSON.stringify(args);

			if (_.find(requestQueue, {id: id})) {
				return def.reject(new Error('request has already been queued'));
			}

			/*
			 * Add an entry to a queue that represents the AJAX operation to
			 * be completed. When the queue is flushed, this entry's onSuccess/
			 * onFailure handlers will be called.
			 */
			var request = {
				id: id,
				key: key,
				args: args,
				onSuccess: function (result) {
					def.resolve(result);
				},
				onFailure: function (err) {
					def.reject(new Error('the request failed: ' + err.responseText));
				}
			};
			console.info('[DATA] queueing request', request.id);
			requestQueue.push(request);

			/*
			 * If the app is offline do not flush the request; it will
			 * be flushed when the app comes back online
			 */
			if (!net.isOnline()) {
				return;
			}

			/*
			 * The application is online, so go ahead and flush the queue
			 * with the item just added
			 */
			flush();
		});

		return deferred.promise();
	}

	/**
	 * Flushes all requests in the queue, processing the result (or
	 * error) for each.
	 */
	function flush() {
		if (!requestQueue.length) {
			return;
		}

		/*
		 * Iterate over the queued request in series, resolving/rejecting
		 * their promises as necessary.
		 */
		async.eachSeries(requestQueue, function onIteration (request, cb) {
			console.info('[DATA] flushing request', request.id);
			var endpoint = queueableEndpoints[request.key];
			return endpoint.apply(endpoint, request.args).done(function (result) {
				console.info('[DATA]', request.id, 'flushed');
				request.onSuccess(result);
				cb(null);
			}).fail(function (err) {
				console.error('[DATA] failed to flush request', request.id);
				request.onFailure(err);
				cb(null);
			});
		}, function onComplete () {
			requestQueue = [];
		});
	}

	/*
	 * When the application comes online, flush the queue.
	 */
	net.on('online', function (args) {
		/*
		 * If the app was not previously offline, don't flush the queue.
		 * (Prevents flushing the queue on every poll tick.)
		 */
		if (!args.delta) {
			return;
		}

		flush();
	});

	var data = app.data = {};

	/**
	 * Gets all masters. Cacheable.
	 * @returns {Array<Object>}
	 */
	data.getMasters = function () {
		return getCacheable('/api/master/unassigned');
	};

	/**
	 * Get all apprentices. Cacheable.
	 * @returns {Array<Object>}
	 */
	data.getApprentices = function () {
		return getCacheable('/api/apprentice/unassigned');
	};

	/**
	 * Returns all assignments. Cacheable.
	 * @returns {Array<Object>}
	 */
	data.getAssignments = function () {
		return getCacheable('/api/assignments');
	};

	/**
	 * Assigns an apprentice to a particular master
	 * @param {Number} masterID
	 * @param {Number} apprenticeID
	 * @returns {Promise}
	 */
	data.assignApprentice = function (masterID, apprenticeID) {
		return enqueue('assign-apprentice', masterID, apprenticeID);
	};

	/**
	 * Unassign an apprentice from a particular master
	 * @param {Number} masterID
	 * @param {Number} apprenticeID
	 * @returns {Promise}
	 */
	data.unassignApprentice = function (masterID, apprenticeID) {
		return enqueue('unassign-apprentice', masterID, apprenticeID);
	};

	/**
	 * Promote an apprentice.
	 * @param apprenticeID
	 * @param role
	 * @returns {*}
	 */
	data.promoteApprentice = function (apprenticeID, role) {
		return enqueue('promote-apprentice', apprenticeID, role);
	};

}(window.app, window.$, window._, window.async));