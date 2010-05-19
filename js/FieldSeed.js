Sparks.field_seed = function field_seed(options) {
	options = options || {};
	var that = {};
	that.fields = Sparks.list();
	that.dict = options.dict;
	that.meta_object = options.meta_object || Sparks.MetaObjects[that.dict.type];
	that.watched = options.watched || Sparks.keys(that.meta_object.fields);
	assert(that.meta_object, "Sparks.field_seed: MetaObject is falsy.");

	function get_template(template) {
		if(typeof template === "string")
			return that.meta_object.fields[template];
		if(Sparks.is_field_template(template))
			return template;
	}

	if(Sparks.is_field_template(that.watched) || typeof that.watched === "string")
		that.watched = [that.watched];
	if(that.watched instanceof Array) {
		var obj = {};
		for(var i in that.watched) {
			var watch = get_template(that.watched[i]);
			obj[watch.name] = watch;
		}
		that.watched = obj;
	} else if(typeof that.watched === "object" && !Sparks.is_field_template(that.watched)) {
		var obj = {};
		var root = get_template(that.watched.root);
		if(!that.watched.children) {
			MochiKit.Base.nodeWalk(root, function walker(node) {
				obj[node.name] = node;
				return node.dependents;
			});
		} else {
			that.watched.children = Sparks.coerce_array(that.watched.children);
			var final = Sparks.set({proxied:false});
			final.comparator = MochiKit.Base.operator.seq;
			function recursor(node, set) {
				set.push(node);
				if(node === child.child)
					return;
				if(!node.dependents.length) {
					set.splice(0, set.length);
					return;
				}
				recursor(node.dependents[0], set);
				for(var i = 1; i < node.dependents.length; i++) {
					var child_set = set.slice(0, set.length - 2);
					sets.push(child_set);
					recursor(node.dependents[i], child_set);
				}
			}
			for(var i in that.watched.children) {
				var child = that.watched.children[i];
				child = get_template(child) || child;
				if(Sparks.is_field_template(child))
					child = {child:child};
				child.child = get_template(child.child);
				child.hints = !child.hints ? [] :
					Sparks.map(Sparks.coerce_array(child.hints), get_template);
				var sets = [[]];
				recursor(root, sets[0]);
				for(var i = 0; i < sets.length; i++) {
					if(Sparks.difference(child.hints, sets[i]).length)
						sets.splice(i--, 1);
				}
				final.add_all(MochiKit.Base.flattenArray(sets));
			}
			final = Sparks.get_items(final);
			for(var i in final) {
				var field = final[i];
				obj[field.name] = field;
			}
		}
		that.watched = obj;
	}

	function update_dict_listener(src, action, items) {
		function test_field(field) {
			if(!field || !(field.name in that.watched))
				return;
			var name = field.name;
			if(that.fields.get(field)) {
				if(!field.check(that.dict, computed))
					removing[name] = field;
			} else {
				if(field.check(that.dict, computed))
					adding[name] = field;
			}
		}
		var computed = that.dict.computed(items);
		var removing = {};
		var adding = {};
		for(var i in items) {
			var field = that.meta_object.fields[i];
			test_field(field);
			field && Sparks.map(field.dependents, test_field);
		}
		adding = MochiKit.Base.values(adding);
		removing = MochiKit.Base.values(removing);
		removing.length && that.fields.remove_all(removing);
		adding.length && that.fields.add_all(adding);
	};

	Sparks.add_event_listener(that.dict, "update_dict", update_dict_listener);
	var initial = {};
	for(var i in that.watched) {
		if(!that.dict.is_set(i))
			initial[i] = undefined;
	}
	update_dict_listener(that.dict, "set_item", initial);

	return that;
}
