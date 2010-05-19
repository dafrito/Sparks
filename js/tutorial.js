Sparks.presenter_tutorial = function presenter_tutorial(parent) {
	// Make a presenter!
	// Our "Titled" means we're using the Titled hierarchy
	var presenter = Sparks.presenter("Titled");

	// A simple list of some users.
	var list = Sparks.list([
		{name:"ed_fredermeyer", email:"fred@doom.com"},
		{name:"joe_bobbenstein", email:"bob@doom.com"}
	]);

	// Set the title processor.
	presenter.set_processor("title", function(working, user) {
		// proper_nounize() makes "ed_fred" become "Ed Fred"
		return Sparks.proper_nounize(user.name);
	});		

	// Set the content processor.
	presenter.set_processor("content", function(working, user) {
		var remove = Sparks.button("Remove");
		// Make a simple button that removes the item.
		// Notice that we have to strip_args, otherwise the listener's args
		// will be passed to list.remove(), which will cause errors.
		remove.add_listener(Sparks.strip_args(list.remove, user));
		// Return an array of the stuff we want in this part of the tree.
		// Notice that we don't have to return DOM, just DOM-coercible stuff.
		return [user.email, remove];
	});		

	// Make an element list!
	var elements = Sparks.element_list();

	// We set our process_item to use our presenter.
	// This is mostly a generic function whenever you're using presenters
	// with ElementLists.
	elements.process_item = function(item) {
		var elem = Sparks.create_valid_child(elements.parent);
		return presenter.present_to_placeholder(item, elem);
	};

	// Finally, we output it to a parent.
	// Depending on the element you passed to this tutorial, your output will be
	// marginally different, as Presenters will use that node as a parent and make
	// the correct children for it. A TBODY inside a TABLE will work best.
	elements.output_to_parent(parent, list);
}		

Sparks.dict_tutorial = function dict_tutorial() {
	// Make a dict!
	var dict = Sparks.dict();

	// Set some stuff.
	dict.set("no", "time");

	// We can set a default for some missing keys
	dict.defaulter = function(key) {
		return "Unknown";
	}
	assert(dict.get("unknown_key") === "Unknown");
	
	// Get a value.
	var time = dict.get("no");

	// We can watch a key for changes.
	var watcher = dict.watch("no");
	assert(watcher.value === "time");

	// Our watcher will update as our dict changes
	dict.set("no", "bananas");
	assert(watcher.get_value() === "bananas");

	// We can add listeners to our watcher that fire
	// wehn the key is changed
	watcher.add_listener(function(value) {
		Sparks.log(value);
	});

	// This could just as well be done inline:
	watcher.add_listener(Sparks.log);

	// We can add processors too, that can change
	// the value that's passed to our listeners.
	watcher.add_processor(Sparks.proper_nounize);
	assert(watcher.get_value() === "Bananas");

	// Observe that it doesn't affect the dict's value.
	assert(dict.get("no") !== watcher.get_value());

}

Sparks.list_tutorial = function list_tutorial() {
	// 1. Make a list!
	var list = Sparks.list();

	// Lets instead start with a List with items in it.
	list = Sparks.list(["a","b", "c"]);

	// We can also add items, of course.
	list.add("d");

	// Add them in a bunch, too.
	list.add("e", "f", "g");

	// Move them. List is now ["e", "a", "b", "c", "d", "f", "g"]
	list.move("e", 0);

	// Remove, too. ["e", "b", "c", "d", "f", "g"]
	list.remove("a");

	// Reversing works too. ["g", "f", "d", "c", "b", "e"]
	list.reverse();

	// We can get a pointer to an item in our list.
	var pointer = list.get("d");
	assert(pointer.position === 2);

	// We can also get it by position
	var pointer = list.at(2);

	// Observe that our pointer watches our list for changes.
	list.remove("g");
	assert(pointer.position === 1);

	// If our pointer's item is removed, our pointer will be frozen.
	list.remove("d");
	assert(pointer.position === 1 && pointer.frozen);

	// Observe how it no longer responds to events in the list.
	list.remove("c");
	assert(pointer.position === 1);

	// It's wise to explicitly freeze pointers once you're done with them.
	pointer.freeze();
	// Of course, this one's already frozen, so this doesn't change anything.

	// We can iterate over lists using our iterable functions.
	Sparks.map(list, function(item) {
		Sparks.log(item);
	});

	// A shorter way to do the above, would be to pass the Sparks.log function directly.
	Sparks.map(list, Sparks.log);

	// You can also pass arguments along to the function you provide:
	// This will print "Text:a", "Text:b", "Text:c", etc.
	Sparks.map(list, Sparks.log, "Text:") 

	// All iterable functions work in this manner. (filtered is ["c"])
	var filtered = Sparks.filter(list, Sparks.compare, "c");
}
