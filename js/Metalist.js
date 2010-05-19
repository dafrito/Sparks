Sparks.metalist = function metalist(options) {
	options = options || {};
	var that = {};

	that.list = Sparks.list();

	that.detach = Sparks.exhauster(that.detachers = []);
	that.set_source = function set_source(source) {
		if(source === that.source)
			return;
		that.detach();
		if(!source)
			return;
		that.source = source;
		that.detachers.push(Sparks.add_event_listener(that.source, "update_list", 
			function update_list_listener(src, action, pointers, items) {
				that[action](pointers, items, that.list);
			}
		));
		that.detachers.push(Sparks.add_event_listener(that.source, "update_order",
			function update_order_listener(src, action, sources, destinations) {
				that[action](sources, destinations, that.list);
			}
		));	
		that.detachers.push(that.list.clear);
		that.add_item(
			Sparks.repeat(Sparks.item_pointer(that.source, 0), that.source.length()), 
			Sparks.map(Sparks.range(0, that.source.length()), function(pos) {
				return Sparks.get_items(that.source)[pos];
			})
		);
		return that.detach;
	}

	that.add_item = function add_item(pointers, items) {}
	that.remove_item = function remove_item(pointers, items) {}
	that.move_item = function move_item(sources, destinations) {}
	that.swap_item = function swap_item(sources, destinations) {}
	that.clear_items = function clear_items() { that.list.clear(); }

	return that;
}
