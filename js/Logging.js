Sparks.log_repr = function log_repr(/* ... */) {
	return Sparks.print_to_console.apply(null, Sparks.map(arguments, MochiKit.Base.repr));
}

Sparks.log_interpolated  = function log_interpolated(/* ... */) {
	return Sparks.print_to_console(Sparks.interpolate.apply(null, arguments));
}

Sparks.log_joined = function log_joined(/* ... */) {
	return Sparks.print_to_console(Sparks.join.apply(null, arguments));
}

Sparks.log = function log(message) {
	if((typeof message === "string" && message.match(/%/)) || 
		(arguments.length === 2 && typeof arguments[1] === "object")) {
		return Sparks.log_interpolated.apply(null, arguments);
	}
	return Sparks.log_joined.apply(null, arguments);
}

Sparks.log_urgent = function log_urgent(message) {
	return Sparks.print_to_console(Sparks.interpolate.apply(null, arguments), true);
}

Sparks.print_to_console = function print_to_console(message, force_print) {
//	if(!force_print && Sparks.debug) return;
	if(Sparks.log.print_message) {
		Sparks.log.print_message(message);
		return message;
	}
	var printers = [
		function log(message) { 
			message = message || "";
			var elem = MochiKit.DOM.getElement("debug");
			if(elem.tagName.match(/(input|textarea)/i))
				elem.value += message + "\n";
			else	
				elem.innerHTML += MochiKit.DOM.escapeHTML(message.replace(/\n/g, "<br/>")) + "<br/>";
		},
		function log(message) { console.log(message); },
		function log(message) { console.log(message.replace(/%/g, "\uFF05")); },
		function log(message) { opera.postError(message); },
		function log(message) { Debug.writeln(message); },
		function log(message) { debug.trace(message); }
	];
	for(var i in printers) {
		try {
			printers[i](message);
			Sparks.log.print_message = printers[i];
			return message;
		} catch(e) {
			// pass
		}
	}
	Sparks.log.print_message = MochiKit.Base.noop;
}

log_joined = Sparks.log_joined;
log = Sparks.log;
