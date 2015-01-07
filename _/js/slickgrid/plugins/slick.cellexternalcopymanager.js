(function ($) {
  // register namespace
  $.extend(true, window, {
    Slick: {
      CellExternalCopyManager: CellExternalCopyManager
    }
  });


  function CellExternalCopyManager(options) {
    /*
      This manager enables users to copy/paste data from/to an external Spreadsheet application
      such as MS-Excel® or OpenOffice-Spreadsheet.

      Since it is not possible to access directly the clipboard in javascript, the plugin uses
      a trick to do it's job. After detecting the keystroke, we dynamically create a textarea
      where the browser copies/pastes the serialized data.

      options:
        copiedCellStyle : sets the css className used for copied cells. default : "copied"
        copiedCellStyleLayerKey : sets the layer key for setting css values of copied cells. default : "copy-manager"
        dataItemColumnValueExtractor : option to specify a custom column value extractor function
        dataItemColumnValueSetter : option to specify a custom column value setter function
        clipboardCommandHandler : option to specify a custom handler for paste actions
        includeHeaderWhenCopying : set to true and the plugin will take the name property from each column (which is usually what appears in your header) and put that as the first row of the text that's copied to the clipboard
        bodyElement: option to specify a custom DOM element which to will be added the hidden textbox. It's useful if the grid is inside a modal dialog.
    */
    var _grid;
    var _self = this;
    var _copiedRanges;    // keeps track of the last marked (Ctrl-C copied) range
    var _copyFingerPrint; // keeps the 'fingerprint' text associated with that last (INTERNAL) copy, so we can discern between external/internal PASTE activity later on.
    var _options = options || {};
    var _copiedCellStyleLayerKey = _options.copiedCellStyleLayerKey || "copy-manager";
    var _copiedCellStyle = _options.copiedCellStyle || "copied";
    var _copiedCellStyleExternalHelperKey = _options.copiedCellStyleExternalHelperKey || "copy-manager-external-helper";
    var _unmarkSelectionAfterTimeout = _options.unmarkSelectionAfterTimeout === 0 ? _options.unmarkSelectionAfterTimeout : (_options.unmarkSelectionAfterTimeout || 2000);
    var _clearCopyTI = 0;
    var _externalCopyActionWrapupDelay = 100;
    var _bodyElement = _options.bodyElement || document.body;
    var _externalCopyPastaCatcherTI = 0;
    var _externalCopyPastaCatcherEl = null;
    var _externalCopyPastaCatcherElBackup = null;

    var keyCodes = {
      'C': 67,
      'V': 86,
      'X': 88,
      'ESC': 27
    };

    function init(grid) {
      _grid = grid;
      _grid.onKeyDown.subscribe(handleKeyDown);

      // we need a cell selection model
      var cellSelectionModel = grid.getSelectionModel();
      if (!cellSelectionModel) {
        throw new Error("Selection model is mandatory for this plugin. Please set a selection model on the grid before adding this plugin: grid.setSelectionModel(new Slick.CellSelectionModel())");
      }
      // // we give focus on the grid when a selection is done on it.
      // // without this, if the user selects a range of cell without giving focus on a particular cell,
      // // the grid doesn't get the focus and key stroke handles (ctrl+C) don't work.
      // cellSelectionModel.onSelectedRangesChanged.subscribe(function (e, args) {
      //   var in_formula_editing_mode = (inEditMode && isNotCellCommit());
      //   if (!in_formula_editing_mode) {
      //     _grid.focus();
      //   }
      // });
    }

    function destroy() {
      _grid.onKeyDown.unsubscribe(handleKeyDown);
    }

    function getDataItemValueForColumn(row_item, columnDef, dstY, dstX, srcY, srcX) {
      if (_options.dataItemColumnValueExtractor) {
        return _options.dataItemColumnValueExtractor(row_item, columnDef, dstY, dstX, srcY, srcX);
      }

      var info = _grid.getCellValueAndInfo(srcY, srcX, {
        value: true,
        node: false,
        height: false,
        uid: false,
        css: false,
        format: true,

        outputPlainText: true         // this signals the formatter that the plaintext value is required.
      });
      var retVal = info.html;

      // TODO? : if a custom getter is not defined, we call serializeValue of the editor to serialize
      // if (columnDef.editor) {
      //   info = {
      //     grid: _grid,
      //     gridPosition: _grid.getGridPosition(),
      //     position: {top: srcY, left: srcX},  // a dummy position required by some editors
      //     //position: _grid.getActiveCellPosition(),
      //     container: $("<p>"),  // a dummy container
      //     //container: activeCellNode,
      //     column: columnDef,
      //     item: row_item || {},
      //     rowMetadata: rowMetadata,
      //     columnMetadata: columnMetadata,
      //     options: $.extend({}, options.editorOptions, columnDef.editorOptions),
      //     outputPlainText: true,         // this signals the formatter that the plaintext value is required.
      //     commitChanges: _grid.commitEditAndSetFocus,
      //     cancelChanges: _grid.cancelEditAndSetFocus
      //   };
      //   //currentEditor = new (editor || getEditor(activeRow, activeCell))(info);
      //   var editor = new columnDef.editor(info);
      //   editor.loadValue(row_item);
      //   retVal = editor.serializeValue();
      //   editor.destroy();
      // }

      return retVal;
    }

    function setDataItemValueForColumn(row_item, columnDef, value, dstY, dstX, srcY, srcX) {
      if (_options.dataItemColumnValueSetter) {
        return _options.dataItemColumnValueSetter(row_item, columnDef, value, dstY, dstX, srcY, srcX);
      }

      var info = _grid.getCellValueAndInfo(dstY, dstX, {
        value: false,
        node: false,
        height: false,
        uid: false,
        css: false,
        format: false,

        outputPlainText: true         // this signals the formatter that the plaintext value is required.
      });

      _grid.setDataItemValueForColumn(info.rowDataItem, info.column, value, info.rowMetadata, info.columnMetadata);

      // // if a custom setter is not defined, we call applyValue of the editor to unserialize
      // if (columnDef.editor) {
      //   var editorArgs = {
      //     container: $('body'),  // a dummy container
      //     column: columnDef,
      //
      //     grid: _grid,
      //     gridPosition: _grid.getGridPosition(),
      //     item: row_item || {},
      //     commitChanges: _grid.commitEditAndSetFocus,
      //     cancelChanges: _grid.cancelEditAndSetFocus,
      //
      //     position: {top: srcY, left: srcX}  // a dummy position required by some editors
      //   };
      //   var editor = new columnDef.editor(editorArgs);
      //   editor.loadValue(row_item);
      //   editor.applyValue(row_item, value);
      //   editor.destroy();
      // }
    }


    function _createTextBox(innerText) {
      if (!_externalCopyPastaCatcherEl) {
        _externalCopyPastaCatcherElBackup = document.activeElement;

        var ta = document.createElement('textarea');
        ta.style.position = 'absolute';
        ta.style.left = '-1000px';
        ta.style.top = document.body.scrollTop + 'px';
        ta.className = _copiedCellStyleExternalHelperKey;
        ta.value = innerText;
        _bodyElement.appendChild(ta);
        ta.select(); // .focus();

        _externalCopyPastaCatcherEl = ta;

        // 'side effect': clear the pending 'catch external copy/pasta action' timeout
        if (_externalCopyPastaCatcherTI) {
          clearTimeout(_externalCopyPastaCatcherTI);
          _externalCopyPastaCatcherTI = 0;
        }
      }
    }

    function _destroyTextBox() {
      if (_externalCopyPastaCatcherEl) {
        if (_externalCopyPastaCatcherElBackup && typeof _externalCopyPastaCatcherElBackup.select === 'function') {
          _externalCopyPastaCatcherElBackup.select();
        }
        _externalCopyPastaCatcherElBackup = null;
        
        _bodyElement.removeChild(_externalCopyPastaCatcherEl);
        _externalCopyPastaCatcherEl = null;

        if (_externalCopyPastaCatcherTI) {
          clearTimeout(_externalCopyPastaCatcherTI);
          _externalCopyPastaCatcherTI = 0;
        }
      }
    }

    function _decodeTabularData(_grid, externalSourceDataIO) {
      // stuff has been pasted into _externalCopyPastaCatcherEl textarea; now allow user to preprocess the pasted data.
      _self.onPasteCellsPrepare.notify({
        externalSourceDataIO: externalSourceDataIO,
        rangeIsCopied: true /* outside source coming in: always regarded as COPY rather than CUT */,
        rangeDataFromExternalSource: true
      });

      var columns = _grid.getColumns();
      var clipText = '' + externalSourceDataIO.getData();
      var clipRows = clipText.split(/[\n\f\r]/);
      var clippedRange = [];

      for (var i = 0; i < clipRows.length; i++) {
        if (clipRows[i] !== "") {
          clippedRange[i] = clipRows[i].split("\t");
        }
      }

      /*
       * HACKY FIX for this exec scenario in User App:
       * 
       *     copy item as text from someplace in UI,
       *     select other cell in slickgrid,
       *     hit Paste (Ctrl-V)
       * 
       * which will exec this code as slickgrid will assume the import is tabular data ('external excel import' feature)
       * 
       * The end result is that w==0 and h==0 and you get at least very odd bRange numbers in the resulting event notification.
       * 
       * Cause: clipText is NOT tabular data but simply a single formula/value expression
       */
      if (clippedRange.length === 0) {
        assert(0); // should never get here!

        clippedRange[0] = [];
        clippedRange[0][0] = clipText;
      }

      var selectedCell = _grid.getActiveCell();
      var ranges = _grid.getSelectionModel().getSelectedRanges();
      var selectedRange = ranges && ranges.length ? ranges[0] : null;   // pick only one selection
      var activeRow = null;
      var activeCell = null;

      if (selectedRange) {
        activeRow = selectedRange.fromRow;
        activeCell = selectedRange.fromCell;
      } else if (selectedCell) {
        activeRow = selectedCell.row;
        activeCell = selectedCell.cell;
      } else {
        // we don't know where to paste
        _self.onPasteCancelled.notify({
          rangeIsCopied: true, // outside source coming in: always regarded as COPY rather than CUT
          rangeDataFromExternalSource: true,
          externalDataSet: clippedRange,
          rawExternalData: clipText,
          status: "No destination cell or range has been provided"
        });
        return;
      }

      var oneCellToMultiple = false;
      var destH = clippedRange.length;
      var destW = (clippedRange.length && clippedRange[0]) ? clippedRange[0].length : 0;
      assert(destH >= 1);
      assert(destW >= 0);
      if (destH === 1 && destW === 1 && selectedRange) {
        oneCellToMultiple = !selectedRange.isSingleCell();
        destH = selectedRange.toRow - selectedRange.fromRow + 1;
        destW = selectedRange.toCell - selectedRange.fromCell + 1;
        assert(oneCellToMultiple || destH === 1);
        assert(oneCellToMultiple || destW === 1);
      }

      var clipCommand = {
        isClipboardCommand: true,
        clippedRange: clippedRange,
        oldValues: [],
        cellExternalCopyManager: _self,
        _options: _options,
        setDataItemValueForColumn: setDataItemValueForColumn,
        markCopySelection: markCopySelection,
        oneCellToMultiple: oneCellToMultiple,
        grid: _grid,
        activeRow: activeRow,
        activeCell: activeCell,
        destH: destH,
        destW: destW,
        destY: activeRow,
        destX: activeCell,
        maxDestY: _grid.getDataLength(),
        maxDestX: _grid.getColumns().length,
        addedRows: null,
        oldRowCount: null,

        execute: function () {
          assert(this.destH >= 1);
          assert(this.destX >= 1);

          var v, y, x, destx, desty, nd, dt, d, crdy;

          // check whether we need to add additional rows at the bottom of the grid for the entire pasted range to fit into the grid:
          this.oldRowCount = _grid.getDataLength();
          var availableRows = this.oldRowCount - this.destY;
          var addRows = 0;
          if (availableRows < this.destH) {
            d = _grid.getData();
            for (addRows = 1; addRows <= this.destH - availableRows; addRows++)
                d.push({});
            _grid.setData(d);
            _grid.render();
          }
          this.addedRows = addRows;

          for (y = 0; y < this.destH; y++) {
            this.oldValues[y] = [];
            for (x = 0; x < this.destW; x++) {
              desty = this.destY + y;
              destx = this.destX + x;

              if (desty < this.maxDestY && destx < this.maxDestX) {
                dt = _grid.getDataItem(desty);
                this.oldValues[y][x] = getDataItemValueForColumn(dt, columns[destx], desty, destx, y, x);
                if (this.oneCellToMultiple) {
                  this.setDataItemValueForColumn(dt, columns[destx], clippedRange[0][0], desty, destx, 0, 0);
                } else {
                  v = _options.cellValueRepresentingUndefined;
                  crdy = clippedRange[y];
                  if (crdy && crdy[x] !== undefined) {
                    v = crdy[x];
                  }
                  this.setDataItemValueForColumn(dt, columns[destx], v /* clippedRange[y][x] */, desty, destx, y, x);
                }
                _grid.updateCell(desty, destx);
              }
            }
          }

          var bRange = {
            fromCell: this.destX,
            fromRow: this.destY,
            toCell: this.destX + this.destW - 1,
            toRow: this.destY + this.destH - 1
          };

          this.markCopySelection([bRange]);
          _grid.getSelectionModel().setSelectedRanges([bRange]);
          _self.onPasteCells.notify({
            ranges: [bRange],
            rangeIsCopied: true, // outside source coming in: always regarded as COPY rather than CUT
            rangeDataFromExternalSource: true,
            oneCellToMultiple: this.oneCellToMultiple,
            externalDataSet: this.clippedRange,
            rawExternalData: clipText,
            clipCommand: this
          });
        },

        undo: function () {
          assert(this.destH >= 1);
          assert(this.destX >= 1);

          for (var y = 0; y < this.destH; y++) {
            for (var x = 0; x < this.destW; x++) {
              var desty = this.destY + y;
              var destx = this.destX + x;

              if (desty < this.maxDestY && destx < this.maxDestX) {
                var nd = _grid.getCellNode(desty, destx);
                var dt = _grid.getDataItem(desty);
                if (this.oneCellToMultiple) {
                  this.setDataItemValueForColumn(dt, columns[destx], this.oldValues[0][0], desty, destx, 0, 0);
                } else {
                  this.setDataItemValueForColumn(dt, columns[destx], this.oldValues[y][x], desty, destx, y, x);
                }
                _grid.updateCell(desty, destx);
              }
            }
          }

          var bRange = {
            fromCell: this.destX,
            fromRow: this.destY,
            toCell: this.destX + this.destW - 1,
            toRow: this.destY + this.destH - 1
          };

          this.markCopySelection([bRange]);
          _grid.getSelectionModel().setSelectedRanges([bRange]);
          _self.onUndoPasteCells.notify({
            ranges: [bRange],
            rangeIsCopied: true, // outside source coming in: always regarded as COPY rather than CUT
            rangeDataFromExternalSource: true,
            oneCellToMultiple: this.oneCellToMultiple,
            externalDataSet: this.clippedRange,
            rawExternalData: clipText,
            clipCommand: this
          });

          // only discard the added rows when nothing changed between the time when we invoked .execute() and this .undo():
          if (this.addedRows > 0 && this.oldRowCount === _grid.getDataLength()) {
            var d = _grid.getData();
             d.splice(this.oldRowCount, this.addedRows);
            _grid.setData(d);
            _grid.render();
          }
        }
      };

      if (_options.clipboardCommandHandler) {
        _options.clipboardCommandHandler(clipCommand);
      } else {
        clipCommand.execute();
      }
    }

    /**
     * Produce the range(s) specification which is currently registered with this plugin as the copy/cut source area.
     */
    function getCopiedRanges() {
      return _copiedRanges;
    }

    /**
     * Produce the 'fingerprint' for the range(s) which are registered with this plugin as the copy/cut source area.
     */
    function getCopyDataFingerprint() {
      return _copyFingerPrint;
    }

    /**
     * Cancel the copy/paste operation so that the next 'paste' action does not see a range to
     * copy from. 
     */
    function cancelCopyAction() {
      if (_copyFingerPrint) {
        assert(_copiedRanges);
        e.preventDefault();
        clearCopySelection();
        _self.onCopyCancelled.notify({
          ranges: _copiedRanges,
          rangeIsCopied: _copiedRanges.copy
        });
        _copiedRanges = null;
        _copyFingerPrint = null;
      }
    }

    /**
     * perform a 'copy' or 'cut' operation.
     *
     * @param  {Array}   ranges       set of ranges to copy/cut from. Each entry is a Slick.Range instance
     * @param  {Boolean} cutMode      A truthy value when you wish to 'cut', a falsey value signals this to be a 'copy' operation (which is the default).
     * @param  {Boolean} toClipboard  When TRUE, copy the TSV-formatted textual representation of the selected range(s) to the operating system's clipboard.
     *                                When FALSE, the function will instead return the textual representation (TSV format) of the selected data.
     * 
     * Note that you can alternatively pass the `copyMode` as an attributes of the `ranges` array, in which case `cutMode` must be `undefined` or `null`.
     *
     * @returns {Boolean}  TRUE when the data has been copied to the Clipboard too using the new HTML5 API; false otherwise.
     *                     (This return value is used to act correctly when performing a copy/paste action from the keyboard.)
     */
    function cutOrCopyAction(sourceRanges, cutMode, toClipboard) {
      assert(Array.isArray(sourceRanges));

      // make sure to clone (shallow) the range set as any subsequent selection action will echo into _copiedRanges!
      var ranges = sourceRanges.slice(0);
      if (sourceRanges.copy) {
        ranges.copy = sourceRanges.copy;
      }
      // override ranges' copy attribute?
      if (cutMode != null) {
        ranges.copy = !cutMode;
      }

      if (ranges.length !== 0) {
        _copiedRanges = ranges;
        markCopySelection(ranges);
        _self.onCopyCells.notify({
          ranges: ranges, 
          rangeIsCopied: ranges.copy 
        });

        var columns = _grid.getColumns();
        var clipTextArr = [];
        var range, i, j;

        // Note: this feature only works well when you have either a single range or all ranges address the same columns
        if (_options.includeHeaderWhenCopying) {
            var clipTextHeaders = [];
            range = ranges[0];

            for (j = range.fromCell; j < range.toCell + 1; j++) {
                clipTextHeaders.push(columns[j].name || "");
            }
            clipTextArr.push(clipTextHeaders.join("\t") + "\r\n");
        }

        for (var rg = 0; rg < ranges.length; rg++) {
            range = ranges[rg];
            var clipTextRows = [];
            for (i = range.fromRow; i < range.toRow + 1; i++) {
                var clipTextCells = [];
                var dt = _grid.getDataItem(i);

                for (j = range.fromCell; j < range.toCell + 1; j++) {
                    clipTextCells.push(getDataItemValueForColumn(dt, columns[j], clipTextRows.length, clipTextCells.length, i, j));
                }
                clipTextRows.push(clipTextCells.join("\t"));
            }
            clipTextArr.push(clipTextRows.join("\r\n"));
        }
        var clipText = clipTextArr.join("");
        _copyFingerPrint = clipText.replace(/\r/g, "");

        if (toClipboard) {
          return sendToNativeClipboard(clipText);
        } else {
          return clipText;
        }
      }
      return false;
    }

    function sendToNativeClipboard(clipText) {
      //
      // Clipboard handling
      // ------------------
      //
      // See also:
      //
      //   - http://help.dottoro.com/ljctuhrg.php
      //
      //   - http://stackoverflow.com/questions/7713182/copy-to-clipboard-for-all-browsers-using-javascript#11603131
      //     (where the hash in the URL points you at the solution approach which is also employed in slickgrid:
      //      no Flash, only a hidden (off screen) TEXTAREA DOM node, some arbitrary (heuristically determined)
      //      timeout and **the subtle requirement that these particular keypresses (Ctrl-C/Ctrl-X/Ctrl-V | Cmd-C/Cmd-X/Cmd-V)
      //      have their keyboard events 'bubble up' all the way into the browser default handler** so no
      //      event.stopPropagation() or `return true` in this (or any outer level) keyboard handler for you!**
      //
      //   - http://stackoverflow.com/questions/400212/how-to-copy-to-the-clipboard-in-javascript
      //     (note the by now obsoleted FF approach in there; just for completeness listed here: do not even consider this!)
      //
      //   - https://github.com/mojombo/clippy
      //     (Flash-based solution. Need I say more?)
      //
      if (window.clipboardData) {
        // MSIE browser supports clipboard access from JavaScript
        window.clipboardData.setData("Text", clipText);
        return true;
      } else {
        var activeCell = _grid.getActiveCell();

        _destroyTextBox();
        _createTextBox(clipText);

        _externalCopyPastaCatcherTI = setTimeout(function () {
          _destroyTextBox();
          assert(!_externalCopyPastaCatcherTI);

          // restore focus
          if (activeCell) {
            //$focus.attr('tabIndex', '-1');
            //$focus.focus();
            //$focus.removeAttr('tabIndex');
            _grid.setActiveCell(activeCell.row, activeCell.cell, {
              forceEditMode: false,
              takeFocus: true
            });
          }
        }, _externalCopyActionWrapupDelay);

        return false;
      }
    }

    /**
     * Redimension the given target range (or single top/left corner cell when no target range is provided)
     * to the given source range.
     *
     * @param  {Array} targetRanges           Array of 'paste to' selection ranges.
     * @param  {Cell}  singleTargetCornerCell single 'paste to' row/cell coordinate.
     * @param  {Array} sourceRanges           Array of 'copy from' selection ranges.
     *
     * @return {Array | Boolean}              On success, return an array of resultant 'paste to' selection ranges.
     *                                        On failure, return FALSE.
     */
    function redimTargetRangeToCopiedRanges(targetRanges, singleTargetCornerCell, sourceRanges) {
      // if (!sourceRanges) {
      //   return false;
      // }
      if (!targetRanges && !singleTargetCornerCell) {
        return false;
      }

      if (!targetRanges || targetRanges.length === 0 || (sourceRanges && sourceRanges.length && sourceRanges[0].matches(targetRanges[0]))) {
        if (singleTargetCornerCell) {
          // only having the active cell implies we want the entire range pasted from this top/left corner...
          var srcRange = (sourceRanges && sourceRanges.length) ? sourceRanges[0] : 
                        (targetRanges && targetRanges.length) ? targetRanges[0] :
                        {
                          toRow: 1,
                          fromRow: 1,
                          toCell: 1,
                          fromCell: 1
                        };
          targetRanges = [new Slick.Range(singleTargetCornerCell.row, singleTargetCornerCell.cell, singleTargetCornerCell.row + srcRange.toRow - srcRange.fromRow + 1, singleTargetCornerCell.cell + srcRange.toCell - srcRange.fromCell + 1)];
        } else {
          // we don't know where to paste
          return false;
        }
      }
      return targetRanges;
    }

    function __processPaste(isInternal, targetRanges, internalSourceRanges, externalSourceData) {
      if (isInternal) {
        assert(internalSourceRanges);

        _self.onPasteCells.notify({
          from: internalSourceRanges,
          to: targetRanges,
          rangeIsCopied: internalSourceRanges.copy,
          rangeDataFromExternalSource: false
        });
        // allow for Ctrl-C, Ctrl-V, Ctrl-V, ... repeated paste sequences to be all 'internal' based on that single Ctrl-C copied range!
        //
        // the ctrl-X effect is to delete original range at the first ctrl-V, so no repeat performance for that one though!
        if (!internalSourceRanges.copy) {
          clearCopySelection();
          _copiedRanges = null;
          _copyFingerPrint = null;
        }
        return true;
      } else {
        // pasting externally obtained data: nuke the internal Ctrl-C range buffer et al:
        clearCopySelection();
        _copiedRanges = null;
        _copyFingerPrint = null;

        _decodeTabularData(_grid, {
          getData: function () {
            return externalSourceData;
          },
          setData: function (str) {
            externalSourceData = str;
          }
        });
        return false;
      }
    }

    function pasteAction(targetRanges, isInternal, internalSourceRanges, externalSourceData) {
      // Do keep in mind that there may be no source range what-so-ever when the user is
      // performing an 'external' paste, i.e. is pasting content coming in from outside 
      // the application.
      if (!targetRanges || !targetRanges.length) {
        // we don't know where to paste
        _self.onPasteCancelled.notify({
          targetRanges: targetRanges,
          isInternal: isInternal,
          internalSourceRanges: internalSourceRanges,
          externalSourceData: externalSourceData,
          status: "No destination cell or range has been provided"
        });
        return false;
      }
      assert(isInternal == null ? !externalSourceData : true);
      assert(isInternal == null ? !internalSourceRanges : true);
      assert(isInternal == null ? _copiedRanges : true);
      // When caller indicates to know whether this is an internal or external paste operation, 
      // then caller is also supposed to know where the stuff is coming from, respectively
      // what stuff is coming in exactly!
      if (isInternal != null && !(isInternal ? internalSourceRanges && !externalSourceData : !internalSourceRanges && externalSourceData)) {
        // we don't know what to paste
        _self.onPasteCancelled.notify({
          targetRanges: targetRanges,
          isInternal: isInternal,
          internalSourceRanges: internalSourceRanges,
          externalSourceData: externalSourceData,
          status: "No source range or data has been provided"
        });
        return false;
      }

      // When we're not sure it's a slickgrid internal-to-internal copy/paste operation
      // we take this branch:
      if (isInternal == null) {
        // When we still have a copy/pasta action pending, we IGNORE this one
        // (this code might even have been invoked recursively as Ctrl+C/Ctrl+V
        // do NOT mark the keyboard event as 'handled' when they actually do,
        // just because they only do so after a timeout...)
        if (_externalCopyPastaCatcherTI) {
          // simply ignore...
          return false;
        }

        /*
         * We have a slightly different behaviour than the regular 'copy manager' here:
         *
         * We do the 'fetch copy from external app' treatment always, but only follow through on it
         * when we do NOT have marked a cell range for ourselves during a previous Ctrl-C/X:
         * that would mean we are doing an INTERNAL copy/paste -- or at least PASTE -- anyhow.
         */
        _createTextBox('');

        _externalCopyPastaCatcherTI = setTimeout(function () {
          // check the 'copy fingerprint' to detect if we are copying/pasting cell data 'internally' i.e. within the same slickgrid grid:
          var fp = _externalCopyPastaCatcherEl.value;
          assert(typeof fp === 'string');
          fp = fp.replace(/\r/g, "");

          assert(!externalSourceData);
          assert(!internalSourceRanges);
          assert(_copyFingerPrint === fp ? _copiedRanges : true);
          __processPaste(_copyFingerPrint === fp, targetRanges, _copiedRanges, fp);

          _destroyTextBox();
          assert(!_externalCopyPastaCatcherTI);
        }, _externalCopyActionWrapupDelay);

        return false;
      } else {
        return __processPaste(isInternal, targetRanges, internalSourceRanges, externalSourceData);
      }
    }

    function handleKeyDown(e, args) {
      assert(!(e instanceof Slick.EventData));
      var ranges, rv;
      if (!_grid.getEditorLock().isActive()) {
        if (e.which === keyCodes.ESC) {
          cancelCopyAction();
        }

        // Control+C / Control+X  -- these have the same effect on initial range
        if ((e.which === keyCodes.C || e.which === keyCodes.X) && (e.ctrlKey || e.metaKey)) {
          ranges = _grid.getSelectionModel().getSelectedRanges();

          // also remember whether this was Ctrl-C (copy) or Ctrl-X (cut):
          ranges.copy = (e.which === keyCodes.C);

          rv = cutOrCopyAction(ranges, !ranges.copy, true);

          //e.preventDefault(); <-- DO exec the default behaviour as that will fill the textbox we just created!

          assert(rv === true || rv === false);
          return rv;
        }

        // Control+V
        if (e.which === keyCodes.V && (e.ctrlKey || e.metaKey)) {
          ranges = _grid.getSelectionModel().getSelectedRanges();
          var selectedCell = _grid.getActiveCell();
          var targetRanges = redimTargetRangeToCopiedRanges(ranges, selectedCell, _copiedRanges);
          rv = pasteAction(targetRanges, null, null, null);
          assert(rv === false);
          return false;
        }
      }
    }

    function markCopySelection(ranges) {
      clearCopySelection();

      var columns = _grid.getColumns();
      var hash = {};
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          hash[j] = {};
          for (var k = ranges[i].fromCell; k <= ranges[i].toCell && k < columns.length; k++) {
            hash[j][columns[k].id] = _copiedCellStyle;
          }
        }
      }
      _grid.setCellCssStyles(_copiedCellStyleLayerKey, hash);
      if (_clearCopyTI) {
        clearTimeout(_clearCopyTI);
      }
      if (_unmarkSelectionAfterTimeout > 0) {
        _clearCopyTI = setTimeout(function () {
          clearCopySelection();
          _clearCopyTI = 0;
        }, _unmarkSelectionAfterTimeout);
      }
    }

    function clearCopySelection() {
      _grid.removeCellCssStyles(_copiedCellStyleLayerKey);
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,
      "clearCopySelection": clearCopySelection,
      "handleKeyDown": handleKeyDown,
      "redimTargetRangeToCopiedRanges": redimTargetRangeToCopiedRanges,
      "getCopiedRanges": getCopiedRanges,
      "getCopyDataFingerprint": getCopyDataFingerprint,
      "cutOrCopyAction": cutOrCopyAction,
      "pasteAction": pasteAction,
      "cancelCopyAction": cancelCopyAction,

      "onCopyCells": new Slick.Event(),
      "onCopyCancelled": new Slick.Event(),
      "onPasteCells": new Slick.Event(),
      "onPasteCellsPrepare": new Slick.Event(),       // only invoked when executing an external data PASTE operation
      "onPasteCancelled": new Slick.Event(),
      "onUndoPasteCells": new Slick.Event()
    });
  }
})(jQuery);
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
