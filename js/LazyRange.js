Sparks.lazy_range = function lazy_range(options) {
	options = options || {};
	var that = {};

	that.ranger = Sparks.ranger();
	that.results = [];

	that.requester = options.requester || function requester(start, end) {
		assert(that.url, "Sparks.lazy_range.requester(start, end): URL required for default requester.");
		return Sparks.xhr_deferred({
			url:typeof that.url === "function" ? 
				that.url(start, end) : 
				Sparks.interpolate(that.url, start, end)
		});
	}
	that.processor = Sparks.blind;
	that.comparator = Sparks.operator.seq;

	that.fetch = function fetch(start, end) {
		Sparks.debug && Sparks.log("Sparks.lazy_range.fetch:", {start:start, end:end});
		var missing = that.ranger.add_range(start, end);
		Sparks.add_listener(Sparks.gather_results(Sparks.map(missing, 
			function(range) {
				return that.requester(range.start, range.end);
			})), 
			function listener(results) {
				results = Sparks.flatten(results, function skipper(array) {
					return array.length === 2 && 
						typeof array[0] === "number" && 
						typeof array[1] === "number";
				});
				results = Sparks.map(results, that.processor);
				results = Sparks.filter(results, function(item) {
					return !Sparks.is_found(that.results, item, that.comparator);
				});
				that.results.push.apply(that.results, results);
				Sparks.map_call(that.listeners, results);
			}
		);
	}

	that.add_listener = Sparks.listener_adder(that.listeners = []);

	return that;
}
