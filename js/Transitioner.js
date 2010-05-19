Sparks.is_transitioner = Sparks.izzer("Transitioner");
Sparks.transitioner = function transitioner(element) {
	var that = {type:"Transitioner"};
	that.element = element && MochiKit.DOM.getElement(element);
	that.state = "cancel";
	that.playing = undefined;
	that.effects = [];

	that.add_listener = Sparks.listener_adder(that.listeners = [], true);
	that.add_transition = Sparks.listener_adder(that.transitions = [], true);
	that.add_untransition = Sparks.listener_adder(that.untransitions = [], true);
	that.add_remover = Sparks.listener_adder(that.removers = [], true);
	that.add_effect = function add_effect(effect) {
		var pos = that.effects.push(effect) - 1;
		return function detacher() {
			that.effects.splice(pos, 1);
			if(effect.running_deferred && !effect.running_deferred.fired)
				Sparks.push_event(effect, "cancel_effect");
			return effect;
		}
	}	

	function fire_listeners(name) {
		Sparks.fire_reversibles(
			name === "play" ? that.listeners : that.removers,
			name === "play" ? that.removers : that.listeners,
			that.element
		);	
	}

	function transition(name) {
		Sparks.fire_reversibles(
			name === "finish" ? that.transitions : that.untransitions,
			name === "finish" ? that.untransitions : that.transitions,
			that.element
		);
	}

	function do_effect(action) {
		return Sparks.map(that.effects, function(effect) {
			if(!effect.elements.length)
				effect.elements = [that.element];
			if(action === "play_effect" || !effect.running_deferred || !effect.running_deferred.fired)
				return Sparks.push_event(effect, action);
		});
	}

	function make_playing(deferred) {
		Sparks.add_listener(deferred, function() {
			that.playing = Sparks.gather_results(Sparks.map(that.effects, 
				MochiKit.Base.itemgetter("running_deferred"))
			);
			that.playing.add_listener(that.finish);
			that.playing && that.playing.add_catcher(that.cancel);
		});
		return deferred;
	}

	function rush(state) {
		that.state = state;
		var play = Sparks.gather_results(that.interrupt("play"));
		play.add_listener(function rush_callback() { 
			// Playing will already be fired if there's no effects (since empty
			// gather-results return true immediately.
			that.playing && !that.playing.fired && that.playing.callback(); 
		});
		return play;
	}

	function destroy_playing() {
		that.playing = undefined;
	}	

	that.interrupt = function interrupt(name, state) {
		state = typeof state === "string" ? state : that.state;
		Sparks.debug && Sparks.log("Sparks.transitioner.interrupt", {state:state, name:name});
		if(that.state === name)
			return;
		that.state = name;
		if(state === "play") {
			switch(name) {
				case "cancel":
					that.state = "play";
					that.interrupt("undo");
					return that.interrupt("cancel");
				case "undo":
					return do_effect("undo_effect");
				case "finish":
					do_effect("rush_effect");
					transition("finish");
					destroy_playing();
			}
		} else if(state === "finish") {
			switch(name) {
				case "undo":
					transition("undo");
					if(that.effects.length) {
						return make_playing(
							Sparks.gather_results(Sparks.map_call(that.effects, "reverse"))
						);	
					} else {
						that.cancel();
						return Sparks.succeed();
					}
				case "cancel":
					that.state = "finish";
					return that.interrupt("undo").add_listener(function() { 
						// Playing will already be fired if there's no effects (since empty
						// gather-results return true immediately.
						that.playing && !that.playing.fired && that.playing.errback(); 
					});
				default:
					that.state = "finish";
			}
		} else if(state === "undo") {
			switch(name) {
				case "play":
					return do_effect("stop_undo_effect");
				case "finish":
					return rush("undo");
				case "cancel":
					do_effect("cancel_effect");
					fire_listeners("cancel");
					destroy_playing();
			}
		} else if(state === "cancel") {
			switch(name) {
				case "play":
					fire_listeners("play");
					return make_playing(
						Sparks.gather_results(do_effect("play_effect"))
					);
				case "finish":
					return rush("cancel");
				default:
					that.state = "cancel";
			}
		}
	}

	that.play = function play() {
		that.interrupt("play");
		return that.undo;
	}
	that.cancel = function cancel() {
		that.interrupt("cancel");
		return that.finish;
	}	
	that.undo = function undo() {
		that.interrupt("undo");
		return that.play;
	}
	that.finish = function finish() {
		that.interrupt("finish");
		return that.finish;
	}

	return that;
}
