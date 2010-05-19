// Sparks.Effect

Sparks.add_initializer("Effect init", function effect_init() {
    Sparks.set_event_action_preprocessor("play_effect",
		function play_effect_preprocessor(src, action, elements) {
			if(!elements)
				elements = src.elements;
			if(elements !== src.elements)
				return;
			if(typeof src.elements === "string") {
				src.elements = MochiKit.DOM.getElement(src.elements) || Sparks.fetch(src.elements);
				assert(src.elements, "Sparks.Effect.init: src.elements is falsy.");
			}
			src.elements = Sparks.coerce_array(src.elements);
			if(src.elements_preprocessor)
				src.elements = src.elements_preprocessor(src.elements) || src.elements;
			return [src, action, src.elements];
		}
    );
});

Sparks.is_effect = Sparks.izzer("Effect");

Sparks.effect = function effect(options, type) {
    options = options || {};
    var that = Sparks.event_source(type || "Effect");

    that.framecount = options.framecount || Sparks.Effects.framecount;
    that.frozen = false;
    that.paused = false;
    that.position = options.position || 0;
    that.duration = options.duration || 5;
	that.add_effect = Sparks.object_adder(that.effects = options.effects || [], true);
    that.effects = Sparks.coerce_array(that.effects);
	that.add_element = Sparks.object_adder(that.elements = options.elements || [], true);
    that.elements = Sparks.coerce_array(that.elements);
    that.values = Sparks.coerce_array("values" in options ? options.values : []);
	that.add_preprocessor = Sparks.listener_adder(
		that.preprocessors = options.preprocessors || [], true
	);
	that.add_initializer = Sparks.listener_adder(that.initializers = [], true);
	that.initialized = false;

	that.elements_preprocessor = options.elements_preprocessor;

	Sparks.add_event_authorizer(that, Sparks.event_descendents("effect_action"),
		function effect_authorizer(src, action) {
			if(!that.running_deferred && action !== "play_effect") {
				debugger;
				return false;
			}
			switch(action) {
				case "pause_effect":
				case "freeze_effect":
					return !!that.iteration.started && !that.paused && !that.frozen;
				case "unfreeze_effect":
					return that.frozen;
				case "play_effect":
					if((that.iteration && that.iteration.started) || that.frozen) {
						debugger;
						return false;
					}
					return Sparks.Effects.is_lockable(that.get_elements());
				case "undo_effect":
					return that.iteration.started && !that.cancelled;
				case "stop_undo_effect":	
					return that.cancelled;
			}
		}
	);

	Sparks.add_event_listener(that, Sparks.event_descendents("effect_action"),
		function effect_listener(src, action, dirty) {
			switch(action) {
				case "freeze_effect":
					that.iteration.stop();
					that.frozen = true;
					return;
				case "unfreeze_effect":
					that.frozen = false;
					that.iteration.start();
					return;
				case "stop_undo_effect":
				case "undo_effect":
					that.cancelled = action === "undo_effect";
					return;
				case "pause_effect":
					that.paused = true;
					that.iteration.stop();
					Sparks.Effects.unlock_elements(that.get_elements());
					return;
				case "rush_effect":
					that.iteration.stop();
					that.position = that.cancelled ? 0 : 1;
					that.iteration.force();
					return;
				case "cancel_effect":
					that.cancelled = true;
					that.iteration.stop();
					that.position = 0;
					that.iteration.force();
					return;
				case "finish_effect":
					that.iteration.stop();
					Sparks.Effects.unlock_elements(that.get_elements());
					if(!that.running_deferred.fired) {
						that.running_deferred[dirty ? "errback" : "callback"]();
					}
					that.initialized = that.cancelled = that.paused = that.frozen = false;
					that.running_deferred = undefined;
					that.position = 0;
			}
		}
	);	


    Sparks.add_event_listener(that, "play_effect", 
		function play_effect_listener(src, action, elements, is_child) {
			that.paused = false;
			Sparks.Effects.lock_elements(that, that.get_elements());
			if(!that.running_deferred) {
				that.running_deferred = Sparks.deferred();
				that.initialize(elements);
			}
			for(var i in that.effects) {
				var effect = that.effects[i];
				// Use child elements if available.
				Sparks.signal_event(
					effect, "play_effect", effect.elements.length ? effect.elements : elements, true
				);
			}
			if(!is_child)
				that.iteration = Sparks.delayed(1 / that.framecount, that.iterate).start();
		}
	);

	that.reverse = function reverse() {
		if(that.running_deferred)
			return Sparks.push_event(that, "undo_effect");
		reversed_detacher = that.add_initializer(function reverser() {
			that.position = 1;
			that.cancelled = true;
		});
		that.add_initializer(reversed_detacher);
        return Sparks.push_event(that, "play_effect", that.elements);
	}

    that.play = function play() {
		if(that.running_deferred && !that.cancelled)
			return that.running_deferred;
        var returning = Sparks.deferred();
        var play = Sparks.push_event(that, "play_effect", that.elements);
        play.add_listener(function play_listener() {
			var detacher = Sparks.add_event_listener(that, "finish_effect", 
				function finish_effect_listener(src, action, dirty) {
					remover && remover();
					remover = undefined;
					if(!returning.fired)
						returning[dirty ? "errback" : "callback"]();
					detacher();
				}
			);
			var remover = returning.add_catcher(Sparks.signal_event, that, "cancel_effect");
        });
        play.forward_to(returning, "errback");
        return returning;
    }

	that.wait = function wait(deferred) {
		Sparks.push_event(that, "pause_effect").add_listener(deferred.add_listener, that.play);
	}

	that.do_effect = function do_effect(elem, keyframe, offset) {
		// Overload me.
		//Sparks.log("Sparks.Effects.do_effect", keyframe);
	}

	that.get_weight = function get_weight(a, b) {
		// Overload me if necessary.
		return Sparks.Effects.distance(a, b);
	}

    that.get_elements = function get_elements() {
		var elements = that.elements ? that.elements.slice() : [];
		for(var i in that.effects)
			elements = elements.concat(that.effects[i].get_elements());
		return elements;
	}

	that.get_keyframe = function get_keyframe(position) {
		if(!that.weights || !that.weights.length)
			return {position:position};
		for(var i = 0; i < that.weights.length - 1; i++) {
			var weight = that.weights[i];
			var next = that.weights[i + 1];
			if(position > next)
				continue;
			position = (position - weight) / (next - weight);
			if(position < 0)
				position = 1 - position;
			return {position:position, start:that.values[i], end:that.values[i + 1]};
		}
		weight = that.weights[i];
		position = (position - weight) / (1 - weight);
		if(position < 0)
			position = 1 - position;
		return {position:position,
			start:that.values[that.values.length - 2],
			end:that.values[that.values.length - 1]
		};
	}

	that.iterate = function iterate() {
		if(that.paused || that.frozen)
			return;
		that.position = Sparks.enforce_range(that.position);
		that.run_effect(that.position, that.elements);
		if(that.position === 1 - (that.cancelled ? 1 : 0)) {
			Sparks.signal_event(that, "finish_effect", that.cancelled);
		} else {
			var delta = that.iteration.delta() / (1000 * that.duration);
			that.position += delta * (that.cancelled ? -1 : 1);
			that.iteration.start();
		}
	}

	that.run_effect = function run_effect(position, elements) {
		elements = elements || that.elements;
		//!elements.length && Sparks.log("No elements for effect.");
		for(var i in elements)
			that.run_on_element(elements[i], position, +i, elements);
		for(var i in that.independent_effects)
			that.independent_effects[i].run_effect(position);
	}

	that.run_on_element = function run_on_element(elem, position, offset, elements) {
		position = preprocess_position(position, offset, elem, elements);
		var keyframe = that.get_keyframe(position);
		if(keyframe.start !== undefined) {
			keyframe.interpolated = Sparks.Effects.interpolate(
				keyframe.start, keyframe.end, keyframe.position
			);
		} else
			keyframe.interpolated = keyframe.position;
		that.do_effect(elem, keyframe, offset);
		for(var i in that.inheriting_effects)
			that.inheriting_effects[i].run_on_element(elem, position, offset);
	}


	function categorize_effects() {
		that.independent_effects = [];
		that.inheriting_effects = [];
		for(var i in that.effects) {
			var effect = that.effects[i];
			if(!effect.elements.length)
				that.inheriting_effects.push(effect);
			else
				that.independent_effects.push(effect);
		}
	}
	that.add_initializer(categorize_effects);

	that.initialize = function initialize(elements) {
		elements = (that.elements && that.elements.length) ? that.elements : elements;
		for(var i in that.initializers)
			that.initializers[i](elements);
		// Calculate weights
		that.weights = [];
		var total_weight = 0;
		for(var i = 0; i < that.values.length; i++) {
			if(i === that.values.length - 1)
				break;
			that.weights.push(that.get_weight(that.values[i], that.values[i+1]));
			total_weight += that.weights[i];
		}
		var adjusted_weights = [];
		for(var i in that.weights)
			adjusted_weights[i] = that.weights[i] / total_weight;
		for(var i = 0; i < that.weights.length; i++)
			that.weights[i] = i === 0 ? 0 : adjusted_weights[i-1] + that.weights[i-1];
		// Send to child effects.
		for(var i in that.effects)
			that.effects[i].initialize(elements);
	}

	function preprocess_position(position, offset, element, elements) {
		for(var i in that.preprocessors) {
			position = that.preprocessors[i](
				Sparks.enforce_range(position), offset, element, elements, that
			);
		}
		return Sparks.enforce_range(position);
	}

	return that;
}
