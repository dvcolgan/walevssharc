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
            @print('You find yourself in the ocean. You are a shark by the name of Sharc and your $23 shampoo is missing. You suspect foul play. Welcome to the ocean, it is a big blue wet thing and also your home. Obvious exits are North to your friend Wale.')
        else if @matches('go north')
            @goToRoom('Wale')


    engine.addRoom 'Wale', ->
        if @matches('look')
            @print('Hey, it is your friend, Wale. He is doing that thing where he has his eyes closed and acts like he did not notice your arrival. He is kind of a prick, but also your friend. What can you do? Obvious exits are Ocean to the south, a school of Cuttlefish to the west, more Ocean to the north, and Billy Ocean to the east.')

        else if @matches('talk wale')
            if @flagIs('talked_to_wale', true)
                @print('(Get ready to do some reading) Wale is trying to meditate or something pretentious that you don\'t care about. You have something important! "Wale" you shout, "I need your help! The condition of my magnificent scalp is at stake." Wale sighs a heavy, labored sigh. "Sharc, you have disturbed my journey to my innermost being. Before I can help you, reparations must be made. Pancakes: whole wheat, with all natural maple syrup. Now leave me as I peel back the layers of the self and ponder the lesson of the cherry blossom.')
                @setFlag('talked_to_wale', true)
            else
                @print('"I can not lift a fin for you until you have brought a healthy serving of whole wheat pancakes with all natural maple syrup like I said before."')

        else if @matches('go south')
            @goToRoom('Ocean')
        else if @matches('go north')
            @goToRoom('Wetter Ocean')
        else if @matches('go west')
            @goToRoom('Cuttlefish')
        else if @matches('go east')
            @goToRoom('Billy Ocean')


    engine.addRoom 'Wetter Ocean', ->
        if @matches('look')
            @print('This is just some ocean you found. It does feel a little bit wetter than the rest of the ocean though. Also, did it just get warmer? Obvious exits are a garden to the west, Wale in the south, and a gameshow east.')

        else if @matches('go south')
            @goToRoom('Wale')
        else if @matches('go west')
            @goToRoom('Achtipus\'s Garden')
        else if @matches('go east')
            @goToRoom('Seal or No Seal')


    engine.addRoom 'Cuttlefish', ->
        if @matches('look')
            if not @hasItem('cuttlefish')
                @print('Look, there be some cuttlefish, though they do not look too cuddly. Steak and Shake is to the west, Achtipus\'s garden to the north, and Wale to the east.')
            else
                @print('There used to be cuttlefish here but you scared them away with your aggressive affections. Keep that stuff inside man!')
        else if @matches('cuddle cuttlefish')
            if not @hasItem('cuttlefish')
                @print('You are feeling affectionate today and you just got dumped so why not? You jump some of the cuttlefish and start snuggling and cuddling. The cuttlefish are not amused though, and say they are tired of fish making that mistake. They all swim away except for one that has attached its suckers to your mid region. You don\'t seem to mind.')
                @getItem('cuttlefish')
            else
                @print('They are cuddled out.')

        else if @matches('go east')
            @goToRoom('Wale')
        else if @matches('go north')
            @goToRoom('Achtipus\'s Garden')
        else if @matches('go west')
            @goToRoom('Steak and Shake')


    engine.addRoom 'Billy Ocean', ->
        if @matches('look')
            window.open('https://www.youtube.com/watch?v=9f16Fw_K45s', '_blank')
            @print('Suddenly, appearing before your eyes is singer-songwriter and former Caribbean king: Billy Ocean. Also Billy Ocean\'s car. Obvious exits are west to Wale and north to some kind of game show.')
        else if @matches('talk')
            @print('He wants you to get into his car and drive him to the hospital. He just drove through the car wash with the top down after dropping some acid.')
        else if @matches('hospital')
            @print('Sure, why not? You get in the driver\'s seat and find your way to the nearest medical treatment center. As thanks, Mr. Ocean pulls an egg out from his glove box. You accept and swim away as fast as possible. Good, I ran out of jokes for that fast.')
        else if @matches('call cops')
            @print('The police come and arrest Billy Ocean on charge of being completely irrelevant to this game. You Win! High Score.')

        else if @matches('go west')
            @goToRoom('Wale')
        else if @matches('go north')
            @goToRoom('Seal or No Seal')


    engine.addRoom 'Achtipus\'s Garden', ->
        if @matches('look achtipus')
            @print('It\'s Achtipus. He is pulling out the seaweeds from his sea cucumber bed.')
        else if @matches('look')
            @print('Achtipus is working among his flowers and shrubs. He sees you and opens the gate for you. Obvious exits are north to Water World, east to some Ocean and south to a school of Cuttlefish.')
        else if @matches('talk')
            @print('"This is quite the um...ocean hideaway you have here," you say. "Yes," he says, "I can see you have come a long way to get here, but I am glad you have found refuge on my grounds. If you see anything you like in my plot we could make a deal perhaps."')
        else if @matches('look garden')
            @print('You see watermelon, water chestnuts, assorted flowers, sea cucumbers and strawberries.')

        else if @matches('take watermelon')
            @print('"I will give you the watermelon in exchange for an ice cream sundae."')
        else if @matches('take nuts') or @matches('take nut') @matches('take chestnuts') or @matches('take chestnut')
            @print('"I will give you some water chestnuts if you can find me a pure bred German Shepard."')
        else if @matches('take cucumber') or @matches('take cucumbers')
            @print('"You can have the sea cucumbers in exchange for a full pardon for these major felony charges that are still pending."')
        else if @matches('take strawberries')
            @print('"Oh, actually those strawberry fields aren\'t even real."')

        else if @matches('take flowers') or @matches('take flower')
            if not @flagIs('given_umbrella', true)
                @print('"I can see you like the flowers. I will let you have them if you can find something to keep it from getting so hot here. I would be able to do twice as much work if it were a bit cooler.')
            else
                @print('"You have great taste. These flowers are really versatile and will be good just about anywhere."')
                @getItem('flowers')

        else if @matches('give umbrella')
            @print('"This will be perfect for blocking out that sun’s harsh rays. Thanks!"')
            @setFlag('given_umbrella', true)

        else if @matches('go north')
            @goToRoom('Water World')
        else if @matches('go east')
            @goToRoom('Wetter Ocean')
        else if @matches('go south')
            @goToRoom('Cuttlefish')


    engine.addRoom 'Steak and Shake', ->
        if @matches('look')
            @print('You swim up to the ruins of your old work place. This place has seen better days. Your mind is flooded with memories of floating in front of the old grill and coming up with new recipes to try when your manager had his back turned. Then someone said "Ever tried an M-80 burger? I have enough for everyone." The words echo in your mind like a phantom whisper of ages past. It\'s the ruins of the old Steak and Shake you used to work at until your friend blew it up. The tattered remnants of a red and white awning flutters in the wind as if to surrender to an enemy. What is left of a door hangs on a single hinge to the west. Cuttlefish stomping grounds lie east.')
        else if @matches('go west') or @matches('open door') or @matches('go inside') or @matches('go in')
            @goToRoom('Steak and Shake (Doorway)')

        else if @matches('go east')
            @goToRoom('Cuttlefish')
            

    engine.addRoom 'Steak and Shake (Doorway)', ->
        if @matches('look')
            @print('As you approach, the door falls clean off as if to warn you against entry. Never being one for omens, you ignore it. Inside you discover things much as you remember them. That is, if they had been mauled by a bear with blenders for hands who proceeded to set off a series of plastic explosives. To the south there are some tables and chairs, north lies the kitchen, and west a soda fountain. The outdoors is east.')

        else if @matches('go south')
            #@goToRoom('Steak and Shake (Dining Area)')
            @print('Your inner compass barks loudly at you. "What could possibly be interesting in the dining room?" You decide to stay put. (Actually the writer just didn\'t give me anything to put here.)')
        else if @matches('go north')
            @goToRoom('Steak and Shake (Kitchen)')
        else if @matches('go west')
            @goToRoom('Steak and Shake (Soda Fountain)')
        else if @matches('go east')
            @goToRoom('Steak and Shake')

    engine.addRoom 'Steak and Shake (Kitchen)', ->
        if @matches('look')
            @print('Welcome to the kitchen. Since the walls have all been blown away or dissolved, the only thing that separates it from the rest of the place is the oven and range.')
        else if @matches('look oven') or @matches('open oven')
            @print('Check it out, it\'s your favorite pop, a Cherry Orange Snozzberry Lime Passionfruit Vanilla Croak in the oven. Who ever thought of baking a can of soda?')

        else if @matches('go south')
            @goToRoom('Steak and Shake (Doorway)')


    engine.setStartRoom('Ocean')
