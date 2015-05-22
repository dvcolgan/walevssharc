"""
Conditions:
    @matches(pattern)
    @hasItem(item name)
    @percentChance(chance out of 100)
    @flagIs(flag name, value)

Results:
    @print(text)
    @goToRoom(room name)
    @setFlag(flag name, value)
"""

module.exports = (engine) ->
    engine.addRoom 'Ocean', ->
        if @matches('look')
            @print('Welcome to the ocean, it is a big blue wet thing and also your home.')
        else if @matches('go west')
            @goToRoom('Cuttlefish')
        else if @matches('go north')
            @goToRoom('Wetter Ocean')
        else if @matches('go east')
            @goToRoom('Billy Ocean')

    engine.addRoom 'Cuttlefish', ->
        if @matches('look')
            if not @hasItem('cuttlefish')
                @print('Look, there be some cuttlefish, they do not look too cuddly though.')
            else
                @print('There used to be cuttlefish here but you scared them away with your aggressive affections. Keep that stuff inside man!')
        else if @matches('go east')
            @goToRoom('Ocean')
        else if @matches('cuddle cuttlefish')
            if not @hasItem('cuttlefish')
                @getItem('cuttlefish')
                @print('You are feeling affectionate today and you just got dumped so why not? You jump some of the cuttlefish and start snuggling and cuddling. The cuttlefish are not amused though and say they are tired of fish making that mistake. They all swim away except for one that has attached its suckers to your mid region. You don\'t seem to mind.')
            else
                @print('They are cuddled out.')

    engine.addRoom 'Billy Ocean', ->
        if @matches('look')
            #@playVideo('9f16Fw_K45s')
            @print('<TODO> Play the video here. Mr. Ocean is gesturing to his car, do you get in?')
        else if @matches('go west')
            @goToRoom('Ocean')
        else if @matches('enter car')
            @print('Didn\'t your mother teach you anything?')
            @getItem('unknown item yet to be determined')
        else if @matches('walk away')
            @print('Smart move! You decide not to enter the car of a stranger, that was wise although you are an enormous shark so I don’t know.')
        else if @matches('call cops')
            @print('The police come and arrest Billy Ocean on charge of being a really lame artist and completely irrelevant to this game. You Win! High Score.')

    engine.addRoom 'Wetter Ocean', ->
        if @matches('look')
            @print('This ocean feels wetter than before.')
        else if @matches('go south')
            @goToRoom('Ocean')
