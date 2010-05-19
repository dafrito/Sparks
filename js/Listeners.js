Sparks.event_listener = function event_listener(elem) {
	var that = {};

	that.add_listener = Sparks.listener_adder(that.listeners = [], true);
	that.element;

	var dispatcher = Sparks.obj_func(Sparks.map_call, that.listeners);

	var remover;
	that.attach = function attach(elem) {
		elem = MochiKit.DOM.getElement(elem || that.element);
		if(remover && elem === that.element)
			return;
		that.detach();
		return remover = Sparks.add_event_listener(that.element = elem, that.type, 
			function(src, action, event) {
				var args = that.processor ? that.processor(event, action, that.element) : event;
				if(args !== undefined)
					dispatcher.apply(null, Sparks.coerce_array(args));
			}
		);	
	}

	that.detach = function detach() { 
		remover && remover();
		remover = undefined;
	}

	if(arguments.length > 1) {
		var listener = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		listener && that.add_listener(listener);
	}

	return that;
}

Sparks.dual_event_listener = function dual_event_listener(elem, listener, remover) {
	var that = {};

	that.add_listener = Sparks.listener_adder(that.listeners = [], true);
	that.add_remover = Sparks.listener_adder(that.removers = [], true);

	that.looping;
	that.element;
	that.listener_type;
	that.remover_type;

	that.listener_processor;
	that.remover_processor;

	function event_receiver(listeners, reversers, src, action, event) {
		if(that.processor)
			var processor = that.processor;
		else {
			var processor = that.listeners === listeners ? 
				that.listener_processor : 
				that.remover_processor;
		}
		var args = processor ? processor(event, action, src) : event;
		if(args === undefined)
			return;
		args = Sparks.coerce_array(args);
		if(!that.looping)
			return Sparks.map_call.apply(null, [listeners].concat(args));
		return Sparks.fire_reversibles.apply(null, [listeners, reversers].concat(args));
	}

	var detachers = [];
	that.attach = function attach(elem) {
		elem = MochiKit.DOM.getElement(elem || that.element);
		if(that.detach && elem === that.element)
			return;
		that.detach && that.detach();
		detachers.push(
			Sparks.add_event_listener(that.element = elem, 
				that.listener_type, event_receiver, that.listeners, that.removers
			)
		);
		detachers.push(
			Sparks.add_event_listener(that.element = elem, 
				that.remover_type, event_receiver, that.removers, that.listeners
			)
		);
		return that.detach = Sparks.exhauster(detachers);
	}
	that.detach;

	listener && that.add_listener(listener);
	remover && that.add_remover(listener);

	return that;
}

Sparks.key_listener = function key_listener(elem) {
	var that = Sparks.event_listener.apply(null, arguments);
	that.type = "onkeypress";
	that.processor = function processor(event) { 
		return event.key();
	}	
	elem && that.attach(elem);
	return that;
}

Sparks.movement_listener = function movement_listener(elem) {
	var that = Sparks.event_listener.apply(null, arguments);
	that.type = "onmousemove";
	var last_movement;
	that.processor = function processor(event) { 
		last_movement = event.movement(last_movement);
		return [last_movement.delta, last_movement];
	};
	elem && that.attach(elem);
	return that;
}

Sparks.scroll_listener = function scroll_listener(elem) {
	var that = Sparks.event_listener.apply(null, arguments);
	that.type = "onscroll";
	that.processor = function processor(event) { 
		return event.scroll();
	};
	elem && that.attach(elem);
	return that;
}

Sparks.click_listener = function click_listener(elem) {
	var that = Sparks.event_listener.apply(null, arguments);
	that.type = "onclick";
	that.processor = function processor(event) { 
		return event.src();
	};
	elem && that.attach(elem);
	return that;
}

Sparks.mouse_listener = function mouse_listener(elem, listener, remover) {
	var that = Sparks.dual_event_listener.apply(null, arguments);
	that.listener_type = "onmouseover";
	that.remover_type = "onmouseout";

	that.processor = function processor(event, action, src) {
		if(action !== "onmouseout" || !Sparks.is_descendent(event.relatedTarget(), src))
			return src;
	}

	elem && that.attach(elem);
	return that;
}

Sparks.focus_listener = function focus_listener(elem, over, out) {
	var that = Sparks.dual_event_listener.apply(null, arguments);
	that.listener_type = "onfocus";
	that.remover_type = "onblur";

	that.processor = function processor(event, action, src) { 
		return src; 
	}

	elem && that.attach(elem);
	return that;
}
