Sparks.replacing_page_viewer = function replacing_page_viewer(options) {
	options = options || {};

	var that = Sparks.lazy_pager();
	Sparks.attach_presenter(that);

	that.cached = {};

	that.parent;
	that.presenter.set_processor("content", Sparks.working_or_child);
	that.presenter.add_post_processor("content", function content_post_pxr(out) {
		that.parent = out;
	});

	that.viewer = function viewer(out, items) {
		Sparks.element_list().output_to_placeholder(out, items);
	}

	var current;
	that.view = function view(page) {
		Sparks.debug && Sparks.log("Sparks.page_viewer.view", {page:page});
		if(current)
			current.resetters = Sparks.map_call(that.savers, current.element);
		if(that.cached[page]) {
			//Sparks.debug && Sparks.log("Sparks.page_viewer: Reloading using cache.");
			current = that.cached[page];
			Sparks.replace_child_nodes(that.parent, current.element);
			Sparks.map_call(current.resetters, current.element);
			return;
		}
		Sparks.add_listener(that.fetch(page), function fetch_listener(results) {
			//Sparks.debug && Sparks.log("Sparks.page_viewer: Creating new viewer.");
			current = that.cached[page] = {element:Sparks.create_valid_child(that.parent)};
			if(results instanceof Array)
				results = Sparks.list(results);
			that.viewer(current.element, results, page);
			Sparks.replace_child_nodes(that.parent, current.element);
		});
	}

	that.add_saver = Sparks.listener_adder(that.savers = [], true);

	return that;
}
