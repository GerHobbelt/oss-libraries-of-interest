// START CUSTOM REVEAL.JS INTEGRATION

(function ( window, factory ) {

  // provide fallback if Highlight.js was not loaded...
  if (typeof hljs === 'undefined') {
    hljs = {
      initHighlightingOnLoad: function() {
        console.log("Dummy HighLight.js initializing...");
      },

      highlightBlock: function(a) {
        console.log("Dummy HighLight.js highlightBlock() API invoked.", arguments);
      }
    };
  }

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
      return factory( w, w.document, Reveal, hljs );
    };
  } else {
    if ( typeof define === "function" && define.amd ) {
      // AMD. Register as a named module.
      define( "reveal.highlight", [ "reveal", "highlight" ], function(Reveal, highlight) {
        return factory(window, document, Reveal, highlight);
      });
    } else {
        // Browser globals
        window.Reveal = factory(window, document, Reveal, hljs);
    }
  }

// Pass this, window may not be defined yet
}(this, function ( window, document, Reveal, highlight, undefined ) {

    if( typeof window.addEventListener === 'function' ) {
        var hljs_nodes = document.querySelectorAll( 'pre code' );

        for( var i = 0, len = hljs_nodes.length; i < len; i++ ) {
            var element = hljs_nodes[i];

            // trim whitespace if data-trim attribute is present
            if( element.hasAttribute( 'data-trim' ) && typeof element.innerHTML.trim === 'function' ) {
                element.innerHTML = element.innerHTML.trim();
            }

            // Now escape html unless prevented by author
            if( ! element.hasAttribute( 'data-noescape' )) {
                element.innerHTML = element.innerHTML.replace(/</g,"&lt;").replace(/>/g,"&gt;");
            }

            // re-highlight when focus is lost (for edited code)
            element.addEventListener( 'focusout', function( event ) {
                highlight.highlightBlock( event.currentTarget );
            }, false );
        }
    }

    return Reveal;
}));
// END CUSTOM REVEAL.JS INTEGRATION

// Requires highlight.js

// Init with this code:
//
//    hljs.initHighlightingOnLoad();
//
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
