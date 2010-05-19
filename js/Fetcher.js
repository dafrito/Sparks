// Sparks.fetcher 2.0

/*
	Select DOM elements using CSS selector syntax.
*/

Sparks.fetch = function(fetcher_rules, context) {
	return MochiKit.Base.flattenArray(
		Sparks.fetch_elements(fetcher_rules, context || MochiKit.DOM.currentDocument())
	);
}

Sparks.fetch_elements = function(fetcher_rules, context) {
	Sparks.debug && Sparks.log("Sparks.fetch_elements", {rules:fetcher_rules, context:context});
	var IDENTIFIER = 1;
	var NAME = 2;
	var REMAINING = 3;
	// We've exhausted our rules, so what we have is a result.
	if(!fetcher_rules)
		return context;
	// No context, so our previous search found nothing, so return nothing.
	if(!context)
		return;
	// Trim our rules, and get the identifier, the name, and the remainder.
	fetcher_rules = Sparks.trim(fetcher_rules);
	var current_rule = fetcher_rules.match(/^([#.:\[])?([^.: \]]*)(.*)?/);
	assert(current_rule, "Sparks.fetch_elements: Invalid syntax.", {str:fetcher_rules});
	switch(current_rule[IDENTIFIER]) {
		case "#":
			// We've found an id, so recurse using that as our context if its a child of context.
			var elem = MochiKit.DOM.getElement(current_rule[NAME]);
			if(current_rule[REMAINING]) {
				if(MochiKit.DOM.isParent(elem, context))
					return Sparks.fetch_elements(current_rule[REMAINING], elem);
			} else {
				return elem ? [elem] : [];
			}
		case ".":
			// It's a class name, so for every class-match, continue the search.
			var elements = MochiKit.DOM.getElementsByTagAndClassName(
				null, current_rule[NAME], context
			);
			if(current_rule[REMAINING])
				return Sparks.map(elements, Sparks.fetch_elements, current_rule[REMAINING]);
			return elements ? elements : [];
		case "*":
			return Sparks.fetch_elements(current_rule[REMAINING], context);
		case ":":
			// It's a pseudo-class.
			throw "Not implemented.";
		case "[":
		case "]":
			// It's an attribute.
			throw "Not implemented.";
		default:
			// It's a tag name.
			return Sparks.map(
				MochiKit.DOM.getElementsByTagAndClassName(current_rule[NAME], null, context),
				Sparks.fetch_elements, 
				current_rule[REMAINING]
			);
	}
}
