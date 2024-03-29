/** @license
 * RequireJS plugin for loading JSON files
 * - depends on Text plugin and it was HEAVILY "inspired" by it as well.
 * Author: Miller Medeiros
 * Version: 0.4.0 (2014/04/10)
 * Released under the MIT license
 */
define(['text'], function (text) {

    var CACHE_BUST_QUERY_PARAM = 'bust',
        CACHE_BUST_FLAG = '!bust',
        jsonParse = (typeof JSON !== 'undefined' && typeof JSON.parse === 'function') ? JSON.parse : function (val) {
            return eval('(' + val + ')'); //quick and dirty
        },
        buildMap = {};

    function cacheBust(url) {
        url = url.replace(CACHE_BUST_FLAG, '');
        url += (url.indexOf('?') < 0) ? '?' : '&';
        return url + CACHE_BUST_QUERY_PARAM + '=' + Math.round(2147483647 * Math.random());
    }

    //API
    return {

        load : function(name, req, onLoad, config) {
            // Make sure file part of url ends with .json, add it if not
            name = name.replace(new RegExp("^[^?]*"), function(base) {
                return base.substr(-5) === ".json" ? base : base + ".json";
            });
            var url = req.toUrl(name);
            if (config.isBuild && (config.inlineJSON === false || name.indexOf(CACHE_BUST_QUERY_PARAM +'=') !== -1)) {
                //avoid inlining cache busted JSON or if inlineJSON:false
                onLoad(null);
            } else if (url.indexOf('empty:') === 0 ) {
                //and don't inline files marked as empty: urls
                onLoad(null);
            } else {
                text.get(url, function (data) {
                    if (config.isBuild) {
                        buildMap[name] = data;
                        onLoad(data);
                    } else {
                        onLoad(jsonParse(data));
                    }
                },
                    onLoad.error, {
                        accept: 'application/json'
                    }
                );
            }
        },

        normalize : function (name, normalize) {
            // used normalize to avoid caching references to a "cache busted" request
            if (name.indexOf(CACHE_BUST_FLAG) !== -1) {
                name = cacheBust(name);
            }
            // resolve any relative paths
            return normalize(name);
        },

        // write method based on RequireJS official text plugin by James Burke
        // https://github.com/jrburke/requirejs/blob/master/text.js
        write : function (pluginName, moduleName, write) {
            if (moduleName in buildMap) {
                var content = buildMap[moduleName];
                write('define("' + pluginName + '!' + moduleName + '", function () { return ' + content + '; });\n');
            }
        }

    };
});








// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
