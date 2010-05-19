Sparks.key_director = function key_director(options) {
	if(typeof options === "boolean")
		options = {operational:false};
	if(Sparks.is_element_list(options))
		options = {elements:options};
	options = options || {};
	var that = {};

	that.set_operational = function set_operational(operational) {
		that.operational = operational;
		return Sparks.obj_func(that.set_operational, !that.operational);
	}
	that.enable = Sparks.obj_func(that.set_operational, true);
	that.disable = Sparks.obj_func(that.set_operational, false);
	that.operational = options.operational;

	that.get_pointer = options.get_pointer || function get_pointer() {
		assert(false, "Sparks.key_director.get_pointer: get_pointer must be provided.");
	}

	that.fix_pointer = options.fix_pointer || function fix_pointer(pointer) {
		pointer.position > 0 && pointer.wrap();
		return pointer.valid() ? pointer : undefined;
	}

	that.set_elements = function set_elements(elements, input, get_selected) {
		that.operational = that.operational === false ? false : true;
		that.elements = elements || that.elements;
		that.input = input || that.input;
		that.get_selected = get_selected || that.get_selected;
		that.key_listener = Sparks.key_listener(that.input, function key_listener(key) {
			if(!that.operational)
				return;
			var pointer = that.get_pointer(key.name);
			switch(key.name) {
				case "KEY_ARROW_DOWN":
				case "KEY_ARROW_UP":
					that.sanitize_hover();
					pointer = that.fix_pointer(Sparks.item_pointer(
						pointer.list, pointer.position + (key.name === "KEY_ARROW_UP" ? -1 : 1)
					));	
					that.hover_sanitizers.push.apply(that.hover_sanitizers, 
						Sparks.map_call(that.hover_listeners, pointer)
					);
					break;
				case "KEY_ENTER":
					that.sanitize_select();
					pointer = that.fix_pointer(pointer);
					that.select_sanitizers.push.apply(that.select_sanitizers, 
						Sparks.map_call(that.select_listeners, pointer)
					);
			}
		});
		return that.key_listener.detach;
	}

	that.add_hover_listener = Sparks.listener_adder(that.hover_listeners = [], true);
	that.sanitize_hover = Sparks.exhauster(that.hover_sanitizers = []);
	that.add_select_listener = Sparks.listener_adder(that.select_listeners = [], true);
	that.sanitize_select = Sparks.exhauster(that.select_sanitizers = []);

	if(options.elements && options.input && options.get_selected)
		that.set_elements(options.elements, options.input, options.get_selected);

	return that;
}
