(function ($) {
  // register namespace
  $.extend(true, window, {
    Slick: {
      AutoSizer: AutoSizer
    }
  });

  var defaults = {
    pollInterval: 1500
  };

  function AutoSizer(options) {
    var
      _isDestroyed,
      _options = $.extend(true, defaults, options),
      $container = $(_options.container),
      h, ch, to;

    if ($container.length !== 1) {
      throw new Error('missing argument: container');
    }

    function init(grid) {
      pollSizeChanged();
    }

    function destroy() {
      _isDestroyed = true;
      _options = null;
      $container = null;

      clearTimeout(to);
      to = null;
    }

    function pollSizeChanged() {
      if (_isDestroyed) return;

      ch = $container.height();
      if (h !== ch) {
        h = ch;
        $container.trigger('resize.slickgrid');
      }

      to = setTimeout(pollSizeChanged, _options.pollInterval);
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy
    });
  }
})(jQuery);








// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
