Sparks.is_set = Sparks.izzer("Set");

Sparks.set = function set(options) {
	options = options || {};
	var that = Sparks.event_source("Set");
	if(that.items = Sparks.get_items(options)) {
		that.items = that.items.slice();
		options = {items:that.items};
	}

	that.__json__ = function __json__() { return that.items; }

	if(typeof options.proxied === "undefined" || options.proxied) {
		that.proxy_update_list = Sparks.push_event;
		Sparks.add_event_listener(that, Sparks.event_descendents("update_list"), 
			Sparks.Event.process
		);
	} else {
		that.proxy_update_list = Sparks.Event.unproxied;
	}	

	that.converter = options.converter || Sparks.blind;

	that.comparator = options.comparator || function cmp(a, b) {
		if(typeof a === typeof b && typeof a === "number")
			return a - b;
		return MochiKit.Base.compare(a, b);
	}

	if(options.items)
		that.items = Sparks.stable_sorted(options.items, that.comparator);
	else
		that.items = [];

	that.set_operations = function set_operations(other_set) {
		return Sparks.set_operations(that, other_set, that.comparator);
	}

	that.length = function length() { return that.items.length; }	
	that.first = function first() { return that.items[0]; }
	that.last = function last() { return Sparks.last(that.items); }

	that.is_below = function is_below(item) { return that.compare(item, that.first()) < 0; }
	that.is_above = function is_below(item) { return that.compare(item, that.last()) > 0; }

	that.out_of_range = function out_of_range(item) {
		return that.compare(item, that.items[0]) < 0 || that.compare(item, Sparks.last(that.items)) > 0;
	}

	that.add_to_item = options.add_to_item;

	that.add = function add(/* ... */) {
		var args = Sparks.get_args(arguments);
		//Sparks.log_joined("Sparks.set: Attempting to add items:", args);
		var processed_items = [];
		var items = [];
		for(var i in args) {
			var item = args[i];
			var processed = that.converter(item);
			if(processed !== undefined && Sparks.is_found(processed_items, processed, that.comparator))
				continue;
			items.push(item)
			processed_items.push(processed);
		}
		items = Sparks.stable_sorted(items, that.compare);
		//Sparks.log_joined("Sparks.set: After internal filtering:", items);
		var pointers = Sparks.map(items, function mapper(item) { 
			var pointer = that.get(item, "highest");
			if(!pointer.valid())
				return pointer;
			var cmp = that.comparator(that.converter(item), that.converter(pointer.item()));
			if(cmp === 0 || cmp === true) {
				if(that.add_to_item)
					that.add_to_item(pointer.item(), item);
				return;
			}
			return pointer;
		});
		for(var i = 0; pointers.length && i < pointers.length; i++) {
			if(pointers[i])
				continue;
			pointers.splice(i, 1);
			items.splice(i--, 1);
		}
		//Sparks.log_joined("Current List:", Sparks.get_items(that));
		//Sparks.log_joined("After list-to-list filtering:", items);
		//Sparks.log_joined("Pointers:", pointers);
		return that.proxy_update_list(that, "add_item", pointers, items);
	}
	that.add_all = Sparks.list_applier(that.add);

	that.remove = function remove(/* ... */) {
		var items = Sparks.get_args(arguments);
		return that.proxy_update_list(that, "remove_item", Sparks.map(items, that.get), items);	
	}
	that.remove_all = Sparks.list_applier(that.remove);

	that.clear = function clear() {
		return that.proxy_update_list(that, "clear_items");
	}

	that.slice = function slice(min_item, max_item, include_equals) {
		if(!that.length())
			return [];
		var min = that.get(min_item, "nearest");
		var min_cmp = that.compare(min_item, min.item());
		min.freeze();
		min = min.position;
		if((min_cmp === 0 && !include_equals) || min_cmp > 0)
			min++;
		var max = that.get(max_item, "nearest");
		max.freeze();
		var max_cmp = that.compare(max_item, max.item());
		max = max.position;
		if((include_equals && max_cmp === 0) || max_cmp > 0)
			max++;
		return that.items.slice(min, max);
	},

	that.min = function min() { return that.items[0]; }
	that.max = function max() { return that.items[that.items.length - 1]; }

	that.compare = function compare(a, b) {
		return that.comparator(that.converter(a), that.converter(b));
	}

	that.get = function get(item, tolerance_mode) {
		tolerance_mode = tolerance_mode || "strict"; 
		if(!that.items.length) {
			if(tolerance_mode === "strict")
				return;
			return Sparks.item_pointer(that, 0);
		}
		//Sparks.log("Beginning search", {item:item, mode:tolerance_mode});
		if(Sparks.is_item_pointer(item))
			return item;
		item = that.converter(item);
		var min_bound = 0;
		var max_bound = that.items.length - 1;
		while(true) {
			var mid = Math.floor(min_bound + ((max_bound - min_bound) / 2));
			//Sparks.log("Searching set", {min:min_bound, max:max_bound, mid:mid});
			var cmp = that.comparator(item, that.converter(that.items[mid]));
			//Sparks.log("Item compared.", {item:that.items[mid], cmp:cmp});
			if(cmp === 0) {
				return Sparks.item_pointer(that, mid);
			}
			if(cmp > 0) {
				min_bound = mid;
			} else {
				max_bound = mid;
			}
			if(max_bound === min_bound) {
				if(tolerance_mode === "strict")
					return;
				// We have an extreme.
				if(mid === 0) {
					if(cmp > 0) {
						if(tolerance_mode === "highest")
							return Sparks.item_pointer(that, mid + 1);
						if(cmp >= Math.abs(that.comparator(item, that.converter(that.items[mid + 1]))))
							return Sparks.item_pointer(that, mid + 1);
						return Sparks.item_pointer(that, mid);
					}
					return Sparks.item_pointer(that, mid);
				} else {
					if(cmp < 0) {
						if(tolerance_mode === "highest")
							return Sparks.item_pointer(that, mid);
						if(Math.abs(cmp) >= that.comparator(item, that.converter(that.items[mid - 1])))
							return Sparks.item_pointer(that, mid - 1);
						return Sparks.item_pointer(that, mid);
					}
					if(tolerance_mode === "highest")
						return Sparks.item_pointer(that, mid + 1);
					return Sparks.item_pointer(that, mid);
				}
			}
			if(max_bound - min_bound === 1) {
				if(min_bound === 0 && cmp < 0) {
					max_bound = min_bound;
					continue;
				} else if(max_bound === that.items.length - 1 && cmp > 0) {
					min_bound = max_bound;
					continue;
				} else if(tolerance_mode === "highest") {
					return Sparks.item_pointer(that, max_bound);
				} else if(tolerance_mode === "nearest") {
					if(Math.abs(cmp) < Math.abs(that.comparator(item, 
							that.converter(that.items[max_bound])))) {
						return Sparks.item_pointer(that, min_bound);
					}
					return Sparks.item_pointer(that, max_bound);
				}
				// Tolerance mode is strict, so just return.
				return;
			}
		}
	}

	return that;
}

Sparks.set_operations = function set_operations(options) {
	if(arguments.length > 1)
		options = {first:arguments[0], second:arguments[1], comparator:arguments[2]};
	var that = {};

	that.comparator = options.comparator || MochiKit.Base.compare;
	if(!Sparks.is_set(options.first))
		that.first = Sparks.set({items:options.first, comparator:that.comparator});
	else
		that.first = options.first;
	if(!Sparks.is_set(options.second))
		that.second = Sparks.set({items:options.second, comparator:that.comparator});
	else
		that.second = options.second;

	if(that.comparator(that.first.min(), that.second.min()) > 0) {
		var temp = that.first;
		that.first = that.second;
		that.second = temp;
	}

	var intersection;
	that.intersection = function intersection_fxn() {
		if(intersection)
			return intersection;
		intersection = that.first.slice(that.second.min(), that.second.max(), true);
		intersection = intersection.concat(that.second.slice(that.first.min(), that.first.max(), true));
		return intersection = Sparks.set(intersection);
	}

	var first_difference;
	that.first_difference = that.complement = function first_difference_fxn() {
		if(first_difference)
			return first_difference;
		that.intersection();
		first_difference = that.first.slice(that.first.min(), intersection.min());
		first_difference = first_difference.concat(that.first.slice(
			intersection.max(), that.first.max()
		));
		return first_difference = Sparks.set(first_difference);
	}

	var second_difference;
	that.second_difference = function second_difference_fxn() {
		if(second_difference)
			return second_difference;
		that.intersection();
		second_difference = that.second.slice(that.second.min(), intersection.min());
		second_difference = second_difference.concat(that.second.slice(
			intersection.max(), that.second.max()
		));
		return second_difference = Sparks.set(second_difference);
	}

	var union;
	that.union = function union_fxn() {
		if(union)
			return union;
		union = that.second_difference().items;
		union = union.concat(that.intersection().items);
		union = union.concat(that.first_difference().items);
		return union = Sparks.set(union);
	}

	return that;
}
