/* Anchorify
options:
	anchor, dock, docking_point, anchor_point - See Sparks.anchor(options)
	effect - Effect to use in the transition. Purely convenience.
*/
Sparks.anchorify = function anchorify(options) {
	if(Sparks.is_dom(options) || typeof options === "string")
		options = {anchor:MochiKit.DOM.getElement(options)};
	options = options || {};
	var that = Sparks.transitioner(options.anchor);

	options.effect && that.add_effect(options.effect);

	that.anchor = options.anchor;
	that.dock = options.dock;
	that.parent = options.parent;
	that.docking_point = options.docking_point;
	that.anchor_point = options.anchor_point;

	that.attach_transitioner = options.attach_transitioner;
	if(!that.attach_transitioner) {
		that.attach_transitioner = function attach_transitioner(transitioner, dock, anchor) {
			return Sparks.mouse_listener(dock, transitioner.finish, transitioner.undo).detach;
		}
	}

	function starter() {
		var detachers = [];
		Sparks.append_child_nodes(that.parent || that.dock, that.anchor);
		detachers.push(Sparks.obj_func(Sparks.remove_element, that.anchor));
		Sparks.set_style(that.anchor, "position", "absolute");
		var visibility = Sparks.update_style("visibility:hidden;", that.anchor);
		detachers.push(Sparks.anchor(that));
		visibility();
		return function() {
			Sparks.exhaust(detachers);
			return starter;
		}
	}

	that.output = function output(parent, dock, anchor) {
		that.parent = MochiKit.DOM.getElement(parent || that.parent || Sparks.get_parent(that.dock));
		that.dock = MochiKit.DOM.getElement(dock || that.dock || that.parent);
		that.anchor = MochiKit.DOM.getElement(anchor || that.anchor);
		that.attach_transitioner(that, that.dock, that.anchor);
		that.add_listener(starter);
		that.element = that.anchor;
	}

	that.dock && that.output();

	return that;
}
