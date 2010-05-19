Sparks.multiple_field = function multiple_field(options) {
	options = options || {};
	var that = Sparks.widget("MultipleField", options.presenter, options.operational);

	that.fields = options.fields || Sparks.list();
	that.elements = Sparks.element_list(that.fields);

	// Overload me.
	that.construct_field = Sparks.strip_args(Sparks.text_field);

	that.get_value = function get_value() {
		return Sparks.map_call(that.fields, "get_value");
	}

	that.add = that.push = function add() {
		var field = that.construct_field(that.fields.length());
		that.fields.push(field);
		return field;
	}

	that.add_at = function add_at(pos) {
		var field = that.construct_field(that.fields.length());
		that.fields.add_at(field, pos);
		return field;
	}

	that.remove = that.fields.remove;
	that.remove_at = that.fields.remove_at;
	that.remove_all = that.fields.remove_all;
	that.clear = that.fields.clear;

	var field_packets = [];
	function create_packet(pos, field) {
		var packet = {
			field:field, 
			pointer:Sparks.item_pointer(that.fields, pos), 
			value:field.get_value()
		};
		packet.detach = Sparks.exhauster(packet.detachers = []);
		packet.detachers.push(packet.pointer.freeze);
		packet.detachers.push(field.add_listener(function field_listener(value) {
			packet.value = value;
		}));
		return packet;
	}

	Sparks.mirror_event(that.fields, "update_list", function pxr(action, pos, item) {
		switch(action) {
			case "add_item":
				field_packets.splice(pos, 0, create_packet(pos, item));
				break;
			case "remove_item":
				field_packets.splice(pos, 1)[0].detach();
				break;
			case "clear_items":
				Sparks.map_call(field_packets, "detach");
				field_packets.splice(0, field_packets.length);
		}
	});

	Sparks.mirror_event(that.fields, "update_order", field_packets);

	that.presenter.set_processor("content", Sparks.working_or_child);
	that.presenter.add_post_processor("content", function content_post_pxr(out) {
		that.elements.output(out);
	});

	return that;
}
