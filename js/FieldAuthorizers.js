Sparks.FieldAuthorizers = Sparks.FieldAuthorizers || {};

Sparks.add_initializer("Field Tree", function field_init() {
	Sparks.FieldHierarchy = Sparks.tree(["field", 
		["multilist", "checkbox"],
		["list", "radio"],
		["text", 
			"email",
			["number", "postal_code", "phone_number"]
		]
	]);
});

Sparks.authorize_field_value = function authorize_field_value(value, key, computed, template) {
	var type = typeof template === "string" ? template : template.field_type;
	Sparks.log("Sparks.authorize_field_value", {value:value, key:key, type:type});
	var types = Sparks.FieldHierarchy.get(type).ancestors(true).reverse();
	var errors = [];
	for(var i in types) {
		var authorizer = Sparks.FieldAuthorizers[types[i]];
		var returned = authorizer ? authorizer.apply(null, arguments) : true;
		if(returned !== true && returned !== undefined)
			errors.push(returned);
	}
	return !errors.length || errors;
}

Sparks.FieldAuthorizers.field = function field_authorizer(value, key, computed) {
	return !MochiKit.Base.isUndefinedOrNull(value) && value !== "";
};

Sparks.FieldAuthorizers.number = function number_authorizer(value, key, computed) {
	return !!/^\s*[^A-Z]\s*/i.exec(value);
};

Sparks.FieldAuthorizers.email = function email_authorizer(value, key, computed) {
	return !!/^\s*[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\s*$/i.exec(value);
};

Sparks.FieldAuthorizers.postal_code = function postal_code_authorizer(value, key, computed) {
	return !!/^\s*(\d{5})(?:[^0-9a-zA-Z]*(\d{4}))?\s*$/.exec(value);
};

Sparks.FieldAuthorizers.list = function list_authorizer(value, key, computed, template) {
	if(!template.options)
		return false;
	return !!Sparks.is_found(template.options, value, template.comparator);
};

Sparks.FieldAuthorizers.multilist = function multilist_authorizer(value, key, computed, template) {
	if(!template.options)
		return false;
	return !!Sparks.every(value, function finder(item) {
		return !!Sparks.is_found(template.options, item, template.comparator);
	});
};
