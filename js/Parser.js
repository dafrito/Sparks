Sparks.parse_json = function parse_json(json) {
	// lol, it's a parser.
	return eval(json);
	var parser = function parser() {
		var match, value, match_length;
		if(match = json.match(/^\s*(-)?\d+(\.\d*)?([eE]([+-])?\d+)?/)) {
			value = parseFloat(match[0]);
		} else if(match = json.match(/^\s*"(.*?[^\\])"/)) {
			value = match[1];
		} else if(match = json.match(/^\s*(true|false)/)) {
			value = match[0] === "true";
		} else if(match = json.match(/^\s*null/)) {
			value = null;
		} else if(match = json.match(/^\s*{/)) {
			// It's an object, so churn through its key/value pairs.
			json = json.substr(match[0].length);
			var returning = {};
			while(!(match = json.match(/^\s*}/))) {
				var key = parser();
				assert(typeof key === "string", "Sparks.parse_json: Key must be a string.");
				json = json.substr(json.match(/^\s*:/)[0].length);
				var value = parser();
				match = json.match(/^\s*,/);
				if(match)
					json = json.substr(match[0].length);
				returning[key] = value;
			}
			json = json.substr(match[0].length);
			return returning;
		} else if(match = json.match(/\s*\[/)) {
			// It's an array.
			json = json.substr(match[0].length);
			var returning = [];
			while(!(match = json.match(/^\s*]/))) {
				returning.push(parser());
				match = json.match(/^\s*,/);
				if(match)
					json = json.substr(match[0].length);
			}
			json = json.substr(match[0].length);
			return returning;
		}
		assert(typeof value !== "undefined", "Sparks.parse_json: Value is undefined");
		json = json.substr(match[0].length);
		return value;
	}
	var value = parser();
	assert(json.match(/^\s*$/), "Sparks.parse_json: Remaining unparsed elements found. (json:'"+json+"')");
	return value;
}
