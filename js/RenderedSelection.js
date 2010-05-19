Sparks.rendered_selection = function rendered_selection(options) {
	if(Sparks.get_items(options))
		options = {options:options};
	options = options || {};
	var that = {options:options.options, selected:[]};

	that.toString = that.__repr__ = function toString() {
		return Sparks.interpolate(
			"Sparks.rendered_selection", {options:that.options, selection:that.selection}
		);
	}

	that.add_listener = Sparks.listener_adder(that.listeners = [], true);
	that.add_group_listener = Sparks.listener_adder(that.group_listeners = [], true);

	that.added_delta = [];
	that.removed_delta = [];
	function flush() {
		Sparks.map_call(that.group_listeners, 
			that.added_delta.splice(0), 
			that.removed_delta.splice(0)
		);
	}
	that.add_listener(function(pointer) {
		that.added_delta.push(pointer);
		return Sparks.obj_func(that.removed_delta, that.removed_delta.push, pointer);
	});

	var detacher;
	that.set_selection = function set_selection(selection, options) {
		if(!that.options) {
			that.options = options;
			Sparks.add_event_listener(that.options, "update_list", 
				function update_listener(src, action, pointers, items) {
					switch(action) {
						case "add_item":
							for(var i in pointers)
								add(items[i], pointers[i]);
							break;
						case "remove_item":
							Sparks.map(pointers, remove);
							break;
						case "clear_items":
							Sparks.map_call(that.selected, "sanitize");
							that.selected.splice(0, that.selected.length);
					}
					flush();
				}
			);	
		}
		if(that.selection === selection)
			return;
		if(detacher) {
			detacher();
			Sparks.map_call(that.selected, "sanitize");
			that.selected.splice(0, that.selected.length);
		}
		that.selection = selection;
		if(!that.selection)
			return;
		var items = Sparks.get_items(that.options);
		for(var i in items)
			add(items[i], i);
		flush();
		detacher = that.selection.add_listener(function selection_listener() {
			var items = Sparks.get_items(that.options);
			var unselected = Sparks.difference(items, that.selected, function(packet, item) {
				return item === packet.item;
			});
			for(var i = 0; i < that.selected.length; i++) {
				var selected = that.selected[i];
				if(!that.selection.test(selected.item)) {
					selected.sanitize();
					that.selected.splice(i--, 1);
				}
			}
			for(var i in unselected) {
				if(that.selection.test(unselected[i]))
					add(unselected[i], that.options.get(unselected[i]));
			}
			flush();
		});
	}

	var is_packet = Sparks.izzer("RenderedSelectionPacket");
	function add(item, position) {
		if(!that.selection.test(item))
			return;
		var packet = {item:item, type:"RenderedSelectionPacket",
			pointer:Sparks.item_pointer(that.options, position)
		};
		packet.sanitize = Sparks.exhauster(
			packet.sanitizers = Sparks.map_call(that.listeners, packet.pointer)
		);
		packet.sanitizers.push(packet.pointer.freeze);
		that.selected.push(packet);
		return packet;
	}

	function remove(position) {
		var packet = that.selected.splice(Sparks.find_value(
			that.selected, 
			Sparks.get_position(position), 
			function(packet, pos) {
				return packet.pointer.position === pos;
			}
		), 1)[0];
		packet.sanitize();
	}

	options.options && options.selection && that.set_selection(options.selection);

	return that;
}
