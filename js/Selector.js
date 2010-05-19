Sparks.selector = function selector(options) {
	if(Sparks.is_list(options))
		options = {options:options};
	else if(Sparks.get_items(options))
		options = {options:Sparks.list(options)};
	options = options || {};
	var that = Sparks.rendered_selection(options);
	that.toString = that.__repr__ = function toString() {
		return Sparks.interpolate(
			"Sparks.selector", {options:that.options, selection:that.selection}
		);	
	}
	Sparks.attach_presenter(that, options.presenter || "Selector");

	that.elements = Sparks.element_list();
	that.options = options.options;

	function converter(value, comparator) {
		if(value === undefined)
			return;
		value = that.options.get(value, comparator) || Sparks.item_pointer(that.options, value);
		return value;
	}
	function comparator(item, selected) {
		item = Sparks.is_item_pointer(item) ? item.item() : item;
		selected = Sparks.is_item_pointer(selected) ? selected.item() : selected;
		return item === selected;
	}

	that.hover_selection = Sparks.single_selection();
	that.hover_selection.converter = converter;
	that.hover_selection.comparator = comparator;

	that.presenter.add_predrawer(function presenter_predrawer() {
		that.options = that.options || Sparks.list();
	});

	that.presenter.set_processor("content", function content_pxr(working) {
		working = working || Sparks.create_valid_child();
		that.elements.output_to_parent(working, that.options);
		return working;
	});

	that.add_hover_listener = Sparks.listener_adder(that.hover_listeners = [], true);
	that.add_select_listener = Sparks.listener_adder(that.select_listeners = [], true);

	function dispatch(listeners, pointer) {
		if(!pointer || !pointer.valid())
			return;
		var sanitizers = Sparks.map(that.elements.isolate_item(pointer), function(out) {
			return Sparks.map_call(listeners, out, pointer);
		});
		return Sparks.exhauster(Sparks.flatten(sanitizers));
	}

	that.presenter.add_postdrawer(function() {
		if(!that.selection)
			that.set_selection(Sparks.single_selection(), that.options);
		that.selection.converter = converter;
		that.selection.comparator = comparator;
		that.add_listener(dispatch, that.select_listeners);
		that.hover_selection.add_listener(dispatch, that.hover_listeners);
	});

	return that;
}
