(function() {
  'use strict';
  /*
   * The title is using for draw main text at the top of the chart
   *
   * @name title
   */
  d4.feature('title', function(name) {

    var textRect = function(text, klasses) {
      var rect = d4.helpers.textSize(text, klasses);
      rect.text = text;
      return rect;
    };

    var positionText = function(obj, aligned, width, offset, klass) {
      if (obj.text) {
        var titlesContainer = this.svg,
          height, textHeight = obj.height * 2,
          //FIX https://bugzilla.mozilla.org/show_bug.cgi?id=612118
          titlesContainerBB, node = titlesContainer.node();
        try {
          titlesContainerBB = node.node.getBBox();
        } catch (err) {
          titlesContainerBB = {
            x: node.clientLeft,
            y: node.clientTop,
            width: node.clientWidth,
            height: node.clientHeight
          };
        }
        if (klass === 'subtitle') {
          height = 6 + offset;
        } else {
          height = -6 + offset;
        }
        var text = titlesContainer.append('text')
          .text(obj.text)
          .attr('text-anchor', 'middle')
          .attr('class', 'chart-title ' + klass),
          x = (width / 2);
        if (aligned.toLowerCase() === 'bottom') {
          text.attr('transform', 'translate(' + (x + text.node().getBBox().width / 2) + ',' + (titlesContainerBB.height + textHeight) + ')');
        } else {
          text.attr('transform', 'translate(' + x + ',' + height + ')');
        }
      }
    };

    return {
      accessors: {
        align: 'top',
        width: 500, // Default width
        offset: 0,
        title: undefined,
        subtitle: undefined
      },
      render: function(scope, data, selection) {
        var title = textRect(d4.functor(scope.accessors.title).bind(this)(), 'title'),
          subtitle = textRect(d4.functor(scope.accessors.subtitle).bind(this)(), 'subtitle'),
          aligned = d4.functor(scope.accessors.align).bind(this)(),
          offset = d4.functor(scope.accessors.offset).bind(this)(),
          width = d4.functor(scope.accessors.width).bind(this)();
        this.svg.select('g.margins').insert('g')
          .attr('width', width)
          .attr('text-anchor', 'middle')
          .attr('class', 'titles ' + name);

        if (aligned === 'top') {
          positionText.bind(this)(title, aligned, width, offset, 'title');
          positionText.bind(this)(subtitle, aligned, width, offset, 'subtitle');
        } else {
          positionText.bind(this)(title, aligned, width, offset, 'title');
          positionText.bind(this)(subtitle, aligned, width, offset, 'subtitle');
        }
        return title;
      }
    };
  });
}).call(this);
















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
