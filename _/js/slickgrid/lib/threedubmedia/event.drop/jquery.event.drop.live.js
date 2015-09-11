/*! 
 * jquery.event.drop.live - v 2.2.2
 * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
 * Open Source MIT License - http://threedubmedia.com/code/license
 */
// Created: 2010-06-07
// Updated: 2012-05-21
// REQUIRES: jquery 1.8+, event.drag 2.2.2+, event.drop 2.2.2+

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'jquery.event.drop'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        factory(require('jquery'), require('jquery.event.drop'));
    } else {
        // Browser globals
        factory(root.jQuery);
    }
}(this, function ($) {

// local refs (increase compression)
var $event = $.event;
// ref the drop special event config
var drop = $event.special.drop;
// old drop event add method
var origadd = drop.add;
// old drop event teardown method
var origteardown = drop.teardown;

// allow events to bubble for delegation
drop.noBubble = false;

// the namespace for internal live events
drop.livekey = "livedrop";

// new drop event add method
drop.add = function( obj ) { 
	// call the old method
	origadd.apply( this, arguments );
	// read the data
	var data = $.data( this, drop.datakey );
	// bind the live "dropinit" delegator
	if ( !data.live && obj.selector ) {
		data.live = true;
		$event.add( this, "dropinit." + drop.livekey, drop.delegate );
	}
};

// new drop event teardown method
drop.teardown = function() { 
	// call the old method
	origteardown.apply( this, arguments );
	// read the data
	var data = $.data( this, drop.datakey ) || {};
	// remove the live "dropinit" delegator
	if ( data.live ) {
		// remove the "live" delegation
		$event.remove( this, "dropinit", drop.delegate );
		data.live = false;
	}
};

// identify potential delegate elements
drop.delegate = function( event, dd ) {
	// local refs
	var elems = [], $targets, 
	// element event structure
	events = $.data( this, "events" ) || {};
	// query live events
	$.each( events || [], function( key, arr ) {
		// no event type matches
		if ( key.indexOf("drop") !== 0 ) {
			return;
		}
		$.each( arr, function( i, obj ) {
			// locate the elements to delegate
			$targets = $( event.currentTarget ).find( obj.selector );
			// no element found
			if ( !$targets.length ) {
				return;
			}
			// take each target...
			$targets.each(function() {
				// add an event handler
				$event.add( this, obj.origType + '.' + drop.livekey, obj.origHandler || obj.handler, obj.data );
				// remember new elements
				if ( $.inArray( this, elems ) < 0 ) {
					elems.push( this );	
				}
			});	
		});
	});
	// may not exist when artificially triggering dropinit event
	if ( dd ) {
		// clean-up after the interaction ends
		$event.add( dd.drag, "dragend." + drop.livekey, function() {
			$.each( elems.concat( this ), function() {
				$event.remove( this, '.' + drop.livekey );							
			});
		});
	}
	//drop.delegates.push( elems );
	return elems.length ? $( elems ) : false;
};

}));		// UMD wrapper end








// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
