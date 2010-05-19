/* Line graph
options:
	domain - {start, end}
	range - {start, end}
	functions - 
*/
Sparks.line_graph = function line_graph(options) {
	var that = Sparks.widget("line_graph", options.presenter, options.operational);

	that.graphs = [];

	function construct_bounds(bounds) {
		if(typeof bounds === "number")
			bounds = [0, bounds];
		if(bounds instanceof Array)
			bounds = {start:bounds[0], end:bounds[1]};
		var bounds = {
			start:Math.min(bounds.start || 0, bounds.end),
			end:Math.max(bounds.start || 0, bounds.end),
			scale:bounds.scale || 1
		};
		bounds.magnitude = bounds.end - bounds.start;
		return bounds;
	}

	that.domain = construct_bounds(options.domain);
	that.range = construct_bounds(options.range);

	that.process_periodic = options.process_periodic || function process_periodic(periodic) {
		periodic.add_preprocessor(Sparks.Effects.staggered_preprocessor);
		periodic.next_operation = function next(pending) {
			return Math.min(Math.floor(Math.random() * pending.length), pending.length - 1);
		}
		periodic.framecount = 1;
		periodic.stagger = 1;
		periodic.duration = 10;
		periodic.split = 1;
	}

	that.add = function add(calculator) {
		var graph = {
			calculator:calculator, 
			calculated:[], 
			elements:[], 
			color:Sparks.random_color()
		};	
		var periodic = Sparks.effect.periodic();
		periodic.operator = function operator(op) {
			// The removal is done silently since we immediately re-add this element.
			if(Sparks.get_parent(op.child))
				op.child.parentNode.removeChild(op.child);
			op.parent.appendChild(op.child);
		}
		that.process_periodic(periodic);
		periodic.elements = [];
		for(var i = 0; i < that.gridder.width; i++) { 
			var value = calculator(that.domain.start + (i * that.domain.scale));
			graph.calculated.push(value);
			if(isNaN(value) || value < that.range.start)
				continue;
			if(value > that.range.end)
				value = that.range.end;
			var offset = Math.floor((100 * (that.range.end - value)) / that.range.magnitude);
			var column = that.gridder.get(i, 0).content;
			var child = Sparks.create_valid_child(column);
			Sparks.set_style(child, {
				position:"absolute", 
				width:"100%", 
				background:graph.color.blendedColor(MochiKit.Color.Color.whiteColor()).toHexString(),
				"border-top":".3em solid " + graph.color.toHexString(),
				top:offset + "%",
				height:(100 - offset) + "%",
				"z-index":that.graphs.length
			});	
			periodic.elements.push({parent:column, child:child});
			graph.elements.push(child);
		}
		periodic.play();
		var pos = that.graphs.push(graph) - 1;
		return function remover() {
			if(!that.graphs[pos])
				return;
			delete that.graphs[pos];
			Sparks.remove_element(graph.elements);
		}
	}

	that.presenter.set_default_processor("content", function line_graph_pxr(working) {
		return working || Sparks.create_valid_child();
	});

	that.gridder = Sparks.gridder();
	that.presenter.add_post_processor("content", function line_graph_pxr(out) {
		if(!that.domain.scale)
			that.gridder.width = 100;
		if(that.gridder.width)
			that.domain.scale = that.domain.magnitude / that.gridder.width;
		that.gridder.width = Math.floor(that.domain.magnitude / that.domain.scale);
		that.gridder.height = 1;

		Sparks.set_style(out, "width:30em; height:10em; border:1px solid #ccf;");

		that.gridder.create_cell = function create_cell(x, y, new_row) {
			var child = Sparks.create_valid_child(out);
			Sparks.set_style(child, {
				position:"relative",
				width:(100 / that.gridder.width) + "%",
				height:"100%", 
				float:"left"
			});
			MochiKit.DOM.appendChildNodes(out, child);
			return child;
		};

		that.gridder.construct();
	});

	return that;
}

