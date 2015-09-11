/** @license
 * Plugin to load JS files that have dependencies but aren't wrapped into
 * `define` calls.
 * Author: Miller Medeiros
 * Version: 0.1.0 (2011/12/13)
 * Released under the MIT license
 */
define(function () {

    var rParts = /^(.*)\[([^\]]*)\]$/;

    return {

        //example: depend!bar[jquery,lib/foo]
        load : function(name, req, onLoad, config){
            var parts = rParts.exec(name);

            req(parts[2].split(','), function(){
                req([parts[1]], function(mod){
                    onLoad(mod);
                });
            });
        }

    };

});








// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
