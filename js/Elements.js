// Sparks.Elements
Sparks.is_dom = function is_dom(obj) {
	return obj && typeof obj === "object" && (obj.nodeType === 1 || obj.nodeType === 3);
}

Sparks.get_style_ruleset = function get_style_ruleset(rule) {
	return Sparks.style_rulesets[rule] || Sparks.style_rulesets.standard;
}

Sparks.add_initializer("Style initializers", function style_init() {
	Sparks.style_rulesets = {};
	var ua = navigator.userAgent || "";

	var standard = {
		set:function set(elem, rule, value) {
			if(typeof value === "number")
				value = value + "px";
			return elem.style[rule === "float" ? "cssFloat" : MochiKit.Base.camelize(rule)] = value;
		},
		get:function get(elem, rule, dont_compute) {
			var value = elem.style[rule === "float" ? "cssFloat" : MochiKit.Base.camelize(rule)];
			if(!value && !dont_compute) {
				if(getComputedStyle)
					value = getComputedStyle(elem, null).getPropertyValue(rule);
				else if(elem.currentStyle)
					value = elem.currentStyle[rule];
			}
			return value !== "auto" ? value : "";
		}
	};
	Sparks.style_rulesets.standard = standard;

	var cell = {
		set:function set(elem, rule, value) {
			return elem.setAttribute(rule.match(/spacing/i) ? "cellSpacing" : "cellPadding", value);
		},
		get:function get(elem, rule, dont_compute) {
			return elem.getAttribute(rule.match(/spacing/i) ? "cellSpacing" : "cellPadding");
		}
	};
	Sparks.style_rulesets.cellPadding = cell;
	Sparks.style_rulesets.cellpadding = cell;
	Sparks.style_rulesets.cellSpacing = cell;
	Sparks.style_rulesets.cellspacing = cell;

	if(!ua.match(/MSIE/)) {
		Sparks.style_rulesets.opacity = {
			set:function set(elem, rule, value) {
				if(value == 1 && ua.match(/Gecko/) && !ua.match(/Konqueror|AppleWebKit|KHTML/))
					value = .99999;
				if(value < 0.00001)
					value = 0;
				return standard.set(elem, rule, "" + value);
			},
			get:standard.get
		};
	} else {
		Sparks.style_rulesets.opacity = {
			set:function set(elem, rule, value) {
				var filters = Sparks.get_style(elem, "filter");
				if(value == 1) {
					elem.style.filter = filters.replace(/alpha\([^\}]*\)/i, "");
					elem.style.zoom = "";
				} else {
					!elem.currentStyle.hasLayout && (elem.style.zoom = 1);
					elem.style["filter"] = filters.replace(/alpha\([^\}]*\)/i, "") + 
						" alpha(opacity=" + (value * 100) + ")";
				}
				return value;
			},
			get:function get(elem, rule, dont_compute) {
				var filters = Sparks.get_style(elem, "filter", dont_compute);
				if(!filters)
					return;
				var opacity = filters.match(/alpha\(opacity=(\d*)\)/i)[1] || "";
				if(opacity.length)
					return parseFloat(opacity / 100);
				return "";
			}
		};
	}

	if(ua.match(/Opera/)) {
		Sparks.style_rulesets.standard.get = function get(elem, rule, dont_compute) {
			var value = standard.get(elem, rule, dont_compute);
			if(!rule.match(/^(left|top|right|bottom)$/i))
				return value;
			return Sparks.get_style(elem, "position") !== "static" ? value : "";
		};
	}

});

Sparks.get_style = function get_style(elem, rule, dont_compute) {
	return Sparks.get_style_ruleset(rule).get(MochiKit.DOM.getElement(elem), rule, dont_compute);
}

Sparks.set_style = function set_style(elem, rule, value) {
	//Sparks.debug && Sparks.log("Sparks.set_style:", {rule:rule, value:value});
	if(arguments.length === 2)
		return Sparks.update_style(rule, elem);
	return Sparks.get_style_ruleset(rule).set(MochiKit.DOM.getElement(elem), rule, value);
}

Sparks.update_style = function update_style(rules, elem) {
	rules = Sparks.parse_css(rules);
	elem = MochiKit.DOM.getElement(elem);
	var old = {};
	for(var i in rules) {
		var rule = i;
		var ruleset = Sparks.get_style_ruleset(rule);
		old[rule] = ruleset.get(elem, rule, true);
		ruleset.set(elem, rule, rules[i]);
	}
	return Sparks.obj_func(Sparks.update_style, old, elem);
}

Sparks.get_parent = function get_parent(dom) {
	if(!dom)
		return;
	var parent_elem = dom.parentNode;
	if(!parent_elem || parent_elem.nodeType !== 1)
		return;
	return parent_elem;
}

Sparks.is_descendent = function is_descendent(child, parent) {
	return Sparks.is_ancestor(parent, child);
}

Sparks.is_ancestor = function is_ancestor(parent, child) {
	var child_parent = Sparks.get_parent(child);
	if(!parent || !child_parent)
		return;
	if(parent === child_parent)
		return true;
	return Sparks.is_ancestor(parent, child_parent);
}

Sparks.is_field_empty = function is_field_empty(field) {
	if(field instanceof Array)
		return Sparks.every(field, Sparks.is_field_empty);
	if(typeof field !== "object" || field === null || !field.tagName || field.tagName.toLowerCase() !== "input")
		return true;
	var type = MochiKit.DOM.getNodeAttribute(field, "type");
	switch(type && type.toLowerCase()) {
		case "text":
		case "password":
		case "file":
		case null: 
		case undefined:
			return !field.value || !!field.value.match(/^\s*$/);
		case "checkbox":
		case "radio":
			return !field.checked;
		case "submit":
		case "button":
		case "reset":
		case "submit":
		case "hidden":
			return true;
	}
	assert(false, "Sparks.is_field_empty: Defaulted.");
}

Sparks.random_color = function random_color() {
	return MochiKit.Color.Color.fromRGB(.2 + (Math.random() * .6),
		.2 + (Math.random() * .6),
		.2 + (Math.random() * .6)
	);
}

Sparks.sum_colspan = function sum_colspan(row) {
	// Given a row, this sums up all it's children, and counts colspan, too.
	var len = row.childNodes.length;
	var sum = 0;
	for(var i=0;i<len;i++) {
		var cell = row.childNodes[i];
		var colspan = parseInt(MochiKit.DOM.getNodeAttribute(cell, "colSpan"));
		if(colspan)
			sum += colspan;
		else
			sum++;
	}
	return sum;
}

Sparks.normalize_tables = function(context) {
	Sparks.normalize_table(MochiKit.DOM.getElementsByTagAndClassName("table", context));
	if(context)
		Sparks.normalize_table(context);
}

Sparks.normalize_table = function normalize_table(table_element) {
	if(table_element instanceof Array)
		return Sparks.map(table_element, Sparks.normalize_table);
	table_element = MochiKit.DOM.getElement(table_element);
	if(table_element.tagName && table_element.tagName.toLowerCase() !== "table") {
		if(Sparks.get_parent(table_element)) {
			// Continue travelling up the element tree.
			return Sparks.normalize_table(Sparks.get_parent(table_element));
		}
		return;
	} 
	// It's actually a table.
	var rows = MochiKit.DOM.getElementsByTagAndClassName("tr", null, table_element);
	if(rows.length === 1) {
		// Only one row, so why bother with the rest?
		return;
	}
	var max_rows = 0;
	for(var i in rows) {
		// Iterate through the rows, finding the max_rows and building up the bad rows.
		var row = rows[i];
		row = rows[i] = {sum:Sparks.sum_colspan(row), row:row};
		if(row.sum > max_rows) {
			max_rows = row.sum;
			var bad_rows = rows.slice(0, i);
		} else if(row.sum < max_rows) {
			bad_rows.push(row);
		}
	}
	if(!bad_rows) {
		// There's no bad rows in this table, so happily return.
		return;
	}	
	for(var i in bad_rows) {
		var sum = bad_rows[i].sum;
		var row = bad_rows[i].row;
		if(!row || !row.tagName || row.tagName.toLowerCase() !== "tr")
			continue;
		var cell = Sparks.last_element(row);
		var colspan = parseInt(MochiKit.DOM.getNodeAttribute(cell, "colSpan"), 10);
		if(colspan) {
			MochiKit.DOM.setNodeAttribute(cell, "colSpan", colspan + (max_rows - sum));
		} else {
			MochiKit.DOM.setNodeAttribute(cell, "colSpan", max_rows - sum + 1);
		}
	}
}

Sparks.last_element = function(element) {
	for(var i = element.childNodes.length - 1; i >= 0; i--) {
		var child = element.childNodes[i];
		assert(typeof child === "object", "O NOES!");
		if(child.nodeType === 1)
			return child;
	}
	return null;
}

Sparks.first_element = function(element) {
	for(var i = 0;i < element.childNodes.length; i++) {
		var child = element.childNodes[i];
		if(child.nodeType === 1)
			return child;
	}
	return null;
}

Sparks.get_anchor_offset = function get_anchor_offset(anchor) {
	if(typeof anchor === "object" && anchor !== null && 
		typeof anchor.x === "number" && typeof anchor.y === "number")
		return anchor;
	if(anchor instanceof Array) {
		return {x:anchor[0], y:anchor[1]};
	}
	var offset = {x:0, y:0};
	switch(anchor) {
		case "top":
			offset.x = .5;
			break;
		case "top_right":
			offset.x = 1;
			break;
		case "right":
			offset.x = 1;
			offset.y = .5;
			break;
		case "bottom_right":
			offset.x = 1;
			offset.y = 1;
			break;
		case "bottom":
			offset.x = .5;
			offset.y = 1;
			break;
		case "bottom_left":
			offset.y = 1;
			break;
		case "left":
			offset.y = .5;
			break;
		case "top_left":
			break;
		case "center":
			offset.x = .5;
			offset.y = .5;
			break;
	}
	return offset;
}

	/* Anchor
	options:
		dock - Base element.
		anchor - Child element.

		The following can be empty, strings indicating preset positions, or a point.
		docking_point - Where to anchor the anchor at.
		anchor_point - What part of the anchor to consider the "origin".
			That is to say, which part of anchor do we want on top of the docking point.
	*/
Sparks.anchor = function anchor(options) {
	var box = Sparks.box(options.dock);
	var anchor = box.calculated(
		Sparks.get_anchor_offset(options.docking_point || "bottom_left")
	);	
	var anchor_box = Sparks.box(options.anchor);
	offset = Sparks.get_anchor_offset(options.anchor_point || "top_left");
	var anchor_pos = {
		x:anchor.x - offset.x * anchor_box.width(),
		y:anchor.y - offset.y * anchor_box.height()
	};
	var detachers = [];
	detachers.push(Sparks.set_style(options.anchor, "position:absolute"));
	detachers.push(Sparks.obj_func(MochiKit.Style.setElementPosition, 
		options.anchor, anchor_box.position()
	));
	MochiKit.Style.setElementPosition(options.anchor, anchor_pos);
	return function detach() {
		while(detachers.length)
			detachers.shift()();
	}
}

Sparks.create_valid_child = function create_valid_child(element, second_element) {
	if(arguments.length > 2 || !Sparks.is_dom(second_element)) {
		/* We allow this function to be used directly, but to do so, we want
			to ensure that the second_element isn't mistakenly passed to functions
			that aren't expecting dirty content, so sanitize it here. */
		second_element = undefined;
	}
	if(!element) 
		return Sparks.default_element();
	var tree = Sparks.find_tree(element, second_element);
	if(!tree)
		return Sparks.default_element();
	var loc = Sparks.find_value(tree, element.tagName.toLowerCase());
	if(loc == tree.length-1)
		return Sparks.default_element();
	return MochiKit.DOM.createDOM(tree[loc+1]);
}

Sparks.default_element = function() { 
	return MochiKit.DOM.createDOM("div");
},

Sparks.ul_tree = ["ul", "li"]
Sparks.table_body_tree = ["table", "tbody", "tr", "td"]
Sparks.table_head_tree = ["table", "thead", "tr", "th"]
Sparks.option_tree = ["select", "option"]

Sparks.find_tree = function(element, second_element) {
	if(typeof element !== "object" || !element.tagName)
		return;
	var trees = [
		Sparks.ul_tree, 
		Sparks.table_body_tree, 
		Sparks.table_head_tree, 
		Sparks.option_tree
	];
	var search_results = Sparks.map(trees, function search(tree) {
		return Sparks.find_value(tree, element.tagName.toLowerCase());
	});
	var results = [];
	for(var i in search_results) {
		if(search_results[i] !== -1) {
			// It was a match, so add to our result list.
			results.push(trees[i]);
		}
	}
	if(results.length === 1 || !second_element || !second_element.tagName) {
		// No ambiguity, or no way to resolve it, so return the first match.
		return results[0];
	}
	// We had multiple matches, so disambiguate here.
	for(var i in results) {
		if(-1 !== Sparks.find_value(results[i], second_element.tagName.toLowerCase()))
			return results[i];
	}
	// No success, so just return the first arbitrarily.
	return results[0];
}

Sparks.get_root = function(element, validator) {
	var parent_elem = Sparks.get_parent(element);
	if(!parent_elem || (validator && !validator(parent_elem)))
		return element;
	return Sparks.get_root(parent_elem, validator);
}

Sparks.construct_to_parent = function construct_to_parent(element) {
	assert(!Sparks.get_parent(element),
		"Sparks.construct_to_parent: Element has a parent.",
		{elem:element, parent:Sparks.get_parent(element)}
	);
	var tree = Sparks.find_tree(element);
	if(!tree || tree[0] === element.tagName.toLowerCase())
		return element;
	var val = Sparks.find_value(tree, element.tagName.toLowerCase());
	var parent = MochiKit.DOM.createDOM(tree[val-1])
	parent.appendChild(element);
	return Sparks.construct_to_parent(parent);
}

Sparks.construct_to_child = function construct_to_child(element, child, dont_append_final) {
	element = MochiKit.DOM.getElement(element);
	assert(Sparks.is_dom(element), "Sparks.construct_to_child: Parent isn't a DOM element.");
	if(element === child)
		return element;
	if(child instanceof Array) {
		if(child.length === 0)
			return element;
		/* For arrays, we find the deepest parent of the node, then use
			that parent (if it's not above the original parent) for the
			remaining children. */
		var parent = element;
		element = Sparks.construct_to_child(element, child[0]);
		if(element !== parent)
			element = Sparks.get_parent(element);
		for(var i = 1; i < child.length; i++) {
			Sparks.construct_to_child(element, child[i]);
		}
		return element;
	}
	assert(Sparks.is_dom(child), 
		"Sparks.construct_to_child: Child must be a DOM element. (child:%child)", child
	);
	if(child.parentNode === element)
		return element;
	var tree = Sparks.find_tree(element, child);
	if(tree) {
		// It's a hierarchy-based element, so loop and add elements.
		var val = Sparks.find_value(tree, element.tagName.toLowerCase());
		while(true) {
			if(val === tree.length - 1)
				break;
			val++;
			if(child.tagName && tree[val] === child.tagName.toLowerCase()) {
				// Our element falls in this tree, so simply append it and return.
				if(!dont_append_final)
					element.appendChild(child);
				Sparks.normalize_tables(element);
				return element;
			}
			element.appendChild(element = MochiKit.DOM.createDOM(tree[val]));
		}
	} 
	/* Our element doesn't fit in the element's tree, 
		so construct it to its parent, and append that.	*/
	var child_tree = Sparks.construct_to_parent(child);
	if(!dont_append_final || child_tree !== child) {
		element.appendChild(child_tree);
	}
	return Sparks.get_parent(child) || element;
}

Sparks.set_content = function set_content(element, content) {
	if(Sparks.is_deferred(content)) {
		content.add_listener(Sparks.set_content, element);
		return element;
	}
	if(!Sparks.is_dom(element) && typeof element !== "string")
		return element.set(content);
	element = MochiKit.DOM.getElement(element);
	if(element.nodeType === 3) {
		element.nodeValue = content;
	} else if(element.tagName.toLowerCase() === "input" ||
		element.tagName.toLowerCase() === "textarea") {
		if(element.type === "checkbox" || element.type === "radio")
			element.checked = !!content;
		else
			element.value = content !== undefined ? content : "";
	} else {
		MochiKit.DOM.replaceChildNodes(element, content);
	}
	return element;
}

Sparks.get_content = function get_content(element) {
	if(!Sparks.is_dom(element))
		return !!element.checked();
	if(element.nodeType === 3) {
		return element.nodeValue;
	} else if(element.tagName.toLowerCase() === "input" ||
		element.tagName.toLowerCase() === "textarea") {
		if(element.type === "checkbox" || element.type === "radio")
			return !!element.checked;
		var value = element.value || "";
		// We coerce numbers in get_content. Beware.
		if(value.match(/^\s*(\d+(\.\d*)?|\.\d+)\s*$/))
			value = parseFloat(value, 10);
		return value;
	} else {	
		return element.innerHTML;
	}
	assert(false, "Defaulted in get_content");
}

Sparks.remove_element = function remove_element() {
	var elems = MochiKit.Base.flattenArray(Sparks.get_args(arguments));
	while(elems.length) {
		var elem = elems.shift();
		MochiKit.Base.nodeWalk(elem, function(child) {
			Sparks.signal_event(child, "remove_element");
			return child.childNodes;
		});	
		elem.parentNode && elem.parentNode.removeChild(elem);
	}
	return elems;
}

Sparks.append_child_nodes = function append_child_nodes(src/*, ... */) {
	src = MochiKit.DOM.getElement(src);
	var elems = MochiKit.Base.flattenArray(Sparks.get_args(arguments, 1));
	var output = Sparks.output(elems, src);
	Sparks.add_listener(output, function output_listener(elements) {
		if(Sparks.debug)
			Sparks.log("Sparks.append_child_nodes", {src:src, elements:elements});
		Sparks.construct_to_child(src, elements);
		Sparks.normalize_tables();
	});
	return output;
}

Sparks.replace_child_nodes = function replace_child_nodes(src/*, ... */) {
	src = MochiKit.DOM.getElement(src);
	var elems = MochiKit.Base.flattenArray(Sparks.get_args(arguments, 1));
	var output = Sparks.output(elems, src);
	Sparks.add_listener(output, function output_listener(elements) {
		if(Sparks.debug)
			Sparks.log("Sparks.replace_child_nodes", {src:src, elements:elements});
		while(src.childNodes.length)
			Sparks.remove_element(src.firstChild);
		Sparks.construct_to_child(src, elements);
		Sparks.normalize_tables();
	});
	return output;
}

Sparks.swap_dom = function swap_dom(replaced, replacer, creator) {
	replaced = MochiKit.DOM.getElement(replaced);
	if(Sparks.is_widget(replacer)) {
		return replacer.output_to_placeholder(replaced, creator);
	}
	if(!replaced)
		replaced = creator();
	var replaced_parent = Sparks.get_parent(replaced);
	if(!replaced_parent) {
		Sparks.append_child_nodes(replaced, replacer);
		return replaced;
	}
	var output = Sparks.output(replacer, replaced_parent);
	Sparks.add_listener(output, function output_listener(replacer) {
			if(Sparks.debug)
				Sparks.log("Sparks.swap_dom", {replaced:replaced, replacer:replacer});
			Sparks.signal_event(replaced, "remove_element", replacer);
			replaced_parent.replaceChild(replacer, replaced);
			Sparks.normalize_tables();
		}
	);
	return output;
}

Sparks.add_element_class = function add_element_class(class_name, elems) {
	elems = Sparks.coerce_array(elems);
	for(var i in elems)
		MochiKit.DOM.addElementClass(elems[i], class_name);
	return Sparks.obj_func(Sparks.remove_element_class, class_name, elems);
}

Sparks.remove_element_class = function remove_element_class(class_name, elems) {
	elems = Sparks.coerce_array(elems);
	for(var i in elems)
		MochiKit.DOM.removeElementClass(elems[i], class_name);
	return Sparks.obj_func(Sparks.add_element_class, class_name, elems);
}

Sparks.linkify = function linkify(hover_class, elem) {
	var attacher, remover;
	attacher = Sparks.obj_func(Sparks.add_element_class, hover_class, elem);
	var linkifier = function detach() {
		remover && remover();
		while(linkifier.detachers.length)
			linkifier.detachers.shift()();
		return Sparks.obj_func(Sparks.linkify, hover_class, elem);
	}
	linkifier.detachers = [];
	linkifier.onmouseover = linkifier.attach = function onmouseover() {
		if(Sparks.debug)
			Sparks.log_joined("Sparks.linkify.attach: Attempting attachment");
		if(!remover) {
			remover = attacher();
			attacher = undefined;
		}
	}
	linkifier.onmouseout = linkifier.remove = function onmouseout() {
		if(Sparks.debug)
			Sparks.log_joined("Sparks.linkify.remove: Attempting removal");
		if(!attacher) {
			attacher = remover();
			remover = undefined;
		}
	}
	linkifier.detachers.push(Sparks.add_event_listener(elem, "move_mouse", 
		function listener(src, action) {
			linkifier[action]();
		}
	));
	linkifier.detachers.push(
		Sparks.add_event_listener(elem, "remove_element", linkifier.remove)
	);
	return linkifier;
}
