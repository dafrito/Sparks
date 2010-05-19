Sparks.mouse_director = function mouse_director(options) {
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

	that.set_elements = function set_elements(elements) {
		that.operational = that.operational === false ? false : true;
		that.elements = elements || that.elements;
		that.elements.add_post_processor(function(out, pointer) {
			return Sparks.add_event_listener(out, ["onmouseover", "onmouseout", "onmousedown"], 
				function mouse_listener(src, action, event) {
					if(!that.operational)
						return;
					switch(action) {
						case "onmouseover":
							that.sanitize_hover();
							that.hover_sanitizers.push.apply(that.hover_sanitizers, 
								Sparks.map_call(that.hover_listeners, pointer)
							);
							break;
						case "onmouseout":
							that.sanitize_hover();
							break;
						case "onmousedown":
							that.sanitize_select();
							that.select_sanitizers.push.apply(that.select_sanitizers, 
								Sparks.map_call(that.select_listeners, pointer)
							);
					}
				}
			);
		});
	};

	that.add_hover_listener = Sparks.listener_adder(that.hover_listeners = [], true);
	that.sanitize_hover = Sparks.exhauster(that.hover_sanitizers = []);
	that.add_select_listener = Sparks.listener_adder(that.select_listeners = [], true);
	that.sanitize_select = Sparks.exhauster(that.select_sanitizers = []);

	options.elements && that.set_elements(options.elements);

	return that;
}
