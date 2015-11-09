m = require('mithril')
WaleVsSharc = require('app/walevssharc')


String.prototype.capitalize = ->
    @[0].toUpperCase() + @[1..]


ITEM_NAMES = {
    egg: 'Egg'
    cuttlefish: 'Cuttlefish'
    flowers: 'Flowers'
    soda: 'Baking Soda'
    pancakes: 'Pancakes'
    syrup: 'Maple Syrup'
    margarine: 'Margarine'
    umbrella: 'Umbrella'
    badge: 'Badge Sticker'
    milk: 'Manatee Milk'
    'red herring': 'Red Herring'
    'cowboy hat': 'Cowboy Hat'
    'rainbow wig': 'Rainbow Wig'
    'motorcycle helmet': 'Motorcycle Helmet'
    'stovepipe hat': 'Stovepipe Hat'
    'leather jacket': 'Leather Jacket'
    'clown suit': 'Clown Suit'
    'oldtimey suit': 'Old-Timey Suit'
    'cow print vest': 'Cow Print Vest'
    'fake beard': 'Fake Beard'
    'gun belt': 'Gun Belt'
    'metal chain': 'Metal Chain'
    'rubber chicken': 'Rubber Chicken'
    'quadratic eye': 'Quadratic Eye'
}


class TextTyper
    constructor: ->
        @currentMessage = ''
        @i = 0

    typeLoop: =>
        @i++
        m.redraw()
        if not @isDone()
            setTimeout(@typeLoop, 6)

    setMessage: (message) ->
        @currentMessage = message
        @i = 0
        setTimeout(@typeLoop, 6)

    showAll: ->
        @i = @currentMessage.length - 1

    getTextSoFar: ->
        @currentMessage[..@i]

    isDone: ->
        @i >= @currentMessage.length - 1
    

module.exports = (engine) ->
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

        handleButton: (commandText) =>
            @vm.command(commandText)
            document.getElementById('command-input').focus()


    view: (ctrl) ->
        m '#container',
            style:
                position: 'absolute'
                width: '956px'
                height: '636px'
                overflow: 'hidden'
                border: '2px solid #25A5FF'
                top: 0
                left: '50%'
                marginLeft: (-956/2) + 'px'
            m 'a[href=#]',
                style:
                    position: 'absolute'
                    top: '2px'
                    right: '4px'
                    color: 'black'
                    fontSize: '10px'
                    zIndex: 100
                onclick: (e) ->
                    e.preventDefault()
                    if confirm('Are you sure you want to restart the game? This will clear all progress and items you have achieved so far.')
                        localStorage.clear()
                        window.location.href = ''
                'Restart game'
            m '.sidebar',
                style:
                    position: 'absolute'
                    right: 0
                    top: 0
                    height: '596px'
                    width: '220px'
                    padding: '20px'
                m 'h2',
                    style:
                        marginTop: 0
                    'Inventory'
                [
                    for item, state of engine.getInventory()
                        if state == 'gotten'
                            m 'p.inventory-item',
                                ITEM_NAMES[item]
                        else if state == 'used'
                            m 'p.inventory-item',
                                style:
                                    textDecoration: 'line-through'
                                ITEM_NAMES[item]
                ]
                #m 'textarea',
                #    style:
                #        height: '300px'
                #        width: '100%'
                #        marginTop: '10px'
                #    m.trust(engine.previousCommands.join('\n'))

                #m 'textarea',
                #    style:
                #        height: '300px'
                #        width: '100%'
                #        marginTop: '10px'
                #    m.trust(localStorage.getItem('progress'))

            m '.content',
                style:
                    position: 'absolute'
                    width: (656) + 'px'
                    height: '640px'
                    backgroundColor: 'white'
                    padding: '20px'
                    paddingTop: 0
                m 'h1', engine.getCurrentRoomName()
                m 'p', m.trust(ctrl.vm.typer.getTextSoFar())

                if engine.getCurrentRoomName() == 'End'
                    m 'div',
                        style:
                            width: '100%'
                            textAlign: 'center'
                        m 'img',
                            src: '/shark-showering.png'
                        m 'p', 'Yay good job you win.'
                else
                    m 'form',
                        style:
                            position: 'absolute'
                            bottom: 0
                            left: 0
                            height: '134px'
                            padding: '20px'
                        onsubmit: ctrl.onCommandSubmit
                        m 'input[type=text][id=command-input]',
                            style:
                                display: 'block'
                                width: '630px'
                            placeholder: 'Type commands here.'
                            onchange: m.withAttr('value', ctrl.vm.command)
                            value: ctrl.vm.command()
                            config: (element, isInitialized, context) ->
                                if not isInitialized
                                    element.focus()
                        m 'button[type=submit]',
                            style:
                                position: 'absolute'
                                right: '10px'
                                top: '20px'
                            'do'

                        m 'div',
                            m 'button.bottom-button[type=button]',
                                onclick: (e) -> ctrl.handleButton('get ')
                                'get'
                            m 'button.bottom-button[type=button]',
                                onclick: (e) -> ctrl.handleButton('talk ')
                                'talk'
                            m 'button.bottom-button[type=button]',
                                onclick: (e) -> ctrl.handleButton('use ')
                                'use'
                            m 'button.bottom-button[type=button]',
                                onclick: (e) -> ctrl.handleButton('look ')
                                'look'

                        m 'div',
                            style:
                                width: '214px'
                                height: '170px'
                                position: 'absolute'
                                right: '-250px'
                                bottom: '44px'
                            m 'button.compass-button[type=button]',
                                style:
                                    top: 0
                                    left: '55px'
                                onclick: (e) -> ctrl.handleButton('go north')
                                'go north'
                            m 'button.compass-button[type=button]',
                                style:
                                    top: '120px'
                                    left: '55px'
                                onclick: (e) -> ctrl.handleButton('go south')
                                'go south'
                            m 'button.compass-button[type=button]',
                                style:
                                    top: '60px'
                                    right: 0
                                onclick: (e) -> ctrl.handleButton('go east')
                                'go east'
                            m 'button.compass-button[type=button]',
                                style:
                                    top: '60px'
                                    left: 0
                                onclick: (e) -> ctrl.handleButton('go west')
                                'go west'
