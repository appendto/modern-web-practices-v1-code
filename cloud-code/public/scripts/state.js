/**
 * Application state module. Contains and manipulates
 * model state in response to UI activity. Makes calls to
 * data/API layer and updates model data accordingly.
 * Events to UI layer when model data changes.
 */
(function stateModule (app, $, _, Ventage) {

	var data = app.data;

	var state = app.state = Object.create(new Ventage());

	state.masters = [];
	state.apprentices = [];
	state.assignments = [];

	app.state.init = function () {
		var deferred = new $.Deferred(function (def) {
			$.when(
				data.getMasters(),
				data.getApprentices(),
				data.getAssignments()
			).done(function (masters, apprentices, assignments) {
				state.masters = masters;
				state.apprentices = apprentices;
				state.assignments = assignments;
				state.trigger('masters-changed');
				state.trigger('apprentices-changed');
				state.trigger('assignments-changed');
				state.trigger('init');
				def.resolve();
			}).fail(function (err) {
				console.error(err);
				state.trigger('init-error');
				def.reject('failed to initialize application state');
			});
		});
		return deferred.promise();
	};

	state.assignApprentice = function (master, apprentice) {
		var deferred = new $.Deferred(function (def) {
			data.assignApprentice(master.id, apprentice.id).then(function () {
				_.remove(state.masters, master);
				_.remove(state.apprentices, apprentice);
				state.assignments.push({
					master: master,
					apprentice: apprentice
				});
				state.trigger('masters-changed');
				state.trigger('apprentices-changed');
				state.trigger('assignments-changed');
			}).fail(function (err) {
				console.error(err);
				def.reject('failed to assign apprentice: ' + err.toString());
			});
		});
		return deferred.promise();
	};

	state.unassignApprentice = function (master, apprentice) {
		var deferred = new $.Deferred(function (def) {
			data.unassignApprentice(master.id, apprentice.id).then(function () {
				var assignment = _.find(state.assignments, {
					master: master,
					apprentice: apprentice
				});
				if (!assignment) {
					return;
				}
				_.remove(state.assignments, assignment);
				state.masters.push(master);
				state.apprentices.push(apprentice);
				state.trigger('masters-changed');
				state.trigger('apprentices-changed');
				state.trigger('assignments-changed');
				def.resolve();
			}).fail(function (err) {
				console.error(err);
				def.reject('failed to unassign apprentice: ' + err.toString());
			});
		});
		return deferred.promise();
	};

	state.promoteApprentice = function (apprentice, role) {
		var deferred = new $.Deferred(function (def) {
			data.promoteApprentice(apprentice.id, role).then(function (master) {
				_.remove(state.apprentices, apprentice);
				state.masters.push(master);
				state.trigger('apprentices-changed');
				state.trigger('masters-changed');
				def.resolve();
			}).fail(function (err) {
				console.error(err);
				def.reject('failed to promote apprentice: ' + err.toString());
			});
		});
		return deferred.promise();
	};

}(window.app, window.$, window._, window.Ventage));