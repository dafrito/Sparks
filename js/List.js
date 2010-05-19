Sparks.is_list = Sparks.izzer("List");

Sparks.list = function list(options) {
	options = options || {};
	var that = Sparks.event_source("List");
	if(that.items = Sparks.get_items(options)) {
		that.items = that.items.slice();
		options = {items:that.items};
	}

	that.__json__ = function __json__() { return that.items; }

	that.associations = options.associations || {};

	that.set_association = function set_association(name, pos) {
		return that.associations[name] = Sparks.item_pointer(that, pos);
	}

	that.get_association = function get_association(pos) {
		for(var i in that.associations) {
			if(that.associations[i].position == pos)
				return i;
		}		
	}

	that.proxied = options.proxied;
	if(typeof options.proxied === "undefined" || options.proxied) {
		that.update_list_proxy = that.update_order_proxy = Sparks.push_event;
		Sparks.add_event_listener(that, Sparks.event_descendents("update_list"),
			Sparks.Event.process
		);
		Sparks.add_event_listener(that, Sparks.event_descendents("update_order"),
			Sparks.Event.process
		);
	} else {
		that.update_list_proxy = that.update_order_proxy = Sparks.Event.unproxied;
	}

	that.items = options.items ? Sparks.get_items(options.items, true).slice() : [];

	that.first = function first() { return that.items[0]; }
	that.last = function last() { return that.items[that.items.length - 1]; }
	that.length = function length() { return that.items.length; }

	that.get = function get(item, comparator) {
		if(Sparks.is_item_pointer(item))
			return item;
		comparator = comparator || Sparks.operator.seq;
		for(var i in that.items) {
			var cmp = comparator(that.items[i], item);
			if(cmp === 0 || cmp === true)
				return Sparks.item_pointer(that, i);
		}
	}

	that.at = function at(pos) {
		pos = pos in that.associations ? that.associations[pos] : pos;
		return Sparks.item_pointer(that, pos);
	}

	that.add = that.push = function add(/* ... */) {
		var items = Sparks.get_args(arguments);
		return that.update_list_proxy(
			that, "add_item", Sparks.item_pointer(that, that.items.length), items
		);
	}

	that.add_all = function add_all(items) {
		return that.add.apply(null, Sparks.get_items(items, true));
	}

	that.add_at = function add_at(items, pointers) {
		var pointers = Sparks.map(pointers, that.at);
		return that.update_list_proxy(that, "add_item", pointers, items);
	}

	that.remove_at = function remove_at(/* ... */) {
		var pointers = Sparks.map(Sparks.get_args(arguments), that.at);
		return that.update_list_proxy(that, "remove_item", pointers, Sparks.map_call(pointers, "item"));
	}

	that.remove = function remove(/* ... */) {
		var items = Sparks.get_args(arguments);
		var pointers = Sparks.map(items, that.get);
		return that.update_list_proxy(that, "remove_item", pointers, items);
	}

	that.remove_all = function remove_all(items) {
		return that.remove.apply(null, items);
	}

	that.clear = function clear() {
		return that.update_list_proxy(that, "clear_items");
	}

	that.move = function move(sources, destinations) {
		sources = Sparks.map(Sparks.coerce_array(sources), that.get);
		destinations = Sparks.map(Sparks.coerce_array(destinations), Sparks.item_pointer, that);
		return that.update_order_proxy(that, "move_item", sources, destinations);
	}

	that.swap = function swap(sources, destinations) {
		sources = Sparks.map(Sparks.coerce_array(sources), that.get);
		destinations = Sparks.map(Sparks.coerce_array(destinations), that.get);
		return that.update_order_proxy(that, "swap_item", sources, destinations);
	}

	that.reverse = function reverse() {
		var sources = Sparks.map(Sparks.range(0, that.length()), that.at);
		var destinations = Sparks.map(Sparks.range(0, that.length()).reverse(), that.at);
		return that.update_order_proxy(that, "move_item", sources, destinations);
	}

	return that;
}

Sparks.add_initializer("List Event Preprocessors", function list_prepxrs() {
	Sparks.set_event_action_preprocessor("move_item", 
		function move_item_prepxr(src, action, sources, destinations) {
		sources = Sparks.coerce_array(sources);
		destinations = Sparks.coerce_array(destinations);
		for(var i in sources) {
			sources[i] = Sparks.item_pointer(src, sources[i]);
			destinations[i] = Sparks.item_pointer(src, destinations[i]);
		}
		return [src, action, sources, destinations];
	});

	Sparks.set_event_action_preprocessor("swap_item",
		function swap_item_prepxr(src, action, sources, destinations) {
		for(var i = 0; i < sources.length; i++) {
			var source = sources[i]; 
			var destination = destinations[i];
			sources[i] = Sparks.item_pointer(src, source);
			destinations[i] = Sparks.item_pointer(src, destination);
			source.freeze();
			destination.freeze();
			if(source.position > destination.position) {
				destinations.splice(i, 1, source);
				sources.splice(i, 1, destination);
			}
		}
		return [src, action, sources, destinations];
	});


	Sparks.set_event_action_preprocessor("add_item", 
		function add_item_prepxr(src, action, pointers, items) {
		items = Sparks.coerce_array(items);
		if(items.length) {
			pointers = Sparks.coerce_array(pointers);
		} else {
			pointers = [];
		}	

		assert(items.length >= pointers.length, 
			"Sparks.add_item_prepxr: Too many pointers for given items", 
			{pointers:pointers.length, items:items.length}
		);

		if(items.length !== pointers.length)
			pointers = pointers.concat(Sparks.repeat(pointers.pop(), items.length - pointers.length));

		for(var i = 0; i < pointers.length; i++) {
			pointers[i] = Sparks.item_pointer(src, pointers[i]);
		}	

		var ordered = Sparks.ordered_pointer_items(pointers, items);

		return [src, action, ordered.pointers, ordered.items];
	});

	Sparks.set_event_action_preprocessor("remove_item", 
		function remove_item_prepxr(src, action, pointers, items) {
		pointers = Sparks.coerce_array(pointers);
		for(var i in pointers) {
			pointers[i] = Sparks.item_pointer(src, pointers[i]);
		}
		if(!items) {
			items = [];
			for(var i in pointers)
				items.push(pointers[i].item());
		} else {
			items = Sparks.coerce_array(items);
		}

		var ordered = Sparks.ordered_pointer_items(pointers, items);

		return [src, action, ordered.pointers.reverse(), ordered.items.reverse()];
	});

	Sparks.set_event_action_preprocessor("clear_items",
		function clear_items_prepxr(src, action) {
			items = Sparks.get_items(src, true).slice();
			var pointers = [];
			for(var i in items)
				pointers.push(Sparks.item_pointer(src, i));
			return [src, action, pointers, items];
		}
	);

});

Sparks.Event.add_item = function add_item(list, action, pointers, items, processor) {
	list = Sparks.get_items(list, true);
	for(var i = 0; i < pointers.length; i++) {
		var pos = pointers[i].position + i;
		var item = items[i];
		if(processor)
			processor(pos, item);
		else
			list.splice(pos, 0, item);
	}
},

Sparks.Event.remove_item = function remove_item(list, action, pointers, items, processor) {
	list = Sparks.get_items(list, true);
	for(var i = 0; i < pointers.length; i++) {
		var pos = pointers[i].position;
		if(processor)
			processor(pos, items[i]);
		else
			list.splice(pos, 1);
	}
},

Sparks.Event.clear_items = function clear_items(list, action, pointers, items, processor) {
	list = Sparks.get_items(list);
	if(processor)
		processor();
	else
		list.splice(0, list.length);
},

Sparks.Event.swap_item = function swap_item(list, action, sources, destinations, processor) {
	list = Sparks.get_items(list, true);
	if(processor)
		list = list.slice();
	for(var i in sources) {
		var source = sources[i];
		var destination = destinations[i];
		list.splice(source.position, 1, destination.item());
		list.splice(destination.position, 1, source.item());
		if(processor)
			processor(source.position, destination.position);
	}
},

/* This function is unusually large since, to be atomic, our source/destination pairs
	are not sequentially dependent; Our move_item accepts source/dest pairs in any order.
	In order to achieve this, we have to manually keep track of offsets, and it turns out
	actually doing this is quite a mindfuck. */
Sparks.Event.move_item = function move_item(list, action, sources, destinations, processor) {
	list = Sparks.get_items(list, true);
	if(processor)
		list = list.slice();
	var offsets = [];
	for(var i = 0; i < list.length; i++) 
		offsets[i] = {value:0, locked:false};
	for(var i = 0; i < sources.length; i++) {
		var source = Sparks.get_position(list, sources[i]);
		var destination = Sparks.get_position(list, destinations[i]);
		var item_offset = offsets[source].value;
		var counter = destination - (source + item_offset);
		if(!counter)
			continue;
		var moving_direction = counter > 0 ? 1 : -1;
		counter = Math.abs(counter);
		var curr = source;
		while(counter) {
			// We start one off from our source intentionally.
			curr += moving_direction;
			var offset = offsets[curr];
			if(!offset.locked) {
				counter--;
				offset.value -= moving_direction;
			}
		}
		offsets[source].locked = true;
		offsets[source].value = destination - source;
		source += item_offset;
		var zero_sum = 0;
		for(var j in offsets) {
			zero_sum += offsets[j].value;
		}
		assert(!zero_sum, "Sparks.move_item: Zero sum isn't zero",
			{zero_sum:zero_sum}
		);
		var item = list.splice(source, 1)[0];
		list.splice(destination, 0, item);
		if(processor)
			processor(source, destination, item);
	}
	return list;
},

// Utility function used in our preprocessors. Probably never useful outside that case.
Sparks.ordered_pointer_items = function ordered_pointer_items(pointers, items) {
	var pointer_item_groups = [];
	for(var i = 0; i < items.length; i++)
		pointer_item_groups.push({pointer:pointers[i], item:items[i]});

	pointer_item_groups = Sparks.stable_sorted(pointer_item_groups, function cmp(a, b) {
		return MochiKit.Base.compare(a.pointer.position, b.pointer.position);
	});

	pointers = [];
	items = [];
	for(var i = 0; i < pointer_item_groups.length; i++) {
		var group = pointer_item_groups[i];
		pointers.push(group.pointer);
		items.push(group.item);
	}

	return {pointers:pointers, items:items};
}
