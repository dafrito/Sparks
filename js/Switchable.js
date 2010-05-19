Sparks.add_initializer("Switchable Event Preprocessors", function list_prepxrs() {
	Sparks.set_event_action_preprocessor("switch_view", 
		function switchable_eventprepxr(src, action, selected) {
		if(typeof selected === "string")
			selected = Sparks.item_pointer(src.items, src.get_position(selected));
		if(!Sparks.is_item_pointer(selected)) {
			if(src.selected)
				selected = src.selected.get_relative(selected);
			else 
				selected = Sparks.item_pointer(src.items, selected || 0);
		}
		return [src, action, selected];
	});
});

Sparks.is_switchable = Sparks.izzer("Switchable");

/* Switchable - Switches between elements in a list.
options:
	OR:
		parent - parent DOM element of this guy
		placeholder - DOM element to swap out
	items - iterable of items (Ostensibly, only event-emitting iterables affect this collection)
	selected - currently selected item
	associations - an array of names for each element. Useful for static lists for readability.
	process_item(item, pointer, switchable) - takes an element, returns DOM-outputtable stuff.
	post_processors - Array, or function, of a processor(output, pointer, switchable).
*/
Sparks.switchable = function switchable(options) {
	if(Sparks.is_list(options))
		options = {items:options};
	options = options || {};
	var that = Sparks.event_source("Switchable");

	that.parent = options.parent;
	that.placeholder = options.placeholder;
	that.items = options.items;
	that.selected = options.selected;

	that.associations = options.associations;

	that.process_item = options.process_item;
	that.post_processors = options.post_processors;
	if(that.post_processors)
		that.post_processors = Sparks.coerce_array(that.post_processors);
	else
		that.post_processors = [];

	that.add_post_processor = function add_post_processor() {
		return that.post_processors.push(Sparks.obj_func.apply(null, arguments));
	}
	
	that.next = Sparks.obj_func(Sparks.push_event, that, "switch_view", 1);
	that.previous = Sparks.obj_func(Sparks.push_event, that, "switch_view", -1);
	that.jump = Sparks.obj_func(Sparks.push_event, that, "switch_view");
	that.select = function select(pos) {
		if(that.selected && that.get_position(pos) === that.selected.position)
			return Sparks.succeed();
		return Sparks.push_event(that, "switch_view", that.at(pos));
	}

	Sparks.add_event_authorizer(that, "switch_view", 
		function switch_view_authorizer(src, action, selected) {
			return !that.selected || that.selected.position !== selected.position;
		}
	);

	function update_list(src, action, pointers, items) {
		if(action === "add_item" && !that.selected) {
			var pointer = Sparks.item_pointer(that.items, 0);
			draw_selected(pointer);
			return;
		}
		if(!that.selected.frozen)
			return;
		// Our selected has been removed - proceed to freak out.
		var items = Sparks.get_items(that);
		if(!items.length) {
			if(that.parent) {
				MochiKit.DOM.replaceChildNodes(that.parent);
			} else {
				MochiKit.DOM.swapDOM(that.placeholder, 
					that.placeholder = base_placeholder.cloneNode(false)
				);
			}
			that.selected = undefined;
		} else {
			Sparks.signal_event(that, "switch_view", 
				Sparks.item_pointer(that.items, that.selected.position)
			);
		}
	};

	var base_placeholder;
	var sanitizers = [];

	function draw_selected(pointer) {
		var item = pointer.item();
		if(that.process_item)
			item = that.process_item(item, pointer, that) || item;
		// Generate our output.
		if(that.placeholder) {
			that.placeholder = item = Sparks.swap_dom(that.placeholder, item, function() {
				return base_placeholder.cloneNode(false);
			});
		} else {
			if(Sparks.is_dom(item) && Sparks.get_parent(item)) {
				// Our removal is done silently since we're not actually removing the element.
				item.parentNode.removeChild(item);
			}
			item = Sparks.replace_child_nodes(that.parent, item);
		}
		// Sanitize our old output.
		while(sanitizers.length)
			sanitizers.shift()();
		// Listen for the DOM operation, and set our properties thereafter.
		Sparks.add_listener(item, function output_listener(out) {
			if(that.placeholder)
				that.placeholder = out;
			Sparks.map(out, function post_pxr(output) {
				for(var i in that.post_processors) {
					var sanitizer = that.post_processors[i](that.placeholder || out, pointer, that);
					sanitizer && sanitizers.push(sanitizer);
				}
			});
			that.selected = Sparks.item_pointer(that.items, pointer.position);
		});
	}

	that.output_to_placeholder = function output_to_placeholder(placeholder, items) {
		that.placeholder = placeholder || that.placeholder;
		return that.output(null, items);
	}

	that.output_to_parent = that.output = function output(parent, items) {
		that.parent = parent || that.parent;
		if(that.parent)
			that.parent = MochiKit.DOM.getElement(that.parent);
		else {
			that.placeholder = MochiKit.DOM.getElement(that.placeholder);
			base_placeholder = that.placeholder.cloneNode(false);
		}
		// Connect up our handlers and output.
		that.items = items || that.items;
		if(Sparks.is_list(that.items)) {
			if(that.items.proxied) {
				Sparks.add_event_listener(that.items, "update_list", update_list);
			}
		} else {
			that.items = Sparks.list({items:that.items, proxied:false});
		}
		Sparks.add_event_listener(that, "switch_view", 
			function switch_view(src, action, selected) {
				draw_selected(selected)
			}
		);
		if(that.associations instanceof Array) {
			for(var i = 0; i < that.associations.length; i++)
				that.items.set_association([that.associations[i]], i);
		} else if(that.associations) {
			for(var i in that.associations)
				that.items.set_association(i, that.associations[i]);
		}
		var items = Sparks.get_items(that);
		if(items.length) {
			if(typeof that.selected !== "undefined")
				that.selected = Sparks.item_pointer(that.items, that.get_position(that.selected));
			else
				that.selected = Sparks.item_pointer(that.items, 0);
			var selected = that.selected;
			that.selected = undefined;
			that.select(selected);
		}
	}

	that.at = function at(position) {
		return Sparks.item_pointer(that.items, that.get_position(position));
	}

	that.get_position = function get_position(position) {
		if(typeof position === "string")
			return that.items.at(position).position;
		return Sparks.enforce_looping_range(
			Sparks.get_position(that.items, position), 
			Sparks.get_items(that).length
		);
	}

	if(that.items && (that.parent || that.placeholder))
		that.output();

	return that;
}
