synonymData = require('./synonyms')


module.exports = class Engine
    constructor: ->
        @rooms = {}
        @universalCommands = ->
        @afterCommand = ->

        @inventory = {}
        @currentRoomName = ''
        @flags = {}
        @roomsEntered = {}

        @commandWords = []
        @commandText = ''
        @message = ''

        @callbacks = []
        @startRoom = ''

        @waitCallback = null

        @previousCommands = []

    setStartRoom: (roomName) ->
        @startRoom = roomName

    setAfterCommand: (callback) ->
        @afterCommand = callback.bind(@)

    save: ->
        localStorage.setItem 'progress', JSON.stringify({
            inventory: @inventory
            currentRoomName: @currentRoomName
            previousCommands: @previousCommands
            flags: @flags
            roomsEntered: @roomsEntered
        })

    load: ->
        try
            data = JSON.parse(localStorage.getItem('progress'))
            @inventory = data.inventory
            @currentRoomName = data.currentRoomName
            @previousCommands = data.previousCommands or []
            @flags = data.flags
            @roomsEntered = data.roomsEntered
            return true
        catch
            localStorage.clear()
            return false

    addRoom: (roomName, callback) ->
        @rooms[roomName] = callback.bind(@)

    getCurrentRoomName: -> @currentRoomName

    getCurrentMessage: -> @message

    getInventory: -> JSON.parse(JSON.stringify(@inventory))

    doCommand: (@commandText) ->
        if @waitCallback?
            callback = @waitCallback
            @waitCallback = null
            callback()
            return

        @previousCommands.push(@commandText)

        # clean up the command text
        @commandText = @commandText
            .trim()
            .toLowerCase()
            .replace(/\W+/g, ' ')
            .replace(/\s{2,}/g, ' ')

        # find synonyms and replace them with the canonical word
        for cannonicalWord, synonyms of synonymData
            for synonym in synonyms
                @commandText = @commandText.replace(synonym, cannonicalWord)

        @commandWords = @commandText.split(' ')

        @rooms[@currentRoomName]()
        @afterCommand()

    setUniversalCommands: (callback) ->
        @universalCommands = callback.bind(@)

    tryUniversalCommands: ->
        @universalCommands()

    exactlyMatches: (pattern) ->
        @commandText == pattern

    matches: (pattern) ->
        # If each word in the spec command is found
        # anywhere in the user's input it's a match
        patternWords = pattern.split(' ')
        for patternWord in patternWords
            if not (patternWord in @commandWords)
                return false
        return true

    hasItem: (item) -> item of @inventory
    usedItem: (item) -> item of @inventory and @inventory[item] == 'used'

    percentChance: (chance) -> Math.random() < chance / 100

    flagIs: (flagName, value) -> @flags[flagName] == value

    isFirstTimeEntering: ->
        return @roomsEntered[@currentRoomName] == 1

    print: (text) ->
        @message = text
        @notify()

    goToRoom: (roomName) ->
        @currentRoomName = roomName
        if roomName of @roomsEntered
            @roomsEntered[roomName]++
        else
            @roomsEntered[roomName] = 1
        @doCommand('__enter_room__')
        @notify()

    goToStart: ->
        @goToRoom(@startRoom)

    setFlag: (flagName, value) ->
        @flags[flagName] = value
        @notify()

    getItem: (item) ->
        @inventory[item] = 'gotten'
        @notify()

    removeItem: (item) ->
        delete @inventory[item]
        @notify()

    useItem: (item) ->
        @inventory[item] = 'used'
        @notify()

    wait: (callback) ->
        @message += ' <strong>(Hit Enter)</strong>'
        @waitCallback = callback
        @notify()

    listen: (callback) -> @callbacks.push(callback)

    notify: -> callback() for callback in @callbacks
