// Sparks.Asynchronous

Sparks.is_deferred = function is_deferred(obj) {
	return !!obj && typeof obj === "object" && obj.type === "Deferred";
}

Sparks.succeed = function succeed(res) {
	return Sparks.deferred({result:res, state:"callbacked"});
}

Sparks.fail = function fail(res) {
	return Sparks.deferred({result:res, state:"errbacked"});
}

Sparks.delayed = function delayed(delay/*, ... */) {
	var timeout, last_mark;
	var that = {
		delay:delay || 1,
		func:Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1)),
		started:false,
		delta:function delta(mark) {
			var delta = 0, current = (new Date()).getTime();
			if(last_mark)
				delta = current - last_mark;
			if(mark)
				last_mark = current;
			return delta;
		},
		mark:function mark() {
			return last_mark = (new Date()).getTime();
		},
		stop:function stop() {
			that.started && clearTimeout(timeout);
			that.started = timeout = false;
			return that;
		},
		restart:function restart() {
			that.stop();
			that.start();
		},
		start:function start() {
			last_mark = (new Date()).getTime();
			if(that.started)
				return;
			that.started = true;
			timeout = setTimeout(function() {
				that.stop();
				that.func();
			}, Math.floor(that.delay * 1000));
			return that;
		},
		force:function force() {
			return that.func.apply(null, arguments);
		},
		trigger:function trigger() {
			return that.func();
		}
	};
	return that;
}

Sparks.add_listener = function add_listener(deferred) {
	var listener = Sparks.obj_func.apply(null, Sparks.get_args(arguments, 1));
	return Sparks.reduce_deferred({listener:listener, deferred:deferred});
}

Sparks.wait = function wait(milliseconds) {
	var waiter = Sparks.deferred();
	waiter.add_catcher(function wait_catcher() {
		try {
			clearTimeout(timeout);
		} catch(e) {
			Sparks.log(e);
		}
	});
	var timeout = setTimeout(waiter.callback, Math.floor(milliseconds * 1000));
	return waiter;
}

	/* reduce_deferred
	options:
		coercer - takes nondeferreds and attempts to convert them to deferreds 
			(for example, this takes true and makes succeeds(), calls functions, etc.)
		processor(non_deferred) - if reduce_deferred is initially given a non-deferred, processor 
			should take that value and return a boolean indicating whether the listener or the catcher
			should be called.
		listener - attached as a callback of the final reduced result.
		catcher - attached as an errback of the final reduced result.
	*/
Sparks.reduce_deferred = function reduce_deferred(options, deferred) {
	deferred = arguments.length > 1 ? deferred : options.deferred;
	deferred = options.coercer ? options.coercer(deferred) : deferred;
	if(!Sparks.is_deferred(deferred)) {
		if(!options.processor || options.processor(deferred)) {
			options.listener(deferred);
			return true;
		} else {
			options.catcher(deferred);
			return false;
		}
	}
	options = MochiKit.Base.merge(options, {processor:undefined});
	options.listener && deferred.add_listener(Sparks.reduce_deferred, options);
	options.catcher && deferred.add_catcher(options.catcher);
	return deferred;
}

/* Gathers a result of deferreds
options:
	values
	processor
*/
Sparks.gather_results = function gather_results(options) {
	if(options instanceof Array)
		options = {values:options};
	options = options || {};

	var that = Sparks.deferred();

	that.values = options.values ? options.values.slice() : [];
	that.coercer = options.coercer || function coercer(value) {
		return typeof value === "function" ? that.coercer(value()) : value;
	};
	that.processor = options.processor;

	that.lazy_evaluator = function lazy_evaluator() {
		for(var i = 0; i < that.values.length;i++) {
			if(that.values[i] === undefined)
				that.values.splice(i--, 1);
		}
		var dispatched = that.values.length;
		if(!dispatched)
			return that.callback([]);
		var results = [];
		var errors = [];
		function handle_result(pos, succeeded, result) {
			(succeeded ? results : errors)[pos] = result;
			if(--dispatched > 0)
				return;
			if(!that.fired)
				errors.length ? that.errback(errors) : that.callback(results);
		}
		for(var i in that.values) {
			Sparks.reduce_deferred({
					coercer:that.coercer, 
					processor:that.processor,
					listener:Sparks.obj_func(handle_result, i, true),
					catcher:Sparks.obj_func(handle_result, i, false)
				},	
				that.values[i]
			);
		}	
	}

	return that;
}

/*
options:
	immediate - boolean whether to iterate immediately
	values - array of results
*/
Sparks.chain_results = function chain_results(options) {
	if(options instanceof Array)
		options = {values:options, immediate:true};
	var values = Sparks.coerce_array(options.values).slice();
	var returning = Sparks.deferred();
	var cumulative = options.initial;
	function iterate(result) {
		cumulative = (!!result && result !== returning) ? result : cumulative;
		if(!values.length)
			return returning.callback(cumulative);
		Sparks.reduce_deferred({
				listener:iterate,
				coercer:options.coercer || function coercer(value) {
					return typeof value === "function" ? value(cumulative) : value;
				},
				catcher:returning.errback
			},
			values.shift()
		);
	}
	options.immediate ? iterate() : returning.lazy_evaluator = iterate;
	return returning;
}
