(function ($) {
  // register namespace
  $.extend(true, window, {
    Slick: {
      RowSelectionModel: RowSelectionModel
    }
  });

  function RowSelectionModel(options) {
    var _grid;
    var _ranges = [];
    var _rowIndexes = [];
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _dragging;
    var _canvas;
    var _options;
    var _defaults = {
      selectActiveRow: true,
      dragToMultiSelect: false
    };

    function init(grid) {
      _options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _handler.subscribe(_grid.onActiveCellChanged, handleActiveCellChange);
      _handler.subscribe(_grid.onKeyDown, handleKeyDown);
      _handler.subscribe(_grid.onClick, handleClick);

      if (_options.dragToMultiSelect) {
        if (_grid.getOptions().multiSelect) {
          _handler.subscribe(_grid.onDragInit, handleDragInit)
            .subscribe(_grid.onDragStart, handleDragStart)
            .subscribe(_grid.onDrag, handleDrag)
            .subscribe(_grid.onDragEnd, handleDragEnd);
          _dragging = false;
          _canvas = _grid.getCanvasNode();
        } else {
          console.log("Can't do drag to Multi Select unless multiSelect is enabled for the grid");
        }
      }
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    function rangesToRows(ranges) {
      var rows = [];
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          rows.push(j);
        }
      }
      return rows;
    }

    function rowsToRanges(rows) {
      var ranges = [];
      var lastCell = _grid.getColumns().length - 1;
      for (var i = 0; i < rows.length; i++) {
        ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
      }
      return ranges;
    }

    function getRowsRange(from, to) {
      var i, rows = [];
      for (i = from; i <= to; i++) {
        rows.push(i);
      }
      for (i = to; i <= from; i++) {
        rows.push(i);
      }
      return rows;
    }

    function unionArrays(x, y) {
      var i;
      var obj = {};
      for (i = x.length - 1; i >= 0; i--) {
        obj[x[i]] = x[i];
      }
      for (i = y.length - 1; i >= 0; i--) {
        obj[y[i]] = y[i];
      }
      var res = [];
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          res.push(obj[k]);
        }
      }
      return res;
    }

    function xorArrays(x, y) {
      var i;
      var obj = {};
      for (i = x.length - 1; i >= 0; i--) {
        obj[x[i]] = x[i];
      }
      for (i = y.length - 1; i >= 0; i--) {
        if (obj.hasOwnProperty(y[i])) {
          delete obj[y[i]];
        } else {
          obj[y[i]] = y[i];
        }
      }
      var res = [];
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
          res.push(obj[k]);
        }
      }
      return res;
    }

    function getSelectedRows() {
      return rangesToRows(_ranges);
    }

    function setSelectedRows(rows) {
      setSelectedRanges(rowsToRanges(rows));
    }

    function setSelectedRanges(ranges) {
      var
        selectionIndexes = $.map(ranges, function(r) {
          return r.fromRow;
        }),
        deleteIndexes = _rowIndexes.filter(function(elem) {
          return selectionIndexes.indexOf(elem) === -1;
        });

      _rowIndexes = selectionIndexes;
      _ranges = ranges;
      _self.onSelectedRangesChanged.notify(_ranges);
      _self.onSelectionChanged.notify({
        deletes: deleteIndexes,
        selection: selectionIndexes
        //multiselect: multiselect === true
      });
    }

    function getSelectedRanges() {
      return _ranges;
    }

    function handleActiveCellChange(e, data) {
      if (_options.selectActiveRow && data.activeCell.row != null) {
        setSelectedRanges([new Slick.Range(data.activeCell.row, 0, data.activeCell.row, _grid.getColumns().length - 1)]);
      }
    }

    function handleKeyDown(e) {
      var activeRow = _grid.getActiveCell();
      if (activeRow && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.which == 38 || e.which == 40)) {
        var selectedRows = getSelectedRows();
        selectedRows.sort(function (x, y) {
          return x - y;
        });

        if (!selectedRows.length) {
          selectedRows = [activeRow.row];
        }

        var top = selectedRows[0];
        var bottom = selectedRows[selectedRows.length - 1];
        var active;

        if (e.which == 40) {
          active = activeRow.row < bottom || top == bottom ? ++bottom : ++top;
        } else {
          active = activeRow.row < bottom ? --bottom : --top;
        }

        if (active >= 0 && active < _grid.getDataLength()) {
          _grid.scrollRowIntoView(active);
          _ranges = rowsToRanges(getRowsRange(top, bottom));
          setSelectedRanges(_ranges);
        }

        e.preventDefault();
        e.stopPropagation();
      }
    }

    function handleClick(e) {
      var cell = _grid.getCellFromEvent(e);
      if (!cell || !_grid.canCellBeActive(cell.row, cell.cell)) {
        return false;
      }

      if (!_grid.getOptions().multiSelect || (
          !e.ctrlKey && !e.shiftKey && !e.metaKey)) {
        return false;
      }

      var selection = rangesToRows(_ranges);
      var idx = $.inArray(cell.row, selection);

      if (idx === -1 && (e.ctrlKey || e.metaKey)) {
        selection.push(cell.row);
        _grid.setActiveCell(cell.row, cell.cell);
      } else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
        selection = $.grep(selection, function (o, i) {
          return (o !== cell.row);
        });
        _grid.setActiveCell(cell.row, cell.cell);
      } else if (selection.length && e.shiftKey) {
        var last = selection.pop();
        var from = Math.min(cell.row, last);
        var to = Math.max(cell.row, last);
        selection = [];
        for (var i = from; i <= to; i++) {
          if (i !== last) {
            selection.push(i);
          }
        }
        selection.push(last);
        _grid.setActiveCell(cell.row, cell.cell);
      }

      _ranges = rowsToRanges(selection);
      setSelectedRanges(_ranges);
      e.stopImmediatePropagation();

      return true;
    }

    function handleDragInit(e, dd) {
      // prevent the grid from cancelling drag'n'drop by default
      e.stopImmediatePropagation();
    }

    function handleDragStart(e, dd) {
      var cell = _grid.getCellFromEvent(e);

      if (_grid.canCellBeSelected(cell.row, cell.cell)) {
        _dragging = true;
        e.stopImmediatePropagation();
      }

      if (!_dragging) {
        return;
      }

      _grid.focus();

      var x, y, o;
      o = $(_canvas).offset();
      x = dd.pageX - o.left;
      y = dd.pageY - o.top;
      var start = _grid.getCellFromPoint(x, y, {
        clipToValidRange: true
      });
      assert(start);

      var combinationMode = 'replace';
      if (e.shiftKey) {
        combinationMode = 'union';
      }
      if (e.ctrlKey || e.metaKey) {
        combinationMode = 'xor';
      }

      dd.range = {
        start: start, 
        end: {}
      };
      dd.alreadySelectedRows = rangesToRows(_ranges);
      dd.combinationMode = combinationMode;
    }

    function handleDrag(e, dd) {
      if (!_dragging) {
        return;
      }
      e.stopImmediatePropagation();

      var x, y, o;
      o = $(_canvas).offset();
      x = e.pageX - o.left;
      y = e.pageY - o.top;
      var end = _grid.getCellFromPoint(x, y, {
        clipToValidRange: true
      });
      assert(end);

      if (!_grid.canCellBeSelected(end.row, end.cell)) {
        return;
      }
      _grid.setActiveCell(end.row, end.cell);
      dd.range.end = end;
      var rows = getRowsRange(dd.range.start.row, dd.range.end.row);
      if (dd.combinationMode === 'union') {
        rows = unionArrays(rows, dd.alreadySelectedRows);
      } else if (dd.combinationMode === 'xor') {
        rows = xorArrays(rows, dd.alreadySelectedRows);
      }

      _ranges = rowsToRanges(rows);
      setSelectedRanges(_ranges);
      return true;
    }

    function handleDragEnd(e, dd) {
      if (!_dragging) {
        return;
      }

      _dragging = false;
      e.stopImmediatePropagation();
    }

    $.extend(this, {
      "getSelectedRows": getSelectedRows,
      "setSelectedRows": setSelectedRows,

      "getSelectedRanges": getSelectedRanges,
      "setSelectedRanges": setSelectedRanges,

      "init": init,
      "destroy": destroy,

      "onSelectedRangesChanged": new Slick.Event(),
      "onSelectionChanged": new Slick.Event()
    });
  }
})(jQuery);
