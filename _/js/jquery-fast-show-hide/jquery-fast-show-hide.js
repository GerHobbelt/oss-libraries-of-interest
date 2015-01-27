/*
 * Fast .show/.hide/.toggle replacement which permits CSS styling by using classes rather than direct
 * manipulation of the DOM elements' `.styles.display` attribute.
 *
 * (c) copyright Ger Hobbelt (ger@hobbelt.com)
 *
 * MIT license
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(root.jQuery);
    }
}(this, function ($) {

    // fast hack to replace show()/hide()/toggle() which are very slow
    
    $.fn.fastshow = function () {
        return this.each(function () {
            this.classList.remove('fast-hide');
            this.classList.add('fast-show');
        });   
    };
    $.fn.fasthide = function () {
        return this.each(function () {
            this.classList.add('fast-hide');
            this.classList.remove('fast-show');
        });   
    };
    $.fn.fasttoggle = function (newState) {
        assert(newState === false || newState === true);
        return this.each(function () {
            if (newState == null) {
                // starting fallback assumption is: the element is shown.
                newState = this.classList.contains('fast-hide');
            }
            if (!newState) {
                this.classList.add('fast-hide');
                this.classList.remove('fast-show');
            } else {
                this.classList.remove('fast-hide');
                this.classList.add('fast-show');
            }
        });   
    };

}));










// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
