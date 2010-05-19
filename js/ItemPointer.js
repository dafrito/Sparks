// Sparks.ItemPointer

/*
	ItemPointer listens to a given list and updates itself so that the
	position given to it is always pointing to the item you've intended it to.

	If the pointer's item is removed, kill() will be called, and the position will
	be set to -1. Also, the item() will error if called.
	
	Pointers will also listen if they're being used in the current event, and if they are,
	will freeze themselves so that they act properly during event processing. This is important
	to remember:
	
	ItemPointers will no longer update themselves if used in an event that they're listening to.

*/

Sparks.is_item_pointer = Sparks.izzer("ItemPointer");

Sparks.item_pointer = function(list, pos) {
	assert(arguments.length > 1, "Sparks.item_pointer: Two arguments required, please. :)");
	if(Sparks.is_item_pointer(pos))
		return pos;
	if(isNaN(parseInt(pos, 10)) && typeof pos === "string")
		return list.at(pos);
	var that = Sparks.event_source("ItemPointer");
	that.list = list;

	that.position = parseInt(pos, 10);
	assert(!isNaN(that.position), "Sparks.item_pointer: Position is NaN");

	that.__repr__ = function() {
		return Sparks.interpolate("Sparks.ItemPointer", {pos:that.position, list:that.list});
	}
	that.toString = Sparks.toString;

	that.detachers = [];

	that.get_association = function get_association() {
		return that.list.get_association(that.position);
	}

	that.get_live = function get_live() {
		return that.frozen ? Sparks.item_pointer(that.list, that.position) : that;
	}

	// Once frozen, our pointer does not respond to any events.
	that.freeze = function freeze() {
		if(that.frozen)
			return;
		//Sparks.log("ItemPointer: Freezing pointer ", {pointer:that});
		that.valid() ? that.item() : saved_item = null;
		that.frozen = true;
		Sparks.exhaust(that.detachers);
	}

	that.wrap = function wrap(pos) {
		pos = Sparks.get_position(that.list, pos === undefined ? that.position : pos);
		that.position = Sparks.enforce_looping_range(pos, Sparks.get_items(that.list).length);
	}

	that.trim = function trim(pos) {
		pos = Sparks.get_position(that.list, pos === undefined ? that.position : pos);
		that.position = Sparks.enforce_range(pos, Sparks.get_items(that.list).length - 1);
	}

	that.valid = function valid() {
		return that.position >= 0 && that.position < Sparks.get_items(that.list).length;
	}

	var saved_item;
	that.item = function item() {
		if(saved_item) {
			if(saved_item.position === that.position)
				return saved_item.item;
		}
		if(!that.valid())
			return;
		saved_item = {item:Sparks.get_items(that.list, true)[that.position], position:that.position};
		return saved_item.item;
	}

	that.get_relative = function get_relative(offset) {
		return Sparks.item_pointer(that.list, Sparks.enforce_looping_range(
			that.position + offset, 
			Sparks.get_items(that.list).length
		));	
	}

	if(!Sparks.is_event_source(that.list))
		return that;

	that.detachers.push(Sparks.add_event_authorizer(
		that.list, Sparks.event_descendents("update_list"), 
		function item_pointer_update_list_authorizer(src, action, pointers, items) {
			for(var i in pointers) {
				if(pointers[i] === that)
					return that.freeze();
			}
		}
	));

	that.detachers.push(Sparks.add_event_authorizer(
		that.list, Sparks.event_descendents("update_order"),
		function update_order_authorizer(src, action, sources, destinations) {
			for(var i in sources) {
				if(that === sources[i] || that === destinations[i])
					return that.freeze();
			}
		}
	));

	// Callback for add and remove.
	that.detachers.push(Sparks.add_event_listener(
		that.list, "update_list",
		function item_pointer_update_list_listener(src, action, pointers, items) {
			if(that.frozen)
				return;
			switch(action) {
				case "add_item":
					for(var i in pointers) {
						if(pointers[i].position <= that.position)
							that.position++;
					}
					break;
				case "remove_item":
					for(var i in pointers) {
						var pointer = pointers[i];
						if(pointer.position < that.position)
							that.position--;
						else if(pointer.position === that.position)
							that.freeze();
					}
					that.position = Math.max(that.position, 0);
					break;
				case "clear_items":
					that.freeze();
					break;
				default:
					assert(false, "Sparks.ItemPointer.update_list: Defaulted in event queue.");
			}
		}
	));

	// Callback for move and swap actions.
	that.detachers.push(Sparks.add_event_listener(that.list, "update_order",
		function item_pointer_update_order_listener(src, action, sources, destinations) {
			if(that.frozen)
				return;
			switch(action) {
				case "move_item":
					for(var i in sources) {
						var source = sources[i];
						var destination = destinations[i];
						if(source.position === that.position) {
							/* The item being moved is the one this is pointing to, 
								so blindly set ourselves straight. */
							that.position = destination.position;
						} else if(source.position < that.position && 
							destination.position >= that.position) {
							// It's being moved from before us, to after us, so we move back one.
							that.position--;
						} else if(source.position > that.position && 
							destination.position <= that.position) {
							// It's being moved from after us, to before us, so we move forward.
							that.position++;
						}
					}
					break;
				case "swap_item":
					for(var i in sources) {
						var source = sources[i];
						var destination = destinations[i];
						if(source.position === that.position) {
							that.position = destination.position;
						} else if(source === that.destination) {
							that.position = source.position;
						}
					}
					break;
				default:
					assert(false, "Sparks.ItemPointer.update_order: Defaulted in event queue.");
			}
		}
	));

	return that;
}
