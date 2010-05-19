Sparks.dom_event = function dom_event(src, action, native) {
	var that = {};

	that.type = "DOMEvent";
	that.action = action;
	that.type = function type() {
		return that.action.substr(2);
	}
	that.src = function src() {
		return src;
	}
	that.native = Sparks.dom_event.get_native(native);

	that.__repr__ = function __repr__() {
		return "Sparks.dom_event(action:" + that.action +")";
	}

	assert(that.native, "No native event available");

    that.stop = function stop() {
		that.stopPropagation();
		that.preventDefault();
    }

	that.stopPropagation = function stopPropagation() {
		if(that.native.stopPropagation)
			that.native.stopPropagation();
		else
			that.native.cancelBubble = true;
    }

    that.preventDefault = function preventDefault() {
		if(that.native.preventDefault)
			that.native.preventDefault();
		else
			that.native.returnValue = false;
    }

	var target;
	that.target = function target_fxn() {
		return target = target || native.target || native.srcElement;
	}

	var related_target;
	that.relatedTarget = function relatedTarget_fxn() {
		if(!related_target) {
			related_target = native.relatedTarget;
			if(!related_target && 
				(typeof native.fromElement === "object" || typeof native.toElement === "object"))
				related_target = action === "onmouseover" ? native.fromElement : native.toElement;
			if(!related_target)
				related_target = document.body;
		}
		return related_target;
	}

	if(that.relatedTarget()) {
		try {
			that.relatedTarget().tagName;
		} catch(e) {
			if(Sparks.debug)
				Sparks.log("Sparks.dom_event: A relatedTarget error occurred, and is having to be worked around.");
			related_target = document.body;
		}
	}

	var position;
	that.position = function position_getter() {
		if(!position) {
			position = {};
            position.client = {};
			position.client.x = Math.max(0, native.clientX) || 0;
			position.client.y = Math.max(0, native.clientY) || 0;
			
			position.page = {};
			if(typeof native.pageX === "number") {
				position.page.x = Math.max(0, native.pageX);
				position.page.y = Math.max(0, native.pageY);
			} else {
				var document = MochiKit.DOM.currentDocument();
				var body = document.body;
				document = document.documentElement;
				position.page.x = native.clientX;
				position.page.x += document.scrollLeft || body.scrollLeft;
				position.page.x -= document.clientLeft || 0;

				position.page.y = native.clientY;
				position.page.y += document.scrollTop || body.scrollTop;
				position.page.y -= document.clientTop || 0;
			}
		}
		return position;
	}

	that.movement = function movement(delta) {
		if(arguments.length === 3)
			delta = {x:arguments[0], y:arguments[1], z:arguments[2]};
		delta = delta || that.position();
		return {
			position:that.position(),
			delta:Sparks.Effects.delta(delta.position, that.position())
		};
	}

	var button;
	that.button = function button_getter() {
		if(action === "onmousemove")
			return;
		if(!button) {
			button = {};
			switch(native.which) {
				case 1:
					button.left = true;
					break;
				case 2:
					button.middle = true;
					break;
				case 3:
					button.right = true;
					break;
				default:
                    button.left = !!(native.button & 1);
                    button.middle = !!(native.button & 2);
                    button.right = !!(native.button & 4);
			}
		}
		return button;
	}

	var modifier;
	that.modifier = function modifier_getter() {
		if(!modifier) {
			modifier = {};
			modifier.alt = native.altKey;
			modifier.ctrl = native.ctrlKey;
			modifier.meta = native.metaKey || false; // IE and Opera punt here (punt? wtf?)
			modifier.shift = native.shiftKey;
			modifier.any = modifier.alt || modifier.ctrl || modifier.shift || modifier.meta;
		}
		return modifier;
	}

	var key;
	that.key = function key_getter() {
		if(!key) {
			key = {};
			if(action.match(/key(down|up)/)) {
				key.code = native.keyCode;
				key.name = key.string = Sparks.dom_event.special_keys[key.code] || "KEY_UNKNOWN";
			} else {
				key.code = 0;
				if(native.charCode && !Sparks.dom_event.special_mac_keys[native.charCode]) {
					key.code = native.charCode;
				} else if(native.keyCode) {
					key.code = native.keyCode;
				}
				key.string = String.fromCharCode(key.code) || "";
				key.name = Sparks.dom_event.special_keys[
					key.code - (key.string.match(/[a-z]/) ? 32 : 0)
				] || "KEY_UNKNOWN";
			}
		}
		return key;
	}	

	function scroll_data(offset, viewable, total) {
		var scroll_data;
		return function scroll_data_getter() {
			if(!scroll_data) {
				scroll_data = {
					start:{
						value:offset,
						percent:offset / total
					},
					end:{
						value:offset + viewable,
						percent:(offset + viewable) / total
					},
					value:offset + (viewable * (offset / (total - viewable)))
				};
				scroll_data.percent = scroll_data.value / total;
			}
			return scroll_data;
		}
	}

	that.vertical = scroll_data(src.scrollTop, src.clientHeight, src.scrollHeight);
	that.horizontal = scroll_data(src.scrollLeft, src.clientWidth, src.scrollWidth);

	var scroll;
	that.scroll = function scroll_getter() {
		if(!scroll) {
			scroll = {
				vertical:that.vertical(),
				horizontal:that.horizontal()
			};
		}
		return scroll;
	}

	return that;
}

Sparks.dom_event.get_native = function get_native(native) {
	return native || window.event;
}

Sparks.dom_event.attach = function attach(src, action, handler) {
	function passer(native) {
		try {
			var event = handler(src, action, native);
			event ? 
				Sparks.signal_event(src, action, event) :
				Sparks.debug && Sparks.log("The preceding DOM event is invalid and was suppressed.", {action:action});
		} catch(e) {
			Sparks.log_joined("An exception was thrown while dispatching a DOMEvent.", e);
			throw new Error("Error was fired dispatching DOM event. " + e);
		} 
	}
	function spawner(native, timer, correct_overlaps) {
		if(typeof Sparks === "undefined") {
			/* Events that occur before the entirety of the package has
				been initialized are ignored. 
				Potentially, we could send these to an array using only
				native function calls, and just setTimeout() for like, a
				second until Sparks is available. The benefit of these
				events is questionable. */
			return;
		}
		if(correct_overlaps)
			setTimeout(Sparks.obj_func(passer, native), 0)
		else
			passer(native);
		if(Sparks.debug) {
			Sparks.log("Spawning DOM Event. ", 
				{action:action, tagname:src.tagName, id:src.id, children:src.childNodes.length}
			);
		}
	}
	if(src.addEventListener)
		src.addEventListener(action.substr(2), spawner, false);
	else 
		src.attachEvent(action, spawner);
	return spawner;
}

Sparks.dom_event.detach = function detach(src, action, spawner) {
	if(src.removeEventListener)
		src.removeEventListener(action.substr(2), spawner, false);
	else 
		src.detachEvent(action, spawner);
}

Sparks.add_initializer("Scroll Event Initializers", function scroll_event_init() {
	Sparks.set_event_action_attacher("onscroll", function scroll_attacher(src, action) {
		if(Sparks.is_dom(src) || src === document)
			var handler = Sparks.dom_event.attach(src, action, Sparks.dom_event);
		return function remove_handler() {
			handler && Sparks.dom_event.detach(src, action, handler);
		}
	});
});

Sparks.add_initializer("Focus Event Initializers", function focus_event_init() {
	function focus_attacher(src, action) {
		if(Sparks.is_dom(src) || src === document)
			var handler = Sparks.dom_event.attach(src, action, Sparks.dom_event);
		return function remove_handler() {
			handler && Sparks.dom_event.detach(src, action, handler);
		}
	}
	Sparks.set_event_action_attacher("onblur", focus_attacher);
	Sparks.set_event_action_attacher("onfocus", focus_attacher);
	Sparks.set_event_action_attacher("focus_action", function attacher(src) {
		var detachers = [];
		detachers.push(focus_attacher(src, "onfocus"));
		detachers.push(focus_attacher(src, "onblur"));
		return Sparks.exhauster(detachers);
	});
});

Sparks.add_initializer("Mouse Event Initializers", function mouse_event_init() {
	function mouse_attacher(src, action) {
		assert(Sparks.is_dom(src) || src === document, "Bad mouse-event source.", src);
		var handler = Sparks.dom_event.attach(src, action, Sparks.dom_event);
		return function remove_handler() {
			Sparks.dom_event.detach(src, action, handler);
		}
	}
	Sparks.set_event_action_attacher("onmouseover", mouse_attacher);
	Sparks.set_event_action_attacher("onmouseout", mouse_attacher);
	Sparks.set_event_action_attacher("onmousedown", mouse_attacher);
	Sparks.set_event_action_attacher("onmouseup", mouse_attacher);
	Sparks.set_event_action_attacher("onclick", mouse_attacher);
	Sparks.set_event_action_attacher("onmousemove", mouse_attacher);

	Sparks.set_event_action_attacher("move_mouse", function attacher(src) {
		var detachers = [];
		detachers.push(mouse_attacher(src, "onmouseover"));
		detachers.push(mouse_attacher(src, "onmouseout"));
		return Sparks.exhauster(detachers);
	});

	Sparks.set_event_action_attacher("click_mouse", function attacher(src) {
		var detachers = [];
		detachers.push(mouse_attacher(src, "onmousedown"));
		detachers.push(mouse_attacher(src, "onmouseup"));
		detachers.push(mouse_attacher(src, "onclick"));
		return Sparks.exhauster(detachers);
	});
});

Sparks.add_initializer("Key Event Initializers", function key_event_init() {
	function key_attacher(src, action) {
		assert(Sparks.is_dom(src) || src === document, "Bad key-event source. (src:%s)", src);
		var handler = Sparks.dom_event.attach(src, action, Sparks.dom_event);
		return function remove_handler() {
			Sparks.dom_event_detach(src, action, handler);
		}
	}
	Sparks.set_event_action_attacher("onkeydown", key_attacher);
	Sparks.set_event_action_attacher("onkeyup", key_attacher);
	Sparks.set_event_action_attacher("onkeypress", key_attacher);

	Sparks.set_event_action_attacher("press_key", function attacher(src) {
		var detachers = [];
		detachers.push(key_attacher(src, "onkeyup"));
		detachers.push(key_attacher(src, "onkeydown"));
		return Sparks.exhauster(detachers);
	});

	var special_keys = Sparks.dom_event.special_keys = {
		8: 'KEY_BACKSPACE',
		9: 'KEY_TAB',
		12: 'KEY_NUM_PAD_CLEAR', // weird, for Safari and Mac FF only
		13: 'KEY_ENTER',
		16: 'KEY_SHIFT',
		17: 'KEY_CTRL',
		18: 'KEY_ALT',
		19: 'KEY_PAUSE',
		20: 'KEY_CAPS_LOCK',
		27: 'KEY_ESCAPE',
		32: 'KEY_SPACEBAR',
		33: 'KEY_PAGE_UP',
		34: 'KEY_PAGE_DOWN',
		35: 'KEY_END',
		36: 'KEY_HOME',
		37: 'KEY_ARROW_LEFT',
		38: 'KEY_ARROW_UP',
		39: 'KEY_ARROW_RIGHT',
		40: 'KEY_ARROW_DOWN',
		44: 'KEY_PRINT_SCREEN',
		45: 'KEY_INSERT',
		46: 'KEY_DELETE',
		59: 'KEY_SEMICOLON', // weird, for Safari and IE only
		91: 'KEY_WINDOWS_LEFT',
		92: 'KEY_WINDOWS_RIGHT',
		93: 'KEY_SELECT',
		106: 'KEY_NUM_PAD_ASTERISK',
		107: 'KEY_NUM_PAD_PLUS_SIGN',
		109: 'KEY_NUM_PAD_HYPHEN-MINUS',
		110: 'KEY_NUM_PAD_FULL_STOP',
		111: 'KEY_NUM_PAD_SOLIDUS',
		144: 'KEY_NUM_LOCK',
		145: 'KEY_SCROLL_LOCK',
		186: 'KEY_SEMICOLON',
		187: 'KEY_EQUALS_SIGN',
		188: 'KEY_COMMA',
		189: 'KEY_HYPHEN-MINUS',
		190: 'KEY_FULL_STOP',
		191: 'KEY_SOLIDUS',
		192: 'KEY_GRAVE_ACCENT',
		219: 'KEY_LEFT_SQUARE_BRACKET',
		220: 'KEY_REVERSE_SOLIDUS',
		221: 'KEY_RIGHT_SQUARE_BRACKET',
		222: 'KEY_APOSTROPHE'
	};

	var NUM_KEYS_OFFSET = 48;
	for(var i = 0; i < 10; i++)
		special_keys[i + NUM_KEYS_OFFSET] = "KEY_" + i;

	var ALPHA_KEYS_OFFSET = 65;
	for(var i = ALPHA_KEYS_OFFSET; i < ALPHA_KEYS_OFFSET + 26; i++)
		special_keys[i] = "KEY_" + String.fromCharCode(i);
	
	var NUM_PAD_OFFSET = 96;	
	for(var i = 0; i < 10; i++)
		special_keys[i + NUM_PAD_OFFSET] = "KEY_NUM_PAD" + i;

	var FUNCTION_KEYS_OFFSET = 112;
	for(var i = 0; i < 12; i++)
		special_keys[i + FUNCTION_KEYS_OFFSET] = "KEY_F" + (i + 1);

	Sparks.dom_event.special_mac_keys = {
		3: 'KEY_ENTER',
		63289: 'KEY_NUM_PAD_CLEAR',
		63276: 'KEY_PAGE_UP',
		63277: 'KEY_PAGE_DOWN',
		63275: 'KEY_END',
		63273: 'KEY_HOME',
		63234: 'KEY_ARROW_LEFT',
		63232: 'KEY_ARROW_UP',
		63235: 'KEY_ARROW_RIGHT',
		63233: 'KEY_ARROW_DOWN',
		63302: 'KEY_INSERT',
		63272: 'KEY_DELETE'
	};

	var MAC_FUNCTION_KEYS_OFFSET = 63236;
    for (i = 0; i < 7; i++)
        Sparks.dom_event.special_mac_keys[i + MAC_FUNCTION_KEYS_OFFSET] =  "KEY_F" + (i + 1);
});
