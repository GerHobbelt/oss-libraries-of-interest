/*

    simple postmessage plugin

    Useful when a reveal slideshow is inside an iframe.
    It allows to call reveal methods from outside.

    Example:
         var reveal =  window.frames[0];

         // Reveal.prev();
         reveal.postMessage(JSON.stringify({method: 'prev', args: []}), '*');
         // Reveal.next();
         reveal.postMessage(JSON.stringify({method: 'next', args: []}), '*');
         // Reveal.slide(2, 2);
         reveal.postMessage(JSON.stringify({method: 'slide', args: [2,2]}), '*');

    Add to the slideshow:

        dependencies: [
            ...
            { src: 'plugin/postmessage/postmessage.js', async: true, condition: function() { return !!document.body.classList; } }
        ]

*/


(function ( window, factory ) {

  if ( typeof module === "object" && typeof module.exports === "object" ) {
    // Expose a factory as module.exports in loaders that implement the Node
    // module pattern (including browserify).
    // This accentuates the need for a real window in the environment
    // e.g. var jQuery = require("jquery")(window);
    module.exports = function( w ) {
      w = w || window;
      if ( !w.document ) {
        throw new Error("Reveal plugin requires a window with a document");
      }
      return factory( w, w.document, Reveal );
    };
  } else {
    if ( typeof define === "function" && define.amd ) {
      // AMD. Register as a named module.
      define( "reveal.postmessage", [ "reveal" ], function(Reveal) {
        return factory(window, document, Reveal);
      });
    } else {
        // Browser globals
        window.Reveal = factory(window, document, Reveal);
    }
  }

// Pass this, window may not be defined yet
}(this, function ( window, document, Reveal, undefined ) {

    window.addEventListener( "message", function ( event ) {
        var data = JSON.parse( event.data ),
                method = data.method,
                args = data.args;

        if( typeof Reveal[method] === 'function' ) {
            Reveal[method].apply( Reveal, data.args );
        }
    }, false);

    return Reveal;
}));



















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
