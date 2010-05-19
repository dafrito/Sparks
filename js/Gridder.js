/* Plotter - navigates over a grid, notifies of changes
gridder - grid to use.
point - Coordinates to start at.
*/
Sparks.plotter = function plotter(gridder, point) {
	var that = {};

	that.toString = function toString() {
		if(that.cell)
			return Sparks.interpolate("Sparks.plotter", {x:that.cell.x, y:that.cell.y});
		return Sparks.interpolate("Sparks.plotter (no cell)");
	}

	that.add_listener = Sparks.listener_adder(that.listeners = [], true);

	that.get = function get(point) {
		if(point)
			that.cell = gridder.get(point) || that.cell;
		return that.cell;	
	}
	that.get(point);

	that.move = function move(direction) {
		var moved = that.cell[direction]();
		moved && Sparks.map_call(that.listeners, moved, that.cell = move);
		return that.cell = moved || that.cell;
	}

	that.left = Sparks.obj_func(that.move, "left");
	that.right = Sparks.obj_func(that.move, "right");
	that.up = Sparks.obj_func(that.move, "up");
	that.down = Sparks.obj_func(that.move, "down");

	that.next = Sparks.obj_func(that.move, "next");
	that.previous = Sparks.obj_func(that.move, "previous");

	return that;
}

/* Gridder
options:
	width - Number of cells per row of this grid.
	height - Number or rows for this grid.
	loop_style - String describing how out-of-bound coordinates are handled. Choices are:
		"book" - far right loops to far left of the next row.
		"donut" - vertical looping and horizontal looping
		"paddlewheel" - only vertical looping (Going off the top takes you to the bottom)
		"cup" - only horizontal looping (Going off the left takes you to the right)
		defaults to "none" - No looping allow. Out-of-bound coords return nothing.
	create_cell(x, y, new_row) - Called to make a new cell - this is used as content of the cell.
		new_row is a boolean indicating whethere this cell is at the start of a new row.
*/
Sparks.gridder = function gridder(options) {
	options = options || {};
	var that = {};

	that.loop_style = options.loop_style;
	that.width = options.width;
	that.height = options.height;

	that.items = that.cells = [];

	that.first = function first() {
		return Sparks.plotter(that, that.cells[0]);
	}

	that.create_cell = options.create_cell || function create_cell(point, new_row, offset) {
		return [point.x, point.y, new_row].join(", ");
	}

	that.range = function range(start, end) {
		var cells = [];
		var plotter = Sparks.plotter(that, that.converter(start) || start);
		end = that.converter(end) || end;
		while(plotter.cell.x !== end.x || plotter.cell.y !== end.y) {
			cells.push(plotter.cell);
			plotter.next();
		}
		return cells;
	}

	that.converter = Sparks.blind;

	that.get = function get(point) {
		if(arguments.length > 1)
			point = {x:arguments[0], y:arguments[1]};
		point = that.converter(point) || point;
		var x = point.x;
		var y = point.y;
		switch(that.loop_style) {
			case "book":
				return that.cells[Sparks.enforce_looping_range(
					point.y * that.width + point.x, that.area
				)];
			case "donut":
				x = Sparks.enforce_looping_range(x, that.width);
				y = Sparks.enforce_looping_range(y, that.height);
				break;
			case "horizontal":
			case "cup":
				if(y >= that.height || y < 0)
					return;
				x = Sparks.enforce_looping_range(x, that.width);
				break;
			case "vertical":
			case "paddlewheel":
				if(x >= that.width || x < 0)
					return;
				y = Sparks.enforce_looping_range(y, that.height);
				break;
			default:	
				if(x >= that.width || x < 0 ||
					y >= that.height || y < 0)
					return;
		}
		return that.cells[y * that.width + x];
	}

	function cell(x, y) {
		var neighbors = {};
		var cell = {x:x, y:y};
		cell.next = function next() {
			switch(that.loop_style) {
				case "vertical":
				case "paddlewheel":
					return cell.down();
				case "donut":
				case "book":
				case "horizontal":
				case "cup":
				default:	
					return cell.right();
			}
		}
		cell.previous = function previous() {
			switch(that.loop_style) {
				case "vertical":
				case "paddlewheel":
					return cell.up();
				case "donut":
				case "book":
				case "horizontal":
				case "cup":
				default:	
					return cell.left();
			}
		}
		var row_status = "";
		if(x % that.width === 0)
			row_status = "begin_row";
		else if(x % that.width === that.width - 1)
			row_status = "end_row";
		cell.content = that.create_cell(cell, row_status, that.width * y + x);
		cell.get_neighbor = function get_neighbor(neighbor, x, y) {
			if(typeof neighbors[neighbor] === "undefined")
				neighbors[neighbor] = that.get(x, y);
			return neighbors[neighbor];
		}
		cell.north = cell.up = Sparks.obj_func(cell.get_neighbor, "up", x, y - 1);
		cell.south = cell.down = Sparks.obj_func(cell.get_neighbor, "down", x, y + 1);
		cell.west = cell.left = Sparks.obj_func(cell.get_neighbor, "left", x - 1, y);
		cell.east = cell.right = Sparks.obj_func(cell.get_neighbor, "right", x + 1, y);
		cell.northwest = cell.upper_left = Sparks.obj_func(
			cell.get_neighbor, "upper_left", x - 1, y - 1
		);
		cell.southwest = cell.lower_left = Sparks.obj_func(
			cell.get_neighbor, "lower_left", x - 1, y + 1
		);
		cell.northeast = cell.upper_right = Sparks.obj_func(
			cell.get_neighbor, "upper_right", x + 1, y - 1
		);
		cell.southeast = cell.lower_right = Sparks.obj_func(
			cell.get_neighbor, "lower_right", x + 1, y + 1
		);
		cell.cardinals = function cardinals() {
			return [cell.up(), cell.right(), cell.down(), cell.left()];
		}
		cell.diagonals = function diagonals() {
			return [cell.upper_right(), cell.lower_right(), cell.lower_left(), cell.upper_left()];
		}
		cell.neighbors = function neighbors() {
			return [cell.up(), cell.upper_right(), cell.right(), cell.lower_right(), 
				cell.down(), cell.lower_left(), cell.left(), cell.upper_left()];
		}
		return cell;
	}

	that.construct = function construct() {
		that.area = that.width * that.height;
		that.loop_style = that.loop_style || "book";
		that.width = that.width || 2;
		that.height = that.height || 4;
		for(var i = 0; i < that.area; i++) {
			that.cells.push(cell(
				Math.floor(i % that.width),
				Math.floor(i / that.width)
			));
		}
	}

	return that;
}
