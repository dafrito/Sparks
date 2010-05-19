
// Opacity

Sparks.effect.opacity = function opacity(options) {
	options = options || {};
	var that = Sparks.effect(options, "OpacityEffect");

	that.add_initializer(function opacity_init(elements) {
		for(var i in elements) {
			var elem = elements[i];
			if (i == 0 && that.values.length === 1) {
				var opacity = Sparks.get_style(elem, "opacity");
				that.values.unshift(typeof opacity !== "" ? parseFloat(opacity) : 1);
			}
		}
	});

	that.do_effect = function(elem, keyframe, offset) {
		Sparks.set_style(elem, "opacity", keyframe.interpolated);
	}

	return that;
}

Sparks.effect.style = function style(options) {
	options = options || {};
	var that = Sparks.effect(options, "StyleEffect");

	that.style = options.style || "color";

	that.add_initializer(function style_init(elements) {
		for(var i in elements) {
			var elem = elements[i];
			if(i == 0)
				var style = Sparks.get_style(elem, that.style);
			if (i == 0 && that.values.length === 1)
				style && that.values.unshift(style);
		}
		if(!that.suffix) {
			if(that.style.match(/width|height|size|border/) && !that.style.match(/color/)) {
				if(style)
					that.suffix = that.suffix || style.match(/(?:\d*|\.*|\s*)(.*)\s*$/)[1];
				that.suffix = that.suffix || "em";
			} else if(that.style.match(/color/)) {
				for(var i in that.values) {
					that.values[i] = Sparks.color(that.values[i]);
				}
			}
		}
	});

	that.do_effect = function(elem, keyframe, offset) {
		Sparks.set_style(elem, that.style, keyframe.interpolated + 
			(typeof keyframe.interpolated === "string" ?  "" : (that.suffix || ""))
		);
	}

	return that;
}

Sparks.effect.periodic = function periodic(options) {
	options = options || {};
	var that = Sparks.effect(options, "PeriodicEffect");

	that.operator = options.operator;
	that.unoperator = options.unoperator;

	that.next_operation = options.next_operation || function next_operation(pending) {
		return 0;
	}

	that.elements_preprocessor = function elements_preprocessor(elements) {
		that.split = that.split || 1;
		if(elements && that.split)
			elements = Sparks.partition_array(elements, that.split);
		for(var i in elements) {
			elements[i] = {
				elements:elements[i],
				pending:elements[i], 
				finished:[], 
				total:elements[i].length
			};
		}
		return elements;
	};

	that.add_initializer(function init(elements) {
		that.unoperator = that.unoperator || that.operator;
	});

	Sparks.add_event_listener(that, "finish_effect", function periodic_finisher() {
		if(!that.elements)
			return;
		for(var i in that.elements)
			that.elements[i] = that.elements[i].elements;
	});

	that.do_effect = function(operation, keyframe, offset) {
		var completed = Math.floor(keyframe.interpolated * operation.total);
		while(operation.finished.length < completed) {
			var op = operation.pending.splice(that.next_operation(operation.pending), 1)[0];
			that.operator(op);
			operation.finished.push(op);
		}
		while(operation.finished.length > completed) {
			var op = operation.finished.pop();
			that.unoperator(op);
			operation.pending.splice(that.next_operation(operation.pending), 0, op);
		}
	}

	return that;
}

/* Movement */

Sparks.effect.move = function(options) { 
	var that = Sparks.effect(options, "MovementEffect");

	Sparks.add_event_authorizer(that, "play_effect", 
		function movement_play_authorizer(src, action, elements) {
			if(!that.relative_values) {
				// No previous relatives, so our values is our relatives.
				that.relative_values = that.values.slice();
			}
			that.values = [];
			that.offsets = [];
			for(var i in elements) {
				var elem = elements[i];
				MochiKit.DOM.makePositioned(elem);
				var coord = new MochiKit.Style.Coordinates(
					parseFloat(Sparks.get_style(elem, 'left') || '0'),
					parseFloat(Sparks.get_style(elem, 'top') || '0')
				);
				if(i == 0) {
					// Add the original coordinate.
					that.values[0] = coord;
				}
				that.offsets[i] = Sparks.Effects.delta(that.values[0], coord);
			}
			for(var i=0;i<that.relative_values.length;i++) {
				if(i === 0)
					continue;
				that.values[i] = Sparks.Effects.add(that.values[i-1], that.relative_values[i]); 
			}
			Sparks.log("Sparks.Effects.Move.prestart: Finished.", {values:that.values});
		}
	);

	that.do_effect = function(elem, pos, from, to, offset) {
		if(typeof from === "undefined") {
			var loc = pos;
		} else {
			var loc = Sparks.Effects.interpolate(from, to, pos);
		}
		loc = Sparks.Effects.add(loc, that.offsets[offset]);
		Sparks.set_style(elem, {left:loc.x+"px", top:loc.y+"px"});
    }

	return that;
}
