Sparks.deferred = function deferred(options) {
	//Sparks.deferred.count = Sparks.deferred.count || 0;
	//Sparks.log_joined("Deferreding", Sparks.deferred.count++);
	options = arguments.length ? options : {};
	if(typeof options === "boolean") {
		if(options) {
			options = {result:true, state:"callbacked"};
		} else {
			options = {result:false, state:"errbacked"};
		}
	}
	if("result" in options && !options.state) {
		options.state = "callbacked";
	}

	var that = {};
	that.type = "Deferred";
	that.id = Sparks.generate_id(that);

	that.state = options.state || "unfired";
	that.fired = that.state !== "unfired";
	that.result = options.result;

	that.finalized = false;

	assert(typeof that.result === "undefined" || that.state !== "unfired", 
		"Sparks.deferred: Result specified, but state was not."
	);

	that.__repr__ = function __repr__() {
		return "Sparks.deferred(id:"+that.id+", state:"+that.state+")";
	}
	that.toString = Sparks.toString;

	that.exhaust = function exhaust(state, result, quiet) {
		that.state = state || that.state;
		if(that.state === "unfired") {
			if(that.lazy_evaluator && !quiet) {
				/* exhaust is called when some type of listener is added, 
					so if we want to only compute our result when it's needed,
					we can do it here. */
				var res = that.lazy_evaluator(that);
				that.lazy_evaluator = undefined;
				if(res)
					that.callback(res);
			}
			return;
		}
		that.fired = true;
		if(state)
			that.result = result;
		if(that.state === "callbacked") {
			var listeners = that.listeners;
			that.catchers = [];
		} else {
			var listeners = that.catchers;
			that.listeners = [];
		}
		if(listeners.length)
			assert(!that.finalized, "Sparks.deferred.exhaust: Already been finalized.");
		while(listeners.length) {
			listeners.shift()(that.result);
		}
		while(that.finalizers.length) {
			that.finalized = true;
			that.finalizers.shift()(that.result);
		}
		return;
	}

	that.callback = function callback(result) {
		assert(that.state === "unfired", 
			"Sparks.deferred.callback: This deferred already has a result."
		);
		that.exhaust("callbacked", result);
	}

	that.errback = function errback(result) {
		assert(!that.state !== "errbacked", 
			"Sparks.deferred.errback: This deferred has already been errbacked."
		);
		that.exhaust("errbacked", result);
	}

	that.listeners = [];
	that.catchers = [];
	that.finalizers = [];

	var add_handler = function add_handler(handler_list) {
		if(arguments[0] === true)
			handler_list = that.listeners;
		handler_list.push.apply(handler_list, Sparks.coerce_array(
			Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1))
		));
		that.exhaust(undefined, undefined, arguments[0] === true);
	}

	that.add_listener = Sparks.obj_func(add_handler, that.listeners);
	that.add_catcher = Sparks.obj_func(add_handler, that.catchers);
	that.add_finalizer = Sparks.obj_func(add_handler, that.finalizers);
	that.add_quiet_listener = Sparks.obj_func(add_handler, true);

	options.listeners && that.add_listener(options.listeners);
	options.catchers && that.add_catcher(options.catchers);
	options.finalizers && that.add_finalizer(options.finalizers);

	that.timer = options.timer;
	if(that.timer) {
		that.name = options.name || "Deferred";
		if(that.timer === true)
			that.timer = new Date();
		if(Sparks.debug) {
			that.add_listener(function timer_printer() {
				Sparks.log("%id successful. (name:%nm, duration:%ms milliseconds)", 
					that.id, that.name, (new Date()).getTime() - that.timer.getTime()
				);
			});
			that.add_catcher(function timer_printer() {
				Sparks.log("%id failed. (name:%nm, duration:%ms milliseconds)", 
					that.id, that.name, (new Date()).getTime() - that.timer.getTime()
				);
			});
		}
	}

	/* Some convenience stuff. This stuff is by no means essential to the
		above process. */
	that.lazy_evaluator = options.lazy_evaluator;
	that.cancel = options.cancel || that.errback;
	that.forward_to = function forward_to(deferred, result_type, processor) {
		if(!result_type)
			result_type = "both";
		if(result_type === "both" || result_type.match(/callback/)) {
			if(processor) {
				that.add_listener(function(res) {
					deferred.callback(processor(res));
				});
			} else {
				that.add_listener(deferred.callback);
			}
		}
		if(result_type === "both" || result_type.match(/errback/)) {
			if(processor) {
				that.add_catcher(function(res) {
					deferred.errback(processor(res));
				});
			} else {
				that.add_catcher(deferred.errback);
			}
		}
    }

	that.forward_from = function forward_from(deferred, result_type, processor) {
		deferred.forward_to(that, result_type, processor);
	}

	return that;
}

Sparks.is_deferred_lock = function is_deferred_lock(obj) {
	return obj && typeof obj === "object" && obj.type === "DeferredLock";
}

Sparks.deferred_lock = function deferred_lock() {
	var that = {};

	that.type = "DeferredLock";

	if(Sparks.debug)
		that.id = Sparks.generate_id(that);

	that.queue = [];
	that.history = [];

	that.locked = false;

	that.toString = Sparks.toString;
	that.__repr__ = function __repr__() {
		return "Sparks.deferred_lock(locked:"+(that.soft_releaser ? "softlocked" : that.locked)+")";
	}

	var dispatch = function dispatch() {
		if(that.locked || !that.queue.length)
			return;
		that.history.push("Dispatching");
		that.locked = true;
		that.queue[0].callback(that);
	}

	that.release = function release() {
		assert(that.locked, "Sparks.deferred_lock: Released unlocked lock.");
		that.history.push(["Release: ", that.queue.length].join(" "));
		that.queue.shift();
		that.locked = false;
		dispatch();
	}

	that.acquire = function acquire(deferred) {
		that.history.push(["Acquire: ", deferred, that.queue.length].join(" "));
		if(!that.queue.length || !deferred) {
			if(that.soft_releaser) {
				that.history.push("Deleting soft release");
				var releaser = that.soft_releaser.releaser;
				delete that.soft_releaser;
				releaser(that);
			}
			var lock = Sparks.deferred();
			that.queue.push(lock);
			dispatch();
			that.history.push("Creating and returning new lock.");
			return lock;
		}
		if(that.soft_releaser && that.soft_releaser.deferred === deferred) {
			//Sparks.log("Returning preacquired lock. :D");
			that.history.push("Using preacquired soft lock");
			return deferred;
		}
		if(Sparks.last(that.queue) === deferred) {
			//Sparks.log("Returning unacquired lock. :D");
			that.history.push("Using unacquired soft lock");
			return deferred;
		}
		var lock = Sparks.deferred();
		that.queue.push(lock);
		that.history.push("Returning new lock.");
		return lock;
	}

	that.soft_release = function soft_release(releaser) {
		that.history.push(["Soft Releasing this lock: (Has soft-releaser:", !!that.soft_releaser, "QueueLength:", that.queue.length].join(" "));
		assert(that.locked, "Sparks.deferred_lock: Soft-released unlocked lock.");
		if(that.soft_releaser) {
			that.history.push("Friendly soft release, ignoring.");
			return;
		}
		var deferred = that.queue[0];
		that.history.push("Creating soft release");
		that.soft_releaser = {deferred:deferred};
		if(that.queue.length > 1) {
			that.history.push("Immediately releasing soft release");
			that.soft_releaser.releaser = Sparks.noop;
			return deferred.add_listener(function() {
				delete that.soft_releaser;
				releaser(that);
			});	
		} else {
			that.soft_releaser.releaser = releaser;
		}
	}

	return that;
}

Sparks.xhr = function xhr(options) {
	if(Sparks.xhr.maker)
		return Sparks.xhr.maker();
	var xhr_makers = [
		function xhr_maker() { return new XMLHttpRequest(); },
		function xhr_maker() { return new ActiveXObject('Msxml2.XMLHTTP'); },
		function xhr_maker() { return new ActiveXObject('Microsoft.XMLHTTP'); },
		function xhr_maker() { return new ActiveXObject('Msxml2.XMLHTTP.4.0'); },
	];
	for(var i in xhr_makers) {
		try {
			var maker = xhr_makers[i];
			Sparks.xhr.maker = maker;
			return maker();
		} catch (e) { /* pass */ }
	}
	assert(false, "Browser does not support XMLHttpRequest");
}

/*
options:
	url - required.
	method - "GET", "POST"
	content - content to send (will be coerced internally to a string)
	username
	password
	headers - an object of headers. For example, {"Accept":"application/json"}
	mime_type - "text/plain", etc.
	query_string - value passed to MochiKit's queryString
	json - boolean indicating whether this should be a json request.
	immediate - boolean indicating whether this should be dispatch()d immediately.
	processor - process our result before it's passed to listener
*/
Sparks.xhr_deferred = function xhr_deferred(options) {
	if(typeof options === "string")
		options = {url:options};
	options = options || {};
	var that = Sparks.deferred(options);

	that.dispatched = false;

	// XHR options
	that.method = options.method;
	that.content = options.content;
	that.url = options.url;
	that.username = options.username;
	that.password = options.password;
	that.headers = options.headers || {};
	that.mime_type = options.mime_type;
	that.query_string = options.query_string;
	that.json = options.json;
	that.processor = options.processor || Sparks.blind;

	that.xhr = Sparks.xhr();

	var clear_xhr = function clear_xhr() {
		try {
			that.xhr.onreadystatechange = null;
		} catch (e) {
			try {
				that.xhr.onreadystatechange = MochiKit.Base.noop;
			} catch (e) { /* pass */ }
		}
		that.xhr.abort();
	}
	that.add_finalizer(clear_xhr);

	var xhr_listener = function xhr_listener() {
		if(that.xhr.readyState !== 4)
			return;
		try {
			var status = that.xhr.status;
			switch(status) {
				case 0:
				case undefined:
					// Local or otherwise cached content.
					if(MochiKit.Base.isNotEmpty(that.xhr.responseText))
						throw new Error("XHR: Status is undefined, but responseText is, too.");
					status = 304;
				case 200: // OK
				case 201: // CREATED
				case 204: // NO CONTENT
				case 304: // NOT MODIFIED
				case 1223: // Presumably a WinInet code.
					that.callback(that.processor(
						that.json ? Sparks.parse_json(that.xhr.responseText) : that.xhr
					));	
					clear_xhr();
					return;
				default:
					clear_xhr();
					throw new Error("XHR: Request failed.");
			}
		} catch(e) {
			assert(false, Sparks.join(e));
			that.errback(e);
		}
	}

	that.dispatch = function dispatch() {
		if(that.dispatched)
			return;
		that.dispatched = true;
		// Process our options.
		if(that.json) {
			that.mime_type = that.mime_type || "text/plain";
			that.headers["Accept"] = "application/json";
		} else {
			that.mime_type = "text/xml";
		}
		if(that.query_string) {
			that.query_string = MochiKit.Base.queryString(that.query_string);
			if(that.query_string)
				that.url += "?" + that.query_string;
		}
		that.method = that.method || "GET";
		that.xhr.open(that.method, that.url, true, that.username, that.password);
		if(that.mime_type) {
			assert(that.xhr.overrideMimeType, 
				"XHR: overrideMimeType is falsy. (Probably unimplemented)"
			);
			that.xhr.overrideMimeType(that.mime_type);
		}
		if(that.headers) {
			// Process all headers.
			that.headers = Sparks.coerce_array(that.headers);
			for(var i in that.headers)
				that.xhr.setRequestHeader(i, that.headers[i]);
		}
		that.content = that.content || '';
		// Send the XHR.
		try {
			that.xhr.onreadystatechange = xhr_listener;
			that.xhr.send(that.content);
		} catch(e) {
			clear_xhr();
		}
	}

	if(options.immediate)
		that.dispatch();
	else
		that.lazy_evaluator = that.dispatch;

	return that;
}


