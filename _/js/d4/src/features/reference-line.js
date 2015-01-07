(function() {
  'use strict';
  /*
   * The reference line feature is helpful when you want to apply a line to a chart
   * which demarcates a value within the data. For example a common use of this
   * feature is to specify the zero value across an axis.
   *
   * @name referenceLine
   */
  d4.feature('referenceLine', function(name) {
    return {
      accessors: {
        x1: function() {
          return this.x(this.x.domain()[0]);
        },

        x2: function() {
          return this.x(this.x.domain()[1]);
        },

        y1: function() {
          return this.y(this.y.domain()[1]);
        },

        y2: function() {
          return this.y(this.y.domain()[0]);
        },
        classes: function() {
          return 'line';
        }
      },
      render: function(scope, data, selection) {
        selection.append('g').attr('class', name);
        var referenceLine = d4.appendOnce(this.svg.select('.' + name), 'line')
          .attr('class', d4.functor(scope.accessors.classes).bind(this))
          .attr('x1', d4.functor(scope.accessors.x1).bind(this))
          .attr('x2', d4.functor(scope.accessors.x2).bind(this))
          .attr('y1', d4.functor(scope.accessors.y1).bind(this))
          .attr('y2', d4.functor(scope.accessors.y2).bind(this));
        return referenceLine;
      }
    };
  });
}).call(this);
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
