Sparks.list_mirror = function list_mirror(list) {
	var that = {};

	that.mirrors = [];

	function mirror(pos, item) {
		var mirror = {};
		mirror.type = "Mirror";

		mirror.pointer = Sparks.item_pointer(that.list, pos);
		mirror.sanitizers = [mirror.pointer.detach].concat(
			Sparks.map_call(
				that.listeners, item, mirror.content = {}, pos
			)
		);
		mirror.sanitize = function() {
			Sparks.exhaust(mirror.sanitizers);
			Sparks.map_call(that.sanitizers, item, mirror.content, pos);
		}

		return mirror;
	}

	that.attach = function attach(list) {
		if(that.list === list)
			return;
		if(that.detacher) {
			that.detach();
			that.detacher();
		}
		that.list = list;
		var detachers = [];
		detachers.push(Sparks.add_event_listener(list, "update_list", 
			function update_listener(src, action, pointers, items) {
				switch(action) {
					case "add_item":
						Sparks.Event.add_item(src, action, pointers, items, 
							function(pos, item) {
								that.mirrors.splice(pos, 0, mirror(pos, item));
							}
						);	
						break;
					case "remove_item":
						Sparks.Event.remove_item(src, action, pointers, items, 
							function(pos, item) {
								var mirror = that.mirrors.splice(pos, 1);
								mirror.sanitize();
							}
						);
						break;
					case "clear_items":
						Sparks.map_call(that.mirrors, "sanitize");
						that.mirrors = [];
				}
			}
		));	
		detachers.push(Sparks.mirror_event(list, "update_order", that.mirrors));
		that.detacher = Sparks.exhauster(detachers);
		var items = Sparks.get_items(that.list);
		for(var i in items)
			that.mirrors.push(mirror(parseInt(i), items[i]));
	}

	that.detach = function detach() {
		Sparks.map_call(that.mirrors, "sanitize");
		that.mirrors = [];
		that.detacher();
		that.list = that.detacher = undefined;
	}

	that.add_listener = Sparks.listener_adder(that.listeners = []);
	that.add_sanitizer = Sparks.listener_adder(that.sanitizers = []);

	if(arguments.length > 1) {
		that.add_listener(
			Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1))
		);
	}
	list && that.attach(list);

	return that;
}
