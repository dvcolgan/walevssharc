flux = require('app/flux')
itemData = require('app/data').items


module.exports = flux.createStore
    init: ->
        @itemStates = {}
        #for item
