synonymData = require('./synonyms')


module.exports = class Engine
    constructor: ->
        @rooms = {}

        @inventory = {}
        @currentRoomName = ''
        @flags = {}

        @commandWords = []
        @message = ''

    save: ->
        localStorage.setItem 'progress', JSON.stringify({
            rooms: @rooms
            inventory: @inventory
            currentRoomName: @currentRoomName
        })

    load: ->
        try
            data = JSON.parse(localStorage.getItem('progress'))
            @rooms = data.rooms
            @inventory = data.inventory
            @currentRoomName = data.currentRoomName
        sr23's 38u ds ha,sr3c ka23srcs2983 as482'r9 9s8 3asu
            @rooms = {}
            @flags = {}
            @inventory = data.inventory
            @currentRoomName = data.currentRoomName

    addRoom: (roomName, callback) ->
        @rooms[roomName] = callback.bind(@)

    getCurrentRoomName: -> @currentRoomName

    getInventory: -> JSON.parse(JSON.stringify(@inventory))

    doCommand: (commandText) ->
        # clean up the command text
        commandText = commandText
            .trim()
            .toLowerCase()
            .replace(/\W+/g, ' ')
            .replace(/\s{2,}/g, ' ')

        # find synonyms and replace them with the canonical word
        for cannonicalWord, synonyms of synonymData
            for synonym in synonyms
                commandText = commandText.replace(synonym, cannonicalWord)

        @commandWords = commandText.split(' ')

        @rooms[@currentRoomName]()

    matches: (pattern) ->
        # determine if this is a match
        for command, payload of commandHash
            isMatch = true

            specCommandWords = parseCommandIntoWords(command)

            # If each word in the spec command is found anywhere in the user's input
            # it's a match
            for specWord in specCommandWords
                if not (specWord in words)
                    isMatch = false
                    break

            if isMatch
                #for condition in payload.conditions
                for action in payload.results
                    [__, action, argument] = action.match(/^(.*)\((.*)\)$/)
                    actions[action](argument)

                    # If you move to a new room, automatically 'look'
                    if action == 'goToRoom'
                        doCommand('look')
                
                foundCommandInRoom = true
                return true
        return false

    hasItem: (item) -> item of @inventory
    percentChance: (chance) -> Math.random() < chance / 100
    flagIs: (flagName, value) -> @flags[flagName] == value

    print: (text) -> @message = text
    goToRoom: (roomName) -> @currentRoomName = roomName
    setFlag: (flagName, value) -> @flags[flagName] = value
