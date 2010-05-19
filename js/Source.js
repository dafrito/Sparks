/* Sparks 2.0 */

// Event Hierarchy, used for event propagation and degradation.
Sparks.add_initializer("Event Hierarchy", function() {
	Sparks.event_hierarchy = Sparks.tree(["signal", 
		["action", 
			["update_list", "add_item", "remove_item", "clear_items"],
			["update_order", "move_item", "swap_item"],
			["update_tree", "add_node", "remove_node"],
			["update_dict", "set_item", "unset_item"],
			"switch_view",
			["field_action",
				"discard_field",
				"hide_field",
				"confirm_field"
			],	
			["widget_action",
				"click_button",
				"set_operational"
			],
			["effect_action",
				"finish_effect",
				"rush_effect",
				"cancel_effect",
				"play_effect",
				"pause_effect",
				"freeze_effect",
				"unfreeze_effect",
				"undo_effect",
				"stop_undo_effect"
			],
			["dom_action",
				"remove_element",
				"move_element"
			],
			["focus_action",
				"onfocus",
				"onblur"
			],	
			["mouse_action",
				["move_mouse",
					"onmouseover",
					"onmouseout"
				],
				["click_mouse",
					"onmousedown",
					"onmouseup"
				],
				"onmousemove",
				"onclick"
			],
			["key_action",
				["press_key",
					"onkeydown",
					"onkeyup"
				],
				"onkeypress"
			],
			"onscroll"
		]
	]);
});

//Sparks.elements = {};

Sparks.izzer = function izzer(type) {
	return function izzer(obj) {
		return !!obj && typeof obj === "object" && obj.type === type;
	}
}

Sparks.event_source = function(type) {
	var that = {};
	that.toString = Sparks.toString;
	that.type = type || "EventSource";
	that.id = Sparks.generate_id(that);
	that.__repr__ = Sparks.obj_func(Sparks.interpolate, that.type, {id:that.id});
	that.toString = Sparks.toString;
	that.lock = Sparks.deferred_lock();

	return that;
}

Sparks.is_event_source = function is_event_source(obj) {
	return obj && typeof obj === "object" && !!obj.id && Sparks.is_deferred_lock(obj.lock);
}

Sparks.Event = {}
Sparks.Event.process = function process(src, action) { 
	return Sparks.Event[action].apply(null, arguments); 
}
Sparks.Event.unproxied = function unproxied(src, action) { 
	return Sparks.Event.process.apply(null,
		Sparks.preprocess_event_args.apply(null, arguments)
	);	
}
Sparks.event_action_packets = {}

Sparks.mirror_event = function mirror_event(src, action, mirroring_or_processor) {
	return Sparks.add_event_listener(src, action, function(src, action) {
		var args = Sparks.get_args(arguments);
		if(typeof mirroring_or_processor === "function") {
			args.push(Sparks.obj_func(mirroring_or_processor, action));
		} else if(mirroring_or_processor) {
			args[0] = mirroring_or_processor;
		}
	});
}

Sparks.event_descendents = function event_descendents(action) {
	return Sparks.event_hierarchy.get(action).descendents(true).slice(1);
}

/* Action preprocessors take arguments before they're passed to handlers. They process
	those arguments so that they're in a proper form and return them. If they return nothing
	then the arguments are used as-is. */
Sparks.set_event_action_preprocessor = function set_event_action_preprocessor(action/*, ... */) {
	var packet = Sparks.event_action_packets[action];
	if(!packet)
		packet = Sparks.event_action_packets[action] = {};
	packet.preprocessor = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
}

/* attacher(src, action). Should begin emitting events of action from that src.
	The attacher should return a function to detach the passed object. */
Sparks.set_event_action_attacher = function set_event_action_attacher(action/*, ... */) {
	var packet = Sparks.event_action_packets[action];
	if(!packet)
		packet = Sparks.event_action_packets[action] = {};
	packet.attacher = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
}

Sparks.preprocess_event_args = function preprocess_event_args(args) {
	if(arguments.length === 1)
		var args = arguments[0];
	else 
		var args = Sparks.get_args(arguments);
	var packet = Sparks.event_action_packets[args[1]];
	if(!packet || !packet.preprocessor)
		return args;
	var processed = packet.preprocessor.apply(null, args);
	return processed ? processed.concat(args.slice(processed.length)) : args;
}

Sparks.get_current_event = function get_current_event(src) {
	if(!src._spark_event)
		return;
	return src._spark_event.current_event;	
}

Sparks.add_event_listener = Sparks.obj_func(Sparks, "add_event_handlers", "listeners")
Sparks.add_event_catcher = Sparks.obj_func(Sparks, "add_event_handlers", "catchers")
Sparks.add_event_authorizer = Sparks.obj_func(Sparks, "add_event_handlers", "authorizers")

/* Authorize an event, call authorizers if successful, call catchers if not. 
   Return a deferred with the result of authorization once all other handlers 
   have exec'd. */
Sparks.push_event = function push_event(src, action/*, ... */) {
	var args = Sparks.preprocess_event_args(Sparks.get_args(arguments));
	if(src.proxied === false)
		return Sparks.Event.unproxied.apply(null, arguments);
	var spark_event = src._spark_event;
	if(!spark_event)
		return Sparks.deferred(true);
	var monitor = Sparks.deferred();
	if(Sparks.debug) {
		monitor.add_listener(function timer(starter) {
			Sparks.log("Event dispatched. (type:'pushed', id:%d, action:%d, duration:%d milliseconds)",
				src.id, action, (new Date()).getTime() - starter.getTime()
			);
		}, new Date());
		monitor.add_catcher(function timer(starter) {
			Sparks.log("Event failed. (type 'pushed', id:%d, action:%d, duration:%d milliseconds)",
				src.id, action, (new Date()).getTime() - starter.getTime()
			);
		}, new Date());
	}
	spark_event.lock.acquire().add_listener(function lock_listener() {
		spark_event.current_event = monitor;
		if(monitor.fired)
			var authorization = Sparks.deferred(monitor.state === "callbacked");
		else 
			authorization = Sparks._authorize_event(args);
		authorization.add_listener(function authorization_listener() {
			Sparks._pass_to_handlers(["listeners"].concat(args));
			monitor.callback();
		});
		authorization.add_catcher(function authorization_catcher(errors) {
			Sparks._pass_to_handlers(["catchers", src, action, errors, args.slice(2)]);
			monitor.errback(errors);
		});
		authorization.add_finalizer(spark_event.lock.release);
	});
	return monitor;
}

Sparks.authorize_event = function authorize_event(src, action/*, ... */) {
	var args = Sparks.get_args(arguments);
	var spark_event = src._spark_event;
	if(!spark_event)
		return Sparks.deferred(true);
	var returning = Sparks.deferred();
	var lock = spark_event.lock.acquire();
	lock.add_listener(function lock_listener() {
		args = Sparks.preprocess_event_args(args);
		Sparks._authorize_event(args).forward_to(returning);
		spark_event.lock.release();
	});
	return returning;
}

Sparks.signal_event = Sparks.obj_func(Sparks, "pass_to_handlers", "listeners")
Sparks.throw_event = Sparks.obj_func(Sparks, "pass_to_handlers", "catchers")

//*** You shouldn't have to directly use any functions beneath here.

Sparks.pass_to_handlers = function pass_to_handlers(type, src, action/*, ... */) {
	if(Sparks.debug)
		var starter = new Date();
	var args = [type].concat(Sparks.preprocess_event_args(Sparks.get_args(arguments, 1)));
	var spark_event = src._spark_event;
	if(!spark_event) {
		return Sparks.deferred(true);
	}
	var returning = spark_event.lock.acquire();
	returning.add_listener(function lock_listener() {
		spark_event.current_event = returning;
		Sparks._pass_to_handlers(args);
		spark_event.lock.release();
	});
	if(Sparks.debug) {
		returning.add_listener(function timer() {
			Sparks.log("Event dispatched. (type:%t, id:%d, action:%d, duration:%d milliseconds)",
				type, src.id, action, (new Date()).getTime() - starter.getTime()
			);
		});
	}
	return returning;
}

Sparks.add_event_handlers = function add_event_handlers(type, src, actions, handlers) {
	src = typeof src === "string" ? MochiKit.DOM.getElement(src) : src;
	if(src instanceof Array)
		return;
	if(arguments.length > 4 || !(handlers instanceof Array)) {
		return Sparks.add_event_handlers(type, src, actions, Sparks.coerce_array(
			Sparks.obj_func.apply(null, Sparks.get_args(arguments, 3))
		));
	}
	actions = Sparks.coerce_array(actions);
	//Sparks.log("Adding", handlers.length, "handler(s) for", actions.length, "action(s) to src:", src);
	var spark_event = src._spark_event = src._spark_event || {
		lock:Sparks.is_deferred_lock(src.lock) ? src.lock : Sparks.deferred_lock()
	};
	var offsets = [];
	spark_event.pending_additions = spark_event.lock.acquire(spark_event.pending_additions);
	spark_event.pending_additions.add_listener(function lock_listener() {
		var type_registry = spark_event[type];
		if(!type_registry)
			type_registry = spark_event[type] = {};
		for(var i in actions) {
			var action = actions[i];
			var registry = type_registry[action];
			if (!registry)
				registry = type_registry[action] = [];
			offsets.push(registry.length);
			if(Sparks.event_action_packets[action] && 
				Sparks.event_action_packets[action].attacher) {
				if(!spark_event.attachments)
					spark_event.attachments = {};
				if(!spark_event.attachments[action]) {
					spark_event.attachments[action] = {
						count:handlers.length,
						detacher:Sparks.event_action_packets[action].attacher(src, action)
					};
				} else {
					spark_event.attachments[action].count += handlers.length;
				}
			}
			// Add all our handlers.
			registry.push.apply(registry, handlers);
		}
		spark_event.lock.soft_release(function releaser(lock) {
			/*Sparks.log_joined("Releasing soft lock at addition", 
				spark_event.pending_additions, src
			);*/
			assert(!!spark_event.pending_additions, "Addition Bogus?");
			//spark_event.pending_additions = undefined;
			lock.release();
		});
	});
	// Return the function to remove our handlers.
	var fired = false;
	return function remove_handlers() {
		if(fired)
			return;
		fired = true;
		spark_event.pending_additions = spark_event.lock.acquire(spark_event.pending_additions);
		spark_event.pending_additions.add_listener(function lock_listener() {
			/*Sparks.log("Removing %d handler(s) from %d action(s) for src(%d)",
				handlers.length, actions.length, src
			);*/
			for(var j in actions) {
				var action = actions[j];
				var registry = spark_event[type][action];
				for(var i = offsets[j]; i < offsets[j] + handlers.length; i++)
					delete registry[i];
				if(Sparks.event_action_packets[action] && 
					Sparks.event_action_packets[action].attacher) {
					/* Its potentially lazy, so decrement each of our handlers.
						If it's the last handlers, then detach our source. */
					spark_event.attachments[action].count -= handlers.length;
					if(!spark_event.attachments[action].count) {
						assert(spark_event.attachments[action].detacher, "No detacher available.");
						spark_event.attachments[action].detacher();
						spark_event.attachments[action] = undefined;
					}
				}
			}
			spark_event.lock.soft_release(function releaser(lock) {
				/*Sparks.log_joined("Releasing soft lock at removal", 
					spark_event.pending_additions, src
				);*/
				assert(!!spark_event.pending_additions, "Removal Bogus?");
				//spark_event.pending_additions = undefined;
				lock.release();
			});
		});
	};
}

Sparks._pass_to_handlers = function _pass_to_handlers(type, src, action/*, ... */) {
	if(arguments.length === 1) {
		var args = arguments[0];
		type = args[0];
		src = args[1];
		action = args[2];
	} else 
		var args = Sparks.get_args(arguments);
	args = args.slice(1);
	var spark_event = src._spark_event;
	if(!spark_event || !spark_event[type])
		return;
	var action_node = Sparks.event_hierarchy.get(action);
	var action_hierarchy = action_node ? action_node.ancestors(true) : [action];
	while(action_hierarchy.length) {
		action = action_hierarchy.shift();
		var registry = spark_event[type][action];
		if(!registry)
			continue;
		for(var i in registry) {
			//Sparks.log("Calling event handler for action", action);
			registry[i].apply(registry[i], args);
		}
	}
}

Sparks._authorize_event = function _authorize_event(src, action/*, ... */) {
	if(arguments.length === 1) {
		var args = arguments[0];
		src = args[0];
		action = args[1];
	} else 
		var args = Sparks.get_args(arguments);
	var spark_event = src._spark_event;
	if(!spark_event || !spark_event.authorizers || !spark_event.authorizers[action])
		return Sparks.deferred(true);
	var registry = spark_event.authorizers[action];
	return Sparks.gather_results({
		values:registry,
		coercer:function coercer(value) {
			return typeof value === "function" ? coercer(value.apply(null, args)) : value;
		},
		processor:function processor(value) {
			return value === true || value === undefined;
		}
	});
}
