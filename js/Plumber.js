Sparks.plumber = function plumber(options) {
	if(Sparks.is_list(options))
		options = {source:options};
	options = options || {};
	var that = {};

	that.sources = [];
	that.destinations = [];
	that.exclusive = options.exclusive;

	that.add_source = function add_source(source) {
		that.sources.push(source);
		var detacher = Sparks.add_event_listener(source, "update_list", 
			function update_list_listener(src, action, pointers, items) {
				switch(action) {
				case "add_item":
					add_items(items);
					break;
				case "remove_item":
				case "clear_items":
					Sparks.map(that.destinations, remove_items, items);
				}
			}
		);	
		add_items(Sparks.get_items(source));
	}

	function add_item(item) {
		for(var i in that.destinations) {
			var destination = that.destinations[i];
			if(destination.authorizer && !destination.authorizer(item))
				continue;
			destination.pending.push(item);
			if(that.exclusive)
				return;
		}
	}

	function remove_items(removing, destination) {
		var returning = Sparks.deferred();
		destination.list.lock.acquire().add_listener(function lock_listener() {
			var remove = destination.list.remove.apply(null, Sparks.intersection(
				removing, destination.added
			));
			remove.add_listener(function remove_listener() {
				destination.added = Sparks.difference(destination.added, removing);
			});
			remove.forward_to(returning);
			destination.list.lock.release();
		});
		return returning;
	}

	function add_items(items) {
		Sparks.map(items, add_item);
		Spraks.map_call(that.destinations, "flush");
	}

	function get_destination(list) {
		for(var i in that.destinations) {
			if(that.destinations[i].list === list)
				return that.destinations[i];
		}
	}

	that.change_authorizer = function change_authorizer(list, new_authorizer, subset) {
		var destination = get_destination(list);
		if(!destination.authorizer && !new_authorizer)
			return;
		if(!destination.authorizer)
			subset = true;
		if(subset) {
			var removing = [];
			for(var i in destination.added) {
				var item = destination.added[i];
				if(new_authorizer && !new_authorizer(item))
					removing.push(item);
			}
			remove_items(removing, destination).add_listener(function remove_listener() {
				destination.authorizer = new_authorizer;
			});
		} else {
			list.remove.apply(null, destination.added).add_listener(function remove_listener() {
				destination.added.splice(0, destination.added.length);
				destination.authorizer = new_authorizer;
				for(var i in that.sources) {
					var items = Sparks.get_items(that.sources[i]);
					for(var j in items) {
						if(!destination.authorizer || destination.authorizer(items[j]))
							destination.pending.push(items[j]);
					}
				}
				destination.flush();
			});
		}
	}

	that.add_destination = function add_destination(list, authorizer) {
		var destination = {list:list, authorizer:authorizer, added:[], pending:[]};
		destination.flush = function flush() {
			var pending = destination.pending.splice(0, destination.pending.length);
			if(!pending.length)
				return;
			var add = destination.list.add.apply(null, pending);
			add.add_listener(function add_listener() { 
				destination.added = destination.added.concat(pending);
			});
		}
		that.destinations.push(destination);
	}

	options.source && that.add_source(options.source);

	return that;
}
