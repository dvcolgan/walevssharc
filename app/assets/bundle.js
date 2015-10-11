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
        this.handleButton = bind(this.handleButton, this);
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

      _Class.prototype.handleButton = function(commandText) {
        this.vm.command(commandText);
        return document.getElementById('command-input').focus();
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
        ], m('button', {
          onclick: function(e) {
            localStorage.setItem('progress', JSON.stringify({
              "inventory": {
                "badge": "gotten",
                "pancakes": "gotten"
              },
              "currentRoomName": "Steak and Shake (Kitchen)",
              "previousCommands": ["__enter_room__", "__enter_room__", "__enter_room__", "north", "__enter_room__", "talk wale", "look", "east", "__enter_room__", "talk billy", "drive car", "look", "north", "__enter_room__", "north", "__enter_room__", "make costume", "__enter_room__", "cowboy hat", "__enter_room__", "oldtimey suit", "__enter_room__", "metal chain", "__enter_room__", "look metal chain", "look old-timey suit", "look old-timey suit", "look cowboy hat", "look old timey suit", "look oldtimey suit", "go north", "south", "east", "west", "__enter_room__", "east", "__enter_room__", "talk manager", "__enter_room__", "no seal", "__enter_room__", "talk manager", "south", "east", "west", "__enter_room__", "north", "__enter_room__", "make costume", "__enter_room__", "rainbow wig", "__enter_room__", "cow print vest", "__enter_room__", "fake beard", "__enter_room__", "look rainbow wig", "look cow prin vest", "look cow print vest", "look fake beard", "south", "west", "__enter_room__", "north", "__enter_room__", "west", "west", "make costume", "__enter_room__", "west", "go west", "rainbow wigh", "rainbow wig", "__enter_room__", "vest", "cowprint vest", "cow print vest", "__enter_room__", "fake beard", "__enter_room__", "talk manager", "__enter_room__", "look briefcase", "seal", "look", "seal", "__enter_room__", "west", "__enter_room__", "west", "__enter_room__", "south", "__enter_room__", "west", "__enter_room__", "get cuddlefish", "get cuttlefish", "look cuttlefish", "north", "__enter_room__", "north", "__enter_room__", "east", "__enter_room__", "get badge", "west", "__enter_room__", "look", "north", "__enter_room__", "get umbrella", "north", "look", "west", "__enter_room__", "talk fish", "look", "east", "__enter_room__", "souht", "south", "__enter_room__", "yes", "souht", "south", "__enter_room__", "west", "__enter_room__", "get flowers", "give umbrella", "get flowers", "look", "east", "__enter_room__", "south", "__enter_room__", "east", "__enter_room__", "east", "__enter_room__", "west", "__enter_room__", "west", "__enter_room__", "west", "__enter_room__", "west", "__enter_room__", "west", "__enter_room__", "west", "get soda", "look fountain", "get spritz", "look fountain", "look maple soda", "get maple soda", "east", "__enter_room__", "north", "__enter_room__", "look oven", "south", "__enter_room__", "north", "__enter_room__", "make pancakes", "get baking soda", "make pancakes", "__enter_room__", "__enter_room__", "baking soda", "flower", "__enter_room__", "egg", "milk", "margarine", "__enter_room__", "stir", "__enter_room__", "__enter_room__", "syrup", "__enter_room__"],
              "flags": {
                "talked_to_wale": true,
                "drove_billy_to_hospital": true,
                "given_umbrella": true,
                "have_all_items": true
              },
              "roomsEntered": {
                "Wale vs Sharc: The Comic: The Interactive Software Title For Your Computer Box": 1,
                "How To Play": 1,
                "Ocean": 1,
                "Wale": 4,
                "Billy Ocean": 2,
                "Seal or No Seal": 5,
                "Seal or No Seal (Dressing Room)": 3,
                "Seal or No Seal (Dressing Room - Pick Headgear)": 3,
                "Seal or No Seal (Dressing Room - Pick Clothes)": 3,
                "Seal or No Seal (Dressing Room - Pick Accessory)": 3,
                "Seal or No Seal (Backstage)": 6,
                "Seal or No Seal (On Stage!)": 2,
                "Wetter Ocean": 1,
                "Cuttlefish": 3,
                "Achtipus's Garden": 3,
                "Water World": 3,
                "Water World (Gift Shop)": 1,
                "Water World (Manatee Exhibit)": 2,
                "Water World (Mechanical Room Type Place)": 1,
                "Achtipus's Garden (Inside)": 1,
                "Steak and Shake": 1,
                "Steak and Shake (Doorway)": 3,
                "Steak and Shake (Soda Fountain)": 1,
                "Steak and Shake (Kitchen)": 3,
                "Steak and Shake (Spooky Kitchen)": 1,
                "Steak and Shake (Spooky Kitchen with an empty bowl sitting there)": 1,
                "Steak and Shake (Spooky Kitchen with bowl of powder sitting there)": 1,
                "Steak and Shake (Spooky Kitchen with bowl of slightly more damp powder sitting there)": 1,
                "Steak and Shake (Spooky Kitchen with bowl of mixed damp powder sitting there)": 1,
                "Steak and Shake (Spooky Kitchen with plate of dry pancakes sitting there)": 1
              }
            }));
            return window.location.href = '';
          }
        }, 'Load Game'), m('textarea', {
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
        }, m('input[type=text][id=command-input]', {
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
        }), m('button[type=submit]', 'Do'), m('button[type=button]', {
          onclick: function(e) {
            return ctrl.handleButton('go north');
          }
        }, 'go north'), m('button[type=button]', {
          onclick: function(e) {
            return ctrl.handleButton('go south');
          }
        }, 'go south'), m('button[type=button]', {
          onclick: function(e) {
            return ctrl.handleButton('go east');
          }
        }, 'go east'), m('button[type=button]', {
          onclick: function(e) {
            return ctrl.handleButton('go west');
          }
        }, 'go west'), m('button[type=button]', {
          onclick: function(e) {
            return ctrl.handleButton('get');
          }
        }, 'get'), m('button[type=button]', {
          onclick: function(e) {
            return ctrl.handleButton('talk');
          }
        }, 'talk'), m('button[type=button]', {
          onclick: function(e) {
            return ctrl.handleButton('use');
          }
        }, 'use'), m('button[type=button]', {
          onclick: function(e) {
            return ctrl.handleButton('look');
          }
        }, 'look')))
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
      return this.wait((function(_this) {
        return function() {
          _this.print('"Well, I think I have all the ingredients," you say to yourself. "I just need one of those places where you put them together so it turns into something you can eat. You know, one of those...food preparing rooms."');
          return _this.setFlag('have_all_items', true);
        };
      })(this));
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
    } else if (this.matches('look flowers') || this.matches('take flowers')) {
      return this.print('"I can see you like the flowers. I will let you have them if you can find something to keep it from getting so hot here. I would be able to do twice as much work if it were a bit cooler."');
    } else if (this.matches('give umbrella')) {
      this.print('"This will be perfect for blocking out that sun’s harsh rays. Thanks!"');
      this.removeItem('umbrella');
      return this.wait((function(_this) {
        return function() {
          _this.getItem('flowers');
          return _this.print('"Take these flowers. They are really versatile and will be good just about anywhere."');
        };
      })(this));
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
    } else if (this.flagIs('have_all_items', true) && this.matches('make pancakes')) {
      this.setFlag('have_all_items', 'false');
      return this.goToRoom('Steak and Shake (Spooky Kitchen)');
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
    } else if (this.matches('oldtimey') || this.matches('ties') || this.matches('colonel') || this.matches('sanders')) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kdmNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9hcHAvZW5naW5lLmNvZmZlZSIsIi9ob21lL2R2Y29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9tYWluLmNvZmZlZSIsIi9ob21lL2R2Y29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9zeW5vbnltcy5jb2ZmZWUiLCIvaG9tZS9kdmNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9ub2RlX21vZHVsZXMvYXBwL3ZpZXcuY29mZmVlIiwiL2hvbWUvZHZjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC93YWxldnNzaGFyYy5jb2ZmZWUiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxtQkFBQTtFQUFBOztBQUFBLFdBQUEsR0FBYyxPQUFBLENBQVEsWUFBUjs7QUFHZCxNQUFNLENBQUMsT0FBUCxHQUF1QjtFQUNOLGdCQUFBO0lBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUNULElBQUMsQ0FBQSxpQkFBRCxHQUFxQixTQUFBLEdBQUE7SUFDckIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsU0FBQSxHQUFBO0lBRWhCLElBQUMsQ0FBQSxTQUFELEdBQWE7SUFDYixJQUFDLENBQUEsZUFBRCxHQUFtQjtJQUNuQixJQUFDLENBQUEsS0FBRCxHQUFTO0lBQ1QsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFFaEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFDaEIsSUFBQyxDQUFBLFdBQUQsR0FBZTtJQUNmLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFFWCxJQUFDLENBQUEsU0FBRCxHQUFhO0lBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQUNiLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFFWixJQUFDLENBQUEsWUFBRCxHQUFnQjtJQUNoQixJQUFDLENBQUEsb0JBQUQsR0FBd0I7SUFFeEIsSUFBQyxDQUFBLGdCQUFELEdBQW9CO0VBckJYOzttQkF1QmIsWUFBQSxHQUFjLFNBQUMsUUFBRDtXQUNWLElBQUMsQ0FBQSxTQUFELEdBQWE7RUFESDs7bUJBR2QsZUFBQSxHQUFpQixTQUFDLFFBQUQ7V0FDYixJQUFDLENBQUEsWUFBRCxHQUFnQixRQUFRLENBQUMsSUFBVCxDQUFjLElBQWQ7RUFESDs7bUJBR2pCLHVCQUFBLEdBQXlCLFNBQUMsR0FBRDtXQUNyQixJQUFDLENBQUEsb0JBQUQsR0FBd0I7RUFESDs7bUJBR3pCLElBQUEsR0FBTSxTQUFBO1dBQ0YsWUFBWSxDQUFDLE9BQWIsQ0FBcUIsVUFBckIsRUFBaUMsSUFBSSxDQUFDLFNBQUwsQ0FBZTtNQUM1QyxTQUFBLEVBQVcsSUFBQyxDQUFBLFNBRGdDO01BRTVDLGVBQUEsRUFBaUIsSUFBQyxDQUFBLGVBRjBCO01BRzVDLGdCQUFBLEVBQWtCLElBQUMsQ0FBQSxnQkFIeUI7TUFJNUMsS0FBQSxFQUFPLElBQUMsQ0FBQSxLQUpvQztNQUs1QyxZQUFBLEVBQWMsSUFBQyxDQUFBLFlBTDZCO0tBQWYsQ0FBakM7RUFERTs7bUJBU04sSUFBQSxHQUFNLFNBQUE7QUFDRixRQUFBO0FBQUE7TUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxZQUFZLENBQUMsT0FBYixDQUFxQixVQUFyQixDQUFYO01BQ1AsSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFJLENBQUM7TUFDbEIsSUFBQyxDQUFBLGVBQUQsR0FBbUIsSUFBSSxDQUFDO01BQ3hCLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixJQUFJLENBQUMsZ0JBQUwsSUFBeUI7TUFDN0MsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUM7TUFDZCxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFJLENBQUM7QUFDckIsYUFBTyxLQVBYO0tBQUEsYUFBQTtNQVNJLFlBQVksQ0FBQyxLQUFiLENBQUE7QUFDQSxhQUFPLE1BVlg7O0VBREU7O21CQWFOLE9BQUEsR0FBUyxTQUFDLFFBQUQsRUFBVyxRQUFYO1dBQ0wsSUFBQyxDQUFBLEtBQU0sQ0FBQSxRQUFBLENBQVAsR0FBbUIsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0VBRGQ7O21CQUdULGtCQUFBLEdBQW9CLFNBQUE7V0FBRyxJQUFDLENBQUE7RUFBSjs7bUJBRXBCLGlCQUFBLEdBQW1CLFNBQUE7V0FBRyxJQUFDLENBQUE7RUFBSjs7bUJBRW5CLFlBQUEsR0FBYyxTQUFBO1dBQUcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsU0FBTCxDQUFlLElBQUMsQ0FBQSxTQUFoQixDQUFYO0VBQUg7O21CQUVkLFNBQUEsR0FBVyxTQUFDLFdBQUQ7QUFFUCxRQUFBO0lBRlEsSUFBQyxDQUFBLGNBQUQ7SUFFUixJQUFHLHlCQUFIO01BQ0ksUUFBQSxHQUFXLElBQUMsQ0FBQTtNQUNaLElBQUMsQ0FBQSxZQUFELEdBQWdCO01BQ2hCLFFBQUEsQ0FBQTtBQUNBLGFBSko7O0lBTUEsSUFBRyxJQUFDLENBQUEsV0FBRCxLQUFnQixFQUFuQjtBQUEyQixhQUEzQjs7SUFFQSxJQUFDLENBQUEsZ0JBQWdCLENBQUMsSUFBbEIsQ0FBdUIsSUFBQyxDQUFBLFdBQXhCO0lBR0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxHQUFBLEdBQU0sSUFBQyxDQUFBLFdBQ2xCLENBQUMsSUFEZ0IsQ0FBQSxDQUVqQixDQUFDLFdBRmdCLENBQUEsQ0FHakIsQ0FBQyxPQUhnQixDQUdSLE1BSFEsRUFHQSxHQUhBLENBSWpCLENBQUMsT0FKZ0IsQ0FJUixTQUpRLEVBSUcsR0FKSCxDQUFOLEdBSWdCO0FBRy9CLFNBQUEsNkJBQUE7O0FBQ0ksV0FBQSwwQ0FBQTs7UUFDSSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixHQUFBLEdBQUksT0FBSixHQUFZLEdBQWpDLEVBQXFDLEdBQUEsR0FBSSxjQUFKLEdBQW1CLEdBQXhEO0FBRG5CO0FBREo7SUFJQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFBO0lBRWYsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFiLENBQW1CLEdBQW5CO0lBRWhCLElBQUcsYUFBVSxJQUFDLENBQUEsWUFBWCxFQUFBLE1BQUEsTUFBSDtBQUNJO0FBQUEsV0FBQSx1Q0FBQTs7UUFDSSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxDQUFIO1VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFDLENBQUEsb0JBQVI7QUFDQSxpQkFGSjs7QUFESixPQURKOztJQU1BLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQyxDQUFBLGVBQUQsQ0FBUCxDQUFBO1dBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTtFQW5DTzs7bUJBcUNYLG9CQUFBLEdBQXNCLFNBQUMsUUFBRDtXQUNsQixJQUFDLENBQUEsaUJBQUQsR0FBcUIsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0VBREg7O21CQUd0QixvQkFBQSxHQUFzQixTQUFBO1dBQ2xCLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0VBRGtCOzttQkFHdEIsY0FBQSxHQUFnQixTQUFDLE9BQUQ7V0FDWixJQUFDLENBQUEsV0FBRCxLQUFnQjtFQURKOzttQkFHaEIsT0FBQSxHQUFTLFNBQUMsT0FBRDtBQUlMLFFBQUE7SUFBQSxZQUFBLEdBQWUsT0FBTyxDQUFDLEtBQVIsQ0FBYyxHQUFkO0FBQ2YsU0FBQSw4Q0FBQTs7TUFDSSxLQUFBLEdBQVE7QUFDUjtBQUFBLFdBQUEsdUNBQUE7O1FBQ0ksSUFBRyxXQUFXLENBQUMsVUFBWixDQUF1QixXQUF2QixDQUFBLElBQXdDLENBQUMsV0FBVyxDQUFDLE1BQVosSUFBc0IsQ0FBdEIsSUFBMkIsV0FBVyxDQUFDLE1BQVosSUFBc0IsQ0FBbEQsQ0FBM0M7VUFDSSxLQUFBLEdBQVEsS0FEWjs7QUFESjtNQUdBLElBQUcsQ0FBSSxLQUFQO0FBQ0ksZUFBTyxNQURYOztBQUxKO0FBT0EsV0FBTztFQVpGOzttQkFjVCxPQUFBLEdBQVMsU0FBQyxJQUFEO1dBQVUsSUFBQSxJQUFRLElBQUMsQ0FBQTtFQUFuQjs7bUJBQ1QsUUFBQSxHQUFVLFNBQUMsSUFBRDtXQUFVLElBQUEsSUFBUSxJQUFDLENBQUEsU0FBVCxJQUF1QixJQUFDLENBQUEsU0FBVSxDQUFBLElBQUEsQ0FBWCxLQUFvQjtFQUFyRDs7bUJBRVYsYUFBQSxHQUFlLFNBQUMsTUFBRDtXQUFZLElBQUksQ0FBQyxNQUFMLENBQUEsQ0FBQSxHQUFnQixNQUFBLEdBQVM7RUFBckM7O21CQUVmLE1BQUEsR0FBUSxTQUFDLFFBQUQsRUFBVyxLQUFYO1dBQXFCLElBQUMsQ0FBQSxLQUFNLENBQUEsUUFBQSxDQUFQLEtBQW9CO0VBQXpDOzttQkFFUixtQkFBQSxHQUFxQixTQUFBO1dBQUcsSUFBQyxDQUFBLFlBQWEsQ0FBQSxJQUFDLENBQUEsZUFBRCxDQUFkLEtBQW1DO0VBQXRDOzttQkFFckIsVUFBQSxHQUFZLFNBQUMsS0FBRDtBQUFXLFFBQUE7aUJBQUEsSUFBQyxDQUFBLFFBQUQsRUFBQSxhQUFhLEtBQWIsRUFBQSxHQUFBO0VBQVg7O21CQUVaLEtBQUEsR0FBTyxTQUFDLElBQUQ7SUFDSCxJQUFDLENBQUEsT0FBRCxHQUFXO1dBQ1gsSUFBQyxDQUFBLE1BQUQsQ0FBQTtFQUZHOzttQkFJUCxRQUFBLEdBQVUsU0FBQyxRQUFEO0lBQ04sSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUE7SUFDYixJQUFDLENBQUEsZUFBRCxHQUFtQjtJQUNuQixJQUFHLFFBQUEsSUFBWSxJQUFDLENBQUEsWUFBaEI7TUFDSSxJQUFDLENBQUEsWUFBYSxDQUFBLFFBQUEsQ0FBZCxHQURKO0tBQUEsTUFBQTtNQUdJLElBQUMsQ0FBQSxZQUFhLENBQUEsUUFBQSxDQUFkLEdBQTBCLEVBSDlCOztJQUlBLElBQUMsQ0FBQSxTQUFELENBQVcsZ0JBQVg7V0FDQSxJQUFDLENBQUEsTUFBRCxDQUFBO0VBUk07O21CQVVWLFNBQUEsR0FBVyxTQUFBO1dBQ1AsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsU0FBWDtFQURPOzttQkFHWCxPQUFBLEdBQVMsU0FBQyxRQUFELEVBQVcsS0FBWDtJQUNMLElBQUMsQ0FBQSxLQUFNLENBQUEsUUFBQSxDQUFQLEdBQW1CO1dBQ25CLElBQUMsQ0FBQSxNQUFELENBQUE7RUFGSzs7bUJBSVQsT0FBQSxHQUFTLFNBQUMsSUFBRDtJQUNMLElBQUMsQ0FBQSxTQUFVLENBQUEsSUFBQSxDQUFYLEdBQW1CO1dBQ25CLElBQUMsQ0FBQSxNQUFELENBQUE7RUFGSzs7bUJBSVQsVUFBQSxHQUFZLFNBQUMsSUFBRDtJQUNSLE9BQU8sSUFBQyxDQUFBLFNBQVUsQ0FBQSxJQUFBO1dBQ2xCLElBQUMsQ0FBQSxNQUFELENBQUE7RUFGUTs7bUJBSVosT0FBQSxHQUFTLFNBQUMsSUFBRDtJQUNMLElBQUMsQ0FBQSxTQUFVLENBQUEsSUFBQSxDQUFYLEdBQW1CO1dBQ25CLElBQUMsQ0FBQSxNQUFELENBQUE7RUFGSzs7bUJBSVQsSUFBQSxHQUFNLFNBQUMsUUFBRDtJQUNGLElBQUMsQ0FBQSxPQUFELElBQVk7SUFDWixJQUFDLENBQUEsWUFBRCxHQUFnQjtXQUNoQixJQUFDLENBQUEsTUFBRCxDQUFBO0VBSEU7O21CQUtOLE1BQUEsR0FBUSxTQUFDLFFBQUQ7V0FBYyxJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0IsUUFBaEI7RUFBZDs7bUJBRVIsTUFBQSxHQUFRLFNBQUE7QUFBRyxRQUFBO0FBQUE7QUFBQTtTQUFBLHFDQUFBOzttQkFBQSxRQUFBLENBQUE7QUFBQTs7RUFBSDs7Ozs7Ozs7O0FDbExaLElBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxTQUFSOztBQUNKLE1BQUEsR0FBWSxJQUFBLENBQUMsT0FBQSxDQUFRLFVBQVIsQ0FBRCxDQUFBLENBQUE7O0FBQ1osSUFBQSxHQUFPLE9BQUEsQ0FBUSxVQUFSLENBQUEsQ0FBb0IsTUFBcEI7O0FBR1AsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxRQUFRLENBQUMsSUFBakIsRUFBdUIsSUFBdkI7Ozs7O0FDTEEsTUFBTSxDQUFDLE9BQVAsR0FDSTtFQUFBLElBQUEsRUFBTSxDQUNGLEtBREUsRUFFRixRQUZFLEVBR0YsUUFIRSxFQUlGLE1BSkUsRUFLRixTQUxFLEVBTUYsS0FORSxFQU9GLE9BUEUsQ0FBTjtFQVNBLElBQUEsRUFBTSxDQUNGLFNBREUsRUFFRixLQUZFLEVBR0YsU0FIRSxFQUlGLE1BSkUsRUFLRixPQUxFLEVBTUYsUUFORSxFQU9GLEtBUEUsRUFRRixRQVJFLENBVE47RUFtQkEsRUFBQSxFQUFJLENBQ0EsTUFEQSxFQUVBLGFBRkEsRUFHQSxNQUhBLEVBSUEsUUFKQSxFQUtBLFNBTEEsRUFNQSxPQU5BLENBbkJKO0VBMkJBLElBQUEsRUFBTSxDQUNGLFNBREUsRUFFRixRQUZFLEVBR0YsV0FIRSxFQUlGLFNBSkUsRUFLRixPQUxFLEVBTUYsVUFORSxFQU9GLFFBUEUsRUFRRixZQVJFLENBM0JOO0VBcUNBLE1BQUEsRUFBUSxDQUNKLE1BREksRUFFSixRQUZJLEVBR0osU0FISSxDQXJDUjtFQTBDQSxNQUFBLEVBQVEsQ0FDSixPQURJLENBMUNSO0VBNkNBLElBQUEsRUFBTSxDQUNGLEtBREUsQ0E3Q047RUFnREEsU0FBQSxFQUFXLENBQ1AsUUFETyxDQWhEWDtFQW1EQSxJQUFBLEVBQU0sQ0FDRixNQURFLEVBRUYsT0FGRSxFQUdGLFNBSEUsRUFJRixLQUpFLEVBS0YsT0FMRSxFQU1GLFNBTkUsRUFPRixPQVBFLEVBUUYsTUFSRSxDQW5ETjtFQTZEQSxNQUFBLEVBQVEsQ0FDSixPQURJLEVBRUosT0FGSSxFQUdKLE1BSEksRUFJSixXQUpJLENBN0RSO0VBbUVBLEtBQUEsRUFBTyxDQUNILFNBREcsRUFFSCxTQUZHLENBbkVQO0VBdUVBLEtBQUEsRUFBTyxDQUNILElBREcsRUFFSCxRQUZHLENBdkVQO0VBMkVBLElBQUEsRUFBTSxDQUNGLE9BREUsRUFFRixLQUZFLEVBR0YsU0FIRSxFQUlGLFVBSkUsRUFLRixNQUxFLEVBTUYsUUFORSxFQU9GLFFBUEUsQ0EzRU47Ozs7OztBQ0RKLElBQUEscUNBQUE7RUFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFNBQVI7O0FBQ0osV0FBQSxHQUFjLE9BQUEsQ0FBUSxpQkFBUjs7QUFHZCxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQWpCLEdBQThCLFNBQUE7U0FDMUIsSUFBRSxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQUwsQ0FBQSxDQUFBLEdBQXFCLElBQUU7QUFERzs7QUFJOUIsVUFBQSxHQUFhO0VBQ1QsR0FBQSxFQUFLLEtBREk7RUFFVCxVQUFBLEVBQVksWUFGSDtFQUdULE9BQUEsRUFBUyxTQUhBO0VBSVQsSUFBQSxFQUFNLGFBSkc7RUFLVCxRQUFBLEVBQVUsVUFMRDtFQU1ULEtBQUEsRUFBTyxhQU5FO0VBT1QsU0FBQSxFQUFXLFdBUEY7RUFRVCxRQUFBLEVBQVUsVUFSRDtFQVNULEtBQUEsRUFBTyxlQVRFO0VBVVQsSUFBQSxFQUFNLGNBVkc7RUFXVCxhQUFBLEVBQWUsYUFYTjtFQVlULFlBQUEsRUFBYyxZQVpMO0VBYVQsYUFBQSxFQUFlLGFBYk47RUFjVCxtQkFBQSxFQUFxQixtQkFkWjtFQWVULGVBQUEsRUFBaUIsZUFmUjtFQWdCVCxnQkFBQSxFQUFrQixnQkFoQlQ7RUFpQlQsWUFBQSxFQUFjLFlBakJMO0VBa0JULGVBQUEsRUFBaUIsZ0JBbEJSO0VBbUJULGdCQUFBLEVBQWtCLGdCQW5CVDtFQW9CVCxZQUFBLEVBQWMsWUFwQkw7RUFxQlQsVUFBQSxFQUFZLFVBckJIO0VBc0JULGFBQUEsRUFBZSxhQXRCTjtFQXVCVCxnQkFBQSxFQUFrQixnQkF2QlQ7RUF3QlQsZUFBQSxFQUFpQixlQXhCUjs7O0FBNEJQO0VBQ1csbUJBQUE7O0lBQ1QsSUFBQyxDQUFBLGNBQUQsR0FBa0I7SUFDbEIsSUFBQyxDQUFBLENBQUQsR0FBSztFQUZJOztzQkFJYixRQUFBLEdBQVUsU0FBQTtJQUNOLElBQUMsQ0FBQSxDQUFEO0lBQ0EsQ0FBQyxDQUFDLE1BQUYsQ0FBQTtJQUNBLElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBRCxDQUFBLENBQVA7YUFDSSxVQUFBLENBQVcsSUFBQyxDQUFBLFFBQVosRUFBc0IsQ0FBdEIsRUFESjs7RUFITTs7c0JBTVYsVUFBQSxHQUFZLFNBQUMsT0FBRDtJQUNSLElBQUMsQ0FBQSxjQUFELEdBQWtCO0lBQ2xCLElBQUMsQ0FBQSxDQUFELEdBQUs7V0FDTCxVQUFBLENBQVcsSUFBQyxDQUFBLFFBQVosRUFBc0IsQ0FBdEI7RUFIUTs7c0JBS1osT0FBQSxHQUFTLFNBQUE7V0FDTCxJQUFDLENBQUEsQ0FBRCxHQUFLLElBQUMsQ0FBQSxjQUFjLENBQUMsTUFBaEIsR0FBeUI7RUFEekI7O3NCQUdULFlBQUEsR0FBYyxTQUFBO1dBQ1YsSUFBQyxDQUFBLGNBQWU7RUFETjs7c0JBR2QsTUFBQSxHQUFRLFNBQUE7V0FDSixJQUFDLENBQUEsQ0FBRCxJQUFNLElBQUMsQ0FBQSxjQUFjLENBQUMsTUFBaEIsR0FBeUI7RUFEM0I7Ozs7OztBQUlaLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsTUFBRDtTQUNiO0lBQUEsVUFBQTtNQUNpQixnQkFBQTs7O0FBRVQsWUFBQTtRQUFBLFdBQUEsQ0FBWSxNQUFaO1FBQ0EsT0FBQSxHQUFVLE1BQU0sQ0FBQyxJQUFQLENBQUE7UUFFVixJQUFDLENBQUEsRUFBRCxHQUFNO1FBQ04sSUFBQyxDQUFBLEVBQUUsQ0FBQyxPQUFKLEdBQWMsQ0FBQyxDQUFDLElBQUYsQ0FBTyxFQUFQO1FBQ2QsSUFBQyxDQUFBLEVBQUUsQ0FBQyxLQUFKLEdBQWdCLElBQUEsU0FBQSxDQUFBO1FBRWhCLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtZQUNWLEtBQUMsQ0FBQSxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVYsQ0FBcUIsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBckI7WUFDQSxDQUFDLENBQUMsTUFBRixDQUFBO21CQUNBLE1BQU0sQ0FBQyxJQUFQLENBQUE7VUFIVTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZDtRQUtBLElBQUcsT0FBSDtVQUNJLE1BQU0sQ0FBQyxTQUFQLENBQWlCLE1BQWpCLEVBREo7U0FBQSxNQUFBO1VBR0ksTUFBTSxDQUFDLFNBQVAsQ0FBQSxFQUhKOztNQWRTOzt1QkFtQmIsZUFBQSxHQUFpQixTQUFDLENBQUQ7UUFDYixDQUFDLENBQUMsY0FBRixDQUFBO1FBQ0EsSUFBRyxJQUFDLENBQUEsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFWLENBQUEsQ0FBSDtVQUNJLE1BQU0sQ0FBQyxTQUFQLENBQWlCLElBQUMsQ0FBQSxFQUFFLENBQUMsT0FBSixDQUFBLENBQWpCO2lCQUNBLElBQUMsQ0FBQSxFQUFFLENBQUMsT0FBSixDQUFZLEVBQVosRUFGSjtTQUFBLE1BQUE7aUJBSUksSUFBQyxDQUFBLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBVixDQUFBLEVBSko7O01BRmE7O3VCQVFqQixZQUFBLEdBQWMsU0FBQyxXQUFEO1FBQ1YsSUFBQyxDQUFBLEVBQUUsQ0FBQyxPQUFKLENBQVksV0FBWjtlQUNBLFFBQVEsQ0FBQyxjQUFULENBQXdCLGVBQXhCLENBQXdDLENBQUMsS0FBekMsQ0FBQTtNQUZVOzs7O1FBNUJsQjtJQWlDQSxJQUFBLEVBQU0sU0FBQyxJQUFEO0FBQ0YsVUFBQTthQUFBO1FBQ0ksQ0FBQSxDQUFFLFVBQUYsRUFDSTtVQUFBLEtBQUEsRUFDSTtZQUFBLE1BQUEsRUFBUSxNQUFNLENBQUMsV0FBUCxHQUFxQixJQUE3QjtZQUNBLEtBQUEsRUFBTyxPQURQO1lBRUEsT0FBQSxFQUFTLE1BRlQ7V0FESjtTQURKLEVBS0ksQ0FBQSxDQUFFLElBQUYsRUFDSTtVQUFBLEtBQUEsRUFDSTtZQUFBLFNBQUEsRUFBVyxDQUFYO1dBREo7U0FESixFQUdJLFdBSEosQ0FMSixFQVNJOzs7QUFDSTtBQUFBO2lCQUFBLFdBQUE7O2NBQ0ksSUFBRyxLQUFBLEtBQVMsUUFBWjs2QkFDSSxDQUFBLENBQUUsR0FBRixFQUNJLFVBQVcsQ0FBQSxJQUFBLENBRGYsR0FESjtlQUFBLE1BR0ssSUFBRyxLQUFBLEtBQVMsTUFBWjs2QkFDRCxDQUFBLENBQUUsR0FBRixFQUNJO2tCQUFBLEtBQUEsRUFDSTtvQkFBQSxjQUFBLEVBQWdCLGNBQWhCO21CQURKO2lCQURKLEVBR0ksVUFBVyxDQUFBLElBQUEsQ0FIZixHQURDO2VBQUEsTUFBQTtxQ0FBQTs7QUFKVDs7Y0FESixFQVVJLENBQUEsQ0FBRSxRQUFGLEVBQ0k7WUFBQSxPQUFBLEVBQVMsU0FBQTtjQUNMLElBQUcsT0FBQSxDQUFRLDZHQUFSLENBQUg7Z0JBQ0ksWUFBWSxDQUFDLEtBQWIsQ0FBQTtnQkFDQSxLQUFBLENBQU0sbUJBQU47dUJBQ0EsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFoQixHQUF1QixHQUgzQjs7WUFESyxDQUFUO1dBREosRUFNSSxjQU5KLENBVko7U0FUSixFQTJCSSxDQUFBLENBQUUsUUFBRixFQUNJO1VBQUEsT0FBQSxFQUFTLFNBQUMsQ0FBRDtZQUNMLFlBQVksQ0FBQyxPQUFiLENBQXFCLFVBQXJCLEVBQWlDLElBQUksQ0FBQyxTQUFMLENBQWU7Y0FBQyxXQUFBLEVBQVk7Z0JBQUMsT0FBQSxFQUFRLFFBQVQ7Z0JBQWtCLFVBQUEsRUFBVyxRQUE3QjtlQUFiO2NBQW9ELGlCQUFBLEVBQWtCLDJCQUF0RTtjQUFrRyxrQkFBQSxFQUFtQixDQUFDLGdCQUFELEVBQWtCLGdCQUFsQixFQUFtQyxnQkFBbkMsRUFBb0QsT0FBcEQsRUFBNEQsZ0JBQTVELEVBQTZFLFdBQTdFLEVBQXlGLE1BQXpGLEVBQWdHLE1BQWhHLEVBQXVHLGdCQUF2RyxFQUF3SCxZQUF4SCxFQUFxSSxXQUFySSxFQUFpSixNQUFqSixFQUF3SixPQUF4SixFQUFnSyxnQkFBaEssRUFBaUwsT0FBakwsRUFBeUwsZ0JBQXpMLEVBQTBNLGNBQTFNLEVBQXlOLGdCQUF6TixFQUEwTyxZQUExTyxFQUF1UCxnQkFBdlAsRUFBd1EsZUFBeFEsRUFBd1IsZ0JBQXhSLEVBQXlTLGFBQXpTLEVBQXVULGdCQUF2VCxFQUF3VSxrQkFBeFUsRUFBMlYscUJBQTNWLEVBQWlYLHFCQUFqWCxFQUF1WSxpQkFBdlksRUFBeVoscUJBQXpaLEVBQSthLG9CQUEvYSxFQUFvYyxVQUFwYyxFQUErYyxPQUEvYyxFQUF1ZCxNQUF2ZCxFQUE4ZCxNQUE5ZCxFQUFxZSxnQkFBcmUsRUFBc2YsTUFBdGYsRUFBNmYsZ0JBQTdmLEVBQThnQixjQUE5Z0IsRUFBNmhCLGdCQUE3aEIsRUFBOGlCLFNBQTlpQixFQUF3akIsZ0JBQXhqQixFQUF5a0IsY0FBemtCLEVBQXdsQixPQUF4bEIsRUFBZ21CLE1BQWhtQixFQUF1bUIsTUFBdm1CLEVBQThtQixnQkFBOW1CLEVBQStuQixPQUEvbkIsRUFBdW9CLGdCQUF2b0IsRUFBd3BCLGNBQXhwQixFQUF1cUIsZ0JBQXZxQixFQUF3ckIsYUFBeHJCLEVBQXNzQixnQkFBdHNCLEVBQXV0QixnQkFBdnRCLEVBQXd1QixnQkFBeHVCLEVBQXl2QixZQUF6dkIsRUFBc3dCLGdCQUF0d0IsRUFBdXhCLGtCQUF2eEIsRUFBMHlCLG9CQUExeUIsRUFBK3pCLHFCQUEvekIsRUFBcTFCLGlCQUFyMUIsRUFBdTJCLE9BQXYyQixFQUErMkIsTUFBLzJCLEVBQXMzQixnQkFBdDNCLEVBQXU0QixPQUF2NEIsRUFBKzRCLGdCQUEvNEIsRUFBZzZCLE1BQWg2QixFQUF1NkIsTUFBdjZCLEVBQTg2QixjQUE5NkIsRUFBNjdCLGdCQUE3N0IsRUFBODhCLE1BQTk4QixFQUFxOUIsU0FBcjlCLEVBQSs5QixjQUEvOUIsRUFBOCtCLGFBQTkrQixFQUE0L0IsZ0JBQTUvQixFQUE2Z0MsTUFBN2dDLEVBQW9oQyxlQUFwaEMsRUFBb2lDLGdCQUFwaUMsRUFBcWpDLGdCQUFyakMsRUFBc2tDLFlBQXRrQyxFQUFtbEMsZ0JBQW5sQyxFQUFvbUMsY0FBcG1DLEVBQW1uQyxnQkFBbm5DLEVBQW9vQyxnQkFBcG9DLEVBQXFwQyxNQUFycEMsRUFBNHBDLE1BQTVwQyxFQUFtcUMsTUFBbnFDLEVBQTBxQyxnQkFBMXFDLEVBQTJyQyxNQUEzckMsRUFBa3NDLGdCQUFsc0MsRUFBbXRDLE1BQW50QyxFQUEwdEMsZ0JBQTF0QyxFQUEydUMsT0FBM3VDLEVBQW12QyxnQkFBbnZDLEVBQW93QyxNQUFwd0MsRUFBMndDLGdCQUEzd0MsRUFBNHhDLGdCQUE1eEMsRUFBNnlDLGdCQUE3eUMsRUFBOHpDLGlCQUE5ekMsRUFBZzFDLE9BQWgxQyxFQUF3MUMsZ0JBQXgxQyxFQUF5MkMsT0FBejJDLEVBQWkzQyxnQkFBajNDLEVBQWs0QyxNQUFsNEMsRUFBeTRDLGdCQUF6NEMsRUFBMDVDLFdBQTE1QyxFQUFzNkMsTUFBdDZDLEVBQTY2QyxnQkFBNzZDLEVBQTg3QyxNQUE5N0MsRUFBcThDLE9BQXI4QyxFQUE2OEMsZ0JBQTc4QyxFQUE4OUMsY0FBOTlDLEVBQTYrQyxPQUE3K0MsRUFBcS9DLE1BQXIvQyxFQUE0L0MsTUFBNS9DLEVBQW1nRCxnQkFBbmdELEVBQW9oRCxXQUFwaEQsRUFBZ2lELE1BQWhpRCxFQUF1aUQsTUFBdmlELEVBQThpRCxnQkFBOWlELEVBQStqRCxPQUEvakQsRUFBdWtELE9BQXZrRCxFQUEra0QsZ0JBQS9rRCxFQUFnbUQsS0FBaG1ELEVBQXNtRCxPQUF0bUQsRUFBOG1ELE9BQTltRCxFQUFzbkQsZ0JBQXRuRCxFQUF1b0QsTUFBdm9ELEVBQThvRCxnQkFBOW9ELEVBQStwRCxhQUEvcEQsRUFBNnFELGVBQTdxRCxFQUE2ckQsYUFBN3JELEVBQTJzRCxNQUEzc0QsRUFBa3RELE1BQWx0RCxFQUF5dEQsZ0JBQXp0RCxFQUEwdUQsT0FBMXVELEVBQWt2RCxnQkFBbHZELEVBQW13RCxNQUFud0QsRUFBMHdELGdCQUExd0QsRUFBMnhELE1BQTN4RCxFQUFreUQsZ0JBQWx5RCxFQUFtekQsTUFBbnpELEVBQTB6RCxnQkFBMXpELEVBQTIwRCxNQUEzMEQsRUFBazFELGdCQUFsMUQsRUFBbTJELE1BQW4yRCxFQUEwMkQsZ0JBQTEyRCxFQUEyM0QsTUFBMzNELEVBQWs0RCxnQkFBbDRELEVBQW01RCxNQUFuNUQsRUFBMDVELGdCQUExNUQsRUFBMjZELE1BQTM2RCxFQUFrN0QsVUFBbDdELEVBQTY3RCxlQUE3N0QsRUFBNjhELFlBQTc4RCxFQUEwOUQsZUFBMTlELEVBQTArRCxpQkFBMStELEVBQTQvRCxnQkFBNS9ELEVBQTZnRSxNQUE3Z0UsRUFBb2hFLGdCQUFwaEUsRUFBcWlFLE9BQXJpRSxFQUE2aUUsZ0JBQTdpRSxFQUE4akUsV0FBOWpFLEVBQTBrRSxPQUExa0UsRUFBa2xFLGdCQUFsbEUsRUFBbW1FLE9BQW5tRSxFQUEybUUsZ0JBQTNtRSxFQUE0bkUsZUFBNW5FLEVBQTRvRSxpQkFBNW9FLEVBQThwRSxlQUE5cEUsRUFBOHFFLGdCQUE5cUUsRUFBK3JFLGdCQUEvckUsRUFBZ3RFLGFBQWh0RSxFQUE4dEUsUUFBOXRFLEVBQXV1RSxnQkFBdnVFLEVBQXd2RSxLQUF4dkUsRUFBOHZFLE1BQTl2RSxFQUFxd0UsV0FBcndFLEVBQWl4RSxnQkFBanhFLEVBQWt5RSxNQUFseUUsRUFBeXlFLGdCQUF6eUUsRUFBMHpFLGdCQUExekUsRUFBMjBFLE9BQTMwRSxFQUFtMUUsZ0JBQW4xRSxDQUFySDtjQUEwOUUsT0FBQSxFQUFRO2dCQUFDLGdCQUFBLEVBQWlCLElBQWxCO2dCQUF1Qix5QkFBQSxFQUEwQixJQUFqRDtnQkFBc0QsZ0JBQUEsRUFBaUIsSUFBdkU7Z0JBQTRFLGdCQUFBLEVBQWlCLElBQTdGO2VBQWwrRTtjQUFxa0YsY0FBQSxFQUFlO2dCQUFDLGdGQUFBLEVBQWlGLENBQWxGO2dCQUFvRixhQUFBLEVBQWMsQ0FBbEc7Z0JBQW9HLE9BQUEsRUFBUSxDQUE1RztnQkFBOEcsTUFBQSxFQUFPLENBQXJIO2dCQUF1SCxhQUFBLEVBQWMsQ0FBckk7Z0JBQXVJLGlCQUFBLEVBQWtCLENBQXpKO2dCQUEySixpQ0FBQSxFQUFrQyxDQUE3TDtnQkFBK0wsaURBQUEsRUFBa0QsQ0FBalA7Z0JBQW1QLGdEQUFBLEVBQWlELENBQXBTO2dCQUFzUyxrREFBQSxFQUFtRCxDQUF6VjtnQkFBMlYsNkJBQUEsRUFBOEIsQ0FBelg7Z0JBQTJYLDZCQUFBLEVBQThCLENBQXpaO2dCQUEyWixjQUFBLEVBQWUsQ0FBMWE7Z0JBQTRhLFlBQUEsRUFBYSxDQUF6YjtnQkFBMmIsbUJBQUEsRUFBb0IsQ0FBL2M7Z0JBQWlkLGFBQUEsRUFBYyxDQUEvZDtnQkFBaWUseUJBQUEsRUFBMEIsQ0FBM2Y7Z0JBQTZmLCtCQUFBLEVBQWdDLENBQTdoQjtnQkFBK2hCLDBDQUFBLEVBQTJDLENBQTFrQjtnQkFBNGtCLDRCQUFBLEVBQTZCLENBQXptQjtnQkFBMm1CLGlCQUFBLEVBQWtCLENBQTduQjtnQkFBK25CLDJCQUFBLEVBQTRCLENBQTNwQjtnQkFBNnBCLGlDQUFBLEVBQWtDLENBQS9yQjtnQkFBaXNCLDJCQUFBLEVBQTRCLENBQTd0QjtnQkFBK3RCLGtDQUFBLEVBQW1DLENBQWx3QjtnQkFBb3dCLG1FQUFBLEVBQW9FLENBQXgwQjtnQkFBMDBCLG9FQUFBLEVBQXFFLENBQS80QjtnQkFBaTVCLHVGQUFBLEVBQXdGLENBQXorQjtnQkFBMitCLCtFQUFBLEVBQWdGLENBQTNqQztnQkFBNmpDLDJFQUFBLEVBQTRFLENBQXpvQztlQUFwbEY7YUFBZixDQUFqQzttQkFDQSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQWhCLEdBQXVCO1VBRmxCLENBQVQ7U0FESixFQUlJLFdBSkosQ0EzQkosRUFnQ0ksQ0FBQSxDQUFFLFVBQUYsRUFDSTtVQUFBLEtBQUEsRUFDSTtZQUFBLE1BQUEsRUFBUSxPQUFSO1lBQ0EsS0FBQSxFQUFPLE1BRFA7WUFFQSxTQUFBLEVBQVcsTUFGWDtXQURKO1NBREosRUFLSSxDQUFDLENBQUMsS0FBRixDQUFRLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUF4QixDQUE2QixJQUE3QixDQUFSLENBTEosQ0FoQ0osRUF1Q0ksQ0FBQSxDQUFFLFVBQUYsRUFDSTtVQUFBLEtBQUEsRUFDSTtZQUFBLE1BQUEsRUFBUSxPQUFSO1lBQ0EsS0FBQSxFQUFPLE1BRFA7WUFFQSxTQUFBLEVBQVcsTUFGWDtXQURKO1NBREosRUFLSSxDQUFDLENBQUMsS0FBRixDQUFRLFlBQVksQ0FBQyxPQUFiLENBQXFCLFVBQXJCLENBQVIsQ0FMSixDQXZDSixDQURKLEVBK0NJLENBQUEsQ0FBRSxVQUFGLEVBQ0k7VUFBQSxLQUFBLEVBQ0k7WUFBQSxLQUFBLEVBQU8sQ0FBQyxNQUFNLENBQUMsVUFBUCxHQUFvQixHQUFyQixDQUFBLEdBQTRCLElBQW5DO1lBQ0EsT0FBQSxFQUFTLE1BRFQ7WUFFQSxVQUFBLEVBQVksQ0FGWjtXQURKO1NBREosRUFLSSxDQUFBLENBQUUsSUFBRixFQUFRLE1BQU0sQ0FBQyxrQkFBUCxDQUFBLENBQVIsQ0FMSixFQU1JLENBQUEsQ0FBRSxHQUFGLEVBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFkLENBQUEsQ0FBUixDQUFQLENBTkosRUFRTyxNQUFNLENBQUMsa0JBQVAsQ0FBQSxDQUFBLEtBQStCLEtBQWxDLEdBQ0k7VUFDSSxDQUFBLENBQUUsS0FBRixFQUNJO1lBQUEsS0FBQSxFQUNJO2NBQUEsS0FBQSxFQUFPLE1BQVA7Y0FDQSxTQUFBLEVBQVcsUUFEWDthQURKO1dBREosRUFJSSxDQUFBLENBQUUsS0FBRixFQUNJO1lBQUEsR0FBQSxFQUFLLHNCQUFMO1dBREosQ0FKSixDQURKLEVBT0ksQ0FBQSxDQUFFLElBQUYsQ0FQSixFQVFJLENBQUEsQ0FBRSxJQUFGLENBUkosRUFTSSxDQUFBLENBQUUsSUFBRixFQUFRLHVCQUFSLENBVEosRUFVSSxDQUFBLENBQUUsS0FBRixFQUNJLENBQUEsQ0FBRSxRQUFGLEVBQ0k7WUFBQSxHQUFBLEVBQUsscUdBQUw7WUFDQSxLQUFBLEVBQU8sS0FEUDtZQUVBLE1BQUEsRUFBUSxLQUZSO1lBR0EsV0FBQSxFQUFhLEdBSGI7WUFJQSxZQUFBLEVBQWMsR0FKZDtZQUtBLFdBQUEsRUFBYSxHQUxiO1lBTUEsS0FBQSxFQUNJO2NBQUEsT0FBQSxFQUFTLEtBQVQ7Y0FDQSxNQUFBLEVBQVEsZ0JBRFI7Y0FFQSxXQUFBLEVBQWEsTUFGYjthQVBKO1dBREosRUFXSSxZQVhKLENBREosRUFhSSxDQUFBLENBQUUsVUFBRixFQUNJO1lBQUEsS0FBQSxFQUNJO2NBQUEsTUFBQSxFQUFRLE9BQVI7YUFESjtXQURKLEVBR0ksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBeEIsQ0FBNkIsSUFBN0IsQ0FBUixDQUhKLENBYkosQ0FWSjtTQURKLEdBOEJJLENBQUEsQ0FBRSxNQUFGLEVBQ0k7VUFBQSxRQUFBLEVBQVUsSUFBSSxDQUFDLGVBQWY7U0FESixFQUVJLENBQUEsQ0FBRSxvQ0FBRixFQUNJO1VBQUEsS0FBQSxFQUNJO1lBQUEsT0FBQSxFQUFTLE9BQVQ7V0FESjtVQUVBLFFBQUEsRUFBVSxDQUFDLENBQUMsUUFBRixDQUFXLE9BQVgsRUFBb0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUE1QixDQUZWO1VBR0EsS0FBQSxFQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBUixDQUFBLENBSFA7VUFJQSxNQUFBLEVBQVEsU0FBQyxPQUFELEVBQVUsYUFBVixFQUF5QixPQUF6QjtZQUNKLElBQUcsQ0FBSSxhQUFQO3FCQUNJLE9BQU8sQ0FBQyxLQUFSLENBQUEsRUFESjs7VUFESSxDQUpSO1NBREosQ0FGSixFQVVJLENBQUEsQ0FBRSxxQkFBRixFQUF5QixJQUF6QixDQVZKLEVBV0ksQ0FBQSxDQUFFLHFCQUFGLEVBQ0k7VUFBQSxPQUFBLEVBQVMsU0FBQyxDQUFEO21CQUFPLElBQUksQ0FBQyxZQUFMLENBQWtCLFVBQWxCO1VBQVAsQ0FBVDtTQURKLEVBRUksVUFGSixDQVhKLEVBY0ksQ0FBQSxDQUFFLHFCQUFGLEVBQ0k7VUFBQSxPQUFBLEVBQVMsU0FBQyxDQUFEO21CQUFPLElBQUksQ0FBQyxZQUFMLENBQWtCLFVBQWxCO1VBQVAsQ0FBVDtTQURKLEVBRUksVUFGSixDQWRKLEVBaUJJLENBQUEsQ0FBRSxxQkFBRixFQUNJO1VBQUEsT0FBQSxFQUFTLFNBQUMsQ0FBRDttQkFBTyxJQUFJLENBQUMsWUFBTCxDQUFrQixTQUFsQjtVQUFQLENBQVQ7U0FESixFQUVJLFNBRkosQ0FqQkosRUFvQkksQ0FBQSxDQUFFLHFCQUFGLEVBQ0k7VUFBQSxPQUFBLEVBQVMsU0FBQyxDQUFEO21CQUFPLElBQUksQ0FBQyxZQUFMLENBQWtCLFNBQWxCO1VBQVAsQ0FBVDtTQURKLEVBRUksU0FGSixDQXBCSixFQXVCSSxDQUFBLENBQUUscUJBQUYsRUFDSTtVQUFBLE9BQUEsRUFBUyxTQUFDLENBQUQ7bUJBQU8sSUFBSSxDQUFDLFlBQUwsQ0FBa0IsS0FBbEI7VUFBUCxDQUFUO1NBREosRUFFSSxLQUZKLENBdkJKLEVBMEJJLENBQUEsQ0FBRSxxQkFBRixFQUNJO1VBQUEsT0FBQSxFQUFTLFNBQUMsQ0FBRDttQkFBTyxJQUFJLENBQUMsWUFBTCxDQUFrQixNQUFsQjtVQUFQLENBQVQ7U0FESixFQUVJLE1BRkosQ0ExQkosRUE2QkksQ0FBQSxDQUFFLHFCQUFGLEVBQ0k7VUFBQSxPQUFBLEVBQVMsU0FBQyxDQUFEO21CQUFPLElBQUksQ0FBQyxZQUFMLENBQWtCLEtBQWxCO1VBQVAsQ0FBVDtTQURKLEVBRUksS0FGSixDQTdCSixFQWdDSSxDQUFBLENBQUUscUJBQUYsRUFDSTtVQUFBLE9BQUEsRUFBUyxTQUFDLENBQUQ7bUJBQU8sSUFBSSxDQUFDLFlBQUwsQ0FBa0IsTUFBbEI7VUFBUCxDQUFUO1NBREosRUFFSSxNQUZKLENBaENKLENBdENSLENBL0NKOztJQURFLENBakNOOztBQURhOzs7OztBQzlEakI7QUFjQSxNQUFNLENBQUMsT0FBUCxHQUFpQixTQUFDLE1BQUQ7QUFDYixNQUFBO0VBQUEsUUFBQSxHQUFXO0VBV1gsTUFBTSxDQUFDLHVCQUFQLENBQStCLG9FQUEvQjtFQUVBLE1BQU0sQ0FBQyxvQkFBUCxDQUE0QixTQUFBO0FBQ3hCLFFBQUE7SUFBQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxDQUFIO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx1Q0FBUCxFQURKO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywwQkFBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxzRUFBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxDQUFBLElBQW1CLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUF0QjtNQUNELElBQUcsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFDLENBQUEsWUFBRCxDQUFBLENBQVosQ0FBNEIsQ0FBQyxNQUE3QixHQUFzQyxDQUF6QztlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sMkhBQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLDZGQUFQLEVBSEo7T0FEQztLQUFBLE1BS0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sUUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsaUJBQVQsQ0FBQSxJQUFnQyxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBbkM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLG1KQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQUEsSUFBeUIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxLQUFULENBQTVCO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw4R0FBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxDQUFBLElBQTZCLElBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUFoQzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sdUdBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBQSxJQUE4QixJQUFDLENBQUEsT0FBRCxDQUFTLFVBQVQsQ0FBakM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDBGQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUEsSUFBMEIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQTdCO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywrREFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFBLElBQTJCLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUE5QjthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sdUVBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGNBQVQsQ0FBQSxJQUE2QixJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBaEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGtFQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxrQkFBVCxDQUFBLElBQWlDLElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUFwQzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sc0JBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQUEsSUFBK0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQWxDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyx3RkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFBLElBQTJCLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUE5QjthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sZ0xBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBQSxJQUE4QixJQUFDLENBQUEsT0FBRCxDQUFTLFVBQVQsQ0FBakM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDJKQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUEsSUFBMEIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQTdCO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxpRkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsb0JBQVQsQ0FBQSxJQUFtQyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBdEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLEtBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGlCQUFULENBQUEsSUFBZ0MsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQW5DO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxvQkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsa0JBQVQsQ0FBQSxJQUFpQyxJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQsQ0FBcEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGtEQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyx3QkFBVCxDQUFBLElBQXVDLElBQUMsQ0FBQSxPQUFELENBQVMsbUJBQVQsQ0FBMUM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDJFQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxvQkFBVCxDQUFBLElBQW1DLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUF0QzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sbUNBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLHFCQUFULENBQUEsSUFBb0MsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUF2QzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sZUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBQSxJQUErQixJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBbEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDZCQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxxQkFBVCxDQUFBLElBQW9DLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBdkM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGlGQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxvQkFBVCxDQUFBLElBQW1DLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUF0QzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8saUJBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGlCQUFULENBQUEsSUFBZ0MsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQW5DO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxtR0FBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUFBLElBQThCLElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVCxDQUFqQzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sdUJBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGtCQUFULENBQUEsSUFBaUMsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQXBDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxrREFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMscUJBQVQsQ0FBQSxJQUFvQyxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQXZDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyx5QkFBUCxFQURDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywyRUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywwQ0FBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyx5QkFBUCxFQURDO0tBQUEsTUFBQTtNQUtELGdCQUFBLEdBQW1CLENBQ2YsNkNBRGUsRUFFZixlQUZlLEVBR2YsNEJBSGUsRUFJZixpQkFKZSxFQUtmLGdCQUxlO2FBT25CLElBQUMsQ0FBQSxLQUFELENBQU8sZ0JBQWlCLENBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsTUFBTCxDQUFBLENBQUEsR0FBYyxnQkFBZ0IsQ0FBQyxNQUExQyxDQUFBLENBQXhCLEVBWkM7O0VBakdtQixDQUE1QjtFQWdIQSxNQUFNLENBQUMsZUFBUCxDQUF1QixTQUFBO0lBQ25CLElBQUksQ0FBSSxJQUFDLENBQUEsTUFBRCxDQUFRLGdCQUFSLEVBQTBCLElBQTFCLENBQUosSUFDSSxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsQ0FESixJQUVJLElBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUZKLElBR0ksSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBSEosSUFJSSxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FKSixJQUtJLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUxKLElBTUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBTlI7YUFPSSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNGLEtBQUMsQ0FBQSxLQUFELENBQU8sdU5BQVA7aUJBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxFQUEyQixJQUEzQjtRQUZFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBUEo7O0VBRG1CLENBQXZCO0VBYUEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxnRkFBZixFQUFpRyxTQUFBO0lBQzdGLElBQUMsQ0FBQSxLQUFELENBQU8sZ0ZBQVA7V0FDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQTtlQUNGLEtBQUMsQ0FBQSxRQUFELENBQVUsYUFBVjtNQURFO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOO0VBRjZGLENBQWpHO0VBS0EsTUFBTSxDQUFDLE9BQVAsQ0FBZSxhQUFmLEVBQThCLFNBQUE7SUFDMUIsSUFBQyxDQUFBLEtBQUQsQ0FBTyxRQUFQO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7ZUFDRixLQUFDLENBQUEsUUFBRCxDQUFVLE9BQVY7TUFERTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTjtFQUYwQixDQUE5QjtFQUtBLE1BQU0sQ0FBQyxPQUFQLENBQWUsT0FBZixFQUF3QixTQUFBO0lBQ3BCLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBc0MsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBekM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDhKQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDJFQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQUxlLENBQXhCO0VBV0EsTUFBTSxDQUFDLE9BQVAsQ0FBZSxNQUFmLEVBQXVCLFNBQUE7SUFDbkIsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QztNQUNJLElBQUcsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBSDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sK1RBQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLHVPQUFQLEVBSEo7T0FESjtLQUFBLE1BTUssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sZ0ZBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBSDtNQUNELElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQUg7UUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLHdXQUFQO2VBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO1lBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyxtU0FBUDttQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7Y0FDRixLQUFDLENBQUEsS0FBRCxDQUFPLHlLQUFQO3FCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTtnQkFDRixLQUFDLENBQUEsS0FBRCxDQUFPLGtQQUFQO2dCQUNBLEtBQUMsQ0FBQSxVQUFELENBQVksVUFBWjt1QkFDQSxLQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULEVBQTJCLElBQTNCO2NBSEUsQ0FBTjtZQUZFLENBQU47VUFGRTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUZKO09BREM7S0FBQSxNQVlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQUEsSUFBNEIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxnQkFBUixFQUEwQixJQUExQixDQUEvQjtNQUNELElBQUMsQ0FBQSxLQUFELENBQU8sbVJBQVA7YUFDQSxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsRUFBMEIsSUFBMUIsRUFGQztLQUFBLE1BSUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBQSxJQUEyQixJQUFDLENBQUEsTUFBRCxDQUFRLGVBQVIsRUFBeUIsSUFBekIsQ0FBOUI7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLG9CQUFWLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUg7TUFDRCxJQUFHLENBQUksSUFBQyxDQUFBLE1BQUQsQ0FBUSxnQkFBUixFQUEwQixJQUExQixDQUFQO1FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx3TUFBUDtlQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtZQUNGLEtBQUMsQ0FBQSxLQUFELENBQU8sNFVBQVA7bUJBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxFQUEyQixJQUEzQjtVQUZFO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBRko7T0FBQSxNQUFBO2VBTUksSUFBQyxDQUFBLEtBQUQsQ0FBTyxrSkFBUCxFQU5KO09BREM7S0FBQSxNQVNBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLE9BQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsY0FBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxZQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQTVDYyxDQUF2QjtFQWtEQSxNQUFNLENBQUMsT0FBUCxDQUFlLGNBQWYsRUFBK0IsU0FBQTtJQUMzQixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO01BQ0ksSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFIO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxzTkFBUCxFQURKO09BQUEsTUFBQTtlQUdJLElBQUMsQ0FBQSxLQUFELENBQU8sNEhBQVAsRUFISjtPQURKO0tBQUEsTUFNSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLG9CQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGlCQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFYc0IsQ0FBL0I7RUFpQkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxZQUFmLEVBQTZCLFNBQUE7SUFDekIsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QztNQUNJLElBQUcsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBUDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sNEpBQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLCtNQUFQLEVBSEo7T0FESjtLQUFBLE1BS0ssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLG1CQUFULENBQUg7TUFDRCxJQUFHLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQVA7UUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLGlWQUFQO2VBQ0EsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULEVBRko7T0FBQSxNQUFBO2VBSUksSUFBQyxDQUFBLEtBQUQsQ0FBTyx1QkFBUCxFQUpKO09BREM7S0FBQSxNQU9BLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxpQkFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxtQ0FBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLG9CQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGlCQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFwQm9CLENBQTdCO0VBMEJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsYUFBZixFQUE4QixTQUFBO0lBQzFCLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBc0MsQ0FBSSxJQUFDLENBQUEsTUFBRCxDQUFRLHFCQUFSLEVBQStCLElBQS9CLENBQTdDO01BQ0ksTUFBTSxDQUFDLElBQVAsQ0FBWSw2Q0FBWixFQUEyRCxRQUEzRCxFQURKOztJQUdBLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7TUFDSSxJQUFHLENBQUksSUFBQyxDQUFBLE1BQUQsQ0FBUSx5QkFBUixFQUFtQyxJQUFuQyxDQUFQO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxnTUFBUCxFQURKO09BQUEsTUFBQTtlQUdJLElBQUMsQ0FBQSxLQUFELENBQU8sNk5BQVAsRUFISjtPQURKO0tBQUEsTUFNSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO01BQ0QsSUFBRyxDQUFJLElBQUMsQ0FBQSxNQUFELENBQVEseUJBQVIsRUFBbUMsSUFBbkMsQ0FBUDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sZ0pBQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLHVFQUFQLEVBSEo7T0FEQztLQUFBLE1BTUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFVBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMkJBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMkZBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFVBQVQsQ0FBQSxJQUF3QixJQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsQ0FBM0I7TUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHlQQUFQO01BQ0EsSUFBQyxDQUFBLE9BQUQsQ0FBUyx5QkFBVCxFQUFvQyxJQUFwQzthQUNBLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxFQUhDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxvSEFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGlCQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUEvQnFCLENBQTlCO0VBcUNBLE1BQU0sQ0FBQyxPQUFQLENBQWUsb0JBQWYsRUFBcUMsU0FBQTtJQUNqQyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO01BQ0ksSUFBRyxJQUFDLENBQUEsVUFBRCxDQUFZLENBQUMsNkJBQUQsQ0FBWixDQUFIO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx5SkFBUCxFQURKO09BQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQUg7ZUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDZOQUFQLEVBREM7T0FBQSxNQUFBO2VBR0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywrUEFBUCxFQUhDO09BSFQ7S0FBQSxNQU9LLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDJFQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBQSxJQUFvQixJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBdkI7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLDZCQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGNBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsWUFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBakI0QixDQUFyQztFQXVCQSxNQUFNLENBQUMsT0FBUCxDQUFlLDZCQUFmLEVBQThDLFNBQUE7SUFDMUMsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sOEZBQVAsRUFESjtLQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDtNQUNELElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBRCxDQUFRLG9CQUFSLEVBQThCLElBQTlCLENBQVA7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDRQQUFQLEVBREo7T0FBQSxNQUFBO2VBR0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxpRkFBUCxFQUhKO09BREM7S0FBQSxNQU1BLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDJFQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHlGQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxrQkFBVCxDQUFBLElBQWdDLElBQUMsQ0FBQSxPQUFELENBQVMsa0JBQVQsQ0FBbkM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDZEQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUFBLElBQThCLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBakM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHdDQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUFBLElBQThCLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBakM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDREQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxtQkFBVCxDQUFBLElBQWlDLElBQUMsQ0FBQSxPQUFELENBQVMsbUJBQVQsQ0FBakMsSUFBa0UsSUFBQyxDQUFBLE9BQUQsQ0FBUyxpQkFBVCxDQUFsRSxJQUFpRyxJQUFDLENBQUEsT0FBRCxDQUFTLGlCQUFULENBQXBHO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywrREFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxDQUFBLElBQTRCLElBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxDQUEvQjthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sNkxBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxLQUFELENBQU8sd0VBQVA7TUFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLFVBQVo7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNGLEtBQUMsQ0FBQSxPQUFELENBQVMsU0FBVDtpQkFDQSxLQUFDLENBQUEsS0FBRCxDQUFPLHVGQUFQO1FBRkU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFIQztLQUFBLE1BT0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBQSxJQUFvQixJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBdkI7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLG9CQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFsQ3FDLENBQTlDO0VBd0NBLE1BQU0sQ0FBQyxPQUFQLENBQWUsaUJBQWYsRUFBa0MsU0FBQTtJQUM5QixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFIO01BQ0ksSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFIO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywyWkFBUCxFQURKO09BQUEsTUFBQTtlQUdJLElBQUMsQ0FBQSxLQUFELENBQU8sMktBQVAsRUFISjtPQURKO0tBQUEsTUFLSyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLG9TQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQUEsSUFBMEIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQTFCLElBQW9ELElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUF2RDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sZ0VBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBQSxJQUFvQixJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBcEIsSUFBNkMsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQTdDLElBQWtFLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxDQUFyRTthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsMkJBQVYsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsWUFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBZnlCLENBQWxDO0VBcUJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsMkJBQWYsRUFBNEMsU0FBQTtJQUN4QyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO01BQ0ksSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFIO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywrWkFBUCxFQURKO09BQUEsTUFBQTtlQUdJLElBQUMsQ0FBQSxLQUFELENBQU8sZ0hBQVAsRUFISjtPQURKO0tBQUEsTUFNSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSwrQkFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSwyQkFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpQ0FBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBYm1DLENBQTVDO0VBa0JBLE1BQU0sQ0FBQyxPQUFQLENBQWUsK0JBQWYsRUFBZ0QsU0FBQTtJQUM1QyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxxSUFBUCxFQURKO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSwyQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBSHVDLENBQWhEO0VBUUEsTUFBTSxDQUFDLE9BQVAsQ0FBZSwyQkFBZixFQUE0QyxTQUFBO0lBQ3hDLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLGdQQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUEsSUFBeUIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQTVCO01BQ0QsSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFQO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxtTUFBUCxFQURKO09BQUEsTUFBQTtlQUdJLElBQUMsQ0FBQSxLQUFELENBQU8sb0JBQVAsRUFISjtPQURDO0tBQUEsTUFNQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyx5QkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxlQUFQO2FBQ0EsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE1BQUQsQ0FBUSxnQkFBUixFQUEwQixJQUExQixDQUFBLElBQW9DLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUF2QztNQUNELElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsRUFBMkIsT0FBM0I7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGtDQUFWLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLDJCQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFwQm1DLENBQTVDO0VBeUJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsa0NBQWYsRUFBbUQsU0FBQTtJQUMvQyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO01BQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywySkFBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyx1VUFBUDtpQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7WUFDRixLQUFDLENBQUEsS0FBRCxDQUFPLHdoQkFBUDttQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7Y0FDRixLQUFDLENBQUEsS0FBRCxDQUFPLDZFQUFQO3FCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTt1QkFDRixLQUFDLENBQUEsUUFBRCxDQUFVLG1FQUFWO2NBREUsQ0FBTjtZQUZFLENBQU47VUFGRSxDQUFOO1FBRkU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFGSjtLQUFBLE1BQUE7YUFXSSxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQVhKOztFQUQrQyxDQUFuRDtFQWNBLE1BQU0sQ0FBQyxPQUFQLENBQWUsbUVBQWYsRUFBb0YsU0FBQTtJQUNoRixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxzREFBUCxFQURKO0tBQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFBLElBQXFCLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUF4QjtNQUNELElBQUMsQ0FBQSxLQUFELENBQU8saUNBQVA7TUFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLE1BQVo7TUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLGdDQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDRixJQUFHLENBQUksS0FBQyxDQUFBLE9BQUQsQ0FBUyxTQUFULENBQVA7bUJBQ0ksS0FBQyxDQUFBLFFBQUQsQ0FBVSxvRUFBVixFQURKO1dBQUEsTUFBQTttQkFHSSxLQUFDLENBQUEsS0FBRCxDQUFPLDJDQUFQLEVBSEo7O1FBREU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFKQztLQUFBLE1BVUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBQSxJQUF3QixJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBM0I7TUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGtDQUFQO01BQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxTQUFaO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxnQ0FBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0YsSUFBRyxDQUFJLEtBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFQO21CQUNJLEtBQUMsQ0FBQSxRQUFELENBQVUsb0VBQVYsRUFESjtXQUFBLE1BQUE7bUJBR0ksS0FBQyxDQUFBLEtBQUQsQ0FBTywyQ0FBUCxFQUhKOztRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSkM7S0FBQSxNQVVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxjQUFULENBQUEsSUFBNkIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQTdCLElBQWtELElBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUFyRDtNQUNELElBQUMsQ0FBQSxVQUFELENBQVksU0FBWjtNQUNBLElBQUMsQ0FBQSxVQUFELENBQVksTUFBWjtNQUNBLElBQUMsQ0FBQSxLQUFELENBQU8sZ0NBQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDRixLQUFDLENBQUEsUUFBRCxDQUFVLG9FQUFWO1FBREU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFKQztLQUFBLE1BQUE7YUFPRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQVBDOztFQXhCMkUsQ0FBcEY7RUFpQ0EsTUFBTSxDQUFDLE9BQVAsQ0FBZSxvRUFBZixFQUFxRixTQUFBO0lBQ2pGLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLGlIQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQUEsSUFBd0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUF4QixJQUFzRCxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBekQ7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDBHQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUEsSUFBcUIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQXhCO01BQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxpQ0FBUDtNQUNBLElBQUMsQ0FBQSxVQUFELENBQVksTUFBWjtNQUNBLElBQUMsQ0FBQSxLQUFELENBQU8sZ0NBQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNGLElBQUcsQ0FBQyxDQUFJLEtBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxDQUFMLENBQUEsSUFBMEIsQ0FBQyxDQUFJLEtBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFMLENBQTdCO21CQUNJLEtBQUMsQ0FBQSxRQUFELENBQVUsdUZBQVYsRUFESjtXQUFBLE1BQUE7bUJBR0ksS0FBQyxDQUFBLEtBQUQsQ0FBTywyQ0FBUCxFQUhKOztRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSkM7S0FBQSxNQVNBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUEsSUFBMEIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQTdCO01BQ0QsSUFBQyxDQUFBLFVBQUQsQ0FBWSxXQUFaO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxnQ0FBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0YsSUFBRyxDQUFDLENBQUksS0FBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUwsQ0FBQSxJQUEyQixDQUFDLENBQUksS0FBQyxDQUFBLE9BQUQsQ0FBUyxLQUFULENBQUwsQ0FBOUI7bUJBQ0ksS0FBQyxDQUFBLFFBQUQsQ0FBVSx1RkFBVixFQURKO1dBQUEsTUFBQTttQkFHSSxLQUFDLENBQUEsS0FBRCxDQUFPLDJDQUFQLEVBSEo7O1FBREU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFIQztLQUFBLE1BUUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsQ0FBQSxJQUFvQixJQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsQ0FBdkI7TUFDRCxJQUFDLENBQUEsVUFBRCxDQUFZLEtBQVo7TUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLGdDQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDRixJQUFHLENBQUMsQ0FBSSxLQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBTCxDQUFBLElBQTJCLENBQUMsQ0FBSSxLQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBTCxDQUE5QjttQkFDSSxLQUFDLENBQUEsUUFBRCxDQUFVLHVGQUFWLEVBREo7V0FBQSxNQUFBO21CQUdJLEtBQUMsQ0FBQSxLQUFELENBQU8sMkNBQVAsRUFISjs7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUhDO0tBQUEsTUFBQTthQVNELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBVEM7O0VBdEI0RSxDQUFyRjtFQWlDQSxNQUFNLENBQUMsT0FBUCxDQUFlLHVGQUFmLEVBQXdHLFNBQUE7SUFDcEcsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8saUdBQVAsRUFESjtLQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsK0VBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMkZBQVAsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQUwrRixDQUF4RztFQVVBLE1BQU0sQ0FBQyxPQUFQLENBQWUsK0VBQWYsRUFBZ0csU0FBQTtJQUM1RixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO01BQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywwTUFBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNGLEtBQUMsQ0FBQSxRQUFELENBQVUsMkVBQVY7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUZKO0tBQUEsTUFBQTthQUtJLElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBTEo7O0VBRDRGLENBQWhHO0VBUUEsTUFBTSxDQUFDLE9BQVAsQ0FBZSwyRUFBZixFQUE0RixTQUFBO0lBQ3hGLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLHdFQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7TUFDRCxJQUFDLENBQUEsVUFBRCxDQUFZLE9BQVo7TUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLDhCQUFQO01BQ0EsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFUO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ0YsS0FBQyxDQUFBLFFBQUQsQ0FBVSwyQkFBVjtRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSkM7S0FBQSxNQUFBO2FBT0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFQQzs7RUFIbUYsQ0FBNUY7RUFhQSxNQUFNLENBQUMsT0FBUCxDQUFlLGlDQUFmLEVBQWtELFNBQUE7SUFDOUMsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8scVNBQVAsRUFESjtLQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBQSxJQUE2QixJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBN0IsSUFBMEQsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQTFELElBQW1GLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUF0RjtNQUNELElBQUcsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBUDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sMFNBQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLDhEQUFQLEVBSEo7T0FEQztLQUFBLE1BTUEsSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFQO01BQ0QsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQsQ0FBQSxJQUEyQixJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQsQ0FBOUI7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDBEQUFQLEVBREo7T0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUFBLElBQThCLElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUE5QixJQUF5RCxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQXpELElBQXVGLElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUExRjtlQUNELElBQUMsQ0FBQSxLQUFELENBQU8sOEZBQVAsRUFEQztPQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQsQ0FBQSxJQUEyQixJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBM0IsSUFBcUQsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQXJELElBQWdGLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFuRjtlQUNELElBQUMsQ0FBQSxLQUFELENBQU8sOEVBQVAsRUFEQztPQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBQSxJQUEwQixJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBMUIsSUFBbUQsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQW5ELElBQTRFLElBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUEvRTtlQUNELElBQUMsQ0FBQSxLQUFELENBQU8scUNBQVAsRUFEQztPQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBQSxJQUEwQixJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBMUIsSUFBbUQsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQW5ELElBQTRFLElBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUEvRTtRQUNELElBQUMsQ0FBQSxLQUFELENBQU8sbUtBQVA7ZUFDQSxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsRUFGQztPQVhKO0tBQUEsTUFjQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFBLElBQW9CLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUF2QjthQUNHLElBQUMsQ0FBQSxLQUFELENBQU8sZ0dBQVAsRUFESDtLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsMkJBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQTFCeUMsQ0FBbEQ7RUFnQ0EsTUFBTSxDQUFDLE9BQVAsQ0FBZSxpQkFBZixFQUFrQyxTQUFBO0lBQzlCLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUg7TUFDSSxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQUg7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLHlVQUFQLEVBREo7T0FBQSxNQUFBO2VBR0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywyUUFBUCxFQUhKO09BREo7S0FBQSxNQUtLLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sOFFBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsaUNBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsNkJBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsY0FBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxhQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFmeUIsQ0FBbEM7RUFxQkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxpQ0FBZixFQUFrRCxTQUFBO0lBQzlDLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLGtLQUFQLEVBREo7S0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGlCQUFWLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxTQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGlEQUFWLEVBREM7O0VBUHlDLENBQWxEO0VBVUEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxpREFBZixFQUFrRSxTQUFBO0lBQzlELElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDRHQUFQLEVBREo7S0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQ7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGdEQUFWLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQ7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGdEQUFWLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxtQkFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxtQkFBVDthQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsZ0RBQVYsRUFGQztLQUFBLE1BSUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVDthQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsZ0RBQVYsRUFGQzs7RUFoQnlELENBQWxFO0VBb0JBLE1BQU0sQ0FBQyxPQUFQLENBQWUsZ0RBQWYsRUFBaUUsU0FBQTtJQUM3RCxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxvSkFBUCxFQURKO0tBQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQ7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGtEQUFWLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQ7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGtEQUFWLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQUEsSUFBd0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQXhCLElBQTRDLElBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUE1QyxJQUFtRSxJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBdEU7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQ7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGtEQUFWLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQUEsSUFBd0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQTNCO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVDthQUNBLElBQUMsQ0FBQSxRQUFELENBQVUsa0RBQVYsRUFGQzs7RUFoQndELENBQWpFO0VBb0JBLE1BQU0sQ0FBQyxPQUFQLENBQWUsa0RBQWYsRUFBbUUsU0FBQTtBQUMvRCxRQUFBO0lBQUEsSUFBQSxHQUFPO0lBRVAsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sdUZBQVAsRUFESjtLQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVDtNQUNBLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNGLEtBQUMsQ0FBQSxRQUFELENBQVUsNkJBQVY7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUhDO0tBQUEsTUFLQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFUO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ0YsS0FBQyxDQUFBLFFBQUQsQ0FBVSw2QkFBVjtRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSEM7S0FBQSxNQUtBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQ7TUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLElBQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDRixLQUFDLENBQUEsUUFBRCxDQUFVLDZCQUFWO1FBREU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFIQztLQUFBLE1BS0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFUO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ0YsS0FBQyxDQUFBLFFBQUQsQ0FBVSw2QkFBVjtRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSEM7S0FBQSxNQUFBO2FBTUQsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFOQzs7RUFyQjBELENBQW5FO0VBOEJBLGNBQUEsR0FBaUIsU0FBQyxNQUFEO0FBQ2IsUUFBQTtJQUFBLE1BQUEsR0FBUztJQUNULE1BQUEsR0FBUztJQUNULE1BQUEsR0FBUztJQUNULE1BQUEsR0FBUztJQUVULElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxZQUFmLENBQUg7TUFBcUMsTUFBQSxHQUFyQzs7SUFDQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsZ0JBQWYsQ0FBSDtNQUF5QyxNQUFBLEdBQXpDOztJQUNBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxVQUFmLENBQUg7TUFBbUMsTUFBQSxHQUFuQzs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsYUFBZixDQUFIO01BQXNDLE1BQUEsR0FBdEM7O0lBQ0EsSUFBRyxNQUFNLENBQUMsT0FBUCxDQUFlLFlBQWYsQ0FBSDtNQUFxQyxNQUFBLEdBQXJDOztJQUNBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxnQkFBZixDQUFIO01BQXlDLE1BQUEsR0FBekM7O0lBRUEsSUFBRyxNQUFNLENBQUMsT0FBUCxDQUFlLG1CQUFmLENBQUg7TUFBNEMsTUFBQSxHQUE1Qzs7SUFDQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsZ0JBQWYsQ0FBSDtNQUF5QyxNQUFBLEdBQXpDOztJQUNBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxhQUFmLENBQUg7TUFBc0MsTUFBQSxHQUF0Qzs7SUFFQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsZUFBZixDQUFIO01BQXdDLE1BQUEsR0FBeEM7O0lBQ0EsSUFBRyxNQUFNLENBQUMsT0FBUCxDQUFlLGVBQWYsQ0FBSDtNQUF3QyxNQUFBLEdBQXhDOztJQUNBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxZQUFmLENBQUg7TUFBcUMsTUFBQSxHQUFyQzs7QUFFQSxXQUFPLElBQUksQ0FBQyxHQUFMLENBQVMsTUFBVCxFQUFpQixNQUFqQixFQUF5QixNQUF6QixFQUFpQyxNQUFqQztFQXRCTTtFQXdCakIscUJBQUEsR0FBd0IsU0FBQyxNQUFEO0lBQ3BCLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFlBQWxCO0lBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsYUFBbEI7SUFDQSxNQUFNLENBQUMsVUFBUCxDQUFrQixtQkFBbEI7SUFDQSxNQUFNLENBQUMsVUFBUCxDQUFrQixlQUFsQjtJQUVBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLGdCQUFsQjtJQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFlBQWxCO0lBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsZ0JBQWxCO0lBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsZUFBbEI7SUFFQSxNQUFNLENBQUMsVUFBUCxDQUFrQixVQUFsQjtJQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLGdCQUFsQjtJQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLGFBQWxCO1dBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsWUFBbEI7RUFkb0I7RUFpQnhCLE1BQU0sQ0FBQyxPQUFQLENBQWUsNkJBQWYsRUFBOEMsU0FBQTtJQUMxQyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx3S0FBUCxFQURKO0tBQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxDQUFIO0FBQ0QsY0FBTyxjQUFBLENBQWUsSUFBZixDQUFQO0FBQUEsYUFDUyxDQURUO2lCQUVRLElBQUMsQ0FBQSxLQUFELENBQU8seU5BQVA7QUFGUixhQUdTLENBSFQ7VUFJUSxJQUFDLENBQUEsS0FBRCxDQUFPLDZQQUFQO2lCQUNBLHFCQUFBLENBQXNCLElBQXRCO0FBTFIsYUFNUyxDQU5UO1VBT1EsSUFBQyxDQUFBLEtBQUQsQ0FBTyw4TkFBUDtpQkFDQSxxQkFBQSxDQUFzQixJQUF0QjtBQVJSLGFBU1MsQ0FUVDtVQVVRLElBQUMsQ0FBQSxLQUFELENBQU8sNFRBQVA7aUJBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTttQkFBQSxTQUFBO3FCQUNGLEtBQUMsQ0FBQSxRQUFELENBQVUsNkJBQVY7WUFERTtVQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTjtBQVhSLE9BREM7S0FBQSxNQWVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGlCQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFuQnFDLENBQTlDO0VBeUJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsNkJBQWYsRUFBOEMsU0FBQTtJQUMxQyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyw4Z0JBQVAsRUFESjtLQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxLQUFELENBQU8seUdBQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNGLElBQUcsS0FBQyxDQUFBLGFBQUQsQ0FBZSxFQUFmLENBQUg7WUFDSSxLQUFDLENBQUEsS0FBRCxDQUFPLDRNQUFQO21CQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTtjQUNGLHFCQUFBLENBQXNCLEtBQXRCO3FCQUNBLEtBQUMsQ0FBQSxRQUFELENBQVUsNkJBQVY7WUFGRSxDQUFOLEVBRko7V0FBQSxNQUFBO1lBTUksS0FBQyxDQUFBLEtBQUQsQ0FBTywrREFBUDttQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7Y0FDRixLQUFDLENBQUEsS0FBRCxDQUFPLDhOQUFQO3FCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTtnQkFDRixLQUFDLENBQUEsS0FBRCxDQUFPLDBWQUFQO3VCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTtrQkFDRixxQkFBQSxDQUFzQixLQUF0QjtrQkFDQSxLQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQ7eUJBQ0EsS0FBQyxDQUFBLFFBQUQsQ0FBVSw2QkFBVjtnQkFIRSxDQUFOO2NBRkUsQ0FBTjtZQUZFLENBQU4sRUFQSjs7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUZDO0tBQUEsTUFBQTthQW1CRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQW5CQzs7RUFKcUMsQ0FBOUM7RUEwQkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxhQUFmLEVBQThCLFNBQUE7SUFDMUIsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBSDtNQUNJLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFDLCtCQUFELEVBQWtDLHlCQUFsQyxDQUFaLENBQUg7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDJJQUFQLEVBREo7T0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBSDtlQUNELElBQUMsQ0FBQSxLQUFELENBQU8sb1RBQVAsRUFEQztPQUFBLE1BQUE7ZUFHRCxJQUFDLENBQUEsS0FBRCxDQUFPLG9NQUFQLEVBSEM7T0FIVDtLQUFBLE1BT0ssSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywyTUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSwrQkFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSx5QkFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxvQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBZnFCLENBQTlCO0VBcUJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsK0JBQWYsRUFBZ0QsU0FBQTtJQUM1QyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFIO01BQ0ksSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFIO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyw2T0FBUCxFQURKO09BQUEsTUFBQTtlQUdJLElBQUMsQ0FBQSxLQUFELENBQU8sbU5BQVAsRUFISjtPQURKO0tBQUEsTUFNSyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGdRQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHFGQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLFVBQVQ7YUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLCtJQUFQLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLDBDQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQWxCdUMsQ0FBaEQ7RUF3QkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSx5QkFBZixFQUEwQyxTQUFBO0lBQ3RDLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUg7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDhSQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8seVBBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGNBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sb0dBQVAsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMEdBQVAsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sd0ZBQVAsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBQSxJQUF5QixJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBNUI7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHNEQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQ7YUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLCtKQUFQLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDREQUFBLEdBQStELENBQUMsRUFBQSxHQUFLLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWdCLEVBQTNCLENBQU4sQ0FBcUMsQ0FBQyxRQUF0QyxDQUFBLENBQS9ELEdBQWtILENBQUEsa0NBQUEsR0FBa0MsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSCxHQUEwQixDQUExQixHQUFpQyxFQUFsQyxDQUFsQyxHQUF1RSxzQkFBdkUsQ0FBekgsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsYUFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBdEJpQyxDQUExQztFQTRCQSxNQUFNLENBQUMsT0FBUCxDQUFlLDBDQUFmLEVBQTJELFNBQUE7SUFDdkQsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QztNQUNJLElBQUcsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBSDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sNGJBQVAsRUFESjtPQUFBLE1BRUssSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFQO2VBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxrTEFBUCxFQURDO09BQUEsTUFFQSxJQUFHLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQVA7ZUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDhLQUFQLEVBREM7T0FBQSxNQUFBO2VBR0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxpTEFBUCxFQUhDO09BTFQ7S0FBQSxNQVVLLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sc05BQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBQSxJQUFvQixJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBcEIsSUFBeUMsSUFBQyxDQUFBLE9BQUQsQ0FBUyxTQUFULENBQTVDO01BQ0QsSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFQO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxpU0FBUCxFQURKO09BQUEsTUFBQTtRQUdJLElBQUMsQ0FBQSxLQUFELENBQU8sNmlCQUFQO2VBQ0EsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULEVBSko7T0FEQztLQUFBLE1BT0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsK0JBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQXJCa0QsQ0FBM0Q7RUEyQkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxvQkFBZixFQUFxQyxTQUFBO0lBQ2pDLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLGdZQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxjQUFULENBQUg7TUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDRQQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDRixLQUFDLENBQUEsS0FBRCxDQUFPLGdMQUFQO2lCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTtZQUNGLEtBQUMsQ0FBQSxLQUFELENBQU8sd05BQVA7bUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxTQUFBO2NBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyw0U0FBUDtxQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7dUJBQ0YsS0FBQyxDQUFBLFFBQUQsQ0FBVSxvQ0FBVjtjQURFLENBQU47WUFGRSxDQUFOO1VBRkUsQ0FBTjtRQUZFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBRkM7S0FBQSxNQUFBO2FBV0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFYQzs7RUFINEIsQ0FBckM7RUFnQkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxvQ0FBZixFQUFxRCxTQUFBO0lBQ2pELElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLGVBQVAsRUFESjtLQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixXQUFoQixDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywyREFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsUUFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw0TUFBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyxpRUFBUDtpQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7WUFDRixLQUFDLENBQUEsS0FBRCxDQUFPLGdHQUFQO21CQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTtjQUNGLEtBQUMsQ0FBQSxLQUFELENBQU8sNkVBQVA7cUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxTQUFBO2dCQUNGLEtBQUMsQ0FBQSxPQUFELENBQVMsZUFBVDt1QkFDQSxLQUFDLENBQUEsUUFBRCxDQUFVLDZDQUFWO2NBRkUsQ0FBTjtZQUZFLENBQU47VUFGRSxDQUFOO1FBRkU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFGQztLQUFBLE1BQUE7YUFZRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQVpDOztFQU40QyxDQUFyRDtFQW9CQSxNQUFNLENBQUMsT0FBUCxDQUFlLDZDQUFmLEVBQThELFNBQUE7SUFDMUQsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLG1CQUFULENBQUg7TUFDSSxJQUFDLENBQUEsVUFBRCxDQUFZLGVBQVo7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsRUFGSjtLQUFBLE1BQUE7YUFJSSxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUpKOztFQUQwRCxDQUE5RDtFQVFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsS0FBZixFQUFzQixTQUFBO0lBQ2xCLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUg7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLG9NQUFQLEVBREo7O0VBRGtCLENBQXRCO1NBS0EsTUFBTSxDQUFDLFlBQVAsQ0FBb0IsZ0ZBQXBCO0FBOTRCYTs7Ozs7QUNkakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJzeW5vbnltRGF0YSA9IHJlcXVpcmUoJy4vc3lub255bXMnKVxuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRW5naW5lXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEByb29tcyA9IHt9XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcyA9IC0+XG4gICAgICAgIEBhZnRlckNvbW1hbmQgPSAtPlxuXG4gICAgICAgIEBpbnZlbnRvcnkgPSB7fVxuICAgICAgICBAY3VycmVudFJvb21OYW1lID0gJydcbiAgICAgICAgQGZsYWdzID0ge31cbiAgICAgICAgQHJvb21zRW50ZXJlZCA9IHt9XG5cbiAgICAgICAgQGNvbW1hbmRXb3JkcyA9IFtdXG4gICAgICAgIEBjb21tYW5kVGV4dCA9ICcnXG4gICAgICAgIEBtZXNzYWdlID0gJydcblxuICAgICAgICBAY2FsbGJhY2tzID0gW11cbiAgICAgICAgQHN0YXJ0Um9vbSA9ICcnXG4gICAgICAgIEBsYXN0Um9vbSA9ICcnXG5cbiAgICAgICAgQHdhaXRDYWxsYmFjayA9IG51bGxcbiAgICAgICAgQGFscmVhZHlHb3R0ZW5NZXNzYWdlID0gJydcblxuICAgICAgICBAcHJldmlvdXNDb21tYW5kcyA9IFtdXG5cbiAgICBzZXRTdGFydFJvb206IChyb29tTmFtZSkgLT5cbiAgICAgICAgQHN0YXJ0Um9vbSA9IHJvb21OYW1lXG5cbiAgICBzZXRBZnRlckNvbW1hbmQ6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQGFmdGVyQ29tbWFuZCA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIHNldEFscmVhZHlHb3R0ZW5NZXNzYWdlOiAobXNnKSAtPlxuICAgICAgICBAYWxyZWFkeUdvdHRlbk1lc3NhZ2UgPSBtc2dcblxuICAgIHNhdmU6IC0+XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtICdwcm9ncmVzcycsIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIGludmVudG9yeTogQGludmVudG9yeVxuICAgICAgICAgICAgY3VycmVudFJvb21OYW1lOiBAY3VycmVudFJvb21OYW1lXG4gICAgICAgICAgICBwcmV2aW91c0NvbW1hbmRzOiBAcHJldmlvdXNDb21tYW5kc1xuICAgICAgICAgICAgZmxhZ3M6IEBmbGFnc1xuICAgICAgICAgICAgcm9vbXNFbnRlcmVkOiBAcm9vbXNFbnRlcmVkXG4gICAgICAgIH0pXG5cbiAgICBsb2FkOiAtPlxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwcm9ncmVzcycpKVxuICAgICAgICAgICAgQGludmVudG9yeSA9IGRhdGEuaW52ZW50b3J5XG4gICAgICAgICAgICBAY3VycmVudFJvb21OYW1lID0gZGF0YS5jdXJyZW50Um9vbU5hbWVcbiAgICAgICAgICAgIEBwcmV2aW91c0NvbW1hbmRzID0gZGF0YS5wcmV2aW91c0NvbW1hbmRzIG9yIFtdXG4gICAgICAgICAgICBAZmxhZ3MgPSBkYXRhLmZsYWdzXG4gICAgICAgICAgICBAcm9vbXNFbnRlcmVkID0gZGF0YS5yb29tc0VudGVyZWRcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIGNhdGNoXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBhZGRSb29tOiAocm9vbU5hbWUsIGNhbGxiYWNrKSAtPlxuICAgICAgICBAcm9vbXNbcm9vbU5hbWVdID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgZ2V0Q3VycmVudFJvb21OYW1lOiAtPiBAY3VycmVudFJvb21OYW1lXG5cbiAgICBnZXRDdXJyZW50TWVzc2FnZTogLT4gQG1lc3NhZ2VcblxuICAgIGdldEludmVudG9yeTogLT4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShAaW52ZW50b3J5KSlcblxuICAgIGRvQ29tbWFuZDogKEBjb21tYW5kVGV4dCkgLT5cblxuICAgICAgICBpZiBAd2FpdENhbGxiYWNrP1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBAd2FpdENhbGxiYWNrXG4gICAgICAgICAgICBAd2FpdENhbGxiYWNrID0gbnVsbFxuICAgICAgICAgICAgY2FsbGJhY2soKVxuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgaWYgQGNvbW1hbmRUZXh0ID09ICcnIHRoZW4gcmV0dXJuXG5cbiAgICAgICAgQHByZXZpb3VzQ29tbWFuZHMucHVzaChAY29tbWFuZFRleHQpXG5cbiAgICAgICAgIyBjbGVhbiB1cCB0aGUgY29tbWFuZCB0ZXh0XG4gICAgICAgIEBjb21tYW5kVGV4dCA9ICcgJyArIEBjb21tYW5kVGV4dFxuICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXFcrL2csICcgJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHN7Mix9L2csICcgJykgKyAnICdcblxuICAgICAgICAjIGZpbmQgc3lub255bXMgYW5kIHJlcGxhY2UgdGhlbSB3aXRoIHRoZSBjYW5vbmljYWwgd29yZFxuICAgICAgICBmb3IgY2Fubm9uaWNhbFdvcmQsIHN5bm9ueW1zIG9mIHN5bm9ueW1EYXRhXG4gICAgICAgICAgICBmb3Igc3lub255bSBpbiBzeW5vbnltc1xuICAgICAgICAgICAgICAgIEBjb21tYW5kVGV4dCA9IEBjb21tYW5kVGV4dC5yZXBsYWNlKFwiICN7c3lub255bX0gXCIsIFwiICN7Y2Fubm9uaWNhbFdvcmR9IFwiKVxuXG4gICAgICAgIEBjb21tYW5kVGV4dCA9IEBjb21tYW5kVGV4dC50cmltKClcblxuICAgICAgICBAY29tbWFuZFdvcmRzID0gQGNvbW1hbmRUZXh0LnNwbGl0KCcgJylcblxuICAgICAgICBpZiAndGFrZScgaW4gQGNvbW1hbmRXb3Jkc1xuICAgICAgICAgICAgZm9yIHdvcmQgaW4gQGNvbW1hbmRXb3Jkc1xuICAgICAgICAgICAgICAgIGlmIEBoYXNJdGVtKHdvcmQpXG4gICAgICAgICAgICAgICAgICAgIEBwcmludChAYWxyZWFkeUdvdHRlbk1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIEByb29tc1tAY3VycmVudFJvb21OYW1lXSgpXG4gICAgICAgIEBhZnRlckNvbW1hbmQoKVxuXG4gICAgc2V0VW5pdmVyc2FsQ29tbWFuZHM6IChjYWxsYmFjaykgLT5cbiAgICAgICAgQHVuaXZlcnNhbENvbW1hbmRzID0gY2FsbGJhY2suYmluZChAKVxuXG4gICAgdHJ5VW5pdmVyc2FsQ29tbWFuZHM6IC0+XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBleGFjdGx5TWF0Y2hlczogKHBhdHRlcm4pIC0+XG4gICAgICAgIEBjb21tYW5kVGV4dCA9PSBwYXR0ZXJuXG5cbiAgICBtYXRjaGVzOiAocGF0dGVybikgLT5cbiAgICAgICAgIyBJZiBlYWNoIHdvcmQgaW4gdGhlIHNwZWMgY29tbWFuZCBpcyBmb3VuZFxuICAgICAgICAjIGFueXdoZXJlIGluIHRoZSB1c2VyJ3MgaW5wdXQgaXQncyBhIG1hdGNoLFxuICAgICAgICAjIGluY2x1ZGluZyBzdWJzdHJpbmdzIG9mIHdvcmRzXG4gICAgICAgIHBhdHRlcm5Xb3JkcyA9IHBhdHRlcm4uc3BsaXQoJyAnKVxuICAgICAgICBmb3IgcGF0dGVybldvcmQgaW4gcGF0dGVybldvcmRzXG4gICAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgICBmb3IgY29tbWFuZFdvcmQgaW4gQGNvbW1hbmRXb3Jkc1xuICAgICAgICAgICAgICAgIGlmIHBhdHRlcm5Xb3JkLnN0YXJ0c1dpdGgoY29tbWFuZFdvcmQpIGFuZCAoY29tbWFuZFdvcmQubGVuZ3RoID49IDQgb3IgcGF0dGVybldvcmQubGVuZ3RoIDw9IDQpXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICAgICAgaWYgbm90IGZvdW5kXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiB0cnVlXG5cbiAgICBoYXNJdGVtOiAoaXRlbSkgLT4gaXRlbSBvZiBAaW52ZW50b3J5XG4gICAgdXNlZEl0ZW06IChpdGVtKSAtPiBpdGVtIG9mIEBpbnZlbnRvcnkgYW5kIEBpbnZlbnRvcnlbaXRlbV0gPT0gJ3VzZWQnXG5cbiAgICBwZXJjZW50Q2hhbmNlOiAoY2hhbmNlKSAtPiBNYXRoLnJhbmRvbSgpIDwgY2hhbmNlIC8gMTAwXG5cbiAgICBmbGFnSXM6IChmbGFnTmFtZSwgdmFsdWUpIC0+IEBmbGFnc1tmbGFnTmFtZV0gPT0gdmFsdWVcblxuICAgIGlzRmlyc3RUaW1lRW50ZXJpbmc6IC0+IEByb29tc0VudGVyZWRbQGN1cnJlbnRSb29tTmFtZV0gPT0gMVxuXG4gICAgY29taW5nRnJvbTogKHJvb21zKSAtPiBAbGFzdFJvb20gaW4gcm9vbXNcblxuICAgIHByaW50OiAodGV4dCkgLT5cbiAgICAgICAgQG1lc3NhZ2UgPSB0ZXh0XG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgZ29Ub1Jvb206IChyb29tTmFtZSkgLT5cbiAgICAgICAgQGxhc3RSb29tID0gQGN1cnJlbnRSb29tTmFtZVxuICAgICAgICBAY3VycmVudFJvb21OYW1lID0gcm9vbU5hbWVcbiAgICAgICAgaWYgcm9vbU5hbWUgb2YgQHJvb21zRW50ZXJlZFxuICAgICAgICAgICAgQHJvb21zRW50ZXJlZFtyb29tTmFtZV0rK1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAcm9vbXNFbnRlcmVkW3Jvb21OYW1lXSA9IDFcbiAgICAgICAgQGRvQ29tbWFuZCgnX19lbnRlcl9yb29tX18nKVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdvVG9TdGFydDogLT5cbiAgICAgICAgQGdvVG9Sb29tKEBzdGFydFJvb20pXG5cbiAgICBzZXRGbGFnOiAoZmxhZ05hbWUsIHZhbHVlKSAtPlxuICAgICAgICBAZmxhZ3NbZmxhZ05hbWVdID0gdmFsdWVcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICBnZXRJdGVtOiAoaXRlbSkgLT5cbiAgICAgICAgQGludmVudG9yeVtpdGVtXSA9ICdnb3R0ZW4nXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgcmVtb3ZlSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIGRlbGV0ZSBAaW52ZW50b3J5W2l0ZW1dXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgdXNlSXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIEBpbnZlbnRvcnlbaXRlbV0gPSAndXNlZCdcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICB3YWl0OiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEBtZXNzYWdlICs9ICcgPHN0cm9uZz4oSGl0IEVudGVyKTwvc3Ryb25nPidcbiAgICAgICAgQHdhaXRDYWxsYmFjayA9IGNhbGxiYWNrXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgbGlzdGVuOiAoY2FsbGJhY2spIC0+IEBjYWxsYmFja3MucHVzaChjYWxsYmFjaylcblxuICAgIG5vdGlmeTogLT4gY2FsbGJhY2soKSBmb3IgY2FsbGJhY2sgaW4gQGNhbGxiYWNrc1xuIiwibSA9IHJlcXVpcmUoJ21pdGhyaWwnKVxuZW5naW5lID0gbmV3KHJlcXVpcmUoJy4vZW5naW5lJykpKClcbnZpZXcgPSByZXF1aXJlKCdhcHAvdmlldycpKGVuZ2luZSlcblxuXG5tLm1vdW50KGRvY3VtZW50LmJvZHksIHZpZXcpXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gICAgbG9vazogW1xuICAgICAgICAnc2VlJ1xuICAgICAgICAnYWRtaXJlJ1xuICAgICAgICAnYmVob2xkJ1xuICAgICAgICAnZ2F3aydcbiAgICAgICAgJ29ic2VydmUnXG4gICAgICAgICdzcHknXG4gICAgICAgICdjaGVjaydcbiAgICBdXG4gICAgdGFrZTogW1xuICAgICAgICAncGljayB1cCdcbiAgICAgICAgJ2dldCdcbiAgICAgICAgJ2FjcXVpcmUnXG4gICAgICAgICdncmFiJ1xuICAgICAgICAnZ3Jhc3AnXG4gICAgICAgICdvYnRhaW4nXG4gICAgICAgICdidXknXG4gICAgICAgICdjaG9vc2UnXG4gICAgXVxuICAgIGdvOiBbXG4gICAgICAgICd3YWxrJ1xuICAgICAgICAncGVyYW1idWxhdGUnXG4gICAgICAgICdtb3ZlJ1xuICAgICAgICAndHJhdmVsJ1xuICAgICAgICAnam91cm5leSdcbiAgICAgICAgJ21vc2V5J1xuICAgIF1cbiAgICBnaXZlOiBbXG4gICAgICAgICdkZWxpdmVyJ1xuICAgICAgICAnZG9uYXRlJ1xuICAgICAgICAnaGFuZCBvdmVyJ1xuICAgICAgICAncHJlc2VudCdcbiAgICAgICAgJ2VuZG93J1xuICAgICAgICAnYmVxdWVhdGgnXG4gICAgICAgICdiZXN0b3cnXG4gICAgICAgICdyZWxpbnF1aXNoJ1xuICAgIF1cbiAgICBnYXJkZW46IFtcbiAgICAgICAgJ3Bsb3QnXG4gICAgICAgICdwbGFudHMnXG4gICAgICAgICdwcm9kdWNlJ1xuICAgIF1cbiAgICBmbG93ZXI6IFtcbiAgICAgICAgJ2Zsb3VyJ1xuICAgIF1cbiAgICBzb2RhOiBbXG4gICAgICAgICdwb3AnXG4gICAgXVxuICAgIG1hcmdhcmluZTogW1xuICAgICAgICAnYnV0dGVyJ1xuICAgIF1cbiAgICBzdGlyOiBbXG4gICAgICAgICd3aGlwJ1xuICAgICAgICAncHVsc2UnXG4gICAgICAgICd2aWJyYXRlJ1xuICAgICAgICAnbWl4J1xuICAgICAgICAnYmxlbmQnXG4gICAgICAgICdhZ2l0YXRlJ1xuICAgICAgICAnY2h1cm4nXG4gICAgICAgICdiZWF0J1xuICAgIF1cbiAgICBhdHRhY2s6IFtcbiAgICAgICAgJ2ZpZ2h0J1xuICAgICAgICAncHVuY2gnXG4gICAgICAgICdiaXRlJ1xuICAgICAgICAnaW50ZXJ2ZW5lJ1xuICAgIF1cbiAgICBiYWRnZTogW1xuICAgICAgICAnc2hlcmlmZidcbiAgICAgICAgJ3N0aWNrZXInXG4gICAgXVxuICAgIGVudGVyOiBbXG4gICAgICAgICdpbidcbiAgICAgICAgJ2luc2lkZSdcbiAgICBdXG4gICAgZXhpdDogW1xuICAgICAgICAnbGVhdmUnXG4gICAgICAgICdvdXQnXG4gICAgICAgICdvdXRzaWRlJ1xuICAgICAgICAnd2l0aGRyYXcnXG4gICAgICAgICdmbGVlJ1xuICAgICAgICAnZGVwYXJ0J1xuICAgICAgICAnZGVjYW1wJ1xuICAgIF1cbiIsIm0gPSByZXF1aXJlKCdtaXRocmlsJylcbldhbGVWc1NoYXJjID0gcmVxdWlyZSgnYXBwL3dhbGV2c3NoYXJjJylcblxuXG5TdHJpbmcucHJvdG90eXBlLmNhcGl0YWxpemUgPSAtPlxuICAgIEBbMF0udG9VcHBlckNhc2UoKSArIEBbMS4uXVxuXG5cbklURU1fTkFNRVMgPSB7XG4gICAgZWdnOiAnRWdnJ1xuICAgIGN1dHRsZWZpc2g6ICdDdXR0bGVmaXNoJ1xuICAgIGZsb3dlcnM6ICdGbG93ZXJzJ1xuICAgIHNvZGE6ICdCYWtpbmcgU29kYSdcbiAgICBwYW5jYWtlczogJ1BhbmNha2VzJ1xuICAgIHN5cnVwOiAnTWFwbGUgU3lydXAnXG4gICAgbWFyZ2FyaW5lOiAnTWFyZ2FyaW5lJ1xuICAgIHVtYnJlbGxhOiAnVW1icmVsbGEnXG4gICAgYmFkZ2U6ICdCYWRnZSBTdGlja2VyJ1xuICAgIG1pbGs6ICdNYW5hdGVlIE1pbGsnXG4gICAgJ3JlZCBoZXJyaW5nJzogJ1JlZCBIZXJyaW5nJ1xuICAgICdjb3dib3kgaGF0JzogJ0Nvd2JveSBIYXQnXG4gICAgJ3JhaW5ib3cgd2lnJzogJ1JhaW5ib3cgV2lnJ1xuICAgICdtb3RvcmN5Y2xlIGhlbG1ldCc6ICdNb3RvcmN5Y2xlIEhlbG1ldCdcbiAgICAnc3RvdmVwaXBlIGhhdCc6ICdTdG92ZXBpcGUgSGF0J1xuICAgICdsZWF0aGVyIGphY2tldCc6ICdMZWF0aGVyIEphY2tldCdcbiAgICAnY2xvd24gc3VpdCc6ICdDbG93biBTdWl0J1xuICAgICdvbGR0aW1leSBzdWl0JzogJ09sZC1UaW1leSBTdWl0J1xuICAgICdjb3cgcHJpbnQgdmVzdCc6ICdDb3cgUHJpbnQgVmVzdCdcbiAgICAnZmFrZSBiZWFyZCc6ICdGYWtlIEJlYXJkJ1xuICAgICdndW4gYmVsdCc6ICdHdW4gQmVsdCdcbiAgICAnbWV0YWwgY2hhaW4nOiAnTWV0YWwgQ2hhaW4nXG4gICAgJ3J1YmJlciBjaGlja2VuJzogJ1J1YmJlciBDaGlja2VuJ1xuICAgICdxdWFkcmF0aWMgZXllJzogJ1F1YWRyYXRpYyBFeWUnXG59XG5cblxuY2xhc3MgVGV4dFR5cGVyXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIEBjdXJyZW50TWVzc2FnZSA9ICcnXG4gICAgICAgIEBpID0gMFxuXG4gICAgdHlwZUxvb3A6ID0+XG4gICAgICAgIEBpKytcbiAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICBpZiBub3QgQGlzRG9uZSgpXG4gICAgICAgICAgICBzZXRUaW1lb3V0KEB0eXBlTG9vcCwgNilcblxuICAgIHNldE1lc3NhZ2U6IChtZXNzYWdlKSAtPlxuICAgICAgICBAY3VycmVudE1lc3NhZ2UgPSBtZXNzYWdlXG4gICAgICAgIEBpID0gMFxuICAgICAgICBzZXRUaW1lb3V0KEB0eXBlTG9vcCwgNilcblxuICAgIHNob3dBbGw6IC0+XG4gICAgICAgIEBpID0gQGN1cnJlbnRNZXNzYWdlLmxlbmd0aCAtIDFcblxuICAgIGdldFRleHRTb0ZhcjogLT5cbiAgICAgICAgQGN1cnJlbnRNZXNzYWdlWy4uQGldXG5cbiAgICBpc0RvbmU6IC0+XG4gICAgICAgIEBpID49IEBjdXJyZW50TWVzc2FnZS5sZW5ndGggLSAxXG4gICAgXG5cbm1vZHVsZS5leHBvcnRzID0gKGVuZ2luZSkgLT5cbiAgICBjb250cm9sbGVyOiBjbGFzc1xuICAgICAgICBjb25zdHJ1Y3RvcjogLT5cblxuICAgICAgICAgICAgV2FsZVZzU2hhcmMoZW5naW5lKVxuICAgICAgICAgICAgZGlkTG9hZCA9IGVuZ2luZS5sb2FkKClcblxuICAgICAgICAgICAgQHZtID0ge31cbiAgICAgICAgICAgIEB2bS5jb21tYW5kID0gbS5wcm9wKCcnKVxuICAgICAgICAgICAgQHZtLnR5cGVyID0gbmV3IFRleHRUeXBlcigpXG5cbiAgICAgICAgICAgIGVuZ2luZS5saXN0ZW4gPT5cbiAgICAgICAgICAgICAgICBAdm0udHlwZXIuc2V0TWVzc2FnZShlbmdpbmUuZ2V0Q3VycmVudE1lc3NhZ2UoKSlcbiAgICAgICAgICAgICAgICBtLnJlZHJhdygpXG4gICAgICAgICAgICAgICAgZW5naW5lLnNhdmUoKVxuXG4gICAgICAgICAgICBpZiBkaWRMb2FkXG4gICAgICAgICAgICAgICAgZW5naW5lLmRvQ29tbWFuZCgnbG9vaycpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZW5naW5lLmdvVG9TdGFydCgpXG5cbiAgICAgICAgb25Db21tYW5kU3VibWl0OiAoZSkgPT5cbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgaWYgQHZtLnR5cGVyLmlzRG9uZSgpXG4gICAgICAgICAgICAgICAgZW5naW5lLmRvQ29tbWFuZChAdm0uY29tbWFuZCgpKVxuICAgICAgICAgICAgICAgIEB2bS5jb21tYW5kKCcnKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEB2bS50eXBlci5zaG93QWxsKClcblxuICAgICAgICBoYW5kbGVCdXR0b246IChjb21tYW5kVGV4dCkgPT5cbiAgICAgICAgICAgIEB2bS5jb21tYW5kKGNvbW1hbmRUZXh0KVxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbW1hbmQtaW5wdXQnKS5mb2N1cygpXG5cblxuICAgIHZpZXc6IChjdHJsKSAtPlxuICAgICAgICBbXG4gICAgICAgICAgICBtICcuc2lkZWJhcicsXG4gICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0ICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzI2MHB4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMjBweCdcbiAgICAgICAgICAgICAgICBtICdoMicsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAwXG4gICAgICAgICAgICAgICAgICAgICdJbnZlbnRvcnknXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICBmb3IgaXRlbSwgc3RhdGUgb2YgZW5naW5lLmdldEludmVudG9yeSgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzdGF0ZSA9PSAnZ290dGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJVEVNX05BTUVTW2l0ZW1dXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHN0YXRlID09ICd1c2VkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbGluZS10aHJvdWdoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJVEVNX05BTUVTW2l0ZW1dXG4gICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZXN0YXJ0IHRoZSBnYW1lPyBUaGlzIHdpbGwgY2xlYXIgYWxsIHByb2dyZXNzIGFuZCBpdGVtcyB5b3UgaGF2ZSBhY2hpZXZlZCBzbyBmYXIuJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ1NhdmUgZ2FtZSBkZWxldGVkJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1Jlc3RhcnQgZ2FtZSdcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgbSAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgb25jbGljazogKGUpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncHJvZ3Jlc3MnLCBKU09OLnN0cmluZ2lmeSh7XCJpbnZlbnRvcnlcIjp7XCJiYWRnZVwiOlwiZ290dGVuXCIsXCJwYW5jYWtlc1wiOlwiZ290dGVuXCJ9LFwiY3VycmVudFJvb21OYW1lXCI6XCJTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pXCIsXCJwcmV2aW91c0NvbW1hbmRzXCI6W1wiX19lbnRlcl9yb29tX19cIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibm9ydGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ0YWxrIHdhbGVcIixcImxvb2tcIixcImVhc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ0YWxrIGJpbGx5XCIsXCJkcml2ZSBjYXJcIixcImxvb2tcIixcIm5vcnRoXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibm9ydGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJtYWtlIGNvc3R1bWVcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJjb3dib3kgaGF0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwib2xkdGltZXkgc3VpdFwiLFwiX19lbnRlcl9yb29tX19cIixcIm1ldGFsIGNoYWluXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibG9vayBtZXRhbCBjaGFpblwiLFwibG9vayBvbGQtdGltZXkgc3VpdFwiLFwibG9vayBvbGQtdGltZXkgc3VpdFwiLFwibG9vayBjb3dib3kgaGF0XCIsXCJsb29rIG9sZCB0aW1leSBzdWl0XCIsXCJsb29rIG9sZHRpbWV5IHN1aXRcIixcImdvIG5vcnRoXCIsXCJzb3V0aFwiLFwiZWFzdFwiLFwid2VzdFwiLFwiX19lbnRlcl9yb29tX19cIixcImVhc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ0YWxrIG1hbmFnZXJcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJubyBzZWFsXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwidGFsayBtYW5hZ2VyXCIsXCJzb3V0aFwiLFwiZWFzdFwiLFwid2VzdFwiLFwiX19lbnRlcl9yb29tX19cIixcIm5vcnRoXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibWFrZSBjb3N0dW1lXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwicmFpbmJvdyB3aWdcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJjb3cgcHJpbnQgdmVzdFwiLFwiX19lbnRlcl9yb29tX19cIixcImZha2UgYmVhcmRcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJsb29rIHJhaW5ib3cgd2lnXCIsXCJsb29rIGNvdyBwcmluIHZlc3RcIixcImxvb2sgY293IHByaW50IHZlc3RcIixcImxvb2sgZmFrZSBiZWFyZFwiLFwic291dGhcIixcIndlc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJub3J0aFwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcIndlc3RcIixcIm1ha2UgY29zdHVtZVwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcImdvIHdlc3RcIixcInJhaW5ib3cgd2lnaFwiLFwicmFpbmJvdyB3aWdcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ2ZXN0XCIsXCJjb3dwcmludCB2ZXN0XCIsXCJjb3cgcHJpbnQgdmVzdFwiLFwiX19lbnRlcl9yb29tX19cIixcImZha2UgYmVhcmRcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ0YWxrIG1hbmFnZXJcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJsb29rIGJyaWVmY2FzZVwiLFwic2VhbFwiLFwibG9va1wiLFwic2VhbFwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwic291dGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZ2V0IGN1ZGRsZWZpc2hcIixcImdldCBjdXR0bGVmaXNoXCIsXCJsb29rIGN1dHRsZWZpc2hcIixcIm5vcnRoXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibm9ydGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJlYXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZ2V0IGJhZGdlXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibG9va1wiLFwibm9ydGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJnZXQgdW1icmVsbGFcIixcIm5vcnRoXCIsXCJsb29rXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwidGFsayBmaXNoXCIsXCJsb29rXCIsXCJlYXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwic291aHRcIixcInNvdXRoXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwieWVzXCIsXCJzb3VodFwiLFwic291dGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZ2V0IGZsb3dlcnNcIixcImdpdmUgdW1icmVsbGFcIixcImdldCBmbG93ZXJzXCIsXCJsb29rXCIsXCJlYXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwic291dGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJlYXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZWFzdFwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwid2VzdFwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwid2VzdFwiLFwiZ2V0IHNvZGFcIixcImxvb2sgZm91bnRhaW5cIixcImdldCBzcHJpdHpcIixcImxvb2sgZm91bnRhaW5cIixcImxvb2sgbWFwbGUgc29kYVwiLFwiZ2V0IG1hcGxlIHNvZGFcIixcImVhc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJub3J0aFwiLFwiX19lbnRlcl9yb29tX19cIixcImxvb2sgb3ZlblwiLFwic291dGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJub3J0aFwiLFwiX19lbnRlcl9yb29tX19cIixcIm1ha2UgcGFuY2FrZXNcIixcImdldCBiYWtpbmcgc29kYVwiLFwibWFrZSBwYW5jYWtlc1wiLFwiX19lbnRlcl9yb29tX19cIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJiYWtpbmcgc29kYVwiLFwiZmxvd2VyXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZWdnXCIsXCJtaWxrXCIsXCJtYXJnYXJpbmVcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJzdGlyXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiX19lbnRlcl9yb29tX19cIixcInN5cnVwXCIsXCJfX2VudGVyX3Jvb21fX1wiXSxcImZsYWdzXCI6e1widGFsa2VkX3RvX3dhbGVcIjp0cnVlLFwiZHJvdmVfYmlsbHlfdG9faG9zcGl0YWxcIjp0cnVlLFwiZ2l2ZW5fdW1icmVsbGFcIjp0cnVlLFwiaGF2ZV9hbGxfaXRlbXNcIjp0cnVlfSxcInJvb21zRW50ZXJlZFwiOntcIldhbGUgdnMgU2hhcmM6IFRoZSBDb21pYzogVGhlIEludGVyYWN0aXZlIFNvZnR3YXJlIFRpdGxlIEZvciBZb3VyIENvbXB1dGVyIEJveFwiOjEsXCJIb3cgVG8gUGxheVwiOjEsXCJPY2VhblwiOjEsXCJXYWxlXCI6NCxcIkJpbGx5IE9jZWFuXCI6MixcIlNlYWwgb3IgTm8gU2VhbFwiOjUsXCJTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20pXCI6MyxcIlNlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgSGVhZGdlYXIpXCI6MyxcIlNlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcylcIjozLFwiU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBBY2Nlc3NvcnkpXCI6MyxcIlNlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKVwiOjYsXCJTZWFsIG9yIE5vIFNlYWwgKE9uIFN0YWdlISlcIjoyLFwiV2V0dGVyIE9jZWFuXCI6MSxcIkN1dHRsZWZpc2hcIjozLFwiQWNodGlwdXMncyBHYXJkZW5cIjozLFwiV2F0ZXIgV29ybGRcIjozLFwiV2F0ZXIgV29ybGQgKEdpZnQgU2hvcClcIjoxLFwiV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdClcIjoyLFwiV2F0ZXIgV29ybGQgKE1lY2hhbmljYWwgUm9vbSBUeXBlIFBsYWNlKVwiOjEsXCJBY2h0aXB1cydzIEdhcmRlbiAoSW5zaWRlKVwiOjEsXCJTdGVhayBhbmQgU2hha2VcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KVwiOjMsXCJTdGVhayBhbmQgU2hha2UgKFNvZGEgRm91bnRhaW4pXCI6MSxcIlN0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbilcIjozLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbilcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGFuIGVtcHR5IGJvd2wgc2l0dGluZyB0aGVyZSlcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpXCI6MSxcIlN0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSlcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgbWl4ZWQgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSlcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIHBsYXRlIG9mIGRyeSBwYW5jYWtlcyBzaXR0aW5nIHRoZXJlKVwiOjF9fSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcnXG4gICAgICAgICAgICAgICAgICAgICdMb2FkIEdhbWUnXG4gICAgICAgICAgICAgICAgbSAndGV4dGFyZWEnLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzMwMHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAnMTBweCdcbiAgICAgICAgICAgICAgICAgICAgbS50cnVzdChlbmdpbmUucHJldmlvdXNDb21tYW5kcy5qb2luKCdcXG4nKSlcblxuICAgICAgICAgICAgICAgIG0gJ3RleHRhcmVhJyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczMDBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJSdcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblRvcDogJzEwcHgnXG4gICAgICAgICAgICAgICAgICAgIG0udHJ1c3QobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Byb2dyZXNzJykpXG5cbiAgICAgICAgICAgIG0gJy5jb250ZW50JyxcbiAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICh3aW5kb3cuaW5uZXJXaWR0aCAtIDM2MCkgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcyMHB4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nVG9wOiAwXG4gICAgICAgICAgICAgICAgbSAnaDEnLCBlbmdpbmUuZ2V0Q3VycmVudFJvb21OYW1lKClcbiAgICAgICAgICAgICAgICBtICdwJywgbS50cnVzdChjdHJsLnZtLnR5cGVyLmdldFRleHRTb0ZhcigpKVxuXG4gICAgICAgICAgICAgICAgaWYgZW5naW5lLmdldEN1cnJlbnRSb29tTmFtZSgpID09ICdFbmQnXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2RpdicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2ltZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJy9zaGFyay1zaG93ZXJpbmcucG5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnInXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdicidcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2gzJywgJ0RvIHlvdSBldmVuIGZlZWRiYWNrPydcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2RpdicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAnaWZyYW1lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZm9ybXMvZC8xZHJIS3NmRXpTX3pBMTdZVGQ3T2FXWWlzMVE4SmpmMzNmcjdLNk9jUkJvay92aWV3Zm9ybT9lbWJlZGRlZD10cnVlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzc2MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnNTAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZWJvcmRlcjogJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbmhlaWdodDogJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbndpZHRoOiAnMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMnB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIGdyZXknXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzIwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdMb2FkaW5nLi4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3RleHRhcmVhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICc1MDBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS50cnVzdChlbmdpbmUucHJldmlvdXNDb21tYW5kcy5qb2luKCdcXG4nKSlcbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbSAnZm9ybScsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbnN1Ym1pdDogY3RybC5vbkNvbW1hbmRTdWJtaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2lucHV0W3R5cGU9dGV4dF1baWQ9Y29tbWFuZC1pbnB1dF0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jaGFuZ2U6IG0ud2l0aEF0dHIoJ3ZhbHVlJywgY3RybC52bS5jb21tYW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjdHJsLnZtLmNvbW1hbmQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzogKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBpc0luaXRpYWxpemVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmZvY3VzKClcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvblt0eXBlPXN1Ym1pdF0nLCAnRG8nXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdidXR0b25bdHlwZT1idXR0b25dJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAoZSkgLT4gY3RybC5oYW5kbGVCdXR0b24oJ2dvIG5vcnRoJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZ28gbm9ydGgnXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdidXR0b25bdHlwZT1idXR0b25dJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAoZSkgLT4gY3RybC5oYW5kbGVCdXR0b24oJ2dvIHNvdXRoJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZ28gc291dGgnXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdidXR0b25bdHlwZT1idXR0b25dJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAoZSkgLT4gY3RybC5oYW5kbGVCdXR0b24oJ2dvIGVhc3QnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdnbyBlYXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uW3R5cGU9YnV0dG9uXScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljazogKGUpIC0+IGN0cmwuaGFuZGxlQnV0dG9uKCdnbyB3ZXN0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZ28gd2VzdCdcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvblt0eXBlPWJ1dHRvbl0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2xpY2s6IChlKSAtPiBjdHJsLmhhbmRsZUJ1dHRvbignZ2V0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZ2V0J1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uW3R5cGU9YnV0dG9uXScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljazogKGUpIC0+IGN0cmwuaGFuZGxlQnV0dG9uKCd0YWxrJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGFsaydcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvblt0eXBlPWJ1dHRvbl0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2xpY2s6IChlKSAtPiBjdHJsLmhhbmRsZUJ1dHRvbigndXNlJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndXNlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uW3R5cGU9YnV0dG9uXScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljazogKGUpIC0+IGN0cmwuaGFuZGxlQnV0dG9uKCdsb29rJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbG9vaydcbiAgICAgICAgXVxuIiwiXCJcIlwiXG5Db25kaXRpb25zOlxuICAgIEBtYXRjaGVzKHBhdHRlcm4pXG4gICAgQGhhc0l0ZW0oaXRlbSBuYW1lKVxuICAgIEBwZXJjZW50Q2hhbmNlKGNoYW5jZSBvdXQgb2YgMTAwKVxuICAgIEBmbGFnSXMoZmxhZyBuYW1lLCB2YWx1ZSlcblxuUmVzdWx0czpcbiAgICBAcHJpbnQodGV4dClcbiAgICBAZ29Ub1Jvb20ocm9vbSBuYW1lKVxuICAgIEBzZXRGbGFnKGZsYWcgbmFtZSwgdmFsdWUpXG5cIlwiXCJcblxuXG5tb2R1bGUuZXhwb3J0cyA9IChlbmdpbmUpIC0+XG4gICAgaGVscFRleHQgPSBcIlwiXCJcbkFkdmFuY2UgdGhyb3VnaCB0aGUgZ2FtZSBieSB0eXBpbmcgY29tbWFuZHMgbGlrZSA8c3Ryb25nPmxvb2ssIGdldCwgYW5kIGdvLjwvc3Ryb25nPjxicj5cbkNvbW1hbmRzIGNhdGFsb2d1ZSBhbmQvb3IgcHJlIHNldCBjb21tYW5kIHByZWZpeCBidXR0b25zOiA8c3Ryb25nPkdvLCB0YWxrLCBnZXQsIGxvb2ssIHVzZS4uLjwvc3Ryb25nPjxicj5cbkxvb2sgaW4gYW4gYXJlYSB0byBnYWluIG1vcmUgaW5mb3JtYXRpb24gb3IgbG9vayBhdCBvYmplY3RzOiA8c3Ryb25nPihsb29rIGZpc2gpPC9zdHJvbmc+PGJyPlxuTW92ZSBieSB0eXBpbmcgZ28gY29tbWFuZHM6IDxzdHJvbmc+KGdvIGVhc3QpPC9zdHJvbmc+PGJyPlxuRW5nYWdlIGluIHBoaWxvc29waGljYWwgZGViYXRlOiA8c3Ryb25nPih0YWxrIHNvcmNlcmVzcyk8L3N0cm9uZz48YnI+XG5Vc2UgaXRlbXMgaW4gaW52ZW50b3J5OiA8c3Ryb25nPih1c2UgbGlnaHRzYWJlcik8L3N0cm9uZz48YnI+XG5UaGVyZSBhcmUgb3RoZXIgY29tbWFuZHMgdG9vIGFuZCBzb21lIHlvdSBjYW4ganVzdCBjbGljayBvbiBhIGJ1dHRvbiB0byB1c2UuIEV4cGVyaW1lbnQgYW5kIHRyeSB0aGluZ3MgaW4gdGhpcyBiZWF1dGlmdWwgbmV3IHdvcmxkIGJlZm9yZSB5b3UuPGJyPlxuVHlwZSA8c3Ryb25nPlwiaGVscFwiPC9zdHJvbmc+IHRvIHNlZSB0aGlzIG1lbnUgYWdhaW48YnI+XG5cIlwiXCJcblxuICAgIGVuZ2luZS5zZXRBbHJlYWR5R290dGVuTWVzc2FnZSgnV2hhdCBhcmUgeW91IGNyYXp5LCB3aHkgd291bGQgeW91IG5lZWQgbW9yZS9hbm90aGVyIG9mIHRoYXQvdGhvc2U/JylcblxuICAgIGVuZ2luZS5zZXRVbml2ZXJzYWxDb21tYW5kcyAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnZGllJylcbiAgICAgICAgICAgIEBwcmludCgnV2hhdCBhcmUgeW91IGRvaW5nPyBZb3UgYXJlIGRlYWQgbm93LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dldCB5ZSBmbGFzaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBjYW5cXCd0IGdldCB5ZSBmbGFzay4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3aW4nKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZGlkIGl0LiBZb3Ugd2luLiBCdXkgeW91cnNlbGYgYSBwaXp6YSBiZWNhdXNlIHlvdSBhcmUgc28gY2xldmVyLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2ludicpIG9yIEBtYXRjaGVzKCdpbnZlbnRvcnknKVxuICAgICAgICAgICAgaWYgT2JqZWN0LmtleXMoQGdldEludmVudG9yeSgpKS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgQHByaW50KCdJdCB0ZWxscyB5b3Ugd2hhdCBpcyBpbnZlbnRvcnkgcmlnaHQgb3ZlciB0aGVyZSBvbiB0aGUgcmlnaHQgc2lkZSBvZiB0aGUgc2NyZWVuLiBJcyB0eXBpbmcgdGhpcyBjb21tYW5kIHJlYWxseSBuZWNlc3Nhcnk/JylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdXIgaW52ZW50b3J5IGlzIGVtcHR5IHlvdSBiaWcgZHVtYiBidXR0LiBTb3JyeSwgdGhhdCB3YXMgcnVkZSBJIG1lYW50IHRvIHNheSwgXCJZb3UgYnV0dC5cIicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2hlbHAnKVxuICAgICAgICAgICAgQHByaW50KGhlbHBUZXh0KVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY3V0dGxlZmlzaCcpIGFuZCBAaGFzSXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBAcHJpbnQoJ0FzaWRlIGZyb20gYmVpbmcgcmVhbGx5IGZ1bm55IGxvb2tpbmcsIGhpZ2hseSBpbnRlbGxpZ2VudCBhbmQgaGlnaGx5IHVnbHksIGN1dHRsZWZpc2ggY2FuIGFsc28gcmVsZWFzZSBhbiBpbmsgbGlrZSBzdWJzdGFuY2UgdG8gZXNjYXBlIHByZWRhdG9ycy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZWdnJykgYW5kIEBoYXNJdGVtKCdlZ2cnKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIGxvb2tzIHRvIGJlIGFuIG9yZGluYXJ5IGVnZy4gQnV0IHJlbWVtYmVyLCBpdCB3YXMgcHVsbGVkIG91dCBvZiBCaWxseSBPY2VhblxcJ3MgZ2xvdmUgYm94LCBzbyBtYXliZSBub3Q/JylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGZsb3dlcnMnKSBhbmQgQGhhc0l0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgQHByaW50KCdUaGVzZSBhcmUgc29tZSB2ZXJzYXRpbGUgbG9va2luZyBmbG93ZXJzLiBTbyBtdWNoIHNvLCB5b3UgY2FuIHNlbnNlIGEgcHVuIGxpa2UgYXVyYSBzdXJyb3VuZGluZyB0aGVtLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayB1bWJyZWxsYScpIGFuZCBAaGFzSXRlbSgndW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIHVtYnJlbGxhIGNvdWxkIHByb3ZpZGUgYSBsb3Qgb2Ygc2hhZGUuIEkgZG9uXFwndCBzZWUgaG93IGl0IGNhbiBmaXQgaW4geW91ciBwb2NrZXRzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzb2RhJykgYW5kIEBoYXNJdGVtKCdzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIGEgY2FuIG9mIHNvZGEgeW91IGZvdW5kIGluIHRoZSBvdmVuIGF0IFN0ZWFrIGFuZCBTaGFrZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgc3lydXAnKSBhbmQgQGhhc0l0ZW0oJ3N5cnVwJylcbiAgICAgICAgICAgIEBwcmludCgnQSBiYWcgb2YgbWFwbGUgZmxhdm9yZWQgZm91bnRhaW4gc3lydXAuIEl0IGNvdWxkIGhhdmUgb3RoZXIgdXNlcyB0b28uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGhlcnJpbmcnKSBhbmQgQGhhc0l0ZW0oJ2hlcnJpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdJdCBpcyBhIGNhbiBvZiBwaWNrbGVkIGhlcnJpbmcgeW91IHdvbiBvbiBhIGdhbWVzaG93LiBXYXkgdG8gZ28uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHJlZCBoZXJyaW5nJykgYW5kIEBoYXNJdGVtKCdyZWQgaGVycmluZycpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0IGlzIGEgcmVkIGhlcnJpbmcuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1hcmdhcmluZScpIGFuZCBAaGFzSXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEBwcmludCgnTm8gSWZzLCBBbmRzIG9yIEJ1dHRlciB2YWd1ZWx5IG1hcmdhcmluZSBzcHJlYWQgdHlwZSBwcm9kdWN0LiBNb2RlbGVkIGJ5IExvdSBGZXJyaWduby4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgYmFkZ2UnKSBhbmQgQGhhc0l0ZW0oJ2JhZGdlJylcbiAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIHRoZSBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgYmFkZ2Ugc3RpY2tlciB5b3UgZ290IGF0IHRoZSBXYXRlciBXb3JsZCBnaWZ0IHNob3AuIEluIGEgcG9vcmx5IGxpdCByb29tLCBvbmUgbWlnaHQgbWlzdGFrZSB0aGlzIGZvciBhbiBhdXRoZW50aWMganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBwYW5jYWtlcycpIGFuZCBAaGFzSXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgQHByaW50KCdNeXN0aWNhbCBwYW5jYWtlcyB5b3UgbWFkZSB3aXRoIGFuIGVuY2hhbnRlZCByZWNpcGUgYW5kIHRvdGFsbHkgbm90IHRoZSBjb3JyZWN0IGluZ3JlZGllbnRzLCByZW1lbWJlcj8gVGhhdCB3YXMgVUgtbWF5LXppbmchIFRha2UgdGhlbSB0byBXYWxlIGFuZCBodXJyeS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgbWlsaycpIGFuZCBAaGFzSXRlbSgnbWlsaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1dob2xlIG1pbGssIGFwcGFyZW50bHkgZnJvbSBhIHJlYWwgc2VhIGNvdy4gSXMgaXQgc3RpbGwgb2theSB0byBjYWxsIHRoZW0gdGhhdD8nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgcXVhZHJhdGljIGV5ZScpIGFuZCBAaGFzSXRlbSgncXVhZHJhdGljIGV5ZScpXG4gICAgICAgICAgICBAcHJpbnQoJz8/PycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBjb3dib3kgaGF0JykgYW5kIEBoYXNJdGVtKCdjb3dib3kgaGF0JylcbiAgICAgICAgICAgIEBwcmludCgnTmljZSBoYXQsIHBpbGdyaW0uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHJhaW5ib3cgd2lnJykgYW5kIEBoYXNJdGVtKCdyYWluYm93IHdpZycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIHNob3VsZCBiZSBsYXdzIGFnYWluc3QgdGhpcyBraW5kIG9mIHRoaW5nLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBtb3RvcmN5Y2xlIGhlbG1ldCcpIGFuZCBAaGFzSXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICAgICAgQHByaW50KCdJdCBpcyB0aGUga2luZCB3aXRoIHRoZSBmdWxsIHZpc29yIHNvIHlvdSBjb3VsZCBqdXN0IGJlIHRoZSBzdHVudCBkb3VibGUuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHN0b3ZlcGlwZSBoYXQnKSBhbmQgQGhhc0l0ZW0oJ3N0b3ZlcGlwZSBoYXQnKVxuICAgICAgICAgICAgQHByaW50KCdGb3VyIHNjb3JlIGFuZCBzZXZlbiB5ZWFycyBhZ28uLi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgbGVhdGhlciBqYWNrZXQnKSBhbmQgQGhhc0l0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgICAgIEBwcmludCgnTWVtYmVycyBvbmx5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBjbG93bnN1aXQnKSBhbmQgQGhhc0l0ZW0oJ2Nsb3duc3VpdCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgc2hvdWxkIHNjYXJlIHRoZSBraWRzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBvbGQgdGltZXkgc3VpdCcpIGFuZCBAaGFzSXRlbSgnb2xkIHRpbWV5IHN1aXQnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZmVlbCBsaWtlIHNvbWUgc2VyaW91cyBmcmllZCBjaGlja2VuLCBhbmQgeW91IGRvbuKAmXQgZXZlbiBrbm93IHdoYXQgdGhhdCBpcy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY293cHJpbnQgdmVzdCcpIGFuZCBAaGFzSXRlbSgnY293cHJpbnQgdmVzdCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1ZlcnkgVG95IFN0b3J5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmYWtlIGJlYXJkJykgYW5kIEBoYXNJdGVtKCdmYWtlIGJlYXJkJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGZlZWwgbGlrZSBjb21wbGFpbmluZyBhYm91dCBraWRzIG9uIHlvdXIgbGF3biBhbmQgaG93IHlvdSBkb25cXCd0IGV2ZW4ga25vdyB3aGF0IGEgdHdpdHRlciBpcy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZ3VuIGJlbHQnKSBhbmQgQGhhc0l0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgICAgIEBwcmludCgnQSB0cnVzdHkgc2l4IHNob290ZXIuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1ldGFsIGNoYWluJykgYW5kIEBoYXNJdGVtKCdtZXRhbCBjaGFpbicpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgY2hhaW4gaXMgb25seSBhcyBzdHJvbmcgYXMtLSB3YWl0LCB3cm9uZyBzaG93LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBydWJiZXIgY2hpY2tlbicpIGFuZCBAaGFzSXRlbSgncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICAgICAgQHByaW50KCdTb3JyeSwgbm8gcHVsbGV5IGluIGl0LicpXG5cblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnSSBhbSBub3QgYXV0aG9yaXplZCB0byB0ZWxsIHlvdSBhYm91dCB0aGF0IHlldC4gU3RvcCB0cnlpbmcgdG8gY2hlYXQgbWFuIScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZScpXG4gICAgICAgICAgICBAcHJpbnQoJ0kgYW0gbm90IGF1dGhvcml6ZWQgdG8gZ2l2ZSB0aGF0IHRvIHlvdS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKVxuICAgICAgICAgICAgQHByaW50KCdXaG8gYXJlIHlvdSB0YWxraW5nIHRvPycpXG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgIyBQaWNrIGEgcmFuZG9tIGRlZmF1bHQgcmVzcG9uc2VcbiAgICAgICAgICAgIGRlZmF1bHRSZXNwb25zZXMgPSBbXG4gICAgICAgICAgICAgICAgJ1doYXQgYXJlIHlvdSBldmVuIHRyeWluZyB0byBkbz8gIEp1c3Qgc3RvcC4nXG4gICAgICAgICAgICAgICAgJ0dvb2Qgb25lIG1hbi4nXG4gICAgICAgICAgICAgICAgJ1dob2EgdGhlcmUgRWFnZXIgTWNCZWF2ZXIhJ1xuICAgICAgICAgICAgICAgICdEb25cXCd0IGRvIHRoYXQuJ1xuICAgICAgICAgICAgICAgICdHcm9zcywgbm8gd2F5LidcbiAgICAgICAgICAgIF1cbiAgICAgICAgICAgIEBwcmludChkZWZhdWx0UmVzcG9uc2VzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpkZWZhdWx0UmVzcG9uc2VzLmxlbmd0aCldKVxuXG4gICAgICAgIFxuICAgIGVuZ2luZS5zZXRBZnRlckNvbW1hbmQgLT5cbiAgICAgICAgaWYgKG5vdCBAZmxhZ0lzKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdlZ2cnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnZmxvd2VycycpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdzb2RhJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ3N5cnVwJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ21pbGsnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnbWFyZ2FyaW5lJykpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJXZWxsLCBJIHRoaW5rIEkgaGF2ZSBhbGwgdGhlIGluZ3JlZGllbnRzLFwiIHlvdSBzYXkgdG8geW91cnNlbGYuIFwiSSBqdXN0IG5lZWQgb25lIG9mIHRob3NlIHBsYWNlcyB3aGVyZSB5b3UgcHV0IHRoZW0gdG9nZXRoZXIgc28gaXQgdHVybnMgaW50byBzb21ldGhpbmcgeW91IGNhbiBlYXQuIFlvdSBrbm93LCBvbmUgb2YgdGhvc2UuLi5mb29kIHByZXBhcmluZyByb29tcy5cIicpXG4gICAgICAgICAgICAgICAgQHNldEZsYWcoJ2hhdmVfYWxsX2l0ZW1zJywgdHJ1ZSlcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhbGUgdnMgU2hhcmM6IFRoZSBDb21pYzogVGhlIEludGVyYWN0aXZlIFNvZnR3YXJlIFRpdGxlIEZvciBZb3VyIENvbXB1dGVyIEJveCcsIC0+XG4gICAgICAgIEBwcmludCgnVGhhbmsgeW91IGZvciBidXlpbmcgdGhpcyBnYW1lISAgVHlwZSB0aGluZ3MgaW4gdGhlIGJveCB0byBtYWtlIHRoaW5ncyBoYXBwZW4hJylcbiAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgIEBnb1RvUm9vbSgnSG93IFRvIFBsYXknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0hvdyBUbyBQbGF5JywgLT5cbiAgICAgICAgQHByaW50KGhlbHBUZXh0KVxuICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgQGdvVG9Sb29tKCdPY2VhbicpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnT2NlYW4nLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgYW5kIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgIEBwcmludCgnV2VsY29tZSB0byBXYWxlIHZzIFNoYXJjOiBUaGUgVmlkZW8gR2FtZS4gWW91IGFyZSBTaGFyYyBhbmQgeW91ciAkMjMgc2hhbXBvbyBpcyBtaXNzaW5nLiBZb3Ugc3VzcGVjdCBmb3VsIHBsYXkuIE9idmlvdXMgZXhpdHMgYXJlIE5vcnRoIHRvIHlvdXIgZnJpZW5kIFdhbGUuJylcbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBpcyBxdWl0ZSBwb3NzaWJseSB0aGUgbW9zdCB1bmludGVyZXN0aW5nIGN1YmUgb2Ygd2F0ZXIgaW4gdGhlIG9jZWFuLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYWxlJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdIZXksIGl0IGlzIHlvdXIgZnJpZW5kLCBXYWxlLiBIZSBpcyBkb2luZyB0aGF0IHRoaW5nIHdoZXJlIGhlIGhhcyBoaXMgZXllcyBjbG9zZWQgYW5kIGFjdHMgbGlrZSBoZSBkaWQgbm90IG5vdGljZSB5b3VyIGFycml2YWwuIEhlIGlzIGtpbmQgb2YgYSBwcmljaywgYnV0IGFsc28geW91ciBmcmllbmQuIFdoYXQgY2FuIHlvdSBkbz8gT2J2aW91cyBleGl0cyBhcmUgT2NlYW4gdG8gdGhlIHNvdXRoLCBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoIHRvIHRoZSB3ZXN0LCBtb3JlIE9jZWFuIHRvIHRoZSBub3J0aCwgYW5kIEJpbGx5IE9jZWFuIHRvIHRoZSBlYXN0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdXYWxlIGlzIHN0aWxsIGp1c3QgZmxvYXRpbmcgdGhlcmUgdHJ5aW5nIHRvIGJlIGVuaWdtYXRpYywgd291bGQgaGUgZXZlbiBub3RpY2UgaWYgeW91IHNhaWQgc29tZXRoaW5nPyBPYnZpb3VzIGV4aXRzIGFyZSBPY2VhbiB0byB0aGUgc291dGgsIGEgc2Nob29sIG9mIEN1dHRsZWZpc2ggdG8gdGhlIHdlc3QsIG1vcmUgT2NlYW4gdG8gdGhlIG5vcnRoLCBhbmQgQmlsbHkgT2NlYW4gdG8gdGhlIGVhc3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHdhbGUnKVxuICAgICAgICAgICAgQHByaW50KCdIZSBpcyBqdXN0IGZsb2F0aW5nIHRoZXJlLCBleWVzIGNsb3NlZCwgdHJ5aW5nIHRvIHNodXQgb3V0IHRoaXMgZWFydGhseSByZWFsbS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dpdmUgcGFuY2FrZXMnKVxuICAgICAgICAgICAgaWYgQGhhc0l0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSGV5IFdhbGUsXCIgeW91IGNhbGwgb3V0IGFzIGludHJ1c2l2ZWx5IGFzIHBvc3NpYmxlLCBcIkkgZ290IHlvdXItLVwiIEJlZm9yZSB5b3UgY291bGQgZmluaXNoIHlvdXIgc2VudGVuY2UsIHlvdXIgYmx1YmJlcnkgZnJpZW5kIGhhcyBzbmF0Y2hlZCB0aGUgcGxhdGUgYXdheSBhbmQsIGluIGEgbW9zdCB1bmRpZ25pZmllZCBtYW5uZXIsIGJlZ2lucyBtb3dpbmcgdGhyb3VnaCB0aGUgZnJpZWQgZGlzY3MgeW91IHNvIGFydGZ1bGx5IHByZXBhcmVkLiBcIlNvdWwgc2VhcmNoaW5nIHRha2VzIGEgbG90IG9mIGVuZXJneSxcIiBoZSBleHBsYWlucyBiZXR3ZWVuIGJpdGVzLiBcIkkgaGF2ZW5cXCd0IGVhdGVuIGFueXRoaW5nIGFsbCBkYXkuXCInKVxuICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnT25jZSBmaW5pc2hlZCwgV2FsZSBzdHJhaWdodGVucyBoaW1zZWxmIG91dCwgbG9va2luZyBhIG1pdGUgZW1iYXJyYXNzZWQgZm9yIHRoZSBzYXZhZ2UgZGlzcGxheSBoZSBqdXN0IHB1dCBvbi4gXCJXaGF0IHdhcyBpdCB5b3UgbmVlZGVkP1wiIFwiT2ggV2FsZSwgaXRcXCdzIHRlcnJpYmxlLiBJIHRoaW5rIG15ICQyMyBzaGFtcG9vIHdhcyBzdG9sZW4gYW5kIHRoZSBnaG9zdCBvZiBteSBub3QgcmVhbGx5IGRlYWQgZnJpZW5kIHNheXMgdGhlIGZhdGUgb2YgdGhlIHdvcmxkIGhhbmdzIGluIHRoZSBiYWxhbmNlLlwiJylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJJIHNlZSxcIiBzYXlzIFdhbGUsIGhpcyB2b2ljZSBhbmQgbWFubmVyIHJlbWFpbmluZyB1bmNoYW5nZWQgZGVzcGl0ZSB0aGUgdGhyZWF0IG9mIHRoZSB3b3JsZCB1bmJhbGFuY2luZy4gXCJTaGFyYywgSSBmZWFyIHRoZSB3b3JzdC4gWW91IG11c3Qgc3VtbW9uIHRoZSBldGhlcmVhbCBkb29yLlwiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk5vLCBXYWxlLFwiIHlvdSBzYXksIFwieW91IG1hZGUgbWUgc3dlYXIgYSB0aG91c2FuZCB2b3dzIG5ldmVyIHRvIGJyaW5nIHRoYXQgY3Vyc2VkIHJlbGljIGJhY2sgYW1vbmcgdXMuXCIgXCJJIGtub3cgd2hhdCBJIHNhaWQsIGJ1dCBJIGFsc28ga25ldyB0aGVyZSB3b3VsZCBjb21lIGEgdGltZSB3aGVuIHdlIHdvdWxkIGhhdmUgbm8gb3RoZXIgY2hvaWNlLlwiICBZb3Ugc2hvdWxkIHByb2JhYmx5IHN1bW1vbiB0aGUgZG9vci4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEByZW1vdmVJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNldEZsYWcoJ2dpdmVuX3BhbmNha2VzJywgdHJ1ZSlcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzdW1tb24gZG9vcicpIGFuZCBAZmxhZ0lzKCdnaXZlbl9wYW5jYWtlcycsIHRydWUpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSwgZmluYWxseSBjb252aW5jZWQgb2YgeW91ciB1cmdlbmN5IGFuZCB1dHRlciBkZXNwZXJhdGlvbiwgcGVyZm9ybSBzb21lIGludHJpY2F0ZSByaXRlcyBhbmQgaW5jYW50YXRpb25zIHRoYXQgd291bGQgYmUgcmVhbGx5IGNvb2wgaWYgeW91IGNvdWxkIHNlZSB0aGVtLCBidXQgSSBndWVzcyB5b3Ugd2lsbCBqdXN0IGhhdmUgdG8gdXNlIHlvdXIgaW1hZ2luYXRpb25zLiBUZXh0IG9ubHkgZm9vbHMhICBUaGUgZXRoZXJlYWwgZG9vciBzdGFuZHMgb3BlbiBiZWZvcmUgeW91LicpXG4gICAgICAgICAgICBAc2V0RmxhZygnc3VtbW9uZWRfZG9vcicsIHRydWUpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZW50ZXIgZG9vcicpIGFuZCBAZmxhZ0lzKCdzdW1tb25lZF9kb29yJywgdHJ1ZSlcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnVGhlIEV0aGVyZWFsIFJlYWxtJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrIHdhbGUnKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ3RhbGtlZF90b193YWxlJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1dhbGUgaXMgdHJ5aW5nIHRvIG1lZGl0YXRlIG9yIHNvbWV0aGluZyBwcmV0ZW50aW91cyB0aGF0IHlvdSBkb25cXCd0IGNhcmUgYWJvdXQuIFlvdSBoYXZlIHNvbWV0aGluZyBpbXBvcnRhbnQhIFwiV2FsZVwiIHlvdSBzaG91dCwgXCJJIG5lZWQgeW91ciBoZWxwISBUaGUgY29uZGl0aW9uIG9mIG15IG1hZ25pZmljZW50IHNjYWxwIGlzIGF0IHN0YWtlLlwiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1dhbGUgc2lnaHMgYSBoZWF2eSwgbGFib3JlZCBzaWdoLiBcIlNoYXJjLCB5b3UgaGF2ZSBkaXN0dXJiZWQgbXkgam91cm5leSB0byBteSBpbm5lcm1vc3QgYmVpbmcuIEJlZm9yZSBJIGNhbiBoZWxwIHlvdSwgcmVwYXJhdGlvbnMgbXVzdCBiZSBtYWRlLiBZb3UgbXVzdCBtYWtlIG1lIGEgaGVhbHRoeSBzZXJ2aW5nIG9mIHBhbmNha2VzOiB3aG9sZSB3aGVhdCwgd2l0aCBhbGwgbmF0dXJhbCBtYXBsZSBzeXJ1cC4gTm93IGxlYXZlIG1lIGFzIEkgcGVlbCBiYWNrIHRoZSBsYXllcnMgb2YgdGhlIHNlbGYgYW5kIHBvbmRlciB0aGUgbGVzc29uIG9mIHRoZSBjaGVycnkgYmxvc3NvbS4nKVxuICAgICAgICAgICAgICAgICAgICBAc2V0RmxhZygndGFsa2VkX3RvX3dhbGUnLCB0cnVlKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJJIGNhbiBub3QgbGlmdCBhIGZpbiBmb3IgeW91IHVudGlsIHlvdSBoYXZlIGJyb3VnaHQgYSBoZWFsdGh5IHNlcnZpbmcgb2Ygd2hvbGUgd2hlYXQgcGFuY2FrZXMgd2l0aCBhbGwgbmF0dXJhbCBtYXBsZSBzeXJ1cCBsaWtlIEkgc2FpZCBiZWZvcmUuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0JpbGx5IE9jZWFuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dldHRlciBPY2VhbicsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhpcyBpcyBqdXN0IHNvbWUgb2NlYW4geW91IGZvdW5kLiBJdCBkb2VzIGZlZWwgYSBsaXR0bGUgYml0IHdldHRlciB0aGFuIHRoZSByZXN0IG9mIHRoZSBvY2VhbiB0aG91Z2guIEFsc28sIGRpZCBpdCBqdXN0IGdldCB3YXJtZXI/IE9idmlvdXMgZXhpdHMgYXJlIGEgZ2FyZGVuIHRvIHRoZSB3ZXN0LCBXYWxlIGluIHRoZSBzb3V0aCwgYW5kIGEgZ2FtZXNob3cgZWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnSnVzdCBhbm90aGVyIHNvbGlkIDEwIGN1YmljIGZlZXQgb2Ygb2NlYW4uIE9idmlvdXMgZXhpdHMgYXJlIGEgZ2FyZGVuIHRvIHRoZSB3ZXN0LCBXYWxlIGluIHRoZSBzb3V0aCwgYW5kIGEgZ2FtZXNob3cgZWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdDdXR0bGVmaXNoJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnTG9vaywgdGhlcmUgYmUgc29tZSBjdXR0bGVmaXNoLCB0aG91Z2ggdGhleSBkbyBub3QgbG9vayB0b28gY3VkZGx5LiBTdGVhayBhbmQgU2hha2UgaXMgdG8gdGhlIHdlc3QsIEFjaHRpcHVzXFwncyBnYXJkZW4gdG8gdGhlIG5vcnRoLCBhbmQgV2FsZSB0byB0aGUgZWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhlcmUgdXNlZCB0byBiZSBjdXR0bGVmaXNoIGhlcmUgYnV0IHlvdSBzY2FyZWQgdGhlbSBhd2F5IHdpdGggeW91ciBhZ2dyZXNzaXZlIGFmZmVjdGlvbnMuIEtlZXAgdGhhdCBzdHVmZiBpbnNpZGUgbWFuISBTdGVhayBhbmQgU2hha2UgaXMgdG8gdGhlIHdlc3QsIEFjaHRpcHVzXFwncyBnYXJkZW4gdG8gdGhlIG5vcnRoLCBhbmQgV2FsZSB0byB0aGUgZWFzdC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjdWRkbGUgY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBmZWVsaW5nIGFmZmVjdGlvbmF0ZSB0b2RheSBhbmQgeW91IGp1c3QgZ290IGR1bXBlZCBzbyB3aHkgbm90PyBZb3UganVtcCBzb21lIG9mIHRoZSBjdXR0bGVmaXNoIGFuZCBzdGFydCBzbnVnZ2xpbmcgYW5kIGN1ZGRsaW5nLiBUaGUgY3V0dGxlZmlzaCBhcmUgbm90IGFtdXNlZCB0aG91Z2gsIGFuZCBzYXkgdGhleSBhcmUgdGlyZWQgb2YgZmlzaCBtYWtpbmcgdGhhdCBtaXN0YWtlLiBUaGV5IGFsbCBzd2ltIGF3YXkgZXhjZXB0IGZvciBvbmUgdGhhdCBoYXMgYXR0YWNoZWQgaXRzIHN1Y2tlcnMgdG8geW91ciBtaWQgcmVnaW9uLiBZb3UgZG9uXFwndCBzZWVtIHRvIG1pbmQuJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGV5IGFyZSBjdWRkbGVkIG91dC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICBAcHJpbnQoJ09oLCBjdXR0bGVmaXNoLCB0aG9zZSBhcmUgZnJlYWt5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0JpbGx5IE9jZWFuJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIGFuZCBub3QgQGZsYWdJcygnd2F0Y2hlZF9iaWxseV92aWRlbycsIHRydWUpXG4gICAgICAgICAgICB3aW5kb3cub3BlbignaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj16TmdjWUdndGY4TScsICdfYmxhbmsnKVxuXG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ2Ryb3ZlX2JpbGx5X3RvX2hvc3BpdGFsJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1N1ZGRlbmx5LCBhcHBlYXJpbmcgYmVmb3JlIHlvdXIgZXllcyBpcyBzaW5nZXItc29uZ3dyaXRlciBhbmQgZm9ybWVyIENhcmliYmVhbiBraW5nOiBCaWxseSBPY2Vhbi4gQWxzbyBCaWxseSBPY2VhblxcJ3MgY2FyLiBPYnZpb3VzIGV4aXRzIGFyZSBXZXN0IHRvIFdhbGUgYW5kIE5vcnRoIHRvIHNvbWUga2luZCBvZiBnYW1lIHNob3cuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0JpbGx5IE9jZWFuIGlzIG91dCBvZiB0aGUgaG9zcGl0YWwuIEhlIGFwcHJlY2lhdGVzIHdoYXQgeW91IGRpZCBmb3IgaGltIGFuZCBzYXlzLCBcIldoZW4gdGhlIGdvaW5nIGdldHMgdG91Z2gsIHRoZSB0b3VnaCBlc2NhcGUgZnJvbSB0aGUgaW5zYW5pdHkgd2FyZC5cIiBPYnZpb3VzIGV4aXRzIGFyZSBXZXN0IHRvIFdhbGUgYW5kIE5vcnRoIHRvIHNvbWUga2luZCBvZiBnYW1lIHNob3cuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJylcbiAgICAgICAgICAgIGlmIG5vdCBAZmxhZ0lzKCdkcm92ZV9iaWxseV90b19ob3NwaXRhbCcsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdIZSB3YW50cyB5b3UgdG8gZ2V0IGludG8gaGlzIGNhciBhbmQgZHJpdmUgaGltIHRvIHRoZSBob3NwaXRhbC4gSGUganVzdCBkcm92ZSB0aHJvdWdoIHRoZSBjYXIgd2FzaCB3aXRoIHRoZSB0b3AgZG93biBhZnRlciBkcm9wcGluZyBzb21lIGFjaWQuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiV2hlbiB0aGUgZ29pbmcgZ2V0cyB0b3VnaCwgdGhlIHRvdWdoIGVzY2FwZSBmcm9tIHRoZSBpbnNhbml0eSB3YXJkLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGNhcicpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoYXQgaXMgZGVmaW5pdGVseSBhIGNhci4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgaG9zcGl0YWwnKVxuICAgICAgICAgICAgQHByaW50KCdUaGUgaG9zcGl0YWwgbG9vbXMgaW4gdGhlIGRpc3RhbmNlLiBJdCBkb2VzblxcJ3Qgc2VlbSBhbGwgdGhhdCBmYXIgYXdheSBpZiB5b3UgaGF2ZSBhIGNhci4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2hvc3BpdGFsJykgb3IgQG1hdGNoZXMoJ2NhcicpXG4gICAgICAgICAgICBAcHJpbnQoJ1N1cmUsIHdoeSBub3Q/IFlvdSBnZXQgaW4gdGhlIGRyaXZlclxcJ3Mgc2VhdCBhbmQgZmluZCB5b3VyIHdheSB0byB0aGUgbmVhcmVzdCBtZWRpY2FsIHRyZWF0bWVudCBjZW50ZXIuIEFzIHRoYW5rcywgTXIuIE9jZWFuIHB1bGxzIGFuIGVnZyBvdXQgZnJvbSBoaXMgZ2xvdmUgYm94LiBZb3UgYWNjZXB0IGFuZCBzd2ltIGF3YXkgYXMgZmFzdCBhcyBwb3NzaWJsZS4gR29vZCwgSSByYW4gb3V0IG9mIGpva2VzIGZvciB0aGF0IGZhc3QuJylcbiAgICAgICAgICAgIEBzZXRGbGFnKCdkcm92ZV9iaWxseV90b19ob3NwaXRhbCcsIHRydWUpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnZWdnJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY2FsbCBjb3BzJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlIHBvbGljZSBjb21lIGFuZCBhcnJlc3QgQmlsbHkgT2NlYW4gb24gY2hhcmdlIG9mIGJlaW5nIGNvbXBsZXRlbHkgaXJyZWxldmFudCB0byB0aGlzIGdhbWUuIFlvdSBXaW4hIEhpZ2ggU2NvcmUuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0FjaHRpcHVzXFwncyBHYXJkZW4nLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIGlmIEBjb21pbmdGcm9tKFsnQWNodGlwdXNcXCdzIEdhcmRlbiAoSW5zaWRlKSddKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGxlYXZlIHRoZSBnYXJkZW4uIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIGluc2lkZSBvZiB0aGUgZ2FyZGVuLCBub3J0aCB0byBXYXRlciBXb3JsZCwgZWFzdCB0byBzb21lIE9jZWFuIGFuZCBzb3V0aCB0byBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoLicpXG4gICAgICAgICAgICBlbHNlIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0FjaHRpcHVzIGlzIHdvcmtpbmcgYW1vbmcgaGlzIGZsb3dlcnMgYW5kIHNocnVicy4gSGUgc2VlcyB5b3UgYW5kIG9wZW5zIHRoZSBnYXRlIGZvciB5b3UuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIGluc2lkZSBvZiB0aGUgZ2FyZGVuLCBub3J0aCB0byBXYXRlciBXb3JsZCwgZWFzdCB0byBzb21lIE9jZWFuIGFuZCBzb3V0aCB0byBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdBY2h0aXB1cyBpcyBzdGlsbCB3b3JraW5nIGhhcmQgaW4gdGhhdCBnYXJkZW4uIFlvdSBuZWVkIHRvIGdldCBoaW0gYSBnaXJsZnJpZW5kLCBhbmQgdGhlbiBoZSBuZWVkcyB0byBnZXQgWU9VIGEgZ2lybGZyaWVuZC4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgaW5zaWRlIG9mIHRoZSBnYXJkZW4sIG5vcnRoIHRvIFdhdGVyIFdvcmxkLCBlYXN0IHRvIHNvbWUgT2NlYW4gYW5kIHNvdXRoIHRvIGEgc2Nob29sIG9mIEN1dHRsZWZpc2guJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBhY2h0aXB1cycpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyBBY2h0aXB1cy4gSGUgaXMgcHVsbGluZyBvdXQgdGhlIHNlYXdlZWRzIGZyb20gaGlzIHNlYSBjdWN1bWJlciBiZWQuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpIG9yIEBtYXRjaGVzKCdlbnRlcicpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4gKEluc2lkZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2V0dGVyIE9jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdDdXR0bGVmaXNoJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0FjaHRpcHVzXFwncyBHYXJkZW4gKEluc2lkZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGVudGVyIHRoZSBnYXJkZW4gYW5kIHNlZSBhIGJvdW50aWZ1bCBkaXNwbGF5IHVuZm9sZCBiZWZvcmUgeW91LiBUaGUgZ2FyZGVuIGV4aXQgaXMgRWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ3RhbGtlZF90b19hY2h0aXB1cycsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIlRoaXMgaXMgcXVpdGUgdGhlIHVtLi4ub2NlYW4gaGlkZWF3YXkgeW91IGhhdmUgaGVyZSxcIiB5b3Ugc2F5LiBcIlllcyxcIiBoZSBzYXlzLCBcIkkgY2FuIHNlZSB5b3UgaGF2ZSBjb21lIGEgbG9uZyB3YXkgdG8gZ2V0IGhlcmUsIGJ1dCBJIGFtIGdsYWQgeW91IGhhdmUgZm91bmQgcmVmdWdlIG9uIG15IGdyb3VuZHMuIElmIHlvdSBzZWUgYW55dGhpbmcgeW91IGxpa2UgaW4gbXkgcGxvdCB3ZSBjb3VsZCBtYWtlIGEgZGVhbCBwZXJoYXBzLlwiJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ09oLCBiYWNrIGFnYWluIFNoYXJjPyBDYW4gSSBpbnRlcmVzdCB5b3UgaW4gYW55IG9mIHRoZSBpdGVtcyBpbiBteSBmaW5lIGdhcmRlbj8nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgYWNodGlwdXMnKVxuICAgICAgICAgICAgQHByaW50KCdJdFxcJ3MgQWNodGlwdXMuIEhlIGlzIHB1bGxpbmcgb3V0IHRoZSBzZWF3ZWVkcyBmcm9tIGhpcyBzZWEgY3VjdW1iZXIgYmVkLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBnYXJkZW4nKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc2VlIHdhdGVybWVsb25zLCB3YXRlciBjaGVzdG51dHMsIGFzc29ydGVkIGZsb3dlcnMsIHNlYSBjdWN1bWJlcnMgYW5kIHN0cmF3YmVycmllcy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHdhdGVybWVsb25zJykgb3IgQG1hdGNoZXMoJ3Rha2Ugd2F0ZXJtZWxvbnMnKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugb25seSBlYXQgc2VlZGxlc3MgYW5kIHRoZXNlIGFyZSB0aGUgZXh0cmEgc2VlZCB2YXJpZXR5LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY2hlc3RudXRzJykgb3IgQG1hdGNoZXMoJ3Rha2UgY2hlc3RudXRzJylcbiAgICAgICAgICAgIEBwcmludCgnV2F0ZXIgY2hlc3RudXRzPyBJcyB0aGF0IGV2ZW4gYSB0aGluZz8nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGN1Y3VtYmVycycpIG9yIEBtYXRjaGVzKCd0YWtlIGN1Y3VtYmVycycpXG4gICAgICAgICAgICBAcHJpbnQoJ1NvYWsgaXQgaW4gYnJpbmUgZm9yIGEgY291cGxlIHdlZWtzLCB0aGVuIGNvbWUgYmFjayB0byBtZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHN0cmF3YmVycmllcycpIG9yIEBtYXRjaGVzKCd0YWtlIHN0cmF3YmVycmllcycpIG9yIEBtYXRjaGVzKCdsb29rIHN0cmF3YmVycnknKSBvciBAbWF0Y2hlcygndGFrZSBzdHJhd2JlcnJ5JylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHNlbnNlIGEgc3VycmVhbGlzdGljIHZpYmUgY29taW5nIGZyb20gdGhvc2Ugc3RyYXdiZXJyaWVzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmbG93ZXJzJykgb3IgQG1hdGNoZXMoJ3Rha2UgZmxvd2VycycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiSSBjYW4gc2VlIHlvdSBsaWtlIHRoZSBmbG93ZXJzLiBJIHdpbGwgbGV0IHlvdSBoYXZlIHRoZW0gaWYgeW91IGNhbiBmaW5kIHNvbWV0aGluZyB0byBrZWVwIGl0IGZyb20gZ2V0dGluZyBzbyBob3QgaGVyZS4gSSB3b3VsZCBiZSBhYmxlIHRvIGRvIHR3aWNlIGFzIG11Y2ggd29yayBpZiBpdCB3ZXJlIGEgYml0IGNvb2xlci5cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ2l2ZSB1bWJyZWxsYScpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiVGhpcyB3aWxsIGJlIHBlcmZlY3QgZm9yIGJsb2NraW5nIG91dCB0aGF0IHN1buKAmXMgaGFyc2ggcmF5cy4gVGhhbmtzIVwiJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCd1bWJyZWxsYScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiVGFrZSB0aGVzZSBmbG93ZXJzLiBUaGV5IGFyZSByZWFsbHkgdmVyc2F0aWxlIGFuZCB3aWxsIGJlIGdvb2QganVzdCBhYm91dCBhbnl3aGVyZS5cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpIG9yIEBtYXRjaGVzKCdleGl0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQWNodGlwdXNcXCdzIEdhcmRlbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UnLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBzd2ltIHVwIHRvIHRoZSBydWlucyBvZiB5b3VyIG9sZCB3b3JrIHBsYWNlLiBUaGlzIHBsYWNlIGhhcyBzZWVuIGJldHRlciBkYXlzLiBZb3VyIG1pbmQgaXMgZmxvb2RlZCB3aXRoIG1lbW9yaWVzIG9mIGZsb2F0aW5nIGluIGZyb250IG9mIHRoZSBvbGQgZ3JpbGwgYW5kIGNvbWluZyB1cCB3aXRoIG5ldyByZWNpcGVzIHRvIHRyeSB3aGVuIHlvdXIgbWFuYWdlciBoYWQgaGlzIGJhY2sgdHVybmVkLiBUaGVuIHNvbWVvbmUgc2FpZCBcIkV2ZXIgdHJpZWQgYW4gTS04MCBidXJnZXI/IEkgaGF2ZSBlbm91Z2ggZm9yIGV2ZXJ5b25lLlwiIFRoZSB3b3JkcyBlY2hvIGluIHlvdXIgbWluZCBsaWtlIGEgcGhhbnRvbSB3aGlzcGVyIG9mIGFnZXMgcGFzdC4gQ3V0dGxlZmlzaCBzdG9tcGluZyBncm91bmRzIGxpZSBlYXN0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdXaGF0IGlzIGxlZnQgb2YgdGhlIFN0ZWFrIGFuZCBTaGFrZSBidWlsZGluZyB5b3UgdXNlZCB0byB3b3JrIGF0IGJlZm9yZSB5b3VyIGZyaWVuZCBleHBsb2RlZCBpdCB0cnlpbmcgdG8gbWFrZSBmaXJld29yayBzYW5kd2ljaGVzLiBDdXR0bGVmaXNoIHN0b21waW5nIGdyb3VuZHMgbGllIGVhc3QuJylcbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KFwiSXQncyB0aGUgcnVpbnMgb2YgdGhlIG9sZCBTdGVhayBhbmQgU2hha2UgeW91IHVzZWQgdG8gd29yayBhdCB1bnRpbCB5b3VyIGZyaWVuZCBibGV3IGl0IHVwLiBUaGUgdGF0dGVyZWQgcmVtbmFudHMgb2YgYSByZWQgYW5kIHdoaXRlIGF3bmluZyBmbHV0dGVycyBpbiB0aGUgd2luZCBhcyBpZiB0byBzdXJyZW5kZXIgdG8gYW4gZW5lbXkuIFdoYXQgaXMgbGVmdCBvZiBhIGRvb3IgaGFuZ3Mgb24gYSBzaW5nbGUgaGluZ2UgdG8gdGhlIHdlc3QuIEN1dHRsZWZpc2ggc3RvbXBpbmcgZ3JvdW5kcyBsaWUgZWFzdC5cIilcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHN0ZWFrJykgb3IgQG1hdGNoZXMoJ2xvb2sgc2hha2UnKSBvciBAbWF0Y2hlcygnbG9vayBidWlsZGluZycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdXIgbWVtb3JpZXMgb2YgdGhpcyBwbGFjZSBkb25cXCd0IHF1aXRlIG1hdGNoIHdoYXQgaXQgaXMgbm93LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpIG9yIEBtYXRjaGVzKCdvcGVuIGRvb3InKSBvciBAbWF0Y2hlcygnZW50ZXInKSBvciBAbWF0Y2hlcygnaW4nKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQ3V0dGxlZmlzaCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG4gICAgICAgICAgICBcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdBcyB5b3UgYXBwcm9hY2gsIHRoZSBkb29yIGZhbGxzIGNsZWFuIG9mZiBhcyBpZiB0byB3YXJuIHlvdSBhZ2FpbnN0IGVudHJ5LiBOZXZlciBiZWluZyBvbmUgZm9yIG9tZW5zLCB5b3UgaWdub3JlIGl0LiBJbnNpZGUgeW91IGRpc2NvdmVyIHRoaW5ncyBtdWNoIGFzIHlvdSByZW1lbWJlciB0aGVtLiBUaGF0IGlzLCBpZiB0aGV5IGhhZCBiZWVuIG1hdWxlZCBieSBhIGJlYXIgd2l0aCBibGVuZGVycyBmb3IgaGFuZHMgd2hvIHByb2NlZWRlZCB0byBzZXQgb2ZmIGEgc2VyaWVzIG9mIHBsYXN0aWMgZXhwbG9zaXZlcy4gVG8gdGhlIHNvdXRoIHRoZXJlIGFyZSBzb21lIHRhYmxlcyBhbmQgY2hhaXJzLCBub3J0aCBsaWVzIHRoZSBraXRjaGVuLCBhbmQgd2VzdCBhIHNvZGEgZm91bnRhaW4uIFRoZSBvdXRkb29ycyBpcyBFYXN0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGVyZSBhcmUgc29tZSBiYXR0ZXJlZCB0YWJsZXMgYW5kIGNoYWlycyBzb3V0aCwgYSBraXRjaGVuIG5vcnRoLCBhbmQgYSBzb2RhIGZvdW50YWluIHdlc3QuIFlvdSBjYW4gZXhpdCBFYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERpbmluZyBBcmVhKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNvZGEgRm91bnRhaW4pJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChEaW5pbmcgQXJlYSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQSBkaWxhcGlkYXRlZCBkaW5pbmcgYXJlYSBsaWVzIGJlZm9yZSB5b3UuIEl0IGlzIGNvbXBsZXRlbHkgdW5yZW1hcmthYmxlLiBUaGVyZSBpcyBub3doZXJlIHRvIGdvIGJlc2lkZXMgbm9ydGggdG8gdGhlIHdheSB5b3UgY2FtZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbiknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnV2VsY29tZSB0byB0aGUga2l0Y2hlbi4gU2luY2UgdGhlIHdhbGxzIGhhdmUgYWxsIGJlZW4gYmxvd24gYXdheSBvciBkaXNzb2x2ZWQsIHRoZSBvbmx5IHRoaW5nIHRoYXQgc2VwYXJhdGVzIGl0IGZyb20gdGhlIHJlc3Qgb2YgdGhlIHBsYWNlIGlzIHRoZSBvdmVuIGFuZCBzdG92ZSB0b3AuIFNvdXRoIGxlYWRzIGJhY2sgdG8gdGhlIG1haW4gZW50cnkgYXJlYS4gU291dGggZ29lcyBiYWNrIHRvIHRoZSBkb29yd2F5LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgb3ZlbicpIG9yIEBtYXRjaGVzKCdvcGVuIG92ZW4nKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdzb2RhJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0NoZWNrIGl0IG91dCwgaXRcXCdzIHlvdXIgZmF2b3JpdGUgcG9wLCBhIENoZXJyeSBPcmFuZ2UgU25venpiZXJyeSBMaW1lIFBhc3Npb25mcnVpdCBWYW5pbGxhIENyb2FrIGluIHRoZSBvdmVuLiBXaG8gZXZlciB0aG91Z2h0IG9mIGJha2luZyBhIGNhbiBvZiBzb2RhPyBTb3V0aCBsZWFkcyBiYWNrIHRvIHRoZSBtYWluIGVudHJ5IGFyZWEuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBvdmVuIGlzIGVtcHR5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY2xvc2Ugb3ZlbicpXG4gICAgICAgICAgICBAcHJpbnQoJ0hvdyByZXNwb25zaWJsZSBvZiB5b3UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHNvZGEnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZ290IHNvZGEuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdzb2RhJylcblxuICAgICAgICBlbHNlIGlmIEBmbGFnSXMoJ2hhdmVfYWxsX2l0ZW1zJywgdHJ1ZSkgYW5kIEBtYXRjaGVzKCdtYWtlIHBhbmNha2VzJylcbiAgICAgICAgICAgIEBzZXRGbGFnKCdoYXZlX2FsbF9pdGVtcycsICdmYWxzZScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4pJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4pJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiV2hlcmUgZG8gSSBzdGFydD9cIiB5b3Ugd29uZGVyIG91dCBsb3VkLiBJZiBvbmx5IHRoZXJlIHdlcmUgd3JpdHRlbiBzZXJpZXMgb2YgaW5zdHJ1Y3Rpb25zIGd1aWRpbmcgeW91IHRocm91Z2guIFdoZXJlIHdvdWxkIHlvdSBmaW5kIHNvbWV0aGluZyBsaWtlIHRoYXQ/JylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3VcXCdyZSBwb25kZXJpbmcgdGhpcyB3aGVuIGEgZHJhZnQgY29tZXMgb3ZlciB5b3UuIFRoZSBsaWdodHMgZmxpY2tlciBvbiBhbmQgb2ZmLiBZb3Ugc2Vuc2UgYSBteXN0ZXJpb3VzIHByZXNlbmNlLiBUaGUgZ2hvc3Qgb2YgeW91ciBvbGQgZnJpZW5kIENyZWdnbGVzIGFwcGVhcnMgYmVmb3JlIHlvdS4gQXBwYXJlbnRseSBoZSBpcyBoYXVudGluZyB0aGUgU3RlYWsgYW5kIFNoYWtlIG5vdyBhbmQgeW91XFwncmUgYWxsIGxpa2UgXCJDcmVnZ2xlcywgZGlkblxcJ3Qgd2UganVzdCBoYW5nIG91dCB0aGUgb3RoZXIgZGF5PyBIb3cgYXJlIHlvdSBhIGdob3N0IGFscmVhZHk/XCInKVxuICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnPHNwYW4gY2xhc3M9XCJjcmVlcHlcIj5cIk5ldmVyIHlvdSBtaW5kIHRoYXQgbm93XCI8L3NwYW4+IGhlIHNheXMgaW4gaGlzIGNyZWVweSBuZXJkIHZvaWNlLiA8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiU2hhcmMsIGlmIHlvdSBob3BlIHRvIHNhdmUgdGhlIHdvcmxkIGZyb20gY2VydGFpbiBkb29tLCB5b3UgbXVzdCBzdWNjZWVkIGluIG1ha2luZyB0aGVzZSBwYW5jYWtlcy4gVXNlIHRoaXMgYW5jaWVudCByZWNpcGUgaGFuZGVkIGRvd24gZnJvbSB0aGUgYW5jaWVudHMgdG8gYWlkIHlvdS5cIjwvc3Bhbj4gQW4gb2xkLCBiYXR0ZXJlZCBwaWVjZSBvZiBwYXBlciBmbG9hdHMgZG93biBsYW5kaW5nIGJlZm9yZSB5b3UgXCJTd2VldCBNZWVtYXdzIFN3ZWV0eSBTd2VldCBGbGFwamFja3NcIiBpdCByZWFkcy4gPHNwYW4gY2xhc3M9XCJjcmVlcHlcIj5cIk5vdyBteSB3b3JrIGlzIGRvbmUgYW5kIEkgY2FuIGFzY2VuZCB0byBteSBzdGVwbW9tXFwncyBob3VzZSBmb3IgZ3JpbGxlZCBjaGVlc2Ugc2FuZHdpY2hlcyBhbmQgY2hvY29sYXRlIG1pbGsuXCI8L3NwYW4+JylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHJlYWQgdGhlIHJlY2lwZS4gSXQgaXMgYWxsIGluIHJpZGRsZXMuIFlvdSBob3BlIHlvdSBhcmUgdXAgdG8gdGhlIHRhc2suJylcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYW4gZW1wdHkgYm93bCBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGFuIGVtcHR5IGJvd2wgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnSW4gYW4gdXJuIHRha2UgYnV0IG5vdCBjaHVybiBpdGVtcyB0d28gbm90IGxpa2UgZ29vLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc29kYScpIGFuZCBAaGFzSXRlbSgnc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBwdXQgdGhlIHNvZGEgaW50byB0aGUgYm93bC4nKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3NvZGEnKVxuICAgICAgICAgICAgQHByaW50KCdIZXkgaXQgbG9va3MgbGlrZSB0aGF0IHdvcmtlZCEnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ0l0IGxvb2tzIGxpa2Ugc29tZXRoaW5nIGlzIHN0aWxsIG1pc3NpbmcuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdmbG93ZXJzJykgYW5kIEBoYXNJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHB1dCB0aGUgZmxvdXIgaW50byB0aGUgYm93bC4nKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgQHByaW50KCdIZXkgaXQgbG9va3MgbGlrZSB0aGF0IHdvcmtlZCEnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ3NvZGEnKVxuICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ0l0IGxvb2tzIGxpa2Ugc29tZXRoaW5nIGlzIHN0aWxsIG1pc3NpbmcuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb2RhIGZsb3dlcnMnKSBhbmQgQGhhc0l0ZW0oJ3NvZGEnKSBhbmQgQGhhc0l0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3NvZGEnKVxuICAgICAgICAgICAgQHByaW50KCdIZXkgaXQgbG9va3MgbGlrZSB0aGF0IHdvcmtlZCEnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdXIgcG90aW9uIGlzIGRyeS4gVGhpcyB3aWxsc3Qgbm90IGZseS4gV2hhdFxcJ3MgbmV4dCBtdXN0IGJlIGR1bXBlZCwgcG91cmVkIGFuZCBjcmFja2VkIGZvciBhIHByb3BlciBmbGFwamFjay4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdtaWxrIGVnZycpIG9yIEBtYXRjaGVzKCdtaWxrIG1hcmdhcmluZScpIG9yIEBtYXRjaGVzKCdlZ2cgbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEBwcmludCgnU2xvdyBkb3duIHRoZXJlIHBhcnRuZXIsIEkgY2FuIG9ubHkgaGFuZGxlIHNvIG1hbnkgdGhpbmdzIGF0IG9uY2UuIFRlbGwgdGhlbSB0byBtZSBvbmUgYXQgYSB0aW1lIHBsZWFzZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdtaWxrJykgYW5kIEBoYXNJdGVtKCdtaWxrJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHB1dCB0aGUgbWlsayBpbnRvIHRoZSBib3dsLicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnbWlsaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIChub3QgQGhhc0l0ZW0oJ2VnZycpKSBhbmQgKG5vdCBAaGFzSXRlbSgnbWFyZ2FyaW5lJykpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ0l0IGxvb2tzIGxpa2Ugc29tZXRoaW5nIGlzIHN0aWxsIG1pc3NpbmcuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbWFyZ2FyaW5lJykgYW5kIEBoYXNJdGVtKCdtYXJnYXJpbmUnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ21hcmdhcmluZScpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIChub3QgQGhhc0l0ZW0oJ21pbGsnKSkgYW5kIChub3QgQGhhc0l0ZW0oJ2VnZycpKVxuICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdJdCBsb29rcyBsaWtlIHNvbWV0aGluZyBpcyBzdGlsbCBtaXNzaW5nLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2VnZycpIGFuZCBAaGFzSXRlbSgnZWdnJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdlZ2cnKVxuICAgICAgICAgICAgQHByaW50KCdIZXkgaXQgbG9va3MgbGlrZSB0aGF0IHdvcmtlZCEnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBpZiAobm90IEBoYXNJdGVtKCdtaWxrJykpIGFuZCAobm90IEBoYXNJdGVtKCdtYXJnYXJpbmUnKSlcbiAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBzbGlnaHRseSBtb3JlIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnSXQgbG9va3MgbGlrZSBzb21ldGhpbmcgaXMgc3RpbGwgbWlzc2luZy4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQ3V0dGluZyBhbmQgc2Nvb3Bpbmcgc2hhbGwgaGF2ZSB0aGVpciBkYXksIGJ1dCBhIGZvciBhIGZpbmUgZmx1ZmZ5IGJhdHRlciB0aGVyZSBiZSBidXQgb25lIHdheS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzdGlyJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgbWl4ZWQgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzaGFrZScpXG4gICAgICAgICAgICBAcHJpbnQoJ0R1ZGUsIHdobyBkbyB5b3UgdGhpbmsgeW91IGFyZSwgSmFtZXMgQm9uZD8gIFRoaXMgYmF0dGVyIG5lZWRzIHRvIGJlIHN0aXJyZWQsIG5vdCBzaGFrZW4uJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBtaXhlZCBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdTZXQgdGhlIGdyaWRkbGUgb3Igc3RvdmUgdG8gbWVkaXVtIGhlYXQuIEFmdGVyIGl0IGlzIHdhcm1lZCwgZHJvcCBiYXR0ZXIgYSBxdWFydGVyIGN1cCBhdCBhIHRpbWUgYW5kIHR1cm5pbmcgb25jZSB1bnRpbCBidWJibGVzIGFwcGVhci4gXCJXZWxsIHRoYXQgc2VlbXMgcHJldHR5IGNsZWFyLiBJIHRoaW5rIEkgY2FuIGRvIHRoYXQgb24gbXkgb3duLlwiJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggcGxhdGUgb2YgZHJ5IHBhbmNha2VzIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggcGxhdGUgb2YgZHJ5IHBhbmNha2VzIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RlbiBtaW51dGVzIGxhdGVyIHRoZSBwYW5jYWtlcyBhcmUgZmluaXNoZWQsIGJ1dCBzb21ldGhpbmcgaXMgbWlzc2luZy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzeXJ1cCcpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnc3lydXAnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZ290IHBhbmNha2VzISAgSG90IGRhbmcuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChLaXRjaGVuKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNvZGEgRm91bnRhaW4pJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzZWUgdGhhdCB0aGUgc29kYSBmb3VudGFpbiBoYXMgc29tZWhvdyByZW1haW5lZCBsYXJnZWx5IHVuZGFtYWdlZC4gWW91IHRoaW5rIGJhY2sgdG8gdGhlIGRheXMgd2hlbiB5b3Ugd291bGQgc25lYWsgb3V0IGJhZ3Mgb2YgcGxhaW4gc3lydXAgdG8gZHJpbmsgYW5kIHRoZSBmcmVha2lzaCB3YWtpbmcgZHJlYW1zIGl0IHdvdWxkIGluZHVjZSBpbiB5b3UuIFlvdSB3b25kZXIgaWYgdGhlcmUgaXMgYW55IHN0aWxsIGluIHRoZXJlLiBUaGUgRWFzdCBkb29yIGdvZXMgYmFjayB0byB0aGUgbWFpbiBhcmVhLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZm91bnRhaW4nKSBvciBAbWF0Y2hlcygnb3BlbiBmb3VudGFpbicpIG9yIEBtYXRjaGVzKCdsb29rIHNvZGEnKSBvciBAbWF0Y2hlcygnb3BlbiBzb2RhJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnc3lydXAnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnQXZhc3QsIGEgaGlkZGVuIHRyZWFzdXJlIHRyb3ZlIG9mIHN1Z2FyeSB3b25kZXIgdGhhdCBoYXMgbGFpbiBkb3JtYW50IGFsbCB0aGVzZSB5ZWFycyEgWW91IHRyZW1ibGUgYXQgdGhlIGJlYXV0eSBvZiB0aGUgc2lnaHQgYmVmb3JlIHlvdS4gU28gbWFueSBiYWdzIGFuZCB5ZXQgeW91ciBtYWdpYyBoYW1tZXJzcGFjZSBzYXRjaGVsIHdpbGwgb25seSBhbGxvdyBmb3Igb25lLiBUaGVyZVxcJ3MgU3ByaXR6LCBQcm9mZXNzb3IgR2luZ2VyLCBDYWN0dXMgTGFnZXIsIGFuZCBNcy4gU2hpbSBTaGFtXFwncyBNYXBsZSBTb2RhLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdJdFxcJ3MgdGhhdCBzb2Z0IGRyaW5rIGRpc3BlbnNlciB5b3UgZ290IGEgYmFnIG9mIHN5cnVwIGZyb20uJylcblxuICAgICAgICBlbHNlIGlmIG5vdCBAaGFzSXRlbSgnc3lydXAnKVxuICAgICAgICAgICAgaWYgQG1hdGNoZXMoJ3Rha2Ugc3ByaXR6Jykgb3IgQG1hdGNoZXMoJ2xvb2sgc3ByaXR6JylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1Nwcml0eiwgQSByZWZyZXNoaW5nIGJsYXN0IG9mIHBpY2tsZSBhbmQgY2VsZXJ5PyBObyB3YXkuJylcbiAgICAgICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgcHJvZmVzc29yJykgb3IgQG1hdGNoZXMoJ3Rha2UgZ2luZ2VyJykgb3IgQG1hdGNoZXMoJ2xvb2sgcHJvZmVzc29yJykgb3IgQG1hdGNoZXMoJ2xvb2sgZ2luZ2VyJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1Byb2Zlc3NvciBnaW5nZXIsIDcyIGZsYXZvcnMgYW5kIGFsbCBvZiB0aGVtIG1ha2UgbWUgbG9uZyBmb3IgYSBxdWljayBkZWF0aC4gTm9wZSBub3BlIG5vcGUuJylcbiAgICAgICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgY2FjdHVzJykgb3IgQG1hdGNoZXMoJ3Rha2UgbGFnZXInKSBvciBAbWF0Y2hlcygnbG9vayBjYWN0dXMnKSBvciBAbWF0Y2hlcygnbG9vayBsYWdlcicpXG4gICAgICAgICAgICAgICAgQHByaW50KCdDYWN0dXMgbGFnZXIsIFlvdSB0aGluayB5b3Ugc2VlIHNvbWUgbmVlZGxlcyBmbG9hdGluZyBpbiB0aGVyZS4gQ29tZSBvbiBtYW4uJylcblxuICAgICAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBtYXBsZScpIG9yIEBtYXRjaGVzKCdsb29rIHNoaW0nKSBvciBAbWF0Y2hlcygnbG9vayBzaGFtJykgb3IgQG1hdGNoZXMoJ2xvb2sgbXMnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWXVtIHl1bSBzb2RhIHRoaXMgb25lcyBsb29rcyB0YXN0eS4nKVxuXG4gICAgICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIG1hcGxlJykgb3IgQG1hdGNoZXMoJ3Rha2Ugc2hpbScpIG9yIEBtYXRjaGVzKCd0YWtlIHNoYW0nKSBvciBAbWF0Y2hlcygndGFrZSBtcycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3UgZmluZCBpdCBzaG9ja2luZyB0aGF0IHlvdSBhcmUgdGhlIGZpcnN0IHJhaWRlciBvZiB0aGlzIHNvZGEgdG9tYi4gQnV0IHRoZW4gYWdhaW4sIHlvdSBoYXZlIGFsd2F5cyBzYWlkIHBlb3BsZSBkb25cXCd0IGtub3cgdGhlIHZhbHVlIG9mIGEgYmFnIG9mIGxpcXVpZCBzdWdhci4nKVxuICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdzeXJ1cCcpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UnKSBvciBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZdXAgdGhlcmUgaXMgYSBsb3Qgb2Ygc29kYSBpbiB0aGVyZSwgYnV0IHlvdSBhbHJlYWR5IHBpY2tlZCBvbmUuIE5vdyBnbyBsaXZlIHdpdGggeW91ciBjaG9pY2UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwnLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBqdXN0IHdhbGtlZCBvbnRvIHRoZSBzZXQgb2YgdGhlIHdpbGRseSBwb3B1bGFyIGdhbWUgc2hvdywgXCJTZWFsIG9yIE5vIFNlYWwhXCIgV2hlcmUgZmxhbWJveWFudCBjb250ZXN0YW50cyBmbGFpbCBhcm91bmQgYW5kIHNob3V0IHdoaWxlIHRyeWluZyB0byBhcnJpdmUgYXQgdGhlIGFuc3dlciB0byB0aGF0IGFnZSBvbGQgcXVlc3Rpb24uLi5TRUFMIE9SIE5PIFNFQUw/IFRvIHRoZSBlYXN0IGlzIGJhY2tzdGFnZSwgbm9ydGggd2lsbCB0YWtlIHlvdSB0byB0aGUgZHJlc3Npbmcgcm9vbSwgd2VzdCB0byBzb21lIG9jZWFuLCBhbmQgc291dGggdG8gQmlsbHkgT2NlYW4uJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBhcmUgb24gdGhlIHNldCBmb3IgU2VhbCBvciBubyBTZWFsLCB0aGUgZ2FtZSBzaG93LiBZb3UganVzdCByZWFsaXplZCB5b3UgbXVzdCBmaW5kIGEgd2F5IHRvIGJlY29tZSBhIGNvbnRlc3RhbnQgb3IgeW91ciBsaWZlIHdpbGwgaGF2ZSBiZWVuIHdhc3RlZC4gVG8gdGhlIGVhc3QgaXMgYmFja3N0YWdlLCBub3J0aCB3aWxsIHRha2UgeW91IHRvIHRoZSBkcmVzc2luZyByb29tLCB3ZXN0IHRvIHNvbWUgb2NlYW4sIGFuZCBzb3V0aCB0byBCaWxseSBPY2Vhbi4nKVxuICAgICAgICBlbHNlIGlmIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ09oIHdvdyEgU2VhbCBvciBubyBTZWFsISBZb3UgbG92ZSBpdCB3aGVuIHRoZSBob3N0IGxvb2tzIHJpZ2h0IGF0IHRoZSBjYW1lcmEgYW5kIHNheXMgdGhhdC4gSXTigJlzIHNvIGludGVuc2UuIFRoZXJlIGhhcyB0byBiZSBzb21lIHdheSB0byBnZXQgb24gdGhpcyBzaG93LiBUbyB0aGUgZWFzdCBpcyBiYWNrc3RhZ2UsIG5vcnRoIHdpbGwgdGFrZSB5b3UgdG8gdGhlIGRyZXNzaW5nIHJvb20sIHdlc3QgdG8gc29tZSBvY2VhbiwgYW5kIHNvdXRoIHRvIEJpbGx5IE9jZWFuLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20pJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXZXR0ZXIgT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0JpbGx5IE9jZWFuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBwbGFjZSBpcyBncmVhdCEgSXQgd291bGQgYmUgZWFzeSB0byBjb2JibGUgdG9nZXRoZXIgYSBjb3N0dW1lIHRvIGdldCBvbiB0aGF0IHNob3cuIExldHMgc2VlIHdoYXQgd2UgY2FuIGZpbmQuIE9idmlvdXMgZXhpdHMgYXJlIHNvdXRoIHRvIHRoZSBzaG93IGVudHJhbmNlLicpXG4gICAgICAgIFxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY29zdHVtZScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgSGVhZGdlYXIpJylcblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIEhlYWRnZWFyKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdMZXRcXCdzIHN0YXJ0IHdpdGggaGVhZGdlYXIuIFlvdSBzZWUgYSBjb3dib3kgaGF0LCBhIHJhaW5ib3cgd2lnLCBhIG1vdG9yY3ljbGUgaGVsbWV0LCBhbmQgYSBzdG92ZXBpcGUgaGF0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY293Ym95IGhhdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY293Ym95IGhhdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcyknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3JhaW5ib3cgd2lnJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdyYWluYm93IHdpZycpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcyknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdtb3RvcmN5Y2xlIGhlbG1ldCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcyknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N0b3ZlcGlwZSBoYXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3N0b3ZlcGlwZSBoYXQnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIENsb3RoZXMpJylcblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIENsb3RoZXMpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ05vdyBzZWxlY3QgYSBzZXQgb2YgY2xvdGhlcy4gWW91IHNlZSBhIGNvdyBwcmludCB2ZXN0LCBhIGNsb3duIHN1aXQsIGEgbGVhdGhlciBqYWNrZXQsIGFuZCBhbiBvbGR0aW1leSBzdWl0IHdpdGggb25lIG9mIHRob3NlIENvbG9uZWwgU2FuZGVycyB0aWVzJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsZWF0aGVyIGphY2tldCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnbGVhdGhlciBqYWNrZXQnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIEFjY2Vzc29yeSknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Nsb3duIHN1aXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Nsb3duIHN1aXQnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIEFjY2Vzc29yeSknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ29sZHRpbWV5Jykgb3IgQG1hdGNoZXMoJ3RpZXMnKSBvciBAbWF0Y2hlcygnY29sb25lbCcpIG9yIEBtYXRjaGVzKCdzYW5kZXJzJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdvbGR0aW1leSBzdWl0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBBY2Nlc3NvcnkpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjb3cgdmVzdCcpIG9yIEBtYXRjaGVzKCdwcmludCB2ZXN0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjb3cgcHJpbnQgdmVzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBBY2Nlc3NvcnkpJywgLT5cbiAgICAgICAgZG9uZSA9ICdZb3UgbG9vayBhYnNvbHV0ZWx5IGhvcnJpYmxlISBPciBhbWF6aW5nLCBkZXBlbmRpbmcgb24geW91ciBwZXJzcGVjdGl2ZS4gQnV0IHRoZSB0cnVlIGp1ZGdlIHdpbGwgYmUgdGhlIGdhbWUgc2hvdyBtYW5hZ2VyLidcblxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnQWNjZXNzb3JpemUhIFBpY2sgZnJvbSBhIGd1biBiZWx0LCBhIHJ1YmJlciBjaGlja2VuLCBhIG1ldGFsIGNoYWluLCBhbmQgYSBmYWtlIGJlYXJkLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZmFrZSBiZWFyZCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnZmFrZSBiZWFyZCcpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdndW4gYmVsdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnZ3VuIGJlbHQnKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbWV0YWwgY2hhaW4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ21ldGFsIGNoYWluJylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3J1YmJlciBjaGlja2VuJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdydWJiZXIgY2hpY2tlbicpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBjb3N0dW1lTWF0Y2hlcyA9IChlbmdpbmUpIC0+XG4gICAgICAgIGdyb3VwMSA9IDBcbiAgICAgICAgZ3JvdXAyID0gMFxuICAgICAgICBncm91cDMgPSAwXG4gICAgICAgIGdyb3VwNCA9IDBcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnY293Ym95IGhhdCcpIHRoZW4gZ3JvdXAxKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2NvdyBwcmludCB2ZXN0JykgdGhlbiBncm91cDErK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnZ3VuIGJlbHQnKSB0aGVuIGdyb3VwMSsrXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ3JhaW5ib3cgd2lnJykgdGhlbiBncm91cDIrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnY2xvd24gc3VpdCcpIHRoZW4gZ3JvdXAyKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ3J1YmJlciBjaGlja2VuJykgdGhlbiBncm91cDIrK1xuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdtb3RvcmN5Y2xlIGhlbG1ldCcpIHRoZW4gZ3JvdXAzKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2xlYXRoZXIgamFja2V0JykgdGhlbiBncm91cDMrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnbWV0YWwgY2hhaW4nKSB0aGVuIGdyb3VwMysrXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ3N0b3ZlcGlwZSBoYXQnKSB0aGVuIGdyb3VwNCsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdvbGR0aW1leSBzdWl0JykgdGhlbiBncm91cDQrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnZmFrZSBiZWFyZCcpIHRoZW4gZ3JvdXA0KytcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoZ3JvdXAxLCBncm91cDIsIGdyb3VwMywgZ3JvdXA0KVxuXG4gICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zID0gKGVuZ2luZSkgLT5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Nvd2JveSBoYXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgncmFpbmJvdyB3aWcnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnc3RvdmVwaXBlIGhhdCcpXG5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2NvdyBwcmludCB2ZXN0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Nsb3duIHN1aXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnbGVhdGhlciBqYWNrZXQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnb2xkdGltZXkgc3VpdCcpXG5cbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3J1YmJlciBjaGlja2VuJylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ21ldGFsIGNoYWluJylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2Zha2UgYmVhcmQnKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgaXMgdGhlIHN0YWdlLiBJdCBpcyBqdXN0IGFzIHN0dXBpZCBsb29raW5nIGFzIHRoZSByZXN0IG9mIHRoZSBzaG93LiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBzaG93XFwncyBlbnRyYW5jZS4gVGhlIHNob3cgbWFuYWdlciBzdGFyZXMgYXQgeW91IHF1ZXN0aW9uaW5nbHkuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrIG1hbmFnZXInKVxuICAgICAgICAgICAgc3dpdGNoIGNvc3R1bWVNYXRjaGVzKEApXG4gICAgICAgICAgICAgICAgd2hlbiAwXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIHNob3cgbWFuYWdlciBhcG9sb2dpemVzLCBcIkkgYW0gc29ycnkgc2lyLCB5b3UgbG9vayBsaWtlIGEgZGVjZW50IGtpbmQgb2YgcGVyc29uLCBhbmQgSVxcJ20gYWZyYWlkIHdlIGhhdmUgbm8gcGxhY2UgZm9yIHRoYXQgb24gdGVsZXZpc2lvbi4gTWF5YmUgaWYgeW91IGNhbWUgYmFjayBkcmVzc2VkIGxpa2UgYSBtYW5pYWMgd2UgY291bGQgd29yayBzb21ldGhpbmcgb3V0LicpXG4gICAgICAgICAgICAgICAgd2hlbiAzXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIHNob3cgbWFuYWdlciBsb29rcyB5b3Ugb3Zlciwgbm90aWNpbmcgZ29vZCB0YXN0ZSwgeW91ciBrbmFjayBmb3IgZmxhaXIgYW5kIGF0dGVudGlvbiB0byBkZXRhaWwuIEhlIGRlY2xhcmVzIFwiV2VsbCwgSSBhcHByZWNpYXRlIHlvdSB0YWtpbmcgdGltZSB0byBhc3NlbWJsZSB0aGUgY29zdHVtZSwgYnV0IGl0IGlzIGp1c3QgYSBiaXQgdG9vIG9yZGVybHkuIFlvdSByZWFsbHkgYXJlblxcJ3Qgd2hhdCB3ZSBhcmUgbG9va2luZyBmb3IuXCInKVxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgICAgICB3aGVuIDJcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdUaGUgc2hvdyBtYW5hZ2VyIGxvb2tzIHBsZWFzZWQsIHlldCBhIHRvdWNoIHRyb3VibGVkLiBcIllvdSBsb29rIHRvIGJlIGEgbWFuIGdvaW5nIGluIHRoZSByaWdodCBkaXJlY3Rpb24sIGJ1dCB3ZSBvbmx5IHNlbGVjdCB0aGUgYmVzdCBvZiB0aGUgYmVzdCBmb3IgU2VhbCBvciBubyBTZWFsLiBZb3VyIGNvc3R1bWUgaXMgbm90IHF1aXRlIHJlYWR5IGZvciB0aGUgYmlnIHNob3cgeWV0LicpXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyhAKVxuICAgICAgICAgICAgICAgIHdoZW4gMVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiT2gsIHdvdyFcIiBFeGNsYWltcyB0aGUgc2hvdyBtYW5hZ2VyLiBcIllvdSBsb29rIGFic29sdXRlbHkgYXdmdWwuIFlvdSBkZWZpbml0ZWx5IGhhdmUgdGhlIGxvb2sgZm9yIG91ciBzaG93LlwiIFlvdSBzdGFydCB0byBkYW5jZSBhcm91bmQsIHdob29waW5nIGFuZCBob2xsZXJpbmcsIGRlY2xhcmluZyB5b3Vyc2VsZiB0aGUgZnV0dXJlIGtpbmcgb2YgdGhlIHdvcmxkLiBcIkFuZCBJIHNlZSB5b3UgaGF2ZSB0aGUgY2hhcmlzbWEgdG8gbWF0Y2guXCIgSGUgdHVybnMgdG8gaGlzIGFzc2lzdGFudCwgXCJHZXQgdGhpcyBmZWxsYSBvbiBzdGFnZSBhdCBvbmNlLicpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoT24gU3RhZ2UhKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKE9uIFN0YWdlISknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnXCJXZWxjb21lIGJhY2sgdG8gdGhlIFNlYWwgb3IgTm8gU2VhbCwgdGhlIG1vc3QgcG9wdWxhciBnYW1lIHNob3cgdW5kZXIgdGhlIHNlYSEgSVxcJ20geW91ciB3ZWxsIHRhbm5lZCBob3N0IEplcnJ5IFppbnRlcnZhbmRlcmJpbmRlcmJhdWVyIEpyLiBMZXRcXCdzIG1lZXQgb3VyIG5leHQgY29udGVzdGFudDogU2hhcmMhIEFuIGluY3JlZGlibHkgb2Jub3hpb3VzIHlldCBwZXJzdWFzaXZlIHlvdW5nIG9jZWFuIGR3ZWxsZXIsIGhlIGxvdmVzIGFubm95aW5nIGhpcyBmcmllbmRzIGFuZCBpcyBhbHdheXMgdXAgZm9yIGEgcm91bmQgb2YgU2NyYWJibGUsIExBRElFUy4gVGltZSB0byBnZXQgc3RhcnRlZC4gTm93LCBTaGFyYyBJIGFtIGdvaW5nIHRvIHByZXNlbnQgeW91IHdpdGggYSBicmllZmNhc2UuIEluIHRoaXMgYnJpZWZjYXNlLCB0aGVyZSBtaWdodCBiZSBhIHNlYWwgb3IgdGhlcmUgbWlnaHQgbm90IGJlIGEgc2VhbC4gQW5kIEkgbmVlZCB5b3UgdG8gdGVsbCBtZSB3aGljaCBpdCBpczogU0VBTCBvciBOTyBTRUFMP1wiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzZWFsJylcbiAgICAgICAgICAgIEBwcmludCgnSmVycnkgc2xvd2x5IG9wZW5zIHRoZSBicmllZmNhc2UsIHBlZWtpbmcgaW5zaWRlIGZpcnN0IHRvIGRldGVjdCBhbnkgc2lnbnMgb2Ygc2VhbCBlbnRyYWlscyBhbmQgdGhlbi4uLicpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIEBwZXJjZW50Q2hhbmNlKDUwKVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJy4uLndlYXJpbmcgYSBmYWNlIG9mIHByYWN0aWNlZCBkaXNhcHBvaW50bWVudCBhbmQgZW1wYXRoeSwgd2hpbXBlcnMgXCJUb28gYmFkLFwiIGxldHRpbmcgdGhlIGNhc2Ugb3BlbiB0aGUgcmVzdCBvZiB0aGUgd2F5LiBBdCB0aGlzLCB5b3UgYXJlIHByb21wdGx5IHVzaGVyZWQgb2ZmIHRoZSBzdGFnZSB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3Vja2VyLicpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnLi4uZXhjaXRlZGx5IHB1bGxzIGl0IGFsbCB0aGUgd2F5IG9wZW4uIFwiSGVcXCdzIHJpZ2h0IHBlb3BsZSFcIicpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiTm93LCBsZXRcXCdzIHNlZSB5b3VyIHByaXplcy5cIiBcIlByaXplcyBpcyByaWdodCBKZXJyeSxcIiBzYXlzIGEgdm9pY2UgY29taW5nIGZyb20gbm93aGVyZSBhbmQgZXZlcnl3aGVyZSBhbGwgYXQgb25jZS4gXCJIZXJlIGFyZSBzb21lIHdvcmxkIGNsYXNzIHNlbGVjdGlvbnMgSSBwaWNrZWQgdXAgZnJvbSB0aGUgZ3JvY2VyeSBzdG9yZSBvbiB0aGUgd2F5IGhlcmUgdGhpcyBtb3JuaW5nOlwiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIlN1Y2Nlc3MgY29tZXMgaW4gY2Fucywgbm90IGluIGNhbiBub3RzLiBUaW4gY2FucyB0aGF0IGlzISBUaGF0XFwncyB3aHkgd2UgYXJlIG9mZmVyaW5nIHlvdSB0aGUgY2hvaWNlIG9mIGEgZnVsbCB3ZWVrXFwncyBzdXBwbHkgb2YgXFwnQ2FwdGFpbiBOZWRcXCdzIFBpY2tsZWQgSGVycmluZ1xcJywgb3IgXFwnTm8gSWZzIEFuZHMgb3IgQnV0dGVyXFwnIGJyYW5kIG1hcmdhcmluZSBzcHJlYWQgdHlwZSBwcm9kdWN0IGZvciB5b3VyIGNvbnN1bXB0aW9uIHBsZWFzdXJlLiAgTmF0dXJhbGx5IHlvdSBjaG9vc2UgdGhlIG1hcmdhcmluZSBiZWNhdXNlIHlvdSBhcmUgaGVhbHRoIGNvbnNjaW91cyBvciBzb21ldGhpbmcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdldEl0ZW0oJ21hcmdhcmluZScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpXG4gICAgICAgICAgICBpZiBAY29taW5nRnJvbShbJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJywgJ1dhdGVyIFdvcmxkIChHaWZ0IFNob3ApJ10pXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3UgYXJlIGJhY2sgYXQgdGhlIFdhdGVyIFdvcmxkIGdhdGUuIFRoZSBleGl0IGlzIHJpZ2h0IG92ZXIgdGhlcmUhIEp1c3QgYSBsaXR0bGUgYml0IGZ1cnRoZXIgYW5kIHlvdSBjYW4gbGVhdmUuIFBsZWFzZSBjYW4gd2UgbGVhdmUgbm93PycpXG4gICAgICAgICAgICBlbHNlIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ09oIG1hbiwgV2F0ZXIgV29ybGQhIFlvdSBsb3ZlIHRoYXQgbW92aWUuIEtldmluIENvc3RuZXIgc2hvdWxkIGhhdmUgdG90YWxseSBnb3R0ZW4gdGhlIE9zY2FyLiBXYWl0IHRoaXMgaXNuXFwndCBsaWtlIHRoYXQuIFRoaXMgaXMgV2F0ZXIgV29ybGQsIHRoZSBob21lIG9mIHRoYXQgc3R1cGlkIGtpbGxlciB3aGFsZSwgU2hhbXB1LiBXaGF0IGEgaGFjayEgT2J2aW91cyBleGl0cyBhcmUgbm9ydGggdG8gdGhlIE1hbmF0ZWUgc2hvdywgZWFzdCB0byB0aGUgZ2lmdCBzaG9wLCBhbmQgc291dGggdG8gdGhlIEFjaHRpcHVzXFwncyBnYXJkZW4uJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ09oIGdyZWF0LCBXYXRlciBXb3JsZCBhZ2Fpbi4gWW91IHdlcmUgaG9waW5nIG9uY2Ugd291bGQgYmUgZW5vdWdoIHRvIGxhc3QgeW91IGEgbGlmZXRpbWUuIE9idmlvdXMgZXhpdHMgYXJlIG5vcnRoIHRvIHRoZSBNYW5hdGVlIHNob3csIGVhc3QgdG8gdGhlIGdpZnQgc2hvcCwgYW5kIHNvdXRoIHRvIHRoZSBBY2h0aXB1c1xcJ3MgZ2FyZGVuLicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnV2VsbCwgdGhpcyBpcyBpdCB0aGUgV2F0ZXIgV29ybGQgZW50cmFuY2Ugd2hlcmUgYWxsIHlvdXIgbWFyaW5lIGRyZWFtcyBhbmQgbmlnaHRtYXJlcyBjb21lIHRydWUuIE9idmlvdXMgZXhpdHMgYXJlIG5vcnRoIHRvIHRoZSBNYW5hdGVlIHNob3csIGVhc3QgdG8gdGhlIGdpZnQgc2hvcCwgYW5kIHNvdXRoIHRvIHRoZSBBY2h0aXB1c1xcJ3MgZ2FyZGVuLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCAoTWFuYXRlZSBFeGhpYml0KScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCAoR2lmdCBTaG9wKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQWNodGlwdXNcXCdzIEdhcmRlbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCAoTWFuYXRlZSBFeGhpYml0KScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnQW5kIHRoZXJlIGl0IGlzOiBUaGUgaWxsdXN0cmlvdXMgbWFuYXRlZS4gWW91IGNhbiBzZWUgd2h5IHRoZSBzdGFuZHMgYXJlIGVtcHR5LiBUaGVyZSBhcmUgYmlnIHVtYnJlbGxhcyBhdHRhY2hlZCB0byBzb21lIHBpY25pYyB0YWJsZXM7IG5vdCBtdWNoIHRvIHNlZS4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgTWFuYXRlZSBzZXJ2aWNlIHJvb20gYW5kIHNvdXRoIHRvIHRoZSBwYXJrIGVudHJhbmNlLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdXZWxsLCB0aGUgbWFuYXRlZSBleGhpYml0IGlzIHN0aWxsIGEgZHVtcC4gQSBidW5jaCBvZiB0b3VyaXN0IGZhbWlsaWVzIGFyZSBkZXZvdXJpbmcgdGhlaXIgZm9vZCBhdCBzb21lIHRhYmxlcyB3aXRoIHVtYnJlbGxhcy4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgTWFuYXRlZSBzZXJ2aWNlIHJvb20gYW5kIHNvdXRoIHRvIHRoZSBwYXJrIGVudHJhbmNlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGVyZSBpcyBiaWcgd29vZGVuIGFyY2ggZGlzcGxheSB3aXRoIGxvdHMgb2YgcGVlbGluZyBwYWludCBzdXJyb3VuZGVkIGJ5IHlvdXIgc3RhbmRhcmQgc2VtaWNpcmNsZSBzdG9uZSBzZWF0aW5nIGFycmFuZ2VtZW50LiBTb21lIHBpY25pYyB0YWJsZXMgd2l0aCB1bWJyZWxsYXMgYXJlIG5lYXJieS4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgTWFuYXRlZSBzZXJ2aWNlIHJvb20gYW5kIHNvdXRoIHRvIHRoZSBwYXJrIGVudHJhbmNlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayB1bWJyZWxsYScpXG4gICAgICAgICAgICBAcHJpbnQoJ1doYXQsIHlvdSBoYXZlIG5ldmVyIHNlZW4gYW4gdW1icmVsbGE/IFRoZXkgYXJlIHJlZCBhbmQgd2hpdGUgYW5kIGNvdmVyZWQgaW4gYWxnYWUuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSB1bWJyZWxsYScpXG4gICAgICAgICAgICBAZ2V0SXRlbSgndW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc3RlYWx0aGlseSBhcHByb2FjaCBhbiBlbXB0eSB0YWJsZSBhbmQgc2hvdmUgaXRzIHVtYnJlbGxhIHVuZGVyIHlvdXIgZmluIGFuZCBzdHVtYmxlIGF3YXkuIEV2ZXJ5b25lIGxvb2tzIGF0IHlvdSBsaWtlIHRoaXMgaGFwcGVucyBhIGxvdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCAoTWVjaGFuaWNhbCBSb29tIFR5cGUgUGxhY2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCAoR2lmdCBTaG9wKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZW50ZXIgdGhlIFdhdGVyIFdvcmxkIGdpZnQgc2hvcC4gVGhlcmUgYXJlIGFsbCBzb3J0cyBvZiBncmVhdCBpdGVtcyBoZXJlOiBhIGdpYW50IHN0dWZmZWQgb2N0b3B1cywgZGVoeWRyYXRlZCBhc3Ryb25hdXQgZmlzaCBmb29kLCBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgYmFkZ2Ugc3RpY2tlcnMsIGFuZCBzb21lIG9mIHRoYXQgY2xheSBzYW5kIGNyYXAgdGhleSB1c2VkIHRvIGFkdmVydGlzZSBvbiBUVi4gU2VlIGFueXRoaW5nIHlvdSBsaWtlPyBXZXN0IHRvIHRoZSBwYXJrIGVudHJhbmNlLicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlcmUgYXJlIGFsbCBzb3J0cyBvZiBncmVhdCBpdGVtcyBoZXJlOiBhIGdpYW50IHN0dWZmZWQgb2N0b3B1cywgZGVoeWRyYXRlZCBhc3Ryb25hdXQgZmlzaCBmb29kLCBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgYmFkZ2Ugc3RpY2tlcnMsIGFuZCBzb21lIG9mIHRoYXQgY2xheSBzYW5kIGNyYXAgdGhleSB1c2VkIHRvIGFkdmVydGlzZSBvbiBUVi4gU2VlIGFueXRoaW5nIHlvdSBsaWtlPyBXZXN0IHRvIHRoZSBwYXJrIGVudHJhbmNlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBvY3RvcHVzJylcbiAgICAgICAgICAgIEBwcmludCgnVXN1YWxseSB5b3UgaGF2ZSB0byBrbm9jayBvdmVyIGEgc3RhY2sgb2Ygb2xkIG1pbGsgYm90dGxlcyB0byBnZXQgc3R1ZmZlZCBhbmltYWxzIG9mIHRoaXMgcXVhbGl0eS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHNhbmQnKVxuICAgICAgICAgICAgQHByaW50KCdXb3csIHlvdSByZW1lbWJlciB0aGlzIHN0dWZmLiBJdCBzYXlzIG9uIHRoZSBib3ggaXRzIHRoZSBvbmx5LXN0YXktZHJ5IHNhbmQgY3JhcCB1c2VkIGJ5IFNoYW1wdSBoaW1zZWxmLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgYmFkZ2VzJylcbiAgICAgICAgICAgIEBwcmludCgnQ29vbCEgQW5kIHlvdSBkb27igJl0IGV2ZW4gaGF2ZSB0byBjb21wbGV0ZSBhbnkgY2xhc3NlcyBpbiBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgc2Nob29sLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZmlzaCcpIG9yIEBtYXRjaGVzKCdsb29rIGZvb2QnKVxuICAgICAgICAgICAgQHByaW50KCdUaGV5IGhhdmUga2VscCwga3JpbGwsIGFsZ2FlLCBhbmQgaWNlIGNyZWFtIGZsYXZvcnMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGJhZGdlJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdiYWRnZScpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSB0YWtlIHRoZSBqdW5pb3IgbWFyaW5lIHNoZXJpZmYgYmFkZ2Ugc3RpY2tlcnMgdG8gdGhlIGNvdW50ZXIuIFRoZSBjYXNoaWVyIHNheXMgdGhleSBhcmUgb24gc2FsZSwgb25seSAxNSBmaXNoIGRvbGxhcnMsIHBsdXMgdGF4LiBZdXNzc3MuIFlvdSBwYXkgdGhlIG1hbi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgdGFrZSB0aGF0IGl0ZW0gdG8gdGhlIGNvdW50ZXIuIFRoZSBjYXNoaWVyIHNheXMgaXQgaXMgJyArICgxOCArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMwKSkudG9TdHJpbmcoKSArIFwiIGZpc2ggZG9sbGFycyBidXQgeW91IG9ubHkgaGF2ZSAje2lmIEBoYXNJdGVtKCdiYWRnZScpIHRoZW4gMiBlbHNlIDE3fSBmaXNoIGRvbGxhcnMuIE51dHMuXCIpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkIChNZWNoYW5pY2FsIFJvb20gVHlwZSBQbGFjZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1doYXQgaW4gdGhlIG5hbWUgb2YgQ2FwdGFpbiBOZW1vIGlzIHRoaXM/IFRoZXJlIGFyZSBtYW5hdGVlcyBpbiBob2lzdHMgYWxsIG92ZXIgdGhlIHJvb20gaG9va2VkIHVwIHRvLi4ubWlsa2luZyBkZXZpY2VzLiBUaGlzIGlzIG5vIG1lY2hhbmljYWwgcm9vbSEgSXRcXCdzIGEgY292ZXIgZm9yIGEgc2VjcmV0LCBpbGxlZ2FsLCB1bmRlcmdyb3VuZCwgYmxhY2sgbWFya2V0LCBidXQgcHJvYmFibHkgb3JnYW5pYywgc2VhIGNvdyBtaWxraW5nIG9wZXJhdGlvbi4gVGhlIGZpZW5kcyEgWW91IGFyZSBnb2luZyB0byBibG93IHRoZSBsaWQgb2ZmIHRoaXMgdGhpbmcgZm9yIHN1cmUuIFRoZSBzd2VhdHkgb2xkIGZpc2ggcnVubmluZyB0aGUgbWFjaGluZXJ5IGhhcyBub3Qgbm90aWNlZCB5b3UgeWV0LiBPYnZpb3VzIGV4aXRzIGFyZSBlYXN0IHRvIHRoZSBtYW5hdGVlIGV4aGliaXQuJylcbiAgICAgICAgICAgIGVsc2UgaWYgbm90IEBoYXNJdGVtKCdiYWRnZScpXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGF0IHN3ZWF0eSBvbGQgZmlzaCBpcyBzdGlsbCBnb2luZyBhdCBpdCB3aXRoIGhpcyBtYW5hdGVlIG1pbGtpbmcuIFlvdSB3b25kZXIgaWYgdGhlcmUgaXMgYW55IGtpbmQgb2YgYXV0aG9yaXR5IGhlIHdvdWxkIGJvdyB0by4gT2J2aW91cyBleGl0cyBhcmUgZWFzdCB0byB0aGUgbWFuYXRlZSBleGhpYml0LicpXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBAaGFzSXRlbSgnbWlsaycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGF0IHN3ZWF0eSBvbGQgZmlzaCBpcyBzdGlsbCBnb2luZyBhdCBpdCB3aXRoIGhpcyBtYW5hdGVlIG1pbGtpbmcuIFlvdSBmZWVsIGp1c3QgYSBmcmFnbWVudCBvZiBndWlsdCBmb3Igbm90IHR1cm5pbmcgaGltIGluLiBPYnZpb3VzIGV4aXRzIGFyZSBlYXN0IHRvIHRoZSBtYW5hdGVlIGV4aGliaXQuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIGRvZXNuXFwndCBzZWVtIHRvIGJlIGFueXRoaW5nIHlvdSBjYW4gZG8gdG8gcHV0IGEgc3RvcCB0byB0aGlzIGhvcnJpYmxlIHNpZ2h0LiBBdCBsZWFzdCB5b3UgZ290IHNvbWV0aGluZyBvdXQgb2YgaXQgdGhvdWdoLiBPYnZpb3VzIGV4aXRzIGFyZSBlYXN0IHRvIHRoZSBtYW5hdGVlIGV4aGliaXQuJylcblxuICAgICAgICBlbHNlIGlmIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ01hbmF0ZWVzIGZyb20gdGhlIGV4aGliaXQgYXJlIGFsbCBvdmVyIGluIGhvaXN0cyByaWdnZWQgdXAgdG8gbWlsa2luZyBlcXVpcG1lbnQuIEl0XFwncyBpbGxlZ2FsLCBidXQgeW91IGhhdmUgaGVhcmQgdGhlcmUgaXMgYSBmb3J0dW5lIGluIGdlbnVpbmUgc2VhIGNvdyBtaWxrLiBUaGF0IG5hc3R5IG9sZCBmaXNoIHRoZXJlIGlzIHJ1bm5pbmcgdGhlIHdob2xlIHRoaW5nLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsaycpIG9yIEBtYXRjaGVzKCdiYWRnZScpIG9yIEBtYXRjaGVzKCdzdGlja2VyJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnYmFkZ2UnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHN3aW0gdXAgdG8gdGhlIGZpc2ggYXQgdGhlIGNvbnRyb2xzLiBcIkkgYW0gZ29pbmcgdG8gc2h1dCB5b3UgZG93biFcIiBZb3Ugc2hvdXQgYXQgaGltLiBIZSBsYXVnaHMgaGVhcnRpbHkuIFwiWW91IGRvblxcJ3Qgc3RhbmQgYSBjaGFuY2UuIFlvdVxcJ3JlIGp1c3QgYSByZWd1bGFyIGd1eS4gSVxcJ20gdGhlIG1heW9yIG9mIFdhdGVyIFdvcmxkLiBXaG8gaXMgZ29pbmcgdG8gYmVsaWV2ZSB5b3U/XCIgSGUgZ29lcyBiYWNrIHRvIGhpcyB3b3JrIHBheWluZyB5b3Ugbm8gbWluZC4gSGUgaGFzIGEgcG9pbnQuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBzd2ltIHVwIHRvIHRoZSBmaXNoIGJyYW5kaXNoaW5nIHlvdXIgYmFkZ2Ugc3RpY2tlci4gXCJZb3UgYXJlIHVuZGVyIGFycmVzdCBmb3IgaWxsZWdhbCBtaWxrIGhhcnZlc3RpbmcgZnJvbSBlbmRhbmdlcmVkIG1hbmF0ZWVzLiBJXFwnbSB0YWtpbmcgeW91IGluLlwiIFwiV2FpdCxcIiBoZSBzYXlzLCBcIllvdSBkb25cXCd0IGhhdmUgdG8gZG8gdGhpcy4gSXRcXCdzIHRoZSBvbmx5IHdheSBJIGNhbiBrZWVwIFdhdGVyIFdvcmxkIHJ1bm5pbmcuIERvblxcJ3QgeW91IHNlZT8gTm93IHRoYXQgd2UgYXJlIG9uIG91ciBzaXh0aCBTaGFtcHUsIHBlb3BsZSBqdXN0IGRvblxcJ3Qgc2VlbSB0byBjYXJlIGFib3V0IHRoZSBtYWdpYyBvZiBleHBsb2l0ZWQgbWFyaW5lIG1hbW1hbHMuIEkgd2lsbCwgdWguLi5tYWtlIGl0IHdvcnRoIHlvdXIgd2hpbGUgdGhvdWdoLlwiIEhlIHNsaWRlcyBhIGZyZXNoIGJvdHRsZSBvZiBtaWxrIGluIHlvdXIgZGlyZWN0aW9uLiBXaXRob3V0IGxvb2tpbmcgYXQgeW91IGhlIHNheXMsIFwiSXQgaXMgd29ydGggdGhvdXNhbmRzIGluIHRoZSByaWdodCBtYXJrZXQuXCInKVxuICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdtaWxrJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnVGhlIEV0aGVyZWFsIFJlYWxtJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBoYXZlIGVudGVyZWQgVGhlIEV0aGVyZWFsIFJlYWxtLiBXaHkgZGlkIHlvdSBkbyB0aGF0PyBUaGF0IHdhcyBhIGJhZCBkZWNpc2lvbi4gV2FsZSBpcyBhdCB5b3VyIHNpZGUuIFRoZXJlIGFyZSBhIGJ1bmNoIG9mIHdlaXJkLCBzcGFjZXkgcGxhdGZvcm1zIGFuZCBqdW5rIGZsb2F0aW5nIGFyb3VuZCBpbiBhIGNvc21pYyB2b2lkIC0tIHlvdXIgdHlwaWNhbCBzdXJyZWFsaXN0IGRyZWFtc2NhcGUgZW52aXJvbm1lbnQuIEFoZWFkIGlzIGFuIHVnbHkgbW9uc3Rlci4gSGUgaXMgY2x1dGNoaW5nIHNvbWV0aGluZyBpbiBoaXMgaGFuZC4gT2J2aW91cyBleGl0cyBhcmUgTk9ORSEgVGhpcyBpcyB0aGUgd29ybGQgb2Ygd2FraW5nIG5pZ2h0bWFyZXMgeW91IGRpbmd1cy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrIG1vbnN0ZXInKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgYXJlIGdldHRpbmcgd29yc2UgYXQgdGhpcyBnYW1lLiBZb3UgYXBwcm9hY2ggc2FpZCBtb25zdGVyIGluIGFuIGVmZm9ydCB0byBnZXQgc29tZSBsZWFkcyBvbiB5b3VyIHByZWNpb3VzIGhhaXIgcHJvZHVjdC4gTWF5YmUgaXQgd291bGQgaGF2ZSBiZWVuIGEgYmV0dGVyIGlkZWEgdG8gc3RhcnQgYnkganVzdCBhc2tpbmcgaGltIGFib3V0IHRoZSBzdGF0dXMgb2YgdGhlIGxvY2FsIGJhc2tldGJhbGwgdGVhbSBvciBzb21ldGhpbmc/JylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQHByaW50KCdPbiBjbG9zZXIgZXhhbWluYXRpb24gdGhvdWdoLCB5b3UgcmVhbGl6ZSB0aGlzIGlzIG5vdCBqdXN0IGFueSBtb25zdGVyLiBJdCBpcyBhIFRvcnVtZWtpYW4gaHlwZXIgZ29ibGluLiBBbmQgaW4gaGlzIGdyaXNseSBwYXcgcmVzdHMgdGhlIGl0ZW0gb2YgeW91ciBxdWVzdDogeW91ciAkMjMgc2hhbXBvbyEnKVxuICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJTaGFyYywgd2UgY2FuIG5vdCBhbGxvdyBoaW0gdG8gdXNlIHRoYXQgc2hhbXBvbyxcIiB3aGlzcGVycyB5b3VyIGNvbXBhbmlvbi4gXCJPbiB0aGUgaGVhZCBvZiBhIGh5cGVyIGdvYmxpbiwgaGFpciB0aGF0IHNtb290aCBjb3VsZCBtZWFuIHRoZSBlbmQgb2YgZmFzaGlvbiBhcyB3ZSBrbm93IGl0LiBXZSBtdXN0IHJldHJpZXZlIGl0IGJ5IGFueSBtZWFucyBuZWNlc3NhcnkuXCInKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdObyBzb29uZXIgaGF2ZSB0aGUgd29yZHMgbGVmdCBXYWxlXFwncyBsaXBzIHRoYW4geW91IGFyZSBzcG90dGVkLiBUaGF0IGlzIGFsbCB0aGUgbW90aXZhdGlvbiB0aGlzIGJlYXN0IG5lZWRzLiBIZSBmbGlwcyB0aGUgY2FwIG9uIHRoZSBib3R0bGUsIHJhaXNpbmcgaXQgdG8gdGhlIGZpbHRoeSwgc3RyaW5nLWxpa2UgbW9wIHlvdSBjYW4gb25seSBhc3N1bWUgbXVzdCBiZSBoaXMgaGFpciwgYWxsIHRoZSB3aGlsZSBnYXppbmcgZG93biBhdCB5b3UgaW4gZGVmaWFuY2Ugd2l0aCBoaXMgc2luZ2xlIGJsb29kIHNob3QgZXllLicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnVGhlIEV0aGVyZWFsIFJlYWxtIChEbyBzb21ldGhpbmchKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnVGhlIEV0aGVyZWFsIFJlYWxtIChEbyBzb21ldGhpbmchKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdEbyBzb21ldGhpbmchJylcbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ3NvbWV0aGluZycpXG4gICAgICAgICAgICBAcHJpbnQoJ09oIHZlcnkgZnVubnkuICBOb3cgaXMgZGVmaW5pdGVseSBub3QgdGhlIHRpbWUgZm9yIHNuYXJrLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnYXR0YWNrJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHN0YXJ0IHRvIGx1bmdlIHRvd2FyZHMgdGhlIGNyZWF0dXJlLCBidXQgV2FsZSBwdXNoZXMgeW91IG91dCBvZiB0aGUgd2F5IGluIGEgY2hhcmdlIGhpbXNlbGYuIFlvdSBjcmluZ2UgYXMgeW91IGhlYXIgdGhlIHNsYXNoaW5nIG9mIGZsZXNoLiBSZWQgbWlzdCBmbG9hdHMgb3V0IG9mIFdhbGVcXCdzIHNpZGUuIFlvdXIgaGVhZCBpcyBzcGlubmluZy4nKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiTm93IFNoYXJjIVwiLCBoZSB3aGVlemVzLCBcIlVzZSB0aGUgcG93ZXIgb2YgdGhlIFF1YWRyYXRpYyBFeWUuXCInKVxuICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJCdXQgeW91IHNhaWQgSSB3YXNuXFwndCByZWFkeSFcIiB5b3UgY3J5LCB0cnlpbmcgbm90IHRvIGxvb2sgYXQgdGhlIHNvcnJ5IHN0YXRlIG9mIHlvdXIgZnJpZW5kLicpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiTm8sIGl0IHdhcyBJIHdobyB3YXMgbm90IHJlYWR5LiBUaGUgcC1wb3dlciBoYXMgYWx3YXlzIGJlZW4gd2l0aGluIHkteW91LlwiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdldEl0ZW0oJ3F1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnVGhlIEV0aGVyZWFsIFJlYWxtIChVc2UgdGhlIFF1YWRyYXRpYyBFeWUhKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnVGhlIEV0aGVyZWFsIFJlYWxtIChVc2UgdGhlIFF1YWRyYXRpYyBFeWUhKScsIC0+XG4gICAgICAgIGlmIEBtYXRjaGVzKCd1c2UgcXVhZHJhdGljIGV5ZScpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgncXVhZHJhdGljIGV5ZScpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0VuZCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdFbmQnLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHJlbW92ZSB0aGUgUXVhZHJhdGljIEV5ZSBmcm9tIGl0cyBjb21wYXJ0bWVudCwgY2xvc2UgeW91ciBleWVzIGFuZCBhbGxvdyB1bmlvbiBiZXR3ZWVuIHlvdXIgc3Bpcml0IGFuZCB0aGUgdW5pdmVyc2FsIGNoaSBmbG93LiBUaGVuIHRoZSBnb2JsaW4gZ2V0cyBjdXQgaW4gaGFsZiBhbmQgeW91IGdldCB5b3VyIHNoYW1wb28gYmFjay4nKVxuXG5cbiAgICBlbmdpbmUuc2V0U3RhcnRSb29tKCdXYWxlIHZzIFNoYXJjOiBUaGUgQ29taWM6IFRoZSBJbnRlcmFjdGl2ZSBTb2Z0d2FyZSBUaXRsZSBGb3IgWW91ciBDb21wdXRlciBCb3gnKVxuIiwidmFyIG0gPSAoZnVuY3Rpb24gYXBwKHdpbmRvdywgdW5kZWZpbmVkKSB7XHJcblx0dmFyIE9CSkVDVCA9IFwiW29iamVjdCBPYmplY3RdXCIsIEFSUkFZID0gXCJbb2JqZWN0IEFycmF5XVwiLCBTVFJJTkcgPSBcIltvYmplY3QgU3RyaW5nXVwiLCBGVU5DVElPTiA9IFwiZnVuY3Rpb25cIjtcclxuXHR2YXIgdHlwZSA9IHt9LnRvU3RyaW5nO1xyXG5cdHZhciBwYXJzZXIgPSAvKD86KF58I3xcXC4pKFteI1xcLlxcW1xcXV0rKSl8KFxcWy4rP1xcXSkvZywgYXR0clBhcnNlciA9IC9cXFsoLis/KSg/Oj0oXCJ8J3wpKC4qPylcXDIpP1xcXS87XHJcblx0dmFyIHZvaWRFbGVtZW50cyA9IC9eKEFSRUF8QkFTRXxCUnxDT0x8Q09NTUFORHxFTUJFRHxIUnxJTUd8SU5QVVR8S0VZR0VOfExJTkt8TUVUQXxQQVJBTXxTT1VSQ0V8VFJBQ0t8V0JSKSQvO1xyXG5cdHZhciBub29wID0gZnVuY3Rpb24oKSB7fVxyXG5cclxuXHQvLyBjYWNoaW5nIGNvbW1vbmx5IHVzZWQgdmFyaWFibGVzXHJcblx0dmFyICRkb2N1bWVudCwgJGxvY2F0aW9uLCAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lLCAkY2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcblxyXG5cdC8vIHNlbGYgaW52b2tpbmcgZnVuY3Rpb24gbmVlZGVkIGJlY2F1c2Ugb2YgdGhlIHdheSBtb2NrcyB3b3JrXHJcblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZSh3aW5kb3cpe1xyXG5cdFx0JGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cdFx0JGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xyXG5cdFx0JGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5jbGVhclRpbWVvdXQ7XHJcblx0XHQkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuc2V0VGltZW91dDtcclxuXHR9XHJcblxyXG5cdGluaXRpYWxpemUod2luZG93KTtcclxuXHJcblxyXG5cdC8qKlxyXG5cdCAqIEB0eXBlZGVmIHtTdHJpbmd9IFRhZ1xyXG5cdCAqIEEgc3RyaW5nIHRoYXQgbG9va3MgbGlrZSAtPiBkaXYuY2xhc3NuYW1lI2lkW3BhcmFtPW9uZV1bcGFyYW0yPXR3b11cclxuXHQgKiBXaGljaCBkZXNjcmliZXMgYSBET00gbm9kZVxyXG5cdCAqL1xyXG5cclxuXHQvKipcclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7VGFnfSBUaGUgRE9NIG5vZGUgdGFnXHJcblx0ICogQHBhcmFtIHtPYmplY3Q9W119IG9wdGlvbmFsIGtleS12YWx1ZSBwYWlycyB0byBiZSBtYXBwZWQgdG8gRE9NIGF0dHJzXHJcblx0ICogQHBhcmFtIHsuLi5tTm9kZT1bXX0gWmVybyBvciBtb3JlIE1pdGhyaWwgY2hpbGQgbm9kZXMuIENhbiBiZSBhbiBhcnJheSwgb3Igc3BsYXQgKG9wdGlvbmFsKVxyXG5cdCAqXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gbSgpIHtcclxuXHRcdHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdFx0dmFyIGhhc0F0dHJzID0gYXJnc1sxXSAhPSBudWxsICYmIHR5cGUuY2FsbChhcmdzWzFdKSA9PT0gT0JKRUNUICYmICEoXCJ0YWdcIiBpbiBhcmdzWzFdIHx8IFwidmlld1wiIGluIGFyZ3NbMV0pICYmICEoXCJzdWJ0cmVlXCIgaW4gYXJnc1sxXSk7XHJcblx0XHR2YXIgYXR0cnMgPSBoYXNBdHRycyA/IGFyZ3NbMV0gOiB7fTtcclxuXHRcdHZhciBjbGFzc0F0dHJOYW1lID0gXCJjbGFzc1wiIGluIGF0dHJzID8gXCJjbGFzc1wiIDogXCJjbGFzc05hbWVcIjtcclxuXHRcdHZhciBjZWxsID0ge3RhZzogXCJkaXZcIiwgYXR0cnM6IHt9fTtcclxuXHRcdHZhciBtYXRjaCwgY2xhc3NlcyA9IFtdO1xyXG5cdFx0aWYgKHR5cGUuY2FsbChhcmdzWzBdKSAhPSBTVFJJTkcpIHRocm93IG5ldyBFcnJvcihcInNlbGVjdG9yIGluIG0oc2VsZWN0b3IsIGF0dHJzLCBjaGlsZHJlbikgc2hvdWxkIGJlIGEgc3RyaW5nXCIpXHJcblx0XHR3aGlsZSAobWF0Y2ggPSBwYXJzZXIuZXhlYyhhcmdzWzBdKSkge1xyXG5cdFx0XHRpZiAobWF0Y2hbMV0gPT09IFwiXCIgJiYgbWF0Y2hbMl0pIGNlbGwudGFnID0gbWF0Y2hbMl07XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzFdID09PSBcIiNcIikgY2VsbC5hdHRycy5pZCA9IG1hdGNoWzJdO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCIuXCIpIGNsYXNzZXMucHVzaChtYXRjaFsyXSk7XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzNdWzBdID09PSBcIltcIikge1xyXG5cdFx0XHRcdHZhciBwYWlyID0gYXR0clBhcnNlci5leGVjKG1hdGNoWzNdKTtcclxuXHRcdFx0XHRjZWxsLmF0dHJzW3BhaXJbMV1dID0gcGFpclszXSB8fCAocGFpclsyXSA/IFwiXCIgOnRydWUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY2hpbGRyZW4gPSBoYXNBdHRycyA/IGFyZ3Muc2xpY2UoMikgOiBhcmdzLnNsaWNlKDEpO1xyXG5cdFx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiB0eXBlLmNhbGwoY2hpbGRyZW5bMF0pID09PSBBUlJBWSkge1xyXG5cdFx0XHRjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5bMF1cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5cclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gYXR0cnMpIHtcclxuXHRcdFx0aWYgKGF0dHJzLmhhc093blByb3BlcnR5KGF0dHJOYW1lKSkge1xyXG5cdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gY2xhc3NBdHRyTmFtZSAmJiBhdHRyc1thdHRyTmFtZV0gIT0gbnVsbCAmJiBhdHRyc1thdHRyTmFtZV0gIT09IFwiXCIpIHtcclxuXHRcdFx0XHRcdGNsYXNzZXMucHVzaChhdHRyc1thdHRyTmFtZV0pXHJcblx0XHRcdFx0XHRjZWxsLmF0dHJzW2F0dHJOYW1lXSA9IFwiXCIgLy9jcmVhdGUga2V5IGluIGNvcnJlY3QgaXRlcmF0aW9uIG9yZGVyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgY2VsbC5hdHRyc1thdHRyTmFtZV0gPSBhdHRyc1thdHRyTmFtZV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNsYXNzZXMubGVuZ3RoID4gMCkgY2VsbC5hdHRyc1tjbGFzc0F0dHJOYW1lXSA9IGNsYXNzZXMuam9pbihcIiBcIik7XHJcblx0XHRcclxuXHRcdHJldHVybiBjZWxsXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJ1aWxkKHBhcmVudEVsZW1lbnQsIHBhcmVudFRhZywgcGFyZW50Q2FjaGUsIHBhcmVudEluZGV4LCBkYXRhLCBjYWNoZWQsIHNob3VsZFJlYXR0YWNoLCBpbmRleCwgZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncykge1xyXG5cdFx0Ly9gYnVpbGRgIGlzIGEgcmVjdXJzaXZlIGZ1bmN0aW9uIHRoYXQgbWFuYWdlcyBjcmVhdGlvbi9kaWZmaW5nL3JlbW92YWwgb2YgRE9NIGVsZW1lbnRzIGJhc2VkIG9uIGNvbXBhcmlzb24gYmV0d2VlbiBgZGF0YWAgYW5kIGBjYWNoZWRgXHJcblx0XHQvL3RoZSBkaWZmIGFsZ29yaXRobSBjYW4gYmUgc3VtbWFyaXplZCBhcyB0aGlzOlxyXG5cdFx0Ly8xIC0gY29tcGFyZSBgZGF0YWAgYW5kIGBjYWNoZWRgXHJcblx0XHQvLzIgLSBpZiB0aGV5IGFyZSBkaWZmZXJlbnQsIGNvcHkgYGRhdGFgIHRvIGBjYWNoZWRgIGFuZCB1cGRhdGUgdGhlIERPTSBiYXNlZCBvbiB3aGF0IHRoZSBkaWZmZXJlbmNlIGlzXHJcblx0XHQvLzMgLSByZWN1cnNpdmVseSBhcHBseSB0aGlzIGFsZ29yaXRobSBmb3IgZXZlcnkgYXJyYXkgYW5kIGZvciB0aGUgY2hpbGRyZW4gb2YgZXZlcnkgdmlydHVhbCBlbGVtZW50XHJcblxyXG5cdFx0Ly90aGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgaXMgZXNzZW50aWFsbHkgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIHJlZHJhdydzIGBkYXRhYCBkYXRhIHN0cnVjdHVyZSwgd2l0aCBhIGZldyBhZGRpdGlvbnM6XHJcblx0XHQvLy0gYGNhY2hlZGAgYWx3YXlzIGhhcyBhIHByb3BlcnR5IGNhbGxlZCBgbm9kZXNgLCB3aGljaCBpcyBhIGxpc3Qgb2YgRE9NIGVsZW1lbnRzIHRoYXQgY29ycmVzcG9uZCB0byB0aGUgZGF0YSByZXByZXNlbnRlZCBieSB0aGUgcmVzcGVjdGl2ZSB2aXJ0dWFsIGVsZW1lbnRcclxuXHRcdC8vLSBpbiBvcmRlciB0byBzdXBwb3J0IGF0dGFjaGluZyBgbm9kZXNgIGFzIGEgcHJvcGVydHkgb2YgYGNhY2hlZGAsIGBjYWNoZWRgIGlzICphbHdheXMqIGEgbm9uLXByaW1pdGl2ZSBvYmplY3QsIGkuZS4gaWYgdGhlIGRhdGEgd2FzIGEgc3RyaW5nLCB0aGVuIGNhY2hlZCBpcyBhIFN0cmluZyBpbnN0YW5jZS4gSWYgZGF0YSB3YXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLCBjYWNoZWQgaXMgYG5ldyBTdHJpbmcoXCJcIilgXHJcblx0XHQvLy0gYGNhY2hlZCBhbHNvIGhhcyBhIGBjb25maWdDb250ZXh0YCBwcm9wZXJ0eSwgd2hpY2ggaXMgdGhlIHN0YXRlIHN0b3JhZ2Ugb2JqZWN0IGV4cG9zZWQgYnkgY29uZmlnKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpXHJcblx0XHQvLy0gd2hlbiBgY2FjaGVkYCBpcyBhbiBPYmplY3QsIGl0IHJlcHJlc2VudHMgYSB2aXJ0dWFsIGVsZW1lbnQ7IHdoZW4gaXQncyBhbiBBcnJheSwgaXQgcmVwcmVzZW50cyBhIGxpc3Qgb2YgZWxlbWVudHM7IHdoZW4gaXQncyBhIFN0cmluZywgTnVtYmVyIG9yIEJvb2xlYW4sIGl0IHJlcHJlc2VudHMgYSB0ZXh0IG5vZGVcclxuXHJcblx0XHQvL2BwYXJlbnRFbGVtZW50YCBpcyBhIERPTSBlbGVtZW50IHVzZWQgZm9yIFczQyBET00gQVBJIGNhbGxzXHJcblx0XHQvL2BwYXJlbnRUYWdgIGlzIG9ubHkgdXNlZCBmb3IgaGFuZGxpbmcgYSBjb3JuZXIgY2FzZSBmb3IgdGV4dGFyZWEgdmFsdWVzXHJcblx0XHQvL2BwYXJlbnRDYWNoZWAgaXMgdXNlZCB0byByZW1vdmUgbm9kZXMgaW4gc29tZSBtdWx0aS1ub2RlIGNhc2VzXHJcblx0XHQvL2BwYXJlbnRJbmRleGAgYW5kIGBpbmRleGAgYXJlIHVzZWQgdG8gZmlndXJlIG91dCB0aGUgb2Zmc2V0IG9mIG5vZGVzLiBUaGV5J3JlIGFydGlmYWN0cyBmcm9tIGJlZm9yZSBhcnJheXMgc3RhcnRlZCBiZWluZyBmbGF0dGVuZWQgYW5kIGFyZSBsaWtlbHkgcmVmYWN0b3JhYmxlXHJcblx0XHQvL2BkYXRhYCBhbmQgYGNhY2hlZGAgYXJlLCByZXNwZWN0aXZlbHksIHRoZSBuZXcgYW5kIG9sZCBub2RlcyBiZWluZyBkaWZmZWRcclxuXHRcdC8vYHNob3VsZFJlYXR0YWNoYCBpcyBhIGZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIGEgcGFyZW50IG5vZGUgd2FzIHJlY3JlYXRlZCAoaWYgc28sIGFuZCBpZiB0aGlzIG5vZGUgaXMgcmV1c2VkLCB0aGVuIHRoaXMgbm9kZSBtdXN0IHJlYXR0YWNoIGl0c2VsZiB0byB0aGUgbmV3IHBhcmVudClcclxuXHRcdC8vYGVkaXRhYmxlYCBpcyBhIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhbiBhbmNlc3RvciBpcyBjb250ZW50ZWRpdGFibGVcclxuXHRcdC8vYG5hbWVzcGFjZWAgaW5kaWNhdGVzIHRoZSBjbG9zZXN0IEhUTUwgbmFtZXNwYWNlIGFzIGl0IGNhc2NhZGVzIGRvd24gZnJvbSBhbiBhbmNlc3RvclxyXG5cdFx0Ly9gY29uZmlnc2AgaXMgYSBsaXN0IG9mIGNvbmZpZyBmdW5jdGlvbnMgdG8gcnVuIGFmdGVyIHRoZSB0b3Btb3N0IGBidWlsZGAgY2FsbCBmaW5pc2hlcyBydW5uaW5nXHJcblxyXG5cdFx0Ly90aGVyZSdzIGxvZ2ljIHRoYXQgcmVsaWVzIG9uIHRoZSBhc3N1bXB0aW9uIHRoYXQgbnVsbCBhbmQgdW5kZWZpbmVkIGRhdGEgYXJlIGVxdWl2YWxlbnQgdG8gZW1wdHkgc3RyaW5nc1xyXG5cdFx0Ly8tIHRoaXMgcHJldmVudHMgbGlmZWN5Y2xlIHN1cnByaXNlcyBmcm9tIHByb2NlZHVyYWwgaGVscGVycyB0aGF0IG1peCBpbXBsaWNpdCBhbmQgZXhwbGljaXQgcmV0dXJuIHN0YXRlbWVudHMgKGUuZy4gZnVuY3Rpb24gZm9vKCkge2lmIChjb25kKSByZXR1cm4gbShcImRpdlwiKX1cclxuXHRcdC8vLSBpdCBzaW1wbGlmaWVzIGRpZmZpbmcgY29kZVxyXG5cdFx0Ly9kYXRhLnRvU3RyaW5nKCkgbWlnaHQgdGhyb3cgb3IgcmV0dXJuIG51bGwgaWYgZGF0YSBpcyB0aGUgcmV0dXJuIHZhbHVlIG9mIENvbnNvbGUubG9nIGluIEZpcmVmb3ggKGJlaGF2aW9yIGRlcGVuZHMgb24gdmVyc2lvbilcclxuXHRcdHRyeSB7aWYgKGRhdGEgPT0gbnVsbCB8fCBkYXRhLnRvU3RyaW5nKCkgPT0gbnVsbCkgZGF0YSA9IFwiXCI7fSBjYXRjaCAoZSkge2RhdGEgPSBcIlwifVxyXG5cdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGNhY2hlZDtcclxuXHRcdHZhciBjYWNoZWRUeXBlID0gdHlwZS5jYWxsKGNhY2hlZCksIGRhdGFUeXBlID0gdHlwZS5jYWxsKGRhdGEpO1xyXG5cdFx0aWYgKGNhY2hlZCA9PSBudWxsIHx8IGNhY2hlZFR5cGUgIT09IGRhdGFUeXBlKSB7XHJcblx0XHRcdGlmIChjYWNoZWQgIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmIChwYXJlbnRDYWNoZSAmJiBwYXJlbnRDYWNoZS5ub2Rlcykge1xyXG5cdFx0XHRcdFx0dmFyIG9mZnNldCA9IGluZGV4IC0gcGFyZW50SW5kZXg7XHJcblx0XHRcdFx0XHR2YXIgZW5kID0gb2Zmc2V0ICsgKGRhdGFUeXBlID09PSBBUlJBWSA/IGRhdGEgOiBjYWNoZWQubm9kZXMpLmxlbmd0aDtcclxuXHRcdFx0XHRcdGNsZWFyKHBhcmVudENhY2hlLm5vZGVzLnNsaWNlKG9mZnNldCwgZW5kKSwgcGFyZW50Q2FjaGUuc2xpY2Uob2Zmc2V0LCBlbmQpKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGlmIChjYWNoZWQubm9kZXMpIGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhY2hlZCA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yO1xyXG5cdFx0XHRpZiAoY2FjaGVkLnRhZykgY2FjaGVkID0ge307IC8vaWYgY29uc3RydWN0b3IgY3JlYXRlcyBhIHZpcnR1YWwgZG9tIGVsZW1lbnQsIHVzZSBhIGJsYW5rIG9iamVjdCBhcyB0aGUgYmFzZSBjYWNoZWQgbm9kZSBpbnN0ZWFkIG9mIGNvcHlpbmcgdGhlIHZpcnR1YWwgZWwgKCMyNzcpXHJcblx0XHRcdGNhY2hlZC5ub2RlcyA9IFtdXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGFUeXBlID09PSBBUlJBWSkge1xyXG5cdFx0XHQvL3JlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRpZiAodHlwZS5jYWxsKGRhdGFbaV0pID09PSBBUlJBWSkge1xyXG5cdFx0XHRcdFx0ZGF0YSA9IGRhdGEuY29uY2F0LmFwcGx5KFtdLCBkYXRhKTtcclxuXHRcdFx0XHRcdGktLSAvL2NoZWNrIGN1cnJlbnQgaW5kZXggYWdhaW4gYW5kIGZsYXR0ZW4gdW50aWwgdGhlcmUgYXJlIG5vIG1vcmUgbmVzdGVkIGFycmF5cyBhdCB0aGF0IGluZGV4XHJcblx0XHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0dmFyIG5vZGVzID0gW10sIGludGFjdCA9IGNhY2hlZC5sZW5ndGggPT09IGRhdGEubGVuZ3RoLCBzdWJBcnJheUNvdW50ID0gMDtcclxuXHJcblx0XHRcdC8va2V5cyBhbGdvcml0aG06IHNvcnQgZWxlbWVudHMgd2l0aG91dCByZWNyZWF0aW5nIHRoZW0gaWYga2V5cyBhcmUgcHJlc2VudFxyXG5cdFx0XHQvLzEpIGNyZWF0ZSBhIG1hcCBvZiBhbGwgZXhpc3Rpbmcga2V5cywgYW5kIG1hcmsgYWxsIGZvciBkZWxldGlvblxyXG5cdFx0XHQvLzIpIGFkZCBuZXcga2V5cyB0byBtYXAgYW5kIG1hcmsgdGhlbSBmb3IgYWRkaXRpb25cclxuXHRcdFx0Ly8zKSBpZiBrZXkgZXhpc3RzIGluIG5ldyBsaXN0LCBjaGFuZ2UgYWN0aW9uIGZyb20gZGVsZXRpb24gdG8gYSBtb3ZlXHJcblx0XHRcdC8vNCkgZm9yIGVhY2gga2V5LCBoYW5kbGUgaXRzIGNvcnJlc3BvbmRpbmcgYWN0aW9uIGFzIG1hcmtlZCBpbiBwcmV2aW91cyBzdGVwc1xyXG5cdFx0XHR2YXIgREVMRVRJT04gPSAxLCBJTlNFUlRJT04gPSAyICwgTU9WRSA9IDM7XHJcblx0XHRcdHZhciBleGlzdGluZyA9IHt9LCBzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSBmYWxzZTtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjYWNoZWQubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkW2ldICYmIGNhY2hlZFtpXS5hdHRycyAmJiBjYWNoZWRbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdHNob3VsZE1haW50YWluSWRlbnRpdGllcyA9IHRydWU7XHJcblx0XHRcdFx0XHRleGlzdGluZ1tjYWNoZWRbaV0uYXR0cnMua2V5XSA9IHthY3Rpb246IERFTEVUSU9OLCBpbmRleDogaX1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHZhciBndWlkID0gMFxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMgJiYgZGF0YVtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaiA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRhdGFbal0gJiYgZGF0YVtqXS5hdHRycyAmJiBkYXRhW2pdLmF0dHJzLmtleSA9PSBudWxsKSBkYXRhW2pdLmF0dHJzLmtleSA9IFwiX19taXRocmlsX19cIiArIGd1aWQrK1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGlmIChzaG91bGRNYWludGFpbklkZW50aXRpZXMpIHtcclxuXHRcdFx0XHR2YXIga2V5c0RpZmZlciA9IGZhbHNlXHJcblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoICE9IGNhY2hlZC5sZW5ndGgpIGtleXNEaWZmZXIgPSB0cnVlXHJcblx0XHRcdFx0ZWxzZSBmb3IgKHZhciBpID0gMCwgY2FjaGVkQ2VsbCwgZGF0YUNlbGw7IGNhY2hlZENlbGwgPSBjYWNoZWRbaV0sIGRhdGFDZWxsID0gZGF0YVtpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAoY2FjaGVkQ2VsbC5hdHRycyAmJiBkYXRhQ2VsbC5hdHRycyAmJiBjYWNoZWRDZWxsLmF0dHJzLmtleSAhPSBkYXRhQ2VsbC5hdHRycy5rZXkpIHtcclxuXHRcdFx0XHRcdFx0a2V5c0RpZmZlciA9IHRydWVcclxuXHRcdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGtleXNEaWZmZXIpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoZGF0YVtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGtleSA9IGRhdGFbaV0uYXR0cnMua2V5O1xyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFleGlzdGluZ1trZXldKSBleGlzdGluZ1trZXldID0ge2FjdGlvbjogSU5TRVJUSU9OLCBpbmRleDogaX07XHJcblx0XHRcdFx0XHRcdFx0XHRlbHNlIGV4aXN0aW5nW2tleV0gPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbjogTU9WRSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0aW5kZXg6IGksXHJcblx0XHRcdFx0XHRcdFx0XHRcdGZyb206IGV4aXN0aW5nW2tleV0uaW5kZXgsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQ6IGNhY2hlZC5ub2Rlc1tleGlzdGluZ1trZXldLmluZGV4XSB8fCAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dmFyIGFjdGlvbnMgPSBbXVxyXG5cdFx0XHRcdFx0Zm9yICh2YXIgcHJvcCBpbiBleGlzdGluZykgYWN0aW9ucy5wdXNoKGV4aXN0aW5nW3Byb3BdKVxyXG5cdFx0XHRcdFx0dmFyIGNoYW5nZXMgPSBhY3Rpb25zLnNvcnQoc29ydENoYW5nZXMpO1xyXG5cdFx0XHRcdFx0dmFyIG5ld0NhY2hlZCA9IG5ldyBBcnJheShjYWNoZWQubGVuZ3RoKVxyXG5cdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzID0gY2FjaGVkLm5vZGVzLnNsaWNlKClcclxuXHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY2hhbmdlOyBjaGFuZ2UgPSBjaGFuZ2VzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IERFTEVUSU9OKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2xlYXIoY2FjaGVkW2NoYW5nZS5pbmRleF0ubm9kZXMsIGNhY2hlZFtjaGFuZ2UuaW5kZXhdKTtcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQuc3BsaWNlKGNoYW5nZS5pbmRleCwgMSlcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gSU5TRVJUSU9OKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGR1bW15ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcblx0XHRcdFx0XHRcdFx0ZHVtbXkua2V5ID0gZGF0YVtjaGFuZ2UuaW5kZXhdLmF0dHJzLmtleTtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShkdW1teSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gfHwgbnVsbCk7XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShjaGFuZ2UuaW5kZXgsIDAsIHthdHRyczoge2tleTogZGF0YVtjaGFuZ2UuaW5kZXhdLmF0dHJzLmtleX0sIG5vZGVzOiBbZHVtbXldfSlcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbY2hhbmdlLmluZGV4XSA9IGR1bW15XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBNT1ZFKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdICE9PSBjaGFuZ2UuZWxlbWVudCAmJiBjaGFuZ2UuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoY2hhbmdlLmVsZW1lbnQsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZFtjaGFuZ2UuaW5kZXhdID0gY2FjaGVkW2NoYW5nZS5mcm9tXVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5ub2Rlc1tjaGFuZ2UuaW5kZXhdID0gY2hhbmdlLmVsZW1lbnRcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Y2FjaGVkID0gbmV3Q2FjaGVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvL2VuZCBrZXkgYWxnb3JpdGhtXHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgY2FjaGVDb3VudCA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHQvL2RpZmYgZWFjaCBpdGVtIGluIHRoZSBhcnJheVxyXG5cdFx0XHRcdHZhciBpdGVtID0gYnVpbGQocGFyZW50RWxlbWVudCwgcGFyZW50VGFnLCBjYWNoZWQsIGluZGV4LCBkYXRhW2ldLCBjYWNoZWRbY2FjaGVDb3VudF0sIHNob3VsZFJlYXR0YWNoLCBpbmRleCArIHN1YkFycmF5Q291bnQgfHwgc3ViQXJyYXlDb3VudCwgZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncyk7XHJcblx0XHRcdFx0aWYgKGl0ZW0gPT09IHVuZGVmaW5lZCkgY29udGludWU7XHJcblx0XHRcdFx0aWYgKCFpdGVtLm5vZGVzLmludGFjdCkgaW50YWN0ID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKGl0ZW0uJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdC8vZml4IG9mZnNldCBvZiBuZXh0IGVsZW1lbnQgaWYgaXRlbSB3YXMgYSB0cnVzdGVkIHN0cmluZyB3LyBtb3JlIHRoYW4gb25lIGh0bWwgZWxlbWVudFxyXG5cdFx0XHRcdFx0Ly90aGUgZmlyc3QgY2xhdXNlIGluIHRoZSByZWdleHAgbWF0Y2hlcyBlbGVtZW50c1xyXG5cdFx0XHRcdFx0Ly90aGUgc2Vjb25kIGNsYXVzZSAoYWZ0ZXIgdGhlIHBpcGUpIG1hdGNoZXMgdGV4dCBub2Rlc1xyXG5cdFx0XHRcdFx0c3ViQXJyYXlDb3VudCArPSAoaXRlbS5tYXRjaCgvPFteXFwvXXxcXD5cXHMqW148XS9nKSB8fCBbMF0pLmxlbmd0aFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHN1YkFycmF5Q291bnQgKz0gdHlwZS5jYWxsKGl0ZW0pID09PSBBUlJBWSA/IGl0ZW0ubGVuZ3RoIDogMTtcclxuXHRcdFx0XHRjYWNoZWRbY2FjaGVDb3VudCsrXSA9IGl0ZW1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWludGFjdCkge1xyXG5cdFx0XHRcdC8vZGlmZiB0aGUgYXJyYXkgaXRzZWxmXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Ly91cGRhdGUgdGhlIGxpc3Qgb2YgRE9NIG5vZGVzIGJ5IGNvbGxlY3RpbmcgdGhlIG5vZGVzIGZyb20gZWFjaCBpdGVtXHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChjYWNoZWRbaV0gIT0gbnVsbCkgbm9kZXMucHVzaC5hcHBseShub2RlcywgY2FjaGVkW2ldLm5vZGVzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvL3JlbW92ZSBpdGVtcyBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5IGlmIHRoZSBuZXcgYXJyYXkgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQgb25lXHJcblx0XHRcdFx0Ly9pZiBlcnJvcnMgZXZlciBoYXBwZW4gaGVyZSwgdGhlIGlzc3VlIGlzIG1vc3QgbGlrZWx5IGEgYnVnIGluIHRoZSBjb25zdHJ1Y3Rpb24gb2YgdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlIHNvbWV3aGVyZSBlYXJsaWVyIGluIHRoZSBwcm9ncmFtXHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIG5vZGU7IG5vZGUgPSBjYWNoZWQubm9kZXNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKG5vZGUucGFyZW50Tm9kZSAhPSBudWxsICYmIG5vZGVzLmluZGV4T2Yobm9kZSkgPCAwKSBjbGVhcihbbm9kZV0sIFtjYWNoZWRbaV1dKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggPCBjYWNoZWQubGVuZ3RoKSBjYWNoZWQubGVuZ3RoID0gZGF0YS5sZW5ndGg7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoZGF0YSAhPSBudWxsICYmIGRhdGFUeXBlID09PSBPQkpFQ1QpIHtcclxuXHRcdFx0dmFyIHZpZXdzID0gW10sIGNvbnRyb2xsZXJzID0gW11cclxuXHRcdFx0d2hpbGUgKGRhdGEudmlldykge1xyXG5cdFx0XHRcdHZhciB2aWV3ID0gZGF0YS52aWV3LiRvcmlnaW5hbCB8fCBkYXRhLnZpZXdcclxuXHRcdFx0XHR2YXIgY29udHJvbGxlckluZGV4ID0gbS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImRpZmZcIiAmJiBjYWNoZWQudmlld3MgPyBjYWNoZWQudmlld3MuaW5kZXhPZih2aWV3KSA6IC0xXHJcblx0XHRcdFx0dmFyIGNvbnRyb2xsZXIgPSBjb250cm9sbGVySW5kZXggPiAtMSA/IGNhY2hlZC5jb250cm9sbGVyc1tjb250cm9sbGVySW5kZXhdIDogbmV3IChkYXRhLmNvbnRyb2xsZXIgfHwgbm9vcClcclxuXHRcdFx0XHR2YXIga2V5ID0gZGF0YSAmJiBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMua2V5XHJcblx0XHRcdFx0ZGF0YSA9IHBlbmRpbmdSZXF1ZXN0cyA9PSAwIHx8IChjYWNoZWQgJiYgY2FjaGVkLmNvbnRyb2xsZXJzICYmIGNhY2hlZC5jb250cm9sbGVycy5pbmRleE9mKGNvbnRyb2xsZXIpID4gLTEpID8gZGF0YS52aWV3KGNvbnRyb2xsZXIpIDoge3RhZzogXCJwbGFjZWhvbGRlclwifVxyXG5cdFx0XHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWQ7XHJcblx0XHRcdFx0aWYgKGtleSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkYXRhLmF0dHJzKSBkYXRhLmF0dHJzID0ge31cclxuXHRcdFx0XHRcdGRhdGEuYXR0cnMua2V5ID0ga2V5XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjb250cm9sbGVyLm9udW5sb2FkKSB1bmxvYWRlcnMucHVzaCh7Y29udHJvbGxlcjogY29udHJvbGxlciwgaGFuZGxlcjogY29udHJvbGxlci5vbnVubG9hZH0pXHJcblx0XHRcdFx0dmlld3MucHVzaCh2aWV3KVxyXG5cdFx0XHRcdGNvbnRyb2xsZXJzLnB1c2goY29udHJvbGxlcilcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWRhdGEudGFnICYmIGNvbnRyb2xsZXJzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiQ29tcG9uZW50IHRlbXBsYXRlIG11c3QgcmV0dXJuIGEgdmlydHVhbCBlbGVtZW50LCBub3QgYW4gYXJyYXksIHN0cmluZywgZXRjLlwiKVxyXG5cdFx0XHRpZiAoIWRhdGEuYXR0cnMpIGRhdGEuYXR0cnMgPSB7fTtcclxuXHRcdFx0aWYgKCFjYWNoZWQuYXR0cnMpIGNhY2hlZC5hdHRycyA9IHt9O1xyXG5cclxuXHRcdFx0dmFyIGRhdGFBdHRyS2V5cyA9IE9iamVjdC5rZXlzKGRhdGEuYXR0cnMpXHJcblx0XHRcdHZhciBoYXNLZXlzID0gZGF0YUF0dHJLZXlzLmxlbmd0aCA+IChcImtleVwiIGluIGRhdGEuYXR0cnMgPyAxIDogMClcclxuXHRcdFx0Ly9pZiBhbiBlbGVtZW50IGlzIGRpZmZlcmVudCBlbm91Z2ggZnJvbSB0aGUgb25lIGluIGNhY2hlLCByZWNyZWF0ZSBpdFxyXG5cdFx0XHRpZiAoZGF0YS50YWcgIT0gY2FjaGVkLnRhZyB8fCBkYXRhQXR0cktleXMuc29ydCgpLmpvaW4oKSAhPSBPYmplY3Qua2V5cyhjYWNoZWQuYXR0cnMpLnNvcnQoKS5qb2luKCkgfHwgZGF0YS5hdHRycy5pZCAhPSBjYWNoZWQuYXR0cnMuaWQgfHwgZGF0YS5hdHRycy5rZXkgIT0gY2FjaGVkLmF0dHJzLmtleSB8fCAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImFsbFwiICYmICghY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluICE9PSB0cnVlKSkgfHwgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJkaWZmXCIgJiYgY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluID09PSBmYWxzZSkpIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCkgY2xlYXIoY2FjaGVkLm5vZGVzKTtcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgdHlwZW9mIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID09PSBGVU5DVElPTikgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQoKVxyXG5cdFx0XHRcdGlmIChjYWNoZWQuY29udHJvbGxlcnMpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY2FjaGVkLmNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjb250cm9sbGVyLm9udW5sb2FkID09PSBGVU5DVElPTikgY29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZS5jYWxsKGRhdGEudGFnKSAhPSBTVFJJTkcpIHJldHVybjtcclxuXHJcblx0XHRcdHZhciBub2RlLCBpc05ldyA9IGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDA7XHJcblx0XHRcdGlmIChkYXRhLmF0dHJzLnhtbG5zKSBuYW1lc3BhY2UgPSBkYXRhLmF0dHJzLnhtbG5zO1xyXG5cdFx0XHRlbHNlIGlmIChkYXRhLnRhZyA9PT0gXCJzdmdcIikgbmFtZXNwYWNlID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiO1xyXG5cdFx0XHRlbHNlIGlmIChkYXRhLnRhZyA9PT0gXCJtYXRoXCIpIG5hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTFwiO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKGlzTmV3KSB7XHJcblx0XHRcdFx0aWYgKGRhdGEuYXR0cnMuaXMpIG5vZGUgPSBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCA/ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKSA6ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBkYXRhLnRhZywgZGF0YS5hdHRycy5pcyk7XHJcblx0XHRcdFx0ZWxzZSBub2RlID0gbmFtZXNwYWNlID09PSB1bmRlZmluZWQgPyAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZykgOiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcpO1xyXG5cdFx0XHRcdGNhY2hlZCA9IHtcclxuXHRcdFx0XHRcdHRhZzogZGF0YS50YWcsXHJcblx0XHRcdFx0XHQvL3NldCBhdHRyaWJ1dGVzIGZpcnN0LCB0aGVuIGNyZWF0ZSBjaGlsZHJlblxyXG5cdFx0XHRcdFx0YXR0cnM6IGhhc0tleXMgPyBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCB7fSwgbmFtZXNwYWNlKSA6IGRhdGEuYXR0cnMsXHJcblx0XHRcdFx0XHRjaGlsZHJlbjogZGF0YS5jaGlsZHJlbiAhPSBudWxsICYmIGRhdGEuY2hpbGRyZW4ubGVuZ3RoID4gMCA/XHJcblx0XHRcdFx0XHRcdGJ1aWxkKG5vZGUsIGRhdGEudGFnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZGF0YS5jaGlsZHJlbiwgY2FjaGVkLmNoaWxkcmVuLCB0cnVlLCAwLCBkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKSA6XHJcblx0XHRcdFx0XHRcdGRhdGEuY2hpbGRyZW4sXHJcblx0XHRcdFx0XHRub2RlczogW25vZGVdXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRjYWNoZWQudmlld3MgPSB2aWV3c1xyXG5cdFx0XHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCAmJiBjb250cm9sbGVyLm9udW5sb2FkLiRvbGQpIGNvbnRyb2xsZXIub251bmxvYWQgPSBjb250cm9sbGVyLm9udW5sb2FkLiRvbGRcclxuXHRcdFx0XHRcdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyAmJiBjb250cm9sbGVyLm9udW5sb2FkKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIG9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZFxyXG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQgPSBub29wXHJcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZC4kb2xkID0gb251bmxvYWRcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNoaWxkcmVuICYmICFjYWNoZWQuY2hpbGRyZW4ubm9kZXMpIGNhY2hlZC5jaGlsZHJlbi5ub2RlcyA9IFtdO1xyXG5cdFx0XHRcdC8vZWRnZSBjYXNlOiBzZXR0aW5nIHZhbHVlIG9uIDxzZWxlY3Q+IGRvZXNuJ3Qgd29yayBiZWZvcmUgY2hpbGRyZW4gZXhpc3QsIHNvIHNldCBpdCBhZ2FpbiBhZnRlciBjaGlsZHJlbiBoYXZlIGJlZW4gY3JlYXRlZFxyXG5cdFx0XHRcdGlmIChkYXRhLnRhZyA9PT0gXCJzZWxlY3RcIiAmJiBcInZhbHVlXCIgaW4gZGF0YS5hdHRycykgc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywge3ZhbHVlOiBkYXRhLmF0dHJzLnZhbHVlfSwge30sIG5hbWVzcGFjZSk7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdG5vZGUgPSBjYWNoZWQubm9kZXNbMF07XHJcblx0XHRcdFx0aWYgKGhhc0tleXMpIHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMsIGNhY2hlZC5hdHRycywgbmFtZXNwYWNlKTtcclxuXHRcdFx0XHRjYWNoZWQuY2hpbGRyZW4gPSBidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgZmFsc2UsIDAsIGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2Rlcy5pbnRhY3QgPSB0cnVlO1xyXG5cdFx0XHRcdGlmIChjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdFx0XHRjYWNoZWQuY29udHJvbGxlcnMgPSBjb250cm9sbGVyc1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoc2hvdWxkUmVhdHRhY2ggPT09IHRydWUgJiYgbm9kZSAhPSBudWxsKSBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2RlLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdH1cclxuXHRcdFx0Ly9zY2hlZHVsZSBjb25maWdzIHRvIGJlIGNhbGxlZC4gVGhleSBhcmUgY2FsbGVkIGFmdGVyIGBidWlsZGAgZmluaXNoZXMgcnVubmluZ1xyXG5cdFx0XHRpZiAodHlwZW9mIGRhdGEuYXR0cnNbXCJjb25maWdcIl0gPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0dmFyIGNvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0IHx8IHt9O1xyXG5cclxuXHRcdFx0XHQvLyBiaW5kXHJcblx0XHRcdFx0dmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZGF0YSwgYXJncykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZGF0YS5hdHRyc1tcImNvbmZpZ1wiXS5hcHBseShkYXRhLCBhcmdzKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0Y29uZmlncy5wdXNoKGNhbGxiYWNrKGRhdGEsIFtub2RlLCAhaXNOZXcsIGNvbnRleHQsIGNhY2hlZF0pKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0eXBlb2YgZGF0YSAhPSBGVU5DVElPTikge1xyXG5cdFx0XHQvL2hhbmRsZSB0ZXh0IG5vZGVzXHJcblx0XHRcdHZhciBub2RlcztcclxuXHRcdFx0aWYgKGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDApIHtcclxuXHRcdFx0XHRpZiAoZGF0YS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRcdFx0bm9kZXMgPSBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV07XHJcblx0XHRcdFx0XHRpZiAoIXBhcmVudEVsZW1lbnQubm9kZU5hbWUubWF0Y2godm9pZEVsZW1lbnRzKSkgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZXNbMF0sIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gXCJzdHJpbmcgbnVtYmVyIGJvb2xlYW5cIi5pbmRleE9mKHR5cGVvZiBkYXRhKSA+IC0xID8gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSkgOiBkYXRhO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLnZhbHVlT2YoKSAhPT0gZGF0YS52YWx1ZU9mKCkgfHwgc2hvdWxkUmVhdHRhY2ggPT09IHRydWUpIHtcclxuXHRcdFx0XHRub2RlcyA9IGNhY2hlZC5ub2RlcztcclxuXHRcdFx0XHRpZiAoIWVkaXRhYmxlIHx8IGVkaXRhYmxlICE9PSAkZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdFx0Y2xlYXIobm9kZXMsIGNhY2hlZCk7XHJcblx0XHRcdFx0XHRcdG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHQvL2Nvcm5lciBjYXNlOiByZXBsYWNpbmcgdGhlIG5vZGVWYWx1ZSBvZiBhIHRleHQgbm9kZSB0aGF0IGlzIGEgY2hpbGQgb2YgYSB0ZXh0YXJlYS9jb250ZW50ZWRpdGFibGUgZG9lc24ndCB3b3JrXHJcblx0XHRcdFx0XHRcdC8vd2UgbmVlZCB0byB1cGRhdGUgdGhlIHZhbHVlIHByb3BlcnR5IG9mIHRoZSBwYXJlbnQgdGV4dGFyZWEgb3IgdGhlIGlubmVySFRNTCBvZiB0aGUgY29udGVudGVkaXRhYmxlIGVsZW1lbnQgaW5zdGVhZFxyXG5cdFx0XHRcdFx0XHRpZiAocGFyZW50VGFnID09PSBcInRleHRhcmVhXCIpIHBhcmVudEVsZW1lbnQudmFsdWUgPSBkYXRhO1xyXG5cdFx0XHRcdFx0XHRlbHNlIGlmIChlZGl0YWJsZSkgZWRpdGFibGUuaW5uZXJIVE1MID0gZGF0YTtcclxuXHRcdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKG5vZGVzWzBdLm5vZGVUeXBlID09PSAxIHx8IG5vZGVzLmxlbmd0aCA+IDEpIHsgLy93YXMgYSB0cnVzdGVkIHN0cmluZ1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpO1xyXG5cdFx0XHRcdFx0XHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2Rlc1swXSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKTtcclxuXHRcdFx0XHRcdFx0XHRub2Rlc1swXS5ub2RlVmFsdWUgPSBkYXRhXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSk7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGNhY2hlZC5ub2Rlcy5pbnRhY3QgPSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHRmdW5jdGlvbiBzb3J0Q2hhbmdlcyhhLCBiKSB7cmV0dXJuIGEuYWN0aW9uIC0gYi5hY3Rpb24gfHwgYS5pbmRleCAtIGIuaW5kZXh9XHJcblx0ZnVuY3Rpb24gc2V0QXR0cmlidXRlcyhub2RlLCB0YWcsIGRhdGFBdHRycywgY2FjaGVkQXR0cnMsIG5hbWVzcGFjZSkge1xyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gZGF0YUF0dHJzKSB7XHJcblx0XHRcdHZhciBkYXRhQXR0ciA9IGRhdGFBdHRyc1thdHRyTmFtZV07XHJcblx0XHRcdHZhciBjYWNoZWRBdHRyID0gY2FjaGVkQXR0cnNbYXR0ck5hbWVdO1xyXG5cdFx0XHRpZiAoIShhdHRyTmFtZSBpbiBjYWNoZWRBdHRycykgfHwgKGNhY2hlZEF0dHIgIT09IGRhdGFBdHRyKSkge1xyXG5cdFx0XHRcdGNhY2hlZEF0dHJzW2F0dHJOYW1lXSA9IGRhdGFBdHRyO1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvL2Bjb25maWdgIGlzbid0IGEgcmVhbCBhdHRyaWJ1dGVzLCBzbyBpZ25vcmUgaXRcclxuXHRcdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gXCJjb25maWdcIiB8fCBhdHRyTmFtZSA9PSBcImtleVwiKSBjb250aW51ZTtcclxuXHRcdFx0XHRcdC8vaG9vayBldmVudCBoYW5kbGVycyB0byB0aGUgYXV0by1yZWRyYXdpbmcgc3lzdGVtXHJcblx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgZGF0YUF0dHIgPT09IEZVTkNUSU9OICYmIGF0dHJOYW1lLmluZGV4T2YoXCJvblwiKSA9PT0gMCkge1xyXG5cdFx0XHRcdFx0XHRub2RlW2F0dHJOYW1lXSA9IGF1dG9yZWRyYXcoZGF0YUF0dHIsIG5vZGUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBgc3R5bGU6IHsuLi59YFxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwic3R5bGVcIiAmJiBkYXRhQXR0ciAhPSBudWxsICYmIHR5cGUuY2FsbChkYXRhQXR0cikgPT09IE9CSkVDVCkge1xyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBydWxlIGluIGRhdGFBdHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNhY2hlZEF0dHIgPT0gbnVsbCB8fCBjYWNoZWRBdHRyW3J1bGVdICE9PSBkYXRhQXR0cltydWxlXSkgbm9kZS5zdHlsZVtydWxlXSA9IGRhdGFBdHRyW3J1bGVdXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcnVsZSBpbiBjYWNoZWRBdHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCEocnVsZSBpbiBkYXRhQXR0cikpIG5vZGUuc3R5bGVbcnVsZV0gPSBcIlwiXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIFNWR1xyXG5cdFx0XHRcdFx0ZWxzZSBpZiAobmFtZXNwYWNlICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBcImhyZWZcIikgbm9kZS5zZXRBdHRyaWJ1dGVOUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiwgXCJocmVmXCIsIGRhdGFBdHRyKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwiY2xhc3NOYW1lXCIpIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgZGF0YUF0dHIpO1xyXG5cdFx0XHRcdFx0XHRlbHNlIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIGNhc2VzIHRoYXQgYXJlIHByb3BlcnRpZXMgKGJ1dCBpZ25vcmUgY2FzZXMgd2hlcmUgd2Ugc2hvdWxkIHVzZSBzZXRBdHRyaWJ1dGUgaW5zdGVhZClcclxuXHRcdFx0XHRcdC8vLSBsaXN0IGFuZCBmb3JtIGFyZSB0eXBpY2FsbHkgdXNlZCBhcyBzdHJpbmdzLCBidXQgYXJlIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4ganNcclxuXHRcdFx0XHRcdC8vLSB3aGVuIHVzaW5nIENTUyBzZWxlY3RvcnMgKGUuZy4gYG0oXCJbc3R5bGU9JyddXCIpYCksIHN0eWxlIGlzIHVzZWQgYXMgYSBzdHJpbmcsIGJ1dCBpdCdzIGFuIG9iamVjdCBpbiBqc1xyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgaW4gbm9kZSAmJiAhKGF0dHJOYW1lID09PSBcImxpc3RcIiB8fCBhdHRyTmFtZSA9PT0gXCJzdHlsZVwiIHx8IGF0dHJOYW1lID09PSBcImZvcm1cIiB8fCBhdHRyTmFtZSA9PT0gXCJ0eXBlXCIgfHwgYXR0ck5hbWUgPT09IFwid2lkdGhcIiB8fCBhdHRyTmFtZSA9PT0gXCJoZWlnaHRcIikpIHtcclxuXHRcdFx0XHRcdFx0Ly8jMzQ4IGRvbid0IHNldCB0aGUgdmFsdWUgaWYgbm90IG5lZWRlZCBvdGhlcndpc2UgY3Vyc29yIHBsYWNlbWVudCBicmVha3MgaW4gQ2hyb21lXHJcblx0XHRcdFx0XHRcdGlmICh0YWcgIT09IFwiaW5wdXRcIiB8fCBub2RlW2F0dHJOYW1lXSAhPT0gZGF0YUF0dHIpIG5vZGVbYXR0ck5hbWVdID0gZGF0YUF0dHJcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Ugbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRhdGFBdHRyKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0Ly9zd2FsbG93IElFJ3MgaW52YWxpZCBhcmd1bWVudCBlcnJvcnMgdG8gbWltaWMgSFRNTCdzIGZhbGxiYWNrLXRvLWRvaW5nLW5vdGhpbmctb24taW52YWxpZC1hdHRyaWJ1dGVzIGJlaGF2aW9yXHJcblx0XHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJJbnZhbGlkIGFyZ3VtZW50XCIpIDwgMCkgdGhyb3cgZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvLyMzNDggZGF0YUF0dHIgbWF5IG5vdCBiZSBhIHN0cmluZywgc28gdXNlIGxvb3NlIGNvbXBhcmlzb24gKGRvdWJsZSBlcXVhbCkgaW5zdGVhZCBvZiBzdHJpY3QgKHRyaXBsZSBlcXVhbClcclxuXHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwidmFsdWVcIiAmJiB0YWcgPT09IFwiaW5wdXRcIiAmJiBub2RlLnZhbHVlICE9IGRhdGFBdHRyKSB7XHJcblx0XHRcdFx0bm9kZS52YWx1ZSA9IGRhdGFBdHRyXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBjYWNoZWRBdHRyc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBjbGVhcihub2RlcywgY2FjaGVkKSB7XHJcblx0XHRmb3IgKHZhciBpID0gbm9kZXMubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcclxuXHRcdFx0aWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLnBhcmVudE5vZGUpIHtcclxuXHRcdFx0XHR0cnkge25vZGVzW2ldLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZXNbaV0pfVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7fSAvL2lnbm9yZSBpZiB0aGlzIGZhaWxzIGR1ZSB0byBvcmRlciBvZiBldmVudHMgKHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIxOTI2MDgzL2ZhaWxlZC10by1leGVjdXRlLXJlbW92ZWNoaWxkLW9uLW5vZGUpXHJcblx0XHRcdFx0Y2FjaGVkID0gW10uY29uY2F0KGNhY2hlZCk7XHJcblx0XHRcdFx0aWYgKGNhY2hlZFtpXSkgdW5sb2FkKGNhY2hlZFtpXSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKG5vZGVzLmxlbmd0aCAhPSAwKSBub2Rlcy5sZW5ndGggPSAwXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHVubG9hZChjYWNoZWQpIHtcclxuXHRcdGlmIChjYWNoZWQuY29uZmlnQ29udGV4dCAmJiB0eXBlb2YgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKCk7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNhY2hlZC5jb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjb250cm9sbGVyLm9udW5sb2FkID09PSBGVU5DVElPTikgY29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jaGlsZHJlbikge1xyXG5cdFx0XHRpZiAodHlwZS5jYWxsKGNhY2hlZC5jaGlsZHJlbikgPT09IEFSUkFZKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNoaWxkOyBjaGlsZCA9IGNhY2hlZC5jaGlsZHJlbltpXTsgaSsrKSB1bmxvYWQoY2hpbGQpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLmNoaWxkcmVuLnRhZykgdW5sb2FkKGNhY2hlZC5jaGlsZHJlbilcclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSkge1xyXG5cdFx0dmFyIG5leHRTaWJsaW5nID0gcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XTtcclxuXHRcdGlmIChuZXh0U2libGluZykge1xyXG5cdFx0XHR2YXIgaXNFbGVtZW50ID0gbmV4dFNpYmxpbmcubm9kZVR5cGUgIT0gMTtcclxuXHRcdFx0dmFyIHBsYWNlaG9sZGVyID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG5cdFx0XHRpZiAoaXNFbGVtZW50KSB7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIG5leHRTaWJsaW5nIHx8IG51bGwpO1xyXG5cdFx0XHRcdHBsYWNlaG9sZGVyLmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWJlZ2luXCIsIGRhdGEpO1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXIpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBuZXh0U2libGluZy5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBwYXJlbnRFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBkYXRhKTtcclxuXHRcdHZhciBub2RlcyA9IFtdO1xyXG5cdFx0d2hpbGUgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gIT09IG5leHRTaWJsaW5nKSB7XHJcblx0XHRcdG5vZGVzLnB1c2gocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSk7XHJcblx0XHRcdGluZGV4KytcclxuXHRcdH1cclxuXHRcdHJldHVybiBub2Rlc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBhdXRvcmVkcmF3KGNhbGxiYWNrLCBvYmplY3QpIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIik7XHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0XHR0cnkge3JldHVybiBjYWxsYmFjay5jYWxsKG9iamVjdCwgZSl9XHJcblx0XHRcdGZpbmFsbHkge1xyXG5cdFx0XHRcdGVuZEZpcnN0Q29tcHV0YXRpb24oKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgaHRtbDtcclxuXHR2YXIgZG9jdW1lbnROb2RlID0ge1xyXG5cdFx0YXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0aWYgKGh0bWwgPT09IHVuZGVmaW5lZCkgaHRtbCA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtcclxuXHRcdFx0aWYgKCRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAhPT0gbm9kZSkge1xyXG5cdFx0XHRcdCRkb2N1bWVudC5yZXBsYWNlQ2hpbGQobm9kZSwgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlICRkb2N1bWVudC5hcHBlbmRDaGlsZChub2RlKTtcclxuXHRcdFx0dGhpcy5jaGlsZE5vZGVzID0gJGRvY3VtZW50LmNoaWxkTm9kZXNcclxuXHRcdH0sXHJcblx0XHRpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0dGhpcy5hcHBlbmRDaGlsZChub2RlKVxyXG5cdFx0fSxcclxuXHRcdGNoaWxkTm9kZXM6IFtdXHJcblx0fTtcclxuXHR2YXIgbm9kZUNhY2hlID0gW10sIGNlbGxDYWNoZSA9IHt9O1xyXG5cdG0ucmVuZGVyID0gZnVuY3Rpb24ocm9vdCwgY2VsbCwgZm9yY2VSZWNyZWF0aW9uKSB7XHJcblx0XHR2YXIgY29uZmlncyA9IFtdO1xyXG5cdFx0aWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIERPTSBlbGVtZW50IGJlaW5nIHBhc3NlZCB0byBtLnJvdXRlL20ubW91bnQvbS5yZW5kZXIgaXMgbm90IHVuZGVmaW5lZC5cIik7XHJcblx0XHR2YXIgaWQgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdCk7XHJcblx0XHR2YXIgaXNEb2N1bWVudFJvb3QgPSByb290ID09PSAkZG9jdW1lbnQ7XHJcblx0XHR2YXIgbm9kZSA9IGlzRG9jdW1lbnRSb290IHx8IHJvb3QgPT09ICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgPyBkb2N1bWVudE5vZGUgOiByb290O1xyXG5cdFx0aWYgKGlzRG9jdW1lbnRSb290ICYmIGNlbGwudGFnICE9IFwiaHRtbFwiKSBjZWxsID0ge3RhZzogXCJodG1sXCIsIGF0dHJzOiB7fSwgY2hpbGRyZW46IGNlbGx9O1xyXG5cdFx0aWYgKGNlbGxDYWNoZVtpZF0gPT09IHVuZGVmaW5lZCkgY2xlYXIobm9kZS5jaGlsZE5vZGVzKTtcclxuXHRcdGlmIChmb3JjZVJlY3JlYXRpb24gPT09IHRydWUpIHJlc2V0KHJvb3QpO1xyXG5cdFx0Y2VsbENhY2hlW2lkXSA9IGJ1aWxkKG5vZGUsIG51bGwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjZWxsLCBjZWxsQ2FjaGVbaWRdLCBmYWxzZSwgMCwgbnVsbCwgdW5kZWZpbmVkLCBjb25maWdzKTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb25maWdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSBjb25maWdzW2ldKClcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIGdldENlbGxDYWNoZUtleShlbGVtZW50KSB7XHJcblx0XHR2YXIgaW5kZXggPSBub2RlQ2FjaGUuaW5kZXhPZihlbGVtZW50KTtcclxuXHRcdHJldHVybiBpbmRleCA8IDAgPyBub2RlQ2FjaGUucHVzaChlbGVtZW50KSAtIDEgOiBpbmRleFxyXG5cdH1cclxuXHJcblx0bS50cnVzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHR2YWx1ZSA9IG5ldyBTdHJpbmcodmFsdWUpO1xyXG5cdFx0dmFsdWUuJHRydXN0ZWQgPSB0cnVlO1xyXG5cdFx0cmV0dXJuIHZhbHVlXHJcblx0fTtcclxuXHJcblx0ZnVuY3Rpb24gZ2V0dGVyc2V0dGVyKHN0b3JlKSB7XHJcblx0XHR2YXIgcHJvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCkgc3RvcmUgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHJldHVybiBzdG9yZVxyXG5cdFx0fTtcclxuXHJcblx0XHRwcm9wLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblxyXG5cdG0ucHJvcCA9IGZ1bmN0aW9uIChzdG9yZSkge1xyXG5cdFx0Ly9ub3RlOiB1c2luZyBub24tc3RyaWN0IGVxdWFsaXR5IGNoZWNrIGhlcmUgYmVjYXVzZSB3ZSdyZSBjaGVja2luZyBpZiBzdG9yZSBpcyBudWxsIE9SIHVuZGVmaW5lZFxyXG5cdFx0aWYgKCgoc3RvcmUgIT0gbnVsbCAmJiB0eXBlLmNhbGwoc3RvcmUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBzdG9yZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiBzdG9yZS50aGVuID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRyZXR1cm4gcHJvcGlmeShzdG9yZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZ2V0dGVyc2V0dGVyKHN0b3JlKVxyXG5cdH07XHJcblxyXG5cdHZhciByb290cyA9IFtdLCBjb21wb25lbnRzID0gW10sIGNvbnRyb2xsZXJzID0gW10sIGxhc3RSZWRyYXdJZCA9IG51bGwsIGxhc3RSZWRyYXdDYWxsVGltZSA9IDAsIGNvbXB1dGVQcmVSZWRyYXdIb29rID0gbnVsbCwgY29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbCwgcHJldmVudGVkID0gZmFsc2UsIHRvcENvbXBvbmVudCwgdW5sb2FkZXJzID0gW107XHJcblx0dmFyIEZSQU1FX0JVREdFVCA9IDE2OyAvLzYwIGZyYW1lcyBwZXIgc2Vjb25kID0gMSBjYWxsIHBlciAxNiBtc1xyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIGFyZ3MpIHtcclxuXHRcdHZhciBjb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiAoY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcCkuYXBwbHkodGhpcywgYXJncykgfHwgdGhpc1xyXG5cdFx0fVxyXG5cdFx0dmFyIHZpZXcgPSBmdW5jdGlvbihjdHJsKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgYXJncyA9IGFyZ3MuY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcclxuXHRcdFx0cmV0dXJuIGNvbXBvbmVudC52aWV3LmFwcGx5KGNvbXBvbmVudCwgYXJncyA/IFtjdHJsXS5jb25jYXQoYXJncykgOiBbY3RybF0pXHJcblx0XHR9XHJcblx0XHR2aWV3LiRvcmlnaW5hbCA9IGNvbXBvbmVudC52aWV3XHJcblx0XHR2YXIgb3V0cHV0ID0ge2NvbnRyb2xsZXI6IGNvbnRyb2xsZXIsIHZpZXc6IHZpZXd9XHJcblx0XHRpZiAoYXJnc1swXSAmJiBhcmdzWzBdLmtleSAhPSBudWxsKSBvdXRwdXQuYXR0cnMgPSB7a2V5OiBhcmdzWzBdLmtleX1cclxuXHRcdHJldHVybiBvdXRwdXRcclxuXHR9XHJcblx0bS5jb21wb25lbnQgPSBmdW5jdGlvbihjb21wb25lbnQpIHtcclxuXHRcdHJldHVybiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXHJcblx0fVxyXG5cdG0ubW91bnQgPSBtLm1vZHVsZSA9IGZ1bmN0aW9uKHJvb3QsIGNvbXBvbmVudCkge1xyXG5cdFx0aWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2UgZW5zdXJlIHRoZSBET00gZWxlbWVudCBleGlzdHMgYmVmb3JlIHJlbmRlcmluZyBhIHRlbXBsYXRlIGludG8gaXQuXCIpO1xyXG5cdFx0dmFyIGluZGV4ID0gcm9vdHMuaW5kZXhPZihyb290KTtcclxuXHRcdGlmIChpbmRleCA8IDApIGluZGV4ID0gcm9vdHMubGVuZ3RoO1xyXG5cdFx0XHJcblx0XHR2YXIgaXNQcmV2ZW50ZWQgPSBmYWxzZTtcclxuXHRcdHZhciBldmVudCA9IHtwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlzUHJldmVudGVkID0gdHJ1ZTtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsO1xyXG5cdFx0fX07XHJcblx0XHRmb3IgKHZhciBpID0gMCwgdW5sb2FkZXI7IHVubG9hZGVyID0gdW5sb2FkZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0dW5sb2FkZXIuaGFuZGxlci5jYWxsKHVubG9hZGVyLmNvbnRyb2xsZXIsIGV2ZW50KVxyXG5cdFx0XHR1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGlzUHJldmVudGVkKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCB1bmxvYWRlcjsgdW5sb2FkZXIgPSB1bmxvYWRlcnNbaV07IGkrKykgdW5sb2FkZXIuY29udHJvbGxlci5vbnVubG9hZCA9IHVubG9hZGVyLmhhbmRsZXJcclxuXHRcdH1cclxuXHRcdGVsc2UgdW5sb2FkZXJzID0gW11cclxuXHRcdFxyXG5cdFx0aWYgKGNvbnRyb2xsZXJzW2luZGV4XSAmJiB0eXBlb2YgY29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQoZXZlbnQpXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmICghaXNQcmV2ZW50ZWQpIHtcclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJhbGxcIik7XHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0XHRyb290c1tpbmRleF0gPSByb290O1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIGNvbXBvbmVudCA9IHN1YmNvbXBvbmVudChjb21wb25lbnQsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSlcclxuXHRcdFx0dmFyIGN1cnJlbnRDb21wb25lbnQgPSB0b3BDb21wb25lbnQgPSBjb21wb25lbnQgPSBjb21wb25lbnQgfHwge2NvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge319O1xyXG5cdFx0XHR2YXIgY29uc3RydWN0b3IgPSBjb21wb25lbnQuY29udHJvbGxlciB8fCBub29wXHJcblx0XHRcdHZhciBjb250cm9sbGVyID0gbmV3IGNvbnN0cnVjdG9yO1xyXG5cdFx0XHQvL2NvbnRyb2xsZXJzIG1heSBjYWxsIG0ubW91bnQgcmVjdXJzaXZlbHkgKHZpYSBtLnJvdXRlIHJlZGlyZWN0cywgZm9yIGV4YW1wbGUpXHJcblx0XHRcdC8vdGhpcyBjb25kaXRpb25hbCBlbnN1cmVzIG9ubHkgdGhlIGxhc3QgcmVjdXJzaXZlIG0ubW91bnQgY2FsbCBpcyBhcHBsaWVkXHJcblx0XHRcdGlmIChjdXJyZW50Q29tcG9uZW50ID09PSB0b3BDb21wb25lbnQpIHtcclxuXHRcdFx0XHRjb250cm9sbGVyc1tpbmRleF0gPSBjb250cm9sbGVyO1xyXG5cdFx0XHRcdGNvbXBvbmVudHNbaW5kZXhdID0gY29tcG9uZW50XHJcblx0XHRcdH1cclxuXHRcdFx0ZW5kRmlyc3RDb21wdXRhdGlvbigpO1xyXG5cdFx0XHRyZXR1cm4gY29udHJvbGxlcnNbaW5kZXhdXHJcblx0XHR9XHJcblx0fTtcclxuXHR2YXIgcmVkcmF3aW5nID0gZmFsc2VcclxuXHRtLnJlZHJhdyA9IGZ1bmN0aW9uKGZvcmNlKSB7XHJcblx0XHRpZiAocmVkcmF3aW5nKSByZXR1cm5cclxuXHRcdHJlZHJhd2luZyA9IHRydWVcclxuXHRcdC8vbGFzdFJlZHJhd0lkIGlzIGEgcG9zaXRpdmUgbnVtYmVyIGlmIGEgc2Vjb25kIHJlZHJhdyBpcyByZXF1ZXN0ZWQgYmVmb3JlIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG5cdFx0Ly9sYXN0UmVkcmF3SUQgaXMgbnVsbCBpZiBpdCdzIHRoZSBmaXJzdCByZWRyYXcgYW5kIG5vdCBhbiBldmVudCBoYW5kbGVyXHJcblx0XHRpZiAobGFzdFJlZHJhd0lkICYmIGZvcmNlICE9PSB0cnVlKSB7XHJcblx0XHRcdC8vd2hlbiBzZXRUaW1lb3V0OiBvbmx5IHJlc2NoZWR1bGUgcmVkcmF3IGlmIHRpbWUgYmV0d2VlbiBub3cgYW5kIHByZXZpb3VzIHJlZHJhdyBpcyBiaWdnZXIgdGhhbiBhIGZyYW1lLCBvdGhlcndpc2Uga2VlcCBjdXJyZW50bHkgc2NoZWR1bGVkIHRpbWVvdXRcclxuXHRcdFx0Ly93aGVuIHJBRjogYWx3YXlzIHJlc2NoZWR1bGUgcmVkcmF3XHJcblx0XHRcdGlmICgkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IG5ldyBEYXRlIC0gbGFzdFJlZHJhd0NhbGxUaW1lID4gRlJBTUVfQlVER0VUKSB7XHJcblx0XHRcdFx0aWYgKGxhc3RSZWRyYXdJZCA+IDApICRjYW5jZWxBbmltYXRpb25GcmFtZShsYXN0UmVkcmF3SWQpO1xyXG5cdFx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVkcmF3LCBGUkFNRV9CVURHRVQpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZWRyYXcoKTtcclxuXHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtsYXN0UmVkcmF3SWQgPSBudWxsfSwgRlJBTUVfQlVER0VUKVxyXG5cdFx0fVxyXG5cdFx0cmVkcmF3aW5nID0gZmFsc2VcclxuXHR9O1xyXG5cdG0ucmVkcmF3LnN0cmF0ZWd5ID0gbS5wcm9wKCk7XHJcblx0ZnVuY3Rpb24gcmVkcmF3KCkge1xyXG5cdFx0aWYgKGNvbXB1dGVQcmVSZWRyYXdIb29rKSB7XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rKClcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBudWxsXHJcblx0XHR9XHJcblx0XHRmb3IgKHZhciBpID0gMCwgcm9vdDsgcm9vdCA9IHJvb3RzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGNvbnRyb2xsZXJzW2ldKSB7XHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIgJiYgY29tcG9uZW50c1tpXS5jb250cm9sbGVyLiQkYXJncyA/IFtjb250cm9sbGVyc1tpXV0uY29uY2F0KGNvbXBvbmVudHNbaV0uY29udHJvbGxlci4kJGFyZ3MpIDogW2NvbnRyb2xsZXJzW2ldXVxyXG5cdFx0XHRcdG0ucmVuZGVyKHJvb3QsIGNvbXBvbmVudHNbaV0udmlldyA/IGNvbXBvbmVudHNbaV0udmlldyhjb250cm9sbGVyc1tpXSwgYXJncykgOiBcIlwiKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvL2FmdGVyIHJlbmRlcmluZyB3aXRoaW4gYSByb3V0ZWQgY29udGV4dCwgd2UgbmVlZCB0byBzY3JvbGwgYmFjayB0byB0aGUgdG9wLCBhbmQgZmV0Y2ggdGhlIGRvY3VtZW50IHRpdGxlIGZvciBoaXN0b3J5LnB1c2hTdGF0ZVxyXG5cdFx0aWYgKGNvbXB1dGVQb3N0UmVkcmF3SG9vaykge1xyXG5cdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2soKTtcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0bGFzdFJlZHJhd0lkID0gbnVsbDtcclxuXHRcdGxhc3RSZWRyYXdDYWxsVGltZSA9IG5ldyBEYXRlO1xyXG5cdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0fVxyXG5cclxuXHR2YXIgcGVuZGluZ1JlcXVlc3RzID0gMDtcclxuXHRtLnN0YXJ0Q29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtwZW5kaW5nUmVxdWVzdHMrK307XHJcblx0bS5lbmRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cGVuZGluZ1JlcXVlc3RzID0gTWF0aC5tYXgocGVuZGluZ1JlcXVlc3RzIC0gMSwgMCk7XHJcblx0XHRpZiAocGVuZGluZ1JlcXVlc3RzID09PSAwKSBtLnJlZHJhdygpXHJcblx0fTtcclxuXHR2YXIgZW5kRmlyc3RDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJub25lXCIpIHtcclxuXHRcdFx0cGVuZGluZ1JlcXVlc3RzLS1cclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0XHR9XHJcblx0XHRlbHNlIG0uZW5kQ29tcHV0YXRpb24oKTtcclxuXHR9XHJcblxyXG5cdG0ud2l0aEF0dHIgPSBmdW5jdGlvbihwcm9wLCB3aXRoQXR0ckNhbGxiYWNrKSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0dmFyIGN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgdGhpcztcclxuXHRcdFx0d2l0aEF0dHJDYWxsYmFjayhwcm9wIGluIGN1cnJlbnRUYXJnZXQgPyBjdXJyZW50VGFyZ2V0W3Byb3BdIDogY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUocHJvcCkpXHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0Ly9yb3V0aW5nXHJcblx0dmFyIG1vZGVzID0ge3BhdGhuYW1lOiBcIlwiLCBoYXNoOiBcIiNcIiwgc2VhcmNoOiBcIj9cIn07XHJcblx0dmFyIHJlZGlyZWN0ID0gbm9vcCwgcm91dGVQYXJhbXMsIGN1cnJlbnRSb3V0ZSwgaXNEZWZhdWx0Um91dGUgPSBmYWxzZTtcclxuXHRtLnJvdXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHQvL20ucm91dGUoKVxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBjdXJyZW50Um91dGU7XHJcblx0XHQvL20ucm91dGUoZWwsIGRlZmF1bHRSb3V0ZSwgcm91dGVzKVxyXG5cdFx0ZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiB0eXBlLmNhbGwoYXJndW1lbnRzWzFdKSA9PT0gU1RSSU5HKSB7XHJcblx0XHRcdHZhciByb290ID0gYXJndW1lbnRzWzBdLCBkZWZhdWx0Um91dGUgPSBhcmd1bWVudHNbMV0sIHJvdXRlciA9IGFyZ3VtZW50c1syXTtcclxuXHRcdFx0cmVkaXJlY3QgPSBmdW5jdGlvbihzb3VyY2UpIHtcclxuXHRcdFx0XHR2YXIgcGF0aCA9IGN1cnJlbnRSb3V0ZSA9IG5vcm1hbGl6ZVJvdXRlKHNvdXJjZSk7XHJcblx0XHRcdFx0aWYgKCFyb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSkge1xyXG5cdFx0XHRcdFx0aWYgKGlzRGVmYXVsdFJvdXRlKSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIGRlZmF1bHQgcm91dGUgbWF0Y2hlcyBvbmUgb2YgdGhlIHJvdXRlcyBkZWZpbmVkIGluIG0ucm91dGVcIilcclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gdHJ1ZVxyXG5cdFx0XHRcdFx0bS5yb3V0ZShkZWZhdWx0Um91dGUsIHRydWUpXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHR2YXIgbGlzdGVuZXIgPSBtLnJvdXRlLm1vZGUgPT09IFwiaGFzaFwiID8gXCJvbmhhc2hjaGFuZ2VcIiA6IFwib25wb3BzdGF0ZVwiO1xyXG5cdFx0XHR3aW5kb3dbbGlzdGVuZXJdID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSAkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXVxyXG5cdFx0XHRcdGlmIChtLnJvdXRlLm1vZGUgPT09IFwicGF0aG5hbWVcIikgcGF0aCArPSAkbG9jYXRpb24uc2VhcmNoXHJcblx0XHRcdFx0aWYgKGN1cnJlbnRSb3V0ZSAhPSBub3JtYWxpemVSb3V0ZShwYXRoKSkge1xyXG5cdFx0XHRcdFx0cmVkaXJlY3QocGF0aClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsO1xyXG5cdFx0XHR3aW5kb3dbbGlzdGVuZXJdKClcclxuXHRcdH1cclxuXHRcdC8vY29uZmlnOiBtLnJvdXRlXHJcblx0XHRlbHNlIGlmIChhcmd1bWVudHNbMF0uYWRkRXZlbnRMaXN0ZW5lciB8fCBhcmd1bWVudHNbMF0uYXR0YWNoRXZlbnQpIHtcclxuXHRcdFx0dmFyIGVsZW1lbnQgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHZhciBpc0luaXRpYWxpemVkID0gYXJndW1lbnRzWzFdO1xyXG5cdFx0XHR2YXIgY29udGV4dCA9IGFyZ3VtZW50c1syXTtcclxuXHRcdFx0dmFyIHZkb20gPSBhcmd1bWVudHNbM107XHJcblx0XHRcdGVsZW1lbnQuaHJlZiA9IChtLnJvdXRlLm1vZGUgIT09ICdwYXRobmFtZScgPyAkbG9jYXRpb24ucGF0aG5hbWUgOiAnJykgKyBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgdmRvbS5hdHRycy5ocmVmO1xyXG5cdFx0XHRpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XHJcblx0XHRcdFx0ZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSk7XHJcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRlbGVtZW50LmRldGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKTtcclxuXHRcdFx0XHRlbGVtZW50LmF0dGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvL20ucm91dGUocm91dGUsIHBhcmFtcywgc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSlcclxuXHRcdGVsc2UgaWYgKHR5cGUuY2FsbChhcmd1bWVudHNbMF0pID09PSBTVFJJTkcpIHtcclxuXHRcdFx0dmFyIG9sZFJvdXRlID0gY3VycmVudFJvdXRlO1xyXG5cdFx0XHRjdXJyZW50Um91dGUgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHZhciBhcmdzID0gYXJndW1lbnRzWzFdIHx8IHt9XHJcblx0XHRcdHZhciBxdWVyeUluZGV4ID0gY3VycmVudFJvdXRlLmluZGV4T2YoXCI/XCIpXHJcblx0XHRcdHZhciBwYXJhbXMgPSBxdWVyeUluZGV4ID4gLTEgPyBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRSb3V0ZS5zbGljZShxdWVyeUluZGV4ICsgMSkpIDoge31cclxuXHRcdFx0Zm9yICh2YXIgaSBpbiBhcmdzKSBwYXJhbXNbaV0gPSBhcmdzW2ldXHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcocGFyYW1zKVxyXG5cdFx0XHR2YXIgY3VycmVudFBhdGggPSBxdWVyeUluZGV4ID4gLTEgPyBjdXJyZW50Um91dGUuc2xpY2UoMCwgcXVlcnlJbmRleCkgOiBjdXJyZW50Um91dGVcclxuXHRcdFx0aWYgKHF1ZXJ5c3RyaW5nKSBjdXJyZW50Um91dGUgPSBjdXJyZW50UGF0aCArIChjdXJyZW50UGF0aC5pbmRleE9mKFwiP1wiKSA9PT0gLTEgPyBcIj9cIiA6IFwiJlwiKSArIHF1ZXJ5c3RyaW5nO1xyXG5cclxuXHRcdFx0dmFyIHNob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyA/IGFyZ3VtZW50c1syXSA6IGFyZ3VtZW50c1sxXSkgPT09IHRydWUgfHwgb2xkUm91dGUgPT09IGFyZ3VtZW50c1swXTtcclxuXHJcblx0XHRcdGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcclxuXHRcdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbFxyXG5cdFx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0d2luZG93Lmhpc3Rvcnlbc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSA/IFwicmVwbGFjZVN0YXRlXCIgOiBcInB1c2hTdGF0ZVwiXShudWxsLCAkZG9jdW1lbnQudGl0bGUsIG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmVkaXJlY3QobW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXSA9IGN1cnJlbnRSb3V0ZVxyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG5cdG0ucm91dGUucGFyYW0gPSBmdW5jdGlvbihrZXkpIHtcclxuXHRcdGlmICghcm91dGVQYXJhbXMpIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IGNhbGwgbS5yb3V0ZShlbGVtZW50LCBkZWZhdWx0Um91dGUsIHJvdXRlcykgYmVmb3JlIGNhbGxpbmcgbS5yb3V0ZS5wYXJhbSgpXCIpXHJcblx0XHRyZXR1cm4gcm91dGVQYXJhbXNba2V5XVxyXG5cdH07XHJcblx0bS5yb3V0ZS5tb2RlID0gXCJzZWFyY2hcIjtcclxuXHRmdW5jdGlvbiBub3JtYWxpemVSb3V0ZShyb3V0ZSkge1xyXG5cdFx0cmV0dXJuIHJvdXRlLnNsaWNlKG1vZGVzW20ucm91dGUubW9kZV0ubGVuZ3RoKVxyXG5cdH1cclxuXHRmdW5jdGlvbiByb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSB7XHJcblx0XHRyb3V0ZVBhcmFtcyA9IHt9O1xyXG5cclxuXHRcdHZhciBxdWVyeVN0YXJ0ID0gcGF0aC5pbmRleE9mKFwiP1wiKTtcclxuXHRcdGlmIChxdWVyeVN0YXJ0ICE9PSAtMSkge1xyXG5cdFx0XHRyb3V0ZVBhcmFtcyA9IHBhcnNlUXVlcnlTdHJpbmcocGF0aC5zdWJzdHIocXVlcnlTdGFydCArIDEsIHBhdGgubGVuZ3RoKSk7XHJcblx0XHRcdHBhdGggPSBwYXRoLnN1YnN0cigwLCBxdWVyeVN0YXJ0KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBhbGwgcm91dGVzIGFuZCBjaGVjayBpZiB0aGVyZSdzXHJcblx0XHQvLyBhbiBleGFjdCBtYXRjaCBmb3IgdGhlIGN1cnJlbnQgcGF0aFxyXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhyb3V0ZXIpO1xyXG5cdFx0dmFyIGluZGV4ID0ga2V5cy5pbmRleE9mKHBhdGgpO1xyXG5cdFx0aWYoaW5kZXggIT09IC0xKXtcclxuXHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJba2V5cyBbaW5kZXhdXSk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAodmFyIHJvdXRlIGluIHJvdXRlcikge1xyXG5cdFx0XHRpZiAocm91dGUgPT09IHBhdGgpIHtcclxuXHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChcIl5cIiArIHJvdXRlLnJlcGxhY2UoLzpbXlxcL10rP1xcLnszfS9nLCBcIiguKj8pXCIpLnJlcGxhY2UoLzpbXlxcL10rL2csIFwiKFteXFxcXC9dKylcIikgKyBcIlxcLz8kXCIpO1xyXG5cclxuXHRcdFx0aWYgKG1hdGNoZXIudGVzdChwYXRoKSkge1xyXG5cdFx0XHRcdHBhdGgucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlzID0gcm91dGUubWF0Y2goLzpbXlxcL10rL2cpIHx8IFtdO1xyXG5cdFx0XHRcdFx0dmFyIHZhbHVlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCAtMik7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKykgcm91dGVQYXJhbXNba2V5c1tpXS5yZXBsYWNlKC86fFxcLi9nLCBcIlwiKV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWVzW2ldKVxyXG5cdFx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gcm91dGVVbm9idHJ1c2l2ZShlKSB7XHJcblx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdGlmIChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5IHx8IGUud2hpY2ggPT09IDIpIHJldHVybjtcclxuXHRcdGlmIChlLnByZXZlbnREZWZhdWx0KSBlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRlbHNlIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuXHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcclxuXHRcdHZhciBhcmdzID0gbS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIgJiYgY3VycmVudFRhcmdldC5zZWFyY2ggPyBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRUYXJnZXQuc2VhcmNoLnNsaWNlKDEpKSA6IHt9O1xyXG5cdFx0d2hpbGUgKGN1cnJlbnRUYXJnZXQgJiYgY3VycmVudFRhcmdldC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpICE9IFwiQVwiKSBjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5wYXJlbnROb2RlXHJcblx0XHRtLnJvdXRlKGN1cnJlbnRUYXJnZXRbbS5yb3V0ZS5tb2RlXS5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aCksIGFyZ3MpXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHNldFNjcm9sbCgpIHtcclxuXHRcdGlmIChtLnJvdXRlLm1vZGUgIT0gXCJoYXNoXCIgJiYgJGxvY2F0aW9uLmhhc2gpICRsb2NhdGlvbi5oYXNoID0gJGxvY2F0aW9uLmhhc2g7XHJcblx0XHRlbHNlIHdpbmRvdy5zY3JvbGxUbygwLCAwKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBidWlsZFF1ZXJ5U3RyaW5nKG9iamVjdCwgcHJlZml4KSB7XHJcblx0XHR2YXIgZHVwbGljYXRlcyA9IHt9XHJcblx0XHR2YXIgc3RyID0gW11cclxuXHRcdGZvciAodmFyIHByb3AgaW4gb2JqZWN0KSB7XHJcblx0XHRcdHZhciBrZXkgPSBwcmVmaXggPyBwcmVmaXggKyBcIltcIiArIHByb3AgKyBcIl1cIiA6IHByb3BcclxuXHRcdFx0dmFyIHZhbHVlID0gb2JqZWN0W3Byb3BdXHJcblx0XHRcdHZhciB2YWx1ZVR5cGUgPSB0eXBlLmNhbGwodmFsdWUpXHJcblx0XHRcdHZhciBwYWlyID0gKHZhbHVlID09PSBudWxsKSA/IGVuY29kZVVSSUNvbXBvbmVudChrZXkpIDpcclxuXHRcdFx0XHR2YWx1ZVR5cGUgPT09IE9CSkVDVCA/IGJ1aWxkUXVlcnlTdHJpbmcodmFsdWUsIGtleSkgOlxyXG5cdFx0XHRcdHZhbHVlVHlwZSA9PT0gQVJSQVkgPyB2YWx1ZS5yZWR1Y2UoZnVuY3Rpb24obWVtbywgaXRlbSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkdXBsaWNhdGVzW2tleV0pIGR1cGxpY2F0ZXNba2V5XSA9IHt9XHJcblx0XHRcdFx0XHRpZiAoIWR1cGxpY2F0ZXNba2V5XVtpdGVtXSkge1xyXG5cdFx0XHRcdFx0XHRkdXBsaWNhdGVzW2tleV1baXRlbV0gPSB0cnVlXHJcblx0XHRcdFx0XHRcdHJldHVybiBtZW1vLmNvbmNhdChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGl0ZW0pKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIG1lbW9cclxuXHRcdFx0XHR9LCBbXSkuam9pbihcIiZcIikgOlxyXG5cdFx0XHRcdGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXHJcblx0XHRcdGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSBzdHIucHVzaChwYWlyKVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHN0ci5qb2luKFwiJlwiKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHN0cikge1xyXG5cdFx0aWYgKHN0ci5jaGFyQXQoMCkgPT09IFwiP1wiKSBzdHIgPSBzdHIuc3Vic3RyaW5nKDEpO1xyXG5cdFx0XHJcblx0XHR2YXIgcGFpcnMgPSBzdHIuc3BsaXQoXCImXCIpLCBwYXJhbXMgPSB7fTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBwYWlycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHR2YXIgcGFpciA9IHBhaXJzW2ldLnNwbGl0KFwiPVwiKTtcclxuXHRcdFx0dmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzBdKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBwYWlyLmxlbmd0aCA9PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pIDogbnVsbFxyXG5cdFx0XHRpZiAocGFyYW1zW2tleV0gIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmICh0eXBlLmNhbGwocGFyYW1zW2tleV0pICE9PSBBUlJBWSkgcGFyYW1zW2tleV0gPSBbcGFyYW1zW2tleV1dXHJcblx0XHRcdFx0cGFyYW1zW2tleV0ucHVzaCh2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHBhcmFtc1trZXldID0gdmFsdWVcclxuXHRcdH1cclxuXHRcdHJldHVybiBwYXJhbXNcclxuXHR9XHJcblx0bS5yb3V0ZS5idWlsZFF1ZXJ5U3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZ1xyXG5cdG0ucm91dGUucGFyc2VRdWVyeVN0cmluZyA9IHBhcnNlUXVlcnlTdHJpbmdcclxuXHRcclxuXHRmdW5jdGlvbiByZXNldChyb290KSB7XHJcblx0XHR2YXIgY2FjaGVLZXkgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdCk7XHJcblx0XHRjbGVhcihyb290LmNoaWxkTm9kZXMsIGNlbGxDYWNoZVtjYWNoZUtleV0pO1xyXG5cdFx0Y2VsbENhY2hlW2NhY2hlS2V5XSA9IHVuZGVmaW5lZFxyXG5cdH1cclxuXHJcblx0bS5kZWZlcnJlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpO1xyXG5cdFx0ZGVmZXJyZWQucHJvbWlzZSA9IHByb3BpZnkoZGVmZXJyZWQucHJvbWlzZSk7XHJcblx0XHRyZXR1cm4gZGVmZXJyZWRcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIHByb3BpZnkocHJvbWlzZSwgaW5pdGlhbFZhbHVlKSB7XHJcblx0XHR2YXIgcHJvcCA9IG0ucHJvcChpbml0aWFsVmFsdWUpO1xyXG5cdFx0cHJvbWlzZS50aGVuKHByb3ApO1xyXG5cdFx0cHJvcC50aGVuID0gZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpLCBpbml0aWFsVmFsdWUpXHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblx0Ly9Qcm9taXoubWl0aHJpbC5qcyB8IFpvbG1laXN0ZXIgfCBNSVRcclxuXHQvL2EgbW9kaWZpZWQgdmVyc2lvbiBvZiBQcm9taXouanMsIHdoaWNoIGRvZXMgbm90IGNvbmZvcm0gdG8gUHJvbWlzZXMvQSsgZm9yIHR3byByZWFzb25zOlxyXG5cdC8vMSkgYHRoZW5gIGNhbGxiYWNrcyBhcmUgY2FsbGVkIHN5bmNocm9ub3VzbHkgKGJlY2F1c2Ugc2V0VGltZW91dCBpcyB0b28gc2xvdywgYW5kIHRoZSBzZXRJbW1lZGlhdGUgcG9seWZpbGwgaXMgdG9vIGJpZ1xyXG5cdC8vMikgdGhyb3dpbmcgc3ViY2xhc3NlcyBvZiBFcnJvciBjYXVzZSB0aGUgZXJyb3IgdG8gYmUgYnViYmxlZCB1cCBpbnN0ZWFkIG9mIHRyaWdnZXJpbmcgcmVqZWN0aW9uIChiZWNhdXNlIHRoZSBzcGVjIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZSBpbXBvcnRhbnQgdXNlIGNhc2Ugb2YgZGVmYXVsdCBicm93c2VyIGVycm9yIGhhbmRsaW5nLCBpLmUuIG1lc3NhZ2Ugdy8gbGluZSBudW1iZXIpXHJcblx0ZnVuY3Rpb24gRGVmZXJyZWQoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spIHtcclxuXHRcdHZhciBSRVNPTFZJTkcgPSAxLCBSRUpFQ1RJTkcgPSAyLCBSRVNPTFZFRCA9IDMsIFJFSkVDVEVEID0gNDtcclxuXHRcdHZhciBzZWxmID0gdGhpcywgc3RhdGUgPSAwLCBwcm9taXNlVmFsdWUgPSAwLCBuZXh0ID0gW107XHJcblxyXG5cdFx0c2VsZltcInByb21pc2VcIl0gPSB7fTtcclxuXHJcblx0XHRzZWxmW1wicmVzb2x2ZVwiXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklORztcclxuXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZltcInJlamVjdFwiXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZi5wcm9taXNlW1widGhlblwiXSA9IGZ1bmN0aW9uKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XHJcblx0XHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZChzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayk7XHJcblx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWRUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNURUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdG5leHQucHVzaChkZWZlcnJlZClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdFx0fTtcclxuXHJcblx0XHRmdW5jdGlvbiBmaW5pc2godHlwZSkge1xyXG5cdFx0XHRzdGF0ZSA9IHR5cGUgfHwgUkVKRUNURUQ7XHJcblx0XHRcdG5leHQubWFwKGZ1bmN0aW9uKGRlZmVycmVkKSB7XHJcblx0XHRcdFx0c3RhdGUgPT09IFJFU09MVkVEICYmIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZVZhbHVlKSB8fCBkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHRoZW5uYWJsZSh0aGVuLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaywgbm90VGhlbm5hYmxlQ2FsbGJhY2spIHtcclxuXHRcdFx0aWYgKCgocHJvbWlzZVZhbHVlICE9IG51bGwgJiYgdHlwZS5jYWxsKHByb21pc2VWYWx1ZSkgPT09IE9CSkVDVCkgfHwgdHlwZW9mIHByb21pc2VWYWx1ZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiB0aGVuID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvLyBjb3VudCBwcm90ZWN0cyBhZ2FpbnN0IGFidXNlIGNhbGxzIGZyb20gc3BlYyBjaGVja2VyXHJcblx0XHRcdFx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0XHRcdFx0dGhlbi5jYWxsKHByb21pc2VWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVybjtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdHN1Y2Nlc3NDYWxsYmFjaygpXHJcblx0XHRcdFx0XHR9LCBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVybjtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdGZhaWx1cmVDYWxsYmFjaygpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRcdGZhaWx1cmVDYWxsYmFjaygpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG5vdFRoZW5uYWJsZUNhbGxiYWNrKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGZpcmUoKSB7XHJcblx0XHRcdC8vIGNoZWNrIGlmIGl0J3MgYSB0aGVuYWJsZVxyXG5cdFx0XHR2YXIgdGhlbjtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR0aGVuID0gcHJvbWlzZVZhbHVlICYmIHByb21pc2VWYWx1ZS50aGVuXHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHRcdFx0XHRyZXR1cm4gZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HO1xyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIHR5cGVvZiBzdWNjZXNzQ2FsbGJhY2sgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHN1Y2Nlc3NDYWxsYmFjayhwcm9taXNlVmFsdWUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNUSU5HICYmIHR5cGVvZiBmYWlsdXJlQ2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBmYWlsdXJlQ2FsbGJhY2socHJvbWlzZVZhbHVlKTtcclxuXHRcdFx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkdcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChwcm9taXNlVmFsdWUgPT09IHNlbGYpIHtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IFR5cGVFcnJvcigpO1xyXG5cdFx0XHRcdFx0ZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRmaW5pc2goUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9LCBmaW5pc2gsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKHN0YXRlID09PSBSRVNPTFZJTkcgJiYgUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblx0bS5kZWZlcnJlZC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0aWYgKHR5cGUuY2FsbChlKSA9PT0gXCJbb2JqZWN0IEVycm9yXVwiICYmICFlLmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkubWF0Y2goLyBFcnJvci8pKSB0aHJvdyBlXHJcblx0fTtcclxuXHJcblx0bS5zeW5jID0gZnVuY3Rpb24oYXJncykge1xyXG5cdFx0dmFyIG1ldGhvZCA9IFwicmVzb2x2ZVwiO1xyXG5cdFx0ZnVuY3Rpb24gc3luY2hyb25pemVyKHBvcywgcmVzb2x2ZWQpIHtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0cmVzdWx0c1twb3NdID0gdmFsdWU7XHJcblx0XHRcdFx0aWYgKCFyZXNvbHZlZCkgbWV0aG9kID0gXCJyZWplY3RcIjtcclxuXHRcdFx0XHRpZiAoLS1vdXRzdGFuZGluZyA9PT0gMCkge1xyXG5cdFx0XHRcdFx0ZGVmZXJyZWQucHJvbWlzZShyZXN1bHRzKTtcclxuXHRcdFx0XHRcdGRlZmVycmVkW21ldGhvZF0ocmVzdWx0cylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHZhbHVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZGVmZXJyZWQgPSBtLmRlZmVycmVkKCk7XHJcblx0XHR2YXIgb3V0c3RhbmRpbmcgPSBhcmdzLmxlbmd0aDtcclxuXHRcdHZhciByZXN1bHRzID0gbmV3IEFycmF5KG91dHN0YW5kaW5nKTtcclxuXHRcdGlmIChhcmdzLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0YXJnc1tpXS50aGVuKHN5bmNocm9uaXplcihpLCB0cnVlKSwgc3luY2hyb25pemVyKGksIGZhbHNlKSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBkZWZlcnJlZC5yZXNvbHZlKFtdKTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdH07XHJcblx0ZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtyZXR1cm4gdmFsdWV9XHJcblxyXG5cdGZ1bmN0aW9uIGFqYXgob3B0aW9ucykge1xyXG5cdFx0aWYgKG9wdGlvbnMuZGF0YVR5cGUgJiYgb3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCIpIHtcclxuXHRcdFx0dmFyIGNhbGxiYWNrS2V5ID0gXCJtaXRocmlsX2NhbGxiYWNrX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCkgKyBcIl9cIiArIChNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxZTE2KSkudG9TdHJpbmcoMzYpO1xyXG5cdFx0XHR2YXIgc2NyaXB0ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XHJcblxyXG5cdFx0XHR3aW5kb3dbY2FsbGJhY2tLZXldID0gZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcblx0XHRcdFx0b3B0aW9ucy5vbmxvYWQoe1xyXG5cdFx0XHRcdFx0dHlwZTogXCJsb2FkXCIsXHJcblx0XHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiByZXNwXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0Lm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0c2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuXHJcblx0XHRcdFx0b3B0aW9ucy5vbmVycm9yKHtcclxuXHRcdFx0XHRcdHR5cGU6IFwiZXJyb3JcIixcclxuXHRcdFx0XHRcdHRhcmdldDoge1xyXG5cdFx0XHRcdFx0XHRzdGF0dXM6IDUwMCxcclxuXHRcdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiBKU09OLnN0cmluZ2lmeSh7ZXJyb3I6IFwiRXJyb3IgbWFraW5nIGpzb25wIHJlcXVlc3RcIn0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZDtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0LnNyYyA9IG9wdGlvbnMudXJsXHJcblx0XHRcdFx0KyAob3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPiAwID8gXCImXCIgOiBcIj9cIilcclxuXHRcdFx0XHQrIChvcHRpb25zLmNhbGxiYWNrS2V5ID8gb3B0aW9ucy5jYWxsYmFja0tleSA6IFwiY2FsbGJhY2tcIilcclxuXHRcdFx0XHQrIFwiPVwiICsgY2FsbGJhY2tLZXlcclxuXHRcdFx0XHQrIFwiJlwiICsgYnVpbGRRdWVyeVN0cmluZyhvcHRpb25zLmRhdGEgfHwge30pO1xyXG5cdFx0XHQkZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFyIHhociA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XHJcblx0XHRcdHhoci5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCwgdHJ1ZSwgb3B0aW9ucy51c2VyLCBvcHRpb25zLnBhc3N3b3JkKTtcclxuXHRcdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xyXG5cdFx0XHRcdFx0aWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIG9wdGlvbnMub25sb2FkKHt0eXBlOiBcImxvYWRcIiwgdGFyZ2V0OiB4aHJ9KTtcclxuXHRcdFx0XHRcdGVsc2Ugb3B0aW9ucy5vbmVycm9yKHt0eXBlOiBcImVycm9yXCIsIHRhcmdldDogeGhyfSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGlmIChvcHRpb25zLnNlcmlhbGl6ZSA9PT0gSlNPTi5zdHJpbmdpZnkgJiYgb3B0aW9ucy5kYXRhICYmIG9wdGlvbnMubWV0aG9kICE9PSBcIkdFVFwiKSB7XHJcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9wdGlvbnMuZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UpIHtcclxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvKlwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuY29uZmlnID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHZhciBtYXliZVhociA9IG9wdGlvbnMuY29uZmlnKHhociwgb3B0aW9ucyk7XHJcblx0XHRcdFx0aWYgKG1heWJlWGhyICE9IG51bGwpIHhociA9IG1heWJlWGhyXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBkYXRhID0gb3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgfHwgIW9wdGlvbnMuZGF0YSA/IFwiXCIgOiBvcHRpb25zLmRhdGFcclxuXHRcdFx0aWYgKGRhdGEgJiYgKHR5cGUuY2FsbChkYXRhKSAhPSBTVFJJTkcgJiYgZGF0YS5jb25zdHJ1Y3RvciAhPSB3aW5kb3cuRm9ybURhdGEpKSB7XHJcblx0XHRcdFx0dGhyb3cgXCJSZXF1ZXN0IGRhdGEgc2hvdWxkIGJlIGVpdGhlciBiZSBhIHN0cmluZyBvciBGb3JtRGF0YS4gQ2hlY2sgdGhlIGBzZXJpYWxpemVgIG9wdGlvbiBpbiBgbS5yZXF1ZXN0YFwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdHhoci5zZW5kKGRhdGEpO1xyXG5cdFx0XHRyZXR1cm4geGhyXHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJpbmREYXRhKHhock9wdGlvbnMsIGRhdGEsIHNlcmlhbGl6ZSkge1xyXG5cdFx0aWYgKHhock9wdGlvbnMubWV0aG9kID09PSBcIkdFVFwiICYmIHhock9wdGlvbnMuZGF0YVR5cGUgIT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHZhciBwcmVmaXggPSB4aHJPcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA8IDAgPyBcIj9cIiA6IFwiJlwiO1xyXG5cdFx0XHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKGRhdGEpO1xyXG5cdFx0XHR4aHJPcHRpb25zLnVybCA9IHhock9wdGlvbnMudXJsICsgKHF1ZXJ5c3RyaW5nID8gcHJlZml4ICsgcXVlcnlzdHJpbmcgOiBcIlwiKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB4aHJPcHRpb25zLmRhdGEgPSBzZXJpYWxpemUoZGF0YSk7XHJcblx0XHRyZXR1cm4geGhyT3B0aW9uc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemVVcmwodXJsLCBkYXRhKSB7XHJcblx0XHR2YXIgdG9rZW5zID0gdXJsLm1hdGNoKC86W2Etel1cXHcrL2dpKTtcclxuXHRcdGlmICh0b2tlbnMgJiYgZGF0YSkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHZhciBrZXkgPSB0b2tlbnNbaV0uc2xpY2UoMSk7XHJcblx0XHRcdFx0dXJsID0gdXJsLnJlcGxhY2UodG9rZW5zW2ldLCBkYXRhW2tleV0pO1xyXG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2tleV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHVybFxyXG5cdH1cclxuXHJcblx0bS5yZXF1ZXN0ID0gZnVuY3Rpb24oeGhyT3B0aW9ucykge1xyXG5cdFx0aWYgKHhock9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5zdGFydENvbXB1dGF0aW9uKCk7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuXHRcdHZhciBpc0pTT05QID0geGhyT3B0aW9ucy5kYXRhVHlwZSAmJiB4aHJPcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIjtcclxuXHRcdHZhciBzZXJpYWxpemUgPSB4aHJPcHRpb25zLnNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuc2VyaWFsaXplIHx8IEpTT04uc3RyaW5naWZ5O1xyXG5cdFx0dmFyIGRlc2VyaWFsaXplID0geGhyT3B0aW9ucy5kZXNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuZGVzZXJpYWxpemUgfHwgSlNPTi5wYXJzZTtcclxuXHRcdHZhciBleHRyYWN0ID0gaXNKU09OUCA/IGZ1bmN0aW9uKGpzb25wKSB7cmV0dXJuIGpzb25wLnJlc3BvbnNlVGV4dH0gOiB4aHJPcHRpb25zLmV4dHJhY3QgfHwgZnVuY3Rpb24oeGhyKSB7XHJcblx0XHRcdHJldHVybiB4aHIucmVzcG9uc2VUZXh0Lmxlbmd0aCA9PT0gMCAmJiBkZXNlcmlhbGl6ZSA9PT0gSlNPTi5wYXJzZSA/IG51bGwgOiB4aHIucmVzcG9uc2VUZXh0XHJcblx0XHR9O1xyXG5cdFx0eGhyT3B0aW9ucy5tZXRob2QgPSAoeGhyT3B0aW9ucy5tZXRob2QgfHwgJ0dFVCcpLnRvVXBwZXJDYXNlKCk7XHJcblx0XHR4aHJPcHRpb25zLnVybCA9IHBhcmFtZXRlcml6ZVVybCh4aHJPcHRpb25zLnVybCwgeGhyT3B0aW9ucy5kYXRhKTtcclxuXHRcdHhock9wdGlvbnMgPSBiaW5kRGF0YSh4aHJPcHRpb25zLCB4aHJPcHRpb25zLmRhdGEsIHNlcmlhbGl6ZSk7XHJcblx0XHR4aHJPcHRpb25zLm9ubG9hZCA9IHhock9wdGlvbnMub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0XHR2YXIgdW53cmFwID0gKGUudHlwZSA9PT0gXCJsb2FkXCIgPyB4aHJPcHRpb25zLnVud3JhcFN1Y2Nlc3MgOiB4aHJPcHRpb25zLnVud3JhcEVycm9yKSB8fCBpZGVudGl0eTtcclxuXHRcdFx0XHR2YXIgcmVzcG9uc2UgPSB1bndyYXAoZGVzZXJpYWxpemUoZXh0cmFjdChlLnRhcmdldCwgeGhyT3B0aW9ucykpLCBlLnRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGUudHlwZSA9PT0gXCJsb2FkXCIpIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlLmNhbGwocmVzcG9uc2UpID09PSBBUlJBWSAmJiB4aHJPcHRpb25zLnR5cGUpIHtcclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZXNwb25zZS5sZW5ndGg7IGkrKykgcmVzcG9uc2VbaV0gPSBuZXcgeGhyT3B0aW9ucy50eXBlKHJlc3BvbnNlW2ldKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoeGhyT3B0aW9ucy50eXBlKSByZXNwb25zZSA9IG5ldyB4aHJPcHRpb25zLnR5cGUocmVzcG9uc2UpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRlZmVycmVkW2UudHlwZSA9PT0gXCJsb2FkXCIgPyBcInJlc29sdmVcIiA6IFwicmVqZWN0XCJdKHJlc3BvbnNlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh4aHJPcHRpb25zLmJhY2tncm91bmQgIT09IHRydWUpIG0uZW5kQ29tcHV0YXRpb24oKVxyXG5cdFx0fTtcclxuXHRcdGFqYXgoeGhyT3B0aW9ucyk7XHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlLCB4aHJPcHRpb25zLmluaXRpYWxWYWx1ZSk7XHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdH07XHJcblxyXG5cdC8vdGVzdGluZyBBUElcclxuXHRtLmRlcHMgPSBmdW5jdGlvbihtb2NrKSB7XHJcblx0XHRpbml0aWFsaXplKHdpbmRvdyA9IG1vY2sgfHwgd2luZG93KTtcclxuXHRcdHJldHVybiB3aW5kb3c7XHJcblx0fTtcclxuXHQvL2ZvciBpbnRlcm5hbCB0ZXN0aW5nIG9ubHksIGRvIG5vdCB1c2UgYG0uZGVwcy5mYWN0b3J5YFxyXG5cdG0uZGVwcy5mYWN0b3J5ID0gYXBwO1xyXG5cclxuXHRyZXR1cm4gbVxyXG59KSh0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSk7XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBtO1xyXG5lbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiBtfSk7XHJcbiJdfQ==
