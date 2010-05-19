Sparks.recycling_page_viewer = function recycling_page_viewer(options) {
	options = options || {};

	var that = Sparks.lazy_pager();
	Sparks.attach_presenter(that);	

	that.view = function view(page) {
		that.sanitize();
		Sparks.add_listener(that.fetch(page), function fetch_listener(results) {
			Sparks.map_call(that.preprocessors, results, page);
			that.sanitizers = Sparks.flatten(Sparks.map(results, Sparks.map_call, that.populators));
		});
	}

	that.sanitizers = [];
	that.sanitize = Sparks.exhauster(that, "sanitizers");

	that.add_preprocessor = Sparks.listener_adder(that.preprocessors = [], true);
	that.add_populator = Sparks.listener_adder(that.populators = [], true);

	return that;
}
