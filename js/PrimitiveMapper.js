/* PrimitiveMapper
options:
	comparator
	convert
	list
	proxied
*/
Sparks.primitive_mapper = function primitive_mapper(options) {
	if(Sparks.is_list(options))
		options = {list:options};
	var that = {};
	options = options || {};

	var is_mapper_node = Sparks.izzer("MapperNode");

	that.mapper_nodes = Sparks.set({proxied:!!options.proxied});
	that.mapper_nodes.comparator = function cmp(a, b) {
		return that.comparator(a.key, is_mapper_node(b) ? b.key : b);
	}

	that.comparator = options.comparator || MochiKit.Base.compare;

	that.add_list = function add_list(list) {
		that.add_all(list);
		var detacher = Sparks.add_event_listener(list, "update_list", 
			function update_listener(src, action, pointers, items) {
				action === "add_item" ?
					that.add_all(items) :
					that.remove_all(items);
			}
		);	
		return function detach() {
			that.remove_all(list);
			detacher();
		}
	};

	that.convert = options.convert || MochiKit.Base.repr;

	that.add = that.push = function add() {
		var args = Sparks.map(Sparks.get_args(arguments), function map(item) {
			return {type:"MapperNode", item:item, key:that.convert(item)};
		});
		that.mapper_nodes.add_all(args);
	}
	that.add_all = Sparks.list_applier(that.add);

	that.get = that.get_by_key = function get_by_key(comparator) {
		if(typeof comparator !== "function")
			comparator = Sparks.obj_func(Sparks.operator.eq, comparator);
		var matches = [];
		var nodes = Sparks.get_items(that.mapper_nodes);
		for(var i in nodes) {
			var node = nodes[i];
			var cmp = comparator(node.key);
			if(cmp === true || cmp === 0)
				matches.push(node.item);
		}
		return matches;
	}

	that.get_by_item = function get_by_item(item, comparator) {
		comparator = comparator || Sparks.operator.seq;
		var nodes = Sparks.get_items(that.mapper_nodes);
		for(var i in nodes) {
			var node = nodes[i];
			var cmp = comparator(node.item, item);
			if(cmp === true || cmp === 0)
				return Sparks.item_pointer(that.mapper_nodes, i);
		}
	}

	that.remove = that.remove_by_item = function remove_by_item() {
		var pointers = [];
		var nodes = Sparks.map(Sparks.get_args(arguments), function finder(item) {
			var pointer = that.get_by_item(item);
			pointers.push(pointer);
			return pointer.item();
		});
		return Sparks.push_event(that.mapper_nodes, "remove_item", pointers, nodes);
	}

	that.remove_by_key = function remove_by_key() {
		var pointers = [];
		var nodes = Sparks.map(Sparks.get_args(arguments), function finder(key) {
			var selection = that.get_by_key(key);
			pointers = pointers.concat(selection);
			return Sparks.map_call(selection, "item");
		});
		nodes = MochiKit.Base.flattenArray(nodes);
		return Sparks.push_event(that.mapper_nodes, "remove_item", pointers, nodes);
	}

	that.remove_all = function(items) {
		return that.remove.apply(null, Sparks.get_items(items));
	}	

	options.list && that.add_list(options.list);

	return that;
}
