m = require('mithril')
engine = require('app/engine')


String.prototype.capitalize = ->
    @[0].toUpperCase() + @[1..]


class TextTyper
    constructor: ->
        @previousMessages = []
        @currentMessage = ''
        @typer = null
        notify = @notify
        @makeTyper = (text, speed=8) ->
            i = 0
            typeLoop = ->
                i++
                notify()
                if i < text.length - 1
                    setTimeout(typeLoop, speed)
            setTimeout(typeLoop, speed)

            return ->
                return text[..i]
    
    onPrint: (message) ->
        if @currentMessage != ''
            @previousMessages.push(@currentMessage)
        @currentMessage = message
        @typer = new @makeTyper(message)
        @notify()

    getPreviousMessages: -> @previousMessages

    getTypingMessage: -> if @typer? then @typer() else ''

    getCurrentMessage: -> @currentMessage


module.exports =
    controller: class
        constructor: ->
            @vm = {}
            @vm.editing = false
            @vm.command = m.prop('')

            doCommand('look')

        onCommandSubmit: (e) =>
            e.preventDefault()
            doCommand(@vm.command())
            @vm.command('')

    view: (ctrl) ->
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
                for itemName, state of inventoryStore.getAll()
                    if state == 'gotten'
                        m 'p',
                            data.items[itemName].name
                    else if state == 'used'
                        m 'p',
                            style:
                                textDecoration: 'line-through'
                            data.items[itemName].name

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
                m 'h1', engine.getCurrentRoomName()
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
        ]
