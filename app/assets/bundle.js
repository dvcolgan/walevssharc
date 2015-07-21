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
    var defaultResponses;
    if (this.matches('die')) {
      return this.print('What are you doing? You are dead now.');
    } else if (this.matches('win')) {
      return this.print('You did it. You win. Buy yourself a pizza because you are so clever.');
    } else if (this.matches('inv') || this.matches('inventory')) {
      if (Object.keys(this.getInventory()).length > 0) {
        return this.print('It tells you what is inventory right over there on the right side of the screen. Is typing this command really necessary?');
      } else {
        return this.print('Your inventory is empty you big dumb butt. Sorry, that was rude I meant to say you butt.');
      }
    } else {
      defaultResponses = ['What are you even trying to do?  Just stop.', 'Good one man.', 'Whoa there Eager McBeaver!'];
      return this.print(defaultResponses[Math.floor(Math.random() * defaultResponses.length)]);
    }
  });
  engine.setAfterCommand(function() {
    if (!this.flagIs('have_all_items', true) && this.hasItem('egg') && this.hasItem('flowers') && this.hasItem('can of soda') && this.hasItem('syrup') && this.hasItem('milk') && this.hasItem('margarine')) {
      this.print('"Well, I think I have all the ingredients," you say to yourself. "I just need one of those places where you put them together so it turns into something you can eat. You know, one of those...food preparing rooms."');
      return this.setFlag('have_all_items', true);
    }
  });
  engine.addRoom('Wale vs Sharc: The Comic: The Interactive Software Title For Your Computer Box', function() {
    this.print('Thank you for buying this game!  Type things in the box to make things happen!');
    return this.wait((function(_this) {
      return function() {
        return _this.goToRoom('Ocean');
      };
    })(this));
  });
  engine.addRoom('Ocean', function() {
    if (this.matches('look')) {
      return this.print('You find yourself in the ocean. You are a shark by the name of Sharc and your $23 shampoo is missing. You suspect foul play. Welcome to the ocean, it is a big blue wet thing and also your home. Obvious exits are North to your friend Wale.');
    } else if (this.matches('north')) {
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
    } else if (this.matches('south')) {
      return this.goToRoom('Ocean');
    } else if (this.matches('north')) {
      return this.goToRoom('Wetter Ocean');
    } else if (this.matches('west')) {
      return this.goToRoom('Cuttlefish');
    } else if (this.matches('east')) {
      return this.goToRoom('Billy Ocean');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Wetter Ocean', function() {
    if (this.matches('look')) {
      return this.print('This is just some ocean you found. It does feel a little bit wetter than the rest of the ocean though. Also, did it just get warmer? Obvious exits are a garden to the west, Wale in the south, and a gameshow east.');
    } else if (this.matches('south')) {
      return this.goToRoom('Wale');
    } else if (this.matches('west')) {
      return this.goToRoom('Achtipus\'s Garden');
    } else if (this.matches('east')) {
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
    } else if (this.matches('east')) {
      return this.goToRoom('Wale');
    } else if (this.matches('north')) {
      return this.goToRoom('Achtipus\'s Garden');
    } else if (this.matches('west')) {
      return this.goToRoom('Steak and Shake');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Billy Ocean', function() {
    if (this.matches('look')) {
      window.open('https://www.youtube.com/watch?v=zNgcYGgtf8M', '_blank');
      return this.print('Suddenly, appearing before your eyes is singer-songwriter and former Caribbean king: Billy Ocean. Also Billy Ocean\'s car. Obvious exits are west to Wale and north to some kind of game show.');
    } else if (this.matches('talk')) {
      return this.print('He wants you to get into his car and drive him to the hospital. He just drove through the car wash with the top down after dropping some acid.');
    } else if (this.matches('hospital')) {
      this.print('Sure, why not? You get in the driver\'s seat and find your way to the nearest medical treatment center. As thanks, Mr. Ocean pulls an egg out from his glove box. You accept and swim away as fast as possible. Good, I ran out of jokes for that fast.');
      return this.getItem('egg');
    } else if (this.matches('call cops')) {
      return this.print('The police come and arrest Billy Ocean on charge of being completely irrelevant to this game. You Win! High Score.');
    } else if (this.matches('west')) {
      return this.goToRoom('Wale');
    } else if (this.matches('north')) {
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
      this.removeItem('umbrella');
      return this.setFlag('given_umbrella', true);
    } else if (this.matches('north')) {
      return this.goToRoom('Water World');
    } else if (this.matches('east')) {
      return this.goToRoom('Wetter Ocean');
    } else if (this.matches('south')) {
      return this.goToRoom('Cuttlefish');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake', function() {
    if (this.matches('look')) {
      return this.print('You swim up to the ruins of your old work place. This place has seen better days. Your mind is flooded with memories of floating in front of the old grill and coming up with new recipes to try when your manager had his back turned. Then someone said "Ever tried an M-80 burger? I have enough for everyone." The words echo in your mind like a phantom whisper of ages past. It\'s the ruins of the old Steak and Shake you used to work at until your friend blew it up. The tattered remnants of a red and white awning flutters in the wind as if to surrender to an enemy. What is left of a door hangs on a single hinge to the west. Cuttlefish stomping grounds lie east.');
    } else if (this.matches('west') || this.matches('open door') || this.matches('enter') || this.matches('in')) {
      return this.goToRoom('Steak and Shake (Doorway)');
    } else if (this.matches('east')) {
      return this.goToRoom('Cuttlefish');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Doorway)', function() {
    if (this.matches('look')) {
      return this.print('As you approach, the door falls clean off as if to warn you against entry. Never being one for omens, you ignore it. Inside you discover things much as you remember them. That is, if they had been mauled by a bear with blenders for hands who proceeded to set off a series of plastic explosives. To the south there are some tables and chairs, north lies the kitchen, and west a soda fountain. The outdoors is east.');
    } else if (this.matches('south')) {
      return this.goToRoom('Steak and Shake (Dining Area)');
    } else if (this.matches('north')) {
      return this.goToRoom('Steak and Shake (Kitchen)');
    } else if (this.matches('west')) {
      return this.goToRoom('Steak and Shake (Soda Fountain)');
    } else if (this.matches('east')) {
      return this.goToRoom('Steak and Shake');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Dining Area)', function() {
    if (this.matches('look')) {
      return this.print('A dilapidated dining area lies before you. It is completely unremarkable. There is nowhere to go besides north to the way you came.');
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
    } else if (this.matches('south')) {
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
      this.removeItem('milk');
      this.removeItem('margarine');
      return this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)');
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)', function() {
    if (this.matches('look')) {
      return this.print('Cutting and scooping shall have their day, but a for a fine fluffy batter there be but one way.');
    } else if (this.matches('stir')) {
      return this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)');
    } else if (this.matches('shake')) {
      return this.print('Dude, who do you think you are, James Bond?  This batter needs to be stirred, not shaken.');
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)', function() {
    if (this.matches('look')) {
      this.print('Set the griddle or stove to medium heat. After it is warmed, drop batter a quarter cup at a time and turning once until bubbles appear. "Well that seems pretty clear. I think I can do that on my own."');
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
      this.removeItem('syrup');
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
      return this.getItem('syrup');
    } else if (this.matches('east')) {
      return this.goToRoom('Steak and Shake (Doorway)');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Seal or No Seal', function() {
    if (this.matches('look')) {
      return this.print('You just walked onto the set of the wildly popular game show, "Seal or No Seal!" Where flamboyant contestants flail around and shout while trying to arrive at the answer to that age old question...SEAL OR NO SEAL? To the east is backstage, north will take you to the dressing room, west or south will take you back wherever you came from.');
    } else if (this.matches('north')) {
      return this.goToRoom('Seal or No Seal (Dressing Room)');
    } else if (this.matches('east')) {
      return this.goToRoom('Seal or No Seal (Backstage)');
    } else if (this.matches('west')) {
      return this.goToRoom('Wetter Ocean');
    } else if (this.matches('south')) {
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
    } else if (this.matches('south')) {
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
    } else if (this.matches('west')) {
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
    } else if (this.matches('north')) {
      return this.goToRoom('Water World (Manatee Exhibit)');
    } else if (this.matches('east')) {
      return this.goToRoom('Water World (Gift Shop)');
    } else if (this.matches('south')) {
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
    } else if (this.matches('west')) {
      return this.goToRoom('Water World (Mechanical Room Type Place)');
    } else if (this.matches('south')) {
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
    } else if (this.matches('west')) {
      return this.goToRoom('Water World');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Water World (Mechanical Room Type Place)', function() {
    if (this.matches('look')) {
      return this.print('What in the name of Captain Nemo is this? There are manatees in hoists all over the room hooked up to...milking devices. This is no mechanical room! It\'s a cover for a secret, illegal, underground, black market, but probably organic, sea cow milking operation. The fiends! You are going to blow the lid off this thing for sure. The sweaty old fish running the machinery has not noticed you yet. Obvious exits are east to the manatee exhibit.');
    } else if (this.matches('talk') || this.match('badge') || this.match('sticker')) {
      if (!this.hasItem('badge sticker')) {
        return this.print('You swim up to the fish at the controls. "I am going to shut you down!" You shout at him. He laughs heartily. "You don\'t stand a chance. You\'re just a regular guy. I\'m the mayor of Water World. Who is going to believe you?" He goes back to his work paying you no mind. He has a point.');
      } else {
        this.print('You swim up to the fish brandishing your badge sticker. "You are under arrest for illegal milk harvesting from endangered manatees. I\'m taking you in." "Wait," he says, "You don\'t have to do this. It\'s the only way I can keep Water World running. Don\'t you see? Now that we are on our sixth Shampu, people just don\'t seem to care about the magic of exploited marine mammals. I will, uh...make it worth your while though." He slides a fresh bottle of milk in your direction. Without looking at you he says, "It is worth thousands in the right market."');
        return this.getItem('milk');
      }
    } else if (this.matches('east')) {
      return this.goToRoom('Water World (Manatee Exhibit)');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('The Ethereal Realm', function() {
    if (this.matches('look')) {
      return this.print('You have entered The Ethereal Realm. Why did you do that? That was a bad decision. Wale is at your side. There are a bunch of weird, spacey platforms and junk floating around in a cosmic void -- your typical surrealist dreamscape environment. Ahead is an ugly monster. He is clutching something in his hand. Obvious exits are NONE! This is the world of waking nightmares you dingus.');
    } else if (this.matches('talk monster')) {
      return this.print('You are getting worse at this game. You approach said monster in an effort to get some leads on your precious hair product. Maybe start by asking him about the status of the local basketball team or something? On closer examination though, you realize this is not just any monster. It is a Torumekian hyper goblin. And in his grisly paw rests the item of your quest, your $23 shampoo. "Sharc, we can not allow him to use that shampoo," whispers your companion. "On the head of a hyper goblin, hair that smooth could mean the end of fashion as we know it. We must retrieve it by any means necessary." No sooner have the words left Wale\'s lips that you are spotted. That is all the motivation this beast needs. He flips the cap on the bottle, raising it to the filthy, string-like mop you can only assume must be his hair, all the while gazing down at you in defiance with his single blood shot eye. Do something!');
    } else if (this.matches('attack')) {
      return this.print('You start to lunge towards the creature, but Wale pushes you out of the way in a charge himself. You cringe as you hear the slashing of flesh. Red mist floats out of Wale\'s side. Your head is spinning.  "Now Sharc!", he wheezes, "Use the power of the Quadratic Eye." "But you said I wasn\'t ready!" you cry, trying not to look at the sorry state of your friend. "No, it was I who was not ready. The p-power has always been within y-you."');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kY29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9tYWluLmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC9lbmdpbmUuY29mZmVlIiwiL2hvbWUvZGNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9ub2RlX21vZHVsZXMvYXBwL3RiYWVuZ2luZS9pbmRleC5jb2ZmZWUiLCIvaG9tZS9kY29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL25vZGVfbW9kdWxlcy9hcHAvdGJhZW5naW5lL3N5bm9ueW1zLmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC92aWV3LmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC93YWxldnNzaGFyYy5jb2ZmZWUiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxlQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsU0FBUixDQUFKLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSxZQUFSLENBRFQsQ0FBQTs7QUFBQSxJQUVBLEdBQU8sT0FBQSxDQUFRLFVBQVIsQ0FGUCxDQUFBOztBQUFBLENBS0MsQ0FBQyxLQUFGLENBQVEsUUFBUSxDQUFDLElBQWpCLEVBQXVCLElBQXZCLENBTEEsQ0FBQTs7Ozs7QUNBQSxJQUFBLHdCQUFBOztBQUFBLHdCQUFBLEdBQTJCLE9BQUEsQ0FBUSxlQUFSLENBQTNCLENBQUE7O0FBQUEsTUFDTSxDQUFDLE9BQVAsR0FBcUIsSUFBQSx3QkFBQSxDQUFBLENBRHJCLENBQUE7Ozs7O0FDQUEsSUFB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibSA9IHJlcXVpcmUoJ21pdGhyaWwnKVxuZW5naW5lID0gcmVxdWlyZSgnYXBwL2VuZ2luZScpXG52aWV3ID0gcmVxdWlyZSgnYXBwL3ZpZXcnKVxuXG5cbm0ubW91bnQoZG9jdW1lbnQuYm9keSwgdmlldylcbiIsIlRleHRCYXNlZEFkdmVudHVyZUVuZ2luZSA9IHJlcXVpcmUoJ2FwcC90YmFlbmdpbmUnKVxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVGV4dEJhc2VkQWR2ZW50dXJlRW5naW5lKClcbiIsInN5bm9ueW1EYXRhID0gcmVxdWlyZSgnLi9zeW5vbnltcycpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbmdpbmVcbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQHJvb21zID0ge31cbiAgICAgICAgQHVuaXZlcnNhbENvbW1hbmRzID0gLT5cbiAgICAgICAgQGFmdGVyQ29tbWFuZCA9IC0+XG5cbiAgICAgICAgQGludmVudG9yeSA9IHt9XG4gICAgICAgIEBjdXJyZW50Um9vbU5hbWUgPSAnJ1xuICAgICAgICBAZmxhZ3MgPSB7fVxuXG4gICAgICAgIEBjb21tYW5kV29yZHMgPSBbXVxuICAgICAgICBAbWVzc2FnZSA9ICcnXG5cbiAgICAgICAgQGNhbGxiYWNrcyA9IFtdXG4gICAgICAgIEBzdGFydFJvb20gPSAnJ1xuXG4gICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBudWxsXG5cbiAgICBzZXRTdGFydFJvb206IChyb29tTmFtZSkgLT5cbiAgICAgICAgQHN0YXJ0Um9vbSA9IHJvb21OYW1lXG5cbiAgICBzZXRBZnRlckNvbW1hbmQ6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQGFmdGVyQ29tbWFuZCA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIHNhdmU6IC0+XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtICdwcm9ncmVzcycsIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGludmVudG9yeTogQGludmVudG9yeVxuICAgICAgICAgICAgY3VycmVudFJvb21OYW1lOiBAY3VycmVudFJvb21OYW1lXG4gICAgICAgIH0pXG5cbiAgICBsb2FkOiAtPlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwcm9ncmVzcycpKVxuICAgICAgICAgICAgQGludmVudG9yeSA9IGRhdGEuaW52ZW50b3J5XG4gICAgICAgICAgICBAY3VycmVudFJvb21OYW1lID0gZGF0YS5jdXJyZW50Um9vbU5hbWVcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGNhdGNoXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBhZGRSb29tOiAocm9vbU5hbWUsIGNhbGxiYWNrKSAtPlxuICAgICAgICBAcm9vbXNbcm9vbU5hbWVdID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgZ2V0Q3VycmVudFJvb21OYW1lOiAtPiBAY3VycmVudFJvb21OYW1lXG5cbiAgICBnZXRDdXJyZW50TWVzc2FnZTogLT4gQG1lc3NhZ2VcblxuICAgIGdldEludmVudG9yeTogLT4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShAaW52ZW50b3J5KSlcblxuICAgIGRvQ29tbWFuZDogKGNvbW1hbmRUZXh0KSAtPlxuICAgICAgICBpZiBAd2FpdENhbGxiYWNrP1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBAd2FpdENhbGxiYWNrXG4gICAgICAgICAgICBAd2FpdENhbGxiYWNrID0gbnVsbFxuICAgICAgICAgICAgY2FsbGJhY2soKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgIyBjbGVhbiB1cCB0aGUgY29tbWFuZCB0ZXh0XG4gICAgICAgIGNvbW1hbmRUZXh0ID0gY29tbWFuZFRleHRcbiAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxXKy9nLCAnICcpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxzezIsfS9nLCAnICcpXG5cbiAgICAgICAgIyBmaW5kIHN5bm9ueW1zIGFuZCByZXBsYWNlIHRoZW0gd2l0aCB0aGUgY2Fub25pY2FsIHdvcmRcbiAgICAgICAgZm9yIGNhbm5vbmljYWxXb3JkLCBzeW5vbnltcyBvZiBzeW5vbnltRGF0YVxuICAgICAgICAgICAgZm9yIHN5bm9ueW0gaW4gc3lub255bXNcbiAgICAgICAgICAgICAgICBjb21tYW5kVGV4dCA9IGNvbW1hbmRUZXh0LnJlcGxhY2Uoc3lub255bSwgY2Fubm9uaWNhbFdvcmQpXG5cbiAgICAgICAgQGNvbW1hbmRXb3JkcyA9IGNvbW1hbmRUZXh0LnNwbGl0KCcgJylcblxuICAgICAgICBAcm9vbXNbQGN1cnJlbnRSb29tTmFtZV0oKVxuICAgICAgICBAYWZ0ZXJDb21tYW5kKClcblxuICAgIHNldFVuaXZlcnNhbENvbW1hbmRzOiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcyA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIHRyeVVuaXZlcnNhbENvbW1hbmRzOiAtPlxuICAgICAgICBAdW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgbWF0Y2hlczogKHBhdHRlcm4pIC0+XG4gICAgICAgICMgSWYgZWFjaCB3b3JkIGluIHRoZSBzcGVjIGNvbW1hbmQgaXMgZm91bmRcbiAgICAgICAgIyBhbnl3aGVyZSBpbiB0aGUgdXNlcidzIGlucHV0IGl0J3MgYSBtYXRjaFxuICAgICAgICBwYXR0ZXJuV29yZHMgPSBwYXR0ZXJuLnNwbGl0KCcgJylcbiAgICAgICAgZm9yIHBhdHRlcm5Xb3JkIGluIHBhdHRlcm5Xb3Jkc1xuICAgICAgICAgICAgaWYgbm90IChwYXR0ZXJuV29yZCBpbiBAY29tbWFuZFdvcmRzKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgaGFzSXRlbTogKGl0ZW0pIC0+IGl0ZW0gb2YgQGludmVudG9yeVxuICAgIHVzZWRJdGVtOiAoaXRlbSkgLT4gaXRlbSBvZiBAaW52ZW50b3J5IGFuZCBAaW52ZW50b3J5W2l0ZW1dID09ICd1c2VkJ1xuXG4gICAgcGVyY2VudENoYW5jZTogKGNoYW5jZSkgLT4gTWF0aC5yYW5kb20oKSA8IGNoYW5jZSAvIDEwMFxuXG4gICAgZmxhZ0lzOiAoZmxhZ05hbWUsIHZhbHVlKSAtPiBAZmxhZ3NbZmxhZ05hbWVdID09IHZhbHVlXG5cbiAgICBwcmludDogKHRleHQpIC0+XG4gICAgICAgIEBtZXNzYWdlID0gdGV4dFxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdvVG9Sb29tOiAocm9vbU5hbWUpIC0+XG4gICAgICAgIEBjdXJyZW50Um9vbU5hbWUgPSByb29tTmFtZVxuICAgICAgICBAZG9Db21tYW5kKCdsb29rJylcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICBnb1RvU3RhcnQ6IC0+XG4gICAgICAgIEBjdXJyZW50Um9vbU5hbWUgPSBAc3RhcnRSb29tXG4gICAgICAgIEBkb0NvbW1hbmQoJ2xvb2snKVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIHNldEZsYWc6IChmbGFnTmFtZSwgdmFsdWUpIC0+XG4gICAgICAgIEBmbGFnc1tmbGFnTmFtZV0gPSB2YWx1ZVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdldEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBAaW52ZW50b3J5W2l0ZW1dID0gJ2dvdHRlbidcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICByZW1vdmVJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgZGVsZXRlIEBpbnZlbnRvcnlbaXRlbV1cbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICB1c2VJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgQGludmVudG9yeVtpdGVtXSA9ICd1c2VkJ1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIHdhaXQ6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQG1lc3NhZ2UgKz0gJyA8c3Ryb25nPihIaXQgRW50ZXIpPC9zdHJvbmc+J1xuICAgICAgICBAd2FpdENhbGxiYWNrID0gY2FsbGJhY2tcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICBsaXN0ZW46IChjYWxsYmFjaykgLT4gQGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKVxuXG4gICAgbm90aWZ5OiAtPiBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gICAgbG9vazogW1xuICAgICAgICAnc2VlJ1xuICAgICAgICAnYWRtaXJlJ1xuICAgICAgICAnYmVob2xkJ1xuICAgICAgICAnZ2F3aydcbiAgICAgICAgJ29ic2VydmUnXG4gICAgICAgICdzcHknXG4gICAgXVxuICAgIHRha2U6IFtcbiAgICAgICAgJ3BpY2sgdXAnXG4gICAgICAgICdnZXQnXG4gICAgICAgICdhY3F1aXJlJ1xuICAgICAgICAnZ3JhYidcbiAgICAgICAgJ2dyYXNwJ1xuICAgICAgICAnb2J0YWluJ1xuICAgICAgICAnYnV5J1xuICAgICAgICAnY2hvb3NlJ1xuICAgIF1cbiAgICBnbzogW1xuICAgICAgICAnd2FsaydcbiAgICAgICAgJ3BlcmFtYnVsYXRlJ1xuICAgICAgICAnZmxlZSdcbiAgICAgICAgJ2xlYXZlJ1xuICAgICAgICAnbW92ZSdcbiAgICAgICAgJ3RyYXZlbCdcbiAgICAgICAgJ2RlcGFydCdcbiAgICAgICAgJ2RlY2FtcCdcbiAgICAgICAgJ2V4aXQnXG4gICAgICAgICdqb3VybmV5J1xuICAgICAgICAnbW9zZXknXG4gICAgICAgICd3aXRoZHJhdydcbiAgICBdXG4gICAgZ2l2ZTogW1xuICAgICAgICAnZGVsaXZlcidcbiAgICAgICAgJ2RvbmF0ZSdcbiAgICAgICAgJ2hhbmQgb3ZlcidcbiAgICAgICAgJ3ByZXNlbnQnXG4gICAgICAgICdlbmRvdydcbiAgICAgICAgJ2JlcXVlYXRoJ1xuICAgICAgICAnYmVzdG93J1xuICAgICAgICAncmVsaW5xdWlzaCdcbiAgICBdXG4gICAgZ2FyZGVuOiBbXG4gICAgICAgICdwbG90J1xuICAgICAgICAncGxhbnRzJ1xuICAgICAgICAncHJvZHVjZSdcbiAgICBdXG4iLCJtID0gcmVxdWlyZSgnbWl0aHJpbCcpXG5lbmdpbmUgPSByZXF1aXJlKCdhcHAvZW5naW5lJylcbldhbGVWc1NoYXJjID0gcmVxdWlyZSgnYXBwL3dhbGV2c3NoYXJjJylcblxuXG5TdHJpbmcucHJvdG90eXBlLmNhcGl0YWxpemUgPSAtPlxuICAgIEBbMF0udG9VcHBlckNhc2UoKSArIEBbMS4uXVxuXG5cbmNsYXNzIFRleHRUeXBlclxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAY3VycmVudE1lc3NhZ2UgPSAnJ1xuICAgICAgICBAdHlwZXIgPSBudWxsXG4gICAgICAgIEBtYWtlVHlwZXIgPSAodGV4dCwgc3BlZWQ9NCkgLT5cbiAgICAgICAgICAgIGkgPSAwXG4gICAgICAgICAgICB0eXBlTG9vcCA9IC0+XG4gICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICAgICAgICAgIGlmIGkgPCB0ZXh0Lmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCh0eXBlTG9vcCwgc3BlZWQpXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHR5cGVMb29wLCBzcGVlZClcblxuICAgICAgICAgICAgcmV0dXJuIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRleHRbLi5pXVxuICAgIFxuICAgIHByaW50OiAobWVzc2FnZSkgLT5cbiAgICAgICAgaWYgbWVzc2FnZSAhPSBAY3VycmVudE1lc3NhZ2VcbiAgICAgICAgICAgIEBjdXJyZW50TWVzc2FnZSA9IG1lc3NhZ2VcbiAgICAgICAgICAgIEB0eXBlciA9IG5ldyBAbWFrZVR5cGVyKG1lc3NhZ2UpXG4gICAgICAgICAgICBtLnJlZHJhdygpXG5cbiAgICBnZXRUeXBpbmdNZXNzYWdlOiAtPiBpZiBAdHlwZXI/IHRoZW4gQHR5cGVyKCkgZWxzZSAnJ1xuXG4gICAgZ2V0Q3VycmVudE1lc3NhZ2U6IC0+IEBjdXJyZW50TWVzc2FnZVxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgICBjb250cm9sbGVyOiBjbGFzc1xuICAgICAgICBjb25zdHJ1Y3RvcjogLT5cblxuICAgICAgICAgICAgV2FsZVZzU2hhcmMoZW5naW5lKVxuICAgICAgICAgICAgZGlkTG9hZCA9IGVuZ2luZS5sb2FkKClcblxuICAgICAgICAgICAgQHZtID0ge31cbiAgICAgICAgICAgIEB2bS5jb21tYW5kID0gbS5wcm9wKCcnKVxuICAgICAgICAgICAgQHZtLnR5cGVyID0gbmV3IFRleHRUeXBlcigpXG5cbiAgICAgICAgICAgIGVuZ2luZS5saXN0ZW4gPT5cbiAgICAgICAgICAgICAgICBAdm0udHlwZXIucHJpbnQoZW5naW5lLmdldEN1cnJlbnRNZXNzYWdlKCkpXG4gICAgICAgICAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICAgICAgICAgIGVuZ2luZS5zYXZlKClcblxuICAgICAgICAgICAgaWYgZGlkTG9hZFxuICAgICAgICAgICAgICAgIGVuZ2luZS5kb0NvbW1hbmQoJ2xvb2snKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGVuZ2luZS5nb1RvU3RhcnQoKVxuXG4gICAgICAgIG9uQ29tbWFuZFN1Ym1pdDogKGUpID0+XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgIGVuZ2luZS5kb0NvbW1hbmQoQHZtLmNvbW1hbmQoKSlcbiAgICAgICAgICAgIEB2bS5jb21tYW5kKCcnKVxuXG4gICAgdmlldzogKGN0cmwpIC0+XG4gICAgICAgIFtcbiAgICAgICAgICAgIG0gJy5zaWRlYmFyJyxcbiAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMjYwcHgnXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcyMHB4J1xuICAgICAgICAgICAgICAgIG0gJ2gyJyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Ub3A6IDBcbiAgICAgICAgICAgICAgICAgICAgJ0ludmVudG9yeSdcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIGZvciBpdGVtTmFtZSwgc3RhdGUgb2YgZW5naW5lLmdldEludmVudG9yeSgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzdGF0ZSA9PSAnZ290dGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtTmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzdGF0ZSA9PSAndXNlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICdwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ2xpbmUtdGhyb3VnaCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbU5hbWVcbiAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uY2xpY2s6IC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnU2F2ZSBnYW1lIGRlbGV0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJydcbiAgICAgICAgICAgICAgICAgICAgICAgICdSZXN0YXJ0IGdhbWUnXG4gICAgICAgICAgICAgICAgXVxuXG4gICAgICAgICAgICBtICcuY29udGVudCcsXG4gICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAod2luZG93LmlubmVyV2lkdGggLSAzNjApICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMjBweCdcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZ1RvcDogMFxuICAgICAgICAgICAgICAgIG0gJ2gxJywgZW5naW5lLmdldEN1cnJlbnRSb29tTmFtZSgpXG4gICAgICAgICAgICAgICAgbSAncCcsIG0udHJ1c3QoY3RybC52bS50eXBlci5nZXRUeXBpbmdNZXNzYWdlKCkpXG5cbiAgICAgICAgICAgICAgICBtICdmb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgb25zdWJtaXQ6IGN0cmwub25Db21tYW5kU3VibWl0XG4gICAgICAgICAgICAgICAgICAgIG0gJ2lucHV0W3R5cGU9dGV4dF0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2Jsb2NrJ1xuICAgICAgICAgICAgICAgICAgICAgICAgb25jaGFuZ2U6IG0ud2l0aEF0dHIoJ3ZhbHVlJywgY3RybC52bS5jb21tYW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGN0cmwudm0uY29tbWFuZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWc6IChlbGVtZW50LCBpc0luaXRpYWxpemVkLCBjb250ZXh0KSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBpc0luaXRpYWxpemVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMoKVxuICAgICAgICAgICAgICAgICAgICBtICdidXR0b25bdHlwZT1zdWJtaXRdJywgJ0RvJ1xuICAgICAgICBdXG4iLCJcIlwiXCJcbkNvbmRpdGlvbnM6XG4gICAgQG1hdGNoZXMocGF0dGVybilcbiAgICBAaGFzSXRlbShpdGVtIG5hbWUpXG4gICAgQHBlcmNlbnRDaGFuY2UoY2hhbmNlIG91dCBvZiAxMDApXG4gICAgQGZsYWdJcyhmbGFnIG5hbWUsIHZhbHVlKVxuXG5SZXN1bHRzOlxuICAgIEBwcmludCh0ZXh0KVxuICAgIEBnb1RvUm9vbShyb29tIG5hbWUpXG4gICAgQHNldEZsYWcoZmxhZyBuYW1lLCB2YWx1ZSlcblwiXCJcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IChlbmdpbmUpIC0+XG5cbiAgICBlbmdpbmUuc2V0VW5pdmVyc2FsQ29tbWFuZHMgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2RpZScpXG4gICAgICAgICAgICBAcHJpbnQoJ1doYXQgYXJlIHlvdSBkb2luZz8gWW91IGFyZSBkZWFkIG5vdy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3aW4nKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZGlkIGl0LiBZb3Ugd2luLiBCdXkgeW91cnNlbGYgYSBwaXp6YSBiZWNhdXNlIHlvdSBhcmUgc28gY2xldmVyLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2ludicpIG9yIEBtYXRjaGVzKCdpbnZlbnRvcnknKVxuICAgICAgICAgICAgaWYgT2JqZWN0LmtleXMoQGdldEludmVudG9yeSgpKS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgQHByaW50KCdJdCB0ZWxscyB5b3Ugd2hhdCBpcyBpbnZlbnRvcnkgcmlnaHQgb3ZlciB0aGVyZSBvbiB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgc2NyZWVuLiBJcyB0eXBpbmcgdGhpcyBjb21tYW5kIHJlYWxseSBuZWNlc3Nhcnk/JylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdXIgaW52ZW50b3J5IGlzIGVtcHR5IHlvdSBiaWcgZHVtYiBidXR0LiBTb3JyeSwgdGhhdCB3YXMgcnVkZSBJIG1lYW50IHRvIHNheSB5b3UgYnV0dC4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICAjIFBpY2sgYSByYW5kb20gZGVmYXVsdCByZXNwb25zZVxuICAgICAgICAgICAgZGVmYXVsdFJlc3BvbnNlcyA9IFtcbiAgICAgICAgICAgICAgICAnV2hhdCBhcmUgeW91IGV2ZW4gdHJ5aW5nIHRvIGRvPyAgSnVzdCBzdG9wLidcbiAgICAgICAgICAgICAgICAnR29vZCBvbmUgbWFuLidcbiAgICAgICAgICAgICAgICAnV2hvYSB0aGVyZSBFYWdlciBNY0JlYXZlciEnXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBAcHJpbnQoZGVmYXVsdFJlc3BvbnNlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqZGVmYXVsdFJlc3BvbnNlcy5sZW5ndGgpXSlcbiAgICAgICAgICAgIFxuXG4gICAgZW5naW5lLnNldEFmdGVyQ29tbWFuZCAtPlxuICAgICAgICBpZiAobm90IEBmbGFnSXMoJ2hhdmVfYWxsX2l0ZW1zJywgdHJ1ZSkgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ2VnZycpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdmbG93ZXJzJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ2NhbiBvZiBzb2RhJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ3N5cnVwJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ21pbGsnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnbWFyZ2FyaW5lJykpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiV2VsbCwgSSB0aGluayBJIGhhdmUgYWxsIHRoZSBpbmdyZWRpZW50cyxcIiB5b3Ugc2F5IHRvIHlvdXJzZWxmLiBcIkkganVzdCBuZWVkIG9uZSBvZiB0aG9zZSBwbGFjZXMgd2hlcmUgeW91IHB1dCB0aGVtIHRvZ2V0aGVyIHNvIGl0IHR1cm5zIGludG8gc29tZXRoaW5nIHlvdSBjYW4gZWF0LiBZb3Uga25vdywgb25lIG9mIHRob3NlLi4uZm9vZCBwcmVwYXJpbmcgcm9vbXMuXCInKVxuICAgICAgICAgICAgQHNldEZsYWcoJ2hhdmVfYWxsX2l0ZW1zJywgdHJ1ZSlcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhbGUgdnMgU2hhcmM6IFRoZSBDb21pYzogVGhlIEludGVyYWN0aXZlIFNvZnR3YXJlIFRpdGxlIEZvciBZb3VyIENvbXB1dGVyIEJveCcsIC0+XG4gICAgICAgIEBwcmludCgnVGhhbmsgeW91IGZvciBidXlpbmcgdGhpcyBnYW1lISAgVHlwZSB0aGluZ3MgaW4gdGhlIGJveCB0byBtYWtlIHRoaW5ncyBoYXBwZW4hJylcbiAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgIEBnb1RvUm9vbSgnT2NlYW4nKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ09jZWFuJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZmluZCB5b3Vyc2VsZiBpbiB0aGUgb2NlYW4uIFlvdSBhcmUgYSBzaGFyayBieSB0aGUgbmFtZSBvZiBTaGFyYyBhbmQgeW91ciAkMjMgc2hhbXBvbyBpcyBtaXNzaW5nLiBZb3Ugc3VzcGVjdCBmb3VsIHBsYXkuIFdlbGNvbWUgdG8gdGhlIG9jZWFuLCBpdCBpcyBhIGJpZyBibHVlIHdldCB0aGluZyBhbmQgYWxzbyB5b3VyIGhvbWUuIE9idmlvdXMgZXhpdHMgYXJlIE5vcnRoIHRvIHlvdXIgZnJpZW5kIFdhbGUuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhbGUnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSwgaXQgaXMgeW91ciBmcmllbmQsIFdhbGUuIEhlIGlzIGRvaW5nIHRoYXQgdGhpbmcgd2hlcmUgaGUgaGFzIGhpcyBleWVzIGNsb3NlZCBhbmQgYWN0cyBsaWtlIGhlIGRpZCBub3Qgbm90aWNlIHlvdXIgYXJyaXZhbC4gSGUgaXMga2luZCBvZiBhIHByaWNrLCBidXQgYWxzbyB5b3VyIGZyaWVuZC4gV2hhdCBjYW4geW91IGRvPyBPYnZpb3VzIGV4aXRzIGFyZSBPY2VhbiB0byB0aGUgc291dGgsIGEgc2Nob29sIG9mIEN1dHRsZWZpc2ggdG8gdGhlIHdlc3QsIG1vcmUgT2NlYW4gdG8gdGhlIG5vcnRoLCBhbmQgQmlsbHkgT2NlYW4gdG8gdGhlIGVhc3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnaXZlIHBhbmNha2VzJylcbiAgICAgICAgICAgIGlmIEBoYXNJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIkhleSBXYWxlLFwiIHlvdSBjYWxsIG91dCBhcyBpbnRydXNpdmVseSBhcyBwb3NzaWJsZSwgXCJJIGdvdCB5b3VyLS1cIiBCZWZvcmUgeW91IGNvdWxkIGZpbmlzaCB5b3VyIHNlbnRlbmNlLCB5b3VyIGJsdWJiZXJ5IGZyaWVuZCBoYXMgc25hdGNoZWQgdGhlIHBsYXRlIGF3YXkgYW5kLCBpbiBhIG1vc3QgdW5kaWduaWZpZWQgbWFubmVyLCBiZWdpbnMgbW93aW5nIHRocm91Z2ggdGhlIGZyaWVkIGRpc2NzIHlvdSBzbyBhcnRmdWxseSBwcmVwYXJlZC4gXCJTb3VsIHNlYXJjaGluZyB0YWtlcyBhIGxvdCBvZiBlbmVyZ3ksXCIgaGUgZXhwbGFpbnMgYmV0d2VlbiBiaXRlcy4gXCJJIGhhdmVuXFwndCBlYXRlbiBhbnl0aGluZyBhbGwgZGF5LlwiIE9uY2UgZmluaXNoZWQsIFdhbGUgc3RyYWlnaHRlbnMgaGltc2VsZiBvdXQsIGxvb2tpbmcgYSBtaXRlIGVtYmFycmFzc2VkIGZvciB0aGUgc2F2YWdlIGRpc3BsYXkgaGUganVzdCBwdXQgb24uIFwiV2hhdCB3YXMgaXQgeW91IG5lZWRlZD9cIiBcIk9oIFdhbGUsIGl0XFwncyB0ZXJyaWJsZS4gSSB0aGluayBteSAkMjMgc2hhbXBvbyB3YXMgc3RvbGVuIGFuZCB0aGUgZ2hvc3Qgb2YgbXkgbm90IHJlYWxseSBkZWFkIGZyaWVuZCBzYXlzIHRoZSBmYXRlIG9mIHRoZSB3b3JsZCBoYW5ncyBpbiB0aGUgYmFsYW5jZS5cIiBcIkkgc2VlLFwiIHNheXMgV2FsZSwgaGlzIHZvaWNlIGFuZCBtYW5uZXIgcmVtYWluaW5nIHVuY2hhbmdlZCBkZXNwaXRlIHRoZSB0aHJlYXQgb2YgdGhlIHdvcmxkIHVuYmFsYW5jaW5nLiBcIlNoYXJjLCBJIGZlYXIgdGhlIHdvcnN0LiBZb3UgbXVzdCBzdW1tb24gdGhlIGV0aGVyZWFsIGRvb3IuXCIgXCJObywgV2FsZSxcIiB5b3Ugc2F5LCBcInlvdSBtYWRlIG1lIHN3ZWFyIGEgdGhvdXNhbmQgdm93cyBuZXZlciB0byBicmluZyB0aGF0IGN1cnNlZCByZWxpYyBiYWNrIGFtb25nIHVzLlwiIFwiSSBrbm93IHdoYXQgSSBzYWlkLCBidXQgSSBhbHNvIGtuZXcgdGhlcmUgd291bGQgY29tZSBhIHRpbWUgd2hlbiB3ZSB3b3VsZCBoYXZlIG5vIG90aGVyIGNob2ljZS5cIiAgWW91IHNob3VsZCBwcm9iYWJseSBzdW1tb24gdGhlIGRvb3IuJylcbiAgICAgICAgICAgICAgICBAcmVtb3ZlSXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgICAgIEBzZXRGbGFnKCdnaXZlbl9wYW5jYWtlcycsIHRydWUpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3VtbW9uIGRvb3InKSBhbmQgQGZsYWdJcygnZ2l2ZW5fcGFuY2FrZXMnLCB0cnVlKVxuICAgICAgICAgICAgQHByaW50KCdZb3UsIGZpbmFsbHkgY29udmluY2VkIG9mIHlvdXIgdXJnZW5jeSBhbmQgdXR0ZXIgZGVzcGVyYXRpb24sIHBlcmZvcm0gc29tZSBpbnRyaWNhdGUgcml0ZXMgYW5kIGluY2FudGF0aW9ucyB0aGF0IHdvdWxkIGJlIHJlYWxseSBjb29sIGlmIHlvdSBjb3VsZCBzZWUgdGhlbSwgYnV0IEkgZ3Vlc3MgeW91IHdpbGwganVzdCBoYXZlIHRvIHVzZSB5b3VyIGltYWdpbmF0aW9ucy4gVGV4dCBvbmx5IGZvb2xzISAgVGhlIGV0aGVyZWFsIGRvb3Igc3RhbmRzIG9wZW4gYmVmb3JlIHlvdS4nKVxuICAgICAgICAgICAgQHNldEZsYWcoJ3N1bW1vbmVkX2Rvb3InLCB0cnVlKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2VudGVyIGRvb3InKSBhbmQgQGZsYWdJcygnc3VtbW9uZWRfZG9vcicsIHRydWUpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1RoZSBFdGhlcmVhbCBSZWFsbScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayB3YWxlJylcbiAgICAgICAgICAgIGlmIEBmbGFnSXMoJ3RhbGtlZF90b193YWxlJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJyhHZXQgcmVhZHkgdG8gZG8gc29tZSByZWFkaW5nKSBXYWxlIGlzIHRyeWluZyB0byBtZWRpdGF0ZSBvciBzb21ldGhpbmcgcHJldGVudGlvdXMgdGhhdCB5b3UgZG9uXFwndCBjYXJlIGFib3V0LiBZb3UgaGF2ZSBzb21ldGhpbmcgaW1wb3J0YW50ISBcIldhbGVcIiB5b3Ugc2hvdXQsIFwiSSBuZWVkIHlvdXIgaGVscCEgVGhlIGNvbmRpdGlvbiBvZiBteSBtYWduaWZpY2VudCBzY2FscCBpcyBhdCBzdGFrZS5cIiBXYWxlIHNpZ2hzIGEgaGVhdnksIGxhYm9yZWQgc2lnaC4gXCJTaGFyYywgeW91IGhhdmUgZGlzdHVyYmVkIG15IGpvdXJuZXkgdG8gbXkgaW5uZXJtb3N0IGJlaW5nLiBCZWZvcmUgSSBjYW4gaGVscCB5b3UsIHJlcGFyYXRpb25zIG11c3QgYmUgbWFkZS4gUGFuY2FrZXM6IHdob2xlIHdoZWF0LCB3aXRoIGFsbCBuYXR1cmFsIG1hcGxlIHN5cnVwLiBOb3cgbGVhdmUgbWUgYXMgSSBwZWVsIGJhY2sgdGhlIGxheWVycyBvZiB0aGUgc2VsZiBhbmQgcG9uZGVyIHRoZSBsZXNzb24gb2YgdGhlIGNoZXJyeSBibG9zc29tLicpXG4gICAgICAgICAgICAgICAgQHNldEZsYWcoJ3RhbGtlZF90b193YWxlJywgdHJ1ZSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSSBjYW4gbm90IGxpZnQgYSBmaW4gZm9yIHlvdSB1bnRpbCB5b3UgaGF2ZSBicm91Z2h0IGEgaGVhbHRoeSBzZXJ2aW5nIG9mIHdob2xlIHdoZWF0IHBhbmNha2VzIHdpdGggYWxsIG5hdHVyYWwgbWFwbGUgc3lydXAgbGlrZSBJIHNhaWQgYmVmb3JlLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ09jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXZXR0ZXIgT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQ3V0dGxlZmlzaCcpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdCaWxseSBPY2VhbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXZXR0ZXIgT2NlYW4nLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgaXMganVzdCBzb21lIG9jZWFuIHlvdSBmb3VuZC4gSXQgZG9lcyBmZWVsIGEgbGl0dGxlIGJpdCB3ZXR0ZXIgdGhhbiB0aGUgcmVzdCBvZiB0aGUgb2NlYW4gdGhvdWdoLiBBbHNvLCBkaWQgaXQganVzdCBnZXQgd2FybWVyPyBPYnZpb3VzIGV4aXRzIGFyZSBhIGdhcmRlbiB0byB0aGUgd2VzdCwgV2FsZSBpbiB0aGUgc291dGgsIGFuZCBhIGdhbWVzaG93IGVhc3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQWNodGlwdXNcXCdzIEdhcmRlbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnQ3V0dGxlZmlzaCcsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICAgICAgQHByaW50KCdMb29rLCB0aGVyZSBiZSBzb21lIGN1dHRsZWZpc2gsIHRob3VnaCB0aGV5IGRvIG5vdCBsb29rIHRvbyBjdWRkbHkuIFN0ZWFrIGFuZCBTaGFrZSBpcyB0byB0aGUgd2VzdCwgQWNodGlwdXNcXCdzIGdhcmRlbiB0byB0aGUgbm9ydGgsIGFuZCBXYWxlIHRvIHRoZSBlYXN0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGVyZSB1c2VkIHRvIGJlIGN1dHRsZWZpc2ggaGVyZSBidXQgeW91IHNjYXJlZCB0aGVtIGF3YXkgd2l0aCB5b3VyIGFnZ3Jlc3NpdmUgYWZmZWN0aW9ucy4gS2VlcCB0aGF0IHN0dWZmIGluc2lkZSBtYW4hJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY3VkZGxlIGN1dHRsZWZpc2gnKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdjdXR0bGVmaXNoJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBhcmUgZmVlbGluZyBhZmZlY3Rpb25hdGUgdG9kYXkgYW5kIHlvdSBqdXN0IGdvdCBkdW1wZWQgc28gd2h5IG5vdD8gWW91IGp1bXAgc29tZSBvZiB0aGUgY3V0dGxlZmlzaCBhbmQgc3RhcnQgc251Z2dsaW5nIGFuZCBjdWRkbGluZy4gVGhlIGN1dHRsZWZpc2ggYXJlIG5vdCBhbXVzZWQgdGhvdWdoLCBhbmQgc2F5IHRoZXkgYXJlIHRpcmVkIG9mIGZpc2ggbWFraW5nIHRoYXQgbWlzdGFrZS4gVGhleSBhbGwgc3dpbSBhd2F5IGV4Y2VwdCBmb3Igb25lIHRoYXQgaGFzIGF0dGFjaGVkIGl0cyBzdWNrZXJzIHRvIHlvdXIgbWlkIHJlZ2lvbi4gWW91IGRvblxcJ3Qgc2VlbSB0byBtaW5kLicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhleSBhcmUgY3VkZGxlZCBvdXQuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQWNodGlwdXNcXCdzIEdhcmRlbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnQmlsbHkgT2NlYW4nLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj16TmdjWUdndGY4TScsICdfYmxhbmsnKVxuICAgICAgICAgICAgQHByaW50KCdTdWRkZW5seSwgYXBwZWFyaW5nIGJlZm9yZSB5b3VyIGV5ZXMgaXMgc2luZ2VyLXNvbmd3cml0ZXIgYW5kIGZvcm1lciBDYXJpYmJlYW4ga2luZzogQmlsbHkgT2NlYW4uIEFsc28gQmlsbHkgT2NlYW5cXCdzIGNhci4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byBXYWxlIGFuZCBub3J0aCB0byBzb21lIGtpbmQgb2YgZ2FtZSBzaG93LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKVxuICAgICAgICAgICAgQHByaW50KCdIZSB3YW50cyB5b3UgdG8gZ2V0IGludG8gaGlzIGNhciBhbmQgZHJpdmUgaGltIHRvIHRoZSBob3NwaXRhbC4gSGUganVzdCBkcm92ZSB0aHJvdWdoIHRoZSBjYXIgd2FzaCB3aXRoIHRoZSB0b3AgZG93biBhZnRlciBkcm9wcGluZyBzb21lIGFjaWQuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnaG9zcGl0YWwnKVxuICAgICAgICAgICAgQHByaW50KCdTdXJlLCB3aHkgbm90PyBZb3UgZ2V0IGluIHRoZSBkcml2ZXJcXCdzIHNlYXQgYW5kIGZpbmQgeW91ciB3YXkgdG8gdGhlIG5lYXJlc3QgbWVkaWNhbCB0cmVhdG1lbnQgY2VudGVyLiBBcyB0aGFua3MsIE1yLiBPY2VhbiBwdWxscyBhbiBlZ2cgb3V0IGZyb20gaGlzIGdsb3ZlIGJveC4gWW91IGFjY2VwdCBhbmQgc3dpbSBhd2F5IGFzIGZhc3QgYXMgcG9zc2libGUuIEdvb2QsIEkgcmFuIG91dCBvZiBqb2tlcyBmb3IgdGhhdCBmYXN0LicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnZWdnJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY2FsbCBjb3BzJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlIHBvbGljZSBjb21lIGFuZCBhcnJlc3QgQmlsbHkgT2NlYW4gb24gY2hhcmdlIG9mIGJlaW5nIGNvbXBsZXRlbHkgaXJyZWxldmFudCB0byB0aGlzIGdhbWUuIFlvdSBXaW4hIEhpZ2ggU2NvcmUuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0FjaHRpcHVzXFwncyBHYXJkZW4nLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vayBhY2h0aXB1cycpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyBBY2h0aXB1cy4gSGUgaXMgcHVsbGluZyBvdXQgdGhlIHNlYXdlZWRzIGZyb20gaGlzIHNlYSBjdWN1bWJlciBiZWQuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBnYXJkZW4nKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc2VlIHdhdGVybWVsb24sIHdhdGVyIGNoZXN0bnV0cywgYXNzb3J0ZWQgZmxvd2Vycywgc2VhIGN1Y3VtYmVycyBhbmQgc3RyYXdiZXJyaWVzLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdBY2h0aXB1cyBpcyB3b3JraW5nIGFtb25nIGhpcyBmbG93ZXJzIGFuZCBzaHJ1YnMuIEhlIHNlZXMgeW91IGFuZCBvcGVucyB0aGUgZ2F0ZSBmb3IgeW91LiBPYnZpb3VzIGV4aXRzIGFyZSBub3J0aCB0byBXYXRlciBXb3JsZCwgZWFzdCB0byBzb21lIE9jZWFuIGFuZCBzb3V0aCB0byBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKVxuICAgICAgICAgICAgQHByaW50KCdcIlRoaXMgaXMgcXVpdGUgdGhlIHVtLi4ub2NlYW4gaGlkZWF3YXkgeW91IGhhdmUgaGVyZSxcIiB5b3Ugc2F5LiBcIlllcyxcIiBoZSBzYXlzLCBcIkkgY2FuIHNlZSB5b3UgaGF2ZSBjb21lIGEgbG9uZyB3YXkgdG8gZ2V0IGhlcmUsIGJ1dCBJIGFtIGdsYWQgeW91IGhhdmUgZm91bmQgcmVmdWdlIG9uIG15IGdyb3VuZHMuIElmIHlvdSBzZWUgYW55dGhpbmcgeW91IGxpa2UgaW4gbXkgcGxvdCB3ZSBjb3VsZCBtYWtlIGEgZGVhbCBwZXJoYXBzLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHdhdGVybWVsb24nKVxuICAgICAgICAgICAgQHByaW50KCdcIkkgd2lsbCBnaXZlIHlvdSB0aGUgd2F0ZXJtZWxvbiBpbiBleGNoYW5nZSBmb3IgYW4gaWNlIGNyZWFtIHN1bmRhZS5cIicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbnV0cycpIG9yIEBtYXRjaGVzKCd0YWtlIG51dCcpIG9yIEBtYXRjaGVzKCd0YWtlIGNoZXN0bnV0cycpIG9yIEBtYXRjaGVzKCd0YWtlIGNoZXN0bnV0JylcbiAgICAgICAgICAgIEBwcmludCgnXCJJIHdpbGwgZ2l2ZSB5b3Ugc29tZSB3YXRlciBjaGVzdG51dHMgaWYgeW91IGNhbiBmaW5kIG1lIGEgcHVyZSBicmVkIEdlcm1hbiBTaGVwYXJkLlwiJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBjdWN1bWJlcicpIG9yIEBtYXRjaGVzKCd0YWtlIGN1Y3VtYmVycycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiWW91IGNhbiBoYXZlIHRoZSBzZWEgY3VjdW1iZXJzIGluIGV4Y2hhbmdlIGZvciBhIGZ1bGwgcGFyZG9uIGZvciB0aGVzZSBtYWpvciBmZWxvbnkgY2hhcmdlcyB0aGF0IGFyZSBzdGlsbCBwZW5kaW5nLlwiJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBzdHJhd2JlcnJpZXMnKVxuICAgICAgICAgICAgQHByaW50KCdcIk9oLCBhY3R1YWxseSB0aG9zZSBzdHJhd2JlcnJ5IGZpZWxkcyBhcmVuXFwndCBldmVuIHJlYWwuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgZmxvd2VycycpIG9yIEBtYXRjaGVzKCd0YWtlIGZsb3dlcicpXG4gICAgICAgICAgICBpZiBub3QgQGZsYWdJcygnZ2l2ZW5fdW1icmVsbGEnLCB0cnVlKVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJJIGNhbiBzZWUgeW91IGxpa2UgdGhlIGZsb3dlcnMuIEkgd2lsbCBsZXQgeW91IGhhdmUgdGhlbSBpZiB5b3UgY2FuIGZpbmQgc29tZXRoaW5nIHRvIGtlZXAgaXQgZnJvbSBnZXR0aW5nIHNvIGhvdCBoZXJlLiBJIHdvdWxkIGJlIGFibGUgdG8gZG8gdHdpY2UgYXMgbXVjaCB3b3JrIGlmIGl0IHdlcmUgYSBiaXQgY29vbGVyLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIllvdSBoYXZlIGdyZWF0IHRhc3RlLiBUaGVzZSBmbG93ZXJzIGFyZSByZWFsbHkgdmVyc2F0aWxlIGFuZCB3aWxsIGJlIGdvb2QganVzdCBhYm91dCBhbnl3aGVyZS5cIicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ2Zsb3dlcnMnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dpdmUgdW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdcIlRoaXMgd2lsbCBiZSBwZXJmZWN0IGZvciBibG9ja2luZyBvdXQgdGhhdCBzdW7igJlzIGhhcnNoIHJheXMuIFRoYW5rcyFcIicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgndW1icmVsbGEnKVxuICAgICAgICAgICAgQHNldEZsYWcoJ2dpdmVuX3VtYnJlbGxhJywgdHJ1ZSlcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQ3V0dGxlZmlzaCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzd2ltIHVwIHRvIHRoZSBydWlucyBvZiB5b3VyIG9sZCB3b3JrIHBsYWNlLiBUaGlzIHBsYWNlIGhhcyBzZWVuIGJldHRlciBkYXlzLiBZb3VyIG1pbmQgaXMgZmxvb2RlZCB3aXRoIG1lbW9yaWVzIG9mIGZsb2F0aW5nIGluIGZyb250IG9mIHRoZSBvbGQgZ3JpbGwgYW5kIGNvbWluZyB1cCB3aXRoIG5ldyByZWNpcGVzIHRvIHRyeSB3aGVuIHlvdXIgbWFuYWdlciBoYWQgaGlzIGJhY2sgdHVybmVkLiBUaGVuIHNvbWVvbmUgc2FpZCBcIkV2ZXIgdHJpZWQgYW4gTS04MCBidXJnZXI/IEkgaGF2ZSBlbm91Z2ggZm9yIGV2ZXJ5b25lLlwiIFRoZSB3b3JkcyBlY2hvIGluIHlvdXIgbWluZCBsaWtlIGEgcGhhbnRvbSB3aGlzcGVyIG9mIGFnZXMgcGFzdC4gSXRcXCdzIHRoZSBydWlucyBvZiB0aGUgb2xkIFN0ZWFrIGFuZCBTaGFrZSB5b3UgdXNlZCB0byB3b3JrIGF0IHVudGlsIHlvdXIgZnJpZW5kIGJsZXcgaXQgdXAuIFRoZSB0YXR0ZXJlZCByZW1uYW50cyBvZiBhIHJlZCBhbmQgd2hpdGUgYXduaW5nIGZsdXR0ZXJzIGluIHRoZSB3aW5kIGFzIGlmIHRvIHN1cnJlbmRlciB0byBhbiBlbmVteS4gV2hhdCBpcyBsZWZ0IG9mIGEgZG9vciBoYW5ncyBvbiBhIHNpbmdsZSBoaW5nZSB0byB0aGUgd2VzdC4gQ3V0dGxlZmlzaCBzdG9tcGluZyBncm91bmRzIGxpZSBlYXN0LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKSBvciBAbWF0Y2hlcygnb3BlbiBkb29yJykgb3IgQG1hdGNoZXMoJ2VudGVyJykgb3IgQG1hdGNoZXMoJ2luJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0N1dHRsZWZpc2gnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuICAgICAgICAgICAgXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQXMgeW91IGFwcHJvYWNoLCB0aGUgZG9vciBmYWxscyBjbGVhbiBvZmYgYXMgaWYgdG8gd2FybiB5b3UgYWdhaW5zdCBlbnRyeS4gTmV2ZXIgYmVpbmcgb25lIGZvciBvbWVucywgeW91IGlnbm9yZSBpdC4gSW5zaWRlIHlvdSBkaXNjb3ZlciB0aGluZ3MgbXVjaCBhcyB5b3UgcmVtZW1iZXIgdGhlbS4gVGhhdCBpcywgaWYgdGhleSBoYWQgYmVlbiBtYXVsZWQgYnkgYSBiZWFyIHdpdGggYmxlbmRlcnMgZm9yIGhhbmRzIHdobyBwcm9jZWVkZWQgdG8gc2V0IG9mZiBhIHNlcmllcyBvZiBwbGFzdGljIGV4cGxvc2l2ZXMuIFRvIHRoZSBzb3V0aCB0aGVyZSBhcmUgc29tZSB0YWJsZXMgYW5kIGNoYWlycywgbm9ydGggbGllcyB0aGUga2l0Y2hlbiwgYW5kIHdlc3QgYSBzb2RhIGZvdW50YWluLiBUaGUgb3V0ZG9vcnMgaXMgZWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEaW5pbmcgQXJlYSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbiknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTb2RhIEZvdW50YWluKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoRGluaW5nIEFyZWEpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdBIGRpbGFwaWRhdGVkIGRpbmluZyBhcmVhIGxpZXMgYmVmb3JlIHlvdS4gSXQgaXMgY29tcGxldGVseSB1bnJlbWFya2FibGUuIFRoZXJlIGlzIG5vd2hlcmUgdG8gZ28gYmVzaWRlcyBub3J0aCB0byB0aGUgd2F5IHlvdSBjYW1lLicpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnV2VsY29tZSB0byB0aGUga2l0Y2hlbi4gU2luY2UgdGhlIHdhbGxzIGhhdmUgYWxsIGJlZW4gYmxvd24gYXdheSBvciBkaXNzb2x2ZWQsIHRoZSBvbmx5IHRoaW5nIHRoYXQgc2VwYXJhdGVzIGl0IGZyb20gdGhlIHJlc3Qgb2YgdGhlIHBsYWNlIGlzIHRoZSBvdmVuIGFuZCByYW5nZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG92ZW4nKSBvciBAbWF0Y2hlcygnb3BlbiBvdmVuJylcbiAgICAgICAgICAgIEBwcmludCgnQ2hlY2sgaXQgb3V0LCBpdFxcJ3MgeW91ciBmYXZvcml0ZSBwb3AsIGEgQ2hlcnJ5IE9yYW5nZSBTbm96emJlcnJ5IExpbWUgUGFzc2lvbmZydWl0IFZhbmlsbGEgQ3JvYWsgaW4gdGhlIG92ZW4uIFdobyBldmVyIHRob3VnaHQgb2YgYmFraW5nIGEgY2FuIG9mIHNvZGE/JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjYW4gb2Ygc29kYScpXG5cbiAgICAgICAgZWxzZSBpZiBAZmxhZ0lzKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpXG4gICAgICAgICAgICBpZiBAbWF0Y2hlcygnbWFrZSBwYW5jYWtlcycpXG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnXCJXaGVyZSBkbyBJIHN0YXJ0P1wiIHlvdSB3b25kZXIgb3V0IGxvdWQuIElmIG9ubHkgdGhlcmUgd2VyZSB3cml0dGVuIHNlcmllcyBvZiBpbnN0cnVjdGlvbnMgZ3VpZGluZyB5b3UgdGhyb3VnaC4gV2hlcmUgd291bGQgeW91IGZpbmQgc29tZXRoaW5nIGxpa2UgdGhhdD8nKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdVxcJ3JlIHBvbmRlcmluZyB0aGlzIHdoZW4gYSBkcmFmdCBjb21lcyBvdmVyIHlvdS4gVGhlIGxpZ2h0cyBmbGlja2VyIG9uIGFuZCBvZmYuIFlvdSBzZW5zZSBhIG15c3RlcmlvdXMgcHJlc2VuY2UuIFRoZSBnaG9zdCBvZiB5b3VyIG9sZCBmcmllbmQgQ3JlZ2dsZXMgYXBwZWFycyBiZWZvcmUgeW91LiBBcHBhcmVudGx5IGhlIGlzIGhhdW50aW5nIHRoZSBTdGVhayBhbmQgU2hha2Ugbm93IGFuZCB5b3VcXCdyZSBhbGwgbGlrZSBcIkNyZWdnbGVzLCBkaWRuXFwndCB3ZSBqdXN0IGhhbmcgb3V0IHRoZSBvdGhlciBkYXk/IEhvdyBhcmUgeW91IGEgZ2hvc3QgYWxyZWFkeT9cIicpXG4gICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCc8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiTmV2ZXIgeW91IG1pbmQgdGhhdCBub3dcIjwvc3Bhbj4gaGUgc2F5cyBpbiBoaXMgY3JlZXB5IG5lcmQgdm9pY2UuIDxzcGFuIGNsYXNzPVwiY3JlZXB5XCI+XCJTaGFyYywgaWYgeW91IGhvcGUgdG8gc2F2ZSB0aGUgd29ybGQgZnJvbSBjZXJ0YWluIGRvb20sIHlvdSBtdXN0IHN1Y2NlZWQgaW4gbWFraW5nIHRoZXNlIHBhbmNha2VzLiBVc2UgdGhpcyBhbmNpZW50IHJlY2lwZSBoYW5kZWQgZG93biBmcm9tIHRoZSBhbmNpZW50cyB0byBhaWQgeW91LlwiPC9zcGFuPiBBbiBvbGQsIGJhdHRlcmVkIHBpZWNlIG9mIHBhcGVyIGZsb2F0cyBkb3duIGxhbmRpbmcgYmVmb3JlIHlvdSBcIlN3ZWV0IE1lZW1hd3MgU3dlZXR5IFN3ZWV0IEZsYXBqYWNrc1wiIGl0IHJlYWRzLiA8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiTm93IG15IHdvcmsgaXMgZG9uZSBhbmQgSSBjYW4gYXNjZW5kIHRvIG15IHN0ZXBtb21cXCdzIGhvdXNlIGZvciBncmlsbGVkIGNoZWVzZSBzYW5kd2ljaGVzIGFuZCBjaG9jb2xhdGUgbWlsay5cIjwvc3Bhbj4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdZb3UgcmVhZCB0aGUgcmVjaXBlLiBJdCBpcyBhbGwgaW4gcmlkZGxlcy4gWW91IGhvcGUgeW91IGFyZSB1cCB0byB0aGUgdGFzay4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBhbiBlbXB0eSBib3dsIHNpdHRpbmcgdGhlcmUpJylcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYW4gZW1wdHkgYm93bCBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnSW4gYW4gdXJuIHRha2UgYnV0IG5vdCBjaHVybiBpdGVtcyB0d28gbm90IGxpa2UgZ29vLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvZGEgZmxvd2VyJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdjYW4gb2Ygc29kYScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3VyIHBvdGlvbiBpcyBkcnkuIFRoaXMgd2lsbHN0IG5vdCBmbHkuIFdoYXRcXCdzIG5leHQgbXVzdCBiZSBkdW1wZWQsIHBvdXJlZCBhbmQgY3JhY2tlZCBmb3IgYSBwcm9wZXIgZmxhcGphY2suJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbWlsayBlZ2cgYnV0dGVyJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdlZ2cnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ21pbGsnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ21hcmdhcmluZScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0N1dHRpbmcgYW5kIHNjb29waW5nIHNoYWxsIGhhdmUgdGhlaXIgZGF5LCBidXQgYSBmb3IgYSBmaW5lIGZsdWZmeSBiYXR0ZXIgdGhlcmUgYmUgYnV0IG9uZSB3YXkuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3RpcicpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIG1peGVkIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc2hha2UnKVxuICAgICAgICAgICAgQHByaW50KCdEdWRlLCB3aG8gZG8geW91IHRoaW5rIHlvdSBhcmUsIEphbWVzIEJvbmQ/ICBUaGlzIGJhdHRlciBuZWVkcyB0byBiZSBzdGlycmVkLCBub3Qgc2hha2VuLicpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgbWl4ZWQgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1NldCB0aGUgZ3JpZGRsZSBvciBzdG92ZSB0byBtZWRpdW0gaGVhdC4gQWZ0ZXIgaXQgaXMgd2FybWVkLCBkcm9wIGJhdHRlciBhIHF1YXJ0ZXIgY3VwIGF0IGEgdGltZSBhbmQgdHVybmluZyBvbmNlIHVudGlsIGJ1YmJsZXMgYXBwZWFyLiBcIldlbGwgdGhhdCBzZWVtcyBwcmV0dHkgY2xlYXIuIEkgdGhpbmsgSSBjYW4gZG8gdGhhdCBvbiBteSBvd24uXCInKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBwbGF0ZSBvZiBkcnkgcGFuY2FrZXMgc2l0dGluZyB0aGVyZSknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBwbGF0ZSBvZiBkcnkgcGFuY2FrZXMgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RlbiBtaW51dGVzIGxhdGVyIHRoZSBwYW5jYWtlcyBhcmUgZmluaXNoZWQsIGJ1dCBzb21ldGhpbmcgaXMgbWlzc2luZy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzeXJ1cCcpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnc3lydXAnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZ290IHBhbmNha2VzISAgSG90IGRhbmcuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNvZGEgRm91bnRhaW4pJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc2VlIHRoYXQgdGhlIHNvZGEgZm91bnRhaW4gaGFzIHNvbWVob3cgcmVtYWluZWQgbGFyZ2VseSB1bmRhbWFnZWQuIFlvdSB0aGluayBiYWNrIHRvIHRoZSBkYXlzIHdoZW4geW91IHdvdWxkIHNuZWFrIG91dCBiYWdzIG9mIHBsYWluIHN5cnVwIHRvIGRyaW5rIGFuZCB0aGUgZnJlYWtpc2ggd2FraW5nIGRyZWFtcyBpdCB3b3VsZCBpbmR1Y2UgaW4geW91LiBZb3Ugd29uZGVyIGlmIHRoZXJlIGlzIGFueSBzdGlsbCBpbiB0aGVyZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGZvdW50YWluJykgb3IgQG1hdGNoZXMoJ29wZW4gZm91bnRhaW4nKSBvciBAbWF0Y2hlcygnbG9vayBzb2RhJykgb3IgQG1hdGNoZXMoJ29wZW4gc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ0F2YXN0LCBhIGhpZGRlbiB0cmVhc3VyZSB0cm92ZSBvZiBzdWdhcnkgd29uZGVyIHRoYXQgaGFzIGxhaW4gZG9ybWFudCBhbGwgdGhlc2UgeWVhcnMhIFlvdSB0cmVtYmxlIGF0IHRoZSBiZWF1dHkgb2YgdGhlIHNpZ2h0IGJlZm9yZSB5b3UuIFNvIG1hbnkgYmFncyBhbmQgeWV0IHlvdXIgbWFnaWMgaGFtbWVyc3BhY2Ugc2F0Y2hlbCB3aWxsIG9ubHkgYWxsb3cgZm9yIG9uZS4gVGhlcmVcXCdzIFNwcml0eiwgUHJvZmVzc29yIEdpbmdlciwgQ2FjdHVzIExhZ2VyLCBhbmQgTXMuIFNoaW0gU2hhbVxcJ3MgTWFwbGUgU29kYS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbWFwbGUnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZmluZCBpdCBzaG9ja2luZyB0aGF0IHlvdSBhcmUgdGhlIGZpcnN0IHJhaWRlciBvZiB0aGlzIHNvZGEgdG9tYi4gQnV0IHRoZW4gYWdhaW4sIHlvdSBoYXZlIGFsd2F5cyBzYWlkIHBlb3BsZSBkb25cXCd0IGtub3cgdGhlIHZhbHVlIG9mIGEgYmFnIG9mIGxpcXVpZCBzdWdhci4gWW91IHRha2Ugb2ZmIHdpdGggaXQgdW5kZXIgY292ZXIgb2YgZGFya25lc3MuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdzeXJ1cCcpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UganVzdCB3YWxrZWQgb250byB0aGUgc2V0IG9mIHRoZSB3aWxkbHkgcG9wdWxhciBnYW1lIHNob3csIFwiU2VhbCBvciBObyBTZWFsIVwiIFdoZXJlIGZsYW1ib3lhbnQgY29udGVzdGFudHMgZmxhaWwgYXJvdW5kIGFuZCBzaG91dCB3aGlsZSB0cnlpbmcgdG8gYXJyaXZlIGF0IHRoZSBhbnN3ZXIgdG8gdGhhdCBhZ2Ugb2xkIHF1ZXN0aW9uLi4uU0VBTCBPUiBOTyBTRUFMPyBUbyB0aGUgZWFzdCBpcyBiYWNrc3RhZ2UsIG5vcnRoIHdpbGwgdGFrZSB5b3UgdG8gdGhlIGRyZXNzaW5nIHJvb20sIHdlc3Qgb3Igc291dGggd2lsbCB0YWtlIHlvdSBiYWNrIHdoZXJldmVyIHlvdSBjYW1lIGZyb20uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQmlsbHkgT2NlYW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tKScsIC0+XG4gICAgICAgIHN0ZXAxID0gJ0xldFxcJ3Mgc3RhcnQgd2l0aCBoZWFkZ2Vhci4gWW91IHNlZSBhIGNvd2JveSBoYXQsIGEgcmFpbmJvdyB3aWcsIGEgbW90b3JjeWNsZSBoZWxtZXQsIGFuZCBhIHN0b3ZlcGlwZSBoYXQuJ1xuICAgICAgICBzdGVwMiA9ICdOb3cgc2VsZWN0IGEgc2V0IG9mIGNsb3RoZXMuIFlvdSBzZWUgYSBsZWF0aGVyIGphY2tldCwgYSBjbG93biBzdWl0LCBhbiBvbGR0aW1leSBzdWl0IHdpdGggb25lIG9mIHRob3NlIENvbG9uZWwgU2FuZGVycyB0aWVzLCBhbmQgYSBjb3cgcHJpbnQgdmVzdC4nXG4gICAgICAgIHN0ZXAzID0gJ0FjY2Vzc29yaXplISBQaWNrIGZyb20gYSBmYWtlIGJlYXJkLCBhIGd1biBiZWx0LCBhIG1ldGFsIGNoYWluLCBhbmQgYSBydWJiZXIgY2hpY2tlbi4nXG4gICAgICAgIGRvbmUgPSAnWW91IGxvb2sgYWJzb2x1dGVseSBob3JyaWJsZSEgT3IgYW1hemluZywgZGVwZW5kaW5nIG9uIHlvdXIgcGVyc3BlY3RpdmUuIEJ1dCB0aGUgdHJ1ZSBqdWRnZSB3aWxsIGJlIHRoZSBnYW1lIHNob3cgbWFuYWdlci4nXG5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIHBsYWNlIGlzIGdyZWF0ISBJdCB3b3VsZCBiZSBlYXN5IHRvIGNvYmJsZSB0b2dldGhlciBhIGNvc3R1bWUgdG8gZ2V0IG9uIHRoYXQgc2hvdy4gTGV0cyBzZWUgd2hhdCB3ZSBjYW4gZmluZC4gT2J2aW91cyBleGl0cyBhcmUgc291dGggdG8gdGhlIHNob3cgZW50cmFuY2UuJylcbiAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjb3N0dW1lJylcbiAgICAgICAgICAgIEBwcmludChzdGVwMSlcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGNvd2JveSBoYXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Nvd2JveSBoYXQnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAyKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHJhaW5ib3cgd2lnJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdyYWluYm93IHdpZycpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDIpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMilcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBzdG92ZXBpcGUgaGF0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdzdG92ZXBpcGUgaGF0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMilcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGxlYXRoZXIgamFja2V0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdsZWF0aGVyIGphY2tldCcpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDMpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgY2xvd24gc3VpdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY2xvd24gc3VpdCcpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDMpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2Ugb2xkdGltZXkgc3VpdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnb2xkdGltZXkgc3VpdCcpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDMpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgY293IHZlc3QnKSBvciBAbWF0Y2hlcygndGFrZSBwcmludCB2ZXN0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjb3cgcHJpbnQgdmVzdCcpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDMpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBmYWtlIGJlYXJkJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdmYWtlIGJlYXJkJylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGd1biBiZWx0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdndW4gYmVsdCcpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBtZXRhbCBjaGFpbicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnbWV0YWwgY2hhaW4nKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgcnViYmVyIGNoaWNrZW4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3J1YmJlciBjaGlja2VuJylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBjb3N0dW1lTWF0Y2hlcyA9IChlbmdpbmUpIC0+XG4gICAgICAgIGRlYnVnZ2VyXG4gICAgICAgIGdyb3VwMSA9IDBcbiAgICAgICAgZ3JvdXAyID0gMFxuICAgICAgICBncm91cDMgPSAwXG4gICAgICAgIGdyb3VwNCA9IDBcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnY293Ym95IGhhdCcpIHRoZW4gZ3JvdXAxKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ3JhaW5ib3cgd2lnJykgdGhlbiBncm91cDErK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKSB0aGVuIGdyb3VwMSsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdzdG92ZXBpcGUgaGF0JykgdGhlbiBncm91cDErK1xuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdsZWF0aGVyIGphY2tldCcpIHRoZW4gZ3JvdXAyKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Nsb3duIHN1aXQnKSB0aGVuIGdyb3VwMisrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdvbGR0aW1leSBzdWl0JykgdGhlbiBncm91cDIrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnY293IHByaW50IHZlc3QnKSB0aGVuIGdyb3VwMisrXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2d1biBiZWx0JykgdGhlbiBncm91cDMrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgncnViYmVyIGNoaWNrZW4nKSB0aGVuIGdyb3VwMysrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdmYWtlIGJlYXJkJykgdGhlbiBncm91cDMrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnbWV0YWwgY2hhaW4nKSB0aGVuIGdyb3VwMysrXG5cbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KGdyb3VwMSwgZ3JvdXAyLCBncm91cDMsIGdyb3VwNClcblxuICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyA9IChlbmdpbmUpIC0+XG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjb3dib3kgaGF0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3JhaW5ib3cgd2lnJylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3N0b3ZlcGlwZSBoYXQnKVxuXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdsZWF0aGVyIGphY2tldCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjbG93biBzdWl0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ29sZHRpbWV5IHN1aXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnY293IHByaW50IHZlc3QnKVxuXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdndW4gYmVsdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdydWJiZXIgY2hpY2tlbicpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdmYWtlIGJlYXJkJylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ21ldGFsIGNoYWluJylcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBpcyB0aGUgc3RhZ2UuIEl0IGlzIGp1c3QgYXMgc3R1cGlkIGxvb2tpbmcgYXMgdGhlIHJlc3Qgb2YgdGhlIHNob3cuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIHNob3dcXCdzIGVudHJhbmNlLiBUaGUgc2hvdyBtYW5hZ2VyIHN0YXJlcyBhdCB5b3UgcXVlc3Rpb25pbmdseS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsgbWFuYWdlcicpXG4gICAgICAgICAgICBzd2l0Y2ggY29zdHVtZU1hdGNoZXMoQClcbiAgICAgICAgICAgICAgICB3aGVuIDBcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdUaGUgc2hvdyBtYW5hZ2VyIGFwb2xvZ2l6ZXMsIFwiSSBhbSBzb3JyeSBzaXIsIHlvdSBsb29rIGxpa2UgYSBkZWNlbnQga2luZCBvZiBwZXJzb24sIGFuZCBJXFwnbSBhZnJhaWQgd2UgaGF2ZSBubyBwbGFjZSBmb3IgdGhhdCBvbiB0ZWxldmlzaW9uLiBNYXliZSBpZiB5b3UgY2FtZSBiYWNrIGRyZXNzZWQgbGlrZSBhIG1hbmlhYyB3ZSBjb3VsZCB3b3JrIHNvbWV0aGluZyBvdXQuJylcbiAgICAgICAgICAgICAgICB3aGVuIDNcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdUaGUgc2hvdyBtYW5hZ2VyIGxvb2tzIHlvdSBvdmVyLCBub3RpY2luZyBnb29kIHRhc3RlLCB5b3VyIGtuYWNrIGZvciBmbGFpciBhbmQgYXR0ZW50aW9uIHRvIGRldGFpbC4gSGUgZGVjbGFyZXMgXCJXZWxsLCBJIGFwcHJlY2lhdGUgeW91IHRha2luZyB0aW1lIHRvIGFzc2VtYmxlIHRoZSBjb3N0dW1lLCBidXQgaXQgaXMganVzdCBhIGJpdCB0b28gb3JkZXJseS4gWW91IHJlYWxseSBhcmVuXFwndCB3aGF0IHdlIGFyZSBsb29raW5nIGZvci5cIicpXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyhAKVxuICAgICAgICAgICAgICAgIHdoZW4gMlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgbG9va3MgcGxlYXNlZCwgeWV0IGEgdG91Y2ggdHJvdWJsZWQuIFwiWW91IGxvb2sgdG8gYmUgYSBtYW4gZ29pbmcgaW4gdGhlIHJpZ2h0IGRpcmVjdGlvbiwgYnV0IHdlIG9ubHkgc2VsZWN0IHRoZSBiZXN0IG9mIHRoZSBiZXN0IGZvciBTZWFsIG9yIG5vIFNlYWwuIFlvdXIgY29zdHVtZSBpcyBub3QgcXVpdGUgcmVhZHkgZm9yIHRoZSBiaWcgc2hvdyB5ZXQuJylcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgd2hlbiAxXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdcIk9oLCB3b3chXCIgRXhjbGFpbXMgdGhlIHNob3cgbWFuYWdlci4gXCJZb3UgbG9vayBhYnNvbHV0ZWx5IGF3ZnVsLiBZb3UgZGVmaW5pdGVseSBoYXZlIHRoZSBsb29rIGZvciBvdXIgc2hvdy5cIiBZb3Ugc3RhcnQgdG8gZGFuY2UgYXJvdW5kLCB3aG9vcGluZyBhbmQgaG9sbGVyaW5nLCBkZWNsYXJpbmcgeW91cnNlbGYgdGhlIGZ1dHVyZSBraW5nIG9mIHRoZSB3b3JsZC4gXCJBbmQgSSBzZWUgeW91IGhhdmUgdGhlIGNoYXJpc21hIHRvIG1hdGNoLlwiIEhlIHR1cm5zIHRvIGhpcyBhc3Npc3RhbnQsIFwiR2V0IHRoaXMgZmVsbGEgb24gc3RhZ2UgYXQgb25jZS4nKVxuICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoT24gU3RhZ2UhKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKE9uIFN0YWdlISknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiV2VsY29tZSBiYWNrIHRvIHRoZSBTZWFsIG9yIE5vIFNlYWwsIHRoZSBtb3N0IHBvcHVsYXIgZ2FtZSBzaG93IHVuZGVyIHRoZSBzZWEhIElcXCdtIHlvdXIgd2VsbCB0YW5uZWQgaG9zdCBKZXJyeSBaaW50ZXJ2YW5kZXJiaW5kZXJiYXVlciBKci4gTGV0XFwncyBtZWV0IG91ciBuZXh0IGNvbnRlc3RhbnQ6IFNoYXJjISBBbiBpbmNyZWRpYmx5IG9ibm94aW91cyB5ZXQgcGVyc3Vhc2l2ZSB5b3VuZyBvY2VhbiBkd2VsbGVyLCBoZSBsb3ZlcyBhbm5veWluZyBoaXMgZnJpZW5kcyBhbmQgaXMgYWx3YXlzIHVwIGZvciBhIHJvdW5kIG9mIFNjcmFiYmxlLCBMQURJRVMuIFRpbWUgdG8gZ2V0IHN0YXJ0ZWQuIE5vdywgU2hhcmMgSSBhbSBnb2luZyB0byBwcmVzZW50IHlvdSB3aXRoIGEgYnJpZWZjYXNlLiBJbiB0aGlzIGJyaWVmY2FzZSwgdGhlcmUgbWlnaHQgYmUgYSBzZWFsIG9yIHRoZXJlIG1pZ2h0IG5vdCBiZSBhIHNlYWwuIEFuZCBJIG5lZWQgeW91IHRvIHRlbGwgbWUgd2hpY2ggaXQgaXM6IFNFQUwgb3IgTk8gU0VBTD9cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm8gc2VhbCcpXG4gICAgICAgICAgICBhbGVydCgnSmVycnkgc2xvd2x5IG9wZW5zIHRoZSBicmllZmNhc2UsIHBlZWtpbmcgaW5zaWRlIGZpcnN0IHRvIGRldGVjdCBhbnkgc2lnbnMgb2Ygc2VhbCBlbnRyYWlscyBhbmQgdGhlbiwgd2VhcmluZyBhIGZhY2Ugb2YgcHJhY3RpY2VkIGRpc2FwcG9pbnRtZW50IGFuZCBlbXBhdGh5LCB3aGltcGVycyBcIlRvbyBiYWQsXCIgbGV0dGluZyB0aGUgY2FzZSBvcGVuIHRoZSByZXN0IG9mIHRoZSB3YXkuIEF0IHRoaXMsIHlvdSBhcmUgcHJvbXB0bHkgdXNoZXJlZCBvZmYgdGhlIHN0YWdlIHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzdWNrZXIuJylcbiAgICAgICAgICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyhAKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NlYWwnKVxuICAgICAgICAgICAgYWxlcnQoJ0plcnJ5IHNsb3dseSBvcGVucyB0aGUgYnJpZWZjYXNlLCBwZWVraW5nIGluc2lkZSBmaXJzdCB0byBkZXRlY3QgYW55IHNpZ25zIG9mIHNlYWwgZW50cmFpbHMgYW5kIHRoZW4gZXhjaXRlZGx5IHB1bGxzIGl0IGFsbCB0aGUgd2F5IG9wZW4uIFwiSGVcXCdzIHJpZ2h0IHBlb3BsZSEgTm93LCBsZXRcXCdzIHNlZSB5b3VyIHByaXplcy5cIiBcIlByaXplcyBpcyByaWdodCBKZXJyeSxcIiBzYXlzIGEgdm9pY2UgY29taW5nIGZyb20gbm93aGVyZSBhbmQgZXZlcnl3aGVyZSBhbGwgYXQgb25jZS4gXCJIZXJlIGFyZSBzb21lIHdvcmxkIGNsYXNzIHNlbGVjdGlvbnMgSSBwaWNrZWQgdXAgZnJvbSB0aGUgZ3JvY2VyeSBzdG9yZSBvbiB0aGUgd2F5IGhlcmUgdGhpcyBtb3JuaW5nOiBTdWNjZXNzIGNvbWVzIGluIGNhbnMsIG5vdCBpbiBjYW4gbm90cy4gVGluIGNhbnMgdGhhdCBpcyEgVGhhdFxcJ3Mgd2h5IHdlIGFyZSBvZmZlcmluZyB5b3UgdGhlIGNob2ljZSBvZiBhIGZ1bGwgd2Vla1xcJ3Mgc3VwcGx5IG9mIFxcJ0NhcHRhaW4gTmVkXFwncyBQaWNrbGVkIEhlcnJpbmdcXCcsIG9yIFxcJ05vIElmcyBBbmRzIG9yIEJ1dHRlclxcJyBicmFuZCBtYXJnYXJpbmUgc3ByZWFkIHByb2R1Y3QgZm9yIHlvdXIgY29uc3VtcHRpb24gcGxlYXN1cmUuICBOYXR1cmFsbHkgeW91IGNob29zZSB0aGUgbWFyZ2FyaW5lIGJlY2F1c2UgeW91IGFyZSBoZWFsdGggY29uc2Npb3VzIG9yIHNvbWV0aGluZy4nKVxuICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICBAZ2V0SXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ09oIG1hbiwgV2F0ZXIgV29ybGQhIFlvdSBsb3ZlIHRoYXQgbW92aWUuIEtldmluIENvc3RuZXIgc2hvdWxkIGhhdmUgdG90YWxseSBnb3R0ZW4gdGhlIE9zY2FyLiBXYWl0IHRoaXMgaXNuXFwndCBsaWtlIHRoYXQuIFRoaXMgaXMgV2F0ZXIgV29ybGQsIHRoZSBob21lIG9mIHRoYXQgc3R1cGlkIGtpbGxlciB3aGFsZSwgU2hhbXB1LiBXaGF0IGEgaGFjayEgT2J2aW91cyBleGl0cyBhcmUgbm9ydGggdG8gdGhlIE1hbmF0ZWUgc2hvdywgZWFzdCB0byB0aGUgZ2lmdCBzaG9wLCBhbmQgc291dGggdG8gdGhlIEFjaHRpcHVzXFwncyBnYXJkZW4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChHaWZ0IFNob3ApJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdBbmQgdGhlcmUgaXQgaXM6IFRoZSBpbGx1c3RyaW91cyBtYW5hdGVlLiBZb3UgY2FuIHNlZSB3aHkgdGhlIHN0YW5kcyBhcmUgZW1wdHkuIFRoZXJlIGFyZSBiaWcgdW1icmVsbGFzIGF0dGFjaGVkIHRvIHNvbWUgcGljbmljIHRhYmxlczsgbm90IG11Y2ggdG8gc2VlLiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBNYW5hdGVlIHNlcnZpY2Ugcm9vbSBhbmQgc291dGggdG8gdGhlIHBhcmsgZW50cmFuY2UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHVtYnJlbGxhJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCd1bWJyZWxsYScpXG4gICAgICAgICAgICBAcHJpbnQoJ1dlbGwsIG9rYXkuIFlvdSBub3cgaGF2ZSBhbiB1bWJyZWxsYS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCAoTWVjaGFuaWNhbCBSb29tIFR5cGUgUGxhY2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCAoR2lmdCBTaG9wKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGVudGVyIHRoZSBXYXRlciBXb3JsZCBnaWZ0IHNob3AuIFRoZXJlIGFyZSBhbGwgc29ydHMgb2YgZ3JlYXQgaXRlbXMgaGVyZTogYSBnaWFudCBzdHVmZmVkIG9jdG9wdXMsIGRlaHlkcmF0ZWQgYXN0cm9uYXV0IGZpc2ggZm9vZCwganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzLCBhbmQgc29tZSBvZiB0aGF0IGNsYXkgc2FuZCBjcmFwIHRoZXkgdXNlZCB0byBhZHZlcnRpc2Ugb24gVFYuIFNlZSBhbnl0aGluZyB5b3UgbGlrZT8gRWFzdCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgYmFkZ2UnKSBvciBAbWF0Y2hlcygndGFrZSBzaGVyaWZmJykgb3IgQG1hdGNoZXMoJ3Rha2Ugc3RpY2tlcicpIG9yIEBtYXRjaGVzKCd0YWtlIHN0aWNrZXJzJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdiYWRnZSBzdGlja2VyJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHRha2UgdGhlIGp1bmlvciBtYXJpbmUgc2hlcmlmZiBiYWRnZSBzdGlja2VycyB0byB0aGUgY291bnRlci4gVGhlIGNhc2hpZXIgc2F5cyB0aGV5IGFyZSBvbiBzYWxlLCBvbmx5IDE1IGZpc2ggZG9sbGFycywgcGx1cyB0YXguIFl1c3Nzcy4gWW91IHBheSB0aGUgbWFuLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZScpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSB0YWtlIHRoYXQgaXRlbSB0byB0aGUgY291bnRlci4gVGhlIGNhc2hpZXIgc2F5cyBpdCBpcyAnICsgKDE4ICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMzApKS50b1N0cmluZygpICsgJyBmaXNoIGRvbGxhcnMgYnV0IHlvdSBvbmx5IGhhdmUgMTcgZmlzaCBkb2xsYXJzLiBOdXRzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkIChNZWNoYW5pY2FsIFJvb20gVHlwZSBQbGFjZSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1doYXQgaW4gdGhlIG5hbWUgb2YgQ2FwdGFpbiBOZW1vIGlzIHRoaXM/IFRoZXJlIGFyZSBtYW5hdGVlcyBpbiBob2lzdHMgYWxsIG92ZXIgdGhlIHJvb20gaG9va2VkIHVwIHRvLi4ubWlsa2luZyBkZXZpY2VzLiBUaGlzIGlzIG5vIG1lY2hhbmljYWwgcm9vbSEgSXRcXCdzIGEgY292ZXIgZm9yIGEgc2VjcmV0LCBpbGxlZ2FsLCB1bmRlcmdyb3VuZCwgYmxhY2sgbWFya2V0LCBidXQgcHJvYmFibHkgb3JnYW5pYywgc2VhIGNvdyBtaWxraW5nIG9wZXJhdGlvbi4gVGhlIGZpZW5kcyEgWW91IGFyZSBnb2luZyB0byBibG93IHRoZSBsaWQgb2ZmIHRoaXMgdGhpbmcgZm9yIHN1cmUuIFRoZSBzd2VhdHkgb2xkIGZpc2ggcnVubmluZyB0aGUgbWFjaGluZXJ5IGhhcyBub3Qgbm90aWNlZCB5b3UgeWV0LiBPYnZpb3VzIGV4aXRzIGFyZSBlYXN0IHRvIHRoZSBtYW5hdGVlIGV4aGliaXQuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsaycpIG9yIEBtYXRjaCgnYmFkZ2UnKSBvciBAbWF0Y2goJ3N0aWNrZXInKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdiYWRnZSBzdGlja2VyJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBzd2ltIHVwIHRvIHRoZSBmaXNoIGF0IHRoZSBjb250cm9scy4gXCJJIGFtIGdvaW5nIHRvIHNodXQgeW91IGRvd24hXCIgWW91IHNob3V0IGF0IGhpbS4gSGUgbGF1Z2hzIGhlYXJ0aWx5LiBcIllvdSBkb25cXCd0IHN0YW5kIGEgY2hhbmNlLiBZb3VcXCdyZSBqdXN0IGEgcmVndWxhciBndXkuIElcXCdtIHRoZSBtYXlvciBvZiBXYXRlciBXb3JsZC4gV2hvIGlzIGdvaW5nIHRvIGJlbGlldmUgeW91P1wiIEhlIGdvZXMgYmFjayB0byBoaXMgd29yayBwYXlpbmcgeW91IG5vIG1pbmQuIEhlIGhhcyBhIHBvaW50LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgZmlzaCBicmFuZGlzaGluZyB5b3VyIGJhZGdlIHN0aWNrZXIuIFwiWW91IGFyZSB1bmRlciBhcnJlc3QgZm9yIGlsbGVnYWwgbWlsayBoYXJ2ZXN0aW5nIGZyb20gZW5kYW5nZXJlZCBtYW5hdGVlcy4gSVxcJ20gdGFraW5nIHlvdSBpbi5cIiBcIldhaXQsXCIgaGUgc2F5cywgXCJZb3UgZG9uXFwndCBoYXZlIHRvIGRvIHRoaXMuIEl0XFwncyB0aGUgb25seSB3YXkgSSBjYW4ga2VlcCBXYXRlciBXb3JsZCBydW5uaW5nLiBEb25cXCd0IHlvdSBzZWU/IE5vdyB0aGF0IHdlIGFyZSBvbiBvdXIgc2l4dGggU2hhbXB1LCBwZW9wbGUganVzdCBkb25cXCd0IHNlZW0gdG8gY2FyZSBhYm91dCB0aGUgbWFnaWMgb2YgZXhwbG9pdGVkIG1hcmluZSBtYW1tYWxzLiBJIHdpbGwsIHVoLi4ubWFrZSBpdCB3b3J0aCB5b3VyIHdoaWxlIHRob3VnaC5cIiBIZSBzbGlkZXMgYSBmcmVzaCBib3R0bGUgb2YgbWlsayBpbiB5b3VyIGRpcmVjdGlvbi4gV2l0aG91dCBsb29raW5nIGF0IHlvdSBoZSBzYXlzLCBcIkl0IGlzIHdvcnRoIHRob3VzYW5kcyBpbiB0aGUgcmlnaHQgbWFya2V0LlwiJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnbWlsaycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGhhdmUgZW50ZXJlZCBUaGUgRXRoZXJlYWwgUmVhbG0uIFdoeSBkaWQgeW91IGRvIHRoYXQ/IFRoYXQgd2FzIGEgYmFkIGRlY2lzaW9uLiBXYWxlIGlzIGF0IHlvdXIgc2lkZS4gVGhlcmUgYXJlIGEgYnVuY2ggb2Ygd2VpcmQsIHNwYWNleSBwbGF0Zm9ybXMgYW5kIGp1bmsgZmxvYXRpbmcgYXJvdW5kIGluIGEgY29zbWljIHZvaWQgLS0geW91ciB0eXBpY2FsIHN1cnJlYWxpc3QgZHJlYW1zY2FwZSBlbnZpcm9ubWVudC4gQWhlYWQgaXMgYW4gdWdseSBtb25zdGVyLiBIZSBpcyBjbHV0Y2hpbmcgc29tZXRoaW5nIGluIGhpcyBoYW5kLiBPYnZpb3VzIGV4aXRzIGFyZSBOT05FISBUaGlzIGlzIHRoZSB3b3JsZCBvZiB3YWtpbmcgbmlnaHRtYXJlcyB5b3UgZGluZ3VzLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsgbW9uc3RlcicpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBhcmUgZ2V0dGluZyB3b3JzZSBhdCB0aGlzIGdhbWUuIFlvdSBhcHByb2FjaCBzYWlkIG1vbnN0ZXIgaW4gYW4gZWZmb3J0IHRvIGdldCBzb21lIGxlYWRzIG9uIHlvdXIgcHJlY2lvdXMgaGFpciBwcm9kdWN0LiBNYXliZSBzdGFydCBieSBhc2tpbmcgaGltIGFib3V0IHRoZSBzdGF0dXMgb2YgdGhlIGxvY2FsIGJhc2tldGJhbGwgdGVhbSBvciBzb21ldGhpbmc/IE9uIGNsb3NlciBleGFtaW5hdGlvbiB0aG91Z2gsIHlvdSByZWFsaXplIHRoaXMgaXMgbm90IGp1c3QgYW55IG1vbnN0ZXIuIEl0IGlzIGEgVG9ydW1la2lhbiBoeXBlciBnb2JsaW4uIEFuZCBpbiBoaXMgZ3Jpc2x5IHBhdyByZXN0cyB0aGUgaXRlbSBvZiB5b3VyIHF1ZXN0LCB5b3VyICQyMyBzaGFtcG9vLiBcIlNoYXJjLCB3ZSBjYW4gbm90IGFsbG93IGhpbSB0byB1c2UgdGhhdCBzaGFtcG9vLFwiIHdoaXNwZXJzIHlvdXIgY29tcGFuaW9uLiBcIk9uIHRoZSBoZWFkIG9mIGEgaHlwZXIgZ29ibGluLCBoYWlyIHRoYXQgc21vb3RoIGNvdWxkIG1lYW4gdGhlIGVuZCBvZiBmYXNoaW9uIGFzIHdlIGtub3cgaXQuIFdlIG11c3QgcmV0cmlldmUgaXQgYnkgYW55IG1lYW5zIG5lY2Vzc2FyeS5cIiBObyBzb29uZXIgaGF2ZSB0aGUgd29yZHMgbGVmdCBXYWxlXFwncyBsaXBzIHRoYXQgeW91IGFyZSBzcG90dGVkLiBUaGF0IGlzIGFsbCB0aGUgbW90aXZhdGlvbiB0aGlzIGJlYXN0IG5lZWRzLiBIZSBmbGlwcyB0aGUgY2FwIG9uIHRoZSBib3R0bGUsIHJhaXNpbmcgaXQgdG8gdGhlIGZpbHRoeSwgc3RyaW5nLWxpa2UgbW9wIHlvdSBjYW4gb25seSBhc3N1bWUgbXVzdCBiZSBoaXMgaGFpciwgYWxsIHRoZSB3aGlsZSBnYXppbmcgZG93biBhdCB5b3UgaW4gZGVmaWFuY2Ugd2l0aCBoaXMgc2luZ2xlIGJsb29kIHNob3QgZXllLiBEbyBzb21ldGhpbmchJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdhdHRhY2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc3RhcnQgdG8gbHVuZ2UgdG93YXJkcyB0aGUgY3JlYXR1cmUsIGJ1dCBXYWxlIHB1c2hlcyB5b3Ugb3V0IG9mIHRoZSB3YXkgaW4gYSBjaGFyZ2UgaGltc2VsZi4gWW91IGNyaW5nZSBhcyB5b3UgaGVhciB0aGUgc2xhc2hpbmcgb2YgZmxlc2guIFJlZCBtaXN0IGZsb2F0cyBvdXQgb2YgV2FsZVxcJ3Mgc2lkZS4gWW91ciBoZWFkIGlzIHNwaW5uaW5nLiAgXCJOb3cgU2hhcmMhXCIsIGhlIHdoZWV6ZXMsIFwiVXNlIHRoZSBwb3dlciBvZiB0aGUgUXVhZHJhdGljIEV5ZS5cIiBcIkJ1dCB5b3Ugc2FpZCBJIHdhc25cXCd0IHJlYWR5IVwiIHlvdSBjcnksIHRyeWluZyBub3QgdG8gbG9vayBhdCB0aGUgc29ycnkgc3RhdGUgb2YgeW91ciBmcmllbmQuIFwiTm8sIGl0IHdhcyBJIHdobyB3YXMgbm90IHJlYWR5LiBUaGUgcC1wb3dlciBoYXMgYWx3YXlzIGJlZW4gd2l0aGluIHkteW91LlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd1c2UgcXVhZHJhdGljIGV5ZScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0VuZCcpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdFbmQnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSByZW1vdmUgdGhlIFF1YWRyYXRpYyBFeWUgZnJvbSBpdHMgY29tcGFydG1lbnQsIGNsb3NlIHlvdXIgZXllcyBhbmQgYWxsb3cgdW5pb24gYmV0d2VlbiB5b3VyIHNwaXJpdCBhbmQgdGhlIHVuaXZlcnNhbCBjaGkgZmxvdy4gVGhlbiB0aGUgZ29ibGluIGdldHMgY3V0IGluIGhhbGYgYW5kIHlvdSBnZXQgeW91ciBzaGFtcG9vIGJhY2suJylcblxuXG4gICAgZW5naW5lLnNldFN0YXJ0Um9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiknKVxuIiwidmFyIG0gPSAoZnVuY3Rpb24gYXBwKHdpbmRvdywgdW5kZWZpbmVkKSB7XHJcblx0dmFyIE9CSkVDVCA9IFwiW29iamVjdCBPYmplY3RdXCIsIEFSUkFZID0gXCJbb2JqZWN0IEFycmF5XVwiLCBTVFJJTkcgPSBcIltvYmplY3QgU3RyaW5nXVwiLCBGVU5DVElPTiA9IFwiZnVuY3Rpb25cIjtcclxuXHR2YXIgdHlwZSA9IHt9LnRvU3RyaW5nO1xyXG5cdHZhciBwYXJzZXIgPSAvKD86KF58I3xcXC4pKFteI1xcLlxcW1xcXV0rKSl8KFxcWy4rP1xcXSkvZywgYXR0clBhcnNlciA9IC9cXFsoLis/KSg/Oj0oXCJ8J3wpKC4qPylcXDIpP1xcXS87XHJcblx0dmFyIHZvaWRFbGVtZW50cyA9IC9eKEFSRUF8QkFTRXxCUnxDT0x8Q09NTUFORHxFTUJFRHxIUnxJTUd8SU5QVVR8S0VZR0VOfExJTkt8TUVUQXxQQVJBTXxTT1VSQ0V8VFJBQ0t8V0JSKSQvO1xyXG5cdHZhciBub29wID0gZnVuY3Rpb24oKSB7fVxyXG5cclxuXHQvLyBjYWNoaW5nIGNvbW1vbmx5IHVzZWQgdmFyaWFibGVzXHJcblx0dmFyICRkb2N1bWVudCwgJGxvY2F0aW9uLCAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lLCAkY2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcblxyXG5cdC8vIHNlbGYgaW52b2tpbmcgZnVuY3Rpb24gbmVlZGVkIGJlY2F1c2Ugb2YgdGhlIHdheSBtb2NrcyB3b3JrXHJcblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZSh3aW5kb3cpe1xyXG5cdFx0JGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cdFx0JGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xyXG5cdFx0JGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5jbGVhclRpbWVvdXQ7XHJcblx0XHQkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuc2V0VGltZW91dDtcclxuXHR9XHJcblxyXG5cdGluaXRpYWxpemUod2luZG93KTtcclxuXHJcblxyXG5cdC8qKlxyXG5cdCAqIEB0eXBlZGVmIHtTdHJpbmd9IFRhZ1xyXG5cdCAqIEEgc3RyaW5nIHRoYXQgbG9va3MgbGlrZSAtPiBkaXYuY2xhc3NuYW1lI2lkW3BhcmFtPW9uZV1bcGFyYW0yPXR3b11cclxuXHQgKiBXaGljaCBkZXNjcmliZXMgYSBET00gbm9kZVxyXG5cdCAqL1xyXG5cclxuXHQvKipcclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7VGFnfSBUaGUgRE9NIG5vZGUgdGFnXHJcblx0ICogQHBhcmFtIHtPYmplY3Q9W119IG9wdGlvbmFsIGtleS12YWx1ZSBwYWlycyB0byBiZSBtYXBwZWQgdG8gRE9NIGF0dHJzXHJcblx0ICogQHBhcmFtIHsuLi5tTm9kZT1bXX0gWmVybyBvciBtb3JlIE1pdGhyaWwgY2hpbGQgbm9kZXMuIENhbiBiZSBhbiBhcnJheSwgb3Igc3BsYXQgKG9wdGlvbmFsKVxyXG5cdCAqXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gbSgpIHtcclxuXHRcdHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdFx0dmFyIGhhc0F0dHJzID0gYXJnc1sxXSAhPSBudWxsICYmIHR5cGUuY2FsbChhcmdzWzFdKSA9PT0gT0JKRUNUICYmICEoXCJ0YWdcIiBpbiBhcmdzWzFdIHx8IFwidmlld1wiIGluIGFyZ3NbMV0pICYmICEoXCJzdWJ0cmVlXCIgaW4gYXJnc1sxXSk7XHJcblx0XHR2YXIgYXR0cnMgPSBoYXNBdHRycyA/IGFyZ3NbMV0gOiB7fTtcclxuXHRcdHZhciBjbGFzc0F0dHJOYW1lID0gXCJjbGFzc1wiIGluIGF0dHJzID8gXCJjbGFzc1wiIDogXCJjbGFzc05hbWVcIjtcclxuXHRcdHZhciBjZWxsID0ge3RhZzogXCJkaXZcIiwgYXR0cnM6IHt9fTtcclxuXHRcdHZhciBtYXRjaCwgY2xhc3NlcyA9IFtdO1xyXG5cdFx0aWYgKHR5cGUuY2FsbChhcmdzWzBdKSAhPSBTVFJJTkcpIHRocm93IG5ldyBFcnJvcihcInNlbGVjdG9yIGluIG0oc2VsZWN0b3IsIGF0dHJzLCBjaGlsZHJlbikgc2hvdWxkIGJlIGEgc3RyaW5nXCIpXHJcblx0XHR3aGlsZSAobWF0Y2ggPSBwYXJzZXIuZXhlYyhhcmdzWzBdKSkge1xyXG5cdFx0XHRpZiAobWF0Y2hbMV0gPT09IFwiXCIgJiYgbWF0Y2hbMl0pIGNlbGwudGFnID0gbWF0Y2hbMl07XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzFdID09PSBcIiNcIikgY2VsbC5hdHRycy5pZCA9IG1hdGNoWzJdO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCIuXCIpIGNsYXNzZXMucHVzaChtYXRjaFsyXSk7XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzNdWzBdID09PSBcIltcIikge1xyXG5cdFx0XHRcdHZhciBwYWlyID0gYXR0clBhcnNlci5leGVjKG1hdGNoWzNdKTtcclxuXHRcdFx0XHRjZWxsLmF0dHJzW3BhaXJbMV1dID0gcGFpclszXSB8fCAocGFpclsyXSA/IFwiXCIgOnRydWUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY2hpbGRyZW4gPSBoYXNBdHRycyA/IGFyZ3Muc2xpY2UoMikgOiBhcmdzLnNsaWNlKDEpO1xyXG5cdFx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiB0eXBlLmNhbGwoY2hpbGRyZW5bMF0pID09PSBBUlJBWSkge1xyXG5cdFx0XHRjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5bMF1cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5cclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gYXR0cnMpIHtcclxuXHRcdFx0aWYgKGF0dHJzLmhhc093blByb3BlcnR5KGF0dHJOYW1lKSkge1xyXG5cdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gY2xhc3NBdHRyTmFtZSAmJiBhdHRyc1thdHRyTmFtZV0gIT0gbnVsbCAmJiBhdHRyc1thdHRyTmFtZV0gIT09IFwiXCIpIHtcclxuXHRcdFx0XHRcdGNsYXNzZXMucHVzaChhdHRyc1thdHRyTmFtZV0pXHJcblx0XHRcdFx0XHRjZWxsLmF0dHJzW2F0dHJOYW1lXSA9IFwiXCIgLy9jcmVhdGUga2V5IGluIGNvcnJlY3QgaXRlcmF0aW9uIG9yZGVyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgY2VsbC5hdHRyc1thdHRyTmFtZV0gPSBhdHRyc1thdHRyTmFtZV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNsYXNzZXMubGVuZ3RoID4gMCkgY2VsbC5hdHRyc1tjbGFzc0F0dHJOYW1lXSA9IGNsYXNzZXMuam9pbihcIiBcIik7XHJcblx0XHRcclxuXHRcdHJldHVybiBjZWxsXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJ1aWxkKHBhcmVudEVsZW1lbnQsIHBhcmVudFRhZywgcGFyZW50Q2FjaGUsIHBhcmVudEluZGV4LCBkYXRhLCBjYWNoZWQsIHNob3VsZFJlYXR0YWNoLCBpbmRleCwgZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncykge1xyXG5cdFx0Ly9gYnVpbGRgIGlzIGEgcmVjdXJzaXZlIGZ1bmN0aW9uIHRoYXQgbWFuYWdlcyBjcmVhdGlvbi9kaWZmaW5nL3JlbW92YWwgb2YgRE9NIGVsZW1lbnRzIGJhc2VkIG9uIGNvbXBhcmlzb24gYmV0d2VlbiBgZGF0YWAgYW5kIGBjYWNoZWRgXHJcblx0XHQvL3RoZSBkaWZmIGFsZ29yaXRobSBjYW4gYmUgc3VtbWFyaXplZCBhcyB0aGlzOlxyXG5cdFx0Ly8xIC0gY29tcGFyZSBgZGF0YWAgYW5kIGBjYWNoZWRgXHJcblx0XHQvLzIgLSBpZiB0aGV5IGFyZSBkaWZmZXJlbnQsIGNvcHkgYGRhdGFgIHRvIGBjYWNoZWRgIGFuZCB1cGRhdGUgdGhlIERPTSBiYXNlZCBvbiB3aGF0IHRoZSBkaWZmZXJlbmNlIGlzXHJcblx0XHQvLzMgLSByZWN1cnNpdmVseSBhcHBseSB0aGlzIGFsZ29yaXRobSBmb3IgZXZlcnkgYXJyYXkgYW5kIGZvciB0aGUgY2hpbGRyZW4gb2YgZXZlcnkgdmlydHVhbCBlbGVtZW50XHJcblxyXG5cdFx0Ly90aGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgaXMgZXNzZW50aWFsbHkgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIHJlZHJhdydzIGBkYXRhYCBkYXRhIHN0cnVjdHVyZSwgd2l0aCBhIGZldyBhZGRpdGlvbnM6XHJcblx0XHQvLy0gYGNhY2hlZGAgYWx3YXlzIGhhcyBhIHByb3BlcnR5IGNhbGxlZCBgbm9kZXNgLCB3aGljaCBpcyBhIGxpc3Qgb2YgRE9NIGVsZW1lbnRzIHRoYXQgY29ycmVzcG9uZCB0byB0aGUgZGF0YSByZXByZXNlbnRlZCBieSB0aGUgcmVzcGVjdGl2ZSB2aXJ0dWFsIGVsZW1lbnRcclxuXHRcdC8vLSBpbiBvcmRlciB0byBzdXBwb3J0IGF0dGFjaGluZyBgbm9kZXNgIGFzIGEgcHJvcGVydHkgb2YgYGNhY2hlZGAsIGBjYWNoZWRgIGlzICphbHdheXMqIGEgbm9uLXByaW1pdGl2ZSBvYmplY3QsIGkuZS4gaWYgdGhlIGRhdGEgd2FzIGEgc3RyaW5nLCB0aGVuIGNhY2hlZCBpcyBhIFN0cmluZyBpbnN0YW5jZS4gSWYgZGF0YSB3YXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLCBjYWNoZWQgaXMgYG5ldyBTdHJpbmcoXCJcIilgXHJcblx0XHQvLy0gYGNhY2hlZCBhbHNvIGhhcyBhIGBjb25maWdDb250ZXh0YCBwcm9wZXJ0eSwgd2hpY2ggaXMgdGhlIHN0YXRlIHN0b3JhZ2Ugb2JqZWN0IGV4cG9zZWQgYnkgY29uZmlnKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpXHJcblx0XHQvLy0gd2hlbiBgY2FjaGVkYCBpcyBhbiBPYmplY3QsIGl0IHJlcHJlc2VudHMgYSB2aXJ0dWFsIGVsZW1lbnQ7IHdoZW4gaXQncyBhbiBBcnJheSwgaXQgcmVwcmVzZW50cyBhIGxpc3Qgb2YgZWxlbWVudHM7IHdoZW4gaXQncyBhIFN0cmluZywgTnVtYmVyIG9yIEJvb2xlYW4sIGl0IHJlcHJlc2VudHMgYSB0ZXh0IG5vZGVcclxuXHJcblx0XHQvL2BwYXJlbnRFbGVtZW50YCBpcyBhIERPTSBlbGVtZW50IHVzZWQgZm9yIFczQyBET00gQVBJIGNhbGxzXHJcblx0XHQvL2BwYXJlbnRUYWdgIGlzIG9ubHkgdXNlZCBmb3IgaGFuZGxpbmcgYSBjb3JuZXIgY2FzZSBmb3IgdGV4dGFyZWEgdmFsdWVzXHJcblx0XHQvL2BwYXJlbnRDYWNoZWAgaXMgdXNlZCB0byByZW1vdmUgbm9kZXMgaW4gc29tZSBtdWx0aS1ub2RlIGNhc2VzXHJcblx0XHQvL2BwYXJlbnRJbmRleGAgYW5kIGBpbmRleGAgYXJlIHVzZWQgdG8gZmlndXJlIG91dCB0aGUgb2Zmc2V0IG9mIG5vZGVzLiBUaGV5J3JlIGFydGlmYWN0cyBmcm9tIGJlZm9yZSBhcnJheXMgc3RhcnRlZCBiZWluZyBmbGF0dGVuZWQgYW5kIGFyZSBsaWtlbHkgcmVmYWN0b3JhYmxlXHJcblx0XHQvL2BkYXRhYCBhbmQgYGNhY2hlZGAgYXJlLCByZXNwZWN0aXZlbHksIHRoZSBuZXcgYW5kIG9sZCBub2RlcyBiZWluZyBkaWZmZWRcclxuXHRcdC8vYHNob3VsZFJlYXR0YWNoYCBpcyBhIGZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIGEgcGFyZW50IG5vZGUgd2FzIHJlY3JlYXRlZCAoaWYgc28sIGFuZCBpZiB0aGlzIG5vZGUgaXMgcmV1c2VkLCB0aGVuIHRoaXMgbm9kZSBtdXN0IHJlYXR0YWNoIGl0c2VsZiB0byB0aGUgbmV3IHBhcmVudClcclxuXHRcdC8vYGVkaXRhYmxlYCBpcyBhIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhbiBhbmNlc3RvciBpcyBjb250ZW50ZWRpdGFibGVcclxuXHRcdC8vYG5hbWVzcGFjZWAgaW5kaWNhdGVzIHRoZSBjbG9zZXN0IEhUTUwgbmFtZXNwYWNlIGFzIGl0IGNhc2NhZGVzIGRvd24gZnJvbSBhbiBhbmNlc3RvclxyXG5cdFx0Ly9gY29uZmlnc2AgaXMgYSBsaXN0IG9mIGNvbmZpZyBmdW5jdGlvbnMgdG8gcnVuIGFmdGVyIHRoZSB0b3Btb3N0IGBidWlsZGAgY2FsbCBmaW5pc2hlcyBydW5uaW5nXHJcblxyXG5cdFx0Ly90aGVyZSdzIGxvZ2ljIHRoYXQgcmVsaWVzIG9uIHRoZSBhc3N1bXB0aW9uIHRoYXQgbnVsbCBhbmQgdW5kZWZpbmVkIGRhdGEgYXJlIGVxdWl2YWxlbnQgdG8gZW1wdHkgc3RyaW5nc1xyXG5cdFx0Ly8tIHRoaXMgcHJldmVudHMgbGlmZWN5Y2xlIHN1cnByaXNlcyBmcm9tIHByb2NlZHVyYWwgaGVscGVycyB0aGF0IG1peCBpbXBsaWNpdCBhbmQgZXhwbGljaXQgcmV0dXJuIHN0YXRlbWVudHMgKGUuZy4gZnVuY3Rpb24gZm9vKCkge2lmIChjb25kKSByZXR1cm4gbShcImRpdlwiKX1cclxuXHRcdC8vLSBpdCBzaW1wbGlmaWVzIGRpZmZpbmcgY29kZVxyXG5cdFx0Ly9kYXRhLnRvU3RyaW5nKCkgbWlnaHQgdGhyb3cgb3IgcmV0dXJuIG51bGwgaWYgZGF0YSBpcyB0aGUgcmV0dXJuIHZhbHVlIG9mIENvbnNvbGUubG9nIGluIEZpcmVmb3ggKGJlaGF2aW9yIGRlcGVuZHMgb24gdmVyc2lvbilcclxuXHRcdHRyeSB7aWYgKGRhdGEgPT0gbnVsbCB8fCBkYXRhLnRvU3RyaW5nKCkgPT0gbnVsbCkgZGF0YSA9IFwiXCI7fSBjYXRjaCAoZSkge2RhdGEgPSBcIlwifVxyXG5cdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGNhY2hlZDtcclxuXHRcdHZhciBjYWNoZWRUeXBlID0gdHlwZS5jYWxsKGNhY2hlZCksIGRhdGFUeXBlID0gdHlwZS5jYWxsKGRhdGEpO1xyXG5cdFx0aWYgKGNhY2hlZCA9PSBudWxsIHx8IGNhY2hlZFR5cGUgIT09IGRhdGFUeXBlKSB7XHJcblx0XHRcdGlmIChjYWNoZWQgIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmIChwYXJlbnRDYWNoZSAmJiBwYXJlbnRDYWNoZS5ub2Rlcykge1xyXG5cdFx0XHRcdFx0dmFyIG9mZnNldCA9IGluZGV4IC0gcGFyZW50SW5kZXg7XHJcblx0XHRcdFx0XHR2YXIgZW5kID0gb2Zmc2V0ICsgKGRhdGFUeXBlID09PSBBUlJBWSA/IGRhdGEgOiBjYWNoZWQubm9kZXMpLmxlbmd0aDtcclxuXHRcdFx0XHRcdGNsZWFyKHBhcmVudENhY2hlLm5vZGVzLnNsaWNlKG9mZnNldCwgZW5kKSwgcGFyZW50Q2FjaGUuc2xpY2Uob2Zmc2V0LCBlbmQpKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGlmIChjYWNoZWQubm9kZXMpIGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhY2hlZCA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yO1xyXG5cdFx0XHRpZiAoY2FjaGVkLnRhZykgY2FjaGVkID0ge307IC8vaWYgY29uc3RydWN0b3IgY3JlYXRlcyBhIHZpcnR1YWwgZG9tIGVsZW1lbnQsIHVzZSBhIGJsYW5rIG9iamVjdCBhcyB0aGUgYmFzZSBjYWNoZWQgbm9kZSBpbnN0ZWFkIG9mIGNvcHlpbmcgdGhlIHZpcnR1YWwgZWwgKCMyNzcpXHJcblx0XHRcdGNhY2hlZC5ub2RlcyA9IFtdXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGFUeXBlID09PSBBUlJBWSkge1xyXG5cdFx0XHQvL3JlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRpZiAodHlwZS5jYWxsKGRhdGFbaV0pID09PSBBUlJBWSkge1xyXG5cdFx0XHRcdFx0ZGF0YSA9IGRhdGEuY29uY2F0LmFwcGx5KFtdLCBkYXRhKTtcclxuXHRcdFx0XHRcdGktLSAvL2NoZWNrIGN1cnJlbnQgaW5kZXggYWdhaW4gYW5kIGZsYXR0ZW4gdW50aWwgdGhlcmUgYXJlIG5vIG1vcmUgbmVzdGVkIGFycmF5cyBhdCB0aGF0IGluZGV4XHJcblx0XHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0dmFyIG5vZGVzID0gW10sIGludGFjdCA9IGNhY2hlZC5sZW5ndGggPT09IGRhdGEubGVuZ3RoLCBzdWJBcnJheUNvdW50ID0gMDtcclxuXHJcblx0XHRcdC8va2V5cyBhbGdvcml0aG06IHNvcnQgZWxlbWVudHMgd2l0aG91dCByZWNyZWF0aW5nIHRoZW0gaWYga2V5cyBhcmUgcHJlc2VudFxyXG5cdFx0XHQvLzEpIGNyZWF0ZSBhIG1hcCBvZiBhbGwgZXhpc3Rpbmcga2V5cywgYW5kIG1hcmsgYWxsIGZvciBkZWxldGlvblxyXG5cdFx0XHQvLzIpIGFkZCBuZXcga2V5cyB0byBtYXAgYW5kIG1hcmsgdGhlbSBmb3IgYWRkaXRpb25cclxuXHRcdFx0Ly8zKSBpZiBrZXkgZXhpc3RzIGluIG5ldyBsaXN0LCBjaGFuZ2UgYWN0aW9uIGZyb20gZGVsZXRpb24gdG8gYSBtb3ZlXHJcblx0XHRcdC8vNCkgZm9yIGVhY2gga2V5LCBoYW5kbGUgaXRzIGNvcnJlc3BvbmRpbmcgYWN0aW9uIGFzIG1hcmtlZCBpbiBwcmV2aW91cyBzdGVwc1xyXG5cdFx0XHR2YXIgREVMRVRJT04gPSAxLCBJTlNFUlRJT04gPSAyICwgTU9WRSA9IDM7XHJcblx0XHRcdHZhciBleGlzdGluZyA9IHt9LCBzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSBmYWxzZTtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjYWNoZWQubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkW2ldICYmIGNhY2hlZFtpXS5hdHRycyAmJiBjYWNoZWRbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdHNob3VsZE1haW50YWluSWRlbnRpdGllcyA9IHRydWU7XHJcblx0XHRcdFx0XHRleGlzdGluZ1tjYWNoZWRbaV0uYXR0cnMua2V5XSA9IHthY3Rpb246IERFTEVUSU9OLCBpbmRleDogaX1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHZhciBndWlkID0gMFxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMgJiYgZGF0YVtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaiA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRhdGFbal0gJiYgZGF0YVtqXS5hdHRycyAmJiBkYXRhW2pdLmF0dHJzLmtleSA9PSBudWxsKSBkYXRhW2pdLmF0dHJzLmtleSA9IFwiX19taXRocmlsX19cIiArIGd1aWQrK1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGlmIChzaG91bGRNYWludGFpbklkZW50aXRpZXMpIHtcclxuXHRcdFx0XHR2YXIga2V5c0RpZmZlciA9IGZhbHNlXHJcblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoICE9IGNhY2hlZC5sZW5ndGgpIGtleXNEaWZmZXIgPSB0cnVlXHJcblx0XHRcdFx0ZWxzZSBmb3IgKHZhciBpID0gMCwgY2FjaGVkQ2VsbCwgZGF0YUNlbGw7IGNhY2hlZENlbGwgPSBjYWNoZWRbaV0sIGRhdGFDZWxsID0gZGF0YVtpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAoY2FjaGVkQ2VsbC5hdHRycyAmJiBkYXRhQ2VsbC5hdHRycyAmJiBjYWNoZWRDZWxsLmF0dHJzLmtleSAhPSBkYXRhQ2VsbC5hdHRycy5rZXkpIHtcclxuXHRcdFx0XHRcdFx0a2V5c0RpZmZlciA9IHRydWVcclxuXHRcdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGtleXNEaWZmZXIpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoZGF0YVtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGtleSA9IGRhdGFbaV0uYXR0cnMua2V5O1xyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFleGlzdGluZ1trZXldKSBleGlzdGluZ1trZXldID0ge2FjdGlvbjogSU5TRVJUSU9OLCBpbmRleDogaX07XHJcblx0XHRcdFx0XHRcdFx0XHRlbHNlIGV4aXN0aW5nW2tleV0gPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbjogTU9WRSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0aW5kZXg6IGksXHJcblx0XHRcdFx0XHRcdFx0XHRcdGZyb206IGV4aXN0aW5nW2tleV0uaW5kZXgsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQ6IGNhY2hlZC5ub2Rlc1tleGlzdGluZ1trZXldLmluZGV4XSB8fCAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dmFyIGFjdGlvbnMgPSBbXVxyXG5cdFx0XHRcdFx0Zm9yICh2YXIgcHJvcCBpbiBleGlzdGluZykgYWN0aW9ucy5wdXNoKGV4aXN0aW5nW3Byb3BdKVxyXG5cdFx0XHRcdFx0dmFyIGNoYW5nZXMgPSBhY3Rpb25zLnNvcnQoc29ydENoYW5nZXMpO1xyXG5cdFx0XHRcdFx0dmFyIG5ld0NhY2hlZCA9IG5ldyBBcnJheShjYWNoZWQubGVuZ3RoKVxyXG5cdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzID0gY2FjaGVkLm5vZGVzLnNsaWNlKClcclxuXHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY2hhbmdlOyBjaGFuZ2UgPSBjaGFuZ2VzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IERFTEVUSU9OKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2xlYXIoY2FjaGVkW2NoYW5nZS5pbmRleF0ubm9kZXMsIGNhY2hlZFtjaGFuZ2UuaW5kZXhdKTtcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQuc3BsaWNlKGNoYW5nZS5pbmRleCwgMSlcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gSU5TRVJUSU9OKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGR1bW15ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcblx0XHRcdFx0XHRcdFx0ZHVtbXkua2V5ID0gZGF0YVtjaGFuZ2UuaW5kZXhdLmF0dHJzLmtleTtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShkdW1teSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gfHwgbnVsbCk7XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShjaGFuZ2UuaW5kZXgsIDAsIHthdHRyczoge2tleTogZGF0YVtjaGFuZ2UuaW5kZXhdLmF0dHJzLmtleX0sIG5vZGVzOiBbZHVtbXldfSlcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbY2hhbmdlLmluZGV4XSA9IGR1bW15XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBNT1ZFKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdICE9PSBjaGFuZ2UuZWxlbWVudCAmJiBjaGFuZ2UuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoY2hhbmdlLmVsZW1lbnQsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZFtjaGFuZ2UuaW5kZXhdID0gY2FjaGVkW2NoYW5nZS5mcm9tXVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5ub2Rlc1tjaGFuZ2UuaW5kZXhdID0gY2hhbmdlLmVsZW1lbnRcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Y2FjaGVkID0gbmV3Q2FjaGVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvL2VuZCBrZXkgYWxnb3JpdGhtXHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgY2FjaGVDb3VudCA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHQvL2RpZmYgZWFjaCBpdGVtIGluIHRoZSBhcnJheVxyXG5cdFx0XHRcdHZhciBpdGVtID0gYnVpbGQocGFyZW50RWxlbWVudCwgcGFyZW50VGFnLCBjYWNoZWQsIGluZGV4LCBkYXRhW2ldLCBjYWNoZWRbY2FjaGVDb3VudF0sIHNob3VsZFJlYXR0YWNoLCBpbmRleCArIHN1YkFycmF5Q291bnQgfHwgc3ViQXJyYXlDb3VudCwgZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncyk7XHJcblx0XHRcdFx0aWYgKGl0ZW0gPT09IHVuZGVmaW5lZCkgY29udGludWU7XHJcblx0XHRcdFx0aWYgKCFpdGVtLm5vZGVzLmludGFjdCkgaW50YWN0ID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKGl0ZW0uJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdC8vZml4IG9mZnNldCBvZiBuZXh0IGVsZW1lbnQgaWYgaXRlbSB3YXMgYSB0cnVzdGVkIHN0cmluZyB3LyBtb3JlIHRoYW4gb25lIGh0bWwgZWxlbWVudFxyXG5cdFx0XHRcdFx0Ly90aGUgZmlyc3QgY2xhdXNlIGluIHRoZSByZWdleHAgbWF0Y2hlcyBlbGVtZW50c1xyXG5cdFx0XHRcdFx0Ly90aGUgc2Vjb25kIGNsYXVzZSAoYWZ0ZXIgdGhlIHBpcGUpIG1hdGNoZXMgdGV4dCBub2Rlc1xyXG5cdFx0XHRcdFx0c3ViQXJyYXlDb3VudCArPSAoaXRlbS5tYXRjaCgvPFteXFwvXXxcXD5cXHMqW148XS9nKSB8fCBbMF0pLmxlbmd0aFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHN1YkFycmF5Q291bnQgKz0gdHlwZS5jYWxsKGl0ZW0pID09PSBBUlJBWSA/IGl0ZW0ubGVuZ3RoIDogMTtcclxuXHRcdFx0XHRjYWNoZWRbY2FjaGVDb3VudCsrXSA9IGl0ZW1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWludGFjdCkge1xyXG5cdFx0XHRcdC8vZGlmZiB0aGUgYXJyYXkgaXRzZWxmXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Ly91cGRhdGUgdGhlIGxpc3Qgb2YgRE9NIG5vZGVzIGJ5IGNvbGxlY3RpbmcgdGhlIG5vZGVzIGZyb20gZWFjaCBpdGVtXHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChjYWNoZWRbaV0gIT0gbnVsbCkgbm9kZXMucHVzaC5hcHBseShub2RlcywgY2FjaGVkW2ldLm5vZGVzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvL3JlbW92ZSBpdGVtcyBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5IGlmIHRoZSBuZXcgYXJyYXkgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQgb25lXHJcblx0XHRcdFx0Ly9pZiBlcnJvcnMgZXZlciBoYXBwZW4gaGVyZSwgdGhlIGlzc3VlIGlzIG1vc3QgbGlrZWx5IGEgYnVnIGluIHRoZSBjb25zdHJ1Y3Rpb24gb2YgdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlIHNvbWV3aGVyZSBlYXJsaWVyIGluIHRoZSBwcm9ncmFtXHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIG5vZGU7IG5vZGUgPSBjYWNoZWQubm9kZXNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKG5vZGUucGFyZW50Tm9kZSAhPSBudWxsICYmIG5vZGVzLmluZGV4T2Yobm9kZSkgPCAwKSBjbGVhcihbbm9kZV0sIFtjYWNoZWRbaV1dKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggPCBjYWNoZWQubGVuZ3RoKSBjYWNoZWQubGVuZ3RoID0gZGF0YS5sZW5ndGg7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoZGF0YSAhPSBudWxsICYmIGRhdGFUeXBlID09PSBPQkpFQ1QpIHtcclxuXHRcdFx0dmFyIHZpZXdzID0gW10sIGNvbnRyb2xsZXJzID0gW11cclxuXHRcdFx0d2hpbGUgKGRhdGEudmlldykge1xyXG5cdFx0XHRcdHZhciB2aWV3ID0gZGF0YS52aWV3LiRvcmlnaW5hbCB8fCBkYXRhLnZpZXdcclxuXHRcdFx0XHR2YXIgY29udHJvbGxlckluZGV4ID0gbS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImRpZmZcIiAmJiBjYWNoZWQudmlld3MgPyBjYWNoZWQudmlld3MuaW5kZXhPZih2aWV3KSA6IC0xXHJcblx0XHRcdFx0dmFyIGNvbnRyb2xsZXIgPSBjb250cm9sbGVySW5kZXggPiAtMSA/IGNhY2hlZC5jb250cm9sbGVyc1tjb250cm9sbGVySW5kZXhdIDogbmV3IChkYXRhLmNvbnRyb2xsZXIgfHwgbm9vcClcclxuXHRcdFx0XHR2YXIga2V5ID0gZGF0YSAmJiBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMua2V5XHJcblx0XHRcdFx0ZGF0YSA9IHBlbmRpbmdSZXF1ZXN0cyA9PSAwIHx8IChjYWNoZWQgJiYgY2FjaGVkLmNvbnRyb2xsZXJzICYmIGNhY2hlZC5jb250cm9sbGVycy5pbmRleE9mKGNvbnRyb2xsZXIpID4gLTEpID8gZGF0YS52aWV3KGNvbnRyb2xsZXIpIDoge3RhZzogXCJwbGFjZWhvbGRlclwifVxyXG5cdFx0XHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWQ7XHJcblx0XHRcdFx0aWYgKGtleSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkYXRhLmF0dHJzKSBkYXRhLmF0dHJzID0ge31cclxuXHRcdFx0XHRcdGRhdGEuYXR0cnMua2V5ID0ga2V5XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjb250cm9sbGVyLm9udW5sb2FkKSB1bmxvYWRlcnMucHVzaCh7Y29udHJvbGxlcjogY29udHJvbGxlciwgaGFuZGxlcjogY29udHJvbGxlci5vbnVubG9hZH0pXHJcblx0XHRcdFx0dmlld3MucHVzaCh2aWV3KVxyXG5cdFx0XHRcdGNvbnRyb2xsZXJzLnB1c2goY29udHJvbGxlcilcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWRhdGEudGFnICYmIGNvbnRyb2xsZXJzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiQ29tcG9uZW50IHRlbXBsYXRlIG11c3QgcmV0dXJuIGEgdmlydHVhbCBlbGVtZW50LCBub3QgYW4gYXJyYXksIHN0cmluZywgZXRjLlwiKVxyXG5cdFx0XHRpZiAoIWRhdGEuYXR0cnMpIGRhdGEuYXR0cnMgPSB7fTtcclxuXHRcdFx0aWYgKCFjYWNoZWQuYXR0cnMpIGNhY2hlZC5hdHRycyA9IHt9O1xyXG5cclxuXHRcdFx0dmFyIGRhdGFBdHRyS2V5cyA9IE9iamVjdC5rZXlzKGRhdGEuYXR0cnMpXHJcblx0XHRcdHZhciBoYXNLZXlzID0gZGF0YUF0dHJLZXlzLmxlbmd0aCA+IChcImtleVwiIGluIGRhdGEuYXR0cnMgPyAxIDogMClcclxuXHRcdFx0Ly9pZiBhbiBlbGVtZW50IGlzIGRpZmZlcmVudCBlbm91Z2ggZnJvbSB0aGUgb25lIGluIGNhY2hlLCByZWNyZWF0ZSBpdFxyXG5cdFx0XHRpZiAoZGF0YS50YWcgIT0gY2FjaGVkLnRhZyB8fCBkYXRhQXR0cktleXMuc29ydCgpLmpvaW4oKSAhPSBPYmplY3Qua2V5cyhjYWNoZWQuYXR0cnMpLnNvcnQoKS5qb2luKCkgfHwgZGF0YS5hdHRycy5pZCAhPSBjYWNoZWQuYXR0cnMuaWQgfHwgZGF0YS5hdHRycy5rZXkgIT0gY2FjaGVkLmF0dHJzLmtleSB8fCAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImFsbFwiICYmICghY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluICE9PSB0cnVlKSkgfHwgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJkaWZmXCIgJiYgY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluID09PSBmYWxzZSkpIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCkgY2xlYXIoY2FjaGVkLm5vZGVzKTtcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgdHlwZW9mIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID09PSBGVU5DVElPTikgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQoKVxyXG5cdFx0XHRcdGlmIChjYWNoZWQuY29udHJvbGxlcnMpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY2FjaGVkLmNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjb250cm9sbGVyLm9udW5sb2FkID09PSBGVU5DVElPTikgY29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZS5jYWxsKGRhdGEudGFnKSAhPSBTVFJJTkcpIHJldHVybjtcclxuXHJcblx0XHRcdHZhciBub2RlLCBpc05ldyA9IGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDA7XHJcblx0XHRcdGlmIChkYXRhLmF0dHJzLnhtbG5zKSBuYW1lc3BhY2UgPSBkYXRhLmF0dHJzLnhtbG5zO1xyXG5cdFx0XHRlbHNlIGlmIChkYXRhLnRhZyA9PT0gXCJzdmdcIikgbmFtZXNwYWNlID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiO1xyXG5cdFx0XHRlbHNlIGlmIChkYXRhLnRhZyA9PT0gXCJtYXRoXCIpIG5hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTFwiO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKGlzTmV3KSB7XHJcblx0XHRcdFx0aWYgKGRhdGEuYXR0cnMuaXMpIG5vZGUgPSBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCA/ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKSA6ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBkYXRhLnRhZywgZGF0YS5hdHRycy5pcyk7XHJcblx0XHRcdFx0ZWxzZSBub2RlID0gbmFtZXNwYWNlID09PSB1bmRlZmluZWQgPyAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZykgOiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcpO1xyXG5cdFx0XHRcdGNhY2hlZCA9IHtcclxuXHRcdFx0XHRcdHRhZzogZGF0YS50YWcsXHJcblx0XHRcdFx0XHQvL3NldCBhdHRyaWJ1dGVzIGZpcnN0LCB0aGVuIGNyZWF0ZSBjaGlsZHJlblxyXG5cdFx0XHRcdFx0YXR0cnM6IGhhc0tleXMgPyBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCB7fSwgbmFtZXNwYWNlKSA6IGRhdGEuYXR0cnMsXHJcblx0XHRcdFx0XHRjaGlsZHJlbjogZGF0YS5jaGlsZHJlbiAhPSBudWxsICYmIGRhdGEuY2hpbGRyZW4ubGVuZ3RoID4gMCA/XHJcblx0XHRcdFx0XHRcdGJ1aWxkKG5vZGUsIGRhdGEudGFnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZGF0YS5jaGlsZHJlbiwgY2FjaGVkLmNoaWxkcmVuLCB0cnVlLCAwLCBkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKSA6XHJcblx0XHRcdFx0XHRcdGRhdGEuY2hpbGRyZW4sXHJcblx0XHRcdFx0XHRub2RlczogW25vZGVdXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRjYWNoZWQudmlld3MgPSB2aWV3c1xyXG5cdFx0XHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCAmJiBjb250cm9sbGVyLm9udW5sb2FkLiRvbGQpIGNvbnRyb2xsZXIub251bmxvYWQgPSBjb250cm9sbGVyLm9udW5sb2FkLiRvbGRcclxuXHRcdFx0XHRcdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyAmJiBjb250cm9sbGVyLm9udW5sb2FkKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIG9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZFxyXG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQgPSBub29wXHJcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZC4kb2xkID0gb251bmxvYWRcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNoaWxkcmVuICYmICFjYWNoZWQuY2hpbGRyZW4ubm9kZXMpIGNhY2hlZC5jaGlsZHJlbi5ub2RlcyA9IFtdO1xyXG5cdFx0XHRcdC8vZWRnZSBjYXNlOiBzZXR0aW5nIHZhbHVlIG9uIDxzZWxlY3Q+IGRvZXNuJ3Qgd29yayBiZWZvcmUgY2hpbGRyZW4gZXhpc3QsIHNvIHNldCBpdCBhZ2FpbiBhZnRlciBjaGlsZHJlbiBoYXZlIGJlZW4gY3JlYXRlZFxyXG5cdFx0XHRcdGlmIChkYXRhLnRhZyA9PT0gXCJzZWxlY3RcIiAmJiBcInZhbHVlXCIgaW4gZGF0YS5hdHRycykgc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywge3ZhbHVlOiBkYXRhLmF0dHJzLnZhbHVlfSwge30sIG5hbWVzcGFjZSk7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdG5vZGUgPSBjYWNoZWQubm9kZXNbMF07XHJcblx0XHRcdFx0aWYgKGhhc0tleXMpIHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMsIGNhY2hlZC5hdHRycywgbmFtZXNwYWNlKTtcclxuXHRcdFx0XHRjYWNoZWQuY2hpbGRyZW4gPSBidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgZmFsc2UsIDAsIGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2Rlcy5pbnRhY3QgPSB0cnVlO1xyXG5cdFx0XHRcdGlmIChjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdFx0XHRjYWNoZWQuY29udHJvbGxlcnMgPSBjb250cm9sbGVyc1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoc2hvdWxkUmVhdHRhY2ggPT09IHRydWUgJiYgbm9kZSAhPSBudWxsKSBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2RlLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdH1cclxuXHRcdFx0Ly9zY2hlZHVsZSBjb25maWdzIHRvIGJlIGNhbGxlZC4gVGhleSBhcmUgY2FsbGVkIGFmdGVyIGBidWlsZGAgZmluaXNoZXMgcnVubmluZ1xyXG5cdFx0XHRpZiAodHlwZW9mIGRhdGEuYXR0cnNbXCJjb25maWdcIl0gPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0dmFyIGNvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0IHx8IHt9O1xyXG5cclxuXHRcdFx0XHQvLyBiaW5kXHJcblx0XHRcdFx0dmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZGF0YSwgYXJncykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZGF0YS5hdHRyc1tcImNvbmZpZ1wiXS5hcHBseShkYXRhLCBhcmdzKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0Y29uZmlncy5wdXNoKGNhbGxiYWNrKGRhdGEsIFtub2RlLCAhaXNOZXcsIGNvbnRleHQsIGNhY2hlZF0pKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0eXBlb2YgZGF0YSAhPSBGVU5DVElPTikge1xyXG5cdFx0XHQvL2hhbmRsZSB0ZXh0IG5vZGVzXHJcblx0XHRcdHZhciBub2RlcztcclxuXHRcdFx0aWYgKGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDApIHtcclxuXHRcdFx0XHRpZiAoZGF0YS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRcdFx0bm9kZXMgPSBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV07XHJcblx0XHRcdFx0XHRpZiAoIXBhcmVudEVsZW1lbnQubm9kZU5hbWUubWF0Y2godm9pZEVsZW1lbnRzKSkgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZXNbMF0sIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gXCJzdHJpbmcgbnVtYmVyIGJvb2xlYW5cIi5pbmRleE9mKHR5cGVvZiBkYXRhKSA+IC0xID8gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSkgOiBkYXRhO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLnZhbHVlT2YoKSAhPT0gZGF0YS52YWx1ZU9mKCkgfHwgc2hvdWxkUmVhdHRhY2ggPT09IHRydWUpIHtcclxuXHRcdFx0XHRub2RlcyA9IGNhY2hlZC5ub2RlcztcclxuXHRcdFx0XHRpZiAoIWVkaXRhYmxlIHx8IGVkaXRhYmxlICE9PSAkZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdFx0Y2xlYXIobm9kZXMsIGNhY2hlZCk7XHJcblx0XHRcdFx0XHRcdG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHQvL2Nvcm5lciBjYXNlOiByZXBsYWNpbmcgdGhlIG5vZGVWYWx1ZSBvZiBhIHRleHQgbm9kZSB0aGF0IGlzIGEgY2hpbGQgb2YgYSB0ZXh0YXJlYS9jb250ZW50ZWRpdGFibGUgZG9lc24ndCB3b3JrXHJcblx0XHRcdFx0XHRcdC8vd2UgbmVlZCB0byB1cGRhdGUgdGhlIHZhbHVlIHByb3BlcnR5IG9mIHRoZSBwYXJlbnQgdGV4dGFyZWEgb3IgdGhlIGlubmVySFRNTCBvZiB0aGUgY29udGVudGVkaXRhYmxlIGVsZW1lbnQgaW5zdGVhZFxyXG5cdFx0XHRcdFx0XHRpZiAocGFyZW50VGFnID09PSBcInRleHRhcmVhXCIpIHBhcmVudEVsZW1lbnQudmFsdWUgPSBkYXRhO1xyXG5cdFx0XHRcdFx0XHRlbHNlIGlmIChlZGl0YWJsZSkgZWRpdGFibGUuaW5uZXJIVE1MID0gZGF0YTtcclxuXHRcdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKG5vZGVzWzBdLm5vZGVUeXBlID09PSAxIHx8IG5vZGVzLmxlbmd0aCA+IDEpIHsgLy93YXMgYSB0cnVzdGVkIHN0cmluZ1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpO1xyXG5cdFx0XHRcdFx0XHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2Rlc1swXSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKTtcclxuXHRcdFx0XHRcdFx0XHRub2Rlc1swXS5ub2RlVmFsdWUgPSBkYXRhXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSk7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGNhY2hlZC5ub2Rlcy5pbnRhY3QgPSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHRmdW5jdGlvbiBzb3J0Q2hhbmdlcyhhLCBiKSB7cmV0dXJuIGEuYWN0aW9uIC0gYi5hY3Rpb24gfHwgYS5pbmRleCAtIGIuaW5kZXh9XHJcblx0ZnVuY3Rpb24gc2V0QXR0cmlidXRlcyhub2RlLCB0YWcsIGRhdGFBdHRycywgY2FjaGVkQXR0cnMsIG5hbWVzcGFjZSkge1xyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gZGF0YUF0dHJzKSB7XHJcblx0XHRcdHZhciBkYXRhQXR0ciA9IGRhdGFBdHRyc1thdHRyTmFtZV07XHJcblx0XHRcdHZhciBjYWNoZWRBdHRyID0gY2FjaGVkQXR0cnNbYXR0ck5hbWVdO1xyXG5cdFx0XHRpZiAoIShhdHRyTmFtZSBpbiBjYWNoZWRBdHRycykgfHwgKGNhY2hlZEF0dHIgIT09IGRhdGFBdHRyKSkge1xyXG5cdFx0XHRcdGNhY2hlZEF0dHJzW2F0dHJOYW1lXSA9IGRhdGFBdHRyO1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvL2Bjb25maWdgIGlzbid0IGEgcmVhbCBhdHRyaWJ1dGVzLCBzbyBpZ25vcmUgaXRcclxuXHRcdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gXCJjb25maWdcIiB8fCBhdHRyTmFtZSA9PSBcImtleVwiKSBjb250aW51ZTtcclxuXHRcdFx0XHRcdC8vaG9vayBldmVudCBoYW5kbGVycyB0byB0aGUgYXV0by1yZWRyYXdpbmcgc3lzdGVtXHJcblx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgZGF0YUF0dHIgPT09IEZVTkNUSU9OICYmIGF0dHJOYW1lLmluZGV4T2YoXCJvblwiKSA9PT0gMCkge1xyXG5cdFx0XHRcdFx0XHRub2RlW2F0dHJOYW1lXSA9IGF1dG9yZWRyYXcoZGF0YUF0dHIsIG5vZGUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBgc3R5bGU6IHsuLi59YFxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwic3R5bGVcIiAmJiBkYXRhQXR0ciAhPSBudWxsICYmIHR5cGUuY2FsbChkYXRhQXR0cikgPT09IE9CSkVDVCkge1xyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBydWxlIGluIGRhdGFBdHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNhY2hlZEF0dHIgPT0gbnVsbCB8fCBjYWNoZWRBdHRyW3J1bGVdICE9PSBkYXRhQXR0cltydWxlXSkgbm9kZS5zdHlsZVtydWxlXSA9IGRhdGFBdHRyW3J1bGVdXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcnVsZSBpbiBjYWNoZWRBdHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCEocnVsZSBpbiBkYXRhQXR0cikpIG5vZGUuc3R5bGVbcnVsZV0gPSBcIlwiXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIFNWR1xyXG5cdFx0XHRcdFx0ZWxzZSBpZiAobmFtZXNwYWNlICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBcImhyZWZcIikgbm9kZS5zZXRBdHRyaWJ1dGVOUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiwgXCJocmVmXCIsIGRhdGFBdHRyKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwiY2xhc3NOYW1lXCIpIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgZGF0YUF0dHIpO1xyXG5cdFx0XHRcdFx0XHRlbHNlIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIGNhc2VzIHRoYXQgYXJlIHByb3BlcnRpZXMgKGJ1dCBpZ25vcmUgY2FzZXMgd2hlcmUgd2Ugc2hvdWxkIHVzZSBzZXRBdHRyaWJ1dGUgaW5zdGVhZClcclxuXHRcdFx0XHRcdC8vLSBsaXN0IGFuZCBmb3JtIGFyZSB0eXBpY2FsbHkgdXNlZCBhcyBzdHJpbmdzLCBidXQgYXJlIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4ganNcclxuXHRcdFx0XHRcdC8vLSB3aGVuIHVzaW5nIENTUyBzZWxlY3RvcnMgKGUuZy4gYG0oXCJbc3R5bGU9JyddXCIpYCksIHN0eWxlIGlzIHVzZWQgYXMgYSBzdHJpbmcsIGJ1dCBpdCdzIGFuIG9iamVjdCBpbiBqc1xyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgaW4gbm9kZSAmJiAhKGF0dHJOYW1lID09PSBcImxpc3RcIiB8fCBhdHRyTmFtZSA9PT0gXCJzdHlsZVwiIHx8IGF0dHJOYW1lID09PSBcImZvcm1cIiB8fCBhdHRyTmFtZSA9PT0gXCJ0eXBlXCIgfHwgYXR0ck5hbWUgPT09IFwid2lkdGhcIiB8fCBhdHRyTmFtZSA9PT0gXCJoZWlnaHRcIikpIHtcclxuXHRcdFx0XHRcdFx0Ly8jMzQ4IGRvbid0IHNldCB0aGUgdmFsdWUgaWYgbm90IG5lZWRlZCBvdGhlcndpc2UgY3Vyc29yIHBsYWNlbWVudCBicmVha3MgaW4gQ2hyb21lXHJcblx0XHRcdFx0XHRcdGlmICh0YWcgIT09IFwiaW5wdXRcIiB8fCBub2RlW2F0dHJOYW1lXSAhPT0gZGF0YUF0dHIpIG5vZGVbYXR0ck5hbWVdID0gZGF0YUF0dHJcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Ugbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRhdGFBdHRyKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0Ly9zd2FsbG93IElFJ3MgaW52YWxpZCBhcmd1bWVudCBlcnJvcnMgdG8gbWltaWMgSFRNTCdzIGZhbGxiYWNrLXRvLWRvaW5nLW5vdGhpbmctb24taW52YWxpZC1hdHRyaWJ1dGVzIGJlaGF2aW9yXHJcblx0XHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJJbnZhbGlkIGFyZ3VtZW50XCIpIDwgMCkgdGhyb3cgZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvLyMzNDggZGF0YUF0dHIgbWF5IG5vdCBiZSBhIHN0cmluZywgc28gdXNlIGxvb3NlIGNvbXBhcmlzb24gKGRvdWJsZSBlcXVhbCkgaW5zdGVhZCBvZiBzdHJpY3QgKHRyaXBsZSBlcXVhbClcclxuXHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwidmFsdWVcIiAmJiB0YWcgPT09IFwiaW5wdXRcIiAmJiBub2RlLnZhbHVlICE9IGRhdGFBdHRyKSB7XHJcblx0XHRcdFx0bm9kZS52YWx1ZSA9IGRhdGFBdHRyXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBjYWNoZWRBdHRyc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBjbGVhcihub2RlcywgY2FjaGVkKSB7XHJcblx0XHRmb3IgKHZhciBpID0gbm9kZXMubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcclxuXHRcdFx0aWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLnBhcmVudE5vZGUpIHtcclxuXHRcdFx0XHR0cnkge25vZGVzW2ldLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZXNbaV0pfVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7fSAvL2lnbm9yZSBpZiB0aGlzIGZhaWxzIGR1ZSB0byBvcmRlciBvZiBldmVudHMgKHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIxOTI2MDgzL2ZhaWxlZC10by1leGVjdXRlLXJlbW92ZWNoaWxkLW9uLW5vZGUpXHJcblx0XHRcdFx0Y2FjaGVkID0gW10uY29uY2F0KGNhY2hlZCk7XHJcblx0XHRcdFx0aWYgKGNhY2hlZFtpXSkgdW5sb2FkKGNhY2hlZFtpXSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKG5vZGVzLmxlbmd0aCAhPSAwKSBub2Rlcy5sZW5ndGggPSAwXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHVubG9hZChjYWNoZWQpIHtcclxuXHRcdGlmIChjYWNoZWQuY29uZmlnQ29udGV4dCAmJiB0eXBlb2YgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKCk7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNhY2hlZC5jb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjb250cm9sbGVyLm9udW5sb2FkID09PSBGVU5DVElPTikgY29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jaGlsZHJlbikge1xyXG5cdFx0XHRpZiAodHlwZS5jYWxsKGNhY2hlZC5jaGlsZHJlbikgPT09IEFSUkFZKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNoaWxkOyBjaGlsZCA9IGNhY2hlZC5jaGlsZHJlbltpXTsgaSsrKSB1bmxvYWQoY2hpbGQpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLmNoaWxkcmVuLnRhZykgdW5sb2FkKGNhY2hlZC5jaGlsZHJlbilcclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSkge1xyXG5cdFx0dmFyIG5leHRTaWJsaW5nID0gcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XTtcclxuXHRcdGlmIChuZXh0U2libGluZykge1xyXG5cdFx0XHR2YXIgaXNFbGVtZW50ID0gbmV4dFNpYmxpbmcubm9kZVR5cGUgIT0gMTtcclxuXHRcdFx0dmFyIHBsYWNlaG9sZGVyID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG5cdFx0XHRpZiAoaXNFbGVtZW50KSB7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIG5leHRTaWJsaW5nIHx8IG51bGwpO1xyXG5cdFx0XHRcdHBsYWNlaG9sZGVyLmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWJlZ2luXCIsIGRhdGEpO1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXIpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBuZXh0U2libGluZy5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBwYXJlbnRFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBkYXRhKTtcclxuXHRcdHZhciBub2RlcyA9IFtdO1xyXG5cdFx0d2hpbGUgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gIT09IG5leHRTaWJsaW5nKSB7XHJcblx0XHRcdG5vZGVzLnB1c2gocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSk7XHJcblx0XHRcdGluZGV4KytcclxuXHRcdH1cclxuXHRcdHJldHVybiBub2Rlc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBhdXRvcmVkcmF3KGNhbGxiYWNrLCBvYmplY3QpIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIik7XHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0XHR0cnkge3JldHVybiBjYWxsYmFjay5jYWxsKG9iamVjdCwgZSl9XHJcblx0XHRcdGZpbmFsbHkge1xyXG5cdFx0XHRcdGVuZEZpcnN0Q29tcHV0YXRpb24oKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgaHRtbDtcclxuXHR2YXIgZG9jdW1lbnROb2RlID0ge1xyXG5cdFx0YXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0aWYgKGh0bWwgPT09IHVuZGVmaW5lZCkgaHRtbCA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtcclxuXHRcdFx0aWYgKCRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAhPT0gbm9kZSkge1xyXG5cdFx0XHRcdCRkb2N1bWVudC5yZXBsYWNlQ2hpbGQobm9kZSwgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlICRkb2N1bWVudC5hcHBlbmRDaGlsZChub2RlKTtcclxuXHRcdFx0dGhpcy5jaGlsZE5vZGVzID0gJGRvY3VtZW50LmNoaWxkTm9kZXNcclxuXHRcdH0sXHJcblx0XHRpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0dGhpcy5hcHBlbmRDaGlsZChub2RlKVxyXG5cdFx0fSxcclxuXHRcdGNoaWxkTm9kZXM6IFtdXHJcblx0fTtcclxuXHR2YXIgbm9kZUNhY2hlID0gW10sIGNlbGxDYWNoZSA9IHt9O1xyXG5cdG0ucmVuZGVyID0gZnVuY3Rpb24ocm9vdCwgY2VsbCwgZm9yY2VSZWNyZWF0aW9uKSB7XHJcblx0XHR2YXIgY29uZmlncyA9IFtdO1xyXG5cdFx0aWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIERPTSBlbGVtZW50IGJlaW5nIHBhc3NlZCB0byBtLnJvdXRlL20ubW91bnQvbS5yZW5kZXIgaXMgbm90IHVuZGVmaW5lZC5cIik7XHJcblx0XHR2YXIgaWQgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdCk7XHJcblx0XHR2YXIgaXNEb2N1bWVudFJvb3QgPSByb290ID09PSAkZG9jdW1lbnQ7XHJcblx0XHR2YXIgbm9kZSA9IGlzRG9jdW1lbnRSb290IHx8IHJvb3QgPT09ICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgPyBkb2N1bWVudE5vZGUgOiByb290O1xyXG5cdFx0aWYgKGlzRG9jdW1lbnRSb290ICYmIGNlbGwudGFnICE9IFwiaHRtbFwiKSBjZWxsID0ge3RhZzogXCJodG1sXCIsIGF0dHJzOiB7fSwgY2hpbGRyZW46IGNlbGx9O1xyXG5cdFx0aWYgKGNlbGxDYWNoZVtpZF0gPT09IHVuZGVmaW5lZCkgY2xlYXIobm9kZS5jaGlsZE5vZGVzKTtcclxuXHRcdGlmIChmb3JjZVJlY3JlYXRpb24gPT09IHRydWUpIHJlc2V0KHJvb3QpO1xyXG5cdFx0Y2VsbENhY2hlW2lkXSA9IGJ1aWxkKG5vZGUsIG51bGwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjZWxsLCBjZWxsQ2FjaGVbaWRdLCBmYWxzZSwgMCwgbnVsbCwgdW5kZWZpbmVkLCBjb25maWdzKTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb25maWdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSBjb25maWdzW2ldKClcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIGdldENlbGxDYWNoZUtleShlbGVtZW50KSB7XHJcblx0XHR2YXIgaW5kZXggPSBub2RlQ2FjaGUuaW5kZXhPZihlbGVtZW50KTtcclxuXHRcdHJldHVybiBpbmRleCA8IDAgPyBub2RlQ2FjaGUucHVzaChlbGVtZW50KSAtIDEgOiBpbmRleFxyXG5cdH1cclxuXHJcblx0bS50cnVzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHR2YWx1ZSA9IG5ldyBTdHJpbmcodmFsdWUpO1xyXG5cdFx0dmFsdWUuJHRydXN0ZWQgPSB0cnVlO1xyXG5cdFx0cmV0dXJuIHZhbHVlXHJcblx0fTtcclxuXHJcblx0ZnVuY3Rpb24gZ2V0dGVyc2V0dGVyKHN0b3JlKSB7XHJcblx0XHR2YXIgcHJvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCkgc3RvcmUgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHJldHVybiBzdG9yZVxyXG5cdFx0fTtcclxuXHJcblx0XHRwcm9wLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblxyXG5cdG0ucHJvcCA9IGZ1bmN0aW9uIChzdG9yZSkge1xyXG5cdFx0Ly9ub3RlOiB1c2luZyBub24tc3RyaWN0IGVxdWFsaXR5IGNoZWNrIGhlcmUgYmVjYXVzZSB3ZSdyZSBjaGVja2luZyBpZiBzdG9yZSBpcyBudWxsIE9SIHVuZGVmaW5lZFxyXG5cdFx0aWYgKCgoc3RvcmUgIT0gbnVsbCAmJiB0eXBlLmNhbGwoc3RvcmUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBzdG9yZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiBzdG9yZS50aGVuID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRyZXR1cm4gcHJvcGlmeShzdG9yZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZ2V0dGVyc2V0dGVyKHN0b3JlKVxyXG5cdH07XHJcblxyXG5cdHZhciByb290cyA9IFtdLCBjb21wb25lbnRzID0gW10sIGNvbnRyb2xsZXJzID0gW10sIGxhc3RSZWRyYXdJZCA9IG51bGwsIGxhc3RSZWRyYXdDYWxsVGltZSA9IDAsIGNvbXB1dGVQcmVSZWRyYXdIb29rID0gbnVsbCwgY29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbCwgcHJldmVudGVkID0gZmFsc2UsIHRvcENvbXBvbmVudCwgdW5sb2FkZXJzID0gW107XHJcblx0dmFyIEZSQU1FX0JVREdFVCA9IDE2OyAvLzYwIGZyYW1lcyBwZXIgc2Vjb25kID0gMSBjYWxsIHBlciAxNiBtc1xyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIGFyZ3MpIHtcclxuXHRcdHZhciBjb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiAoY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcCkuYXBwbHkodGhpcywgYXJncykgfHwgdGhpc1xyXG5cdFx0fVxyXG5cdFx0dmFyIHZpZXcgPSBmdW5jdGlvbihjdHJsKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgYXJncyA9IGFyZ3MuY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcclxuXHRcdFx0cmV0dXJuIGNvbXBvbmVudC52aWV3LmFwcGx5KGNvbXBvbmVudCwgYXJncyA/IFtjdHJsXS5jb25jYXQoYXJncykgOiBbY3RybF0pXHJcblx0XHR9XHJcblx0XHR2aWV3LiRvcmlnaW5hbCA9IGNvbXBvbmVudC52aWV3XHJcblx0XHR2YXIgb3V0cHV0ID0ge2NvbnRyb2xsZXI6IGNvbnRyb2xsZXIsIHZpZXc6IHZpZXd9XHJcblx0XHRpZiAoYXJnc1swXSAmJiBhcmdzWzBdLmtleSAhPSBudWxsKSBvdXRwdXQuYXR0cnMgPSB7a2V5OiBhcmdzWzBdLmtleX1cclxuXHRcdHJldHVybiBvdXRwdXRcclxuXHR9XHJcblx0bS5jb21wb25lbnQgPSBmdW5jdGlvbihjb21wb25lbnQpIHtcclxuXHRcdHJldHVybiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXHJcblx0fVxyXG5cdG0ubW91bnQgPSBtLm1vZHVsZSA9IGZ1bmN0aW9uKHJvb3QsIGNvbXBvbmVudCkge1xyXG5cdFx0aWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2UgZW5zdXJlIHRoZSBET00gZWxlbWVudCBleGlzdHMgYmVmb3JlIHJlbmRlcmluZyBhIHRlbXBsYXRlIGludG8gaXQuXCIpO1xyXG5cdFx0dmFyIGluZGV4ID0gcm9vdHMuaW5kZXhPZihyb290KTtcclxuXHRcdGlmIChpbmRleCA8IDApIGluZGV4ID0gcm9vdHMubGVuZ3RoO1xyXG5cdFx0XHJcblx0XHR2YXIgaXNQcmV2ZW50ZWQgPSBmYWxzZTtcclxuXHRcdHZhciBldmVudCA9IHtwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlzUHJldmVudGVkID0gdHJ1ZTtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsO1xyXG5cdFx0fX07XHJcblx0XHRmb3IgKHZhciBpID0gMCwgdW5sb2FkZXI7IHVubG9hZGVyID0gdW5sb2FkZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0dW5sb2FkZXIuaGFuZGxlci5jYWxsKHVubG9hZGVyLmNvbnRyb2xsZXIsIGV2ZW50KVxyXG5cdFx0XHR1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGlzUHJldmVudGVkKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCB1bmxvYWRlcjsgdW5sb2FkZXIgPSB1bmxvYWRlcnNbaV07IGkrKykgdW5sb2FkZXIuY29udHJvbGxlci5vbnVubG9hZCA9IHVubG9hZGVyLmhhbmRsZXJcclxuXHRcdH1cclxuXHRcdGVsc2UgdW5sb2FkZXJzID0gW11cclxuXHRcdFxyXG5cdFx0aWYgKGNvbnRyb2xsZXJzW2luZGV4XSAmJiB0eXBlb2YgY29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQoZXZlbnQpXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmICghaXNQcmV2ZW50ZWQpIHtcclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJhbGxcIik7XHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0XHRyb290c1tpbmRleF0gPSByb290O1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIGNvbXBvbmVudCA9IHN1YmNvbXBvbmVudChjb21wb25lbnQsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSlcclxuXHRcdFx0dmFyIGN1cnJlbnRDb21wb25lbnQgPSB0b3BDb21wb25lbnQgPSBjb21wb25lbnQgPSBjb21wb25lbnQgfHwge2NvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge319O1xyXG5cdFx0XHR2YXIgY29uc3RydWN0b3IgPSBjb21wb25lbnQuY29udHJvbGxlciB8fCBub29wXHJcblx0XHRcdHZhciBjb250cm9sbGVyID0gbmV3IGNvbnN0cnVjdG9yO1xyXG5cdFx0XHQvL2NvbnRyb2xsZXJzIG1heSBjYWxsIG0ubW91bnQgcmVjdXJzaXZlbHkgKHZpYSBtLnJvdXRlIHJlZGlyZWN0cywgZm9yIGV4YW1wbGUpXHJcblx0XHRcdC8vdGhpcyBjb25kaXRpb25hbCBlbnN1cmVzIG9ubHkgdGhlIGxhc3QgcmVjdXJzaXZlIG0ubW91bnQgY2FsbCBpcyBhcHBsaWVkXHJcblx0XHRcdGlmIChjdXJyZW50Q29tcG9uZW50ID09PSB0b3BDb21wb25lbnQpIHtcclxuXHRcdFx0XHRjb250cm9sbGVyc1tpbmRleF0gPSBjb250cm9sbGVyO1xyXG5cdFx0XHRcdGNvbXBvbmVudHNbaW5kZXhdID0gY29tcG9uZW50XHJcblx0XHRcdH1cclxuXHRcdFx0ZW5kRmlyc3RDb21wdXRhdGlvbigpO1xyXG5cdFx0XHRyZXR1cm4gY29udHJvbGxlcnNbaW5kZXhdXHJcblx0XHR9XHJcblx0fTtcclxuXHR2YXIgcmVkcmF3aW5nID0gZmFsc2VcclxuXHRtLnJlZHJhdyA9IGZ1bmN0aW9uKGZvcmNlKSB7XHJcblx0XHRpZiAocmVkcmF3aW5nKSByZXR1cm5cclxuXHRcdHJlZHJhd2luZyA9IHRydWVcclxuXHRcdC8vbGFzdFJlZHJhd0lkIGlzIGEgcG9zaXRpdmUgbnVtYmVyIGlmIGEgc2Vjb25kIHJlZHJhdyBpcyByZXF1ZXN0ZWQgYmVmb3JlIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG5cdFx0Ly9sYXN0UmVkcmF3SUQgaXMgbnVsbCBpZiBpdCdzIHRoZSBmaXJzdCByZWRyYXcgYW5kIG5vdCBhbiBldmVudCBoYW5kbGVyXHJcblx0XHRpZiAobGFzdFJlZHJhd0lkICYmIGZvcmNlICE9PSB0cnVlKSB7XHJcblx0XHRcdC8vd2hlbiBzZXRUaW1lb3V0OiBvbmx5IHJlc2NoZWR1bGUgcmVkcmF3IGlmIHRpbWUgYmV0d2VlbiBub3cgYW5kIHByZXZpb3VzIHJlZHJhdyBpcyBiaWdnZXIgdGhhbiBhIGZyYW1lLCBvdGhlcndpc2Uga2VlcCBjdXJyZW50bHkgc2NoZWR1bGVkIHRpbWVvdXRcclxuXHRcdFx0Ly93aGVuIHJBRjogYWx3YXlzIHJlc2NoZWR1bGUgcmVkcmF3XHJcblx0XHRcdGlmICgkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IG5ldyBEYXRlIC0gbGFzdFJlZHJhd0NhbGxUaW1lID4gRlJBTUVfQlVER0VUKSB7XHJcblx0XHRcdFx0aWYgKGxhc3RSZWRyYXdJZCA+IDApICRjYW5jZWxBbmltYXRpb25GcmFtZShsYXN0UmVkcmF3SWQpO1xyXG5cdFx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVkcmF3LCBGUkFNRV9CVURHRVQpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZWRyYXcoKTtcclxuXHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtsYXN0UmVkcmF3SWQgPSBudWxsfSwgRlJBTUVfQlVER0VUKVxyXG5cdFx0fVxyXG5cdFx0cmVkcmF3aW5nID0gZmFsc2VcclxuXHR9O1xyXG5cdG0ucmVkcmF3LnN0cmF0ZWd5ID0gbS5wcm9wKCk7XHJcblx0ZnVuY3Rpb24gcmVkcmF3KCkge1xyXG5cdFx0aWYgKGNvbXB1dGVQcmVSZWRyYXdIb29rKSB7XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rKClcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBudWxsXHJcblx0XHR9XHJcblx0XHRmb3IgKHZhciBpID0gMCwgcm9vdDsgcm9vdCA9IHJvb3RzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGNvbnRyb2xsZXJzW2ldKSB7XHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIgJiYgY29tcG9uZW50c1tpXS5jb250cm9sbGVyLiQkYXJncyA/IFtjb250cm9sbGVyc1tpXV0uY29uY2F0KGNvbXBvbmVudHNbaV0uY29udHJvbGxlci4kJGFyZ3MpIDogW2NvbnRyb2xsZXJzW2ldXVxyXG5cdFx0XHRcdG0ucmVuZGVyKHJvb3QsIGNvbXBvbmVudHNbaV0udmlldyA/IGNvbXBvbmVudHNbaV0udmlldyhjb250cm9sbGVyc1tpXSwgYXJncykgOiBcIlwiKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvL2FmdGVyIHJlbmRlcmluZyB3aXRoaW4gYSByb3V0ZWQgY29udGV4dCwgd2UgbmVlZCB0byBzY3JvbGwgYmFjayB0byB0aGUgdG9wLCBhbmQgZmV0Y2ggdGhlIGRvY3VtZW50IHRpdGxlIGZvciBoaXN0b3J5LnB1c2hTdGF0ZVxyXG5cdFx0aWYgKGNvbXB1dGVQb3N0UmVkcmF3SG9vaykge1xyXG5cdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2soKTtcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0bGFzdFJlZHJhd0lkID0gbnVsbDtcclxuXHRcdGxhc3RSZWRyYXdDYWxsVGltZSA9IG5ldyBEYXRlO1xyXG5cdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0fVxyXG5cclxuXHR2YXIgcGVuZGluZ1JlcXVlc3RzID0gMDtcclxuXHRtLnN0YXJ0Q29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtwZW5kaW5nUmVxdWVzdHMrK307XHJcblx0bS5lbmRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cGVuZGluZ1JlcXVlc3RzID0gTWF0aC5tYXgocGVuZGluZ1JlcXVlc3RzIC0gMSwgMCk7XHJcblx0XHRpZiAocGVuZGluZ1JlcXVlc3RzID09PSAwKSBtLnJlZHJhdygpXHJcblx0fTtcclxuXHR2YXIgZW5kRmlyc3RDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJub25lXCIpIHtcclxuXHRcdFx0cGVuZGluZ1JlcXVlc3RzLS1cclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0XHR9XHJcblx0XHRlbHNlIG0uZW5kQ29tcHV0YXRpb24oKTtcclxuXHR9XHJcblxyXG5cdG0ud2l0aEF0dHIgPSBmdW5jdGlvbihwcm9wLCB3aXRoQXR0ckNhbGxiYWNrKSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0dmFyIGN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgdGhpcztcclxuXHRcdFx0d2l0aEF0dHJDYWxsYmFjayhwcm9wIGluIGN1cnJlbnRUYXJnZXQgPyBjdXJyZW50VGFyZ2V0W3Byb3BdIDogY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUocHJvcCkpXHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0Ly9yb3V0aW5nXHJcblx0dmFyIG1vZGVzID0ge3BhdGhuYW1lOiBcIlwiLCBoYXNoOiBcIiNcIiwgc2VhcmNoOiBcIj9cIn07XHJcblx0dmFyIHJlZGlyZWN0ID0gbm9vcCwgcm91dGVQYXJhbXMsIGN1cnJlbnRSb3V0ZSwgaXNEZWZhdWx0Um91dGUgPSBmYWxzZTtcclxuXHRtLnJvdXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHQvL20ucm91dGUoKVxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBjdXJyZW50Um91dGU7XHJcblx0XHQvL20ucm91dGUoZWwsIGRlZmF1bHRSb3V0ZSwgcm91dGVzKVxyXG5cdFx0ZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiB0eXBlLmNhbGwoYXJndW1lbnRzWzFdKSA9PT0gU1RSSU5HKSB7XHJcblx0XHRcdHZhciByb290ID0gYXJndW1lbnRzWzBdLCBkZWZhdWx0Um91dGUgPSBhcmd1bWVudHNbMV0sIHJvdXRlciA9IGFyZ3VtZW50c1syXTtcclxuXHRcdFx0cmVkaXJlY3QgPSBmdW5jdGlvbihzb3VyY2UpIHtcclxuXHRcdFx0XHR2YXIgcGF0aCA9IGN1cnJlbnRSb3V0ZSA9IG5vcm1hbGl6ZVJvdXRlKHNvdXJjZSk7XHJcblx0XHRcdFx0aWYgKCFyb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSkge1xyXG5cdFx0XHRcdFx0aWYgKGlzRGVmYXVsdFJvdXRlKSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIGRlZmF1bHQgcm91dGUgbWF0Y2hlcyBvbmUgb2YgdGhlIHJvdXRlcyBkZWZpbmVkIGluIG0ucm91dGVcIilcclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gdHJ1ZVxyXG5cdFx0XHRcdFx0bS5yb3V0ZShkZWZhdWx0Um91dGUsIHRydWUpXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHR2YXIgbGlzdGVuZXIgPSBtLnJvdXRlLm1vZGUgPT09IFwiaGFzaFwiID8gXCJvbmhhc2hjaGFuZ2VcIiA6IFwib25wb3BzdGF0ZVwiO1xyXG5cdFx0XHR3aW5kb3dbbGlzdGVuZXJdID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSAkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXVxyXG5cdFx0XHRcdGlmIChtLnJvdXRlLm1vZGUgPT09IFwicGF0aG5hbWVcIikgcGF0aCArPSAkbG9jYXRpb24uc2VhcmNoXHJcblx0XHRcdFx0aWYgKGN1cnJlbnRSb3V0ZSAhPSBub3JtYWxpemVSb3V0ZShwYXRoKSkge1xyXG5cdFx0XHRcdFx0cmVkaXJlY3QocGF0aClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsO1xyXG5cdFx0XHR3aW5kb3dbbGlzdGVuZXJdKClcclxuXHRcdH1cclxuXHRcdC8vY29uZmlnOiBtLnJvdXRlXHJcblx0XHRlbHNlIGlmIChhcmd1bWVudHNbMF0uYWRkRXZlbnRMaXN0ZW5lciB8fCBhcmd1bWVudHNbMF0uYXR0YWNoRXZlbnQpIHtcclxuXHRcdFx0dmFyIGVsZW1lbnQgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHZhciBpc0luaXRpYWxpemVkID0gYXJndW1lbnRzWzFdO1xyXG5cdFx0XHR2YXIgY29udGV4dCA9IGFyZ3VtZW50c1syXTtcclxuXHRcdFx0dmFyIHZkb20gPSBhcmd1bWVudHNbM107XHJcblx0XHRcdGVsZW1lbnQuaHJlZiA9IChtLnJvdXRlLm1vZGUgIT09ICdwYXRobmFtZScgPyAkbG9jYXRpb24ucGF0aG5hbWUgOiAnJykgKyBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgdmRvbS5hdHRycy5ocmVmO1xyXG5cdFx0XHRpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XHJcblx0XHRcdFx0ZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSk7XHJcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRlbGVtZW50LmRldGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKTtcclxuXHRcdFx0XHRlbGVtZW50LmF0dGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvL20ucm91dGUocm91dGUsIHBhcmFtcywgc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSlcclxuXHRcdGVsc2UgaWYgKHR5cGUuY2FsbChhcmd1bWVudHNbMF0pID09PSBTVFJJTkcpIHtcclxuXHRcdFx0dmFyIG9sZFJvdXRlID0gY3VycmVudFJvdXRlO1xyXG5cdFx0XHRjdXJyZW50Um91dGUgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHZhciBhcmdzID0gYXJndW1lbnRzWzFdIHx8IHt9XHJcblx0XHRcdHZhciBxdWVyeUluZGV4ID0gY3VycmVudFJvdXRlLmluZGV4T2YoXCI/XCIpXHJcblx0XHRcdHZhciBwYXJhbXMgPSBxdWVyeUluZGV4ID4gLTEgPyBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRSb3V0ZS5zbGljZShxdWVyeUluZGV4ICsgMSkpIDoge31cclxuXHRcdFx0Zm9yICh2YXIgaSBpbiBhcmdzKSBwYXJhbXNbaV0gPSBhcmdzW2ldXHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcocGFyYW1zKVxyXG5cdFx0XHR2YXIgY3VycmVudFBhdGggPSBxdWVyeUluZGV4ID4gLTEgPyBjdXJyZW50Um91dGUuc2xpY2UoMCwgcXVlcnlJbmRleCkgOiBjdXJyZW50Um91dGVcclxuXHRcdFx0aWYgKHF1ZXJ5c3RyaW5nKSBjdXJyZW50Um91dGUgPSBjdXJyZW50UGF0aCArIChjdXJyZW50UGF0aC5pbmRleE9mKFwiP1wiKSA9PT0gLTEgPyBcIj9cIiA6IFwiJlwiKSArIHF1ZXJ5c3RyaW5nO1xyXG5cclxuXHRcdFx0dmFyIHNob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyA/IGFyZ3VtZW50c1syXSA6IGFyZ3VtZW50c1sxXSkgPT09IHRydWUgfHwgb2xkUm91dGUgPT09IGFyZ3VtZW50c1swXTtcclxuXHJcblx0XHRcdGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcclxuXHRcdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbFxyXG5cdFx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0d2luZG93Lmhpc3Rvcnlbc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSA/IFwicmVwbGFjZVN0YXRlXCIgOiBcInB1c2hTdGF0ZVwiXShudWxsLCAkZG9jdW1lbnQudGl0bGUsIG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmVkaXJlY3QobW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXSA9IGN1cnJlbnRSb3V0ZVxyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG5cdG0ucm91dGUucGFyYW0gPSBmdW5jdGlvbihrZXkpIHtcclxuXHRcdGlmICghcm91dGVQYXJhbXMpIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IGNhbGwgbS5yb3V0ZShlbGVtZW50LCBkZWZhdWx0Um91dGUsIHJvdXRlcykgYmVmb3JlIGNhbGxpbmcgbS5yb3V0ZS5wYXJhbSgpXCIpXHJcblx0XHRyZXR1cm4gcm91dGVQYXJhbXNba2V5XVxyXG5cdH07XHJcblx0bS5yb3V0ZS5tb2RlID0gXCJzZWFyY2hcIjtcclxuXHRmdW5jdGlvbiBub3JtYWxpemVSb3V0ZShyb3V0ZSkge1xyXG5cdFx0cmV0dXJuIHJvdXRlLnNsaWNlKG1vZGVzW20ucm91dGUubW9kZV0ubGVuZ3RoKVxyXG5cdH1cclxuXHRmdW5jdGlvbiByb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSB7XHJcblx0XHRyb3V0ZVBhcmFtcyA9IHt9O1xyXG5cclxuXHRcdHZhciBxdWVyeVN0YXJ0ID0gcGF0aC5pbmRleE9mKFwiP1wiKTtcclxuXHRcdGlmIChxdWVyeVN0YXJ0ICE9PSAtMSkge1xyXG5cdFx0XHRyb3V0ZVBhcmFtcyA9IHBhcnNlUXVlcnlTdHJpbmcocGF0aC5zdWJzdHIocXVlcnlTdGFydCArIDEsIHBhdGgubGVuZ3RoKSk7XHJcblx0XHRcdHBhdGggPSBwYXRoLnN1YnN0cigwLCBxdWVyeVN0YXJ0KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBhbGwgcm91dGVzIGFuZCBjaGVjayBpZiB0aGVyZSdzXHJcblx0XHQvLyBhbiBleGFjdCBtYXRjaCBmb3IgdGhlIGN1cnJlbnQgcGF0aFxyXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhyb3V0ZXIpO1xyXG5cdFx0dmFyIGluZGV4ID0ga2V5cy5pbmRleE9mKHBhdGgpO1xyXG5cdFx0aWYoaW5kZXggIT09IC0xKXtcclxuXHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJba2V5cyBbaW5kZXhdXSk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAodmFyIHJvdXRlIGluIHJvdXRlcikge1xyXG5cdFx0XHRpZiAocm91dGUgPT09IHBhdGgpIHtcclxuXHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChcIl5cIiArIHJvdXRlLnJlcGxhY2UoLzpbXlxcL10rP1xcLnszfS9nLCBcIiguKj8pXCIpLnJlcGxhY2UoLzpbXlxcL10rL2csIFwiKFteXFxcXC9dKylcIikgKyBcIlxcLz8kXCIpO1xyXG5cclxuXHRcdFx0aWYgKG1hdGNoZXIudGVzdChwYXRoKSkge1xyXG5cdFx0XHRcdHBhdGgucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlzID0gcm91dGUubWF0Y2goLzpbXlxcL10rL2cpIHx8IFtdO1xyXG5cdFx0XHRcdFx0dmFyIHZhbHVlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCAtMik7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKykgcm91dGVQYXJhbXNba2V5c1tpXS5yZXBsYWNlKC86fFxcLi9nLCBcIlwiKV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWVzW2ldKVxyXG5cdFx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gcm91dGVVbm9idHJ1c2l2ZShlKSB7XHJcblx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdGlmIChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5IHx8IGUud2hpY2ggPT09IDIpIHJldHVybjtcclxuXHRcdGlmIChlLnByZXZlbnREZWZhdWx0KSBlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRlbHNlIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuXHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcclxuXHRcdHZhciBhcmdzID0gbS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIgJiYgY3VycmVudFRhcmdldC5zZWFyY2ggPyBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRUYXJnZXQuc2VhcmNoLnNsaWNlKDEpKSA6IHt9O1xyXG5cdFx0d2hpbGUgKGN1cnJlbnRUYXJnZXQgJiYgY3VycmVudFRhcmdldC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpICE9IFwiQVwiKSBjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5wYXJlbnROb2RlXHJcblx0XHRtLnJvdXRlKGN1cnJlbnRUYXJnZXRbbS5yb3V0ZS5tb2RlXS5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aCksIGFyZ3MpXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHNldFNjcm9sbCgpIHtcclxuXHRcdGlmIChtLnJvdXRlLm1vZGUgIT0gXCJoYXNoXCIgJiYgJGxvY2F0aW9uLmhhc2gpICRsb2NhdGlvbi5oYXNoID0gJGxvY2F0aW9uLmhhc2g7XHJcblx0XHRlbHNlIHdpbmRvdy5zY3JvbGxUbygwLCAwKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBidWlsZFF1ZXJ5U3RyaW5nKG9iamVjdCwgcHJlZml4KSB7XHJcblx0XHR2YXIgZHVwbGljYXRlcyA9IHt9XHJcblx0XHR2YXIgc3RyID0gW11cclxuXHRcdGZvciAodmFyIHByb3AgaW4gb2JqZWN0KSB7XHJcblx0XHRcdHZhciBrZXkgPSBwcmVmaXggPyBwcmVmaXggKyBcIltcIiArIHByb3AgKyBcIl1cIiA6IHByb3BcclxuXHRcdFx0dmFyIHZhbHVlID0gb2JqZWN0W3Byb3BdXHJcblx0XHRcdHZhciB2YWx1ZVR5cGUgPSB0eXBlLmNhbGwodmFsdWUpXHJcblx0XHRcdHZhciBwYWlyID0gKHZhbHVlID09PSBudWxsKSA/IGVuY29kZVVSSUNvbXBvbmVudChrZXkpIDpcclxuXHRcdFx0XHR2YWx1ZVR5cGUgPT09IE9CSkVDVCA/IGJ1aWxkUXVlcnlTdHJpbmcodmFsdWUsIGtleSkgOlxyXG5cdFx0XHRcdHZhbHVlVHlwZSA9PT0gQVJSQVkgPyB2YWx1ZS5yZWR1Y2UoZnVuY3Rpb24obWVtbywgaXRlbSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkdXBsaWNhdGVzW2tleV0pIGR1cGxpY2F0ZXNba2V5XSA9IHt9XHJcblx0XHRcdFx0XHRpZiAoIWR1cGxpY2F0ZXNba2V5XVtpdGVtXSkge1xyXG5cdFx0XHRcdFx0XHRkdXBsaWNhdGVzW2tleV1baXRlbV0gPSB0cnVlXHJcblx0XHRcdFx0XHRcdHJldHVybiBtZW1vLmNvbmNhdChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGl0ZW0pKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIG1lbW9cclxuXHRcdFx0XHR9LCBbXSkuam9pbihcIiZcIikgOlxyXG5cdFx0XHRcdGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXHJcblx0XHRcdGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSBzdHIucHVzaChwYWlyKVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHN0ci5qb2luKFwiJlwiKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHN0cikge1xyXG5cdFx0aWYgKHN0ci5jaGFyQXQoMCkgPT09IFwiP1wiKSBzdHIgPSBzdHIuc3Vic3RyaW5nKDEpO1xyXG5cdFx0XHJcblx0XHR2YXIgcGFpcnMgPSBzdHIuc3BsaXQoXCImXCIpLCBwYXJhbXMgPSB7fTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBwYWlycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHR2YXIgcGFpciA9IHBhaXJzW2ldLnNwbGl0KFwiPVwiKTtcclxuXHRcdFx0dmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzBdKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBwYWlyLmxlbmd0aCA9PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pIDogbnVsbFxyXG5cdFx0XHRpZiAocGFyYW1zW2tleV0gIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmICh0eXBlLmNhbGwocGFyYW1zW2tleV0pICE9PSBBUlJBWSkgcGFyYW1zW2tleV0gPSBbcGFyYW1zW2tleV1dXHJcblx0XHRcdFx0cGFyYW1zW2tleV0ucHVzaCh2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHBhcmFtc1trZXldID0gdmFsdWVcclxuXHRcdH1cclxuXHRcdHJldHVybiBwYXJhbXNcclxuXHR9XHJcblx0bS5yb3V0ZS5idWlsZFF1ZXJ5U3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZ1xyXG5cdG0ucm91dGUucGFyc2VRdWVyeVN0cmluZyA9IHBhcnNlUXVlcnlTdHJpbmdcclxuXHRcclxuXHRmdW5jdGlvbiByZXNldChyb290KSB7XHJcblx0XHR2YXIgY2FjaGVLZXkgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdCk7XHJcblx0XHRjbGVhcihyb290LmNoaWxkTm9kZXMsIGNlbGxDYWNoZVtjYWNoZUtleV0pO1xyXG5cdFx0Y2VsbENhY2hlW2NhY2hlS2V5XSA9IHVuZGVmaW5lZFxyXG5cdH1cclxuXHJcblx0bS5kZWZlcnJlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpO1xyXG5cdFx0ZGVmZXJyZWQucHJvbWlzZSA9IHByb3BpZnkoZGVmZXJyZWQucHJvbWlzZSk7XHJcblx0XHRyZXR1cm4gZGVmZXJyZWRcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIHByb3BpZnkocHJvbWlzZSwgaW5pdGlhbFZhbHVlKSB7XHJcblx0XHR2YXIgcHJvcCA9IG0ucHJvcChpbml0aWFsVmFsdWUpO1xyXG5cdFx0cHJvbWlzZS50aGVuKHByb3ApO1xyXG5cdFx0cHJvcC50aGVuID0gZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpLCBpbml0aWFsVmFsdWUpXHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblx0Ly9Qcm9taXoubWl0aHJpbC5qcyB8IFpvbG1laXN0ZXIgfCBNSVRcclxuXHQvL2EgbW9kaWZpZWQgdmVyc2lvbiBvZiBQcm9taXouanMsIHdoaWNoIGRvZXMgbm90IGNvbmZvcm0gdG8gUHJvbWlzZXMvQSsgZm9yIHR3byByZWFzb25zOlxyXG5cdC8vMSkgYHRoZW5gIGNhbGxiYWNrcyBhcmUgY2FsbGVkIHN5bmNocm9ub3VzbHkgKGJlY2F1c2Ugc2V0VGltZW91dCBpcyB0b28gc2xvdywgYW5kIHRoZSBzZXRJbW1lZGlhdGUgcG9seWZpbGwgaXMgdG9vIGJpZ1xyXG5cdC8vMikgdGhyb3dpbmcgc3ViY2xhc3NlcyBvZiBFcnJvciBjYXVzZSB0aGUgZXJyb3IgdG8gYmUgYnViYmxlZCB1cCBpbnN0ZWFkIG9mIHRyaWdnZXJpbmcgcmVqZWN0aW9uIChiZWNhdXNlIHRoZSBzcGVjIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZSBpbXBvcnRhbnQgdXNlIGNhc2Ugb2YgZGVmYXVsdCBicm93c2VyIGVycm9yIGhhbmRsaW5nLCBpLmUuIG1lc3NhZ2Ugdy8gbGluZSBudW1iZXIpXHJcblx0ZnVuY3Rpb24gRGVmZXJyZWQoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spIHtcclxuXHRcdHZhciBSRVNPTFZJTkcgPSAxLCBSRUpFQ1RJTkcgPSAyLCBSRVNPTFZFRCA9IDMsIFJFSkVDVEVEID0gNDtcclxuXHRcdHZhciBzZWxmID0gdGhpcywgc3RhdGUgPSAwLCBwcm9taXNlVmFsdWUgPSAwLCBuZXh0ID0gW107XHJcblxyXG5cdFx0c2VsZltcInByb21pc2VcIl0gPSB7fTtcclxuXHJcblx0XHRzZWxmW1wicmVzb2x2ZVwiXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklORztcclxuXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZltcInJlamVjdFwiXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZi5wcm9taXNlW1widGhlblwiXSA9IGZ1bmN0aW9uKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XHJcblx0XHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZChzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayk7XHJcblx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWRUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNURUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdG5leHQucHVzaChkZWZlcnJlZClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdFx0fTtcclxuXHJcblx0XHRmdW5jdGlvbiBmaW5pc2godHlwZSkge1xyXG5cdFx0XHRzdGF0ZSA9IHR5cGUgfHwgUkVKRUNURUQ7XHJcblx0XHRcdG5leHQubWFwKGZ1bmN0aW9uKGRlZmVycmVkKSB7XHJcblx0XHRcdFx0c3RhdGUgPT09IFJFU09MVkVEICYmIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZVZhbHVlKSB8fCBkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHRoZW5uYWJsZSh0aGVuLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaywgbm90VGhlbm5hYmxlQ2FsbGJhY2spIHtcclxuXHRcdFx0aWYgKCgocHJvbWlzZVZhbHVlICE9IG51bGwgJiYgdHlwZS5jYWxsKHByb21pc2VWYWx1ZSkgPT09IE9CSkVDVCkgfHwgdHlwZW9mIHByb21pc2VWYWx1ZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiB0aGVuID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvLyBjb3VudCBwcm90ZWN0cyBhZ2FpbnN0IGFidXNlIGNhbGxzIGZyb20gc3BlYyBjaGVja2VyXHJcblx0XHRcdFx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0XHRcdFx0dGhlbi5jYWxsKHByb21pc2VWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVybjtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdHN1Y2Nlc3NDYWxsYmFjaygpXHJcblx0XHRcdFx0XHR9LCBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVybjtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdGZhaWx1cmVDYWxsYmFjaygpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRcdGZhaWx1cmVDYWxsYmFjaygpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG5vdFRoZW5uYWJsZUNhbGxiYWNrKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGZpcmUoKSB7XHJcblx0XHRcdC8vIGNoZWNrIGlmIGl0J3MgYSB0aGVuYWJsZVxyXG5cdFx0XHR2YXIgdGhlbjtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR0aGVuID0gcHJvbWlzZVZhbHVlICYmIHByb21pc2VWYWx1ZS50aGVuXHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHRcdFx0XHRyZXR1cm4gZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HO1xyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIHR5cGVvZiBzdWNjZXNzQ2FsbGJhY2sgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHN1Y2Nlc3NDYWxsYmFjayhwcm9taXNlVmFsdWUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNUSU5HICYmIHR5cGVvZiBmYWlsdXJlQ2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBmYWlsdXJlQ2FsbGJhY2socHJvbWlzZVZhbHVlKTtcclxuXHRcdFx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkdcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChwcm9taXNlVmFsdWUgPT09IHNlbGYpIHtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IFR5cGVFcnJvcigpO1xyXG5cdFx0XHRcdFx0ZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRmaW5pc2goUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9LCBmaW5pc2gsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKHN0YXRlID09PSBSRVNPTFZJTkcgJiYgUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblx0bS5kZWZlcnJlZC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0aWYgKHR5cGUuY2FsbChlKSA9PT0gXCJbb2JqZWN0IEVycm9yXVwiICYmICFlLmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkubWF0Y2goLyBFcnJvci8pKSB0aHJvdyBlXHJcblx0fTtcclxuXHJcblx0bS5zeW5jID0gZnVuY3Rpb24oYXJncykge1xyXG5cdFx0dmFyIG1ldGhvZCA9IFwicmVzb2x2ZVwiO1xyXG5cdFx0ZnVuY3Rpb24gc3luY2hyb25pemVyKHBvcywgcmVzb2x2ZWQpIHtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0cmVzdWx0c1twb3NdID0gdmFsdWU7XHJcblx0XHRcdFx0aWYgKCFyZXNvbHZlZCkgbWV0aG9kID0gXCJyZWplY3RcIjtcclxuXHRcdFx0XHRpZiAoLS1vdXRzdGFuZGluZyA9PT0gMCkge1xyXG5cdFx0XHRcdFx0ZGVmZXJyZWQucHJvbWlzZShyZXN1bHRzKTtcclxuXHRcdFx0XHRcdGRlZmVycmVkW21ldGhvZF0ocmVzdWx0cylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHZhbHVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZGVmZXJyZWQgPSBtLmRlZmVycmVkKCk7XHJcblx0XHR2YXIgb3V0c3RhbmRpbmcgPSBhcmdzLmxlbmd0aDtcclxuXHRcdHZhciByZXN1bHRzID0gbmV3IEFycmF5KG91dHN0YW5kaW5nKTtcclxuXHRcdGlmIChhcmdzLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0YXJnc1tpXS50aGVuKHN5bmNocm9uaXplcihpLCB0cnVlKSwgc3luY2hyb25pemVyKGksIGZhbHNlKSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBkZWZlcnJlZC5yZXNvbHZlKFtdKTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdH07XHJcblx0ZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtyZXR1cm4gdmFsdWV9XHJcblxyXG5cdGZ1bmN0aW9uIGFqYXgob3B0aW9ucykge1xyXG5cdFx0aWYgKG9wdGlvbnMuZGF0YVR5cGUgJiYgb3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCIpIHtcclxuXHRcdFx0dmFyIGNhbGxiYWNrS2V5ID0gXCJtaXRocmlsX2NhbGxiYWNrX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCkgKyBcIl9cIiArIChNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxZTE2KSkudG9TdHJpbmcoMzYpO1xyXG5cdFx0XHR2YXIgc2NyaXB0ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XHJcblxyXG5cdFx0XHR3aW5kb3dbY2FsbGJhY2tLZXldID0gZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcblx0XHRcdFx0b3B0aW9ucy5vbmxvYWQoe1xyXG5cdFx0XHRcdFx0dHlwZTogXCJsb2FkXCIsXHJcblx0XHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiByZXNwXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0Lm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0c2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuXHJcblx0XHRcdFx0b3B0aW9ucy5vbmVycm9yKHtcclxuXHRcdFx0XHRcdHR5cGU6IFwiZXJyb3JcIixcclxuXHRcdFx0XHRcdHRhcmdldDoge1xyXG5cdFx0XHRcdFx0XHRzdGF0dXM6IDUwMCxcclxuXHRcdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiBKU09OLnN0cmluZ2lmeSh7ZXJyb3I6IFwiRXJyb3IgbWFraW5nIGpzb25wIHJlcXVlc3RcIn0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZDtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0LnNyYyA9IG9wdGlvbnMudXJsXHJcblx0XHRcdFx0KyAob3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPiAwID8gXCImXCIgOiBcIj9cIilcclxuXHRcdFx0XHQrIChvcHRpb25zLmNhbGxiYWNrS2V5ID8gb3B0aW9ucy5jYWxsYmFja0tleSA6IFwiY2FsbGJhY2tcIilcclxuXHRcdFx0XHQrIFwiPVwiICsgY2FsbGJhY2tLZXlcclxuXHRcdFx0XHQrIFwiJlwiICsgYnVpbGRRdWVyeVN0cmluZyhvcHRpb25zLmRhdGEgfHwge30pO1xyXG5cdFx0XHQkZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFyIHhociA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XHJcblx0XHRcdHhoci5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCwgdHJ1ZSwgb3B0aW9ucy51c2VyLCBvcHRpb25zLnBhc3N3b3JkKTtcclxuXHRcdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xyXG5cdFx0XHRcdFx0aWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIG9wdGlvbnMub25sb2FkKHt0eXBlOiBcImxvYWRcIiwgdGFyZ2V0OiB4aHJ9KTtcclxuXHRcdFx0XHRcdGVsc2Ugb3B0aW9ucy5vbmVycm9yKHt0eXBlOiBcImVycm9yXCIsIHRhcmdldDogeGhyfSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGlmIChvcHRpb25zLnNlcmlhbGl6ZSA9PT0gSlNPTi5zdHJpbmdpZnkgJiYgb3B0aW9ucy5kYXRhICYmIG9wdGlvbnMubWV0aG9kICE9PSBcIkdFVFwiKSB7XHJcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9wdGlvbnMuZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UpIHtcclxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvKlwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuY29uZmlnID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHZhciBtYXliZVhociA9IG9wdGlvbnMuY29uZmlnKHhociwgb3B0aW9ucyk7XHJcblx0XHRcdFx0aWYgKG1heWJlWGhyICE9IG51bGwpIHhociA9IG1heWJlWGhyXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBkYXRhID0gb3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgfHwgIW9wdGlvbnMuZGF0YSA/IFwiXCIgOiBvcHRpb25zLmRhdGFcclxuXHRcdFx0aWYgKGRhdGEgJiYgKHR5cGUuY2FsbChkYXRhKSAhPSBTVFJJTkcgJiYgZGF0YS5jb25zdHJ1Y3RvciAhPSB3aW5kb3cuRm9ybURhdGEpKSB7XHJcblx0XHRcdFx0dGhyb3cgXCJSZXF1ZXN0IGRhdGEgc2hvdWxkIGJlIGVpdGhlciBiZSBhIHN0cmluZyBvciBGb3JtRGF0YS4gQ2hlY2sgdGhlIGBzZXJpYWxpemVgIG9wdGlvbiBpbiBgbS5yZXF1ZXN0YFwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdHhoci5zZW5kKGRhdGEpO1xyXG5cdFx0XHRyZXR1cm4geGhyXHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJpbmREYXRhKHhock9wdGlvbnMsIGRhdGEsIHNlcmlhbGl6ZSkge1xyXG5cdFx0aWYgKHhock9wdGlvbnMubWV0aG9kID09PSBcIkdFVFwiICYmIHhock9wdGlvbnMuZGF0YVR5cGUgIT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHZhciBwcmVmaXggPSB4aHJPcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA8IDAgPyBcIj9cIiA6IFwiJlwiO1xyXG5cdFx0XHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKGRhdGEpO1xyXG5cdFx0XHR4aHJPcHRpb25zLnVybCA9IHhock9wdGlvbnMudXJsICsgKHF1ZXJ5c3RyaW5nID8gcHJlZml4ICsgcXVlcnlzdHJpbmcgOiBcIlwiKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB4aHJPcHRpb25zLmRhdGEgPSBzZXJpYWxpemUoZGF0YSk7XHJcblx0XHRyZXR1cm4geGhyT3B0aW9uc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemVVcmwodXJsLCBkYXRhKSB7XHJcblx0XHR2YXIgdG9rZW5zID0gdXJsLm1hdGNoKC86W2Etel1cXHcrL2dpKTtcclxuXHRcdGlmICh0b2tlbnMgJiYgZGF0YSkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHZhciBrZXkgPSB0b2tlbnNbaV0uc2xpY2UoMSk7XHJcblx0XHRcdFx0dXJsID0gdXJsLnJlcGxhY2UodG9rZW5zW2ldLCBkYXRhW2tleV0pO1xyXG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2tleV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHVybFxyXG5cdH1cclxuXHJcblx0bS5yZXF1ZXN0ID0gZnVuY3Rpb24oeGhyT3B0aW9ucykge1xyXG5cdFx0aWYgKHhock9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5zdGFydENvbXB1dGF0aW9uKCk7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuXHRcdHZhciBpc0pTT05QID0geGhyT3B0aW9ucy5kYXRhVHlwZSAmJiB4aHJPcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIjtcclxuXHRcdHZhciBzZXJpYWxpemUgPSB4aHJPcHRpb25zLnNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuc2VyaWFsaXplIHx8IEpTT04uc3RyaW5naWZ5O1xyXG5cdFx0dmFyIGRlc2VyaWFsaXplID0geGhyT3B0aW9ucy5kZXNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuZGVzZXJpYWxpemUgfHwgSlNPTi5wYXJzZTtcclxuXHRcdHZhciBleHRyYWN0ID0gaXNKU09OUCA/IGZ1bmN0aW9uKGpzb25wKSB7cmV0dXJuIGpzb25wLnJlc3BvbnNlVGV4dH0gOiB4aHJPcHRpb25zLmV4dHJhY3QgfHwgZnVuY3Rpb24oeGhyKSB7XHJcblx0XHRcdHJldHVybiB4aHIucmVzcG9uc2VUZXh0Lmxlbmd0aCA9PT0gMCAmJiBkZXNlcmlhbGl6ZSA9PT0gSlNPTi5wYXJzZSA/IG51bGwgOiB4aHIucmVzcG9uc2VUZXh0XHJcblx0XHR9O1xyXG5cdFx0eGhyT3B0aW9ucy5tZXRob2QgPSAoeGhyT3B0aW9ucy5tZXRob2QgfHwgJ0dFVCcpLnRvVXBwZXJDYXNlKCk7XHJcblx0XHR4aHJPcHRpb25zLnVybCA9IHBhcmFtZXRlcml6ZVVybCh4aHJPcHRpb25zLnVybCwgeGhyT3B0aW9ucy5kYXRhKTtcclxuXHRcdHhock9wdGlvbnMgPSBiaW5kRGF0YSh4aHJPcHRpb25zLCB4aHJPcHRpb25zLmRhdGEsIHNlcmlhbGl6ZSk7XHJcblx0XHR4aHJPcHRpb25zLm9ubG9hZCA9IHhock9wdGlvbnMub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0XHR2YXIgdW53cmFwID0gKGUudHlwZSA9PT0gXCJsb2FkXCIgPyB4aHJPcHRpb25zLnVud3JhcFN1Y2Nlc3MgOiB4aHJPcHRpb25zLnVud3JhcEVycm9yKSB8fCBpZGVudGl0eTtcclxuXHRcdFx0XHR2YXIgcmVzcG9uc2UgPSB1bndyYXAoZGVzZXJpYWxpemUoZXh0cmFjdChlLnRhcmdldCwgeGhyT3B0aW9ucykpLCBlLnRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGUudHlwZSA9PT0gXCJsb2FkXCIpIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlLmNhbGwocmVzcG9uc2UpID09PSBBUlJBWSAmJiB4aHJPcHRpb25zLnR5cGUpIHtcclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZXNwb25zZS5sZW5ndGg7IGkrKykgcmVzcG9uc2VbaV0gPSBuZXcgeGhyT3B0aW9ucy50eXBlKHJlc3BvbnNlW2ldKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoeGhyT3B0aW9ucy50eXBlKSByZXNwb25zZSA9IG5ldyB4aHJPcHRpb25zLnR5cGUocmVzcG9uc2UpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRlZmVycmVkW2UudHlwZSA9PT0gXCJsb2FkXCIgPyBcInJlc29sdmVcIiA6IFwicmVqZWN0XCJdKHJlc3BvbnNlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh4aHJPcHRpb25zLmJhY2tncm91bmQgIT09IHRydWUpIG0uZW5kQ29tcHV0YXRpb24oKVxyXG5cdFx0fTtcclxuXHRcdGFqYXgoeGhyT3B0aW9ucyk7XHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlLCB4aHJPcHRpb25zLmluaXRpYWxWYWx1ZSk7XHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdH07XHJcblxyXG5cdC8vdGVzdGluZyBBUElcclxuXHRtLmRlcHMgPSBmdW5jdGlvbihtb2NrKSB7XHJcblx0XHRpbml0aWFsaXplKHdpbmRvdyA9IG1vY2sgfHwgd2luZG93KTtcclxuXHRcdHJldHVybiB3aW5kb3c7XHJcblx0fTtcclxuXHQvL2ZvciBpbnRlcm5hbCB0ZXN0aW5nIG9ubHksIGRvIG5vdCB1c2UgYG0uZGVwcy5mYWN0b3J5YFxyXG5cdG0uZGVwcy5mYWN0b3J5ID0gYXBwO1xyXG5cclxuXHRyZXR1cm4gbVxyXG59KSh0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSk7XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBtO1xyXG5lbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiBtfSk7XHJcbiJdfQ==
