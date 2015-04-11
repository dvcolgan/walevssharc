flux = require('app/flux')
{rooms, globalCommands, startRoom} = require('app/data')
actions = require('app/actions')


module.exports = flux.createStore
    init: ->
        @currentRoomName = startRoom
        @currentRoomData = rooms[startRoom]

    onGoToRoom: (roomName) ->
        @currentRoomName = roomName
        @currentRoomData = rooms[roomName]
        @notify()

    getCurrentRoomName: -> @currentRoomName
    getCurrentRoomData: -> @currentRoomData
    getGlobalCommands: -> globalCommands
