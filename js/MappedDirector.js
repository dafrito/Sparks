Sparks.mapped_director = function mapped_director(options) {
	options = options || {};
	var that = {};

	that.set_elements = function set_elements(elements, input, mapper, validator) {
		that.elements = elements || that.elements;
		that.input = input || that.input;
		that.mapper = mapper || that.mapper;
		that.validator = validator || that.validator || Sparks.operator.seq;
		that.input_watcher = Sparks.input_watcher(that.input);
		that.input_watcher.add_listener(function(value) {
			that.sanitize_select();
			var results = [];
			var items = Sparks.get_items(that.elements);
			for(var i in items) {
				var item = items[i];
				var cmp = that.validator(that.mapper.convert(item), value);
				if(cmp === true || cmp === 0)
					results.push(Sparks.item_pointer(that.elements.items, i));
			}
			that.select_sanitizers.push.apply(that.select_sanitizers, 
				Sparks.map_call(that.select_listeners, results)
			);
		});
	}

	that.add_select_listener = Sparks.listener_adder(that.select_listeners = [], true);
	that.sanitize_select = Sparks.exhauster(that.select_sanitizers = []);

	if(options.elements && options.input && options.mapper)
		that.set_elements(options.elements, options.input, options.mapper, options.comparator);

	return that;
}
