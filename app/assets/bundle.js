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
    this.previousCommands = [];
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
      currentRoomName: this.currentRoomName,
      previousCommands: this.previousCommands
    }));
  };

  Engine.prototype.load = function() {
    var data;
    try {
      data = JSON.parse(localStorage.getItem('progress'));
      this.inventory = data.inventory;
      this.currentRoomName = data.currentRoomName;
      this.previousCommands = data.previousCommands || [];
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
    this.previousCommands.push(commandText);
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
      }, m('h1', engine.getCurrentRoomName()), m('p', m.trust(ctrl.vm.typer.getTypingMessage())), engine.getCurrentRoomName() === 'End' ? [
        m('div', {
          style: {
            width: '100%',
            textAlign: 'center'
          }
        }, m('img', {
          src: '/shark-showering.png'
        })), m('br'), m('br'), m('h3', 'Do you even feedback?'), m('div', m('iframe', {
          src: 'https://docs.google.com/forms/d/1drHKsfEzS_zA17YTd7OaWYis1Q8Jjf33fr7K6OcRBok/viewform?embedded=true',
          width: '760',
          height: '500',
          frameborder: '0',
          marginheight: '0',
          marginwidth: '0',
          style: {
            padding: '2px',
            border: '1px solid grey',
            marginRight: '20px'
          }
        }, 'Loading...'), m('textarea', {
          style: {
            height: '500px'
          }
        }, m.trust(engine.previousCommands.join('\n'))))
      ] : m('form', {
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
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with an empty bowl sitting there)', function() {
    if (this.matches('look')) {
      return this.print('In an urn take but not churn items two not like goo.');
    } else if (this.matches('soda flower')) {
      this.removeItem('flowers');
      this.removeItem('can of soda');
      return this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of powder sitting there)');
    } else {
      return this.tryUniversalCommands();
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
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)', function() {
    if (this.matches('look')) {
      return this.print('Cutting and scooping shall have their day, but a for a fine fluffy batter there be but one way.');
    } else if (this.matches('stir')) {
      return this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)');
    } else if (this.matches('shake')) {
      return this.print('Dude, who do you think you are, James Bond?  This batter needs to be stirred, not shaken.');
    } else {
      return this.tryUniversalCommands();
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
    } else {
      return this.tryUniversalCommands();
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
    } else {
      return this.tryUniversalCommands();
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
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('End', function() {
    if (this.matches('look')) {
      return this.print('You remove the Quadratic Eye from its compartment, close your eyes and allow union between your spirit and the universal chi flow. Then the goblin gets cut in half and you get your shampoo back.');
    }
  });
  return engine.setStartRoom('Wale vs Sharc: The Comic: The Interactive Software Title For Your Computer Box');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kY29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9tYWluLmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC9lbmdpbmUuY29mZmVlIiwiL2hvbWUvZGNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9ub2RlX21vZHVsZXMvYXBwL3RiYWVuZ2luZS9pbmRleC5jb2ZmZWUiLCIvaG9tZS9kY29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL25vZGVfbW9kdWxlcy9hcHAvdGJhZW5naW5lL3N5bm9ueW1zLmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC92aWV3LmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC93YWxldnNzaGFyYy5jb2ZmZWUiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxlQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsU0FBUixDQUFKLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSxZQUFSLENBRFQsQ0FBQTs7QUFBQSxJQUVBLEdBQU8sT0FBQSxDQUFRLFVBQVIsQ0FGUCxDQUFBOztBQUFBLENBS0MsQ0FBQyxLQUFGLENBQVEsUUFBUSxDQUFDLElBQWpCLEVBQXVCLElBQXZCLENBTEEsQ0FBQTs7Ozs7QUNBQSxJQUFBLHdCQUFBOztBQUFBLHdCQUFBLEdBQTJCLE9BQUEsQ0FBUSxlQUFSLENBQTNCLENBQUE7O0FBQUEsTUFDTSxDQUFDLE9BQVAsR0FBcUIsSUFBQSx3QkFBQSxDQUFBLENBRHJCLENBQUE7Ozs7O0FDQUEsSUFB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm0gPSByZXF1aXJlKCdtaXRocmlsJylcbmVuZ2luZSA9IHJlcXVpcmUoJ2FwcC9lbmdpbmUnKVxudmlldyA9IHJlcXVpcmUoJ2FwcC92aWV3JylcblxuXG5tLm1vdW50KGRvY3VtZW50LmJvZHksIHZpZXcpXG4iLCJUZXh0QmFzZWRBZHZlbnR1cmVFbmdpbmUgPSByZXF1aXJlKCdhcHAvdGJhZW5naW5lJylcbm1vZHVsZS5leHBvcnRzID0gbmV3IFRleHRCYXNlZEFkdmVudHVyZUVuZ2luZSgpXG4iLCJzeW5vbnltRGF0YSA9IHJlcXVpcmUoJy4vc3lub255bXMnKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRW5naW5lXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEByb29tcyA9IHt9XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcyA9IC0+XG4gICAgICAgIEBhZnRlckNvbW1hbmQgPSAtPlxuXG4gICAgICAgIEBpbnZlbnRvcnkgPSB7fVxuICAgICAgICBAY3VycmVudFJvb21OYW1lID0gJydcbiAgICAgICAgQGZsYWdzID0ge31cblxuICAgICAgICBAY29tbWFuZFdvcmRzID0gW11cbiAgICAgICAgQG1lc3NhZ2UgPSAnJ1xuXG4gICAgICAgIEBjYWxsYmFja3MgPSBbXVxuICAgICAgICBAc3RhcnRSb29tID0gJydcblxuICAgICAgICBAd2FpdENhbGxiYWNrID0gbnVsbFxuXG4gICAgICAgIEBwcmV2aW91c0NvbW1hbmRzID0gW11cblxuICAgIHNldFN0YXJ0Um9vbTogKHJvb21OYW1lKSAtPlxuICAgICAgICBAc3RhcnRSb29tID0gcm9vbU5hbWVcblxuICAgIHNldEFmdGVyQ29tbWFuZDogKGNhbGxiYWNrKSAtPlxuICAgICAgICBAYWZ0ZXJDb21tYW5kID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgc2F2ZTogLT5cbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0gJ3Byb2dyZXNzJywgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgaW52ZW50b3J5OiBAaW52ZW50b3J5XG4gICAgICAgICAgICBjdXJyZW50Um9vbU5hbWU6IEBjdXJyZW50Um9vbU5hbWVcbiAgICAgICAgICAgIHByZXZpb3VzQ29tbWFuZHM6IEBwcmV2aW91c0NvbW1hbmRzXG4gICAgICAgIH0pXG5cbiAgICBsb2FkOiAtPlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwcm9ncmVzcycpKVxuICAgICAgICAgICAgQGludmVudG9yeSA9IGRhdGEuaW52ZW50b3J5XG4gICAgICAgICAgICBAY3VycmVudFJvb21OYW1lID0gZGF0YS5jdXJyZW50Um9vbU5hbWVcbiAgICAgICAgICAgIEBwcmV2aW91c0NvbW1hbmRzID0gZGF0YS5wcmV2aW91c0NvbW1hbmRzIG9yIFtdXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBjYXRjaFxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgYWRkUm9vbTogKHJvb21OYW1lLCBjYWxsYmFjaykgLT5cbiAgICAgICAgQHJvb21zW3Jvb21OYW1lXSA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIGdldEN1cnJlbnRSb29tTmFtZTogLT4gQGN1cnJlbnRSb29tTmFtZVxuXG4gICAgZ2V0Q3VycmVudE1lc3NhZ2U6IC0+IEBtZXNzYWdlXG5cbiAgICBnZXRJbnZlbnRvcnk6IC0+IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoQGludmVudG9yeSkpXG5cbiAgICBkb0NvbW1hbmQ6IChjb21tYW5kVGV4dCkgLT5cbiAgICAgICAgaWYgQHdhaXRDYWxsYmFjaz9cbiAgICAgICAgICAgIGNhbGxiYWNrID0gQHdhaXRDYWxsYmFja1xuICAgICAgICAgICAgQHdhaXRDYWxsYmFjayA9IG51bGxcbiAgICAgICAgICAgIGNhbGxiYWNrKClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEBwcmV2aW91c0NvbW1hbmRzLnB1c2goY29tbWFuZFRleHQpXG5cbiAgICAgICAgIyBjbGVhbiB1cCB0aGUgY29tbWFuZCB0ZXh0XG4gICAgICAgIGNvbW1hbmRUZXh0ID0gY29tbWFuZFRleHRcbiAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxXKy9nLCAnICcpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxzezIsfS9nLCAnICcpXG5cbiAgICAgICAgIyBmaW5kIHN5bm9ueW1zIGFuZCByZXBsYWNlIHRoZW0gd2l0aCB0aGUgY2Fub25pY2FsIHdvcmRcbiAgICAgICAgZm9yIGNhbm5vbmljYWxXb3JkLCBzeW5vbnltcyBvZiBzeW5vbnltRGF0YVxuICAgICAgICAgICAgZm9yIHN5bm9ueW0gaW4gc3lub255bXNcbiAgICAgICAgICAgICAgICBjb21tYW5kVGV4dCA9IGNvbW1hbmRUZXh0LnJlcGxhY2Uoc3lub255bSwgY2Fubm9uaWNhbFdvcmQpXG5cbiAgICAgICAgQGNvbW1hbmRXb3JkcyA9IGNvbW1hbmRUZXh0LnNwbGl0KCcgJylcblxuICAgICAgICBAcm9vbXNbQGN1cnJlbnRSb29tTmFtZV0oKVxuICAgICAgICBAYWZ0ZXJDb21tYW5kKClcblxuICAgIHNldFVuaXZlcnNhbENvbW1hbmRzOiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcyA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIHRyeVVuaXZlcnNhbENvbW1hbmRzOiAtPlxuICAgICAgICBAdW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgbWF0Y2hlczogKHBhdHRlcm4pIC0+XG4gICAgICAgICMgSWYgZWFjaCB3b3JkIGluIHRoZSBzcGVjIGNvbW1hbmQgaXMgZm91bmRcbiAgICAgICAgIyBhbnl3aGVyZSBpbiB0aGUgdXNlcidzIGlucHV0IGl0J3MgYSBtYXRjaFxuICAgICAgICBwYXR0ZXJuV29yZHMgPSBwYXR0ZXJuLnNwbGl0KCcgJylcbiAgICAgICAgZm9yIHBhdHRlcm5Xb3JkIGluIHBhdHRlcm5Xb3Jkc1xuICAgICAgICAgICAgaWYgbm90IChwYXR0ZXJuV29yZCBpbiBAY29tbWFuZFdvcmRzKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgaGFzSXRlbTogKGl0ZW0pIC0+IGl0ZW0gb2YgQGludmVudG9yeVxuICAgIHVzZWRJdGVtOiAoaXRlbSkgLT4gaXRlbSBvZiBAaW52ZW50b3J5IGFuZCBAaW52ZW50b3J5W2l0ZW1dID09ICd1c2VkJ1xuXG4gICAgcGVyY2VudENoYW5jZTogKGNoYW5jZSkgLT4gTWF0aC5yYW5kb20oKSA8IGNoYW5jZSAvIDEwMFxuXG4gICAgZmxhZ0lzOiAoZmxhZ05hbWUsIHZhbHVlKSAtPiBAZmxhZ3NbZmxhZ05hbWVdID09IHZhbHVlXG5cbiAgICBwcmludDogKHRleHQpIC0+XG4gICAgICAgIEBtZXNzYWdlID0gdGV4dFxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdvVG9Sb29tOiAocm9vbU5hbWUpIC0+XG4gICAgICAgIEBjdXJyZW50Um9vbU5hbWUgPSByb29tTmFtZVxuICAgICAgICBAZG9Db21tYW5kKCdsb29rJylcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICBnb1RvU3RhcnQ6IC0+XG4gICAgICAgIEBjdXJyZW50Um9vbU5hbWUgPSBAc3RhcnRSb29tXG4gICAgICAgIEBkb0NvbW1hbmQoJ2xvb2snKVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIHNldEZsYWc6IChmbGFnTmFtZSwgdmFsdWUpIC0+XG4gICAgICAgIEBmbGFnc1tmbGFnTmFtZV0gPSB2YWx1ZVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdldEl0ZW06IChpdGVtKSAtPlxuICAgICAgICBAaW52ZW50b3J5W2l0ZW1dID0gJ2dvdHRlbidcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICByZW1vdmVJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgZGVsZXRlIEBpbnZlbnRvcnlbaXRlbV1cbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICB1c2VJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgQGludmVudG9yeVtpdGVtXSA9ICd1c2VkJ1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIHdhaXQ6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQG1lc3NhZ2UgKz0gJyA8c3Ryb25nPihIaXQgRW50ZXIpPC9zdHJvbmc+J1xuICAgICAgICBAd2FpdENhbGxiYWNrID0gY2FsbGJhY2tcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICBsaXN0ZW46IChjYWxsYmFjaykgLT4gQGNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKVxuXG4gICAgbm90aWZ5OiAtPiBjYWxsYmFjaygpIGZvciBjYWxsYmFjayBpbiBAY2FsbGJhY2tzXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gICAgbG9vazogW1xuICAgICAgICAnc2VlJ1xuICAgICAgICAnYWRtaXJlJ1xuICAgICAgICAnYmVob2xkJ1xuICAgICAgICAnZ2F3aydcbiAgICAgICAgJ29ic2VydmUnXG4gICAgICAgICdzcHknXG4gICAgXVxuICAgIHRha2U6IFtcbiAgICAgICAgJ3BpY2sgdXAnXG4gICAgICAgICdnZXQnXG4gICAgICAgICdhY3F1aXJlJ1xuICAgICAgICAnZ3JhYidcbiAgICAgICAgJ2dyYXNwJ1xuICAgICAgICAnb2J0YWluJ1xuICAgICAgICAnYnV5J1xuICAgICAgICAnY2hvb3NlJ1xuICAgIF1cbiAgICBnbzogW1xuICAgICAgICAnd2FsaydcbiAgICAgICAgJ3BlcmFtYnVsYXRlJ1xuICAgICAgICAnZmxlZSdcbiAgICAgICAgJ2xlYXZlJ1xuICAgICAgICAnbW92ZSdcbiAgICAgICAgJ3RyYXZlbCdcbiAgICAgICAgJ2RlcGFydCdcbiAgICAgICAgJ2RlY2FtcCdcbiAgICAgICAgJ2V4aXQnXG4gICAgICAgICdqb3VybmV5J1xuICAgICAgICAnbW9zZXknXG4gICAgICAgICd3aXRoZHJhdydcbiAgICBdXG4gICAgZ2l2ZTogW1xuICAgICAgICAnZGVsaXZlcidcbiAgICAgICAgJ2RvbmF0ZSdcbiAgICAgICAgJ2hhbmQgb3ZlcidcbiAgICAgICAgJ3ByZXNlbnQnXG4gICAgICAgICdlbmRvdydcbiAgICAgICAgJ2JlcXVlYXRoJ1xuICAgICAgICAnYmVzdG93J1xuICAgICAgICAncmVsaW5xdWlzaCdcbiAgICBdXG4gICAgZ2FyZGVuOiBbXG4gICAgICAgICdwbG90J1xuICAgICAgICAncGxhbnRzJ1xuICAgICAgICAncHJvZHVjZSdcbiAgICBdXG4iLCJtID0gcmVxdWlyZSgnbWl0aHJpbCcpXG5lbmdpbmUgPSByZXF1aXJlKCdhcHAvZW5naW5lJylcbldhbGVWc1NoYXJjID0gcmVxdWlyZSgnYXBwL3dhbGV2c3NoYXJjJylcblxuXG5TdHJpbmcucHJvdG90eXBlLmNhcGl0YWxpemUgPSAtPlxuICAgIEBbMF0udG9VcHBlckNhc2UoKSArIEBbMS4uXVxuXG5cbmNsYXNzIFRleHRUeXBlclxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAY3VycmVudE1lc3NhZ2UgPSAnJ1xuICAgICAgICBAdHlwZXIgPSBudWxsXG4gICAgICAgIEBtYWtlVHlwZXIgPSAodGV4dCwgc3BlZWQ9NCkgLT5cbiAgICAgICAgICAgIGkgPSAwXG4gICAgICAgICAgICB0eXBlTG9vcCA9IC0+XG4gICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICAgICAgICAgIGlmIGkgPCB0ZXh0Lmxlbmd0aCAtIDFcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCh0eXBlTG9vcCwgc3BlZWQpXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHR5cGVMb29wLCBzcGVlZClcblxuICAgICAgICAgICAgcmV0dXJuIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRleHRbLi5pXVxuICAgIFxuICAgIHByaW50OiAobWVzc2FnZSkgLT5cbiAgICAgICAgaWYgbWVzc2FnZSAhPSBAY3VycmVudE1lc3NhZ2VcbiAgICAgICAgICAgIEBjdXJyZW50TWVzc2FnZSA9IG1lc3NhZ2VcbiAgICAgICAgICAgIEB0eXBlciA9IG5ldyBAbWFrZVR5cGVyKG1lc3NhZ2UpXG4gICAgICAgICAgICBtLnJlZHJhdygpXG5cbiAgICBnZXRUeXBpbmdNZXNzYWdlOiAtPiBpZiBAdHlwZXI/IHRoZW4gQHR5cGVyKCkgZWxzZSAnJ1xuXG4gICAgZ2V0Q3VycmVudE1lc3NhZ2U6IC0+IEBjdXJyZW50TWVzc2FnZVxuXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgICBjb250cm9sbGVyOiBjbGFzc1xuICAgICAgICBjb25zdHJ1Y3RvcjogLT5cblxuICAgICAgICAgICAgV2FsZVZzU2hhcmMoZW5naW5lKVxuICAgICAgICAgICAgZGlkTG9hZCA9IGVuZ2luZS5sb2FkKClcblxuICAgICAgICAgICAgQHZtID0ge31cbiAgICAgICAgICAgIEB2bS5jb21tYW5kID0gbS5wcm9wKCcnKVxuICAgICAgICAgICAgQHZtLnR5cGVyID0gbmV3IFRleHRUeXBlcigpXG5cbiAgICAgICAgICAgIGVuZ2luZS5saXN0ZW4gPT5cbiAgICAgICAgICAgICAgICBAdm0udHlwZXIucHJpbnQoZW5naW5lLmdldEN1cnJlbnRNZXNzYWdlKCkpXG4gICAgICAgICAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICAgICAgICAgIGVuZ2luZS5zYXZlKClcblxuICAgICAgICAgICAgaWYgZGlkTG9hZFxuICAgICAgICAgICAgICAgIGVuZ2luZS5kb0NvbW1hbmQoJ2xvb2snKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGVuZ2luZS5nb1RvU3RhcnQoKVxuXG4gICAgICAgIG9uQ29tbWFuZFN1Ym1pdDogKGUpID0+XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgIGVuZ2luZS5kb0NvbW1hbmQoQHZtLmNvbW1hbmQoKSlcbiAgICAgICAgICAgIEB2bS5jb21tYW5kKCcnKVxuXG4gICAgdmlldzogKGN0cmwpIC0+XG4gICAgICAgIFtcbiAgICAgICAgICAgIG0gJy5zaWRlYmFyJyxcbiAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMjYwcHgnXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcyMHB4J1xuICAgICAgICAgICAgICAgIG0gJ2gyJyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Ub3A6IDBcbiAgICAgICAgICAgICAgICAgICAgJ0ludmVudG9yeSdcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIGZvciBpdGVtTmFtZSwgc3RhdGUgb2YgZW5naW5lLmdldEludmVudG9yeSgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzdGF0ZSA9PSAnZ290dGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtTmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBzdGF0ZSA9PSAndXNlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICdwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0RGVjb3JhdGlvbjogJ2xpbmUtdGhyb3VnaCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbU5hbWVcbiAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uY2xpY2s6IC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnU2F2ZSBnYW1lIGRlbGV0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJydcbiAgICAgICAgICAgICAgICAgICAgICAgICdSZXN0YXJ0IGdhbWUnXG4gICAgICAgICAgICAgICAgXVxuXG4gICAgICAgICAgICBtICcuY29udGVudCcsXG4gICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAod2luZG93LmlubmVyV2lkdGggLSAzNjApICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMjBweCdcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZ1RvcDogMFxuICAgICAgICAgICAgICAgIG0gJ2gxJywgZW5naW5lLmdldEN1cnJlbnRSb29tTmFtZSgpXG4gICAgICAgICAgICAgICAgbSAncCcsIG0udHJ1c3QoY3RybC52bS50eXBlci5nZXRUeXBpbmdNZXNzYWdlKCkpXG5cbiAgICAgICAgICAgICAgICBpZiBlbmdpbmUuZ2V0Q3VycmVudFJvb21OYW1lKCkgPT0gJ0VuZCdcbiAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnZGl2JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAnaW1nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnL3NoYXJrLXNob3dlcmluZy5wbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdicidcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2JyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnaDMnLCAnRG8geW91IGV2ZW4gZmVlZGJhY2s/J1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnZGl2JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICdpZnJhbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6ICdodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9mb3Jtcy9kLzFkckhLc2ZFelNfekExN1lUZDdPYVdZaXMxUThKamYzM2ZyN0s2T2NSQm9rL3ZpZXdmb3JtP2VtYmVkZGVkPXRydWUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnNzYwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICc1MDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lYm9yZGVyOiAnMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luaGVpZ2h0OiAnMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2lud2lkdGg6ICcwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcycHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgZ3JleSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblJpZ2h0OiAnMjBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0xvYWRpbmcuLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAndGV4dGFyZWEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzUwMHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnRydXN0KGVuZ2luZS5wcmV2aW91c0NvbW1hbmRzLmpvaW4oJ1xcbicpKVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBtICdmb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uc3VibWl0OiBjdHJsLm9uQ29tbWFuZFN1Ym1pdFxuICAgICAgICAgICAgICAgICAgICAgICAgbSAnaW5wdXRbdHlwZT10ZXh0XScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdibG9jaydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNoYW5nZTogbS53aXRoQXR0cigndmFsdWUnLCBjdHJsLnZtLmNvbW1hbmQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGN0cmwudm0uY29tbWFuZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiAoZWxlbWVudCwgaXNJbml0aWFsaXplZCwgY29udGV4dCkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IGlzSW5pdGlhbGl6ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uW3R5cGU9c3VibWl0XScsICdEbydcbiAgICAgICAgXVxuIiwiXCJcIlwiXG5Db25kaXRpb25zOlxuICAgIEBtYXRjaGVzKHBhdHRlcm4pXG4gICAgQGhhc0l0ZW0oaXRlbSBuYW1lKVxuICAgIEBwZXJjZW50Q2hhbmNlKGNoYW5jZSBvdXQgb2YgMTAwKVxuICAgIEBmbGFnSXMoZmxhZyBuYW1lLCB2YWx1ZSlcblxuUmVzdWx0czpcbiAgICBAcHJpbnQodGV4dClcbiAgICBAZ29Ub1Jvb20ocm9vbSBuYW1lKVxuICAgIEBzZXRGbGFnKGZsYWcgbmFtZSwgdmFsdWUpXG5cIlwiXCJcblxubW9kdWxlLmV4cG9ydHMgPSAoZW5naW5lKSAtPlxuXG4gICAgZW5naW5lLnNldFVuaXZlcnNhbENvbW1hbmRzIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdkaWUnKVxuICAgICAgICAgICAgQHByaW50KCdXaGF0IGFyZSB5b3UgZG9pbmc/IFlvdSBhcmUgZGVhZCBub3cuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2luJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGRpZCBpdC4gWW91IHdpbi4gQnV5IHlvdXJzZWxmIGEgcGl6emEgYmVjYXVzZSB5b3UgYXJlIHNvIGNsZXZlci4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdpbnYnKSBvciBAbWF0Y2hlcygnaW52ZW50b3J5JylcbiAgICAgICAgICAgIGlmIE9iamVjdC5rZXlzKEBnZXRJbnZlbnRvcnkoKSkubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIEBwcmludCgnSXQgdGVsbHMgeW91IHdoYXQgaXMgaW52ZW50b3J5IHJpZ2h0IG92ZXIgdGhlcmUgb24gdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIHNjcmVlbi4gSXMgdHlwaW5nIHRoaXMgY29tbWFuZCByZWFsbHkgbmVjZXNzYXJ5PycpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3VyIGludmVudG9yeSBpcyBlbXB0eSB5b3UgYmlnIGR1bWIgYnV0dC4gU29ycnksIHRoYXQgd2FzIHJ1ZGUgSSBtZWFudCB0byBzYXkgeW91IGJ1dHQuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgIyBQaWNrIGEgcmFuZG9tIGRlZmF1bHQgcmVzcG9uc2VcbiAgICAgICAgICAgIGRlZmF1bHRSZXNwb25zZXMgPSBbXG4gICAgICAgICAgICAgICAgJ1doYXQgYXJlIHlvdSBldmVuIHRyeWluZyB0byBkbz8gIEp1c3Qgc3RvcC4nXG4gICAgICAgICAgICAgICAgJ0dvb2Qgb25lIG1hbi4nXG4gICAgICAgICAgICAgICAgJ1dob2EgdGhlcmUgRWFnZXIgTWNCZWF2ZXIhJ1xuICAgICAgICAgICAgXVxuICAgICAgICAgICAgQHByaW50KGRlZmF1bHRSZXNwb25zZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmRlZmF1bHRSZXNwb25zZXMubGVuZ3RoKV0pXG4gICAgICAgICAgICBcblxuICAgIGVuZ2luZS5zZXRBZnRlckNvbW1hbmQgLT5cbiAgICAgICAgaWYgKG5vdCBAZmxhZ0lzKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdlZ2cnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnZmxvd2VycycpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdjYW4gb2Ygc29kYScpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdzeXJ1cCcpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdtaWxrJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ21hcmdhcmluZScpKVxuICAgICAgICAgICAgQHByaW50KCdcIldlbGwsIEkgdGhpbmsgSSBoYXZlIGFsbCB0aGUgaW5ncmVkaWVudHMsXCIgeW91IHNheSB0byB5b3Vyc2VsZi4gXCJJIGp1c3QgbmVlZCBvbmUgb2YgdGhvc2UgcGxhY2VzIHdoZXJlIHlvdSBwdXQgdGhlbSB0b2dldGhlciBzbyBpdCB0dXJucyBpbnRvIHNvbWV0aGluZyB5b3UgY2FuIGVhdC4gWW91IGtub3csIG9uZSBvZiB0aG9zZS4uLmZvb2QgcHJlcGFyaW5nIHJvb21zLlwiJylcbiAgICAgICAgICAgIEBzZXRGbGFnKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYWxlIHZzIFNoYXJjOiBUaGUgQ29taWM6IFRoZSBJbnRlcmFjdGl2ZSBTb2Z0d2FyZSBUaXRsZSBGb3IgWW91ciBDb21wdXRlciBCb3gnLCAtPlxuICAgICAgICBAcHJpbnQoJ1RoYW5rIHlvdSBmb3IgYnV5aW5nIHRoaXMgZ2FtZSEgIFR5cGUgdGhpbmdzIGluIHRoZSBib3ggdG8gbWFrZSB0aGluZ3MgaGFwcGVuIScpXG4gICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ09jZWFuJylcblxuICAgIGVuZ2luZS5hZGRSb29tICdPY2VhbicsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGZpbmQgeW91cnNlbGYgaW4gdGhlIG9jZWFuLiBZb3UgYXJlIGEgc2hhcmsgYnkgdGhlIG5hbWUgb2YgU2hhcmMgYW5kIHlvdXIgJDIzIHNoYW1wb28gaXMgbWlzc2luZy4gWW91IHN1c3BlY3QgZm91bCBwbGF5LiBXZWxjb21lIHRvIHRoZSBvY2VhbiwgaXQgaXMgYSBiaWcgYmx1ZSB3ZXQgdGhpbmcgYW5kIGFsc28geW91ciBob21lLiBPYnZpb3VzIGV4aXRzIGFyZSBOb3J0aCB0byB5b3VyIGZyaWVuZCBXYWxlLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYWxlJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdIZXksIGl0IGlzIHlvdXIgZnJpZW5kLCBXYWxlLiBIZSBpcyBkb2luZyB0aGF0IHRoaW5nIHdoZXJlIGhlIGhhcyBoaXMgZXllcyBjbG9zZWQgYW5kIGFjdHMgbGlrZSBoZSBkaWQgbm90IG5vdGljZSB5b3VyIGFycml2YWwuIEhlIGlzIGtpbmQgb2YgYSBwcmljaywgYnV0IGFsc28geW91ciBmcmllbmQuIFdoYXQgY2FuIHlvdSBkbz8gT2J2aW91cyBleGl0cyBhcmUgT2NlYW4gdG8gdGhlIHNvdXRoLCBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoIHRvIHRoZSB3ZXN0LCBtb3JlIE9jZWFuIHRvIHRoZSBub3J0aCwgYW5kIEJpbGx5IE9jZWFuIHRvIHRoZSBlYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ2l2ZSBwYW5jYWtlcycpXG4gICAgICAgICAgICBpZiBAaGFzSXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJIZXkgV2FsZSxcIiB5b3UgY2FsbCBvdXQgYXMgaW50cnVzaXZlbHkgYXMgcG9zc2libGUsIFwiSSBnb3QgeW91ci0tXCIgQmVmb3JlIHlvdSBjb3VsZCBmaW5pc2ggeW91ciBzZW50ZW5jZSwgeW91ciBibHViYmVyeSBmcmllbmQgaGFzIHNuYXRjaGVkIHRoZSBwbGF0ZSBhd2F5IGFuZCwgaW4gYSBtb3N0IHVuZGlnbmlmaWVkIG1hbm5lciwgYmVnaW5zIG1vd2luZyB0aHJvdWdoIHRoZSBmcmllZCBkaXNjcyB5b3Ugc28gYXJ0ZnVsbHkgcHJlcGFyZWQuIFwiU291bCBzZWFyY2hpbmcgdGFrZXMgYSBsb3Qgb2YgZW5lcmd5LFwiIGhlIGV4cGxhaW5zIGJldHdlZW4gYml0ZXMuIFwiSSBoYXZlblxcJ3QgZWF0ZW4gYW55dGhpbmcgYWxsIGRheS5cIiBPbmNlIGZpbmlzaGVkLCBXYWxlIHN0cmFpZ2h0ZW5zIGhpbXNlbGYgb3V0LCBsb29raW5nIGEgbWl0ZSBlbWJhcnJhc3NlZCBmb3IgdGhlIHNhdmFnZSBkaXNwbGF5IGhlIGp1c3QgcHV0IG9uLiBcIldoYXQgd2FzIGl0IHlvdSBuZWVkZWQ/XCIgXCJPaCBXYWxlLCBpdFxcJ3MgdGVycmlibGUuIEkgdGhpbmsgbXkgJDIzIHNoYW1wb28gd2FzIHN0b2xlbiBhbmQgdGhlIGdob3N0IG9mIG15IG5vdCByZWFsbHkgZGVhZCBmcmllbmQgc2F5cyB0aGUgZmF0ZSBvZiB0aGUgd29ybGQgaGFuZ3MgaW4gdGhlIGJhbGFuY2UuXCIgXCJJIHNlZSxcIiBzYXlzIFdhbGUsIGhpcyB2b2ljZSBhbmQgbWFubmVyIHJlbWFpbmluZyB1bmNoYW5nZWQgZGVzcGl0ZSB0aGUgdGhyZWF0IG9mIHRoZSB3b3JsZCB1bmJhbGFuY2luZy4gXCJTaGFyYywgSSBmZWFyIHRoZSB3b3JzdC4gWW91IG11c3Qgc3VtbW9uIHRoZSBldGhlcmVhbCBkb29yLlwiIFwiTm8sIFdhbGUsXCIgeW91IHNheSwgXCJ5b3UgbWFkZSBtZSBzd2VhciBhIHRob3VzYW5kIHZvd3MgbmV2ZXIgdG8gYnJpbmcgdGhhdCBjdXJzZWQgcmVsaWMgYmFjayBhbW9uZyB1cy5cIiBcIkkga25vdyB3aGF0IEkgc2FpZCwgYnV0IEkgYWxzbyBrbmV3IHRoZXJlIHdvdWxkIGNvbWUgYSB0aW1lIHdoZW4gd2Ugd291bGQgaGF2ZSBubyBvdGhlciBjaG9pY2UuXCIgIFlvdSBzaG91bGQgcHJvYmFibHkgc3VtbW9uIHRoZSBkb29yLicpXG4gICAgICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgICAgICBAc2V0RmxhZygnZ2l2ZW5fcGFuY2FrZXMnLCB0cnVlKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N1bW1vbiBkb29yJykgYW5kIEBmbGFnSXMoJ2dpdmVuX3BhbmNha2VzJywgdHJ1ZSlcbiAgICAgICAgICAgIEBwcmludCgnWW91LCBmaW5hbGx5IGNvbnZpbmNlZCBvZiB5b3VyIHVyZ2VuY3kgYW5kIHV0dGVyIGRlc3BlcmF0aW9uLCBwZXJmb3JtIHNvbWUgaW50cmljYXRlIHJpdGVzIGFuZCBpbmNhbnRhdGlvbnMgdGhhdCB3b3VsZCBiZSByZWFsbHkgY29vbCBpZiB5b3UgY291bGQgc2VlIHRoZW0sIGJ1dCBJIGd1ZXNzIHlvdSB3aWxsIGp1c3QgaGF2ZSB0byB1c2UgeW91ciBpbWFnaW5hdGlvbnMuIFRleHQgb25seSBmb29scyEgIFRoZSBldGhlcmVhbCBkb29yIHN0YW5kcyBvcGVuIGJlZm9yZSB5b3UuJylcbiAgICAgICAgICAgIEBzZXRGbGFnKCdzdW1tb25lZF9kb29yJywgdHJ1ZSlcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlbnRlciBkb29yJykgYW5kIEBmbGFnSXMoJ3N1bW1vbmVkX2Rvb3InLCB0cnVlKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdUaGUgRXRoZXJlYWwgUmVhbG0nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsgd2FsZScpXG4gICAgICAgICAgICBpZiBAZmxhZ0lzKCd0YWxrZWRfdG9fd2FsZScsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCcoR2V0IHJlYWR5IHRvIGRvIHNvbWUgcmVhZGluZykgV2FsZSBpcyB0cnlpbmcgdG8gbWVkaXRhdGUgb3Igc29tZXRoaW5nIHByZXRlbnRpb3VzIHRoYXQgeW91IGRvblxcJ3QgY2FyZSBhYm91dC4gWW91IGhhdmUgc29tZXRoaW5nIGltcG9ydGFudCEgXCJXYWxlXCIgeW91IHNob3V0LCBcIkkgbmVlZCB5b3VyIGhlbHAhIFRoZSBjb25kaXRpb24gb2YgbXkgbWFnbmlmaWNlbnQgc2NhbHAgaXMgYXQgc3Rha2UuXCIgV2FsZSBzaWdocyBhIGhlYXZ5LCBsYWJvcmVkIHNpZ2guIFwiU2hhcmMsIHlvdSBoYXZlIGRpc3R1cmJlZCBteSBqb3VybmV5IHRvIG15IGlubmVybW9zdCBiZWluZy4gQmVmb3JlIEkgY2FuIGhlbHAgeW91LCByZXBhcmF0aW9ucyBtdXN0IGJlIG1hZGUuIFBhbmNha2VzOiB3aG9sZSB3aGVhdCwgd2l0aCBhbGwgbmF0dXJhbCBtYXBsZSBzeXJ1cC4gTm93IGxlYXZlIG1lIGFzIEkgcGVlbCBiYWNrIHRoZSBsYXllcnMgb2YgdGhlIHNlbGYgYW5kIHBvbmRlciB0aGUgbGVzc29uIG9mIHRoZSBjaGVycnkgYmxvc3NvbS4nKVxuICAgICAgICAgICAgICAgIEBzZXRGbGFnKCd0YWxrZWRfdG9fd2FsZScsIHRydWUpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIkkgY2FuIG5vdCBsaWZ0IGEgZmluIGZvciB5b3UgdW50aWwgeW91IGhhdmUgYnJvdWdodCBhIGhlYWx0aHkgc2VydmluZyBvZiB3aG9sZSB3aGVhdCBwYW5jYWtlcyB3aXRoIGFsbCBuYXR1cmFsIG1hcGxlIHN5cnVwIGxpa2UgSSBzYWlkIGJlZm9yZS5cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2V0dGVyIE9jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0N1dHRsZWZpc2gnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQmlsbHkgT2NlYW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2V0dGVyIE9jZWFuJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIGlzIGp1c3Qgc29tZSBvY2VhbiB5b3UgZm91bmQuIEl0IGRvZXMgZmVlbCBhIGxpdHRsZSBiaXQgd2V0dGVyIHRoYW4gdGhlIHJlc3Qgb2YgdGhlIG9jZWFuIHRob3VnaC4gQWxzbywgZGlkIGl0IGp1c3QgZ2V0IHdhcm1lcj8gT2J2aW91cyBleGl0cyBhcmUgYSBnYXJkZW4gdG8gdGhlIHdlc3QsIFdhbGUgaW4gdGhlIHNvdXRoLCBhbmQgYSBnYW1lc2hvdyBlYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0N1dHRsZWZpc2gnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnTG9vaywgdGhlcmUgYmUgc29tZSBjdXR0bGVmaXNoLCB0aG91Z2ggdGhleSBkbyBub3QgbG9vayB0b28gY3VkZGx5LiBTdGVhayBhbmQgU2hha2UgaXMgdG8gdGhlIHdlc3QsIEFjaHRpcHVzXFwncyBnYXJkZW4gdG8gdGhlIG5vcnRoLCBhbmQgV2FsZSB0byB0aGUgZWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhlcmUgdXNlZCB0byBiZSBjdXR0bGVmaXNoIGhlcmUgYnV0IHlvdSBzY2FyZWQgdGhlbSBhd2F5IHdpdGggeW91ciBhZ2dyZXNzaXZlIGFmZmVjdGlvbnMuIEtlZXAgdGhhdCBzdHVmZiBpbnNpZGUgbWFuIScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2N1ZGRsZSBjdXR0bGVmaXNoJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3UgYXJlIGZlZWxpbmcgYWZmZWN0aW9uYXRlIHRvZGF5IGFuZCB5b3UganVzdCBnb3QgZHVtcGVkIHNvIHdoeSBub3Q/IFlvdSBqdW1wIHNvbWUgb2YgdGhlIGN1dHRsZWZpc2ggYW5kIHN0YXJ0IHNudWdnbGluZyBhbmQgY3VkZGxpbmcuIFRoZSBjdXR0bGVmaXNoIGFyZSBub3QgYW11c2VkIHRob3VnaCwgYW5kIHNheSB0aGV5IGFyZSB0aXJlZCBvZiBmaXNoIG1ha2luZyB0aGF0IG1pc3Rha2UuIFRoZXkgYWxsIHN3aW0gYXdheSBleGNlcHQgZm9yIG9uZSB0aGF0IGhhcyBhdHRhY2hlZCBpdHMgc3Vja2VycyB0byB5b3VyIG1pZCByZWdpb24uIFlvdSBkb25cXCd0IHNlZW0gdG8gbWluZC4nKVxuICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdjdXR0bGVmaXNoJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZXkgYXJlIGN1ZGRsZWQgb3V0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0JpbGx5IE9jZWFuJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9ek5nY1lHZ3RmOE0nLCAnX2JsYW5rJylcbiAgICAgICAgICAgIEBwcmludCgnU3VkZGVubHksIGFwcGVhcmluZyBiZWZvcmUgeW91ciBleWVzIGlzIHNpbmdlci1zb25nd3JpdGVyIGFuZCBmb3JtZXIgQ2FyaWJiZWFuIGtpbmc6IEJpbGx5IE9jZWFuLiBBbHNvIEJpbGx5IE9jZWFuXFwncyBjYXIuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gV2FsZSBhbmQgbm9ydGggdG8gc29tZSBraW5kIG9mIGdhbWUgc2hvdy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJylcbiAgICAgICAgICAgIEBwcmludCgnSGUgd2FudHMgeW91IHRvIGdldCBpbnRvIGhpcyBjYXIgYW5kIGRyaXZlIGhpbSB0byB0aGUgaG9zcGl0YWwuIEhlIGp1c3QgZHJvdmUgdGhyb3VnaCB0aGUgY2FyIHdhc2ggd2l0aCB0aGUgdG9wIGRvd24gYWZ0ZXIgZHJvcHBpbmcgc29tZSBhY2lkLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2hvc3BpdGFsJylcbiAgICAgICAgICAgIEBwcmludCgnU3VyZSwgd2h5IG5vdD8gWW91IGdldCBpbiB0aGUgZHJpdmVyXFwncyBzZWF0IGFuZCBmaW5kIHlvdXIgd2F5IHRvIHRoZSBuZWFyZXN0IG1lZGljYWwgdHJlYXRtZW50IGNlbnRlci4gQXMgdGhhbmtzLCBNci4gT2NlYW4gcHVsbHMgYW4gZWdnIG91dCBmcm9tIGhpcyBnbG92ZSBib3guIFlvdSBhY2NlcHQgYW5kIHN3aW0gYXdheSBhcyBmYXN0IGFzIHBvc3NpYmxlLiBHb29kLCBJIHJhbiBvdXQgb2Ygam9rZXMgZm9yIHRoYXQgZmFzdC4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2VnZycpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2NhbGwgY29wcycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZSBwb2xpY2UgY29tZSBhbmQgYXJyZXN0IEJpbGx5IE9jZWFuIG9uIGNoYXJnZSBvZiBiZWluZyBjb21wbGV0ZWx5IGlycmVsZXZhbnQgdG8gdGhpcyBnYW1lLiBZb3UgV2luISBIaWdoIFNjb3JlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdBY2h0aXB1c1xcJ3MgR2FyZGVuJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2sgYWNodGlwdXMnKVxuICAgICAgICAgICAgQHByaW50KCdJdFxcJ3MgQWNodGlwdXMuIEhlIGlzIHB1bGxpbmcgb3V0IHRoZSBzZWF3ZWVkcyBmcm9tIGhpcyBzZWEgY3VjdW1iZXIgYmVkLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZ2FyZGVuJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHNlZSB3YXRlcm1lbG9uLCB3YXRlciBjaGVzdG51dHMsIGFzc29ydGVkIGZsb3dlcnMsIHNlYSBjdWN1bWJlcnMgYW5kIHN0cmF3YmVycmllcy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQWNodGlwdXMgaXMgd29ya2luZyBhbW9uZyBoaXMgZmxvd2VycyBhbmQgc2hydWJzLiBIZSBzZWVzIHlvdSBhbmQgb3BlbnMgdGhlIGdhdGUgZm9yIHlvdS4gT2J2aW91cyBleGl0cyBhcmUgbm9ydGggdG8gV2F0ZXIgV29ybGQsIGVhc3QgdG8gc29tZSBPY2VhbiBhbmQgc291dGggdG8gYSBzY2hvb2wgb2YgQ3V0dGxlZmlzaC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJylcbiAgICAgICAgICAgIEBwcmludCgnXCJUaGlzIGlzIHF1aXRlIHRoZSB1bS4uLm9jZWFuIGhpZGVhd2F5IHlvdSBoYXZlIGhlcmUsXCIgeW91IHNheS4gXCJZZXMsXCIgaGUgc2F5cywgXCJJIGNhbiBzZWUgeW91IGhhdmUgY29tZSBhIGxvbmcgd2F5IHRvIGdldCBoZXJlLCBidXQgSSBhbSBnbGFkIHlvdSBoYXZlIGZvdW5kIHJlZnVnZSBvbiBteSBncm91bmRzLiBJZiB5b3Ugc2VlIGFueXRoaW5nIHlvdSBsaWtlIGluIG15IHBsb3Qgd2UgY291bGQgbWFrZSBhIGRlYWwgcGVyaGFwcy5cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSB3YXRlcm1lbG9uJylcbiAgICAgICAgICAgIEBwcmludCgnXCJJIHdpbGwgZ2l2ZSB5b3UgdGhlIHdhdGVybWVsb24gaW4gZXhjaGFuZ2UgZm9yIGFuIGljZSBjcmVhbSBzdW5kYWUuXCInKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIG51dHMnKSBvciBAbWF0Y2hlcygndGFrZSBudXQnKSBvciBAbWF0Y2hlcygndGFrZSBjaGVzdG51dHMnKSBvciBAbWF0Y2hlcygndGFrZSBjaGVzdG51dCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiSSB3aWxsIGdpdmUgeW91IHNvbWUgd2F0ZXIgY2hlc3RudXRzIGlmIHlvdSBjYW4gZmluZCBtZSBhIHB1cmUgYnJlZCBHZXJtYW4gU2hlcGFyZC5cIicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgY3VjdW1iZXInKSBvciBAbWF0Y2hlcygndGFrZSBjdWN1bWJlcnMnKVxuICAgICAgICAgICAgQHByaW50KCdcIllvdSBjYW4gaGF2ZSB0aGUgc2VhIGN1Y3VtYmVycyBpbiBleGNoYW5nZSBmb3IgYSBmdWxsIHBhcmRvbiBmb3IgdGhlc2UgbWFqb3IgZmVsb255IGNoYXJnZXMgdGhhdCBhcmUgc3RpbGwgcGVuZGluZy5cIicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2Ugc3RyYXdiZXJyaWVzJylcbiAgICAgICAgICAgIEBwcmludCgnXCJPaCwgYWN0dWFsbHkgdGhvc2Ugc3RyYXdiZXJyeSBmaWVsZHMgYXJlblxcJ3QgZXZlbiByZWFsLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGZsb3dlcnMnKSBvciBAbWF0Y2hlcygndGFrZSBmbG93ZXInKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ2dpdmVuX3VtYnJlbGxhJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSSBjYW4gc2VlIHlvdSBsaWtlIHRoZSBmbG93ZXJzLiBJIHdpbGwgbGV0IHlvdSBoYXZlIHRoZW0gaWYgeW91IGNhbiBmaW5kIHNvbWV0aGluZyB0byBrZWVwIGl0IGZyb20gZ2V0dGluZyBzbyBob3QgaGVyZS4gSSB3b3VsZCBiZSBhYmxlIHRvIGRvIHR3aWNlIGFzIG11Y2ggd29yayBpZiBpdCB3ZXJlIGEgYml0IGNvb2xlci4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJZb3UgaGF2ZSBncmVhdCB0YXN0ZS4gVGhlc2UgZmxvd2VycyBhcmUgcmVhbGx5IHZlcnNhdGlsZSBhbmQgd2lsbCBiZSBnb29kIGp1c3QgYWJvdXQgYW55d2hlcmUuXCInKVxuICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdmbG93ZXJzJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnaXZlIHVtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnXCJUaGlzIHdpbGwgYmUgcGVyZmVjdCBmb3IgYmxvY2tpbmcgb3V0IHRoYXQgc3Vu4oCZcyBoYXJzaCByYXlzLiBUaGFua3MhXCInKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3VtYnJlbGxhJylcbiAgICAgICAgICAgIEBzZXRGbGFnKCdnaXZlbl91bWJyZWxsYScsIHRydWUpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCcpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXZXR0ZXIgT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0N1dHRsZWZpc2gnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgcnVpbnMgb2YgeW91ciBvbGQgd29yayBwbGFjZS4gVGhpcyBwbGFjZSBoYXMgc2VlbiBiZXR0ZXIgZGF5cy4gWW91ciBtaW5kIGlzIGZsb29kZWQgd2l0aCBtZW1vcmllcyBvZiBmbG9hdGluZyBpbiBmcm9udCBvZiB0aGUgb2xkIGdyaWxsIGFuZCBjb21pbmcgdXAgd2l0aCBuZXcgcmVjaXBlcyB0byB0cnkgd2hlbiB5b3VyIG1hbmFnZXIgaGFkIGhpcyBiYWNrIHR1cm5lZC4gVGhlbiBzb21lb25lIHNhaWQgXCJFdmVyIHRyaWVkIGFuIE0tODAgYnVyZ2VyPyBJIGhhdmUgZW5vdWdoIGZvciBldmVyeW9uZS5cIiBUaGUgd29yZHMgZWNobyBpbiB5b3VyIG1pbmQgbGlrZSBhIHBoYW50b20gd2hpc3BlciBvZiBhZ2VzIHBhc3QuIEl0XFwncyB0aGUgcnVpbnMgb2YgdGhlIG9sZCBTdGVhayBhbmQgU2hha2UgeW91IHVzZWQgdG8gd29yayBhdCB1bnRpbCB5b3VyIGZyaWVuZCBibGV3IGl0IHVwLiBUaGUgdGF0dGVyZWQgcmVtbmFudHMgb2YgYSByZWQgYW5kIHdoaXRlIGF3bmluZyBmbHV0dGVycyBpbiB0aGUgd2luZCBhcyBpZiB0byBzdXJyZW5kZXIgdG8gYW4gZW5lbXkuIFdoYXQgaXMgbGVmdCBvZiBhIGRvb3IgaGFuZ3Mgb24gYSBzaW5nbGUgaGluZ2UgdG8gdGhlIHdlc3QuIEN1dHRsZWZpc2ggc3RvbXBpbmcgZ3JvdW5kcyBsaWUgZWFzdC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0Jykgb3IgQG1hdGNoZXMoJ29wZW4gZG9vcicpIG9yIEBtYXRjaGVzKCdlbnRlcicpIG9yIEBtYXRjaGVzKCdpbicpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcbiAgICAgICAgICAgIFxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0FzIHlvdSBhcHByb2FjaCwgdGhlIGRvb3IgZmFsbHMgY2xlYW4gb2ZmIGFzIGlmIHRvIHdhcm4geW91IGFnYWluc3QgZW50cnkuIE5ldmVyIGJlaW5nIG9uZSBmb3Igb21lbnMsIHlvdSBpZ25vcmUgaXQuIEluc2lkZSB5b3UgZGlzY292ZXIgdGhpbmdzIG11Y2ggYXMgeW91IHJlbWVtYmVyIHRoZW0uIFRoYXQgaXMsIGlmIHRoZXkgaGFkIGJlZW4gbWF1bGVkIGJ5IGEgYmVhciB3aXRoIGJsZW5kZXJzIGZvciBoYW5kcyB3aG8gcHJvY2VlZGVkIHRvIHNldCBvZmYgYSBzZXJpZXMgb2YgcGxhc3RpYyBleHBsb3NpdmVzLiBUbyB0aGUgc291dGggdGhlcmUgYXJlIHNvbWUgdGFibGVzIGFuZCBjaGFpcnMsIG5vcnRoIGxpZXMgdGhlIGtpdGNoZW4sIGFuZCB3ZXN0IGEgc29kYSBmb3VudGFpbi4gVGhlIG91dGRvb3JzIGlzIGVhc3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRGluaW5nIEFyZWEpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU29kYSBGb3VudGFpbiknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKERpbmluZyBBcmVhKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQSBkaWxhcGlkYXRlZCBkaW5pbmcgYXJlYSBsaWVzIGJlZm9yZSB5b3UuIEl0IGlzIGNvbXBsZXRlbHkgdW5yZW1hcmthYmxlLiBUaGVyZSBpcyBub3doZXJlIHRvIGdvIGJlc2lkZXMgbm9ydGggdG8gdGhlIHdheSB5b3UgY2FtZS4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbiknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1dlbGNvbWUgdG8gdGhlIGtpdGNoZW4uIFNpbmNlIHRoZSB3YWxscyBoYXZlIGFsbCBiZWVuIGJsb3duIGF3YXkgb3IgZGlzc29sdmVkLCB0aGUgb25seSB0aGluZyB0aGF0IHNlcGFyYXRlcyBpdCBmcm9tIHRoZSByZXN0IG9mIHRoZSBwbGFjZSBpcyB0aGUgb3ZlbiBhbmQgcmFuZ2UuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBvdmVuJykgb3IgQG1hdGNoZXMoJ29wZW4gb3ZlbicpXG4gICAgICAgICAgICBAcHJpbnQoJ0NoZWNrIGl0IG91dCwgaXRcXCdzIHlvdXIgZmF2b3JpdGUgcG9wLCBhIENoZXJyeSBPcmFuZ2UgU25venpiZXJyeSBMaW1lIFBhc3Npb25mcnVpdCBWYW5pbGxhIENyb2FrIGluIHRoZSBvdmVuLiBXaG8gZXZlciB0aG91Z2h0IG9mIGJha2luZyBhIGNhbiBvZiBzb2RhPycpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY2FuIG9mIHNvZGEnKVxuXG4gICAgICAgIGVsc2UgaWYgQGZsYWdJcygnaGF2ZV9hbGxfaXRlbXMnLCB0cnVlKVxuICAgICAgICAgICAgaWYgQG1hdGNoZXMoJ21ha2UgcGFuY2FrZXMnKVxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiV2hlcmUgZG8gSSBzdGFydD9cIiB5b3Ugd29uZGVyIG91dCBsb3VkLiBJZiBvbmx5IHRoZXJlIHdlcmUgd3JpdHRlbiBzZXJpZXMgb2YgaW5zdHJ1Y3Rpb25zIGd1aWRpbmcgeW91IHRocm91Z2guIFdoZXJlIHdvdWxkIHlvdSBmaW5kIHNvbWV0aGluZyBsaWtlIHRoYXQ/JylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3VcXCdyZSBwb25kZXJpbmcgdGhpcyB3aGVuIGEgZHJhZnQgY29tZXMgb3ZlciB5b3UuIFRoZSBsaWdodHMgZmxpY2tlciBvbiBhbmQgb2ZmLiBZb3Ugc2Vuc2UgYSBteXN0ZXJpb3VzIHByZXNlbmNlLiBUaGUgZ2hvc3Qgb2YgeW91ciBvbGQgZnJpZW5kIENyZWdnbGVzIGFwcGVhcnMgYmVmb3JlIHlvdS4gQXBwYXJlbnRseSBoZSBpcyBoYXVudGluZyB0aGUgU3RlYWsgYW5kIFNoYWtlIG5vdyBhbmQgeW91XFwncmUgYWxsIGxpa2UgXCJDcmVnZ2xlcywgZGlkblxcJ3Qgd2UganVzdCBoYW5nIG91dCB0aGUgb3RoZXIgZGF5PyBIb3cgYXJlIHlvdSBhIGdob3N0IGFscmVhZHk/XCInKVxuICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnPHNwYW4gY2xhc3M9XCJjcmVlcHlcIj5cIk5ldmVyIHlvdSBtaW5kIHRoYXQgbm93XCI8L3NwYW4+IGhlIHNheXMgaW4gaGlzIGNyZWVweSBuZXJkIHZvaWNlLiA8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiU2hhcmMsIGlmIHlvdSBob3BlIHRvIHNhdmUgdGhlIHdvcmxkIGZyb20gY2VydGFpbiBkb29tLCB5b3UgbXVzdCBzdWNjZWVkIGluIG1ha2luZyB0aGVzZSBwYW5jYWtlcy4gVXNlIHRoaXMgYW5jaWVudCByZWNpcGUgaGFuZGVkIGRvd24gZnJvbSB0aGUgYW5jaWVudHMgdG8gYWlkIHlvdS5cIjwvc3Bhbj4gQW4gb2xkLCBiYXR0ZXJlZCBwaWVjZSBvZiBwYXBlciBmbG9hdHMgZG93biBsYW5kaW5nIGJlZm9yZSB5b3UgXCJTd2VldCBNZWVtYXdzIFN3ZWV0eSBTd2VldCBGbGFwamFja3NcIiBpdCByZWFkcy4gPHNwYW4gY2xhc3M9XCJjcmVlcHlcIj5cIk5vdyBteSB3b3JrIGlzIGRvbmUgYW5kIEkgY2FuIGFzY2VuZCB0byBteSBzdGVwbW9tXFwncyBob3VzZSBmb3IgZ3JpbGxlZCBjaGVlc2Ugc2FuZHdpY2hlcyBhbmQgY2hvY29sYXRlIG1pbGsuXCI8L3NwYW4+JylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHJlYWQgdGhlIHJlY2lwZS4gSXQgaXMgYWxsIGluIHJpZGRsZXMuIFlvdSBob3BlIHlvdSBhcmUgdXAgdG8gdGhlIHRhc2suJylcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYW4gZW1wdHkgYm93bCBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGFuIGVtcHR5IGJvd2wgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0luIGFuIHVybiB0YWtlIGJ1dCBub3QgY2h1cm4gaXRlbXMgdHdvIG5vdCBsaWtlIGdvby4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb2RhIGZsb3dlcicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnY2FuIG9mIHNvZGEnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHBvd2RlciBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91ciBwb3Rpb24gaXMgZHJ5LiBUaGlzIHdpbGxzdCBub3QgZmx5LiBXaGF0XFwncyBuZXh0IG11c3QgYmUgZHVtcGVkLCBwb3VyZWQgYW5kIGNyYWNrZWQgZm9yIGEgcHJvcGVyIGZsYXBqYWNrLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21pbGsgZWdnIGJ1dHRlcicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnZWdnJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdtaWxrJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdtYXJnYXJpbmUnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBzbGlnaHRseSBtb3JlIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBzbGlnaHRseSBtb3JlIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdDdXR0aW5nIGFuZCBzY29vcGluZyBzaGFsbCBoYXZlIHRoZWlyIGRheSwgYnV0IGEgZm9yIGEgZmluZSBmbHVmZnkgYmF0dGVyIHRoZXJlIGJlIGJ1dCBvbmUgd2F5LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N0aXInKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBtaXhlZCBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NoYWtlJylcbiAgICAgICAgICAgIEBwcmludCgnRHVkZSwgd2hvIGRvIHlvdSB0aGluayB5b3UgYXJlLCBKYW1lcyBCb25kPyAgVGhpcyBiYXR0ZXIgbmVlZHMgdG8gYmUgc3RpcnJlZCwgbm90IHNoYWtlbi4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIG1peGVkIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdTZXQgdGhlIGdyaWRkbGUgb3Igc3RvdmUgdG8gbWVkaXVtIGhlYXQuIEFmdGVyIGl0IGlzIHdhcm1lZCwgZHJvcCBiYXR0ZXIgYSBxdWFydGVyIGN1cCBhdCBhIHRpbWUgYW5kIHR1cm5pbmcgb25jZSB1bnRpbCBidWJibGVzIGFwcGVhci4gXCJXZWxsIHRoYXQgc2VlbXMgcHJldHR5IGNsZWFyLiBJIHRoaW5rIEkgY2FuIGRvIHRoYXQgb24gbXkgb3duLlwiJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggcGxhdGUgb2YgZHJ5IHBhbmNha2VzIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggcGxhdGUgb2YgZHJ5IHBhbmNha2VzIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUZW4gbWludXRlcyBsYXRlciB0aGUgcGFuY2FrZXMgYXJlIGZpbmlzaGVkLCBidXQgc29tZXRoaW5nIGlzIG1pc3NpbmcuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3lydXAnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3N5cnVwJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGdvdCBwYW5jYWtlcyEgIEhvdCBkYW5nLicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbiknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTb2RhIEZvdW50YWluKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHNlZSB0aGF0IHRoZSBzb2RhIGZvdW50YWluIGhhcyBzb21laG93IHJlbWFpbmVkIGxhcmdlbHkgdW5kYW1hZ2VkLiBZb3UgdGhpbmsgYmFjayB0byB0aGUgZGF5cyB3aGVuIHlvdSB3b3VsZCBzbmVhayBvdXQgYmFncyBvZiBwbGFpbiBzeXJ1cCB0byBkcmluayBhbmQgdGhlIGZyZWFraXNoIHdha2luZyBkcmVhbXMgaXQgd291bGQgaW5kdWNlIGluIHlvdS4gWW91IHdvbmRlciBpZiB0aGVyZSBpcyBhbnkgc3RpbGwgaW4gdGhlcmUuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmb3VudGFpbicpIG9yIEBtYXRjaGVzKCdvcGVuIGZvdW50YWluJykgb3IgQG1hdGNoZXMoJ2xvb2sgc29kYScpIG9yIEBtYXRjaGVzKCdvcGVuIHNvZGEnKVxuICAgICAgICAgICAgQHByaW50KCdBdmFzdCwgYSBoaWRkZW4gdHJlYXN1cmUgdHJvdmUgb2Ygc3VnYXJ5IHdvbmRlciB0aGF0IGhhcyBsYWluIGRvcm1hbnQgYWxsIHRoZXNlIHllYXJzISBZb3UgdHJlbWJsZSBhdCB0aGUgYmVhdXR5IG9mIHRoZSBzaWdodCBiZWZvcmUgeW91LiBTbyBtYW55IGJhZ3MgYW5kIHlldCB5b3VyIG1hZ2ljIGhhbW1lcnNwYWNlIHNhdGNoZWwgd2lsbCBvbmx5IGFsbG93IGZvciBvbmUuIFRoZXJlXFwncyBTcHJpdHosIFByb2Zlc3NvciBHaW5nZXIsIENhY3R1cyBMYWdlciwgYW5kIE1zLiBTaGltIFNoYW1cXCdzIE1hcGxlIFNvZGEuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIG1hcGxlJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGZpbmQgaXQgc2hvY2tpbmcgdGhhdCB5b3UgYXJlIHRoZSBmaXJzdCByYWlkZXIgb2YgdGhpcyBzb2RhIHRvbWIuIEJ1dCB0aGVuIGFnYWluLCB5b3UgaGF2ZSBhbHdheXMgc2FpZCBwZW9wbGUgZG9uXFwndCBrbm93IHRoZSB2YWx1ZSBvZiBhIGJhZyBvZiBsaXF1aWQgc3VnYXIuIFlvdSB0YWtlIG9mZiB3aXRoIGl0IHVuZGVyIGNvdmVyIG9mIGRhcmtuZXNzLicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnc3lydXAnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCcsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGp1c3Qgd2Fsa2VkIG9udG8gdGhlIHNldCBvZiB0aGUgd2lsZGx5IHBvcHVsYXIgZ2FtZSBzaG93LCBcIlNlYWwgb3IgTm8gU2VhbCFcIiBXaGVyZSBmbGFtYm95YW50IGNvbnRlc3RhbnRzIGZsYWlsIGFyb3VuZCBhbmQgc2hvdXQgd2hpbGUgdHJ5aW5nIHRvIGFycml2ZSBhdCB0aGUgYW5zd2VyIHRvIHRoYXQgYWdlIG9sZCBxdWVzdGlvbi4uLlNFQUwgT1IgTk8gU0VBTD8gVG8gdGhlIGVhc3QgaXMgYmFja3N0YWdlLCBub3J0aCB3aWxsIHRha2UgeW91IHRvIHRoZSBkcmVzc2luZyByb29tLCB3ZXN0IG9yIHNvdXRoIHdpbGwgdGFrZSB5b3UgYmFjayB3aGVyZXZlciB5b3UgY2FtZSBmcm9tLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20pJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXZXR0ZXIgT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0JpbGx5IE9jZWFuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSknLCAtPlxuICAgICAgICBzdGVwMSA9ICdMZXRcXCdzIHN0YXJ0IHdpdGggaGVhZGdlYXIuIFlvdSBzZWUgYSBjb3dib3kgaGF0LCBhIHJhaW5ib3cgd2lnLCBhIG1vdG9yY3ljbGUgaGVsbWV0LCBhbmQgYSBzdG92ZXBpcGUgaGF0LidcbiAgICAgICAgc3RlcDIgPSAnTm93IHNlbGVjdCBhIHNldCBvZiBjbG90aGVzLiBZb3Ugc2VlIGEgbGVhdGhlciBqYWNrZXQsIGEgY2xvd24gc3VpdCwgYW4gb2xkdGltZXkgc3VpdCB3aXRoIG9uZSBvZiB0aG9zZSBDb2xvbmVsIFNhbmRlcnMgdGllcywgYW5kIGEgY293IHByaW50IHZlc3QuJ1xuICAgICAgICBzdGVwMyA9ICdBY2Nlc3Nvcml6ZSEgUGljayBmcm9tIGEgZmFrZSBiZWFyZCwgYSBndW4gYmVsdCwgYSBtZXRhbCBjaGFpbiwgYW5kIGEgcnViYmVyIGNoaWNrZW4uJ1xuICAgICAgICBkb25lID0gJ1lvdSBsb29rIGFic29sdXRlbHkgaG9ycmlibGUhIE9yIGFtYXppbmcsIGRlcGVuZGluZyBvbiB5b3VyIHBlcnNwZWN0aXZlLiBCdXQgdGhlIHRydWUganVkZ2Ugd2lsbCBiZSB0aGUgZ2FtZSBzaG93IG1hbmFnZXIuJ1xuXG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBwbGFjZSBpcyBncmVhdCEgSXQgd291bGQgYmUgZWFzeSB0byBjb2JibGUgdG9nZXRoZXIgYSBjb3N0dW1lIHRvIGdldCBvbiB0aGF0IHNob3cuIExldHMgc2VlIHdoYXQgd2UgY2FuIGZpbmQuIE9idmlvdXMgZXhpdHMgYXJlIHNvdXRoIHRvIHRoZSBzaG93IGVudHJhbmNlLicpXG4gICAgICAgIFxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY29zdHVtZScpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDEpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBjb3dib3kgaGF0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjb3dib3kgaGF0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMilcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSByYWluYm93IHdpZycpXG4gICAgICAgICAgICBAZ2V0SXRlbSgncmFpbmJvdyB3aWcnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAyKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIG1vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdtb3RvcmN5Y2xlIGhlbG1ldCcpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDIpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2Ugc3RvdmVwaXBlIGhhdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnc3RvdmVwaXBlIGhhdCcpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDIpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBsZWF0aGVyIGphY2tldCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnbGVhdGhlciBqYWNrZXQnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAzKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGNsb3duIHN1aXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Nsb3duIHN1aXQnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAzKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIG9sZHRpbWV5IHN1aXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ29sZHRpbWV5IHN1aXQnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAzKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGNvdyB2ZXN0Jykgb3IgQG1hdGNoZXMoJ3Rha2UgcHJpbnQgdmVzdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY293IHByaW50IHZlc3QnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAzKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgZmFrZSBiZWFyZCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnZmFrZSBiZWFyZCcpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBndW4gYmVsdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnZ3VuIGJlbHQnKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbWV0YWwgY2hhaW4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ21ldGFsIGNoYWluJylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHJ1YmJlciBjaGlja2VuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdydWJiZXIgY2hpY2tlbicpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgY29zdHVtZU1hdGNoZXMgPSAoZW5naW5lKSAtPlxuICAgICAgICBncm91cDEgPSAwXG4gICAgICAgIGdyb3VwMiA9IDBcbiAgICAgICAgZ3JvdXAzID0gMFxuICAgICAgICBncm91cDQgPSAwXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Nvd2JveSBoYXQnKSB0aGVuIGdyb3VwMSsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdyYWluYm93IHdpZycpIHRoZW4gZ3JvdXAxKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JykgdGhlbiBncm91cDErK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnc3RvdmVwaXBlIGhhdCcpIHRoZW4gZ3JvdXAxKytcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnbGVhdGhlciBqYWNrZXQnKSB0aGVuIGdyb3VwMisrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjbG93biBzdWl0JykgdGhlbiBncm91cDIrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnb2xkdGltZXkgc3VpdCcpIHRoZW4gZ3JvdXAyKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2NvdyBwcmludCB2ZXN0JykgdGhlbiBncm91cDIrK1xuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdndW4gYmVsdCcpIHRoZW4gZ3JvdXAzKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ3J1YmJlciBjaGlja2VuJykgdGhlbiBncm91cDMrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnZmFrZSBiZWFyZCcpIHRoZW4gZ3JvdXAzKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ21ldGFsIGNoYWluJykgdGhlbiBncm91cDMrK1xuXG4gICAgICAgIHJldHVybiBNYXRoLm1heChncm91cDEsIGdyb3VwMiwgZ3JvdXAzLCBncm91cDQpXG5cbiAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMgPSAoZW5naW5lKSAtPlxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnY293Ym95IGhhdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdyYWluYm93IHdpZycpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdtb3RvcmN5Y2xlIGhlbG1ldCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdzdG92ZXBpcGUgaGF0JylcblxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnbGVhdGhlciBqYWNrZXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnY2xvd24gc3VpdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdvbGR0aW1leSBzdWl0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2NvdyBwcmludCB2ZXN0JylcblxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnZ3VuIGJlbHQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnZmFrZSBiZWFyZCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdtZXRhbCBjaGFpbicpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgaXMgdGhlIHN0YWdlLiBJdCBpcyBqdXN0IGFzIHN0dXBpZCBsb29raW5nIGFzIHRoZSByZXN0IG9mIHRoZSBzaG93LiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBzaG93XFwncyBlbnRyYW5jZS4gVGhlIHNob3cgbWFuYWdlciBzdGFyZXMgYXQgeW91IHF1ZXN0aW9uaW5nbHkuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrIG1hbmFnZXInKVxuICAgICAgICAgICAgc3dpdGNoIGNvc3R1bWVNYXRjaGVzKEApXG4gICAgICAgICAgICAgICAgd2hlbiAwXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIHNob3cgbWFuYWdlciBhcG9sb2dpemVzLCBcIkkgYW0gc29ycnkgc2lyLCB5b3UgbG9vayBsaWtlIGEgZGVjZW50IGtpbmQgb2YgcGVyc29uLCBhbmQgSVxcJ20gYWZyYWlkIHdlIGhhdmUgbm8gcGxhY2UgZm9yIHRoYXQgb24gdGVsZXZpc2lvbi4gTWF5YmUgaWYgeW91IGNhbWUgYmFjayBkcmVzc2VkIGxpa2UgYSBtYW5pYWMgd2UgY291bGQgd29yayBzb21ldGhpbmcgb3V0LicpXG4gICAgICAgICAgICAgICAgd2hlbiAzXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIHNob3cgbWFuYWdlciBsb29rcyB5b3Ugb3Zlciwgbm90aWNpbmcgZ29vZCB0YXN0ZSwgeW91ciBrbmFjayBmb3IgZmxhaXIgYW5kIGF0dGVudGlvbiB0byBkZXRhaWwuIEhlIGRlY2xhcmVzIFwiV2VsbCwgSSBhcHByZWNpYXRlIHlvdSB0YWtpbmcgdGltZSB0byBhc3NlbWJsZSB0aGUgY29zdHVtZSwgYnV0IGl0IGlzIGp1c3QgYSBiaXQgdG9vIG9yZGVybHkuIFlvdSByZWFsbHkgYXJlblxcJ3Qgd2hhdCB3ZSBhcmUgbG9va2luZyBmb3IuXCInKVxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgICAgICB3aGVuIDJcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdUaGUgc2hvdyBtYW5hZ2VyIGxvb2tzIHBsZWFzZWQsIHlldCBhIHRvdWNoIHRyb3VibGVkLiBcIllvdSBsb29rIHRvIGJlIGEgbWFuIGdvaW5nIGluIHRoZSByaWdodCBkaXJlY3Rpb24sIGJ1dCB3ZSBvbmx5IHNlbGVjdCB0aGUgYmVzdCBvZiB0aGUgYmVzdCBmb3IgU2VhbCBvciBubyBTZWFsLiBZb3VyIGNvc3R1bWUgaXMgbm90IHF1aXRlIHJlYWR5IGZvciB0aGUgYmlnIHNob3cgeWV0LicpXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyhAKVxuICAgICAgICAgICAgICAgIHdoZW4gMVxuICAgICAgICAgICAgICAgICAgICBhbGVydCgnXCJPaCwgd293IVwiIEV4Y2xhaW1zIHRoZSBzaG93IG1hbmFnZXIuIFwiWW91IGxvb2sgYWJzb2x1dGVseSBhd2Z1bC4gWW91IGRlZmluaXRlbHkgaGF2ZSB0aGUgbG9vayBmb3Igb3VyIHNob3cuXCIgWW91IHN0YXJ0IHRvIGRhbmNlIGFyb3VuZCwgd2hvb3BpbmcgYW5kIGhvbGxlcmluZywgZGVjbGFyaW5nIHlvdXJzZWxmIHRoZSBmdXR1cmUga2luZyBvZiB0aGUgd29ybGQuIFwiQW5kIEkgc2VlIHlvdSBoYXZlIHRoZSBjaGFyaXNtYSB0byBtYXRjaC5cIiBIZSB0dXJucyB0byBoaXMgYXNzaXN0YW50LCBcIkdldCB0aGlzIGZlbGxhIG9uIHN0YWdlIGF0IG9uY2UuJylcbiAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKE9uIFN0YWdlISknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChPbiBTdGFnZSEpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdcIldlbGNvbWUgYmFjayB0byB0aGUgU2VhbCBvciBObyBTZWFsLCB0aGUgbW9zdCBwb3B1bGFyIGdhbWUgc2hvdyB1bmRlciB0aGUgc2VhISBJXFwnbSB5b3VyIHdlbGwgdGFubmVkIGhvc3QgSmVycnkgWmludGVydmFuZGVyYmluZGVyYmF1ZXIgSnIuIExldFxcJ3MgbWVldCBvdXIgbmV4dCBjb250ZXN0YW50OiBTaGFyYyEgQW4gaW5jcmVkaWJseSBvYm5veGlvdXMgeWV0IHBlcnN1YXNpdmUgeW91bmcgb2NlYW4gZHdlbGxlciwgaGUgbG92ZXMgYW5ub3lpbmcgaGlzIGZyaWVuZHMgYW5kIGlzIGFsd2F5cyB1cCBmb3IgYSByb3VuZCBvZiBTY3JhYmJsZSwgTEFESUVTLiBUaW1lIHRvIGdldCBzdGFydGVkLiBOb3csIFNoYXJjIEkgYW0gZ29pbmcgdG8gcHJlc2VudCB5b3Ugd2l0aCBhIGJyaWVmY2FzZS4gSW4gdGhpcyBicmllZmNhc2UsIHRoZXJlIG1pZ2h0IGJlIGEgc2VhbCBvciB0aGVyZSBtaWdodCBub3QgYmUgYSBzZWFsLiBBbmQgSSBuZWVkIHlvdSB0byB0ZWxsIG1lIHdoaWNoIGl0IGlzOiBTRUFMIG9yIE5PIFNFQUw/XCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vIHNlYWwnKVxuICAgICAgICAgICAgYWxlcnQoJ0plcnJ5IHNsb3dseSBvcGVucyB0aGUgYnJpZWZjYXNlLCBwZWVraW5nIGluc2lkZSBmaXJzdCB0byBkZXRlY3QgYW55IHNpZ25zIG9mIHNlYWwgZW50cmFpbHMgYW5kIHRoZW4sIHdlYXJpbmcgYSBmYWNlIG9mIHByYWN0aWNlZCBkaXNhcHBvaW50bWVudCBhbmQgZW1wYXRoeSwgd2hpbXBlcnMgXCJUb28gYmFkLFwiIGxldHRpbmcgdGhlIGNhc2Ugb3BlbiB0aGUgcmVzdCBvZiB0aGUgd2F5LiBBdCB0aGlzLCB5b3UgYXJlIHByb21wdGx5IHVzaGVyZWQgb2ZmIHRoZSBzdGFnZSB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3Vja2VyLicpXG4gICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzZWFsJylcbiAgICAgICAgICAgIGFsZXJ0KCdKZXJyeSBzbG93bHkgb3BlbnMgdGhlIGJyaWVmY2FzZSwgcGVla2luZyBpbnNpZGUgZmlyc3QgdG8gZGV0ZWN0IGFueSBzaWducyBvZiBzZWFsIGVudHJhaWxzIGFuZCB0aGVuIGV4Y2l0ZWRseSBwdWxscyBpdCBhbGwgdGhlIHdheSBvcGVuLiBcIkhlXFwncyByaWdodCBwZW9wbGUhIE5vdywgbGV0XFwncyBzZWUgeW91ciBwcml6ZXMuXCIgXCJQcml6ZXMgaXMgcmlnaHQgSmVycnksXCIgc2F5cyBhIHZvaWNlIGNvbWluZyBmcm9tIG5vd2hlcmUgYW5kIGV2ZXJ5d2hlcmUgYWxsIGF0IG9uY2UuIFwiSGVyZSBhcmUgc29tZSB3b3JsZCBjbGFzcyBzZWxlY3Rpb25zIEkgcGlja2VkIHVwIGZyb20gdGhlIGdyb2Nlcnkgc3RvcmUgb24gdGhlIHdheSBoZXJlIHRoaXMgbW9ybmluZzogU3VjY2VzcyBjb21lcyBpbiBjYW5zLCBub3QgaW4gY2FuIG5vdHMuIFRpbiBjYW5zIHRoYXQgaXMhIFRoYXRcXCdzIHdoeSB3ZSBhcmUgb2ZmZXJpbmcgeW91IHRoZSBjaG9pY2Ugb2YgYSBmdWxsIHdlZWtcXCdzIHN1cHBseSBvZiBcXCdDYXB0YWluIE5lZFxcJ3MgUGlja2xlZCBIZXJyaW5nXFwnLCBvciBcXCdObyBJZnMgQW5kcyBvciBCdXR0ZXJcXCcgYnJhbmQgbWFyZ2FyaW5lIHNwcmVhZCBwcm9kdWN0IGZvciB5b3VyIGNvbnN1bXB0aW9uIHBsZWFzdXJlLiAgTmF0dXJhbGx5IHlvdSBjaG9vc2UgdGhlIG1hcmdhcmluZSBiZWNhdXNlIHlvdSBhcmUgaGVhbHRoIGNvbnNjaW91cyBvciBzb21ldGhpbmcuJylcbiAgICAgICAgICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyhAKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ21hcmdhcmluZScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdPaCBtYW4sIFdhdGVyIFdvcmxkISBZb3UgbG92ZSB0aGF0IG1vdmllLiBLZXZpbiBDb3N0bmVyIHNob3VsZCBoYXZlIHRvdGFsbHkgZ290dGVuIHRoZSBPc2Nhci4gV2FpdCB0aGlzIGlzblxcJ3QgbGlrZSB0aGF0LiBUaGlzIGlzIFdhdGVyIFdvcmxkLCB0aGUgaG9tZSBvZiB0aGF0IHN0dXBpZCBraWxsZXIgd2hhbGUsIFNoYW1wdS4gV2hhdCBhIGhhY2shIE9idmlvdXMgZXhpdHMgYXJlIG5vcnRoIHRvIHRoZSBNYW5hdGVlIHNob3csIGVhc3QgdG8gdGhlIGdpZnQgc2hvcCwgYW5kIHNvdXRoIHRvIHRoZSBBY2h0aXB1c1xcJ3MgZ2FyZGVuLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCAoTWFuYXRlZSBFeGhpYml0KScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCAoR2lmdCBTaG9wKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQWNodGlwdXNcXCdzIEdhcmRlbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCAoTWFuYXRlZSBFeGhpYml0KScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQW5kIHRoZXJlIGl0IGlzOiBUaGUgaWxsdXN0cmlvdXMgbWFuYXRlZS4gWW91IGNhbiBzZWUgd2h5IHRoZSBzdGFuZHMgYXJlIGVtcHR5LiBUaGVyZSBhcmUgYmlnIHVtYnJlbGxhcyBhdHRhY2hlZCB0byBzb21lIHBpY25pYyB0YWJsZXM7IG5vdCBtdWNoIHRvIHNlZS4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgTWFuYXRlZSBzZXJ2aWNlIHJvb20gYW5kIHNvdXRoIHRvIHRoZSBwYXJrIGVudHJhbmNlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSB1bWJyZWxsYScpXG4gICAgICAgICAgICBAZ2V0SXRlbSgndW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdXZWxsLCBva2F5LiBZb3Ugbm93IGhhdmUgYW4gdW1icmVsbGEuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1lY2hhbmljYWwgUm9vbSBUeXBlIFBsYWNlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKEdpZnQgU2hvcCknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBlbnRlciB0aGUgV2F0ZXIgV29ybGQgZ2lmdCBzaG9wLiBUaGVyZSBhcmUgYWxsIHNvcnRzIG9mIGdyZWF0IGl0ZW1zIGhlcmU6IGEgZ2lhbnQgc3R1ZmZlZCBvY3RvcHVzLCBkZWh5ZHJhdGVkIGFzdHJvbmF1dCBmaXNoIGZvb2QsIGp1bmlvciBtYXJpbmUgc2hlcmlmZiBiYWRnZSBzdGlja2VycywgYW5kIHNvbWUgb2YgdGhhdCBjbGF5IHNhbmQgY3JhcCB0aGV5IHVzZWQgdG8gYWR2ZXJ0aXNlIG9uIFRWLiBTZWUgYW55dGhpbmcgeW91IGxpa2U/IEVhc3QgdG8gdGhlIHBhcmsgZW50cmFuY2UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGJhZGdlJykgb3IgQG1hdGNoZXMoJ3Rha2Ugc2hlcmlmZicpIG9yIEBtYXRjaGVzKCd0YWtlIHN0aWNrZXInKSBvciBAbWF0Y2hlcygndGFrZSBzdGlja2VycycpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnYmFkZ2Ugc3RpY2tlcicpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSB0YWtlIHRoZSBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgYmFkZ2Ugc3RpY2tlcnMgdG8gdGhlIGNvdW50ZXIuIFRoZSBjYXNoaWVyIHNheXMgdGhleSBhcmUgb24gc2FsZSwgb25seSAxNSBmaXNoIGRvbGxhcnMsIHBsdXMgdGF4LiBZdXNzc3MuIFlvdSBwYXkgdGhlIG1hbi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgdGFrZSB0aGF0IGl0ZW0gdG8gdGhlIGNvdW50ZXIuIFRoZSBjYXNoaWVyIHNheXMgaXQgaXMgJyArICgxOCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMwKSkudG9TdHJpbmcoKSArICcgZmlzaCBkb2xsYXJzIGJ1dCB5b3Ugb25seSBoYXZlIDE3IGZpc2ggZG9sbGFycy4gTnV0cy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCAoTWVjaGFuaWNhbCBSb29tIFR5cGUgUGxhY2UpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdXaGF0IGluIHRoZSBuYW1lIG9mIENhcHRhaW4gTmVtbyBpcyB0aGlzPyBUaGVyZSBhcmUgbWFuYXRlZXMgaW4gaG9pc3RzIGFsbCBvdmVyIHRoZSByb29tIGhvb2tlZCB1cCB0by4uLm1pbGtpbmcgZGV2aWNlcy4gVGhpcyBpcyBubyBtZWNoYW5pY2FsIHJvb20hIEl0XFwncyBhIGNvdmVyIGZvciBhIHNlY3JldCwgaWxsZWdhbCwgdW5kZXJncm91bmQsIGJsYWNrIG1hcmtldCwgYnV0IHByb2JhYmx5IG9yZ2FuaWMsIHNlYSBjb3cgbWlsa2luZyBvcGVyYXRpb24uIFRoZSBmaWVuZHMhIFlvdSBhcmUgZ29pbmcgdG8gYmxvdyB0aGUgbGlkIG9mZiB0aGlzIHRoaW5nIGZvciBzdXJlLiBUaGUgc3dlYXR5IG9sZCBmaXNoIHJ1bm5pbmcgdGhlIG1hY2hpbmVyeSBoYXMgbm90IG5vdGljZWQgeW91IHlldC4gT2J2aW91cyBleGl0cyBhcmUgZWFzdCB0byB0aGUgbWFuYXRlZSBleGhpYml0LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKSBvciBAbWF0Y2goJ2JhZGdlJykgb3IgQG1hdGNoKCdzdGlja2VyJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnYmFkZ2Ugc3RpY2tlcicpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgZmlzaCBhdCB0aGUgY29udHJvbHMuIFwiSSBhbSBnb2luZyB0byBzaHV0IHlvdSBkb3duIVwiIFlvdSBzaG91dCBhdCBoaW0uIEhlIGxhdWdocyBoZWFydGlseS4gXCJZb3UgZG9uXFwndCBzdGFuZCBhIGNoYW5jZS4gWW91XFwncmUganVzdCBhIHJlZ3VsYXIgZ3V5LiBJXFwnbSB0aGUgbWF5b3Igb2YgV2F0ZXIgV29ybGQuIFdobyBpcyBnb2luZyB0byBiZWxpZXZlIHlvdT9cIiBIZSBnb2VzIGJhY2sgdG8gaGlzIHdvcmsgcGF5aW5nIHlvdSBubyBtaW5kLiBIZSBoYXMgYSBwb2ludC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHN3aW0gdXAgdG8gdGhlIGZpc2ggYnJhbmRpc2hpbmcgeW91ciBiYWRnZSBzdGlja2VyLiBcIllvdSBhcmUgdW5kZXIgYXJyZXN0IGZvciBpbGxlZ2FsIG1pbGsgaGFydmVzdGluZyBmcm9tIGVuZGFuZ2VyZWQgbWFuYXRlZXMuIElcXCdtIHRha2luZyB5b3UgaW4uXCIgXCJXYWl0LFwiIGhlIHNheXMsIFwiWW91IGRvblxcJ3QgaGF2ZSB0byBkbyB0aGlzLiBJdFxcJ3MgdGhlIG9ubHkgd2F5IEkgY2FuIGtlZXAgV2F0ZXIgV29ybGQgcnVubmluZy4gRG9uXFwndCB5b3Ugc2VlPyBOb3cgdGhhdCB3ZSBhcmUgb24gb3VyIHNpeHRoIFNoYW1wdSwgcGVvcGxlIGp1c3QgZG9uXFwndCBzZWVtIHRvIGNhcmUgYWJvdXQgdGhlIG1hZ2ljIG9mIGV4cGxvaXRlZCBtYXJpbmUgbWFtbWFscy4gSSB3aWxsLCB1aC4uLm1ha2UgaXQgd29ydGggeW91ciB3aGlsZSB0aG91Z2guXCIgSGUgc2xpZGVzIGEgZnJlc2ggYm90dGxlIG9mIG1pbGsgaW4geW91ciBkaXJlY3Rpb24uIFdpdGhvdXQgbG9va2luZyBhdCB5b3UgaGUgc2F5cywgXCJJdCBpcyB3b3J0aCB0aG91c2FuZHMgaW4gdGhlIHJpZ2h0IG1hcmtldC5cIicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ21pbGsnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCAoTWFuYXRlZSBFeGhpYml0KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdUaGUgRXRoZXJlYWwgUmVhbG0nLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBoYXZlIGVudGVyZWQgVGhlIEV0aGVyZWFsIFJlYWxtLiBXaHkgZGlkIHlvdSBkbyB0aGF0PyBUaGF0IHdhcyBhIGJhZCBkZWNpc2lvbi4gV2FsZSBpcyBhdCB5b3VyIHNpZGUuIFRoZXJlIGFyZSBhIGJ1bmNoIG9mIHdlaXJkLCBzcGFjZXkgcGxhdGZvcm1zIGFuZCBqdW5rIGZsb2F0aW5nIGFyb3VuZCBpbiBhIGNvc21pYyB2b2lkIC0tIHlvdXIgdHlwaWNhbCBzdXJyZWFsaXN0IGRyZWFtc2NhcGUgZW52aXJvbm1lbnQuIEFoZWFkIGlzIGFuIHVnbHkgbW9uc3Rlci4gSGUgaXMgY2x1dGNoaW5nIHNvbWV0aGluZyBpbiBoaXMgaGFuZC4gT2J2aW91cyBleGl0cyBhcmUgTk9ORSEgVGhpcyBpcyB0aGUgd29ybGQgb2Ygd2FraW5nIG5pZ2h0bWFyZXMgeW91IGRpbmd1cy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrIG1vbnN0ZXInKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgYXJlIGdldHRpbmcgd29yc2UgYXQgdGhpcyBnYW1lLiBZb3UgYXBwcm9hY2ggc2FpZCBtb25zdGVyIGluIGFuIGVmZm9ydCB0byBnZXQgc29tZSBsZWFkcyBvbiB5b3VyIHByZWNpb3VzIGhhaXIgcHJvZHVjdC4gTWF5YmUgc3RhcnQgYnkgYXNraW5nIGhpbSBhYm91dCB0aGUgc3RhdHVzIG9mIHRoZSBsb2NhbCBiYXNrZXRiYWxsIHRlYW0gb3Igc29tZXRoaW5nPyBPbiBjbG9zZXIgZXhhbWluYXRpb24gdGhvdWdoLCB5b3UgcmVhbGl6ZSB0aGlzIGlzIG5vdCBqdXN0IGFueSBtb25zdGVyLiBJdCBpcyBhIFRvcnVtZWtpYW4gaHlwZXIgZ29ibGluLiBBbmQgaW4gaGlzIGdyaXNseSBwYXcgcmVzdHMgdGhlIGl0ZW0gb2YgeW91ciBxdWVzdCwgeW91ciAkMjMgc2hhbXBvby4gXCJTaGFyYywgd2UgY2FuIG5vdCBhbGxvdyBoaW0gdG8gdXNlIHRoYXQgc2hhbXBvbyxcIiB3aGlzcGVycyB5b3VyIGNvbXBhbmlvbi4gXCJPbiB0aGUgaGVhZCBvZiBhIGh5cGVyIGdvYmxpbiwgaGFpciB0aGF0IHNtb290aCBjb3VsZCBtZWFuIHRoZSBlbmQgb2YgZmFzaGlvbiBhcyB3ZSBrbm93IGl0LiBXZSBtdXN0IHJldHJpZXZlIGl0IGJ5IGFueSBtZWFucyBuZWNlc3NhcnkuXCIgTm8gc29vbmVyIGhhdmUgdGhlIHdvcmRzIGxlZnQgV2FsZVxcJ3MgbGlwcyB0aGF0IHlvdSBhcmUgc3BvdHRlZC4gVGhhdCBpcyBhbGwgdGhlIG1vdGl2YXRpb24gdGhpcyBiZWFzdCBuZWVkcy4gSGUgZmxpcHMgdGhlIGNhcCBvbiB0aGUgYm90dGxlLCByYWlzaW5nIGl0IHRvIHRoZSBmaWx0aHksIHN0cmluZy1saWtlIG1vcCB5b3UgY2FuIG9ubHkgYXNzdW1lIG11c3QgYmUgaGlzIGhhaXIsIGFsbCB0aGUgd2hpbGUgZ2F6aW5nIGRvd24gYXQgeW91IGluIGRlZmlhbmNlIHdpdGggaGlzIHNpbmdsZSBibG9vZCBzaG90IGV5ZS4gRG8gc29tZXRoaW5nIScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnYXR0YWNrJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHN0YXJ0IHRvIGx1bmdlIHRvd2FyZHMgdGhlIGNyZWF0dXJlLCBidXQgV2FsZSBwdXNoZXMgeW91IG91dCBvZiB0aGUgd2F5IGluIGEgY2hhcmdlIGhpbXNlbGYuIFlvdSBjcmluZ2UgYXMgeW91IGhlYXIgdGhlIHNsYXNoaW5nIG9mIGZsZXNoLiBSZWQgbWlzdCBmbG9hdHMgb3V0IG9mIFdhbGVcXCdzIHNpZGUuIFlvdXIgaGVhZCBpcyBzcGlubmluZy4gIFwiTm93IFNoYXJjIVwiLCBoZSB3aGVlemVzLCBcIlVzZSB0aGUgcG93ZXIgb2YgdGhlIFF1YWRyYXRpYyBFeWUuXCIgXCJCdXQgeW91IHNhaWQgSSB3YXNuXFwndCByZWFkeSFcIiB5b3UgY3J5LCB0cnlpbmcgbm90IHRvIGxvb2sgYXQgdGhlIHNvcnJ5IHN0YXRlIG9mIHlvdXIgZnJpZW5kLiBcIk5vLCBpdCB3YXMgSSB3aG8gd2FzIG5vdCByZWFkeS4gVGhlIHAtcG93ZXIgaGFzIGFsd2F5cyBiZWVuIHdpdGhpbiB5LXlvdS5cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndXNlIHF1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdFbmQnKVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdFbmQnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSByZW1vdmUgdGhlIFF1YWRyYXRpYyBFeWUgZnJvbSBpdHMgY29tcGFydG1lbnQsIGNsb3NlIHlvdXIgZXllcyBhbmQgYWxsb3cgdW5pb24gYmV0d2VlbiB5b3VyIHNwaXJpdCBhbmQgdGhlIHVuaXZlcnNhbCBjaGkgZmxvdy4gVGhlbiB0aGUgZ29ibGluIGdldHMgY3V0IGluIGhhbGYgYW5kIHlvdSBnZXQgeW91ciBzaGFtcG9vIGJhY2suJylcblxuXG4gICAgZW5naW5lLnNldFN0YXJ0Um9vbSgnV2FsZSB2cyBTaGFyYzogVGhlIENvbWljOiBUaGUgSW50ZXJhY3RpdmUgU29mdHdhcmUgVGl0bGUgRm9yIFlvdXIgQ29tcHV0ZXIgQm94JylcbiIsInZhciBtID0gKGZ1bmN0aW9uIGFwcCh3aW5kb3csIHVuZGVmaW5lZCkge1xyXG5cdHZhciBPQkpFQ1QgPSBcIltvYmplY3QgT2JqZWN0XVwiLCBBUlJBWSA9IFwiW29iamVjdCBBcnJheV1cIiwgU1RSSU5HID0gXCJbb2JqZWN0IFN0cmluZ11cIiwgRlVOQ1RJT04gPSBcImZ1bmN0aW9uXCI7XHJcblx0dmFyIHR5cGUgPSB7fS50b1N0cmluZztcclxuXHR2YXIgcGFyc2VyID0gLyg/OihefCN8XFwuKShbXiNcXC5cXFtcXF1dKykpfChcXFsuKz9cXF0pL2csIGF0dHJQYXJzZXIgPSAvXFxbKC4rPykoPzo9KFwifCd8KSguKj8pXFwyKT9cXF0vO1xyXG5cdHZhciB2b2lkRWxlbWVudHMgPSAvXihBUkVBfEJBU0V8QlJ8Q09MfENPTU1BTkR8RU1CRUR8SFJ8SU1HfElOUFVUfEtFWUdFTnxMSU5LfE1FVEF8UEFSQU18U09VUkNFfFRSQUNLfFdCUikkLztcclxuXHR2YXIgbm9vcCA9IGZ1bmN0aW9uKCkge31cclxuXHJcblx0Ly8gY2FjaGluZyBjb21tb25seSB1c2VkIHZhcmlhYmxlc1xyXG5cdHZhciAkZG9jdW1lbnQsICRsb2NhdGlvbiwgJHJlcXVlc3RBbmltYXRpb25GcmFtZSwgJGNhbmNlbEFuaW1hdGlvbkZyYW1lO1xyXG5cclxuXHQvLyBzZWxmIGludm9raW5nIGZ1bmN0aW9uIG5lZWRlZCBiZWNhdXNlIG9mIHRoZSB3YXkgbW9ja3Mgd29ya1xyXG5cdGZ1bmN0aW9uIGluaXRpYWxpemUod2luZG93KXtcclxuXHRcdCRkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcclxuXHRcdCRsb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcclxuXHRcdCRjYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuY2xlYXJUaW1lb3V0O1xyXG5cdFx0JHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LnNldFRpbWVvdXQ7XHJcblx0fVxyXG5cclxuXHRpbml0aWFsaXplKHdpbmRvdyk7XHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBAdHlwZWRlZiB7U3RyaW5nfSBUYWdcclxuXHQgKiBBIHN0cmluZyB0aGF0IGxvb2tzIGxpa2UgLT4gZGl2LmNsYXNzbmFtZSNpZFtwYXJhbT1vbmVdW3BhcmFtMj10d29dXHJcblx0ICogV2hpY2ggZGVzY3JpYmVzIGEgRE9NIG5vZGVcclxuXHQgKi9cclxuXHJcblx0LyoqXHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge1RhZ30gVGhlIERPTSBub2RlIHRhZ1xyXG5cdCAqIEBwYXJhbSB7T2JqZWN0PVtdfSBvcHRpb25hbCBrZXktdmFsdWUgcGFpcnMgdG8gYmUgbWFwcGVkIHRvIERPTSBhdHRyc1xyXG5cdCAqIEBwYXJhbSB7Li4ubU5vZGU9W119IFplcm8gb3IgbW9yZSBNaXRocmlsIGNoaWxkIG5vZGVzLiBDYW4gYmUgYW4gYXJyYXksIG9yIHNwbGF0IChvcHRpb25hbClcclxuXHQgKlxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIG0oKSB7XHJcblx0XHR2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHRcdHZhciBoYXNBdHRycyA9IGFyZ3NbMV0gIT0gbnVsbCAmJiB0eXBlLmNhbGwoYXJnc1sxXSkgPT09IE9CSkVDVCAmJiAhKFwidGFnXCIgaW4gYXJnc1sxXSB8fCBcInZpZXdcIiBpbiBhcmdzWzFdKSAmJiAhKFwic3VidHJlZVwiIGluIGFyZ3NbMV0pO1xyXG5cdFx0dmFyIGF0dHJzID0gaGFzQXR0cnMgPyBhcmdzWzFdIDoge307XHJcblx0XHR2YXIgY2xhc3NBdHRyTmFtZSA9IFwiY2xhc3NcIiBpbiBhdHRycyA/IFwiY2xhc3NcIiA6IFwiY2xhc3NOYW1lXCI7XHJcblx0XHR2YXIgY2VsbCA9IHt0YWc6IFwiZGl2XCIsIGF0dHJzOiB7fX07XHJcblx0XHR2YXIgbWF0Y2gsIGNsYXNzZXMgPSBbXTtcclxuXHRcdGlmICh0eXBlLmNhbGwoYXJnc1swXSkgIT0gU1RSSU5HKSB0aHJvdyBuZXcgRXJyb3IoXCJzZWxlY3RvciBpbiBtKHNlbGVjdG9yLCBhdHRycywgY2hpbGRyZW4pIHNob3VsZCBiZSBhIHN0cmluZ1wiKVxyXG5cdFx0d2hpbGUgKG1hdGNoID0gcGFyc2VyLmV4ZWMoYXJnc1swXSkpIHtcclxuXHRcdFx0aWYgKG1hdGNoWzFdID09PSBcIlwiICYmIG1hdGNoWzJdKSBjZWxsLnRhZyA9IG1hdGNoWzJdO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCIjXCIpIGNlbGwuYXR0cnMuaWQgPSBtYXRjaFsyXTtcclxuXHRcdFx0ZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiLlwiKSBjbGFzc2VzLnB1c2gobWF0Y2hbMl0pO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFszXVswXSA9PT0gXCJbXCIpIHtcclxuXHRcdFx0XHR2YXIgcGFpciA9IGF0dHJQYXJzZXIuZXhlYyhtYXRjaFszXSk7XHJcblx0XHRcdFx0Y2VsbC5hdHRyc1twYWlyWzFdXSA9IHBhaXJbM10gfHwgKHBhaXJbMl0gPyBcIlwiIDp0cnVlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNoaWxkcmVuID0gaGFzQXR0cnMgPyBhcmdzLnNsaWNlKDIpIDogYXJncy5zbGljZSgxKTtcclxuXHRcdGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgdHlwZS5jYWxsKGNoaWxkcmVuWzBdKSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0Y2VsbC5jaGlsZHJlbiA9IGNoaWxkcmVuWzBdXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Y2VsbC5jaGlsZHJlbiA9IGNoaWxkcmVuXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGZvciAodmFyIGF0dHJOYW1lIGluIGF0dHJzKSB7XHJcblx0XHRcdGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShhdHRyTmFtZSkpIHtcclxuXHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IGNsYXNzQXR0ck5hbWUgJiYgYXR0cnNbYXR0ck5hbWVdICE9IG51bGwgJiYgYXR0cnNbYXR0ck5hbWVdICE9PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRjbGFzc2VzLnB1c2goYXR0cnNbYXR0ck5hbWVdKVxyXG5cdFx0XHRcdFx0Y2VsbC5hdHRyc1thdHRyTmFtZV0gPSBcIlwiIC8vY3JlYXRlIGtleSBpbiBjb3JyZWN0IGl0ZXJhdGlvbiBvcmRlclxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGNlbGwuYXR0cnNbYXR0ck5hbWVdID0gYXR0cnNbYXR0ck5hbWVdXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChjbGFzc2VzLmxlbmd0aCA+IDApIGNlbGwuYXR0cnNbY2xhc3NBdHRyTmFtZV0gPSBjbGFzc2VzLmpvaW4oXCIgXCIpO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gY2VsbFxyXG5cdH1cclxuXHRmdW5jdGlvbiBidWlsZChwYXJlbnRFbGVtZW50LCBwYXJlbnRUYWcsIHBhcmVudENhY2hlLCBwYXJlbnRJbmRleCwgZGF0YSwgY2FjaGVkLCBzaG91bGRSZWF0dGFjaCwgaW5kZXgsIGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpIHtcclxuXHRcdC8vYGJ1aWxkYCBpcyBhIHJlY3Vyc2l2ZSBmdW5jdGlvbiB0aGF0IG1hbmFnZXMgY3JlYXRpb24vZGlmZmluZy9yZW1vdmFsIG9mIERPTSBlbGVtZW50cyBiYXNlZCBvbiBjb21wYXJpc29uIGJldHdlZW4gYGRhdGFgIGFuZCBgY2FjaGVkYFxyXG5cdFx0Ly90aGUgZGlmZiBhbGdvcml0aG0gY2FuIGJlIHN1bW1hcml6ZWQgYXMgdGhpczpcclxuXHRcdC8vMSAtIGNvbXBhcmUgYGRhdGFgIGFuZCBgY2FjaGVkYFxyXG5cdFx0Ly8yIC0gaWYgdGhleSBhcmUgZGlmZmVyZW50LCBjb3B5IGBkYXRhYCB0byBgY2FjaGVkYCBhbmQgdXBkYXRlIHRoZSBET00gYmFzZWQgb24gd2hhdCB0aGUgZGlmZmVyZW5jZSBpc1xyXG5cdFx0Ly8zIC0gcmVjdXJzaXZlbHkgYXBwbHkgdGhpcyBhbGdvcml0aG0gZm9yIGV2ZXJ5IGFycmF5IGFuZCBmb3IgdGhlIGNoaWxkcmVuIG9mIGV2ZXJ5IHZpcnR1YWwgZWxlbWVudFxyXG5cclxuXHRcdC8vdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlIGlzIGVzc2VudGlhbGx5IHRoZSBzYW1lIGFzIHRoZSBwcmV2aW91cyByZWRyYXcncyBgZGF0YWAgZGF0YSBzdHJ1Y3R1cmUsIHdpdGggYSBmZXcgYWRkaXRpb25zOlxyXG5cdFx0Ly8tIGBjYWNoZWRgIGFsd2F5cyBoYXMgYSBwcm9wZXJ0eSBjYWxsZWQgYG5vZGVzYCwgd2hpY2ggaXMgYSBsaXN0IG9mIERPTSBlbGVtZW50cyB0aGF0IGNvcnJlc3BvbmQgdG8gdGhlIGRhdGEgcmVwcmVzZW50ZWQgYnkgdGhlIHJlc3BlY3RpdmUgdmlydHVhbCBlbGVtZW50XHJcblx0XHQvLy0gaW4gb3JkZXIgdG8gc3VwcG9ydCBhdHRhY2hpbmcgYG5vZGVzYCBhcyBhIHByb3BlcnR5IG9mIGBjYWNoZWRgLCBgY2FjaGVkYCBpcyAqYWx3YXlzKiBhIG5vbi1wcmltaXRpdmUgb2JqZWN0LCBpLmUuIGlmIHRoZSBkYXRhIHdhcyBhIHN0cmluZywgdGhlbiBjYWNoZWQgaXMgYSBTdHJpbmcgaW5zdGFuY2UuIElmIGRhdGEgd2FzIGBudWxsYCBvciBgdW5kZWZpbmVkYCwgY2FjaGVkIGlzIGBuZXcgU3RyaW5nKFwiXCIpYFxyXG5cdFx0Ly8tIGBjYWNoZWQgYWxzbyBoYXMgYSBgY29uZmlnQ29udGV4dGAgcHJvcGVydHksIHdoaWNoIGlzIHRoZSBzdGF0ZSBzdG9yYWdlIG9iamVjdCBleHBvc2VkIGJ5IGNvbmZpZyhlbGVtZW50LCBpc0luaXRpYWxpemVkLCBjb250ZXh0KVxyXG5cdFx0Ly8tIHdoZW4gYGNhY2hlZGAgaXMgYW4gT2JqZWN0LCBpdCByZXByZXNlbnRzIGEgdmlydHVhbCBlbGVtZW50OyB3aGVuIGl0J3MgYW4gQXJyYXksIGl0IHJlcHJlc2VudHMgYSBsaXN0IG9mIGVsZW1lbnRzOyB3aGVuIGl0J3MgYSBTdHJpbmcsIE51bWJlciBvciBCb29sZWFuLCBpdCByZXByZXNlbnRzIGEgdGV4dCBub2RlXHJcblxyXG5cdFx0Ly9gcGFyZW50RWxlbWVudGAgaXMgYSBET00gZWxlbWVudCB1c2VkIGZvciBXM0MgRE9NIEFQSSBjYWxsc1xyXG5cdFx0Ly9gcGFyZW50VGFnYCBpcyBvbmx5IHVzZWQgZm9yIGhhbmRsaW5nIGEgY29ybmVyIGNhc2UgZm9yIHRleHRhcmVhIHZhbHVlc1xyXG5cdFx0Ly9gcGFyZW50Q2FjaGVgIGlzIHVzZWQgdG8gcmVtb3ZlIG5vZGVzIGluIHNvbWUgbXVsdGktbm9kZSBjYXNlc1xyXG5cdFx0Ly9gcGFyZW50SW5kZXhgIGFuZCBgaW5kZXhgIGFyZSB1c2VkIHRvIGZpZ3VyZSBvdXQgdGhlIG9mZnNldCBvZiBub2Rlcy4gVGhleSdyZSBhcnRpZmFjdHMgZnJvbSBiZWZvcmUgYXJyYXlzIHN0YXJ0ZWQgYmVpbmcgZmxhdHRlbmVkIGFuZCBhcmUgbGlrZWx5IHJlZmFjdG9yYWJsZVxyXG5cdFx0Ly9gZGF0YWAgYW5kIGBjYWNoZWRgIGFyZSwgcmVzcGVjdGl2ZWx5LCB0aGUgbmV3IGFuZCBvbGQgbm9kZXMgYmVpbmcgZGlmZmVkXHJcblx0XHQvL2BzaG91bGRSZWF0dGFjaGAgaXMgYSBmbGFnIGluZGljYXRpbmcgd2hldGhlciBhIHBhcmVudCBub2RlIHdhcyByZWNyZWF0ZWQgKGlmIHNvLCBhbmQgaWYgdGhpcyBub2RlIGlzIHJldXNlZCwgdGhlbiB0aGlzIG5vZGUgbXVzdCByZWF0dGFjaCBpdHNlbGYgdG8gdGhlIG5ldyBwYXJlbnQpXHJcblx0XHQvL2BlZGl0YWJsZWAgaXMgYSBmbGFnIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgYW4gYW5jZXN0b3IgaXMgY29udGVudGVkaXRhYmxlXHJcblx0XHQvL2BuYW1lc3BhY2VgIGluZGljYXRlcyB0aGUgY2xvc2VzdCBIVE1MIG5hbWVzcGFjZSBhcyBpdCBjYXNjYWRlcyBkb3duIGZyb20gYW4gYW5jZXN0b3JcclxuXHRcdC8vYGNvbmZpZ3NgIGlzIGEgbGlzdCBvZiBjb25maWcgZnVuY3Rpb25zIHRvIHJ1biBhZnRlciB0aGUgdG9wbW9zdCBgYnVpbGRgIGNhbGwgZmluaXNoZXMgcnVubmluZ1xyXG5cclxuXHRcdC8vdGhlcmUncyBsb2dpYyB0aGF0IHJlbGllcyBvbiB0aGUgYXNzdW1wdGlvbiB0aGF0IG51bGwgYW5kIHVuZGVmaW5lZCBkYXRhIGFyZSBlcXVpdmFsZW50IHRvIGVtcHR5IHN0cmluZ3NcclxuXHRcdC8vLSB0aGlzIHByZXZlbnRzIGxpZmVjeWNsZSBzdXJwcmlzZXMgZnJvbSBwcm9jZWR1cmFsIGhlbHBlcnMgdGhhdCBtaXggaW1wbGljaXQgYW5kIGV4cGxpY2l0IHJldHVybiBzdGF0ZW1lbnRzIChlLmcuIGZ1bmN0aW9uIGZvbygpIHtpZiAoY29uZCkgcmV0dXJuIG0oXCJkaXZcIil9XHJcblx0XHQvLy0gaXQgc2ltcGxpZmllcyBkaWZmaW5nIGNvZGVcclxuXHRcdC8vZGF0YS50b1N0cmluZygpIG1pZ2h0IHRocm93IG9yIHJldHVybiBudWxsIGlmIGRhdGEgaXMgdGhlIHJldHVybiB2YWx1ZSBvZiBDb25zb2xlLmxvZyBpbiBGaXJlZm94IChiZWhhdmlvciBkZXBlbmRzIG9uIHZlcnNpb24pXHJcblx0XHR0cnkge2lmIChkYXRhID09IG51bGwgfHwgZGF0YS50b1N0cmluZygpID09IG51bGwpIGRhdGEgPSBcIlwiO30gY2F0Y2ggKGUpIHtkYXRhID0gXCJcIn1cclxuXHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWQ7XHJcblx0XHR2YXIgY2FjaGVkVHlwZSA9IHR5cGUuY2FsbChjYWNoZWQpLCBkYXRhVHlwZSA9IHR5cGUuY2FsbChkYXRhKTtcclxuXHRcdGlmIChjYWNoZWQgPT0gbnVsbCB8fCBjYWNoZWRUeXBlICE9PSBkYXRhVHlwZSkge1xyXG5cdFx0XHRpZiAoY2FjaGVkICE9IG51bGwpIHtcclxuXHRcdFx0XHRpZiAocGFyZW50Q2FjaGUgJiYgcGFyZW50Q2FjaGUubm9kZXMpIHtcclxuXHRcdFx0XHRcdHZhciBvZmZzZXQgPSBpbmRleCAtIHBhcmVudEluZGV4O1xyXG5cdFx0XHRcdFx0dmFyIGVuZCA9IG9mZnNldCArIChkYXRhVHlwZSA9PT0gQVJSQVkgPyBkYXRhIDogY2FjaGVkLm5vZGVzKS5sZW5ndGg7XHJcblx0XHRcdFx0XHRjbGVhcihwYXJlbnRDYWNoZS5ub2Rlcy5zbGljZShvZmZzZXQsIGVuZCksIHBhcmVudENhY2hlLnNsaWNlKG9mZnNldCwgZW5kKSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBpZiAoY2FjaGVkLm5vZGVzKSBjbGVhcihjYWNoZWQubm9kZXMsIGNhY2hlZClcclxuXHRcdFx0fVxyXG5cdFx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcjtcclxuXHRcdFx0aWYgKGNhY2hlZC50YWcpIGNhY2hlZCA9IHt9OyAvL2lmIGNvbnN0cnVjdG9yIGNyZWF0ZXMgYSB2aXJ0dWFsIGRvbSBlbGVtZW50LCB1c2UgYSBibGFuayBvYmplY3QgYXMgdGhlIGJhc2UgY2FjaGVkIG5vZGUgaW5zdGVhZCBvZiBjb3B5aW5nIHRoZSB2aXJ0dWFsIGVsICgjMjc3KVxyXG5cdFx0XHRjYWNoZWQubm9kZXMgPSBbXVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChkYXRhVHlwZSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0Ly9yZWN1cnNpdmVseSBmbGF0dGVuIGFycmF5XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHR5cGUuY2FsbChkYXRhW2ldKSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSBkYXRhLmNvbmNhdC5hcHBseShbXSwgZGF0YSk7XHJcblx0XHRcdFx0XHRpLS0gLy9jaGVjayBjdXJyZW50IGluZGV4IGFnYWluIGFuZCBmbGF0dGVuIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlIG5lc3RlZCBhcnJheXMgYXQgdGhhdCBpbmRleFxyXG5cdFx0XHRcdFx0bGVuID0gZGF0YS5sZW5ndGhcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHZhciBub2RlcyA9IFtdLCBpbnRhY3QgPSBjYWNoZWQubGVuZ3RoID09PSBkYXRhLmxlbmd0aCwgc3ViQXJyYXlDb3VudCA9IDA7XHJcblxyXG5cdFx0XHQvL2tleXMgYWxnb3JpdGhtOiBzb3J0IGVsZW1lbnRzIHdpdGhvdXQgcmVjcmVhdGluZyB0aGVtIGlmIGtleXMgYXJlIHByZXNlbnRcclxuXHRcdFx0Ly8xKSBjcmVhdGUgYSBtYXAgb2YgYWxsIGV4aXN0aW5nIGtleXMsIGFuZCBtYXJrIGFsbCBmb3IgZGVsZXRpb25cclxuXHRcdFx0Ly8yKSBhZGQgbmV3IGtleXMgdG8gbWFwIGFuZCBtYXJrIHRoZW0gZm9yIGFkZGl0aW9uXHJcblx0XHRcdC8vMykgaWYga2V5IGV4aXN0cyBpbiBuZXcgbGlzdCwgY2hhbmdlIGFjdGlvbiBmcm9tIGRlbGV0aW9uIHRvIGEgbW92ZVxyXG5cdFx0XHQvLzQpIGZvciBlYWNoIGtleSwgaGFuZGxlIGl0cyBjb3JyZXNwb25kaW5nIGFjdGlvbiBhcyBtYXJrZWQgaW4gcHJldmlvdXMgc3RlcHNcclxuXHRcdFx0dmFyIERFTEVUSU9OID0gMSwgSU5TRVJUSU9OID0gMiAsIE1PVkUgPSAzO1xyXG5cdFx0XHR2YXIgZXhpc3RpbmcgPSB7fSwgc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gZmFsc2U7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2FjaGVkLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKGNhY2hlZFtpXSAmJiBjYWNoZWRbaV0uYXR0cnMgJiYgY2FjaGVkW2ldLmF0dHJzLmtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSB0cnVlO1xyXG5cdFx0XHRcdFx0ZXhpc3RpbmdbY2FjaGVkW2ldLmF0dHJzLmtleV0gPSB7YWN0aW9uOiBERUxFVElPTiwgaW5kZXg6IGl9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgZ3VpZCA9IDBcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRpZiAoZGF0YVtpXSAmJiBkYXRhW2ldLmF0dHJzICYmIGRhdGFbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGogPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhW2pdICYmIGRhdGFbal0uYXR0cnMgJiYgZGF0YVtqXS5hdHRycy5rZXkgPT0gbnVsbCkgZGF0YVtqXS5hdHRycy5rZXkgPSBcIl9fbWl0aHJpbF9fXCIgKyBndWlkKytcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzKSB7XHJcblx0XHRcdFx0dmFyIGtleXNEaWZmZXIgPSBmYWxzZVxyXG5cdFx0XHRcdGlmIChkYXRhLmxlbmd0aCAhPSBjYWNoZWQubGVuZ3RoKSBrZXlzRGlmZmVyID0gdHJ1ZVxyXG5cdFx0XHRcdGVsc2UgZm9yICh2YXIgaSA9IDAsIGNhY2hlZENlbGwsIGRhdGFDZWxsOyBjYWNoZWRDZWxsID0gY2FjaGVkW2ldLCBkYXRhQ2VsbCA9IGRhdGFbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKGNhY2hlZENlbGwuYXR0cnMgJiYgZGF0YUNlbGwuYXR0cnMgJiYgY2FjaGVkQ2VsbC5hdHRycy5rZXkgIT0gZGF0YUNlbGwuYXR0cnMua2V5KSB7XHJcblx0XHRcdFx0XHRcdGtleXNEaWZmZXIgPSB0cnVlXHJcblx0XHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmIChrZXlzRGlmZmVyKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoZGF0YVtpXSAmJiBkYXRhW2ldLmF0dHJzKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGRhdGFbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBrZXkgPSBkYXRhW2ldLmF0dHJzLmtleTtcclxuXHRcdFx0XHRcdFx0XHRcdGlmICghZXhpc3Rpbmdba2V5XSkgZXhpc3Rpbmdba2V5XSA9IHthY3Rpb246IElOU0VSVElPTiwgaW5kZXg6IGl9O1xyXG5cdFx0XHRcdFx0XHRcdFx0ZWxzZSBleGlzdGluZ1trZXldID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRhY3Rpb246IE1PVkUsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OiBpLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRmcm9tOiBleGlzdGluZ1trZXldLmluZGV4LFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRlbGVtZW50OiBjYWNoZWQubm9kZXNbZXhpc3Rpbmdba2V5XS5pbmRleF0gfHwgJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHZhciBhY3Rpb25zID0gW11cclxuXHRcdFx0XHRcdGZvciAodmFyIHByb3AgaW4gZXhpc3RpbmcpIGFjdGlvbnMucHVzaChleGlzdGluZ1twcm9wXSlcclxuXHRcdFx0XHRcdHZhciBjaGFuZ2VzID0gYWN0aW9ucy5zb3J0KHNvcnRDaGFuZ2VzKTtcclxuXHRcdFx0XHRcdHZhciBuZXdDYWNoZWQgPSBuZXcgQXJyYXkoY2FjaGVkLmxlbmd0aClcclxuXHRcdFx0XHRcdG5ld0NhY2hlZC5ub2RlcyA9IGNhY2hlZC5ub2Rlcy5zbGljZSgpXHJcblxyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNoYW5nZTsgY2hhbmdlID0gY2hhbmdlc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBERUxFVElPTikge1xyXG5cdFx0XHRcdFx0XHRcdGNsZWFyKGNhY2hlZFtjaGFuZ2UuaW5kZXhdLm5vZGVzLCBjYWNoZWRbY2hhbmdlLmluZGV4XSk7XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShjaGFuZ2UuaW5kZXgsIDEpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IElOU0VSVElPTikge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBkdW1teSA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cdFx0XHRcdFx0XHRcdGR1bW15LmtleSA9IGRhdGFbY2hhbmdlLmluZGV4XS5hdHRycy5rZXk7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoZHVtbXksIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdIHx8IG51bGwpO1xyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5zcGxpY2UoY2hhbmdlLmluZGV4LCAwLCB7YXR0cnM6IHtrZXk6IGRhdGFbY2hhbmdlLmluZGV4XS5hdHRycy5rZXl9LCBub2RlczogW2R1bW15XX0pXHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzW2NoYW5nZS5pbmRleF0gPSBkdW1teVxyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gTU9WRSkge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSAhPT0gY2hhbmdlLmVsZW1lbnQgJiYgY2hhbmdlLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoYW5nZS5lbGVtZW50LCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSB8fCBudWxsKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWRbY2hhbmdlLmluZGV4XSA9IGNhY2hlZFtjaGFuZ2UuZnJvbV1cclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbY2hhbmdlLmluZGV4XSA9IGNoYW5nZS5lbGVtZW50XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGNhY2hlZCA9IG5ld0NhY2hlZDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9lbmQga2V5IGFsZ29yaXRobVxyXG5cclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNhY2hlQ291bnQgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0Ly9kaWZmIGVhY2ggaXRlbSBpbiB0aGUgYXJyYXlcclxuXHRcdFx0XHR2YXIgaXRlbSA9IGJ1aWxkKHBhcmVudEVsZW1lbnQsIHBhcmVudFRhZywgY2FjaGVkLCBpbmRleCwgZGF0YVtpXSwgY2FjaGVkW2NhY2hlQ291bnRdLCBzaG91bGRSZWF0dGFjaCwgaW5kZXggKyBzdWJBcnJheUNvdW50IHx8IHN1YkFycmF5Q291bnQsIGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpO1xyXG5cdFx0XHRcdGlmIChpdGVtID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xyXG5cdFx0XHRcdGlmICghaXRlbS5ub2Rlcy5pbnRhY3QpIGludGFjdCA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmIChpdGVtLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0XHQvL2ZpeCBvZmZzZXQgb2YgbmV4dCBlbGVtZW50IGlmIGl0ZW0gd2FzIGEgdHJ1c3RlZCBzdHJpbmcgdy8gbW9yZSB0aGFuIG9uZSBodG1sIGVsZW1lbnRcclxuXHRcdFx0XHRcdC8vdGhlIGZpcnN0IGNsYXVzZSBpbiB0aGUgcmVnZXhwIG1hdGNoZXMgZWxlbWVudHNcclxuXHRcdFx0XHRcdC8vdGhlIHNlY29uZCBjbGF1c2UgKGFmdGVyIHRoZSBwaXBlKSBtYXRjaGVzIHRleHQgbm9kZXNcclxuXHRcdFx0XHRcdHN1YkFycmF5Q291bnQgKz0gKGl0ZW0ubWF0Y2goLzxbXlxcL118XFw+XFxzKltePF0vZykgfHwgWzBdKS5sZW5ndGhcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBzdWJBcnJheUNvdW50ICs9IHR5cGUuY2FsbChpdGVtKSA9PT0gQVJSQVkgPyBpdGVtLmxlbmd0aCA6IDE7XHJcblx0XHRcdFx0Y2FjaGVkW2NhY2hlQ291bnQrK10gPSBpdGVtXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFpbnRhY3QpIHtcclxuXHRcdFx0XHQvL2RpZmYgdGhlIGFycmF5IGl0c2VsZlxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdC8vdXBkYXRlIHRoZSBsaXN0IG9mIERPTSBub2RlcyBieSBjb2xsZWN0aW5nIHRoZSBub2RlcyBmcm9tIGVhY2ggaXRlbVxyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAoY2FjaGVkW2ldICE9IG51bGwpIG5vZGVzLnB1c2guYXBwbHkobm9kZXMsIGNhY2hlZFtpXS5ub2RlcylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly9yZW1vdmUgaXRlbXMgZnJvbSB0aGUgZW5kIG9mIHRoZSBhcnJheSBpZiB0aGUgbmV3IGFycmF5IGlzIHNob3J0ZXIgdGhhbiB0aGUgb2xkIG9uZVxyXG5cdFx0XHRcdC8vaWYgZXJyb3JzIGV2ZXIgaGFwcGVuIGhlcmUsIHRoZSBpc3N1ZSBpcyBtb3N0IGxpa2VseSBhIGJ1ZyBpbiB0aGUgY29uc3RydWN0aW9uIG9mIHRoZSBgY2FjaGVkYCBkYXRhIHN0cnVjdHVyZSBzb21ld2hlcmUgZWFybGllciBpbiB0aGUgcHJvZ3JhbVxyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBub2RlOyBub2RlID0gY2FjaGVkLm5vZGVzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChub2RlLnBhcmVudE5vZGUgIT0gbnVsbCAmJiBub2Rlcy5pbmRleE9mKG5vZGUpIDwgMCkgY2xlYXIoW25vZGVdLCBbY2FjaGVkW2ldXSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoIDwgY2FjaGVkLmxlbmd0aCkgY2FjaGVkLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKGRhdGEgIT0gbnVsbCAmJiBkYXRhVHlwZSA9PT0gT0JKRUNUKSB7XHJcblx0XHRcdHZhciB2aWV3cyA9IFtdLCBjb250cm9sbGVycyA9IFtdXHJcblx0XHRcdHdoaWxlIChkYXRhLnZpZXcpIHtcclxuXHRcdFx0XHR2YXIgdmlldyA9IGRhdGEudmlldy4kb3JpZ2luYWwgfHwgZGF0YS52aWV3XHJcblx0XHRcdFx0dmFyIGNvbnRyb2xsZXJJbmRleCA9IG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJkaWZmXCIgJiYgY2FjaGVkLnZpZXdzID8gY2FjaGVkLnZpZXdzLmluZGV4T2YodmlldykgOiAtMVxyXG5cdFx0XHRcdHZhciBjb250cm9sbGVyID0gY29udHJvbGxlckluZGV4ID4gLTEgPyBjYWNoZWQuY29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XSA6IG5ldyAoZGF0YS5jb250cm9sbGVyIHx8IG5vb3ApXHJcblx0XHRcdFx0dmFyIGtleSA9IGRhdGEgJiYgZGF0YS5hdHRycyAmJiBkYXRhLmF0dHJzLmtleVxyXG5cdFx0XHRcdGRhdGEgPSBwZW5kaW5nUmVxdWVzdHMgPT0gMCB8fCAoY2FjaGVkICYmIGNhY2hlZC5jb250cm9sbGVycyAmJiBjYWNoZWQuY29udHJvbGxlcnMuaW5kZXhPZihjb250cm9sbGVyKSA+IC0xKSA/IGRhdGEudmlldyhjb250cm9sbGVyKSA6IHt0YWc6IFwicGxhY2Vob2xkZXJcIn1cclxuXHRcdFx0XHRpZiAoZGF0YS5zdWJ0cmVlID09PSBcInJldGFpblwiKSByZXR1cm4gY2FjaGVkO1xyXG5cdFx0XHRcdGlmIChrZXkpIHtcclxuXHRcdFx0XHRcdGlmICghZGF0YS5hdHRycykgZGF0YS5hdHRycyA9IHt9XHJcblx0XHRcdFx0XHRkYXRhLmF0dHJzLmtleSA9IGtleVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCkgdW5sb2FkZXJzLnB1c2goe2NvbnRyb2xsZXI6IGNvbnRyb2xsZXIsIGhhbmRsZXI6IGNvbnRyb2xsZXIub251bmxvYWR9KVxyXG5cdFx0XHRcdHZpZXdzLnB1c2godmlldylcclxuXHRcdFx0XHRjb250cm9sbGVycy5wdXNoKGNvbnRyb2xsZXIpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFkYXRhLnRhZyAmJiBjb250cm9sbGVycy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIkNvbXBvbmVudCB0ZW1wbGF0ZSBtdXN0IHJldHVybiBhIHZpcnR1YWwgZWxlbWVudCwgbm90IGFuIGFycmF5LCBzdHJpbmcsIGV0Yy5cIilcclxuXHRcdFx0aWYgKCFkYXRhLmF0dHJzKSBkYXRhLmF0dHJzID0ge307XHJcblx0XHRcdGlmICghY2FjaGVkLmF0dHJzKSBjYWNoZWQuYXR0cnMgPSB7fTtcclxuXHJcblx0XHRcdHZhciBkYXRhQXR0cktleXMgPSBPYmplY3Qua2V5cyhkYXRhLmF0dHJzKVxyXG5cdFx0XHR2YXIgaGFzS2V5cyA9IGRhdGFBdHRyS2V5cy5sZW5ndGggPiAoXCJrZXlcIiBpbiBkYXRhLmF0dHJzID8gMSA6IDApXHJcblx0XHRcdC8vaWYgYW4gZWxlbWVudCBpcyBkaWZmZXJlbnQgZW5vdWdoIGZyb20gdGhlIG9uZSBpbiBjYWNoZSwgcmVjcmVhdGUgaXRcclxuXHRcdFx0aWYgKGRhdGEudGFnICE9IGNhY2hlZC50YWcgfHwgZGF0YUF0dHJLZXlzLnNvcnQoKS5qb2luKCkgIT0gT2JqZWN0LmtleXMoY2FjaGVkLmF0dHJzKS5zb3J0KCkuam9pbigpIHx8IGRhdGEuYXR0cnMuaWQgIT0gY2FjaGVkLmF0dHJzLmlkIHx8IGRhdGEuYXR0cnMua2V5ICE9IGNhY2hlZC5hdHRycy5rZXkgfHwgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJhbGxcIiAmJiAoIWNhY2hlZC5jb25maWdDb250ZXh0IHx8IGNhY2hlZC5jb25maWdDb250ZXh0LnJldGFpbiAhPT0gdHJ1ZSkpIHx8IChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwiZGlmZlwiICYmIGNhY2hlZC5jb25maWdDb250ZXh0ICYmIGNhY2hlZC5jb25maWdDb250ZXh0LnJldGFpbiA9PT0gZmFsc2UpKSB7XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5ub2Rlcy5sZW5ndGgpIGNsZWFyKGNhY2hlZC5ub2Rlcyk7XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmIHR5cGVvZiBjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKClcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNvbnRyb2xsZXJzKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNhY2hlZC5jb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY29udHJvbGxlci5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNvbnRyb2xsZXIub251bmxvYWQoe3ByZXZlbnREZWZhdWx0OiBub29wfSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGUuY2FsbChkYXRhLnRhZykgIT0gU1RSSU5HKSByZXR1cm47XHJcblxyXG5cdFx0XHR2YXIgbm9kZSwgaXNOZXcgPSBjYWNoZWQubm9kZXMubGVuZ3RoID09PSAwO1xyXG5cdFx0XHRpZiAoZGF0YS5hdHRycy54bWxucykgbmFtZXNwYWNlID0gZGF0YS5hdHRycy54bWxucztcclxuXHRcdFx0ZWxzZSBpZiAoZGF0YS50YWcgPT09IFwic3ZnXCIpIG5hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcclxuXHRcdFx0ZWxzZSBpZiAoZGF0YS50YWcgPT09IFwibWF0aFwiKSBuYW1lc3BhY2UgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUxcIjtcclxuXHRcdFx0XHJcblx0XHRcdGlmIChpc05ldykge1xyXG5cdFx0XHRcdGlmIChkYXRhLmF0dHJzLmlzKSBub2RlID0gbmFtZXNwYWNlID09PSB1bmRlZmluZWQgPyAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZywgZGF0YS5hdHRycy5pcykgOiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMuaXMpO1xyXG5cdFx0XHRcdGVsc2Ugbm9kZSA9IG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkID8gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGF0YS50YWcpIDogJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIGRhdGEudGFnKTtcclxuXHRcdFx0XHRjYWNoZWQgPSB7XHJcblx0XHRcdFx0XHR0YWc6IGRhdGEudGFnLFxyXG5cdFx0XHRcdFx0Ly9zZXQgYXR0cmlidXRlcyBmaXJzdCwgdGhlbiBjcmVhdGUgY2hpbGRyZW5cclxuXHRcdFx0XHRcdGF0dHJzOiBoYXNLZXlzID8gc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywgZGF0YS5hdHRycywge30sIG5hbWVzcGFjZSkgOiBkYXRhLmF0dHJzLFxyXG5cdFx0XHRcdFx0Y2hpbGRyZW46IGRhdGEuY2hpbGRyZW4gIT0gbnVsbCAmJiBkYXRhLmNoaWxkcmVuLmxlbmd0aCA+IDAgP1xyXG5cdFx0XHRcdFx0XHRidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgdHJ1ZSwgMCwgZGF0YS5hdHRycy5jb250ZW50ZWRpdGFibGUgPyBub2RlIDogZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncykgOlxyXG5cdFx0XHRcdFx0XHRkYXRhLmNoaWxkcmVuLFxyXG5cdFx0XHRcdFx0bm9kZXM6IFtub2RlXVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXJzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0Y2FjaGVkLnZpZXdzID0gdmlld3NcclxuXHRcdFx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQgJiYgY29udHJvbGxlci5vbnVubG9hZC4kb2xkKSBjb250cm9sbGVyLm9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZC4kb2xkXHJcblx0XHRcdFx0XHRcdGlmIChwZW5kaW5nUmVxdWVzdHMgJiYgY29udHJvbGxlci5vbnVubG9hZCkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBvbnVubG9hZCA9IGNvbnRyb2xsZXIub251bmxvYWRcclxuXHRcdFx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkID0gbm9vcFxyXG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQuJG9sZCA9IG9udW5sb2FkXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5jaGlsZHJlbiAmJiAhY2FjaGVkLmNoaWxkcmVuLm5vZGVzKSBjYWNoZWQuY2hpbGRyZW4ubm9kZXMgPSBbXTtcclxuXHRcdFx0XHQvL2VkZ2UgY2FzZTogc2V0dGluZyB2YWx1ZSBvbiA8c2VsZWN0PiBkb2Vzbid0IHdvcmsgYmVmb3JlIGNoaWxkcmVuIGV4aXN0LCBzbyBzZXQgaXQgYWdhaW4gYWZ0ZXIgY2hpbGRyZW4gaGF2ZSBiZWVuIGNyZWF0ZWRcclxuXHRcdFx0XHRpZiAoZGF0YS50YWcgPT09IFwic2VsZWN0XCIgJiYgXCJ2YWx1ZVwiIGluIGRhdGEuYXR0cnMpIHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIHt2YWx1ZTogZGF0YS5hdHRycy52YWx1ZX0sIHt9LCBuYW1lc3BhY2UpO1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRub2RlID0gY2FjaGVkLm5vZGVzWzBdO1xyXG5cdFx0XHRcdGlmIChoYXNLZXlzKSBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCBjYWNoZWQuYXR0cnMsIG5hbWVzcGFjZSk7XHJcblx0XHRcdFx0Y2FjaGVkLmNoaWxkcmVuID0gYnVpbGQobm9kZSwgZGF0YS50YWcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBkYXRhLmNoaWxkcmVuLCBjYWNoZWQuY2hpbGRyZW4sIGZhbHNlLCAwLCBkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKTtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZTtcclxuXHRcdFx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRjYWNoZWQudmlld3MgPSB2aWV3c1xyXG5cdFx0XHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHNob3VsZFJlYXR0YWNoID09PSB0cnVlICYmIG5vZGUgIT0gbnVsbCkgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vc2NoZWR1bGUgY29uZmlncyB0byBiZSBjYWxsZWQuIFRoZXkgYXJlIGNhbGxlZCBhZnRlciBgYnVpbGRgIGZpbmlzaGVzIHJ1bm5pbmdcclxuXHRcdFx0aWYgKHR5cGVvZiBkYXRhLmF0dHJzW1wiY29uZmlnXCJdID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHZhciBjb250ZXh0ID0gY2FjaGVkLmNvbmZpZ0NvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCB8fCB7fTtcclxuXHJcblx0XHRcdFx0Ly8gYmluZFxyXG5cdFx0XHRcdHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGRhdGEsIGFyZ3MpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGRhdGEuYXR0cnNbXCJjb25maWdcIl0uYXBwbHkoZGF0YSwgYXJncylcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGNvbmZpZ3MucHVzaChjYWxsYmFjayhkYXRhLCBbbm9kZSwgIWlzTmV3LCBjb250ZXh0LCBjYWNoZWRdKSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGRhdGEgIT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0Ly9oYW5kbGUgdGV4dCBub2Rlc1xyXG5cdFx0XHR2YXIgbm9kZXM7XHJcblx0XHRcdGlmIChjYWNoZWQubm9kZXMubGVuZ3RoID09PSAwKSB7XHJcblx0XHRcdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRub2RlcyA9IFskZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSldO1xyXG5cdFx0XHRcdFx0aWYgKCFwYXJlbnRFbGVtZW50Lm5vZGVOYW1lLm1hdGNoKHZvaWRFbGVtZW50cykpIHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGVzWzBdLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhY2hlZCA9IFwic3RyaW5nIG51bWJlciBib29sZWFuXCIuaW5kZXhPZih0eXBlb2YgZGF0YSkgPiAtMSA/IG5ldyBkYXRhLmNvbnN0cnVjdG9yKGRhdGEpIDogZGF0YTtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKGNhY2hlZC52YWx1ZU9mKCkgIT09IGRhdGEudmFsdWVPZigpIHx8IHNob3VsZFJlYXR0YWNoID09PSB0cnVlKSB7XHJcblx0XHRcdFx0bm9kZXMgPSBjYWNoZWQubm9kZXM7XHJcblx0XHRcdFx0aWYgKCFlZGl0YWJsZSB8fCBlZGl0YWJsZSAhPT0gJGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHtcclxuXHRcdFx0XHRcdGlmIChkYXRhLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0XHRcdGNsZWFyKG5vZGVzLCBjYWNoZWQpO1xyXG5cdFx0XHRcdFx0XHRub2RlcyA9IGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0Ly9jb3JuZXIgY2FzZTogcmVwbGFjaW5nIHRoZSBub2RlVmFsdWUgb2YgYSB0ZXh0IG5vZGUgdGhhdCBpcyBhIGNoaWxkIG9mIGEgdGV4dGFyZWEvY29udGVudGVkaXRhYmxlIGRvZXNuJ3Qgd29ya1xyXG5cdFx0XHRcdFx0XHQvL3dlIG5lZWQgdG8gdXBkYXRlIHRoZSB2YWx1ZSBwcm9wZXJ0eSBvZiB0aGUgcGFyZW50IHRleHRhcmVhIG9yIHRoZSBpbm5lckhUTUwgb2YgdGhlIGNvbnRlbnRlZGl0YWJsZSBlbGVtZW50IGluc3RlYWRcclxuXHRcdFx0XHRcdFx0aWYgKHBhcmVudFRhZyA9PT0gXCJ0ZXh0YXJlYVwiKSBwYXJlbnRFbGVtZW50LnZhbHVlID0gZGF0YTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoZWRpdGFibGUpIGVkaXRhYmxlLmlubmVySFRNTCA9IGRhdGE7XHJcblx0XHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChub2Rlc1swXS5ub2RlVHlwZSA9PT0gMSB8fCBub2Rlcy5sZW5ndGggPiAxKSB7IC8vd2FzIGEgdHJ1c3RlZCBzdHJpbmdcclxuXHRcdFx0XHRcdFx0XHRcdGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKTtcclxuXHRcdFx0XHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZXNbMF0sIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbCk7XHJcblx0XHRcdFx0XHRcdFx0bm9kZXNbMF0ubm9kZVZhbHVlID0gZGF0YVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhY2hlZCA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yKGRhdGEpO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBjYWNoZWRcclxuXHR9XHJcblx0ZnVuY3Rpb24gc29ydENoYW5nZXMoYSwgYikge3JldHVybiBhLmFjdGlvbiAtIGIuYWN0aW9uIHx8IGEuaW5kZXggLSBiLmluZGV4fVxyXG5cdGZ1bmN0aW9uIHNldEF0dHJpYnV0ZXMobm9kZSwgdGFnLCBkYXRhQXR0cnMsIGNhY2hlZEF0dHJzLCBuYW1lc3BhY2UpIHtcclxuXHRcdGZvciAodmFyIGF0dHJOYW1lIGluIGRhdGFBdHRycykge1xyXG5cdFx0XHR2YXIgZGF0YUF0dHIgPSBkYXRhQXR0cnNbYXR0ck5hbWVdO1xyXG5cdFx0XHR2YXIgY2FjaGVkQXR0ciA9IGNhY2hlZEF0dHJzW2F0dHJOYW1lXTtcclxuXHRcdFx0aWYgKCEoYXR0ck5hbWUgaW4gY2FjaGVkQXR0cnMpIHx8IChjYWNoZWRBdHRyICE9PSBkYXRhQXR0cikpIHtcclxuXHRcdFx0XHRjYWNoZWRBdHRyc1thdHRyTmFtZV0gPSBkYXRhQXR0cjtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly9gY29uZmlnYCBpc24ndCBhIHJlYWwgYXR0cmlidXRlcywgc28gaWdub3JlIGl0XHJcblx0XHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IFwiY29uZmlnXCIgfHwgYXR0ck5hbWUgPT0gXCJrZXlcIikgY29udGludWU7XHJcblx0XHRcdFx0XHQvL2hvb2sgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIGF1dG8tcmVkcmF3aW5nIHN5c3RlbVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIGRhdGFBdHRyID09PSBGVU5DVElPTiAmJiBhdHRyTmFtZS5pbmRleE9mKFwib25cIikgPT09IDApIHtcclxuXHRcdFx0XHRcdFx0bm9kZVthdHRyTmFtZV0gPSBhdXRvcmVkcmF3KGRhdGFBdHRyLCBub2RlKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9oYW5kbGUgYHN0eWxlOiB7Li4ufWBcclxuXHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInN0eWxlXCIgJiYgZGF0YUF0dHIgIT0gbnVsbCAmJiB0eXBlLmNhbGwoZGF0YUF0dHIpID09PSBPQkpFQ1QpIHtcclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcnVsZSBpbiBkYXRhQXR0cikge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChjYWNoZWRBdHRyID09IG51bGwgfHwgY2FjaGVkQXR0cltydWxlXSAhPT0gZGF0YUF0dHJbcnVsZV0pIG5vZGUuc3R5bGVbcnVsZV0gPSBkYXRhQXR0cltydWxlXVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGZvciAodmFyIHJ1bGUgaW4gY2FjaGVkQXR0cikge1xyXG5cdFx0XHRcdFx0XHRcdGlmICghKHJ1bGUgaW4gZGF0YUF0dHIpKSBub2RlLnN0eWxlW3J1bGVdID0gXCJcIlxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBTVkdcclxuXHRcdFx0XHRcdGVsc2UgaWYgKG5hbWVzcGFjZSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gXCJocmVmXCIpIG5vZGUuc2V0QXR0cmlidXRlTlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsIFwiaHJlZlwiLCBkYXRhQXR0cik7XHJcblx0XHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcImNsYXNzTmFtZVwiKSBub2RlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGRhdGFBdHRyKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBjYXNlcyB0aGF0IGFyZSBwcm9wZXJ0aWVzIChidXQgaWdub3JlIGNhc2VzIHdoZXJlIHdlIHNob3VsZCB1c2Ugc2V0QXR0cmlidXRlIGluc3RlYWQpXHJcblx0XHRcdFx0XHQvLy0gbGlzdCBhbmQgZm9ybSBhcmUgdHlwaWNhbGx5IHVzZWQgYXMgc3RyaW5ncywgYnV0IGFyZSBET00gZWxlbWVudCByZWZlcmVuY2VzIGluIGpzXHJcblx0XHRcdFx0XHQvLy0gd2hlbiB1c2luZyBDU1Mgc2VsZWN0b3JzIChlLmcuIGBtKFwiW3N0eWxlPScnXVwiKWApLCBzdHlsZSBpcyB1c2VkIGFzIGEgc3RyaW5nLCBidXQgaXQncyBhbiBvYmplY3QgaW4ganNcclxuXHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lIGluIG5vZGUgJiYgIShhdHRyTmFtZSA9PT0gXCJsaXN0XCIgfHwgYXR0ck5hbWUgPT09IFwic3R5bGVcIiB8fCBhdHRyTmFtZSA9PT0gXCJmb3JtXCIgfHwgYXR0ck5hbWUgPT09IFwidHlwZVwiIHx8IGF0dHJOYW1lID09PSBcIndpZHRoXCIgfHwgYXR0ck5hbWUgPT09IFwiaGVpZ2h0XCIpKSB7XHJcblx0XHRcdFx0XHRcdC8vIzM0OCBkb24ndCBzZXQgdGhlIHZhbHVlIGlmIG5vdCBuZWVkZWQgb3RoZXJ3aXNlIGN1cnNvciBwbGFjZW1lbnQgYnJlYWtzIGluIENocm9tZVxyXG5cdFx0XHRcdFx0XHRpZiAodGFnICE9PSBcImlucHV0XCIgfHwgbm9kZVthdHRyTmFtZV0gIT09IGRhdGFBdHRyKSBub2RlW2F0dHJOYW1lXSA9IGRhdGFBdHRyXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdC8vc3dhbGxvdyBJRSdzIGludmFsaWQgYXJndW1lbnQgZXJyb3JzIHRvIG1pbWljIEhUTUwncyBmYWxsYmFjay10by1kb2luZy1ub3RoaW5nLW9uLWludmFsaWQtYXR0cmlidXRlcyBiZWhhdmlvclxyXG5cdFx0XHRcdFx0aWYgKGUubWVzc2FnZS5pbmRleE9mKFwiSW52YWxpZCBhcmd1bWVudFwiKSA8IDApIHRocm93IGVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8jMzQ4IGRhdGFBdHRyIG1heSBub3QgYmUgYSBzdHJpbmcsIHNvIHVzZSBsb29zZSBjb21wYXJpc29uIChkb3VibGUgZXF1YWwpIGluc3RlYWQgb2Ygc3RyaWN0ICh0cmlwbGUgZXF1YWwpXHJcblx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInZhbHVlXCIgJiYgdGFnID09PSBcImlucHV0XCIgJiYgbm9kZS52YWx1ZSAhPSBkYXRhQXR0cikge1xyXG5cdFx0XHRcdG5vZGUudmFsdWUgPSBkYXRhQXR0clxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY2FjaGVkQXR0cnNcclxuXHR9XHJcblx0ZnVuY3Rpb24gY2xlYXIobm9kZXMsIGNhY2hlZCkge1xyXG5cdFx0Zm9yICh2YXIgaSA9IG5vZGVzLmxlbmd0aCAtIDE7IGkgPiAtMTsgaS0tKSB7XHJcblx0XHRcdGlmIChub2Rlc1tpXSAmJiBub2Rlc1tpXS5wYXJlbnROb2RlKSB7XHJcblx0XHRcdFx0dHJ5IHtub2Rlc1tpXS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGVzW2ldKX1cclxuXHRcdFx0XHRjYXRjaCAoZSkge30gLy9pZ25vcmUgaWYgdGhpcyBmYWlscyBkdWUgdG8gb3JkZXIgb2YgZXZlbnRzIChzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMTkyNjA4My9mYWlsZWQtdG8tZXhlY3V0ZS1yZW1vdmVjaGlsZC1vbi1ub2RlKVxyXG5cdFx0XHRcdGNhY2hlZCA9IFtdLmNvbmNhdChjYWNoZWQpO1xyXG5cdFx0XHRcdGlmIChjYWNoZWRbaV0pIHVubG9hZChjYWNoZWRbaV0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChub2Rlcy5sZW5ndGggIT0gMCkgbm9kZXMubGVuZ3RoID0gMFxyXG5cdH1cclxuXHRmdW5jdGlvbiB1bmxvYWQoY2FjaGVkKSB7XHJcblx0XHRpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgdHlwZW9mIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCgpO1xyXG5cdFx0XHRjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCA9IG51bGxcclxuXHRcdH1cclxuXHRcdGlmIChjYWNoZWQuY29udHJvbGxlcnMpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNvbnRyb2xsZXI7IGNvbnRyb2xsZXIgPSBjYWNoZWQuY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgY29udHJvbGxlci5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNvbnRyb2xsZXIub251bmxvYWQoe3ByZXZlbnREZWZhdWx0OiBub29wfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChjYWNoZWQuY2hpbGRyZW4pIHtcclxuXHRcdFx0aWYgKHR5cGUuY2FsbChjYWNoZWQuY2hpbGRyZW4pID09PSBBUlJBWSkge1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjaGlsZDsgY2hpbGQgPSBjYWNoZWQuY2hpbGRyZW5baV07IGkrKykgdW5sb2FkKGNoaWxkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKGNhY2hlZC5jaGlsZHJlbi50YWcpIHVubG9hZChjYWNoZWQuY2hpbGRyZW4pXHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpIHtcclxuXHRcdHZhciBuZXh0U2libGluZyA9IHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF07XHJcblx0XHRpZiAobmV4dFNpYmxpbmcpIHtcclxuXHRcdFx0dmFyIGlzRWxlbWVudCA9IG5leHRTaWJsaW5nLm5vZGVUeXBlICE9IDE7XHJcblx0XHRcdHZhciBwbGFjZWhvbGRlciA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuXHRcdFx0aWYgKGlzRWxlbWVudCkge1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyLCBuZXh0U2libGluZyB8fCBudWxsKTtcclxuXHRcdFx0XHRwbGFjZWhvbGRlci5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKTtcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgbmV4dFNpYmxpbmcuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlYmVnaW5cIiwgZGF0YSlcclxuXHRcdH1cclxuXHRcdGVsc2UgcGFyZW50RWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmVlbmRcIiwgZGF0YSk7XHJcblx0XHR2YXIgbm9kZXMgPSBbXTtcclxuXHRcdHdoaWxlIChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdICE9PSBuZXh0U2libGluZykge1xyXG5cdFx0XHRub2Rlcy5wdXNoKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0pO1xyXG5cdFx0XHRpbmRleCsrXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbm9kZXNcclxuXHR9XHJcblx0ZnVuY3Rpb24gYXV0b3JlZHJhdyhjYWxsYmFjaywgb2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpO1xyXG5cdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0dHJ5IHtyZXR1cm4gY2FsbGJhY2suY2FsbChvYmplY3QsIGUpfVxyXG5cdFx0XHRmaW5hbGx5IHtcclxuXHRcdFx0XHRlbmRGaXJzdENvbXB1dGF0aW9uKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGh0bWw7XHJcblx0dmFyIGRvY3VtZW50Tm9kZSA9IHtcclxuXHRcdGFwcGVuZENoaWxkOiBmdW5jdGlvbihub2RlKSB7XHJcblx0XHRcdGlmIChodG1sID09PSB1bmRlZmluZWQpIGh0bWwgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImh0bWxcIik7XHJcblx0XHRcdGlmICgkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgIT09IG5vZGUpIHtcclxuXHRcdFx0XHQkZG9jdW1lbnQucmVwbGFjZUNoaWxkKG5vZGUsICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSAkZG9jdW1lbnQuYXBwZW5kQ2hpbGQobm9kZSk7XHJcblx0XHRcdHRoaXMuY2hpbGROb2RlcyA9ICRkb2N1bWVudC5jaGlsZE5vZGVzXHJcblx0XHR9LFxyXG5cdFx0aW5zZXJ0QmVmb3JlOiBmdW5jdGlvbihub2RlKSB7XHJcblx0XHRcdHRoaXMuYXBwZW5kQ2hpbGQobm9kZSlcclxuXHRcdH0sXHJcblx0XHRjaGlsZE5vZGVzOiBbXVxyXG5cdH07XHJcblx0dmFyIG5vZGVDYWNoZSA9IFtdLCBjZWxsQ2FjaGUgPSB7fTtcclxuXHRtLnJlbmRlciA9IGZ1bmN0aW9uKHJvb3QsIGNlbGwsIGZvcmNlUmVjcmVhdGlvbikge1xyXG5cdFx0dmFyIGNvbmZpZ3MgPSBbXTtcclxuXHRcdGlmICghcm9vdCkgdGhyb3cgbmV3IEVycm9yKFwiRW5zdXJlIHRoZSBET00gZWxlbWVudCBiZWluZyBwYXNzZWQgdG8gbS5yb3V0ZS9tLm1vdW50L20ucmVuZGVyIGlzIG5vdCB1bmRlZmluZWQuXCIpO1xyXG5cdFx0dmFyIGlkID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpO1xyXG5cdFx0dmFyIGlzRG9jdW1lbnRSb290ID0gcm9vdCA9PT0gJGRvY3VtZW50O1xyXG5cdFx0dmFyIG5vZGUgPSBpc0RvY3VtZW50Um9vdCB8fCByb290ID09PSAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ID8gZG9jdW1lbnROb2RlIDogcm9vdDtcclxuXHRcdGlmIChpc0RvY3VtZW50Um9vdCAmJiBjZWxsLnRhZyAhPSBcImh0bWxcIikgY2VsbCA9IHt0YWc6IFwiaHRtbFwiLCBhdHRyczoge30sIGNoaWxkcmVuOiBjZWxsfTtcclxuXHRcdGlmIChjZWxsQ2FjaGVbaWRdID09PSB1bmRlZmluZWQpIGNsZWFyKG5vZGUuY2hpbGROb2Rlcyk7XHJcblx0XHRpZiAoZm9yY2VSZWNyZWF0aW9uID09PSB0cnVlKSByZXNldChyb290KTtcclxuXHRcdGNlbGxDYWNoZVtpZF0gPSBidWlsZChub2RlLCBudWxsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2VsbCwgY2VsbENhY2hlW2lkXSwgZmFsc2UsIDAsIG51bGwsIHVuZGVmaW5lZCwgY29uZmlncyk7XHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gY29uZmlncy5sZW5ndGg7IGkgPCBsZW47IGkrKykgY29uZmlnc1tpXSgpXHJcblx0fTtcclxuXHRmdW5jdGlvbiBnZXRDZWxsQ2FjaGVLZXkoZWxlbWVudCkge1xyXG5cdFx0dmFyIGluZGV4ID0gbm9kZUNhY2hlLmluZGV4T2YoZWxlbWVudCk7XHJcblx0XHRyZXR1cm4gaW5kZXggPCAwID8gbm9kZUNhY2hlLnB1c2goZWxlbWVudCkgLSAxIDogaW5kZXhcclxuXHR9XHJcblxyXG5cdG0udHJ1c3QgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0dmFsdWUgPSBuZXcgU3RyaW5nKHZhbHVlKTtcclxuXHRcdHZhbHVlLiR0cnVzdGVkID0gdHJ1ZTtcclxuXHRcdHJldHVybiB2YWx1ZVxyXG5cdH07XHJcblxyXG5cdGZ1bmN0aW9uIGdldHRlcnNldHRlcihzdG9yZSkge1xyXG5cdFx0dmFyIHByb3AgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGgpIHN0b3JlID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH07XHJcblxyXG5cdFx0cHJvcC50b0pTT04gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIHN0b3JlXHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBwcm9wXHJcblx0fVxyXG5cclxuXHRtLnByb3AgPSBmdW5jdGlvbiAoc3RvcmUpIHtcclxuXHRcdC8vbm90ZTogdXNpbmcgbm9uLXN0cmljdCBlcXVhbGl0eSBjaGVjayBoZXJlIGJlY2F1c2Ugd2UncmUgY2hlY2tpbmcgaWYgc3RvcmUgaXMgbnVsbCBPUiB1bmRlZmluZWRcclxuXHRcdGlmICgoKHN0b3JlICE9IG51bGwgJiYgdHlwZS5jYWxsKHN0b3JlKSA9PT0gT0JKRUNUKSB8fCB0eXBlb2Ygc3RvcmUgPT09IEZVTkNUSU9OKSAmJiB0eXBlb2Ygc3RvcmUudGhlbiA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0cmV0dXJuIHByb3BpZnkoc3RvcmUpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGdldHRlcnNldHRlcihzdG9yZSlcclxuXHR9O1xyXG5cclxuXHR2YXIgcm9vdHMgPSBbXSwgY29tcG9uZW50cyA9IFtdLCBjb250cm9sbGVycyA9IFtdLCBsYXN0UmVkcmF3SWQgPSBudWxsLCBsYXN0UmVkcmF3Q2FsbFRpbWUgPSAwLCBjb21wdXRlUHJlUmVkcmF3SG9vayA9IG51bGwsIGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGwsIHByZXZlbnRlZCA9IGZhbHNlLCB0b3BDb21wb25lbnQsIHVubG9hZGVycyA9IFtdO1xyXG5cdHZhciBGUkFNRV9CVURHRVQgPSAxNjsgLy82MCBmcmFtZXMgcGVyIHNlY29uZCA9IDEgY2FsbCBwZXIgMTYgbXNcclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBhcmdzKSB7XHJcblx0XHR2YXIgY29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gKGNvbXBvbmVudC5jb250cm9sbGVyIHx8IG5vb3ApLmFwcGx5KHRoaXMsIGFyZ3MpIHx8IHRoaXNcclxuXHRcdH1cclxuXHRcdHZhciB2aWV3ID0gZnVuY3Rpb24oY3RybCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIGFyZ3MgPSBhcmdzLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXHJcblx0XHRcdHJldHVybiBjb21wb25lbnQudmlldy5hcHBseShjb21wb25lbnQsIGFyZ3MgPyBbY3RybF0uY29uY2F0KGFyZ3MpIDogW2N0cmxdKVxyXG5cdFx0fVxyXG5cdFx0dmlldy4kb3JpZ2luYWwgPSBjb21wb25lbnQudmlld1xyXG5cdFx0dmFyIG91dHB1dCA9IHtjb250cm9sbGVyOiBjb250cm9sbGVyLCB2aWV3OiB2aWV3fVxyXG5cdFx0aWYgKGFyZ3NbMF0gJiYgYXJnc1swXS5rZXkgIT0gbnVsbCkgb3V0cHV0LmF0dHJzID0ge2tleTogYXJnc1swXS5rZXl9XHJcblx0XHRyZXR1cm4gb3V0cHV0XHJcblx0fVxyXG5cdG0uY29tcG9uZW50ID0gZnVuY3Rpb24oY29tcG9uZW50KSB7XHJcblx0XHRyZXR1cm4gcGFyYW1ldGVyaXplKGNvbXBvbmVudCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxyXG5cdH1cclxuXHRtLm1vdW50ID0gbS5tb2R1bGUgPSBmdW5jdGlvbihyb290LCBjb21wb25lbnQpIHtcclxuXHRcdGlmICghcm9vdCkgdGhyb3cgbmV3IEVycm9yKFwiUGxlYXNlIGVuc3VyZSB0aGUgRE9NIGVsZW1lbnQgZXhpc3RzIGJlZm9yZSByZW5kZXJpbmcgYSB0ZW1wbGF0ZSBpbnRvIGl0LlwiKTtcclxuXHRcdHZhciBpbmRleCA9IHJvb3RzLmluZGV4T2Yocm9vdCk7XHJcblx0XHRpZiAoaW5kZXggPCAwKSBpbmRleCA9IHJvb3RzLmxlbmd0aDtcclxuXHRcdFxyXG5cdFx0dmFyIGlzUHJldmVudGVkID0gZmFsc2U7XHJcblx0XHR2YXIgZXZlbnQgPSB7cHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpc1ByZXZlbnRlZCA9IHRydWU7XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gY29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbDtcclxuXHRcdH19O1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIHVubG9hZGVyOyB1bmxvYWRlciA9IHVubG9hZGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdHVubG9hZGVyLmhhbmRsZXIuY2FsbCh1bmxvYWRlci5jb250cm9sbGVyLCBldmVudClcclxuXHRcdFx0dW5sb2FkZXIuY29udHJvbGxlci5vbnVubG9hZCA9IG51bGxcclxuXHRcdH1cclxuXHRcdGlmIChpc1ByZXZlbnRlZCkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgdW5sb2FkZXI7IHVubG9hZGVyID0gdW5sb2FkZXJzW2ldOyBpKyspIHVubG9hZGVyLmNvbnRyb2xsZXIub251bmxvYWQgPSB1bmxvYWRlci5oYW5kbGVyXHJcblx0XHR9XHJcblx0XHRlbHNlIHVubG9hZGVycyA9IFtdXHJcblx0XHRcclxuXHRcdGlmIChjb250cm9sbGVyc1tpbmRleF0gJiYgdHlwZW9mIGNvbnRyb2xsZXJzW2luZGV4XS5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0Y29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkKGV2ZW50KVxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZiAoIWlzUHJldmVudGVkKSB7XHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiYWxsXCIpO1xyXG5cdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0cm9vdHNbaW5kZXhdID0gcm9vdDtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSBjb21wb25lbnQgPSBzdWJjb21wb25lbnQoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMikpXHJcblx0XHRcdHZhciBjdXJyZW50Q29tcG9uZW50ID0gdG9wQ29tcG9uZW50ID0gY29tcG9uZW50ID0gY29tcG9uZW50IHx8IHtjb250cm9sbGVyOiBmdW5jdGlvbigpIHt9fTtcclxuXHRcdFx0dmFyIGNvbnN0cnVjdG9yID0gY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcFxyXG5cdFx0XHR2YXIgY29udHJvbGxlciA9IG5ldyBjb25zdHJ1Y3RvcjtcclxuXHRcdFx0Ly9jb250cm9sbGVycyBtYXkgY2FsbCBtLm1vdW50IHJlY3Vyc2l2ZWx5ICh2aWEgbS5yb3V0ZSByZWRpcmVjdHMsIGZvciBleGFtcGxlKVxyXG5cdFx0XHQvL3RoaXMgY29uZGl0aW9uYWwgZW5zdXJlcyBvbmx5IHRoZSBsYXN0IHJlY3Vyc2l2ZSBtLm1vdW50IGNhbGwgaXMgYXBwbGllZFxyXG5cdFx0XHRpZiAoY3VycmVudENvbXBvbmVudCA9PT0gdG9wQ29tcG9uZW50KSB7XHJcblx0XHRcdFx0Y29udHJvbGxlcnNbaW5kZXhdID0gY29udHJvbGxlcjtcclxuXHRcdFx0XHRjb21wb25lbnRzW2luZGV4XSA9IGNvbXBvbmVudFxyXG5cdFx0XHR9XHJcblx0XHRcdGVuZEZpcnN0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0cmV0dXJuIGNvbnRyb2xsZXJzW2luZGV4XVxyXG5cdFx0fVxyXG5cdH07XHJcblx0dmFyIHJlZHJhd2luZyA9IGZhbHNlXHJcblx0bS5yZWRyYXcgPSBmdW5jdGlvbihmb3JjZSkge1xyXG5cdFx0aWYgKHJlZHJhd2luZykgcmV0dXJuXHJcblx0XHRyZWRyYXdpbmcgPSB0cnVlXHJcblx0XHQvL2xhc3RSZWRyYXdJZCBpcyBhIHBvc2l0aXZlIG51bWJlciBpZiBhIHNlY29uZCByZWRyYXcgaXMgcmVxdWVzdGVkIGJlZm9yZSB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWVcclxuXHRcdC8vbGFzdFJlZHJhd0lEIGlzIG51bGwgaWYgaXQncyB0aGUgZmlyc3QgcmVkcmF3IGFuZCBub3QgYW4gZXZlbnQgaGFuZGxlclxyXG5cdFx0aWYgKGxhc3RSZWRyYXdJZCAmJiBmb3JjZSAhPT0gdHJ1ZSkge1xyXG5cdFx0XHQvL3doZW4gc2V0VGltZW91dDogb25seSByZXNjaGVkdWxlIHJlZHJhdyBpZiB0aW1lIGJldHdlZW4gbm93IGFuZCBwcmV2aW91cyByZWRyYXcgaXMgYmlnZ2VyIHRoYW4gYSBmcmFtZSwgb3RoZXJ3aXNlIGtlZXAgY3VycmVudGx5IHNjaGVkdWxlZCB0aW1lb3V0XHJcblx0XHRcdC8vd2hlbiByQUY6IGFsd2F5cyByZXNjaGVkdWxlIHJlZHJhd1xyXG5cdFx0XHRpZiAoJHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBuZXcgRGF0ZSAtIGxhc3RSZWRyYXdDYWxsVGltZSA+IEZSQU1FX0JVREdFVCkge1xyXG5cdFx0XHRcdGlmIChsYXN0UmVkcmF3SWQgPiAwKSAkY2FuY2VsQW5pbWF0aW9uRnJhbWUobGFzdFJlZHJhd0lkKTtcclxuXHRcdFx0XHRsYXN0UmVkcmF3SWQgPSAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlZHJhdywgRlJBTUVfQlVER0VUKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmVkcmF3KCk7XHJcblx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7bGFzdFJlZHJhd0lkID0gbnVsbH0sIEZSQU1FX0JVREdFVClcclxuXHRcdH1cclxuXHRcdHJlZHJhd2luZyA9IGZhbHNlXHJcblx0fTtcclxuXHRtLnJlZHJhdy5zdHJhdGVneSA9IG0ucHJvcCgpO1xyXG5cdGZ1bmN0aW9uIHJlZHJhdygpIHtcclxuXHRcdGlmIChjb21wdXRlUHJlUmVkcmF3SG9vaykge1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vaygpXHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIHJvb3Q7IHJvb3QgPSByb290c1tpXTsgaSsrKSB7XHJcblx0XHRcdGlmIChjb250cm9sbGVyc1tpXSkge1xyXG5cdFx0XHRcdHZhciBhcmdzID0gY29tcG9uZW50c1tpXS5jb250cm9sbGVyICYmIGNvbXBvbmVudHNbaV0uY29udHJvbGxlci4kJGFyZ3MgPyBbY29udHJvbGxlcnNbaV1dLmNvbmNhdChjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIuJCRhcmdzKSA6IFtjb250cm9sbGVyc1tpXV1cclxuXHRcdFx0XHRtLnJlbmRlcihyb290LCBjb21wb25lbnRzW2ldLnZpZXcgPyBjb21wb25lbnRzW2ldLnZpZXcoY29udHJvbGxlcnNbaV0sIGFyZ3MpIDogXCJcIilcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly9hZnRlciByZW5kZXJpbmcgd2l0aGluIGEgcm91dGVkIGNvbnRleHQsIHdlIG5lZWQgdG8gc2Nyb2xsIGJhY2sgdG8gdGhlIHRvcCwgYW5kIGZldGNoIHRoZSBkb2N1bWVudCB0aXRsZSBmb3IgaGlzdG9yeS5wdXNoU3RhdGVcclxuXHRcdGlmIChjb21wdXRlUG9zdFJlZHJhd0hvb2spIHtcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rKCk7XHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGxhc3RSZWRyYXdJZCA9IG51bGw7XHJcblx0XHRsYXN0UmVkcmF3Q2FsbFRpbWUgPSBuZXcgRGF0ZTtcclxuXHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdH1cclxuXHJcblx0dmFyIHBlbmRpbmdSZXF1ZXN0cyA9IDA7XHJcblx0bS5zdGFydENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7cGVuZGluZ1JlcXVlc3RzKyt9O1xyXG5cdG0uZW5kQ29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHRcdHBlbmRpbmdSZXF1ZXN0cyA9IE1hdGgubWF4KHBlbmRpbmdSZXF1ZXN0cyAtIDEsIDApO1xyXG5cdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyA9PT0gMCkgbS5yZWRyYXcoKVxyXG5cdH07XHJcblx0dmFyIGVuZEZpcnN0Q29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwibm9uZVwiKSB7XHJcblx0XHRcdHBlbmRpbmdSZXF1ZXN0cy0tXHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBtLmVuZENvbXB1dGF0aW9uKCk7XHJcblx0fVxyXG5cclxuXHRtLndpdGhBdHRyID0gZnVuY3Rpb24ocHJvcCwgd2l0aEF0dHJDYWxsYmFjaykge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IHRoaXM7XHJcblx0XHRcdHdpdGhBdHRyQ2FsbGJhY2socHJvcCBpbiBjdXJyZW50VGFyZ2V0ID8gY3VycmVudFRhcmdldFtwcm9wXSA6IGN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKHByb3ApKVxyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdC8vcm91dGluZ1xyXG5cdHZhciBtb2RlcyA9IHtwYXRobmFtZTogXCJcIiwgaGFzaDogXCIjXCIsIHNlYXJjaDogXCI/XCJ9O1xyXG5cdHZhciByZWRpcmVjdCA9IG5vb3AsIHJvdXRlUGFyYW1zLCBjdXJyZW50Um91dGUsIGlzRGVmYXVsdFJvdXRlID0gZmFsc2U7XHJcblx0bS5yb3V0ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly9tLnJvdXRlKClcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gY3VycmVudFJvdXRlO1xyXG5cdFx0Ly9tLnJvdXRlKGVsLCBkZWZhdWx0Um91dGUsIHJvdXRlcylcclxuXHRcdGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgdHlwZS5jYWxsKGFyZ3VtZW50c1sxXSkgPT09IFNUUklORykge1xyXG5cdFx0XHR2YXIgcm9vdCA9IGFyZ3VtZW50c1swXSwgZGVmYXVsdFJvdXRlID0gYXJndW1lbnRzWzFdLCByb3V0ZXIgPSBhcmd1bWVudHNbMl07XHJcblx0XHRcdHJlZGlyZWN0ID0gZnVuY3Rpb24oc291cmNlKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSBjdXJyZW50Um91dGUgPSBub3JtYWxpemVSb3V0ZShzb3VyY2UpO1xyXG5cdFx0XHRcdGlmICghcm91dGVCeVZhbHVlKHJvb3QsIHJvdXRlciwgcGF0aCkpIHtcclxuXHRcdFx0XHRcdGlmIChpc0RlZmF1bHRSb3V0ZSkgdGhyb3cgbmV3IEVycm9yKFwiRW5zdXJlIHRoZSBkZWZhdWx0IHJvdXRlIG1hdGNoZXMgb25lIG9mIHRoZSByb3V0ZXMgZGVmaW5lZCBpbiBtLnJvdXRlXCIpXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IHRydWVcclxuXHRcdFx0XHRcdG0ucm91dGUoZGVmYXVsdFJvdXRlLCB0cnVlKVxyXG5cdFx0XHRcdFx0aXNEZWZhdWx0Um91dGUgPSBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0dmFyIGxpc3RlbmVyID0gbS5yb3V0ZS5tb2RlID09PSBcImhhc2hcIiA/IFwib25oYXNoY2hhbmdlXCIgOiBcIm9ucG9wc3RhdGVcIjtcclxuXHRcdFx0d2luZG93W2xpc3RlbmVyXSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHZhciBwYXRoID0gJGxvY2F0aW9uW20ucm91dGUubW9kZV1cclxuXHRcdFx0XHRpZiAobS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIpIHBhdGggKz0gJGxvY2F0aW9uLnNlYXJjaFxyXG5cdFx0XHRcdGlmIChjdXJyZW50Um91dGUgIT0gbm9ybWFsaXplUm91dGUocGF0aCkpIHtcclxuXHRcdFx0XHRcdHJlZGlyZWN0KHBhdGgpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbDtcclxuXHRcdFx0d2luZG93W2xpc3RlbmVyXSgpXHJcblx0XHR9XHJcblx0XHQvL2NvbmZpZzogbS5yb3V0ZVxyXG5cdFx0ZWxzZSBpZiAoYXJndW1lbnRzWzBdLmFkZEV2ZW50TGlzdGVuZXIgfHwgYXJndW1lbnRzWzBdLmF0dGFjaEV2ZW50KSB7XHJcblx0XHRcdHZhciBlbGVtZW50ID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHR2YXIgaXNJbml0aWFsaXplZCA9IGFyZ3VtZW50c1sxXTtcclxuXHRcdFx0dmFyIGNvbnRleHQgPSBhcmd1bWVudHNbMl07XHJcblx0XHRcdHZhciB2ZG9tID0gYXJndW1lbnRzWzNdO1xyXG5cdFx0XHRlbGVtZW50LmhyZWYgPSAobS5yb3V0ZS5tb2RlICE9PSAncGF0aG5hbWUnID8gJGxvY2F0aW9uLnBhdGhuYW1lIDogJycpICsgbW9kZXNbbS5yb3V0ZS5tb2RlXSArIHZkb20uYXR0cnMuaHJlZjtcclxuXHRcdFx0aWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG5cdFx0XHRcdGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpO1xyXG5cdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0ZWxlbWVudC5kZXRhY2hFdmVudChcIm9uY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSk7XHJcblx0XHRcdFx0ZWxlbWVudC5hdHRhY2hFdmVudChcIm9uY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly9tLnJvdXRlKHJvdXRlLCBwYXJhbXMsIHNob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkpXHJcblx0XHRlbHNlIGlmICh0eXBlLmNhbGwoYXJndW1lbnRzWzBdKSA9PT0gU1RSSU5HKSB7XHJcblx0XHRcdHZhciBvbGRSb3V0ZSA9IGN1cnJlbnRSb3V0ZTtcclxuXHRcdFx0Y3VycmVudFJvdXRlID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHR2YXIgYXJncyA9IGFyZ3VtZW50c1sxXSB8fCB7fVxyXG5cdFx0XHR2YXIgcXVlcnlJbmRleCA9IGN1cnJlbnRSb3V0ZS5pbmRleE9mKFwiP1wiKVxyXG5cdFx0XHR2YXIgcGFyYW1zID0gcXVlcnlJbmRleCA+IC0xID8gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50Um91dGUuc2xpY2UocXVlcnlJbmRleCArIDEpKSA6IHt9XHJcblx0XHRcdGZvciAodmFyIGkgaW4gYXJncykgcGFyYW1zW2ldID0gYXJnc1tpXVxyXG5cdFx0XHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKHBhcmFtcylcclxuXHRcdFx0dmFyIGN1cnJlbnRQYXRoID0gcXVlcnlJbmRleCA+IC0xID8gY3VycmVudFJvdXRlLnNsaWNlKDAsIHF1ZXJ5SW5kZXgpIDogY3VycmVudFJvdXRlXHJcblx0XHRcdGlmIChxdWVyeXN0cmluZykgY3VycmVudFJvdXRlID0gY3VycmVudFBhdGggKyAoY3VycmVudFBhdGguaW5kZXhPZihcIj9cIikgPT09IC0xID8gXCI/XCIgOiBcIiZcIikgKyBxdWVyeXN0cmluZztcclxuXHJcblx0XHRcdHZhciBzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5ID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgPyBhcmd1bWVudHNbMl0gOiBhcmd1bWVudHNbMV0pID09PSB0cnVlIHx8IG9sZFJvdXRlID09PSBhcmd1bWVudHNbMF07XHJcblxyXG5cdFx0XHRpZiAod2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKSB7XHJcblx0XHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBzZXRTY3JvbGxcclxuXHRcdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHdpbmRvdy5oaXN0b3J5W3Nob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkgPyBcInJlcGxhY2VTdGF0ZVwiIDogXCJwdXNoU3RhdGVcIl0obnVsbCwgJGRvY3VtZW50LnRpdGxlLCBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKTtcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0JGxvY2F0aW9uW20ucm91dGUubW9kZV0gPSBjdXJyZW50Um91dGVcclxuXHRcdFx0XHRyZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxuXHRtLnJvdXRlLnBhcmFtID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0XHRpZiAoIXJvdXRlUGFyYW1zKSB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBjYWxsIG0ucm91dGUoZWxlbWVudCwgZGVmYXVsdFJvdXRlLCByb3V0ZXMpIGJlZm9yZSBjYWxsaW5nIG0ucm91dGUucGFyYW0oKVwiKVxyXG5cdFx0cmV0dXJuIHJvdXRlUGFyYW1zW2tleV1cclxuXHR9O1xyXG5cdG0ucm91dGUubW9kZSA9IFwic2VhcmNoXCI7XHJcblx0ZnVuY3Rpb24gbm9ybWFsaXplUm91dGUocm91dGUpIHtcclxuXHRcdHJldHVybiByb3V0ZS5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aClcclxuXHR9XHJcblx0ZnVuY3Rpb24gcm91dGVCeVZhbHVlKHJvb3QsIHJvdXRlciwgcGF0aCkge1xyXG5cdFx0cm91dGVQYXJhbXMgPSB7fTtcclxuXHJcblx0XHR2YXIgcXVlcnlTdGFydCA9IHBhdGguaW5kZXhPZihcIj9cIik7XHJcblx0XHRpZiAocXVlcnlTdGFydCAhPT0gLTEpIHtcclxuXHRcdFx0cm91dGVQYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKHBhdGguc3Vic3RyKHF1ZXJ5U3RhcnQgKyAxLCBwYXRoLmxlbmd0aCkpO1xyXG5cdFx0XHRwYXRoID0gcGF0aC5zdWJzdHIoMCwgcXVlcnlTdGFydClcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHZXQgYWxsIHJvdXRlcyBhbmQgY2hlY2sgaWYgdGhlcmUnc1xyXG5cdFx0Ly8gYW4gZXhhY3QgbWF0Y2ggZm9yIHRoZSBjdXJyZW50IHBhdGhcclxuXHRcdHZhciBrZXlzID0gT2JqZWN0LmtleXMocm91dGVyKTtcclxuXHRcdHZhciBpbmRleCA9IGtleXMuaW5kZXhPZihwYXRoKTtcclxuXHRcdGlmKGluZGV4ICE9PSAtMSl7XHJcblx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW2tleXMgW2luZGV4XV0pO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKHZhciByb3V0ZSBpbiByb3V0ZXIpIHtcclxuXHRcdFx0aWYgKHJvdXRlID09PSBwYXRoKSB7XHJcblx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoXCJeXCIgKyByb3V0ZS5yZXBsYWNlKC86W15cXC9dKz9cXC57M30vZywgXCIoLio/KVwiKS5yZXBsYWNlKC86W15cXC9dKy9nLCBcIihbXlxcXFwvXSspXCIpICsgXCJcXC8/JFwiKTtcclxuXHJcblx0XHRcdGlmIChtYXRjaGVyLnRlc3QocGF0aCkpIHtcclxuXHRcdFx0XHRwYXRoLnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIga2V5cyA9IHJvdXRlLm1hdGNoKC86W15cXC9dKy9nKSB8fCBbXTtcclxuXHRcdFx0XHRcdHZhciB2YWx1ZXMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgLTIpO1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHJvdXRlUGFyYW1zW2tleXNbaV0ucmVwbGFjZSgvOnxcXC4vZywgXCJcIildID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlc1tpXSlcclxuXHRcdFx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW3JvdXRlXSlcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIHJvdXRlVW5vYnRydXNpdmUoZSkge1xyXG5cdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSB8fCBlLndoaWNoID09PSAyKSByZXR1cm47XHJcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0ZWxzZSBlLnJldHVyblZhbHVlID0gZmFsc2U7XHJcblx0XHR2YXIgY3VycmVudFRhcmdldCA9IGUuY3VycmVudFRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XHJcblx0XHR2YXIgYXJncyA9IG0ucm91dGUubW9kZSA9PT0gXCJwYXRobmFtZVwiICYmIGN1cnJlbnRUYXJnZXQuc2VhcmNoID8gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50VGFyZ2V0LnNlYXJjaC5zbGljZSgxKSkgOiB7fTtcclxuXHRcdHdoaWxlIChjdXJyZW50VGFyZ2V0ICYmIGN1cnJlbnRUYXJnZXQubm9kZU5hbWUudG9VcHBlckNhc2UoKSAhPSBcIkFcIikgY3VycmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZVxyXG5cdFx0bS5yb3V0ZShjdXJyZW50VGFyZ2V0W20ucm91dGUubW9kZV0uc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpLCBhcmdzKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBzZXRTY3JvbGwoKSB7XHJcblx0XHRpZiAobS5yb3V0ZS5tb2RlICE9IFwiaGFzaFwiICYmICRsb2NhdGlvbi5oYXNoKSAkbG9jYXRpb24uaGFzaCA9ICRsb2NhdGlvbi5oYXNoO1xyXG5cdFx0ZWxzZSB3aW5kb3cuc2Nyb2xsVG8oMCwgMClcclxuXHR9XHJcblx0ZnVuY3Rpb24gYnVpbGRRdWVyeVN0cmluZyhvYmplY3QsIHByZWZpeCkge1xyXG5cdFx0dmFyIGR1cGxpY2F0ZXMgPSB7fVxyXG5cdFx0dmFyIHN0ciA9IFtdXHJcblx0XHRmb3IgKHZhciBwcm9wIGluIG9iamVjdCkge1xyXG5cdFx0XHR2YXIga2V5ID0gcHJlZml4ID8gcHJlZml4ICsgXCJbXCIgKyBwcm9wICsgXCJdXCIgOiBwcm9wXHJcblx0XHRcdHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wXVxyXG5cdFx0XHR2YXIgdmFsdWVUeXBlID0gdHlwZS5jYWxsKHZhbHVlKVxyXG5cdFx0XHR2YXIgcGFpciA9ICh2YWx1ZSA9PT0gbnVsbCkgPyBlbmNvZGVVUklDb21wb25lbnQoa2V5KSA6XHJcblx0XHRcdFx0dmFsdWVUeXBlID09PSBPQkpFQ1QgPyBidWlsZFF1ZXJ5U3RyaW5nKHZhbHVlLCBrZXkpIDpcclxuXHRcdFx0XHR2YWx1ZVR5cGUgPT09IEFSUkFZID8gdmFsdWUucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIGl0ZW0pIHtcclxuXHRcdFx0XHRcdGlmICghZHVwbGljYXRlc1trZXldKSBkdXBsaWNhdGVzW2tleV0gPSB7fVxyXG5cdFx0XHRcdFx0aWYgKCFkdXBsaWNhdGVzW2tleV1baXRlbV0pIHtcclxuXHRcdFx0XHRcdFx0ZHVwbGljYXRlc1trZXldW2l0ZW1dID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gbWVtby5jb25jYXQoZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudChpdGVtKSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBtZW1vXHJcblx0XHRcdFx0fSwgW10pLmpvaW4oXCImXCIpIDpcclxuXHRcdFx0XHRlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKVxyXG5cdFx0XHRpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkgc3RyLnB1c2gocGFpcilcclxuXHRcdH1cclxuXHRcdHJldHVybiBzdHIuam9pbihcIiZcIilcclxuXHR9XHJcblx0ZnVuY3Rpb24gcGFyc2VRdWVyeVN0cmluZyhzdHIpIHtcclxuXHRcdGlmIChzdHIuY2hhckF0KDApID09PSBcIj9cIikgc3RyID0gc3RyLnN1YnN0cmluZygxKTtcclxuXHRcdFxyXG5cdFx0dmFyIHBhaXJzID0gc3RyLnNwbGl0KFwiJlwiKSwgcGFyYW1zID0ge307XHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gcGFpcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0dmFyIHBhaXIgPSBwYWlyc1tpXS5zcGxpdChcIj1cIik7XHJcblx0XHRcdHZhciBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQocGFpclswXSlcclxuXHRcdFx0dmFyIHZhbHVlID0gcGFpci5sZW5ndGggPT0gMiA/IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKSA6IG51bGxcclxuXHRcdFx0aWYgKHBhcmFtc1trZXldICE9IG51bGwpIHtcclxuXHRcdFx0XHRpZiAodHlwZS5jYWxsKHBhcmFtc1trZXldKSAhPT0gQVJSQVkpIHBhcmFtc1trZXldID0gW3BhcmFtc1trZXldXVxyXG5cdFx0XHRcdHBhcmFtc1trZXldLnB1c2godmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBwYXJhbXNba2V5XSA9IHZhbHVlXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcGFyYW1zXHJcblx0fVxyXG5cdG0ucm91dGUuYnVpbGRRdWVyeVN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmdcclxuXHRtLnJvdXRlLnBhcnNlUXVlcnlTdHJpbmcgPSBwYXJzZVF1ZXJ5U3RyaW5nXHJcblx0XHJcblx0ZnVuY3Rpb24gcmVzZXQocm9vdCkge1xyXG5cdFx0dmFyIGNhY2hlS2V5ID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpO1xyXG5cdFx0Y2xlYXIocm9vdC5jaGlsZE5vZGVzLCBjZWxsQ2FjaGVbY2FjaGVLZXldKTtcclxuXHRcdGNlbGxDYWNoZVtjYWNoZUtleV0gPSB1bmRlZmluZWRcclxuXHR9XHJcblxyXG5cdG0uZGVmZXJyZWQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuXHRcdGRlZmVycmVkLnByb21pc2UgPSBwcm9waWZ5KGRlZmVycmVkLnByb21pc2UpO1xyXG5cdFx0cmV0dXJuIGRlZmVycmVkXHJcblx0fTtcclxuXHRmdW5jdGlvbiBwcm9waWZ5KHByb21pc2UsIGluaXRpYWxWYWx1ZSkge1xyXG5cdFx0dmFyIHByb3AgPSBtLnByb3AoaW5pdGlhbFZhbHVlKTtcclxuXHRcdHByb21pc2UudGhlbihwcm9wKTtcclxuXHRcdHByb3AudGhlbiA9IGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG5cdFx0XHRyZXR1cm4gcHJvcGlmeShwcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KSwgaW5pdGlhbFZhbHVlKVxyXG5cdFx0fTtcclxuXHRcdHJldHVybiBwcm9wXHJcblx0fVxyXG5cdC8vUHJvbWl6Lm1pdGhyaWwuanMgfCBab2xtZWlzdGVyIHwgTUlUXHJcblx0Ly9hIG1vZGlmaWVkIHZlcnNpb24gb2YgUHJvbWl6LmpzLCB3aGljaCBkb2VzIG5vdCBjb25mb3JtIHRvIFByb21pc2VzL0ErIGZvciB0d28gcmVhc29uczpcclxuXHQvLzEpIGB0aGVuYCBjYWxsYmFja3MgYXJlIGNhbGxlZCBzeW5jaHJvbm91c2x5IChiZWNhdXNlIHNldFRpbWVvdXQgaXMgdG9vIHNsb3csIGFuZCB0aGUgc2V0SW1tZWRpYXRlIHBvbHlmaWxsIGlzIHRvbyBiaWdcclxuXHQvLzIpIHRocm93aW5nIHN1YmNsYXNzZXMgb2YgRXJyb3IgY2F1c2UgdGhlIGVycm9yIHRvIGJlIGJ1YmJsZWQgdXAgaW5zdGVhZCBvZiB0cmlnZ2VyaW5nIHJlamVjdGlvbiAoYmVjYXVzZSB0aGUgc3BlYyBkb2VzIG5vdCBhY2NvdW50IGZvciB0aGUgaW1wb3J0YW50IHVzZSBjYXNlIG9mIGRlZmF1bHQgYnJvd3NlciBlcnJvciBoYW5kbGluZywgaS5lLiBtZXNzYWdlIHcvIGxpbmUgbnVtYmVyKVxyXG5cdGZ1bmN0aW9uIERlZmVycmVkKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XHJcblx0XHR2YXIgUkVTT0xWSU5HID0gMSwgUkVKRUNUSU5HID0gMiwgUkVTT0xWRUQgPSAzLCBSRUpFQ1RFRCA9IDQ7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXMsIHN0YXRlID0gMCwgcHJvbWlzZVZhbHVlID0gMCwgbmV4dCA9IFtdO1xyXG5cclxuXHRcdHNlbGZbXCJwcm9taXNlXCJdID0ge307XHJcblxyXG5cdFx0c2VsZltcInJlc29sdmVcIl0gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkc7XHJcblxyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9O1xyXG5cclxuXHRcdHNlbGZbXCJyZWplY3RcIl0gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblxyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9O1xyXG5cclxuXHRcdHNlbGYucHJvbWlzZVtcInRoZW5cIl0gPSBmdW5jdGlvbihzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaykge1xyXG5cdFx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spO1xyXG5cdFx0XHRpZiAoc3RhdGUgPT09IFJFU09MVkVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoc3RhdGUgPT09IFJFSkVDVEVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRuZXh0LnB1c2goZGVmZXJyZWQpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHRcdH07XHJcblxyXG5cdFx0ZnVuY3Rpb24gZmluaXNoKHR5cGUpIHtcclxuXHRcdFx0c3RhdGUgPSB0eXBlIHx8IFJFSkVDVEVEO1xyXG5cdFx0XHRuZXh0Lm1hcChmdW5jdGlvbihkZWZlcnJlZCkge1xyXG5cdFx0XHRcdHN0YXRlID09PSBSRVNPTFZFRCAmJiBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSkgfHwgZGVmZXJyZWQucmVqZWN0KHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiB0aGVubmFibGUodGhlbiwgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2ssIG5vdFRoZW5uYWJsZUNhbGxiYWNrKSB7XHJcblx0XHRcdGlmICgoKHByb21pc2VWYWx1ZSAhPSBudWxsICYmIHR5cGUuY2FsbChwcm9taXNlVmFsdWUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBwcm9taXNlVmFsdWUgPT09IEZVTkNUSU9OKSAmJiB0eXBlb2YgdGhlbiA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly8gY291bnQgcHJvdGVjdHMgYWdhaW5zdCBhYnVzZSBjYWxscyBmcm9tIHNwZWMgY2hlY2tlclxyXG5cdFx0XHRcdFx0dmFyIGNvdW50ID0gMDtcclxuXHRcdFx0XHRcdHRoZW4uY2FsbChwcm9taXNlVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb3VudCsrKSByZXR1cm47XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRzdWNjZXNzQ2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb3VudCsrKSByZXR1cm47XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRmYWlsdXJlQ2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0XHRmYWlsdXJlQ2FsbGJhY2soKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRub3RUaGVubmFibGVDYWxsYmFjaygpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBmaXJlKCkge1xyXG5cdFx0XHQvLyBjaGVjayBpZiBpdCdzIGEgdGhlbmFibGVcclxuXHRcdFx0dmFyIHRoZW47XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0dGhlbiA9IHByb21pc2VWYWx1ZSAmJiBwcm9taXNlVmFsdWUudGhlblxyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblx0XHRcdFx0cmV0dXJuIGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHRoZW5uYWJsZSh0aGVuLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklORztcclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH0sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRpZiAoc3RhdGUgPT09IFJFU09MVklORyAmJiB0eXBlb2Ygc3VjY2Vzc0NhbGxiYWNrID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBzdWNjZXNzQ2FsbGJhY2socHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoc3RhdGUgPT09IFJFSkVDVElORyAmJiB0eXBlb2YgZmFpbHVyZUNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZmFpbHVyZUNhbGxiYWNrKHByb21pc2VWYWx1ZSk7XHJcblx0XHRcdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCgpXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAocHJvbWlzZVZhbHVlID09PSBzZWxmKSB7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBUeXBlRXJyb3IoKTtcclxuXHRcdFx0XHRcdGZpbmlzaCgpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSwgZmluaXNoLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGZpbmlzaChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0fVxyXG5cdG0uZGVmZXJyZWQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdGlmICh0eXBlLmNhbGwoZSkgPT09IFwiW29iamVjdCBFcnJvcl1cIiAmJiAhZS5jb25zdHJ1Y3Rvci50b1N0cmluZygpLm1hdGNoKC8gRXJyb3IvKSkgdGhyb3cgZVxyXG5cdH07XHJcblxyXG5cdG0uc3luYyA9IGZ1bmN0aW9uKGFyZ3MpIHtcclxuXHRcdHZhciBtZXRob2QgPSBcInJlc29sdmVcIjtcclxuXHRcdGZ1bmN0aW9uIHN5bmNocm9uaXplcihwb3MsIHJlc29sdmVkKSB7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdHJlc3VsdHNbcG9zXSA9IHZhbHVlO1xyXG5cdFx0XHRcdGlmICghcmVzb2x2ZWQpIG1ldGhvZCA9IFwicmVqZWN0XCI7XHJcblx0XHRcdFx0aWYgKC0tb3V0c3RhbmRpbmcgPT09IDApIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnByb21pc2UocmVzdWx0cyk7XHJcblx0XHRcdFx0XHRkZWZlcnJlZFttZXRob2RdKHJlc3VsdHMpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB2YWx1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGRlZmVycmVkID0gbS5kZWZlcnJlZCgpO1xyXG5cdFx0dmFyIG91dHN0YW5kaW5nID0gYXJncy5sZW5ndGg7XHJcblx0XHR2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShvdXRzdGFuZGluZyk7XHJcblx0XHRpZiAoYXJncy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGFyZ3NbaV0udGhlbihzeW5jaHJvbml6ZXIoaSwgdHJ1ZSksIHN5bmNocm9uaXplcihpLCBmYWxzZSkpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgZGVmZXJyZWQucmVzb2x2ZShbXSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7cmV0dXJuIHZhbHVlfVxyXG5cclxuXHRmdW5jdGlvbiBhamF4KG9wdGlvbnMpIHtcclxuXHRcdGlmIChvcHRpb25zLmRhdGFUeXBlICYmIG9wdGlvbnMuZGF0YVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHZhciBjYWxsYmFja0tleSA9IFwibWl0aHJpbF9jYWxsYmFja19cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgXCJfXCIgKyAoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMWUxNikpLnRvU3RyaW5nKDM2KTtcclxuXHRcdFx0dmFyIHNjcmlwdCA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xyXG5cclxuXHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xyXG5cdFx0XHRcdG9wdGlvbnMub25sb2FkKHtcclxuXHRcdFx0XHRcdHR5cGU6IFwibG9hZFwiLFxyXG5cdFx0XHRcdFx0dGFyZ2V0OiB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogcmVzcFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHdpbmRvd1tjYWxsYmFja0tleV0gPSB1bmRlZmluZWRcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcblxyXG5cdFx0XHRcdG9wdGlvbnMub25lcnJvcih7XHJcblx0XHRcdFx0XHR0eXBlOiBcImVycm9yXCIsXHJcblx0XHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdFx0c3RhdHVzOiA1MDAsXHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogSlNPTi5zdHJpbmdpZnkoe2Vycm9yOiBcIkVycm9yIG1ha2luZyBqc29ucCByZXF1ZXN0XCJ9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHdpbmRvd1tjYWxsYmFja0tleV0gPSB1bmRlZmluZWQ7XHJcblxyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjcmlwdC5zcmMgPSBvcHRpb25zLnVybFxyXG5cdFx0XHRcdCsgKG9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpID4gMCA/IFwiJlwiIDogXCI/XCIpXHJcblx0XHRcdFx0KyAob3B0aW9ucy5jYWxsYmFja0tleSA/IG9wdGlvbnMuY2FsbGJhY2tLZXkgOiBcImNhbGxiYWNrXCIpXHJcblx0XHRcdFx0KyBcIj1cIiArIGNhbGxiYWNrS2V5XHJcblx0XHRcdFx0KyBcIiZcIiArIGJ1aWxkUXVlcnlTdHJpbmcob3B0aW9ucy5kYXRhIHx8IHt9KTtcclxuXHRcdFx0JGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHZhciB4aHIgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0O1xyXG5cdFx0XHR4aHIub3BlbihvcHRpb25zLm1ldGhvZCwgb3B0aW9ucy51cmwsIHRydWUsIG9wdGlvbnMudXNlciwgb3B0aW9ucy5wYXNzd29yZCk7XHJcblx0XHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcclxuXHRcdFx0XHRcdGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSBvcHRpb25zLm9ubG9hZCh7dHlwZTogXCJsb2FkXCIsIHRhcmdldDogeGhyfSk7XHJcblx0XHRcdFx0XHRlbHNlIG9wdGlvbnMub25lcnJvcih7dHlwZTogXCJlcnJvclwiLCB0YXJnZXQ6IHhocn0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAob3B0aW9ucy5zZXJpYWxpemUgPT09IEpTT04uc3RyaW5naWZ5ICYmIG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLm1ldGhvZCAhPT0gXCJHRVRcIikge1xyXG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChvcHRpb25zLmRlc2VyaWFsaXplID09PSBKU09OLnBhcnNlKSB7XHJcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJBY2NlcHRcIiwgXCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0LypcIik7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLmNvbmZpZyA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHR2YXIgbWF5YmVYaHIgPSBvcHRpb25zLmNvbmZpZyh4aHIsIG9wdGlvbnMpO1xyXG5cdFx0XHRcdGlmIChtYXliZVhociAhPSBudWxsKSB4aHIgPSBtYXliZVhoclxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgZGF0YSA9IG9wdGlvbnMubWV0aG9kID09PSBcIkdFVFwiIHx8ICFvcHRpb25zLmRhdGEgPyBcIlwiIDogb3B0aW9ucy5kYXRhXHJcblx0XHRcdGlmIChkYXRhICYmICh0eXBlLmNhbGwoZGF0YSkgIT0gU1RSSU5HICYmIGRhdGEuY29uc3RydWN0b3IgIT0gd2luZG93LkZvcm1EYXRhKSkge1xyXG5cdFx0XHRcdHRocm93IFwiUmVxdWVzdCBkYXRhIHNob3VsZCBiZSBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgRm9ybURhdGEuIENoZWNrIHRoZSBgc2VyaWFsaXplYCBvcHRpb24gaW4gYG0ucmVxdWVzdGBcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHR4aHIuc2VuZChkYXRhKTtcclxuXHRcdFx0cmV0dXJuIHhoclxyXG5cdFx0fVxyXG5cdH1cclxuXHRmdW5jdGlvbiBiaW5kRGF0YSh4aHJPcHRpb25zLCBkYXRhLCBzZXJpYWxpemUpIHtcclxuXHRcdGlmICh4aHJPcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiAmJiB4aHJPcHRpb25zLmRhdGFUeXBlICE9IFwianNvbnBcIikge1xyXG5cdFx0XHR2YXIgcHJlZml4ID0geGhyT3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPCAwID8gXCI/XCIgOiBcIiZcIjtcclxuXHRcdFx0dmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhkYXRhKTtcclxuXHRcdFx0eGhyT3B0aW9ucy51cmwgPSB4aHJPcHRpb25zLnVybCArIChxdWVyeXN0cmluZyA/IHByZWZpeCArIHF1ZXJ5c3RyaW5nIDogXCJcIilcclxuXHRcdH1cclxuXHRcdGVsc2UgeGhyT3B0aW9ucy5kYXRhID0gc2VyaWFsaXplKGRhdGEpO1xyXG5cdFx0cmV0dXJuIHhock9wdGlvbnNcclxuXHR9XHJcblx0ZnVuY3Rpb24gcGFyYW1ldGVyaXplVXJsKHVybCwgZGF0YSkge1xyXG5cdFx0dmFyIHRva2VucyA9IHVybC5tYXRjaCgvOlthLXpdXFx3Ky9naSk7XHJcblx0XHRpZiAodG9rZW5zICYmIGRhdGEpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHR2YXIga2V5ID0gdG9rZW5zW2ldLnNsaWNlKDEpO1xyXG5cdFx0XHRcdHVybCA9IHVybC5yZXBsYWNlKHRva2Vuc1tpXSwgZGF0YVtrZXldKTtcclxuXHRcdFx0XHRkZWxldGUgZGF0YVtrZXldXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiB1cmxcclxuXHR9XHJcblxyXG5cdG0ucmVxdWVzdCA9IGZ1bmN0aW9uKHhock9wdGlvbnMpIHtcclxuXHRcdGlmICh4aHJPcHRpb25zLmJhY2tncm91bmQgIT09IHRydWUpIG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKCk7XHJcblx0XHR2YXIgaXNKU09OUCA9IHhock9wdGlvbnMuZGF0YVR5cGUgJiYgeGhyT3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCI7XHJcblx0XHR2YXIgc2VyaWFsaXplID0geGhyT3B0aW9ucy5zZXJpYWxpemUgPSBpc0pTT05QID8gaWRlbnRpdHkgOiB4aHJPcHRpb25zLnNlcmlhbGl6ZSB8fCBKU09OLnN0cmluZ2lmeTtcclxuXHRcdHZhciBkZXNlcmlhbGl6ZSA9IHhock9wdGlvbnMuZGVzZXJpYWxpemUgPSBpc0pTT05QID8gaWRlbnRpdHkgOiB4aHJPcHRpb25zLmRlc2VyaWFsaXplIHx8IEpTT04ucGFyc2U7XHJcblx0XHR2YXIgZXh0cmFjdCA9IGlzSlNPTlAgPyBmdW5jdGlvbihqc29ucCkge3JldHVybiBqc29ucC5yZXNwb25zZVRleHR9IDogeGhyT3B0aW9ucy5leHRyYWN0IHx8IGZ1bmN0aW9uKHhocikge1xyXG5cdFx0XHRyZXR1cm4geGhyLnJlc3BvbnNlVGV4dC5sZW5ndGggPT09IDAgJiYgZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UgPyBudWxsIDogeGhyLnJlc3BvbnNlVGV4dFxyXG5cdFx0fTtcclxuXHRcdHhock9wdGlvbnMubWV0aG9kID0gKHhock9wdGlvbnMubWV0aG9kIHx8ICdHRVQnKS50b1VwcGVyQ2FzZSgpO1xyXG5cdFx0eGhyT3B0aW9ucy51cmwgPSBwYXJhbWV0ZXJpemVVcmwoeGhyT3B0aW9ucy51cmwsIHhock9wdGlvbnMuZGF0YSk7XHJcblx0XHR4aHJPcHRpb25zID0gYmluZERhdGEoeGhyT3B0aW9ucywgeGhyT3B0aW9ucy5kYXRhLCBzZXJpYWxpemUpO1xyXG5cdFx0eGhyT3B0aW9ucy5vbmxvYWQgPSB4aHJPcHRpb25zLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRcdFx0dmFyIHVud3JhcCA9IChlLnR5cGUgPT09IFwibG9hZFwiID8geGhyT3B0aW9ucy51bndyYXBTdWNjZXNzIDogeGhyT3B0aW9ucy51bndyYXBFcnJvcikgfHwgaWRlbnRpdHk7XHJcblx0XHRcdFx0dmFyIHJlc3BvbnNlID0gdW53cmFwKGRlc2VyaWFsaXplKGV4dHJhY3QoZS50YXJnZXQsIHhock9wdGlvbnMpKSwgZS50YXJnZXQpO1xyXG5cdFx0XHRcdGlmIChlLnR5cGUgPT09IFwibG9hZFwiKSB7XHJcblx0XHRcdFx0XHRpZiAodHlwZS5jYWxsKHJlc3BvbnNlKSA9PT0gQVJSQVkgJiYgeGhyT3B0aW9ucy50eXBlKSB7XHJcblx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcmVzcG9uc2UubGVuZ3RoOyBpKyspIHJlc3BvbnNlW2ldID0gbmV3IHhock9wdGlvbnMudHlwZShyZXNwb25zZVtpXSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKHhock9wdGlvbnMudHlwZSkgcmVzcG9uc2UgPSBuZXcgeGhyT3B0aW9ucy50eXBlKHJlc3BvbnNlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkZWZlcnJlZFtlLnR5cGUgPT09IFwibG9hZFwiID8gXCJyZXNvbHZlXCIgOiBcInJlamVjdFwiXShyZXNwb25zZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoeGhyT3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLmVuZENvbXB1dGF0aW9uKClcclxuXHRcdH07XHJcblx0XHRhamF4KHhock9wdGlvbnMpO1xyXG5cdFx0ZGVmZXJyZWQucHJvbWlzZSA9IHByb3BpZnkoZGVmZXJyZWQucHJvbWlzZSwgeGhyT3B0aW9ucy5pbml0aWFsVmFsdWUpO1xyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHR9O1xyXG5cclxuXHQvL3Rlc3RpbmcgQVBJXHJcblx0bS5kZXBzID0gZnVuY3Rpb24obW9jaykge1xyXG5cdFx0aW5pdGlhbGl6ZSh3aW5kb3cgPSBtb2NrIHx8IHdpbmRvdyk7XHJcblx0XHRyZXR1cm4gd2luZG93O1xyXG5cdH07XHJcblx0Ly9mb3IgaW50ZXJuYWwgdGVzdGluZyBvbmx5LCBkbyBub3QgdXNlIGBtLmRlcHMuZmFjdG9yeWBcclxuXHRtLmRlcHMuZmFjdG9yeSA9IGFwcDtcclxuXHJcblx0cmV0dXJuIG1cclxufSkodHlwZW9mIHdpbmRvdyAhPSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pO1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gbTtcclxuZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIGRlZmluZShmdW5jdGlvbigpIHtyZXR1cm4gbX0pO1xyXG4iXX0=
