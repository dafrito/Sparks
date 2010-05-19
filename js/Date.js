Sparks.is_date = Sparks.izzer("date");

Sparks.add_initializer("Epoch Maker", function epoch_maker() {
	Sparks.epoch = Sparks.date(new Date(0));
});

Sparks.get_month = function get_month(month) {
	if(typeof month === "number")
		return month;
	if(month instanceof Date)
		return month.getMonth();
	if(Sparks.is_date(month))
		return date.month;
	month = month.toLowerCase();
	for(var i = 0; i < Sparks.short_months.length; i++) {
		if(month.match(Sparks.short_months[i]))
			return i;
	}
}

Sparks.get_day = function get_day(day) {
	if(typeof day === "number")
		return day;
	if(day instanceof Date)
		return day.getDay();
	if(Sparks.is_date(day))
		return date.day;
	day = day.toLowerCase();
	for(var i = 0; i < Sparks.short_days.length; i++) {
		if(day.match(Sparks.short_days[i]))
			return i;
	}
}

Sparks.get_date = function get_date(date) {
	return Sparks.is_date(date) ?  date.date : date;
}

Sparks.date = function date(date) {
	if(Sparks.is_date(date))
		return date;
	if(arguments.length > 1) {
		var args = Sparks.get_args(arguments);
		if(args[1])
			args[1] = Sparks.get_month(args[1]);
		date = new Date();
		date.setFullYear.apply(date, args);
	}

	var that = {};
	that.type = "date";
	that.length = Sparks.time_magnitudes.length;

	date = date || new Date();

	var date_functions = {
		year:"setFullYear",
		month:"setMonth",
		date:"setDate",
		hour:"setHours",
		minute:"setMinutes",
		second:"setSeconds",
		millisecond:"setMilliseconds",
	};

	function set(type, value/*, ... */) {
		//Sparks.log("Sparks.date.set:", {type:type, value:value});
		var args = Sparks.get_args(arguments, 1);
		switch(type) {
			case "year":
				if(args[1])
					args[1] = Sparks.get_month(args[1]);
				break;
			case "month":
				args[0] = Sparks.get_month(args[0]);
				break;
			case "day":
				value = Sparks.enforce_range(Sparks.get_day(value), 0, 6);
				date.setDate(date.getDate() + (value - date.getDay()));
				return update();	
		}
		date[date_functions[type]].apply(date, args);
		return update();
	}

	that.set_meridiem = function set_meridiem(meridiem) {
		if(meridiem === true || meridiem > 0)
			meridiem = "PM";
		if(meridiem === false || meridiem === 0)
			meridiem = "AM";
		meridiem = meridiem.toUpperCase();
		if(that.meridiem === meridiem)
			return that;
		return that.move_hour(meridiem === "PM" ? 12 : -12);
	}

	that.set_day = Sparks.obj_func(set, "day");
	that.move_day = function move_day(offset) {
		return that.set_date(that.date + offset);
	}
	that.next = that.next_day = Sparks.obj_func(move, "date", 1);
	that.previous = that.previous_day = Sparks.obj_func(move, "date", -1);

	that.set_time = function set_time(hours, minutes, seconds, millis) {
		date.setHours(
			hours || 0, 
			minutes || 0, 
			seconds || 0, 
			millis || 0
		);
		return update();
	}
	that.clear_time = Sparks.strip_args(that.set_time);

	that.weekend = function weekend() {
		return that.day % 7 === 0 || that.day % 7 === 6;
	}

	that.clone = function clone() {
		return Sparks.date(new Date(date));
	}

	that.epoch_delta = function epoch_delta() {
		var delta = {};
		delta.millisecond = that.epoch;
		delta.second = that.epoch / 1000;
		delta.minute = Math.floor(delta.second / 60);
		delta.hour = Math.floor(delta.minute / 60);
		delta.date = Math.floor(delta.hour / 24);
		delta.week = Math.floor(delta.date / 7);
		delta.year = Math.abs(date.year - Sparks.epoch.year);
		delta.month = (delta.year * 12) + (that.month - Sparks.epoch.month);
	}

	that.subtract = function substract(other) {
		other = Sparks.date(other);
		var time = that.epoch - other.epoch;
		var delta = {};
		delta.millisecond = time % 1000;
		time = Math.floor(time / 1000);
		delta.second = time % 60;
		time = Math.floor(time / 60);
		delta.minute = time % 60;
		time = Math.floor(time / 60);
		delta.hour = time % 24;
		time = Math.floor(time / 24);
		delta.date = time;
		return delta;
	}

	function update() {
		that[0] = that.year = date.getFullYear();
		that[1] = that.month = date.getMonth();
		that[2] = that.date = date.getDate();
		that[3] = that.hour = date.getHours();
		that[4] = that.minute = date.getMinutes();
		that[5] = that.second = date.getSeconds();
		that[6] = that.millisecond = date.getMilliseconds();
		that.day = date.getDay();
		that.meridiem = that.hour > 11 ? "PM" : "AM";
		that.epoch = date.getTime();
		return that;
	}

	function move(type, offset) {
		return set(type, that[type] + offset);
	}

	function floor(type, full) {
		if(full) {
			var pos = Sparks.find_value(Sparks.time_magnitudes, type);
			if(pos >= 0) {
				for( ; pos < Sparks.time_magnitudes.length; pos++) {
					floor(Sparks.time_magnitudes[pos]);
				}
				return that;
			}
		}
		switch(type) {
			case "year":
				return set("month", 0, 1);
			case "date":	
				return set(type, 1);
			default:
				return set(type, 0);
		}
	}

	function ceil(type, full) {
		if(full) {
			var pos = Sparks.find_value(Sparks.time_magnitudes, type);
			if(pos >= 0) {
				for( ; pos < Sparks.time_magnitudes.length; pos++) {
					ceil(Sparks.time_magnitudes[pos]);
				}
				return that;
			}
		}
		switch(type) {
			case "meridiem":
				return that.set_meridiem("PM");
			case "day":
				return that.set_day(Sparks.full_days.length - 1);
			case "year":
				return that.set_month(Sparks.full_months.length - 1, 31);
			case "month":
				return that.set_month(Sparks.full_months.length - 1);
			case "date":
				that.move_month(1);
				return that.set_date(0);
			case "hour":
				return that.set_hour(23);
			case "minute":
				return that.set_minute(59);
			case "second":
				return that.set_second(59);
			case "millisecond":
				return that.set_millisecond(999);
		}
	}

	function pretty_month() {
		return Sparks.proper_nounize(Sparks.full_months[that.month]);
	}

	function pretty_day() {
		return Sparks.proper_nounize(Sparks.full_days[that.day]);
	}

	function pretty_hour() {
		return (that.hour % 12) || 12;
	}

	function pretty_digit(digit) {
		return Sparks.pad(digit.toString(), 2, "left", "0");
	}

	that.pretty_date = function pretty_date(stop_magnitude) {
		switch(stop_magnitude) {
			case "day":
				return pretty_day();
			case "year":
				return that.year.toString();
			case "month": 
				return [pretty_month(), that.year].join(" ");
			default:
				return [pretty_day() + ",", pretty_month(), that.date + ",", that.year].join(" ");
		}
	}

	that.pretty_time = function pretty_time(stop_magnitude) {
		switch(stop_magnitude) {
			case "meridiem":
				return that.meridiem === "PM" ? "Evening" : "Morning";
			case "hour":
				return [pretty_hour(), that.meridiem].join(" ");
			case "minute": 
				return [[pretty_hour(),pretty_digit(that.minute)].join(":"), that.meridiem].join(" ");
			case "second": 
				return [
					[pretty_hour(),pretty_digit(that.minute), pretty_digit(that.second)].join(":"), 
					that.meridiem
				].join(" ");
			default:
				return [
					[pretty_hour(),
						pretty_digit(that.minute), 
						pretty_digit(that.second),
						Sparks.pad(that.millisecond, 3, "left", "0")
					].join(":"), 
					that.meridiem
				].join(" ");
		}
	}

	that.pretty = function pretty(stop_magnitude) {
		switch(stop_magnitude) {
			case "day":
			case "year":
			case "month":
			case "date":
				return that.pretty_date(stop_magnitude);
			case "meridiem":
				return [
					that.pretty_date(stop_magnitude),
					"in the",
					that.pretty_time(stop_magnitude).toLowerCase()
				].join(" ");	
			default:
				return that.pretty_date(stop_magnitude) + " at " + that.pretty_time(stop_magnitude);
		}
	}

	for(var i in Sparks.time_magnitudes) {
		var magnitude = Sparks.time_magnitudes[i];
		that["set_" + magnitude] = Sparks.obj_func(set, magnitude);
		that["move_" + magnitude] = Sparks.obj_func(move, magnitude);
		that["next_" + magnitude] = Sparks.obj_func(move, magnitude, 1);
		that["previous_" + magnitude] = Sparks.obj_func(move, magnitude, -1);
		that["ceil_" + magnitude] = Sparks.obj_func(ceil, magnitude);
		that["floor_" + magnitude] = Sparks.obj_func(floor, magnitude);
	}
	that.ceil_day = Sparks.obj_func(ceil, "day");
	that.floor_day = Sparks.obj_func(floor, "day");
	that.ceil_meridiem = Sparks.obj_func(ceil, "meridiem");
	that.floor_meridiem = Sparks.obj_func(floor, "meridiem");

	update();
	return that;
}

Sparks.full_days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
Sparks.short_days = ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"];

Sparks.full_months = [
	"january", "february", "march", 
	"april", "may", "june", "july", 
	"august", "september", "october", 
	"november", "december"
];	
Sparks.short_months = [
	"jan", "feb", "mar", 
	"apr", "may", "jun", "jul", 
	"aug", "sept", "oct", 
	"nov", "dec"
];	

Sparks.time_magnitudes = ["year", "month", "date", "hour", "minute", "second", "millisecond"];
