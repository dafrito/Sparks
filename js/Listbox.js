Sparks.listbox = function listbox(options) {
	var that = Sparks.selector(options);

	that.mouse_director = Sparks.mouse_director(that.elements);
	that.presenter.add_postdrawer(function() {
		that.mouse_director.add_hover_listener(that.hover_selection.toggle);
		that.mouse_director.add_select_listener(that.selection.toggle);
	});

	return that;
}
