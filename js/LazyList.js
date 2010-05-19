Sparks.lazy_list = function lazy_list(options) {
	options = options || {};
	var that = Sparks.lazy_pager(options);

	that.unit_size = options.unit_size || 100;
	that.viewable = options.viewable;
	that.dimension = options.dimension || "height";
	that.known_size = options.known_size;

	that.scroll_listener = Sparks.scroll_listener();

	that.elements = Sparks.element_list({
		join_style:"sandwich_elem",
		items:Sparks.set()
	});
	that.elements.add_post_processor(function(item) {
		return Sparks.set_style(item, that.dimension, that.unit_size);
	});

	that.items = that.elements.items;
	that.items.converter = function converter(item) {
		var packet = get_packet_by_item(item);
		return packet ? packet.position : undefined;
	};

	function get_packet_by_item(item) {
		return that.loaded.items[
			Sparks.find_value(that.loaded, item, function(packet) { return packet.item === item; })
		];
	}

	that.output_to_parent = function output_to_parent(parent) {
		parent = MochiKit.DOM.getElement(parent);
		parent.appendChild(that.element = Sparks.create_valid_child(parent));
		return that.output_to_placeholder();
	}

	that.output_to_placeholder = function output_to_placeholder(elem) {
		that.element = MochiKit.DOM.getElement(elem || that.element);
		assert(that.known_size || that.known_size === 0, "Sparks.lazy_list: known_size is required.");
		var box = Sparks.box(that.element);
		that.viewable = that.viewable || box[that.dimension]();
		that.cache_length = Math.max(
			that.cache_length, 
			Math.ceil(that.viewable / that.unit_size)
		);
		Sparks.set_style(that.element, "overflow", "auto");
		that.elements.output_to_parent(that.element);
		that.scroll_listener.add_listener(function scroll_listener(scroll) {
			scroll = that.dimension === "height" ? scroll.vertical : scroll.horizontal;
			that.draw(scroll.start.percent, scroll.end.percent);
		});
		that.scroll_listener.attach(that.element);
		if(!Sparks.get_style(that.element, that.dimension, true)) {
			Sparks.set_style(that.element, that.dimension, that.viewable);
			that.request = [0];
			that.draw();
		} else {
			that.draw(0, that.dimension === "height" ? 
				(that.clientHeight / that.scrollHeight) : 
				(that.clientWidth / that.scrollWidth)
			);
		}
	}

	that.loaded = Sparks.set({proxied:false});
	that.loaded.converter = function converter(obj) {
		return typeof obj === "number" ? obj : obj.position;
	};

	function floor_percent(num) { return Math.floor(num * 10); }

	that.draw = function draw(start, end) {
		that.delayed.started && that.delayed.stop();
		if(arguments.length === 2 )
			that.request = Sparks.range(Math.floor(start * that.known_size), Math.ceil(end * that.known_size));
		that.delayed.start();
	}

	that.fetches = [];

	that.delayed = Sparks.delayed(options.delay || .1, function do_request() {
		Sparks.log_joined("Sparks.lazy_list: Requesting items:", that.request);
		Sparks.add_listener(Sparks.gather_results(that.fetch_all(that.request)), 
			function fetch_listener(request, items) {
				var packets = [];
				for(var i in items)
					packets.push({position:request[i], item:items[i]});
				that.loaded.add_all(packets);
				var lock = that.items.lock.acquire();
				that.fetches.push(that.items.add_all(items));
				lock.add_listener(that.items.lock.release);
			},
			that.request
		);
	});

	Sparks.add_event_authorizer(that.items, Sparks.event_descendents("update_list"), function() {
		return Sparks.get_current_event(that.items) === that.fetches[0];
	});

	Sparks.add_event_listener(that.items, "update_list", function(src, action, pointers, items) {
		that.fetches.shift();
		Sparks.Event[action](src, action, pointers, items, 
			function update_listener(pos, item) {
				function calculate_spacer(spacer, start, end) {
					start = start !== undefined ? start.position : 0;
					end = end !== undefined ? end.position : that.known_size;
					var size = that.unit_size * (end - start - 1);
					Sparks.set_style(spacer, that.dimension, Math.max(0, size));
				}
				switch(action) {
					case "add_item":
						var spacers = that.elements.get_computed_spacers(pos);
						var current = that.loaded.items[pos],
							previous = that.loaded.items[pos - 1],
							next = that.loaded.items[pos + 1];
						calculate_spacer(spacers.before[0], previous, current);
						calculate_spacer(spacers.after[0], current, next);
						return;
					case "remove_item":
						assert(false, "Not implemented.");
						return;
				}
			}
		);
	});

	return that;
}
