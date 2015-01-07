(function ($, exports) {

  exports.getColumnHeaderElement = function(columnId) {
    var headers = $( this.getContainerNode() ).find('.slick-header-columns').get(0).children;
    return headers[ this.getColumnIndex(columnId) ];
  };

  exports.toggleColumnHeaderCssClass = function(columnId, cssClass) {
    $( exports.getColumnHeaderElement.call(this, columnId) ).toggleClass(cssClass);
  };

  exports.removeColumnHeaderCssClass = function(columnId, cssClass) {
    $( exports.getColumnHeaderElement.call(this, columnId) ).removeClass(cssClass);
  };

  exports.addColumnHeaderCssClass = function(columnId, cssClass) {
    $( exports.getColumnHeaderElement.call(this, columnId) ).addClass(cssClass);
  };

})(jQuery, Slick.Grid.prototype);
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
