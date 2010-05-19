MochiKit.Base.update(Sparks, {
	map_call:function map_call(iterable/*, ... */) {
		var args = Sparks.get_args(arguments);
		iterable = Sparks.get_items(iterable, true);
		var results = [];
		for(var i in iterable) {
			args[0] = iterable[i];
			var obj_func = Sparks.obj_func.apply(null, args);
			results.push(obj_func());
		}
		return results;
	},

	intersection:function intersection(first, second) {
		var intersecting = [];
		if(arguments.length > 2 && arguments[2])
			var comparator = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 2));
		for(var i in first) {
			if(Sparks.is_found(second, first[i], comparator))
				intersecting.push(first[i]);
		}
		return intersecting;
	},

	difference:function difference(first, second) {
		var difference = [];
		if(arguments.length > 2 && arguments[2])
			var comparator = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 2));
		for(var i in first) {
			if(!Sparks.is_found(second, first[i], comparator))
				difference.push(first[i]);
		}
		return difference;
	},
	
	flatten:function flatten(array, skipper) {
		array = Sparks.coerce_array(array);
		for(var i = 0; i < array.length; i++) {
			var item = array[i];
			if(item instanceof Array && (!skipper || !skipper(item)))
				array.splice.apply(array, [i--, 1].concat(item));
		}
		return array;
	},

	map:function map(iterable) {
		var results = [];
		var obj_func = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		iterable = Sparks.get_items(iterable, true);
		for(var i in iterable)
			results.push(obj_func(iterable[i]));
		return results;
	},

	every:function every(iterable) {
		if(arguments.length === 1)
			var tester = Sparks.operator.truth;
		else
			tester = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		iterable = Sparks.get_items(iterable, true);
		for(var i in iterable) {
			if(!tester(iterable[i]))
				return false;
		}
		return true;
	},

	some:function some(iterable) {
		if(arguments.length === 1)
			var tester = Sparks.operator.truth;
		else
			tester = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		iterable = Sparks.get_items(iterable, true);
		for(var i in iterable) {
			if(tester(iterable[i]))
				return true;
		}
		return false;
	},

	filter:function filter(iterable) {
		if(arguments.length === 1)
			var tester = Sparks.operator.truth;
		else
			tester = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		iterable = Sparks.get_items(iterable, true);
		var results = [];
		for(var i in iterable) {
			var item = iterable[i];
			var res = tester(item);
			if(res === 0 || res === true)	
				results.push(item);
		}
		return results;
	},

	reduce:function reduce(value, iterable) {
		reducer = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 2));
		iterable = Sparks.get_items(iterable, true);
		for(var i in iterable)
			value = reducer(iterable[i], value);
		return value;
	},

	repeat:function repeat(value, times) {
		var repeated = [];
		while(times--)
			repeated.push(value);
		return repeated;
	},

	get_permutation_count:function get_permutation_count(items) {
		if(typeof items === "string")
			items = MochiKit.Base.extend(null, items);
		var multiset = Sparks.multiset(items);
		var max_combinations = Sparks.Algorithm.factorial(Sparks.get_items(items).length);
		var duplicates = Sparks.map(multiset.slots, function mapper(slot) {
			return Sparks.Algorithm.factorial(slot.items.length);
		});
		duplicates = Sparks.reduce(1, duplicates, Sparks.operator.mul);
		return Math.floor(max_combinations / duplicates);
	},

	get_permutations:function get_permutations(items) {
		if(typeof items === "string")
			items = MochiKit.Base.extend(null, items);
		var permute = function permute(working, items) {
			if(!items.length)
				return [working];
			return Sparks.map(Sparks.multiset(items).slots, function permuter(slot) {
				var working_working = [].concat(working);
				var working_items = [].concat(items);
				var value = slot.items[0];
				working_items.splice(Sparks.find_value(working_items, value), 1);
				working_working.push(value);
				return permute(working_working, working_items);
			});
		}
		return Sparks.collapse_array(permute([], Sparks.get_items(items, true)));
	},

	get_random:function get_random(items, remove) {
		items = Sparks.get_items(items, true).slice();
		var pos = Math.floor(Math.random() * items.length);
		var item = items[pos];
		if(remove)
			items.splice(pos, 1);
		return {item:item, pos:pos};
	},

	shuffle:function shuffle(items) {
		if(typeof items === "string")
			items = MochiKit.Base.extend(null, items);
		items = Sparks.get_items(items, true).slice();
		var returning = [];
		for(var i = items.length; i; i--)
			returning.push(Sparks.get_random(items, true).item);
		return returning;
	},

	first:function first(iterable) {
		return Sparks.get_items(iterable)[0];
	},

	last:function last(iterable) {
		iterable = Sparks.get_items(iterable, true);
		return iterable[iterable.length - 1];
	},

	// [1,2,[3,4,[5], [6]], [7], 8] == simplify([1,2,[3,4,5,6],7,8]);
	simplify:function simplify(iterable) {
		var iterable = Sparks.get_items(iterable);
		if(!iterable)
			return iterable;
		iterable = iterable.slice();
		switch(iterable.length) {
			case 0:
				return;
			case 1:
				return Sparks.simplify(iterable[0]);
			default:
				for(var i = 0; i < iterable.length; i++)
					iterable.splice(i, 1, Sparks.simplify(iterable[i]) || iterable[i]);
				return iterable;
		}
	},

	coerce_array:function coerce_array(iterable) {
		return iterable instanceof Array ? iterable : [iterable];
	},

	equal:function equal(a, b, comparator) {
		var cmp = (comparator || MochiKit.Base.compare)(a, b);
		return cmp === 0 || cmp === true;
	},

	is_found:function is_found(iterable, val) {
		if(arguments.length > 2 && arguments[2])
			var comparator = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 2));
		return Sparks.find_value(iterable, val, comparator) !== -1;
	},

	// Non-throwing findValue.
	find_value:function find_value(iterable, val) {
		if(!iterable)
			return -1;
		var comparator = arguments.length > 2 && !!arguments[2] ?
			Sparks.obj_func.apply(null, Sparks.get_args(arguments, 2)) :
			Sparks.operator.seq;
		iterable = Sparks.get_items(iterable, true);
		for(var i = 0; i < iterable.length; i++) {
			var res = comparator(iterable[i], val);
			if(res === true || res === 0)
				return i;
		}
		return -1;
	}, 

	stable_sorted:function stable_sorted(iterable) {
		if(arguments.length > 1 && !!arguments[1])
			var comparator = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		iterable = Sparks.get_items(iterable).slice();
		if(iterable.length <= 1)
			return iterable;
		var mid = iterable.length / 2;
		return Sparks.merge_lists(
			Sparks.stable_sorted(iterable.slice(0, mid), comparator),
			Sparks.stable_sorted(iterable.slice(mid), comparator),
			comparator,
			true
		);
	},

	merge_lists:function merge_lists(left, right, comparator, presorted) {
		comparator = comparator || MochiKit.Base.compare;
		if(!presorted) {
			return Sparks.merge_lists(
				Sparks.stable_sorted(left),
				Sparks.stable_sorted(right),
				comparator,
				true
			);
		}
		var sorted = [];
		left = Sparks.get_items(left);
		right = Sparks.get_items(right);
		while(left.length > 0 && right.length > 0)
			sorted.push(0 >= comparator(left[0], right[0]) ? left.shift() : right.shift());
		return sorted.concat(left).concat(right);
	}

});
