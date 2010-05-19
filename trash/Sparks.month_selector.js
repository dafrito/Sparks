function MonthSelector(date, calendar_type) {
	bindMethods(this);
	this.calendar_type = calendar_type ? calendar_type : Calendar.gregorian;
	this.expanded = false;
	sparklet_init(this);
	sparkdate_init(this, date);
}

MonthSelector.prototype = merge(SparkDate.prototype, {
	spark_type:"MonthSelector",
	parent_attributes:{'class':'month_selector'},

	title:function() {
		return this.calendar_type.months[this.date().getMonth()] + " " + this.date().getFullYear();
	},

	output_body:function() {
		if(!this.expanded)
			return linkify(this.toggle_expanded, SPAN(null, this.title()));
		return format_sparklet_dialog(this,
			this.output_month(),
			this.output_year()
		);
	}
});
