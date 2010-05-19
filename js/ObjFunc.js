Sparks.is_obj_func = function is_obj_func(item) {
	return typeof item === "function";
}

Sparks.obj_func = function obj_func(/* ... */) {
	var args = Sparks.get_args(arguments);
	if(args.length === 1) {
		var first = args[0];
		if(Sparks.is_obj_func(first))
			return first;
		if(first instanceof Array)
			return Sparks.map(first, Sparks.obj_func);
		if(typeof first === "function")
			return first;
	}

	var that = function obj_func() {
		if(!that.obj && this)
			that.obj = this;
		var args = that.partials.concat(Sparks.get_args(arguments));
		if(typeof that.func === "string")
			return that.obj[that.func].apply(that.obj, args);
		return that.func.apply(that.obj, args);
	}

	that.__repr__ = function __repr__() {
		return Sparks.interpolate("Sparks.ObjFunc",
			{obj:that.obj, func:that.func, partials:that.partials.length}
		);
	}

	that.obj = args[0];
	if(typeof that.obj === "function") {
		that.func = that.obj;
		that.obj = null;
		that.partials = args.slice(1);
	} else {
		that.func = args[1];
		that.partials = args.slice(2);
	}

	if(typeof that.func === "function")
		that.toString = that.func.toString;
	else
		that.toString = that.__repr__;

	assert(that.func, "Function is not defined?");

	return that;
}
