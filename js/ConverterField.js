Sparks.converter_field = function field(options) {
	options = options || {};
	var that = Sparks.field(options);

	Sparks.attach_presenter(that, 
		[options.presenter, that.template && that.template.field_type, that.type, "Field"]
	);

	that.inputs = options.inputs || {};
	that.tabber = options.tabber || Sparks.tabber({owner:that});

	that.focus = that.tabber.focus;
	that.blur = that.tabber.blur;

	that.add_input = function add_input(name, input, pos) {
		if(arguments.length === 1) {
			input = name;
			name = "field_" + Sparks.counter();
		}
		that.inputs[name] = input;
		if(arguments.length === 3)
			return that.tabber.items.add_at(input, pos);
		return that.tabber.items.push(input);
	}

	that.gather_values = function gather_values(inputs) {
		var gathered = {};
		inputs = inputs || that.inputs;
		for(var i in inputs)
			gathered[i] = Sparks.get_content(inputs[i]);
		return gathered;
	}

	// Overload me.
	that.get_field_value = options.get_field_value || that.gather_values;

	// Overload me.
	that.convert_to_fields = options.convert_to_fields || function convert_to_fields(value) {
		var converted = {};
		for(var i in that.inputs)
			converted[i] = value ? value[i] : value;
		return converted;
	}

	that.display_value = options.display_value || function display_value(value) {
		var field_values = that.convert_to_fields(value);
		for(var i in field_values)
			i in that.inputs && Sparks.set_content(that.inputs[i], field_values[i]);
	}

	that.presenter.add_predrawer(that, "initialize");
	that.presenter.add_postdrawer(function() {
		that.add_listener(that, "display_value");
		that.trigger();
	});

	return that;
}
