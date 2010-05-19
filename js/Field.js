Sparks.is_field = Sparks.izzer("Field");
/* Field
options:
	dict - passed to Watcher.
	key - passed to Watcher.
	value - passed to Watcher (initial value)
	template - FieldTemplate to use.
	field_type - type of this field (string), will default to key, and then finally to field
	standalone - is this field standalone? If so, it will authorize itself. If this field has a dict,
		then if the self-authorization is successful, the value will be signaled. This is useful if
		you have fields as a part of other fields, or simply want the strength of a field without
		having a dict attached with a metaobject.
*/
Sparks.field = function field(options) {
	assert(arguments.length < 2, "Sparks.field: Old-style ctor is no longer allowed.");
	options = options || {};
	var that = Sparks.watcher(options.dict, options.key || (options.template && options.template.name), options.value);
	that.type = options.type || "Field";

	that.template = options.template || options.field_type || options.key || "field";
	if(typeof that.template === "string")
		that.template = Sparks.field_template(MochiKit.Base.merge(options, {field_type:that.template}));
	that.standalone = options.standalone;

	// OVERLOAD me always.
	that.get_field_value = that.get_value;

	// OVERLOAD me if necessary. (If you don't know what it does, you don't need to.)
	that.immediate_authorizer = function immediate_authorizer(value) {
		return value === true || value === undefined;
	}

	/* The following shouldn't be overloaded. They're standard Field-ish behavior. If you find yourself
		wanting to, you might consider how you could do this behavior through listeners or catchers,
		through the above functions, or whether you need Field at all. */

	that.authorize_value = function authorize_value(value, key, computed, template) {
		if(that.standalone || !that.dict)
			return Sparks.authorize_field_value.apply(null, arguments);
		return that.dict.set(that.key, value);
	}

	that.add_initializer(function() {
		that.template.field_type = that.field_type || that.template.field_type;
	});

	that.add_listener(function listener(value) {
		if(that.standalone && that.dict)
			Sparks.signal_event(that.dict, "set_item", that.key, value);
	});

	that.push_value = function push_value(value) {
		that.initialize();
		if(!arguments.length)
			value = that.get_field_value();
		return Sparks.reduce_deferred({
			deferred:that.authorize_value(
				value, that.key, that.dict && that.dict.computed(that.key, value), that.template
			),
			processor:that.immediate_authorizer,
			listener:Sparks.obj_func(that.set_value, value),
			catcher:dispatch_error
		});	
	}
	that.trigger_field = Sparks.strip_args(that.push_value);

	that.add_listener(Sparks.exhauster(that.error_removers = []));
	function dispatch_error(errors) {
		errors = Sparks.coerce_array(errors);
		for(var i in errors) {
			var error = errors[i];
			for(var j in that.catchers) {
				var remover = that.catchers[j](error);
				if(typeof remover === "function")
					that.error_removers.push(remover);
			}
		}	
	}
	that.add_catcher = Sparks.listener_adder(that.catchers = []);

	return that;
};
