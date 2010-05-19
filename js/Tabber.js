Sparks.tabber = function tabber(options) {
	if(arguments.length === 2)
		options = {owner:arguments[0], items:arguments[1]};
	options = options || {};
	var that = Sparks.event_source("Tabber");

	that.owner = options.owner || that;
	
	that.items = options.items || Sparks.list();
	if(!Sparks.get_items(that.items))
		that.items = [that.items];

	that.focus = function focus(direction) {
		var items = Sparks.get_items(that.items).slice();
		direction === "backward" && items.reverse();
		for(var i = 0; i < items.length; i++)
			if(items[i] && typeof items[i].focus === "function")
				return items[i].focus(direction);
		if(typeof that.owner.blur === "function")
			return that.owner.blur(direction);
		return that.blur(direction);
	}

	that.blur = function blur(direction, event) {
		return Sparks.signal_event(that.owner, "onblur", event, direction);
	}

	that.watched = [];
	that.attacher = options.attacher || function attacher(elem) {
		if(!Sparks.is_dom(elem))
			return MochiKit.Base.noop;
		return Sparks.add_event_listener(elem, "onkeydown", function key_listener(src, action, event) {
			if(event.key().string !== "KEY_TAB")
				return;
			Sparks.signal_event(elem, "onblur", event, event.modifier().shift ? "backward" : "forward");
		});
	};

	that.blur_validator = function blur_validator(src, direction) {
		return (direction === "backward" && src === Sparks.first(that.items)) ||
			(direction === "forward" && src === Sparks.last(that.items));
	}

	that.attach = function attach(elem) {
		var detachers = [];
		detachers.push(that.attacher(elem));
		detachers.push(Sparks.add_event_listener(elem, "onblur", 
			function focus_listener(src, action, event, direction) {
				if(!direction) {
					event && event.stop();
					return;
				}
				if(that.blur_validator(src, direction)) {
					if(typeof that.owner.blur === "function")
						return that.owner.blur(direction, event);
					return that.blur(direction, event);
				}
				var items = Sparks.get_items(that.items);
				var next = items[Sparks.find_value(items, src) + (direction === "forward" ? 1 : -1)];
				if(next) {
					event && event.stop();
					next.focus(direction);
				}
			}
		));
		return function remover() {
			while(detachers.length)
				detachers.shift()();
		}
	}

	that.check_item = function check_item(pos, items) {
		items = items || Sparks.get_items(that.items);
		if(that.watched[pos] && items[pos] !== that.watched[pos].item) {
			that.watched[pos].detach();
			delete that.watched[pos];
		}
		if(!items[pos])
			return;
		that.watched[pos] = {
			detach:that.attach(items[pos]),
			item:that.items[pos]
		};	
	}

	Sparks.mirror_event(that.items, "update_list", function processor(action, pos, item) {
		switch(action) {
			case "add_item":
				that.watched.splice(0, that.watched.length);
				break;
			case "remove_item":
				that.watched.splice(pos, 1)[0].detach();
				break;
			case "clear_items":
				Sparks.map_call(that.watched, "detach");
		}
	});	
	Sparks.mirror_event(that.items, "update_order", that.watched);

	var items = Sparks.get_items(that.items);
	for(var i in items)
		that.check_item(i, items);

	return that;
}
