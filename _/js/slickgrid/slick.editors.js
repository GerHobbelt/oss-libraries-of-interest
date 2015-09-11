/*jshint -W041*/  // Use '===' to compare with 'null'. (W041)

/***
 * Contains basic SlickGrid editors.
 * @module Editors
 * @namespace Slick
 *
 * Editor API:
 *
 * init()
 * destroy()
 * focus()
 * setDirectValue(val)
 * loadValue(item)
 * serializeValue()
 * applyValue(item, state)
 * isValueChanged()
 * validate()
 *
 * save()
 * cancel()
 * 
 * hide()
 * show()
 * position(position)
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    Slick: {
      Editors: {
        Text: TextEditor,
        Integer: IntegerEditor,
        Date: DateEditor,
        YesNoSelect: YesNoSelectEditor,
        Checkbox: CheckboxEditor,
        PercentComplete: PercentCompleteEditor,
        LongText: LongTextEditor,
        Float: FloatEditor,
        Percentage: PercentageEditor,
        RowMulti: RowEditor,
        ReadOnly: ReadOnlyEditor,
        Combo: SelectCellEditor,
        Color: ColorEditor,
        SelectCell: SelectCellEditor
      }
    }
  });



  function RowEditor(args) {
     var theEditor;
     var scope = this;

     this.init = function () {
        //var data = args.grid.getData();
        if (args.item.editor === undefined)
           theEditor = new ReadOnlyEditor(args);
        else
           theEditor = new (args.item.editor)(args);
      };

      this.destroy = function () {
        theEditor.destroy();
      };

      this.save = function () {
        theEditor.save();
      };

      this.cancel = function () {
        theEditor.cancel();
      };

      this.hide = function () {
        theEditor.hide();
      };

      this.show = function () {
        theEditor.show();
      };

      this.position = function (position) {
        theEditor.position(position);
      };

      this.focus = function () {
        theEditor.focus();
      };

      this.setDirectValue = function (val) {
        theEditor.setDirectValue(val);
      };

      this.loadValue = function (item) {
        theEditor.loadValue(item);
      };

      this.serializeValue = function () {
        return theEditor.serializeValue();
      };

      this.applyValue = function (item, state) {
        theEditor.applyValue(item,state);
      };

      this.isValueChanged = function () {
        return theEditor.isValueChanged();
      };

      this.validate = function () {
        return theEditor.validate();
      };

      this.init();
  }



  function TextEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type='text' class='editor-text' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === Slick.Keyboard.LEFT || e.keyCode === Slick.Keyboard.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
      defaultValue = '';
    };

    this.destroy = function () {
      $input.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $input.hide();
    };

    this.show = function () {
      $input.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function () {
      $input.focus();
    };

    this.setDirectValue = function (val) {
      if (val == null) val = "";
      defaultValue = val;
      $input.val(val);
      $input[0].defaultValue = val;
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    this.serializeValue = function () {
      return $input.val();
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      assert(defaultValue != null);
      return $input.val() != (defaultValue + "");
    };

    this.validate = function () {
      if (args.column.validator) {
        return args.column.validator($input.val());
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }



  function ReadOnlyEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<span class='editor-text-readonly' />").appendTo(args.container);
      defaultValue = '';
    };

    this.destroy = function () {
      $input.remove();
    };

    this.save = function () {
      // nada
    };

    this.cancel = function () {
      // nada
    };

    this.hide = function () {
      $input.hide();
    };

    this.show = function () {
      $input.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function () { };

    this.setDirectValue = function (val) {
      defaultValue = val;
      if (val == null) val = "";
      $input.text(val);
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    this.serializeValue = function () {
      return defaultValue; // $input.text(); -- make sure the value is NEVER changed, which might happen when it goes 'through the DOM'
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      return false;
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

function applyModifier(val, mod) {
  var m = isValidModifier(mod);
  if (!m)
    return mod;
  var dv = parseFloat(val);
  switch (m.operator) {
  case "+":
    return m.isPercent ? dv * (1 + m.value) : dv + m.value;

  case "-":
    return m.isPercent ? dv * (1 - m.value) : dv - m.value;

  case "*":
    return dv * m.value;

  case "/":
    return dv / m.value;
  }
  assert(0); // should never get here
}

function isValidModifier(v) {
  var sv = v.toString().trim();
  var ope = sv.charAt(0);
  if ("+-*/".indexOf(ope) < 0) return false;  // no good if it does not start with an operation
  sv = sv.substr(1);    //remove first char
  if (sv.indexOf('+') >= 0 || sv.indexOf('-') >= 0 || sv.indexOf('*') >= 0 || sv.indexOf('/') >= 0) return false;  // no more signs please.
  var pct = false;
  if (sv.charAt(sv.length - 1) === '%') {
    pct = true;
    sv = sv.slice(0, -1);    // remove also the % char if it is there
  }
  // what remains must be a number
  if (isNaN(sv)) return false;
  return {
    operator: ope,
    isPercent: pct,
    value: parseFloat(sv) / (pct ? 1 : 100)         // when it is a percentage, produce the equivalent perunage
  };
}

  function IntegerEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type='number' class='editor-integer' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === Slick.Keyboard.LEFT || e.keyCode === Slick.Keyboard.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
      defaultValue = 0;
    };

    this.destroy = function () {
      $input.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $input.hide();
    };

    this.show = function () {
      $input.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function () {
      $input.focus();
    };

    this.setDirectValue = function (val) {
      val = parseInt(val);
      if (isNaN(val)) val = 0;
      defaultValue = val;
      $input.val(val);
      $input[0].defaultValue = val;
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    this.serializeValue = function () {
      var v = $input.val();
      if (v === '') return 0;
      return parseInt(applyModifier(defaultValue, v), 10) || 0;
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      assert(defaultValue != null);
      return $input.val() != (defaultValue + "");
    };

    this.validate = function () {
      var val = this.serializeValue();
      if (isNaN(val) && !isValidModifier(val)) {
        return {
          valid: false,
          msg: "Please enter a valid integer"
        };
      }
	  
		if (args.editorConfig && !isNaN(args.editorConfig.minValue) && val < args.editorConfig.minValue) {
			return {
				valid: false,
				msg: 'Please enter a value no less than ' + args.editorConfig.minValue
			};
		}
		
		if (args.editorConfig && !isNaN(args.editorConfig.maxValue) && val > args.editorConfig.maxValue) {
			return {
				valid: false,
				msg: 'Please enter a value no greater than ' + args.editorConfig.maxValue
			};
		}

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  function FloatEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<INPUT type='text' class='editor-float' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === Slick.Keyboard.LEFT || e.keyCode === Slick.Keyboard.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
      defaultValue = 0;
    };

    this.destroy = function () {
      $input.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $input.hide();
    };

    this.show = function () {
      $input.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function () {
      $input.focus();
    };

    this.setDirectValue = function (val) {
      val = parseFloat(val);
      if (isNaN(val)) val = 0;
      defaultValue = val;
      $input.val(val);
      $input[0].defaultValue = val;
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    this.serializeValue = function () {
      var v = $input.val();
      if (v == '') return 0.0;
      return parseFloat(applyModifier(defaultValue, v)) || 0.0;
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      assert(defaultValue != null);
      return $input.val() != (defaultValue + "");
    };

    this.validate = function () {
      var val = $input.val();
      if (isNaN(val) && !isValidModifier(val)) {
        return {
          valid: false,
          msg: "Please enter a valid numeric value"
        };
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }


  function PercentageEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;

    function roundPerunage(v) {
      return Math.round(v * 1E6) / 1E6;
    }

    function stringToPerunage(val) {
      var multiplier = 1;
      val += "";
      if (val.charAt(val.length - 1) === '%') {
        val = val.slice(0, -1);    // remove also the % char if it is there
        multiplier = 100;
      }
      // what remains must be a number
      val = roundPerunage(parseFloat(val) / multiplier);
      if (isNaN(val)) val = 0;
      return val;
    }

    this.init = function () {
      $input = $("<INPUT type='text' class='editor-percentage' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === Slick.Keyboard.LEFT || e.keyCode === Slick.Keyboard.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
      defaultValue = '';
    };

    this.destroy = function () {
      $input.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $input.hide();
    };

    this.show = function () {
      $input.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function () {
      $input.focus();
    };

    this.setDirectValue = function (val) {
      val = stringToPerunage(val);
      val = (val * 100) + " %";
      defaultValue = val;
      $input.val(val);
      $input[0].defaultValue = val;
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    this.serializeValue = function () {
      var v = $input.val();
      if (v === '') return 0;
      var sv = stringToPerunage(defaultValue) * 100;
      return stringToPerunage(applyModifier(sv, v) / 100) || 0;
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      assert(defaultValue != null);
      return $input.val() != defaultValue;
    };

    this.validate = function () {
      var val = $input.val();
      if (val.charAt(val.length - 1) === '%') {
        val = val.slice(0, -1);    // remove also the % char if it is there
      }
      if (isNaN(val) && !isValidModifier(val)) {
        return {
          valid: false,
          msg: "Please enter a valid percentage"
        };
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }


  function DateEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;
    var calendarOpen = false;
    var imageDir = args.imagesPath || "../images";
    var dateFormat = 0;
    var detectableDateFormats = [
      "yy-mm-dd",   // ISO
      $.datepicker.ISO_8601,
      $.datepicker.COOKIE,
      $.datepicker.RFC_1036,
      $.datepicker.RFC_2822,
      $.datepicker.RFC_850,
      $.datepicker.TIMESTAMP,
      "dd-mm-yyyy",   // European
      "mm/dd/yy",     // US
      "dd-mm-yy",     // European
      $.datepicker.TICKS
    ];
    /* jshint -W069 */     //! jshint : ['...'] is better written in dot notation
    var regionSettings = $.datepicker.regional["en"] || $.datepicker.regional;
    /* jshint +W069 */
    var datepickerParseSettings = {
      shortYearCutoff: 20,
      dayNamesShort: regionSettings.dayNamesShort,
      dayNames: regionSettings.dayNames,
      monthNamesShort: regionSettings.monthNamesShort,
      monthNames: regionSettings.monthNames
    };
    var datePickerOptions = {};
    var datePickerDefaultOptions = {
      dateFormat: "yy-mm-dd",                 // this format is used for displaying the date while editing / picking it
      defaultDate: 0,                         // default date: today
      showOn: "button",
      buttonImageOnly: true,
      buttonImage: args.dateButtonImage || (imageDir + "/calendar.png"),
      buttonText: "Select date"
    };
    var datePickerFixedOptions = {
      beforeShow: function () {
        calendarOpen = true;
      },
      onClose: function () {
        calendarOpen = false;
      }
    };
    // Override DatePicker options from datePickerOptions on column definition.
    // Make sure that beforeShow and onClose events are not clobbered.
    datePickerOptions = $.extend(datePickerOptions, datePickerDefaultOptions,
      args.column.datePickerOptions, datePickerFixedOptions);

    function parseDateStringAndDetectFormat(s) {
      dateFormat = 0;
      if (s instanceof Date) {
        return s;
      }
      var fmt, d;
      for (dateFormat = 0; fmt = detectableDateFormats[dateFormat]; dateFormat++) {
        try {
          d = $.datepicker.parseDate(fmt, s, datepickerParseSettings);
          break;
        } catch (ex) {
          continue;
        }
      }
      return d || false;
    }

    this.init = function () {
      defaultValue = new Date();
      $input = $("<INPUT type='text' class='editor-date' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === Slick.Keyboard.LEFT || e.keyCode === Slick.Keyboard.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
      $input.datepicker(datePickerOptions);
      $input.outerWidth($input.outerWidth() - 18);
    };

    this.destroy = function () {
      $.datepicker.dpDiv.stop(true, true);
      $input.datepicker("hide");
      $input.datepicker("destroy");
      $input.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.show = function () {
      if (calendarOpen) {
        $.datepicker.dpDiv.stop(true, true).show();
      }
    };

    this.hide = function () {
      if (calendarOpen) {
        $.datepicker.dpDiv.stop(true, true).hide();
      }
    };

    /*
     * info: {
     *         gridPosition: getGridPosition(),
     *         position: cellBox,
     *         container: activeCellNode
     *       }
     */
    this.position = function (info) {
      if (!calendarOpen) {
        return;
      }
      if (info.position.visible) {
        $.datepicker.dpDiv
              .css("top", info.position.top + 30)
              .css("left", info.position.left);
      }
    };

    this.focus = function () {
      $input.focus();
    };

    this.setDirectValue = function (val) {
      val = parseDateStringAndDetectFormat(val); /* parseISODate() */
      if (!val) val = new Date();
      defaultValue = val;
      $input.datepicker("setDate", val);
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    this.serializeValue = function () {
      return $input.datepicker("getDate");
    };

    this.applyValue = function (item, state) {
      var fmt = detectableDateFormats[dateFormat] || detectableDateFormats[0];
      state = $.datepicker.formatDate(fmt, state); // state.format('isoDate');
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      var d = $input.datepicker("getDate");
      return !d || !defaultValue || d.getTime() != defaultValue.getTime();
    };

    this.validate = function () {
      var d = $input.datepicker("getDate");
      if (!d) {
        return {
          valid: false,
          msg: "Please enter a valid date"
        };
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }


  function YesNoSelectEditor(args) {
    var $select;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $select = $("<SELECT tabIndex='0' class='editor-yesno'><OPTION value='yes'>Yes</OPTION><OPTION value='no'>No</OPTION></SELECT>")
          .appendTo(args.container)
          .focus()
          .select();
    };

    this.destroy = function () {
      $select.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $select.hide();
    };

    this.show = function () {
      $select.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function () {
      $select.focus();
    };

    this.setDirectValue = function (val) {
      val = !!val;
      defaultValue = val;
      $select.val(val ? "yes" : "no");
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $select.select();
    };

    this.serializeValue = function () {
      return ($select.val() === "yes");
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      return scope.serializeValue() != defaultValue;
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  function CheckboxEditor(args) {
    var $select;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $select = $("<INPUT type='checkbox' value='true' class='editor-checkbox' hideFocus='true'>")
          .appendTo(args.container)
          .focus()
          .select();
      defaultValue = false;
    };

    this.destroy = function () {
      $select.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $select.hide();
    };

    this.show = function () {
      $select.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function () {
      $select.focus();
    };

    this.setDirectValue = function (val) {
      val = !!val;
      defaultValue = val;
      $select.prop('checked', val);
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $select.select();
    };

    this.serializeValue = function () {
      return $select.prop('checked');
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      assert(defaultValue != null);
      return this.serializeValue() !== defaultValue;
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  function PercentCompleteEditor(args) {
    var $input, $picker, $helper;
    var defaultValue;
    var scope = this;

    this.init = function () {
      defaultValue = 0;

      $input = $("<INPUT type='text' class='editor-percentcomplete' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === Slick.Keyboard.LEFT || e.keyCode === Slick.Keyboard.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();

      $input.outerWidth($(args.container).innerWidth() - 25);

      $picker = $("<div class='editor-percentcomplete-picker' />").appendTo(args.container);

      var $body = $("body");

      $helper = $("\
      	<div class='editor-percentcomplete-helper'>\
      	  <div class='editor-percentcomplete-wrapper'>\
      	    <div class='editor-percentcomplete-slider'>\
      	    </div>\
      	    <div class='editor-percentcomplete-buttons'>\
      	    </div>\
      	  </div>\
      	</div>").appendTo($body);

      $helper.find(".editor-percentcomplete-buttons")
      .append("<button val='0'>Not started</button>\
      	<br/>\
      	<button val='50'>In Progress</button>\
      	<br/>\
      	<button val='100'>Complete</button>");

      $helper.find(".editor-percentcomplete-slider").slider({
        orientation: "vertical",
        range: "min",
        value: defaultValue,
        slide: function (event, ui) {
          $input.val(ui.value);
        }
      });

      $picker.click(function(e) {
        //$helper.toggle();
        $helper.show();
        if ($helper.is(":visible")) {
          $helper.position({
            my: "left top",
            at: "right top",
            of: $picker,
            collision: "flipfit"
          });
        }
      });
      //$helper.blur(function (e) {
      //  $helper.hide();
      //});

      $helper.find(".editor-percentcomplete-buttons button").bind("click", function (e) {
        $input.val($(this).attr("val"));
        $helper.find(".editor-percentcomplete-slider").slider("value", $(this).attr("val"));
      });
    };

    this.destroy = function () {
      $input.remove();
      $picker.remove();
      $helper.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $input.hide();
      $picker.hide();
      $helper.hide();
    };

    this.show = function () {
      $input.show();
      $picker.show();
      $helper.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function () {
      $input.focus();
    };

    this.setDirectValue = function (val) {
      val = parseFloat(val);
      if (isNaN(val)) val = 0;
      defaultValue = val;
      $input.val(val);
      $helper.find(".editor-percentcomplete-slider").slider("value", val);
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    this.serializeValue = function () {
      return parseInt($input.val(), 10) || 0;
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      assert(defaultValue != null);
      return (parseInt($input.val(), 10) || 0) != defaultValue;
    };

    this.validate = function () {
      if (isNaN(parseInt($input.val(), 10))) {
        return {
          valid: false,
          msg: "Please enter a valid positive number"
        };
      }

      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }

  /*
   * An example of a "detached" editor.
   * The UI is added onto document BODY and .position(), .show() and .hide() are implemented.
   * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
   */
  function LongTextEditor(args) {
    var $input, $wrapper, $picker, $wrapped_input;
    var defaultValue;
    var scope = this;

    this.init = function () {
      $input = $("<TEXTAREA type='text' class='editor-longtext-basic-input' rows='1' />")
          .appendTo(args.container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === Slick.Keyboard.LEFT || e.keyCode === Slick.Keyboard.RIGHT) {
              e.stopImmediatePropagation();
            }
          });

      $input.width($(args.container).innerWidth() - 6);   // textarea with 'resize:none' keeps space at right; we move the edit icon over it...

      $picker = $("<div class='editor-longtext-icon' />").appendTo(args.container);

      var $container = $("body");

      $wrapper = $("<DIV class='slick-editor-longtext' />")
          .appendTo($container);

      $wrapped_input = $("<TEXTAREA rows='5'>")
          .appendTo($wrapper);

      $("<DIV class='buttons-container'><BUTTON class='save-button'>Save</BUTTON><BUTTON class='cancel-button'>Cancel</BUTTON></DIV>")
          .appendTo($wrapper);

      $wrapper.find("button.save-button").bind("click", scope.save);
      $wrapper.find("button.cancel-button").bind("click", scope.cancel);
      $wrapped_input.bind("keydown", scope.handleKeyDown);

      assert(args.container);
      $picker.click(function(e) {
        if (!$wrapper.is(":visible")) {
          showPanel();
        } else {
          hidePanel();
        }
      });
      //$wrapper.blur(function (e) {
      //  hidePanel();
      //});

      $input.focus().select();

      defaultValue = '';
    };

    this.handleKeyDown = function (e) {
      if (e.which == Slick.Keyboard.ENTER && e.ctrlKey) {
        scope.save();
      } else if (e.which == Slick.Keyboard.ESCAPE) {
        e.preventDefault();
        scope.cancel();
      } else if (e.which == Slick.Keyboard.TAB && e.shiftKey) {
        e.preventDefault();
        args.grid.navigatePrev();
      } else if (e.which == Slick.Keyboard.TAB) {
        e.preventDefault();
        args.grid.navigateNext();
      }
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      $input.val(defaultValue);
      $wrapped_input.val(defaultValue);
      args.cancelChanges();
    };

    function hidePanel() {
      $input.prop('readonly', null);
      $input.val($wrapped_input.val());

      $wrapper.hide();
    }

    function showPanel() {
      // mark regular input as readonly and copy its content into the panel textarea:
      $input.prop('readonly', true);
      $wrapped_input.val($input.val());

      $wrapper.show();

      scope.position(args);
    }

    this.hide = function () {
      hidePanel();
    };

    this.show = function () {
      showPanel();
    };

    /*
     * info: {
     *         gridPosition: getGridPosition(),
     *         position: cellBox,
     *         container: activeCellNode
     *       }
     */
    this.position = function (info) {
      if ($wrapper.is(":visible")) {
        $wrapper.position({
          my: "left top+2",
          at: "left bottom",
          of: info.container,
          collision: "flipfit"
        });
      }
    };

    this.destroy = function () {
      $wrapper.remove();
      $picker.remove();
      $input.remove();
    };

    this.focus = function () {
      if ($wrapper.is(":visible")) {
        $wrapped_input.focus();
      } else {
        $input.focus();
      }
    };

    this.setDirectValue = function (val) {
      if (val == null) val = "";
      val += "";
      defaultValue = val;
      $input.val(val);
      $wrapped_input.val(val);
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    function getValue() {
      var rv;
      if ($wrapper.is(":visible")) {
        rv = $wrapped_input.val();
      } else {
        rv = $input.val();
      }
      return rv;
    }

    this.serializeValue = function () {
      return getValue();
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      assert(defaultValue != null);
      return getValue() != defaultValue;
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }



  function ColorEditor(args) {
    var $input;
    var defaultValue;
    var scope = this;
    var isOpen = false;
    var $container = $(args.container);

    this.init = function () {
      $input = $("<input type='color' />")
          .appendTo($container)
          .bind("keydown.nav", function (e) {
            if (e.keyCode === Slick.Keyboard.LEFT || e.keyCode === Slick.Keyboard.RIGHT) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();
      scope.show();
    };

    this.destroy = function () {
      $input.spectrum("destroy");
      $input.remove();
      isOpen = false;
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.show = function () {
      if (!isOpen) {
        $input.spectrum({
            className: 'spectrumSlick',
            clickoutFiresChange: true,
            showButtons: false,
            showPalette: true,
            showInput: true,
            showAlpha: false,
            showSelectionPalette: true,
            maxPaletteSize: 16,
            preferredFormat: "hex6",
            appendTo: "body",
            flat: true,
            palette: [
              ["#000000","#262626","#464646","#626262","#707070","#7D7D7D","#898989","#959595","#A0A0A0","#ACACAC","#B7B7B7","#C2C2C2","#D7D7D7","#E1E1E1","#EBEBEB","#FFFFFF"],
              ["#FF0000","#FFFF00","#00FF00","#00FFFF","#0000FF","#FF00FF","#ED1C24","#FFF200","#00A651","#00AEEF","#2E3192","#EC008C"],
              ["#F7977A","#F9AD81","#FDC68A","#FFF79A","#C4DF9B","#A2D39C","#82CA9D","#7BCDC8","#6ECFF6","#7EA7D8","#8493CA","#8882BE","#A187BE","#BC8DBF","#F49AC2","#F6989D"],
              ["#F26C4F","#F68E55","#FBAF5C","#FFF467","#ACD372","#7CC576","#3BB878","#1ABBB4","#00BFF3","#438CCA","#5574B9","#605CA8","#855FA8","#A763A8","#F06EA9","#F26D7D"],
              ["#ED1C24","#F26522","#F7941D","#FFF200","#8DC73F","#39B54A","#00A651","#00A99D","#00AEEF","#0072BC","#0054A6","#2E3192","#662D91","#92278F","#EC008C","#ED145B"],
              ["#9E0B0F","#A0410D","#A36209","#ABA000","#598527","#1A7B30","#007236","#00746B","#0076A3","#004B80","#003471","#1B1464","#440E62","#630460","#9E005D","#9E0039"],
              ["#790000","#7B2E00","#7D4900","#827B00","#406618","#005E20","#005826","#005952","#005B7F","#003663","#002157","#0D004C","#32004B","#4B0049","#7B0046","#7A0026"],
            ]
        });
        isOpen = true;
      }
      $input.spectrum("show");
    };

    this.hide = function () {
      if (isOpen) {
        $input.spectrum("hide");
        isOpen = false;
      }
    };

    this.position = function (position) {
      if (!isOpen) return;
      //$cp.css("top", position.top + 20).css("left", position.left);
    };

    this.focus = function () {
      scope.show();
      $input.focus();
    };

    this.setDirectValue = function (val) {
      if (val == null) val = "";
      $input.spectrum("set", val);
      defaultValue = scope.serializeValue();
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $input.select();
    };

    this.serializeValue = function () {
      return $input.spectrum("get").toString();
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function () {
      assert(defaultValue != null);
      var v = scope.serializeValue();
      return v != defaultValue;
    };

    this.validate = function () {
      return {
        valid: true,
        msg: null
      };
    };

    this.init();
  }



  function SelectCellEditor(args) {
    var $select;
    var defaultValue;
    var scope = this;
    var opt;

    function getKeyFromKeyVal(opt, val) {
      var i, v, index = 0;

      for (i in opt) {
        v = opt[i];
        if (v.val === val) {
          index = i;
          break;
        }
      }
      return index;
    }

    this.init = function() {
      var i;

      defaultValue = null;
      opt = (args.metadataColumn && args.metadataColumn.options) || args.column.options;
      assert(opt);
      opt = typeof opt === 'function' ? opt.call(args.column) : opt;
      assert(opt);

        option_str = [];
        for (i in opt) {
          v = opt[i];
          option_str.push("<OPTION value='" + (v.key == null ? v.id : v.key) + "'>" + (v.value == null ? v.label : v.value) + "</OPTION>");
        }
        $select = $("<SELECT tabIndex='0' class='editor-select'>" + option_str.join('') + "</SELECT>")
         .appendTo(args.container)
         .focus()
         .select();

        // this expects the multiselect widget (http://www.erichynds.com/jquery/jquery-ui-multiselect-widget/) to be loaded
        $select.multiselect({
          autoOpen: true,
          minWidth: $(args.container).innerWidth() - 5,
          multiple: false,
          header: false,
          noneSelectedText: "...",
          classes: "editor-multiselect",
          selectedList: 1,
          close: function(event, ui) {
            //args.grid.getEditorLock().commitCurrentEdit();
          }
        });
    };

    this.destroy = function() {
      $select.multiselect("destroy");
      $select.remove();
    };

    this.save = function () {
      args.commitChanges();
    };

    this.cancel = function () {
      this.setDirectValue(defaultValue);
      args.cancelChanges();
    };

    this.hide = function () {
      $select.hide();
    };

    this.show = function () {
      $select.show();
    };

    this.position = function (position) {
      // nada 
    };

    this.focus = function() {
      $select.focus();
    };

    this.setDirectValue = function (val) {
        var key = getKeyFromKeyVal(opt, val);
        key = opt[key].key;
        defaultValue = key;
        $select.val(key);
        $select.multiselect("refresh");
    };

    this.loadValue = function (item) {
      scope.setDirectValue(args.grid.getDataItemValueForColumn(item, args.column));
      $select.select();
    };

    this.serializeValue = function () {
      return $select.val();
    };

    this.applyValue = function (item, state) {
      args.grid.setDataItemValueForColumn(item, args.column, state);
    };

    this.isValueChanged = function() {
      return scope.serializeValue() != defaultValue;
    };

    this.validate = function() {
        return {
            valid: true,
            msg: null
        };
    };

    this.init();
  }

})(jQuery);
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
