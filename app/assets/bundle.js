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
    this.typeLoop = bind(this.typeLoop, this);
    this.currentMessage = '';
    this.i = 0;
  }

  TextTyper.prototype.typeLoop = function() {
    this.i++;
    m.redraw();
    if (!this.isDone()) {
      return setTimeout(this.typeLoop, 8);
    }
  };

  TextTyper.prototype.setMessage = function(message) {
    if (message !== this.currentMessage) {
      this.currentMessage = message;
      this.i = 0;
      return setTimeout(this.typeLoop, 8);
    }
  };

  TextTyper.prototype.showAll = function() {
    return this.i = this.currentMessage.length - 1;
  };

  TextTyper.prototype.getTextSoFar = function() {
    return this.currentMessage.slice(0, +this.i + 1 || 9e9);
  };

  TextTyper.prototype.isDone = function() {
    console.log(this.i, this.currentMessage.length - 1);
    return this.i >= this.currentMessage.length - 1;
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
          _this.vm.typer.setMessage(engine.getCurrentMessage());
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
      if (this.vm.typer.isDone()) {
        engine.doCommand(this.vm.command());
        return this.vm.command('');
      } else {
        return this.vm.typer.showAll();
      }
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
      }, m('h1', engine.getCurrentRoomName()), m('p', m.trust(ctrl.vm.typer.getTextSoFar())), engine.getCurrentRoomName() === 'End' ? [
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
  var costumeMatches, helpText, removeAllCostumeItems;
  helpText = "Advance through the game by typing commands like <strong>look, get, and go.</strong><br>\nCommands catalogue and/or pre set command prefix buttons: <strong>Go, talk, get, look, use...</strong><br>\nLook in an area to gain more information or look at objects: <strong>(look fish)</strong><br>\nMove by typing go commands: <strong>(go east)</strong><br>\nEngage in philosophical debate: <strong>(talk sorceress)</strong><br>\nUse items in inventory: <strong>(use lightsaber)</strong><br>\nThere are other commands too and some you can just click on a button to use. Experiment and try things in this beautiful new world before you.<br>\nType <strong>\"help\"</strong> to see this menu again<br>";
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
    } else if (this.matches('help')) {
      return this.print(helpText);
    } else {
      defaultResponses = ['What are you even trying to do?  Just stop.', 'Good one man.', 'Whoa there Eager McBeaver!'];
      return this.print(defaultResponses[Math.floor(Math.random() * defaultResponses.length)]);
    }
  });
  engine.setAfterCommand(function() {
    if (!this.flagIs('have_all_items', true) && this.hasItem('egg') && this.hasItem('flowers') && this.hasItem('baking soda') && this.hasItem('syrup') && this.hasItem('milk') && this.hasItem('margarine')) {
      this.print('"Well, I think I have all the ingredients," you say to yourself. "I just need one of those places where you put them together so it turns into something you can eat. You know, one of those...food preparing rooms."');
      return this.setFlag('have_all_items', true);
    }
  });
  engine.addRoom('Wale vs Sharc: The Comic: The Interactive Software Title For Your Computer Box', function() {
    this.print('Thank you for buying this game!  Type things in the box to make things happen!');
    return this.wait((function(_this) {
      return function() {
        return _this.goToRoom('How To Play');
      };
    })(this));
  });
  engine.addRoom('How To Play', function() {
    this.print(helpText);
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
      if (this.flagIs('talked_to_wale', false)) {
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
      return this.getItem('baking soda');
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
      this.removeItem('baking soda');
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
      return this.print('You enter the Water World gift shop. There are all sorts of great items here: a giant stuffed octopus, dehydrated astronaut fish food, junior marine sheriff badge stickers, and some of that clay sand crap they used to advertise on TV. See anything you like? West to the park entrance.');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kY29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9tYWluLmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC9lbmdpbmUuY29mZmVlIiwiL2hvbWUvZGNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9ub2RlX21vZHVsZXMvYXBwL3RiYWVuZ2luZS9pbmRleC5jb2ZmZWUiLCIvaG9tZS9kY29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL25vZGVfbW9kdWxlcy9hcHAvdGJhZW5naW5lL3N5bm9ueW1zLmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC92aWV3LmNvZmZlZSIsIi9ob21lL2Rjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC93YWxldnNzaGFyYy5jb2ZmZWUiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxlQUFBOztBQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsU0FBUixDQUFKLENBQUE7O0FBQUEsTUFDQSxHQUFTLE9BQUEsQ0FBUSxZQUFSLENBRFQsQ0FBQTs7QUFBQSxJQUVBLEdBQU8sT0FBQSxDQUFRLFVBQVIsQ0FGUCxDQUFBOztBQUFBLENBS0MsQ0FBQyxLQUFGLENBQVEsUUFBUSxDQUFDLElBQWpCLEVBQXVCLElBQXZCLENBTEEsQ0FBQTs7Ozs7QUNBQSxJQUFBLHdCQUFBOztBQUFBLHdCQUFBLEdBQTJCLE9BQUEsQ0FBUSxlQUFSLENBQTNCLENBQUE7O0FBQUEsTUFDTSxDQUFDLE9BQVAsR0FBcUIsSUFBQSx3QkFBQSxDQUFBLENBRHJCLENBQUE7Ozs7O0FDQUEsSUFB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibSA9IHJlcXVpcmUoJ21pdGhyaWwnKVxuZW5naW5lID0gcmVxdWlyZSgnYXBwL2VuZ2luZScpXG52aWV3ID0gcmVxdWlyZSgnYXBwL3ZpZXcnKVxuXG5cbm0ubW91bnQoZG9jdW1lbnQuYm9keSwgdmlldylcbiIsIlRleHRCYXNlZEFkdmVudHVyZUVuZ2luZSA9IHJlcXVpcmUoJ2FwcC90YmFlbmdpbmUnKVxubW9kdWxlLmV4cG9ydHMgPSBuZXcgVGV4dEJhc2VkQWR2ZW50dXJlRW5naW5lKClcbiIsInN5bm9ueW1EYXRhID0gcmVxdWlyZSgnLi9zeW5vbnltcycpXG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBFbmdpbmVcbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgQHJvb21zID0ge31cbiAgICAgICAgQHVuaXZlcnNhbENvbW1hbmRzID0gLT5cbiAgICAgICAgQGFmdGVyQ29tbWFuZCA9IC0+XG5cbiAgICAgICAgQGludmVudG9yeSA9IHt9XG4gICAgICAgIEBjdXJyZW50Um9vbU5hbWUgPSAnJ1xuICAgICAgICBAZmxhZ3MgPSB7fVxuXG4gICAgICAgIEBjb21tYW5kV29yZHMgPSBbXVxuICAgICAgICBAbWVzc2FnZSA9ICcnXG5cbiAgICAgICAgQGNhbGxiYWNrcyA9IFtdXG4gICAgICAgIEBzdGFydFJvb20gPSAnJ1xuXG4gICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBudWxsXG5cbiAgICAgICAgQHByZXZpb3VzQ29tbWFuZHMgPSBbXVxuXG4gICAgc2V0U3RhcnRSb29tOiAocm9vbU5hbWUpIC0+XG4gICAgICAgIEBzdGFydFJvb20gPSByb29tTmFtZVxuXG4gICAgc2V0QWZ0ZXJDb21tYW5kOiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEBhZnRlckNvbW1hbmQgPSBjYWxsYmFjay5iaW5kKEApXG5cbiAgICBzYXZlOiAtPlxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSAncHJvZ3Jlc3MnLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBpbnZlbnRvcnk6IEBpbnZlbnRvcnlcbiAgICAgICAgICAgIGN1cnJlbnRSb29tTmFtZTogQGN1cnJlbnRSb29tTmFtZVxuICAgICAgICAgICAgcHJldmlvdXNDb21tYW5kczogQHByZXZpb3VzQ29tbWFuZHNcbiAgICAgICAgfSlcblxuICAgIGxvYWQ6IC0+XG4gICAgICAgIHRyeVxuICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Byb2dyZXNzJykpXG4gICAgICAgICAgICBAaW52ZW50b3J5ID0gZGF0YS5pbnZlbnRvcnlcbiAgICAgICAgICAgIEBjdXJyZW50Um9vbU5hbWUgPSBkYXRhLmN1cnJlbnRSb29tTmFtZVxuICAgICAgICAgICAgQHByZXZpb3VzQ29tbWFuZHMgPSBkYXRhLnByZXZpb3VzQ29tbWFuZHMgb3IgW11cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGNhdGNoXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBhZGRSb29tOiAocm9vbU5hbWUsIGNhbGxiYWNrKSAtPlxuICAgICAgICBAcm9vbXNbcm9vbU5hbWVdID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgZ2V0Q3VycmVudFJvb21OYW1lOiAtPiBAY3VycmVudFJvb21OYW1lXG5cbiAgICBnZXRDdXJyZW50TWVzc2FnZTogLT4gQG1lc3NhZ2VcblxuICAgIGdldEludmVudG9yeTogLT4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShAaW52ZW50b3J5KSlcblxuICAgIGRvQ29tbWFuZDogKGNvbW1hbmRUZXh0KSAtPlxuICAgICAgICBpZiBAd2FpdENhbGxiYWNrP1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBAd2FpdENhbGxiYWNrXG4gICAgICAgICAgICBAd2FpdENhbGxiYWNrID0gbnVsbFxuICAgICAgICAgICAgY2FsbGJhY2soKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgQHByZXZpb3VzQ29tbWFuZHMucHVzaChjb21tYW5kVGV4dClcblxuICAgICAgICAjIGNsZWFuIHVwIHRoZSBjb21tYW5kIHRleHRcbiAgICAgICAgY29tbWFuZFRleHQgPSBjb21tYW5kVGV4dFxuICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXFcrL2csICcgJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHN7Mix9L2csICcgJylcblxuICAgICAgICAjIGZpbmQgc3lub255bXMgYW5kIHJlcGxhY2UgdGhlbSB3aXRoIHRoZSBjYW5vbmljYWwgd29yZFxuICAgICAgICBmb3IgY2Fubm9uaWNhbFdvcmQsIHN5bm9ueW1zIG9mIHN5bm9ueW1EYXRhXG4gICAgICAgICAgICBmb3Igc3lub255bSBpbiBzeW5vbnltc1xuICAgICAgICAgICAgICAgIGNvbW1hbmRUZXh0ID0gY29tbWFuZFRleHQucmVwbGFjZShzeW5vbnltLCBjYW5ub25pY2FsV29yZClcblxuICAgICAgICBAY29tbWFuZFdvcmRzID0gY29tbWFuZFRleHQuc3BsaXQoJyAnKVxuXG4gICAgICAgIEByb29tc1tAY3VycmVudFJvb21OYW1lXSgpXG4gICAgICAgIEBhZnRlckNvbW1hbmQoKVxuXG4gICAgc2V0VW5pdmVyc2FsQ29tbWFuZHM6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQHVuaXZlcnNhbENvbW1hbmRzID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgdHJ5VW5pdmVyc2FsQ29tbWFuZHM6IC0+XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBtYXRjaGVzOiAocGF0dGVybikgLT5cbiAgICAgICAgIyBJZiBlYWNoIHdvcmQgaW4gdGhlIHNwZWMgY29tbWFuZCBpcyBmb3VuZFxuICAgICAgICAjIGFueXdoZXJlIGluIHRoZSB1c2VyJ3MgaW5wdXQgaXQncyBhIG1hdGNoXG4gICAgICAgIHBhdHRlcm5Xb3JkcyA9IHBhdHRlcm4uc3BsaXQoJyAnKVxuICAgICAgICBmb3IgcGF0dGVybldvcmQgaW4gcGF0dGVybldvcmRzXG4gICAgICAgICAgICBpZiBub3QgKHBhdHRlcm5Xb3JkIGluIEBjb21tYW5kV29yZHMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBoYXNJdGVtOiAoaXRlbSkgLT4gaXRlbSBvZiBAaW52ZW50b3J5XG4gICAgdXNlZEl0ZW06IChpdGVtKSAtPiBpdGVtIG9mIEBpbnZlbnRvcnkgYW5kIEBpbnZlbnRvcnlbaXRlbV0gPT0gJ3VzZWQnXG5cbiAgICBwZXJjZW50Q2hhbmNlOiAoY2hhbmNlKSAtPiBNYXRoLnJhbmRvbSgpIDwgY2hhbmNlIC8gMTAwXG5cbiAgICBmbGFnSXM6IChmbGFnTmFtZSwgdmFsdWUpIC0+IEBmbGFnc1tmbGFnTmFtZV0gPT0gdmFsdWVcblxuICAgIHByaW50OiAodGV4dCkgLT5cbiAgICAgICAgQG1lc3NhZ2UgPSB0ZXh0XG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgZ29Ub1Jvb206IChyb29tTmFtZSkgLT5cbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9IHJvb21OYW1lXG4gICAgICAgIEBkb0NvbW1hbmQoJ2xvb2snKVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdvVG9TdGFydDogLT5cbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9IEBzdGFydFJvb21cbiAgICAgICAgQGRvQ29tbWFuZCgnbG9vaycpXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgc2V0RmxhZzogKGZsYWdOYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgQGZsYWdzW2ZsYWdOYW1lXSA9IHZhbHVlXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgZ2V0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIEBpbnZlbnRvcnlbaXRlbV0gPSAnZ290dGVuJ1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIHJlbW92ZUl0ZW06IChpdGVtKSAtPlxuICAgICAgICBkZWxldGUgQGludmVudG9yeVtpdGVtXVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIHVzZUl0ZW06IChpdGVtKSAtPlxuICAgICAgICBAaW52ZW50b3J5W2l0ZW1dID0gJ3VzZWQnXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgd2FpdDogKGNhbGxiYWNrKSAtPlxuICAgICAgICBAbWVzc2FnZSArPSAnIDxzdHJvbmc+KEhpdCBFbnRlcik8L3N0cm9uZz4nXG4gICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBjYWxsYmFja1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIGxpc3RlbjogKGNhbGxiYWNrKSAtPiBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cbiAgICBub3RpZnk6IC0+IGNhbGxiYWNrKCkgZm9yIGNhbGxiYWNrIGluIEBjYWxsYmFja3NcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgICBsb29rOiBbXG4gICAgICAgICdzZWUnXG4gICAgICAgICdhZG1pcmUnXG4gICAgICAgICdiZWhvbGQnXG4gICAgICAgICdnYXdrJ1xuICAgICAgICAnb2JzZXJ2ZSdcbiAgICAgICAgJ3NweSdcbiAgICBdXG4gICAgdGFrZTogW1xuICAgICAgICAncGljayB1cCdcbiAgICAgICAgJ2dldCdcbiAgICAgICAgJ2FjcXVpcmUnXG4gICAgICAgICdncmFiJ1xuICAgICAgICAnZ3Jhc3AnXG4gICAgICAgICdvYnRhaW4nXG4gICAgICAgICdidXknXG4gICAgICAgICdjaG9vc2UnXG4gICAgXVxuICAgIGdvOiBbXG4gICAgICAgICd3YWxrJ1xuICAgICAgICAncGVyYW1idWxhdGUnXG4gICAgICAgICdmbGVlJ1xuICAgICAgICAnbGVhdmUnXG4gICAgICAgICdtb3ZlJ1xuICAgICAgICAndHJhdmVsJ1xuICAgICAgICAnZGVwYXJ0J1xuICAgICAgICAnZGVjYW1wJ1xuICAgICAgICAnZXhpdCdcbiAgICAgICAgJ2pvdXJuZXknXG4gICAgICAgICdtb3NleSdcbiAgICAgICAgJ3dpdGhkcmF3J1xuICAgIF1cbiAgICBnaXZlOiBbXG4gICAgICAgICdkZWxpdmVyJ1xuICAgICAgICAnZG9uYXRlJ1xuICAgICAgICAnaGFuZCBvdmVyJ1xuICAgICAgICAncHJlc2VudCdcbiAgICAgICAgJ2VuZG93J1xuICAgICAgICAnYmVxdWVhdGgnXG4gICAgICAgICdiZXN0b3cnXG4gICAgICAgICdyZWxpbnF1aXNoJ1xuICAgIF1cbiAgICBnYXJkZW46IFtcbiAgICAgICAgJ3Bsb3QnXG4gICAgICAgICdwbGFudHMnXG4gICAgICAgICdwcm9kdWNlJ1xuICAgIF1cbiIsIm0gPSByZXF1aXJlKCdtaXRocmlsJylcbmVuZ2luZSA9IHJlcXVpcmUoJ2FwcC9lbmdpbmUnKVxuV2FsZVZzU2hhcmMgPSByZXF1aXJlKCdhcHAvd2FsZXZzc2hhcmMnKVxuXG5cblN0cmluZy5wcm90b3R5cGUuY2FwaXRhbGl6ZSA9IC0+XG4gICAgQFswXS50b1VwcGVyQ2FzZSgpICsgQFsxLi5dXG5cblxuY2xhc3MgVGV4dFR5cGVyXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBjdXJyZW50TWVzc2FnZSA9ICcnXG4gICAgICAgIEBpID0gMFxuXG4gICAgdHlwZUxvb3A6ID0+XG4gICAgICAgIEBpKytcbiAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICBpZiBub3QgQGlzRG9uZSgpXG4gICAgICAgICAgICBzZXRUaW1lb3V0KEB0eXBlTG9vcCwgOClcblxuICAgIHNldE1lc3NhZ2U6IChtZXNzYWdlKSAtPlxuICAgICAgICBpZiBtZXNzYWdlICE9IEBjdXJyZW50TWVzc2FnZVxuICAgICAgICAgICAgQGN1cnJlbnRNZXNzYWdlID0gbWVzc2FnZVxuICAgICAgICAgICAgQGkgPSAwXG4gICAgICAgICAgICBzZXRUaW1lb3V0KEB0eXBlTG9vcCwgOClcblxuICAgIHNob3dBbGw6IC0+XG4gICAgICAgIEBpID0gQGN1cnJlbnRNZXNzYWdlLmxlbmd0aCAtIDFcblxuICAgIGdldFRleHRTb0ZhcjogLT5cbiAgICAgICAgQGN1cnJlbnRNZXNzYWdlWy4uQGldXG5cbiAgICBpc0RvbmU6IC0+XG4gICAgICAgIGNvbnNvbGUubG9nKEBpLCBAY3VycmVudE1lc3NhZ2UubGVuZ3RoIC0gMSlcbiAgICAgICAgQGkgPj0gQGN1cnJlbnRNZXNzYWdlLmxlbmd0aCAtIDFcbiAgICBcblxubW9kdWxlLmV4cG9ydHMgPVxuICAgIGNvbnRyb2xsZXI6IGNsYXNzXG4gICAgICAgIGNvbnN0cnVjdG9yOiAtPlxuXG4gICAgICAgICAgICBXYWxlVnNTaGFyYyhlbmdpbmUpXG4gICAgICAgICAgICBkaWRMb2FkID0gZW5naW5lLmxvYWQoKVxuXG4gICAgICAgICAgICBAdm0gPSB7fVxuICAgICAgICAgICAgQHZtLmNvbW1hbmQgPSBtLnByb3AoJycpXG4gICAgICAgICAgICBAdm0udHlwZXIgPSBuZXcgVGV4dFR5cGVyKClcblxuICAgICAgICAgICAgZW5naW5lLmxpc3RlbiA9PlxuICAgICAgICAgICAgICAgIEB2bS50eXBlci5zZXRNZXNzYWdlKGVuZ2luZS5nZXRDdXJyZW50TWVzc2FnZSgpKVxuICAgICAgICAgICAgICAgIG0ucmVkcmF3KClcbiAgICAgICAgICAgICAgICBlbmdpbmUuc2F2ZSgpXG5cbiAgICAgICAgICAgIGlmIGRpZExvYWRcbiAgICAgICAgICAgICAgICBlbmdpbmUuZG9Db21tYW5kKCdsb29rJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBlbmdpbmUuZ29Ub1N0YXJ0KClcblxuICAgICAgICBvbkNvbW1hbmRTdWJtaXQ6IChlKSA9PlxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICBpZiBAdm0udHlwZXIuaXNEb25lKClcbiAgICAgICAgICAgICAgICBlbmdpbmUuZG9Db21tYW5kKEB2bS5jb21tYW5kKCkpXG4gICAgICAgICAgICAgICAgQHZtLmNvbW1hbmQoJycpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHZtLnR5cGVyLnNob3dBbGwoKVxuXG5cbiAgICB2aWV3OiAoY3RybCkgLT5cbiAgICAgICAgW1xuICAgICAgICAgICAgbSAnLnNpZGViYXInLFxuICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCArICdweCdcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcyNjBweCdcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzIwcHgnXG4gICAgICAgICAgICAgICAgbSAnaDInLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblRvcDogMFxuICAgICAgICAgICAgICAgICAgICAnSW52ZW50b3J5J1xuICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgZm9yIGl0ZW1OYW1lLCBzdGF0ZSBvZiBlbmdpbmUuZ2V0SW52ZW50b3J5KClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHN0YXRlID09ICdnb3R0ZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAncCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1OYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHN0YXRlID09ICd1c2VkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbGluZS10aHJvdWdoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtTmFtZVxuICAgICAgICAgICAgICAgICAgICBtICdidXR0b24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljazogLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdTYXZlIGdhbWUgZGVsZXRlZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1Jlc3RhcnQgZ2FtZSdcbiAgICAgICAgICAgICAgICBdXG5cbiAgICAgICAgICAgIG0gJy5jb250ZW50JyxcbiAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICh3aW5kb3cuaW5uZXJXaWR0aCAtIDM2MCkgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcyMHB4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nVG9wOiAwXG4gICAgICAgICAgICAgICAgbSAnaDEnLCBlbmdpbmUuZ2V0Q3VycmVudFJvb21OYW1lKClcbiAgICAgICAgICAgICAgICBtICdwJywgbS50cnVzdChjdHJsLnZtLnR5cGVyLmdldFRleHRTb0ZhcigpKVxuXG4gICAgICAgICAgICAgICAgaWYgZW5naW5lLmdldEN1cnJlbnRSb29tTmFtZSgpID09ICdFbmQnXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2RpdicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2ltZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJy9zaGFyay1zaG93ZXJpbmcucG5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnInXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdicidcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2gzJywgJ0RvIHlvdSBldmVuIGZlZWRiYWNrPydcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2RpdicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAnaWZyYW1lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZm9ybXMvZC8xZHJIS3NmRXpTX3pBMTdZVGQ3T2FXWWlzMVE4SmpmMzNmcjdLNk9jUkJvay92aWV3Zm9ybT9lbWJlZGRlZD10cnVlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzc2MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnNTAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZWJvcmRlcjogJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbmhlaWdodDogJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbndpZHRoOiAnMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMnB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIGdyZXknXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzIwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdMb2FkaW5nLi4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3RleHRhcmVhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICc1MDBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS50cnVzdChlbmdpbmUucHJldmlvdXNDb21tYW5kcy5qb2luKCdcXG4nKSlcbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbSAnZm9ybScsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbnN1Ym1pdDogY3RybC5vbkNvbW1hbmRTdWJtaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2lucHV0W3R5cGU9dGV4dF0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jaGFuZ2U6IG0ud2l0aEF0dHIoJ3ZhbHVlJywgY3RybC52bS5jb21tYW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjdHJsLnZtLmNvbW1hbmQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzogKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBpc0luaXRpYWxpemVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmZvY3VzKClcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvblt0eXBlPXN1Ym1pdF0nLCAnRG8nXG4gICAgICAgIF1cbiIsIlwiXCJcIlxuQ29uZGl0aW9uczpcbiAgICBAbWF0Y2hlcyhwYXR0ZXJuKVxuICAgIEBoYXNJdGVtKGl0ZW0gbmFtZSlcbiAgICBAcGVyY2VudENoYW5jZShjaGFuY2Ugb3V0IG9mIDEwMClcbiAgICBAZmxhZ0lzKGZsYWcgbmFtZSwgdmFsdWUpXG5cblJlc3VsdHM6XG4gICAgQHByaW50KHRleHQpXG4gICAgQGdvVG9Sb29tKHJvb20gbmFtZSlcbiAgICBAc2V0RmxhZyhmbGFnIG5hbWUsIHZhbHVlKVxuXCJcIlwiXG5cbm1vZHVsZS5leHBvcnRzID0gKGVuZ2luZSkgLT5cbiAgICBoZWxwVGV4dCA9IFwiXCJcIlxuQWR2YW5jZSB0aHJvdWdoIHRoZSBnYW1lIGJ5IHR5cGluZyBjb21tYW5kcyBsaWtlIDxzdHJvbmc+bG9vaywgZ2V0LCBhbmQgZ28uPC9zdHJvbmc+PGJyPlxuQ29tbWFuZHMgY2F0YWxvZ3VlIGFuZC9vciBwcmUgc2V0IGNvbW1hbmQgcHJlZml4IGJ1dHRvbnM6IDxzdHJvbmc+R28sIHRhbGssIGdldCwgbG9vaywgdXNlLi4uPC9zdHJvbmc+PGJyPlxuTG9vayBpbiBhbiBhcmVhIHRvIGdhaW4gbW9yZSBpbmZvcm1hdGlvbiBvciBsb29rIGF0IG9iamVjdHM6IDxzdHJvbmc+KGxvb2sgZmlzaCk8L3N0cm9uZz48YnI+XG5Nb3ZlIGJ5IHR5cGluZyBnbyBjb21tYW5kczogPHN0cm9uZz4oZ28gZWFzdCk8L3N0cm9uZz48YnI+XG5FbmdhZ2UgaW4gcGhpbG9zb3BoaWNhbCBkZWJhdGU6IDxzdHJvbmc+KHRhbGsgc29yY2VyZXNzKTwvc3Ryb25nPjxicj5cblVzZSBpdGVtcyBpbiBpbnZlbnRvcnk6IDxzdHJvbmc+KHVzZSBsaWdodHNhYmVyKTwvc3Ryb25nPjxicj5cblRoZXJlIGFyZSBvdGhlciBjb21tYW5kcyB0b28gYW5kIHNvbWUgeW91IGNhbiBqdXN0IGNsaWNrIG9uIGEgYnV0dG9uIHRvIHVzZS4gRXhwZXJpbWVudCBhbmQgdHJ5IHRoaW5ncyBpbiB0aGlzIGJlYXV0aWZ1bCBuZXcgd29ybGQgYmVmb3JlIHlvdS48YnI+XG5UeXBlIDxzdHJvbmc+XCJoZWxwXCI8L3N0cm9uZz4gdG8gc2VlIHRoaXMgbWVudSBhZ2Fpbjxicj5cblwiXCJcIlxuXG4gICAgZW5naW5lLnNldFVuaXZlcnNhbENvbW1hbmRzIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdkaWUnKVxuICAgICAgICAgICAgQHByaW50KCdXaGF0IGFyZSB5b3UgZG9pbmc/IFlvdSBhcmUgZGVhZCBub3cuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2luJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGRpZCBpdC4gWW91IHdpbi4gQnV5IHlvdXJzZWxmIGEgcGl6emEgYmVjYXVzZSB5b3UgYXJlIHNvIGNsZXZlci4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdpbnYnKSBvciBAbWF0Y2hlcygnaW52ZW50b3J5JylcbiAgICAgICAgICAgIGlmIE9iamVjdC5rZXlzKEBnZXRJbnZlbnRvcnkoKSkubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIEBwcmludCgnSXQgdGVsbHMgeW91IHdoYXQgaXMgaW52ZW50b3J5IHJpZ2h0IG92ZXIgdGhlcmUgb24gdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIHNjcmVlbi4gSXMgdHlwaW5nIHRoaXMgY29tbWFuZCByZWFsbHkgbmVjZXNzYXJ5PycpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3VyIGludmVudG9yeSBpcyBlbXB0eSB5b3UgYmlnIGR1bWIgYnV0dC4gU29ycnksIHRoYXQgd2FzIHJ1ZGUgSSBtZWFudCB0byBzYXkgeW91IGJ1dHQuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnaGVscCcpXG4gICAgICAgICAgICBAcHJpbnQoaGVscFRleHQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgUGljayBhIHJhbmRvbSBkZWZhdWx0IHJlc3BvbnNlXG4gICAgICAgICAgICBkZWZhdWx0UmVzcG9uc2VzID0gW1xuICAgICAgICAgICAgICAgICdXaGF0IGFyZSB5b3UgZXZlbiB0cnlpbmcgdG8gZG8/ICBKdXN0IHN0b3AuJ1xuICAgICAgICAgICAgICAgICdHb29kIG9uZSBtYW4uJ1xuICAgICAgICAgICAgICAgICdXaG9hIHRoZXJlIEVhZ2VyIE1jQmVhdmVyISdcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIEBwcmludChkZWZhdWx0UmVzcG9uc2VzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpkZWZhdWx0UmVzcG9uc2VzLmxlbmd0aCldKVxuICAgICAgICAgICAgXG5cbiAgICBlbmdpbmUuc2V0QWZ0ZXJDb21tYW5kIC0+XG4gICAgICAgIGlmIChub3QgQGZsYWdJcygnaGF2ZV9hbGxfaXRlbXMnLCB0cnVlKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnZWdnJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ2Zsb3dlcnMnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnYmFraW5nIHNvZGEnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnc3lydXAnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnbWlsaycpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdtYXJnYXJpbmUnKSlcbiAgICAgICAgICAgIEBwcmludCgnXCJXZWxsLCBJIHRoaW5rIEkgaGF2ZSBhbGwgdGhlIGluZ3JlZGllbnRzLFwiIHlvdSBzYXkgdG8geW91cnNlbGYuIFwiSSBqdXN0IG5lZWQgb25lIG9mIHRob3NlIHBsYWNlcyB3aGVyZSB5b3UgcHV0IHRoZW0gdG9nZXRoZXIgc28gaXQgdHVybnMgaW50byBzb21ldGhpbmcgeW91IGNhbiBlYXQuIFlvdSBrbm93LCBvbmUgb2YgdGhvc2UuLi5mb29kIHByZXBhcmluZyByb29tcy5cIicpXG4gICAgICAgICAgICBAc2V0RmxhZygnaGF2ZV9hbGxfaXRlbXMnLCB0cnVlKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2FsZSB2cyBTaGFyYzogVGhlIENvbWljOiBUaGUgSW50ZXJhY3RpdmUgU29mdHdhcmUgVGl0bGUgRm9yIFlvdXIgQ29tcHV0ZXIgQm94JywgLT5cbiAgICAgICAgQHByaW50KCdUaGFuayB5b3UgZm9yIGJ1eWluZyB0aGlzIGdhbWUhICBUeXBlIHRoaW5ncyBpbiB0aGUgYm94IHRvIG1ha2UgdGhpbmdzIGhhcHBlbiEnKVxuICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgQGdvVG9Sb29tKCdIb3cgVG8gUGxheScpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnSG93IFRvIFBsYXknLCAtPlxuICAgICAgICBAcHJpbnQoaGVscFRleHQpXG4gICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ09jZWFuJylcblxuICAgIGVuZ2luZS5hZGRSb29tICdPY2VhbicsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGZpbmQgeW91cnNlbGYgaW4gdGhlIG9jZWFuLiBZb3UgYXJlIGEgc2hhcmsgYnkgdGhlIG5hbWUgb2YgU2hhcmMgYW5kIHlvdXIgJDIzIHNoYW1wb28gaXMgbWlzc2luZy4gWW91IHN1c3BlY3QgZm91bCBwbGF5LiBXZWxjb21lIHRvIHRoZSBvY2VhbiwgaXQgaXMgYSBiaWcgYmx1ZSB3ZXQgdGhpbmcgYW5kIGFsc28geW91ciBob21lLiBPYnZpb3VzIGV4aXRzIGFyZSBOb3J0aCB0byB5b3VyIGZyaWVuZCBXYWxlLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYWxlJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdIZXksIGl0IGlzIHlvdXIgZnJpZW5kLCBXYWxlLiBIZSBpcyBkb2luZyB0aGF0IHRoaW5nIHdoZXJlIGhlIGhhcyBoaXMgZXllcyBjbG9zZWQgYW5kIGFjdHMgbGlrZSBoZSBkaWQgbm90IG5vdGljZSB5b3VyIGFycml2YWwuIEhlIGlzIGtpbmQgb2YgYSBwcmljaywgYnV0IGFsc28geW91ciBmcmllbmQuIFdoYXQgY2FuIHlvdSBkbz8gT2J2aW91cyBleGl0cyBhcmUgT2NlYW4gdG8gdGhlIHNvdXRoLCBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoIHRvIHRoZSB3ZXN0LCBtb3JlIE9jZWFuIHRvIHRoZSBub3J0aCwgYW5kIEJpbGx5IE9jZWFuIHRvIHRoZSBlYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ2l2ZSBwYW5jYWtlcycpXG4gICAgICAgICAgICBpZiBAaGFzSXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJIZXkgV2FsZSxcIiB5b3UgY2FsbCBvdXQgYXMgaW50cnVzaXZlbHkgYXMgcG9zc2libGUsIFwiSSBnb3QgeW91ci0tXCIgQmVmb3JlIHlvdSBjb3VsZCBmaW5pc2ggeW91ciBzZW50ZW5jZSwgeW91ciBibHViYmVyeSBmcmllbmQgaGFzIHNuYXRjaGVkIHRoZSBwbGF0ZSBhd2F5IGFuZCwgaW4gYSBtb3N0IHVuZGlnbmlmaWVkIG1hbm5lciwgYmVnaW5zIG1vd2luZyB0aHJvdWdoIHRoZSBmcmllZCBkaXNjcyB5b3Ugc28gYXJ0ZnVsbHkgcHJlcGFyZWQuIFwiU291bCBzZWFyY2hpbmcgdGFrZXMgYSBsb3Qgb2YgZW5lcmd5LFwiIGhlIGV4cGxhaW5zIGJldHdlZW4gYml0ZXMuIFwiSSBoYXZlblxcJ3QgZWF0ZW4gYW55dGhpbmcgYWxsIGRheS5cIiBPbmNlIGZpbmlzaGVkLCBXYWxlIHN0cmFpZ2h0ZW5zIGhpbXNlbGYgb3V0LCBsb29raW5nIGEgbWl0ZSBlbWJhcnJhc3NlZCBmb3IgdGhlIHNhdmFnZSBkaXNwbGF5IGhlIGp1c3QgcHV0IG9uLiBcIldoYXQgd2FzIGl0IHlvdSBuZWVkZWQ/XCIgXCJPaCBXYWxlLCBpdFxcJ3MgdGVycmlibGUuIEkgdGhpbmsgbXkgJDIzIHNoYW1wb28gd2FzIHN0b2xlbiBhbmQgdGhlIGdob3N0IG9mIG15IG5vdCByZWFsbHkgZGVhZCBmcmllbmQgc2F5cyB0aGUgZmF0ZSBvZiB0aGUgd29ybGQgaGFuZ3MgaW4gdGhlIGJhbGFuY2UuXCIgXCJJIHNlZSxcIiBzYXlzIFdhbGUsIGhpcyB2b2ljZSBhbmQgbWFubmVyIHJlbWFpbmluZyB1bmNoYW5nZWQgZGVzcGl0ZSB0aGUgdGhyZWF0IG9mIHRoZSB3b3JsZCB1bmJhbGFuY2luZy4gXCJTaGFyYywgSSBmZWFyIHRoZSB3b3JzdC4gWW91IG11c3Qgc3VtbW9uIHRoZSBldGhlcmVhbCBkb29yLlwiIFwiTm8sIFdhbGUsXCIgeW91IHNheSwgXCJ5b3UgbWFkZSBtZSBzd2VhciBhIHRob3VzYW5kIHZvd3MgbmV2ZXIgdG8gYnJpbmcgdGhhdCBjdXJzZWQgcmVsaWMgYmFjayBhbW9uZyB1cy5cIiBcIkkga25vdyB3aGF0IEkgc2FpZCwgYnV0IEkgYWxzbyBrbmV3IHRoZXJlIHdvdWxkIGNvbWUgYSB0aW1lIHdoZW4gd2Ugd291bGQgaGF2ZSBubyBvdGhlciBjaG9pY2UuXCIgIFlvdSBzaG91bGQgcHJvYmFibHkgc3VtbW9uIHRoZSBkb29yLicpXG4gICAgICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgICAgICBAc2V0RmxhZygnZ2l2ZW5fcGFuY2FrZXMnLCB0cnVlKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N1bW1vbiBkb29yJykgYW5kIEBmbGFnSXMoJ2dpdmVuX3BhbmNha2VzJywgdHJ1ZSlcbiAgICAgICAgICAgIEBwcmludCgnWW91LCBmaW5hbGx5IGNvbnZpbmNlZCBvZiB5b3VyIHVyZ2VuY3kgYW5kIHV0dGVyIGRlc3BlcmF0aW9uLCBwZXJmb3JtIHNvbWUgaW50cmljYXRlIHJpdGVzIGFuZCBpbmNhbnRhdGlvbnMgdGhhdCB3b3VsZCBiZSByZWFsbHkgY29vbCBpZiB5b3UgY291bGQgc2VlIHRoZW0sIGJ1dCBJIGd1ZXNzIHlvdSB3aWxsIGp1c3QgaGF2ZSB0byB1c2UgeW91ciBpbWFnaW5hdGlvbnMuIFRleHQgb25seSBmb29scyEgIFRoZSBldGhlcmVhbCBkb29yIHN0YW5kcyBvcGVuIGJlZm9yZSB5b3UuJylcbiAgICAgICAgICAgIEBzZXRGbGFnKCdzdW1tb25lZF9kb29yJywgdHJ1ZSlcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlbnRlciBkb29yJykgYW5kIEBmbGFnSXMoJ3N1bW1vbmVkX2Rvb3InLCB0cnVlKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdUaGUgRXRoZXJlYWwgUmVhbG0nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsgd2FsZScpXG4gICAgICAgICAgICBpZiBAZmxhZ0lzKCd0YWxrZWRfdG9fd2FsZScsIGZhbHNlKVxuICAgICAgICAgICAgICAgIEBwcmludCgnKEdldCByZWFkeSB0byBkbyBzb21lIHJlYWRpbmcpIFdhbGUgaXMgdHJ5aW5nIHRvIG1lZGl0YXRlIG9yIHNvbWV0aGluZyBwcmV0ZW50aW91cyB0aGF0IHlvdSBkb25cXCd0IGNhcmUgYWJvdXQuIFlvdSBoYXZlIHNvbWV0aGluZyBpbXBvcnRhbnQhIFwiV2FsZVwiIHlvdSBzaG91dCwgXCJJIG5lZWQgeW91ciBoZWxwISBUaGUgY29uZGl0aW9uIG9mIG15IG1hZ25pZmljZW50IHNjYWxwIGlzIGF0IHN0YWtlLlwiIFdhbGUgc2lnaHMgYSBoZWF2eSwgbGFib3JlZCBzaWdoLiBcIlNoYXJjLCB5b3UgaGF2ZSBkaXN0dXJiZWQgbXkgam91cm5leSB0byBteSBpbm5lcm1vc3QgYmVpbmcuIEJlZm9yZSBJIGNhbiBoZWxwIHlvdSwgcmVwYXJhdGlvbnMgbXVzdCBiZSBtYWRlLiBQYW5jYWtlczogd2hvbGUgd2hlYXQsIHdpdGggYWxsIG5hdHVyYWwgbWFwbGUgc3lydXAuIE5vdyBsZWF2ZSBtZSBhcyBJIHBlZWwgYmFjayB0aGUgbGF5ZXJzIG9mIHRoZSBzZWxmIGFuZCBwb25kZXIgdGhlIGxlc3NvbiBvZiB0aGUgY2hlcnJ5IGJsb3Nzb20uJylcbiAgICAgICAgICAgICAgICBAc2V0RmxhZygndGFsa2VkX3RvX3dhbGUnLCB0cnVlKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJJIGNhbiBub3QgbGlmdCBhIGZpbiBmb3IgeW91IHVudGlsIHlvdSBoYXZlIGJyb3VnaHQgYSBoZWFsdGh5IHNlcnZpbmcgb2Ygd2hvbGUgd2hlYXQgcGFuY2FrZXMgd2l0aCBhbGwgbmF0dXJhbCBtYXBsZSBzeXJ1cCBsaWtlIEkgc2FpZCBiZWZvcmUuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0JpbGx5IE9jZWFuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dldHRlciBPY2VhbicsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBpcyBqdXN0IHNvbWUgb2NlYW4geW91IGZvdW5kLiBJdCBkb2VzIGZlZWwgYSBsaXR0bGUgYml0IHdldHRlciB0aGFuIHRoZSByZXN0IG9mIHRoZSBvY2VhbiB0aG91Z2guIEFsc28sIGRpZCBpdCBqdXN0IGdldCB3YXJtZXI/IE9idmlvdXMgZXhpdHMgYXJlIGEgZ2FyZGVuIHRvIHRoZSB3ZXN0LCBXYWxlIGluIHRoZSBzb3V0aCwgYW5kIGEgZ2FtZXNob3cgZWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdDdXR0bGVmaXNoJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdjdXR0bGVmaXNoJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0xvb2ssIHRoZXJlIGJlIHNvbWUgY3V0dGxlZmlzaCwgdGhvdWdoIHRoZXkgZG8gbm90IGxvb2sgdG9vIGN1ZGRseS4gU3RlYWsgYW5kIFNoYWtlIGlzIHRvIHRoZSB3ZXN0LCBBY2h0aXB1c1xcJ3MgZ2FyZGVuIHRvIHRoZSBub3J0aCwgYW5kIFdhbGUgdG8gdGhlIGVhc3QuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIHVzZWQgdG8gYmUgY3V0dGxlZmlzaCBoZXJlIGJ1dCB5b3Ugc2NhcmVkIHRoZW0gYXdheSB3aXRoIHlvdXIgYWdncmVzc2l2ZSBhZmZlY3Rpb25zLiBLZWVwIHRoYXQgc3R1ZmYgaW5zaWRlIG1hbiEnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjdWRkbGUgY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBmZWVsaW5nIGFmZmVjdGlvbmF0ZSB0b2RheSBhbmQgeW91IGp1c3QgZ290IGR1bXBlZCBzbyB3aHkgbm90PyBZb3UganVtcCBzb21lIG9mIHRoZSBjdXR0bGVmaXNoIGFuZCBzdGFydCBzbnVnZ2xpbmcgYW5kIGN1ZGRsaW5nLiBUaGUgY3V0dGxlZmlzaCBhcmUgbm90IGFtdXNlZCB0aG91Z2gsIGFuZCBzYXkgdGhleSBhcmUgdGlyZWQgb2YgZmlzaCBtYWtpbmcgdGhhdCBtaXN0YWtlLiBUaGV5IGFsbCBzd2ltIGF3YXkgZXhjZXB0IGZvciBvbmUgdGhhdCBoYXMgYXR0YWNoZWQgaXRzIHN1Y2tlcnMgdG8geW91ciBtaWQgcmVnaW9uLiBZb3UgZG9uXFwndCBzZWVtIHRvIG1pbmQuJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGV5IGFyZSBjdWRkbGVkIG91dC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdCaWxseSBPY2VhbicsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PXpOZ2NZR2d0ZjhNJywgJ19ibGFuaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1N1ZGRlbmx5LCBhcHBlYXJpbmcgYmVmb3JlIHlvdXIgZXllcyBpcyBzaW5nZXItc29uZ3dyaXRlciBhbmQgZm9ybWVyIENhcmliYmVhbiBraW5nOiBCaWxseSBPY2Vhbi4gQWxzbyBCaWxseSBPY2VhblxcJ3MgY2FyLiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIFdhbGUgYW5kIG5vcnRoIHRvIHNvbWUga2luZCBvZiBnYW1lIHNob3cuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0hlIHdhbnRzIHlvdSB0byBnZXQgaW50byBoaXMgY2FyIGFuZCBkcml2ZSBoaW0gdG8gdGhlIGhvc3BpdGFsLiBIZSBqdXN0IGRyb3ZlIHRocm91Z2ggdGhlIGNhciB3YXNoIHdpdGggdGhlIHRvcCBkb3duIGFmdGVyIGRyb3BwaW5nIHNvbWUgYWNpZC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdob3NwaXRhbCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1N1cmUsIHdoeSBub3Q/IFlvdSBnZXQgaW4gdGhlIGRyaXZlclxcJ3Mgc2VhdCBhbmQgZmluZCB5b3VyIHdheSB0byB0aGUgbmVhcmVzdCBtZWRpY2FsIHRyZWF0bWVudCBjZW50ZXIuIEFzIHRoYW5rcywgTXIuIE9jZWFuIHB1bGxzIGFuIGVnZyBvdXQgZnJvbSBoaXMgZ2xvdmUgYm94LiBZb3UgYWNjZXB0IGFuZCBzd2ltIGF3YXkgYXMgZmFzdCBhcyBwb3NzaWJsZS4gR29vZCwgSSByYW4gb3V0IG9mIGpva2VzIGZvciB0aGF0IGZhc3QuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdlZ2cnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjYWxsIGNvcHMnKVxuICAgICAgICAgICAgQHByaW50KCdUaGUgcG9saWNlIGNvbWUgYW5kIGFycmVzdCBCaWxseSBPY2VhbiBvbiBjaGFyZ2Ugb2YgYmVpbmcgY29tcGxldGVseSBpcnJlbGV2YW50IHRvIHRoaXMgZ2FtZS4gWW91IFdpbiEgSGlnaCBTY29yZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnQWNodGlwdXNcXCdzIEdhcmRlbicsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rIGFjaHRpcHVzJylcbiAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIEFjaHRpcHVzLiBIZSBpcyBwdWxsaW5nIG91dCB0aGUgc2Vhd2VlZHMgZnJvbSBoaXMgc2VhIGN1Y3VtYmVyIGJlZC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGdhcmRlbicpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzZWUgd2F0ZXJtZWxvbiwgd2F0ZXIgY2hlc3RudXRzLCBhc3NvcnRlZCBmbG93ZXJzLCBzZWEgY3VjdW1iZXJzIGFuZCBzdHJhd2JlcnJpZXMuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0FjaHRpcHVzIGlzIHdvcmtpbmcgYW1vbmcgaGlzIGZsb3dlcnMgYW5kIHNocnVicy4gSGUgc2VlcyB5b3UgYW5kIG9wZW5zIHRoZSBnYXRlIGZvciB5b3UuIE9idmlvdXMgZXhpdHMgYXJlIG5vcnRoIHRvIFdhdGVyIFdvcmxkLCBlYXN0IHRvIHNvbWUgT2NlYW4gYW5kIHNvdXRoIHRvIGEgc2Nob29sIG9mIEN1dHRsZWZpc2guJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiVGhpcyBpcyBxdWl0ZSB0aGUgdW0uLi5vY2VhbiBoaWRlYXdheSB5b3UgaGF2ZSBoZXJlLFwiIHlvdSBzYXkuIFwiWWVzLFwiIGhlIHNheXMsIFwiSSBjYW4gc2VlIHlvdSBoYXZlIGNvbWUgYSBsb25nIHdheSB0byBnZXQgaGVyZSwgYnV0IEkgYW0gZ2xhZCB5b3UgaGF2ZSBmb3VuZCByZWZ1Z2Ugb24gbXkgZ3JvdW5kcy4gSWYgeW91IHNlZSBhbnl0aGluZyB5b3UgbGlrZSBpbiBteSBwbG90IHdlIGNvdWxkIG1ha2UgYSBkZWFsIHBlcmhhcHMuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2Ugd2F0ZXJtZWxvbicpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiSSB3aWxsIGdpdmUgeW91IHRoZSB3YXRlcm1lbG9uIGluIGV4Y2hhbmdlIGZvciBhbiBpY2UgY3JlYW0gc3VuZGFlLlwiJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBudXRzJykgb3IgQG1hdGNoZXMoJ3Rha2UgbnV0Jykgb3IgQG1hdGNoZXMoJ3Rha2UgY2hlc3RudXRzJykgb3IgQG1hdGNoZXMoJ3Rha2UgY2hlc3RudXQnKVxuICAgICAgICAgICAgQHByaW50KCdcIkkgd2lsbCBnaXZlIHlvdSBzb21lIHdhdGVyIGNoZXN0bnV0cyBpZiB5b3UgY2FuIGZpbmQgbWUgYSBwdXJlIGJyZWQgR2VybWFuIFNoZXBhcmQuXCInKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGN1Y3VtYmVyJykgb3IgQG1hdGNoZXMoJ3Rha2UgY3VjdW1iZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnXCJZb3UgY2FuIGhhdmUgdGhlIHNlYSBjdWN1bWJlcnMgaW4gZXhjaGFuZ2UgZm9yIGEgZnVsbCBwYXJkb24gZm9yIHRoZXNlIG1ham9yIGZlbG9ueSBjaGFyZ2VzIHRoYXQgYXJlIHN0aWxsIHBlbmRpbmcuXCInKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHN0cmF3YmVycmllcycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiT2gsIGFjdHVhbGx5IHRob3NlIHN0cmF3YmVycnkgZmllbGRzIGFyZW5cXCd0IGV2ZW4gcmVhbC5cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBmbG93ZXJzJykgb3IgQG1hdGNoZXMoJ3Rha2UgZmxvd2VyJylcbiAgICAgICAgICAgIGlmIG5vdCBAZmxhZ0lzKCdnaXZlbl91bWJyZWxsYScsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIkkgY2FuIHNlZSB5b3UgbGlrZSB0aGUgZmxvd2Vycy4gSSB3aWxsIGxldCB5b3UgaGF2ZSB0aGVtIGlmIHlvdSBjYW4gZmluZCBzb21ldGhpbmcgdG8ga2VlcCBpdCBmcm9tIGdldHRpbmcgc28gaG90IGhlcmUuIEkgd291bGQgYmUgYWJsZSB0byBkbyB0d2ljZSBhcyBtdWNoIHdvcmsgaWYgaXQgd2VyZSBhIGJpdCBjb29sZXIuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiWW91IGhhdmUgZ3JlYXQgdGFzdGUuIFRoZXNlIGZsb3dlcnMgYXJlIHJlYWxseSB2ZXJzYXRpbGUgYW5kIHdpbGwgYmUgZ29vZCBqdXN0IGFib3V0IGFueXdoZXJlLlwiJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnZmxvd2VycycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ2l2ZSB1bWJyZWxsYScpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiVGhpcyB3aWxsIGJlIHBlcmZlY3QgZm9yIGJsb2NraW5nIG91dCB0aGF0IHN1buKAmXMgaGFyc2ggcmF5cy4gVGhhbmtzIVwiJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCd1bWJyZWxsYScpXG4gICAgICAgICAgICBAc2V0RmxhZygnZ2l2ZW5fdW1icmVsbGEnLCB0cnVlKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2V0dGVyIE9jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHN3aW0gdXAgdG8gdGhlIHJ1aW5zIG9mIHlvdXIgb2xkIHdvcmsgcGxhY2UuIFRoaXMgcGxhY2UgaGFzIHNlZW4gYmV0dGVyIGRheXMuIFlvdXIgbWluZCBpcyBmbG9vZGVkIHdpdGggbWVtb3JpZXMgb2YgZmxvYXRpbmcgaW4gZnJvbnQgb2YgdGhlIG9sZCBncmlsbCBhbmQgY29taW5nIHVwIHdpdGggbmV3IHJlY2lwZXMgdG8gdHJ5IHdoZW4geW91ciBtYW5hZ2VyIGhhZCBoaXMgYmFjayB0dXJuZWQuIFRoZW4gc29tZW9uZSBzYWlkIFwiRXZlciB0cmllZCBhbiBNLTgwIGJ1cmdlcj8gSSBoYXZlIGVub3VnaCBmb3IgZXZlcnlvbmUuXCIgVGhlIHdvcmRzIGVjaG8gaW4geW91ciBtaW5kIGxpa2UgYSBwaGFudG9tIHdoaXNwZXIgb2YgYWdlcyBwYXN0LiBJdFxcJ3MgdGhlIHJ1aW5zIG9mIHRoZSBvbGQgU3RlYWsgYW5kIFNoYWtlIHlvdSB1c2VkIHRvIHdvcmsgYXQgdW50aWwgeW91ciBmcmllbmQgYmxldyBpdCB1cC4gVGhlIHRhdHRlcmVkIHJlbW5hbnRzIG9mIGEgcmVkIGFuZCB3aGl0ZSBhd25pbmcgZmx1dHRlcnMgaW4gdGhlIHdpbmQgYXMgaWYgdG8gc3VycmVuZGVyIHRvIGFuIGVuZW15LiBXaGF0IGlzIGxlZnQgb2YgYSBkb29yIGhhbmdzIG9uIGEgc2luZ2xlIGhpbmdlIHRvIHRoZSB3ZXN0LiBDdXR0bGVmaXNoIHN0b21waW5nIGdyb3VuZHMgbGllIGVhc3QuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpIG9yIEBtYXRjaGVzKCdvcGVuIGRvb3InKSBvciBAbWF0Y2hlcygnZW50ZXInKSBvciBAbWF0Y2hlcygnaW4nKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQ3V0dGxlZmlzaCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG4gICAgICAgICAgICBcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdBcyB5b3UgYXBwcm9hY2gsIHRoZSBkb29yIGZhbGxzIGNsZWFuIG9mZiBhcyBpZiB0byB3YXJuIHlvdSBhZ2FpbnN0IGVudHJ5LiBOZXZlciBiZWluZyBvbmUgZm9yIG9tZW5zLCB5b3UgaWdub3JlIGl0LiBJbnNpZGUgeW91IGRpc2NvdmVyIHRoaW5ncyBtdWNoIGFzIHlvdSByZW1lbWJlciB0aGVtLiBUaGF0IGlzLCBpZiB0aGV5IGhhZCBiZWVuIG1hdWxlZCBieSBhIGJlYXIgd2l0aCBibGVuZGVycyBmb3IgaGFuZHMgd2hvIHByb2NlZWRlZCB0byBzZXQgb2ZmIGEgc2VyaWVzIG9mIHBsYXN0aWMgZXhwbG9zaXZlcy4gVG8gdGhlIHNvdXRoIHRoZXJlIGFyZSBzb21lIHRhYmxlcyBhbmQgY2hhaXJzLCBub3J0aCBsaWVzIHRoZSBraXRjaGVuLCBhbmQgd2VzdCBhIHNvZGEgZm91bnRhaW4uIFRoZSBvdXRkb29ycyBpcyBlYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERpbmluZyBBcmVhKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNvZGEgRm91bnRhaW4pJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChEaW5pbmcgQXJlYSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgZGlsYXBpZGF0ZWQgZGluaW5nIGFyZWEgbGllcyBiZWZvcmUgeW91LiBJdCBpcyBjb21wbGV0ZWx5IHVucmVtYXJrYWJsZS4gVGhlcmUgaXMgbm93aGVyZSB0byBnbyBiZXNpZGVzIG5vcnRoIHRvIHRoZSB3YXkgeW91IGNhbWUuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdXZWxjb21lIHRvIHRoZSBraXRjaGVuLiBTaW5jZSB0aGUgd2FsbHMgaGF2ZSBhbGwgYmVlbiBibG93biBhd2F5IG9yIGRpc3NvbHZlZCwgdGhlIG9ubHkgdGhpbmcgdGhhdCBzZXBhcmF0ZXMgaXQgZnJvbSB0aGUgcmVzdCBvZiB0aGUgcGxhY2UgaXMgdGhlIG92ZW4gYW5kIHJhbmdlLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgb3ZlbicpIG9yIEBtYXRjaGVzKCdvcGVuIG92ZW4nKVxuICAgICAgICAgICAgQHByaW50KCdDaGVjayBpdCBvdXQsIGl0XFwncyB5b3VyIGZhdm9yaXRlIHBvcCwgYSBDaGVycnkgT3JhbmdlIFNub3p6YmVycnkgTGltZSBQYXNzaW9uZnJ1aXQgVmFuaWxsYSBDcm9hayBpbiB0aGUgb3Zlbi4gV2hvIGV2ZXIgdGhvdWdodCBvZiBiYWtpbmcgYSBjYW4gb2Ygc29kYT8nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Jha2luZyBzb2RhJylcblxuICAgICAgICBlbHNlIGlmIEBmbGFnSXMoJ2hhdmVfYWxsX2l0ZW1zJywgdHJ1ZSlcbiAgICAgICAgICAgIGlmIEBtYXRjaGVzKCdtYWtlIHBhbmNha2VzJylcbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4pJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4pJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdcIldoZXJlIGRvIEkgc3RhcnQ/XCIgeW91IHdvbmRlciBvdXQgbG91ZC4gSWYgb25seSB0aGVyZSB3ZXJlIHdyaXR0ZW4gc2VyaWVzIG9mIGluc3RydWN0aW9ucyBndWlkaW5nIHlvdSB0aHJvdWdoLiBXaGVyZSB3b3VsZCB5b3UgZmluZCBzb21ldGhpbmcgbGlrZSB0aGF0PycpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91XFwncmUgcG9uZGVyaW5nIHRoaXMgd2hlbiBhIGRyYWZ0IGNvbWVzIG92ZXIgeW91LiBUaGUgbGlnaHRzIGZsaWNrZXIgb24gYW5kIG9mZi4gWW91IHNlbnNlIGEgbXlzdGVyaW91cyBwcmVzZW5jZS4gVGhlIGdob3N0IG9mIHlvdXIgb2xkIGZyaWVuZCBDcmVnZ2xlcyBhcHBlYXJzIGJlZm9yZSB5b3UuIEFwcGFyZW50bHkgaGUgaXMgaGF1bnRpbmcgdGhlIFN0ZWFrIGFuZCBTaGFrZSBub3cgYW5kIHlvdVxcJ3JlIGFsbCBsaWtlIFwiQ3JlZ2dsZXMsIGRpZG5cXCd0IHdlIGp1c3QgaGFuZyBvdXQgdGhlIG90aGVyIGRheT8gSG93IGFyZSB5b3UgYSBnaG9zdCBhbHJlYWR5P1wiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJzxzcGFuIGNsYXNzPVwiY3JlZXB5XCI+XCJOZXZlciB5b3UgbWluZCB0aGF0IG5vd1wiPC9zcGFuPiBoZSBzYXlzIGluIGhpcyBjcmVlcHkgbmVyZCB2b2ljZS4gPHNwYW4gY2xhc3M9XCJjcmVlcHlcIj5cIlNoYXJjLCBpZiB5b3UgaG9wZSB0byBzYXZlIHRoZSB3b3JsZCBmcm9tIGNlcnRhaW4gZG9vbSwgeW91IG11c3Qgc3VjY2VlZCBpbiBtYWtpbmcgdGhlc2UgcGFuY2FrZXMuIFVzZSB0aGlzIGFuY2llbnQgcmVjaXBlIGhhbmRlZCBkb3duIGZyb20gdGhlIGFuY2llbnRzIHRvIGFpZCB5b3UuXCI8L3NwYW4+IEFuIG9sZCwgYmF0dGVyZWQgcGllY2Ugb2YgcGFwZXIgZmxvYXRzIGRvd24gbGFuZGluZyBiZWZvcmUgeW91IFwiU3dlZXQgTWVlbWF3cyBTd2VldHkgU3dlZXQgRmxhcGphY2tzXCIgaXQgcmVhZHMuIDxzcGFuIGNsYXNzPVwiY3JlZXB5XCI+XCJOb3cgbXkgd29yayBpcyBkb25lIGFuZCBJIGNhbiBhc2NlbmQgdG8gbXkgc3RlcG1vbVxcJ3MgaG91c2UgZm9yIGdyaWxsZWQgY2hlZXNlIHNhbmR3aWNoZXMgYW5kIGNob2NvbGF0ZSBtaWxrLlwiPC9zcGFuPicpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSByZWFkIHRoZSByZWNpcGUuIEl0IGlzIGFsbCBpbiByaWRkbGVzLiBZb3UgaG9wZSB5b3UgYXJlIHVwIHRvIHRoZSB0YXNrLicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGFuIGVtcHR5IGJvd2wgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBhbiBlbXB0eSBib3dsIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdJbiBhbiB1cm4gdGFrZSBidXQgbm90IGNodXJuIGl0ZW1zIHR3byBub3QgbGlrZSBnb28uJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc29kYSBmbG93ZXInKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ2Jha2luZyBzb2RhJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBwb3dkZXIgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdXIgcG90aW9uIGlzIGRyeS4gVGhpcyB3aWxsc3Qgbm90IGZseS4gV2hhdFxcJ3MgbmV4dCBtdXN0IGJlIGR1bXBlZCwgcG91cmVkIGFuZCBjcmFja2VkIGZvciBhIHByb3BlciBmbGFwamFjay4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdtaWxrIGVnZyBidXR0ZXInKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ2VnZycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnbWlsaycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQ3V0dGluZyBhbmQgc2Nvb3Bpbmcgc2hhbGwgaGF2ZSB0aGVpciBkYXksIGJ1dCBhIGZvciBhIGZpbmUgZmx1ZmZ5IGJhdHRlciB0aGVyZSBiZSBidXQgb25lIHdheS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzdGlyJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgbWl4ZWQgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzaGFrZScpXG4gICAgICAgICAgICBAcHJpbnQoJ0R1ZGUsIHdobyBkbyB5b3UgdGhpbmsgeW91IGFyZSwgSmFtZXMgQm9uZD8gIFRoaXMgYmF0dGVyIG5lZWRzIHRvIGJlIHN0aXJyZWQsIG5vdCBzaGFrZW4uJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBtaXhlZCBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnU2V0IHRoZSBncmlkZGxlIG9yIHN0b3ZlIHRvIG1lZGl1bSBoZWF0LiBBZnRlciBpdCBpcyB3YXJtZWQsIGRyb3AgYmF0dGVyIGEgcXVhcnRlciBjdXAgYXQgYSB0aW1lIGFuZCB0dXJuaW5nIG9uY2UgdW50aWwgYnViYmxlcyBhcHBlYXIuIFwiV2VsbCB0aGF0IHNlZW1zIHByZXR0eSBjbGVhci4gSSB0aGluayBJIGNhbiBkbyB0aGF0IG9uIG15IG93bi5cIicpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIHBsYXRlIG9mIGRyeSBwYW5jYWtlcyBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIHBsYXRlIG9mIGRyeSBwYW5jYWtlcyBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGVuIG1pbnV0ZXMgbGF0ZXIgdGhlIHBhbmNha2VzIGFyZSBmaW5pc2hlZCwgYnV0IHNvbWV0aGluZyBpcyBtaXNzaW5nLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N5cnVwJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBnb3QgcGFuY2FrZXMhICBIb3QgZGFuZy4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU29kYSBGb3VudGFpbiknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzZWUgdGhhdCB0aGUgc29kYSBmb3VudGFpbiBoYXMgc29tZWhvdyByZW1haW5lZCBsYXJnZWx5IHVuZGFtYWdlZC4gWW91IHRoaW5rIGJhY2sgdG8gdGhlIGRheXMgd2hlbiB5b3Ugd291bGQgc25lYWsgb3V0IGJhZ3Mgb2YgcGxhaW4gc3lydXAgdG8gZHJpbmsgYW5kIHRoZSBmcmVha2lzaCB3YWtpbmcgZHJlYW1zIGl0IHdvdWxkIGluZHVjZSBpbiB5b3UuIFlvdSB3b25kZXIgaWYgdGhlcmUgaXMgYW55IHN0aWxsIGluIHRoZXJlLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZm91bnRhaW4nKSBvciBAbWF0Y2hlcygnb3BlbiBmb3VudGFpbicpIG9yIEBtYXRjaGVzKCdsb29rIHNvZGEnKSBvciBAbWF0Y2hlcygnb3BlbiBzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnQXZhc3QsIGEgaGlkZGVuIHRyZWFzdXJlIHRyb3ZlIG9mIHN1Z2FyeSB3b25kZXIgdGhhdCBoYXMgbGFpbiBkb3JtYW50IGFsbCB0aGVzZSB5ZWFycyEgWW91IHRyZW1ibGUgYXQgdGhlIGJlYXV0eSBvZiB0aGUgc2lnaHQgYmVmb3JlIHlvdS4gU28gbWFueSBiYWdzIGFuZCB5ZXQgeW91ciBtYWdpYyBoYW1tZXJzcGFjZSBzYXRjaGVsIHdpbGwgb25seSBhbGxvdyBmb3Igb25lLiBUaGVyZVxcJ3MgU3ByaXR6LCBQcm9mZXNzb3IgR2luZ2VyLCBDYWN0dXMgTGFnZXIsIGFuZCBNcy4gU2hpbSBTaGFtXFwncyBNYXBsZSBTb2RhLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBtYXBsZScpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBmaW5kIGl0IHNob2NraW5nIHRoYXQgeW91IGFyZSB0aGUgZmlyc3QgcmFpZGVyIG9mIHRoaXMgc29kYSB0b21iLiBCdXQgdGhlbiBhZ2FpbiwgeW91IGhhdmUgYWx3YXlzIHNhaWQgcGVvcGxlIGRvblxcJ3Qga25vdyB0aGUgdmFsdWUgb2YgYSBiYWcgb2YgbGlxdWlkIHN1Z2FyLiBZb3UgdGFrZSBvZmYgd2l0aCBpdCB1bmRlciBjb3ZlciBvZiBkYXJrbmVzcy4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3N5cnVwJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwnLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBqdXN0IHdhbGtlZCBvbnRvIHRoZSBzZXQgb2YgdGhlIHdpbGRseSBwb3B1bGFyIGdhbWUgc2hvdywgXCJTZWFsIG9yIE5vIFNlYWwhXCIgV2hlcmUgZmxhbWJveWFudCBjb250ZXN0YW50cyBmbGFpbCBhcm91bmQgYW5kIHNob3V0IHdoaWxlIHRyeWluZyB0byBhcnJpdmUgYXQgdGhlIGFuc3dlciB0byB0aGF0IGFnZSBvbGQgcXVlc3Rpb24uLi5TRUFMIE9SIE5PIFNFQUw/IFRvIHRoZSBlYXN0IGlzIGJhY2tzdGFnZSwgbm9ydGggd2lsbCB0YWtlIHlvdSB0byB0aGUgZHJlc3Npbmcgcm9vbSwgd2VzdCBvciBzb3V0aCB3aWxsIHRha2UgeW91IGJhY2sgd2hlcmV2ZXIgeW91IGNhbWUgZnJvbS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2V0dGVyIE9jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdCaWxseSBPY2VhbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20pJywgLT5cbiAgICAgICAgc3RlcDEgPSAnTGV0XFwncyBzdGFydCB3aXRoIGhlYWRnZWFyLiBZb3Ugc2VlIGEgY293Ym95IGhhdCwgYSByYWluYm93IHdpZywgYSBtb3RvcmN5Y2xlIGhlbG1ldCwgYW5kIGEgc3RvdmVwaXBlIGhhdC4nXG4gICAgICAgIHN0ZXAyID0gJ05vdyBzZWxlY3QgYSBzZXQgb2YgY2xvdGhlcy4gWW91IHNlZSBhIGxlYXRoZXIgamFja2V0LCBhIGNsb3duIHN1aXQsIGFuIG9sZHRpbWV5IHN1aXQgd2l0aCBvbmUgb2YgdGhvc2UgQ29sb25lbCBTYW5kZXJzIHRpZXMsIGFuZCBhIGNvdyBwcmludCB2ZXN0LidcbiAgICAgICAgc3RlcDMgPSAnQWNjZXNzb3JpemUhIFBpY2sgZnJvbSBhIGZha2UgYmVhcmQsIGEgZ3VuIGJlbHQsIGEgbWV0YWwgY2hhaW4sIGFuZCBhIHJ1YmJlciBjaGlja2VuLidcbiAgICAgICAgZG9uZSA9ICdZb3UgbG9vayBhYnNvbHV0ZWx5IGhvcnJpYmxlISBPciBhbWF6aW5nLCBkZXBlbmRpbmcgb24geW91ciBwZXJzcGVjdGl2ZS4gQnV0IHRoZSB0cnVlIGp1ZGdlIHdpbGwgYmUgdGhlIGdhbWUgc2hvdyBtYW5hZ2VyLidcblxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgcGxhY2UgaXMgZ3JlYXQhIEl0IHdvdWxkIGJlIGVhc3kgdG8gY29iYmxlIHRvZ2V0aGVyIGEgY29zdHVtZSB0byBnZXQgb24gdGhhdCBzaG93LiBMZXRzIHNlZSB3aGF0IHdlIGNhbiBmaW5kLiBPYnZpb3VzIGV4aXRzIGFyZSBzb3V0aCB0byB0aGUgc2hvdyBlbnRyYW5jZS4nKVxuICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Nvc3R1bWUnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAxKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgY293Ym95IGhhdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY293Ym95IGhhdCcpXG4gICAgICAgICAgICBAcHJpbnQoc3RlcDIpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgcmFpbmJvdyB3aWcnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3JhaW5ib3cgd2lnJylcbiAgICAgICAgICAgIEBwcmludChzdGVwMilcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBtb3RvcmN5Y2xlIGhlbG1ldCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAyKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHN0b3ZlcGlwZSBoYXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3N0b3ZlcGlwZSBoYXQnKVxuICAgICAgICAgICAgQHByaW50KHN0ZXAyKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbGVhdGhlciBqYWNrZXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBjbG93biBzdWl0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjbG93biBzdWl0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBvbGR0aW1leSBzdWl0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdvbGR0aW1leSBzdWl0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBjb3cgdmVzdCcpIG9yIEBtYXRjaGVzKCd0YWtlIHByaW50IHZlc3QnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2NvdyBwcmludCB2ZXN0JylcbiAgICAgICAgICAgIEBwcmludChzdGVwMylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGZha2UgYmVhcmQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Zha2UgYmVhcmQnKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgZ3VuIGJlbHQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIG1ldGFsIGNoYWluJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdtZXRhbCBjaGFpbicpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBydWJiZXIgY2hpY2tlbicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGNvc3R1bWVNYXRjaGVzID0gKGVuZ2luZSkgLT5cbiAgICAgICAgZ3JvdXAxID0gMFxuICAgICAgICBncm91cDIgPSAwXG4gICAgICAgIGdyb3VwMyA9IDBcbiAgICAgICAgZ3JvdXA0ID0gMFxuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjb3dib3kgaGF0JykgdGhlbiBncm91cDErK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgncmFpbmJvdyB3aWcnKSB0aGVuIGdyb3VwMSsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdtb3RvcmN5Y2xlIGhlbG1ldCcpIHRoZW4gZ3JvdXAxKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ3N0b3ZlcGlwZSBoYXQnKSB0aGVuIGdyb3VwMSsrXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2xlYXRoZXIgamFja2V0JykgdGhlbiBncm91cDIrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnY2xvd24gc3VpdCcpIHRoZW4gZ3JvdXAyKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ29sZHRpbWV5IHN1aXQnKSB0aGVuIGdyb3VwMisrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjb3cgcHJpbnQgdmVzdCcpIHRoZW4gZ3JvdXAyKytcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnZ3VuIGJlbHQnKSB0aGVuIGdyb3VwMysrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdydWJiZXIgY2hpY2tlbicpIHRoZW4gZ3JvdXAzKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Zha2UgYmVhcmQnKSB0aGVuIGdyb3VwMysrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdtZXRhbCBjaGFpbicpIHRoZW4gZ3JvdXAzKytcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoZ3JvdXAxLCBncm91cDIsIGdyb3VwMywgZ3JvdXA0KVxuXG4gICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zID0gKGVuZ2luZSkgLT5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Nvd2JveSBoYXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgncmFpbmJvdyB3aWcnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnc3RvdmVwaXBlIGhhdCcpXG5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Nsb3duIHN1aXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnb2xkdGltZXkgc3VpdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjb3cgcHJpbnQgdmVzdCcpXG5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3J1YmJlciBjaGlja2VuJylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Zha2UgYmVhcmQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnbWV0YWwgY2hhaW4nKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIGlzIHRoZSBzdGFnZS4gSXQgaXMganVzdCBhcyBzdHVwaWQgbG9va2luZyBhcyB0aGUgcmVzdCBvZiB0aGUgc2hvdy4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgc2hvd1xcJ3MgZW50cmFuY2UuIFRoZSBzaG93IG1hbmFnZXIgc3RhcmVzIGF0IHlvdSBxdWVzdGlvbmluZ2x5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayBtYW5hZ2VyJylcbiAgICAgICAgICAgIHN3aXRjaCBjb3N0dW1lTWF0Y2hlcyhAKVxuICAgICAgICAgICAgICAgIHdoZW4gMFxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgYXBvbG9naXplcywgXCJJIGFtIHNvcnJ5IHNpciwgeW91IGxvb2sgbGlrZSBhIGRlY2VudCBraW5kIG9mIHBlcnNvbiwgYW5kIElcXCdtIGFmcmFpZCB3ZSBoYXZlIG5vIHBsYWNlIGZvciB0aGF0IG9uIHRlbGV2aXNpb24uIE1heWJlIGlmIHlvdSBjYW1lIGJhY2sgZHJlc3NlZCBsaWtlIGEgbWFuaWFjIHdlIGNvdWxkIHdvcmsgc29tZXRoaW5nIG91dC4nKVxuICAgICAgICAgICAgICAgIHdoZW4gM1xuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgbG9va3MgeW91IG92ZXIsIG5vdGljaW5nIGdvb2QgdGFzdGUsIHlvdXIga25hY2sgZm9yIGZsYWlyIGFuZCBhdHRlbnRpb24gdG8gZGV0YWlsLiBIZSBkZWNsYXJlcyBcIldlbGwsIEkgYXBwcmVjaWF0ZSB5b3UgdGFraW5nIHRpbWUgdG8gYXNzZW1ibGUgdGhlIGNvc3R1bWUsIGJ1dCBpdCBpcyBqdXN0IGEgYml0IHRvbyBvcmRlcmx5LiBZb3UgcmVhbGx5IGFyZW5cXCd0IHdoYXQgd2UgYXJlIGxvb2tpbmcgZm9yLlwiJylcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgd2hlbiAyXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIHNob3cgbWFuYWdlciBsb29rcyBwbGVhc2VkLCB5ZXQgYSB0b3VjaCB0cm91YmxlZC4gXCJZb3UgbG9vayB0byBiZSBhIG1hbiBnb2luZyBpbiB0aGUgcmlnaHQgZGlyZWN0aW9uLCBidXQgd2Ugb25seSBzZWxlY3QgdGhlIGJlc3Qgb2YgdGhlIGJlc3QgZm9yIFNlYWwgb3Igbm8gU2VhbC4gWW91ciBjb3N0dW1lIGlzIG5vdCBxdWl0ZSByZWFkeSBmb3IgdGhlIGJpZyBzaG93IHlldC4nKVxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgICAgICB3aGVuIDFcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ1wiT2gsIHdvdyFcIiBFeGNsYWltcyB0aGUgc2hvdyBtYW5hZ2VyLiBcIllvdSBsb29rIGFic29sdXRlbHkgYXdmdWwuIFlvdSBkZWZpbml0ZWx5IGhhdmUgdGhlIGxvb2sgZm9yIG91ciBzaG93LlwiIFlvdSBzdGFydCB0byBkYW5jZSBhcm91bmQsIHdob29waW5nIGFuZCBob2xsZXJpbmcsIGRlY2xhcmluZyB5b3Vyc2VsZiB0aGUgZnV0dXJlIGtpbmcgb2YgdGhlIHdvcmxkLiBcIkFuZCBJIHNlZSB5b3UgaGF2ZSB0aGUgY2hhcmlzbWEgdG8gbWF0Y2guXCIgSGUgdHVybnMgdG8gaGlzIGFzc2lzdGFudCwgXCJHZXQgdGhpcyBmZWxsYSBvbiBzdGFnZSBhdCBvbmNlLicpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChPbiBTdGFnZSEpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoT24gU3RhZ2UhKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnXCJXZWxjb21lIGJhY2sgdG8gdGhlIFNlYWwgb3IgTm8gU2VhbCwgdGhlIG1vc3QgcG9wdWxhciBnYW1lIHNob3cgdW5kZXIgdGhlIHNlYSEgSVxcJ20geW91ciB3ZWxsIHRhbm5lZCBob3N0IEplcnJ5IFppbnRlcnZhbmRlcmJpbmRlcmJhdWVyIEpyLiBMZXRcXCdzIG1lZXQgb3VyIG5leHQgY29udGVzdGFudDogU2hhcmMhIEFuIGluY3JlZGlibHkgb2Jub3hpb3VzIHlldCBwZXJzdWFzaXZlIHlvdW5nIG9jZWFuIGR3ZWxsZXIsIGhlIGxvdmVzIGFubm95aW5nIGhpcyBmcmllbmRzIGFuZCBpcyBhbHdheXMgdXAgZm9yIGEgcm91bmQgb2YgU2NyYWJibGUsIExBRElFUy4gVGltZSB0byBnZXQgc3RhcnRlZC4gTm93LCBTaGFyYyBJIGFtIGdvaW5nIHRvIHByZXNlbnQgeW91IHdpdGggYSBicmllZmNhc2UuIEluIHRoaXMgYnJpZWZjYXNlLCB0aGVyZSBtaWdodCBiZSBhIHNlYWwgb3IgdGhlcmUgbWlnaHQgbm90IGJlIGEgc2VhbC4gQW5kIEkgbmVlZCB5b3UgdG8gdGVsbCBtZSB3aGljaCBpdCBpczogU0VBTCBvciBOTyBTRUFMP1wiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdubyBzZWFsJylcbiAgICAgICAgICAgIGFsZXJ0KCdKZXJyeSBzbG93bHkgb3BlbnMgdGhlIGJyaWVmY2FzZSwgcGVla2luZyBpbnNpZGUgZmlyc3QgdG8gZGV0ZWN0IGFueSBzaWducyBvZiBzZWFsIGVudHJhaWxzIGFuZCB0aGVuLCB3ZWFyaW5nIGEgZmFjZSBvZiBwcmFjdGljZWQgZGlzYXBwb2ludG1lbnQgYW5kIGVtcGF0aHksIHdoaW1wZXJzIFwiVG9vIGJhZCxcIiBsZXR0aW5nIHRoZSBjYXNlIG9wZW4gdGhlIHJlc3Qgb2YgdGhlIHdheS4gQXQgdGhpcywgeW91IGFyZSBwcm9tcHRseSB1c2hlcmVkIG9mZiB0aGUgc3RhZ2UgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN1Y2tlci4nKVxuICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc2VhbCcpXG4gICAgICAgICAgICBhbGVydCgnSmVycnkgc2xvd2x5IG9wZW5zIHRoZSBicmllZmNhc2UsIHBlZWtpbmcgaW5zaWRlIGZpcnN0IHRvIGRldGVjdCBhbnkgc2lnbnMgb2Ygc2VhbCBlbnRyYWlscyBhbmQgdGhlbiBleGNpdGVkbHkgcHVsbHMgaXQgYWxsIHRoZSB3YXkgb3Blbi4gXCJIZVxcJ3MgcmlnaHQgcGVvcGxlISBOb3csIGxldFxcJ3Mgc2VlIHlvdXIgcHJpemVzLlwiIFwiUHJpemVzIGlzIHJpZ2h0IEplcnJ5LFwiIHNheXMgYSB2b2ljZSBjb21pbmcgZnJvbSBub3doZXJlIGFuZCBldmVyeXdoZXJlIGFsbCBhdCBvbmNlLiBcIkhlcmUgYXJlIHNvbWUgd29ybGQgY2xhc3Mgc2VsZWN0aW9ucyBJIHBpY2tlZCB1cCBmcm9tIHRoZSBncm9jZXJ5IHN0b3JlIG9uIHRoZSB3YXkgaGVyZSB0aGlzIG1vcm5pbmc6IFN1Y2Nlc3MgY29tZXMgaW4gY2Fucywgbm90IGluIGNhbiBub3RzLiBUaW4gY2FucyB0aGF0IGlzISBUaGF0XFwncyB3aHkgd2UgYXJlIG9mZmVyaW5nIHlvdSB0aGUgY2hvaWNlIG9mIGEgZnVsbCB3ZWVrXFwncyBzdXBwbHkgb2YgXFwnQ2FwdGFpbiBOZWRcXCdzIFBpY2tsZWQgSGVycmluZ1xcJywgb3IgXFwnTm8gSWZzIEFuZHMgb3IgQnV0dGVyXFwnIGJyYW5kIG1hcmdhcmluZSBzcHJlYWQgcHJvZHVjdCBmb3IgeW91ciBjb25zdW1wdGlvbiBwbGVhc3VyZS4gIE5hdHVyYWxseSB5b3UgY2hvb3NlIHRoZSBtYXJnYXJpbmUgYmVjYXVzZSB5b3UgYXJlIGhlYWx0aCBjb25zY2lvdXMgb3Igc29tZXRoaW5nLicpXG4gICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgIEBnZXRJdGVtKCdtYXJnYXJpbmUnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCcsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnT2ggbWFuLCBXYXRlciBXb3JsZCEgWW91IGxvdmUgdGhhdCBtb3ZpZS4gS2V2aW4gQ29zdG5lciBzaG91bGQgaGF2ZSB0b3RhbGx5IGdvdHRlbiB0aGUgT3NjYXIuIFdhaXQgdGhpcyBpc25cXCd0IGxpa2UgdGhhdC4gVGhpcyBpcyBXYXRlciBXb3JsZCwgdGhlIGhvbWUgb2YgdGhhdCBzdHVwaWQga2lsbGVyIHdoYWxlLCBTaGFtcHUuIFdoYXQgYSBoYWNrISBPYnZpb3VzIGV4aXRzIGFyZSBub3J0aCB0byB0aGUgTWFuYXRlZSBzaG93LCBlYXN0IHRvIHRoZSBnaWZ0IHNob3AsIGFuZCBzb3V0aCB0byB0aGUgQWNodGlwdXNcXCdzIGdhcmRlbi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKEdpZnQgU2hvcCknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0FuZCB0aGVyZSBpdCBpczogVGhlIGlsbHVzdHJpb3VzIG1hbmF0ZWUuIFlvdSBjYW4gc2VlIHdoeSB0aGUgc3RhbmRzIGFyZSBlbXB0eS4gVGhlcmUgYXJlIGJpZyB1bWJyZWxsYXMgYXR0YWNoZWQgdG8gc29tZSBwaWNuaWMgdGFibGVzOyBub3QgbXVjaCB0byBzZWUuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIE1hbmF0ZWUgc2VydmljZSByb29tIGFuZCBzb3V0aCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgdW1icmVsbGEnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3VtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnV2VsbCwgb2theS4gWW91IG5vdyBoYXZlIGFuIHVtYnJlbGxhLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNZWNoYW5pY2FsIFJvb20gVHlwZSBQbGFjZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkIChHaWZ0IFNob3ApJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZW50ZXIgdGhlIFdhdGVyIFdvcmxkIGdpZnQgc2hvcC4gVGhlcmUgYXJlIGFsbCBzb3J0cyBvZiBncmVhdCBpdGVtcyBoZXJlOiBhIGdpYW50IHN0dWZmZWQgb2N0b3B1cywgZGVoeWRyYXRlZCBhc3Ryb25hdXQgZmlzaCBmb29kLCBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgYmFkZ2Ugc3RpY2tlcnMsIGFuZCBzb21lIG9mIHRoYXQgY2xheSBzYW5kIGNyYXAgdGhleSB1c2VkIHRvIGFkdmVydGlzZSBvbiBUVi4gU2VlIGFueXRoaW5nIHlvdSBsaWtlPyBXZXN0IHRvIHRoZSBwYXJrIGVudHJhbmNlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBiYWRnZScpIG9yIEBtYXRjaGVzKCd0YWtlIHNoZXJpZmYnKSBvciBAbWF0Y2hlcygndGFrZSBzdGlja2VyJykgb3IgQG1hdGNoZXMoJ3Rha2Ugc3RpY2tlcnMnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2JhZGdlIHN0aWNrZXInKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgdGFrZSB0aGUganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzIHRvIHRoZSBjb3VudGVyLiBUaGUgY2FzaGllciBzYXlzIHRoZXkgYXJlIG9uIHNhbGUsIG9ubHkgMTUgZmlzaCBkb2xsYXJzLCBwbHVzIHRheC4gWXVzc3NzLiBZb3UgcGF5IHRoZSBtYW4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHRha2UgdGhhdCBpdGVtIHRvIHRoZSBjb3VudGVyLiBUaGUgY2FzaGllciBzYXlzIGl0IGlzICcgKyAoMTggKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzMCkpLnRvU3RyaW5nKCkgKyAnIGZpc2ggZG9sbGFycyBidXQgeW91IG9ubHkgaGF2ZSAxNyBmaXNoIGRvbGxhcnMuIE51dHMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKE1lY2hhbmljYWwgUm9vbSBUeXBlIFBsYWNlKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnV2hhdCBpbiB0aGUgbmFtZSBvZiBDYXB0YWluIE5lbW8gaXMgdGhpcz8gVGhlcmUgYXJlIG1hbmF0ZWVzIGluIGhvaXN0cyBhbGwgb3ZlciB0aGUgcm9vbSBob29rZWQgdXAgdG8uLi5taWxraW5nIGRldmljZXMuIFRoaXMgaXMgbm8gbWVjaGFuaWNhbCByb29tISBJdFxcJ3MgYSBjb3ZlciBmb3IgYSBzZWNyZXQsIGlsbGVnYWwsIHVuZGVyZ3JvdW5kLCBibGFjayBtYXJrZXQsIGJ1dCBwcm9iYWJseSBvcmdhbmljLCBzZWEgY293IG1pbGtpbmcgb3BlcmF0aW9uLiBUaGUgZmllbmRzISBZb3UgYXJlIGdvaW5nIHRvIGJsb3cgdGhlIGxpZCBvZmYgdGhpcyB0aGluZyBmb3Igc3VyZS4gVGhlIHN3ZWF0eSBvbGQgZmlzaCBydW5uaW5nIHRoZSBtYWNoaW5lcnkgaGFzIG5vdCBub3RpY2VkIHlvdSB5ZXQuIE9idmlvdXMgZXhpdHMgYXJlIGVhc3QgdG8gdGhlIG1hbmF0ZWUgZXhoaWJpdC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJykgb3IgQG1hdGNoKCdiYWRnZScpIG9yIEBtYXRjaCgnc3RpY2tlcicpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2JhZGdlIHN0aWNrZXInKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHN3aW0gdXAgdG8gdGhlIGZpc2ggYXQgdGhlIGNvbnRyb2xzLiBcIkkgYW0gZ29pbmcgdG8gc2h1dCB5b3UgZG93biFcIiBZb3Ugc2hvdXQgYXQgaGltLiBIZSBsYXVnaHMgaGVhcnRpbHkuIFwiWW91IGRvblxcJ3Qgc3RhbmQgYSBjaGFuY2UuIFlvdVxcJ3JlIGp1c3QgYSByZWd1bGFyIGd1eS4gSVxcJ20gdGhlIG1heW9yIG9mIFdhdGVyIFdvcmxkLiBXaG8gaXMgZ29pbmcgdG8gYmVsaWV2ZSB5b3U/XCIgSGUgZ29lcyBiYWNrIHRvIGhpcyB3b3JrIHBheWluZyB5b3Ugbm8gbWluZC4gSGUgaGFzIGEgcG9pbnQuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBzd2ltIHVwIHRvIHRoZSBmaXNoIGJyYW5kaXNoaW5nIHlvdXIgYmFkZ2Ugc3RpY2tlci4gXCJZb3UgYXJlIHVuZGVyIGFycmVzdCBmb3IgaWxsZWdhbCBtaWxrIGhhcnZlc3RpbmcgZnJvbSBlbmRhbmdlcmVkIG1hbmF0ZWVzLiBJXFwnbSB0YWtpbmcgeW91IGluLlwiIFwiV2FpdCxcIiBoZSBzYXlzLCBcIllvdSBkb25cXCd0IGhhdmUgdG8gZG8gdGhpcy4gSXRcXCdzIHRoZSBvbmx5IHdheSBJIGNhbiBrZWVwIFdhdGVyIFdvcmxkIHJ1bm5pbmcuIERvblxcJ3QgeW91IHNlZT8gTm93IHRoYXQgd2UgYXJlIG9uIG91ciBzaXh0aCBTaGFtcHUsIHBlb3BsZSBqdXN0IGRvblxcJ3Qgc2VlbSB0byBjYXJlIGFib3V0IHRoZSBtYWdpYyBvZiBleHBsb2l0ZWQgbWFyaW5lIG1hbW1hbHMuIEkgd2lsbCwgdWguLi5tYWtlIGl0IHdvcnRoIHlvdXIgd2hpbGUgdGhvdWdoLlwiIEhlIHNsaWRlcyBhIGZyZXNoIGJvdHRsZSBvZiBtaWxrIGluIHlvdXIgZGlyZWN0aW9uLiBXaXRob3V0IGxvb2tpbmcgYXQgeW91IGhlIHNheXMsIFwiSXQgaXMgd29ydGggdGhvdXNhbmRzIGluIHRoZSByaWdodCBtYXJrZXQuXCInKVxuICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdtaWxrJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnVGhlIEV0aGVyZWFsIFJlYWxtJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgaGF2ZSBlbnRlcmVkIFRoZSBFdGhlcmVhbCBSZWFsbS4gV2h5IGRpZCB5b3UgZG8gdGhhdD8gVGhhdCB3YXMgYSBiYWQgZGVjaXNpb24uIFdhbGUgaXMgYXQgeW91ciBzaWRlLiBUaGVyZSBhcmUgYSBidW5jaCBvZiB3ZWlyZCwgc3BhY2V5IHBsYXRmb3JtcyBhbmQganVuayBmbG9hdGluZyBhcm91bmQgaW4gYSBjb3NtaWMgdm9pZCAtLSB5b3VyIHR5cGljYWwgc3VycmVhbGlzdCBkcmVhbXNjYXBlIGVudmlyb25tZW50LiBBaGVhZCBpcyBhbiB1Z2x5IG1vbnN0ZXIuIEhlIGlzIGNsdXRjaGluZyBzb21ldGhpbmcgaW4gaGlzIGhhbmQuIE9idmlvdXMgZXhpdHMgYXJlIE5PTkUhIFRoaXMgaXMgdGhlIHdvcmxkIG9mIHdha2luZyBuaWdodG1hcmVzIHlvdSBkaW5ndXMuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayBtb25zdGVyJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBnZXR0aW5nIHdvcnNlIGF0IHRoaXMgZ2FtZS4gWW91IGFwcHJvYWNoIHNhaWQgbW9uc3RlciBpbiBhbiBlZmZvcnQgdG8gZ2V0IHNvbWUgbGVhZHMgb24geW91ciBwcmVjaW91cyBoYWlyIHByb2R1Y3QuIE1heWJlIHN0YXJ0IGJ5IGFza2luZyBoaW0gYWJvdXQgdGhlIHN0YXR1cyBvZiB0aGUgbG9jYWwgYmFza2V0YmFsbCB0ZWFtIG9yIHNvbWV0aGluZz8gT24gY2xvc2VyIGV4YW1pbmF0aW9uIHRob3VnaCwgeW91IHJlYWxpemUgdGhpcyBpcyBub3QganVzdCBhbnkgbW9uc3Rlci4gSXQgaXMgYSBUb3J1bWVraWFuIGh5cGVyIGdvYmxpbi4gQW5kIGluIGhpcyBncmlzbHkgcGF3IHJlc3RzIHRoZSBpdGVtIG9mIHlvdXIgcXVlc3QsIHlvdXIgJDIzIHNoYW1wb28uIFwiU2hhcmMsIHdlIGNhbiBub3QgYWxsb3cgaGltIHRvIHVzZSB0aGF0IHNoYW1wb28sXCIgd2hpc3BlcnMgeW91ciBjb21wYW5pb24uIFwiT24gdGhlIGhlYWQgb2YgYSBoeXBlciBnb2JsaW4sIGhhaXIgdGhhdCBzbW9vdGggY291bGQgbWVhbiB0aGUgZW5kIG9mIGZhc2hpb24gYXMgd2Uga25vdyBpdC4gV2UgbXVzdCByZXRyaWV2ZSBpdCBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5LlwiIE5vIHNvb25lciBoYXZlIHRoZSB3b3JkcyBsZWZ0IFdhbGVcXCdzIGxpcHMgdGhhdCB5b3UgYXJlIHNwb3R0ZWQuIFRoYXQgaXMgYWxsIHRoZSBtb3RpdmF0aW9uIHRoaXMgYmVhc3QgbmVlZHMuIEhlIGZsaXBzIHRoZSBjYXAgb24gdGhlIGJvdHRsZSwgcmFpc2luZyBpdCB0byB0aGUgZmlsdGh5LCBzdHJpbmctbGlrZSBtb3AgeW91IGNhbiBvbmx5IGFzc3VtZSBtdXN0IGJlIGhpcyBoYWlyLCBhbGwgdGhlIHdoaWxlIGdhemluZyBkb3duIGF0IHlvdSBpbiBkZWZpYW5jZSB3aXRoIGhpcyBzaW5nbGUgYmxvb2Qgc2hvdCBleWUuIERvIHNvbWV0aGluZyEnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2F0dGFjaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzdGFydCB0byBsdW5nZSB0b3dhcmRzIHRoZSBjcmVhdHVyZSwgYnV0IFdhbGUgcHVzaGVzIHlvdSBvdXQgb2YgdGhlIHdheSBpbiBhIGNoYXJnZSBoaW1zZWxmLiBZb3UgY3JpbmdlIGFzIHlvdSBoZWFyIHRoZSBzbGFzaGluZyBvZiBmbGVzaC4gUmVkIG1pc3QgZmxvYXRzIG91dCBvZiBXYWxlXFwncyBzaWRlLiBZb3VyIGhlYWQgaXMgc3Bpbm5pbmcuICBcIk5vdyBTaGFyYyFcIiwgaGUgd2hlZXplcywgXCJVc2UgdGhlIHBvd2VyIG9mIHRoZSBRdWFkcmF0aWMgRXllLlwiIFwiQnV0IHlvdSBzYWlkIEkgd2FzblxcJ3QgcmVhZHkhXCIgeW91IGNyeSwgdHJ5aW5nIG5vdCB0byBsb29rIGF0IHRoZSBzb3JyeSBzdGF0ZSBvZiB5b3VyIGZyaWVuZC4gXCJObywgaXQgd2FzIEkgd2hvIHdhcyBub3QgcmVhZHkuIFRoZSBwLXBvd2VyIGhhcyBhbHdheXMgYmVlbiB3aXRoaW4geS15b3UuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3VzZSBxdWFkcmF0aWMgZXllJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnRW5kJylcblxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnRW5kJywgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgcmVtb3ZlIHRoZSBRdWFkcmF0aWMgRXllIGZyb20gaXRzIGNvbXBhcnRtZW50LCBjbG9zZSB5b3VyIGV5ZXMgYW5kIGFsbG93IHVuaW9uIGJldHdlZW4geW91ciBzcGlyaXQgYW5kIHRoZSB1bml2ZXJzYWwgY2hpIGZsb3cuIFRoZW4gdGhlIGdvYmxpbiBnZXRzIGN1dCBpbiBoYWxmIGFuZCB5b3UgZ2V0IHlvdXIgc2hhbXBvbyBiYWNrLicpXG5cblxuICAgIGVuZ2luZS5zZXRTdGFydFJvb20oJ1dhbGUgdnMgU2hhcmM6IFRoZSBDb21pYzogVGhlIEludGVyYWN0aXZlIFNvZnR3YXJlIFRpdGxlIEZvciBZb3VyIENvbXB1dGVyIEJveCcpXG4iLCJ2YXIgbSA9IChmdW5jdGlvbiBhcHAod2luZG93LCB1bmRlZmluZWQpIHtcclxuXHR2YXIgT0JKRUNUID0gXCJbb2JqZWN0IE9iamVjdF1cIiwgQVJSQVkgPSBcIltvYmplY3QgQXJyYXldXCIsIFNUUklORyA9IFwiW29iamVjdCBTdHJpbmddXCIsIEZVTkNUSU9OID0gXCJmdW5jdGlvblwiO1xyXG5cdHZhciB0eXBlID0ge30udG9TdHJpbmc7XHJcblx0dmFyIHBhcnNlciA9IC8oPzooXnwjfFxcLikoW14jXFwuXFxbXFxdXSspKXwoXFxbLis/XFxdKS9nLCBhdHRyUGFyc2VyID0gL1xcWyguKz8pKD86PShcInwnfCkoLio/KVxcMik/XFxdLztcclxuXHR2YXIgdm9pZEVsZW1lbnRzID0gL14oQVJFQXxCQVNFfEJSfENPTHxDT01NQU5EfEVNQkVEfEhSfElNR3xJTlBVVHxLRVlHRU58TElOS3xNRVRBfFBBUkFNfFNPVVJDRXxUUkFDS3xXQlIpJC87XHJcblx0dmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9XHJcblxyXG5cdC8vIGNhY2hpbmcgY29tbW9ubHkgdXNlZCB2YXJpYWJsZXNcclxuXHR2YXIgJGRvY3VtZW50LCAkbG9jYXRpb24sICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUsICRjYW5jZWxBbmltYXRpb25GcmFtZTtcclxuXHJcblx0Ly8gc2VsZiBpbnZva2luZyBmdW5jdGlvbiBuZWVkZWQgYmVjYXVzZSBvZiB0aGUgd2F5IG1vY2tzIHdvcmtcclxuXHRmdW5jdGlvbiBpbml0aWFsaXplKHdpbmRvdyl7XHJcblx0XHQkZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XHJcblx0XHQkbG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XHJcblx0XHQkY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LmNsZWFyVGltZW91dDtcclxuXHRcdCRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5zZXRUaW1lb3V0O1xyXG5cdH1cclxuXHJcblx0aW5pdGlhbGl6ZSh3aW5kb3cpO1xyXG5cclxuXHJcblx0LyoqXHJcblx0ICogQHR5cGVkZWYge1N0cmluZ30gVGFnXHJcblx0ICogQSBzdHJpbmcgdGhhdCBsb29rcyBsaWtlIC0+IGRpdi5jbGFzc25hbWUjaWRbcGFyYW09b25lXVtwYXJhbTI9dHdvXVxyXG5cdCAqIFdoaWNoIGRlc2NyaWJlcyBhIERPTSBub2RlXHJcblx0ICovXHJcblxyXG5cdC8qKlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtUYWd9IFRoZSBET00gbm9kZSB0YWdcclxuXHQgKiBAcGFyYW0ge09iamVjdD1bXX0gb3B0aW9uYWwga2V5LXZhbHVlIHBhaXJzIHRvIGJlIG1hcHBlZCB0byBET00gYXR0cnNcclxuXHQgKiBAcGFyYW0gey4uLm1Ob2RlPVtdfSBaZXJvIG9yIG1vcmUgTWl0aHJpbCBjaGlsZCBub2Rlcy4gQ2FuIGJlIGFuIGFycmF5LCBvciBzcGxhdCAob3B0aW9uYWwpXHJcblx0ICpcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBtKCkge1xyXG5cdFx0dmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcblx0XHR2YXIgaGFzQXR0cnMgPSBhcmdzWzFdICE9IG51bGwgJiYgdHlwZS5jYWxsKGFyZ3NbMV0pID09PSBPQkpFQ1QgJiYgIShcInRhZ1wiIGluIGFyZ3NbMV0gfHwgXCJ2aWV3XCIgaW4gYXJnc1sxXSkgJiYgIShcInN1YnRyZWVcIiBpbiBhcmdzWzFdKTtcclxuXHRcdHZhciBhdHRycyA9IGhhc0F0dHJzID8gYXJnc1sxXSA6IHt9O1xyXG5cdFx0dmFyIGNsYXNzQXR0ck5hbWUgPSBcImNsYXNzXCIgaW4gYXR0cnMgPyBcImNsYXNzXCIgOiBcImNsYXNzTmFtZVwiO1xyXG5cdFx0dmFyIGNlbGwgPSB7dGFnOiBcImRpdlwiLCBhdHRyczoge319O1xyXG5cdFx0dmFyIG1hdGNoLCBjbGFzc2VzID0gW107XHJcblx0XHRpZiAodHlwZS5jYWxsKGFyZ3NbMF0pICE9IFNUUklORykgdGhyb3cgbmV3IEVycm9yKFwic2VsZWN0b3IgaW4gbShzZWxlY3RvciwgYXR0cnMsIGNoaWxkcmVuKSBzaG91bGQgYmUgYSBzdHJpbmdcIilcclxuXHRcdHdoaWxlIChtYXRjaCA9IHBhcnNlci5leGVjKGFyZ3NbMF0pKSB7XHJcblx0XHRcdGlmIChtYXRjaFsxXSA9PT0gXCJcIiAmJiBtYXRjaFsyXSkgY2VsbC50YWcgPSBtYXRjaFsyXTtcclxuXHRcdFx0ZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiI1wiKSBjZWxsLmF0dHJzLmlkID0gbWF0Y2hbMl07XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzFdID09PSBcIi5cIikgY2xhc3Nlcy5wdXNoKG1hdGNoWzJdKTtcclxuXHRcdFx0ZWxzZSBpZiAobWF0Y2hbM11bMF0gPT09IFwiW1wiKSB7XHJcblx0XHRcdFx0dmFyIHBhaXIgPSBhdHRyUGFyc2VyLmV4ZWMobWF0Y2hbM10pO1xyXG5cdFx0XHRcdGNlbGwuYXR0cnNbcGFpclsxXV0gPSBwYWlyWzNdIHx8IChwYWlyWzJdID8gXCJcIiA6dHJ1ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaGlsZHJlbiA9IGhhc0F0dHJzID8gYXJncy5zbGljZSgyKSA6IGFyZ3Muc2xpY2UoMSk7XHJcblx0XHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAxICYmIHR5cGUuY2FsbChjaGlsZHJlblswXSkgPT09IEFSUkFZKSB7XHJcblx0XHRcdGNlbGwuY2hpbGRyZW4gPSBjaGlsZHJlblswXVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdGNlbGwuY2hpbGRyZW4gPSBjaGlsZHJlblxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRmb3IgKHZhciBhdHRyTmFtZSBpbiBhdHRycykge1xyXG5cdFx0XHRpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUpKSB7XHJcblx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBjbGFzc0F0dHJOYW1lICYmIGF0dHJzW2F0dHJOYW1lXSAhPSBudWxsICYmIGF0dHJzW2F0dHJOYW1lXSAhPT0gXCJcIikge1xyXG5cdFx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGF0dHJzW2F0dHJOYW1lXSlcclxuXHRcdFx0XHRcdGNlbGwuYXR0cnNbYXR0ck5hbWVdID0gXCJcIiAvL2NyZWF0ZSBrZXkgaW4gY29ycmVjdCBpdGVyYXRpb24gb3JkZXJcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBjZWxsLmF0dHJzW2F0dHJOYW1lXSA9IGF0dHJzW2F0dHJOYW1lXVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAoY2xhc3Nlcy5sZW5ndGggPiAwKSBjZWxsLmF0dHJzW2NsYXNzQXR0ck5hbWVdID0gY2xhc3Nlcy5qb2luKFwiIFwiKTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIGNlbGxcclxuXHR9XHJcblx0ZnVuY3Rpb24gYnVpbGQocGFyZW50RWxlbWVudCwgcGFyZW50VGFnLCBwYXJlbnRDYWNoZSwgcGFyZW50SW5kZXgsIGRhdGEsIGNhY2hlZCwgc2hvdWxkUmVhdHRhY2gsIGluZGV4LCBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKSB7XHJcblx0XHQvL2BidWlsZGAgaXMgYSByZWN1cnNpdmUgZnVuY3Rpb24gdGhhdCBtYW5hZ2VzIGNyZWF0aW9uL2RpZmZpbmcvcmVtb3ZhbCBvZiBET00gZWxlbWVudHMgYmFzZWQgb24gY29tcGFyaXNvbiBiZXR3ZWVuIGBkYXRhYCBhbmQgYGNhY2hlZGBcclxuXHRcdC8vdGhlIGRpZmYgYWxnb3JpdGhtIGNhbiBiZSBzdW1tYXJpemVkIGFzIHRoaXM6XHJcblx0XHQvLzEgLSBjb21wYXJlIGBkYXRhYCBhbmQgYGNhY2hlZGBcclxuXHRcdC8vMiAtIGlmIHRoZXkgYXJlIGRpZmZlcmVudCwgY29weSBgZGF0YWAgdG8gYGNhY2hlZGAgYW5kIHVwZGF0ZSB0aGUgRE9NIGJhc2VkIG9uIHdoYXQgdGhlIGRpZmZlcmVuY2UgaXNcclxuXHRcdC8vMyAtIHJlY3Vyc2l2ZWx5IGFwcGx5IHRoaXMgYWxnb3JpdGhtIGZvciBldmVyeSBhcnJheSBhbmQgZm9yIHRoZSBjaGlsZHJlbiBvZiBldmVyeSB2aXJ0dWFsIGVsZW1lbnRcclxuXHJcblx0XHQvL3RoZSBgY2FjaGVkYCBkYXRhIHN0cnVjdHVyZSBpcyBlc3NlbnRpYWxseSB0aGUgc2FtZSBhcyB0aGUgcHJldmlvdXMgcmVkcmF3J3MgYGRhdGFgIGRhdGEgc3RydWN0dXJlLCB3aXRoIGEgZmV3IGFkZGl0aW9uczpcclxuXHRcdC8vLSBgY2FjaGVkYCBhbHdheXMgaGFzIGEgcHJvcGVydHkgY2FsbGVkIGBub2Rlc2AsIHdoaWNoIGlzIGEgbGlzdCBvZiBET00gZWxlbWVudHMgdGhhdCBjb3JyZXNwb25kIHRvIHRoZSBkYXRhIHJlcHJlc2VudGVkIGJ5IHRoZSByZXNwZWN0aXZlIHZpcnR1YWwgZWxlbWVudFxyXG5cdFx0Ly8tIGluIG9yZGVyIHRvIHN1cHBvcnQgYXR0YWNoaW5nIGBub2Rlc2AgYXMgYSBwcm9wZXJ0eSBvZiBgY2FjaGVkYCwgYGNhY2hlZGAgaXMgKmFsd2F5cyogYSBub24tcHJpbWl0aXZlIG9iamVjdCwgaS5lLiBpZiB0aGUgZGF0YSB3YXMgYSBzdHJpbmcsIHRoZW4gY2FjaGVkIGlzIGEgU3RyaW5nIGluc3RhbmNlLiBJZiBkYXRhIHdhcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAsIGNhY2hlZCBpcyBgbmV3IFN0cmluZyhcIlwiKWBcclxuXHRcdC8vLSBgY2FjaGVkIGFsc28gaGFzIGEgYGNvbmZpZ0NvbnRleHRgIHByb3BlcnR5LCB3aGljaCBpcyB0aGUgc3RhdGUgc3RvcmFnZSBvYmplY3QgZXhwb3NlZCBieSBjb25maWcoZWxlbWVudCwgaXNJbml0aWFsaXplZCwgY29udGV4dClcclxuXHRcdC8vLSB3aGVuIGBjYWNoZWRgIGlzIGFuIE9iamVjdCwgaXQgcmVwcmVzZW50cyBhIHZpcnR1YWwgZWxlbWVudDsgd2hlbiBpdCdzIGFuIEFycmF5LCBpdCByZXByZXNlbnRzIGEgbGlzdCBvZiBlbGVtZW50czsgd2hlbiBpdCdzIGEgU3RyaW5nLCBOdW1iZXIgb3IgQm9vbGVhbiwgaXQgcmVwcmVzZW50cyBhIHRleHQgbm9kZVxyXG5cclxuXHRcdC8vYHBhcmVudEVsZW1lbnRgIGlzIGEgRE9NIGVsZW1lbnQgdXNlZCBmb3IgVzNDIERPTSBBUEkgY2FsbHNcclxuXHRcdC8vYHBhcmVudFRhZ2AgaXMgb25seSB1c2VkIGZvciBoYW5kbGluZyBhIGNvcm5lciBjYXNlIGZvciB0ZXh0YXJlYSB2YWx1ZXNcclxuXHRcdC8vYHBhcmVudENhY2hlYCBpcyB1c2VkIHRvIHJlbW92ZSBub2RlcyBpbiBzb21lIG11bHRpLW5vZGUgY2FzZXNcclxuXHRcdC8vYHBhcmVudEluZGV4YCBhbmQgYGluZGV4YCBhcmUgdXNlZCB0byBmaWd1cmUgb3V0IHRoZSBvZmZzZXQgb2Ygbm9kZXMuIFRoZXkncmUgYXJ0aWZhY3RzIGZyb20gYmVmb3JlIGFycmF5cyBzdGFydGVkIGJlaW5nIGZsYXR0ZW5lZCBhbmQgYXJlIGxpa2VseSByZWZhY3RvcmFibGVcclxuXHRcdC8vYGRhdGFgIGFuZCBgY2FjaGVkYCBhcmUsIHJlc3BlY3RpdmVseSwgdGhlIG5ldyBhbmQgb2xkIG5vZGVzIGJlaW5nIGRpZmZlZFxyXG5cdFx0Ly9gc2hvdWxkUmVhdHRhY2hgIGlzIGEgZmxhZyBpbmRpY2F0aW5nIHdoZXRoZXIgYSBwYXJlbnQgbm9kZSB3YXMgcmVjcmVhdGVkIChpZiBzbywgYW5kIGlmIHRoaXMgbm9kZSBpcyByZXVzZWQsIHRoZW4gdGhpcyBub2RlIG11c3QgcmVhdHRhY2ggaXRzZWxmIHRvIHRoZSBuZXcgcGFyZW50KVxyXG5cdFx0Ly9gZWRpdGFibGVgIGlzIGEgZmxhZyB0aGF0IGluZGljYXRlcyB3aGV0aGVyIGFuIGFuY2VzdG9yIGlzIGNvbnRlbnRlZGl0YWJsZVxyXG5cdFx0Ly9gbmFtZXNwYWNlYCBpbmRpY2F0ZXMgdGhlIGNsb3Nlc3QgSFRNTCBuYW1lc3BhY2UgYXMgaXQgY2FzY2FkZXMgZG93biBmcm9tIGFuIGFuY2VzdG9yXHJcblx0XHQvL2Bjb25maWdzYCBpcyBhIGxpc3Qgb2YgY29uZmlnIGZ1bmN0aW9ucyB0byBydW4gYWZ0ZXIgdGhlIHRvcG1vc3QgYGJ1aWxkYCBjYWxsIGZpbmlzaGVzIHJ1bm5pbmdcclxuXHJcblx0XHQvL3RoZXJlJ3MgbG9naWMgdGhhdCByZWxpZXMgb24gdGhlIGFzc3VtcHRpb24gdGhhdCBudWxsIGFuZCB1bmRlZmluZWQgZGF0YSBhcmUgZXF1aXZhbGVudCB0byBlbXB0eSBzdHJpbmdzXHJcblx0XHQvLy0gdGhpcyBwcmV2ZW50cyBsaWZlY3ljbGUgc3VycHJpc2VzIGZyb20gcHJvY2VkdXJhbCBoZWxwZXJzIHRoYXQgbWl4IGltcGxpY2l0IGFuZCBleHBsaWNpdCByZXR1cm4gc3RhdGVtZW50cyAoZS5nLiBmdW5jdGlvbiBmb28oKSB7aWYgKGNvbmQpIHJldHVybiBtKFwiZGl2XCIpfVxyXG5cdFx0Ly8tIGl0IHNpbXBsaWZpZXMgZGlmZmluZyBjb2RlXHJcblx0XHQvL2RhdGEudG9TdHJpbmcoKSBtaWdodCB0aHJvdyBvciByZXR1cm4gbnVsbCBpZiBkYXRhIGlzIHRoZSByZXR1cm4gdmFsdWUgb2YgQ29uc29sZS5sb2cgaW4gRmlyZWZveCAoYmVoYXZpb3IgZGVwZW5kcyBvbiB2ZXJzaW9uKVxyXG5cdFx0dHJ5IHtpZiAoZGF0YSA9PSBudWxsIHx8IGRhdGEudG9TdHJpbmcoKSA9PSBudWxsKSBkYXRhID0gXCJcIjt9IGNhdGNoIChlKSB7ZGF0YSA9IFwiXCJ9XHJcblx0XHRpZiAoZGF0YS5zdWJ0cmVlID09PSBcInJldGFpblwiKSByZXR1cm4gY2FjaGVkO1xyXG5cdFx0dmFyIGNhY2hlZFR5cGUgPSB0eXBlLmNhbGwoY2FjaGVkKSwgZGF0YVR5cGUgPSB0eXBlLmNhbGwoZGF0YSk7XHJcblx0XHRpZiAoY2FjaGVkID09IG51bGwgfHwgY2FjaGVkVHlwZSAhPT0gZGF0YVR5cGUpIHtcclxuXHRcdFx0aWYgKGNhY2hlZCAhPSBudWxsKSB7XHJcblx0XHRcdFx0aWYgKHBhcmVudENhY2hlICYmIHBhcmVudENhY2hlLm5vZGVzKSB7XHJcblx0XHRcdFx0XHR2YXIgb2Zmc2V0ID0gaW5kZXggLSBwYXJlbnRJbmRleDtcclxuXHRcdFx0XHRcdHZhciBlbmQgPSBvZmZzZXQgKyAoZGF0YVR5cGUgPT09IEFSUkFZID8gZGF0YSA6IGNhY2hlZC5ub2RlcykubGVuZ3RoO1xyXG5cdFx0XHRcdFx0Y2xlYXIocGFyZW50Q2FjaGUubm9kZXMuc2xpY2Uob2Zmc2V0LCBlbmQpLCBwYXJlbnRDYWNoZS5zbGljZShvZmZzZXQsIGVuZCkpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgaWYgKGNhY2hlZC5ub2RlcykgY2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpXHJcblx0XHRcdH1cclxuXHRcdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3I7XHJcblx0XHRcdGlmIChjYWNoZWQudGFnKSBjYWNoZWQgPSB7fTsgLy9pZiBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgdmlydHVhbCBkb20gZWxlbWVudCwgdXNlIGEgYmxhbmsgb2JqZWN0IGFzIHRoZSBiYXNlIGNhY2hlZCBub2RlIGluc3RlYWQgb2YgY29weWluZyB0aGUgdmlydHVhbCBlbCAoIzI3NylcclxuXHRcdFx0Y2FjaGVkLm5vZGVzID0gW11cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoZGF0YVR5cGUgPT09IEFSUkFZKSB7XHJcblx0XHRcdC8vcmVjdXJzaXZlbHkgZmxhdHRlbiBhcnJheVxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdGlmICh0eXBlLmNhbGwoZGF0YVtpXSkgPT09IEFSUkFZKSB7XHJcblx0XHRcdFx0XHRkYXRhID0gZGF0YS5jb25jYXQuYXBwbHkoW10sIGRhdGEpO1xyXG5cdFx0XHRcdFx0aS0tIC8vY2hlY2sgY3VycmVudCBpbmRleCBhZ2FpbiBhbmQgZmxhdHRlbiB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSBuZXN0ZWQgYXJyYXlzIGF0IHRoYXQgaW5kZXhcclxuXHRcdFx0XHRcdGxlbiA9IGRhdGEubGVuZ3RoXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgbm9kZXMgPSBbXSwgaW50YWN0ID0gY2FjaGVkLmxlbmd0aCA9PT0gZGF0YS5sZW5ndGgsIHN1YkFycmF5Q291bnQgPSAwO1xyXG5cclxuXHRcdFx0Ly9rZXlzIGFsZ29yaXRobTogc29ydCBlbGVtZW50cyB3aXRob3V0IHJlY3JlYXRpbmcgdGhlbSBpZiBrZXlzIGFyZSBwcmVzZW50XHJcblx0XHRcdC8vMSkgY3JlYXRlIGEgbWFwIG9mIGFsbCBleGlzdGluZyBrZXlzLCBhbmQgbWFyayBhbGwgZm9yIGRlbGV0aW9uXHJcblx0XHRcdC8vMikgYWRkIG5ldyBrZXlzIHRvIG1hcCBhbmQgbWFyayB0aGVtIGZvciBhZGRpdGlvblxyXG5cdFx0XHQvLzMpIGlmIGtleSBleGlzdHMgaW4gbmV3IGxpc3QsIGNoYW5nZSBhY3Rpb24gZnJvbSBkZWxldGlvbiB0byBhIG1vdmVcclxuXHRcdFx0Ly80KSBmb3IgZWFjaCBrZXksIGhhbmRsZSBpdHMgY29ycmVzcG9uZGluZyBhY3Rpb24gYXMgbWFya2VkIGluIHByZXZpb3VzIHN0ZXBzXHJcblx0XHRcdHZhciBERUxFVElPTiA9IDEsIElOU0VSVElPTiA9IDIgLCBNT1ZFID0gMztcclxuXHRcdFx0dmFyIGV4aXN0aW5nID0ge30sIHNob3VsZE1haW50YWluSWRlbnRpdGllcyA9IGZhbHNlO1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNhY2hlZC5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGlmIChjYWNoZWRbaV0gJiYgY2FjaGVkW2ldLmF0dHJzICYmIGNhY2hlZFtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0c2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gdHJ1ZTtcclxuXHRcdFx0XHRcdGV4aXN0aW5nW2NhY2hlZFtpXS5hdHRycy5rZXldID0ge2FjdGlvbjogREVMRVRJT04sIGluZGV4OiBpfVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0dmFyIGd1aWQgPSAwXHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKGRhdGFbaV0gJiYgZGF0YVtpXS5hdHRycyAmJiBkYXRhW2ldLmF0dHJzLmtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBqID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGogPCBsZW47IGorKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoZGF0YVtqXSAmJiBkYXRhW2pdLmF0dHJzICYmIGRhdGFbal0uYXR0cnMua2V5ID09IG51bGwpIGRhdGFbal0uYXR0cnMua2V5ID0gXCJfX21pdGhyaWxfX1wiICsgZ3VpZCsrXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0aWYgKHNob3VsZE1haW50YWluSWRlbnRpdGllcykge1xyXG5cdFx0XHRcdHZhciBrZXlzRGlmZmVyID0gZmFsc2VcclxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggIT0gY2FjaGVkLmxlbmd0aCkga2V5c0RpZmZlciA9IHRydWVcclxuXHRcdFx0XHRlbHNlIGZvciAodmFyIGkgPSAwLCBjYWNoZWRDZWxsLCBkYXRhQ2VsbDsgY2FjaGVkQ2VsbCA9IGNhY2hlZFtpXSwgZGF0YUNlbGwgPSBkYXRhW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChjYWNoZWRDZWxsLmF0dHJzICYmIGRhdGFDZWxsLmF0dHJzICYmIGNhY2hlZENlbGwuYXR0cnMua2V5ICE9IGRhdGFDZWxsLmF0dHJzLmtleSkge1xyXG5cdFx0XHRcdFx0XHRrZXlzRGlmZmVyID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoa2V5c0RpZmZlcikge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRhdGFbaV0gJiYgZGF0YVtpXS5hdHRycykge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChkYXRhW2ldLmF0dHJzLmtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIga2V5ID0gZGF0YVtpXS5hdHRycy5rZXk7XHJcblx0XHRcdFx0XHRcdFx0XHRpZiAoIWV4aXN0aW5nW2tleV0pIGV4aXN0aW5nW2tleV0gPSB7YWN0aW9uOiBJTlNFUlRJT04sIGluZGV4OiBpfTtcclxuXHRcdFx0XHRcdFx0XHRcdGVsc2UgZXhpc3Rpbmdba2V5XSA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0YWN0aW9uOiBNT1ZFLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRpbmRleDogaSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZnJvbTogZXhpc3Rpbmdba2V5XS5pbmRleCxcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZWxlbWVudDogY2FjaGVkLm5vZGVzW2V4aXN0aW5nW2tleV0uaW5kZXhdIHx8ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR2YXIgYWN0aW9ucyA9IFtdXHJcblx0XHRcdFx0XHRmb3IgKHZhciBwcm9wIGluIGV4aXN0aW5nKSBhY3Rpb25zLnB1c2goZXhpc3RpbmdbcHJvcF0pXHJcblx0XHRcdFx0XHR2YXIgY2hhbmdlcyA9IGFjdGlvbnMuc29ydChzb3J0Q2hhbmdlcyk7XHJcblx0XHRcdFx0XHR2YXIgbmV3Q2FjaGVkID0gbmV3IEFycmF5KGNhY2hlZC5sZW5ndGgpXHJcblx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXMgPSBjYWNoZWQubm9kZXMuc2xpY2UoKVxyXG5cclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjaGFuZ2U7IGNoYW5nZSA9IGNoYW5nZXNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gREVMRVRJT04pIHtcclxuXHRcdFx0XHRcdFx0XHRjbGVhcihjYWNoZWRbY2hhbmdlLmluZGV4XS5ub2RlcywgY2FjaGVkW2NoYW5nZS5pbmRleF0pO1xyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5zcGxpY2UoY2hhbmdlLmluZGV4LCAxKVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBJTlNFUlRJT04pIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgZHVtbXkgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHRcdFx0XHRcdFx0XHRkdW1teS5rZXkgPSBkYXRhW2NoYW5nZS5pbmRleF0uYXR0cnMua2V5O1xyXG5cdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGR1bW15LCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSB8fCBudWxsKTtcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQuc3BsaWNlKGNoYW5nZS5pbmRleCwgMCwge2F0dHJzOiB7a2V5OiBkYXRhW2NoYW5nZS5pbmRleF0uYXR0cnMua2V5fSwgbm9kZXM6IFtkdW1teV19KVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5ub2Rlc1tjaGFuZ2UuaW5kZXhdID0gZHVtbXlcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IE1PVkUpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gIT09IGNoYW5nZS5lbGVtZW50ICYmIGNoYW5nZS5lbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShjaGFuZ2UuZWxlbWVudCwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gfHwgbnVsbClcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkW2NoYW5nZS5pbmRleF0gPSBjYWNoZWRbY2hhbmdlLmZyb21dXHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzW2NoYW5nZS5pbmRleF0gPSBjaGFuZ2UuZWxlbWVudFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRjYWNoZWQgPSBuZXdDYWNoZWQ7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vZW5kIGtleSBhbGdvcml0aG1cclxuXHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBjYWNoZUNvdW50ID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdC8vZGlmZiBlYWNoIGl0ZW0gaW4gdGhlIGFycmF5XHJcblx0XHRcdFx0dmFyIGl0ZW0gPSBidWlsZChwYXJlbnRFbGVtZW50LCBwYXJlbnRUYWcsIGNhY2hlZCwgaW5kZXgsIGRhdGFbaV0sIGNhY2hlZFtjYWNoZUNvdW50XSwgc2hvdWxkUmVhdHRhY2gsIGluZGV4ICsgc3ViQXJyYXlDb3VudCB8fCBzdWJBcnJheUNvdW50LCBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKTtcclxuXHRcdFx0XHRpZiAoaXRlbSA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcclxuXHRcdFx0XHRpZiAoIWl0ZW0ubm9kZXMuaW50YWN0KSBpbnRhY3QgPSBmYWxzZTtcclxuXHRcdFx0XHRpZiAoaXRlbS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRcdFx0Ly9maXggb2Zmc2V0IG9mIG5leHQgZWxlbWVudCBpZiBpdGVtIHdhcyBhIHRydXN0ZWQgc3RyaW5nIHcvIG1vcmUgdGhhbiBvbmUgaHRtbCBlbGVtZW50XHJcblx0XHRcdFx0XHQvL3RoZSBmaXJzdCBjbGF1c2UgaW4gdGhlIHJlZ2V4cCBtYXRjaGVzIGVsZW1lbnRzXHJcblx0XHRcdFx0XHQvL3RoZSBzZWNvbmQgY2xhdXNlIChhZnRlciB0aGUgcGlwZSkgbWF0Y2hlcyB0ZXh0IG5vZGVzXHJcblx0XHRcdFx0XHRzdWJBcnJheUNvdW50ICs9IChpdGVtLm1hdGNoKC88W15cXC9dfFxcPlxccypbXjxdL2cpIHx8IFswXSkubGVuZ3RoXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Ugc3ViQXJyYXlDb3VudCArPSB0eXBlLmNhbGwoaXRlbSkgPT09IEFSUkFZID8gaXRlbS5sZW5ndGggOiAxO1xyXG5cdFx0XHRcdGNhY2hlZFtjYWNoZUNvdW50KytdID0gaXRlbVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghaW50YWN0KSB7XHJcblx0XHRcdFx0Ly9kaWZmIHRoZSBhcnJheSBpdHNlbGZcclxuXHRcdFx0XHRcclxuXHRcdFx0XHQvL3VwZGF0ZSB0aGUgbGlzdCBvZiBET00gbm9kZXMgYnkgY29sbGVjdGluZyB0aGUgbm9kZXMgZnJvbSBlYWNoIGl0ZW1cclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKGNhY2hlZFtpXSAhPSBudWxsKSBub2Rlcy5wdXNoLmFwcGx5KG5vZGVzLCBjYWNoZWRbaV0ubm9kZXMpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vcmVtb3ZlIGl0ZW1zIGZyb20gdGhlIGVuZCBvZiB0aGUgYXJyYXkgaWYgdGhlIG5ldyBhcnJheSBpcyBzaG9ydGVyIHRoYW4gdGhlIG9sZCBvbmVcclxuXHRcdFx0XHQvL2lmIGVycm9ycyBldmVyIGhhcHBlbiBoZXJlLCB0aGUgaXNzdWUgaXMgbW9zdCBsaWtlbHkgYSBidWcgaW4gdGhlIGNvbnN0cnVjdGlvbiBvZiB0aGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgc29tZXdoZXJlIGVhcmxpZXIgaW4gdGhlIHByb2dyYW1cclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbm9kZTsgbm9kZSA9IGNhY2hlZC5ub2Rlc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAobm9kZS5wYXJlbnROb2RlICE9IG51bGwgJiYgbm9kZXMuaW5kZXhPZihub2RlKSA8IDApIGNsZWFyKFtub2RlXSwgW2NhY2hlZFtpXV0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChkYXRhLmxlbmd0aCA8IGNhY2hlZC5sZW5ndGgpIGNhY2hlZC5sZW5ndGggPSBkYXRhLmxlbmd0aDtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChkYXRhICE9IG51bGwgJiYgZGF0YVR5cGUgPT09IE9CSkVDVCkge1xyXG5cdFx0XHR2YXIgdmlld3MgPSBbXSwgY29udHJvbGxlcnMgPSBbXVxyXG5cdFx0XHR3aGlsZSAoZGF0YS52aWV3KSB7XHJcblx0XHRcdFx0dmFyIHZpZXcgPSBkYXRhLnZpZXcuJG9yaWdpbmFsIHx8IGRhdGEudmlld1xyXG5cdFx0XHRcdHZhciBjb250cm9sbGVySW5kZXggPSBtLnJlZHJhdy5zdHJhdGVneSgpID09IFwiZGlmZlwiICYmIGNhY2hlZC52aWV3cyA/IGNhY2hlZC52aWV3cy5pbmRleE9mKHZpZXcpIDogLTFcclxuXHRcdFx0XHR2YXIgY29udHJvbGxlciA9IGNvbnRyb2xsZXJJbmRleCA+IC0xID8gY2FjaGVkLmNvbnRyb2xsZXJzW2NvbnRyb2xsZXJJbmRleF0gOiBuZXcgKGRhdGEuY29udHJvbGxlciB8fCBub29wKVxyXG5cdFx0XHRcdHZhciBrZXkgPSBkYXRhICYmIGRhdGEuYXR0cnMgJiYgZGF0YS5hdHRycy5rZXlcclxuXHRcdFx0XHRkYXRhID0gcGVuZGluZ1JlcXVlc3RzID09IDAgfHwgKGNhY2hlZCAmJiBjYWNoZWQuY29udHJvbGxlcnMgJiYgY2FjaGVkLmNvbnRyb2xsZXJzLmluZGV4T2YoY29udHJvbGxlcikgPiAtMSkgPyBkYXRhLnZpZXcoY29udHJvbGxlcikgOiB7dGFnOiBcInBsYWNlaG9sZGVyXCJ9XHJcblx0XHRcdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGNhY2hlZDtcclxuXHRcdFx0XHRpZiAoa2V5KSB7XHJcblx0XHRcdFx0XHRpZiAoIWRhdGEuYXR0cnMpIGRhdGEuYXR0cnMgPSB7fVxyXG5cdFx0XHRcdFx0ZGF0YS5hdHRycy5rZXkgPSBrZXlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQpIHVubG9hZGVycy5wdXNoKHtjb250cm9sbGVyOiBjb250cm9sbGVyLCBoYW5kbGVyOiBjb250cm9sbGVyLm9udW5sb2FkfSlcclxuXHRcdFx0XHR2aWV3cy5wdXNoKHZpZXcpXHJcblx0XHRcdFx0Y29udHJvbGxlcnMucHVzaChjb250cm9sbGVyKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghZGF0YS50YWcgJiYgY29udHJvbGxlcnMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJDb21wb25lbnQgdGVtcGxhdGUgbXVzdCByZXR1cm4gYSB2aXJ0dWFsIGVsZW1lbnQsIG5vdCBhbiBhcnJheSwgc3RyaW5nLCBldGMuXCIpXHJcblx0XHRcdGlmICghZGF0YS5hdHRycykgZGF0YS5hdHRycyA9IHt9O1xyXG5cdFx0XHRpZiAoIWNhY2hlZC5hdHRycykgY2FjaGVkLmF0dHJzID0ge307XHJcblxyXG5cdFx0XHR2YXIgZGF0YUF0dHJLZXlzID0gT2JqZWN0LmtleXMoZGF0YS5hdHRycylcclxuXHRcdFx0dmFyIGhhc0tleXMgPSBkYXRhQXR0cktleXMubGVuZ3RoID4gKFwia2V5XCIgaW4gZGF0YS5hdHRycyA/IDEgOiAwKVxyXG5cdFx0XHQvL2lmIGFuIGVsZW1lbnQgaXMgZGlmZmVyZW50IGVub3VnaCBmcm9tIHRoZSBvbmUgaW4gY2FjaGUsIHJlY3JlYXRlIGl0XHJcblx0XHRcdGlmIChkYXRhLnRhZyAhPSBjYWNoZWQudGFnIHx8IGRhdGFBdHRyS2V5cy5zb3J0KCkuam9pbigpICE9IE9iamVjdC5rZXlzKGNhY2hlZC5hdHRycykuc29ydCgpLmpvaW4oKSB8fCBkYXRhLmF0dHJzLmlkICE9IGNhY2hlZC5hdHRycy5pZCB8fCBkYXRhLmF0dHJzLmtleSAhPSBjYWNoZWQuYXR0cnMua2V5IHx8IChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwiYWxsXCIgJiYgKCFjYWNoZWQuY29uZmlnQ29udGV4dCB8fCBjYWNoZWQuY29uZmlnQ29udGV4dC5yZXRhaW4gIT09IHRydWUpKSB8fCAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImRpZmZcIiAmJiBjYWNoZWQuY29uZmlnQ29udGV4dCAmJiBjYWNoZWQuY29uZmlnQ29udGV4dC5yZXRhaW4gPT09IGZhbHNlKSkge1xyXG5cdFx0XHRcdGlmIChjYWNoZWQubm9kZXMubGVuZ3RoKSBjbGVhcihjYWNoZWQubm9kZXMpO1xyXG5cdFx0XHRcdGlmIChjYWNoZWQuY29uZmlnQ29udGV4dCAmJiB0eXBlb2YgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPT09IEZVTkNUSU9OKSBjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCgpXHJcblx0XHRcdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNvbnRyb2xsZXI7IGNvbnRyb2xsZXIgPSBjYWNoZWQuY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGNvbnRyb2xsZXIub251bmxvYWQgPT09IEZVTkNUSU9OKSBjb250cm9sbGVyLm9udW5sb2FkKHtwcmV2ZW50RGVmYXVsdDogbm9vcH0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0eXBlLmNhbGwoZGF0YS50YWcpICE9IFNUUklORykgcmV0dXJuO1xyXG5cclxuXHRcdFx0dmFyIG5vZGUsIGlzTmV3ID0gY2FjaGVkLm5vZGVzLmxlbmd0aCA9PT0gMDtcclxuXHRcdFx0aWYgKGRhdGEuYXR0cnMueG1sbnMpIG5hbWVzcGFjZSA9IGRhdGEuYXR0cnMueG1sbnM7XHJcblx0XHRcdGVsc2UgaWYgKGRhdGEudGFnID09PSBcInN2Z1wiKSBuYW1lc3BhY2UgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI7XHJcblx0XHRcdGVsc2UgaWYgKGRhdGEudGFnID09PSBcIm1hdGhcIikgbmFtZXNwYWNlID0gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MXCI7XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoaXNOZXcpIHtcclxuXHRcdFx0XHRpZiAoZGF0YS5hdHRycy5pcykgbm9kZSA9IG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkID8gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGF0YS50YWcsIGRhdGEuYXR0cnMuaXMpIDogJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKTtcclxuXHRcdFx0XHRlbHNlIG5vZGUgPSBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCA/ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnKSA6ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBkYXRhLnRhZyk7XHJcblx0XHRcdFx0Y2FjaGVkID0ge1xyXG5cdFx0XHRcdFx0dGFnOiBkYXRhLnRhZyxcclxuXHRcdFx0XHRcdC8vc2V0IGF0dHJpYnV0ZXMgZmlyc3QsIHRoZW4gY3JlYXRlIGNoaWxkcmVuXHJcblx0XHRcdFx0XHRhdHRyczogaGFzS2V5cyA/IHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMsIHt9LCBuYW1lc3BhY2UpIDogZGF0YS5hdHRycyxcclxuXHRcdFx0XHRcdGNoaWxkcmVuOiBkYXRhLmNoaWxkcmVuICE9IG51bGwgJiYgZGF0YS5jaGlsZHJlbi5sZW5ndGggPiAwID9cclxuXHRcdFx0XHRcdFx0YnVpbGQobm9kZSwgZGF0YS50YWcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBkYXRhLmNoaWxkcmVuLCBjYWNoZWQuY2hpbGRyZW4sIHRydWUsIDAsIGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpIDpcclxuXHRcdFx0XHRcdFx0ZGF0YS5jaGlsZHJlbixcclxuXHRcdFx0XHRcdG5vZGVzOiBbbm9kZV1cclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGlmIChjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdFx0XHRjYWNoZWQuY29udHJvbGxlcnMgPSBjb250cm9sbGVyc1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNvbnRyb2xsZXI7IGNvbnRyb2xsZXIgPSBjb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb250cm9sbGVyLm9udW5sb2FkICYmIGNvbnRyb2xsZXIub251bmxvYWQuJG9sZCkgY29udHJvbGxlci5vbnVubG9hZCA9IGNvbnRyb2xsZXIub251bmxvYWQuJG9sZFxyXG5cdFx0XHRcdFx0XHRpZiAocGVuZGluZ1JlcXVlc3RzICYmIGNvbnRyb2xsZXIub251bmxvYWQpIHtcclxuXHRcdFx0XHRcdFx0XHR2YXIgb251bmxvYWQgPSBjb250cm9sbGVyLm9udW5sb2FkXHJcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZCA9IG5vb3BcclxuXHRcdFx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkLiRvbGQgPSBvbnVubG9hZFxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmIChjYWNoZWQuY2hpbGRyZW4gJiYgIWNhY2hlZC5jaGlsZHJlbi5ub2RlcykgY2FjaGVkLmNoaWxkcmVuLm5vZGVzID0gW107XHJcblx0XHRcdFx0Ly9lZGdlIGNhc2U6IHNldHRpbmcgdmFsdWUgb24gPHNlbGVjdD4gZG9lc24ndCB3b3JrIGJlZm9yZSBjaGlsZHJlbiBleGlzdCwgc28gc2V0IGl0IGFnYWluIGFmdGVyIGNoaWxkcmVuIGhhdmUgYmVlbiBjcmVhdGVkXHJcblx0XHRcdFx0aWYgKGRhdGEudGFnID09PSBcInNlbGVjdFwiICYmIFwidmFsdWVcIiBpbiBkYXRhLmF0dHJzKSBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCB7dmFsdWU6IGRhdGEuYXR0cnMudmFsdWV9LCB7fSwgbmFtZXNwYWNlKTtcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2RlLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0bm9kZSA9IGNhY2hlZC5ub2Rlc1swXTtcclxuXHRcdFx0XHRpZiAoaGFzS2V5cykgc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywgZGF0YS5hdHRycywgY2FjaGVkLmF0dHJzLCBuYW1lc3BhY2UpO1xyXG5cdFx0XHRcdGNhY2hlZC5jaGlsZHJlbiA9IGJ1aWxkKG5vZGUsIGRhdGEudGFnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZGF0YS5jaGlsZHJlbiwgY2FjaGVkLmNoaWxkcmVuLCBmYWxzZSwgMCwgZGF0YS5hdHRycy5jb250ZW50ZWRpdGFibGUgPyBub2RlIDogZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncyk7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWU7XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXJzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0Y2FjaGVkLnZpZXdzID0gdmlld3NcclxuXHRcdFx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChzaG91bGRSZWF0dGFjaCA9PT0gdHJ1ZSAmJiBub2RlICE9IG51bGwpIHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0fVxyXG5cdFx0XHQvL3NjaGVkdWxlIGNvbmZpZ3MgdG8gYmUgY2FsbGVkLiBUaGV5IGFyZSBjYWxsZWQgYWZ0ZXIgYGJ1aWxkYCBmaW5pc2hlcyBydW5uaW5nXHJcblx0XHRcdGlmICh0eXBlb2YgZGF0YS5hdHRyc1tcImNvbmZpZ1wiXSA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHR2YXIgY29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0ID0gY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwge307XHJcblxyXG5cdFx0XHRcdC8vIGJpbmRcclxuXHRcdFx0XHR2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihkYXRhLCBhcmdzKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHRcdHJldHVybiBkYXRhLmF0dHJzW1wiY29uZmlnXCJdLmFwcGx5KGRhdGEsIGFyZ3MpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRjb25maWdzLnB1c2goY2FsbGJhY2soZGF0YSwgW25vZGUsICFpc05ldywgY29udGV4dCwgY2FjaGVkXSkpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHR5cGVvZiBkYXRhICE9IEZVTkNUSU9OKSB7XHJcblx0XHRcdC8vaGFuZGxlIHRleHQgbm9kZXNcclxuXHRcdFx0dmFyIG5vZGVzO1xyXG5cdFx0XHRpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCA9PT0gMCkge1xyXG5cdFx0XHRcdGlmIChkYXRhLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0XHRub2RlcyA9IGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXTtcclxuXHRcdFx0XHRcdGlmICghcGFyZW50RWxlbWVudC5ub2RlTmFtZS5tYXRjaCh2b2lkRWxlbWVudHMpKSBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2Rlc1swXSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYWNoZWQgPSBcInN0cmluZyBudW1iZXIgYm9vbGVhblwiLmluZGV4T2YodHlwZW9mIGRhdGEpID4gLTEgPyBuZXcgZGF0YS5jb25zdHJ1Y3RvcihkYXRhKSA6IGRhdGE7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChjYWNoZWQudmFsdWVPZigpICE9PSBkYXRhLnZhbHVlT2YoKSB8fCBzaG91bGRSZWF0dGFjaCA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRcdG5vZGVzID0gY2FjaGVkLm5vZGVzO1xyXG5cdFx0XHRcdGlmICghZWRpdGFibGUgfHwgZWRpdGFibGUgIT09ICRkb2N1bWVudC5hY3RpdmVFbGVtZW50KSB7XHJcblx0XHRcdFx0XHRpZiAoZGF0YS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRcdFx0XHRjbGVhcihub2RlcywgY2FjaGVkKTtcclxuXHRcdFx0XHRcdFx0bm9kZXMgPSBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdC8vY29ybmVyIGNhc2U6IHJlcGxhY2luZyB0aGUgbm9kZVZhbHVlIG9mIGEgdGV4dCBub2RlIHRoYXQgaXMgYSBjaGlsZCBvZiBhIHRleHRhcmVhL2NvbnRlbnRlZGl0YWJsZSBkb2Vzbid0IHdvcmtcclxuXHRcdFx0XHRcdFx0Ly93ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdmFsdWUgcHJvcGVydHkgb2YgdGhlIHBhcmVudCB0ZXh0YXJlYSBvciB0aGUgaW5uZXJIVE1MIG9mIHRoZSBjb250ZW50ZWRpdGFibGUgZWxlbWVudCBpbnN0ZWFkXHJcblx0XHRcdFx0XHRcdGlmIChwYXJlbnRUYWcgPT09IFwidGV4dGFyZWFcIikgcGFyZW50RWxlbWVudC52YWx1ZSA9IGRhdGE7XHJcblx0XHRcdFx0XHRcdGVsc2UgaWYgKGVkaXRhYmxlKSBlZGl0YWJsZS5pbm5lckhUTUwgPSBkYXRhO1xyXG5cdFx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAobm9kZXNbMF0ubm9kZVR5cGUgPT09IDEgfHwgbm9kZXMubGVuZ3RoID4gMSkgeyAvL3dhcyBhIHRydXN0ZWQgc3RyaW5nXHJcblx0XHRcdFx0XHRcdFx0XHRjbGVhcihjYWNoZWQubm9kZXMsIGNhY2hlZCk7XHJcblx0XHRcdFx0XHRcdFx0XHRub2RlcyA9IFskZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSldXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGVzWzBdLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpO1xyXG5cdFx0XHRcdFx0XHRcdG5vZGVzWzBdLm5vZGVWYWx1ZSA9IGRhdGFcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcihkYXRhKTtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgY2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWVcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHNvcnRDaGFuZ2VzKGEsIGIpIHtyZXR1cm4gYS5hY3Rpb24gLSBiLmFjdGlvbiB8fCBhLmluZGV4IC0gYi5pbmRleH1cclxuXHRmdW5jdGlvbiBzZXRBdHRyaWJ1dGVzKG5vZGUsIHRhZywgZGF0YUF0dHJzLCBjYWNoZWRBdHRycywgbmFtZXNwYWNlKSB7XHJcblx0XHRmb3IgKHZhciBhdHRyTmFtZSBpbiBkYXRhQXR0cnMpIHtcclxuXHRcdFx0dmFyIGRhdGFBdHRyID0gZGF0YUF0dHJzW2F0dHJOYW1lXTtcclxuXHRcdFx0dmFyIGNhY2hlZEF0dHIgPSBjYWNoZWRBdHRyc1thdHRyTmFtZV07XHJcblx0XHRcdGlmICghKGF0dHJOYW1lIGluIGNhY2hlZEF0dHJzKSB8fCAoY2FjaGVkQXR0ciAhPT0gZGF0YUF0dHIpKSB7XHJcblx0XHRcdFx0Y2FjaGVkQXR0cnNbYXR0ck5hbWVdID0gZGF0YUF0dHI7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdC8vYGNvbmZpZ2AgaXNuJ3QgYSByZWFsIGF0dHJpYnV0ZXMsIHNvIGlnbm9yZSBpdFxyXG5cdFx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBcImNvbmZpZ1wiIHx8IGF0dHJOYW1lID09IFwia2V5XCIpIGNvbnRpbnVlO1xyXG5cdFx0XHRcdFx0Ly9ob29rIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBhdXRvLXJlZHJhd2luZyBzeXN0ZW1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKHR5cGVvZiBkYXRhQXR0ciA9PT0gRlVOQ1RJT04gJiYgYXR0ck5hbWUuaW5kZXhPZihcIm9uXCIpID09PSAwKSB7XHJcblx0XHRcdFx0XHRcdG5vZGVbYXR0ck5hbWVdID0gYXV0b3JlZHJhdyhkYXRhQXR0ciwgbm9kZSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIGBzdHlsZTogey4uLn1gXHJcblx0XHRcdFx0XHRlbHNlIGlmIChhdHRyTmFtZSA9PT0gXCJzdHlsZVwiICYmIGRhdGFBdHRyICE9IG51bGwgJiYgdHlwZS5jYWxsKGRhdGFBdHRyKSA9PT0gT0JKRUNUKSB7XHJcblx0XHRcdFx0XHRcdGZvciAodmFyIHJ1bGUgaW4gZGF0YUF0dHIpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoY2FjaGVkQXR0ciA9PSBudWxsIHx8IGNhY2hlZEF0dHJbcnVsZV0gIT09IGRhdGFBdHRyW3J1bGVdKSBub2RlLnN0eWxlW3J1bGVdID0gZGF0YUF0dHJbcnVsZV1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBydWxlIGluIGNhY2hlZEF0dHIpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoIShydWxlIGluIGRhdGFBdHRyKSkgbm9kZS5zdHlsZVtydWxlXSA9IFwiXCJcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9oYW5kbGUgU1ZHXHJcblx0XHRcdFx0XHRlbHNlIGlmIChuYW1lc3BhY2UgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IFwiaHJlZlwiKSBub2RlLnNldEF0dHJpYnV0ZU5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLCBcImhyZWZcIiwgZGF0YUF0dHIpO1xyXG5cdFx0XHRcdFx0XHRlbHNlIGlmIChhdHRyTmFtZSA9PT0gXCJjbGFzc05hbWVcIikgbm9kZS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBkYXRhQXR0cik7XHJcblx0XHRcdFx0XHRcdGVsc2Ugbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRhdGFBdHRyKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9oYW5kbGUgY2FzZXMgdGhhdCBhcmUgcHJvcGVydGllcyAoYnV0IGlnbm9yZSBjYXNlcyB3aGVyZSB3ZSBzaG91bGQgdXNlIHNldEF0dHJpYnV0ZSBpbnN0ZWFkKVxyXG5cdFx0XHRcdFx0Ly8tIGxpc3QgYW5kIGZvcm0gYXJlIHR5cGljYWxseSB1c2VkIGFzIHN0cmluZ3MsIGJ1dCBhcmUgRE9NIGVsZW1lbnQgcmVmZXJlbmNlcyBpbiBqc1xyXG5cdFx0XHRcdFx0Ly8tIHdoZW4gdXNpbmcgQ1NTIHNlbGVjdG9ycyAoZS5nLiBgbShcIltzdHlsZT0nJ11cIilgKSwgc3R5bGUgaXMgdXNlZCBhcyBhIHN0cmluZywgYnV0IGl0J3MgYW4gb2JqZWN0IGluIGpzXHJcblx0XHRcdFx0XHRlbHNlIGlmIChhdHRyTmFtZSBpbiBub2RlICYmICEoYXR0ck5hbWUgPT09IFwibGlzdFwiIHx8IGF0dHJOYW1lID09PSBcInN0eWxlXCIgfHwgYXR0ck5hbWUgPT09IFwiZm9ybVwiIHx8IGF0dHJOYW1lID09PSBcInR5cGVcIiB8fCBhdHRyTmFtZSA9PT0gXCJ3aWR0aFwiIHx8IGF0dHJOYW1lID09PSBcImhlaWdodFwiKSkge1xyXG5cdFx0XHRcdFx0XHQvLyMzNDggZG9uJ3Qgc2V0IHRoZSB2YWx1ZSBpZiBub3QgbmVlZGVkIG90aGVyd2lzZSBjdXJzb3IgcGxhY2VtZW50IGJyZWFrcyBpbiBDaHJvbWVcclxuXHRcdFx0XHRcdFx0aWYgKHRhZyAhPT0gXCJpbnB1dFwiIHx8IG5vZGVbYXR0ck5hbWVdICE9PSBkYXRhQXR0cikgbm9kZVthdHRyTmFtZV0gPSBkYXRhQXR0clxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHQvL3N3YWxsb3cgSUUncyBpbnZhbGlkIGFyZ3VtZW50IGVycm9ycyB0byBtaW1pYyBIVE1MJ3MgZmFsbGJhY2stdG8tZG9pbmctbm90aGluZy1vbi1pbnZhbGlkLWF0dHJpYnV0ZXMgYmVoYXZpb3JcclxuXHRcdFx0XHRcdGlmIChlLm1lc3NhZ2UuaW5kZXhPZihcIkludmFsaWQgYXJndW1lbnRcIikgPCAwKSB0aHJvdyBlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vIzM0OCBkYXRhQXR0ciBtYXkgbm90IGJlIGEgc3RyaW5nLCBzbyB1c2UgbG9vc2UgY29tcGFyaXNvbiAoZG91YmxlIGVxdWFsKSBpbnN0ZWFkIG9mIHN0cmljdCAodHJpcGxlIGVxdWFsKVxyXG5cdFx0XHRlbHNlIGlmIChhdHRyTmFtZSA9PT0gXCJ2YWx1ZVwiICYmIHRhZyA9PT0gXCJpbnB1dFwiICYmIG5vZGUudmFsdWUgIT0gZGF0YUF0dHIpIHtcclxuXHRcdFx0XHRub2RlLnZhbHVlID0gZGF0YUF0dHJcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGNhY2hlZEF0dHJzXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGNsZWFyKG5vZGVzLCBjYWNoZWQpIHtcclxuXHRcdGZvciAodmFyIGkgPSBub2Rlcy5sZW5ndGggLSAxOyBpID4gLTE7IGktLSkge1xyXG5cdFx0XHRpZiAobm9kZXNbaV0gJiYgbm9kZXNbaV0ucGFyZW50Tm9kZSkge1xyXG5cdFx0XHRcdHRyeSB7bm9kZXNbaV0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2Rlc1tpXSl9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHt9IC8vaWdub3JlIGlmIHRoaXMgZmFpbHMgZHVlIHRvIG9yZGVyIG9mIGV2ZW50cyAoc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjE5MjYwODMvZmFpbGVkLXRvLWV4ZWN1dGUtcmVtb3ZlY2hpbGQtb24tbm9kZSlcclxuXHRcdFx0XHRjYWNoZWQgPSBbXS5jb25jYXQoY2FjaGVkKTtcclxuXHRcdFx0XHRpZiAoY2FjaGVkW2ldKSB1bmxvYWQoY2FjaGVkW2ldKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAobm9kZXMubGVuZ3RoICE9IDApIG5vZGVzLmxlbmd0aCA9IDBcclxuXHR9XHJcblx0ZnVuY3Rpb24gdW5sb2FkKGNhY2hlZCkge1xyXG5cdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmIHR5cGVvZiBjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0Y2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQoKTtcclxuXHRcdFx0Y2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPSBudWxsXHJcblx0XHR9XHJcblx0XHRpZiAoY2FjaGVkLmNvbnRyb2xsZXJzKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY2FjaGVkLmNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIGNvbnRyb2xsZXIub251bmxvYWQgPT09IEZVTkNUSU9OKSBjb250cm9sbGVyLm9udW5sb2FkKHtwcmV2ZW50RGVmYXVsdDogbm9vcH0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRpZiAoY2FjaGVkLmNoaWxkcmVuKSB7XHJcblx0XHRcdGlmICh0eXBlLmNhbGwoY2FjaGVkLmNoaWxkcmVuKSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY2hpbGQ7IGNoaWxkID0gY2FjaGVkLmNoaWxkcmVuW2ldOyBpKyspIHVubG9hZChjaGlsZClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChjYWNoZWQuY2hpbGRyZW4udGFnKSB1bmxvYWQoY2FjaGVkLmNoaWxkcmVuKVxyXG5cdFx0fVxyXG5cdH1cclxuXHRmdW5jdGlvbiBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKSB7XHJcblx0XHR2YXIgbmV4dFNpYmxpbmcgPSBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdO1xyXG5cdFx0aWYgKG5leHRTaWJsaW5nKSB7XHJcblx0XHRcdHZhciBpc0VsZW1lbnQgPSBuZXh0U2libGluZy5ub2RlVHlwZSAhPSAxO1xyXG5cdFx0XHR2YXIgcGxhY2Vob2xkZXIgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XHJcblx0XHRcdGlmIChpc0VsZW1lbnQpIHtcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgbmV4dFNpYmxpbmcgfHwgbnVsbCk7XHJcblx0XHRcdFx0cGxhY2Vob2xkZXIuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlYmVnaW5cIiwgZGF0YSk7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChwbGFjZWhvbGRlcilcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIG5leHRTaWJsaW5nLmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWJlZ2luXCIsIGRhdGEpXHJcblx0XHR9XHJcblx0XHRlbHNlIHBhcmVudEVsZW1lbnQuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlZW5kXCIsIGRhdGEpO1xyXG5cdFx0dmFyIG5vZGVzID0gW107XHJcblx0XHR3aGlsZSAocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSAhPT0gbmV4dFNpYmxpbmcpIHtcclxuXHRcdFx0bm9kZXMucHVzaChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdKTtcclxuXHRcdFx0aW5kZXgrK1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG5vZGVzXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGF1dG9yZWRyYXcoY2FsbGJhY2ssIG9iamVjdCkge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKTtcclxuXHRcdFx0bS5zdGFydENvbXB1dGF0aW9uKCk7XHJcblx0XHRcdHRyeSB7cmV0dXJuIGNhbGxiYWNrLmNhbGwob2JqZWN0LCBlKX1cclxuXHRcdFx0ZmluYWxseSB7XHJcblx0XHRcdFx0ZW5kRmlyc3RDb21wdXRhdGlvbigpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBodG1sO1xyXG5cdHZhciBkb2N1bWVudE5vZGUgPSB7XHJcblx0XHRhcHBlbmRDaGlsZDogZnVuY3Rpb24obm9kZSkge1xyXG5cdFx0XHRpZiAoaHRtbCA9PT0gdW5kZWZpbmVkKSBodG1sID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJodG1sXCIpO1xyXG5cdFx0XHRpZiAoJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJiAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICE9PSBub2RlKSB7XHJcblx0XHRcdFx0JGRvY3VtZW50LnJlcGxhY2VDaGlsZChub2RlLCAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgJGRvY3VtZW50LmFwcGVuZENoaWxkKG5vZGUpO1xyXG5cdFx0XHR0aGlzLmNoaWxkTm9kZXMgPSAkZG9jdW1lbnQuY2hpbGROb2Rlc1xyXG5cdFx0fSxcclxuXHRcdGluc2VydEJlZm9yZTogZnVuY3Rpb24obm9kZSkge1xyXG5cdFx0XHR0aGlzLmFwcGVuZENoaWxkKG5vZGUpXHJcblx0XHR9LFxyXG5cdFx0Y2hpbGROb2RlczogW11cclxuXHR9O1xyXG5cdHZhciBub2RlQ2FjaGUgPSBbXSwgY2VsbENhY2hlID0ge307XHJcblx0bS5yZW5kZXIgPSBmdW5jdGlvbihyb290LCBjZWxsLCBmb3JjZVJlY3JlYXRpb24pIHtcclxuXHRcdHZhciBjb25maWdzID0gW107XHJcblx0XHRpZiAoIXJvb3QpIHRocm93IG5ldyBFcnJvcihcIkVuc3VyZSB0aGUgRE9NIGVsZW1lbnQgYmVpbmcgcGFzc2VkIHRvIG0ucm91dGUvbS5tb3VudC9tLnJlbmRlciBpcyBub3QgdW5kZWZpbmVkLlwiKTtcclxuXHRcdHZhciBpZCA9IGdldENlbGxDYWNoZUtleShyb290KTtcclxuXHRcdHZhciBpc0RvY3VtZW50Um9vdCA9IHJvb3QgPT09ICRkb2N1bWVudDtcclxuXHRcdHZhciBub2RlID0gaXNEb2N1bWVudFJvb3QgfHwgcm9vdCA9PT0gJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA/IGRvY3VtZW50Tm9kZSA6IHJvb3Q7XHJcblx0XHRpZiAoaXNEb2N1bWVudFJvb3QgJiYgY2VsbC50YWcgIT0gXCJodG1sXCIpIGNlbGwgPSB7dGFnOiBcImh0bWxcIiwgYXR0cnM6IHt9LCBjaGlsZHJlbjogY2VsbH07XHJcblx0XHRpZiAoY2VsbENhY2hlW2lkXSA9PT0gdW5kZWZpbmVkKSBjbGVhcihub2RlLmNoaWxkTm9kZXMpO1xyXG5cdFx0aWYgKGZvcmNlUmVjcmVhdGlvbiA9PT0gdHJ1ZSkgcmVzZXQocm9vdCk7XHJcblx0XHRjZWxsQ2FjaGVbaWRdID0gYnVpbGQobm9kZSwgbnVsbCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGNlbGwsIGNlbGxDYWNoZVtpZF0sIGZhbHNlLCAwLCBudWxsLCB1bmRlZmluZWQsIGNvbmZpZ3MpO1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvbmZpZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIGNvbmZpZ3NbaV0oKVxyXG5cdH07XHJcblx0ZnVuY3Rpb24gZ2V0Q2VsbENhY2hlS2V5KGVsZW1lbnQpIHtcclxuXHRcdHZhciBpbmRleCA9IG5vZGVDYWNoZS5pbmRleE9mKGVsZW1lbnQpO1xyXG5cdFx0cmV0dXJuIGluZGV4IDwgMCA/IG5vZGVDYWNoZS5wdXNoKGVsZW1lbnQpIC0gMSA6IGluZGV4XHJcblx0fVxyXG5cclxuXHRtLnRydXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdHZhbHVlID0gbmV3IFN0cmluZyh2YWx1ZSk7XHJcblx0XHR2YWx1ZS4kdHJ1c3RlZCA9IHRydWU7XHJcblx0XHRyZXR1cm4gdmFsdWVcclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBnZXR0ZXJzZXR0ZXIoc3RvcmUpIHtcclxuXHRcdHZhciBwcm9wID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoKSBzdG9yZSA9IGFyZ3VtZW50c1swXTtcclxuXHRcdFx0cmV0dXJuIHN0b3JlXHJcblx0XHR9O1xyXG5cclxuXHRcdHByb3AudG9KU09OID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiBzdG9yZVxyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gcHJvcFxyXG5cdH1cclxuXHJcblx0bS5wcm9wID0gZnVuY3Rpb24gKHN0b3JlKSB7XHJcblx0XHQvL25vdGU6IHVzaW5nIG5vbi1zdHJpY3QgZXF1YWxpdHkgY2hlY2sgaGVyZSBiZWNhdXNlIHdlJ3JlIGNoZWNraW5nIGlmIHN0b3JlIGlzIG51bGwgT1IgdW5kZWZpbmVkXHJcblx0XHRpZiAoKChzdG9yZSAhPSBudWxsICYmIHR5cGUuY2FsbChzdG9yZSkgPT09IE9CSkVDVCkgfHwgdHlwZW9mIHN0b3JlID09PSBGVU5DVElPTikgJiYgdHlwZW9mIHN0b3JlLnRoZW4gPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHN0b3JlKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBnZXR0ZXJzZXR0ZXIoc3RvcmUpXHJcblx0fTtcclxuXHJcblx0dmFyIHJvb3RzID0gW10sIGNvbXBvbmVudHMgPSBbXSwgY29udHJvbGxlcnMgPSBbXSwgbGFzdFJlZHJhd0lkID0gbnVsbCwgbGFzdFJlZHJhd0NhbGxUaW1lID0gMCwgY29tcHV0ZVByZVJlZHJhd0hvb2sgPSBudWxsLCBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsLCBwcmV2ZW50ZWQgPSBmYWxzZSwgdG9wQ29tcG9uZW50LCB1bmxvYWRlcnMgPSBbXTtcclxuXHR2YXIgRlJBTUVfQlVER0VUID0gMTY7IC8vNjAgZnJhbWVzIHBlciBzZWNvbmQgPSAxIGNhbGwgcGVyIDE2IG1zXHJcblx0ZnVuY3Rpb24gcGFyYW1ldGVyaXplKGNvbXBvbmVudCwgYXJncykge1xyXG5cdFx0dmFyIGNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIChjb21wb25lbnQuY29udHJvbGxlciB8fCBub29wKS5hcHBseSh0aGlzLCBhcmdzKSB8fCB0aGlzXHJcblx0XHR9XHJcblx0XHR2YXIgdmlldyA9IGZ1bmN0aW9uKGN0cmwpIHtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSBhcmdzID0gYXJncy5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxyXG5cdFx0XHRyZXR1cm4gY29tcG9uZW50LnZpZXcuYXBwbHkoY29tcG9uZW50LCBhcmdzID8gW2N0cmxdLmNvbmNhdChhcmdzKSA6IFtjdHJsXSlcclxuXHRcdH1cclxuXHRcdHZpZXcuJG9yaWdpbmFsID0gY29tcG9uZW50LnZpZXdcclxuXHRcdHZhciBvdXRwdXQgPSB7Y29udHJvbGxlcjogY29udHJvbGxlciwgdmlldzogdmlld31cclxuXHRcdGlmIChhcmdzWzBdICYmIGFyZ3NbMF0ua2V5ICE9IG51bGwpIG91dHB1dC5hdHRycyA9IHtrZXk6IGFyZ3NbMF0ua2V5fVxyXG5cdFx0cmV0dXJuIG91dHB1dFxyXG5cdH1cclxuXHRtLmNvbXBvbmVudCA9IGZ1bmN0aW9uKGNvbXBvbmVudCkge1xyXG5cdFx0cmV0dXJuIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcclxuXHR9XHJcblx0bS5tb3VudCA9IG0ubW9kdWxlID0gZnVuY3Rpb24ocm9vdCwgY29tcG9uZW50KSB7XHJcblx0XHRpZiAoIXJvb3QpIHRocm93IG5ldyBFcnJvcihcIlBsZWFzZSBlbnN1cmUgdGhlIERPTSBlbGVtZW50IGV4aXN0cyBiZWZvcmUgcmVuZGVyaW5nIGEgdGVtcGxhdGUgaW50byBpdC5cIik7XHJcblx0XHR2YXIgaW5kZXggPSByb290cy5pbmRleE9mKHJvb3QpO1xyXG5cdFx0aWYgKGluZGV4IDwgMCkgaW5kZXggPSByb290cy5sZW5ndGg7XHJcblx0XHRcclxuXHRcdHZhciBpc1ByZXZlbnRlZCA9IGZhbHNlO1xyXG5cdFx0dmFyIGV2ZW50ID0ge3ByZXZlbnREZWZhdWx0OiBmdW5jdGlvbigpIHtcclxuXHRcdFx0aXNQcmV2ZW50ZWQgPSB0cnVlO1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGw7XHJcblx0XHR9fTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCB1bmxvYWRlcjsgdW5sb2FkZXIgPSB1bmxvYWRlcnNbaV07IGkrKykge1xyXG5cdFx0XHR1bmxvYWRlci5oYW5kbGVyLmNhbGwodW5sb2FkZXIuY29udHJvbGxlciwgZXZlbnQpXHJcblx0XHRcdHVubG9hZGVyLmNvbnRyb2xsZXIub251bmxvYWQgPSBudWxsXHJcblx0XHR9XHJcblx0XHRpZiAoaXNQcmV2ZW50ZWQpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIHVubG9hZGVyOyB1bmxvYWRlciA9IHVubG9hZGVyc1tpXTsgaSsrKSB1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gdW5sb2FkZXIuaGFuZGxlclxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB1bmxvYWRlcnMgPSBbXVxyXG5cdFx0XHJcblx0XHRpZiAoY29udHJvbGxlcnNbaW5kZXhdICYmIHR5cGVvZiBjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdGNvbnRyb2xsZXJzW2luZGV4XS5vbnVubG9hZChldmVudClcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0aWYgKCFpc1ByZXZlbnRlZCkge1xyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImFsbFwiKTtcclxuXHRcdFx0bS5zdGFydENvbXB1dGF0aW9uKCk7XHJcblx0XHRcdHJvb3RzW2luZGV4XSA9IHJvb3Q7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikgY29tcG9uZW50ID0gc3ViY29tcG9uZW50KGNvbXBvbmVudCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpKVxyXG5cdFx0XHR2YXIgY3VycmVudENvbXBvbmVudCA9IHRvcENvbXBvbmVudCA9IGNvbXBvbmVudCA9IGNvbXBvbmVudCB8fCB7Y29udHJvbGxlcjogZnVuY3Rpb24oKSB7fX07XHJcblx0XHRcdHZhciBjb25zdHJ1Y3RvciA9IGNvbXBvbmVudC5jb250cm9sbGVyIHx8IG5vb3BcclxuXHRcdFx0dmFyIGNvbnRyb2xsZXIgPSBuZXcgY29uc3RydWN0b3I7XHJcblx0XHRcdC8vY29udHJvbGxlcnMgbWF5IGNhbGwgbS5tb3VudCByZWN1cnNpdmVseSAodmlhIG0ucm91dGUgcmVkaXJlY3RzLCBmb3IgZXhhbXBsZSlcclxuXHRcdFx0Ly90aGlzIGNvbmRpdGlvbmFsIGVuc3VyZXMgb25seSB0aGUgbGFzdCByZWN1cnNpdmUgbS5tb3VudCBjYWxsIGlzIGFwcGxpZWRcclxuXHRcdFx0aWYgKGN1cnJlbnRDb21wb25lbnQgPT09IHRvcENvbXBvbmVudCkge1xyXG5cdFx0XHRcdGNvbnRyb2xsZXJzW2luZGV4XSA9IGNvbnRyb2xsZXI7XHJcblx0XHRcdFx0Y29tcG9uZW50c1tpbmRleF0gPSBjb21wb25lbnRcclxuXHRcdFx0fVxyXG5cdFx0XHRlbmRGaXJzdENvbXB1dGF0aW9uKCk7XHJcblx0XHRcdHJldHVybiBjb250cm9sbGVyc1tpbmRleF1cclxuXHRcdH1cclxuXHR9O1xyXG5cdHZhciByZWRyYXdpbmcgPSBmYWxzZVxyXG5cdG0ucmVkcmF3ID0gZnVuY3Rpb24oZm9yY2UpIHtcclxuXHRcdGlmIChyZWRyYXdpbmcpIHJldHVyblxyXG5cdFx0cmVkcmF3aW5nID0gdHJ1ZVxyXG5cdFx0Ly9sYXN0UmVkcmF3SWQgaXMgYSBwb3NpdGl2ZSBudW1iZXIgaWYgYSBzZWNvbmQgcmVkcmF3IGlzIHJlcXVlc3RlZCBiZWZvcmUgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lXHJcblx0XHQvL2xhc3RSZWRyYXdJRCBpcyBudWxsIGlmIGl0J3MgdGhlIGZpcnN0IHJlZHJhdyBhbmQgbm90IGFuIGV2ZW50IGhhbmRsZXJcclxuXHRcdGlmIChsYXN0UmVkcmF3SWQgJiYgZm9yY2UgIT09IHRydWUpIHtcclxuXHRcdFx0Ly93aGVuIHNldFRpbWVvdXQ6IG9ubHkgcmVzY2hlZHVsZSByZWRyYXcgaWYgdGltZSBiZXR3ZWVuIG5vdyBhbmQgcHJldmlvdXMgcmVkcmF3IGlzIGJpZ2dlciB0aGFuIGEgZnJhbWUsIG90aGVyd2lzZSBrZWVwIGN1cnJlbnRseSBzY2hlZHVsZWQgdGltZW91dFxyXG5cdFx0XHQvL3doZW4gckFGOiBhbHdheXMgcmVzY2hlZHVsZSByZWRyYXdcclxuXHRcdFx0aWYgKCRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgbmV3IERhdGUgLSBsYXN0UmVkcmF3Q2FsbFRpbWUgPiBGUkFNRV9CVURHRVQpIHtcclxuXHRcdFx0XHRpZiAobGFzdFJlZHJhd0lkID4gMCkgJGNhbmNlbEFuaW1hdGlvbkZyYW1lKGxhc3RSZWRyYXdJZCk7XHJcblx0XHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShyZWRyYXcsIEZSQU1FX0JVREdFVClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJlZHJhdygpO1xyXG5cdFx0XHRsYXN0UmVkcmF3SWQgPSAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge2xhc3RSZWRyYXdJZCA9IG51bGx9LCBGUkFNRV9CVURHRVQpXHJcblx0XHR9XHJcblx0XHRyZWRyYXdpbmcgPSBmYWxzZVxyXG5cdH07XHJcblx0bS5yZWRyYXcuc3RyYXRlZ3kgPSBtLnByb3AoKTtcclxuXHRmdW5jdGlvbiByZWRyYXcoKSB7XHJcblx0XHRpZiAoY29tcHV0ZVByZVJlZHJhd0hvb2spIHtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2soKVxyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGZvciAodmFyIGkgPSAwLCByb290OyByb290ID0gcm9vdHNbaV07IGkrKykge1xyXG5cdFx0XHRpZiAoY29udHJvbGxlcnNbaV0pIHtcclxuXHRcdFx0XHR2YXIgYXJncyA9IGNvbXBvbmVudHNbaV0uY29udHJvbGxlciAmJiBjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIuJCRhcmdzID8gW2NvbnRyb2xsZXJzW2ldXS5jb25jYXQoY29tcG9uZW50c1tpXS5jb250cm9sbGVyLiQkYXJncykgOiBbY29udHJvbGxlcnNbaV1dXHJcblx0XHRcdFx0bS5yZW5kZXIocm9vdCwgY29tcG9uZW50c1tpXS52aWV3ID8gY29tcG9uZW50c1tpXS52aWV3KGNvbnRyb2xsZXJzW2ldLCBhcmdzKSA6IFwiXCIpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdC8vYWZ0ZXIgcmVuZGVyaW5nIHdpdGhpbiBhIHJvdXRlZCBjb250ZXh0LCB3ZSBuZWVkIHRvIHNjcm9sbCBiYWNrIHRvIHRoZSB0b3AsIGFuZCBmZXRjaCB0aGUgZG9jdW1lbnQgdGl0bGUgZm9yIGhpc3RvcnkucHVzaFN0YXRlXHJcblx0XHRpZiAoY29tcHV0ZVBvc3RSZWRyYXdIb29rKSB7XHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vaygpO1xyXG5cdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsXHJcblx0XHR9XHJcblx0XHRsYXN0UmVkcmF3SWQgPSBudWxsO1xyXG5cdFx0bGFzdFJlZHJhd0NhbGxUaW1lID0gbmV3IERhdGU7XHJcblx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIilcclxuXHR9XHJcblxyXG5cdHZhciBwZW5kaW5nUmVxdWVzdHMgPSAwO1xyXG5cdG0uc3RhcnRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge3BlbmRpbmdSZXF1ZXN0cysrfTtcclxuXHRtLmVuZENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7XHJcblx0XHRwZW5kaW5nUmVxdWVzdHMgPSBNYXRoLm1heChwZW5kaW5nUmVxdWVzdHMgLSAxLCAwKTtcclxuXHRcdGlmIChwZW5kaW5nUmVxdWVzdHMgPT09IDApIG0ucmVkcmF3KClcclxuXHR9O1xyXG5cdHZhciBlbmRGaXJzdENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcIm5vbmVcIikge1xyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHMtLVxyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIilcclxuXHRcdH1cclxuXHRcdGVsc2UgbS5lbmRDb21wdXRhdGlvbigpO1xyXG5cdH1cclxuXHJcblx0bS53aXRoQXR0ciA9IGZ1bmN0aW9uKHByb3AsIHdpdGhBdHRyQ2FsbGJhY2spIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0XHR2YXIgY3VycmVudFRhcmdldCA9IGUuY3VycmVudFRhcmdldCB8fCB0aGlzO1xyXG5cdFx0XHR3aXRoQXR0ckNhbGxiYWNrKHByb3AgaW4gY3VycmVudFRhcmdldCA/IGN1cnJlbnRUYXJnZXRbcHJvcF0gOiBjdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZShwcm9wKSlcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHQvL3JvdXRpbmdcclxuXHR2YXIgbW9kZXMgPSB7cGF0aG5hbWU6IFwiXCIsIGhhc2g6IFwiI1wiLCBzZWFyY2g6IFwiP1wifTtcclxuXHR2YXIgcmVkaXJlY3QgPSBub29wLCByb3V0ZVBhcmFtcywgY3VycmVudFJvdXRlLCBpc0RlZmF1bHRSb3V0ZSA9IGZhbHNlO1xyXG5cdG0ucm91dGUgPSBmdW5jdGlvbigpIHtcclxuXHRcdC8vbS5yb3V0ZSgpXHJcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGN1cnJlbnRSb3V0ZTtcclxuXHRcdC8vbS5yb3V0ZShlbCwgZGVmYXVsdFJvdXRlLCByb3V0ZXMpXHJcblx0XHRlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzICYmIHR5cGUuY2FsbChhcmd1bWVudHNbMV0pID09PSBTVFJJTkcpIHtcclxuXHRcdFx0dmFyIHJvb3QgPSBhcmd1bWVudHNbMF0sIGRlZmF1bHRSb3V0ZSA9IGFyZ3VtZW50c1sxXSwgcm91dGVyID0gYXJndW1lbnRzWzJdO1xyXG5cdFx0XHRyZWRpcmVjdCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xyXG5cdFx0XHRcdHZhciBwYXRoID0gY3VycmVudFJvdXRlID0gbm9ybWFsaXplUm91dGUoc291cmNlKTtcclxuXHRcdFx0XHRpZiAoIXJvdXRlQnlWYWx1ZShyb290LCByb3V0ZXIsIHBhdGgpKSB7XHJcblx0XHRcdFx0XHRpZiAoaXNEZWZhdWx0Um91dGUpIHRocm93IG5ldyBFcnJvcihcIkVuc3VyZSB0aGUgZGVmYXVsdCByb3V0ZSBtYXRjaGVzIG9uZSBvZiB0aGUgcm91dGVzIGRlZmluZWQgaW4gbS5yb3V0ZVwiKVxyXG5cdFx0XHRcdFx0aXNEZWZhdWx0Um91dGUgPSB0cnVlXHJcblx0XHRcdFx0XHRtLnJvdXRlKGRlZmF1bHRSb3V0ZSwgdHJ1ZSlcclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gZmFsc2VcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdHZhciBsaXN0ZW5lciA9IG0ucm91dGUubW9kZSA9PT0gXCJoYXNoXCIgPyBcIm9uaGFzaGNoYW5nZVwiIDogXCJvbnBvcHN0YXRlXCI7XHJcblx0XHRcdHdpbmRvd1tsaXN0ZW5lcl0gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR2YXIgcGF0aCA9ICRsb2NhdGlvblttLnJvdXRlLm1vZGVdXHJcblx0XHRcdFx0aWYgKG0ucm91dGUubW9kZSA9PT0gXCJwYXRobmFtZVwiKSBwYXRoICs9ICRsb2NhdGlvbi5zZWFyY2hcclxuXHRcdFx0XHRpZiAoY3VycmVudFJvdXRlICE9IG5vcm1hbGl6ZVJvdXRlKHBhdGgpKSB7XHJcblx0XHRcdFx0XHRyZWRpcmVjdChwYXRoKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBzZXRTY3JvbGw7XHJcblx0XHRcdHdpbmRvd1tsaXN0ZW5lcl0oKVxyXG5cdFx0fVxyXG5cdFx0Ly9jb25maWc6IG0ucm91dGVcclxuXHRcdGVsc2UgaWYgKGFyZ3VtZW50c1swXS5hZGRFdmVudExpc3RlbmVyIHx8IGFyZ3VtZW50c1swXS5hdHRhY2hFdmVudCkge1xyXG5cdFx0XHR2YXIgZWxlbWVudCA9IGFyZ3VtZW50c1swXTtcclxuXHRcdFx0dmFyIGlzSW5pdGlhbGl6ZWQgPSBhcmd1bWVudHNbMV07XHJcblx0XHRcdHZhciBjb250ZXh0ID0gYXJndW1lbnRzWzJdO1xyXG5cdFx0XHR2YXIgdmRvbSA9IGFyZ3VtZW50c1szXTtcclxuXHRcdFx0ZWxlbWVudC5ocmVmID0gKG0ucm91dGUubW9kZSAhPT0gJ3BhdGhuYW1lJyA/ICRsb2NhdGlvbi5wYXRobmFtZSA6ICcnKSArIG1vZGVzW20ucm91dGUubW9kZV0gKyB2ZG9tLmF0dHJzLmhyZWY7XHJcblx0XHRcdGlmIChlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuXHRcdFx0XHRlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKTtcclxuXHRcdFx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdGVsZW1lbnQuZGV0YWNoRXZlbnQoXCJvbmNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpO1xyXG5cdFx0XHRcdGVsZW1lbnQuYXR0YWNoRXZlbnQoXCJvbmNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdC8vbS5yb3V0ZShyb3V0ZSwgcGFyYW1zLCBzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5KVxyXG5cdFx0ZWxzZSBpZiAodHlwZS5jYWxsKGFyZ3VtZW50c1swXSkgPT09IFNUUklORykge1xyXG5cdFx0XHR2YXIgb2xkUm91dGUgPSBjdXJyZW50Um91dGU7XHJcblx0XHRcdGN1cnJlbnRSb3V0ZSA9IGFyZ3VtZW50c1swXTtcclxuXHRcdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHNbMV0gfHwge31cclxuXHRcdFx0dmFyIHF1ZXJ5SW5kZXggPSBjdXJyZW50Um91dGUuaW5kZXhPZihcIj9cIilcclxuXHRcdFx0dmFyIHBhcmFtcyA9IHF1ZXJ5SW5kZXggPiAtMSA/IHBhcnNlUXVlcnlTdHJpbmcoY3VycmVudFJvdXRlLnNsaWNlKHF1ZXJ5SW5kZXggKyAxKSkgOiB7fVxyXG5cdFx0XHRmb3IgKHZhciBpIGluIGFyZ3MpIHBhcmFtc1tpXSA9IGFyZ3NbaV1cclxuXHRcdFx0dmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhwYXJhbXMpXHJcblx0XHRcdHZhciBjdXJyZW50UGF0aCA9IHF1ZXJ5SW5kZXggPiAtMSA/IGN1cnJlbnRSb3V0ZS5zbGljZSgwLCBxdWVyeUluZGV4KSA6IGN1cnJlbnRSb3V0ZVxyXG5cdFx0XHRpZiAocXVlcnlzdHJpbmcpIGN1cnJlbnRSb3V0ZSA9IGN1cnJlbnRQYXRoICsgKGN1cnJlbnRQYXRoLmluZGV4T2YoXCI/XCIpID09PSAtMSA/IFwiP1wiIDogXCImXCIpICsgcXVlcnlzdHJpbmc7XHJcblxyXG5cdFx0XHR2YXIgc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSA9IChhcmd1bWVudHMubGVuZ3RoID09PSAzID8gYXJndW1lbnRzWzJdIDogYXJndW1lbnRzWzFdKSA9PT0gdHJ1ZSB8fCBvbGRSb3V0ZSA9PT0gYXJndW1lbnRzWzBdO1xyXG5cclxuXHRcdFx0aWYgKHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSkge1xyXG5cdFx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsXHJcblx0XHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR3aW5kb3cuaGlzdG9yeVtzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5ID8gXCJyZXBsYWNlU3RhdGVcIiA6IFwicHVzaFN0YXRlXCJdKG51bGwsICRkb2N1bWVudC50aXRsZSwgbW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSk7XHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRyZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdCRsb2NhdGlvblttLnJvdXRlLm1vZGVdID0gY3VycmVudFJvdXRlXHJcblx0XHRcdFx0cmVkaXJlY3QobW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH07XHJcblx0bS5yb3V0ZS5wYXJhbSA9IGZ1bmN0aW9uKGtleSkge1xyXG5cdFx0aWYgKCFyb3V0ZVBhcmFtcykgdGhyb3cgbmV3IEVycm9yKFwiWW91IG11c3QgY2FsbCBtLnJvdXRlKGVsZW1lbnQsIGRlZmF1bHRSb3V0ZSwgcm91dGVzKSBiZWZvcmUgY2FsbGluZyBtLnJvdXRlLnBhcmFtKClcIilcclxuXHRcdHJldHVybiByb3V0ZVBhcmFtc1trZXldXHJcblx0fTtcclxuXHRtLnJvdXRlLm1vZGUgPSBcInNlYXJjaFwiO1xyXG5cdGZ1bmN0aW9uIG5vcm1hbGl6ZVJvdXRlKHJvdXRlKSB7XHJcblx0XHRyZXR1cm4gcm91dGUuc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHJvdXRlQnlWYWx1ZShyb290LCByb3V0ZXIsIHBhdGgpIHtcclxuXHRcdHJvdXRlUGFyYW1zID0ge307XHJcblxyXG5cdFx0dmFyIHF1ZXJ5U3RhcnQgPSBwYXRoLmluZGV4T2YoXCI/XCIpO1xyXG5cdFx0aWYgKHF1ZXJ5U3RhcnQgIT09IC0xKSB7XHJcblx0XHRcdHJvdXRlUGFyYW1zID0gcGFyc2VRdWVyeVN0cmluZyhwYXRoLnN1YnN0cihxdWVyeVN0YXJ0ICsgMSwgcGF0aC5sZW5ndGgpKTtcclxuXHRcdFx0cGF0aCA9IHBhdGguc3Vic3RyKDAsIHF1ZXJ5U3RhcnQpXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gR2V0IGFsbCByb3V0ZXMgYW5kIGNoZWNrIGlmIHRoZXJlJ3NcclxuXHRcdC8vIGFuIGV4YWN0IG1hdGNoIGZvciB0aGUgY3VycmVudCBwYXRoXHJcblx0XHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKHJvdXRlcik7XHJcblx0XHR2YXIgaW5kZXggPSBrZXlzLmluZGV4T2YocGF0aCk7XHJcblx0XHRpZihpbmRleCAhPT0gLTEpe1xyXG5cdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltrZXlzIFtpbmRleF1dKTtcclxuXHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHR9XHJcblxyXG5cdFx0Zm9yICh2YXIgcm91dGUgaW4gcm91dGVyKSB7XHJcblx0XHRcdGlmIChyb3V0ZSA9PT0gcGF0aCkge1xyXG5cdFx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW3JvdXRlXSk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFwiXlwiICsgcm91dGUucmVwbGFjZSgvOlteXFwvXSs/XFwuezN9L2csIFwiKC4qPylcIikucmVwbGFjZSgvOlteXFwvXSsvZywgXCIoW15cXFxcL10rKVwiKSArIFwiXFwvPyRcIik7XHJcblxyXG5cdFx0XHRpZiAobWF0Y2hlci50ZXN0KHBhdGgpKSB7XHJcblx0XHRcdFx0cGF0aC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0dmFyIGtleXMgPSByb3V0ZS5tYXRjaCgvOlteXFwvXSsvZykgfHwgW107XHJcblx0XHRcdFx0XHR2YXIgdmFsdWVzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEsIC0yKTtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSByb3V0ZVBhcmFtc1trZXlzW2ldLnJlcGxhY2UoLzp8XFwuL2csIFwiXCIpXSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZXNbaV0pXHJcblx0XHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pXHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHRmdW5jdGlvbiByb3V0ZVVub2J0cnVzaXZlKGUpIHtcclxuXHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0aWYgKGUuY3RybEtleSB8fCBlLm1ldGFLZXkgfHwgZS53aGljaCA9PT0gMikgcmV0dXJuO1xyXG5cdFx0aWYgKGUucHJldmVudERlZmF1bHQpIGUucHJldmVudERlZmF1bHQoKTtcclxuXHRcdGVsc2UgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xyXG5cdFx0dmFyIGN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgZS5zcmNFbGVtZW50O1xyXG5cdFx0dmFyIGFyZ3MgPSBtLnJvdXRlLm1vZGUgPT09IFwicGF0aG5hbWVcIiAmJiBjdXJyZW50VGFyZ2V0LnNlYXJjaCA/IHBhcnNlUXVlcnlTdHJpbmcoY3VycmVudFRhcmdldC5zZWFyY2guc2xpY2UoMSkpIDoge307XHJcblx0XHR3aGlsZSAoY3VycmVudFRhcmdldCAmJiBjdXJyZW50VGFyZ2V0Lm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgIT0gXCJBXCIpIGN1cnJlbnRUYXJnZXQgPSBjdXJyZW50VGFyZ2V0LnBhcmVudE5vZGVcclxuXHRcdG0ucm91dGUoY3VycmVudFRhcmdldFttLnJvdXRlLm1vZGVdLnNsaWNlKG1vZGVzW20ucm91dGUubW9kZV0ubGVuZ3RoKSwgYXJncylcclxuXHR9XHJcblx0ZnVuY3Rpb24gc2V0U2Nyb2xsKCkge1xyXG5cdFx0aWYgKG0ucm91dGUubW9kZSAhPSBcImhhc2hcIiAmJiAkbG9jYXRpb24uaGFzaCkgJGxvY2F0aW9uLmhhc2ggPSAkbG9jYXRpb24uaGFzaDtcclxuXHRcdGVsc2Ugd2luZG93LnNjcm9sbFRvKDAsIDApXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJ1aWxkUXVlcnlTdHJpbmcob2JqZWN0LCBwcmVmaXgpIHtcclxuXHRcdHZhciBkdXBsaWNhdGVzID0ge31cclxuXHRcdHZhciBzdHIgPSBbXVxyXG5cdFx0Zm9yICh2YXIgcHJvcCBpbiBvYmplY3QpIHtcclxuXHRcdFx0dmFyIGtleSA9IHByZWZpeCA/IHByZWZpeCArIFwiW1wiICsgcHJvcCArIFwiXVwiIDogcHJvcFxyXG5cdFx0XHR2YXIgdmFsdWUgPSBvYmplY3RbcHJvcF1cclxuXHRcdFx0dmFyIHZhbHVlVHlwZSA9IHR5cGUuY2FsbCh2YWx1ZSlcclxuXHRcdFx0dmFyIHBhaXIgPSAodmFsdWUgPT09IG51bGwpID8gZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgOlxyXG5cdFx0XHRcdHZhbHVlVHlwZSA9PT0gT0JKRUNUID8gYnVpbGRRdWVyeVN0cmluZyh2YWx1ZSwga2V5KSA6XHJcblx0XHRcdFx0dmFsdWVUeXBlID09PSBBUlJBWSA/IHZhbHVlLnJlZHVjZShmdW5jdGlvbihtZW1vLCBpdGVtKSB7XHJcblx0XHRcdFx0XHRpZiAoIWR1cGxpY2F0ZXNba2V5XSkgZHVwbGljYXRlc1trZXldID0ge31cclxuXHRcdFx0XHRcdGlmICghZHVwbGljYXRlc1trZXldW2l0ZW1dKSB7XHJcblx0XHRcdFx0XHRcdGR1cGxpY2F0ZXNba2V5XVtpdGVtXSA9IHRydWVcclxuXHRcdFx0XHRcdFx0cmV0dXJuIG1lbW8uY29uY2F0KGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQoaXRlbSkpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRyZXR1cm4gbWVtb1xyXG5cdFx0XHRcdH0sIFtdKS5qb2luKFwiJlwiKSA6XHJcblx0XHRcdFx0ZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSlcclxuXHRcdFx0aWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHN0ci5wdXNoKHBhaXIpXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gc3RyLmpvaW4oXCImXCIpXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHBhcnNlUXVlcnlTdHJpbmcoc3RyKSB7XHJcblx0XHRpZiAoc3RyLmNoYXJBdCgwKSA9PT0gXCI/XCIpIHN0ciA9IHN0ci5zdWJzdHJpbmcoMSk7XHJcblx0XHRcclxuXHRcdHZhciBwYWlycyA9IHN0ci5zcGxpdChcIiZcIiksIHBhcmFtcyA9IHt9O1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IHBhaXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdHZhciBwYWlyID0gcGFpcnNbaV0uc3BsaXQoXCI9XCIpO1xyXG5cdFx0XHR2YXIga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pXHJcblx0XHRcdHZhciB2YWx1ZSA9IHBhaXIubGVuZ3RoID09IDIgPyBkZWNvZGVVUklDb21wb25lbnQocGFpclsxXSkgOiBudWxsXHJcblx0XHRcdGlmIChwYXJhbXNba2V5XSAhPSBudWxsKSB7XHJcblx0XHRcdFx0aWYgKHR5cGUuY2FsbChwYXJhbXNba2V5XSkgIT09IEFSUkFZKSBwYXJhbXNba2V5XSA9IFtwYXJhbXNba2V5XV1cclxuXHRcdFx0XHRwYXJhbXNba2V5XS5wdXNoKHZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgcGFyYW1zW2tleV0gPSB2YWx1ZVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHBhcmFtc1xyXG5cdH1cclxuXHRtLnJvdXRlLmJ1aWxkUXVlcnlTdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nXHJcblx0bS5yb3V0ZS5wYXJzZVF1ZXJ5U3RyaW5nID0gcGFyc2VRdWVyeVN0cmluZ1xyXG5cdFxyXG5cdGZ1bmN0aW9uIHJlc2V0KHJvb3QpIHtcclxuXHRcdHZhciBjYWNoZUtleSA9IGdldENlbGxDYWNoZUtleShyb290KTtcclxuXHRcdGNsZWFyKHJvb3QuY2hpbGROb2RlcywgY2VsbENhY2hlW2NhY2hlS2V5XSk7XHJcblx0XHRjZWxsQ2FjaGVbY2FjaGVLZXldID0gdW5kZWZpbmVkXHJcblx0fVxyXG5cclxuXHRtLmRlZmVycmVkID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKCk7XHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlKTtcclxuXHRcdHJldHVybiBkZWZlcnJlZFxyXG5cdH07XHJcblx0ZnVuY3Rpb24gcHJvcGlmeShwcm9taXNlLCBpbml0aWFsVmFsdWUpIHtcclxuXHRcdHZhciBwcm9wID0gbS5wcm9wKGluaXRpYWxWYWx1ZSk7XHJcblx0XHRwcm9taXNlLnRoZW4ocHJvcCk7XHJcblx0XHRwcm9wLnRoZW4gPSBmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuXHRcdFx0cmV0dXJuIHByb3BpZnkocHJvbWlzZS50aGVuKHJlc29sdmUsIHJlamVjdCksIGluaXRpYWxWYWx1ZSlcclxuXHRcdH07XHJcblx0XHRyZXR1cm4gcHJvcFxyXG5cdH1cclxuXHQvL1Byb21pei5taXRocmlsLmpzIHwgWm9sbWVpc3RlciB8IE1JVFxyXG5cdC8vYSBtb2RpZmllZCB2ZXJzaW9uIG9mIFByb21pei5qcywgd2hpY2ggZG9lcyBub3QgY29uZm9ybSB0byBQcm9taXNlcy9BKyBmb3IgdHdvIHJlYXNvbnM6XHJcblx0Ly8xKSBgdGhlbmAgY2FsbGJhY2tzIGFyZSBjYWxsZWQgc3luY2hyb25vdXNseSAoYmVjYXVzZSBzZXRUaW1lb3V0IGlzIHRvbyBzbG93LCBhbmQgdGhlIHNldEltbWVkaWF0ZSBwb2x5ZmlsbCBpcyB0b28gYmlnXHJcblx0Ly8yKSB0aHJvd2luZyBzdWJjbGFzc2VzIG9mIEVycm9yIGNhdXNlIHRoZSBlcnJvciB0byBiZSBidWJibGVkIHVwIGluc3RlYWQgb2YgdHJpZ2dlcmluZyByZWplY3Rpb24gKGJlY2F1c2UgdGhlIHNwZWMgZG9lcyBub3QgYWNjb3VudCBmb3IgdGhlIGltcG9ydGFudCB1c2UgY2FzZSBvZiBkZWZhdWx0IGJyb3dzZXIgZXJyb3IgaGFuZGxpbmcsIGkuZS4gbWVzc2FnZSB3LyBsaW5lIG51bWJlcilcclxuXHRmdW5jdGlvbiBEZWZlcnJlZChzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaykge1xyXG5cdFx0dmFyIFJFU09MVklORyA9IDEsIFJFSkVDVElORyA9IDIsIFJFU09MVkVEID0gMywgUkVKRUNURUQgPSA0O1xyXG5cdFx0dmFyIHNlbGYgPSB0aGlzLCBzdGF0ZSA9IDAsIHByb21pc2VWYWx1ZSA9IDAsIG5leHQgPSBbXTtcclxuXHJcblx0XHRzZWxmW1wicHJvbWlzZVwiXSA9IHt9O1xyXG5cclxuXHRcdHNlbGZbXCJyZXNvbHZlXCJdID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKCFzdGF0ZSkge1xyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HO1xyXG5cclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fTtcclxuXHJcblx0XHRzZWxmW1wicmVqZWN0XCJdID0gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0aWYgKCFzdGF0ZSkge1xyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HO1xyXG5cclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fTtcclxuXHJcblx0XHRzZWxmLnByb21pc2VbXCJ0aGVuXCJdID0gZnVuY3Rpb24oc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spIHtcclxuXHRcdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKTtcclxuXHRcdFx0aWYgKHN0YXRlID09PSBSRVNPTFZFRCkge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlc29sdmUocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHN0YXRlID09PSBSRUpFQ1RFRCkge1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChwcm9taXNlVmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0bmV4dC5wdXNoKGRlZmVycmVkKVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0XHR9O1xyXG5cclxuXHRcdGZ1bmN0aW9uIGZpbmlzaCh0eXBlKSB7XHJcblx0XHRcdHN0YXRlID0gdHlwZSB8fCBSRUpFQ1RFRDtcclxuXHRcdFx0bmV4dC5tYXAoZnVuY3Rpb24oZGVmZXJyZWQpIHtcclxuXHRcdFx0XHRzdGF0ZSA9PT0gUkVTT0xWRUQgJiYgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpIHx8IGRlZmVycmVkLnJlamVjdChwcm9taXNlVmFsdWUpXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gdGhlbm5hYmxlKHRoZW4sIHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrLCBub3RUaGVubmFibGVDYWxsYmFjaykge1xyXG5cdFx0XHRpZiAoKChwcm9taXNlVmFsdWUgIT0gbnVsbCAmJiB0eXBlLmNhbGwocHJvbWlzZVZhbHVlKSA9PT0gT0JKRUNUKSB8fCB0eXBlb2YgcHJvbWlzZVZhbHVlID09PSBGVU5DVElPTikgJiYgdHlwZW9mIHRoZW4gPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdC8vIGNvdW50IHByb3RlY3RzIGFnYWluc3QgYWJ1c2UgY2FsbHMgZnJvbSBzcGVjIGNoZWNrZXJcclxuXHRcdFx0XHRcdHZhciBjb3VudCA9IDA7XHJcblx0XHRcdFx0XHR0aGVuLmNhbGwocHJvbWlzZVZhbHVlLCBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRpZiAoY291bnQrKykgcmV0dXJuO1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdFx0c3VjY2Vzc0NhbGxiYWNrKClcclxuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRcdFx0XHRpZiAoY291bnQrKykgcmV0dXJuO1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdFx0ZmFpbHVyZUNhbGxiYWNrKClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlO1xyXG5cdFx0XHRcdFx0ZmFpbHVyZUNhbGxiYWNrKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bm90VGhlbm5hYmxlQ2FsbGJhY2soKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZmlyZSgpIHtcclxuXHRcdFx0Ly8gY2hlY2sgaWYgaXQncyBhIHRoZW5hYmxlXHJcblx0XHRcdHZhciB0aGVuO1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHRoZW4gPSBwcm9taXNlVmFsdWUgJiYgcHJvbWlzZVZhbHVlLnRoZW5cclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlO1xyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HO1xyXG5cdFx0XHRcdHJldHVybiBmaXJlKClcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkc7XHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH0sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVKRUNUSU5HO1xyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0aWYgKHN0YXRlID09PSBSRVNPTFZJTkcgJiYgdHlwZW9mIHN1Y2Nlc3NDYWxsYmFjayA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gc3VjY2Vzc0NhbGxiYWNrKHByb21pc2VWYWx1ZSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKHN0YXRlID09PSBSRUpFQ1RJTkcgJiYgdHlwZW9mIGZhaWx1cmVDYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGZhaWx1cmVDYWxsYmFjayhwcm9taXNlVmFsdWUpO1xyXG5cdFx0XHRcdFx0XHRzdGF0ZSA9IFJFU09MVklOR1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRcdHJldHVybiBmaW5pc2goKVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKHByb21pc2VWYWx1ZSA9PT0gc2VsZikge1xyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gVHlwZUVycm9yKCk7XHJcblx0XHRcdFx0XHRmaW5pc2goKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdHRoZW5uYWJsZSh0aGVuLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGZpbmlzaChSRVNPTFZFRClcclxuXHRcdFx0XHRcdH0sIGZpbmlzaCwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRmaW5pc2goc3RhdGUgPT09IFJFU09MVklORyAmJiBSRVNPTFZFRClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdH1cclxuXHRtLmRlZmVycmVkLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRpZiAodHlwZS5jYWxsKGUpID09PSBcIltvYmplY3QgRXJyb3JdXCIgJiYgIWUuY29uc3RydWN0b3IudG9TdHJpbmcoKS5tYXRjaCgvIEVycm9yLykpIHRocm93IGVcclxuXHR9O1xyXG5cclxuXHRtLnN5bmMgPSBmdW5jdGlvbihhcmdzKSB7XHJcblx0XHR2YXIgbWV0aG9kID0gXCJyZXNvbHZlXCI7XHJcblx0XHRmdW5jdGlvbiBzeW5jaHJvbml6ZXIocG9zLCByZXNvbHZlZCkge1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRyZXN1bHRzW3Bvc10gPSB2YWx1ZTtcclxuXHRcdFx0XHRpZiAoIXJlc29sdmVkKSBtZXRob2QgPSBcInJlamVjdFwiO1xyXG5cdFx0XHRcdGlmICgtLW91dHN0YW5kaW5nID09PSAwKSB7XHJcblx0XHRcdFx0XHRkZWZlcnJlZC5wcm9taXNlKHJlc3VsdHMpO1xyXG5cdFx0XHRcdFx0ZGVmZXJyZWRbbWV0aG9kXShyZXN1bHRzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRyZXR1cm4gdmFsdWVcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBkZWZlcnJlZCA9IG0uZGVmZXJyZWQoKTtcclxuXHRcdHZhciBvdXRzdGFuZGluZyA9IGFyZ3MubGVuZ3RoO1xyXG5cdFx0dmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkob3V0c3RhbmRpbmcpO1xyXG5cdFx0aWYgKGFyZ3MubGVuZ3RoID4gMCkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRhcmdzW2ldLnRoZW4oc3luY2hyb25pemVyKGksIHRydWUpLCBzeW5jaHJvbml6ZXIoaSwgZmFsc2UpKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGRlZmVycmVkLnJlc29sdmUoW10pO1xyXG5cclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0fTtcclxuXHRmdW5jdGlvbiBpZGVudGl0eSh2YWx1ZSkge3JldHVybiB2YWx1ZX1cclxuXHJcblx0ZnVuY3Rpb24gYWpheChvcHRpb25zKSB7XHJcblx0XHRpZiAob3B0aW9ucy5kYXRhVHlwZSAmJiBvcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIikge1xyXG5cdFx0XHR2YXIgY2FsbGJhY2tLZXkgPSBcIm1pdGhyaWxfY2FsbGJhY2tfXCIgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIFwiX1wiICsgKE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDFlMTYpKS50b1N0cmluZygzNik7XHJcblx0XHRcdHZhciBzY3JpcHQgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcclxuXHJcblx0XHRcdHdpbmRvd1tjYWxsYmFja0tleV0gPSBmdW5jdGlvbihyZXNwKSB7XHJcblx0XHRcdFx0c2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuXHRcdFx0XHRvcHRpb25zLm9ubG9hZCh7XHJcblx0XHRcdFx0XHR0eXBlOiBcImxvYWRcIixcclxuXHRcdFx0XHRcdHRhcmdldDoge1xyXG5cdFx0XHRcdFx0XHRyZXNwb25zZVRleHQ6IHJlc3BcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR3aW5kb3dbY2FsbGJhY2tLZXldID0gdW5kZWZpbmVkXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY3JpcHQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xyXG5cclxuXHRcdFx0XHRvcHRpb25zLm9uZXJyb3Ioe1xyXG5cdFx0XHRcdFx0dHlwZTogXCJlcnJvclwiLFxyXG5cdFx0XHRcdFx0dGFyZ2V0OiB7XHJcblx0XHRcdFx0XHRcdHN0YXR1czogNTAwLFxyXG5cdFx0XHRcdFx0XHRyZXNwb25zZVRleHQ6IEpTT04uc3RyaW5naWZ5KHtlcnJvcjogXCJFcnJvciBtYWtpbmcganNvbnAgcmVxdWVzdFwifSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHR3aW5kb3dbY2FsbGJhY2tLZXldID0gdW5kZWZpbmVkO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjcmlwdC5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY3JpcHQuc3JjID0gb3B0aW9ucy51cmxcclxuXHRcdFx0XHQrIChvcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA+IDAgPyBcIiZcIiA6IFwiP1wiKVxyXG5cdFx0XHRcdCsgKG9wdGlvbnMuY2FsbGJhY2tLZXkgPyBvcHRpb25zLmNhbGxiYWNrS2V5IDogXCJjYWxsYmFja1wiKVxyXG5cdFx0XHRcdCsgXCI9XCIgKyBjYWxsYmFja0tleVxyXG5cdFx0XHRcdCsgXCImXCIgKyBidWlsZFF1ZXJ5U3RyaW5nKG9wdGlvbnMuZGF0YSB8fCB7fSk7XHJcblx0XHRcdCRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdClcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR2YXIgeGhyID0gbmV3IHdpbmRvdy5YTUxIdHRwUmVxdWVzdDtcclxuXHRcdFx0eGhyLm9wZW4ob3B0aW9ucy5tZXRob2QsIG9wdGlvbnMudXJsLCB0cnVlLCBvcHRpb25zLnVzZXIsIG9wdGlvbnMucGFzc3dvcmQpO1xyXG5cdFx0XHR4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XHJcblx0XHRcdFx0XHRpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCkgb3B0aW9ucy5vbmxvYWQoe3R5cGU6IFwibG9hZFwiLCB0YXJnZXQ6IHhocn0pO1xyXG5cdFx0XHRcdFx0ZWxzZSBvcHRpb25zLm9uZXJyb3Ioe3R5cGU6IFwiZXJyb3JcIiwgdGFyZ2V0OiB4aHJ9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0aWYgKG9wdGlvbnMuc2VyaWFsaXplID09PSBKU09OLnN0cmluZ2lmeSAmJiBvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5tZXRob2QgIT09IFwiR0VUXCIpIHtcclxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIilcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAob3B0aW9ucy5kZXNlcmlhbGl6ZSA9PT0gSlNPTi5wYXJzZSkge1xyXG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQWNjZXB0XCIsIFwiYXBwbGljYXRpb24vanNvbiwgdGV4dC8qXCIpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5jb25maWcgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0dmFyIG1heWJlWGhyID0gb3B0aW9ucy5jb25maWcoeGhyLCBvcHRpb25zKTtcclxuXHRcdFx0XHRpZiAobWF5YmVYaHIgIT0gbnVsbCkgeGhyID0gbWF5YmVYaHJcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGRhdGEgPSBvcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiB8fCAhb3B0aW9ucy5kYXRhID8gXCJcIiA6IG9wdGlvbnMuZGF0YVxyXG5cdFx0XHRpZiAoZGF0YSAmJiAodHlwZS5jYWxsKGRhdGEpICE9IFNUUklORyAmJiBkYXRhLmNvbnN0cnVjdG9yICE9IHdpbmRvdy5Gb3JtRGF0YSkpIHtcclxuXHRcdFx0XHR0aHJvdyBcIlJlcXVlc3QgZGF0YSBzaG91bGQgYmUgZWl0aGVyIGJlIGEgc3RyaW5nIG9yIEZvcm1EYXRhLiBDaGVjayB0aGUgYHNlcmlhbGl6ZWAgb3B0aW9uIGluIGBtLnJlcXVlc3RgXCI7XHJcblx0XHRcdH1cclxuXHRcdFx0eGhyLnNlbmQoZGF0YSk7XHJcblx0XHRcdHJldHVybiB4aHJcclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gYmluZERhdGEoeGhyT3B0aW9ucywgZGF0YSwgc2VyaWFsaXplKSB7XHJcblx0XHRpZiAoeGhyT3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgJiYgeGhyT3B0aW9ucy5kYXRhVHlwZSAhPSBcImpzb25wXCIpIHtcclxuXHRcdFx0dmFyIHByZWZpeCA9IHhock9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpIDwgMCA/IFwiP1wiIDogXCImXCI7XHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcoZGF0YSk7XHJcblx0XHRcdHhock9wdGlvbnMudXJsID0geGhyT3B0aW9ucy51cmwgKyAocXVlcnlzdHJpbmcgPyBwcmVmaXggKyBxdWVyeXN0cmluZyA6IFwiXCIpXHJcblx0XHR9XHJcblx0XHRlbHNlIHhock9wdGlvbnMuZGF0YSA9IHNlcmlhbGl6ZShkYXRhKTtcclxuXHRcdHJldHVybiB4aHJPcHRpb25zXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZVVybCh1cmwsIGRhdGEpIHtcclxuXHRcdHZhciB0b2tlbnMgPSB1cmwubWF0Y2goLzpbYS16XVxcdysvZ2kpO1xyXG5cdFx0aWYgKHRva2VucyAmJiBkYXRhKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0dmFyIGtleSA9IHRva2Vuc1tpXS5zbGljZSgxKTtcclxuXHRcdFx0XHR1cmwgPSB1cmwucmVwbGFjZSh0b2tlbnNbaV0sIGRhdGFba2V5XSk7XHJcblx0XHRcdFx0ZGVsZXRlIGRhdGFba2V5XVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdXJsXHJcblx0fVxyXG5cclxuXHRtLnJlcXVlc3QgPSBmdW5jdGlvbih4aHJPcHRpb25zKSB7XHJcblx0XHRpZiAoeGhyT3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLnN0YXJ0Q29tcHV0YXRpb24oKTtcclxuXHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpO1xyXG5cdFx0dmFyIGlzSlNPTlAgPSB4aHJPcHRpb25zLmRhdGFUeXBlICYmIHhock9wdGlvbnMuZGF0YVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJqc29ucFwiO1xyXG5cdFx0dmFyIHNlcmlhbGl6ZSA9IHhock9wdGlvbnMuc2VyaWFsaXplID0gaXNKU09OUCA/IGlkZW50aXR5IDogeGhyT3B0aW9ucy5zZXJpYWxpemUgfHwgSlNPTi5zdHJpbmdpZnk7XHJcblx0XHR2YXIgZGVzZXJpYWxpemUgPSB4aHJPcHRpb25zLmRlc2VyaWFsaXplID0gaXNKU09OUCA/IGlkZW50aXR5IDogeGhyT3B0aW9ucy5kZXNlcmlhbGl6ZSB8fCBKU09OLnBhcnNlO1xyXG5cdFx0dmFyIGV4dHJhY3QgPSBpc0pTT05QID8gZnVuY3Rpb24oanNvbnApIHtyZXR1cm4ganNvbnAucmVzcG9uc2VUZXh0fSA6IHhock9wdGlvbnMuZXh0cmFjdCB8fCBmdW5jdGlvbih4aHIpIHtcclxuXHRcdFx0cmV0dXJuIHhoci5yZXNwb25zZVRleHQubGVuZ3RoID09PSAwICYmIGRlc2VyaWFsaXplID09PSBKU09OLnBhcnNlID8gbnVsbCA6IHhoci5yZXNwb25zZVRleHRcclxuXHRcdH07XHJcblx0XHR4aHJPcHRpb25zLm1ldGhvZCA9ICh4aHJPcHRpb25zLm1ldGhvZCB8fCAnR0VUJykudG9VcHBlckNhc2UoKTtcclxuXHRcdHhock9wdGlvbnMudXJsID0gcGFyYW1ldGVyaXplVXJsKHhock9wdGlvbnMudXJsLCB4aHJPcHRpb25zLmRhdGEpO1xyXG5cdFx0eGhyT3B0aW9ucyA9IGJpbmREYXRhKHhock9wdGlvbnMsIHhock9wdGlvbnMuZGF0YSwgc2VyaWFsaXplKTtcclxuXHRcdHhock9wdGlvbnMub25sb2FkID0geGhyT3B0aW9ucy5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0XHRcdHZhciB1bndyYXAgPSAoZS50eXBlID09PSBcImxvYWRcIiA/IHhock9wdGlvbnMudW53cmFwU3VjY2VzcyA6IHhock9wdGlvbnMudW53cmFwRXJyb3IpIHx8IGlkZW50aXR5O1xyXG5cdFx0XHRcdHZhciByZXNwb25zZSA9IHVud3JhcChkZXNlcmlhbGl6ZShleHRyYWN0KGUudGFyZ2V0LCB4aHJPcHRpb25zKSksIGUudGFyZ2V0KTtcclxuXHRcdFx0XHRpZiAoZS50eXBlID09PSBcImxvYWRcIikge1xyXG5cdFx0XHRcdFx0aWYgKHR5cGUuY2FsbChyZXNwb25zZSkgPT09IEFSUkFZICYmIHhock9wdGlvbnMudHlwZSkge1xyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHJlc3BvbnNlLmxlbmd0aDsgaSsrKSByZXNwb25zZVtpXSA9IG5ldyB4aHJPcHRpb25zLnR5cGUocmVzcG9uc2VbaV0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIGlmICh4aHJPcHRpb25zLnR5cGUpIHJlc3BvbnNlID0gbmV3IHhock9wdGlvbnMudHlwZShyZXNwb25zZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGVmZXJyZWRbZS50eXBlID09PSBcImxvYWRcIiA/IFwicmVzb2x2ZVwiIDogXCJyZWplY3RcIl0ocmVzcG9uc2UpXHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGUpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHhock9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5lbmRDb21wdXRhdGlvbigpXHJcblx0XHR9O1xyXG5cdFx0YWpheCh4aHJPcHRpb25zKTtcclxuXHRcdGRlZmVycmVkLnByb21pc2UgPSBwcm9waWZ5KGRlZmVycmVkLnByb21pc2UsIHhock9wdGlvbnMuaW5pdGlhbFZhbHVlKTtcclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0fTtcclxuXHJcblx0Ly90ZXN0aW5nIEFQSVxyXG5cdG0uZGVwcyA9IGZ1bmN0aW9uKG1vY2spIHtcclxuXHRcdGluaXRpYWxpemUod2luZG93ID0gbW9jayB8fCB3aW5kb3cpO1xyXG5cdFx0cmV0dXJuIHdpbmRvdztcclxuXHR9O1xyXG5cdC8vZm9yIGludGVybmFsIHRlc3Rpbmcgb25seSwgZG8gbm90IHVzZSBgbS5kZXBzLmZhY3RvcnlgXHJcblx0bS5kZXBzLmZhY3RvcnkgPSBhcHA7XHJcblxyXG5cdHJldHVybiBtXHJcbn0pKHR5cGVvZiB3aW5kb3cgIT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlICE9PSBudWxsICYmIG1vZHVsZS5leHBvcnRzKSBtb2R1bGUuZXhwb3J0cyA9IG07XHJcbmVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSBkZWZpbmUoZnVuY3Rpb24oKSB7cmV0dXJuIG19KTtcclxuIl19
