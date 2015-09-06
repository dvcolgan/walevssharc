m = require('mithril')
engine = require('app/engine')
WaleVsSharc = require('app/walevssharc')


String.prototype.capitalize = ->
    @[0].toUpperCase() + @[1..]


class TextTyper
    constructor: ->
        @currentMessage = ''
        @i = 0

    typeLoop: =>
        @i++
        m.redraw()
        if not @isDone()
            setTimeout(@typeLoop, 8)

    setMessage: (message) ->
        if message != @currentMessage
            @currentMessage = message
            @i = 0
            setTimeout(@typeLoop, 8)

    showAll: ->
        @i = @currentMessage.length - 1

    getTextSoFar: ->
        @currentMessage[..@i]

    isDone: ->
        console.log(@i, @currentMessage.length - 1)
        @i >= @currentMessage.length - 1
    

module.exports =
    controller: class
        constructor: ->

            WaleVsSharc(engine)
            didLoad = engine.load()

            @vm = {}
            @vm.command = m.prop('')
            @vm.typer = new TextTyper()

            engine.listen =>
                @vm.typer.setMessage(engine.getCurrentMessage())
                m.redraw()
                engine.save()

            if didLoad
                engine.doCommand('look')
            else
                engine.goToStart()

        onCommandSubmit: (e) =>
            e.preventDefault()
            if @vm.typer.isDone()
                engine.doCommand(@vm.command())
                @vm.command('')
            else
                @vm.typer.showAll()


    view: (ctrl) ->
        [
            m '.sidebar',
                style:
                    height: window.innerHeight + 'px'
                    width: '260px'
                    padding: '20px'
                m 'h2',
                    style:
                        marginTop: 0
                    'Inventory'
                [
                    for itemName, state of engine.getInventory()
                        if state == 'gotten'
                            m 'p',
                                itemName
                        else if state == 'used'
                            m 'p',
                                style:
                                    textDecoration: 'line-through'
                                itemName
                    m 'button',
                        onclick: ->
                            localStorage.clear()
                            alert('Save game deleted')
                            window.location.href = ''
                        'Restart game'
                ]

            m '.content',
                style:
                    width: (window.innerWidth - 360) + 'px'
                    padding: '20px'
                    paddingTop: 0
                m 'h1', engine.getCurrentRoomName()
                m 'p', m.trust(ctrl.vm.typer.getTextSoFar())

                if engine.getCurrentRoomName() == 'End'
                    [
                        m 'div',
                            style:
                                width: '100%'
                                textAlign: 'center'
                            m 'img',
                                src: '/shark-showering.png'
                        m 'br'
                        m 'br'
                        m 'h3', 'Do you even feedback?'
                        m 'div',
                            m 'iframe',
                                src: 'https://docs.google.com/forms/d/1drHKsfEzS_zA17YTd7OaWYis1Q8Jjf33fr7K6OcRBok/viewform?embedded=true'
                                width: '760'
                                height: '500'
                                frameborder: '0'
                                marginheight: '0'
                                marginwidth: '0'
                                style:
                                    padding: '2px'
                                    border: '1px solid grey'
                                    marginRight: '20px'
                                'Loading...'
                            m 'textarea',
                                style:
                                    height: '500px'
                                m.trust(engine.previousCommands.join('\n'))
                    ]
                else
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
