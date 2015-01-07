CodeMirror.defineMode("smartyhtmlmixed", function(config, parserConfig) {
	var htmlMode   = CodeMirror.getMode(config, { name: "xml", htmlMode: true });
	var jsMode     = CodeMirror.getMode(config, "javascript");
	var cssMode    = CodeMirror.getMode(config, "css");
	var smartyMode = CodeMirror.getMode(config, "smarty");


	function html(stream, state) {
		var style = htmlMode.token(stream, state.htmlState);

		// currently don't understand: why stream.current() returns {$smarty} - why has the tokenizer already passed by the { char

		if (/^\{/.test(stream.current())) {
			stream.backUp(1);
			state.token = smarty;
			state.localState = smartyMode.startState(htmlMode.indent(state.htmlState, ""));
			state.mode = "smarty";
			return smarty(stream, state);
		} else {
			if (style == "tag" && stream.current() == ">" && state.htmlState.context) {
				if (/^script$/i.test(state.htmlState.context.tagName)) {
					state.token = javascript;
					state.localState = jsMode.startState(htmlMode.indent(state.htmlState, ""));
					state.mode = "javascript";
				} else if (/^style$/i.test(state.htmlState.context.tagName)) {
					state.token = css;
					state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
					state.mode = "css";
				}
			}
			console.log(":", stream.current());
		}
		return style;
	}

/*
	function isStartingSmartyTag(stream, state) {
		if (/\{/.test(stream.current())) {
			state.token = smarty;
			state.localState = smartyMode.startState(htmlMode.indent(state.htmlState, ""));
			state.mode = "smarty";
			return true;
		}
		return false;
	}
*/

	function maybeBackup(stream, pat, style) {
		var cur = stream.current();
		var close = cur.search(pat);
		if (close > -1) stream.backUp(cur.length - close);
		return style;
	}

	function whatTheFuckBackup(stream, pat, style) {
		var cur = stream.current();
		var close = cur.search(pat);

		//    console.log(stream.current());

		console.log(stream.current());
		console.log("backing up: " + (cur.length - close) + " chars");

		if (close > -1) stream.backUp(cur.length - close);
		return style;
	}

	// Smarty tags can appear anywhere: within HTML, JS or CSS - they override them all. When this detects the end of
	// the Smarty tag, it returns the highlighter to the appropriate context (JS, CSS or HTML)
	function smarty(stream, state) {
		if (/\s/.test(stream.current())) {
			return null;
		}

		if (stream.match(/^\}/, false)) {
			var style = htmlMode.token(stream, state.htmlState);

			if (/^script$/i.test(state.htmlState.context.tagName)) {
				state.token = javascript;
				state.localState = jsMode.startState(htmlMode.indent(state.htmlState, ""));
				state.mode = "javascript";
			}
			else if (/^style$/i.test(state.htmlState.context.tagName)) {
				state.token = css;
				state.localState = cssMode.startState(htmlMode.indent(state.htmlState, ""));
				state.mode = "css";
			}
			else {
				state.token = html;
				state.localState = htmlMode.startState(htmlMode.indent(state.htmlState, ""));
				state.mode = "html";
			}
		} else {
			return whatTheFuckBackup(stream, /\}/, smartyMode.token(stream, state.localState));
		}
	}

	function javascript(stream, state) {
		//    if (isStartingSmartyTag(stream, state)) {
		//      return smarty(stream, state);
		//    } else
		if (stream.match(/^<\/\s*script\s*>/i, false)) {
			state.token = html;
			state.curState = null;
			state.mode = "html";
			return html(stream, state);
		}

		return maybeBackupJS(stream, /<\/\s*script\s*>/, jsMode.token(stream, state.localState));
	}

	function css(stream, state) {
		//  if (isStartingSmartyTag(stream, state)) {
		//    return smarty(stream, state);
		//  } else
		if (stream.match(/^<\/\s*style\s*>/i, false)) {
			state.token = html;
			state.localState = null;
			state.mode = "html";
			return html(stream, state);
		}
		return maybeBackup(stream, /<\/\s*style\s*>/, cssMode.token(stream, state.localState));
	}


	return {
		startState: function() {
			var state = htmlMode.startState();
			return {
				token: html,
				localState: null,
				mode: "html",
				htmlState: state,
				whatever: null
			};
		},

		copyState: function(state) {
			if (state.localState) {
				var local = CodeMirror.copyState(state.token == css ? cssMode : jsMode, state.localState);
			}
			return {
				token: state.token,
				localState: local,
				mode: state.mode,
				htmlState: CodeMirror.copyState(htmlMode, state.htmlState)
			};
		},

		token: function(stream, state) {
			return state.token(stream, state);
		},

		indent: function(state, textAfter) {
			if (state.token == html || /^\s*<\//.test(textAfter)) {
				return htmlMode.indent(state.htmlState, textAfter);
			} else if (state.token == javascript) {
				return jsMode.indent(state.localState, textAfter);
			} else {
				return cssMode.indent(state.localState, textAfter);
			}
		},

		compareStates: function(a, b) {
			return htmlMode.compareStates(a.htmlState, b.htmlState);
		},

		electricChars: "/{}:"
	}
});

CodeMirror.defineMIME("text/x-smartyhtmlmixed", "smartyhtmlmixed");















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
