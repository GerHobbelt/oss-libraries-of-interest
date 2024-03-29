/**
 * postal - Pub/Sub library providing wildcard subscriptions, complex message handling, etc.  Works server and client-side.
 * Author: Jim Cowart (http://freshbrewedcode.com/jimcowart)
 * Version: v0.9.0-rc2
 * Url: http://github.com/postaljs/postal.js
 * License(s): MIT, GPL
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        // Node, or CommonJS-Like environments
        module.exports = factory(require("underscore"), this);
    } else if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["underscore"], function (_) {
            return factory(_, root);
        });
    } else {
        // Browser globals
        root.postal = factory(root._, root);
    }
}(this, function (_, global, undefined) {
    var _postal;
    var prevPostal = global.postal;
    var ChannelDefinition = function (channelName) {
        this.channel = channelName || _postal.configuration.DEFAULT_CHANNEL;
        this.initialize();
    };
    ChannelDefinition.prototype.initialize = function () {};
    ChannelDefinition.prototype.subscribe = function () {
        return _postal.subscribe({
            channel: this.channel,
            topic: (arguments.length === 1 ? arguments[0].topic : arguments[0]),
            callback: (arguments.length === 1 ? arguments[0].callback : arguments[1])
        });
    };
    ChannelDefinition.prototype.publish = function () {
        var envelope = arguments.length === 1 ? (Object.prototype.toString.call(arguments[0]) === "[object String]" ? {
            topic: arguments[0]
        } : arguments[0]) : {
            topic: arguments[0],
            data: arguments[1]
        };
        envelope.channel = this.channel;
        _postal.publish(envelope);
    };
    var SubscriptionDefinition = function (channel, topic, callback) {
        if (arguments.length !== 3) {
            throw new Error("You must provide a channel, topic and callback when creating a SubscriptionDefinition instance.");
        }
        if (topic.length === 0) {
            throw new Error("Topics cannot be empty");
        }
        this.channel = channel;
        this.topic = topic;
        this.subscribe(callback);
    };
    SubscriptionDefinition.prototype = {
        unsubscribe: function () {
            if (!this.inactive) {
                this.inactive = true;
                _postal.unsubscribe(this);
            }
        },
        subscribe: function (callback) {
            this.callback = callback;
            return this;
        },
        withContext: function (context) {
            this.context = context;
            return this;
        }
    };
    var bindingsResolver = {
        cache: {},
        regex: {},
        compare: function (binding, topic) {
            var pattern, rgx, prevSegment, result = (this.cache[topic] && this.cache[topic][binding]);
            if (typeof result !== "undefined") {
                return result;
            }
            if (!(rgx = this.regex[binding])) {
                pattern = "^" + _.map(binding.split("."), function (segment) {
                    var res = "";
                    if ( !! prevSegment) {
                        res = prevSegment !== "#" ? "\\.\\b" : "\\b";
                    }
                    if (segment === "#") {
                        res += "[\\s\\S]*";
                    } else if (segment === "*") {
                        res += "[^.]+";
                    } else {
                        res += segment;
                    }
                    prevSegment = segment;
                    return res;
                }).join("") + "$";
                rgx = this.regex[binding] = new RegExp(pattern);
            }
            this.cache[topic] = this.cache[topic] || {};
            this.cache[topic][binding] = result = rgx.test(topic);
            return result;
        },
        reset: function () {
            this.cache = {};
            this.regex = {};
        }
    };
    var fireSub = function (subDef, envelope) {
        if (!subDef.inactive && _postal.configuration.resolver.compare(subDef.topic, envelope.topic)) {
            subDef.callback.call(subDef.context || this, envelope.data, envelope);
        }
    };
    var pubInProgress = 0;
    var unSubQueue = [];
    var clearUnSubQueue = function () {
        while (unSubQueue.length) {
            _postal.unsubscribe(unSubQueue.shift());
        }
    };
    _postal = {
        configuration: {
            resolver: bindingsResolver,
            DEFAULT_CHANNEL: "/",
            SYSTEM_CHANNEL: "postal"
        },
        subscriptions: {},
        wireTaps: [],
        ChannelDefinition: ChannelDefinition,
        SubscriptionDefinition: SubscriptionDefinition,
        channel: function (channelName) {
            return new ChannelDefinition(channelName);
        },
        subscribe: function (options) {
            var subDef = new SubscriptionDefinition(options.channel || this.configuration.DEFAULT_CHANNEL, options.topic, options.callback);
            var channel = this.subscriptions[subDef.channel];
            var subs;
            this.publish({
                channel: this.configuration.SYSTEM_CHANNEL,
                topic: "subscription.created",
                data: {
                    event: "subscription.created",
                    channel: subDef.channel,
                    topic: subDef.topic
                }
            });
            if (!channel) {
                channel = this.subscriptions[subDef.channel] = {};
            }
            subs = this.subscriptions[subDef.channel][subDef.topic];
            if (!subs) {
                subs = this.subscriptions[subDef.channel][subDef.topic] = [];
            }
            subs.push(subDef);
            return subDef;
        },
        publish: function (envelope) {
            ++pubInProgress;
            envelope.channel = envelope.channel || this.configuration.DEFAULT_CHANNEL;
            envelope.timeStamp = new Date();
            _.each(this.wireTaps, function (tap) {
                tap(envelope.data, envelope);
            });
            if (this.subscriptions[envelope.channel]) {
                _.each(this.subscriptions[envelope.channel], function (subscribers) {
                    var idx = 0,
                        len = subscribers.length,
                        subDef;
                    while (idx < len) {
                        if (subDef = subscribers[idx++]) {
                            fireSub(subDef, envelope);
                        }
                    }
                });
            }
            if (--pubInProgress === 0) {
                clearUnSubQueue();
            }
        },
        unsubscribe: function () {
            var idx = 0;
            var subs = Array.prototype.slice.call(arguments, 0);
            var subDef;
            while (subDef = subs.shift()) {
                if (pubInProgress) {
                    unSubQueue.push(subDef);
                    return;
                }
                if (this.subscriptions[subDef.channel] && this.subscriptions[subDef.channel][subDef.topic]) {
                    var len = this.subscriptions[subDef.channel][subDef.topic].length;
                    idx = 0;
                    while (idx < len) {
                        if (this.subscriptions[subDef.channel][subDef.topic][idx] === subDef) {
                            this.subscriptions[subDef.channel][subDef.topic].splice(idx, 1);
                            break;
                        }
                        idx += 1;
                    }
                }
                this.publish({
                    channel: this.configuration.SYSTEM_CHANNEL,
                    topic: "subscription.removed",
                    data: {
                        event: "subscription.removed",
                        channel: subDef.channel,
                        topic: subDef.topic
                    }
                });
            }
        },
        addWireTap: function (callback) {
            var self = this;
            self.wireTaps.push(callback);
            return function () {
                var idx = self.wireTaps.indexOf(callback);
                if (idx !== -1) {
                    self.wireTaps.splice(idx, 1);
                }
            };
        },
        noConflict: function () {
            if (typeof window === "undefined" || (typeof window !== "undefined" && typeof define === "function" && define.amd)) {
                throw new Error("noConflict can only be used in browser clients which aren't using AMD modules");
            }
            global.postal = prevPostal;
            return this;
        },
        getSubscribersFor: function () {
            var channel = arguments[0],
                tpc = arguments[1];
            if (arguments.length === 1) {
                channel = arguments[0].channel || this.configuration.DEFAULT_CHANNEL;
                tpc = arguments[0].topic || arguments[0];
            }
            if (this.subscriptions[channel] && Object.prototype.hasOwnProperty.call(this.subscriptions[channel], tpc)) {
                return this.subscriptions[channel][tpc];
            }
            return [];
        },
        reset: function () {
            this.unsubscribeFor();
            this.configuration.resolver.reset();
            this.subscriptions = {};
        },
        unsubscribeFor: function (options) {
            var predicate = options ||
            function () {
                return true;
            };
            var toDispose = [];
            if (typeof options === "object") {
                predicate = function (sub) {
                    var compared = 0,
                        matched = 0;
                    _.each(options, function (val, prop) {
                        compared += 1;
                        if (
                        // We use the bindings resolver to compare the options.topic to subDef.topic
                        (prop === "topic" && _postal.configuration.resolver.compare(sub.topic, options.topic))
                        // We need to account for the context possibly being available on callback due to Conduit
                        || (prop === "context" && options.context === (sub.callback.context && sub.callback.context() || sub.context))
                        // Any other potential prop/value matching outside topic & context...
                        || (sub[prop] === options[prop])) {
                            matched += 1;
                        }
                    });
                    return compared === matched;
                };
            }
            if (this.subscriptions) {
                // Dear lord, it's an iterative pyramid of doom!
                // I suppose I could optimize this by adding
                // a data structure that flattens the total
                // list of subscription definition instances...
                // we'll see if it becomes necessary
                _.each(this.subscriptions, function (channel) {
                    _.each(channel, function (subList) {
                        toDispose = toDispose.concat(_.filter(subList, predicate));
                    });
                });
                this.unsubscribe.apply(this, toDispose);
            }
        }
    };
    var _publish = _postal.publish;
    _postal.publish = new Conduit({
        target: _publish,
        context: _postal
    });
    _postal.subscriptions[_postal.configuration.SYSTEM_CHANNEL] = {};
    if (global && Object.prototype.hasOwnProperty.call(global, "__postalReady__") && _.isArray(global.__postalReady__)) {
        while (global.__postalReady__.length) {
            global.__postalReady__.shift().onReady(_postal);
        }
    }
    return _postal;
}));







// Ensure this file has completely loaded AND PARSED before we take off...
if (typeof window !== "undefined") { window.visyond_file_counter = (!window.visyond_file_counter ? 1 : window.visyond_file_counter + 1); }
