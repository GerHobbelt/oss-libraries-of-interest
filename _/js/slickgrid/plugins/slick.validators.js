(function ($) {
  var defaults = {
    messages: {
      number: "Field must contain only numbers",
      decimal: "Field must contain only a decimal number",
      required: "This field is a required"
    },
    regex: {
      decimal: /^\-?[0-9]*\.?[0-9]+$/,
      number: /^[0-9]+$/
    }
  };

  function isDefined(val) {
    return typeof val !== 'undefined' && val !== null;
  }

  function capitaliseFirstLetter(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function RegexValidator(options) {
    if (!isDefined(options.regex)) throw new Error("missing argument: regex");
    return function(value) {
      return (isDefined(value) && options.regex.test(value.toString())) ?
        { valid: true,  msg: null } :
        { valid: false, msg: options.msg };
    };
  }


  var regexExports = {};

  function ctorFactory(name) {
    return function ctor(options) {
      return new RegexValidator($.extend(true, {
        msg: defaults.messages[name],
        regex: defaults.regex[name]
      }, options));
    };
  }

  for (var name in defaults.regex) {
    regexExports[capitaliseFirstLetter(name) + "Validator"] = ctorFactory(name);
    regexExports[name] = ctorFactory(name)();
  }


  function RequiredValidator(options) {
    options = $.extend(true, {
      msg: defaults.messages.required
    }, options);

    return function(value) {
      return (value === null || value === undefined || !value.length) ?
        { valid: false, msg: options.msg } :
        { valid: true, msg: null };
    };
  }
  var required = new RequiredValidator();

  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Validators": $.extend(true, regexExports, {
        "defaults": defaults,
        "RequiredValidator": RequiredValidator,
        "required": required,
        "RegexValidator": RegexValidator
      })
    }
  });

})(jQuery);
