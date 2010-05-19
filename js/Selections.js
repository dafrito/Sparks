Sparks.range_selection = function range_selection(options) {
	if(arguments.length > 1)
		options = {start:arguments[0], end:arguments[1], inclusive:arguments[2]};
	options = options || {};
	var that = Sparks.selection(options);

	var start = options.start,
		end = options.end, 
		inclusive = !!options.inclusive;
	that.start = function start_fxn() { return start; }
	that.end = function end_fxn() { return end; }
	that.inclusive = function inclusive_fxn() { return inclusive; }

	var reversed = false;

	that.toString = that.__repr__ = function toString() {
		return Sparks.interpolate(
			"Sparks.range_selection", {start:start, end:end, inclusive:inclusive}
		);
	}

	that.test = function test(item) {
		item = that.converter(item, that.comparator);
		var start_cmp = that.comparator(item, start);
		var end_cmp = that.comparator(item, end);
		if(inclusive && (!start_cmp || !end_cmp))
			return true;
		if(reversed) {
			var temp = start_cmp;
			start_cmp = end_cmp;
			end_cmp = temp;
		}
		return start_cmp > 0 && end_cmp < 0;
	}

	that.set_inclusive = function set_inclusive(new_inclusive) {
		new_inclusive = !!new_inclusive;
		if(!arguments.length || new_inclusive === inclusive)
			return inclusive;
		inclusive = new_inclusive;
		that.notify(start, end, inclusive);
	}

	function set_extreme(extreme, value) {
		value = arguments.length > 1 ? 
			that.converter(value, that.comparator) :
			that[extreme];
		if(that.comparator(value, that[extreme])) {
			that[extreme] = value;
			reversed = that.comparator(start, end) > 0;
			that.notify(start, end, inclusive);
		}
		return that[extreme];
	}
	that.set_start = Sparks.obj_func(set_extreme, "start");
	that.set_end = Sparks.obj_func(set_extreme, "end");

	return that;
}

Sparks.multiple_selection = function multiple_selection(options) {
	if(Sparks.get_items(options))
		options = {selected:Sparks.get_items(options)};
	options = options || {};
	var that = Sparks.selection(options);

	that.selected = "selected" in options ? Sparks.coerce_array(options.selected) : [];

	that.minimum = 0;
	that.maximum = Number.POSITIVE_INFINITY;

	that.toString = that.__repr__ = function toString() {
		return Sparks.interpolate(
			"Sparks.multiple_selection", {selected:that.selected, min:that.minimum, max:that.maximum}
		);
	}

	that.test = function test(item) {
		return Sparks.is_found(that.selected, item, that.comparator);
	}

	that.select = function select() {
		var items = Sparks.map(Sparks.get_args(arguments), function(item) {
			return that.converter(item, that.comparator);
		});
		that.selected = that.selected.concat(Sparks.difference(items, that.selected));
		that.selected.splice(0, that.selected.length - that.maximum);
		that.notify(that.selected);
	}
	that.select_all = Sparks.list_applier(that.select);

	that.unselect = function unselect() {
		var items = Sparks.map(Sparks.get_args(arguments), function(item) {
			return that.converter(item, that.comparator);
		});
		var removed = Sparks.intersection(items, that.selected)
		removed.splice(that.selected.length - that.minimum);
		that.selected = Sparks.difference(that.selected, removed);
		that.notify(that.selected);
	}
	that.unselect_all = Sparks.list_applier(that.unselect);

	that.toggle = function toggle() {
		var items = Sparks.map(Sparks.get_args(arguments), function(item) {
			return that.converter(item, that.comparator);
		});
		var adding = Sparks.difference(items, that.selected);
		var removing = Sparks.intersection(items, that.selected);
		var new_length = that.selected.length + adding.length - removing.length;
		if(new_length < that.minimum)
			removing.splice(new_length - that.minimum);
		that.selected = Sparks.difference(that.selected, removing).concat(adding);
		that.selected.splice(0, that.selected.length - that.maximum);
		that.notify(that.selected);
	}
	that.toggle_all = Sparks.list_applier(that.toggle);

	return that;
}

Sparks.single_selection = function single_selection(options) {
	options = options || {};
	var that = Sparks.selection(options);

	that.selected = options.selected;

	that.toString = that.__repr__ = function toString() {
		return Sparks.interpolate(
			"Sparks.single_selection", {selected:that.selected}
		);
	}

	that.test = function test(item) {
		item = that.converter(item, that.comparator);
		var cmp = that.comparator(item, that.selected);
		return cmp === true || cmp === 0;
	}

	that.select = function select(item) {
		item = that.converter(item, that.comparator);
		if(Sparks.equal(item, that.selected, that.comparator))
			return;
		that.selected = item;
		that.notify(that.selected);
	}
	that.unselect = Sparks.strip_args(that.select);
	that.toggle = function toggle(item) {
		item = that.converter(item, that.comparator);
		Sparks.equal(item, that.selected, that.comparator) ?  that.unselect() : that.select(item);
	}

	return that;
}

Sparks.selection = function selection(options) {
	options = options || {};
	var that = {};

	that.toString = that.__repr__ = function toString() { return "Sparks.selection()"; }

	that.test = options.test || Sparks.truer;
	that.test_all = function(items) {
		return Sparks.filter(items, that.test);
	}

	that.comparator = options.comparator || Sparks.operator.seq;
	that.converter = options.converter || Sparks.blind;

	that.add_listener = Sparks.listener_adder(that.listeners = [], true);
	var sanitizers = [];
	that.notify = function notify() {
		var args = Sparks.get_args(arguments);
		Sparks.exhaust(sanitizers);
		sanitizers = Sparks.map(that.listeners, function listener_caller(listener) {
			return listener.apply(null, args);
		});
	}

	return that;
}
