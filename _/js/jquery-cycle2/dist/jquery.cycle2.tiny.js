/*!
 * jQuery Cycle2 1.0.0-2013.11.08
 * http://jquery.malsup.com/cycle2/
 *
 * Copyright 2013 Mike Alsup and other contributors
 * Dual licensed under the MIT license and GNU Public Licence 
 *
 * Date: 2015-01-18T13:40Z
 */

(function( window ) {

/*! tCycle (c) 2012 M.Alsup MIT/GPL 20120911 */
(function($){
"use strict";
$.fn.tcycle = function(){

return this.each(function(){
	var f, i=0, c=$(this), s=c.children(), o=$.extend({speed:500,timeout:4000},c.data()),
		l=s.length, w=c.width(), z=o.speed, t=o.timeout;
	c.prepend($(s[0]).clone().css('visibility','hidden')).css({position:'relative',overflow:'hidden'});
	f=o.fx!='scroll';
	if(f)
		s.css({position:'absolute',top:0,left:0}).hide().eq(0).show();
	else
		s.css({position:'absolute',top:0,left:w}).eq(0).css('left',0);
	setTimeout(tx,t);

	function tx(){
		var n = i==(l-1) ? 0 : (i+1), w=c.width(), a=$(s[i]), b=$(s[n]);
		if (f){
			a.fadeOut(z);
			b.fadeIn(z,function(){
				setTimeout(tx,t);
			});
		}else{
			a.animate({left:-w},z,function(){
				a.hide();
			});
			b.css({'left':w,display:'block'}).animate({left:0},z,function(){
				setTimeout(tx,t);
			});
		}
		i = i==(l-1) ? 0 : (i+1);
	}
});

};
$(document).ready(function(){$('.tcycle').tcycle();});
})(jQuery);

// get at whatever the global object is, like window in browsers
}( (function() {return this;}.call()) ));
