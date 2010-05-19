function TimeSelector(date, ignore_seconds) {
	bindMethods(this);
	this.ignore_seconds = ignore_seconds;
	sparkdate_init(this, date);
	sparklet_init(this);
}

TimeSelector.prototype = merge(SparkDate.prototype, {
	spark_type:"TimeSelector",
	parent_attributes:{'class':'time_selector'},
	default_parent:"SPAN",

	output_body:function() {
		if(!this.expanded)
			return linkify(this.toggle_expanded, SPAN(null, this.format_time(this.ignore_seconds)));
		return format_sparklet_dialog(this,
			this.output_hours(),
			SPAN(null, ":"),
			this.output_minutes(),
			this.ignore_seconds ? '' : [SPAN(null, ":"), this.output_seconds()],
			SPAN(null, " "),
			this.output_meridiem()
		);
	}	
});
