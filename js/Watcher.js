Sparks.is_watcher = Sparks.izzer("Watcher");

Sparks.watcher = function watcher(dict, key, value) {
	var that = {type:"Watcher"};
	
	if(arguments.length === 1) {
		initial = dict;
		dict = key = undefined;
	}

	that.value = value;

	that.initialize = Sparks.exhauster(that.initializers = []);
	that.add_initializer = Sparks.listener_adder(that.initializers);
	that.add_initializer(function initializer() {	
		if(!that.dict)
			return;
		Sparks.add_event_listener(that.dict, Sparks.event_descendents("update_dict"),
			function update_dict_listener(src, action, items) {
				if(!(that.key in items))
					return;
				that.set_value(items[that.key]);
			}
		);
		that.value = that.dict.get(that.key);
	});

	that.set_value = function set_value(value) {
		that.value = arguments.length ? value : that.value;
		value = that.get_value(that.value);
		for(var i in that.listeners)
			that.listeners[i](value);
		return value;
	}
	that.trigger = Sparks.strip_args(that.set_value);

	that.get_value = function get_value(value) {
		if(!arguments.length)
			value = that.value;
		for(var i in that.processors) {
			var processed = that.processors[i](value);
			value = processed === undefined ? value : processed;
		}
		return value;
	}

	that.add_listener = Sparks.listener_adder(that.listeners = [], true);
	that.add_processor = Sparks.listener_adder(that.processors = [], true);

	that.dict = dict;
	that.key = key;
	that.dict && that.initialize();

	return that;
}
