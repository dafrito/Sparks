Sparks.style_telescope = function style_telescope(options) {	
	var that = Sparks.telescope(options);
	that.preprocessor = function preprocessor(rules) {
		return Sparks.obj_func(Sparks.update_style, rules);
	};	
	return that;
}

Sparks.telescope = function telescope(options) {
	options = options || {};
	var that = {};

	that.object = options.object;

	/* If you need to remove elements that aren't at the end
		of a list, then your list needs to be proxied. Otherwise,
		it's wise to keep this list nonproxied if performance is
		a factor. */
	that.lenses = Sparks.list({proxied:options.proxied === false ? false : true});

	that.preprocessor = options.preprocessor;

	var listeners = [];
	
	that.add_listener = Sparks.listener_adder(listeners);

	that.trigger = function trigger() {
		for(var i in listeners)
			listeners[i](that.object);
	}

	that.push = that.add = function add(applier) {
		if(that.preprocessor)
			applier = that.preprocessor.apply(null, arguments);
		var original = applier;
		var lens = {apply:applier, original:original};
		apply(lens);
		var d = that.lenses.add(lens);
		if(d) {
			d.add_listener(function add_listener() {
				lens.pointer = Sparks.item_pointer(that.lenses, that.lenses.items.length - 1);
			});
		} else {
			lens.pointer = Sparks.item_pointer(that.lenses, that.lenses.items.length - 1);
		}
		that.trigger();
		return Sparks.obj_func(remove, lens);
	}

	that.add_all = function add_all(lenses) {
		var removers = [];
		for(var i in lenses)
			removers.push(that.add(lenses[i]));
		return function remove() {
			while(removers.length)
				removers.pop()();
		}
	}

	that.clear = function clear() {
		var lenses = that.lenses.items.slice();
		var removed = [];
		while(lenses.length) {
			var lens = lenses.pop();
			lens.unapply();
			removed.push(lens.original);
		}
		that.lenses.clear();
		that.trigger();
		return removed.reverse();
	}

	that.pop = function pop() {
		var lens = that.lenses.last();
		if(lens)	
			return remove(lens);
	}

	that.set_object = function set_object(object) {
		var lenses = that.lenses.items.reverse();
		Sparks.map_call(lenses, "unapply");
		lenses.reverse();
		that.object = object;
		Sparks.map(lenses, apply);
		that.trigger();
	}

	function apply(lens) {
		var returned = lens.apply(that.object);
		if(typeof returned !== "function") {
			var old = that.object;
			lens.unapply = function remover() { that.object = old; };
			that.object = returned;
		} else 
			lens.unapply = returned;
	}

	function remove(lens) {
		that.lenses.lock.acquire().add_listener(function lock_listener() {
			assert(that.lenses.proxied || lens.pointer.position === that.lenses.items.length - 1, 
				"Sparks.telescope: Non-proxied lists do not support removals of non-last elements."
			);
			if(!lens.pointer || lens.pointer.frozen)
				return;
			var lenses = that.lenses.items.slice(lens.pointer.position).reverse();
			Sparks.map_call(lenses, "unapply");
			lenses.pop();
			lenses.reverse();
			Sparks.map(lenses, apply);
			Sparks.signal_event(that.lenses, "remove_item", lens.pointer, lens);
			that.lenses.lock.release();
			that.trigger();
		});
		return lens.original;
	}

	return that;
}
