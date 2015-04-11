"""
        Room3: Look west: There is some ocean. Have you been there before?
Look North: To the north you see the ocean... again, Oh wait, that's no ocean, that's the sea. Rookie mistake
Look east: On the east side is your friend wale. You have been looking for him.
Go west: Did the water just get warmer? You chuckle to yourself, gross. No, there are some hot springs below that are attracting a school of herring.
Go north: To the north is the sea. You can not go there. What do you think you are a sea dwelling fish?
Go east: It is your friend wale. He is pretending to meditate you know better. This is the kind of relationship you have.

I also did some general brainstorming and came up with some items that could be used.
Here are the ones I have.
Sharc's Shampoo- the maguffin for the game
Cuttlefish- I mostly just like the name, but I think they spray ink like octopi so maybe there is a part later where you need to write something but your pen is dry or you need to be dyed black or something 
Pancake mix- You could use it to bribe wale into helping you on your quest in which case it should be whole wheat
A herring- Not sure yet but you can also find red paint and color it and then it becomes a red herring, could just leave it at that.
Red paint- for the herring
An empty peanut butter jar- I am thinking there could be a segment where you are in his house and you could get this there. Probably best left for later or it could be another useless item, for now anyway.
The ghost of a former Steak and shake employee even though he is still alive.
A rubber chicken with a pulley in it?- Because
"""

"""

module.exports =

    synonyms:
        go: []
        look: []
        left: []
        forward: []
        right: []
        back: ['behind']
        
    start:
        name: 'Wale vs sharc: the comic: the interactive software title for your computer box'
        enter: 'Start game. Your name is sharc. You are a ferocious saltwater dwelling beast with an obnoxious sense of humor. You are in search of your lost bottle of shampoo. You suspect foul play. In order to investigate further you need to find your friend wale. What do you do?'
        description: 'In order to start the game you should probably type "start"'
        go:
            start: 'ocean'

    ocean:
        name: 'The Ocean'
        description: 'You are in the ocean. "Which ocean you ask?" THE ocean.'
        look:
            left: 'On your left is some ocean it is blue.'
            forward: 'In front of you is some ocean, beyond that you can maybe make out some sea. It is hard to tell.'
            right: 'On your right is Billy Ocean. He is gesturing to his car.'
        go: [
            'left'
            'forward'
            'right'
        ]

    '404':
        name: 'Error'
        description: 'How did you get here?  You should not have come here.'

    cuttlefish:
        enter: 'You come upon a school of cuttlefish. They don\'t look cuddly.'
        

    billyOcean:
        name: 'Billy Ocean'
        enter: 'You swim up to Billy Ocean. He is wearing all white and keeps pointing at you and then the open door on his car. It would be helpful if he could talk but you get the idea. It is a pretty sweet car.'
        description: 'It\'s Billy Ocean.  He is gesturing to his car.'
        go: [
            'ocean'
        ]
        cuddle:
            cuttlefish: 'You are feeling affectionate today and you just got dumped so why not? You jump some of the cuttlefish and start snuggling and cuddling. The cuttlefish are not amused though and say they are tired of fish making that mistake. They all swim away except for one that has attached its suckers to your mid region. You don\'t seem to mind.'

    wetterOcean:
        enter: 'This ocean feels wetter than the last ocean. You find this oddly calming.'
        description: 'Paths available are straight, left or turn around.'
        look:
            forward: 'Ahead of you is the Steak & Shake you used to work at. A cold shiver runs down your dorsal fin just thinking about it.'
            right: 'It looks like its a, oh no way, sperm whale. Ah ha ha. That is hilarious. But seriously this guy looks like he is probably a serious tool.'
            back: 'You often find yourself looking at your behind/back but usually you use a mirror. Just kidding, that is where you started man. It\'s just a square of ocean. You did have some good times there though didn\'t you? Maybe we could just reminisce for a while.'
        go: [
            'steaknshake'
        ]
        
    steakNShake:
        enter: 'You swim up to the ruins of your old work place. Better days is right, your mind is flooded with memories floating in front of the old grill, coming up with new recipes to try when your manager had his back turned. Then someone said "Ever tried an M-80 burger?" the words echoed in his mind like a phantom whisper of ages past. The tattered remnants of a red and white awning flutters in the wind as if to surrender to an enemy.'
        go: [
            'right'
        ]

    backAlley:
        enter: '"Listen up butt heads" the whale barks at some kids he is tormenting. "Lunch money, milk money, gas money, and retirement funds right here unless you want to end up in a hospital bed." More like jerk head whale you mutter to your self.'
        description: 'You are in a scary back alley with an ominous whale and some scared kids.'

"""


# In this room there is a guy, you have to pick up the candy bar and give it to him and then he will give you a cookie

module.exports =
    synonyms:
        look: [
            'see'
            'admire'
            'behold'
            'gawk'
            'observe'
            'spy'
        ]
        take: [
            'pick up'
            'get'
            'acquire'
            'grab'
            'grasp'
            'obtain'
        ]
        go: [
            'walk'
            'perambulate'
            'flee'
            'leave'
            'move'
            'travel'
            'depart'
            'decamp'
            'exit'
            'journey'
            'mosey'
            'withdraw'
        ]
        give: [
            'deliver'
            'donate'
            'hand over'
            'present'
            'endow'
            'bequeath'
            'bestow'
            'relinquish'
        ]

    globalCommands:
        take:
            results: [
                'print(You can\'t get that man.)'
            ]
        go:
            results: [
                'print(You can\'t go that way man.)'
            ]
        talk:
            results: [
                'print(Who are you talking to? That is not something you can talk to.)'
            ]

    items:
        'candy bar':
            name: 'Candy Bar'
            state: 'ungotten'
            commands:
                'look at candy bar': [
                    'print(It is a candy bar.  What more do you want from me?)'
                ]
        'cookie':
            name: 'Cookie'
            state: 'ungotten'
            commands:
                'look at cookie': [
                    'print(It has chips of all kinds, including chocolate, macadamia, browser, and gold plated.)'
                ]

    startRoom: 'Candy Room'

    rooms:
        'North Candy Room':
            look:
                results: [
                    'print(This is the north candy room.)'
                ]
            'go south':
                results: [
                    'goToRoom(Candy Room)'
                ]
        'South Candy Room':
            look:
                results: [
                    'print(This is the south candy room.)'
                ]
            'go north':
                results: [
                    'goToRoom(Candy Room)'
                ]
        'West Candy Room':
            look:
                results: [
                    'print(This is the west candy room.)'
                ]
            'go east':
                results: [
                    'goToRoom(Candy Room)'
                ]
        'East Candy Room':
            look:
                results: [
                    'print(This is the east candy room.)'
                ]
            'go west':
                results: [
                    'goToRoom(Candy Room)'
                ]

        'Candy Room':
            look:
                results: [
                    'print(You swiftly and deftly enter into the mystical candy room of destiny.  You see a guy.  The candy room has piles and piles of candy all around.  You see on the floor a candy bar conspicuously not attached to any walls.  It looks like it might be able to be PICK UP\'d.)'
                ]

            'look candy bar':
                conditions: [
                    'itemNotInInventory(candy bar)'
                ]
                results: [
                    'print(That candy bar is sure looking tasty and on the floor. Why don\'t you pick it up man???'
                ]

            'talk guy':
                conditions: [
                    'itemNotInInventory(candy bar)'
                ]
                results: [
                    'print(Man am I hungry for some candy bar.  I wish there was one right under my feet!)'
                ]

            'go north':
                results: [
                    'goToRoom(North Candy Room)'
                ]
            'go south':
                results: [
                    'goToRoom(South Candy Room)'
                ]
            'go east':
                results: [
                    'goToRoom(East Candy Room)'
                ]
            'go west':
                results: [
                    'goToRoom(West Candy Room)'
                ]

            'eat candy bar':
                conditions: [
                    'inventoryRequired(candy bar)'
                ]
                results: [
                    'print(That is a quest item man, you can\'t eat that!)'
                ]

            'take candy bar':
                results: [
                    'inventoryAdd(candy bar)'
                    'print(You place the tasty bar into your sweaty sweat sweats.)'
                ]

            'give guy candy bar':
                conditions: [
                    'inventoryRequired(candy bar)'
                ]
                results: [
                    'inventoryRemove(candy bar)'
                ]
