Sparks.lazy_pager = function lazy_pager(options) {
	options = options || {};
	var that = {
		toString:function toString() { return "Sparks.LazyPager"; }
	};

	that.requester = options.requester || function requester(key) {
		assert(that.url, "Sparks.lazy_pager.requester(key): URL required for default requester.");
		return Sparks.xhr_deferred({
			url:typeof that.url === "function" ? that.url(key) : Sparks.interpolate(that.url, key)
		});
	}
	that.add_post_processor = Sparks.listener_adder(that.post_processors = [], true);
	that.processor = options.processor || Sparks.blind;

	var cached = {};
	var cache_order = [];
	that.cache_length = options.cache_length || 0;

	that.fetch = function fetch(key) {
		if(key in cached)
			return cached[key].item;
		function post_process(item) {
			packet.item = that.processor(item) || item;
			packet.sanitizers = Sparks.map_call(that.post_processors, item, key, that);
		}
		cache_order.push(key);
		var packet = cached[key] = {key:key, item:that.requester(key)};
		Sparks.is_deferred(packet.item) ?
			packet.item.add_quiet_listener(post_process) :
			post_process(packet.item);
		packet.sanitize = function sanitize() {
			Sparks.add_listener(packet.item, function sanitizer() {
				Sparks.exhaust(packet.sanitizers, packet.item, key, that);
			});
		};
		//that.cache_length > cache_order.length && that.flush(cache_order[0]);
		return packet.item;
	}
	that.fetch_all = function fetch_all(items) {
		return Sparks.map(items, that.fetch);
	}

	that.flush = function flush(key) {
		if(arguments.length)
			return shift(key).item;
		return Sparks.map(cache_order, shift);
	}
	that.flush_all = Sparks.list_applier(that.flush);

	function shift(key) {
		key = cache_order.splice(arguments.length ? Sparks.find_value(cache_order, key) : 0, 1)[0];
		var packet = cached[key];
		packet.sanitize();
		delete cached[key];
		return packet;
	}

	return that;
}
