Sparks.patterned_metalist = function patterned_metalist(options) {
	if(Sparks.is_list(options))
		options = {source:options};
	options = options || {};
	var that = Sparks.metalist(options);

	that.pattern = function pattern(items) {
		var pattern = [];
		for(var i in items)
			i % 2 === 0 && pattern.push(items[i]);
		return pattern;
	}	

	function update_list() {
		var pattern = that.pattern(Sparks.get_items(that.source));
		var items = Sparks.get_items(that.list);
		var pattern_position = 0, items_position = 0;
		var removing = [], adding = [];
		while(items_position < items.length || pattern_position < pattern.length) {
			if(items[items_position] === pattern[pattern_position]) {
				pattern_position++;
				items_position++;
				continue;
			} else if(items_position >= items.length) {
				adding.push(pattern[pattern_position++]);
			} else {
				removing.push(Sparks.item_pointer(that.list, items_position++));
			}
		}
		removing.length && that.list.remove_at(removing);
		adding.length && that.list.add_all(adding);
	}

	that.add_item = update_list;
	that.remove_item = update_list;
	that.move_item = update_list;
	that.swap_item = update_list;

	options.source && that.set_source(options.source);

	return that;
}
