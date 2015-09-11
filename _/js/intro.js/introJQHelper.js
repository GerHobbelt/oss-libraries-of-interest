//check if exists
$.fn.exists = function () {
    return this.length !== 0;
};

//quick attach numbered intro text
$.fn.introText = function (t, c) {
  if (this.exists()) {
    if (c.val === 1) {
      t += ' (You can use the ←, →, enter or exit keys to navigate the tour.)';
    }
    this.first().attr('data-intro', t);
    this.first().attr('data-intro-step', c.val);
    this.first().attr('data-intro-text', t); //if using the intro.js on this git
    this.first().attr('data-intro-step', c.val); // if using the intro.js on this git
    c.val++;
    return true;
  }
  return false;
};

//Start intro click (just set class introStart on a clickable element)
$('.introStart').click(function () {
  //c is an object so it can be passed by memory reference
  var c = new Object({
    val: 1
  });

  /* attach objects you want a tour on like this
  $('div').introText('This is a Div',c); // step 1
  $('span').introText('This is a span',c); // step 2

  this can be done outside of the .click function
  make sure if you do this elsewhere you declare c as an object as seen above
  personally I like it here because it doesn't get loaded into the DOM unless needed (when clicked)
  */

  var nextPage = $(this).attr('data-intro-next-href'); //a valid href for next page does not validate
  var nextSection = $(this).attr('data-intro-next-section'); //the selector designated by data-intro-next-section kinda works, seems clunky
  var section = $(this).attr('data-intro-section'); //the selector designated by data-intro-section
  if (nextPage) {
    //Arbitrarily decided next page is only on whole page intros, and will not do a section intro if section is set
    introJs().setOption('doneLabel', 'Next Page').start().oncomplete(function () {
      window.location.href = nextPage;
    });
  } else if ($(nextSection).exists()) {
    //this works but is wonky
    if ($(section).exists()) {
      introJs(section).setOption('doneLabel', 'Next Section').start().oncomplete(function () {
        introJs(nextSection).start();
      });
    } else {
      introJs().setOption('doneLabel', 'Next Section').start().oncomplete(function () {
        introJs(nextSection).start();
      });
    }
  } else {
    if ($(section).exists()) {
      introJs(section).start();
    } else {
      introJs().start();
    }
  }
});
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
