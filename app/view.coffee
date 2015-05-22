m = require('mithril')
engine = require('app/engine')
WaleVsSharc = require('app/walevssharc')


String.prototype.capitalize = ->
    @[0].toUpperCase() + @[1..]


class TextTyper
    constructor: ->
        @currentMessage = ''
        @typer = null
        @makeTyper = (text, speed=4) ->
            i = 0
            typeLoop = ->
                i++
                m.redraw()
                if i < text.length - 1
                    setTimeout(typeLoop, speed)
            setTimeout(typeLoop, speed)

            return ->
                return text[..i]
    
    print: (message) ->
        if message != @currentMessage
            @currentMessage = message
            @typer = new @makeTyper(message)
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(message))
            m.redraw()

    getTypingMessage: -> if @typer? then @typer() else ''

    getCurrentMessage: -> @currentMessage


module.exports =
    controller: class
        constructor: ->

            WaleVsSharc(engine)
            didLoad = engine.load()

            @vm = {}
            @vm.command = m.prop('')
            @vm.typer = new TextTyper()

            engine.listen =>
                @vm.typer.print(engine.getCurrentMessage())
                m.redraw()
                engine.save()

            if didLoad
                engine.doCommand('look')
            else
                engine.goToStart()

        onCommandSubmit: (e) =>
            e.preventDefault()
            engine.doCommand(@vm.command())
            @vm.command('')

    view: (ctrl) ->
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
                for itemName, state of engine.getInventory()
                    if state == 'gotten'
                        m 'p',
                            itemName
                    else if state == 'used'
                        m 'p',
                            style:
                                textDecoration: 'line-through'
                            itemName

            m '.content',
                style:
                    width: (window.innerWidth - 260) + 'px'
                    padding: '20px'
                    paddingTop: 0
                m 'h1', engine.getCurrentRoomName()
                m 'p', ctrl.vm.typer.getTypingMessage()

                m 'form',
                    onsubmit: ctrl.onCommandSubmit
                    m 'input[type=text]',
                        style:
                            display: 'block'
                        onchange: m.withAttr('value', ctrl.vm.command)
                        value: ctrl.vm.command()
                        config: (element, isInitialized, context) ->
                            if not isInitialized
                                element.focus()
                    m 'button[type=submit]', 'Do'
        ]
