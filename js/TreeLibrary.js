/* TreeLibrary.js */

Sparks.is_operator = function is_operator(obj) {
	return !!obj && typeof obj === "string" && !!obj.match(/^(NOT|AND|OR|XOR)$/i);
}

Sparks.Tree = {
	calculate_polish:function calculate_polish(tree, calculator) {
		if(typeof tree === "function") {
			var temp = tree;
			tree = calculator;
			calculator = temp;
		}
		assert(!!calculator, "Sparks.Tree.calculate_polish(tree, calculator): Calculators... falsy?");
		var working = tree.content;
		switch(working.toUpperCase ? working.toUpperCase() : working) {
			case "NOT":
				assert(tree.children.length === 1, 
					"Sparks.Tree.calculate_polish: NOT operator cannot have more than 1 operand.", 
					{children:tree.children.length}
				);
				return !Sparks.Tree.calculate_polish(tree.children[0], calculator);
			case "AND":
				return Sparks.every(tree.children, Sparks.Tree.calculate_polish, calculator);
			case "OR":
				return Sparks.some(tree.children, Sparks.Tree.calculate_polish, calculator);
			case "XOR":
				return Sparks.filter(
					Sparks.map(tree.children, Sparks.Tree.calculate_polish, calculator)
				).length === 1;
			default:
				return !!calculator(working);
		}
	},

	construct_tree:function construct_tree(skeleton) {
		if(Sparks.is_tree(skeleton))
			return skeleton;
		var node = Sparks.tree();
		node.content = skeleton.shift();
		for(var i = 0; i < skeleton.length; i++) {
			var child = skeleton[i];
			child = child instanceof Array ? 
				Sparks.Tree.construct_tree(child) :
				Sparks.tree({content:child, is_leaf:true});
			child.parent = node;
			node.children.push(child);
		}
		return node;
	},

	destruct_tree:function destruct_tree(node) {
		if(!node)
			return;
		return Sparks.simplify(
			Sparks.Tree.bounce({
				node:node,
				original:[], 
				action:function bounce_actor(working, content, original) {
					var children = [content];
					working.push(children);
					return children;
				}
			})
		);
	},

	content:function content(iterable) {
		iterable = Sparks.get_items(iterable, true).slice();
		for(var i in iterable)
			iterable[i] = iterable[i].content;
		return iterable;
	},

	traverse:function traverse(node, traversal) {
		var nodes = [];
		if(!node)
			return nodes;
		if(!traversal || traversal === "level_order") {
			MochiKit.Base.nodeWalk(node, function walker(node) {
				nodes.push(node);
				return node.children;
			});
		} else {
			nodes = nodes.concat(Sparks.map(node.children || [], Sparks.Traversals[traversal]));
			switch(traversal) {
				case "pre_order":
					nodes.shift(node);
					break;
				case "post_order":
					nodes.push(node);
					break;
				case "in_order":
					nodes.splice(Math.floor(nodes.length / 2), 0, node);
			}
		}
		return MochiKit.Base.flattenArray(nodes);
	},

	depth:function depth(node, level) {
		level = level || 0;
		var depths = [level];
		if(node.children) {
			for(var i in node.children)
				depths = depths.concat(node.children[i].depth(level + 1));
		}
		return depths;
	},

	best_order:function best_order(vine) {
		if(Sparks.is_tree(vine))
			vine = Sparks.Tree.traverse(vine, "in_order");
		if(vine.length < 2)
			return vine;
		var ordered = [];
		ordered.push(vine[Math.floor(vine.length / 2)]);
		ordered = ordered.concat(Sparks.Tree.best_order(vine.slice(0, mid)));
		ordered = ordered.concat(Sparks.Tree.best_order(vine.slice(mid + 1)));
		return ordered;
	},

	_bouncer:function _bouncer(content, original, action, working_content) {
		if(action)
			return action(working_content, content, original);
		if(typeof content === "function")
			return that.content(working_content, original);
		return content;
	},

	bounce:function bounce(options) {
		if(options.validator) {
			return Sparks.Tree.dirty_bounce(
				options.node, options.original, options.action, options.validator, options.working
			);
		}
		return Sparks.Tree.clean_bounce(
			options.node, options.original, options.action
		);
	},

	clean_bounce:function clean_bounce(node, original, action, working_content) {
		working_content = Sparks.Tree._bouncer(node.content, original, action, 
			working_content || original
		);
		if(node.children) {
			for(var i in node.children)
				Sparks.Tree.clean_bounce(node.children[i], original, action, working_content);
		}
		return working_content;
	},

	dirty_bounce:function dirty_bounce(node, original, action, validator, working_content) {
		var returning = Sparks.Tree._bouncer(node.content, original, action, working_content);
		/* If our returned value is valid, then we'll pass that to our children, and eventually
			return it. Otherwise, we'll use our parents value for now. */
		if(validator(returning)) {
			var passed_obj = returning
		} else {
		 	var passed_obj = working_content;
			returning = undefined;
		}
		if(node.children) {
			for(var i in node.children) {
				var child_result = Sparks.Tree.dirty_bounce(
					node.children[i], original, action, validator, passed_obj
				);
				/* If a child returns a valid value, and our current one is _in_valid, then
					we use that one instead. */
				if(!returning && validator(child_result))
					returning = child_result;
			}
		}
		return returning || passed_obj;
	}
};
