(function ($) {
  // register namespace
  $.extend(true, window, {
    Slick: {
      Editors: {
        Formula: FormulaEditor
      }
    }
  });


  /**
   * A proof-of-concept cell editor with Excel-like range selection and insertion.
   */
  function FormulaEditor(args) {
    var _self = this;
    var _editor = new Slick.Editors.Text(args);
    var _selector;

    $.extend(this, _editor);

    function init() {
        // register a plugin to select a range and append it to the textbox
        // since events are fired in reverse order (most recently added are executed first),
        // this will override other plugins like moverows or selection model and will
        // not require the grid to not be in the edit mode
        _selector = new Slick.CellRangeSelector();
        _selector.onCellRangeSelected.subscribe(_self.handleCellRangeSelected);
        args.grid.registerPlugin(_selector);
    }

    this.destroy = function () {
        _selector.onCellRangeSelected.unsubscribe(_self.handleCellRangeSelected);
        args.grid.unregisterPlugin(_selector);
        _editor.destroy();
    };

    this.handleCellRangeSelected = function (e, e_data) {
        var columnDefs = args.grid.getColumns();
        var range = e_data.range;
        var fromColumnName = columnDefs[range.fromCell].name;
        var toColumnName = columnDefs[range.toCell].name;
        var fv = _editor.serializeValue();

        // When the 'column header names' are not purely alphanumeric, switch to a different representation
        // of the selected range.
        if (/^[a-z]+$/i.test(fromColumnName) && /^[a-z]+$/i.test(toColumnName)) {
            fv += " " +
                fromColumnName +
                range.fromRow +
                ":" +
                toColumnName +
                range.toRow;
        } else {
            fv += " (" +
                fromColumnName + "," +
                range.fromRow +
                "):(" +
                toColumnName + "," +
                range.toRow + ")";
        }
        _editor.setDirectValue(fv);
    };

    init();
  }
})(jQuery);








// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
