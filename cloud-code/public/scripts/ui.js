/**
 * Application ui module. Manipulates DOM and signals
 * state module when Things Happen.
 */
(function uiModule (app, $, _) {

	app.ui = {};

	var state = app.state;

	/**
	 * Message module. Handles showing/displaying UI messages
	 * (e.g., info, error, warn) at the top of the application.
	 */
	var msg = app.ui.msg = (function () {
		var $el = $('#app-messages');
		var msgTemplate = _.template($('#message-template').html());
		var handle = null;

		function display(type, args) {
			var content = Array.prototype.slice.call(args, 0)
				.join(' ');
			if (handle) {
				clearTimeout(handle);
			}
			$el.hide();
			$el.empty();
			$el.append(msgTemplate({
				type: type,
				text: content
			}));
			$el.show();
			handle = setTimeout(function () {
				handle = null;
				$el.find('.app-message').hide(400, function () {
					$el.hide();
				});
			}, 3000);
		}

		return {
			info: function () {
				display('info', arguments);
			},
			warn: function () {
				display('warn', arguments);
			},
			error: function () {
				display('error', arguments);
			}
		};
	}());

	/**
	 * Common select element behavior
	 * @param {jQuery} $el - jquery handle to a select element
	 * @returns {Object} - select element API
	 * @constructor
	 */
	function UISelect ($el) {
		var optionTemplate = _.template($('#select-option-template').html());

		return Object.create({
			model: [],
			populate: function (entities) {
				var self = this;
				this.empty();
				this.model = entities;
				entities.forEach(function (entity, index) {
					self.addOption(entity.id, entity.name, index);
				});
			},
			addOption: function (id, name, index) {
				$el.append(optionTemplate({
					index: index,
					text: name,
					value: id
				}));
			},
			empty: function () {
				$el.empty();
			},
			selected: function () {
				var id = Number($el.val());
				return _.find(this.model, {id: id});
			},
			remove: function (id) {
				var option = $el.find('option[value="' + id + '"]');
				if (option.length) {
					option.remove();
				}
			},
			hide: function () {
				$el.hide();
			},
			show: function () {
				$el.show();
			}
		});
	}

	/**
	 * "Available Masters" select element
	 */
	var availableMasters = app.ui.availableMasters = (function () {
		var $el = $('#masters');

		state.on('masters-changed', function () {
			availableMasters.populate(app.state.masters);
		});

		return new UISelect($el);
	}());

	/**
	 * Available apprentices select element.
	 */
	var availableApprentices = app.ui.availableApprentices = (function () {
		var $el = $('#apprentices');

		state.on('apprentices-changed', function () {
			availableApprentices.populate(app.state.apprentices);
		});

		return new UISelect($el);
	}());

	/**
	 * Assign apprentice button
	 */
	app.ui.assignApprentice = (function () {
		var $el = $('#assign-apprentice');

		$el.on('click', function () {
			var master = availableMasters.selected();
			var apprentice = availableApprentices.selected();
			state.assignApprentice(master, apprentice).fail(function (err) {
				msg.error('failed to assign apprentice:', err);
			});

		});
	}());

	/**
	 * Promote apprentice button
	 */
	app.ui.promoteApprentice = (function () {
		var $el = $('#promote-apprentice');

		$el.on('click', function () {
			var apprentice = availableApprentices.selected();
			state.promoteApprentice(apprentice, 'master').fail(function (err) {
				msg.error('unable to promote apprentice:', err);
			});
		});
	}());

	/**
	 * Assigned masters/apprentices table
	 */
	var assignmentTable = app.ui.assignmentTable = (function () {
		var $el = $('#assignments');
		var rowTemplate = _.template($('#assigned-row-template').html());

		var api = {
			model: [],
			populate: function (assignments) {
				var self = this;
				this.empty();
				this.model = assignments;
				assignments.forEach(function (assignment, index) {
					self.addRow(assignment.master, assignment.apprentice, index);
				});
			},
			addRow: function (master, apprentice, index) {
				var boundRowTemplate = rowTemplate({
					index: index,
					masterName: master.name,
					apprenticeName: apprentice.name
				});
				var $tr = $(boundRowTemplate);
				$el.find('tbody').append($tr);
			},
			removeRow: function (index) {
				$el.find('tr[data-index="' + index + '"]').remove();
			},
			addAssignment: function (master, apprentice) {
				this.model.push({
					master: master,
					apprentice: apprentice
				});
				this.addRow(master, apprentice, this.model.length - 1);
			},
			empty: function () {
				$el.find('tbody').empty();
			}
		};

		$el.on('click', '.unassign-apprentice', function (e) {
			e.preventDefault();
			var $a = $(e.target);
			var index = Number($a.attr('data-index'));
			var assignment = assignmentTable.model[index];
			state.unassignApprentice(assignment.master, assignment.apprentice).fail(function (err) {
				msg.error('failed to unassign apprentice:', err);
			});
		});

		state.on('assignments-changed', function () {
			assignmentTable.populate(state.assignments);
		});

		return api;
	}());

	/**
	 * Initialize application state.
	 * This will fetch all initial data and set up
	 * the page.
	 */
	state.init().fail(function (err) {
		msg.error(err);
	});

}(window.app, window.$, window._));