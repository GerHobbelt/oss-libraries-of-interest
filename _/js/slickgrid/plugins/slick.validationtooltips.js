(function ($) {
  // register namespace
  $.extend(true, window, {
    Slick: {
      ValidationTooltips: ValidationTooltips
    }
  });

  function ValidationTooltips(options) {
    var
      _grid,
      _self = this,
      _defaults = {
        className: "cell-tooltip-validation-error"
      };

    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _grid.onValidationError.subscribe(handleValidationError);
      _grid.onBeforeCellEditorDestroy.subscribe(handleBeforeCellEditDestroy);
    }

    function destroy() {
      _grid.onValidationError.unsubscribe(handleValidationError);
      _grid.onBeforeCellEditorDestroy.unsubscribe(handleBeforeCellEditDestroy);
    }

    function handleValidationError(e, args) {
      var
        validationResult = args.validationResults,
        errorMessage = validationResult.msg,
        $node = $(args.cellNode);

      var ts = $node.data('tooltipster');
      if (ts) { 
        ts.destroy(); 
      }

      $node.tooltipster({
        alignTo: "element",
        offset: [0, 8],
        content: errorMessage,
        showEvent: null,
        hideEvent: null,
        className: options.className
      });
      $node.data('tooltipster').show();
    }

    function handleBeforeCellEditDestroy(e, args) {
      var ts = $(_grid.getActiveCellNode()).data('tooltipster');
      if (ts) {
        ts.destroy();
      }
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy
    });
  }
})(jQuery);
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
