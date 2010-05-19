Sparks.add_initializer("Presenter Hierarchy init", function() {
	Sparks.PresenterHierarchies["NakedContent"] = Sparks.Tree.construct_tree(
		["frame",
			["container", "content"]
		]	
	);

	Sparks.PresenterHierarchies["Field"] = Sparks.Tree.construct_tree(
		["frame",
			["container",
				"title",
				["content_container", "content"],
				"actions"
			]
		]
	);

	Sparks.PresenterHierarchies["Vertical"] = Sparks.Tree.construct_tree(
		["frame",
			["container",
				["top_container", "top"],
				["above_content_container", "above_content"],
				["content_container", "content"],
				["below_content_container", "below_content"],
				["bottom_container", "bottom"]
			]
		]
	);

	Sparks.PresenterHierarchies["Horizontal"] = Sparks.Tree.construct_tree(
		["frame",
			["supercontent_container", "supercontent"],
			["middle_container",
				["container",
					["far_left_container", "far_left"],
					["left_container", "left"],
					["content_container", "content"],
					["right_container", "right"],
					["far_right_container", "far_right"]
				]
			],
			["subcontent_container", "subcontent"]
		]
	);

	Sparks.PresenterHierarchies["Object"] = Sparks.Tree.construct_tree(
		["frame",
			["container",
				["head",
					["title_container", "title"],
					["messages_container", "messages"],
					["head_options_container", "head_options"]
				],
				["body", 
					["body_options_container", "body_options"],
					["content_container", "content"]
				],
				"bottom"
			]
		]
	);

	Sparks.PresenterHierarchies["Titled"] = Sparks.Tree.construct_tree(
		["frame",
			["container",
				["title_container", "title"],
				["content_container", "content"]
			]
		]
	);

});

