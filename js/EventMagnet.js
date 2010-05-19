function eventmagnet_initialize() {
	try {
		var elem = MochiKit.DOM.getElement("object");
		function child(id, content) {
			var container = Sparks.create_valid_child(elem);
			Sparks.update_style("border:1px solid #ccf; margin:.5em 0; padding:.2em;", container);
			container.id = id;
			var title = Sparks.create_valid_child(container);
			Sparks.update_style("clear:both; font-size:1.2em; color:#55f;margin-bottom:.2em;", title);
			title.innerHTML = Sparks.proper_nounize(id);

			switch(typeof content) {
				case "string": content = MochiKit.DOM.createDOM(content); break;
				case "object": break;
				default: content = Sparks.create_valid_child(child);
				content.innerHTML = "notime?";
			}
			container.appendChild(title);
			container.appendChild(content);
			elem.appendChild(container);
			return content;
		}

		function add(name, creator, child_override) {
			if(arguments.length === 2)
				child_override = use_child;
			Sparks.add_initializer(Sparks.proper_nounize(name), creator, 
				!!child_override && child(Sparks.snakerize(name + " test"), child_override)
			);
		}

		var use_child = true;

		//add("Field Presenter", create_field_presenter, false);
		add("Tetris", create_tetris, MochiKit.DOM.TABLE());

		//add("Calendar", create_calendar);
		//add("Date", create_date, false);
		//add("Month Viewer", create_month_viewer);
		//add("Repeater", create_repeater, false);
		//add("Paged Range Viewer", create_paged_range_viewer);
		//add("Scrolling Range Viewer", create_scrolling_range_viewer);
		//add("Range Viewer", create_range_viewer);
		//add("Ranger", create_ranger, false);
		//add("Lazy List", create_lazy_list);
		add("Spark", create_spark, true);
		//add("EM Title", create_em_title, true);

		if(false) {
			// Metalists, laziness
			use_child = true;
			add("Repeating Metalist", create_repeating_metalist, true);
			add("Patterned Metalist", create_patterned_metalist, true);
			add("Lazy Pager", create_lazy_pager, false);
			add("Lazy List", create_lazy_list);
		}

		if(false) {
			// Selections
			use_child = false;
			add("Single Selection", create_single_selection);
			add("Multiple Selection", create_multiple_selection);
			add("Range Selection", create_range_selection);
			add("Rendered Selection", create_rendered_selection);
			use_child = true;
			add("Selector", create_selector);
			add("Dropdown", create_dropdown, true);
			add("Listbox", create_listbox, true);
		}

		if(false) {
			// Presenters
			use_child = false;
			add("Simple Presenter", create_simple_presenter);
			add("Presenter", create_presenter);
			add("Button Presenter", create_button_presenter, false);
			add("Field Presenter", create_field_presenter, false);
		}

		if(false) {
			// Fields
			use_child = true;
			add("Meta Object", create_meta_object, false);
			add("Field Template", create_field_template, false);
			add("Field", create_field, false);
			add("Field Seed", create_field_seed, true);
			add("Text Field", create_text_field);
			add("ZIP Field", create_zip_field);
			add("Checkbox Field", create_checkbox_field);
			add("Radio Field", create_radio_field);
			add("Multiple Field", create_multiple_field, true);
			add("Mapper Field", create_mapper_field, true);
		}

		if(false) {
			// Widgets
			use_child = true;
			add("Key Listener", create_key_listener, MochiKit.DOM.INPUT());
			add("Scroll Listener", create_scroll_listener);
			add("Button", create_button);
			add("Stater", create_stater);
			add("Toggleable", create_toggleable);
			add("Accordion", create_accordion);
			add("Tabs", create_tabs);
			add("Gridder", create_gridder, false);
			add("Tabber", create_tabber);
		}

		if(false) {
			// Deferreds
			use_child = false;
			add("Deferred", create_deferred);
			add("Delayed", create_delayed);
			add("Deferred Lock", create_deferred_lock);
			add("Soft Release", create_soft_release);
			add("Gather Results", create_gather_results);
			add("Chain Deferred", create_chain_results);
		}

		if(false) {
			// Data Structures and Basic Manipulators
			use_child = true;
			add("Dict", create_dict);
			add("Watcher", create_watcher);
			add("List", create_list);
			add("Set", create_set);
			add("Tree", create_tree);
			add("Polish Tree", create_polish_tree);
			add("Plumber", create_plumber, true);
			add("Sorter", create_sorter);
			add("Filtered", create_filtered_list);
		}

		if(false) {
			// Switchable, Element List. (Data outputters)
			use_child = true;
			add("Switchable", create_switchable);
			add("Element List", create_element_list, MochiKit.DOM.DIV({
				style:"position:relative; height:1em; font-size:2em;"
			}));
			add("Buttoned Switchable", create_buttoned_switchable);
		}

		if(false) {
			// Telescopes
			use_child = true;
			add("Telescope", create_telescope);
			add("Boolean Telescope", create_boolean_telescope);
			add("Numbered Telescope", create_numbered_telescope);
			add("List Telescope", create_list_telescope);
			add("Style Telescope", create_style_telescope);
		}

		if(false) {
			// Effects
			use_child = true;
			add("Effect", create_effect, false);
			add("Opacity Effect", create_opacity_effect, true);
			add("Anchor", create_anchor, MochiKit.DOM.DIV(null, "Mouseover me!"));
			//add("Graph", create_line_graph);
			add("Periodic Effect", create_periodic_effect);
			add("Transitioner", create_transitioner, 
				MochiKit.DOM.DIV({style:"font-size:4em"}, "No time?")
			);
			add("Mouse Effect", create_mouse_effect, false);
			add("Fisheye Effect", create_fisheye_effect);
			add("Insane Presenter Effect", create_insane_presenter_effect);
		}

		if(false) {
			// Unclassifiables
			use_child = true;
			add("Snakerize", create_snakerize, false);
			add("Insane Nibbles Game", create_insane_nibbles_game);
			add("DOM Grid", create_dom_grid);
			add("Spriter", create_spriter);
			add("Evaluator", create_evaluator);
			add("Linkifier", create_linkifier, true);
			add("Event Tester", create_event_tester, true);
		}

	} catch(e) {
		Sparks.log_joined("eventmagnet_initialize:", e);
	}
}	

function create_tetris(elem) {
	tetris = Sparks.tetris();
	Sparks.add_element_class("tetris", elem);
	Sparks.update_style({cellpadding:0, cellspacing:0}, elem);
	Sparks.key_listener(document, function(key) {
		var direction;
		switch(key.name) {
			case "KEY_ARROW_LEFT":
				tetris.direction = "left"; break;
			case "KEY_ARROW_RIGHT":
				tetris.direction = "right"; break;
			case "KEY_ARROW_DOWN":
				tetris.direction = "down"; break;
		}
	});
	elem && tetris.output_to_parent(elem);
}

function create_spark(elem) {
	spark = Sparks.spark();
	spark.meta_object = Sparks.meta_object();
	spark.meta_object.object_type = "Address";
	spark.meta_object.fields = [
		{name:"country_name", optional:true},
		"postal_code",
		["region",
			[{name:"locality", optional:true},
				[{name:"street_address", requirements:["OR", "locality", "postal_code"]},
					"extended_address",
					"post_offce_box"
				]
			]
		]
	];
	spark.elements.set_processor(function(template) {
		field = Sparks.create_field(template, spark.dict);
		return field;
	});	
	elem && spark.output_to_placeholder(elem);
	spark.dict.set("name", "notime@doomsday.com");
}

function create_em_title(elem) {
	if(!elem)
		return;
	Sparks.set_style(elem, "border-bottom:1px solid blue; text-align:right; font-size:1.5em;");
	Sparks.set_content(elem, "EventMagnet");
	Sparks.set_style(elem, "color:white; width:10%; margin-left:88%; padding-right:2%;");
	var master = Sparks.style_animation("color:#55f; border-bottom-color:#ccf; margin-left:0%; width:100%; padding-right:0%");
	master.duration = 2;
	master.add_preprocessor(Sparks.Effects.curved_preprocessor);
	master.add_element(elem);
	master.play();
}

function create_calendar(elem) {
	calendar = Sparks.calendar();
	calendar.presenter.set_processor("container", Sparks.working_or_child);
	calendar.presenter.add_post_processor("container", Sparks.update_style, "font-size:1.2em");

	calendar.page_viewer.requester = function requester(month) {
		return [{start:Sparks.date(Sparks.epoch.year + Math.floor(month / 12), Sparks.epoch.month + month % 12, 1), duration:4},
			{start:Sparks.date(Sparks.epoch.year + Math.floor(month / 12), Sparks.epoch.month + month % 12), duration:2}];
	};

	calendar.add_cell_processor(Sparks.update_style, "width:2em; padding: .5em .2em; text-align:center;");
	calendar.add_post_processor(function(elem, date, month_state) {
		if(date.weekend())
			Sparks.set_style(elem, "font-weight", "bold");
		if(month_state !== "on_month") {
			var test_day = date.clone();
			Sparks.set_style(elem, "color", "gray");
			if(test_day.floor_day().month === date.month && test_day.ceil_day().month === date.month)
				Sparks.set_style(elem, "display", "none");
		}
	});
	elem && calendar.output_to_parent(elem);
}

function create_date() {
	date = Sparks.date();
}

function create_month_viewer(elem) {
	month_viewer = Sparks.month_viewer();
	month_viewer.presenter.set_processor("container", Sparks.working_or_child);
	month_viewer.presenter.add_post_processor("container", Sparks.update_style, "font-size:1.2em");

	month_viewer.add_cell_processor(Sparks.update_style, "width:2em; padding: .5em .2em; text-align:center;");
	month_viewer.add_post_processor(function(elem, date, month_state) {
		if(date.weekend())
			Sparks.set_style(elem, "font-weight", "bold");
		if(month_state !== "on_month") {
			var test_day = date.clone();
			Sparks.set_style(elem, "color", "gray");
			if(test_day.floor_day().month === date.month && test_day.ceil_day().month === date.month)
				Sparks.set_style(elem, "display", "none");
		}
	});
	month_viewer.presenter.add_postdrawer(function() {
		month_viewer.select_range(Sparks.date(2007, "july", 30), 4, function(telescope) {
			return telescope.add("background-color:#88f");
		});
	});
	elem && month_viewer.output_to_parent(elem);
}

function create_repeater() {
	repeater = Sparks.repeater();
	Sparks.log_joined("create_repeater(): Results:", repeater.calculate(-40, 50));
}

function create_paged_range_viewer(elem) {
	paged_range_viewer = Sparks.paged_range_viewer();
	paged_range_viewer.requester = function requester(page) {
		return [[Math.random() * 1000, Math.random() * 1000].sort()];
	};
	paged_range_viewer.add_preprocessor(function prepxr(range_viewer) {
		range_viewer.range = 1000;
		range_viewer.elements.add_post_processor(function(out) {
			Sparks.set_style(out, "background-color", Sparks.random_color());
		});
	});

	elem && paged_range_viewer.output_to_parent(elem);
}

function create_scrolling_range_viewer(elem) {
	scrolling_range_viewer = Sparks.scrolling_range_viewer(elem);
	scrolling_range_viewer.delay = .1;
	scrolling_range_viewer.start = 0;
	scrolling_range_viewer.end = 1000;
	scrolling_range_viewer.elements.add_post_processor(function(out) {
		Sparks.set_style(out, "background-color", Sparks.random_color());
	});
	scrolling_range_viewer.lazy_range.comparator = function comparator(a, b) {
		return a.start === b.start && a.end === b.end;
	}
	repeater = Sparks.repeater();
	scrolling_range_viewer.lazy_range.requester = function requester(start, end) {
		return repeater.calculate(start, end);
	}
	scrolling_range_viewer.lazy_range.comparator = function comparator(a, b) {
		return a.offset === b.offset && a.duration === b.duration;
	}
	scrolling_range_viewer.converter = function converter(item) {
		return [item.offset, item.offset + item.duration];
	}
	elem && scrolling_range_viewer.output_to_parent(elem);
}

function ranger_bug() {
	ranger = Sparks.ranger();
	function loggify(gaps) {
		gaps = Sparks.map(gaps, function(gap) {
			return Sparks.interpolate(gap);
		});
		Sparks.log_joined("Gaps:", gaps);
		var last;
		for(var i in ranger.items) {
			var item = ranger.items[i];
			assert(item.side !== last, "Sparks.ranger: Order is invalid!");
			last = item.side;
		}
	}
	// Full bug!
	loggify(ranger.add_range(0, 250));
	loggify(ranger.add_range(8, 258));
	loggify(ranger.add_range(25, 275));
	loggify(ranger.add_range(30, 280));
	loggify(ranger.add_range(0, 250));
	loggify(ranger.add_range(228, 478));
	loggify(ranger.add_range(336, 586));
	loggify(ranger.add_range(272, 522));
	loggify(ranger.add_range(500, 750));
	loggify(ranger.add_range(750, 1000));
	loggify(ranger.add_range(233, 483));
	loggify(ranger.add_range(228, 478));
	loggify(ranger.add_range(708, 958));
	loggify(ranger.add_range(747, 997));
	loggify(ranger.add_range(750, 1000));
	loggify(ranger.add_range(652, 902));
	loggify(ranger.add_range(747, 997));
	loggify(ranger.add_range(750, 1000));
	loggify(ranger.add_range(600, 850));
	loggify(ranger.add_range(470, 720));
	loggify(ranger.add_range(293, 543));
	loggify(ranger.add_range(0, 250));
	loggify(ranger.add_range(750, 1000));
}	

function set_bug() {
	set = Sparks.set();
	set.add(2,4);
	set.add(8);
	Sparks.log_joined("SetBug fixed:", Sparks.equal(set.items, [2,4,8]));
}

function create_ranger(elem) {
	ranger = Sparks.ranger();
	ranger.add_range(2,3);
	ranger.add_range(5,6);
	ranger.add_range(7,8);
	ranger.add_range(9,10);
}

function create_range_viewer(elem) {
	range_viewer = Sparks.range_viewer();
	range_viewer.range = 1000;
	range_viewer.viewable = 1;
	range_viewer.items.add([130, 920]);
	range_viewer.elements.add_post_processor(Sparks.update_style, "background:#8f8");
	elem && range_viewer.output_to_placeholder(elem);
}

function create_lazy_list(elem) {
	lazy_list = Sparks.lazy_list();
	lazy_list.viewable = 400;
	lazy_list.known_size = 100;
	lazy_list.delay = .1;
	lazy_list.requester = function(item) {
		var d = Sparks.deferred();
		Sparks.delayed(.1, d.callback, "No time " + item).start();
		return d;
	}
	lazy_list.elements.add_post_processor(Sparks.update_style, "border:1px solid #88f; background-color:#ccf");
	lazy_list.output_to_placeholder(elem);
}

function create_toggleable(elem) {	
	toggleable = Sparks.toggleable();
	toggleable.add_post_processor(function(out, pointer, switchable) {
		return Sparks.add_event_listener(out, "onclick", switchable.select, "minimized");
	});
	toggleable.content = MochiKit.DOM.DIV("I'm expanded. Click to minimize");
	toggleable.title = "Click me to expand.";
	toggleable.expanded = true;
	elem && toggleable.output_to_placeholder(elem);
	return toggleable;
}

function create_patterned_metalist(elem) {
	list = Sparks.list(Sparks.range(0, 10));
	patterned_metalist = Sparks.patterned_metalist(list);
	elem && Sparks.element_list().output(elem, patterned_metalist.list);
}

function create_repeating_metalist(elem) {
	list = Sparks.list(Sparks.range(0, 3));
	repeating_metalist = Sparks.repeating_metalist(list);
	elem && Sparks.element_list().output(elem, repeating_metalist.list);
}

function create_lazy_pager(elem) {
	lazy_pager = Sparks.lazy_pager();
	lazy_pager.requester = function requester(key) {
		var returning = Sparks.deferred();
		Sparks.delayed(5, returning.callback, "No time " + key).start();
		return returning;
	}
	lazy_pager.add_post_processor(function(item, key, pager) {
		return Sparks.obj_func(Sparks.log, "Flushed", {item:item, key:key});
	});
	lazy_pager.fetch(2);
}

function create_rendered_selection(elem) {
	rendered_selection = Sparks.rendered_selection(Sparks.list(Sparks.range(15)));
	Sparks.debug && rendered_selection.add_listener(Sparks.log_joined);
	selected = Sparks.list();
	Sparks.sorter(selected).set_operational(true);
	rendered_selection.add_group_listener(function(added, removed) {
		added.length && selected.add_all(Sparks.map_call(added, "item"));
		removed.length && selected.remove_all(Sparks.map_call(removed, "item"));
	});
	rendered_selection.set_selection(Sparks.range_selection({start:5, end:12, inclusive:true}));
	elem && Sparks.element_list(selected).output(elem);
}

function create_range_selection() {
	range_selection = Sparks.range_selection(1, 5);
}

function create_multiple_selection() {
	multiple_selection = Sparks.multiple_selection(Sparks.range(10));
}

function create_single_selection() {
	single_selection = Sparks.single_selection();
}

function create_event_tester(elem) {
	input = MochiKit.DOM.INPUT();
	elem.appendChild(input);
	output = MochiKit.DOM.INPUT();
	elem.appendChild(output);
	input.onkeydown = function(event) {
		output.value += String.fromCharCode(event.keyCode);
	}
	test = function test() {
		Sparks.log(input.value === output.value);
	}
}

function create_linkifier(elem) {
	linkifier = Sparks.linkifier();
	linkifier.add_effect(
		Sparks.effect.style({values:["white", "red"], style:"background-color", duration:10})
	);
	linkifier.add_transition(Sparks.update_style, "color:cyan");
	linkifier.set_element(elem);
	return linkifier;
}

function create_field_presenter() {
	field_presenter = Sparks.Presenters["Field"] = Sparks.presenter("Field");
	field_presenter.set_processor("container", Sparks.working_or_child);
	field_presenter.set_processor("actions", Sparks.create_valid_child);
	field_presenter.set_processor("content_container", Sparks.create_valid_child);
	field_presenter.set_processor("title", Sparks.create_valid_child);

	field_presenter.add_post_processor("container", 
		Sparks.update_style, "width:30em;"
	);
	field_presenter.add_post_processor("content_container", 
		Sparks.update_style, "text-align:center;"
	);
	field_presenter.add_post_processor("title", function title_post_pxr(out, working, field) {
		Sparks.set_content(out, Sparks.proper_nounize(field.template.name));
	});
	field_presenter.add_post_processor("title", Sparks.update_style, 
		"text-align:left; font-weight:bold; color:#88f;"
	);
	field_presenter.add_post_processor("actions", 
		function actions_post_pxr(out, working, original) {
			var confirmer = Sparks.stater();
			confirmer.action = original.trigger_field;
			confirmer.phrases = ["Confirm", "Confirming", "Failed", "Confirmed."];
			confirmer.switchable.add_post_processor(function post_pxr(out, pointer) {
				if(pointer.get_association() === "submit")
					return Sparks.linkify("hovering", out);
			});
			confirmer.output_to_parent(out);
		}
	);
	field_presenter.add_post_processor("content", Sparks.update_style, "width:99%;");
	field_presenter.add_post_processor("actions", Sparks.update_style, "text-align:right; color:#55f;");
	return field_presenter;
}

function create_button_presenter() {
	button_presenter = Sparks.Presenters["Button"] = Sparks.presenter();
	button_presenter.set_processor("container", Sparks.working_or_child);

	button_presenter.add_post_processor("container", Sparks.update_style, 
		"border:.1em solid #ccc; text-align:center; padding:.2em 0"
	);
	
	button_presenter.add_predrawer(function(button) {
		button.add_enabler(Sparks.add_element_class, "big_link");
		button.add_enabler(Sparks.linkify, "hovering");
	});
	return button_presenter; 
}

function create_key_listener(elem) {
	Sparks.key_listener(elem, Sparks.obj_func(Sparks.log, "Pressed"));
}

function create_scroll_listener(elem) {
	Sparks.update_style({overflow:"auto", height:100}, elem);
	for(var i = 0; i < 20; i++) {
		elem.appendChild(MochiKit.DOM.DIV("No time!"));
	}
	Sparks.scroll_listener(elem, function(scroll) {
		Sparks.log_joined("Scrolled", scroll.vertical.percent);
	});
}

function create_dropdown(elem) {
	dropdown = Sparks.dropdown({options:Sparks.list()});
	for(var i = 0; i < 10; i++) {
		dropdown.selector.options.add(
			{value:i, toString:function toString() { return this.value; }}
		);
	}
	dropdown.add_listener(Sparks.update_style, 
		"opacity:0; background-color:white; border:1px solid #ccf"
	);
	dropdown.add_effect(Sparks.effect.opacity({values:[0,1], duration:.4}));
	dropdown.selector.add_select_listener(Sparks.add_element_class, "selected");
	dropdown.selector.add_hover_listener(Sparks.add_element_class, "hovering");
	if(elem) {	
		var input = MochiKit.DOM.INPUT();
		elem.appendChild(input);
		dropdown.output(elem, input);
	}
	return dropdown;
}

function create_listbox(elem) {
	listbox = Sparks.listbox(Sparks.range(10));
	listbox.add_select_listener(Sparks.add_element_class, "selected");
	listbox.add_hover_listener(Sparks.add_element_class, "hovering");
	elem && listbox.output_to_placeholder(elem);
	return listbox;
}

function create_selector(elem) {
	selector = Sparks.selector(Sparks.array_range(0, 10));
	selector.add_hover_listener(Sparks.add_element_class, "hovering");
	selector.add_hover_listener(function(out, pointer) {
		Sparks.log_joined("Hovered", pointer);
		return Sparks.obj_func(Sparks.log_joined, "Unhovered", pointer);
	});
	selector.add_select_listener(Sparks.add_element_class, "selected");
	selector.add_select_listener(function(out, pointer) {
		Sparks.log_joined("Selected", pointer);
		return Sparks.obj_func(Sparks.log_joined, "Unselected", pointer);
	});
	elem && selector.output_to_parent(elem);
	return selector;
}

function create_watcher() {
	var dict = Sparks.dict();
	watcher = Sparks.watcher(dict, "no");
	return watcher;
}

/*** Field Tests ***/

function create_meta_object() {
	if(typeof meta_object !== "undefined")
		return meta_object;
	meta_object = Sparks.meta_object();
	meta_object.object_type = "Address";
	meta_object.fields = [
		{name:"country_name", optional:true},
		"postal_code",
		["region",
			[{name:"locality", optional:true},
				[{name:"street_address", requirements:["OR", "locality", "postal_code"]},
					"extended_address",
					"post_offce_box"
				]
			]
		]
	];
	return meta_object;
}

function create_field_template() {
	fields = Sparks.parse_field_requirements(["country_name",
		"postal_code",
		["region",
			[{name:"locality", optional:true},
				[{name:"street_address", requirements:["OR", "locality", "postal_code"]},
					"extended_address",
					"post_offce_box"
				]
			]
		]
	]);
	var dict = Sparks.dict();
	Sparks.log(fields.street_address.check(dict));
	return fields;
}

function create_field_seed(elem) {
	field_seed = Sparks.field_seed({
		dict:create_meta_object().create(),
		watched:{root:"region", children:"street_address"}
	});	
	if(elem) {
		var element_list = Sparks.element_list();
		element_list.process_item = function(item) {
			return item.name;
		}
		element_list.output(elem, field_seed.fields);
	}
	return field_seed;
}

function create_field() {
	field = Sparks.field();
	field.field_type = "email";
	field.value = "dafrito@hotmail.com";
	field.add_catcher(Sparks.log, "Failed push");
	field.add_listener(Sparks.log, "Successful push");
	return field;
}

function create_text_field(elem) {
	text_field = Sparks.text_field();
	text_field.field_type = "email";
	text_field.value = "dafrito@hotmail.com";
	elem && text_field.output_to_parent(elem);
	return text_field;
}

function create_zip_field(elem) {
	zip_field = Sparks.text_field({field_type:"postal_code", initial:"75080"});
	elem && zip_field.output_to_parent(elem);
	return zip_field;
}

function create_radio_field(elem) {
	radio_field = Sparks.radio_field();
	radio_field.mapper.convert = function convert(item) {
		return [item.getDate(), "/", item.getMonth(), "/", item.getFullYear()].join("")
	}
	radio_field.options.add_all([new Date(2005, 0), new Date(2006, 3), new Date(2007, 6)]);
	radio_field.add_catcher(Sparks.log, "It's fucked!");
	elem && Sparks.append_child_nodes(elem, radio_field);
	return radio_field;
}

function create_checkbox_field(elem) {
	checkbox_field = Sparks.checkbox_field();
	checkbox_field.standalone = true;
	checkbox_field.dict = Sparks.dict();
	checkbox_field.key = "no";
	checkbox_field.options.add_all(["boo", "foo", "app", "coo"]);
	checkbox_field.add_catcher(Sparks.log, "It's fucked!");
	elem && checkbox_field.output_to_parent(elem);
	return checkbox_field;
}

function create_multiple_field(elem) {
	multiple_field = Sparks.multiple_field();
	for(var i = 0; i < 5; i++)
		multiple_field.add().set_value(i);
	elem && multiple_field.output_to_parent(elem);
	return multiple_field;
}

function create_mapper_field(elem) {
	mapper_field = Sparks.mapper_field();
	for(var i = 0; i < 10; i++)
		mapper_field.options.add({value:i, toString:function(i) { return this.value; }});
	elem && mapper_field.output_to_parent(elem);
	return mapper_field;
}

/*** Widget Tests ***/

function create_button(elem) {
	button = Sparks.button();
	button.content = Sparks.watcher();
	button.add_listener(Sparks.log, "Clicked");
	button.add_listener(button.toggle_operational);
	button.add_disabler(button.content.set_value, "Disabled.");
	button.add_enabler(button.content.set_value, "Click to disable");
	elem && button.output_to_parent(elem);
	return button;
}

function create_stater(elem) {
	stater = Sparks.stater();
	stater.action = Sparks.obj_func(Sparks.wait, 2);
	stater.phrases["submit"] = "NO TIME!!";
	stater.construct_button = function(button, phrase) {
		switch(phrase) {
			case "submit":
				button.add_enabler(Sparks.linkify, "hovering");
				button.add_enabler(Sparks.add_element_class, "big_link");
		}
	}
	elem && stater.output_to_placeholder(elem);
	return stater;
}

function create_accordion(elem) {	
	accordion = Sparks.accordion();
	accordion.items = Sparks.list(["Chicken", "Soup", "Dogs", "Cats"]);
	accordion.construct_toggleable = function construct_toggleable(item) {
		var toggleable = Sparks.toggleable({
			content:Sparks.button({content:item})
		});
		toggleable.title = function title() {
			title = Sparks.button("Minimized!");
			title.add_enabler(Sparks.linkify, "hovering");
			title.add_enabler(Sparks.add_element_class, "tab");
			title.add_enabler(Sparks.update_style, {color:"red", border:"1px solid blue;"});
			return title;
		}
		toggleable.add_post_processor(function process_expanded(out, content, switchable) {
			content.add_listener(switchable.select, "minimized");
			content.add_enabler(Sparks.linkify, "hovering");
		});
		return toggleable;
	}
	elem && accordion.output_to_placeholder(elem);
	return accordion;
}

function create_tabs(elem) {
	tabs = Sparks.tabs();
	tabs.items = Sparks.list(["Chicken", "Soup", "Dogs", "Cats"]);
	tabs.add_selectifier(Sparks.remove_element_class, "selected");
	tabs.add_selectifier(Sparks.linkify, "hovering");
	tabs.elements.add_post_processor(Sparks.add_element_class, "tab");
	tabs.elements.spacer = function spacer(parent) {
		var child = Sparks.create_valid_child(parent);
		MochiKit.DOM.addElementClass(child, "tab_spacer");
		return child;
	}
	elem && Sparks.append_child_nodes(elem, tabs);
	return tabs;
}

function create_tabber(elem) {	
	tabber = Sparks.tabber();
	for(var i = 0; i < 5; i++)
		tabber.items.push(MochiKit.DOM.INPUT({value:i}));

	var toggleable = Sparks.toggleable();
	var items = [];
	for(var i = 0; i < 5; i++)
		items.push(MochiKit.DOM.INPUT({type:"radio", name:"foo", value:i}));
	toggleable.content = items;
	toggleable.title = "Minimized.";

	tabber.items.push(Sparks.radio_collection({items:items}));
	for(var i = 0; i < 5; i++)
		tabber.items.push(MochiKit.DOM.INPUT({value:i}));
	elem && Sparks.element_list().output(elem, tabber.items);
	return tabber;
}

/*** Gridder Stuff ***/

function create_gridder() {
	gridder = Sparks.gridder();
	gridder.width = 3;
	gridder.height = 6;
	gridder.construct();
	plotter = Sparks.plotter(gridder, 1, 1);
	return gridder;
}

function create_insane_nibbles_game(elem) {
	grid = Sparks.dom_grid();
	grid.width = 10;
	grid.height = 15;
	grid.loop_style = "donut";
	grid.create_row = undefined;
	grid.create_cell = function create_cell(row, new_row) {
		cell = Sparks.create_valid_child(row);
		Sparks.set_style(cell, "width:1em; height:1em; border:1px solid #ccf; float:left");
		if(new_row)
			Sparks.set_style(cell, "clear:left");
		return cell;
	}
	plotter = Sparks.plotter(grid.gridder, 0, 0);
	plotter.add_notifier(function listener(new_cell, old_cell) {
		old_cell.content.object.style.border = "1px solid white";
		new_cell.content.object.style.border = "1px solid red";
	});
	var direction_queue = [];
	function move(periodic) {
		if(direction_queue.length > 1)
			direction_queue.shift();
		var direction = direction_queue[0];
		switch(direction) {	
			case "KEY_ARROW_UP":
				plotter.up();
				break;
			case "KEY_ARROW_RIGHT":
				plotter.right();
				break;
			case "KEY_ARROW_DOWN":
				plotter.down();
				break;
			case "KEY_ARROW_LEFT":
				plotter.left();
				break;
		}
		periodic.start();
	}
	Sparks.delayed(.2, move).start();
	Sparks.add_event_listener(document, "onkeydown", function(src, action, event) {
		var key = event.key().string;
		if(!key || !key.match(/^KEY_ARROW/))
			return;
		if(key === direction_queue[direction_queue.length - 1])
			return;
		direction_queue.push(key);
	});
	elem && grid.output_to_placeholder(elem);
	return grid;
}

function create_dom_grid(elem) {
	grid = Sparks.dom_grid({proxied:false});
	grid.width = 10;
	grid.height = 15;
	grid.loop_style = "donut";
	grid.create_row = undefined;
	grid.create_cell = function create_cell(row, new_row) {
		cell = Sparks.create_valid_child(row);
		Sparks.set_style(cell, "width:1em; height:1em; solid #005; border:1px solid black; background: black;float:left");
		if(new_row)
			Sparks.set_style(cell, "clear:left");
		return cell;
	}
	plotter = Sparks.plotter(grid.gridder, 0, 0);
	var cardinals;
	plotter.add_notifier(function listener(new_cell, old_cell) {
		old_cell.content.clear();
		if(cardinals) {
			for(var i in cardinals)
				cardinals[i].content.clear();
		}
		new_cell.content.add("background: red");
		cardinals = new_cell.cardinals();
		for(var i in cardinals)
			cardinals[i].content.add("background: #800;");
	});
	Sparks.add_event_listener(document, "onkeydown", function(src, action, event) {
		switch(event.key().string) {
			case "KEY_ARROW_UP":
				plotter.up();
				break;
			case "KEY_ARROW_RIGHT":
				plotter.right();
				break;
			case "KEY_ARROW_DOWN":
				plotter.down();
				break;
			case "KEY_ARROW_LEFT":
				plotter.left();
				break;
		}
	});
	elem && grid.output_to_placeholder(elem);
	return grid;
}

/*** Effect Stuff ***/

function create_fisheye_effect(elem) {
	fisheye_effect = Sparks.effect();
	Sparks.set_style(elem, "border:1em solid green;height:10em;");
	var children = 10;
	for(var i = 0; i < children; i++) {
		var child = Sparks.create_valid_child(elem);
		Sparks.set_style(child, "font-size:100%; float:left; border:0px solid green;color:white;");
		Sparks.set_style(child, {width:(100 / children) + "%", height:"100%"});
		child.innerHTML = "notime";
		elem.appendChild(child);
		fisheye_effect.add_element(child);
	}
	fisheye_effect.stagger = .2;
	fisheye_effect.add_preprocessor(Sparks.Effects.staggered_preprocessor);
	fisheye_effect.add_effect(Sparks.effect.style({style:"font-size", values:[100,800,100]}));
	fisheye_effect.add_effect(Sparks.effect.style({style:"color", values:["white", "red", "white"]}));
	var box = Sparks.box(elem);
	Sparks.push_event(fisheye_effect, "play_effect").add_listener(
		Sparks.push_event, fisheye_effect, "freeze_effect"
	);
	var last;
	elem.onmousemove = function(event) {
		var pos = (event.clientX - box.left()) / box.width();
		if(last && Sparks.tolerant_equal(pos, last, .01))
			return;
		last = pos;
		fisheye_effect.run_effect(pos);
	}
	return fisheye_effect;
}

function create_effect(elem) {
	effect = Sparks.effect({elements:elem});
	effect.play();
	return effect;
}

function create_mouse_effect(elem) {
	mouse_effect = Sparks.effect({elements:elem});
	var cursors = [
		"n-resize",
		"ne-resize",
		"e-resize",
		"se-resize",
		"s-resize",
		"sw-resize",
		"w-resize",
		"nw-resize",
		"n-resize"
	];
	mouse_effect.duration = 5;
	mouse_effect.add_preprocessor(Sparks.Effects.flicker_preprocessor);
	mouse_effect.do_effect = function do_effect(elem, keyframe) {
		var cursor = cursors[Math.floor((keyframe.interpolated * 10 * cursors.length) % cursors.length)];
		document.documentElement.style.cursor = cursor;
	}
	mouse_effect.play();
	return mouse_effect;
}

function create_opacity_effect(elem) {
	opacity_effect = Sparks.effect.opacity({elements:elem});
	opacity_effect.values = [1,0,1];
	opacity_effect.duration = 5;
	opacity_effect.play();
	return opacity_effect;
}

function create_insane_presenter_effect(elem) {
	if(!elem)
		return;
	create_presenter(elem);
	style_effect = Sparks.effect({elements:Sparks.fetch("#presenter_content div")});
	style_effect.stagger = .2;
	style_effect.add_preprocessor(Sparks.Effects.staggered_preprocessor);
	style_effect.add_preprocessor(Sparks.Effects.curved_preprocessor);
	style_effect.add_effect(Sparks.effect.style({
		style:"border-left-width", 
		values:[.2,4]
	}));	
	Sparks.last(style_effect.effects).add_preprocessor(Sparks.Effects.curved_preprocessor);
	style_effect.add_effect(Sparks.effect.style({
		style:"border-right-width", 
		values:[.2,4]
	}));	
	Sparks.last(style_effect.effects).add_preprocessor(Sparks.Effects.reverse_preprocessor);
	Sparks.last(style_effect.effects).add_preprocessor(Sparks.Effects.curved_preprocessor);
	style_effect.add_effect(Sparks.effect.style({
		style:"border-left-color",
		values:["#080", "#bfa"]
	}));
	Sparks.last(style_effect.effects).add_preprocessor(Sparks.Effects.curved_preprocessor);
	style_effect.add_effect(Sparks.effect.style({
		style:"border-right-color",
		values:["#afa", "#080"]
	}));
	style_effect.add_effect(Sparks.effect.style({
		style:"background-color",
		values:["#8f8", "#cfa", "#af8"]
	}));
	Sparks.last(style_effect.effects).add_preprocessor(Sparks.Effects.curved_preprocessor);
	style_effect.duration = 5;
	style_effect.play();
	return style_effect;
}

function create_anchor(elem) {
	anchorify = Sparks.anchorify({
		anchor:MochiKit.DOM.DIV(
			{style:"padding:3px; border:1px solid red;"}, 
			"A even better floating base."
		)
	});
	//anchorify.add_effect(Sparks.effect.opacity({values:[0,1], duration:1, framecount:25}));
	anchorify.add_transition(Sparks.update_style, "border-color: blue");
	elem && anchorify.output(elem);
	return anchorify;
}

function create_periodic_effect(elem) {
	periodic = Sparks.effect.periodic();
	periodic.elements = Sparks.range(10);
	/*periodic.next_operation = function next(elems) {
		return Math.min(Math.floor(Math.random() * elems.length), elems.length - 1);
	}*/
	var blue = MochiKit.Color.Color.blueColor();
	if(elem) {
		periodic.operator = function(obj) {
			elem = Sparks.swap_dom(elem, MochiKit.DOM.SPAN(null, obj));
			Sparks.set_style(elem, "font-size", "10em");
			Sparks.set_style(elem, "color", blue.blendedColor(MochiKit.Color.Color.redColor(), obj/10));
		};
	} else {	
		periodic.operator = Sparks.log_joined;
	}
	periodic.play();
}

function create_line_graph(elem) {
	graph = Sparks.line_graph({
		domain:[0, 1],
		range:[0, 1]
	});
	graph.process_periodic = function periodic_pxr(periodic) {
		periodic.split = 4;
		periodic.duration = 10;
		periodic.framecount = 5;
	}
	graph.gridder.width = 200;
	Sparks.append_child_nodes(elem, graph);
	graph.add(Sparks.Effects.curved_preprocessor);
	graph.add(function(pos) {
		return Sparks.Effects.curved_preprocessor(
			Sparks.Effects.curved_preprocessor(
			pos
		));
	});
	graph.add(function(pos) {
		return Math.pow(Sparks.Effects.curved_preprocessor(Math.pow(pos, 2) + .5), 1.5) - .5;
	});
	return graph;
}

function create_transitioner(elem) {
	transitioner = Sparks.transitioner(elem);
	transitioner.add_effect(Sparks.effect.opacity({elements:elem, duration:10, values:[1,.5]}));
	transitioner.add_listener(Sparks.update_style, "color:red");
	transitioner.add_transition(Sparks.update_style, "color:green");
	return transitioner;
}

/*** Advanced list stuff ***/

function create_sorter(elem) {
	var list = Sparks.list([9, 8, 1, 2, 3, 0, 5, 6, 4, 7]);
	sorter = Sparks.sorter(list);
	sorter.set_operational(true);
	if(elem) {
		var element_list = Sparks.element_list();
		element_list.output(elem, list);
	}
	return sorter;
}

function create_filtered_list(elem) {
	var list = Sparks.list(Sparks.range(20));
	filtered = Sparks.filtered_list({items:list});
	filtered.set_operational(true);
	filtered.add_validator(function validator(item) {
		return item % 2 === 1;
	});
	filtered.add_validator(function validator(item) {
		return item > 3;
	});
	filtered.elements.join_style = "array_like";
	elem && filtered.output(elem);
	return filtered;
}

/*** Telescope tests ***/

function create_style_telescope(elem) {
	elem.innerHTML = "Some crazy style telescoping!";
	style_telescope = Sparks.style_telescope({object:MochiKit.DOM.getElement(elem)});
	style_telescope.add({color:"red"});
	style_telescope.add("font-size:2.0em");
	style_telescope.add({color:"#afa"});
	style_telescope.add("border: 1em solid green;");;
	style_telescope.add("background:#cfc");
	style_telescope.add("background:#4c4");
	style_telescope.add("background:#080");
	style_telescope.add("width:10em;");
	return style_telescope;
}

function create_list_telescope(elem) {
	var list = Sparks.list(Sparks.range(5));
	list_telescope = Sparks.telescope({object:list});
	elem && Sparks.element_list().output(elem, list);
	list_telescope.preprocessor = function prepxr() {
		var items = Sparks.get_args(arguments);
		return function add(obj) {
			obj.add_all(items);
			return Sparks.obj_func(obj.remove_all, items);
		}
	};
	list_telescope.add(8, 12, 15);
	list_telescope.add(10,11,12);
	return telescope;
}

function create_numbered_telescope(elem) {
	numbered_telescope = Sparks.telescope({object:10});
	elem && numbered_telescope.add_listener(Sparks.set_content, elem);
	numbered_telescope.add(function(item) { return item * 2; });
	remover = numbered_telescope.add(function(item) { return item - 5; });
	numbered_telescope.add(function(item) { return Math.pow(item, 2); });
	remover();
	assert(numbered_telescope.object === 400, "It's not 400!");
	numbered_telescope.set_object(5);
	assert(numbered_telescope.object === 100, "It's not 100!");
	numbered_telescope.pop();
	assert(numbered_telescope.object === 10, "It's not 10!");
	return numbered_telescope;
}

function create_boolean_telescope(elem) {
	boolean_telescope = Sparks.telescope({object:10});
	elem && boolean_telescope.add_listener(Sparks.set_content, elem);
	boolean_telescope.add(Sparks.operator.truth);
	boolean_telescope.add(Sparks.operator.lognot);
	boolean_telescope.add(Sparks.operator.lognot);
	boolean_telescope.add(Sparks.operator.lognot);
	return boolean_telescope;
}

function create_telescope(elem) {
	telescope = Sparks.telescope({object:"No time"});
	elem && telescope.add_listener(Sparks.set_content, elem);
	telescope.preprocessor = function prepxr(given) {
		return function(item) {
			return item + given;
		}
	}
	telescope.add(" but like");
	telescope.add(" the evil!");
	telescope.add(" chicken scopes.");
	return telescope;
}

/*** Basic output tests ***/

function create_simple_presenter(elem) {
	presenter = Sparks.presenter("NakedContent");

	presenter.set_processor("frame", function frame_processor(working, original, name) {
		Sparks.set_content(working, "No time?");
	});

	elem && Sparks.append_child_nodes(elem, presenter.present());
	return presenter;
}

function create_presenter(elem) {
	elem.id = "presenter_content";
	presenter = Sparks.presenter("Horizontal");
	presenter.set_default_processor(function defaulter(working, original, name) {
		var child = Sparks.create_valid_child(working);
		Sparks.set_style(child, "border:.2em solid #8f8; margin:1em; background-color:#afa;color:green");
		Sparks.set_content(child, Sparks.proper_nounize(name));
		return child;
	});
	presenter.add_postdrawer(Sparks.update_style,
		"text-align:center; width:30em; font-size:1.2em;"
	);
	var tester = Sparks.string_tester("container");
	presenter.add_post_processors_to(tester, Sparks.update_style,
		"border:.3em solid #8c8; background-color:#8f8"
	);
	presenter.add_post_processors_to(tester.reversed, Sparks.update_style, "background-color:#cfa");
	presenter.add_post_processor("frame", Sparks.update_style, 
		"border:1em solid green; background-color:#5a5;"
	);
	var detacher;
	presenter.add_post_processor(function(out, working, original, name) {
		out.id = name;
		Sparks.add_event_listener(out, "move_mouse", function(src, action, event) {
			event.stop();
			Sparks.log({
				action:action, 
				src:src.id, 
				related_target:event.relatedTarget().id || event.relatedTarget().tagName
			});
			switch(action) {
				case "onmouseout":
					var target = event.relatedTarget();
					if(out !== target && !Sparks.is_ancestor(out, target)) {
						detacher && detacher();
						return detacher = undefined;
					}	
					return;
				case "onmouseover":
					detacher && detacher();
					detacher = Sparks.update_style(
						"border-color: blue; background-color:#88f;color:white", out
					);
			}
		});
	});
	elem && presenter.present_to_placeholder(undefined, elem);
	return presenter;
}

function create_switchable(elem) {
	var list = Sparks.list();
	for(var i = 0; i < 5; i++)
		list.push(Sparks.button("NO " + i + " TIME"));
	switchable = Sparks.switchable(list);
	switchable.add_post_processor(function(out, pointer) {
		return pointer.item().add_listener(switchable.next);
	});
	elem && switchable.output_to_placeholder(elem);
	return switchable;
}

function create_buttoned_switchable(elem) {
	var list = Sparks.list();
	for(var i = 0; i < 5; i++)
		list.push(Sparks.button("NO " + i + " TIME"));
	buttoned_switchable = Sparks.switchable(list);
	buttoned_switchable.add_post_processor(function(out, pointer) {
		return pointer.item().add_listener(buttoned_switchable.next);
	});
	elem && buttoned_switchable.output_to_parent(elem);
	return buttoned_switchable;
}

function create_element_list(elem) {
	var list = Sparks.list();
	for(var i = 0; i < 5; i++) {
		var button = Sparks.button("Button " + i);
		button.add_enabler(Sparks.add_element_class, "big_link");
		button.add_listener(button.disable);
		list.add(button);
	}
	element_list = Sparks.element_list();
	element_list.items = list;
	element_list.join_style = "array_like";
	element_list.add_post_processor(Sparks.update_style, "color:#88f;");
	elem && element_list.output_to_parent(elem);
	return element_list;
}

/*** Basic Datatype tests ***/

function create_dict() {
	dict = Sparks.dict({items:{boo:"ton"}});	
	dict.set("no", "time");	
	dict.set("boo", "bar");	
	return dict;
}

function create_list() {
	assert(!MochiKit.Base.compare(
		["d","c","b","a"],
		Sparks.Event.move_item(["a","b","c","d"], "move_item", [3,0,2,1], [0,3,1,2])
		), "move_item is fucked. (ergh. :/)"
	);
	list = Sparks.list(Sparks.range(0, 30, 3));
	var stopper = Sparks.timer();
	for(var i = 0; i < 1; i++)
		list.swap([24,15,12,6], [0,3,9,27]);
	Sparks.log_joined("Swap timer:", stopper());
	return list;
}

function create_set() {
	set = Sparks.set(Sparks.range(0, 30, 3));
	other_set = Sparks.set(Sparks.range(19, 50, 3));
	set_operations = set.set_operations(other_set);
	return set;
}

function create_tree() {
	tree = Sparks.tree();
	tree.add(1,2,3);
	tree.get(1).add(5,6);
	tree.remove(3);
	return tree;
}

function create_polish_tree() {
	tree = Sparks.tree(["AND",
		["OR",
			["NOT", false],
			true
		],
		true,
		["AND", true, true],
		["XOR", true, false, false]
	]);	
	Sparks.log_joined("Calculated Polish value:",
		Sparks.Tree.calculate_polish(tree, Sparks.operator.truth)
	);
}

function create_plumber(elem) {
	var odds = Sparks.list();
	var evens = Sparks.list();
	var numbers = Sparks.list();
	var source = Sparks.list(Sparks.range(20));
	plumber = Sparks.plumber();
	plumber.add_source(source);
	plumber.add_destination(evens, function validator(item) {
		return item % 2 === 0;
	});
	plumber.add_destination(odds, function validator(item) {
		return item % 2 === 1;
	});
	plumber.add_destination(numbers);
	plumber.add_source(Sparks.list(Sparks.range(13, 27)));
	plumber.change_authorizer(numbers, function validator(item) {
		return item % 3 === 0;
	});
	if(elem) {
		Sparks.sorter({operational:true, items:numbers});
		Sparks.element_list({join_style:"sandwich_elem", items:numbers, parent:elem});
	}
	return plumber;
}

/*** Deferreds and Asynchronous tests ***/

function create_snakerize() {
	assert(Sparks.snakerize("TheBigFish") === "the_big_fish", "Big Fish Snakerize failed.");
	assert(Sparks.snakerize("XMLHttpRequest") === "xml_http_request", "XHR Snakerize failed.");
	assert(Sparks.snakerize("RequestXML") === "request_xml", "RequestXML Snakerize failed.");
	//assert(Sparks.snakerize("ZIP Field") === "zip_field", "ZIPField Snakerize failed.");
}

function create_deferred() {
	deferred = Sparks.deferred();
	deferred.add_listener(Sparks.log, "A listener.");
	deferred.add_finalizer(Sparks.log, "A finalizer.");
	deferred.callback(2);
	return deferred;
}

function create_delayed() {
	delayed = Sparks.delayed(1, function() { Sparks.log("notime"); delayed.start(); });
	return delayed;
}

function create_deferred_lock() {
	lock = Sparks.deferred_lock();
	first_lock = lock.acquire();
	second_lock = lock.acquire();
	first_lock.add_listener(function() { Sparks.log("First lock acquired."); });
	second_lock.add_listener(function() { Sparks.log("Second lock acquired."); });
	first_lock.add_finalizer(lock.release);
	second_lock.add_finalizer(lock.release);;
	return lock;
}
/*
function create_soft_release() {
	soft_lock = Sparks.deferred_lock();
	b = soft_lock.acquire();
	d = soft_lock.acquire();
	e = soft_lock.acquire(d);
	assert(e === d, "Protosoft lock didn't work.");
	soft_lock.soft_release(function() {
		Sparks.log("Releasing soft lock.");
		soft_lock.release();
	});
	assert(d === soft_lock.acquire(d), "Soft lock is bogus.");
}
*/

function create_soft_release() {
	soft_lock = Sparks.deferred_lock();
	soft_lock.acquire();
	d = soft_lock.acquire();
	soft_lock.acquire(d);
	soft_lock.acquire(d);
	c = soft_lock.acquire();
	soft_lock.acquire(d);
	g = soft_lock.acquire(d);
}

function create_gather_results() {
	function a() { 
		return Sparks.wait(3);
	}	
	function b() {
		return Sparks.deferred(true);
	}
	gather_results = Sparks.gather_results([a, b, Sparks.succeed(true)]);
	return gather_results;
}

function create_chain_results() {
	chain_results = Sparks.chain_results({
		initial:3, 
		values:[
			function foo(a) { return 3; },
			Sparks.succeed(),
			function foo(a) { return a - 2; }
		],
		coercer:function coercer(value) {
			return true;
		},
		processor:function processor(value) {
			return value === true || value === undefined;
		}
	});
	return chain_results;
}

/*** Unclassifiables ***/

function create_spriter(elem) {
	spriter = Sparks.spriter();
	elem && spriter.output(elem);
	return spriter;
}

function create_evaluator(elem) {
	var inputer = MochiKit.DOM.INPUT();
	inputer.style.width = "80em";
	MochiKit.DOM.swapDOM(elem, inputer);
	var debug_elem = MochiKit.DOM.getElement("debug");
	var inputted = [];
	var pos = 0;
	inputer.onkeydown = function evaluator_listener(event) {
		event = Sparks.dom_event.key_event(inputer, "onkeydown", event);
		switch(event.key().string) {
			case "KEY_ARROW_UP":
				if(pos === inputted.length) {
					var input = Sparks.trim(Sparks.get_content(inputer));
					if(input)
						inputted.push(input);
				}
				pos = Math.max(0, pos - 1);
				Sparks.set_content(inputer, inputted[pos]);
				break;
			case "KEY_ARROW_DOWN":
				pos = Math.min(pos + 1, inputted.length);
				if(pos === inputted.length) {
					Sparks.set_content(inputer, "");
					return;
				}
				Sparks.set_content(inputer, inputted[pos]);
				break;
			case "KEY_ENTER":
			case "KEY_REVERSE_SOLIDUS":
				var input = Sparks.trim(Sparks.get_content(inputer));
				var hold_bottom = 
					debug_elem.scrollHeight === debug_elem.scrollTop + debug_elem.clientHeight;
				var height = debug_elem.scrollTop;
				try {
					if(input === "clear" || input === "cls") {
						Sparks.set_content(debug_elem, "");
					} else {
						var evald = Sparks.get_content(inputer);
						inputted.push(evald);
						evald += "\n" + eval(evald);
						if(evald !== undefined)
							Sparks.log_joined(evald);
					}
				} catch(e) {
					Sparks.log_joined("ERROR:", MochiKit.Base.repr(e));
				}
				Sparks.set_content(inputer, "");
				if(hold_bottom)
					debug_elem.scrollTop = debug_elem.scrollHeight;
				else
					debug_elem.scrollTop = height;
				pos = inputted.length;
				break;
			default:
				return;
		}
		event.stop();
	}
}
