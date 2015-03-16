var m = require('mithril');


var SuperFlux = function(args) {
    var socket = args.socket;

    var actions = {};
    var stores = {};
    var callbacks = {};

    return {
        createStore: function(store) {
            store.notify = m.redraw;

            for (var key in store) {
                var value = store[key];

                // Register functions in the store as listeners if they start with 'on'
                if (typeof(value) === 'function' && key.startsWith('on')) {

                    // Extract the action name from the function name:
                    // onCreateTodo -> createTodo
                    var actionName = key[2].toLowerCase() + key.substr(3, key.length-1);

                    if (!(actionName in callbacks)) {
                        callbacks[actionName] = [];
                    }
                    callbacks[actionName].push(value.bind(store));
                }

                // Call the constructor if present
                if ('init' in store) {
                    store.init();
                }
            }

            return store;
        },

        createActions: function(spec) {
            var socketListen = spec.socketListen || {};
            var socketEmit = spec.socketEmit || {};
            var local = spec.local || {};
            var async = spec.local || {};

            local.map(function(name) {
                actions[name] = function(args) {
                    for (var i=0; i < callbacks[name].length; i++) {
                        var callback = callbacks[name][i];
                        callback(args);
                    }
                };
            });

            socketListen.map(function(name) {
                socket.on(name, function(data) {
                    for (var i=0; i < callbacks[name].length; i++) {
                        var callback = callbacks[name][i];
                        callback(args);
                    }
                });
            });

            socketEmit.map(function(name) {
                actions[name] = function(args) {
                    socket.emit(name, args);
                    for (var i=0; i < callbacks[name].length; i++) {
                        var callback = callbacks[name][i];
                        callback(args);
                    }
                };
            });

            Object.keys(async).map(function(name) {
                var configFn = async[name];
                actions[name] = function(args) {
                    for (var i=0; i < callbacks[name].length; i++) {
                        var callback = callbacks[name][i];
                        callback(args);
                    }

                    var options = configFn(args);
                    m.request({
                        method: options.method,
                        url: options.url,
                        data: options.data,
                        background: true
                    });
                };
            });

            return actions;
        }
    };
};

module.exports = SuperFlux;
