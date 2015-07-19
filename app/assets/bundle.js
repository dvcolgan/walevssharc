(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/dcolgan/projects/walevssharc/app/main.coffee":[function(require,module,exports){
var engine, m, view;

m = require('mithril');

engine = require('app/engine');

view = require('app/view');

m.mount(document.body, view);



},{"app/engine":"/home/dcolgan/projects/walevssharc/node_modules/app/engine.coffee","app/view":"/home/dcolgan/projects/walevssharc/node_modules/app/view.coffee","mithril":"/home/dcolgan/projects/walevssharc/node_modules/mithril/mithril.js"}],"/home/dcolgan/projects/walevssharc/node_modules/app/engine.coffee":[function(require,module,exports){
var TextBasedAdventureEngine;

TextBasedAdventureEngine = require('app/tbaengine');

module.exports = new TextBasedAdventureEngine();



},{"app/tbaengine":"/home/dcolgan/projects/walevssharc/node_modules/app/tbaengine/index.coffee"}],"/home/dcolgan/projects/walevssharc/node_modules/app/tbaengine/index.coffee":[function(require,module,exports){
var Engine, synonymData,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

synonymData = require('./synonyms');

module.exports = Engine = (function() {
  function Engine() {
    this.rooms = {};
    this.universalCommands = function() {};
    this.afterCommand = function() {};
    this.inventory = {};
    this.currentRoomName = '';
    this.flags = {};
    this.commandWords = [];
    this.message = '';
    this.callbacks = [];
    this.startRoom = '';
    this.waitCallback = null;
  }

  Engine.prototype.setStartRoom = function(roomName) {
    return this.startRoom = roomName;
  };

  Engine.prototype.setAfterCommand = function(callback) {
    return this.afterCommand = callback.bind(this);
  };

  Engine.prototype.save = function() {
    return localStorage.setItem('progress', JSON.stringify({
      inventory: this.inventory,
      currentRoomName: this.currentRoomName
    }));
  };

  Engine.prototype.load = function() {
    var data;
    try {
      data = JSON.parse(localStorage.getItem('progress'));
      this.inventory = data.inventory;
      this.currentRoomName = data.currentRoomName;
      return true;
    } catch (_error) {
      localStorage.clear();
      return false;
    }
  };

  Engine.prototype.addRoom = function(roomName, callback) {
    return this.rooms[roomName] = callback.bind(this);
  };

  Engine.prototype.getCurrentRoomName = function() {
    return this.currentRoomName;
  };

  Engine.prototype.getCurrentMessage = function() {
    return this.message;
  };

  Engine.prototype.getInventory = function() {
    return JSON.parse(JSON.stringify(this.inventory));
  };

  Engine.prototype.doCommand = function(commandText) {
    var callback, cannonicalWord, i, len, synonym, synonyms;
    if (this.waitCallback != null) {
      callback = this.waitCallback;
      this.waitCallback = null;
      callback();
      return;
    }
    commandText = commandText.trim().toLowerCase().replace(/\W+/g, ' ').replace(/\s{2,}/g, ' ');
    for (cannonicalWord in synonymData) {
      synonyms = synonymData[cannonicalWord];
      for (i = 0, len = synonyms.length; i < len; i++) {
        synonym = synonyms[i];
        commandText = commandText.replace(synonym, cannonicalWord);
      }
    }
    this.commandWords = commandText.split(' ');
    this.rooms[this.currentRoomName]();
    return this.afterCommand();
  };

  Engine.prototype.setUniversalCommands = function(callback) {
    return this.universalCommands = callback.bind(this);
  };

  Engine.prototype.tryUniversalCommands = function() {
    return this.universalCommands();
  };

  Engine.prototype.matches = function(pattern) {
    var i, len, patternWord, patternWords;
    patternWords = pattern.split(' ');
    for (i = 0, len = patternWords.length; i < len; i++) {
      patternWord = patternWords[i];
      if (!(indexOf.call(this.commandWords, patternWord) >= 0)) {
        return false;
      }
    }
    return true;
  };

  Engine.prototype.hasItem = function(item) {
    return item in this.inventory;
  };

  Engine.prototype.usedItem = function(item) {
    return item in this.inventory && this.inventory[item] === 'used';
  };

  Engine.prototype.percentChance = function(chance) {
    return Math.random() < chance / 100;
  };

  Engine.prototype.flagIs = function(flagName, value) {
    return this.flags[flagName] === value;
  };

  Engine.prototype.print = function(text) {
    this.message = text;
    return this.notify();
  };

  Engine.prototype.goToRoom = function(roomName) {
    this.currentRoomName = roomName;
    this.doCommand('look');
    return this.notify();
  };

  Engine.prototype.goToStart = function() {
    this.currentRoomName = this.startRoom;
    this.doCommand('look');
    return this.notify();
  };

  Engine.prototype.setFlag = function(flagName, value) {
    this.flags[flagName] = value;
    return this.notify();
  };

  Engine.prototype.getItem = function(item) {
    this.inventory[item] = 'gotten';
    return this.notify();
  };

  Engine.prototype.removeItem = function(item) {
    delete this.inventory[item];
    return this.notify();
  };

  Engine.prototype.useItem = function(item) {
    this.inventory[item] = 'used';
    return this.notify();
  };

  Engine.prototype.wait = function(callback) {
    this.message += ' <strong>(Hit Enter)</strong>';
    this.waitCallback = callback;
    return this.notify();
  };

  Engine.prototype.listen = function(callback) {
    return this.callbacks.push(callback);
  };

  Engine.prototype.notify = function() {
    var callback, i, len, ref, results;
    ref = this.callbacks;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      callback = ref[i];
      results.push(callback());
    }
    return results;
  };

  return Engine;

})();



},{"./synonyms":"/home/dcolgan/projects/walevssharc/node_modules/app/tbaengine/synonyms.coffee"}],"/home/dcolgan/projects/walevssharc/node_modules/app/tbaengine/synonyms.coffee":[function(require,module,exports){
module.exports = {
  look: ['see', 'admire', 'behold', 'gawk', 'observe', 'spy'],
  take: ['pick up', 'get', 'acquire', 'grab', 'grasp', 'obtain', 'buy', 'choose'],
  go: ['walk', 'perambulate', 'flee', 'leave', 'move', 'travel', 'depart', 'decamp', 'exit', 'journey', 'mosey', 'withdraw'],
  give: ['deliver', 'donate', 'hand over', 'present', 'endow', 'bequeath', 'bestow', 'relinquish'],
  garden: ['plot', 'plants', 'produce']
};



},{}],"/home/dcolgan/projects/walevssharc/node_modules/app/view.coffee":[function(require,module,exports){
var TextTyper, WaleVsSharc, engine, m,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

m = require('mithril');

engine = require('app/engine');

WaleVsSharc = require('app/walevssharc');

String.prototype.capitalize = function() {
  return this[0].toUpperCase() + this.slice(1);
};

TextTyper = (function() {
  function TextTyper() {
    this.currentMessage = '';
    this.typer = null;
    this.makeTyper = function(text, speed) {
      var i, typeLoop;
      if (speed == null) {
        speed = 4;
      }
      i = 0;
      typeLoop = function() {
        i++;
        m.redraw();
        if (i < text.length - 1) {
          return setTimeout(typeLoop, speed);
        }
      };
      setTimeout(typeLoop, speed);
      return function() {
        return text.slice(0, +i + 1 || 9e9);
      };
    };
  }

  TextTyper.prototype.print = function(message) {
    if (message !== this.currentMessage) {
      this.currentMessage = message;
      this.typer = new this.makeTyper(message);
      return m.redraw();
    }
  };

  TextTyper.prototype.getTypingMessage = function() {
    if (this.typer != null) {
      return this.typer();
    } else {
      return '';
    }
  };

  TextTyper.prototype.getCurrentMessage = function() {
    return this.currentMessage;
  };

  return TextTyper;

})();

module.exports = {
  controller: (function() {
    function _Class() {
      this.onCommandSubmit = bind(this.onCommandSubmit, this);
      var didLoad;
      WaleVsSharc(engine);
      didLoad = engine.load();
      this.vm = {};
      this.vm.command = m.prop('');
      this.vm.typer = new TextTyper();
      engine.listen((function(_this) {
        return function() {
          _this.vm.typer.print(engine.getCurrentMessage());
          m.redraw();
          return engine.save();
        };
      })(this));
      if (didLoad) {
        engine.doCommand('look');
      } else {
        engine.goToStart();
      }
    }

    _Class.prototype.onCommandSubmit = function(e) {
      e.preventDefault();
      engine.doCommand(this.vm.command());
      return this.vm.command('');
    };

    return _Class;

  })(),
  view: function(ctrl) {
    var itemName, state;
    return [
      m('.sidebar', {
        style: {
          height: window.innerHeight + 'px',
          width: '260px',
          padding: '20px'
        }
      }, m('h2', {
        style: {
          marginTop: 0
        }
      }, 'Inventory'), [
        (function() {
          var ref, results;
          ref = engine.getInventory();
          results = [];
          for (itemName in ref) {
            state = ref[itemName];
            if (state === 'gotten') {
              results.push(m('p', itemName));
            } else if (state === 'used') {
              results.push(m('p', {
                style: {
                  textDecoration: 'line-through'
                }
              }, itemName));
            } else {
              results.push(void 0);
            }
          }
          return results;
        })(), m('button', {
          onclick: function() {
            localStorage.clear();
            alert('Save game deleted');
            return window.location.href = '';
          }
        }, 'Restart game')
      ]), m('.content', {
        style: {
          width: (window.innerWidth - 360) + 'px',
          padding: '20px',
          paddingTop: 0
        }
      }, m('h1', engine.getCurrentRoomName()), m('p', m.trust(ctrl.vm.typer.getTypingMessage())), m('form', {
        onsubmit: ctrl.onCommandSubmit
      }, m('input[type=text]', {
        style: {
          display: 'block'
        },
        onchange: m.withAttr('value', ctrl.vm.command),
        value: ctrl.vm.command(),
        config: function(element, isInitialized, context) {
          if (!isInitialized) {
            return element.focus();
          }
        }
      }), m('button[type=submit]', 'Do')))
    ];
  }
};



},{"app/engine":"/home/dcolgan/projects/walevssharc/node_modules/app/engine.coffee","app/walevssharc":"/home/dcolgan/projects/walevssharc/node_modules/app/walevssharc.coffee","mithril":"/home/dcolgan/projects/walevssharc/node_modules/mithril/mithril.js"}],"/home/dcolgan/projects/walevssharc/node_modules/app/walevssharc.coffee":[function(require,module,exports){
"Conditions:\n    @matches(pattern)\n    @hasItem(item name)\n    @percentChance(chance out of 100)\n    @flagIs(flag name, value)\n\nResults:\n    @print(text)\n    @goToRoom(room name)\n    @setFlag(flag name, value)";
module.exports = function(engine) {
  var costumeMatches, removeAllCostumeItems;
  engine.setUniversalCommands(function() {
    if (this.matches('die')) {
      return this.print('What are you doing? You are dead now.');
    } else if (this.matches('win')) {
      return this.print('You did it. You win. Buy yourself a pizza because you are so clever.');
    }
  });
  engine.setAfterCommand(function() {
    if (!this.flagIs('have_all_items', true) && this.hasItem('egg') && this.hasItem('flowers') && this.hasItem('can of soda') && this.hasItem('soda syrup') && this.hasItem('manatee milk') && this.hasItem('margarine')) {
      this.print('"Well, I think I have all the ingredients," you say to yourself. "I just need one of those places where you put them together so it turns into something you can eat. You know, one of those...food preparing rooms."');
      return this.setFlag('have_all_items', true);
    }
  });
  engine.addRoom('Ocean', function() {
    if (this.matches('look')) {
      return this.print('You find yourself in the ocean. You are a shark by the name of Sharc and your $23 shampoo is missing. You suspect foul play. Welcome to the ocean, it is a big blue wet thing and also your home. Obvious exits are North to your friend Wale.');
    } else if (this.matches('go north')) {
      return this.goToRoom('Wale');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Wale', function() {
    if (this.matches('look')) {
      return this.print('Hey, it is your friend, Wale. He is doing that thing where he has his eyes closed and acts like he did not notice your arrival. He is kind of a prick, but also your friend. What can you do? Obvious exits are Ocean to the south, a school of Cuttlefish to the west, more Ocean to the north, and Billy Ocean to the east.');
    } else if (this.matches('give pancakes')) {
      if (this.hasItem('pancakes')) {
        this.print('"Hey Wale," you call out as intrusively as possible, "I got your--" Before you could finish your sentence, your blubbery friend has snatched the plate away and, in a most undignified manner, begins mowing through the fried discs you so artfully prepared. "Soul searching takes a lot of energy," he explains between bites. "I haven\'t eaten anything all day." Once finished, Wale straightens himself out, looking a mite embarrassed for the savage display he just put on. "What was it you needed?" "Oh Wale, it\'s terrible. I think my $23 shampoo was stolen and the ghost of my not really dead friend says the fate of the world hangs in the balance." "I see," says Wale, his voice and manner remaining unchanged despite the threat of the world unbalancing. "Sharc, I fear the worst. You must summon the ethereal door." "No, Wale," you say, "you made me swear a thousand vows never to bring that cursed relic back among us." "I know what I said, but I also knew there would come a time when we would have no other choice."  You should probably summon the door.');
        this.removeItem('pancakes');
        return this.setFlag('given_pancakes', true);
      }
    } else if (this.matches('summon door') && this.flagIs('given_pancakes', true)) {
      this.print('You, finally convinced of your urgency and utter desperation, perform some intricate rites and incantations that would be really cool if you could see them, but I guess you will just have to use your imaginations. Text only fools!  The ethereal door stands open before you.');
      return this.setFlag('summoned_door', true);
    } else if (this.matches('enter door') && this.flagIs('summoned_door', true)) {
      return this.goToRoom('The Ethereal Realm');
    } else if (this.matches('talk wale')) {
      if (this.flagIs('talked_to_wale', true)) {
        this.print('(Get ready to do some reading) Wale is trying to meditate or something pretentious that you don\'t care about. You have something important! "Wale" you shout, "I need your help! The condition of my magnificent scalp is at stake." Wale sighs a heavy, labored sigh. "Sharc, you have disturbed my journey to my innermost being. Before I can help you, reparations must be made. Pancakes: whole wheat, with all natural maple syrup. Now leave me as I peel back the layers of the self and ponder the lesson of the cherry blossom.');
        return this.setFlag('talked_to_wale', true);
      } else {
        return this.print('"I can not lift a fin for you until you have brought a healthy serving of whole wheat pancakes with all natural maple syrup like I said before."');
      }
    } else if (this.matches('go south')) {
      return this.goToRoom('Ocean');
    } else if (this.matches('go north')) {
      return this.goToRoom('Wetter Ocean');
    } else if (this.matches('go west')) {
      return this.goToRoom('Cuttlefish');
    } else if (this.matches('go east')) {
      return this.goToRoom('Billy Ocean');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Wetter Ocean', function() {
    if (this.matches('look')) {
      return this.print('This is just some ocean you found. It does feel a little bit wetter than the rest of the ocean though. Also, did it just get warmer? Obvious exits are a garden to the west, Wale in the south, and a gameshow east.');
    } else if (this.matches('go south')) {
      return this.goToRoom('Wale');
    } else if (this.matches('go west')) {
      return this.goToRoom('Achtipus\'s Garden');
    } else if (this.matches('go east')) {
      return this.goToRoom('Seal or No Seal');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Cuttlefish', function() {
    if (this.matches('look')) {
      if (!this.hasItem('cuttlefish')) {
        return this.print('Look, there be some cuttlefish, though they do not look too cuddly. Steak and Shake is to the west, Achtipus\'s garden to the north, and Wale to the east.');
      } else {
        return this.print('There used to be cuttlefish here but you scared them away with your aggressive affections. Keep that stuff inside man!');
      }
    } else if (this.matches('cuddle cuttlefish')) {
      if (!this.hasItem('cuttlefish')) {
        this.print('You are feeling affectionate today and you just got dumped so why not? You jump some of the cuttlefish and start snuggling and cuddling. The cuttlefish are not amused though, and say they are tired of fish making that mistake. They all swim away except for one that has attached its suckers to your mid region. You don\'t seem to mind.');
        return this.getItem('cuttlefish');
      } else {
        return this.print('They are cuddled out.');
      }
    } else if (this.matches('go east')) {
      return this.goToRoom('Wale');
    } else if (this.matches('go north')) {
      return this.goToRoom('Achtipus\'s Garden');
    } else if (this.matches('go west')) {
      return this.goToRoom('Steak and Shake');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Billy Ocean', function() {
    if (this.matches('look')) {
      window.open('https://www.youtube.com/watch?v=9f16Fw_K45s', '_blank');
      return this.print('Suddenly, appearing before your eyes is singer-songwriter and former Caribbean king: Billy Ocean. Also Billy Ocean\'s car. Obvious exits are west to Wale and north to some kind of game show.');
    } else if (this.matches('talk')) {
      return this.print('He wants you to get into his car and drive him to the hospital. He just drove through the car wash with the top down after dropping some acid.');
    } else if (this.matches('hospital')) {
      this.print('Sure, why not? You get in the driver\'s seat and find your way to the nearest medical treatment center. As thanks, Mr. Ocean pulls an egg out from his glove box. You accept and swim away as fast as possible. Good, I ran out of jokes for that fast.');
      return this.getItem('egg');
    } else if (this.matches('call cops')) {
      return this.print('The police come and arrest Billy Ocean on charge of being completely irrelevant to this game. You Win! High Score.');
    } else if (this.matches('go west')) {
      return this.goToRoom('Wale');
    } else if (this.matches('go north')) {
      return this.goToRoom('Seal or No Seal');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Achtipus\'s Garden', function() {
    if (this.matches('look achtipus')) {
      return this.print('It\'s Achtipus. He is pulling out the seaweeds from his sea cucumber bed.');
    } else if (this.matches('look garden')) {
      return this.print('You see watermelon, water chestnuts, assorted flowers, sea cucumbers and strawberries.');
    } else if (this.matches('look')) {
      return this.print('Achtipus is working among his flowers and shrubs. He sees you and opens the gate for you. Obvious exits are north to Water World, east to some Ocean and south to a school of Cuttlefish.');
    } else if (this.matches('talk')) {
      return this.print('"This is quite the um...ocean hideaway you have here," you say. "Yes," he says, "I can see you have come a long way to get here, but I am glad you have found refuge on my grounds. If you see anything you like in my plot we could make a deal perhaps."');
    } else if (this.matches('take watermelon')) {
      return this.print('"I will give you the watermelon in exchange for an ice cream sundae."');
    } else if (this.matches('take nuts') || this.matches('take nut') || this.matches('take chestnuts') || this.matches('take chestnut')) {
      return this.print('"I will give you some water chestnuts if you can find me a pure bred German Shepard."');
    } else if (this.matches('take cucumber') || this.matches('take cucumbers')) {
      return this.print('"You can have the sea cucumbers in exchange for a full pardon for these major felony charges that are still pending."');
    } else if (this.matches('take strawberries')) {
      return this.print('"Oh, actually those strawberry fields aren\'t even real."');
    } else if (this.matches('take flowers') || this.matches('take flower')) {
      if (!this.flagIs('given_umbrella', true)) {
        return this.print('"I can see you like the flowers. I will let you have them if you can find something to keep it from getting so hot here. I would be able to do twice as much work if it were a bit cooler.');
      } else {
        this.print('"You have great taste. These flowers are really versatile and will be good just about anywhere."');
        return this.getItem('flowers');
      }
    } else if (this.matches('give umbrella')) {
      this.print('"This will be perfect for blocking out that sun’s harsh rays. Thanks!"');
      return this.setFlag('given_umbrella', true);
    } else if (this.matches('go north')) {
      return this.goToRoom('Water World');
    } else if (this.matches('go east')) {
      return this.goToRoom('Wetter Ocean');
    } else if (this.matches('go south')) {
      return this.goToRoom('Cuttlefish');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake', function() {
    if (this.matches('look')) {
      return this.print('You swim up to the ruins of your old work place. This place has seen better days. Your mind is flooded with memories of floating in front of the old grill and coming up with new recipes to try when your manager had his back turned. Then someone said "Ever tried an M-80 burger? I have enough for everyone." The words echo in your mind like a phantom whisper of ages past. It\'s the ruins of the old Steak and Shake you used to work at until your friend blew it up. The tattered remnants of a red and white awning flutters in the wind as if to surrender to an enemy. What is left of a door hangs on a single hinge to the west. Cuttlefish stomping grounds lie east.');
    } else if (this.matches('go west') || this.matches('open door') || this.matches('go inside') || this.matches('go in')) {
      return this.goToRoom('Steak and Shake (Doorway)');
    } else if (this.matches('go east')) {
      return this.goToRoom('Cuttlefish');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Doorway)', function() {
    if (this.matches('look')) {
      return this.print('As you approach, the door falls clean off as if to warn you against entry. Never being one for omens, you ignore it. Inside you discover things much as you remember them. That is, if they had been mauled by a bear with blenders for hands who proceeded to set off a series of plastic explosives. To the south there are some tables and chairs, north lies the kitchen, and west a soda fountain. The outdoors is east.');
    } else if (this.matches('go south')) {
      return this.print('Your inner compass barks loudly at you. "What could possibly be interesting in the dining room?" You decide to stay put. (Actually the writer just didn\'t give me anything to put here.)');
    } else if (this.matches('go north')) {
      return this.goToRoom('Steak and Shake (Kitchen)');
    } else if (this.matches('go west')) {
      return this.goToRoom('Steak and Shake (Soda Fountain)');
    } else if (this.matches('go east')) {
      return this.goToRoom('Steak and Shake');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Kitchen)', function() {
    if (this.matches('look')) {
      return this.print('Welcome to the kitchen. Since the walls have all been blown away or dissolved, the only thing that separates it from the rest of the place is the oven and range.');
    } else if (this.matches('look oven') || this.matches('open oven')) {
      this.print('Check it out, it\'s your favorite pop, a Cherry Orange Snozzberry Lime Passionfruit Vanilla Croak in the oven. Who ever thought of baking a can of soda?');
      return this.getItem('can of soda');
    } else if (this.flagIs('have_all_items', true)) {
      if (this.matches('make pancakes')) {
        return this.goToRoom('Steak and Shake (Spooky Kitchen)');
      }
    } else if (this.matches('go south')) {
      return this.goToRoom('Steak and Shake (Doorway)');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen)', function() {
    if (this.matches('look')) {
      this.print('"Where do I start?" you wonder out loud. If only there were written series of instructions guiding you through. Where would you find something like that?');
      return this.wait((function(_this) {
        return function() {
          _this.print('You\'re pondering this when a draft comes over you. The lights flicker on and off. You sense a mysterious presence. The ghost of your old friend Creggles appears before you. Apparently he is haunting the Steak and Shake now and you\'re all like "Creggles, didn\'t we just hang out the other day? How are you a ghost already?"');
          return _this.wait(function() {
            _this.print('<span class="creepy">"Never you mind that now"</span> he says in his creepy nerd voice. <span class="creepy">"Sharc, if you hope to save the world from certain doom, you must succeed in making these pancakes. Use this ancient recipe handed down from the ancients to aid you."</span> An old, battered piece of paper floats down landing before you "Sweet Meemaws Sweety Sweet Flapjacks" it reads. <span class="creepy">"Now my work is done and I can ascend to my stepmom\'s house for grilled cheese sandwiches and chocolate milk."</span>');
            return _this.wait(function() {
              _this.print('You read the recipe. It is all in riddles. You hope you are up to the task.');
              return _this.wait(function() {
                return _this.goToRoom('Steak and Shake (Spooky Kitchen with an empty bowl sitting there)');
              });
            });
          });
        };
      })(this));
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with an empty bowl sitting there)', function() {
    if (this.matches('look')) {
      return this.print('In an urn take but not churn items two not like goo.');
    } else if (this.matches('soda flower')) {
      this.removeItem('flowers');
      this.removeItem('can of soda');
      return this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of powder sitting there)');
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with bowl of powder sitting there)', function() {
    if (this.matches('look')) {
      return this.print('Your potion is dry. This willst not fly. What\'s next must be dumped, poured and cracked for a proper flapjack.');
    } else if (this.matches('milk egg butter')) {
      this.removeItem('egg');
      this.removeItem('manatee milk');
      this.removeItem('margarine');
      return this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)');
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)', function() {
    if (this.matches('look')) {
      return this.print('Cutting and scooping shall have their day, but a for a fine fluffy batter there be but one way.');
    } else if (this.matches('stir')) {
      return this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)');
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)', function() {
    if (this.matches('look')) {
      this.print('Set the griddle or stove to medium heat. After it is warmed, drop batter a quarter cup at a time and turning once bubbles appear. "Well that seems pretty clear. I think I can do that on my own."');
      return this.wait((function(_this) {
        return function() {
          return _this.goToRoom('Steak and Shake (Spooky Kitchen with plate of dry pancakes sitting there)');
        };
      })(this));
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with plate of dry pancakes sitting there)', function() {
    if (this.matches('look')) {
      return this.print('Ten minutes later the pancakes are finished, but something is missing.');
    } else if (this.matches('syrup')) {
      this.removeItem('soda syrup');
      this.print('You got pancakes!  Hot dang.');
      this.getItem('pancakes');
      return this.wait((function(_this) {
        return function() {
          return _this.goToRoom('Steak and Shake (Kitchen)');
        };
      })(this));
    }
  });
  engine.addRoom('Steak and Shake (Soda Fountain)', function() {
    if (this.matches('look')) {
      return this.print('You see that the soda fountain has somehow remained largely undamaged. You think back to the days when you would sneak out bags of plain syrup to drink and the freakish waking dreams it would induce in you. You wonder if there is any still in there.');
    } else if (this.matches('look fountain') || this.matches('open fountain') || this.matches('look soda') || this.matches('open soda')) {
      return this.print('Avast, a hidden treasure trove of sugary wonder that has lain dormant all these years! You tremble at the beauty of the sight before you. So many bags and yet your magic hammerspace satchel will only allow for one. There\'s Spritz, Professor Ginger, Cactus Lager, and Ms. Shim Sham\'s Maple Soda.');
    } else if (this.matches('take maple')) {
      this.print('You find it shocking that you are the first raider of this soda tomb. But then again, you have always said people don\'t know the value of a bag of liquid sugar. You take off with it under cover of darkness.');
      return this.getItem('soda syrup');
    } else if (this.matches('go east')) {
      return this.goToRoom('Steak and Shake (Doorway)');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Seal or No Seal', function() {
    if (this.matches('look')) {
      return this.print('You just walked onto the set of the wildly popular game show, "Seal or No Seal!" Where flamboyant contestants flail around and shout while trying to arrive at the answer to that age old question...SEAL OR NO SEAL? To the east is backstage, north will take you to the dressing room, west or south will take you back wherever you came from.');
    } else if (this.matches('go north')) {
      return this.goToRoom('Seal or No Seal (Dressing Room)');
    } else if (this.matches('go east')) {
      return this.goToRoom('Seal or No Seal (Backstage)');
    } else if (this.matches('go west')) {
      return this.goToRoom('Wetter Ocean');
    } else if (this.matches('go south')) {
      return this.goToRoom('Billy Ocean');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Seal or No Seal (Dressing Room)', function() {
    var done, step1, step2, step3;
    step1 = 'Let\'s start with headgear. You see a cowboy hat, a rainbow wig, a motorcycle helmet, and a stovepipe hat.';
    step2 = 'Now select a set of clothes. You see a leather jacket, a clown suit, an oldtimey suit with one of those Colonel Sanders ties, and a cow print vest.';
    step3 = 'Accessorize! Pick from a fake beard, a gun belt, a metal chain, and a rubber chicken.';
    done = 'You look absolutely horrible! Or amazing, depending on your perspective. But the true judge will be the game show manager.';
    if (this.matches('look')) {
      return this.print('This place is great! It would be easy to cobble together a costume to get on that show. Lets see what we can find. Obvious exits are south to the show entrance.');
    } else if (this.matches('go south')) {
      return this.goToRoom('Seal or No Seal');
    } else if (this.matches('costume')) {
      return this.print(step1);
    } else if (this.matches('take cowboy hat')) {
      this.getItem('cowboy hat');
      return this.print(step2);
    } else if (this.matches('take rainbow wig')) {
      this.getItem('rainbow wig');
      return this.print(step2);
    } else if (this.matches('take motorcycle helmet')) {
      this.getItem('motorcycle helmet');
      return this.print(step2);
    } else if (this.matches('take stovepipe hat')) {
      this.getItem('stovepipe hat');
      return this.print(step2);
    } else if (this.matches('take leather jacket')) {
      this.getItem('leather jacket');
      return this.print(step3);
    } else if (this.matches('take clown suit')) {
      this.getItem('clown suit');
      return this.print(step3);
    } else if (this.matches('take oldtimey suit')) {
      this.getItem('oldtimey suit');
      return this.print(step3);
    } else if (this.matches('take cow vest') || this.matches('take print vest')) {
      this.getItem('cow print vest');
      return this.print(step3);
    } else if (this.matches('take fake beard')) {
      this.getItem('fake beard');
      return this.print(done);
    } else if (this.matches('take gun belt')) {
      this.getItem('gun belt');
      return this.print(done);
    } else if (this.matches('take metal chain')) {
      this.getItem('metal chain');
      return this.print(done);
    } else if (this.matches('take rubber chicken')) {
      this.getItem('rubber chicken');
      return this.print(done);
    } else {
      return this.tryUniversalCommands();
    }
  });
  costumeMatches = function(engine) {
    debugger;
    var group1, group2, group3, group4;
    group1 = 0;
    group2 = 0;
    group3 = 0;
    group4 = 0;
    if (engine.hasItem('cowboy hat')) {
      group1++;
    }
    if (engine.hasItem('rainbow wig')) {
      group1++;
    }
    if (engine.hasItem('motorcycle helmet')) {
      group1++;
    }
    if (engine.hasItem('stovepipe hat')) {
      group1++;
    }
    if (engine.hasItem('leather jacket')) {
      group2++;
    }
    if (engine.hasItem('clown suit')) {
      group2++;
    }
    if (engine.hasItem('oldtimey suit')) {
      group2++;
    }
    if (engine.hasItem('cow print vest')) {
      group2++;
    }
    if (engine.hasItem('gun belt')) {
      group3++;
    }
    if (engine.hasItem('rubber chicken')) {
      group3++;
    }
    if (engine.hasItem('fake beard')) {
      group3++;
    }
    if (engine.hasItem('metal chain')) {
      group3++;
    }
    return Math.max(group1, group2, group3, group4);
  };
  removeAllCostumeItems = function(engine) {
    engine.removeItem('cowboy hat');
    engine.removeItem('rainbow wig');
    engine.removeItem('motorcycle helmet');
    engine.removeItem('stovepipe hat');
    engine.removeItem('leather jacket');
    engine.removeItem('clown suit');
    engine.removeItem('oldtimey suit');
    engine.removeItem('cow print vest');
    engine.removeItem('gun belt');
    engine.removeItem('rubber chicken');
    engine.removeItem('fake beard');
    return engine.removeItem('metal chain');
  };
  engine.addRoom('Seal or No Seal (Backstage)', function() {
    if (this.matches('look')) {
      return this.print('This is the stage. It is just as stupid looking as the rest of the show. Obvious exits are west to the show\'s entrance. The show manager stares at you questioningly.');
    } else if (this.matches('talk manager')) {
      switch (costumeMatches(this)) {
        case 0:
          return this.print('The show manager apologizes, "I am sorry sir, you look like a decent kind of person, and I\'m afraid we have no place for that on television. Maybe if you came back dressed like a maniac we could work something out.');
        case 3:
          this.print('The show manager looks you over, noticing good taste, your knack for flair and attention to detail. He declares "Well, I appreciate you taking time to assemble the costume, but it is just a bit too orderly. You really aren\'t what we are looking for."');
          return removeAllCostumeItems(this);
        case 2:
          this.print('The show manager looks pleased, yet a touch troubled. "You look to be a man going in the right direction, but we only select the best of the best for Seal or no Seal. Your costume is not quite ready for the big show yet.');
          return removeAllCostumeItems(this);
        case 1:
          alert('"Oh, wow!" Exclaims the show manager. "You look absolutely awful. You definitely have the look for our show." You start to dance around, whooping and hollering, declaring yourself the future king of the world. "And I see you have the charisma to match." He turns to his assistant, "Get this fella on stage at once.');
          return this.goToRoom('Seal or No Seal (On Stage!)');
      }
    } else if (this.matches('go west')) {
      return this.goToRoom('Seal or No Seal');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Seal or No Seal (On Stage!)', function() {
    if (this.matches('look')) {
      return this.print('"Welcome back to the Seal or No Seal, the most popular game show under the sea! I\'m your well tanned host Jerry Zintervanderbinderbauer Jr. Let\'s meet our next contestant: Sharc! An incredibly obnoxious yet persuasive young ocean dweller, he loves annoying his friends and is always up for a round of Scrabble, LADIES. Time to get started. Now, Sharc I am going to present you with a briefcase. In this briefcase, there might be a seal or there might not be a seal. And I need you to tell me which it is: SEAL or NO SEAL?"');
    } else if (this.matches('no seal')) {
      alert('Jerry slowly opens the briefcase, peeking inside first to detect any signs of seal entrails and then, wearing a face of practiced disappointment and empathy, whimpers "Too bad," letting the case open the rest of the way. At this, you are promptly ushered off the stage to make way for the next sucker.');
      removeAllCostumeItems(this);
      return this.goToRoom('Seal or No Seal (Backstage)');
    } else if (this.matches('seal')) {
      alert('Jerry slowly opens the briefcase, peeking inside first to detect any signs of seal entrails and then excitedly pulls it all the way open. "He\'s right people! Now, let\'s see your prizes." "Prizes is right Jerry," says a voice coming from nowhere and everywhere all at once. "Here are some world class selections I picked up from the grocery store on the way here this morning: Success comes in cans, not in can nots. Tin cans that is! That\'s why we are offering you the choice of a full week\'s supply of \'Captain Ned\'s Pickled Herring\', or \'No Ifs Ands or Butter\' brand margarine spread product for your consumption pleasure.  Naturally you choose the margarine because you are health conscious or something.');
      removeAllCostumeItems(this);
      this.getItem('margarine');
      return this.goToRoom('Seal or No Seal (Backstage)');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Water World', function() {
    if (this.matches('look')) {
      return this.print('Oh man, Water World! You love that movie. Kevin Costner should have totally gotten the Oscar. Wait this isn\'t like that. This is Water World, the home of that stupid killer whale, Shampu. What a hack! Obvious exits are north to the Manatee show, east to the gift shop, and south to the Achtipus\'s garden.');
    } else if (this.matches('go north')) {
      return this.goToRoom('Water World (Manatee Exhibit)');
    } else if (this.matches('go east')) {
      return this.goToRoom('Water World (Gift Shop)');
    } else if (this.matches('go south')) {
      return this.goToRoom('Achtipus\'s Garden');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Water World (Manatee Exhibit)', function() {
    if (this.matches('look')) {
      return this.print('And there it is: The illustrious manatee. You can see why the stands are empty. There are big umbrellas attached to some picnic tables; not much to see. Obvious exits are west to the Manatee service room and south to the park entrance.');
    } else if (this.matches('take umbrella')) {
      this.getItem('umbrella');
      return this.print('Well, okay. You now have an umbrella.');
    } else if (this.matches('go west')) {
      return this.goToRoom('Water World (Mechanical Room Type Place)');
    } else if (this.matches('go south')) {
      return this.goToRoom('Water World');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Water World (Gift Shop)', function() {
    if (this.matches('look')) {
      return this.print('You enter the Water World gift shop. There are all sorts of great items here: a giant stuffed octopus, dehydrated astronaut fish food, junior marine sheriff badge stickers, and some of that clay sand crap they used to advertise on TV. See anything you like? East to the park entrance.');
    } else if (this.matches('take badge') || this.matches('take sheriff') || this.matches('take sticker') || this.matches('take stickers')) {
      this.getItem('badge sticker');
      return this.print('You take the junior marine sheriff badge stickers to the counter. The cashier says they are on sale, only 15 fish dollars, plus tax. Yussss. You pay the man.');
    } else if (this.matches('take')) {
      return this.print('You take that item to the counter. The cashier says it is ' + (18 + Math.floor(Math.random() * 30)).toString() + ' fish dollars but you only have 17 fish dollars. Nuts.');
    } else if (this.matches('go west')) {
      return this.goToRoom('Water World');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Water World (Mechanical Room Type Place)', function() {
    if (this.matches('look')) {
      return this.print('What in the name of Captain Nemo is this? There are manatees in hoists all over the room hooked up to...milking devices. This is no mechanical room! It\'s a cover for a secret, illegal, underground, black market, but probably organic, sea cow milking operation. The fiends! You are going to blow the lid off this thing for sure. The sweaty old fish running the machinery has not noticed you yet. Obvious exits are east to the manatee exhibit.');
    } else if (this.matches('talk')) {
      if (!this.hasItem('badge sticker')) {
        return this.print('You swim up to the fish at the controls. "I am going to shut you down!" You shout at him. He laughs heartily. "You don\'t stand a chance. You\'re just a regular guy. I\'m the mayor of Water World. Who is going to believe you?" He goes back to his work paying you no mind. He has a point.');
      } else {
        this.print('You swim up to the fish brandishing your badge sticker. "You are under arrest for illegal milk harvesting from endangered manatees. I\'m taking you in." "Wait," he says, "You don\'t have to do this. It\'s the only way I can keep Water World running. Don\'t you see? Now that we are on our sixth Shampu, people just don\'t seem to care about the magic of exploited marine mammals. I will, uh...make it worth your while though." He slides a fresh bottle of milk in your direction. Without looking at you he says, "It is worth thousands in the right market."');
        return this.getItem('manatee milk');
      }
    } else if (this.matches('go east')) {
      return this.goToRoom('Water World (Manatee Exhibit)');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('The Ethereal Realm', function() {
    if (this.matches('look')) {
      return this.print('You have entered The Ethereal Realm. Why did you do that? That was a bad decision. Wale is at your side. There are a bunch of weird, spacey platforms and junk floating around in a cosmic void -- your typical surrealist dreamscape environment. Ahead is an ugly monster. He is clutching something in his hand. Obvious exits are NONE! This is the world of waking nightmares you dingus.');
    } else if (this.matches('talk monster')) {
      return this.print('You are getting worse at this game. You approach said monster in an effort to get some leads on your precious hair product. Maybe next time start by asking him about the status of the local basketball team or something? On closer examination though, you realize this not just any monster. It is a Torumekian hyper goblin. And in his grisly paw rests the item of your quest, your $23 shampoo. "Sharc, we can not allow him to use that shampoo," whispers your companion. "On the head of a hyper goblin, hair that smooth could mean the end of fashion as we know it. We must retrieve it by any means necessary." No sooner have the words left Wale\'s lips that you are spotted. That is all the motivation this beast needs. He flips the cap on the bottle, raising it to the filthy, string-like mop you can only assume must be his hair, all the while gazing down at you in defiance with his single blood shot eye. Do something!');
    } else if (this.matches('attack')) {
      return this.print('You start to lunge towards the creature, but Wale pushes you out of the way in a charge himself. You cringe as you hear the slashing of flesh. Red mist floats out of Wale\'s side. Your head is spinning.  "Now Sharc!", he wheezes, "Use the power of the Quadratic Eye." "But you said I wasn\'t ready!" you cry, trying not to look at the sorry state of your friend. "No, it was I who was not ready. The p-power has always been within y-you." You feel a lump in your pocket. Reaching in, you pull out the Quadratic Eye.');
    } else if (this.matches('use quadratic eye')) {
      return this.goToRoom('End');
    }
  });
  engine.addRoom('End', function() {
    if (this.matches('look')) {
      return this.print('You remove the Quadratic Eye from its compartment, close your eyes and allow union between your spirit and the universal chi flow. Then the goblin gets cut in half and you get your shampoo back.');
    }
  });
  return engine.setStartRoom('Steak and Shake (Spooky Kitchen)');
};



},{}],"/home/dcolgan/projects/walevssharc/node_modules/mithril/mithril.js":[function(require,module,exports){
var m = (function app(window, undefined) {
	var OBJECT = "[object Object]", ARRAY = "[object Array]", STRING = "[object String]", FUNCTION = "function";
	var type = {}.toString;
	var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
	var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;
	var noop = function() {}

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame;

	// self invoking function needed because of the way mocks work
	function initialize(window){
		$document = window.document;
		$location = window.location;
		$cancelAnimationFrame = window.cancelAnimationFrame || window.clearTimeout;
		$requestAnimationFrame = window.requestAnimationFrame || window.setTimeout;
	}

	initialize(window);


	/**
	 * @typedef {String} Tag
	 * A string that looks like -> div.classname#id[param=one][param2=two]
	 * Which describes a DOM node
	 */

	/**
	 *
	 * @param {Tag} The DOM node tag
	 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
	 *
	 */
	function m() {
		var args = [].slice.call(arguments);
		var hasAttrs = args[1] != null && type.call(args[1]) === OBJECT && !("tag" in args[1] || "view" in args[1]) && !("subtree" in args[1]);
		var attrs = hasAttrs ? args[1] : {};
		var classAttrName = "class" in attrs ? "class" : "className";
		var cell = {tag: "div", attrs: {}};
		var match, classes = [];
		if (type.call(args[0]) != STRING) throw new Error("selector in m(selector, attrs, children) should be a string")
		while (match = parser.exec(args[0])) {
			if (match[1] === "" && match[2]) cell.tag = match[2];
			else if (match[1] === "#") cell.attrs.id = match[2];
			else if (match[1] === ".") classes.push(match[2]);
			else if (match[3][0] === "[") {
				var pair = attrParser.exec(match[3]);
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" :true)
			}
		}

		var children = hasAttrs ? args.slice(2) : args.slice(1);
		if (children.length === 1 && type.call(children[0]) === ARRAY) {
			cell.children = children[0]
		}
		else {
			cell.children = children
		}
		
		for (var attrName in attrs) {
			if (attrs.hasOwnProperty(attrName)) {
				if (attrName === classAttrName && attrs[attrName] != null && attrs[attrName] !== "") {
					classes.push(attrs[attrName])
					cell.attrs[attrName] = "" //create key in correct iteration order
				}
				else cell.attrs[attrName] = attrs[attrName]
			}
		}
		if (classes.length > 0) cell.attrs[classAttrName] = classes.join(" ");
		
		return cell
	}
	function build(parentElement, parentTag, parentCache, parentIndex, data, cached, shouldReattach, index, editable, namespace, configs) {
		//`build` is a recursive function that manages creation/diffing/removal of DOM elements based on comparison between `data` and `cached`
		//the diff algorithm can be summarized as this:
		//1 - compare `data` and `cached`
		//2 - if they are different, copy `data` to `cached` and update the DOM based on what the difference is
		//3 - recursively apply this algorithm for every array and for the children of every virtual element

		//the `cached` data structure is essentially the same as the previous redraw's `data` data structure, with a few additions:
		//- `cached` always has a property called `nodes`, which is a list of DOM elements that correspond to the data represented by the respective virtual element
		//- in order to support attaching `nodes` as a property of `cached`, `cached` is *always* a non-primitive object, i.e. if the data was a string, then cached is a String instance. If data was `null` or `undefined`, cached is `new String("")`
		//- `cached also has a `configContext` property, which is the state storage object exposed by config(element, isInitialized, context)
		//- when `cached` is an Object, it represents a virtual element; when it's an Array, it represents a list of elements; when it's a String, Number or Boolean, it represents a text node

		//`parentElement` is a DOM element used for W3C DOM API calls
		//`parentTag` is only used for handling a corner case for textarea values
		//`parentCache` is used to remove nodes in some multi-node cases
		//`parentIndex` and `index` are used to figure out the offset of nodes. They're artifacts from before arrays started being flattened and are likely refactorable
		//`data` and `cached` are, respectively, the new and old nodes being diffed
		//`shouldReattach` is a flag indicating whether a parent node was recreated (if so, and if this node is reused, then this node must reattach itself to the new parent)
		//`editable` is a flag that indicates whether an ancestor is contenteditable
		//`namespace` indicates the closest HTML namespace as it cascades down from an ancestor
		//`configs` is a list of config functions to run after the topmost `build` call finishes running

		//there's logic that relies on the assumption that null and undefined data are equivalent to empty strings
		//- this prevents lifecycle surprises from procedural helpers that mix implicit and explicit return statements (e.g. function foo() {if (cond) return m("div")}
		//- it simplifies diffing code
		//data.toString() might throw or return null if data is the return value of Console.log in Firefox (behavior depends on version)
		try {if (data == null || data.toString() == null) data = "";} catch (e) {data = ""}
		if (data.subtree === "retain") return cached;
		var cachedType = type.call(cached), dataType = type.call(data);
		if (cached == null || cachedType !== dataType) {
			if (cached != null) {
				if (parentCache && parentCache.nodes) {
					var offset = index - parentIndex;
					var end = offset + (dataType === ARRAY ? data : cached.nodes).length;
					clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end))
				}
				else if (cached.nodes) clear(cached.nodes, cached)
			}
			cached = new data.constructor;
			if (cached.tag) cached = {}; //if constructor creates a virtual dom element, use a blank object as the base cached node instead of copying the virtual el (#277)
			cached.nodes = []
		}

		if (dataType === ARRAY) {
			//recursively flatten array
			for (var i = 0, len = data.length; i < len; i++) {
				if (type.call(data[i]) === ARRAY) {
					data = data.concat.apply([], data);
					i-- //check current index again and flatten until there are no more nested arrays at that index
					len = data.length
				}
			}
			
			var nodes = [], intact = cached.length === data.length, subArrayCount = 0;

			//keys algorithm: sort elements without recreating them if keys are present
			//1) create a map of all existing keys, and mark all for deletion
			//2) add new keys to map and mark them for addition
			//3) if key exists in new list, change action from deletion to a move
			//4) for each key, handle its corresponding action as marked in previous steps
			var DELETION = 1, INSERTION = 2 , MOVE = 3;
			var existing = {}, shouldMaintainIdentities = false;
			for (var i = 0; i < cached.length; i++) {
				if (cached[i] && cached[i].attrs && cached[i].attrs.key != null) {
					shouldMaintainIdentities = true;
					existing[cached[i].attrs.key] = {action: DELETION, index: i}
				}
			}
			
			var guid = 0
			for (var i = 0, len = data.length; i < len; i++) {
				if (data[i] && data[i].attrs && data[i].attrs.key != null) {
					for (var j = 0, len = data.length; j < len; j++) {
						if (data[j] && data[j].attrs && data[j].attrs.key == null) data[j].attrs.key = "__mithril__" + guid++
					}
					break
				}
			}
			
			if (shouldMaintainIdentities) {
				var keysDiffer = false
				if (data.length != cached.length) keysDiffer = true
				else for (var i = 0, cachedCell, dataCell; cachedCell = cached[i], dataCell = data[i]; i++) {
					if (cachedCell.attrs && dataCell.attrs && cachedCell.attrs.key != dataCell.attrs.key) {
						keysDiffer = true
						break
					}
				}
				
				if (keysDiffer) {
					for (var i = 0, len = data.length; i < len; i++) {
						if (data[i] && data[i].attrs) {
							if (data[i].attrs.key != null) {
								var key = data[i].attrs.key;
								if (!existing[key]) existing[key] = {action: INSERTION, index: i};
								else existing[key] = {
									action: MOVE,
									index: i,
									from: existing[key].index,
									element: cached.nodes[existing[key].index] || $document.createElement("div")
								}
							}
						}
					}
					var actions = []
					for (var prop in existing) actions.push(existing[prop])
					var changes = actions.sort(sortChanges);
					var newCached = new Array(cached.length)
					newCached.nodes = cached.nodes.slice()

					for (var i = 0, change; change = changes[i]; i++) {
						if (change.action === DELETION) {
							clear(cached[change.index].nodes, cached[change.index]);
							newCached.splice(change.index, 1)
						}
						if (change.action === INSERTION) {
							var dummy = $document.createElement("div");
							dummy.key = data[change.index].attrs.key;
							parentElement.insertBefore(dummy, parentElement.childNodes[change.index] || null);
							newCached.splice(change.index, 0, {attrs: {key: data[change.index].attrs.key}, nodes: [dummy]})
							newCached.nodes[change.index] = dummy
						}

						if (change.action === MOVE) {
							if (parentElement.childNodes[change.index] !== change.element && change.element !== null) {
								parentElement.insertBefore(change.element, parentElement.childNodes[change.index] || null)
							}
							newCached[change.index] = cached[change.from]
							newCached.nodes[change.index] = change.element
						}
					}
					cached = newCached;
				}
			}
			//end key algorithm

			for (var i = 0, cacheCount = 0, len = data.length; i < len; i++) {
				//diff each item in the array
				var item = build(parentElement, parentTag, cached, index, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace, configs);
				if (item === undefined) continue;
				if (!item.nodes.intact) intact = false;
				if (item.$trusted) {
					//fix offset of next element if item was a trusted string w/ more than one html element
					//the first clause in the regexp matches elements
					//the second clause (after the pipe) matches text nodes
					subArrayCount += (item.match(/<[^\/]|\>\s*[^<]/g) || [0]).length
				}
				else subArrayCount += type.call(item) === ARRAY ? item.length : 1;
				cached[cacheCount++] = item
			}
			if (!intact) {
				//diff the array itself
				
				//update the list of DOM nodes by collecting the nodes from each item
				for (var i = 0, len = data.length; i < len; i++) {
					if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
				}
				//remove items from the end of the array if the new array is shorter than the old one
				//if errors ever happen here, the issue is most likely a bug in the construction of the `cached` data structure somewhere earlier in the program
				for (var i = 0, node; node = cached.nodes[i]; i++) {
					if (node.parentNode != null && nodes.indexOf(node) < 0) clear([node], [cached[i]])
				}
				if (data.length < cached.length) cached.length = data.length;
				cached.nodes = nodes
			}
		}
		else if (data != null && dataType === OBJECT) {
			var views = [], controllers = []
			while (data.view) {
				var view = data.view.$original || data.view
				var controllerIndex = m.redraw.strategy() == "diff" && cached.views ? cached.views.indexOf(view) : -1
				var controller = controllerIndex > -1 ? cached.controllers[controllerIndex] : new (data.controller || noop)
				var key = data && data.attrs && data.attrs.key
				data = pendingRequests == 0 || (cached && cached.controllers && cached.controllers.indexOf(controller) > -1) ? data.view(controller) : {tag: "placeholder"}
				if (data.subtree === "retain") return cached;
				if (key) {
					if (!data.attrs) data.attrs = {}
					data.attrs.key = key
				}
				if (controller.onunload) unloaders.push({controller: controller, handler: controller.onunload})
				views.push(view)
				controllers.push(controller)
			}
			if (!data.tag && controllers.length) throw new Error("Component template must return a virtual element, not an array, string, etc.")
			if (!data.attrs) data.attrs = {};
			if (!cached.attrs) cached.attrs = {};

			var dataAttrKeys = Object.keys(data.attrs)
			var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)
			//if an element is different enough from the one in cache, recreate it
			if (data.tag != cached.tag || dataAttrKeys.sort().join() != Object.keys(cached.attrs).sort().join() || data.attrs.id != cached.attrs.id || data.attrs.key != cached.attrs.key || (m.redraw.strategy() == "all" && (!cached.configContext || cached.configContext.retain !== true)) || (m.redraw.strategy() == "diff" && cached.configContext && cached.configContext.retain === false)) {
				if (cached.nodes.length) clear(cached.nodes);
				if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) cached.configContext.onunload()
				if (cached.controllers) {
					for (var i = 0, controller; controller = cached.controllers[i]; i++) {
						if (typeof controller.onunload === FUNCTION) controller.onunload({preventDefault: noop})
					}
				}
			}
			if (type.call(data.tag) != STRING) return;

			var node, isNew = cached.nodes.length === 0;
			if (data.attrs.xmlns) namespace = data.attrs.xmlns;
			else if (data.tag === "svg") namespace = "http://www.w3.org/2000/svg";
			else if (data.tag === "math") namespace = "http://www.w3.org/1998/Math/MathML";
			
			if (isNew) {
				if (data.attrs.is) node = namespace === undefined ? $document.createElement(data.tag, data.attrs.is) : $document.createElementNS(namespace, data.tag, data.attrs.is);
				else node = namespace === undefined ? $document.createElement(data.tag) : $document.createElementNS(namespace, data.tag);
				cached = {
					tag: data.tag,
					//set attributes first, then create children
					attrs: hasKeys ? setAttributes(node, data.tag, data.attrs, {}, namespace) : data.attrs,
					children: data.children != null && data.children.length > 0 ?
						build(node, data.tag, undefined, undefined, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace, configs) :
						data.children,
					nodes: [node]
				};
				if (controllers.length) {
					cached.views = views
					cached.controllers = controllers
					for (var i = 0, controller; controller = controllers[i]; i++) {
						if (controller.onunload && controller.onunload.$old) controller.onunload = controller.onunload.$old
						if (pendingRequests && controller.onunload) {
							var onunload = controller.onunload
							controller.onunload = noop
							controller.onunload.$old = onunload
						}
					}
				}
				
				if (cached.children && !cached.children.nodes) cached.children.nodes = [];
				//edge case: setting value on <select> doesn't work before children exist, so set it again after children have been created
				if (data.tag === "select" && "value" in data.attrs) setAttributes(node, data.tag, {value: data.attrs.value}, {}, namespace);
				parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			else {
				node = cached.nodes[0];
				if (hasKeys) setAttributes(node, data.tag, data.attrs, cached.attrs, namespace);
				cached.children = build(node, data.tag, undefined, undefined, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace, configs);
				cached.nodes.intact = true;
				if (controllers.length) {
					cached.views = views
					cached.controllers = controllers
				}
				if (shouldReattach === true && node != null) parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			//schedule configs to be called. They are called after `build` finishes running
			if (typeof data.attrs["config"] === FUNCTION) {
				var context = cached.configContext = cached.configContext || {};

				// bind
				var callback = function(data, args) {
					return function() {
						return data.attrs["config"].apply(data, args)
					}
				};
				configs.push(callback(data, [node, !isNew, context, cached]))
			}
		}
		else if (typeof data != FUNCTION) {
			//handle text nodes
			var nodes;
			if (cached.nodes.length === 0) {
				if (data.$trusted) {
					nodes = injectHTML(parentElement, index, data)
				}
				else {
					nodes = [$document.createTextNode(data)];
					if (!parentElement.nodeName.match(voidElements)) parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null)
				}
				cached = "string number boolean".indexOf(typeof data) > -1 ? new data.constructor(data) : data;
				cached.nodes = nodes
			}
			else if (cached.valueOf() !== data.valueOf() || shouldReattach === true) {
				nodes = cached.nodes;
				if (!editable || editable !== $document.activeElement) {
					if (data.$trusted) {
						clear(nodes, cached);
						nodes = injectHTML(parentElement, index, data)
					}
					else {
						//corner case: replacing the nodeValue of a text node that is a child of a textarea/contenteditable doesn't work
						//we need to update the value property of the parent textarea or the innerHTML of the contenteditable element instead
						if (parentTag === "textarea") parentElement.value = data;
						else if (editable) editable.innerHTML = data;
						else {
							if (nodes[0].nodeType === 1 || nodes.length > 1) { //was a trusted string
								clear(cached.nodes, cached);
								nodes = [$document.createTextNode(data)]
							}
							parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null);
							nodes[0].nodeValue = data
						}
					}
				}
				cached = new data.constructor(data);
				cached.nodes = nodes
			}
			else cached.nodes.intact = true
		}

		return cached
	}
	function sortChanges(a, b) {return a.action - b.action || a.index - b.index}
	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) {
			var dataAttr = dataAttrs[attrName];
			var cachedAttr = cachedAttrs[attrName];
			if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
				cachedAttrs[attrName] = dataAttr;
				try {
					//`config` isn't a real attributes, so ignore it
					if (attrName === "config" || attrName == "key") continue;
					//hook event handlers to the auto-redrawing system
					else if (typeof dataAttr === FUNCTION && attrName.indexOf("on") === 0) {
						node[attrName] = autoredraw(dataAttr, node)
					}
					//handle `style: {...}`
					else if (attrName === "style" && dataAttr != null && type.call(dataAttr) === OBJECT) {
						for (var rule in dataAttr) {
							if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) node.style[rule] = dataAttr[rule]
						}
						for (var rule in cachedAttr) {
							if (!(rule in dataAttr)) node.style[rule] = ""
						}
					}
					//handle SVG
					else if (namespace != null) {
						if (attrName === "href") node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr);
						else if (attrName === "className") node.setAttribute("class", dataAttr);
						else node.setAttribute(attrName, dataAttr)
					}
					//handle cases that are properties (but ignore cases where we should use setAttribute instead)
					//- list and form are typically used as strings, but are DOM element references in js
					//- when using CSS selectors (e.g. `m("[style='']")`), style is used as a string, but it's an object in js
					else if (attrName in node && !(attrName === "list" || attrName === "style" || attrName === "form" || attrName === "type" || attrName === "width" || attrName === "height")) {
						//#348 don't set the value if not needed otherwise cursor placement breaks in Chrome
						if (tag !== "input" || node[attrName] !== dataAttr) node[attrName] = dataAttr
					}
					else node.setAttribute(attrName, dataAttr)
				}
				catch (e) {
					//swallow IE's invalid argument errors to mimic HTML's fallback-to-doing-nothing-on-invalid-attributes behavior
					if (e.message.indexOf("Invalid argument") < 0) throw e
				}
			}
			//#348 dataAttr may not be a string, so use loose comparison (double equal) instead of strict (triple equal)
			else if (attrName === "value" && tag === "input" && node.value != dataAttr) {
				node.value = dataAttr
			}
		}
		return cachedAttrs
	}
	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {nodes[i].parentNode.removeChild(nodes[i])}
				catch (e) {} //ignore if this fails due to order of events (see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
				cached = [].concat(cached);
				if (cached[i]) unload(cached[i])
			}
		}
		if (nodes.length != 0) nodes.length = 0
	}
	function unload(cached) {
		if (cached.configContext && typeof cached.configContext.onunload === FUNCTION) {
			cached.configContext.onunload();
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			for (var i = 0, controller; controller = cached.controllers[i]; i++) {
				if (typeof controller.onunload === FUNCTION) controller.onunload({preventDefault: noop});
			}
		}
		if (cached.children) {
			if (type.call(cached.children) === ARRAY) {
				for (var i = 0, child; child = cached.children[i]; i++) unload(child)
			}
			else if (cached.children.tag) unload(cached.children)
		}
	}
	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index];
		if (nextSibling) {
			var isElement = nextSibling.nodeType != 1;
			var placeholder = $document.createElement("span");
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling || null);
				placeholder.insertAdjacentHTML("beforebegin", data);
				parentElement.removeChild(placeholder)
			}
			else nextSibling.insertAdjacentHTML("beforebegin", data)
		}
		else parentElement.insertAdjacentHTML("beforeend", data);
		var nodes = [];
		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index]);
			index++
		}
		return nodes
	}
	function autoredraw(callback, object) {
		return function(e) {
			e = e || event;
			m.redraw.strategy("diff");
			m.startComputation();
			try {return callback.call(object, e)}
			finally {
				endFirstComputation()
			}
		}
	}

	var html;
	var documentNode = {
		appendChild: function(node) {
			if (html === undefined) html = $document.createElement("html");
			if ($document.documentElement && $document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			}
			else $document.appendChild(node);
			this.childNodes = $document.childNodes
		},
		insertBefore: function(node) {
			this.appendChild(node)
		},
		childNodes: []
	};
	var nodeCache = [], cellCache = {};
	m.render = function(root, cell, forceRecreation) {
		var configs = [];
		if (!root) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");
		var id = getCellCacheKey(root);
		var isDocumentRoot = root === $document;
		var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
		if (isDocumentRoot && cell.tag != "html") cell = {tag: "html", attrs: {}, children: cell};
		if (cellCache[id] === undefined) clear(node.childNodes);
		if (forceRecreation === true) reset(root);
		cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs);
		for (var i = 0, len = configs.length; i < len; i++) configs[i]()
	};
	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element);
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function(value) {
		value = new String(value);
		value.$trusted = true;
		return value
	};

	function gettersetter(store) {
		var prop = function() {
			if (arguments.length) store = arguments[0];
			return store
		};

		prop.toJSON = function() {
			return store
		};

		return prop
	}

	m.prop = function (store) {
		//note: using non-strict equality check here because we're checking if store is null OR undefined
		if (((store != null && type.call(store) === OBJECT) || typeof store === FUNCTION) && typeof store.then === FUNCTION) {
			return propify(store)
		}

		return gettersetter(store)
	};

	var roots = [], components = [], controllers = [], lastRedrawId = null, lastRedrawCallTime = 0, computePreRedrawHook = null, computePostRedrawHook = null, prevented = false, topComponent, unloaders = [];
	var FRAME_BUDGET = 16; //60 frames per second = 1 call per 16 ms
	function parameterize(component, args) {
		var controller = function() {
			return (component.controller || noop).apply(this, args) || this
		}
		var view = function(ctrl) {
			if (arguments.length > 1) args = args.concat([].slice.call(arguments, 1))
			return component.view.apply(component, args ? [ctrl].concat(args) : [ctrl])
		}
		view.$original = component.view
		var output = {controller: controller, view: view}
		if (args[0] && args[0].key != null) output.attrs = {key: args[0].key}
		return output
	}
	m.component = function(component) {
		return parameterize(component, [].slice.call(arguments, 1))
	}
	m.mount = m.module = function(root, component) {
		if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
		var index = roots.indexOf(root);
		if (index < 0) index = roots.length;
		
		var isPrevented = false;
		var event = {preventDefault: function() {
			isPrevented = true;
			computePreRedrawHook = computePostRedrawHook = null;
		}};
		for (var i = 0, unloader; unloader = unloaders[i]; i++) {
			unloader.handler.call(unloader.controller, event)
			unloader.controller.onunload = null
		}
		if (isPrevented) {
			for (var i = 0, unloader; unloader = unloaders[i]; i++) unloader.controller.onunload = unloader.handler
		}
		else unloaders = []
		
		if (controllers[index] && typeof controllers[index].onunload === FUNCTION) {
			controllers[index].onunload(event)
		}
		
		if (!isPrevented) {
			m.redraw.strategy("all");
			m.startComputation();
			roots[index] = root;
			if (arguments.length > 2) component = subcomponent(component, [].slice.call(arguments, 2))
			var currentComponent = topComponent = component = component || {controller: function() {}};
			var constructor = component.controller || noop
			var controller = new constructor;
			//controllers may call m.mount recursively (via m.route redirects, for example)
			//this conditional ensures only the last recursive m.mount call is applied
			if (currentComponent === topComponent) {
				controllers[index] = controller;
				components[index] = component
			}
			endFirstComputation();
			return controllers[index]
		}
	};
	var redrawing = false
	m.redraw = function(force) {
		if (redrawing) return
		redrawing = true
		//lastRedrawId is a positive number if a second redraw is requested before the next animation frame
		//lastRedrawID is null if it's the first redraw and not an event handler
		if (lastRedrawId && force !== true) {
			//when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame, otherwise keep currently scheduled timeout
			//when rAF: always reschedule redraw
			if ($requestAnimationFrame === window.requestAnimationFrame || new Date - lastRedrawCallTime > FRAME_BUDGET) {
				if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
				lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
			}
		}
		else {
			redraw();
			lastRedrawId = $requestAnimationFrame(function() {lastRedrawId = null}, FRAME_BUDGET)
		}
		redrawing = false
	};
	m.redraw.strategy = m.prop();
	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}
		for (var i = 0, root; root = roots[i]; i++) {
			if (controllers[i]) {
				var args = components[i].controller && components[i].controller.$$args ? [controllers[i]].concat(components[i].controller.$$args) : [controllers[i]]
				m.render(root, components[i].view ? components[i].view(controllers[i], args) : "")
			}
		}
		//after rendering within a routed context, we need to scroll back to the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook();
			computePostRedrawHook = null
		}
		lastRedrawId = null;
		lastRedrawCallTime = new Date;
		m.redraw.strategy("diff")
	}

	var pendingRequests = 0;
	m.startComputation = function() {pendingRequests++};
	m.endComputation = function() {
		pendingRequests = Math.max(pendingRequests - 1, 0);
		if (pendingRequests === 0) m.redraw()
	};
	var endFirstComputation = function() {
		if (m.redraw.strategy() == "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		}
		else m.endComputation();
	}

	m.withAttr = function(prop, withAttrCallback) {
		return function(e) {
			e = e || event;
			var currentTarget = e.currentTarget || this;
			withAttrCallback(prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop))
		}
	};

	//routing
	var modes = {pathname: "", hash: "#", search: "?"};
	var redirect = noop, routeParams, currentRoute, isDefaultRoute = false;
	m.route = function() {
		//m.route()
		if (arguments.length === 0) return currentRoute;
		//m.route(el, defaultRoute, routes)
		else if (arguments.length === 3 && type.call(arguments[1]) === STRING) {
			var root = arguments[0], defaultRoute = arguments[1], router = arguments[2];
			redirect = function(source) {
				var path = currentRoute = normalizeRoute(source);
				if (!routeByValue(root, router, path)) {
					if (isDefaultRoute) throw new Error("Ensure the default route matches one of the routes defined in m.route")
					isDefaultRoute = true
					m.route(defaultRoute, true)
					isDefaultRoute = false
				}
			};
			var listener = m.route.mode === "hash" ? "onhashchange" : "onpopstate";
			window[listener] = function() {
				var path = $location[m.route.mode]
				if (m.route.mode === "pathname") path += $location.search
				if (currentRoute != normalizeRoute(path)) {
					redirect(path)
				}
			};
			computePreRedrawHook = setScroll;
			window[listener]()
		}
		//config: m.route
		else if (arguments[0].addEventListener || arguments[0].attachEvent) {
			var element = arguments[0];
			var isInitialized = arguments[1];
			var context = arguments[2];
			var vdom = arguments[3];
			element.href = (m.route.mode !== 'pathname' ? $location.pathname : '') + modes[m.route.mode] + vdom.attrs.href;
			if (element.addEventListener) {
				element.removeEventListener("click", routeUnobtrusive);
				element.addEventListener("click", routeUnobtrusive)
			}
			else {
				element.detachEvent("onclick", routeUnobtrusive);
				element.attachEvent("onclick", routeUnobtrusive)
			}
		}
		//m.route(route, params, shouldReplaceHistoryEntry)
		else if (type.call(arguments[0]) === STRING) {
			var oldRoute = currentRoute;
			currentRoute = arguments[0];
			var args = arguments[1] || {}
			var queryIndex = currentRoute.indexOf("?")
			var params = queryIndex > -1 ? parseQueryString(currentRoute.slice(queryIndex + 1)) : {}
			for (var i in args) params[i] = args[i]
			var querystring = buildQueryString(params)
			var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute
			if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

			var shouldReplaceHistoryEntry = (arguments.length === 3 ? arguments[2] : arguments[1]) === true || oldRoute === arguments[0];

			if (window.history.pushState) {
				computePreRedrawHook = setScroll
				computePostRedrawHook = function() {
					window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, $document.title, modes[m.route.mode] + currentRoute);
				};
				redirect(modes[m.route.mode] + currentRoute)
			}
			else {
				$location[m.route.mode] = currentRoute
				redirect(modes[m.route.mode] + currentRoute)
			}
		}
	};
	m.route.param = function(key) {
		if (!routeParams) throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()")
		return routeParams[key]
	};
	m.route.mode = "search";
	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}
	function routeByValue(root, router, path) {
		routeParams = {};

		var queryStart = path.indexOf("?");
		if (queryStart !== -1) {
			routeParams = parseQueryString(path.substr(queryStart + 1, path.length));
			path = path.substr(0, queryStart)
		}

		// Get all routes and check if there's
		// an exact match for the current path
		var keys = Object.keys(router);
		var index = keys.indexOf(path);
		if(index !== -1){
			m.mount(root, router[keys [index]]);
			return true;
		}

		for (var route in router) {
			if (route === path) {
				m.mount(root, router[route]);
				return true
			}

			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

			if (matcher.test(path)) {
				path.replace(matcher, function() {
					var keys = route.match(/:[^\/]+/g) || [];
					var values = [].slice.call(arguments, 1, -2);
					for (var i = 0, len = keys.length; i < len; i++) routeParams[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
					m.mount(root, router[route])
				});
				return true
			}
		}
	}
	function routeUnobtrusive(e) {
		e = e || event;
		if (e.ctrlKey || e.metaKey || e.which === 2) return;
		if (e.preventDefault) e.preventDefault();
		else e.returnValue = false;
		var currentTarget = e.currentTarget || e.srcElement;
		var args = m.route.mode === "pathname" && currentTarget.search ? parseQueryString(currentTarget.search.slice(1)) : {};
		while (currentTarget && currentTarget.nodeName.toUpperCase() != "A") currentTarget = currentTarget.parentNode
		m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length), args)
	}
	function setScroll() {
		if (m.route.mode != "hash" && $location.hash) $location.hash = $location.hash;
		else window.scrollTo(0, 0)
	}
	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []
		for (var prop in object) {
			var key = prefix ? prefix + "[" + prop + "]" : prop
			var value = object[prop]
			var valueType = type.call(value)
			var pair = (value === null) ? encodeURIComponent(key) :
				valueType === OBJECT ? buildQueryString(value, key) :
				valueType === ARRAY ? value.reduce(function(memo, item) {
					if (!duplicates[key]) duplicates[key] = {}
					if (!duplicates[key][item]) {
						duplicates[key][item] = true
						return memo.concat(encodeURIComponent(key) + "=" + encodeURIComponent(item))
					}
					return memo
				}, []).join("&") :
				encodeURIComponent(key) + "=" + encodeURIComponent(value)
			if (value !== undefined) str.push(pair)
		}
		return str.join("&")
	}
	function parseQueryString(str) {
		if (str.charAt(0) === "?") str = str.substring(1);
		
		var pairs = str.split("&"), params = {};
		for (var i = 0, len = pairs.length; i < len; i++) {
			var pair = pairs[i].split("=");
			var key = decodeURIComponent(pair[0])
			var value = pair.length == 2 ? decodeURIComponent(pair[1]) : null
			if (params[key] != null) {
				if (type.call(params[key]) !== ARRAY) params[key] = [params[key]]
				params[key].push(value)
			}
			else params[key] = value
		}
		return params
	}
	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString
	
	function reset(root) {
		var cacheKey = getCellCacheKey(root);
		clear(root.childNodes, cellCache[cacheKey]);
		cellCache[cacheKey] = undefined
	}

	m.deferred = function () {
		var deferred = new Deferred();
		deferred.promise = propify(deferred.promise);
		return deferred
	};
	function propify(promise, initialValue) {
		var prop = m.prop(initialValue);
		promise.then(prop);
		prop.then = function(resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		};
		return prop
	}
	//Promiz.mithril.js | Zolmeister | MIT
	//a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
	//1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
	//2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
	function Deferred(successCallback, failureCallback) {
		var RESOLVING = 1, REJECTING = 2, RESOLVED = 3, REJECTED = 4;
		var self = this, state = 0, promiseValue = 0, next = [];

		self["promise"] = {};

		self["resolve"] = function(value) {
			if (!state) {
				promiseValue = value;
				state = RESOLVING;

				fire()
			}
			return this
		};

		self["reject"] = function(value) {
			if (!state) {
				promiseValue = value;
				state = REJECTING;

				fire()
			}
			return this
		};

		self.promise["then"] = function(successCallback, failureCallback) {
			var deferred = new Deferred(successCallback, failureCallback);
			if (state === RESOLVED) {
				deferred.resolve(promiseValue)
			}
			else if (state === REJECTED) {
				deferred.reject(promiseValue)
			}
			else {
				next.push(deferred)
			}
			return deferred.promise
		};

		function finish(type) {
			state = type || REJECTED;
			next.map(function(deferred) {
				state === RESOLVED && deferred.resolve(promiseValue) || deferred.reject(promiseValue)
			})
		}

		function thennable(then, successCallback, failureCallback, notThennableCallback) {
			if (((promiseValue != null && type.call(promiseValue) === OBJECT) || typeof promiseValue === FUNCTION) && typeof then === FUNCTION) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0;
					then.call(promiseValue, function(value) {
						if (count++) return;
						promiseValue = value;
						successCallback()
					}, function (value) {
						if (count++) return;
						promiseValue = value;
						failureCallback()
					})
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					failureCallback()
				}
			} else {
				notThennableCallback()
			}
		}

		function fire() {
			// check if it's a thenable
			var then;
			try {
				then = promiseValue && promiseValue.then
			}
			catch (e) {
				m.deferred.onerror(e);
				promiseValue = e;
				state = REJECTING;
				return fire()
			}
			thennable(then, function() {
				state = RESOLVING;
				fire()
			}, function() {
				state = REJECTING;
				fire()
			}, function() {
				try {
					if (state === RESOLVING && typeof successCallback === FUNCTION) {
						promiseValue = successCallback(promiseValue)
					}
					else if (state === REJECTING && typeof failureCallback === "function") {
						promiseValue = failureCallback(promiseValue);
						state = RESOLVING
					}
				}
				catch (e) {
					m.deferred.onerror(e);
					promiseValue = e;
					return finish()
				}

				if (promiseValue === self) {
					promiseValue = TypeError();
					finish()
				}
				else {
					thennable(then, function () {
						finish(RESOLVED)
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED)
					})
				}
			})
		}
	}
	m.deferred.onerror = function(e) {
		if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) throw e
	};

	m.sync = function(args) {
		var method = "resolve";
		function synchronizer(pos, resolved) {
			return function(value) {
				results[pos] = value;
				if (!resolved) method = "reject";
				if (--outstanding === 0) {
					deferred.promise(results);
					deferred[method](results)
				}
				return value
			}
		}

		var deferred = m.deferred();
		var outstanding = args.length;
		var results = new Array(outstanding);
		if (args.length > 0) {
			for (var i = 0; i < args.length; i++) {
				args[i].then(synchronizer(i, true), synchronizer(i, false))
			}
		}
		else deferred.resolve([]);

		return deferred.promise
	};
	function identity(value) {return value}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36);
			var script = $document.createElement("script");

			window[callbackKey] = function(resp) {
				script.parentNode.removeChild(script);
				options.onload({
					type: "load",
					target: {
						responseText: resp
					}
				});
				window[callbackKey] = undefined
			};

			script.onerror = function(e) {
				script.parentNode.removeChild(script);

				options.onerror({
					type: "error",
					target: {
						status: 500,
						responseText: JSON.stringify({error: "Error making jsonp request"})
					}
				});
				window[callbackKey] = undefined;

				return false
			};

			script.onload = function(e) {
				return false
			};

			script.src = options.url
				+ (options.url.indexOf("?") > 0 ? "&" : "?")
				+ (options.callbackKey ? options.callbackKey : "callback")
				+ "=" + callbackKey
				+ "&" + buildQueryString(options.data || {});
			$document.body.appendChild(script)
		}
		else {
			var xhr = new window.XMLHttpRequest;
			xhr.open(options.method, options.url, true, options.user, options.password);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
					else options.onerror({type: "error", target: xhr})
				}
			};
			if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
			}
			if (options.deserialize === JSON.parse) {
				xhr.setRequestHeader("Accept", "application/json, text/*");
			}
			if (typeof options.config === FUNCTION) {
				var maybeXhr = options.config(xhr, options);
				if (maybeXhr != null) xhr = maybeXhr
			}

			var data = options.method === "GET" || !options.data ? "" : options.data
			if (data && (type.call(data) != STRING && data.constructor != window.FormData)) {
				throw "Request data should be either be a string or FormData. Check the `serialize` option in `m.request`";
			}
			xhr.send(data);
			return xhr
		}
	}
	function bindData(xhrOptions, data, serialize) {
		if (xhrOptions.method === "GET" && xhrOptions.dataType != "jsonp") {
			var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
			var querystring = buildQueryString(data);
			xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "")
		}
		else xhrOptions.data = serialize(data);
		return xhrOptions
	}
	function parameterizeUrl(url, data) {
		var tokens = url.match(/:[a-z]\w+/gi);
		if (tokens && data) {
			for (var i = 0; i < tokens.length; i++) {
				var key = tokens[i].slice(1);
				url = url.replace(tokens[i], data[key]);
				delete data[key]
			}
		}
		return url
	}

	m.request = function(xhrOptions) {
		if (xhrOptions.background !== true) m.startComputation();
		var deferred = new Deferred();
		var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp";
		var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
		var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
		var extract = isJSONP ? function(jsonp) {return jsonp.responseText} : xhrOptions.extract || function(xhr) {
			return xhr.responseText.length === 0 && deserialize === JSON.parse ? null : xhr.responseText
		};
		xhrOptions.method = (xhrOptions.method || 'GET').toUpperCase();
		xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
		xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
		xhrOptions.onload = xhrOptions.onerror = function(e) {
			try {
				e = e || event;
				var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
				var response = unwrap(deserialize(extract(e.target, xhrOptions)), e.target);
				if (e.type === "load") {
					if (type.call(response) === ARRAY && xhrOptions.type) {
						for (var i = 0; i < response.length; i++) response[i] = new xhrOptions.type(response[i])
					}
					else if (xhrOptions.type) response = new xhrOptions.type(response)
				}
				deferred[e.type === "load" ? "resolve" : "reject"](response)
			}
			catch (e) {
				m.deferred.onerror(e);
				deferred.reject(e)
			}
			if (xhrOptions.background !== true) m.endComputation()
		};
		ajax(xhrOptions);
		deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
		return deferred.promise
	};

	//testing API
	m.deps = function(mock) {
		initialize(window = mock || window);
		return window;
	};
	//for internal testing only, do not use `m.deps.factory`
	m.deps.factory = app;

	return m
})(typeof window != "undefined" ? window : {});

if (typeof module != "undefined" && module !== null && module.exports) module.exports = m;
else if (typeof define === "function" && define.amd) define(function() {return m});

},{}]},{},["/home/dcolgan/projects/walevssharc/app/main.coffee"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kY29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9tYWluLmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC9lbmdpbmUuY29mZmVlIiwiL2hvbWUvZGNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9ub2RlX21vZHVsZXMvYXBwL3RiYWVuZ2luZS9pbmRleC5jb2ZmZWUiLCIvaG9tZS9kY29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL25vZGVfbW9kdWxlcy9hcHAvdGJhZW5naW5lL3N5bm9ueW1zLmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC92aWV3LmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC93YWxldnNzaGFyYy5jb2ZmZWUiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxlQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsU0FBUixDQUFKLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSxZQUFSLENBRFQsQ0FBQTs7QUFBQSxJQUVBLEdBQU8sT0FBQSxDQUFRLFVBQVIsQ0FGUCxDQUFBOztBQUFBLENBS0MsQ0FBQyxLQUFGLENBQVEsUUFBUSxDQUFDLElBQWpCLEVBQXVCLElBQXZCLENBTEEsQ0FBQTs7Ozs7QUNBQSxJQUFBLHdCQUFBOztBQUFBLHdCQUFBLEdBQTJCLE9BQUEsQ0FBUSxlQUFSLENBQTNCLENBQUE7O0FBQUEsTUFDTSxDQUFDLE9BQVAsR0FBcUIsSUFBQSx3QkFBQSxDQUFBLENBRHJCLENBQUE7Ozs7O0FDQUEsSUFB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtID0gcmVxdWlyZSgnbWl0aHJpbCcpXG5lbmdpbmUgPSByZXF1aXJlKCdhcHAvZW5naW5lJylcbnZpZXcgPSByZXF1aXJlKCdhcHAvdmlldycpXG5cblxubS5tb3VudChkb2N1bWVudC5ib2R5LCB2aWV3KVxuIiwiVGV4dEJhc2VkQWR2ZW50dXJlRW5naW5lID0gcmVxdWlyZSgnYXBwL3RiYWVuZ2luZScpXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBUZXh0QmFzZWRBZHZlbnR1cmVFbmdpbmUoKVxuIiwic3lub255bURhdGEgPSByZXF1aXJlKCcuL3N5bm9ueW1zJylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVuZ2luZVxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAcm9vbXMgPSB7fVxuICAgICAgICBAdW5pdmVyc2FsQ29tbWFuZHMgPSAtPlxuICAgICAgICBAYWZ0ZXJDb21tYW5kID0gLT5cblxuICAgICAgICBAaW52ZW50b3J5ID0ge31cbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9ICcnXG4gICAgICAgIEBmbGFncyA9IHt9XG5cbiAgICAgICAgQGNvbW1hbmRXb3JkcyA9IFtdXG4gICAgICAgIEBtZXNzYWdlID0gJydcblxuICAgICAgICBAY2FsbGJhY2tzID0gW11cbiAgICAgICAgQHN0YXJ0Um9vbSA9ICcnXG5cbiAgICAgICAgQHdhaXRDYWxsYmFjayA9IG51bGxcblxuICAgIHNldFN0YXJ0Um9vbTogKHJvb21OYW1lKSAtPlxuICAgICAgICBAc3RhcnRSb29tID0gcm9vbU5hbWVcblxuICAgIHNldEFmdGVyQ29tbWFuZDogKGNhbGxiYWNrKSAtPlxuICAgICAgICBAYWZ0ZXJDb21tYW5kID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgc2F2ZTogLT5cbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0gJ3Byb2dyZXNzJywgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgaW52ZW50b3J5OiBAaW52ZW50b3J5XG4gICAgICAgICAgICBjdXJyZW50Um9vbU5hbWU6IEBjdXJyZW50Um9vbU5hbWVcbiAgICAgICAgfSlcblxuICAgIGxvYWQ6IC0+XG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Byb2dyZXNzJykpXG4gICAgICAgICAgICBAaW52ZW50b3J5ID0gZGF0YS5pbnZlbnRvcnlcbiAgICAgICAgICAgIEBjdXJyZW50Um9vbU5hbWUgPSBkYXRhLmN1cnJlbnRSb29tTmFtZVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcblxuICAgIGFkZFJvb206IChyb29tTmFtZSwgY2FsbGJhY2spIC0+XG4gICAgICAgIEByb29tc1tyb29tTmFtZV0gPSBjYWxsYmFjay5iaW5kKEApXG5cbiAgICBnZXRDdXJyZW50Um9vbU5hbWU6IC0+IEBjdXJyZW50Um9vbU5hbWVcblxuICAgIGdldEN1cnJlbnRNZXNzYWdlOiAtPiBAbWVzc2FnZVxuXG4gICAgZ2V0SW52ZW50b3J5OiAtPiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KEBpbnZlbnRvcnkpKVxuXG4gICAgZG9Db21tYW5kOiAoY29tbWFuZFRleHQpIC0+XG4gICAgICAgIGlmIEB3YWl0Q2FsbGJhY2s/XG4gICAgICAgICAgICBjYWxsYmFjayA9IEB3YWl0Q2FsbGJhY2tcbiAgICAgICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBudWxsXG4gICAgICAgICAgICBjYWxsYmFjaygpXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAjIGNsZWFuIHVwIHRoZSBjb21tYW5kIHRleHRcbiAgICAgICAgY29tbWFuZFRleHQgPSBjb21tYW5kVGV4dFxuICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXFcrL2csICcgJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHN7Mix9L2csICcgJylcblxuICAgICAgICAjIGZpbmQgc3lub255bXMgYW5kIHJlcGxhY2UgdGhlbSB3aXRoIHRoZSBjYW5vbmljYWwgd29yZFxuICAgICAgICBmb3IgY2Fubm9uaWNhbFdvcmQsIHN5bm9ueW1zIG9mIHN5bm9ueW1EYXRhXG4gICAgICAgICAgICBmb3Igc3lub255bSBpbiBzeW5vbnltc1xuICAgICAgICAgICAgICAgIGNvbW1hbmRUZXh0ID0gY29tbWFuZFRleHQucmVwbGFjZShzeW5vbnltLCBjYW5ub25pY2FsV29yZClcblxuICAgICAgICBAY29tbWFuZFdvcmRzID0gY29tbWFuZFRleHQuc3BsaXQoJyAnKVxuXG4gICAgICAgIEByb29tc1tAY3VycmVudFJvb21OYW1lXSgpXG4gICAgICAgIEBhZnRlckNvbW1hbmQoKVxuXG4gICAgc2V0VW5pdmVyc2FsQ29tbWFuZHM6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQHVuaXZlcnNhbENvbW1hbmRzID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgdHJ5VW5pdmVyc2FsQ29tbWFuZHM6IC0+XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBtYXRjaGVzOiAocGF0dGVybikgLT5cbiAgICAgICAgIyBJZiBlYWNoIHdvcmQgaW4gdGhlIHNwZWMgY29tbWFuZCBpcyBmb3VuZFxuICAgICAgICAjIGFueXdoZXJlIGluIHRoZSB1c2VyJ3MgaW5wdXQgaXQncyBhIG1hdGNoXG4gICAgICAgIHBhdHRlcm5Xb3JkcyA9IHBhdHRlcm4uc3BsaXQoJyAnKVxuICAgICAgICBmb3IgcGF0dGVybldvcmQgaW4gcGF0dGVybldvcmRzXG4gICAgICAgICAgICBpZiBub3QgKHBhdHRlcm5Xb3JkIGluIEBjb21tYW5kV29yZHMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBoYXNJdGVtOiAoaXRlbSkgLT4gaXRlbSBvZiBAaW52ZW50b3J5XG4gICAgdXNlZEl0ZW06IChpdGVtKSAtPiBpdGVtIG9mIEBpbnZlbnRvcnkgYW5kIEBpbnZlbnRvcnlbaXRlbV0gPT0gJ3VzZWQnXG5cbiAgICBwZXJjZW50Q2hhbmNlOiAoY2hhbmNlKSAtPiBNYXRoLnJhbmRvbSgpIDwgY2hhbmNlIC8gMTAwXG5cbiAgICBmbGFnSXM6IChmbGFnTmFtZSwgdmFsdWUpIC0+IEBmbGFnc1tmbGFnTmFtZV0gPT0gdmFsdWVcblxuICAgIHByaW50OiAodGV4dCkgLT5cbiAgICAgICAgQG1lc3NhZ2UgPSB0ZXh0XG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgZ29Ub1Jvb206IChyb29tTmFtZSkgLT5cbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9IHJvb21OYW1lXG4gICAgICAgIEBkb0NvbW1hbmQoJ2xvb2snKVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdvVG9TdGFydDogLT5cbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9IEBzdGFydFJvb21cbiAgICAgICAgQGRvQ29tbWFuZCgnbG9vaycpXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgc2V0RmxhZzogKGZsYWdOYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgQGZsYWdzW2ZsYWdOYW1lXSA9IHZhbHVlXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgZ2V0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIEBpbnZlbnRvcnlbaXRlbV0gPSAnZ290dGVuJ1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIHJlbW92ZUl0ZW06IChpdGVtKSAtPlxuICAgICAgICBkZWxldGUgQGludmVudG9yeVtpdGVtXVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIHVzZUl0ZW06IChpdGVtKSAtPlxuICAgICAgICBAaW52ZW50b3J5W2l0ZW1dID0gJ3VzZWQnXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgd2FpdDogKGNhbGxiYWNrKSAtPlxuICAgICAgICBAbWVzc2FnZSArPSAnIDxzdHJvbmc+KEhpdCBFbnRlcik8L3N0cm9uZz4nXG4gICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBjYWxsYmFja1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIGxpc3RlbjogKGNhbGxiYWNrKSAtPiBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cbiAgICBub3RpZnk6IC0+IGNhbGxiYWNrKCkgZm9yIGNhbGxiYWNrIGluIEBjYWxsYmFja3NcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgICBsb29rOiBbXG4gICAgICAgICdzZWUnXG4gICAgICAgICdhZG1pcmUnXG4gICAgICAgICdiZWhvbGQnXG4gICAgICAgICdnYXdrJ1xuICAgICAgICAnb2JzZXJ2ZSdcbiAgICAgICAgJ3NweSdcbiAgICBdXG4gICAgdGFrZTogW1xuICAgICAgICAncGljayB1cCdcbiAgICAgICAgJ2dldCdcbiAgICAgICAgJ2FjcXVpcmUnXG4gICAgICAgICdncmFiJ1xuICAgICAgICAnZ3Jhc3AnXG4gICAgICAgICdvYnRhaW4nXG4gICAgICAgICdidXknXG4gICAgICAgICdjaG9vc2UnXG4gICAgXVxuICAgIGdvOiBbXG4gICAgICAgICd3YWxrJ1xuICAgICAgICAncGVyYW1idWxhdGUnXG4gICAgICAgICdmbGVlJ1xuICAgICAgICAnbGVhdmUnXG4gICAgICAgICdtb3ZlJ1xuICAgICAgICAndHJhdmVsJ1xuICAgICAgICAnZGVwYXJ0J1xuICAgICAgICAnZGVjYW1wJ1xuICAgICAgICAnZXhpdCdcbiAgICAgICAgJ2pvdXJuZXknXG4gICAgICAgICdtb3NleSdcbiAgICAgICAgJ3dpdGhkcmF3J1xuICAgIF1cbiAgICBnaXZlOiBbXG4gICAgICAgICdkZWxpdmVyJ1xuICAgICAgICAnZG9uYXRlJ1xuICAgICAgICAnaGFuZCBvdmVyJ1xuICAgICAgICAncHJlc2VudCdcbiAgICAgICAgJ2VuZG93J1xuICAgICAgICAnYmVxdWVhdGgnXG4gICAgICAgICdiZXN0b3cnXG4gICAgICAgICdyZWxpbnF1aXNoJ1xuICAgIF1cbiAgICBnYXJkZW46IFtcbiAgICAgICAgJ3Bsb3QnXG4gICAgICAgICdwbGFudHMnXG4gICAgICAgICdwcm9kdWNlJ1xuICAgIF1cbiIsIm0gPSByZXF1aXJlKCdtaXRocmlsJylcbmVuZ2luZSA9IHJlcXVpcmUoJ2FwcC9lbmdpbmUnKVxuV2FsZVZzU2hhcmMgPSByZXF1aXJlKCdhcHAvd2FsZXZzc2hhcmMnKVxuXG5cblN0cmluZy5wcm90b3R5cGUuY2FwaXRhbGl6ZSA9IC0+XG4gICAgQFswXS50b1VwcGVyQ2FzZSgpICsgQFsxLi5dXG5cblxuY2xhc3MgVGV4dFR5cGVyXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBjdXJyZW50TWVzc2FnZSA9ICcnXG4gICAgICAgIEB0eXBlciA9IG51bGxcbiAgICAgICAgQG1ha2VUeXBlciA9ICh0ZXh0LCBzcGVlZD00KSAtPlxuICAgICAgICAgICAgaSA9IDBcbiAgICAgICAgICAgIHR5cGVMb29wID0gLT5cbiAgICAgICAgICAgICAgICBpKytcbiAgICAgICAgICAgICAgICBtLnJlZHJhdygpXG4gICAgICAgICAgICAgICAgaWYgaSA8IHRleHQubGVuZ3RoIC0gMVxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHR5cGVMb29wLCBzcGVlZClcbiAgICAgICAgICAgIHNldFRpbWVvdXQodHlwZUxvb3AsIHNwZWVkKVxuXG4gICAgICAgICAgICByZXR1cm4gLT5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGV4dFsuLmldXG4gICAgXG4gICAgcHJpbnQ6IChtZXNzYWdlKSAtPlxuICAgICAgICBpZiBtZXNzYWdlICE9IEBjdXJyZW50TWVzc2FnZVxuICAgICAgICAgICAgQGN1cnJlbnRNZXNzYWdlID0gbWVzc2FnZVxuICAgICAgICAgICAgQHR5cGVyID0gbmV3IEBtYWtlVHlwZXIobWVzc2FnZSlcbiAgICAgICAgICAgIG0ucmVkcmF3KClcblxuICAgIGdldFR5cGluZ01lc3NhZ2U6IC0+IGlmIEB0eXBlcj8gdGhlbiBAdHlwZXIoKSBlbHNlICcnXG5cbiAgICBnZXRDdXJyZW50TWVzc2FnZTogLT4gQGN1cnJlbnRNZXNzYWdlXG5cblxubW9kdWxlLmV4cG9ydHMgPVxuICAgIGNvbnRyb2xsZXI6IGNsYXNzXG4gICAgICAgIGNvbnN0cnVjdG9yOiAtPlxuXG4gICAgICAgICAgICBXYWxlVnNTaGFyYyhlbmdpbmUpXG4gICAgICAgICAgICBkaWRMb2FkID0gZW5naW5lLmxvYWQoKVxuXG4gICAgICAgICAgICBAdm0gPSB7fVxuICAgICAgICAgICAgQHZtLmNvbW1hbmQgPSBtLnByb3AoJycpXG4gICAgICAgICAgICBAdm0udHlwZXIgPSBuZXcgVGV4dFR5cGVyKClcblxuICAgICAgICAgICAgZW5naW5lLmxpc3RlbiA9PlxuICAgICAgICAgICAgICAgIEB2bS50eXBlci5wcmludChlbmdpbmUuZ2V0Q3VycmVudE1lc3NhZ2UoKSlcbiAgICAgICAgICAgICAgICBtLnJlZHJhdygpXG4gICAgICAgICAgICAgICAgZW5naW5lLnNhdmUoKVxuXG4gICAgICAgICAgICBpZiBkaWRMb2FkXG4gICAgICAgICAgICAgICAgZW5naW5lLmRvQ29tbWFuZCgnbG9vaycpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZW5naW5lLmdvVG9TdGFydCgpXG5cbiAgICAgICAgb25Db21tYW5kU3VibWl0OiAoZSkgPT5cbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgZW5naW5lLmRvQ29tbWFuZChAdm0uY29tbWFuZCgpKVxuICAgICAgICAgICAgQHZtLmNvbW1hbmQoJycpXG5cbiAgICB2aWV3OiAoY3RybCkgLT5cbiAgICAgICAgW1xuICAgICAgICAgICAgbSAnLnNpZGViYXInLFxuICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCArICdweCdcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcyNjBweCdcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzIwcHgnXG4gICAgICAgICAgICAgICAgbSAnaDInLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblRvcDogMFxuICAgICAgICAgICAgICAgICAgICAnSW52ZW50b3J5J1xuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgZm9yIGl0ZW1OYW1lLCBzdGF0ZSBvZiBlbmdpbmUuZ2V0SW52ZW50b3J5KClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHN0YXRlID09ICdnb3R0ZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAncCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1OYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHN0YXRlID09ICd1c2VkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbGluZS10aHJvdWdoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtTmFtZVxuICAgICAgICAgICAgICAgICAgICBtICdidXR0b24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljazogLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdTYXZlIGdhbWUgZGVsZXRlZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1Jlc3RhcnQgZ2FtZSdcbiAgICAgICAgICAgICAgICBdXG5cbiAgICAgICAgICAgIG0gJy5jb250ZW50JyxcbiAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICh3aW5kb3cuaW5uZXJXaWR0aCAtIDM2MCkgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcyMHB4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nVG9wOiAwXG4gICAgICAgICAgICAgICAgbSAnaDEnLCBlbmdpbmUuZ2V0Q3VycmVudFJvb21OYW1lKClcbiAgICAgICAgICAgICAgICBtICdwJywgbS50cnVzdChjdHJsLnZtLnR5cGVyLmdldFR5cGluZ01lc3NhZ2UoKSlcblxuICAgICAgICAgICAgICAgIG0gJ2Zvcm0nLFxuICAgICAgICAgICAgICAgICAgICBvbnN1Ym1pdDogY3RybC5vbkNvbW1hbmRTdWJtaXRcbiAgICAgICAgICAgICAgICAgICAgbSAnaW5wdXRbdHlwZT10ZXh0XScsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmNoYW5nZTogbS53aXRoQXR0cigndmFsdWUnLCBjdHJsLnZtLmNvbW1hbmQpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY3RybC52bS5jb21tYW5kKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzogKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IGlzSW5pdGlhbGl6ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpXG4gICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvblt0eXBlPXN1Ym1pdF0nLCAnRG8nXG4gICAgICAgIF1cbiIsIlwiXCJcIlxuQ29uZGl0aW9uczpcbiAgICBAbWF0Y2hlcyhwYXR0ZXJuKVxuICAgIEBoYXNJdGVtKGl0ZW0gbmFtZSlcbiAgICBAcGVyY2VudENoYW5jZShjaGFuY2Ugb3V0IG9mIDEwMClcbiAgICBAZmxhZ0lzKGZsYWcgbmFtZSwgdmFsdWUpXG5cblJlc3VsdHM6XG4gICAgQHByaW50KHRleHQpXG4gICAgQGdvVG9Sb29tKHJvb20gbmFtZSlcbiAgICBAc2V0RmxhZyhmbGFnIG5hbWUsIHZhbHVlKVxuXCJcIlwiXG5cbm1vZHVsZS5leHBvcnRzID0gKGVuZ2luZSkgLT5cblxuICAgIGVuZ2luZS5zZXRVbml2ZXJzYWxDb21tYW5kcyAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnZGllJylcbiAgICAgICAgICAgIEBwcmludCgnV2hhdCBhcmUgeW91IGRvaW5nPyBZb3UgYXJlIGRlYWQgbm93LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dpbicpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBkaWQgaXQuIFlvdSB3aW4uIEJ1eSB5b3Vyc2VsZiBhIHBpenphIGJlY2F1c2UgeW91IGFyZSBzbyBjbGV2ZXIuJylcblxuICAgIGVuZ2luZS5zZXRBZnRlckNvbW1hbmQgLT5cbiAgICAgICAgaWYgKG5vdCBAZmxhZ0lzKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdlZ2cnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnZmxvd2VycycpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdjYW4gb2Ygc29kYScpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdzb2RhIHN5cnVwJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ21hbmF0ZWUgbWlsaycpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdtYXJnYXJpbmUnKSlcbiAgICAgICAgICAgIEBwcmludCgnXCJXZWxsLCBJIHRoaW5rIEkgaGF2ZSBhbGwgdGhlIGluZ3JlZGllbnRzLFwiIHlvdSBzYXkgdG8geW91cnNlbGYuIFwiSSBqdXN0IG5lZWQgb25lIG9mIHRob3NlIHBsYWNlcyB3aGVyZSB5b3UgcHV0IHRoZW0gdG9nZXRoZXIgc28gaXQgdHVybnMgaW50byBzb21ldGhpbmcgeW91IGNhbiBlYXQuIFlvdSBrbm93LCBvbmUgb2YgdGhvc2UuLi5mb29kIHByZXBhcmluZyByb29tcy5cIicpXG4gICAgICAgICAgICBAc2V0RmxhZygnaGF2ZV9hbGxfaXRlbXMnLCB0cnVlKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnT2NlYW4nLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBmaW5kIHlvdXJzZWxmIGluIHRoZSBvY2Vhbi4gWW91IGFyZSBhIHNoYXJrIGJ5IHRoZSBuYW1lIG9mIFNoYXJjIGFuZCB5b3VyICQyMyBzaGFtcG9vIGlzIG1pc3NpbmcuIFlvdSBzdXNwZWN0IGZvdWwgcGxheS4gV2VsY29tZSB0byB0aGUgb2NlYW4sIGl0IGlzIGEgYmlnIGJsdWUgd2V0IHRoaW5nIGFuZCBhbHNvIHlvdXIgaG9tZS4gT2J2aW91cyBleGl0cyBhcmUgTm9ydGggdG8geW91ciBmcmllbmQgV2FsZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyBub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2FsZScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5LCBpdCBpcyB5b3VyIGZyaWVuZCwgV2FsZS4gSGUgaXMgZG9pbmcgdGhhdCB0aGluZyB3aGVyZSBoZSBoYXMgaGlzIGV5ZXMgY2xvc2VkIGFuZCBhY3RzIGxpa2UgaGUgZGlkIG5vdCBub3RpY2UgeW91ciBhcnJpdmFsLiBIZSBpcyBraW5kIG9mIGEgcHJpY2ssIGJ1dCBhbHNvIHlvdXIgZnJpZW5kLiBXaGF0IGNhbiB5b3UgZG8/IE9idmlvdXMgZXhpdHMgYXJlIE9jZWFuIHRvIHRoZSBzb3V0aCwgYSBzY2hvb2wgb2YgQ3V0dGxlZmlzaCB0byB0aGUgd2VzdCwgbW9yZSBPY2VhbiB0byB0aGUgbm9ydGgsIGFuZCBCaWxseSBPY2VhbiB0byB0aGUgZWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dpdmUgcGFuY2FrZXMnKVxuICAgICAgICAgICAgaWYgQGhhc0l0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSGV5IFdhbGUsXCIgeW91IGNhbGwgb3V0IGFzIGludHJ1c2l2ZWx5IGFzIHBvc3NpYmxlLCBcIkkgZ290IHlvdXItLVwiIEJlZm9yZSB5b3UgY291bGQgZmluaXNoIHlvdXIgc2VudGVuY2UsIHlvdXIgYmx1YmJlcnkgZnJpZW5kIGhhcyBzbmF0Y2hlZCB0aGUgcGxhdGUgYXdheSBhbmQsIGluIGEgbW9zdCB1bmRpZ25pZmllZCBtYW5uZXIsIGJlZ2lucyBtb3dpbmcgdGhyb3VnaCB0aGUgZnJpZWQgZGlzY3MgeW91IHNvIGFydGZ1bGx5IHByZXBhcmVkLiBcIlNvdWwgc2VhcmNoaW5nIHRha2VzIGEgbG90IG9mIGVuZXJneSxcIiBoZSBleHBsYWlucyBiZXR3ZWVuIGJpdGVzLiBcIkkgaGF2ZW5cXCd0IGVhdGVuIGFueXRoaW5nIGFsbCBkYXkuXCIgT25jZSBmaW5pc2hlZCwgV2FsZSBzdHJhaWdodGVucyBoaW1zZWxmIG91dCwgbG9va2luZyBhIG1pdGUgZW1iYXJyYXNzZWQgZm9yIHRoZSBzYXZhZ2UgZGlzcGxheSBoZSBqdXN0IHB1dCBvbi4gXCJXaGF0IHdhcyBpdCB5b3UgbmVlZGVkP1wiIFwiT2ggV2FsZSwgaXRcXCdzIHRlcnJpYmxlLiBJIHRoaW5rIG15ICQyMyBzaGFtcG9vIHdhcyBzdG9sZW4gYW5kIHRoZSBnaG9zdCBvZiBteSBub3QgcmVhbGx5IGRlYWQgZnJpZW5kIHNheXMgdGhlIGZhdGUgb2YgdGhlIHdvcmxkIGhhbmdzIGluIHRoZSBiYWxhbmNlLlwiIFwiSSBzZWUsXCIgc2F5cyBXYWxlLCBoaXMgdm9pY2UgYW5kIG1hbm5lciByZW1haW5pbmcgdW5jaGFuZ2VkIGRlc3BpdGUgdGhlIHRocmVhdCBvZiB0aGUgd29ybGQgdW5iYWxhbmNpbmcuIFwiU2hhcmMsIEkgZmVhciB0aGUgd29yc3QuIFlvdSBtdXN0IHN1bW1vbiB0aGUgZXRoZXJlYWwgZG9vci5cIiBcIk5vLCBXYWxlLFwiIHlvdSBzYXksIFwieW91IG1hZGUgbWUgc3dlYXIgYSB0aG91c2FuZCB2b3dzIG5ldmVyIHRvIGJyaW5nIHRoYXQgY3Vyc2VkIHJlbGljIGJhY2sgYW1vbmcgdXMuXCIgXCJJIGtub3cgd2hhdCBJIHNhaWQsIGJ1dCBJIGFsc28ga25ldyB0aGVyZSB3b3VsZCBjb21lIGEgdGltZSB3aGVuIHdlIHdvdWxkIGhhdmUgbm8gb3RoZXIgY2hvaWNlLlwiICBZb3Ugc2hvdWxkIHByb2JhYmx5IHN1bW1vbiB0aGUgZG9vci4nKVxuICAgICAgICAgICAgICAgIEByZW1vdmVJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICAgICAgQHNldEZsYWcoJ2dpdmVuX3BhbmNha2VzJywgdHJ1ZSlcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzdW1tb24gZG9vcicpIGFuZCBAZmxhZ0lzKCdnaXZlbl9wYW5jYWtlcycsIHRydWUpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSwgZmluYWxseSBjb252aW5jZWQgb2YgeW91ciB1cmdlbmN5IGFuZCB1dHRlciBkZXNwZXJhdGlvbiwgcGVyZm9ybSBzb21lIGludHJpY2F0ZSByaXRlcyBhbmQgaW5jYW50YXRpb25zIHRoYXQgd291bGQgYmUgcmVhbGx5IGNvb2wgaWYgeW91IGNvdWxkIHNlZSB0aGVtLCBidXQgSSBndWVzcyB5b3Ugd2lsbCBqdXN0IGhhdmUgdG8gdXNlIHlvdXIgaW1hZ2luYXRpb25zLiBUZXh0IG9ubHkgZm9vbHMhICBUaGUgZXRoZXJlYWwgZG9vciBzdGFuZHMgb3BlbiBiZWZvcmUgeW91LicpXG4gICAgICAgICAgICBAc2V0RmxhZygnc3VtbW9uZWRfZG9vcicsIHRydWUpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZW50ZXIgZG9vcicpIGFuZCBAZmxhZ0lzKCdzdW1tb25lZF9kb29yJywgdHJ1ZSlcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnVGhlIEV0aGVyZWFsIFJlYWxtJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrIHdhbGUnKVxuICAgICAgICAgICAgaWYgQGZsYWdJcygndGFsa2VkX3RvX3dhbGUnLCB0cnVlKVxuICAgICAgICAgICAgICAgIEBwcmludCgnKEdldCByZWFkeSB0byBkbyBzb21lIHJlYWRpbmcpIFdhbGUgaXMgdHJ5aW5nIHRvIG1lZGl0YXRlIG9yIHNvbWV0aGluZyBwcmV0ZW50aW91cyB0aGF0IHlvdSBkb25cXCd0IGNhcmUgYWJvdXQuIFlvdSBoYXZlIHNvbWV0aGluZyBpbXBvcnRhbnQhIFwiV2FsZVwiIHlvdSBzaG91dCwgXCJJIG5lZWQgeW91ciBoZWxwISBUaGUgY29uZGl0aW9uIG9mIG15IG1hZ25pZmljZW50IHNjYWxwIGlzIGF0IHN0YWtlLlwiIFdhbGUgc2lnaHMgYSBoZWF2eSwgbGFib3JlZCBzaWdoLiBcIlNoYXJjLCB5b3UgaGF2ZSBkaXN0dXJiZWQgbXkgam91cm5leSB0byBteSBpbm5lcm1vc3QgYmVpbmcuIEJlZm9yZSBJIGNhbiBoZWxwIHlvdSwgcmVwYXJhdGlvbnMgbXVzdCBiZSBtYWRlLiBQYW5jYWtlczogd2hvbGUgd2hlYXQsIHdpdGggYWxsIG5hdHVyYWwgbWFwbGUgc3lydXAuIE5vdyBsZWF2ZSBtZSBhcyBJIHBlZWwgYmFjayB0aGUgbGF5ZXJzIG9mIHRoZSBzZWxmIGFuZCBwb25kZXIgdGhlIGxlc3NvbiBvZiB0aGUgY2hlcnJ5IGJsb3Nzb20uJylcbiAgICAgICAgICAgICAgICBAc2V0RmxhZygndGFsa2VkX3RvX3dhbGUnLCB0cnVlKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJJIGNhbiBub3QgbGlmdCBhIGZpbiBmb3IgeW91IHVudGlsIHlvdSBoYXZlIGJyb3VnaHQgYSBoZWFsdGh5IHNlcnZpbmcgb2Ygd2hvbGUgd2hlYXQgcGFuY2FrZXMgd2l0aCBhbGwgbmF0dXJhbCBtYXBsZSBzeXJ1cCBsaWtlIEkgc2FpZCBiZWZvcmUuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIHNvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyBub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIHdlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0JpbGx5IE9jZWFuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dldHRlciBPY2VhbicsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBpcyBqdXN0IHNvbWUgb2NlYW4geW91IGZvdW5kLiBJdCBkb2VzIGZlZWwgYSBsaXR0bGUgYml0IHdldHRlciB0aGFuIHRoZSByZXN0IG9mIHRoZSBvY2VhbiB0aG91Z2guIEFsc28sIGRpZCBpdCBqdXN0IGdldCB3YXJtZXI/IE9idmlvdXMgZXhpdHMgYXJlIGEgZ2FyZGVuIHRvIHRoZSB3ZXN0LCBXYWxlIGluIHRoZSBzb3V0aCwgYW5kIGEgZ2FtZXNob3cgZWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIHNvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIHdlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdDdXR0bGVmaXNoJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdjdXR0bGVmaXNoJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0xvb2ssIHRoZXJlIGJlIHNvbWUgY3V0dGxlZmlzaCwgdGhvdWdoIHRoZXkgZG8gbm90IGxvb2sgdG9vIGN1ZGRseS4gU3RlYWsgYW5kIFNoYWtlIGlzIHRvIHRoZSB3ZXN0LCBBY2h0aXB1c1xcJ3MgZ2FyZGVuIHRvIHRoZSBub3J0aCwgYW5kIFdhbGUgdG8gdGhlIGVhc3QuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIHVzZWQgdG8gYmUgY3V0dGxlZmlzaCBoZXJlIGJ1dCB5b3Ugc2NhcmVkIHRoZW0gYXdheSB3aXRoIHlvdXIgYWdncmVzc2l2ZSBhZmZlY3Rpb25zLiBLZWVwIHRoYXQgc3R1ZmYgaW5zaWRlIG1hbiEnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjdWRkbGUgY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBmZWVsaW5nIGFmZmVjdGlvbmF0ZSB0b2RheSBhbmQgeW91IGp1c3QgZ290IGR1bXBlZCBzbyB3aHkgbm90PyBZb3UganVtcCBzb21lIG9mIHRoZSBjdXR0bGVmaXNoIGFuZCBzdGFydCBzbnVnZ2xpbmcgYW5kIGN1ZGRsaW5nLiBUaGUgY3V0dGxlZmlzaCBhcmUgbm90IGFtdXNlZCB0aG91Z2gsIGFuZCBzYXkgdGhleSBhcmUgdGlyZWQgb2YgZmlzaCBtYWtpbmcgdGhhdCBtaXN0YWtlLiBUaGV5IGFsbCBzd2ltIGF3YXkgZXhjZXB0IGZvciBvbmUgdGhhdCBoYXMgYXR0YWNoZWQgaXRzIHN1Y2tlcnMgdG8geW91ciBtaWQgcmVnaW9uLiBZb3UgZG9uXFwndCBzZWVtIHRvIG1pbmQuJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGV5IGFyZSBjdWRkbGVkIG91dC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIGVhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdCaWxseSBPY2VhbicsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PTlmMTZGd19LNDVzJywgJ19ibGFuaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1N1ZGRlbmx5LCBhcHBlYXJpbmcgYmVmb3JlIHlvdXIgZXllcyBpcyBzaW5nZXItc29uZ3dyaXRlciBhbmQgZm9ybWVyIENhcmliYmVhbiBraW5nOiBCaWxseSBPY2Vhbi4gQWxzbyBCaWxseSBPY2VhblxcJ3MgY2FyLiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIFdhbGUgYW5kIG5vcnRoIHRvIHNvbWUga2luZCBvZiBnYW1lIHNob3cuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0hlIHdhbnRzIHlvdSB0byBnZXQgaW50byBoaXMgY2FyIGFuZCBkcml2ZSBoaW0gdG8gdGhlIGhvc3BpdGFsLiBIZSBqdXN0IGRyb3ZlIHRocm91Z2ggdGhlIGNhciB3YXNoIHdpdGggdGhlIHRvcCBkb3duIGFmdGVyIGRyb3BwaW5nIHNvbWUgYWNpZC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdob3NwaXRhbCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1N1cmUsIHdoeSBub3Q/IFlvdSBnZXQgaW4gdGhlIGRyaXZlclxcJ3Mgc2VhdCBhbmQgZmluZCB5b3VyIHdheSB0byB0aGUgbmVhcmVzdCBtZWRpY2FsIHRyZWF0bWVudCBjZW50ZXIuIEFzIHRoYW5rcywgTXIuIE9jZWFuIHB1bGxzIGFuIGVnZyBvdXQgZnJvbSBoaXMgZ2xvdmUgYm94LiBZb3UgYWNjZXB0IGFuZCBzd2ltIGF3YXkgYXMgZmFzdCBhcyBwb3NzaWJsZS4gR29vZCwgSSByYW4gb3V0IG9mIGpva2VzIGZvciB0aGF0IGZhc3QuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdlZ2cnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjYWxsIGNvcHMnKVxuICAgICAgICAgICAgQHByaW50KCdUaGUgcG9saWNlIGNvbWUgYW5kIGFycmVzdCBCaWxseSBPY2VhbiBvbiBjaGFyZ2Ugb2YgYmVpbmcgY29tcGxldGVseSBpcnJlbGV2YW50IHRvIHRoaXMgZ2FtZS4gWW91IFdpbiEgSGlnaCBTY29yZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIHdlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnQWNodGlwdXNcXCdzIEdhcmRlbicsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rIGFjaHRpcHVzJylcbiAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIEFjaHRpcHVzLiBIZSBpcyBwdWxsaW5nIG91dCB0aGUgc2Vhd2VlZHMgZnJvbSBoaXMgc2VhIGN1Y3VtYmVyIGJlZC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGdhcmRlbicpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzZWUgd2F0ZXJtZWxvbiwgd2F0ZXIgY2hlc3RudXRzLCBhc3NvcnRlZCBmbG93ZXJzLCBzZWEgY3VjdW1iZXJzIGFuZCBzdHJhd2JlcnJpZXMuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0FjaHRpcHVzIGlzIHdvcmtpbmcgYW1vbmcgaGlzIGZsb3dlcnMgYW5kIHNocnVicy4gSGUgc2VlcyB5b3UgYW5kIG9wZW5zIHRoZSBnYXRlIGZvciB5b3UuIE9idmlvdXMgZXhpdHMgYXJlIG5vcnRoIHRvIFdhdGVyIFdvcmxkLCBlYXN0IHRvIHNvbWUgT2NlYW4gYW5kIHNvdXRoIHRvIGEgc2Nob29sIG9mIEN1dHRsZWZpc2guJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiVGhpcyBpcyBxdWl0ZSB0aGUgdW0uLi5vY2VhbiBoaWRlYXdheSB5b3UgaGF2ZSBoZXJlLFwiIHlvdSBzYXkuIFwiWWVzLFwiIGhlIHNheXMsIFwiSSBjYW4gc2VlIHlvdSBoYXZlIGNvbWUgYSBsb25nIHdheSB0byBnZXQgaGVyZSwgYnV0IEkgYW0gZ2xhZCB5b3UgaGF2ZSBmb3VuZCByZWZ1Z2Ugb24gbXkgZ3JvdW5kcy4gSWYgeW91IHNlZSBhbnl0aGluZyB5b3UgbGlrZSBpbiBteSBwbG90IHdlIGNvdWxkIG1ha2UgYSBkZWFsIHBlcmhhcHMuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2Ugd2F0ZXJtZWxvbicpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiSSB3aWxsIGdpdmUgeW91IHRoZSB3YXRlcm1lbG9uIGluIGV4Y2hhbmdlIGZvciBhbiBpY2UgY3JlYW0gc3VuZGFlLlwiJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBudXRzJykgb3IgQG1hdGNoZXMoJ3Rha2UgbnV0Jykgb3IgQG1hdGNoZXMoJ3Rha2UgY2hlc3RudXRzJykgb3IgQG1hdGNoZXMoJ3Rha2UgY2hlc3RudXQnKVxuICAgICAgICAgICAgQHByaW50KCdcIkkgd2lsbCBnaXZlIHlvdSBzb21lIHdhdGVyIGNoZXN0bnV0cyBpZiB5b3UgY2FuIGZpbmQgbWUgYSBwdXJlIGJyZWQgR2VybWFuIFNoZXBhcmQuXCInKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGN1Y3VtYmVyJykgb3IgQG1hdGNoZXMoJ3Rha2UgY3VjdW1iZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnXCJZb3UgY2FuIGhhdmUgdGhlIHNlYSBjdWN1bWJlcnMgaW4gZXhjaGFuZ2UgZm9yIGEgZnVsbCBwYXJkb24gZm9yIHRoZXNlIG1ham9yIGZlbG9ueSBjaGFyZ2VzIHRoYXQgYXJlIHN0aWxsIHBlbmRpbmcuXCInKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHN0cmF3YmVycmllcycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiT2gsIGFjdHVhbGx5IHRob3NlIHN0cmF3YmVycnkgZmllbGRzIGFyZW5cXCd0IGV2ZW4gcmVhbC5cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBmbG93ZXJzJykgb3IgQG1hdGNoZXMoJ3Rha2UgZmxvd2VyJylcbiAgICAgICAgICAgIGlmIG5vdCBAZmxhZ0lzKCdnaXZlbl91bWJyZWxsYScsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIkkgY2FuIHNlZSB5b3UgbGlrZSB0aGUgZmxvd2Vycy4gSSB3aWxsIGxldCB5b3UgaGF2ZSB0aGVtIGlmIHlvdSBjYW4gZmluZCBzb21ldGhpbmcgdG8ga2VlcCBpdCBmcm9tIGdldHRpbmcgc28gaG90IGhlcmUuIEkgd291bGQgYmUgYWJsZSB0byBkbyB0d2ljZSBhcyBtdWNoIHdvcmsgaWYgaXQgd2VyZSBhIGJpdCBjb29sZXIuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiWW91IGhhdmUgZ3JlYXQgdGFzdGUuIFRoZXNlIGZsb3dlcnMgYXJlIHJlYWxseSB2ZXJzYXRpbGUgYW5kIHdpbGwgYmUgZ29vZCBqdXN0IGFib3V0IGFueXdoZXJlLlwiJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnZmxvd2VycycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ2l2ZSB1bWJyZWxsYScpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiVGhpcyB3aWxsIGJlIHBlcmZlY3QgZm9yIGJsb2NraW5nIG91dCB0aGF0IHN1buKAmXMgaGFyc2ggcmF5cy4gVGhhbmtzIVwiJylcbiAgICAgICAgICAgIEBzZXRGbGFnKCdnaXZlbl91bWJyZWxsYScsIHRydWUpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCcpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIGVhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXZXR0ZXIgT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyBzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0N1dHRsZWZpc2gnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgcnVpbnMgb2YgeW91ciBvbGQgd29yayBwbGFjZS4gVGhpcyBwbGFjZSBoYXMgc2VlbiBiZXR0ZXIgZGF5cy4gWW91ciBtaW5kIGlzIGZsb29kZWQgd2l0aCBtZW1vcmllcyBvZiBmbG9hdGluZyBpbiBmcm9udCBvZiB0aGUgb2xkIGdyaWxsIGFuZCBjb21pbmcgdXAgd2l0aCBuZXcgcmVjaXBlcyB0byB0cnkgd2hlbiB5b3VyIG1hbmFnZXIgaGFkIGhpcyBiYWNrIHR1cm5lZC4gVGhlbiBzb21lb25lIHNhaWQgXCJFdmVyIHRyaWVkIGFuIE0tODAgYnVyZ2VyPyBJIGhhdmUgZW5vdWdoIGZvciBldmVyeW9uZS5cIiBUaGUgd29yZHMgZWNobyBpbiB5b3VyIG1pbmQgbGlrZSBhIHBoYW50b20gd2hpc3BlciBvZiBhZ2VzIHBhc3QuIEl0XFwncyB0aGUgcnVpbnMgb2YgdGhlIG9sZCBTdGVhayBhbmQgU2hha2UgeW91IHVzZWQgdG8gd29yayBhdCB1bnRpbCB5b3VyIGZyaWVuZCBibGV3IGl0IHVwLiBUaGUgdGF0dGVyZWQgcmVtbmFudHMgb2YgYSByZWQgYW5kIHdoaXRlIGF3bmluZyBmbHV0dGVycyBpbiB0aGUgd2luZCBhcyBpZiB0byBzdXJyZW5kZXIgdG8gYW4gZW5lbXkuIFdoYXQgaXMgbGVmdCBvZiBhIGRvb3IgaGFuZ3Mgb24gYSBzaW5nbGUgaGluZ2UgdG8gdGhlIHdlc3QuIEN1dHRsZWZpc2ggc3RvbXBpbmcgZ3JvdW5kcyBsaWUgZWFzdC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyB3ZXN0Jykgb3IgQG1hdGNoZXMoJ29wZW4gZG9vcicpIG9yIEBtYXRjaGVzKCdnbyBpbnNpZGUnKSBvciBAbWF0Y2hlcygnZ28gaW4nKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyBlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQ3V0dGxlZmlzaCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG4gICAgICAgICAgICBcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdBcyB5b3UgYXBwcm9hY2gsIHRoZSBkb29yIGZhbGxzIGNsZWFuIG9mZiBhcyBpZiB0byB3YXJuIHlvdSBhZ2FpbnN0IGVudHJ5LiBOZXZlciBiZWluZyBvbmUgZm9yIG9tZW5zLCB5b3UgaWdub3JlIGl0LiBJbnNpZGUgeW91IGRpc2NvdmVyIHRoaW5ncyBtdWNoIGFzIHlvdSByZW1lbWJlciB0aGVtLiBUaGF0IGlzLCBpZiB0aGV5IGhhZCBiZWVuIG1hdWxlZCBieSBhIGJlYXIgd2l0aCBibGVuZGVycyBmb3IgaGFuZHMgd2hvIHByb2NlZWRlZCB0byBzZXQgb2ZmIGEgc2VyaWVzIG9mIHBsYXN0aWMgZXhwbG9zaXZlcy4gVG8gdGhlIHNvdXRoIHRoZXJlIGFyZSBzb21lIHRhYmxlcyBhbmQgY2hhaXJzLCBub3J0aCBsaWVzIHRoZSBraXRjaGVuLCBhbmQgd2VzdCBhIHNvZGEgZm91bnRhaW4uIFRoZSBvdXRkb29ycyBpcyBlYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gc291dGgnKVxuICAgICAgICAgICAgI0Bnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEaW5pbmcgQXJlYSknKVxuICAgICAgICAgICAgQHByaW50KCdZb3VyIGlubmVyIGNvbXBhc3MgYmFya3MgbG91ZGx5IGF0IHlvdS4gXCJXaGF0IGNvdWxkIHBvc3NpYmx5IGJlIGludGVyZXN0aW5nIGluIHRoZSBkaW5pbmcgcm9vbT9cIiBZb3UgZGVjaWRlIHRvIHN0YXkgcHV0LiAoQWN0dWFsbHkgdGhlIHdyaXRlciBqdXN0IGRpZG5cXCd0IGdpdmUgbWUgYW55dGhpbmcgdG8gcHV0IGhlcmUuKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIG5vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIHdlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNvZGEgRm91bnRhaW4pJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnV2VsY29tZSB0byB0aGUga2l0Y2hlbi4gU2luY2UgdGhlIHdhbGxzIGhhdmUgYWxsIGJlZW4gYmxvd24gYXdheSBvciBkaXNzb2x2ZWQsIHRoZSBvbmx5IHRoaW5nIHRoYXQgc2VwYXJhdGVzIGl0IGZyb20gdGhlIHJlc3Qgb2YgdGhlIHBsYWNlIGlzIHRoZSBvdmVuIGFuZCByYW5nZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG92ZW4nKSBvciBAbWF0Y2hlcygnb3BlbiBvdmVuJylcbiAgICAgICAgICAgIEBwcmludCgnQ2hlY2sgaXQgb3V0LCBpdFxcJ3MgeW91ciBmYXZvcml0ZSBwb3AsIGEgQ2hlcnJ5IE9yYW5nZSBTbm96emJlcnJ5IExpbWUgUGFzc2lvbmZydWl0IFZhbmlsbGEgQ3JvYWsgaW4gdGhlIG92ZW4uIFdobyBldmVyIHRob3VnaHQgb2YgYmFraW5nIGEgY2FuIG9mIHNvZGE/JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjYW4gb2Ygc29kYScpXG5cbiAgICAgICAgZWxzZSBpZiBAZmxhZ0lzKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpXG4gICAgICAgICAgICBpZiBAbWF0Y2hlcygnbWFrZSBwYW5jYWtlcycpXG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnXCJXaGVyZSBkbyBJIHN0YXJ0P1wiIHlvdSB3b25kZXIgb3V0IGxvdWQuIElmIG9ubHkgdGhlcmUgd2VyZSB3cml0dGVuIHNlcmllcyBvZiBpbnN0cnVjdGlvbnMgZ3VpZGluZyB5b3UgdGhyb3VnaC4gV2hlcmUgd291bGQgeW91IGZpbmQgc29tZXRoaW5nIGxpa2UgdGhhdD8nKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdVxcJ3JlIHBvbmRlcmluZyB0aGlzIHdoZW4gYSBkcmFmdCBjb21lcyBvdmVyIHlvdS4gVGhlIGxpZ2h0cyBmbGlja2VyIG9uIGFuZCBvZmYuIFlvdSBzZW5zZSBhIG15c3RlcmlvdXMgcHJlc2VuY2UuIFRoZSBnaG9zdCBvZiB5b3VyIG9sZCBmcmllbmQgQ3JlZ2dsZXMgYXBwZWFycyBiZWZvcmUgeW91LiBBcHBhcmVudGx5IGhlIGlzIGhhdW50aW5nIHRoZSBTdGVhayBhbmQgU2hha2Ugbm93IGFuZCB5b3VcXCdyZSBhbGwgbGlrZSBcIkNyZWdnbGVzLCBkaWRuXFwndCB3ZSBqdXN0IGhhbmcgb3V0IHRoZSBvdGhlciBkYXk/IEhvdyBhcmUgeW91IGEgZ2hvc3QgYWxyZWFkeT9cIicpXG4gICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCc8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiTmV2ZXIgeW91IG1pbmQgdGhhdCBub3dcIjwvc3Bhbj4gaGUgc2F5cyBpbiBoaXMgY3JlZXB5IG5lcmQgdm9pY2UuIDxzcGFuIGNsYXNzPVwiY3JlZXB5XCI+XCJTaGFyYywgaWYgeW91IGhvcGUgdG8gc2F2ZSB0aGUgd29ybGQgZnJvbSBjZXJ0YWluIGRvb20sIHlvdSBtdXN0IHN1Y2NlZWQgaW4gbWFraW5nIHRoZXNlIHBhbmNha2VzLiBVc2UgdGhpcyBhbmNpZW50IHJlY2lwZSBoYW5kZWQgZG93biBmcm9tIHRoZSBhbmNpZW50cyB0byBhaWQgeW91LlwiPC9zcGFuPiBBbiBvbGQsIGJhdHRlcmVkIHBpZWNlIG9mIHBhcGVyIGZsb2F0cyBkb3duIGxhbmRpbmcgYmVmb3JlIHlvdSBcIlN3ZWV0IE1lZW1hd3MgU3dlZXR5IFN3ZWV0IEZsYXBqYWNrc1wiIGl0IHJlYWRzLiA8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiTm93IG15IHdvcmsgaXMgZG9uZSBhbmQgSSBjYW4gYXNjZW5kIHRvIG15IHN0ZXBtb21cXCdzIGhvdXNlIGZvciBncmlsbGVkIGNoZWVzZSBzYW5kd2ljaGVzIGFuZCBjaG9jb2xhdGUgbWlsay5cIjwvc3Bhbj4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdZb3UgcmVhZCB0aGUgcmVjaXBlLiBJdCBpcyBhbGwgaW4gcmlkZGxlcy4gWW91IGhvcGUgeW91IGFyZSB1cCB0byB0aGUgdGFzay4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBhbiBlbXB0eSBib3dsIHNpdHRpbmcgdGhlcmUpJylcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYW4gZW1wdHkgYm93bCBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnSW4gYW4gdXJuIHRha2UgYnV0IG5vdCBjaHVybiBpdGVtcyB0d28gbm90IGxpa2UgZ29vLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvZGEgZmxvd2VyJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdjYW4gb2Ygc29kYScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3VyIHBvdGlvbiBpcyBkcnkuIFRoaXMgd2lsbHN0IG5vdCBmbHkuIFdoYXRcXCdzIG5leHQgbXVzdCBiZSBkdW1wZWQsIHBvdXJlZCBhbmQgY3JhY2tlZCBmb3IgYSBwcm9wZXIgZmxhcGphY2suJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbWlsayBlZ2cgYnV0dGVyJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdlZ2cnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ21hbmF0ZWUgbWlsaycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQ3V0dGluZyBhbmQgc2Nvb3Bpbmcgc2hhbGwgaGF2ZSB0aGVpciBkYXksIGJ1dCBhIGZvciBhIGZpbmUgZmx1ZmZ5IGJhdHRlciB0aGVyZSBiZSBidXQgb25lIHdheS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzdGlyJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgbWl4ZWQgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIG1peGVkIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdTZXQgdGhlIGdyaWRkbGUgb3Igc3RvdmUgdG8gbWVkaXVtIGhlYXQuIEFmdGVyIGl0IGlzIHdhcm1lZCwgZHJvcCBiYXR0ZXIgYSBxdWFydGVyIGN1cCBhdCBhIHRpbWUgYW5kIHR1cm5pbmcgb25jZSBidWJibGVzIGFwcGVhci4gXCJXZWxsIHRoYXQgc2VlbXMgcHJldHR5IGNsZWFyLiBJIHRoaW5rIEkgY2FuIGRvIHRoYXQgb24gbXkgb3duLlwiJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggcGxhdGUgb2YgZHJ5IHBhbmNha2VzIHNpdHRpbmcgdGhlcmUpJylcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggcGxhdGUgb2YgZHJ5IHBhbmNha2VzIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUZW4gbWludXRlcyBsYXRlciB0aGUgcGFuY2FrZXMgYXJlIGZpbmlzaGVkLCBidXQgc29tZXRoaW5nIGlzIG1pc3NpbmcuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3lydXAnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3NvZGEgc3lydXAnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZ290IHBhbmNha2VzISAgSG90IGRhbmcuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNvZGEgRm91bnRhaW4pJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc2VlIHRoYXQgdGhlIHNvZGEgZm91bnRhaW4gaGFzIHNvbWVob3cgcmVtYWluZWQgbGFyZ2VseSB1bmRhbWFnZWQuIFlvdSB0aGluayBiYWNrIHRvIHRoZSBkYXlzIHdoZW4geW91IHdvdWxkIHNuZWFrIG91dCBiYWdzIG9mIHBsYWluIHN5cnVwIHRvIGRyaW5rIGFuZCB0aGUgZnJlYWtpc2ggd2FraW5nIGRyZWFtcyBpdCB3b3VsZCBpbmR1Y2UgaW4geW91LiBZb3Ugd29uZGVyIGlmIHRoZXJlIGlzIGFueSBzdGlsbCBpbiB0aGVyZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGZvdW50YWluJykgb3IgQG1hdGNoZXMoJ29wZW4gZm91bnRhaW4nKSBvciBAbWF0Y2hlcygnbG9vayBzb2RhJykgb3IgQG1hdGNoZXMoJ29wZW4gc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ0F2YXN0LCBhIGhpZGRlbiB0cmVhc3VyZSB0cm92ZSBvZiBzdWdhcnkgd29uZGVyIHRoYXQgaGFzIGxhaW4gZG9ybWFudCBhbGwgdGhlc2UgeWVhcnMhIFlvdSB0cmVtYmxlIGF0IHRoZSBiZWF1dHkgb2YgdGhlIHNpZ2h0IGJlZm9yZSB5b3UuIFNvIG1hbnkgYmFncyBhbmQgeWV0IHlvdXIgbWFnaWMgaGFtbWVyc3BhY2Ugc2F0Y2hlbCB3aWxsIG9ubHkgYWxsb3cgZm9yIG9uZS4gVGhlcmVcXCdzIFNwcml0eiwgUHJvZmVzc29yIEdpbmdlciwgQ2FjdHVzIExhZ2VyLCBhbmQgTXMuIFNoaW0gU2hhbVxcJ3MgTWFwbGUgU29kYS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbWFwbGUnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZmluZCBpdCBzaG9ja2luZyB0aGF0IHlvdSBhcmUgdGhlIGZpcnN0IHJhaWRlciBvZiB0aGlzIHNvZGEgdG9tYi4gQnV0IHRoZW4gYWdhaW4sIHlvdSBoYXZlIGFsd2F5cyBzYWlkIHBlb3BsZSBkb25cXCd0IGtub3cgdGhlIHZhbHVlIG9mIGEgYmFnIG9mIGxpcXVpZCBzdWdhci4gWW91IHRha2Ugb2ZmIHdpdGggaXQgdW5kZXIgY292ZXIgb2YgZGFya25lc3MuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdzb2RhIHN5cnVwJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyBlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBqdXN0IHdhbGtlZCBvbnRvIHRoZSBzZXQgb2YgdGhlIHdpbGRseSBwb3B1bGFyIGdhbWUgc2hvdywgXCJTZWFsIG9yIE5vIFNlYWwhXCIgV2hlcmUgZmxhbWJveWFudCBjb250ZXN0YW50cyBmbGFpbCBhcm91bmQgYW5kIHNob3V0IHdoaWxlIHRyeWluZyB0byBhcnJpdmUgYXQgdGhlIGFuc3dlciB0byB0aGF0IGFnZSBvbGQgcXVlc3Rpb24uLi5TRUFMIE9SIE5PIFNFQUw/IFRvIHRoZSBlYXN0IGlzIGJhY2tzdGFnZSwgbm9ydGggd2lsbCB0YWtlIHlvdSB0byB0aGUgZHJlc3Npbmcgcm9vbSwgd2VzdCBvciBzb3V0aCB3aWxsIHRha2UgeW91IGJhY2sgd2hlcmV2ZXIgeW91IGNhbWUgZnJvbS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIG5vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIGVhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyB3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2V0dGVyIE9jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdCaWxseSBPY2VhbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20pJywgLT5cbiAgICAgICAgc3RlcDEgPSAnTGV0XFwncyBzdGFydCB3aXRoIGhlYWRnZWFyLiBZb3Ugc2VlIGEgY293Ym95IGhhdCwgYSByYWluYm93IHdpZywgYSBtb3RvcmN5Y2xlIGhlbG1ldCwgYW5kIGEgc3RvdmVwaXBlIGhhdC4nXG4gICAgICAgIHN0ZXAyID0gJ05vdyBzZWxlY3QgYSBzZXQgb2YgY2xvdGhlcy4gWW91IHNlZSBhIGxlYXRoZXIgamFja2V0LCBhIGNsb3duIHN1aXQsIGFuIG9sZHRpbWV5IHN1aXQgd2l0aCBvbmUgb2YgdGhvc2UgQ29sb25lbCBTYW5kZXJzIHRpZXMsIGFuZCBhIGNvdyBwcmludCB2ZXN0LidcbiAgICAgICAgc3RlcDMgPSAnQWNjZXNzb3JpemUhIFBpY2sgZnJvbSBhIGZha2UgYmVhcmQsIGEgZ3VuIGJlbHQsIGEgbWV0YWwgY2hhaW4sIGFuZCBhIHJ1YmJlciBjaGlja2VuLidcbiAgICAgICAgZG9uZSA9ICdZb3UgbG9vayBhYnNvbHV0ZWx5IGhvcnJpYmxlISBPciBhbWF6aW5nLCBkZXBlbmRpbmcgb24geW91ciBwZXJzcGVjdGl2ZS4gQnV0IHRoZSB0cnVlIGp1ZGdlIHdpbGwgYmUgdGhlIGdhbWUgc2hvdyBtYW5hZ2VyLidcblxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgcGxhY2UgaXMgZ3JlYXQhIEl0IHdvdWxkIGJlIGVhc3kgdG8gY29iYmxlIHRvZ2V0aGVyIGEgY29zdHVtZSB0byBnZXQgb24gdGhhdCBzaG93LiBMZXRzIHNlZSB3aGF0IHdlIGNhbiBmaW5kLiBPYnZpb3VzIGV4aXRzIGFyZSBzb3V0aCB0byB0aGUgc2hvdyBlbnRyYW5jZS4nKVxuICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Nvc3R1bWUnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAxKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgY293Ym95IGhhdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY293Ym95IGhhdCcpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDIpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgcmFpbmJvdyB3aWcnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3JhaW5ib3cgd2lnJylcbiAgICAgICAgICAgIEBwcmludChzdGVwMilcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBtb3RvcmN5Y2xlIGhlbG1ldCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAyKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHN0b3ZlcGlwZSBoYXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3N0b3ZlcGlwZSBoYXQnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAyKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbGVhdGhlciBqYWNrZXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBjbG93biBzdWl0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjbG93biBzdWl0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBvbGR0aW1leSBzdWl0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdvbGR0aW1leSBzdWl0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBjb3cgdmVzdCcpIG9yIEBtYXRjaGVzKCd0YWtlIHByaW50IHZlc3QnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2NvdyBwcmludCB2ZXN0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGZha2UgYmVhcmQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Zha2UgYmVhcmQnKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgZ3VuIGJlbHQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIG1ldGFsIGNoYWluJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdtZXRhbCBjaGFpbicpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBydWJiZXIgY2hpY2tlbicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGNvc3R1bWVNYXRjaGVzID0gKGVuZ2luZSkgLT5cbiAgICAgICAgZGVidWdnZXJcbiAgICAgICAgZ3JvdXAxID0gMFxuICAgICAgICBncm91cDIgPSAwXG4gICAgICAgIGdyb3VwMyA9IDBcbiAgICAgICAgZ3JvdXA0ID0gMFxuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjb3dib3kgaGF0JykgdGhlbiBncm91cDErK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgncmFpbmJvdyB3aWcnKSB0aGVuIGdyb3VwMSsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdtb3RvcmN5Y2xlIGhlbG1ldCcpIHRoZW4gZ3JvdXAxKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ3N0b3ZlcGlwZSBoYXQnKSB0aGVuIGdyb3VwMSsrXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2xlYXRoZXIgamFja2V0JykgdGhlbiBncm91cDIrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnY2xvd24gc3VpdCcpIHRoZW4gZ3JvdXAyKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ29sZHRpbWV5IHN1aXQnKSB0aGVuIGdyb3VwMisrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjb3cgcHJpbnQgdmVzdCcpIHRoZW4gZ3JvdXAyKytcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnZ3VuIGJlbHQnKSB0aGVuIGdyb3VwMysrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdydWJiZXIgY2hpY2tlbicpIHRoZW4gZ3JvdXAzKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Zha2UgYmVhcmQnKSB0aGVuIGdyb3VwMysrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdtZXRhbCBjaGFpbicpIHRoZW4gZ3JvdXAzKytcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoZ3JvdXAxLCBncm91cDIsIGdyb3VwMywgZ3JvdXA0KVxuXG4gICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zID0gKGVuZ2luZSkgLT5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Nvd2JveSBoYXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgncmFpbmJvdyB3aWcnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnc3RvdmVwaXBlIGhhdCcpXG5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Nsb3duIHN1aXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnb2xkdGltZXkgc3VpdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjb3cgcHJpbnQgdmVzdCcpXG5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3J1YmJlciBjaGlja2VuJylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Zha2UgYmVhcmQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnbWV0YWwgY2hhaW4nKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIGlzIHRoZSBzdGFnZS4gSXQgaXMganVzdCBhcyBzdHVwaWQgbG9va2luZyBhcyB0aGUgcmVzdCBvZiB0aGUgc2hvdy4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgc2hvd1xcJ3MgZW50cmFuY2UuIFRoZSBzaG93IG1hbmFnZXIgc3RhcmVzIGF0IHlvdSBxdWVzdGlvbmluZ2x5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayBtYW5hZ2VyJylcbiAgICAgICAgICAgIHN3aXRjaCBjb3N0dW1lTWF0Y2hlcyhAKVxuICAgICAgICAgICAgICAgIHdoZW4gMFxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgYXBvbG9naXplcywgXCJJIGFtIHNvcnJ5IHNpciwgeW91IGxvb2sgbGlrZSBhIGRlY2VudCBraW5kIG9mIHBlcnNvbiwgYW5kIElcXCdtIGFmcmFpZCB3ZSBoYXZlIG5vIHBsYWNlIGZvciB0aGF0IG9uIHRlbGV2aXNpb24uIE1heWJlIGlmIHlvdSBjYW1lIGJhY2sgZHJlc3NlZCBsaWtlIGEgbWFuaWFjIHdlIGNvdWxkIHdvcmsgc29tZXRoaW5nIG91dC4nKVxuICAgICAgICAgICAgICAgIHdoZW4gM1xuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgbG9va3MgeW91IG92ZXIsIG5vdGljaW5nIGdvb2QgdGFzdGUsIHlvdXIga25hY2sgZm9yIGZsYWlyIGFuZCBhdHRlbnRpb24gdG8gZGV0YWlsLiBIZSBkZWNsYXJlcyBcIldlbGwsIEkgYXBwcmVjaWF0ZSB5b3UgdGFraW5nIHRpbWUgdG8gYXNzZW1ibGUgdGhlIGNvc3R1bWUsIGJ1dCBpdCBpcyBqdXN0IGEgYml0IHRvbyBvcmRlcmx5LiBZb3UgcmVhbGx5IGFyZW5cXCd0IHdoYXQgd2UgYXJlIGxvb2tpbmcgZm9yLlwiJylcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgd2hlbiAyXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIHNob3cgbWFuYWdlciBsb29rcyBwbGVhc2VkLCB5ZXQgYSB0b3VjaCB0cm91YmxlZC4gXCJZb3UgbG9vayB0byBiZSBhIG1hbiBnb2luZyBpbiB0aGUgcmlnaHQgZGlyZWN0aW9uLCBidXQgd2Ugb25seSBzZWxlY3QgdGhlIGJlc3Qgb2YgdGhlIGJlc3QgZm9yIFNlYWwgb3Igbm8gU2VhbC4gWW91ciBjb3N0dW1lIGlzIG5vdCBxdWl0ZSByZWFkeSBmb3IgdGhlIGJpZyBzaG93IHlldC4nKVxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgICAgICB3aGVuIDFcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ1wiT2gsIHdvdyFcIiBFeGNsYWltcyB0aGUgc2hvdyBtYW5hZ2VyLiBcIllvdSBsb29rIGFic29sdXRlbHkgYXdmdWwuIFlvdSBkZWZpbml0ZWx5IGhhdmUgdGhlIGxvb2sgZm9yIG91ciBzaG93LlwiIFlvdSBzdGFydCB0byBkYW5jZSBhcm91bmQsIHdob29waW5nIGFuZCBob2xsZXJpbmcsIGRlY2xhcmluZyB5b3Vyc2VsZiB0aGUgZnV0dXJlIGtpbmcgb2YgdGhlIHdvcmxkLiBcIkFuZCBJIHNlZSB5b3UgaGF2ZSB0aGUgY2hhcmlzbWEgdG8gbWF0Y2guXCIgSGUgdHVybnMgdG8gaGlzIGFzc2lzdGFudCwgXCJHZXQgdGhpcyBmZWxsYSBvbiBzdGFnZSBhdCBvbmNlLicpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChPbiBTdGFnZSEpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyB3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoT24gU3RhZ2UhKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnXCJXZWxjb21lIGJhY2sgdG8gdGhlIFNlYWwgb3IgTm8gU2VhbCwgdGhlIG1vc3QgcG9wdWxhciBnYW1lIHNob3cgdW5kZXIgdGhlIHNlYSEgSVxcJ20geW91ciB3ZWxsIHRhbm5lZCBob3N0IEplcnJ5IFppbnRlcnZhbmRlcmJpbmRlcmJhdWVyIEpyLiBMZXRcXCdzIG1lZXQgb3VyIG5leHQgY29udGVzdGFudDogU2hhcmMhIEFuIGluY3JlZGlibHkgb2Jub3hpb3VzIHlldCBwZXJzdWFzaXZlIHlvdW5nIG9jZWFuIGR3ZWxsZXIsIGhlIGxvdmVzIGFubm95aW5nIGhpcyBmcmllbmRzIGFuZCBpcyBhbHdheXMgdXAgZm9yIGEgcm91bmQgb2YgU2NyYWJibGUsIExBRElFUy4gVGltZSB0byBnZXQgc3RhcnRlZC4gTm93LCBTaGFyYyBJIGFtIGdvaW5nIHRvIHByZXNlbnQgeW91IHdpdGggYSBicmllZmNhc2UuIEluIHRoaXMgYnJpZWZjYXNlLCB0aGVyZSBtaWdodCBiZSBhIHNlYWwgb3IgdGhlcmUgbWlnaHQgbm90IGJlIGEgc2VhbC4gQW5kIEkgbmVlZCB5b3UgdG8gdGVsbCBtZSB3aGljaCBpdCBpczogU0VBTCBvciBOTyBTRUFMP1wiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdubyBzZWFsJylcbiAgICAgICAgICAgIGFsZXJ0KCdKZXJyeSBzbG93bHkgb3BlbnMgdGhlIGJyaWVmY2FzZSwgcGVla2luZyBpbnNpZGUgZmlyc3QgdG8gZGV0ZWN0IGFueSBzaWducyBvZiBzZWFsIGVudHJhaWxzIGFuZCB0aGVuLCB3ZWFyaW5nIGEgZmFjZSBvZiBwcmFjdGljZWQgZGlzYXBwb2ludG1lbnQgYW5kIGVtcGF0aHksIHdoaW1wZXJzIFwiVG9vIGJhZCxcIiBsZXR0aW5nIHRoZSBjYXNlIG9wZW4gdGhlIHJlc3Qgb2YgdGhlIHdheS4gQXQgdGhpcywgeW91IGFyZSBwcm9tcHRseSB1c2hlcmVkIG9mZiB0aGUgc3RhZ2UgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN1Y2tlci4nKVxuICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc2VhbCcpXG4gICAgICAgICAgICBhbGVydCgnSmVycnkgc2xvd2x5IG9wZW5zIHRoZSBicmllZmNhc2UsIHBlZWtpbmcgaW5zaWRlIGZpcnN0IHRvIGRldGVjdCBhbnkgc2lnbnMgb2Ygc2VhbCBlbnRyYWlscyBhbmQgdGhlbiBleGNpdGVkbHkgcHVsbHMgaXQgYWxsIHRoZSB3YXkgb3Blbi4gXCJIZVxcJ3MgcmlnaHQgcGVvcGxlISBOb3csIGxldFxcJ3Mgc2VlIHlvdXIgcHJpemVzLlwiIFwiUHJpemVzIGlzIHJpZ2h0IEplcnJ5LFwiIHNheXMgYSB2b2ljZSBjb21pbmcgZnJvbSBub3doZXJlIGFuZCBldmVyeXdoZXJlIGFsbCBhdCBvbmNlLiBcIkhlcmUgYXJlIHNvbWUgd29ybGQgY2xhc3Mgc2VsZWN0aW9ucyBJIHBpY2tlZCB1cCBmcm9tIHRoZSBncm9jZXJ5IHN0b3JlIG9uIHRoZSB3YXkgaGVyZSB0aGlzIG1vcm5pbmc6IFN1Y2Nlc3MgY29tZXMgaW4gY2Fucywgbm90IGluIGNhbiBub3RzLiBUaW4gY2FucyB0aGF0IGlzISBUaGF0XFwncyB3aHkgd2UgYXJlIG9mZmVyaW5nIHlvdSB0aGUgY2hvaWNlIG9mIGEgZnVsbCB3ZWVrXFwncyBzdXBwbHkgb2YgXFwnQ2FwdGFpbiBOZWRcXCdzIFBpY2tsZWQgSGVycmluZ1xcJywgb3IgXFwnTm8gSWZzIEFuZHMgb3IgQnV0dGVyXFwnIGJyYW5kIG1hcmdhcmluZSBzcHJlYWQgcHJvZHVjdCBmb3IgeW91ciBjb25zdW1wdGlvbiBwbGVhc3VyZS4gIE5hdHVyYWxseSB5b3UgY2hvb3NlIHRoZSBtYXJnYXJpbmUgYmVjYXVzZSB5b3UgYXJlIGhlYWx0aCBjb25zY2lvdXMgb3Igc29tZXRoaW5nLicpXG4gICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgIEBnZXRJdGVtKCdtYXJnYXJpbmUnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCcsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnT2ggbWFuLCBXYXRlciBXb3JsZCEgWW91IGxvdmUgdGhhdCBtb3ZpZS4gS2V2aW4gQ29zdG5lciBzaG91bGQgaGF2ZSB0b3RhbGx5IGdvdHRlbiB0aGUgT3NjYXIuIFdhaXQgdGhpcyBpc25cXCd0IGxpa2UgdGhhdC4gVGhpcyBpcyBXYXRlciBXb3JsZCwgdGhlIGhvbWUgb2YgdGhhdCBzdHVwaWQga2lsbGVyIHdoYWxlLCBTaGFtcHUuIFdoYXQgYSBoYWNrISBPYnZpb3VzIGV4aXRzIGFyZSBub3J0aCB0byB0aGUgTWFuYXRlZSBzaG93LCBlYXN0IHRvIHRoZSBnaWZ0IHNob3AsIGFuZCBzb3V0aCB0byB0aGUgQWNodGlwdXNcXCdzIGdhcmRlbi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dvIG5vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyBlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKEdpZnQgU2hvcCknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyBzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0FuZCB0aGVyZSBpdCBpczogVGhlIGlsbHVzdHJpb3VzIG1hbmF0ZWUuIFlvdSBjYW4gc2VlIHdoeSB0aGUgc3RhbmRzIGFyZSBlbXB0eS4gVGhlcmUgYXJlIGJpZyB1bWJyZWxsYXMgYXR0YWNoZWQgdG8gc29tZSBwaWNuaWMgdGFibGVzOyBub3QgbXVjaCB0byBzZWUuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIE1hbmF0ZWUgc2VydmljZSByb29tIGFuZCBzb3V0aCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgdW1icmVsbGEnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3VtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnV2VsbCwgb2theS4gWW91IG5vdyBoYXZlIGFuIHVtYnJlbGxhLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNZWNoYW5pY2FsIFJvb20gVHlwZSBQbGFjZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyBzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkIChHaWZ0IFNob3ApJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZW50ZXIgdGhlIFdhdGVyIFdvcmxkIGdpZnQgc2hvcC4gVGhlcmUgYXJlIGFsbCBzb3J0cyBvZiBncmVhdCBpdGVtcyBoZXJlOiBhIGdpYW50IHN0dWZmZWQgb2N0b3B1cywgZGVoeWRyYXRlZCBhc3Ryb25hdXQgZmlzaCBmb29kLCBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgYmFkZ2Ugc3RpY2tlcnMsIGFuZCBzb21lIG9mIHRoYXQgY2xheSBzYW5kIGNyYXAgdGhleSB1c2VkIHRvIGFkdmVydGlzZSBvbiBUVi4gU2VlIGFueXRoaW5nIHlvdSBsaWtlPyBFYXN0IHRvIHRoZSBwYXJrIGVudHJhbmNlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBiYWRnZScpIG9yIEBtYXRjaGVzKCd0YWtlIHNoZXJpZmYnKSBvciBAbWF0Y2hlcygndGFrZSBzdGlja2VyJykgb3IgQG1hdGNoZXMoJ3Rha2Ugc3RpY2tlcnMnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2JhZGdlIHN0aWNrZXInKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgdGFrZSB0aGUganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzIHRvIHRoZSBjb3VudGVyLiBUaGUgY2FzaGllciBzYXlzIHRoZXkgYXJlIG9uIHNhbGUsIG9ubHkgMTUgZmlzaCBkb2xsYXJzLCBwbHVzIHRheC4gWXVzc3NzLiBZb3UgcGF5IHRoZSBtYW4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHRha2UgdGhhdCBpdGVtIHRvIHRoZSBjb3VudGVyLiBUaGUgY2FzaGllciBzYXlzIGl0IGlzICcgKyAoMTggKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzMCkpLnRvU3RyaW5nKCkgKyAnIGZpc2ggZG9sbGFycyBidXQgeW91IG9ubHkgaGF2ZSAxNyBmaXNoIGRvbGxhcnMuIE51dHMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnbyB3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKE1lY2hhbmljYWwgUm9vbSBUeXBlIFBsYWNlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnV2hhdCBpbiB0aGUgbmFtZSBvZiBDYXB0YWluIE5lbW8gaXMgdGhpcz8gVGhlcmUgYXJlIG1hbmF0ZWVzIGluIGhvaXN0cyBhbGwgb3ZlciB0aGUgcm9vbSBob29rZWQgdXAgdG8uLi5taWxraW5nIGRldmljZXMuIFRoaXMgaXMgbm8gbWVjaGFuaWNhbCByb29tISBJdFxcJ3MgYSBjb3ZlciBmb3IgYSBzZWNyZXQsIGlsbGVnYWwsIHVuZGVyZ3JvdW5kLCBibGFjayBtYXJrZXQsIGJ1dCBwcm9iYWJseSBvcmdhbmljLCBzZWEgY293IG1pbGtpbmcgb3BlcmF0aW9uLiBUaGUgZmllbmRzISBZb3UgYXJlIGdvaW5nIHRvIGJsb3cgdGhlIGxpZCBvZmYgdGhpcyB0aGluZyBmb3Igc3VyZS4gVGhlIHN3ZWF0eSBvbGQgZmlzaCBydW5uaW5nIHRoZSBtYWNoaW5lcnkgaGFzIG5vdCBub3RpY2VkIHlvdSB5ZXQuIE9idmlvdXMgZXhpdHMgYXJlIGVhc3QgdG8gdGhlIG1hbmF0ZWUgZXhoaWJpdC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnYmFkZ2Ugc3RpY2tlcicpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgZmlzaCBhdCB0aGUgY29udHJvbHMuIFwiSSBhbSBnb2luZyB0byBzaHV0IHlvdSBkb3duIVwiIFlvdSBzaG91dCBhdCBoaW0uIEhlIGxhdWdocyBoZWFydGlseS4gXCJZb3UgZG9uXFwndCBzdGFuZCBhIGNoYW5jZS4gWW91XFwncmUganVzdCBhIHJlZ3VsYXIgZ3V5LiBJXFwnbSB0aGUgbWF5b3Igb2YgV2F0ZXIgV29ybGQuIFdobyBpcyBnb2luZyB0byBiZWxpZXZlIHlvdT9cIiBIZSBnb2VzIGJhY2sgdG8gaGlzIHdvcmsgcGF5aW5nIHlvdSBubyBtaW5kLiBIZSBoYXMgYSBwb2ludC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHN3aW0gdXAgdG8gdGhlIGZpc2ggYnJhbmRpc2hpbmcgeW91ciBiYWRnZSBzdGlja2VyLiBcIllvdSBhcmUgdW5kZXIgYXJyZXN0IGZvciBpbGxlZ2FsIG1pbGsgaGFydmVzdGluZyBmcm9tIGVuZGFuZ2VyZWQgbWFuYXRlZXMuIElcXCdtIHRha2luZyB5b3UgaW4uXCIgXCJXYWl0LFwiIGhlIHNheXMsIFwiWW91IGRvblxcJ3QgaGF2ZSB0byBkbyB0aGlzLiBJdFxcJ3MgdGhlIG9ubHkgd2F5IEkgY2FuIGtlZXAgV2F0ZXIgV29ybGQgcnVubmluZy4gRG9uXFwndCB5b3Ugc2VlPyBOb3cgdGhhdCB3ZSBhcmUgb24gb3VyIHNpeHRoIFNoYW1wdSwgcGVvcGxlIGp1c3QgZG9uXFwndCBzZWVtIHRvIGNhcmUgYWJvdXQgdGhlIG1hZ2ljIG9mIGV4cGxvaXRlZCBtYXJpbmUgbWFtbWFscy4gSSB3aWxsLCB1aC4uLm1ha2UgaXQgd29ydGggeW91ciB3aGlsZSB0aG91Z2guXCIgSGUgc2xpZGVzIGEgZnJlc2ggYm90dGxlIG9mIG1pbGsgaW4geW91ciBkaXJlY3Rpb24uIFdpdGhvdXQgbG9va2luZyBhdCB5b3UgaGUgc2F5cywgXCJJdCBpcyB3b3J0aCB0aG91c2FuZHMgaW4gdGhlIHJpZ2h0IG1hcmtldC5cIicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ21hbmF0ZWUgbWlsaycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ28gZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGhhdmUgZW50ZXJlZCBUaGUgRXRoZXJlYWwgUmVhbG0uIFdoeSBkaWQgeW91IGRvIHRoYXQ/IFRoYXQgd2FzIGEgYmFkIGRlY2lzaW9uLiBXYWxlIGlzIGF0IHlvdXIgc2lkZS4gVGhlcmUgYXJlIGEgYnVuY2ggb2Ygd2VpcmQsIHNwYWNleSBwbGF0Zm9ybXMgYW5kIGp1bmsgZmxvYXRpbmcgYXJvdW5kIGluIGEgY29zbWljIHZvaWQgLS0geW91ciB0eXBpY2FsIHN1cnJlYWxpc3QgZHJlYW1zY2FwZSBlbnZpcm9ubWVudC4gQWhlYWQgaXMgYW4gdWdseSBtb25zdGVyLiBIZSBpcyBjbHV0Y2hpbmcgc29tZXRoaW5nIGluIGhpcyBoYW5kLiBPYnZpb3VzIGV4aXRzIGFyZSBOT05FISBUaGlzIGlzIHRoZSB3b3JsZCBvZiB3YWtpbmcgbmlnaHRtYXJlcyB5b3UgZGluZ3VzLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsgbW9uc3RlcicpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBhcmUgZ2V0dGluZyB3b3JzZSBhdCB0aGlzIGdhbWUuIFlvdSBhcHByb2FjaCBzYWlkIG1vbnN0ZXIgaW4gYW4gZWZmb3J0IHRvIGdldCBzb21lIGxlYWRzIG9uIHlvdXIgcHJlY2lvdXMgaGFpciBwcm9kdWN0LiBNYXliZSBuZXh0IHRpbWUgc3RhcnQgYnkgYXNraW5nIGhpbSBhYm91dCB0aGUgc3RhdHVzIG9mIHRoZSBsb2NhbCBiYXNrZXRiYWxsIHRlYW0gb3Igc29tZXRoaW5nPyBPbiBjbG9zZXIgZXhhbWluYXRpb24gdGhvdWdoLCB5b3UgcmVhbGl6ZSB0aGlzIG5vdCBqdXN0IGFueSBtb25zdGVyLiBJdCBpcyBhIFRvcnVtZWtpYW4gaHlwZXIgZ29ibGluLiBBbmQgaW4gaGlzIGdyaXNseSBwYXcgcmVzdHMgdGhlIGl0ZW0gb2YgeW91ciBxdWVzdCwgeW91ciAkMjMgc2hhbXBvby4gXCJTaGFyYywgd2UgY2FuIG5vdCBhbGxvdyBoaW0gdG8gdXNlIHRoYXQgc2hhbXBvbyxcIiB3aGlzcGVycyB5b3VyIGNvbXBhbmlvbi4gXCJPbiB0aGUgaGVhZCBvZiBhIGh5cGVyIGdvYmxpbiwgaGFpciB0aGF0IHNtb290aCBjb3VsZCBtZWFuIHRoZSBlbmQgb2YgZmFzaGlvbiBhcyB3ZSBrbm93IGl0LiBXZSBtdXN0IHJldHJpZXZlIGl0IGJ5IGFueSBtZWFucyBuZWNlc3NhcnkuXCIgTm8gc29vbmVyIGhhdmUgdGhlIHdvcmRzIGxlZnQgV2FsZVxcJ3MgbGlwcyB0aGF0IHlvdSBhcmUgc3BvdHRlZC4gVGhhdCBpcyBhbGwgdGhlIG1vdGl2YXRpb24gdGhpcyBiZWFzdCBuZWVkcy4gSGUgZmxpcHMgdGhlIGNhcCBvbiB0aGUgYm90dGxlLCByYWlzaW5nIGl0IHRvIHRoZSBmaWx0aHksIHN0cmluZy1saWtlIG1vcCB5b3UgY2FuIG9ubHkgYXNzdW1lIG11c3QgYmUgaGlzIGhhaXIsIGFsbCB0aGUgd2hpbGUgZ2F6aW5nIGRvd24gYXQgeW91IGluIGRlZmlhbmNlIHdpdGggaGlzIHNpbmdsZSBibG9vZCBzaG90IGV5ZS4gRG8gc29tZXRoaW5nIScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnYXR0YWNrJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHN0YXJ0IHRvIGx1bmdlIHRvd2FyZHMgdGhlIGNyZWF0dXJlLCBidXQgV2FsZSBwdXNoZXMgeW91IG91dCBvZiB0aGUgd2F5IGluIGEgY2hhcmdlIGhpbXNlbGYuIFlvdSBjcmluZ2UgYXMgeW91IGhlYXIgdGhlIHNsYXNoaW5nIG9mIGZsZXNoLiBSZWQgbWlzdCBmbG9hdHMgb3V0IG9mIFdhbGVcXCdzIHNpZGUuIFlvdXIgaGVhZCBpcyBzcGlubmluZy4gIFwiTm93IFNoYXJjIVwiLCBoZSB3aGVlemVzLCBcIlVzZSB0aGUgcG93ZXIgb2YgdGhlIFF1YWRyYXRpYyBFeWUuXCIgXCJCdXQgeW91IHNhaWQgSSB3YXNuXFwndCByZWFkeSFcIiB5b3UgY3J5LCB0cnlpbmcgbm90IHRvIGxvb2sgYXQgdGhlIHNvcnJ5IHN0YXRlIG9mIHlvdXIgZnJpZW5kLiBcIk5vLCBpdCB3YXMgSSB3aG8gd2FzIG5vdCByZWFkeS4gVGhlIHAtcG93ZXIgaGFzIGFsd2F5cyBiZWVuIHdpdGhpbiB5LXlvdS5cIiBZb3UgZmVlbCBhIGx1bXAgaW4geW91ciBwb2NrZXQuIFJlYWNoaW5nIGluLCB5b3UgcHVsbCBvdXQgdGhlIFF1YWRyYXRpYyBFeWUuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd1c2UgcXVhZHJhdGljIGV5ZScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0VuZCcpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdFbmQnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSByZW1vdmUgdGhlIFF1YWRyYXRpYyBFeWUgZnJvbSBpdHMgY29tcGFydG1lbnQsIGNsb3NlIHlvdXIgZXllcyBhbmQgYWxsb3cgdW5pb24gYmV0d2VlbiB5b3VyIHNwaXJpdCBhbmQgdGhlIHVuaXZlcnNhbCBjaGkgZmxvdy4gVGhlbiB0aGUgZ29ibGluIGdldHMgY3V0IGluIGhhbGYgYW5kIHlvdSBnZXQgeW91ciBzaGFtcG9vIGJhY2suJylcblxuXG4gICAgZW5naW5lLnNldFN0YXJ0Um9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiknKVxuIiwidmFyIG0gPSAoZnVuY3Rpb24gYXBwKHdpbmRvdywgdW5kZWZpbmVkKSB7XHJcblx0dmFyIE9CSkVDVCA9IFwiW29iamVjdCBPYmplY3RdXCIsIEFSUkFZID0gXCJbb2JqZWN0IEFycmF5XVwiLCBTVFJJTkcgPSBcIltvYmplY3QgU3RyaW5nXVwiLCBGVU5DVElPTiA9IFwiZnVuY3Rpb25cIjtcclxuXHR2YXIgdHlwZSA9IHt9LnRvU3RyaW5nO1xyXG5cdHZhciBwYXJzZXIgPSAvKD86KF58I3xcXC4pKFteI1xcLlxcW1xcXV0rKSl8KFxcWy4rP1xcXSkvZywgYXR0clBhcnNlciA9IC9cXFsoLis/KSg/Oj0oXCJ8J3wpKC4qPylcXDIpP1xcXS87XHJcblx0dmFyIHZvaWRFbGVtZW50cyA9IC9eKEFSRUF8QkFTRXxCUnxDT0x8Q09NTUFORHxFTUJFRHxIUnxJTUd8SU5QVVR8S0VZR0VOfExJTkt8TUVUQXxQQVJBTXxTT1VSQ0V8VFJBQ0t8V0JSKSQvO1xyXG5cdHZhciBub29wID0gZnVuY3Rpb24oKSB7fVxyXG5cclxuXHQvLyBjYWNoaW5nIGNvbW1vbmx5IHVzZWQgdmFyaWFibGVzXHJcblx0dmFyICRkb2N1bWVudCwgJGxvY2F0aW9uLCAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lLCAkY2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcblxyXG5cdC8vIHNlbGYgaW52b2tpbmcgZnVuY3Rpb24gbmVlZGVkIGJlY2F1c2Ugb2YgdGhlIHdheSBtb2NrcyB3b3JrXHJcblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZSh3aW5kb3cpe1xyXG5cdFx0JGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cdFx0JGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xyXG5cdFx0JGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5jbGVhclRpbWVvdXQ7XHJcblx0XHQkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuc2V0VGltZW91dDtcclxuXHR9XHJcblxyXG5cdGluaXRpYWxpemUod2luZG93KTtcclxuXHJcblxyXG5cdC8qKlxyXG5cdCAqIEB0eXBlZGVmIHtTdHJpbmd9IFRhZ1xyXG5cdCAqIEEgc3RyaW5nIHRoYXQgbG9va3MgbGlrZSAtPiBkaXYuY2xhc3NuYW1lI2lkW3BhcmFtPW9uZV1bcGFyYW0yPXR3b11cclxuXHQgKiBXaGljaCBkZXNjcmliZXMgYSBET00gbm9kZVxyXG5cdCAqL1xyXG5cclxuXHQvKipcclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7VGFnfSBUaGUgRE9NIG5vZGUgdGFnXHJcblx0ICogQHBhcmFtIHtPYmplY3Q9W119IG9wdGlvbmFsIGtleS12YWx1ZSBwYWlycyB0byBiZSBtYXBwZWQgdG8gRE9NIGF0dHJzXHJcblx0ICogQHBhcmFtIHsuLi5tTm9kZT1bXX0gWmVybyBvciBtb3JlIE1pdGhyaWwgY2hpbGQgbm9kZXMuIENhbiBiZSBhbiBhcnJheSwgb3Igc3BsYXQgKG9wdGlvbmFsKVxyXG5cdCAqXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gbSgpIHtcclxuXHRcdHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdFx0dmFyIGhhc0F0dHJzID0gYXJnc1sxXSAhPSBudWxsICYmIHR5cGUuY2FsbChhcmdzWzFdKSA9PT0gT0JKRUNUICYmICEoXCJ0YWdcIiBpbiBhcmdzWzFdIHx8IFwidmlld1wiIGluIGFyZ3NbMV0pICYmICEoXCJzdWJ0cmVlXCIgaW4gYXJnc1sxXSk7XHJcblx0XHR2YXIgYXR0cnMgPSBoYXNBdHRycyA/IGFyZ3NbMV0gOiB7fTtcclxuXHRcdHZhciBjbGFzc0F0dHJOYW1lID0gXCJjbGFzc1wiIGluIGF0dHJzID8gXCJjbGFzc1wiIDogXCJjbGFzc05hbWVcIjtcclxuXHRcdHZhciBjZWxsID0ge3RhZzogXCJkaXZcIiwgYXR0cnM6IHt9fTtcclxuXHRcdHZhciBtYXRjaCwgY2xhc3NlcyA9IFtdO1xyXG5cdFx0aWYgKHR5cGUuY2FsbChhcmdzWzBdKSAhPSBTVFJJTkcpIHRocm93IG5ldyBFcnJvcihcInNlbGVjdG9yIGluIG0oc2VsZWN0b3IsIGF0dHJzLCBjaGlsZHJlbikgc2hvdWxkIGJlIGEgc3RyaW5nXCIpXHJcblx0XHR3aGlsZSAobWF0Y2ggPSBwYXJzZXIuZXhlYyhhcmdzWzBdKSkge1xyXG5cdFx0XHRpZiAobWF0Y2hbMV0gPT09IFwiXCIgJiYgbWF0Y2hbMl0pIGNlbGwudGFnID0gbWF0Y2hbMl07XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzFdID09PSBcIiNcIikgY2VsbC5hdHRycy5pZCA9IG1hdGNoWzJdO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCIuXCIpIGNsYXNzZXMucHVzaChtYXRjaFsyXSk7XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzNdWzBdID09PSBcIltcIikge1xyXG5cdFx0XHRcdHZhciBwYWlyID0gYXR0clBhcnNlci5leGVjKG1hdGNoWzNdKTtcclxuXHRcdFx0XHRjZWxsLmF0dHJzW3BhaXJbMV1dID0gcGFpclszXSB8fCAocGFpclsyXSA/IFwiXCIgOnRydWUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY2hpbGRyZW4gPSBoYXNBdHRycyA/IGFyZ3Muc2xpY2UoMikgOiBhcmdzLnNsaWNlKDEpO1xyXG5cdFx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiB0eXBlLmNhbGwoY2hpbGRyZW5bMF0pID09PSBBUlJBWSkge1xyXG5cdFx0XHRjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5bMF1cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5cclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gYXR0cnMpIHtcclxuXHRcdFx0aWYgKGF0dHJzLmhhc093blByb3BlcnR5KGF0dHJOYW1lKSkge1xyXG5cdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gY2xhc3NBdHRyTmFtZSAmJiBhdHRyc1thdHRyTmFtZV0gIT0gbnVsbCAmJiBhdHRyc1thdHRyTmFtZV0gIT09IFwiXCIpIHtcclxuXHRcdFx0XHRcdGNsYXNzZXMucHVzaChhdHRyc1thdHRyTmFtZV0pXHJcblx0XHRcdFx0XHRjZWxsLmF0dHJzW2F0dHJOYW1lXSA9IFwiXCIgLy9jcmVhdGUga2V5IGluIGNvcnJlY3QgaXRlcmF0aW9uIG9yZGVyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgY2VsbC5hdHRyc1thdHRyTmFtZV0gPSBhdHRyc1thdHRyTmFtZV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNsYXNzZXMubGVuZ3RoID4gMCkgY2VsbC5hdHRyc1tjbGFzc0F0dHJOYW1lXSA9IGNsYXNzZXMuam9pbihcIiBcIik7XHJcblx0XHRcclxuXHRcdHJldHVybiBjZWxsXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJ1aWxkKHBhcmVudEVsZW1lbnQsIHBhcmVudFRhZywgcGFyZW50Q2FjaGUsIHBhcmVudEluZGV4LCBkYXRhLCBjYWNoZWQsIHNob3VsZFJlYXR0YWNoLCBpbmRleCwgZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncykge1xyXG5cdFx0Ly9gYnVpbGRgIGlzIGEgcmVjdXJzaXZlIGZ1bmN0aW9uIHRoYXQgbWFuYWdlcyBjcmVhdGlvbi9kaWZmaW5nL3JlbW92YWwgb2YgRE9NIGVsZW1lbnRzIGJhc2VkIG9uIGNvbXBhcmlzb24gYmV0d2VlbiBgZGF0YWAgYW5kIGBjYWNoZWRgXHJcblx0XHQvL3RoZSBkaWZmIGFsZ29yaXRobSBjYW4gYmUgc3VtbWFyaXplZCBhcyB0aGlzOlxyXG5cdFx0Ly8xIC0gY29tcGFyZSBgZGF0YWAgYW5kIGBjYWNoZWRgXHJcblx0XHQvLzIgLSBpZiB0aGV5IGFyZSBkaWZmZXJlbnQsIGNvcHkgYGRhdGFgIHRvIGBjYWNoZWRgIGFuZCB1cGRhdGUgdGhlIERPTSBiYXNlZCBvbiB3aGF0IHRoZSBkaWZmZXJlbmNlIGlzXHJcblx0XHQvLzMgLSByZWN1cnNpdmVseSBhcHBseSB0aGlzIGFsZ29yaXRobSBmb3IgZXZlcnkgYXJyYXkgYW5kIGZvciB0aGUgY2hpbGRyZW4gb2YgZXZlcnkgdmlydHVhbCBlbGVtZW50XHJcblxyXG5cdFx0Ly90aGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgaXMgZXNzZW50aWFsbHkgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIHJlZHJhdydzIGBkYXRhYCBkYXRhIHN0cnVjdHVyZSwgd2l0aCBhIGZldyBhZGRpdGlvbnM6XHJcblx0XHQvLy0gYGNhY2hlZGAgYWx3YXlzIGhhcyBhIHByb3BlcnR5IGNhbGxlZCBgbm9kZXNgLCB3aGljaCBpcyBhIGxpc3Qgb2YgRE9NIGVsZW1lbnRzIHRoYXQgY29ycmVzcG9uZCB0byB0aGUgZGF0YSByZXByZXNlbnRlZCBieSB0aGUgcmVzcGVjdGl2ZSB2aXJ0dWFsIGVsZW1lbnRcclxuXHRcdC8vLSBpbiBvcmRlciB0byBzdXBwb3J0IGF0dGFjaGluZyBgbm9kZXNgIGFzIGEgcHJvcGVydHkgb2YgYGNhY2hlZGAsIGBjYWNoZWRgIGlzICphbHdheXMqIGEgbm9uLXByaW1pdGl2ZSBvYmplY3QsIGkuZS4gaWYgdGhlIGRhdGEgd2FzIGEgc3RyaW5nLCB0aGVuIGNhY2hlZCBpcyBhIFN0cmluZyBpbnN0YW5jZS4gSWYgZGF0YSB3YXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLCBjYWNoZWQgaXMgYG5ldyBTdHJpbmcoXCJcIilgXHJcblx0XHQvLy0gYGNhY2hlZCBhbHNvIGhhcyBhIGBjb25maWdDb250ZXh0YCBwcm9wZXJ0eSwgd2hpY2ggaXMgdGhlIHN0YXRlIHN0b3JhZ2Ugb2JqZWN0IGV4cG9zZWQgYnkgY29uZmlnKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpXHJcblx0XHQvLy0gd2hlbiBgY2FjaGVkYCBpcyBhbiBPYmplY3QsIGl0IHJlcHJlc2VudHMgYSB2aXJ0dWFsIGVsZW1lbnQ7IHdoZW4gaXQncyBhbiBBcnJheSwgaXQgcmVwcmVzZW50cyBhIGxpc3Qgb2YgZWxlbWVudHM7IHdoZW4gaXQncyBhIFN0cmluZywgTnVtYmVyIG9yIEJvb2xlYW4sIGl0IHJlcHJlc2VudHMgYSB0ZXh0IG5vZGVcclxuXHJcblx0XHQvL2BwYXJlbnRFbGVtZW50YCBpcyBhIERPTSBlbGVtZW50IHVzZWQgZm9yIFczQyBET00gQVBJIGNhbGxzXHJcblx0XHQvL2BwYXJlbnRUYWdgIGlzIG9ubHkgdXNlZCBmb3IgaGFuZGxpbmcgYSBjb3JuZXIgY2FzZSBmb3IgdGV4dGFyZWEgdmFsdWVzXHJcblx0XHQvL2BwYXJlbnRDYWNoZWAgaXMgdXNlZCB0byByZW1vdmUgbm9kZXMgaW4gc29tZSBtdWx0aS1ub2RlIGNhc2VzXHJcblx0XHQvL2BwYXJlbnRJbmRleGAgYW5kIGBpbmRleGAgYXJlIHVzZWQgdG8gZmlndXJlIG91dCB0aGUgb2Zmc2V0IG9mIG5vZGVzLiBUaGV5J3JlIGFydGlmYWN0cyBmcm9tIGJlZm9yZSBhcnJheXMgc3RhcnRlZCBiZWluZyBmbGF0dGVuZWQgYW5kIGFyZSBsaWtlbHkgcmVmYWN0b3JhYmxlXHJcblx0XHQvL2BkYXRhYCBhbmQgYGNhY2hlZGAgYXJlLCByZXNwZWN0aXZlbHksIHRoZSBuZXcgYW5kIG9sZCBub2RlcyBiZWluZyBkaWZmZWRcclxuXHRcdC8vYHNob3VsZFJlYXR0YWNoYCBpcyBhIGZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIGEgcGFyZW50IG5vZGUgd2FzIHJlY3JlYXRlZCAoaWYgc28sIGFuZCBpZiB0aGlzIG5vZGUgaXMgcmV1c2VkLCB0aGVuIHRoaXMgbm9kZSBtdXN0IHJlYXR0YWNoIGl0c2VsZiB0byB0aGUgbmV3IHBhcmVudClcclxuXHRcdC8vYGVkaXRhYmxlYCBpcyBhIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhbiBhbmNlc3RvciBpcyBjb250ZW50ZWRpdGFibGVcclxuXHRcdC8vYG5hbWVzcGFjZWAgaW5kaWNhdGVzIHRoZSBjbG9zZXN0IEhUTUwgbmFtZXNwYWNlIGFzIGl0IGNhc2NhZGVzIGRvd24gZnJvbSBhbiBhbmNlc3RvclxyXG5cdFx0Ly9gY29uZmlnc2AgaXMgYSBsaXN0IG9mIGNvbmZpZyBmdW5jdGlvbnMgdG8gcnVuIGFmdGVyIHRoZSB0b3Btb3N0IGBidWlsZGAgY2FsbCBmaW5pc2hlcyBydW5uaW5nXHJcblxyXG5cdFx0Ly90aGVyZSdzIGxvZ2ljIHRoYXQgcmVsaWVzIG9uIHRoZSBhc3N1bXB0aW9uIHRoYXQgbnVsbCBhbmQgdW5kZWZpbmVkIGRhdGEgYXJlIGVxdWl2YWxlbnQgdG8gZW1wdHkgc3RyaW5nc1xyXG5cdFx0Ly8tIHRoaXMgcHJldmVudHMgbGlmZWN5Y2xlIHN1cnByaXNlcyBmcm9tIHByb2NlZHVyYWwgaGVscGVycyB0aGF0IG1peCBpbXBsaWNpdCBhbmQgZXhwbGljaXQgcmV0dXJuIHN0YXRlbWVudHMgKGUuZy4gZnVuY3Rpb24gZm9vKCkge2lmIChjb25kKSByZXR1cm4gbShcImRpdlwiKX1cclxuXHRcdC8vLSBpdCBzaW1wbGlmaWVzIGRpZmZpbmcgY29kZVxyXG5cdFx0Ly9kYXRhLnRvU3RyaW5nKCkgbWlnaHQgdGhyb3cgb3IgcmV0dXJuIG51bGwgaWYgZGF0YSBpcyB0aGUgcmV0dXJuIHZhbHVlIG9mIENvbnNvbGUubG9nIGluIEZpcmVmb3ggKGJlaGF2aW9yIGRlcGVuZHMgb24gdmVyc2lvbilcclxuXHRcdHRyeSB7aWYgKGRhdGEgPT0gbnVsbCB8fCBkYXRhLnRvU3RyaW5nKCkgPT0gbnVsbCkgZGF0YSA9IFwiXCI7fSBjYXRjaCAoZSkge2RhdGEgPSBcIlwifVxyXG5cdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGNhY2hlZDtcclxuXHRcdHZhciBjYWNoZWRUeXBlID0gdHlwZS5jYWxsKGNhY2hlZCksIGRhdGFUeXBlID0gdHlwZS5jYWxsKGRhdGEpO1xyXG5cdFx0aWYgKGNhY2hlZCA9PSBudWxsIHx8IGNhY2hlZFR5cGUgIT09IGRhdGFUeXBlKSB7XHJcblx0XHRcdGlmIChjYWNoZWQgIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmIChwYXJlbnRDYWNoZSAmJiBwYXJlbnRDYWNoZS5ub2Rlcykge1xyXG5cdFx0XHRcdFx0dmFyIG9mZnNldCA9IGluZGV4IC0gcGFyZW50SW5kZXg7XHJcblx0XHRcdFx0XHR2YXIgZW5kID0gb2Zmc2V0ICsgKGRhdGFUeXBlID09PSBBUlJBWSA/IGRhdGEgOiBjYWNoZWQubm9kZXMpLmxlbmd0aDtcclxuXHRcdFx0XHRcdGNsZWFyKHBhcmVudENhY2hlLm5vZGVzLnNsaWNlKG9mZnNldCwgZW5kKSwgcGFyZW50Q2FjaGUuc2xpY2Uob2Zmc2V0LCBlbmQpKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGlmIChjYWNoZWQubm9kZXMpIGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhY2hlZCA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yO1xyXG5cdFx0XHRpZiAoY2FjaGVkLnRhZykgY2FjaGVkID0ge307IC8vaWYgY29uc3RydWN0b3IgY3JlYXRlcyBhIHZpcnR1YWwgZG9tIGVsZW1lbnQsIHVzZSBhIGJsYW5rIG9iamVjdCBhcyB0aGUgYmFzZSBjYWNoZWQgbm9kZSBpbnN0ZWFkIG9mIGNvcHlpbmcgdGhlIHZpcnR1YWwgZWwgKCMyNzcpXHJcblx0XHRcdGNhY2hlZC5ub2RlcyA9IFtdXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGFUeXBlID09PSBBUlJBWSkge1xyXG5cdFx0XHQvL3JlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRpZiAodHlwZS5jYWxsKGRhdGFbaV0pID09PSBBUlJBWSkge1xyXG5cdFx0XHRcdFx0ZGF0YSA9IGRhdGEuY29uY2F0LmFwcGx5KFtdLCBkYXRhKTtcclxuXHRcdFx0XHRcdGktLSAvL2NoZWNrIGN1cnJlbnQgaW5kZXggYWdhaW4gYW5kIGZsYXR0ZW4gdW50aWwgdGhlcmUgYXJlIG5vIG1vcmUgbmVzdGVkIGFycmF5cyBhdCB0aGF0IGluZGV4XHJcblx0XHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0dmFyIG5vZGVzID0gW10sIGludGFjdCA9IGNhY2hlZC5sZW5ndGggPT09IGRhdGEubGVuZ3RoLCBzdWJBcnJheUNvdW50ID0gMDtcclxuXHJcblx0XHRcdC8va2V5cyBhbGdvcml0aG06IHNvcnQgZWxlbWVudHMgd2l0aG91dCByZWNyZWF0aW5nIHRoZW0gaWYga2V5cyBhcmUgcHJlc2VudFxyXG5cdFx0XHQvLzEpIGNyZWF0ZSBhIG1hcCBvZiBhbGwgZXhpc3Rpbmcga2V5cywgYW5kIG1hcmsgYWxsIGZvciBkZWxldGlvblxyXG5cdFx0XHQvLzIpIGFkZCBuZXcga2V5cyB0byBtYXAgYW5kIG1hcmsgdGhlbSBmb3IgYWRkaXRpb25cclxuXHRcdFx0Ly8zKSBpZiBrZXkgZXhpc3RzIGluIG5ldyBsaXN0LCBjaGFuZ2UgYWN0aW9uIGZyb20gZGVsZXRpb24gdG8gYSBtb3ZlXHJcblx0XHRcdC8vNCkgZm9yIGVhY2gga2V5LCBoYW5kbGUgaXRzIGNvcnJlc3BvbmRpbmcgYWN0aW9uIGFzIG1hcmtlZCBpbiBwcmV2aW91cyBzdGVwc1xyXG5cdFx0XHR2YXIgREVMRVRJT04gPSAxLCBJTlNFUlRJT04gPSAyICwgTU9WRSA9IDM7XHJcblx0XHRcdHZhciBleGlzdGluZyA9IHt9LCBzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSBmYWxzZTtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjYWNoZWQubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkW2ldICYmIGNhY2hlZFtpXS5hdHRycyAmJiBjYWNoZWRbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdHNob3VsZE1haW50YWluSWRlbnRpdGllcyA9IHRydWU7XHJcblx0XHRcdFx0XHRleGlzdGluZ1tjYWNoZWRbaV0uYXR0cnMua2V5XSA9IHthY3Rpb246IERFTEVUSU9OLCBpbmRleDogaX1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHZhciBndWlkID0gMFxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMgJiYgZGF0YVtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaiA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRhdGFbal0gJiYgZGF0YVtqXS5hdHRycyAmJiBkYXRhW2pdLmF0dHJzLmtleSA9PSBudWxsKSBkYXRhW2pdLmF0dHJzLmtleSA9IFwiX19taXRocmlsX19cIiArIGd1aWQrK1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGlmIChzaG91bGRNYWludGFpbklkZW50aXRpZXMpIHtcclxuXHRcdFx0XHR2YXIga2V5c0RpZmZlciA9IGZhbHNlXHJcblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoICE9IGNhY2hlZC5sZW5ndGgpIGtleXNEaWZmZXIgPSB0cnVlXHJcblx0XHRcdFx0ZWxzZSBmb3IgKHZhciBpID0gMCwgY2FjaGVkQ2VsbCwgZGF0YUNlbGw7IGNhY2hlZENlbGwgPSBjYWNoZWRbaV0sIGRhdGFDZWxsID0gZGF0YVtpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAoY2FjaGVkQ2VsbC5hdHRycyAmJiBkYXRhQ2VsbC5hdHRycyAmJiBjYWNoZWRDZWxsLmF0dHJzLmtleSAhPSBkYXRhQ2VsbC5hdHRycy5rZXkpIHtcclxuXHRcdFx0XHRcdFx0a2V5c0RpZmZlciA9IHRydWVcclxuXHRcdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGtleXNEaWZmZXIpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoZGF0YVtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGtleSA9IGRhdGFbaV0uYXR0cnMua2V5O1xyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFleGlzdGluZ1trZXldKSBleGlzdGluZ1trZXldID0ge2FjdGlvbjogSU5TRVJUSU9OLCBpbmRleDogaX07XHJcblx0XHRcdFx0XHRcdFx0XHRlbHNlIGV4aXN0aW5nW2tleV0gPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbjogTU9WRSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0aW5kZXg6IGksXHJcblx0XHRcdFx0XHRcdFx0XHRcdGZyb206IGV4aXN0aW5nW2tleV0uaW5kZXgsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQ6IGNhY2hlZC5ub2Rlc1tleGlzdGluZ1trZXldLmluZGV4XSB8fCAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dmFyIGFjdGlvbnMgPSBbXVxyXG5cdFx0XHRcdFx0Zm9yICh2YXIgcHJvcCBpbiBleGlzdGluZykgYWN0aW9ucy5wdXNoKGV4aXN0aW5nW3Byb3BdKVxyXG5cdFx0XHRcdFx0dmFyIGNoYW5nZXMgPSBhY3Rpb25zLnNvcnQoc29ydENoYW5nZXMpO1xyXG5cdFx0XHRcdFx0dmFyIG5ld0NhY2hlZCA9IG5ldyBBcnJheShjYWNoZWQubGVuZ3RoKVxyXG5cdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzID0gY2FjaGVkLm5vZGVzLnNsaWNlKClcclxuXHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY2hhbmdlOyBjaGFuZ2UgPSBjaGFuZ2VzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IERFTEVUSU9OKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2xlYXIoY2FjaGVkW2NoYW5nZS5pbmRleF0ubm9kZXMsIGNhY2hlZFtjaGFuZ2UuaW5kZXhdKTtcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQuc3BsaWNlKGNoYW5nZS5pbmRleCwgMSlcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gSU5TRVJUSU9OKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGR1bW15ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcblx0XHRcdFx0XHRcdFx0ZHVtbXkua2V5ID0gZGF0YVtjaGFuZ2UuaW5kZXhdLmF0dHJzLmtleTtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShkdW1teSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gfHwgbnVsbCk7XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShjaGFuZ2UuaW5kZXgsIDAsIHthdHRyczoge2tleTogZGF0YVtjaGFuZ2UuaW5kZXhdLmF0dHJzLmtleX0sIG5vZGVzOiBbZHVtbXldfSlcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbY2hhbmdlLmluZGV4XSA9IGR1bW15XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBNT1ZFKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdICE9PSBjaGFuZ2UuZWxlbWVudCAmJiBjaGFuZ2UuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoY2hhbmdlLmVsZW1lbnQsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZFtjaGFuZ2UuaW5kZXhdID0gY2FjaGVkW2NoYW5nZS5mcm9tXVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5ub2Rlc1tjaGFuZ2UuaW5kZXhdID0gY2hhbmdlLmVsZW1lbnRcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Y2FjaGVkID0gbmV3Q2FjaGVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvL2VuZCBrZXkgYWxnb3JpdGhtXHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgY2FjaGVDb3VudCA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHQvL2RpZmYgZWFjaCBpdGVtIGluIHRoZSBhcnJheVxyXG5cdFx0XHRcdHZhciBpdGVtID0gYnVpbGQocGFyZW50RWxlbWVudCwgcGFyZW50VGFnLCBjYWNoZWQsIGluZGV4LCBkYXRhW2ldLCBjYWNoZWRbY2FjaGVDb3VudF0sIHNob3VsZFJlYXR0YWNoLCBpbmRleCArIHN1YkFycmF5Q291bnQgfHwgc3ViQXJyYXlDb3VudCwgZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncyk7XHJcblx0XHRcdFx0aWYgKGl0ZW0gPT09IHVuZGVmaW5lZCkgY29udGludWU7XHJcblx0XHRcdFx0aWYgKCFpdGVtLm5vZGVzLmludGFjdCkgaW50YWN0ID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKGl0ZW0uJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdC8vZml4IG9mZnNldCBvZiBuZXh0IGVsZW1lbnQgaWYgaXRlbSB3YXMgYSB0cnVzdGVkIHN0cmluZyB3LyBtb3JlIHRoYW4gb25lIGh0bWwgZWxlbWVudFxyXG5cdFx0XHRcdFx0Ly90aGUgZmlyc3QgY2xhdXNlIGluIHRoZSByZWdleHAgbWF0Y2hlcyBlbGVtZW50c1xyXG5cdFx0XHRcdFx0Ly90aGUgc2Vjb25kIGNsYXVzZSAoYWZ0ZXIgdGhlIHBpcGUpIG1hdGNoZXMgdGV4dCBub2Rlc1xyXG5cdFx0XHRcdFx0c3ViQXJyYXlDb3VudCArPSAoaXRlbS5tYXRjaCgvPFteXFwvXXxcXD5cXHMqW148XS9nKSB8fCBbMF0pLmxlbmd0aFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHN1YkFycmF5Q291bnQgKz0gdHlwZS5jYWxsKGl0ZW0pID09PSBBUlJBWSA/IGl0ZW0ubGVuZ3RoIDogMTtcclxuXHRcdFx0XHRjYWNoZWRbY2FjaGVDb3VudCsrXSA9IGl0ZW1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWludGFjdCkge1xyXG5cdFx0XHRcdC8vZGlmZiB0aGUgYXJyYXkgaXRzZWxmXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Ly91cGRhdGUgdGhlIGxpc3Qgb2YgRE9NIG5vZGVzIGJ5IGNvbGxlY3RpbmcgdGhlIG5vZGVzIGZyb20gZWFjaCBpdGVtXHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChjYWNoZWRbaV0gIT0gbnVsbCkgbm9kZXMucHVzaC5hcHBseShub2RlcywgY2FjaGVkW2ldLm5vZGVzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvL3JlbW92ZSBpdGVtcyBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5IGlmIHRoZSBuZXcgYXJyYXkgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQgb25lXHJcblx0XHRcdFx0Ly9pZiBlcnJvcnMgZXZlciBoYXBwZW4gaGVyZSwgdGhlIGlzc3VlIGlzIG1vc3QgbGlrZWx5IGEgYnVnIGluIHRoZSBjb25zdHJ1Y3Rpb24gb2YgdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlIHNvbWV3aGVyZSBlYXJsaWVyIGluIHRoZSBwcm9ncmFtXHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIG5vZGU7IG5vZGUgPSBjYWNoZWQubm9kZXNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKG5vZGUucGFyZW50Tm9kZSAhPSBudWxsICYmIG5vZGVzLmluZGV4T2Yobm9kZSkgPCAwKSBjbGVhcihbbm9kZV0sIFtjYWNoZWRbaV1dKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggPCBjYWNoZWQubGVuZ3RoKSBjYWNoZWQubGVuZ3RoID0gZGF0YS5sZW5ndGg7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoZGF0YSAhPSBudWxsICYmIGRhdGFUeXBlID09PSBPQkpFQ1QpIHtcclxuXHRcdFx0dmFyIHZpZXdzID0gW10sIGNvbnRyb2xsZXJzID0gW11cclxuXHRcdFx0d2hpbGUgKGRhdGEudmlldykge1xyXG5cdFx0XHRcdHZhciB2aWV3ID0gZGF0YS52aWV3LiRvcmlnaW5hbCB8fCBkYXRhLnZpZXdcclxuXHRcdFx0XHR2YXIgY29udHJvbGxlckluZGV4ID0gbS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImRpZmZcIiAmJiBjYWNoZWQudmlld3MgPyBjYWNoZWQudmlld3MuaW5kZXhPZih2aWV3KSA6IC0xXHJcblx0XHRcdFx0dmFyIGNvbnRyb2xsZXIgPSBjb250cm9sbGVySW5kZXggPiAtMSA/IGNhY2hlZC5jb250cm9sbGVyc1tjb250cm9sbGVySW5kZXhdIDogbmV3IChkYXRhLmNvbnRyb2xsZXIgfHwgbm9vcClcclxuXHRcdFx0XHR2YXIga2V5ID0gZGF0YSAmJiBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMua2V5XHJcblx0XHRcdFx0ZGF0YSA9IHBlbmRpbmdSZXF1ZXN0cyA9PSAwIHx8IChjYWNoZWQgJiYgY2FjaGVkLmNvbnRyb2xsZXJzICYmIGNhY2hlZC5jb250cm9sbGVycy5pbmRleE9mKGNvbnRyb2xsZXIpID4gLTEpID8gZGF0YS52aWV3KGNvbnRyb2xsZXIpIDoge3RhZzogXCJwbGFjZWhvbGRlclwifVxyXG5cdFx0XHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWQ7XHJcblx0XHRcdFx0aWYgKGtleSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkYXRhLmF0dHJzKSBkYXRhLmF0dHJzID0ge31cclxuXHRcdFx0XHRcdGRhdGEuYXR0cnMua2V5ID0ga2V5XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjb250cm9sbGVyLm9udW5sb2FkKSB1bmxvYWRlcnMucHVzaCh7Y29udHJvbGxlcjogY29udHJvbGxlciwgaGFuZGxlcjogY29udHJvbGxlci5vbnVubG9hZH0pXHJcblx0XHRcdFx0dmlld3MucHVzaCh2aWV3KVxyXG5cdFx0XHRcdGNvbnRyb2xsZXJzLnB1c2goY29udHJvbGxlcilcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWRhdGEudGFnICYmIGNvbnRyb2xsZXJzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiQ29tcG9uZW50IHRlbXBsYXRlIG11c3QgcmV0dXJuIGEgdmlydHVhbCBlbGVtZW50LCBub3QgYW4gYXJyYXksIHN0cmluZywgZXRjLlwiKVxyXG5cdFx0XHRpZiAoIWRhdGEuYXR0cnMpIGRhdGEuYXR0cnMgPSB7fTtcclxuXHRcdFx0aWYgKCFjYWNoZWQuYXR0cnMpIGNhY2hlZC5hdHRycyA9IHt9O1xyXG5cclxuXHRcdFx0dmFyIGRhdGFBdHRyS2V5cyA9IE9iamVjdC5rZXlzKGRhdGEuYXR0cnMpXHJcblx0XHRcdHZhciBoYXNLZXlzID0gZGF0YUF0dHJLZXlzLmxlbmd0aCA+IChcImtleVwiIGluIGRhdGEuYXR0cnMgPyAxIDogMClcclxuXHRcdFx0Ly9pZiBhbiBlbGVtZW50IGlzIGRpZmZlcmVudCBlbm91Z2ggZnJvbSB0aGUgb25lIGluIGNhY2hlLCByZWNyZWF0ZSBpdFxyXG5cdFx0XHRpZiAoZGF0YS50YWcgIT0gY2FjaGVkLnRhZyB8fCBkYXRhQXR0cktleXMuc29ydCgpLmpvaW4oKSAhPSBPYmplY3Qua2V5cyhjYWNoZWQuYXR0cnMpLnNvcnQoKS5qb2luKCkgfHwgZGF0YS5hdHRycy5pZCAhPSBjYWNoZWQuYXR0cnMuaWQgfHwgZGF0YS5hdHRycy5rZXkgIT0gY2FjaGVkLmF0dHJzLmtleSB8fCAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImFsbFwiICYmICghY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluICE9PSB0cnVlKSkgfHwgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJkaWZmXCIgJiYgY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluID09PSBmYWxzZSkpIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCkgY2xlYXIoY2FjaGVkLm5vZGVzKTtcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgdHlwZW9mIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID09PSBGVU5DVElPTikgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQoKVxyXG5cdFx0XHRcdGlmIChjYWNoZWQuY29udHJvbGxlcnMpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY2FjaGVkLmNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjb250cm9sbGVyLm9udW5sb2FkID09PSBGVU5DVElPTikgY29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZS5jYWxsKGRhdGEudGFnKSAhPSBTVFJJTkcpIHJldHVybjtcclxuXHJcblx0XHRcdHZhciBub2RlLCBpc05ldyA9IGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDA7XHJcblx0XHRcdGlmIChkYXRhLmF0dHJzLnhtbG5zKSBuYW1lc3BhY2UgPSBkYXRhLmF0dHJzLnhtbG5zO1xyXG5cdFx0XHRlbHNlIGlmIChkYXRhLnRhZyA9PT0gXCJzdmdcIikgbmFtZXNwYWNlID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiO1xyXG5cdFx0XHRlbHNlIGlmIChkYXRhLnRhZyA9PT0gXCJtYXRoXCIpIG5hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTFwiO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKGlzTmV3KSB7XHJcblx0XHRcdFx0aWYgKGRhdGEuYXR0cnMuaXMpIG5vZGUgPSBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCA/ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKSA6ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBkYXRhLnRhZywgZGF0YS5hdHRycy5pcyk7XHJcblx0XHRcdFx0ZWxzZSBub2RlID0gbmFtZXNwYWNlID09PSB1bmRlZmluZWQgPyAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZykgOiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcpO1xyXG5cdFx0XHRcdGNhY2hlZCA9IHtcclxuXHRcdFx0XHRcdHRhZzogZGF0YS50YWcsXHJcblx0XHRcdFx0XHQvL3NldCBhdHRyaWJ1dGVzIGZpcnN0LCB0aGVuIGNyZWF0ZSBjaGlsZHJlblxyXG5cdFx0XHRcdFx0YXR0cnM6IGhhc0tleXMgPyBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCB7fSwgbmFtZXNwYWNlKSA6IGRhdGEuYXR0cnMsXHJcblx0XHRcdFx0XHRjaGlsZHJlbjogZGF0YS5jaGlsZHJlbiAhPSBudWxsICYmIGRhdGEuY2hpbGRyZW4ubGVuZ3RoID4gMCA/XHJcblx0XHRcdFx0XHRcdGJ1aWxkKG5vZGUsIGRhdGEudGFnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZGF0YS5jaGlsZHJlbiwgY2FjaGVkLmNoaWxkcmVuLCB0cnVlLCAwLCBkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKSA6XHJcblx0XHRcdFx0XHRcdGRhdGEuY2hpbGRyZW4sXHJcblx0XHRcdFx0XHRub2RlczogW25vZGVdXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRjYWNoZWQudmlld3MgPSB2aWV3c1xyXG5cdFx0XHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCAmJiBjb250cm9sbGVyLm9udW5sb2FkLiRvbGQpIGNvbnRyb2xsZXIub251bmxvYWQgPSBjb250cm9sbGVyLm9udW5sb2FkLiRvbGRcclxuXHRcdFx0XHRcdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyAmJiBjb250cm9sbGVyLm9udW5sb2FkKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIG9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZFxyXG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQgPSBub29wXHJcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZC4kb2xkID0gb251bmxvYWRcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNoaWxkcmVuICYmICFjYWNoZWQuY2hpbGRyZW4ubm9kZXMpIGNhY2hlZC5jaGlsZHJlbi5ub2RlcyA9IFtdO1xyXG5cdFx0XHRcdC8vZWRnZSBjYXNlOiBzZXR0aW5nIHZhbHVlIG9uIDxzZWxlY3Q+IGRvZXNuJ3Qgd29yayBiZWZvcmUgY2hpbGRyZW4gZXhpc3QsIHNvIHNldCBpdCBhZ2FpbiBhZnRlciBjaGlsZHJlbiBoYXZlIGJlZW4gY3JlYXRlZFxyXG5cdFx0XHRcdGlmIChkYXRhLnRhZyA9PT0gXCJzZWxlY3RcIiAmJiBcInZhbHVlXCIgaW4gZGF0YS5hdHRycykgc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywge3ZhbHVlOiBkYXRhLmF0dHJzLnZhbHVlfSwge30sIG5hbWVzcGFjZSk7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdG5vZGUgPSBjYWNoZWQubm9kZXNbMF07XHJcblx0XHRcdFx0aWYgKGhhc0tleXMpIHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMsIGNhY2hlZC5hdHRycywgbmFtZXNwYWNlKTtcclxuXHRcdFx0XHRjYWNoZWQuY2hpbGRyZW4gPSBidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgZmFsc2UsIDAsIGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2Rlcy5pbnRhY3QgPSB0cnVlO1xyXG5cdFx0XHRcdGlmIChjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdFx0XHRjYWNoZWQuY29udHJvbGxlcnMgPSBjb250cm9sbGVyc1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoc2hvdWxkUmVhdHRhY2ggPT09IHRydWUgJiYgbm9kZSAhPSBudWxsKSBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2RlLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdH1cclxuXHRcdFx0Ly9zY2hlZHVsZSBjb25maWdzIHRvIGJlIGNhbGxlZC4gVGhleSBhcmUgY2FsbGVkIGFmdGVyIGBidWlsZGAgZmluaXNoZXMgcnVubmluZ1xyXG5cdFx0XHRpZiAodHlwZW9mIGRhdGEuYXR0cnNbXCJjb25maWdcIl0gPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0dmFyIGNvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0IHx8IHt9O1xyXG5cclxuXHRcdFx0XHQvLyBiaW5kXHJcblx0XHRcdFx0dmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZGF0YSwgYXJncykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZGF0YS5hdHRyc1tcImNvbmZpZ1wiXS5hcHBseShkYXRhLCBhcmdzKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0Y29uZmlncy5wdXNoKGNhbGxiYWNrKGRhdGEsIFtub2RlLCAhaXNOZXcsIGNvbnRleHQsIGNhY2hlZF0pKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0eXBlb2YgZGF0YSAhPSBGVU5DVElPTikge1xyXG5cdFx0XHQvL2hhbmRsZSB0ZXh0IG5vZGVzXHJcblx0XHRcdHZhciBub2RlcztcclxuXHRcdFx0aWYgKGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDApIHtcclxuXHRcdFx0XHRpZiAoZGF0YS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRcdFx0bm9kZXMgPSBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV07XHJcblx0XHRcdFx0XHRpZiAoIXBhcmVudEVsZW1lbnQubm9kZU5hbWUubWF0Y2godm9pZEVsZW1lbnRzKSkgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZXNbMF0sIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gXCJzdHJpbmcgbnVtYmVyIGJvb2xlYW5cIi5pbmRleE9mKHR5cGVvZiBkYXRhKSA+IC0xID8gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSkgOiBkYXRhO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLnZhbHVlT2YoKSAhPT0gZGF0YS52YWx1ZU9mKCkgfHwgc2hvdWxkUmVhdHRhY2ggPT09IHRydWUpIHtcclxuXHRcdFx0XHRub2RlcyA9IGNhY2hlZC5ub2RlcztcclxuXHRcdFx0XHRpZiAoIWVkaXRhYmxlIHx8IGVkaXRhYmxlICE9PSAkZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdFx0Y2xlYXIobm9kZXMsIGNhY2hlZCk7XHJcblx0XHRcdFx0XHRcdG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHQvL2Nvcm5lciBjYXNlOiByZXBsYWNpbmcgdGhlIG5vZGVWYWx1ZSBvZiBhIHRleHQgbm9kZSB0aGF0IGlzIGEgY2hpbGQgb2YgYSB0ZXh0YXJlYS9jb250ZW50ZWRpdGFibGUgZG9lc24ndCB3b3JrXHJcblx0XHRcdFx0XHRcdC8vd2UgbmVlZCB0byB1cGRhdGUgdGhlIHZhbHVlIHByb3BlcnR5IG9mIHRoZSBwYXJlbnQgdGV4dGFyZWEgb3IgdGhlIGlubmVySFRNTCBvZiB0aGUgY29udGVudGVkaXRhYmxlIGVsZW1lbnQgaW5zdGVhZFxyXG5cdFx0XHRcdFx0XHRpZiAocGFyZW50VGFnID09PSBcInRleHRhcmVhXCIpIHBhcmVudEVsZW1lbnQudmFsdWUgPSBkYXRhO1xyXG5cdFx0XHRcdFx0XHRlbHNlIGlmIChlZGl0YWJsZSkgZWRpdGFibGUuaW5uZXJIVE1MID0gZGF0YTtcclxuXHRcdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKG5vZGVzWzBdLm5vZGVUeXBlID09PSAxIHx8IG5vZGVzLmxlbmd0aCA+IDEpIHsgLy93YXMgYSB0cnVzdGVkIHN0cmluZ1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpO1xyXG5cdFx0XHRcdFx0XHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2Rlc1swXSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKTtcclxuXHRcdFx0XHRcdFx0XHRub2Rlc1swXS5ub2RlVmFsdWUgPSBkYXRhXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSk7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGNhY2hlZC5ub2Rlcy5pbnRhY3QgPSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHRmdW5jdGlvbiBzb3J0Q2hhbmdlcyhhLCBiKSB7cmV0dXJuIGEuYWN0aW9uIC0gYi5hY3Rpb24gfHwgYS5pbmRleCAtIGIuaW5kZXh9XHJcblx0ZnVuY3Rpb24gc2V0QXR0cmlidXRlcyhub2RlLCB0YWcsIGRhdGFBdHRycywgY2FjaGVkQXR0cnMsIG5hbWVzcGFjZSkge1xyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gZGF0YUF0dHJzKSB7XHJcblx0XHRcdHZhciBkYXRhQXR0ciA9IGRhdGFBdHRyc1thdHRyTmFtZV07XHJcblx0XHRcdHZhciBjYWNoZWRBdHRyID0gY2FjaGVkQXR0cnNbYXR0ck5hbWVdO1xyXG5cdFx0XHRpZiAoIShhdHRyTmFtZSBpbiBjYWNoZWRBdHRycykgfHwgKGNhY2hlZEF0dHIgIT09IGRhdGFBdHRyKSkge1xyXG5cdFx0XHRcdGNhY2hlZEF0dHJzW2F0dHJOYW1lXSA9IGRhdGFBdHRyO1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvL2Bjb25maWdgIGlzbid0IGEgcmVhbCBhdHRyaWJ1dGVzLCBzbyBpZ25vcmUgaXRcclxuXHRcdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gXCJjb25maWdcIiB8fCBhdHRyTmFtZSA9PSBcImtleVwiKSBjb250aW51ZTtcclxuXHRcdFx0XHRcdC8vaG9vayBldmVudCBoYW5kbGVycyB0byB0aGUgYXV0by1yZWRyYXdpbmcgc3lzdGVtXHJcblx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgZGF0YUF0dHIgPT09IEZVTkNUSU9OICYmIGF0dHJOYW1lLmluZGV4T2YoXCJvblwiKSA9PT0gMCkge1xyXG5cdFx0XHRcdFx0XHRub2RlW2F0dHJOYW1lXSA9IGF1dG9yZWRyYXcoZGF0YUF0dHIsIG5vZGUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBgc3R5bGU6IHsuLi59YFxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwic3R5bGVcIiAmJiBkYXRhQXR0ciAhPSBudWxsICYmIHR5cGUuY2FsbChkYXRhQXR0cikgPT09IE9CSkVDVCkge1xyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBydWxlIGluIGRhdGFBdHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNhY2hlZEF0dHIgPT0gbnVsbCB8fCBjYWNoZWRBdHRyW3J1bGVdICE9PSBkYXRhQXR0cltydWxlXSkgbm9kZS5zdHlsZVtydWxlXSA9IGRhdGFBdHRyW3J1bGVdXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcnVsZSBpbiBjYWNoZWRBdHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCEocnVsZSBpbiBkYXRhQXR0cikpIG5vZGUuc3R5bGVbcnVsZV0gPSBcIlwiXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIFNWR1xyXG5cdFx0XHRcdFx0ZWxzZSBpZiAobmFtZXNwYWNlICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBcImhyZWZcIikgbm9kZS5zZXRBdHRyaWJ1dGVOUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiwgXCJocmVmXCIsIGRhdGFBdHRyKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwiY2xhc3NOYW1lXCIpIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgZGF0YUF0dHIpO1xyXG5cdFx0XHRcdFx0XHRlbHNlIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIGNhc2VzIHRoYXQgYXJlIHByb3BlcnRpZXMgKGJ1dCBpZ25vcmUgY2FzZXMgd2hlcmUgd2Ugc2hvdWxkIHVzZSBzZXRBdHRyaWJ1dGUgaW5zdGVhZClcclxuXHRcdFx0XHRcdC8vLSBsaXN0IGFuZCBmb3JtIGFyZSB0eXBpY2FsbHkgdXNlZCBhcyBzdHJpbmdzLCBidXQgYXJlIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4ganNcclxuXHRcdFx0XHRcdC8vLSB3aGVuIHVzaW5nIENTUyBzZWxlY3RvcnMgKGUuZy4gYG0oXCJbc3R5bGU9JyddXCIpYCksIHN0eWxlIGlzIHVzZWQgYXMgYSBzdHJpbmcsIGJ1dCBpdCdzIGFuIG9iamVjdCBpbiBqc1xyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgaW4gbm9kZSAmJiAhKGF0dHJOYW1lID09PSBcImxpc3RcIiB8fCBhdHRyTmFtZSA9PT0gXCJzdHlsZVwiIHx8IGF0dHJOYW1lID09PSBcImZvcm1cIiB8fCBhdHRyTmFtZSA9PT0gXCJ0eXBlXCIgfHwgYXR0ck5hbWUgPT09IFwid2lkdGhcIiB8fCBhdHRyTmFtZSA9PT0gXCJoZWlnaHRcIikpIHtcclxuXHRcdFx0XHRcdFx0Ly8jMzQ4IGRvbid0IHNldCB0aGUgdmFsdWUgaWYgbm90IG5lZWRlZCBvdGhlcndpc2UgY3Vyc29yIHBsYWNlbWVudCBicmVha3MgaW4gQ2hyb21lXHJcblx0XHRcdFx0XHRcdGlmICh0YWcgIT09IFwiaW5wdXRcIiB8fCBub2RlW2F0dHJOYW1lXSAhPT0gZGF0YUF0dHIpIG5vZGVbYXR0ck5hbWVdID0gZGF0YUF0dHJcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Ugbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRhdGFBdHRyKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0Ly9zd2FsbG93IElFJ3MgaW52YWxpZCBhcmd1bWVudCBlcnJvcnMgdG8gbWltaWMgSFRNTCdzIGZhbGxiYWNrLXRvLWRvaW5nLW5vdGhpbmctb24taW52YWxpZC1hdHRyaWJ1dGVzIGJlaGF2aW9yXHJcblx0XHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJJbnZhbGlkIGFyZ3VtZW50XCIpIDwgMCkgdGhyb3cgZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvLyMzNDggZGF0YUF0dHIgbWF5IG5vdCBiZSBhIHN0cmluZywgc28gdXNlIGxvb3NlIGNvbXBhcmlzb24gKGRvdWJsZSBlcXVhbCkgaW5zdGVhZCBvZiBzdHJpY3QgKHRyaXBsZSBlcXVhbClcclxuXHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwidmFsdWVcIiAmJiB0YWcgPT09IFwiaW5wdXRcIiAmJiBub2RlLnZhbHVlICE9IGRhdGFBdHRyKSB7XHJcblx0XHRcdFx0bm9kZS52YWx1ZSA9IGRhdGFBdHRyXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBjYWNoZWRBdHRyc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBjbGVhcihub2RlcywgY2FjaGVkKSB7XHJcblx0XHRmb3IgKHZhciBpID0gbm9kZXMubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcclxuXHRcdFx0aWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLnBhcmVudE5vZGUpIHtcclxuXHRcdFx0XHR0cnkge25vZGVzW2ldLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZXNbaV0pfVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7fSAvL2lnbm9yZSBpZiB0aGlzIGZhaWxzIGR1ZSB0byBvcmRlciBvZiBldmVudHMgKHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIxOTI2MDgzL2ZhaWxlZC10by1leGVjdXRlLXJlbW92ZWNoaWxkLW9uLW5vZGUpXHJcblx0XHRcdFx0Y2FjaGVkID0gW10uY29uY2F0KGNhY2hlZCk7XHJcblx0XHRcdFx0aWYgKGNhY2hlZFtpXSkgdW5sb2FkKGNhY2hlZFtpXSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKG5vZGVzLmxlbmd0aCAhPSAwKSBub2Rlcy5sZW5ndGggPSAwXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHVubG9hZChjYWNoZWQpIHtcclxuXHRcdGlmIChjYWNoZWQuY29uZmlnQ29udGV4dCAmJiB0eXBlb2YgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKCk7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNhY2hlZC5jb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjb250cm9sbGVyLm9udW5sb2FkID09PSBGVU5DVElPTikgY29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jaGlsZHJlbikge1xyXG5cdFx0XHRpZiAodHlwZS5jYWxsKGNhY2hlZC5jaGlsZHJlbikgPT09IEFSUkFZKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNoaWxkOyBjaGlsZCA9IGNhY2hlZC5jaGlsZHJlbltpXTsgaSsrKSB1bmxvYWQoY2hpbGQpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLmNoaWxkcmVuLnRhZykgdW5sb2FkKGNhY2hlZC5jaGlsZHJlbilcclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSkge1xyXG5cdFx0dmFyIG5leHRTaWJsaW5nID0gcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XTtcclxuXHRcdGlmIChuZXh0U2libGluZykge1xyXG5cdFx0XHR2YXIgaXNFbGVtZW50ID0gbmV4dFNpYmxpbmcubm9kZVR5cGUgIT0gMTtcclxuXHRcdFx0dmFyIHBsYWNlaG9sZGVyID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG5cdFx0XHRpZiAoaXNFbGVtZW50KSB7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIG5leHRTaWJsaW5nIHx8IG51bGwpO1xyXG5cdFx0XHRcdHBsYWNlaG9sZGVyLmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWJlZ2luXCIsIGRhdGEpO1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXIpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBuZXh0U2libGluZy5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBwYXJlbnRFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBkYXRhKTtcclxuXHRcdHZhciBub2RlcyA9IFtdO1xyXG5cdFx0d2hpbGUgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gIT09IG5leHRTaWJsaW5nKSB7XHJcblx0XHRcdG5vZGVzLnB1c2gocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSk7XHJcblx0XHRcdGluZGV4KytcclxuXHRcdH1cclxuXHRcdHJldHVybiBub2Rlc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBhdXRvcmVkcmF3KGNhbGxiYWNrLCBvYmplY3QpIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIik7XHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0XHR0cnkge3JldHVybiBjYWxsYmFjay5jYWxsKG9iamVjdCwgZSl9XHJcblx0XHRcdGZpbmFsbHkge1xyXG5cdFx0XHRcdGVuZEZpcnN0Q29tcHV0YXRpb24oKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgaHRtbDtcclxuXHR2YXIgZG9jdW1lbnROb2RlID0ge1xyXG5cdFx0YXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0aWYgKGh0bWwgPT09IHVuZGVmaW5lZCkgaHRtbCA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtcclxuXHRcdFx0aWYgKCRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAhPT0gbm9kZSkge1xyXG5cdFx0XHRcdCRkb2N1bWVudC5yZXBsYWNlQ2hpbGQobm9kZSwgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlICRkb2N1bWVudC5hcHBlbmRDaGlsZChub2RlKTtcclxuXHRcdFx0dGhpcy5jaGlsZE5vZGVzID0gJGRvY3VtZW50LmNoaWxkTm9kZXNcclxuXHRcdH0sXHJcblx0XHRpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0dGhpcy5hcHBlbmRDaGlsZChub2RlKVxyXG5cdFx0fSxcclxuXHRcdGNoaWxkTm9kZXM6IFtdXHJcblx0fTtcclxuXHR2YXIgbm9kZUNhY2hlID0gW10sIGNlbGxDYWNoZSA9IHt9O1xyXG5cdG0ucmVuZGVyID0gZnVuY3Rpb24ocm9vdCwgY2VsbCwgZm9yY2VSZWNyZWF0aW9uKSB7XHJcblx0XHR2YXIgY29uZmlncyA9IFtdO1xyXG5cdFx0aWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIERPTSBlbGVtZW50IGJlaW5nIHBhc3NlZCB0byBtLnJvdXRlL20ubW91bnQvbS5yZW5kZXIgaXMgbm90IHVuZGVmaW5lZC5cIik7XHJcblx0XHR2YXIgaWQgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdCk7XHJcblx0XHR2YXIgaXNEb2N1bWVudFJvb3QgPSByb290ID09PSAkZG9jdW1lbnQ7XHJcblx0XHR2YXIgbm9kZSA9IGlzRG9jdW1lbnRSb290IHx8IHJvb3QgPT09ICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgPyBkb2N1bWVudE5vZGUgOiByb290O1xyXG5cdFx0aWYgKGlzRG9jdW1lbnRSb290ICYmIGNlbGwudGFnICE9IFwiaHRtbFwiKSBjZWxsID0ge3RhZzogXCJodG1sXCIsIGF0dHJzOiB7fSwgY2hpbGRyZW46IGNlbGx9O1xyXG5cdFx0aWYgKGNlbGxDYWNoZVtpZF0gPT09IHVuZGVmaW5lZCkgY2xlYXIobm9kZS5jaGlsZE5vZGVzKTtcclxuXHRcdGlmIChmb3JjZVJlY3JlYXRpb24gPT09IHRydWUpIHJlc2V0KHJvb3QpO1xyXG5cdFx0Y2VsbENhY2hlW2lkXSA9IGJ1aWxkKG5vZGUsIG51bGwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjZWxsLCBjZWxsQ2FjaGVbaWRdLCBmYWxzZSwgMCwgbnVsbCwgdW5kZWZpbmVkLCBjb25maWdzKTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb25maWdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSBjb25maWdzW2ldKClcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIGdldENlbGxDYWNoZUtleShlbGVtZW50KSB7XHJcblx0XHR2YXIgaW5kZXggPSBub2RlQ2FjaGUuaW5kZXhPZihlbGVtZW50KTtcclxuXHRcdHJldHVybiBpbmRleCA8IDAgPyBub2RlQ2FjaGUucHVzaChlbGVtZW50KSAtIDEgOiBpbmRleFxyXG5cdH1cclxuXHJcblx0bS50cnVzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHR2YWx1ZSA9IG5ldyBTdHJpbmcodmFsdWUpO1xyXG5cdFx0dmFsdWUuJHRydXN0ZWQgPSB0cnVlO1xyXG5cdFx0cmV0dXJuIHZhbHVlXHJcblx0fTtcclxuXHJcblx0ZnVuY3Rpb24gZ2V0dGVyc2V0dGVyKHN0b3JlKSB7XHJcblx0XHR2YXIgcHJvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCkgc3RvcmUgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHJldHVybiBzdG9yZVxyXG5cdFx0fTtcclxuXHJcblx0XHRwcm9wLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblxyXG5cdG0ucHJvcCA9IGZ1bmN0aW9uIChzdG9yZSkge1xyXG5cdFx0Ly9ub3RlOiB1c2luZyBub24tc3RyaWN0IGVxdWFsaXR5IGNoZWNrIGhlcmUgYmVjYXVzZSB3ZSdyZSBjaGVja2luZyBpZiBzdG9yZSBpcyBudWxsIE9SIHVuZGVmaW5lZFxyXG5cdFx0aWYgKCgoc3RvcmUgIT0gbnVsbCAmJiB0eXBlLmNhbGwoc3RvcmUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBzdG9yZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiBzdG9yZS50aGVuID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRyZXR1cm4gcHJvcGlmeShzdG9yZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZ2V0dGVyc2V0dGVyKHN0b3JlKVxyXG5cdH07XHJcblxyXG5cdHZhciByb290cyA9IFtdLCBjb21wb25lbnRzID0gW10sIGNvbnRyb2xsZXJzID0gW10sIGxhc3RSZWRyYXdJZCA9IG51bGwsIGxhc3RSZWRyYXdDYWxsVGltZSA9IDAsIGNvbXB1dGVQcmVSZWRyYXdIb29rID0gbnVsbCwgY29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbCwgcHJldmVudGVkID0gZmFsc2UsIHRvcENvbXBvbmVudCwgdW5sb2FkZXJzID0gW107XHJcblx0dmFyIEZSQU1FX0JVREdFVCA9IDE2OyAvLzYwIGZyYW1lcyBwZXIgc2Vjb25kID0gMSBjYWxsIHBlciAxNiBtc1xyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIGFyZ3MpIHtcclxuXHRcdHZhciBjb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiAoY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcCkuYXBwbHkodGhpcywgYXJncykgfHwgdGhpc1xyXG5cdFx0fVxyXG5cdFx0dmFyIHZpZXcgPSBmdW5jdGlvbihjdHJsKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgYXJncyA9IGFyZ3MuY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcclxuXHRcdFx0cmV0dXJuIGNvbXBvbmVudC52aWV3LmFwcGx5KGNvbXBvbmVudCwgYXJncyA/IFtjdHJsXS5jb25jYXQoYXJncykgOiBbY3RybF0pXHJcblx0XHR9XHJcblx0XHR2aWV3LiRvcmlnaW5hbCA9IGNvbXBvbmVudC52aWV3XHJcblx0XHR2YXIgb3V0cHV0ID0ge2NvbnRyb2xsZXI6IGNvbnRyb2xsZXIsIHZpZXc6IHZpZXd9XHJcblx0XHRpZiAoYXJnc1swXSAmJiBhcmdzWzBdLmtleSAhPSBudWxsKSBvdXRwdXQuYXR0cnMgPSB7a2V5OiBhcmdzWzBdLmtleX1cclxuXHRcdHJldHVybiBvdXRwdXRcclxuXHR9XHJcblx0bS5jb21wb25lbnQgPSBmdW5jdGlvbihjb21wb25lbnQpIHtcclxuXHRcdHJldHVybiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXHJcblx0fVxyXG5cdG0ubW91bnQgPSBtLm1vZHVsZSA9IGZ1bmN0aW9uKHJvb3QsIGNvbXBvbmVudCkge1xyXG5cdFx0aWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2UgZW5zdXJlIHRoZSBET00gZWxlbWVudCBleGlzdHMgYmVmb3JlIHJlbmRlcmluZyBhIHRlbXBsYXRlIGludG8gaXQuXCIpO1xyXG5cdFx0dmFyIGluZGV4ID0gcm9vdHMuaW5kZXhPZihyb290KTtcclxuXHRcdGlmIChpbmRleCA8IDApIGluZGV4ID0gcm9vdHMubGVuZ3RoO1xyXG5cdFx0XHJcblx0XHR2YXIgaXNQcmV2ZW50ZWQgPSBmYWxzZTtcclxuXHRcdHZhciBldmVudCA9IHtwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlzUHJldmVudGVkID0gdHJ1ZTtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsO1xyXG5cdFx0fX07XHJcblx0XHRmb3IgKHZhciBpID0gMCwgdW5sb2FkZXI7IHVubG9hZGVyID0gdW5sb2FkZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0dW5sb2FkZXIuaGFuZGxlci5jYWxsKHVubG9hZGVyLmNvbnRyb2xsZXIsIGV2ZW50KVxyXG5cdFx0XHR1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGlzUHJldmVudGVkKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCB1bmxvYWRlcjsgdW5sb2FkZXIgPSB1bmxvYWRlcnNbaV07IGkrKykgdW5sb2FkZXIuY29udHJvbGxlci5vbnVubG9hZCA9IHVubG9hZGVyLmhhbmRsZXJcclxuXHRcdH1cclxuXHRcdGVsc2UgdW5sb2FkZXJzID0gW11cclxuXHRcdFxyXG5cdFx0aWYgKGNvbnRyb2xsZXJzW2luZGV4XSAmJiB0eXBlb2YgY29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQoZXZlbnQpXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmICghaXNQcmV2ZW50ZWQpIHtcclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJhbGxcIik7XHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0XHRyb290c1tpbmRleF0gPSByb290O1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIGNvbXBvbmVudCA9IHN1YmNvbXBvbmVudChjb21wb25lbnQsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSlcclxuXHRcdFx0dmFyIGN1cnJlbnRDb21wb25lbnQgPSB0b3BDb21wb25lbnQgPSBjb21wb25lbnQgPSBjb21wb25lbnQgfHwge2NvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge319O1xyXG5cdFx0XHR2YXIgY29uc3RydWN0b3IgPSBjb21wb25lbnQuY29udHJvbGxlciB8fCBub29wXHJcblx0XHRcdHZhciBjb250cm9sbGVyID0gbmV3IGNvbnN0cnVjdG9yO1xyXG5cdFx0XHQvL2NvbnRyb2xsZXJzIG1heSBjYWxsIG0ubW91bnQgcmVjdXJzaXZlbHkgKHZpYSBtLnJvdXRlIHJlZGlyZWN0cywgZm9yIGV4YW1wbGUpXHJcblx0XHRcdC8vdGhpcyBjb25kaXRpb25hbCBlbnN1cmVzIG9ubHkgdGhlIGxhc3QgcmVjdXJzaXZlIG0ubW91bnQgY2FsbCBpcyBhcHBsaWVkXHJcblx0XHRcdGlmIChjdXJyZW50Q29tcG9uZW50ID09PSB0b3BDb21wb25lbnQpIHtcclxuXHRcdFx0XHRjb250cm9sbGVyc1tpbmRleF0gPSBjb250cm9sbGVyO1xyXG5cdFx0XHRcdGNvbXBvbmVudHNbaW5kZXhdID0gY29tcG9uZW50XHJcblx0XHRcdH1cclxuXHRcdFx0ZW5kRmlyc3RDb21wdXRhdGlvbigpO1xyXG5cdFx0XHRyZXR1cm4gY29udHJvbGxlcnNbaW5kZXhdXHJcblx0XHR9XHJcblx0fTtcclxuXHR2YXIgcmVkcmF3aW5nID0gZmFsc2VcclxuXHRtLnJlZHJhdyA9IGZ1bmN0aW9uKGZvcmNlKSB7XHJcblx0XHRpZiAocmVkcmF3aW5nKSByZXR1cm5cclxuXHRcdHJlZHJhd2luZyA9IHRydWVcclxuXHRcdC8vbGFzdFJlZHJhd0lkIGlzIGEgcG9zaXRpdmUgbnVtYmVyIGlmIGEgc2Vjb25kIHJlZHJhdyBpcyByZXF1ZXN0ZWQgYmVmb3JlIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG5cdFx0Ly9sYXN0UmVkcmF3SUQgaXMgbnVsbCBpZiBpdCdzIHRoZSBmaXJzdCByZWRyYXcgYW5kIG5vdCBhbiBldmVudCBoYW5kbGVyXHJcblx0XHRpZiAobGFzdFJlZHJhd0lkICYmIGZvcmNlICE9PSB0cnVlKSB7XHJcblx0XHRcdC8vd2hlbiBzZXRUaW1lb3V0OiBvbmx5IHJlc2NoZWR1bGUgcmVkcmF3IGlmIHRpbWUgYmV0d2VlbiBub3cgYW5kIHByZXZpb3VzIHJlZHJhdyBpcyBiaWdnZXIgdGhhbiBhIGZyYW1lLCBvdGhlcndpc2Uga2VlcCBjdXJyZW50bHkgc2NoZWR1bGVkIHRpbWVvdXRcclxuXHRcdFx0Ly93aGVuIHJBRjogYWx3YXlzIHJlc2NoZWR1bGUgcmVkcmF3XHJcblx0XHRcdGlmICgkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IG5ldyBEYXRlIC0gbGFzdFJlZHJhd0NhbGxUaW1lID4gRlJBTUVfQlVER0VUKSB7XHJcblx0XHRcdFx0aWYgKGxhc3RSZWRyYXdJZCA+IDApICRjYW5jZWxBbmltYXRpb25GcmFtZShsYXN0UmVkcmF3SWQpO1xyXG5cdFx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVkcmF3LCBGUkFNRV9CVURHRVQpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZWRyYXcoKTtcclxuXHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtsYXN0UmVkcmF3SWQgPSBudWxsfSwgRlJBTUVfQlVER0VUKVxyXG5cdFx0fVxyXG5cdFx0cmVkcmF3aW5nID0gZmFsc2VcclxuXHR9O1xyXG5cdG0ucmVkcmF3LnN0cmF0ZWd5ID0gbS5wcm9wKCk7XHJcblx0ZnVuY3Rpb24gcmVkcmF3KCkge1xyXG5cdFx0aWYgKGNvbXB1dGVQcmVSZWRyYXdIb29rKSB7XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rKClcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBudWxsXHJcblx0XHR9XHJcblx0XHRmb3IgKHZhciBpID0gMCwgcm9vdDsgcm9vdCA9IHJvb3RzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGNvbnRyb2xsZXJzW2ldKSB7XHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIgJiYgY29tcG9uZW50c1tpXS5jb250cm9sbGVyLiQkYXJncyA/IFtjb250cm9sbGVyc1tpXV0uY29uY2F0KGNvbXBvbmVudHNbaV0uY29udHJvbGxlci4kJGFyZ3MpIDogW2NvbnRyb2xsZXJzW2ldXVxyXG5cdFx0XHRcdG0ucmVuZGVyKHJvb3QsIGNvbXBvbmVudHNbaV0udmlldyA/IGNvbXBvbmVudHNbaV0udmlldyhjb250cm9sbGVyc1tpXSwgYXJncykgOiBcIlwiKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvL2FmdGVyIHJlbmRlcmluZyB3aXRoaW4gYSByb3V0ZWQgY29udGV4dCwgd2UgbmVlZCB0byBzY3JvbGwgYmFjayB0byB0aGUgdG9wLCBhbmQgZmV0Y2ggdGhlIGRvY3VtZW50IHRpdGxlIGZvciBoaXN0b3J5LnB1c2hTdGF0ZVxyXG5cdFx0aWYgKGNvbXB1dGVQb3N0UmVkcmF3SG9vaykge1xyXG5cdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2soKTtcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0bGFzdFJlZHJhd0lkID0gbnVsbDtcclxuXHRcdGxhc3RSZWRyYXdDYWxsVGltZSA9IG5ldyBEYXRlO1xyXG5cdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0fVxyXG5cclxuXHR2YXIgcGVuZGluZ1JlcXVlc3RzID0gMDtcclxuXHRtLnN0YXJ0Q29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtwZW5kaW5nUmVxdWVzdHMrK307XHJcblx0bS5lbmRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cGVuZGluZ1JlcXVlc3RzID0gTWF0aC5tYXgocGVuZGluZ1JlcXVlc3RzIC0gMSwgMCk7XHJcblx0XHRpZiAocGVuZGluZ1JlcXVlc3RzID09PSAwKSBtLnJlZHJhdygpXHJcblx0fTtcclxuXHR2YXIgZW5kRmlyc3RDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJub25lXCIpIHtcclxuXHRcdFx0cGVuZGluZ1JlcXVlc3RzLS1cclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0XHR9XHJcblx0XHRlbHNlIG0uZW5kQ29tcHV0YXRpb24oKTtcclxuXHR9XHJcblxyXG5cdG0ud2l0aEF0dHIgPSBmdW5jdGlvbihwcm9wLCB3aXRoQXR0ckNhbGxiYWNrKSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0dmFyIGN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgdGhpcztcclxuXHRcdFx0d2l0aEF0dHJDYWxsYmFjayhwcm9wIGluIGN1cnJlbnRUYXJnZXQgPyBjdXJyZW50VGFyZ2V0W3Byb3BdIDogY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUocHJvcCkpXHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0Ly9yb3V0aW5nXHJcblx0dmFyIG1vZGVzID0ge3BhdGhuYW1lOiBcIlwiLCBoYXNoOiBcIiNcIiwgc2VhcmNoOiBcIj9cIn07XHJcblx0dmFyIHJlZGlyZWN0ID0gbm9vcCwgcm91dGVQYXJhbXMsIGN1cnJlbnRSb3V0ZSwgaXNEZWZhdWx0Um91dGUgPSBmYWxzZTtcclxuXHRtLnJvdXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHQvL20ucm91dGUoKVxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBjdXJyZW50Um91dGU7XHJcblx0XHQvL20ucm91dGUoZWwsIGRlZmF1bHRSb3V0ZSwgcm91dGVzKVxyXG5cdFx0ZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiB0eXBlLmNhbGwoYXJndW1lbnRzWzFdKSA9PT0gU1RSSU5HKSB7XHJcblx0XHRcdHZhciByb290ID0gYXJndW1lbnRzWzBdLCBkZWZhdWx0Um91dGUgPSBhcmd1bWVudHNbMV0sIHJvdXRlciA9IGFyZ3VtZW50c1syXTtcclxuXHRcdFx0cmVkaXJlY3QgPSBmdW5jdGlvbihzb3VyY2UpIHtcclxuXHRcdFx0XHR2YXIgcGF0aCA9IGN1cnJlbnRSb3V0ZSA9IG5vcm1hbGl6ZVJvdXRlKHNvdXJjZSk7XHJcblx0XHRcdFx0aWYgKCFyb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSkge1xyXG5cdFx0XHRcdFx0aWYgKGlzRGVmYXVsdFJvdXRlKSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIGRlZmF1bHQgcm91dGUgbWF0Y2hlcyBvbmUgb2YgdGhlIHJvdXRlcyBkZWZpbmVkIGluIG0ucm91dGVcIilcclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gdHJ1ZVxyXG5cdFx0XHRcdFx0bS5yb3V0ZShkZWZhdWx0Um91dGUsIHRydWUpXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHR2YXIgbGlzdGVuZXIgPSBtLnJvdXRlLm1vZGUgPT09IFwiaGFzaFwiID8gXCJvbmhhc2hjaGFuZ2VcIiA6IFwib25wb3BzdGF0ZVwiO1xyXG5cdFx0XHR3aW5kb3dbbGlzdGVuZXJdID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSAkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXVxyXG5cdFx0XHRcdGlmIChtLnJvdXRlLm1vZGUgPT09IFwicGF0aG5hbWVcIikgcGF0aCArPSAkbG9jYXRpb24uc2VhcmNoXHJcblx0XHRcdFx0aWYgKGN1cnJlbnRSb3V0ZSAhPSBub3JtYWxpemVSb3V0ZShwYXRoKSkge1xyXG5cdFx0XHRcdFx0cmVkaXJlY3QocGF0aClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsO1xyXG5cdFx0XHR3aW5kb3dbbGlzdGVuZXJdKClcclxuXHRcdH1cclxuXHRcdC8vY29uZmlnOiBtLnJvdXRlXHJcblx0XHRlbHNlIGlmIChhcmd1bWVudHNbMF0uYWRkRXZlbnRMaXN0ZW5lciB8fCBhcmd1bWVudHNbMF0uYXR0YWNoRXZlbnQpIHtcclxuXHRcdFx0dmFyIGVsZW1lbnQgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHZhciBpc0luaXRpYWxpemVkID0gYXJndW1lbnRzWzFdO1xyXG5cdFx0XHR2YXIgY29udGV4dCA9IGFyZ3VtZW50c1syXTtcclxuXHRcdFx0dmFyIHZkb20gPSBhcmd1bWVudHNbM107XHJcblx0XHRcdGVsZW1lbnQuaHJlZiA9IChtLnJvdXRlLm1vZGUgIT09ICdwYXRobmFtZScgPyAkbG9jYXRpb24ucGF0aG5hbWUgOiAnJykgKyBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgdmRvbS5hdHRycy5ocmVmO1xyXG5cdFx0XHRpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XHJcblx0XHRcdFx0ZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSk7XHJcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRlbGVtZW50LmRldGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKTtcclxuXHRcdFx0XHRlbGVtZW50LmF0dGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvL20ucm91dGUocm91dGUsIHBhcmFtcywgc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSlcclxuXHRcdGVsc2UgaWYgKHR5cGUuY2FsbChhcmd1bWVudHNbMF0pID09PSBTVFJJTkcpIHtcclxuXHRcdFx0dmFyIG9sZFJvdXRlID0gY3VycmVudFJvdXRlO1xyXG5cdFx0XHRjdXJyZW50Um91dGUgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHZhciBhcmdzID0gYXJndW1lbnRzWzFdIHx8IHt9XHJcblx0XHRcdHZhciBxdWVyeUluZGV4ID0gY3VycmVudFJvdXRlLmluZGV4T2YoXCI/XCIpXHJcblx0XHRcdHZhciBwYXJhbXMgPSBxdWVyeUluZGV4ID4gLTEgPyBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRSb3V0ZS5zbGljZShxdWVyeUluZGV4ICsgMSkpIDoge31cclxuXHRcdFx0Zm9yICh2YXIgaSBpbiBhcmdzKSBwYXJhbXNbaV0gPSBhcmdzW2ldXHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcocGFyYW1zKVxyXG5cdFx0XHR2YXIgY3VycmVudFBhdGggPSBxdWVyeUluZGV4ID4gLTEgPyBjdXJyZW50Um91dGUuc2xpY2UoMCwgcXVlcnlJbmRleCkgOiBjdXJyZW50Um91dGVcclxuXHRcdFx0aWYgKHF1ZXJ5c3RyaW5nKSBjdXJyZW50Um91dGUgPSBjdXJyZW50UGF0aCArIChjdXJyZW50UGF0aC5pbmRleE9mKFwiP1wiKSA9PT0gLTEgPyBcIj9cIiA6IFwiJlwiKSArIHF1ZXJ5c3RyaW5nO1xyXG5cclxuXHRcdFx0dmFyIHNob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyA/IGFyZ3VtZW50c1syXSA6IGFyZ3VtZW50c1sxXSkgPT09IHRydWUgfHwgb2xkUm91dGUgPT09IGFyZ3VtZW50c1swXTtcclxuXHJcblx0XHRcdGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcclxuXHRcdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbFxyXG5cdFx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0d2luZG93Lmhpc3Rvcnlbc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSA/IFwicmVwbGFjZVN0YXRlXCIgOiBcInB1c2hTdGF0ZVwiXShudWxsLCAkZG9jdW1lbnQudGl0bGUsIG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmVkaXJlY3QobW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXSA9IGN1cnJlbnRSb3V0ZVxyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG5cdG0ucm91dGUucGFyYW0gPSBmdW5jdGlvbihrZXkpIHtcclxuXHRcdGlmICghcm91dGVQYXJhbXMpIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IGNhbGwgbS5yb3V0ZShlbGVtZW50LCBkZWZhdWx0Um91dGUsIHJvdXRlcykgYmVmb3JlIGNhbGxpbmcgbS5yb3V0ZS5wYXJhbSgpXCIpXHJcblx0XHRyZXR1cm4gcm91dGVQYXJhbXNba2V5XVxyXG5cdH07XHJcblx0bS5yb3V0ZS5tb2RlID0gXCJzZWFyY2hcIjtcclxuXHRmdW5jdGlvbiBub3JtYWxpemVSb3V0ZShyb3V0ZSkge1xyXG5cdFx0cmV0dXJuIHJvdXRlLnNsaWNlKG1vZGVzW20ucm91dGUubW9kZV0ubGVuZ3RoKVxyXG5cdH1cclxuXHRmdW5jdGlvbiByb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSB7XHJcblx0XHRyb3V0ZVBhcmFtcyA9IHt9O1xyXG5cclxuXHRcdHZhciBxdWVyeVN0YXJ0ID0gcGF0aC5pbmRleE9mKFwiP1wiKTtcclxuXHRcdGlmIChxdWVyeVN0YXJ0ICE9PSAtMSkge1xyXG5cdFx0XHRyb3V0ZVBhcmFtcyA9IHBhcnNlUXVlcnlTdHJpbmcocGF0aC5zdWJzdHIocXVlcnlTdGFydCArIDEsIHBhdGgubGVuZ3RoKSk7XHJcblx0XHRcdHBhdGggPSBwYXRoLnN1YnN0cigwLCBxdWVyeVN0YXJ0KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBhbGwgcm91dGVzIGFuZCBjaGVjayBpZiB0aGVyZSdzXHJcblx0XHQvLyBhbiBleGFjdCBtYXRjaCBmb3IgdGhlIGN1cnJlbnQgcGF0aFxyXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhyb3V0ZXIpO1xyXG5cdFx0dmFyIGluZGV4ID0ga2V5cy5pbmRleE9mKHBhdGgpO1xyXG5cdFx0aWYoaW5kZXggIT09IC0xKXtcclxuXHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJba2V5cyBbaW5kZXhdXSk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAodmFyIHJvdXRlIGluIHJvdXRlcikge1xyXG5cdFx0XHRpZiAocm91dGUgPT09IHBhdGgpIHtcclxuXHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChcIl5cIiArIHJvdXRlLnJlcGxhY2UoLzpbXlxcL10rP1xcLnszfS9nLCBcIiguKj8pXCIpLnJlcGxhY2UoLzpbXlxcL10rL2csIFwiKFteXFxcXC9dKylcIikgKyBcIlxcLz8kXCIpO1xyXG5cclxuXHRcdFx0aWYgKG1hdGNoZXIudGVzdChwYXRoKSkge1xyXG5cdFx0XHRcdHBhdGgucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlzID0gcm91dGUubWF0Y2goLzpbXlxcL10rL2cpIHx8IFtdO1xyXG5cdFx0XHRcdFx0dmFyIHZhbHVlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCAtMik7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKykgcm91dGVQYXJhbXNba2V5c1tpXS5yZXBsYWNlKC86fFxcLi9nLCBcIlwiKV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWVzW2ldKVxyXG5cdFx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gcm91dGVVbm9idHJ1c2l2ZShlKSB7XHJcblx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdGlmIChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5IHx8IGUud2hpY2ggPT09IDIpIHJldHVybjtcclxuXHRcdGlmIChlLnByZXZlbnREZWZhdWx0KSBlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRlbHNlIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuXHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcclxuXHRcdHZhciBhcmdzID0gbS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIgJiYgY3VycmVudFRhcmdldC5zZWFyY2ggPyBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRUYXJnZXQuc2VhcmNoLnNsaWNlKDEpKSA6IHt9O1xyXG5cdFx0d2hpbGUgKGN1cnJlbnRUYXJnZXQgJiYgY3VycmVudFRhcmdldC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpICE9IFwiQVwiKSBjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5wYXJlbnROb2RlXHJcblx0XHRtLnJvdXRlKGN1cnJlbnRUYXJnZXRbbS5yb3V0ZS5tb2RlXS5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aCksIGFyZ3MpXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHNldFNjcm9sbCgpIHtcclxuXHRcdGlmIChtLnJvdXRlLm1vZGUgIT0gXCJoYXNoXCIgJiYgJGxvY2F0aW9uLmhhc2gpICRsb2NhdGlvbi5oYXNoID0gJGxvY2F0aW9uLmhhc2g7XHJcblx0XHRlbHNlIHdpbmRvdy5zY3JvbGxUbygwLCAwKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBidWlsZFF1ZXJ5U3RyaW5nKG9iamVjdCwgcHJlZml4KSB7XHJcblx0XHR2YXIgZHVwbGljYXRlcyA9IHt9XHJcblx0XHR2YXIgc3RyID0gW11cclxuXHRcdGZvciAodmFyIHByb3AgaW4gb2JqZWN0KSB7XHJcblx0XHRcdHZhciBrZXkgPSBwcmVmaXggPyBwcmVmaXggKyBcIltcIiArIHByb3AgKyBcIl1cIiA6IHByb3BcclxuXHRcdFx0dmFyIHZhbHVlID0gb2JqZWN0W3Byb3BdXHJcblx0XHRcdHZhciB2YWx1ZVR5cGUgPSB0eXBlLmNhbGwodmFsdWUpXHJcblx0XHRcdHZhciBwYWlyID0gKHZhbHVlID09PSBudWxsKSA/IGVuY29kZVVSSUNvbXBvbmVudChrZXkpIDpcclxuXHRcdFx0XHR2YWx1ZVR5cGUgPT09IE9CSkVDVCA/IGJ1aWxkUXVlcnlTdHJpbmcodmFsdWUsIGtleSkgOlxyXG5cdFx0XHRcdHZhbHVlVHlwZSA9PT0gQVJSQVkgPyB2YWx1ZS5yZWR1Y2UoZnVuY3Rpb24obWVtbywgaXRlbSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkdXBsaWNhdGVzW2tleV0pIGR1cGxpY2F0ZXNba2V5XSA9IHt9XHJcblx0XHRcdFx0XHRpZiAoIWR1cGxpY2F0ZXNba2V5XVtpdGVtXSkge1xyXG5cdFx0XHRcdFx0XHRkdXBsaWNhdGVzW2tleV1baXRlbV0gPSB0cnVlXHJcblx0XHRcdFx0XHRcdHJldHVybiBtZW1vLmNvbmNhdChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGl0ZW0pKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIG1lbW9cclxuXHRcdFx0XHR9LCBbXSkuam9pbihcIiZcIikgOlxyXG5cdFx0XHRcdGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXHJcblx0XHRcdGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSBzdHIucHVzaChwYWlyKVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHN0ci5qb2luKFwiJlwiKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHN0cikge1xyXG5cdFx0aWYgKHN0ci5jaGFyQXQoMCkgPT09IFwiP1wiKSBzdHIgPSBzdHIuc3Vic3RyaW5nKDEpO1xyXG5cdFx0XHJcblx0XHR2YXIgcGFpcnMgPSBzdHIuc3BsaXQoXCImXCIpLCBwYXJhbXMgPSB7fTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBwYWlycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHR2YXIgcGFpciA9IHBhaXJzW2ldLnNwbGl0KFwiPVwiKTtcclxuXHRcdFx0dmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzBdKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBwYWlyLmxlbmd0aCA9PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pIDogbnVsbFxyXG5cdFx0XHRpZiAocGFyYW1zW2tleV0gIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmICh0eXBlLmNhbGwocGFyYW1zW2tleV0pICE9PSBBUlJBWSkgcGFyYW1zW2tleV0gPSBbcGFyYW1zW2tleV1dXHJcblx0XHRcdFx0cGFyYW1zW2tleV0ucHVzaCh2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHBhcmFtc1trZXldID0gdmFsdWVcclxuXHRcdH1cclxuXHRcdHJldHVybiBwYXJhbXNcclxuXHR9XHJcblx0bS5yb3V0ZS5idWlsZFF1ZXJ5U3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZ1xyXG5cdG0ucm91dGUucGFyc2VRdWVyeVN0cmluZyA9IHBhcnNlUXVlcnlTdHJpbmdcclxuXHRcclxuXHRmdW5jdGlvbiByZXNldChyb290KSB7XHJcblx0XHR2YXIgY2FjaGVLZXkgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdCk7XHJcblx0XHRjbGVhcihyb290LmNoaWxkTm9kZXMsIGNlbGxDYWNoZVtjYWNoZUtleV0pO1xyXG5cdFx0Y2VsbENhY2hlW2NhY2hlS2V5XSA9IHVuZGVmaW5lZFxyXG5cdH1cclxuXHJcblx0bS5kZWZlcnJlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpO1xyXG5cdFx0ZGVmZXJyZWQucHJvbWlzZSA9IHByb3BpZnkoZGVmZXJyZWQucHJvbWlzZSk7XHJcblx0XHRyZXR1cm4gZGVmZXJyZWRcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIHByb3BpZnkocHJvbWlzZSwgaW5pdGlhbFZhbHVlKSB7XHJcblx0XHR2YXIgcHJvcCA9IG0ucHJvcChpbml0aWFsVmFsdWUpO1xyXG5cdFx0cHJvbWlzZS50aGVuKHByb3ApO1xyXG5cdFx0cHJvcC50aGVuID0gZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpLCBpbml0aWFsVmFsdWUpXHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblx0Ly9Qcm9taXoubWl0aHJpbC5qcyB8IFpvbG1laXN0ZXIgfCBNSVRcclxuXHQvL2EgbW9kaWZpZWQgdmVyc2lvbiBvZiBQcm9taXouanMsIHdoaWNoIGRvZXMgbm90IGNvbmZvcm0gdG8gUHJvbWlzZXMvQSsgZm9yIHR3byByZWFzb25zOlxyXG5cdC8vMSkgYHRoZW5gIGNhbGxiYWNrcyBhcmUgY2FsbGVkIHN5bmNocm9ub3VzbHkgKGJlY2F1c2Ugc2V0VGltZW91dCBpcyB0b28gc2xvdywgYW5kIHRoZSBzZXRJbW1lZGlhdGUgcG9seWZpbGwgaXMgdG9vIGJpZ1xyXG5cdC8vMikgdGhyb3dpbmcgc3ViY2xhc3NlcyBvZiBFcnJvciBjYXVzZSB0aGUgZXJyb3IgdG8gYmUgYnViYmxlZCB1cCBpbnN0ZWFkIG9mIHRyaWdnZXJpbmcgcmVqZWN0aW9uIChiZWNhdXNlIHRoZSBzcGVjIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZSBpbXBvcnRhbnQgdXNlIGNhc2Ugb2YgZGVmYXVsdCBicm93c2VyIGVycm9yIGhhbmRsaW5nLCBpLmUuIG1lc3NhZ2Ugdy8gbGluZSBudW1iZXIpXHJcblx0ZnVuY3Rpb24gRGVmZXJyZWQoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spIHtcclxuXHRcdHZhciBSRVNPTFZJTkcgPSAxLCBSRUpFQ1RJTkcgPSAyLCBSRVNPTFZFRCA9IDMsIFJFSkVDVEVEID0gNDtcclxuXHRcdHZhciBzZWxmID0gdGhpcywgc3RhdGUgPSAwLCBwcm9taXNlVmFsdWUgPSAwLCBuZXh0ID0gW107XHJcblxyXG5cdFx0c2VsZltcInByb21pc2VcIl0gPSB7fTtcclxuXHJcblx0XHRzZWxmW1wicmVzb2x2ZVwiXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklORztcclxuXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZltcInJlamVjdFwiXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZi5wcm9taXNlW1widGhlblwiXSA9IGZ1bmN0aW9uKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XHJcblx0XHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZChzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayk7XHJcblx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWRUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNURUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdG5leHQucHVzaChkZWZlcnJlZClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdFx0fTtcclxuXHJcblx0XHRmdW5jdGlvbiBmaW5pc2godHlwZSkge1xyXG5cdFx0XHRzdGF0ZSA9IHR5cGUgfHwgUkVKRUNURUQ7XHJcblx0XHRcdG5leHQubWFwKGZ1bmN0aW9uKGRlZmVycmVkKSB7XHJcblx0XHRcdFx0c3RhdGUgPT09IFJFU09MVkVEICYmIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZVZhbHVlKSB8fCBkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHRoZW5uYWJsZSh0aGVuLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaywgbm90VGhlbm5hYmxlQ2FsbGJhY2spIHtcclxuXHRcdFx0aWYgKCgocHJvbWlzZVZhbHVlICE9IG51bGwgJiYgdHlwZS5jYWxsKHByb21pc2VWYWx1ZSkgPT09IE9CSkVDVCkgfHwgdHlwZW9mIHByb21pc2VWYWx1ZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiB0aGVuID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvLyBjb3VudCBwcm90ZWN0cyBhZ2FpbnN0IGFidXNlIGNhbGxzIGZyb20gc3BlYyBjaGVja2VyXHJcblx0XHRcdFx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0XHRcdFx0dGhlbi5jYWxsKHByb21pc2VWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVybjtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdHN1Y2Nlc3NDYWxsYmFjaygpXHJcblx0XHRcdFx0XHR9LCBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVybjtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdGZhaWx1cmVDYWxsYmFjaygpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRcdGZhaWx1cmVDYWxsYmFjaygpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG5vdFRoZW5uYWJsZUNhbGxiYWNrKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGZpcmUoKSB7XHJcblx0XHRcdC8vIGNoZWNrIGlmIGl0J3MgYSB0aGVuYWJsZVxyXG5cdFx0XHR2YXIgdGhlbjtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR0aGVuID0gcHJvbWlzZVZhbHVlICYmIHByb21pc2VWYWx1ZS50aGVuXHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHRcdFx0XHRyZXR1cm4gZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HO1xyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIHR5cGVvZiBzdWNjZXNzQ2FsbGJhY2sgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHN1Y2Nlc3NDYWxsYmFjayhwcm9taXNlVmFsdWUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNUSU5HICYmIHR5cGVvZiBmYWlsdXJlQ2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBmYWlsdXJlQ2FsbGJhY2socHJvbWlzZVZhbHVlKTtcclxuXHRcdFx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkdcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChwcm9taXNlVmFsdWUgPT09IHNlbGYpIHtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IFR5cGVFcnJvcigpO1xyXG5cdFx0XHRcdFx0ZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRmaW5pc2goUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9LCBmaW5pc2gsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKHN0YXRlID09PSBSRVNPTFZJTkcgJiYgUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblx0bS5kZWZlcnJlZC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0aWYgKHR5cGUuY2FsbChlKSA9PT0gXCJbb2JqZWN0IEVycm9yXVwiICYmICFlLmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkubWF0Y2goLyBFcnJvci8pKSB0aHJvdyBlXHJcblx0fTtcclxuXHJcblx0bS5zeW5jID0gZnVuY3Rpb24oYXJncykge1xyXG5cdFx0dmFyIG1ldGhvZCA9IFwicmVzb2x2ZVwiO1xyXG5cdFx0ZnVuY3Rpb24gc3luY2hyb25pemVyKHBvcywgcmVzb2x2ZWQpIHtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0cmVzdWx0c1twb3NdID0gdmFsdWU7XHJcblx0XHRcdFx0aWYgKCFyZXNvbHZlZCkgbWV0aG9kID0gXCJyZWplY3RcIjtcclxuXHRcdFx0XHRpZiAoLS1vdXRzdGFuZGluZyA9PT0gMCkge1xyXG5cdFx0XHRcdFx0ZGVmZXJyZWQucHJvbWlzZShyZXN1bHRzKTtcclxuXHRcdFx0XHRcdGRlZmVycmVkW21ldGhvZF0ocmVzdWx0cylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHZhbHVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZGVmZXJyZWQgPSBtLmRlZmVycmVkKCk7XHJcblx0XHR2YXIgb3V0c3RhbmRpbmcgPSBhcmdzLmxlbmd0aDtcclxuXHRcdHZhciByZXN1bHRzID0gbmV3IEFycmF5KG91dHN0YW5kaW5nKTtcclxuXHRcdGlmIChhcmdzLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0YXJnc1tpXS50aGVuKHN5bmNocm9uaXplcihpLCB0cnVlKSwgc3luY2hyb25pemVyKGksIGZhbHNlKSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBkZWZlcnJlZC5yZXNvbHZlKFtdKTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdH07XHJcblx0ZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtyZXR1cm4gdmFsdWV9XHJcblxyXG5cdGZ1bmN0aW9uIGFqYXgob3B0aW9ucykge1xyXG5cdFx0aWYgKG9wdGlvbnMuZGF0YVR5cGUgJiYgb3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCIpIHtcclxuXHRcdFx0dmFyIGNhbGxiYWNrS2V5ID0gXCJtaXRocmlsX2NhbGxiYWNrX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCkgKyBcIl9cIiArIChNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxZTE2KSkudG9TdHJpbmcoMzYpO1xyXG5cdFx0XHR2YXIgc2NyaXB0ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XHJcblxyXG5cdFx0XHR3aW5kb3dbY2FsbGJhY2tLZXldID0gZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcblx0XHRcdFx0b3B0aW9ucy5vbmxvYWQoe1xyXG5cdFx0XHRcdFx0dHlwZTogXCJsb2FkXCIsXHJcblx0XHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiByZXNwXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0Lm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0c2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuXHJcblx0XHRcdFx0b3B0aW9ucy5vbmVycm9yKHtcclxuXHRcdFx0XHRcdHR5cGU6IFwiZXJyb3JcIixcclxuXHRcdFx0XHRcdHRhcmdldDoge1xyXG5cdFx0XHRcdFx0XHRzdGF0dXM6IDUwMCxcclxuXHRcdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiBKU09OLnN0cmluZ2lmeSh7ZXJyb3I6IFwiRXJyb3IgbWFraW5nIGpzb25wIHJlcXVlc3RcIn0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZDtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0LnNyYyA9IG9wdGlvbnMudXJsXHJcblx0XHRcdFx0KyAob3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPiAwID8gXCImXCIgOiBcIj9cIilcclxuXHRcdFx0XHQrIChvcHRpb25zLmNhbGxiYWNrS2V5ID8gb3B0aW9ucy5jYWxsYmFja0tleSA6IFwiY2FsbGJhY2tcIilcclxuXHRcdFx0XHQrIFwiPVwiICsgY2FsbGJhY2tLZXlcclxuXHRcdFx0XHQrIFwiJlwiICsgYnVpbGRRdWVyeVN0cmluZyhvcHRpb25zLmRhdGEgfHwge30pO1xyXG5cdFx0XHQkZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFyIHhociA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XHJcblx0XHRcdHhoci5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCwgdHJ1ZSwgb3B0aW9ucy51c2VyLCBvcHRpb25zLnBhc3N3b3JkKTtcclxuXHRcdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xyXG5cdFx0XHRcdFx0aWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIG9wdGlvbnMub25sb2FkKHt0eXBlOiBcImxvYWRcIiwgdGFyZ2V0OiB4aHJ9KTtcclxuXHRcdFx0XHRcdGVsc2Ugb3B0aW9ucy5vbmVycm9yKHt0eXBlOiBcImVycm9yXCIsIHRhcmdldDogeGhyfSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGlmIChvcHRpb25zLnNlcmlhbGl6ZSA9PT0gSlNPTi5zdHJpbmdpZnkgJiYgb3B0aW9ucy5kYXRhICYmIG9wdGlvbnMubWV0aG9kICE9PSBcIkdFVFwiKSB7XHJcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9wdGlvbnMuZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UpIHtcclxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvKlwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuY29uZmlnID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHZhciBtYXliZVhociA9IG9wdGlvbnMuY29uZmlnKHhociwgb3B0aW9ucyk7XHJcblx0XHRcdFx0aWYgKG1heWJlWGhyICE9IG51bGwpIHhociA9IG1heWJlWGhyXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBkYXRhID0gb3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgfHwgIW9wdGlvbnMuZGF0YSA/IFwiXCIgOiBvcHRpb25zLmRhdGFcclxuXHRcdFx0aWYgKGRhdGEgJiYgKHR5cGUuY2FsbChkYXRhKSAhPSBTVFJJTkcgJiYgZGF0YS5jb25zdHJ1Y3RvciAhPSB3aW5kb3cuRm9ybURhdGEpKSB7XHJcblx0XHRcdFx0dGhyb3cgXCJSZXF1ZXN0IGRhdGEgc2hvdWxkIGJlIGVpdGhlciBiZSBhIHN0cmluZyBvciBGb3JtRGF0YS4gQ2hlY2sgdGhlIGBzZXJpYWxpemVgIG9wdGlvbiBpbiBgbS5yZXF1ZXN0YFwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdHhoci5zZW5kKGRhdGEpO1xyXG5cdFx0XHRyZXR1cm4geGhyXHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJpbmREYXRhKHhock9wdGlvbnMsIGRhdGEsIHNlcmlhbGl6ZSkge1xyXG5cdFx0aWYgKHhock9wdGlvbnMubWV0aG9kID09PSBcIkdFVFwiICYmIHhock9wdGlvbnMuZGF0YVR5cGUgIT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHZhciBwcmVmaXggPSB4aHJPcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA8IDAgPyBcIj9cIiA6IFwiJlwiO1xyXG5cdFx0XHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKGRhdGEpO1xyXG5cdFx0XHR4aHJPcHRpb25zLnVybCA9IHhock9wdGlvbnMudXJsICsgKHF1ZXJ5c3RyaW5nID8gcHJlZml4ICsgcXVlcnlzdHJpbmcgOiBcIlwiKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB4aHJPcHRpb25zLmRhdGEgPSBzZXJpYWxpemUoZGF0YSk7XHJcblx0XHRyZXR1cm4geGhyT3B0aW9uc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemVVcmwodXJsLCBkYXRhKSB7XHJcblx0XHR2YXIgdG9rZW5zID0gdXJsLm1hdGNoKC86W2Etel1cXHcrL2dpKTtcclxuXHRcdGlmICh0b2tlbnMgJiYgZGF0YSkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHZhciBrZXkgPSB0b2tlbnNbaV0uc2xpY2UoMSk7XHJcblx0XHRcdFx0dXJsID0gdXJsLnJlcGxhY2UodG9rZW5zW2ldLCBkYXRhW2tleV0pO1xyXG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2tleV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHVybFxyXG5cdH1cclxuXHJcblx0bS5yZXF1ZXN0ID0gZnVuY3Rpb24oeGhyT3B0aW9ucykge1xyXG5cdFx0aWYgKHhock9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5zdGFydENvbXB1dGF0aW9uKCk7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuXHRcdHZhciBpc0pTT05QID0geGhyT3B0aW9ucy5kYXRhVHlwZSAmJiB4aHJPcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIjtcclxuXHRcdHZhciBzZXJpYWxpemUgPSB4aHJPcHRpb25zLnNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuc2VyaWFsaXplIHx8IEpTT04uc3RyaW5naWZ5O1xyXG5cdFx0dmFyIGRlc2VyaWFsaXplID0geGhyT3B0aW9ucy5kZXNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuZGVzZXJpYWxpemUgfHwgSlNPTi5wYXJzZTtcclxuXHRcdHZhciBleHRyYWN0ID0gaXNKU09OUCA/IGZ1bmN0aW9uKGpzb25wKSB7cmV0dXJuIGpzb25wLnJlc3BvbnNlVGV4dH0gOiB4aHJPcHRpb25zLmV4dHJhY3QgfHwgZnVuY3Rpb24oeGhyKSB7XHJcblx0XHRcdHJldHVybiB4aHIucmVzcG9uc2VUZXh0Lmxlbmd0aCA9PT0gMCAmJiBkZXNlcmlhbGl6ZSA9PT0gSlNPTi5wYXJzZSA/IG51bGwgOiB4aHIucmVzcG9uc2VUZXh0XHJcblx0XHR9O1xyXG5cdFx0eGhyT3B0aW9ucy5tZXRob2QgPSAoeGhyT3B0aW9ucy5tZXRob2QgfHwgJ0dFVCcpLnRvVXBwZXJDYXNlKCk7XHJcblx0XHR4aHJPcHRpb25zLnVybCA9IHBhcmFtZXRlcml6ZVVybCh4aHJPcHRpb25zLnVybCwgeGhyT3B0aW9ucy5kYXRhKTtcclxuXHRcdHhock9wdGlvbnMgPSBiaW5kRGF0YSh4aHJPcHRpb25zLCB4aHJPcHRpb25zLmRhdGEsIHNlcmlhbGl6ZSk7XHJcblx0XHR4aHJPcHRpb25zLm9ubG9hZCA9IHhock9wdGlvbnMub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0XHR2YXIgdW53cmFwID0gKGUudHlwZSA9PT0gXCJsb2FkXCIgPyB4aHJPcHRpb25zLnVud3JhcFN1Y2Nlc3MgOiB4aHJPcHRpb25zLnVud3JhcEVycm9yKSB8fCBpZGVudGl0eTtcclxuXHRcdFx0XHR2YXIgcmVzcG9uc2UgPSB1bndyYXAoZGVzZXJpYWxpemUoZXh0cmFjdChlLnRhcmdldCwgeGhyT3B0aW9ucykpLCBlLnRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGUudHlwZSA9PT0gXCJsb2FkXCIpIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlLmNhbGwocmVzcG9uc2UpID09PSBBUlJBWSAmJiB4aHJPcHRpb25zLnR5cGUpIHtcclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZXNwb25zZS5sZW5ndGg7IGkrKykgcmVzcG9uc2VbaV0gPSBuZXcgeGhyT3B0aW9ucy50eXBlKHJlc3BvbnNlW2ldKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoeGhyT3B0aW9ucy50eXBlKSByZXNwb25zZSA9IG5ldyB4aHJPcHRpb25zLnR5cGUocmVzcG9uc2UpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRlZmVycmVkW2UudHlwZSA9PT0gXCJsb2FkXCIgPyBcInJlc29sdmVcIiA6IFwicmVqZWN0XCJdKHJlc3BvbnNlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh4aHJPcHRpb25zLmJhY2tncm91bmQgIT09IHRydWUpIG0uZW5kQ29tcHV0YXRpb24oKVxyXG5cdFx0fTtcclxuXHRcdGFqYXgoeGhyT3B0aW9ucyk7XHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlLCB4aHJPcHRpb25zLmluaXRpYWxWYWx1ZSk7XHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdH07XHJcblxyXG5cdC8vdGVzdGluZyBBUElcclxuXHRtLmRlcHMgPSBmdW5jdGlvbihtb2NrKSB7XHJcblx0XHRpbml0aWFsaXplKHdpbmRvdyA9IG1vY2sgfHwgd2luZG93KTtcclxuXHRcdHJldHVybiB3aW5kb3c7XHJcblx0fTtcclxuXHQvL2ZvciBpbnRlcm5hbCB0ZXN0aW5nIG9ubHksIGRvIG5vdCB1c2UgYG0uZGVwcy5mYWN0b3J5YFxyXG5cdG0uZGVwcy5mYWN0b3J5ID0gYXBwO1xyXG5cclxuXHRyZXR1cm4gbVxyXG59KSh0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSk7XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBtO1xyXG5lbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiBtfSk7XHJcbiJdfQ==
