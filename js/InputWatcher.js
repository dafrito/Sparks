Sparks.input_watcher = function input_watcher(options) {
	if(Sparks.is_dom(options))
		options = {input:options};
	options = options || {};
	var that = Sparks.delayed(options.duration, that, "check");

	that.input = options.input;
	that.minimum_length = options.minimum_length;
	that.minimum_delay = options.minimum_delay;
	that.typing = Sparks.delayed(that.typing_delay || .1, that, "check");

	var start = that.start;
	that.start = function start() {
		that.detach = that.detach || Sparks.key_listener(that.input, that.typing.restart).detach;
		start();
	}

	that.validator = options.validator || function validator(value, old) {
		return value.length > (that.minimum_length || 2) && value !== old;
	}

	var last_value;
	that.check = function check(value) {
		that.stop();
		value = arguments.length ? value : Sparks.trim(Sparks.get_content(that.input));
		if(that.delta(false) > that.minimum_length && that.validator(value, last_value)) {
			Sparks.map_call(that.listeners, value);
			last_value = value;
			that.mark();
		}
		that.start();
	}

	that.add_listener = Sparks.listener_adder(that.listeners = [], true);

	return that;
}
