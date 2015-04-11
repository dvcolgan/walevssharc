m = require('mithril')
flux = require('app/flux')
actions = require('app/actions')

scrollbackStore = require('app/stores/scrollback')
roomStore = require('app/stores/room')
inventoryStore = require('app/stores/inventory')

#data = require('app/data')
#window.prompt("Copy to clipboard: Ctrl+C, Enter", JSON.stringify(data))

String.prototype.capitalize = ->
    @[0].toUpperCase() + @[1..]

# TODO 
# talk to things
# pick up items (get, pick up, acquire)
# use items (use throw give punch)
# implement joke actions that are hardcoded (throw baby)
# implement default responses if you try to get, look at, or talk to something that doesn't exist

# TODO Refactor these command parsing functions into a class??? to appease EncryptedCow

synonymData = require('app/data').synonyms

parseCommandIntoWords = (commandText) ->
    commandText = commandText
        .trim()
        .toLowerCase()
        .replace(/\W+/g, ' ')
        .replace(/\s{2,}/g, ' ')

    for cannonicalWord, synonyms of synonymData
        for synonym in synonyms
            commandText = commandText.replace(synonym, cannonicalWord)

    words = commandText.split(' ')
    return words

#conditions =
#    itemNotInInventory: (item) -> not inventoryStore.hasItem(item)
#    itemInInventory: (item) -> inventoryStore.hasItem(item)
#    itemUsed: (item) -> 

tryCommands = (words, commandHash) ->
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


doCommand = (commandText) ->
    command = commandText.trim()

    if command != ''
        words = parseCommandIntoWords(command)

        found = tryCommands(words, roomStore.getCurrentRoomData())

        if not found
            found = tryCommands(words, roomStore.getGlobalCommands())

            if not found
                actions.print('What are you even trying to do?  That command makes no sense!')



class GameController
    constructor: ->
        @vm = {}
        @vm.editing = false
        @vm.command = m.prop('')

        doCommand('look')

    onCommandSubmit: (e) =>
        e.preventDefault()
        doCommand(@vm.command())
        @vm.command('')


gameView = (ctrl) ->
    currentRoomData = roomStore.getCurrentRoomData()
    currentRoomName = roomStore.getCurrentRoomName()
    [
        m '.sidebar',
            style:
                height: window.innerHeight + 'px'
                width: '160px'
                padding: '20px'
            m 'h2',
                style:
                    marginTop: 0
                'Inventory'
            
        m '.content',
            style:
                width: (window.innerWidth - 260) + 'px'
                padding: '20px'
                paddingTop: 0
            m 'button[type=button]',
                style:
                    float: 'right'
                onclick: ->
                    ctrl.vm.editing = !ctrl.vm.editing
                'Edit'
            m 'h1', currentRoomName
            #for message in scrollbackStore.getPreviousMessages()
            #m 'p', message
            m 'p', scrollbackStore.getTypingMessage()

            m 'form',
                onsubmit: ctrl.onCommandSubmit
                m 'input[type=text]',
                    style:
                        display: 'block'
                    onchange: m.withAttr('value', ctrl.vm.command)
                    value: ctrl.vm.command()
                    config: (element, isInitialized, context) ->
                        element.focus()
                m 'button[type=submit]', 'Do'

            if ctrl.vm.editing
                m 'ul',
                    m 'li',
                        m 'label[for=id_location]', 'Location Slug'
                        m 'input#id_location[type=text]',
                            value: ctrl.vm.location
                    m 'li',
                        m 'label[for=id_name]', 'Name'
                        m 'input#id_name[type=text]',
                            value: currentRoomName
                    for direction in ['north', 'south', 'east', 'west']
                        m 'li',
                            m "label[for=id_#{direction}]", direction.capitalize()
                            m "input#id_#{direction}[type=text]",
                                value: ctrl.vm.roomData[direction] or ''
    ]


m.module document.body,
    controller: GameController
    view: gameView
