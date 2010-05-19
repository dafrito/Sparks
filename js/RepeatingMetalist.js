Sparks.repeating_metalist = function repeating_metalist(options) {
	if(Sparks.is_list(options))
		options = {source:options};
	options = options || {};
	var that = Sparks.metalist(options);

	that.repetitions = options.repetitions || 3;

	function make_pointer(position, repeat) {
		return Sparks.item_pointer(that.list,
			(repeat * (that.list.length() / that.repetitions)) + 
				Sparks.get_position(that.source, position)
		);
	}

	function update_list(action, pointers, items) {
		var processed_pointers = [];
		var processed_items = [];
		for(var repeat = 0; repeat < that.repetitions; repeat++) {
			for(var i in pointers) {
				processed_pointers.push(make_pointer(pointers[i], repeat));
				processed_items.push(items[i]);
			}
		}
		return Sparks.push_event(that.list, action, processed_pointers, processed_items);
	}
	that.add_item = Sparks.obj_func(update_list, "add_item");
	that.remove_item = Sparks.obj_func(update_list, "remove_item");

	function update_order(action, sources, destinations) {
		var processed_sources = [];
		var processed_destinations = [];
		for(var repeat = 0; repeat < that.repetitions; repeat++) {
			for(var i in sources) {
				processed_sources.push(make_pointer(sources[i], repeat));
				processed_destinations.push(make_pointer(destinations[i], repeat));
			}
		}
		return Sparks.push_event(that.list, action, processed_sources, processed_destinations);
	}
	that.move_item = Sparks.obj_func(update_order, "move_item");
	that.swap_item = Sparks.obj_func(update_order, "swap_item");

	options.source && that.set_source(options.source);

	return that;
}
