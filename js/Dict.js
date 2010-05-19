// Sparks.Dict

Sparks.is_dict = function is_dict(obj) {
	return !!obj && typeof obj === "object" && 
		typeof obj.get === "function" && 
		typeof obj.set === "function" && 
		typeof obj.unset === "function";
}

Sparks.dict = function dict(options) {
	if(options === true)
		options = {items:arguments[1]};
	options = options || {};

	var that = Sparks.event_source("Dict");

	that.__json__ = function __json__() { return that.items; }

	if(typeof options.proxied === "undefined" || options.proxied) {
		that.proxy_update_dict = Sparks.push_event;
		Sparks.add_event_listener(that, Sparks.event_descendents("update_dict"), 
			Sparks.Event.process
		);
	} else {
		that.proxy_update_dict = Sparks.Event.unproxied;
	}

	that.items = options.items ? MochiKit.Base.clone(options.items) : {};

	that.defaulter = options.defaulter;

	that.computed = function computed(other) {
		if(typeof other === "function")
			return other;
		if(!other)
			return that.get;
		if(arguments.length === 2) {
			other = {};
			other[arguments[0]] = arguments[1];
		}
		other = Sparks.get_dict_items(other);
		return function computer(key) {
			return key in other ? other[key] : that.get(key);
		}
	}

	that.watch = function watch(key) {
		return Sparks.watcher(that, key);
	}

	that.get = function get(key) {
		if(!(key in that.items) && that.defaulter)
			that.items[key] = that.defaulter(key);
		return that.items[key];
	}

	that.set = function set(keys, values) {
		return that.proxy_update_dict(that, "set_item", keys, values);
	}

	that.unset = function unset(/* ... */) {
		return that.proxy_update_dict(that, "unset_item", 
			MochiKit.Base.flattenArray(Sparks.get_args(arguments))
		);
	}

	that.is_set = function is_set(key) {
		return key in that.items;
	}

	return that;
};

Sparks.add_initializer("Dict Event Preprocessors", function dict_prepxrs() {
	function update_dict_prepxr(src, action, items, old) {
		if(typeof items === "string") {
			var obj = {};
			obj[items] = old;
			var old_obj = {};
			old_obj[items] = src.get(items);
			items = obj;
			old = old_obj;
		}
		if(items instanceof Array) {
			var obj = {};
			for(var i in items)
				obj[items[i]] = old ? old[i] : undefined;
			old = undefined;
			items = obj;
		}
		if(!old) {
			old = {};
			for(var i in items)
				old[i] = src.get(i);
		}
		return [src, action, items, old];
	};

	Sparks.set_event_action_preprocessor("set_item", update_dict_prepxr);
	Sparks.set_event_action_preprocessor("unset_item", update_dict_prepxr);
});

Sparks.Event.set_item = function set_item(dict, action, items, old, processor) {
	dict = Sparks.get_dict_items(dict);
	for(var i in items) {
		if(processor)
			processor(i, items[i], old[i]);
		else
			dict[i] = items[i];
	}
}

Sparks.Event.unset_item = function unset_item(dict, action, items, old, processor) {
	dict = Sparks.get_dict_items(dict);
	for(var i in items) {
		if(processor)
			processor(i, items[i]);
		else {
			dict[i] = undefined;
			delete dict[i];
		}
	}
}
