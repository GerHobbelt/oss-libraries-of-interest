/*jshint -W041*/  // Use '===' to compare with 'null'. (W041)

/***
 * Contains basic SlickGrid formatters.
 *
 * NOTE:  These are merely examples.  You will most likely need to implement something more
 *        robust/extensible/localizable/etc. for your use!
 *
 * @module Formatters
 * @namespace Slick
 */


(function ($) {
  // register namespace
  $.extend(true, window, {
    Slick: {
      Formatters: {
        Text: TextFormatter,
        PercentComplete: PercentCompleteFormatter,
        PercentCompleteBar: PercentCompleteBarFormatter,
        YesNo: YesNoFormatter,
        Checkmark: CheckmarkFormatter,
        Color: ColorFormatter,
        BackColor: BackColorFormatter,
        Chain: Chain,
        Concatenator: Concatenator,
        ReferenceValue: ReferenceValueFormatter,
        Link: LinkFormatter,
        Date: DateFormatter
      }
    }
  });

  function PercentCompleteFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      if (value == null || value === "") {
        return "";
      } else {
        return "" + value + "%";
      }
    }

    if (value == null || value === "") {
      return "-";
    } else if (value < 50) {
      return "<span style='color:red;font-weight:bold;'>" + value + "%</span>";
    } else {
      return "<span style='color:green'>" + value + "%</span>";
    }
  }

  function PercentCompleteBarFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    if (value == null || value === "") {
      return "";
    }

    var color;

    if (value < 30) {
      color = "red";
    } else if (value < 70) {
      color = "silver";
    } else {
      color = "green";
    }

    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return "" + value + "%";
    }

    return "<span class='percent-complete-bar' style='background:" + color + ";width:" + value + "%'></span>";
  }

  function YesNoFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return !!value;
    }

    return value ? "Yes" : "No";
  }

  function CheckmarkFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return !!value;
    }

    return value ? "<img src='../images/tick.png'>" : "";
  }

  function ColorFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return value;
    }

    return "<span style='color:" + value  + "'>" + value + "</span>";
  }

  function BackColorFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (cellMetaInfo.outputPlainText) {
      return value;
    }

    //return "<span style='background:" + value  + "'>" + value + "</span>";
    cellMetaInfo.cellStyles.push("background:" + value);
    return "<span style='color:black; padding-left: 1px; padding-right: 1px; background-color: rgba(255, 255, 255, 0.4); text-shadow: 1px 1px 3px white; -webkit-box-shadow: 0px 0px 3px 1px rgba(255, 255, 255, 0.4); box-shadow: 0px 0px 3px 1px rgba(255, 255, 255, 0.4);'>" + value + "</span>";
  }

  // identical to the SlickGrid internal defaultFormatter except this one wraps the value in a SPAN tag.
  function TextFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    if (value == null) {
      return "";
    } else {
      if (cellMetaInfo.outputPlainText) {
        return "" + value;
      }
      // Safari 6 fix: (value + "") instead of .toString()
      value = (value + "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return "<span>" + value + "</span>";
    }
  }

  function ReferenceValueFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    assert(cellMetaInfo);
    var options = cellMetaInfo.options;

    if (cellMetaInfo.outputPlainText) {
      if (value == null) {
        return "";
      } else {
        return "" + value;
      }
    }

    if (options) {
      var match;
      for (var i in options) {
        if (options[i].id === value || options[i].key === value) {
          match = options[i];
          break;
        }
      }

      if (match) {
        return match.value || match.label || value;
      }
    }
    return value;
  }

  /*
   *  depends on Moment.js
   *  (http://momentjs.com/)
   */
  function DateFormatter(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
    var options = $.extend({
        format: 'YYYY-MM-DD HH:mm:ss'
    }, cellMetaInfo.options);

    if (cellMetaInfo.outputPlainText) {
      if (value == null) {
        return "";
      } else if (value.toISOString) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
        return value.toISOString();
      }
      return "" + value;
    }

    if (value == null || value === "") {
      return "";
    } else if (value && typeof moment !== 'undefined') {
      return moment(value).format(options.format);
    } else if (value.toISOString) {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
      return value.toISOString();
    } else {
      return "" + value;
    }
  }

  /*
   *  utility for chaining formatters
   */
  function Chain(/* ...formatters */) {
    var formatters = Array.prototype.slice.call(arguments);

    return function(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      var val = value;
      for (var i in formatters) {
        val = formatters[i](row, cell, val, columnDef, rowDataItem, cellMetaInfo);
      }
      return val;
    };
  }

  /*
   * Presents data as href by substituting
   * url template with values
   */
  function LinkFormatter(options) {
    var urlTemplate = typeof options === 'string' ? options : options.urlTemplate;
    var matches = urlTemplate.match(/:(\w+)/g);
    var splatParams = [];
    var i, result, val;

    for (i in matches) {
      splatParams.push(matches[i].substring(1));
    }

    var len = splatParams.length;

    return function(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      result = urlTemplate;
      for (i = 0; i < len; i++) {
        val = rowDataItem[splatParams[i]];
        if (typeof val != null) {
          result = result.replace(':' + splatParams[i], val);
        }
      }
      return value != null ? '<a href="' + result + '">' + value + '</a>' : null;
    };
  }

  function Concatenator(fields, separator) {
    if (typeof separator === 'undefined') {
      separator = ' ';
    }
    if (typeof fields === 'string') {
      fields = fields.split(',');
    }
    var len = fields.length;

    return function(row, cell, value, columnDef, rowDataItem, cellMetaInfo) {
      var result = [];
      var data;
      for (var i = 0; i < len; i++) {
        data = rowDataItem[ fields[i] ];
        if (data != null) {
          result.push(data);
        }
      }
      return result.join(separator);
    };
  }

})(jQuery);
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
