Sparks.range_viewer = function range_viewer(options) {
	if(Sparks.is_list(options))
		options = {items:options};
	options = options || {};

	var that = Sparks.widget("RangeViewer", options.presenter, options.operational);
	that.elements = Sparks.element_list(that.items = options.items || Sparks.list());

	that.start = options.start;
	that.end = options.end;
	that.scale = options.scale || 1;
	that.viewable = options.viewable;
	that.converter = options.converter || Sparks.blind;
	that.dimension = options.dimension || "width";

	that.presenter.add_predrawer(function predrawer() {	
		if(that.range && (that.start === that.end)) {
			that.start = 0;
			that.end = that.range;
		} else if(that.start || that.end) {
			that.range = that.range || (that.end - that.start);
		} else {
			assert(false, "Sparks.range_viewer: Either range or start and end must be set.");
		}
		if(that.viewable && that.viewable <= 1)
			that.viewable = that.range * that.viewable;
		else
			that.viewable = that.viewable || (that.range / Sparks.range_viewer.default_viewable_pages);
		that.other_dimension = that.dimension === "width" ? "height" : "width";
		that.elements.set_processor(function(item, pointer, elements) {
			item = that.converter(item) || item;
			if(item instanceof Array)
				item = {start:item[0], end:item[1]};
			item.end = Sparks.enforce_range(item.end, that.start, that.end);
			item.start = Sparks.enforce_range(item.start, that.start, that.end);
			item.range = item.range || (item.end - item.start);
			var elem = Sparks.create_valid_child(elements.parent);
			if(!item.range) {
				Sparks.set_style(elem, "display", "none");
				return elem;
			}
			Sparks.set_style(elem, "position", "absolute");
			Sparks.set_style(elem, that.dimension, item.range / that.scale);
			Sparks.set_style(elem, that.other_dimension, "100%");
			Sparks.set_style(elem, 
				that.dimension === "width" ? "left" : "top", 
				(item.start - that.start) / that.scale
			);	
			return elem;
		});
	});

	that.presenter.set_processor("container", function container_pxr(container) {
		that.container = MochiKit.DOM.getElement(container || that.element);
		Sparks.set_style(that.container, "overflow", "auto");
		Sparks.set_style(that.container, that.dimension, that.viewable / that.scale);
		return that.container;
	});

	that.presenter.set_processor("content", function content_pxr(container) {
		that.placeholder = Sparks.create_valid_child(container);
		Sparks.set_style(that.placeholder, that.dimension, that.range / that.scale);
		that.elements.output_to_parent(that.placeholder);
		Sparks.set_style(that.placeholder, "position", "relative");
		Sparks.set_style(that.placeholder, "height", 100);
		return that.placeholder;
	});


	return that;
}

Sparks.range_viewer.default_viewable_pages = 4;
