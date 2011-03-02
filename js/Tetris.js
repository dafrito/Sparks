Sparks.tetris = function tetris(options) {
	options = options || {};
	var that = {};
	Sparks.attach_presenter(that, options.presenter, "Tetris");

	var grid, live_piece;
	that.width = options.width || 10;
	that.height = options.height || 30;
	that.level = options.level || .1;

	that.presenter.set_processor("content", Sparks.working_or_child);
	that.presenter.add_post_processor(function content_pxr(out) {
		grid = [];
		grid.get_by_row = function get_by_row(row, cell) {
			return grid.get(cell, row);
		}
		grid.get = function get(x, y) {
			var row = grid[y];
			if(row)
				return row[x];
		}
		that.grid = grid;
		for(var row_num = 0; row_num < that.height; row_num++) {
			var row_element = Sparks.create_valid_child(out);
			out.appendChild(row_element);
			grid.push(Sparks.map(Sparks.range(0, that.width), function cell_builder(row_element, row_num, cell_num) {
				var element = Sparks.create_valid_child(row_element);
				var that = {
					element:element,
					clear:function clear() {
						delete that.owner;
						that.recolor("white");
					},
					claim:function claim(owner) {
						that.owner = owner;
						if(that.owner.color)
							that.recolor(that.owner.color || "white");
					}, 
					recolor:Sparks.obj_func(Sparks.set_style, element, "background"),
					down:Sparks.obj_func(grid.get_by_row, row_num + 1, cell_num),
					left:Sparks.obj_func(grid.get_by_row, row_num, cell_num - 1),
					right:Sparks.obj_func(grid.get_by_row, row_num, cell_num + 1)
				};
				row_element.appendChild(that.element);
				return that;
			}, row_element, row_num));
		}
	});

	function piece(color) {
		var that = {};
		that.color = color || Sparks.random_color();
		that.cells = [];
		that.move = function move(direction) {
			direction = direction || "down";
			var replaced_cells = Sparks.map_call(that.cells, direction);
			if(Sparks.every(replaced_cells, function test(cell) { return cell && (cell.owner === that || !cell.owner); })) {
				Sparks.map_call(that.cells, "clear");
				Sparks.map_call(that.cells = replaced_cells, "claim", that);
			} else if(direction === "down") {
				// Direction was down, so kill this piece.
				return false;
			}
			return true;
		}
		return that;
	}

	var key_loop = Sparks.delayed(.05, function key_loop_fxn() {
		Sparks.log("KeyLoop");
		if(that.direction && that.live_piece)
			that.live_piece.move(that.direction);
		delete that.direction;
		key_loop.start();
	});
	that.key_loop = key_loop;
	var play_loop = Sparks.delayed(that.level, function play_loop_fxn() {
		Sparks.log("PlayLoop");
		if(!that.live_piece) {
			// Make a new one.
			that.live_piece = piece(Sparks.random_color());
			that.live_piece.cells = [grid.get(Math.floor(that.width / 2),0)];
		}
		if(!that.live_piece.move("down"))
			delete that.live_piece;
		play_loop.start();
	});
	that.play_loop = play_loop;

	that.presenter.add_postdrawer(key_loop.start);
	that.presenter.add_postdrawer(play_loop.start);

	return that;
}
