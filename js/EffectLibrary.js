// Sparks.Effects

Sparks.style_animation = function style_animation(style) {
	style = Sparks.parse_css(style);
	var master = Sparks.effect();
	for(var i in style)
		master.effects.push(Sparks.effect.style({style:i, values:style[i]}));
	return master;
}

Sparks.Effects = {
	lock:Sparks.deferred_lock(),
	locked:[],
	// X frames per second
	framecount:20,

	/* Some simple Coordinate stuff */

	midpoint:function midpoint(a, b) {
		return Sparks.Effects.interpolate(a, b, .5);
	},

	interpolate:function interpolate(a, b, pos) {
		var ref = a;
		a = Sparks.Effects.get_basic_point(a);
		b = Sparks.Effects.get_basic_point(b);
		var interpolated = [];
		for(var i in a) {
			interpolated.push(a[i] + ((b[i] - a[i]) * pos));
		}
		return Sparks.Effects.convert_basic_point(ref, interpolated);
	},

	delta:function delta(a, b) {
		var ref = a;
		a = Sparks.Effects.get_basic_point(a);
		b = Sparks.Effects.get_basic_point(b);
		var delta = [];
		for(var i in a) {
			delta.push(b[i] - a[i]);
		}
		return Sparks.Effects.convert_basic_point(ref, delta);
	},

	add:function add(a, b) {
		var ref = a;
		a = Sparks.Effects.get_basic_point(a);
		b = Sparks.Effects.get_basic_point(b);
		var summed = [];
		for(var i in a) {
			summed.push(b[i] + a[i]);
		}
		return Sparks.Effects.convert_basic_point(ref, summed);
	},

	distance:function distance(a, b) {
		var ref = a;
		a = Sparks.Effects.get_basic_point(a);
		b = Sparks.Effects.get_basic_point(b);
		assert(a.length === b.length, "Sparks.Effects.distance: Points are not comparable.",
			{a:a, b:b}
		);	
		var distance = 0;
		for(var i in a) {
			distance += Math.pow(b[i] - a[i], 2);
		}
		return Math.sqrt(distance);
	},

	/* Easy way for us not to have to write the above
		for arrays, Coordinates, and Dimensions. */

	get_basic_point:function get_basic_point(point) {
		if(point instanceof Array)
			return point;
		if(typeof point === "string")
			return [parseFloat(point.match(/^\s*(\d*(?:\.\d+)?)[a-zA-Z%]+\s*$/)[1], 10)];
		if(typeof point === "number" || !isNaN(parseFloat(point)))
			return [parseFloat(point)];
		if(point instanceof MochiKit.Style.Coordinates)
			return [point.x, point.y];
		if(point instanceof MochiKit.Style.Dimensions)
			return [point.w, point.h];
		if(point instanceof MochiKit.Color.Color)
			return [point.rgb.r, point.rgb.g, point.rgb.b];
		if(typeof point === "number")
			return [point];
	},

	convert_basic_point:function convert_basic_point(reference, point) {
		if(reference instanceof Array)
			return point;
		if(reference === 'number' || typeof reference === 'number')
			return point[0];
		if(reference === "box" || reference instanceof MochiKit.Style.Dimensions)
			return new MochiKit.Style.Dimensions(point[0], point[1]);
		if(reference === "point" || reference instanceof MochiKit.Style.Coordinates)
			return new MochiKit.Style.Coordinates(point[0], point[1]);
		if(reference === "color" || reference instanceof MochiKit.Color.Color)
			return MochiKit.Color.Color.fromRGB(point[0], point[1], point[2]);
		if(reference === "number" || typeof reference === "number")
			return point;
		return point + reference.match(/([a-zA-Z%]+)\s*$/)[1];
	},

	/* Preprocessors can be chained endlessly, nested, whatever.
		Take a look at how Effects work to see a clear picture of
		their intended use. 
	*/

	/* For each element, stagger it. 
		A stagger of 0 means that every element's position occurs one after the other.
		(First one gets to 1, second to 1, third to 1)

		Intermediate values (0 to 1) mean there's overlap.

		A stagger of 1 means they every element is synced.
	*/
	staggered_preprocessor:function staggered_preprocessor(pos, offset, element, elements, effect) {
		/*Sparks.log("Sparks.Effects.staggered_preprocessor",
			{pos:pos, offset:offset, elem:element}
		);	*/
		if(typeof effect.stagger === "undefined")
			effect.stagger = 1;
		if(pos === 1)
			return 1;
		return pos * (1 + ((elements.length - 1) * effect.stagger)) - (offset * effect.stagger);
	},

	// TODO: Remember how this one looks.
	sinoidal_preprocessor:function sinoidal_preprocessor(pos, offset, element) {
		return .5 + Math.sin(2 * pos * Math.PI) / 2;
	},

	foo_preprocessor:function foo_preprocessor(pos) {
		return Sparks.Effects.tangent_preprocessor(pos);
	},

	curved_preprocessor:function curved_preprocessor(pos, offset, element) {
		return (-Math.cos(pos*Math.PI)/2) + .5;
	},

	tangent_preprocessor:function tangent_preprocessor(pos, offset, element) {
		return (Math.tan(pos * (Math.PI / 2) - (Math.PI / 4)) / 2) + .5;
	},

	reverse_preprocessor:function reverse_preprocessor(pos, offset, element) {
		return 1 - pos;
	},

	flicker_preprocessor:function flicker_preprocessor(pos, offset, element) {
		return ((-Math.cos(pos*Math.PI)/4) + 0.75) + Math.random()/4;
	},

	wobble_preprocessor:function wobble_preprocessor(pos, offset, element) {
		return (-Math.cos(pos*Math.PI*(9*pos))/2) + 0.5;
	},

	pulse_preprocessor:function pulse_preprocessor(pos, offset, element) {
		return (Math.floor(pos*10) % 2 === 0 ?
			(pos*10 - Math.floor(pos*10)) : 1 - (pos*10 - Math.floor(pos*10)));
	},

	zero_preprocessor:function zero_preprocessor(pos, offset, element) {
		return 0;
	},

	full_preprocessor:function full_preprocessor(pos, offset, element) {
		return 1;
	},

	linear_pulse_preprocessor:function linear_pulse_preprocessor(pos, offset, element) {
		return Math.abs((2*pos - 1));
	},

	is_lockable:function is_lockable(elements) {
		var returning = Sparks.deferred();
		Sparks.Effects.lock.acquire().add_listener(function lock_listener() {
			var unlocks = [];
			for(var j in elements) {
				var element = elements[j];
				for(var i in Sparks.Effects.locked) {
					var locked = Sparks.Effects.locked[i];
					if(locked.element === element)
						unlocks.push(Sparks.push_event(locked.effect, "cancel_effect"));
				}
			}
			Sparks.gather_results(unlocks).forward_to(returning);
			Sparks.Effects.lock.release();
		});
		return returning;
	},

	lock_elements:function lock_elements(effect, elements) {
		elements = Sparks.coerce_array(elements);
		for(var i in elements)
			Sparks.Effects.locked.push({element:elements[i], effect:effect});
	},

	unlock_elements:function unlock_elements(elements) {
		elements = Sparks.coerce_array(elements);
		for(var i in elements) {
			var element = elements[i];
			for(var j in Sparks.Effects.locked) {
				var locked = Sparks.Effects.locked[j];
				if(locked.element === element)
					return delete Sparks.Effects.locked[j];
			}
		}
	}
	
}
