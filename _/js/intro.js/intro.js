/**
 * Intro.js v0.9.0
 * https://github.com/usablica/intro.js
 * MIT licensed
 *
 * Copyright (C) 2013 usabli.ca - A weekend project by Afshin Mehrabani (@afshinmeh)
 */

(function (root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports'], factory);
  } else {
    // Browser globals
    factory(root);
  }
} (this, function (exports) {
  //Default config/variables
  var VERSION = '0.9.0';
  var attrNames = {
        step: 'data-intro-step',
        text: 'data-intro-text',
        key: 'data-intro-key',
        skipLabel: 'data-intro-skiplabel',
        prevLabel: 'data-intro-prevlabel',
        nextLabel: 'data-intro-nextlebel',
        tooltip: 'data-intro-tooltipClass',
        position: 'data-intro-position',
        stepnumber: 'data-intro-stepnumber'
      };

  /**
   * IntroJs main class
   *
   * @class IntroJs
   */
  function IntroJs(obj, textData) {
    this._targetElement = obj;

    this._textData = textData || {};

    this._options = {
      /* Next button label in tooltip box */
      nextLabel: 'Next &rarr;',
      /* Previous button label in tooltip box */
      prevLabel: '&larr; Back',
      /* Skip button label in tooltip box */
      skipLabel: 'Skip',
      /* Done button label in tooltip box */
      doneLabel: 'Done',
      /* Default tooltip box position */
      tooltipPosition: 'bottom',
      /* Next CSS class for tooltip boxes */
      tooltipClass: '',
      /* Close introduction when pressing Escape button? */
      exitOnEsc: true,
      /* Close introduction when clicking on overlay layer? */
      exitOnOverlayClick: true,
      /* Show step numbers in introduction? */
      showStepNumbers: true,
      /* Let user use keyboard to navigate the tour? */
      keyboardNavigation: true,
      /* Always put focus on the next/done buttons at each step? */
      focusOnNextDoneButtons: false,
      /* Show tour control buttons? */
      showButtons: true,
      /* Show tour bullets? */
      showBullets: true,
      /* Scroll to highlighted element? */
      scrollToElement: true,
      /* Set the overlay opacity */
      overlayOpacity: 0.8,
      /* {String|Array} Which are the current role(s) of the user? (We can serve different content based on user role.) */
      activeRoles: null,
      /* {Function} Wrap the intro text in a user specified template. Function call interface: function(roleAndText, index, collectedIntroTexts) */
      textTemplateCallback: null,
      /* element to mask; by default it's the current target element */
      maskTarget: null,
      /* css class that indicates element is hidden, and so will be ignored by intro */
      hiddenClass: null,
      /* previousStep and prevButton are disabled at these checkpoints (checkpoint = step number)? */
      checkpoints: []
    };
  }

  /**
   * Support multilingual or otherwise run-time-changed introductions: the textData object
   * contains a dictionary which maps element keys (data-intro-key) to actual texts, while
   * (data-intro-text) serves as a fallback when the target element does not have a key assigned
   * or when textData does not list the given key.
   */
  function _getIntroText(elm) {
    var key = elm.getAttribute(attrNames.key);
    var rv = key && key in this._textData ? this._textData[key] : elm.getAttribute(attrNames.text);
    return rv || '';
  }

  /**
   * Initiate a new introduction/guide from an element in the page
   *
   * @api private
   * @method _introForElement
   * @param {Object} targetElm
   * @returns {Boolean} Success or not?
   */
  function _introForElement(targetElm) {
    var introItems = [],
        self = this,
        usedKeys = [],
        isKeyDuplicate = function (el) {
            var val = el.getAttribute(attrNames.key),
                noDup = (val == null || usedKeys.indexOf(val) < 0);
            if (noDup && val) {
                usedKeys.push(val);
            }
            return !noDup;
        },
        allIntroSteps,
        currentItem, currentElement,
        i, elmsLength, stepsLength, step;

    if (this._options.steps) {
      //use steps passed programmatically
      allIntroSteps = [];

      for (i = 0, stepsLength = this._options.steps.length; i < stepsLength; i++) {
        currentItem = _cloneObject(this._options.steps[i]);
        //set the step
        currentItem.step = introItems.length + 1;
        //use querySelector function only when developer used CSS selector
        if (typeof currentItem.element === 'string') {
          //grab the element with given selector from the page
          currentItem.element = document.querySelector(currentItem.element);
        }

        //intro without element
        if (!currentItem.element) {
          var floatingElementQuery = document.querySelector('.introjsFloatingElement');

          if (!floatingElementQuery) {
            floatingElementQuery = document.createElement('div');
            floatingElementQuery.className = 'introjsFloatingElement';

            document.body.appendChild(floatingElementQuery);
          }

          currentItem.element  = floatingElementQuery;
          currentItem.position = 'floating';
        }

        if (currentItem.element) {
          introItems.push(currentItem);
        }
      }
    } else {
      //use steps from data-intro-* annotations
      var suffix = this._options.hiddenClass ? ':not(' + this._options.hiddenClass + ')' : '',
          selector = '*[' + attrNames.text + ']' + suffix + ', *[' + attrNames.key + ']' + suffix;

      allIntroSteps = targetElm.querySelectorAll(selector);
      //if there's no element to intro
      if (allIntroSteps.length < 1) {
        return false;
      }

      //first add intro items with data-intro-step
      for (i = 0, elmsLength = allIntroSteps.length; i < elmsLength; i++) {
        currentElement = allIntroSteps[i];
        step = parseInt(currentElement.getAttribute(attrNames.step), 10);

        if (step > 0  && !isKeyDuplicate(currentElement)) {
          introItems[step - 1] = {
            element: currentElement,
            step: parseInt(currentElement.getAttribute(attrNames.step), 10)
          };
        }
      }

      //next add intro items without data-intro-step
      //todo: we need a cleanup here, two loops are redundant
      var nextStep = 0;
      for (i = 0, elmsLength = allIntroSteps.length; i < elmsLength; i++) {
        currentElement = allIntroSteps[i];

        if (currentElement.getAttribute(attrNames.step) == null && !isKeyDuplicate(currentElement)) {
          while (true) {
            if (typeof introItems[nextStep] === 'undefined') {
              break;
            } else {
              nextStep++;
            }
          }

          introItems[nextStep] = {
            element: currentElement,
            step: nextStep + 1
          };
        }
      }
    }

    //removing undefined/null elements
    var tempIntroItems = [];
    for (var z = 0; z < introItems.length; z++) {
      if (introItems[z]) {
        tempIntroItems.push(introItems[z]);  // copy non-empty values to the end of the array
      }
    }

    introItems = tempIntroItems;

    //Ok, sort all items with given steps
    introItems.sort(function (a, b) {
      return a.step - b.step;
    });

    //Augment all the items, now that we know who they are and how many:
    for (i = 0, elmsLength = introItems.length; i < elmsLength; i++) {
      currentItem = introItems[i];
      currentElement = currentItem.element;

      var extraData = {
        intro: _getIntroText.call(self, currentElement),
        tooltipClass: currentElement.getAttribute(attrNames.tooltipClass),
        position: currentElement.getAttribute(attrNames.position) || this._options.tooltipPosition,
        prevLabel: currentElement.getAttribute(attrNames.prevLabel) || this._options.prevLabel,
        nextLabel: currentElement.getAttribute(attrNames.nextLabel) || this._options.nextLabel,
        skipLabel: currentElement.getAttribute(attrNames.skipLabel) || (i + 1 < elmsLength ? this._options.skipLabel : this._options.doneLabel)
      };
      introItems[i] = _mergeOptions(extraData, currentItem);
    }

    //set it to the introJs object
    self._introItems = introItems;

    //add overlay layer to the page
    if (_addOverlayLayer.call(self, (self._options.maskTarget || targetElm))) {
      //then, start the show
      _nextStep.call(self);

      self._onKeyDown = function(e) {
        if (e.keyCode === 27 && self._options.exitOnEsc) {
          //escape key pressed
          //check if any callback is defined
          if (typeof self._introExitCallback === 'function') {
            self._introExitCallback.call(self, {
              keyDownEvent: e
            });
          }
          //exit the intro
          _exitIntro.call(self, targetElm);
        } else if (e.keyCode === 37) {
          //left arrow
          _previousStep.call(self);
        } else if (e.keyCode === 39 || e.keyCode === 13) {
          //right arrow or enter
          _nextStep.call(self);
          //prevent default behaviour on hitting Enter, to prevent steps being skipped in some browsers
          if (e.preventDefault) {
            e.preventDefault();
          } else {
            e.returnValue = false;
          }
        }
      };

      self._onResize = function(e) {
        _setHelperLayerPosition.call(self, document.querySelector('.introjs-helperLayer'));
      };

      if (window.addEventListener) {
        if (this._options.keyboardNavigation) {
          window.addEventListener('keydown', self._onKeyDown, true);
        }
        //for window resize
        window.addEventListener('resize', self._onResize, true);
      } else if (document.attachEvent) { //IE
        if (this._options.keyboardNavigation) {
          document.attachEvent('onkeydown', self._onKeyDown);
        }
        //for window resize
        document.attachEvent('onresize', self._onResize);
      }
    }
    return false;
  }

 /*
   * makes a copy of the object
   * @api private
   * @method _cloneObject
  */
  function _cloneObject(object) {
      if (object == null || typeof object !== 'object' || typeof object.nodeType !== 'undefined') {
          return object;
      }
      var temp = {};
      for (var key in object) {
          temp[key] = _cloneObject(object[key]);
      }
      return temp;
  }
  /**
   * Go to specific step of introduction
   *
   * @api private
   * @method _goToStep
   */
  function _goToStep(step) {
    //because steps starts with zero
    this._currentStep = step - 2;
    if (typeof this._introItems !== 'undefined') {
      _nextStep.call(this);
    }
  }

  /**
   * Go to the specific step of introduction with the explicit [data-step] number
   *
   * @api private
   * @method _goToStepNumber
   */
  function _goToStepNumber(step) {
    if (typeof (this._introItems) !== 'undefined') {
      for (var i = 0, len = this._introItems.length; i < len; i++) {
        var item = this._introItems[i];
        if (item.step === step) {
          // position us so that #_nextStep() will get us there:
          this._currentStep = i - 1;
          _nextStep.call(this);
          break;
        }
      }
    }
  }

  /**
   * Go to next step on intro
   *
   * @api private
   * @method _nextStep
   */
  function _nextStep() {
    this._direction = 'forward';

    if (typeof this._currentStep === 'undefined') {
      this._currentStep = 0;
    } else {
      ++this._currentStep;
    }

    if (this._introItems.length <= this._currentStep) {
      //end of the intro
      //check if any callback is defined
      if (typeof this._introCompleteCallback === 'function') {
        this._introCompleteCallback.call(this, {
          nextStep: this._currentStep
        });
      }
      _exitIntro.call(this, this._targetElement);
      return;
    }

    var nextStep = this._introItems[this._currentStep];
    if (typeof this._introBeforeChangeCallback !== 'undefined') {
      this._introBeforeChangeCallback.call(this, nextStep.element);
    }

    _showElement.call(this, nextStep);
  }

  /**
   * Go to previous step on intro
   *
   * @api private
   * @method _nextStep
   */
  function _previousStep() {
    this._direction = 'backward';

    if (this._currentStep === 0) {
      return false;
    }

    // check for checkpoints
    for (var i = 0; i < this._options.checkpoints.length; i++) {
      if (this._currentStep === this._options.checkpoints[i]) {
        return false;
      }
    }

    var nextStep = this._introItems[--this._currentStep];
    if (typeof this._introBeforeChangeCallback !== 'undefined') {
      this._introBeforeChangeCallback.call(this, nextStep.element);
    }

    _showElement.call(this, nextStep);
  }

  /**
   * Exit from intro
   *
   * @api private
   * @method _exitIntro
   * @param {Object} targetElement
   */
  function _exitIntro(targetElement) {
    //remove overlay layer from the page
    var overlayLayer = (this._options.maskTarget || targetElement).querySelector('.introjs-overlay');

    //return if intro already completed or skipped
    if (!overlayLayer) {
      return;
    }

    if (this._options.overlayOpacity === 0) {
        overlayLayer.parentNode.removeChild(overlayLayer);
    } else {
        //for fade-out animation
        overlayLayer.style.opacity = 0;
        setTimeout(function () {
            if (overlayLayer.parentNode) {
                overlayLayer.parentNode.removeChild(overlayLayer);
            }
        }, 500);
    }

    //remove all helper layers
    var helperLayer = targetElement.querySelector('.introjs-helperLayer');
    if (helperLayer) {
      helperLayer.parentNode.removeChild(helperLayer);
    }

    //remove intro floating element
    var floatingElement = document.querySelector('.introjsFloatingElement');
    if (floatingElement) {
      floatingElement.parentNode.removeChild(floatingElement);
    }

    //remove `introjs-showElement` class from the element
    var showElement = document.querySelector('.introjs-showElement');
    if (showElement) {
      showElement.className = showElement.className.replace(/introjs-[a-zA-Z]+/g, '').replace(/^\s+|\s+$/g, ''); // This is a manual trim.
    }

    //remove `introjs-fixParent` class from the elements
    var fixParents = document.querySelectorAll('.introjs-fixParent');
    if (fixParents && fixParents.length > 0) {
      for (var i = fixParents.length - 1; i >= 0; i--) {
        fixParents[i].className = fixParents[i].className.replace(/introjs-fixParent/g, '').replace(/^\s+|\s+$/g, '');
      }
    }

    //clean listeners
    if (window.removeEventListener) {
      window.removeEventListener('keydown', this._onKeyDown, true);
    } else if (document.detachEvent) { //IE
      document.detachEvent('onkeydown', this._onKeyDown);
    }

    //set the step to zero
    this._currentStep = undefined;
  }

  /**
   * Render tooltip box in the page
   *
   * @api private
   * @method _placeTooltip
   * @param {Object} targetElement
   * @param {Object} tooltipLayer
   * @param {Object} arrowLayer
   */
  function _placeTooltip(targetElement, tooltipLayer, arrowLayer, helperNumberLayer) {
    var tooltipCssClass = '',
        currentStepObj,
        tooltipOffset,
        targetElementOffset;

    //reset the old style
    tooltipLayer.style.top        = null;
    tooltipLayer.style.right      = null;
    tooltipLayer.style.bottom     = null;
    tooltipLayer.style.left       = null;
    tooltipLayer.style.marginLeft = null;
    tooltipLayer.style.marginTop  = null;

    arrowLayer.style.display = 'inherit';

    if (typeof helperNumberLayer !== 'undefined' && helperNumberLayer != null) {
      helperNumberLayer.style.top  = null;
      helperNumberLayer.style.left = null;
    }

    //prevent error when `this._currentStep` is undefined
    if (!this._introItems[this._currentStep]) return;

    //if we have a custom css class for each step
    currentStepObj = this._introItems[this._currentStep];
    if (typeof currentStepObj.tooltipClass === 'string') {
      tooltipCssClass = currentStepObj.tooltipClass;
    } else {
      tooltipCssClass = this._options.tooltipClass;
    }

    tooltipLayer.className = ('introjs-tooltip ' + tooltipCssClass).replace(/^\s+|\s+$/g, '');

    currentTooltipPosition = this._introItems[this._currentStep].position;
    switch (currentTooltipPosition) {
      case 'top':
      case 'top-left-aligned':
        tooltipLayer.style.left = '15px';
        tooltipLayer.style.top = '-' + (_getOffset(tooltipLayer).height + 10) + 'px';
        arrowLayer.className = 'introjs-arrow bottom';
        break;
      case 'top-right-aligned':
        tooltipLayer.style.right = '0';
        tooltipLayer.style.top = '-' + (_getOffset(tooltipLayer).height + 10) + 'px';
        arrowLayer.className = 'introjs-arrow bottom-right';
        break;
      case 'right':
      case 'right-top-aligned':
        tooltipLayer.style.left = (_getOffset(targetElement).width + 20) + 'px';
        arrowLayer.className = 'introjs-arrow left';
        break;
      case 'right-bottom-aligned':
        tooltipLayer.style.left = (_getOffset(targetElement).width + 20) + 'px';
        tooltipLayer.style.bottom = '0px';
        arrowLayer.className = 'introjs-arrow left-bottom';
        break;
      case 'left':
      case 'left-top-aligned':
        if (this._options.showStepNumbers) {
          tooltipLayer.style.top = '15px';
        }
        tooltipLayer.style.right = (_getOffset(targetElement).width + 20) + 'px';
        arrowLayer.className = 'introjs-arrow right';
        break;
      case 'left-bottom-aligned':
        if (this._options.showStepNumbers) {
          tooltipLayer.style.right = (_getOffset(targetElement).width + 30) + 'px';
        }
        else {
          tooltipLayer.style.right = (_getOffset(targetElement).width + 20) + 'px';
        }
        arrowLayer.className = 'introjs-arrow right-bottom';
        tooltipLayer.style.bottom = '0px';
        break;
      case 'floating':
        arrowLayer.style.display = 'none';

        //we have to adjust the top and left of layer manually for intro items without element
        tooltipOffset = _getOffset(tooltipLayer);

        tooltipLayer.style.left   = '50%';
        tooltipLayer.style.top    = '50%';
        tooltipLayer.style.marginLeft = '-' + (tooltipOffset.width / 2)  + 'px';
        tooltipLayer.style.marginTop  = '-' + (tooltipOffset.height / 2) + 'px';

        if (typeof helperNumberLayer !== 'undefined' && helperNumberLayer != null) {
          helperNumberLayer.style.left = '-' + ((tooltipOffset.width / 2) + 18) + 'px';
          helperNumberLayer.style.top  = '-' + ((tooltipOffset.height / 2) + 18) + 'px';
        }
        break;
      case 'bottom-right-aligned':
        arrowLayer.className      = 'introjs-arrow top-right';
        tooltipLayer.style.right  = '0px';
        tooltipLayer.style.bottom = '-' + (_getOffset(tooltipLayer).height + 10) + 'px';
        break;
      case 'bottom-middle-aligned':
        targetElementOffset = _getOffset(targetElement);
        tooltipOffset       = _getOffset(tooltipLayer);

        arrowLayer.className      = 'introjs-arrow top-middle';
        tooltipLayer.style.left   = (targetElementOffset.width / 2 - tooltipOffset.width / 2) + 'px';
        tooltipLayer.style.bottom = '-' + (tooltipOffset.height + 10) + 'px';
        break;
      case 'bottom-left-aligned':
      // Bottom-left-aligned is the same as the default bottom
      case 'bottom':
      // Bottom going to follow the default behavior
      default:
        tooltipLayer.style.bottom = '-' + (_getOffset(tooltipLayer).height + 10) + 'px';
        arrowLayer.className = 'introjs-arrow top';
        break;
    }
  }

  /**
   * Update the position of the helper layer on the screen
   *
   * @api private
   * @method _setHelperLayerPosition
   * @param {Object} helperLayer
   */
  function _setHelperLayerPosition(helperLayer) {
    if (helperLayer) {
      //prevent error when `this._currentStep` in undefined
      if (!this._introItems[this._currentStep]) return;

      var currentElement  = this._introItems[this._currentStep],
          elementPosition = _getOffset(currentElement.element),
          widthHeightPadding = 10;

      if (currentElement.position == 'floating') {
        widthHeightPadding = 0;
      }

      //set new position to helper layer
      helperLayer.setAttribute('style', 'width: ' + (elementPosition.width  + widthHeightPadding)  + 'px; ' +
                                        'height:' + (elementPosition.height + widthHeightPadding)  + 'px; ' +
                                        'top:'    + (elementPosition.top    - 5)   + 'px;' +
                                        'left: '  + (elementPosition.left   - 5)   + 'px;');
    }
  }

  /**
   * Render the appropriate intro text, depending on the active user role (introJS.options.activeRoles)
   * and the available intro text(s).
   *
   * @api private
   * @method _renderIntroText
   * @param {Object} targetElement
   * @this  {Object} IntroJs
   * @returns {String} rendered (HTML) text
   */
  function _renderIntroText(targetElement) {
    if (!targetElement.intro) {
      throw new Error('IntroJS: no intro text specified for the target');           // TODO: notify user of lack of intro text at all?
    }
    var roles = [].concat(this._options.activeRoles);
    var role;
    var msg = [];
    var tpl = this._options.textTemplateCallback || function (roleAndText, index, collectedIntroTexts) {
      if (index > 0) {
        return '<hr class="intro-role-text-separator"/>' + roleAndText.text;
      } else {
        return roleAndText.text;
      }
    };

    for (var i = 0; (role = roles[i]); i++) {
      if (targetElement.intro[role]) {
        msg.push({
          role: role,
          text: targetElement.intro[role]
        });
      }
    }
    // if there no roles listed OR the intro field does not include suitable texts for any of the active roles,
    // we take the default intro text.
    // ALSO when we play MULTIPLE roles at the same time, we want to see the default text (only once!) when
    // NOT ALL those roles were served with their own directly targeted intro text (the default text is assumed
    // to contain valuable information too!)
    if (msg.length !== roles.length) {
      if (targetElement.intro['default']) {
        msg.push({
          role: 'default',
          text: targetElement.intro['default']
        });
      } else if (typeof targetElement.intro === 'string') {
        msg.push({
          role: 'default',
          text: targetElement.intro
        });
      } else {
        throw new Error('IntroJS: no DEFAULT intro text specified for the target');           // TODO: notify user of lack of intro text at all?
      }
    }
    return msg.map(tpl).join('\n');
  }

  /**
   * Show an element on the page
   *
   * @api private
   * @method _showElement
   * @param {Object} targetElement
   */
  function _showElement(targetElement) {

    if (typeof this._introChangeCallback !== 'undefined') {
        this._introChangeCallback.call(this, targetElement.element);
    }

    var self = this,
        oldHelperLayer = document.querySelector('.introjs-helperLayer'),
        elementPosition = _getOffset(targetElement.element),
        oldHelperNumberLayer,
        oldtooltipLayer,
        oldArrowLayer,
        oldtooltipContainer,
        skipTooltipButton,
        prevTooltipButton,
        nextTooltipButton,
        currentItem = this._introItems[this._currentStep],
        i, stepsLength;

    if (oldHelperLayer != null) {
      oldHelperNumberLayer = oldHelperLayer.querySelector('.introjs-helperNumberLayer');
      oldtooltipLayer      = oldHelperLayer.querySelector('.introjs-tooltiptext');
      oldArrowLayer        = oldHelperLayer.querySelector('.introjs-arrow');
      oldtooltipContainer  = oldHelperLayer.querySelector('.introjs-tooltip');
      skipTooltipButton    = oldHelperLayer.querySelector('.introjs-skipbutton');
      prevTooltipButton    = oldHelperLayer.querySelector('.introjs-prevbutton, .introjs-only-prevbutton');
      nextTooltipButton    = oldHelperLayer.querySelector('.introjs-nextbutton, .introjs-only-nextbutton');

      //hide the tooltip
      oldtooltipContainer.style.opacity = 0;

      if (oldHelperNumberLayer) {
        var lastIntroItem = this._introItems[(targetElement.step - 2 >= 0 ? targetElement.step - 2 : 0)];

        if (lastIntroItem != null && (this._direction === 'forward' && lastIntroItem.position === 'floating') || (this._direction === 'backward' && targetElement.position === 'floating')) {
          oldHelperNumberLayer.style.opacity = 0;
        }
      }

      //set current nextLabel text
      nextTooltipButton.innerHTML = targetElement.nextLabel;

      //set current skipLabel text
      skipTooltipButton.innerHTML = targetElement.skipLabel;

      //set new position to helper layer
      _setHelperLayerPosition.call(self, oldHelperLayer);

      //remove `introjs-fixParent` class from the elements
      var fixParents = document.querySelectorAll('.introjs-fixParent');
      if (fixParents && fixParents.length > 0) {
        for (i = fixParents.length - 1; i >= 0; i--) {
          fixParents[i].className = fixParents[i].className.replace(/introjs-fixParent/g, '').replace(/^\s+|\s+$/g, '');
        }
      }

      //remove old classes
      var oldShowElement = document.querySelector('.introjs-showElement');
      // be robust against complex rerendering/updating of the addressed DOM node by any application user code:
      if (oldShowElement) {
        oldShowElement.className = oldShowElement.className.replace(/introjs-[a-zA-Z]+/g, '').replace(/^\s+|\s+$/g, '');
      }
      //we should wait until the CSS3 transition is completed (it's 0.3 sec) to prevent incorrect `height` and `width` calculation
      if (self._lastShowElementTimer) {
        clearTimeout(self._lastShowElementTimer);
      }
      self._lastShowElementTimer = setTimeout(function() {
        //set current step to the label
        if (oldHelperNumberLayer) {
          oldHelperNumberLayer.innerHTML = targetElement.step;
        }
        //set current tooltip text
        oldtooltipLayer.innerHTML = _renderIntroText.call(self, targetElement);
        //set the tooltip position
        _placeTooltip.call(self, targetElement.element, oldtooltipContainer, oldArrowLayer, oldHelperNumberLayer);

        //change active bullet
        oldHelperLayer.querySelector('.introjs-bullets li > a.active').className = '';
        oldHelperLayer.querySelector('.introjs-bullets li > a[' + attrNames.stepnumber + '="' + targetElement.step + '"]').className = 'active';

        //show the tooltip
        oldtooltipContainer.style.opacity = 1;
        if (oldHelperNumberLayer) {
          oldHelperNumberLayer.style.opacity = 1;
        }
      }, 350);
    } else {
      var helperLayer       = document.createElement('div'),
          arrowLayer        = document.createElement('div'),
          tooltipLayer      = document.createElement('div'),
          tooltipTextLayer  = document.createElement('div'),
          bulletsLayer      = document.createElement('div'),
          buttonsLayer      = document.createElement('div');

      helperLayer.className = 'introjs-helperLayer';

      //set new position to helper layer
      _setHelperLayerPosition.call(self, helperLayer);

      //add helper layer to target element
      this._targetElement.appendChild(helperLayer);

      arrowLayer.className = 'introjs-arrow';

      tooltipTextLayer.className = 'introjs-tooltiptext';
      tooltipTextLayer.innerHTML = _renderIntroText.call(self, targetElement);

      bulletsLayer.className = 'introjs-bullets';

      if (!this._options.showBullets) {
        bulletsLayer.style.display = 'none';
      }

      var ulContainer = document.createElement('ul');

      var onAnchorLink = function () {
        self.goToStep(this.getAttribute(attrNames.stepnumber));
      };

      for (i = 0, stepsLength = this._introItems.length; i < stepsLength; i++) {
        var innerLi    = document.createElement('li');
        var anchorLink = document.createElement('a');

        anchorLink.onclick = onAnchorLink;

        if (i === targetElement.step - 1) {
          anchorLink.className = 'active';
        }

        anchorLink.href = 'javascript:void(0);';
        anchorLink.innerHTML = '&nbsp;';
        anchorLink.setAttribute(attrNames.stepnumber, this._introItems[i].step);

        innerLi.appendChild(anchorLink);
        ulContainer.appendChild(innerLi);
      }

      bulletsLayer.appendChild(ulContainer);

      buttonsLayer.className = 'introjs-tooltipbuttons';
      if (!this._options.showButtons) {
        buttonsLayer.style.display = 'none';
      }

      tooltipLayer.className = 'introjs-tooltip';
      tooltipLayer.appendChild(tooltipTextLayer);
      tooltipLayer.appendChild(bulletsLayer);

      //add helper layer number
      var helperNumberLayer;
      if (this._options.showStepNumbers) {
        helperNumberLayer = document.createElement('div');
        helperNumberLayer.className = 'introjs-helperNumberLayer';
        helperNumberLayer.innerHTML = targetElement.step;
        helperLayer.appendChild(helperNumberLayer);
      }
      tooltipLayer.appendChild(arrowLayer);
      helperLayer.appendChild(tooltipLayer);

      //next button
      nextTooltipButton = document.createElement('a');

      nextTooltipButton.onclick = function() {
        if (self._introItems.length - 1 !== self._currentStep) {
          _nextStep.call(self);
        }
      };

      nextTooltipButton.href = 'javascript:void(0);';
      nextTooltipButton.innerHTML = currentItem.nextLabel;

      //previous button
      prevTooltipButton = document.createElement('a');

      prevTooltipButton.onclick = function() {
        if (self._currentStep !== 0) {
          _previousStep.call(self);
        }
      };

      prevTooltipButton.href = 'javascript:void(0);';
      prevTooltipButton.innerHTML = currentItem.prevLabel;

      //skip button
      skipTooltipButton = document.createElement('a');
      skipTooltipButton.className = 'introjs-button introjs-skipbutton';
      skipTooltipButton.href = 'javascript:void(0);';
      skipTooltipButton.innerHTML = currentItem.skipLabel;

      skipTooltipButton.onclick = function(e) {
        if (self._introItems.length - 1 === self._currentStep && typeof self._introCompleteCallback === 'function') {
          self._introCompleteCallback.call(self, {
            skipButtonEvent: e
          });
        }

        if (self._introItems.length - 1 != self._currentStep && typeof self._introExitCallback === 'function') {
          self._introExitCallback.call(self, {
            skipButtonEvent: e
          });
        }

        _exitIntro.call(self, self._targetElement);
      };

      buttonsLayer.appendChild(skipTooltipButton);

      //in order to prevent displaying next/previous button always
      if (this._introItems.length > 1) {
        buttonsLayer.appendChild(prevTooltipButton);
        buttonsLayer.appendChild(nextTooltipButton);
      }

      tooltipLayer.appendChild(buttonsLayer);

      //set proper position
      _placeTooltip.call(self, targetElement.element, tooltipLayer, arrowLayer, helperNumberLayer);
    }

    // show disabled prev button on checkpoints?
    var at_checkpoint = false;
    for (i = 0; i < this._options.checkpoints.length; i++) {
      if (this._options.checkpoints[i] === this._currentStep) {
        at_checkpoint = true;
        break;
      }
    }

    if (this._currentStep === 0 && this._introItems.length > 1) {
      // first step but not last
      prevTooltipButton.className = 'introjs-button introjs-prevbutton introjs-hidden';
      nextTooltipButton.className = 'introjs-button introjs-only-nextbutton';
      skipTooltipButton.innerHTML = currentItem.skipLabel;

      //Set focus on "next" button, so that hitting Enter always moves you onto the next step
      if (this._options.focusOnNextDoneButtons) {
        nextTooltipButton.focus();
      }
    } else if (this._introItems.length - 1 === this._currentStep && this._introItems.length > 1) {
      // last step
      prevTooltipButton.className = 'introjs-button introjs-only-prevbutton' + (at_checkpoint ? ' introjs-hidden' : '');
      nextTooltipButton.className = 'introjs-button introjs-nextbutton introjs-hidden';
      skipTooltipButton.innerHTML = currentItem.skipLabel;

      //Set focus on "next" button, so that hitting Enter always moves you onto the next step
      if (this._options.focusOnNextDoneButtons) {
        skipTooltipButton.focus();
      }
    } else if (this._introItems.length === 1) {
      // the only step there is
      prevTooltipButton.className = 'introjs-button introjs-prevbutton introjs-hidden';
      nextTooltipButton.className = 'introjs-button introjs-nextbutton introjs-hidden';
      skipTooltipButton.innerHTML = currentItem.skipLabel;

      //Set focus on "next" button, so that hitting Enter always moves you onto the next step
      if (this._options.focusOnNextDoneButtons) {
        skipTooltipButton.focus();
      }
    } else {
      // some intermediate step
      prevTooltipButton.className = 'introjs-button' + (at_checkpoint ? ' introjs-prevbutton introjs-hidden' : ' introjs-prevbutton');
      nextTooltipButton.className = 'introjs-button' + (at_checkpoint ? ' introjs-only-nextbutton' : ' introjs-nextbutton');
      skipTooltipButton.innerHTML = currentItem.skipLabel;

      //Set focus on "next" button, so that hitting Enter always moves you onto the next step
      if (this._options.focusOnNextDoneButtons) {
        nextTooltipButton.focus();
      }
    }

    //add target element position style
    targetElement.element.className += ' introjs-showElement';

    var currentElementPosition = _getPropValue(targetElement.element, 'position');
    if (currentElementPosition !== 'absolute' &&
        currentElementPosition !== 'relative' &&
        currentElementPosition !== 'fixed') {
      //change to new intro item
      targetElement.element.className += ' introjs-relativePosition';
    }

    var parentElm = targetElement.element.parentNode;
    while (parentElm != null) {
      if (parentElm.tagName.toLowerCase() === 'body' || parentElm.tagName.toLowerCase() === 'html') break;

      //fix The Stacking Context problem.
      //More detail: https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Understanding_z_index/The_stacking_context
      var zIndex = _getPropValue(parentElm, 'z-index');
      var opacity = parseFloat(_getPropValue(parentElm, 'opacity'));
      if (/[0-9]+/.test(zIndex) || opacity < 1) {
        parentElm.className += ' introjs-fixParent';
      }

      parentElm = parentElm.parentNode;
    }

    if (targetElement.element.tagName.toLowerCase() === 'body') {
      window.scrollTo(0, 0); // scroll to top when highlighting the whole page
    } else if (/* !_elementInViewport(targetElement.element)) && */ this._options.scrollToElement) {
      var rect = targetElement.element.getBoundingClientRect(),
        winHeight = _getWinSize().height,
        top = rect.top,
        bottom = Math.min(rect.bottom - winHeight, rect.top - 130); // do not overscroll the top + 30px padding

      //Scroll up
      if (top < 0 || targetElement.element.clientHeight > winHeight) {
        window.scrollBy(0, Math.round(top - 30)); // 30px padding from edge to look nice

      //Scroll down
      } else {
        window.scrollBy(0, Math.round(bottom + 100)); // 70px + 30px padding from edge to look nice
      }
    }

    if (typeof this._introAfterChangeCallback !== 'undefined') {
        this._introAfterChangeCallback.call(this, targetElement.element);
    }
  }

  /**
   * Get an element CSS property on the page
   * Thanks to JavaScript Kit: http://www.javascriptkit.com/dhtmltutors/dhtmlcascade4.shtml
   *
   * @api private
   * @method _getPropValue
   * @param {Object} element
   * @param {String} propName
   * @returns Element's property value
   */
  function _getPropValue (element, propName) {
    var propValue = '';
    if (element.currentStyle) { //IE
      propValue = element.currentStyle[propName];
    } else if (document.defaultView && document.defaultView.getComputedStyle) { //Others
      propValue = document.defaultView.getComputedStyle(element, null).getPropertyValue(propName);
    }

    //Prevent exception in IE
    if (propValue && propValue.toLowerCase) {
      return propValue.toLowerCase();
    } else {
      return propValue;
    }
  }

  /**
   * Provides a cross-browser way to get the screen dimensions
   * via: http://stackoverflow.com/questions/5864467/internet-explorer-innerheight
   *
   * @api private
   * @method _getWinSize
   * @returns {Object} width and height attributes
   */
  function _getWinSize() {
    if (window.innerWidth) {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    } else {
      var D = document.documentElement;
      return {
        width: D.clientWidth,
        height: D.clientHeight
      };
    }
  }

  /**
   * Add overlay layer to the page
   * http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
   *
   * @api private
   * @method _elementInViewport
   * @param {Object} el
   */
  function _elementInViewport(el) {
    var rect = el.getBoundingClientRect();
    var winsize = _getWinSize();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      (rect.bottom + 80) <= winsize.height && // add 80 to get the text right
      rect.right <= winsize.width
    );
  }

  /**
   * Add overlay layer to the page
   *
   * @api private
   * @method _addOverlayLayer
   * @param {Object} targetElm
   */
  function _addOverlayLayer(targetElm) {
    var overlayLayer = document.createElement('div'),
        styleText = '',
        self = this;

    //set css class name
    overlayLayer.className = 'introjs-overlay';

    //check if the target element is body, we should calculate the size of overlay layer in a better way
    if (targetElm.tagName.toLowerCase() === 'body') {
      styleText += 'top: 0;bottom: 0; left: 0;right: 0;position: fixed;';
      overlayLayer.setAttribute('style', styleText);
    } else {
      //set overlay layer position
      var elementPosition = _getOffset(targetElm);
      if (elementPosition) {
        styleText += 'width: ' + elementPosition.width + 'px; height:' + elementPosition.height + 'px; top:' + elementPosition.top + 'px;left: ' + elementPosition.left + 'px;';
        overlayLayer.setAttribute('style', styleText);
      }
    }

    targetElm.appendChild(overlayLayer);

    overlayLayer.onclick = function(e) {
      if (self._options.exitOnOverlayClick) {
        //check if any callback is defined
        if (typeof self._introExitCallback === 'function') {
          self._introExitCallback.call(self, {
            overlayClickEvent: e
          });
        }

        _exitIntro.call(self, targetElm);
      }
    };

    setTimeout(function() {
      styleText += 'opacity: ' + self._options.overlayOpacity.toString() + ';';
      overlayLayer.setAttribute('style', styleText);
    }, 10);

    return true;
  }

  /**
   * Get an element position on the page
   * Thanks to `meouw`: http://stackoverflow.com/a/442474/375966
   *
   * @api private
   * @method _getOffset
   * @param {Object} element
   * @returns Element's position info
   */
  function _getOffset(element) {
    var elementPosition = {};

    //set width
    elementPosition.width = element.offsetWidth;

    //set height
    elementPosition.height = element.offsetHeight;

    //calculate element top and left
    var _x = 0;
    var _y = 0;
    while (element && !isNaN(element.offsetLeft) && !isNaN(element.offsetTop)) {
      _x += element.offsetLeft;
      _y += element.offsetTop;
      element = element.offsetParent;
    }
    //set top
    elementPosition.top = _y;
    //set left
    elementPosition.left = _x;

    return elementPosition;
  }

  /**
   * Overwrites obj1's values with obj2's and adds obj2's if non existent in obj1
   * via: http://stackoverflow.com/questions/171251/how-can-i-merge-properties-of-two-javascript-objects-dynamically
   *
   * @param obj1
   * @param obj2
   * @returns obj3 a new object based on obj1 and obj2
   */
  function _mergeOptions(obj1, obj2) {
    var obj3 = {};
    var attrname;
    for (attrname in obj1) {
      if (obj1.hasOwnProperty(attrname)) {
        obj3[attrname] = obj1[attrname];
      }
    }
    for (attrname in obj2) {
      if (obj2.hasOwnProperty(attrname)) {
        obj3[attrname] = obj2[attrname];
      }
    }
    return obj3;
  }

  var introJs = function (targetElm, textData) {
    if (typeof targetElm === 'object') {
      //Ok, create a new instance
      return new IntroJs(targetElm, textData);

    } else if (typeof targetElm === 'string') {
      //select the target element with query selector
      var targetElement = document.querySelector(targetElm);

      if (targetElement) {
        return new IntroJs(targetElement, textData);
      } else {
        throw new Error('There is no element with given selector.');
      }
    } else {
      return new IntroJs(document.body, textData);
    }
  };

  /**
   * Current IntroJs version
   *
   * @property version
   * @type String
   */
  introJs.version = VERSION;

  //Prototype
  introJs.fn = IntroJs.prototype = {
    clone: function () {
      return new IntroJs(this, _cloneObject(this._textData));
    },
    setOption: function(option, value) {
      this._options[option] = value;
      return this;
    },
    setOptions: function(options) {
      this._options = _mergeOptions(this._options, options);
      return this;
    },
    start: function () {
      _introForElement.call(this, this._targetElement);
      return this;
    },
    goToStep: function(step) {
      _goToStep.call(this, step);
      return this;
    },
    goToStepNumber: function(step) {
      _goToStepNumber.call(this, step);
      return this;
    },
    nextStep: function() {
      _nextStep.call(this);
      return this;
    },
    previousStep: function() {
      _previousStep.call(this);
      return this;
    },
    getCurrentStep: function() {
      return this._currentStep;
    },
    getOverlay: function() {
      return this._targetElement.querySelector('.introjs-overlay');
    },
    getTextData: function() {
      return this._textData;
    },
    exit: function() {
      if (typeof this._introExitCallback === 'function') {
        this._introExitCallback.call(this, {
          keyDownEvent: e
        });
      }
      _exitIntro.call(this, this._targetElement);
    },
    refresh: function() {
      _setHelperLayerPosition.call(this, document.querySelector('.introjs-helperLayer'));
      return this;
    },
    onbeforechange: function(providedCallback) {
      if (typeof providedCallback === 'function') {
        this._introBeforeChangeCallback = providedCallback;
      } else {
        throw new Error('Provided callback for onbeforechange was not a function');
      }
      return this;
    },
    onchange: function(providedCallback) {
      if (typeof providedCallback === 'function') {
        this._introChangeCallback = providedCallback;
      } else {
        throw new Error('Provided callback for onchange was not a function.');
      }
      return this;
    },
    onafterchange: function(providedCallback) {
      if (typeof providedCallback === 'function') {
        this._introAfterChangeCallback = providedCallback;
      } else {
        throw new Error('Provided callback for onafterchange was not a function');
      }
      return this;
    },
    oncomplete: function(providedCallback) {
      if (typeof providedCallback === 'function') {
        this._introCompleteCallback = providedCallback;
      } else {
        throw new Error('Provided callback for oncomplete was not a function.');
      }
      return this;
    },
    onexit: function(providedCallback) {
      if (typeof providedCallback === 'function') {
        this._introExitCallback = providedCallback;
      } else {
        throw new Error('Provided callback for onexit was not a function.');
      }
      return this;
    }
  };

  exports.introJs = introJs;
  return introJs;
}));
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
