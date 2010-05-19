Sparks.box = function box(elem) {
	var that = {element:elem};

	that.flush = function flush() {
		position = dimensions = undefined;
	}

	var position;
	that.position = function position_fxn() {
		return position = position || MochiKit.Style.getElementPosition(elem);
	}
	var dimensions;
	that.dimensions = function dimensions_fxn() {
		return dimensions = dimensions || MochiKit.Style.getElementDimensions(elem);
	}

	that.width = function width() { return that.dimensions().w; }
	that.height = function height() { return that.dimensions().h; }

	that.upper_left = that.position;
	that.upper_right = function upper_right() { return {x:that.right(), y:that.top()}; }
	that.bottom_left = function bottom_left() { return {x:that.left(), y:that.bottom()}; }
	that.bottom_right = function bottom_right() { return {x:that.right(), y:that.bottom()}; }

	that.left = function() { return that.upper_left().x; }
	that.right = function() { return that.upper_left().x + that.width(); }
	that.top = function() { return that.upper_left().y; }
	that.bottom = function() { return that.upper_left().y + that.height(); }

	that.middle = function middle() {
		return Sparks.Effects.midpoint(that.upper_left(), that.bottom_right());
	}

	that.calculated = function calculated(x, y) {
		if(arguments.length === 1) {
			y = x.y;
			x = x.x;
		}
		return {
			x:that.left() + x * that.width(),
			y:that.top() + y * that.height()
		};
	}

	return that;
}
