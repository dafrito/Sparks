Sparks.multiset = function multiset(options) {
	options = options || {};
	var that = {};
	if(that.items = Sparks.get_items(options)) {
		that.items = that.items.slice();
		options = {items:that.items};
	}

	that.toString = Sparks.toString;
	that.__repr__ = function __repr__() {
		return "Sparks.Multiset (slots:"+that.slots.length+")";
	}

	that.slots = Sparks.set();
	that.slots.comparator = function comparator(slot, testing) {
		return slot.key === testing;
	};
	that.get_key = options.get_key;
	that.key_matcher = options.key_matcher || Sparks.operator.seq;

	that.get_count = function get_count(key) {
		var slot = that.slots.get(key);
		if(slot)
			return slot.items.length;
		return 0;	
	}

	/* Utility function to create our keys; 
		we could just as well do this inline. */
	function create_keys(value) {
		return Sparks.coerce_array(
			that.get_key ? that.get_key(value) : value
		);
	}

	that.add = function add(value) {
		var keys = create_keys(value);
		for(var i in keys) {
			var key = keys[i];
			var slot = that.get_slot(key);
			if(!slot) {
				that.slots.push(slot = {
					key:key,
					items:[]
				});
			}
			slot.items.push(value);
			for(var i in that.listeners)
				that.listeners[i](key, items.length, slot);
		}
	}

	that.remove = function remove(value) {
		var keys = create_keys(value);
		for(var i in keys) {
			var slot = that.get_slot(keys[i]);
			assert(slot, "Sparks.multiset.remove: Slot is falsy.");
			slot.items.splice(Sparks.find_value(slot.items, value), 1);
			for(var i in that.listeners)
				that.listeners[i](key, items.length, slot);
			if(slot.items.length === 0)
				that.slots.remove(slot);
		}
	}

	that.update_list_listener = function update_list_listener(src, action, pointers, items) { 
		switch(action) {
			case "add_item":
				Sparks.map_call(that.add, items);
				break;
			case "clear_items":
			case "remove_item":
				for(var i in pointers)
					that.remove(pointers[i].item());
		}
	}

	that.add_list = function add_list(list) {
		if(Sparks.is_event_source(list)) {
			Sparks.add_listener(list, Sparks.event_descendents("update_list"), 
				that.update_list_listener
			);
		} else {
			Sparks.map(list, that.add);
		}
		that.lists.push(list);
	}

	that.remove_list = function remove_list(list) {
		if(Sparks.is_event_source(list)) {
			Sparks.remove_event_listener(that, "update_list", that.update_list_listener);
		} else {
			Sparks.map(list, that.remove);
		}
		that.lists.splice(Sparks.find_value(that.lists, list), 1);	
	}

	that.listeners = options.listeners || [];

	that.lists = [];
	if(options.lists) {
		for(var i in options.lists)
			that.add_list(options.lists[i]);
	}

	return that;
}
