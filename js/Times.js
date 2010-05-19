Sparks.time = function time(options) {
	if(arguments.length > 1)
		options = {offset:arguments[0], duration:arguments[1]};
	options = options || {};
	var that = {};
	that.offset = options.offset || 0;
	that.duration = options.duration || 1;

	that.calculate = function calculate(start, end) {
		if(Sparks.some([that.offset, that.offset + that.duration], Sparks.within_range, start, end))
			return [that];
		return [];
	}

	that.toString = function toString() {
		return Sparks.interpolate("Sparks.time(%s, %s)", that.offset, that.duration);
	}

	return that;
}

Sparks.repeater = function repeater(options) {
	options = options || {};
	var that = {};

	that.offset = options.offset || 10;
	that.duration = options.duration || 10;
	that.footer = options.footer || 10;

	that.calculate = function calculate(start, end) {
		Sparks.debug && Sparks.log("Sparks.repeater.calculate:", {start:start, end:end});
		that.total = that.total || that.duration + that.footer;
		that.offset %= that.total;
		var times = [];
		if(Math.abs(start % that.total) - that.offset < that.duration) {
			times.push(Sparks.time(
				Sparks.floored_modulus(start, that.total) + that.offset,
				that.duration
			));
		}
		start += that.offset + that.total - Math.abs(start % that.total);
		//Sparks.debug && Sparks.log("Sparks.repeater:", {start:start});
		while(start < end) {
			times.push(Sparks.time(start, that.duration));
			start += that.total;
		}
		Sparks.debug && Sparks.log_joined("Sparks.repeater:", times);
		return times;
	}

	return that;
}
