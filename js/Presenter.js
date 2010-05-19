// Sparks.Presenter

Sparks.PresenterHierarchies = {};
Sparks.Presenters = {};

Sparks.get_presenter = function get_presenter(name) {
	if(name instanceof Array) {
		for(var i in name) {
			var presenter =  Sparks.get_presenter(name[i]);
			if(presenter)
				return presenter;
		}
		return;
	}
	if(typeof name !== "string")
		return name;
	return Sparks.Presenters[name];
}

Sparks.get_presenter_hierarchy = function get_presenter_hierarchy(name) {
	if(typeof name !== "string")
		return name;
	return Sparks.PresenterHierarchies[name];
}

//Sparks.attach_presenter = function attach_presenter(that, presenter, dont_save) {
Sparks.attach_presenter = function attach_presenter(that) {
	presenters = Sparks.get_args(arguments, 1);
	for(var i in presenters) {
		var parent = Sparks.get_presenter(presenters[i]);
		if(parent)
			break;
	}
	that.presenter = that.presenter || Sparks.presenter({parent:parent});

	var presented, dont_save = false;
	that.output = function output(parent) {
		if(!dont_save && presented) {
			if(presented.fired && Sparks.get_parent(presented.result))
				Sparks.remove_element(presented.result);
			return presented;
		}
		return presented = that.presenter.present_to_parent(that, MochiKit.DOM.getElement(parent));
	}

	that.output_to_parent = function output_to_parent(parent) {
		return Sparks.append_child_nodes(parent, that);
	}

	that.output_to_placeholder = function output_to_placeholder(placeholder, creator) {
		if(!dont_save && presented && presented.placeholdered) {
			return Sparks.swap_dom(placeholder, presented);
		} else {
			var placeholder_parent = Sparks.get_parent(placeholder);
			var old = placeholder;
			if(placeholder_parent) {
				placeholder = creator ? creator(placeholder_parent) :
					Sparks.create_valid_child(placeholder_parent);	
			}
			presented = that.presenter.present_to_placeholder(that, placeholder);
			Sparks.swap_dom(old, placeholder);
			return presented;
		}
	};

	return that;
}

Sparks.working_or_child = function working_or_child(working) {
	return working || Sparks.create_valid_child();
}

Sparks.is_presenter = Sparks.izzer("Presenter");

Sparks.presenter = function presenter(options) {
	if(typeof options === "string")
		options = {hierarchy:options};
	options = options || {};
	var that = Sparks.event_source("Presenter");

	if(options.parent) {
		that.parent = options.parent;
		that.hierarchy = that.parent.hierarchy;
	} else {
		that.hierarchy = Sparks.get_presenter_hierarchy(options.hierarchy) ||
			Sparks.PresenterHierarchies["NakedContent"];
	}

	that.manual_append = options.manual_append;

	that.present_to_parent = function present_to_parent(item, parent) {
		return that.present_to_placeholder(item, Sparks.create_valid_child(parent));
	}

	that.present_to_placeholder = function present_to_placeholder(item, placeholder) {
		var presented = Sparks.deferred();
		Sparks.add_listener(item, function item_listener(item) {
			if(!Sparks.is_event_source(item))
				return draw(item, placeholder).forward_to(presented);
			item.lock.acquire().add_listener(function lock_listener() {
				var drawing = draw(item, placeholder);
				drawing.forward_to(presented);
				drawing.add_finalizer(item.lock.release);
			});
		});
		return presented;
	}

	function draw(item, placeholder) {
		var drawing = Sparks.deferred({timer:true});
		var predraw = Sparks.chain_results({values:that.get_predrawers(), initial:item});
		predraw.add_listener(function predraw_listener() {
			item = arguments.length > 1 ? Sparks.get_args(arguments) : (arguments[0] || item);
			var original = item;
			item = Sparks.Tree.bounce({
				node:that.hierarchy,
				original:item,
				action:coerce,
				validator:Sparks.operator.truth,
				working:placeholder
			});
			item = Sparks.get_root(item);
			Sparks.map_call(that.get_postdrawers(), item, original);
			drawing.callback(item);
		});
		predraw.forward_to(drawing, "errback");
		return drawing;
	}

	function coerce(working, leaf_name, original) {
		var processor = that.get_processor(leaf_name) || default_processor;
		if(processor)
			var output = processor(working, original, leaf_name);
		if(!output)
			return;
		return process_element(output, working, original, leaf_name, that.get_post_processors(leaf_name));
	}	

	function process_element(output, working, original, leaf_name, post_processors) {
		if(output instanceof Array) {
			Sparks.map(output, function array_processor(elem) {
				process_element(elem, working, original, leaf_name, post_processors);
			});
			return working;
		}
		output = Sparks.output(output, working);
		function post_process(output) {
			if(!that.manual_append && working && output !== working) {
				var out = Sparks.get_root(output, function validator(elem) {
					return elem !== working && !Sparks.is_ancestor(working, elem);
				});
				if(out && out !== working)
					Sparks.construct_to_child(working, out);
			}
			for(var i in post_processors) {
				var post_processor = post_processors[i];
				if(output instanceof Array) {
					for(var j in output)
						post_processor(output[j], working, original, name);
				} else {
					post_processor(output, working, original, name);
				}
			}
		};
		Sparks.add_listener(output, post_process);
		return output;
	}

	// Getters and setters for pre- and post-drawers, processors, and post-processors.
	that.predrawers = options.predrawers ? Sparks.coerce_array(options.predrawers).slice() : [];
	that.postdrawers = options.postdrawers ? Sparks.coerce_array(options.postdrawers).slice() : [];
	var post_processors = {};
	var processors = {};
	var default_processor;

	that.set_processor = function set_processor(name) {
		return processors[name] = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		return function remover() {
			delete processors[name];
		}
	}

	that.set_default_processor = function set_default_processor(name) {
		if(typeof name !== "string")
			return default_processor = Sparks.obj_func.apply(null, arguments);
		if(!processors[name])
			processors[name] = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
	}

	that.add_post_processor = function add_post_processor(name, post_processor) {
		if(typeof arguments[0] !== "string") {
			return that.add_post_processors_to(
				Sparks.operator.truth, Sparks.obj_func.apply(null, Sparks.get_args(arguments))
			);
		}
		post_processors[name] = post_processors[name] || [];
		var pos = post_processors[name].push(
			Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1))
		);
		return function remover() {
			delete post_processors[name][pos - 1];
		}
	}

	that.add_post_processors_to = function add_post_processors_to(tester) {
		var post_processor = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
		tester = Sparks.string_tester(tester);
		var detachers = Sparks.map(that.hierarchy, function hierarchy_adder(name) {
			return tester(name) && that.add_post_processor(name, post_processor);
		});
		return function remover() {
			while(detachers.length)
				(detachers.shift() || Sparks.noop)();
		}
	}

	that.add_postdrawer = Sparks.listener_adder(that.postdrawers);
	that.add_predrawer = Sparks.listener_adder(that.predrawers);

	that.get_predrawers = function get_predrawers(name) {
		var predrawers = that.predrawers || [];
		if(that.parent)
			predrawers = predrawers.concat(that.parent.get_predrawers() || []);
		return predrawers;
	}

	that.get_postdrawers = function get_postdrawers(name) {
		var postdrawers = that.postdrawers || [];
		if(that.parent)
			postdrawers = postdrawers.concat(that.parent.get_postdrawers() || []);
		return postdrawers;
	}

	that.get_processor = function get_processor(name) {
		var processor = processors[name];
		if(!processor && that.parent)
			return that.parent.get_processor(name);
		return processor;	
	}

	that.get_post_processors = function get_post_processors(name) {
		var post_pxrs = post_processors[name] || [];
		if(that.parent)
			post_pxrs = post_pxrs.concat(that.parent.get_post_processors(name) || []);
		return post_pxrs;
	}

	return that;
}
