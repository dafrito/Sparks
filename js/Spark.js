Sparks.spark = function spark(options) {
	options = options || {};
	var that = Sparks.widget("Spark", options.presenter, options.operational);

	that.meta_object = options.meta_object;
	that.dict = options.dict;

	that.elements = Sparks.element_list();

	that.presenter.add_predrawer(function spark_predrawer() {
		assert(that.meta_object, "Sparks.Spark.predrawer: MetaObject required.");
		that.meta_object.create(that.dict = that.dict || Sparks.dict());
		that.field_seed = Sparks.field_seed(that);
		that.elements.items = that.field_seed.fields;
	});

	that.presenter.set_processor("content", function content_pxr(working) {
		that.elements.output_to_parent(working || Sparks.create_valid_child());
	});

	return that;
}
