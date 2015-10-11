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
                    for item, state of engine.getInventory()
                        if state == 'gotten'
                            m 'p',
                                ITEM_NAMES[item]
                        else if state == 'used'
                            m 'p',
                                style:
                                    textDecoration: 'line-through'
                                ITEM_NAMES[item]
                    m 'button',
                        onclick: ->
                            if confirm('Are you sure you want to restart the game? This will clear all progress and items you have achieved so far.')
                                localStorage.clear()
                                alert('Save game deleted')
                                window.location.href = ''
                        'Restart game'
                ]
                m 'button',
                    onclick: (e) ->
                        localStorage.setItem('progress', JSON.stringify({"inventory":{"badge":"gotten","pancakes":"gotten"},"currentRoomName":"Steak and Shake (Kitchen)","previousCommands":["__enter_room__","__enter_room__","__enter_room__","north","__enter_room__","talk wale","look","east","__enter_room__","talk billy","drive car","look","north","__enter_room__","north","__enter_room__","make costume","__enter_room__","cowboy hat","__enter_room__","oldtimey suit","__enter_room__","metal chain","__enter_room__","look metal chain","look old-timey suit","look old-timey suit","look cowboy hat","look old timey suit","look oldtimey suit","go north","south","east","west","__enter_room__","east","__enter_room__","talk manager","__enter_room__","no seal","__enter_room__","talk manager","south","east","west","__enter_room__","north","__enter_room__","make costume","__enter_room__","rainbow wig","__enter_room__","cow print vest","__enter_room__","fake beard","__enter_room__","look rainbow wig","look cow prin vest","look cow print vest","look fake beard","south","west","__enter_room__","north","__enter_room__","west","west","make costume","__enter_room__","west","go west","rainbow wigh","rainbow wig","__enter_room__","vest","cowprint vest","cow print vest","__enter_room__","fake beard","__enter_room__","talk manager","__enter_room__","look briefcase","seal","look","seal","__enter_room__","west","__enter_room__","west","__enter_room__","south","__enter_room__","west","__enter_room__","get cuddlefish","get cuttlefish","look cuttlefish","north","__enter_room__","north","__enter_room__","east","__enter_room__","get badge","west","__enter_room__","look","north","__enter_room__","get umbrella","north","look","west","__enter_room__","talk fish","look","east","__enter_room__","souht","south","__enter_room__","yes","souht","south","__enter_room__","west","__enter_room__","get flowers","give umbrella","get flowers","look","east","__enter_room__","south","__enter_room__","east","__enter_room__","east","__enter_room__","west","__enter_room__","west","__enter_room__","west","__enter_room__","west","__enter_room__","west","__enter_room__","west","get soda","look fountain","get spritz","look fountain","look maple soda","get maple soda","east","__enter_room__","north","__enter_room__","look oven","south","__enter_room__","north","__enter_room__","make pancakes","get baking soda","make pancakes","__enter_room__","__enter_room__","baking soda","flower","__enter_room__","egg","milk","margarine","__enter_room__","stir","__enter_room__","__enter_room__","syrup","__enter_room__"],"flags":{"talked_to_wale":true,"drove_billy_to_hospital":true,"given_umbrella":true,"have_all_items":true},"roomsEntered":{"Wale vs Sharc: The Comic: The Interactive Software Title For Your Computer Box":1,"How To Play":1,"Ocean":1,"Wale":4,"Billy Ocean":2,"Seal or No Seal":5,"Seal or No Seal (Dressing Room)":3,"Seal or No Seal (Dressing Room - Pick Headgear)":3,"Seal or No Seal (Dressing Room - Pick Clothes)":3,"Seal or No Seal (Dressing Room - Pick Accessory)":3,"Seal or No Seal (Backstage)":6,"Seal or No Seal (On Stage!)":2,"Wetter Ocean":1,"Cuttlefish":3,"Achtipus's Garden":3,"Water World":3,"Water World (Gift Shop)":1,"Water World (Manatee Exhibit)":2,"Water World (Mechanical Room Type Place)":1,"Achtipus's Garden (Inside)":1,"Steak and Shake":1,"Steak and Shake (Doorway)":3,"Steak and Shake (Soda Fountain)":1,"Steak and Shake (Kitchen)":3,"Steak and Shake (Spooky Kitchen)":1,"Steak and Shake (Spooky Kitchen with an empty bowl sitting there)":1,"Steak and Shake (Spooky Kitchen with bowl of powder sitting there)":1,"Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)":1,"Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)":1,"Steak and Shake (Spooky Kitchen with plate of dry pancakes sitting there)":1}}))
                        window.location.href = ''
                    'Load Game'
                m 'textarea',
                    style:
                        height: '300px'
                        width: '100%'
                        marginTop: '10px'
                    m.trust(engine.previousCommands.join('\n'))

                m 'textarea',
                    style:
                        height: '300px'
                        width: '100%'
                        marginTop: '10px'
                    m.trust(localStorage.getItem('progress'))

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
                        m 'input[type=text][id=command-input]',
                            style:
                                display: 'block'
                            onchange: m.withAttr('value', ctrl.vm.command)
                            value: ctrl.vm.command()
                            config: (element, isInitialized, context) ->
                                if not isInitialized
                                    element.focus()
                        m 'button[type=submit]', 'Do'
                        m 'button[type=button]',
                            onclick: (e) -> ctrl.handleButton('go north')
                            'go north'
                        m 'button[type=button]',
                            onclick: (e) -> ctrl.handleButton('go south')
                            'go south'
                        m 'button[type=button]',
                            onclick: (e) -> ctrl.handleButton('go east')
                            'go east'
                        m 'button[type=button]',
                            onclick: (e) -> ctrl.handleButton('go west')
                            'go west'
                        m 'button[type=button]',
                            onclick: (e) -> ctrl.handleButton('get')
                            'get'
                        m 'button[type=button]',
                            onclick: (e) -> ctrl.handleButton('talk')
                            'talk'
                        m 'button[type=button]',
                            onclick: (e) -> ctrl.handleButton('use')
                            'use'
                        m 'button[type=button]',
                            onclick: (e) -> ctrl.handleButton('look')
                            'look'
        ]
