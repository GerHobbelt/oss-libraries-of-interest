/**
 * Utilities module for Rangy.
 * A collection of common selection and range-related tasks, using Rangy.
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * https://github.com/timdown/rangy
 *
 * Depends on Rangy core.
 *
 * Copyright 2015, Tim Down
 * Licensed under the MIT license.
 * Version: 1.3.0-alpha.20150122
 * Build date: 31 January 2015
 */
(function(factory, root) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module with a dependency on Rangy.
        define(["./rangy-core"], factory);
    } else if (typeof module !== "undefined" && typeof exports === "object") {
        // Node/CommonJS style
        module.exports = factory( require("rangy") );
    } else {
        // No AMD or CommonJS support so we use the rangy property of root (probably the global variable)
        factory(root.rangy);
    }
})(function(rangy) {
    rangy.createModule("Util", ["WrappedSelection"], function(api, module) {
        var rangeProto = api.rangePrototype;
        var selProto = api.selectionPrototype;

        selProto.pasteText = function(text) {
            this.deleteFromDocument();
            var range = this.getRangeAt(0);
            var textNode = range.getDocument().createTextNode(text);
            range.insertNode(textNode);
            this.setSingleRange(range);
        };

        rangeProto.pasteText = function(text) {
            this.deleteContents();
            var textNode = this.getDocument().createTextNode(text);
            this.insertNode(textNode);
        };

        selProto.pasteHtml = function(html) {
            this.deleteFromDocument();
            var range = this.getRangeAt(0);
            var frag = this.createContextualFragment(html);
            var lastNode = frag.lastChild;
            range.insertNode(frag);
            if (lastNode) {
                range.setStartAfter(lastNode);
            }
            this.setSingleRange(range);
        };

        rangeProto.pasteHtml = function(html) {
            this.deleteContents();
            var frag = this.createContextualFragment(html);
            this.insertNode(frag);
        };

        selProto.selectNodeContents = function(node) {
            var range = api.createRange(this.win);
            range.selectNodeContents(node);
            this.setSingleRange(range);
        };

        api.createRangeFromNode = function(node) {
            var range = api.createRange(node);
            range.selectNode(node);
            return range;
        };

        api.createRangeFromNodeContents = function(node) {
            var range = api.createRange(node);
            range.selectNodeContents(node);
            return range;
        };

        api.selectNodeContents = function(node) {
            api.getSelection().selectNodeContents(node);
        };

        rangeProto.selectSelectedTextElements = (function() {
            function isInlineElement(node) {
                return node.nodeType === 1 && api.dom.getComputedStyleProperty(node, "display") === "inline";
            }

            function getOutermostNodeContainingText(range, node) {
                var outerNode = null;
                var nodeRange = range.cloneRange();
                nodeRange.selectNode(node);
                if (nodeRange.toString() !== "") {
                    while ( (node = node.parentNode) && isInlineElement(node) && range.containsNodeText(node) ) {
                        outerNode = node;
                    }
                }
                return outerNode;
            }

            return function() {
                var startNode = getOutermostNodeContainingText(this, this.startContainer);
                if (startNode) {
                    this.setStartBefore(startNode);
                }

                var endNode = getOutermostNodeContainingText(this, this.endContainer);
                if (endNode) {
                    this.setEndAfter(endNode);
                }
            };
        })();

        // TODO: simple selection save/restore
    });
    
}, this);








// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
