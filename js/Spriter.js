Sparks.spriter = function spriter(options) {
	options = options || {};
	var that = {};
	that.toggles = [];

	that.create_row = options.create_row || function create_row(parent) {
		var row = Sparks.create_valid_child(parent);
		MochiKit.DOM.addElementClass(row, "spriter_row");
		return row;
	}

	that.create_cell = options.create_cell || function create_cell(row) {
		var cell = Sparks.create_valid_child(row);
		MochiKit.DOM.addElementClass(cell, "spriter_cell");
		return cell;
	}

	that.set_cell = options.set_cell || function set_cell(elem, value) {
		if(value) {
			MochiKit.DOM.addElementClass(elem, "sprite_cell_clicked");
		} else {
			MochiKit.DOM.removeElementClass(elem, "sprite_cell_clicked");
		}
	}

	that.rewrite = function rewrite() {
		var nums = [];
		for(var i in that.toggles) {
			var num = Sparks.map(that.toggles[i], function toggler(cell) {
				return cell ? 1 : 0;
			}).join("");
			num = ("0x" + parseInt(num, 2).toString(16)).toUpperCase();
			num = Sparks.pad(num, 4, "front", 0);
			nums.push(num);
		}
		var str = "[" + nums.join(", ") + "]";
		if(that.string_elem)
			that.string_elem.innerHTML = str;
		return str;
	}

	that.output = function output(parent) {
		that.parent = that.parent || MochiKit.DOM.getElement(parent);
		that.width = that.width || 16;
		that.height = that.height || 16;
		assert(that.width % 4 === 0, "It's not hexificatible!");
		var elems = [];
		MochiKit.DOM.appendChildNodes(
			that.parent, 
			that.string_elem = that.create_row(that.parent)
		);
		Sparks.add_event_listener(that.parent, "onmousedown", function(src, action, event) {
			if(event.button().middle)
				that.erasing = true;
			else if(event.button().left)
				that.drawing = true;
		});
		Sparks.add_event_listener(that.parent, "onmouseup", function(src, action, event) {
			if(event.button().middle)
				that.erasing = false;
			else if(event.button().left)
				that.drawing = false;
		});
		for(var i = 0; i < that.height; i++) {
			var row = that.create_row(that.parent);
			var toggle_row = [];
			for(var j = 0; j < that.width; j++) {
				var cell = that.create_cell(row);
				var wire_cell = function wire_cell(x, y, cell) {
					toggle_row.push(false);
					var draw_cell = function draw_cell() {
						if(that.toggles[y][x])
							return;
						that.toggles[y][x] = true;
						that.set_cell(cell, true);
						that.rewrite();
					}
					var erase_cell = function erase_cell() {
						if(!that.toggles[y][x])
							return;
						that.toggles[y][x] = false;
						that.set_cell(cell, false);
						that.rewrite();
					}
					var toggle_cell = function toggle_cell() {
						that.toggles[y][x] = !that.toggles[y][x];
						that.set_cell(cell, that.toggles[y][x]);
						that.rewrite();
					}
					Sparks.add_event_listener(cell, "onclick", toggle_cell);
					Sparks.add_event_listener(cell, "onmouseover", function() {
						if(that.drawing) {
							draw_cell();
						} else if(that.erasing) {
							erase_cell();
						}
					});
				};
				wire_cell(j, i, cell);
				MochiKit.DOM.appendChildNodes(row, cell);
			}
			that.toggles.push(toggle_row);
			MochiKit.DOM.appendChildNodes(parent, row);
		}
		that.rewrite();
		return that.parent;
	}

	that.parent = options.parent;
	if(that.parent)
		that.output();
	return that;
}
