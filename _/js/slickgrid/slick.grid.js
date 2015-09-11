/**
 * @license
 * (c) 2009-2013 Michael Leibman
 * michael{dot}leibman{at}gmail{dot}com
 * http://github.com/mleibman/slickgrid
 *
 * Distributed under MIT license.
 * All rights reserved.
 *
 * SlickGrid v2.2
 *
 * NOTES:
 *     Cell/row DOM manipulations are done directly bypassing jQuery's DOM manipulation methods.
 *     This increases the speed dramatically, but can only be done safely because there are no event handlers
 *     or data associated with any cell/row DOM nodes.  Cell editors must make sure they implement .destroy()
 *     and do proper cleanup.
 */

// make sure required JavaScript modules are loaded
if (typeof jQuery === "undefined") {
  throw new Error("SlickGrid requires jquery module to be loaded");
}
if (!jQuery.fn.drag) {
  throw new Error("SlickGrid requires jquery.event.drag module to be loaded");
}
if (typeof Slick === "undefined") {
  throw new Error("slick.core.js not loaded");
}


(function ($) {
  // Slick.Grid
  $.extend(true, window, {
    Slick: {
      Grid: SlickGrid
    }
  });

  // Helper function to aid Chrome/V8 optimizer: for...in loops prevent a function to become JIT compiled so we separate out this bit of code here:
  function __extend_support(dst, src) {
    for (var i in src) {
      dst[i] = src[i];
    }
  }

  // Helper function: a quick & dirty faster version of $.extend() for our purposes...
  function __extend(dst, dotdotdot) {
    var a = arguments;
    var len = a.length;
    for (var i = 1; i < len; i++) {
      var src = arguments[i];
      if (!src) continue;
      __extend_support(dst, src);
    }
    return dst;
  }

  // shared across all grids on the page
  var scrollbarDimensions;
  var maxSupportedCssHeight;    // browser's breaking point
  var isBrowser;                // browser info to be used for those very special browser quirks & ditto hacks where feature detection doesn't cut it

  /* @const */ var MAX_INT = 2147483647;

  /* @const */ var NAVIGATE_PREV = 1;
  /* @const */ var NAVIGATE_NEXT = 2;
  /* @const */ var NAVIGATE_LEFT = 3;
  /* @const */ var NAVIGATE_RIGHT = 4;
  /* @const */ var NAVIGATE_UP = 5;
  /* @const */ var NAVIGATE_DOWN = 6;
  /* @const */ var NAVIGATE_HOME = 7;
  /* @const */ var NAVIGATE_END = 8;

  /* @const */ var HEADER_ROW_WIDTH_CORRECTION = 2000;

  //////////////////////////////////////////////////////////////////////////////////////////////
  // SlickGrid class implementation (available as Slick.Grid)

  /**
   * Creates a new instance of the grid.
   * @class SlickGrid
   * @constructor
   * @param {Node}              container   Container node to create the grid in.
   * @param {Array,Object}      data        An array of objects for databinding.
   * @param {Array}             columns     An array of column definitions.
   * @param {Object}            options     Grid options.
   *
   * [KCPT] SlickGrid 2.1
   *  data: Array of data items or an object which implements the data-access functions
   *    {Array} of data items, each item has the following:
   *      id:                 {String}    A unique ID for the item
   *      Other properties as indicated by the `field` entries of the columns array.
   *      For instance, if one of the columns specifies a field value of `name`,
   *      then each item of the data array should have a `name` property.
   *    {Object} implementing the data-access functions:
   *      getLength()         Returns the number of data items (analogous to data.length)
   *      getItem(i)          Returns the i-th data item (analogous to data[i])
   *      getItemMetadata(row, cell)
   *                          Returns the metadata for the given row index.
   *                          `cell` may be FALSE or an index number of the cell currently
   *                          receiving attention -- this is handy when the metadata is
   *                          generated on the fly and the grid is very large/complex,
   *                          i.e. it is costly to cache all row/column metadata.
   *    Slick.DataView is an example of an Object which provides this API. It is essentially
   *    a wrapper around an {Array} of data items which provides additional data manipulation
   *    features, such as filtering and sorting.
   *
   *  columns: Array of objects which specify details about the columns
   *      id:                 {String}    A unique ID for the column
   *      name:               {String}    The name of the column, displayed in column header cell
   *      field:              {String}    The name of the data item property to be displayed in this column
   *      width:              {Number}    The width of the column in pixels
   *      minWidth:           {Number}    The minimum width of the column in pixels
   *      maxWidth:           {Number}    The maximum width of the column in pixels
   *      minHeight:          {Number}    The minimum height of the grid in pixels
   *      maxHeight:          {Number}    The maximum height of the grid in pixels
   *      cssClass:           {String}    The name of the CSS class to use for cells in this column
   *      formatter:          {Function}  formatter(rowIndex, colIndex, cellValue, colInfo, rowDataItem, cellMetaInfo) for grid cells
   *      headerFormatter:    {Function}  formatter(rowIndex, colIndex, cellValue, colInfo, rowDataItem, cellMetaInfo) for header cells
   *      headerRowFormatter: {Function}  formatter(rowIndex, colIndex, cellValue, colInfo, rowDataItem, cellMetaInfo) for headerRow cells (option.showHeaderRow)
   *      editor:             {Function}  The constructor function for the class to use for editing of grid cells
   *      validator:          {Function}  A function to be called when validating user-entered values
   *      cannotTriggerInsert: {Boolean}
   *      resizable:          {Boolean}   Whether this column can be resized
   *      selectable:         {Boolean}   Whether this column can be selected
   *      sortable:           {Boolean}   Whether the grid rows can be sorted by this column
   *      children:           {Array}     An optional array of columns which are the children of this parent.
   *
   *  options: Object with additional customization options
   *      explicitInitialization:
   *                          {Boolean}   Defers initialization until the client calls the
   *                                      grid.init() method explicitly. Supports situations in
   *                                      which SlickGrid containers may not be in the DOM at creation.
   *      rowHeight:          {Number}    Height of each row in pixels
   *      autoHeight:         {Boolean}   (?) Don't need vertical scroll bar
   *      defaultColumnWidth: {Number}    Default column width for columns that don't specify a width
   *      enableColumnReorder: {Boolean}  Can columns be reordered?
   *      enableAddRow:       {Boolean}   Can rows be added?
   *      showTopPanel:       {Boolean}   Should the top panel be shown?
   *      topPanelHeight:     {Number}    Height of the top panel in pixels
   *      headerHeight:       {Number}    Height of each column header row in pixels (*not the "extra header row"*)
   *      showHeaderRow:      {Boolean}   Should the extra header row be shown?
   *      headerRowHeight:    {Number}    Height of the extra header row in pixels
   *      showFooterRow:      {Boolean}   Should the extra footer row be shown?
   *      footerRowHeight:    {Number}    Height of the extra footer row in pixels
   *      enableCellNavigation: {Boolean} Should arrow keys navigate between cells?
   *      enableTextSelectionOnCells:
   *                          {Boolean}   Should text selection be allowed in cells? (This is MSIE specific; other browsers always assume `true`)
   *      forceFitColumns:    {Boolean}   Should column widths be automatically resized to fit?
   *      resizeOnlyDraggedColumn
   *                          {Boolean}   Only resize the column being resized, instead of resizing any preceding columns as well when the user drags far left 
   *      dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata):
   *                          {Function}  If present, will be called to retrieve a data value from the
   *                                      specified item for the corresponding column.
   *                                      Analogous to item[columnDef.field], where item is analogous to data[i].
   *      formatterFactory:   {Object}    If present, its getFormatter(columnInfo, row, cell, rowMetadata, columnMetadata) method will be called
   *                                      to retrieve a formatter for the specified cell
   *      selectedCellCssClass: {Object?} (?)Object used to specify CSS class for selected cells
   *      cellFlashingCssClass: {Object?} (?)Object used to specify CSS class for flashing cells
   *      enableAsyncPostRender: {Boolean}
   *      asyncPostRenderDelay: {Number}  Delay passed to setTimeout in milliseconds before 
   *                                      the PostRender queue is executed in slices of `asyncPostRenderSlice` 
   *                                      each with a gap of `asyncPostRenderDelay`. 
   *      asyncPostRenderSlice: {Number}  Time slice available for each round of async rendering. 
   *                                      Note that the probably-worst case is where the sync render process 
   *                                      takes about twice this amount of time -- that is assuming 
   *                                      each individual cell's async render action takes that amount 
   *                                      of time or *less*.
   *      editable:           {Boolean}   Is editing table cells supported?
   *      autoEdit:           {Boolean}   (?)Should editing be initiated automatically on click in cell?
   *      editorFactory:      {Object}    If present, its getEditor(columnInfo, row, cell, rowMetadata, columnMetadata) method will be called
   *                                      to retrieve an editor for the specified cell,
   *                                      unless column.editor is specified, which will be used.
   *      editorLock:         {Object}    a Slick.EditorLock instance; the default NULL will make SlickGrid use the Slick.GlobalEditorLock singleton
   *      asyncEditorLoading: {Boolean}   Should editors be loaded asynchronously?
   *      asyncEditorLoadDelay: {Number}  Delay passed to setTimeout in milliseconds
   *      editCommandHandler: {Function}  editCommandHandler(item, column, editCommand) is called from
   *                                      the commitCurrentEdit() function, where it can be used to
   *                                      implement undo/redo, for instance.
   *      fullWidthRows:      {Boolean}   If true, rows are sized to take up the available grid width.
   *      multiColumnSort:    {Boolean}   If true, rows can be sorted by multiple columns.
   *      defaultFormatter:   {Function}  Default function for converting cell values to strings.
   *      defaultEditor:      {Function}  Default function for editing cell values.
   *      defaultRowFormatter: {Function} Default function for formatting each grid row container.
   *      defaultHeaderFormatter: 
   *                          {Function}  The Slick.Formatters compatible cell formatter used to render the header cell.
   *      defaultHeaderRowFormatter: 
   *                          {Function}  The Slick.Formatters compatible cell formatter used to render the headerRow cell.
   *                                      The "headerRow" is the header row shown by SlickGrid when the `option.showHeaderRow` is enabled.
   *      scrollHoldoffX:     {Number | Function}
   *                                      Specify the number of columns away from the edge where keyboard navigation
   *                                      should scroll the view; when specified as a single number, than all four edges
   *                                      (top/bottom/left/right) will "hold off" this amount; otherwise you may specify 
   *                                      a function which should return the number of rows/cells to hold off, depending on
   *                                      the input arguments.
   *      scrollHoldoffY:     {Number | Function}
   *                                      Specify the number of rows away from the edge where keyboard navigation
   *                                      should scroll the view; when specified as a single number, than all four edges
   *                                      (top/bottom/left/right) will "hold off" this amount; otherwise you may specify 
   *                                      a function which should return the number of rows/cells to hold off, depending on
   *                                      the input arguments.
   *      smoothScrolling:    {Boolean}   When set, slickgrid will scroll the view 1 line/cell at a time, rather than an entire page.
   *      forceSyncScrolling: {Boolean}   If true, renders more frequently during scrolling, rather than
   *                                      deferring rendering until default scroll thresholds are met (asyncRenderDelay).
   *      asyncRenderDelay:   {Number}    Delay passed to setTimeout in milliseconds before view update is actually rendered.
   *      addNewRowCssClass:  {String}    specifies CSS class for the extra bottom row: "add new row"
   * [/KCPT]
   **/
  function SlickGrid(container, data, columnDefinitions, options) {
    // settings
    var defaults = {
      explicitInitialization: false,
      rowHeight: 25,
      defaultColumnWidth: 80,
      enableAddRow: false,
      editable: false,
      autoEdit: true,
      enableCellNavigation: true,
      enableColumnReorder: true,
      asyncEditorLoading: false,
      asyncEditorLoadDelay: 100,
      forceFitColumns: false,
      resizeOnlyDraggedColumn: false,
      enableAsyncPostRender: false,
      asyncPostRenderDelay: 50,
      asyncPostRenderSlice: 50,
      autoHeight: false,
      editorLock: Slick.GlobalEditorLock,
      headerHeight: 25,
      showHeaderRow: false,
      headerRowHeight: 25,
      showFooterRow: false,
      footerRowHeight: 25,
      showTopPanel: false,
      topPanelHeight: 25,
      formatterFactory: null,
      editorFactory: null,
      formatterOptions: {},
      editorOptions: {},
      cellFlashingCssClass: "flashing",
      selectedCellCssClass: "selected",
      multiSelect: true,
      enableTextSelectionOnCells: true,
      dataItemColumnValueExtractor: null,
      dataItemColumnValueSetter: null,
      fullWidthRows: false,
      multiColumnSort: false,
      defaultFormatter: defaultFormatter,
      defaultEditor: null,
      defaultRowFormatter: defaultRowFormatter,
      defaultHeaderFormatter: defaultHeaderFormatter,
      defaultHeaderRowFormatter: defaultHeaderRowFormatter,
      minBufferSize: 3,
      maxBufferSize: 50,
      scrollHoldoffX: 2,
      scrollHoldoffY: 3,
      smoothScrolling: true,
      forceSyncScrolling: false,
      asyncRenderDelay: 45,         // this value is picked to 'catch' typematic key repeat rates as low as 12-per-second: 
                                    // keep your navigator keys depressed to see the delayed render + mandatory mini-cell-renders kicking in. 
      asyncRenderSlice: 50,
      asyncRenderInterleave: 20,
      addNewRowCssClass: "new-row",
      editCommandHandler: null,
      clearCellBeforeEdit: true,
      createCssRulesCallback: null
    };

    var columnDefaults = {
      name: "",
      resizable: true,
      sortable: false,
      minWidth: 30,
      rerenderOnResize: false,
      headerCssClass: null,
      defaultSortAsc: true,
      focusable: true,
      selectable: true,
      reorderable: true,
      dataItemColumnValueExtractor: null
      // childrenFirstIndex: <N>                set to the first flattened column index covered by this column when this column is a parent (forming an inclusive range)
      // childrenLastIndex:  <N>                set to the last flattened column index covered by this column when this column is a parent (forming an inclusive range)
    };

    // scroller
    var virtualTotalHeight;   // virtual height
    var scrollableHeight;     // real scrollable height
    var pageHeight;           // page height
    var numberOfPages;        // number of pages
    var jumpinessCoefficient; // "jumpiness" coefficient

    var page = 0;           // current page
    var pageOffset = 0;     // current page offset
    var vScrollDir = 1;

    // private
    var initialized = 0;    // 0/1/2: 2 = fully initialized
    var $container;
    var uid = "slickgrid_" + Math.round(1000000 * Math.random());
    var self = this;
    var $focusSink, $focusSink2;
    var $headerScroller;
    var $headers;
    var $headerRow, $headerRowScroller;
    var $footerRow, $footerRowScroller;
    var $topPanelScroller;
    var $topPanel;
    var $viewport;
    var $canvas;
    var $style;
    var $boundAncestors;
    var stylesheet, columnCssRulesL, columnCssRulesR, columnCssRulesHL, columnCssRulesHR;
    var viewportH, viewportW;
    var canvasWidth, totalColumnsWidth;
    var viewportHasHScroll, viewportHasVScroll;
    var headerColumnWidthDiff = 0, headerColumnHeightDiff = 0, // border+padding
        cellWidthDiff = 0, cellHeightDiff = 0;
    var absoluteColumnMinWidth;

    var tabbingDirection = 1;
    var activePosY;
    var activePosX;
    var activeRow, activeCell;
    var activeCellNode = null;
    var currentEditor = null;
    var serializedEditorValue;
    var editController = null;

    // It turned out that focusin / focusout events fired by jQuery also occur when we call
    // $el.focus() on any element inside slickgrid. To prevent very weird event sequences
    // from thus occurring we *block* these events from firing any SlickGrid event (onFocusIn/onFocusOut)
    // or any other slickgrid-internal activity while we are fully in control of the situation
    // already while we are calling jQuery's $el.focus() on a cell of ours (movingFocusLock > 0)
    var movingFocusLock = 0;
    var movingFocusLockData = [];    

    // To prevent mouseenter/leave events from misfiring while a header/column drag is commencing
    // we introduce yet another lock:
    var headerDragCommencingLock = null;

    // Monitor focus; when it is in a cell (or a child thereof) and that cell is destroyed due to cache invalidation,
    // then switch focus over to the focusSink so that keyboard events do not get lost during the interim
    // while the cells are rerendered.
    var focusMustBeReacquired = false;   

    var cssRulesHashtable = {};
    var cssRulesCount = 0;

    var rowsCache = [];
    // var deletedRowsCache = [];
    var rowPositionCache = [];
    var rowsCacheStartIndex = MAX_INT;
    // var deletedRowsCacheStartIndex = MAX_INT;
    var cellSpans = [];
    var renderedRows = 0;
    // var previousRenderWasIncomplete = false;
    var prevScrollTop = 0;
    var scrollTop = 0;
    var lastRenderedScrollTop = 0;
    var lastRenderedScrollLeft = 0;
    var prevScrollLeft = 0;
    var scrollLeft = 0;

    var selectionModel;
    var selectedRows = [];

    var plugins = [];
    var cellCssClasses = {};

    var columnsById = {};
    var columns = null;
    var columnsDefTree = null;
    var sortColumns = [];
    var columnPosLeft = [];      // this cache array length is +1 longer than columns[] itself as we store the 'right edge + 1 pixel' as the 'left edge' of the first column beyond the grid width just as it would have been anyway. This simplifies the rest of the code.
    //var columnPosRight = [];

    // async call handles
    var h_retry_init = null;
    var h_editorLoader = null;
    var h_render = null;
    var h_postrender = null;
    var postprocess_perftimer = null;
    var render_perftimer = null;
    var postProcessedRows = [];
    var postProcessToRow = 0;
    var postProcessFromRow = MAX_INT;

    // perf counters
    var counter_rows_rendered = 0;
    var counter_rows_removed = 0;

    var hasNestedColumns = false;
    var nestedColumns = null;   // 2D array: [depth][h_index] -> column reference

    // These two variables work around a bug with inertial scrolling in Webkit/Blink on Mac.
    // See http://crbug.com/312427.
    var rowNodeFromLastMouseWheelEvent;  // this node must not be deleted while inertial scrolling
    var zombieRowNodeFromLastMouseWheelEvent;  // node that was hidden instead of getting deleted


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Constants: lookup tables

    /* @const */ var tabbingDirections = LU(
      NAVIGATE_UP, -1,
      NAVIGATE_DOWN, 1,
      NAVIGATE_LEFT, -1,
      NAVIGATE_RIGHT, 1,
      NAVIGATE_PREV, -1,
      NAVIGATE_NEXT, 1,
      NAVIGATE_HOME, -1,
      NAVIGATE_END, 1
    );
    /* @const */ var stepFunctions = LU(
      NAVIGATE_UP, gotoUp,
      NAVIGATE_DOWN, gotoDown,
      NAVIGATE_LEFT, gotoLeft,
      NAVIGATE_RIGHT, gotoRight,
      NAVIGATE_PREV, gotoPrev,
      NAVIGATE_NEXT, gotoNext,
      NAVIGATE_HOME, gotoHome,
      NAVIGATE_END, gotoEnd
    );

    // Internal use: generate a lookup table for a key,value set.
    function LU(/* ... */) {
      var lu = [];
      for (var a = arguments, i = 0, l = a.length; i < l; i += 2) {
        lu[a[i]] = a[i + 1];
      }
      return lu;
    }

    // The cell attributes which are set by vanilla SlickGrid: 
    var slickgridStandardCellAttributes = {
      tabindex: 1,
      role: 1,
      "class": 1,
      "aria-describedby": 1
    };

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Initialization

    function init() {
      $container = $(container);
      if ($container.length < 1) {
        throw new Error("SlickGrid requires a valid container, " + container + " does not exist in the DOM.");
      }
      if (columns) {
        throw new Error("SlickGrid setColumns or updateColumnWidths have been called before the instance has been properly initialized.");
      }

      if (!columnDefinitions || !columnDefinitions.length) {
        columnDefinitions = [{}];
      }

      if (typeof get_browser_info === "undefined") {
        throw new Error("SlickGrid requires detect_browser.js to be loaded.");
      }
      if (!isBrowser) {
        isBrowser = get_browser_info();
        isBrowser.safari    = /safari/i.test(isBrowser.browser);
        isBrowser.safari605 = isBrowser.safari && /6\.0/.test(isBrowser.version);
        isBrowser.msie      = /msie/i.test(isBrowser.browser);
      }

      // calculate these only once and share between grid instances
      maxSupportedCssHeight = maxSupportedCssHeight || getMaxSupportedCssHeight();
      scrollbarDimensions = scrollbarDimensions || measureScrollbar();

      options = __extend({}, defaults, options);
      validateAndEnforceOptions();
      assert(options.defaultColumnWidth > 0);
      columnDefaults.width = options.defaultColumnWidth;

      parseColumns(columnDefinitions);
      assert(columns);
      updateColumnCaches();

      // validate loaded JavaScript modules against requested options
      if (options.enableColumnReorder && !$.fn.sortable) {
        throw new Error("SlickGrid's `enableColumnReorder = true` option requires jquery-ui.sortable module to be loaded");
      }

      editController = {
        commitCurrentEdit: commitCurrentEdit,
        cancelCurrentEdit: cancelCurrentEdit
      };

      $container
          .empty()
          .addClass("slickgrid-container ui-widget " + uid)
          .attr("role", "grid")
          .attr("tabIndex", 0)
          .attr("hideFocus", "true");

      // set up a positioning container if needed
      if (!/relative|absolute|fixed/.test($container.css("position"))) {
        $container.css("position", "relative");
      }

      $focusSink = $("<div tabIndex='0' hideFocus='true' style='position:absolute;width:0;height:0;top:0;left:0;outline:0;'></div>").appendTo($container);

      $headerScroller = $("<div class='slick-header ui-state-default' />").appendTo($container);

      $headers = $("<div class='slick-header-columns' role='header-row' />").appendTo($headerScroller);

      $headerRowScroller = $("<div class='slick-headerrow ui-state-default' />").appendTo($container);
      $headerRow = $("<div class='slick-headerrow-columns' />").appendTo($headerRowScroller);

      $topPanelScroller = $("<div class='slick-top-panel-scroller ui-state-default' />").appendTo($container);
      $topPanel = $("<div class='slick-top-panel' />").appendTo($topPanelScroller);

      if (!options.showTopPanel) {
        $topPanelScroller.hide();
      }

      if (!options.showHeaderRow) {
        $headerRowScroller.hide();
      }

      $viewport = $("<div class='slick-viewport' >").appendTo($container);
      //$viewport.css("overflow-y", (options.autoHeight && !clippedAutoSize) ? "auto" : "auto");

      $canvas = $("<div class='grid-canvas' />").appendTo($viewport);

      $footerRowScroller = $("<div class='slick-footerrow' />").appendTo($container);
      $footerRow = $("<div class='slick-footerrow-columns' />").appendTo($footerRowScroller);

      if (!options.showFooterRow) {
        $footerRowScroller.hide();
      }

      assert(!initialized);
      setViewportWidth();
      var rv = updateCanvasWidth();    // note that this call MUST NOT fire the onCanvasChanged event!

      $focusSink2 = $focusSink.clone().appendTo($container);

      if (!options.explicitInitialization) {
        rv &= finishInitializationUntilDone();
      }
      return rv;
    }

    // Stubbornly keep at it until the init is really completely done.
    function finishInitializationUntilDone() {
      clearTimeout(h_retry_init);
      h_retry_init = null;

      // Only execute the initialization when it hasn't run to completion yet:
      if (initialized < 3) {
        if (!finishInitialization()) {
          // When the initialization didn't complete entirely, we have to poll the browser to 
          // get to a state where we get the initialization done -- the culprit is almost always 
          // a delay in the stylesheet node becoming available.
          assert(initialized < 3); 
          assert(!stylesheet);
          h_retry_init = setTimeout(finishInitializationUntilDone, 100);
          return false;
        }
      }
      return true;
    }

    function finishInitialization() {
      if (initialized < 2) {
        initialized = 1;

        setViewportWidth();

        // header columns and cells may have different padding/border skewing width calculations (box-sizing, hello?)
        // calculate the diff so we can set consistent sizes
        measureCellPaddingAndBorder();

        // for usability reasons, all text selection in SlickGrid is disabled
        // with the exception of input and textarea elements (selection must
        // be enabled there so that editors work as expected); note that
        // selection in grid cells (grid body) is already unavailable in
        // all browsers except IE
        disableSelection($headers); // disable all text selection in header (including input and textarea)

        if (!options.enableTextSelectionOnCells) {
          // disable text selection in grid cells except in input and textarea elements
          // (this is IE-specific, because selectstart event will only fire in IE)
          $viewport.bind("selectstart.ui", function (event) {
            return $(event.target).is("input,textarea");
          });
        }

        calcCanvasWidth();
        updateColumnCaches();
        createColumnHeaders();
        setupColumnSort();
        createCssRules();
        cacheRowPositions();
        resizeCanvas();
        bindAncestorScrollEvents();

        $container
            .bind("resize.slickgrid", function (e) {
              resizeCanvas();
            })
            .bind("focus.slickgrid", function (e) {
              var $target = $(e.target);
              var newFocusNode = document.activeElement;
              var focusMovingFrom = $.contains($container[0], e.target);
              var focusMovingInto = $.contains($container[0], newFocusNode);
              var focusMovingInside = focusMovingFrom && focusMovingInto;
              // console.log("container EVT FOCUS: ", [this, arguments, $target, newFocusNode], 
              //             focusMovingFrom ? "FROM" : "-", focusMovingInto ? "INTO" : "-", focusMovingInside ? "INSIDE" : "-", movingFocusLock ? "@FOCUS" : "-real-");
            })
            .bind("blur.slickgrid", function (e) {
              var $target = $(e.target);
              var newFocusNode = document.activeElement;
              var focusMovingFrom = $.contains($container[0], e.target);
              var focusMovingInto = $.contains($container[0], newFocusNode);
              var focusMovingInside = focusMovingFrom && focusMovingInto;
              // console.log("container EVT BLUR: ", [this, arguments, $target, newFocusNode], 
              //             focusMovingFrom ? "FROM" : "-", focusMovingInto ? "INTO" : "-", focusMovingInside ? "INSIDE" : "-", movingFocusLock ? "@FOCUS" : "-real-");
            })
            .bind("focusin.slickgrid", function (e) {
              var fromNode = e.target;
              if (movingFocusLock) {
                // we MAY see a sequence of focusout+focusin, where in the latter we want to know who really was the previous focus
                fromNode = movingFocusLockData[movingFocusLock - 1].oldNode;
              }
              var $target = $(fromNode);
              var newFocusNode = document.activeElement;
              var focusMovingFrom = $.contains($container[0], fromNode);
              var focusMovingInto = $.contains($container[0], newFocusNode);
              var focusMovingInside = focusMovingFrom && focusMovingInto;
              // console.log("container GOT FOCUS: ", [this, arguments, e.target, fromNode, newFocusNode], 
              //             focusMovingFrom ? "FROM" : "-", focusMovingInto ? "INTO" : "-", focusMovingInside ? "INSIDE" : "-", movingFocusLock ? "@FOCUS" : "-real-", movingFocusLockData);

              var handled;
              var evt = new Slick.EventData(e);
              if (movingFocusLock) {
                trigger(self.onFocusMoved, {
                  from:     movingFocusLockData[movingFocusLock - 1].oldNodeInfo,
                  to:       getCellFromElement(newFocusNode),
                  fromNode: movingFocusLockData[movingFocusLock - 1].oldNode,
                  toNode:   newFocusNode  
                }, evt);
                handled = evt.isHandled();
                if (handled) {
                  return;
                }
              } else {
                trigger(self.onFocusIn, {}, evt);
                handled = evt.isHandled();
                if (handled) {
                  return;
                }

                // var lock = getEditorLock();
                // if (!lock.isActive(editController) && lock.commitCurrentEdit()) {
                //   lock.activate(editController);
                // }
                // // else: jump back to previously focused element... but we don't know what it is so this is all we can do now...
              }
            })
            .bind("focusout.slickgrid", function (e) {
              var $target = $(e.target);
              var newFocusNode = document.activeElement;
              var focusMovingFrom = $.contains($container[0], e.target);
              var focusMovingInto = $.contains($container[0], newFocusNode);
              var focusMovingInside = focusMovingFrom && focusMovingInto;
              // console.log("container LOST FOCUS = autoCOMMIT: ", [this, arguments, e.target, newFocusNode], 
              //             focusMovingFrom ? "FROM" : "-", focusMovingInto ? "INTO" : "-", focusMovingInside ? "INSIDE" : "-", movingFocusLock ? "@FOCUS" : "-real-", {
              //               event: e,
              //               newNode: newFocusNode,
              //               oldNode: e.target,
              //               oldNodeInfo: getCellFromElement(e.target)
              //             });

              if (movingFocusLock) {
                // we MAY see a sequence of focusout+focusin, where by the time focusin fires, document.activeElement is BODY.
                // movingFocusLockData[movingFocusLock - 1] = {
                //   event: e,
                //   newNode: newFocusNode,
                //   oldNode: e.target,
                //   oldNodeInfo: getCellFromElement(e.target)
                // };
                return;
              }
              var evt = new Slick.EventData(e);
              trigger(self.onFocusOut, {}, evt);
              var handled = evt.isHandled();
              if (handled) {
                return;
              }

              // var lock = getEditorLock();
              // if (lock.isActive(editController) && !lock.commitCurrentEdit()) {
              //   // commit failed, jump back to edited field so user can edit it and make sure it passes the next time through
              //   assert(currentEditor);
              //   currentEditor.focus();
              //   assert(document.activeElement !== document.body);
              // }
            })
            .fixClick(handleContainerClickEvent, handleContainerDblClickEvent)
            .bind("contextmenu.slickgrid", handleContainerContextMenu)
            .bind("keydown.slickgrid", handleContainerKeyDown);
        $viewport
            .bind("scroll", handleScrollEvent);
        $headerScroller
            .bind("contextmenu", handleHeaderContextMenu)
            .fixClick(handleHeaderClick, handleHeaderDblClick)
            .delegate(".slick-header-column", "mouseenter", handleHeaderMouseEnter)
            .delegate(".slick-header-column", "mouseleave", handleHeaderMouseLeave)
            .bind("draginit", handleHeaderDragInit)
            .bind("dragstart", {distance: 3}, handleHeaderDragStart)
            .bind("drag", handleHeaderDrag)
            .bind("dragend", handleHeaderDragEnd);
        $headerRowScroller
            .bind("scroll", handleHeaderRowScroll);
        $footerRowScroller
            .bind("scroll", handleFooterRowScroll);
        $focusSink.add($focusSink2)
            .bind("keydown", handleKeyDown);
        $canvas
            .bind("keydown", handleKeyDown)
            .fixClick(handleClick, handleDblClick)
            .bind("contextmenu", handleContextMenu)
            .bind("draginit", handleDragInit)
            .bind("dragstart", {distance: 3}, handleDragStart)
            .bind("drag", handleDrag)
            .bind("dragend", handleDragEnd)
            .delegate(".slick-cell", "mouseenter", handleMouseEnter)
            .delegate(".slick-cell", "mouseleave", handleMouseLeave);

        // Work around http://crbug.com/312427.
        if (navigator.userAgent.toLowerCase().match(/webkit/) &&
            navigator.userAgent.toLowerCase().match(/macintosh/)) {
          $canvas.bind("mousewheel", handleMouseWheel);
        }

        initialized = 2;
      } else if (!stylesheet && initialized > 1) {
        // when a previous `init` run did not yet use the run-time stylesheet data, 
        // we have to adjust the canvas while waiting for the browser to actually 
        // parse that style.
        resizeCanvas();
      }

      // Only fire the onAfterInit event when we really have done it all:
      if (stylesheet && initialized === 2) {
        initialized = 3;
        trigger(self.onAfterInit, {});
      }

      // report the user whether we are a complete success (truthy) or not (falsey):
      return !!stylesheet;
    }

    function isInitialized() {
      return initialized;
    }

    function registerPlugin(plugin) {
      plugins.unshift(plugin);
      plugin.init(self);
    }

    function unregisterPlugin(plugin) {
      for (var i = plugins.length; i >= 0; i--) {
        if (plugins[i] === plugin) {
          if (plugins[i].destroy) {
            plugins[i].destroy();
          }
          plugins.splice(i, 1);
          break;
        }
      }
    }

    function setSelectionModel(model) {
      if (selectionModel) {
        selectionModel.onSelectedRangesChanged.unsubscribe(handleSelectedRangesChanged);
        if (selectionModel.destroy) {
          selectionModel.destroy();
        }
      }

      selectionModel = model;
      if (selectionModel) {
        selectionModel.init(self);
        selectionModel.onSelectedRangesChanged.subscribe(handleSelectedRangesChanged);
      }
    }

    function getSelectionModel() {
      return selectionModel;
    }

    function getCanvasNode() {
      return $canvas[0];
    }

    function measureScrollbar() {
      var $c = $("<div style='position:absolute; top:-10000px; left:-10000px; width:100px; height:100px; overflow:scroll;'></div>").appendTo("body");
      var dim = {
        width: $c.outerWidth() - $c[0].clientWidth,
        height: $c.outerHeight() - $c[0].clientHeight
      };
      $c.remove();
      return dim;
    }

    // Return the pixel positions of the left and right edge of the column, relative to the left edge of the entire grid.
    function getColumnOffset(cell) {
      var l = columns.length;
      // Is the cache ready? If not, update it.
      if (columnPosLeft.length <= l) {
        updateColumnCaches();
        assert(columnPosLeft.length === l + 1);
      }
      assert(cell >= 0);
      assert(cell < columnPosLeft.length);
      return columnPosLeft[cell];
    }

    function calcCanvasWidth() {
      var availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;

      totalColumnsWidth = getColumnOffset(columns.length);
      canvasWidth = (options.fullWidthRows ? Math.max(totalColumnsWidth, availableWidth) : totalColumnsWidth);

      // see https://github.com/mleibman/SlickGrid/issues/477
      viewportHasHScroll = (canvasWidth >= viewportW - scrollbarDimensions.width);
    }

    var oldViewportW, oldCanvasWidth, oldTotalColumnsWidth;

    function updateCanvasWidth() {
      calcCanvasWidth();

      var cached = false;
      if (canvasWidth !== oldCanvasWidth) {
        $canvas.outerWidth(canvasWidth);
        cached = true;
      }
      if (oldTotalColumnsWidth !== totalColumnsWidth) {
        $topPanel.outerWidth(totalColumnsWidth + HEADER_ROW_WIDTH_CORRECTION);
        $headerRow.outerWidth(totalColumnsWidth + HEADER_ROW_WIDTH_CORRECTION);
        $footerRow.outerWidth(totalColumnsWidth + HEADER_ROW_WIDTH_CORRECTION);
        $headers.outerWidth(totalColumnsWidth + HEADER_ROW_WIDTH_CORRECTION);
        cached = true;
      }
      if (oldViewportW !== viewportW) {
        $topPanelScroller.outerWidth(viewportW);
        $headerRowScroller.outerWidth(viewportW);
        $footerRowScroller.outerWidth(viewportW);
        $headerScroller.outerWidth(viewportW);
        cached = true;
      }

      // When `stylesheet` has not been set yet, it means that any previous call to 
      // applyColumnWidths() did not use up to date values yet as the run-time generated 
      // stylesheet wasn't parsed in time.
      if (canvasWidth !== oldCanvasWidth || !stylesheet || !initialized) {
        if (!applyColumnWidths()) {
          return false;
        }
      }

      // Only fire the event when there's actual change *and* we're past the initialization phase.
      if (cached && initialized) {
        trigger(self.onCanvasWidthChanged, { 
          width: canvasWidth,
          oldWidth: oldCanvasWidth || 0,

          oldTotalColumnsWidth: oldTotalColumnsWidth || 0,
          totalColumnsWidth: totalColumnsWidth,

          oldViewportW: oldViewportW || 0,
          viewportW: viewportW
        });
      }

      // only update the 'previous/old' markers when we can be sure that the new values are actually sound:
      if (stylesheet && initialized) {
        oldViewportW = viewportW;
        oldCanvasWidth = canvasWidth;
        oldTotalColumnsWidth = totalColumnsWidth;

        // and (re)render the affected columns
        render();

        return true;
      }
      return false;
    }

    function disableSelection($target) {
      if ($target && $target.jquery) {
        $target
            .attr("unselectable", "on")
            .css("MozUserSelect", "none")
            .bind("selectstart.ui", function () {
              return false;
            }); // from jquery:ui.core.js 1.7.2
      }
    }

    function getMaxSupportedCssHeight() {
      var supportedHeight = 1000000;
      // FF reports the height back but still renders blank after ~6M px
      var testUpTo = navigator.userAgent.toLowerCase().match(/firefox/) ? 6000000 : 1000000000;
      var div = $("<div style='display:none' />").appendTo(document.body);

      while (true) {
        var test = supportedHeight * 2;
        div.css("height", test);
        if (test > testUpTo || div.outerHeight() !== test) {
          break;
        } else {
          supportedHeight = test;
        }
      }

      div.remove();
      return supportedHeight;
    }

    // TODO:  this is static.  need to handle page mutation.
    function bindAncestorScrollEvents() {
      var elem = $canvas[0];
      while ((elem = elem.parentNode) !== document.body && elem != null) {
        // bind to scroll containers only
        if (elem == $viewport[0] || elem.scrollWidth !== elem.clientWidth || elem.scrollHeight !== elem.clientHeight) {
          var $elem = $(elem);
          if (!$boundAncestors) {
            $boundAncestors = $elem;
          } else {
            $boundAncestors = $boundAncestors.add($elem);
          }
          $elem.bind("scroll." + uid, handleActiveCellPositionChange);
        }
      }
    }

    function unbindAncestorScrollEvents() {
      if (!$boundAncestors) {
        return;
      }
      $boundAncestors.unbind("scroll." + uid);
      $boundAncestors = null;
    }

    // tile may be NULL: this is similar to specifying an empty title.
    // ditto for toolTip.
    function updateColumnHeader(columnId, title, toolTip) {
      if (!initialized) { return false; }
      var idx = getColumnIndex(columnId);
      if (idx == null) {
        return false;
      }

      var columnDef = columns[idx];
      var headerNode = getHeadersColumn(columnDef.id);
      if (headerNode) {
        if (title !== undefined) {
          columnDef.name = title;
        }
        if (toolTip !== undefined) {
          columnDef.toolTip = toolTip;
        }

        var e = new Slick.EventData();
        trigger(self.onBeforeHeaderCellDestroy, {
          node: headerNode,
          column: columnDef,
          cell: idx
        }, e);
        if (e.isHandled()) {
          return false;
        }

        // The userland event handler(s) may have patched this column's name and/or tooltip, so
        // fetch it now instead of before.
        title = columnDef.name;
        toolTip = columnDef.toolTip || null;

        var $header = $(headerNode);

        // TODO: RISK: when formatter produces more than *ONE* HTML element, we're toast with nuking the .eq(0) element down here:
        $header
            .attr("title", toolTip)
            .attr("data-title", toolTip)
            .children().eq(0).html(title || "");

        trigger(self.onHeaderCellRendered, {
          node: headerNode,
          column: columnDef,
          cell: idx
        });
        return true;
      }
      return false;
    }

    function getHeaderRow() {
      return $headerRow[0];
    }

    function getFooterRow() {
      return $footerRow[0];
    }

    function getHeaderRowColumn(columnId) {
      var idx = getColumnIndex(columnId);
      var columnDef = columns[idx];
      assert(columnDef);
      assert(columnDef.headerRow === (hasNestedColumns ? nestedColumns.length - columnDef.headerRowSpan : 0));
      var elId = mkSaneId(columnDef, idx, "headerrow" + columnDef.headerRow);
      var $header = $headerRow.find("#" + elId); // Do not write this as `$("#" + elId)` because the headers may not yet be included in the page DOM! 
      assert(($headerRow.length && $header.length) ? $.contains($headerRow[0], $header[0]) : true);
      return $header && $header[0];
    }

    function getHeadersColumn(columnId) {
      var idx = getColumnIndex(columnId);
      var columnDef = columns[idx];
      assert(columnDef);
      assert(columnDef.headerRow === (hasNestedColumns ? nestedColumns.length - columnDef.headerRowSpan : 0));
      var elId = mkSaneId(columnDef, idx, "header" + columnDef.headerRow);
      var $header = $headers.find("#" + elId); // Do not write this as `$("#" + elId)` because the headers may not yet be included in the page DOM! 
      assert($header.length ? $.contains($headers[0], $header[0]) : true);
      return $header && $header[0];
    }

    function getFooterRowColumn(columnId) {
      var idx = getColumnIndex(columnId);
      var columnDef = columns[idx];
      assert(columnDef);
      assert(columnDef.headerRow === (hasNestedColumns ? nestedColumns.length - columnDef.headerRowSpan : 0));
      var elId = mkSaneId(columnDef, idx, "footer" + columnDef.headerRow);
      var $footer = $footerRow.find("#" + elId); // Do not write this as `$("#" + elId)` because the headers may not yet be included in the page DOM! 
      assert($footer.length ? $.contains($footerRow[0], $footer[0]) : true);
      return $footer && $footer[0];
    }

    function getHeaderColumnFromElement(el) {
      var $header = $(el).closest(".slick-header-column", ".slick-header-columns");
      if ($header.length) {
        assert($header.length === 1);
        var column = $header.data("column");
        if (column) {
          return {
            columnDef: column,
            $header: $header
          };
        }
      }
      return null;
    }

    function mkSaneId(columnDef, cell, row) {
      s = "" + uid + "_c" + cell + "_r" + row + "_" + columnDef.id;
      s = s.replace(/[^a-zA-Z0-9]+/g, "_");
      //assert($("[aria-describedby=" + s + "]").length === 0);
      return s;
    }

    function extractCellFromDOMid(id) {
      // format of ID is: uid_c<cell>_<blah>
      var m = /_c(\d+)_/.exec(id);
      if (!m) {
        return false;
      }
      return +m[1];
    }

    // This completely redraws the headers and re-binds events
    // 
    // TODO: Visyond uses virtual rendering for the grid itself, but is very slow in rendering (and updating) the headers
    //       as those are rendered in their entirety. We should apply the virtual rendering process to the slickgrid headers
    //       too (i.e. only render a visible+buffer portion of the headers) but this has a significant impact on the event
    //       handlers too: those would all then have to move to the headers container DIV!
    //       (Think about the impact on contentmenu and similar plugins which add event handlers to the headers' DOM!)
    function createColumnHeaders() {
      function onMouseEnter() {
        $(this).addClass("ui-state-hover");
      }

      function onMouseLeave() {
        $(this).removeClass("ui-state-hover");
      }

      $headers.find(".slick-header-column")
        .each(function h_before_headercell_destroy_f() {
          var columnDef = $(this).data("column");
          assert(columnDef);
          if (columnDef) {
            trigger(self.onBeforeHeaderCellDestroy, {
              node: this,
              column: columnDef
            });
          }
        });
      $headers.empty();

      // Get the data for each column in the DOM
      $headerRow.find(".slick-headerrow-column")
        .each(function h_before_headerrowcell_destroy_f() {
          var columnDef = $(this).data("column");
          if (columnDef) {
            trigger(self.onBeforeHeaderRowCellDestroy, {
              node: this,
              column: columnDef
            });
          }
        });
      $headerRow.empty();

      $footerRow.find(".slick-footerrow-column")
        .each(function h_before_footerrowcell_destroy_f() {
          var columnDef = $(this).data("column");
          if (columnDef) {
            trigger(self.onBeforeFooterRowCellDestroy, {
              node: this,
              column: columnDef
            });
          }
        });
      $footerRow.empty();

      // speed improvement? detach the $headers DOM element from the view while we work on it in here:
      $headers = $headers.detach();

      function createColumnHeader(columnDef, appendTo, cell) {
        var isLeaf = !columnDef.children;
        var cellCss = [
          "ui-state-default", 
          "slick-header-column", 
          (!isLeaf ? "slick-header-is-parent" : "slick-header-is-leaf"),
          "hl" + cell, 
          "hr" + (cell + columnDef.headerColSpan - 1), 
          "hrt" + columnDef.headerRow, 
          "hrb" + (columnDef.headerRow + columnDef.headerRowSpan - 1)
        ];
        if (columnDef.headerCssClass) {
          cellCss.push(columnDef.headerCssClass);
        }
        var info = {
          cellCss: cellCss,
          cellStyles: [],
          html: "",
          attributes: {},
          toolTip: columnDef.toolTip || null,
          colspan: columnDef.headerColSpan,
          rowspan: columnDef.headerRowSpan,
          //cellHeight: cellHeight,
          //rowMetadata: rowMetadata,
          //columnMetadata: columnMetadata,
          columnHeader: {
            columnDef: columnDef,
            cell: cell
          }
        };
        // I/F: function formatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo)
        info.html = getHeaderFormatter(-2000 + columnDef.headerRow, cell)(-2000 + columnDef.headerRow, cell, columnDef.name, columnDef, null /* rowDataItem */, info);
        var metaData = getAllCustomMetadata(null, null, info) || {};
        patchupCellAttributes(metaData, info, "columnheader");
        metaData.id = mkSaneId(columnDef, cell, "header" + columnDef.headerRow);
        var stringArray = [
          "<div"
        ];
        // I/F: function appendMetadataAttributes(stringArray, row, cell, data, columnDef, rowDataItem, cellMetaInfo)
        appendMetadataAttributes(stringArray, -2000 + columnDef.headerRow, cell, metaData, columnDef, null, info);
  
        stringArray.push(">");

        stringArray.push(info.html);

        stringArray.push("</div>");

        var header = $(stringArray.join(""))
            .data("column", columnDef)
            .appendTo(appendTo);
        return header;
      }

      function createBaseColumnHeader(columnDef, $appendTo, cell) {
        assert(columnDef.children == null);
        var $header = createColumnHeader(columnDef, $appendTo, cell);
        var i, j, len, llen, column;
        var cellCss, info;
        var headerRowCell;
        var footerRowCell;

        if (options.enableColumnReorder || columnDef.sortable) {
          $header
            .on("mouseenter", onMouseEnter)
            .on("mouseleave", onMouseLeave);
        }

        if (columnDef.sortable) {
          $header.addClass("slick-header-sortable");
          $header.append("<span class='slick-sort-indicator' />");
        }
        
        if (options.enableColumnReorder && columnDef.reorderable) {
          $header.addClass("slick-header-reorderable");
        }

        trigger(self.onHeaderCellRendered, {
          node: $header[0],
          column: columnDef,
          cell: cell
        });

        if (options.showHeaderRow) {
          cellCss = [
            "ui-state-default", 
            "slick-headerrow-column", 
            "hl" + cell, 
            "hr" + (cell + columnDef.headerColSpan - 1)
          ];
          if (columnDef.headerCssClass) cellCss.push(columnDef.headerCssClass);
          info = {
            cellCss: cellCss,
            cellStyles: [],
            html: "",
            attributes: {},
            toolTip: columnDef.headerRowToolTip || null,
            colspan: columnDef.headerColSpan,
            rowspan: 1,
            //cellHeight: cellHeight,
            //rowMetadata: rowMetadata,
            //columnMetadata: columnMetadata,
            columnHeader: {
              columnDef: columnDef,
              cell: cell
            }
          };
          info.html = getHeaderRowFormatter(-1000 + columnDef.headerRow, cell)(-1000 + columnDef.headerRow, cell, columnDef.initialHeaderRowValue, columnDef, null /* rowDataItem */, info);
          var stringArray = [];
          stringArray.push("<div");

          var metaData = getAllCustomMetadata(null, null, info) || {};
          patchupCellAttributes(metaData, info, "columnbaseheader");
          metaData.id = mkSaneId(columnDef, cell, "headerrow" + columnDef.headerRow);
          appendMetadataAttributes(stringArray, -1000 + columnDef.headerRow, cell, metaData, columnDef, null, info);

          stringArray.push(">");

          stringArray.push(info.html);

          stringArray.push("</div>");

          headerRowCell = $(stringArray.join(""))
            .data("column", columnDef)
            .appendTo($headerRow);

          trigger(self.onHeaderRowCellRendered, {
            node: headerRowCell[0],
            column: columnDef,
            cell: cell
          });
        }
        if (options.showFooterRow) {
          cellCss = [
            "ui-state-default", 
            "slick-footerrow-column", 
            "hl" + cell, 
            "hr" + (cell + columnDef.headerColSpan - 1)
          ];
          if (columnDef.footerCssClass) {
            cellCss.push(columnDef.footerCssClass);
          }
          info = {
            cellCss: cellCss,
            cellStyles: [],
            html: "",
            attributes: {},
            toolTip: columnDef.footerRowToolTip || null,
            colspan: columnDef.headerColSpan,
            rowspan: 1,
            //cellHeight: cellHeight,
            //rowMetadata: rowMetadata,
            //columnMetadata: columnMetadata,
            columnHeader: {
              column: columnDef,
              cell: cell
            }
          };
          info.html = getHeaderRowFormatter(-3000 + columnDef.headerRow, cell)(-3000 + columnDef.headerRow, cell, columnDef.initialFooterRowValue, columnDef, null /* rowDataItem */, info);
          var stringArray = [];
          stringArray.push("<div");

          var metaData = getAllCustomMetadata(null, null, info) || {};
          patchupCellAttributes(metaData, info, "columnfooter");
          metaData.id = mkSaneId(columnDef, cell, "footer" + columnDef.headerRow);
          appendMetadataAttributes(stringArray, -3000 + columnDef.headerRow, cell, metaData, columnDef, null, info);

          stringArray.push(">");

          stringArray.push(info.html);

          stringArray.push("</div>");

          footerRowCell = $(stringArray.join(""))
              .data("column", columnDef)
              .appendTo($footerRow);

          trigger(self.onFooterRowCellRendered, {
            node: footerRowCell[0],
            column: columnDef,
            cell: cell
          });
        }
      }

      if (hasNestedColumns) {
        for (i = 0, len = nestedColumns.length; i < len; i++) {
          var cell;
          var layer = nestedColumns[i];

          for (j = 0, llen = layer.length; j < llen; j++) {
            column = layer[j];
            if (column.children) {
              cell = column.childrenFirstIndex;
              assert(cell != null);
              assert(i === column.headerRow);
              createColumnHeader(column, $headers, cell);
            } else {
              cell = getColumnIndex(column.id);
              assert(cell != null);
              createBaseColumnHeader(column, $headers, cell);
            }
          }
        }

        $headers.addClass("slick-nested-headers");
      } else {
        for (i = 0, len = columns.length; i < len; i++) {
          column = columns[i];
          createBaseColumnHeader(column, $headers, i);
        }
      }

      // re-attach DOM node to viewport
      $headers = $headers.appendTo($headerScroller);

      setSortColumns(sortColumns);
      setupColumnResize();
      if (options.enableColumnReorder) {
        setupColumnReorder();
      }
    }

    function setupColumnSort() {
      $headerScroller.delegate(".slick-header-column", "click", function (e) {
        if ($(e.target).hasClass("slick-resizable-handle")) {
          return;
        }

        var headerInfo = getHeaderColumnFromElement(e.target);
        if (!headerInfo) {
          return;
        }
        var column = headerInfo.columnDef;
        assert(column);
        if (column.sortable) {
          if (!getEditorLock().commitCurrentEdit()) {
            return;
          }

          var sortOpts = null;
          var i, len;
          for (i = 0, len = sortColumns.length; i < len; i++) {
            if (sortColumns[i].columnId === column.id) {
              sortOpts = sortColumns[i];
              sortOpts.sortAsc = !sortOpts.sortAsc;
              break;
            }
          }

          if ((e.metaKey || e.ctrlKey) && options.multiColumnSort) {
            if (sortOpts) {
              sortColumns.splice(i, 1);
            }
          } else {
            if ((!e.shiftKey && !e.metaKey && !e.ctrlKey) || !options.multiColumnSort) {
              sortColumns = [];
            }

            if (!sortOpts) {
              sortOpts = { 
                columnId: column.id, 
                sortAsc: column.defaultSortAsc 
              };
              sortColumns.push(sortOpts);
            } else if (sortColumns.length === 0) {
              sortColumns.push(sortOpts);
            }
          }

          setSortColumns(sortColumns);

          if (!options.multiColumnSort) {
            trigger(self.onSort, {
              multiColumnSort: false,
              sortCol: column,
              columnId: column.id,
              sortAsc: sortOpts.sortAsc
            }, e);
          } else {
            trigger(self.onSort, {
              multiColumnSort: true,
              sortCols: $.map(sortColumns, function (col) {
                return {
                  sortCol: columns[getColumnIndex(col.columnId)],
                  columnId: col.columnId,
                  sortAsc: col.sortAsc
                };
              })
            }, e);
          }
        }
      });
    }

    function setupColumnReorder() {
      if (!jQuery.isEmptyObject($.data($headers, $headers.sortable.prototype.widgetFullName))) {
        $headers.filter(":ui-sortable").sortable("destroy");
      }

      var columnScrollTimer = null;
      var viewportLeft = $viewport.offset().left;

      function scrollColumnsRight() {
        $viewport[0].scrollLeft = $viewport[0].scrollLeft + 10;
      }

      function scrollColumnsLeft() {
        $viewport[0].scrollLeft = $viewport[0].scrollLeft - 10;
      }

      $headers.sortable({
        containment: "parent",
        distance: 3,
        axis: "x",
        cursor: "default",
        tolerance: "intersection",
        helper: "clone",
        delay: 300,
        placeholder: "slick-sortable-placeholder ui-state-default slick-header-column",
        items: ".slick-header-reorderable",
        start: function (e, ui) {
          ui.placeholder.outerWidth(ui.helper.outerWidth());
          trigger(self.onColumnsStartReorder, {
            ui: ui
          }, e);

          $(ui.helper).addClass("slick-header-column-active");
        },
        beforeStop: function (e, ui) {
          $(ui.helper).removeClass("slick-header-column-active");
        },
        sort: function (e, ui) {
          trigger(self.onColumnsReordering, {
            ui: ui
          }, e);

          if (e.originalEvent.pageX > $viewport[0].clientWidth) {
            if (!columnScrollTimer) {
              columnScrollTimer = setInterval(scrollColumnsRight, 100);
            }
          } else if (e.originalEvent.pageX < viewportLeft) {
            if (!columnScrollTimer) {
              columnScrollTimer = setInterval(scrollColumnsLeft, 100);
            }
          } else {
            clearInterval(columnScrollTimer);
            columnScrollTimer = null;
          }
        },
        stop: function (e, ui) {
          clearInterval(columnScrollTimer);
          columnScrollTimer = null;

          if (!getEditorLock().commitCurrentEdit()) {
            $(this).sortable("cancel");
            return;
          }
          $headers.sortable("option", "items", ".slick-header-is-leaf");      // Reset items to grab all columns
          var reorderedIds = $headers.sortable("toArray");                    // Get sorted order
          $headers.sortable("option", "items", ".slick-header-reorderable");  // Revert items
          var reorderedColumns = [];
          assert(reorderedIds.length === columns.length);   // assert we don't loose or grow our columns set
          for (var i = 0, len = reorderedIds.length; i < len; i++) {
            var cell = extractCellFromDOMid(reorderedIds[i]);
            assert(columns[cell]);
            reorderedColumns.push(columns[cell]);
          }
          var rv = setColumns(reorderedColumns);
          assert(rv === true);

          trigger(self.onColumnsReordered, {
            ui: ui
          }, e);
          e.stopPropagation();
          setupColumnResize();
        }
      });
    }

    function setupColumnResize() {
      var i, columnDef, j, c, pageX, minPageX, maxPageX, firstResizable, lastResizable;
      var columnCount = columns.length;

      for (i = 0; i < columnCount; i++) {
        columnDef = columns[i];
        if (columnDef.resizable) {
          if (firstResizable === undefined) {
            firstResizable = i;
          }
          lastResizable = i;
        }
      }
      if (firstResizable === undefined) {
        return;
      }

      function onColumnResizeDragInit(e, dd, activeColumnIndex) {
        var j, c;
        if (!getEditorLock().commitCurrentEdit()) {
          return false;
        }
        //e.preventDefault();
        //e.stopPropagation();
      }

      function onColumnResizeDragStart(e, dd, activeColumnIndex) {
        var j, c;
        if (!getEditorLock().commitCurrentEdit()) {
          return false;
        }
        var columnCount = columns.length;
        pageX = e.pageX;
        $(this).parent().addClass("slick-header-column-active");

        // Get the dragged column object and set a flag on it
        assert(activeColumnIndex >= 0);
        columns[activeColumnIndex].manuallySized = true;
        
        var shrinkLeewayOnRight = null, stretchLeewayOnRight = null;
        // calculate & cache all invariants to speed up the process:
        for (var i = 0, len = columnCount; i < len; i++) {
          c = columns[i];
          c.__columnResizeInfo = {
            // lock each column's width option to current width
            previousWidth: c.width, // previousWidth should NOT be measured from the UI as this will b0rk the system depending on boxmodel. // $(e).outerWidth();
            absMinWidth: Math.max(c.minWidth || 0, absoluteColumnMinWidth),
          };
        }

        if (options.forceFitColumns) {
          shrinkLeewayOnRight = 0;
          stretchLeewayOnRight = 0;
          // columns on right affect maxPageX/minPageX
          for (j = activeColumnIndex + 1; j < columnCount; j++) {
            c = columns[j];
            assert(c);
            if (c.resizable) {
              if (stretchLeewayOnRight !== null) {
                if (c.maxWidth) {
                  stretchLeewayOnRight += c.maxWidth - c.__columnResizeInfo.previousWidth;
                } else {
                  stretchLeewayOnRight = null;
                }
              }
              shrinkLeewayOnRight += c.__columnResizeInfo.previousWidth - c.__columnResizeInfo.absMinWidth;
            }
          }
        }
        var shrinkLeewayOnLeft = 0, stretchLeewayOnLeft = 0;
        for (j = 0; j <= activeColumnIndex; j++) {
          // columns on left only affect minPageX
          c = columns[j];
          assert(c);
          if (c.resizable) {
            if (stretchLeewayOnLeft !== null) {
              if (c.maxWidth) {
                stretchLeewayOnLeft += c.maxWidth - c.__columnResizeInfo.previousWidth;
              } else {
                stretchLeewayOnLeft = null;
              }
            }
            shrinkLeewayOnLeft += c.__columnResizeInfo.previousWidth - c.__columnResizeInfo.absMinWidth;
          }
        }
        if (shrinkLeewayOnRight === null) {
          shrinkLeewayOnRight = 100000;
        }
        if (shrinkLeewayOnLeft === null) {
          shrinkLeewayOnLeft = 100000;
        }
        if (stretchLeewayOnRight === null) {
          stretchLeewayOnRight = 100000;
        }
        if (stretchLeewayOnLeft === null) {
          stretchLeewayOnLeft = 100000;
        }
        maxPageX = pageX + Math.min(shrinkLeewayOnRight, stretchLeewayOnLeft);
        minPageX = pageX - Math.min(shrinkLeewayOnLeft, stretchLeewayOnRight);
        trigger(self.onColumnsStartResize, {}, e); // onColumnsResizeStart
        updateColumnCaches();
        //applyColumnWidths(); -- happens already inside the next statement: updateCanvasWidth(true)
        var rv = updateCanvasWidth();
        assert(rv === true);
        //e.preventDefault();
        //e.stopPropagation();
      }

      function onColumnResizeDrag(e, dd, activeColumnIndex) {
        var actualMinWidth, 
            d = Math.min(maxPageX, Math.max(minPageX, e.pageX)) - pageX, 
            x;
        var j, c;
        var columnCount = columns.length;
        if (d < 0) { // shrink column
          x = d;
          if (options.resizeOnlyDraggedColumn) {
            c = columns[activeColumnIndex];
            c.width = Math.max(c.previousWidth + x, c.__columnResizeInfo.absMinWidth); // apply shrinkage to this column only.
          } else {
            for (j = activeColumnIndex; j >= 0; j--) {
              c = columns[j];
              assert(c);
              if (c.resizable) {
                actualMinWidth = c.__columnResizeInfo.absMinWidth;
                if (x && c.__columnResizeInfo.previousWidth + x < actualMinWidth) {
                  x += c.__columnResizeInfo.previousWidth - actualMinWidth;
                  c.width = actualMinWidth;
                } else {
                  c.width = c.__columnResizeInfo.previousWidth + x;
                  x = 0;
                }
              }
            }
          }

          if (options.forceFitColumns) {
            x = -d;
            for (j = activeColumnIndex + 1; j < columnCount; j++) {
              c = columns[j];
              assert(c);
              if (c.resizable) {
                if (x && c.maxWidth && (c.maxWidth - c.__columnResizeInfo.previousWidth < x)) {
                  x -= c.maxWidth - c.__columnResizeInfo.previousWidth;
                  c.width = c.maxWidth;
                } else {
                  c.width = c.__columnResizeInfo.previousWidth + x;
                  x = 0;
                }
              }
            }
          }
        } else { // stretch column
          x = d;
          if (options.resizeOnlyDraggedColumn) {
            c = columns[activeColumnIndex];
            c.width = c.previousWidth + x;
            if (x && c.maxWidth && c.maxWidth < c.width) {
              c.width = c.maxWidth;
            }
          } else {
            for (j = activeColumnIndex; j >= 0; j--) {
              c = columns[j];
              assert(c);
              if (c.resizable) {
                if (x && c.maxWidth && (c.maxWidth - c.__columnResizeInfo.previousWidth < x)) {
                  x -= c.maxWidth - c.__columnResizeInfo.previousWidth;
                  c.width = c.maxWidth;
                } else {
                  c.width = c.__columnResizeInfo.previousWidth + x;
                  x = 0;
                }
              }
            }
          }

          if (options.forceFitColumns) {
            x = -d;
            for (j = activeColumnIndex + 1; j < columnCount; j++) {
              c = columns[j];
              assert(c);
              if (c.resizable) {
                actualMinWidth = c.__columnResizeInfo.absMinWidth;
                if (x && c.__columnResizeInfo.previousWidth + x < actualMinWidth) {
                  x += c.__columnResizeInfo.previousWidth - actualMinWidth;
                  c.width = actualMinWidth;
                } else {
                  c.width = c.__columnResizeInfo.previousWidth + x;
                  x = 0;
                }
              }
            }
          }
        }

        var selectionModel = getSelectionModel();

        // If selection model is defined and column 
        // which user is resizing currently, is part of his selection area
        // then let's resize other columns which are part of selection area
        if(selectionModel) {
          var currentSelectedRanges = getSelectionModel().getSelectedRanges(), fromCell, toCell;
          for (j=0; j<currentSelectedRanges.length; j++) {
            if(activeColumnIndex >= currentSelectedRanges[j].fromCell 
              && activeColumnIndex <= currentSelectedRanges[j].toCell) {
              fromCell = currentSelectedRanges[j].fromCell;
              toCell = currentSelectedRanges[j].toCell;
              for(k=fromCell; k<=toCell; k++) {
                columns[k].width = columns[activeColumnIndex].width;
              }
            }
          }
        }

        updateColumnCaches();
        //applyColumnWidths(); -- happens already inside the next statement: updateCanvasWidth(true)
        var rv = updateCanvasWidth();
        assert(rv === true);
        trigger(self.onColumnsResizing, {}, e);
        // On column resizing we should redecoarte selection model
        // as older selection area could cover more or less columns in
        // ui depending on whether user has shrink or strech the column
        if(selectionModel) {
          var currentSelectedRanges = getSelectionModel().getSelectedRanges();
          for (j=0; j<currentSelectedRanges.length; j++) {
            selectionModel.getPostSelectionDecorator().show(currentSelectedRanges[i]);
          }
        }
        //e.preventDefault();
        //e.stopPropagation();
      }
      
      function onColumnResizeDragEnd(e, dd, activeColumnIndex) {
        var newWidth, j, k, c;

        var columnCount = columns.length;
        var adjustedColumns = [];
        $(this).parent().removeClass("slick-header-column-active");
        assert(columns.length === columnCount);
        for (j = 0; j < columnCount; j++) {
          c = columns[j];
          assert(c);
          newWidth = c.width; // again, we should NEVER get the cell width from the UI as that will screw us seven ways to Hell thanks to the CSS boxmodels // $(columnElements[j]).outerWidth();

          if (c.__columnResizeInfo.previousWidth !== newWidth) {
            adjustedColumns.push(c);
            if (c.rerenderOnResize) {
              invalidateColumn(j);
            }
          }
        }

        var selectionModel = getSelectionModel();

        // If selection model is defined and column 
        // which user is resizing currently, is part of his selection area
        // then let's resize other columns which are part of selection area
        if(selectionModel) {
          var currentSelectedRanges = getSelectionModel().getSelectedRanges(), fromCell, toCell;
          for (j=0; j<currentSelectedRanges.length; j++) {
            if(activeColumnIndex >= currentSelectedRanges[j].fromCell 
              && activeColumnIndex <= currentSelectedRanges[j].toCell) {
              fromCell = currentSelectedRanges[j].fromCell;
              toCell = currentSelectedRanges[j].toCell;
              for(k=fromCell; k<=toCell; k++) {
                columns[k].width = columns[activeColumnIndex].width;
              }
            }
          }
        }

        // Reminder: Always call updateColumnCaches() *before* calling updateCanvasWidth() iff you need to call updateColumnCaches() at all
        updateColumnCaches();

        var rv = updateCanvasWidth();
        assert(rv === true);
        handleScroll();
        //render();
        
        trigger(self.onColumnsResized, { 
          adjustedColumns: adjustedColumns, 
          dd: dd,
          success: rv 
        }, e);
        // On column resizing we should redecoarte selection model
        // as older selection area could cover more or less columns in
        // ui depending on whether user has shrink or strech the column
        if(selectionModel) {
          var currentSelectedRanges = getSelectionModel().getSelectedRanges();
          for (j=0; j<currentSelectedRanges.length; j++) {
            selectionModel.getPostSelectionDecorator().show(currentSelectedRanges[i]);
          }
        }
        e.preventDefault();
        e.stopPropagation();
      }
      
      function onColumnResizeDblClick(e) {
        if (signalEventObserved(e)) {
          return;
        }

        var headerInfo = getHeaderColumnFromElement(e.target);
        if (!headerInfo) {
          return;
        }

        var column = headerInfo.columnDef;
        assert(column);
        assert(column.id || column.id === 0);
        var cell = getColumnIndex(column.id);
        assert(cell != null);
        assert(cell >= 0);
        assert(+cell === cell);
        var columnDef = columns[cell];
        assert(columnDef === column);
        var columnElement = getHeadersColumn(columnDef.id);
        assert(columnElement === headerInfo.$header[0]);
        
        var sizeEvt = new Slick.EventData(e);
        trigger(self.onColumnCalcWidth, {
          cell: cell, 
          column: columnDef
        }, sizeEvt);
        var handled = sizeEvt.isHandled();
        if (!handled) {
          var aux_width = calculateWordDimensions(columnElement.innerText).width;
          assert(columnDef.values === undefined);
          for (var row = 0, len = getDataLength(); row < len; row++) {
            var rowDataItem = getDataItem(row);
            var value = getDataItemValueForColumn(rowDataItem, columnDef);
            aux_width = Math.max(aux_width, calculateWordDimensions("" + value).width);
          }
          columnDef.width = aux_width;

          // TODO: make autosize faster by introducing a bit of heuristic: longer raw string implies wider cell
          // TODO: apply the proper formatter so that we actually get what we will see when the cell is rendered for real
        }

        updateColumnCaches();
        var rv = updateCanvasWidth();
        assert(rv === true);
        //render();
        trigger(self.onColumnsResized, {
          adjustedColumns: [columnDef],
          cell: cell, 
          column: columnDef,
          success: rv 
        }, e);
        e.preventDefault();
        e.stopPropagation();
      }

      for (i = 0; i < columnCount; i++) {
        columnDef = columns[i];
        if (columnDef.resizable) {
          var el = getHeadersColumn(columnDef.id);
          assert(el);
          $("<div class='slick-resizable-handle' data-column-index='" + i + "' />")
            .appendTo(el)
            // all touch support here added by KCPT.
            // increase touchable area on touch devices
            // see http://modernizr.github.com/Modernizr/touch.html for discussion of
            // this test as a means to determine that we're running on a touch platform.
            // We also increase the width of the resize area for the last column so that
            // it isn't entirely overlapped/hidden by the divider view.
            .css({ 
              width: "ontouchstart" in window ? 16 : (i === lastResizable ? 8 : 4) 
            });
        }
      }

      $headerScroller.find(".slick-resizable-handle")
          // .bind("contextmenu", handleHeaderContextMenu)
          // .fixClick(handleHeaderClick, handleHeaderDblClick)
          // .delegate(".slick-header-column", "mouseenter", handleHeaderMouseEnter)
          // .delegate(".slick-header-column", "mouseleave", handleHeaderMouseLeave)
          // .bind("draginit", handleHeaderDragInit)
          // .bind("dragstart", {distance: 3}, handleHeaderDragStart)
          // .bind("drag", handleHeaderDrag)
          // .bind("dragend", handleHeaderDragEnd)
          .bind("draginit", function (e, dd) {
            var columnIdx = $(this).attr("data-column-index");
            columnIdx = parseInt(columnIdx);
            onColumnResizeDragInit(e, dd, columnIdx);
          })
          .bind("dragstart touchstart", {distance: 3}, function (e, dd) {
            var columnIdx = $(this).attr("data-column-index");
            columnIdx = parseInt(columnIdx);
            onColumnResizeDragStart(e, dd, columnIdx);
          })
          .bind("drag touchmove", function (e, dd) {
            var columnIdx = $(this).attr("data-column-index");
            columnIdx = parseInt(columnIdx);
            onColumnResizeDrag(e, dd, columnIdx);
          })
          .bind("dragend touchend", function (e, dd) {
            var columnIdx = $(this).attr("data-column-index");
            columnIdx = parseInt(columnIdx);
            onColumnResizeDragEnd(e, dd, columnIdx);
          })
          .bind("dblclick", function (e, dd) {
            var columnIdx = $(this).attr("data-column-index");
            columnIdx = parseInt(columnIdx);
            onColumnResizeDblClick(e, dd, columnIdx);
          });
    }

    function calculateWordDimensions(text, escape) {
      if (escape === undefined) {
        escape = true;
      }

      var div = document.createElement("div");
      $(div).css({
          "position": "absolute",
          "visibility": "hidden",
          "height": "auto",
          "width": "auto",
          "white-space": "nowrap",
          "font-family": "Verdana, Arial, sans-serif",
          "font-size": "13px",
          "border": "1px solid transparent",
          "padding": "1px 4px 2px"
      });
      if (escape) {
        $(div).text(text);
      } else {
        div.innerHTML = text;
      }

      document.body.appendChild(div);

      var dimensions = {
        width: jQuery(div).outerWidth() + 30,
        height: jQuery(div).outerHeight()
      };

      div.parentNode.removeChild(div);

      return dimensions;
    }

    function getVBoxDelta($el) {
      var h = $el.height();         // jQuery: content only
      var oh = $el.outerHeight();   // jQuery: content + padding + border, excluding margin
      var delta = oh - h;
      assert(delta >= 0);
      return delta;
    }

    function getHBoxDelta($el, metricsRef) {
      var h = $el.width();         // jQuery: content only
      var oh = $el.outerWidth();   // jQuery: content + padding + border, excluding margin
      var delta = oh - h;
      assert(delta >= 0);
      return delta;
    }

    function measureCellPaddingAndBorder() {
      var el, i, len, val;

      el = $("<div class='ui-state-default slick-header-column slick-header-is-leaf hl0 hr0 hrt0 hrb0' style='visibility:hidden'>-</div>").appendTo($headers);
      headerColumnWidthDiff = headerColumnHeightDiff = 0;
      if (el.css("box-sizing") !== "border-box" && el.css("-moz-box-sizing") !== "border-box" && el.css("-webkit-box-sizing") !== "border-box") {
        headerColumnWidthDiff = getHBoxDelta(el);
        headerColumnHeightDiff = getVBoxDelta(el);
      }
      el.remove();

      var r = $("<div class='slick-row' />").appendTo($canvas);
      el = $("<div class='slick-cell' style='visibility:hidden'>-</div>").appendTo(r);
      cellWidthDiff = cellHeightDiff = 0;
      if (el.css("box-sizing") !== "border-box" && el.css("-moz-box-sizing") !== "border-box" && el.css("-webkit-box-sizing") !== "border-box") {
        cellWidthDiff = getHBoxDelta(el);
        cellHeightDiff = getVBoxDelta(el);
      }
      r.remove();

      absoluteColumnMinWidth = Math.max(headerColumnWidthDiff, cellWidthDiff);
    }

    // These rules are responsible for heights and cell widths, but not column header widths.
    //
    // See also github issue #223: stylesheet variable is undefined in Chrome
    //
    // This code is based on
    //     http://davidwalsh.name/add-rules-stylesheets
    function createCssRules() {
      var sheet;
      if (!stylesheet) {
        stylesheet = getStyleSheet();
      }
      if (!stylesheet) {
        $style = $("<style type='text/css' rel='stylesheet' id='slickgrid_stylesheet_" + uid + "' />").appendTo($("head"));
        if ($style[0].styleSheet) { // IE
          $style[0].styleSheet.cssText = "";
        } else {
          // WebKit hack
          $style[0].appendChild(document.createTextNode(""));
        }

        // Add a media (and/or media query) here if you'd like!
        // $style[0].setAttribute("media", "screen")
        // $style[0].setAttribute("media", "@media only screen and (max-width : 1024px)")

        sheet = $style[0].sheet;
      } else {
        sheet = stylesheet;
      }

      var rowHeight = options.rowHeight - cellHeightDiff;
      var headersCount = (hasNestedColumns ? nestedColumns.length : 1);
      var headerHeight = headersCount * options.headerHeight;
      var rules = [
        [".slick-top-panel", "height: " + options.topPanelHeight + "px"],
        [".slick-header-columns", "height: " + headerHeight + "px"],
        [".slick-headerrow-columns", "height: " + options.headerRowHeight + "px"],
        [".slick-footerrow-columns", "height: " + options.footerRowHeight + "px"],
        [".slick-cell", "height:" + rowHeight + "px"],
        [".slick-row", "height:" + options.rowHeight + "px"]
      ];

      for (var i = 0, len = columns.length; i < len; i++) {
        rules.push([".l" + i, ""]);
        rules.push([".r" + i, ""]);
        rules.push([".hl" + i, ""]);
        rules.push([".hr" + i, ""]);
      }

      for (i = 0, len = (hasNestedColumns ? nestedColumns.length : 1); i < len; i++) {
        rules.push([".hrt" + i, "top: " + (i * options.headerHeight) + "px"]);
        rules.push([".hrb" + i, "bottom: " + ((headersCount - i - 1) * options.headerHeight) + "px"]);
      }

      if (options.createCssRulesCallback) {
        options.createCssRulesCallback(uid, rules);
      }

      // see also
      //   http://davidwalsh.name/add-rules-stylesheets
      if (sheet) {
        rules.forEach(function (d, i) {
          addCSSRule(sheet, d[0], d[1], i); /* i could have been -1 here as each rule can be appended at the end */
        });
      } else {
        throw new Error("run-time generated slickgrid rules could not be set up");
      }
    }

    function addCSSRule(sheet, selector, rules, index) {
      var entry = {
        css: rules,
        index: index
      };
      cssRulesHashtable[selector] = entry;
      if (cssRulesCount <= index) {
        cssRulesCount = index + 1;
      }
      if (sheet.insertRule) {
        sheet.insertRule(".slickgrid-container." + uid + " " + selector + " {" + rules + "}", index);
      } else {
        sheet.addRule(".slickgrid-container." + uid + " " + selector, rules, index);
      }
      assert(sheet.ownerNode);
    }

    // Recalculate the maximum CSS rule index (PLUS ONE) currently in use.
    // This is used as part of a CSS rule DELETE action as a CSS rule DELETE may delete a custom
    // CSS rule at the end of the CSS stylesheet, which means the next CSS rule to INSERT ends
    // up at a lower index as the number of CSS rules has shrunk.
    function recalcCssRulesCount() {
      var count = 0;
      for (var idx in cssRulesHashtable) {
        var entry = cssRulesHashtable[idx];
        if (entry && count <= entry.index) {
          count = entry.index + 1;
        }
      }
    }

    // API: update or insert a slickgrid-instance specific CSS rule.
    // 
    // The `selector` is automatically prefixed by the appropriate slickgrid instance UID to make the
    // CSS rule specific to this SlickGrid instance.
    // 
    // When `rule` is FALSE or NULL, the rule will be DELETED.
    // 
    // When `rule` is UNDEFINED, this function will serve as a getter, i.e. it will not change
    // the CSS and only return the previously set rule value, if available.
    // 
    // Returns:
    // - FALSE when the SlickGrid instance stylesheet is not present (yet), i.e. when the
    //   CSS rule could not be applied to the DOM. 
    // - FALSE when the specified rule is *requested* (i.e. when `rule` is NULL or FALSE)
    //   but is not present yet: here FALSE signals the rule does not yet exist.
    // - Otherwise return the previously set CSS rule content and rule index as an object:
    //   `{ css:string, index:n }`.
    // 
    // Hence FALSE signals error/non-existence, any other value signals success.
    function setCssRule(selector, rule) {
      // Check if the stylesheet is instantiated & present yet:
      var sheet;
      if (!stylesheet) {
        stylesheet = getStyleSheet();
      }
      if (!stylesheet) {
        return false;
      } else {
        sheet = stylesheet;
      }
      assert(sheet.ownerNode);

      // check if this is a rule UPDATE or ADD/INSERT:
      var entry = cssRulesHashtable[selector];      
      if (entry) {
        // update. IFF `rule` is not UNDEFINED. (NULL rule will delete the rule!)
        if (rule !== undefined) {
          // The sequence now becomes: UPDATE = DELETE + INSERT (at the same index as before).
          sheet.deleteRule(entry.index);
          cssRulesHashtable[selector] = undefined;
          recalcCssRulesCount();
        }
      }
      // ADD/INSERT/UPDATE rule? yes, IFF rule !== NULL/UNDEFINED/FALSE:
      if (rule || rule === "") {
        var index = (entry ? entry.index : cssRulesCount);
        addCSSRule(sheet, selector, rule, index);
      }
      return cssRulesHashtable[selector] || false;
    }

    function getStyleSheetOwner(sheet) {
      return sheet && (sheet.ownerNode || sheet.owningElement);
    }

    // Fix for Google Chrome
    function getStyleSheet() {
      for (var i = 0, len = document.styleSheets.length; i < len; i++) {
        var sheet = document.styleSheets[i];
        var ownerNode = getStyleSheetOwner(sheet);
        if (ownerNode && ownerNode.id === "slickgrid_stylesheet_" + uid) {
          return sheet;
        }
      }
      var $sheet = $("style#slickgrid_stylesheet_" + uid);
      if ($sheet.length) {
        assert(0, "should never get here: it's pretty darn bad when jQuery finds what we ourselves cannot");
        return $sheet[0].sheet;
      }
      return null;
    }

    // Return FALSE when the relevant stylesheet has not been parsed yet
    // (previously slickgrid would throw an exception for this!)
    // otherwise return the style reference.
    function getColumnCssRules(idx) {
      var i, len;
      if (!stylesheet) {
        stylesheet = getStyleSheet();
        if (!stylesheet) {
          console.log("########### Cannot find stylesheet.");
          return false;
          //throw new Error("Cannot find stylesheet.");
        }

        // find and cache column CSS rules
        columnCssRulesL = [];
        columnCssRulesR = [];
        columnCssRulesHL = [];
        columnCssRulesHR = [];
        var cssRules = (stylesheet.cssRules || stylesheet.rules);
        var matches, columnIdx;
        for (i = 0, len = cssRules.length; i < len; i++) {
          var selector = cssRules[i].selectorText;
          if ((matches = /\.l\d+/.exec(selector))) {
            columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
            columnCssRulesL[columnIdx] = cssRules[i];
          } else if ((matches = /\.r\d+/.exec(selector))) {
            columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
            columnCssRulesR[columnIdx] = cssRules[i];
          } else if ((matches = /\.hl\d+/.exec(selector))) {
            columnIdx = parseInt(matches[0].substr(3, matches[0].length - 3), 10);
            columnCssRulesHL[columnIdx] = cssRules[i];
          } else if ((matches = /\.hr\d+/.exec(selector))) {
            columnIdx = parseInt(matches[0].substr(3, matches[0].length - 3), 10);
            columnCssRulesHR[columnIdx] = cssRules[i];
          }
        }
      }

      return {
        left: columnCssRulesL[idx],
        right: columnCssRulesR[idx],
        headerLeft: columnCssRulesHL[idx],
        headerRight: columnCssRulesHR[idx],
      };
    }

    function removeCssRules() {
      $style.remove();
      $style = null;
      stylesheet = null;
      assert($("style#slickgrid_stylesheet_" + uid).length === 0);
    }

    function destroy() {
      getEditorLock().cancelCurrentEdit();

      trigger(self.onBeforeDestroy, {});

      // abort any delayed actions in timers:
      if (h_postrender) {
        clearTimeout(h_postrender);
        h_postrender = null;
      }
      if (h_render) {
        clearTimeout(h_render);
        h_render = null;
      }
      if (h_editorLoader) {
        clearTimeout(h_editorLoader);
        h_editorLoader = null;
      }

      var i = plugins.length;
      while (i--) {
        unregisterPlugin(plugins[i]);
      }

      if (options.enableColumnReorder) {
        $headers.filter(":ui-sortable").sortable("destroy");
      }

      unbindAncestorScrollEvents();
      $container.unbind(".slickgrid");
      removeCssRules();

      $canvas.unbind();
      $container
          .empty()
          .removeClass("slickgrid-container ui-widget " + uid)
          .attr("role", null);

      $headerScroller.unbind();
      $headers.unbind();
      $viewport.unbind();
      $headerRowScroller.unbind();
      $footerRowScroller.unbind();
      $focusSink.unbind();
      $focusSink2.unbind();

      $headerScroller = undefined;
      $headers = undefined;
      $headerRowScroller = undefined;
      $headerRow = undefined;
      $headerRowSpacer = undefined;
      $footerRowScroller = undefined;
      $footerRow = undefined;
      $footerRowSpacer = undefined;
      $canvas = undefined;
      $viewport = undefined;
      $topPanel = undefined;
      $topPanelScroller = undefined;
      $boundAncestors = undefined;
      $focusSink = undefined;
      $focusSink2 = undefined;
      $container = undefined;
      $style = undefined;

      columnDefinitions = undefined;
      options = undefined;
      editController = undefined;
      postProcessedRows = undefined;
      cellCssClasses = undefined;
      rowsCache = undefined;
      // deletedRowsCache = undefined;
      rowPositionCache = undefined;
      cellSpans = undefined;
      selectedRows = undefined;
      plugins = undefined;
      columnsById = undefined;
      stylesheet = undefined;

      initialized = 0;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // General

    // A simple way to expose the uid to consumers, who might care which slickgrid instance they're dealing with.
    function getId() {
      return uid;
    }

    function trigger(evt, args, e) {
      // WARNING: keep in mind that we MAY pass either a Slick.EventData instance or a DOM event instance in `e`! 
      // Both types are accepted and depend on which event is triggered...
      e = e || new Slick.EventData();
      args = args || {};
      args.grid = self;
      return evt.notify(args, e, self);
    }

    function getEditorLock() {
      return options.editorLock;
    }

    /**
     * @return {EditController} return the SlickGrid internal EditController. The EditController is an object
     *         which provides two functions (methods) who are invoked by the EditorLock object when necessary:
     *             commitCurrentEdit: function () {...}
     *             cancelCurrentEdit: function () {...}
     */
    function getEditController() {
      return editController;
    }

    function getColumnIndex(id) {
      return columnsById[id];
    }

    function autosizeColumns() {
      var i, c, len,
          widths = [],
          shrinkLeeway = 0,
          total = 0,
          prevTotal,
          availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;

      for (i = 0, len = columns.length; i < len; i++) {
        c = columns[i];
        widths.push(c.width);
        total += c.width;
        if (c.resizable) {
          shrinkLeeway += c.width - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
        }
      }

      // shrink
      prevTotal = total;
      while (total > availableWidth && shrinkLeeway) {
        var shrinkProportion = (total - availableWidth) / shrinkLeeway;
        for (i = 0, len = columns.length; i < len && total > availableWidth; i++) {
          c = columns[i];
          var width = widths[i];
          if (!c.resizable || width <= Math.max(c.minWidth || 0, absoluteColumnMinWidth)) {
            continue;
          }
          var absMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
          var shrinkSize = Math.floor(shrinkProportion * (width - absMinWidth)) || 1;
          shrinkSize = Math.min(shrinkSize, width - absMinWidth);
          total -= shrinkSize;
          shrinkLeeway -= shrinkSize;
          widths[i] -= shrinkSize;
        }
        if (prevTotal <= total) {  // avoid infinite loop
          break;
        }
        prevTotal = total;
      }

      // grow
      prevTotal = total;
      while (total < availableWidth) {
        var growProportion = availableWidth / total;
        for (i = 0, len = columns.length; i < len && total < availableWidth; i++) {
          c = columns[i];
          var currentWidth = widths[i];
          var growSize;

          if (!c.resizable || (c.maxWidth && c.maxWidth <= currentWidth)) {
            growSize = 0;
          } else {
            growSize = Math.min(Math.floor(growProportion * currentWidth) - currentWidth, (c.maxWidth ? c.maxWidth - currentWidth : 0) || 1000000) || 1;
          }
          total += growSize;
          widths[i] += growSize;
        }
        if (prevTotal >= total) {  // avoid infinite loop
          break;
        }
        prevTotal = total;
      }

      for (i = 0, len = columns.length; i < len; i++) {
        if (columns[i].rerenderOnResize && columns[i].width !== widths[i]) {
          invalidateColumn(i);
        }
        columns[i].width = widths[i];
      }

      updateColumnCaches();
      //applyColumnWidths(); -- happens already inside the next statement: updateCanvasWidth(true)
      var rv = updateCanvasWidth();
      assert(rv === true);
      //render();
    }

    /**
     * This function tweaks the generated `.l<N>` and `.r<N>` CSS rules, setting their
     * `left` and `right` CSS styles to calculated pixel positions.
     *
     * Also note that this assumes the addressed DOM nodes (cells in columns) have
     *     position: absolute;
     */
    function applyColumnWidths() {
      var x = 0, w, rule;
      assert(canvasWidth != null);
      assert(totalColumnsWidth != null);
      var gridWidth = canvasWidth;
      var headerWidth = totalColumnsWidth + HEADER_ROW_WIDTH_CORRECTION;
      var headerScrollCompensation = scrollbarDimensions.width;
      for (var i = 0, len = columns.length; i < len; i++) {
        w = columns[i].width;

        rule = getColumnCssRules(i);
        if (!rule) {
          // When the styles for one column aren't loaded yet, then you can bet the bank 
          // the others are neither: abort operation!
          return false;             
        }

        rule.left.style.left = x + "px";
        rule.headerLeft.style.left = x + "px";
        x += w;
        rule.right.style.right = (gridWidth - x) + "px";
        rule.headerRight.style.right = (headerWidth - x) + "px";
      }
      return true;
    }

    function setSortColumn(columnId, ascending) {
      assert(columnId != null);
      assert(getColumnIndex(columnId) != null);
      assert(columns[getColumnIndex(columnId)] != null);

      setSortColumns([{
        sortCol: columns[getColumnIndex(columnId)],
        columnId: columnId,
        sortAsc: ascending
      }]);
    }

    // `cols` is an array of object `{ columnId:..., sortAsc:..., sortCol:columnDef }`
    // where the `.sortCol` field is optional.
    function setSortColumns(cols) {
      sortColumns = cols;

      var headerColumnEls = $headers.children();
      headerColumnEls
        .removeClass("slick-header-column-sorted")
        .find(".slick-sort-indicator")
        .removeClass("slick-sort-indicator-asc slick-sort-indicator-desc");

      var sortCol;
      for (var i = 0, len = sortColumns.length; i < len; i++) {
        sortCol = sortColumns[i];
        if (sortCol.sortAsc == null) {
          sortCol.sortAsc = true;
        }
        assert(sortCol.columnId != null);
        assert(getColumnIndex(sortCol.columnId) != null);
        assert(columns[getColumnIndex(sortCol.columnId)] != null);
        if (sortCol.sortCol == null) {
          assert(columns[getColumnIndex(sortCol.columnId)]);
          sortCol.sortCol = columns[getColumnIndex(sortCol.columnId)];
        }
        assert(columns[getColumnIndex(sortCol.columnId)] === sortCol.sortCol);
        var el = getHeadersColumn(sortCol.columnId);
        if (el) {
          $(el)
            .addClass("slick-header-column-sorted")
            .find(".slick-sort-indicator")
            .addClass(sortCol.sortAsc ? "slick-sort-indicator-asc" : "slick-sort-indicator-desc");
        }
      }
    }

    function getSortColumns() {
      return sortColumns;
    }

    function handleSelectedRangesChanged(e, ranges) {
      selectedRows = [];
      var hash = {};
      var maxRow = getDataLength() - 1;                                             
      var maxCell = columns.length - 1;
      for (var i = 0, len = ranges.length; i < len; i++) {
        for (var j = Math.max(0, ranges[i].fromRow), jlen = Math.min(ranges[i].toRow, maxRow); j <= jlen; j++) {
          if (!hash[j]) {  // prevent duplicates
            selectedRows.push(j);
            hash[j] = {};
          }
          for (var k = Math.max(0, ranges[i].fromCell), klen = Math.min(ranges[i].toCell, maxCell); k <= klen; k++) {
            if (canCellBeSelected(j, k)) {
              hash[j][columns[k].id] = options.selectedCellCssClass;
            }
          }
        }
      }

      setCellCssStyles(options.selectedCellCssClass, hash);

      trigger(self.onSelectedRowsChanged, {
        rows: getSelectedRows(), 
        ranges: ranges
      }, e);
    }

    function getColumns() {
      return columns; // === getColumnsInfo().gridColumns;
    }

    // Produce the entire column tree as an object containing both the original
    // column definition tree and the flattened lists.
    //
    // Note: technically, `ret.gridColumns` === `ret.lookupMatrix[ret.lookupMatrix.length - 1]` i.e.
    // the flattened array of column definitions used for rendering the datagrid is the last
    // (i.e. 'deepest') row of columns in the nestedColumns 2D lookup matrix.
    // We decide to offer it separately however for ease of use: many applications of this API
    // will look for this list in particular as getColumns() doesn't deliver it.
    function getColumnsInfo() { 
      return {
        definitionTree: columnsDefTree,         // the input
        lookupMatrix: nestedColumns,            // the 2D lookup array which carries all headers, plus fill spacers
        gridColumns: columns                    // the 1D columns array representing the columns as shown in the *datagrid*
      };
    }

    function getLeafColumns() {
      return columns;
    }

    function updateColumnCaches() {
      // Pre-calculate cell boundaries.
      columnPosLeft = [];
      //columnPosRight = [];
      var x = 0;
      for (var i = 0, len = columns.length; i < len; i++) {
        columnPosLeft[i] = x;
        x += columns[i].width;
        //columnPosRight[i] = x;
      }
      // store the last calculated left edge also in [length] as it equals the right edge (plus one pixel) of the grid:
      // this way we can use a single cache array columnPosLeft[] to store both left and right edges of all columns!
      // Half the storage and less work for the same result!
      columnPosLeft[i] = x;
    }

    /**
     * Set or re-set the columns in the grid
     * @param {array}     columnDefinitions   columns to set
     * @param {object}    opts                mixed in with the `onColumnsChanged` data sent to event handlers
     *                                        resizeOptions.skipResizeCanvas let's you skip that step. 
     *                                        This boosts performance if you don't need it because you're planning to 
     *                                        manually call resizeCanvas.
     */
    function setColumns(newColumnDefinitions, resizeOptions) {
	  getEditorLock().cancelCurrentEdit();
	
      parseColumns(newColumnDefinitions);
      resizeOptions = resizeOptions || {};
      updateColumnCaches();
      if (initialized) {
        // Kill the active cell when it sits in the column range which doesn't exist any more in the new column definitions / data set.
        if (activeCellNode && activeCell >= columns.length) {
          resetActiveCell();
        }

        invalidateAllRows();
        createColumnHeaders();
        removeCssRules();
        createCssRules();
        if (!resizeOptions.skipResizeCanvas) {
          resizeCanvas(resizeOptions);
        }
        // Warning: the next call would break as the run-time created style in createCssRules() 
        // may not have been parsed by the browser yet! (At least in Chrome/MAC)
        var rv = applyColumnWidths();   
        handleScroll();
        trigger(self.onColumnsChanged, {
          resizeOptions: resizeOptions,
          success: rv
        });
        return rv;
      }
      return false;
    }

    // Given a column definition object, do all the steps required to react to a change in the widths of any of the columns
    function updateColumnWidths(newColumnDefinitions) {
      // cache the old column widths so we can see which ones changed:
      var columnCount = columns.length;
      var oldColumnWidths = new Array(columnCount);
      var j, c;
      for (j = 0; j < columnCount; j++) {
        c = columns[j];
        assert(c);
        oldColumnWidths[j] = c.width;
      }

      parseColumns(newColumnDefinitions);
      updateColumnCaches();
      
      // compare the new column set against the old one:
      assert(columns.length === columnCount);
      var adjustedColumns = [];
      for (j = 0; j < columnCount; j++) {
        c = columns[j];
        assert(c);
        if (oldColumnWidths[j] !== c.width) {
          adjustedColumns.push(c);
          if (c.rerenderOnResize) {
            invalidateColumn(j);
          }
        }
      }
      if (initialized) {
        // Surgically update all cell widths, including header cells:
        //applyColumnWidths(); -- happens already inside the next statement: updateCanvasWidth()
        var rv = updateCanvasWidth();
        trigger(self.onColumnsResized, { 
          adjustedColumns: adjustedColumns, 
          success: rv 
        });
        return rv;
      }
      return false;
    }

    function getOptions() {
      return options;
    }

    function setOptions(args) {
      if (!getEditorLock().commitCurrentEdit()) {
        return false;
      }

      makeActiveCellNormal();

      var prev = __extend({}, options);    // shallow clone

      options = __extend(options, args);
      validateAndEnforceOptions();

      if (options.enableAddRow !== prev.enableAddRow) {
        invalidateRow(getDataLength());
      }

      if (options.forceFitColumns && options.forceFitColumns !== prev.forceFitColumns) {
        autosizeColumns();
      }

      //$viewport.css("overflow-y", (options.autoHeight && !clippedAutoSize) ? "auto" : "auto");
      render();

      return true;
    }

    function validateAndEnforceOptions() {
    }

    // Note: this is a separate function as the for..in causes the code to remain unoptimized
    // ( http://commondatastorage.googleapis.com/io-2013/presentations/223.pdf / https://github.com/paperjs/paper.js/issues/466 )
    function appendCellCssStylesToArray(dst, cellCssClasses, row, columnDef) {
      for (var key in cellCssClasses) {
        assert(cellCssClasses.hasOwnProperty(key));
        var clsdef = cellCssClasses[key];
        var classes = (clsdef && clsdef[row]);
        if (classes && classes[columnDef.id]) {
          dst.push(classes[columnDef.id]);
        }
      }
    }

    function setData(newData, scrollToTop) {
      data = newData;
      invalidateAllRows();
      updateRowCount();
      if (scrollToTop) {
        scrollTo(0, 0);
      }
      render();
    }

    function getData() {
      return data;
    }

    function getDataLength() {
      if (data.getLength) {
        return data.getLength();
      } else {
        return data.length;
      }
    }

    function getDataLengthIncludingAddNew() {
      return getDataLength() + (options.enableAddRow ? 1 : 0);
    }

    function getDataItem(row) {
      if (data.getItem) {
        return data.getItem(row);
      } else {
        return data[row];
      }
    }

    function getCellValueAndInfo(row, cell, config) {
      config = __extend({
        value: true,
        node: true,
        height: true,
        uid: true,
        css: true,
        format: true,

        outputPlainText: true
      }, config);

      // if the cell has other coordinates because of row/cell span, update that cell coordinate
      var colspan = 1;
      var rowspan = 1;
      var spans = getSpans(row, cell);
      assert(spans ? spans.colspan >= 1 : true);
      if (spans) {
        row = spans.row;
        cell = spans.cell;
        rowspan = spans.rowspan;
        colspan = spans.cellspan;
      }

      assert(Math.min(columns.length - 1, cell + colspan - 1) === cell + colspan - 1);

      var m = columns[cell],
          rowDataItem = getDataItem(row);

      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);
      // look up by id, then index
      var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[m.id] || rowMetadata.columns[cell]);

      var cellCss = [];
      if (config.css) {
        appendCellCssStylesToArray(cellCss, cellCssClasses, row, m);
      }

      var cellHeight = options.rowHeight - cellHeightDiff;

      var info = {
          cellCss: cellCss,
          cellStyles: [],
          html: "",
          attributes: {},
          row: row,
          cell: cell,
          colspan: colspan,
          rowspan: rowspan,
          cellHeight: cellHeight,
          isNonStandardCellHeight: false,
          column: m,
          rowDataItem: rowDataItem,
          rowMetadata: rowMetadata,
          columnMetadata: columnMetadata,
          formatterOptions: __extend({}, options.formatterOptions, m.formatterOptions),
          editorOptions: __extend({}, options.editorOptions, m.editorOptions),
          outputPlainText: config.outputPlainText || false
      };

      if (config.height) {
        var altCellHeight = getCellHeight(row, rowspan);
        info.isNonStandardCellHeight = (cellHeight !== altCellHeight);
        info.cellHeight = cellHeight;
      }

      if (config.uid) {
        info.uid = mkSaneId(m, cell, row);
      }
      if (config.node) {
        info.cellNode = getCellNode(row, cell, true);
      }

      if (rowDataItem && config.value) {
        var value = getDataItemValueForColumn(rowDataItem, m, rowMetadata, columnMetadata);
        info.value = value;
        info.formatter = getFormatter(row, cell);
        if (config.format) {
          info.html = info.formatter(row, cell, value, m, rowDataItem, info);
        }
      }
      return info;
    }

    function getTopPanel() {
      return $topPanel[0];
    }

    function setTopPanelVisibility(visible) {
      if (options.showTopPanel != visible) {
        options.showTopPanel = visible;
        if (visible) {
          $topPanelScroller.slideDown("fast", resizeCanvas);
        } else {
          $topPanelScroller.slideUp("fast", resizeCanvas);
        }
      }
    }

    function setFooterRowVisibility(visible) {
      if (options.showFooterRow != visible) {
        options.showFooterRow = visible;
        if (visible) {
          $footerRowScroller.slideDown("fast", resizeCanvas);
        } else {
          $footerRowScroller.slideUp("fast", resizeCanvas);
        }
      }
    }

    function setHeaderRowVisibility(visible) {
      if (options.showHeaderRow != visible) {
        options.showHeaderRow = visible;
        if (visible) {
          $headerRowScroller.slideDown("fast", resizeCanvas);
        } else {
          $headerRowScroller.slideUp("fast", resizeCanvas);
        }
      }
    }

    function parseColumns(columnsInput) {
      var maxDepth = 0;

      columns = [];
      columnsById = {};

      function parse(input, depth, parent) {
        var totalHeaderColSpan = 0;
        var colset = [];
        if (depth >= maxDepth) {
          maxDepth = depth + 1;
        }
        assert(input.length > 0);
        parent.childrenFirstIndex = columns.length;
        for (var i = 0, len = input.length; i < len; i++) {
          var column = __extend({}, columnDefaults, input[i]);
          colset.push(column);
          if (column.children) {
            hasNestedColumns = true;
            column.headerColSpan = parse(column.children, depth + 1, column);
            column.headerRowSpan = 1;
          } else {
            // Ensure that the columnsById[] mapping is a guaranteed reversible 1:1 relationship
            // and that the column.id field is always set to something sensible.
            if (columnsById[column.id] !== undefined || column.id == null) {
              column.id = "__uniq_c" + columns.length; // mkSaneId(column, columns.length, "uniq");
              assert(columnsById[column.id] === undefined);
            }
            columnsById[column.id] = columns.length;
            // make sure `minWidth <= width <= maxWidth`
            if (column.minWidth && column.width < column.minWidth) {
              column.width = column.minWidth;
            }
            if (column.maxWidth && column.width > column.maxWidth) {
              column.width = column.maxWidth;
            }
            column.headerColSpan = 1;
            column.headerRowSpan = 1;
            columns.push(column);
          }
          totalHeaderColSpan += column.headerColSpan;
        }
        parent.children = colset;
        parent.childrenLastIndex = columns.length;
        return totalHeaderColSpan;
      }

      function addToNested(column, depth) {
        if (!nestedColumns) {
          nestedColumns = [];
        }
        if (!nestedColumns[depth]) {
          nestedColumns[depth] = [];
        }
        // The (column.headerRowLayerIndex, column.headerRow) 'coordinate' is an index straight
        // into the nestedColumns[][] 2D array; this info is included with each columnDef to
        // allow userland code to index and use the nestedColumns via `getColumnsInfo().lookupMatrix`.  
        column.headerRow = depth;
        assert(column.headerRowSpan >= 1);
        column.headerRowLayerIndex = nestedColumns[depth].length;
        nestedColumns[depth].push(column);
      }

      function splitIntoLayers(input, depth) {
        for (var index = 0; index < input.length; index++) {
          var column = input[index];
          addToNested(column, depth);
          if (column.children) {
            assert(column.headerRowSpan === 1);
            splitIntoLayers(column.children, depth + 1);
          } else {
            column.headerRowSpan = maxDepth - depth;
          }
        }
      }

      hasNestedColumns = false;
      var super_parent = {};
      parse(columnsInput, 0, super_parent);
      columnsDefTree = super_parent.children;
      assert(columnsDefTree.length === columnsInput.length);

      assert(hasNestedColumns ? maxDepth > 1 : maxDepth === 1);
      if (hasNestedColumns) {
        splitIntoLayers(columnsDefTree, 0);
        assert(nestedColumns.length === maxDepth);
      } else {
        for (var i = 0, len = columns.length; i < len; i++) {
          var columnDef = columns[i];
          columnDef.headerRow = 0;
          columnDef.headerRowLayerIndex = 0;
          assert(columnDef.headerRowSpan === 1);
          assert(columnDef.headerColSpan === 1);
        }
      }
    }

    function getContainerNode() {
      return $container.get(0);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Rendering / Scrolling

    function cacheRowPositions() {
      var len = getDataLengthIncludingAddNew();
      getRowPosition(len - 1);
    }

    function getRowPosition(row) {
      assert(row >= -1);
      assert(row <= getDataLengthIncludingAddNew() + 1);
      var pos = rowPositionCache[row];
      if (!pos || pos.top == null) {
        var r, top, rowMetadata;
        // do not recurse; loop until we hit the last valid and *complete* cache entry (or row === 0)
        for (r = row; r >= 0; r--) {
          pos = rowPositionCache[r];
          if (!pos) {
            rowMetadata = data.getItemMetadata && data.getItemMetadata(r, false);
            pos = rowPositionCache[r] = {
              top: undefined,     // this way the cache object doesn't change "type" as all fields are created initially: aim for Chrome V8 top perf.
              height: (rowMetadata && rowMetadata.height > 0) ? rowMetadata.height : options.rowHeight
            };
          } else if (pos.top != null) {
            break;
          }
        }
        // we now know that all preceding cache elements (up to and including the [row] entry) have been set up with a valid .height
        // so now all we need to do is update all .top values; all entries' .height is valid hence we can run a very tight loop:
        if (r < 0) {
          assert(r === -1);
          assert(pageOffset === 0);
          pos = {
            top: -pageOffset,
            height: 0
          };
        }
        assert(pos);
        while (++r <= row) {
          top = pos.top + pos.height;
          pos = rowPositionCache[r];
          pos.top = top;
        }
      }
      return pos;
    }

    function getRowTop(row) {
      return getRowPosition(row).top;
    }

    function getRowHeight(row) {
      return getRowPosition(row).height;
    }

    function getRowBottom(row) {
      var pos = getRowPosition(row);
      return pos.top + pos.height;
    }

    // Return the row index at the given grid pixel coordinate Y.
    //
    // Also return the "fraction" of the index within the row, i.e.
    // if the Y coordinate points at a spot 25% from the top of the row, then
    // `returnValue.fraction` will be 0.25
    //
    // `returnValue.fraction === 0.0` would identify the top pixel within the row.
    //
    // When the Y coordinate points outside the grid, out-of-range numbers 
    // will be produced as this function will estimate the row number using the
    // default row height.
    //
    // The fraction is guaranteed to be less than 1 (value range: [0 .. 1>).
    function getRowWithFractionFromPosition(posY, clipToValidRange) {
      if (clipToValidRange == null) {
        clipToValidRange = true;
      }

      //assert(posY >= 0); -- posY can be a negative number when this function is called from inside a drag from bottom-right to top-left where the user drags until outside the grid canvas area
      var rowsInPosCache = getDataLengthIncludingAddNew();
      var topRowInfo;
      var bottomRowInfo;
      var fraction;
      var probe, top, probeInfo, height, dy;

      if (!rowsInPosCache) {
        topRowInfo = getRowPosition(0);
        top = topRowInfo.top;
        probe = 0;
        fraction = 0;
        height = options.rowHeight;
        assert(height > 0);
        if (!clipToValidRange) {
          probe = Math.floor((posY - top) / height);
          fraction = (posY - probe * height) / height;
        }
        return {
          position: probe,
          fraction: fraction,
          height: height
        };
      }

      // perform a binary search through the row cache: O(log2(n)) vs. linear scan at O(n):
      //
      // This first call to getRowTop(rowsInPosCache - 1) is here to help update the row cache
      // at the start of the search; at least for many scenarios where all (or the last) rows
      // have been invalidated:
      bottomRowInfo = getRowPosition(rowsInPosCache - 1);
      if (posY >= bottomRowInfo.top) {
        // Return the last row in the grid if we've got to clip
        top = bottomRowInfo.top;
        probe = rowsInPosCache - 1;
        height = bottomRowInfo.height;
        assert(height > 0);
        fraction = (posY - top) / height;
        assert(height > 0);
        if (!clipToValidRange && posY >= top + height) {
          height = options.rowHeight;
          posY -= top + height;
          dy = Math.floor(posY / height);
          probe += 1 + dy;
          fraction = (posY - dy * height) / height;
          assert(fraction >= 0);
          assert(fraction < 1);
        }
        return {
          position: probe,
          fraction: fraction,
          height: height
        };
      }
      topRowInfo = getRowPosition(0);
      if (posY < topRowInfo.top) {
        // Return the first row in the grid if we've got to clip
        top = topRowInfo.top;
        probe = 0;
        height = topRowInfo.height;
        assert(height > 0);
        fraction = (posY - top) / height;
        assert(height > 0);
        if (!clipToValidRange && posY < top) {
          height = options.rowHeight;
          posY -= top;
          dy = Math.floor(posY / height);
          probe += dy;
          fraction = (posY - dy * height) / height;
          assert(fraction >= 0);
          assert(fraction < 1);
        }
        return {
          position: probe,
          fraction: fraction,
          height: height
        };
      }

      var l = 0;
      var r = rowsInPosCache - 1;
      // before we enter the binary search, we attempt to improve the initial guess + search range
      // using the heuristic that the variable cell height will be close to rowHeight:
      // we perform two probes (at ≈1‰ interval) to save 10 probes (1000 ≈ 2^10) if we are lucky;
      // we "loose" 1 probe (the second) to inefficiency if we are unlucky (though one may argue
      // that the possibly extremely skewed split point for the first probe is also a loss -- which
      // would be true if the number of rows with non-standard rowHeight is large and/or deviating
      // from that norm `options.rowHeight` a lot for some rows, thus moving the targets outside the
      // "is probably within 1‰ of the norm" for most row positions.
      // 
      // Alas, for my tested (large!) grids this heuristic gets us very near O(2) vs O(log2(N)).
      // For grids which do not employ custom rowHeight at all, the performance is O(1). I like that!
      //
      // (Yes, this discussion ignores the cost of the rowheight position cache table update which
      // is O(N) on its own but which is also to be treated as "negligible cost" when amortized over
      // the number of getRowWithFractionFromPosition calls vs. cache invalidation.)
      probe = (posY / options.rowHeight) | 0;
      probe = Math.min(rowsInPosCache - 1, Math.max(0, probe));
      probeInfo = getRowPosition(probe);
      top = probeInfo.top;
      if (top > posY) {
        r = probe - 1;
        probe = r - 1 - (0.001 * rowsInPosCache) | 0;
        probe = Math.max(0, probe);
        probeInfo = getRowPosition(probe);
        top = probeInfo.top;
        if (top > posY) {
          r = probe - 1;
        } else if (top + probeInfo.height > posY) {
          fraction = (posY - top) / probeInfo.height;
          assert(fraction >= 0);
          assert(fraction < 1);
          return {
            position: probe,
            fraction: fraction,
            height: probeInfo.height
          };
        } else {
          l = probe + 1;
        }
      } else if (top + probeInfo.height > posY) {
        fraction = (posY - top) / probeInfo.height;
        assert(fraction >= 0);
        assert(fraction < 1);
        return {
          position: probe,
          fraction: fraction,
          height: probeInfo.height
        };
      } else {
        l = probe + 1;
        probe = l + 1 + (0.001 * rowsInPosCache) | 0;
        probe = Math.min(rowsInPosCache - 1, probe);
        probeInfo = getRowPosition(probe);
        top = probeInfo.top;
        if (top > posY) {
          r = probe - 1;
        } else if (top + probeInfo.height > posY) {
          fraction = (posY - top) / probeInfo.height;
          assert(fraction >= 0);
          assert(fraction < 1);
          return {
            position: probe,
            fraction: fraction,
            height: probeInfo.height
          };
        } else {
          l = probe + 1;
        }
      }
      assert(l <= r || r < 0);

      while (l < r) {
        probe = ((l + r) / 2) | 0; // INT/FLOOR
        probeInfo = getRowPosition(probe);
        top = probeInfo.top;
        if (top > posY) {
          r = probe - 1;
        } else if (top + probeInfo.height > posY) {
          fraction = (posY - top) / probeInfo.height;
          assert(fraction >= 0);
          assert(fraction < 1);
          return {
            position: probe,
            fraction: fraction,
            height: probeInfo.height
          };
        } else {
          l = probe + 1;
        }
      }
      probeInfo = getRowPosition(l);
      fraction = (posY - probeInfo.top) / probeInfo.height;
      assert(fraction >= 0);
      assert(fraction < 1);
      return {
        position: l,
        fraction: fraction,
        height: probeInfo.height
      };
    }

    // Return the column index at the given grid pixel coordinate X.
    //
    // Also return the "fraction" of the index within the column, i.e.
    // if the X coordinate points at a spot 25% from the left of the column, then
    // `returnValue.fraction` will be 0.25
    //
    // `returnValue.fraction === 0.0` would identify the left-most pixel within the column.
    //
    // When the X coordinate points outside the grid, out-of-range numbers 
    // will be produced as this function will estimate the column number using the
    // default column width.
    //
    // The fraction is guaranteed to be less than 1 (value range: [0 .. 1>).
    // 
    // Use a binary search alike algorithm to find the column, using 
    // linear estimation to produce the split/probe point: this should improve
    // significantly on the O(log(n)) of a binary search. 
    function getColumnWithFractionFromPosition(posX, clipToValidRange) {
      if (clipToValidRange == null) {
        clipToValidRange = true;
      }

      //assert(posY >= 0); -- posY can be a negative number when this function is called from inside a drag from bottom-right to top-left where the user drags until outside the grid canvas area
      assert(columnPosLeft.length === columns.length + 1);
      // prime the cache if it wasn't already:
      var bottomColInfo = getColumnOffset(columns.length);
      var colsInPosCache = columns.length; // WARNING: here specifically **NOT** columnPosLeft.length! 
      var topColInfo;
      var fraction;
      var probe, top, probeInfo, width, dy;

      if (!colsInPosCache) {
        topColInfo = getColumnOffset(0);
        top = topColInfo;
        probe = 0;
        fraction = 0;
        width = options.defaultColumnWidth;
        assert(width > 0);
        if (!clipToValidRange) {
          probe = Math.floor((posX - top) / width);
          fraction = (posX - probe * width) / width;
        }
        return {
          position: probe,
          fraction: fraction,
          width: width
        };
      }

      // perform a binary search through the col cache: O(log2(n)) vs. linear scan at O(n):
      //
      // This first call to getColTop(colsInPosCache - 1) is here to help update the col cache
      // at the start of the search; at least for many scenarios where all (or the last) cols
      // have been invalidated:
      bottomColInfo = getColumnOffset(colsInPosCache - 1);
      if (posX >= bottomColInfo.top) {
        // Return the last col in the grid if we've got to clip
        top = bottomColInfo.top;
        probe = colsInPosCache - 1;
        width = bottomColInfo.width;
        assert(width > 0);
        fraction = (posX - top) / width;
        assert(width > 0);
        if (!clipToValidRange && posX >= top + width) {
          width = options.defaultColumnWidth;
          posX -= top + width;
          dy = Math.floor(posX / width);
          probe += 1 + dy;
          fraction = (posX - dy * width) / width;
          assert(fraction >= 0);
          assert(fraction < 1);
        }
        return {
          position: probe,
          fraction: fraction,
          width: width
        };
      }
      topColInfo = getColumnOffset(0);
      if (posX < topColInfo.top) {
        // Return the first col in the grid if we've got to clip
        top = topColInfo.top;
        probe = 0;
        width = topColInfo.width;
        assert(width > 0);
        fraction = (posX - top) / width;
        assert(width > 0);
        if (!clipToValidRange && posX < top) {
          width = options.defaultColumnWidth;
          posX -= top;
          dy = Math.floor(posX / width);
          probe += dy;
          fraction = (posX - dy * width) / width;
          assert(fraction >= 0);
          assert(fraction < 1);
        }
        return {
          position: probe,
          fraction: fraction,
          width: width
        };
      }

      var l = 0;
      var r = colsInPosCache - 1;
      // before we enter the binary search, we attempt to improve the initial guess + search range
      // using the heuristic that the variable cell width will be close to defaultColumnWidth:
      // we perform two probes (at ≈1‰ interval) to save 10 probes (1000 ≈ 2^10) if we are lucky;
      // we "loose" 1 probe (the second) to inefficiency if we are unlucky (though one may argue
      // that the possibly extremely skewed split point for the first probe is also a loss -- which
      // would be true if the number of cols with non-standard defaultColumnWidth is large and/or deviating
      // from that norm `options.defaultColumnWidth` a lot for some cols, thus moving the targets outside the
      // "is probably within 1‰ of the norm" for most col positions.
      // 
      // Alas, for my tested (large!) grids this heuristic gets us very near O(2) vs O(log2(N)).
      // For grids which do not employ custom defaultColumnWidth at all, the performance is O(1). I like that!
      //
      // (Yes, this discussion ignores the cost of the colwidth position cache table update which
      // is O(N) on its own but which is also to be treated as "negligible cost" when amortized over
      // the number of getColWithFractionFromPosition calls vs. cache invalidation.)
      probe = (posX / options.defaultColumnWidth) | 0;
      probe = Math.min(colsInPosCache - 1, Math.max(0, probe));
      probeInfo = getColumnOffset(probe);
      top = probeInfo.top;
      if (top > posX) {
        r = probe - 1;
        probe = r - 1 - (0.001 * colsInPosCache) | 0;
        probe = Math.max(0, probe);
        probeInfo = getColumnOffset(probe);
        top = probeInfo.top;
        if (top > posX) {
          r = probe - 1;
        } else if (top + probeInfo.width > posX) {
          fraction = (posX - top) / probeInfo.width;
          assert(fraction >= 0);
          assert(fraction < 1);
          return {
            position: probe,
            fraction: fraction,
            width: probeInfo.width
          };
        } else {
          l = probe + 1;
        }
      } else if (top + probeInfo.width > posX) {
        fraction = (posX - top) / probeInfo.width;
        assert(fraction >= 0);
        assert(fraction < 1);
        return {
          position: probe,
          fraction: fraction,
          width: probeInfo.width
        };
      } else {
        l = probe + 1;
        probe = l + 1 + (0.001 * colsInPosCache) | 0;
        probe = Math.min(colsInPosCache - 1, probe);
        probeInfo = getColumnOffset(probe);
        top = probeInfo.top;
        if (top > posX) {
          r = probe - 1;
        } else if (top + probeInfo.width > posX) {
          fraction = (posX - top) / probeInfo.width;
          assert(fraction >= 0);
          assert(fraction < 1);
          return {
            position: probe,
            fraction: fraction,
            width: probeInfo.width
          };
        } else {
          l = probe + 1;
        }
      }
      assert(l <= r || r < 0);

      while (l < r) {
        probe = ((l + r) / 2) | 0; // INT/FLOOR
        probeInfo = getColumnOffset(probe);
        top = probeInfo.top;
        if (top > posX) {
          r = probe - 1;
        } else if (top + probeInfo.width > posX) {
          fraction = (posX - top) / probeInfo.width;
          assert(fraction >= 0);
          assert(fraction < 1);
          return {
            position: probe,
            fraction: fraction,
            width: probeInfo.width
          };
        } else {
          l = probe + 1;
        }
      }
      probeInfo = getColumnOffset(l);
      fraction = (posX - probeInfo.top) / probeInfo.width;
      assert(fraction >= 0);
      assert(fraction < 1);
      return {
        position: l,
        fraction: fraction,
        width: probeInfo.width
      };
    }


    // Return TRUE when the viewport has been actually scrolled;
    // return FALSE when there's been no movement.
    function scrollTo(y, x) {
      if (x == null) {
        x = prevScrollLeft;
      }
      if (y == null) {
        y = prevScrollTop;
      }

      x = Math.max(x, 0);
      y = Math.max(y, 0);
      y = Math.min(y, virtualTotalHeight - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0));

      var oldOffset = pageOffset;

      page = Math.min(numberOfPages - 1, pageHeight > 0 ? Math.floor(y / pageHeight) : 0);
      pageOffset = Math.round(page * jumpinessCoefficient);
      var newScrollTop = y - pageOffset;

      // if (pageOffset !== oldOffset) {
      //   var range = getVisibleRange(newScrollTop);
      //   cleanUpRows(range);
      // }

      var viewportChanged = false;

      if (prevScrollTop !== newScrollTop) {
        //console.log("scrollTo caused a change!: ", prevScrollTop, newScrollTop, pageOffset, oldOffset, page, y, range);
        vScrollDir = (prevScrollTop + oldOffset < newScrollTop + pageOffset) ? 1 : -1;
        $viewport[0].scrollTop = prevScrollTop = scrollTop = newScrollTop;
        viewportChanged = true;
      }

      var newScrollLeft = x;
      if (prevScrollLeft !== newScrollLeft) {
        $viewport[0].scrollLeft = prevScrollLeft = scrollLeft = newScrollLeft;
        viewportChanged = true;
      }

      if (viewportChanged) {
        trigger(self.onViewportChanged, {});
        return true;
      }
      return false;
    }

    var processHtmlEntities = new Slick.HtmlEntities();

    function defaultFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      assert(cellMetaInfo);
      if (cellMetaInfo.outputPlainText) {
        if (value == null) {
          return "";
        } else {
          return "" + value;
        }
      } else {
        return processHtmlEntities.encode(value);
      }
    }

    function defaultHeaderFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      assert(cellMetaInfo);
      // make sure column names with & ampersands and/or < / > less-than/greater-then characters are properly rendered in HTML:
      var output = defaultFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo);
      if (!cellMetaInfo.outputPlainText) {
        // Do create an outer SPAN so that we can style the entire header cell *excluding* the (optional) column resizer component:
        output = "<span class='slick-column-name'>" + output + "</span>";
      }
      return output;
    }

    function defaultHeaderRowFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      assert(cellMetaInfo);
      // make sure column names with & ampersands and/or < / > less-than/greater-then characters are properly rendered in HTML:
      var output = defaultFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo);
      if (!cellMetaInfo.outputPlainText) {
        // Do create an outer SPAN so that we can style the entire header cell *excluding* the (optional) column resizer component:
        output = "<span class='slick-extra-headerrow-column'>" + output + "</span>";
      }
      return output;
    }

    function defaultRowFormatter(row, rowDataItem, rowMetaInfo) {
      assert(rowMetaInfo);
      // return nothing; all this formatter ever may do is tweak the rowMetaInfo.attributes collective.
    }

    function getRowFormatter(row) {
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, false);

      return (rowMetadata && rowMetadata.rowFormatter) ||
          (options.formatterFactory && options.formatterFactory.getRowFormatter && options.formatterFactory.getRowFormatter(row, rowMetadata)) ||
          options.defaultRowFormatter;
    }

    function getFormatter(row, cell) {
      var column = columns[cell];
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnMetadata && columnMetadata.formatter) ||
          (rowMetadata && rowMetadata.formatter) ||
          column.formatter ||
          (options.formatterFactory && options.formatterFactory.getFormatter && options.formatterFactory.getFormatter(column, row, cell, rowMetadata, columnMetadata)) ||
          options.defaultFormatter;
    }

    /**
     * Returns the header cell formatter for the given header row / column
     *
     * @param {Integer} headerRow the header row number; starts numbering at 0 (zero).
     *                  Vanilla SlickGrid only supports a single header row, which is numbered 0 (zero).
     * @param {Integer} cell the header column number; starts numbering at 0 (zero).
     * @return {Function} a Slick.Formatters compatible formatter.
     *                    In order to allow the user to re-use basic formatters,
     *                    the row number passed to the formatter will start at -2000 (minus two thousand).
     */
    function getHeaderFormatter(headerRow, cell) {
      var column = columns[cell];
      var rowMetadata = data.getHeaderItemMetadata && data.getHeaderItemMetadata(headerRow, cell);

      // look up by id, then index
      var columnOverrides = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnOverrides && columnOverrides.headerFormatter) ||
          (rowMetadata && rowMetadata.headerFormatter) ||
          column.headerFormatter ||
          (options.formatterFactory && options.formatterFactory.getHeaderFormatter && options.formatterFactory.getHeaderFormatter(column, row, cell, rowMetadata, columnMetadata)) ||
          options.defaultHeaderFormatter;
    }

    /**
     * Returns the headerRow cell formatter for the given headerRow row / column.
     *
     * The "headerRow" is the header row shown by SlickGrid when the `option.showHeaderRow` is enabled.
     *
     * @param {Integer} headerRow the headerRow row number; starts numbering at 0 (zero).
     *                  Vanilla SlickGrid only supports a single headerRow row, which is numbered 0 (zero).
     *
     * @param {Integer} cell the headerRow column number; starts numbering at 0 (zero).
     *
     * @return {Function} a Slick.Formatters compatible formatter.
     *                    In order to allow the user to re-use basic formatters,
     *                    the row number passed to the formatter will start at -1000 (minus one thousand).
     */
    function getHeaderRowFormatter(headerRow, cell) {
      var column = columns[cell];
      var rowMetadata = data.getHeaderRowItemMetadata && data.getHeaderRowItemMetadata(headerRow, cell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnMetadata && columnMetadata.headerRowFormatter) ||
          (rowMetadata && rowMetadata.headerRowFormatter) ||
          column.headerRowFormatter ||
          (options.formatterFactory && options.formatterFactory.getHeaderRowFormatter && options.formatterFactory.getHeaderRowFormatter(column, row, cell, rowMetadata, columnMetadata)) ||
          options.defaultHeaderRowFormatter;
    }

    function getEditor(row, cell) {
      var column = columns[cell];
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);

      return (columnMetadata && columnMetadata.editor) ||
          (rowMetadata && rowMetadata.editor) ||
          column.editor ||
          (options.editorFactory && options.editorFactory.getEditor && options.editorFactory.getEditor(column, row, cell, rowMetadata, columnMetadata)) ||
          options.defaultEditor;
    }

    function getDataItemValueForColumn(item, columnDef, rowMetadata, columnMetadata) {
      if (columnMetadata && columnMetadata.dataItemColumnValueExtractor) {
        return columnMetadata.dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata);
      }
      if (rowMetadata && rowMetadata.dataItemColumnValueExtractor) {
        return rowMetadata.dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata);
      }
      if (columnDef && columnDef.dataItemColumnValueExtractor) {
        return columnDef.dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata);
      }
      if (options.dataItemColumnValueExtractor) {
        return options.dataItemColumnValueExtractor(item, columnDef, rowMetadata, columnMetadata);
      }
      return item[columnDef.field];
    }

    function setDataItemValueForColumn(item, columnDef, value, rowMetadata, columnMetadata) {
      if (columnMetadata && columnMetadata.dataItemColumnValueSetter) {
        return columnMetadata.dataItemColumnValueSetter(item, columnDef, value, rowMetadata, columnMetadata);
      }
      if (rowMetadata && rowMetadata.dataItemColumnValueSetter) {
        return rowMetadata.dataItemColumnValueSetter(item, columnDef, value, rowMetadata, columnMetadata);
      }
      if (columnDef && columnDef.dataItemColumnValueSetter) {
        return columnDef.dataItemColumnValueSetter(item, columnDef, value, rowMetadata, columnMetadata);
      }
      if (options.dataItemColumnValueSetter) {
        return options.dataItemColumnValueSetter(item, columnDef, value, rowMetadata, columnMetadata);
      }
      return item[columnDef.field] = value;
    }

    // Combines the various obj.attributes collections into one; returns NULL when no custom metadata was obtained at all.
    // 
    // Notes: 
    // - Attributes which are set to UNDEFINED are not included in the output. 
    // - Attributes which are set to NULL, do get included in the returned set.
    // - Attributes specified in a later function argument override the same ones in a previous argument: 
    //   mkCellHtmlOutput has precedence over columnMetadata, which has precedence over rowMetadata.
    function getAllCustomMetadata(rowMetadata, columnMetadata, mkCellHtmlOutput) {
      var obj = {};
      var attr, val, meta;
      var count = 0;

      function collect_meta(obj, meta) {
        var count = 0;
        var attr, val;

        for (attr in meta) {
          assert(meta.hasOwnProperty(attr));
          val = meta[attr];
          if (val !== undefined) {
            obj[attr] = val;
            count++;
          }
        }
        return count;
      }

      if (rowMetadata && rowMetadata.attributes) {
        meta = rowMetadata.attributes;

        count += collect_meta(obj, meta);
      }

      if (columnMetadata && columnMetadata.attributes) {
        meta = columnMetadata.attributes;

        count += collect_meta(obj, meta);
      }

      if (mkCellHtmlOutput && mkCellHtmlOutput.attributes) {
        meta = mkCellHtmlOutput.attributes;
  
        count += collect_meta(obj, meta);
      }

      if (count) {
        return obj;
      }
      return null;
    }

    function mkRowHtml(row, dataLength) {
      var d = getDataItem(row);
      var dataLoading = row < dataLength && !d;
      var rowCss = ["ui-widget-content", "slick-row",
          (row % 2 === 1 ? "odd" : "even"),
          "slick-row-" + row
      ];
      if (dataLoading) {
        rowCss.push("loading");
      }
      if (row === activePosY) {
        rowCss.push("active-row");
      }

      if (!d) {
        rowCss.push(options.addNewRowCssClass);
      }

      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, false);

      if (rowMetadata && rowMetadata.cssClasses) {
        if (typeof rowMetadata.cssClasses === "function") {
          rowCss = rowCss.concat(rowMetadata.cssClasses(row));
        } else {
          rowCss.push(rowMetadata.cssClasses);
        }
      }

      assert(rowsCache[row]);
      assert(rowsCache[row].cellRenderQueue.length === 0);

      var metaData = getAllCustomMetadata(rowMetadata) || {};
      metaData.role = "row";
      var rowStyles = ["top: " + getRowTop(row) + "px"];
      var rowHeight = getRowHeight(row);
      if (rowHeight !== options.rowHeight - cellHeightDiff) {
        rowStyles.push("height: " + rowHeight + "px");
      }

      var info = __extend({}, options.rowFormatterOptions, {
        rowCss: rowCss,
        rowStyles: rowStyles,
        attributes: metaData,
        rowHeight: rowHeight,
        rowMetadata: rowMetadata,
        rowData: d
      });
      // I/F: function rowFormatter(row, rowDataItem, rowMetaInfo)
      getRowFormatter(row)(row, rowMetadata, info);
      assert(metaData === info.attributes);

      return info;
    }

    function appendRowHtml(stringArray, row, range, dataLength) {
      var info = mkRowHtml(row, dataLength);
      var metaData = info.attributes;

      stringArray.push("<div");

      patchupCellAttributes(metaData, info, "row");
      appendMetadataAttributes(stringArray, row, null, metaData, null, null, info);

      stringArray.push(">");

      var rowMetadata = info.rowMetadata;
      var d = info.rowData;

      var colspan, m, columnData;
      for (var i = 0, ii = columns.length; i < ii; i += colspan) {
        m = columns[i];
        colspan = 1;
        var spanRow = row;
        var spans = getSpans(row, i);
        if (spans) {
          colspan = spans.colspan - i + spans.cell;
          spanRow = spans.row;
        }

        if (spanRow < row) {
          continue;
        }

        // Do not render cells outside of the viewport.
        assert(Math.min(ii, i + colspan) === i + colspan);
        if (columnPosLeft[i + colspan] > range.leftPx) {
          if (columnPosLeft[i] >= range.rightPx) {
            // All columns to the right are outside the range.
            break;
          }

          assert(rowsCache[row]);
          assert(!rowsCache[row].cellNodesByColumnIdx[i]);

          // look up by id, then index
          columnData = rowMetadata && rowMetadata.columns && (rowMetadata.columns[m.id] || rowMetadata.columns[i]);
          // I/F: function appendCellHtml(stringArray, row, cell, rowMetadata, columnMetadata, rowDataItem)
          appendCellHtml(stringArray, row, i, rowMetadata, columnData, d);
        }
      }

      if (rowMetadata && rowMetadata.appendHtml) {
        stringArray.push(rowMetadata.appendHtml);
      }

      stringArray.push("</div>");
    }

    function mkCellHtml(row, cell, rowMetadata, columnMetadata, rowDataItem) {
      var m = columns[cell];
      assert(m);
      var colspan = 1;
      var rowspan = 1;
      var spans = getSpans(row, cell);
      assert(spans ? spans.colspan >= 1 : true);
      if (spans) {
        assert(row === spans.row);
        assert(cell === spans.cell);
        rowspan = spans.rowspan - row + spans.row;
        colspan = spans.colspan - cell + spans.cell;
      }
      assert(colspan >= 1);
      assert(rowspan >= 1);
      assert(Math.min(columns.length - 1, cell + colspan - 1) === cell + colspan - 1);
      var cellStyles = [];
      var cellCss = ["slick-cell", "l" + cell, "r" + (cell + colspan - 1)];
      if (m.cssClass) {
        cellCss.push(m.cssClass);
      }
      if (colspan > 1) {
        cellCss.push("colspan");
        cellCss.push("colspan" + colspan);
      }
      if (rowspan > 1) {
        cellCss.push("rowspan");
        cellCss.push("rowspan" + rowspan);
      }
      if (columnMetadata && columnMetadata.cssClass) {
        cellCss.push(columnMetadata.cssClass);
      }
      if (columnMetadata && columnMetadata.transparent) {
        cellCss.push("slick-transparent");
      }
      if (row === activeRow && cell === activeCell) {
        cellCss.push("active");
      }

      appendCellCssStylesToArray(cellCss, cellCssClasses, row, m);

      var cellHeight = getCellHeight(row, rowspan);
      if (cellHeight !== options.rowHeight - cellHeightDiff) {
        cellStyles.push("height:" + cellHeight + "px");
      }

      // if there is a corresponding row (if not, this is the Add New row or this data hasn't been loaded yet)
      var info = __extend({}, options.formatterOptions, m.formatterOptions, {
        cellCss: cellCss,
        cellStyles: cellStyles,
        html: "",
        attributes: {
          // Make every cell keyboard-focusable as per W3C spec ( https://html.spec.whatwg.org/#focus-management-apis ); 
          // without us setting a valid tabindex DOM node attribute any `takeFocus=true` config option for
          // setActiveCell() et al will fail to deliver in Chrome 38.x and upwards, at least, as calling `.focus()`
          // on a node which doesn't have this apparently keeps the focus (document.activeElement) stuck at BODY
          // level :-(  -- added assertions elsewhere in the code to catch this problem.
          tabindex: 0    
        },
        colspan: colspan,
        rowspan: rowspan,
        cellHeight: cellHeight,
        rowMetadata: rowMetadata,
        columnMetadata: columnMetadata
      });
      if (rowDataItem) {
        var value = getDataItemValueForColumn(rowDataItem, m, rowMetadata, columnMetadata);
        // allow the formatter to edit the outer cell's DIV CSS as well.
        // 
        // I/F: function formatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo)
        info.html = getFormatter(row, cell)(row, cell, value, m, rowDataItem, info);
      }
      return info;
    }

    function patchupCellAttributes(metaData, info, role, ariaRefID) {
      assert(metaData);
      assert(info);
      assert(role);
      metaData.role = role;
      // backwards compatible: use .toolTip when the corresponding DOM attribute isn't set yet
      if (info.toolTip && metaData.title === undefined) {
        metaData.title = metaData["data-title"] = info.toolTip;
      }
      assert(!metaData.style);
      if (info.cellStyles && info.cellStyles.length) {
        metaData.style = info.cellStyles.join("; ") + ";";
      } else if (info.rowStyles && info.rowStyles.length) {
        metaData.style = info.rowStyles.join("; ") + ";";
      }

      assert(!metaData.class);
      if (info.cellCss && info.cellCss.length) {
        metaData.class = info.cellCss.join(" ");
      } else if (info.rowCss && info.rowCss.length) {
        metaData.class = info.rowCss.join(" ");
      }

      if (info.attributes.tabindex != null) {
        metaData.tabindex = info.attributes.tabindex; 
      }

      if (ariaRefID) {
        metaData["aria-describedby"] = ariaRefID;
      }
    }

    function appendCellHtml(stringArray, row, cell, rowMetadata, columnMetadata, rowDataItem) {
      assert(row >= 0);
      assert(cell >= 0);
      var m = columns[cell];
      assert(m);
      // I/F: function mkCellHtml(row, cell, rowMetadata, columnMetadata, rowDataItem)
      var info = mkCellHtml(row, cell, rowMetadata, columnMetadata, rowDataItem);
      
      stringArray.push("<div");

      var metaData = getAllCustomMetadata(null, columnMetadata, info) || {};
      patchupCellAttributes(metaData, info, "gridcell", mkSaneId(m, cell, row));
      appendMetadataAttributes(stringArray, row, cell, metaData, m, rowDataItem, info);

      stringArray.push(">");

      stringArray.push(info.html);

      stringArray.push("</div>");

      rowsCache[row].cellRenderQueue.push(cell);
    }

    function appendMetadataAttributes(stringArray, row, cell, data, columnDef, rowDataItem, cellMetaInfo) {
      if (data) {
        for (var attr in data) {
          assert(data.hasOwnProperty(attr));
          // I/F: function formatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo)
          stringArray.push(" " + attr + "='" + processHtmlEntities.encode(data[attr]) + "'");
        }
      }
    }

    // Note: this function will replace (add/update/delete) *all* custom attributes
    function updateElementHtml($el, info) {
      assert(info);
      var metaData = info.attributes;
      assert(metaData);
      if (info.toolTip && metaData.title === undefined) {
        metaData.title = metaData["data-title"] = info.toolTip;
      }
      assert(!metaData.style);
      if (info.cellStyles && info.cellStyles.length) {
        metaData.style = info.cellStyles.join("; ") + ";";
      } else if (info.rowStyles && info.rowStyles.length) {
        metaData.style = info.rowStyles.join("; ") + ";";
      } else {
        metaData.style = null;
      }
      assert(!metaData.class);
      if (info.cellCss && info.cellCss.length) {
        metaData.class = info.cellCss.join(" ");
      } else if (info.rowCss && info.rowCss.length) {
        metaData.class = info.rowCss.join(" ");
      } else {
        metaData.class = null;
      }

      // Make sure we nuke all existing *non-standard* attributes:
      // when we execute this function we are updating *all* attributes
      // which in particular circumstances means we need to *destroy* a
      // few of them, e.g. when clearing a cell which previously showed a
      // value tooltip.
      var attrList = $el[0].attributes;
      for (var i = 0, len = attrList.length; i < len; i++) {
        var attr = attrList[i].name;
        if (metaData[attr] === undefined && !slickgridStandardCellAttributes[attr]) {
          // add this previously existing attribute and make it go away
          // in the subsequent loop!
          metaData[attr] = null;
        }
      } 
      
      // apply the new attributes:
      for (var attr in metaData) {
        assert(metaData.hasOwnProperty(attr));
        var val = metaData[attr];
        $el.attr(attr, val);
      }
      if (info.html != null) {
        $el.html(info.html);
      }
    }

    function cleanUpRows(rangeToKeep) {
      assert(cellSpans.length <= getDataLengthIncludingAddNew());

      // Pull up the lower bound while we're at it.
      for (var row = 0, endrow = rowsCache.length; row < endrow; row++) {
        if (rowsCache[row]) {
          break;
        }
      }
      //assert(row === rowsCacheStartIndex);
      assert(rowsCache[row] ? row >= rowsCacheStartIndex : true);
      if (!rowsCache[row]) {
        // rowsCache turns out to be completely empty!
        rowsCacheStartIndex = MAX_INT;  
        rowsCache = [];
        endrow = 0;  
      } else {
        rowsCacheStartIndex = row;
      }

      assert(endrow === rowsCache.length);
      for (row = rowsCacheStartIndex; row < endrow; row++) {
        var cacheEntry = rowsCache[row];
        // flush any pending row render queue to cache first:
        if (cacheEntry && cacheEntry.cellRenderQueue.length) {
          assert(0, "should not be necessary any more");
          ensureCellNodesInRowsCache(row);
        }
        if (row !== activeRow) {
          if (row < rangeToKeep.top) {
            // do not remove rows with rowspanned cells overlapping rangeToKeep
            if (cellSpans[row] && row + cellSpans[row].maxRowSpan >= rangeToKeep.top) {
              if (cacheEntry) {
                cleanUpCells(rangeToKeep, row);
              }
              continue;
            }
          } else if (row < rangeToKeep.bottom) {
            if (cacheEntry) {
              cleanUpCells(rangeToKeep, row);
            }
            continue;
          }
          if (cacheEntry) {
            assert(row !== activeRow);
            removeRowFromCache(row);
          }
        } else {
          if (cacheEntry) {
            cleanUpCells(rangeToKeep, row);
          }
        }
      }
      // and clip off the tail end of the cache index array itself:
      assert(endrow === rowsCache.length);
      for (row = rowsCacheStartIndex; row < endrow; endrow--) {
        if (rowsCache[endrow]) {
          endrow++;
          break;
        }
      }
      rowsCache.length = endrow;
    }

    function updateAllDirtyCells(rangeToUpdate, checkIfMustAbort) {
      var dataLength = getDataLength();

      // Do not update rows outside the specified range; when there's cells which are 
      // col/rowspanning and overlapping the specified range, than updateCell itself
      // will pick them up; after all, all the grid coordinates (cells) these 
      // row/colspanning nodes overlap are each flagged as "dirty" to ensure that we catch
      // them during this update process. 
      for (var row = Math.max(rowsCacheStartIndex, rangeToUpdate.top), endrow = Math.min(rowsCache.length - 1, rangeToUpdate.bottom - 1); row <= endrow; row++) {
        var cacheEntry = rowsCache[row];
        if (cacheEntry) {
          // flush any pending row render queue to cache first:
          if (cacheEntry.cellRenderQueue.length) {
            assert(0, "should not be necessary any more");
            ensureCellNodesInRowsCache(row);
          }
          var cellCache = cacheEntry.cellNodesByColumnIdx;
          var dirtyFlags = cacheEntry.dirtyCellNodes;
          // Before we update any dirty cells in the row, update the row itself!
          if (cacheEntry.isDirty) {
            updateRowInternal(row, dataLength);
          }
          var colspan;
          for (var cell = cacheEntry.cellNodesByColumnStart, len = Math.min(cellCache.length, columns.length); cell < len; cell += colspan) {
            colspan = 1;
            var spans = getSpans(row, cell);
            var spanRow = row;
            if (spans) {
              assert(row >= spans.row);
              assert(cell === spans.cell);
              spanRow = spans.row;
              colspan = spans.colspan;
            }
            if (columnPosLeft[cell + colspan] > rangeToUpdate.leftPx) {
              if (columnPosLeft[cell] >= rangeToUpdate.rightPx) {
                // All columns to the right are outside the range.
                break;
              }
            }
            if (spanRow === row && cellCache[cell] && dirtyFlags[cell]) {
              updateCellInternal(row, cell, cacheEntry, cellCache[cell]);
              assert(!dirtyFlags[cell]);
            } else if (spanRow < row) {
              // We're looking at a rowspanning cell which starts at a row above us 
              var cacheEntry2 = rowsCache[spanRow];
              if (cacheEntry2) {
                // flush any pending row render queue to cache first:
                if (cacheEntry2.cellRenderQueue.length) {
                  assert(0, "should not be necessary any more");
                  ensureCellNodesInRowsCache(spanRow);
                }
                var cellCache2 = cacheEntry2.cellNodesByColumnIdx;
                var dirtyFlags2 = cacheEntry2.dirtyCellNodes;

                if (cellCache2[cell] && dirtyFlags2[cell]) {
                  // Before we update any dirty cells in the row, update the row itself!
                  if (cacheEntry2.isDirty) {
                    updateRowInternal(spanRow, dataLength);
                  }

                  updateCellInternal(spanRow, cell, cacheEntry2, cellCache2[cell]);
                  assert(!dirtyFlags2[cell]);
                }
              }
            }
          }

          // Kill all cells which are still around after the column count has changed:
          for (var cellToRemove = cellCache.length - 1; cellToRemove >= columns.length; cellToRemove--) {
            var node = cellCache[cellToRemove];
            if (node) {
              cacheEntry.rowNode.removeChild(node);
              delete cellCache[cellToRemove];

              if (dirtyFlags[cellToRemove]) {
                dirtyFlags[cellToRemove] = false;
                cacheEntry.isDirty--;
                assert(cacheEntry.isDirty >= 0);
              }

              //totalCellsRemoved++;
            }
          }

          // We cannot yet flag the row as updated completely, as we only updated the *visible* cells.
          assert(cacheEntry.isDirty >= 0);
        }

        if (checkIfMustAbort && checkIfMustAbort()) {
          break;
        }
      }
    }


    function invalidate() {
      invalidateAllRows();
      updateRowCount();
      trigger(self.onInvalidate);
      render();
    }

    // This removes rows from cache. Would be needed if we were changing rows.
    function invalidateAllRows() {
      if (currentEditor) {
        assert(getEditorLock().isActive());

        makeActiveCellNormal();
        
        assert(!currentEditor);
        assert(!getEditorLock().isActive());
      }

      // for (var row = rowsCacheStartIndex, endrow = rowsCache.length; row < endrow; row++) {
      //   if (rowsCache[row]) {
      //     removeRowFromCache(row);
      //   }
      // }
      // rowsCache = [];
      
      // flag all cached cells as dirty:
      for (var row = rowsCacheStartIndex, len = rowsCache.length; row < len; row++) {
        var cacheEntry = rowsCache[row];
        if (!cacheEntry) {
          continue;
        }
        var cellNodes = cacheEntry.cellNodesByColumnIdx;
        var dirtyFlaggingArray = cacheEntry.dirtyCellNodes;
        for (var cell = cacheEntry.cellNodesByColumnStart, colCount = cellNodes.length; cell < colCount; cell++) {
          if (cellNodes[cell] && !dirtyFlaggingArray[cell]) {
            dirtyFlaggingArray[cell] = true;
            assert(cacheEntry.isDirty >= 0);
            cacheEntry.isDirty++;
          }
        }
      }

      rowPositionCache = [];
      // rowsCacheStartIndex = MAX_INT;
    }

    function removeRowFromCache(row) {
      var cacheEntry = rowsCache[row];
      assert(cacheEntry);
      assert(cacheEntry.rowNode);

      if (row === activeRow && elementHasFocus(cacheEntry.rowNode)) {
        focusMustBeReacquired = {
          row: activeRow,
          cell: activeCell
        };
        // As the active cell is about to loose focus, we (temporarily) switch focus to one of the sinks
        // so that the node removal from the DOM does not drop focus, which would consequently 
        // loose us keyboard events, at least for the (very) short time period between DOM
        // cell removal and re-render. That would cause symptoms of "erratic keyboard behaviour"
        // and we cannot have that!

        //console.log("focus fixup exec (cache remove row) START: ", document.activeElement);
        movingFocusLock++;
        // We MAY see a sequence of focusout+focusin, where by the time focusin fires, document.activeElement is BODY.
        // We MAY also see only a focusin, in which case we are to provide the original focused node.
        movingFocusLockData[movingFocusLock - 1] = {
          newNode: $focusSink[0],
          oldNode: activeCellNode
        };
        $focusSink[0].focus();
        assert(document.activeElement === $focusSink[0]);
        movingFocusLock--;
        if (!movingFocusLock) {
          movingFocusLockData = [];
        }
        //console.log("focus fixup exec (cache remove row) END: ", document.activeElement);
      }

      if (rowNodeFromLastMouseWheelEvent === cacheEntry.rowNode) {
        cacheEntry.rowNode.style.display = "none";
        zombieRowNodeFromLastMouseWheelEvent = rowNodeFromLastMouseWheelEvent;
      } else {
        $canvas[0].removeChild(cacheEntry.rowNode);
        // cacheEntry.rowNode.classList.add("destroyed");
        // deletedRowsCache[row] = rowsCache[row];
        // if (deletedRowsCacheStartIndex > row) {
        //   deletedRowsCacheStartIndex = row;
        // }
      }

      rowsCache[row] = undefined;
      postProcessedRows[row] = undefined;
      if (rowsCacheStartIndex === row) {
        rowsCacheStartIndex++;
      }
      renderedRows--;
      counter_rows_removed++;
    }

    function invalidateRows(rows) {
      var i, rl, row, endrow, c, r, span, rowspan, colspan;
      if (!rows || !rows.length) {
        return;
      }
      rows.sort(function (a, b) { 
        return a - b; 
      });
      vScrollDir = 0;
      var dataLength = getDataLength();
      var columnCount = columns.length;
      var invalidateTopFrom = dataLength;
      var invalidateFrom = dataLength;
      var invalidateTo = -1;
      // var intersectingCells = [];
      // var intersectingCellsRowStartIndex = MAX_INT;
      // var intersectingCellsColStartIndex = MAX_INT;
      for (i = 0, rl = rows.length; i < rl; i++) {
        row = rows[i];
        if (currentEditor && activeRow === row) {
          assert(getEditorLock().isActive());

          makeActiveCellNormal();
          
          assert(!currentEditor);
          assert(!getEditorLock().isActive());
        }
        // if (rowsCache[row]) {
        //   removeRowFromCache(row);
        // }
        
        // flag all cached cells as dirty:
        var cacheEntry = rowsCache[row];
        if (cacheEntry) {
          var cellNodes = cacheEntry.cellNodesByColumnIdx;
          var dirtyFlaggingArray = cacheEntry.dirtyCellNodes;
          for (var cell = cacheEntry.cellNodesByColumnStart, colCount = cellNodes.length; cell < colCount; cell++) {
            if (cellNodes[cell] && !dirtyFlaggingArray[cell]) {
              dirtyFlaggingArray[cell] = true;
              assert(cacheEntry.isDirty >= 0);
              cacheEntry.isDirty++;
            }
          }
        }
        
        var spanRow = cellSpans[row];
        var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, false);
        // if the row height changes, all its successors should invalidate their style.top positions
        if (rowMetadata && rowMetadata.height && rowMetadata.height - cellHeightDiff !== getRowHeight(row)) {
          rowPositionCache[row] = undefined;
          if (row < invalidateTopFrom) {
            invalidateTopFrom = row + 1;
            invalidateTo = dataLength - 1;
          }
        }

        if (spanRow) {
          // invalidate (possibly now old = removed) rowspan intersecting cells
          for (c = 0; c < columnCount; c += colspan) {
            colspan = 1;
            span = spanRow[c];
            if (span) {
              colspan = span.colspan;
              r = span.row;
              if (r !== row) {
                // (intersectingCells[r] || (intersectingCells[r] = []))[span.cell] = true;
                // intersectingCellsRowStartIndex = Math.min(intersectingCellsRowStartIndex, r);
                // intersectingCellsColStartIndex = Math.min(intersectingCellsColStartIndex, span.cell);
                invalidateCellSpan(span);
              }
            }
          }

          // Blow away any cellSpans for this invalidated row: if they should remain or change,
          // then they will be recalculated next.
          // 
          // However, we MUST invalidate all cells which belonged to those old spans, as we just did.
          spanRow = cellSpans[row] = undefined;
        }

        // check changes in row/colspans
        if (rowMetadata) {
          for (c = 0; c < columnCount; c += colspan) {
            var columnMetadata = rowMetadata.columns && (rowMetadata.columns[columns[c].id] || rowMetadata.columns[c]);
            colspan = 1;
            if (columnMetadata) {
              rowspan = columnMetadata.rowspan || 1;
              colspan = columnMetadata.colspan || 1;
              if (rowspan > dataLength - row) {
                rowspan = dataLength - row;
              }
              if (colspan === "*") {
                colspan = columnCount - c;
              }
              span = spanRow && spanRow[c];
              var oldRowspan = (span && span.rowspan) || 1;
              var oldColspan = (span && span.colspan) || 1;
              if (oldRowspan !== rowspan || oldColspan !== colspan) {
                // if spans change, fix pointers to span head cell
                span = (rowspan > 1 || colspan > 1) ? {
                  row: row, 
                  cell: c, 
                  rowspan: rowspan, 
                  colspan: colspan
                } : undefined;
                for (var rs = row, rsu = row + Math.max(rowspan, oldRowspan); rs < rsu; rs++) {
                  var maxRowSpan = rowspan + row - rs;
                  var cellSpanRow = cellSpans[rs];
                  if (cellSpanRow) {
                    if (maxRowSpan > cellSpanRow.maxRowSpan) {
                      cellSpanRow.maxRowSpan = maxRowSpan;
                    }
                  } else {
                    cellSpanRow = cellSpans[rs] = {
                      maxRowSpan: maxRowSpan
                    };
                  }
                  for (var cs = c, csu = c + Math.max(colspan, oldColspan); cs < csu; cs++) {
                    if (!span || rs >= row + rowspan || cs >= c + colspan) {
                      cellSpans[rs][cs] = undefined;
                    } else {
                      cellSpans[rs][cs] = span;
                    }
                  }
                }
                // adjust invalidate range
                invalidateFrom = Math.min(invalidateFrom, row);
                invalidateTo = Math.max(invalidateTo, row + oldRowspan - 1, row + rowspan - 1);
              }
            }
          }
        }
      }

      for (row = Math.min(invalidateFrom, invalidateTopFrom); row <= invalidateTo; row++) {
        if (row >= invalidateTopFrom) {
          rowPositionCache[row].top = undefined;
        }
        if (currentEditor && activeRow === row) {
          assert(getEditorLock().isActive());

          makeActiveCellNormal();

          assert(!currentEditor);
          assert(!getEditorLock().isActive());
        }

        // if (rowsCache[row]) {
        //   removeRowFromCache(row);
        // }
        
        // flag all cached cells as dirty:
        var cacheEntry = rowsCache[row];
        if (cacheEntry) {
          var cellNodes = cacheEntry.cellNodesByColumnIdx;
          var dirtyFlaggingArray = cacheEntry.dirtyCellNodes;
          for (var cell = cacheEntry.cellNodesByColumnStart, colCount = cellNodes.length; cell < colCount; cell++) {
            if (cellNodes[cell] && !dirtyFlaggingArray[cell]) {
              dirtyFlaggingArray[cell] = true;
              assert(cacheEntry.isDirty >= 0);
              cacheEntry.isDirty++;
            }
          }
        }
      }
    }

    function invalidateRow(row) {
      invalidateRows([row]);
    }

    function invalidateCellSpan(span) {
      assert(span);
      var row = span.row;
      var cell = span.cell;
      var endRow = row + span.rowspan;
      var endCell = cell + span.colspan;
      if (currentEditor && activeRow >= row && activeRow < endRow && activeCell >= cell && activeCell < endCell) {
        assert(getEditorLock().isActive());

        makeActiveCellNormal();

        assert(!currentEditor);
        assert(!getEditorLock().isActive());
      }

      for (var r = row; r < endRow; r++) {
        var cacheEntry = rowsCache[r];
        if (cacheEntry) {
          var cellNodes = cacheEntry.cellNodesByColumnIdx;
          var dirtyFlaggingArray = cacheEntry.dirtyCellNodes;
          for (var c = cell; c < endCell; c++) {
            if (cellNodes[c] && !dirtyFlaggingArray[c]) {
              dirtyFlaggingArray[c] = true;
              assert(cacheEntry.isDirty >= 0);
              cacheEntry.isDirty++;
            }
          }
        }
      }
    }

    // Invalidate the entire row/colspan area covered by the cell
    function invalidateCell(row, cell) {
      // Get the old row/colspan for this cell:
      var spanRow = cellSpans[row];
      var spanCell = spanRow && spanRow[cell];
      var oldRowspan = (spanCell && spanCell.rowspan) || 1;
      var oldColspan = (spanCell && spanCell.colspan) || 1;

      // Get the new row/colspan for this cell:
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, false);
      var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[columns[cell].id] || rowMetadata.columns[cell]);
      var rowspan = (columnMetadata && columnMetadata.rowspan) || 1;
      var colspan = (columnMetadata && columnMetadata.colspan) || 1;

      var span = {
        row: row, 
        cell: cell, 
        rowspan: Math.max(rowspan, oldRowspan), 
        colspan: Math.max(colspan, oldColspan)
      };
      invalidateCellSpan(span);
    }


    function invalidateColumns(cols) {
      var r, c, i, lr, lc, col, spans, rowspan, colspan, rr, cc, node;
      if (!cols || !cols.length) {
        return;
      }
      cols.sort(function (a, b) { 
        return a - b; 
      });
      // flag all cached cells as dirty:
      var colcnt = cols.length;
      for (r = rowsCacheStartIndex, lr = rowsCache.length; r < lr; r++) {
        var cacheEntry = rowsCache[r];
        if (cacheEntry) {
          var cellNodes = cacheEntry.cellNodesByColumnIdx;
          var dirtyFlaggingArray = cacheEntry.dirtyCellNodes;
          for (i = 0; i < colcnt; i++) {
            c = cols[i];
            node = cellNodes[c];
            if (node) {
              if (!dirtyFlaggingArray[c]) {
                if (currentEditor && activeRow === r && activeCell === c) {
                  assert(getEditorLock().isActive());

                  makeActiveCellNormal();

                  assert(!currentEditor);
                  assert(!getEditorLock().isActive());
                }
          
                dirtyFlaggingArray[c] = true;
                assert(cacheEntry.isDirty >= 0);
                cacheEntry.isDirty++;
              }
            } else {
              // When there's no node at the given coordinate, we MAY be looking at a row/colspanning node.
              // (Otherwise, we're just looking at a node which hasn't been cached/rendered yet...)
              spans = getSpans(r, c);
              if (spans) {
                invalidateCellSpan(spans);
              }
            }
          }
        }
      }
    }

    function invalidateColumn(cell) {
      invalidateColumns([cell]);
    }

    function updateCell(row, cell) {
      var cellNode = getCellNode(row, cell);
      if (!cellNode) {
        return;
      }

      var cacheEntry = rowsCache[row];
      assert(cacheEntry);
      assert(cacheEntry.cellNodesByColumnIdx[cell]);

      // if the cell has other coordinates because of row/cell span, update that cell (which will invalidate this cellNode)
      var rowspan = 1;
      var spans = getSpans(row, cell);
      assert(spans ? spans.colspan >= 1 : true);
      if (spans) {
        rowspan = spans.rowspan;

        if (spans.row !== row || spans.cell !== cell) {
          //updateCellInternal(spans.row, spans.cell, cacheEntry, cellNode);
          row = spans.row;
          cell = spans.cell;
          cellNode = getCellNode(row, cell);
          if (!cellNode) {
            return;
          }

          cacheEntry = rowsCache[row];
          assert(cacheEntry);
          assert(cacheEntry.cellNodesByColumnIdx[cell]);
        }
      }

      updateCellInternal(row, cell, cacheEntry, cellNode);
    }

    function updateCellInternal(row, cell, cacheEntry, cellNode) {
      var m = columns[cell],
          d = getDataItem(row);
      assert(m);
      assert(cacheEntry === rowsCache[row]);
      assert(cacheEntry);
      assert(cacheEntry.cellNodesByColumnIdx[cell]);

      // if the cell has other coordinates because of row/cell span, update that cell (which will invalidate this cellNode)
      var rowspan = 1;
      var spans = getSpans(row, cell);
      assert(spans ? spans.colspan >= 1 : true);
      if (spans) {
        rowspan = spans.rowspan;

        // All DOM nodes which are now covered by this row/colspan are nuked by cleanUpRows()/cleanUpCells() later on!

        assert(spans.row === row);
        assert(spans.cell === cell);
      }

      if (cacheEntry.dirtyCellNodes[cell]) {
        cacheEntry.dirtyCellNodes[cell] = false;
        cacheEntry.isDirty--;
        assert(cacheEntry.isDirty >= 0);
      }

      if (currentEditor && activeRow === row && activeCell === cell && d) {
        assert(getEditorLock().isActive());
        currentEditor.loadValue(d);
      } else {
        var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);
        // look up by id, then index
        var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[m.id] || rowMetadata.columns[cell]);

        var cellHeight = getCellHeight(row, rowspan);
        if (cellHeight !== options.rowHeight - cellHeightDiff) {
          cellNode.style.height = cellHeight + "px";
        } else if (cellNode.style.height) {
          cellNode.style.height = "";
        }

        // I/F: function mkCellHtml(row, cell, rowMetadata, columnMetadata, rowDataItem)
        var info = mkCellHtml(row, cell, rowMetadata, columnMetadata, d);
        var $el = $(cellNode);
        assert(info.html != null);
        updateElementHtml($el, info);
        invalidatePostProcessingResults(row, cell);
      }
    }

    function updateRow(row) {
      var cacheEntry = rowsCache[row];
      if (!cacheEntry) {
        return;
      }

      ensureCellNodesInRowsCache(row);

      var dataLength = getDataLength();
      updateRowInternal(row, dataLength);

      var cellCache = cacheEntry.cellNodesByColumnIdx;
      var dirtyFlags = cacheEntry.dirtyCellNodes;
      for (var columnIdx = cacheEntry.cellNodesByColumnStart, end = Math.min(cellCache.length, columns.length); columnIdx < end; columnIdx++) {
        var node = cellCache[columnIdx];
        if (!node) {
          continue;
        }

        updateCellInternal(row, columnIdx, cacheEntry, node);
      }

      // Kill all cells which are still around after the column count has changed:
      for (var cellToRemove = cellCache.length - 1; cellToRemove >= columns.length; cellToRemove--) {
        var node = cellCache[cellToRemove];
        if (node) {
          cacheEntry.rowNode.removeChild(node);
          delete cellCache[cellToRemove];

          if (dirtyFlags[cellToRemove]) {
            dirtyFlags[cellToRemove] = false;
            cacheEntry.isDirty--;
            assert(cacheEntry.isDirty >= 0);
          }

          //totalCellsRemoved++;
        }
      }

      // flag the row as updated completely:
      assert(cacheEntry.isDirty === 0);
      cacheEntry.dirtyCellNodes = [];
      cacheEntry.isDirty = 0;

      invalidatePostProcessingResults(row, null);
    }

    function updateRowInternal(row, dataLength) {
      var cacheEntry = rowsCache[row];
      assert(cacheEntry);
      assert(cacheEntry.isDirty > 0);
      assert(cacheEntry.rowNode);

      var info = mkRowHtml(row, dataLength);
      assert(info.html == null);
      updateElementHtml($(cacheEntry.rowNode), info);
    }

    function getCellHeight(row, rowspan) {
      var cellHeight = options.rowHeight;
      if (rowspan > 1) {
        var rowSpanBottomIdx = row + rowspan - 1;
        cellHeight = getRowBottom(rowSpanBottomIdx) - getRowTop(row);
      } else {
        var rowHeight = getRowHeight(row);
        if (rowHeight !== options.rowHeight - cellHeightDiff) {
          cellHeight = rowHeight;
        }
      }
      cellHeight -= cellHeightDiff;
      return cellHeight;
    }

    function getContainerWidth() {
      var rv = 0;
      if ($container.is(":visible")) {
        rv = parseFloat($.css($container[0], "width", true /* jQuery: Make numeric if forced or a qualifier was provided and val looks numeric */ ));
        assert(rv === $container.width());
      } else {
        console.debug("What's the width when this shit is hidden? It IS unpredictable!   ", $.css($container[0], "width", true));
      }
      return rv;
    }

    function getContainerHeight() {
      var rv = 0;
      if ($container.is(":visible")) {
        rv = parseFloat($.css($container[0], "height", true));
        assert(rv === $container.height());
      } else {
        console.debug("What's the height when this shit is hidden? It IS unpredictable!   ", $.css($container[0], "height", true));
      }
      return rv;
    }

    function getViewportHeight() {
      var rv = getContainerHeight();
      if (rv > 0) {
        var hh = parseFloat($.css($container[0], "paddingTop", true)) +
          parseFloat($.css($container[0], "paddingBottom", true)) +
          parseFloat($.css($headerScroller[0], "height")) + 
          getVBoxDelta($headerScroller) +
          (options.showTopPanel ? options.topPanelHeight + getVBoxDelta($topPanelScroller) : 0) +
          (options.showFooterRow ? options.footerRowHeight + getVBoxDelta($footerRowScroller) : 0) +
          (options.showHeaderRow ? options.headerRowHeight + getVBoxDelta($headerRowScroller) : 0);
        assert(hh > 0);
        rv -= hh;
      }
      return Math.max(0, rv);
    }

    function getViewportWidth() {
      var rv = getContainerWidth();
      return rv;
    }

    // Returns the size of the content area
    function getContentSize() {
      var canvasWidth = $canvas.outerWidth(),
          canvasHeight = $canvas.height(),
          hasVScroll = canvasHeight > $viewport.height(),
          contentWidth = canvasWidth + (hasVScroll ? scrollbarDimensions.width : 0),
          hasHScroll = contentWidth > $viewport.outerWidth(),
          contentHeight = canvasHeight + (hasHScroll ? scrollbarDimensions.height : 0);
      return { 
        width: contentWidth, 
        height: contentHeight 
      };
    }

    // Returns the size of the visible area, i.e. between the scroll bars
    function getVisibleSize() {
      var width = $viewport.outerWidth(),
          height = $viewport.height(),
          hasHScroll = $canvas.outerWidth() > width - scrollbarDimensions.width,
          hasVScroll = $canvas.height() > height - scrollbarDimensions.height;
      width -= hasVScroll ? scrollbarDimensions.width : 0;
      height -= hasHScroll ? scrollbarDimensions.height : 0;
      return { 
        width: width, 
        height: height 
      };
    }

    // If you pass resizeOptions.width, the viewport width calculation can be skipped. 
    // This saves 15ms or so.
    function resizeCanvas(resizeOptions) {
      if (!initialized) { return; }

      var estimateH = MAX_INT;
      resizeOptions = resizeOptions || {};

      if (!resizeOptions.skipHeight) {
        if (options.autoHeight) {
          estimateH = getRowBottom(getDataLengthIncludingAddNew());
        } else {
          estimateH = getViewportHeight();
        }
        estimateH = Math.max(options.minHeight || 0, Math.min(options.maxHeight || MAX_INT, estimateH));
        var setHeight = (estimateH !== viewportH || options.minHeight === estimateH || options.maxHeight === estimateH);

        if (setHeight) {
          $viewport.height(estimateH);
          
          // Trouble is now we need to detect if we've been limited by any user styles on the *container*:
          var containerH = getContainerHeight();
          var actualViewportH = getViewportHeight();
          var viewportToContainerDeltaH = containerH - actualViewportH;

          if (viewportH !== actualViewportH) {
            // user CSS rules are apparently kicking in (min-height, max-height); compensate.
            viewportH = actualViewportH;
      
            $viewport.height(viewportH);
          }
        }
      }

      setViewportWidth(resizeOptions.width);

      //$viewport.css("overflow-y", (options.autoHeight && !clippedAutoSize) ? "auto" : "auto");

      if (options.forceFitColumns) {
        autosizeColumns();
      }

      //cleanUpAndRenderCells(getRenderedRange()); -- happens in render()
      updateRowCount();
      handleScroll(true);
      // Since the width has changed, force the render() to re-evaluate virtually rendered cells.
      lastRenderedScrollLeft = -1;
      render();
    }

    // If you pass it a width, that width is used as the viewport width. 
    // If you do not, it is calculated as normal.
    //
    // This is more performant if the canvas size is changed externally: 
    // then the width is already known so we can pass it in instead of recalculating.
    function setViewportWidth(width) {
      viewportW = width || getViewportWidth();
    }

    function updateRowCount() {
      if (!initialized) { 
        return false; 
      }

      cacheRowPositions();

      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      var numberOfRows = dataLengthIncludingAddNew;

      var oldViewportHasVScroll = viewportHasVScroll;
      viewportHasVScroll = (getRowBottom(numberOfRows - 1) > viewportH);

      makeActiveCellNormal();
      assert(!currentEditor);
      assert(!getEditorLock().isActive());

      // Kill the active cell when it sits in the row range which doesn't exist any more in the new data set.
      if (activeCellNode && activeRow >= dataLengthIncludingAddNew) {
        resetActiveCell();
      }

      // remove the rows that are now outside of the data range
      // this helps avoid redundant calls to .removeRow() when the size of the data decreased by thousands of rows
      for (var row = Math.max(rowsCacheStartIndex, dataLengthIncludingAddNew), endrow = rowsCache.length; row < endrow; row++) {
        if (rowsCache[row]) {
          removeRowFromCache(row);
        }
      }
      if (rowsCache.length > dataLengthIncludingAddNew) {
        assert(!rowsCache[dataLengthIncludingAddNew]);
        rowsCache.length = dataLengthIncludingAddNew;
      }

      if (cellSpans.length > dataLengthIncludingAddNew) {
        cellSpans.length = dataLengthIncludingAddNew;
      }

      // if (rowsCache.length > dataLengthIncludingAddNew) {
      //   rowsCache.length = dataLengthIncludingAddNew;
      // }

      var rowMax = getRowTop(dataLengthIncludingAddNew);
      var oldH = scrollableHeight;
      virtualTotalHeight = Math.max(rowMax, viewportH - scrollbarDimensions.height);
      if (virtualTotalHeight < maxSupportedCssHeight) {
        // just one page
        scrollableHeight = pageHeight = virtualTotalHeight;
        numberOfPages = 1;
        jumpinessCoefficient = 0;
      } else {
        // break into pages
        scrollableHeight = maxSupportedCssHeight;
        pageHeight = scrollableHeight / 100;
        numberOfPages = Math.floor(virtualTotalHeight / pageHeight);
        assert(numberOfPages > 1);
        jumpinessCoefficient = (virtualTotalHeight - scrollableHeight) / (numberOfPages - 1);
      }

      if (scrollableHeight !== oldH) {
        $canvas.css("height", scrollableHeight);
        scrollTop = $viewport[0].scrollTop;
      }

      var oldScrollTopInRange = (scrollTop + pageOffset <= virtualTotalHeight - viewportH);

      if (virtualTotalHeight === 0 || scrollTop === 0) {
        page = pageOffset = 0;
      } else if (oldScrollTopInRange) {
        // maintain virtual position
        scrollTo(scrollTop + pageOffset, null);
      } else {
        // scroll to bottom
        scrollTo(virtualTotalHeight - viewportH, null);
      }

      if (scrollableHeight !== oldH && options.autoHeight) {
        resizeCanvas();
      }

      if (options.forceFitColumns && oldViewportHasVScroll !== viewportHasVScroll) {
        autosizeColumns();
      }
      return updateCanvasWidth();
    }

    /*
     * WARNING: the returned object .bottom attribute points at the first row which is guaranteed to be NOT visible.
     * This was done in the vanilla SlickGrid (the one which doesn't deliver fractional position info). 
     * It is in line with other range info objects which would list the bottom as "one beyond"
     * in order to simplify height calculations (bottom - top without the obligatory +1 correction) and looping
     * over the visible row range (`for row = rv.top; row < rv.bottom; row++`).
     * 
     * However, do note that the fractional info is about the (partially visible bottom) row `.bottomVisible`.
     */ 
    function getVisibleRange(viewportTop, viewportLeft) {
      if (viewportTop == null) {
        viewportTop = scrollTop;
      }
      if (viewportLeft == null) {
        viewportLeft = scrollLeft;
      }

      var top = getRowWithFractionFromPosition(viewportTop + pageOffset, false);
      var bottom = getRowWithFractionFromPosition(viewportTop + pageOffset + viewportH, false); // test at the first INvisible pixel

      // Use a binary search alike algorithm to find the left and right columns, using 
      // linear estimation to produce the split/probe point:
      // 
      //getColumnWithFractionFromPosition(...)
      //  
      return {
        top: top.position,                          // the first visible row
        bottom: bottom.position + 1,                // first row which is guaranteed to be NOT visible, not even partly
        bottomVisible: bottom.position,             // the last visible row
        bottomVisibleFraction: bottom.fraction,     // the vertical fraction of visibility for the last visible row
        topInvisibleFraction: top.fraction,         // the vertical fraction of *IN*visibility for the first visible row
        bottomVisibleHeight: bottom.height,         // the row height for the last visible row
        topInvisibleHeight: top.height,             // the row height for the first visible row
        topPx: viewportTop,
        bottomPx: viewportTop + viewportH,
        leftPx: viewportLeft,
        rightPx: viewportLeft + viewportW    // availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW
      };
    }

    function getRenderedRange(viewportTop, viewportLeft) {
      var visibleRange = getVisibleRange(viewportTop, viewportLeft);
      var minBuffer = options.minBufferSize;
      var buffer = Math.min(options.maxBufferSize, Math.max(minBuffer, visibleRange.bottom - visibleRange.top));

      var range = {
        top: visibleRange.top,                      // the first visible row
        bottom: visibleRange.bottom,                // first row which is guaranteed to be NOT visible, not even partly
        leftPx: visibleRange.leftPx,
        rightPx: visibleRange.rightPx
      };

      if (vScrollDir === -1) {
        range.top -= buffer;
        range.bottom += minBuffer;
      } else if (vScrollDir === 1) {
        range.top -= minBuffer;
        range.bottom += buffer;
      } else {
        range.top -= minBuffer;
        range.bottom += minBuffer;
      }

      range.top = Math.max(0, range.top);
      range.bottom = Math.min(getDataLengthIncludingAddNew(), range.bottom);

      range.leftPx -= viewportW;
      range.rightPx += viewportW;

      assert(canvasWidth != null);
      range.leftPx = Math.max(0, range.leftPx);
      range.rightPx = Math.min(canvasWidth, range.rightPx);

      return range;
    }

    // Return the range of rows which are currently (at least partly) cached:
    // these will be the rows range which must be invalidated if userland code
    // does something drastic (e.g. when changing the grouping of the data:
    // examples/optimizing-dataview)
    // 
    // Also return other internal caching datums which may be relevant for 
    // userland/support code, e.g. when collapsing/expanding grouped rows.
    // (See the grouping examples, for instance.) 
    function getCachedRowRangeInfo() {
      // Side Effect: Pull up the lower bound while we're at it.
      for (var row = rowsCacheStartIndex, endrow = rowsCache.length; row < endrow; row++) {
        if (rowsCache[row]) {
          break;
        }
      }
      //assert(row === rowsCacheStartIndex);
      assert(rowsCache[row] ? row >= rowsCacheStartIndex : true);
      if (!rowsCache[row]) {
        // rowsCache turns out to be completely empty!
        rowsCacheStartIndex = MAX_INT;
        rowsCache = [];
        endrow = 0;  
      } else {
        rowsCacheStartIndex = row;
      }

      // Side Effect: ... and clip off the tail end of the cache index array itself:
      assert(endrow === rowsCache.length);
      for (row = rowsCacheStartIndex; row < endrow; endrow--) {
        if (rowsCache[endrow]) {
          endrow++;
          break;
        }
      }
      rowsCache.length = endrow;

      // Next to reporting the top/bottom rows' cache datums, we also report top/bottom of 
      // the rowspan/colspan cache: userland may want us to clear that cache as well so we
      // should provide the proper hints to enable userland code to accomplish that!
      // (See the grouping examples for instance.)
      var spanBottom = cellSpans.length;
      for (var spanTop = 0; spanTop < spanBottom; spanTop++) {
        if (cellSpans[spanTop]) {
          break;
        }
      }

      return {
        top: rowsCacheStartIndex,                   // the first cached row
        bottom: endrow,                             // first row which is guaranteed to be NOT cached, not even partly

        spanCacheTop: spanTop,
        spanCacheBottom: spanBottom
      };
    }

    function ensureCellNodesInRowsCache(row) {
      var cacheEntry = rowsCache[row];
      if (cacheEntry) {
        assert(cacheEntry.rowNode);
        var minCachedCellNodeIndex = cacheEntry.cellNodesByColumnStart;
        if (cacheEntry.cellRenderQueue.length) {
          var lastChild = cacheEntry.rowNode.lastChild;
          while (cacheEntry.cellRenderQueue.length) {
            assert(lastChild.className.indexOf("slick-cell") >= 0);
            if (lastChild.className.indexOf("slick-cell") >= 0) {
              var columnIdx = cacheEntry.cellRenderQueue.pop();
              assert(!cacheEntry.cellNodesByColumnIdx[columnIdx]);
              cacheEntry.cellNodesByColumnIdx[columnIdx] = lastChild;
              minCachedCellNodeIndex = Math.min(minCachedCellNodeIndex, columnIdx);
            }
            lastChild = lastChild.previousSibling;
          }
          cacheEntry.cellNodesByColumnStart = minCachedCellNodeIndex;
        }
      }
    }

    function cleanUpCells(range, row) {
      //var totalCellsRemoved = 0;
      var cacheEntry = rowsCache[row];
      assert(cacheEntry);

      var activeSpans = getSpans(activeRow, activeCell);
      if (activeSpans) {
        assert(activeSpans.row === activeRow);
        assert(activeSpans.cell === activeCell);
      }

      // Remove cells outside the range.
      // 
      // Also remove the cells inside the range which are overlapped by other row/colspanning cells. 
      // (The latter situation occurs when one or more cells had their row/colspan changed recently.)
      var minCachedCellNodeIndex = cacheEntry.cellNodesByColumnStart;
      var cellCache = cacheEntry.cellNodesByColumnIdx;
      var dirtyFlags = cacheEntry.dirtyCellNodes;
      for (var columnIdx = minCachedCellNodeIndex, end = cellCache.length; columnIdx < end; columnIdx++) {
        var node = cellCache[columnIdx];
        if (!node) {
          continue;
        }

        var colspan = 1;
        var spans = getSpans(row, columnIdx);
        if (spans) {
          assert(row === spans.row);
          colspan = spans.colspan;
          if (columnIdx !== spans.cell) {
            // Remove the cells inside the range which are overlapped by other row/colspanning cells. 
            for (var c = spans.cell + 1, ec = spans.cell + spans.colspan; c < ec; c++) {
              var olNode = cellCache[c];
              if (!olNode) {
                continue;
              }
              // We NEVER nuke the 'active cell', even when it's a cell which is now overlapped by another cell: 
              // when this happens, the userland code which changed the row/colspans that did this must be allowed
              // to change the active cell at their own pace; until that time, you will be stuck with a
              // (temporarily) overlapped~illegal active cell DOM node.
              if (row !== activeRow || columnIdx !== activeCell) {
                if (dirtyFlags[c]) {
                  dirtyFlags[c] = false;
                  cacheEntry.isDirty--;
                  assert(cacheEntry.isDirty >= 0);
                }

                cacheEntry.rowNode.removeChild(olNode);
                delete cellCache[c];
                if (postProcessedRows[row]) {
                  // array element delete vs. setting it to undefined (here: FALSE): http://jsperf.com/delete-vs-undefined-vs-null/19 
                  postProcessedRows[row][c] = false;
                }
                if (minCachedCellNodeIndex === c) {
                  minCachedCellNodeIndex++;
                }

                //totalCellsRemoved++;
              }
            }
            columnIdx = spans.cell + spans.colspan - 1;
            continue;
          }
        }
        assert(columnIdx < columns.length ? Math.min(columns.length, columnIdx + colspan) === columnIdx + colspan : true);
        if (columnIdx >= columns.length ||
            columnPosLeft[columnIdx] >= range.rightPx ||
            columnPosLeft[columnIdx + colspan] <= range.leftPx) {
          if (row !== activeRow || columnIdx !== activeCell) {
            if (dirtyFlags[columnIdx]) {
              dirtyFlags[columnIdx] = false;
              cacheEntry.isDirty--;
              assert(cacheEntry.isDirty >= 0);
            }

            cacheEntry.rowNode.removeChild(node);
            delete cellCache[columnIdx];
            if (postProcessedRows[row]) {
              // array element delete vs. setting it to undefined (here: FALSE): http://jsperf.com/delete-vs-undefined-vs-null/19 
              postProcessedRows[row][columnIdx] = false;
            }
            if (minCachedCellNodeIndex === columnIdx) {
              minCachedCellNodeIndex++;
            }

            //totalCellsRemoved++;
          }
        }
      }

      cacheEntry.cellNodesByColumnStart = minCachedCellNodeIndex;
      //cacheEntry.deletedCellNodesByColumnStart = minCachedDeletedCellNodeIndex;
    }

    function cleanUpAndRenderCells(range, mandatoryRange, checkIfMustAbort) {
      var cacheEntry;
      var minCachedCellNodeIndex;
      var stringArray = [];
      var processedRows = [];
      var cellsAdded;
      //var totalCellsAdded = 0;
      var colspan;
      var columnData;
      var i, ii;
      var rowMetadata;
      var columnMetadata;
      var d;

      assert(range.bottom > range.top || (range.bottom === range.top && getDataLength() === 0));
      for (var row = range.top, btm = range.bottom; row < btm; row++) {
        cacheEntry = rowsCache[row];
        if (!cacheEntry) {
          continue;
        }

        if (cacheEntry.cellRenderQueue.length) {
          assert(0, "should not be necessary any more");
          ensureCellNodesInRowsCache(row);
          assert(cacheEntry.cellRenderQueue.length === 0);
        }

        // if (!mandatoryRange) {
        //   cleanUpCells(range, row);
        // }

        // Render missing cells.
        cellsAdded = 0;

        rowMetadata = data.getItemMetadata && data.getItemMetadata(row, false);

        d = getDataItem(row);

        // TODO:  shorten this loop (index? heuristics? binary search?)
        for (i = 0, ii = columns.length; i < ii; i += colspan) {
          // Cells to the right are outside the range.
          if (columnPosLeft[i] >= range.rightPx) {
            break;
          }

          colspan = 1;
          var spanRow = row;
          var spans = getSpans(row, i);
          if (spans) {
            assert(i === spans.cell);
            colspan = spans.colspan;
            spanRow = spans.row;
          }

          // Already rendered.
          if (cacheEntry.cellNodesByColumnIdx[i]) {
            continue;
          }

          if (spanRow !== row) {
            continue;
          }

          assert(Math.min(ii, i + colspan) === i + colspan);
          if (columnPosLeft[i + colspan] > range.leftPx) {
            // look up by id, then index
            columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[columns[i].id] || rowMetadata.columns[i]);
            // I/F: function appendCellHtml(stringArray, row, cell, rowMetadata, columnMetadata, rowDataItem)
            appendCellHtml(stringArray, row, i, rowMetadata, columnMetadata, d);
            cellsAdded++;
          }
        }

        if (cellsAdded) {
          //totalCellsAdded += cellsAdded;
          processedRows.push(row);
        }

        if (checkIfMustAbort && checkIfMustAbort()) {
          break;
        }
      }

      if (!stringArray.length) {
        return;
      }

      var x = document.createElement("div");
      x.innerHTML = stringArray.join("");

      var processedRow;
      var node;
      while ((processedRow = processedRows.pop()) != null) {
        cacheEntry = rowsCache[processedRow];
        var columnIdx;
        minCachedCellNodeIndex = cacheEntry.cellNodesByColumnStart;
        while ((columnIdx = cacheEntry.cellRenderQueue.pop()) != null) {
          node = x.lastChild;
          cacheEntry.rowNode.appendChild(node);
          assert(!cacheEntry.cellNodesByColumnIdx[columnIdx]);
          cacheEntry.cellNodesByColumnIdx[columnIdx] = node;
          minCachedCellNodeIndex = Math.min(minCachedCellNodeIndex, columnIdx);
        }
        cacheEntry.cellNodesByColumnStart = minCachedCellNodeIndex;
      }
    }

    function renderRows(range, mandatoryRange, checkIfMustAbort) {
      var parentNode = $canvas[0],
          stringArray = [],
          rows = [],
          needToReselectCell = false,
          r, c, l, colspan,
          dataLength = getDataLength(),
          aborted = false;

      // collect rows with cell rowspans > 1 and overlapping the range top
      for (c = 0, l = columns.length; c < l; c += colspan) {
        colspan = 1;
        r = range.top;
        var spans = getSpans(r, c);
        if (spans) {
          assert(c === spans.cell);
          colspan = spans.colspan;
          r = spans.row;
        }
        assert(c + colspan <= columns.length);
        if (r < range.top && !rowsCache[r] && columnPosLeft[c + colspan] > range.leftPx && columnPosLeft[c] < range.rightPx) {
          rows.push(r);

          if (rowsCache[r]) {
            continue;
          }

          // collect not rendered range rows
          renderedRows++;

          // Create an entry right away so that appendRowHtml() can
          // start populating it.
          rowsCache[r] = {
            rowNode: null,

            // Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
            cellNodesByColumnIdx: [],

            // The lowest = starting index for the cellNodesByColumnIdx[] array above.
            cellNodesByColumnStart: MAX_INT,

            // Flags cell nodes as invalidated ("dirty") (indexed by column idx).
            dirtyCellNodes: [],

            // counter to signal if any cells in the row are "dirty" and thus require re-rendering/updating:
            isDirty: 0,

            // deletedCellNodesByColumnIdx: [],

            // // The lowest = starting index for the deletedCellNodesByColumnIdx[] array above.
            // deletedCellNodesByColumnStart: MAX_INT,

            // Column indices of cell nodes that have been rendered, but not yet indexed in
            // cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
            // end of the row.
            cellRenderQueue: []
          };
          rowsCacheStartIndex = Math.min(rowsCacheStartIndex, r);

          appendRowHtml(stringArray, r, range, dataLength);
          //assert(rowsCache[i].rowNode);
          if (activeCellNode && activeRow === r) {
            needToReselectCell = true;
          }
          counter_rows_rendered++;
        }

        if (checkIfMustAbort && checkIfMustAbort()) {
          aborted = true;
          break;
        }
      }

      // collect not rendered range rows
      if (!aborted) {
        assert(range.bottom > range.top || (range.bottom === range.top && getDataLength() === 0));
        for (r = range.top, l = range.bottom; r < l; r++) {
          if (rowsCache[r]) {
            continue;
          }
          renderedRows++;
          rows.push(r);

          // Create an entry right away so that appendRowHtml() can
          // start populating it.
          rowsCache[r] = {
            rowNode: null,

            // Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
            cellNodesByColumnIdx: [],

            // The lowest = starting index for the cellNodesByColumnIdx[] array above.
            cellNodesByColumnStart: MAX_INT,

            // Flags cell nodes as invalidated ("dirty") (indexed by column idx).
            dirtyCellNodes: [],

            // counter to signal if any cells in the row are "dirty" and thus require re-rendering/updating:
            isDirty: 0,

            // deletedCellNodesByColumnIdx: [],

            // // The lowest = starting index for the deletedCellNodesByColumnIdx[] array above.
            // deletedCellNodesByColumnStart: MAX_INT,

            // Column indices of cell nodes that have been rendered, but not yet indexed in
            // cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
            // end of the row.
            cellRenderQueue: []
          };
          rowsCacheStartIndex = Math.min(rowsCacheStartIndex, r);

          appendRowHtml(stringArray, r, range, dataLength);
          //assert(rowsCache[i].rowNode);
          if (activeCellNode && activeRow === r) {
            needToReselectCell = true;
          }
          counter_rows_rendered++;

          if (checkIfMustAbort && checkIfMustAbort()) {
            aborted = true;
            break;
          }
        }
      }

      if (rows.length === 0) {
        assert(!needToReselectCell); 
        return false; 
      }

      var x = document.createElement("div");
      x.innerHTML = stringArray.join("");

      var rowNodes = [];
      for (r = 0, l = rows.length; r < l; r++) {
        rowsCache[rows[r]].rowNode = parentNode.appendChild(x.firstChild);
        assert(rowsCache[rows[r]].rowNode);
        rowNodes.push(rowsCache[rows[r]]);
        // Safari 6.0.5 doesn't always render the new row immediately.
        // "Touching" the node's offsetWidth is sufficient to force redraw.
        if (isBrowser.safari605) {
          // this is a very costly operation in all browsers, so only run it for those which need it here:
          rowsCache[rows[r]].rowNode.offsetWidth;
        }
      }
      
      trigger(self.onRowsRendered, { 
        rows: rows, 
        nodes: rowNodes,
        mandatory: mandatoryRange,
        mustContinue: aborted 
      });

      if (needToReselectCell && !mandatoryRange) {
        activeCellNode = getCellNode(activeRow, activeCell, true);
        assert(activeCellNode);
        // When we need to reselect the active cell, it MAY also have lost focus previously,
        // which should then also be re-acquired, unless someone else has been taking over the focus
        // in the meantime:
        if (focusMustBeReacquired && 
            focusMustBeReacquired.row === activeRow && focusMustBeReacquired.cell === activeCell &&
            elementHasFocus($focusSink[0])
        ) {
          //console.log("focus fixup exec (render row) START: ", document.activeElement);
          movingFocusLock++;
          // We MAY see a sequence of focusout+focusin, where by the time focusin fires, document.activeElement is BODY.
          // We MAY also see only a focusin, in which case we are to provide the original focused node.
          movingFocusLockData[movingFocusLock - 1] = {
            oldNode: $focusSink[0],
            newNode: activeCellNode
          };
          activeCellNode.focus();
          assert(document.activeElement === activeCellNode);
          movingFocusLock--;
          if (!movingFocusLock) {
            movingFocusLockData = [];
          }
          //console.log("focus fixup exec (render row) END: ", document.activeElement);
        } 
        // focusMustBeReacquired is done / outdated: destroy it
        focusMustBeReacquired = false;
      }
      return needToReselectCell;
    }

    function startPostProcessing(renderDelay) {
      if (!options.enableAsyncPostRender) {
        return;
      }
      if (h_postrender) {
        clearTimeout(h_postrender);
      }
      h_postrender = setTimeout(asyncPostProcessRows, renderDelay > 0 ? renderDelay : options.asyncPostRenderDelay);
    }

    function invalidatePostProcessingResults(row, cell) {
      //assert(postProcessedRows[row]);
      if (cell == null) {
        postProcessedRows[row] = undefined;
      } else {
        if (postProcessedRows[row]) {
          postProcessedRows[row][cell] = false;
        }
      }
      postProcessFromRow = Math.min(postProcessFromRow, row);
      postProcessToRow = Math.max(postProcessToRow, row);
      startPostProcessing();
    }

    function invalidateAllPostProcessingResults() {
      postProcessedRows = [];
      postProcessToRow = 0;
      postProcessFromRow = MAX_INT;
      startPostProcessing();
    }

    // Return TRUE when the render is pending (but hasn't executed yet)
    function render(renderImmediately, renderDelay) {
      if (!initialized) { 
        return false; 
      }

      if (h_render) {
        clearTimeout(h_render);
        h_render = null;
      }

      if (options.forceSyncScrolling || renderImmediately || !options.asyncRenderDelay) {
        forcedRender(null, 0);
        return false;
      } else {
        // We may delay rendering the entire grid, but we cannot ever postpone updating the active & focused cells!
        if (activeCellNode) {
          forcedRenderCriticalCell(activeRow, activeCell);
        }

        h_render = setTimeout(function h_render_timer_f() {
          h_render = null;
          forcedRender(null, options.asyncRenderSlice);
        }, renderDelay > 0 ? renderDelay : options.asyncRenderDelay);
        return true;
      }
    }

    function isRenderPending() {
      return h_render != null;
    }

    function forcedRenderCriticalCell(row, cell) {
      var cellBoxInfo = getCellNodeBox(row, cell);
      // when the sought-after cell is outside the visible part of the row, we don't render a series but only that single node:
      if (cellBoxInfo) {
        // now construct the range object a la getRenderedRange() to be the minimal area that should get us, at least, the rendered cell DIV we seek here.
        var spanInfo = cellBoxInfo.spanInfo;
        var rendered = {
          top: spanInfo.row,
          bottom: spanInfo.row + spanInfo.rowspan,
          left: spanInfo.cell,
          right: spanInfo.cell + spanInfo.colspan,
          leftPx: cellBoxInfo.left,
          rightPx: cellBoxInfo.right
        };
        return forcedRender(rendered, 0);
      }
      return false;
    }

    function forcedRender(mandatoryRange, timeSlice) {
      var checkTheTime = null;
      if (timeSlice > 0) {
        if (!render_perftimer) {
          render_perftimer = Slick.PerformanceTimer();
        }
        render_perftimer.start();

        var signal_timeout = false;

        checkTheTime = function h_checkTheTime_f() {
          // Should we stop and postpone the execution of the pending tasks?
          if (!signal_timeout && timeSlice > 0) {
            var delta_t = render_perftimer.mark();
            if (delta_t >= timeSlice) {
              //break out;
              signal_timeout = true;
            }
          }
          return signal_timeout;
        }; 
      }

      //assert($(".slick-row").filter(":not(:visible)").length === 0);

      var visible = getVisibleRange();
      var rendered;
      if (mandatoryRange && typeof mandatoryRange === "object") {
        assert("top" in mandatoryRange);
        assert("bottom" in mandatoryRange);
        assert("left" in mandatoryRange);
        assert("right" in mandatoryRange);
        assert("leftPx" in mandatoryRange);
        assert("rightPx" in mandatoryRange);
        rendered = mandatoryRange;
      } else {
        rendered = getRenderedRange();
      }

      var e = new Slick.EventData();
      trigger(self.onRenderStart, {
        renderedArea: rendered, 
        visibleArea: visible,
        forced: mandatoryRange
      }, e);
      var handled = e.isHandled();
      if (handled) {
        // userland code decided the render is either already done or premature.
        // 
        // In either case, we don't bother with rendering again until the same userland
        // code deigns to call our render() API again.
        return false;
      }

      // Add new rows & missing cells in existing rows.
      // 
      // When a "mandatory" render is executed (which usually spans a tiny area)
      // then we must remember if a full render was pending in the meantime as 
      // otherwise the cell cache gets corrupted: the result being rows in the
      // viewport with lots of "missing cells". Then on the next non-mandatory
      // render() round, we should call cleanUpAndRenderCells() again to ensure 
      // those "missing cells" get rendered after all. 
      
      // if (lastRenderedScrollLeft !== scrollLeft || mandatoryRange || previousRenderWasIncomplete) {
      //   if (isRenderPending() && mandatoryRange) {
      //     previousRenderWasIncomplete = true;
      //   } else {
      //     previousRenderWasIncomplete = false;
      //   }
      cleanUpAndRenderCells(rendered, mandatoryRange, checkTheTime);
      // } else {
      //   assert(0, "I don't expect this to happen in a sane & efficient environment");
      // }

      // // only destroy the nodes which are not going to be replaced by new ones yet:
      // if (!mandatoryRange || 1) {
      //   $canvas.find(".destroyed").remove();
      // } else {
      //   deletedRowsCache[rendered.top].deletedCellNodesByColumnIdx[rendered.left].remove();
      // }

      // render missing rows
      var needToReselectCell = false;
      if (!checkTheTime || !checkTheTime()) {
        needToReselectCell = renderRows(rendered, mandatoryRange, checkTheTime);
      }

      // add all new rendered rows & their cells to the cache
      assert(rendered.bottom > rendered.top || (rendered.bottom === rendered.top && getDataLength() === 0));
      for (var row = rendered.top; row < rendered.bottom; row++) {
        var cacheEntry = rowsCache[row];
        if (cacheEntry && cacheEntry.cellRenderQueue.length) {
          //assert(0, "should not be necessary any more");
          assert(cacheEntry.rowNode);
          ensureCellNodesInRowsCache(row);
        }
      }

      if (!mandatoryRange) {
        // remove rows / columns no longer in the viewport
        if (!checkTheTime || !checkTheTime()) {
          cleanUpRows(rendered);
        }
      } 

      // update all cells which have been flagged as "dirty":
      if (!checkTheTime || !checkTheTime()) {
        // When we're executing a "forced render", we're only going to update the cells which
        // we want actually rendered right now.
        updateAllDirtyCells((mandatoryRange ? rendered : visible), checkTheTime);
      }

      // Make sure we inspect & post process the entire visible range where necessary:
      if (!checkTheTime || !checkTheTime()) {
        postProcessFromRow = Math.min(postProcessFromRow, visible.top);
        postProcessToRow = Math.max(postProcessToRow, Math.min(getDataLengthIncludingAddNew() - 1, visible.bottom - 1));
        startPostProcessing();
      }

      if (!mandatoryRange) {
        // only set these when we're completely done with the render process:
        lastRenderedScrollTop = scrollTop;
        lastRenderedScrollLeft = scrollLeft;
      } 

      trigger(self.onRenderEnd, {
        renderedArea: rendered, 
        visibleArea: visible,
        forced: mandatoryRange,
        needToReselectCell: needToReselectCell,
        mustContinue: checkTheTime && checkTheTime()
      });

      if (checkTheTime && checkTheTime()) {
        // fire the render action again at a later moment to continue the process:
        render(false, options.asyncRenderInterleave);
      }

      return needToReselectCell;
    }

    function handleHeaderRowScroll() {
      var scrollLeft = $headerRowScroller[0].scrollLeft;
      if (scrollLeft !== $viewport[0].scrollLeft) {
        $viewport[0].scrollLeft = scrollLeft;
      }
    }

    function handleFooterRowScroll() {
      var scrollLeft = $footerRowScroller[0].scrollLeft;
      if (scrollLeft !== $viewport[0].scrollLeft) {
        $viewport[0].scrollLeft = scrollLeft;
      }
    }

    function handleScrollEvent(e) {
      scrollTop = $viewport[0].scrollTop;
      scrollLeft = $viewport[0].scrollLeft;
      //console.log("handle SCROLL EVENT: ", this, arguments, document.activeElement);

      handleScroll();
    }

    function handleScroll(dontRenderYet) {
      var vScrollDist = Math.abs(scrollTop - prevScrollTop);
      var hScrollDist = Math.abs(scrollLeft - prevScrollLeft);
      var reRender = false;

      if (hScrollDist) {
        prevScrollLeft = scrollLeft;
        $headerScroller[0].scrollLeft = scrollLeft;
        $topPanelScroller[0].scrollLeft = scrollLeft;
        $headerRowScroller[0].scrollLeft = scrollLeft;
        $footerRowScroller[0].scrollLeft = scrollLeft;
        reRender = true;
      }

      if (vScrollDist && (vScrollDist > options.rowHeight)) {
        vScrollDir = prevScrollTop < scrollTop ? 1 : -1;
        prevScrollTop = scrollTop;

        // switch virtual pages if needed
        if (vScrollDist < viewportH) {
          reRender = scrollTo(scrollTop + pageOffset, null);
        } else {
          var oldOffset = pageOffset;
          if (scrollableHeight === viewportH) {
            // see https://github.com/mleibman/SlickGrid/issues/309
            page = numberOfPages - 1;
          } else {
            assert(pageHeight > 0);
            page = Math.min(numberOfPages - 1, Math.floor(scrollTop * ((virtualTotalHeight - viewportH) / (scrollableHeight - viewportH)) / pageHeight));
          }
          pageOffset = Math.round(page * jumpinessCoefficient);
          if (oldOffset !== pageOffset) {
            invalidateAllRows();
            reRender = true;
          }
        }
      }

      if (hScrollDist || vScrollDist) {
        // if (h_render) {
        //   clearTimeout(h_render);
        //   h_render = null;
        // }

        if (Math.abs(lastRenderedScrollTop - scrollTop) > 20 ||
            Math.abs(lastRenderedScrollLeft - scrollLeft) > 20) {
          reRender = true;
          if (!dontRenderYet) {
            render();
          }
          trigger(self.onViewportChanged, {});
        }
      } else {
        assert(!reRender);
      }

      trigger(self.onScroll, {
        scrollLeft: scrollLeft, 
        scrollTop: scrollTop
      });
      return reRender;
    }

    function asyncPostProcessRows() {
      h_postrender = null;

      if (!postprocess_perftimer) {
        postprocess_perftimer = Slick.PerformanceTimer();
      }
      postprocess_perftimer.start();
      var requeue = false;

      var dataLength = getDataLength();
      // Only process the rows in the "rendered" range, hence we clip the range accordingly.
      // 
      // We check this on every async round as the visual/rendered range may have changed between
      // individual async rounds!
      // 
      // Also note that we do *not* update the `postProcessFromRow` and `postProcessToRow`
      // globals until we have assured in the final async round (invocation of this function)
      // that all rows/cells have been properly updated. If we would update these globals earlier,
      // while we "clip" our activity to the "rendered" range (i.e. the row/cell DOM cache),
      // then we will run into race conditions which occur, for instance, when the grid is 
      // scrolled in various directions while the async postprocessing is still underway.
      var startRow = Math.max(rowsCacheStartIndex, postProcessFromRow);
      var endRow = Math.min(rowsCache.length - 1, postProcessToRow);
      var rowStep = 1;
      var row = startRow;
      if (vScrollDir < 0) {
        // flip the order in which the rows are updated:
        row = endRow;
        rowStep = -1;
      }
out:      
      for ( ; row >= startRow && row <= endRow; row += rowStep) {
        var cacheEntry = rowsCache[row];
        if (!cacheEntry || row >= dataLength) {
          continue;
        }

        if (!postProcessedRows[row]) {
          postProcessedRows[row] = [];
        }

        // As this is an sync process and the basic grid render itself may have been executed
        // again in between runs of ours, we MAY have
        // some new cells queued from the renderer: apply those before we continue working on
        // our own stuff:
        ensureCellNodesInRowsCache(row);

        var cellCache = cacheEntry.cellNodesByColumnIdx;
        for (var columnIdx = cacheEntry.cellNodesByColumnStart, end = Math.min(cellCache.length, columns.length); columnIdx < end; columnIdx++) {
          var m = columns[columnIdx],
              node = cellCache[columnIdx];
          assert(m);
          if (node && m.asyncPostRender && !postProcessedRows[row][columnIdx]) {
            m.asyncPostRender(node, row, columnIdx, getDataItem(row), m);
            postProcessedRows[row][columnIdx] = true;
            // When there was one async task, there may be more to follow...
            requeue = true;
            // Should we stop and postpone the execution of the pending tasks?
            var delta_t = postprocess_perftimer.mark();
            if (delta_t >= options.asyncPostRenderSlice) {
              // This approach (see the comment above the startRow/endRow loop) makes sure 
              // this row is revisited as we abort here midway through 
              // (i.e. when not all of the async render cells in the current row have been processed yet)!
              break out;
            }
          }
        }
      }

      // When there's anything left to do, queue it for the next time slice:
      if (requeue) {
        startPostProcessing(options.asyncPostRenderDelay);
      } else {
        // There's nothing to update: we can safely declare the async post processing
        // to have completed.
        postProcessToRow = 0;
        postProcessFromRow = MAX_INT;
      }
    }

    function updateCellCssStylesOnRenderedRows(addedHash, removedHash) {
      var node, columnId, addedRowHash, removedRowHash;
      for (var row = rowsCacheStartIndex, endrow = rowsCache.length; row < endrow; row++) {
        removedRowHash = removedHash && removedHash[row];
        addedRowHash = addedHash && addedHash[row];

        if (removedRowHash) {
          //@TO-OPT
          for (columnId in removedRowHash) {
            if (!addedRowHash || removedRowHash[columnId] !== addedRowHash[columnId]) {
              node = getCellNode(row, getColumnIndex(columnId));
              if (node) {
                $(node).removeClass(removedRowHash[columnId]);
              }
            }
          }
        }

        if (addedRowHash) {
          //@TO-OPT
          for (columnId in addedRowHash) {
            if (!removedRowHash || removedRowHash[columnId] !== addedRowHash[columnId]) {
              node = getCellNode(row, getColumnIndex(columnId));
              if (node) {
                $(node).addClass(addedRowHash[columnId]);
              }
            }
          }
        }
      }
    }

    function addCellCssStyles(key, hash) {
      if (cellCssClasses[key]) {
        throw new Error("addCellCssStyles: cell CSS hash with key '" + key + "' already exists.");
      }

      cellCssClasses[key] = hash;
      updateCellCssStylesOnRenderedRows(hash, null);

      trigger(self.onCellCssStylesChanged, { 
        key: key, 
        hash: hash 
      });
    }

    function removeCellCssStyles(key) {
      if (!cellCssClasses[key]) {
        return;
      }

      updateCellCssStylesOnRenderedRows(null, cellCssClasses[key]);
      delete cellCssClasses[key];

      trigger(self.onCellCssStylesChanged, { 
        key: key, 
        hash: null 
      });
    }

    function setCellCssStyles(key, hash) {
      var prevHash = cellCssClasses[key];

      cellCssClasses[key] = hash;
      updateCellCssStylesOnRenderedRows(hash, prevHash);

      trigger(self.onCellCssStylesChanged, { 
        key: key, 
        hash: hash 
      });
    }

    // Clone hash so setCellCssStyles() will be able to see the changes: cloning MUST be 2 levels deep!
    // 
    // Note: this is a separate function as the for..in causes the code to remain unoptimized
    // ( http://commondatastorage.googleapis.com/io-2013/presentations/223.pdf / https://github.com/paperjs/paper.js/issues/466 )
    function cloneCellCssStylesHash(hash) {
      var o = {};
      for (var prop in hash) {
        var s = hash[prop];
        if (s) {
          var d = o[prop] = {};
          for (var p in s) {
            d[p] = s[p];
          }
        }
      }
      return o;
    }

    // Note: when you wish to use the returned hash as (edited) input to setCellCssStyles(),
    // then the returned hash is a semi-deep clone (2 levels deep) as otherwise setCellCssStyles()
    // won't be able to see the change. See `grid.flashCell() :: toggleCellClass()` for an example.
    function getCellCssStyles(key, options) {
      var hash = cellCssClasses[key];
      if (options && options.clone) {
        hash = cloneCellCssStylesHash(hash);
      }
      return hash;
    }

    // parameters:
    //   row,cell:    grid cell coordinate
    //   options:
    //     speed:     number of milliseconds one half of each ON/OFF toggle cycle takes (default: 100ms)
    //     times:     number of flash half-cycles to run through (default: 4) - proper "flashing" requires you to set this to an EVEN number
    //     delay:     0/false: start flashing immediately. true: wait one half-cycle to begin flashing. <+N>: wait N milliseconds to begin flashing.
    //     cssClass:  the class to toggle; when set, this overrides the slickgrid options.cellFlashingCssClass
    //
    // Notes:
    // - when count = 0 or ODD, then the `flash` class is SET [at the end of the flash period] but never reset!
    function flashCell(row, cell, flash_options) {
      flash_options = __extend({}, {
        speed: 100,
        times: 4,
        delay: false,
        cssClass: options.cellFlashingCssClass
      }, flash_options);
      var key = "flashing";
      var id, start_state;

      if (rowsCache[row]) {
        var node = getCellNode(row, cell);
        if (node) {
          var $cell = $(node);
          assert($cell);
          assert($cell.length);

          // and make sure intermediate .render() actions keep the "flashing" class intact too!
          id = columns[cell].id;
          start_state = !$cell.hasClass(flash_options.cssClass);

          if (flash_options.delay) {
            setTimeout(function h_flashcell_timer_f() {
              toggleCellClass(flash_options.times | 0);
            },
            flash_options.delay !== true ? flash_options.delay : flash_options.speed);
          } else {
            toggleCellClass(flash_options.times | 0);
          }
        }
      }

      function toggleCellClass(times) {
        var node = getCellNode(row, cell);
        if (node) {
          var $cell = $(node);
          assert($cell);
          assert($cell.length);
          $cell.queue(function h_flashcell_toggle_cell_class_f() {
            var hash = getCellCssStyles(key, { clone: true });
            var new_state = !$cell.hasClass(flash_options.cssClass);
            if (new_state) {
              // switch to ON
              if (!hash[row]) {
                hash[row] = {};
              }
              hash[row][id] = flash_options.cssClass;

              $cell.addClass(flash_options.cssClass);
            } else {
              // switch to OFF
              if (hash[row]) {
                delete hash[row][id];
              }

              $cell.removeClass(flash_options.cssClass);
            }
            setCellCssStyles(key, hash);
            execNextFlashPhase(times - 1);
            $cell.dequeue();
          });
        }
      }

      function execNextFlashPhase(times) {
        if (times <= 0) {
          return;
        }
        setTimeout(function h_flashcell_next_phase_f() {
          toggleCellClass(times);
        },
        flash_options.speed);
      }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Interactivity

    // Handle header drags the way body drags are handled, so we set up a parallel
    // set of handlers to the ones used for body drags.
    function handleHeaderDragInit(e, dd) {
      var headerInfo = getHeaderColumnFromElement(e.target);
      if (!headerInfo) {
        return false;
      }
      var column = headerInfo.columnDef;
      assert(column);
      dd.column = column;
      var retval = trigger(self.onHeaderDragInit, dd, e);
      var handled = e.isImmediatePropagationStopped() || e.isPropagationStopped() || e.isDefaultPrevented();
      if (handled) {
        return retval;
      }

      // if nobody claims to be handling drag'n'drop by stopping immediate propagation,
      // cancel out of it
      return false;
    }

    function handleHeaderDragStart(e, dd) {
      var headerInfo = getHeaderColumnFromElement(e.target);
      if (!headerInfo) {
        return false;
      }
      var column = headerInfo.columnDef;
      assert(column);
      // signal the start of a drag operation
      headerDragCommencingLock = column;

      dd.column = column;
      var retval = trigger(self.onHeaderDragStart, dd, e);
      var handled = e.isImmediatePropagationStopped() || e.isPropagationStopped() || e.isDefaultPrevented();
      if (handled) {
        return retval;
      }

      return false;
    }

    function handleHeaderDrag(e, dd) {
      return trigger(self.onHeaderDrag, dd, e);
    }

    function handleHeaderDragEnd(e, dd) {
      var rv = trigger(self.onHeaderDragEnd, dd, e);

      // signal the end of a drag operation
      headerDragCommencingLock = null;

      return rv;
    }

    function handleMouseWheel(e) {
      var rowNode = $(e.target).closest(".slick-row")[0];
      assert(rowNode != rowNodeFromLastMouseWheelEvent ? rowNode !== rowNodeFromLastMouseWheelEvent : rowNode === rowNodeFromLastMouseWheelEvent);
      if (rowNode !== rowNodeFromLastMouseWheelEvent) {
        if (zombieRowNodeFromLastMouseWheelEvent && zombieRowNodeFromLastMouseWheelEvent !== rowNode) {
          $canvas[0].removeChild(zombieRowNodeFromLastMouseWheelEvent);
          zombieRowNodeFromLastMouseWheelEvent = null;
        }
        rowNodeFromLastMouseWheelEvent = rowNode;
      }
    }

    function handleDragInit(e, dd) {
      var cell = getCellFromEvent(e);
      if (!cell || !cellExists(cell.row, cell.cell)) {
        return false;
      }

      var retval = trigger(self.onDragInit, dd, e);
      var handled = e.isImmediatePropagationStopped() || e.isPropagationStopped() || e.isDefaultPrevented();
      if (handled) {
        return retval;
      }

      // if nobody claims to be handling drag'n'drop by stopping immediate propagation,
      // cancel out of it
      return false;
    }

    function handleDragStart(e, dd) {
      var cell = getCellFromEvent(e);
      if (!cell || !cellExists(cell.row, cell.cell)) {
        return false;
      }

      var retval = trigger(self.onDragStart, dd, e);
      var handled = e.isImmediatePropagationStopped() || e.isPropagationStopped() || e.isDefaultPrevented();
      if (handled) {
        return retval;
      }

      return false;
    }

    function handleDrag(e, dd) {
      return trigger(self.onDrag, dd, e);
    }

    function handleDragEnd(e, dd) {
      var rv = trigger(self.onDragEnd, dd, e);
      return rv;
    }

    function preventDefaultKeyboardActionHack(evt) {
      try {
        // prevent default behaviour for special keys in IE browsers (F3, F5, etc.)
        evt.keyCode = 0; 
      }
      // ignore exceptions - setting the original event's keycode throws access denied exception for "Ctrl"
      // (hitting control key only, nothing else), "Shift" (maybe others)
      catch (error) {
      }
      if (evt.originalEvent) {
        preventDefaultKeyboardActionHack(evt.originalEvent);
      }
    }

    // See also test/test-event-modification-transferability.html
    // 
    // Tweak the event object to signal any parents who receive this bubbled-up item 
    // that Monsieur SlickGrid has toggled this one already and as with all things fleeting, 
    // once is enough.
    // 
    // Return TRUE when the event has already been observed by Slickgrid; otherwise this
    // event is signaled as having been seen by Slickgrid, hence the code calls this One Stop Stop
    // for both setting unvisited events and testing incoming events which may have been observed
    // already.
    function signalEventObserved(e) {
      var p = e;
      while (p) {
        if (p.__slickgrid_uid__ === uid) {
          return true;
        }
        p = p.originalEvent;
      }
      // Event has not been visited yet: signal it and return FALSE to signal caller it has work to do.
      p = e;
      while (p) {
        p.__slickgrid_uid__ = uid;
        p = p.originalEvent;
      }
      return false;
    }

    function handleContainerKeyDown(e) {
      assert(!(e instanceof Slick.EventData));
      //console.log("keydown @ CONTAINER: ", this, arguments, document.activeElement);
      if (signalEventObserved(e)) {
        return;
      }

      // move focus back into slickgrid when it's not already there?
      //
      // N.B. keep in mind that we have those special copy/paste tricks which employ root-level temporary DOM nodes which must catch the keyboard event!
      console.log("container keyboard event: ", e);
      __handleKeyDown(e);
    }

    function handleKeyDown(e) {
      assert(!(e instanceof Slick.EventData));
      //console.log("keydown: ", this, arguments, document.activeElement);
      if (signalEventObserved(e)) {
        return;
      }

      __handleKeyDown(e);
    }

    function __handleKeyDown(e) {
      assert(!(e instanceof Slick.EventData));
      //console.log("keydown: ", this, arguments, document.activeElement);
      var activeCellInfo = null;
      if (activeCellNode) {
        activeCellInfo = {
          row: activeRow, 
          cell: activeCell
        };
      }
      assert("which" in e);
      var which = e.which;
      var shiftKey = e.shiftKey;
      var altKey = e.altKey;
      var ctrlKey = e.ctrlKey;

      //console.warn("key @ start: ", which, handled, e, activeCellInfo, getActiveCell(), document.activeElement);
      trigger(self.onKeyDown, activeCellInfo, e);
      var handled = e.isImmediatePropagationStopped() || e.isPropagationStopped() || e.isDefaultPrevented();

      //console.warn("key @ after: ", which, handled, e, activeCellInfo, getActiveCell(), document.activeElement);
      if (!handled) {
        // Check if we're triggered from inside the grid container: when we are, then 
        // we simply activate the top/left visible cell and proceed from there:
        if (!activeCellNode) {
          assert(!getEditorLock().isActive());
          assert(!currentEditor);
          assert(!activeCell);
          assert(!activeRow);

          var visibleRange = getVisibleRange();
          setActiveCell(visibleRange.row, visibleRange.cell, {
            forceEditMode: false,
            takeFocus: false
          });
        }

        if (!shiftKey && !altKey && !ctrlKey) {
          switch (which) {
          case Slick.Keyboard.ESCAPE:
            if (!getEditorLock().isActive()) {
              return; // no editing mode to cancel, allow bubbling and default processing (exit without canceling the event)
            }
            cancelEditAndSetFocus();
            //handled = true;
            break;

          case Slick.Keyboard.PAGE_DOWN:
            navigatePageDown();
            handled = true;
            break;

          case Slick.Keyboard.PAGE_UP:
            navigatePageUp();
            handled = true;
            break;

          case Slick.Keyboard.LEFT:
            handled = navigateLeft();
            break;

          case Slick.Keyboard.RIGHT:
            handled = navigateRight();
            break;

          case Slick.Keyboard.UP:
            handled = navigateUp();
            break;

          case Slick.Keyboard.DOWN:
            handled = navigateDown();
            break;

          case Slick.Keyboard.HOME:
            handled = navigateHome();
            break;

          case Slick.Keyboard.END:
            handled = navigateEnd();
            break;

          case Slick.Keyboard.TAB:
            handled = navigateNext();
            break;

          case Slick.Keyboard.ENTER:
          case Slick.Keyboard.F2:
            if (options.editable) {
              if (getEditorLock().isActive()) {
                assert(currentEditor);
                // adding new row
                if (activeRow === getDataLength()) {
                  navigateDown();
                } else {
                  commitEditAndSetFocus();
                  if (options.autoEdit) {
                    navigateDown();
                  }
                }
              } else {
                assert(!getEditorLock().isActive());
                assert(!currentEditor);
                if (false === makeActiveCellEditable() && !getEditorLock().isActive()) {
                  // Nor us, nor any userland code, did start an editor in this cell.
                  assert(!currentEditor);
                  if (!elementHasFocus($container[0])) {
                    setFocus();
                  }
                }
              }
            }
            handled = true;
            break;
          }
        } else if (which === Slick.Keyboard.TAB && shiftKey && !ctrlKey && !altKey) {
          handled = navigatePrev();
        }
      }

      if (handled) {
        // the event has been handled so don't let parent element (bubbling/propagation) or browser (default) handle it
        e.stopPropagation();
        e.preventDefault();
        preventDefaultKeyboardActionHack(e);
      }
      //console.warn("key @ end: ", which, handled, e, activeCellInfo, getActiveCell(), document.activeElement);
    }

    function handleContainerContextMenu(e) {
      assert(!(e instanceof Slick.EventData));
      console.log("container CONTEXTMENU: ", this, arguments, document.activeElement);
      if (signalEventObserved(e)) {
        return;
      }

      // When there's no activeCell yet and the user clicked on a spot which *will* be covered by a
      // cell once the "lazy render" has run, then we should act if that node was clicked already
      // and activate it right away:
      //
      //var info = getCellFromEvent(e, { clipToValidRange: true });    
      //...
      //
      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      console.log("container event: ", cell);
      if (cell && cell.sourceInfo && cell.sourceInfo.source === "headers") {
        if (cell.sourceInfo.subSource === "header") {
          __handleHeaderContextMenu(e);
        }
      } else {
        __handleContextMenu(e);
      }
    }

    function handleContainerClickEvent(e) {
      assert(!(e instanceof Slick.EventData));
      console.log("container CLICK: ", this, arguments, document.activeElement);
      if (signalEventObserved(e)) {
        return;
      }

      // When there's no activeCell yet and the user clicked on a spot which *will* be covered by a
      // cell once the "lazy render" has run, then we should act if that node was clicked already
      // and activate it right away:
      //
      //var info = getCellFromEvent(e, { clipToValidRange: true });    
      //...
      //
      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      console.log("container event: ", cell);
      if (cell && cell.sourceInfo && cell.sourceInfo.source === "headers") {
        if (cell.sourceInfo.subSource === "header") {
          __handleHeaderClick(e);
        }
      } else {
        __handleClick(e);
      }
    }

    function handleContainerDblClickEvent(e) {
      assert(!(e instanceof Slick.EventData));
      console.log("container DOUBLE CLICK: ", this, arguments, document.activeElement);
      if (signalEventObserved(e)) {
        return;
      }

      // When there's no activeCell yet and the user clicked on a spot which *will* be covered by a
      // cell once the "lazy render" has run, then we should act if that node was clicked already
      // and activate it right away:
      //
      //var info = getCellFromEvent(e, { clipToValidRange: true });    
      //...
      //
      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      console.log("container event: ", cell);
      if (cell && cell.sourceInfo && cell.sourceInfo.source === "headers") {
        if (cell.sourceInfo.subSource === "header") {
          __handleHeaderDblClick(e);
        }
      } else {
        __handleDblClick(e);
      }
    }

    function handleClick(e) {
      assert(!(e instanceof Slick.EventData));
      if (signalEventObserved(e)) {
        return;
      }

      __handleClick(e);
    }

    function __handleClick(e) {
      assert(!(e instanceof Slick.EventData));

      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      assert(cell);

      trigger(self.onClick, cell, e);
      var handled = e.isImmediatePropagationStopped() || e.isPropagationStopped() || e.isDefaultPrevented();
      if (handled) {
        return;
      }

      if (!cell) {
        return;
      }

      var row = cell.row;
      var col = cell.cell;
      if (cell.spanInfo) {
        row = cell.spanInfo.row;
        col = cell.spanInfo.cell;
      }

      // if this click resulted in some cell child node getting focus in the userland onClick event handler(s),
      // don't steal it back - keyboard events will still bubble up if the userland code wants them to.
      if (activeCellNode !== cell.node && canCellBeActive(row, col)) {
        if (!getEditorLock().isActive() || getEditorLock().commitCurrentEdit()) {
          assert(!currentEditor);
          assert(cell.node);
          gotoCell(row, col, {
            forceEditMode: null, 
            takeFocus: false
          });
        }
      } else if (activeCellNode === cell.node && getEditorLock().isActive()) {
        // When there is an editor active, we make sure the focus jumps back to that editor!
        assert(currentEditor);
        currentEditor.focus();
        assert(document.activeElement !== document.body);
      } else if (activeCellNode === cell.node && !getEditorLock().isActive()) {
        // When there's no editor active on the current cell already, simply focus the grid.
        assert(!currentEditor);
        if (!elementHasFocus($container[0])) {
          setFocus();
        }
      }
    }

    function handleContextMenu(e) {
      assert(!(e instanceof Slick.EventData));
      if (signalEventObserved(e)) {
        return;
      }

      __handleContextMenu(e);
    }

    function __handleContextMenu(e) {
      assert(!(e instanceof Slick.EventData));

      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      assert(cell);

      trigger(self.onContextMenu, cell, e);
      // When the right-click context menu event actually was received by any handlers, 
      // then we make sure no default browser right-click popup menu shows up as well:
      if (self.onContextMenu.handlers().length) {
        // http://stackoverflow.com/questions/10483937/need-to-disable-context-menu-on-right-click-and-call-a-function-on-right-click
        e.preventDefault();
        return false;
      }
    }

    function handleDblClick(e) {
      assert(!(e instanceof Slick.EventData));
      if (signalEventObserved(e)) {
        return;
      }

      __handleDblClick(e);
    }

    function __handleDblClick(e) {
      assert(!(e instanceof Slick.EventData));

      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      assert(cell);

      trigger(self.onDblClick, cell, e);
      var handled = e.isImmediatePropagationStopped() || e.isPropagationStopped() || e.isDefaultPrevented();
      if (handled) {
        return;
      }

      if (!cell) {
        return;
      }

      var row = cell.row;
      var col = cell.cell;
      if (cell.spanInfo) {
        row = cell.spanInfo.row;
        col = cell.spanInfo.cell;
      }

      // if this double-click resulted in some cell child node getting focus in the userland onClick event handler(s),
      // don't steal it back - keyboard events will still bubble up if the userland code wants them to.
      if (activeCellNode !== cell.node && canCellBeActive(row, col)) {
        if (!getEditorLock().isActive() || getEditorLock().commitCurrentEdit()) {
          assert(!currentEditor);
          assert(!getEditorLock().isActive());
          gotoCell(row, col, {
            forceEditMode: (options.editable ? 2 /* truthy value which "wins" over options.asyncEditorLoading: open the editor immediately! */ : null),
            takeFocus: false
          });
        }
      } else if (activeCellNode === cell.node && getEditorLock().isActive()) {
        // When there is an editor active, we make sure the focus jumps back to that editor!
        assert(currentEditor);
        currentEditor.focus();
        assert(document.activeElement !== document.body);
      } else if (activeCellNode === cell.node && !getEditorLock().isActive()) {
        // When there's no editor active on the current cell already, make it so. (forceEditMode=2 like)
        if (options.editable) {
          // if cfg.forceEditMode > 1 then show the editor immediately (this happens for instance when the cell is double-clicked)
          if (makeActiveCellEditable() || getEditorLock().isActive()) {
            // We, or any userland code, did start an editor in this cell.
            return;
          }
        }
        assert(!currentEditor);
        assert(!getEditorLock().isActive());
        if (!elementHasFocus($container[0])) {
          setFocus();
        }
      }
    }

    function handleHeaderMouseEnter(e) {
      var headerInfo = getHeaderColumnFromElement(e.target);
      if (!headerInfo) {
        return;
      }
      var column = headerInfo.columnDef;
      assert(column);
      if (!headerDragCommencingLock) {
        var rv = trigger(self.onHeaderMouseEnter, {
          column: column,
          cell: getColumnIndex(column.id),
          node: headerInfo.$header[0]
        }, e);
        return rv;
      }
    }

    function handleHeaderMouseLeave(e) {
      var headerInfo = getHeaderColumnFromElement(e.target);
      if (!headerInfo) {
        return;
      }
      var column = headerInfo.columnDef;
      assert(column);
      if (!headerDragCommencingLock) {
        var rv = trigger(self.onHeaderMouseLeave, {
          column: column,
          cell: getColumnIndex(column.id),
          node: headerInfo.$header[0]
        }, e);
        return rv;
      }
    }

    function handleHeaderContextMenu(e) {
      assert(!(e instanceof Slick.EventData));
      if (signalEventObserved(e)) {
        return;
      }

      __handleHeaderContextMenu(e);
    }

    function __handleHeaderContextMenu(e) {
      assert(!(e instanceof Slick.EventData));

      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      assert(cell && cell.sourceInfo && cell.sourceInfo.source === "headers");
      assert(cell && cell.sourceInfo && cell.sourceInfo.subSource === "header");

      if (!cell) {
        return;
      }

      var columnDef = columns[cell.cell];
      assert(columnDef);
      trigger(self.onHeaderContextMenu, {
        column: columnDef,
        cell: cell.cell,
        node: cell.node
      }, e);
      // when the right-click context menu event actually was received by any handlers, then we make sure no default browser right-click popup menu shows up as well:
      if (self.onHeaderContextMenu.handlers().length) {
        // http://stackoverflow.com/questions/10483937/need-to-disable-context-menu-on-right-click-and-call-a-function-on-right-click
        e.stopPropagation();
        e.preventDefault();
        return false;
      }
    }

    function handleHeaderClick(e) {
      assert(!(e instanceof Slick.EventData));
      if (signalEventObserved(e)) {
        return;
      }

      __handleHeaderClick(e);
    }

    function __handleHeaderClick(e) {
      assert(!(e instanceof Slick.EventData));

      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      assert(cell && cell.sourceInfo && cell.sourceInfo.source === "headers");
      assert(cell && cell.sourceInfo && cell.sourceInfo.subSource === "header");

      if (!cell) {
        return;
      }

      var columnDef = columns[cell.cell];
      assert(columnDef);
      trigger(self.onHeaderClick, {
        column: columnDef,
        cell: cell.cell,
        node: cell.node
      }, e);
    }

    function handleHeaderDblClick(e) {
      assert(!(e instanceof Slick.EventData));
      if (signalEventObserved(e)) {
        return;
      }

      __handleHeaderDblClick(e);
    }

    function __handleHeaderDblClick(e) {
      assert(!(e instanceof Slick.EventData));

      var cell = getCellFromEvent(e, {
        clipToValidRange: true
      });
      assert(cell && cell.sourceInfo && cell.sourceInfo.source === "headers");
      assert(cell && cell.sourceInfo && cell.sourceInfo.subSource === "header");

      if (!cell) {
        return;
      }

      var columnDef = columns[cell.cell];
      assert(columnDef);
      trigger(self.onHeaderDblClick, {
        column: columnDef,
        cell: cell.cell,
        node: cell.node
      }, e);
    }

    function handleMouseEnter(e) {
      var cellInfo = getCellFromEvent(e, {
        clipToValidRange: true
      });
      assert(cellInfo);
      //console.log("slickgrid: handleMouseEnter: ", cellInfo, e);
      var rv = trigger(self.onMouseEnter, cellInfo, e);
      return rv;
    }

    function handleMouseLeave(e) {
      var cellInfo = getCellFromEvent(e, {
        clipToValidRange: true
      });
      assert(cellInfo);
      //console.log("slickgrid: handleMouseLeave: ", cellInfo, e);
      var rv = trigger(self.onMouseLeave, cellInfo, e);
      return rv;
    }

    function cellExists(row, cell) {
      // catch NaN, undefined, etc. row/cell values by inclusive checks instead of exclusive checks:
      return (row < getDataLength() && row >= 0 && cell < columns.length && cell >= 0);
    }

    // Return the `{row: ?, cell: ?}` row/column grid coordinate at the given grid pixel coordinate (X, Y).
    //
    // Also return the "fraction" of the position within the row and column, i.e.
    // if the Y coordinate points at a spot 25% from the top of the row, then
    // `returnValue.rowFraction` will be 0.25
    //
    // `returnValue.rowFraction === 0.0` would identify the top pixel within the row.
    // `returnValue.cellFraction === 0.0` would identify the left-most pixel within the cell.
    //
    // When the coordinate points outside the grid, out-of-range row/cell coordinates will be produced.
    function getCellFromPoint(x, y, cfg) {
      assert(!isNaN(x));
      assert(!isNaN(y));
      cfg = cfg || {};
      var clipToValidRange = cfg.clipToValidRange;

      var rowInfo = getRowWithFractionFromPosition(y + pageOffset, clipToValidRange);
      var columnCount = columns.length;
      var cell = 0;
      var cellFraction;

      var w = 0;
      var cellWidth = 0;
      for (var i = 0; i < columnCount && w < x; i++) {
        w += (cellWidth = columns[i].width);
        cell++;
      }

      // calculate fraction from the left edge:
      // (outside the grid range the rowFraction/cellFraction represents the number of estimated rows/cells it is out of range)
      x -= w;
      if (x < 0) {
        cell--;
        assert(cell >= -1);
        if (cell === -1) {
          cellWidth = options.defaultColumnWidth;
          assert(cellWidth);
          if (clipToValidRange) {
            cell = 0;
          } else {
            cell = Math.floor(x / cellWidth);
            x -= cell * cellWidth;
            assert(x >= 0);
          }
        } else {
          assert(cellWidth);
          x += cellWidth;
          assert(x >= 0);
        }
        cellFraction = x / cellWidth;
      } else if (x > 0) {
        assert(cell === columnCount);
        cellWidth = options.defaultColumnWidth;
        assert(cellWidth);
        if (clipToValidRange) {
          cell--;
          x += cellWidth;  
        } else {
          var dx = Math.floor(x / cellWidth);
          cell += dx;
          x -= dx * cellWidth;
          assert(x >= 0);
        }
        cellFraction = x / cellWidth;
      } else if (cell === columnCount && clipToValidRange) {
        assert(x === 0);
        assert(cellWidth);
        cell--;
        x += cellWidth;  
        cellFraction = x / cellWidth;
      }

      var row = rowInfo.position;
      var spans = getSpans(row, cell);
      if (spans) {
        // assert(row === spans.row);
        // assert(cell === spans.cell);

        // **NOTE**:
        // 
        // getCellFromPoint() & getCellFromEvent() are special in that we decode the row and column individually and in the
        // fundamental return values do NOT care about actual rowspan/colspan issues at the intersection point.
        // 
        // When the caller of this function/API is interested in the actual 'live cell' they can go 
        // and look at the `.spanInfo` info that we're including further below.
      } else {
        spans = {
          row: row,
          cell: cell,
          rowspan: 1,
          colspan: 1
        };
      }

      return {
        row: row,
        cell: cell,
        rowFraction: rowInfo.fraction,
        cellFraction: cellFraction,
        cellWidth: cellWidth,
        cellHeight: rowInfo.height,
        spanInfo: spans
      };
    }

    function getCellFromNode(cellNode) {
      // read column number from .l<columnNumber> CSS class
      var cls = / l(\d+) /.exec(" " + cellNode.className + " ");
      if (!cls) {
        assert(0, "getCellFromNode: cannot get cell - " + cellNode.className);
        return null;
      }
      return +cls[1];
    }

    function getRowFromNode(rowNode) {
      assert(rowNode);
      var rws = / slick-row-(\d+) /.exec(" " + rowNode.className + " ");
      if (!rws) {
        assert(0, "getRowFromNode: cannot get row - " + rowNode.className);
        return null;
      }
      return +rws[1];

      // for (var row = rowsCacheStartIndex, endrow = rowsCache.length; row < endrow; row++) {
      //   if (rowsCache[row]) {
      //     assert(rowsCache[row].rowNode);
      //     if (rowsCache[row].rowNode === rowNode) {
      //       return row;
      //     }
      //   }
      // }

      // return null;
    }

    function getCellFromElement(el) {
      if (!el) {
        return null;
      }
      var $cell = $(el).closest(".slick-cell", $canvas);
      if ($cell.length === 0) {
        return null;
      }

      var node = $cell[0];
      var row = getRowFromNode(node.parentNode);
      var cell = getCellFromNode(node);

      if (row == null || cell == null) {
        return null;
      } else {
        var rowspan = 1;
        var colspan = 1;
        var spans = getSpans(row, cell);
        if (spans) {
          assert(row === spans.row);
          assert(cell === spans.cell);
          row = spans.row;
          cell = spans.cell;
          rowspan = spans.rowspan;
          colspan = spans.colspan;
        }
        assert(cellExists(row, cell) || (options.enableAddRow ? (row === getDataLength() && cell < columns.length && cell >= 0) : true));
        return {
          row: row,
          cell: cell,
          rowspan: rowspan,
          colspan: colspan,
          node: node 
        };
      }
    }

    function getCellFromEvent(e, cfg) {
      cfg = cfg || {};
      
      // dive up the original browser event from the depths of the (optional) Slick.EventData
      while (e && !e.target) {
        e = e.sourceEvent;
      }
      assert(e);
      assert(e && e.target);
      if (!e || !e.target) {
        return null;
      }
      var cell = getCellFromElement(e.target);
      if (!cell && initialized) {
        // dive up the original browser event from the depths of the (optional) Slick.EventData
        var originalEvent = e;
        while (originalEvent && originalEvent.sourceEvent) {
          originalEvent = originalEvent.sourceEvent;
        }
        assert(originalEvent);
        assert(originalEvent && originalEvent.target);
        if (!originalEvent || !originalEvent.target) {
          return null;
        }
        var x = originalEvent.pageX;
        var y = originalEvent.pageY;
        // Correct the coordinate to become one that's relative to the grid VIEWPORT, 
        // then derive the coordinate while accounting for the CANVAS scroll position:
        var vpOffset = $viewport.offset();
        x -= vpOffset.left;
        y -= vpOffset.top;
        cell = getCellFromPoint(x + scrollLeft, y + scrollTop, cfg);  // do clip to nearest legal coordinate!
        if (cell) {
          // Make sure all cell info is included in the returned object.
          // This includes making sure the addressed grid node (DOM Element) does exist. Even
          // if we're only addressing it indirectly, i.e. due to the grid coordinate being clipped!
          assert(cell.spanInfo);
          cell.node = getCellNode(cell.spanInfo.row, cell.spanInfo.cell, true);

          // http://ejohn.org/blog/comparing-document-position/
          // We specifically WANT the 'node contains itself' behaviour that's part of the NATIVE DOM /contains() method!
          if ($viewport[0].contains(originalEvent.target)) {
            // When you got an event originating from inside the viewport itself, we're pointing at a cell, or at least at a row.
            // 
            // Here we assume that you always want a cell node, so clicking outside the canvas/grid range will get you a
            // cell coordinate thanks to row/cell clipping.
            assert(y >= 0); // We wouldn't scroll beyond the top row of the grid so negative Y would be very illogical here!
            assert(x >= 0); // Ditto for scrolling beyond the leftmost column: so negative X would be very illogical here!
            // ^--- we MAY have negative X or Y when you have a canvas and/or viewport styled with borders and happen to click on that border...
            // --> To Be Tested!
            cell.sourceInfo = {
              source: "viewport",
              relX: x,
              relY: y
            }; 
            console.log("event inside viewport: ", x, y, cell);
          } else {
            // The event originates from outside the viewport, so we go and check if we got an event from inside the headers/footers:
            // if it is, we're column-only picking.
            // 
            // If, however, the event is coming from outside the grid container, i.e. from the world at large, then we
            // assume you want the nearest cell coordinate as if you clicked inside the viewport.
            //
            // http://ejohn.org/blog/comparing-document-position/
            // And once again, we specifically WANT the 'node contains itself' behaviour that's part of the NATIVE DOM /contains() method!
            if ($container[0].contains(originalEvent.target)) {
              cell.sourceInfo = {
                source: "headers",
                subSource: "header",
                relX: x,
                relY: y    // y <= 0 --> headers, y > 0 --> footers
              }; 
              cell.node = null;
              var columnDefSrc = columns[cell.cell];
              var i, len, $els, el, columnDef;

              // Now determine if the user clicked in the area of the headers, headerRow or footerRow and fake a node accordingly:
              if ($headers[0].contains(originalEvent.target)) {
                // Fake the node as the lowest level column header node:
                $els = $headers.find(".slick-header-column");
                for (i = 0, len = $els.length; i < len; i++) {
                  el = $els[i];
                  columnDef = $(el).data("column");
                  assert(columnDef);
                  if (columnDef === columnDefSrc) {
                    cell.node = el;
                    break;
                  }
                }
              } else if ($headerRow[0].contains(originalEvent.target)) {
                // Fake the node as the lowest level column header node:
                $els = $headerRow.find(".slick-headerrow-column");
                for (i = 0, len = $els.length; i < len; i++) {
                  el = $els[i];
                  columnDef = $(el).data("column");
                  assert(columnDef);
                  if (columnDef === columnDefSrc) {
                    cell.node = el;
                    cell.sourceInfo.subSource = "headerRow";
                    break;
                  }
                }
              } else if ($footerRow[0].contains(originalEvent.target)) {
                // Fake the node as the lowest level column header node:
                $els = $footerRow.find(".slick-footerrow-column");
                for (i = 0, len = $els.length; i < len; i++) {
                  el = $els[i];
                  columnDef = $(el).data("column");
                  assert(columnDef);
                  if (columnDef === columnDefSrc) {
                    cell.node = el;
                    cell.sourceInfo.subSource = "footerRow";
                    break;
                  }
                }
              }
              console.log("event inside headers/footers: ", x, y, cell);
            } else {
              // The event originates from the outside world: clip to legal coordinate
              cell.sourceInfo = {
                source: "outside",
                relX: x,    // x < 0 --> left of viewport, x > 0: right of viewport
                relY: y     // y < 0 --> above viewport, y > 0 --> below viewport
              }; 
              console.log("event from outside grid container: ", x, y, cell);
            }
          }
        }
      }
      return cell;
    }

    function getRowFromEvent(e) {
      // dive up the original browser event from the depths of the (optional) Slick.EventData
      while (e && !e.target) {
        e = e.sourceEvent;
      }
      assert(e);
      assert(e && e.target);
      if (!e || !e.target) {
        return null;
      }
      var $row = $(e.target).closest(".slick-row", $canvas);
      if (!$row.length) {
        return null;
      }
      return getRowFromNode($row[0]);
    }

    function getCellNodeBox(row, cell) {
      if (!cellExists(row, cell)) {
        // Are we perhaps looking at the "new data row at the bottom"?
        // If not, then we are indeed outside the grid allowed area.
        if (!options.enableAddRow || !cellExists(row - 1, cell)) {
          return null;
        }
      }

      var rowspan = 1;
      var colspan = 1;
      var spans = getSpans(row, cell);
      if (spans) {
        assert(row === spans.row);
        assert(cell === spans.cell);
        row = spans.row;
        cell = spans.cell;
        rowspan = spans.rowspan;
        colspan = spans.colspan;
      } else {
        spans = {
          row: row,
          cell: cell,
          rowspan: rowspan,
          colspan: colspan
        };
      }

      var y1 = getRowTop(row) - pageOffset;
      var y2 = getRowTop(row + rowspan) - pageOffset;
      var x1 = getColumnOffset(cell);
      var x2 = getColumnOffset(cell + colspan);

      return {
        top: y1,
        left: x1,
        bottom: y2,
        right: x2,
        spanInfo: spans
      };
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Cell switching

    function resetActiveCell() {
      setActiveCellInternal(null, {
        forceEditMode: false, 
        takeFocus: false
      });
    }

    function setFocus() {
      var e = new Slick.EventData();
      trigger(self.onFocusSet, {}, e);
      var handled = e.isHandled();
      if (handled) {
        return;
      }

      // console.log("setFocus: SET FOCUS TO A SINK: START");
      if (tabbingDirection === -1) {
        $focusSink[0].focus();
        assert(document.activeElement === $focusSink[0]);
      } else {
        $focusSink2[0].focus();
        assert(document.activeElement === $focusSink2[0]);
      }
      // console.log("setFocus: SET FOCUS TO A SINK: END");
    }

    // Return TRUE when the element itself or any of its child nodes has focus.
    function elementHasFocus(el) {
      var activeEl = document.activeElement;
      if (!el || !activeEl || activeEl === document.body) {
        return false;
      }
      var outermost = $container[0].parentNode;
      while (activeEl && activeEl !== outermost && activeEl !== document.body) {
        if (activeEl === el) {
          return true;
        }
        activeEl = activeEl.parentNode;
      }
      return false;
    }

    // This get/set methods are used for keeping text-selection.
    // These don't consider IE because they don't loose text-selection.
    function getTextSelection() {
      var selection = null;
      if (window.getSelection && window.getSelection().rangeCount > 0) {
        selection = window.getSelection().getRangeAt(0);
      }
      return selection;
    }

    function setTextSelection(selection) {
      if (window.getSelection && selection) {
        var target = window.getSelection();
        target.removeAllRanges();
        target.addRange(selection);
      }
    }

    function scrollCellIntoView(row, cell, doPaging, doCenteringY) {
      scrollRowIntoView(row, doPaging, doCenteringY);

      // Clip `cell` to renderable range:
      assert(cell >= 0);
      assert(cell < columns.length);
      cell = Math.min(columns.length, Math.max(0, cell));

      var colspan = getColspan(row, cell);
      var left = columnPosLeft[cell],
          right = columnPosLeft[cell + colspan],
          scrollRight = scrollLeft + viewportW;    // availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW

      if (left < scrollLeft) {
        $viewport.scrollLeft(left);
        handleScroll();
        //render();
      } else if (right > scrollRight) {
        $viewport.scrollLeft(Math.min(left, right - $viewport[0].clientWidth));
        handleScroll();
        //render();
      }
    }

    function setActiveCellInternal(newCellNode, cfg) {
      // Also check which node currently has focus *before* we send events and thus give userland
      // code opportunity to revert/modify/move the focus.
      // 
      // Note that the focus doesn't have to be on the activeCellNode right now!
      var oldFocusNode = document.activeElement;
      var oldFocusCellInfo = getCellFromElement(oldFocusNode);

      assert(cfg); // opt_editMode, takeFocus, coordinate

      var activeCellChanged = (activeCellNode != newCellNode);
      var newActiveRow;
      if (newCellNode != null) {
        newActiveRow = getRowFromNode(newCellNode.parentNode);
        assert(newActiveRow != null);
        if (cfg.forceEditMode == null) {
          cfg.forceEditMode = (options.enableAddRow && newActiveRow === getDataLength()) || options.autoEdit;
        }
      }

      // onActiveCellChanging should fire before we *might* instantiate an editor!
      // This order of events is important so that the editor-augmented cell instance doesn't get
      // influenced by any initial onActiveCellChanging that concerns the cell itself.
      //
      // It also allows us to renege on the "cell change" inside this event handler without
      // too much trouble (or so we can hope)...
      var e = new Slick.EventData();
      if (activeCellChanged) {
        trigger(self.onActiveCellChanging, {
          activeCell:     newCellNode,
          prevActiveCell: activeCellNode,
          editMode:       cfg.forceEditMode,
        }, e);
        if (e.isHandled()) {
          return false;
        }
      }

      if (activeCellNode != null) {
        makeActiveCellNormal();
        $(activeCellNode)
          .removeClass("active")
          .parent().removeClass("active-row");          // We don't know the old PosY so this only works well for rowspan=1 cells
      }

      var prevActiveCell = activeCellNode;
      activeCellNode = newCellNode;

      if (newCellNode != null) {
        assert(activeCellNode);
        activeRow = getRowFromNode(newCellNode.parentNode);
        activeCell = getCellFromNode(newCellNode);
        assert(activeRow != null);
        assert(activeCell != null);
        assert(cfg.forceEditMode != null);
        // Only update the active cursor coordinate (which may be anywhere inside the cell span!)
        // when the coordinate is either outside the current cell span OR when the caller has 
        // explicitly demanded we set the cursor coordinate as well:
        var spans = getSpans(activeRow, activeCell);
        if (!spans) {
          spans = {
            row: activeRow,
            cell: activeCell,
            colspan: 1,
            rowspan: 1
          };
        }
        assert(spans.row === activeRow);
        assert(spans.cell === activeCell);
        if (cfg.forcePosition || activePosY == null || activePosX == null || activePosY < spans.row || activePosY >= spans.row + spans.rowspan || activePosX < spans.cell || activePosX >= spans.cell + spans.colspan) {
          activePosY = activeRow;
          activePosX = activeCell;
        }

        assert($(newCellNode).parent()[0] === rowsCache[activeRow].rowNode);
        $(newCellNode)
          .addClass("active");
        if (rowsCache[activePosY] && rowsCache[activePosY].rowNode) {
          $(rowsCache[activePosY].rowNode)
            .addClass("active-row");
        }

        if (activeCellChanged) {
          //activeCellNode.focus();
          trigger(self.onActiveCellChanged, {
            activeCell:     newCellNode,
            prevActiveCell: prevActiveCell,
            editMode:       cfg.forceEditMode,
          }, e);
          if (e.isHandled()) {
            return true;
          }
        }

        // When the old active cell had focus, move focus to the new active cell.
        // 
        // Subtleties to mind here: 
        // - the userland code for the event handler above MAY have changed the active cell node on us!
        // - we only SET/MOVE the focus when the current focus is still on the old active cell node
        // - any userland code in the event handlers which places focus elsewhere is therefore rendering
        //   this code nil and void: we won't touch page focus here when this would be the case.
        // - general FOCUS LOSS is recognized by observing that the active focus is on the document 
        //   BODY element. Any userland code which moves the focus around is assumed not to "loose focus"
        //   like that, i.e. such focus-shifting userland code is assumed to set focus to 
        //   *another* DOM element that is not inside slickgrid AND is not the BODY element itself.
        //    
        var oldFocusNode2 = document.activeElement;
        // TODO: detect focus moving in userland code.
        
        if (!oldFocusCellInfo && (oldFocusNode === document.body || cfg.takeFocus)) {
          // fake it to simplify the conditional check below:
          oldFocusCellInfo = {
            node: oldFocusNode
          };
        }
        var newActiveCellInfo = getCellFromElement(activeCellNode);
        assert(newActiveCellInfo);
        assert(newActiveCellInfo.node);
        //console.log("focus fixup: ", oldFocusNode, oldFocusCellInfo, activeCellNode, newActiveCellInfo);
        if (oldFocusCellInfo && oldFocusCellInfo.node !== newActiveCellInfo.node) {
          //console.log("focus fixup exec START: ", document.activeElement);
          movingFocusLock++;
          // We MAY see a sequence of focusout+focusin, where by the time focusin fires, document.activeElement is BODY.
          // We MAY also see only a focusin, in which case we are to provide the original focused node.
          movingFocusLockData[movingFocusLock - 1] = {
            newNode: activeCellNode,
            oldNode: oldFocusNode,
            oldNodeInfo: oldFocusCellInfo
          };
          activeCellNode.focus();
          assert(document.activeElement === activeCellNode);
          movingFocusLock--;
          if (!movingFocusLock) {
            movingFocusLockData = [];
          }
          //console.log("focus fixup exec END: ", document.activeElement);
        }

        if (options.editable && cfg.forceEditMode && isCellPotentiallyEditable(activeRow, activeCell)) {
          // if cfg.forceEditMode > 1 then show the editor immediately (this happens for instance when the cell is double-clicked)
          if (options.asyncEditorLoading >= cfg.forceEditMode) {
            h_editorLoader = setTimeout(function h_show_editor_f() {
              makeActiveCellEditable();
            }, options.asyncEditorLoadDelay);
          } else {
            if (false === makeActiveCellEditable() && !getEditorLock().isActive()) {
              // Nor us, nor any userland code, did start an editor in this cell.
              assert(!currentEditor);
              if (!elementHasFocus($container[0])) {
                setFocus();
              }
            }
          }
        }
      } else {
        assert(activeCellNode == null);
        activeRow = activeCell = null;
        activePosX = activePosY = null;

        // when the activeCellNode is reset, we *still* want to retain focus inside slickgrid
        // if we had it previously: that way we ensure the keyboard events etc. will continue
        // to arrive at the appropriate handlers.
        if (!oldFocusCellInfo && (oldFocusNode === document.body || cfg.takeFocus)) {
          // fake it to simplify the conditional check below:
          oldFocusCellInfo = {
            node: oldFocusNode
          };
        }
        if (oldFocusCellInfo) {
          // As the active cell is about to loose focus, we (temporarily) switch focus to one of the sinks
          // so that the node removal from the DOM does not drop focus, which would consequently 
          // loose us keyboard events, at least for the (very) short time period between DOM
          // cell removal and re-render. That would cause symptoms of "erratic keyboard behaviour"
          // and we cannot have that!

          //console.log("focus fixup exec (reset active cell) START: ", oldFocusCellInfo);
          movingFocusLock++;
          // We MAY see a sequence of focusout+focusin, where by the time focusin fires, document.activeElement is BODY.
          // We MAY also see only a focusin, in which case we are to provide the original focused node.
          movingFocusLockData[movingFocusLock - 1] = {
            newNode: $focusSink[0],
            oldNode: oldFocusNode,
            oldNodeInfo: oldFocusCellInfo
          };
          $focusSink[0].focus();
          assert(document.activeElement === $focusSink[0]);
          movingFocusLock--;
          if (!movingFocusLock) {
            movingFocusLockData = [];
          }
          //console.log("focus fixup exec (reset active cell) END: ", oldFocusCellInfo);
        }
      }
      return true;
    }

    function clearTextSelection() {
      if (document.selection && document.selection.empty) {
        try {
          // IE fails here if selected element is not in DOM
          document.selection.empty();
        } catch (e) { }
      } else if (window.getSelection) {
        var sel = window.getSelection();
        if (sel && sel.removeAllRanges) {
          sel.removeAllRanges();
        }
      }
    }

    function isCellPotentiallyEditable(row, cell) {
      // is this coordinate legal?
      var dataLength = getDataLength();
      if (!(row <= dataLength && row >= 0 && cell < columns.length && cell >= 0)) {
        return false;
      }

      // is the data for this row loaded?
      if (row < dataLength && !getDataItem(row)) {
        return false;
      }

      // are we in the Add New row?  
      // can we create a new row from this cell?
      assert(columns[cell]);
      if (row === dataLength && (!options.enableAddRow || columns[cell].cannotTriggerInsert)) {
        return false;
      }

      // does this cell have an editor?
      if (!getEditor(row, cell)) {
        return false;
      }

      return true;
    }

    function makeActiveCellNormal() {
      if (!getEditorLock().isActive()) {
        assert(!currentEditor);
        return;
      }

      // Reset the global var as any node.destroy() can trigger additional focusout events which will trigger a commit:
      // only by immediately resetting the global and keeping the "old" value locally for further processing
      // can we prevent nested invocations of this code (and consequent crashes in jQuery).
      assert(currentEditor);
      var editor = currentEditor;
      currentEditor = null;
      var e = new Slick.EventData();
      trigger(self.onBeforeCellEditorDestroy, {
        editor: editor
      }, e);
      assert(!currentEditor);
      if (e.isHandled()) {
        return;
      }
      editor.destroy();

      if (activeCellNode) {
        var d = getDataItem(activeRow);
        var $activeCellNode = $(activeCellNode);
        $activeCellNode.removeClass("editable invalid");
        var column = columns[activeCell];
        var rowMetadata = data.getItemMetadata && data.getItemMetadata(activeRow, activeCell);
        // look up by id, then index
        var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[column.id] || rowMetadata.columns[activeCell]);
        // I/F: function mkCellHtml(row, cell, rowMetadata, columnMetadata, rowDataItem)
        var info = mkCellHtml(activeRow, activeCell, rowMetadata, columnMetadata, d);
        assert(info.html != null);
        updateElementHtml($activeCellNode, info);
        invalidatePostProcessingResults(activeRow, activeCell);
      }

      // if there previously was text selected on a page (such as selected text in the edit cell just removed),
      // IE can't set focus to anything else correctly
      if (isBrowser.msie) {
        clearTextSelection();
      }

      getEditorLock().deactivate(editController);
    }

    function makeActiveCellEditable(editor) {
      // cancel pending async call if there is one
      clearTimeout(h_editorLoader);
      h_editorLoader = null;

      if (!activeCellNode) {
        return false;
      }
      if (!options.editable) {
        throw new Error("Grid : makeActiveCellEditable : should never get called when options.editable is false");
      }

      if (!isCellPotentiallyEditable(activeRow, activeCell)) {
        return false;
      }

      var columnDef = columns[activeCell];
      var item = getDataItem(activeRow);
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(activeRow, activeCell);

      // look up by id, then index
      var columnMetadata = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[activeCell]);

      var e = new Slick.EventData();
      trigger(self.onBeforeEditCell, {
        row: activeRow,
        cell: activeCell,
        item: item,
        column: columnDef,
        rowMetadata: rowMetadata,
        columnMetadata: columnMetadata,
      }, e);
      if (e.isHandled()) {
        if (!elementHasFocus($container[0]) && !currentEditor) {
          setFocus();
        }
        return false;
      }

      getEditorLock().activate(editController);
      $(activeCellNode).addClass("editable");

      // don't clear the cell if a custom editor is passed through
      if (!editor && options.clearCellBeforeEdit) {
        activeCellNode.innerHTML = "";
      }

      var info = __extend({}, options.editorOptions, columnDef.editorOptions, rowMetadata && rowMetadata.editorOptions, columnMetadata && columnMetadata.editorOptions, {
        grid: self,
        gridPosition: getGridPosition(),
        position: getActiveCellPosition(),
        container: activeCellNode,
        column: columnDef,
        item: item || {},
        rowMetadata: rowMetadata,
        columnMetadata: columnMetadata,
        commitChanges: commitEditAndSetFocus,
        cancelChanges: cancelEditAndSetFocus
      });
      /* jshint -W056 */     //! jshint : bad constructor
      currentEditor = new (editor || getEditor(activeRow, activeCell))(info);
      /* jshint +W056 */

      // assert that the complete editor API is available:
      assert(currentEditor);
      assert(typeof currentEditor.init === "function");
      assert(typeof currentEditor.destroy === "function");
      assert(typeof currentEditor.focus === "function");
      assert(typeof currentEditor.setDirectValue === "function");
      assert(typeof currentEditor.loadValue === "function");
      assert(typeof currentEditor.serializeValue === "function");
      assert(typeof currentEditor.applyValue === "function");
      assert(typeof currentEditor.isValueChanged === "function");
      assert(typeof currentEditor.validate === "function");
      assert(typeof currentEditor.save === "function");
      assert(typeof currentEditor.cancel === "function");
      assert(typeof currentEditor.hide === "function");
      assert(typeof currentEditor.show === "function");
      assert(typeof currentEditor.position === "function");

      if (item) {
        currentEditor.loadValue(item);
      }

      serializedEditorValue = currentEditor.serializeValue();

      var cellBox = getActiveCellPosition();
      if (!cellBox.visible) {
        currentEditor.hide();
      } else {
        currentEditor.show();
        currentEditor.focus();
        assert(document.activeElement !== document.body);
      }
      // old code for this chunk was:         handleActiveCellPositionChange();

      return currentEditor; // this is a truthy return value
    }

    function commitEditAndSetFocus() {
      // if the commit fails, it would do so due to a validation error
      // if so, do not steal the focus from the editor
      if (getEditorLock().commitCurrentEdit()) {
        setFocus();
      }
    }

    function cancelEditAndSetFocus() {
      if (getEditorLock().cancelCurrentEdit()) {
        setFocus();
      }
    }

    function getActiveCellPosition() {
      return Slick.BoxInfo(activeCellNode);
    }

    function getGridPosition() {
      return Slick.BoxInfo($container[0]);
    }

    function handleActiveCellPositionChange(evt) {
      if (!activeCellNode) {
        return;
      }

      var e = new Slick.EventData(evt);
      trigger(self.onActiveCellPositionChanged, {}, e);
      if (e.isHandled()) {
        return;
      }

      if (currentEditor) {
        var cellBox = getActiveCellPosition();
        if (currentEditor.show && currentEditor.hide) {
          if (!cellBox.visible) {
            currentEditor.hide();
          } else {
            currentEditor.show();
          }
        }

        if (currentEditor.position) {
          currentEditor.position({
            gridPosition: getGridPosition(),
            position: cellBox,
            container: activeCellNode
          });
        }
      }
    }

    function getCellEditor() {
      return currentEditor;
    }

    function getActiveCell() {
      if (!activeCellNode) {
        return null;
      } else {
        return {
          row: activeRow, 
          cell: activeCell
        };
      }
    }

    function getActiveCellNode() {
      return activeCellNode;
    }

    function scrollRowIntoView(row, doPaging, doCenteringY) {
      // Clip `row` to renderable range:
      // assert(row >= 0);
      // assert(row < getDataLengthIncludingAddNew());
      row = Math.min(getDataLengthIncludingAddNew(), Math.max(0, row));

      var height = viewportH - (viewportHasHScroll ? scrollbarDimensions.height : 0);
      var rowAtTop = getRowTop(row);
      var rowAtBottom = getRowBottom(row) - height;

      // need to center row?
      if (doCenteringY) {
        var centerOffset = (height - options.rowHeight) / 2;
        if (scrollTo(rowAtTop - centerOffset, null)) {
          render();
        }
      }
      // need to page down?
      if (getRowBottom(row) > scrollTop + viewportH + pageOffset) {
        if (scrollTo((doPaging ? rowAtTop : rowAtBottom), null)) {
          render();
        }
      }
      // or page up?
      else if (getRowTop(row) < scrollTop + pageOffset) {
        if (scrollTo((doPaging ? rowAtBottom : rowAtTop), null)) {
          render();
        }
      }
    }

    function scrollRowToTop(row) {
      // Clip `row` to renderable range:
      assert(row >= 0);
      assert(row < getDataLengthIncludingAddNew());
      row = Math.min(getDataLengthIncludingAddNew(), Math.max(0, row));

      if (scrollTo(getRowTop(row), null)) {
        render();
      }
    }

    function scrollRowToCenter(row) {
      // Clip `row` to renderable range:
      assert(row >= 0);
      assert(row < getDataLengthIncludingAddNew());
      row = Math.min(getDataLengthIncludingAddNew(), Math.max(0, row));

      // TODO: account for the variable row height: actually measure to determine the offset towards the center
      var height = viewportH - (viewportHasHScroll ? scrollbarDimensions.height : 0);
      var offset = (height - options.rowHeight) / 2;
      if (scrollTo(row * options.rowHeight - offset, null)) {
        render();
      }
    }

    function scrollPage(dir) {
      var topRow = getRowWithFractionFromPosition(scrollTop + pageOffset, false);
      var bottomRow = getRowWithFractionFromPosition(scrollTop + pageOffset + viewportH, false);
      var deltaRows = dir * (bottomRow.position - topRow.position);
      // adjust the page positions according to the scroll direction and "speed" (`dir` can be a number other than +1 or -1):
      topRow.position += deltaRows;
      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      if (topRow.position >= dataLengthIncludingAddNew) {
        topRow.position = dataLengthIncludingAddNew - 1;
      }
      if (topRow.position < 0) {
        topRow.position = 0;
      }
      assert(topRow.position >= 0);
      var y = getRowTop(topRow.position);
      if (scrollTo(y, null)) {
        render();
      }

      if (options.enableCellNavigation && activeRow != null) {
        var row = activeRow + deltaRows;
        if (row >= dataLengthIncludingAddNew) {
          row = dataLengthIncludingAddNew - 1;
        }
        if (row < 0) {
          row = 0;
        }

        var cell = 0, prevCell = -1;
        var prevActivePosX = activePosX;
        while (cell <= activePosX) {
          if (canCellBeActive(row, cell)) {
            prevCell = cell;
          }
          cell += getColspan(row, cell);
        }

        if (prevCell !== -1) {
          var node = getCellNode(row, prevCell, true);
          assert(node);
          setActiveCellInternal(node, {
            forceEditMode: null, 
            takeFocus: false
          });
          activePosX = prevActivePosX;
        } else {
          resetActiveCell();
        }
      }
    }

    function navigatePageDown() {
      scrollPage(1);
    }

    function navigatePageUp() {
      scrollPage(-1);
    }

    function getSpans(row, cell) {
      if (!data.getItemMetadata) {
        return null;
      }
      var col,
          colspan,
          rowspan,
          metadata,
          columnData,
          iRowSpans,
          iCellSpans,
          colCount = columns.length,
          dataLength = getDataLength(),
          rowI,
          rowU;

      for (rowI = cellSpans.length, rowU = row; rowI <= rowU; rowI++) {
        metadata = data.getItemMetadata(rowI, cell);

        // current row might have cell spans filled in prev row iterations
        iRowSpans = cellSpans[rowI] || (cellSpans[rowI] = {
          maxRowSpan: 1
        });

        if (!metadata || !metadata.columns) {
          continue;
        }

        for (var ci = 0; ci < colCount; ci += colspan) {
          col = columns[ci];

          iCellSpans = iRowSpans[ci];

          // the ci-th cell is occupied by a prev cell with row and/or cell span > 1
          if (iCellSpans) {
            colspan = ci - iCellSpans.cell + iCellSpans.colspan;
            continue;
          }

          // look up by id, then index
          columnData = metadata.columns[col.id] || metadata.columns[ci];
          if (!columnData) {
            colspan = 1;
            continue;
          }

          colspan = columnData.colspan || 1;
          rowspan = columnData.rowspan || 1;
          if (rowspan > dataLength - rowI) {
            rowspan = dataLength - rowI;
          }
          if (colspan === "*") {
            colspan = colCount - ci;
          }
          if (rowspan > iRowSpans.maxRowSpan) {
            iRowSpans.maxRowSpan = rowspan;
          }

          if (rowspan > 1 || colspan > 1) {
            iCellSpans = {
              row: rowI, 
              cell: ci, 
              rowspan: rowspan, 
              colspan: colspan
            };
            // save pointers to span head cell and
            var rowSpanU = rowI + rowspan - 1;
            for (var rs = rowI; rs <= rowSpanU; rs++) {
              for (var cs = ci; cs < ci + colspan; cs++) {
                (cellSpans[rs] || (cellSpans[rs] = {
                  maxRowSpan: rowSpanU - rowI + 1
                }))[cs] = iCellSpans;
              }
            }
            // need to collect spans for rows overlapped by the cell
            if (rowSpanU > rowU) {
              rowU = rowSpanU;
            }
          }
        }
      }

      return cellSpans[row] && cellSpans[row][cell];
    }

    function getColspan(row, cell) {
      var spans = getSpans(row, cell);
      assert(spans ? spans.colspan >= 1 : true);
      return spans ? spans.colspan - cell + spans.cell : 1;
    }

    function getRowspan(row, cell) {
      var spans = getSpans(row, cell);
      assert(spans ? spans.rowspan >= 1 : true);
      return spans ? spans.rowspan - row + spans.row : 1;
    }

    /** Returns the row index of the cell that spans to the cell specified by `row` and `cell`. */
    function getSpanRow(row, cell) {
      var spans = getSpans(row, cell);
      return spans ? spans.row : row;
    }

    /** Returns the column index of the cell that spans to the cell specified by `row` and `cell`. */
    function getSpanCell(row, cell) {
      var spans = getSpans(row, cell);
      return spans ? spans.cell : cell;
    }

    function gotoRight(row, cell, posY, posX) {
      if (row == null || cell == null) {
        assert(0);
        return null;
      }
      assert(posY != null);
      assert(posX != null);

      var lastCell = columns.length - 1;
      var spanRow, endCell;
      var spans;

      row = posY;
      assert(row >= 0);
      assert(cell >= 0);
      assert(cell <= lastCell);
      
      // In the beginning, we may be at a cell that's midway in a span: skip the span we're currently at
      endCell = cell;
      spans = getSpans(row, cell);
      if (spans) {
        assert(cell >= spans.cell);
        endCell = spans.cell + spans.colspan - 1;
      }
      // Find next focusable cell in this row
      for (cell = endCell + 1; cell <= lastCell; cell = endCell + 1) {
        spanRow = row;
        endCell = cell;
        spans = getSpans(row, cell);
        if (spans) {
          spanRow = spans.row;
          assert(cell === spans.cell);
          endCell = spans.cell + spans.colspan - 1;
        }
        if (canCellBeActive(spanRow, cell)) {
          // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
          return {
            row: spanRow,
            cell: cell,
            posY: posY,
            posX: cell
          };
        }
      }
      return null;
    }

    function gotoLeft(row, cell, posY, posX) {
      if (row == null || cell == null) {
        assert(0);
        return null;
      }
      assert(posY != null);
      assert(posX != null);

      var spanRow, spanCell;
      var spans;

      row = posY;      
      assert(row >= 0);
      assert(cell >= 0);
      assert(cell < columns.length);

      // In the beginning, we may be at a cell that's midway in a span: skip the span we're currently at
      spanCell = cell;
      spans = getSpans(row, cell);
      if (spans) {
        assert(cell >= spans.cell);
        spanCell = spans.cell;
      }
      // Find next focusable cell in this row
      for (cell = spanCell - 1; cell >= 0; cell = spanCell - 1) {
        spanRow = row;
        spanCell = cell;
        spans = getSpans(row, cell);
        if (spans) {
          spanRow = spans.row;
          spanCell = spans.cell;
        }
        if (canCellBeActive(spanRow, spanCell)) {
          // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
          return {
            row: spanRow,
            cell: spanCell,
            posY: posY,
            posX: spanCell
          };
        }
      }
      return null;
    }

    function gotoDown(row, cell, posY, posX) {
      if (row == null || cell == null) {
        assert(0);
        return null;
      }
      assert(posY != null);
      assert(posX != null);

      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      var spanCell, endRow;
      var spans;
      
      cell = posX;
      assert(row >= 0);
      assert(row < dataLengthIncludingAddNew);
      assert(cell >= 0);
      assert(cell < columns.length);
      
      // In the beginning, we may be at a row that's midway in a span: skip the span we're currently at
      endRow = row;
      spans = getSpans(row, cell);
      if (spans) {
        assert(row >= spans.row);
        endRow = spans.row + spans.rowspan - 1;
      }
      // Find next focusable row in this column
      for (row = endRow + 1; row < dataLengthIncludingAddNew; row = endRow + 1) {
        endRow = row;
        spanCell = cell;
        spans = getSpans(row, cell);
        if (spans) {
          spanCell = spans.cell;
          assert(row === spans.row);
          endRow = spans.row + spans.rowspan - 1;
        }
        if (canCellBeActive(row, spanCell)) {
          // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
          return {
            row: row,
            cell: spanCell,         
            posY: row,
            posX: posX 
          };
        }
      }
      return null;
    }

    function gotoUp(row, cell, posY, posX) {
      if (row == null || cell == null) {
        assert(0);
        return null;
      }
      assert(posY != null);
      assert(posX != null);

      var spanRow, spanCell;
      var spans;

      cell = posX;      
      assert(row >= 0);
      assert(cell >= 0);
      assert(cell < columns.length);

      // In the beginning, we may be at a row that's midway in a span: skip the span we're currently at
      spanRow = row;
      spans = getSpans(row, cell);
      if (spans) {
        assert(row >= spans.row);
        spanRow = spans.row;
      }
      // Find next focusable row in this column
      for (row = spanRow - 1; row >= 0; row = spanRow - 1) {
        spanRow = row;
        spanCell = cell;
        spans = getSpans(row, cell);
        if (spans) {
          spanRow = spans.row;
          spanCell = spans.cell;
        }
        if (canCellBeActive(spanRow, spanCell)) {
          // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
          return {
            row: spanRow,
            cell: spanCell,
            posY: spanRow,
            posX: posX
          };
        }
      }
      return null;
    }

    function gotoNext(row, cell, posY, posX) {
      var origRow = row, origCell = cell;

      if (row == null && cell == null) {
        row = cell = posY = posX = 0;
      }
      assert(posY != null);
      assert(posX != null);

      var lastCell = columns.length - 1;
      var spanRow, endCell;
      var spans;

      // Scan right, then down, to find the next focusable grid cell.
      // Wrap at the end.
      // 
      // Note: we loop length PLUS ONE lines, because worst case 
      // we may find the "next" focusable cell on the same line we
      // currently are, but just *left* of us!
      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      row = posY;
      cell = posX;
      assert(row >= 0);
      assert(cell >= 0);
      assert(cell <= lastCell);
      
      // In the beginning, we may be at a cell that's midway in a span: skip the span we're currently at
      endCell = cell;
      spans = getSpans(row, cell);
      if (spans) {
        assert(cell >= spans.cell);
        endCell = spans.cell + spans.colspan - 1;
      }
      for (var i = 0; i <= dataLengthIncludingAddNew; i++) {
        //var pos = gotoRight(posY, cell, posY, posX);
        // Find next focusable cell in this row
        for (cell = endCell + 1; cell <= lastCell; cell = endCell + 1) {
          spanRow = row;
          endCell = cell;
          spans = getSpans(row, cell);
          if (spans) {
            spanRow = spans.row;
            assert(cell === spans.cell);
            endCell = spans.cell + spans.colspan - 1;
          }
          if (!(spanRow === origRow && cell === origCell) && canCellBeActive(spanRow, cell)) {
            // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
            return {
              row: spanRow,
              cell: cell,
              posY: posY,
              posX: cell
            };
          }
        }
        // Scan from the start of the next line & wrap at end if we have to
        cell = posX = 0;
        row = posY = (posY + 1) % dataLengthIncludingAddNew;
        // Check the first cell on this new row:
        spanRow = row;
        endCell = cell;
        spans = getSpans(row, cell);
        if (spans) {
          spanRow = spans.row;
          assert(cell === spans.cell);
          endCell = spans.cell + spans.colspan - 1;
        }
        if (!(spanRow === origRow && cell === origCell) && canCellBeActive(spanRow, cell)) {
          // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
          return {
            row: spanRow,
            cell: cell,
            posY: posY,
            posX: cell
          };
        }
      }
      return null;
    }

    function gotoPrev(row, cell, posY, posX) {
      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      var lastCol = columns.length - 1;
      
      var origRow = row, origCell = cell;

      if (row == null && cell == null) {
        row = posY = dataLengthIncludingAddNew - 1;
        cell = posX = lastCol;
      }
      assert(posY != null);
      assert(posX != null);

      var spanRow, spanCell;
      var spans;

      // Scan left, then up, to find the previous focusable grid cell.
      // Wrap at the top.
      // 
      // Note: we loop length PLUS ONE lines, because worst case 
      // we may find the "previous" focusable cell on the same line we
      // currently are, but just *right* of us!
      row = posY;
      cell = posX;      
      assert(row >= 0);
      assert(cell >= 0);
      assert(cell < columns.length);

      // In the beginning, we may be at a cell that's midway in a span: skip the span we're currently at
      spanCell = cell;
      spans = getSpans(row, cell);
      if (spans) {
        assert(cell >= spans.cell);
        spanCell = spans.cell;
      }
      for (var i = 0; i <= dataLengthIncludingAddNew; i++) {
        // Find next focusable cell in this row
        for (cell = spanCell - 1; cell >= 0; cell = spanCell - 1) {
          spanRow = row;
          spanCell = cell;
          spans = getSpans(row, cell);
          if (spans) {
            spanRow = spans.row;
            spanCell = spans.cell;
          }
          if (!(spanRow === origRow && spanCell === origCell) && canCellBeActive(spanRow, spanCell)) {
            // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
            return {
              row: spanRow,
              cell: spanCell,
              posY: posY,
              posX: spanCell
            };
          }
        }
        // Scan from the end of the previous line & wrap at top if we have to
        cell = posX = lastCol;
        row = posY = (posY - 1 + dataLengthIncludingAddNew) % dataLengthIncludingAddNew;
        // Check the last cell on this new row:
        spanRow = row;
        spanCell = cell;
        spans = getSpans(row, cell);
        if (spans) {
          spanRow = spans.row;
          spanCell = spans.cell;
        }
        if (!(spanRow === origRow && spanCell === origCell) && canCellBeActive(spanRow, spanCell)) {
          // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
          return {
            row: spanRow,
            cell: spanCell,
            posY: posY,
            posX: spanCell
          };
        }
      }
      return null;
    }

    function gotoEnd(row, cell, posY, posX) {
      var origRow = row, origCell = cell;

      var dataLengthIncludingAddNew = getDataLengthIncludingAddNew();
      var lastRow = dataLengthIncludingAddNew - 1;
      var lastCol = columns.length - 1;

      row = posY = lastRow;
      cell = posX = lastCol;
      var spans = getSpans(row, cell);
      if (spans) {
        row = spans.row;
        cell = spans.cell;
      }
      // The returned (row, cell) coordinate MUST be the top/left corner of the cell span:
      var pos = {
        row: row,
        cell: cell,
        posY: posY,
        posX: posX
      };
      // no change: do not end up once again where we already are right now.
      if (!(pos.row === origRow && pos.cell === origCell) && canCellBeActive(row, cell)) {
        return pos;
      }
      return null;
    }

    function gotoHome(row, cell, posY, posX) {
      var origRow = row, origCell = cell;

      row = posY = 0;
      cell = posX = 0;
      // no need to call getSpans(0, 0) as it top/left corner will be (0, 0) no matter what col/rowspan it has.
      var pos = {
        row: row,
        cell: cell,
        posY: posY,
        posX: posX
      };
      // no change: do not end up once again where we already are right now.
      if (!(pos.row === origRow && pos.cell === origCell) && canCellBeActive(row, cell)) {
        return pos;
      }
      return null;
    }

    function navigateRight() {
      return navigate(NAVIGATE_RIGHT);
    }

    function navigateLeft() {
      return navigate(NAVIGATE_LEFT);
    }

    function navigateDown() {
      return navigate(NAVIGATE_DOWN);
    }

    function navigateUp() {
      return navigate(NAVIGATE_UP);
    }

    function navigateNext() {
      return navigate(NAVIGATE_NEXT);
    }

    function navigatePrev() {
      return navigate(NAVIGATE_PREV);
    }

    function navigateHome() {
      return navigate(NAVIGATE_HOME);
    }

    function navigateEnd() {
      return navigate(NAVIGATE_END);
    }

    /**
     * @param {string} dir Navigation direction.
     * @return {boolean} Whether navigation resulted in a change of active cell.
     */
    function navigate(dir) {
      if (!options.enableCellNavigation) {
        return false;
      }

      if (!activeCellNode && dir !== NAVIGATE_PREV && dir !== NAVIGATE_NEXT && dir !== NAVIGATE_HOME && dir !== NAVIGATE_END) {
if (0) {
        // See if a cell has focus and if so, use that one to base the move on;
        // otherwise simply scroll in the indicated direction if possible.
        assert(!activeCell);
        assert(!activeRow);
        assert(!getEditorLock().isActive());
        var focusedNode = getCellFromElement(document.activeElement);
        if (focusedNode) {
          setActiveCellInternal(focusedNode, {
            forceEditMode: null, 
            takeFocus: false
          });
          assert(activeCellNode);
          // and continue with the regular execution path for activeCellNode
        } else {
          // WARNING: the stepFunctions assume a starting coordinate to be valid
          // to that they can properly step through the col/rowspans. 
          // Today we are not located on a cell per se, so we simply move a
          // given number of rows/columns in the indicated direction.
          var visible = getVisibleRange();
          assert(visible);
          var left = getCellFromPoint(visible.topPx, visible.leftPx);
          var right = getCellFromPoint(visible.topPx, visible.rightPx);
          var row, cell;
          switch (dir) {
          case NAVIGATE_UP:
            row = visible.top - 1;
            if (row >= 0) {
              scrollRowIntoView(row, false, false);
            }
            break;

          case NAVIGATE_DOWN:
            row = visible.bottom + 1;
            if (row >= 0) {
              scrollRowIntoView(row, false, false);
            }
            visible.top += 1;
            visible.bottom += 1;
            break;

          case NAVIGATE_LEFT:
            visible.left -= 1;
            visible.right -= 1;
            break;

          case NAVIGATE_RIGHT:
            visible.left += 1;
            visible.right += 1;
            break;

          default:
            assert(0);
            break;
          }



        }
}

        return false;
      }

      if (!getEditorLock().commitCurrentEdit()) {
        return true;
      }

      tabbingDirection = tabbingDirections[dir];
      setFocus();

      var node;
      var stepFn = stepFunctions[dir];
      assert(activeRow != null);
      assert(activeCell != null);
      assert(activePosY != null);
      assert(activePosX != null);
      var pos = stepFn(activeRow, activeCell, activePosY, activePosX);
      if (pos) {
        assert(pos.row != null);
        assert(pos.cell != null);
        assert(pos.posX != null);
        assert(pos.posY != null);
        activePosY = pos.posY;
        activePosX = pos.posX;
        var isAddNewRow = (pos.row === getDataLength());
        scrollCellIntoView(pos.row, pos.cell, !isAddNewRow);
        node = getCellNode(pos.row, pos.cell, true);
        assert(node);
        setActiveCellInternal(node, {
          forceEditMode: null, 
          takeFocus: false
        });
        return true;
      } else if (activeCellNode) {
        node = getCellNode(activeRow, activeCell, true);
        assert(node);
        setActiveCellInternal(node, {
          forceEditMode: null, 
          takeFocus: false
        });
        return false;
      } else {
        assert(activeRow == null && activeCell == null);
        resetActiveCell();
        return false;
      }
    }

    var callCount = 0;

    /**
     * Get a reference to the grid cell DOM element. When the DOM element exists,
     * it will refreshed on the spot if it has been invalidated (i.e. flagged "dirty")
     * before.
     *
     * @param  {number} row       The row index
     * @param  {number} cell      The column index
     * @param  {boolean} mandatory When TRUE, the cell will be rendered on the spot if it hasn't been rendered yet.
     *
     * @return {Element}          The DOM Element which represents the grid node at coordinates (row, cell). NULL when the given coordinate has not been rendered yet or does not exist for other reasons (e.g. when the given coordinate is located outside the data range or when the given coordinate sits inside a row/colspanning cell and isn't its top/left corner coordinate).
     */
    function getCellNode(row, cell, mandatory) {
      callCount++;
      assert(callCount === 1);
      var cacheEntry = rowsCache[row];
      if (cacheEntry || mandatory) {
        ensureCellNodesInRowsCache(row);
        var node = cacheEntry && cacheEntry.cellNodesByColumnIdx[cell];
        var dirty = cacheEntry && cacheEntry.dirtyCellNodes[cell];

        var needToReselectCell = false;
        if (!node && mandatory) {
          // force render the new active cell
          // 
          // WARNING: under rare circumstances may the renderer *still* decide *not* to render
          // the grid (e.g. when a custom/user onRenderStart event handler decides to signal 
          // that rendering is currently undesirable) hence we MUST anticipate the unlikely
          // situation where the rowCache will be empty after the next call!
          needToReselectCell = forcedRenderCriticalCell(row, cell);

          // and then attempt fetching the DOM node again:
          assert(rowsCache[row]);
          if (rowsCache[row]) {
            assert(rowsCache[row].cellNodesByColumnIdx);
            assert(rowsCache[row].cellNodesByColumnIdx.length > cell);
            node = rowsCache[row].cellNodesByColumnIdx[cell];
            assert(node);
            if (needToReselectCell) {
              assert(rowsCache[activeRow]);
              assert(rowsCache[activeRow].cellNodesByColumnIdx);
              assert(rowsCache[activeRow].cellNodesByColumnIdx.length > activeCell);
              activeCellNode = getCellNode(activeRow, activeCell, true);
              assert(activeCellNode);
            }
          } else {
            node = null;
          }
        } else if (dirty) {
          assert(node);
          updateCellInternal(row, cell, cacheEntry, node);
        }
        callCount--;
        return node;
      }
      assert(!mandatory);
      callCount--;
      return null;
    }

    function setActiveCell(row, cell, cfg) {
      cfg = cfg || {};

      if (!initialized) { return; }
      // catch NaN, undefined, etc. row/cell values by inclusive checks instead of exclusive checks:
      if (cellExists(row, cell)) {
        if (!options.enableCellNavigation) {
          return;
        }

        scrollCellIntoView(row, cell, false);
        var node = getCellNode(row, cell, true);
        assert(node);
        setActiveCellInternal(node, cfg);
      }
    }

    function canCellBeActive(row, cell) {
      // catch NaN, undefined, etc. row/cell values by inclusive checks instead of exclusive checks:
      if (options.enableCellNavigation && row < getDataLengthIncludingAddNew() && row >= 0 && cell < columns.length && cell >= 0) {
        var column = columns[cell];
        var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);
        if (rowMetadata) {
          var columnMetadata = rowMetadata.columns;
          // look up by id, then index
          columnMetadata = columnMetadata && (columnMetadata[column.id] || columnMetadata[cell]);
          if (columnMetadata) {
            if (columnMetadata.transparent) {
              return false;
            }
            if (columnMetadata.focusable != null) {
              return columnMetadata.focusable;
            }
          }

          if (rowMetadata.focusable != null) {
            return rowMetadata.focusable;
          }
        }

        return column.focusable;
      }
      return false;
    }

    function canCellBeSelected(row, cell) {
      // catch NaN, undefined, etc. row/cell values by inclusive checks instead of exclusive checks:
      if (cellExists(row, cell)) {
        var rowMetadata = data.getItemMetadata && data.getItemMetadata(row, cell);
        if (rowMetadata && rowMetadata.selectable != null) {
          return rowMetadata.selectable;
        }

        var column = columns[cell];
        // look up by id, then index
        var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[column.id] || rowMetadata.columns[cell]);
        if (columnMetadata && columnMetadata.selectable != null) {
          return columnMetadata.selectable;
        }

        return column.selectable;
      }
      return false;
    }

    function gotoCell(row, cell, cfg) {
      cfg = cfg || {};

      if (!initialized) { return; }
      if (!canCellBeActive(row, cell)) {
        return;
      }

      if (!getEditorLock().commitCurrentEdit()) {
        return;
      }

      scrollCellIntoView(row, cell, false);

      var newCellNode = getCellNode(row, cell, true);
      assert(newCellNode);

      // if selecting the "add new" row, start editing right away
      setActiveCellInternal(newCellNode, cfg);

      // if no editor was created, set the focus back on the grid
      if (!elementHasFocus($container[0]) && !currentEditor) {
        setFocus();
      }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // IEditor implementation for the editor lock

    function commitCurrentEdit() {
      var item = getDataItem(activeRow);
      var column = columns[activeCell];
      var evt;

      if (currentEditor) {
        if (currentEditor.isValueChanged()) {
          var validationResults = currentEditor.validate();

          if (validationResults.valid) {
            if (activeRow < getDataLength()) {
              assert(item);
              evt = self.onCellChange;
            } else {
              item = item || {};
              evt = self.onAddNewRow;
            }
            var editCommand = {
              grid: self,
              row: activeRow,
              cell: activeCell,
              item: item,
              column: column,
              editor: currentEditor,
              serializedValue: currentEditor.serializeValue(),
              prevSerializedValue: serializedEditorValue,
              execute: function h_exec_edit_cmd_f() {
                this.appliedValue = this.serializedValue;
                this.editor.applyValue(item, this.appliedValue);
                updateCell(this.row, this.cell);
                this.notify();
              },
              undo: function h_undo_edit_cmd_f() {
                this.appliedValue = this.prevSerializedValue;
                this.editor.applyValue(item, this.appliedValue);
                updateCell(this.row, this.cell);
                this.notify();
              },
              notify: function h_notify_edit_cmd_f() {
                trigger(evt, this);
              }
            };

            if (options.editCommandHandler) {
              options.editCommandHandler(item, column, editCommand);
            } else {
              editCommand.execute();
            }
            makeActiveCellNormal();

            // check whether the lock has been re-acquired by event handlers
            return !getEditorLock().isActive();
          } else {
            // Re-add the CSS class to trigger transitions, if any.
            assert(activeCellNode);
            var $activeCellNode = $(activeCellNode);
            $activeCellNode.removeClass("invalid");
            $activeCellNode.outerWidth();  // force layout
            $activeCellNode.addClass("invalid");

            var e = new Slick.EventData();
            var retval = trigger(self.onValidationError, {
              row: activeRow,
              cell: activeCell,
              item: item,
              column: column,
              editor: currentEditor,
              prevSerializedValue: serializedEditorValue,

              cellNode: activeCellNode,
              validationResults: validationResults
            }, e);
            if (e.isHandled()) {
              return retval;
            }

            currentEditor.focus();
            assert(document.activeElement !== document.body);
            return false;
          }
        }

        makeActiveCellNormal();
      }
      return true;
    }

    function cancelCurrentEdit() {
      makeActiveCellNormal();
      return true;
    }

    function rowsToRanges(rows) {
      var ranges = [];
      var lastCell = columns.length - 1;
      for (var i = 0, len = rows.length; i < len; i++) {
        ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
      }
      return ranges;
    }

    function getSelectedRows() {
      if (!selectionModel) {
        throw new Error("Selection model is not set");
      }
      return selectedRows;
    }

    function setSelectedRows(rows) {
      if (!selectionModel) {
        throw new Error("Selection model is not set");
      }
      selectionModel.setSelectedRanges(rowsToRanges(rows));
    }
    
    function scrollPort(pxVertical, pxHorizontal) {
      if (scrollTo(pxVertical, pxHorizontal)) {
        render();
      }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // Debug

    //
    // --STRIP-THIS-CODE--START--
    //
    /* jshint -W061 */     //! jshint : eval can be harmful

    this.debug = function ($dst) {
      var s = "";

      s += ("\n" + "counter_rows_rendered:  " + counter_rows_rendered);
      s += ("\n" + "counter_rows_removed:  " + counter_rows_removed);
      s += ("\n" + "renderedRows:  " + renderedRows);
      s += ("\n" + "maxSupportedCssHeight:  " + maxSupportedCssHeight);
      s += ("\n" + "n(umber of pages):  " + numberOfPages);
      s += ("\n" + "(current) page:  " + page);
      s += ("\n" + "page height (pageHeight):  " + pageHeight);
      s += ("\n" + "vScrollDir:  " + vScrollDir);

      if ($dst) {
        $dst.text(s);
      } else {
        alert(s);
      }
    };

    // a debug helper to be able to access private members
    this.eval = function (expr) {
      return eval(expr);
    };

    /* jshint +W061 */
    //
    // --STRIP-THIS-CODE--END--
    //

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Public API

    __extend(this, {
      "slickGridVersion": "2.2",

      // Events
      "onScroll": new Slick.Event(),
      "onSort": new Slick.Event(),
      "onHeaderMouseEnter": new Slick.Event(),
      "onHeaderMouseLeave": new Slick.Event(),
      "onHeaderContextMenu": new Slick.Event(),
      "onHeaderClick": new Slick.Event(),
      "onHeaderDblClick": new Slick.Event(),
      "onHeaderCellRendered": new Slick.Event(),
      "onBeforeHeaderCellDestroy": new Slick.Event(),
      "onHeaderRowCellRendered": new Slick.Event(),
      "onBeforeHeaderRowCellDestroy": new Slick.Event(),
      "onFooterRowCellRendered": new Slick.Event(),
      "onBeforeFooterRowCellDestroy": new Slick.Event(),
      "onFocusIn": new Slick.Event(),
      "onFocusOut": new Slick.Event(),
      "onFocusMoved": new Slick.Event(),
      "onFocusSet": new Slick.Event(),
      "onMouseEnter": new Slick.Event(),
      "onMouseLeave": new Slick.Event(),
      "onClick": new Slick.Event(),
      "onDblClick": new Slick.Event(),
      "onContextMenu": new Slick.Event(),
      "onKeyDown": new Slick.Event(),
      "onAddNewRow": new Slick.Event(),
      "onValidationError": new Slick.Event(),
      "onInvalidate": new Slick.Event(),
      "onCanvasWidthChanged": new Slick.Event(),
      "onViewportChanged": new Slick.Event(),
      "onColumnsStartReorder": new Slick.Event(),
      "onColumnsReordering": new Slick.Event(),
      "onColumnsReordered": new Slick.Event(),
      "onColumnsStartResize": new Slick.Event(), // onColumnsResizeStart
      "onColumnsResizing": new Slick.Event(),
      "onColumnsResized": new Slick.Event(),
      "onColumnCalcWidth": new Slick.Event(),
      "onColumnsChanged": new Slick.Event(),
      "onCellChange": new Slick.Event(),
      "onBeforeEditCell": new Slick.Event(),
      "onBeforeCellEditorDestroy": new Slick.Event(),
      "onAfterInit": new Slick.Event(),
      "onBeforeDestroy": new Slick.Event(),
      "onActiveCellChanging": new Slick.Event(),
      "onActiveCellChanged": new Slick.Event(),
      "onActiveCellPositionChanged": new Slick.Event(),
      "onHeaderDragInit": new Slick.Event(),
      "onHeaderDragStart": new Slick.Event(),
      "onHeaderDrag": new Slick.Event(),
      "onHeaderDragEnd": new Slick.Event(),
      "onDragInit": new Slick.Event(),
      "onDragStart": new Slick.Event(),
      "onDrag": new Slick.Event(),
      "onDragEnd": new Slick.Event(),
      "onSelectedRowsChanged": new Slick.Event(),
      "onCellCssStylesChanged": new Slick.Event(),
      "onRowsRendered": new Slick.Event(),
      "onRenderStart": new Slick.Event(),
      "onRenderEnd": new Slick.Event(),

      // Methods
      "registerPlugin": registerPlugin,
      "unregisterPlugin": unregisterPlugin,
      "getId": getId,
      "getColumnsInfo": getColumnsInfo,
      "getColumns": getColumns,
      "setColumns": setColumns,
      "updateColumnWidths": updateColumnWidths,
      "getLeafColumns": getLeafColumns,
      "getColumnIndex": getColumnIndex,
      "updateColumnHeader": updateColumnHeader,
      "setSortColumn": setSortColumn,
      "setSortColumns": setSortColumns,
      "getSortColumns": getSortColumns,
      "autosizeColumns": autosizeColumns,
      "setupColumnResize": setupColumnResize,
      "getOptions": getOptions,
      "setOptions": setOptions,
      "getData": getData,
      "getDataLength": getDataLength,
      "getDataItem": getDataItem,
      "setData": setData,
      "getSelectionModel": getSelectionModel,
      "setSelectionModel": setSelectionModel,
      "getSelectedRows": getSelectedRows,
      "setSelectedRows": setSelectedRows,
      "getContainerNode": getContainerNode,
      "getDataItemValueForColumn": getDataItemValueForColumn,
      "setDataItemValueForColumn": setDataItemValueForColumn,
      "getCellValueAndInfo": getCellValueAndInfo,
      "isInitialized": isInitialized,

      "render": render,
      "forcedRender": forcedRender,
      "isRenderPending": isRenderPending,
      "invalidate": invalidate,
      "invalidateCell": invalidateCell,
      "invalidateCellSpan": invalidateCellSpan,
      "invalidateColumn": invalidateColumn,
      "invalidateColumns": invalidateColumns,
      "invalidateRow": invalidateRow,
      "invalidateRows": invalidateRows,
      "invalidateAllRows": invalidateAllRows,
      "invalidateAllPostProcessingResults": invalidateAllPostProcessingResults,
      "updateCell": updateCell,
      "updateRow": updateRow,
      "getCachedRowRangeInfo": getCachedRowRangeInfo,
      "getViewport": getVisibleRange,
      "getRenderedRange": getRenderedRange,
      "getContentSize": getContentSize,
      "getVisibleSize": getVisibleSize,
      "resizeCanvas": resizeCanvas,
      "updateRowCount": updateRowCount,
      "scrollRowIntoView": scrollRowIntoView,
      "scrollRowToTop": scrollRowToTop,
      "scrollRowToCenter": scrollRowToCenter,
      "scrollCellIntoView": scrollCellIntoView,
      "scrollTo": scrollTo,
      "getCanvasNode": getCanvasNode,
      "focus": setFocus,

      "getCellFromPoint": getCellFromPoint,
      "getCellFromElement": getCellFromElement,
      "getCellFromEvent": getCellFromEvent,
      "getRowFromEvent": getRowFromEvent,
      "getActiveCell": getActiveCell,
      "setActiveCell": setActiveCell,
      "getActiveCellNode": getActiveCellNode,
      "getActiveCellPosition": getActiveCellPosition,
      "resetActiveCell": resetActiveCell,
      "editActiveCell": makeActiveCellEditable,
      "commitEditAndSetFocus": commitEditAndSetFocus,
      "cancelEditAndSetFocus": cancelEditAndSetFocus,

      "getCellEditor": getCellEditor,
      "getCellNode": getCellNode,
      "getCellNodeBox": getCellNodeBox,
      "canCellBeSelected": canCellBeSelected,
      "canCellBeActive": canCellBeActive,
      "cellExists": cellExists,
      "navigatePrev": navigatePrev,
      "navigateNext": navigateNext,
      "navigateUp": navigateUp,
      "navigateDown": navigateDown,
      "navigateLeft": navigateLeft,
      "navigateRight": navigateRight,
      "navigatePageUp": navigatePageUp,
      "navigatePageDown": navigatePageDown,
      "navigateHome": navigateHome,
      "navigateEnd": navigateEnd,
      "gotoCell": gotoCell,
      "getTopPanel": getTopPanel,
      "setTopPanelVisibility": setTopPanelVisibility,
      "setHeaderRowVisibility": setHeaderRowVisibility,
      "getHeaderRow": getHeaderRow,
      "getHeaderRowColumn": getHeaderRowColumn,
      "getHeadersColumn": getHeadersColumn,
      "setFooterRowVisibility": setFooterRowVisibility,
      "getFooterRow": getFooterRow,
      "getFooterRowColumn": getFooterRowColumn,
      "getGridPosition": getGridPosition,
      "flashCell": flashCell,
      "addCellCssStyles": addCellCssStyles,
      "setCellCssStyles": setCellCssStyles,
      "removeCellCssStyles": removeCellCssStyles,
      "getCellCssStyles": getCellCssStyles,
      "setCssRule": setCssRule,

      "handleKeyDown": handleKeyDown,

      "init": finishInitialization,
      "destroy": destroy,

      // IEditor implementation
      "getEditorLock": getEditorLock,
      "getEditController": getEditController,

      // export utility function(s)
      "scrollPort": scrollPort
    });

    init();
  }
}(jQuery));








// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
