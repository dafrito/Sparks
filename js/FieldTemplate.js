Sparks.is_field_template = Sparks.izzer("FieldTemplate");

/* FieldTemplate
options:
	name - Name of this field. Also usually a key name.
	field_type - type of this field. 
	optional - self-explanatory boolean. Used in authorization.

	options - for some templates, options are required (Radio buttons, dropdowns, etc.)
	dependents - Dependents of this FieldTemplate. Usually not directly passed.
	requirements - Polish tree, or an array that can be coerced to one, indicating what this
		field depends on. 
*/
Sparks.field_template = function field_template(options) {
	if(Sparks.is_field_template(options))
		return options;
	if(typeof options === "string")
		options = {name:options};
	options = options || {};
	var that = {};
	that.type = "FieldTemplate";

	that.options = options.options;
	that.name = options.name;
	if("field_type" in options)
		that.field_type = options.field_type;
	else if(Sparks.FieldAuthorizers[that.name])
		that.field_type = that.name;
	else
		that.field_type = "text";
	that.dependents = options.dependents || [];
	that.optional = !!options.optional;

	that.requirements = options.requirements || ["AND"];
	if(typeof that.requirements === "string")
		that.requirements = ["AND", that.requirements];
	if(that.requirements instanceof Array)
		that.requirements = Sparks.Tree.construct_tree(that.requirements);

	that.check = function check(dict, computed, check_optional) {
		var computed = computed || dict.computed();
		if(check_optional && that.optional && computed(that.name) === "undefined")
			return;
		return Sparks.Tree.calculate_polish(that.requirements, function tester(requirement) {
			if(requirement.validator)
				return requirement.validator(computed, requirement.field);
			return !!computed(requirement.field.name);
		});
	}

	return that;
}

Sparks.parse_field_requirements = function parse_field_requirements(requirements, fields) {
	assert(requirements, "Sparks.parse_field_requirements: Requirements required.");
	if(!(requirements instanceof Array) && !Sparks.is_tree(requirements))
		return requirements;
	requirements = Sparks.Tree.construct_tree(requirements);
	fields = fields || {};
	MochiKit.Base.nodeWalk(requirements, function walker(node) {
		var field = node.content = Sparks.field_template(node.content);
		if(node.parent) {
			if(!Sparks.is_found(field.requirements.children, node.parent.content, 
				function cmp(a, b) {
					b = b.content;
					a = typeof a === "object" ? a.name : a;
					b = typeof b === "object" ? b.name : b;
					return a === b;
				})) {
				field.requirements.add(node.parent.content);
			}
			field.optional = field.optional || node.parent.content.optional;
		}
		fields[field.name] = field;
		return node.children;
	});
	for(var i in fields) {
		var field = fields[i];
		MochiKit.Base.nodeWalk(field.requirements, function walker(node) {
			var requirement = node.content;
			if(!Sparks.is_operator(requirement)) {
				if(typeof requirement === "string")
					requirement = node.content = {field:fields[requirement], validator:undefined};
				else if(Sparks.is_field_template(requirement))
					requirement = node.content = {field:requirement, validator:undefined};
				else 
					requirement = node.content = {field:Sparks.field_template(requirement), validator:requirement.validator};
				requirement.field.dependents.push(field);
			}
			return node.children;
		});
	}
	return fields;
}
