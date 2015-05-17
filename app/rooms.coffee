engine = require('app/engine')


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


engine.addRoom 'North Candy Room', ->
    if @matches('look')
        @print('This is the north candy room.')
    else if @matches('go south')
        @goToRoom('Candy Room')

engine.addRoom 'South Candy Room', ->
    if @matches('look')
        @print('This is the south candy room.')
    else if @matches('go north')
        @goToRoom('Candy Room')

engine.addRoom 'West Candy Room', ->
    if @matches('look')
        @print('This is the west candy room.')
    else if @matches('go east')
        @goToRoom('Candy Room')

engine.addRoom 'East Candy Room', ->
    if @matches('look')
        @print('This is the east candy room.')
    else if @matches('go west')
        @goToRoom('Candy Room')

engine.addRoom 'Candy Room', ->
    if @matches('look')
        @print("You swiftly and deftly enter into the mystical candy room of destiny.  You see a guy.  The candy room has piles and piles of candy all around.  You see on the floor a candy bar conspicuously not attached to any walls.  It looks like it might be able to be PICK UP'd.")

    else if @matches('look candy bar') and not @hasItem('candy bar')
        @print("That candy bar is sure looking tasty and on the floor. Why don't you pick it up man???")

    else if @matches('talk guy') and not @hasItem('candy bar')
        @print('Man am I hungry for some candy bar.  I wish there was one right under my feet!')

    else if @matches('go north')
        @goToRoom('North Candy Room')
    else if @matches('go south')
        @goToRoom('South Candy Room')
    else if @matches('go east')
        @goToRoom('East Candy Room')
    else if @matches('go west')
        @goToRoom('West Candy Room')

    else if @matches('eat candy bar') and @hasItem('candy bar')
        @print("That is a quest item man, you can't eat that!")

    else if @matches('take candy bar')
        @inventoryAdd('candy bar')
        @print('You place the tasty bar into your sweaty sweat sweats.')

    else if @matches('give guy candy bar') and @hasItem('candy bar')
        @inventoryUse('candy bar')
        @print('The guy snatches the candy bar and greedily scarfs it down in one byte.  "Thanks man I was really hungry!"')

