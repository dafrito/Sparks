Sparks.is_element_list = Sparks.izzer("ElementList");

/* ElementList - Displays a list of items, automatically updating itself as events are received.
options (none are required initially):
	items - some sort of iterable (Ostensibly, only iterables that emit events update the list)
	parent - parent DOM element (useful for immediate display)
	placeholder - Also useful if you want to override the current element instead of spawning a child.
	join_style - The style for which spacers are placed. 
		"array_like", "before_elem", "sandwich_elem", and "after_elem"
	process_item(item) - Takes an item from an iterable, returns DOM-outputtable stuff.
	spacer(parent) - Takes a parent, returns a spacer.
	post_processors - Array (or a fxn) of post processors
*/
Sparks.element_list = function element_list(options) {
	if(options instanceof Array || Sparks.is_list(options) || Sparks.is_set(options))
		options = {items:options};
	options = options || {};

	var that = Sparks.event_source("ElementList");

	that.items = options.items;

	that.parent = options.parent;
	that.placeholder = options.placeholder;

	that.packets = [];

	that.join_style = options.join_style;

	that.set_processor = function set_processor() {
		return that.process_item = Sparks.obj_func.apply(null, arguments);
	}

	that.process_item = options.process_item || function process_item(item) { 
		return Sparks.swap_dom(null, item, Sparks.obj_func(Sparks.create_valid_child, that.parent));
	}

	that.spacer = options.spacer || function spacer(parent_elem) {
		parent_elem = parent_elem || that.parent;
		var spacer = Sparks.create_valid_child(parent_elem);
		MochiKit.DOM.addElementClass(spacer, "spacer");
		if(spacer.tagName.toLowerCase() === "td")
			spacer.appendChild(MochiKit.DOM.DIV({'class':"spacer"}));
		return spacer;
	}
	
	that.make_spacer = function make_spacer() {
		if(!that.spacer)
			return [];
		if(typeof that.spacer !== "function")
			return MochiKit.Base.clone(that.spacer);
		return Sparks.coerce_array(that.spacer());
	}

	that.post_processors = options.post_processors;
	if(that.post_processors)
		that.post_processors = Sparks.coerce_array(that.post_processors);
	else
		that.post_processors = [];

	that.add_post_processor = function add_post_processor() {
		var processor = Sparks.obj_func.apply(null, arguments);
		that.post_processors.push(processor);
		for(var i in that.packets) {
			var packet = that.packets[i];
			var outputs = packet.all();
			for(var j in outputs) {
				processor(outputs[j], packet.pointer, that);
			}
		}
	}

	var initialized = false;
	function initialize(items) {
		if(initialized)
			return;
		initialized = true;
		that.items = items || that.items;
		Sparks.add_event_listener(that.items, Sparks.event_descendents("update_list"), update_list);
		Sparks.mirror_event(that.items, "update_order", 
			function update_order(action, source, destination) {
				that[action](source, destination);
			}
		);
		add_all(Sparks.get_items(that.items).slice(), 0);
	}

	that.output_to_parent = that.output = function output(parent, items) {
		that.parent = MochiKit.DOM.getElement(parent || that.parent);
		that.placeholder = Sparks.create_valid_child(that.parent);
		that.parent.appendChild(that.placeholder);
		initialize(items);
	}

	that.output_to_placeholder = function output_to_placeholder(placeholder, items) {
		that.placeholder = placeholder;
		initialize(items);
	}

	function update_list(src, action, pointers, items) {
		switch(action) {
			case "add_item":
				add_all(items, pointers);
				break;
			case "remove_item":
				var packets = Sparks.map(pointers, remove_packet);
				for(var i in packets)
					Sparks.exhaust(packets[i].sanitizers);
				break;
			case "clear_items":
				var elements = [];
				for(var i in that.packet) {
					var packet = that.packet[i];
					elements.push.apply(elements, packet.all());
					Sparks.exhaust(packet.sanitizers);
				}
				that.placeholder = that.placeholder || 
					Sparks.create_valid_child(Sparks.get_parent(elements[0]));
				delete that.parent;
				MochiKit.DOM.insertSiblingNodesBefore(elements[0], that.placeholder);
				that.packets = [];
				if(elements.length)
					Sparks.remove_element(elements);
		}
	};

	that.move_item = function move_item(source, destination) {
		add_packet(remove_packet(source), destination);
	}

	that.swap_item = function swap_item(source, destination) {
		add_packet(remove_packet(source), destination - 1);
		add_packet(remove_packet(destination), source);
	}

	that.isolate_item = that.get = that.at = function isolate_item(position) {
		position = Sparks.get_position(that.items, position);
		assert(that.packets[position], 
			"Sparks.element_list.isolate_item: No item found at position: " + position
		);
		return that.packets[position].item;
	}

	that.get_computed_spacers = function get_computed_spacers(position) {
		position = Sparks.get_position(that.items, position);
		var packet = that.packets[position],
			next = that.packets[position + 1],
			previous = that.packets[position - 1];
		var spacers = {};
		spacers.before = packet.before || (previous && previous.after);
		spacers.after = packet.after || (next && next.before);
		return spacers;
	}

	var is_element_list_packet = Sparks.izzer("ElementListPacket");

	function add_all(items, positions) {
		if(!(positions instanceof Array))
			positions = Sparks.repeat(positions, items.length);
		positions = Sparks.map(positions, Sparks.get_position, that.items);
		for(var i = 0; i < items.length; i++) {
			items[i] = that.process_item(
				items[i], positions[i] = Sparks.item_pointer(that.items, positions[i] + i), that
			);
		}
		Sparks.add_listener(Sparks.gather_results({
			values:items,
			coercer:function coercer(item) {
				return Sparks.output(item, that.parent);
			}
		}), function output_listener(items) {
			for(var i in items) {
				var item = Sparks.coerce_array(items[i]);
				var pointer = positions[i];
				var sanitizers = [];
				Sparks.map(item, function(out) {
					sanitizers.push.apply(sanitizers,
						Sparks.map_call(that.post_processors, out, pointer, that)
					);
				});
				var packet = add_packet(item, pointer);
				packet.pointer = pointer;
				packet.sanitizers = sanitizers;
				if(!Sparks.is_switchable(pointer.item()))
					continue;
				Sparks.add_event_listener(item, "remove_element", 
					function remove_element_listener(src, action, replacers) {
						item = replacers[0];
						packet.detacher();
						packet.detacher = Sparks.add_event_listener(
							item, "remove_element", remove_element_listener
						);
					}
				);
			};
		});
	}

	function add_packet(item, position) {
		position = Sparks.get_position(that.items, position);
		var packet = that.insert_packet(item,	
			that.packets[position- 1],
			that.packets[position]
		);
		that.packets.splice(position, 0, packet);
		return packet;
	}

	that.insert_packet = function insert_packet(item, before, after) {
		if(!is_element_list_packet(item)) {
			var packet = {
				type:"ElementListPacket",
				item:item,
				first:function first() {
					var first = packet.before || packet.item;
					return first[0];
				},
				last:function last() {
					var last = packet.after || packet.item;
					return last[last.length - 1];
				},
				all:function all() {
					var items = packet.item;
					if(packet.before)
						items = packet.before.concat(items);
					if(packet.after)
						items = items.concat(packet.after);
					return items;
				}
			};
		} else {
			var packet = item;
		}
		switch(that.join_style) {
			case "before_elem":
				packet.before = that.make_spacer();
				break;
			case "after_elem":
				packet.after = that.make_spacer();
				break;
			case "array_like":
				if(after) {
					packet.after = that.make_spacer();
				} else if(before) {
					before.after = that.make_spacer();
					MochiKit.DOM.insertSiblingNodesAfter(before.item[0], before.after);
				}
				break;
			case "sandwich_elem":
				if(before) {
					packet.after = that.make_spacer();
				} else if(after) {
					packet.after = that.make_spacer();
					Sparks.remove_element(packet.before = after.before);
					after.before = undefined;
				} else {
					packet.before = that.make_spacer();
					packet.after = that.make_spacer();
				}
		}
		if(after) {
			MochiKit.DOM.insertSiblingNodesBefore(after.first(), packet.all());
		} else if(before) {
			MochiKit.DOM.insertSiblingNodesAfter(before.last(), packet.all());
		} else if(that.placeholder) {
			MochiKit.DOM.insertSiblingNodesAfter(that.placeholder, packet.all());
			that.parent = Sparks.get_parent(that.placeholder);
			Sparks.remove_element(that.placeholder);
			that.placeholder = undefined;
		}
		return packet;
	}

	function remove_packet(position) {
		position = Sparks.get_position(that.items, position);
		var packet = that.packets[position];
		assert(packet, "Er, no packet?");
		var before = that.packets[position - 1];
		var after = that.packets[position + 1];
		switch(that.join_style) {
			case "array_like":
				if(!after && before) {
					Sparks.remove_element(before.after);
					before.after = undefined;
				}
				break;
			case "sandwich_elem":
				if(!before && after) {
					after.before = packet.before;
					packet.before = undefined;
				}
		}
		var packets = packet.all();
		if(!before && !after) {
			MochiKit.DOM.insertSiblingNodesBefore(
				packets[0], that.placeholder = Sparks.create_valid_child(Sparks.get_parent(packets[0]))
			);
		}
		Sparks.remove_element(packet.all());
		packet.before = undefined;
		packet.after = undefined;
		if(packet.detacher) {
			packet.detacher();
			packet.detacher = undefined;
		}
		that.packets.splice(position, 1);
		return packet;
	}

	if(options.parent || options.placeholder)
		that.output(options.parent);

	return that;
}
