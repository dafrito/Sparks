// Sparks.MetaObject

Sparks.is_meta_object = Sparks.izzer("MetaObject");
Sparks.MetaObjects = {};

/* MetaObject
options:
	object_type
	fields
	submitter
*/
Sparks.meta_object = function meta_object(options) {
	options = options || {};
	var that = {};
	that.type = "MetaObject";
	that.object_type = options.object_type;

	that.fields = options.fields;

	that.processors = [];
	that.add_processor = Sparks.listener_adder(that.processors, true);

	that.create = function create(dict) {
		that.fields = Sparks.parse_field_requirements(that.fields);
		Sparks.MetaObjects[that.object_type] = Sparks.MetaObjects[that.object_type] || that;
		dict = dict || Sparks.dict();
		dict.submit = Sparks.obj_func(that, "submitter", dict);
		dict.type = that.object_type;
		for(var i in that.processors)
			that.processors[i](dict);
		return dict;
	}

	that.submitter = options.submitter || function submitter(dict) {
		that.dict.set("state", "submitted");
	}

	that.add_processor(function initializer(dict) {
		Sparks.add_event_authorizer(dict, "set_item", dict_iterator, set_item_authorizer);
		Sparks.add_event_authorizer(dict, "unset_item", dict_iterator, unset_item_authorizer);
		Sparks.add_event_authorizer(dict, 
			Sparks.event_descendents("update_dict"), dict_iterator, item_authorizer
		);
		dict.set("type", that.object_type);
	});

	function dict_iterator(authorizer, src, action, items) {
		var computed = src.computed(items);
		var errors = [];
		for(var i in items) {
			var field = that.fields[i];
			if(field) {
				var returned = authorizer(items[i], field, i, computed, src);
				if(returned !== undefined && returned !== true)
					errors = errors.concat(returned);
			}
		}
		return errors.length ? errors : true;
	}

	function item_authorizer(value, field, key, computed, dict) {
		if(field.optional && ("" === value || MochiKit.Base.isUndefinedOrNull(value)))
			return true;
		return Sparks.authorize_field_value(value, key, computed, field);
		// return Sparks.authorize_field_value(value, field, key, computed); // I think this is obsolete syntax
	}

	function set_item_authorizer(value, field, key, computed, dict) {
		return field.check(dict, computed, true) && Sparks.every(
			Sparks.map_call(field.dependents, "check", dict, computed, true)
		);	
	};

	function unset_item_authorizer(value, field, key, computed, dict) {
		for(var i in field.dependents) {
			var dependent = field.dependents[i];
			if(computed(dependent.name) && !dependent.check(dict, computed, true))
				return false;
		}
	};

	return that;
}
