Sparks.paged_range_viewer = function paged_range_viewer(options) {
	options = options || {};
	var that = Sparks.replacing_page_viewer();

	that.viewer = function viewer(out, items, key) {
		var range_viewer = Sparks.range_viewer(items);
		Sparks.map_call(that.preprocessors, range_viewer, items, key);
		range_viewer.output_to_placeholder(out);
	}

	that.add_saver(function scroll_saver(out) {
		var left = out.scrollLeft;
		var top = out.scrollTop;
		return function(out) {
			out.scrollLeft = left;
			out.scrollTop = top;
		}
	});

	that.add_preprocessor = Sparks.listener_adder(that.preprocessors = [], true);

	return that;
}

Sparks.scrolling_range_viewer = function scrolling_range_viewer(options) {
	options = options || {};
	var that = Sparks.range_viewer();

	that.lazy_range = Sparks.lazy_range();

	that.delayed = Sparks.delayed(options.delay || .5, function do_request() {
		that.lazy_range.fetch(that.request.start.value, that.request.end.value + 50);
	});

	that.presenter.add_predrawer(function predrawer() {
		that.delayed.delay = that.delay || that.delayed.delay;
	});

	that.scroll_listener = Sparks.scroll_listener();
	that.scroll_listener.add_listener(function scroll_listener(scroll) {
		that.request = that.dimension === "width" ? scroll.horizontal : scroll.vertical;
		that.delayed.restart();
	});
	that.lazy_range.add_listener(that.items.add_all);

	that.presenter.add_post_processor("container", that.scroll_listener.attach);
	that.presenter.add_postdrawer(function postdrawer(out) {
		that.request = {start:{value:0}, end:{value:that.viewable}};
		that.delayed.start();
	});

	return that;
}

/* DOM Grid
*/
Sparks.dom_grid = function dom_grid(options) {
	options = options || {};
	var that = Sparks.widget("DOMGrid", options.presenter, options.operational);

	that.gridder = Sparks.gridder(options);
	that.proxied = options.proxied;

	that.presenter.set_default_processor("content", function content_pxr(working) {
		return working || Sparks.create_valid_child();
	});

	that.presenter.add_post_processor("content", function context_post_pxr(out) {
		var working_row;
		that.gridder.width = that.gridder.width || that.width;
		that.gridder.height = that.gridder.height || that.height;
		that.gridder.loop_style = that.gridder.loop_style || that.loop_style;
		that.gridder.create_cell = function create_cell(point, row_status, offset) {
			if(row_status === "begin_row" && that.create_row) {
				working_row = that.create_row(out);
				Sparks.map_call(that.row_processors, working_row, point);
				MochiKit.DOM.appendChildNodes(out, working_row);
			}
			var cell = that.create_cell(working_row || out, point, row_status, offset);
			Sparks.map_call(that.cell_processors, cell, point, row_status, offset);
			MochiKit.DOM.appendChildNodes(working_row || out, cell);
			return Sparks.style_telescope({object:cell, proxied:that.proxied});
		}
		that.gridder.construct();
	});

	that.create_row = options.create_row;
	that.create_cell = options.create_cell || Sparks.create_valid_child;

	that.add_row_processor = Sparks.listener_adder(that.row_processors = [], true);
	that.add_cell_processor = Sparks.listener_adder(that.cell_processors = [], true);

	that.telescope = Sparks.telescope();

	that.add_style = function add_style(style) {
		var cells = Sparks.get_items(that.gridder);
		for(var i in cells)
			cells[i].content.add(style);
	}

	return that;
}

/* Element List filter
options:
	filtered
	items
	operational
	elements
	validators
*/
Sparks.filtered_list = function filtered_list(options) {
	options = options || {};
	var that = {};

	that.operational = false;
	var initialized = false;

	if(options.validators) {
		that.validators = Sparks.coerce_array(options.validators);
	} else {
		that.validators = [];
	}

	that.add_validator = function add_validator() {
		var pos = that.validators.push(Sparks.obj_func.apply(null, arguments));
		if(!that.operational)
			return;
		that.plumber.change_authorizer(that.filtered, authorizer);
		return function remover() {
			delete that.validators[pos];
			if(!that.operational)
				return;
			that.plumber.change_authorizer(that.filtered, authorizer);
		}
	}

	function initialize() {
		that.plumber = Sparks.plumber();
		that.items = that.items || Sparks.list();
		that.filtered = that.filtered || Sparks.list();
		that.elements.items = that.filtered;
		that.plumber.add_source(that.items);
		that.plumber.add_destination(that.filtered, authorizer);
		that.output = that.elements.output;
		initialized = true;
	}

	that.filtered = options.filtered;
	that.items = options.items;

	that.elements = options.elements || Sparks.element_list();

	function authorizer(item) {
		for(var i in that.validators) {
			if(!that.validators[i](item))
				return false;
		}
		return true;
	}

	that.set_operational = function set_operational(operational) {
		if(that.operational === operational)
			return;
		if(operational) {
			if(!initialized)
				initialize();
			that.plumber.change_authorizer(that.filtered, authorizer);
		} else {
			that.plumber.change_authorizer(that.filtered);
		}
		that.operational = operational;
	}

	if(options.operational)
		that.set_operational(true);

	return that;
}

/* Tabs - They're tabs.
options:
	items
	switchable
	selectifier
*/
Sparks.tabs = function tabs(options) {
	options = options || {};
	var that = Sparks.widget("Tabs", options.presenter, options.operational);

	var selectifiers = [];

	that.elements = Sparks.element_list();
	that.elements.join_style = "sandwich_elem";

	that.switchable = options.switchable;

	that.presenter.set_default_processor("content", function(working, original) {
		return working || Sparks.create_valid_child();
	});

	that.presenter.add_post_processor("content", function(out) {
		that.switchable = that.switchable || Sparks.switchable({items:that.items});
		Sparks.add_event_authorizer(that.switchable, "switch_view", 
			function switch_view_authorizer(src, action, selected) {
				return that.operational;
			}
		);
		that.elements.output(out, that.items);
	});

	that.add_selectifier = function add_selectifier() {
		return selectifiers.push(Sparks.obj_func.apply(null, arguments));
	}

	that.elements.process_item = function process_item(item, pointer, elements) {
		var tab = that.construct_tab(item, pointer);
		if(typeof tab !== "object")
			tab = Sparks.button({content:tab});
		for(var i in selectifiers)
			tab.add_enabler(selectifiers[i]);
		var elem = Sparks.create_valid_child(elements.parent);
		tab.add_listener(that.switchable.select, pointer);
		tab.output_to_placeholder(elem);
		Sparks.add_event_listener(that.switchable, "switch_view", 
			function switch_view_listener(src, action, selected) {
				if(pointer.position === selected.position)
					tab.disable();
				else
					tab.enable();
			}
		);	
		return elem;
	}

	that.construct_tab = options.construct_tab || Sparks.get_title;

	return that;
}

/* Accordion - it's an accordion. 
options:
	items
	construct_toggleable
*/
Sparks.accordion = function accordion(options) {
	options = options || {};
	var that = Sparks.widget("Accordion", options.presenter, options.operational);

	that.items = options.items;
	that.toggleables = [];

	that.presenter.set_default_processor("content", function content_pxr(working, original) {
		return working || Sparks.create_valid_child();
	});

	that.presenter.add_post_processor("content", function content_post_pxr(out) {
		that.elements.output(out, that.items);
	});

	that.construct_toggleable = options.construct_toggleable;
	if(!that.construct_toggleable) {
		that.construct_toggleable = function construct_toggleable(item, pointer) {
			return Sparks.toggleable({content:item});
		}
	}

	var minimizer;

	that.elements = Sparks.element_list();
	that.add_post_processor = that.elements.add_post_processor;
	that.elements.process_item = function process_item(item, pointer, elements) {
		var toggleable = that.construct_toggleable(item, pointer, elements);
		toggleable.expanded = false;
		var output = toggleable.output(elements.parent);
		that.toggleables.splice(pointer.position, 0, toggleable);

		Sparks.add_event_listener(toggleable.switchable, "switch_view", 
			function(src, action, selected) {
				if(!that.operational)
					return;
				if(selected.get_association(selected) === "minimized")
					return minimizer = undefined;
				minimizer && minimizer(toggleable);
				minimizer = function minimizer(acting_toggleable) {
					if(acting_toggleable !== toggleable)
						return toggleable.switchable.select("minimized");
				}
			}
		);

		return output;
	};

	return that;
}

/* Toggleable - switches between output and a minimzed version
options:
	content - content that's used in this element
	title(content) - returns a button to use as a title, or a string that's converted.
	process_expanded(output, content, switchable) - processes the expanded (Used to attach 'close'
		buttons and the like.
	expanded - boolean indicating whether this element's initially expanded.
*/
Sparks.toggleable = function toggleable(options) {
	options = options || {};
	var that = Sparks.widget("Toggleable", options.presenter, options.operational);

	that.switchable = Sparks.switchable({associations:["expanded", "minimized"]});

	that.expanded = options.expanded;

	var tabber;
	function make_tabber() {
		if(tabber)
			return tabber;
		return tabber = Sparks.tabber({owner:that, items:that.switchable.at("expanded").item()});
	}
	that.focus = function focus(direction) {
		if(that.switchable)
			Sparks.add_listener(that.switchable.select("expanded"), make_tabber().focus, direction);
	}

	that.blur = function blur(direction, event) {
		Sparks.log("Toggleables blur.");
		if(!that.switchable)
			return;
		Sparks.add_listener(that.switchable.select("minimized"), make_tabber().blur, direction, event);
	}

	Sparks.add_event_authorizer(that.switchable, "switch_view", function switch_view_authorizer() {
		return that.operational;
	});

	that.presenter.set_default_processor("content", function content_pxr(working, original) {
		return working || Sparks.create_valid_child();
	});

	that.presenter.add_post_processor("content", function content_post_pxr(out, working, original) {
		var title = that.title;
		if(typeof title === "function")
			title = title(that.content);
		if(typeof title !== "object")
			title = Sparks.button({content:title});
		title.add_listener(that.switchable.select, "expanded");
		var detachers = [];
		that.switchable.add_post_processor(function post_pxr(out, pointer) {
			if(pointer.get_association() === "expanded") {
				for(var i in that.post_processors) {
					var detacher = that.post_processors[i](
						that.switchable.placeholder, pointer.item(), that.switchable
					);
					detacher && detachers.push(detacher);
				}
			} else {	
				while(detachers.length)
					detachers.shift()();
			}
		});
		that.switchable.selected = that.expanded ? "expanded" : "minimized";
		that.switchable.output_to_placeholder(out, [that.content, title]);
	});

	that.title = options.title || function title(content) {
		return Sparks.button({content:Sparks.get_title(content)});
	}

	that.add_post_processor = Sparks.listener_adder(that.post_processors = [], true);

	that.content = options.content;
	
	return that;
}

/* Stater - Indicate status of request based on returned state.
options:
	action() - function that returns a deferred.
	duration - how long the button stays on the indicated state
	construct_button(button, key, phrase) - function that post-processes the button passed.
	phrases - phrases to display as content in the buttons. 
*/
Sparks.stater = function stater(options) {
	options = options || {};
	var that = Sparks.widget("Stater", options.presenter, options.operational);

	that.action = options.action;

	that.switchable = Sparks.switchable({
		associations:["submit", "confirming", "failed", "successful"]
	});	

	that.duration = options.duration || 2;
	that.resetter = Sparks.delayed(that.duration, that.switchable.select, "submit");

	that.presenter.set_default_processor("content", function(working, original) {
		if(!working)
			working = Sparks.create_valid_child();
		return working;
	});

	Sparks.add_event_listener(that, "set_operational", 
		function operational_listener(src, action, operational) {
			Sparks.signal_event(that.submit, "set_operational", operational);
		}
	);

	that.presenter.add_post_processor("content", function content_pxr(out) {
		for(var i in that.phrases) {
			that[i] = Sparks.button({content:that.phrases[i]});
			Sparks.map_call(that.post_processors, that[i], i, that.phrases[i]);
		}
		that.submit.add_listener(that.trigger);
		if(!that.operational)
			Sparks.signal_event(that.submit, "set_operational", that.operational);
		that.switchable.items = [
			that.submit, 
			that.confirming, 
			that.failed, 
			that.successful
		];
		that.switchable.output_to_placeholder(out);
	});
	that.add_post_processor = Sparks.listener_adder(that.post_processors = [], true);

	that.phrases = options.phrases || {};
	that.presenter.add_predrawer(function phrases_predrawer() {
		if(typeof that.phrases === "string") {
			that.phrases = {submit:options.phrases};
		} else if(options.phrases instanceof Array) {
			that.phrases = {
				submit:options.phrases[0],
				confirming:options.phrases[1],
				failed:options.phrases[2],
				successful:options.phrases[3]
			};
		}

		MochiKit.Base.setdefault(that.phrases, {
			submit:"Submit",
			confirming:"Confirming...",
			failed:"Failed.",
			successful:"Successful."
		});	
	});

	that.trigger = function trigger() {
		assert(that.action, "Sparks.state_button.clicked: Action is undefined.");
		var action = that.action.apply(null, arguments);
		that.switchable.select("confirming");
		that.resetter.delay = that.duration;
		Sparks.reduce_deferred({
			deferred:action,
			listener:function success() {
				that.switchable.select("successful").add_finalizer(that.resetter.start);
			},
			catcher:function failed() {
				that.switchable.select("failed").add_finalizer(that.resetter.start);
			},
			processor:function processor(value) {
				return value !== false;
			}
		});
		return action;
	}

	return that;
}

/* Button - simple, but powerful, button.
options:
	action - listener(s) to connect immediately to this button
	OR:	
		content - the content - this is used in coerce, so any outputtable stuff will work.
		AND:
			dict - dict to watch
			key - key to watch in dict
*/
Sparks.button = function button(options) {
	options = options || {};
	if(Sparks.is_watcher(options)) 
		options = {content:options};
	else if(typeof options !== "object")
		options = {content:options};
	var that = Sparks.widget("Button", options.presenter, options.operational);

	if(options.dict)
		that.content = Sparks.watcher(options.dict, options.key);
	else
		that.content = options.content;

	that.trigger = Sparks.obj_func(Sparks.push_event, that, "click_button");

	that.set_content = function set_content(new_content) {
		if(watcher_remover) {
			watcher_remover();
			watcher_remover = undefined;
		}
		that.content = new_content;
		if(Sparks.is_watcher(that.content))
			watcher_remover = that.content.add_listener(that.set_content);
	}

	var watcher_remover;

	that.presenter.set_processor("content", function content_pxr(working, original) {
		working = working || Sparks.create_valid_child();
		var out = Sparks.output(original.content, working);
		Sparks.append_child_nodes(working, out);
		that.set_content = Sparks.obj_func(Sparks.set_content, out);
		if(Sparks.is_watcher(that.content))
			watcher_remover = that.content.add_listener(that.set_content);
		return working;
	});

	that.presenter.add_post_processor("content", function content_post_pxr(out) {
		Sparks.add_event_listener(out, "onclick", that.trigger);
	});

	Sparks.add_event_authorizer(that, "click_button", function click_button_authorizer() {
		return that.operational;
	});

	that.add_listener = Sparks.obj_func(Sparks.add_event_listener, that, "click_button");

	if(options.action)
		that.add_listener(options.action);

	return that;
}

Sparks.is_widget = function is_widget(obj) {
	return obj && typeof obj === "object" && typeof obj.output === "function";
}

/* Widget */
Sparks.widget = function widget(type, presenter, operational) {
	var that = Sparks.event_source(type || "Widget");
	that.presenter = Sparks.presenter({parent:Sparks.get_presenter(presenter || type)});

	Sparks.attach_presenter(that, presenter, that.type);

	that.set_operational = function set_operational(operational) {
		if(operational === that.operational)
			return Sparks.deferred(true);
		return Sparks.push_event(that, "set_operational", operational);
	}

	that.disable = Sparks.obj_func(that.set_operational, false);
	that.enable = Sparks.obj_func(that.set_operational, true);

	that.toggle_operational = function toggle_operational() {
		return that.set_operational(!that.operational);
	}

	that.operational = typeof operational === "boolean" ? operational : true;

	Sparks.add_event_listener(that, "set_operational", 
		function set_operational(src, action, operational) {
			that.operational = operational;
		}
	);

	var output, enablers = [], disablers = [];
	function add_operational_listener(listeners) {
		var listener = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		var pos = listeners.push(listener) - 1;
		if(output && that.operational === (listeners === enablers))
			listener(output, that);
		return function remove() {
			return listeners.splice(pos, 1)[0];
		}
	}
	that.add_enabler = Sparks.obj_func(add_operational_listener, enablers);
	that.add_disabler = Sparks.obj_func(add_operational_listener, disablers);

	function operational_listener(src, action, operational) {
		if(!arguments.length) {
			operational = that.operational;
			src = that;
		}
		var listeners = operational ? enablers : disablers;
		var opposers = operational ? disablers : enablers;
		for(var i = 0; i < listeners.length; i++) {
			var opposer = listeners[i](output, src);
			if(!(typeof opposer === "function"))
				continue;
			listeners.splice(i--, 1);
			opposers.push(opposer);
		}
	}
	that.presenter.add_postdrawer(function widget_postdrawer(out) {
		output = out;
		operational_listener();
	});

	Sparks.add_event_listener(that, "set_operational", operational_listener);

	return that;
}
