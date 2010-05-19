Sparks.calendar = function calendar(options) {
	options = options || {};
	var that = Sparks.month_viewer(options);

	that.page_viewer = Sparks.recycling_page_viewer();

	that.processor = function processor(result) {
		var color = Sparks.random_color();
		return function selector(telescope) {
			return telescope.add("background-color:"+color);
		}
	}

	that.page_viewer.add_preprocessor(function prepxr(results, month) {
		var years = Sparks.epoch.year + Math.floor(month / 12);
		var months = Sparks.epoch.month + (month % 12);
		that.set_date(Sparks.date(years, months));
		var list_mirror = Sparks.list_mirror(results, 
			function list_mirror(result) {
				return that.select_range(
					result.start, result.duration, that.processor(result)
				);
			}
		);	
		return list_mirror.detach;
	});

	that.view = that.page_viewer.view;

	that.presenter.add_postdrawer(function() {
		that.page_viewer.view(0);
	});

	return that;
}
