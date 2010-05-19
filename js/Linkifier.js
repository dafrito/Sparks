Sparks.linkifier = function linkifier(element) {
	var that = Sparks.is_transitioner(element) ? element : Sparks.transitioner(element);

	that.set_element = function set_element(element) {
		that.element = element;
		that.detachers.push(Sparks.add_event_listener(that.element, "onmouseover", that.play));
		that.detachers.push(Sparks.add_event_listener(that.element, "onmouseout", that.undo));
		that.detachers.push(Sparks.add_event_listener(that.element, "onmousedown", that.cancel));
		that.detachers.push(Sparks.add_event_listener(that.element, "onmouseup", that.finish));
		return that.element;
	}

	that.detach = Sparks.exhauster(that.detachers = []);

	element && that.set_element(element);

	return that;
}
