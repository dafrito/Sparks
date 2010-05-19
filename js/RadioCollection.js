Sparks.is_radio_button = function is_radio_button(obj) {
	return Sparks.is_dom(obj) && obj.tagName.match(/input/i) && 
		obj.type && obj.type.match(/radio/i);
}

Sparks.radio_collection = function radio_collection(options) {
	var that = Sparks.tabber.apply(null, arguments);
	options = options || {};

	that.checked = function checked() {
		var items = Sparks.get_items(that);
		for(var i in items) {
			var item = items[i];
			if(!Sparks.is_radio_button(item))
				continue;
			if(item.checked)
				return item;
		}
	}

	var tabber_focus = that.focus;
	that.focus = function focus(direction) {
		var checked = that.checked();
		checked ?
			checked.focus() :
			tabber_focus(direction);
	}

	var tabber_validator = that.blur_validator;
	that.blur_validator = function blur_validator(src, direction) {
		return that.checked() ? true : tabber_validator(src, direction);
	}

	that.set = function set(value) {
		if(Sparks.is_dom(value))
			value = Sparks.get_content(value);
		var items = Sparks.get_items(that);
		if(value === undefined) {
			var radio = items[Sparks.find_value(items, value, 
				function cmp(item) { return item.checked; }
			)];
			radio && (radio.checked = false);
		} else {
			var radio = items[Sparks.find_value(items, value, 
				function cmp(item) { return item.value == value; }
			)];
			radio.checked = true;
		}
	}

	return that;
}
