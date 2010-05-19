Sparks.add_initializer("Adapter Registration", function adapter_registration() {
	function is_object(obj) { return !!obj && typeof obj === "object"; };

	function has_function(name) {
		return function(obj) { return is_object(obj) && typeof obj[name] === "function"; }
	};
	function is_type(types) { return function(obj) { types.indexOf(typeof obj) > -1; } };
	function call_function(name) { return function(obj) { return obj[name](); } };
	function is_instanceof(type) { return function(obj) { return obj instanceof type; } };

	function map_fxn(fxn) {
		return function mapper() {
			return Sparks.every(Sparks.map(Sparks.get_args(arguments), fxn));
		}
	}

	// repr Adapters

	var registry = MochiKit.Base.reprRegistry;
	registry.name = "repr";

	registry.register("Error Printer",
		is_instanceof(Error),
		function error_printer(error) {
			var strings = [];
			strings.push(error.message);
			if(!error.stack)
				return strings.join("");
			strings.push(" - call stack follows: ");
			var stack = error.stack.split("\n");
			for(var i in stack) {
				var stack_line = stack[i];
				if(!stack_line)
					continue;
				var groups = stack_line.match(
					/^(?:(\w*)\((.*)\))?@(?:(?:.*)\/sparks(?:20)?\/(?:js\/(?:external\/)?)?(.*))?:(\d*)$/
				);
				if(!groups && stack_line.match(/^@javascript:/)) {
					// We're in some funky immediate window (ala Firebug) so just hack together
					// a spew to describe that.
					groups = [];
				}
				assert(groups, "Error-printer: THE FUCKING REGEX HAS FAILED GOOD GOD NO");
				if(groups[2]) {
					groups[2] = Sparks.remove_function_bodies(groups[2]);
					groups[2] = groups[2].replace(/\((function \([^)]*\) \{[^}]*\})\s*[,)]/g, "$1");
					groups[2] = groups[2].replace(/,([^ ])/g, ", $1");
				}
				strings.push("\n");
				if(groups[3]) {
					strings.push("In ", groups[3], " at line ", groups[4]);
				} else {	
					strings.push("In an unnamed resource");
					if(parseInt(groups[4], 10)) {
						strings.push(" at line ", groups[4]);
					}
				}
				strings.push(
					":\n        ", 
					(groups[1] || "<unnamed>"),
					"(",
					(groups[2] || ""),
					")\n " // The extra space is essential; the debugger ignores empty newlines.
				);
			}
			return strings.join("");
		}
	);

	registry.register("Function printer", 
		is_type("function"), 
		Sparks.remove_function_bodies
	);

	registry.register("DOM Printer",
		Sparks.is_dom,
		function dom_printer(dom) { return MochiKit.DOM.emitHTML(dom).join(""); }
	);

	registry.register("Document Printer",
		Sparks.obj_func(Sparks.operator.seq, document),
		function document_printer(dom) { return "Document"; }
	);

	// Comparator Adapters

	var registry = MochiKit.Base.comparatorRegistry;
	registry.name = "Comparator";

	// If a and b are ItemPointers, compare their positions.
	registry.register("ItemPointer comparator",
		map_fxn(Sparks.is_item_pointer),
		function item_pointer_comparator(a, b) {
			return MochiKit.Base.compare(a.position, b.position);
		}
	);

});
