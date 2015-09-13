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
    helpText = """
Advance through the game by typing commands like <strong>look, get, and go.</strong><br>
Commands catalogue and/or pre set command prefix buttons: <strong>Go, talk, get, look, use...</strong><br>
Look in an area to gain more information or look at objects: <strong>(look fish)</strong><br>
Move by typing go commands: <strong>(go east)</strong><br>
Engage in philosophical debate: <strong>(talk sorceress)</strong><br>
Use items in inventory: <strong>(use lightsaber)</strong><br>
There are other commands too and some you can just click on a button to use. Experiment and try things in this beautiful new world before you.<br>
Type <strong>"help"</strong> to see this menu again<br>
"""

    engine.setUniversalCommands ->
        if @matches('die')
            @print('What are you doing? You are dead now.')
        else if @matches('win')
            @print('You did it. You win. Buy yourself a pizza because you are so clever.')
        else if @matches('inv') or @matches('inventory')
            if Object.keys(@getInventory()).length > 0
                @print('It tells you what is inventory right over there on the right side of the screen. Is typing this command really necessary?')
            else
                @print('Your inventory is empty you big dumb butt. Sorry, that was rude I meant to say you butt.')
        else if @matches('help')
            @print(helpText)

        else if @matches('look cuttlefish') and @hasItem('cuttlefish')
            @print('Aside from being really funny looking, highly intelligent and highly ugly, cuttlefish can also release an ink like substance to escape predators.')

        else if @matches('look egg') and @hasItem('egg')
            @print('This looks to be an ordinary egg. But remember, it was pulled out of Billy Ocean\'s glove box, so maybe not?')

        else if @matches('look flowers') and @hasItem('flowers')
            @print('These are some versatile looking flowers. So much so, you can sense a pun like aura surrounding them.')

        else if @matches('look umbrella') and @hasItem('umbrella')
            @print('This umbrella could provide a lot of shade. I don\'t see how it can fit in your pockets.')

        else if @matches('look soda') and @hasItem('soda')
            @print('It\'s a can of soda you found in the oven at Steak and Shake.')

        else if @matches('look syrup') and @hasItem('syrup')
            @print('A bag of maple flavored fountain syrup. It could have other uses too.')

        else if @matches('look herring') and @hasItem('herring')
            @print('It is a can of pickled herring you won on a gameshow. Way to go.')

        else if @matches('look red herring') and @hasItem('red herring')
            @print('It is a red herring.')

        else if @matches('look margarine') and @hasItem('margarine')
            @print('No Ifs, Ands or Butter vaguely margarine spread type product. Modeled by Lou Ferrigno.')

        else if @matches('look badge') and @hasItem('badge')
            @print('It\'s the junior marine sheriff badge sticker you got at the Water World gift shop. In a poorly lit room, one might mistake this for an authentic junior marine sheriff badge.')

        else if @matches('look pancakes') and @hasItem('pancakes')
            @print('Mystical pancakes you made with an enchanted recipe and totally not the correct ingredients, remember? That was UH-may-zing! Take them to Wale and hurry.')

        else if @matches('look milk') and @hasItem('milk')
            @print('Whole milk, apparently from a real sea cow. Is it still okay to call them that?')

        else if @matches('look quadratic eye') and @hasItem('quadratic eye')
            @print('???')

        else if @matches('look')
            @print('I am not authorized to tell you about that yet. Stop trying to cheat man!')

        else if @matches('take')
            @print('I am not authorized to give that to you.')

        else if @matches('talk')
            @print('Who are you talking to?')

        else
            # Pick a random default response
            defaultResponses = [
                'What are you even trying to do?  Just stop.'
                'Good one man.'
                'Whoa there Eager McBeaver!'
                'Don\'t do that.'
                'Gross, no way.'
            ]
            @print(defaultResponses[Math.floor(Math.random()*defaultResponses.length)])

        
    engine.setAfterCommand ->
        if (not @flagIs('have_all_items', true) and
                @hasItem('egg') and
                @hasItem('flowers') and
                @hasItem('soda') and
                @hasItem('syrup') and
                @hasItem('milk') and
                @hasItem('margarine'))
            @print('"Well, I think I have all the ingredients," you say to yourself. "I just need one of those places where you put them together so it turns into something you can eat. You know, one of those...food preparing rooms."')
            @setFlag('have_all_items', true)


    engine.addRoom 'Wale vs Sharc: The Comic: The Interactive Software Title For Your Computer Box', ->
        @print('Thank you for buying this game!  Type things in the box to make things happen!')
        @wait =>
            @goToRoom('How To Play')

    engine.addRoom 'How To Play', ->
        @print(helpText)
        @wait =>
            @goToRoom('Ocean')

    engine.addRoom 'Ocean', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('You find yourself in the ocean. You are a shark by the name of Sharc and your $23 shampoo is missing. You suspect foul play. Welcome to the ocean, it is a big blue wet thing and also your home. Obvious exits are North to your friend Wale.')
        else if @matches('north')
            @goToRoom('Wale')
        else
            @tryUniversalCommands()


    engine.addRoom 'Wale', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Hey, it is your friend, Wale. He is doing that thing where he has his eyes closed and acts like he did not notice your arrival. He is kind of a prick, but also your friend. What can you do? Obvious exits are Ocean to the south, a school of Cuttlefish to the west, more Ocean to the north, and Billy Ocean to the east.')

        else if @matches('give pancakes')
            if @hasItem('pancakes')
                @print('"Hey Wale," you call out as intrusively as possible, "I got your--" Before you could finish your sentence, your blubbery friend has snatched the plate away and, in a most undignified manner, begins mowing through the fried discs you so artfully prepared. "Soul searching takes a lot of energy," he explains between bites. "I haven\'t eaten anything all day." Once finished, Wale straightens himself out, looking a mite embarrassed for the savage display he just put on. "What was it you needed?" "Oh Wale, it\'s terrible. I think my $23 shampoo was stolen and the ghost of my not really dead friend says the fate of the world hangs in the balance." "I see," says Wale, his voice and manner remaining unchanged despite the threat of the world unbalancing. "Sharc, I fear the worst. You must summon the ethereal door." "No, Wale," you say, "you made me swear a thousand vows never to bring that cursed relic back among us." "I know what I said, but I also knew there would come a time when we would have no other choice."  You should probably summon the door.')
                @removeItem('pancakes')
                @setFlag('given_pancakes', true)

        else if @matches('summon door') and @flagIs('given_pancakes', true)
            @print('You, finally convinced of your urgency and utter desperation, perform some intricate rites and incantations that would be really cool if you could see them, but I guess you will just have to use your imaginations. Text only fools!  The ethereal door stands open before you.')
            @setFlag('summoned_door', true)

        else if @matches('enter door') and @flagIs('summoned_door', true)
            @goToRoom('The Ethereal Realm')

        else if @matches('talk wale')
            if not @flagIs('talked_to_wale', true)
                @print('Wale is trying to meditate or something pretentious that you don\'t care about. You have something important! "Wale" you shout, "I need your help! The condition of my magnificent scalp is at stake."')
                @wait =>
                    @print('Wale sighs a heavy, labored sigh. "Sharc, you have disturbed my journey to my innermost being. Before I can help you, reparations must be made. Pancakes: whole wheat, with all natural maple syrup. Now leave me as I peel back the layers of the self and ponder the lesson of the cherry blossom.')
                    @setFlag('talked_to_wale', true)
            else
                @print('"I can not lift a fin for you until you have brought a healthy serving of whole wheat pancakes with all natural maple syrup like I said before."')

        else if @matches('south')
            @goToRoom('Ocean')
        else if @matches('north')
            @goToRoom('Wetter Ocean')
        else if @matches('west')
            @goToRoom('Cuttlefish')
        else if @matches('east')
            @goToRoom('Billy Ocean')
        else
            @tryUniversalCommands()


    engine.addRoom 'Wetter Ocean', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('This is just some ocean you found. It does feel a little bit wetter than the rest of the ocean though. Also, did it just get warmer? Obvious exits are a garden to the west, Wale in the south, and a gameshow east.')

        else if @matches('south')
            @goToRoom('Wale')
        else if @matches('west')
            @goToRoom('Achtipus\'s Garden')
        else if @matches('east')
            @goToRoom('Seal or No Seal')
        else
            @tryUniversalCommands()


    engine.addRoom 'Cuttlefish', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            if not @hasItem('cuttlefish')
                @print('Look, there be some cuttlefish, though they do not look too cuddly. Steak and Shake is to the west, Achtipus\'s garden to the north, and Wale to the east.')
            else
                @print('There used to be cuttlefish here but you scared them away with your aggressive affections. Keep that stuff inside man! Steak and Shake is to the west, Achtipus\'s garden to the north, and Wale to the east.')
        else if @matches('cuddle cuttlefish')
            if not @hasItem('cuttlefish')
                @print('You are feeling affectionate today and you just got dumped so why not? You jump some of the cuttlefish and start snuggling and cuddling. The cuttlefish are not amused though, and say they are tired of fish making that mistake. They all swim away except for one that has attached its suckers to your mid region. You don\'t seem to mind.')
                @getItem('cuttlefish')
            else
                @print('They are cuddled out.')

        else if @matches('look cuttlefish')
            @print('Oh, cuttlefish, those are freaky.')

        else if @matches('east')
            @goToRoom('Wale')
        else if @matches('north')
            @goToRoom('Achtipus\'s Garden')
        else if @matches('west')
            @goToRoom('Steak and Shake')
        else
            @tryUniversalCommands()


    engine.addRoom 'Billy Ocean', ->
        if @exactlyMatches('enter') and not @flagIs('watched_billy_video', true)
            window.open('https://www.youtube.com/watch?v=zNgcYGgtf8M', '_blank')

        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Suddenly, appearing before your eyes is singer-songwriter and former Caribbean king: Billy Ocean. Also Billy Ocean\'s car. Obvious exits are west to Wale and north to some kind of game show.')

        else if @matches('talk')
            @print('He wants you to get into his car and drive him to the hospital. He just drove through the car wash with the top down after dropping some acid.')
        else if @matches('hospital')
            @print('Sure, why not? You get in the driver\'s seat and find your way to the nearest medical treatment center. As thanks, Mr. Ocean pulls an egg out from his glove box. You accept and swim away as fast as possible. Good, I ran out of jokes for that fast.')
            @getItem('egg')
        else if @matches('call cops')
            @print('The police come and arrest Billy Ocean on charge of being completely irrelevant to this game. You Win! High Score.')

        else if @matches('west')
            @goToRoom('Wale')
        else if @matches('north')
            @goToRoom('Seal or No Seal')
        else
            @tryUniversalCommands()


    engine.addRoom 'Achtipus\'s Garden', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Achtipus is working among his flowers and shrubs. He sees you and opens the gate for you. Obvious exits are north to Water World, east to some Ocean and south to a school of Cuttlefish.')
        else if @matches('look achtipus')
            @print('It\'s Achtipus. He is pulling out the seaweeds from his sea cucumber bed.')
        else if @matches('look garden')
            @print('You see watermelon, water chestnuts, assorted flowers, sea cucumbers and strawberries.')
        else if @matches('talk')
            @print('"This is quite the um...ocean hideaway you have here," you say. "Yes," he says, "I can see you have come a long way to get here, but I am glad you have found refuge on my grounds. If you see anything you like in my plot we could make a deal perhaps."')

        else if @matches('take watermelon')
            @print('"I will give you the watermelon in exchange for an ice cream sundae."')
        else if @matches('take nuts') or @matches('take nut') or @matches('take chestnuts') or @matches('take chestnut')
            @print('"I will give you some water chestnuts if you can find me a pure bred German Shepard."')
        else if @matches('take cucumber') or @matches('take cucumbers')
            @print('"You can have the sea cucumbers in exchange for a full pardon for these major felony charges that are still pending."')
        else if @matches('take strawberries')
            @print('"Oh, actually those strawberry fields aren\'t even real."')

        else if @matches('take flowers') or @matches('take flower')
            if not @flagIs('given_umbrella', true)
                @print('"I can see you like the flowers. I will let you have them if you can find something to keep it from getting so hot here. I would be able to do twice as much work if it were a bit cooler."')
            else
                @print('"You have great taste. These flowers are really versatile and will be good just about anywhere."')
                @getItem('flowers')

        else if @matches('give umbrella')
            @print('"This will be perfect for blocking out that sun’s harsh rays. Thanks!"')
            @removeItem('umbrella')
            @setFlag('given_umbrella', true)

        else if @matches('north')
            @goToRoom('Water World')
        else if @matches('east')
            @goToRoom('Wetter Ocean')
        else if @matches('south')
            @goToRoom('Cuttlefish')
        else
            @tryUniversalCommands()


    engine.addRoom 'Steak and Shake', ->
        if @exactlyMatches('enter')
            @print('You swim up to the ruins of your old work place. This place has seen better days. Your mind is flooded with memories of floating in front of the old grill and coming up with new recipes to try when your manager had his back turned. Then someone said "Ever tried an M-80 burger? I have enough for everyone." The words echo in your mind like a phantom whisper of ages past.')
        else if @exactlyMatches('look')
            @print("It's the ruins of the old Steak and Shake you used to work at until your friend blew it up. The tattered remnants of a red and white awning flutters in the wind as if to surrender to an enemy. What is left of a door hangs on a single hinge to the west. Cuttlefish stomping grounds lie east.")

        else if @matches('west') or @matches('open door') or @matches('enter') or @matches('in')
            @goToRoom('Steak and Shake (Doorway)')

        else if @matches('east')
            @goToRoom('Cuttlefish')
        else
            @tryUniversalCommands()
            

    engine.addRoom 'Steak and Shake (Doorway)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('As you approach, the door falls clean off as if to warn you against entry. Never being one for omens, you ignore it. Inside you discover things much as you remember them. That is, if they had been mauled by a bear with blenders for hands who proceeded to set off a series of plastic explosives. To the south there are some tables and chairs, north lies the kitchen, and west a soda fountain. The outdoors is east.')

        else if @matches('south')
            @goToRoom('Steak and Shake (Dining Area)')
        else if @matches('north')
            @goToRoom('Steak and Shake (Kitchen)')
        else if @matches('west')
            @goToRoom('Steak and Shake (Soda Fountain)')
        else if @matches('east')
            @goToRoom('Steak and Shake')
        else
            @tryUniversalCommands()

    engine.addRoom 'Steak and Shake (Dining Area)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('A dilapidated dining area lies before you. It is completely unremarkable. There is nowhere to go besides north to the way you came.')
        else if @matches('north')
            @goToRoom('Steak and Shake (Doorway)')
        else
            @tryUniversalCommands()

    engine.addRoom 'Steak and Shake (Kitchen)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Welcome to the kitchen. Since the walls have all been blown away or dissolved, the only thing that separates it from the rest of the place is the oven and range. South leads back to the main entry area.')
        else if @matches('look oven') or @matches('open oven')
            if not @hasItem('soda')
                @print('Check it out, it\'s your favorite pop, a Cherry Orange Snozzberry Lime Passionfruit Vanilla Croak in the oven. Who ever thought of baking a can of soda? South leads back to the main entry area.')
            else
                @print('The oven is empty.')

        else if @matches('close oven')
            @print('How responsible of you.')

        else if @matches('take soda')
            @print('You got soda.')
            @getItem('soda')

        else if @flagIs('have_all_items', true)
            if @matches('make pancakes')
                @goToRoom('Steak and Shake (Spooky Kitchen)')

        else if @matches('south')
            @goToRoom('Steak and Shake (Doorway)')
        else
            @tryUniversalCommands()

    engine.addRoom 'Steak and Shake (Spooky Kitchen)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('"Where do I start?" you wonder out loud. If only there were written series of instructions guiding you through. Where would you find something like that?')
            @wait =>
                @print('You\'re pondering this when a draft comes over you. The lights flicker on and off. You sense a mysterious presence. The ghost of your old friend Creggles appears before you. Apparently he is haunting the Steak and Shake now and you\'re all like "Creggles, didn\'t we just hang out the other day? How are you a ghost already?"')
                @wait =>
                    @print('<span class="creepy">"Never you mind that now"</span> he says in his creepy nerd voice. <span class="creepy">"Sharc, if you hope to save the world from certain doom, you must succeed in making these pancakes. Use this ancient recipe handed down from the ancients to aid you."</span> An old, battered piece of paper floats down landing before you "Sweet Meemaws Sweety Sweet Flapjacks" it reads. <span class="creepy">"Now my work is done and I can ascend to my stepmom\'s house for grilled cheese sandwiches and chocolate milk."</span>')
                    @wait =>
                        @print('You read the recipe. It is all in riddles. You hope you are up to the task.')
                        @wait =>
                            @goToRoom('Steak and Shake (Spooky Kitchen with an empty bowl sitting there)')
        else
            @tryUniversalCommands()

    engine.addRoom 'Steak and Shake (Spooky Kitchen with an empty bowl sitting there)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('In an urn take but not churn items two not like goo.')
        else if @matches('soda flower')
            @removeItem('flowers')
            @removeItem('soda')
            @goToRoom('Steak and Shake (Spooky Kitchen with bowl of powder sitting there)')
        else
            @tryUniversalCommands()

    engine.addRoom 'Steak and Shake (Spooky Kitchen with bowl of powder sitting there)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Your potion is dry. This willst not fly. What\'s next must be dumped, poured and cracked for a proper flapjack.')
        else if @matches('milk egg butter')
            @removeItem('egg')
            @removeItem('milk')
            @removeItem('margarine')
            @goToRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)')
        else
            @tryUniversalCommands()

    engine.addRoom 'Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Cutting and scooping shall have their day, but a for a fine fluffy batter there be but one way.')
        else if @matches('stir')
            @goToRoom('Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)')
        else if @matches('shake')
            @print('Dude, who do you think you are, James Bond?  This batter needs to be stirred, not shaken.')
        else
            @tryUniversalCommands()

    engine.addRoom 'Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Set the griddle or stove to medium heat. After it is warmed, drop batter a quarter cup at a time and turning once until bubbles appear. "Well that seems pretty clear. I think I can do that on my own."')
            @wait =>
                @goToRoom('Steak and Shake (Spooky Kitchen with plate of dry pancakes sitting there)')
        else
            @tryUniversalCommands()

    engine.addRoom 'Steak and Shake (Spooky Kitchen with plate of dry pancakes sitting there)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Ten minutes later the pancakes are finished, but something is missing.')
        else if @matches('syrup')
            @removeItem('syrup')
            @print('You got pancakes!  Hot dang.')
            @getItem('pancakes')
            @wait =>
                @goToRoom('Steak and Shake (Kitchen)')
        else
            @tryUniversalCommands()


    engine.addRoom 'Steak and Shake (Soda Fountain)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('You see that the soda fountain has somehow remained largely undamaged. You think back to the days when you would sneak out bags of plain syrup to drink and the freakish waking dreams it would induce in you. You wonder if there is any still in there. The East door goes back to the main area.')
        else if @matches('look fountain') or @matches('open fountain') or @matches('look soda') or @matches('open soda')
            @print('Avast, a hidden treasure trove of sugary wonder that has lain dormant all these years! You tremble at the beauty of the sight before you. So many bags and yet your magic hammerspace satchel will only allow for one. There\'s Spritz, Professor Ginger, Cactus Lager, and Ms. Shim Sham\'s Maple Soda.')

        else if @matches('take maple')
            @print('You find it shocking that you are the first raider of this soda tomb. But then again, you have always said people don\'t know the value of a bag of liquid sugar.')
            @getItem('syrup')

        else if @matches('east')
            @goToRoom('Steak and Shake (Doorway)')
        else
            @tryUniversalCommands()


    engine.addRoom 'Seal or No Seal', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('You just walked onto the set of the wildly popular game show, "Seal or No Seal!" Where flamboyant contestants flail around and shout while trying to arrive at the answer to that age old question...SEAL OR NO SEAL? To the east is backstage, north will take you to the dressing room, west or south will take you back wherever you came from.')

        else if @matches('north')
            @goToRoom('Seal or No Seal (Dressing Room)')
        else if @matches('east')
            @goToRoom('Seal or No Seal (Backstage)')
        else if @matches('west')
            @goToRoom('Wetter Ocean')
        else if @matches('south')
            @goToRoom('Billy Ocean')
        else
            @tryUniversalCommands()


    engine.addRoom 'Seal or No Seal (Dressing Room)', ->
        step1 = 'Let\'s start with headgear. You see a cowboy hat, a rainbow wig, a motorcycle helmet, and a stovepipe hat.'
        step2 = 'Now select a set of clothes. You see a leather jacket, a clown suit, an oldtimey suit with one of those Colonel Sanders ties, and a cow print vest.'
        step3 = 'Accessorize! Pick from a fake beard, a gun belt, a metal chain, and a rubber chicken.'
        done = 'You look absolutely horrible! Or amazing, depending on your perspective. But the true judge will be the game show manager.'

        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('This place is great! It would be easy to cobble together a costume to get on that show. Lets see what we can find. Obvious exits are south to the show entrance.')
        
        else if @matches('south')
            @goToRoom('Seal or No Seal')

        else if @matches('costume')
            @print(step1)

        else if @matches('cowboy hat')
            @getItem('cowboy hat')
            @print(step2)
        else if @matches('rainbow wig')
            @getItem('rainbow wig')
            @print(step2)
        else if @matches('motorcycle helmet')
            @getItem('motorcycle helmet')
            @print(step2)
        else if @matches('stovepipe hat')
            @getItem('stovepipe hat')
            @print(step2)

        else if @matches('leather jacket')
            @getItem('leather jacket')
            @print(step3)
        else if @matches('clown suit')
            @getItem('clown suit')
            @print(step3)
        else if @matches('oldtimey suit')
            @getItem('oldtimey suit')
            @print(step3)
        else if @matches('cow vest') or @matches('print vest')
            @getItem('cow print vest')
            @print(step3)

        else if @matches('fake beard')
            @getItem('fake beard')
            @print(done)
        else if @matches('gun belt')
            @getItem('gun belt')
            @print(done)
        else if @matches('metal chain')
            @getItem('metal chain')
            @print(done)
        else if @matches('rubber chicken')
            @getItem('rubber chicken')
            @print(done)
        else
            @tryUniversalCommands()


    costumeMatches = (engine) ->
        group1 = 0
        group2 = 0
        group3 = 0
        group4 = 0

        if engine.hasItem('cowboy hat') then group1++
        if engine.hasItem('rainbow wig') then group1++
        if engine.hasItem('motorcycle helmet') then group1++
        if engine.hasItem('stovepipe hat') then group1++

        if engine.hasItem('leather jacket') then group2++
        if engine.hasItem('clown suit') then group2++
        if engine.hasItem('oldtimey suit') then group2++
        if engine.hasItem('cow print vest') then group2++

        if engine.hasItem('gun belt') then group3++
        if engine.hasItem('rubber chicken') then group3++
        if engine.hasItem('fake beard') then group3++
        if engine.hasItem('metal chain') then group3++

        return Math.max(group1, group2, group3, group4)

    removeAllCostumeItems = (engine) ->
        engine.removeItem('cowboy hat')
        engine.removeItem('rainbow wig')
        engine.removeItem('motorcycle helmet')
        engine.removeItem('stovepipe hat')

        engine.removeItem('leather jacket')
        engine.removeItem('clown suit')
        engine.removeItem('oldtimey suit')
        engine.removeItem('cow print vest')

        engine.removeItem('gun belt')
        engine.removeItem('rubber chicken')
        engine.removeItem('fake beard')
        engine.removeItem('metal chain')


    engine.addRoom 'Seal or No Seal (Backstage)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('This is the stage. It is just as stupid looking as the rest of the show. Obvious exits are west to the show\'s entrance. The show manager stares at you questioningly.')

        else if @matches('talk manager')
            switch costumeMatches(@)
                when 0
                    @print('The show manager apologizes, "I am sorry sir, you look like a decent kind of person, and I\'m afraid we have no place for that on television. Maybe if you came back dressed like a maniac we could work something out.')
                when 3
                    @print('The show manager looks you over, noticing good taste, your knack for flair and attention to detail. He declares "Well, I appreciate you taking time to assemble the costume, but it is just a bit too orderly. You really aren\'t what we are looking for."')
                    removeAllCostumeItems(@)
                when 2
                    @print('The show manager looks pleased, yet a touch troubled. "You look to be a man going in the right direction, but we only select the best of the best for Seal or no Seal. Your costume is not quite ready for the big show yet.')
                    removeAllCostumeItems(@)
                when 1
                    alert('"Oh, wow!" Exclaims the show manager. "You look absolutely awful. You definitely have the look for our show." You start to dance around, whooping and hollering, declaring yourself the future king of the world. "And I see you have the charisma to match." He turns to his assistant, "Get this fella on stage at once.')
                    @goToRoom('Seal or No Seal (On Stage!)')

        else if @matches('west')
            @goToRoom('Seal or No Seal')
        else
            @tryUniversalCommands()


    engine.addRoom 'Seal or No Seal (On Stage!)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('"Welcome back to the Seal or No Seal, the most popular game show under the sea! I\'m your well tanned host Jerry Zintervanderbinderbauer Jr. Let\'s meet our next contestant: Sharc! An incredibly obnoxious yet persuasive young ocean dweller, he loves annoying his friends and is always up for a round of Scrabble, LADIES. Time to get started. Now, Sharc I am going to present you with a briefcase. In this briefcase, there might be a seal or there might not be a seal. And I need you to tell me which it is: SEAL or NO SEAL?"')

        else if @matches('no seal')
            alert('Jerry slowly opens the briefcase, peeking inside first to detect any signs of seal entrails and then, wearing a face of practiced disappointment and empathy, whimpers "Too bad," letting the case open the rest of the way. At this, you are promptly ushered off the stage to make way for the next sucker.')
            removeAllCostumeItems(@)
            @goToRoom('Seal or No Seal (Backstage)')

        else if @matches('seal')
            alert('Jerry slowly opens the briefcase, peeking inside first to detect any signs of seal entrails and then excitedly pulls it all the way open. "He\'s right people! Now, let\'s see your prizes." "Prizes is right Jerry," says a voice coming from nowhere and everywhere all at once. "Here are some world class selections I picked up from the grocery store on the way here this morning: Success comes in cans, not in can nots. Tin cans that is! That\'s why we are offering you the choice of a full week\'s supply of \'Captain Ned\'s Pickled Herring\', or \'No Ifs Ands or Butter\' brand margarine spread product for your consumption pleasure.  Naturally you choose the margarine because you are health conscious or something.')
            removeAllCostumeItems(@)
            @getItem('margarine')
            @goToRoom('Seal or No Seal (Backstage)')

        else
            @tryUniversalCommands()


    engine.addRoom 'Water World', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Oh man, Water World! You love that movie. Kevin Costner should have totally gotten the Oscar. Wait this isn\'t like that. This is Water World, the home of that stupid killer whale, Shampu. What a hack! Obvious exits are north to the Manatee show, east to the gift shop, and south to the Achtipus\'s garden.')

        else if @matches('north')
            @goToRoom('Water World (Manatee Exhibit)')
        else if @matches('east')
            @goToRoom('Water World (Gift Shop)')
        else if @matches('south')
            @goToRoom('Achtipus\'s Garden')
        else
            @tryUniversalCommands()


    engine.addRoom 'Water World (Manatee Exhibit)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('And there it is: The illustrious manatee. You can see why the stands are empty. There are big umbrellas attached to some picnic tables; not much to see. Obvious exits are west to the Manatee service room and south to the park entrance.')

        else if @matches('take umbrella')
            @getItem('umbrella')
            @print('Well, okay. You now have an umbrella.')

        else if @matches('west')
            @goToRoom('Water World (Mechanical Room Type Place)')
        else if @matches('south')
            @goToRoom('Water World')
        else
            @tryUniversalCommands()


    engine.addRoom 'Water World (Gift Shop)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('You enter the Water World gift shop. There are all sorts of great items here: a giant stuffed octopus, dehydrated astronaut fish food, junior marine sheriff badge stickers, and some of that clay sand crap they used to advertise on TV. See anything you like? West to the park entrance.')

        else if @matches('take badge')
            @getItem('badge')
            @print('You take the junior marine sheriff badge stickers to the counter. The cashier says they are on sale, only 15 fish dollars, plus tax. Yussss. You pay the man.')

        else if @matches('take')
            @print('You take that item to the counter. The cashier says it is ' + (18 + Math.floor(Math.random() * 30)).toString() + ' fish dollars but you only have 17 fish dollars. Nuts.')

        else if @matches('west')
            @goToRoom('Water World')
        else
            @tryUniversalCommands()


    engine.addRoom 'Water World (Mechanical Room Type Place)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('What in the name of Captain Nemo is this? There are manatees in hoists all over the room hooked up to...milking devices. This is no mechanical room! It\'s a cover for a secret, illegal, underground, black market, but probably organic, sea cow milking operation. The fiends! You are going to blow the lid off this thing for sure. The sweaty old fish running the machinery has not noticed you yet. Obvious exits are east to the manatee exhibit.')
        else if @matches('talk') or @match('badge') or @match('sticker')
            if not @hasItem('badge')
                @print('You swim up to the fish at the controls. "I am going to shut you down!" You shout at him. He laughs heartily. "You don\'t stand a chance. You\'re just a regular guy. I\'m the mayor of Water World. Who is going to believe you?" He goes back to his work paying you no mind. He has a point.')
            else
                @print('You swim up to the fish brandishing your badge sticker. "You are under arrest for illegal milk harvesting from endangered manatees. I\'m taking you in." "Wait," he says, "You don\'t have to do this. It\'s the only way I can keep Water World running. Don\'t you see? Now that we are on our sixth Shampu, people just don\'t seem to care about the magic of exploited marine mammals. I will, uh...make it worth your while though." He slides a fresh bottle of milk in your direction. Without looking at you he says, "It is worth thousands in the right market."')
                @getItem('milk')

        else if @matches('east')
            @goToRoom('Water World (Manatee Exhibit)')
        else
            @tryUniversalCommands()


    engine.addRoom 'The Ethereal Realm', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('You have entered The Ethereal Realm. Why did you do that? That was a bad decision. Wale is at your side. There are a bunch of weird, spacey platforms and junk floating around in a cosmic void -- your typical surrealist dreamscape environment. Ahead is an ugly monster. He is clutching something in his hand. Obvious exits are NONE! This is the world of waking nightmares you dingus.')
        else if @matches('talk monster')
            @print('You are getting worse at this game. You approach said monster in an effort to get some leads on your precious hair product. Maybe it would have been a better idea to start by just asking him about the status of the local basketball team or something?')
            @wait =>
                @print('On closer examination though, you realize this is not just any monster. It is a Torumekian hyper goblin. And in his grisly paw rests the item of your quest: your $23 shampoo!')
                @wait =>
                    @print('"Sharc, we can not allow him to use that shampoo," whispers your companion. "On the head of a hyper goblin, hair that smooth could mean the end of fashion as we know it. We must retrieve it by any means necessary."')
                    @wait =>
                        @print('No sooner have the words left Wale\'s lips than you are spotted. That is all the motivation this beast needs. He flips the cap on the bottle, raising it to the filthy, string-like mop you can only assume must be his hair, all the while gazing down at you in defiance with his single blood shot eye.')
                        @wait =>
                            @goToRoom('The Ethereal Realm (Do something!)')
        else
            @tryUniversalCommands()

    engine.addRoom 'The Ethereal Realm (Do something!)', ->
        if @exactlyMatches('enter') or @exactlyMatches('look')
            @print('Do something!')
        else if @exactlyMatches('something')
            @print('Oh very funny.  Now is definitely not the time for snark.')

        else if @matches('attack')
            @print('You start to lunge towards the creature, but Wale pushes you out of the way in a charge himself. You cringe as you hear the slashing of flesh. Red mist floats out of Wale\'s side. Your head is spinning.')
            @wait =>
                @print('"Now Sharc!", he wheezes, "Use the power of the Quadratic Eye."')
                @wait =>
                    @print('"But you said I wasn\'t ready!" you cry, trying not to look at the sorry state of your friend.')
                    @wait =>
                        @print('"No, it was I who was not ready. The p-power has always been within y-you."')
                        @wait =>
                            @getItem('quadratic eye')
                            @goToRoom('The Ethereal Realm (Use the Quadratic Eye!)')
        else
            @tryUniversalCommands()

    engine.addRoom 'The Ethereal Realm (Use the Quadratic Eye!)', ->
        if @matches('use quadratic eye')
            @removeItem('quadratic eye')
            @goToRoom('End')
        else
            @tryUniversalCommands()


    engine.addRoom 'End', ->
        if @exactlyMatches('enter')
            @print('You remove the Quadratic Eye from its compartment, close your eyes and allow union between your spirit and the universal chi flow. Then the goblin gets cut in half and you get your shampoo back.')


    #engine.setStartRoom('Wale vs Sharc: The Comic: The Interactive Software Title For Your Computer Box')
    engine.setStartRoom('The Ethereal Realm')
