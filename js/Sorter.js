/* Sorter
options:
	comparator
	breaker_listeners
	list
*/
Sparks.sorter = function sorter(options) {
	if(Sparks.is_list(options))
		options = {list:options};
	options = options || {};
	var that = {};

	that.comparator = options.comparator || MochiKit.Base.compare;

	that.list = options.list;
	that.operational = false;

	that.sorts = [];
	that.add_listener = Sparks.listener_adder(that.listeners = [], true);
	var detachers = [];

	that.resort = function resort() {
		var items = Sparks.get_items(that.list).slice();
		for(var i in items)
			items[i] = {pos:i, item:items[i]};
		items = Sparks.stable_sorted(items, function cmp(a, b) {
			return that.comparator(a.item, b.item);
		});
		var sources = [];
		var destinations = [];
		for(var i in items) {
			if(items[i].pos == i)
				continue;
			sources.push(that.list.at(items[i].pos));
			destinations.push(that.list.at(i));
		}
		if(!sources.length)
			return;
		var sort = Sparks.push_event(that.list, "move_item", sources, destinations);
		that.sorts.push(sort);
		sort.add_listener(that.sorts, that.sorts.shift);
		sort.add_catcher(that.set_operational, false);
		return sort;
	}

	that.set_operational = function set_operational(operational) {
		if(operational === that.operational)
			return;
		if(operational) {
			var sort = that.resort();
			if(sort) {
				sort.add_listener(function resorter_listener() {
					that.operational = true;
				});
			} else {	
				that.operational = true;
			}
			detachers.push(Sparks.add_event_authorizer(that.list, 
				Sparks.event_descendents("update_order"),
				function update_order_listener(src) {
					if(!that.operational || !that.sorts.length)
						return;
					if(Sparks.get_current_event(src) !== that.sorts[0])
						that.set_operational(false)
					else	
						that.sorts.shift();
				}
			));
			detachers.push(Sparks.add_event_listener(that.list, "update_list", 
				function update_list_listener(src, action) {
					if(that.operational && action === "add_item") {
						var sort = that.resort();
						sort && sort.add_catcher(that.set_operational, false);
					}
				}
			));
		} else {
			that.operational = false;
			for(var i in that.sorts)
				that.sorts.shift().cancel();
			Sparks.map_call(that.listeners);
		}
	}

	options.operational && that.set_operational(true);

	return that;
}
