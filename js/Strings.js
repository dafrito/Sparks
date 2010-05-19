// Sparks.Strings

Sparks.lowercase = "abcdefghijklmnopqrstuvwxyz"
Sparks.uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
Sparks.numbers = "0123456789"

Sparks.trim = function trim(str) {
	return str.replace(/^\s*|\s*$/, "");
}

Sparks.parse_css = function parse_css(style) {
	if(typeof style !== "string")
		return style;
	var rules = Sparks.trim(style).split(/\s*;\s*/);
	style = {};
	for(var i in rules) {
		var rule = rules[i].split(/\s*:\s*/);
		if(rule[0] || rule[1])
			style[rule[0]] = rule[1];
	}
	return style;
}

Sparks.get_hex_string = function get_hex_string(str) {
	return Sparks.convert_string(str, "hex");
}

Sparks.convert_string = function convert_string(str, dest_type) {
	var nums = [];
	if(typeof str === "string") {
		if(str.match(/^(-)?[0-9a-f]+$/i) && str.length % 8 === 0) {
			// All hexadecimal looking, so it's a hex to us too.
			if(dest_type === "hex")
				return Sparks.split_string(str, 8);
			for(var i = 0; i < str.length; i += 2) {
				nums.push(parseInt(str.substr(i, 2), 16));
			}
		} else {
			if(dest_type === "hex_string") {
				for(var i in str) {
					var char = str.charAt(i);
					nums.push((str.charCodeAt(i) & 0xff).toString(16));
				}
				return nums;
			}
			// It's almost certainly a string.
			if(dest_type === "string")
				return str;
			for(var i in str) {
				nums.push(str.charCodeAt(i));
			}
		}
	} else if(str instanceof Array) {
		str = MochiKit.Base.flattenArray(str);
		if(typeof str[0] === "string") {
			// It's an array of base-16 numbers.
			if(dest_type === "hex")
				return str;
			for(var i in str) {
				nums.push(parseInt(str[i], 16));
			}
		} else {
			// It's an array of base-10 numbers.
			if(dest_type === "number")
				return str;
			if(dest_type === "binary") {
				for(var i in str) {
					nums.push(str[i].toString(2));
				}
				return nums;
			} else {
				for(var i in str) {
					var num = str[i];
					var hex_string = "";
					/* This just takes a charcode, and makes it into
						a hex that is always 8-characters long, and
						is unsigned. " " --> 0x00000020 */
					for (var i = 7; i >= 0; i--) {
						var digit = (num >>> (i*4)) & 0xf; 
						hex_string += digit.toString(16); 
					}
					nums.push(hex_string);
				}
			}
		}
	} else {
		nums = [str];
	}
	return Sparks.convert_string(nums, dest_type);
}

Sparks.split_string = function split_string(string, length) {
	var parts = [];
	while(string.length > 0) {
		var part = string.substr(0, length);
		string = string.substr(length);
		parts.push(part);
	}
	return parts;
}

Sparks.fibonacci_obfuscator = function fibonacci_obfuscator(base_string) {
	var obfuscated = "";
	var fibonacci = Sparks.fibonacci_iterator();
	for(var i in base_string) {
		obfuscated += base_string[i];
		var fibo_num = fibonacci.next();
		for(var j = 0; j < fibo_num; j++)
			obfuscated += Sparks.lowercase[Math.floor(Math.random() * 26)];
	}
	return obfuscated;
}

Sparks.fibonacci_deobfuscator = function fibonacci_deobfuscator(obfuscated) {
	var base_string = "";
	var fibonacci = Sparks.fibonacci_iterator();
	while(obfuscated.length > 0) {
		base_string += obfuscated[0];
		obfuscated = obfuscated.substr(1 + fibonacci.next());
	}
	return base_string;
}

Sparks.pad = function pad(padding_string, length, direction, padding) {
	padding_string = "" + padding_string;
	padding = padding || " ";
	while(padding_string.length < length) {
		switch(direction) {
			case "center":
				if(flag) {
					padding_string += padding;
				} else {
					padding_string = padding + padding_string;
				}
				var flag = !flag;
				break;
			case "right":
			case "back":
				padding_string += padding;
				break;
			case "front":
			case "left":
			default:
				padding_string = padding + padding_string;
		}
	}
	return padding_string;
}

Sparks.escape_for_xml = function escape_from_xml(unescaped) {
	var escaped = unescaped;
	escaped = escaped.replace(/&/g, "&amp;");
	escaped = escaped.replace(/"/g, "&quot;");
	escaped = escaped.replace(/'/g, "&apos;");
	escaped = escaped.replace(/</g, "&lt;");
	escaped = escaped.replace(/>/g, "&gt;");
	return escaped;
}

Sparks.unescape_html = function unescape_html(string) {
	var match;
	while(match = string.match(/\&\#([0-9a-fA-F]{1,4})/)) {
		var num = Sparks.pad(match[1], 4, "left", "0");
		string = string.replace(
			/\&\#([0-9a-fA-F]{1,4})/, 
			String.fromCharCode(parseInt(num, 16))
		);
	}
	return string;
}

Sparks.remove_function_bodies = function remove_function_bodies(string) {
	if(typeof string === 'function')
		string = string.toString();
	var replaced = string.replace(/{[^{}]*}/g, "/**/");
	if(replaced === string)
		return string.replace(/\/\*\*\//g, "{ ... }");
	return Sparks.remove_function_bodies(replaced);
}

// Returns an array of the filename and the extension.
Sparks.get_file_parts = function get_file_parts(filename) {
	var ext_split = filename.lastIndexOf(".");
	return [filename.slice(0,ext_split), filename.slice(ext_split)];
}

Sparks.print_array = function print_array(arr) {
	if(!(arr instanceof Array))
		return arr;
	var str = "[";
	for(var i in arr) {
		if(arr[i] instanceof Array)
			str += Sparks.print_array(arr[i]);
		else
			str += arr[i]
		if(i < arr.length-1) 
			str += ", "	
	}
	return str + "]";
}

Sparks.join = function join() {
	var args = Sparks.get_args(arguments);
	for(var i in args) {
		if(typeof args[i] === "string")
			continue;
		args[i] = MochiKit.Base.repr(args[i]);
	}
	return args.join(" ");
}

// Interpolate
Sparks.interpolate = function interpolate(string /*, ... */) {
	if(arguments.length === 1 && typeof string === "object")
		return Sparks.interpolate("", string);
	var args = Sparks.get_args(arguments, 1);
	if(!/%[a-zA-Z0-9_]+(%)?/.exec(string) && args.length === 1 && typeof args[0] === "object") {
		var obj = args.shift();
		var parts = [];
		for(var i in obj) {
			parts.push(i + ":" + MochiKit.Base.repr(obj[i]));
		}
		if(string.match(/[^ ]$/))
			string += " ";
		string += "(" + parts.join(", ") + ")";
	} else {
		for(var i = 0; i < args.length; i++)
			string = string.replace(/%[a-zA-Z0-9_]+(%)?/, MochiKit.Base.repr(args[i]));
	}
	return string;
}

// assert("Proper Nounize" === Sparks.proper_nounize("pROPER_nOUNIZE"));
Sparks.proper_nounize = function proper_nounize(name) {
	// TODO: Make this ignore prepositions and articles. "Dog in the Tree"
	if(typeof name == "object" || typeof name == "function")
		return Sparks.proper_nounize(typeof(name));
	var out = "";
	var pieces = (""+name).split(/[ _]/);
	for(var i in pieces) {
		var str = pieces[i].toString().toLowerCase();
		var first = str.charAt(0).toUpperCase();
		out += first + str.slice(1) + " ";
	}
	return out.slice(0,-1);
}

Sparks.is_lower_case = function is_lower_case(string) {
	return !string.match(/[A-Z]/);
}

Sparks.is_upper_case = function is_upper_case(string) {
	return !string.match(/[a-z]/);
}

// If num < 2, return singular, otherwise return plural.
// Defaults built in for convenience so that only num is required.
Sparks.pluralize = function pluralize(num, singular, plural) {
	singular = singular ? singular : "item";
	plural = plural ? plural : singular + "s";
	if(num == 0 || num > 1)
		return plural;
	return singular;
}

// assert("camel_case" === Sparks.snakerize("CamelCase"));
Sparks.snakerize = function snakerize(string) {
	string = string.replace(/ /g, "_");
	string = string.replace(/([A-Z]*)([A-Z][^A-Z_])/g, "$1_$2");
	string = string.replace(/([^A-Z_]+)([A-Z]*)$/, "$1_$2");
	string = string.replace(/^_|_$/g, "");
	return string.toLowerCase();
}
