(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    this.roomsEntered = {};
    this.commandWords = [];
    this.commandText = '';
    this.message = '';
    this.callbacks = [];
    this.startRoom = '';
    this.lastRoom = '';
    this.waitCallback = null;
    this.alreadyGottenMessage = '';
    this.previousCommands = [];
  }

  Engine.prototype.setStartRoom = function(roomName) {
    return this.startRoom = roomName;
  };

  Engine.prototype.setAfterCommand = function(callback) {
    return this.afterCommand = callback.bind(this);
  };

  Engine.prototype.setAlreadyGottenMessage = function(msg) {
    return this.alreadyGottenMessage = msg;
  };

  Engine.prototype.save = function() {
    return localStorage.setItem('progress', JSON.stringify({
      inventory: this.inventory,
      currentRoomName: this.currentRoomName,
      previousCommands: this.previousCommands,
      flags: this.flags,
      roomsEntered: this.roomsEntered
    }));
  };

  Engine.prototype.load = function() {
    var data, error;
    try {
      data = JSON.parse(localStorage.getItem('progress'));
      this.inventory = data.inventory;
      this.currentRoomName = data.currentRoomName;
      this.previousCommands = data.previousCommands || [];
      this.flags = data.flags;
      this.roomsEntered = data.roomsEntered;
      return true;
    } catch (error) {
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
    var callback, cannonicalWord, i, j, len, len1, ref, synonym, synonyms, word;
    this.commandText = commandText;
    if (this.waitCallback != null) {
      callback = this.waitCallback;
      this.waitCallback = null;
      callback();
      return;
    }
    if (this.commandText === '') {
      return;
    }
    this.previousCommands.push(this.commandText);
    this.commandText = ' ' + this.commandText.trim().toLowerCase().replace(/\W+/g, ' ').replace(/\s{2,}/g, ' ') + ' ';
    for (cannonicalWord in synonymData) {
      synonyms = synonymData[cannonicalWord];
      for (i = 0, len = synonyms.length; i < len; i++) {
        synonym = synonyms[i];
        this.commandText = this.commandText.replace(" " + synonym + " ", " " + cannonicalWord + " ");
      }
    }
    this.commandText = this.commandText.trim();
    this.commandWords = this.commandText.split(' ');
    if (indexOf.call(this.commandWords, 'take') >= 0) {
      ref = this.commandWords;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        word = ref[j];
        if (this.hasItem(word)) {
          this.print(this.alreadyGottenMessage);
          return;
        }
      }
    }
    this.rooms[this.currentRoomName]();
    return this.afterCommand();
  };

  Engine.prototype.setUniversalCommands = function(callback) {
    return this.universalCommands = callback.bind(this);
  };

  Engine.prototype.tryUniversalCommands = function() {
    return this.universalCommands();
  };

  Engine.prototype.exactlyMatches = function(pattern) {
    return this.commandText === pattern;
  };

  Engine.prototype.matches = function(pattern) {
    var commandWord, found, i, j, len, len1, patternWord, patternWords, ref;
    patternWords = pattern.split(' ');
    for (i = 0, len = patternWords.length; i < len; i++) {
      patternWord = patternWords[i];
      found = false;
      ref = this.commandWords;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        commandWord = ref[j];
        if (patternWord.startsWith(commandWord) && (commandWord.length >= 4 || patternWord.length <= 4)) {
          found = true;
        }
      }
      if (!found) {
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

  Engine.prototype.isFirstTimeEntering = function() {
    return this.roomsEntered[this.currentRoomName] === 1;
  };

  Engine.prototype.comingFrom = function(rooms) {
    var ref;
    return ref = this.lastRoom, indexOf.call(rooms, ref) >= 0;
  };

  Engine.prototype.print = function(text) {
    this.message = text;
    return this.notify();
  };

  Engine.prototype.goToRoom = function(roomName) {
    this.lastRoom = this.currentRoomName;
    this.currentRoomName = roomName;
    if (roomName in this.roomsEntered) {
      this.roomsEntered[roomName]++;
    } else {
      this.roomsEntered[roomName] = 1;
    }
    this.doCommand('__enter_room__');
    return this.notify();
  };

  Engine.prototype.goToStart = function() {
    return this.goToRoom(this.startRoom);
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



},{"./synonyms":3}],2:[function(require,module,exports){
var engine, m, view;

m = require('mithril');

engine = new (require('./engine'))();

view = require('app/view')(engine);

m.mount(document.body, view);



},{"./engine":1,"app/view":4,"mithril":6}],3:[function(require,module,exports){
module.exports = {
  look: ['see', 'admire', 'behold', 'gawk', 'observe', 'spy', 'check'],
  take: ['pick up', 'get', 'acquire', 'grab', 'grasp', 'obtain', 'buy', 'choose'],
  go: ['walk', 'perambulate', 'move', 'travel', 'journey', 'mosey'],
  give: ['deliver', 'donate', 'hand over', 'present', 'endow', 'bequeath', 'bestow', 'relinquish'],
  garden: ['plot', 'plants', 'produce'],
  flower: ['flour'],
  soda: ['pop'],
  margarine: ['butter'],
  stir: ['whip', 'pulse', 'vibrate', 'mix', 'blend', 'agitate', 'churn', 'beat'],
  attack: ['fight', 'punch', 'bite', 'intervene'],
  badge: ['sheriff', 'sticker'],
  enter: ['in', 'inside'],
  exit: ['leave', 'out', 'outside', 'withdraw', 'flee', 'depart', 'decamp']
};



},{}],4:[function(require,module,exports){
var ITEM_NAMES, TextTyper, WaleVsSharc, m,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

m = require('mithril');

WaleVsSharc = require('app/walevssharc');

String.prototype.capitalize = function() {
  return this[0].toUpperCase() + this.slice(1);
};

ITEM_NAMES = {
  egg: 'Egg',
  cuttlefish: 'Cuttlefish',
  flowers: 'Flowers',
  soda: 'Baking Soda',
  pancakes: 'Pancakes',
  syrup: 'Maple Syrup',
  margarine: 'Margarine',
  umbrella: 'Umbrella',
  badge: 'Badge Sticker',
  milk: 'Manatee Milk',
  'red herring': 'Red Herring',
  'cowboy hat': 'Cowboy Hat',
  'rainbow wig': 'Rainbow Wig',
  'motorcycle helmet': 'Motorcycle Helmet',
  'stovepipe hat': 'Stovepipe Hat',
  'leather jacket': 'Leather Jacket',
  'clown suit': 'Clown Suit',
  'oldtimey suit': 'Old-Timey Suit',
  'cow print vest': 'Cow Print Vest',
  'fake beard': 'Fake Beard',
  'gun belt': 'Gun Belt',
  'metal chain': 'Metal Chain',
  'rubber chicken': 'Rubber Chicken',
  'quadratic eye': 'Quadratic Eye'
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
      return setTimeout(this.typeLoop, 6);
    }
  };

  TextTyper.prototype.setMessage = function(message) {
    this.currentMessage = message;
    this.i = 0;
    return setTimeout(this.typeLoop, 6);
  };

  TextTyper.prototype.showAll = function() {
    return this.i = this.currentMessage.length - 1;
  };

  TextTyper.prototype.getTextSoFar = function() {
    return this.currentMessage.slice(0, +this.i + 1 || 9e9);
  };

  TextTyper.prototype.isDone = function() {
    return this.i >= this.currentMessage.length - 1;
  };

  return TextTyper;

})();

module.exports = function(engine) {
  return {
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
      var item, state;
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
            for (item in ref) {
              state = ref[item];
              if (state === 'gotten') {
                results.push(m('p', ITEM_NAMES[item]));
              } else if (state === 'used') {
                results.push(m('p', {
                  style: {
                    textDecoration: 'line-through'
                  }
                }, ITEM_NAMES[item]));
              } else {
                results.push(void 0);
              }
            }
            return results;
          })(), m('button', {
            onclick: function() {
              if (confirm('Are you sure you want to restart the game? This will clear all progress and items you have achieved so far.')) {
                localStorage.clear();
                alert('Save game deleted');
                return window.location.href = '';
              }
            }
          }, 'Restart game')
        ], m('textarea', {
          style: {
            height: '300px',
            width: '100%',
            marginTop: '10px'
          }
        }, m.trust(engine.previousCommands.join('\n'))), m('textarea', {
          style: {
            height: '300px',
            width: '100%',
            marginTop: '10px'
          }
        }, m.trust(localStorage.getItem('progress')))), m('.content', {
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
};



},{"app/walevssharc":5,"mithril":6}],5:[function(require,module,exports){
"Conditions:\n    @matches(pattern)\n    @hasItem(item name)\n    @percentChance(chance out of 100)\n    @flagIs(flag name, value)\n\nResults:\n    @print(text)\n    @goToRoom(room name)\n    @setFlag(flag name, value)";
module.exports = function(engine) {
  var costumeMatches, helpText, removeAllCostumeItems;
  helpText = "Advance through the game by typing commands like <strong>look, get, and go.</strong><br>\nCommands catalogue and/or pre set command prefix buttons: <strong>Go, talk, get, look, use...</strong><br>\nLook in an area to gain more information or look at objects: <strong>(look fish)</strong><br>\nMove by typing go commands: <strong>(go east)</strong><br>\nEngage in philosophical debate: <strong>(talk sorceress)</strong><br>\nUse items in inventory: <strong>(use lightsaber)</strong><br>\nThere are other commands too and some you can just click on a button to use. Experiment and try things in this beautiful new world before you.<br>\nType <strong>\"help\"</strong> to see this menu again<br>";
  engine.setAlreadyGottenMessage('What are you crazy, why would you need more/another of that/those?');
  engine.setUniversalCommands(function() {
    var defaultResponses;
    if (this.matches('die')) {
      return this.print('What are you doing? You are dead now.');
    } else if (this.matches('get ye flask')) {
      return this.print('You can\'t get ye flask.');
    } else if (this.matches('win')) {
      return this.print('You did it. You win. Buy yourself a pizza because you are so clever.');
    } else if (this.matches('inv') || this.matches('inventory')) {
      if (Object.keys(this.getInventory()).length > 0) {
        return this.print('It tells you what is inventory right over there on the right side of the screen. Is typing this command really necessary?');
      } else {
        return this.print('Your inventory is empty you big dumb butt. Sorry, that was rude I meant to say, "You butt."');
      }
    } else if (this.matches('help')) {
      return this.print(helpText);
    } else if (this.matches('look cuttlefish') && this.hasItem('cuttlefish')) {
      return this.print('Aside from being really funny looking, highly intelligent and highly ugly, cuttlefish can also release an ink like substance to escape predators.');
    } else if (this.matches('look egg') && this.hasItem('egg')) {
      return this.print('This looks to be an ordinary egg. But remember, it was pulled out of Billy Ocean\'s glove box, so maybe not?');
    } else if (this.matches('look flowers') && this.hasItem('flowers')) {
      return this.print('These are some versatile looking flowers. So much so, you can sense a pun like aura surrounding them.');
    } else if (this.matches('look umbrella') && this.hasItem('umbrella')) {
      return this.print('This umbrella could provide a lot of shade. I don\'t see how it can fit in your pockets.');
    } else if (this.matches('look soda') && this.hasItem('soda')) {
      return this.print('It\'s a can of soda you found in the oven at Steak and Shake.');
    } else if (this.matches('look syrup') && this.hasItem('syrup')) {
      return this.print('A bag of maple flavored fountain syrup. It could have other uses too.');
    } else if (this.matches('look herring') && this.hasItem('herring')) {
      return this.print('It is a can of pickled herring you won on a gameshow. Way to go.');
    } else if (this.matches('look red herring') && this.hasItem('red herring')) {
      return this.print('It is a red herring.');
    } else if (this.matches('look margarine') && this.hasItem('margarine')) {
      return this.print('No Ifs, Ands or Butter vaguely margarine spread type product. Modeled by Lou Ferrigno.');
    } else if (this.matches('look badge') && this.hasItem('badge')) {
      return this.print('It\'s the junior marine sheriff badge sticker you got at the Water World gift shop. In a poorly lit room, one might mistake this for an authentic junior marine sheriff badge.');
    } else if (this.matches('look pancakes') && this.hasItem('pancakes')) {
      return this.print('Mystical pancakes you made with an enchanted recipe and totally not the correct ingredients, remember? That was UH-may-zing! Take them to Wale and hurry.');
    } else if (this.matches('look milk') && this.hasItem('milk')) {
      return this.print('Whole milk, apparently from a real sea cow. Is it still okay to call them that?');
    } else if (this.matches('look quadratic eye') && this.hasItem('quadratic eye')) {
      return this.print('???');
    } else if (this.matches('look cowboy hat') && this.hasItem('cowboy hat')) {
      return this.print('Nice hat, pilgrim.');
    } else if (this.matches('look rainbow wig') && this.hasItem('rainbow wig')) {
      return this.print('There should be laws against this kind of thing.');
    } else if (this.matches('look motorcycle helmet') && this.hasItem('motorcycle helmet')) {
      return this.print('It is the kind with the full visor so you could just be the stunt double.');
    } else if (this.matches('look stovepipe hat') && this.hasItem('stovepipe hat')) {
      return this.print('Four score and seven years ago...');
    } else if (this.matches('look leather jacket') && this.hasItem('leather jacket')) {
      return this.print('Members only.');
    } else if (this.matches('look clownsuit') && this.hasItem('clownsuit')) {
      return this.print('This should scare the kids.');
    } else if (this.matches('look old timey suit') && this.hasItem('old timey suit')) {
      return this.print('You feel like some serious fried chicken, and you don’t even know what that is.');
    } else if (this.matches('look cowprint vest') && this.hasItem('cowprint vest')) {
      return this.print('Very Toy Story.');
    } else if (this.matches('look fake beard') && this.hasItem('fake beard')) {
      return this.print('You feel like complaining about kids on your lawn and how you don\'t even know what a twitter is.');
    } else if (this.matches('look gun belt') && this.hasItem('gun belt')) {
      return this.print('A trusty six shooter.');
    } else if (this.matches('look metal chain') && this.hasItem('metal chain')) {
      return this.print('A chain is only as strong as-- wait, wrong show.');
    } else if (this.matches('look rubber chicken') && this.hasItem('rubber chicken')) {
      return this.print('Sorry, no pulley in it.');
    } else if (this.matches('look')) {
      return this.print('I am not authorized to tell you about that yet. Stop trying to cheat man!');
    } else if (this.matches('take')) {
      return this.print('I am not authorized to give that to you.');
    } else if (this.matches('talk')) {
      return this.print('Who are you talking to?');
    } else {
      defaultResponses = ['What are you even trying to do?  Just stop.', 'Good one man.', 'Whoa there Eager McBeaver!', 'Don\'t do that.', 'Gross, no way.'];
      return this.print(defaultResponses[Math.floor(Math.random() * defaultResponses.length)]);
    }
  });
  engine.setAfterCommand(function() {
    if (!this.flagIs('have_all_items', true) && this.hasItem('egg') && this.hasItem('flowers') && this.hasItem('soda') && this.hasItem('syrup') && this.hasItem('milk') && this.hasItem('margarine')) {
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
    if (this.exactlyMatches('__enter_room__') && this.isFirstTimeEntering()) {
      return this.print('Welcome to Wale vs Sharc: The Video Game. You are Sharc and your $23 shampoo is missing. You suspect foul play. Obvious exits are North to your friend Wale.');
    } else if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('This is quite possibly the most uninteresting cube of water in the ocean.');
    } else if (this.matches('north')) {
      return this.goToRoom('Wale');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Wale', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      if (this.isFirstTimeEntering()) {
        return this.print('Hey, it is your friend, Wale. He is doing that thing where he has his eyes closed and acts like he did not notice your arrival. He is kind of a prick, but also your friend. What can you do? Obvious exits are Ocean to the south, a school of Cuttlefish to the west, more Ocean to the north, and Billy Ocean to the east.');
      } else {
        return this.print('Wale is still just floating there trying to be enigmatic, would he even notice if you said something? Obvious exits are Ocean to the south, a school of Cuttlefish to the west, more Ocean to the north, and Billy Ocean to the east.');
      }
    } else if (this.matches('look wale')) {
      return this.print('He is just floating there, eyes closed, trying to shut out this earthly realm.');
    } else if (this.matches('give pancakes')) {
      if (this.hasItem('pancakes')) {
        this.print('"Hey Wale," you call out as intrusively as possible, "I got your--" Before you could finish your sentence, your blubbery friend has snatched the plate away and, in a most undignified manner, begins mowing through the fried discs you so artfully prepared. "Soul searching takes a lot of energy," he explains between bites. "I haven\'t eaten anything all day."');
        return this.wait((function(_this) {
          return function() {
            _this.print('Once finished, Wale straightens himself out, looking a mite embarrassed for the savage display he just put on. "What was it you needed?" "Oh Wale, it\'s terrible. I think my $23 shampoo was stolen and the ghost of my not really dead friend says the fate of the world hangs in the balance."');
            return _this.wait(function() {
              _this.print('"I see," says Wale, his voice and manner remaining unchanged despite the threat of the world unbalancing. "Sharc, I fear the worst. You must summon the ethereal door."');
              return _this.wait(function() {
                _this.print('"No, Wale," you say, "you made me swear a thousand vows never to bring that cursed relic back among us." "I know what I said, but I also knew there would come a time when we would have no other choice."  You should probably summon the door.');
                _this.removeItem('pancakes');
                return _this.setFlag('given_pancakes', true);
              });
            });
          };
        })(this));
      }
    } else if (this.matches('summon door') && this.flagIs('given_pancakes', true)) {
      this.print('You, finally convinced of your urgency and utter desperation, perform some intricate rites and incantations that would be really cool if you could see them, but I guess you will just have to use your imaginations. Text only fools!  The ethereal door stands open before you.');
      return this.setFlag('summoned_door', true);
    } else if (this.matches('enter door') && this.flagIs('summoned_door', true)) {
      return this.goToRoom('The Ethereal Realm');
    } else if (this.matches('talk wale')) {
      if (!this.flagIs('talked_to_wale', true)) {
        this.print('Wale is trying to meditate or something pretentious that you don\'t care about. You have something important! "Wale" you shout, "I need your help! The condition of my magnificent scalp is at stake."');
        return this.wait((function(_this) {
          return function() {
            _this.print('Wale sighs a heavy, labored sigh. "Sharc, you have disturbed my journey to my innermost being. Before I can help you, reparations must be made. You must make me a healthy serving of pancakes: whole wheat, with all natural maple syrup. Now leave me as I peel back the layers of the self and ponder the lesson of the cherry blossom.');
            return _this.setFlag('talked_to_wale', true);
          };
        })(this));
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      if (this.isFirstTimeEntering()) {
        return this.print('This is just some ocean you found. It does feel a little bit wetter than the rest of the ocean though. Also, did it just get warmer? Obvious exits are a garden to the west, Wale in the south, and a gameshow east.');
      } else {
        return this.print('Just another solid 10 cubic feet of ocean. Obvious exits are a garden to the west, Wale in the south, and a gameshow east.');
      }
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      if (!this.hasItem('cuttlefish')) {
        return this.print('Look, there be some cuttlefish, though they do not look too cuddly. Steak and Shake is to the west, Achtipus\'s garden to the north, and Wale to the east.');
      } else {
        return this.print('There used to be cuttlefish here but you scared them away with your aggressive affections. Keep that stuff inside man! Steak and Shake is to the west, Achtipus\'s garden to the north, and Wale to the east.');
      }
    } else if (this.matches('cuddle cuttlefish')) {
      if (!this.hasItem('cuttlefish')) {
        this.print('You are feeling affectionate today and you just got dumped so why not? You jump some of the cuttlefish and start snuggling and cuddling. The cuttlefish are not amused though, and say they are tired of fish making that mistake. They all swim away except for one that has attached its suckers to your mid region. You don\'t seem to mind.');
        return this.getItem('cuttlefish');
      } else {
        return this.print('They are cuddled out.');
      }
    } else if (this.matches('look cuttlefish')) {
      return this.print('Oh, cuttlefish, those are freaky.');
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
    if (this.exactlyMatches('__enter_room__') && !this.flagIs('watched_billy_video', true)) {
      window.open('https://www.youtube.com/watch?v=zNgcYGgtf8M', '_blank');
    }
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      if (!this.flagIs('drove_billy_to_hospital', true)) {
        return this.print('Suddenly, appearing before your eyes is singer-songwriter and former Caribbean king: Billy Ocean. Also Billy Ocean\'s car. Obvious exits are West to Wale and North to some kind of game show.');
      } else {
        return this.print('Billy Ocean is out of the hospital. He appreciates what you did for him and says, "When the going gets tough, the tough escape from the insanity ward." Obvious exits are West to Wale and North to some kind of game show.');
      }
    } else if (this.matches('talk')) {
      if (!this.flagIs('drove_billy_to_hospital', true)) {
        return this.print('He wants you to get into his car and drive him to the hospital. He just drove through the car wash with the top down after dropping some acid.');
      } else {
        return this.print('"When the going gets tough, the tough escape from the insanity ward."');
      }
    } else if (this.matches('look car')) {
      return this.print('That is definitely a car.');
    } else if (this.matches('look hospital')) {
      return this.print('The hospital looms in the distance. It doesn\'t seem all that far away if you have a car.');
    } else if (this.matches('hospital') || this.matches('car')) {
      this.print('Sure, why not? You get in the driver\'s seat and find your way to the nearest medical treatment center. As thanks, Mr. Ocean pulls an egg out from his glove box. You accept and swim away as fast as possible. Good, I ran out of jokes for that fast.');
      this.setFlag('drove_billy_to_hospital', true);
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      if (this.comingFrom(['Achtipus\'s Garden (Inside)'])) {
        return this.print('You leave the garden. Obvious exits are west to the inside of the garden, north to Water World, east to some Ocean and south to a school of Cuttlefish.');
      } else if (this.isFirstTimeEntering()) {
        return this.print('Achtipus is working among his flowers and shrubs. He sees you and opens the gate for you. Obvious exits are west to the inside of the garden, north to Water World, east to some Ocean and south to a school of Cuttlefish.');
      } else {
        return this.print('Achtipus is still working hard in that garden. You need to get him a girlfriend, and then he needs to get YOU a girlfriend. Obvious exits are west to the inside of the garden, north to Water World, east to some Ocean and south to a school of Cuttlefish.');
      }
    } else if (this.matches('look achtipus')) {
      return this.print('It\'s Achtipus. He is pulling out the seaweeds from his sea cucumber bed.');
    } else if (this.matches('north')) {
      return this.goToRoom('Water World');
    } else if (this.matches('west') || this.matches('enter')) {
      return this.goToRoom('Achtipus\'s Garden (Inside)');
    } else if (this.matches('east')) {
      return this.goToRoom('Wetter Ocean');
    } else if (this.matches('south')) {
      return this.goToRoom('Cuttlefish');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Achtipus\'s Garden (Inside)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('You enter the garden and see a bountiful display unfold before you. The garden exit is East.');
    } else if (this.matches('talk')) {
      if (!this.flagIs('talked_to_achtipus', true)) {
        return this.print('"This is quite the um...ocean hideaway you have here," you say. "Yes," he says, "I can see you have come a long way to get here, but I am glad you have found refuge on my grounds. If you see anything you like in my plot we could make a deal perhaps."');
      } else {
        return this.print('Oh, back again Sharc? Can I interest you in any of the items in my fine garden?');
      }
    } else if (this.matches('look achtipus')) {
      return this.print('It\'s Achtipus. He is pulling out the seaweeds from his sea cucumber bed.');
    } else if (this.matches('look garden')) {
      return this.print('You see watermelons, water chestnuts, assorted flowers, sea cucumbers and strawberries.');
    } else if (this.matches('look watermelons') || this.matches('take watermelons')) {
      return this.print('You only eat seedless and these are the extra seed variety.');
    } else if (this.matches('look chestnuts') || this.matches('take chestnuts')) {
      return this.print('Water chestnuts? Is that even a thing?');
    } else if (this.matches('look cucumbers') || this.matches('take cucumbers')) {
      return this.print('Soak it in brine for a couple weeks, then come back to me.');
    } else if (this.matches('look strawberries') || this.matches('take strawberries') || this.matches('look strawberry') || this.matches('take strawberry')) {
      return this.print('You sense a surrealistic vibe coming from those strawberries.');
    } else if (this.matches('look flowers')) {
      return this.print('You spend too much time at the gym and the firing range to appreciate flowers.');
    } else if (this.matches('take flowers')) {
      if (!this.flagIs('given_umbrella', true)) {
        return this.print('"I can see you like the flowers. I will let you have them if you can find something to keep it from getting so hot here. I would be able to do twice as much work if it were a bit cooler."');
      } else {
        this.print('"You have great taste. These flowers are really versatile and will be good just about anywhere."');
        return this.getItem('flowers');
      }
    } else if (this.matches('give umbrella')) {
      this.print('"This will be perfect for blocking out that sun’s harsh rays. Thanks!"');
      this.removeItem('umbrella');
      return this.setFlag('given_umbrella', true);
    } else if (this.matches('east') || this.matches('exit')) {
      return this.goToRoom('Achtipus\'s Garden');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake', function() {
    if (this.exactlyMatches('__enter_room__')) {
      if (this.isFirstTimeEntering()) {
        return this.print('You swim up to the ruins of your old work place. This place has seen better days. Your mind is flooded with memories of floating in front of the old grill and coming up with new recipes to try when your manager had his back turned. Then someone said "Ever tried an M-80 burger? I have enough for everyone." The words echo in your mind like a phantom whisper of ages past. Cuttlefish stomping grounds lie east.');
      } else {
        return this.print('What is left of the Steak and Shake building you used to work at before your friend exploded it trying to make firework sandwiches. Cuttlefish stomping grounds lie east.');
      }
    } else if (this.exactlyMatches('look')) {
      return this.print("It's the ruins of the old Steak and Shake you used to work at until your friend blew it up. The tattered remnants of a red and white awning flutters in the wind as if to surrender to an enemy. What is left of a door hangs on a single hinge to the west. Cuttlefish stomping grounds lie east.");
    } else if (this.matches('look steak') || this.matches('look shake') || this.matches('look building')) {
      return this.print('Your memories of this place don\'t quite match what it is now.');
    } else if (this.matches('west') || this.matches('open door') || this.matches('enter') || this.matches('in')) {
      return this.goToRoom('Steak and Shake (Doorway)');
    } else if (this.matches('east')) {
      return this.goToRoom('Cuttlefish');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Doorway)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      if (this.isFirstTimeEntering()) {
        return this.print('As you approach, the door falls clean off as if to warn you against entry. Never being one for omens, you ignore it. Inside you discover things much as you remember them. That is, if they had been mauled by a bear with blenders for hands who proceeded to set off a series of plastic explosives. To the south there are some tables and chairs, north lies the kitchen, and west a soda fountain. The outdoors is East.');
      } else {
        return this.print('There are some battered tables and chairs south, a kitchen north, and a soda fountain west. You can exit East.');
      }
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('A dilapidated dining area lies before you. It is completely unremarkable. There is nowhere to go besides north to the way you came.');
    } else if (this.matches('north')) {
      return this.goToRoom('Steak and Shake (Doorway)');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Kitchen)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('Welcome to the kitchen. Since the walls have all been blown away or dissolved, the only thing that separates it from the rest of the place is the oven and stove top. South leads back to the main entry area. South goes back to the doorway.');
    } else if (this.matches('look oven') || this.matches('open oven')) {
      if (!this.hasItem('soda')) {
        return this.print('Check it out, it\'s your favorite pop, a Cherry Orange Snozzberry Lime Passionfruit Vanilla Croak in the oven. Who ever thought of baking a can of soda? South leads back to the main entry area.');
      } else {
        return this.print('The oven is empty.');
      }
    } else if (this.matches('close oven')) {
      return this.print('How responsible of you.');
    } else if (this.matches('take soda')) {
      this.print('You got soda.');
      return this.getItem('soda');
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('In an urn take but not churn items two not like goo.');
    } else if (this.matches('soda') && this.hasItem('soda')) {
      this.print('You put the soda into the bowl.');
      this.removeItem('soda');
      this.print('Hey it looks like that worked!');
      return this.wait((function(_this) {
        return function() {
          if (!_this.hasItem('flowers')) {
            return _this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of powder sitting there)');
          } else {
            return _this.print('It looks like something is still missing.');
          }
        };
      })(this));
    } else if (this.matches('flowers') && this.hasItem('flowers')) {
      this.print('You put the flour into the bowl.');
      this.removeItem('flowers');
      this.print('Hey it looks like that worked!');
      return this.wait((function(_this) {
        return function() {
          if (!_this.hasItem('soda')) {
            return _this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of powder sitting there)');
          } else {
            return _this.print('It looks like something is still missing.');
          }
        };
      })(this));
    } else if (this.matches('soda flowers') && this.hasItem('soda') && this.hasItem('flowers')) {
      this.removeItem('flowers');
      this.removeItem('soda');
      this.print('Hey it looks like that worked!');
      return this.wait((function(_this) {
        return function() {
          return _this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of powder sitting there)');
        };
      })(this));
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with bowl of powder sitting there)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('Your potion is dry. This willst not fly. What\'s next must be dumped, poured and cracked for a proper flapjack.');
    } else if (this.matches('milk egg') || this.matches('milk margarine') || this.matches('egg margarine')) {
      return this.print('Slow down there partner, I can only handle so many things at once. Tell them to me one at a time please.');
    } else if (this.matches('milk') && this.hasItem('milk')) {
      this.print('You put the milk into the bowl.');
      this.removeItem('milk');
      this.print('Hey it looks like that worked!');
      return this.wait((function(_this) {
        return function() {
          if ((!_this.hasItem('egg')) && (!_this.hasItem('margarine'))) {
            return _this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)');
          } else {
            return _this.print('It looks like something is still missing.');
          }
        };
      })(this));
    } else if (this.matches('margarine') && this.hasItem('margarine')) {
      this.removeItem('margarine');
      this.print('Hey it looks like that worked!');
      return this.wait((function(_this) {
        return function() {
          if ((!_this.hasItem('milk')) && (!_this.hasItem('egg'))) {
            return _this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)');
          } else {
            return _this.print('It looks like something is still missing.');
          }
        };
      })(this));
    } else if (this.matches('egg') && this.hasItem('egg')) {
      this.removeItem('egg');
      this.print('Hey it looks like that worked!');
      return this.wait((function(_this) {
        return function() {
          if ((!_this.hasItem('milk')) && (!_this.hasItem('margarine'))) {
            return _this.goToRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)');
          } else {
            return _this.print('It looks like something is still missing.');
          }
        };
      })(this));
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('You see that the soda fountain has somehow remained largely undamaged. You think back to the days when you would sneak out bags of plain syrup to drink and the freakish waking dreams it would induce in you. You wonder if there is any still in there. The East door goes back to the main area.');
    } else if (this.matches('look fountain') || this.matches('open fountain') || this.matches('look soda') || this.matches('open soda')) {
      if (!this.hasItem('syrup')) {
        return this.print('Avast, a hidden treasure trove of sugary wonder that has lain dormant all these years! You tremble at the beauty of the sight before you. So many bags and yet your magic hammerspace satchel will only allow for one. There\'s Spritz, Professor Ginger, Cactus Lager, and Ms. Shim Sham\'s Maple Soda.');
      } else {
        return this.print('It\'s that soft drink dispenser you got a bag of syrup from.');
      }
    } else if (!this.hasItem('syrup')) {
      if (this.matches('take spritz') || this.matches('look spritz')) {
        return this.print('Spritz, A refreshing blast of pickle and celery? No way.');
      } else if (this.matches('take professor') || this.matches('take ginger') || this.matches('look professor') || this.matches('look ginger')) {
        return this.print('Professor ginger, 72 flavors and all of them make me long for a quick death. Nope nope nope.');
      } else if (this.matches('take cactus') || this.matches('take lager') || this.matches('look cactus') || this.matches('look lager')) {
        return this.print('Cactus lager, You think you see some needles floating in there. Come on man.');
      } else if (this.matches('look maple') || this.matches('look shim') || this.matches('look sham') || this.matches('look ms')) {
        return this.print('Yum yum soda this ones looks tasty.');
      } else if (this.matches('take maple') || this.matches('take shim') || this.matches('take sham') || this.matches('take ms')) {
        this.print('You find it shocking that you are the first raider of this soda tomb. But then again, you have always said people don\'t know the value of a bag of liquid sugar.');
        return this.getItem('syrup');
      }
    } else if (this.matches('take') || this.matches('look')) {
      return this.print('Yup there is a lot of soda in there, but you already picked one. Now go live with your choice.');
    } else if (this.matches('east')) {
      return this.goToRoom('Steak and Shake (Doorway)');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Seal or No Seal', function() {
    if (this.exactlyMatches('__enter_room__')) {
      if (this.isFirstTimeEntering()) {
        return this.print('You just walked onto the set of the wildly popular game show, "Seal or No Seal!" Where flamboyant contestants flail around and shout while trying to arrive at the answer to that age old question...SEAL OR NO SEAL? To the east is backstage, north will take you to the dressing room, west to some ocean, and south to Billy Ocean.');
      } else {
        return this.print('You are on the set for Seal or no Seal, the game show. You just realized you must find a way to become a contestant or your life will have been wasted. To the east is backstage, north will take you to the dressing room, west to some ocean, and south to Billy Ocean.');
      }
    } else if (this.exactlyMatches('look')) {
      return this.print('Oh wow! Seal or no Seal! You love it when the host looks right at the camera and says that. It’s so intense. There has to be some way to get on this show. To the east is backstage, north will take you to the dressing room, west to some ocean, and south to Billy Ocean.');
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('This place is great! It would be easy to cobble together a costume to get on that show. Lets see what we can find. Obvious exits are south to the show entrance.');
    } else if (this.matches('south')) {
      return this.goToRoom('Seal or No Seal');
    } else if (this.matches('costume')) {
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Headgear)');
    }
  });
  engine.addRoom('Seal or No Seal (Dressing Room - Pick Headgear)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('Let\'s start with headgear. You see a cowboy hat, a rainbow wig, a motorcycle helmet, and a stovepipe hat.');
    } else if (this.matches('cowboy hat')) {
      this.getItem('cowboy hat');
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Clothes)');
    } else if (this.matches('rainbow wig')) {
      this.getItem('rainbow wig');
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Clothes)');
    } else if (this.matches('motorcycle helmet')) {
      this.getItem('motorcycle helmet');
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Clothes)');
    } else if (this.matches('stovepipe hat')) {
      this.getItem('stovepipe hat');
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Clothes)');
    }
  });
  engine.addRoom('Seal or No Seal (Dressing Room - Pick Clothes)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('Now select a set of clothes. You see a cow print vest, a clown suit, a leather jacket, and an oldtimey suit with one of those Colonel Sanders ties');
    } else if (this.matches('leather jacket')) {
      this.getItem('leather jacket');
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Accessory)');
    } else if (this.matches('clown suit')) {
      this.getItem('clown suit');
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Accessory)');
    } else if (this.matches('oldtimey suit')) {
      this.getItem('oldtimey suit');
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Accessory)');
    } else if (this.matches('cow vest') || this.matches('print vest')) {
      this.getItem('cow print vest');
      return this.goToRoom('Seal or No Seal (Dressing Room - Pick Accessory)');
    }
  });
  engine.addRoom('Seal or No Seal (Dressing Room - Pick Accessory)', function() {
    var done;
    done = 'You look absolutely horrible! Or amazing, depending on your perspective. But the true judge will be the game show manager.';
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('Accessorize! Pick from a gun belt, a rubber chicken, a metal chain, and a fake beard.');
    } else if (this.matches('fake beard')) {
      this.getItem('fake beard');
      this.print(done);
      return this.wait((function(_this) {
        return function() {
          return _this.goToRoom('Seal or No Seal (Backstage)');
        };
      })(this));
    } else if (this.matches('gun belt')) {
      this.getItem('gun belt');
      this.print(done);
      return this.wait((function(_this) {
        return function() {
          return _this.goToRoom('Seal or No Seal (Backstage)');
        };
      })(this));
    } else if (this.matches('metal chain')) {
      this.getItem('metal chain');
      this.print(done);
      return this.wait((function(_this) {
        return function() {
          return _this.goToRoom('Seal or No Seal (Backstage)');
        };
      })(this));
    } else if (this.matches('rubber chicken')) {
      this.getItem('rubber chicken');
      this.print(done);
      return this.wait((function(_this) {
        return function() {
          return _this.goToRoom('Seal or No Seal (Backstage)');
        };
      })(this));
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
    if (engine.hasItem('cow print vest')) {
      group1++;
    }
    if (engine.hasItem('gun belt')) {
      group1++;
    }
    if (engine.hasItem('rainbow wig')) {
      group2++;
    }
    if (engine.hasItem('clown suit')) {
      group2++;
    }
    if (engine.hasItem('rubber chicken')) {
      group2++;
    }
    if (engine.hasItem('motorcycle helmet')) {
      group3++;
    }
    if (engine.hasItem('leather jacket')) {
      group3++;
    }
    if (engine.hasItem('metal chain')) {
      group3++;
    }
    if (engine.hasItem('stovepipe hat')) {
      group4++;
    }
    if (engine.hasItem('oldtimey suit')) {
      group4++;
    }
    if (engine.hasItem('fake beard')) {
      group4++;
    }
    return Math.max(group1, group2, group3, group4);
  };
  removeAllCostumeItems = function(engine) {
    engine.removeItem('cowboy hat');
    engine.removeItem('rainbow wig');
    engine.removeItem('motorcycle helmet');
    engine.removeItem('stovepipe hat');
    engine.removeItem('cow print vest');
    engine.removeItem('clown suit');
    engine.removeItem('leather jacket');
    engine.removeItem('oldtimey suit');
    engine.removeItem('gun belt');
    engine.removeItem('rubber chicken');
    engine.removeItem('metal chain');
    return engine.removeItem('fake beard');
  };
  engine.addRoom('Seal or No Seal (Backstage)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
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
          this.print('"Oh, wow!" Exclaims the show manager. "You look absolutely awful. You definitely have the look for our show." You start to dance around, whooping and hollering, declaring yourself the future king of the world. "And I see you have the charisma to match." He turns to his assistant, "Get this fella on stage at once.');
          return this.wait((function(_this) {
            return function() {
              return _this.goToRoom('Seal or No Seal (On Stage!)');
            };
          })(this));
      }
    } else if (this.matches('west')) {
      return this.goToRoom('Seal or No Seal');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Seal or No Seal (On Stage!)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('"Welcome back to the Seal or No Seal, the most popular game show under the sea! I\'m your well tanned host Jerry Zintervanderbinderbauer Jr. Let\'s meet our next contestant: Sharc! An incredibly obnoxious yet persuasive young ocean dweller, he loves annoying his friends and is always up for a round of Scrabble, LADIES. Time to get started. Now, Sharc I am going to present you with a briefcase. In this briefcase, there might be a seal or there might not be a seal. And I need you to tell me which it is: SEAL or NO SEAL?"');
    } else if (this.matches('seal')) {
      this.print('Jerry slowly opens the briefcase, peeking inside first to detect any signs of seal entrails and then...');
      return this.wait((function(_this) {
        return function() {
          if (_this.percentChance(50)) {
            _this.print('...wearing a face of practiced disappointment and empathy, whimpers "Too bad," letting the case open the rest of the way. At this, you are promptly ushered off the stage to make way for the next sucker.');
            return _this.wait(function() {
              removeAllCostumeItems(_this);
              return _this.goToRoom('Seal or No Seal (Backstage)');
            });
          } else {
            _this.print('...excitedly pulls it all the way open. "He\'s right people!"');
            return _this.wait(function() {
              _this.print('"Now, let\'s see your prizes." "Prizes is right Jerry," says a voice coming from nowhere and everywhere all at once. "Here are some world class selections I picked up from the grocery store on the way here this morning:"');
              return _this.wait(function() {
                _this.print('"Success comes in cans, not in can nots. Tin cans that is! That\'s why we are offering you the choice of a full week\'s supply of \'Captain Ned\'s Pickled Herring\', or \'No Ifs Ands or Butter\' brand margarine spread type product for your consumption pleasure.  Naturally you choose the margarine because you are health conscious or something.');
                return _this.wait(function() {
                  removeAllCostumeItems(_this);
                  _this.getItem('margarine');
                  return _this.goToRoom('Seal or No Seal (Backstage)');
                });
              });
            });
          }
        };
      })(this));
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Water World', function() {
    if (this.exactlyMatches('__enter_room__')) {
      if (this.comingFrom(['Water World (Manatee Exhibit)', 'Water World (Gift Shop)'])) {
        return this.print('You are back at the Water World gate. The exit is right over there! Just a little bit further and you can leave. Please can we leave now?');
      } else if (this.isFirstTimeEntering()) {
        return this.print('Oh man, Water World! You love that movie. Kevin Costner should have totally gotten the Oscar. Wait this isn\'t like that. This is Water World, the home of that stupid killer whale, Shampu. What a hack! Obvious exits are north to the Manatee show, east to the gift shop, and south to the Achtipus\'s garden.');
      } else {
        return this.print('Oh great, Water World again. You were hoping once would be enough to last you a lifetime. Obvious exits are north to the Manatee show, east to the gift shop, and south to the Achtipus\'s garden.');
      }
    } else if (this.exactlyMatches('look')) {
      return this.print('Well, this is it the Water World entrance where all your marine dreams and nightmares come true. Obvious exits are north to the Manatee show, east to the gift shop, and south to the Achtipus\'s garden.');
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
    if (this.exactlyMatches('__enter_room__')) {
      if (this.isFirstTimeEntering()) {
        return this.print('And there it is: The illustrious manatee. You can see why the stands are empty. There are big umbrellas attached to some picnic tables; not much to see. Obvious exits are west to the Manatee service room and south to the park entrance.');
      } else {
        return this.print('Well, the manatee exhibit is still a dump. A bunch of tourist families are devouring their food at some tables with umbrellas. Obvious exits are west to the Manatee service room and south to the park entrance.');
      }
    } else if (this.exactlyMatches('look')) {
      return this.print('There is big wooden arch display with lots of peeling paint surrounded by your standard semicircle stone seating arrangement. Some picnic tables with umbrellas are nearby. Obvious exits are west to the Manatee service room and south to the park entrance.');
    } else if (this.matches('look umbrella')) {
      return this.print('What, you have never seen an umbrella? They are red and white and covered in algae.');
    } else if (this.matches('take umbrella')) {
      this.getItem('umbrella');
      return this.print('You stealthily approach an empty table and shove its umbrella under your fin and stumble away. Everyone looks at you like this happens a lot.');
    } else if (this.matches('west')) {
      return this.goToRoom('Water World (Mechanical Room Type Place)');
    } else if (this.matches('south')) {
      return this.goToRoom('Water World');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Water World (Gift Shop)', function() {
    if (this.exactlyMatches('__enter_room__')) {
      return this.print('You enter the Water World gift shop. There are all sorts of great items here: a giant stuffed octopus, dehydrated astronaut fish food, junior marine sheriff badge stickers, and some of that clay sand crap they used to advertise on TV. See anything you like? West to the park entrance.');
    } else if (this.exactlyMatches('look')) {
      return this.print('There are all sorts of great items here: a giant stuffed octopus, dehydrated astronaut fish food, junior marine sheriff badge stickers, and some of that clay sand crap they used to advertise on TV. See anything you like? West to the park entrance.');
    } else if (this.matches('look octopus')) {
      return this.print('Usually you have to knock over a stack of old milk bottles to get stuffed animals of this quality.');
    } else if (this.matches('look sand')) {
      return this.print('Wow, you remember this stuff. It says on the box its the only-stay-dry sand crap used by Shampu himself.');
    } else if (this.matches('look badges')) {
      return this.print('Cool! And you don’t even have to complete any classes in junior marine sheriff school.');
    } else if (this.matches('look fish') || this.matches('look food')) {
      return this.print('They have kelp, krill, algae, and ice cream flavors.');
    } else if (this.matches('take badge')) {
      this.getItem('badge');
      return this.print('You take the junior marine sheriff badge stickers to the counter. The cashier says they are on sale, only 15 fish dollars, plus tax. Yussss. You pay the man.');
    } else if (this.matches('take')) {
      return this.print('You take that item to the counter. The cashier says it is ' + (18 + Math.floor(Math.random() * 30)).toString() + (" fish dollars but you only have " + (this.hasItem('badge') ? 2 : 17) + " fish dollars. Nuts."));
    } else if (this.matches('west')) {
      return this.goToRoom('Water World');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('Water World (Mechanical Room Type Place)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      if (this.isFirstTimeEntering()) {
        return this.print('What in the name of Captain Nemo is this? There are manatees in hoists all over the room hooked up to...milking devices. This is no mechanical room! It\'s a cover for a secret, illegal, underground, black market, but probably organic, sea cow milking operation. The fiends! You are going to blow the lid off this thing for sure. The sweaty old fish running the machinery has not noticed you yet. Obvious exits are east to the manatee exhibit.');
      } else if (!this.hasItem('badge')) {
        return this.print('That sweaty old fish is still going at it with his manatee milking. You wonder if there is any kind of authority he would bow to. Obvious exits are east to the manatee exhibit.');
      } else if (!this.hasItem('milk')) {
        return this.print('That sweaty old fish is still going at it with his manatee milking. You feel just a fragment of guilt for not turning him in. Obvious exits are east to the manatee exhibit.');
      } else {
        return this.print('There doesn\'t seem to be anything you can do to put a stop to this horrible sight. At least you got something out of it though. Obvious exits are east to the manatee exhibit.');
      }
    } else if (this.exactlyMatches('look')) {
      return this.print('Manatees from the exhibit are all over in hoists rigged up to milking equipment. It\'s illegal, but you have heard there is a fortune in genuine sea cow milk. That nasty old fish there is running the whole thing.');
    } else if (this.matches('talk') || this.matches('badge') || this.matches('sticker')) {
      if (!this.hasItem('badge')) {
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
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('You have entered The Ethereal Realm. Why did you do that? That was a bad decision. Wale is at your side. There are a bunch of weird, spacey platforms and junk floating around in a cosmic void -- your typical surrealist dreamscape environment. Ahead is an ugly monster. He is clutching something in his hand. Obvious exits are NONE! This is the world of waking nightmares you dingus.');
    } else if (this.matches('talk monster')) {
      this.print('You are getting worse at this game. You approach said monster in an effort to get some leads on your precious hair product. Maybe it would have been a better idea to start by just asking him about the status of the local basketball team or something?');
      return this.wait((function(_this) {
        return function() {
          _this.print('On closer examination though, you realize this is not just any monster. It is a Torumekian hyper goblin. And in his grisly paw rests the item of your quest: your $23 shampoo!');
          return _this.wait(function() {
            _this.print('"Sharc, we can not allow him to use that shampoo," whispers your companion. "On the head of a hyper goblin, hair that smooth could mean the end of fashion as we know it. We must retrieve it by any means necessary."');
            return _this.wait(function() {
              _this.print('No sooner have the words left Wale\'s lips than you are spotted. That is all the motivation this beast needs. He flips the cap on the bottle, raising it to the filthy, string-like mop you can only assume must be his hair, all the while gazing down at you in defiance with his single blood shot eye.');
              return _this.wait(function() {
                return _this.goToRoom('The Ethereal Realm (Do something!)');
              });
            });
          });
        };
      })(this));
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('The Ethereal Realm (Do something!)', function() {
    if (this.exactlyMatches('__enter_room__') || this.exactlyMatches('look')) {
      return this.print('Do something!');
    } else if (this.exactlyMatches('something')) {
      return this.print('Oh very funny.  Now is definitely not the time for snark.');
    } else if (this.matches('attack')) {
      this.print('You start to lunge towards the creature, but Wale pushes you out of the way in a charge himself. You cringe as you hear the slashing of flesh. Red mist floats out of Wale\'s side. Your head is spinning.');
      return this.wait((function(_this) {
        return function() {
          _this.print('"Now Sharc!", he wheezes, "Use the power of the Quadratic Eye."');
          return _this.wait(function() {
            _this.print('"But you said I wasn\'t ready!" you cry, trying not to look at the sorry state of your friend.');
            return _this.wait(function() {
              _this.print('"No, it was I who was not ready. The p-power has always been within y-you."');
              return _this.wait(function() {
                _this.getItem('quadratic eye');
                return _this.goToRoom('The Ethereal Realm (Use the Quadratic Eye!)');
              });
            });
          });
        };
      })(this));
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('The Ethereal Realm (Use the Quadratic Eye!)', function() {
    if (this.matches('use quadratic eye')) {
      this.removeItem('quadratic eye');
      return this.goToRoom('End');
    } else {
      return this.tryUniversalCommands();
    }
  });
  engine.addRoom('End', function() {
    if (this.exactlyMatches('__enter_room__')) {
      return this.print('You remove the Quadratic Eye from its compartment, close your eyes and allow union between your spirit and the universal chi flow. Then the goblin gets cut in half and you get your shampoo back.');
    }
  });
  return engine.setStartRoom('Wale vs Sharc: The Comic: The Interactive Software Title For Your Computer Box');
};



},{}],6:[function(require,module,exports){
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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kdmNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9hcHAvZW5naW5lLmNvZmZlZSIsIi9ob21lL2R2Y29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9tYWluLmNvZmZlZSIsIi9ob21lL2R2Y29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9zeW5vbnltcy5jb2ZmZWUiLCIvaG9tZS9kdmNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9ub2RlX21vZHVsZXMvYXBwL3ZpZXcuY29mZmVlIiwiL2hvbWUvZHZjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC93YWxldnNzaGFyYy5jb2ZmZWUiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxtQkFBQTtFQUFBOztBQUFBLFdBQUEsR0FBYyxPQUFBLENBQVEsWUFBUjs7QUFHZCxNQUFNLENBQUMsT0FBUCxHQUF1QjtFQUNOLGdCQUFBO0lBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUNULElBQUMsQ0FBQSxpQkFBRCxHQUFxQixTQUFBLEdBQUE7SUFDckIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsU0FBQSxHQUFBO0lBRWhCLElBQUMsQ0FBQSxTQUFELEdBQWE7SUFDYixJQUFDLENBQUEsZUFBRCxHQUFtQjtJQUNuQixJQUFDLENBQUEsS0FBRCxHQUFTO0lBQ1QsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFFaEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFDaEIsSUFBQyxDQUFBLFdBQUQsR0FBZTtJQUNmLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFFWCxJQUFDLENBQUEsU0FBRCxHQUFhO0lBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQUNiLElBQUMsQ0FBQSxRQUFE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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJzeW5vbnltRGF0YSA9IHJlcXVpcmUoJy4vc3lub255bXMnKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRW5naW5lXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEByb29tcyA9IHt9XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcyA9IC0+XG4gICAgICAgIEBhZnRlckNvbW1hbmQgPSAtPlxuXG4gICAgICAgIEBpbnZlbnRvcnkgPSB7fVxuICAgICAgICBAY3VycmVudFJvb21OYW1lID0gJydcbiAgICAgICAgQGZsYWdzID0ge31cbiAgICAgICAgQHJvb21zRW50ZXJlZCA9IHt9XG5cbiAgICAgICAgQGNvbW1hbmRXb3JkcyA9IFtdXG4gICAgICAgIEBjb21tYW5kVGV4dCA9ICcnXG4gICAgICAgIEBtZXNzYWdlID0gJydcblxuICAgICAgICBAY2FsbGJhY2tzID0gW11cbiAgICAgICAgQHN0YXJ0Um9vbSA9ICcnXG4gICAgICAgIEBsYXN0Um9vbSA9ICcnXG5cbiAgICAgICAgQHdhaXRDYWxsYmFjayA9IG51bGxcbiAgICAgICAgQGFscmVhZHlHb3R0ZW5NZXNzYWdlID0gJydcblxuICAgICAgICBAcHJldmlvdXNDb21tYW5kcyA9IFtdXG5cbiAgICBzZXRTdGFydFJvb206IChyb29tTmFtZSkgLT5cbiAgICAgICAgQHN0YXJ0Um9vbSA9IHJvb21OYW1lXG5cbiAgICBzZXRBZnRlckNvbW1hbmQ6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQGFmdGVyQ29tbWFuZCA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIHNldEFscmVhZHlHb3R0ZW5NZXNzYWdlOiAobXNnKSAtPlxuICAgICAgICBAYWxyZWFkeUdvdHRlbk1lc3NhZ2UgPSBtc2dcblxuICAgIHNhdmU6IC0+XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtICdwcm9ncmVzcycsIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGludmVudG9yeTogQGludmVudG9yeVxuICAgICAgICAgICAgY3VycmVudFJvb21OYW1lOiBAY3VycmVudFJvb21OYW1lXG4gICAgICAgICAgICBwcmV2aW91c0NvbW1hbmRzOiBAcHJldmlvdXNDb21tYW5kc1xuICAgICAgICAgICAgZmxhZ3M6IEBmbGFnc1xuICAgICAgICAgICAgcm9vbXNFbnRlcmVkOiBAcm9vbXNFbnRlcmVkXG4gICAgICAgIH0pXG5cbiAgICBsb2FkOiAtPlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwcm9ncmVzcycpKVxuICAgICAgICAgICAgQGludmVudG9yeSA9IGRhdGEuaW52ZW50b3J5XG4gICAgICAgICAgICBAY3VycmVudFJvb21OYW1lID0gZGF0YS5jdXJyZW50Um9vbU5hbWVcbiAgICAgICAgICAgIEBwcmV2aW91c0NvbW1hbmRzID0gZGF0YS5wcmV2aW91c0NvbW1hbmRzIG9yIFtdXG4gICAgICAgICAgICBAZmxhZ3MgPSBkYXRhLmZsYWdzXG4gICAgICAgICAgICBAcm9vbXNFbnRlcmVkID0gZGF0YS5yb29tc0VudGVyZWRcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGNhdGNoXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBhZGRSb29tOiAocm9vbU5hbWUsIGNhbGxiYWNrKSAtPlxuICAgICAgICBAcm9vbXNbcm9vbU5hbWVdID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgZ2V0Q3VycmVudFJvb21OYW1lOiAtPiBAY3VycmVudFJvb21OYW1lXG5cbiAgICBnZXRDdXJyZW50TWVzc2FnZTogLT4gQG1lc3NhZ2VcblxuICAgIGdldEludmVudG9yeTogLT4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShAaW52ZW50b3J5KSlcblxuICAgIGRvQ29tbWFuZDogKEBjb21tYW5kVGV4dCkgLT5cblxuICAgICAgICBpZiBAd2FpdENhbGxiYWNrP1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBAd2FpdENhbGxiYWNrXG4gICAgICAgICAgICBAd2FpdENhbGxiYWNrID0gbnVsbFxuICAgICAgICAgICAgY2FsbGJhY2soKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgQGNvbW1hbmRUZXh0ID09ICcnIHRoZW4gcmV0dXJuXG5cbiAgICAgICAgQHByZXZpb3VzQ29tbWFuZHMucHVzaChAY29tbWFuZFRleHQpXG5cbiAgICAgICAgIyBjbGVhbiB1cCB0aGUgY29tbWFuZCB0ZXh0XG4gICAgICAgIEBjb21tYW5kVGV4dCA9ICcgJyArIEBjb21tYW5kVGV4dFxuICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXFcrL2csICcgJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHN7Mix9L2csICcgJykgKyAnICdcblxuICAgICAgICAjIGZpbmQgc3lub255bXMgYW5kIHJlcGxhY2UgdGhlbSB3aXRoIHRoZSBjYW5vbmljYWwgd29yZFxuICAgICAgICBmb3IgY2Fubm9uaWNhbFdvcmQsIHN5bm9ueW1zIG9mIHN5bm9ueW1EYXRhXG4gICAgICAgICAgICBmb3Igc3lub255bSBpbiBzeW5vbnltc1xuICAgICAgICAgICAgICAgIEBjb21tYW5kVGV4dCA9IEBjb21tYW5kVGV4dC5yZXBsYWNlKFwiICN7c3lub255bX0gXCIsIFwiICN7Y2Fubm9uaWNhbFdvcmR9IFwiKVxuXG4gICAgICAgIEBjb21tYW5kVGV4dCA9IEBjb21tYW5kVGV4dC50cmltKClcblxuICAgICAgICBAY29tbWFuZFdvcmRzID0gQGNvbW1hbmRUZXh0LnNwbGl0KCcgJylcblxuICAgICAgICBpZiAndGFrZScgaW4gQGNvbW1hbmRXb3Jkc1xuICAgICAgICAgICAgZm9yIHdvcmQgaW4gQGNvbW1hbmRXb3Jkc1xuICAgICAgICAgICAgICAgIGlmIEBoYXNJdGVtKHdvcmQpXG4gICAgICAgICAgICAgICAgICAgIEBwcmludChAYWxyZWFkeUdvdHRlbk1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEByb29tc1tAY3VycmVudFJvb21OYW1lXSgpXG4gICAgICAgIEBhZnRlckNvbW1hbmQoKVxuXG4gICAgc2V0VW5pdmVyc2FsQ29tbWFuZHM6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQHVuaXZlcnNhbENvbW1hbmRzID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgdHJ5VW5pdmVyc2FsQ29tbWFuZHM6IC0+XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBleGFjdGx5TWF0Y2hlczogKHBhdHRlcm4pIC0+XG4gICAgICAgIEBjb21tYW5kVGV4dCA9PSBwYXR0ZXJuXG5cbiAgICBtYXRjaGVzOiAocGF0dGVybikgLT5cbiAgICAgICAgIyBJZiBlYWNoIHdvcmQgaW4gdGhlIHNwZWMgY29tbWFuZCBpcyBmb3VuZFxuICAgICAgICAjIGFueXdoZXJlIGluIHRoZSB1c2VyJ3MgaW5wdXQgaXQncyBhIG1hdGNoLFxuICAgICAgICAjIGluY2x1ZGluZyBzdWJzdHJpbmdzIG9mIHdvcmRzXG4gICAgICAgIHBhdHRlcm5Xb3JkcyA9IHBhdHRlcm4uc3BsaXQoJyAnKVxuICAgICAgICBmb3IgcGF0dGVybldvcmQgaW4gcGF0dGVybldvcmRzXG4gICAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgICBmb3IgY29tbWFuZFdvcmQgaW4gQGNvbW1hbmRXb3Jkc1xuICAgICAgICAgICAgICAgIGlmIHBhdHRlcm5Xb3JkLnN0YXJ0c1dpdGgoY29tbWFuZFdvcmQpIGFuZCAoY29tbWFuZFdvcmQubGVuZ3RoID49IDQgb3IgcGF0dGVybldvcmQubGVuZ3RoIDw9IDQpXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICAgICAgaWYgbm90IGZvdW5kXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBoYXNJdGVtOiAoaXRlbSkgLT4gaXRlbSBvZiBAaW52ZW50b3J5XG4gICAgdXNlZEl0ZW06IChpdGVtKSAtPiBpdGVtIG9mIEBpbnZlbnRvcnkgYW5kIEBpbnZlbnRvcnlbaXRlbV0gPT0gJ3VzZWQnXG5cbiAgICBwZXJjZW50Q2hhbmNlOiAoY2hhbmNlKSAtPiBNYXRoLnJhbmRvbSgpIDwgY2hhbmNlIC8gMTAwXG5cbiAgICBmbGFnSXM6IChmbGFnTmFtZSwgdmFsdWUpIC0+IEBmbGFnc1tmbGFnTmFtZV0gPT0gdmFsdWVcblxuICAgIGlzRmlyc3RUaW1lRW50ZXJpbmc6IC0+IEByb29tc0VudGVyZWRbQGN1cnJlbnRSb29tTmFtZV0gPT0gMVxuXG4gICAgY29taW5nRnJvbTogKHJvb21zKSAtPiBAbGFzdFJvb20gaW4gcm9vbXNcblxuICAgIHByaW50OiAodGV4dCkgLT5cbiAgICAgICAgQG1lc3NhZ2UgPSB0ZXh0XG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgZ29Ub1Jvb206IChyb29tTmFtZSkgLT5cbiAgICAgICAgQGxhc3RSb29tID0gQGN1cnJlbnRSb29tTmFtZVxuICAgICAgICBAY3VycmVudFJvb21OYW1lID0gcm9vbU5hbWVcbiAgICAgICAgaWYgcm9vbU5hbWUgb2YgQHJvb21zRW50ZXJlZFxuICAgICAgICAgICAgQHJvb21zRW50ZXJlZFtyb29tTmFtZV0rK1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcm9vbXNFbnRlcmVkW3Jvb21OYW1lXSA9IDFcbiAgICAgICAgQGRvQ29tbWFuZCgnX19lbnRlcl9yb29tX18nKVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdvVG9TdGFydDogLT5cbiAgICAgICAgQGdvVG9Sb29tKEBzdGFydFJvb20pXG5cbiAgICBzZXRGbGFnOiAoZmxhZ05hbWUsIHZhbHVlKSAtPlxuICAgICAgICBAZmxhZ3NbZmxhZ05hbWVdID0gdmFsdWVcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICBnZXRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgQGludmVudG9yeVtpdGVtXSA9ICdnb3R0ZW4nXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgcmVtb3ZlSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIGRlbGV0ZSBAaW52ZW50b3J5W2l0ZW1dXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgdXNlSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIEBpbnZlbnRvcnlbaXRlbV0gPSAndXNlZCdcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICB3YWl0OiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEBtZXNzYWdlICs9ICcgPHN0cm9uZz4oSGl0IEVudGVyKTwvc3Ryb25nPidcbiAgICAgICAgQHdhaXRDYWxsYmFjayA9IGNhbGxiYWNrXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgbGlzdGVuOiAoY2FsbGJhY2spIC0+IEBjYWxsYmFja3MucHVzaChjYWxsYmFjaylcblxuICAgIG5vdGlmeTogLT4gY2FsbGJhY2soKSBmb3IgY2FsbGJhY2sgaW4gQGNhbGxiYWNrc1xuIiwibSA9IHJlcXVpcmUoJ21pdGhyaWwnKVxuZW5naW5lID0gbmV3KHJlcXVpcmUoJy4vZW5naW5lJykpKClcbnZpZXcgPSByZXF1aXJlKCdhcHAvdmlldycpKGVuZ2luZSlcblxuXG5tLm1vdW50KGRvY3VtZW50LmJvZHksIHZpZXcpXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gICAgbG9vazogW1xuICAgICAgICAnc2VlJ1xuICAgICAgICAnYWRtaXJlJ1xuICAgICAgICAnYmVob2xkJ1xuICAgICAgICAnZ2F3aydcbiAgICAgICAgJ29ic2VydmUnXG4gICAgICAgICdzcHknXG4gICAgICAgICdjaGVjaydcbiAgICBdXG4gICAgdGFrZTogW1xuICAgICAgICAncGljayB1cCdcbiAgICAgICAgJ2dldCdcbiAgICAgICAgJ2FjcXVpcmUnXG4gICAgICAgICdncmFiJ1xuICAgICAgICAnZ3Jhc3AnXG4gICAgICAgICdvYnRhaW4nXG4gICAgICAgICdidXknXG4gICAgICAgICdjaG9vc2UnXG4gICAgXVxuICAgIGdvOiBbXG4gICAgICAgICd3YWxrJ1xuICAgICAgICAncGVyYW1idWxhdGUnXG4gICAgICAgICdtb3ZlJ1xuICAgICAgICAndHJhdmVsJ1xuICAgICAgICAnam91cm5leSdcbiAgICAgICAgJ21vc2V5J1xuICAgIF1cbiAgICBnaXZlOiBbXG4gICAgICAgICdkZWxpdmVyJ1xuICAgICAgICAnZG9uYXRlJ1xuICAgICAgICAnaGFuZCBvdmVyJ1xuICAgICAgICAncHJlc2VudCdcbiAgICAgICAgJ2VuZG93J1xuICAgICAgICAnYmVxdWVhdGgnXG4gICAgICAgICdiZXN0b3cnXG4gICAgICAgICdyZWxpbnF1aXNoJ1xuICAgIF1cbiAgICBnYXJkZW46IFtcbiAgICAgICAgJ3Bsb3QnXG4gICAgICAgICdwbGFudHMnXG4gICAgICAgICdwcm9kdWNlJ1xuICAgIF1cbiAgICBmbG93ZXI6IFtcbiAgICAgICAgJ2Zsb3VyJ1xuICAgIF1cbiAgICBzb2RhOiBbXG4gICAgICAgICdwb3AnXG4gICAgXVxuICAgIG1hcmdhcmluZTogW1xuICAgICAgICAnYnV0dGVyJ1xuICAgIF1cbiAgICBzdGlyOiBbXG4gICAgICAgICd3aGlwJ1xuICAgICAgICAncHVsc2UnXG4gICAgICAgICd2aWJyYXRlJ1xuICAgICAgICAnbWl4J1xuICAgICAgICAnYmxlbmQnXG4gICAgICAgICdhZ2l0YXRlJ1xuICAgICAgICAnY2h1cm4nXG4gICAgICAgICdiZWF0J1xuICAgIF1cbiAgICBhdHRhY2s6IFtcbiAgICAgICAgJ2ZpZ2h0J1xuICAgICAgICAncHVuY2gnXG4gICAgICAgICdiaXRlJ1xuICAgICAgICAnaW50ZXJ2ZW5lJ1xuICAgIF1cbiAgICBiYWRnZTogW1xuICAgICAgICAnc2hlcmlmZidcbiAgICAgICAgJ3N0aWNrZXInXG4gICAgXVxuICAgIGVudGVyOiBbXG4gICAgICAgICdpbidcbiAgICAgICAgJ2luc2lkZSdcbiAgICBdXG4gICAgZXhpdDogW1xuICAgICAgICAnbGVhdmUnXG4gICAgICAgICdvdXQnXG4gICAgICAgICdvdXRzaWRlJ1xuICAgICAgICAnd2l0aGRyYXcnXG4gICAgICAgICdmbGVlJ1xuICAgICAgICAnZGVwYXJ0J1xuICAgICAgICAnZGVjYW1wJ1xuICAgIF1cbiIsIm0gPSByZXF1aXJlKCdtaXRocmlsJylcbldhbGVWc1NoYXJjID0gcmVxdWlyZSgnYXBwL3dhbGV2c3NoYXJjJylcblxuXG5TdHJpbmcucHJvdG90eXBlLmNhcGl0YWxpemUgPSAtPlxuICAgIEBbMF0udG9VcHBlckNhc2UoKSArIEBbMS4uXVxuXG5cbklURU1fTkFNRVMgPSB7XG4gICAgZWdnOiAnRWdnJ1xuICAgIGN1dHRsZWZpc2g6ICdDdXR0bGVmaXNoJ1xuICAgIGZsb3dlcnM6ICdGbG93ZXJzJ1xuICAgIHNvZGE6ICdCYWtpbmcgU29kYSdcbiAgICBwYW5jYWtlczogJ1BhbmNha2VzJ1xuICAgIHN5cnVwOiAnTWFwbGUgU3lydXAnXG4gICAgbWFyZ2FyaW5lOiAnTWFyZ2FyaW5lJ1xuICAgIHVtYnJlbGxhOiAnVW1icmVsbGEnXG4gICAgYmFkZ2U6ICdCYWRnZSBTdGlja2VyJ1xuICAgIG1pbGs6ICdNYW5hdGVlIE1pbGsnXG4gICAgJ3JlZCBoZXJyaW5nJzogJ1JlZCBIZXJyaW5nJ1xuICAgICdjb3dib3kgaGF0JzogJ0Nvd2JveSBIYXQnXG4gICAgJ3JhaW5ib3cgd2lnJzogJ1JhaW5ib3cgV2lnJ1xuICAgICdtb3RvcmN5Y2xlIGhlbG1ldCc6ICdNb3RvcmN5Y2xlIEhlbG1ldCdcbiAgICAnc3RvdmVwaXBlIGhhdCc6ICdTdG92ZXBpcGUgSGF0J1xuICAgICdsZWF0aGVyIGphY2tldCc6ICdMZWF0aGVyIEphY2tldCdcbiAgICAnY2xvd24gc3VpdCc6ICdDbG93biBTdWl0J1xuICAgICdvbGR0aW1leSBzdWl0JzogJ09sZC1UaW1leSBTdWl0J1xuICAgICdjb3cgcHJpbnQgdmVzdCc6ICdDb3cgUHJpbnQgVmVzdCdcbiAgICAnZmFrZSBiZWFyZCc6ICdGYWtlIEJlYXJkJ1xuICAgICdndW4gYmVsdCc6ICdHdW4gQmVsdCdcbiAgICAnbWV0YWwgY2hhaW4nOiAnTWV0YWwgQ2hhaW4nXG4gICAgJ3J1YmJlciBjaGlja2VuJzogJ1J1YmJlciBDaGlja2VuJ1xuICAgICdxdWFkcmF0aWMgZXllJzogJ1F1YWRyYXRpYyBFeWUnXG59XG5cblxuY2xhc3MgVGV4dFR5cGVyXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBjdXJyZW50TWVzc2FnZSA9ICcnXG4gICAgICAgIEBpID0gMFxuXG4gICAgdHlwZUxvb3A6ID0+XG4gICAgICAgIEBpKytcbiAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICBpZiBub3QgQGlzRG9uZSgpXG4gICAgICAgICAgICBzZXRUaW1lb3V0KEB0eXBlTG9vcCwgNilcblxuICAgIHNldE1lc3NhZ2U6IChtZXNzYWdlKSAtPlxuICAgICAgICBAY3VycmVudE1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgICAgIEBpID0gMFxuICAgICAgICBzZXRUaW1lb3V0KEB0eXBlTG9vcCwgNilcblxuICAgIHNob3dBbGw6IC0+XG4gICAgICAgIEBpID0gQGN1cnJlbnRNZXNzYWdlLmxlbmd0aCAtIDFcblxuICAgIGdldFRleHRTb0ZhcjogLT5cbiAgICAgICAgQGN1cnJlbnRNZXNzYWdlWy4uQGldXG5cbiAgICBpc0RvbmU6IC0+XG4gICAgICAgIEBpID49IEBjdXJyZW50TWVzc2FnZS5sZW5ndGggLSAxXG4gICAgXG5cbm1vZHVsZS5leHBvcnRzID0gKGVuZ2luZSkgLT5cbiAgICBjb250cm9sbGVyOiBjbGFzc1xuICAgICAgICBjb25zdHJ1Y3RvcjogLT5cblxuICAgICAgICAgICAgV2FsZVZzU2hhcmMoZW5naW5lKVxuICAgICAgICAgICAgZGlkTG9hZCA9IGVuZ2luZS5sb2FkKClcblxuICAgICAgICAgICAgQHZtID0ge31cbiAgICAgICAgICAgIEB2bS5jb21tYW5kID0gbS5wcm9wKCcnKVxuICAgICAgICAgICAgQHZtLnR5cGVyID0gbmV3IFRleHRUeXBlcigpXG5cbiAgICAgICAgICAgIGVuZ2luZS5saXN0ZW4gPT5cbiAgICAgICAgICAgICAgICBAdm0udHlwZXIuc2V0TWVzc2FnZShlbmdpbmUuZ2V0Q3VycmVudE1lc3NhZ2UoKSlcbiAgICAgICAgICAgICAgICBtLnJlZHJhdygpXG4gICAgICAgICAgICAgICAgZW5naW5lLnNhdmUoKVxuXG4gICAgICAgICAgICBpZiBkaWRMb2FkXG4gICAgICAgICAgICAgICAgZW5naW5lLmRvQ29tbWFuZCgnbG9vaycpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZW5naW5lLmdvVG9TdGFydCgpXG5cbiAgICAgICAgb25Db21tYW5kU3VibWl0OiAoZSkgPT5cbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgaWYgQHZtLnR5cGVyLmlzRG9uZSgpXG4gICAgICAgICAgICAgICAgZW5naW5lLmRvQ29tbWFuZChAdm0uY29tbWFuZCgpKVxuICAgICAgICAgICAgICAgIEB2bS5jb21tYW5kKCcnKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEB2bS50eXBlci5zaG93QWxsKClcblxuXG4gICAgdmlldzogKGN0cmwpIC0+XG4gICAgICAgIFtcbiAgICAgICAgICAgIG0gJy5zaWRlYmFyJyxcbiAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMjYwcHgnXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcyMHB4J1xuICAgICAgICAgICAgICAgIG0gJ2gyJyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Ub3A6IDBcbiAgICAgICAgICAgICAgICAgICAgJ0ludmVudG9yeSdcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIGZvciBpdGVtLCBzdGF0ZSBvZiBlbmdpbmUuZ2V0SW52ZW50b3J5KClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHN0YXRlID09ICdnb3R0ZW4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAncCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElURU1fTkFNRVNbaXRlbV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgc3RhdGUgPT0gJ3VzZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAncCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dERlY29yYXRpb246ICdsaW5lLXRocm91Z2gnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElURU1fTkFNRVNbaXRlbV1cbiAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uY2xpY2s6IC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgY29uZmlybSgnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIHJlc3RhcnQgdGhlIGdhbWU/IFRoaXMgd2lsbCBjbGVhciBhbGwgcHJvZ3Jlc3MgYW5kIGl0ZW1zIHlvdSBoYXZlIGFjaGlldmVkIHNvIGZhci4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnU2F2ZSBnYW1lIGRlbGV0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcnXG4gICAgICAgICAgICAgICAgICAgICAgICAnUmVzdGFydCBnYW1lJ1xuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICBtICd0ZXh0YXJlYScsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMzAwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5Ub3A6ICcxMHB4J1xuICAgICAgICAgICAgICAgICAgICBtLnRydXN0KGVuZ2luZS5wcmV2aW91c0NvbW1hbmRzLmpvaW4oJ1xcbicpKVxuXG4gICAgICAgICAgICAgICAgbSAndGV4dGFyZWEnLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzMwMHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAnMTBweCdcbiAgICAgICAgICAgICAgICAgICAgbS50cnVzdChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncHJvZ3Jlc3MnKSlcblxuICAgICAgICAgICAgbSAnLmNvbnRlbnQnLFxuICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogKHdpbmRvdy5pbm5lcldpZHRoIC0gMzYwKSArICdweCdcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzIwcHgnXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmdUb3A6IDBcbiAgICAgICAgICAgICAgICBtICdoMScsIGVuZ2luZS5nZXRDdXJyZW50Um9vbU5hbWUoKVxuICAgICAgICAgICAgICAgIG0gJ3AnLCBtLnRydXN0KGN0cmwudm0udHlwZXIuZ2V0VGV4dFNvRmFyKCkpXG5cbiAgICAgICAgICAgICAgICBpZiBlbmdpbmUuZ2V0Q3VycmVudFJvb21OYW1lKCkgPT0gJ0VuZCdcbiAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnZGl2JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0QWxpZ246ICdjZW50ZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAnaW1nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnL3NoYXJrLXNob3dlcmluZy5wbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdicidcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2JyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnaDMnLCAnRG8geW91IGV2ZW4gZmVlZGJhY2s/J1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnZGl2JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICdpZnJhbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6ICdodHRwczovL2RvY3MuZ29vZ2xlLmNvbS9mb3Jtcy9kLzFkckhLc2ZFelNfekExN1lUZDdPYVdZaXMxUThKamYzM2ZyN0s2T2NSQm9rL3ZpZXdmb3JtP2VtYmVkZGVkPXRydWUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnNzYwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICc1MDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lYm9yZGVyOiAnMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luaGVpZ2h0OiAnMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2lud2lkdGg6ICcwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcycHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgZ3JleSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblJpZ2h0OiAnMjBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0xvYWRpbmcuLi4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAndGV4dGFyZWEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzUwMHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtLnRydXN0KGVuZ2luZS5wcmV2aW91c0NvbW1hbmRzLmpvaW4oJ1xcbicpKVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBtICdmb3JtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uc3VibWl0OiBjdHJsLm9uQ29tbWFuZFN1Ym1pdFxuICAgICAgICAgICAgICAgICAgICAgICAgbSAnaW5wdXRbdHlwZT10ZXh0XScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdibG9jaydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNoYW5nZTogbS53aXRoQXR0cigndmFsdWUnLCBjdHJsLnZtLmNvbW1hbmQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGN0cmwudm0uY29tbWFuZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnOiAoZWxlbWVudCwgaXNJbml0aWFsaXplZCwgY29udGV4dCkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgbm90IGlzSW5pdGlhbGl6ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uW3R5cGU9c3VibWl0XScsICdEbydcbiAgICAgICAgXVxuIiwiXCJcIlwiXG5Db25kaXRpb25zOlxuICAgIEBtYXRjaGVzKHBhdHRlcm4pXG4gICAgQGhhc0l0ZW0oaXRlbSBuYW1lKVxuICAgIEBwZXJjZW50Q2hhbmNlKGNoYW5jZSBvdXQgb2YgMTAwKVxuICAgIEBmbGFnSXMoZmxhZyBuYW1lLCB2YWx1ZSlcblxuUmVzdWx0czpcbiAgICBAcHJpbnQodGV4dClcbiAgICBAZ29Ub1Jvb20ocm9vbSBuYW1lKVxuICAgIEBzZXRGbGFnKGZsYWcgbmFtZSwgdmFsdWUpXG5cIlwiXCJcblxuXG5tb2R1bGUuZXhwb3J0cyA9IChlbmdpbmUpIC0+XG4gICAgaGVscFRleHQgPSBcIlwiXCJcbkFkdmFuY2UgdGhyb3VnaCB0aGUgZ2FtZSBieSB0eXBpbmcgY29tbWFuZHMgbGlrZSA8c3Ryb25nPmxvb2ssIGdldCwgYW5kIGdvLjwvc3Ryb25nPjxicj5cbkNvbW1hbmRzIGNhdGFsb2d1ZSBhbmQvb3IgcHJlIHNldCBjb21tYW5kIHByZWZpeCBidXR0b25zOiA8c3Ryb25nPkdvLCB0YWxrLCBnZXQsIGxvb2ssIHVzZS4uLjwvc3Ryb25nPjxicj5cbkxvb2sgaW4gYW4gYXJlYSB0byBnYWluIG1vcmUgaW5mb3JtYXRpb24gb3IgbG9vayBhdCBvYmplY3RzOiA8c3Ryb25nPihsb29rIGZpc2gpPC9zdHJvbmc+PGJyPlxuTW92ZSBieSB0eXBpbmcgZ28gY29tbWFuZHM6IDxzdHJvbmc+KGdvIGVhc3QpPC9zdHJvbmc+PGJyPlxuRW5nYWdlIGluIHBoaWxvc29waGljYWwgZGViYXRlOiA8c3Ryb25nPih0YWxrIHNvcmNlcmVzcyk8L3N0cm9uZz48YnI+XG5Vc2UgaXRlbXMgaW4gaW52ZW50b3J5OiA8c3Ryb25nPih1c2UgbGlnaHRzYWJlcik8L3N0cm9uZz48YnI+XG5UaGVyZSBhcmUgb3RoZXIgY29tbWFuZHMgdG9vIGFuZCBzb21lIHlvdSBjYW4ganVzdCBjbGljayBvbiBhIGJ1dHRvbiB0byB1c2UuIEV4cGVyaW1lbnQgYW5kIHRyeSB0aGluZ3MgaW4gdGhpcyBiZWF1dGlmdWwgbmV3IHdvcmxkIGJlZm9yZSB5b3UuPGJyPlxuVHlwZSA8c3Ryb25nPlwiaGVscFwiPC9zdHJvbmc+IHRvIHNlZSB0aGlzIG1lbnUgYWdhaW48YnI+XG5cIlwiXCJcblxuICAgIGVuZ2luZS5zZXRBbHJlYWR5R290dGVuTWVzc2FnZSgnV2hhdCBhcmUgeW91IGNyYXp5LCB3aHkgd291bGQgeW91IG5lZWQgbW9yZS9hbm90aGVyIG9mIHRoYXQvdGhvc2U/JylcblxuICAgIGVuZ2luZS5zZXRVbml2ZXJzYWxDb21tYW5kcyAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnZGllJylcbiAgICAgICAgICAgIEBwcmludCgnV2hhdCBhcmUgeW91IGRvaW5nPyBZb3UgYXJlIGRlYWQgbm93LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dldCB5ZSBmbGFzaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBjYW5cXCd0IGdldCB5ZSBmbGFzay4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3aW4nKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZGlkIGl0LiBZb3Ugd2luLiBCdXkgeW91cnNlbGYgYSBwaXp6YSBiZWNhdXNlIHlvdSBhcmUgc28gY2xldmVyLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2ludicpIG9yIEBtYXRjaGVzKCdpbnZlbnRvcnknKVxuICAgICAgICAgICAgaWYgT2JqZWN0LmtleXMoQGdldEludmVudG9yeSgpKS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgQHByaW50KCdJdCB0ZWxscyB5b3Ugd2hhdCBpcyBpbnZlbnRvcnkgcmlnaHQgb3ZlciB0aGVyZSBvbiB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgc2NyZWVuLiBJcyB0eXBpbmcgdGhpcyBjb21tYW5kIHJlYWxseSBuZWNlc3Nhcnk/JylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdXIgaW52ZW50b3J5IGlzIGVtcHR5IHlvdSBiaWcgZHVtYiBidXR0LiBTb3JyeSwgdGhhdCB3YXMgcnVkZSBJIG1lYW50IHRvIHNheSwgXCJZb3UgYnV0dC5cIicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2hlbHAnKVxuICAgICAgICAgICAgQHByaW50KGhlbHBUZXh0KVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY3V0dGxlZmlzaCcpIGFuZCBAaGFzSXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBAcHJpbnQoJ0FzaWRlIGZyb20gYmVpbmcgcmVhbGx5IGZ1bm55IGxvb2tpbmcsIGhpZ2hseSBpbnRlbGxpZ2VudCBhbmQgaGlnaGx5IHVnbHksIGN1dHRsZWZpc2ggY2FuIGFsc28gcmVsZWFzZSBhbiBpbmsgbGlrZSBzdWJzdGFuY2UgdG8gZXNjYXBlIHByZWRhdG9ycy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZWdnJykgYW5kIEBoYXNJdGVtKCdlZ2cnKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIGxvb2tzIHRvIGJlIGFuIG9yZGluYXJ5IGVnZy4gQnV0IHJlbWVtYmVyLCBpdCB3YXMgcHVsbGVkIG91dCBvZiBCaWxseSBPY2VhblxcJ3MgZ2xvdmUgYm94LCBzbyBtYXliZSBub3Q/JylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGZsb3dlcnMnKSBhbmQgQGhhc0l0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgQHByaW50KCdUaGVzZSBhcmUgc29tZSB2ZXJzYXRpbGUgbG9va2luZyBmbG93ZXJzLiBTbyBtdWNoIHNvLCB5b3UgY2FuIHNlbnNlIGEgcHVuIGxpa2UgYXVyYSBzdXJyb3VuZGluZyB0aGVtLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayB1bWJyZWxsYScpIGFuZCBAaGFzSXRlbSgndW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIHVtYnJlbGxhIGNvdWxkIHByb3ZpZGUgYSBsb3Qgb2Ygc2hhZGUuIEkgZG9uXFwndCBzZWUgaG93IGl0IGNhbiBmaXQgaW4geW91ciBwb2NrZXRzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzb2RhJykgYW5kIEBoYXNJdGVtKCdzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIGEgY2FuIG9mIHNvZGEgeW91IGZvdW5kIGluIHRoZSBvdmVuIGF0IFN0ZWFrIGFuZCBTaGFrZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgc3lydXAnKSBhbmQgQGhhc0l0ZW0oJ3N5cnVwJylcbiAgICAgICAgICAgIEBwcmludCgnQSBiYWcgb2YgbWFwbGUgZmxhdm9yZWQgZm91bnRhaW4gc3lydXAuIEl0IGNvdWxkIGhhdmUgb3RoZXIgdXNlcyB0b28uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGhlcnJpbmcnKSBhbmQgQGhhc0l0ZW0oJ2hlcnJpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdJdCBpcyBhIGNhbiBvZiBwaWNrbGVkIGhlcnJpbmcgeW91IHdvbiBvbiBhIGdhbWVzaG93LiBXYXkgdG8gZ28uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHJlZCBoZXJyaW5nJykgYW5kIEBoYXNJdGVtKCdyZWQgaGVycmluZycpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0IGlzIGEgcmVkIGhlcnJpbmcuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1hcmdhcmluZScpIGFuZCBAaGFzSXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEBwcmludCgnTm8gSWZzLCBBbmRzIG9yIEJ1dHRlciB2YWd1ZWx5IG1hcmdhcmluZSBzcHJlYWQgdHlwZSBwcm9kdWN0LiBNb2RlbGVkIGJ5IExvdSBGZXJyaWduby4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgYmFkZ2UnKSBhbmQgQGhhc0l0ZW0oJ2JhZGdlJylcbiAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIHRoZSBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgYmFkZ2Ugc3RpY2tlciB5b3UgZ290IGF0IHRoZSBXYXRlciBXb3JsZCBnaWZ0IHNob3AuIEluIGEgcG9vcmx5IGxpdCByb29tLCBvbmUgbWlnaHQgbWlzdGFrZSB0aGlzIGZvciBhbiBhdXRoZW50aWMganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBwYW5jYWtlcycpIGFuZCBAaGFzSXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgQHByaW50KCdNeXN0aWNhbCBwYW5jYWtlcyB5b3UgbWFkZSB3aXRoIGFuIGVuY2hhbnRlZCByZWNpcGUgYW5kIHRvdGFsbHkgbm90IHRoZSBjb3JyZWN0IGluZ3JlZGllbnRzLCByZW1lbWJlcj8gVGhhdCB3YXMgVUgtbWF5LXppbmchIFRha2UgdGhlbSB0byBXYWxlIGFuZCBodXJyeS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgbWlsaycpIGFuZCBAaGFzSXRlbSgnbWlsaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1dob2xlIG1pbGssIGFwcGFyZW50bHkgZnJvbSBhIHJlYWwgc2VhIGNvdy4gSXMgaXQgc3RpbGwgb2theSB0byBjYWxsIHRoZW0gdGhhdD8nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgcXVhZHJhdGljIGV5ZScpIGFuZCBAaGFzSXRlbSgncXVhZHJhdGljIGV5ZScpXG4gICAgICAgICAgICBAcHJpbnQoJz8/PycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBjb3dib3kgaGF0JykgYW5kIEBoYXNJdGVtKCdjb3dib3kgaGF0JylcbiAgICAgICAgICAgIEBwcmludCgnTmljZSBoYXQsIHBpbGdyaW0uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHJhaW5ib3cgd2lnJykgYW5kIEBoYXNJdGVtKCdyYWluYm93IHdpZycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIHNob3VsZCBiZSBsYXdzIGFnYWluc3QgdGhpcyBraW5kIG9mIHRoaW5nLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBtb3RvcmN5Y2xlIGhlbG1ldCcpIGFuZCBAaGFzSXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICAgICAgQHByaW50KCdJdCBpcyB0aGUga2luZCB3aXRoIHRoZSBmdWxsIHZpc29yIHNvIHlvdSBjb3VsZCBqdXN0IGJlIHRoZSBzdHVudCBkb3VibGUuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHN0b3ZlcGlwZSBoYXQnKSBhbmQgQGhhc0l0ZW0oJ3N0b3ZlcGlwZSBoYXQnKVxuICAgICAgICAgICAgQHByaW50KCdGb3VyIHNjb3JlIGFuZCBzZXZlbiB5ZWFycyBhZ28uLi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgbGVhdGhlciBqYWNrZXQnKSBhbmQgQGhhc0l0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgICAgIEBwcmludCgnTWVtYmVycyBvbmx5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBjbG93bnN1aXQnKSBhbmQgQGhhc0l0ZW0oJ2Nsb3duc3VpdCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgc2hvdWxkIHNjYXJlIHRoZSBraWRzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBvbGQgdGltZXkgc3VpdCcpIGFuZCBAaGFzSXRlbSgnb2xkIHRpbWV5IHN1aXQnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZmVlbCBsaWtlIHNvbWUgc2VyaW91cyBmcmllZCBjaGlja2VuLCBhbmQgeW91IGRvbuKAmXQgZXZlbiBrbm93IHdoYXQgdGhhdCBpcy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY293cHJpbnQgdmVzdCcpIGFuZCBAaGFzSXRlbSgnY293cHJpbnQgdmVzdCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1ZlcnkgVG95IFN0b3J5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmYWtlIGJlYXJkJykgYW5kIEBoYXNJdGVtKCdmYWtlIGJlYXJkJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGZlZWwgbGlrZSBjb21wbGFpbmluZyBhYm91dCBraWRzIG9uIHlvdXIgbGF3biBhbmQgaG93IHlvdSBkb25cXCd0IGV2ZW4ga25vdyB3aGF0IGEgdHdpdHRlciBpcy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZ3VuIGJlbHQnKSBhbmQgQGhhc0l0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgICAgIEBwcmludCgnQSB0cnVzdHkgc2l4IHNob290ZXIuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1ldGFsIGNoYWluJykgYW5kIEBoYXNJdGVtKCdtZXRhbCBjaGFpbicpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgY2hhaW4gaXMgb25seSBhcyBzdHJvbmcgYXMtLSB3YWl0LCB3cm9uZyBzaG93LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBydWJiZXIgY2hpY2tlbicpIGFuZCBAaGFzSXRlbSgncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICAgICAgQHByaW50KCdTb3JyeSwgbm8gcHVsbGV5IGluIGl0LicpXG5cblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnSSBhbSBub3QgYXV0aG9yaXplZCB0byB0ZWxsIHlvdSBhYm91dCB0aGF0IHlldC4gU3RvcCB0cnlpbmcgdG8gY2hlYXQgbWFuIScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZScpXG4gICAgICAgICAgICBAcHJpbnQoJ0kgYW0gbm90IGF1dGhvcml6ZWQgdG8gZ2l2ZSB0aGF0IHRvIHlvdS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKVxuICAgICAgICAgICAgQHByaW50KCdXaG8gYXJlIHlvdSB0YWxraW5nIHRvPycpXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgIyBQaWNrIGEgcmFuZG9tIGRlZmF1bHQgcmVzcG9uc2VcbiAgICAgICAgICAgIGRlZmF1bHRSZXNwb25zZXMgPSBbXG4gICAgICAgICAgICAgICAgJ1doYXQgYXJlIHlvdSBldmVuIHRyeWluZyB0byBkbz8gIEp1c3Qgc3RvcC4nXG4gICAgICAgICAgICAgICAgJ0dvb2Qgb25lIG1hbi4nXG4gICAgICAgICAgICAgICAgJ1dob2EgdGhlcmUgRWFnZXIgTWNCZWF2ZXIhJ1xuICAgICAgICAgICAgICAgICdEb25cXCd0IGRvIHRoYXQuJ1xuICAgICAgICAgICAgICAgICdHcm9zcywgbm8gd2F5LidcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIEBwcmludChkZWZhdWx0UmVzcG9uc2VzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpkZWZhdWx0UmVzcG9uc2VzLmxlbmd0aCldKVxuXG4gICAgICAgIFxuICAgIGVuZ2luZS5zZXRBZnRlckNvbW1hbmQgLT5cbiAgICAgICAgaWYgKG5vdCBAZmxhZ0lzKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdlZ2cnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnZmxvd2VycycpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdzb2RhJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ3N5cnVwJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ21pbGsnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnbWFyZ2FyaW5lJykpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiV2VsbCwgSSB0aGluayBJIGhhdmUgYWxsIHRoZSBpbmdyZWRpZW50cyxcIiB5b3Ugc2F5IHRvIHlvdXJzZWxmLiBcIkkganVzdCBuZWVkIG9uZSBvZiB0aG9zZSBwbGFjZXMgd2hlcmUgeW91IHB1dCB0aGVtIHRvZ2V0aGVyIHNvIGl0IHR1cm5zIGludG8gc29tZXRoaW5nIHlvdSBjYW4gZWF0LiBZb3Uga25vdywgb25lIG9mIHRob3NlLi4uZm9vZCBwcmVwYXJpbmcgcm9vbXMuXCInKVxuICAgICAgICAgICAgQHNldEZsYWcoJ2hhdmVfYWxsX2l0ZW1zJywgdHJ1ZSlcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhbGUgdnMgU2hhcmM6IFRoZSBDb21pYzogVGhlIEludGVyYWN0aXZlIFNvZnR3YXJlIFRpdGxlIEZvciBZb3VyIENvbXB1dGVyIEJveCcsIC0+XG4gICAgICAgIEBwcmludCgnVGhhbmsgeW91IGZvciBidXlpbmcgdGhpcyBnYW1lISAgVHlwZSB0aGluZ3MgaW4gdGhlIGJveCB0byBtYWtlIHRoaW5ncyBoYXBwZW4hJylcbiAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgIEBnb1RvUm9vbSgnSG93IFRvIFBsYXknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0hvdyBUbyBQbGF5JywgLT5cbiAgICAgICAgQHByaW50KGhlbHBUZXh0KVxuICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgQGdvVG9Sb29tKCdPY2VhbicpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnT2NlYW4nLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgYW5kIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgIEBwcmludCgnV2VsY29tZSB0byBXYWxlIHZzIFNoYXJjOiBUaGUgVmlkZW8gR2FtZS4gWW91IGFyZSBTaGFyYyBhbmQgeW91ciAkMjMgc2hhbXBvbyBpcyBtaXNzaW5nLiBZb3Ugc3VzcGVjdCBmb3VsIHBsYXkuIE9idmlvdXMgZXhpdHMgYXJlIE5vcnRoIHRvIHlvdXIgZnJpZW5kIFdhbGUuJylcbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBpcyBxdWl0ZSBwb3NzaWJseSB0aGUgbW9zdCB1bmludGVyZXN0aW5nIGN1YmUgb2Ygd2F0ZXIgaW4gdGhlIG9jZWFuLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYWxlJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdIZXksIGl0IGlzIHlvdXIgZnJpZW5kLCBXYWxlLiBIZSBpcyBkb2luZyB0aGF0IHRoaW5nIHdoZXJlIGhlIGhhcyBoaXMgZXllcyBjbG9zZWQgYW5kIGFjdHMgbGlrZSBoZSBkaWQgbm90IG5vdGljZSB5b3VyIGFycml2YWwuIEhlIGlzIGtpbmQgb2YgYSBwcmljaywgYnV0IGFsc28geW91ciBmcmllbmQuIFdoYXQgY2FuIHlvdSBkbz8gT2J2aW91cyBleGl0cyBhcmUgT2NlYW4gdG8gdGhlIHNvdXRoLCBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoIHRvIHRoZSB3ZXN0LCBtb3JlIE9jZWFuIHRvIHRoZSBub3J0aCwgYW5kIEJpbGx5IE9jZWFuIHRvIHRoZSBlYXN0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdXYWxlIGlzIHN0aWxsIGp1c3QgZmxvYXRpbmcgdGhlcmUgdHJ5aW5nIHRvIGJlIGVuaWdtYXRpYywgd291bGQgaGUgZXZlbiBub3RpY2UgaWYgeW91IHNhaWQgc29tZXRoaW5nPyBPYnZpb3VzIGV4aXRzIGFyZSBPY2VhbiB0byB0aGUgc291dGgsIGEgc2Nob29sIG9mIEN1dHRsZWZpc2ggdG8gdGhlIHdlc3QsIG1vcmUgT2NlYW4gdG8gdGhlIG5vcnRoLCBhbmQgQmlsbHkgT2NlYW4gdG8gdGhlIGVhc3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHdhbGUnKVxuICAgICAgICAgICAgQHByaW50KCdIZSBpcyBqdXN0IGZsb2F0aW5nIHRoZXJlLCBleWVzIGNsb3NlZCwgdHJ5aW5nIHRvIHNodXQgb3V0IHRoaXMgZWFydGhseSByZWFsbS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dpdmUgcGFuY2FrZXMnKVxuICAgICAgICAgICAgaWYgQGhhc0l0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSGV5IFdhbGUsXCIgeW91IGNhbGwgb3V0IGFzIGludHJ1c2l2ZWx5IGFzIHBvc3NpYmxlLCBcIkkgZ290IHlvdXItLVwiIEJlZm9yZSB5b3UgY291bGQgZmluaXNoIHlvdXIgc2VudGVuY2UsIHlvdXIgYmx1YmJlcnkgZnJpZW5kIGhhcyBzbmF0Y2hlZCB0aGUgcGxhdGUgYXdheSBhbmQsIGluIGEgbW9zdCB1bmRpZ25pZmllZCBtYW5uZXIsIGJlZ2lucyBtb3dpbmcgdGhyb3VnaCB0aGUgZnJpZWQgZGlzY3MgeW91IHNvIGFydGZ1bGx5IHByZXBhcmVkLiBcIlNvdWwgc2VhcmNoaW5nIHRha2VzIGEgbG90IG9mIGVuZXJneSxcIiBoZSBleHBsYWlucyBiZXR3ZWVuIGJpdGVzLiBcIkkgaGF2ZW5cXCd0IGVhdGVuIGFueXRoaW5nIGFsbCBkYXkuXCInKVxuICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnT25jZSBmaW5pc2hlZCwgV2FsZSBzdHJhaWdodGVucyBoaW1zZWxmIG91dCwgbG9va2luZyBhIG1pdGUgZW1iYXJyYXNzZWQgZm9yIHRoZSBzYXZhZ2UgZGlzcGxheSBoZSBqdXN0IHB1dCBvbi4gXCJXaGF0IHdhcyBpdCB5b3UgbmVlZGVkP1wiIFwiT2ggV2FsZSwgaXRcXCdzIHRlcnJpYmxlLiBJIHRoaW5rIG15ICQyMyBzaGFtcG9vIHdhcyBzdG9sZW4gYW5kIHRoZSBnaG9zdCBvZiBteSBub3QgcmVhbGx5IGRlYWQgZnJpZW5kIHNheXMgdGhlIGZhdGUgb2YgdGhlIHdvcmxkIGhhbmdzIGluIHRoZSBiYWxhbmNlLlwiJylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJJIHNlZSxcIiBzYXlzIFdhbGUsIGhpcyB2b2ljZSBhbmQgbWFubmVyIHJlbWFpbmluZyB1bmNoYW5nZWQgZGVzcGl0ZSB0aGUgdGhyZWF0IG9mIHRoZSB3b3JsZCB1bmJhbGFuY2luZy4gXCJTaGFyYywgSSBmZWFyIHRoZSB3b3JzdC4gWW91IG11c3Qgc3VtbW9uIHRoZSBldGhlcmVhbCBkb29yLlwiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk5vLCBXYWxlLFwiIHlvdSBzYXksIFwieW91IG1hZGUgbWUgc3dlYXIgYSB0aG91c2FuZCB2b3dzIG5ldmVyIHRvIGJyaW5nIHRoYXQgY3Vyc2VkIHJlbGljIGJhY2sgYW1vbmcgdXMuXCIgXCJJIGtub3cgd2hhdCBJIHNhaWQsIGJ1dCBJIGFsc28ga25ldyB0aGVyZSB3b3VsZCBjb21lIGEgdGltZSB3aGVuIHdlIHdvdWxkIGhhdmUgbm8gb3RoZXIgY2hvaWNlLlwiICBZb3Ugc2hvdWxkIHByb2JhYmx5IHN1bW1vbiB0aGUgZG9vci4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEByZW1vdmVJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNldEZsYWcoJ2dpdmVuX3BhbmNha2VzJywgdHJ1ZSlcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzdW1tb24gZG9vcicpIGFuZCBAZmxhZ0lzKCdnaXZlbl9wYW5jYWtlcycsIHRydWUpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSwgZmluYWxseSBjb252aW5jZWQgb2YgeW91ciB1cmdlbmN5IGFuZCB1dHRlciBkZXNwZXJhdGlvbiwgcGVyZm9ybSBzb21lIGludHJpY2F0ZSByaXRlcyBhbmQgaW5jYW50YXRpb25zIHRoYXQgd291bGQgYmUgcmVhbGx5IGNvb2wgaWYgeW91IGNvdWxkIHNlZSB0aGVtLCBidXQgSSBndWVzcyB5b3Ugd2lsbCBqdXN0IGhhdmUgdG8gdXNlIHlvdXIgaW1hZ2luYXRpb25zLiBUZXh0IG9ubHkgZm9vbHMhICBUaGUgZXRoZXJlYWwgZG9vciBzdGFuZHMgb3BlbiBiZWZvcmUgeW91LicpXG4gICAgICAgICAgICBAc2V0RmxhZygnc3VtbW9uZWRfZG9vcicsIHRydWUpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZW50ZXIgZG9vcicpIGFuZCBAZmxhZ0lzKCdzdW1tb25lZF9kb29yJywgdHJ1ZSlcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnVGhlIEV0aGVyZWFsIFJlYWxtJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrIHdhbGUnKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ3RhbGtlZF90b193YWxlJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1dhbGUgaXMgdHJ5aW5nIHRvIG1lZGl0YXRlIG9yIHNvbWV0aGluZyBwcmV0ZW50aW91cyB0aGF0IHlvdSBkb25cXCd0IGNhcmUgYWJvdXQuIFlvdSBoYXZlIHNvbWV0aGluZyBpbXBvcnRhbnQhIFwiV2FsZVwiIHlvdSBzaG91dCwgXCJJIG5lZWQgeW91ciBoZWxwISBUaGUgY29uZGl0aW9uIG9mIG15IG1hZ25pZmljZW50IHNjYWxwIGlzIGF0IHN0YWtlLlwiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1dhbGUgc2lnaHMgYSBoZWF2eSwgbGFib3JlZCBzaWdoLiBcIlNoYXJjLCB5b3UgaGF2ZSBkaXN0dXJiZWQgbXkgam91cm5leSB0byBteSBpbm5lcm1vc3QgYmVpbmcuIEJlZm9yZSBJIGNhbiBoZWxwIHlvdSwgcmVwYXJhdGlvbnMgbXVzdCBiZSBtYWRlLiBZb3UgbXVzdCBtYWtlIG1lIGEgaGVhbHRoeSBzZXJ2aW5nIG9mIHBhbmNha2VzOiB3aG9sZSB3aGVhdCwgd2l0aCBhbGwgbmF0dXJhbCBtYXBsZSBzeXJ1cC4gTm93IGxlYXZlIG1lIGFzIEkgcGVlbCBiYWNrIHRoZSBsYXllcnMgb2YgdGhlIHNlbGYgYW5kIHBvbmRlciB0aGUgbGVzc29uIG9mIHRoZSBjaGVycnkgYmxvc3NvbS4nKVxuICAgICAgICAgICAgICAgICAgICBAc2V0RmxhZygndGFsa2VkX3RvX3dhbGUnLCB0cnVlKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJJIGNhbiBub3QgbGlmdCBhIGZpbiBmb3IgeW91IHVudGlsIHlvdSBoYXZlIGJyb3VnaHQgYSBoZWFsdGh5IHNlcnZpbmcgb2Ygd2hvbGUgd2hlYXQgcGFuY2FrZXMgd2l0aCBhbGwgbmF0dXJhbCBtYXBsZSBzeXJ1cCBsaWtlIEkgc2FpZCBiZWZvcmUuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0JpbGx5IE9jZWFuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dldHRlciBPY2VhbicsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhpcyBpcyBqdXN0IHNvbWUgb2NlYW4geW91IGZvdW5kLiBJdCBkb2VzIGZlZWwgYSBsaXR0bGUgYml0IHdldHRlciB0aGFuIHRoZSByZXN0IG9mIHRoZSBvY2VhbiB0aG91Z2guIEFsc28sIGRpZCBpdCBqdXN0IGdldCB3YXJtZXI/IE9idmlvdXMgZXhpdHMgYXJlIGEgZ2FyZGVuIHRvIHRoZSB3ZXN0LCBXYWxlIGluIHRoZSBzb3V0aCwgYW5kIGEgZ2FtZXNob3cgZWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnSnVzdCBhbm90aGVyIHNvbGlkIDEwIGN1YmljIGZlZXQgb2Ygb2NlYW4uIE9idmlvdXMgZXhpdHMgYXJlIGEgZ2FyZGVuIHRvIHRoZSB3ZXN0LCBXYWxlIGluIHRoZSBzb3V0aCwgYW5kIGEgZ2FtZXNob3cgZWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdDdXR0bGVmaXNoJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnTG9vaywgdGhlcmUgYmUgc29tZSBjdXR0bGVmaXNoLCB0aG91Z2ggdGhleSBkbyBub3QgbG9vayB0b28gY3VkZGx5LiBTdGVhayBhbmQgU2hha2UgaXMgdG8gdGhlIHdlc3QsIEFjaHRpcHVzXFwncyBnYXJkZW4gdG8gdGhlIG5vcnRoLCBhbmQgV2FsZSB0byB0aGUgZWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhlcmUgdXNlZCB0byBiZSBjdXR0bGVmaXNoIGhlcmUgYnV0IHlvdSBzY2FyZWQgdGhlbSBhd2F5IHdpdGggeW91ciBhZ2dyZXNzaXZlIGFmZmVjdGlvbnMuIEtlZXAgdGhhdCBzdHVmZiBpbnNpZGUgbWFuISBTdGVhayBhbmQgU2hha2UgaXMgdG8gdGhlIHdlc3QsIEFjaHRpcHVzXFwncyBnYXJkZW4gdG8gdGhlIG5vcnRoLCBhbmQgV2FsZSB0byB0aGUgZWFzdC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjdWRkbGUgY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBmZWVsaW5nIGFmZmVjdGlvbmF0ZSB0b2RheSBhbmQgeW91IGp1c3QgZ290IGR1bXBlZCBzbyB3aHkgbm90PyBZb3UganVtcCBzb21lIG9mIHRoZSBjdXR0bGVmaXNoIGFuZCBzdGFydCBzbnVnZ2xpbmcgYW5kIGN1ZGRsaW5nLiBUaGUgY3V0dGxlZmlzaCBhcmUgbm90IGFtdXNlZCB0aG91Z2gsIGFuZCBzYXkgdGhleSBhcmUgdGlyZWQgb2YgZmlzaCBtYWtpbmcgdGhhdCBtaXN0YWtlLiBUaGV5IGFsbCBzd2ltIGF3YXkgZXhjZXB0IGZvciBvbmUgdGhhdCBoYXMgYXR0YWNoZWQgaXRzIHN1Y2tlcnMgdG8geW91ciBtaWQgcmVnaW9uLiBZb3UgZG9uXFwndCBzZWVtIHRvIG1pbmQuJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGV5IGFyZSBjdWRkbGVkIG91dC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBAcHJpbnQoJ09oLCBjdXR0bGVmaXNoLCB0aG9zZSBhcmUgZnJlYWt5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0JpbGx5IE9jZWFuJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIGFuZCBub3QgQGZsYWdJcygnd2F0Y2hlZF9iaWxseV92aWRlbycsIHRydWUpXG4gICAgICAgICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj16TmdjWUdndGY4TScsICdfYmxhbmsnKVxuXG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ2Ryb3ZlX2JpbGx5X3RvX2hvc3BpdGFsJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1N1ZGRlbmx5LCBhcHBlYXJpbmcgYmVmb3JlIHlvdXIgZXllcyBpcyBzaW5nZXItc29uZ3dyaXRlciBhbmQgZm9ybWVyIENhcmliYmVhbiBraW5nOiBCaWxseSBPY2Vhbi4gQWxzbyBCaWxseSBPY2VhblxcJ3MgY2FyLiBPYnZpb3VzIGV4aXRzIGFyZSBXZXN0IHRvIFdhbGUgYW5kIE5vcnRoIHRvIHNvbWUga2luZCBvZiBnYW1lIHNob3cuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0JpbGx5IE9jZWFuIGlzIG91dCBvZiB0aGUgaG9zcGl0YWwuIEhlIGFwcHJlY2lhdGVzIHdoYXQgeW91IGRpZCBmb3IgaGltIGFuZCBzYXlzLCBcIldoZW4gdGhlIGdvaW5nIGdldHMgdG91Z2gsIHRoZSB0b3VnaCBlc2NhcGUgZnJvbSB0aGUgaW5zYW5pdHkgd2FyZC5cIiBPYnZpb3VzIGV4aXRzIGFyZSBXZXN0IHRvIFdhbGUgYW5kIE5vcnRoIHRvIHNvbWUga2luZCBvZiBnYW1lIHNob3cuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJylcbiAgICAgICAgICAgIGlmIG5vdCBAZmxhZ0lzKCdkcm92ZV9iaWxseV90b19ob3NwaXRhbCcsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdIZSB3YW50cyB5b3UgdG8gZ2V0IGludG8gaGlzIGNhciBhbmQgZHJpdmUgaGltIHRvIHRoZSBob3NwaXRhbC4gSGUganVzdCBkcm92ZSB0aHJvdWdoIHRoZSBjYXIgd2FzaCB3aXRoIHRoZSB0b3AgZG93biBhZnRlciBkcm9wcGluZyBzb21lIGFjaWQuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiV2hlbiB0aGUgZ29pbmcgZ2V0cyB0b3VnaCwgdGhlIHRvdWdoIGVzY2FwZSBmcm9tIHRoZSBpbnNhbml0eSB3YXJkLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGNhcicpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoYXQgaXMgZGVmaW5pdGVseSBhIGNhci4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgaG9zcGl0YWwnKVxuICAgICAgICAgICAgQHByaW50KCdUaGUgaG9zcGl0YWwgbG9vbXMgaW4gdGhlIGRpc3RhbmNlLiBJdCBkb2VzblxcJ3Qgc2VlbSBhbGwgdGhhdCBmYXIgYXdheSBpZiB5b3UgaGF2ZSBhIGNhci4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2hvc3BpdGFsJykgb3IgQG1hdGNoZXMoJ2NhcicpXG4gICAgICAgICAgICBAcHJpbnQoJ1N1cmUsIHdoeSBub3Q/IFlvdSBnZXQgaW4gdGhlIGRyaXZlclxcJ3Mgc2VhdCBhbmQgZmluZCB5b3VyIHdheSB0byB0aGUgbmVhcmVzdCBtZWRpY2FsIHRyZWF0bWVudCBjZW50ZXIuIEFzIHRoYW5rcywgTXIuIE9jZWFuIHB1bGxzIGFuIGVnZyBvdXQgZnJvbSBoaXMgZ2xvdmUgYm94LiBZb3UgYWNjZXB0IGFuZCBzd2ltIGF3YXkgYXMgZmFzdCBhcyBwb3NzaWJsZS4gR29vZCwgSSByYW4gb3V0IG9mIGpva2VzIGZvciB0aGF0IGZhc3QuJylcbiAgICAgICAgICAgIEBzZXRGbGFnKCdkcm92ZV9iaWxseV90b19ob3NwaXRhbCcsIHRydWUpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnZWdnJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY2FsbCBjb3BzJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlIHBvbGljZSBjb21lIGFuZCBhcnJlc3QgQmlsbHkgT2NlYW4gb24gY2hhcmdlIG9mIGJlaW5nIGNvbXBsZXRlbHkgaXJyZWxldmFudCB0byB0aGlzIGdhbWUuIFlvdSBXaW4hIEhpZ2ggU2NvcmUuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0FjaHRpcHVzXFwncyBHYXJkZW4nLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIGlmIEBjb21pbmdGcm9tKFsnQWNodGlwdXNcXCdzIEdhcmRlbiAoSW5zaWRlKSddKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGxlYXZlIHRoZSBnYXJkZW4uIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIGluc2lkZSBvZiB0aGUgZ2FyZGVuLCBub3J0aCB0byBXYXRlciBXb3JsZCwgZWFzdCB0byBzb21lIE9jZWFuIGFuZCBzb3V0aCB0byBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoLicpXG4gICAgICAgICAgICBlbHNlIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0FjaHRpcHVzIGlzIHdvcmtpbmcgYW1vbmcgaGlzIGZsb3dlcnMgYW5kIHNocnVicy4gSGUgc2VlcyB5b3UgYW5kIG9wZW5zIHRoZSBnYXRlIGZvciB5b3UuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIGluc2lkZSBvZiB0aGUgZ2FyZGVuLCBub3J0aCB0byBXYXRlciBXb3JsZCwgZWFzdCB0byBzb21lIE9jZWFuIGFuZCBzb3V0aCB0byBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdBY2h0aXB1cyBpcyBzdGlsbCB3b3JraW5nIGhhcmQgaW4gdGhhdCBnYXJkZW4uIFlvdSBuZWVkIHRvIGdldCBoaW0gYSBnaXJsZnJpZW5kLCBhbmQgdGhlbiBoZSBuZWVkcyB0byBnZXQgWU9VIGEgZ2lybGZyaWVuZC4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgaW5zaWRlIG9mIHRoZSBnYXJkZW4sIG5vcnRoIHRvIFdhdGVyIFdvcmxkLCBlYXN0IHRvIHNvbWUgT2NlYW4gYW5kIHNvdXRoIHRvIGEgc2Nob29sIG9mIEN1dHRsZWZpc2guJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBhY2h0aXB1cycpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyBBY2h0aXB1cy4gSGUgaXMgcHVsbGluZyBvdXQgdGhlIHNlYXdlZWRzIGZyb20gaGlzIHNlYSBjdWN1bWJlciBiZWQuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpIG9yIEBtYXRjaGVzKCdlbnRlcicpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4gKEluc2lkZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2V0dGVyIE9jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0FjaHRpcHVzXFwncyBHYXJkZW4gKEluc2lkZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGVudGVyIHRoZSBnYXJkZW4gYW5kIHNlZSBhIGJvdW50aWZ1bCBkaXNwbGF5IHVuZm9sZCBiZWZvcmUgeW91LiBUaGUgZ2FyZGVuIGV4aXQgaXMgRWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ3RhbGtlZF90b19hY2h0aXB1cycsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIlRoaXMgaXMgcXVpdGUgdGhlIHVtLi4ub2NlYW4gaGlkZWF3YXkgeW91IGhhdmUgaGVyZSxcIiB5b3Ugc2F5LiBcIlllcyxcIiBoZSBzYXlzLCBcIkkgY2FuIHNlZSB5b3UgaGF2ZSBjb21lIGEgbG9uZyB3YXkgdG8gZ2V0IGhlcmUsIGJ1dCBJIGFtIGdsYWQgeW91IGhhdmUgZm91bmQgcmVmdWdlIG9uIG15IGdyb3VuZHMuIElmIHlvdSBzZWUgYW55dGhpbmcgeW91IGxpa2UgaW4gbXkgcGxvdCB3ZSBjb3VsZCBtYWtlIGEgZGVhbCBwZXJoYXBzLlwiJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ09oLCBiYWNrIGFnYWluIFNoYXJjPyBDYW4gSSBpbnRlcmVzdCB5b3UgaW4gYW55IG9mIHRoZSBpdGVtcyBpbiBteSBmaW5lIGdhcmRlbj8nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgYWNodGlwdXMnKVxuICAgICAgICAgICAgQHByaW50KCdJdFxcJ3MgQWNodGlwdXMuIEhlIGlzIHB1bGxpbmcgb3V0IHRoZSBzZWF3ZWVkcyBmcm9tIGhpcyBzZWEgY3VjdW1iZXIgYmVkLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBnYXJkZW4nKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc2VlIHdhdGVybWVsb25zLCB3YXRlciBjaGVzdG51dHMsIGFzc29ydGVkIGZsb3dlcnMsIHNlYSBjdWN1bWJlcnMgYW5kIHN0cmF3YmVycmllcy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHdhdGVybWVsb25zJykgb3IgQG1hdGNoZXMoJ3Rha2Ugd2F0ZXJtZWxvbnMnKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugb25seSBlYXQgc2VlZGxlc3MgYW5kIHRoZXNlIGFyZSB0aGUgZXh0cmEgc2VlZCB2YXJpZXR5LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY2hlc3RudXRzJykgb3IgQG1hdGNoZXMoJ3Rha2UgY2hlc3RudXRzJylcbiAgICAgICAgICAgIEBwcmludCgnV2F0ZXIgY2hlc3RudXRzPyBJcyB0aGF0IGV2ZW4gYSB0aGluZz8nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGN1Y3VtYmVycycpIG9yIEBtYXRjaGVzKCd0YWtlIGN1Y3VtYmVycycpXG4gICAgICAgICAgICBAcHJpbnQoJ1NvYWsgaXQgaW4gYnJpbmUgZm9yIGEgY291cGxlIHdlZWtzLCB0aGVuIGNvbWUgYmFjayB0byBtZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHN0cmF3YmVycmllcycpIG9yIEBtYXRjaGVzKCd0YWtlIHN0cmF3YmVycmllcycpIG9yIEBtYXRjaGVzKCdsb29rIHN0cmF3YmVycnknKSBvciBAbWF0Y2hlcygndGFrZSBzdHJhd2JlcnJ5JylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHNlbnNlIGEgc3VycmVhbGlzdGljIHZpYmUgY29taW5nIGZyb20gdGhvc2Ugc3RyYXdiZXJyaWVzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmbG93ZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHNwZW5kIHRvbyBtdWNoIHRpbWUgYXQgdGhlIGd5bSBhbmQgdGhlIGZpcmluZyByYW5nZSB0byBhcHByZWNpYXRlIGZsb3dlcnMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGZsb3dlcnMnKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ2dpdmVuX3VtYnJlbGxhJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSSBjYW4gc2VlIHlvdSBsaWtlIHRoZSBmbG93ZXJzLiBJIHdpbGwgbGV0IHlvdSBoYXZlIHRoZW0gaWYgeW91IGNhbiBmaW5kIHNvbWV0aGluZyB0byBrZWVwIGl0IGZyb20gZ2V0dGluZyBzbyBob3QgaGVyZS4gSSB3b3VsZCBiZSBhYmxlIHRvIGRvIHR3aWNlIGFzIG11Y2ggd29yayBpZiBpdCB3ZXJlIGEgYml0IGNvb2xlci5cIicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIllvdSBoYXZlIGdyZWF0IHRhc3RlLiBUaGVzZSBmbG93ZXJzIGFyZSByZWFsbHkgdmVyc2F0aWxlIGFuZCB3aWxsIGJlIGdvb2QganVzdCBhYm91dCBhbnl3aGVyZS5cIicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ2Zsb3dlcnMnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dpdmUgdW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdcIlRoaXMgd2lsbCBiZSBwZXJmZWN0IGZvciBibG9ja2luZyBvdXQgdGhhdCBzdW7igJlzIGhhcnNoIHJheXMuIFRoYW5rcyFcIicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgndW1icmVsbGEnKVxuICAgICAgICAgICAgQHNldEZsYWcoJ2dpdmVuX3VtYnJlbGxhJywgdHJ1ZSlcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0Jykgb3IgQG1hdGNoZXMoJ2V4aXQnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHN3aW0gdXAgdG8gdGhlIHJ1aW5zIG9mIHlvdXIgb2xkIHdvcmsgcGxhY2UuIFRoaXMgcGxhY2UgaGFzIHNlZW4gYmV0dGVyIGRheXMuIFlvdXIgbWluZCBpcyBmbG9vZGVkIHdpdGggbWVtb3JpZXMgb2YgZmxvYXRpbmcgaW4gZnJvbnQgb2YgdGhlIG9sZCBncmlsbCBhbmQgY29taW5nIHVwIHdpdGggbmV3IHJlY2lwZXMgdG8gdHJ5IHdoZW4geW91ciBtYW5hZ2VyIGhhZCBoaXMgYmFjayB0dXJuZWQuIFRoZW4gc29tZW9uZSBzYWlkIFwiRXZlciB0cmllZCBhbiBNLTgwIGJ1cmdlcj8gSSBoYXZlIGVub3VnaCBmb3IgZXZlcnlvbmUuXCIgVGhlIHdvcmRzIGVjaG8gaW4geW91ciBtaW5kIGxpa2UgYSBwaGFudG9tIHdoaXNwZXIgb2YgYWdlcyBwYXN0LiBDdXR0bGVmaXNoIHN0b21waW5nIGdyb3VuZHMgbGllIGVhc3QuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1doYXQgaXMgbGVmdCBvZiB0aGUgU3RlYWsgYW5kIFNoYWtlIGJ1aWxkaW5nIHlvdSB1c2VkIHRvIHdvcmsgYXQgYmVmb3JlIHlvdXIgZnJpZW5kIGV4cGxvZGVkIGl0IHRyeWluZyB0byBtYWtlIGZpcmV3b3JrIHNhbmR3aWNoZXMuIEN1dHRsZWZpc2ggc3RvbXBpbmcgZ3JvdW5kcyBsaWUgZWFzdC4nKVxuICAgICAgICBlbHNlIGlmIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoXCJJdCdzIHRoZSBydWlucyBvZiB0aGUgb2xkIFN0ZWFrIGFuZCBTaGFrZSB5b3UgdXNlZCB0byB3b3JrIGF0IHVudGlsIHlvdXIgZnJpZW5kIGJsZXcgaXQgdXAuIFRoZSB0YXR0ZXJlZCByZW1uYW50cyBvZiBhIHJlZCBhbmQgd2hpdGUgYXduaW5nIGZsdXR0ZXJzIGluIHRoZSB3aW5kIGFzIGlmIHRvIHN1cnJlbmRlciB0byBhbiBlbmVteS4gV2hhdCBpcyBsZWZ0IG9mIGEgZG9vciBoYW5ncyBvbiBhIHNpbmdsZSBoaW5nZSB0byB0aGUgd2VzdC4gQ3V0dGxlZmlzaCBzdG9tcGluZyBncm91bmRzIGxpZSBlYXN0LlwiKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgc3RlYWsnKSBvciBAbWF0Y2hlcygnbG9vayBzaGFrZScpIG9yIEBtYXRjaGVzKCdsb29rIGJ1aWxkaW5nJylcbiAgICAgICAgICAgIEBwcmludCgnWW91ciBtZW1vcmllcyBvZiB0aGlzIHBsYWNlIGRvblxcJ3QgcXVpdGUgbWF0Y2ggd2hhdCBpdCBpcyBub3cuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0Jykgb3IgQG1hdGNoZXMoJ29wZW4gZG9vcicpIG9yIEBtYXRjaGVzKCdlbnRlcicpIG9yIEBtYXRjaGVzKCdpbicpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcbiAgICAgICAgICAgIFxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0FzIHlvdSBhcHByb2FjaCwgdGhlIGRvb3IgZmFsbHMgY2xlYW4gb2ZmIGFzIGlmIHRvIHdhcm4geW91IGFnYWluc3QgZW50cnkuIE5ldmVyIGJlaW5nIG9uZSBmb3Igb21lbnMsIHlvdSBpZ25vcmUgaXQuIEluc2lkZSB5b3UgZGlzY292ZXIgdGhpbmdzIG11Y2ggYXMgeW91IHJlbWVtYmVyIHRoZW0uIFRoYXQgaXMsIGlmIHRoZXkgaGFkIGJlZW4gbWF1bGVkIGJ5IGEgYmVhciB3aXRoIGJsZW5kZXJzIGZvciBoYW5kcyB3aG8gcHJvY2VlZGVkIHRvIHNldCBvZmYgYSBzZXJpZXMgb2YgcGxhc3RpYyBleHBsb3NpdmVzLiBUbyB0aGUgc291dGggdGhlcmUgYXJlIHNvbWUgdGFibGVzIGFuZCBjaGFpcnMsIG5vcnRoIGxpZXMgdGhlIGtpdGNoZW4sIGFuZCB3ZXN0IGEgc29kYSBmb3VudGFpbi4gVGhlIG91dGRvb3JzIGlzIEVhc3QuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIGFyZSBzb21lIGJhdHRlcmVkIHRhYmxlcyBhbmQgY2hhaXJzIHNvdXRoLCBhIGtpdGNoZW4gbm9ydGgsIGFuZCBhIHNvZGEgZm91bnRhaW4gd2VzdC4gWW91IGNhbiBleGl0IEVhc3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRGluaW5nIEFyZWEpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU29kYSBGb3VudGFpbiknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKERpbmluZyBBcmVhKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdBIGRpbGFwaWRhdGVkIGRpbmluZyBhcmVhIGxpZXMgYmVmb3JlIHlvdS4gSXQgaXMgY29tcGxldGVseSB1bnJlbWFya2FibGUuIFRoZXJlIGlzIG5vd2hlcmUgdG8gZ28gYmVzaWRlcyBub3J0aCB0byB0aGUgd2F5IHlvdSBjYW1lLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdXZWxjb21lIHRvIHRoZSBraXRjaGVuLiBTaW5jZSB0aGUgd2FsbHMgaGF2ZSBhbGwgYmVlbiBibG93biBhd2F5IG9yIGRpc3NvbHZlZCwgdGhlIG9ubHkgdGhpbmcgdGhhdCBzZXBhcmF0ZXMgaXQgZnJvbSB0aGUgcmVzdCBvZiB0aGUgcGxhY2UgaXMgdGhlIG92ZW4gYW5kIHN0b3ZlIHRvcC4gU291dGggbGVhZHMgYmFjayB0byB0aGUgbWFpbiBlbnRyeSBhcmVhLiBTb3V0aCBnb2VzIGJhY2sgdG8gdGhlIGRvb3J3YXkuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBvdmVuJykgb3IgQG1hdGNoZXMoJ29wZW4gb3ZlbicpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ3NvZGEnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnQ2hlY2sgaXQgb3V0LCBpdFxcJ3MgeW91ciBmYXZvcml0ZSBwb3AsIGEgQ2hlcnJ5IE9yYW5nZSBTbm96emJlcnJ5IExpbWUgUGFzc2lvbmZydWl0IFZhbmlsbGEgQ3JvYWsgaW4gdGhlIG92ZW4uIFdobyBldmVyIHRob3VnaHQgb2YgYmFraW5nIGEgY2FuIG9mIHNvZGE/IFNvdXRoIGxlYWRzIGJhY2sgdG8gdGhlIG1haW4gZW50cnkgYXJlYS4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIG92ZW4gaXMgZW1wdHkuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjbG9zZSBvdmVuJylcbiAgICAgICAgICAgIEBwcmludCgnSG93IHJlc3BvbnNpYmxlIG9mIHlvdS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2Ugc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBnb3Qgc29kYS4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3NvZGEnKVxuXG4gICAgICAgIGVsc2UgaWYgQGZsYWdJcygnaGF2ZV9hbGxfaXRlbXMnLCB0cnVlKVxuICAgICAgICAgICAgaWYgQG1hdGNoZXMoJ21ha2UgcGFuY2FrZXMnKVxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnXCJXaGVyZSBkbyBJIHN0YXJ0P1wiIHlvdSB3b25kZXIgb3V0IGxvdWQuIElmIG9ubHkgdGhlcmUgd2VyZSB3cml0dGVuIHNlcmllcyBvZiBpbnN0cnVjdGlvbnMgZ3VpZGluZyB5b3UgdGhyb3VnaC4gV2hlcmUgd291bGQgeW91IGZpbmQgc29tZXRoaW5nIGxpa2UgdGhhdD8nKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdVxcJ3JlIHBvbmRlcmluZyB0aGlzIHdoZW4gYSBkcmFmdCBjb21lcyBvdmVyIHlvdS4gVGhlIGxpZ2h0cyBmbGlja2VyIG9uIGFuZCBvZmYuIFlvdSBzZW5zZSBhIG15c3RlcmlvdXMgcHJlc2VuY2UuIFRoZSBnaG9zdCBvZiB5b3VyIG9sZCBmcmllbmQgQ3JlZ2dsZXMgYXBwZWFycyBiZWZvcmUgeW91LiBBcHBhcmVudGx5IGhlIGlzIGhhdW50aW5nIHRoZSBTdGVhayBhbmQgU2hha2Ugbm93IGFuZCB5b3VcXCdyZSBhbGwgbGlrZSBcIkNyZWdnbGVzLCBkaWRuXFwndCB3ZSBqdXN0IGhhbmcgb3V0IHRoZSBvdGhlciBkYXk/IEhvdyBhcmUgeW91IGEgZ2hvc3QgYWxyZWFkeT9cIicpXG4gICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCc8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiTmV2ZXIgeW91IG1pbmQgdGhhdCBub3dcIjwvc3Bhbj4gaGUgc2F5cyBpbiBoaXMgY3JlZXB5IG5lcmQgdm9pY2UuIDxzcGFuIGNsYXNzPVwiY3JlZXB5XCI+XCJTaGFyYywgaWYgeW91IGhvcGUgdG8gc2F2ZSB0aGUgd29ybGQgZnJvbSBjZXJ0YWluIGRvb20sIHlvdSBtdXN0IHN1Y2NlZWQgaW4gbWFraW5nIHRoZXNlIHBhbmNha2VzLiBVc2UgdGhpcyBhbmNpZW50IHJlY2lwZSBoYW5kZWQgZG93biBmcm9tIHRoZSBhbmNpZW50cyB0byBhaWQgeW91LlwiPC9zcGFuPiBBbiBvbGQsIGJhdHRlcmVkIHBpZWNlIG9mIHBhcGVyIGZsb2F0cyBkb3duIGxhbmRpbmcgYmVmb3JlIHlvdSBcIlN3ZWV0IE1lZW1hd3MgU3dlZXR5IFN3ZWV0IEZsYXBqYWNrc1wiIGl0IHJlYWRzLiA8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiTm93IG15IHdvcmsgaXMgZG9uZSBhbmQgSSBjYW4gYXNjZW5kIHRvIG15IHN0ZXBtb21cXCdzIGhvdXNlIGZvciBncmlsbGVkIGNoZWVzZSBzYW5kd2ljaGVzIGFuZCBjaG9jb2xhdGUgbWlsay5cIjwvc3Bhbj4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdZb3UgcmVhZCB0aGUgcmVjaXBlLiBJdCBpcyBhbGwgaW4gcmlkZGxlcy4gWW91IGhvcGUgeW91IGFyZSB1cCB0byB0aGUgdGFzay4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBhbiBlbXB0eSBib3dsIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYW4gZW1wdHkgYm93bCBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdJbiBhbiB1cm4gdGFrZSBidXQgbm90IGNodXJuIGl0ZW1zIHR3byBub3QgbGlrZSBnb28uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb2RhJykgYW5kIEBoYXNJdGVtKCdzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHB1dCB0aGUgc29kYSBpbnRvIHRoZSBib3dsLicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnSXQgbG9va3MgbGlrZSBzb21ldGhpbmcgaXMgc3RpbGwgbWlzc2luZy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Zsb3dlcnMnKSBhbmQgQGhhc0l0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgcHV0IHRoZSBmbG91ciBpbnRvIHRoZSBib3dsLicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnc29kYScpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnSXQgbG9va3MgbGlrZSBzb21ldGhpbmcgaXMgc3RpbGwgbWlzc2luZy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvZGEgZmxvd2VycycpIGFuZCBAaGFzSXRlbSgnc29kYScpIGFuZCBAaGFzSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBwb3dkZXIgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91ciBwb3Rpb24gaXMgZHJ5LiBUaGlzIHdpbGxzdCBub3QgZmx5LiBXaGF0XFwncyBuZXh0IG11c3QgYmUgZHVtcGVkLCBwb3VyZWQgYW5kIGNyYWNrZWQgZm9yIGEgcHJvcGVyIGZsYXBqYWNrLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21pbGsgZWdnJykgb3IgQG1hdGNoZXMoJ21pbGsgbWFyZ2FyaW5lJykgb3IgQG1hdGNoZXMoJ2VnZyBtYXJnYXJpbmUnKVxuICAgICAgICAgICAgQHByaW50KCdTbG93IGRvd24gdGhlcmUgcGFydG5lciwgSSBjYW4gb25seSBoYW5kbGUgc28gbWFueSB0aGluZ3MgYXQgb25jZS4gVGVsbCB0aGVtIHRvIG1lIG9uZSBhdCBhIHRpbWUgcGxlYXNlLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21pbGsnKSBhbmQgQGhhc0l0ZW0oJ21pbGsnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgcHV0IHRoZSBtaWxrIGludG8gdGhlIGJvd2wuJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdtaWxrJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5IGl0IGxvb2tzIGxpa2UgdGhhdCB3b3JrZWQhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgaWYgKG5vdCBAaGFzSXRlbSgnZWdnJykpIGFuZCAobm90IEBoYXNJdGVtKCdtYXJnYXJpbmUnKSlcbiAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBzbGlnaHRseSBtb3JlIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnSXQgbG9va3MgbGlrZSBzb21ldGhpbmcgaXMgc3RpbGwgbWlzc2luZy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdtYXJnYXJpbmUnKSBhbmQgQGhhc0l0ZW0oJ21hcmdhcmluZScpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5IGl0IGxvb2tzIGxpa2UgdGhhdCB3b3JrZWQhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgaWYgKG5vdCBAaGFzSXRlbSgnbWlsaycpKSBhbmQgKG5vdCBAaGFzSXRlbSgnZWdnJykpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ0l0IGxvb2tzIGxpa2Ugc29tZXRoaW5nIGlzIHN0aWxsIG1pc3NpbmcuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWdnJykgYW5kIEBoYXNJdGVtKCdlZ2cnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ2VnZycpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIChub3QgQGhhc0l0ZW0oJ21pbGsnKSkgYW5kIChub3QgQGhhc0l0ZW0oJ21hcmdhcmluZScpKVxuICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdJdCBsb29rcyBsaWtlIHNvbWV0aGluZyBpcyBzdGlsbCBtaXNzaW5nLicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdDdXR0aW5nIGFuZCBzY29vcGluZyBzaGFsbCBoYXZlIHRoZWlyIGRheSwgYnV0IGEgZm9yIGEgZmluZSBmbHVmZnkgYmF0dGVyIHRoZXJlIGJlIGJ1dCBvbmUgd2F5LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N0aXInKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBtaXhlZCBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NoYWtlJylcbiAgICAgICAgICAgIEBwcmludCgnRHVkZSwgd2hvIGRvIHlvdSB0aGluayB5b3UgYXJlLCBKYW1lcyBCb25kPyAgVGhpcyBiYXR0ZXIgbmVlZHMgdG8gYmUgc3RpcnJlZCwgbm90IHNoYWtlbi4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIG1peGVkIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1NldCB0aGUgZ3JpZGRsZSBvciBzdG92ZSB0byBtZWRpdW0gaGVhdC4gQWZ0ZXIgaXQgaXMgd2FybWVkLCBkcm9wIGJhdHRlciBhIHF1YXJ0ZXIgY3VwIGF0IGEgdGltZSBhbmQgdHVybmluZyBvbmNlIHVudGlsIGJ1YmJsZXMgYXBwZWFyLiBcIldlbGwgdGhhdCBzZWVtcyBwcmV0dHkgY2xlYXIuIEkgdGhpbmsgSSBjYW4gZG8gdGhhdCBvbiBteSBvd24uXCInKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBwbGF0ZSBvZiBkcnkgcGFuY2FrZXMgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBwbGF0ZSBvZiBkcnkgcGFuY2FrZXMgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGVuIG1pbnV0ZXMgbGF0ZXIgdGhlIHBhbmNha2VzIGFyZSBmaW5pc2hlZCwgYnV0IHNvbWV0aGluZyBpcyBtaXNzaW5nLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N5cnVwJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBnb3QgcGFuY2FrZXMhICBIb3QgZGFuZy4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU29kYSBGb3VudGFpbiknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHNlZSB0aGF0IHRoZSBzb2RhIGZvdW50YWluIGhhcyBzb21laG93IHJlbWFpbmVkIGxhcmdlbHkgdW5kYW1hZ2VkLiBZb3UgdGhpbmsgYmFjayB0byB0aGUgZGF5cyB3aGVuIHlvdSB3b3VsZCBzbmVhayBvdXQgYmFncyBvZiBwbGFpbiBzeXJ1cCB0byBkcmluayBhbmQgdGhlIGZyZWFraXNoIHdha2luZyBkcmVhbXMgaXQgd291bGQgaW5kdWNlIGluIHlvdS4gWW91IHdvbmRlciBpZiB0aGVyZSBpcyBhbnkgc3RpbGwgaW4gdGhlcmUuIFRoZSBFYXN0IGRvb3IgZ29lcyBiYWNrIHRvIHRoZSBtYWluIGFyZWEuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmb3VudGFpbicpIG9yIEBtYXRjaGVzKCdvcGVuIGZvdW50YWluJykgb3IgQG1hdGNoZXMoJ2xvb2sgc29kYScpIG9yIEBtYXRjaGVzKCdvcGVuIHNvZGEnKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICAgICAgQHByaW50KCdBdmFzdCwgYSBoaWRkZW4gdHJlYXN1cmUgdHJvdmUgb2Ygc3VnYXJ5IHdvbmRlciB0aGF0IGhhcyBsYWluIGRvcm1hbnQgYWxsIHRoZXNlIHllYXJzISBZb3UgdHJlbWJsZSBhdCB0aGUgYmVhdXR5IG9mIHRoZSBzaWdodCBiZWZvcmUgeW91LiBTbyBtYW55IGJhZ3MgYW5kIHlldCB5b3VyIG1hZ2ljIGhhbW1lcnNwYWNlIHNhdGNoZWwgd2lsbCBvbmx5IGFsbG93IGZvciBvbmUuIFRoZXJlXFwncyBTcHJpdHosIFByb2Zlc3NvciBHaW5nZXIsIENhY3R1cyBMYWdlciwgYW5kIE1zLiBTaGltIFNoYW1cXCdzIE1hcGxlIFNvZGEuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyB0aGF0IHNvZnQgZHJpbmsgZGlzcGVuc2VyIHlvdSBnb3QgYSBiYWcgb2Ygc3lydXAgZnJvbS4nKVxuXG4gICAgICAgIGVsc2UgaWYgbm90IEBoYXNJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICBpZiBAbWF0Y2hlcygndGFrZSBzcHJpdHonKSBvciBAbWF0Y2hlcygnbG9vayBzcHJpdHonKVxuICAgICAgICAgICAgICAgIEBwcmludCgnU3ByaXR6LCBBIHJlZnJlc2hpbmcgYmxhc3Qgb2YgcGlja2xlIGFuZCBjZWxlcnk/IE5vIHdheS4nKVxuICAgICAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBwcm9mZXNzb3InKSBvciBAbWF0Y2hlcygndGFrZSBnaW5nZXInKSBvciBAbWF0Y2hlcygnbG9vayBwcm9mZXNzb3InKSBvciBAbWF0Y2hlcygnbG9vayBnaW5nZXInKVxuICAgICAgICAgICAgICAgIEBwcmludCgnUHJvZmVzc29yIGdpbmdlciwgNzIgZmxhdm9ycyBhbmQgYWxsIG9mIHRoZW0gbWFrZSBtZSBsb25nIGZvciBhIHF1aWNrIGRlYXRoLiBOb3BlIG5vcGUgbm9wZS4nKVxuICAgICAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBjYWN0dXMnKSBvciBAbWF0Y2hlcygndGFrZSBsYWdlcicpIG9yIEBtYXRjaGVzKCdsb29rIGNhY3R1cycpIG9yIEBtYXRjaGVzKCdsb29rIGxhZ2VyJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0NhY3R1cyBsYWdlciwgWW91IHRoaW5rIHlvdSBzZWUgc29tZSBuZWVkbGVzIGZsb2F0aW5nIGluIHRoZXJlLiBDb21lIG9uIG1hbi4nKVxuXG4gICAgICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1hcGxlJykgb3IgQG1hdGNoZXMoJ2xvb2sgc2hpbScpIG9yIEBtYXRjaGVzKCdsb29rIHNoYW0nKSBvciBAbWF0Y2hlcygnbG9vayBtcycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZdW0geXVtIHNvZGEgdGhpcyBvbmVzIGxvb2tzIHRhc3R5LicpXG5cbiAgICAgICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbWFwbGUnKSBvciBAbWF0Y2hlcygndGFrZSBzaGltJykgb3IgQG1hdGNoZXMoJ3Rha2Ugc2hhbScpIG9yIEBtYXRjaGVzKCd0YWtlIG1zJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBmaW5kIGl0IHNob2NraW5nIHRoYXQgeW91IGFyZSB0aGUgZmlyc3QgcmFpZGVyIG9mIHRoaXMgc29kYSB0b21iLiBCdXQgdGhlbiBhZ2FpbiwgeW91IGhhdmUgYWx3YXlzIHNhaWQgcGVvcGxlIGRvblxcJ3Qga25vdyB0aGUgdmFsdWUgb2YgYSBiYWcgb2YgbGlxdWlkIHN1Z2FyLicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ3N5cnVwJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZScpIG9yIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1l1cCB0aGVyZSBpcyBhIGxvdCBvZiBzb2RhIGluIHRoZXJlLCBidXQgeW91IGFscmVhZHkgcGlja2VkIG9uZS4gTm93IGdvIGxpdmUgd2l0aCB5b3VyIGNob2ljZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCcsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGp1c3Qgd2Fsa2VkIG9udG8gdGhlIHNldCBvZiB0aGUgd2lsZGx5IHBvcHVsYXIgZ2FtZSBzaG93LCBcIlNlYWwgb3IgTm8gU2VhbCFcIiBXaGVyZSBmbGFtYm95YW50IGNvbnRlc3RhbnRzIGZsYWlsIGFyb3VuZCBhbmQgc2hvdXQgd2hpbGUgdHJ5aW5nIHRvIGFycml2ZSBhdCB0aGUgYW5zd2VyIHRvIHRoYXQgYWdlIG9sZCBxdWVzdGlvbi4uLlNFQUwgT1IgTk8gU0VBTD8gVG8gdGhlIGVhc3QgaXMgYmFja3N0YWdlLCBub3J0aCB3aWxsIHRha2UgeW91IHRvIHRoZSBkcmVzc2luZyByb29tLCB3ZXN0IHRvIHNvbWUgb2NlYW4sIGFuZCBzb3V0aCB0byBCaWxseSBPY2Vhbi4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBvbiB0aGUgc2V0IGZvciBTZWFsIG9yIG5vIFNlYWwsIHRoZSBnYW1lIHNob3cuIFlvdSBqdXN0IHJlYWxpemVkIHlvdSBtdXN0IGZpbmQgYSB3YXkgdG8gYmVjb21lIGEgY29udGVzdGFudCBvciB5b3VyIGxpZmUgd2lsbCBoYXZlIGJlZW4gd2FzdGVkLiBUbyB0aGUgZWFzdCBpcyBiYWNrc3RhZ2UsIG5vcnRoIHdpbGwgdGFrZSB5b3UgdG8gdGhlIGRyZXNzaW5nIHJvb20sIHdlc3QgdG8gc29tZSBvY2VhbiwgYW5kIHNvdXRoIHRvIEJpbGx5IE9jZWFuLicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnT2ggd293ISBTZWFsIG9yIG5vIFNlYWwhIFlvdSBsb3ZlIGl0IHdoZW4gdGhlIGhvc3QgbG9va3MgcmlnaHQgYXQgdGhlIGNhbWVyYSBhbmQgc2F5cyB0aGF0LiBJdOKAmXMgc28gaW50ZW5zZS4gVGhlcmUgaGFzIHRvIGJlIHNvbWUgd2F5IHRvIGdldCBvbiB0aGlzIHNob3cuIFRvIHRoZSBlYXN0IGlzIGJhY2tzdGFnZSwgbm9ydGggd2lsbCB0YWtlIHlvdSB0byB0aGUgZHJlc3Npbmcgcm9vbSwgd2VzdCB0byBzb21lIG9jZWFuLCBhbmQgc291dGggdG8gQmlsbHkgT2NlYW4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQmlsbHkgT2NlYW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIHBsYWNlIGlzIGdyZWF0ISBJdCB3b3VsZCBiZSBlYXN5IHRvIGNvYmJsZSB0b2dldGhlciBhIGNvc3R1bWUgdG8gZ2V0IG9uIHRoYXQgc2hvdy4gTGV0cyBzZWUgd2hhdCB3ZSBjYW4gZmluZC4gT2J2aW91cyBleGl0cyBhcmUgc291dGggdG8gdGhlIHNob3cgZW50cmFuY2UuJylcbiAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjb3N0dW1lJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBIZWFkZ2VhciknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgSGVhZGdlYXIpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0xldFxcJ3Mgc3RhcnQgd2l0aCBoZWFkZ2Vhci4gWW91IHNlZSBhIGNvd2JveSBoYXQsIGEgcmFpbmJvdyB3aWcsIGEgbW90b3JjeWNsZSBoZWxtZXQsIGFuZCBhIHN0b3ZlcGlwZSBoYXQuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjb3dib3kgaGF0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjb3dib3kgaGF0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBDbG90aGVzKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygncmFpbmJvdyB3aWcnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3JhaW5ib3cgd2lnJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBDbG90aGVzKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBDbG90aGVzKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3RvdmVwaXBlIGhhdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnc3RvdmVwaXBlIGhhdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcyknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcyknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnTm93IHNlbGVjdCBhIHNldCBvZiBjbG90aGVzLiBZb3Ugc2VlIGEgY293IHByaW50IHZlc3QsIGEgY2xvd24gc3VpdCwgYSBsZWF0aGVyIGphY2tldCwgYW5kIGFuIG9sZHRpbWV5IHN1aXQgd2l0aCBvbmUgb2YgdGhvc2UgQ29sb25lbCBTYW5kZXJzIHRpZXMnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdsZWF0aGVyIGphY2tldCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY2xvd24gc3VpdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY2xvd24gc3VpdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnb2xkdGltZXkgc3VpdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnb2xkdGltZXkgc3VpdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY293IHZlc3QnKSBvciBAbWF0Y2hlcygncHJpbnQgdmVzdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY293IHByaW50IHZlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIEFjY2Vzc29yeSknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScsIC0+XG4gICAgICAgIGRvbmUgPSAnWW91IGxvb2sgYWJzb2x1dGVseSBob3JyaWJsZSEgT3IgYW1hemluZywgZGVwZW5kaW5nIG9uIHlvdXIgcGVyc3BlY3RpdmUuIEJ1dCB0aGUgdHJ1ZSBqdWRnZSB3aWxsIGJlIHRoZSBnYW1lIHNob3cgbWFuYWdlci4nXG5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0FjY2Vzc29yaXplISBQaWNrIGZyb20gYSBndW4gYmVsdCwgYSBydWJiZXIgY2hpY2tlbiwgYSBtZXRhbCBjaGFpbiwgYW5kIGEgZmFrZSBiZWFyZC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Zha2UgYmVhcmQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Zha2UgYmVhcmQnKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ3VuIGJlbHQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21ldGFsIGNoYWluJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdtZXRhbCBjaGFpbicpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdydWJiZXIgY2hpY2tlbicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgY29zdHVtZU1hdGNoZXMgPSAoZW5naW5lKSAtPlxuICAgICAgICBncm91cDEgPSAwXG4gICAgICAgIGdyb3VwMiA9IDBcbiAgICAgICAgZ3JvdXAzID0gMFxuICAgICAgICBncm91cDQgPSAwXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Nvd2JveSBoYXQnKSB0aGVuIGdyb3VwMSsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjb3cgcHJpbnQgdmVzdCcpIHRoZW4gZ3JvdXAxKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2d1biBiZWx0JykgdGhlbiBncm91cDErK1xuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdyYWluYm93IHdpZycpIHRoZW4gZ3JvdXAyKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Nsb3duIHN1aXQnKSB0aGVuIGdyb3VwMisrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdydWJiZXIgY2hpY2tlbicpIHRoZW4gZ3JvdXAyKytcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKSB0aGVuIGdyb3VwMysrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdsZWF0aGVyIGphY2tldCcpIHRoZW4gZ3JvdXAzKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ21ldGFsIGNoYWluJykgdGhlbiBncm91cDMrK1xuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdzdG92ZXBpcGUgaGF0JykgdGhlbiBncm91cDQrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnb2xkdGltZXkgc3VpdCcpIHRoZW4gZ3JvdXA0KytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Zha2UgYmVhcmQnKSB0aGVuIGdyb3VwNCsrXG5cbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KGdyb3VwMSwgZ3JvdXAyLCBncm91cDMsIGdyb3VwNClcblxuICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyA9IChlbmdpbmUpIC0+XG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjb3dib3kgaGF0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3JhaW5ib3cgd2lnJylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3N0b3ZlcGlwZSBoYXQnKVxuXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjb3cgcHJpbnQgdmVzdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjbG93biBzdWl0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ29sZHRpbWV5IHN1aXQnKVxuXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdndW4gYmVsdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdydWJiZXIgY2hpY2tlbicpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdtZXRhbCBjaGFpbicpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdmYWtlIGJlYXJkJylcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIGlzIHRoZSBzdGFnZS4gSXQgaXMganVzdCBhcyBzdHVwaWQgbG9va2luZyBhcyB0aGUgcmVzdCBvZiB0aGUgc2hvdy4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgc2hvd1xcJ3MgZW50cmFuY2UuIFRoZSBzaG93IG1hbmFnZXIgc3RhcmVzIGF0IHlvdSBxdWVzdGlvbmluZ2x5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayBtYW5hZ2VyJylcbiAgICAgICAgICAgIHN3aXRjaCBjb3N0dW1lTWF0Y2hlcyhAKVxuICAgICAgICAgICAgICAgIHdoZW4gMFxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgYXBvbG9naXplcywgXCJJIGFtIHNvcnJ5IHNpciwgeW91IGxvb2sgbGlrZSBhIGRlY2VudCBraW5kIG9mIHBlcnNvbiwgYW5kIElcXCdtIGFmcmFpZCB3ZSBoYXZlIG5vIHBsYWNlIGZvciB0aGF0IG9uIHRlbGV2aXNpb24uIE1heWJlIGlmIHlvdSBjYW1lIGJhY2sgZHJlc3NlZCBsaWtlIGEgbWFuaWFjIHdlIGNvdWxkIHdvcmsgc29tZXRoaW5nIG91dC4nKVxuICAgICAgICAgICAgICAgIHdoZW4gM1xuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgbG9va3MgeW91IG92ZXIsIG5vdGljaW5nIGdvb2QgdGFzdGUsIHlvdXIga25hY2sgZm9yIGZsYWlyIGFuZCBhdHRlbnRpb24gdG8gZGV0YWlsLiBIZSBkZWNsYXJlcyBcIldlbGwsIEkgYXBwcmVjaWF0ZSB5b3UgdGFraW5nIHRpbWUgdG8gYXNzZW1ibGUgdGhlIGNvc3R1bWUsIGJ1dCBpdCBpcyBqdXN0IGEgYml0IHRvbyBvcmRlcmx5LiBZb3UgcmVhbGx5IGFyZW5cXCd0IHdoYXQgd2UgYXJlIGxvb2tpbmcgZm9yLlwiJylcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgd2hlbiAyXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIHNob3cgbWFuYWdlciBsb29rcyBwbGVhc2VkLCB5ZXQgYSB0b3VjaCB0cm91YmxlZC4gXCJZb3UgbG9vayB0byBiZSBhIG1hbiBnb2luZyBpbiB0aGUgcmlnaHQgZGlyZWN0aW9uLCBidXQgd2Ugb25seSBzZWxlY3QgdGhlIGJlc3Qgb2YgdGhlIGJlc3QgZm9yIFNlYWwgb3Igbm8gU2VhbC4gWW91ciBjb3N0dW1lIGlzIG5vdCBxdWl0ZSByZWFkeSBmb3IgdGhlIGJpZyBzaG93IHlldC4nKVxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgICAgICB3aGVuIDFcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk9oLCB3b3chXCIgRXhjbGFpbXMgdGhlIHNob3cgbWFuYWdlci4gXCJZb3UgbG9vayBhYnNvbHV0ZWx5IGF3ZnVsLiBZb3UgZGVmaW5pdGVseSBoYXZlIHRoZSBsb29rIGZvciBvdXIgc2hvdy5cIiBZb3Ugc3RhcnQgdG8gZGFuY2UgYXJvdW5kLCB3aG9vcGluZyBhbmQgaG9sbGVyaW5nLCBkZWNsYXJpbmcgeW91cnNlbGYgdGhlIGZ1dHVyZSBraW5nIG9mIHRoZSB3b3JsZC4gXCJBbmQgSSBzZWUgeW91IGhhdmUgdGhlIGNoYXJpc21hIHRvIG1hdGNoLlwiIEhlIHR1cm5zIHRvIGhpcyBhc3Npc3RhbnQsIFwiR2V0IHRoaXMgZmVsbGEgb24gc3RhZ2UgYXQgb25jZS4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKE9uIFN0YWdlISknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChPbiBTdGFnZSEpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiV2VsY29tZSBiYWNrIHRvIHRoZSBTZWFsIG9yIE5vIFNlYWwsIHRoZSBtb3N0IHBvcHVsYXIgZ2FtZSBzaG93IHVuZGVyIHRoZSBzZWEhIElcXCdtIHlvdXIgd2VsbCB0YW5uZWQgaG9zdCBKZXJyeSBaaW50ZXJ2YW5kZXJiaW5kZXJiYXVlciBKci4gTGV0XFwncyBtZWV0IG91ciBuZXh0IGNvbnRlc3RhbnQ6IFNoYXJjISBBbiBpbmNyZWRpYmx5IG9ibm94aW91cyB5ZXQgcGVyc3Vhc2l2ZSB5b3VuZyBvY2VhbiBkd2VsbGVyLCBoZSBsb3ZlcyBhbm5veWluZyBoaXMgZnJpZW5kcyBhbmQgaXMgYWx3YXlzIHVwIGZvciBhIHJvdW5kIG9mIFNjcmFiYmxlLCBMQURJRVMuIFRpbWUgdG8gZ2V0IHN0YXJ0ZWQuIE5vdywgU2hhcmMgSSBhbSBnb2luZyB0byBwcmVzZW50IHlvdSB3aXRoIGEgYnJpZWZjYXNlLiBJbiB0aGlzIGJyaWVmY2FzZSwgdGhlcmUgbWlnaHQgYmUgYSBzZWFsIG9yIHRoZXJlIG1pZ2h0IG5vdCBiZSBhIHNlYWwuIEFuZCBJIG5lZWQgeW91IHRvIHRlbGwgbWUgd2hpY2ggaXQgaXM6IFNFQUwgb3IgTk8gU0VBTD9cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc2VhbCcpXG4gICAgICAgICAgICBAcHJpbnQoJ0plcnJ5IHNsb3dseSBvcGVucyB0aGUgYnJpZWZjYXNlLCBwZWVraW5nIGluc2lkZSBmaXJzdCB0byBkZXRlY3QgYW55IHNpZ25zIG9mIHNlYWwgZW50cmFpbHMgYW5kIHRoZW4uLi4nKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBpZiBAcGVyY2VudENoYW5jZSg1MClcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCcuLi53ZWFyaW5nIGEgZmFjZSBvZiBwcmFjdGljZWQgZGlzYXBwb2ludG1lbnQgYW5kIGVtcGF0aHksIHdoaW1wZXJzIFwiVG9vIGJhZCxcIiBsZXR0aW5nIHRoZSBjYXNlIG9wZW4gdGhlIHJlc3Qgb2YgdGhlIHdheS4gQXQgdGhpcywgeW91IGFyZSBwcm9tcHRseSB1c2hlcmVkIG9mZiB0aGUgc3RhZ2UgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN1Y2tlci4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJy4uLmV4Y2l0ZWRseSBwdWxscyBpdCBhbGwgdGhlIHdheSBvcGVuLiBcIkhlXFwncyByaWdodCBwZW9wbGUhXCInKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk5vdywgbGV0XFwncyBzZWUgeW91ciBwcml6ZXMuXCIgXCJQcml6ZXMgaXMgcmlnaHQgSmVycnksXCIgc2F5cyBhIHZvaWNlIGNvbWluZyBmcm9tIG5vd2hlcmUgYW5kIGV2ZXJ5d2hlcmUgYWxsIGF0IG9uY2UuIFwiSGVyZSBhcmUgc29tZSB3b3JsZCBjbGFzcyBzZWxlY3Rpb25zIEkgcGlja2VkIHVwIGZyb20gdGhlIGdyb2Nlcnkgc3RvcmUgb24gdGhlIHdheSBoZXJlIHRoaXMgbW9ybmluZzpcIicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJTdWNjZXNzIGNvbWVzIGluIGNhbnMsIG5vdCBpbiBjYW4gbm90cy4gVGluIGNhbnMgdGhhdCBpcyEgVGhhdFxcJ3Mgd2h5IHdlIGFyZSBvZmZlcmluZyB5b3UgdGhlIGNob2ljZSBvZiBhIGZ1bGwgd2Vla1xcJ3Mgc3VwcGx5IG9mIFxcJ0NhcHRhaW4gTmVkXFwncyBQaWNrbGVkIEhlcnJpbmdcXCcsIG9yIFxcJ05vIElmcyBBbmRzIG9yIEJ1dHRlclxcJyBicmFuZCBtYXJnYXJpbmUgc3ByZWFkIHR5cGUgcHJvZHVjdCBmb3IgeW91ciBjb25zdW1wdGlvbiBwbGVhc3VyZS4gIE5hdHVyYWxseSB5b3UgY2hvb3NlIHRoZSBtYXJnYXJpbmUgYmVjYXVzZSB5b3UgYXJlIGhlYWx0aCBjb25zY2lvdXMgb3Igc29tZXRoaW5nLicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdtYXJnYXJpbmUnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCcsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKVxuICAgICAgICAgICAgaWYgQGNvbWluZ0Zyb20oWydXYXRlciBXb3JsZCAoTWFuYXRlZSBFeGhpYml0KScsICdXYXRlciBXb3JsZCAoR2lmdCBTaG9wKSddKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBiYWNrIGF0IHRoZSBXYXRlciBXb3JsZCBnYXRlLiBUaGUgZXhpdCBpcyByaWdodCBvdmVyIHRoZXJlISBKdXN0IGEgbGl0dGxlIGJpdCBmdXJ0aGVyIGFuZCB5b3UgY2FuIGxlYXZlLiBQbGVhc2UgY2FuIHdlIGxlYXZlIG5vdz8nKVxuICAgICAgICAgICAgZWxzZSBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdPaCBtYW4sIFdhdGVyIFdvcmxkISBZb3UgbG92ZSB0aGF0IG1vdmllLiBLZXZpbiBDb3N0bmVyIHNob3VsZCBoYXZlIHRvdGFsbHkgZ290dGVuIHRoZSBPc2Nhci4gV2FpdCB0aGlzIGlzblxcJ3QgbGlrZSB0aGF0LiBUaGlzIGlzIFdhdGVyIFdvcmxkLCB0aGUgaG9tZSBvZiB0aGF0IHN0dXBpZCBraWxsZXIgd2hhbGUsIFNoYW1wdS4gV2hhdCBhIGhhY2shIE9idmlvdXMgZXhpdHMgYXJlIG5vcnRoIHRvIHRoZSBNYW5hdGVlIHNob3csIGVhc3QgdG8gdGhlIGdpZnQgc2hvcCwgYW5kIHNvdXRoIHRvIHRoZSBBY2h0aXB1c1xcJ3MgZ2FyZGVuLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdPaCBncmVhdCwgV2F0ZXIgV29ybGQgYWdhaW4uIFlvdSB3ZXJlIGhvcGluZyBvbmNlIHdvdWxkIGJlIGVub3VnaCB0byBsYXN0IHlvdSBhIGxpZmV0aW1lLiBPYnZpb3VzIGV4aXRzIGFyZSBub3J0aCB0byB0aGUgTWFuYXRlZSBzaG93LCBlYXN0IHRvIHRoZSBnaWZ0IHNob3AsIGFuZCBzb3V0aCB0byB0aGUgQWNodGlwdXNcXCdzIGdhcmRlbi4nKVxuICAgICAgICBlbHNlIGlmIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1dlbGwsIHRoaXMgaXMgaXQgdGhlIFdhdGVyIFdvcmxkIGVudHJhbmNlIHdoZXJlIGFsbCB5b3VyIG1hcmluZSBkcmVhbXMgYW5kIG5pZ2h0bWFyZXMgY29tZSB0cnVlLiBPYnZpb3VzIGV4aXRzIGFyZSBub3J0aCB0byB0aGUgTWFuYXRlZSBzaG93LCBlYXN0IHRvIHRoZSBnaWZ0IHNob3AsIGFuZCBzb3V0aCB0byB0aGUgQWNodGlwdXNcXCdzIGdhcmRlbi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKEdpZnQgU2hvcCknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0FuZCB0aGVyZSBpdCBpczogVGhlIGlsbHVzdHJpb3VzIG1hbmF0ZWUuIFlvdSBjYW4gc2VlIHdoeSB0aGUgc3RhbmRzIGFyZSBlbXB0eS4gVGhlcmUgYXJlIGJpZyB1bWJyZWxsYXMgYXR0YWNoZWQgdG8gc29tZSBwaWNuaWMgdGFibGVzOyBub3QgbXVjaCB0byBzZWUuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIE1hbmF0ZWUgc2VydmljZSByb29tIGFuZCBzb3V0aCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnV2VsbCwgdGhlIG1hbmF0ZWUgZXhoaWJpdCBpcyBzdGlsbCBhIGR1bXAuIEEgYnVuY2ggb2YgdG91cmlzdCBmYW1pbGllcyBhcmUgZGV2b3VyaW5nIHRoZWlyIGZvb2QgYXQgc29tZSB0YWJsZXMgd2l0aCB1bWJyZWxsYXMuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIE1hbmF0ZWUgc2VydmljZSByb29tIGFuZCBzb3V0aCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlcmUgaXMgYmlnIHdvb2RlbiBhcmNoIGRpc3BsYXkgd2l0aCBsb3RzIG9mIHBlZWxpbmcgcGFpbnQgc3Vycm91bmRlZCBieSB5b3VyIHN0YW5kYXJkIHNlbWljaXJjbGUgc3RvbmUgc2VhdGluZyBhcnJhbmdlbWVudC4gU29tZSBwaWNuaWMgdGFibGVzIHdpdGggdW1icmVsbGFzIGFyZSBuZWFyYnkuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIE1hbmF0ZWUgc2VydmljZSByb29tIGFuZCBzb3V0aCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgdW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdXaGF0LCB5b3UgaGF2ZSBuZXZlciBzZWVuIGFuIHVtYnJlbGxhPyBUaGV5IGFyZSByZWQgYW5kIHdoaXRlIGFuZCBjb3ZlcmVkIGluIGFsZ2FlLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgdW1icmVsbGEnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3VtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHN0ZWFsdGhpbHkgYXBwcm9hY2ggYW4gZW1wdHkgdGFibGUgYW5kIHNob3ZlIGl0cyB1bWJyZWxsYSB1bmRlciB5b3VyIGZpbiBhbmQgc3R1bWJsZSBhd2F5LiBFdmVyeW9uZSBsb29rcyBhdCB5b3UgbGlrZSB0aGlzIGhhcHBlbnMgYSBsb3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1lY2hhbmljYWwgUm9vbSBUeXBlIFBsYWNlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKEdpZnQgU2hvcCknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGVudGVyIHRoZSBXYXRlciBXb3JsZCBnaWZ0IHNob3AuIFRoZXJlIGFyZSBhbGwgc29ydHMgb2YgZ3JlYXQgaXRlbXMgaGVyZTogYSBnaWFudCBzdHVmZmVkIG9jdG9wdXMsIGRlaHlkcmF0ZWQgYXN0cm9uYXV0IGZpc2ggZm9vZCwganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzLCBhbmQgc29tZSBvZiB0aGF0IGNsYXkgc2FuZCBjcmFwIHRoZXkgdXNlZCB0byBhZHZlcnRpc2Ugb24gVFYuIFNlZSBhbnl0aGluZyB5b3UgbGlrZT8gV2VzdCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuICAgICAgICBlbHNlIGlmIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIGFyZSBhbGwgc29ydHMgb2YgZ3JlYXQgaXRlbXMgaGVyZTogYSBnaWFudCBzdHVmZmVkIG9jdG9wdXMsIGRlaHlkcmF0ZWQgYXN0cm9uYXV0IGZpc2ggZm9vZCwganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzLCBhbmQgc29tZSBvZiB0aGF0IGNsYXkgc2FuZCBjcmFwIHRoZXkgdXNlZCB0byBhZHZlcnRpc2Ugb24gVFYuIFNlZSBhbnl0aGluZyB5b3UgbGlrZT8gV2VzdCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgb2N0b3B1cycpXG4gICAgICAgICAgICBAcHJpbnQoJ1VzdWFsbHkgeW91IGhhdmUgdG8ga25vY2sgb3ZlciBhIHN0YWNrIG9mIG9sZCBtaWxrIGJvdHRsZXMgdG8gZ2V0IHN0dWZmZWQgYW5pbWFscyBvZiB0aGlzIHF1YWxpdHkuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzYW5kJylcbiAgICAgICAgICAgIEBwcmludCgnV293LCB5b3UgcmVtZW1iZXIgdGhpcyBzdHVmZi4gSXQgc2F5cyBvbiB0aGUgYm94IGl0cyB0aGUgb25seS1zdGF5LWRyeSBzYW5kIGNyYXAgdXNlZCBieSBTaGFtcHUgaGltc2VsZi4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGJhZGdlcycpXG4gICAgICAgICAgICBAcHJpbnQoJ0Nvb2whIEFuZCB5b3UgZG9u4oCZdCBldmVuIGhhdmUgdG8gY29tcGxldGUgYW55IGNsYXNzZXMgaW4ganVuaW9yIG1hcmluZSBzaGVyaWZmIHNjaG9vbC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGZpc2gnKSBvciBAbWF0Y2hlcygnbG9vayBmb29kJylcbiAgICAgICAgICAgIEBwcmludCgnVGhleSBoYXZlIGtlbHAsIGtyaWxsLCBhbGdhZSwgYW5kIGljZSBjcmVhbSBmbGF2b3JzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBiYWRnZScpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnYmFkZ2UnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgdGFrZSB0aGUganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzIHRvIHRoZSBjb3VudGVyLiBUaGUgY2FzaGllciBzYXlzIHRoZXkgYXJlIG9uIHNhbGUsIG9ubHkgMTUgZmlzaCBkb2xsYXJzLCBwbHVzIHRheC4gWXVzc3NzLiBZb3UgcGF5IHRoZSBtYW4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHRha2UgdGhhdCBpdGVtIHRvIHRoZSBjb3VudGVyLiBUaGUgY2FzaGllciBzYXlzIGl0IGlzICcgKyAoMTggKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzMCkpLnRvU3RyaW5nKCkgKyBcIiBmaXNoIGRvbGxhcnMgYnV0IHlvdSBvbmx5IGhhdmUgI3tpZiBAaGFzSXRlbSgnYmFkZ2UnKSB0aGVuIDIgZWxzZSAxN30gZmlzaCBkb2xsYXJzLiBOdXRzLlwiKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCAoTWVjaGFuaWNhbCBSb29tIFR5cGUgUGxhY2UpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdXaGF0IGluIHRoZSBuYW1lIG9mIENhcHRhaW4gTmVtbyBpcyB0aGlzPyBUaGVyZSBhcmUgbWFuYXRlZXMgaW4gaG9pc3RzIGFsbCBvdmVyIHRoZSByb29tIGhvb2tlZCB1cCB0by4uLm1pbGtpbmcgZGV2aWNlcy4gVGhpcyBpcyBubyBtZWNoYW5pY2FsIHJvb20hIEl0XFwncyBhIGNvdmVyIGZvciBhIHNlY3JldCwgaWxsZWdhbCwgdW5kZXJncm91bmQsIGJsYWNrIG1hcmtldCwgYnV0IHByb2JhYmx5IG9yZ2FuaWMsIHNlYSBjb3cgbWlsa2luZyBvcGVyYXRpb24uIFRoZSBmaWVuZHMhIFlvdSBhcmUgZ29pbmcgdG8gYmxvdyB0aGUgbGlkIG9mZiB0aGlzIHRoaW5nIGZvciBzdXJlLiBUaGUgc3dlYXR5IG9sZCBmaXNoIHJ1bm5pbmcgdGhlIG1hY2hpbmVyeSBoYXMgbm90IG5vdGljZWQgeW91IHlldC4gT2J2aW91cyBleGl0cyBhcmUgZWFzdCB0byB0aGUgbWFuYXRlZSBleGhpYml0LicpXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBAaGFzSXRlbSgnYmFkZ2UnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhhdCBzd2VhdHkgb2xkIGZpc2ggaXMgc3RpbGwgZ29pbmcgYXQgaXQgd2l0aCBoaXMgbWFuYXRlZSBtaWxraW5nLiBZb3Ugd29uZGVyIGlmIHRoZXJlIGlzIGFueSBraW5kIG9mIGF1dGhvcml0eSBoZSB3b3VsZCBib3cgdG8uIE9idmlvdXMgZXhpdHMgYXJlIGVhc3QgdG8gdGhlIG1hbmF0ZWUgZXhoaWJpdC4nKVxuICAgICAgICAgICAgZWxzZSBpZiBub3QgQGhhc0l0ZW0oJ21pbGsnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhhdCBzd2VhdHkgb2xkIGZpc2ggaXMgc3RpbGwgZ29pbmcgYXQgaXQgd2l0aCBoaXMgbWFuYXRlZSBtaWxraW5nLiBZb3UgZmVlbCBqdXN0IGEgZnJhZ21lbnQgb2YgZ3VpbHQgZm9yIG5vdCB0dXJuaW5nIGhpbSBpbi4gT2J2aW91cyBleGl0cyBhcmUgZWFzdCB0byB0aGUgbWFuYXRlZSBleGhpYml0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGVyZSBkb2VzblxcJ3Qgc2VlbSB0byBiZSBhbnl0aGluZyB5b3UgY2FuIGRvIHRvIHB1dCBhIHN0b3AgdG8gdGhpcyBob3JyaWJsZSBzaWdodC4gQXQgbGVhc3QgeW91IGdvdCBzb21ldGhpbmcgb3V0IG9mIGl0IHRob3VnaC4gT2J2aW91cyBleGl0cyBhcmUgZWFzdCB0byB0aGUgbWFuYXRlZSBleGhpYml0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdNYW5hdGVlcyBmcm9tIHRoZSBleGhpYml0IGFyZSBhbGwgb3ZlciBpbiBob2lzdHMgcmlnZ2VkIHVwIHRvIG1pbGtpbmcgZXF1aXBtZW50LiBJdFxcJ3MgaWxsZWdhbCwgYnV0IHlvdSBoYXZlIGhlYXJkIHRoZXJlIGlzIGEgZm9ydHVuZSBpbiBnZW51aW5lIHNlYSBjb3cgbWlsay4gVGhhdCBuYXN0eSBvbGQgZmlzaCB0aGVyZSBpcyBydW5uaW5nIHRoZSB3aG9sZSB0aGluZy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKSBvciBAbWF0Y2hlcygnYmFkZ2UnKSBvciBAbWF0Y2hlcygnc3RpY2tlcicpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2JhZGdlJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBzd2ltIHVwIHRvIHRoZSBmaXNoIGF0IHRoZSBjb250cm9scy4gXCJJIGFtIGdvaW5nIHRvIHNodXQgeW91IGRvd24hXCIgWW91IHNob3V0IGF0IGhpbS4gSGUgbGF1Z2hzIGhlYXJ0aWx5LiBcIllvdSBkb25cXCd0IHN0YW5kIGEgY2hhbmNlLiBZb3VcXCdyZSBqdXN0IGEgcmVndWxhciBndXkuIElcXCdtIHRoZSBtYXlvciBvZiBXYXRlciBXb3JsZC4gV2hvIGlzIGdvaW5nIHRvIGJlbGlldmUgeW91P1wiIEhlIGdvZXMgYmFjayB0byBoaXMgd29yayBwYXlpbmcgeW91IG5vIG1pbmQuIEhlIGhhcyBhIHBvaW50LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgZmlzaCBicmFuZGlzaGluZyB5b3VyIGJhZGdlIHN0aWNrZXIuIFwiWW91IGFyZSB1bmRlciBhcnJlc3QgZm9yIGlsbGVnYWwgbWlsayBoYXJ2ZXN0aW5nIGZyb20gZW5kYW5nZXJlZCBtYW5hdGVlcy4gSVxcJ20gdGFraW5nIHlvdSBpbi5cIiBcIldhaXQsXCIgaGUgc2F5cywgXCJZb3UgZG9uXFwndCBoYXZlIHRvIGRvIHRoaXMuIEl0XFwncyB0aGUgb25seSB3YXkgSSBjYW4ga2VlcCBXYXRlciBXb3JsZCBydW5uaW5nLiBEb25cXCd0IHlvdSBzZWU/IE5vdyB0aGF0IHdlIGFyZSBvbiBvdXIgc2l4dGggU2hhbXB1LCBwZW9wbGUganVzdCBkb25cXCd0IHNlZW0gdG8gY2FyZSBhYm91dCB0aGUgbWFnaWMgb2YgZXhwbG9pdGVkIG1hcmluZSBtYW1tYWxzLiBJIHdpbGwsIHVoLi4ubWFrZSBpdCB3b3J0aCB5b3VyIHdoaWxlIHRob3VnaC5cIiBIZSBzbGlkZXMgYSBmcmVzaCBib3R0bGUgb2YgbWlsayBpbiB5b3VyIGRpcmVjdGlvbi4gV2l0aG91dCBsb29raW5nIGF0IHlvdSBoZSBzYXlzLCBcIkl0IGlzIHdvcnRoIHRob3VzYW5kcyBpbiB0aGUgcmlnaHQgbWFya2V0LlwiJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnbWlsaycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgaGF2ZSBlbnRlcmVkIFRoZSBFdGhlcmVhbCBSZWFsbS4gV2h5IGRpZCB5b3UgZG8gdGhhdD8gVGhhdCB3YXMgYSBiYWQgZGVjaXNpb24uIFdhbGUgaXMgYXQgeW91ciBzaWRlLiBUaGVyZSBhcmUgYSBidW5jaCBvZiB3ZWlyZCwgc3BhY2V5IHBsYXRmb3JtcyBhbmQganVuayBmbG9hdGluZyBhcm91bmQgaW4gYSBjb3NtaWMgdm9pZCAtLSB5b3VyIHR5cGljYWwgc3VycmVhbGlzdCBkcmVhbXNjYXBlIGVudmlyb25tZW50LiBBaGVhZCBpcyBhbiB1Z2x5IG1vbnN0ZXIuIEhlIGlzIGNsdXRjaGluZyBzb21ldGhpbmcgaW4gaGlzIGhhbmQuIE9idmlvdXMgZXhpdHMgYXJlIE5PTkUhIFRoaXMgaXMgdGhlIHdvcmxkIG9mIHdha2luZyBuaWdodG1hcmVzIHlvdSBkaW5ndXMuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayBtb25zdGVyJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBnZXR0aW5nIHdvcnNlIGF0IHRoaXMgZ2FtZS4gWW91IGFwcHJvYWNoIHNhaWQgbW9uc3RlciBpbiBhbiBlZmZvcnQgdG8gZ2V0IHNvbWUgbGVhZHMgb24geW91ciBwcmVjaW91cyBoYWlyIHByb2R1Y3QuIE1heWJlIGl0IHdvdWxkIGhhdmUgYmVlbiBhIGJldHRlciBpZGVhIHRvIHN0YXJ0IGJ5IGp1c3QgYXNraW5nIGhpbSBhYm91dCB0aGUgc3RhdHVzIG9mIHRoZSBsb2NhbCBiYXNrZXRiYWxsIHRlYW0gb3Igc29tZXRoaW5nPycpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBwcmludCgnT24gY2xvc2VyIGV4YW1pbmF0aW9uIHRob3VnaCwgeW91IHJlYWxpemUgdGhpcyBpcyBub3QganVzdCBhbnkgbW9uc3Rlci4gSXQgaXMgYSBUb3J1bWVraWFuIGh5cGVyIGdvYmxpbi4gQW5kIGluIGhpcyBncmlzbHkgcGF3IHJlc3RzIHRoZSBpdGVtIG9mIHlvdXIgcXVlc3Q6IHlvdXIgJDIzIHNoYW1wb28hJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiU2hhcmMsIHdlIGNhbiBub3QgYWxsb3cgaGltIHRvIHVzZSB0aGF0IHNoYW1wb28sXCIgd2hpc3BlcnMgeW91ciBjb21wYW5pb24uIFwiT24gdGhlIGhlYWQgb2YgYSBoeXBlciBnb2JsaW4sIGhhaXIgdGhhdCBzbW9vdGggY291bGQgbWVhbiB0aGUgZW5kIG9mIGZhc2hpb24gYXMgd2Uga25vdyBpdC4gV2UgbXVzdCByZXRyaWV2ZSBpdCBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5LlwiJylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnTm8gc29vbmVyIGhhdmUgdGhlIHdvcmRzIGxlZnQgV2FsZVxcJ3MgbGlwcyB0aGFuIHlvdSBhcmUgc3BvdHRlZC4gVGhhdCBpcyBhbGwgdGhlIG1vdGl2YXRpb24gdGhpcyBiZWFzdCBuZWVkcy4gSGUgZmxpcHMgdGhlIGNhcCBvbiB0aGUgYm90dGxlLCByYWlzaW5nIGl0IHRvIHRoZSBmaWx0aHksIHN0cmluZy1saWtlIG1vcCB5b3UgY2FuIG9ubHkgYXNzdW1lIG11c3QgYmUgaGlzIGhhaXIsIGFsbCB0aGUgd2hpbGUgZ2F6aW5nIGRvd24gYXQgeW91IGluIGRlZmlhbmNlIHdpdGggaGlzIHNpbmdsZSBibG9vZCBzaG90IGV5ZS4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1RoZSBFdGhlcmVhbCBSZWFsbSAoRG8gc29tZXRoaW5nISknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbSAoRG8gc29tZXRoaW5nISknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnRG8gc29tZXRoaW5nIScpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdzb21ldGhpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdPaCB2ZXJ5IGZ1bm55LiAgTm93IGlzIGRlZmluaXRlbHkgbm90IHRoZSB0aW1lIGZvciBzbmFyay4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2F0dGFjaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzdGFydCB0byBsdW5nZSB0b3dhcmRzIHRoZSBjcmVhdHVyZSwgYnV0IFdhbGUgcHVzaGVzIHlvdSBvdXQgb2YgdGhlIHdheSBpbiBhIGNoYXJnZSBoaW1zZWxmLiBZb3UgY3JpbmdlIGFzIHlvdSBoZWFyIHRoZSBzbGFzaGluZyBvZiBmbGVzaC4gUmVkIG1pc3QgZmxvYXRzIG91dCBvZiBXYWxlXFwncyBzaWRlLiBZb3VyIGhlYWQgaXMgc3Bpbm5pbmcuJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQHByaW50KCdcIk5vdyBTaGFyYyFcIiwgaGUgd2hlZXplcywgXCJVc2UgdGhlIHBvd2VyIG9mIHRoZSBRdWFkcmF0aWMgRXllLlwiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiQnV0IHlvdSBzYWlkIEkgd2FzblxcJ3QgcmVhZHkhXCIgeW91IGNyeSwgdHJ5aW5nIG5vdCB0byBsb29rIGF0IHRoZSBzb3JyeSBzdGF0ZSBvZiB5b3VyIGZyaWVuZC4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk5vLCBpdCB3YXMgSSB3aG8gd2FzIG5vdCByZWFkeS4gVGhlIHAtcG93ZXIgaGFzIGFsd2F5cyBiZWVuIHdpdGhpbiB5LXlvdS5cIicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdxdWFkcmF0aWMgZXllJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1RoZSBFdGhlcmVhbCBSZWFsbSAoVXNlIHRoZSBRdWFkcmF0aWMgRXllISknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbSAoVXNlIHRoZSBRdWFkcmF0aWMgRXllISknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygndXNlIHF1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3F1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdFbmQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnRW5kJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSByZW1vdmUgdGhlIFF1YWRyYXRpYyBFeWUgZnJvbSBpdHMgY29tcGFydG1lbnQsIGNsb3NlIHlvdXIgZXllcyBhbmQgYWxsb3cgdW5pb24gYmV0d2VlbiB5b3VyIHNwaXJpdCBhbmQgdGhlIHVuaXZlcnNhbCBjaGkgZmxvdy4gVGhlbiB0aGUgZ29ibGluIGdldHMgY3V0IGluIGhhbGYgYW5kIHlvdSBnZXQgeW91ciBzaGFtcG9vIGJhY2suJylcblxuXG4gICAgZW5naW5lLnNldFN0YXJ0Um9vbSgnV2FsZSB2cyBTaGFyYzogVGhlIENvbWljOiBUaGUgSW50ZXJhY3RpdmUgU29mdHdhcmUgVGl0bGUgRm9yIFlvdXIgQ29tcHV0ZXIgQm94JylcbiAgICAjZW5naW5lLnNldFN0YXJ0Um9vbSgnVGhlIEV0aGVyZWFsIFJlYWxtJylcbiIsInZhciBtID0gKGZ1bmN0aW9uIGFwcCh3aW5kb3csIHVuZGVmaW5lZCkge1xyXG5cdHZhciBPQkpFQ1QgPSBcIltvYmplY3QgT2JqZWN0XVwiLCBBUlJBWSA9IFwiW29iamVjdCBBcnJheV1cIiwgU1RSSU5HID0gXCJbb2JqZWN0IFN0cmluZ11cIiwgRlVOQ1RJT04gPSBcImZ1bmN0aW9uXCI7XHJcblx0dmFyIHR5cGUgPSB7fS50b1N0cmluZztcclxuXHR2YXIgcGFyc2VyID0gLyg/OihefCN8XFwuKShbXiNcXC5cXFtcXF1dKykpfChcXFsuKz9cXF0pL2csIGF0dHJQYXJzZXIgPSAvXFxbKC4rPykoPzo9KFwifCd8KSguKj8pXFwyKT9cXF0vO1xyXG5cdHZhciB2b2lkRWxlbWVudHMgPSAvXihBUkVBfEJBU0V8QlJ8Q09MfENPTU1BTkR8RU1CRUR8SFJ8SU1HfElOUFVUfEtFWUdFTnxMSU5LfE1FVEF8UEFSQU18U09VUkNFfFRSQUNLfFdCUikkLztcclxuXHR2YXIgbm9vcCA9IGZ1bmN0aW9uKCkge31cclxuXHJcblx0Ly8gY2FjaGluZyBjb21tb25seSB1c2VkIHZhcmlhYmxlc1xyXG5cdHZhciAkZG9jdW1lbnQsICRsb2NhdGlvbiwgJHJlcXVlc3RBbmltYXRpb25GcmFtZSwgJGNhbmNlbEFuaW1hdGlvbkZyYW1lO1xyXG5cclxuXHQvLyBzZWxmIGludm9raW5nIGZ1bmN0aW9uIG5lZWRlZCBiZWNhdXNlIG9mIHRoZSB3YXkgbW9ja3Mgd29ya1xyXG5cdGZ1bmN0aW9uIGluaXRpYWxpemUod2luZG93KXtcclxuXHRcdCRkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcclxuXHRcdCRsb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcclxuXHRcdCRjYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuY2xlYXJUaW1lb3V0O1xyXG5cdFx0JHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LnNldFRpbWVvdXQ7XHJcblx0fVxyXG5cclxuXHRpbml0aWFsaXplKHdpbmRvdyk7XHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBAdHlwZWRlZiB7U3RyaW5nfSBUYWdcclxuXHQgKiBBIHN0cmluZyB0aGF0IGxvb2tzIGxpa2UgLT4gZGl2LmNsYXNzbmFtZSNpZFtwYXJhbT1vbmVdW3BhcmFtMj10d29dXHJcblx0ICogV2hpY2ggZGVzY3JpYmVzIGEgRE9NIG5vZGVcclxuXHQgKi9cclxuXHJcblx0LyoqXHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge1RhZ30gVGhlIERPTSBub2RlIHRhZ1xyXG5cdCAqIEBwYXJhbSB7T2JqZWN0PVtdfSBvcHRpb25hbCBrZXktdmFsdWUgcGFpcnMgdG8gYmUgbWFwcGVkIHRvIERPTSBhdHRyc1xyXG5cdCAqIEBwYXJhbSB7Li4ubU5vZGU9W119IFplcm8gb3IgbW9yZSBNaXRocmlsIGNoaWxkIG5vZGVzLiBDYW4gYmUgYW4gYXJyYXksIG9yIHNwbGF0IChvcHRpb25hbClcclxuXHQgKlxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIG0oKSB7XHJcblx0XHR2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHRcdHZhciBoYXNBdHRycyA9IGFyZ3NbMV0gIT0gbnVsbCAmJiB0eXBlLmNhbGwoYXJnc1sxXSkgPT09IE9CSkVDVCAmJiAhKFwidGFnXCIgaW4gYXJnc1sxXSB8fCBcInZpZXdcIiBpbiBhcmdzWzFdKSAmJiAhKFwic3VidHJlZVwiIGluIGFyZ3NbMV0pO1xyXG5cdFx0dmFyIGF0dHJzID0gaGFzQXR0cnMgPyBhcmdzWzFdIDoge307XHJcblx0XHR2YXIgY2xhc3NBdHRyTmFtZSA9IFwiY2xhc3NcIiBpbiBhdHRycyA/IFwiY2xhc3NcIiA6IFwiY2xhc3NOYW1lXCI7XHJcblx0XHR2YXIgY2VsbCA9IHt0YWc6IFwiZGl2XCIsIGF0dHJzOiB7fX07XHJcblx0XHR2YXIgbWF0Y2gsIGNsYXNzZXMgPSBbXTtcclxuXHRcdGlmICh0eXBlLmNhbGwoYXJnc1swXSkgIT0gU1RSSU5HKSB0aHJvdyBuZXcgRXJyb3IoXCJzZWxlY3RvciBpbiBtKHNlbGVjdG9yLCBhdHRycywgY2hpbGRyZW4pIHNob3VsZCBiZSBhIHN0cmluZ1wiKVxyXG5cdFx0d2hpbGUgKG1hdGNoID0gcGFyc2VyLmV4ZWMoYXJnc1swXSkpIHtcclxuXHRcdFx0aWYgKG1hdGNoWzFdID09PSBcIlwiICYmIG1hdGNoWzJdKSBjZWxsLnRhZyA9IG1hdGNoWzJdO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCIjXCIpIGNlbGwuYXR0cnMuaWQgPSBtYXRjaFsyXTtcclxuXHRcdFx0ZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiLlwiKSBjbGFzc2VzLnB1c2gobWF0Y2hbMl0pO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFszXVswXSA9PT0gXCJbXCIpIHtcclxuXHRcdFx0XHR2YXIgcGFpciA9IGF0dHJQYXJzZXIuZXhlYyhtYXRjaFszXSk7XHJcblx0XHRcdFx0Y2VsbC5hdHRyc1twYWlyWzFdXSA9IHBhaXJbM10gfHwgKHBhaXJbMl0gPyBcIlwiIDp0cnVlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNoaWxkcmVuID0gaGFzQXR0cnMgPyBhcmdzLnNsaWNlKDIpIDogYXJncy5zbGljZSgxKTtcclxuXHRcdGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgdHlwZS5jYWxsKGNoaWxkcmVuWzBdKSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0Y2VsbC5jaGlsZHJlbiA9IGNoaWxkcmVuWzBdXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Y2VsbC5jaGlsZHJlbiA9IGNoaWxkcmVuXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGZvciAodmFyIGF0dHJOYW1lIGluIGF0dHJzKSB7XHJcblx0XHRcdGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShhdHRyTmFtZSkpIHtcclxuXHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IGNsYXNzQXR0ck5hbWUgJiYgYXR0cnNbYXR0ck5hbWVdICE9IG51bGwgJiYgYXR0cnNbYXR0ck5hbWVdICE9PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRjbGFzc2VzLnB1c2goYXR0cnNbYXR0ck5hbWVdKVxyXG5cdFx0XHRcdFx0Y2VsbC5hdHRyc1thdHRyTmFtZV0gPSBcIlwiIC8vY3JlYXRlIGtleSBpbiBjb3JyZWN0IGl0ZXJhdGlvbiBvcmRlclxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGNlbGwuYXR0cnNbYXR0ck5hbWVdID0gYXR0cnNbYXR0ck5hbWVdXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChjbGFzc2VzLmxlbmd0aCA+IDApIGNlbGwuYXR0cnNbY2xhc3NBdHRyTmFtZV0gPSBjbGFzc2VzLmpvaW4oXCIgXCIpO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gY2VsbFxyXG5cdH1cclxuXHRmdW5jdGlvbiBidWlsZChwYXJlbnRFbGVtZW50LCBwYXJlbnRUYWcsIHBhcmVudENhY2hlLCBwYXJlbnRJbmRleCwgZGF0YSwgY2FjaGVkLCBzaG91bGRSZWF0dGFjaCwgaW5kZXgsIGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpIHtcclxuXHRcdC8vYGJ1aWxkYCBpcyBhIHJlY3Vyc2l2ZSBmdW5jdGlvbiB0aGF0IG1hbmFnZXMgY3JlYXRpb24vZGlmZmluZy9yZW1vdmFsIG9mIERPTSBlbGVtZW50cyBiYXNlZCBvbiBjb21wYXJpc29uIGJldHdlZW4gYGRhdGFgIGFuZCBgY2FjaGVkYFxyXG5cdFx0Ly90aGUgZGlmZiBhbGdvcml0aG0gY2FuIGJlIHN1bW1hcml6ZWQgYXMgdGhpczpcclxuXHRcdC8vMSAtIGNvbXBhcmUgYGRhdGFgIGFuZCBgY2FjaGVkYFxyXG5cdFx0Ly8yIC0gaWYgdGhleSBhcmUgZGlmZmVyZW50LCBjb3B5IGBkYXRhYCB0byBgY2FjaGVkYCBhbmQgdXBkYXRlIHRoZSBET00gYmFzZWQgb24gd2hhdCB0aGUgZGlmZmVyZW5jZSBpc1xyXG5cdFx0Ly8zIC0gcmVjdXJzaXZlbHkgYXBwbHkgdGhpcyBhbGdvcml0aG0gZm9yIGV2ZXJ5IGFycmF5IGFuZCBmb3IgdGhlIGNoaWxkcmVuIG9mIGV2ZXJ5IHZpcnR1YWwgZWxlbWVudFxyXG5cclxuXHRcdC8vdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlIGlzIGVzc2VudGlhbGx5IHRoZSBzYW1lIGFzIHRoZSBwcmV2aW91cyByZWRyYXcncyBgZGF0YWAgZGF0YSBzdHJ1Y3R1cmUsIHdpdGggYSBmZXcgYWRkaXRpb25zOlxyXG5cdFx0Ly8tIGBjYWNoZWRgIGFsd2F5cyBoYXMgYSBwcm9wZXJ0eSBjYWxsZWQgYG5vZGVzYCwgd2hpY2ggaXMgYSBsaXN0IG9mIERPTSBlbGVtZW50cyB0aGF0IGNvcnJlc3BvbmQgdG8gdGhlIGRhdGEgcmVwcmVzZW50ZWQgYnkgdGhlIHJlc3BlY3RpdmUgdmlydHVhbCBlbGVtZW50XHJcblx0XHQvLy0gaW4gb3JkZXIgdG8gc3VwcG9ydCBhdHRhY2hpbmcgYG5vZGVzYCBhcyBhIHByb3BlcnR5IG9mIGBjYWNoZWRgLCBgY2FjaGVkYCBpcyAqYWx3YXlzKiBhIG5vbi1wcmltaXRpdmUgb2JqZWN0LCBpLmUuIGlmIHRoZSBkYXRhIHdhcyBhIHN0cmluZywgdGhlbiBjYWNoZWQgaXMgYSBTdHJpbmcgaW5zdGFuY2UuIElmIGRhdGEgd2FzIGBudWxsYCBvciBgdW5kZWZpbmVkYCwgY2FjaGVkIGlzIGBuZXcgU3RyaW5nKFwiXCIpYFxyXG5cdFx0Ly8tIGBjYWNoZWQgYWxzbyBoYXMgYSBgY29uZmlnQ29udGV4dGAgcHJvcGVydHksIHdoaWNoIGlzIHRoZSBzdGF0ZSBzdG9yYWdlIG9iamVjdCBleHBvc2VkIGJ5IGNvbmZpZyhlbGVtZW50LCBpc0luaXRpYWxpemVkLCBjb250ZXh0KVxyXG5cdFx0Ly8tIHdoZW4gYGNhY2hlZGAgaXMgYW4gT2JqZWN0LCBpdCByZXByZXNlbnRzIGEgdmlydHVhbCBlbGVtZW50OyB3aGVuIGl0J3MgYW4gQXJyYXksIGl0IHJlcHJlc2VudHMgYSBsaXN0IG9mIGVsZW1lbnRzOyB3aGVuIGl0J3MgYSBTdHJpbmcsIE51bWJlciBvciBCb29sZWFuLCBpdCByZXByZXNlbnRzIGEgdGV4dCBub2RlXHJcblxyXG5cdFx0Ly9gcGFyZW50RWxlbWVudGAgaXMgYSBET00gZWxlbWVudCB1c2VkIGZvciBXM0MgRE9NIEFQSSBjYWxsc1xyXG5cdFx0Ly9gcGFyZW50VGFnYCBpcyBvbmx5IHVzZWQgZm9yIGhhbmRsaW5nIGEgY29ybmVyIGNhc2UgZm9yIHRleHRhcmVhIHZhbHVlc1xyXG5cdFx0Ly9gcGFyZW50Q2FjaGVgIGlzIHVzZWQgdG8gcmVtb3ZlIG5vZGVzIGluIHNvbWUgbXVsdGktbm9kZSBjYXNlc1xyXG5cdFx0Ly9gcGFyZW50SW5kZXhgIGFuZCBgaW5kZXhgIGFyZSB1c2VkIHRvIGZpZ3VyZSBvdXQgdGhlIG9mZnNldCBvZiBub2Rlcy4gVGhleSdyZSBhcnRpZmFjdHMgZnJvbSBiZWZvcmUgYXJyYXlzIHN0YXJ0ZWQgYmVpbmcgZmxhdHRlbmVkIGFuZCBhcmUgbGlrZWx5IHJlZmFjdG9yYWJsZVxyXG5cdFx0Ly9gZGF0YWAgYW5kIGBjYWNoZWRgIGFyZSwgcmVzcGVjdGl2ZWx5LCB0aGUgbmV3IGFuZCBvbGQgbm9kZXMgYmVpbmcgZGlmZmVkXHJcblx0XHQvL2BzaG91bGRSZWF0dGFjaGAgaXMgYSBmbGFnIGluZGljYXRpbmcgd2hldGhlciBhIHBhcmVudCBub2RlIHdhcyByZWNyZWF0ZWQgKGlmIHNvLCBhbmQgaWYgdGhpcyBub2RlIGlzIHJldXNlZCwgdGhlbiB0aGlzIG5vZGUgbXVzdCByZWF0dGFjaCBpdHNlbGYgdG8gdGhlIG5ldyBwYXJlbnQpXHJcblx0XHQvL2BlZGl0YWJsZWAgaXMgYSBmbGFnIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgYW4gYW5jZXN0b3IgaXMgY29udGVudGVkaXRhYmxlXHJcblx0XHQvL2BuYW1lc3BhY2VgIGluZGljYXRlcyB0aGUgY2xvc2VzdCBIVE1MIG5hbWVzcGFjZSBhcyBpdCBjYXNjYWRlcyBkb3duIGZyb20gYW4gYW5jZXN0b3JcclxuXHRcdC8vYGNvbmZpZ3NgIGlzIGEgbGlzdCBvZiBjb25maWcgZnVuY3Rpb25zIHRvIHJ1biBhZnRlciB0aGUgdG9wbW9zdCBgYnVpbGRgIGNhbGwgZmluaXNoZXMgcnVubmluZ1xyXG5cclxuXHRcdC8vdGhlcmUncyBsb2dpYyB0aGF0IHJlbGllcyBvbiB0aGUgYXNzdW1wdGlvbiB0aGF0IG51bGwgYW5kIHVuZGVmaW5lZCBkYXRhIGFyZSBlcXVpdmFsZW50IHRvIGVtcHR5IHN0cmluZ3NcclxuXHRcdC8vLSB0aGlzIHByZXZlbnRzIGxpZmVjeWNsZSBzdXJwcmlzZXMgZnJvbSBwcm9jZWR1cmFsIGhlbHBlcnMgdGhhdCBtaXggaW1wbGljaXQgYW5kIGV4cGxpY2l0IHJldHVybiBzdGF0ZW1lbnRzIChlLmcuIGZ1bmN0aW9uIGZvbygpIHtpZiAoY29uZCkgcmV0dXJuIG0oXCJkaXZcIil9XHJcblx0XHQvLy0gaXQgc2ltcGxpZmllcyBkaWZmaW5nIGNvZGVcclxuXHRcdC8vZGF0YS50b1N0cmluZygpIG1pZ2h0IHRocm93IG9yIHJldHVybiBudWxsIGlmIGRhdGEgaXMgdGhlIHJldHVybiB2YWx1ZSBvZiBDb25zb2xlLmxvZyBpbiBGaXJlZm94IChiZWhhdmlvciBkZXBlbmRzIG9uIHZlcnNpb24pXHJcblx0XHR0cnkge2lmIChkYXRhID09IG51bGwgfHwgZGF0YS50b1N0cmluZygpID09IG51bGwpIGRhdGEgPSBcIlwiO30gY2F0Y2ggKGUpIHtkYXRhID0gXCJcIn1cclxuXHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWQ7XHJcblx0XHR2YXIgY2FjaGVkVHlwZSA9IHR5cGUuY2FsbChjYWNoZWQpLCBkYXRhVHlwZSA9IHR5cGUuY2FsbChkYXRhKTtcclxuXHRcdGlmIChjYWNoZWQgPT0gbnVsbCB8fCBjYWNoZWRUeXBlICE9PSBkYXRhVHlwZSkge1xyXG5cdFx0XHRpZiAoY2FjaGVkICE9IG51bGwpIHtcclxuXHRcdFx0XHRpZiAocGFyZW50Q2FjaGUgJiYgcGFyZW50Q2FjaGUubm9kZXMpIHtcclxuXHRcdFx0XHRcdHZhciBvZmZzZXQgPSBpbmRleCAtIHBhcmVudEluZGV4O1xyXG5cdFx0XHRcdFx0dmFyIGVuZCA9IG9mZnNldCArIChkYXRhVHlwZSA9PT0gQVJSQVkgPyBkYXRhIDogY2FjaGVkLm5vZGVzKS5sZW5ndGg7XHJcblx0XHRcdFx0XHRjbGVhcihwYXJlbnRDYWNoZS5ub2Rlcy5zbGljZShvZmZzZXQsIGVuZCksIHBhcmVudENhY2hlLnNsaWNlKG9mZnNldCwgZW5kKSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBpZiAoY2FjaGVkLm5vZGVzKSBjbGVhcihjYWNoZWQubm9kZXMsIGNhY2hlZClcclxuXHRcdFx0fVxyXG5cdFx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcjtcclxuXHRcdFx0aWYgKGNhY2hlZC50YWcpIGNhY2hlZCA9IHt9OyAvL2lmIGNvbnN0cnVjdG9yIGNyZWF0ZXMgYSB2aXJ0dWFsIGRvbSBlbGVtZW50LCB1c2UgYSBibGFuayBvYmplY3QgYXMgdGhlIGJhc2UgY2FjaGVkIG5vZGUgaW5zdGVhZCBvZiBjb3B5aW5nIHRoZSB2aXJ0dWFsIGVsICgjMjc3KVxyXG5cdFx0XHRjYWNoZWQubm9kZXMgPSBbXVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChkYXRhVHlwZSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0Ly9yZWN1cnNpdmVseSBmbGF0dGVuIGFycmF5XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHR5cGUuY2FsbChkYXRhW2ldKSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSBkYXRhLmNvbmNhdC5hcHBseShbXSwgZGF0YSk7XHJcblx0XHRcdFx0XHRpLS0gLy9jaGVjayBjdXJyZW50IGluZGV4IGFnYWluIGFuZCBmbGF0dGVuIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlIG5lc3RlZCBhcnJheXMgYXQgdGhhdCBpbmRleFxyXG5cdFx0XHRcdFx0bGVuID0gZGF0YS5sZW5ndGhcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHZhciBub2RlcyA9IFtdLCBpbnRhY3QgPSBjYWNoZWQubGVuZ3RoID09PSBkYXRhLmxlbmd0aCwgc3ViQXJyYXlDb3VudCA9IDA7XHJcblxyXG5cdFx0XHQvL2tleXMgYWxnb3JpdGhtOiBzb3J0IGVsZW1lbnRzIHdpdGhvdXQgcmVjcmVhdGluZyB0aGVtIGlmIGtleXMgYXJlIHByZXNlbnRcclxuXHRcdFx0Ly8xKSBjcmVhdGUgYSBtYXAgb2YgYWxsIGV4aXN0aW5nIGtleXMsIGFuZCBtYXJrIGFsbCBmb3IgZGVsZXRpb25cclxuXHRcdFx0Ly8yKSBhZGQgbmV3IGtleXMgdG8gbWFwIGFuZCBtYXJrIHRoZW0gZm9yIGFkZGl0aW9uXHJcblx0XHRcdC8vMykgaWYga2V5IGV4aXN0cyBpbiBuZXcgbGlzdCwgY2hhbmdlIGFjdGlvbiBmcm9tIGRlbGV0aW9uIHRvIGEgbW92ZVxyXG5cdFx0XHQvLzQpIGZvciBlYWNoIGtleSwgaGFuZGxlIGl0cyBjb3JyZXNwb25kaW5nIGFjdGlvbiBhcyBtYXJrZWQgaW4gcHJldmlvdXMgc3RlcHNcclxuXHRcdFx0dmFyIERFTEVUSU9OID0gMSwgSU5TRVJUSU9OID0gMiAsIE1PVkUgPSAzO1xyXG5cdFx0XHR2YXIgZXhpc3RpbmcgPSB7fSwgc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gZmFsc2U7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2FjaGVkLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKGNhY2hlZFtpXSAmJiBjYWNoZWRbaV0uYXR0cnMgJiYgY2FjaGVkW2ldLmF0dHJzLmtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSB0cnVlO1xyXG5cdFx0XHRcdFx0ZXhpc3RpbmdbY2FjaGVkW2ldLmF0dHJzLmtleV0gPSB7YWN0aW9uOiBERUxFVElPTiwgaW5kZXg6IGl9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgZ3VpZCA9IDBcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRpZiAoZGF0YVtpXSAmJiBkYXRhW2ldLmF0dHJzICYmIGRhdGFbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGogPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhW2pdICYmIGRhdGFbal0uYXR0cnMgJiYgZGF0YVtqXS5hdHRycy5rZXkgPT0gbnVsbCkgZGF0YVtqXS5hdHRycy5rZXkgPSBcIl9fbWl0aHJpbF9fXCIgKyBndWlkKytcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzKSB7XHJcblx0XHRcdFx0dmFyIGtleXNEaWZmZXIgPSBmYWxzZVxyXG5cdFx0XHRcdGlmIChkYXRhLmxlbmd0aCAhPSBjYWNoZWQubGVuZ3RoKSBrZXlzRGlmZmVyID0gdHJ1ZVxyXG5cdFx0XHRcdGVsc2UgZm9yICh2YXIgaSA9IDAsIGNhY2hlZENlbGwsIGRhdGFDZWxsOyBjYWNoZWRDZWxsID0gY2FjaGVkW2ldLCBkYXRhQ2VsbCA9IGRhdGFbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKGNhY2hlZENlbGwuYXR0cnMgJiYgZGF0YUNlbGwuYXR0cnMgJiYgY2FjaGVkQ2VsbC5hdHRycy5rZXkgIT0gZGF0YUNlbGwuYXR0cnMua2V5KSB7XHJcblx0XHRcdFx0XHRcdGtleXNEaWZmZXIgPSB0cnVlXHJcblx0XHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmIChrZXlzRGlmZmVyKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoZGF0YVtpXSAmJiBkYXRhW2ldLmF0dHJzKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGRhdGFbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBrZXkgPSBkYXRhW2ldLmF0dHJzLmtleTtcclxuXHRcdFx0XHRcdFx0XHRcdGlmICghZXhpc3Rpbmdba2V5XSkgZXhpc3Rpbmdba2V5XSA9IHthY3Rpb246IElOU0VSVElPTiwgaW5kZXg6IGl9O1xyXG5cdFx0XHRcdFx0XHRcdFx0ZWxzZSBleGlzdGluZ1trZXldID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRhY3Rpb246IE1PVkUsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OiBpLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRmcm9tOiBleGlzdGluZ1trZXldLmluZGV4LFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRlbGVtZW50OiBjYWNoZWQubm9kZXNbZXhpc3Rpbmdba2V5XS5pbmRleF0gfHwgJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHZhciBhY3Rpb25zID0gW11cclxuXHRcdFx0XHRcdGZvciAodmFyIHByb3AgaW4gZXhpc3RpbmcpIGFjdGlvbnMucHVzaChleGlzdGluZ1twcm9wXSlcclxuXHRcdFx0XHRcdHZhciBjaGFuZ2VzID0gYWN0aW9ucy5zb3J0KHNvcnRDaGFuZ2VzKTtcclxuXHRcdFx0XHRcdHZhciBuZXdDYWNoZWQgPSBuZXcgQXJyYXkoY2FjaGVkLmxlbmd0aClcclxuXHRcdFx0XHRcdG5ld0NhY2hlZC5ub2RlcyA9IGNhY2hlZC5ub2Rlcy5zbGljZSgpXHJcblxyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNoYW5nZTsgY2hhbmdlID0gY2hhbmdlc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBERUxFVElPTikge1xyXG5cdFx0XHRcdFx0XHRcdGNsZWFyKGNhY2hlZFtjaGFuZ2UuaW5kZXhdLm5vZGVzLCBjYWNoZWRbY2hhbmdlLmluZGV4XSk7XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShjaGFuZ2UuaW5kZXgsIDEpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IElOU0VSVElPTikge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBkdW1teSA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cdFx0XHRcdFx0XHRcdGR1bW15LmtleSA9IGRhdGFbY2hhbmdlLmluZGV4XS5hdHRycy5rZXk7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoZHVtbXksIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdIHx8IG51bGwpO1xyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5zcGxpY2UoY2hhbmdlLmluZGV4LCAwLCB7YXR0cnM6IHtrZXk6IGRhdGFbY2hhbmdlLmluZGV4XS5hdHRycy5rZXl9LCBub2RlczogW2R1bW15XX0pXHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzW2NoYW5nZS5pbmRleF0gPSBkdW1teVxyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gTU9WRSkge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSAhPT0gY2hhbmdlLmVsZW1lbnQgJiYgY2hhbmdlLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoYW5nZS5lbGVtZW50LCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSB8fCBudWxsKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWRbY2hhbmdlLmluZGV4XSA9IGNhY2hlZFtjaGFuZ2UuZnJvbV1cclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbY2hhbmdlLmluZGV4XSA9IGNoYW5nZS5lbGVtZW50XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGNhY2hlZCA9IG5ld0NhY2hlZDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9lbmQga2V5IGFsZ29yaXRobVxyXG5cclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNhY2hlQ291bnQgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0Ly9kaWZmIGVhY2ggaXRlbSBpbiB0aGUgYXJyYXlcclxuXHRcdFx0XHR2YXIgaXRlbSA9IGJ1aWxkKHBhcmVudEVsZW1lbnQsIHBhcmVudFRhZywgY2FjaGVkLCBpbmRleCwgZGF0YVtpXSwgY2FjaGVkW2NhY2hlQ291bnRdLCBzaG91bGRSZWF0dGFjaCwgaW5kZXggKyBzdWJBcnJheUNvdW50IHx8IHN1YkFycmF5Q291bnQsIGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpO1xyXG5cdFx0XHRcdGlmIChpdGVtID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xyXG5cdFx0XHRcdGlmICghaXRlbS5ub2Rlcy5pbnRhY3QpIGludGFjdCA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmIChpdGVtLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0XHQvL2ZpeCBvZmZzZXQgb2YgbmV4dCBlbGVtZW50IGlmIGl0ZW0gd2FzIGEgdHJ1c3RlZCBzdHJpbmcgdy8gbW9yZSB0aGFuIG9uZSBodG1sIGVsZW1lbnRcclxuXHRcdFx0XHRcdC8vdGhlIGZpcnN0IGNsYXVzZSBpbiB0aGUgcmVnZXhwIG1hdGNoZXMgZWxlbWVudHNcclxuXHRcdFx0XHRcdC8vdGhlIHNlY29uZCBjbGF1c2UgKGFmdGVyIHRoZSBwaXBlKSBtYXRjaGVzIHRleHQgbm9kZXNcclxuXHRcdFx0XHRcdHN1YkFycmF5Q291bnQgKz0gKGl0ZW0ubWF0Y2goLzxbXlxcL118XFw+XFxzKltePF0vZykgfHwgWzBdKS5sZW5ndGhcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBzdWJBcnJheUNvdW50ICs9IHR5cGUuY2FsbChpdGVtKSA9PT0gQVJSQVkgPyBpdGVtLmxlbmd0aCA6IDE7XHJcblx0XHRcdFx0Y2FjaGVkW2NhY2hlQ291bnQrK10gPSBpdGVtXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFpbnRhY3QpIHtcclxuXHRcdFx0XHQvL2RpZmYgdGhlIGFycmF5IGl0c2VsZlxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdC8vdXBkYXRlIHRoZSBsaXN0IG9mIERPTSBub2RlcyBieSBjb2xsZWN0aW5nIHRoZSBub2RlcyBmcm9tIGVhY2ggaXRlbVxyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAoY2FjaGVkW2ldICE9IG51bGwpIG5vZGVzLnB1c2guYXBwbHkobm9kZXMsIGNhY2hlZFtpXS5ub2RlcylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly9yZW1vdmUgaXRlbXMgZnJvbSB0aGUgZW5kIG9mIHRoZSBhcnJheSBpZiB0aGUgbmV3IGFycmF5IGlzIHNob3J0ZXIgdGhhbiB0aGUgb2xkIG9uZVxyXG5cdFx0XHRcdC8vaWYgZXJyb3JzIGV2ZXIgaGFwcGVuIGhlcmUsIHRoZSBpc3N1ZSBpcyBtb3N0IGxpa2VseSBhIGJ1ZyBpbiB0aGUgY29uc3RydWN0aW9uIG9mIHRoZSBgY2FjaGVkYCBkYXRhIHN0cnVjdHVyZSBzb21ld2hlcmUgZWFybGllciBpbiB0aGUgcHJvZ3JhbVxyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBub2RlOyBub2RlID0gY2FjaGVkLm5vZGVzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChub2RlLnBhcmVudE5vZGUgIT0gbnVsbCAmJiBub2Rlcy5pbmRleE9mKG5vZGUpIDwgMCkgY2xlYXIoW25vZGVdLCBbY2FjaGVkW2ldXSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoIDwgY2FjaGVkLmxlbmd0aCkgY2FjaGVkLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKGRhdGEgIT0gbnVsbCAmJiBkYXRhVHlwZSA9PT0gT0JKRUNUKSB7XHJcblx0XHRcdHZhciB2aWV3cyA9IFtdLCBjb250cm9sbGVycyA9IFtdXHJcblx0XHRcdHdoaWxlIChkYXRhLnZpZXcpIHtcclxuXHRcdFx0XHR2YXIgdmlldyA9IGRhdGEudmlldy4kb3JpZ2luYWwgfHwgZGF0YS52aWV3XHJcblx0XHRcdFx0dmFyIGNvbnRyb2xsZXJJbmRleCA9IG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJkaWZmXCIgJiYgY2FjaGVkLnZpZXdzID8gY2FjaGVkLnZpZXdzLmluZGV4T2YodmlldykgOiAtMVxyXG5cdFx0XHRcdHZhciBjb250cm9sbGVyID0gY29udHJvbGxlckluZGV4ID4gLTEgPyBjYWNoZWQuY29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XSA6IG5ldyAoZGF0YS5jb250cm9sbGVyIHx8IG5vb3ApXHJcblx0XHRcdFx0dmFyIGtleSA9IGRhdGEgJiYgZGF0YS5hdHRycyAmJiBkYXRhLmF0dHJzLmtleVxyXG5cdFx0XHRcdGRhdGEgPSBwZW5kaW5nUmVxdWVzdHMgPT0gMCB8fCAoY2FjaGVkICYmIGNhY2hlZC5jb250cm9sbGVycyAmJiBjYWNoZWQuY29udHJvbGxlcnMuaW5kZXhPZihjb250cm9sbGVyKSA+IC0xKSA/IGRhdGEudmlldyhjb250cm9sbGVyKSA6IHt0YWc6IFwicGxhY2Vob2xkZXJcIn1cclxuXHRcdFx0XHRpZiAoZGF0YS5zdWJ0cmVlID09PSBcInJldGFpblwiKSByZXR1cm4gY2FjaGVkO1xyXG5cdFx0XHRcdGlmIChrZXkpIHtcclxuXHRcdFx0XHRcdGlmICghZGF0YS5hdHRycykgZGF0YS5hdHRycyA9IHt9XHJcblx0XHRcdFx0XHRkYXRhLmF0dHJzLmtleSA9IGtleVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCkgdW5sb2FkZXJzLnB1c2goe2NvbnRyb2xsZXI6IGNvbnRyb2xsZXIsIGhhbmRsZXI6IGNvbnRyb2xsZXIub251bmxvYWR9KVxyXG5cdFx0XHRcdHZpZXdzLnB1c2godmlldylcclxuXHRcdFx0XHRjb250cm9sbGVycy5wdXNoKGNvbnRyb2xsZXIpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFkYXRhLnRhZyAmJiBjb250cm9sbGVycy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIkNvbXBvbmVudCB0ZW1wbGF0ZSBtdXN0IHJldHVybiBhIHZpcnR1YWwgZWxlbWVudCwgbm90IGFuIGFycmF5LCBzdHJpbmcsIGV0Yy5cIilcclxuXHRcdFx0aWYgKCFkYXRhLmF0dHJzKSBkYXRhLmF0dHJzID0ge307XHJcblx0XHRcdGlmICghY2FjaGVkLmF0dHJzKSBjYWNoZWQuYXR0cnMgPSB7fTtcclxuXHJcblx0XHRcdHZhciBkYXRhQXR0cktleXMgPSBPYmplY3Qua2V5cyhkYXRhLmF0dHJzKVxyXG5cdFx0XHR2YXIgaGFzS2V5cyA9IGRhdGFBdHRyS2V5cy5sZW5ndGggPiAoXCJrZXlcIiBpbiBkYXRhLmF0dHJzID8gMSA6IDApXHJcblx0XHRcdC8vaWYgYW4gZWxlbWVudCBpcyBkaWZmZXJlbnQgZW5vdWdoIGZyb20gdGhlIG9uZSBpbiBjYWNoZSwgcmVjcmVhdGUgaXRcclxuXHRcdFx0aWYgKGRhdGEudGFnICE9IGNhY2hlZC50YWcgfHwgZGF0YUF0dHJLZXlzLnNvcnQoKS5qb2luKCkgIT0gT2JqZWN0LmtleXMoY2FjaGVkLmF0dHJzKS5zb3J0KCkuam9pbigpIHx8IGRhdGEuYXR0cnMuaWQgIT0gY2FjaGVkLmF0dHJzLmlkIHx8IGRhdGEuYXR0cnMua2V5ICE9IGNhY2hlZC5hdHRycy5rZXkgfHwgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJhbGxcIiAmJiAoIWNhY2hlZC5jb25maWdDb250ZXh0IHx8IGNhY2hlZC5jb25maWdDb250ZXh0LnJldGFpbiAhPT0gdHJ1ZSkpIHx8IChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwiZGlmZlwiICYmIGNhY2hlZC5jb25maWdDb250ZXh0ICYmIGNhY2hlZC5jb25maWdDb250ZXh0LnJldGFpbiA9PT0gZmFsc2UpKSB7XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5ub2Rlcy5sZW5ndGgpIGNsZWFyKGNhY2hlZC5ub2Rlcyk7XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmIHR5cGVvZiBjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKClcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNvbnRyb2xsZXJzKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNhY2hlZC5jb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY29udHJvbGxlci5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNvbnRyb2xsZXIub251bmxvYWQoe3ByZXZlbnREZWZhdWx0OiBub29wfSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGUuY2FsbChkYXRhLnRhZykgIT0gU1RSSU5HKSByZXR1cm47XHJcblxyXG5cdFx0XHR2YXIgbm9kZSwgaXNOZXcgPSBjYWNoZWQubm9kZXMubGVuZ3RoID09PSAwO1xyXG5cdFx0XHRpZiAoZGF0YS5hdHRycy54bWxucykgbmFtZXNwYWNlID0gZGF0YS5hdHRycy54bWxucztcclxuXHRcdFx0ZWxzZSBpZiAoZGF0YS50YWcgPT09IFwic3ZnXCIpIG5hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcclxuXHRcdFx0ZWxzZSBpZiAoZGF0YS50YWcgPT09IFwibWF0aFwiKSBuYW1lc3BhY2UgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUxcIjtcclxuXHRcdFx0XHJcblx0XHRcdGlmIChpc05ldykge1xyXG5cdFx0XHRcdGlmIChkYXRhLmF0dHJzLmlzKSBub2RlID0gbmFtZXNwYWNlID09PSB1bmRlZmluZWQgPyAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZywgZGF0YS5hdHRycy5pcykgOiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMuaXMpO1xyXG5cdFx0XHRcdGVsc2Ugbm9kZSA9IG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkID8gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGF0YS50YWcpIDogJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIGRhdGEudGFnKTtcclxuXHRcdFx0XHRjYWNoZWQgPSB7XHJcblx0XHRcdFx0XHR0YWc6IGRhdGEudGFnLFxyXG5cdFx0XHRcdFx0Ly9zZXQgYXR0cmlidXRlcyBmaXJzdCwgdGhlbiBjcmVhdGUgY2hpbGRyZW5cclxuXHRcdFx0XHRcdGF0dHJzOiBoYXNLZXlzID8gc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywgZGF0YS5hdHRycywge30sIG5hbWVzcGFjZSkgOiBkYXRhLmF0dHJzLFxyXG5cdFx0XHRcdFx0Y2hpbGRyZW46IGRhdGEuY2hpbGRyZW4gIT0gbnVsbCAmJiBkYXRhLmNoaWxkcmVuLmxlbmd0aCA+IDAgP1xyXG5cdFx0XHRcdFx0XHRidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgdHJ1ZSwgMCwgZGF0YS5hdHRycy5jb250ZW50ZWRpdGFibGUgPyBub2RlIDogZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncykgOlxyXG5cdFx0XHRcdFx0XHRkYXRhLmNoaWxkcmVuLFxyXG5cdFx0XHRcdFx0bm9kZXM6IFtub2RlXVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXJzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0Y2FjaGVkLnZpZXdzID0gdmlld3NcclxuXHRcdFx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQgJiYgY29udHJvbGxlci5vbnVubG9hZC4kb2xkKSBjb250cm9sbGVyLm9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZC4kb2xkXHJcblx0XHRcdFx0XHRcdGlmIChwZW5kaW5nUmVxdWVzdHMgJiYgY29udHJvbGxlci5vbnVubG9hZCkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBvbnVubG9hZCA9IGNvbnRyb2xsZXIub251bmxvYWRcclxuXHRcdFx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkID0gbm9vcFxyXG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQuJG9sZCA9IG9udW5sb2FkXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5jaGlsZHJlbiAmJiAhY2FjaGVkLmNoaWxkcmVuLm5vZGVzKSBjYWNoZWQuY2hpbGRyZW4ubm9kZXMgPSBbXTtcclxuXHRcdFx0XHQvL2VkZ2UgY2FzZTogc2V0dGluZyB2YWx1ZSBvbiA8c2VsZWN0PiBkb2Vzbid0IHdvcmsgYmVmb3JlIGNoaWxkcmVuIGV4aXN0LCBzbyBzZXQgaXQgYWdhaW4gYWZ0ZXIgY2hpbGRyZW4gaGF2ZSBiZWVuIGNyZWF0ZWRcclxuXHRcdFx0XHRpZiAoZGF0YS50YWcgPT09IFwic2VsZWN0XCIgJiYgXCJ2YWx1ZVwiIGluIGRhdGEuYXR0cnMpIHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIHt2YWx1ZTogZGF0YS5hdHRycy52YWx1ZX0sIHt9LCBuYW1lc3BhY2UpO1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRub2RlID0gY2FjaGVkLm5vZGVzWzBdO1xyXG5cdFx0XHRcdGlmIChoYXNLZXlzKSBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCBjYWNoZWQuYXR0cnMsIG5hbWVzcGFjZSk7XHJcblx0XHRcdFx0Y2FjaGVkLmNoaWxkcmVuID0gYnVpbGQobm9kZSwgZGF0YS50YWcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBkYXRhLmNoaWxkcmVuLCBjYWNoZWQuY2hpbGRyZW4sIGZhbHNlLCAwLCBkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKTtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZTtcclxuXHRcdFx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRjYWNoZWQudmlld3MgPSB2aWV3c1xyXG5cdFx0XHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHNob3VsZFJlYXR0YWNoID09PSB0cnVlICYmIG5vZGUgIT0gbnVsbCkgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vc2NoZWR1bGUgY29uZmlncyB0byBiZSBjYWxsZWQuIFRoZXkgYXJlIGNhbGxlZCBhZnRlciBgYnVpbGRgIGZpbmlzaGVzIHJ1bm5pbmdcclxuXHRcdFx0aWYgKHR5cGVvZiBkYXRhLmF0dHJzW1wiY29uZmlnXCJdID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHZhciBjb250ZXh0ID0gY2FjaGVkLmNvbmZpZ0NvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCB8fCB7fTtcclxuXHJcblx0XHRcdFx0Ly8gYmluZFxyXG5cdFx0XHRcdHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGRhdGEsIGFyZ3MpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGRhdGEuYXR0cnNbXCJjb25maWdcIl0uYXBwbHkoZGF0YSwgYXJncylcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGNvbmZpZ3MucHVzaChjYWxsYmFjayhkYXRhLCBbbm9kZSwgIWlzTmV3LCBjb250ZXh0LCBjYWNoZWRdKSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGRhdGEgIT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0Ly9oYW5kbGUgdGV4dCBub2Rlc1xyXG5cdFx0XHR2YXIgbm9kZXM7XHJcblx0XHRcdGlmIChjYWNoZWQubm9kZXMubGVuZ3RoID09PSAwKSB7XHJcblx0XHRcdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRub2RlcyA9IFskZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSldO1xyXG5cdFx0XHRcdFx0aWYgKCFwYXJlbnRFbGVtZW50Lm5vZGVOYW1lLm1hdGNoKHZvaWRFbGVtZW50cykpIHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGVzWzBdLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhY2hlZCA9IFwic3RyaW5nIG51bWJlciBib29sZWFuXCIuaW5kZXhPZih0eXBlb2YgZGF0YSkgPiAtMSA/IG5ldyBkYXRhLmNvbnN0cnVjdG9yKGRhdGEpIDogZGF0YTtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKGNhY2hlZC52YWx1ZU9mKCkgIT09IGRhdGEudmFsdWVPZigpIHx8IHNob3VsZFJlYXR0YWNoID09PSB0cnVlKSB7XHJcblx0XHRcdFx0bm9kZXMgPSBjYWNoZWQubm9kZXM7XHJcblx0XHRcdFx0aWYgKCFlZGl0YWJsZSB8fCBlZGl0YWJsZSAhPT0gJGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHtcclxuXHRcdFx0XHRcdGlmIChkYXRhLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0XHRcdGNsZWFyKG5vZGVzLCBjYWNoZWQpO1xyXG5cdFx0XHRcdFx0XHRub2RlcyA9IGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0Ly9jb3JuZXIgY2FzZTogcmVwbGFjaW5nIHRoZSBub2RlVmFsdWUgb2YgYSB0ZXh0IG5vZGUgdGhhdCBpcyBhIGNoaWxkIG9mIGEgdGV4dGFyZWEvY29udGVudGVkaXRhYmxlIGRvZXNuJ3Qgd29ya1xyXG5cdFx0XHRcdFx0XHQvL3dlIG5lZWQgdG8gdXBkYXRlIHRoZSB2YWx1ZSBwcm9wZXJ0eSBvZiB0aGUgcGFyZW50IHRleHRhcmVhIG9yIHRoZSBpbm5lckhUTUwgb2YgdGhlIGNvbnRlbnRlZGl0YWJsZSBlbGVtZW50IGluc3RlYWRcclxuXHRcdFx0XHRcdFx0aWYgKHBhcmVudFRhZyA9PT0gXCJ0ZXh0YXJlYVwiKSBwYXJlbnRFbGVtZW50LnZhbHVlID0gZGF0YTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoZWRpdGFibGUpIGVkaXRhYmxlLmlubmVySFRNTCA9IGRhdGE7XHJcblx0XHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChub2Rlc1swXS5ub2RlVHlwZSA9PT0gMSB8fCBub2Rlcy5sZW5ndGggPiAxKSB7IC8vd2FzIGEgdHJ1c3RlZCBzdHJpbmdcclxuXHRcdFx0XHRcdFx0XHRcdGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKTtcclxuXHRcdFx0XHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZXNbMF0sIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbCk7XHJcblx0XHRcdFx0XHRcdFx0bm9kZXNbMF0ubm9kZVZhbHVlID0gZGF0YVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhY2hlZCA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yKGRhdGEpO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBjYWNoZWRcclxuXHR9XHJcblx0ZnVuY3Rpb24gc29ydENoYW5nZXMoYSwgYikge3JldHVybiBhLmFjdGlvbiAtIGIuYWN0aW9uIHx8IGEuaW5kZXggLSBiLmluZGV4fVxyXG5cdGZ1bmN0aW9uIHNldEF0dHJpYnV0ZXMobm9kZSwgdGFnLCBkYXRhQXR0cnMsIGNhY2hlZEF0dHJzLCBuYW1lc3BhY2UpIHtcclxuXHRcdGZvciAodmFyIGF0dHJOYW1lIGluIGRhdGFBdHRycykge1xyXG5cdFx0XHR2YXIgZGF0YUF0dHIgPSBkYXRhQXR0cnNbYXR0ck5hbWVdO1xyXG5cdFx0XHR2YXIgY2FjaGVkQXR0ciA9IGNhY2hlZEF0dHJzW2F0dHJOYW1lXTtcclxuXHRcdFx0aWYgKCEoYXR0ck5hbWUgaW4gY2FjaGVkQXR0cnMpIHx8IChjYWNoZWRBdHRyICE9PSBkYXRhQXR0cikpIHtcclxuXHRcdFx0XHRjYWNoZWRBdHRyc1thdHRyTmFtZV0gPSBkYXRhQXR0cjtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly9gY29uZmlnYCBpc24ndCBhIHJlYWwgYXR0cmlidXRlcywgc28gaWdub3JlIGl0XHJcblx0XHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IFwiY29uZmlnXCIgfHwgYXR0ck5hbWUgPT0gXCJrZXlcIikgY29udGludWU7XHJcblx0XHRcdFx0XHQvL2hvb2sgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIGF1dG8tcmVkcmF3aW5nIHN5c3RlbVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIGRhdGFBdHRyID09PSBGVU5DVElPTiAmJiBhdHRyTmFtZS5pbmRleE9mKFwib25cIikgPT09IDApIHtcclxuXHRcdFx0XHRcdFx0bm9kZVthdHRyTmFtZV0gPSBhdXRvcmVkcmF3KGRhdGFBdHRyLCBub2RlKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9oYW5kbGUgYHN0eWxlOiB7Li4ufWBcclxuXHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInN0eWxlXCIgJiYgZGF0YUF0dHIgIT0gbnVsbCAmJiB0eXBlLmNhbGwoZGF0YUF0dHIpID09PSBPQkpFQ1QpIHtcclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcnVsZSBpbiBkYXRhQXR0cikge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChjYWNoZWRBdHRyID09IG51bGwgfHwgY2FjaGVkQXR0cltydWxlXSAhPT0gZGF0YUF0dHJbcnVsZV0pIG5vZGUuc3R5bGVbcnVsZV0gPSBkYXRhQXR0cltydWxlXVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGZvciAodmFyIHJ1bGUgaW4gY2FjaGVkQXR0cikge1xyXG5cdFx0XHRcdFx0XHRcdGlmICghKHJ1bGUgaW4gZGF0YUF0dHIpKSBub2RlLnN0eWxlW3J1bGVdID0gXCJcIlxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBTVkdcclxuXHRcdFx0XHRcdGVsc2UgaWYgKG5hbWVzcGFjZSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gXCJocmVmXCIpIG5vZGUuc2V0QXR0cmlidXRlTlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsIFwiaHJlZlwiLCBkYXRhQXR0cik7XHJcblx0XHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcImNsYXNzTmFtZVwiKSBub2RlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGRhdGFBdHRyKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBjYXNlcyB0aGF0IGFyZSBwcm9wZXJ0aWVzIChidXQgaWdub3JlIGNhc2VzIHdoZXJlIHdlIHNob3VsZCB1c2Ugc2V0QXR0cmlidXRlIGluc3RlYWQpXHJcblx0XHRcdFx0XHQvLy0gbGlzdCBhbmQgZm9ybSBhcmUgdHlwaWNhbGx5IHVzZWQgYXMgc3RyaW5ncywgYnV0IGFyZSBET00gZWxlbWVudCByZWZlcmVuY2VzIGluIGpzXHJcblx0XHRcdFx0XHQvLy0gd2hlbiB1c2luZyBDU1Mgc2VsZWN0b3JzIChlLmcuIGBtKFwiW3N0eWxlPScnXVwiKWApLCBzdHlsZSBpcyB1c2VkIGFzIGEgc3RyaW5nLCBidXQgaXQncyBhbiBvYmplY3QgaW4ganNcclxuXHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lIGluIG5vZGUgJiYgIShhdHRyTmFtZSA9PT0gXCJsaXN0XCIgfHwgYXR0ck5hbWUgPT09IFwic3R5bGVcIiB8fCBhdHRyTmFtZSA9PT0gXCJmb3JtXCIgfHwgYXR0ck5hbWUgPT09IFwidHlwZVwiIHx8IGF0dHJOYW1lID09PSBcIndpZHRoXCIgfHwgYXR0ck5hbWUgPT09IFwiaGVpZ2h0XCIpKSB7XHJcblx0XHRcdFx0XHRcdC8vIzM0OCBkb24ndCBzZXQgdGhlIHZhbHVlIGlmIG5vdCBuZWVkZWQgb3RoZXJ3aXNlIGN1cnNvciBwbGFjZW1lbnQgYnJlYWtzIGluIENocm9tZVxyXG5cdFx0XHRcdFx0XHRpZiAodGFnICE9PSBcImlucHV0XCIgfHwgbm9kZVthdHRyTmFtZV0gIT09IGRhdGFBdHRyKSBub2RlW2F0dHJOYW1lXSA9IGRhdGFBdHRyXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdC8vc3dhbGxvdyBJRSdzIGludmFsaWQgYXJndW1lbnQgZXJyb3JzIHRvIG1pbWljIEhUTUwncyBmYWxsYmFjay10by1kb2luZy1ub3RoaW5nLW9uLWludmFsaWQtYXR0cmlidXRlcyBiZWhhdmlvclxyXG5cdFx0XHRcdFx0aWYgKGUubWVzc2FnZS5pbmRleE9mKFwiSW52YWxpZCBhcmd1bWVudFwiKSA8IDApIHRocm93IGVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8jMzQ4IGRhdGFBdHRyIG1heSBub3QgYmUgYSBzdHJpbmcsIHNvIHVzZSBsb29zZSBjb21wYXJpc29uIChkb3VibGUgZXF1YWwpIGluc3RlYWQgb2Ygc3RyaWN0ICh0cmlwbGUgZXF1YWwpXHJcblx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInZhbHVlXCIgJiYgdGFnID09PSBcImlucHV0XCIgJiYgbm9kZS52YWx1ZSAhPSBkYXRhQXR0cikge1xyXG5cdFx0XHRcdG5vZGUudmFsdWUgPSBkYXRhQXR0clxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY2FjaGVkQXR0cnNcclxuXHR9XHJcblx0ZnVuY3Rpb24gY2xlYXIobm9kZXMsIGNhY2hlZCkge1xyXG5cdFx0Zm9yICh2YXIgaSA9IG5vZGVzLmxlbmd0aCAtIDE7IGkgPiAtMTsgaS0tKSB7XHJcblx0XHRcdGlmIChub2Rlc1tpXSAmJiBub2Rlc1tpXS5wYXJlbnROb2RlKSB7XHJcblx0XHRcdFx0dHJ5IHtub2Rlc1tpXS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGVzW2ldKX1cclxuXHRcdFx0XHRjYXRjaCAoZSkge30gLy9pZ25vcmUgaWYgdGhpcyBmYWlscyBkdWUgdG8gb3JkZXIgb2YgZXZlbnRzIChzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMTkyNjA4My9mYWlsZWQtdG8tZXhlY3V0ZS1yZW1vdmVjaGlsZC1vbi1ub2RlKVxyXG5cdFx0XHRcdGNhY2hlZCA9IFtdLmNvbmNhdChjYWNoZWQpO1xyXG5cdFx0XHRcdGlmIChjYWNoZWRbaV0pIHVubG9hZChjYWNoZWRbaV0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChub2Rlcy5sZW5ndGggIT0gMCkgbm9kZXMubGVuZ3RoID0gMFxyXG5cdH1cclxuXHRmdW5jdGlvbiB1bmxvYWQoY2FjaGVkKSB7XHJcblx0XHRpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgdHlwZW9mIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCgpO1xyXG5cdFx0XHRjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCA9IG51bGxcclxuXHRcdH1cclxuXHRcdGlmIChjYWNoZWQuY29udHJvbGxlcnMpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNvbnRyb2xsZXI7IGNvbnRyb2xsZXIgPSBjYWNoZWQuY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgY29udHJvbGxlci5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNvbnRyb2xsZXIub251bmxvYWQoe3ByZXZlbnREZWZhdWx0OiBub29wfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChjYWNoZWQuY2hpbGRyZW4pIHtcclxuXHRcdFx0aWYgKHR5cGUuY2FsbChjYWNoZWQuY2hpbGRyZW4pID09PSBBUlJBWSkge1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjaGlsZDsgY2hpbGQgPSBjYWNoZWQuY2hpbGRyZW5baV07IGkrKykgdW5sb2FkKGNoaWxkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKGNhY2hlZC5jaGlsZHJlbi50YWcpIHVubG9hZChjYWNoZWQuY2hpbGRyZW4pXHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpIHtcclxuXHRcdHZhciBuZXh0U2libGluZyA9IHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF07XHJcblx0XHRpZiAobmV4dFNpYmxpbmcpIHtcclxuXHRcdFx0dmFyIGlzRWxlbWVudCA9IG5leHRTaWJsaW5nLm5vZGVUeXBlICE9IDE7XHJcblx0XHRcdHZhciBwbGFjZWhvbGRlciA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuXHRcdFx0aWYgKGlzRWxlbWVudCkge1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyLCBuZXh0U2libGluZyB8fCBudWxsKTtcclxuXHRcdFx0XHRwbGFjZWhvbGRlci5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKTtcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgbmV4dFNpYmxpbmcuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlYmVnaW5cIiwgZGF0YSlcclxuXHRcdH1cclxuXHRcdGVsc2UgcGFyZW50RWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmVlbmRcIiwgZGF0YSk7XHJcblx0XHR2YXIgbm9kZXMgPSBbXTtcclxuXHRcdHdoaWxlIChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdICE9PSBuZXh0U2libGluZykge1xyXG5cdFx0XHRub2Rlcy5wdXNoKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0pO1xyXG5cdFx0XHRpbmRleCsrXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbm9kZXNcclxuXHR9XHJcblx0ZnVuY3Rpb24gYXV0b3JlZHJhdyhjYWxsYmFjaywgb2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpO1xyXG5cdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0dHJ5IHtyZXR1cm4gY2FsbGJhY2suY2FsbChvYmplY3QsIGUpfVxyXG5cdFx0XHRmaW5hbGx5IHtcclxuXHRcdFx0XHRlbmRGaXJzdENvbXB1dGF0aW9uKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGh0bWw7XHJcblx0dmFyIGRvY3VtZW50Tm9kZSA9IHtcclxuXHRcdGFwcGVuZENoaWxkOiBmdW5jdGlvbihub2RlKSB7XHJcblx0XHRcdGlmIChodG1sID09PSB1bmRlZmluZWQpIGh0bWwgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImh0bWxcIik7XHJcblx0XHRcdGlmICgkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgIT09IG5vZGUpIHtcclxuXHRcdFx0XHQkZG9jdW1lbnQucmVwbGFjZUNoaWxkKG5vZGUsICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSAkZG9jdW1lbnQuYXBwZW5kQ2hpbGQobm9kZSk7XHJcblx0XHRcdHRoaXMuY2hpbGROb2RlcyA9ICRkb2N1bWVudC5jaGlsZE5vZGVzXHJcblx0XHR9LFxyXG5cdFx0aW5zZXJ0QmVmb3JlOiBmdW5jdGlvbihub2RlKSB7XHJcblx0XHRcdHRoaXMuYXBwZW5kQ2hpbGQobm9kZSlcclxuXHRcdH0sXHJcblx0XHRjaGlsZE5vZGVzOiBbXVxyXG5cdH07XHJcblx0dmFyIG5vZGVDYWNoZSA9IFtdLCBjZWxsQ2FjaGUgPSB7fTtcclxuXHRtLnJlbmRlciA9IGZ1bmN0aW9uKHJvb3QsIGNlbGwsIGZvcmNlUmVjcmVhdGlvbikge1xyXG5cdFx0dmFyIGNvbmZpZ3MgPSBbXTtcclxuXHRcdGlmICghcm9vdCkgdGhyb3cgbmV3IEVycm9yKFwiRW5zdXJlIHRoZSBET00gZWxlbWVudCBiZWluZyBwYXNzZWQgdG8gbS5yb3V0ZS9tLm1vdW50L20ucmVuZGVyIGlzIG5vdCB1bmRlZmluZWQuXCIpO1xyXG5cdFx0dmFyIGlkID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpO1xyXG5cdFx0dmFyIGlzRG9jdW1lbnRSb290ID0gcm9vdCA9PT0gJGRvY3VtZW50O1xyXG5cdFx0dmFyIG5vZGUgPSBpc0RvY3VtZW50Um9vdCB8fCByb290ID09PSAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ID8gZG9jdW1lbnROb2RlIDogcm9vdDtcclxuXHRcdGlmIChpc0RvY3VtZW50Um9vdCAmJiBjZWxsLnRhZyAhPSBcImh0bWxcIikgY2VsbCA9IHt0YWc6IFwiaHRtbFwiLCBhdHRyczoge30sIGNoaWxkcmVuOiBjZWxsfTtcclxuXHRcdGlmIChjZWxsQ2FjaGVbaWRdID09PSB1bmRlZmluZWQpIGNsZWFyKG5vZGUuY2hpbGROb2Rlcyk7XHJcblx0XHRpZiAoZm9yY2VSZWNyZWF0aW9uID09PSB0cnVlKSByZXNldChyb290KTtcclxuXHRcdGNlbGxDYWNoZVtpZF0gPSBidWlsZChub2RlLCBudWxsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2VsbCwgY2VsbENhY2hlW2lkXSwgZmFsc2UsIDAsIG51bGwsIHVuZGVmaW5lZCwgY29uZmlncyk7XHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gY29uZmlncy5sZW5ndGg7IGkgPCBsZW47IGkrKykgY29uZmlnc1tpXSgpXHJcblx0fTtcclxuXHRmdW5jdGlvbiBnZXRDZWxsQ2FjaGVLZXkoZWxlbWVudCkge1xyXG5cdFx0dmFyIGluZGV4ID0gbm9kZUNhY2hlLmluZGV4T2YoZWxlbWVudCk7XHJcblx0XHRyZXR1cm4gaW5kZXggPCAwID8gbm9kZUNhY2hlLnB1c2goZWxlbWVudCkgLSAxIDogaW5kZXhcclxuXHR9XHJcblxyXG5cdG0udHJ1c3QgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0dmFsdWUgPSBuZXcgU3RyaW5nKHZhbHVlKTtcclxuXHRcdHZhbHVlLiR0cnVzdGVkID0gdHJ1ZTtcclxuXHRcdHJldHVybiB2YWx1ZVxyXG5cdH07XHJcblxyXG5cdGZ1bmN0aW9uIGdldHRlcnNldHRlcihzdG9yZSkge1xyXG5cdFx0dmFyIHByb3AgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGgpIHN0b3JlID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH07XHJcblxyXG5cdFx0cHJvcC50b0pTT04gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIHN0b3JlXHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBwcm9wXHJcblx0fVxyXG5cclxuXHRtLnByb3AgPSBmdW5jdGlvbiAoc3RvcmUpIHtcclxuXHRcdC8vbm90ZTogdXNpbmcgbm9uLXN0cmljdCBlcXVhbGl0eSBjaGVjayBoZXJlIGJlY2F1c2Ugd2UncmUgY2hlY2tpbmcgaWYgc3RvcmUgaXMgbnVsbCBPUiB1bmRlZmluZWRcclxuXHRcdGlmICgoKHN0b3JlICE9IG51bGwgJiYgdHlwZS5jYWxsKHN0b3JlKSA9PT0gT0JKRUNUKSB8fCB0eXBlb2Ygc3RvcmUgPT09IEZVTkNUSU9OKSAmJiB0eXBlb2Ygc3RvcmUudGhlbiA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0cmV0dXJuIHByb3BpZnkoc3RvcmUpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGdldHRlcnNldHRlcihzdG9yZSlcclxuXHR9O1xyXG5cclxuXHR2YXIgcm9vdHMgPSBbXSwgY29tcG9uZW50cyA9IFtdLCBjb250cm9sbGVycyA9IFtdLCBsYXN0UmVkcmF3SWQgPSBudWxsLCBsYXN0UmVkcmF3Q2FsbFRpbWUgPSAwLCBjb21wdXRlUHJlUmVkcmF3SG9vayA9IG51bGwsIGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGwsIHByZXZlbnRlZCA9IGZhbHNlLCB0b3BDb21wb25lbnQsIHVubG9hZGVycyA9IFtdO1xyXG5cdHZhciBGUkFNRV9CVURHRVQgPSAxNjsgLy82MCBmcmFtZXMgcGVyIHNlY29uZCA9IDEgY2FsbCBwZXIgMTYgbXNcclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBhcmdzKSB7XHJcblx0XHR2YXIgY29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gKGNvbXBvbmVudC5jb250cm9sbGVyIHx8IG5vb3ApLmFwcGx5KHRoaXMsIGFyZ3MpIHx8IHRoaXNcclxuXHRcdH1cclxuXHRcdHZhciB2aWV3ID0gZnVuY3Rpb24oY3RybCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIGFyZ3MgPSBhcmdzLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXHJcblx0XHRcdHJldHVybiBjb21wb25lbnQudmlldy5hcHBseShjb21wb25lbnQsIGFyZ3MgPyBbY3RybF0uY29uY2F0KGFyZ3MpIDogW2N0cmxdKVxyXG5cdFx0fVxyXG5cdFx0dmlldy4kb3JpZ2luYWwgPSBjb21wb25lbnQudmlld1xyXG5cdFx0dmFyIG91dHB1dCA9IHtjb250cm9sbGVyOiBjb250cm9sbGVyLCB2aWV3OiB2aWV3fVxyXG5cdFx0aWYgKGFyZ3NbMF0gJiYgYXJnc1swXS5rZXkgIT0gbnVsbCkgb3V0cHV0LmF0dHJzID0ge2tleTogYXJnc1swXS5rZXl9XHJcblx0XHRyZXR1cm4gb3V0cHV0XHJcblx0fVxyXG5cdG0uY29tcG9uZW50ID0gZnVuY3Rpb24oY29tcG9uZW50KSB7XHJcblx0XHRyZXR1cm4gcGFyYW1ldGVyaXplKGNvbXBvbmVudCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxyXG5cdH1cclxuXHRtLm1vdW50ID0gbS5tb2R1bGUgPSBmdW5jdGlvbihyb290LCBjb21wb25lbnQpIHtcclxuXHRcdGlmICghcm9vdCkgdGhyb3cgbmV3IEVycm9yKFwiUGxlYXNlIGVuc3VyZSB0aGUgRE9NIGVsZW1lbnQgZXhpc3RzIGJlZm9yZSByZW5kZXJpbmcgYSB0ZW1wbGF0ZSBpbnRvIGl0LlwiKTtcclxuXHRcdHZhciBpbmRleCA9IHJvb3RzLmluZGV4T2Yocm9vdCk7XHJcblx0XHRpZiAoaW5kZXggPCAwKSBpbmRleCA9IHJvb3RzLmxlbmd0aDtcclxuXHRcdFxyXG5cdFx0dmFyIGlzUHJldmVudGVkID0gZmFsc2U7XHJcblx0XHR2YXIgZXZlbnQgPSB7cHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpc1ByZXZlbnRlZCA9IHRydWU7XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gY29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbDtcclxuXHRcdH19O1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIHVubG9hZGVyOyB1bmxvYWRlciA9IHVubG9hZGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdHVubG9hZGVyLmhhbmRsZXIuY2FsbCh1bmxvYWRlci5jb250cm9sbGVyLCBldmVudClcclxuXHRcdFx0dW5sb2FkZXIuY29udHJvbGxlci5vbnVubG9hZCA9IG51bGxcclxuXHRcdH1cclxuXHRcdGlmIChpc1ByZXZlbnRlZCkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgdW5sb2FkZXI7IHVubG9hZGVyID0gdW5sb2FkZXJzW2ldOyBpKyspIHVubG9hZGVyLmNvbnRyb2xsZXIub251bmxvYWQgPSB1bmxvYWRlci5oYW5kbGVyXHJcblx0XHR9XHJcblx0XHRlbHNlIHVubG9hZGVycyA9IFtdXHJcblx0XHRcclxuXHRcdGlmIChjb250cm9sbGVyc1tpbmRleF0gJiYgdHlwZW9mIGNvbnRyb2xsZXJzW2luZGV4XS5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0Y29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkKGV2ZW50KVxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZiAoIWlzUHJldmVudGVkKSB7XHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiYWxsXCIpO1xyXG5cdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0cm9vdHNbaW5kZXhdID0gcm9vdDtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSBjb21wb25lbnQgPSBzdWJjb21wb25lbnQoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMikpXHJcblx0XHRcdHZhciBjdXJyZW50Q29tcG9uZW50ID0gdG9wQ29tcG9uZW50ID0gY29tcG9uZW50ID0gY29tcG9uZW50IHx8IHtjb250cm9sbGVyOiBmdW5jdGlvbigpIHt9fTtcclxuXHRcdFx0dmFyIGNvbnN0cnVjdG9yID0gY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcFxyXG5cdFx0XHR2YXIgY29udHJvbGxlciA9IG5ldyBjb25zdHJ1Y3RvcjtcclxuXHRcdFx0Ly9jb250cm9sbGVycyBtYXkgY2FsbCBtLm1vdW50IHJlY3Vyc2l2ZWx5ICh2aWEgbS5yb3V0ZSByZWRpcmVjdHMsIGZvciBleGFtcGxlKVxyXG5cdFx0XHQvL3RoaXMgY29uZGl0aW9uYWwgZW5zdXJlcyBvbmx5IHRoZSBsYXN0IHJlY3Vyc2l2ZSBtLm1vdW50IGNhbGwgaXMgYXBwbGllZFxyXG5cdFx0XHRpZiAoY3VycmVudENvbXBvbmVudCA9PT0gdG9wQ29tcG9uZW50KSB7XHJcblx0XHRcdFx0Y29udHJvbGxlcnNbaW5kZXhdID0gY29udHJvbGxlcjtcclxuXHRcdFx0XHRjb21wb25lbnRzW2luZGV4XSA9IGNvbXBvbmVudFxyXG5cdFx0XHR9XHJcblx0XHRcdGVuZEZpcnN0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0cmV0dXJuIGNvbnRyb2xsZXJzW2luZGV4XVxyXG5cdFx0fVxyXG5cdH07XHJcblx0dmFyIHJlZHJhd2luZyA9IGZhbHNlXHJcblx0bS5yZWRyYXcgPSBmdW5jdGlvbihmb3JjZSkge1xyXG5cdFx0aWYgKHJlZHJhd2luZykgcmV0dXJuXHJcblx0XHRyZWRyYXdpbmcgPSB0cnVlXHJcblx0XHQvL2xhc3RSZWRyYXdJZCBpcyBhIHBvc2l0aXZlIG51bWJlciBpZiBhIHNlY29uZCByZWRyYXcgaXMgcmVxdWVzdGVkIGJlZm9yZSB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWVcclxuXHRcdC8vbGFzdFJlZHJhd0lEIGlzIG51bGwgaWYgaXQncyB0aGUgZmlyc3QgcmVkcmF3IGFuZCBub3QgYW4gZXZlbnQgaGFuZGxlclxyXG5cdFx0aWYgKGxhc3RSZWRyYXdJZCAmJiBmb3JjZSAhPT0gdHJ1ZSkge1xyXG5cdFx0XHQvL3doZW4gc2V0VGltZW91dDogb25seSByZXNjaGVkdWxlIHJlZHJhdyBpZiB0aW1lIGJldHdlZW4gbm93IGFuZCBwcmV2aW91cyByZWRyYXcgaXMgYmlnZ2VyIHRoYW4gYSBmcmFtZSwgb3RoZXJ3aXNlIGtlZXAgY3VycmVudGx5IHNjaGVkdWxlZCB0aW1lb3V0XHJcblx0XHRcdC8vd2hlbiByQUY6IGFsd2F5cyByZXNjaGVkdWxlIHJlZHJhd1xyXG5cdFx0XHRpZiAoJHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBuZXcgRGF0ZSAtIGxhc3RSZWRyYXdDYWxsVGltZSA+IEZSQU1FX0JVREdFVCkge1xyXG5cdFx0XHRcdGlmIChsYXN0UmVkcmF3SWQgPiAwKSAkY2FuY2VsQW5pbWF0aW9uRnJhbWUobGFzdFJlZHJhd0lkKTtcclxuXHRcdFx0XHRsYXN0UmVkcmF3SWQgPSAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlZHJhdywgRlJBTUVfQlVER0VUKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmVkcmF3KCk7XHJcblx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7bGFzdFJlZHJhd0lkID0gbnVsbH0sIEZSQU1FX0JVREdFVClcclxuXHRcdH1cclxuXHRcdHJlZHJhd2luZyA9IGZhbHNlXHJcblx0fTtcclxuXHRtLnJlZHJhdy5zdHJhdGVneSA9IG0ucHJvcCgpO1xyXG5cdGZ1bmN0aW9uIHJlZHJhdygpIHtcclxuXHRcdGlmIChjb21wdXRlUHJlUmVkcmF3SG9vaykge1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vaygpXHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIHJvb3Q7IHJvb3QgPSByb290c1tpXTsgaSsrKSB7XHJcblx0XHRcdGlmIChjb250cm9sbGVyc1tpXSkge1xyXG5cdFx0XHRcdHZhciBhcmdzID0gY29tcG9uZW50c1tpXS5jb250cm9sbGVyICYmIGNvbXBvbmVudHNbaV0uY29udHJvbGxlci4kJGFyZ3MgPyBbY29udHJvbGxlcnNbaV1dLmNvbmNhdChjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIuJCRhcmdzKSA6IFtjb250cm9sbGVyc1tpXV1cclxuXHRcdFx0XHRtLnJlbmRlcihyb290LCBjb21wb25lbnRzW2ldLnZpZXcgPyBjb21wb25lbnRzW2ldLnZpZXcoY29udHJvbGxlcnNbaV0sIGFyZ3MpIDogXCJcIilcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly9hZnRlciByZW5kZXJpbmcgd2l0aGluIGEgcm91dGVkIGNvbnRleHQsIHdlIG5lZWQgdG8gc2Nyb2xsIGJhY2sgdG8gdGhlIHRvcCwgYW5kIGZldGNoIHRoZSBkb2N1bWVudCB0aXRsZSBmb3IgaGlzdG9yeS5wdXNoU3RhdGVcclxuXHRcdGlmIChjb21wdXRlUG9zdFJlZHJhd0hvb2spIHtcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rKCk7XHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGxhc3RSZWRyYXdJZCA9IG51bGw7XHJcblx0XHRsYXN0UmVkcmF3Q2FsbFRpbWUgPSBuZXcgRGF0ZTtcclxuXHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdH1cclxuXHJcblx0dmFyIHBlbmRpbmdSZXF1ZXN0cyA9IDA7XHJcblx0bS5zdGFydENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7cGVuZGluZ1JlcXVlc3RzKyt9O1xyXG5cdG0uZW5kQ29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHRcdHBlbmRpbmdSZXF1ZXN0cyA9IE1hdGgubWF4KHBlbmRpbmdSZXF1ZXN0cyAtIDEsIDApO1xyXG5cdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyA9PT0gMCkgbS5yZWRyYXcoKVxyXG5cdH07XHJcblx0dmFyIGVuZEZpcnN0Q29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwibm9uZVwiKSB7XHJcblx0XHRcdHBlbmRpbmdSZXF1ZXN0cy0tXHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBtLmVuZENvbXB1dGF0aW9uKCk7XHJcblx0fVxyXG5cclxuXHRtLndpdGhBdHRyID0gZnVuY3Rpb24ocHJvcCwgd2l0aEF0dHJDYWxsYmFjaykge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IHRoaXM7XHJcblx0XHRcdHdpdGhBdHRyQ2FsbGJhY2socHJvcCBpbiBjdXJyZW50VGFyZ2V0ID8gY3VycmVudFRhcmdldFtwcm9wXSA6IGN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKHByb3ApKVxyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdC8vcm91dGluZ1xyXG5cdHZhciBtb2RlcyA9IHtwYXRobmFtZTogXCJcIiwgaGFzaDogXCIjXCIsIHNlYXJjaDogXCI/XCJ9O1xyXG5cdHZhciByZWRpcmVjdCA9IG5vb3AsIHJvdXRlUGFyYW1zLCBjdXJyZW50Um91dGUsIGlzRGVmYXVsdFJvdXRlID0gZmFsc2U7XHJcblx0bS5yb3V0ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly9tLnJvdXRlKClcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gY3VycmVudFJvdXRlO1xyXG5cdFx0Ly9tLnJvdXRlKGVsLCBkZWZhdWx0Um91dGUsIHJvdXRlcylcclxuXHRcdGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgdHlwZS5jYWxsKGFyZ3VtZW50c1sxXSkgPT09IFNUUklORykge1xyXG5cdFx0XHR2YXIgcm9vdCA9IGFyZ3VtZW50c1swXSwgZGVmYXVsdFJvdXRlID0gYXJndW1lbnRzWzFdLCByb3V0ZXIgPSBhcmd1bWVudHNbMl07XHJcblx0XHRcdHJlZGlyZWN0ID0gZnVuY3Rpb24oc291cmNlKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSBjdXJyZW50Um91dGUgPSBub3JtYWxpemVSb3V0ZShzb3VyY2UpO1xyXG5cdFx0XHRcdGlmICghcm91dGVCeVZhbHVlKHJvb3QsIHJvdXRlciwgcGF0aCkpIHtcclxuXHRcdFx0XHRcdGlmIChpc0RlZmF1bHRSb3V0ZSkgdGhyb3cgbmV3IEVycm9yKFwiRW5zdXJlIHRoZSBkZWZhdWx0IHJvdXRlIG1hdGNoZXMgb25lIG9mIHRoZSByb3V0ZXMgZGVmaW5lZCBpbiBtLnJvdXRlXCIpXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IHRydWVcclxuXHRcdFx0XHRcdG0ucm91dGUoZGVmYXVsdFJvdXRlLCB0cnVlKVxyXG5cdFx0XHRcdFx0aXNEZWZhdWx0Um91dGUgPSBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0dmFyIGxpc3RlbmVyID0gbS5yb3V0ZS5tb2RlID09PSBcImhhc2hcIiA/IFwib25oYXNoY2hhbmdlXCIgOiBcIm9ucG9wc3RhdGVcIjtcclxuXHRcdFx0d2luZG93W2xpc3RlbmVyXSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHZhciBwYXRoID0gJGxvY2F0aW9uW20ucm91dGUubW9kZV1cclxuXHRcdFx0XHRpZiAobS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIpIHBhdGggKz0gJGxvY2F0aW9uLnNlYXJjaFxyXG5cdFx0XHRcdGlmIChjdXJyZW50Um91dGUgIT0gbm9ybWFsaXplUm91dGUocGF0aCkpIHtcclxuXHRcdFx0XHRcdHJlZGlyZWN0KHBhdGgpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbDtcclxuXHRcdFx0d2luZG93W2xpc3RlbmVyXSgpXHJcblx0XHR9XHJcblx0XHQvL2NvbmZpZzogbS5yb3V0ZVxyXG5cdFx0ZWxzZSBpZiAoYXJndW1lbnRzWzBdLmFkZEV2ZW50TGlzdGVuZXIgfHwgYXJndW1lbnRzWzBdLmF0dGFjaEV2ZW50KSB7XHJcblx0XHRcdHZhciBlbGVtZW50ID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHR2YXIgaXNJbml0aWFsaXplZCA9IGFyZ3VtZW50c1sxXTtcclxuXHRcdFx0dmFyIGNvbnRleHQgPSBhcmd1bWVudHNbMl07XHJcblx0XHRcdHZhciB2ZG9tID0gYXJndW1lbnRzWzNdO1xyXG5cdFx0XHRlbGVtZW50LmhyZWYgPSAobS5yb3V0ZS5tb2RlICE9PSAncGF0aG5hbWUnID8gJGxvY2F0aW9uLnBhdGhuYW1lIDogJycpICsgbW9kZXNbbS5yb3V0ZS5tb2RlXSArIHZkb20uYXR0cnMuaHJlZjtcclxuXHRcdFx0aWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG5cdFx0XHRcdGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpO1xyXG5cdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0ZWxlbWVudC5kZXRhY2hFdmVudChcIm9uY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSk7XHJcblx0XHRcdFx0ZWxlbWVudC5hdHRhY2hFdmVudChcIm9uY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly9tLnJvdXRlKHJvdXRlLCBwYXJhbXMsIHNob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkpXHJcblx0XHRlbHNlIGlmICh0eXBlLmNhbGwoYXJndW1lbnRzWzBdKSA9PT0gU1RSSU5HKSB7XHJcblx0XHRcdHZhciBvbGRSb3V0ZSA9IGN1cnJlbnRSb3V0ZTtcclxuXHRcdFx0Y3VycmVudFJvdXRlID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHR2YXIgYXJncyA9IGFyZ3VtZW50c1sxXSB8fCB7fVxyXG5cdFx0XHR2YXIgcXVlcnlJbmRleCA9IGN1cnJlbnRSb3V0ZS5pbmRleE9mKFwiP1wiKVxyXG5cdFx0XHR2YXIgcGFyYW1zID0gcXVlcnlJbmRleCA+IC0xID8gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50Um91dGUuc2xpY2UocXVlcnlJbmRleCArIDEpKSA6IHt9XHJcblx0XHRcdGZvciAodmFyIGkgaW4gYXJncykgcGFyYW1zW2ldID0gYXJnc1tpXVxyXG5cdFx0XHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKHBhcmFtcylcclxuXHRcdFx0dmFyIGN1cnJlbnRQYXRoID0gcXVlcnlJbmRleCA+IC0xID8gY3VycmVudFJvdXRlLnNsaWNlKDAsIHF1ZXJ5SW5kZXgpIDogY3VycmVudFJvdXRlXHJcblx0XHRcdGlmIChxdWVyeXN0cmluZykgY3VycmVudFJvdXRlID0gY3VycmVudFBhdGggKyAoY3VycmVudFBhdGguaW5kZXhPZihcIj9cIikgPT09IC0xID8gXCI/XCIgOiBcIiZcIikgKyBxdWVyeXN0cmluZztcclxuXHJcblx0XHRcdHZhciBzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5ID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgPyBhcmd1bWVudHNbMl0gOiBhcmd1bWVudHNbMV0pID09PSB0cnVlIHx8IG9sZFJvdXRlID09PSBhcmd1bWVudHNbMF07XHJcblxyXG5cdFx0XHRpZiAod2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKSB7XHJcblx0XHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBzZXRTY3JvbGxcclxuXHRcdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHdpbmRvdy5oaXN0b3J5W3Nob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkgPyBcInJlcGxhY2VTdGF0ZVwiIDogXCJwdXNoU3RhdGVcIl0obnVsbCwgJGRvY3VtZW50LnRpdGxlLCBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKTtcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0JGxvY2F0aW9uW20ucm91dGUubW9kZV0gPSBjdXJyZW50Um91dGVcclxuXHRcdFx0XHRyZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxuXHRtLnJvdXRlLnBhcmFtID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0XHRpZiAoIXJvdXRlUGFyYW1zKSB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBjYWxsIG0ucm91dGUoZWxlbWVudCwgZGVmYXVsdFJvdXRlLCByb3V0ZXMpIGJlZm9yZSBjYWxsaW5nIG0ucm91dGUucGFyYW0oKVwiKVxyXG5cdFx0cmV0dXJuIHJvdXRlUGFyYW1zW2tleV1cclxuXHR9O1xyXG5cdG0ucm91dGUubW9kZSA9IFwic2VhcmNoXCI7XHJcblx0ZnVuY3Rpb24gbm9ybWFsaXplUm91dGUocm91dGUpIHtcclxuXHRcdHJldHVybiByb3V0ZS5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aClcclxuXHR9XHJcblx0ZnVuY3Rpb24gcm91dGVCeVZhbHVlKHJvb3QsIHJvdXRlciwgcGF0aCkge1xyXG5cdFx0cm91dGVQYXJhbXMgPSB7fTtcclxuXHJcblx0XHR2YXIgcXVlcnlTdGFydCA9IHBhdGguaW5kZXhPZihcIj9cIik7XHJcblx0XHRpZiAocXVlcnlTdGFydCAhPT0gLTEpIHtcclxuXHRcdFx0cm91dGVQYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKHBhdGguc3Vic3RyKHF1ZXJ5U3RhcnQgKyAxLCBwYXRoLmxlbmd0aCkpO1xyXG5cdFx0XHRwYXRoID0gcGF0aC5zdWJzdHIoMCwgcXVlcnlTdGFydClcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHZXQgYWxsIHJvdXRlcyBhbmQgY2hlY2sgaWYgdGhlcmUnc1xyXG5cdFx0Ly8gYW4gZXhhY3QgbWF0Y2ggZm9yIHRoZSBjdXJyZW50IHBhdGhcclxuXHRcdHZhciBrZXlzID0gT2JqZWN0LmtleXMocm91dGVyKTtcclxuXHRcdHZhciBpbmRleCA9IGtleXMuaW5kZXhPZihwYXRoKTtcclxuXHRcdGlmKGluZGV4ICE9PSAtMSl7XHJcblx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW2tleXMgW2luZGV4XV0pO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKHZhciByb3V0ZSBpbiByb3V0ZXIpIHtcclxuXHRcdFx0aWYgKHJvdXRlID09PSBwYXRoKSB7XHJcblx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoXCJeXCIgKyByb3V0ZS5yZXBsYWNlKC86W15cXC9dKz9cXC57M30vZywgXCIoLio/KVwiKS5yZXBsYWNlKC86W15cXC9dKy9nLCBcIihbXlxcXFwvXSspXCIpICsgXCJcXC8/JFwiKTtcclxuXHJcblx0XHRcdGlmIChtYXRjaGVyLnRlc3QocGF0aCkpIHtcclxuXHRcdFx0XHRwYXRoLnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIga2V5cyA9IHJvdXRlLm1hdGNoKC86W15cXC9dKy9nKSB8fCBbXTtcclxuXHRcdFx0XHRcdHZhciB2YWx1ZXMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgLTIpO1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHJvdXRlUGFyYW1zW2tleXNbaV0ucmVwbGFjZSgvOnxcXC4vZywgXCJcIildID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlc1tpXSlcclxuXHRcdFx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW3JvdXRlXSlcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIHJvdXRlVW5vYnRydXNpdmUoZSkge1xyXG5cdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSB8fCBlLndoaWNoID09PSAyKSByZXR1cm47XHJcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0ZWxzZSBlLnJldHVyblZhbHVlID0gZmFsc2U7XHJcblx0XHR2YXIgY3VycmVudFRhcmdldCA9IGUuY3VycmVudFRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XHJcblx0XHR2YXIgYXJncyA9IG0ucm91dGUubW9kZSA9PT0gXCJwYXRobmFtZVwiICYmIGN1cnJlbnRUYXJnZXQuc2VhcmNoID8gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50VGFyZ2V0LnNlYXJjaC5zbGljZSgxKSkgOiB7fTtcclxuXHRcdHdoaWxlIChjdXJyZW50VGFyZ2V0ICYmIGN1cnJlbnRUYXJnZXQubm9kZU5hbWUudG9VcHBlckNhc2UoKSAhPSBcIkFcIikgY3VycmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZVxyXG5cdFx0bS5yb3V0ZShjdXJyZW50VGFyZ2V0W20ucm91dGUubW9kZV0uc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpLCBhcmdzKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBzZXRTY3JvbGwoKSB7XHJcblx0XHRpZiAobS5yb3V0ZS5tb2RlICE9IFwiaGFzaFwiICYmICRsb2NhdGlvbi5oYXNoKSAkbG9jYXRpb24uaGFzaCA9ICRsb2NhdGlvbi5oYXNoO1xyXG5cdFx0ZWxzZSB3aW5kb3cuc2Nyb2xsVG8oMCwgMClcclxuXHR9XHJcblx0ZnVuY3Rpb24gYnVpbGRRdWVyeVN0cmluZyhvYmplY3QsIHByZWZpeCkge1xyXG5cdFx0dmFyIGR1cGxpY2F0ZXMgPSB7fVxyXG5cdFx0dmFyIHN0ciA9IFtdXHJcblx0XHRmb3IgKHZhciBwcm9wIGluIG9iamVjdCkge1xyXG5cdFx0XHR2YXIga2V5ID0gcHJlZml4ID8gcHJlZml4ICsgXCJbXCIgKyBwcm9wICsgXCJdXCIgOiBwcm9wXHJcblx0XHRcdHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wXVxyXG5cdFx0XHR2YXIgdmFsdWVUeXBlID0gdHlwZS5jYWxsKHZhbHVlKVxyXG5cdFx0XHR2YXIgcGFpciA9ICh2YWx1ZSA9PT0gbnVsbCkgPyBlbmNvZGVVUklDb21wb25lbnQoa2V5KSA6XHJcblx0XHRcdFx0dmFsdWVUeXBlID09PSBPQkpFQ1QgPyBidWlsZFF1ZXJ5U3RyaW5nKHZhbHVlLCBrZXkpIDpcclxuXHRcdFx0XHR2YWx1ZVR5cGUgPT09IEFSUkFZID8gdmFsdWUucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIGl0ZW0pIHtcclxuXHRcdFx0XHRcdGlmICghZHVwbGljYXRlc1trZXldKSBkdXBsaWNhdGVzW2tleV0gPSB7fVxyXG5cdFx0XHRcdFx0aWYgKCFkdXBsaWNhdGVzW2tleV1baXRlbV0pIHtcclxuXHRcdFx0XHRcdFx0ZHVwbGljYXRlc1trZXldW2l0ZW1dID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gbWVtby5jb25jYXQoZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudChpdGVtKSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBtZW1vXHJcblx0XHRcdFx0fSwgW10pLmpvaW4oXCImXCIpIDpcclxuXHRcdFx0XHRlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKVxyXG5cdFx0XHRpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkgc3RyLnB1c2gocGFpcilcclxuXHRcdH1cclxuXHRcdHJldHVybiBzdHIuam9pbihcIiZcIilcclxuXHR9XHJcblx0ZnVuY3Rpb24gcGFyc2VRdWVyeVN0cmluZyhzdHIpIHtcclxuXHRcdGlmIChzdHIuY2hhckF0KDApID09PSBcIj9cIikgc3RyID0gc3RyLnN1YnN0cmluZygxKTtcclxuXHRcdFxyXG5cdFx0dmFyIHBhaXJzID0gc3RyLnNwbGl0KFwiJlwiKSwgcGFyYW1zID0ge307XHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gcGFpcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0dmFyIHBhaXIgPSBwYWlyc1tpXS5zcGxpdChcIj1cIik7XHJcblx0XHRcdHZhciBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQocGFpclswXSlcclxuXHRcdFx0dmFyIHZhbHVlID0gcGFpci5sZW5ndGggPT0gMiA/IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKSA6IG51bGxcclxuXHRcdFx0aWYgKHBhcmFtc1trZXldICE9IG51bGwpIHtcclxuXHRcdFx0XHRpZiAodHlwZS5jYWxsKHBhcmFtc1trZXldKSAhPT0gQVJSQVkpIHBhcmFtc1trZXldID0gW3BhcmFtc1trZXldXVxyXG5cdFx0XHRcdHBhcmFtc1trZXldLnB1c2godmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBwYXJhbXNba2V5XSA9IHZhbHVlXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcGFyYW1zXHJcblx0fVxyXG5cdG0ucm91dGUuYnVpbGRRdWVyeVN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmdcclxuXHRtLnJvdXRlLnBhcnNlUXVlcnlTdHJpbmcgPSBwYXJzZVF1ZXJ5U3RyaW5nXHJcblx0XHJcblx0ZnVuY3Rpb24gcmVzZXQocm9vdCkge1xyXG5cdFx0dmFyIGNhY2hlS2V5ID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpO1xyXG5cdFx0Y2xlYXIocm9vdC5jaGlsZE5vZGVzLCBjZWxsQ2FjaGVbY2FjaGVLZXldKTtcclxuXHRcdGNlbGxDYWNoZVtjYWNoZUtleV0gPSB1bmRlZmluZWRcclxuXHR9XHJcblxyXG5cdG0uZGVmZXJyZWQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuXHRcdGRlZmVycmVkLnByb21pc2UgPSBwcm9waWZ5KGRlZmVycmVkLnByb21pc2UpO1xyXG5cdFx0cmV0dXJuIGRlZmVycmVkXHJcblx0fTtcclxuXHRmdW5jdGlvbiBwcm9waWZ5KHByb21pc2UsIGluaXRpYWxWYWx1ZSkge1xyXG5cdFx0dmFyIHByb3AgPSBtLnByb3AoaW5pdGlhbFZhbHVlKTtcclxuXHRcdHByb21pc2UudGhlbihwcm9wKTtcclxuXHRcdHByb3AudGhlbiA9IGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG5cdFx0XHRyZXR1cm4gcHJvcGlmeShwcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KSwgaW5pdGlhbFZhbHVlKVxyXG5cdFx0fTtcclxuXHRcdHJldHVybiBwcm9wXHJcblx0fVxyXG5cdC8vUHJvbWl6Lm1pdGhyaWwuanMgfCBab2xtZWlzdGVyIHwgTUlUXHJcblx0Ly9hIG1vZGlmaWVkIHZlcnNpb24gb2YgUHJvbWl6LmpzLCB3aGljaCBkb2VzIG5vdCBjb25mb3JtIHRvIFByb21pc2VzL0ErIGZvciB0d28gcmVhc29uczpcclxuXHQvLzEpIGB0aGVuYCBjYWxsYmFja3MgYXJlIGNhbGxlZCBzeW5jaHJvbm91c2x5IChiZWNhdXNlIHNldFRpbWVvdXQgaXMgdG9vIHNsb3csIGFuZCB0aGUgc2V0SW1tZWRpYXRlIHBvbHlmaWxsIGlzIHRvbyBiaWdcclxuXHQvLzIpIHRocm93aW5nIHN1YmNsYXNzZXMgb2YgRXJyb3IgY2F1c2UgdGhlIGVycm9yIHRvIGJlIGJ1YmJsZWQgdXAgaW5zdGVhZCBvZiB0cmlnZ2VyaW5nIHJlamVjdGlvbiAoYmVjYXVzZSB0aGUgc3BlYyBkb2VzIG5vdCBhY2NvdW50IGZvciB0aGUgaW1wb3J0YW50IHVzZSBjYXNlIG9mIGRlZmF1bHQgYnJvd3NlciBlcnJvciBoYW5kbGluZywgaS5lLiBtZXNzYWdlIHcvIGxpbmUgbnVtYmVyKVxyXG5cdGZ1bmN0aW9uIERlZmVycmVkKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XHJcblx0XHR2YXIgUkVTT0xWSU5HID0gMSwgUkVKRUNUSU5HID0gMiwgUkVTT0xWRUQgPSAzLCBSRUpFQ1RFRCA9IDQ7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXMsIHN0YXRlID0gMCwgcHJvbWlzZVZhbHVlID0gMCwgbmV4dCA9IFtdO1xyXG5cclxuXHRcdHNlbGZbXCJwcm9taXNlXCJdID0ge307XHJcblxyXG5cdFx0c2VsZltcInJlc29sdmVcIl0gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkc7XHJcblxyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9O1xyXG5cclxuXHRcdHNlbGZbXCJyZWplY3RcIl0gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblxyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9O1xyXG5cclxuXHRcdHNlbGYucHJvbWlzZVtcInRoZW5cIl0gPSBmdW5jdGlvbihzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaykge1xyXG5cdFx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spO1xyXG5cdFx0XHRpZiAoc3RhdGUgPT09IFJFU09MVkVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoc3RhdGUgPT09IFJFSkVDVEVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRuZXh0LnB1c2goZGVmZXJyZWQpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHRcdH07XHJcblxyXG5cdFx0ZnVuY3Rpb24gZmluaXNoKHR5cGUpIHtcclxuXHRcdFx0c3RhdGUgPSB0eXBlIHx8IFJFSkVDVEVEO1xyXG5cdFx0XHRuZXh0Lm1hcChmdW5jdGlvbihkZWZlcnJlZCkge1xyXG5cdFx0XHRcdHN0YXRlID09PSBSRVNPTFZFRCAmJiBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSkgfHwgZGVmZXJyZWQucmVqZWN0KHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiB0aGVubmFibGUodGhlbiwgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2ssIG5vdFRoZW5uYWJsZUNhbGxiYWNrKSB7XHJcblx0XHRcdGlmICgoKHByb21pc2VWYWx1ZSAhPSBudWxsICYmIHR5cGUuY2FsbChwcm9taXNlVmFsdWUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBwcm9taXNlVmFsdWUgPT09IEZVTkNUSU9OKSAmJiB0eXBlb2YgdGhlbiA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly8gY291bnQgcHJvdGVjdHMgYWdhaW5zdCBhYnVzZSBjYWxscyBmcm9tIHNwZWMgY2hlY2tlclxyXG5cdFx0XHRcdFx0dmFyIGNvdW50ID0gMDtcclxuXHRcdFx0XHRcdHRoZW4uY2FsbChwcm9taXNlVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb3VudCsrKSByZXR1cm47XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRzdWNjZXNzQ2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb3VudCsrKSByZXR1cm47XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRmYWlsdXJlQ2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0XHRmYWlsdXJlQ2FsbGJhY2soKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRub3RUaGVubmFibGVDYWxsYmFjaygpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBmaXJlKCkge1xyXG5cdFx0XHQvLyBjaGVjayBpZiBpdCdzIGEgdGhlbmFibGVcclxuXHRcdFx0dmFyIHRoZW47XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0dGhlbiA9IHByb21pc2VWYWx1ZSAmJiBwcm9taXNlVmFsdWUudGhlblxyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblx0XHRcdFx0cmV0dXJuIGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHRoZW5uYWJsZSh0aGVuLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklORztcclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH0sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRpZiAoc3RhdGUgPT09IFJFU09MVklORyAmJiB0eXBlb2Ygc3VjY2Vzc0NhbGxiYWNrID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBzdWNjZXNzQ2FsbGJhY2socHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoc3RhdGUgPT09IFJFSkVDVElORyAmJiB0eXBlb2YgZmFpbHVyZUNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZmFpbHVyZUNhbGxiYWNrKHByb21pc2VWYWx1ZSk7XHJcblx0XHRcdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCgpXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAocHJvbWlzZVZhbHVlID09PSBzZWxmKSB7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBUeXBlRXJyb3IoKTtcclxuXHRcdFx0XHRcdGZpbmlzaCgpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSwgZmluaXNoLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGZpbmlzaChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0fVxyXG5cdG0uZGVmZXJyZWQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdGlmICh0eXBlLmNhbGwoZSkgPT09IFwiW29iamVjdCBFcnJvcl1cIiAmJiAhZS5jb25zdHJ1Y3Rvci50b1N0cmluZygpLm1hdGNoKC8gRXJyb3IvKSkgdGhyb3cgZVxyXG5cdH07XHJcblxyXG5cdG0uc3luYyA9IGZ1bmN0aW9uKGFyZ3MpIHtcclxuXHRcdHZhciBtZXRob2QgPSBcInJlc29sdmVcIjtcclxuXHRcdGZ1bmN0aW9uIHN5bmNocm9uaXplcihwb3MsIHJlc29sdmVkKSB7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdHJlc3VsdHNbcG9zXSA9IHZhbHVlO1xyXG5cdFx0XHRcdGlmICghcmVzb2x2ZWQpIG1ldGhvZCA9IFwicmVqZWN0XCI7XHJcblx0XHRcdFx0aWYgKC0tb3V0c3RhbmRpbmcgPT09IDApIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnByb21pc2UocmVzdWx0cyk7XHJcblx0XHRcdFx0XHRkZWZlcnJlZFttZXRob2RdKHJlc3VsdHMpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB2YWx1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGRlZmVycmVkID0gbS5kZWZlcnJlZCgpO1xyXG5cdFx0dmFyIG91dHN0YW5kaW5nID0gYXJncy5sZW5ndGg7XHJcblx0XHR2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShvdXRzdGFuZGluZyk7XHJcblx0XHRpZiAoYXJncy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGFyZ3NbaV0udGhlbihzeW5jaHJvbml6ZXIoaSwgdHJ1ZSksIHN5bmNocm9uaXplcihpLCBmYWxzZSkpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgZGVmZXJyZWQucmVzb2x2ZShbXSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7cmV0dXJuIHZhbHVlfVxyXG5cclxuXHRmdW5jdGlvbiBhamF4KG9wdGlvbnMpIHtcclxuXHRcdGlmIChvcHRpb25zLmRhdGFUeXBlICYmIG9wdGlvbnMuZGF0YVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHZhciBjYWxsYmFja0tleSA9IFwibWl0aHJpbF9jYWxsYmFja19cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgXCJfXCIgKyAoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMWUxNikpLnRvU3RyaW5nKDM2KTtcclxuXHRcdFx0dmFyIHNjcmlwdCA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xyXG5cclxuXHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xyXG5cdFx0XHRcdG9wdGlvbnMub25sb2FkKHtcclxuXHRcdFx0XHRcdHR5cGU6IFwibG9hZFwiLFxyXG5cdFx0XHRcdFx0dGFyZ2V0OiB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogcmVzcFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHdpbmRvd1tjYWxsYmFja0tleV0gPSB1bmRlZmluZWRcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcblxyXG5cdFx0XHRcdG9wdGlvbnMub25lcnJvcih7XHJcblx0XHRcdFx0XHR0eXBlOiBcImVycm9yXCIsXHJcblx0XHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdFx0c3RhdHVzOiA1MDAsXHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogSlNPTi5zdHJpbmdpZnkoe2Vycm9yOiBcIkVycm9yIG1ha2luZyBqc29ucCByZXF1ZXN0XCJ9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHdpbmRvd1tjYWxsYmFja0tleV0gPSB1bmRlZmluZWQ7XHJcblxyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjcmlwdC5zcmMgPSBvcHRpb25zLnVybFxyXG5cdFx0XHRcdCsgKG9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpID4gMCA/IFwiJlwiIDogXCI/XCIpXHJcblx0XHRcdFx0KyAob3B0aW9ucy5jYWxsYmFja0tleSA/IG9wdGlvbnMuY2FsbGJhY2tLZXkgOiBcImNhbGxiYWNrXCIpXHJcblx0XHRcdFx0KyBcIj1cIiArIGNhbGxiYWNrS2V5XHJcblx0XHRcdFx0KyBcIiZcIiArIGJ1aWxkUXVlcnlTdHJpbmcob3B0aW9ucy5kYXRhIHx8IHt9KTtcclxuXHRcdFx0JGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHZhciB4aHIgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0O1xyXG5cdFx0XHR4aHIub3BlbihvcHRpb25zLm1ldGhvZCwgb3B0aW9ucy51cmwsIHRydWUsIG9wdGlvbnMudXNlciwgb3B0aW9ucy5wYXNzd29yZCk7XHJcblx0XHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcclxuXHRcdFx0XHRcdGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSBvcHRpb25zLm9ubG9hZCh7dHlwZTogXCJsb2FkXCIsIHRhcmdldDogeGhyfSk7XHJcblx0XHRcdFx0XHRlbHNlIG9wdGlvbnMub25lcnJvcih7dHlwZTogXCJlcnJvclwiLCB0YXJnZXQ6IHhocn0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAob3B0aW9ucy5zZXJpYWxpemUgPT09IEpTT04uc3RyaW5naWZ5ICYmIG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLm1ldGhvZCAhPT0gXCJHRVRcIikge1xyXG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChvcHRpb25zLmRlc2VyaWFsaXplID09PSBKU09OLnBhcnNlKSB7XHJcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJBY2NlcHRcIiwgXCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0LypcIik7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLmNvbmZpZyA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHR2YXIgbWF5YmVYaHIgPSBvcHRpb25zLmNvbmZpZyh4aHIsIG9wdGlvbnMpO1xyXG5cdFx0XHRcdGlmIChtYXliZVhociAhPSBudWxsKSB4aHIgPSBtYXliZVhoclxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgZGF0YSA9IG9wdGlvbnMubWV0aG9kID09PSBcIkdFVFwiIHx8ICFvcHRpb25zLmRhdGEgPyBcIlwiIDogb3B0aW9ucy5kYXRhXHJcblx0XHRcdGlmIChkYXRhICYmICh0eXBlLmNhbGwoZGF0YSkgIT0gU1RSSU5HICYmIGRhdGEuY29uc3RydWN0b3IgIT0gd2luZG93LkZvcm1EYXRhKSkge1xyXG5cdFx0XHRcdHRocm93IFwiUmVxdWVzdCBkYXRhIHNob3VsZCBiZSBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgRm9ybURhdGEuIENoZWNrIHRoZSBgc2VyaWFsaXplYCBvcHRpb24gaW4gYG0ucmVxdWVzdGBcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHR4aHIuc2VuZChkYXRhKTtcclxuXHRcdFx0cmV0dXJuIHhoclxyXG5cdFx0fVxyXG5cdH1cclxuXHRmdW5jdGlvbiBiaW5kRGF0YSh4aHJPcHRpb25zLCBkYXRhLCBzZXJpYWxpemUpIHtcclxuXHRcdGlmICh4aHJPcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiAmJiB4aHJPcHRpb25zLmRhdGFUeXBlICE9IFwianNvbnBcIikge1xyXG5cdFx0XHR2YXIgcHJlZml4ID0geGhyT3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPCAwID8gXCI/XCIgOiBcIiZcIjtcclxuXHRcdFx0dmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhkYXRhKTtcclxuXHRcdFx0eGhyT3B0aW9ucy51cmwgPSB4aHJPcHRpb25zLnVybCArIChxdWVyeXN0cmluZyA/IHByZWZpeCArIHF1ZXJ5c3RyaW5nIDogXCJcIilcclxuXHRcdH1cclxuXHRcdGVsc2UgeGhyT3B0aW9ucy5kYXRhID0gc2VyaWFsaXplKGRhdGEpO1xyXG5cdFx0cmV0dXJuIHhock9wdGlvbnNcclxuXHR9XHJcblx0ZnVuY3Rpb24gcGFyYW1ldGVyaXplVXJsKHVybCwgZGF0YSkge1xyXG5cdFx0dmFyIHRva2VucyA9IHVybC5tYXRjaCgvOlthLXpdXFx3Ky9naSk7XHJcblx0XHRpZiAodG9rZW5zICYmIGRhdGEpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHR2YXIga2V5ID0gdG9rZW5zW2ldLnNsaWNlKDEpO1xyXG5cdFx0XHRcdHVybCA9IHVybC5yZXBsYWNlKHRva2Vuc1tpXSwgZGF0YVtrZXldKTtcclxuXHRcdFx0XHRkZWxldGUgZGF0YVtrZXldXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiB1cmxcclxuXHR9XHJcblxyXG5cdG0ucmVxdWVzdCA9IGZ1bmN0aW9uKHhock9wdGlvbnMpIHtcclxuXHRcdGlmICh4aHJPcHRpb25zLmJhY2tncm91bmQgIT09IHRydWUpIG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKCk7XHJcblx0XHR2YXIgaXNKU09OUCA9IHhock9wdGlvbnMuZGF0YVR5cGUgJiYgeGhyT3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCI7XHJcblx0XHR2YXIgc2VyaWFsaXplID0geGhyT3B0aW9ucy5zZXJpYWxpemUgPSBpc0pTT05QID8gaWRlbnRpdHkgOiB4aHJPcHRpb25zLnNlcmlhbGl6ZSB8fCBKU09OLnN0cmluZ2lmeTtcclxuXHRcdHZhciBkZXNlcmlhbGl6ZSA9IHhock9wdGlvbnMuZGVzZXJpYWxpemUgPSBpc0pTT05QID8gaWRlbnRpdHkgOiB4aHJPcHRpb25zLmRlc2VyaWFsaXplIHx8IEpTT04ucGFyc2U7XHJcblx0XHR2YXIgZXh0cmFjdCA9IGlzSlNPTlAgPyBmdW5jdGlvbihqc29ucCkge3JldHVybiBqc29ucC5yZXNwb25zZVRleHR9IDogeGhyT3B0aW9ucy5leHRyYWN0IHx8IGZ1bmN0aW9uKHhocikge1xyXG5cdFx0XHRyZXR1cm4geGhyLnJlc3BvbnNlVGV4dC5sZW5ndGggPT09IDAgJiYgZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UgPyBudWxsIDogeGhyLnJlc3BvbnNlVGV4dFxyXG5cdFx0fTtcclxuXHRcdHhock9wdGlvbnMubWV0aG9kID0gKHhock9wdGlvbnMubWV0aG9kIHx8ICdHRVQnKS50b1VwcGVyQ2FzZSgpO1xyXG5cdFx0eGhyT3B0aW9ucy51cmwgPSBwYXJhbWV0ZXJpemVVcmwoeGhyT3B0aW9ucy51cmwsIHhock9wdGlvbnMuZGF0YSk7XHJcblx0XHR4aHJPcHRpb25zID0gYmluZERhdGEoeGhyT3B0aW9ucywgeGhyT3B0aW9ucy5kYXRhLCBzZXJpYWxpemUpO1xyXG5cdFx0eGhyT3B0aW9ucy5vbmxvYWQgPSB4aHJPcHRpb25zLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRcdFx0dmFyIHVud3JhcCA9IChlLnR5cGUgPT09IFwibG9hZFwiID8geGhyT3B0aW9ucy51bndyYXBTdWNjZXNzIDogeGhyT3B0aW9ucy51bndyYXBFcnJvcikgfHwgaWRlbnRpdHk7XHJcblx0XHRcdFx0dmFyIHJlc3BvbnNlID0gdW53cmFwKGRlc2VyaWFsaXplKGV4dHJhY3QoZS50YXJnZXQsIHhock9wdGlvbnMpKSwgZS50YXJnZXQpO1xyXG5cdFx0XHRcdGlmIChlLnR5cGUgPT09IFwibG9hZFwiKSB7XHJcblx0XHRcdFx0XHRpZiAodHlwZS5jYWxsKHJlc3BvbnNlKSA9PT0gQVJSQVkgJiYgeGhyT3B0aW9ucy50eXBlKSB7XHJcblx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcmVzcG9uc2UubGVuZ3RoOyBpKyspIHJlc3BvbnNlW2ldID0gbmV3IHhock9wdGlvbnMudHlwZShyZXNwb25zZVtpXSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKHhock9wdGlvbnMudHlwZSkgcmVzcG9uc2UgPSBuZXcgeGhyT3B0aW9ucy50eXBlKHJlc3BvbnNlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkZWZlcnJlZFtlLnR5cGUgPT09IFwibG9hZFwiID8gXCJyZXNvbHZlXCIgOiBcInJlamVjdFwiXShyZXNwb25zZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoeGhyT3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLmVuZENvbXB1dGF0aW9uKClcclxuXHRcdH07XHJcblx0XHRhamF4KHhock9wdGlvbnMpO1xyXG5cdFx0ZGVmZXJyZWQucHJvbWlzZSA9IHByb3BpZnkoZGVmZXJyZWQucHJvbWlzZSwgeGhyT3B0aW9ucy5pbml0aWFsVmFsdWUpO1xyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHR9O1xyXG5cclxuXHQvL3Rlc3RpbmcgQVBJXHJcblx0bS5kZXBzID0gZnVuY3Rpb24obW9jaykge1xyXG5cdFx0aW5pdGlhbGl6ZSh3aW5kb3cgPSBtb2NrIHx8IHdpbmRvdyk7XHJcblx0XHRyZXR1cm4gd2luZG93O1xyXG5cdH07XHJcblx0Ly9mb3IgaW50ZXJuYWwgdGVzdGluZyBvbmx5LCBkbyBub3QgdXNlIGBtLmRlcHMuZmFjdG9yeWBcclxuXHRtLmRlcHMuZmFjdG9yeSA9IGFwcDtcclxuXHJcblx0cmV0dXJuIG1cclxufSkodHlwZW9mIHdpbmRvdyAhPSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pO1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gbTtcclxuZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIGRlZmluZShmdW5jdGlvbigpIHtyZXR1cm4gbX0pO1xyXG4iXX0=
