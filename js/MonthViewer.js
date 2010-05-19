Sparks.month_viewer = function month_viewer(options) {
	options = options || {};
	var that = Sparks.dom_grid(options);

	that.width = 7;
	that.height = 6;

	that.select_range = function select_range(start, end) {
		var processor = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 2));
		start = Sparks.date(start);
		if(typeof end === "number")
			end = start.clone().move_date(end);
		end = Sparks.date(end);
		var sanitizers = Sparks.map(that.gridder.range(start, end), function(cell) {
			return processor(cell.content)
		});
		that.sanitizers.push.apply(that.sanitizers, sanitizers);
		return Sparks.exhauster(sanitizers);
	}

	that.set_date = function set_date(date) {
		if(arguments.length > 1) 
			date = Sparks.date.apply(null, arguments);
		date = Sparks.date(date || that.date);
		that.sanitize();
		date.clear_time();
		date.set_date(1);
		var month = date.month;
		date.floor_day();
		that.date = date;
		date = date.clone();
		var plotter = that.gridder.first();
		for(var i = 0; i < that.gridder.area; i++) {
			var elem = plotter.cell.content.object;
			Sparks.set_content(elem, date.date);
			var day_state = (date.day % 7 === 0) || (date.day % 7 === 6);
			var month_state;
			if(month > date.month) {
				month_state = "before_month";
			} else if(month < date.month) {
				month_state = "after_month";
			} else {
				month_state = "on_month";
			}
			Sparks.map_call(that.post_processors, elem, date, month_state);
			plotter.next();
			date.next_day();
		}
		
	}

	that.add_post_processor = Sparks.listener_adder(that.post_processors = [], true);

	that.sanitize = Sparks.exhauster(that.sanitizers = []);

	that.gridder.converter = function converter(point) {
		if(typeof point.x === "number")
			return point;
		if(point instanceof Date)
			point = Sparks.date(point);
		if(Sparks.is_date(point)) {
			var delta = point.subtract(that.date);
			return that.gridder.cells[delta.date];
		}
	}

	that.add_cell_processor(function(cell, point, row_status, offset) {
		Sparks.set_style(cell, "float", "left");
		if(row_status === "begin_row")
			Sparks.set_style(cell, "clear", "left");
	});

	that.presenter.add_postdrawer(Sparks.strip_args(that.set_date, options.date));

	return that;
}
