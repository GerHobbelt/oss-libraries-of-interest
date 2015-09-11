"use strict";

var _ = require("../lodash"),
    util = require("../util"),
    positionX = require("./bk").positionX;

module.exports = position;

function position(g) {
  g = util.asNonCompoundGraph(g);

  positionY(g);
  _.each(positionX(g), function(x, v) {
    g.node(v).x = x;
  });
}

function positionY(g) {
  var layering = util.buildLayerMatrix(g),
      rankSep = g.graph().ranksep,
      prevY = 0;
  _.each(layering, function(layer) {
    var maxHeight = _.max(_.map(layer, function(v) { return g.node(v).height; }));
    _.each(layer, function(v) {
      g.node(v).y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + rankSep;
  });
}

















// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
