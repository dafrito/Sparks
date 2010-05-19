function DateSelector(date, calendar_type) {
	bindMethods(this);
	this.calendar_type = calendar_type ? calendar_type : Calendar.gregorian;
	this.expanded = false;
	sparklet_init(this);
	sparkdate_init(this, date);
}

DateSelector.prototype = merge(SparkDate.prototype, {
	spark_type:"DateSelector",
	parent_attributes:{'class':'date_selector'},
	default_parent:"SPAN",

	output_body:function() {
		if(!this.expanded)
			return linkify(this.toggle_expanded, SPAN(null, this.format_date()));
		return format_sparklet_dialog(this,
			this.output_month(),
			this.output_date(),
			this.output_year()
		);
	}
});	
