Sparks.ranger = function ranger(options) {
	options = options || {};
	var that = Sparks.set(MochiKit.Base.update(options, {proxied:false}));

	that.converter = function converter(item) {
		return typeof item === "number" ? item : item.value;
	}

	function node(value, side) { return {value:value, side:side}; }

	that.add_range = function add_range(start, end) {
		Sparks.debug && Sparks.log("Sparks.ranger.add_range:", {start:start, end:end});
		var slice = that.slice(start, end);
		var removing = slice.slice();
		var adding = [];
		var gaps = [];
		if(slice.length) {
			/* We need to fake borders for our item so that we return the correct series of
				ranges needed to fill the gaps. */
			if(slice[0].side === "start") {
				slice.unshift(node(start, "end"));
				adding.push(node(start, "start"));
			}
			if(Sparks.last(slice).side === "end") {
				slice.push(node(end, "start"));
				adding.push(node(end, "end"));
			}
			assert(slice.length % 2 === 0, "Slice isn't even!");
		} else {
			var nearest = that.get(end, "highest");
			nearest.freeze();
			if(nearest.valid() && nearest.item().side === "end") {
				// We're completely inside viewed territory, so just return.
				return [];
			}
			removing = that.slice(start, end, true);
			gaps.push({start:start, end:end});
			if(removing.length === 1) {
				if(!that.compare(start, removing[0])) {
					adding = [node(end, "end")];
				} else {
					adding = [node(start, "start")];
				}
			} else if(!removing.length) {
				adding = [node(start, "start"), node(end, "end")];
			}
		}
		that.remove_all(removing);
		that.add_all(adding);
		while(slice.length)
			gaps.push({start:slice.shift().value, end:slice.shift().value});
		return gaps;
	}

	return that;
}
