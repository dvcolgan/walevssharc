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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kdmNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9hcHAvZW5naW5lLmNvZmZlZSIsIi9ob21lL2R2Y29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9tYWluLmNvZmZlZSIsIi9ob21lL2R2Y29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9zeW5vbnltcy5jb2ZmZWUiLCIvaG9tZS9kdmNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9ub2RlX21vZHVsZXMvYXBwL3ZpZXcuY29mZmVlIiwiL2hvbWUvZHZjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC93YWxldnNzaGFyYy5jb2ZmZWUiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxtQkFBQTtFQUFBOztBQUFBLFdBQUEsR0FBYyxPQUFBLENBQVEsWUFBUjs7QUFHZCxNQUFNLENBQUMsT0FBUCxHQUF1QjtFQUNOLGdCQUFBO0lBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUNULElBQUMsQ0FBQSxpQkFBRCxHQUFxQixTQUFBLEdBQUE7SUFDckIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsU0FBQSxHQUFBO0lBRWhCLElBQUMsQ0FBQSxTQUFELEdBQWE7SUFDYixJQUFDLENBQUEsZUFBRCxHQUFtQjtJQUNuQixJQUFDLENBQUEsS0FBRCxHQUFTO0lBQ1QsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFFaEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFDaEIsSUFBQyxDQUFBLFdBQUQsR0FBZTtJQUNmLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFFWCxJQUFDLENBQUEsU0FBRCxHQUFhO0lBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQUNiLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFFWixJQUFDLENBQUEsWUFBRCxHQUFnQjtJQUNoQixJQUFDLENBQUEsb0JBQUQsR0FBd0I7SUFFeEIsSUFBQyxDQUFBLGdCQUFELEdBQW9CO0VBckJYOzttQkF1QmIsWUFBQSxHQUFjLFNBQUMsUUFBRDtXQUNWLElBQUMsQ0FBQSxTQUFELEdBQWE7RUFESDs7bUJBR2QsZUFBQSxHQUFpQixTQUFDLFFBQUQ7V0FDYixJQUFDLENBQUEsWUFBRCxHQUFnQixRQUFRLENBQUMsSUFBVCxDQUFjLElBQWQ7RUFESDs7bUJBR2pCLHVCQUFBLEdBQXlCLFNBQUMsR0FBRDtXQUNyQixJQUFDLENBQUEsb0JBQUQsR0FBd0I7RUFESDs7bUJBR3pCLElBQUEsR0FBTSxTQUFBO1dBQ0YsWUFBWSxDQUFDLE9BQWIsQ0FBcUIsVUFBckIsRUFBaUMsSUFBSSxDQUFDLFNBQUwsQ0FBZTtNQUM1QyxTQUFBLEVBQVcsSUFBQyxDQUFBLFNBRGdDO01BRTVDLGVBQUEsRUFBaUIsSUFBQyxDQUFBLGVBRjBCO01BRzVDLGdCQUFBLEVBQWtCLElBQUMsQ0FBQSxnQkFIeUI7TUFJNUMsS0FBQSxFQUFPLElBQUMsQ0FBQSxLQUpvQztNQUs1QyxZQUFBLEVBQWMsSUFBQyxDQUFBLFlBTDZCO0tBQWYsQ0FBakM7RUFERTs7bUJBU04sSUFBQSxHQUFNLFNBQUE7QUFDRixRQUFBO0FBQUE7TUFDSSxJQUFBLEdBQU8sSUFBSSxDQUFDLEtBQUwsQ0FBVyxZQUFZLENBQUMsT0FBYixDQUFxQixVQUFyQixDQUFYO01BQ1AsSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFJLENBQUM7TUFDbEIsSUFBQyxDQUFBLGVBQUQsR0FBbUIsSUFBSSxDQUFDO01BQ3hCLElBQUMsQ0FBQSxnQkFBRCxHQUFvQixJQUFJLENBQUMsZ0JBQUwsSUFBeUI7TUFDN0MsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFJLENBQUM7TUFDZCxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFJLENBQUM7QUFDckIsYUFBTyxLQVBYO0tBQUEsYUFBQTtNQVNJLFlBQVksQ0FBQyxLQUFiLENBQUE7QUFDQSxhQUFPLE1BVlg7O0VBREU7O21CQWFOLE9BQUEsR0FBUyxTQUFDLFFBQUQsRUFBVyxRQUFYO1dBQ0wsSUFBQyxDQUFBLEtBQU0sQ0FBQSxRQUFBLENBQVAsR0FBbUIsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0VBRGQ7O21CQUdULGtCQUFBLEdBQW9CLFNBQUE7V0FBRyxJQUFDLENBQUE7RUFBSjs7bUJBRXBCLGlCQUFBLEdBQW1CLFNBQUE7V0FBRyxJQUFDLENBQUE7RUFBSjs7bUJBRW5CLFlBQUEsR0FBYyxTQUFBO1dBQUcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFJLENBQUMsU0FBTCxDQUFlLElBQUMsQ0FBQSxTQUFoQixDQUFYO0VBQUg7O21CQUVkLFNBQUEsR0FBVyxTQUFDLFdBQUQ7QUFFUCxRQUFBO0lBRlEsSUFBQyxDQUFBLGNBQUQ7SUFFUixJQUFHLHlCQUFIO01BQ0ksUUFBQSxHQUFXLElBQUMsQ0FBQTtNQUNaLElBQUMsQ0FBQSxZQUFELEdBQWdCO01BQ2hCLFFBQUEsQ0FBQTtBQUNBLGFBSko7O0lBTUEsSUFBRyxJQUFDLENBQUEsV0FBRCxLQUFnQixFQUFuQjtBQUEyQixhQUEzQjs7SUFFQSxJQUFDLENBQUEsZ0JBQWdCLENBQUMsSUFBbEIsQ0FBdUIsSUFBQyxDQUFBLFdBQXhCO0lBR0EsSUFBQyxDQUFBLFdBQUQsR0FBZSxHQUFBLEdBQU0sSUFBQyxDQUFBLFdBQ2xCLENBQUMsSUFEZ0IsQ0FBQSxDQUVqQixDQUFDLFdBRmdCLENBQUEsQ0FHakIsQ0FBQyxPQUhnQixDQUdSLE1BSFEsRUFHQSxHQUhBLENBSWpCLENBQUMsT0FKZ0IsQ0FJUixTQUpRLEVBSUcsR0FKSCxDQUFOLEdBSWdCO0FBRy9CLFNBQUEsNkJBQUE7O0FBQ0ksV0FBQSwwQ0FBQTs7UUFDSSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFxQixHQUFBLEdBQUksT0FBSixHQUFZLEdBQWpDLEVBQXFDLEdBQUEsR0FBSSxjQUFKLEdBQW1CLEdBQXhEO0FBRG5CO0FBREo7SUFJQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxXQUFXLENBQUMsSUFBYixDQUFBO0lBRWYsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFiLENBQW1CLEdBQW5CO0lBRWhCLElBQUcsYUFBVSxJQUFDLENBQUEsWUFBWCxFQUFBLE1BQUEsTUFBSDtBQUNJO0FBQUEsV0FBQSx1Q0FBQTs7UUFDSSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxDQUFIO1VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFDLENBQUEsb0JBQVI7QUFDQSxpQkFGSjs7QUFESixPQURKOztJQU1BLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQyxDQUFBLGVBQUQsQ0FBUCxDQUFBO1dBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBQTtFQW5DTzs7bUJBcUNYLG9CQUFBLEdBQXNCLFNBQUMsUUFBRDtXQUNsQixJQUFDLENBQUEsaUJBQUQsR0FBcUIsUUFBUSxDQUFDLElBQVQsQ0FBYyxJQUFkO0VBREg7O21CQUd0QixvQkFBQSxHQUFzQixTQUFBO1dBQ2xCLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0VBRGtCOzttQkFHdEIsY0FBQSxHQUFnQixTQUFDLE9BQUQ7V0FDWixJQUFDLENBQUEsV0FBRCxLQUFnQjtFQURKOzttQkFHaEIsT0FBQSxHQUFTLFNBQUMsT0FBRDtBQUlMLFFBQUE7SUFBQSxZQUFBLEdBQWUsT0FBTyxDQUFDLEtBQVIsQ0FBYyxHQUFkO0FBQ2YsU0FBQSw4Q0FBQTs7TUFDSSxLQUFBLEdBQVE7QUFDUjtBQUFBLFdBQUEsdUNBQUE7O1FBQ0ksSUFBRyxXQUFXLENBQUMsVUFBWixDQUF1QixXQUF2QixDQUFBLElBQXdDLENBQUMsV0FBVyxDQUFDLE1BQVosSUFBc0IsQ0FBdEIsSUFBMkIsV0FBVyxDQUFDLE1BQVosSUFBc0IsQ0FBbEQsQ0FBM0M7VUFDSSxLQUFBLEdBQVEsS0FEWjs7QUFESjtNQUdBLElBQUcsQ0FBSSxLQUFQO0FBQ0ksZUFBTyxNQURYOztBQUxKO0FBT0EsV0FBTztFQVpGOzttQkFjVCxPQUFBLEdBQVMsU0FBQyxJQUFEO1dBQVUsSUFBQSxJQUFRLElBQUMsQ0FBQTtFQUFuQjs7bUJBQ1QsUUFBQSxHQUFVLFNBQUMsSUFBRDtXQUFVLElBQUEsSUFBUSxJQUFDLENBQUEsU0FBVCxJQUF1QixJQUFDLENBQUEsU0FBVSxDQUFBLElBQUEsQ0FBWCxLQUFvQjtFQUFyRDs7bUJBRVYsYUFBQSxHQUFlLFNBQUMsTUFBRDtXQUFZLElBQUksQ0FBQyxNQUFMLENBQUEsQ0FBQSxHQUFnQixNQUFBLEdBQVM7RUFBckM7O21CQUVmLE1BQUEsR0FBUSxTQUFDLFFBQUQsRUFBVyxLQUFYO1dBQXFCLElBQUMsQ0FBQSxLQUFNLENBQUEsUUFBQSxDQUFQLEtBQW9CO0VBQXpDOzttQkFFUixtQkFBQSxHQUFxQixTQUFBO1dBQUcsSUFBQyxDQUFBLFlBQWEsQ0FBQSxJQUFDLENBQUEsZUFBRCxDQUFkLEtBQW1DO0VBQXRDOzttQkFFckIsVUFBQSxHQUFZLFNBQUMsS0FBRDtBQUFXLFFBQUE7aUJBQUEsSUFBQyxDQUFBLFFBQUQsRUFBQSxhQUFhLEtBQWIsRUFBQSxHQUFBO0VBQVg7O21CQUVaLEtBQUEsR0FBTyxTQUFDLElBQUQ7SUFDSCxJQUFDLENBQUEsT0FBRCxHQUFXO1dBQ1gsSUFBQyxDQUFBLE1BQUQsQ0FBQTtFQUZHOzttQkFJUCxRQUFBLEdBQVUsU0FBQyxRQUFEO0lBQ04sSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUE7SUFDYixJQUFDLENBQUEsZUFBRCxHQUFtQjtJQUNuQixJQUFHLFFBQUEsSUFBWSxJQUFDLENBQUEsWUFBaEI7TUFDSSxJQUFDLENBQUEsWUFBYSxDQUFBLFFBQUEsQ0FBZCxHQURKO0tBQUEsTUFBQTtNQUdJLElBQUMsQ0FBQSxZQUFhLENBQUEsUUFBQSxDQUFkLEdBQTBCLEVBSDlCOztJQUlBLElBQUMsQ0FBQSxTQUFELENBQVcsZ0JBQVg7V0FDQSxJQUFDLENBQUEsTUFBRCxDQUFBO0VBUk07O21CQVVWLFNBQUEsR0FBVyxTQUFBO1dBQ1AsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFDLENBQUEsU0FBWDtFQURPOzttQkFHWCxPQUFBLEdBQVMsU0FBQyxRQUFELEVBQVcsS0FBWDtJQUNMLElBQUMsQ0FBQSxLQUFNLENBQUEsUUFBQSxDQUFQLEdBQW1CO1dBQ25CLElBQUMsQ0FBQSxNQUFELENBQUE7RUFGSzs7bUJBSVQsT0FBQSxHQUFTLFNBQUMsSUFBRDtJQUNMLElBQUMsQ0FBQSxTQUFVLENBQUEsSUFBQSxDQUFYLEdBQW1CO1dBQ25CLElBQUMsQ0FBQSxNQUFELENBQUE7RUFGSzs7bUJBSVQsVUFBQSxHQUFZLFNBQUMsSUFBRDtJQUNSLE9BQU8sSUFBQyxDQUFBLFNBQVUsQ0FBQSxJQUFBO1dBQ2xCLElBQUMsQ0FBQSxNQUFELENBQUE7RUFGUTs7bUJBSVosT0FBQSxHQUFTLFNBQUMsSUFBRDtJQUNMLElBQUMsQ0FBQSxTQUFVLENBQUEsSUFBQSxDQUFYLEdBQW1CO1dBQ25CLElBQUMsQ0FBQSxNQUFELENBQUE7RUFGSzs7bUJBSVQsSUFBQSxHQUFNLFNBQUMsUUFBRDtJQUNGLElBQUMsQ0FBQSxPQUFELElBQVk7SUFDWixJQUFDLENBQUEsWUFBRCxHQUFnQjtXQUNoQixJQUFDLENBQUEsTUFBRCxDQUFBO0VBSEU7O21CQUtOLE1BQUEsR0FBUSxTQUFDLFFBQUQ7V0FBYyxJQUFDLENBQUEsU0FBUyxDQUFDLElBQVgsQ0FBZ0IsUUFBaEI7RUFBZDs7bUJBRVIsTUFBQSxHQUFRLFNBQUE7QUFBRyxRQUFBO0FBQUE7QUFBQTtTQUFBLHFDQUFBOzttQkFBQSxRQUFBLENBQUE7QUFBQTs7RUFBSDs7Ozs7Ozs7O0FDbExaLElBQUE7O0FBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxTQUFSOztBQUNKLE1BQUEsR0FBWSxJQUFBLENBQUMsT0FBQSxDQUFRLFVBQVIsQ0FBRCxDQUFBLENBQUE7O0FBQ1osSUFBQSxHQUFPLE9BQUEsQ0FBUSxVQUFSLENBQUEsQ0FBb0IsTUFBcEI7O0FBR1AsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxRQUFRLENBQUMsSUFBakIsRUFBdUIsSUFBdkI7Ozs7O0FDTEEsTUFBTSxDQUFDLE9BQVAsR0FDSTtFQUFBLElBQUEsRUFBTSxDQUNGLEtBREUsRUFFRixRQUZFLEVBR0YsUUFIRSxFQUlGLE1BSkUsRUFLRixTQUxFLEVBTUYsS0FORSxFQU9GLE9BUEUsQ0FBTjtFQVNBLElBQUEsRUFBTSxDQUNGLFNBREUsRUFFRixLQUZFLEVBR0YsU0FIRSxFQUlGLE1BSkUsRUFLRixPQUxFLEVBTUYsUUFORSxFQU9GLEtBUEUsRUFRRixRQVJFLENBVE47RUFtQkEsRUFBQSxFQUFJLENBQ0EsTUFEQSxFQUVBLGFBRkEsRUFHQSxNQUhBLEVBSUEsUUFKQSxFQUtBLFNBTEEsRUFNQSxPQU5BLENBbkJKO0VBMkJBLElBQUEsRUFBTSxDQUNGLFNBREUsRUFFRixRQUZFLEVBR0YsV0FIRSxFQUlGLFNBSkUsRUFLRixPQUxFLEVBTUYsVUFORSxFQU9GLFFBUEUsRUFRRixZQVJFLENBM0JOO0VBcUNBLE1BQUEsRUFBUSxDQUNKLE1BREksRUFFSixRQUZJLEVBR0osU0FISSxDQXJDUjtFQTBDQSxNQUFBLEVBQVEsQ0FDSixPQURJLENBMUNSO0VBNkNBLElBQUEsRUFBTSxDQUNGLEtBREUsQ0E3Q047RUFnREEsU0FBQSxFQUFXLENBQ1AsUUFETyxDQWhEWDtFQW1EQSxJQUFBLEVBQU0sQ0FDRixNQURFLEVBRUYsT0FGRSxFQUdGLFNBSEUsRUFJRixLQUpFLEVBS0YsT0FMRSxFQU1GLFNBTkUsRUFPRixPQVBFLEVBUUYsTUFSRSxDQW5ETjtFQTZEQSxNQUFBLEVBQVEsQ0FDSixPQURJLEVBRUosT0FGSSxFQUdKLE1BSEksRUFJSixXQUpJLENBN0RSO0VBbUVBLEtBQUEsRUFBTyxDQUNILFNBREcsRUFFSCxTQUZHLENBbkVQO0VBdUVBLEtBQUEsRUFBTyxDQUNILElBREcsRUFFSCxRQUZHLENBdkVQO0VBMkVBLElBQUEsRUFBTSxDQUNGLE9BREUsRUFFRixLQUZFLEVBR0YsU0FIRSxFQUlGLFVBSkUsRUFLRixNQUxFLEVBTUYsUUFORSxFQU9GLFFBUEUsQ0EzRU47Ozs7OztBQ0RKLElBQUEscUNBQUE7RUFBQTs7QUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFNBQVI7O0FBQ0osV0FBQSxHQUFjLE9BQUEsQ0FBUSxpQkFBUjs7QUFHZCxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQWpCLEdBQThCLFNBQUE7U0FDMUIsSUFBRSxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQUwsQ0FBQSxDQUFBLEdBQXFCLElBQUU7QUFERzs7QUFJOUIsVUFBQSxHQUFhO0VBQ1QsR0FBQSxFQUFLLEtBREk7RUFFVCxVQUFBLEVBQVksWUFGSDtFQUdULE9BQUEsRUFBUyxTQUhBO0VBSVQsSUFBQSxFQUFNLGFBSkc7RUFLVCxRQUFBLEVBQVUsVUFMRDtFQU1ULEtBQUEsRUFBTyxhQU5FO0VBT1QsU0FBQSxFQUFXLFdBUEY7RUFRVCxRQUFBLEVBQVUsVUFSRDtFQVNULEtBQUEsRUFBTyxlQVRFO0VBVVQsSUFBQSxFQUFNLGNBVkc7RUFXVCxhQUFBLEVBQWUsYUFYTjtFQVlULFlBQUEsRUFBYyxZQVpMO0VBYVQsYUFBQSxFQUFlLGFBYk47RUFjVCxtQkFBQSxFQUFxQixtQkFkWjtFQWVULGVBQUEsRUFBaUIsZUFmUjtFQWdCVCxnQkFBQSxFQUFrQixnQkFoQlQ7RUFpQlQsWUFBQSxFQUFjLFlBakJMO0VBa0JULGVBQUEsRUFBaUIsZ0JBbEJSO0VBbUJULGdCQUFBLEVBQWtCLGdCQW5CVDtFQW9CVCxZQUFBLEVBQWMsWUFwQkw7RUFxQlQsVUFBQSxFQUFZLFVBckJIO0VBc0JULGFBQUEsRUFBZSxhQXRCTjtFQXVCVCxnQkFBQSxFQUFrQixnQkF2QlQ7RUF3QlQsZUFBQSxFQUFpQixlQXhCUjs7O0FBNEJQO0VBQ1csbUJBQUE7O0lBQ1QsSUFBQyxDQUFBLGNBQUQsR0FBa0I7SUFDbEIsSUFBQyxDQUFBLENBQUQsR0FBSztFQUZJOztzQkFJYixRQUFBLEdBQVUsU0FBQTtJQUNOLElBQUMsQ0FBQSxDQUFEO0lBQ0EsQ0FBQyxDQUFDLE1BQUYsQ0FBQTtJQUNBLElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBRCxDQUFBLENBQVA7YUFDSSxVQUFBLENBQVcsSUFBQyxDQUFBLFFBQVosRUFBc0IsQ0FBdEIsRUFESjs7RUFITTs7c0JBTVYsVUFBQSxHQUFZLFNBQUMsT0FBRDtJQUNSLElBQUMsQ0FBQSxjQUFELEdBQWtCO0lBQ2xCLElBQUMsQ0FBQSxDQUFELEdBQUs7V0FDTCxVQUFBLENBQVcsSUFBQyxDQUFBLFFBQVosRUFBc0IsQ0FBdEI7RUFIUTs7c0JBS1osT0FBQSxHQUFTLFNBQUE7V0FDTCxJQUFDLENBQUEsQ0FBRCxHQUFLLElBQUMsQ0FBQSxjQUFjLENBQUMsTUFBaEIsR0FBeUI7RUFEekI7O3NCQUdULFlBQUEsR0FBYyxTQUFBO1dBQ1YsSUFBQyxDQUFBLGNBQWU7RUFETjs7c0JBR2QsTUFBQSxHQUFRLFNBQUE7V0FDSixJQUFDLENBQUEsQ0FBRCxJQUFNLElBQUMsQ0FBQSxjQUFjLENBQUMsTUFBaEIsR0FBeUI7RUFEM0I7Ozs7OztBQUlaLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsTUFBRDtTQUNiO0lBQUEsVUFBQTtNQUNpQixnQkFBQTs7QUFFVCxZQUFBO1FBQUEsV0FBQSxDQUFZLE1BQVo7UUFDQSxPQUFBLEdBQVUsTUFBTSxDQUFDLElBQVAsQ0FBQTtRQUVWLElBQUMsQ0FBQSxFQUFELEdBQU07UUFDTixJQUFDLENBQUEsRUFBRSxDQUFDLE9BQUosR0FBYyxDQUFDLENBQUMsSUFBRixDQUFPLEVBQVA7UUFDZCxJQUFDLENBQUEsRUFBRSxDQUFDLEtBQUosR0FBZ0IsSUFBQSxTQUFBLENBQUE7UUFFaEIsTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO1lBQ1YsS0FBQyxDQUFBLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVixDQUFxQixNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUFyQjtZQUNBLENBQUMsQ0FBQyxNQUFGLENBQUE7bUJBQ0EsTUFBTSxDQUFDLElBQVAsQ0FBQTtVQUhVO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkO1FBS0EsSUFBRyxPQUFIO1VBQ0ksTUFBTSxDQUFDLFNBQVAsQ0FBaUIsTUFBakIsRUFESjtTQUFBLE1BQUE7VUFHSSxNQUFNLENBQUMsU0FBUCxDQUFBLEVBSEo7O01BZFM7O3VCQW1CYixlQUFBLEdBQWlCLFNBQUMsQ0FBRDtRQUNiLENBQUMsQ0FBQyxjQUFGLENBQUE7UUFDQSxJQUFHLElBQUMsQ0FBQSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQVYsQ0FBQSxDQUFIO1VBQ0ksTUFBTSxDQUFDLFNBQVAsQ0FBaUIsSUFBQyxDQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUEsQ0FBakI7aUJBQ0EsSUFBQyxDQUFBLEVBQUUsQ0FBQyxPQUFKLENBQVksRUFBWixFQUZKO1NBQUEsTUFBQTtpQkFJSSxJQUFDLENBQUEsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFWLENBQUEsRUFKSjs7TUFGYTs7OztRQXBCckI7SUE2QkEsSUFBQSxFQUFNLFNBQUMsSUFBRDtBQUNGLFVBQUE7YUFBQTtRQUNJLENBQUEsQ0FBRSxVQUFGLEVBQ0k7VUFBQSxLQUFBLEVBQ0k7WUFBQSxNQUFBLEVBQVEsTUFBTSxDQUFDLFdBQVAsR0FBcUIsSUFBN0I7WUFDQSxLQUFBLEVBQU8sT0FEUDtZQUVBLE9BQUEsRUFBUyxNQUZUO1dBREo7U0FESixFQUtJLENBQUEsQ0FBRSxJQUFGLEVBQ0k7VUFBQSxLQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsQ0FBWDtXQURKO1NBREosRUFHSSxXQUhKLENBTEosRUFTSTs7O0FBQ0k7QUFBQTtpQkFBQSxXQUFBOztjQUNJLElBQUcsS0FBQSxLQUFTLFFBQVo7NkJBQ0ksQ0FBQSxDQUFFLEdBQUYsRUFDSSxVQUFXLENBQUEsSUFBQSxDQURmLEdBREo7ZUFBQSxNQUdLLElBQUcsS0FBQSxLQUFTLE1BQVo7NkJBQ0QsQ0FBQSxDQUFFLEdBQUYsRUFDSTtrQkFBQSxLQUFBLEVBQ0k7b0JBQUEsY0FBQSxFQUFnQixjQUFoQjttQkFESjtpQkFESixFQUdJLFVBQVcsQ0FBQSxJQUFBLENBSGYsR0FEQztlQUFBLE1BQUE7cUNBQUE7O0FBSlQ7O2NBREosRUFVSSxDQUFBLENBQUUsUUFBRixFQUNJO1lBQUEsT0FBQSxFQUFTLFNBQUE7Y0FDTCxJQUFHLE9BQUEsQ0FBUSw2R0FBUixDQUFIO2dCQUNJLFlBQVksQ0FBQyxLQUFiLENBQUE7Z0JBQ0EsS0FBQSxDQUFNLG1CQUFOO3VCQUNBLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBaEIsR0FBdUIsR0FIM0I7O1lBREssQ0FBVDtXQURKLEVBTUksY0FOSixDQVZKO1NBVEosRUEyQkksQ0FBQSxDQUFFLFFBQUYsRUFDSTtVQUFBLE9BQUEsRUFBUyxTQUFDLENBQUQ7WUFDTCxZQUFZLENBQUMsT0FBYixDQUFxQixVQUFyQixFQUFpQyxJQUFJLENBQUMsU0FBTCxDQUFlO2NBQUMsV0FBQSxFQUFZO2dCQUFDLE9BQUEsRUFBUSxRQUFUO2dCQUFrQixVQUFBLEVBQVcsUUFBN0I7ZUFBYjtjQUFvRCxpQkFBQSxFQUFrQiwyQkFBdEU7Y0FBa0csa0JBQUEsRUFBbUIsQ0FBQyxnQkFBRCxFQUFrQixnQkFBbEIsRUFBbUMsZ0JBQW5DLEVBQW9ELE9BQXBELEVBQTRELGdCQUE1RCxFQUE2RSxXQUE3RSxFQUF5RixNQUF6RixFQUFnRyxNQUFoRyxFQUF1RyxnQkFBdkcsRUFBd0gsWUFBeEgsRUFBcUksV0FBckksRUFBaUosTUFBakosRUFBd0osT0FBeEosRUFBZ0ssZ0JBQWhLLEVBQWlMLE9BQWpMLEVBQXlMLGdCQUF6TCxFQUEwTSxjQUExTSxFQUF5TixnQkFBek4sRUFBME8sWUFBMU8sRUFBdVAsZ0JBQXZQLEVBQXdRLGVBQXhRLEVBQXdSLGdCQUF4UixFQUF5UyxhQUF6UyxFQUF1VCxnQkFBdlQsRUFBd1Usa0JBQXhVLEVBQTJWLHFCQUEzVixFQUFpWCxxQkFBalgsRUFBdVksaUJBQXZZLEVBQXlaLHFCQUF6WixFQUErYSxvQkFBL2EsRUFBb2MsVUFBcGMsRUFBK2MsT0FBL2MsRUFBdWQsTUFBdmQsRUFBOGQsTUFBOWQsRUFBcWUsZ0JBQXJlLEVBQXNmLE1BQXRmLEVBQTZmLGdCQUE3ZixFQUE4Z0IsY0FBOWdCLEVBQTZoQixnQkFBN2hCLEVBQThpQixTQUE5aUIsRUFBd2pCLGdCQUF4akIsRUFBeWtCLGNBQXprQixFQUF3bEIsT0FBeGxCLEVBQWdtQixNQUFobUIsRUFBdW1CLE1BQXZtQixFQUE4bUIsZ0JBQTltQixFQUErbkIsT0FBL25CLEVBQXVvQixnQkFBdm9CLEVBQXdwQixjQUF4cEIsRUFBdXFCLGdCQUF2cUIsRUFBd3JCLGFBQXhyQixFQUFzc0IsZ0JBQXRzQixFQUF1dEIsZ0JBQXZ0QixFQUF3dUIsZ0JBQXh1QixFQUF5dkIsWUFBenZCLEVBQXN3QixnQkFBdHdCLEVBQXV4QixrQkFBdnhCLEVBQTB5QixvQkFBMXlCLEVBQSt6QixxQkFBL3pCLEVBQXExQixpQkFBcjFCLEVBQXUyQixPQUF2MkIsRUFBKzJCLE1BQS8yQixFQUFzM0IsZ0JBQXQzQixFQUF1NEIsT0FBdjRCLEVBQSs0QixnQkFBLzRCLEVBQWc2QixNQUFoNkIsRUFBdTZCLE1BQXY2QixFQUE4NkIsY0FBOTZCLEVBQTY3QixnQkFBNzdCLEVBQTg4QixNQUE5OEIsRUFBcTlCLFNBQXI5QixFQUErOUIsY0FBLzlCLEVBQTgrQixhQUE5K0IsRUFBNC9CLGdCQUE1L0IsRUFBNmdDLE1BQTdnQyxFQUFvaEMsZUFBcGhDLEVBQW9pQyxnQkFBcGlDLEVBQXFqQyxnQkFBcmpDLEVBQXNrQyxZQUF0a0MsRUFBbWxDLGdCQUFubEMsRUFBb21DLGNBQXBtQyxFQUFtbkMsZ0JBQW5uQyxFQUFvb0MsZ0JBQXBvQyxFQUFxcEMsTUFBcnBDLEVBQTRwQyxNQUE1cEMsRUFBbXFDLE1BQW5xQyxFQUEwcUMsZ0JBQTFxQyxFQUEyckMsTUFBM3JDLEVBQWtzQyxnQkFBbHNDLEVBQW10QyxNQUFudEMsRUFBMHRDLGdCQUExdEMsRUFBMnVDLE9BQTN1QyxFQUFtdkMsZ0JBQW52QyxFQUFvd0MsTUFBcHdDLEVBQTJ3QyxnQkFBM3dDLEVBQTR4QyxnQkFBNXhDLEVBQTZ5QyxnQkFBN3lDLEVBQTh6QyxpQkFBOXpDLEVBQWcxQyxPQUFoMUMsRUFBdzFDLGdCQUF4MUMsRUFBeTJDLE9BQXoyQyxFQUFpM0MsZ0JBQWozQyxFQUFrNEMsTUFBbDRDLEVBQXk0QyxnQkFBejRDLEVBQTA1QyxXQUExNUMsRUFBczZDLE1BQXQ2QyxFQUE2NkMsZ0JBQTc2QyxFQUE4N0MsTUFBOTdDLEVBQXE4QyxPQUFyOEMsRUFBNjhDLGdCQUE3OEMsRUFBODlDLGNBQTk5QyxFQUE2K0MsT0FBNytDLEVBQXEvQyxNQUFyL0MsRUFBNC9DLE1BQTUvQyxFQUFtZ0QsZ0JBQW5nRCxFQUFvaEQsV0FBcGhELEVBQWdpRCxNQUFoaUQsRUFBdWlELE1BQXZpRCxFQUE4aUQsZ0JBQTlpRCxFQUErakQsT0FBL2pELEVBQXVrRCxPQUF2a0QsRUFBK2tELGdCQUEva0QsRUFBZ21ELEtBQWhtRCxFQUFzbUQsT0FBdG1ELEVBQThtRCxPQUE5bUQsRUFBc25ELGdCQUF0bkQsRUFBdW9ELE1BQXZvRCxFQUE4b0QsZ0JBQTlvRCxFQUErcEQsYUFBL3BELEVBQTZxRCxlQUE3cUQsRUFBNnJELGFBQTdyRCxFQUEyc0QsTUFBM3NELEVBQWt0RCxNQUFsdEQsRUFBeXRELGdCQUF6dEQsRUFBMHVELE9BQTF1RCxFQUFrdkQsZ0JBQWx2RCxFQUFtd0QsTUFBbndELEVBQTB3RCxnQkFBMXdELEVBQTJ4RCxNQUEzeEQsRUFBa3lELGdCQUFseUQsRUFBbXpELE1BQW56RCxFQUEwekQsZ0JBQTF6RCxFQUEyMEQsTUFBMzBELEVBQWsxRCxnQkFBbDFELEVBQW0yRCxNQUFuMkQsRUFBMDJELGdCQUExMkQsRUFBMjNELE1BQTMzRCxFQUFrNEQsZ0JBQWw0RCxFQUFtNUQsTUFBbjVELEVBQTA1RCxnQkFBMTVELEVBQTI2RCxNQUEzNkQsRUFBazdELFVBQWw3RCxFQUE2N0QsZUFBNzdELEVBQTY4RCxZQUE3OEQsRUFBMDlELGVBQTE5RCxFQUEwK0QsaUJBQTErRCxFQUE0L0QsZ0JBQTUvRCxFQUE2Z0UsTUFBN2dFLEVBQW9oRSxnQkFBcGhFLEVBQXFpRSxPQUFyaUUsRUFBNmlFLGdCQUE3aUUsRUFBOGpFLFdBQTlqRSxFQUEwa0UsT0FBMWtFLEVBQWtsRSxnQkFBbGxFLEVBQW1tRSxPQUFubUUsRUFBMm1FLGdCQUEzbUUsRUFBNG5FLGVBQTVuRSxFQUE0b0UsaUJBQTVvRSxFQUE4cEUsZUFBOXBFLEVBQThxRSxnQkFBOXFFLEVBQStyRSxnQkFBL3JFLEVBQWd0RSxhQUFodEUsRUFBOHRFLFFBQTl0RSxFQUF1dUUsZ0JBQXZ1RSxFQUF3dkUsS0FBeHZFLEVBQTh2RSxNQUE5dkUsRUFBcXdFLFdBQXJ3RSxFQUFpeEUsZ0JBQWp4RSxFQUFreUUsTUFBbHlFLEVBQXl5RSxnQkFBenlFLEVBQTB6RSxnQkFBMXpFLEVBQTIwRSxPQUEzMEUsRUFBbTFFLGdCQUFuMUUsQ0FBckg7Y0FBMDlFLE9BQUEsRUFBUTtnQkFBQyxnQkFBQSxFQUFpQixJQUFsQjtnQkFBdUIseUJBQUEsRUFBMEIsSUFBakQ7Z0JBQXNELGdCQUFBLEVBQWlCLElBQXZFO2dCQUE0RSxnQkFBQSxFQUFpQixJQUE3RjtlQUFsK0U7Y0FBcWtGLGNBQUEsRUFBZTtnQkFBQyxnRkFBQSxFQUFpRixDQUFsRjtnQkFBb0YsYUFBQSxFQUFjLENBQWxHO2dCQUFvRyxPQUFBLEVBQVEsQ0FBNUc7Z0JBQThHLE1BQUEsRUFBTyxDQUFySDtnQkFBdUgsYUFBQSxFQUFjLENBQXJJO2dCQUF1SSxpQkFBQSxFQUFrQixDQUF6SjtnQkFBMkosaUNBQUEsRUFBa0MsQ0FBN0w7Z0JBQStMLGlEQUFBLEVBQWtELENBQWpQO2dCQUFtUCxnREFBQSxFQUFpRCxDQUFwUztnQkFBc1Msa0RBQUEsRUFBbUQsQ0FBelY7Z0JBQTJWLDZCQUFBLEVBQThCLENBQXpYO2dCQUEyWCw2QkFBQSxFQUE4QixDQUF6WjtnQkFBMlosY0FBQSxFQUFlLENBQTFhO2dCQUE0YSxZQUFBLEVBQWEsQ0FBemI7Z0JBQTJiLG1CQUFBLEVBQW9CLENBQS9jO2dCQUFpZCxhQUFBLEVBQWMsQ0FBL2Q7Z0JBQWllLHlCQUFBLEVBQTBCLENBQTNmO2dCQUE2ZiwrQkFBQSxFQUFnQyxDQUE3aEI7Z0JBQStoQiwwQ0FBQSxFQUEyQyxDQUExa0I7Z0JBQTRrQiw0QkFBQSxFQUE2QixDQUF6bUI7Z0JBQTJtQixpQkFBQSxFQUFrQixDQUE3bkI7Z0JBQStuQiwyQkFBQSxFQUE0QixDQUEzcEI7Z0JBQTZwQixpQ0FBQSxFQUFrQyxDQUEvckI7Z0JBQWlzQiwyQkFBQSxFQUE0QixDQUE3dEI7Z0JBQSt0QixrQ0FBQSxFQUFtQyxDQUFsd0I7Z0JBQW93QixtRUFBQSxFQUFvRSxDQUF4MEI7Z0JBQTAwQixvRUFBQSxFQUFxRSxDQUEvNEI7Z0JBQWk1Qix1RkFBQSxFQUF3RixDQUF6K0I7Z0JBQTIrQiwrRUFBQSxFQUFnRixDQUEzakM7Z0JBQTZqQywyRUFBQSxFQUE0RSxDQUF6b0M7ZUFBcGxGO2FBQWYsQ0FBakM7bUJBQ0EsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFoQixHQUF1QjtVQUZsQixDQUFUO1NBREosRUFJSSxXQUpKLENBM0JKLEVBZ0NJLENBQUEsQ0FBRSxVQUFGLEVBQ0k7VUFBQSxLQUFBLEVBQ0k7WUFBQSxNQUFBLEVBQVEsT0FBUjtZQUNBLEtBQUEsRUFBTyxNQURQO1lBRUEsU0FBQSxFQUFXLE1BRlg7V0FESjtTQURKLEVBS0ksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBeEIsQ0FBNkIsSUFBN0IsQ0FBUixDQUxKLENBaENKLEVBdUNJLENBQUEsQ0FBRSxVQUFGLEVBQ0k7VUFBQSxLQUFBLEVBQ0k7WUFBQSxNQUFBLEVBQVEsT0FBUjtZQUNBLEtBQUEsRUFBTyxNQURQO1lBRUEsU0FBQSxFQUFXLE1BRlg7V0FESjtTQURKLEVBS0ksQ0FBQyxDQUFDLEtBQUYsQ0FBUSxZQUFZLENBQUMsT0FBYixDQUFxQixVQUFyQixDQUFSLENBTEosQ0F2Q0osQ0FESixFQStDSSxDQUFBLENBQUUsVUFBRixFQUNJO1VBQUEsS0FBQSxFQUNJO1lBQUEsS0FBQSxFQUFPLENBQUMsTUFBTSxDQUFDLFVBQVAsR0FBb0IsR0FBckIsQ0FBQSxHQUE0QixJQUFuQztZQUNBLE9BQUEsRUFBUyxNQURUO1lBRUEsVUFBQSxFQUFZLENBRlo7V0FESjtTQURKLEVBS0ksQ0FBQSxDQUFFLElBQUYsRUFBUSxNQUFNLENBQUMsa0JBQVAsQ0FBQSxDQUFSLENBTEosRUFNSSxDQUFBLENBQUUsR0FBRixFQUFPLENBQUMsQ0FBQyxLQUFGLENBQVEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsWUFBZCxDQUFBLENBQVIsQ0FBUCxDQU5KLEVBUU8sTUFBTSxDQUFDLGtCQUFQLENBQUEsQ0FBQSxLQUErQixLQUFsQyxHQUNJO1VBQ0ksQ0FBQSxDQUFFLEtBQUYsRUFDSTtZQUFBLEtBQUEsRUFDSTtjQUFBLEtBQUEsRUFBTyxNQUFQO2NBQ0EsU0FBQSxFQUFXLFFBRFg7YUFESjtXQURKLEVBSUksQ0FBQSxDQUFFLEtBQUYsRUFDSTtZQUFBLEdBQUEsRUFBSyxzQkFBTDtXQURKLENBSkosQ0FESixFQU9JLENBQUEsQ0FBRSxJQUFGLENBUEosRUFRSSxDQUFBLENBQUUsSUFBRixDQVJKLEVBU0ksQ0FBQSxDQUFFLElBQUYsRUFBUSx1QkFBUixDQVRKLEVBVUksQ0FBQSxDQUFFLEtBQUYsRUFDSSxDQUFBLENBQUUsUUFBRixFQUNJO1lBQUEsR0FBQSxFQUFLLHFHQUFMO1lBQ0EsS0FBQSxFQUFPLEtBRFA7WUFFQSxNQUFBLEVBQVEsS0FGUjtZQUdBLFdBQUEsRUFBYSxHQUhiO1lBSUEsWUFBQSxFQUFjLEdBSmQ7WUFLQSxXQUFBLEVBQWEsR0FMYjtZQU1BLEtBQUEsRUFDSTtjQUFBLE9BQUEsRUFBUyxLQUFUO2NBQ0EsTUFBQSxFQUFRLGdCQURSO2NBRUEsV0FBQSxFQUFhLE1BRmI7YUFQSjtXQURKLEVBV0ksWUFYSixDQURKLEVBYUksQ0FBQSxDQUFFLFVBQUYsRUFDSTtZQUFBLEtBQUEsRUFDSTtjQUFBLE1BQUEsRUFBUSxPQUFSO2FBREo7V0FESixFQUdJLENBQUMsQ0FBQyxLQUFGLENBQVEsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQXhCLENBQTZCLElBQTdCLENBQVIsQ0FISixDQWJKLENBVko7U0FESixHQThCSSxDQUFBLENBQUUsTUFBRixFQUNJO1VBQUEsUUFBQSxFQUFVLElBQUksQ0FBQyxlQUFmO1NBREosRUFFSSxDQUFBLENBQUUsa0JBQUYsRUFDSTtVQUFBLEtBQUEsRUFDSTtZQUFBLE9BQUEsRUFBUyxPQUFUO1dBREo7VUFFQSxRQUFBLEVBQVUsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxPQUFYLEVBQW9CLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBNUIsQ0FGVjtVQUdBLEtBQUEsRUFBTyxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQVIsQ0FBQSxDQUhQO1VBSUEsTUFBQSxFQUFRLFNBQUMsT0FBRCxFQUFVLGFBQVYsRUFBeUIsT0FBekI7WUFDSixJQUFHLENBQUksYUFBUDtxQkFDSSxPQUFPLENBQUMsS0FBUixDQUFBLEVBREo7O1VBREksQ0FKUjtTQURKLENBRkosRUFVSSxDQUFBLENBQUUscUJBQUYsRUFBeUIsSUFBekIsQ0FWSixDQXRDUixDQS9DSjs7SUFERSxDQTdCTjs7QUFEYTs7Ozs7QUM5RGpCO0FBY0EsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxNQUFEO0FBQ2IsTUFBQTtFQUFBLFFBQUEsR0FBVztFQVdYLE1BQU0sQ0FBQyx1QkFBUCxDQUErQixvRUFBL0I7RUFFQSxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsU0FBQTtBQUN4QixRQUFBO0lBQUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsQ0FBSDthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sdUNBQVAsRUFESjtLQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGNBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMEJBQVAsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sc0VBQVAsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsQ0FBQSxJQUFtQixJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBdEI7TUFDRCxJQUFHLE1BQU0sQ0FBQyxJQUFQLENBQVksSUFBQyxDQUFBLFlBQUQsQ0FBQSxDQUFaLENBQTRCLENBQUMsTUFBN0IsR0FBc0MsQ0FBekM7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDJIQUFQLEVBREo7T0FBQSxNQUFBO2VBR0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyw2RkFBUCxFQUhKO09BREM7S0FBQSxNQUtBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLFFBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGlCQUFULENBQUEsSUFBZ0MsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQW5DO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxtSkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVCxDQUFBLElBQXlCLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxDQUE1QjthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sOEdBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGNBQVQsQ0FBQSxJQUE2QixJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBaEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHVHQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUEsSUFBOEIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQWpDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywwRkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFBLElBQTBCLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUE3QjthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sK0RBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBQSxJQUEyQixJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBOUI7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHVFQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxjQUFULENBQUEsSUFBNkIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxTQUFULENBQWhDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxrRUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsa0JBQVQsQ0FBQSxJQUFpQyxJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQsQ0FBcEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHNCQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUFBLElBQStCLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFsQzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sd0ZBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBQSxJQUEyQixJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBOUI7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGdMQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUEsSUFBOEIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQWpDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywySkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFBLElBQTBCLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUE3QjthQUNELElBQUMsQ0FBQSxLQUFELENBQU8saUZBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLG9CQUFULENBQUEsSUFBbUMsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQXRDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxLQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxpQkFBVCxDQUFBLElBQWdDLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFuQzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sb0JBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGtCQUFULENBQUEsSUFBaUMsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQXBDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxrREFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsd0JBQVQsQ0FBQSxJQUF1QyxJQUFDLENBQUEsT0FBRCxDQUFTLG1CQUFULENBQTFDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywyRUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsb0JBQVQsQ0FBQSxJQUFtQyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBdEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLG1DQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxxQkFBVCxDQUFBLElBQW9DLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBdkM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGVBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQUEsSUFBK0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQWxDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw2QkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMscUJBQVQsQ0FBQSxJQUFvQyxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQXZDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxpRkFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsb0JBQVQsQ0FBQSxJQUFtQyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBdEM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGlCQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxpQkFBVCxDQUFBLElBQWdDLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFuQzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sbUdBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBQSxJQUE4QixJQUFDLENBQUEsT0FBRCxDQUFTLFVBQVQsQ0FBakM7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHVCQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxrQkFBVCxDQUFBLElBQWlDLElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUFwQzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sa0RBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLHFCQUFULENBQUEsSUFBb0MsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUF2QzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8seUJBQVAsRUFEQztLQUFBLE1BSUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMkVBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMENBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8seUJBQVAsRUFEQztLQUFBLE1BQUE7TUFLRCxnQkFBQSxHQUFtQixDQUNmLDZDQURlLEVBRWYsZUFGZSxFQUdmLDRCQUhlLEVBSWYsaUJBSmUsRUFLZixnQkFMZTthQU9uQixJQUFDLENBQUEsS0FBRCxDQUFPLGdCQUFpQixDQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFBLEdBQWMsZ0JBQWdCLENBQUMsTUFBMUMsQ0FBQSxDQUF4QixFQVpDOztFQWpHbUIsQ0FBNUI7RUFnSEEsTUFBTSxDQUFDLGVBQVAsQ0FBdUIsU0FBQTtJQUNuQixJQUFJLENBQUksSUFBQyxDQUFBLE1BQUQsQ0FBUSxnQkFBUixFQUEwQixJQUExQixDQUFKLElBQ0ksSUFBQyxDQUFBLE9BQUQsQ0FBUyxLQUFULENBREosSUFFSSxJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FGSixJQUdJLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUhKLElBSUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBSkosSUFLSSxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FMSixJQU1JLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQU5SO2FBT0ksSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDRixLQUFDLENBQUEsS0FBRCxDQUFPLHVOQUFQO2lCQUNBLEtBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsRUFBMkIsSUFBM0I7UUFGRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQVBKOztFQURtQixDQUF2QjtFQWFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsZ0ZBQWYsRUFBaUcsU0FBQTtJQUM3RixJQUFDLENBQUEsS0FBRCxDQUFPLGdGQUFQO1dBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTthQUFBLFNBQUE7ZUFDRixLQUFDLENBQUEsUUFBRCxDQUFVLGFBQVY7TUFERTtJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTjtFQUY2RixDQUFqRztFQUtBLE1BQU0sQ0FBQyxPQUFQLENBQWUsYUFBZixFQUE4QixTQUFBO0lBQzFCLElBQUMsQ0FBQSxLQUFELENBQU8sUUFBUDtXQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7YUFBQSxTQUFBO2VBQ0YsS0FBQyxDQUFBLFFBQUQsQ0FBVSxPQUFWO01BREU7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU47RUFGMEIsQ0FBOUI7RUFLQSxNQUFNLENBQUMsT0FBUCxDQUFlLE9BQWYsRUFBd0IsU0FBQTtJQUNwQixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXNDLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQXpDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyw4SkFBUCxFQURKO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywyRUFBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFMZSxDQUF4QjtFQVdBLE1BQU0sQ0FBQyxPQUFQLENBQWUsTUFBZixFQUF1QixTQUFBO0lBQ25CLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7TUFDSSxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQUg7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLCtUQUFQLEVBREo7T0FBQSxNQUFBO2VBR0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx1T0FBUCxFQUhKO09BREo7S0FBQSxNQU1LLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGdGQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUg7TUFDRCxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVCxDQUFIO1FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx3V0FBUDtlQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtZQUNGLEtBQUMsQ0FBQSxLQUFELENBQU8sbVNBQVA7bUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxTQUFBO2NBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyx5S0FBUDtxQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7Z0JBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyxrUEFBUDtnQkFDQSxLQUFDLENBQUEsVUFBRCxDQUFZLFVBQVo7dUJBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxFQUEyQixJQUEzQjtjQUhFLENBQU47WUFGRSxDQUFOO1VBRkU7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFGSjtPQURDO0tBQUEsTUFZQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUFBLElBQTRCLElBQUMsQ0FBQSxNQUFELENBQVEsZ0JBQVIsRUFBMEIsSUFBMUIsQ0FBL0I7TUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLG1SQUFQO2FBQ0EsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULEVBQTBCLElBQTFCLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQUEsSUFBMkIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxlQUFSLEVBQXlCLElBQXpCLENBQTlCO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxvQkFBVixFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFIO01BQ0QsSUFBRyxDQUFJLElBQUMsQ0FBQSxNQUFELENBQVEsZ0JBQVIsRUFBMEIsSUFBMUIsQ0FBUDtRQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sd01BQVA7ZUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7WUFDRixLQUFDLENBQUEsS0FBRCxDQUFPLDRVQUFQO21CQUNBLEtBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsRUFBMkIsSUFBM0I7VUFGRTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUZKO09BQUEsTUFBQTtlQU1JLElBQUMsQ0FBQSxLQUFELENBQU8sa0pBQVAsRUFOSjtPQURDO0tBQUEsTUFTQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxPQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGNBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsWUFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxhQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUE1Q2MsQ0FBdkI7RUFrREEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxjQUFmLEVBQStCLFNBQUE7SUFDM0IsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QztNQUNJLElBQUcsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBSDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sc05BQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLDRIQUFQLEVBSEo7T0FESjtLQUFBLE1BTUssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsTUFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxvQkFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBWHNCLENBQS9CO0VBaUJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsWUFBZixFQUE2QixTQUFBO0lBQ3pCLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7TUFDSSxJQUFHLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQVA7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDRKQUFQLEVBREo7T0FBQSxNQUFBO2VBR0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywrTUFBUCxFQUhKO09BREo7S0FBQSxNQUtLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxtQkFBVCxDQUFIO01BQ0QsSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFQO1FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxpVkFBUDtlQUNBLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxFQUZKO09BQUEsTUFBQTtlQUlJLElBQUMsQ0FBQSxLQUFELENBQU8sdUJBQVAsRUFKSjtPQURDO0tBQUEsTUFPQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsaUJBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sbUNBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsTUFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxvQkFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBcEJvQixDQUE3QjtFQTBCQSxNQUFNLENBQUMsT0FBUCxDQUFlLGFBQWYsRUFBOEIsU0FBQTtJQUMxQixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXNDLENBQUksSUFBQyxDQUFBLE1BQUQsQ0FBUSxxQkFBUixFQUErQixJQUEvQixDQUE3QztNQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVksNkNBQVosRUFBMkQsUUFBM0QsRUFESjs7SUFHQSxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO01BQ0ksSUFBRyxDQUFJLElBQUMsQ0FBQSxNQUFELENBQVEseUJBQVIsRUFBbUMsSUFBbkMsQ0FBUDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sZ01BQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLDZOQUFQLEVBSEo7T0FESjtLQUFBLE1BTUssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDtNQUNELElBQUcsQ0FBSSxJQUFDLENBQUEsTUFBRCxDQUFRLHlCQUFSLEVBQW1DLElBQW5DLENBQVA7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLGdKQUFQLEVBREo7T0FBQSxNQUFBO2VBR0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx1RUFBUCxFQUhKO09BREM7S0FBQSxNQU1BLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDJCQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDJGQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFULENBQUEsSUFBd0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxLQUFULENBQTNCO01BQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyx5UEFBUDtNQUNBLElBQUMsQ0FBQSxPQUFELENBQVMseUJBQVQsRUFBb0MsSUFBcEM7YUFDQSxJQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsRUFIQztLQUFBLE1BSUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sb0hBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsTUFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBL0JxQixDQUE5QjtFQXFDQSxNQUFNLENBQUMsT0FBUCxDQUFlLG9CQUFmLEVBQXFDLFNBQUE7SUFDakMsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QztNQUNJLElBQUcsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFDLDZCQUFELENBQVosQ0FBSDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8seUpBQVAsRUFESjtPQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFIO2VBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw2TkFBUCxFQURDO09BQUEsTUFBQTtlQUdELElBQUMsQ0FBQSxLQUFELENBQU8sK1BBQVAsRUFIQztPQUhUO0tBQUEsTUFPSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywyRUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxhQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUEsSUFBb0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQXZCO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSw2QkFBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxjQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLFlBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQWpCNEIsQ0FBckM7RUF1QkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSw2QkFBZixFQUE4QyxTQUFBO0lBQzFDLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDhGQUFQLEVBREo7S0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7TUFDRCxJQUFHLENBQUksSUFBQyxDQUFBLE1BQUQsQ0FBUSxvQkFBUixFQUE4QixJQUE5QixDQUFQO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyw0UEFBUCxFQURKO09BQUEsTUFBQTtlQUdJLElBQUMsQ0FBQSxLQUFELENBQU8saUZBQVAsRUFISjtPQURDO0tBQUEsTUFNQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywyRUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyx5RkFBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsa0JBQVQsQ0FBQSxJQUFnQyxJQUFDLENBQUEsT0FBRCxDQUFTLGtCQUFULENBQW5DO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw2REFBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBQSxJQUE4QixJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQWpDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyx3Q0FBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBQSxJQUE4QixJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQWpDO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw0REFBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsbUJBQVQsQ0FBQSxJQUFpQyxJQUFDLENBQUEsT0FBRCxDQUFTLG1CQUFULENBQWpDLElBQWtFLElBQUMsQ0FBQSxPQUFELENBQVMsaUJBQVQsQ0FBbEUsSUFBaUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxpQkFBVCxDQUFwRzthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sK0RBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGNBQVQsQ0FBQSxJQUE0QixJQUFDLENBQUEsT0FBRCxDQUFTLGNBQVQsQ0FBL0I7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDZMQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUg7TUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHdFQUFQO01BQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxVQUFaO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDRixLQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQ7aUJBQ0EsS0FBQyxDQUFBLEtBQUQsQ0FBTyx1RkFBUDtRQUZFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSEM7S0FBQSxNQU9BLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUEsSUFBb0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQXZCO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxvQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBbENxQyxDQUE5QztFQXdDQSxNQUFNLENBQUMsT0FBUCxDQUFlLGlCQUFmLEVBQWtDLFNBQUE7SUFDOUIsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBSDtNQUNJLElBQUcsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBSDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sMlpBQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLDJLQUFQLEVBSEo7T0FESjtLQUFBLE1BS0ssSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxvU0FBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFBLElBQTBCLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUExQixJQUFvRCxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBdkQ7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGdFQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUEsSUFBb0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQXBCLElBQTZDLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUE3QyxJQUFrRSxJQUFDLENBQUEsT0FBRCxDQUFTLElBQVQsQ0FBckU7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLDJCQUFWLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLFlBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQWZ5QixDQUFsQztFQXFCQSxNQUFNLENBQUMsT0FBUCxDQUFlLDJCQUFmLEVBQTRDLFNBQUE7SUFDeEMsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QztNQUNJLElBQUcsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBSDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sK1pBQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLGdIQUFQLEVBSEo7T0FESjtLQUFBLE1BTUssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsK0JBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsMkJBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsaUNBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsaUJBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQWJtQyxDQUE1QztFQWtCQSxNQUFNLENBQUMsT0FBUCxDQUFlLCtCQUFmLEVBQWdELFNBQUE7SUFDNUMsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8scUlBQVAsRUFESjtLQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsMkJBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQUh1QyxDQUFoRDtFQVFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsMkJBQWYsRUFBNEMsU0FBQTtJQUN4QyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxnUEFBUCxFQURKO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFBLElBQXlCLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUE1QjtNQUNELElBQUcsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBUDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sbU1BQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLG9CQUFQLEVBSEo7T0FEQztLQUFBLE1BTUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8seUJBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxLQUFELENBQU8sZUFBUDthQUNBLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxNQUFELENBQVEsZ0JBQVIsRUFBMEIsSUFBMUIsQ0FBQSxJQUFvQyxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQsQ0FBdkM7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULEVBQTJCLE9BQTNCO2FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxrQ0FBVixFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSwyQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBcEJtQyxDQUE1QztFQXlCQSxNQUFNLENBQUMsT0FBUCxDQUFlLGtDQUFmLEVBQW1ELFNBQUE7SUFDL0MsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QztNQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sMkpBQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNGLEtBQUMsQ0FBQSxLQUFELENBQU8sdVVBQVA7aUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxTQUFBO1lBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyx3aEJBQVA7bUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxTQUFBO2NBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyw2RUFBUDtxQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7dUJBQ0YsS0FBQyxDQUFBLFFBQUQsQ0FBVSxtRUFBVjtjQURFLENBQU47WUFGRSxDQUFOO1VBRkUsQ0FBTjtRQUZFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBRko7S0FBQSxNQUFBO2FBV0ksSUFBQyxDQUFBLG9CQUFELENBQUEsRUFYSjs7RUFEK0MsQ0FBbkQ7RUFjQSxNQUFNLENBQUMsT0FBUCxDQUFlLG1FQUFmLEVBQW9GLFNBQUE7SUFDaEYsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sc0RBQVAsRUFESjtLQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBQSxJQUFxQixJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBeEI7TUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLGlDQUFQO01BQ0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxnQ0FBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0YsSUFBRyxDQUFJLEtBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUFQO21CQUNJLEtBQUMsQ0FBQSxRQUFELENBQVUsb0VBQVYsRUFESjtXQUFBLE1BQUE7bUJBR0ksS0FBQyxDQUFBLEtBQUQsQ0FBTywyQ0FBUCxFQUhKOztRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSkM7S0FBQSxNQVVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxTQUFULENBQUEsSUFBd0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxTQUFULENBQTNCO01BQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxrQ0FBUDtNQUNBLElBQUMsQ0FBQSxVQUFELENBQVksU0FBWjtNQUNBLElBQUMsQ0FBQSxLQUFELENBQU8sZ0NBQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNGLElBQUcsQ0FBSSxLQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBUDttQkFDSSxLQUFDLENBQUEsUUFBRCxDQUFVLG9FQUFWLEVBREo7V0FBQSxNQUFBO21CQUdJLEtBQUMsQ0FBQSxLQUFELENBQU8sMkNBQVAsRUFISjs7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUpDO0tBQUEsTUFVQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxDQUFBLElBQTZCLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUE3QixJQUFrRCxJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBckQ7TUFDRCxJQUFDLENBQUEsVUFBRCxDQUFZLFNBQVo7TUFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLE1BQVo7TUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLGdDQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ0YsS0FBQyxDQUFBLFFBQUQsQ0FBVSxvRUFBVjtRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSkM7S0FBQSxNQUFBO2FBT0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFQQzs7RUF4QjJFLENBQXBGO0VBaUNBLE1BQU0sQ0FBQyxPQUFQLENBQWUsb0VBQWYsRUFBcUYsU0FBQTtJQUNqRixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxpSEFBUCxFQURKO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVCxDQUFBLElBQXdCLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBeEIsSUFBc0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQXpEO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTywwR0FBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFBLElBQXFCLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUF4QjtNQUNELElBQUMsQ0FBQSxLQUFELENBQU8saUNBQVA7TUFDQSxJQUFDLENBQUEsVUFBRCxDQUFZLE1BQVo7TUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLGdDQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDRixJQUFHLENBQUMsQ0FBSSxLQUFDLENBQUEsT0FBRCxDQUFTLEtBQVQsQ0FBTCxDQUFBLElBQTBCLENBQUMsQ0FBSSxLQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBTCxDQUE3QjttQkFDSSxLQUFDLENBQUEsUUFBRCxDQUFVLHVGQUFWLEVBREo7V0FBQSxNQUFBO21CQUdJLEtBQUMsQ0FBQSxLQUFELENBQU8sMkNBQVAsRUFISjs7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUpDO0tBQUEsTUFTQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFBLElBQTBCLElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUE3QjtNQUNELElBQUMsQ0FBQSxVQUFELENBQVksV0FBWjtNQUNBLElBQUMsQ0FBQSxLQUFELENBQU8sZ0NBQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNGLElBQUcsQ0FBQyxDQUFJLEtBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFMLENBQUEsSUFBMkIsQ0FBQyxDQUFJLEtBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxDQUFMLENBQTlCO21CQUNJLEtBQUMsQ0FBQSxRQUFELENBQVUsdUZBQVYsRUFESjtXQUFBLE1BQUE7bUJBR0ksS0FBQyxDQUFBLEtBQUQsQ0FBTywyQ0FBUCxFQUhKOztRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSEM7S0FBQSxNQVFBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxLQUFULENBQUEsSUFBb0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxLQUFULENBQXZCO01BQ0QsSUFBQyxDQUFBLFVBQUQsQ0FBWSxLQUFaO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxnQ0FBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0YsSUFBRyxDQUFDLENBQUksS0FBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUwsQ0FBQSxJQUEyQixDQUFDLENBQUksS0FBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUwsQ0FBOUI7bUJBQ0ksS0FBQyxDQUFBLFFBQUQsQ0FBVSx1RkFBVixFQURKO1dBQUEsTUFBQTttQkFHSSxLQUFDLENBQUEsS0FBRCxDQUFPLDJDQUFQLEVBSEo7O1FBREU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFIQztLQUFBLE1BQUE7YUFTRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQVRDOztFQXRCNEUsQ0FBckY7RUFpQ0EsTUFBTSxDQUFDLE9BQVAsQ0FBZSx1RkFBZixFQUF3RyxTQUFBO0lBQ3BHLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLGlHQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLCtFQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDJGQUFQLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFMK0YsQ0FBeEc7RUFVQSxNQUFNLENBQUMsT0FBUCxDQUFlLCtFQUFmLEVBQWdHLFNBQUE7SUFDNUYsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QztNQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sME1BQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDRixLQUFDLENBQUEsUUFBRCxDQUFVLDJFQUFWO1FBREU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFGSjtLQUFBLE1BQUE7YUFLSSxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUxKOztFQUQ0RixDQUFoRztFQVFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsMkVBQWYsRUFBNEYsU0FBQTtJQUN4RixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx3RUFBUCxFQURKO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLFVBQUQsQ0FBWSxPQUFaO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyw4QkFBUDtNQUNBLElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNGLEtBQUMsQ0FBQSxRQUFELENBQVUsMkJBQVY7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUpDO0tBQUEsTUFBQTthQU9ELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBUEM7O0VBSG1GLENBQTVGO0VBYUEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxpQ0FBZixFQUFrRCxTQUFBO0lBQzlDLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLHFTQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUEsSUFBNkIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQTdCLElBQTBELElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUExRCxJQUFtRixJQUFDLENBQUEsT0FBRCxDQUFTLFdBQVQsQ0FBdEY7TUFDRCxJQUFHLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQVA7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDBTQUFQLEVBREo7T0FBQSxNQUFBO2VBR0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyw4REFBUCxFQUhKO09BREM7S0FBQSxNQU1BLElBQUcsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBUDtNQUNELElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQUEsSUFBMkIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQTlCO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywwREFBUCxFQURKO09BQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQsQ0FBQSxJQUE4QixJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQsQ0FBOUIsSUFBeUQsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUF6RCxJQUF1RixJQUFDLENBQUEsT0FBRCxDQUFTLGFBQVQsQ0FBMUY7ZUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDhGQUFQLEVBREM7T0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQUEsSUFBMkIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQTNCLElBQXFELElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUFyRCxJQUFnRixJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQsQ0FBbkY7ZUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDhFQUFQLEVBREM7T0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQUEsSUFBMEIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQTFCLElBQW1ELElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFuRCxJQUE0RSxJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBL0U7ZUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHFDQUFQLEVBREM7T0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQUEsSUFBMEIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQTFCLElBQW1ELElBQUMsQ0FBQSxPQUFELENBQVMsV0FBVCxDQUFuRCxJQUE0RSxJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBL0U7UUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLG1LQUFQO2VBQ0EsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULEVBRkM7T0FYSjtLQUFBLE1BY0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBQSxJQUFvQixJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBdkI7YUFDRyxJQUFDLENBQUEsS0FBRCxDQUFPLGdHQUFQLEVBREg7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLDJCQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUExQnlDLENBQWxEO0VBZ0NBLE1BQU0sQ0FBQyxPQUFQLENBQWUsaUJBQWYsRUFBa0MsU0FBQTtJQUM5QixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFIO01BQ0ksSUFBRyxJQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFIO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyx5VUFBUCxFQURKO09BQUEsTUFBQTtlQUdJLElBQUMsQ0FBQSxLQUFELENBQU8sMlFBQVAsRUFISjtPQURKO0tBQUEsTUFLSyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDhRQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGlDQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLDZCQUFWLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGNBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsYUFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBZnlCLENBQWxDO0VBcUJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsaUNBQWYsRUFBa0QsU0FBQTtJQUM5QyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxrS0FBUCxFQURKO0tBQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpQkFBVixFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpREFBVixFQURDOztFQVB5QyxDQUFsRDtFQVVBLE1BQU0sQ0FBQyxPQUFQLENBQWUsaURBQWYsRUFBa0UsU0FBQTtJQUM5RCxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyw0R0FBUCxFQURKO0tBQUEsTUFHSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFUO2FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxnREFBVixFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFUO2FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxnREFBVixFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsbUJBQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxPQUFELENBQVMsbUJBQVQ7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGdEQUFWLEVBRkM7S0FBQSxNQUlBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQ7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGdEQUFWLEVBRkM7O0VBaEJ5RCxDQUFsRTtFQW9CQSxNQUFNLENBQUMsT0FBUCxDQUFlLGdEQUFmLEVBQWlFLFNBQUE7SUFDN0QsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sb0pBQVAsRUFESjtLQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLGdCQUFUO2FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxrREFBVixFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFUO2FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxrREFBVixFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVCxDQUFBLElBQXdCLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUF4QixJQUE0QyxJQUFDLENBQUEsT0FBRCxDQUFTLFNBQVQsQ0FBNUMsSUFBbUUsSUFBQyxDQUFBLE9BQUQsQ0FBUyxTQUFULENBQXRFO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxlQUFUO2FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxrREFBVixFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVCxDQUFBLElBQXdCLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUEzQjtNQUNELElBQUMsQ0FBQSxPQUFELENBQVMsZ0JBQVQ7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFVLGtEQUFWLEVBRkM7O0VBaEJ3RCxDQUFqRTtFQW9CQSxNQUFNLENBQUMsT0FBUCxDQUFlLGtEQUFmLEVBQW1FLFNBQUE7QUFDL0QsUUFBQTtJQUFBLElBQUEsR0FBTztJQUVQLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7YUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLHVGQUFQLEVBREo7S0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxZQUFULENBQUg7TUFDRCxJQUFDLENBQUEsT0FBRCxDQUFTLFlBQVQ7TUFDQSxJQUFDLENBQUEsS0FBRCxDQUFPLElBQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDRixLQUFDLENBQUEsUUFBRCxDQUFVLDZCQUFWO1FBREU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFIQztLQUFBLE1BS0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFVBQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxPQUFELENBQVMsVUFBVDtNQUNBLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNGLEtBQUMsQ0FBQSxRQUFELENBQVUsNkJBQVY7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUhDO0tBQUEsTUFLQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsYUFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFUO01BQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ0YsS0FBQyxDQUFBLFFBQUQsQ0FBVSw2QkFBVjtRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBSEM7S0FBQSxNQUtBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxnQkFBVDtNQUNBLElBQUMsQ0FBQSxLQUFELENBQU8sSUFBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNGLEtBQUMsQ0FBQSxRQUFELENBQVUsNkJBQVY7UUFERTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUhDO0tBQUEsTUFBQTthQU1ELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBTkM7O0VBckIwRCxDQUFuRTtFQThCQSxjQUFBLEdBQWlCLFNBQUMsTUFBRDtBQUNiLFFBQUE7SUFBQSxNQUFBLEdBQVM7SUFDVCxNQUFBLEdBQVM7SUFDVCxNQUFBLEdBQVM7SUFDVCxNQUFBLEdBQVM7SUFFVCxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsWUFBZixDQUFIO01BQXFDLE1BQUEsR0FBckM7O0lBQ0EsSUFBRyxNQUFNLENBQUMsT0FBUCxDQUFlLGdCQUFmLENBQUg7TUFBeUMsTUFBQSxHQUF6Qzs7SUFDQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsVUFBZixDQUFIO01BQW1DLE1BQUEsR0FBbkM7O0lBRUEsSUFBRyxNQUFNLENBQUMsT0FBUCxDQUFlLGFBQWYsQ0FBSDtNQUFzQyxNQUFBLEdBQXRDOztJQUNBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxZQUFmLENBQUg7TUFBcUMsTUFBQSxHQUFyQzs7SUFDQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsZ0JBQWYsQ0FBSDtNQUF5QyxNQUFBLEdBQXpDOztJQUVBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxtQkFBZixDQUFIO01BQTRDLE1BQUEsR0FBNUM7O0lBQ0EsSUFBRyxNQUFNLENBQUMsT0FBUCxDQUFlLGdCQUFmLENBQUg7TUFBeUMsTUFBQSxHQUF6Qzs7SUFDQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsYUFBZixDQUFIO01BQXNDLE1BQUEsR0FBdEM7O0lBRUEsSUFBRyxNQUFNLENBQUMsT0FBUCxDQUFlLGVBQWYsQ0FBSDtNQUF3QyxNQUFBLEdBQXhDOztJQUNBLElBQUcsTUFBTSxDQUFDLE9BQVAsQ0FBZSxlQUFmLENBQUg7TUFBd0MsTUFBQSxHQUF4Qzs7SUFDQSxJQUFHLE1BQU0sQ0FBQyxPQUFQLENBQWUsWUFBZixDQUFIO01BQXFDLE1BQUEsR0FBckM7O0FBRUEsV0FBTyxJQUFJLENBQUMsR0FBTCxDQUFTLE1BQVQsRUFBaUIsTUFBakIsRUFBeUIsTUFBekIsRUFBaUMsTUFBakM7RUF0Qk07RUF3QmpCLHFCQUFBLEdBQXdCLFNBQUMsTUFBRDtJQUNwQixNQUFNLENBQUMsVUFBUCxDQUFrQixZQUFsQjtJQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLGFBQWxCO0lBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsbUJBQWxCO0lBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsZUFBbEI7SUFFQSxNQUFNLENBQUMsVUFBUCxDQUFrQixnQkFBbEI7SUFDQSxNQUFNLENBQUMsVUFBUCxDQUFrQixZQUFsQjtJQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLGdCQUFsQjtJQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLGVBQWxCO0lBRUEsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsVUFBbEI7SUFDQSxNQUFNLENBQUMsVUFBUCxDQUFrQixnQkFBbEI7SUFDQSxNQUFNLENBQUMsVUFBUCxDQUFrQixhQUFsQjtXQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFlBQWxCO0VBZG9CO0VBaUJ4QixNQUFNLENBQUMsT0FBUCxDQUFlLDZCQUFmLEVBQThDLFNBQUE7SUFDMUMsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sd0tBQVAsRUFESjtLQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLGNBQVQsQ0FBSDtBQUNELGNBQU8sY0FBQSxDQUFlLElBQWYsQ0FBUDtBQUFBLGFBQ1MsQ0FEVDtpQkFFUSxJQUFDLENBQUEsS0FBRCxDQUFPLHlOQUFQO0FBRlIsYUFHUyxDQUhUO1VBSVEsSUFBQyxDQUFBLEtBQUQsQ0FBTyw2UEFBUDtpQkFDQSxxQkFBQSxDQUFzQixJQUF0QjtBQUxSLGFBTVMsQ0FOVDtVQU9RLElBQUMsQ0FBQSxLQUFELENBQU8sOE5BQVA7aUJBQ0EscUJBQUEsQ0FBc0IsSUFBdEI7QUFSUixhQVNTLENBVFQ7VUFVUSxJQUFDLENBQUEsS0FBRCxDQUFPLDRUQUFQO2lCQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQTtxQkFDRixLQUFDLENBQUEsUUFBRCxDQUFVLDZCQUFWO1lBREU7VUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU47QUFYUixPQURDO0tBQUEsTUFlQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxpQkFBVixFQURDO0tBQUEsTUFBQTthQUdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBSEM7O0VBbkJxQyxDQUE5QztFQXlCQSxNQUFNLENBQUMsT0FBUCxDQUFlLDZCQUFmLEVBQThDLFNBQUE7SUFDMUMsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBQSxJQUFxQyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUF4QzthQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sOGdCQUFQLEVBREo7S0FBQSxNQUdLLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7TUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHlHQUFQO2FBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDRixJQUFHLEtBQUMsQ0FBQSxhQUFELENBQWUsRUFBZixDQUFIO1lBQ0ksS0FBQyxDQUFBLEtBQUQsQ0FBTyw0TUFBUDttQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7Y0FDRixxQkFBQSxDQUFzQixLQUF0QjtxQkFDQSxLQUFDLENBQUEsUUFBRCxDQUFVLDZCQUFWO1lBRkUsQ0FBTixFQUZKO1dBQUEsTUFBQTtZQU1JLEtBQUMsQ0FBQSxLQUFELENBQU8sK0RBQVA7bUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxTQUFBO2NBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyw4TkFBUDtxQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7Z0JBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTywwVkFBUDt1QkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7a0JBQ0YscUJBQUEsQ0FBc0IsS0FBdEI7a0JBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxXQUFUO3lCQUNBLEtBQUMsQ0FBQSxRQUFELENBQVUsNkJBQVY7Z0JBSEUsQ0FBTjtjQUZFLENBQU47WUFGRSxDQUFOLEVBUEo7O1FBREU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQU4sRUFGQztLQUFBLE1BQUE7YUFtQkQsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFuQkM7O0VBSnFDLENBQTlDO0VBMEJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsYUFBZixFQUE4QixTQUFBO0lBQzFCLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUg7TUFDSSxJQUFHLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQywrQkFBRCxFQUFrQyx5QkFBbEMsQ0FBWixDQUFIO2VBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTywySUFBUCxFQURKO09BQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQUg7ZUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLG9UQUFQLEVBREM7T0FBQSxNQUFBO2VBR0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxvTUFBUCxFQUhDO09BSFQ7S0FBQSxNQU9LLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMk1BQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsK0JBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE1BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUseUJBQVYsRUFEQztLQUFBLE1BRUEsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBSDthQUNELElBQUMsQ0FBQSxRQUFELENBQVUsb0JBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQWZxQixDQUE5QjtFQXFCQSxNQUFNLENBQUMsT0FBUCxDQUFlLCtCQUFmLEVBQWdELFNBQUE7SUFDNUMsSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixnQkFBaEIsQ0FBSDtNQUNJLElBQUcsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBSDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8sNk9BQVAsRUFESjtPQUFBLE1BQUE7ZUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLG1OQUFQLEVBSEo7T0FESjtLQUFBLE1BTUssSUFBRyxJQUFDLENBQUEsY0FBRCxDQUFnQixNQUFoQixDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxnUUFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxxRkFBUCxFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsZUFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxVQUFUO2FBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTywrSUFBUCxFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSwwQ0FBVixFQURDO0tBQUEsTUFFQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsT0FBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLFFBQUQsQ0FBVSxhQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFsQnVDLENBQWhEO0VBd0JBLE1BQU0sQ0FBQyxPQUFQLENBQWUseUJBQWYsRUFBMEMsU0FBQTtJQUN0QyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFIO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyw4UkFBUCxFQURKO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHlQQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxjQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLG9HQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLDBHQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHdGQUFQLEVBREM7S0FBQSxNQUVBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQUEsSUFBeUIsSUFBQyxDQUFBLE9BQUQsQ0FBUyxXQUFULENBQTVCO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyxzREFBUCxFQURDO0tBQUEsTUFHQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsWUFBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFUO2FBQ0EsSUFBQyxDQUFBLEtBQUQsQ0FBTywrSkFBUCxFQUZDO0tBQUEsTUFJQSxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFIO2FBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw0REFBQSxHQUErRCxDQUFDLEVBQUEsR0FBSyxJQUFJLENBQUMsS0FBTCxDQUFXLElBQUksQ0FBQyxNQUFMLENBQUEsQ0FBQSxHQUFnQixFQUEzQixDQUFOLENBQXFDLENBQUMsUUFBdEMsQ0FBQSxDQUEvRCxHQUFrSCxDQUFBLGtDQUFBLEdBQWtDLENBQUksSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQUgsR0FBMEIsQ0FBMUIsR0FBaUMsRUFBbEMsQ0FBbEMsR0FBdUUsc0JBQXZFLENBQXpILEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLGFBQVYsRUFEQztLQUFBLE1BQUE7YUFHRCxJQUFDLENBQUEsb0JBQUQsQ0FBQSxFQUhDOztFQXRCaUMsQ0FBMUM7RUE0QkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSwwQ0FBZixFQUEyRCxTQUFBO0lBQ3ZELElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsZ0JBQWhCLENBQUEsSUFBcUMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBeEM7TUFDSSxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQUg7ZUFDSSxJQUFDLENBQUEsS0FBRCxDQUFPLDRiQUFQLEVBREo7T0FBQSxNQUVLLElBQUcsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBUDtlQUNELElBQUMsQ0FBQSxLQUFELENBQU8sa0xBQVAsRUFEQztPQUFBLE1BRUEsSUFBRyxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxDQUFQO2VBQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw4S0FBUCxFQURDO09BQUEsTUFBQTtlQUdELElBQUMsQ0FBQSxLQUFELENBQU8saUxBQVAsRUFIQztPQUxUO0tBQUEsTUFVSyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQUg7YUFDRCxJQUFDLENBQUEsS0FBRCxDQUFPLHNOQUFQLEVBREM7S0FBQSxNQUdBLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUEsSUFBb0IsSUFBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULENBQXBCLElBQXlDLElBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxDQUE1QztNQUNELElBQUcsQ0FBSSxJQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsQ0FBUDtlQUNJLElBQUMsQ0FBQSxLQUFELENBQU8saVNBQVAsRUFESjtPQUFBLE1BQUE7UUFHSSxJQUFDLENBQUEsS0FBRCxDQUFPLDZpQkFBUDtlQUNBLElBQUMsQ0FBQSxPQUFELENBQVMsTUFBVCxFQUpKO09BREM7S0FBQSxNQU9BLElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxNQUFULENBQUg7YUFDRCxJQUFDLENBQUEsUUFBRCxDQUFVLCtCQUFWLEVBREM7S0FBQSxNQUFBO2FBR0QsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFIQzs7RUFyQmtELENBQTNEO0VBMkJBLE1BQU0sQ0FBQyxPQUFQLENBQWUsb0JBQWYsRUFBcUMsU0FBQTtJQUNqQyxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxnWUFBUCxFQURKO0tBQUEsTUFFSyxJQUFHLElBQUMsQ0FBQSxPQUFELENBQVMsY0FBVCxDQUFIO01BQ0QsSUFBQyxDQUFBLEtBQUQsQ0FBTyw0UEFBUDthQUNBLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyxnTEFBUDtpQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7WUFDRixLQUFDLENBQUEsS0FBRCxDQUFPLHdOQUFQO21CQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTtjQUNGLEtBQUMsQ0FBQSxLQUFELENBQU8sNFNBQVA7cUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxTQUFBO3VCQUNGLEtBQUMsQ0FBQSxRQUFELENBQVUsb0NBQVY7Y0FERSxDQUFOO1lBRkUsQ0FBTjtVQUZFLENBQU47UUFGRTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBTixFQUZDO0tBQUEsTUFBQTthQVdELElBQUMsQ0FBQSxvQkFBRCxDQUFBLEVBWEM7O0VBSDRCLENBQXJDO0VBZ0JBLE1BQU0sQ0FBQyxPQUFQLENBQWUsb0NBQWYsRUFBcUQsU0FBQTtJQUNqRCxJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFBLElBQXFDLElBQUMsQ0FBQSxjQUFELENBQWdCLE1BQWhCLENBQXhDO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxlQUFQLEVBREo7S0FBQSxNQUVLLElBQUcsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsV0FBaEIsQ0FBSDthQUNELElBQUMsQ0FBQSxLQUFELENBQU8sMkRBQVAsRUFEQztLQUFBLE1BR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFTLFFBQVQsQ0FBSDtNQUNELElBQUMsQ0FBQSxLQUFELENBQU8sNE1BQVA7YUFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNGLEtBQUMsQ0FBQSxLQUFELENBQU8saUVBQVA7aUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxTQUFBO1lBQ0YsS0FBQyxDQUFBLEtBQUQsQ0FBTyxnR0FBUDttQkFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLFNBQUE7Y0FDRixLQUFDLENBQUEsS0FBRCxDQUFPLDZFQUFQO3FCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sU0FBQTtnQkFDRixLQUFDLENBQUEsT0FBRCxDQUFTLGVBQVQ7dUJBQ0EsS0FBQyxDQUFBLFFBQUQsQ0FBVSw2Q0FBVjtjQUZFLENBQU47WUFGRSxDQUFOO1VBRkUsQ0FBTjtRQUZFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFOLEVBRkM7S0FBQSxNQUFBO2FBWUQsSUFBQyxDQUFBLG9CQUFELENBQUEsRUFaQzs7RUFONEMsQ0FBckQ7RUFvQkEsTUFBTSxDQUFDLE9BQVAsQ0FBZSw2Q0FBZixFQUE4RCxTQUFBO0lBQzFELElBQUcsSUFBQyxDQUFBLE9BQUQsQ0FBUyxtQkFBVCxDQUFIO01BQ0ksSUFBQyxDQUFBLFVBQUQsQ0FBWSxlQUFaO2FBQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLEVBRko7S0FBQSxNQUFBO2FBSUksSUFBQyxDQUFBLG9CQUFELENBQUEsRUFKSjs7RUFEMEQsQ0FBOUQ7RUFRQSxNQUFNLENBQUMsT0FBUCxDQUFlLEtBQWYsRUFBc0IsU0FBQTtJQUNsQixJQUFHLElBQUMsQ0FBQSxjQUFELENBQWdCLGdCQUFoQixDQUFIO2FBQ0ksSUFBQyxDQUFBLEtBQUQsQ0FBTyxvTUFBUCxFQURKOztFQURrQixDQUF0QjtTQUtBLE1BQU0sQ0FBQyxZQUFQLENBQW9CLGdGQUFwQjtBQTk0QmE7Ozs7O0FDZGpCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwic3lub255bURhdGEgPSByZXF1aXJlKCcuL3N5bm9ueW1zJylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVuZ2luZVxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAcm9vbXMgPSB7fVxuICAgICAgICBAdW5pdmVyc2FsQ29tbWFuZHMgPSAtPlxuICAgICAgICBAYWZ0ZXJDb21tYW5kID0gLT5cblxuICAgICAgICBAaW52ZW50b3J5ID0ge31cbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9ICcnXG4gICAgICAgIEBmbGFncyA9IHt9XG4gICAgICAgIEByb29tc0VudGVyZWQgPSB7fVxuXG4gICAgICAgIEBjb21tYW5kV29yZHMgPSBbXVxuICAgICAgICBAY29tbWFuZFRleHQgPSAnJ1xuICAgICAgICBAbWVzc2FnZSA9ICcnXG5cbiAgICAgICAgQGNhbGxiYWNrcyA9IFtdXG4gICAgICAgIEBzdGFydFJvb20gPSAnJ1xuICAgICAgICBAbGFzdFJvb20gPSAnJ1xuXG4gICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBudWxsXG4gICAgICAgIEBhbHJlYWR5R290dGVuTWVzc2FnZSA9ICcnXG5cbiAgICAgICAgQHByZXZpb3VzQ29tbWFuZHMgPSBbXVxuXG4gICAgc2V0U3RhcnRSb29tOiAocm9vbU5hbWUpIC0+XG4gICAgICAgIEBzdGFydFJvb20gPSByb29tTmFtZVxuXG4gICAgc2V0QWZ0ZXJDb21tYW5kOiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEBhZnRlckNvbW1hbmQgPSBjYWxsYmFjay5iaW5kKEApXG5cbiAgICBzZXRBbHJlYWR5R290dGVuTWVzc2FnZTogKG1zZykgLT5cbiAgICAgICAgQGFscmVhZHlHb3R0ZW5NZXNzYWdlID0gbXNnXG5cbiAgICBzYXZlOiAtPlxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSAncHJvZ3Jlc3MnLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBpbnZlbnRvcnk6IEBpbnZlbnRvcnlcbiAgICAgICAgICAgIGN1cnJlbnRSb29tTmFtZTogQGN1cnJlbnRSb29tTmFtZVxuICAgICAgICAgICAgcHJldmlvdXNDb21tYW5kczogQHByZXZpb3VzQ29tbWFuZHNcbiAgICAgICAgICAgIGZsYWdzOiBAZmxhZ3NcbiAgICAgICAgICAgIHJvb21zRW50ZXJlZDogQHJvb21zRW50ZXJlZFxuICAgICAgICB9KVxuXG4gICAgbG9hZDogLT5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncHJvZ3Jlc3MnKSlcbiAgICAgICAgICAgIEBpbnZlbnRvcnkgPSBkYXRhLmludmVudG9yeVxuICAgICAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9IGRhdGEuY3VycmVudFJvb21OYW1lXG4gICAgICAgICAgICBAcHJldmlvdXNDb21tYW5kcyA9IGRhdGEucHJldmlvdXNDb21tYW5kcyBvciBbXVxuICAgICAgICAgICAgQGZsYWdzID0gZGF0YS5mbGFnc1xuICAgICAgICAgICAgQHJvb21zRW50ZXJlZCA9IGRhdGEucm9vbXNFbnRlcmVkXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBjYXRjaFxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgYWRkUm9vbTogKHJvb21OYW1lLCBjYWxsYmFjaykgLT5cbiAgICAgICAgQHJvb21zW3Jvb21OYW1lXSA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIGdldEN1cnJlbnRSb29tTmFtZTogLT4gQGN1cnJlbnRSb29tTmFtZVxuXG4gICAgZ2V0Q3VycmVudE1lc3NhZ2U6IC0+IEBtZXNzYWdlXG5cbiAgICBnZXRJbnZlbnRvcnk6IC0+IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoQGludmVudG9yeSkpXG5cbiAgICBkb0NvbW1hbmQ6IChAY29tbWFuZFRleHQpIC0+XG5cbiAgICAgICAgaWYgQHdhaXRDYWxsYmFjaz9cbiAgICAgICAgICAgIGNhbGxiYWNrID0gQHdhaXRDYWxsYmFja1xuICAgICAgICAgICAgQHdhaXRDYWxsYmFjayA9IG51bGxcbiAgICAgICAgICAgIGNhbGxiYWNrKClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIEBjb21tYW5kVGV4dCA9PSAnJyB0aGVuIHJldHVyblxuXG4gICAgICAgIEBwcmV2aW91c0NvbW1hbmRzLnB1c2goQGNvbW1hbmRUZXh0KVxuXG4gICAgICAgICMgY2xlYW4gdXAgdGhlIGNvbW1hbmQgdGV4dFxuICAgICAgICBAY29tbWFuZFRleHQgPSAnICcgKyBAY29tbWFuZFRleHRcbiAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxXKy9nLCAnICcpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxzezIsfS9nLCAnICcpICsgJyAnXG5cbiAgICAgICAgIyBmaW5kIHN5bm9ueW1zIGFuZCByZXBsYWNlIHRoZW0gd2l0aCB0aGUgY2Fub25pY2FsIHdvcmRcbiAgICAgICAgZm9yIGNhbm5vbmljYWxXb3JkLCBzeW5vbnltcyBvZiBzeW5vbnltRGF0YVxuICAgICAgICAgICAgZm9yIHN5bm9ueW0gaW4gc3lub255bXNcbiAgICAgICAgICAgICAgICBAY29tbWFuZFRleHQgPSBAY29tbWFuZFRleHQucmVwbGFjZShcIiAje3N5bm9ueW19IFwiLCBcIiAje2Nhbm5vbmljYWxXb3JkfSBcIilcblxuICAgICAgICBAY29tbWFuZFRleHQgPSBAY29tbWFuZFRleHQudHJpbSgpXG5cbiAgICAgICAgQGNvbW1hbmRXb3JkcyA9IEBjb21tYW5kVGV4dC5zcGxpdCgnICcpXG5cbiAgICAgICAgaWYgJ3Rha2UnIGluIEBjb21tYW5kV29yZHNcbiAgICAgICAgICAgIGZvciB3b3JkIGluIEBjb21tYW5kV29yZHNcbiAgICAgICAgICAgICAgICBpZiBAaGFzSXRlbSh3b3JkKVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoQGFscmVhZHlHb3R0ZW5NZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAcm9vbXNbQGN1cnJlbnRSb29tTmFtZV0oKVxuICAgICAgICBAYWZ0ZXJDb21tYW5kKClcblxuICAgIHNldFVuaXZlcnNhbENvbW1hbmRzOiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcyA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIHRyeVVuaXZlcnNhbENvbW1hbmRzOiAtPlxuICAgICAgICBAdW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZXhhY3RseU1hdGNoZXM6IChwYXR0ZXJuKSAtPlxuICAgICAgICBAY29tbWFuZFRleHQgPT0gcGF0dGVyblxuXG4gICAgbWF0Y2hlczogKHBhdHRlcm4pIC0+XG4gICAgICAgICMgSWYgZWFjaCB3b3JkIGluIHRoZSBzcGVjIGNvbW1hbmQgaXMgZm91bmRcbiAgICAgICAgIyBhbnl3aGVyZSBpbiB0aGUgdXNlcidzIGlucHV0IGl0J3MgYSBtYXRjaCxcbiAgICAgICAgIyBpbmNsdWRpbmcgc3Vic3RyaW5ncyBvZiB3b3Jkc1xuICAgICAgICBwYXR0ZXJuV29yZHMgPSBwYXR0ZXJuLnNwbGl0KCcgJylcbiAgICAgICAgZm9yIHBhdHRlcm5Xb3JkIGluIHBhdHRlcm5Xb3Jkc1xuICAgICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgICAgZm9yIGNvbW1hbmRXb3JkIGluIEBjb21tYW5kV29yZHNcbiAgICAgICAgICAgICAgICBpZiBwYXR0ZXJuV29yZC5zdGFydHNXaXRoKGNvbW1hbmRXb3JkKSBhbmQgKGNvbW1hbmRXb3JkLmxlbmd0aCA+PSA0IG9yIHBhdHRlcm5Xb3JkLmxlbmd0aCA8PSA0KVxuICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWVcbiAgICAgICAgICAgIGlmIG5vdCBmb3VuZFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgaGFzSXRlbTogKGl0ZW0pIC0+IGl0ZW0gb2YgQGludmVudG9yeVxuICAgIHVzZWRJdGVtOiAoaXRlbSkgLT4gaXRlbSBvZiBAaW52ZW50b3J5IGFuZCBAaW52ZW50b3J5W2l0ZW1dID09ICd1c2VkJ1xuXG4gICAgcGVyY2VudENoYW5jZTogKGNoYW5jZSkgLT4gTWF0aC5yYW5kb20oKSA8IGNoYW5jZSAvIDEwMFxuXG4gICAgZmxhZ0lzOiAoZmxhZ05hbWUsIHZhbHVlKSAtPiBAZmxhZ3NbZmxhZ05hbWVdID09IHZhbHVlXG5cbiAgICBpc0ZpcnN0VGltZUVudGVyaW5nOiAtPiBAcm9vbXNFbnRlcmVkW0BjdXJyZW50Um9vbU5hbWVdID09IDFcblxuICAgIGNvbWluZ0Zyb206IChyb29tcykgLT4gQGxhc3RSb29tIGluIHJvb21zXG5cbiAgICBwcmludDogKHRleHQpIC0+XG4gICAgICAgIEBtZXNzYWdlID0gdGV4dFxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdvVG9Sb29tOiAocm9vbU5hbWUpIC0+XG4gICAgICAgIEBsYXN0Um9vbSA9IEBjdXJyZW50Um9vbU5hbWVcbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9IHJvb21OYW1lXG4gICAgICAgIGlmIHJvb21OYW1lIG9mIEByb29tc0VudGVyZWRcbiAgICAgICAgICAgIEByb29tc0VudGVyZWRbcm9vbU5hbWVdKytcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJvb21zRW50ZXJlZFtyb29tTmFtZV0gPSAxXG4gICAgICAgIEBkb0NvbW1hbmQoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICBnb1RvU3RhcnQ6IC0+XG4gICAgICAgIEBnb1RvUm9vbShAc3RhcnRSb29tKVxuXG4gICAgc2V0RmxhZzogKGZsYWdOYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgQGZsYWdzW2ZsYWdOYW1lXSA9IHZhbHVlXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgZ2V0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIEBpbnZlbnRvcnlbaXRlbV0gPSAnZ290dGVuJ1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIHJlbW92ZUl0ZW06IChpdGVtKSAtPlxuICAgICAgICBkZWxldGUgQGludmVudG9yeVtpdGVtXVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIHVzZUl0ZW06IChpdGVtKSAtPlxuICAgICAgICBAaW52ZW50b3J5W2l0ZW1dID0gJ3VzZWQnXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgd2FpdDogKGNhbGxiYWNrKSAtPlxuICAgICAgICBAbWVzc2FnZSArPSAnIDxzdHJvbmc+KEhpdCBFbnRlcik8L3N0cm9uZz4nXG4gICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBjYWxsYmFja1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIGxpc3RlbjogKGNhbGxiYWNrKSAtPiBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cbiAgICBub3RpZnk6IC0+IGNhbGxiYWNrKCkgZm9yIGNhbGxiYWNrIGluIEBjYWxsYmFja3NcbiIsIm0gPSByZXF1aXJlKCdtaXRocmlsJylcbmVuZ2luZSA9IG5ldyhyZXF1aXJlKCcuL2VuZ2luZScpKSgpXG52aWV3ID0gcmVxdWlyZSgnYXBwL3ZpZXcnKShlbmdpbmUpXG5cblxubS5tb3VudChkb2N1bWVudC5ib2R5LCB2aWV3KVxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICAgIGxvb2s6IFtcbiAgICAgICAgJ3NlZSdcbiAgICAgICAgJ2FkbWlyZSdcbiAgICAgICAgJ2JlaG9sZCdcbiAgICAgICAgJ2dhd2snXG4gICAgICAgICdvYnNlcnZlJ1xuICAgICAgICAnc3B5J1xuICAgICAgICAnY2hlY2snXG4gICAgXVxuICAgIHRha2U6IFtcbiAgICAgICAgJ3BpY2sgdXAnXG4gICAgICAgICdnZXQnXG4gICAgICAgICdhY3F1aXJlJ1xuICAgICAgICAnZ3JhYidcbiAgICAgICAgJ2dyYXNwJ1xuICAgICAgICAnb2J0YWluJ1xuICAgICAgICAnYnV5J1xuICAgICAgICAnY2hvb3NlJ1xuICAgIF1cbiAgICBnbzogW1xuICAgICAgICAnd2FsaydcbiAgICAgICAgJ3BlcmFtYnVsYXRlJ1xuICAgICAgICAnbW92ZSdcbiAgICAgICAgJ3RyYXZlbCdcbiAgICAgICAgJ2pvdXJuZXknXG4gICAgICAgICdtb3NleSdcbiAgICBdXG4gICAgZ2l2ZTogW1xuICAgICAgICAnZGVsaXZlcidcbiAgICAgICAgJ2RvbmF0ZSdcbiAgICAgICAgJ2hhbmQgb3ZlcidcbiAgICAgICAgJ3ByZXNlbnQnXG4gICAgICAgICdlbmRvdydcbiAgICAgICAgJ2JlcXVlYXRoJ1xuICAgICAgICAnYmVzdG93J1xuICAgICAgICAncmVsaW5xdWlzaCdcbiAgICBdXG4gICAgZ2FyZGVuOiBbXG4gICAgICAgICdwbG90J1xuICAgICAgICAncGxhbnRzJ1xuICAgICAgICAncHJvZHVjZSdcbiAgICBdXG4gICAgZmxvd2VyOiBbXG4gICAgICAgICdmbG91cidcbiAgICBdXG4gICAgc29kYTogW1xuICAgICAgICAncG9wJ1xuICAgIF1cbiAgICBtYXJnYXJpbmU6IFtcbiAgICAgICAgJ2J1dHRlcidcbiAgICBdXG4gICAgc3RpcjogW1xuICAgICAgICAnd2hpcCdcbiAgICAgICAgJ3B1bHNlJ1xuICAgICAgICAndmlicmF0ZSdcbiAgICAgICAgJ21peCdcbiAgICAgICAgJ2JsZW5kJ1xuICAgICAgICAnYWdpdGF0ZSdcbiAgICAgICAgJ2NodXJuJ1xuICAgICAgICAnYmVhdCdcbiAgICBdXG4gICAgYXR0YWNrOiBbXG4gICAgICAgICdmaWdodCdcbiAgICAgICAgJ3B1bmNoJ1xuICAgICAgICAnYml0ZSdcbiAgICAgICAgJ2ludGVydmVuZSdcbiAgICBdXG4gICAgYmFkZ2U6IFtcbiAgICAgICAgJ3NoZXJpZmYnXG4gICAgICAgICdzdGlja2VyJ1xuICAgIF1cbiAgICBlbnRlcjogW1xuICAgICAgICAnaW4nXG4gICAgICAgICdpbnNpZGUnXG4gICAgXVxuICAgIGV4aXQ6IFtcbiAgICAgICAgJ2xlYXZlJ1xuICAgICAgICAnb3V0J1xuICAgICAgICAnb3V0c2lkZSdcbiAgICAgICAgJ3dpdGhkcmF3J1xuICAgICAgICAnZmxlZSdcbiAgICAgICAgJ2RlcGFydCdcbiAgICAgICAgJ2RlY2FtcCdcbiAgICBdXG4iLCJtID0gcmVxdWlyZSgnbWl0aHJpbCcpXG5XYWxlVnNTaGFyYyA9IHJlcXVpcmUoJ2FwcC93YWxldnNzaGFyYycpXG5cblxuU3RyaW5nLnByb3RvdHlwZS5jYXBpdGFsaXplID0gLT5cbiAgICBAWzBdLnRvVXBwZXJDYXNlKCkgKyBAWzEuLl1cblxuXG5JVEVNX05BTUVTID0ge1xuICAgIGVnZzogJ0VnZydcbiAgICBjdXR0bGVmaXNoOiAnQ3V0dGxlZmlzaCdcbiAgICBmbG93ZXJzOiAnRmxvd2VycydcbiAgICBzb2RhOiAnQmFraW5nIFNvZGEnXG4gICAgcGFuY2FrZXM6ICdQYW5jYWtlcydcbiAgICBzeXJ1cDogJ01hcGxlIFN5cnVwJ1xuICAgIG1hcmdhcmluZTogJ01hcmdhcmluZSdcbiAgICB1bWJyZWxsYTogJ1VtYnJlbGxhJ1xuICAgIGJhZGdlOiAnQmFkZ2UgU3RpY2tlcidcbiAgICBtaWxrOiAnTWFuYXRlZSBNaWxrJ1xuICAgICdyZWQgaGVycmluZyc6ICdSZWQgSGVycmluZydcbiAgICAnY293Ym95IGhhdCc6ICdDb3dib3kgSGF0J1xuICAgICdyYWluYm93IHdpZyc6ICdSYWluYm93IFdpZydcbiAgICAnbW90b3JjeWNsZSBoZWxtZXQnOiAnTW90b3JjeWNsZSBIZWxtZXQnXG4gICAgJ3N0b3ZlcGlwZSBoYXQnOiAnU3RvdmVwaXBlIEhhdCdcbiAgICAnbGVhdGhlciBqYWNrZXQnOiAnTGVhdGhlciBKYWNrZXQnXG4gICAgJ2Nsb3duIHN1aXQnOiAnQ2xvd24gU3VpdCdcbiAgICAnb2xkdGltZXkgc3VpdCc6ICdPbGQtVGltZXkgU3VpdCdcbiAgICAnY293IHByaW50IHZlc3QnOiAnQ293IFByaW50IFZlc3QnXG4gICAgJ2Zha2UgYmVhcmQnOiAnRmFrZSBCZWFyZCdcbiAgICAnZ3VuIGJlbHQnOiAnR3VuIEJlbHQnXG4gICAgJ21ldGFsIGNoYWluJzogJ01ldGFsIENoYWluJ1xuICAgICdydWJiZXIgY2hpY2tlbic6ICdSdWJiZXIgQ2hpY2tlbidcbiAgICAncXVhZHJhdGljIGV5ZSc6ICdRdWFkcmF0aWMgRXllJ1xufVxuXG5cbmNsYXNzIFRleHRUeXBlclxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAY3VycmVudE1lc3NhZ2UgPSAnJ1xuICAgICAgICBAaSA9IDBcblxuICAgIHR5cGVMb29wOiA9PlxuICAgICAgICBAaSsrXG4gICAgICAgIG0ucmVkcmF3KClcbiAgICAgICAgaWYgbm90IEBpc0RvbmUoKVxuICAgICAgICAgICAgc2V0VGltZW91dChAdHlwZUxvb3AsIDYpXG5cbiAgICBzZXRNZXNzYWdlOiAobWVzc2FnZSkgLT5cbiAgICAgICAgQGN1cnJlbnRNZXNzYWdlID0gbWVzc2FnZVxuICAgICAgICBAaSA9IDBcbiAgICAgICAgc2V0VGltZW91dChAdHlwZUxvb3AsIDYpXG5cbiAgICBzaG93QWxsOiAtPlxuICAgICAgICBAaSA9IEBjdXJyZW50TWVzc2FnZS5sZW5ndGggLSAxXG5cbiAgICBnZXRUZXh0U29GYXI6IC0+XG4gICAgICAgIEBjdXJyZW50TWVzc2FnZVsuLkBpXVxuXG4gICAgaXNEb25lOiAtPlxuICAgICAgICBAaSA+PSBAY3VycmVudE1lc3NhZ2UubGVuZ3RoIC0gMVxuICAgIFxuXG5tb2R1bGUuZXhwb3J0cyA9IChlbmdpbmUpIC0+XG4gICAgY29udHJvbGxlcjogY2xhc3NcbiAgICAgICAgY29uc3RydWN0b3I6IC0+XG5cbiAgICAgICAgICAgIFdhbGVWc1NoYXJjKGVuZ2luZSlcbiAgICAgICAgICAgIGRpZExvYWQgPSBlbmdpbmUubG9hZCgpXG5cbiAgICAgICAgICAgIEB2bSA9IHt9XG4gICAgICAgICAgICBAdm0uY29tbWFuZCA9IG0ucHJvcCgnJylcbiAgICAgICAgICAgIEB2bS50eXBlciA9IG5ldyBUZXh0VHlwZXIoKVxuXG4gICAgICAgICAgICBlbmdpbmUubGlzdGVuID0+XG4gICAgICAgICAgICAgICAgQHZtLnR5cGVyLnNldE1lc3NhZ2UoZW5naW5lLmdldEN1cnJlbnRNZXNzYWdlKCkpXG4gICAgICAgICAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICAgICAgICAgIGVuZ2luZS5zYXZlKClcblxuICAgICAgICAgICAgaWYgZGlkTG9hZFxuICAgICAgICAgICAgICAgIGVuZ2luZS5kb0NvbW1hbmQoJ2xvb2snKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGVuZ2luZS5nb1RvU3RhcnQoKVxuXG4gICAgICAgIG9uQ29tbWFuZFN1Ym1pdDogKGUpID0+XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgIGlmIEB2bS50eXBlci5pc0RvbmUoKVxuICAgICAgICAgICAgICAgIGVuZ2luZS5kb0NvbW1hbmQoQHZtLmNvbW1hbmQoKSlcbiAgICAgICAgICAgICAgICBAdm0uY29tbWFuZCgnJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAdm0udHlwZXIuc2hvd0FsbCgpXG5cblxuICAgIHZpZXc6IChjdHJsKSAtPlxuICAgICAgICBbXG4gICAgICAgICAgICBtICcuc2lkZWJhcicsXG4gICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0ICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzI2MHB4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMjBweCdcbiAgICAgICAgICAgICAgICBtICdoMicsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAwXG4gICAgICAgICAgICAgICAgICAgICdJbnZlbnRvcnknXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICBmb3IgaXRlbSwgc3RhdGUgb2YgZW5naW5lLmdldEludmVudG9yeSgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzdGF0ZSA9PSAnZ290dGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJVEVNX05BTUVTW2l0ZW1dXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHN0YXRlID09ICd1c2VkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbGluZS10aHJvdWdoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJVEVNX05BTUVTW2l0ZW1dXG4gICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZXN0YXJ0IHRoZSBnYW1lPyBUaGlzIHdpbGwgY2xlYXIgYWxsIHByb2dyZXNzIGFuZCBpdGVtcyB5b3UgaGF2ZSBhY2hpZXZlZCBzbyBmYXIuJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ1NhdmUgZ2FtZSBkZWxldGVkJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgJ1Jlc3RhcnQgZ2FtZSdcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgbSAnYnV0dG9uJyxcbiAgICAgICAgICAgICAgICAgICAgb25jbGljazogKGUpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncHJvZ3Jlc3MnLCBKU09OLnN0cmluZ2lmeSh7XCJpbnZlbnRvcnlcIjp7XCJiYWRnZVwiOlwiZ290dGVuXCIsXCJwYW5jYWtlc1wiOlwiZ290dGVuXCJ9LFwiY3VycmVudFJvb21OYW1lXCI6XCJTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pXCIsXCJwcmV2aW91c0NvbW1hbmRzXCI6W1wiX19lbnRlcl9yb29tX19cIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibm9ydGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ0YWxrIHdhbGVcIixcImxvb2tcIixcImVhc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ0YWxrIGJpbGx5XCIsXCJkcml2ZSBjYXJcIixcImxvb2tcIixcIm5vcnRoXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibm9ydGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJtYWtlIGNvc3R1bWVcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJjb3dib3kgaGF0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwib2xkdGltZXkgc3VpdFwiLFwiX19lbnRlcl9yb29tX19cIixcIm1ldGFsIGNoYWluXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibG9vayBtZXRhbCBjaGFpblwiLFwibG9vayBvbGQtdGltZXkgc3VpdFwiLFwibG9vayBvbGQtdGltZXkgc3VpdFwiLFwibG9vayBjb3dib3kgaGF0XCIsXCJsb29rIG9sZCB0aW1leSBzdWl0XCIsXCJsb29rIG9sZHRpbWV5IHN1aXRcIixcImdvIG5vcnRoXCIsXCJzb3V0aFwiLFwiZWFzdFwiLFwid2VzdFwiLFwiX19lbnRlcl9yb29tX19cIixcImVhc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ0YWxrIG1hbmFnZXJcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJubyBzZWFsXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwidGFsayBtYW5hZ2VyXCIsXCJzb3V0aFwiLFwiZWFzdFwiLFwid2VzdFwiLFwiX19lbnRlcl9yb29tX19cIixcIm5vcnRoXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibWFrZSBjb3N0dW1lXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwicmFpbmJvdyB3aWdcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJjb3cgcHJpbnQgdmVzdFwiLFwiX19lbnRlcl9yb29tX19cIixcImZha2UgYmVhcmRcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJsb29rIHJhaW5ib3cgd2lnXCIsXCJsb29rIGNvdyBwcmluIHZlc3RcIixcImxvb2sgY293IHByaW50IHZlc3RcIixcImxvb2sgZmFrZSBiZWFyZFwiLFwic291dGhcIixcIndlc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJub3J0aFwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcIndlc3RcIixcIm1ha2UgY29zdHVtZVwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcImdvIHdlc3RcIixcInJhaW5ib3cgd2lnaFwiLFwicmFpbmJvdyB3aWdcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ2ZXN0XCIsXCJjb3dwcmludCB2ZXN0XCIsXCJjb3cgcHJpbnQgdmVzdFwiLFwiX19lbnRlcl9yb29tX19cIixcImZha2UgYmVhcmRcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ0YWxrIG1hbmFnZXJcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJsb29rIGJyaWVmY2FzZVwiLFwic2VhbFwiLFwibG9va1wiLFwic2VhbFwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwic291dGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZ2V0IGN1ZGRsZWZpc2hcIixcImdldCBjdXR0bGVmaXNoXCIsXCJsb29rIGN1dHRsZWZpc2hcIixcIm5vcnRoXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibm9ydGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJlYXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZ2V0IGJhZGdlXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwibG9va1wiLFwibm9ydGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJnZXQgdW1icmVsbGFcIixcIm5vcnRoXCIsXCJsb29rXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwidGFsayBmaXNoXCIsXCJsb29rXCIsXCJlYXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwic291aHRcIixcInNvdXRoXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwieWVzXCIsXCJzb3VodFwiLFwic291dGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZ2V0IGZsb3dlcnNcIixcImdpdmUgdW1icmVsbGFcIixcImdldCBmbG93ZXJzXCIsXCJsb29rXCIsXCJlYXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwic291dGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJlYXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZWFzdFwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwid2VzdFwiLFwiX19lbnRlcl9yb29tX19cIixcIndlc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJ3ZXN0XCIsXCJfX2VudGVyX3Jvb21fX1wiLFwid2VzdFwiLFwiZ2V0IHNvZGFcIixcImxvb2sgZm91bnRhaW5cIixcImdldCBzcHJpdHpcIixcImxvb2sgZm91bnRhaW5cIixcImxvb2sgbWFwbGUgc29kYVwiLFwiZ2V0IG1hcGxlIHNvZGFcIixcImVhc3RcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJub3J0aFwiLFwiX19lbnRlcl9yb29tX19cIixcImxvb2sgb3ZlblwiLFwic291dGhcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJub3J0aFwiLFwiX19lbnRlcl9yb29tX19cIixcIm1ha2UgcGFuY2FrZXNcIixcImdldCBiYWtpbmcgc29kYVwiLFwibWFrZSBwYW5jYWtlc1wiLFwiX19lbnRlcl9yb29tX19cIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJiYWtpbmcgc29kYVwiLFwiZmxvd2VyXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiZWdnXCIsXCJtaWxrXCIsXCJtYXJnYXJpbmVcIixcIl9fZW50ZXJfcm9vbV9fXCIsXCJzdGlyXCIsXCJfX2VudGVyX3Jvb21fX1wiLFwiX19lbnRlcl9yb29tX19cIixcInN5cnVwXCIsXCJfX2VudGVyX3Jvb21fX1wiXSxcImZsYWdzXCI6e1widGFsa2VkX3RvX3dhbGVcIjp0cnVlLFwiZHJvdmVfYmlsbHlfdG9faG9zcGl0YWxcIjp0cnVlLFwiZ2l2ZW5fdW1icmVsbGFcIjp0cnVlLFwiaGF2ZV9hbGxfaXRlbXNcIjp0cnVlfSxcInJvb21zRW50ZXJlZFwiOntcIldhbGUgdnMgU2hhcmM6IFRoZSBDb21pYzogVGhlIEludGVyYWN0aXZlIFNvZnR3YXJlIFRpdGxlIEZvciBZb3VyIENvbXB1dGVyIEJveFwiOjEsXCJIb3cgVG8gUGxheVwiOjEsXCJPY2VhblwiOjEsXCJXYWxlXCI6NCxcIkJpbGx5IE9jZWFuXCI6MixcIlNlYWwgb3IgTm8gU2VhbFwiOjUsXCJTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20pXCI6MyxcIlNlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgSGVhZGdlYXIpXCI6MyxcIlNlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcylcIjozLFwiU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBBY2Nlc3NvcnkpXCI6MyxcIlNlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKVwiOjYsXCJTZWFsIG9yIE5vIFNlYWwgKE9uIFN0YWdlISlcIjoyLFwiV2V0dGVyIE9jZWFuXCI6MSxcIkN1dHRsZWZpc2hcIjozLFwiQWNodGlwdXMncyBHYXJkZW5cIjozLFwiV2F0ZXIgV29ybGRcIjozLFwiV2F0ZXIgV29ybGQgKEdpZnQgU2hvcClcIjoxLFwiV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdClcIjoyLFwiV2F0ZXIgV29ybGQgKE1lY2hhbmljYWwgUm9vbSBUeXBlIFBsYWNlKVwiOjEsXCJBY2h0aXB1cydzIEdhcmRlbiAoSW5zaWRlKVwiOjEsXCJTdGVhayBhbmQgU2hha2VcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KVwiOjMsXCJTdGVhayBhbmQgU2hha2UgKFNvZGEgRm91bnRhaW4pXCI6MSxcIlN0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbilcIjozLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbilcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGFuIGVtcHR5IGJvd2wgc2l0dGluZyB0aGVyZSlcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpXCI6MSxcIlN0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSlcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgbWl4ZWQgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSlcIjoxLFwiU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIHBsYXRlIG9mIGRyeSBwYW5jYWtlcyBzaXR0aW5nIHRoZXJlKVwiOjF9fSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcnXG4gICAgICAgICAgICAgICAgICAgICdMb2FkIEdhbWUnXG4gICAgICAgICAgICAgICAgbSAndGV4dGFyZWEnLFxuICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzMwMHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAnMTBweCdcbiAgICAgICAgICAgICAgICAgICAgbS50cnVzdChlbmdpbmUucHJldmlvdXNDb21tYW5kcy5qb2luKCdcXG4nKSlcblxuICAgICAgICAgICAgICAgIG0gJ3RleHRhcmVhJyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICczMDBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJSdcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblRvcDogJzEwcHgnXG4gICAgICAgICAgICAgICAgICAgIG0udHJ1c3QobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Byb2dyZXNzJykpXG5cbiAgICAgICAgICAgIG0gJy5jb250ZW50JyxcbiAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICh3aW5kb3cuaW5uZXJXaWR0aCAtIDM2MCkgKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICcyMHB4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nVG9wOiAwXG4gICAgICAgICAgICAgICAgbSAnaDEnLCBlbmdpbmUuZ2V0Q3VycmVudFJvb21OYW1lKClcbiAgICAgICAgICAgICAgICBtICdwJywgbS50cnVzdChjdHJsLnZtLnR5cGVyLmdldFRleHRTb0ZhcigpKVxuXG4gICAgICAgICAgICAgICAgaWYgZW5naW5lLmdldEN1cnJlbnRSb29tTmFtZSgpID09ICdFbmQnXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2RpdicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2ltZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJy9zaGFyay1zaG93ZXJpbmcucG5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnInXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdicidcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2gzJywgJ0RvIHlvdSBldmVuIGZlZWRiYWNrPydcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2RpdicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAnaWZyYW1lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vZm9ybXMvZC8xZHJIS3NmRXpTX3pBMTdZVGQ3T2FXWWlzMVE4SmpmMzNmcjdLNk9jUkJvay92aWV3Zm9ybT9lbWJlZGRlZD10cnVlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzc2MCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnNTAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZWJvcmRlcjogJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbmhlaWdodDogJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbndpZHRoOiAnMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMnB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIGdyZXknXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogJzIwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdMb2FkaW5nLi4uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3RleHRhcmVhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICc1MDBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbS50cnVzdChlbmdpbmUucHJldmlvdXNDb21tYW5kcy5qb2luKCdcXG4nKSlcbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbSAnZm9ybScsXG4gICAgICAgICAgICAgICAgICAgICAgICBvbnN1Ym1pdDogY3RybC5vbkNvbW1hbmRTdWJtaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2lucHV0W3R5cGU9dGV4dF0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jaGFuZ2U6IG0ud2l0aEF0dHIoJ3ZhbHVlJywgY3RybC52bS5jb21tYW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBjdHJsLnZtLmNvbW1hbmQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzogKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIG5vdCBpc0luaXRpYWxpemVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmZvY3VzKClcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvblt0eXBlPXN1Ym1pdF0nLCAnRG8nXG4gICAgICAgIF1cbiIsIlwiXCJcIlxuQ29uZGl0aW9uczpcbiAgICBAbWF0Y2hlcyhwYXR0ZXJuKVxuICAgIEBoYXNJdGVtKGl0ZW0gbmFtZSlcbiAgICBAcGVyY2VudENoYW5jZShjaGFuY2Ugb3V0IG9mIDEwMClcbiAgICBAZmxhZ0lzKGZsYWcgbmFtZSwgdmFsdWUpXG5cblJlc3VsdHM6XG4gICAgQHByaW50KHRleHQpXG4gICAgQGdvVG9Sb29tKHJvb20gbmFtZSlcbiAgICBAc2V0RmxhZyhmbGFnIG5hbWUsIHZhbHVlKVxuXCJcIlwiXG5cblxubW9kdWxlLmV4cG9ydHMgPSAoZW5naW5lKSAtPlxuICAgIGhlbHBUZXh0ID0gXCJcIlwiXG5BZHZhbmNlIHRocm91Z2ggdGhlIGdhbWUgYnkgdHlwaW5nIGNvbW1hbmRzIGxpa2UgPHN0cm9uZz5sb29rLCBnZXQsIGFuZCBnby48L3N0cm9uZz48YnI+XG5Db21tYW5kcyBjYXRhbG9ndWUgYW5kL29yIHByZSBzZXQgY29tbWFuZCBwcmVmaXggYnV0dG9uczogPHN0cm9uZz5HbywgdGFsaywgZ2V0LCBsb29rLCB1c2UuLi48L3N0cm9uZz48YnI+XG5Mb29rIGluIGFuIGFyZWEgdG8gZ2FpbiBtb3JlIGluZm9ybWF0aW9uIG9yIGxvb2sgYXQgb2JqZWN0czogPHN0cm9uZz4obG9vayBmaXNoKTwvc3Ryb25nPjxicj5cbk1vdmUgYnkgdHlwaW5nIGdvIGNvbW1hbmRzOiA8c3Ryb25nPihnbyBlYXN0KTwvc3Ryb25nPjxicj5cbkVuZ2FnZSBpbiBwaGlsb3NvcGhpY2FsIGRlYmF0ZTogPHN0cm9uZz4odGFsayBzb3JjZXJlc3MpPC9zdHJvbmc+PGJyPlxuVXNlIGl0ZW1zIGluIGludmVudG9yeTogPHN0cm9uZz4odXNlIGxpZ2h0c2FiZXIpPC9zdHJvbmc+PGJyPlxuVGhlcmUgYXJlIG90aGVyIGNvbW1hbmRzIHRvbyBhbmQgc29tZSB5b3UgY2FuIGp1c3QgY2xpY2sgb24gYSBidXR0b24gdG8gdXNlLiBFeHBlcmltZW50IGFuZCB0cnkgdGhpbmdzIGluIHRoaXMgYmVhdXRpZnVsIG5ldyB3b3JsZCBiZWZvcmUgeW91Ljxicj5cblR5cGUgPHN0cm9uZz5cImhlbHBcIjwvc3Ryb25nPiB0byBzZWUgdGhpcyBtZW51IGFnYWluPGJyPlxuXCJcIlwiXG5cbiAgICBlbmdpbmUuc2V0QWxyZWFkeUdvdHRlbk1lc3NhZ2UoJ1doYXQgYXJlIHlvdSBjcmF6eSwgd2h5IHdvdWxkIHlvdSBuZWVkIG1vcmUvYW5vdGhlciBvZiB0aGF0L3Rob3NlPycpXG5cbiAgICBlbmdpbmUuc2V0VW5pdmVyc2FsQ29tbWFuZHMgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2RpZScpXG4gICAgICAgICAgICBAcHJpbnQoJ1doYXQgYXJlIHlvdSBkb2luZz8gWW91IGFyZSBkZWFkIG5vdy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnZXQgeWUgZmxhc2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgY2FuXFwndCBnZXQgeWUgZmxhc2suJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2luJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGRpZCBpdC4gWW91IHdpbi4gQnV5IHlvdXJzZWxmIGEgcGl6emEgYmVjYXVzZSB5b3UgYXJlIHNvIGNsZXZlci4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdpbnYnKSBvciBAbWF0Y2hlcygnaW52ZW50b3J5JylcbiAgICAgICAgICAgIGlmIE9iamVjdC5rZXlzKEBnZXRJbnZlbnRvcnkoKSkubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIEBwcmludCgnSXQgdGVsbHMgeW91IHdoYXQgaXMgaW52ZW50b3J5IHJpZ2h0IG92ZXIgdGhlcmUgb24gdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIHNjcmVlbi4gSXMgdHlwaW5nIHRoaXMgY29tbWFuZCByZWFsbHkgbmVjZXNzYXJ5PycpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3VyIGludmVudG9yeSBpcyBlbXB0eSB5b3UgYmlnIGR1bWIgYnV0dC4gU29ycnksIHRoYXQgd2FzIHJ1ZGUgSSBtZWFudCB0byBzYXksIFwiWW91IGJ1dHQuXCInKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdoZWxwJylcbiAgICAgICAgICAgIEBwcmludChoZWxwVGV4dClcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGN1dHRsZWZpc2gnKSBhbmQgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgQHByaW50KCdBc2lkZSBmcm9tIGJlaW5nIHJlYWxseSBmdW5ueSBsb29raW5nLCBoaWdobHkgaW50ZWxsaWdlbnQgYW5kIGhpZ2hseSB1Z2x5LCBjdXR0bGVmaXNoIGNhbiBhbHNvIHJlbGVhc2UgYW4gaW5rIGxpa2Ugc3Vic3RhbmNlIHRvIGVzY2FwZSBwcmVkYXRvcnMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGVnZycpIGFuZCBAaGFzSXRlbSgnZWdnJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBsb29rcyB0byBiZSBhbiBvcmRpbmFyeSBlZ2cuIEJ1dCByZW1lbWJlciwgaXQgd2FzIHB1bGxlZCBvdXQgb2YgQmlsbHkgT2NlYW5cXCdzIGdsb3ZlIGJveCwgc28gbWF5YmUgbm90PycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmbG93ZXJzJykgYW5kIEBoYXNJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlc2UgYXJlIHNvbWUgdmVyc2F0aWxlIGxvb2tpbmcgZmxvd2Vycy4gU28gbXVjaCBzbywgeW91IGNhbiBzZW5zZSBhIHB1biBsaWtlIGF1cmEgc3Vycm91bmRpbmcgdGhlbS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgdW1icmVsbGEnKSBhbmQgQGhhc0l0ZW0oJ3VtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyB1bWJyZWxsYSBjb3VsZCBwcm92aWRlIGEgbG90IG9mIHNoYWRlLiBJIGRvblxcJ3Qgc2VlIGhvdyBpdCBjYW4gZml0IGluIHlvdXIgcG9ja2V0cy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgc29kYScpIGFuZCBAaGFzSXRlbSgnc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyBhIGNhbiBvZiBzb2RhIHlvdSBmb3VuZCBpbiB0aGUgb3ZlbiBhdCBTdGVhayBhbmQgU2hha2UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHN5cnVwJykgYW5kIEBoYXNJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgYmFnIG9mIG1hcGxlIGZsYXZvcmVkIGZvdW50YWluIHN5cnVwLiBJdCBjb3VsZCBoYXZlIG90aGVyIHVzZXMgdG9vLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBoZXJyaW5nJykgYW5kIEBoYXNJdGVtKCdoZXJyaW5nJylcbiAgICAgICAgICAgIEBwcmludCgnSXQgaXMgYSBjYW4gb2YgcGlja2xlZCBoZXJyaW5nIHlvdSB3b24gb24gYSBnYW1lc2hvdy4gV2F5IHRvIGdvLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayByZWQgaGVycmluZycpIGFuZCBAaGFzSXRlbSgncmVkIGhlcnJpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdJdCBpcyBhIHJlZCBoZXJyaW5nLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBtYXJnYXJpbmUnKSBhbmQgQGhhc0l0ZW0oJ21hcmdhcmluZScpXG4gICAgICAgICAgICBAcHJpbnQoJ05vIElmcywgQW5kcyBvciBCdXR0ZXIgdmFndWVseSBtYXJnYXJpbmUgc3ByZWFkIHR5cGUgcHJvZHVjdC4gTW9kZWxlZCBieSBMb3UgRmVycmlnbm8uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGJhZGdlJykgYW5kIEBoYXNJdGVtKCdiYWRnZScpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyB0aGUganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXIgeW91IGdvdCBhdCB0aGUgV2F0ZXIgV29ybGQgZ2lmdCBzaG9wLiBJbiBhIHBvb3JseSBsaXQgcm9vbSwgb25lIG1pZ2h0IG1pc3Rha2UgdGhpcyBmb3IgYW4gYXV0aGVudGljIGp1bmlvciBtYXJpbmUgc2hlcmlmZiBiYWRnZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgcGFuY2FrZXMnKSBhbmQgQGhhc0l0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgIEBwcmludCgnTXlzdGljYWwgcGFuY2FrZXMgeW91IG1hZGUgd2l0aCBhbiBlbmNoYW50ZWQgcmVjaXBlIGFuZCB0b3RhbGx5IG5vdCB0aGUgY29ycmVjdCBpbmdyZWRpZW50cywgcmVtZW1iZXI/IFRoYXQgd2FzIFVILW1heS16aW5nISBUYWtlIHRoZW0gdG8gV2FsZSBhbmQgaHVycnkuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1pbGsnKSBhbmQgQGhhc0l0ZW0oJ21pbGsnKVxuICAgICAgICAgICAgQHByaW50KCdXaG9sZSBtaWxrLCBhcHBhcmVudGx5IGZyb20gYSByZWFsIHNlYSBjb3cuIElzIGl0IHN0aWxsIG9rYXkgdG8gY2FsbCB0aGVtIHRoYXQ/JylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHF1YWRyYXRpYyBleWUnKSBhbmQgQGhhc0l0ZW0oJ3F1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQHByaW50KCc/Pz8nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY293Ym95IGhhdCcpIGFuZCBAaGFzSXRlbSgnY293Ym95IGhhdCcpXG4gICAgICAgICAgICBAcHJpbnQoJ05pY2UgaGF0LCBwaWxncmltLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayByYWluYm93IHdpZycpIGFuZCBAaGFzSXRlbSgncmFpbmJvdyB3aWcnKVxuICAgICAgICAgICAgQHByaW50KCdUaGVyZSBzaG91bGQgYmUgbGF3cyBhZ2FpbnN0IHRoaXMga2luZCBvZiB0aGluZy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgbW90b3JjeWNsZSBoZWxtZXQnKSBhbmQgQGhhc0l0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgICAgIEBwcmludCgnSXQgaXMgdGhlIGtpbmQgd2l0aCB0aGUgZnVsbCB2aXNvciBzbyB5b3UgY291bGQganVzdCBiZSB0aGUgc3R1bnQgZG91YmxlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzdG92ZXBpcGUgaGF0JykgYW5kIEBoYXNJdGVtKCdzdG92ZXBpcGUgaGF0JylcbiAgICAgICAgICAgIEBwcmludCgnRm91ciBzY29yZSBhbmQgc2V2ZW4geWVhcnMgYWdvLi4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGxlYXRoZXIgamFja2V0JykgYW5kIEBoYXNJdGVtKCdsZWF0aGVyIGphY2tldCcpXG4gICAgICAgICAgICBAcHJpbnQoJ01lbWJlcnMgb25seS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY2xvd25zdWl0JykgYW5kIEBoYXNJdGVtKCdjbG93bnN1aXQnKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIHNob3VsZCBzY2FyZSB0aGUga2lkcy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgb2xkIHRpbWV5IHN1aXQnKSBhbmQgQGhhc0l0ZW0oJ29sZCB0aW1leSBzdWl0JylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGZlZWwgbGlrZSBzb21lIHNlcmlvdXMgZnJpZWQgY2hpY2tlbiwgYW5kIHlvdSBkb27igJl0IGV2ZW4ga25vdyB3aGF0IHRoYXQgaXMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGNvd3ByaW50IHZlc3QnKSBhbmQgQGhhc0l0ZW0oJ2Nvd3ByaW50IHZlc3QnKVxuICAgICAgICAgICAgQHByaW50KCdWZXJ5IFRveSBTdG9yeS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZmFrZSBiZWFyZCcpIGFuZCBAaGFzSXRlbSgnZmFrZSBiZWFyZCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBmZWVsIGxpa2UgY29tcGxhaW5pbmcgYWJvdXQga2lkcyBvbiB5b3VyIGxhd24gYW5kIGhvdyB5b3UgZG9uXFwndCBldmVuIGtub3cgd2hhdCBhIHR3aXR0ZXIgaXMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGd1biBiZWx0JykgYW5kIEBoYXNJdGVtKCdndW4gYmVsdCcpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgdHJ1c3R5IHNpeCBzaG9vdGVyLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBtZXRhbCBjaGFpbicpIGFuZCBAaGFzSXRlbSgnbWV0YWwgY2hhaW4nKVxuICAgICAgICAgICAgQHByaW50KCdBIGNoYWluIGlzIG9ubHkgYXMgc3Ryb25nIGFzLS0gd2FpdCwgd3Jvbmcgc2hvdy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgcnViYmVyIGNoaWNrZW4nKSBhbmQgQGhhc0l0ZW0oJ3J1YmJlciBjaGlja2VuJylcbiAgICAgICAgICAgIEBwcmludCgnU29ycnksIG5vIHB1bGxleSBpbiBpdC4nKVxuXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0kgYW0gbm90IGF1dGhvcml6ZWQgdG8gdGVsbCB5b3UgYWJvdXQgdGhhdCB5ZXQuIFN0b3AgdHJ5aW5nIHRvIGNoZWF0IG1hbiEnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UnKVxuICAgICAgICAgICAgQHByaW50KCdJIGFtIG5vdCBhdXRob3JpemVkIHRvIGdpdmUgdGhhdCB0byB5b3UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJylcbiAgICAgICAgICAgIEBwcmludCgnV2hvIGFyZSB5b3UgdGFsa2luZyB0bz8nKVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgUGljayBhIHJhbmRvbSBkZWZhdWx0IHJlc3BvbnNlXG4gICAgICAgICAgICBkZWZhdWx0UmVzcG9uc2VzID0gW1xuICAgICAgICAgICAgICAgICdXaGF0IGFyZSB5b3UgZXZlbiB0cnlpbmcgdG8gZG8/ICBKdXN0IHN0b3AuJ1xuICAgICAgICAgICAgICAgICdHb29kIG9uZSBtYW4uJ1xuICAgICAgICAgICAgICAgICdXaG9hIHRoZXJlIEVhZ2VyIE1jQmVhdmVyISdcbiAgICAgICAgICAgICAgICAnRG9uXFwndCBkbyB0aGF0LidcbiAgICAgICAgICAgICAgICAnR3Jvc3MsIG5vIHdheS4nXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBAcHJpbnQoZGVmYXVsdFJlc3BvbnNlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqZGVmYXVsdFJlc3BvbnNlcy5sZW5ndGgpXSlcblxuICAgICAgICBcbiAgICBlbmdpbmUuc2V0QWZ0ZXJDb21tYW5kIC0+XG4gICAgICAgIGlmIChub3QgQGZsYWdJcygnaGF2ZV9hbGxfaXRlbXMnLCB0cnVlKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnZWdnJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ2Zsb3dlcnMnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnc29kYScpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdzeXJ1cCcpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdtaWxrJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ21hcmdhcmluZScpKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiV2VsbCwgSSB0aGluayBJIGhhdmUgYWxsIHRoZSBpbmdyZWRpZW50cyxcIiB5b3Ugc2F5IHRvIHlvdXJzZWxmLiBcIkkganVzdCBuZWVkIG9uZSBvZiB0aG9zZSBwbGFjZXMgd2hlcmUgeW91IHB1dCB0aGVtIHRvZ2V0aGVyIHNvIGl0IHR1cm5zIGludG8gc29tZXRoaW5nIHlvdSBjYW4gZWF0LiBZb3Uga25vdywgb25lIG9mIHRob3NlLi4uZm9vZCBwcmVwYXJpbmcgcm9vbXMuXCInKVxuICAgICAgICAgICAgICAgIEBzZXRGbGFnKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYWxlIHZzIFNoYXJjOiBUaGUgQ29taWM6IFRoZSBJbnRlcmFjdGl2ZSBTb2Z0d2FyZSBUaXRsZSBGb3IgWW91ciBDb21wdXRlciBCb3gnLCAtPlxuICAgICAgICBAcHJpbnQoJ1RoYW5rIHlvdSBmb3IgYnV5aW5nIHRoaXMgZ2FtZSEgIFR5cGUgdGhpbmdzIGluIHRoZSBib3ggdG8gbWFrZSB0aGluZ3MgaGFwcGVuIScpXG4gICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0hvdyBUbyBQbGF5JylcblxuICAgIGVuZ2luZS5hZGRSb29tICdIb3cgVG8gUGxheScsIC0+XG4gICAgICAgIEBwcmludChoZWxwVGV4dClcbiAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgIEBnb1RvUm9vbSgnT2NlYW4nKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ09jZWFuJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIGFuZCBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICBAcHJpbnQoJ1dlbGNvbWUgdG8gV2FsZSB2cyBTaGFyYzogVGhlIFZpZGVvIEdhbWUuIFlvdSBhcmUgU2hhcmMgYW5kIHlvdXIgJDIzIHNoYW1wb28gaXMgbWlzc2luZy4gWW91IHN1c3BlY3QgZm91bCBwbGF5LiBPYnZpb3VzIGV4aXRzIGFyZSBOb3J0aCB0byB5b3VyIGZyaWVuZCBXYWxlLicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgaXMgcXVpdGUgcG9zc2libHkgdGhlIG1vc3QgdW5pbnRlcmVzdGluZyBjdWJlIG9mIHdhdGVyIGluIHRoZSBvY2Vhbi4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2FsZScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnSGV5LCBpdCBpcyB5b3VyIGZyaWVuZCwgV2FsZS4gSGUgaXMgZG9pbmcgdGhhdCB0aGluZyB3aGVyZSBoZSBoYXMgaGlzIGV5ZXMgY2xvc2VkIGFuZCBhY3RzIGxpa2UgaGUgZGlkIG5vdCBub3RpY2UgeW91ciBhcnJpdmFsLiBIZSBpcyBraW5kIG9mIGEgcHJpY2ssIGJ1dCBhbHNvIHlvdXIgZnJpZW5kLiBXaGF0IGNhbiB5b3UgZG8/IE9idmlvdXMgZXhpdHMgYXJlIE9jZWFuIHRvIHRoZSBzb3V0aCwgYSBzY2hvb2wgb2YgQ3V0dGxlZmlzaCB0byB0aGUgd2VzdCwgbW9yZSBPY2VhbiB0byB0aGUgbm9ydGgsIGFuZCBCaWxseSBPY2VhbiB0byB0aGUgZWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnV2FsZSBpcyBzdGlsbCBqdXN0IGZsb2F0aW5nIHRoZXJlIHRyeWluZyB0byBiZSBlbmlnbWF0aWMsIHdvdWxkIGhlIGV2ZW4gbm90aWNlIGlmIHlvdSBzYWlkIHNvbWV0aGluZz8gT2J2aW91cyBleGl0cyBhcmUgT2NlYW4gdG8gdGhlIHNvdXRoLCBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoIHRvIHRoZSB3ZXN0LCBtb3JlIE9jZWFuIHRvIHRoZSBub3J0aCwgYW5kIEJpbGx5IE9jZWFuIHRvIHRoZSBlYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayB3YWxlJylcbiAgICAgICAgICAgIEBwcmludCgnSGUgaXMganVzdCBmbG9hdGluZyB0aGVyZSwgZXllcyBjbG9zZWQsIHRyeWluZyB0byBzaHV0IG91dCB0aGlzIGVhcnRobHkgcmVhbG0uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnaXZlIHBhbmNha2VzJylcbiAgICAgICAgICAgIGlmIEBoYXNJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIkhleSBXYWxlLFwiIHlvdSBjYWxsIG91dCBhcyBpbnRydXNpdmVseSBhcyBwb3NzaWJsZSwgXCJJIGdvdCB5b3VyLS1cIiBCZWZvcmUgeW91IGNvdWxkIGZpbmlzaCB5b3VyIHNlbnRlbmNlLCB5b3VyIGJsdWJiZXJ5IGZyaWVuZCBoYXMgc25hdGNoZWQgdGhlIHBsYXRlIGF3YXkgYW5kLCBpbiBhIG1vc3QgdW5kaWduaWZpZWQgbWFubmVyLCBiZWdpbnMgbW93aW5nIHRocm91Z2ggdGhlIGZyaWVkIGRpc2NzIHlvdSBzbyBhcnRmdWxseSBwcmVwYXJlZC4gXCJTb3VsIHNlYXJjaGluZyB0YWtlcyBhIGxvdCBvZiBlbmVyZ3ksXCIgaGUgZXhwbGFpbnMgYmV0d2VlbiBiaXRlcy4gXCJJIGhhdmVuXFwndCBlYXRlbiBhbnl0aGluZyBhbGwgZGF5LlwiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ09uY2UgZmluaXNoZWQsIFdhbGUgc3RyYWlnaHRlbnMgaGltc2VsZiBvdXQsIGxvb2tpbmcgYSBtaXRlIGVtYmFycmFzc2VkIGZvciB0aGUgc2F2YWdlIGRpc3BsYXkgaGUganVzdCBwdXQgb24uIFwiV2hhdCB3YXMgaXQgeW91IG5lZWRlZD9cIiBcIk9oIFdhbGUsIGl0XFwncyB0ZXJyaWJsZS4gSSB0aGluayBteSAkMjMgc2hhbXBvbyB3YXMgc3RvbGVuIGFuZCB0aGUgZ2hvc3Qgb2YgbXkgbm90IHJlYWxseSBkZWFkIGZyaWVuZCBzYXlzIHRoZSBmYXRlIG9mIHRoZSB3b3JsZCBoYW5ncyBpbiB0aGUgYmFsYW5jZS5cIicpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSSBzZWUsXCIgc2F5cyBXYWxlLCBoaXMgdm9pY2UgYW5kIG1hbm5lciByZW1haW5pbmcgdW5jaGFuZ2VkIGRlc3BpdGUgdGhlIHRocmVhdCBvZiB0aGUgd29ybGQgdW5iYWxhbmNpbmcuIFwiU2hhcmMsIEkgZmVhciB0aGUgd29yc3QuIFlvdSBtdXN0IHN1bW1vbiB0aGUgZXRoZXJlYWwgZG9vci5cIicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJObywgV2FsZSxcIiB5b3Ugc2F5LCBcInlvdSBtYWRlIG1lIHN3ZWFyIGEgdGhvdXNhbmQgdm93cyBuZXZlciB0byBicmluZyB0aGF0IGN1cnNlZCByZWxpYyBiYWNrIGFtb25nIHVzLlwiIFwiSSBrbm93IHdoYXQgSSBzYWlkLCBidXQgSSBhbHNvIGtuZXcgdGhlcmUgd291bGQgY29tZSBhIHRpbWUgd2hlbiB3ZSB3b3VsZCBoYXZlIG5vIG90aGVyIGNob2ljZS5cIiAgWW91IHNob3VsZCBwcm9iYWJseSBzdW1tb24gdGhlIGRvb3IuJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcmVtb3ZlSXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZXRGbGFnKCdnaXZlbl9wYW5jYWtlcycsIHRydWUpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3VtbW9uIGRvb3InKSBhbmQgQGZsYWdJcygnZ2l2ZW5fcGFuY2FrZXMnLCB0cnVlKVxuICAgICAgICAgICAgQHByaW50KCdZb3UsIGZpbmFsbHkgY29udmluY2VkIG9mIHlvdXIgdXJnZW5jeSBhbmQgdXR0ZXIgZGVzcGVyYXRpb24sIHBlcmZvcm0gc29tZSBpbnRyaWNhdGUgcml0ZXMgYW5kIGluY2FudGF0aW9ucyB0aGF0IHdvdWxkIGJlIHJlYWxseSBjb29sIGlmIHlvdSBjb3VsZCBzZWUgdGhlbSwgYnV0IEkgZ3Vlc3MgeW91IHdpbGwganVzdCBoYXZlIHRvIHVzZSB5b3VyIGltYWdpbmF0aW9ucy4gVGV4dCBvbmx5IGZvb2xzISAgVGhlIGV0aGVyZWFsIGRvb3Igc3RhbmRzIG9wZW4gYmVmb3JlIHlvdS4nKVxuICAgICAgICAgICAgQHNldEZsYWcoJ3N1bW1vbmVkX2Rvb3InLCB0cnVlKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2VudGVyIGRvb3InKSBhbmQgQGZsYWdJcygnc3VtbW9uZWRfZG9vcicsIHRydWUpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1RoZSBFdGhlcmVhbCBSZWFsbScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayB3YWxlJylcbiAgICAgICAgICAgIGlmIG5vdCBAZmxhZ0lzKCd0YWxrZWRfdG9fd2FsZScsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdXYWxlIGlzIHRyeWluZyB0byBtZWRpdGF0ZSBvciBzb21ldGhpbmcgcHJldGVudGlvdXMgdGhhdCB5b3UgZG9uXFwndCBjYXJlIGFib3V0LiBZb3UgaGF2ZSBzb21ldGhpbmcgaW1wb3J0YW50ISBcIldhbGVcIiB5b3Ugc2hvdXQsIFwiSSBuZWVkIHlvdXIgaGVscCEgVGhlIGNvbmRpdGlvbiBvZiBteSBtYWduaWZpY2VudCBzY2FscCBpcyBhdCBzdGFrZS5cIicpXG4gICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdXYWxlIHNpZ2hzIGEgaGVhdnksIGxhYm9yZWQgc2lnaC4gXCJTaGFyYywgeW91IGhhdmUgZGlzdHVyYmVkIG15IGpvdXJuZXkgdG8gbXkgaW5uZXJtb3N0IGJlaW5nLiBCZWZvcmUgSSBjYW4gaGVscCB5b3UsIHJlcGFyYXRpb25zIG11c3QgYmUgbWFkZS4gWW91IG11c3QgbWFrZSBtZSBhIGhlYWx0aHkgc2VydmluZyBvZiBwYW5jYWtlczogd2hvbGUgd2hlYXQsIHdpdGggYWxsIG5hdHVyYWwgbWFwbGUgc3lydXAuIE5vdyBsZWF2ZSBtZSBhcyBJIHBlZWwgYmFjayB0aGUgbGF5ZXJzIG9mIHRoZSBzZWxmIGFuZCBwb25kZXIgdGhlIGxlc3NvbiBvZiB0aGUgY2hlcnJ5IGJsb3Nzb20uJylcbiAgICAgICAgICAgICAgICAgICAgQHNldEZsYWcoJ3RhbGtlZF90b193YWxlJywgdHJ1ZSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSSBjYW4gbm90IGxpZnQgYSBmaW4gZm9yIHlvdSB1bnRpbCB5b3UgaGF2ZSBicm91Z2h0IGEgaGVhbHRoeSBzZXJ2aW5nIG9mIHdob2xlIHdoZWF0IHBhbmNha2VzIHdpdGggYWxsIG5hdHVyYWwgbWFwbGUgc3lydXAgbGlrZSBJIHNhaWQgYmVmb3JlLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ09jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXZXR0ZXIgT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQ3V0dGxlZmlzaCcpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdCaWxseSBPY2VhbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXZXR0ZXIgT2NlYW4nLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoaXMgaXMganVzdCBzb21lIG9jZWFuIHlvdSBmb3VuZC4gSXQgZG9lcyBmZWVsIGEgbGl0dGxlIGJpdCB3ZXR0ZXIgdGhhbiB0aGUgcmVzdCBvZiB0aGUgb2NlYW4gdGhvdWdoLiBBbHNvLCBkaWQgaXQganVzdCBnZXQgd2FybWVyPyBPYnZpb3VzIGV4aXRzIGFyZSBhIGdhcmRlbiB0byB0aGUgd2VzdCwgV2FsZSBpbiB0aGUgc291dGgsIGFuZCBhIGdhbWVzaG93IGVhc3QuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0p1c3QgYW5vdGhlciBzb2xpZCAxMCBjdWJpYyBmZWV0IG9mIG9jZWFuLiBPYnZpb3VzIGV4aXRzIGFyZSBhIGdhcmRlbiB0byB0aGUgd2VzdCwgV2FsZSBpbiB0aGUgc291dGgsIGFuZCBhIGdhbWVzaG93IGVhc3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQWNodGlwdXNcXCdzIEdhcmRlbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnQ3V0dGxlZmlzaCcsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdjdXR0bGVmaXNoJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0xvb2ssIHRoZXJlIGJlIHNvbWUgY3V0dGxlZmlzaCwgdGhvdWdoIHRoZXkgZG8gbm90IGxvb2sgdG9vIGN1ZGRseS4gU3RlYWsgYW5kIFNoYWtlIGlzIHRvIHRoZSB3ZXN0LCBBY2h0aXB1c1xcJ3MgZ2FyZGVuIHRvIHRoZSBub3J0aCwgYW5kIFdhbGUgdG8gdGhlIGVhc3QuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIHVzZWQgdG8gYmUgY3V0dGxlZmlzaCBoZXJlIGJ1dCB5b3Ugc2NhcmVkIHRoZW0gYXdheSB3aXRoIHlvdXIgYWdncmVzc2l2ZSBhZmZlY3Rpb25zLiBLZWVwIHRoYXQgc3R1ZmYgaW5zaWRlIG1hbiEgU3RlYWsgYW5kIFNoYWtlIGlzIHRvIHRoZSB3ZXN0LCBBY2h0aXB1c1xcJ3MgZ2FyZGVuIHRvIHRoZSBub3J0aCwgYW5kIFdhbGUgdG8gdGhlIGVhc3QuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY3VkZGxlIGN1dHRsZWZpc2gnKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdjdXR0bGVmaXNoJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBhcmUgZmVlbGluZyBhZmZlY3Rpb25hdGUgdG9kYXkgYW5kIHlvdSBqdXN0IGdvdCBkdW1wZWQgc28gd2h5IG5vdD8gWW91IGp1bXAgc29tZSBvZiB0aGUgY3V0dGxlZmlzaCBhbmQgc3RhcnQgc251Z2dsaW5nIGFuZCBjdWRkbGluZy4gVGhlIGN1dHRsZWZpc2ggYXJlIG5vdCBhbXVzZWQgdGhvdWdoLCBhbmQgc2F5IHRoZXkgYXJlIHRpcmVkIG9mIGZpc2ggbWFraW5nIHRoYXQgbWlzdGFrZS4gVGhleSBhbGwgc3dpbSBhd2F5IGV4Y2VwdCBmb3Igb25lIHRoYXQgaGFzIGF0dGFjaGVkIGl0cyBzdWNrZXJzIHRvIHlvdXIgbWlkIHJlZ2lvbi4gWW91IGRvblxcJ3Qgc2VlbSB0byBtaW5kLicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhleSBhcmUgY3VkZGxlZCBvdXQuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGN1dHRsZWZpc2gnKVxuICAgICAgICAgICAgQHByaW50KCdPaCwgY3V0dGxlZmlzaCwgdGhvc2UgYXJlIGZyZWFreS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdCaWxseSBPY2VhbicsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBhbmQgbm90IEBmbGFnSXMoJ3dhdGNoZWRfYmlsbHlfdmlkZW8nLCB0cnVlKVxuICAgICAgICAgICAgd2luZG93Lm9wZW4oJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9ek5nY1lHZ3RmOE0nLCAnX2JsYW5rJylcblxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIGlmIG5vdCBAZmxhZ0lzKCdkcm92ZV9iaWxseV90b19ob3NwaXRhbCcsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdTdWRkZW5seSwgYXBwZWFyaW5nIGJlZm9yZSB5b3VyIGV5ZXMgaXMgc2luZ2VyLXNvbmd3cml0ZXIgYW5kIGZvcm1lciBDYXJpYmJlYW4ga2luZzogQmlsbHkgT2NlYW4uIEFsc28gQmlsbHkgT2NlYW5cXCdzIGNhci4gT2J2aW91cyBleGl0cyBhcmUgV2VzdCB0byBXYWxlIGFuZCBOb3J0aCB0byBzb21lIGtpbmQgb2YgZ2FtZSBzaG93LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdCaWxseSBPY2VhbiBpcyBvdXQgb2YgdGhlIGhvc3BpdGFsLiBIZSBhcHByZWNpYXRlcyB3aGF0IHlvdSBkaWQgZm9yIGhpbSBhbmQgc2F5cywgXCJXaGVuIHRoZSBnb2luZyBnZXRzIHRvdWdoLCB0aGUgdG91Z2ggZXNjYXBlIGZyb20gdGhlIGluc2FuaXR5IHdhcmQuXCIgT2J2aW91cyBleGl0cyBhcmUgV2VzdCB0byBXYWxlIGFuZCBOb3J0aCB0byBzb21lIGtpbmQgb2YgZ2FtZSBzaG93LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsaycpXG4gICAgICAgICAgICBpZiBub3QgQGZsYWdJcygnZHJvdmVfYmlsbHlfdG9faG9zcGl0YWwnLCB0cnVlKVxuICAgICAgICAgICAgICAgIEBwcmludCgnSGUgd2FudHMgeW91IHRvIGdldCBpbnRvIGhpcyBjYXIgYW5kIGRyaXZlIGhpbSB0byB0aGUgaG9zcGl0YWwuIEhlIGp1c3QgZHJvdmUgdGhyb3VnaCB0aGUgY2FyIHdhc2ggd2l0aCB0aGUgdG9wIGRvd24gYWZ0ZXIgZHJvcHBpbmcgc29tZSBhY2lkLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIldoZW4gdGhlIGdvaW5nIGdldHMgdG91Z2gsIHRoZSB0b3VnaCBlc2NhcGUgZnJvbSB0aGUgaW5zYW5pdHkgd2FyZC5cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBjYXInKVxuICAgICAgICAgICAgQHByaW50KCdUaGF0IGlzIGRlZmluaXRlbHkgYSBjYXIuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGhvc3BpdGFsJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlIGhvc3BpdGFsIGxvb21zIGluIHRoZSBkaXN0YW5jZS4gSXQgZG9lc25cXCd0IHNlZW0gYWxsIHRoYXQgZmFyIGF3YXkgaWYgeW91IGhhdmUgYSBjYXIuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdob3NwaXRhbCcpIG9yIEBtYXRjaGVzKCdjYXInKVxuICAgICAgICAgICAgQHByaW50KCdTdXJlLCB3aHkgbm90PyBZb3UgZ2V0IGluIHRoZSBkcml2ZXJcXCdzIHNlYXQgYW5kIGZpbmQgeW91ciB3YXkgdG8gdGhlIG5lYXJlc3QgbWVkaWNhbCB0cmVhdG1lbnQgY2VudGVyLiBBcyB0aGFua3MsIE1yLiBPY2VhbiBwdWxscyBhbiBlZ2cgb3V0IGZyb20gaGlzIGdsb3ZlIGJveC4gWW91IGFjY2VwdCBhbmQgc3dpbSBhd2F5IGFzIGZhc3QgYXMgcG9zc2libGUuIEdvb2QsIEkgcmFuIG91dCBvZiBqb2tlcyBmb3IgdGhhdCBmYXN0LicpXG4gICAgICAgICAgICBAc2V0RmxhZygnZHJvdmVfYmlsbHlfdG9faG9zcGl0YWwnLCB0cnVlKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2VnZycpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2NhbGwgY29wcycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZSBwb2xpY2UgY29tZSBhbmQgYXJyZXN0IEJpbGx5IE9jZWFuIG9uIGNoYXJnZSBvZiBiZWluZyBjb21wbGV0ZWx5IGlycmVsZXZhbnQgdG8gdGhpcyBnYW1lLiBZb3UgV2luISBIaWdoIFNjb3JlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdBY2h0aXB1c1xcJ3MgR2FyZGVuJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBAY29taW5nRnJvbShbJ0FjaHRpcHVzXFwncyBHYXJkZW4gKEluc2lkZSknXSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBsZWF2ZSB0aGUgZ2FyZGVuLiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBpbnNpZGUgb2YgdGhlIGdhcmRlbiwgbm9ydGggdG8gV2F0ZXIgV29ybGQsIGVhc3QgdG8gc29tZSBPY2VhbiBhbmQgc291dGggdG8gYSBzY2hvb2wgb2YgQ3V0dGxlZmlzaC4nKVxuICAgICAgICAgICAgZWxzZSBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdBY2h0aXB1cyBpcyB3b3JraW5nIGFtb25nIGhpcyBmbG93ZXJzIGFuZCBzaHJ1YnMuIEhlIHNlZXMgeW91IGFuZCBvcGVucyB0aGUgZ2F0ZSBmb3IgeW91LiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBpbnNpZGUgb2YgdGhlIGdhcmRlbiwgbm9ydGggdG8gV2F0ZXIgV29ybGQsIGVhc3QgdG8gc29tZSBPY2VhbiBhbmQgc291dGggdG8gYSBzY2hvb2wgb2YgQ3V0dGxlZmlzaC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnQWNodGlwdXMgaXMgc3RpbGwgd29ya2luZyBoYXJkIGluIHRoYXQgZ2FyZGVuLiBZb3UgbmVlZCB0byBnZXQgaGltIGEgZ2lybGZyaWVuZCwgYW5kIHRoZW4gaGUgbmVlZHMgdG8gZ2V0IFlPVSBhIGdpcmxmcmllbmQuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIGluc2lkZSBvZiB0aGUgZ2FyZGVuLCBub3J0aCB0byBXYXRlciBXb3JsZCwgZWFzdCB0byBzb21lIE9jZWFuIGFuZCBzb3V0aCB0byBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgYWNodGlwdXMnKVxuICAgICAgICAgICAgQHByaW50KCdJdFxcJ3MgQWNodGlwdXMuIEhlIGlzIHB1bGxpbmcgb3V0IHRoZSBzZWF3ZWVkcyBmcm9tIGhpcyBzZWEgY3VjdW1iZXIgYmVkLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCcpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKSBvciBAbWF0Y2hlcygnZW50ZXInKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuIChJbnNpZGUpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQ3V0dGxlZmlzaCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdBY2h0aXB1c1xcJ3MgR2FyZGVuIChJbnNpZGUpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBlbnRlciB0aGUgZ2FyZGVuIGFuZCBzZWUgYSBib3VudGlmdWwgZGlzcGxheSB1bmZvbGQgYmVmb3JlIHlvdS4gVGhlIGdhcmRlbiBleGl0IGlzIEVhc3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJylcbiAgICAgICAgICAgIGlmIG5vdCBAZmxhZ0lzKCd0YWxrZWRfdG9fYWNodGlwdXMnLCB0cnVlKVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJUaGlzIGlzIHF1aXRlIHRoZSB1bS4uLm9jZWFuIGhpZGVhd2F5IHlvdSBoYXZlIGhlcmUsXCIgeW91IHNheS4gXCJZZXMsXCIgaGUgc2F5cywgXCJJIGNhbiBzZWUgeW91IGhhdmUgY29tZSBhIGxvbmcgd2F5IHRvIGdldCBoZXJlLCBidXQgSSBhbSBnbGFkIHlvdSBoYXZlIGZvdW5kIHJlZnVnZSBvbiBteSBncm91bmRzLiBJZiB5b3Ugc2VlIGFueXRoaW5nIHlvdSBsaWtlIGluIG15IHBsb3Qgd2UgY291bGQgbWFrZSBhIGRlYWwgcGVyaGFwcy5cIicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdPaCwgYmFjayBhZ2FpbiBTaGFyYz8gQ2FuIEkgaW50ZXJlc3QgeW91IGluIGFueSBvZiB0aGUgaXRlbXMgaW4gbXkgZmluZSBnYXJkZW4/JylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGFjaHRpcHVzJylcbiAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIEFjaHRpcHVzLiBIZSBpcyBwdWxsaW5nIG91dCB0aGUgc2Vhd2VlZHMgZnJvbSBoaXMgc2VhIGN1Y3VtYmVyIGJlZC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZ2FyZGVuJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHNlZSB3YXRlcm1lbG9ucywgd2F0ZXIgY2hlc3RudXRzLCBhc3NvcnRlZCBmbG93ZXJzLCBzZWEgY3VjdW1iZXJzIGFuZCBzdHJhd2JlcnJpZXMuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayB3YXRlcm1lbG9ucycpIG9yIEBtYXRjaGVzKCd0YWtlIHdhdGVybWVsb25zJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IG9ubHkgZWF0IHNlZWRsZXNzIGFuZCB0aGVzZSBhcmUgdGhlIGV4dHJhIHNlZWQgdmFyaWV0eS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGNoZXN0bnV0cycpIG9yIEBtYXRjaGVzKCd0YWtlIGNoZXN0bnV0cycpXG4gICAgICAgICAgICBAcHJpbnQoJ1dhdGVyIGNoZXN0bnV0cz8gSXMgdGhhdCBldmVuIGEgdGhpbmc/JylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBjdWN1bWJlcnMnKSBvciBAbWF0Y2hlcygndGFrZSBjdWN1bWJlcnMnKVxuICAgICAgICAgICAgQHByaW50KCdTb2FrIGl0IGluIGJyaW5lIGZvciBhIGNvdXBsZSB3ZWVrcywgdGhlbiBjb21lIGJhY2sgdG8gbWUuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzdHJhd2JlcnJpZXMnKSBvciBAbWF0Y2hlcygndGFrZSBzdHJhd2JlcnJpZXMnKSBvciBAbWF0Y2hlcygnbG9vayBzdHJhd2JlcnJ5Jykgb3IgQG1hdGNoZXMoJ3Rha2Ugc3RyYXdiZXJyeScpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzZW5zZSBhIHN1cnJlYWxpc3RpYyB2aWJlIGNvbWluZyBmcm9tIHRob3NlIHN0cmF3YmVycmllcy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZmxvd2VycycpIG9yIEBtYXRjaGVzKCd0YWtlIGZsb3dlcnMnKVxuICAgICAgICAgICAgQHByaW50KCdcIkkgY2FuIHNlZSB5b3UgbGlrZSB0aGUgZmxvd2Vycy4gSSB3aWxsIGxldCB5b3UgaGF2ZSB0aGVtIGlmIHlvdSBjYW4gZmluZCBzb21ldGhpbmcgdG8ga2VlcCBpdCBmcm9tIGdldHRpbmcgc28gaG90IGhlcmUuIEkgd291bGQgYmUgYWJsZSB0byBkbyB0d2ljZSBhcyBtdWNoIHdvcmsgaWYgaXQgd2VyZSBhIGJpdCBjb29sZXIuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2dpdmUgdW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdcIlRoaXMgd2lsbCBiZSBwZXJmZWN0IGZvciBibG9ja2luZyBvdXQgdGhhdCBzdW7igJlzIGhhcnNoIHJheXMuIFRoYW5rcyFcIicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgndW1icmVsbGEnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIlRha2UgdGhlc2UgZmxvd2Vycy4gVGhleSBhcmUgcmVhbGx5IHZlcnNhdGlsZSBhbmQgd2lsbCBiZSBnb29kIGp1c3QgYWJvdXQgYW55d2hlcmUuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKSBvciBAbWF0Y2hlcygnZXhpdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgcnVpbnMgb2YgeW91ciBvbGQgd29yayBwbGFjZS4gVGhpcyBwbGFjZSBoYXMgc2VlbiBiZXR0ZXIgZGF5cy4gWW91ciBtaW5kIGlzIGZsb29kZWQgd2l0aCBtZW1vcmllcyBvZiBmbG9hdGluZyBpbiBmcm9udCBvZiB0aGUgb2xkIGdyaWxsIGFuZCBjb21pbmcgdXAgd2l0aCBuZXcgcmVjaXBlcyB0byB0cnkgd2hlbiB5b3VyIG1hbmFnZXIgaGFkIGhpcyBiYWNrIHR1cm5lZC4gVGhlbiBzb21lb25lIHNhaWQgXCJFdmVyIHRyaWVkIGFuIE0tODAgYnVyZ2VyPyBJIGhhdmUgZW5vdWdoIGZvciBldmVyeW9uZS5cIiBUaGUgd29yZHMgZWNobyBpbiB5b3VyIG1pbmQgbGlrZSBhIHBoYW50b20gd2hpc3BlciBvZiBhZ2VzIHBhc3QuIEN1dHRsZWZpc2ggc3RvbXBpbmcgZ3JvdW5kcyBsaWUgZWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnV2hhdCBpcyBsZWZ0IG9mIHRoZSBTdGVhayBhbmQgU2hha2UgYnVpbGRpbmcgeW91IHVzZWQgdG8gd29yayBhdCBiZWZvcmUgeW91ciBmcmllbmQgZXhwbG9kZWQgaXQgdHJ5aW5nIHRvIG1ha2UgZmlyZXdvcmsgc2FuZHdpY2hlcy4gQ3V0dGxlZmlzaCBzdG9tcGluZyBncm91bmRzIGxpZSBlYXN0LicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludChcIkl0J3MgdGhlIHJ1aW5zIG9mIHRoZSBvbGQgU3RlYWsgYW5kIFNoYWtlIHlvdSB1c2VkIHRvIHdvcmsgYXQgdW50aWwgeW91ciBmcmllbmQgYmxldyBpdCB1cC4gVGhlIHRhdHRlcmVkIHJlbW5hbnRzIG9mIGEgcmVkIGFuZCB3aGl0ZSBhd25pbmcgZmx1dHRlcnMgaW4gdGhlIHdpbmQgYXMgaWYgdG8gc3VycmVuZGVyIHRvIGFuIGVuZW15LiBXaGF0IGlzIGxlZnQgb2YgYSBkb29yIGhhbmdzIG9uIGEgc2luZ2xlIGhpbmdlIHRvIHRoZSB3ZXN0LiBDdXR0bGVmaXNoIHN0b21waW5nIGdyb3VuZHMgbGllIGVhc3QuXCIpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzdGVhaycpIG9yIEBtYXRjaGVzKCdsb29rIHNoYWtlJykgb3IgQG1hdGNoZXMoJ2xvb2sgYnVpbGRpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdZb3VyIG1lbW9yaWVzIG9mIHRoaXMgcGxhY2UgZG9uXFwndCBxdWl0ZSBtYXRjaCB3aGF0IGl0IGlzIG5vdy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKSBvciBAbWF0Y2hlcygnb3BlbiBkb29yJykgb3IgQG1hdGNoZXMoJ2VudGVyJykgb3IgQG1hdGNoZXMoJ2luJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0N1dHRsZWZpc2gnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuICAgICAgICAgICAgXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnQXMgeW91IGFwcHJvYWNoLCB0aGUgZG9vciBmYWxscyBjbGVhbiBvZmYgYXMgaWYgdG8gd2FybiB5b3UgYWdhaW5zdCBlbnRyeS4gTmV2ZXIgYmVpbmcgb25lIGZvciBvbWVucywgeW91IGlnbm9yZSBpdC4gSW5zaWRlIHlvdSBkaXNjb3ZlciB0aGluZ3MgbXVjaCBhcyB5b3UgcmVtZW1iZXIgdGhlbS4gVGhhdCBpcywgaWYgdGhleSBoYWQgYmVlbiBtYXVsZWQgYnkgYSBiZWFyIHdpdGggYmxlbmRlcnMgZm9yIGhhbmRzIHdobyBwcm9jZWVkZWQgdG8gc2V0IG9mZiBhIHNlcmllcyBvZiBwbGFzdGljIGV4cGxvc2l2ZXMuIFRvIHRoZSBzb3V0aCB0aGVyZSBhcmUgc29tZSB0YWJsZXMgYW5kIGNoYWlycywgbm9ydGggbGllcyB0aGUga2l0Y2hlbiwgYW5kIHdlc3QgYSBzb2RhIGZvdW50YWluLiBUaGUgb3V0ZG9vcnMgaXMgRWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhlcmUgYXJlIHNvbWUgYmF0dGVyZWQgdGFibGVzIGFuZCBjaGFpcnMgc291dGgsIGEga2l0Y2hlbiBub3J0aCwgYW5kIGEgc29kYSBmb3VudGFpbiB3ZXN0LiBZb3UgY2FuIGV4aXQgRWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEaW5pbmcgQXJlYSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbiknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTb2RhIEZvdW50YWluKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoRGluaW5nIEFyZWEpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgZGlsYXBpZGF0ZWQgZGluaW5nIGFyZWEgbGllcyBiZWZvcmUgeW91LiBJdCBpcyBjb21wbGV0ZWx5IHVucmVtYXJrYWJsZS4gVGhlcmUgaXMgbm93aGVyZSB0byBnbyBiZXNpZGVzIG5vcnRoIHRvIHRoZSB3YXkgeW91IGNhbWUuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1dlbGNvbWUgdG8gdGhlIGtpdGNoZW4uIFNpbmNlIHRoZSB3YWxscyBoYXZlIGFsbCBiZWVuIGJsb3duIGF3YXkgb3IgZGlzc29sdmVkLCB0aGUgb25seSB0aGluZyB0aGF0IHNlcGFyYXRlcyBpdCBmcm9tIHRoZSByZXN0IG9mIHRoZSBwbGFjZSBpcyB0aGUgb3ZlbiBhbmQgc3RvdmUgdG9wLiBTb3V0aCBsZWFkcyBiYWNrIHRvIHRoZSBtYWluIGVudHJ5IGFyZWEuIFNvdXRoIGdvZXMgYmFjayB0byB0aGUgZG9vcndheS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG92ZW4nKSBvciBAbWF0Y2hlcygnb3BlbiBvdmVuJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnc29kYScpXG4gICAgICAgICAgICAgICAgQHByaW50KCdDaGVjayBpdCBvdXQsIGl0XFwncyB5b3VyIGZhdm9yaXRlIHBvcCwgYSBDaGVycnkgT3JhbmdlIFNub3p6YmVycnkgTGltZSBQYXNzaW9uZnJ1aXQgVmFuaWxsYSBDcm9hayBpbiB0aGUgb3Zlbi4gV2hvIGV2ZXIgdGhvdWdodCBvZiBiYWtpbmcgYSBjYW4gb2Ygc29kYT8gU291dGggbGVhZHMgYmFjayB0byB0aGUgbWFpbiBlbnRyeSBhcmVhLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGUgb3ZlbiBpcyBlbXB0eS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Nsb3NlIG92ZW4nKVxuICAgICAgICAgICAgQHByaW50KCdIb3cgcmVzcG9uc2libGUgb2YgeW91LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGdvdCBzb2RhLicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnc29kYScpXG5cbiAgICAgICAgZWxzZSBpZiBAZmxhZ0lzKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpIGFuZCBAbWF0Y2hlcygnbWFrZSBwYW5jYWtlcycpXG4gICAgICAgICAgICBAc2V0RmxhZygnaGF2ZV9hbGxfaXRlbXMnLCAnZmFsc2UnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdcIldoZXJlIGRvIEkgc3RhcnQ/XCIgeW91IHdvbmRlciBvdXQgbG91ZC4gSWYgb25seSB0aGVyZSB3ZXJlIHdyaXR0ZW4gc2VyaWVzIG9mIGluc3RydWN0aW9ucyBndWlkaW5nIHlvdSB0aHJvdWdoLiBXaGVyZSB3b3VsZCB5b3UgZmluZCBzb21ldGhpbmcgbGlrZSB0aGF0PycpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91XFwncmUgcG9uZGVyaW5nIHRoaXMgd2hlbiBhIGRyYWZ0IGNvbWVzIG92ZXIgeW91LiBUaGUgbGlnaHRzIGZsaWNrZXIgb24gYW5kIG9mZi4gWW91IHNlbnNlIGEgbXlzdGVyaW91cyBwcmVzZW5jZS4gVGhlIGdob3N0IG9mIHlvdXIgb2xkIGZyaWVuZCBDcmVnZ2xlcyBhcHBlYXJzIGJlZm9yZSB5b3UuIEFwcGFyZW50bHkgaGUgaXMgaGF1bnRpbmcgdGhlIFN0ZWFrIGFuZCBTaGFrZSBub3cgYW5kIHlvdVxcJ3JlIGFsbCBsaWtlIFwiQ3JlZ2dsZXMsIGRpZG5cXCd0IHdlIGp1c3QgaGFuZyBvdXQgdGhlIG90aGVyIGRheT8gSG93IGFyZSB5b3UgYSBnaG9zdCBhbHJlYWR5P1wiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJzxzcGFuIGNsYXNzPVwiY3JlZXB5XCI+XCJOZXZlciB5b3UgbWluZCB0aGF0IG5vd1wiPC9zcGFuPiBoZSBzYXlzIGluIGhpcyBjcmVlcHkgbmVyZCB2b2ljZS4gPHNwYW4gY2xhc3M9XCJjcmVlcHlcIj5cIlNoYXJjLCBpZiB5b3UgaG9wZSB0byBzYXZlIHRoZSB3b3JsZCBmcm9tIGNlcnRhaW4gZG9vbSwgeW91IG11c3Qgc3VjY2VlZCBpbiBtYWtpbmcgdGhlc2UgcGFuY2FrZXMuIFVzZSB0aGlzIGFuY2llbnQgcmVjaXBlIGhhbmRlZCBkb3duIGZyb20gdGhlIGFuY2llbnRzIHRvIGFpZCB5b3UuXCI8L3NwYW4+IEFuIG9sZCwgYmF0dGVyZWQgcGllY2Ugb2YgcGFwZXIgZmxvYXRzIGRvd24gbGFuZGluZyBiZWZvcmUgeW91IFwiU3dlZXQgTWVlbWF3cyBTd2VldHkgU3dlZXQgRmxhcGphY2tzXCIgaXQgcmVhZHMuIDxzcGFuIGNsYXNzPVwiY3JlZXB5XCI+XCJOb3cgbXkgd29yayBpcyBkb25lIGFuZCBJIGNhbiBhc2NlbmQgdG8gbXkgc3RlcG1vbVxcJ3MgaG91c2UgZm9yIGdyaWxsZWQgY2hlZXNlIHNhbmR3aWNoZXMgYW5kIGNob2NvbGF0ZSBtaWxrLlwiPC9zcGFuPicpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSByZWFkIHRoZSByZWNpcGUuIEl0IGlzIGFsbCBpbiByaWRkbGVzLiBZb3UgaG9wZSB5b3UgYXJlIHVwIHRvIHRoZSB0YXNrLicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGFuIGVtcHR5IGJvd2wgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBhbiBlbXB0eSBib3dsIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0luIGFuIHVybiB0YWtlIGJ1dCBub3QgY2h1cm4gaXRlbXMgdHdvIG5vdCBsaWtlIGdvby4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvZGEnKSBhbmQgQGhhc0l0ZW0oJ3NvZGEnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgcHV0IHRoZSBzb2RhIGludG8gdGhlIGJvd2wuJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5IGl0IGxvb2tzIGxpa2UgdGhhdCB3b3JrZWQhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdJdCBsb29rcyBsaWtlIHNvbWV0aGluZyBpcyBzdGlsbCBtaXNzaW5nLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZmxvd2VycycpIGFuZCBAaGFzSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBwdXQgdGhlIGZsb3VyIGludG8gdGhlIGJvd2wuJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5IGl0IGxvb2tzIGxpa2UgdGhhdCB3b3JrZWQhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdzb2RhJylcbiAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdJdCBsb29rcyBsaWtlIHNvbWV0aGluZyBpcyBzdGlsbCBtaXNzaW5nLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc29kYSBmbG93ZXJzJykgYW5kIEBoYXNJdGVtKCdzb2RhJykgYW5kIEBoYXNJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5IGl0IGxvb2tzIGxpa2UgdGhhdCB3b3JrZWQhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHBvd2RlciBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3VyIHBvdGlvbiBpcyBkcnkuIFRoaXMgd2lsbHN0IG5vdCBmbHkuIFdoYXRcXCdzIG5leHQgbXVzdCBiZSBkdW1wZWQsIHBvdXJlZCBhbmQgY3JhY2tlZCBmb3IgYSBwcm9wZXIgZmxhcGphY2suJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbWlsayBlZ2cnKSBvciBAbWF0Y2hlcygnbWlsayBtYXJnYXJpbmUnKSBvciBAbWF0Y2hlcygnZWdnIG1hcmdhcmluZScpXG4gICAgICAgICAgICBAcHJpbnQoJ1Nsb3cgZG93biB0aGVyZSBwYXJ0bmVyLCBJIGNhbiBvbmx5IGhhbmRsZSBzbyBtYW55IHRoaW5ncyBhdCBvbmNlLiBUZWxsIHRoZW0gdG8gbWUgb25lIGF0IGEgdGltZSBwbGVhc2UuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbWlsaycpIGFuZCBAaGFzSXRlbSgnbWlsaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBwdXQgdGhlIG1pbGsgaW50byB0aGUgYm93bC4nKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ21pbGsnKVxuICAgICAgICAgICAgQHByaW50KCdIZXkgaXQgbG9va3MgbGlrZSB0aGF0IHdvcmtlZCEnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBpZiAobm90IEBoYXNJdGVtKCdlZ2cnKSkgYW5kIChub3QgQGhhc0l0ZW0oJ21hcmdhcmluZScpKVxuICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdJdCBsb29rcyBsaWtlIHNvbWV0aGluZyBpcyBzdGlsbCBtaXNzaW5nLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21hcmdhcmluZScpIGFuZCBAaGFzSXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdtYXJnYXJpbmUnKVxuICAgICAgICAgICAgQHByaW50KCdIZXkgaXQgbG9va3MgbGlrZSB0aGF0IHdvcmtlZCEnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBpZiAobm90IEBoYXNJdGVtKCdtaWxrJykpIGFuZCAobm90IEBoYXNJdGVtKCdlZ2cnKSlcbiAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBzbGlnaHRseSBtb3JlIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnSXQgbG9va3MgbGlrZSBzb21ldGhpbmcgaXMgc3RpbGwgbWlzc2luZy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlZ2cnKSBhbmQgQGhhc0l0ZW0oJ2VnZycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnZWdnJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5IGl0IGxvb2tzIGxpa2UgdGhhdCB3b3JrZWQhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgaWYgKG5vdCBAaGFzSXRlbSgnbWlsaycpKSBhbmQgKG5vdCBAaGFzSXRlbSgnbWFyZ2FyaW5lJykpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ0l0IGxvb2tzIGxpa2Ugc29tZXRoaW5nIGlzIHN0aWxsIG1pc3NpbmcuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBzbGlnaHRseSBtb3JlIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0N1dHRpbmcgYW5kIHNjb29waW5nIHNoYWxsIGhhdmUgdGhlaXIgZGF5LCBidXQgYSBmb3IgYSBmaW5lIGZsdWZmeSBiYXR0ZXIgdGhlcmUgYmUgYnV0IG9uZSB3YXkuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3RpcicpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIG1peGVkIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc2hha2UnKVxuICAgICAgICAgICAgQHByaW50KCdEdWRlLCB3aG8gZG8geW91IHRoaW5rIHlvdSBhcmUsIEphbWVzIEJvbmQ/ICBUaGlzIGJhdHRlciBuZWVkcyB0byBiZSBzdGlycmVkLCBub3Qgc2hha2VuLicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgbWl4ZWQgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnU2V0IHRoZSBncmlkZGxlIG9yIHN0b3ZlIHRvIG1lZGl1bSBoZWF0LiBBZnRlciBpdCBpcyB3YXJtZWQsIGRyb3AgYmF0dGVyIGEgcXVhcnRlciBjdXAgYXQgYSB0aW1lIGFuZCB0dXJuaW5nIG9uY2UgdW50aWwgYnViYmxlcyBhcHBlYXIuIFwiV2VsbCB0aGF0IHNlZW1zIHByZXR0eSBjbGVhci4gSSB0aGluayBJIGNhbiBkbyB0aGF0IG9uIG15IG93bi5cIicpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIHBsYXRlIG9mIGRyeSBwYW5jYWtlcyBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIHBsYXRlIG9mIGRyeSBwYW5jYWtlcyBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUZW4gbWludXRlcyBsYXRlciB0aGUgcGFuY2FrZXMgYXJlIGZpbmlzaGVkLCBidXQgc29tZXRoaW5nIGlzIG1pc3NpbmcuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3lydXAnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3N5cnVwJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGdvdCBwYW5jYWtlcyEgIEhvdCBkYW5nLicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbiknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTb2RhIEZvdW50YWluKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc2VlIHRoYXQgdGhlIHNvZGEgZm91bnRhaW4gaGFzIHNvbWVob3cgcmVtYWluZWQgbGFyZ2VseSB1bmRhbWFnZWQuIFlvdSB0aGluayBiYWNrIHRvIHRoZSBkYXlzIHdoZW4geW91IHdvdWxkIHNuZWFrIG91dCBiYWdzIG9mIHBsYWluIHN5cnVwIHRvIGRyaW5rIGFuZCB0aGUgZnJlYWtpc2ggd2FraW5nIGRyZWFtcyBpdCB3b3VsZCBpbmR1Y2UgaW4geW91LiBZb3Ugd29uZGVyIGlmIHRoZXJlIGlzIGFueSBzdGlsbCBpbiB0aGVyZS4gVGhlIEVhc3QgZG9vciBnb2VzIGJhY2sgdG8gdGhlIG1haW4gYXJlYS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGZvdW50YWluJykgb3IgQG1hdGNoZXMoJ29wZW4gZm91bnRhaW4nKSBvciBAbWF0Y2hlcygnbG9vayBzb2RhJykgb3IgQG1hdGNoZXMoJ29wZW4gc29kYScpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ3N5cnVwJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0F2YXN0LCBhIGhpZGRlbiB0cmVhc3VyZSB0cm92ZSBvZiBzdWdhcnkgd29uZGVyIHRoYXQgaGFzIGxhaW4gZG9ybWFudCBhbGwgdGhlc2UgeWVhcnMhIFlvdSB0cmVtYmxlIGF0IHRoZSBiZWF1dHkgb2YgdGhlIHNpZ2h0IGJlZm9yZSB5b3UuIFNvIG1hbnkgYmFncyBhbmQgeWV0IHlvdXIgbWFnaWMgaGFtbWVyc3BhY2Ugc2F0Y2hlbCB3aWxsIG9ubHkgYWxsb3cgZm9yIG9uZS4gVGhlcmVcXCdzIFNwcml0eiwgUHJvZmVzc29yIEdpbmdlciwgQ2FjdHVzIExhZ2VyLCBhbmQgTXMuIFNoaW0gU2hhbVxcJ3MgTWFwbGUgU29kYS4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIHRoYXQgc29mdCBkcmluayBkaXNwZW5zZXIgeW91IGdvdCBhIGJhZyBvZiBzeXJ1cCBmcm9tLicpXG5cbiAgICAgICAgZWxzZSBpZiBub3QgQGhhc0l0ZW0oJ3N5cnVwJylcbiAgICAgICAgICAgIGlmIEBtYXRjaGVzKCd0YWtlIHNwcml0eicpIG9yIEBtYXRjaGVzKCdsb29rIHNwcml0eicpXG4gICAgICAgICAgICAgICAgQHByaW50KCdTcHJpdHosIEEgcmVmcmVzaGluZyBibGFzdCBvZiBwaWNrbGUgYW5kIGNlbGVyeT8gTm8gd2F5LicpXG4gICAgICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHByb2Zlc3NvcicpIG9yIEBtYXRjaGVzKCd0YWtlIGdpbmdlcicpIG9yIEBtYXRjaGVzKCdsb29rIHByb2Zlc3NvcicpIG9yIEBtYXRjaGVzKCdsb29rIGdpbmdlcicpXG4gICAgICAgICAgICAgICAgQHByaW50KCdQcm9mZXNzb3IgZ2luZ2VyLCA3MiBmbGF2b3JzIGFuZCBhbGwgb2YgdGhlbSBtYWtlIG1lIGxvbmcgZm9yIGEgcXVpY2sgZGVhdGguIE5vcGUgbm9wZSBub3BlLicpXG4gICAgICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIGNhY3R1cycpIG9yIEBtYXRjaGVzKCd0YWtlIGxhZ2VyJykgb3IgQG1hdGNoZXMoJ2xvb2sgY2FjdHVzJykgb3IgQG1hdGNoZXMoJ2xvb2sgbGFnZXInKVxuICAgICAgICAgICAgICAgIEBwcmludCgnQ2FjdHVzIGxhZ2VyLCBZb3UgdGhpbmsgeW91IHNlZSBzb21lIG5lZWRsZXMgZmxvYXRpbmcgaW4gdGhlcmUuIENvbWUgb24gbWFuLicpXG5cbiAgICAgICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgbWFwbGUnKSBvciBAbWF0Y2hlcygnbG9vayBzaGltJykgb3IgQG1hdGNoZXMoJ2xvb2sgc2hhbScpIG9yIEBtYXRjaGVzKCdsb29rIG1zJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1l1bSB5dW0gc29kYSB0aGlzIG9uZXMgbG9va3MgdGFzdHkuJylcblxuICAgICAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBtYXBsZScpIG9yIEBtYXRjaGVzKCd0YWtlIHNoaW0nKSBvciBAbWF0Y2hlcygndGFrZSBzaGFtJykgb3IgQG1hdGNoZXMoJ3Rha2UgbXMnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGZpbmQgaXQgc2hvY2tpbmcgdGhhdCB5b3UgYXJlIHRoZSBmaXJzdCByYWlkZXIgb2YgdGhpcyBzb2RhIHRvbWIuIEJ1dCB0aGVuIGFnYWluLCB5b3UgaGF2ZSBhbHdheXMgc2FpZCBwZW9wbGUgZG9uXFwndCBrbm93IHRoZSB2YWx1ZSBvZiBhIGJhZyBvZiBsaXF1aWQgc3VnYXIuJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnc3lydXAnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlJykgb3IgQG1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWXVwIHRoZXJlIGlzIGEgbG90IG9mIHNvZGEgaW4gdGhlcmUsIGJ1dCB5b3UgYWxyZWFkeSBwaWNrZWQgb25lLiBOb3cgZ28gbGl2ZSB3aXRoIHlvdXIgY2hvaWNlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoRG9vcndheSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3UganVzdCB3YWxrZWQgb250byB0aGUgc2V0IG9mIHRoZSB3aWxkbHkgcG9wdWxhciBnYW1lIHNob3csIFwiU2VhbCBvciBObyBTZWFsIVwiIFdoZXJlIGZsYW1ib3lhbnQgY29udGVzdGFudHMgZmxhaWwgYXJvdW5kIGFuZCBzaG91dCB3aGlsZSB0cnlpbmcgdG8gYXJyaXZlIGF0IHRoZSBhbnN3ZXIgdG8gdGhhdCBhZ2Ugb2xkIHF1ZXN0aW9uLi4uU0VBTCBPUiBOTyBTRUFMPyBUbyB0aGUgZWFzdCBpcyBiYWNrc3RhZ2UsIG5vcnRoIHdpbGwgdGFrZSB5b3UgdG8gdGhlIGRyZXNzaW5nIHJvb20sIHdlc3QgdG8gc29tZSBvY2VhbiwgYW5kIHNvdXRoIHRvIEJpbGx5IE9jZWFuLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3UgYXJlIG9uIHRoZSBzZXQgZm9yIFNlYWwgb3Igbm8gU2VhbCwgdGhlIGdhbWUgc2hvdy4gWW91IGp1c3QgcmVhbGl6ZWQgeW91IG11c3QgZmluZCBhIHdheSB0byBiZWNvbWUgYSBjb250ZXN0YW50IG9yIHlvdXIgbGlmZSB3aWxsIGhhdmUgYmVlbiB3YXN0ZWQuIFRvIHRoZSBlYXN0IGlzIGJhY2tzdGFnZSwgbm9ydGggd2lsbCB0YWtlIHlvdSB0byB0aGUgZHJlc3Npbmcgcm9vbSwgd2VzdCB0byBzb21lIG9jZWFuLCBhbmQgc291dGggdG8gQmlsbHkgT2NlYW4uJylcbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdPaCB3b3chIFNlYWwgb3Igbm8gU2VhbCEgWW91IGxvdmUgaXQgd2hlbiB0aGUgaG9zdCBsb29rcyByaWdodCBhdCB0aGUgY2FtZXJhIGFuZCBzYXlzIHRoYXQuIEl04oCZcyBzbyBpbnRlbnNlLiBUaGVyZSBoYXMgdG8gYmUgc29tZSB3YXkgdG8gZ2V0IG9uIHRoaXMgc2hvdy4gVG8gdGhlIGVhc3QgaXMgYmFja3N0YWdlLCBub3J0aCB3aWxsIHRha2UgeW91IHRvIHRoZSBkcmVzc2luZyByb29tLCB3ZXN0IHRvIHNvbWUgb2NlYW4sIGFuZCBzb3V0aCB0byBCaWxseSBPY2Vhbi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2V0dGVyIE9jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdCaWxseSBPY2VhbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20pJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgcGxhY2UgaXMgZ3JlYXQhIEl0IHdvdWxkIGJlIGVhc3kgdG8gY29iYmxlIHRvZ2V0aGVyIGEgY29zdHVtZSB0byBnZXQgb24gdGhhdCBzaG93LiBMZXRzIHNlZSB3aGF0IHdlIGNhbiBmaW5kLiBPYnZpb3VzIGV4aXRzIGFyZSBzb3V0aCB0byB0aGUgc2hvdyBlbnRyYW5jZS4nKVxuICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Nvc3R1bWUnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIEhlYWRnZWFyKScpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBIZWFkZ2VhciknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnTGV0XFwncyBzdGFydCB3aXRoIGhlYWRnZWFyLiBZb3Ugc2VlIGEgY293Ym95IGhhdCwgYSByYWluYm93IHdpZywgYSBtb3RvcmN5Y2xlIGhlbG1ldCwgYW5kIGEgc3RvdmVwaXBlIGhhdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Nvd2JveSBoYXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Nvd2JveSBoYXQnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIENsb3RoZXMpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdyYWluYm93IHdpZycpXG4gICAgICAgICAgICBAZ2V0SXRlbSgncmFpbmJvdyB3aWcnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIENsb3RoZXMpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdtb3RvcmN5Y2xlIGhlbG1ldCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIENsb3RoZXMpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzdG92ZXBpcGUgaGF0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdzdG92ZXBpcGUgaGF0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBDbG90aGVzKScpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBDbG90aGVzKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdOb3cgc2VsZWN0IGEgc2V0IG9mIGNsb3RoZXMuIFlvdSBzZWUgYSBjb3cgcHJpbnQgdmVzdCwgYSBjbG93biBzdWl0LCBhIGxlYXRoZXIgamFja2V0LCBhbmQgYW4gb2xkdGltZXkgc3VpdCB3aXRoIG9uZSBvZiB0aG9zZSBDb2xvbmVsIFNhbmRlcnMgdGllcycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbGVhdGhlciBqYWNrZXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBBY2Nlc3NvcnkpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjbG93biBzdWl0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjbG93biBzdWl0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBBY2Nlc3NvcnkpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdvbGR0aW1leScpIG9yIEBtYXRjaGVzKCd0aWVzJykgb3IgQG1hdGNoZXMoJ2NvbG9uZWwnKSBvciBAbWF0Y2hlcygnc2FuZGVycycpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnb2xkdGltZXkgc3VpdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY293IHZlc3QnKSBvciBAbWF0Y2hlcygncHJpbnQgdmVzdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY293IHByaW50IHZlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIEFjY2Vzc29yeSknKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScsIC0+XG4gICAgICAgIGRvbmUgPSAnWW91IGxvb2sgYWJzb2x1dGVseSBob3JyaWJsZSEgT3IgYW1hemluZywgZGVwZW5kaW5nIG9uIHlvdXIgcGVyc3BlY3RpdmUuIEJ1dCB0aGUgdHJ1ZSBqdWRnZSB3aWxsIGJlIHRoZSBnYW1lIHNob3cgbWFuYWdlci4nXG5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0FjY2Vzc29yaXplISBQaWNrIGZyb20gYSBndW4gYmVsdCwgYSBydWJiZXIgY2hpY2tlbiwgYSBtZXRhbCBjaGFpbiwgYW5kIGEgZmFrZSBiZWFyZC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Zha2UgYmVhcmQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2Zha2UgYmVhcmQnKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZ3VuIGJlbHQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2d1biBiZWx0JylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21ldGFsIGNoYWluJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdtZXRhbCBjaGFpbicpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdydWJiZXIgY2hpY2tlbicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgY29zdHVtZU1hdGNoZXMgPSAoZW5naW5lKSAtPlxuICAgICAgICBncm91cDEgPSAwXG4gICAgICAgIGdyb3VwMiA9IDBcbiAgICAgICAgZ3JvdXAzID0gMFxuICAgICAgICBncm91cDQgPSAwXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Nvd2JveSBoYXQnKSB0aGVuIGdyb3VwMSsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjb3cgcHJpbnQgdmVzdCcpIHRoZW4gZ3JvdXAxKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2d1biBiZWx0JykgdGhlbiBncm91cDErK1xuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdyYWluYm93IHdpZycpIHRoZW4gZ3JvdXAyKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Nsb3duIHN1aXQnKSB0aGVuIGdyb3VwMisrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdydWJiZXIgY2hpY2tlbicpIHRoZW4gZ3JvdXAyKytcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnbW90b3JjeWNsZSBoZWxtZXQnKSB0aGVuIGdyb3VwMysrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdsZWF0aGVyIGphY2tldCcpIHRoZW4gZ3JvdXAzKytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ21ldGFsIGNoYWluJykgdGhlbiBncm91cDMrK1xuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdzdG92ZXBpcGUgaGF0JykgdGhlbiBncm91cDQrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnb2xkdGltZXkgc3VpdCcpIHRoZW4gZ3JvdXA0KytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ2Zha2UgYmVhcmQnKSB0aGVuIGdyb3VwNCsrXG5cbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KGdyb3VwMSwgZ3JvdXAyLCBncm91cDMsIGdyb3VwNClcblxuICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyA9IChlbmdpbmUpIC0+XG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjb3dib3kgaGF0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3JhaW5ib3cgd2lnJylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ3N0b3ZlcGlwZSBoYXQnKVxuXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjb3cgcHJpbnQgdmVzdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdjbG93biBzdWl0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgZW5naW5lLnJlbW92ZUl0ZW0oJ29sZHRpbWV5IHN1aXQnKVxuXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdndW4gYmVsdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdydWJiZXIgY2hpY2tlbicpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdtZXRhbCBjaGFpbicpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdmYWtlIGJlYXJkJylcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIGlzIHRoZSBzdGFnZS4gSXQgaXMganVzdCBhcyBzdHVwaWQgbG9va2luZyBhcyB0aGUgcmVzdCBvZiB0aGUgc2hvdy4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgc2hvd1xcJ3MgZW50cmFuY2UuIFRoZSBzaG93IG1hbmFnZXIgc3RhcmVzIGF0IHlvdSBxdWVzdGlvbmluZ2x5LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayBtYW5hZ2VyJylcbiAgICAgICAgICAgIHN3aXRjaCBjb3N0dW1lTWF0Y2hlcyhAKVxuICAgICAgICAgICAgICAgIHdoZW4gMFxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgYXBvbG9naXplcywgXCJJIGFtIHNvcnJ5IHNpciwgeW91IGxvb2sgbGlrZSBhIGRlY2VudCBraW5kIG9mIHBlcnNvbiwgYW5kIElcXCdtIGFmcmFpZCB3ZSBoYXZlIG5vIHBsYWNlIGZvciB0aGF0IG9uIHRlbGV2aXNpb24uIE1heWJlIGlmIHlvdSBjYW1lIGJhY2sgZHJlc3NlZCBsaWtlIGEgbWFuaWFjIHdlIGNvdWxkIHdvcmsgc29tZXRoaW5nIG91dC4nKVxuICAgICAgICAgICAgICAgIHdoZW4gM1xuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgbG9va3MgeW91IG92ZXIsIG5vdGljaW5nIGdvb2QgdGFzdGUsIHlvdXIga25hY2sgZm9yIGZsYWlyIGFuZCBhdHRlbnRpb24gdG8gZGV0YWlsLiBIZSBkZWNsYXJlcyBcIldlbGwsIEkgYXBwcmVjaWF0ZSB5b3UgdGFraW5nIHRpbWUgdG8gYXNzZW1ibGUgdGhlIGNvc3R1bWUsIGJ1dCBpdCBpcyBqdXN0IGEgYml0IHRvbyBvcmRlcmx5LiBZb3UgcmVhbGx5IGFyZW5cXCd0IHdoYXQgd2UgYXJlIGxvb2tpbmcgZm9yLlwiJylcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgd2hlbiAyXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnVGhlIHNob3cgbWFuYWdlciBsb29rcyBwbGVhc2VkLCB5ZXQgYSB0b3VjaCB0cm91YmxlZC4gXCJZb3UgbG9vayB0byBiZSBhIG1hbiBnb2luZyBpbiB0aGUgcmlnaHQgZGlyZWN0aW9uLCBidXQgd2Ugb25seSBzZWxlY3QgdGhlIGJlc3Qgb2YgdGhlIGJlc3QgZm9yIFNlYWwgb3Igbm8gU2VhbC4gWW91ciBjb3N0dW1lIGlzIG5vdCBxdWl0ZSByZWFkeSBmb3IgdGhlIGJpZyBzaG93IHlldC4nKVxuICAgICAgICAgICAgICAgICAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMoQClcbiAgICAgICAgICAgICAgICB3aGVuIDFcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk9oLCB3b3chXCIgRXhjbGFpbXMgdGhlIHNob3cgbWFuYWdlci4gXCJZb3UgbG9vayBhYnNvbHV0ZWx5IGF3ZnVsLiBZb3UgZGVmaW5pdGVseSBoYXZlIHRoZSBsb29rIGZvciBvdXIgc2hvdy5cIiBZb3Ugc3RhcnQgdG8gZGFuY2UgYXJvdW5kLCB3aG9vcGluZyBhbmQgaG9sbGVyaW5nLCBkZWNsYXJpbmcgeW91cnNlbGYgdGhlIGZ1dHVyZSBraW5nIG9mIHRoZSB3b3JsZC4gXCJBbmQgSSBzZWUgeW91IGhhdmUgdGhlIGNoYXJpc21hIHRvIG1hdGNoLlwiIEhlIHR1cm5zIHRvIGhpcyBhc3Npc3RhbnQsIFwiR2V0IHRoaXMgZmVsbGEgb24gc3RhZ2UgYXQgb25jZS4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKE9uIFN0YWdlISknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChPbiBTdGFnZSEpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1wiV2VsY29tZSBiYWNrIHRvIHRoZSBTZWFsIG9yIE5vIFNlYWwsIHRoZSBtb3N0IHBvcHVsYXIgZ2FtZSBzaG93IHVuZGVyIHRoZSBzZWEhIElcXCdtIHlvdXIgd2VsbCB0YW5uZWQgaG9zdCBKZXJyeSBaaW50ZXJ2YW5kZXJiaW5kZXJiYXVlciBKci4gTGV0XFwncyBtZWV0IG91ciBuZXh0IGNvbnRlc3RhbnQ6IFNoYXJjISBBbiBpbmNyZWRpYmx5IG9ibm94aW91cyB5ZXQgcGVyc3Vhc2l2ZSB5b3VuZyBvY2VhbiBkd2VsbGVyLCBoZSBsb3ZlcyBhbm5veWluZyBoaXMgZnJpZW5kcyBhbmQgaXMgYWx3YXlzIHVwIGZvciBhIHJvdW5kIG9mIFNjcmFiYmxlLCBMQURJRVMuIFRpbWUgdG8gZ2V0IHN0YXJ0ZWQuIE5vdywgU2hhcmMgSSBhbSBnb2luZyB0byBwcmVzZW50IHlvdSB3aXRoIGEgYnJpZWZjYXNlLiBJbiB0aGlzIGJyaWVmY2FzZSwgdGhlcmUgbWlnaHQgYmUgYSBzZWFsIG9yIHRoZXJlIG1pZ2h0IG5vdCBiZSBhIHNlYWwuIEFuZCBJIG5lZWQgeW91IHRvIHRlbGwgbWUgd2hpY2ggaXQgaXM6IFNFQUwgb3IgTk8gU0VBTD9cIicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc2VhbCcpXG4gICAgICAgICAgICBAcHJpbnQoJ0plcnJ5IHNsb3dseSBvcGVucyB0aGUgYnJpZWZjYXNlLCBwZWVraW5nIGluc2lkZSBmaXJzdCB0byBkZXRlY3QgYW55IHNpZ25zIG9mIHNlYWwgZW50cmFpbHMgYW5kIHRoZW4uLi4nKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBpZiBAcGVyY2VudENoYW5jZSg1MClcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCcuLi53ZWFyaW5nIGEgZmFjZSBvZiBwcmFjdGljZWQgZGlzYXBwb2ludG1lbnQgYW5kIGVtcGF0aHksIHdoaW1wZXJzIFwiVG9vIGJhZCxcIiBsZXR0aW5nIHRoZSBjYXNlIG9wZW4gdGhlIHJlc3Qgb2YgdGhlIHdheS4gQXQgdGhpcywgeW91IGFyZSBwcm9tcHRseSB1c2hlcmVkIG9mZiB0aGUgc3RhZ2UgdG8gbWFrZSB3YXkgZm9yIHRoZSBuZXh0IHN1Y2tlci4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJy4uLmV4Y2l0ZWRseSBwdWxscyBpdCBhbGwgdGhlIHdheSBvcGVuLiBcIkhlXFwncyByaWdodCBwZW9wbGUhXCInKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk5vdywgbGV0XFwncyBzZWUgeW91ciBwcml6ZXMuXCIgXCJQcml6ZXMgaXMgcmlnaHQgSmVycnksXCIgc2F5cyBhIHZvaWNlIGNvbWluZyBmcm9tIG5vd2hlcmUgYW5kIGV2ZXJ5d2hlcmUgYWxsIGF0IG9uY2UuIFwiSGVyZSBhcmUgc29tZSB3b3JsZCBjbGFzcyBzZWxlY3Rpb25zIEkgcGlja2VkIHVwIGZyb20gdGhlIGdyb2Nlcnkgc3RvcmUgb24gdGhlIHdheSBoZXJlIHRoaXMgbW9ybmluZzpcIicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJTdWNjZXNzIGNvbWVzIGluIGNhbnMsIG5vdCBpbiBjYW4gbm90cy4gVGluIGNhbnMgdGhhdCBpcyEgVGhhdFxcJ3Mgd2h5IHdlIGFyZSBvZmZlcmluZyB5b3UgdGhlIGNob2ljZSBvZiBhIGZ1bGwgd2Vla1xcJ3Mgc3VwcGx5IG9mIFxcJ0NhcHRhaW4gTmVkXFwncyBQaWNrbGVkIEhlcnJpbmdcXCcsIG9yIFxcJ05vIElmcyBBbmRzIG9yIEJ1dHRlclxcJyBicmFuZCBtYXJnYXJpbmUgc3ByZWFkIHR5cGUgcHJvZHVjdCBmb3IgeW91ciBjb25zdW1wdGlvbiBwbGVhc3VyZS4gIE5hdHVyYWxseSB5b3UgY2hvb3NlIHRoZSBtYXJnYXJpbmUgYmVjYXVzZSB5b3UgYXJlIGhlYWx0aCBjb25zY2lvdXMgb3Igc29tZXRoaW5nLicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdtYXJnYXJpbmUnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCcsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKVxuICAgICAgICAgICAgaWYgQGNvbWluZ0Zyb20oWydXYXRlciBXb3JsZCAoTWFuYXRlZSBFeGhpYml0KScsICdXYXRlciBXb3JsZCAoR2lmdCBTaG9wKSddKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBiYWNrIGF0IHRoZSBXYXRlciBXb3JsZCBnYXRlLiBUaGUgZXhpdCBpcyByaWdodCBvdmVyIHRoZXJlISBKdXN0IGEgbGl0dGxlIGJpdCBmdXJ0aGVyIGFuZCB5b3UgY2FuIGxlYXZlLiBQbGVhc2UgY2FuIHdlIGxlYXZlIG5vdz8nKVxuICAgICAgICAgICAgZWxzZSBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdPaCBtYW4sIFdhdGVyIFdvcmxkISBZb3UgbG92ZSB0aGF0IG1vdmllLiBLZXZpbiBDb3N0bmVyIHNob3VsZCBoYXZlIHRvdGFsbHkgZ290dGVuIHRoZSBPc2Nhci4gV2FpdCB0aGlzIGlzblxcJ3QgbGlrZSB0aGF0LiBUaGlzIGlzIFdhdGVyIFdvcmxkLCB0aGUgaG9tZSBvZiB0aGF0IHN0dXBpZCBraWxsZXIgd2hhbGUsIFNoYW1wdS4gV2hhdCBhIGhhY2shIE9idmlvdXMgZXhpdHMgYXJlIG5vcnRoIHRvIHRoZSBNYW5hdGVlIHNob3csIGVhc3QgdG8gdGhlIGdpZnQgc2hvcCwgYW5kIHNvdXRoIHRvIHRoZSBBY2h0aXB1c1xcJ3MgZ2FyZGVuLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdPaCBncmVhdCwgV2F0ZXIgV29ybGQgYWdhaW4uIFlvdSB3ZXJlIGhvcGluZyBvbmNlIHdvdWxkIGJlIGVub3VnaCB0byBsYXN0IHlvdSBhIGxpZmV0aW1lLiBPYnZpb3VzIGV4aXRzIGFyZSBub3J0aCB0byB0aGUgTWFuYXRlZSBzaG93LCBlYXN0IHRvIHRoZSBnaWZ0IHNob3AsIGFuZCBzb3V0aCB0byB0aGUgQWNodGlwdXNcXCdzIGdhcmRlbi4nKVxuICAgICAgICBlbHNlIGlmIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1dlbGwsIHRoaXMgaXMgaXQgdGhlIFdhdGVyIFdvcmxkIGVudHJhbmNlIHdoZXJlIGFsbCB5b3VyIG1hcmluZSBkcmVhbXMgYW5kIG5pZ2h0bWFyZXMgY29tZSB0cnVlLiBPYnZpb3VzIGV4aXRzIGFyZSBub3J0aCB0byB0aGUgTWFuYXRlZSBzaG93LCBlYXN0IHRvIHRoZSBnaWZ0IHNob3AsIGFuZCBzb3V0aCB0byB0aGUgQWNodGlwdXNcXCdzIGdhcmRlbi4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKEdpZnQgU2hvcCknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIGlmIEBpc0ZpcnN0VGltZUVudGVyaW5nKClcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0FuZCB0aGVyZSBpdCBpczogVGhlIGlsbHVzdHJpb3VzIG1hbmF0ZWUuIFlvdSBjYW4gc2VlIHdoeSB0aGUgc3RhbmRzIGFyZSBlbXB0eS4gVGhlcmUgYXJlIGJpZyB1bWJyZWxsYXMgYXR0YWNoZWQgdG8gc29tZSBwaWNuaWMgdGFibGVzOyBub3QgbXVjaCB0byBzZWUuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIE1hbmF0ZWUgc2VydmljZSByb29tIGFuZCBzb3V0aCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnV2VsbCwgdGhlIG1hbmF0ZWUgZXhoaWJpdCBpcyBzdGlsbCBhIGR1bXAuIEEgYnVuY2ggb2YgdG91cmlzdCBmYW1pbGllcyBhcmUgZGV2b3VyaW5nIHRoZWlyIGZvb2QgYXQgc29tZSB0YWJsZXMgd2l0aCB1bWJyZWxsYXMuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIE1hbmF0ZWUgc2VydmljZSByb29tIGFuZCBzb3V0aCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlcmUgaXMgYmlnIHdvb2RlbiBhcmNoIGRpc3BsYXkgd2l0aCBsb3RzIG9mIHBlZWxpbmcgcGFpbnQgc3Vycm91bmRlZCBieSB5b3VyIHN0YW5kYXJkIHNlbWljaXJjbGUgc3RvbmUgc2VhdGluZyBhcnJhbmdlbWVudC4gU29tZSBwaWNuaWMgdGFibGVzIHdpdGggdW1icmVsbGFzIGFyZSBuZWFyYnkuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIE1hbmF0ZWUgc2VydmljZSByb29tIGFuZCBzb3V0aCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgdW1icmVsbGEnKVxuICAgICAgICAgICAgQHByaW50KCdXaGF0LCB5b3UgaGF2ZSBuZXZlciBzZWVuIGFuIHVtYnJlbGxhPyBUaGV5IGFyZSByZWQgYW5kIHdoaXRlIGFuZCBjb3ZlcmVkIGluIGFsZ2FlLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgdW1icmVsbGEnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3VtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHN0ZWFsdGhpbHkgYXBwcm9hY2ggYW4gZW1wdHkgdGFibGUgYW5kIHNob3ZlIGl0cyB1bWJyZWxsYSB1bmRlciB5b3VyIGZpbiBhbmQgc3R1bWJsZSBhd2F5LiBFdmVyeW9uZSBsb29rcyBhdCB5b3UgbGlrZSB0aGlzIGhhcHBlbnMgYSBsb3QuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQgKE1lY2hhbmljYWwgUm9vbSBUeXBlIFBsYWNlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKEdpZnQgU2hvcCknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGVudGVyIHRoZSBXYXRlciBXb3JsZCBnaWZ0IHNob3AuIFRoZXJlIGFyZSBhbGwgc29ydHMgb2YgZ3JlYXQgaXRlbXMgaGVyZTogYSBnaWFudCBzdHVmZmVkIG9jdG9wdXMsIGRlaHlkcmF0ZWQgYXN0cm9uYXV0IGZpc2ggZm9vZCwganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzLCBhbmQgc29tZSBvZiB0aGF0IGNsYXkgc2FuZCBjcmFwIHRoZXkgdXNlZCB0byBhZHZlcnRpc2Ugb24gVFYuIFNlZSBhbnl0aGluZyB5b3UgbGlrZT8gV2VzdCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuICAgICAgICBlbHNlIGlmIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIGFyZSBhbGwgc29ydHMgb2YgZ3JlYXQgaXRlbXMgaGVyZTogYSBnaWFudCBzdHVmZmVkIG9jdG9wdXMsIGRlaHlkcmF0ZWQgYXN0cm9uYXV0IGZpc2ggZm9vZCwganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzLCBhbmQgc29tZSBvZiB0aGF0IGNsYXkgc2FuZCBjcmFwIHRoZXkgdXNlZCB0byBhZHZlcnRpc2Ugb24gVFYuIFNlZSBhbnl0aGluZyB5b3UgbGlrZT8gV2VzdCB0byB0aGUgcGFyayBlbnRyYW5jZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgb2N0b3B1cycpXG4gICAgICAgICAgICBAcHJpbnQoJ1VzdWFsbHkgeW91IGhhdmUgdG8ga25vY2sgb3ZlciBhIHN0YWNrIG9mIG9sZCBtaWxrIGJvdHRsZXMgdG8gZ2V0IHN0dWZmZWQgYW5pbWFscyBvZiB0aGlzIHF1YWxpdHkuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzYW5kJylcbiAgICAgICAgICAgIEBwcmludCgnV293LCB5b3UgcmVtZW1iZXIgdGhpcyBzdHVmZi4gSXQgc2F5cyBvbiB0aGUgYm94IGl0cyB0aGUgb25seS1zdGF5LWRyeSBzYW5kIGNyYXAgdXNlZCBieSBTaGFtcHUgaGltc2VsZi4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGJhZGdlcycpXG4gICAgICAgICAgICBAcHJpbnQoJ0Nvb2whIEFuZCB5b3UgZG9u4oCZdCBldmVuIGhhdmUgdG8gY29tcGxldGUgYW55IGNsYXNzZXMgaW4ganVuaW9yIG1hcmluZSBzaGVyaWZmIHNjaG9vbC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGZpc2gnKSBvciBAbWF0Y2hlcygnbG9vayBmb29kJylcbiAgICAgICAgICAgIEBwcmludCgnVGhleSBoYXZlIGtlbHAsIGtyaWxsLCBhbGdhZSwgYW5kIGljZSBjcmVhbSBmbGF2b3JzLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBiYWRnZScpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnYmFkZ2UnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgdGFrZSB0aGUganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXJzIHRvIHRoZSBjb3VudGVyLiBUaGUgY2FzaGllciBzYXlzIHRoZXkgYXJlIG9uIHNhbGUsIG9ubHkgMTUgZmlzaCBkb2xsYXJzLCBwbHVzIHRheC4gWXVzc3NzLiBZb3UgcGF5IHRoZSBtYW4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHRha2UgdGhhdCBpdGVtIHRvIHRoZSBjb3VudGVyLiBUaGUgY2FzaGllciBzYXlzIGl0IGlzICcgKyAoMTggKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzMCkpLnRvU3RyaW5nKCkgKyBcIiBmaXNoIGRvbGxhcnMgYnV0IHlvdSBvbmx5IGhhdmUgI3tpZiBAaGFzSXRlbSgnYmFkZ2UnKSB0aGVuIDIgZWxzZSAxN30gZmlzaCBkb2xsYXJzLiBOdXRzLlwiKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYXRlciBXb3JsZCAoTWVjaGFuaWNhbCBSb29tIFR5cGUgUGxhY2UpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdXaGF0IGluIHRoZSBuYW1lIG9mIENhcHRhaW4gTmVtbyBpcyB0aGlzPyBUaGVyZSBhcmUgbWFuYXRlZXMgaW4gaG9pc3RzIGFsbCBvdmVyIHRoZSByb29tIGhvb2tlZCB1cCB0by4uLm1pbGtpbmcgZGV2aWNlcy4gVGhpcyBpcyBubyBtZWNoYW5pY2FsIHJvb20hIEl0XFwncyBhIGNvdmVyIGZvciBhIHNlY3JldCwgaWxsZWdhbCwgdW5kZXJncm91bmQsIGJsYWNrIG1hcmtldCwgYnV0IHByb2JhYmx5IG9yZ2FuaWMsIHNlYSBjb3cgbWlsa2luZyBvcGVyYXRpb24uIFRoZSBmaWVuZHMhIFlvdSBhcmUgZ29pbmcgdG8gYmxvdyB0aGUgbGlkIG9mZiB0aGlzIHRoaW5nIGZvciBzdXJlLiBUaGUgc3dlYXR5IG9sZCBmaXNoIHJ1bm5pbmcgdGhlIG1hY2hpbmVyeSBoYXMgbm90IG5vdGljZWQgeW91IHlldC4gT2J2aW91cyBleGl0cyBhcmUgZWFzdCB0byB0aGUgbWFuYXRlZSBleGhpYml0LicpXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBAaGFzSXRlbSgnYmFkZ2UnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhhdCBzd2VhdHkgb2xkIGZpc2ggaXMgc3RpbGwgZ29pbmcgYXQgaXQgd2l0aCBoaXMgbWFuYXRlZSBtaWxraW5nLiBZb3Ugd29uZGVyIGlmIHRoZXJlIGlzIGFueSBraW5kIG9mIGF1dGhvcml0eSBoZSB3b3VsZCBib3cgdG8uIE9idmlvdXMgZXhpdHMgYXJlIGVhc3QgdG8gdGhlIG1hbmF0ZWUgZXhoaWJpdC4nKVxuICAgICAgICAgICAgZWxzZSBpZiBub3QgQGhhc0l0ZW0oJ21pbGsnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhhdCBzd2VhdHkgb2xkIGZpc2ggaXMgc3RpbGwgZ29pbmcgYXQgaXQgd2l0aCBoaXMgbWFuYXRlZSBtaWxraW5nLiBZb3UgZmVlbCBqdXN0IGEgZnJhZ21lbnQgb2YgZ3VpbHQgZm9yIG5vdCB0dXJuaW5nIGhpbSBpbi4gT2J2aW91cyBleGl0cyBhcmUgZWFzdCB0byB0aGUgbWFuYXRlZSBleGhpYml0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGVyZSBkb2VzblxcJ3Qgc2VlbSB0byBiZSBhbnl0aGluZyB5b3UgY2FuIGRvIHRvIHB1dCBhIHN0b3AgdG8gdGhpcyBob3JyaWJsZSBzaWdodC4gQXQgbGVhc3QgeW91IGdvdCBzb21ldGhpbmcgb3V0IG9mIGl0IHRob3VnaC4gT2J2aW91cyBleGl0cyBhcmUgZWFzdCB0byB0aGUgbWFuYXRlZSBleGhpYml0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdNYW5hdGVlcyBmcm9tIHRoZSBleGhpYml0IGFyZSBhbGwgb3ZlciBpbiBob2lzdHMgcmlnZ2VkIHVwIHRvIG1pbGtpbmcgZXF1aXBtZW50LiBJdFxcJ3MgaWxsZWdhbCwgYnV0IHlvdSBoYXZlIGhlYXJkIHRoZXJlIGlzIGEgZm9ydHVuZSBpbiBnZW51aW5lIHNlYSBjb3cgbWlsay4gVGhhdCBuYXN0eSBvbGQgZmlzaCB0aGVyZSBpcyBydW5uaW5nIHRoZSB3aG9sZSB0aGluZy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKSBvciBAbWF0Y2hlcygnYmFkZ2UnKSBvciBAbWF0Y2hlcygnc3RpY2tlcicpXG4gICAgICAgICAgICBpZiBub3QgQGhhc0l0ZW0oJ2JhZGdlJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBzd2ltIHVwIHRvIHRoZSBmaXNoIGF0IHRoZSBjb250cm9scy4gXCJJIGFtIGdvaW5nIHRvIHNodXQgeW91IGRvd24hXCIgWW91IHNob3V0IGF0IGhpbS4gSGUgbGF1Z2hzIGhlYXJ0aWx5LiBcIllvdSBkb25cXCd0IHN0YW5kIGEgY2hhbmNlLiBZb3VcXCdyZSBqdXN0IGEgcmVndWxhciBndXkuIElcXCdtIHRoZSBtYXlvciBvZiBXYXRlciBXb3JsZC4gV2hvIGlzIGdvaW5nIHRvIGJlbGlldmUgeW91P1wiIEhlIGdvZXMgYmFjayB0byBoaXMgd29yayBwYXlpbmcgeW91IG5vIG1pbmQuIEhlIGhhcyBhIHBvaW50LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgZmlzaCBicmFuZGlzaGluZyB5b3VyIGJhZGdlIHN0aWNrZXIuIFwiWW91IGFyZSB1bmRlciBhcnJlc3QgZm9yIGlsbGVnYWwgbWlsayBoYXJ2ZXN0aW5nIGZyb20gZW5kYW5nZXJlZCBtYW5hdGVlcy4gSVxcJ20gdGFraW5nIHlvdSBpbi5cIiBcIldhaXQsXCIgaGUgc2F5cywgXCJZb3UgZG9uXFwndCBoYXZlIHRvIGRvIHRoaXMuIEl0XFwncyB0aGUgb25seSB3YXkgSSBjYW4ga2VlcCBXYXRlciBXb3JsZCBydW5uaW5nLiBEb25cXCd0IHlvdSBzZWU/IE5vdyB0aGF0IHdlIGFyZSBvbiBvdXIgc2l4dGggU2hhbXB1LCBwZW9wbGUganVzdCBkb25cXCd0IHNlZW0gdG8gY2FyZSBhYm91dCB0aGUgbWFnaWMgb2YgZXhwbG9pdGVkIG1hcmluZSBtYW1tYWxzLiBJIHdpbGwsIHVoLi4ubWFrZSBpdCB3b3J0aCB5b3VyIHdoaWxlIHRob3VnaC5cIiBIZSBzbGlkZXMgYSBmcmVzaCBib3R0bGUgb2YgbWlsayBpbiB5b3VyIGRpcmVjdGlvbi4gV2l0aG91dCBsb29raW5nIGF0IHlvdSBoZSBzYXlzLCBcIkl0IGlzIHdvcnRoIHRob3VzYW5kcyBpbiB0aGUgcmlnaHQgbWFya2V0LlwiJylcbiAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnbWlsaycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgaGF2ZSBlbnRlcmVkIFRoZSBFdGhlcmVhbCBSZWFsbS4gV2h5IGRpZCB5b3UgZG8gdGhhdD8gVGhhdCB3YXMgYSBiYWQgZGVjaXNpb24uIFdhbGUgaXMgYXQgeW91ciBzaWRlLiBUaGVyZSBhcmUgYSBidW5jaCBvZiB3ZWlyZCwgc3BhY2V5IHBsYXRmb3JtcyBhbmQganVuayBmbG9hdGluZyBhcm91bmQgaW4gYSBjb3NtaWMgdm9pZCAtLSB5b3VyIHR5cGljYWwgc3VycmVhbGlzdCBkcmVhbXNjYXBlIGVudmlyb25tZW50LiBBaGVhZCBpcyBhbiB1Z2x5IG1vbnN0ZXIuIEhlIGlzIGNsdXRjaGluZyBzb21ldGhpbmcgaW4gaGlzIGhhbmQuIE9idmlvdXMgZXhpdHMgYXJlIE5PTkUhIFRoaXMgaXMgdGhlIHdvcmxkIG9mIHdha2luZyBuaWdodG1hcmVzIHlvdSBkaW5ndXMuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayBtb25zdGVyJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBnZXR0aW5nIHdvcnNlIGF0IHRoaXMgZ2FtZS4gWW91IGFwcHJvYWNoIHNhaWQgbW9uc3RlciBpbiBhbiBlZmZvcnQgdG8gZ2V0IHNvbWUgbGVhZHMgb24geW91ciBwcmVjaW91cyBoYWlyIHByb2R1Y3QuIE1heWJlIGl0IHdvdWxkIGhhdmUgYmVlbiBhIGJldHRlciBpZGVhIHRvIHN0YXJ0IGJ5IGp1c3QgYXNraW5nIGhpbSBhYm91dCB0aGUgc3RhdHVzIG9mIHRoZSBsb2NhbCBiYXNrZXRiYWxsIHRlYW0gb3Igc29tZXRoaW5nPycpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBwcmludCgnT24gY2xvc2VyIGV4YW1pbmF0aW9uIHRob3VnaCwgeW91IHJlYWxpemUgdGhpcyBpcyBub3QganVzdCBhbnkgbW9uc3Rlci4gSXQgaXMgYSBUb3J1bWVraWFuIGh5cGVyIGdvYmxpbi4gQW5kIGluIGhpcyBncmlzbHkgcGF3IHJlc3RzIHRoZSBpdGVtIG9mIHlvdXIgcXVlc3Q6IHlvdXIgJDIzIHNoYW1wb28hJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiU2hhcmMsIHdlIGNhbiBub3QgYWxsb3cgaGltIHRvIHVzZSB0aGF0IHNoYW1wb28sXCIgd2hpc3BlcnMgeW91ciBjb21wYW5pb24uIFwiT24gdGhlIGhlYWQgb2YgYSBoeXBlciBnb2JsaW4sIGhhaXIgdGhhdCBzbW9vdGggY291bGQgbWVhbiB0aGUgZW5kIG9mIGZhc2hpb24gYXMgd2Uga25vdyBpdC4gV2UgbXVzdCByZXRyaWV2ZSBpdCBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5LlwiJylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnTm8gc29vbmVyIGhhdmUgdGhlIHdvcmRzIGxlZnQgV2FsZVxcJ3MgbGlwcyB0aGFuIHlvdSBhcmUgc3BvdHRlZC4gVGhhdCBpcyBhbGwgdGhlIG1vdGl2YXRpb24gdGhpcyBiZWFzdCBuZWVkcy4gSGUgZmxpcHMgdGhlIGNhcCBvbiB0aGUgYm90dGxlLCByYWlzaW5nIGl0IHRvIHRoZSBmaWx0aHksIHN0cmluZy1saWtlIG1vcCB5b3UgY2FuIG9ubHkgYXNzdW1lIG11c3QgYmUgaGlzIGhhaXIsIGFsbCB0aGUgd2hpbGUgZ2F6aW5nIGRvd24gYXQgeW91IGluIGRlZmlhbmNlIHdpdGggaGlzIHNpbmdsZSBibG9vZCBzaG90IGV5ZS4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1RoZSBFdGhlcmVhbCBSZWFsbSAoRG8gc29tZXRoaW5nISknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbSAoRG8gc29tZXRoaW5nISknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnRG8gc29tZXRoaW5nIScpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdzb21ldGhpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdPaCB2ZXJ5IGZ1bm55LiAgTm93IGlzIGRlZmluaXRlbHkgbm90IHRoZSB0aW1lIGZvciBzbmFyay4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2F0dGFjaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzdGFydCB0byBsdW5nZSB0b3dhcmRzIHRoZSBjcmVhdHVyZSwgYnV0IFdhbGUgcHVzaGVzIHlvdSBvdXQgb2YgdGhlIHdheSBpbiBhIGNoYXJnZSBoaW1zZWxmLiBZb3UgY3JpbmdlIGFzIHlvdSBoZWFyIHRoZSBzbGFzaGluZyBvZiBmbGVzaC4gUmVkIG1pc3QgZmxvYXRzIG91dCBvZiBXYWxlXFwncyBzaWRlLiBZb3VyIGhlYWQgaXMgc3Bpbm5pbmcuJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQHByaW50KCdcIk5vdyBTaGFyYyFcIiwgaGUgd2hlZXplcywgXCJVc2UgdGhlIHBvd2VyIG9mIHRoZSBRdWFkcmF0aWMgRXllLlwiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiQnV0IHlvdSBzYWlkIEkgd2FzblxcJ3QgcmVhZHkhXCIgeW91IGNyeSwgdHJ5aW5nIG5vdCB0byBsb29rIGF0IHRoZSBzb3JyeSBzdGF0ZSBvZiB5b3VyIGZyaWVuZC4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk5vLCBpdCB3YXMgSSB3aG8gd2FzIG5vdCByZWFkeS4gVGhlIHAtcG93ZXIgaGFzIGFsd2F5cyBiZWVuIHdpdGhpbiB5LXlvdS5cIicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdxdWFkcmF0aWMgZXllJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1RoZSBFdGhlcmVhbCBSZWFsbSAoVXNlIHRoZSBRdWFkcmF0aWMgRXllISknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbSAoVXNlIHRoZSBRdWFkcmF0aWMgRXllISknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygndXNlIHF1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3F1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdFbmQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnRW5kJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSByZW1vdmUgdGhlIFF1YWRyYXRpYyBFeWUgZnJvbSBpdHMgY29tcGFydG1lbnQsIGNsb3NlIHlvdXIgZXllcyBhbmQgYWxsb3cgdW5pb24gYmV0d2VlbiB5b3VyIHNwaXJpdCBhbmQgdGhlIHVuaXZlcnNhbCBjaGkgZmxvdy4gVGhlbiB0aGUgZ29ibGluIGdldHMgY3V0IGluIGhhbGYgYW5kIHlvdSBnZXQgeW91ciBzaGFtcG9vIGJhY2suJylcblxuXG4gICAgZW5naW5lLnNldFN0YXJ0Um9vbSgnV2FsZSB2cyBTaGFyYzogVGhlIENvbWljOiBUaGUgSW50ZXJhY3RpdmUgU29mdHdhcmUgVGl0bGUgRm9yIFlvdXIgQ29tcHV0ZXIgQm94JylcbiIsInZhciBtID0gKGZ1bmN0aW9uIGFwcCh3aW5kb3csIHVuZGVmaW5lZCkge1xyXG5cdHZhciBPQkpFQ1QgPSBcIltvYmplY3QgT2JqZWN0XVwiLCBBUlJBWSA9IFwiW29iamVjdCBBcnJheV1cIiwgU1RSSU5HID0gXCJbb2JqZWN0IFN0cmluZ11cIiwgRlVOQ1RJT04gPSBcImZ1bmN0aW9uXCI7XHJcblx0dmFyIHR5cGUgPSB7fS50b1N0cmluZztcclxuXHR2YXIgcGFyc2VyID0gLyg/OihefCN8XFwuKShbXiNcXC5cXFtcXF1dKykpfChcXFsuKz9cXF0pL2csIGF0dHJQYXJzZXIgPSAvXFxbKC4rPykoPzo9KFwifCd8KSguKj8pXFwyKT9cXF0vO1xyXG5cdHZhciB2b2lkRWxlbWVudHMgPSAvXihBUkVBfEJBU0V8QlJ8Q09MfENPTU1BTkR8RU1CRUR8SFJ8SU1HfElOUFVUfEtFWUdFTnxMSU5LfE1FVEF8UEFSQU18U09VUkNFfFRSQUNLfFdCUikkLztcclxuXHR2YXIgbm9vcCA9IGZ1bmN0aW9uKCkge31cclxuXHJcblx0Ly8gY2FjaGluZyBjb21tb25seSB1c2VkIHZhcmlhYmxlc1xyXG5cdHZhciAkZG9jdW1lbnQsICRsb2NhdGlvbiwgJHJlcXVlc3RBbmltYXRpb25GcmFtZSwgJGNhbmNlbEFuaW1hdGlvbkZyYW1lO1xyXG5cclxuXHQvLyBzZWxmIGludm9raW5nIGZ1bmN0aW9uIG5lZWRlZCBiZWNhdXNlIG9mIHRoZSB3YXkgbW9ja3Mgd29ya1xyXG5cdGZ1bmN0aW9uIGluaXRpYWxpemUod2luZG93KXtcclxuXHRcdCRkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcclxuXHRcdCRsb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcclxuXHRcdCRjYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuY2xlYXJUaW1lb3V0O1xyXG5cdFx0JHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LnNldFRpbWVvdXQ7XHJcblx0fVxyXG5cclxuXHRpbml0aWFsaXplKHdpbmRvdyk7XHJcblxyXG5cclxuXHQvKipcclxuXHQgKiBAdHlwZWRlZiB7U3RyaW5nfSBUYWdcclxuXHQgKiBBIHN0cmluZyB0aGF0IGxvb2tzIGxpa2UgLT4gZGl2LmNsYXNzbmFtZSNpZFtwYXJhbT1vbmVdW3BhcmFtMj10d29dXHJcblx0ICogV2hpY2ggZGVzY3JpYmVzIGEgRE9NIG5vZGVcclxuXHQgKi9cclxuXHJcblx0LyoqXHJcblx0ICpcclxuXHQgKiBAcGFyYW0ge1RhZ30gVGhlIERPTSBub2RlIHRhZ1xyXG5cdCAqIEBwYXJhbSB7T2JqZWN0PVtdfSBvcHRpb25hbCBrZXktdmFsdWUgcGFpcnMgdG8gYmUgbWFwcGVkIHRvIERPTSBhdHRyc1xyXG5cdCAqIEBwYXJhbSB7Li4ubU5vZGU9W119IFplcm8gb3IgbW9yZSBNaXRocmlsIGNoaWxkIG5vZGVzLiBDYW4gYmUgYW4gYXJyYXksIG9yIHNwbGF0IChvcHRpb25hbClcclxuXHQgKlxyXG5cdCAqL1xyXG5cdGZ1bmN0aW9uIG0oKSB7XHJcblx0XHR2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcclxuXHRcdHZhciBoYXNBdHRycyA9IGFyZ3NbMV0gIT0gbnVsbCAmJiB0eXBlLmNhbGwoYXJnc1sxXSkgPT09IE9CSkVDVCAmJiAhKFwidGFnXCIgaW4gYXJnc1sxXSB8fCBcInZpZXdcIiBpbiBhcmdzWzFdKSAmJiAhKFwic3VidHJlZVwiIGluIGFyZ3NbMV0pO1xyXG5cdFx0dmFyIGF0dHJzID0gaGFzQXR0cnMgPyBhcmdzWzFdIDoge307XHJcblx0XHR2YXIgY2xhc3NBdHRyTmFtZSA9IFwiY2xhc3NcIiBpbiBhdHRycyA/IFwiY2xhc3NcIiA6IFwiY2xhc3NOYW1lXCI7XHJcblx0XHR2YXIgY2VsbCA9IHt0YWc6IFwiZGl2XCIsIGF0dHJzOiB7fX07XHJcblx0XHR2YXIgbWF0Y2gsIGNsYXNzZXMgPSBbXTtcclxuXHRcdGlmICh0eXBlLmNhbGwoYXJnc1swXSkgIT0gU1RSSU5HKSB0aHJvdyBuZXcgRXJyb3IoXCJzZWxlY3RvciBpbiBtKHNlbGVjdG9yLCBhdHRycywgY2hpbGRyZW4pIHNob3VsZCBiZSBhIHN0cmluZ1wiKVxyXG5cdFx0d2hpbGUgKG1hdGNoID0gcGFyc2VyLmV4ZWMoYXJnc1swXSkpIHtcclxuXHRcdFx0aWYgKG1hdGNoWzFdID09PSBcIlwiICYmIG1hdGNoWzJdKSBjZWxsLnRhZyA9IG1hdGNoWzJdO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCIjXCIpIGNlbGwuYXR0cnMuaWQgPSBtYXRjaFsyXTtcclxuXHRcdFx0ZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiLlwiKSBjbGFzc2VzLnB1c2gobWF0Y2hbMl0pO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFszXVswXSA9PT0gXCJbXCIpIHtcclxuXHRcdFx0XHR2YXIgcGFpciA9IGF0dHJQYXJzZXIuZXhlYyhtYXRjaFszXSk7XHJcblx0XHRcdFx0Y2VsbC5hdHRyc1twYWlyWzFdXSA9IHBhaXJbM10gfHwgKHBhaXJbMl0gPyBcIlwiIDp0cnVlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNoaWxkcmVuID0gaGFzQXR0cnMgPyBhcmdzLnNsaWNlKDIpIDogYXJncy5zbGljZSgxKTtcclxuXHRcdGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgdHlwZS5jYWxsKGNoaWxkcmVuWzBdKSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0Y2VsbC5jaGlsZHJlbiA9IGNoaWxkcmVuWzBdXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0Y2VsbC5jaGlsZHJlbiA9IGNoaWxkcmVuXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGZvciAodmFyIGF0dHJOYW1lIGluIGF0dHJzKSB7XHJcblx0XHRcdGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShhdHRyTmFtZSkpIHtcclxuXHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IGNsYXNzQXR0ck5hbWUgJiYgYXR0cnNbYXR0ck5hbWVdICE9IG51bGwgJiYgYXR0cnNbYXR0ck5hbWVdICE9PSBcIlwiKSB7XHJcblx0XHRcdFx0XHRjbGFzc2VzLnB1c2goYXR0cnNbYXR0ck5hbWVdKVxyXG5cdFx0XHRcdFx0Y2VsbC5hdHRyc1thdHRyTmFtZV0gPSBcIlwiIC8vY3JlYXRlIGtleSBpbiBjb3JyZWN0IGl0ZXJhdGlvbiBvcmRlclxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGNlbGwuYXR0cnNbYXR0ck5hbWVdID0gYXR0cnNbYXR0ck5hbWVdXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChjbGFzc2VzLmxlbmd0aCA+IDApIGNlbGwuYXR0cnNbY2xhc3NBdHRyTmFtZV0gPSBjbGFzc2VzLmpvaW4oXCIgXCIpO1xyXG5cdFx0XHJcblx0XHRyZXR1cm4gY2VsbFxyXG5cdH1cclxuXHRmdW5jdGlvbiBidWlsZChwYXJlbnRFbGVtZW50LCBwYXJlbnRUYWcsIHBhcmVudENhY2hlLCBwYXJlbnRJbmRleCwgZGF0YSwgY2FjaGVkLCBzaG91bGRSZWF0dGFjaCwgaW5kZXgsIGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpIHtcclxuXHRcdC8vYGJ1aWxkYCBpcyBhIHJlY3Vyc2l2ZSBmdW5jdGlvbiB0aGF0IG1hbmFnZXMgY3JlYXRpb24vZGlmZmluZy9yZW1vdmFsIG9mIERPTSBlbGVtZW50cyBiYXNlZCBvbiBjb21wYXJpc29uIGJldHdlZW4gYGRhdGFgIGFuZCBgY2FjaGVkYFxyXG5cdFx0Ly90aGUgZGlmZiBhbGdvcml0aG0gY2FuIGJlIHN1bW1hcml6ZWQgYXMgdGhpczpcclxuXHRcdC8vMSAtIGNvbXBhcmUgYGRhdGFgIGFuZCBgY2FjaGVkYFxyXG5cdFx0Ly8yIC0gaWYgdGhleSBhcmUgZGlmZmVyZW50LCBjb3B5IGBkYXRhYCB0byBgY2FjaGVkYCBhbmQgdXBkYXRlIHRoZSBET00gYmFzZWQgb24gd2hhdCB0aGUgZGlmZmVyZW5jZSBpc1xyXG5cdFx0Ly8zIC0gcmVjdXJzaXZlbHkgYXBwbHkgdGhpcyBhbGdvcml0aG0gZm9yIGV2ZXJ5IGFycmF5IGFuZCBmb3IgdGhlIGNoaWxkcmVuIG9mIGV2ZXJ5IHZpcnR1YWwgZWxlbWVudFxyXG5cclxuXHRcdC8vdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlIGlzIGVzc2VudGlhbGx5IHRoZSBzYW1lIGFzIHRoZSBwcmV2aW91cyByZWRyYXcncyBgZGF0YWAgZGF0YSBzdHJ1Y3R1cmUsIHdpdGggYSBmZXcgYWRkaXRpb25zOlxyXG5cdFx0Ly8tIGBjYWNoZWRgIGFsd2F5cyBoYXMgYSBwcm9wZXJ0eSBjYWxsZWQgYG5vZGVzYCwgd2hpY2ggaXMgYSBsaXN0IG9mIERPTSBlbGVtZW50cyB0aGF0IGNvcnJlc3BvbmQgdG8gdGhlIGRhdGEgcmVwcmVzZW50ZWQgYnkgdGhlIHJlc3BlY3RpdmUgdmlydHVhbCBlbGVtZW50XHJcblx0XHQvLy0gaW4gb3JkZXIgdG8gc3VwcG9ydCBhdHRhY2hpbmcgYG5vZGVzYCBhcyBhIHByb3BlcnR5IG9mIGBjYWNoZWRgLCBgY2FjaGVkYCBpcyAqYWx3YXlzKiBhIG5vbi1wcmltaXRpdmUgb2JqZWN0LCBpLmUuIGlmIHRoZSBkYXRhIHdhcyBhIHN0cmluZywgdGhlbiBjYWNoZWQgaXMgYSBTdHJpbmcgaW5zdGFuY2UuIElmIGRhdGEgd2FzIGBudWxsYCBvciBgdW5kZWZpbmVkYCwgY2FjaGVkIGlzIGBuZXcgU3RyaW5nKFwiXCIpYFxyXG5cdFx0Ly8tIGBjYWNoZWQgYWxzbyBoYXMgYSBgY29uZmlnQ29udGV4dGAgcHJvcGVydHksIHdoaWNoIGlzIHRoZSBzdGF0ZSBzdG9yYWdlIG9iamVjdCBleHBvc2VkIGJ5IGNvbmZpZyhlbGVtZW50LCBpc0luaXRpYWxpemVkLCBjb250ZXh0KVxyXG5cdFx0Ly8tIHdoZW4gYGNhY2hlZGAgaXMgYW4gT2JqZWN0LCBpdCByZXByZXNlbnRzIGEgdmlydHVhbCBlbGVtZW50OyB3aGVuIGl0J3MgYW4gQXJyYXksIGl0IHJlcHJlc2VudHMgYSBsaXN0IG9mIGVsZW1lbnRzOyB3aGVuIGl0J3MgYSBTdHJpbmcsIE51bWJlciBvciBCb29sZWFuLCBpdCByZXByZXNlbnRzIGEgdGV4dCBub2RlXHJcblxyXG5cdFx0Ly9gcGFyZW50RWxlbWVudGAgaXMgYSBET00gZWxlbWVudCB1c2VkIGZvciBXM0MgRE9NIEFQSSBjYWxsc1xyXG5cdFx0Ly9gcGFyZW50VGFnYCBpcyBvbmx5IHVzZWQgZm9yIGhhbmRsaW5nIGEgY29ybmVyIGNhc2UgZm9yIHRleHRhcmVhIHZhbHVlc1xyXG5cdFx0Ly9gcGFyZW50Q2FjaGVgIGlzIHVzZWQgdG8gcmVtb3ZlIG5vZGVzIGluIHNvbWUgbXVsdGktbm9kZSBjYXNlc1xyXG5cdFx0Ly9gcGFyZW50SW5kZXhgIGFuZCBgaW5kZXhgIGFyZSB1c2VkIHRvIGZpZ3VyZSBvdXQgdGhlIG9mZnNldCBvZiBub2Rlcy4gVGhleSdyZSBhcnRpZmFjdHMgZnJvbSBiZWZvcmUgYXJyYXlzIHN0YXJ0ZWQgYmVpbmcgZmxhdHRlbmVkIGFuZCBhcmUgbGlrZWx5IHJlZmFjdG9yYWJsZVxyXG5cdFx0Ly9gZGF0YWAgYW5kIGBjYWNoZWRgIGFyZSwgcmVzcGVjdGl2ZWx5LCB0aGUgbmV3IGFuZCBvbGQgbm9kZXMgYmVpbmcgZGlmZmVkXHJcblx0XHQvL2BzaG91bGRSZWF0dGFjaGAgaXMgYSBmbGFnIGluZGljYXRpbmcgd2hldGhlciBhIHBhcmVudCBub2RlIHdhcyByZWNyZWF0ZWQgKGlmIHNvLCBhbmQgaWYgdGhpcyBub2RlIGlzIHJldXNlZCwgdGhlbiB0aGlzIG5vZGUgbXVzdCByZWF0dGFjaCBpdHNlbGYgdG8gdGhlIG5ldyBwYXJlbnQpXHJcblx0XHQvL2BlZGl0YWJsZWAgaXMgYSBmbGFnIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgYW4gYW5jZXN0b3IgaXMgY29udGVudGVkaXRhYmxlXHJcblx0XHQvL2BuYW1lc3BhY2VgIGluZGljYXRlcyB0aGUgY2xvc2VzdCBIVE1MIG5hbWVzcGFjZSBhcyBpdCBjYXNjYWRlcyBkb3duIGZyb20gYW4gYW5jZXN0b3JcclxuXHRcdC8vYGNvbmZpZ3NgIGlzIGEgbGlzdCBvZiBjb25maWcgZnVuY3Rpb25zIHRvIHJ1biBhZnRlciB0aGUgdG9wbW9zdCBgYnVpbGRgIGNhbGwgZmluaXNoZXMgcnVubmluZ1xyXG5cclxuXHRcdC8vdGhlcmUncyBsb2dpYyB0aGF0IHJlbGllcyBvbiB0aGUgYXNzdW1wdGlvbiB0aGF0IG51bGwgYW5kIHVuZGVmaW5lZCBkYXRhIGFyZSBlcXVpdmFsZW50IHRvIGVtcHR5IHN0cmluZ3NcclxuXHRcdC8vLSB0aGlzIHByZXZlbnRzIGxpZmVjeWNsZSBzdXJwcmlzZXMgZnJvbSBwcm9jZWR1cmFsIGhlbHBlcnMgdGhhdCBtaXggaW1wbGljaXQgYW5kIGV4cGxpY2l0IHJldHVybiBzdGF0ZW1lbnRzIChlLmcuIGZ1bmN0aW9uIGZvbygpIHtpZiAoY29uZCkgcmV0dXJuIG0oXCJkaXZcIil9XHJcblx0XHQvLy0gaXQgc2ltcGxpZmllcyBkaWZmaW5nIGNvZGVcclxuXHRcdC8vZGF0YS50b1N0cmluZygpIG1pZ2h0IHRocm93IG9yIHJldHVybiBudWxsIGlmIGRhdGEgaXMgdGhlIHJldHVybiB2YWx1ZSBvZiBDb25zb2xlLmxvZyBpbiBGaXJlZm94IChiZWhhdmlvciBkZXBlbmRzIG9uIHZlcnNpb24pXHJcblx0XHR0cnkge2lmIChkYXRhID09IG51bGwgfHwgZGF0YS50b1N0cmluZygpID09IG51bGwpIGRhdGEgPSBcIlwiO30gY2F0Y2ggKGUpIHtkYXRhID0gXCJcIn1cclxuXHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWQ7XHJcblx0XHR2YXIgY2FjaGVkVHlwZSA9IHR5cGUuY2FsbChjYWNoZWQpLCBkYXRhVHlwZSA9IHR5cGUuY2FsbChkYXRhKTtcclxuXHRcdGlmIChjYWNoZWQgPT0gbnVsbCB8fCBjYWNoZWRUeXBlICE9PSBkYXRhVHlwZSkge1xyXG5cdFx0XHRpZiAoY2FjaGVkICE9IG51bGwpIHtcclxuXHRcdFx0XHRpZiAocGFyZW50Q2FjaGUgJiYgcGFyZW50Q2FjaGUubm9kZXMpIHtcclxuXHRcdFx0XHRcdHZhciBvZmZzZXQgPSBpbmRleCAtIHBhcmVudEluZGV4O1xyXG5cdFx0XHRcdFx0dmFyIGVuZCA9IG9mZnNldCArIChkYXRhVHlwZSA9PT0gQVJSQVkgPyBkYXRhIDogY2FjaGVkLm5vZGVzKS5sZW5ndGg7XHJcblx0XHRcdFx0XHRjbGVhcihwYXJlbnRDYWNoZS5ub2Rlcy5zbGljZShvZmZzZXQsIGVuZCksIHBhcmVudENhY2hlLnNsaWNlKG9mZnNldCwgZW5kKSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBpZiAoY2FjaGVkLm5vZGVzKSBjbGVhcihjYWNoZWQubm9kZXMsIGNhY2hlZClcclxuXHRcdFx0fVxyXG5cdFx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcjtcclxuXHRcdFx0aWYgKGNhY2hlZC50YWcpIGNhY2hlZCA9IHt9OyAvL2lmIGNvbnN0cnVjdG9yIGNyZWF0ZXMgYSB2aXJ0dWFsIGRvbSBlbGVtZW50LCB1c2UgYSBibGFuayBvYmplY3QgYXMgdGhlIGJhc2UgY2FjaGVkIG5vZGUgaW5zdGVhZCBvZiBjb3B5aW5nIHRoZSB2aXJ0dWFsIGVsICgjMjc3KVxyXG5cdFx0XHRjYWNoZWQubm9kZXMgPSBbXVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChkYXRhVHlwZSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0Ly9yZWN1cnNpdmVseSBmbGF0dGVuIGFycmF5XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHR5cGUuY2FsbChkYXRhW2ldKSA9PT0gQVJSQVkpIHtcclxuXHRcdFx0XHRcdGRhdGEgPSBkYXRhLmNvbmNhdC5hcHBseShbXSwgZGF0YSk7XHJcblx0XHRcdFx0XHRpLS0gLy9jaGVjayBjdXJyZW50IGluZGV4IGFnYWluIGFuZCBmbGF0dGVuIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlIG5lc3RlZCBhcnJheXMgYXQgdGhhdCBpbmRleFxyXG5cdFx0XHRcdFx0bGVuID0gZGF0YS5sZW5ndGhcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHZhciBub2RlcyA9IFtdLCBpbnRhY3QgPSBjYWNoZWQubGVuZ3RoID09PSBkYXRhLmxlbmd0aCwgc3ViQXJyYXlDb3VudCA9IDA7XHJcblxyXG5cdFx0XHQvL2tleXMgYWxnb3JpdGhtOiBzb3J0IGVsZW1lbnRzIHdpdGhvdXQgcmVjcmVhdGluZyB0aGVtIGlmIGtleXMgYXJlIHByZXNlbnRcclxuXHRcdFx0Ly8xKSBjcmVhdGUgYSBtYXAgb2YgYWxsIGV4aXN0aW5nIGtleXMsIGFuZCBtYXJrIGFsbCBmb3IgZGVsZXRpb25cclxuXHRcdFx0Ly8yKSBhZGQgbmV3IGtleXMgdG8gbWFwIGFuZCBtYXJrIHRoZW0gZm9yIGFkZGl0aW9uXHJcblx0XHRcdC8vMykgaWYga2V5IGV4aXN0cyBpbiBuZXcgbGlzdCwgY2hhbmdlIGFjdGlvbiBmcm9tIGRlbGV0aW9uIHRvIGEgbW92ZVxyXG5cdFx0XHQvLzQpIGZvciBlYWNoIGtleSwgaGFuZGxlIGl0cyBjb3JyZXNwb25kaW5nIGFjdGlvbiBhcyBtYXJrZWQgaW4gcHJldmlvdXMgc3RlcHNcclxuXHRcdFx0dmFyIERFTEVUSU9OID0gMSwgSU5TRVJUSU9OID0gMiAsIE1PVkUgPSAzO1xyXG5cdFx0XHR2YXIgZXhpc3RpbmcgPSB7fSwgc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gZmFsc2U7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2FjaGVkLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKGNhY2hlZFtpXSAmJiBjYWNoZWRbaV0uYXR0cnMgJiYgY2FjaGVkW2ldLmF0dHJzLmtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSB0cnVlO1xyXG5cdFx0XHRcdFx0ZXhpc3RpbmdbY2FjaGVkW2ldLmF0dHJzLmtleV0gPSB7YWN0aW9uOiBERUxFVElPTiwgaW5kZXg6IGl9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHR2YXIgZ3VpZCA9IDBcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRpZiAoZGF0YVtpXSAmJiBkYXRhW2ldLmF0dHJzICYmIGRhdGFbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGogPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhW2pdICYmIGRhdGFbal0uYXR0cnMgJiYgZGF0YVtqXS5hdHRycy5rZXkgPT0gbnVsbCkgZGF0YVtqXS5hdHRycy5rZXkgPSBcIl9fbWl0aHJpbF9fXCIgKyBndWlkKytcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAoc2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzKSB7XHJcblx0XHRcdFx0dmFyIGtleXNEaWZmZXIgPSBmYWxzZVxyXG5cdFx0XHRcdGlmIChkYXRhLmxlbmd0aCAhPSBjYWNoZWQubGVuZ3RoKSBrZXlzRGlmZmVyID0gdHJ1ZVxyXG5cdFx0XHRcdGVsc2UgZm9yICh2YXIgaSA9IDAsIGNhY2hlZENlbGwsIGRhdGFDZWxsOyBjYWNoZWRDZWxsID0gY2FjaGVkW2ldLCBkYXRhQ2VsbCA9IGRhdGFbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKGNhY2hlZENlbGwuYXR0cnMgJiYgZGF0YUNlbGwuYXR0cnMgJiYgY2FjaGVkQ2VsbC5hdHRycy5rZXkgIT0gZGF0YUNlbGwuYXR0cnMua2V5KSB7XHJcblx0XHRcdFx0XHRcdGtleXNEaWZmZXIgPSB0cnVlXHJcblx0XHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdGlmIChrZXlzRGlmZmVyKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoZGF0YVtpXSAmJiBkYXRhW2ldLmF0dHJzKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGRhdGFbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHZhciBrZXkgPSBkYXRhW2ldLmF0dHJzLmtleTtcclxuXHRcdFx0XHRcdFx0XHRcdGlmICghZXhpc3Rpbmdba2V5XSkgZXhpc3Rpbmdba2V5XSA9IHthY3Rpb246IElOU0VSVElPTiwgaW5kZXg6IGl9O1xyXG5cdFx0XHRcdFx0XHRcdFx0ZWxzZSBleGlzdGluZ1trZXldID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRhY3Rpb246IE1PVkUsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OiBpLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRmcm9tOiBleGlzdGluZ1trZXldLmluZGV4LFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRlbGVtZW50OiBjYWNoZWQubm9kZXNbZXhpc3Rpbmdba2V5XS5pbmRleF0gfHwgJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHZhciBhY3Rpb25zID0gW11cclxuXHRcdFx0XHRcdGZvciAodmFyIHByb3AgaW4gZXhpc3RpbmcpIGFjdGlvbnMucHVzaChleGlzdGluZ1twcm9wXSlcclxuXHRcdFx0XHRcdHZhciBjaGFuZ2VzID0gYWN0aW9ucy5zb3J0KHNvcnRDaGFuZ2VzKTtcclxuXHRcdFx0XHRcdHZhciBuZXdDYWNoZWQgPSBuZXcgQXJyYXkoY2FjaGVkLmxlbmd0aClcclxuXHRcdFx0XHRcdG5ld0NhY2hlZC5ub2RlcyA9IGNhY2hlZC5ub2Rlcy5zbGljZSgpXHJcblxyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNoYW5nZTsgY2hhbmdlID0gY2hhbmdlc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBERUxFVElPTikge1xyXG5cdFx0XHRcdFx0XHRcdGNsZWFyKGNhY2hlZFtjaGFuZ2UuaW5kZXhdLm5vZGVzLCBjYWNoZWRbY2hhbmdlLmluZGV4XSk7XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShjaGFuZ2UuaW5kZXgsIDEpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IElOU0VSVElPTikge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBkdW1teSA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cdFx0XHRcdFx0XHRcdGR1bW15LmtleSA9IGRhdGFbY2hhbmdlLmluZGV4XS5hdHRycy5rZXk7XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoZHVtbXksIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdIHx8IG51bGwpO1xyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5zcGxpY2UoY2hhbmdlLmluZGV4LCAwLCB7YXR0cnM6IHtrZXk6IGRhdGFbY2hhbmdlLmluZGV4XS5hdHRycy5rZXl9LCBub2RlczogW2R1bW15XX0pXHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzW2NoYW5nZS5pbmRleF0gPSBkdW1teVxyXG5cdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gTU9WRSkge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSAhPT0gY2hhbmdlLmVsZW1lbnQgJiYgY2hhbmdlLmVsZW1lbnQgIT09IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNoYW5nZS5lbGVtZW50LCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbY2hhbmdlLmluZGV4XSB8fCBudWxsKVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWRbY2hhbmdlLmluZGV4XSA9IGNhY2hlZFtjaGFuZ2UuZnJvbV1cclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbY2hhbmdlLmluZGV4XSA9IGNoYW5nZS5lbGVtZW50XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGNhY2hlZCA9IG5ld0NhY2hlZDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9lbmQga2V5IGFsZ29yaXRobVxyXG5cclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNhY2hlQ291bnQgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0Ly9kaWZmIGVhY2ggaXRlbSBpbiB0aGUgYXJyYXlcclxuXHRcdFx0XHR2YXIgaXRlbSA9IGJ1aWxkKHBhcmVudEVsZW1lbnQsIHBhcmVudFRhZywgY2FjaGVkLCBpbmRleCwgZGF0YVtpXSwgY2FjaGVkW2NhY2hlQ291bnRdLCBzaG91bGRSZWF0dGFjaCwgaW5kZXggKyBzdWJBcnJheUNvdW50IHx8IHN1YkFycmF5Q291bnQsIGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpO1xyXG5cdFx0XHRcdGlmIChpdGVtID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xyXG5cdFx0XHRcdGlmICghaXRlbS5ub2Rlcy5pbnRhY3QpIGludGFjdCA9IGZhbHNlO1xyXG5cdFx0XHRcdGlmIChpdGVtLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0XHQvL2ZpeCBvZmZzZXQgb2YgbmV4dCBlbGVtZW50IGlmIGl0ZW0gd2FzIGEgdHJ1c3RlZCBzdHJpbmcgdy8gbW9yZSB0aGFuIG9uZSBodG1sIGVsZW1lbnRcclxuXHRcdFx0XHRcdC8vdGhlIGZpcnN0IGNsYXVzZSBpbiB0aGUgcmVnZXhwIG1hdGNoZXMgZWxlbWVudHNcclxuXHRcdFx0XHRcdC8vdGhlIHNlY29uZCBjbGF1c2UgKGFmdGVyIHRoZSBwaXBlKSBtYXRjaGVzIHRleHQgbm9kZXNcclxuXHRcdFx0XHRcdHN1YkFycmF5Q291bnQgKz0gKGl0ZW0ubWF0Y2goLzxbXlxcL118XFw+XFxzKltePF0vZykgfHwgWzBdKS5sZW5ndGhcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSBzdWJBcnJheUNvdW50ICs9IHR5cGUuY2FsbChpdGVtKSA9PT0gQVJSQVkgPyBpdGVtLmxlbmd0aCA6IDE7XHJcblx0XHRcdFx0Y2FjaGVkW2NhY2hlQ291bnQrK10gPSBpdGVtXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFpbnRhY3QpIHtcclxuXHRcdFx0XHQvL2RpZmYgdGhlIGFycmF5IGl0c2VsZlxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdC8vdXBkYXRlIHRoZSBsaXN0IG9mIERPTSBub2RlcyBieSBjb2xsZWN0aW5nIHRoZSBub2RlcyBmcm9tIGVhY2ggaXRlbVxyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAoY2FjaGVkW2ldICE9IG51bGwpIG5vZGVzLnB1c2guYXBwbHkobm9kZXMsIGNhY2hlZFtpXS5ub2RlcylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly9yZW1vdmUgaXRlbXMgZnJvbSB0aGUgZW5kIG9mIHRoZSBhcnJheSBpZiB0aGUgbmV3IGFycmF5IGlzIHNob3J0ZXIgdGhhbiB0aGUgb2xkIG9uZVxyXG5cdFx0XHRcdC8vaWYgZXJyb3JzIGV2ZXIgaGFwcGVuIGhlcmUsIHRoZSBpc3N1ZSBpcyBtb3N0IGxpa2VseSBhIGJ1ZyBpbiB0aGUgY29uc3RydWN0aW9uIG9mIHRoZSBgY2FjaGVkYCBkYXRhIHN0cnVjdHVyZSBzb21ld2hlcmUgZWFybGllciBpbiB0aGUgcHJvZ3JhbVxyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBub2RlOyBub2RlID0gY2FjaGVkLm5vZGVzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChub2RlLnBhcmVudE5vZGUgIT0gbnVsbCAmJiBub2Rlcy5pbmRleE9mKG5vZGUpIDwgMCkgY2xlYXIoW25vZGVdLCBbY2FjaGVkW2ldXSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoIDwgY2FjaGVkLmxlbmd0aCkgY2FjaGVkLmxlbmd0aCA9IGRhdGEubGVuZ3RoO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKGRhdGEgIT0gbnVsbCAmJiBkYXRhVHlwZSA9PT0gT0JKRUNUKSB7XHJcblx0XHRcdHZhciB2aWV3cyA9IFtdLCBjb250cm9sbGVycyA9IFtdXHJcblx0XHRcdHdoaWxlIChkYXRhLnZpZXcpIHtcclxuXHRcdFx0XHR2YXIgdmlldyA9IGRhdGEudmlldy4kb3JpZ2luYWwgfHwgZGF0YS52aWV3XHJcblx0XHRcdFx0dmFyIGNvbnRyb2xsZXJJbmRleCA9IG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJkaWZmXCIgJiYgY2FjaGVkLnZpZXdzID8gY2FjaGVkLnZpZXdzLmluZGV4T2YodmlldykgOiAtMVxyXG5cdFx0XHRcdHZhciBjb250cm9sbGVyID0gY29udHJvbGxlckluZGV4ID4gLTEgPyBjYWNoZWQuY29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XSA6IG5ldyAoZGF0YS5jb250cm9sbGVyIHx8IG5vb3ApXHJcblx0XHRcdFx0dmFyIGtleSA9IGRhdGEgJiYgZGF0YS5hdHRycyAmJiBkYXRhLmF0dHJzLmtleVxyXG5cdFx0XHRcdGRhdGEgPSBwZW5kaW5nUmVxdWVzdHMgPT0gMCB8fCAoY2FjaGVkICYmIGNhY2hlZC5jb250cm9sbGVycyAmJiBjYWNoZWQuY29udHJvbGxlcnMuaW5kZXhPZihjb250cm9sbGVyKSA+IC0xKSA/IGRhdGEudmlldyhjb250cm9sbGVyKSA6IHt0YWc6IFwicGxhY2Vob2xkZXJcIn1cclxuXHRcdFx0XHRpZiAoZGF0YS5zdWJ0cmVlID09PSBcInJldGFpblwiKSByZXR1cm4gY2FjaGVkO1xyXG5cdFx0XHRcdGlmIChrZXkpIHtcclxuXHRcdFx0XHRcdGlmICghZGF0YS5hdHRycykgZGF0YS5hdHRycyA9IHt9XHJcblx0XHRcdFx0XHRkYXRhLmF0dHJzLmtleSA9IGtleVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCkgdW5sb2FkZXJzLnB1c2goe2NvbnRyb2xsZXI6IGNvbnRyb2xsZXIsIGhhbmRsZXI6IGNvbnRyb2xsZXIub251bmxvYWR9KVxyXG5cdFx0XHRcdHZpZXdzLnB1c2godmlldylcclxuXHRcdFx0XHRjb250cm9sbGVycy5wdXNoKGNvbnRyb2xsZXIpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFkYXRhLnRhZyAmJiBjb250cm9sbGVycy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcihcIkNvbXBvbmVudCB0ZW1wbGF0ZSBtdXN0IHJldHVybiBhIHZpcnR1YWwgZWxlbWVudCwgbm90IGFuIGFycmF5LCBzdHJpbmcsIGV0Yy5cIilcclxuXHRcdFx0aWYgKCFkYXRhLmF0dHJzKSBkYXRhLmF0dHJzID0ge307XHJcblx0XHRcdGlmICghY2FjaGVkLmF0dHJzKSBjYWNoZWQuYXR0cnMgPSB7fTtcclxuXHJcblx0XHRcdHZhciBkYXRhQXR0cktleXMgPSBPYmplY3Qua2V5cyhkYXRhLmF0dHJzKVxyXG5cdFx0XHR2YXIgaGFzS2V5cyA9IGRhdGFBdHRyS2V5cy5sZW5ndGggPiAoXCJrZXlcIiBpbiBkYXRhLmF0dHJzID8gMSA6IDApXHJcblx0XHRcdC8vaWYgYW4gZWxlbWVudCBpcyBkaWZmZXJlbnQgZW5vdWdoIGZyb20gdGhlIG9uZSBpbiBjYWNoZSwgcmVjcmVhdGUgaXRcclxuXHRcdFx0aWYgKGRhdGEudGFnICE9IGNhY2hlZC50YWcgfHwgZGF0YUF0dHJLZXlzLnNvcnQoKS5qb2luKCkgIT0gT2JqZWN0LmtleXMoY2FjaGVkLmF0dHJzKS5zb3J0KCkuam9pbigpIHx8IGRhdGEuYXR0cnMuaWQgIT0gY2FjaGVkLmF0dHJzLmlkIHx8IGRhdGEuYXR0cnMua2V5ICE9IGNhY2hlZC5hdHRycy5rZXkgfHwgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJhbGxcIiAmJiAoIWNhY2hlZC5jb25maWdDb250ZXh0IHx8IGNhY2hlZC5jb25maWdDb250ZXh0LnJldGFpbiAhPT0gdHJ1ZSkpIHx8IChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwiZGlmZlwiICYmIGNhY2hlZC5jb25maWdDb250ZXh0ICYmIGNhY2hlZC5jb25maWdDb250ZXh0LnJldGFpbiA9PT0gZmFsc2UpKSB7XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5ub2Rlcy5sZW5ndGgpIGNsZWFyKGNhY2hlZC5ub2Rlcyk7XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmIHR5cGVvZiBjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKClcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNvbnRyb2xsZXJzKSB7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNhY2hlZC5jb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgY29udHJvbGxlci5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNvbnRyb2xsZXIub251bmxvYWQoe3ByZXZlbnREZWZhdWx0OiBub29wfSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGUuY2FsbChkYXRhLnRhZykgIT0gU1RSSU5HKSByZXR1cm47XHJcblxyXG5cdFx0XHR2YXIgbm9kZSwgaXNOZXcgPSBjYWNoZWQubm9kZXMubGVuZ3RoID09PSAwO1xyXG5cdFx0XHRpZiAoZGF0YS5hdHRycy54bWxucykgbmFtZXNwYWNlID0gZGF0YS5hdHRycy54bWxucztcclxuXHRcdFx0ZWxzZSBpZiAoZGF0YS50YWcgPT09IFwic3ZnXCIpIG5hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcclxuXHRcdFx0ZWxzZSBpZiAoZGF0YS50YWcgPT09IFwibWF0aFwiKSBuYW1lc3BhY2UgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUxcIjtcclxuXHRcdFx0XHJcblx0XHRcdGlmIChpc05ldykge1xyXG5cdFx0XHRcdGlmIChkYXRhLmF0dHJzLmlzKSBub2RlID0gbmFtZXNwYWNlID09PSB1bmRlZmluZWQgPyAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZywgZGF0YS5hdHRycy5pcykgOiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMuaXMpO1xyXG5cdFx0XHRcdGVsc2Ugbm9kZSA9IG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkID8gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZGF0YS50YWcpIDogJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIGRhdGEudGFnKTtcclxuXHRcdFx0XHRjYWNoZWQgPSB7XHJcblx0XHRcdFx0XHR0YWc6IGRhdGEudGFnLFxyXG5cdFx0XHRcdFx0Ly9zZXQgYXR0cmlidXRlcyBmaXJzdCwgdGhlbiBjcmVhdGUgY2hpbGRyZW5cclxuXHRcdFx0XHRcdGF0dHJzOiBoYXNLZXlzID8gc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywgZGF0YS5hdHRycywge30sIG5hbWVzcGFjZSkgOiBkYXRhLmF0dHJzLFxyXG5cdFx0XHRcdFx0Y2hpbGRyZW46IGRhdGEuY2hpbGRyZW4gIT0gbnVsbCAmJiBkYXRhLmNoaWxkcmVuLmxlbmd0aCA+IDAgP1xyXG5cdFx0XHRcdFx0XHRidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgdHJ1ZSwgMCwgZGF0YS5hdHRycy5jb250ZW50ZWRpdGFibGUgPyBub2RlIDogZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncykgOlxyXG5cdFx0XHRcdFx0XHRkYXRhLmNoaWxkcmVuLFxyXG5cdFx0XHRcdFx0bm9kZXM6IFtub2RlXVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXJzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0Y2FjaGVkLnZpZXdzID0gdmlld3NcclxuXHRcdFx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQgJiYgY29udHJvbGxlci5vbnVubG9hZC4kb2xkKSBjb250cm9sbGVyLm9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZC4kb2xkXHJcblx0XHRcdFx0XHRcdGlmIChwZW5kaW5nUmVxdWVzdHMgJiYgY29udHJvbGxlci5vbnVubG9hZCkge1xyXG5cdFx0XHRcdFx0XHRcdHZhciBvbnVubG9hZCA9IGNvbnRyb2xsZXIub251bmxvYWRcclxuXHRcdFx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkID0gbm9vcFxyXG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQuJG9sZCA9IG9udW5sb2FkXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGNhY2hlZC5jaGlsZHJlbiAmJiAhY2FjaGVkLmNoaWxkcmVuLm5vZGVzKSBjYWNoZWQuY2hpbGRyZW4ubm9kZXMgPSBbXTtcclxuXHRcdFx0XHQvL2VkZ2UgY2FzZTogc2V0dGluZyB2YWx1ZSBvbiA8c2VsZWN0PiBkb2Vzbid0IHdvcmsgYmVmb3JlIGNoaWxkcmVuIGV4aXN0LCBzbyBzZXQgaXQgYWdhaW4gYWZ0ZXIgY2hpbGRyZW4gaGF2ZSBiZWVuIGNyZWF0ZWRcclxuXHRcdFx0XHRpZiAoZGF0YS50YWcgPT09IFwic2VsZWN0XCIgJiYgXCJ2YWx1ZVwiIGluIGRhdGEuYXR0cnMpIHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIHt2YWx1ZTogZGF0YS5hdHRycy52YWx1ZX0sIHt9LCBuYW1lc3BhY2UpO1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRub2RlID0gY2FjaGVkLm5vZGVzWzBdO1xyXG5cdFx0XHRcdGlmIChoYXNLZXlzKSBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCBjYWNoZWQuYXR0cnMsIG5hbWVzcGFjZSk7XHJcblx0XHRcdFx0Y2FjaGVkLmNoaWxkcmVuID0gYnVpbGQobm9kZSwgZGF0YS50YWcsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBkYXRhLmNoaWxkcmVuLCBjYWNoZWQuY2hpbGRyZW4sIGZhbHNlLCAwLCBkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKTtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZTtcclxuXHRcdFx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRjYWNoZWQudmlld3MgPSB2aWV3c1xyXG5cdFx0XHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKHNob3VsZFJlYXR0YWNoID09PSB0cnVlICYmIG5vZGUgIT0gbnVsbCkgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHR9XHJcblx0XHRcdC8vc2NoZWR1bGUgY29uZmlncyB0byBiZSBjYWxsZWQuIFRoZXkgYXJlIGNhbGxlZCBhZnRlciBgYnVpbGRgIGZpbmlzaGVzIHJ1bm5pbmdcclxuXHRcdFx0aWYgKHR5cGVvZiBkYXRhLmF0dHJzW1wiY29uZmlnXCJdID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHZhciBjb250ZXh0ID0gY2FjaGVkLmNvbmZpZ0NvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCB8fCB7fTtcclxuXHJcblx0XHRcdFx0Ly8gYmluZFxyXG5cdFx0XHRcdHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGRhdGEsIGFyZ3MpIHtcclxuXHRcdFx0XHRcdHJldHVybiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGRhdGEuYXR0cnNbXCJjb25maWdcIl0uYXBwbHkoZGF0YSwgYXJncylcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdGNvbmZpZ3MucHVzaChjYWxsYmFjayhkYXRhLCBbbm9kZSwgIWlzTmV3LCBjb250ZXh0LCBjYWNoZWRdKSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGRhdGEgIT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0Ly9oYW5kbGUgdGV4dCBub2Rlc1xyXG5cdFx0XHR2YXIgbm9kZXM7XHJcblx0XHRcdGlmIChjYWNoZWQubm9kZXMubGVuZ3RoID09PSAwKSB7XHJcblx0XHRcdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRub2RlcyA9IFskZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSldO1xyXG5cdFx0XHRcdFx0aWYgKCFwYXJlbnRFbGVtZW50Lm5vZGVOYW1lLm1hdGNoKHZvaWRFbGVtZW50cykpIHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5vZGVzWzBdLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhY2hlZCA9IFwic3RyaW5nIG51bWJlciBib29sZWFuXCIuaW5kZXhPZih0eXBlb2YgZGF0YSkgPiAtMSA/IG5ldyBkYXRhLmNvbnN0cnVjdG9yKGRhdGEpIDogZGF0YTtcclxuXHRcdFx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKGNhY2hlZC52YWx1ZU9mKCkgIT09IGRhdGEudmFsdWVPZigpIHx8IHNob3VsZFJlYXR0YWNoID09PSB0cnVlKSB7XHJcblx0XHRcdFx0bm9kZXMgPSBjYWNoZWQubm9kZXM7XHJcblx0XHRcdFx0aWYgKCFlZGl0YWJsZSB8fCBlZGl0YWJsZSAhPT0gJGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpIHtcclxuXHRcdFx0XHRcdGlmIChkYXRhLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0XHRcdGNsZWFyKG5vZGVzLCBjYWNoZWQpO1xyXG5cdFx0XHRcdFx0XHRub2RlcyA9IGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0Ly9jb3JuZXIgY2FzZTogcmVwbGFjaW5nIHRoZSBub2RlVmFsdWUgb2YgYSB0ZXh0IG5vZGUgdGhhdCBpcyBhIGNoaWxkIG9mIGEgdGV4dGFyZWEvY29udGVudGVkaXRhYmxlIGRvZXNuJ3Qgd29ya1xyXG5cdFx0XHRcdFx0XHQvL3dlIG5lZWQgdG8gdXBkYXRlIHRoZSB2YWx1ZSBwcm9wZXJ0eSBvZiB0aGUgcGFyZW50IHRleHRhcmVhIG9yIHRoZSBpbm5lckhUTUwgb2YgdGhlIGNvbnRlbnRlZGl0YWJsZSBlbGVtZW50IGluc3RlYWRcclxuXHRcdFx0XHRcdFx0aWYgKHBhcmVudFRhZyA9PT0gXCJ0ZXh0YXJlYVwiKSBwYXJlbnRFbGVtZW50LnZhbHVlID0gZGF0YTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoZWRpdGFibGUpIGVkaXRhYmxlLmlubmVySFRNTCA9IGRhdGE7XHJcblx0XHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChub2Rlc1swXS5ub2RlVHlwZSA9PT0gMSB8fCBub2Rlcy5sZW5ndGggPiAxKSB7IC8vd2FzIGEgdHJ1c3RlZCBzdHJpbmdcclxuXHRcdFx0XHRcdFx0XHRcdGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKTtcclxuXHRcdFx0XHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV1cclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZXNbMF0sIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbCk7XHJcblx0XHRcdFx0XHRcdFx0bm9kZXNbMF0ubm9kZVZhbHVlID0gZGF0YVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhY2hlZCA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yKGRhdGEpO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBjYWNoZWQubm9kZXMuaW50YWN0ID0gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBjYWNoZWRcclxuXHR9XHJcblx0ZnVuY3Rpb24gc29ydENoYW5nZXMoYSwgYikge3JldHVybiBhLmFjdGlvbiAtIGIuYWN0aW9uIHx8IGEuaW5kZXggLSBiLmluZGV4fVxyXG5cdGZ1bmN0aW9uIHNldEF0dHJpYnV0ZXMobm9kZSwgdGFnLCBkYXRhQXR0cnMsIGNhY2hlZEF0dHJzLCBuYW1lc3BhY2UpIHtcclxuXHRcdGZvciAodmFyIGF0dHJOYW1lIGluIGRhdGFBdHRycykge1xyXG5cdFx0XHR2YXIgZGF0YUF0dHIgPSBkYXRhQXR0cnNbYXR0ck5hbWVdO1xyXG5cdFx0XHR2YXIgY2FjaGVkQXR0ciA9IGNhY2hlZEF0dHJzW2F0dHJOYW1lXTtcclxuXHRcdFx0aWYgKCEoYXR0ck5hbWUgaW4gY2FjaGVkQXR0cnMpIHx8IChjYWNoZWRBdHRyICE9PSBkYXRhQXR0cikpIHtcclxuXHRcdFx0XHRjYWNoZWRBdHRyc1thdHRyTmFtZV0gPSBkYXRhQXR0cjtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly9gY29uZmlnYCBpc24ndCBhIHJlYWwgYXR0cmlidXRlcywgc28gaWdub3JlIGl0XHJcblx0XHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IFwiY29uZmlnXCIgfHwgYXR0ck5hbWUgPT0gXCJrZXlcIikgY29udGludWU7XHJcblx0XHRcdFx0XHQvL2hvb2sgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIGF1dG8tcmVkcmF3aW5nIHN5c3RlbVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIGRhdGFBdHRyID09PSBGVU5DVElPTiAmJiBhdHRyTmFtZS5pbmRleE9mKFwib25cIikgPT09IDApIHtcclxuXHRcdFx0XHRcdFx0bm9kZVthdHRyTmFtZV0gPSBhdXRvcmVkcmF3KGRhdGFBdHRyLCBub2RlKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9oYW5kbGUgYHN0eWxlOiB7Li4ufWBcclxuXHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInN0eWxlXCIgJiYgZGF0YUF0dHIgIT0gbnVsbCAmJiB0eXBlLmNhbGwoZGF0YUF0dHIpID09PSBPQkpFQ1QpIHtcclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcnVsZSBpbiBkYXRhQXR0cikge1xyXG5cdFx0XHRcdFx0XHRcdGlmIChjYWNoZWRBdHRyID09IG51bGwgfHwgY2FjaGVkQXR0cltydWxlXSAhPT0gZGF0YUF0dHJbcnVsZV0pIG5vZGUuc3R5bGVbcnVsZV0gPSBkYXRhQXR0cltydWxlXVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdGZvciAodmFyIHJ1bGUgaW4gY2FjaGVkQXR0cikge1xyXG5cdFx0XHRcdFx0XHRcdGlmICghKHJ1bGUgaW4gZGF0YUF0dHIpKSBub2RlLnN0eWxlW3J1bGVdID0gXCJcIlxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBTVkdcclxuXHRcdFx0XHRcdGVsc2UgaWYgKG5hbWVzcGFjZSAhPSBudWxsKSB7XHJcblx0XHRcdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gXCJocmVmXCIpIG5vZGUuc2V0QXR0cmlidXRlTlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsIFwiaHJlZlwiLCBkYXRhQXR0cik7XHJcblx0XHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcImNsYXNzTmFtZVwiKSBub2RlLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGRhdGFBdHRyKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGF0YUF0dHIpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBjYXNlcyB0aGF0IGFyZSBwcm9wZXJ0aWVzIChidXQgaWdub3JlIGNhc2VzIHdoZXJlIHdlIHNob3VsZCB1c2Ugc2V0QXR0cmlidXRlIGluc3RlYWQpXHJcblx0XHRcdFx0XHQvLy0gbGlzdCBhbmQgZm9ybSBhcmUgdHlwaWNhbGx5IHVzZWQgYXMgc3RyaW5ncywgYnV0IGFyZSBET00gZWxlbWVudCByZWZlcmVuY2VzIGluIGpzXHJcblx0XHRcdFx0XHQvLy0gd2hlbiB1c2luZyBDU1Mgc2VsZWN0b3JzIChlLmcuIGBtKFwiW3N0eWxlPScnXVwiKWApLCBzdHlsZSBpcyB1c2VkIGFzIGEgc3RyaW5nLCBidXQgaXQncyBhbiBvYmplY3QgaW4ganNcclxuXHRcdFx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lIGluIG5vZGUgJiYgIShhdHRyTmFtZSA9PT0gXCJsaXN0XCIgfHwgYXR0ck5hbWUgPT09IFwic3R5bGVcIiB8fCBhdHRyTmFtZSA9PT0gXCJmb3JtXCIgfHwgYXR0ck5hbWUgPT09IFwidHlwZVwiIHx8IGF0dHJOYW1lID09PSBcIndpZHRoXCIgfHwgYXR0ck5hbWUgPT09IFwiaGVpZ2h0XCIpKSB7XHJcblx0XHRcdFx0XHRcdC8vIzM0OCBkb24ndCBzZXQgdGhlIHZhbHVlIGlmIG5vdCBuZWVkZWQgb3RoZXJ3aXNlIGN1cnNvciBwbGFjZW1lbnQgYnJlYWtzIGluIENocm9tZVxyXG5cdFx0XHRcdFx0XHRpZiAodGFnICE9PSBcImlucHV0XCIgfHwgbm9kZVthdHRyTmFtZV0gIT09IGRhdGFBdHRyKSBub2RlW2F0dHJOYW1lXSA9IGRhdGFBdHRyXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdC8vc3dhbGxvdyBJRSdzIGludmFsaWQgYXJndW1lbnQgZXJyb3JzIHRvIG1pbWljIEhUTUwncyBmYWxsYmFjay10by1kb2luZy1ub3RoaW5nLW9uLWludmFsaWQtYXR0cmlidXRlcyBiZWhhdmlvclxyXG5cdFx0XHRcdFx0aWYgKGUubWVzc2FnZS5pbmRleE9mKFwiSW52YWxpZCBhcmd1bWVudFwiKSA8IDApIHRocm93IGVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8jMzQ4IGRhdGFBdHRyIG1heSBub3QgYmUgYSBzdHJpbmcsIHNvIHVzZSBsb29zZSBjb21wYXJpc29uIChkb3VibGUgZXF1YWwpIGluc3RlYWQgb2Ygc3RyaWN0ICh0cmlwbGUgZXF1YWwpXHJcblx0XHRcdGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInZhbHVlXCIgJiYgdGFnID09PSBcImlucHV0XCIgJiYgbm9kZS52YWx1ZSAhPSBkYXRhQXR0cikge1xyXG5cdFx0XHRcdG5vZGUudmFsdWUgPSBkYXRhQXR0clxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gY2FjaGVkQXR0cnNcclxuXHR9XHJcblx0ZnVuY3Rpb24gY2xlYXIobm9kZXMsIGNhY2hlZCkge1xyXG5cdFx0Zm9yICh2YXIgaSA9IG5vZGVzLmxlbmd0aCAtIDE7IGkgPiAtMTsgaS0tKSB7XHJcblx0XHRcdGlmIChub2Rlc1tpXSAmJiBub2Rlc1tpXS5wYXJlbnROb2RlKSB7XHJcblx0XHRcdFx0dHJ5IHtub2Rlc1tpXS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGVzW2ldKX1cclxuXHRcdFx0XHRjYXRjaCAoZSkge30gLy9pZ25vcmUgaWYgdGhpcyBmYWlscyBkdWUgdG8gb3JkZXIgb2YgZXZlbnRzIChzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMTkyNjA4My9mYWlsZWQtdG8tZXhlY3V0ZS1yZW1vdmVjaGlsZC1vbi1ub2RlKVxyXG5cdFx0XHRcdGNhY2hlZCA9IFtdLmNvbmNhdChjYWNoZWQpO1xyXG5cdFx0XHRcdGlmIChjYWNoZWRbaV0pIHVubG9hZChjYWNoZWRbaV0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChub2Rlcy5sZW5ndGggIT0gMCkgbm9kZXMubGVuZ3RoID0gMFxyXG5cdH1cclxuXHRmdW5jdGlvbiB1bmxvYWQoY2FjaGVkKSB7XHJcblx0XHRpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgdHlwZW9mIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCgpO1xyXG5cdFx0XHRjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCA9IG51bGxcclxuXHRcdH1cclxuXHRcdGlmIChjYWNoZWQuY29udHJvbGxlcnMpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNvbnRyb2xsZXI7IGNvbnRyb2xsZXIgPSBjYWNoZWQuY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgY29udHJvbGxlci5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIGNvbnRyb2xsZXIub251bmxvYWQoe3ByZXZlbnREZWZhdWx0OiBub29wfSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmIChjYWNoZWQuY2hpbGRyZW4pIHtcclxuXHRcdFx0aWYgKHR5cGUuY2FsbChjYWNoZWQuY2hpbGRyZW4pID09PSBBUlJBWSkge1xyXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjaGlsZDsgY2hpbGQgPSBjYWNoZWQuY2hpbGRyZW5baV07IGkrKykgdW5sb2FkKGNoaWxkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKGNhY2hlZC5jaGlsZHJlbi50YWcpIHVubG9hZChjYWNoZWQuY2hpbGRyZW4pXHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpIHtcclxuXHRcdHZhciBuZXh0U2libGluZyA9IHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF07XHJcblx0XHRpZiAobmV4dFNpYmxpbmcpIHtcclxuXHRcdFx0dmFyIGlzRWxlbWVudCA9IG5leHRTaWJsaW5nLm5vZGVUeXBlICE9IDE7XHJcblx0XHRcdHZhciBwbGFjZWhvbGRlciA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcclxuXHRcdFx0aWYgKGlzRWxlbWVudCkge1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKHBsYWNlaG9sZGVyLCBuZXh0U2libGluZyB8fCBudWxsKTtcclxuXHRcdFx0XHRwbGFjZWhvbGRlci5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKTtcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgbmV4dFNpYmxpbmcuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlYmVnaW5cIiwgZGF0YSlcclxuXHRcdH1cclxuXHRcdGVsc2UgcGFyZW50RWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmVlbmRcIiwgZGF0YSk7XHJcblx0XHR2YXIgbm9kZXMgPSBbXTtcclxuXHRcdHdoaWxlIChwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdICE9PSBuZXh0U2libGluZykge1xyXG5cdFx0XHRub2Rlcy5wdXNoKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0pO1xyXG5cdFx0XHRpbmRleCsrXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbm9kZXNcclxuXHR9XHJcblx0ZnVuY3Rpb24gYXV0b3JlZHJhdyhjYWxsYmFjaywgb2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpO1xyXG5cdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0dHJ5IHtyZXR1cm4gY2FsbGJhY2suY2FsbChvYmplY3QsIGUpfVxyXG5cdFx0XHRmaW5hbGx5IHtcclxuXHRcdFx0XHRlbmRGaXJzdENvbXB1dGF0aW9uKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGh0bWw7XHJcblx0dmFyIGRvY3VtZW50Tm9kZSA9IHtcclxuXHRcdGFwcGVuZENoaWxkOiBmdW5jdGlvbihub2RlKSB7XHJcblx0XHRcdGlmIChodG1sID09PSB1bmRlZmluZWQpIGh0bWwgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImh0bWxcIik7XHJcblx0XHRcdGlmICgkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ICYmICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgIT09IG5vZGUpIHtcclxuXHRcdFx0XHQkZG9jdW1lbnQucmVwbGFjZUNoaWxkKG5vZGUsICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSAkZG9jdW1lbnQuYXBwZW5kQ2hpbGQobm9kZSk7XHJcblx0XHRcdHRoaXMuY2hpbGROb2RlcyA9ICRkb2N1bWVudC5jaGlsZE5vZGVzXHJcblx0XHR9LFxyXG5cdFx0aW5zZXJ0QmVmb3JlOiBmdW5jdGlvbihub2RlKSB7XHJcblx0XHRcdHRoaXMuYXBwZW5kQ2hpbGQobm9kZSlcclxuXHRcdH0sXHJcblx0XHRjaGlsZE5vZGVzOiBbXVxyXG5cdH07XHJcblx0dmFyIG5vZGVDYWNoZSA9IFtdLCBjZWxsQ2FjaGUgPSB7fTtcclxuXHRtLnJlbmRlciA9IGZ1bmN0aW9uKHJvb3QsIGNlbGwsIGZvcmNlUmVjcmVhdGlvbikge1xyXG5cdFx0dmFyIGNvbmZpZ3MgPSBbXTtcclxuXHRcdGlmICghcm9vdCkgdGhyb3cgbmV3IEVycm9yKFwiRW5zdXJlIHRoZSBET00gZWxlbWVudCBiZWluZyBwYXNzZWQgdG8gbS5yb3V0ZS9tLm1vdW50L20ucmVuZGVyIGlzIG5vdCB1bmRlZmluZWQuXCIpO1xyXG5cdFx0dmFyIGlkID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpO1xyXG5cdFx0dmFyIGlzRG9jdW1lbnRSb290ID0gcm9vdCA9PT0gJGRvY3VtZW50O1xyXG5cdFx0dmFyIG5vZGUgPSBpc0RvY3VtZW50Um9vdCB8fCByb290ID09PSAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ID8gZG9jdW1lbnROb2RlIDogcm9vdDtcclxuXHRcdGlmIChpc0RvY3VtZW50Um9vdCAmJiBjZWxsLnRhZyAhPSBcImh0bWxcIikgY2VsbCA9IHt0YWc6IFwiaHRtbFwiLCBhdHRyczoge30sIGNoaWxkcmVuOiBjZWxsfTtcclxuXHRcdGlmIChjZWxsQ2FjaGVbaWRdID09PSB1bmRlZmluZWQpIGNsZWFyKG5vZGUuY2hpbGROb2Rlcyk7XHJcblx0XHRpZiAoZm9yY2VSZWNyZWF0aW9uID09PSB0cnVlKSByZXNldChyb290KTtcclxuXHRcdGNlbGxDYWNoZVtpZF0gPSBidWlsZChub2RlLCBudWxsLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2VsbCwgY2VsbENhY2hlW2lkXSwgZmFsc2UsIDAsIG51bGwsIHVuZGVmaW5lZCwgY29uZmlncyk7XHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gY29uZmlncy5sZW5ndGg7IGkgPCBsZW47IGkrKykgY29uZmlnc1tpXSgpXHJcblx0fTtcclxuXHRmdW5jdGlvbiBnZXRDZWxsQ2FjaGVLZXkoZWxlbWVudCkge1xyXG5cdFx0dmFyIGluZGV4ID0gbm9kZUNhY2hlLmluZGV4T2YoZWxlbWVudCk7XHJcblx0XHRyZXR1cm4gaW5kZXggPCAwID8gbm9kZUNhY2hlLnB1c2goZWxlbWVudCkgLSAxIDogaW5kZXhcclxuXHR9XHJcblxyXG5cdG0udHJ1c3QgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0dmFsdWUgPSBuZXcgU3RyaW5nKHZhbHVlKTtcclxuXHRcdHZhbHVlLiR0cnVzdGVkID0gdHJ1ZTtcclxuXHRcdHJldHVybiB2YWx1ZVxyXG5cdH07XHJcblxyXG5cdGZ1bmN0aW9uIGdldHRlcnNldHRlcihzdG9yZSkge1xyXG5cdFx0dmFyIHByb3AgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGgpIHN0b3JlID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH07XHJcblxyXG5cdFx0cHJvcC50b0pTT04gPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0cmV0dXJuIHN0b3JlXHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBwcm9wXHJcblx0fVxyXG5cclxuXHRtLnByb3AgPSBmdW5jdGlvbiAoc3RvcmUpIHtcclxuXHRcdC8vbm90ZTogdXNpbmcgbm9uLXN0cmljdCBlcXVhbGl0eSBjaGVjayBoZXJlIGJlY2F1c2Ugd2UncmUgY2hlY2tpbmcgaWYgc3RvcmUgaXMgbnVsbCBPUiB1bmRlZmluZWRcclxuXHRcdGlmICgoKHN0b3JlICE9IG51bGwgJiYgdHlwZS5jYWxsKHN0b3JlKSA9PT0gT0JKRUNUKSB8fCB0eXBlb2Ygc3RvcmUgPT09IEZVTkNUSU9OKSAmJiB0eXBlb2Ygc3RvcmUudGhlbiA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0cmV0dXJuIHByb3BpZnkoc3RvcmUpXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGdldHRlcnNldHRlcihzdG9yZSlcclxuXHR9O1xyXG5cclxuXHR2YXIgcm9vdHMgPSBbXSwgY29tcG9uZW50cyA9IFtdLCBjb250cm9sbGVycyA9IFtdLCBsYXN0UmVkcmF3SWQgPSBudWxsLCBsYXN0UmVkcmF3Q2FsbFRpbWUgPSAwLCBjb21wdXRlUHJlUmVkcmF3SG9vayA9IG51bGwsIGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGwsIHByZXZlbnRlZCA9IGZhbHNlLCB0b3BDb21wb25lbnQsIHVubG9hZGVycyA9IFtdO1xyXG5cdHZhciBGUkFNRV9CVURHRVQgPSAxNjsgLy82MCBmcmFtZXMgcGVyIHNlY29uZCA9IDEgY2FsbCBwZXIgMTYgbXNcclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBhcmdzKSB7XHJcblx0XHR2YXIgY29udHJvbGxlciA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gKGNvbXBvbmVudC5jb250cm9sbGVyIHx8IG5vb3ApLmFwcGx5KHRoaXMsIGFyZ3MpIHx8IHRoaXNcclxuXHRcdH1cclxuXHRcdHZhciB2aWV3ID0gZnVuY3Rpb24oY3RybCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIGFyZ3MgPSBhcmdzLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXHJcblx0XHRcdHJldHVybiBjb21wb25lbnQudmlldy5hcHBseShjb21wb25lbnQsIGFyZ3MgPyBbY3RybF0uY29uY2F0KGFyZ3MpIDogW2N0cmxdKVxyXG5cdFx0fVxyXG5cdFx0dmlldy4kb3JpZ2luYWwgPSBjb21wb25lbnQudmlld1xyXG5cdFx0dmFyIG91dHB1dCA9IHtjb250cm9sbGVyOiBjb250cm9sbGVyLCB2aWV3OiB2aWV3fVxyXG5cdFx0aWYgKGFyZ3NbMF0gJiYgYXJnc1swXS5rZXkgIT0gbnVsbCkgb3V0cHV0LmF0dHJzID0ge2tleTogYXJnc1swXS5rZXl9XHJcblx0XHRyZXR1cm4gb3V0cHV0XHJcblx0fVxyXG5cdG0uY29tcG9uZW50ID0gZnVuY3Rpb24oY29tcG9uZW50KSB7XHJcblx0XHRyZXR1cm4gcGFyYW1ldGVyaXplKGNvbXBvbmVudCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKVxyXG5cdH1cclxuXHRtLm1vdW50ID0gbS5tb2R1bGUgPSBmdW5jdGlvbihyb290LCBjb21wb25lbnQpIHtcclxuXHRcdGlmICghcm9vdCkgdGhyb3cgbmV3IEVycm9yKFwiUGxlYXNlIGVuc3VyZSB0aGUgRE9NIGVsZW1lbnQgZXhpc3RzIGJlZm9yZSByZW5kZXJpbmcgYSB0ZW1wbGF0ZSBpbnRvIGl0LlwiKTtcclxuXHRcdHZhciBpbmRleCA9IHJvb3RzLmluZGV4T2Yocm9vdCk7XHJcblx0XHRpZiAoaW5kZXggPCAwKSBpbmRleCA9IHJvb3RzLmxlbmd0aDtcclxuXHRcdFxyXG5cdFx0dmFyIGlzUHJldmVudGVkID0gZmFsc2U7XHJcblx0XHR2YXIgZXZlbnQgPSB7cHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpc1ByZXZlbnRlZCA9IHRydWU7XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gY29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbDtcclxuXHRcdH19O1xyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIHVubG9hZGVyOyB1bmxvYWRlciA9IHVubG9hZGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdHVubG9hZGVyLmhhbmRsZXIuY2FsbCh1bmxvYWRlci5jb250cm9sbGVyLCBldmVudClcclxuXHRcdFx0dW5sb2FkZXIuY29udHJvbGxlci5vbnVubG9hZCA9IG51bGxcclxuXHRcdH1cclxuXHRcdGlmIChpc1ByZXZlbnRlZCkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgdW5sb2FkZXI7IHVubG9hZGVyID0gdW5sb2FkZXJzW2ldOyBpKyspIHVubG9hZGVyLmNvbnRyb2xsZXIub251bmxvYWQgPSB1bmxvYWRlci5oYW5kbGVyXHJcblx0XHR9XHJcblx0XHRlbHNlIHVubG9hZGVycyA9IFtdXHJcblx0XHRcclxuXHRcdGlmIChjb250cm9sbGVyc1tpbmRleF0gJiYgdHlwZW9mIGNvbnRyb2xsZXJzW2luZGV4XS5vbnVubG9hZCA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0Y29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkKGV2ZW50KVxyXG5cdFx0fVxyXG5cdFx0XHJcblx0XHRpZiAoIWlzUHJldmVudGVkKSB7XHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiYWxsXCIpO1xyXG5cdFx0XHRtLnN0YXJ0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0cm9vdHNbaW5kZXhdID0gcm9vdDtcclxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSBjb21wb25lbnQgPSBzdWJjb21wb25lbnQoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMikpXHJcblx0XHRcdHZhciBjdXJyZW50Q29tcG9uZW50ID0gdG9wQ29tcG9uZW50ID0gY29tcG9uZW50ID0gY29tcG9uZW50IHx8IHtjb250cm9sbGVyOiBmdW5jdGlvbigpIHt9fTtcclxuXHRcdFx0dmFyIGNvbnN0cnVjdG9yID0gY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcFxyXG5cdFx0XHR2YXIgY29udHJvbGxlciA9IG5ldyBjb25zdHJ1Y3RvcjtcclxuXHRcdFx0Ly9jb250cm9sbGVycyBtYXkgY2FsbCBtLm1vdW50IHJlY3Vyc2l2ZWx5ICh2aWEgbS5yb3V0ZSByZWRpcmVjdHMsIGZvciBleGFtcGxlKVxyXG5cdFx0XHQvL3RoaXMgY29uZGl0aW9uYWwgZW5zdXJlcyBvbmx5IHRoZSBsYXN0IHJlY3Vyc2l2ZSBtLm1vdW50IGNhbGwgaXMgYXBwbGllZFxyXG5cdFx0XHRpZiAoY3VycmVudENvbXBvbmVudCA9PT0gdG9wQ29tcG9uZW50KSB7XHJcblx0XHRcdFx0Y29udHJvbGxlcnNbaW5kZXhdID0gY29udHJvbGxlcjtcclxuXHRcdFx0XHRjb21wb25lbnRzW2luZGV4XSA9IGNvbXBvbmVudFxyXG5cdFx0XHR9XHJcblx0XHRcdGVuZEZpcnN0Q29tcHV0YXRpb24oKTtcclxuXHRcdFx0cmV0dXJuIGNvbnRyb2xsZXJzW2luZGV4XVxyXG5cdFx0fVxyXG5cdH07XHJcblx0dmFyIHJlZHJhd2luZyA9IGZhbHNlXHJcblx0bS5yZWRyYXcgPSBmdW5jdGlvbihmb3JjZSkge1xyXG5cdFx0aWYgKHJlZHJhd2luZykgcmV0dXJuXHJcblx0XHRyZWRyYXdpbmcgPSB0cnVlXHJcblx0XHQvL2xhc3RSZWRyYXdJZCBpcyBhIHBvc2l0aXZlIG51bWJlciBpZiBhIHNlY29uZCByZWRyYXcgaXMgcmVxdWVzdGVkIGJlZm9yZSB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWVcclxuXHRcdC8vbGFzdFJlZHJhd0lEIGlzIG51bGwgaWYgaXQncyB0aGUgZmlyc3QgcmVkcmF3IGFuZCBub3QgYW4gZXZlbnQgaGFuZGxlclxyXG5cdFx0aWYgKGxhc3RSZWRyYXdJZCAmJiBmb3JjZSAhPT0gdHJ1ZSkge1xyXG5cdFx0XHQvL3doZW4gc2V0VGltZW91dDogb25seSByZXNjaGVkdWxlIHJlZHJhdyBpZiB0aW1lIGJldHdlZW4gbm93IGFuZCBwcmV2aW91cyByZWRyYXcgaXMgYmlnZ2VyIHRoYW4gYSBmcmFtZSwgb3RoZXJ3aXNlIGtlZXAgY3VycmVudGx5IHNjaGVkdWxlZCB0aW1lb3V0XHJcblx0XHRcdC8vd2hlbiByQUY6IGFsd2F5cyByZXNjaGVkdWxlIHJlZHJhd1xyXG5cdFx0XHRpZiAoJHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBuZXcgRGF0ZSAtIGxhc3RSZWRyYXdDYWxsVGltZSA+IEZSQU1FX0JVREdFVCkge1xyXG5cdFx0XHRcdGlmIChsYXN0UmVkcmF3SWQgPiAwKSAkY2FuY2VsQW5pbWF0aW9uRnJhbWUobGFzdFJlZHJhd0lkKTtcclxuXHRcdFx0XHRsYXN0UmVkcmF3SWQgPSAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlZHJhdywgRlJBTUVfQlVER0VUKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0cmVkcmF3KCk7XHJcblx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7bGFzdFJlZHJhd0lkID0gbnVsbH0sIEZSQU1FX0JVREdFVClcclxuXHRcdH1cclxuXHRcdHJlZHJhd2luZyA9IGZhbHNlXHJcblx0fTtcclxuXHRtLnJlZHJhdy5zdHJhdGVneSA9IG0ucHJvcCgpO1xyXG5cdGZ1bmN0aW9uIHJlZHJhdygpIHtcclxuXHRcdGlmIChjb21wdXRlUHJlUmVkcmF3SG9vaykge1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vaygpXHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0Zm9yICh2YXIgaSA9IDAsIHJvb3Q7IHJvb3QgPSByb290c1tpXTsgaSsrKSB7XHJcblx0XHRcdGlmIChjb250cm9sbGVyc1tpXSkge1xyXG5cdFx0XHRcdHZhciBhcmdzID0gY29tcG9uZW50c1tpXS5jb250cm9sbGVyICYmIGNvbXBvbmVudHNbaV0uY29udHJvbGxlci4kJGFyZ3MgPyBbY29udHJvbGxlcnNbaV1dLmNvbmNhdChjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIuJCRhcmdzKSA6IFtjb250cm9sbGVyc1tpXV1cclxuXHRcdFx0XHRtLnJlbmRlcihyb290LCBjb21wb25lbnRzW2ldLnZpZXcgPyBjb21wb25lbnRzW2ldLnZpZXcoY29udHJvbGxlcnNbaV0sIGFyZ3MpIDogXCJcIilcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly9hZnRlciByZW5kZXJpbmcgd2l0aGluIGEgcm91dGVkIGNvbnRleHQsIHdlIG5lZWQgdG8gc2Nyb2xsIGJhY2sgdG8gdGhlIHRvcCwgYW5kIGZldGNoIHRoZSBkb2N1bWVudCB0aXRsZSBmb3IgaGlzdG9yeS5wdXNoU3RhdGVcclxuXHRcdGlmIChjb21wdXRlUG9zdFJlZHJhd0hvb2spIHtcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rKCk7XHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGxhc3RSZWRyYXdJZCA9IG51bGw7XHJcblx0XHRsYXN0UmVkcmF3Q2FsbFRpbWUgPSBuZXcgRGF0ZTtcclxuXHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdH1cclxuXHJcblx0dmFyIHBlbmRpbmdSZXF1ZXN0cyA9IDA7XHJcblx0bS5zdGFydENvbXB1dGF0aW9uID0gZnVuY3Rpb24oKSB7cGVuZGluZ1JlcXVlc3RzKyt9O1xyXG5cdG0uZW5kQ29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHRcdHBlbmRpbmdSZXF1ZXN0cyA9IE1hdGgubWF4KHBlbmRpbmdSZXF1ZXN0cyAtIDEsIDApO1xyXG5cdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyA9PT0gMCkgbS5yZWRyYXcoKVxyXG5cdH07XHJcblx0dmFyIGVuZEZpcnN0Q29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtcclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09IFwibm9uZVwiKSB7XHJcblx0XHRcdHBlbmRpbmdSZXF1ZXN0cy0tXHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBtLmVuZENvbXB1dGF0aW9uKCk7XHJcblx0fVxyXG5cclxuXHRtLndpdGhBdHRyID0gZnVuY3Rpb24ocHJvcCwgd2l0aEF0dHJDYWxsYmFjaykge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IHRoaXM7XHJcblx0XHRcdHdpdGhBdHRyQ2FsbGJhY2socHJvcCBpbiBjdXJyZW50VGFyZ2V0ID8gY3VycmVudFRhcmdldFtwcm9wXSA6IGN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKHByb3ApKVxyXG5cdFx0fVxyXG5cdH07XHJcblxyXG5cdC8vcm91dGluZ1xyXG5cdHZhciBtb2RlcyA9IHtwYXRobmFtZTogXCJcIiwgaGFzaDogXCIjXCIsIHNlYXJjaDogXCI/XCJ9O1xyXG5cdHZhciByZWRpcmVjdCA9IG5vb3AsIHJvdXRlUGFyYW1zLCBjdXJyZW50Um91dGUsIGlzRGVmYXVsdFJvdXRlID0gZmFsc2U7XHJcblx0bS5yb3V0ZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0Ly9tLnJvdXRlKClcclxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gY3VycmVudFJvdXRlO1xyXG5cdFx0Ly9tLnJvdXRlKGVsLCBkZWZhdWx0Um91dGUsIHJvdXRlcylcclxuXHRcdGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgdHlwZS5jYWxsKGFyZ3VtZW50c1sxXSkgPT09IFNUUklORykge1xyXG5cdFx0XHR2YXIgcm9vdCA9IGFyZ3VtZW50c1swXSwgZGVmYXVsdFJvdXRlID0gYXJndW1lbnRzWzFdLCByb3V0ZXIgPSBhcmd1bWVudHNbMl07XHJcblx0XHRcdHJlZGlyZWN0ID0gZnVuY3Rpb24oc291cmNlKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSBjdXJyZW50Um91dGUgPSBub3JtYWxpemVSb3V0ZShzb3VyY2UpO1xyXG5cdFx0XHRcdGlmICghcm91dGVCeVZhbHVlKHJvb3QsIHJvdXRlciwgcGF0aCkpIHtcclxuXHRcdFx0XHRcdGlmIChpc0RlZmF1bHRSb3V0ZSkgdGhyb3cgbmV3IEVycm9yKFwiRW5zdXJlIHRoZSBkZWZhdWx0IHJvdXRlIG1hdGNoZXMgb25lIG9mIHRoZSByb3V0ZXMgZGVmaW5lZCBpbiBtLnJvdXRlXCIpXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IHRydWVcclxuXHRcdFx0XHRcdG0ucm91dGUoZGVmYXVsdFJvdXRlLCB0cnVlKVxyXG5cdFx0XHRcdFx0aXNEZWZhdWx0Um91dGUgPSBmYWxzZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHRcdFx0dmFyIGxpc3RlbmVyID0gbS5yb3V0ZS5tb2RlID09PSBcImhhc2hcIiA/IFwib25oYXNoY2hhbmdlXCIgOiBcIm9ucG9wc3RhdGVcIjtcclxuXHRcdFx0d2luZG93W2xpc3RlbmVyXSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHZhciBwYXRoID0gJGxvY2F0aW9uW20ucm91dGUubW9kZV1cclxuXHRcdFx0XHRpZiAobS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIpIHBhdGggKz0gJGxvY2F0aW9uLnNlYXJjaFxyXG5cdFx0XHRcdGlmIChjdXJyZW50Um91dGUgIT0gbm9ybWFsaXplUm91dGUocGF0aCkpIHtcclxuXHRcdFx0XHRcdHJlZGlyZWN0KHBhdGgpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbDtcclxuXHRcdFx0d2luZG93W2xpc3RlbmVyXSgpXHJcblx0XHR9XHJcblx0XHQvL2NvbmZpZzogbS5yb3V0ZVxyXG5cdFx0ZWxzZSBpZiAoYXJndW1lbnRzWzBdLmFkZEV2ZW50TGlzdGVuZXIgfHwgYXJndW1lbnRzWzBdLmF0dGFjaEV2ZW50KSB7XHJcblx0XHRcdHZhciBlbGVtZW50ID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHR2YXIgaXNJbml0aWFsaXplZCA9IGFyZ3VtZW50c1sxXTtcclxuXHRcdFx0dmFyIGNvbnRleHQgPSBhcmd1bWVudHNbMl07XHJcblx0XHRcdHZhciB2ZG9tID0gYXJndW1lbnRzWzNdO1xyXG5cdFx0XHRlbGVtZW50LmhyZWYgPSAobS5yb3V0ZS5tb2RlICE9PSAncGF0aG5hbWUnID8gJGxvY2F0aW9uLnBhdGhuYW1lIDogJycpICsgbW9kZXNbbS5yb3V0ZS5tb2RlXSArIHZkb20uYXR0cnMuaHJlZjtcclxuXHRcdFx0aWYgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcikge1xyXG5cdFx0XHRcdGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpO1xyXG5cdFx0XHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0ZWxlbWVudC5kZXRhY2hFdmVudChcIm9uY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSk7XHJcblx0XHRcdFx0ZWxlbWVudC5hdHRhY2hFdmVudChcIm9uY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Ly9tLnJvdXRlKHJvdXRlLCBwYXJhbXMsIHNob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkpXHJcblx0XHRlbHNlIGlmICh0eXBlLmNhbGwoYXJndW1lbnRzWzBdKSA9PT0gU1RSSU5HKSB7XHJcblx0XHRcdHZhciBvbGRSb3V0ZSA9IGN1cnJlbnRSb3V0ZTtcclxuXHRcdFx0Y3VycmVudFJvdXRlID0gYXJndW1lbnRzWzBdO1xyXG5cdFx0XHR2YXIgYXJncyA9IGFyZ3VtZW50c1sxXSB8fCB7fVxyXG5cdFx0XHR2YXIgcXVlcnlJbmRleCA9IGN1cnJlbnRSb3V0ZS5pbmRleE9mKFwiP1wiKVxyXG5cdFx0XHR2YXIgcGFyYW1zID0gcXVlcnlJbmRleCA+IC0xID8gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50Um91dGUuc2xpY2UocXVlcnlJbmRleCArIDEpKSA6IHt9XHJcblx0XHRcdGZvciAodmFyIGkgaW4gYXJncykgcGFyYW1zW2ldID0gYXJnc1tpXVxyXG5cdFx0XHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKHBhcmFtcylcclxuXHRcdFx0dmFyIGN1cnJlbnRQYXRoID0gcXVlcnlJbmRleCA+IC0xID8gY3VycmVudFJvdXRlLnNsaWNlKDAsIHF1ZXJ5SW5kZXgpIDogY3VycmVudFJvdXRlXHJcblx0XHRcdGlmIChxdWVyeXN0cmluZykgY3VycmVudFJvdXRlID0gY3VycmVudFBhdGggKyAoY3VycmVudFBhdGguaW5kZXhPZihcIj9cIikgPT09IC0xID8gXCI/XCIgOiBcIiZcIikgKyBxdWVyeXN0cmluZztcclxuXHJcblx0XHRcdHZhciBzaG91bGRSZXBsYWNlSGlzdG9yeUVudHJ5ID0gKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgPyBhcmd1bWVudHNbMl0gOiBhcmd1bWVudHNbMV0pID09PSB0cnVlIHx8IG9sZFJvdXRlID09PSBhcmd1bWVudHNbMF07XHJcblxyXG5cdFx0XHRpZiAod2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKSB7XHJcblx0XHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBzZXRTY3JvbGxcclxuXHRcdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHdpbmRvdy5oaXN0b3J5W3Nob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkgPyBcInJlcGxhY2VTdGF0ZVwiIDogXCJwdXNoU3RhdGVcIl0obnVsbCwgJGRvY3VtZW50LnRpdGxlLCBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKTtcclxuXHRcdFx0XHR9O1xyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0JGxvY2F0aW9uW20ucm91dGUubW9kZV0gPSBjdXJyZW50Um91dGVcclxuXHRcdFx0XHRyZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fTtcclxuXHRtLnJvdXRlLnBhcmFtID0gZnVuY3Rpb24oa2V5KSB7XHJcblx0XHRpZiAoIXJvdXRlUGFyYW1zKSB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBjYWxsIG0ucm91dGUoZWxlbWVudCwgZGVmYXVsdFJvdXRlLCByb3V0ZXMpIGJlZm9yZSBjYWxsaW5nIG0ucm91dGUucGFyYW0oKVwiKVxyXG5cdFx0cmV0dXJuIHJvdXRlUGFyYW1zW2tleV1cclxuXHR9O1xyXG5cdG0ucm91dGUubW9kZSA9IFwic2VhcmNoXCI7XHJcblx0ZnVuY3Rpb24gbm9ybWFsaXplUm91dGUocm91dGUpIHtcclxuXHRcdHJldHVybiByb3V0ZS5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aClcclxuXHR9XHJcblx0ZnVuY3Rpb24gcm91dGVCeVZhbHVlKHJvb3QsIHJvdXRlciwgcGF0aCkge1xyXG5cdFx0cm91dGVQYXJhbXMgPSB7fTtcclxuXHJcblx0XHR2YXIgcXVlcnlTdGFydCA9IHBhdGguaW5kZXhPZihcIj9cIik7XHJcblx0XHRpZiAocXVlcnlTdGFydCAhPT0gLTEpIHtcclxuXHRcdFx0cm91dGVQYXJhbXMgPSBwYXJzZVF1ZXJ5U3RyaW5nKHBhdGguc3Vic3RyKHF1ZXJ5U3RhcnQgKyAxLCBwYXRoLmxlbmd0aCkpO1xyXG5cdFx0XHRwYXRoID0gcGF0aC5zdWJzdHIoMCwgcXVlcnlTdGFydClcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHZXQgYWxsIHJvdXRlcyBhbmQgY2hlY2sgaWYgdGhlcmUnc1xyXG5cdFx0Ly8gYW4gZXhhY3QgbWF0Y2ggZm9yIHRoZSBjdXJyZW50IHBhdGhcclxuXHRcdHZhciBrZXlzID0gT2JqZWN0LmtleXMocm91dGVyKTtcclxuXHRcdHZhciBpbmRleCA9IGtleXMuaW5kZXhPZihwYXRoKTtcclxuXHRcdGlmKGluZGV4ICE9PSAtMSl7XHJcblx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW2tleXMgW2luZGV4XV0pO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKHZhciByb3V0ZSBpbiByb3V0ZXIpIHtcclxuXHRcdFx0aWYgKHJvdXRlID09PSBwYXRoKSB7XHJcblx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoXCJeXCIgKyByb3V0ZS5yZXBsYWNlKC86W15cXC9dKz9cXC57M30vZywgXCIoLio/KVwiKS5yZXBsYWNlKC86W15cXC9dKy9nLCBcIihbXlxcXFwvXSspXCIpICsgXCJcXC8/JFwiKTtcclxuXHJcblx0XHRcdGlmIChtYXRjaGVyLnRlc3QocGF0aCkpIHtcclxuXHRcdFx0XHRwYXRoLnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0XHR2YXIga2V5cyA9IHJvdXRlLm1hdGNoKC86W15cXC9dKy9nKSB8fCBbXTtcclxuXHRcdFx0XHRcdHZhciB2YWx1ZXMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgLTIpO1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHJvdXRlUGFyYW1zW2tleXNbaV0ucmVwbGFjZSgvOnxcXC4vZywgXCJcIildID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlc1tpXSlcclxuXHRcdFx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW3JvdXRlXSlcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIHJvdXRlVW5vYnRydXNpdmUoZSkge1xyXG5cdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRpZiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSB8fCBlLndoaWNoID09PSAyKSByZXR1cm47XHJcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0ZWxzZSBlLnJldHVyblZhbHVlID0gZmFsc2U7XHJcblx0XHR2YXIgY3VycmVudFRhcmdldCA9IGUuY3VycmVudFRhcmdldCB8fCBlLnNyY0VsZW1lbnQ7XHJcblx0XHR2YXIgYXJncyA9IG0ucm91dGUubW9kZSA9PT0gXCJwYXRobmFtZVwiICYmIGN1cnJlbnRUYXJnZXQuc2VhcmNoID8gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50VGFyZ2V0LnNlYXJjaC5zbGljZSgxKSkgOiB7fTtcclxuXHRcdHdoaWxlIChjdXJyZW50VGFyZ2V0ICYmIGN1cnJlbnRUYXJnZXQubm9kZU5hbWUudG9VcHBlckNhc2UoKSAhPSBcIkFcIikgY3VycmVudFRhcmdldCA9IGN1cnJlbnRUYXJnZXQucGFyZW50Tm9kZVxyXG5cdFx0bS5yb3V0ZShjdXJyZW50VGFyZ2V0W20ucm91dGUubW9kZV0uc2xpY2UobW9kZXNbbS5yb3V0ZS5tb2RlXS5sZW5ndGgpLCBhcmdzKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBzZXRTY3JvbGwoKSB7XHJcblx0XHRpZiAobS5yb3V0ZS5tb2RlICE9IFwiaGFzaFwiICYmICRsb2NhdGlvbi5oYXNoKSAkbG9jYXRpb24uaGFzaCA9ICRsb2NhdGlvbi5oYXNoO1xyXG5cdFx0ZWxzZSB3aW5kb3cuc2Nyb2xsVG8oMCwgMClcclxuXHR9XHJcblx0ZnVuY3Rpb24gYnVpbGRRdWVyeVN0cmluZyhvYmplY3QsIHByZWZpeCkge1xyXG5cdFx0dmFyIGR1cGxpY2F0ZXMgPSB7fVxyXG5cdFx0dmFyIHN0ciA9IFtdXHJcblx0XHRmb3IgKHZhciBwcm9wIGluIG9iamVjdCkge1xyXG5cdFx0XHR2YXIga2V5ID0gcHJlZml4ID8gcHJlZml4ICsgXCJbXCIgKyBwcm9wICsgXCJdXCIgOiBwcm9wXHJcblx0XHRcdHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wXVxyXG5cdFx0XHR2YXIgdmFsdWVUeXBlID0gdHlwZS5jYWxsKHZhbHVlKVxyXG5cdFx0XHR2YXIgcGFpciA9ICh2YWx1ZSA9PT0gbnVsbCkgPyBlbmNvZGVVUklDb21wb25lbnQoa2V5KSA6XHJcblx0XHRcdFx0dmFsdWVUeXBlID09PSBPQkpFQ1QgPyBidWlsZFF1ZXJ5U3RyaW5nKHZhbHVlLCBrZXkpIDpcclxuXHRcdFx0XHR2YWx1ZVR5cGUgPT09IEFSUkFZID8gdmFsdWUucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIGl0ZW0pIHtcclxuXHRcdFx0XHRcdGlmICghZHVwbGljYXRlc1trZXldKSBkdXBsaWNhdGVzW2tleV0gPSB7fVxyXG5cdFx0XHRcdFx0aWYgKCFkdXBsaWNhdGVzW2tleV1baXRlbV0pIHtcclxuXHRcdFx0XHRcdFx0ZHVwbGljYXRlc1trZXldW2l0ZW1dID0gdHJ1ZVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gbWVtby5jb25jYXQoZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudChpdGVtKSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdHJldHVybiBtZW1vXHJcblx0XHRcdFx0fSwgW10pLmpvaW4oXCImXCIpIDpcclxuXHRcdFx0XHRlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKVxyXG5cdFx0XHRpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkgc3RyLnB1c2gocGFpcilcclxuXHRcdH1cclxuXHRcdHJldHVybiBzdHIuam9pbihcIiZcIilcclxuXHR9XHJcblx0ZnVuY3Rpb24gcGFyc2VRdWVyeVN0cmluZyhzdHIpIHtcclxuXHRcdGlmIChzdHIuY2hhckF0KDApID09PSBcIj9cIikgc3RyID0gc3RyLnN1YnN0cmluZygxKTtcclxuXHRcdFxyXG5cdFx0dmFyIHBhaXJzID0gc3RyLnNwbGl0KFwiJlwiKSwgcGFyYW1zID0ge307XHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gcGFpcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0dmFyIHBhaXIgPSBwYWlyc1tpXS5zcGxpdChcIj1cIik7XHJcblx0XHRcdHZhciBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQocGFpclswXSlcclxuXHRcdFx0dmFyIHZhbHVlID0gcGFpci5sZW5ndGggPT0gMiA/IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKSA6IG51bGxcclxuXHRcdFx0aWYgKHBhcmFtc1trZXldICE9IG51bGwpIHtcclxuXHRcdFx0XHRpZiAodHlwZS5jYWxsKHBhcmFtc1trZXldKSAhPT0gQVJSQVkpIHBhcmFtc1trZXldID0gW3BhcmFtc1trZXldXVxyXG5cdFx0XHRcdHBhcmFtc1trZXldLnB1c2godmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBwYXJhbXNba2V5XSA9IHZhbHVlXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcGFyYW1zXHJcblx0fVxyXG5cdG0ucm91dGUuYnVpbGRRdWVyeVN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmdcclxuXHRtLnJvdXRlLnBhcnNlUXVlcnlTdHJpbmcgPSBwYXJzZVF1ZXJ5U3RyaW5nXHJcblx0XHJcblx0ZnVuY3Rpb24gcmVzZXQocm9vdCkge1xyXG5cdFx0dmFyIGNhY2hlS2V5ID0gZ2V0Q2VsbENhY2hlS2V5KHJvb3QpO1xyXG5cdFx0Y2xlYXIocm9vdC5jaGlsZE5vZGVzLCBjZWxsQ2FjaGVbY2FjaGVLZXldKTtcclxuXHRcdGNlbGxDYWNoZVtjYWNoZUtleV0gPSB1bmRlZmluZWRcclxuXHR9XHJcblxyXG5cdG0uZGVmZXJyZWQgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuXHRcdGRlZmVycmVkLnByb21pc2UgPSBwcm9waWZ5KGRlZmVycmVkLnByb21pc2UpO1xyXG5cdFx0cmV0dXJuIGRlZmVycmVkXHJcblx0fTtcclxuXHRmdW5jdGlvbiBwcm9waWZ5KHByb21pc2UsIGluaXRpYWxWYWx1ZSkge1xyXG5cdFx0dmFyIHByb3AgPSBtLnByb3AoaW5pdGlhbFZhbHVlKTtcclxuXHRcdHByb21pc2UudGhlbihwcm9wKTtcclxuXHRcdHByb3AudGhlbiA9IGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG5cdFx0XHRyZXR1cm4gcHJvcGlmeShwcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KSwgaW5pdGlhbFZhbHVlKVxyXG5cdFx0fTtcclxuXHRcdHJldHVybiBwcm9wXHJcblx0fVxyXG5cdC8vUHJvbWl6Lm1pdGhyaWwuanMgfCBab2xtZWlzdGVyIHwgTUlUXHJcblx0Ly9hIG1vZGlmaWVkIHZlcnNpb24gb2YgUHJvbWl6LmpzLCB3aGljaCBkb2VzIG5vdCBjb25mb3JtIHRvIFByb21pc2VzL0ErIGZvciB0d28gcmVhc29uczpcclxuXHQvLzEpIGB0aGVuYCBjYWxsYmFja3MgYXJlIGNhbGxlZCBzeW5jaHJvbm91c2x5IChiZWNhdXNlIHNldFRpbWVvdXQgaXMgdG9vIHNsb3csIGFuZCB0aGUgc2V0SW1tZWRpYXRlIHBvbHlmaWxsIGlzIHRvbyBiaWdcclxuXHQvLzIpIHRocm93aW5nIHN1YmNsYXNzZXMgb2YgRXJyb3IgY2F1c2UgdGhlIGVycm9yIHRvIGJlIGJ1YmJsZWQgdXAgaW5zdGVhZCBvZiB0cmlnZ2VyaW5nIHJlamVjdGlvbiAoYmVjYXVzZSB0aGUgc3BlYyBkb2VzIG5vdCBhY2NvdW50IGZvciB0aGUgaW1wb3J0YW50IHVzZSBjYXNlIG9mIGRlZmF1bHQgYnJvd3NlciBlcnJvciBoYW5kbGluZywgaS5lLiBtZXNzYWdlIHcvIGxpbmUgbnVtYmVyKVxyXG5cdGZ1bmN0aW9uIERlZmVycmVkKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XHJcblx0XHR2YXIgUkVTT0xWSU5HID0gMSwgUkVKRUNUSU5HID0gMiwgUkVTT0xWRUQgPSAzLCBSRUpFQ1RFRCA9IDQ7XHJcblx0XHR2YXIgc2VsZiA9IHRoaXMsIHN0YXRlID0gMCwgcHJvbWlzZVZhbHVlID0gMCwgbmV4dCA9IFtdO1xyXG5cclxuXHRcdHNlbGZbXCJwcm9taXNlXCJdID0ge307XHJcblxyXG5cdFx0c2VsZltcInJlc29sdmVcIl0gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkc7XHJcblxyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9O1xyXG5cclxuXHRcdHNlbGZbXCJyZWplY3RcIl0gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblxyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9O1xyXG5cclxuXHRcdHNlbGYucHJvbWlzZVtcInRoZW5cIl0gPSBmdW5jdGlvbihzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaykge1xyXG5cdFx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spO1xyXG5cdFx0XHRpZiAoc3RhdGUgPT09IFJFU09MVkVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoc3RhdGUgPT09IFJFSkVDVEVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRuZXh0LnB1c2goZGVmZXJyZWQpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHRcdH07XHJcblxyXG5cdFx0ZnVuY3Rpb24gZmluaXNoKHR5cGUpIHtcclxuXHRcdFx0c3RhdGUgPSB0eXBlIHx8IFJFSkVDVEVEO1xyXG5cdFx0XHRuZXh0Lm1hcChmdW5jdGlvbihkZWZlcnJlZCkge1xyXG5cdFx0XHRcdHN0YXRlID09PSBSRVNPTFZFRCAmJiBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSkgfHwgZGVmZXJyZWQucmVqZWN0KHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiB0aGVubmFibGUodGhlbiwgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2ssIG5vdFRoZW5uYWJsZUNhbGxiYWNrKSB7XHJcblx0XHRcdGlmICgoKHByb21pc2VWYWx1ZSAhPSBudWxsICYmIHR5cGUuY2FsbChwcm9taXNlVmFsdWUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBwcm9taXNlVmFsdWUgPT09IEZVTkNUSU9OKSAmJiB0eXBlb2YgdGhlbiA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly8gY291bnQgcHJvdGVjdHMgYWdhaW5zdCBhYnVzZSBjYWxscyBmcm9tIHNwZWMgY2hlY2tlclxyXG5cdFx0XHRcdFx0dmFyIGNvdW50ID0gMDtcclxuXHRcdFx0XHRcdHRoZW4uY2FsbChwcm9taXNlVmFsdWUsIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb3VudCsrKSByZXR1cm47XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRzdWNjZXNzQ2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb3VudCsrKSByZXR1cm47XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRmYWlsdXJlQ2FsbGJhY2soKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0XHRmYWlsdXJlQ2FsbGJhY2soKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRub3RUaGVubmFibGVDYWxsYmFjaygpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBmaXJlKCkge1xyXG5cdFx0XHQvLyBjaGVjayBpZiBpdCdzIGEgdGhlbmFibGVcclxuXHRcdFx0dmFyIHRoZW47XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0dGhlbiA9IHByb21pc2VWYWx1ZSAmJiBwcm9taXNlVmFsdWUudGhlblxyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblx0XHRcdFx0cmV0dXJuIGZpcmUoKVxyXG5cdFx0XHR9XHJcblx0XHRcdHRoZW5uYWJsZSh0aGVuLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklORztcclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0c3RhdGUgPSBSRUpFQ1RJTkc7XHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH0sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRpZiAoc3RhdGUgPT09IFJFU09MVklORyAmJiB0eXBlb2Ygc3VjY2Vzc0NhbGxiYWNrID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBzdWNjZXNzQ2FsbGJhY2socHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoc3RhdGUgPT09IFJFSkVDVElORyAmJiB0eXBlb2YgZmFpbHVyZUNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZmFpbHVyZUNhbGxiYWNrKHByb21pc2VWYWx1ZSk7XHJcblx0XHRcdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlO1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCgpXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAocHJvbWlzZVZhbHVlID09PSBzZWxmKSB7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBUeXBlRXJyb3IoKTtcclxuXHRcdFx0XHRcdGZpbmlzaCgpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSwgZmluaXNoLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGZpbmlzaChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0fVxyXG5cdG0uZGVmZXJyZWQub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdGlmICh0eXBlLmNhbGwoZSkgPT09IFwiW29iamVjdCBFcnJvcl1cIiAmJiAhZS5jb25zdHJ1Y3Rvci50b1N0cmluZygpLm1hdGNoKC8gRXJyb3IvKSkgdGhyb3cgZVxyXG5cdH07XHJcblxyXG5cdG0uc3luYyA9IGZ1bmN0aW9uKGFyZ3MpIHtcclxuXHRcdHZhciBtZXRob2QgPSBcInJlc29sdmVcIjtcclxuXHRcdGZ1bmN0aW9uIHN5bmNocm9uaXplcihwb3MsIHJlc29sdmVkKSB7XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xyXG5cdFx0XHRcdHJlc3VsdHNbcG9zXSA9IHZhbHVlO1xyXG5cdFx0XHRcdGlmICghcmVzb2x2ZWQpIG1ldGhvZCA9IFwicmVqZWN0XCI7XHJcblx0XHRcdFx0aWYgKC0tb3V0c3RhbmRpbmcgPT09IDApIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnByb21pc2UocmVzdWx0cyk7XHJcblx0XHRcdFx0XHRkZWZlcnJlZFttZXRob2RdKHJlc3VsdHMpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiB2YWx1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGRlZmVycmVkID0gbS5kZWZlcnJlZCgpO1xyXG5cdFx0dmFyIG91dHN0YW5kaW5nID0gYXJncy5sZW5ndGg7XHJcblx0XHR2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShvdXRzdGFuZGluZyk7XHJcblx0XHRpZiAoYXJncy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGFyZ3NbaV0udGhlbihzeW5jaHJvbml6ZXIoaSwgdHJ1ZSksIHN5bmNocm9uaXplcihpLCBmYWxzZSkpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2UgZGVmZXJyZWQucmVzb2x2ZShbXSk7XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7cmV0dXJuIHZhbHVlfVxyXG5cclxuXHRmdW5jdGlvbiBhamF4KG9wdGlvbnMpIHtcclxuXHRcdGlmIChvcHRpb25zLmRhdGFUeXBlICYmIG9wdGlvbnMuZGF0YVR5cGUudG9Mb3dlckNhc2UoKSA9PT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHZhciBjYWxsYmFja0tleSA9IFwibWl0aHJpbF9jYWxsYmFja19cIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgXCJfXCIgKyAoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMWUxNikpLnRvU3RyaW5nKDM2KTtcclxuXHRcdFx0dmFyIHNjcmlwdCA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO1xyXG5cclxuXHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IGZ1bmN0aW9uKHJlc3ApIHtcclxuXHRcdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xyXG5cdFx0XHRcdG9wdGlvbnMub25sb2FkKHtcclxuXHRcdFx0XHRcdHR5cGU6IFwibG9hZFwiLFxyXG5cdFx0XHRcdFx0dGFyZ2V0OiB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogcmVzcFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHdpbmRvd1tjYWxsYmFja0tleV0gPSB1bmRlZmluZWRcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcblxyXG5cdFx0XHRcdG9wdGlvbnMub25lcnJvcih7XHJcblx0XHRcdFx0XHR0eXBlOiBcImVycm9yXCIsXHJcblx0XHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdFx0c3RhdHVzOiA1MDAsXHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogSlNPTi5zdHJpbmdpZnkoe2Vycm9yOiBcIkVycm9yIG1ha2luZyBqc29ucCByZXF1ZXN0XCJ9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHdpbmRvd1tjYWxsYmFja0tleV0gPSB1bmRlZmluZWQ7XHJcblxyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHNjcmlwdC5zcmMgPSBvcHRpb25zLnVybFxyXG5cdFx0XHRcdCsgKG9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpID4gMCA/IFwiJlwiIDogXCI/XCIpXHJcblx0XHRcdFx0KyAob3B0aW9ucy5jYWxsYmFja0tleSA/IG9wdGlvbnMuY2FsbGJhY2tLZXkgOiBcImNhbGxiYWNrXCIpXHJcblx0XHRcdFx0KyBcIj1cIiArIGNhbGxiYWNrS2V5XHJcblx0XHRcdFx0KyBcIiZcIiArIGJ1aWxkUXVlcnlTdHJpbmcob3B0aW9ucy5kYXRhIHx8IHt9KTtcclxuXHRcdFx0JGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHZhciB4aHIgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0O1xyXG5cdFx0XHR4aHIub3BlbihvcHRpb25zLm1ldGhvZCwgb3B0aW9ucy51cmwsIHRydWUsIG9wdGlvbnMudXNlciwgb3B0aW9ucy5wYXNzd29yZCk7XHJcblx0XHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcclxuXHRcdFx0XHRcdGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSBvcHRpb25zLm9ubG9hZCh7dHlwZTogXCJsb2FkXCIsIHRhcmdldDogeGhyfSk7XHJcblx0XHRcdFx0XHRlbHNlIG9wdGlvbnMub25lcnJvcih7dHlwZTogXCJlcnJvclwiLCB0YXJnZXQ6IHhocn0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRpZiAob3B0aW9ucy5zZXJpYWxpemUgPT09IEpTT04uc3RyaW5naWZ5ICYmIG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLm1ldGhvZCAhPT0gXCJHRVRcIikge1xyXG5cdFx0XHRcdHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChvcHRpb25zLmRlc2VyaWFsaXplID09PSBKU09OLnBhcnNlKSB7XHJcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJBY2NlcHRcIiwgXCJhcHBsaWNhdGlvbi9qc29uLCB0ZXh0LypcIik7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLmNvbmZpZyA9PT0gRlVOQ1RJT04pIHtcclxuXHRcdFx0XHR2YXIgbWF5YmVYaHIgPSBvcHRpb25zLmNvbmZpZyh4aHIsIG9wdGlvbnMpO1xyXG5cdFx0XHRcdGlmIChtYXliZVhociAhPSBudWxsKSB4aHIgPSBtYXliZVhoclxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgZGF0YSA9IG9wdGlvbnMubWV0aG9kID09PSBcIkdFVFwiIHx8ICFvcHRpb25zLmRhdGEgPyBcIlwiIDogb3B0aW9ucy5kYXRhXHJcblx0XHRcdGlmIChkYXRhICYmICh0eXBlLmNhbGwoZGF0YSkgIT0gU1RSSU5HICYmIGRhdGEuY29uc3RydWN0b3IgIT0gd2luZG93LkZvcm1EYXRhKSkge1xyXG5cdFx0XHRcdHRocm93IFwiUmVxdWVzdCBkYXRhIHNob3VsZCBiZSBlaXRoZXIgYmUgYSBzdHJpbmcgb3IgRm9ybURhdGEuIENoZWNrIHRoZSBgc2VyaWFsaXplYCBvcHRpb24gaW4gYG0ucmVxdWVzdGBcIjtcclxuXHRcdFx0fVxyXG5cdFx0XHR4aHIuc2VuZChkYXRhKTtcclxuXHRcdFx0cmV0dXJuIHhoclxyXG5cdFx0fVxyXG5cdH1cclxuXHRmdW5jdGlvbiBiaW5kRGF0YSh4aHJPcHRpb25zLCBkYXRhLCBzZXJpYWxpemUpIHtcclxuXHRcdGlmICh4aHJPcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiAmJiB4aHJPcHRpb25zLmRhdGFUeXBlICE9IFwianNvbnBcIikge1xyXG5cdFx0XHR2YXIgcHJlZml4ID0geGhyT3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPCAwID8gXCI/XCIgOiBcIiZcIjtcclxuXHRcdFx0dmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhkYXRhKTtcclxuXHRcdFx0eGhyT3B0aW9ucy51cmwgPSB4aHJPcHRpb25zLnVybCArIChxdWVyeXN0cmluZyA/IHByZWZpeCArIHF1ZXJ5c3RyaW5nIDogXCJcIilcclxuXHRcdH1cclxuXHRcdGVsc2UgeGhyT3B0aW9ucy5kYXRhID0gc2VyaWFsaXplKGRhdGEpO1xyXG5cdFx0cmV0dXJuIHhock9wdGlvbnNcclxuXHR9XHJcblx0ZnVuY3Rpb24gcGFyYW1ldGVyaXplVXJsKHVybCwgZGF0YSkge1xyXG5cdFx0dmFyIHRva2VucyA9IHVybC5tYXRjaCgvOlthLXpdXFx3Ky9naSk7XHJcblx0XHRpZiAodG9rZW5zICYmIGRhdGEpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHR2YXIga2V5ID0gdG9rZW5zW2ldLnNsaWNlKDEpO1xyXG5cdFx0XHRcdHVybCA9IHVybC5yZXBsYWNlKHRva2Vuc1tpXSwgZGF0YVtrZXldKTtcclxuXHRcdFx0XHRkZWxldGUgZGF0YVtrZXldXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiB1cmxcclxuXHR9XHJcblxyXG5cdG0ucmVxdWVzdCA9IGZ1bmN0aW9uKHhock9wdGlvbnMpIHtcclxuXHRcdGlmICh4aHJPcHRpb25zLmJhY2tncm91bmQgIT09IHRydWUpIG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKCk7XHJcblx0XHR2YXIgaXNKU09OUCA9IHhock9wdGlvbnMuZGF0YVR5cGUgJiYgeGhyT3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCI7XHJcblx0XHR2YXIgc2VyaWFsaXplID0geGhyT3B0aW9ucy5zZXJpYWxpemUgPSBpc0pTT05QID8gaWRlbnRpdHkgOiB4aHJPcHRpb25zLnNlcmlhbGl6ZSB8fCBKU09OLnN0cmluZ2lmeTtcclxuXHRcdHZhciBkZXNlcmlhbGl6ZSA9IHhock9wdGlvbnMuZGVzZXJpYWxpemUgPSBpc0pTT05QID8gaWRlbnRpdHkgOiB4aHJPcHRpb25zLmRlc2VyaWFsaXplIHx8IEpTT04ucGFyc2U7XHJcblx0XHR2YXIgZXh0cmFjdCA9IGlzSlNPTlAgPyBmdW5jdGlvbihqc29ucCkge3JldHVybiBqc29ucC5yZXNwb25zZVRleHR9IDogeGhyT3B0aW9ucy5leHRyYWN0IHx8IGZ1bmN0aW9uKHhocikge1xyXG5cdFx0XHRyZXR1cm4geGhyLnJlc3BvbnNlVGV4dC5sZW5ndGggPT09IDAgJiYgZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UgPyBudWxsIDogeGhyLnJlc3BvbnNlVGV4dFxyXG5cdFx0fTtcclxuXHRcdHhock9wdGlvbnMubWV0aG9kID0gKHhock9wdGlvbnMubWV0aG9kIHx8ICdHRVQnKS50b1VwcGVyQ2FzZSgpO1xyXG5cdFx0eGhyT3B0aW9ucy51cmwgPSBwYXJhbWV0ZXJpemVVcmwoeGhyT3B0aW9ucy51cmwsIHhock9wdGlvbnMuZGF0YSk7XHJcblx0XHR4aHJPcHRpb25zID0gYmluZERhdGEoeGhyT3B0aW9ucywgeGhyT3B0aW9ucy5kYXRhLCBzZXJpYWxpemUpO1xyXG5cdFx0eGhyT3B0aW9ucy5vbmxvYWQgPSB4aHJPcHRpb25zLm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0ZSA9IGUgfHwgZXZlbnQ7XHJcblx0XHRcdFx0dmFyIHVud3JhcCA9IChlLnR5cGUgPT09IFwibG9hZFwiID8geGhyT3B0aW9ucy51bndyYXBTdWNjZXNzIDogeGhyT3B0aW9ucy51bndyYXBFcnJvcikgfHwgaWRlbnRpdHk7XHJcblx0XHRcdFx0dmFyIHJlc3BvbnNlID0gdW53cmFwKGRlc2VyaWFsaXplKGV4dHJhY3QoZS50YXJnZXQsIHhock9wdGlvbnMpKSwgZS50YXJnZXQpO1xyXG5cdFx0XHRcdGlmIChlLnR5cGUgPT09IFwibG9hZFwiKSB7XHJcblx0XHRcdFx0XHRpZiAodHlwZS5jYWxsKHJlc3BvbnNlKSA9PT0gQVJSQVkgJiYgeGhyT3B0aW9ucy50eXBlKSB7XHJcblx0XHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcmVzcG9uc2UubGVuZ3RoOyBpKyspIHJlc3BvbnNlW2ldID0gbmV3IHhock9wdGlvbnMudHlwZShyZXNwb25zZVtpXSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2UgaWYgKHhock9wdGlvbnMudHlwZSkgcmVzcG9uc2UgPSBuZXcgeGhyT3B0aW9ucy50eXBlKHJlc3BvbnNlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRkZWZlcnJlZFtlLnR5cGUgPT09IFwibG9hZFwiID8gXCJyZXNvbHZlXCIgOiBcInJlamVjdFwiXShyZXNwb25zZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QoZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoeGhyT3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLmVuZENvbXB1dGF0aW9uKClcclxuXHRcdH07XHJcblx0XHRhamF4KHhock9wdGlvbnMpO1xyXG5cdFx0ZGVmZXJyZWQucHJvbWlzZSA9IHByb3BpZnkoZGVmZXJyZWQucHJvbWlzZSwgeGhyT3B0aW9ucy5pbml0aWFsVmFsdWUpO1xyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHR9O1xyXG5cclxuXHQvL3Rlc3RpbmcgQVBJXHJcblx0bS5kZXBzID0gZnVuY3Rpb24obW9jaykge1xyXG5cdFx0aW5pdGlhbGl6ZSh3aW5kb3cgPSBtb2NrIHx8IHdpbmRvdyk7XHJcblx0XHRyZXR1cm4gd2luZG93O1xyXG5cdH07XHJcblx0Ly9mb3IgaW50ZXJuYWwgdGVzdGluZyBvbmx5LCBkbyBub3QgdXNlIGBtLmRlcHMuZmFjdG9yeWBcclxuXHRtLmRlcHMuZmFjdG9yeSA9IGFwcDtcclxuXHJcblx0cmV0dXJuIG1cclxufSkodHlwZW9mIHdpbmRvdyAhPSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pO1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUgIT09IG51bGwgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gbTtcclxuZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIGRlZmluZShmdW5jdGlvbigpIHtyZXR1cm4gbX0pO1xyXG4iXX0=
