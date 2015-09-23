assert = (expr, msg) ->
    if not expr
        throw new Error("Assertion Failure: #{msg}")

Engine = require('./engine')

setUp = ->
    engine = new Engine()

    engine.setAlreadyGottenMessage('You already got that.')

    engine.addRoom 'Room A', ->
        if @matches('look')
            @print('You looked.')
        else if @matches('take balls')
            @getItem('ball')
            @print('You take the ball.')

    engine.setStartRoom('Room A')
    engine.goToStart()
    return engine


tests =
    #test_can_get_item: (engine) ->
    #    engine.doCommand('take ball')
    #    assert(engine.hasItem('ball'), 'Couldn\'t take an item.')

    #test_cant_get_item_twice: (engine) ->
    #    assert(engine.hasItem('ball') == false, 'Already have ball.')
    #    engine.doCommand('take ball')
    #    assert(engine.hasItem('ball') == true, 'Didn\'t get ball.')
    #    assert(engine.getCurrentMessage() == 'You take the ball.', 'Couldn\'t take the ball the first time: ' + engine.getCurrentMessage())
    #    engine.doCommand('take ball')
    #    assert(engine.getCurrentMessage() == 'You already got that.', 'Wasn\'t stopped from taking the ball: ' + engine.getCurrentMessage())

    test_matches: (engine) ->
        engine.doCommand('look')
        assert(engine.matches('look'), 'Didn\'t match')

        engine.doCommand('take the ball')
        assert(engine.matches('take balls'), 'Didn\'t match')


for test_name, test of tests
    try
        test(setUp())
        console.log("#{test_name}: PASS")
    catch e
        console.log("#{test_name}: #{e.message}")
