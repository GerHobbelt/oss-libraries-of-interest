/**
 * Copyright (c) Parsha Pourkhomami <parshap@gmail.com>
 *
 * Redistribution and use in source and compiled forms, with or without
 * modification, are permitted under any circumstances. No warranty.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Extend jQuery.
        define(['jquery'], function (jq) {
            return factory(jq);
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(root.jQuery);
    }
}(this, function ($, undefined) {
	$.fn.insertAt = function(index, $parent) {

		// Simple case if we are inserting at the beginning
		if (index <= 0) {
			return $parent.prepend(this);
		}

		// Otherwise we should examine the children of each DOM object in the
		// set to determine the correct insert position for each one
		var $el = this;
		return $parent.each(function() {
			var $p = $(this),
				pred = $p.children().get(index - 1);

			// If an element exists at this index, add ours immediately after it
			if (pred) {
				$(pred).after($el);
			} else {
				// Otherwise insert at the end
				$p.append($el);
			}
		});
	};
}));
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
