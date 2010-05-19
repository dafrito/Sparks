
Sparks.Event.update_node = function update_node(tree, action, nodes, pointers, items) {
	var operation = action.split("_")[0];
	var operator = Sparks.get_node_operators(tree)[operation];
	var list_op = operation + "_item";
	for(var i = 0; i < nodes.length; i++)
		Sparks.Event[list_op](nodes[i].children, list_op, pointers[i], items[i], operator);
};

Sparks.Event.add_node = Sparks.Event.update_node;
Sparks.Event.remove_node = Sparks.Event.update_node;

Sparks.add_initializer("Tree Event Preprocessors", function tree_prepxrs() {
	function update_tree_prepxr(src, action, nodes, pointers, items) {
		if(src.root() !== src)
			src = src.root();
		pointers = Sparks.coerce_array(pointers);
		items = Sparks.coerce_array(items);
		if(!(nodes instanceof Array)) {
			nodes = [nodes];
			pointers = [pointers];
			items = [items];
		}
		for(var i = 0; i < nodes.length; i++) {
			var processed = Sparks.preprocess_event_args.apply(null, [
				src, "add_item", pointers[i], items[i]
			]);	
			pointers[i] = processed[2];
			items[i] = processed[3];
		}
		return [src, action, nodes, pointers, items];
	}

	Sparks.set_event_action_preprocessor("add_node", update_tree_prepxr);
	Sparks.set_event_action_preprocessor("remove_node", update_tree_prepxr);
});

Sparks.is_tree = Sparks.izzer("Tree");

/*
options:
	parent
	content
	is_leaf
	proxied
*/
Sparks.tree = function tree(options) {
	if(options instanceof Array)
		return Sparks.Tree.construct_tree(options);
	options = options || {};

	var that = Sparks.event_source("Tree");

	that.parent = options.parent;
	that.content = options.content;

	that.proxied = options.proxied;
	if(that.proxied) {
		that.update_node_proxy = Sparks.push_event;
		Sparks.add_event_listener(that, Sparks.event_descendents("update_tree"), 
			Sparks.Event.process
		);	
	} else {
		that.update_node_proxy = Sparks.Event.unproxied;
	}

	that.is_leaf = options.is_leaf;
	that.children = that.is_leaf ? options.children : [];

	that.get = function get(item, comparator, return_pointer) {
		comparator = comparator || Sparks.operator.seq;
		var cmp_value = comparator(that.content, item);
		if(cmp_value === true || cmp_value === 0)
			return that;
		for(var i in that.children) {
			var node = that.children[i].get(item, comparator, return_pointer);
			if(node) {
				if(return_pointer && !Sparks.is_item_pointer(node))
					node = Sparks.item_pointer(that.children, i);
				return node;
			}
		}
	}

	that.root = function root() {
		return that.parent ? that.parent.root() : that;
	}

	that.ancestors = function ancestors(only_content, working) {
		working = working || [];
		working.push(only_content ? that.content : that);
		if(that.parent)
			return that.parent.ancestors(only_content, working);
		return working;
	}

	that.descendents = function descendents(only_content, working) {
		working = working || [];
		working.push(only_content ? that.content : that);
		if(that.children) {
			for(var i in that.children) {
				that.children[i].descendents(only_content, working);
			}
		}
		return working;
	}
	that.items = Sparks.obj_func(that.descendents, true);

	if(!that.children)
		return that;

	that.add = that.push = function add(/* ... */) {
		assert(!that.is_leaf, "Sparks.tree.add: Cannot add nodes to leaf.");
		return that.update_node_proxy(that, "add_node", that, 
			Sparks.item_pointer(that.children, that.children.length), 
			Sparks.get_args(arguments)
		);
	}

	that.add_at = function add_at(items, pointers) {
		assert(!that.is_leaf, "Sparks.tree.add: Cannot add nodes to leaf.");
		return that.update_node_proxy(that, "add_node", that, pointers, items);
	}

	that.remove = function remove(/* ... */) {
		assert(!that.is_leaf, "Sparks.tree.add: Cannot add nodes to leaf.");
		var items = Sparks.get_args(arguments);
		var pointers = Sparks.map(items, function(item) { return that.get(item, null, true); });
		return that.update_node_proxy(that, "remove_node", that, pointers, items);
	}

	that.node_operators = {
		add:function add(position, item) {
			var child = Sparks.tree({content:item, parent:that, proxied:that.proxied});
			that.children.splice(position, 0, child);
		},
		remove:function remove(position, item) {
			var orphan = that.children.splice(position, 1)[0];
			orphan.parent = undefined;
		}
	};

	return that;
}
