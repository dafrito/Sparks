// Sparks.Core

/* 
	The center of all Sparks activity, you'll find all constructors,
	some math stuff, enumeration, assert, timers, event-source
	searching, initializers.

	Notice that, of course, everything that is Sparks is referenced
	via "Sparks.<blah>"
*/

// Assert function, for lack of a better one.
function assert(truth, fail_statement) {
	truth = !!truth;
	fail_statement = fail_statement || "Assertion failed!";
	if(!truth) {
		if(arguments.length > 2) {
			fail_statement = Sparks.interpolate.apply(null, 
				[fail_statement].concat(Sparks.get_args(arguments, 2))
			);	
		}
		Sparks.log_joined(fail_statement, new Error());
		debugger;
		throw new Error("AssertionError: " + (fail_statement || "An assertion failed!"));
	}
}

// Define our stuff for Sparks proper.
Sparks = {
	notime:"No, seriously, no time!",
	initializers:[],
	counter:MochiKit.Base.counter(0),

	// DEBUG MODE SWITCH
	debug:true,

	keys:function keys(obj) {
		var arr = [];
		for(var i in obj)
			arr.push(i);
		return arr;
	},

	values:function values(obj) {
		var arr = [];
		for(var i in obj)
			arr.push(obj[i]);
		return arr;	
	},

	get_args:function get_args(args, slice) {
		slice = slice || 0;
		var ret = [];
		var len = args.length;
		for(var i = slice; i < len; i++)
			ret.push(args[i]);
		return ret;
	},

	__repr__:function __repr__() { return "Sparks Javascript Framework"; },
	toString:MochiKit.Base.forwardCall("__repr__"),

	truer:function truer() { return true; },
	falser:function falser() { return false; },
	blind:function blind(arg) { return arg; },

    operator: {
        // Unary logic operators:
        truth: function truth(a) { return !!a; },
        lognot: function lognot(a) { return !a; },
        identity: function identity(a) { return a; },

        // Bitwise unary operators:
        not: function not(a) { return ~a; },
        neg: function neg(a) { return -a; },

        // Binary operators:
        add: function add(a, b) { return a + b; },
        sub: function sub(a, b) { return a - b; },
        div: function div(a, b) { return a / b; },
        mod: function mod(a, b) { return a % b; },
        mul: function mul(a, b) { return a * b; },

        // Bitwise binary operators:
        and: function and(a, b) { return a & b; },
        or: function or(a, b) { return a | b; },
        xor: function xor(a, b) { return a ^ b; },
        lshift: function lshift(a, b) { return a << b; },
        rshift: function rshift(a, b) { return a >> b; },
        zrshift: function zrshift(a, b) { return a >>> b; },

        // Binary logical operators:
        logand: function logand(a, b) { return a && b; },
        logor: function logor(a, b) { return a || b; },

        // Coercing built-in comparators:
        eq: function eq(a, b) { return a == b; },
        ne: function ne(a, b) { return a != b; },
        gt: function gt(a, b) { return a > b; },
        ge: function ge(a, b) { return a >= b; },
        lt: function lt(a, b) { return a < b; },
        le: function le(a, b) { return a <= b; },

        // Strict built-in comparators:
        seq: function seq(a, b) { return a === b; },
        sne: function sne(a, b) { return a !== b; },

        contains: function contains(a, b) { return b in a; },
    },
	noop:MochiKit.Base.noop,

	compare:MochiKit.Base.compare,

	is_color:function is_color(obj) {
		return obj instanceof MochiKit.Color.Color;
	},	

	color:function color(options) {
		if(Sparks.is_color(options))
			return options;
		if(typeof options === "string")
			return MochiKit.Color.Color.fromString(options);
		if(arguments.length > 1)
			return new MochiKit.Color.Color(arguments[0], arguments[1], arguments[2]);
	},

	// Initialization 
	add_initializer:function add_initializer(name) {
		var args = Sparks.get_args(arguments);
		typeof args[0] === "string" ?  args.shift() : name = undefined;
		var initializer = Sparks.obj_func.apply(null, args);
		Sparks.initializers.push({name:name, initializer:initializer});
	},

	initialize:function initialize() {
		var stopper = Sparks.timer();
		var init_stopper;
		for(var i = 0; i < Sparks.initializers.length; i++) {
			var initializer = Sparks.initializers[i];
			Sparks.debug && (init_stopper = Sparks.timer());
			initializer.initializer(); 
			Sparks.debug && Sparks.log_interpolated(
				"Initialized %n. %d millisecond(s)", initializer.name, init_stopper()
			);
		}
		Sparks.log_urgent("Initialization finished. %d milliseconds", stopper());
	},

	timer:function timer() {
		var date = new Date();
		return function stopper() {
			return (new Date()).getTime() - date.getTime();
		}
	},

	output:function output(node, parent) {
		parent = MochiKit.DOM.getElement(parent);
		switch(typeof node) {
			case "object":
				if(node)
					break;
			case "undefined":
				node = node === null ? "null" : "undefined";
			case "number":
			case "string":
			case "boolean":
				return Sparks.output(document.createTextNode(node.toString()), parent);
			case "function":
				return Sparks.output(node(parent), parent);
		}
		if(Sparks.is_dom(node))
			return node;
		if(node.output)
			return Sparks.output(node.output(parent));
		node = Sparks.get_items(node) || node;
		if(node instanceof Array) {
			if(Sparks.every(node, Sparks.is_dom))
				return node;
			return Sparks.gather_results({
				values:node,
				coercer:function coercer(obj) {
					return Sparks.output(obj, parent);
				}
			});
		}
		if(Sparks.is_deferred(node)) {
			return Sparks.add_listener(node, function(out) { 
				return Sparks.output(out, parent);
			});
		}
		if(Sparks.is_watcher(node))
			return Sparks.output(node.get_value(), parent);
		return Sparks.output(node.toString(), parent);
	},

	fire_reversibles:function fire_reversibles(listeners, reversers) {
		var args = Sparks.get_args(arguments, 2);
		for(var i = 0; i < listeners.length; i++) {
			var reverser = listeners[i].apply(null, args);
			if(typeof reverser === "function") {
				reversers.push(reverser);
				listeners.splice(i--, 1);
			}
		}
	},

	partition_array:function partition_array(array, slices) {
		if(slices > 0 && slices < 1)
			slices = 1 / slices;
		array = array.slice();
		var slice_size = Math.round(array.length / slices);
		var partitions = [];
		while(partitions.length < slices)
			partitions.push(array.splice(0, slice_size));
		if(array.length)
			partitions.push(array);
		return partitions;
	},

	listener_adder:function listener_adder(listeners, provide_remover) {
		return function add() {
			var pos = listeners.push(Sparks.obj_func.apply(null, arguments));
			if(provide_remover) {
				return function remove() {
					delete listeners[pos - 1];
				}
			}
			return pos;
		}
	},

	object_adder:function object_adder(objects, provide_remover) {
		return function add(obj) {
			var pos = objects.push(obj);
			if(provide_remover) {
				return function remove() {
					delete objects[pos - 1];
				}
			}
			return pos;
		}
	},

	list_applier:function list_applier(func) {
		return function list_applier(items) {
			return func.apply(null, Sparks.get_items(items));
		}	
	},

	exhaust:function exhaust(array) {
		if(!(array instanceof Array)) {
			if(arguments.length === 2)
				array = array[arguments[1]];
			if(!(array instanceof Array))
				array = array();
		}
		while(array.length) {
			var func = array.shift();
			typeof func === "function" && func();
		}
	},

	exhauster:function exhauster(array) {
		if(arguments.length === 2)
			array = Sparks.obj_func(MochiKit.Base.itemgetter(arguments[1]), arguments[0]);
		return Sparks.obj_func(Sparks.exhaust, array);
	},

	strip_args:function strip_args() {
		var func = Sparks.obj_func.apply(null, arguments);
		return function stripped_func() {
			return func();
		}
	},

	string_tester:function string_tester(tester) {
		if(arguments.length > 1)
			tester = Sparks.obj_func.apply(null, arguments);
		if(tester instanceof Array)
			tester = Sparks.obj_func(Sparks.is_found, tester);
		if(typeof tester !== "function" && !(tester instanceof RegExp))
			tester = new RegExp(tester);
		if(tester instanceof RegExp)
			tester = Sparks.obj_func(function(regex, name) { return regex.exec(name); }, tester);
		tester.reversed = function() {
			return !tester.apply(null, arguments);
		}
		return tester;
	},

	tolerant_equal:function(a, b, tolerance) {
		return Math.abs(a - b) < tolerance;
	},

	magnitude:function magnitude(num) {
		return Math.floor(Math.LOG10E * Math.log(Math.abs(num)));
	},

	best_distance:function(source, dest, mod, steps) {
		steps = steps || [1, -1];
		var lowest = Number.POSITIVE_INFINITY;
		var best_step = -1;
		for(var i=0; i<steps.length;i++) {
			var d = Sparks.get_shortest_distance(source, dest, mod, i);
			if(d < lowest) {
				lowest = d;
				best_step = steps[i];
			}
		}
		return {step:best_step, distance:lowest, toString:function() { 
			return Sparks.interpolate("Distance", {step:this.step, distance:this.distance});
		}};
	},

	/* This gives us the shortest distance from source to dest, such that:
		source + distance(...) * step) % mod == dest
		A practical use is finding the shortest number of days from Sunday 
		to Friday, which is what Sparks.Date uses it for.
	*/
	get_shortest_distance:function(source, dest, mod, step) {
		step = step || 1;
		var dist = 0;
		assert(Sparks.tolerant_equal(
				source % step, 
				dest % step, 
				Math.pow(10, Sparks.magnitude(step))
			),
			"Sparks.distance: Source will never cleanly reach dest given the current step. ",
			{source:source, dest:dest, step:step}
		);
		return (dest - source) / step;
	},

	within_range:function within_range(min, max, num) {
		return Sparks.enforce_range(num, min, max) === num;
	},

	// Ensure: min <= num <= max
	enforce_range:function enforce_range(num, min, max) {
		if(arguments.length == 1) {
			min = 0;
			max = 1;
		}
		if(arguments.length == 2) {
			max = min;
			min = 0;
		}
		return Math.min(Math.max(min, num), max);
	},

	enforce_looping_range:function enforce_looping_range(num, min, max) {
		if(arguments.length === 2) {
			max = min;
			min = 0;
		}
		num = num % max;
		if(min > num)
			num += max - min;
		return num;
	},

	fibonacci_iterator:function fibonacci_iterator() {
		var register = [0, 0];
		return {
			count:0,
			next:function() {
				if(this.count++ === 1)
					return 1;
				var fibonacci = register.shift() + register[0];
				register.push(fibonacci || 1);
				return fibonacci;
			}
		}
	},

	array_range:function array_range(start, stop, step, array) {
		switch(arguments.length) {
			case 1:
				stop = start;
				start = 0;
			case 2:	
				step = stop > start ? 1 : -1;
		}
		array = array || Sparks.lowercase;
		var range = [];
		for(var i = start; i < stop; i += step)
			range.push(array[Sparks.enforce_range(i, array.length)]);
		return range;
	},

	range:function range(start, stop, step) {
		switch(arguments.length) {
			case 1:
				stop = start;
				start = 0;
			case 2:	
				step = stop > start ? 1 : -1;
		}
		var range = [];
		for(var i = start; i < stop; i += step)
			range.push(i);
		return range;
	},

	floored_modulus:function floored_modulus(num, mod) {
		return Math.floor(num / mod) * mod;
	},

	get_title:function get_title(obj) {
		if(typeof obj === "object")
			return Sparks.proper_nounize(obj.title || obj.type);
		return obj.toString();
	},

	get_items:function get_items(iterable, force) {
		if(typeof iterable === "function")
			return iterable();
		if(iterable instanceof Array)
			return iterable;
		if(typeof iterable === "object" && iterable.items)
			return Sparks.get_items(iterable.items);
		if(force) {
			try {
				return MochiKit.Iter.list(iterable);
			} catch(e) {
				// pass
			}
			return [iterable];
		}
	},

	get_dict_items:function get_dict_items(dict) {
		if(Sparks.is_dict(dict))
			return dict.items;
		return dict;	
	},

	get_node_operators:function get_node_operators(tree) {
		if(Sparks.is_tree(tree))
			return tree.node_operators;
		else if(Sparks.is_dom(tree)) {
			return {
				add:function adder(pos, item) {
					if(pos === tree.childNodes.length)
						MochiKit.DOM.appendChildNodes(tree, item);
					else
						MochiKit.DOM.insertSiblingNodesBefore(tree.childNodes[pos], item);
				}, 
				remove:function remover(pos, item) {
					Sparks.remove_element(item);
				}
			}
		}
	},

	get_position:function(items, position) {
		assert(arguments.length === 2, "Sparks.get_position(items, position): Requires 2 arguments.");
		if(Sparks.is_item_pointer(position))
			return position.position;
		if(typeof position === "string")
			return items.associations[position]
		return position;
	},

	generate_id:function generate_id(obj) {
		return !Sparks.debug ? obj.type :
			Sparks.snakerize(obj.type) + "_" + Sparks.counter();
	}
};

