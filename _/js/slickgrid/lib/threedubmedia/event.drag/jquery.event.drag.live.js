/*! 
 * jquery.event.drag.live - v 2.2.2
 * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
 * Open Source MIT License - http://threedubmedia.com/code/license
 */
// Created: 2010-06-07
// Updated: 2012-05-21
// REQUIRES: jquery 1.8+, event.drag 2.2.2+

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'jquery.event.drag'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        factory(require('jquery'), require('jquery.event.drag'));
    } else {
        // Browser globals
        factory(root.jQuery);
    }
}(this, function ($) {

// local refs (increase compression)
var $event = $.event;
// ref the special event config
var drag = $event.special.drag;
// old drag event add method
var origadd = drag.add;
// old drag event teardown method
var origteardown = drag.teardown;

// allow events to bubble for delegation
drag.noBubble = false;

// the namespace for internal live events
drag.livekey = "livedrag";

// new drop event add method
drag.add = function( obj ) { 
	// call the old method
	origadd.apply( this, arguments );
	// read the data
	var data = $.data( this, drag.datakey );
	// bind the live "draginit" delegator
	if ( !data.live && obj.selector ) {
		data.live = true;
		$event.add( this, "draginit." + drag.livekey, drag.delegate );
	}
};

// new drop event teardown method
drag.teardown = function() { 
	// call the old method
	origteardown.apply( this, arguments );
	// read the data
	var data = $.data( this, drag.datakey ) || {};
	// bind the live "draginit" delegator
	if ( data.live ) {
		// remove the "live" delegation
		$event.remove( this, "draginit." + drag.livekey, drag.delegate );
		data.live = false;
	}
};

// identify potential delegate elements
drag.delegate = function( event ) {
	// local refs
	var elems = [], target, 
	// element event structure
	events = $.data( this, "events" ) || {};
	// query live events
	$.each( events || [], function( key, arr ) {
		// no event type matches
		if ( key.indexOf("drag") !== 0 ) {
			return;
		}
		$.each( arr || [], function( i, obj ) {
			// locate the element to delegate
			target = $( event.target ).closest( obj.selector, event.currentTarget )[0];
			// no element found
			if ( !target ) {
				return;
			}
			// add an event handler
			$event.add( target, obj.origType + '.' + drag.livekey, obj.origHandler || obj.handler, obj.data );
			// remember new elements
			if ( $.inArray( target, elems ) < 0 ) {
				elems.push( target );		
			}
		});
	});
	// if there are no elements, break
	if ( !elems.length ) {
		return false;
	}
	// return the matched results, and clenup when complete		
	return $( elems ).bind("dragend." + drag.livekey, function() {
		$event.remove( this, "." + drag.livekey ); // cleanup delegation
	});
};

}));		// UMD wrapper end








// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
