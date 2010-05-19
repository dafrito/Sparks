/*Sparks.listbox = function listbox(options) {
	options = options || {};
	var that = Sparks.field(options);

	that.selected = Sparks.list();
	that.insertion_order = [];

	Sparks.add_event_listener(that.selected, "update_list", 
		function update_listener(src, action, pointers, items) {
			if(action === "add_item") {
				that.insertion_order = that.insertion_order.concat(items);
			} else {
				that.insertion_order = Sparks.difference(that.insertion_order, items);
			}
		}
	);	

	that.minimum = options.minimum || 1;
	that.maximum = options.maximum || 3;

	that.selector = Sparks.element_selector(options);
	that.selector.add_listener(function(item, pos) {
		debugger;
		if(that.selected.get(item)) {
			that.selected.remove(item);
		} else {
			if(that.maximum && that.selected.length() + 1 > that.maximum)
				that.selected.remove(that.insertion_order.shift());
			that.selected.push(item);
		}
	});

	that.get_value = Sparks.obj_func(Sparks.get_items, that.selected);

	return that;
}
*/

Sparks.field_registry = {};
Sparks.add_initializer("FieldRegistry creation", function field_registry() {
	MochiKit.Base.update(Sparks.field_registry, {
		// Any overrides to the field registry should go here.
	});
});

Sparks.get_field_constructor = function get_field_constructor(template) {
	var type;
	if(typeof template === "string")
		type = template;
	else if(!!template)
		type = template.field_type;
	var ancestors = Sparks.FieldHierarchy.get(type).ancestors(true);
	ancestors = ancestors || [type];
	for(var i in ancestors) {
		var type = ancestors[i];
		var ctor = Sparks.field_registry[type] || Sparks[type + "_field"];
		if(ctor)
			return ctor;
	}
	return Sparks.field;
}

Sparks.create_field = function create_field(template, dict) {
	return Sparks.get_field_constructor(template)({template:template, dict:dict});
}

Sparks.attach_mapper = function attach_mapper(that, options) {
	options = options || {};
	that.field_type = that.field_type || "list";

	that.add_initializer(function mapper_initializer() {
		that.template.options = that.template.options || that.options;
		assert(that.template.options === that.options, 
			"Sparks.attach_mapper: FieldTemplate's options don't match MapperField's options."
		);
		that.mapper.add_list(that.options);
	});

	that.options = options.options || (options.template && options.template.options) || Sparks.list();
	that.mapper = Sparks.primitive_mapper();
	if(options.comparator)
		that.mapper.comparator = options.comparator;

	return that;
}

Sparks.mapped_text_field = function mapped_text_field(options) {
	if(Sparks.get_items(options))
		options = {options:options};
	options = options || {};
	var that = Sparks.attach_mapper(Sparks.text_field(), options);

	that.convert_to_fields = function convert_to_fields(value) {
		return {text:value ? that.mapper.convert(value) : ""};
	}

	that.get_field_value = function get_field_value(value) {
		return that.mapper.get_by_key(that.gather_values(value).text)[0];
	}

	return that;
}

Sparks.text_field = function text_field(options) {
	options = options || {};
	var that = Sparks.converter_field(MochiKit.Base.update(
		{type:"TextField", field_type:"text"}, options
	));

	that.text_field = options.text_field || MochiKit.DOM.INPUT();

	that.get_field_value = function get_field_value(inputs) {
		return that.gather_values(inputs).text;
	}

	that.convert_to_fields = function convert_to_fields(value) {
		return {text:value};
	}

	that.presenter.add_predrawer(function predrawer() {
		that.add_input("text", that.text_field);
		that.add_catcher(Sparks.add_element_class, "error", that.text_field);
	});

	that.presenter.set_processor("content", function content_pxr(working) {
		return that.text_field;
	});

	return that;
}

Sparks.checkbox_field = function checkbox_field(options) {
	options = options || {};
	var that = Sparks.attach_mapper(Sparks.converter_field(MochiKit.Base.update(
		{type:"CheckboxField", field_type:"checkbox"}, options
	)));

	that.elements = options.elements || Sparks.element_list();
	that.elements.items = that.options;

	that.elements.process_item = function process_item(item, pointer) {
		var field = MochiKit.DOM.INPUT({type:"checkbox"});
		field.value = Sparks.proper_nounize(that.mapper.convert(item));
		return [field, field.value];
	};

	that.elements.add_post_processor(function post_pxr(out, pointer) {
		if(!Sparks.is_dom(out) || !out.tagName || !out.type)
			return;
		if(out.tagName.match(/input/i) && out.type.match(/checkbox/i))
			that.add_input(that.mapper.convert(pointer.item()), out, pointer);
	});

	that.convert_to_fields = function convert_to_fields(value) {
		value = Sparks.coerce_array(value);
		var inputs = {};
		for(var i in that.inputs)
			inputs[i] = false;
		for(var i in value)
			inputs[that.mapper.convert(value[i])] = true;
		return inputs;
	}

	that.get_field_value = function get_field_value(inputs) {
		inputs = that.gather_values(inputs);
		var checked = [];
		for(var i in inputs) {
			if(inputs[i])
				checked = checked.concat(that.mapper.get(i));
		}
		return checked;
	}

	that.presenter.set_processor("content", Sparks.working_or_child);

	that.presenter.add_post_processor("content", function content_post_pxr(out) {
		that.elements.output(out);
	});

	return that;
}

Sparks.radio_field = function radio_field(options) {
	options = options || {};
	var that = Sparks.attach_mapper(Sparks.converter_field(MochiKit.Base.update(
		{type:"RadioField", field_type:"radio"}, options
	)));

	that.radio = Sparks.radio_collection({owner:that});
	that.elements = options.elements || Sparks.element_list();

	that.presenter.add_predrawer(function predrawer() {
		that.add_input("radio", that.radio);
	});

	that.elements.process_item = function process_item(item, pointer) {
		var field = MochiKit.DOM.INPUT({type:"radio", name:that.id});
		field.value = that.mapper.convert(item);
		return [field, field.value];
	};

	that.elements.add_post_processor(function post_pxr(out, pointer) {
		if(!Sparks.is_dom(out) || !out.tagName || !out.type)
			return;
		if(out.tagName.match(/input/i) && out.type.match(/radio/i))
			that.radio.items.add_at(out, pointer);
	});

	that.convert_to_fields = function convert_to_fields(value) {
		return {radio:value === undefined ? undefined : that.mapper.convert(value)};
	}

	that.get_field_value = function get_field_value(inputs) {
		var checked = that.gather_values(inputs).radio;
		return that.mapper.get(checked ? checked.value : undefined)[0];
	}

	that.presenter.set_processor("content", Sparks.working_or_child);
	that.presenter.add_post_processor("content", function content_post_pxr(out) {
		that.elements.output(out, that.options);
	});

	return that;
}
