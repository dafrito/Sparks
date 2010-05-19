Sparks.dropdown = function dropdown(options) {
	options = options || {};

	var that = Sparks.anchorify(options);
	that.selector = options.selector || Sparks.selector(options);
	that.mapper = options.mapper || Sparks.primitive_mapper();

	that.mouse_director = Sparks.mouse_director(false);
	that.add_transition(that.mouse_director.enable);

	that.key_director = Sparks.key_director(false);
	that.key_director.get_pointer = function get_pointer() {
		var hover = that.selector.hover_selection;
		return that.selector.options.get(hover.selected, hover.comparator) || 
			Sparks.item_pointer(that.selector.options, -1);
	};
	that.add_transition(that.key_director.enable);

	that.attach_transitioner = function attach_transitioner(transitioner, dock, anchor) {
		that.anchor = that.anchor || Sparks.create_valid_child(that.parent);
		that.selector.output_to_placeholder(that.anchor);
		that.add_listener(function style_listener() {
			return Sparks.set_style(that.anchor, "width", Sparks.box(dock).width() + "px");
		});

		var focus_listener = Sparks.focus_listener(dock, transitioner.finish, transitioner.undo);
		focus_listener.add_listener(function focus_listener() {
			that.selector.hover_selection.select(that.selector.selection.selected);
		});	
		focus_listener.add_remover(that.undo);

		that.mouse_director.set_elements(that.selector.elements);
		that.mouse_director.add_hover_listener(that.selector.hover_selection.select);
		that.mouse_director.add_select_listener(that.selector.selection.toggle);

		that.key_director.set_elements(that.selector.elements, that.dock);
		that.key_director.add_hover_listener(that.selector.hover_selection.select);
		that.key_director.add_select_listener(that.selector.selection.toggle);

		that.selector.add_select_listener(function(out, pointer) {
			return Sparks.set_content(that.dock, that.mapper.convert(pointer.item()));
		});
		that.selector.add_group_listener(that.dock, that.dock.blur);

		return focus_listener.detach;
	};

	return that;
}
