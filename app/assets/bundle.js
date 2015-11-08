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
  attack: ['fight', 'punch', 'bite', 'intervene', 'protect', 'bludgeon', 'act'],
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
      return m('#container', {
        style: {
          position: 'absolute',
          width: '956px',
          height: '636px',
          overflow: 'hidden',
          border: '2px solid #25A5FF',
          marginTop: (-636 / 2) + 'px',
          top: '50%',
          left: '50%',
          marginLeft: (-956 / 2) + 'px'
        }
      }, m('a[href=#]', {
        style: {
          position: 'absolute',
          top: '2px',
          right: '4px',
          color: 'black',
          fontSize: '10px',
          zIndex: 100
        },
        onclick: function(e) {
          e.preventDefault();
          if (confirm('Are you sure you want to restart the game? This will clear all progress and items you have achieved so far.')) {
            localStorage.clear();
            return window.location.href = '';
          }
        }
      }, 'Restart game'), m('.sidebar', {
        style: {
          position: 'absolute',
          right: 0,
          top: 0,
          height: '596px',
          width: '220px',
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
              results.push(m('p.inventory-item', ITEM_NAMES[item]));
            } else if (state === 'used') {
              results.push(m('p.inventory-item', {
                style: {
                  textDecoration: 'line-through'
                }
              }, ITEM_NAMES[item]));
            } else {
              results.push(void 0);
            }
          }
          return results;
        })()
      ]), m('.content', {
        style: {
          position: 'absolute',
          width: 656. + 'px',
          height: '640px',
          backgroundColor: 'white',
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
        style: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '134px',
          padding: '20px'
        },
        onsubmit: ctrl.onCommandSubmit
      }, m('input[type=text][id=command-input]', {
        style: {
          display: 'block',
          width: '630px'
        },
        placeholder: 'Type commands here.',
        onchange: m.withAttr('value', ctrl.vm.command),
        value: ctrl.vm.command(),
        config: function(element, isInitialized, context) {
          if (!isInitialized) {
            return element.focus();
          }
        }
      }), m('button[type=submit]', {
        style: {
          position: 'absolute',
          right: '10px',
          top: '20px'
        }
      }, 'do'), m('div', m('button.bottom-button[type=button]', {
        onclick: function(e) {
          return ctrl.handleButton('get');
        }
      }, 'get'), m('button.bottom-button[type=button]', {
        onclick: function(e) {
          return ctrl.handleButton('talk');
        }
      }, 'talk'), m('button.bottom-button[type=button]', {
        onclick: function(e) {
          return ctrl.handleButton('use');
        }
      }, 'use'), m('button.bottom-button[type=button]', {
        onclick: function(e) {
          return ctrl.handleButton('look');
        }
      }, 'look')), m('div', {
        style: {
          width: '214px',
          height: '170px',
          position: 'absolute',
          right: '-250px',
          bottom: '44px'
        }
      }, m('button.compass-button[type=button]', {
        style: {
          top: 0,
          left: '55px'
        },
        onclick: function(e) {
          return ctrl.handleButton('go north');
        }
      }, 'go north'), m('button.compass-button[type=button]', {
        style: {
          top: '120px',
          left: '55px'
        },
        onclick: function(e) {
          return ctrl.handleButton('go south');
        }
      }, 'go south'), m('button.compass-button[type=button]', {
        style: {
          top: '60px',
          right: 0
        },
        onclick: function(e) {
          return ctrl.handleButton('go east');
        }
      }, 'go east'), m('button.compass-button[type=button]', {
        style: {
          top: '60px',
          left: 0
        },
        onclick: function(e) {
          return ctrl.handleButton('go west');
        }
      }, 'go west')))));
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
      return this.goToRoom('Wale (With Ethereal Door right there!)');
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
  engine.addRoom('Wale (With Ethereal Door right there!)', function() {
    if (this.matches('enter door') || this.matches('go door')) {
      return this.goToRoom('The Ethereal Realm');
    } else if (this.exactlyMatches('look') || this.matches('go')) {
      return this.print('The ethereal beckons you come forward.');
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
        return this.print('This is what is left of the Steak and Shake building you used to work at before your friend exploded it trying to make firework sandwiches. Cuttlefish stomping grounds lie east.');
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
      this.setFlag('have_all_items', false);
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
    } else if (this.matches('syrup') || this.matches('maple')) {
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
    } else {
      return this.tryUniversalCommands();
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
    } else {
      return this.tryUniversalCommands();
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
    } else {
      return this.tryUniversalCommands();
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
    if (this.exactlyMatches('__enter_room__')) {
      return this.print('You have entered The Ethereal Realm. Why did you do that? That was a bad decision. Wale is at your side. There are a bunch of weird, spacey platforms and junk floating around in a cosmic void -- your typical surrealist dreamscape environment. Ahead is an ugly monster. He is clutching something in his hand. Obvious exits are NONE! This is the world of waking nightmares you dingus.');
    } else if (this.exactlyMatches('look')) {
      return this.print('This place is definitely awful. That monster up ahead looks suspicious.');
    } else if (this.matches('look hand') || this.matches('look something')) {
      return this.print('It looks like some kind of cylindric plastic container. Hard to make out from here though.');
    } else if (this.matches('look monster')) {
      return this.print('The monster sure is ugly.');
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
      this.print('You swim up to engage the monster, but Wale pushes you out of the way in a charge himself. You cringe as you hear the slashing of flesh. Red mist floats out of Wale\'s side. Your head is spinning.');
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
  return engine.setStartRoom('Wale (With Ethereal Door right there!)');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kdmNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9hcHAvZW5naW5lLmNvZmZlZSIsIi9ob21lL2R2Y29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9tYWluLmNvZmZlZSIsIi9ob21lL2R2Y29sZ2FuL3Byb2plY3RzL3dhbGV2c3NoYXJjL2FwcC9zeW5vbnltcy5jb2ZmZWUiLCIvaG9tZS9kdmNvbGdhbi9wcm9qZWN0cy93YWxldnNzaGFyYy9ub2RlX21vZHVsZXMvYXBwL3ZpZXcuY29mZmVlIiwiL2hvbWUvZHZjb2xnYW4vcHJvamVjdHMvd2FsZXZzc2hhcmMvbm9kZV9tb2R1bGVzL2FwcC93YWxldnNzaGFyYy5jb2ZmZWUiLCJub2RlX21vZHVsZXMvbWl0aHJpbC9taXRocmlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxtQkFBQTtFQUFBOztBQUFBLFdBQUEsR0FBYyxPQUFBLENBQVEsWUFBUjs7QUFHZCxNQUFNLENBQUMsT0FBUCxHQUF1QjtFQUNOLGdCQUFBO0lBQ1QsSUFBQyxDQUFBLEtBQUQsR0FBUztJQUNULElBQUMsQ0FBQSxpQkFBRCxHQUFxQixTQUFBLEdBQUE7SUFDckIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsU0FBQSxHQUFBO0lBRWhCLElBQUMsQ0FBQSxTQUFELEdBQWE7SUFDYixJQUFDLENBQUEsZUFBRCxHQUFtQjtJQUNuQixJQUFDLENBQUEsS0FBRCxHQUFTO0lBQ1QsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFFaEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7SUFDaEIsSUFBQyxDQUFBLFdBQUQsR0FBZTtJQUNmLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFFWCxJQUFDLENBQUEsU0FBRCxHQUFhO0lBQ2IsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQUNiLElBQUMsQ0FBQSxRQUFE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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwic3lub255bURhdGEgPSByZXF1aXJlKCcuL3N5bm9ueW1zJylcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEVuZ2luZVxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAcm9vbXMgPSB7fVxuICAgICAgICBAdW5pdmVyc2FsQ29tbWFuZHMgPSAtPlxuICAgICAgICBAYWZ0ZXJDb21tYW5kID0gLT5cblxuICAgICAgICBAaW52ZW50b3J5ID0ge31cbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9ICcnXG4gICAgICAgIEBmbGFncyA9IHt9XG4gICAgICAgIEByb29tc0VudGVyZWQgPSB7fVxuXG4gICAgICAgIEBjb21tYW5kV29yZHMgPSBbXVxuICAgICAgICBAY29tbWFuZFRleHQgPSAnJ1xuICAgICAgICBAbWVzc2FnZSA9ICcnXG5cbiAgICAgICAgQGNhbGxiYWNrcyA9IFtdXG4gICAgICAgIEBzdGFydFJvb20gPSAnJ1xuICAgICAgICBAbGFzdFJvb20gPSAnJ1xuXG4gICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBudWxsXG4gICAgICAgIEBhbHJlYWR5R290dGVuTWVzc2FnZSA9ICcnXG5cbiAgICAgICAgQHByZXZpb3VzQ29tbWFuZHMgPSBbXVxuXG4gICAgc2V0U3RhcnRSb29tOiAocm9vbU5hbWUpIC0+XG4gICAgICAgIEBzdGFydFJvb20gPSByb29tTmFtZVxuXG4gICAgc2V0QWZ0ZXJDb21tYW5kOiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEBhZnRlckNvbW1hbmQgPSBjYWxsYmFjay5iaW5kKEApXG5cbiAgICBzZXRBbHJlYWR5R290dGVuTWVzc2FnZTogKG1zZykgLT5cbiAgICAgICAgQGFscmVhZHlHb3R0ZW5NZXNzYWdlID0gbXNnXG5cbiAgICBzYXZlOiAtPlxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSAncHJvZ3Jlc3MnLCBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBpbnZlbnRvcnk6IEBpbnZlbnRvcnlcbiAgICAgICAgICAgIGN1cnJlbnRSb29tTmFtZTogQGN1cnJlbnRSb29tTmFtZVxuICAgICAgICAgICAgcHJldmlvdXNDb21tYW5kczogQHByZXZpb3VzQ29tbWFuZHNcbiAgICAgICAgICAgIGZsYWdzOiBAZmxhZ3NcbiAgICAgICAgICAgIHJvb21zRW50ZXJlZDogQHJvb21zRW50ZXJlZFxuICAgICAgICB9KVxuXG4gICAgbG9hZDogLT5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBkYXRhID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncHJvZ3Jlc3MnKSlcbiAgICAgICAgICAgIEBpbnZlbnRvcnkgPSBkYXRhLmludmVudG9yeVxuICAgICAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9IGRhdGEuY3VycmVudFJvb21OYW1lXG4gICAgICAgICAgICBAcHJldmlvdXNDb21tYW5kcyA9IGRhdGEucHJldmlvdXNDb21tYW5kcyBvciBbXVxuICAgICAgICAgICAgQGZsYWdzID0gZGF0YS5mbGFnc1xuICAgICAgICAgICAgQHJvb21zRW50ZXJlZCA9IGRhdGEucm9vbXNFbnRlcmVkXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBjYXRjaFxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuXG4gICAgYWRkUm9vbTogKHJvb21OYW1lLCBjYWxsYmFjaykgLT5cbiAgICAgICAgQHJvb21zW3Jvb21OYW1lXSA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIGdldEN1cnJlbnRSb29tTmFtZTogLT4gQGN1cnJlbnRSb29tTmFtZVxuXG4gICAgZ2V0Q3VycmVudE1lc3NhZ2U6IC0+IEBtZXNzYWdlXG5cbiAgICBnZXRJbnZlbnRvcnk6IC0+IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoQGludmVudG9yeSkpXG5cbiAgICBkb0NvbW1hbmQ6IChAY29tbWFuZFRleHQpIC0+XG5cbiAgICAgICAgaWYgQHdhaXRDYWxsYmFjaz9cbiAgICAgICAgICAgIGNhbGxiYWNrID0gQHdhaXRDYWxsYmFja1xuICAgICAgICAgICAgQHdhaXRDYWxsYmFjayA9IG51bGxcbiAgICAgICAgICAgIGNhbGxiYWNrKClcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGlmIEBjb21tYW5kVGV4dCA9PSAnJyB0aGVuIHJldHVyblxuXG4gICAgICAgIEBwcmV2aW91c0NvbW1hbmRzLnB1c2goQGNvbW1hbmRUZXh0KVxuXG4gICAgICAgICMgY2xlYW4gdXAgdGhlIGNvbW1hbmQgdGV4dFxuICAgICAgICBAY29tbWFuZFRleHQgPSAnICcgKyBAY29tbWFuZFRleHRcbiAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxXKy9nLCAnICcpXG4gICAgICAgICAgICAucmVwbGFjZSgvXFxzezIsfS9nLCAnICcpICsgJyAnXG5cbiAgICAgICAgIyBmaW5kIHN5bm9ueW1zIGFuZCByZXBsYWNlIHRoZW0gd2l0aCB0aGUgY2Fub25pY2FsIHdvcmRcbiAgICAgICAgZm9yIGNhbm5vbmljYWxXb3JkLCBzeW5vbnltcyBvZiBzeW5vbnltRGF0YVxuICAgICAgICAgICAgZm9yIHN5bm9ueW0gaW4gc3lub255bXNcbiAgICAgICAgICAgICAgICBAY29tbWFuZFRleHQgPSBAY29tbWFuZFRleHQucmVwbGFjZShcIiAje3N5bm9ueW19IFwiLCBcIiAje2Nhbm5vbmljYWxXb3JkfSBcIilcblxuICAgICAgICBAY29tbWFuZFRleHQgPSBAY29tbWFuZFRleHQudHJpbSgpXG5cbiAgICAgICAgQGNvbW1hbmRXb3JkcyA9IEBjb21tYW5kVGV4dC5zcGxpdCgnICcpXG5cbiAgICAgICAgaWYgJ3Rha2UnIGluIEBjb21tYW5kV29yZHNcbiAgICAgICAgICAgIGZvciB3b3JkIGluIEBjb21tYW5kV29yZHNcbiAgICAgICAgICAgICAgICBpZiBAaGFzSXRlbSh3b3JkKVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoQGFscmVhZHlHb3R0ZW5NZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBAcm9vbXNbQGN1cnJlbnRSb29tTmFtZV0oKVxuICAgICAgICBAYWZ0ZXJDb21tYW5kKClcblxuICAgIHNldFVuaXZlcnNhbENvbW1hbmRzOiAoY2FsbGJhY2spIC0+XG4gICAgICAgIEB1bml2ZXJzYWxDb21tYW5kcyA9IGNhbGxiYWNrLmJpbmQoQClcblxuICAgIHRyeVVuaXZlcnNhbENvbW1hbmRzOiAtPlxuICAgICAgICBAdW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZXhhY3RseU1hdGNoZXM6IChwYXR0ZXJuKSAtPlxuICAgICAgICBAY29tbWFuZFRleHQgPT0gcGF0dGVyblxuXG4gICAgbWF0Y2hlczogKHBhdHRlcm4pIC0+XG4gICAgICAgICMgSWYgZWFjaCB3b3JkIGluIHRoZSBzcGVjIGNvbW1hbmQgaXMgZm91bmRcbiAgICAgICAgIyBhbnl3aGVyZSBpbiB0aGUgdXNlcidzIGlucHV0IGl0J3MgYSBtYXRjaCxcbiAgICAgICAgIyBpbmNsdWRpbmcgc3Vic3RyaW5ncyBvZiB3b3Jkc1xuICAgICAgICBwYXR0ZXJuV29yZHMgPSBwYXR0ZXJuLnNwbGl0KCcgJylcbiAgICAgICAgZm9yIHBhdHRlcm5Xb3JkIGluIHBhdHRlcm5Xb3Jkc1xuICAgICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgICAgZm9yIGNvbW1hbmRXb3JkIGluIEBjb21tYW5kV29yZHNcbiAgICAgICAgICAgICAgICBpZiBwYXR0ZXJuV29yZC5zdGFydHNXaXRoKGNvbW1hbmRXb3JkKSBhbmQgKGNvbW1hbmRXb3JkLmxlbmd0aCA+PSA0IG9yIHBhdHRlcm5Xb3JkLmxlbmd0aCA8PSA0KVxuICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWVcbiAgICAgICAgICAgIGlmIG5vdCBmb3VuZFxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgaGFzSXRlbTogKGl0ZW0pIC0+IGl0ZW0gb2YgQGludmVudG9yeVxuICAgIHVzZWRJdGVtOiAoaXRlbSkgLT4gaXRlbSBvZiBAaW52ZW50b3J5IGFuZCBAaW52ZW50b3J5W2l0ZW1dID09ICd1c2VkJ1xuXG4gICAgcGVyY2VudENoYW5jZTogKGNoYW5jZSkgLT4gTWF0aC5yYW5kb20oKSA8IGNoYW5jZSAvIDEwMFxuXG4gICAgZmxhZ0lzOiAoZmxhZ05hbWUsIHZhbHVlKSAtPiBAZmxhZ3NbZmxhZ05hbWVdID09IHZhbHVlXG5cbiAgICBpc0ZpcnN0VGltZUVudGVyaW5nOiAtPiBAcm9vbXNFbnRlcmVkW0BjdXJyZW50Um9vbU5hbWVdID09IDFcblxuICAgIGNvbWluZ0Zyb206IChyb29tcykgLT4gQGxhc3RSb29tIGluIHJvb21zXG5cbiAgICBwcmludDogKHRleHQpIC0+XG4gICAgICAgIEBtZXNzYWdlID0gdGV4dFxuICAgICAgICBAbm90aWZ5KClcblxuICAgIGdvVG9Sb29tOiAocm9vbU5hbWUpIC0+XG4gICAgICAgIEBsYXN0Um9vbSA9IEBjdXJyZW50Um9vbU5hbWVcbiAgICAgICAgQGN1cnJlbnRSb29tTmFtZSA9IHJvb21OYW1lXG4gICAgICAgIGlmIHJvb21OYW1lIG9mIEByb29tc0VudGVyZWRcbiAgICAgICAgICAgIEByb29tc0VudGVyZWRbcm9vbU5hbWVdKytcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHJvb21zRW50ZXJlZFtyb29tTmFtZV0gPSAxXG4gICAgICAgIEBkb0NvbW1hbmQoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgQG5vdGlmeSgpXG5cbiAgICBnb1RvU3RhcnQ6IC0+XG4gICAgICAgIEBnb1RvUm9vbShAc3RhcnRSb29tKVxuXG4gICAgc2V0RmxhZzogKGZsYWdOYW1lLCB2YWx1ZSkgLT5cbiAgICAgICAgQGZsYWdzW2ZsYWdOYW1lXSA9IHZhbHVlXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgZ2V0SXRlbTogKGl0ZW0pIC0+XG4gICAgICAgIEBpbnZlbnRvcnlbaXRlbV0gPSAnZ290dGVuJ1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIHJlbW92ZUl0ZW06IChpdGVtKSAtPlxuICAgICAgICBkZWxldGUgQGludmVudG9yeVtpdGVtXVxuICAgICAgICBAbm90aWZ5KClcblxuICAgIHVzZUl0ZW06IChpdGVtKSAtPlxuICAgICAgICBAaW52ZW50b3J5W2l0ZW1dID0gJ3VzZWQnXG4gICAgICAgIEBub3RpZnkoKVxuXG4gICAgd2FpdDogKGNhbGxiYWNrKSAtPlxuICAgICAgICBAbWVzc2FnZSArPSAnIDxzdHJvbmc+KEhpdCBFbnRlcik8L3N0cm9uZz4nXG4gICAgICAgIEB3YWl0Q2FsbGJhY2sgPSBjYWxsYmFja1xuICAgICAgICBAbm90aWZ5KClcblxuICAgIGxpc3RlbjogKGNhbGxiYWNrKSAtPiBAY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spXG5cbiAgICBub3RpZnk6IC0+IGNhbGxiYWNrKCkgZm9yIGNhbGxiYWNrIGluIEBjYWxsYmFja3NcbiIsIm0gPSByZXF1aXJlKCdtaXRocmlsJylcbmVuZ2luZSA9IG5ldyhyZXF1aXJlKCcuL2VuZ2luZScpKSgpXG52aWV3ID0gcmVxdWlyZSgnYXBwL3ZpZXcnKShlbmdpbmUpXG5cblxubS5tb3VudChkb2N1bWVudC5ib2R5LCB2aWV3KVxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICAgIGxvb2s6IFtcbiAgICAgICAgJ3NlZSdcbiAgICAgICAgJ2FkbWlyZSdcbiAgICAgICAgJ2JlaG9sZCdcbiAgICAgICAgJ2dhd2snXG4gICAgICAgICdvYnNlcnZlJ1xuICAgICAgICAnc3B5J1xuICAgICAgICAnY2hlY2snXG4gICAgXVxuICAgIHRha2U6IFtcbiAgICAgICAgJ3BpY2sgdXAnXG4gICAgICAgICdnZXQnXG4gICAgICAgICdhY3F1aXJlJ1xuICAgICAgICAnZ3JhYidcbiAgICAgICAgJ2dyYXNwJ1xuICAgICAgICAnb2J0YWluJ1xuICAgICAgICAnYnV5J1xuICAgICAgICAnY2hvb3NlJ1xuICAgIF1cbiAgICBnbzogW1xuICAgICAgICAnd2FsaydcbiAgICAgICAgJ3BlcmFtYnVsYXRlJ1xuICAgICAgICAnbW92ZSdcbiAgICAgICAgJ3RyYXZlbCdcbiAgICAgICAgJ2pvdXJuZXknXG4gICAgICAgICdtb3NleSdcbiAgICBdXG4gICAgZ2l2ZTogW1xuICAgICAgICAnZGVsaXZlcidcbiAgICAgICAgJ2RvbmF0ZSdcbiAgICAgICAgJ2hhbmQgb3ZlcidcbiAgICAgICAgJ3ByZXNlbnQnXG4gICAgICAgICdlbmRvdydcbiAgICAgICAgJ2JlcXVlYXRoJ1xuICAgICAgICAnYmVzdG93J1xuICAgICAgICAncmVsaW5xdWlzaCdcbiAgICBdXG4gICAgZ2FyZGVuOiBbXG4gICAgICAgICdwbG90J1xuICAgICAgICAncGxhbnRzJ1xuICAgICAgICAncHJvZHVjZSdcbiAgICBdXG4gICAgZmxvd2VyOiBbXG4gICAgICAgICdmbG91cidcbiAgICBdXG4gICAgc29kYTogW1xuICAgICAgICAncG9wJ1xuICAgIF1cbiAgICBtYXJnYXJpbmU6IFtcbiAgICAgICAgJ2J1dHRlcidcbiAgICBdXG4gICAgc3RpcjogW1xuICAgICAgICAnd2hpcCdcbiAgICAgICAgJ3B1bHNlJ1xuICAgICAgICAndmlicmF0ZSdcbiAgICAgICAgJ21peCdcbiAgICAgICAgJ2JsZW5kJ1xuICAgICAgICAnYWdpdGF0ZSdcbiAgICAgICAgJ2NodXJuJ1xuICAgICAgICAnYmVhdCdcbiAgICBdXG4gICAgYXR0YWNrOiBbXG4gICAgICAgICdmaWdodCdcbiAgICAgICAgJ3B1bmNoJ1xuICAgICAgICAnYml0ZSdcbiAgICAgICAgJ2ludGVydmVuZSdcbiAgICAgICAgJ3Byb3RlY3QnXG4gICAgICAgICdibHVkZ2VvbidcbiAgICAgICAgJ2FjdCdcbiAgICBdXG4gICAgYmFkZ2U6IFtcbiAgICAgICAgJ3NoZXJpZmYnXG4gICAgICAgICdzdGlja2VyJ1xuICAgIF1cbiAgICBlbnRlcjogW1xuICAgICAgICAnaW4nXG4gICAgICAgICdpbnNpZGUnXG4gICAgXVxuICAgIGV4aXQ6IFtcbiAgICAgICAgJ2xlYXZlJ1xuICAgICAgICAnb3V0J1xuICAgICAgICAnb3V0c2lkZSdcbiAgICAgICAgJ3dpdGhkcmF3J1xuICAgICAgICAnZmxlZSdcbiAgICAgICAgJ2RlcGFydCdcbiAgICAgICAgJ2RlY2FtcCdcbiAgICBdXG4iLCJtID0gcmVxdWlyZSgnbWl0aHJpbCcpXG5XYWxlVnNTaGFyYyA9IHJlcXVpcmUoJ2FwcC93YWxldnNzaGFyYycpXG5cblxuU3RyaW5nLnByb3RvdHlwZS5jYXBpdGFsaXplID0gLT5cbiAgICBAWzBdLnRvVXBwZXJDYXNlKCkgKyBAWzEuLl1cblxuXG5JVEVNX05BTUVTID0ge1xuICAgIGVnZzogJ0VnZydcbiAgICBjdXR0bGVmaXNoOiAnQ3V0dGxlZmlzaCdcbiAgICBmbG93ZXJzOiAnRmxvd2VycydcbiAgICBzb2RhOiAnQmFraW5nIFNvZGEnXG4gICAgcGFuY2FrZXM6ICdQYW5jYWtlcydcbiAgICBzeXJ1cDogJ01hcGxlIFN5cnVwJ1xuICAgIG1hcmdhcmluZTogJ01hcmdhcmluZSdcbiAgICB1bWJyZWxsYTogJ1VtYnJlbGxhJ1xuICAgIGJhZGdlOiAnQmFkZ2UgU3RpY2tlcidcbiAgICBtaWxrOiAnTWFuYXRlZSBNaWxrJ1xuICAgICdyZWQgaGVycmluZyc6ICdSZWQgSGVycmluZydcbiAgICAnY293Ym95IGhhdCc6ICdDb3dib3kgSGF0J1xuICAgICdyYWluYm93IHdpZyc6ICdSYWluYm93IFdpZydcbiAgICAnbW90b3JjeWNsZSBoZWxtZXQnOiAnTW90b3JjeWNsZSBIZWxtZXQnXG4gICAgJ3N0b3ZlcGlwZSBoYXQnOiAnU3RvdmVwaXBlIEhhdCdcbiAgICAnbGVhdGhlciBqYWNrZXQnOiAnTGVhdGhlciBKYWNrZXQnXG4gICAgJ2Nsb3duIHN1aXQnOiAnQ2xvd24gU3VpdCdcbiAgICAnb2xkdGltZXkgc3VpdCc6ICdPbGQtVGltZXkgU3VpdCdcbiAgICAnY293IHByaW50IHZlc3QnOiAnQ293IFByaW50IFZlc3QnXG4gICAgJ2Zha2UgYmVhcmQnOiAnRmFrZSBCZWFyZCdcbiAgICAnZ3VuIGJlbHQnOiAnR3VuIEJlbHQnXG4gICAgJ21ldGFsIGNoYWluJzogJ01ldGFsIENoYWluJ1xuICAgICdydWJiZXIgY2hpY2tlbic6ICdSdWJiZXIgQ2hpY2tlbidcbiAgICAncXVhZHJhdGljIGV5ZSc6ICdRdWFkcmF0aWMgRXllJ1xufVxuXG5cbmNsYXNzIFRleHRUeXBlclxuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBAY3VycmVudE1lc3NhZ2UgPSAnJ1xuICAgICAgICBAaSA9IDBcblxuICAgIHR5cGVMb29wOiA9PlxuICAgICAgICBAaSsrXG4gICAgICAgIG0ucmVkcmF3KClcbiAgICAgICAgaWYgbm90IEBpc0RvbmUoKVxuICAgICAgICAgICAgc2V0VGltZW91dChAdHlwZUxvb3AsIDYpXG5cbiAgICBzZXRNZXNzYWdlOiAobWVzc2FnZSkgLT5cbiAgICAgICAgQGN1cnJlbnRNZXNzYWdlID0gbWVzc2FnZVxuICAgICAgICBAaSA9IDBcbiAgICAgICAgc2V0VGltZW91dChAdHlwZUxvb3AsIDYpXG5cbiAgICBzaG93QWxsOiAtPlxuICAgICAgICBAaSA9IEBjdXJyZW50TWVzc2FnZS5sZW5ndGggLSAxXG5cbiAgICBnZXRUZXh0U29GYXI6IC0+XG4gICAgICAgIEBjdXJyZW50TWVzc2FnZVsuLkBpXVxuXG4gICAgaXNEb25lOiAtPlxuICAgICAgICBAaSA+PSBAY3VycmVudE1lc3NhZ2UubGVuZ3RoIC0gMVxuICAgIFxuXG5tb2R1bGUuZXhwb3J0cyA9IChlbmdpbmUpIC0+XG4gICAgY29udHJvbGxlcjogY2xhc3NcbiAgICAgICAgY29uc3RydWN0b3I6IC0+XG5cbiAgICAgICAgICAgIFdhbGVWc1NoYXJjKGVuZ2luZSlcbiAgICAgICAgICAgIGRpZExvYWQgPSBlbmdpbmUubG9hZCgpXG5cbiAgICAgICAgICAgIEB2bSA9IHt9XG4gICAgICAgICAgICBAdm0uY29tbWFuZCA9IG0ucHJvcCgnJylcbiAgICAgICAgICAgIEB2bS50eXBlciA9IG5ldyBUZXh0VHlwZXIoKVxuXG4gICAgICAgICAgICBlbmdpbmUubGlzdGVuID0+XG4gICAgICAgICAgICAgICAgQHZtLnR5cGVyLnNldE1lc3NhZ2UoZW5naW5lLmdldEN1cnJlbnRNZXNzYWdlKCkpXG4gICAgICAgICAgICAgICAgbS5yZWRyYXcoKVxuICAgICAgICAgICAgICAgIGVuZ2luZS5zYXZlKClcblxuICAgICAgICAgICAgaWYgZGlkTG9hZFxuICAgICAgICAgICAgICAgIGVuZ2luZS5kb0NvbW1hbmQoJ2xvb2snKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGVuZ2luZS5nb1RvU3RhcnQoKVxuXG4gICAgICAgIG9uQ29tbWFuZFN1Ym1pdDogKGUpID0+XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAgIGlmIEB2bS50eXBlci5pc0RvbmUoKVxuICAgICAgICAgICAgICAgIGVuZ2luZS5kb0NvbW1hbmQoQHZtLmNvbW1hbmQoKSlcbiAgICAgICAgICAgICAgICBAdm0uY29tbWFuZCgnJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAdm0udHlwZXIuc2hvd0FsbCgpXG5cbiAgICAgICAgaGFuZGxlQnV0dG9uOiAoY29tbWFuZFRleHQpID0+XG4gICAgICAgICAgICBAdm0uY29tbWFuZChjb21tYW5kVGV4dClcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb21tYW5kLWlucHV0JykuZm9jdXMoKVxuXG5cbiAgICB2aWV3OiAoY3RybCkgLT5cbiAgICAgICAgbSAnI2NvbnRhaW5lcicsXG4gICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgICAgICAgICAgICAgIHdpZHRoOiAnOTU2cHgnXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAnNjM2cHgnXG4gICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nXG4gICAgICAgICAgICAgICAgYm9yZGVyOiAnMnB4IHNvbGlkICMyNUE1RkYnXG4gICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAoLTYzNi8yKSArICdweCdcbiAgICAgICAgICAgICAgICB0b3A6ICc1MCUnXG4gICAgICAgICAgICAgICAgbGVmdDogJzUwJSdcbiAgICAgICAgICAgICAgICBtYXJnaW5MZWZ0OiAoLTk1Ni8yKSArICdweCdcbiAgICAgICAgICAgIG0gJ2FbaHJlZj0jXScsXG4gICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgICAgICAgICAgICAgICAgIHRvcDogJzJweCdcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6ICc0cHgnXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiAnYmxhY2snXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTBweCdcbiAgICAgICAgICAgICAgICAgICAgekluZGV4OiAxMDBcbiAgICAgICAgICAgICAgICBvbmNsaWNrOiAoZSkgLT5cbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgICAgICAgICAgIGlmIGNvbmZpcm0oJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byByZXN0YXJ0IHRoZSBnYW1lPyBUaGlzIHdpbGwgY2xlYXIgYWxsIHByb2dyZXNzIGFuZCBpdGVtcyB5b3UgaGF2ZSBhY2hpZXZlZCBzbyBmYXIuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcnXG4gICAgICAgICAgICAgICAgJ1Jlc3RhcnQgZ2FtZSdcbiAgICAgICAgICAgIG0gJy5zaWRlYmFyJyxcbiAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgICAgICAgICAgcmlnaHQ6IDBcbiAgICAgICAgICAgICAgICAgICAgdG9wOiAwXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzU5NnB4J1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzIyMHB4J1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMjBweCdcbiAgICAgICAgICAgICAgICBtICdoMicsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luVG9wOiAwXG4gICAgICAgICAgICAgICAgICAgICdJbnZlbnRvcnknXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICBmb3IgaXRlbSwgc3RhdGUgb2YgZW5naW5lLmdldEludmVudG9yeSgpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBzdGF0ZSA9PSAnZ290dGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AuaW52ZW50b3J5LWl0ZW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJVEVNX05BTUVTW2l0ZW1dXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIHN0YXRlID09ICd1c2VkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ3AuaW52ZW50b3J5LWl0ZW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHREZWNvcmF0aW9uOiAnbGluZS10aHJvdWdoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJVEVNX05BTUVTW2l0ZW1dXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICNtICd0ZXh0YXJlYScsXG4gICAgICAgICAgICAgICAgIyAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAjICAgICAgICBoZWlnaHQ6ICczMDBweCdcbiAgICAgICAgICAgICAgICAjICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICAgICAgICAgICAgIyAgICAgICAgbWFyZ2luVG9wOiAnMTBweCdcbiAgICAgICAgICAgICAgICAjICAgIG0udHJ1c3QoZW5naW5lLnByZXZpb3VzQ29tbWFuZHMuam9pbignXFxuJykpXG5cbiAgICAgICAgICAgICAgICAjbSAndGV4dGFyZWEnLFxuICAgICAgICAgICAgICAgICMgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgIyAgICAgICAgaGVpZ2h0OiAnMzAwcHgnXG4gICAgICAgICAgICAgICAgIyAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgICAgICAgICAgICMgICAgICAgIG1hcmdpblRvcDogJzEwcHgnXG4gICAgICAgICAgICAgICAgIyAgICBtLnRydXN0KGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwcm9ncmVzcycpKVxuXG4gICAgICAgICAgICBtICcuY29udGVudCcsXG4gICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiAoNjU2KSArICdweCdcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnNjQwcHgnXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3doaXRlJ1xuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnMjBweCdcbiAgICAgICAgICAgICAgICAgICAgcGFkZGluZ1RvcDogMFxuICAgICAgICAgICAgICAgIG0gJ2gxJywgZW5naW5lLmdldEN1cnJlbnRSb29tTmFtZSgpXG4gICAgICAgICAgICAgICAgbSAncCcsIG0udHJ1c3QoY3RybC52bS50eXBlci5nZXRUZXh0U29GYXIoKSlcblxuICAgICAgICAgICAgICAgIGlmIGVuZ2luZS5nZXRDdXJyZW50Um9vbU5hbWUoKSA9PSAnRW5kJ1xuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdkaXYnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICdpbWcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6ICcvc2hhcmstc2hvd2VyaW5nLnBuZydcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2JyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnInXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdoMycsICdEbyB5b3UgZXZlbiBmZWVkYmFjaz8nXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdkaXYnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2lmcmFtZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vZG9jcy5nb29nbGUuY29tL2Zvcm1zL2QvMWRySEtzZkV6U196QTE3WVRkN09hV1lpczFROEpqZjMzZnI3SzZPY1JCb2svdmlld2Zvcm0/ZW1iZWRkZWQ9dHJ1ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6ICc3NjAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzUwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWVib3JkZXI6ICcwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW5oZWlnaHQ6ICcwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW53aWR0aDogJzAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzJweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCBncmV5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFyZ2luUmlnaHQ6ICcyMHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnTG9hZGluZy4uLidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICd0ZXh0YXJlYScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnNTAwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0udHJ1c3QoZW5naW5lLnByZXZpb3VzQ29tbWFuZHMuam9pbignXFxuJykpXG4gICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIG0gJ2Zvcm0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b206IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTM0cHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogJzIwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICBvbnN1Ym1pdDogY3RybC5vbkNvbW1hbmRTdWJtaXRcbiAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2lucHV0W3R5cGU9dGV4dF1baWQ9Y29tbWFuZC1pbnB1dF0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnNjMwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICdUeXBlIGNvbW1hbmRzIGhlcmUuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2hhbmdlOiBtLndpdGhBdHRyKCd2YWx1ZScsIGN0cmwudm0uY29tbWFuZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY3RybC52bS5jb21tYW5kKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWc6IChlbGVtZW50LCBpc0luaXRpYWxpemVkLCBjb250ZXh0KSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBub3QgaXNJbml0aWFsaXplZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdidXR0b25bdHlwZT1zdWJtaXRdJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6ICcxMHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6ICcyMHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkbydcblxuICAgICAgICAgICAgICAgICAgICAgICAgbSAnZGl2JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICdidXR0b24uYm90dG9tLWJ1dHRvblt0eXBlPWJ1dHRvbl0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAoZSkgLT4gY3RybC5oYW5kbGVCdXR0b24oJ2dldCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdnZXQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uLmJvdHRvbS1idXR0b25bdHlwZT1idXR0b25dJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljazogKGUpIC0+IGN0cmwuaGFuZGxlQnV0dG9uKCd0YWxrJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RhbGsnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uLmJvdHRvbS1idXR0b25bdHlwZT1idXR0b25dJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljazogKGUpIC0+IGN0cmwuaGFuZGxlQnV0dG9uKCd1c2UnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndXNlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvbi5ib3R0b20tYnV0dG9uW3R5cGU9YnV0dG9uXScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2xpY2s6IChlKSAtPiBjdHJsLmhhbmRsZUJ1dHRvbignbG9vaycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsb29rJ1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBtICdkaXYnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogJzIxNHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxNzBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQ6ICctMjUwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbTogJzQ0cHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbSAnYnV0dG9uLmNvbXBhc3MtYnV0dG9uW3R5cGU9YnV0dG9uXScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAnNTVweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jbGljazogKGUpIC0+IGN0cmwuaGFuZGxlQnV0dG9uKCdnbyBub3J0aCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdnbyBub3J0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICdidXR0b24uY29tcGFzcy1idXR0b25bdHlwZT1idXR0b25dJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6ICcxMjBweCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlZnQ6ICc1NXB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAoZSkgLT4gY3RybC5oYW5kbGVCdXR0b24oJ2dvIHNvdXRoJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2dvIHNvdXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG0gJ2J1dHRvbi5jb21wYXNzLWJ1dHRvblt0eXBlPWJ1dHRvbl0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcDogJzYwcHgnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByaWdodDogMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAoZSkgLT4gY3RybC5oYW5kbGVCdXR0b24oJ2dvIGVhc3QnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZ28gZWFzdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtICdidXR0b24uY29tcGFzcy1idXR0b25bdHlwZT1idXR0b25dJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3A6ICc2MHB4J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAoZSkgLT4gY3RybC5oYW5kbGVCdXR0b24oJ2dvIHdlc3QnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZ28gd2VzdCdcbiIsIlwiXCJcIlxuQ29uZGl0aW9uczpcbiAgICBAbWF0Y2hlcyhwYXR0ZXJuKVxuICAgIEBoYXNJdGVtKGl0ZW0gbmFtZSlcbiAgICBAcGVyY2VudENoYW5jZShjaGFuY2Ugb3V0IG9mIDEwMClcbiAgICBAZmxhZ0lzKGZsYWcgbmFtZSwgdmFsdWUpXG5cblJlc3VsdHM6XG4gICAgQHByaW50KHRleHQpXG4gICAgQGdvVG9Sb29tKHJvb20gbmFtZSlcbiAgICBAc2V0RmxhZyhmbGFnIG5hbWUsIHZhbHVlKVxuXCJcIlwiXG5cblxubW9kdWxlLmV4cG9ydHMgPSAoZW5naW5lKSAtPlxuICAgIGhlbHBUZXh0ID0gXCJcIlwiXG5BZHZhbmNlIHRocm91Z2ggdGhlIGdhbWUgYnkgdHlwaW5nIGNvbW1hbmRzIGxpa2UgPHN0cm9uZz5sb29rLCBnZXQsIGFuZCBnby48L3N0cm9uZz48YnI+XG5Db21tYW5kcyBjYXRhbG9ndWUgYW5kL29yIHByZSBzZXQgY29tbWFuZCBwcmVmaXggYnV0dG9uczogPHN0cm9uZz5HbywgdGFsaywgZ2V0LCBsb29rLCB1c2UuLi48L3N0cm9uZz48YnI+XG5Mb29rIGluIGFuIGFyZWEgdG8gZ2FpbiBtb3JlIGluZm9ybWF0aW9uIG9yIGxvb2sgYXQgb2JqZWN0czogPHN0cm9uZz4obG9vayBmaXNoKTwvc3Ryb25nPjxicj5cbk1vdmUgYnkgdHlwaW5nIGdvIGNvbW1hbmRzOiA8c3Ryb25nPihnbyBlYXN0KTwvc3Ryb25nPjxicj5cbkVuZ2FnZSBpbiBwaGlsb3NvcGhpY2FsIGRlYmF0ZTogPHN0cm9uZz4odGFsayBzb3JjZXJlc3MpPC9zdHJvbmc+PGJyPlxuVXNlIGl0ZW1zIGluIGludmVudG9yeTogPHN0cm9uZz4odXNlIGxpZ2h0c2FiZXIpPC9zdHJvbmc+PGJyPlxuVGhlcmUgYXJlIG90aGVyIGNvbW1hbmRzIHRvbyBhbmQgc29tZSB5b3UgY2FuIGp1c3QgY2xpY2sgb24gYSBidXR0b24gdG8gdXNlLiBFeHBlcmltZW50IGFuZCB0cnkgdGhpbmdzIGluIHRoaXMgYmVhdXRpZnVsIG5ldyB3b3JsZCBiZWZvcmUgeW91Ljxicj5cblR5cGUgPHN0cm9uZz5cImhlbHBcIjwvc3Ryb25nPiB0byBzZWUgdGhpcyBtZW51IGFnYWluPGJyPlxuXCJcIlwiXG5cbiAgICBlbmdpbmUuc2V0QWxyZWFkeUdvdHRlbk1lc3NhZ2UoJ1doYXQgYXJlIHlvdSBjcmF6eSwgd2h5IHdvdWxkIHlvdSBuZWVkIG1vcmUvYW5vdGhlciBvZiB0aGF0L3Rob3NlPycpXG5cbiAgICBlbmdpbmUuc2V0VW5pdmVyc2FsQ29tbWFuZHMgLT5cbiAgICAgICAgaWYgQG1hdGNoZXMoJ2RpZScpXG4gICAgICAgICAgICBAcHJpbnQoJ1doYXQgYXJlIHlvdSBkb2luZz8gWW91IGFyZSBkZWFkIG5vdy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnZXQgeWUgZmxhc2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgY2FuXFwndCBnZXQgeWUgZmxhc2suJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2luJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGRpZCBpdC4gWW91IHdpbi4gQnV5IHlvdXJzZWxmIGEgcGl6emEgYmVjYXVzZSB5b3UgYXJlIHNvIGNsZXZlci4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdpbnYnKSBvciBAbWF0Y2hlcygnaW52ZW50b3J5JylcbiAgICAgICAgICAgIGlmIE9iamVjdC5rZXlzKEBnZXRJbnZlbnRvcnkoKSkubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgIEBwcmludCgnSXQgdGVsbHMgeW91IHdoYXQgaXMgaW52ZW50b3J5IHJpZ2h0IG92ZXIgdGhlcmUgb24gdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIHNjcmVlbi4gSXMgdHlwaW5nIHRoaXMgY29tbWFuZCByZWFsbHkgbmVjZXNzYXJ5PycpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3VyIGludmVudG9yeSBpcyBlbXB0eSB5b3UgYmlnIGR1bWIgYnV0dC4gU29ycnksIHRoYXQgd2FzIHJ1ZGUgSSBtZWFudCB0byBzYXksIFwiWW91IGJ1dHQuXCInKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdoZWxwJylcbiAgICAgICAgICAgIEBwcmludChoZWxwVGV4dClcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGN1dHRsZWZpc2gnKSBhbmQgQGhhc0l0ZW0oJ2N1dHRsZWZpc2gnKVxuICAgICAgICAgICAgQHByaW50KCdBc2lkZSBmcm9tIGJlaW5nIHJlYWxseSBmdW5ueSBsb29raW5nLCBoaWdobHkgaW50ZWxsaWdlbnQgYW5kIGhpZ2hseSB1Z2x5LCBjdXR0bGVmaXNoIGNhbiBhbHNvIHJlbGVhc2UgYW4gaW5rIGxpa2Ugc3Vic3RhbmNlIHRvIGVzY2FwZSBwcmVkYXRvcnMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGVnZycpIGFuZCBAaGFzSXRlbSgnZWdnJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBsb29rcyB0byBiZSBhbiBvcmRpbmFyeSBlZ2cuIEJ1dCByZW1lbWJlciwgaXQgd2FzIHB1bGxlZCBvdXQgb2YgQmlsbHkgT2NlYW5cXCdzIGdsb3ZlIGJveCwgc28gbWF5YmUgbm90PycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmbG93ZXJzJykgYW5kIEBoYXNJdGVtKCdmbG93ZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnVGhlc2UgYXJlIHNvbWUgdmVyc2F0aWxlIGxvb2tpbmcgZmxvd2Vycy4gU28gbXVjaCBzbywgeW91IGNhbiBzZW5zZSBhIHB1biBsaWtlIGF1cmEgc3Vycm91bmRpbmcgdGhlbS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgdW1icmVsbGEnKSBhbmQgQGhhc0l0ZW0oJ3VtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyB1bWJyZWxsYSBjb3VsZCBwcm92aWRlIGEgbG90IG9mIHNoYWRlLiBJIGRvblxcJ3Qgc2VlIGhvdyBpdCBjYW4gZml0IGluIHlvdXIgcG9ja2V0cy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgc29kYScpIGFuZCBAaGFzSXRlbSgnc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyBhIGNhbiBvZiBzb2RhIHlvdSBmb3VuZCBpbiB0aGUgb3ZlbiBhdCBTdGVhayBhbmQgU2hha2UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHN5cnVwJykgYW5kIEBoYXNJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgYmFnIG9mIG1hcGxlIGZsYXZvcmVkIGZvdW50YWluIHN5cnVwLiBJdCBjb3VsZCBoYXZlIG90aGVyIHVzZXMgdG9vLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBoZXJyaW5nJykgYW5kIEBoYXNJdGVtKCdoZXJyaW5nJylcbiAgICAgICAgICAgIEBwcmludCgnSXQgaXMgYSBjYW4gb2YgcGlja2xlZCBoZXJyaW5nIHlvdSB3b24gb24gYSBnYW1lc2hvdy4gV2F5IHRvIGdvLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayByZWQgaGVycmluZycpIGFuZCBAaGFzSXRlbSgncmVkIGhlcnJpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdJdCBpcyBhIHJlZCBoZXJyaW5nLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBtYXJnYXJpbmUnKSBhbmQgQGhhc0l0ZW0oJ21hcmdhcmluZScpXG4gICAgICAgICAgICBAcHJpbnQoJ05vIElmcywgQW5kcyBvciBCdXR0ZXIgdmFndWVseSBtYXJnYXJpbmUgc3ByZWFkIHR5cGUgcHJvZHVjdC4gTW9kZWxlZCBieSBMb3UgRmVycmlnbm8uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGJhZGdlJykgYW5kIEBoYXNJdGVtKCdiYWRnZScpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyB0aGUganVuaW9yIG1hcmluZSBzaGVyaWZmIGJhZGdlIHN0aWNrZXIgeW91IGdvdCBhdCB0aGUgV2F0ZXIgV29ybGQgZ2lmdCBzaG9wLiBJbiBhIHBvb3JseSBsaXQgcm9vbSwgb25lIG1pZ2h0IG1pc3Rha2UgdGhpcyBmb3IgYW4gYXV0aGVudGljIGp1bmlvciBtYXJpbmUgc2hlcmlmZiBiYWRnZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgcGFuY2FrZXMnKSBhbmQgQGhhc0l0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgIEBwcmludCgnTXlzdGljYWwgcGFuY2FrZXMgeW91IG1hZGUgd2l0aCBhbiBlbmNoYW50ZWQgcmVjaXBlIGFuZCB0b3RhbGx5IG5vdCB0aGUgY29ycmVjdCBpbmdyZWRpZW50cywgcmVtZW1iZXI/IFRoYXQgd2FzIFVILW1heS16aW5nISBUYWtlIHRoZW0gdG8gV2FsZSBhbmQgaHVycnkuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1pbGsnKSBhbmQgQGhhc0l0ZW0oJ21pbGsnKVxuICAgICAgICAgICAgQHByaW50KCdXaG9sZSBtaWxrLCBhcHBhcmVudGx5IGZyb20gYSByZWFsIHNlYSBjb3cuIElzIGl0IHN0aWxsIG9rYXkgdG8gY2FsbCB0aGVtIHRoYXQ/JylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHF1YWRyYXRpYyBleWUnKSBhbmQgQGhhc0l0ZW0oJ3F1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQHByaW50KCc/Pz8nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY293Ym95IGhhdCcpIGFuZCBAaGFzSXRlbSgnY293Ym95IGhhdCcpXG4gICAgICAgICAgICBAcHJpbnQoJ05pY2UgaGF0LCBwaWxncmltLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayByYWluYm93IHdpZycpIGFuZCBAaGFzSXRlbSgncmFpbmJvdyB3aWcnKVxuICAgICAgICAgICAgQHByaW50KCdUaGVyZSBzaG91bGQgYmUgbGF3cyBhZ2FpbnN0IHRoaXMga2luZCBvZiB0aGluZy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgbW90b3JjeWNsZSBoZWxtZXQnKSBhbmQgQGhhc0l0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgICAgIEBwcmludCgnSXQgaXMgdGhlIGtpbmQgd2l0aCB0aGUgZnVsbCB2aXNvciBzbyB5b3UgY291bGQganVzdCBiZSB0aGUgc3R1bnQgZG91YmxlLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzdG92ZXBpcGUgaGF0JykgYW5kIEBoYXNJdGVtKCdzdG92ZXBpcGUgaGF0JylcbiAgICAgICAgICAgIEBwcmludCgnRm91ciBzY29yZSBhbmQgc2V2ZW4geWVhcnMgYWdvLi4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGxlYXRoZXIgamFja2V0JykgYW5kIEBoYXNJdGVtKCdsZWF0aGVyIGphY2tldCcpXG4gICAgICAgICAgICBAcHJpbnQoJ01lbWJlcnMgb25seS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY2xvd25zdWl0JykgYW5kIEBoYXNJdGVtKCdjbG93bnN1aXQnKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIHNob3VsZCBzY2FyZSB0aGUga2lkcy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgb2xkIHRpbWV5IHN1aXQnKSBhbmQgQGhhc0l0ZW0oJ29sZCB0aW1leSBzdWl0JylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGZlZWwgbGlrZSBzb21lIHNlcmlvdXMgZnJpZWQgY2hpY2tlbiwgYW5kIHlvdSBkb27igJl0IGV2ZW4ga25vdyB3aGF0IHRoYXQgaXMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGNvd3ByaW50IHZlc3QnKSBhbmQgQGhhc0l0ZW0oJ2Nvd3ByaW50IHZlc3QnKVxuICAgICAgICAgICAgQHByaW50KCdWZXJ5IFRveSBTdG9yeS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgZmFrZSBiZWFyZCcpIGFuZCBAaGFzSXRlbSgnZmFrZSBiZWFyZCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBmZWVsIGxpa2UgY29tcGxhaW5pbmcgYWJvdXQga2lkcyBvbiB5b3VyIGxhd24gYW5kIGhvdyB5b3UgZG9uXFwndCBldmVuIGtub3cgd2hhdCBhIHR3aXR0ZXIgaXMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGd1biBiZWx0JykgYW5kIEBoYXNJdGVtKCdndW4gYmVsdCcpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgdHJ1c3R5IHNpeCBzaG9vdGVyLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBtZXRhbCBjaGFpbicpIGFuZCBAaGFzSXRlbSgnbWV0YWwgY2hhaW4nKVxuICAgICAgICAgICAgQHByaW50KCdBIGNoYWluIGlzIG9ubHkgYXMgc3Ryb25nIGFzLS0gd2FpdCwgd3Jvbmcgc2hvdy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgcnViYmVyIGNoaWNrZW4nKSBhbmQgQGhhc0l0ZW0oJ3J1YmJlciBjaGlja2VuJylcbiAgICAgICAgICAgIEBwcmludCgnU29ycnksIG5vIHB1bGxleSBpbiBpdC4nKVxuXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0kgYW0gbm90IGF1dGhvcml6ZWQgdG8gdGVsbCB5b3UgYWJvdXQgdGhhdCB5ZXQuIFN0b3AgdHJ5aW5nIHRvIGNoZWF0IG1hbiEnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UnKVxuICAgICAgICAgICAgQHByaW50KCdJIGFtIG5vdCBhdXRob3JpemVkIHRvIGdpdmUgdGhhdCB0byB5b3UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJylcbiAgICAgICAgICAgIEBwcmludCgnV2hvIGFyZSB5b3UgdGFsa2luZyB0bz8nKVxuXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgUGljayBhIHJhbmRvbSBkZWZhdWx0IHJlc3BvbnNlXG4gICAgICAgICAgICBkZWZhdWx0UmVzcG9uc2VzID0gW1xuICAgICAgICAgICAgICAgICdXaGF0IGFyZSB5b3UgZXZlbiB0cnlpbmcgdG8gZG8/ICBKdXN0IHN0b3AuJ1xuICAgICAgICAgICAgICAgICdHb29kIG9uZSBtYW4uJ1xuICAgICAgICAgICAgICAgICdXaG9hIHRoZXJlIEVhZ2VyIE1jQmVhdmVyISdcbiAgICAgICAgICAgICAgICAnRG9uXFwndCBkbyB0aGF0LidcbiAgICAgICAgICAgICAgICAnR3Jvc3MsIG5vIHdheS4nXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBAcHJpbnQoZGVmYXVsdFJlc3BvbnNlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqZGVmYXVsdFJlc3BvbnNlcy5sZW5ndGgpXSlcblxuICAgICAgICBcbiAgICBlbmdpbmUuc2V0QWZ0ZXJDb21tYW5kIC0+XG4gICAgICAgIGlmIChub3QgQGZsYWdJcygnaGF2ZV9hbGxfaXRlbXMnLCB0cnVlKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnZWdnJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ2Zsb3dlcnMnKSBhbmRcbiAgICAgICAgICAgICAgICBAaGFzSXRlbSgnc29kYScpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdzeXJ1cCcpIGFuZFxuICAgICAgICAgICAgICAgIEBoYXNJdGVtKCdtaWxrJykgYW5kXG4gICAgICAgICAgICAgICAgQGhhc0l0ZW0oJ21hcmdhcmluZScpKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiV2VsbCwgSSB0aGluayBJIGhhdmUgYWxsIHRoZSBpbmdyZWRpZW50cyxcIiB5b3Ugc2F5IHRvIHlvdXJzZWxmLiBcIkkganVzdCBuZWVkIG9uZSBvZiB0aG9zZSBwbGFjZXMgd2hlcmUgeW91IHB1dCB0aGVtIHRvZ2V0aGVyIHNvIGl0IHR1cm5zIGludG8gc29tZXRoaW5nIHlvdSBjYW4gZWF0LiBZb3Uga25vdywgb25lIG9mIHRob3NlLi4uZm9vZCBwcmVwYXJpbmcgcm9vbXMuXCInKVxuICAgICAgICAgICAgICAgIEBzZXRGbGFnKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdXYWxlIHZzIFNoYXJjOiBUaGUgQ29taWM6IFRoZSBJbnRlcmFjdGl2ZSBTb2Z0d2FyZSBUaXRsZSBGb3IgWW91ciBDb21wdXRlciBCb3gnLCAtPlxuICAgICAgICBAcHJpbnQoJ1RoYW5rIHlvdSBmb3IgYnV5aW5nIHRoaXMgZ2FtZSEgIFR5cGUgdGhpbmdzIGluIHRoZSBib3ggdG8gbWFrZSB0aGluZ3MgaGFwcGVuIScpXG4gICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0hvdyBUbyBQbGF5JylcblxuICAgIGVuZ2luZS5hZGRSb29tICdIb3cgVG8gUGxheScsIC0+XG4gICAgICAgIEBwcmludChoZWxwVGV4dClcbiAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgIEBnb1RvUm9vbSgnT2NlYW4nKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ09jZWFuJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIGFuZCBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICBAcHJpbnQoJ1dlbGNvbWUgdG8gV2FsZSB2cyBTaGFyYzogVGhlIFZpZGVvIEdhbWUuIFlvdSBhcmUgU2hhcmMgYW5kIHlvdXIgJDIzIHNoYW1wb28gaXMgbWlzc2luZy4gWW91IHN1c3BlY3QgZm91bCBwbGF5LiBPYnZpb3VzIGV4aXRzIGFyZSBOb3J0aCB0byB5b3VyIGZyaWVuZCBXYWxlLicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoaXMgaXMgcXVpdGUgcG9zc2libHkgdGhlIG1vc3QgdW5pbnRlcmVzdGluZyBjdWJlIG9mIHdhdGVyIGluIHRoZSBvY2Vhbi4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhbGUnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2FsZScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnSGV5LCBpdCBpcyB5b3VyIGZyaWVuZCwgV2FsZS4gSGUgaXMgZG9pbmcgdGhhdCB0aGluZyB3aGVyZSBoZSBoYXMgaGlzIGV5ZXMgY2xvc2VkIGFuZCBhY3RzIGxpa2UgaGUgZGlkIG5vdCBub3RpY2UgeW91ciBhcnJpdmFsLiBIZSBpcyBraW5kIG9mIGEgcHJpY2ssIGJ1dCBhbHNvIHlvdXIgZnJpZW5kLiBXaGF0IGNhbiB5b3UgZG8/IE9idmlvdXMgZXhpdHMgYXJlIE9jZWFuIHRvIHRoZSBzb3V0aCwgYSBzY2hvb2wgb2YgQ3V0dGxlZmlzaCB0byB0aGUgd2VzdCwgbW9yZSBPY2VhbiB0byB0aGUgbm9ydGgsIGFuZCBCaWxseSBPY2VhbiB0byB0aGUgZWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnV2FsZSBpcyBzdGlsbCBqdXN0IGZsb2F0aW5nIHRoZXJlIHRyeWluZyB0byBiZSBlbmlnbWF0aWMsIHdvdWxkIGhlIGV2ZW4gbm90aWNlIGlmIHlvdSBzYWlkIHNvbWV0aGluZz8gT2J2aW91cyBleGl0cyBhcmUgT2NlYW4gdG8gdGhlIHNvdXRoLCBhIHNjaG9vbCBvZiBDdXR0bGVmaXNoIHRvIHRoZSB3ZXN0LCBtb3JlIE9jZWFuIHRvIHRoZSBub3J0aCwgYW5kIEJpbGx5IE9jZWFuIHRvIHRoZSBlYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayB3YWxlJylcbiAgICAgICAgICAgIEBwcmludCgnSGUgaXMganVzdCBmbG9hdGluZyB0aGVyZSwgZXllcyBjbG9zZWQsIHRyeWluZyB0byBzaHV0IG91dCB0aGlzIGVhcnRobHkgcmVhbG0uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnaXZlIHBhbmNha2VzJylcbiAgICAgICAgICAgIGlmIEBoYXNJdGVtKCdwYW5jYWtlcycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdcIkhleSBXYWxlLFwiIHlvdSBjYWxsIG91dCBhcyBpbnRydXNpdmVseSBhcyBwb3NzaWJsZSwgXCJJIGdvdCB5b3VyLS1cIiBCZWZvcmUgeW91IGNvdWxkIGZpbmlzaCB5b3VyIHNlbnRlbmNlLCB5b3VyIGJsdWJiZXJ5IGZyaWVuZCBoYXMgc25hdGNoZWQgdGhlIHBsYXRlIGF3YXkgYW5kLCBpbiBhIG1vc3QgdW5kaWduaWZpZWQgbWFubmVyLCBiZWdpbnMgbW93aW5nIHRocm91Z2ggdGhlIGZyaWVkIGRpc2NzIHlvdSBzbyBhcnRmdWxseSBwcmVwYXJlZC4gXCJTb3VsIHNlYXJjaGluZyB0YWtlcyBhIGxvdCBvZiBlbmVyZ3ksXCIgaGUgZXhwbGFpbnMgYmV0d2VlbiBiaXRlcy4gXCJJIGhhdmVuXFwndCBlYXRlbiBhbnl0aGluZyBhbGwgZGF5LlwiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ09uY2UgZmluaXNoZWQsIFdhbGUgc3RyYWlnaHRlbnMgaGltc2VsZiBvdXQsIGxvb2tpbmcgYSBtaXRlIGVtYmFycmFzc2VkIGZvciB0aGUgc2F2YWdlIGRpc3BsYXkgaGUganVzdCBwdXQgb24uIFwiV2hhdCB3YXMgaXQgeW91IG5lZWRlZD9cIiBcIk9oIFdhbGUsIGl0XFwncyB0ZXJyaWJsZS4gSSB0aGluayBteSAkMjMgc2hhbXBvbyB3YXMgc3RvbGVuIGFuZCB0aGUgZ2hvc3Qgb2YgbXkgbm90IHJlYWxseSBkZWFkIGZyaWVuZCBzYXlzIHRoZSBmYXRlIG9mIHRoZSB3b3JsZCBoYW5ncyBpbiB0aGUgYmFsYW5jZS5cIicpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSSBzZWUsXCIgc2F5cyBXYWxlLCBoaXMgdm9pY2UgYW5kIG1hbm5lciByZW1haW5pbmcgdW5jaGFuZ2VkIGRlc3BpdGUgdGhlIHRocmVhdCBvZiB0aGUgd29ybGQgdW5iYWxhbmNpbmcuIFwiU2hhcmMsIEkgZmVhciB0aGUgd29yc3QuIFlvdSBtdXN0IHN1bW1vbiB0aGUgZXRoZXJlYWwgZG9vci5cIicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJObywgV2FsZSxcIiB5b3Ugc2F5LCBcInlvdSBtYWRlIG1lIHN3ZWFyIGEgdGhvdXNhbmQgdm93cyBuZXZlciB0byBicmluZyB0aGF0IGN1cnNlZCByZWxpYyBiYWNrIGFtb25nIHVzLlwiIFwiSSBrbm93IHdoYXQgSSBzYWlkLCBidXQgSSBhbHNvIGtuZXcgdGhlcmUgd291bGQgY29tZSBhIHRpbWUgd2hlbiB3ZSB3b3VsZCBoYXZlIG5vIG90aGVyIGNob2ljZS5cIiAgWW91IHNob3VsZCBwcm9iYWJseSBzdW1tb24gdGhlIGRvb3IuJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcmVtb3ZlSXRlbSgncGFuY2FrZXMnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZXRGbGFnKCdnaXZlbl9wYW5jYWtlcycsIHRydWUpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3VtbW9uIGRvb3InKSBhbmQgQGZsYWdJcygnZ2l2ZW5fcGFuY2FrZXMnLCB0cnVlKVxuICAgICAgICAgICAgQHByaW50KCdZb3UsIGZpbmFsbHkgY29udmluY2VkIG9mIHlvdXIgdXJnZW5jeSBhbmQgdXR0ZXIgZGVzcGVyYXRpb24sIHBlcmZvcm0gc29tZSBpbnRyaWNhdGUgcml0ZXMgYW5kIGluY2FudGF0aW9ucyB0aGF0IHdvdWxkIGJlIHJlYWxseSBjb29sIGlmIHlvdSBjb3VsZCBzZWUgdGhlbSwgYnV0IEkgZ3Vlc3MgeW91IHdpbGwganVzdCBoYXZlIHRvIHVzZSB5b3VyIGltYWdpbmF0aW9ucy4gVGV4dCBvbmx5IGZvb2xzISAgVGhlIGV0aGVyZWFsIGRvb3Igc3RhbmRzIG9wZW4gYmVmb3JlIHlvdS4nKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlIChXaXRoIEV0aGVyZWFsIERvb3IgcmlnaHQgdGhlcmUhKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayB3YWxlJylcbiAgICAgICAgICAgIGlmIG5vdCBAZmxhZ0lzKCd0YWxrZWRfdG9fd2FsZScsIHRydWUpXG4gICAgICAgICAgICAgICAgQHByaW50KCdXYWxlIGlzIHRyeWluZyB0byBtZWRpdGF0ZSBvciBzb21ldGhpbmcgcHJldGVudGlvdXMgdGhhdCB5b3UgZG9uXFwndCBjYXJlIGFib3V0LiBZb3UgaGF2ZSBzb21ldGhpbmcgaW1wb3J0YW50ISBcIldhbGVcIiB5b3Ugc2hvdXQsIFwiSSBuZWVkIHlvdXIgaGVscCEgVGhlIGNvbmRpdGlvbiBvZiBteSBtYWduaWZpY2VudCBzY2FscCBpcyBhdCBzdGFrZS5cIicpXG4gICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdXYWxlIHNpZ2hzIGEgaGVhdnksIGxhYm9yZWQgc2lnaC4gXCJTaGFyYywgeW91IGhhdmUgZGlzdHVyYmVkIG15IGpvdXJuZXkgdG8gbXkgaW5uZXJtb3N0IGJlaW5nLiBCZWZvcmUgSSBjYW4gaGVscCB5b3UsIHJlcGFyYXRpb25zIG11c3QgYmUgbWFkZS4gWW91IG11c3QgbWFrZSBtZSBhIGhlYWx0aHkgc2VydmluZyBvZiBwYW5jYWtlczogd2hvbGUgd2hlYXQsIHdpdGggYWxsIG5hdHVyYWwgbWFwbGUgc3lydXAuIE5vdyBsZWF2ZSBtZSBhcyBJIHBlZWwgYmFjayB0aGUgbGF5ZXJzIG9mIHRoZSBzZWxmIGFuZCBwb25kZXIgdGhlIGxlc3NvbiBvZiB0aGUgY2hlcnJ5IGJsb3Nzb20uJylcbiAgICAgICAgICAgICAgICAgICAgQHNldEZsYWcoJ3RhbGtlZF90b193YWxlJywgdHJ1ZSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiSSBjYW4gbm90IGxpZnQgYSBmaW4gZm9yIHlvdSB1bnRpbCB5b3UgaGF2ZSBicm91Z2h0IGEgaGVhbHRoeSBzZXJ2aW5nIG9mIHdob2xlIHdoZWF0IHBhbmNha2VzIHdpdGggYWxsIG5hdHVyYWwgbWFwbGUgc3lydXAgbGlrZSBJIHNhaWQgYmVmb3JlLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ09jZWFuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXZXR0ZXIgT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQ3V0dGxlZmlzaCcpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdCaWxseSBPY2VhbicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2FsZSAoV2l0aCBFdGhlcmVhbCBEb29yIHJpZ2h0IHRoZXJlISknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygnZW50ZXIgZG9vcicpIG9yIEBtYXRjaGVzKCdnbyBkb29yJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnVGhlIEV0aGVyZWFsIFJlYWxtJylcbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKSBvciBAbWF0Y2hlcygnZ28nKVxuICAgICAgICAgICAgQHByaW50KCdUaGUgZXRoZXJlYWwgYmVja29ucyB5b3UgY29tZSBmb3J3YXJkLicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2V0dGVyIE9jZWFuJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGlzIGlzIGp1c3Qgc29tZSBvY2VhbiB5b3UgZm91bmQuIEl0IGRvZXMgZmVlbCBhIGxpdHRsZSBiaXQgd2V0dGVyIHRoYW4gdGhlIHJlc3Qgb2YgdGhlIG9jZWFuIHRob3VnaC4gQWxzbywgZGlkIGl0IGp1c3QgZ2V0IHdhcm1lcj8gT2J2aW91cyBleGl0cyBhcmUgYSBnYXJkZW4gdG8gdGhlIHdlc3QsIFdhbGUgaW4gdGhlIHNvdXRoLCBhbmQgYSBnYW1lc2hvdyBlYXN0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdKdXN0IGFub3RoZXIgc29saWQgMTAgY3ViaWMgZmVldCBvZiBvY2Vhbi4gT2J2aW91cyBleGl0cyBhcmUgYSBnYXJkZW4gdG8gdGhlIHdlc3QsIFdhbGUgaW4gdGhlIHNvdXRoLCBhbmQgYSBnYW1lc2hvdyBlYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0FjaHRpcHVzXFwncyBHYXJkZW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ0N1dHRsZWZpc2gnLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICAgICAgQHByaW50KCdMb29rLCB0aGVyZSBiZSBzb21lIGN1dHRsZWZpc2gsIHRob3VnaCB0aGV5IGRvIG5vdCBsb29rIHRvbyBjdWRkbHkuIFN0ZWFrIGFuZCBTaGFrZSBpcyB0byB0aGUgd2VzdCwgQWNodGlwdXNcXCdzIGdhcmRlbiB0byB0aGUgbm9ydGgsIGFuZCBXYWxlIHRvIHRoZSBlYXN0LicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGVyZSB1c2VkIHRvIGJlIGN1dHRsZWZpc2ggaGVyZSBidXQgeW91IHNjYXJlZCB0aGVtIGF3YXkgd2l0aCB5b3VyIGFnZ3Jlc3NpdmUgYWZmZWN0aW9ucy4gS2VlcCB0aGF0IHN0dWZmIGluc2lkZSBtYW4hIFN0ZWFrIGFuZCBTaGFrZSBpcyB0byB0aGUgd2VzdCwgQWNodGlwdXNcXCdzIGdhcmRlbiB0byB0aGUgbm9ydGgsIGFuZCBXYWxlIHRvIHRoZSBlYXN0LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2N1ZGRsZSBjdXR0bGVmaXNoJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnY3V0dGxlZmlzaCcpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3UgYXJlIGZlZWxpbmcgYWZmZWN0aW9uYXRlIHRvZGF5IGFuZCB5b3UganVzdCBnb3QgZHVtcGVkIHNvIHdoeSBub3Q/IFlvdSBqdW1wIHNvbWUgb2YgdGhlIGN1dHRsZWZpc2ggYW5kIHN0YXJ0IHNudWdnbGluZyBhbmQgY3VkZGxpbmcuIFRoZSBjdXR0bGVmaXNoIGFyZSBub3QgYW11c2VkIHRob3VnaCwgYW5kIHNheSB0aGV5IGFyZSB0aXJlZCBvZiBmaXNoIG1ha2luZyB0aGF0IG1pc3Rha2UuIFRoZXkgYWxsIHN3aW0gYXdheSBleGNlcHQgZm9yIG9uZSB0aGF0IGhhcyBhdHRhY2hlZCBpdHMgc3Vja2VycyB0byB5b3VyIG1pZCByZWdpb24uIFlvdSBkb25cXCd0IHNlZW0gdG8gbWluZC4nKVxuICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdjdXR0bGVmaXNoJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZXkgYXJlIGN1ZGRsZWQgb3V0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBjdXR0bGVmaXNoJylcbiAgICAgICAgICAgIEBwcmludCgnT2gsIGN1dHRsZWZpc2gsIHRob3NlIGFyZSBmcmVha3kuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2FsZScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQWNodGlwdXNcXCdzIEdhcmRlbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnQmlsbHkgT2NlYW4nLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgYW5kIG5vdCBAZmxhZ0lzKCd3YXRjaGVkX2JpbGx5X3ZpZGVvJywgdHJ1ZSlcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKCdodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PXpOZ2NZR2d0ZjhNJywgJ19ibGFuaycpXG5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBpZiBub3QgQGZsYWdJcygnZHJvdmVfYmlsbHlfdG9faG9zcGl0YWwnLCB0cnVlKVxuICAgICAgICAgICAgICAgIEBwcmludCgnU3VkZGVubHksIGFwcGVhcmluZyBiZWZvcmUgeW91ciBleWVzIGlzIHNpbmdlci1zb25nd3JpdGVyIGFuZCBmb3JtZXIgQ2FyaWJiZWFuIGtpbmc6IEJpbGx5IE9jZWFuLiBBbHNvIEJpbGx5IE9jZWFuXFwncyBjYXIuIE9idmlvdXMgZXhpdHMgYXJlIFdlc3QgdG8gV2FsZSBhbmQgTm9ydGggdG8gc29tZSBraW5kIG9mIGdhbWUgc2hvdy4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnQmlsbHkgT2NlYW4gaXMgb3V0IG9mIHRoZSBob3NwaXRhbC4gSGUgYXBwcmVjaWF0ZXMgd2hhdCB5b3UgZGlkIGZvciBoaW0gYW5kIHNheXMsIFwiV2hlbiB0aGUgZ29pbmcgZ2V0cyB0b3VnaCwgdGhlIHRvdWdoIGVzY2FwZSBmcm9tIHRoZSBpbnNhbml0eSB3YXJkLlwiIE9idmlvdXMgZXhpdHMgYXJlIFdlc3QgdG8gV2FsZSBhbmQgTm9ydGggdG8gc29tZSBraW5kIG9mIGdhbWUgc2hvdy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsnKVxuICAgICAgICAgICAgaWYgbm90IEBmbGFnSXMoJ2Ryb3ZlX2JpbGx5X3RvX2hvc3BpdGFsJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0hlIHdhbnRzIHlvdSB0byBnZXQgaW50byBoaXMgY2FyIGFuZCBkcml2ZSBoaW0gdG8gdGhlIGhvc3BpdGFsLiBIZSBqdXN0IGRyb3ZlIHRocm91Z2ggdGhlIGNhciB3YXNoIHdpdGggdGhlIHRvcCBkb3duIGFmdGVyIGRyb3BwaW5nIHNvbWUgYWNpZC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJXaGVuIHRoZSBnb2luZyBnZXRzIHRvdWdoLCB0aGUgdG91Z2ggZXNjYXBlIGZyb20gdGhlIGluc2FuaXR5IHdhcmQuXCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY2FyJylcbiAgICAgICAgICAgIEBwcmludCgnVGhhdCBpcyBkZWZpbml0ZWx5IGEgY2FyLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBob3NwaXRhbCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZSBob3NwaXRhbCBsb29tcyBpbiB0aGUgZGlzdGFuY2UuIEl0IGRvZXNuXFwndCBzZWVtIGFsbCB0aGF0IGZhciBhd2F5IGlmIHlvdSBoYXZlIGEgY2FyLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnaG9zcGl0YWwnKSBvciBAbWF0Y2hlcygnY2FyJylcbiAgICAgICAgICAgIEBwcmludCgnU3VyZSwgd2h5IG5vdD8gWW91IGdldCBpbiB0aGUgZHJpdmVyXFwncyBzZWF0IGFuZCBmaW5kIHlvdXIgd2F5IHRvIHRoZSBuZWFyZXN0IG1lZGljYWwgdHJlYXRtZW50IGNlbnRlci4gQXMgdGhhbmtzLCBNci4gT2NlYW4gcHVsbHMgYW4gZWdnIG91dCBmcm9tIGhpcyBnbG92ZSBib3guIFlvdSBhY2NlcHQgYW5kIHN3aW0gYXdheSBhcyBmYXN0IGFzIHBvc3NpYmxlLiBHb29kLCBJIHJhbiBvdXQgb2Ygam9rZXMgZm9yIHRoYXQgZmFzdC4nKVxuICAgICAgICAgICAgQHNldEZsYWcoJ2Ryb3ZlX2JpbGx5X3RvX2hvc3BpdGFsJywgdHJ1ZSlcbiAgICAgICAgICAgIEBnZXRJdGVtKCdlZ2cnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjYWxsIGNvcHMnKVxuICAgICAgICAgICAgQHByaW50KCdUaGUgcG9saWNlIGNvbWUgYW5kIGFycmVzdCBCaWxseSBPY2VhbiBvbiBjaGFyZ2Ugb2YgYmVpbmcgY29tcGxldGVseSBpcnJlbGV2YW50IHRvIHRoaXMgZ2FtZS4gWW91IFdpbiEgSGlnaCBTY29yZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYWxlJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnQWNodGlwdXNcXCdzIEdhcmRlbicsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgQGNvbWluZ0Zyb20oWydBY2h0aXB1c1xcJ3MgR2FyZGVuIChJbnNpZGUpJ10pXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3UgbGVhdmUgdGhlIGdhcmRlbi4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgaW5zaWRlIG9mIHRoZSBnYXJkZW4sIG5vcnRoIHRvIFdhdGVyIFdvcmxkLCBlYXN0IHRvIHNvbWUgT2NlYW4gYW5kIHNvdXRoIHRvIGEgc2Nob29sIG9mIEN1dHRsZWZpc2guJylcbiAgICAgICAgICAgIGVsc2UgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnQWNodGlwdXMgaXMgd29ya2luZyBhbW9uZyBoaXMgZmxvd2VycyBhbmQgc2hydWJzLiBIZSBzZWVzIHlvdSBhbmQgb3BlbnMgdGhlIGdhdGUgZm9yIHlvdS4gT2J2aW91cyBleGl0cyBhcmUgd2VzdCB0byB0aGUgaW5zaWRlIG9mIHRoZSBnYXJkZW4sIG5vcnRoIHRvIFdhdGVyIFdvcmxkLCBlYXN0IHRvIHNvbWUgT2NlYW4gYW5kIHNvdXRoIHRvIGEgc2Nob29sIG9mIEN1dHRsZWZpc2guJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0FjaHRpcHVzIGlzIHN0aWxsIHdvcmtpbmcgaGFyZCBpbiB0aGF0IGdhcmRlbi4gWW91IG5lZWQgdG8gZ2V0IGhpbSBhIGdpcmxmcmllbmQsIGFuZCB0aGVuIGhlIG5lZWRzIHRvIGdldCBZT1UgYSBnaXJsZnJpZW5kLiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBpbnNpZGUgb2YgdGhlIGdhcmRlbiwgbm9ydGggdG8gV2F0ZXIgV29ybGQsIGVhc3QgdG8gc29tZSBPY2VhbiBhbmQgc291dGggdG8gYSBzY2hvb2wgb2YgQ3V0dGxlZmlzaC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGFjaHRpcHVzJylcbiAgICAgICAgICAgIEBwcmludCgnSXRcXCdzIEFjaHRpcHVzLiBIZSBpcyBwdWxsaW5nIG91dCB0aGUgc2Vhd2VlZHMgZnJvbSBoaXMgc2VhIGN1Y3VtYmVyIGJlZC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ25vcnRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQnKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0Jykgb3IgQG1hdGNoZXMoJ2VudGVyJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQWNodGlwdXNcXCdzIEdhcmRlbiAoSW5zaWRlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXZXR0ZXIgT2NlYW4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0N1dHRsZWZpc2gnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnQWNodGlwdXNcXCdzIEdhcmRlbiAoSW5zaWRlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgZW50ZXIgdGhlIGdhcmRlbiBhbmQgc2VlIGEgYm91bnRpZnVsIGRpc3BsYXkgdW5mb2xkIGJlZm9yZSB5b3UuIFRoZSBnYXJkZW4gZXhpdCBpcyBFYXN0LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsaycpXG4gICAgICAgICAgICBpZiBub3QgQGZsYWdJcygndGFsa2VkX3RvX2FjaHRpcHVzJywgdHJ1ZSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiVGhpcyBpcyBxdWl0ZSB0aGUgdW0uLi5vY2VhbiBoaWRlYXdheSB5b3UgaGF2ZSBoZXJlLFwiIHlvdSBzYXkuIFwiWWVzLFwiIGhlIHNheXMsIFwiSSBjYW4gc2VlIHlvdSBoYXZlIGNvbWUgYSBsb25nIHdheSB0byBnZXQgaGVyZSwgYnV0IEkgYW0gZ2xhZCB5b3UgaGF2ZSBmb3VuZCByZWZ1Z2Ugb24gbXkgZ3JvdW5kcy4gSWYgeW91IHNlZSBhbnl0aGluZyB5b3UgbGlrZSBpbiBteSBwbG90IHdlIGNvdWxkIG1ha2UgYSBkZWFsIHBlcmhhcHMuXCInKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnT2gsIGJhY2sgYWdhaW4gU2hhcmM/IENhbiBJIGludGVyZXN0IHlvdSBpbiBhbnkgb2YgdGhlIGl0ZW1zIGluIG15IGZpbmUgZ2FyZGVuPycpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBhY2h0aXB1cycpXG4gICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyBBY2h0aXB1cy4gSGUgaXMgcHVsbGluZyBvdXQgdGhlIHNlYXdlZWRzIGZyb20gaGlzIHNlYSBjdWN1bWJlciBiZWQuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGdhcmRlbicpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzZWUgd2F0ZXJtZWxvbnMsIHdhdGVyIGNoZXN0bnV0cywgYXNzb3J0ZWQgZmxvd2Vycywgc2VhIGN1Y3VtYmVycyBhbmQgc3RyYXdiZXJyaWVzLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgd2F0ZXJtZWxvbnMnKSBvciBAbWF0Y2hlcygndGFrZSB3YXRlcm1lbG9ucycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBvbmx5IGVhdCBzZWVkbGVzcyBhbmQgdGhlc2UgYXJlIHRoZSBleHRyYSBzZWVkIHZhcmlldHkuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBjaGVzdG51dHMnKSBvciBAbWF0Y2hlcygndGFrZSBjaGVzdG51dHMnKVxuICAgICAgICAgICAgQHByaW50KCdXYXRlciBjaGVzdG51dHM/IElzIHRoYXQgZXZlbiBhIHRoaW5nPycpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgY3VjdW1iZXJzJykgb3IgQG1hdGNoZXMoJ3Rha2UgY3VjdW1iZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnU29hayBpdCBpbiBicmluZSBmb3IgYSBjb3VwbGUgd2Vla3MsIHRoZW4gY29tZSBiYWNrIHRvIG1lLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgc3RyYXdiZXJyaWVzJykgb3IgQG1hdGNoZXMoJ3Rha2Ugc3RyYXdiZXJyaWVzJykgb3IgQG1hdGNoZXMoJ2xvb2sgc3RyYXdiZXJyeScpIG9yIEBtYXRjaGVzKCd0YWtlIHN0cmF3YmVycnknKVxuICAgICAgICAgICAgQHByaW50KCdZb3Ugc2Vuc2UgYSBzdXJyZWFsaXN0aWMgdmliZSBjb21pbmcgZnJvbSB0aG9zZSBzdHJhd2JlcnJpZXMuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGZsb3dlcnMnKSBvciBAbWF0Y2hlcygndGFrZSBmbG93ZXJzJylcbiAgICAgICAgICAgIEBwcmludCgnXCJJIGNhbiBzZWUgeW91IGxpa2UgdGhlIGZsb3dlcnMuIEkgd2lsbCBsZXQgeW91IGhhdmUgdGhlbSBpZiB5b3UgY2FuIGZpbmQgc29tZXRoaW5nIHRvIGtlZXAgaXQgZnJvbSBnZXR0aW5nIHNvIGhvdCBoZXJlLiBJIHdvdWxkIGJlIGFibGUgdG8gZG8gdHdpY2UgYXMgbXVjaCB3b3JrIGlmIGl0IHdlcmUgYSBiaXQgY29vbGVyLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdnaXZlIHVtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnXCJUaGlzIHdpbGwgYmUgcGVyZmVjdCBmb3IgYmxvY2tpbmcgb3V0IHRoYXQgc3Vu4oCZcyBoYXJzaCByYXlzLiBUaGFua3MhXCInKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3VtYnJlbGxhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgICAgIEBwcmludCgnXCJUYWtlIHRoZXNlIGZsb3dlcnMuIFRoZXkgYXJlIHJlYWxseSB2ZXJzYXRpbGUgYW5kIHdpbGwgYmUgZ29vZCBqdXN0IGFib3V0IGFueXdoZXJlLlwiJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0Jykgb3IgQG1hdGNoZXMoJ2V4aXQnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHN3aW0gdXAgdG8gdGhlIHJ1aW5zIG9mIHlvdXIgb2xkIHdvcmsgcGxhY2UuIFRoaXMgcGxhY2UgaGFzIHNlZW4gYmV0dGVyIGRheXMuIFlvdXIgbWluZCBpcyBmbG9vZGVkIHdpdGggbWVtb3JpZXMgb2YgZmxvYXRpbmcgaW4gZnJvbnQgb2YgdGhlIG9sZCBncmlsbCBhbmQgY29taW5nIHVwIHdpdGggbmV3IHJlY2lwZXMgdG8gdHJ5IHdoZW4geW91ciBtYW5hZ2VyIGhhZCBoaXMgYmFjayB0dXJuZWQuIFRoZW4gc29tZW9uZSBzYWlkIFwiRXZlciB0cmllZCBhbiBNLTgwIGJ1cmdlcj8gSSBoYXZlIGVub3VnaCBmb3IgZXZlcnlvbmUuXCIgVGhlIHdvcmRzIGVjaG8gaW4geW91ciBtaW5kIGxpa2UgYSBwaGFudG9tIHdoaXNwZXIgb2YgYWdlcyBwYXN0LiBDdXR0bGVmaXNoIHN0b21waW5nIGdyb3VuZHMgbGllIGVhc3QuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoaXMgaXMgd2hhdCBpcyBsZWZ0IG9mIHRoZSBTdGVhayBhbmQgU2hha2UgYnVpbGRpbmcgeW91IHVzZWQgdG8gd29yayBhdCBiZWZvcmUgeW91ciBmcmllbmQgZXhwbG9kZWQgaXQgdHJ5aW5nIHRvIG1ha2UgZmlyZXdvcmsgc2FuZHdpY2hlcy4gQ3V0dGxlZmlzaCBzdG9tcGluZyBncm91bmRzIGxpZSBlYXN0LicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludChcIkl0J3MgdGhlIHJ1aW5zIG9mIHRoZSBvbGQgU3RlYWsgYW5kIFNoYWtlIHlvdSB1c2VkIHRvIHdvcmsgYXQgdW50aWwgeW91ciBmcmllbmQgYmxldyBpdCB1cC4gVGhlIHRhdHRlcmVkIHJlbW5hbnRzIG9mIGEgcmVkIGFuZCB3aGl0ZSBhd25pbmcgZmx1dHRlcnMgaW4gdGhlIHdpbmQgYXMgaWYgdG8gc3VycmVuZGVyIHRvIGFuIGVuZW15LiBXaGF0IGlzIGxlZnQgb2YgYSBkb29yIGhhbmdzIG9uIGEgc2luZ2xlIGhpbmdlIHRvIHRoZSB3ZXN0LiBDdXR0bGVmaXNoIHN0b21waW5nIGdyb3VuZHMgbGllIGVhc3QuXCIpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBzdGVhaycpIG9yIEBtYXRjaGVzKCdsb29rIHNoYWtlJykgb3IgQG1hdGNoZXMoJ2xvb2sgYnVpbGRpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdZb3VyIG1lbW9yaWVzIG9mIHRoaXMgcGxhY2UgZG9uXFwndCBxdWl0ZSBtYXRjaCB3aGF0IGl0IGlzIG5vdy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3dlc3QnKSBvciBAbWF0Y2hlcygnb3BlbiBkb29yJykgb3IgQG1hdGNoZXMoJ2VudGVyJykgb3IgQG1hdGNoZXMoJ2luJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ0N1dHRsZWZpc2gnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuICAgICAgICAgICAgXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnQXMgeW91IGFwcHJvYWNoLCB0aGUgZG9vciBmYWxscyBjbGVhbiBvZmYgYXMgaWYgdG8gd2FybiB5b3UgYWdhaW5zdCBlbnRyeS4gTmV2ZXIgYmVpbmcgb25lIGZvciBvbWVucywgeW91IGlnbm9yZSBpdC4gSW5zaWRlIHlvdSBkaXNjb3ZlciB0aGluZ3MgbXVjaCBhcyB5b3UgcmVtZW1iZXIgdGhlbS4gVGhhdCBpcywgaWYgdGhleSBoYWQgYmVlbiBtYXVsZWQgYnkgYSBiZWFyIHdpdGggYmxlbmRlcnMgZm9yIGhhbmRzIHdobyBwcm9jZWVkZWQgdG8gc2V0IG9mZiBhIHNlcmllcyBvZiBwbGFzdGljIGV4cGxvc2l2ZXMuIFRvIHRoZSBzb3V0aCB0aGVyZSBhcmUgc29tZSB0YWJsZXMgYW5kIGNoYWlycywgbm9ydGggbGllcyB0aGUga2l0Y2hlbiwgYW5kIHdlc3QgYSBzb2RhIGZvdW50YWluLiBUaGUgb3V0ZG9vcnMgaXMgRWFzdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhlcmUgYXJlIHNvbWUgYmF0dGVyZWQgdGFibGVzIGFuZCBjaGFpcnMgc291dGgsIGEga2l0Y2hlbiBub3J0aCwgYW5kIGEgc29kYSBmb3VudGFpbiB3ZXN0LiBZb3UgY2FuIGV4aXQgRWFzdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEaW5pbmcgQXJlYSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoS2l0Y2hlbiknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTb2RhIEZvdW50YWluKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoRGluaW5nIEFyZWEpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0EgZGlsYXBpZGF0ZWQgZGluaW5nIGFyZWEgbGllcyBiZWZvcmUgeW91LiBJdCBpcyBjb21wbGV0ZWx5IHVucmVtYXJrYWJsZS4gVGhlcmUgaXMgbm93aGVyZSB0byBnbyBiZXNpZGVzIG5vcnRoIHRvIHRoZSB3YXkgeW91IGNhbWUuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbm9ydGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1dlbGNvbWUgdG8gdGhlIGtpdGNoZW4uIFNpbmNlIHRoZSB3YWxscyBoYXZlIGFsbCBiZWVuIGJsb3duIGF3YXkgb3IgZGlzc29sdmVkLCB0aGUgb25seSB0aGluZyB0aGF0IHNlcGFyYXRlcyBpdCBmcm9tIHRoZSByZXN0IG9mIHRoZSBwbGFjZSBpcyB0aGUgb3ZlbiBhbmQgc3RvdmUgdG9wLiBTb3V0aCBsZWFkcyBiYWNrIHRvIHRoZSBtYWluIGVudHJ5IGFyZWEuIFNvdXRoIGdvZXMgYmFjayB0byB0aGUgZG9vcndheS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG92ZW4nKSBvciBAbWF0Y2hlcygnb3BlbiBvdmVuJylcbiAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnc29kYScpXG4gICAgICAgICAgICAgICAgQHByaW50KCdDaGVjayBpdCBvdXQsIGl0XFwncyB5b3VyIGZhdm9yaXRlIHBvcCwgYSBDaGVycnkgT3JhbmdlIFNub3p6YmVycnkgTGltZSBQYXNzaW9uZnJ1aXQgVmFuaWxsYSBDcm9hayBpbiB0aGUgb3Zlbi4gV2hvIGV2ZXIgdGhvdWdodCBvZiBiYWtpbmcgYSBjYW4gb2Ygc29kYT8gU291dGggbGVhZHMgYmFjayB0byB0aGUgbWFpbiBlbnRyeSBhcmVhLicpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByaW50KCdUaGUgb3ZlbiBpcyBlbXB0eS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Nsb3NlIG92ZW4nKVxuICAgICAgICAgICAgQHByaW50KCdIb3cgcmVzcG9uc2libGUgb2YgeW91LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGdvdCBzb2RhLicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnc29kYScpXG5cbiAgICAgICAgZWxzZSBpZiBAZmxhZ0lzKCdoYXZlX2FsbF9pdGVtcycsIHRydWUpIGFuZCBAbWF0Y2hlcygnbWFrZSBwYW5jYWtlcycpXG4gICAgICAgICAgICBAc2V0RmxhZygnaGF2ZV9hbGxfaXRlbXMnLCBmYWxzZSlcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChEb29yd2F5KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnXCJXaGVyZSBkbyBJIHN0YXJ0P1wiIHlvdSB3b25kZXIgb3V0IGxvdWQuIElmIG9ubHkgdGhlcmUgd2VyZSB3cml0dGVuIHNlcmllcyBvZiBpbnN0cnVjdGlvbnMgZ3VpZGluZyB5b3UgdGhyb3VnaC4gV2hlcmUgd291bGQgeW91IGZpbmQgc29tZXRoaW5nIGxpa2UgdGhhdD8nKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdVxcJ3JlIHBvbmRlcmluZyB0aGlzIHdoZW4gYSBkcmFmdCBjb21lcyBvdmVyIHlvdS4gVGhlIGxpZ2h0cyBmbGlja2VyIG9uIGFuZCBvZmYuIFlvdSBzZW5zZSBhIG15c3RlcmlvdXMgcHJlc2VuY2UuIFRoZSBnaG9zdCBvZiB5b3VyIG9sZCBmcmllbmQgQ3JlZ2dsZXMgYXBwZWFycyBiZWZvcmUgeW91LiBBcHBhcmVudGx5IGhlIGlzIGhhdW50aW5nIHRoZSBTdGVhayBhbmQgU2hha2Ugbm93IGFuZCB5b3VcXCdyZSBhbGwgbGlrZSBcIkNyZWdnbGVzLCBkaWRuXFwndCB3ZSBqdXN0IGhhbmcgb3V0IHRoZSBvdGhlciBkYXk/IEhvdyBhcmUgeW91IGEgZ2hvc3QgYWxyZWFkeT9cIicpXG4gICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCc8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiTmV2ZXIgeW91IG1pbmQgdGhhdCBub3dcIjwvc3Bhbj4gaGUgc2F5cyBpbiBoaXMgY3JlZXB5IG5lcmQgdm9pY2UuIDxzcGFuIGNsYXNzPVwiY3JlZXB5XCI+XCJTaGFyYywgaWYgeW91IGhvcGUgdG8gc2F2ZSB0aGUgd29ybGQgZnJvbSBjZXJ0YWluIGRvb20sIHlvdSBtdXN0IHN1Y2NlZWQgaW4gbWFraW5nIHRoZXNlIHBhbmNha2VzLiBVc2UgdGhpcyBhbmNpZW50IHJlY2lwZSBoYW5kZWQgZG93biBmcm9tIHRoZSBhbmNpZW50cyB0byBhaWQgeW91LlwiPC9zcGFuPiBBbiBvbGQsIGJhdHRlcmVkIHBpZWNlIG9mIHBhcGVyIGZsb2F0cyBkb3duIGxhbmRpbmcgYmVmb3JlIHlvdSBcIlN3ZWV0IE1lZW1hd3MgU3dlZXR5IFN3ZWV0IEZsYXBqYWNrc1wiIGl0IHJlYWRzLiA8c3BhbiBjbGFzcz1cImNyZWVweVwiPlwiTm93IG15IHdvcmsgaXMgZG9uZSBhbmQgSSBjYW4gYXNjZW5kIHRvIG15IHN0ZXBtb21cXCdzIGhvdXNlIGZvciBncmlsbGVkIGNoZWVzZSBzYW5kd2ljaGVzIGFuZCBjaG9jb2xhdGUgbWlsay5cIjwvc3Bhbj4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdZb3UgcmVhZCB0aGUgcmVjaXBlLiBJdCBpcyBhbGwgaW4gcmlkZGxlcy4gWW91IGhvcGUgeW91IGFyZSB1cCB0byB0aGUgdGFzay4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBhbiBlbXB0eSBib3dsIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYW4gZW1wdHkgYm93bCBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdJbiBhbiB1cm4gdGFrZSBidXQgbm90IGNodXJuIGl0ZW1zIHR3byBub3QgbGlrZSBnb28uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb2RhJykgYW5kIEBoYXNJdGVtKCdzb2RhJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHB1dCB0aGUgc29kYSBpbnRvIHRoZSBib3dsLicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnSXQgbG9va3MgbGlrZSBzb21ldGhpbmcgaXMgc3RpbGwgbWlzc2luZy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Zsb3dlcnMnKSBhbmQgQGhhc0l0ZW0oJ2Zsb3dlcnMnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgcHV0IHRoZSBmbG91ciBpbnRvIHRoZSBib3dsLicpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIG5vdCBAaGFzSXRlbSgnc29kYScpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnSXQgbG9va3MgbGlrZSBzb21ldGhpbmcgaXMgc3RpbGwgbWlzc2luZy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvZGEgZmxvd2VycycpIGFuZCBAaGFzSXRlbSgnc29kYScpIGFuZCBAaGFzSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnZmxvd2VycycpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnc29kYScpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2YgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBwb3dkZXIgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91ciBwb3Rpb24gaXMgZHJ5LiBUaGlzIHdpbGxzdCBub3QgZmx5LiBXaGF0XFwncyBuZXh0IG11c3QgYmUgZHVtcGVkLCBwb3VyZWQgYW5kIGNyYWNrZWQgZm9yIGEgcHJvcGVyIGZsYXBqYWNrLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21pbGsgZWdnJykgb3IgQG1hdGNoZXMoJ21pbGsgbWFyZ2FyaW5lJykgb3IgQG1hdGNoZXMoJ2VnZyBtYXJnYXJpbmUnKVxuICAgICAgICAgICAgQHByaW50KCdTbG93IGRvd24gdGhlcmUgcGFydG5lciwgSSBjYW4gb25seSBoYW5kbGUgc28gbWFueSB0aGluZ3MgYXQgb25jZS4gVGVsbCB0aGVtIHRvIG1lIG9uZSBhdCBhIHRpbWUgcGxlYXNlLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ21pbGsnKSBhbmQgQGhhc0l0ZW0oJ21pbGsnKVxuICAgICAgICAgICAgQHByaW50KCdZb3UgcHV0IHRoZSBtaWxrIGludG8gdGhlIGJvd2wuJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdtaWxrJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5IGl0IGxvb2tzIGxpa2UgdGhhdCB3b3JrZWQhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgaWYgKG5vdCBAaGFzSXRlbSgnZWdnJykpIGFuZCAobm90IEBoYXNJdGVtKCdtYXJnYXJpbmUnKSlcbiAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBzbGlnaHRseSBtb3JlIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJylcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnSXQgbG9va3MgbGlrZSBzb21ldGhpbmcgaXMgc3RpbGwgbWlzc2luZy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdtYXJnYXJpbmUnKSBhbmQgQGhhc0l0ZW0oJ21hcmdhcmluZScpXG4gICAgICAgICAgICBAcmVtb3ZlSXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgIEBwcmludCgnSGV5IGl0IGxvb2tzIGxpa2UgdGhhdCB3b3JrZWQhJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgaWYgKG5vdCBAaGFzSXRlbSgnbWlsaycpKSBhbmQgKG5vdCBAaGFzSXRlbSgnZWdnJykpXG4gICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ0l0IGxvb2tzIGxpa2Ugc29tZXRoaW5nIGlzIHN0aWxsIG1pc3NpbmcuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWdnJykgYW5kIEBoYXNJdGVtKCdlZ2cnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ2VnZycpXG4gICAgICAgICAgICBAcHJpbnQoJ0hleSBpdCBsb29rcyBsaWtlIHRoYXQgd29ya2VkIScpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIGlmIChub3QgQGhhc0l0ZW0oJ21pbGsnKSkgYW5kIChub3QgQGhhc0l0ZW0oJ21hcmdhcmluZScpKVxuICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIHNsaWdodGx5IG1vcmUgZGFtcCBwb3dkZXIgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdJdCBsb29rcyBsaWtlIHNvbWV0aGluZyBpcyBzdGlsbCBtaXNzaW5nLicpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU3RlYWsgYW5kIFNoYWtlIChTcG9va3kgS2l0Y2hlbiB3aXRoIGJvd2wgb2Ygc2xpZ2h0bHkgbW9yZSBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdDdXR0aW5nIGFuZCBzY29vcGluZyBzaGFsbCBoYXZlIHRoZWlyIGRheSwgYnV0IGEgZm9yIGEgZmluZSBmbHVmZnkgYmF0dGVyIHRoZXJlIGJlIGJ1dCBvbmUgd2F5LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N0aXInKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKFNwb29reSBLaXRjaGVuIHdpdGggYm93bCBvZiBtaXhlZCBkYW1wIHBvd2RlciBzaXR0aW5nIHRoZXJlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NoYWtlJylcbiAgICAgICAgICAgIEBwcmludCgnRHVkZSwgd2hvIGRvIHlvdSB0aGluayB5b3UgYXJlLCBKYW1lcyBCb25kPyAgVGhpcyBiYXR0ZXIgbmVlZHMgdG8gYmUgc3RpcnJlZCwgbm90IHNoYWtlbi4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBib3dsIG9mIG1peGVkIGRhbXAgcG93ZGVyIHNpdHRpbmcgdGhlcmUpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1NldCB0aGUgZ3JpZGRsZSBvciBzdG92ZSB0byBtZWRpdW0gaGVhdC4gQWZ0ZXIgaXQgaXMgd2FybWVkLCBkcm9wIGJhdHRlciBhIHF1YXJ0ZXIgY3VwIGF0IGEgdGltZSBhbmQgdHVybmluZyBvbmNlIHVudGlsIGJ1YmJsZXMgYXBwZWFyLiBcIldlbGwgdGhhdCBzZWVtcyBwcmV0dHkgY2xlYXIuIEkgdGhpbmsgSSBjYW4gZG8gdGhhdCBvbiBteSBvd24uXCInKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBwbGF0ZSBvZiBkcnkgcGFuY2FrZXMgc2l0dGluZyB0aGVyZSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU3Bvb2t5IEtpdGNoZW4gd2l0aCBwbGF0ZSBvZiBkcnkgcGFuY2FrZXMgc2l0dGluZyB0aGVyZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGVuIG1pbnV0ZXMgbGF0ZXIgdGhlIHBhbmNha2VzIGFyZSBmaW5pc2hlZCwgYnV0IHNvbWV0aGluZyBpcyBtaXNzaW5nLicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3N5cnVwJykgb3IgQG1hdGNoZXMoJ21hcGxlJylcbiAgICAgICAgICAgIEByZW1vdmVJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBnb3QgcGFuY2FrZXMhICBIb3QgZGFuZy4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3BhbmNha2VzJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKEtpdGNoZW4pJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1N0ZWFrIGFuZCBTaGFrZSAoU29kYSBGb3VudGFpbiknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHNlZSB0aGF0IHRoZSBzb2RhIGZvdW50YWluIGhhcyBzb21laG93IHJlbWFpbmVkIGxhcmdlbHkgdW5kYW1hZ2VkLiBZb3UgdGhpbmsgYmFjayB0byB0aGUgZGF5cyB3aGVuIHlvdSB3b3VsZCBzbmVhayBvdXQgYmFncyBvZiBwbGFpbiBzeXJ1cCB0byBkcmluayBhbmQgdGhlIGZyZWFraXNoIHdha2luZyBkcmVhbXMgaXQgd291bGQgaW5kdWNlIGluIHlvdS4gWW91IHdvbmRlciBpZiB0aGVyZSBpcyBhbnkgc3RpbGwgaW4gdGhlcmUuIFRoZSBFYXN0IGRvb3IgZ29lcyBiYWNrIHRvIHRoZSBtYWluIGFyZWEuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmb3VudGFpbicpIG9yIEBtYXRjaGVzKCdvcGVuIGZvdW50YWluJykgb3IgQG1hdGNoZXMoJ2xvb2sgc29kYScpIG9yIEBtYXRjaGVzKCdvcGVuIHNvZGEnKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICAgICAgQHByaW50KCdBdmFzdCwgYSBoaWRkZW4gdHJlYXN1cmUgdHJvdmUgb2Ygc3VnYXJ5IHdvbmRlciB0aGF0IGhhcyBsYWluIGRvcm1hbnQgYWxsIHRoZXNlIHllYXJzISBZb3UgdHJlbWJsZSBhdCB0aGUgYmVhdXR5IG9mIHRoZSBzaWdodCBiZWZvcmUgeW91LiBTbyBtYW55IGJhZ3MgYW5kIHlldCB5b3VyIG1hZ2ljIGhhbW1lcnNwYWNlIHNhdGNoZWwgd2lsbCBvbmx5IGFsbG93IGZvciBvbmUuIFRoZXJlXFwncyBTcHJpdHosIFByb2Zlc3NvciBHaW5nZXIsIENhY3R1cyBMYWdlciwgYW5kIE1zLiBTaGltIFNoYW1cXCdzIE1hcGxlIFNvZGEuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0l0XFwncyB0aGF0IHNvZnQgZHJpbmsgZGlzcGVuc2VyIHlvdSBnb3QgYSBiYWcgb2Ygc3lydXAgZnJvbS4nKVxuXG4gICAgICAgIGVsc2UgaWYgbm90IEBoYXNJdGVtKCdzeXJ1cCcpXG4gICAgICAgICAgICBpZiBAbWF0Y2hlcygndGFrZSBzcHJpdHonKSBvciBAbWF0Y2hlcygnbG9vayBzcHJpdHonKVxuICAgICAgICAgICAgICAgIEBwcmludCgnU3ByaXR6LCBBIHJlZnJlc2hpbmcgYmxhc3Qgb2YgcGlja2xlIGFuZCBjZWxlcnk/IE5vIHdheS4nKVxuICAgICAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBwcm9mZXNzb3InKSBvciBAbWF0Y2hlcygndGFrZSBnaW5nZXInKSBvciBAbWF0Y2hlcygnbG9vayBwcm9mZXNzb3InKSBvciBAbWF0Y2hlcygnbG9vayBnaW5nZXInKVxuICAgICAgICAgICAgICAgIEBwcmludCgnUHJvZmVzc29yIGdpbmdlciwgNzIgZmxhdm9ycyBhbmQgYWxsIG9mIHRoZW0gbWFrZSBtZSBsb25nIGZvciBhIHF1aWNrIGRlYXRoLiBOb3BlIG5vcGUgbm9wZS4nKVxuICAgICAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZSBjYWN0dXMnKSBvciBAbWF0Y2hlcygndGFrZSBsYWdlcicpIG9yIEBtYXRjaGVzKCdsb29rIGNhY3R1cycpIG9yIEBtYXRjaGVzKCdsb29rIGxhZ2VyJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ0NhY3R1cyBsYWdlciwgWW91IHRoaW5rIHlvdSBzZWUgc29tZSBuZWVkbGVzIGZsb2F0aW5nIGluIHRoZXJlLiBDb21lIG9uIG1hbi4nKVxuXG4gICAgICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1hcGxlJykgb3IgQG1hdGNoZXMoJ2xvb2sgc2hpbScpIG9yIEBtYXRjaGVzKCdsb29rIHNoYW0nKSBvciBAbWF0Y2hlcygnbG9vayBtcycpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZdW0geXVtIHNvZGEgdGhpcyBvbmVzIGxvb2tzIHRhc3R5LicpXG5cbiAgICAgICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgbWFwbGUnKSBvciBAbWF0Y2hlcygndGFrZSBzaGltJykgb3IgQG1hdGNoZXMoJ3Rha2Ugc2hhbScpIG9yIEBtYXRjaGVzKCd0YWtlIG1zJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBmaW5kIGl0IHNob2NraW5nIHRoYXQgeW91IGFyZSB0aGUgZmlyc3QgcmFpZGVyIG9mIHRoaXMgc29kYSB0b21iLiBCdXQgdGhlbiBhZ2FpbiwgeW91IGhhdmUgYWx3YXlzIHNhaWQgcGVvcGxlIGRvblxcJ3Qga25vdyB0aGUgdmFsdWUgb2YgYSBiYWcgb2YgbGlxdWlkIHN1Z2FyLicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ3N5cnVwJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZScpIG9yIEBtYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1l1cCB0aGVyZSBpcyBhIGxvdCBvZiBzb2RhIGluIHRoZXJlLCBidXQgeW91IGFscmVhZHkgcGlja2VkIG9uZS4gTm93IGdvIGxpdmUgd2l0aCB5b3VyIGNob2ljZS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTdGVhayBhbmQgU2hha2UgKERvb3J3YXkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCcsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGp1c3Qgd2Fsa2VkIG9udG8gdGhlIHNldCBvZiB0aGUgd2lsZGx5IHBvcHVsYXIgZ2FtZSBzaG93LCBcIlNlYWwgb3IgTm8gU2VhbCFcIiBXaGVyZSBmbGFtYm95YW50IGNvbnRlc3RhbnRzIGZsYWlsIGFyb3VuZCBhbmQgc2hvdXQgd2hpbGUgdHJ5aW5nIHRvIGFycml2ZSBhdCB0aGUgYW5zd2VyIHRvIHRoYXQgYWdlIG9sZCBxdWVzdGlvbi4uLlNFQUwgT1IgTk8gU0VBTD8gVG8gdGhlIGVhc3QgaXMgYmFja3N0YWdlLCBub3J0aCB3aWxsIHRha2UgeW91IHRvIHRoZSBkcmVzc2luZyByb29tLCB3ZXN0IHRvIHNvbWUgb2NlYW4sIGFuZCBzb3V0aCB0byBCaWxseSBPY2Vhbi4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBvbiB0aGUgc2V0IGZvciBTZWFsIG9yIG5vIFNlYWwsIHRoZSBnYW1lIHNob3cuIFlvdSBqdXN0IHJlYWxpemVkIHlvdSBtdXN0IGZpbmQgYSB3YXkgdG8gYmVjb21lIGEgY29udGVzdGFudCBvciB5b3VyIGxpZmUgd2lsbCBoYXZlIGJlZW4gd2FzdGVkLiBUbyB0aGUgZWFzdCBpcyBiYWNrc3RhZ2UsIG5vcnRoIHdpbGwgdGFrZSB5b3UgdG8gdGhlIGRyZXNzaW5nIHJvb20sIHdlc3QgdG8gc29tZSBvY2VhbiwgYW5kIHNvdXRoIHRvIEJpbGx5IE9jZWFuLicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnT2ggd293ISBTZWFsIG9yIG5vIFNlYWwhIFlvdSBsb3ZlIGl0IHdoZW4gdGhlIGhvc3QgbG9va3MgcmlnaHQgYXQgdGhlIGNhbWVyYSBhbmQgc2F5cyB0aGF0LiBJdOKAmXMgc28gaW50ZW5zZS4gVGhlcmUgaGFzIHRvIGJlIHNvbWUgd2F5IHRvIGdldCBvbiB0aGlzIHNob3cuIFRvIHRoZSBlYXN0IGlzIGJhY2tzdGFnZSwgbm9ydGggd2lsbCB0YWtlIHlvdSB0byB0aGUgZHJlc3Npbmcgcm9vbSwgd2VzdCB0byBzb21lIG9jZWFuLCBhbmQgc291dGggdG8gQmlsbHkgT2NlYW4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdlYXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dldHRlciBPY2VhbicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnQmlsbHkgT2NlYW4nKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGlzIHBsYWNlIGlzIGdyZWF0ISBJdCB3b3VsZCBiZSBlYXN5IHRvIGNvYmJsZSB0b2dldGhlciBhIGNvc3R1bWUgdG8gZ2V0IG9uIHRoYXQgc2hvdy4gTGV0cyBzZWUgd2hhdCB3ZSBjYW4gZmluZC4gT2J2aW91cyBleGl0cyBhcmUgc291dGggdG8gdGhlIHNob3cgZW50cmFuY2UuJylcbiAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NvdXRoJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjb3N0dW1lJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBIZWFkZ2VhciknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgSGVhZGdlYXIpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpIG9yIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ0xldFxcJ3Mgc3RhcnQgd2l0aCBoZWFkZ2Vhci4gWW91IHNlZSBhIGNvd2JveSBoYXQsIGEgcmFpbmJvdyB3aWcsIGEgbW90b3JjeWNsZSBoZWxtZXQsIGFuZCBhIHN0b3ZlcGlwZSBoYXQuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdjb3dib3kgaGF0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdjb3dib3kgaGF0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBDbG90aGVzKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygncmFpbmJvdyB3aWcnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3JhaW5ib3cgd2lnJylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBDbG90aGVzKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbW90b3JjeWNsZSBoZWxtZXQnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBDbG90aGVzKScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc3RvdmVwaXBlIGhhdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnc3RvdmVwaXBlIGhhdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcyknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQ2xvdGhlcyknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnTm93IHNlbGVjdCBhIHNldCBvZiBjbG90aGVzLiBZb3Ugc2VlIGEgY293IHByaW50IHZlc3QsIGEgY2xvd24gc3VpdCwgYSBsZWF0aGVyIGphY2tldCwgYW5kIGFuIG9sZHRpbWV5IHN1aXQgd2l0aCBvbmUgb2YgdGhvc2UgQ29sb25lbCBTYW5kZXJzIHRpZXMnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xlYXRoZXIgamFja2V0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdsZWF0aGVyIGphY2tldCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnY2xvd24gc3VpdCcpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnY2xvd24gc3VpdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoRHJlc3NpbmcgUm9vbSAtIFBpY2sgQWNjZXNzb3J5KScpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnb2xkdGltZXknKSBvciBAbWF0Y2hlcygndGllcycpIG9yIEBtYXRjaGVzKCdjb2xvbmVsJykgb3IgQG1hdGNoZXMoJ3NhbmRlcnMnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ29sZHRpbWV5IHN1aXQnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIEFjY2Vzc29yeSknKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2NvdyB2ZXN0Jykgb3IgQG1hdGNoZXMoJ3ByaW50IHZlc3QnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2NvdyBwcmludCB2ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChEcmVzc2luZyBSb29tIC0gUGljayBBY2Nlc3NvcnkpJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKERyZXNzaW5nIFJvb20gLSBQaWNrIEFjY2Vzc29yeSknLCAtPlxuICAgICAgICBkb25lID0gJ1lvdSBsb29rIGFic29sdXRlbHkgaG9ycmlibGUhIE9yIGFtYXppbmcsIGRlcGVuZGluZyBvbiB5b3VyIHBlcnNwZWN0aXZlLiBCdXQgdGhlIHRydWUganVkZ2Ugd2lsbCBiZSB0aGUgZ2FtZSBzaG93IG1hbmFnZXIuJ1xuXG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdBY2Nlc3Nvcml6ZSEgUGljayBmcm9tIGEgZ3VuIGJlbHQsIGEgcnViYmVyIGNoaWNrZW4sIGEgbWV0YWwgY2hhaW4sIGFuZCBhIGZha2UgYmVhcmQuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdmYWtlIGJlYXJkJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdmYWtlIGJlYXJkJylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2d1biBiZWx0JylcbiAgICAgICAgICAgIEBnZXRJdGVtKCdndW4gYmVsdCcpXG4gICAgICAgICAgICBAcHJpbnQoZG9uZSlcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdtZXRhbCBjaGFpbicpXG4gICAgICAgICAgICBAZ2V0SXRlbSgnbWV0YWwgY2hhaW4nKVxuICAgICAgICAgICAgQHByaW50KGRvbmUpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChCYWNrc3RhZ2UpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ3J1YmJlciBjaGlja2VuJylcbiAgICAgICAgICAgIEBwcmludChkb25lKVxuICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1NlYWwgb3IgTm8gU2VhbCAoQmFja3N0YWdlKScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGNvc3R1bWVNYXRjaGVzID0gKGVuZ2luZSkgLT5cbiAgICAgICAgZ3JvdXAxID0gMFxuICAgICAgICBncm91cDIgPSAwXG4gICAgICAgIGdyb3VwMyA9IDBcbiAgICAgICAgZ3JvdXA0ID0gMFxuXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjb3dib3kgaGF0JykgdGhlbiBncm91cDErK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnY293IHByaW50IHZlc3QnKSB0aGVuIGdyb3VwMSsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdndW4gYmVsdCcpIHRoZW4gZ3JvdXAxKytcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgncmFpbmJvdyB3aWcnKSB0aGVuIGdyb3VwMisrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdjbG93biBzdWl0JykgdGhlbiBncm91cDIrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgncnViYmVyIGNoaWNrZW4nKSB0aGVuIGdyb3VwMisrXG5cbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ21vdG9yY3ljbGUgaGVsbWV0JykgdGhlbiBncm91cDMrK1xuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnbGVhdGhlciBqYWNrZXQnKSB0aGVuIGdyb3VwMysrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdtZXRhbCBjaGFpbicpIHRoZW4gZ3JvdXAzKytcblxuICAgICAgICBpZiBlbmdpbmUuaGFzSXRlbSgnc3RvdmVwaXBlIGhhdCcpIHRoZW4gZ3JvdXA0KytcbiAgICAgICAgaWYgZW5naW5lLmhhc0l0ZW0oJ29sZHRpbWV5IHN1aXQnKSB0aGVuIGdyb3VwNCsrXG4gICAgICAgIGlmIGVuZ2luZS5oYXNJdGVtKCdmYWtlIGJlYXJkJykgdGhlbiBncm91cDQrK1xuXG4gICAgICAgIHJldHVybiBNYXRoLm1heChncm91cDEsIGdyb3VwMiwgZ3JvdXAzLCBncm91cDQpXG5cbiAgICByZW1vdmVBbGxDb3N0dW1lSXRlbXMgPSAoZW5naW5lKSAtPlxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnY293Ym95IGhhdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdyYWluYm93IHdpZycpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdtb3RvcmN5Y2xlIGhlbG1ldCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdzdG92ZXBpcGUgaGF0JylcblxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnY293IHByaW50IHZlc3QnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnY2xvd24gc3VpdCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdsZWF0aGVyIGphY2tldCcpXG4gICAgICAgIGVuZ2luZS5yZW1vdmVJdGVtKCdvbGR0aW1leSBzdWl0JylcblxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnZ3VuIGJlbHQnKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgncnViYmVyIGNoaWNrZW4nKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnbWV0YWwgY2hhaW4nKVxuICAgICAgICBlbmdpbmUucmVtb3ZlSXRlbSgnZmFrZSBiZWFyZCcpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBpcyB0aGUgc3RhZ2UuIEl0IGlzIGp1c3QgYXMgc3R1cGlkIGxvb2tpbmcgYXMgdGhlIHJlc3Qgb2YgdGhlIHNob3cuIE9idmlvdXMgZXhpdHMgYXJlIHdlc3QgdG8gdGhlIHNob3dcXCdzIGVudHJhbmNlLiBUaGUgc2hvdyBtYW5hZ2VyIHN0YXJlcyBhdCB5b3UgcXVlc3Rpb25pbmdseS4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3RhbGsgbWFuYWdlcicpXG4gICAgICAgICAgICBzd2l0Y2ggY29zdHVtZU1hdGNoZXMoQClcbiAgICAgICAgICAgICAgICB3aGVuIDBcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdUaGUgc2hvdyBtYW5hZ2VyIGFwb2xvZ2l6ZXMsIFwiSSBhbSBzb3JyeSBzaXIsIHlvdSBsb29rIGxpa2UgYSBkZWNlbnQga2luZCBvZiBwZXJzb24sIGFuZCBJXFwnbSBhZnJhaWQgd2UgaGF2ZSBubyBwbGFjZSBmb3IgdGhhdCBvbiB0ZWxldmlzaW9uLiBNYXliZSBpZiB5b3UgY2FtZSBiYWNrIGRyZXNzZWQgbGlrZSBhIG1hbmlhYyB3ZSBjb3VsZCB3b3JrIHNvbWV0aGluZyBvdXQuJylcbiAgICAgICAgICAgICAgICB3aGVuIDNcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCdUaGUgc2hvdyBtYW5hZ2VyIGxvb2tzIHlvdSBvdmVyLCBub3RpY2luZyBnb29kIHRhc3RlLCB5b3VyIGtuYWNrIGZvciBmbGFpciBhbmQgYXR0ZW50aW9uIHRvIGRldGFpbC4gSGUgZGVjbGFyZXMgXCJXZWxsLCBJIGFwcHJlY2lhdGUgeW91IHRha2luZyB0aW1lIHRvIGFzc2VtYmxlIHRoZSBjb3N0dW1lLCBidXQgaXQgaXMganVzdCBhIGJpdCB0b28gb3JkZXJseS4gWW91IHJlYWxseSBhcmVuXFwndCB3aGF0IHdlIGFyZSBsb29raW5nIGZvci5cIicpXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyhAKVxuICAgICAgICAgICAgICAgIHdoZW4gMlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoZSBzaG93IG1hbmFnZXIgbG9va3MgcGxlYXNlZCwgeWV0IGEgdG91Y2ggdHJvdWJsZWQuIFwiWW91IGxvb2sgdG8gYmUgYSBtYW4gZ29pbmcgaW4gdGhlIHJpZ2h0IGRpcmVjdGlvbiwgYnV0IHdlIG9ubHkgc2VsZWN0IHRoZSBiZXN0IG9mIHRoZSBiZXN0IGZvciBTZWFsIG9yIG5vIFNlYWwuIFlvdXIgY29zdHVtZSBpcyBub3QgcXVpdGUgcmVhZHkgZm9yIHRoZSBiaWcgc2hvdyB5ZXQuJylcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlQWxsQ29zdHVtZUl0ZW1zKEApXG4gICAgICAgICAgICAgICAgd2hlbiAxXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJPaCwgd293IVwiIEV4Y2xhaW1zIHRoZSBzaG93IG1hbmFnZXIuIFwiWW91IGxvb2sgYWJzb2x1dGVseSBhd2Z1bC4gWW91IGRlZmluaXRlbHkgaGF2ZSB0aGUgbG9vayBmb3Igb3VyIHNob3cuXCIgWW91IHN0YXJ0IHRvIGRhbmNlIGFyb3VuZCwgd2hvb3BpbmcgYW5kIGhvbGxlcmluZywgZGVjbGFyaW5nIHlvdXJzZWxmIHRoZSBmdXR1cmUga2luZyBvZiB0aGUgd29ybGQuIFwiQW5kIEkgc2VlIHlvdSBoYXZlIHRoZSBjaGFyaXNtYSB0byBtYXRjaC5cIiBIZSB0dXJucyB0byBoaXMgYXNzaXN0YW50LCBcIkdldCB0aGlzIGZlbGxhIG9uIHN0YWdlIGF0IG9uY2UuJylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsIChPbiBTdGFnZSEpJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnU2VhbCBvciBObyBTZWFsJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1NlYWwgb3IgTm8gU2VhbCAoT24gU3RhZ2UhKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdcIldlbGNvbWUgYmFjayB0byB0aGUgU2VhbCBvciBObyBTZWFsLCB0aGUgbW9zdCBwb3B1bGFyIGdhbWUgc2hvdyB1bmRlciB0aGUgc2VhISBJXFwnbSB5b3VyIHdlbGwgdGFubmVkIGhvc3QgSmVycnkgWmludGVydmFuZGVyYmluZGVyYmF1ZXIgSnIuIExldFxcJ3MgbWVldCBvdXIgbmV4dCBjb250ZXN0YW50OiBTaGFyYyEgQW4gaW5jcmVkaWJseSBvYm5veGlvdXMgeWV0IHBlcnN1YXNpdmUgeW91bmcgb2NlYW4gZHdlbGxlciwgaGUgbG92ZXMgYW5ub3lpbmcgaGlzIGZyaWVuZHMgYW5kIGlzIGFsd2F5cyB1cCBmb3IgYSByb3VuZCBvZiBTY3JhYmJsZSwgTEFESUVTLiBUaW1lIHRvIGdldCBzdGFydGVkLiBOb3csIFNoYXJjIEkgYW0gZ29pbmcgdG8gcHJlc2VudCB5b3Ugd2l0aCBhIGJyaWVmY2FzZS4gSW4gdGhpcyBicmllZmNhc2UsIHRoZXJlIG1pZ2h0IGJlIGEgc2VhbCBvciB0aGVyZSBtaWdodCBub3QgYmUgYSBzZWFsLiBBbmQgSSBuZWVkIHlvdSB0byB0ZWxsIG1lIHdoaWNoIGl0IGlzOiBTRUFMIG9yIE5PIFNFQUw/XCInKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3NlYWwnKVxuICAgICAgICAgICAgQHByaW50KCdKZXJyeSBzbG93bHkgb3BlbnMgdGhlIGJyaWVmY2FzZSwgcGVla2luZyBpbnNpZGUgZmlyc3QgdG8gZGV0ZWN0IGFueSBzaWducyBvZiBzZWFsIGVudHJhaWxzIGFuZCB0aGVuLi4uJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgaWYgQHBlcmNlbnRDaGFuY2UoNTApXG4gICAgICAgICAgICAgICAgICAgIEBwcmludCgnLi4ud2VhcmluZyBhIGZhY2Ugb2YgcHJhY3RpY2VkIGRpc2FwcG9pbnRtZW50IGFuZCBlbXBhdGh5LCB3aGltcGVycyBcIlRvbyBiYWQsXCIgbGV0dGluZyB0aGUgY2FzZSBvcGVuIHRoZSByZXN0IG9mIHRoZSB3YXkuIEF0IHRoaXMsIHlvdSBhcmUgcHJvbXB0bHkgdXNoZXJlZCBvZmYgdGhlIHN0YWdlIHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzdWNrZXIuJylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyhAKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHByaW50KCcuLi5leGNpdGVkbHkgcHVsbHMgaXQgYWxsIHRoZSB3YXkgb3Blbi4gXCJIZVxcJ3MgcmlnaHQgcGVvcGxlIVwiJylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnXCJOb3csIGxldFxcJ3Mgc2VlIHlvdXIgcHJpemVzLlwiIFwiUHJpemVzIGlzIHJpZ2h0IEplcnJ5LFwiIHNheXMgYSB2b2ljZSBjb21pbmcgZnJvbSBub3doZXJlIGFuZCBldmVyeXdoZXJlIGFsbCBhdCBvbmNlLiBcIkhlcmUgYXJlIHNvbWUgd29ybGQgY2xhc3Mgc2VsZWN0aW9ucyBJIHBpY2tlZCB1cCBmcm9tIHRoZSBncm9jZXJ5IHN0b3JlIG9uIHRoZSB3YXkgaGVyZSB0aGlzIG1vcm5pbmc6XCInKVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiU3VjY2VzcyBjb21lcyBpbiBjYW5zLCBub3QgaW4gY2FuIG5vdHMuIFRpbiBjYW5zIHRoYXQgaXMhIFRoYXRcXCdzIHdoeSB3ZSBhcmUgb2ZmZXJpbmcgeW91IHRoZSBjaG9pY2Ugb2YgYSBmdWxsIHdlZWtcXCdzIHN1cHBseSBvZiBcXCdDYXB0YWluIE5lZFxcJ3MgUGlja2xlZCBIZXJyaW5nXFwnLCBvciBcXCdObyBJZnMgQW5kcyBvciBCdXR0ZXJcXCcgYnJhbmQgbWFyZ2FyaW5lIHNwcmVhZCB0eXBlIHByb2R1Y3QgZm9yIHlvdXIgY29uc3VtcHRpb24gcGxlYXN1cmUuICBOYXR1cmFsbHkgeW91IGNob29zZSB0aGUgbWFyZ2FyaW5lIGJlY2F1c2UgeW91IGFyZSBoZWFsdGggY29uc2Npb3VzIG9yIHNvbWV0aGluZy4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUFsbENvc3R1bWVJdGVtcyhAKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ2V0SXRlbSgnbWFyZ2FyaW5lJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGdvVG9Sb29tKCdTZWFsIG9yIE5vIFNlYWwgKEJhY2tzdGFnZSknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQnLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIGlmIEBjb21pbmdGcm9tKFsnV2F0ZXIgV29ybGQgKE1hbmF0ZWUgRXhoaWJpdCknLCAnV2F0ZXIgV29ybGQgKEdpZnQgU2hvcCknXSlcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1lvdSBhcmUgYmFjayBhdCB0aGUgV2F0ZXIgV29ybGQgZ2F0ZS4gVGhlIGV4aXQgaXMgcmlnaHQgb3ZlciB0aGVyZSEgSnVzdCBhIGxpdHRsZSBiaXQgZnVydGhlciBhbmQgeW91IGNhbiBsZWF2ZS4gUGxlYXNlIGNhbiB3ZSBsZWF2ZSBub3c/JylcbiAgICAgICAgICAgIGVsc2UgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnT2ggbWFuLCBXYXRlciBXb3JsZCEgWW91IGxvdmUgdGhhdCBtb3ZpZS4gS2V2aW4gQ29zdG5lciBzaG91bGQgaGF2ZSB0b3RhbGx5IGdvdHRlbiB0aGUgT3NjYXIuIFdhaXQgdGhpcyBpc25cXCd0IGxpa2UgdGhhdC4gVGhpcyBpcyBXYXRlciBXb3JsZCwgdGhlIGhvbWUgb2YgdGhhdCBzdHVwaWQga2lsbGVyIHdoYWxlLCBTaGFtcHUuIFdoYXQgYSBoYWNrISBPYnZpb3VzIGV4aXRzIGFyZSBub3J0aCB0byB0aGUgTWFuYXRlZSBzaG93LCBlYXN0IHRvIHRoZSBnaWZ0IHNob3AsIGFuZCBzb3V0aCB0byB0aGUgQWNodGlwdXNcXCdzIGdhcmRlbi4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnT2ggZ3JlYXQsIFdhdGVyIFdvcmxkIGFnYWluLiBZb3Ugd2VyZSBob3Bpbmcgb25jZSB3b3VsZCBiZSBlbm91Z2ggdG8gbGFzdCB5b3UgYSBsaWZldGltZS4gT2J2aW91cyBleGl0cyBhcmUgbm9ydGggdG8gdGhlIE1hbmF0ZWUgc2hvdywgZWFzdCB0byB0aGUgZ2lmdCBzaG9wLCBhbmQgc291dGggdG8gdGhlIEFjaHRpcHVzXFwncyBnYXJkZW4uJylcbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdXZWxsLCB0aGlzIGlzIGl0IHRoZSBXYXRlciBXb3JsZCBlbnRyYW5jZSB3aGVyZSBhbGwgeW91ciBtYXJpbmUgZHJlYW1zIGFuZCBuaWdodG1hcmVzIGNvbWUgdHJ1ZS4gT2J2aW91cyBleGl0cyBhcmUgbm9ydGggdG8gdGhlIE1hbmF0ZWUgc2hvdywgZWFzdCB0byB0aGUgZ2lmdCBzaG9wLCBhbmQgc291dGggdG8gdGhlIEFjaHRpcHVzXFwncyBnYXJkZW4uJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdub3J0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnZWFzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChHaWZ0IFNob3ApJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnc291dGgnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdBY2h0aXB1c1xcJ3MgR2FyZGVuJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkIChNYW5hdGVlIEV4aGliaXQpJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpXG4gICAgICAgICAgICBpZiBAaXNGaXJzdFRpbWVFbnRlcmluZygpXG4gICAgICAgICAgICAgICAgQHByaW50KCdBbmQgdGhlcmUgaXQgaXM6IFRoZSBpbGx1c3RyaW91cyBtYW5hdGVlLiBZb3UgY2FuIHNlZSB3aHkgdGhlIHN0YW5kcyBhcmUgZW1wdHkuIFRoZXJlIGFyZSBiaWcgdW1icmVsbGFzIGF0dGFjaGVkIHRvIHNvbWUgcGljbmljIHRhYmxlczsgbm90IG11Y2ggdG8gc2VlLiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBNYW5hdGVlIHNlcnZpY2Ugcm9vbSBhbmQgc291dGggdG8gdGhlIHBhcmsgZW50cmFuY2UuJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1dlbGwsIHRoZSBtYW5hdGVlIGV4aGliaXQgaXMgc3RpbGwgYSBkdW1wLiBBIGJ1bmNoIG9mIHRvdXJpc3QgZmFtaWxpZXMgYXJlIGRldm91cmluZyB0aGVpciBmb29kIGF0IHNvbWUgdGFibGVzIHdpdGggdW1icmVsbGFzLiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBNYW5hdGVlIHNlcnZpY2Ugcm9vbSBhbmQgc291dGggdG8gdGhlIHBhcmsgZW50cmFuY2UuJylcblxuICAgICAgICBlbHNlIGlmIEBleGFjdGx5TWF0Y2hlcygnbG9vaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZXJlIGlzIGJpZyB3b29kZW4gYXJjaCBkaXNwbGF5IHdpdGggbG90cyBvZiBwZWVsaW5nIHBhaW50IHN1cnJvdW5kZWQgYnkgeW91ciBzdGFuZGFyZCBzZW1pY2lyY2xlIHN0b25lIHNlYXRpbmcgYXJyYW5nZW1lbnQuIFNvbWUgcGljbmljIHRhYmxlcyB3aXRoIHVtYnJlbGxhcyBhcmUgbmVhcmJ5LiBPYnZpb3VzIGV4aXRzIGFyZSB3ZXN0IHRvIHRoZSBNYW5hdGVlIHNlcnZpY2Ugcm9vbSBhbmQgc291dGggdG8gdGhlIHBhcmsgZW50cmFuY2UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIHVtYnJlbGxhJylcbiAgICAgICAgICAgIEBwcmludCgnV2hhdCwgeW91IGhhdmUgbmV2ZXIgc2VlbiBhbiB1bWJyZWxsYT8gVGhleSBhcmUgcmVkIGFuZCB3aGl0ZSBhbmQgY292ZXJlZCBpbiBhbGdhZS4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWtlIHVtYnJlbGxhJylcbiAgICAgICAgICAgIEBnZXRJdGVtKCd1bWJyZWxsYScpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzdGVhbHRoaWx5IGFwcHJvYWNoIGFuIGVtcHR5IHRhYmxlIGFuZCBzaG92ZSBpdHMgdW1icmVsbGEgdW5kZXIgeW91ciBmaW4gYW5kIHN0dW1ibGUgYXdheS4gRXZlcnlvbmUgbG9va3MgYXQgeW91IGxpa2UgdGhpcyBoYXBwZW5zIGEgbG90LicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnd2VzdCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkIChNZWNoYW5pY2FsIFJvb20gVHlwZSBQbGFjZSknKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdzb3V0aCcpXG4gICAgICAgICAgICBAZ29Ub1Jvb20oJ1dhdGVyIFdvcmxkJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRyeVVuaXZlcnNhbENvbW1hbmRzKClcblxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1dhdGVyIFdvcmxkIChHaWZ0IFNob3ApJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBlbnRlciB0aGUgV2F0ZXIgV29ybGQgZ2lmdCBzaG9wLiBUaGVyZSBhcmUgYWxsIHNvcnRzIG9mIGdyZWF0IGl0ZW1zIGhlcmU6IGEgZ2lhbnQgc3R1ZmZlZCBvY3RvcHVzLCBkZWh5ZHJhdGVkIGFzdHJvbmF1dCBmaXNoIGZvb2QsIGp1bmlvciBtYXJpbmUgc2hlcmlmZiBiYWRnZSBzdGlja2VycywgYW5kIHNvbWUgb2YgdGhhdCBjbGF5IHNhbmQgY3JhcCB0aGV5IHVzZWQgdG8gYWR2ZXJ0aXNlIG9uIFRWLiBTZWUgYW55dGhpbmcgeW91IGxpa2U/IFdlc3QgdG8gdGhlIHBhcmsgZW50cmFuY2UuJylcbiAgICAgICAgZWxzZSBpZiBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgQHByaW50KCdUaGVyZSBhcmUgYWxsIHNvcnRzIG9mIGdyZWF0IGl0ZW1zIGhlcmU6IGEgZ2lhbnQgc3R1ZmZlZCBvY3RvcHVzLCBkZWh5ZHJhdGVkIGFzdHJvbmF1dCBmaXNoIGZvb2QsIGp1bmlvciBtYXJpbmUgc2hlcmlmZiBiYWRnZSBzdGlja2VycywgYW5kIHNvbWUgb2YgdGhhdCBjbGF5IHNhbmQgY3JhcCB0aGV5IHVzZWQgdG8gYWR2ZXJ0aXNlIG9uIFRWLiBTZWUgYW55dGhpbmcgeW91IGxpa2U/IFdlc3QgdG8gdGhlIHBhcmsgZW50cmFuY2UuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG9jdG9wdXMnKVxuICAgICAgICAgICAgQHByaW50KCdVc3VhbGx5IHlvdSBoYXZlIHRvIGtub2NrIG92ZXIgYSBzdGFjayBvZiBvbGQgbWlsayBib3R0bGVzIHRvIGdldCBzdHVmZmVkIGFuaW1hbHMgb2YgdGhpcyBxdWFsaXR5LicpXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2xvb2sgc2FuZCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1dvdywgeW91IHJlbWVtYmVyIHRoaXMgc3R1ZmYuIEl0IHNheXMgb24gdGhlIGJveCBpdHMgdGhlIG9ubHktc3RheS1kcnkgc2FuZCBjcmFwIHVzZWQgYnkgU2hhbXB1IGhpbXNlbGYuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBiYWRnZXMnKVxuICAgICAgICAgICAgQHByaW50KCdDb29sISBBbmQgeW91IGRvbuKAmXQgZXZlbiBoYXZlIHRvIGNvbXBsZXRlIGFueSBjbGFzc2VzIGluIGp1bmlvciBtYXJpbmUgc2hlcmlmZiBzY2hvb2wuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygnbG9vayBmaXNoJykgb3IgQG1hdGNoZXMoJ2xvb2sgZm9vZCcpXG4gICAgICAgICAgICBAcHJpbnQoJ1RoZXkgaGF2ZSBrZWxwLCBrcmlsbCwgYWxnYWUsIGFuZCBpY2UgY3JlYW0gZmxhdm9ycy4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ3Rha2UgYmFkZ2UnKVxuICAgICAgICAgICAgQGdldEl0ZW0oJ2JhZGdlJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IHRha2UgdGhlIGp1bmlvciBtYXJpbmUgc2hlcmlmZiBiYWRnZSBzdGlja2VycyB0byB0aGUgY291bnRlci4gVGhlIGNhc2hpZXIgc2F5cyB0aGV5IGFyZSBvbiBzYWxlLCBvbmx5IDE1IGZpc2ggZG9sbGFycywgcGx1cyB0YXguIFl1c3Nzcy4gWW91IHBheSB0aGUgbWFuLicpXG5cbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFrZScpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSB0YWtlIHRoYXQgaXRlbSB0byB0aGUgY291bnRlci4gVGhlIGNhc2hpZXIgc2F5cyBpdCBpcyAnICsgKDE4ICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMzApKS50b1N0cmluZygpICsgXCIgZmlzaCBkb2xsYXJzIGJ1dCB5b3Ugb25seSBoYXZlICN7aWYgQGhhc0l0ZW0oJ2JhZGdlJykgdGhlbiAyIGVsc2UgMTd9IGZpc2ggZG9sbGFycy4gTnV0cy5cIilcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd3ZXN0JylcbiAgICAgICAgICAgIEBnb1RvUm9vbSgnV2F0ZXIgV29ybGQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnV2F0ZXIgV29ybGQgKE1lY2hhbmljYWwgUm9vbSBUeXBlIFBsYWNlKScsIC0+XG4gICAgICAgIGlmIEBleGFjdGx5TWF0Y2hlcygnX19lbnRlcl9yb29tX18nKSBvciBAZXhhY3RseU1hdGNoZXMoJ2xvb2snKVxuICAgICAgICAgICAgaWYgQGlzRmlyc3RUaW1lRW50ZXJpbmcoKVxuICAgICAgICAgICAgICAgIEBwcmludCgnV2hhdCBpbiB0aGUgbmFtZSBvZiBDYXB0YWluIE5lbW8gaXMgdGhpcz8gVGhlcmUgYXJlIG1hbmF0ZWVzIGluIGhvaXN0cyBhbGwgb3ZlciB0aGUgcm9vbSBob29rZWQgdXAgdG8uLi5taWxraW5nIGRldmljZXMuIFRoaXMgaXMgbm8gbWVjaGFuaWNhbCByb29tISBJdFxcJ3MgYSBjb3ZlciBmb3IgYSBzZWNyZXQsIGlsbGVnYWwsIHVuZGVyZ3JvdW5kLCBibGFjayBtYXJrZXQsIGJ1dCBwcm9iYWJseSBvcmdhbmljLCBzZWEgY293IG1pbGtpbmcgb3BlcmF0aW9uLiBUaGUgZmllbmRzISBZb3UgYXJlIGdvaW5nIHRvIGJsb3cgdGhlIGxpZCBvZmYgdGhpcyB0aGluZyBmb3Igc3VyZS4gVGhlIHN3ZWF0eSBvbGQgZmlzaCBydW5uaW5nIHRoZSBtYWNoaW5lcnkgaGFzIG5vdCBub3RpY2VkIHlvdSB5ZXQuIE9idmlvdXMgZXhpdHMgYXJlIGVhc3QgdG8gdGhlIG1hbmF0ZWUgZXhoaWJpdC4nKVxuICAgICAgICAgICAgZWxzZSBpZiBub3QgQGhhc0l0ZW0oJ2JhZGdlJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoYXQgc3dlYXR5IG9sZCBmaXNoIGlzIHN0aWxsIGdvaW5nIGF0IGl0IHdpdGggaGlzIG1hbmF0ZWUgbWlsa2luZy4gWW91IHdvbmRlciBpZiB0aGVyZSBpcyBhbnkga2luZCBvZiBhdXRob3JpdHkgaGUgd291bGQgYm93IHRvLiBPYnZpb3VzIGV4aXRzIGFyZSBlYXN0IHRvIHRoZSBtYW5hdGVlIGV4aGliaXQuJylcbiAgICAgICAgICAgIGVsc2UgaWYgbm90IEBoYXNJdGVtKCdtaWxrJylcbiAgICAgICAgICAgICAgICBAcHJpbnQoJ1RoYXQgc3dlYXR5IG9sZCBmaXNoIGlzIHN0aWxsIGdvaW5nIGF0IGl0IHdpdGggaGlzIG1hbmF0ZWUgbWlsa2luZy4gWW91IGZlZWwganVzdCBhIGZyYWdtZW50IG9mIGd1aWx0IGZvciBub3QgdHVybmluZyBoaW0gaW4uIE9idmlvdXMgZXhpdHMgYXJlIGVhc3QgdG8gdGhlIG1hbmF0ZWUgZXhoaWJpdC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnVGhlcmUgZG9lc25cXCd0IHNlZW0gdG8gYmUgYW55dGhpbmcgeW91IGNhbiBkbyB0byBwdXQgYSBzdG9wIHRvIHRoaXMgaG9ycmlibGUgc2lnaHQuIEF0IGxlYXN0IHlvdSBnb3Qgc29tZXRoaW5nIG91dCBvZiBpdCB0aG91Z2guIE9idmlvdXMgZXhpdHMgYXJlIGVhc3QgdG8gdGhlIG1hbmF0ZWUgZXhoaWJpdC4nKVxuXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnTWFuYXRlZXMgZnJvbSB0aGUgZXhoaWJpdCBhcmUgYWxsIG92ZXIgaW4gaG9pc3RzIHJpZ2dlZCB1cCB0byBtaWxraW5nIGVxdWlwbWVudC4gSXRcXCdzIGlsbGVnYWwsIGJ1dCB5b3UgaGF2ZSBoZWFyZCB0aGVyZSBpcyBhIGZvcnR1bmUgaW4gZ2VudWluZSBzZWEgY293IG1pbGsuIFRoYXQgbmFzdHkgb2xkIGZpc2ggdGhlcmUgaXMgcnVubmluZyB0aGUgd2hvbGUgdGhpbmcuJylcblxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCd0YWxrJykgb3IgQG1hdGNoZXMoJ2JhZGdlJykgb3IgQG1hdGNoZXMoJ3N0aWNrZXInKVxuICAgICAgICAgICAgaWYgbm90IEBoYXNJdGVtKCdiYWRnZScpXG4gICAgICAgICAgICAgICAgQHByaW50KCdZb3Ugc3dpbSB1cCB0byB0aGUgZmlzaCBhdCB0aGUgY29udHJvbHMuIFwiSSBhbSBnb2luZyB0byBzaHV0IHlvdSBkb3duIVwiIFlvdSBzaG91dCBhdCBoaW0uIEhlIGxhdWdocyBoZWFydGlseS4gXCJZb3UgZG9uXFwndCBzdGFuZCBhIGNoYW5jZS4gWW91XFwncmUganVzdCBhIHJlZ3VsYXIgZ3V5LiBJXFwnbSB0aGUgbWF5b3Igb2YgV2F0ZXIgV29ybGQuIFdobyBpcyBnb2luZyB0byBiZWxpZXZlIHlvdT9cIiBIZSBnb2VzIGJhY2sgdG8gaGlzIHdvcmsgcGF5aW5nIHlvdSBubyBtaW5kLiBIZSBoYXMgYSBwb2ludC4nKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBwcmludCgnWW91IHN3aW0gdXAgdG8gdGhlIGZpc2ggYnJhbmRpc2hpbmcgeW91ciBiYWRnZSBzdGlja2VyLiBcIllvdSBhcmUgdW5kZXIgYXJyZXN0IGZvciBpbGxlZ2FsIG1pbGsgaGFydmVzdGluZyBmcm9tIGVuZGFuZ2VyZWQgbWFuYXRlZXMuIElcXCdtIHRha2luZyB5b3UgaW4uXCIgXCJXYWl0LFwiIGhlIHNheXMsIFwiWW91IGRvblxcJ3QgaGF2ZSB0byBkbyB0aGlzLiBJdFxcJ3MgdGhlIG9ubHkgd2F5IEkgY2FuIGtlZXAgV2F0ZXIgV29ybGQgcnVubmluZy4gRG9uXFwndCB5b3Ugc2VlPyBOb3cgdGhhdCB3ZSBhcmUgb24gb3VyIHNpeHRoIFNoYW1wdSwgcGVvcGxlIGp1c3QgZG9uXFwndCBzZWVtIHRvIGNhcmUgYWJvdXQgdGhlIG1hZ2ljIG9mIGV4cGxvaXRlZCBtYXJpbmUgbWFtbWFscy4gSSB3aWxsLCB1aC4uLm1ha2UgaXQgd29ydGggeW91ciB3aGlsZSB0aG91Z2guXCIgSGUgc2xpZGVzIGEgZnJlc2ggYm90dGxlIG9mIG1pbGsgaW4geW91ciBkaXJlY3Rpb24uIFdpdGhvdXQgbG9va2luZyBhdCB5b3UgaGUgc2F5cywgXCJJdCBpcyB3b3J0aCB0aG91c2FuZHMgaW4gdGhlIHJpZ2h0IG1hcmtldC5cIicpXG4gICAgICAgICAgICAgICAgQGdldEl0ZW0oJ21pbGsnKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2Vhc3QnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdXYXRlciBXb3JsZCAoTWFuYXRlZSBFeGhpYml0KScpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0cnlVbml2ZXJzYWxDb21tYW5kcygpXG5cblxuICAgIGVuZ2luZS5hZGRSb29tICdUaGUgRXRoZXJlYWwgUmVhbG0nLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGhhdmUgZW50ZXJlZCBUaGUgRXRoZXJlYWwgUmVhbG0uIFdoeSBkaWQgeW91IGRvIHRoYXQ/IFRoYXQgd2FzIGEgYmFkIGRlY2lzaW9uLiBXYWxlIGlzIGF0IHlvdXIgc2lkZS4gVGhlcmUgYXJlIGEgYnVuY2ggb2Ygd2VpcmQsIHNwYWNleSBwbGF0Zm9ybXMgYW5kIGp1bmsgZmxvYXRpbmcgYXJvdW5kIGluIGEgY29zbWljIHZvaWQgLS0geW91ciB0eXBpY2FsIHN1cnJlYWxpc3QgZHJlYW1zY2FwZSBlbnZpcm9ubWVudC4gQWhlYWQgaXMgYW4gdWdseSBtb25zdGVyLiBIZSBpcyBjbHV0Y2hpbmcgc29tZXRoaW5nIGluIGhpcyBoYW5kLiBPYnZpb3VzIGV4aXRzIGFyZSBOT05FISBUaGlzIGlzIHRoZSB3b3JsZCBvZiB3YWtpbmcgbmlnaHRtYXJlcyB5b3UgZGluZ3VzLicpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnVGhpcyBwbGFjZSBpcyBkZWZpbml0ZWx5IGF3ZnVsLiBUaGF0IG1vbnN0ZXIgdXAgYWhlYWQgbG9va3Mgc3VzcGljaW91cy4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIGhhbmQnKSBvciBAbWF0Y2hlcygnbG9vayBzb21ldGhpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdJdCBsb29rcyBsaWtlIHNvbWUga2luZCBvZiBjeWxpbmRyaWMgcGxhc3RpYyBjb250YWluZXIuIEhhcmQgdG8gbWFrZSBvdXQgZnJvbSBoZXJlIHRob3VnaC4nKVxuICAgICAgICBlbHNlIGlmIEBtYXRjaGVzKCdsb29rIG1vbnN0ZXInKVxuICAgICAgICAgICAgQHByaW50KCdUaGUgbW9uc3RlciBzdXJlIGlzIHVnbHkuJylcbiAgICAgICAgZWxzZSBpZiBAbWF0Y2hlcygndGFsayBtb25zdGVyJylcbiAgICAgICAgICAgIEBwcmludCgnWW91IGFyZSBnZXR0aW5nIHdvcnNlIGF0IHRoaXMgZ2FtZS4gWW91IGFwcHJvYWNoIHNhaWQgbW9uc3RlciBpbiBhbiBlZmZvcnQgdG8gZ2V0IHNvbWUgbGVhZHMgb24geW91ciBwcmVjaW91cyBoYWlyIHByb2R1Y3QuIE1heWJlIGl0IHdvdWxkIGhhdmUgYmVlbiBhIGJldHRlciBpZGVhIHRvIHN0YXJ0IGJ5IGp1c3QgYXNraW5nIGhpbSBhYm91dCB0aGUgc3RhdHVzIG9mIHRoZSBsb2NhbCBiYXNrZXRiYWxsIHRlYW0gb3Igc29tZXRoaW5nPycpXG4gICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgIEBwcmludCgnT24gY2xvc2VyIGV4YW1pbmF0aW9uIHRob3VnaCwgeW91IHJlYWxpemUgdGhpcyBpcyBub3QganVzdCBhbnkgbW9uc3Rlci4gSXQgaXMgYSBUb3J1bWVraWFuIGh5cGVyIGdvYmxpbi4gQW5kIGluIGhpcyBncmlzbHkgcGF3IHJlc3RzIHRoZSBpdGVtIG9mIHlvdXIgcXVlc3Q6IHlvdXIgJDIzIHNoYW1wb28hJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiU2hhcmMsIHdlIGNhbiBub3QgYWxsb3cgaGltIHRvIHVzZSB0aGF0IHNoYW1wb28sXCIgd2hpc3BlcnMgeW91ciBjb21wYW5pb24uIFwiT24gdGhlIGhlYWQgb2YgYSBoeXBlciBnb2JsaW4sIGhhaXIgdGhhdCBzbW9vdGggY291bGQgbWVhbiB0aGUgZW5kIG9mIGZhc2hpb24gYXMgd2Uga25vdyBpdC4gV2UgbXVzdCByZXRyaWV2ZSBpdCBieSBhbnkgbWVhbnMgbmVjZXNzYXJ5LlwiJylcbiAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIEBwcmludCgnTm8gc29vbmVyIGhhdmUgdGhlIHdvcmRzIGxlZnQgV2FsZVxcJ3MgbGlwcyB0aGFuIHlvdSBhcmUgc3BvdHRlZC4gVGhhdCBpcyBhbGwgdGhlIG1vdGl2YXRpb24gdGhpcyBiZWFzdCBuZWVkcy4gSGUgZmxpcHMgdGhlIGNhcCBvbiB0aGUgYm90dGxlLCByYWlzaW5nIGl0IHRvIHRoZSBmaWx0aHksIHN0cmluZy1saWtlIG1vcCB5b3UgY2FuIG9ubHkgYXNzdW1lIG11c3QgYmUgaGlzIGhhaXIsIGFsbCB0aGUgd2hpbGUgZ2F6aW5nIGRvd24gYXQgeW91IGluIGRlZmlhbmNlIHdpdGggaGlzIHNpbmdsZSBibG9vZCBzaG90IGV5ZS4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgQHdhaXQgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1RoZSBFdGhlcmVhbCBSZWFsbSAoRG8gc29tZXRoaW5nISknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbSAoRG8gc29tZXRoaW5nISknLCAtPlxuICAgICAgICBpZiBAZXhhY3RseU1hdGNoZXMoJ19fZW50ZXJfcm9vbV9fJykgb3IgQGV4YWN0bHlNYXRjaGVzKCdsb29rJylcbiAgICAgICAgICAgIEBwcmludCgnRG8gc29tZXRoaW5nIScpXG4gICAgICAgIGVsc2UgaWYgQGV4YWN0bHlNYXRjaGVzKCdzb21ldGhpbmcnKVxuICAgICAgICAgICAgQHByaW50KCdPaCB2ZXJ5IGZ1bm55LiAgTm93IGlzIGRlZmluaXRlbHkgbm90IHRoZSB0aW1lIGZvciBzbmFyay4nKVxuXG4gICAgICAgIGVsc2UgaWYgQG1hdGNoZXMoJ2F0dGFjaycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSBzd2ltIHVwIHRvIGVuZ2FnZSB0aGUgbW9uc3RlciwgYnV0IFdhbGUgcHVzaGVzIHlvdSBvdXQgb2YgdGhlIHdheSBpbiBhIGNoYXJnZSBoaW1zZWxmLiBZb3UgY3JpbmdlIGFzIHlvdSBoZWFyIHRoZSBzbGFzaGluZyBvZiBmbGVzaC4gUmVkIG1pc3QgZmxvYXRzIG91dCBvZiBXYWxlXFwncyBzaWRlLiBZb3VyIGhlYWQgaXMgc3Bpbm5pbmcuJylcbiAgICAgICAgICAgIEB3YWl0ID0+XG4gICAgICAgICAgICAgICAgQHByaW50KCdcIk5vdyBTaGFyYyFcIiwgaGUgd2hlZXplcywgXCJVc2UgdGhlIHBvd2VyIG9mIHRoZSBRdWFkcmF0aWMgRXllLlwiJylcbiAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICBAcHJpbnQoJ1wiQnV0IHlvdSBzYWlkIEkgd2FzblxcJ3QgcmVhZHkhXCIgeW91IGNyeSwgdHJ5aW5nIG5vdCB0byBsb29rIGF0IHRoZSBzb3JyeSBzdGF0ZSBvZiB5b3VyIGZyaWVuZC4nKVxuICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHByaW50KCdcIk5vLCBpdCB3YXMgSSB3aG8gd2FzIG5vdCByZWFkeS4gVGhlIHAtcG93ZXIgaGFzIGFsd2F5cyBiZWVuIHdpdGhpbiB5LXlvdS5cIicpXG4gICAgICAgICAgICAgICAgICAgICAgICBAd2FpdCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBnZXRJdGVtKCdxdWFkcmF0aWMgZXllJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAZ29Ub1Jvb20oJ1RoZSBFdGhlcmVhbCBSZWFsbSAoVXNlIHRoZSBRdWFkcmF0aWMgRXllISknKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG4gICAgZW5naW5lLmFkZFJvb20gJ1RoZSBFdGhlcmVhbCBSZWFsbSAoVXNlIHRoZSBRdWFkcmF0aWMgRXllISknLCAtPlxuICAgICAgICBpZiBAbWF0Y2hlcygndXNlIHF1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQHJlbW92ZUl0ZW0oJ3F1YWRyYXRpYyBleWUnKVxuICAgICAgICAgICAgQGdvVG9Sb29tKCdFbmQnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdHJ5VW5pdmVyc2FsQ29tbWFuZHMoKVxuXG5cbiAgICBlbmdpbmUuYWRkUm9vbSAnRW5kJywgLT5cbiAgICAgICAgaWYgQGV4YWN0bHlNYXRjaGVzKCdfX2VudGVyX3Jvb21fXycpXG4gICAgICAgICAgICBAcHJpbnQoJ1lvdSByZW1vdmUgdGhlIFF1YWRyYXRpYyBFeWUgZnJvbSBpdHMgY29tcGFydG1lbnQsIGNsb3NlIHlvdXIgZXllcyBhbmQgYWxsb3cgdW5pb24gYmV0d2VlbiB5b3VyIHNwaXJpdCBhbmQgdGhlIHVuaXZlcnNhbCBjaGkgZmxvdy4gVGhlbiB0aGUgZ29ibGluIGdldHMgY3V0IGluIGhhbGYgYW5kIHlvdSBnZXQgeW91ciBzaGFtcG9vIGJhY2suJylcblxuXG4gICAgI2VuZ2luZS5zZXRTdGFydFJvb20oJ1dhbGUgdnMgU2hhcmM6IFRoZSBDb21pYzogVGhlIEludGVyYWN0aXZlIFNvZnR3YXJlIFRpdGxlIEZvciBZb3VyIENvbXB1dGVyIEJveCcpXG4gICAgZW5naW5lLnNldFN0YXJ0Um9vbSgnV2FsZSAoV2l0aCBFdGhlcmVhbCBEb29yIHJpZ2h0IHRoZXJlISknKVxuIiwidmFyIG0gPSAoZnVuY3Rpb24gYXBwKHdpbmRvdywgdW5kZWZpbmVkKSB7XHJcblx0dmFyIE9CSkVDVCA9IFwiW29iamVjdCBPYmplY3RdXCIsIEFSUkFZID0gXCJbb2JqZWN0IEFycmF5XVwiLCBTVFJJTkcgPSBcIltvYmplY3QgU3RyaW5nXVwiLCBGVU5DVElPTiA9IFwiZnVuY3Rpb25cIjtcclxuXHR2YXIgdHlwZSA9IHt9LnRvU3RyaW5nO1xyXG5cdHZhciBwYXJzZXIgPSAvKD86KF58I3xcXC4pKFteI1xcLlxcW1xcXV0rKSl8KFxcWy4rP1xcXSkvZywgYXR0clBhcnNlciA9IC9cXFsoLis/KSg/Oj0oXCJ8J3wpKC4qPylcXDIpP1xcXS87XHJcblx0dmFyIHZvaWRFbGVtZW50cyA9IC9eKEFSRUF8QkFTRXxCUnxDT0x8Q09NTUFORHxFTUJFRHxIUnxJTUd8SU5QVVR8S0VZR0VOfExJTkt8TUVUQXxQQVJBTXxTT1VSQ0V8VFJBQ0t8V0JSKSQvO1xyXG5cdHZhciBub29wID0gZnVuY3Rpb24oKSB7fVxyXG5cclxuXHQvLyBjYWNoaW5nIGNvbW1vbmx5IHVzZWQgdmFyaWFibGVzXHJcblx0dmFyICRkb2N1bWVudCwgJGxvY2F0aW9uLCAkcmVxdWVzdEFuaW1hdGlvbkZyYW1lLCAkY2FuY2VsQW5pbWF0aW9uRnJhbWU7XHJcblxyXG5cdC8vIHNlbGYgaW52b2tpbmcgZnVuY3Rpb24gbmVlZGVkIGJlY2F1c2Ugb2YgdGhlIHdheSBtb2NrcyB3b3JrXHJcblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZSh3aW5kb3cpe1xyXG5cdFx0JGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cdFx0JGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xyXG5cdFx0JGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5jbGVhclRpbWVvdXQ7XHJcblx0XHQkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cuc2V0VGltZW91dDtcclxuXHR9XHJcblxyXG5cdGluaXRpYWxpemUod2luZG93KTtcclxuXHJcblxyXG5cdC8qKlxyXG5cdCAqIEB0eXBlZGVmIHtTdHJpbmd9IFRhZ1xyXG5cdCAqIEEgc3RyaW5nIHRoYXQgbG9va3MgbGlrZSAtPiBkaXYuY2xhc3NuYW1lI2lkW3BhcmFtPW9uZV1bcGFyYW0yPXR3b11cclxuXHQgKiBXaGljaCBkZXNjcmliZXMgYSBET00gbm9kZVxyXG5cdCAqL1xyXG5cclxuXHQvKipcclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB7VGFnfSBUaGUgRE9NIG5vZGUgdGFnXHJcblx0ICogQHBhcmFtIHtPYmplY3Q9W119IG9wdGlvbmFsIGtleS12YWx1ZSBwYWlycyB0byBiZSBtYXBwZWQgdG8gRE9NIGF0dHJzXHJcblx0ICogQHBhcmFtIHsuLi5tTm9kZT1bXX0gWmVybyBvciBtb3JlIE1pdGhyaWwgY2hpbGQgbm9kZXMuIENhbiBiZSBhbiBhcnJheSwgb3Igc3BsYXQgKG9wdGlvbmFsKVxyXG5cdCAqXHJcblx0ICovXHJcblx0ZnVuY3Rpb24gbSgpIHtcclxuXHRcdHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdFx0dmFyIGhhc0F0dHJzID0gYXJnc1sxXSAhPSBudWxsICYmIHR5cGUuY2FsbChhcmdzWzFdKSA9PT0gT0JKRUNUICYmICEoXCJ0YWdcIiBpbiBhcmdzWzFdIHx8IFwidmlld1wiIGluIGFyZ3NbMV0pICYmICEoXCJzdWJ0cmVlXCIgaW4gYXJnc1sxXSk7XHJcblx0XHR2YXIgYXR0cnMgPSBoYXNBdHRycyA/IGFyZ3NbMV0gOiB7fTtcclxuXHRcdHZhciBjbGFzc0F0dHJOYW1lID0gXCJjbGFzc1wiIGluIGF0dHJzID8gXCJjbGFzc1wiIDogXCJjbGFzc05hbWVcIjtcclxuXHRcdHZhciBjZWxsID0ge3RhZzogXCJkaXZcIiwgYXR0cnM6IHt9fTtcclxuXHRcdHZhciBtYXRjaCwgY2xhc3NlcyA9IFtdO1xyXG5cdFx0aWYgKHR5cGUuY2FsbChhcmdzWzBdKSAhPSBTVFJJTkcpIHRocm93IG5ldyBFcnJvcihcInNlbGVjdG9yIGluIG0oc2VsZWN0b3IsIGF0dHJzLCBjaGlsZHJlbikgc2hvdWxkIGJlIGEgc3RyaW5nXCIpXHJcblx0XHR3aGlsZSAobWF0Y2ggPSBwYXJzZXIuZXhlYyhhcmdzWzBdKSkge1xyXG5cdFx0XHRpZiAobWF0Y2hbMV0gPT09IFwiXCIgJiYgbWF0Y2hbMl0pIGNlbGwudGFnID0gbWF0Y2hbMl07XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzFdID09PSBcIiNcIikgY2VsbC5hdHRycy5pZCA9IG1hdGNoWzJdO1xyXG5cdFx0XHRlbHNlIGlmIChtYXRjaFsxXSA9PT0gXCIuXCIpIGNsYXNzZXMucHVzaChtYXRjaFsyXSk7XHJcblx0XHRcdGVsc2UgaWYgKG1hdGNoWzNdWzBdID09PSBcIltcIikge1xyXG5cdFx0XHRcdHZhciBwYWlyID0gYXR0clBhcnNlci5leGVjKG1hdGNoWzNdKTtcclxuXHRcdFx0XHRjZWxsLmF0dHJzW3BhaXJbMV1dID0gcGFpclszXSB8fCAocGFpclsyXSA/IFwiXCIgOnRydWUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgY2hpbGRyZW4gPSBoYXNBdHRycyA/IGFyZ3Muc2xpY2UoMikgOiBhcmdzLnNsaWNlKDEpO1xyXG5cdFx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiB0eXBlLmNhbGwoY2hpbGRyZW5bMF0pID09PSBBUlJBWSkge1xyXG5cdFx0XHRjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5bMF1cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRjZWxsLmNoaWxkcmVuID0gY2hpbGRyZW5cclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gYXR0cnMpIHtcclxuXHRcdFx0aWYgKGF0dHJzLmhhc093blByb3BlcnR5KGF0dHJOYW1lKSkge1xyXG5cdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gY2xhc3NBdHRyTmFtZSAmJiBhdHRyc1thdHRyTmFtZV0gIT0gbnVsbCAmJiBhdHRyc1thdHRyTmFtZV0gIT09IFwiXCIpIHtcclxuXHRcdFx0XHRcdGNsYXNzZXMucHVzaChhdHRyc1thdHRyTmFtZV0pXHJcblx0XHRcdFx0XHRjZWxsLmF0dHJzW2F0dHJOYW1lXSA9IFwiXCIgLy9jcmVhdGUga2V5IGluIGNvcnJlY3QgaXRlcmF0aW9uIG9yZGVyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2UgY2VsbC5hdHRyc1thdHRyTmFtZV0gPSBhdHRyc1thdHRyTmFtZV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNsYXNzZXMubGVuZ3RoID4gMCkgY2VsbC5hdHRyc1tjbGFzc0F0dHJOYW1lXSA9IGNsYXNzZXMuam9pbihcIiBcIik7XHJcblx0XHRcclxuXHRcdHJldHVybiBjZWxsXHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJ1aWxkKHBhcmVudEVsZW1lbnQsIHBhcmVudFRhZywgcGFyZW50Q2FjaGUsIHBhcmVudEluZGV4LCBkYXRhLCBjYWNoZWQsIHNob3VsZFJlYXR0YWNoLCBpbmRleCwgZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncykge1xyXG5cdFx0Ly9gYnVpbGRgIGlzIGEgcmVjdXJzaXZlIGZ1bmN0aW9uIHRoYXQgbWFuYWdlcyBjcmVhdGlvbi9kaWZmaW5nL3JlbW92YWwgb2YgRE9NIGVsZW1lbnRzIGJhc2VkIG9uIGNvbXBhcmlzb24gYmV0d2VlbiBgZGF0YWAgYW5kIGBjYWNoZWRgXHJcblx0XHQvL3RoZSBkaWZmIGFsZ29yaXRobSBjYW4gYmUgc3VtbWFyaXplZCBhcyB0aGlzOlxyXG5cdFx0Ly8xIC0gY29tcGFyZSBgZGF0YWAgYW5kIGBjYWNoZWRgXHJcblx0XHQvLzIgLSBpZiB0aGV5IGFyZSBkaWZmZXJlbnQsIGNvcHkgYGRhdGFgIHRvIGBjYWNoZWRgIGFuZCB1cGRhdGUgdGhlIERPTSBiYXNlZCBvbiB3aGF0IHRoZSBkaWZmZXJlbmNlIGlzXHJcblx0XHQvLzMgLSByZWN1cnNpdmVseSBhcHBseSB0aGlzIGFsZ29yaXRobSBmb3IgZXZlcnkgYXJyYXkgYW5kIGZvciB0aGUgY2hpbGRyZW4gb2YgZXZlcnkgdmlydHVhbCBlbGVtZW50XHJcblxyXG5cdFx0Ly90aGUgYGNhY2hlZGAgZGF0YSBzdHJ1Y3R1cmUgaXMgZXNzZW50aWFsbHkgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIHJlZHJhdydzIGBkYXRhYCBkYXRhIHN0cnVjdHVyZSwgd2l0aCBhIGZldyBhZGRpdGlvbnM6XHJcblx0XHQvLy0gYGNhY2hlZGAgYWx3YXlzIGhhcyBhIHByb3BlcnR5IGNhbGxlZCBgbm9kZXNgLCB3aGljaCBpcyBhIGxpc3Qgb2YgRE9NIGVsZW1lbnRzIHRoYXQgY29ycmVzcG9uZCB0byB0aGUgZGF0YSByZXByZXNlbnRlZCBieSB0aGUgcmVzcGVjdGl2ZSB2aXJ0dWFsIGVsZW1lbnRcclxuXHRcdC8vLSBpbiBvcmRlciB0byBzdXBwb3J0IGF0dGFjaGluZyBgbm9kZXNgIGFzIGEgcHJvcGVydHkgb2YgYGNhY2hlZGAsIGBjYWNoZWRgIGlzICphbHdheXMqIGEgbm9uLXByaW1pdGl2ZSBvYmplY3QsIGkuZS4gaWYgdGhlIGRhdGEgd2FzIGEgc3RyaW5nLCB0aGVuIGNhY2hlZCBpcyBhIFN0cmluZyBpbnN0YW5jZS4gSWYgZGF0YSB3YXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLCBjYWNoZWQgaXMgYG5ldyBTdHJpbmcoXCJcIilgXHJcblx0XHQvLy0gYGNhY2hlZCBhbHNvIGhhcyBhIGBjb25maWdDb250ZXh0YCBwcm9wZXJ0eSwgd2hpY2ggaXMgdGhlIHN0YXRlIHN0b3JhZ2Ugb2JqZWN0IGV4cG9zZWQgYnkgY29uZmlnKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpXHJcblx0XHQvLy0gd2hlbiBgY2FjaGVkYCBpcyBhbiBPYmplY3QsIGl0IHJlcHJlc2VudHMgYSB2aXJ0dWFsIGVsZW1lbnQ7IHdoZW4gaXQncyBhbiBBcnJheSwgaXQgcmVwcmVzZW50cyBhIGxpc3Qgb2YgZWxlbWVudHM7IHdoZW4gaXQncyBhIFN0cmluZywgTnVtYmVyIG9yIEJvb2xlYW4sIGl0IHJlcHJlc2VudHMgYSB0ZXh0IG5vZGVcclxuXHJcblx0XHQvL2BwYXJlbnRFbGVtZW50YCBpcyBhIERPTSBlbGVtZW50IHVzZWQgZm9yIFczQyBET00gQVBJIGNhbGxzXHJcblx0XHQvL2BwYXJlbnRUYWdgIGlzIG9ubHkgdXNlZCBmb3IgaGFuZGxpbmcgYSBjb3JuZXIgY2FzZSBmb3IgdGV4dGFyZWEgdmFsdWVzXHJcblx0XHQvL2BwYXJlbnRDYWNoZWAgaXMgdXNlZCB0byByZW1vdmUgbm9kZXMgaW4gc29tZSBtdWx0aS1ub2RlIGNhc2VzXHJcblx0XHQvL2BwYXJlbnRJbmRleGAgYW5kIGBpbmRleGAgYXJlIHVzZWQgdG8gZmlndXJlIG91dCB0aGUgb2Zmc2V0IG9mIG5vZGVzLiBUaGV5J3JlIGFydGlmYWN0cyBmcm9tIGJlZm9yZSBhcnJheXMgc3RhcnRlZCBiZWluZyBmbGF0dGVuZWQgYW5kIGFyZSBsaWtlbHkgcmVmYWN0b3JhYmxlXHJcblx0XHQvL2BkYXRhYCBhbmQgYGNhY2hlZGAgYXJlLCByZXNwZWN0aXZlbHksIHRoZSBuZXcgYW5kIG9sZCBub2RlcyBiZWluZyBkaWZmZWRcclxuXHRcdC8vYHNob3VsZFJlYXR0YWNoYCBpcyBhIGZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIGEgcGFyZW50IG5vZGUgd2FzIHJlY3JlYXRlZCAoaWYgc28sIGFuZCBpZiB0aGlzIG5vZGUgaXMgcmV1c2VkLCB0aGVuIHRoaXMgbm9kZSBtdXN0IHJlYXR0YWNoIGl0c2VsZiB0byB0aGUgbmV3IHBhcmVudClcclxuXHRcdC8vYGVkaXRhYmxlYCBpcyBhIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhbiBhbmNlc3RvciBpcyBjb250ZW50ZWRpdGFibGVcclxuXHRcdC8vYG5hbWVzcGFjZWAgaW5kaWNhdGVzIHRoZSBjbG9zZXN0IEhUTUwgbmFtZXNwYWNlIGFzIGl0IGNhc2NhZGVzIGRvd24gZnJvbSBhbiBhbmNlc3RvclxyXG5cdFx0Ly9gY29uZmlnc2AgaXMgYSBsaXN0IG9mIGNvbmZpZyBmdW5jdGlvbnMgdG8gcnVuIGFmdGVyIHRoZSB0b3Btb3N0IGBidWlsZGAgY2FsbCBmaW5pc2hlcyBydW5uaW5nXHJcblxyXG5cdFx0Ly90aGVyZSdzIGxvZ2ljIHRoYXQgcmVsaWVzIG9uIHRoZSBhc3N1bXB0aW9uIHRoYXQgbnVsbCBhbmQgdW5kZWZpbmVkIGRhdGEgYXJlIGVxdWl2YWxlbnQgdG8gZW1wdHkgc3RyaW5nc1xyXG5cdFx0Ly8tIHRoaXMgcHJldmVudHMgbGlmZWN5Y2xlIHN1cnByaXNlcyBmcm9tIHByb2NlZHVyYWwgaGVscGVycyB0aGF0IG1peCBpbXBsaWNpdCBhbmQgZXhwbGljaXQgcmV0dXJuIHN0YXRlbWVudHMgKGUuZy4gZnVuY3Rpb24gZm9vKCkge2lmIChjb25kKSByZXR1cm4gbShcImRpdlwiKX1cclxuXHRcdC8vLSBpdCBzaW1wbGlmaWVzIGRpZmZpbmcgY29kZVxyXG5cdFx0Ly9kYXRhLnRvU3RyaW5nKCkgbWlnaHQgdGhyb3cgb3IgcmV0dXJuIG51bGwgaWYgZGF0YSBpcyB0aGUgcmV0dXJuIHZhbHVlIG9mIENvbnNvbGUubG9nIGluIEZpcmVmb3ggKGJlaGF2aW9yIGRlcGVuZHMgb24gdmVyc2lvbilcclxuXHRcdHRyeSB7aWYgKGRhdGEgPT0gbnVsbCB8fCBkYXRhLnRvU3RyaW5nKCkgPT0gbnVsbCkgZGF0YSA9IFwiXCI7fSBjYXRjaCAoZSkge2RhdGEgPSBcIlwifVxyXG5cdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGNhY2hlZDtcclxuXHRcdHZhciBjYWNoZWRUeXBlID0gdHlwZS5jYWxsKGNhY2hlZCksIGRhdGFUeXBlID0gdHlwZS5jYWxsKGRhdGEpO1xyXG5cdFx0aWYgKGNhY2hlZCA9PSBudWxsIHx8IGNhY2hlZFR5cGUgIT09IGRhdGFUeXBlKSB7XHJcblx0XHRcdGlmIChjYWNoZWQgIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmIChwYXJlbnRDYWNoZSAmJiBwYXJlbnRDYWNoZS5ub2Rlcykge1xyXG5cdFx0XHRcdFx0dmFyIG9mZnNldCA9IGluZGV4IC0gcGFyZW50SW5kZXg7XHJcblx0XHRcdFx0XHR2YXIgZW5kID0gb2Zmc2V0ICsgKGRhdGFUeXBlID09PSBBUlJBWSA/IGRhdGEgOiBjYWNoZWQubm9kZXMpLmxlbmd0aDtcclxuXHRcdFx0XHRcdGNsZWFyKHBhcmVudENhY2hlLm5vZGVzLnNsaWNlKG9mZnNldCwgZW5kKSwgcGFyZW50Q2FjaGUuc2xpY2Uob2Zmc2V0LCBlbmQpKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIGlmIChjYWNoZWQubm9kZXMpIGNsZWFyKGNhY2hlZC5ub2RlcywgY2FjaGVkKVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhY2hlZCA9IG5ldyBkYXRhLmNvbnN0cnVjdG9yO1xyXG5cdFx0XHRpZiAoY2FjaGVkLnRhZykgY2FjaGVkID0ge307IC8vaWYgY29uc3RydWN0b3IgY3JlYXRlcyBhIHZpcnR1YWwgZG9tIGVsZW1lbnQsIHVzZSBhIGJsYW5rIG9iamVjdCBhcyB0aGUgYmFzZSBjYWNoZWQgbm9kZSBpbnN0ZWFkIG9mIGNvcHlpbmcgdGhlIHZpcnR1YWwgZWwgKCMyNzcpXHJcblx0XHRcdGNhY2hlZC5ub2RlcyA9IFtdXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGFUeXBlID09PSBBUlJBWSkge1xyXG5cdFx0XHQvL3JlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRpZiAodHlwZS5jYWxsKGRhdGFbaV0pID09PSBBUlJBWSkge1xyXG5cdFx0XHRcdFx0ZGF0YSA9IGRhdGEuY29uY2F0LmFwcGx5KFtdLCBkYXRhKTtcclxuXHRcdFx0XHRcdGktLSAvL2NoZWNrIGN1cnJlbnQgaW5kZXggYWdhaW4gYW5kIGZsYXR0ZW4gdW50aWwgdGhlcmUgYXJlIG5vIG1vcmUgbmVzdGVkIGFycmF5cyBhdCB0aGF0IGluZGV4XHJcblx0XHRcdFx0XHRsZW4gPSBkYXRhLmxlbmd0aFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdFx0dmFyIG5vZGVzID0gW10sIGludGFjdCA9IGNhY2hlZC5sZW5ndGggPT09IGRhdGEubGVuZ3RoLCBzdWJBcnJheUNvdW50ID0gMDtcclxuXHJcblx0XHRcdC8va2V5cyBhbGdvcml0aG06IHNvcnQgZWxlbWVudHMgd2l0aG91dCByZWNyZWF0aW5nIHRoZW0gaWYga2V5cyBhcmUgcHJlc2VudFxyXG5cdFx0XHQvLzEpIGNyZWF0ZSBhIG1hcCBvZiBhbGwgZXhpc3Rpbmcga2V5cywgYW5kIG1hcmsgYWxsIGZvciBkZWxldGlvblxyXG5cdFx0XHQvLzIpIGFkZCBuZXcga2V5cyB0byBtYXAgYW5kIG1hcmsgdGhlbSBmb3IgYWRkaXRpb25cclxuXHRcdFx0Ly8zKSBpZiBrZXkgZXhpc3RzIGluIG5ldyBsaXN0LCBjaGFuZ2UgYWN0aW9uIGZyb20gZGVsZXRpb24gdG8gYSBtb3ZlXHJcblx0XHRcdC8vNCkgZm9yIGVhY2gga2V5LCBoYW5kbGUgaXRzIGNvcnJlc3BvbmRpbmcgYWN0aW9uIGFzIG1hcmtlZCBpbiBwcmV2aW91cyBzdGVwc1xyXG5cdFx0XHR2YXIgREVMRVRJT04gPSAxLCBJTlNFUlRJT04gPSAyICwgTU9WRSA9IDM7XHJcblx0XHRcdHZhciBleGlzdGluZyA9IHt9LCBzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSBmYWxzZTtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjYWNoZWQubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkW2ldICYmIGNhY2hlZFtpXS5hdHRycyAmJiBjYWNoZWRbaV0uYXR0cnMua2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdHNob3VsZE1haW50YWluSWRlbnRpdGllcyA9IHRydWU7XHJcblx0XHRcdFx0XHRleGlzdGluZ1tjYWNoZWRbaV0uYXR0cnMua2V5XSA9IHthY3Rpb246IERFTEVUSU9OLCBpbmRleDogaX1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdHZhciBndWlkID0gMFxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHRcdGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMgJiYgZGF0YVtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaiA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGRhdGFbal0gJiYgZGF0YVtqXS5hdHRycyAmJiBkYXRhW2pdLmF0dHJzLmtleSA9PSBudWxsKSBkYXRhW2pdLmF0dHJzLmtleSA9IFwiX19taXRocmlsX19cIiArIGd1aWQrK1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGlmIChzaG91bGRNYWludGFpbklkZW50aXRpZXMpIHtcclxuXHRcdFx0XHR2YXIga2V5c0RpZmZlciA9IGZhbHNlXHJcblx0XHRcdFx0aWYgKGRhdGEubGVuZ3RoICE9IGNhY2hlZC5sZW5ndGgpIGtleXNEaWZmZXIgPSB0cnVlXHJcblx0XHRcdFx0ZWxzZSBmb3IgKHZhciBpID0gMCwgY2FjaGVkQ2VsbCwgZGF0YUNlbGw7IGNhY2hlZENlbGwgPSBjYWNoZWRbaV0sIGRhdGFDZWxsID0gZGF0YVtpXTsgaSsrKSB7XHJcblx0XHRcdFx0XHRpZiAoY2FjaGVkQ2VsbC5hdHRycyAmJiBkYXRhQ2VsbC5hdHRycyAmJiBjYWNoZWRDZWxsLmF0dHJzLmtleSAhPSBkYXRhQ2VsbC5hdHRycy5rZXkpIHtcclxuXHRcdFx0XHRcdFx0a2V5c0RpZmZlciA9IHRydWVcclxuXHRcdFx0XHRcdFx0YnJlYWtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0aWYgKGtleXNEaWZmZXIpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBkYXRhLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChkYXRhW2ldICYmIGRhdGFbaV0uYXR0cnMpIHtcclxuXHRcdFx0XHRcdFx0XHRpZiAoZGF0YVtpXS5hdHRycy5rZXkgIT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIGtleSA9IGRhdGFbaV0uYXR0cnMua2V5O1xyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFleGlzdGluZ1trZXldKSBleGlzdGluZ1trZXldID0ge2FjdGlvbjogSU5TRVJUSU9OLCBpbmRleDogaX07XHJcblx0XHRcdFx0XHRcdFx0XHRlbHNlIGV4aXN0aW5nW2tleV0gPSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGFjdGlvbjogTU9WRSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0aW5kZXg6IGksXHJcblx0XHRcdFx0XHRcdFx0XHRcdGZyb206IGV4aXN0aW5nW2tleV0uaW5kZXgsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQ6IGNhY2hlZC5ub2Rlc1tleGlzdGluZ1trZXldLmluZGV4XSB8fCAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0dmFyIGFjdGlvbnMgPSBbXVxyXG5cdFx0XHRcdFx0Zm9yICh2YXIgcHJvcCBpbiBleGlzdGluZykgYWN0aW9ucy5wdXNoKGV4aXN0aW5nW3Byb3BdKVxyXG5cdFx0XHRcdFx0dmFyIGNoYW5nZXMgPSBhY3Rpb25zLnNvcnQoc29ydENoYW5nZXMpO1xyXG5cdFx0XHRcdFx0dmFyIG5ld0NhY2hlZCA9IG5ldyBBcnJheShjYWNoZWQubGVuZ3RoKVxyXG5cdFx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzID0gY2FjaGVkLm5vZGVzLnNsaWNlKClcclxuXHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgY2hhbmdlOyBjaGFuZ2UgPSBjaGFuZ2VzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IERFTEVUSU9OKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2xlYXIoY2FjaGVkW2NoYW5nZS5pbmRleF0ubm9kZXMsIGNhY2hlZFtjaGFuZ2UuaW5kZXhdKTtcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQuc3BsaWNlKGNoYW5nZS5pbmRleCwgMSlcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gSU5TRVJUSU9OKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIGR1bW15ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcblx0XHRcdFx0XHRcdFx0ZHVtbXkua2V5ID0gZGF0YVtjaGFuZ2UuaW5kZXhdLmF0dHJzLmtleTtcclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShkdW1teSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2NoYW5nZS5pbmRleF0gfHwgbnVsbCk7XHJcblx0XHRcdFx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShjaGFuZ2UuaW5kZXgsIDAsIHthdHRyczoge2tleTogZGF0YVtjaGFuZ2UuaW5kZXhdLmF0dHJzLmtleX0sIG5vZGVzOiBbZHVtbXldfSlcclxuXHRcdFx0XHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbY2hhbmdlLmluZGV4XSA9IGR1bW15XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBNT1ZFKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdICE9PSBjaGFuZ2UuZWxlbWVudCAmJiBjaGFuZ2UuZWxlbWVudCAhPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoY2hhbmdlLmVsZW1lbnQsIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tjaGFuZ2UuaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZFtjaGFuZ2UuaW5kZXhdID0gY2FjaGVkW2NoYW5nZS5mcm9tXVxyXG5cdFx0XHRcdFx0XHRcdG5ld0NhY2hlZC5ub2Rlc1tjaGFuZ2UuaW5kZXhdID0gY2hhbmdlLmVsZW1lbnRcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Y2FjaGVkID0gbmV3Q2FjaGVkO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvL2VuZCBrZXkgYWxnb3JpdGhtXHJcblxyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgY2FjaGVDb3VudCA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHQvL2RpZmYgZWFjaCBpdGVtIGluIHRoZSBhcnJheVxyXG5cdFx0XHRcdHZhciBpdGVtID0gYnVpbGQocGFyZW50RWxlbWVudCwgcGFyZW50VGFnLCBjYWNoZWQsIGluZGV4LCBkYXRhW2ldLCBjYWNoZWRbY2FjaGVDb3VudF0sIHNob3VsZFJlYXR0YWNoLCBpbmRleCArIHN1YkFycmF5Q291bnQgfHwgc3ViQXJyYXlDb3VudCwgZWRpdGFibGUsIG5hbWVzcGFjZSwgY29uZmlncyk7XHJcblx0XHRcdFx0aWYgKGl0ZW0gPT09IHVuZGVmaW5lZCkgY29udGludWU7XHJcblx0XHRcdFx0aWYgKCFpdGVtLm5vZGVzLmludGFjdCkgaW50YWN0ID0gZmFsc2U7XHJcblx0XHRcdFx0aWYgKGl0ZW0uJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdC8vZml4IG9mZnNldCBvZiBuZXh0IGVsZW1lbnQgaWYgaXRlbSB3YXMgYSB0cnVzdGVkIHN0cmluZyB3LyBtb3JlIHRoYW4gb25lIGh0bWwgZWxlbWVudFxyXG5cdFx0XHRcdFx0Ly90aGUgZmlyc3QgY2xhdXNlIGluIHRoZSByZWdleHAgbWF0Y2hlcyBlbGVtZW50c1xyXG5cdFx0XHRcdFx0Ly90aGUgc2Vjb25kIGNsYXVzZSAoYWZ0ZXIgdGhlIHBpcGUpIG1hdGNoZXMgdGV4dCBub2Rlc1xyXG5cdFx0XHRcdFx0c3ViQXJyYXlDb3VudCArPSAoaXRlbS5tYXRjaCgvPFteXFwvXXxcXD5cXHMqW148XS9nKSB8fCBbMF0pLmxlbmd0aFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHN1YkFycmF5Q291bnQgKz0gdHlwZS5jYWxsKGl0ZW0pID09PSBBUlJBWSA/IGl0ZW0ubGVuZ3RoIDogMTtcclxuXHRcdFx0XHRjYWNoZWRbY2FjaGVDb3VudCsrXSA9IGl0ZW1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWludGFjdCkge1xyXG5cdFx0XHRcdC8vZGlmZiB0aGUgYXJyYXkgaXRzZWxmXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0Ly91cGRhdGUgdGhlIGxpc3Qgb2YgRE9NIG5vZGVzIGJ5IGNvbGxlY3RpbmcgdGhlIG5vZGVzIGZyb20gZWFjaCBpdGVtXHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0XHRcdGlmIChjYWNoZWRbaV0gIT0gbnVsbCkgbm9kZXMucHVzaC5hcHBseShub2RlcywgY2FjaGVkW2ldLm5vZGVzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvL3JlbW92ZSBpdGVtcyBmcm9tIHRoZSBlbmQgb2YgdGhlIGFycmF5IGlmIHRoZSBuZXcgYXJyYXkgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQgb25lXHJcblx0XHRcdFx0Ly9pZiBlcnJvcnMgZXZlciBoYXBwZW4gaGVyZSwgdGhlIGlzc3VlIGlzIG1vc3QgbGlrZWx5IGEgYnVnIGluIHRoZSBjb25zdHJ1Y3Rpb24gb2YgdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlIHNvbWV3aGVyZSBlYXJsaWVyIGluIHRoZSBwcm9ncmFtXHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIG5vZGU7IG5vZGUgPSBjYWNoZWQubm9kZXNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0aWYgKG5vZGUucGFyZW50Tm9kZSAhPSBudWxsICYmIG5vZGVzLmluZGV4T2Yobm9kZSkgPCAwKSBjbGVhcihbbm9kZV0sIFtjYWNoZWRbaV1dKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggPCBjYWNoZWQubGVuZ3RoKSBjYWNoZWQubGVuZ3RoID0gZGF0YS5sZW5ndGg7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoZGF0YSAhPSBudWxsICYmIGRhdGFUeXBlID09PSBPQkpFQ1QpIHtcclxuXHRcdFx0dmFyIHZpZXdzID0gW10sIGNvbnRyb2xsZXJzID0gW11cclxuXHRcdFx0d2hpbGUgKGRhdGEudmlldykge1xyXG5cdFx0XHRcdHZhciB2aWV3ID0gZGF0YS52aWV3LiRvcmlnaW5hbCB8fCBkYXRhLnZpZXdcclxuXHRcdFx0XHR2YXIgY29udHJvbGxlckluZGV4ID0gbS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImRpZmZcIiAmJiBjYWNoZWQudmlld3MgPyBjYWNoZWQudmlld3MuaW5kZXhPZih2aWV3KSA6IC0xXHJcblx0XHRcdFx0dmFyIGNvbnRyb2xsZXIgPSBjb250cm9sbGVySW5kZXggPiAtMSA/IGNhY2hlZC5jb250cm9sbGVyc1tjb250cm9sbGVySW5kZXhdIDogbmV3IChkYXRhLmNvbnRyb2xsZXIgfHwgbm9vcClcclxuXHRcdFx0XHR2YXIga2V5ID0gZGF0YSAmJiBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMua2V5XHJcblx0XHRcdFx0ZGF0YSA9IHBlbmRpbmdSZXF1ZXN0cyA9PSAwIHx8IChjYWNoZWQgJiYgY2FjaGVkLmNvbnRyb2xsZXJzICYmIGNhY2hlZC5jb250cm9sbGVycy5pbmRleE9mKGNvbnRyb2xsZXIpID4gLTEpID8gZGF0YS52aWV3KGNvbnRyb2xsZXIpIDoge3RhZzogXCJwbGFjZWhvbGRlclwifVxyXG5cdFx0XHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWQ7XHJcblx0XHRcdFx0aWYgKGtleSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkYXRhLmF0dHJzKSBkYXRhLmF0dHJzID0ge31cclxuXHRcdFx0XHRcdGRhdGEuYXR0cnMua2V5ID0ga2V5XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChjb250cm9sbGVyLm9udW5sb2FkKSB1bmxvYWRlcnMucHVzaCh7Y29udHJvbGxlcjogY29udHJvbGxlciwgaGFuZGxlcjogY29udHJvbGxlci5vbnVubG9hZH0pXHJcblx0XHRcdFx0dmlld3MucHVzaCh2aWV3KVxyXG5cdFx0XHRcdGNvbnRyb2xsZXJzLnB1c2goY29udHJvbGxlcilcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIWRhdGEudGFnICYmIGNvbnRyb2xsZXJzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKFwiQ29tcG9uZW50IHRlbXBsYXRlIG11c3QgcmV0dXJuIGEgdmlydHVhbCBlbGVtZW50LCBub3QgYW4gYXJyYXksIHN0cmluZywgZXRjLlwiKVxyXG5cdFx0XHRpZiAoIWRhdGEuYXR0cnMpIGRhdGEuYXR0cnMgPSB7fTtcclxuXHRcdFx0aWYgKCFjYWNoZWQuYXR0cnMpIGNhY2hlZC5hdHRycyA9IHt9O1xyXG5cclxuXHRcdFx0dmFyIGRhdGFBdHRyS2V5cyA9IE9iamVjdC5rZXlzKGRhdGEuYXR0cnMpXHJcblx0XHRcdHZhciBoYXNLZXlzID0gZGF0YUF0dHJLZXlzLmxlbmd0aCA+IChcImtleVwiIGluIGRhdGEuYXR0cnMgPyAxIDogMClcclxuXHRcdFx0Ly9pZiBhbiBlbGVtZW50IGlzIGRpZmZlcmVudCBlbm91Z2ggZnJvbSB0aGUgb25lIGluIGNhY2hlLCByZWNyZWF0ZSBpdFxyXG5cdFx0XHRpZiAoZGF0YS50YWcgIT0gY2FjaGVkLnRhZyB8fCBkYXRhQXR0cktleXMuc29ydCgpLmpvaW4oKSAhPSBPYmplY3Qua2V5cyhjYWNoZWQuYXR0cnMpLnNvcnQoKS5qb2luKCkgfHwgZGF0YS5hdHRycy5pZCAhPSBjYWNoZWQuYXR0cnMuaWQgfHwgZGF0YS5hdHRycy5rZXkgIT0gY2FjaGVkLmF0dHJzLmtleSB8fCAobS5yZWRyYXcuc3RyYXRlZ3koKSA9PSBcImFsbFwiICYmICghY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluICE9PSB0cnVlKSkgfHwgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJkaWZmXCIgJiYgY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluID09PSBmYWxzZSkpIHtcclxuXHRcdFx0XHRpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCkgY2xlYXIoY2FjaGVkLm5vZGVzKTtcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNvbmZpZ0NvbnRleHQgJiYgdHlwZW9mIGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID09PSBGVU5DVElPTikgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQoKVxyXG5cdFx0XHRcdGlmIChjYWNoZWQuY29udHJvbGxlcnMpIHtcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY2FjaGVkLmNvbnRyb2xsZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBjb250cm9sbGVyLm9udW5sb2FkID09PSBGVU5DVElPTikgY29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZS5jYWxsKGRhdGEudGFnKSAhPSBTVFJJTkcpIHJldHVybjtcclxuXHJcblx0XHRcdHZhciBub2RlLCBpc05ldyA9IGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDA7XHJcblx0XHRcdGlmIChkYXRhLmF0dHJzLnhtbG5zKSBuYW1lc3BhY2UgPSBkYXRhLmF0dHJzLnhtbG5zO1xyXG5cdFx0XHRlbHNlIGlmIChkYXRhLnRhZyA9PT0gXCJzdmdcIikgbmFtZXNwYWNlID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiO1xyXG5cdFx0XHRlbHNlIGlmIChkYXRhLnRhZyA9PT0gXCJtYXRoXCIpIG5hbWVzcGFjZSA9IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTFwiO1xyXG5cdFx0XHRcclxuXHRcdFx0aWYgKGlzTmV3KSB7XHJcblx0XHRcdFx0aWYgKGRhdGEuYXR0cnMuaXMpIG5vZGUgPSBuYW1lc3BhY2UgPT09IHVuZGVmaW5lZCA/ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKSA6ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBkYXRhLnRhZywgZGF0YS5hdHRycy5pcyk7XHJcblx0XHRcdFx0ZWxzZSBub2RlID0gbmFtZXNwYWNlID09PSB1bmRlZmluZWQgPyAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZykgOiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcpO1xyXG5cdFx0XHRcdGNhY2hlZCA9IHtcclxuXHRcdFx0XHRcdHRhZzogZGF0YS50YWcsXHJcblx0XHRcdFx0XHQvL3NldCBhdHRyaWJ1dGVzIGZpcnN0LCB0aGVuIGNyZWF0ZSBjaGlsZHJlblxyXG5cdFx0XHRcdFx0YXR0cnM6IGhhc0tleXMgPyBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCB7fSwgbmFtZXNwYWNlKSA6IGRhdGEuYXR0cnMsXHJcblx0XHRcdFx0XHRjaGlsZHJlbjogZGF0YS5jaGlsZHJlbiAhPSBudWxsICYmIGRhdGEuY2hpbGRyZW4ubGVuZ3RoID4gMCA/XHJcblx0XHRcdFx0XHRcdGJ1aWxkKG5vZGUsIGRhdGEudGFnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZGF0YS5jaGlsZHJlbiwgY2FjaGVkLmNoaWxkcmVuLCB0cnVlLCAwLCBkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSwgbmFtZXNwYWNlLCBjb25maWdzKSA6XHJcblx0XHRcdFx0XHRcdGRhdGEuY2hpbGRyZW4sXHJcblx0XHRcdFx0XHRub2RlczogW25vZGVdXHJcblx0XHRcdFx0fTtcclxuXHRcdFx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRjYWNoZWQudmlld3MgPSB2aWV3c1xyXG5cdFx0XHRcdFx0Y2FjaGVkLmNvbnRyb2xsZXJzID0gY29udHJvbGxlcnNcclxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwLCBjb250cm9sbGVyOyBjb250cm9sbGVyID0gY29udHJvbGxlcnNbaV07IGkrKykge1xyXG5cdFx0XHRcdFx0XHRpZiAoY29udHJvbGxlci5vbnVubG9hZCAmJiBjb250cm9sbGVyLm9udW5sb2FkLiRvbGQpIGNvbnRyb2xsZXIub251bmxvYWQgPSBjb250cm9sbGVyLm9udW5sb2FkLiRvbGRcclxuXHRcdFx0XHRcdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyAmJiBjb250cm9sbGVyLm9udW5sb2FkKSB7XHJcblx0XHRcdFx0XHRcdFx0dmFyIG9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZFxyXG5cdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQgPSBub29wXHJcblx0XHRcdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZC4kb2xkID0gb251bmxvYWRcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZiAoY2FjaGVkLmNoaWxkcmVuICYmICFjYWNoZWQuY2hpbGRyZW4ubm9kZXMpIGNhY2hlZC5jaGlsZHJlbi5ub2RlcyA9IFtdO1xyXG5cdFx0XHRcdC8vZWRnZSBjYXNlOiBzZXR0aW5nIHZhbHVlIG9uIDxzZWxlY3Q+IGRvZXNuJ3Qgd29yayBiZWZvcmUgY2hpbGRyZW4gZXhpc3QsIHNvIHNldCBpdCBhZ2FpbiBhZnRlciBjaGlsZHJlbiBoYXZlIGJlZW4gY3JlYXRlZFxyXG5cdFx0XHRcdGlmIChkYXRhLnRhZyA9PT0gXCJzZWxlY3RcIiAmJiBcInZhbHVlXCIgaW4gZGF0YS5hdHRycykgc2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywge3ZhbHVlOiBkYXRhLmF0dHJzLnZhbHVlfSwge30sIG5hbWVzcGFjZSk7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdG5vZGUgPSBjYWNoZWQubm9kZXNbMF07XHJcblx0XHRcdFx0aWYgKGhhc0tleXMpIHNldEF0dHJpYnV0ZXMobm9kZSwgZGF0YS50YWcsIGRhdGEuYXR0cnMsIGNhY2hlZC5hdHRycywgbmFtZXNwYWNlKTtcclxuXHRcdFx0XHRjYWNoZWQuY2hpbGRyZW4gPSBidWlsZChub2RlLCBkYXRhLnRhZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGRhdGEuY2hpbGRyZW4sIGNhY2hlZC5jaGlsZHJlbiwgZmFsc2UsIDAsIGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLCBuYW1lc3BhY2UsIGNvbmZpZ3MpO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2Rlcy5pbnRhY3QgPSB0cnVlO1xyXG5cdFx0XHRcdGlmIChjb250cm9sbGVycy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdFx0XHRjYWNoZWQuY29udHJvbGxlcnMgPSBjb250cm9sbGVyc1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoc2hvdWxkUmVhdHRhY2ggPT09IHRydWUgJiYgbm9kZSAhPSBudWxsKSBwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2RlLCBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0XHRcdH1cclxuXHRcdFx0Ly9zY2hlZHVsZSBjb25maWdzIHRvIGJlIGNhbGxlZC4gVGhleSBhcmUgY2FsbGVkIGFmdGVyIGBidWlsZGAgZmluaXNoZXMgcnVubmluZ1xyXG5cdFx0XHRpZiAodHlwZW9mIGRhdGEuYXR0cnNbXCJjb25maWdcIl0gPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0dmFyIGNvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0IHx8IHt9O1xyXG5cclxuXHRcdFx0XHQvLyBiaW5kXHJcblx0XHRcdFx0dmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZGF0YSwgYXJncykge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZGF0YS5hdHRyc1tcImNvbmZpZ1wiXS5hcHBseShkYXRhLCBhcmdzKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0Y29uZmlncy5wdXNoKGNhbGxiYWNrKGRhdGEsIFtub2RlLCAhaXNOZXcsIGNvbnRleHQsIGNhY2hlZF0pKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0eXBlb2YgZGF0YSAhPSBGVU5DVElPTikge1xyXG5cdFx0XHQvL2hhbmRsZSB0ZXh0IG5vZGVzXHJcblx0XHRcdHZhciBub2RlcztcclxuXHRcdFx0aWYgKGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDApIHtcclxuXHRcdFx0XHRpZiAoZGF0YS4kdHJ1c3RlZCkge1xyXG5cdFx0XHRcdFx0bm9kZXMgPSBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV07XHJcblx0XHRcdFx0XHRpZiAoIXBhcmVudEVsZW1lbnQubm9kZU5hbWUubWF0Y2godm9pZEVsZW1lbnRzKSkgcGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobm9kZXNbMF0sIHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gfHwgbnVsbClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gXCJzdHJpbmcgbnVtYmVyIGJvb2xlYW5cIi5pbmRleE9mKHR5cGVvZiBkYXRhKSA+IC0xID8gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSkgOiBkYXRhO1xyXG5cdFx0XHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLnZhbHVlT2YoKSAhPT0gZGF0YS52YWx1ZU9mKCkgfHwgc2hvdWxkUmVhdHRhY2ggPT09IHRydWUpIHtcclxuXHRcdFx0XHRub2RlcyA9IGNhY2hlZC5ub2RlcztcclxuXHRcdFx0XHRpZiAoIWVkaXRhYmxlIHx8IGVkaXRhYmxlICE9PSAkZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkge1xyXG5cdFx0XHRcdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0XHRcdFx0Y2xlYXIobm9kZXMsIGNhY2hlZCk7XHJcblx0XHRcdFx0XHRcdG5vZGVzID0gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSlcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0XHQvL2Nvcm5lciBjYXNlOiByZXBsYWNpbmcgdGhlIG5vZGVWYWx1ZSBvZiBhIHRleHQgbm9kZSB0aGF0IGlzIGEgY2hpbGQgb2YgYSB0ZXh0YXJlYS9jb250ZW50ZWRpdGFibGUgZG9lc24ndCB3b3JrXHJcblx0XHRcdFx0XHRcdC8vd2UgbmVlZCB0byB1cGRhdGUgdGhlIHZhbHVlIHByb3BlcnR5IG9mIHRoZSBwYXJlbnQgdGV4dGFyZWEgb3IgdGhlIGlubmVySFRNTCBvZiB0aGUgY29udGVudGVkaXRhYmxlIGVsZW1lbnQgaW5zdGVhZFxyXG5cdFx0XHRcdFx0XHRpZiAocGFyZW50VGFnID09PSBcInRleHRhcmVhXCIpIHBhcmVudEVsZW1lbnQudmFsdWUgPSBkYXRhO1xyXG5cdFx0XHRcdFx0XHRlbHNlIGlmIChlZGl0YWJsZSkgZWRpdGFibGUuaW5uZXJIVE1MID0gZGF0YTtcclxuXHRcdFx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKG5vZGVzWzBdLm5vZGVUeXBlID09PSAxIHx8IG5vZGVzLmxlbmd0aCA+IDEpIHsgLy93YXMgYSB0cnVzdGVkIHN0cmluZ1xyXG5cdFx0XHRcdFx0XHRcdFx0Y2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpO1xyXG5cdFx0XHRcdFx0XHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXVxyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2Rlc1swXSwgcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSB8fCBudWxsKTtcclxuXHRcdFx0XHRcdFx0XHRub2Rlc1swXS5ub2RlVmFsdWUgPSBkYXRhXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSk7XHJcblx0XHRcdFx0Y2FjaGVkLm5vZGVzID0gbm9kZXNcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGNhY2hlZC5ub2Rlcy5pbnRhY3QgPSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNhY2hlZFxyXG5cdH1cclxuXHRmdW5jdGlvbiBzb3J0Q2hhbmdlcyhhLCBiKSB7cmV0dXJuIGEuYWN0aW9uIC0gYi5hY3Rpb24gfHwgYS5pbmRleCAtIGIuaW5kZXh9XHJcblx0ZnVuY3Rpb24gc2V0QXR0cmlidXRlcyhub2RlLCB0YWcsIGRhdGFBdHRycywgY2FjaGVkQXR0cnMsIG5hbWVzcGFjZSkge1xyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gZGF0YUF0dHJzKSB7XHJcblx0XHRcdHZhciBkYXRhQXR0ciA9IGRhdGFBdHRyc1thdHRyTmFtZV07XHJcblx0XHRcdHZhciBjYWNoZWRBdHRyID0gY2FjaGVkQXR0cnNbYXR0ck5hbWVdO1xyXG5cdFx0XHRpZiAoIShhdHRyTmFtZSBpbiBjYWNoZWRBdHRycykgfHwgKGNhY2hlZEF0dHIgIT09IGRhdGFBdHRyKSkge1xyXG5cdFx0XHRcdGNhY2hlZEF0dHJzW2F0dHJOYW1lXSA9IGRhdGFBdHRyO1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvL2Bjb25maWdgIGlzbid0IGEgcmVhbCBhdHRyaWJ1dGVzLCBzbyBpZ25vcmUgaXRcclxuXHRcdFx0XHRcdGlmIChhdHRyTmFtZSA9PT0gXCJjb25maWdcIiB8fCBhdHRyTmFtZSA9PSBcImtleVwiKSBjb250aW51ZTtcclxuXHRcdFx0XHRcdC8vaG9vayBldmVudCBoYW5kbGVycyB0byB0aGUgYXV0by1yZWRyYXdpbmcgc3lzdGVtXHJcblx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgZGF0YUF0dHIgPT09IEZVTkNUSU9OICYmIGF0dHJOYW1lLmluZGV4T2YoXCJvblwiKSA9PT0gMCkge1xyXG5cdFx0XHRcdFx0XHRub2RlW2F0dHJOYW1lXSA9IGF1dG9yZWRyYXcoZGF0YUF0dHIsIG5vZGUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvL2hhbmRsZSBgc3R5bGU6IHsuLi59YFxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwic3R5bGVcIiAmJiBkYXRhQXR0ciAhPSBudWxsICYmIHR5cGUuY2FsbChkYXRhQXR0cikgPT09IE9CSkVDVCkge1xyXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBydWxlIGluIGRhdGFBdHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGNhY2hlZEF0dHIgPT0gbnVsbCB8fCBjYWNoZWRBdHRyW3J1bGVdICE9PSBkYXRhQXR0cltydWxlXSkgbm9kZS5zdHlsZVtydWxlXSA9IGRhdGFBdHRyW3J1bGVdXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcnVsZSBpbiBjYWNoZWRBdHRyKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKCEocnVsZSBpbiBkYXRhQXR0cikpIG5vZGUuc3R5bGVbcnVsZV0gPSBcIlwiXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIFNWR1xyXG5cdFx0XHRcdFx0ZWxzZSBpZiAobmFtZXNwYWNlICE9IG51bGwpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGF0dHJOYW1lID09PSBcImhyZWZcIikgbm9kZS5zZXRBdHRyaWJ1dGVOUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiwgXCJocmVmXCIsIGRhdGFBdHRyKTtcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwiY2xhc3NOYW1lXCIpIG5vZGUuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgZGF0YUF0dHIpO1xyXG5cdFx0XHRcdFx0XHRlbHNlIG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vaGFuZGxlIGNhc2VzIHRoYXQgYXJlIHByb3BlcnRpZXMgKGJ1dCBpZ25vcmUgY2FzZXMgd2hlcmUgd2Ugc2hvdWxkIHVzZSBzZXRBdHRyaWJ1dGUgaW5zdGVhZClcclxuXHRcdFx0XHRcdC8vLSBsaXN0IGFuZCBmb3JtIGFyZSB0eXBpY2FsbHkgdXNlZCBhcyBzdHJpbmdzLCBidXQgYXJlIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4ganNcclxuXHRcdFx0XHRcdC8vLSB3aGVuIHVzaW5nIENTUyBzZWxlY3RvcnMgKGUuZy4gYG0oXCJbc3R5bGU9JyddXCIpYCksIHN0eWxlIGlzIHVzZWQgYXMgYSBzdHJpbmcsIGJ1dCBpdCdzIGFuIG9iamVjdCBpbiBqc1xyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgaW4gbm9kZSAmJiAhKGF0dHJOYW1lID09PSBcImxpc3RcIiB8fCBhdHRyTmFtZSA9PT0gXCJzdHlsZVwiIHx8IGF0dHJOYW1lID09PSBcImZvcm1cIiB8fCBhdHRyTmFtZSA9PT0gXCJ0eXBlXCIgfHwgYXR0ck5hbWUgPT09IFwid2lkdGhcIiB8fCBhdHRyTmFtZSA9PT0gXCJoZWlnaHRcIikpIHtcclxuXHRcdFx0XHRcdFx0Ly8jMzQ4IGRvbid0IHNldCB0aGUgdmFsdWUgaWYgbm90IG5lZWRlZCBvdGhlcndpc2UgY3Vyc29yIHBsYWNlbWVudCBicmVha3MgaW4gQ2hyb21lXHJcblx0XHRcdFx0XHRcdGlmICh0YWcgIT09IFwiaW5wdXRcIiB8fCBub2RlW2F0dHJOYW1lXSAhPT0gZGF0YUF0dHIpIG5vZGVbYXR0ck5hbWVdID0gZGF0YUF0dHJcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdGVsc2Ugbm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRhdGFBdHRyKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0Ly9zd2FsbG93IElFJ3MgaW52YWxpZCBhcmd1bWVudCBlcnJvcnMgdG8gbWltaWMgSFRNTCdzIGZhbGxiYWNrLXRvLWRvaW5nLW5vdGhpbmctb24taW52YWxpZC1hdHRyaWJ1dGVzIGJlaGF2aW9yXHJcblx0XHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJJbnZhbGlkIGFyZ3VtZW50XCIpIDwgMCkgdGhyb3cgZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvLyMzNDggZGF0YUF0dHIgbWF5IG5vdCBiZSBhIHN0cmluZywgc28gdXNlIGxvb3NlIGNvbXBhcmlzb24gKGRvdWJsZSBlcXVhbCkgaW5zdGVhZCBvZiBzdHJpY3QgKHRyaXBsZSBlcXVhbClcclxuXHRcdFx0ZWxzZSBpZiAoYXR0ck5hbWUgPT09IFwidmFsdWVcIiAmJiB0YWcgPT09IFwiaW5wdXRcIiAmJiBub2RlLnZhbHVlICE9IGRhdGFBdHRyKSB7XHJcblx0XHRcdFx0bm9kZS52YWx1ZSA9IGRhdGFBdHRyXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBjYWNoZWRBdHRyc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBjbGVhcihub2RlcywgY2FjaGVkKSB7XHJcblx0XHRmb3IgKHZhciBpID0gbm9kZXMubGVuZ3RoIC0gMTsgaSA+IC0xOyBpLS0pIHtcclxuXHRcdFx0aWYgKG5vZGVzW2ldICYmIG5vZGVzW2ldLnBhcmVudE5vZGUpIHtcclxuXHRcdFx0XHR0cnkge25vZGVzW2ldLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZXNbaV0pfVxyXG5cdFx0XHRcdGNhdGNoIChlKSB7fSAvL2lnbm9yZSBpZiB0aGlzIGZhaWxzIGR1ZSB0byBvcmRlciBvZiBldmVudHMgKHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIxOTI2MDgzL2ZhaWxlZC10by1leGVjdXRlLXJlbW92ZWNoaWxkLW9uLW5vZGUpXHJcblx0XHRcdFx0Y2FjaGVkID0gW10uY29uY2F0KGNhY2hlZCk7XHJcblx0XHRcdFx0aWYgKGNhY2hlZFtpXSkgdW5sb2FkKGNhY2hlZFtpXSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKG5vZGVzLmxlbmd0aCAhPSAwKSBub2Rlcy5sZW5ndGggPSAwXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHVubG9hZChjYWNoZWQpIHtcclxuXHRcdGlmIChjYWNoZWQuY29uZmlnQ29udGV4dCAmJiB0eXBlb2YgY2FjaGVkLmNvbmZpZ0NvbnRleHQub251bmxvYWQgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKCk7XHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMCwgY29udHJvbGxlcjsgY29udHJvbGxlciA9IGNhY2hlZC5jb250cm9sbGVyc1tpXTsgaSsrKSB7XHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjb250cm9sbGVyLm9udW5sb2FkID09PSBGVU5DVElPTikgY29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jaGlsZHJlbikge1xyXG5cdFx0XHRpZiAodHlwZS5jYWxsKGNhY2hlZC5jaGlsZHJlbikgPT09IEFSUkFZKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGNoaWxkOyBjaGlsZCA9IGNhY2hlZC5jaGlsZHJlbltpXTsgaSsrKSB1bmxvYWQoY2hpbGQpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLmNoaWxkcmVuLnRhZykgdW5sb2FkKGNhY2hlZC5jaGlsZHJlbilcclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gaW5qZWN0SFRNTChwYXJlbnRFbGVtZW50LCBpbmRleCwgZGF0YSkge1xyXG5cdFx0dmFyIG5leHRTaWJsaW5nID0gcGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XTtcclxuXHRcdGlmIChuZXh0U2libGluZykge1xyXG5cdFx0XHR2YXIgaXNFbGVtZW50ID0gbmV4dFNpYmxpbmcubm9kZVR5cGUgIT0gMTtcclxuXHRcdFx0dmFyIHBsYWNlaG9sZGVyID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xyXG5cdFx0XHRpZiAoaXNFbGVtZW50KSB7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIG5leHRTaWJsaW5nIHx8IG51bGwpO1xyXG5cdFx0XHRcdHBsYWNlaG9sZGVyLmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWJlZ2luXCIsIGRhdGEpO1xyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQocGxhY2Vob2xkZXIpXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBuZXh0U2libGluZy5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmViZWdpblwiLCBkYXRhKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBwYXJlbnRFbGVtZW50Lmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWVuZFwiLCBkYXRhKTtcclxuXHRcdHZhciBub2RlcyA9IFtdO1xyXG5cdFx0d2hpbGUgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gIT09IG5leHRTaWJsaW5nKSB7XHJcblx0XHRcdG5vZGVzLnB1c2gocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSk7XHJcblx0XHRcdGluZGV4KytcclxuXHRcdH1cclxuXHRcdHJldHVybiBub2Rlc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBhdXRvcmVkcmF3KGNhbGxiYWNrLCBvYmplY3QpIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbihlKSB7XHJcblx0XHRcdGUgPSBlIHx8IGV2ZW50O1xyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIik7XHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0XHR0cnkge3JldHVybiBjYWxsYmFjay5jYWxsKG9iamVjdCwgZSl9XHJcblx0XHRcdGZpbmFsbHkge1xyXG5cdFx0XHRcdGVuZEZpcnN0Q29tcHV0YXRpb24oKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgaHRtbDtcclxuXHR2YXIgZG9jdW1lbnROb2RlID0ge1xyXG5cdFx0YXBwZW5kQ2hpbGQ6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0aWYgKGh0bWwgPT09IHVuZGVmaW5lZCkgaHRtbCA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKTtcclxuXHRcdFx0aWYgKCRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgJiYgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAhPT0gbm9kZSkge1xyXG5cdFx0XHRcdCRkb2N1bWVudC5yZXBsYWNlQ2hpbGQobm9kZSwgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudClcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlICRkb2N1bWVudC5hcHBlbmRDaGlsZChub2RlKTtcclxuXHRcdFx0dGhpcy5jaGlsZE5vZGVzID0gJGRvY3VtZW50LmNoaWxkTm9kZXNcclxuXHRcdH0sXHJcblx0XHRpbnNlcnRCZWZvcmU6IGZ1bmN0aW9uKG5vZGUpIHtcclxuXHRcdFx0dGhpcy5hcHBlbmRDaGlsZChub2RlKVxyXG5cdFx0fSxcclxuXHRcdGNoaWxkTm9kZXM6IFtdXHJcblx0fTtcclxuXHR2YXIgbm9kZUNhY2hlID0gW10sIGNlbGxDYWNoZSA9IHt9O1xyXG5cdG0ucmVuZGVyID0gZnVuY3Rpb24ocm9vdCwgY2VsbCwgZm9yY2VSZWNyZWF0aW9uKSB7XHJcblx0XHR2YXIgY29uZmlncyA9IFtdO1xyXG5cdFx0aWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIERPTSBlbGVtZW50IGJlaW5nIHBhc3NlZCB0byBtLnJvdXRlL20ubW91bnQvbS5yZW5kZXIgaXMgbm90IHVuZGVmaW5lZC5cIik7XHJcblx0XHR2YXIgaWQgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdCk7XHJcblx0XHR2YXIgaXNEb2N1bWVudFJvb3QgPSByb290ID09PSAkZG9jdW1lbnQ7XHJcblx0XHR2YXIgbm9kZSA9IGlzRG9jdW1lbnRSb290IHx8IHJvb3QgPT09ICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgPyBkb2N1bWVudE5vZGUgOiByb290O1xyXG5cdFx0aWYgKGlzRG9jdW1lbnRSb290ICYmIGNlbGwudGFnICE9IFwiaHRtbFwiKSBjZWxsID0ge3RhZzogXCJodG1sXCIsIGF0dHJzOiB7fSwgY2hpbGRyZW46IGNlbGx9O1xyXG5cdFx0aWYgKGNlbGxDYWNoZVtpZF0gPT09IHVuZGVmaW5lZCkgY2xlYXIobm9kZS5jaGlsZE5vZGVzKTtcclxuXHRcdGlmIChmb3JjZVJlY3JlYXRpb24gPT09IHRydWUpIHJlc2V0KHJvb3QpO1xyXG5cdFx0Y2VsbENhY2hlW2lkXSA9IGJ1aWxkKG5vZGUsIG51bGwsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjZWxsLCBjZWxsQ2FjaGVbaWRdLCBmYWxzZSwgMCwgbnVsbCwgdW5kZWZpbmVkLCBjb25maWdzKTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBjb25maWdzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSBjb25maWdzW2ldKClcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIGdldENlbGxDYWNoZUtleShlbGVtZW50KSB7XHJcblx0XHR2YXIgaW5kZXggPSBub2RlQ2FjaGUuaW5kZXhPZihlbGVtZW50KTtcclxuXHRcdHJldHVybiBpbmRleCA8IDAgPyBub2RlQ2FjaGUucHVzaChlbGVtZW50KSAtIDEgOiBpbmRleFxyXG5cdH1cclxuXHJcblx0bS50cnVzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHR2YWx1ZSA9IG5ldyBTdHJpbmcodmFsdWUpO1xyXG5cdFx0dmFsdWUuJHRydXN0ZWQgPSB0cnVlO1xyXG5cdFx0cmV0dXJuIHZhbHVlXHJcblx0fTtcclxuXHJcblx0ZnVuY3Rpb24gZ2V0dGVyc2V0dGVyKHN0b3JlKSB7XHJcblx0XHR2YXIgcHJvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCkgc3RvcmUgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHJldHVybiBzdG9yZVxyXG5cdFx0fTtcclxuXHJcblx0XHRwcm9wLnRvSlNPTiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblxyXG5cdG0ucHJvcCA9IGZ1bmN0aW9uIChzdG9yZSkge1xyXG5cdFx0Ly9ub3RlOiB1c2luZyBub24tc3RyaWN0IGVxdWFsaXR5IGNoZWNrIGhlcmUgYmVjYXVzZSB3ZSdyZSBjaGVja2luZyBpZiBzdG9yZSBpcyBudWxsIE9SIHVuZGVmaW5lZFxyXG5cdFx0aWYgKCgoc3RvcmUgIT0gbnVsbCAmJiB0eXBlLmNhbGwoc3RvcmUpID09PSBPQkpFQ1QpIHx8IHR5cGVvZiBzdG9yZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiBzdG9yZS50aGVuID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRyZXR1cm4gcHJvcGlmeShzdG9yZSlcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gZ2V0dGVyc2V0dGVyKHN0b3JlKVxyXG5cdH07XHJcblxyXG5cdHZhciByb290cyA9IFtdLCBjb21wb25lbnRzID0gW10sIGNvbnRyb2xsZXJzID0gW10sIGxhc3RSZWRyYXdJZCA9IG51bGwsIGxhc3RSZWRyYXdDYWxsVGltZSA9IDAsIGNvbXB1dGVQcmVSZWRyYXdIb29rID0gbnVsbCwgY29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbCwgcHJldmVudGVkID0gZmFsc2UsIHRvcENvbXBvbmVudCwgdW5sb2FkZXJzID0gW107XHJcblx0dmFyIEZSQU1FX0JVREdFVCA9IDE2OyAvLzYwIGZyYW1lcyBwZXIgc2Vjb25kID0gMSBjYWxsIHBlciAxNiBtc1xyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIGFyZ3MpIHtcclxuXHRcdHZhciBjb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdHJldHVybiAoY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcCkuYXBwbHkodGhpcywgYXJncykgfHwgdGhpc1xyXG5cdFx0fVxyXG5cdFx0dmFyIHZpZXcgPSBmdW5jdGlvbihjdHJsKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgYXJncyA9IGFyZ3MuY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcclxuXHRcdFx0cmV0dXJuIGNvbXBvbmVudC52aWV3LmFwcGx5KGNvbXBvbmVudCwgYXJncyA/IFtjdHJsXS5jb25jYXQoYXJncykgOiBbY3RybF0pXHJcblx0XHR9XHJcblx0XHR2aWV3LiRvcmlnaW5hbCA9IGNvbXBvbmVudC52aWV3XHJcblx0XHR2YXIgb3V0cHV0ID0ge2NvbnRyb2xsZXI6IGNvbnRyb2xsZXIsIHZpZXc6IHZpZXd9XHJcblx0XHRpZiAoYXJnc1swXSAmJiBhcmdzWzBdLmtleSAhPSBudWxsKSBvdXRwdXQuYXR0cnMgPSB7a2V5OiBhcmdzWzBdLmtleX1cclxuXHRcdHJldHVybiBvdXRwdXRcclxuXHR9XHJcblx0bS5jb21wb25lbnQgPSBmdW5jdGlvbihjb21wb25lbnQpIHtcclxuXHRcdHJldHVybiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXHJcblx0fVxyXG5cdG0ubW91bnQgPSBtLm1vZHVsZSA9IGZ1bmN0aW9uKHJvb3QsIGNvbXBvbmVudCkge1xyXG5cdFx0aWYgKCFyb290KSB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2UgZW5zdXJlIHRoZSBET00gZWxlbWVudCBleGlzdHMgYmVmb3JlIHJlbmRlcmluZyBhIHRlbXBsYXRlIGludG8gaXQuXCIpO1xyXG5cdFx0dmFyIGluZGV4ID0gcm9vdHMuaW5kZXhPZihyb290KTtcclxuXHRcdGlmIChpbmRleCA8IDApIGluZGV4ID0gcm9vdHMubGVuZ3RoO1xyXG5cdFx0XHJcblx0XHR2YXIgaXNQcmV2ZW50ZWQgPSBmYWxzZTtcclxuXHRcdHZhciBldmVudCA9IHtwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7XHJcblx0XHRcdGlzUHJldmVudGVkID0gdHJ1ZTtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBjb21wdXRlUG9zdFJlZHJhd0hvb2sgPSBudWxsO1xyXG5cdFx0fX07XHJcblx0XHRmb3IgKHZhciBpID0gMCwgdW5sb2FkZXI7IHVubG9hZGVyID0gdW5sb2FkZXJzW2ldOyBpKyspIHtcclxuXHRcdFx0dW5sb2FkZXIuaGFuZGxlci5jYWxsKHVubG9hZGVyLmNvbnRyb2xsZXIsIGV2ZW50KVxyXG5cdFx0XHR1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGlzUHJldmVudGVkKSB7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwLCB1bmxvYWRlcjsgdW5sb2FkZXIgPSB1bmxvYWRlcnNbaV07IGkrKykgdW5sb2FkZXIuY29udHJvbGxlci5vbnVubG9hZCA9IHVubG9hZGVyLmhhbmRsZXJcclxuXHRcdH1cclxuXHRcdGVsc2UgdW5sb2FkZXJzID0gW11cclxuXHRcdFxyXG5cdFx0aWYgKGNvbnRyb2xsZXJzW2luZGV4XSAmJiB0eXBlb2YgY29udHJvbGxlcnNbaW5kZXhdLm9udW5sb2FkID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQoZXZlbnQpXHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmICghaXNQcmV2ZW50ZWQpIHtcclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJhbGxcIik7XHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpO1xyXG5cdFx0XHRyb290c1tpbmRleF0gPSByb290O1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIGNvbXBvbmVudCA9IHN1YmNvbXBvbmVudChjb21wb25lbnQsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSlcclxuXHRcdFx0dmFyIGN1cnJlbnRDb21wb25lbnQgPSB0b3BDb21wb25lbnQgPSBjb21wb25lbnQgPSBjb21wb25lbnQgfHwge2NvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge319O1xyXG5cdFx0XHR2YXIgY29uc3RydWN0b3IgPSBjb21wb25lbnQuY29udHJvbGxlciB8fCBub29wXHJcblx0XHRcdHZhciBjb250cm9sbGVyID0gbmV3IGNvbnN0cnVjdG9yO1xyXG5cdFx0XHQvL2NvbnRyb2xsZXJzIG1heSBjYWxsIG0ubW91bnQgcmVjdXJzaXZlbHkgKHZpYSBtLnJvdXRlIHJlZGlyZWN0cywgZm9yIGV4YW1wbGUpXHJcblx0XHRcdC8vdGhpcyBjb25kaXRpb25hbCBlbnN1cmVzIG9ubHkgdGhlIGxhc3QgcmVjdXJzaXZlIG0ubW91bnQgY2FsbCBpcyBhcHBsaWVkXHJcblx0XHRcdGlmIChjdXJyZW50Q29tcG9uZW50ID09PSB0b3BDb21wb25lbnQpIHtcclxuXHRcdFx0XHRjb250cm9sbGVyc1tpbmRleF0gPSBjb250cm9sbGVyO1xyXG5cdFx0XHRcdGNvbXBvbmVudHNbaW5kZXhdID0gY29tcG9uZW50XHJcblx0XHRcdH1cclxuXHRcdFx0ZW5kRmlyc3RDb21wdXRhdGlvbigpO1xyXG5cdFx0XHRyZXR1cm4gY29udHJvbGxlcnNbaW5kZXhdXHJcblx0XHR9XHJcblx0fTtcclxuXHR2YXIgcmVkcmF3aW5nID0gZmFsc2VcclxuXHRtLnJlZHJhdyA9IGZ1bmN0aW9uKGZvcmNlKSB7XHJcblx0XHRpZiAocmVkcmF3aW5nKSByZXR1cm5cclxuXHRcdHJlZHJhd2luZyA9IHRydWVcclxuXHRcdC8vbGFzdFJlZHJhd0lkIGlzIGEgcG9zaXRpdmUgbnVtYmVyIGlmIGEgc2Vjb25kIHJlZHJhdyBpcyByZXF1ZXN0ZWQgYmVmb3JlIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZVxyXG5cdFx0Ly9sYXN0UmVkcmF3SUQgaXMgbnVsbCBpZiBpdCdzIHRoZSBmaXJzdCByZWRyYXcgYW5kIG5vdCBhbiBldmVudCBoYW5kbGVyXHJcblx0XHRpZiAobGFzdFJlZHJhd0lkICYmIGZvcmNlICE9PSB0cnVlKSB7XHJcblx0XHRcdC8vd2hlbiBzZXRUaW1lb3V0OiBvbmx5IHJlc2NoZWR1bGUgcmVkcmF3IGlmIHRpbWUgYmV0d2VlbiBub3cgYW5kIHByZXZpb3VzIHJlZHJhdyBpcyBiaWdnZXIgdGhhbiBhIGZyYW1lLCBvdGhlcndpc2Uga2VlcCBjdXJyZW50bHkgc2NoZWR1bGVkIHRpbWVvdXRcclxuXHRcdFx0Ly93aGVuIHJBRjogYWx3YXlzIHJlc2NoZWR1bGUgcmVkcmF3XHJcblx0XHRcdGlmICgkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID09PSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IG5ldyBEYXRlIC0gbGFzdFJlZHJhd0NhbGxUaW1lID4gRlJBTUVfQlVER0VUKSB7XHJcblx0XHRcdFx0aWYgKGxhc3RSZWRyYXdJZCA+IDApICRjYW5jZWxBbmltYXRpb25GcmFtZShsYXN0UmVkcmF3SWQpO1xyXG5cdFx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVkcmF3LCBGUkFNRV9CVURHRVQpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRyZWRyYXcoKTtcclxuXHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtsYXN0UmVkcmF3SWQgPSBudWxsfSwgRlJBTUVfQlVER0VUKVxyXG5cdFx0fVxyXG5cdFx0cmVkcmF3aW5nID0gZmFsc2VcclxuXHR9O1xyXG5cdG0ucmVkcmF3LnN0cmF0ZWd5ID0gbS5wcm9wKCk7XHJcblx0ZnVuY3Rpb24gcmVkcmF3KCkge1xyXG5cdFx0aWYgKGNvbXB1dGVQcmVSZWRyYXdIb29rKSB7XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rKClcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2sgPSBudWxsXHJcblx0XHR9XHJcblx0XHRmb3IgKHZhciBpID0gMCwgcm9vdDsgcm9vdCA9IHJvb3RzW2ldOyBpKyspIHtcclxuXHRcdFx0aWYgKGNvbnRyb2xsZXJzW2ldKSB7XHJcblx0XHRcdFx0dmFyIGFyZ3MgPSBjb21wb25lbnRzW2ldLmNvbnRyb2xsZXIgJiYgY29tcG9uZW50c1tpXS5jb250cm9sbGVyLiQkYXJncyA/IFtjb250cm9sbGVyc1tpXV0uY29uY2F0KGNvbXBvbmVudHNbaV0uY29udHJvbGxlci4kJGFyZ3MpIDogW2NvbnRyb2xsZXJzW2ldXVxyXG5cdFx0XHRcdG0ucmVuZGVyKHJvb3QsIGNvbXBvbmVudHNbaV0udmlldyA/IGNvbXBvbmVudHNbaV0udmlldyhjb250cm9sbGVyc1tpXSwgYXJncykgOiBcIlwiKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvL2FmdGVyIHJlbmRlcmluZyB3aXRoaW4gYSByb3V0ZWQgY29udGV4dCwgd2UgbmVlZCB0byBzY3JvbGwgYmFjayB0byB0aGUgdG9wLCBhbmQgZmV0Y2ggdGhlIGRvY3VtZW50IHRpdGxlIGZvciBoaXN0b3J5LnB1c2hTdGF0ZVxyXG5cdFx0aWYgKGNvbXB1dGVQb3N0UmVkcmF3SG9vaykge1xyXG5cdFx0XHRjb21wdXRlUG9zdFJlZHJhd0hvb2soKTtcclxuXHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0bGFzdFJlZHJhd0lkID0gbnVsbDtcclxuXHRcdGxhc3RSZWRyYXdDYWxsVGltZSA9IG5ldyBEYXRlO1xyXG5cdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0fVxyXG5cclxuXHR2YXIgcGVuZGluZ1JlcXVlc3RzID0gMDtcclxuXHRtLnN0YXJ0Q29tcHV0YXRpb24gPSBmdW5jdGlvbigpIHtwZW5kaW5nUmVxdWVzdHMrK307XHJcblx0bS5lbmRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0cGVuZGluZ1JlcXVlc3RzID0gTWF0aC5tYXgocGVuZGluZ1JlcXVlc3RzIC0gMSwgMCk7XHJcblx0XHRpZiAocGVuZGluZ1JlcXVlc3RzID09PSAwKSBtLnJlZHJhdygpXHJcblx0fTtcclxuXHR2YXIgZW5kRmlyc3RDb21wdXRhdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT0gXCJub25lXCIpIHtcclxuXHRcdFx0cGVuZGluZ1JlcXVlc3RzLS1cclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0XHR9XHJcblx0XHRlbHNlIG0uZW5kQ29tcHV0YXRpb24oKTtcclxuXHR9XHJcblxyXG5cdG0ud2l0aEF0dHIgPSBmdW5jdGlvbihwcm9wLCB3aXRoQXR0ckNhbGxiYWNrKSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0dmFyIGN1cnJlbnRUYXJnZXQgPSBlLmN1cnJlbnRUYXJnZXQgfHwgdGhpcztcclxuXHRcdFx0d2l0aEF0dHJDYWxsYmFjayhwcm9wIGluIGN1cnJlbnRUYXJnZXQgPyBjdXJyZW50VGFyZ2V0W3Byb3BdIDogY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUocHJvcCkpXHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0Ly9yb3V0aW5nXHJcblx0dmFyIG1vZGVzID0ge3BhdGhuYW1lOiBcIlwiLCBoYXNoOiBcIiNcIiwgc2VhcmNoOiBcIj9cIn07XHJcblx0dmFyIHJlZGlyZWN0ID0gbm9vcCwgcm91dGVQYXJhbXMsIGN1cnJlbnRSb3V0ZSwgaXNEZWZhdWx0Um91dGUgPSBmYWxzZTtcclxuXHRtLnJvdXRlID0gZnVuY3Rpb24oKSB7XHJcblx0XHQvL20ucm91dGUoKVxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBjdXJyZW50Um91dGU7XHJcblx0XHQvL20ucm91dGUoZWwsIGRlZmF1bHRSb3V0ZSwgcm91dGVzKVxyXG5cdFx0ZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyAmJiB0eXBlLmNhbGwoYXJndW1lbnRzWzFdKSA9PT0gU1RSSU5HKSB7XHJcblx0XHRcdHZhciByb290ID0gYXJndW1lbnRzWzBdLCBkZWZhdWx0Um91dGUgPSBhcmd1bWVudHNbMV0sIHJvdXRlciA9IGFyZ3VtZW50c1syXTtcclxuXHRcdFx0cmVkaXJlY3QgPSBmdW5jdGlvbihzb3VyY2UpIHtcclxuXHRcdFx0XHR2YXIgcGF0aCA9IGN1cnJlbnRSb3V0ZSA9IG5vcm1hbGl6ZVJvdXRlKHNvdXJjZSk7XHJcblx0XHRcdFx0aWYgKCFyb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSkge1xyXG5cdFx0XHRcdFx0aWYgKGlzRGVmYXVsdFJvdXRlKSB0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIGRlZmF1bHQgcm91dGUgbWF0Y2hlcyBvbmUgb2YgdGhlIHJvdXRlcyBkZWZpbmVkIGluIG0ucm91dGVcIilcclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gdHJ1ZVxyXG5cdFx0XHRcdFx0bS5yb3V0ZShkZWZhdWx0Um91dGUsIHRydWUpXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IGZhbHNlXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0XHR2YXIgbGlzdGVuZXIgPSBtLnJvdXRlLm1vZGUgPT09IFwiaGFzaFwiID8gXCJvbmhhc2hjaGFuZ2VcIiA6IFwib25wb3BzdGF0ZVwiO1xyXG5cdFx0XHR3aW5kb3dbbGlzdGVuZXJdID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSAkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXVxyXG5cdFx0XHRcdGlmIChtLnJvdXRlLm1vZGUgPT09IFwicGF0aG5hbWVcIikgcGF0aCArPSAkbG9jYXRpb24uc2VhcmNoXHJcblx0XHRcdFx0aWYgKGN1cnJlbnRSb3V0ZSAhPSBub3JtYWxpemVSb3V0ZShwYXRoKSkge1xyXG5cdFx0XHRcdFx0cmVkaXJlY3QocGF0aClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsO1xyXG5cdFx0XHR3aW5kb3dbbGlzdGVuZXJdKClcclxuXHRcdH1cclxuXHRcdC8vY29uZmlnOiBtLnJvdXRlXHJcblx0XHRlbHNlIGlmIChhcmd1bWVudHNbMF0uYWRkRXZlbnRMaXN0ZW5lciB8fCBhcmd1bWVudHNbMF0uYXR0YWNoRXZlbnQpIHtcclxuXHRcdFx0dmFyIGVsZW1lbnQgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHZhciBpc0luaXRpYWxpemVkID0gYXJndW1lbnRzWzFdO1xyXG5cdFx0XHR2YXIgY29udGV4dCA9IGFyZ3VtZW50c1syXTtcclxuXHRcdFx0dmFyIHZkb20gPSBhcmd1bWVudHNbM107XHJcblx0XHRcdGVsZW1lbnQuaHJlZiA9IChtLnJvdXRlLm1vZGUgIT09ICdwYXRobmFtZScgPyAkbG9jYXRpb24ucGF0aG5hbWUgOiAnJykgKyBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgdmRvbS5hdHRycy5ocmVmO1xyXG5cdFx0XHRpZiAoZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKSB7XHJcblx0XHRcdFx0ZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSk7XHJcblx0XHRcdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRlbGVtZW50LmRldGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKTtcclxuXHRcdFx0XHRlbGVtZW50LmF0dGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvL20ucm91dGUocm91dGUsIHBhcmFtcywgc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSlcclxuXHRcdGVsc2UgaWYgKHR5cGUuY2FsbChhcmd1bWVudHNbMF0pID09PSBTVFJJTkcpIHtcclxuXHRcdFx0dmFyIG9sZFJvdXRlID0gY3VycmVudFJvdXRlO1xyXG5cdFx0XHRjdXJyZW50Um91dGUgPSBhcmd1bWVudHNbMF07XHJcblx0XHRcdHZhciBhcmdzID0gYXJndW1lbnRzWzFdIHx8IHt9XHJcblx0XHRcdHZhciBxdWVyeUluZGV4ID0gY3VycmVudFJvdXRlLmluZGV4T2YoXCI/XCIpXHJcblx0XHRcdHZhciBwYXJhbXMgPSBxdWVyeUluZGV4ID4gLTEgPyBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRSb3V0ZS5zbGljZShxdWVyeUluZGV4ICsgMSkpIDoge31cclxuXHRcdFx0Zm9yICh2YXIgaSBpbiBhcmdzKSBwYXJhbXNbaV0gPSBhcmdzW2ldXHJcblx0XHRcdHZhciBxdWVyeXN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmcocGFyYW1zKVxyXG5cdFx0XHR2YXIgY3VycmVudFBhdGggPSBxdWVyeUluZGV4ID4gLTEgPyBjdXJyZW50Um91dGUuc2xpY2UoMCwgcXVlcnlJbmRleCkgOiBjdXJyZW50Um91dGVcclxuXHRcdFx0aWYgKHF1ZXJ5c3RyaW5nKSBjdXJyZW50Um91dGUgPSBjdXJyZW50UGF0aCArIChjdXJyZW50UGF0aC5pbmRleE9mKFwiP1wiKSA9PT0gLTEgPyBcIj9cIiA6IFwiJlwiKSArIHF1ZXJ5c3RyaW5nO1xyXG5cclxuXHRcdFx0dmFyIHNob3VsZFJlcGxhY2VIaXN0b3J5RW50cnkgPSAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMyA/IGFyZ3VtZW50c1syXSA6IGFyZ3VtZW50c1sxXSkgPT09IHRydWUgfHwgb2xkUm91dGUgPT09IGFyZ3VtZW50c1swXTtcclxuXHJcblx0XHRcdGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcclxuXHRcdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbFxyXG5cdFx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0d2luZG93Lmhpc3Rvcnlbc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSA/IFwicmVwbGFjZVN0YXRlXCIgOiBcInB1c2hTdGF0ZVwiXShudWxsLCAkZG9jdW1lbnQudGl0bGUsIG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpO1xyXG5cdFx0XHRcdH07XHJcblx0XHRcdFx0cmVkaXJlY3QobW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHtcclxuXHRcdFx0XHQkbG9jYXRpb25bbS5yb3V0ZS5tb2RlXSA9IGN1cnJlbnRSb3V0ZVxyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG5cdG0ucm91dGUucGFyYW0gPSBmdW5jdGlvbihrZXkpIHtcclxuXHRcdGlmICghcm91dGVQYXJhbXMpIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IGNhbGwgbS5yb3V0ZShlbGVtZW50LCBkZWZhdWx0Um91dGUsIHJvdXRlcykgYmVmb3JlIGNhbGxpbmcgbS5yb3V0ZS5wYXJhbSgpXCIpXHJcblx0XHRyZXR1cm4gcm91dGVQYXJhbXNba2V5XVxyXG5cdH07XHJcblx0bS5yb3V0ZS5tb2RlID0gXCJzZWFyY2hcIjtcclxuXHRmdW5jdGlvbiBub3JtYWxpemVSb3V0ZShyb3V0ZSkge1xyXG5cdFx0cmV0dXJuIHJvdXRlLnNsaWNlKG1vZGVzW20ucm91dGUubW9kZV0ubGVuZ3RoKVxyXG5cdH1cclxuXHRmdW5jdGlvbiByb3V0ZUJ5VmFsdWUocm9vdCwgcm91dGVyLCBwYXRoKSB7XHJcblx0XHRyb3V0ZVBhcmFtcyA9IHt9O1xyXG5cclxuXHRcdHZhciBxdWVyeVN0YXJ0ID0gcGF0aC5pbmRleE9mKFwiP1wiKTtcclxuXHRcdGlmIChxdWVyeVN0YXJ0ICE9PSAtMSkge1xyXG5cdFx0XHRyb3V0ZVBhcmFtcyA9IHBhcnNlUXVlcnlTdHJpbmcocGF0aC5zdWJzdHIocXVlcnlTdGFydCArIDEsIHBhdGgubGVuZ3RoKSk7XHJcblx0XHRcdHBhdGggPSBwYXRoLnN1YnN0cigwLCBxdWVyeVN0YXJ0KVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIEdldCBhbGwgcm91dGVzIGFuZCBjaGVjayBpZiB0aGVyZSdzXHJcblx0XHQvLyBhbiBleGFjdCBtYXRjaCBmb3IgdGhlIGN1cnJlbnQgcGF0aFxyXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhyb3V0ZXIpO1xyXG5cdFx0dmFyIGluZGV4ID0ga2V5cy5pbmRleE9mKHBhdGgpO1xyXG5cdFx0aWYoaW5kZXggIT09IC0xKXtcclxuXHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJba2V5cyBbaW5kZXhdXSk7XHJcblx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAodmFyIHJvdXRlIGluIHJvdXRlcikge1xyXG5cdFx0XHRpZiAocm91dGUgPT09IHBhdGgpIHtcclxuXHRcdFx0XHRtLm1vdW50KHJvb3QsIHJvdXRlcltyb3V0ZV0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChcIl5cIiArIHJvdXRlLnJlcGxhY2UoLzpbXlxcL10rP1xcLnszfS9nLCBcIiguKj8pXCIpLnJlcGxhY2UoLzpbXlxcL10rL2csIFwiKFteXFxcXC9dKylcIikgKyBcIlxcLz8kXCIpO1xyXG5cclxuXHRcdFx0aWYgKG1hdGNoZXIudGVzdChwYXRoKSkge1xyXG5cdFx0XHRcdHBhdGgucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlzID0gcm91dGUubWF0Y2goLzpbXlxcL10rL2cpIHx8IFtdO1xyXG5cdFx0XHRcdFx0dmFyIHZhbHVlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxLCAtMik7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKykgcm91dGVQYXJhbXNba2V5c1tpXS5yZXBsYWNlKC86fFxcLi9nLCBcIlwiKV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWVzW2ldKVxyXG5cdFx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHJldHVybiB0cnVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0ZnVuY3Rpb24gcm91dGVVbm9idHJ1c2l2ZShlKSB7XHJcblx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdGlmIChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5IHx8IGUud2hpY2ggPT09IDIpIHJldHVybjtcclxuXHRcdGlmIChlLnByZXZlbnREZWZhdWx0KSBlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRlbHNlIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuXHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IGUuc3JjRWxlbWVudDtcclxuXHRcdHZhciBhcmdzID0gbS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIgJiYgY3VycmVudFRhcmdldC5zZWFyY2ggPyBwYXJzZVF1ZXJ5U3RyaW5nKGN1cnJlbnRUYXJnZXQuc2VhcmNoLnNsaWNlKDEpKSA6IHt9O1xyXG5cdFx0d2hpbGUgKGN1cnJlbnRUYXJnZXQgJiYgY3VycmVudFRhcmdldC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpICE9IFwiQVwiKSBjdXJyZW50VGFyZ2V0ID0gY3VycmVudFRhcmdldC5wYXJlbnROb2RlXHJcblx0XHRtLnJvdXRlKGN1cnJlbnRUYXJnZXRbbS5yb3V0ZS5tb2RlXS5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aCksIGFyZ3MpXHJcblx0fVxyXG5cdGZ1bmN0aW9uIHNldFNjcm9sbCgpIHtcclxuXHRcdGlmIChtLnJvdXRlLm1vZGUgIT0gXCJoYXNoXCIgJiYgJGxvY2F0aW9uLmhhc2gpICRsb2NhdGlvbi5oYXNoID0gJGxvY2F0aW9uLmhhc2g7XHJcblx0XHRlbHNlIHdpbmRvdy5zY3JvbGxUbygwLCAwKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBidWlsZFF1ZXJ5U3RyaW5nKG9iamVjdCwgcHJlZml4KSB7XHJcblx0XHR2YXIgZHVwbGljYXRlcyA9IHt9XHJcblx0XHR2YXIgc3RyID0gW11cclxuXHRcdGZvciAodmFyIHByb3AgaW4gb2JqZWN0KSB7XHJcblx0XHRcdHZhciBrZXkgPSBwcmVmaXggPyBwcmVmaXggKyBcIltcIiArIHByb3AgKyBcIl1cIiA6IHByb3BcclxuXHRcdFx0dmFyIHZhbHVlID0gb2JqZWN0W3Byb3BdXHJcblx0XHRcdHZhciB2YWx1ZVR5cGUgPSB0eXBlLmNhbGwodmFsdWUpXHJcblx0XHRcdHZhciBwYWlyID0gKHZhbHVlID09PSBudWxsKSA/IGVuY29kZVVSSUNvbXBvbmVudChrZXkpIDpcclxuXHRcdFx0XHR2YWx1ZVR5cGUgPT09IE9CSkVDVCA/IGJ1aWxkUXVlcnlTdHJpbmcodmFsdWUsIGtleSkgOlxyXG5cdFx0XHRcdHZhbHVlVHlwZSA9PT0gQVJSQVkgPyB2YWx1ZS5yZWR1Y2UoZnVuY3Rpb24obWVtbywgaXRlbSkge1xyXG5cdFx0XHRcdFx0aWYgKCFkdXBsaWNhdGVzW2tleV0pIGR1cGxpY2F0ZXNba2V5XSA9IHt9XHJcblx0XHRcdFx0XHRpZiAoIWR1cGxpY2F0ZXNba2V5XVtpdGVtXSkge1xyXG5cdFx0XHRcdFx0XHRkdXBsaWNhdGVzW2tleV1baXRlbV0gPSB0cnVlXHJcblx0XHRcdFx0XHRcdHJldHVybiBtZW1vLmNvbmNhdChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGl0ZW0pKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0cmV0dXJuIG1lbW9cclxuXHRcdFx0XHR9LCBbXSkuam9pbihcIiZcIikgOlxyXG5cdFx0XHRcdGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgXCI9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXHJcblx0XHRcdGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSBzdHIucHVzaChwYWlyKVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHN0ci5qb2luKFwiJlwiKVxyXG5cdH1cclxuXHRmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nKHN0cikge1xyXG5cdFx0aWYgKHN0ci5jaGFyQXQoMCkgPT09IFwiP1wiKSBzdHIgPSBzdHIuc3Vic3RyaW5nKDEpO1xyXG5cdFx0XHJcblx0XHR2YXIgcGFpcnMgPSBzdHIuc3BsaXQoXCImXCIpLCBwYXJhbXMgPSB7fTtcclxuXHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBwYWlycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHR2YXIgcGFpciA9IHBhaXJzW2ldLnNwbGl0KFwiPVwiKTtcclxuXHRcdFx0dmFyIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzBdKVxyXG5cdFx0XHR2YXIgdmFsdWUgPSBwYWlyLmxlbmd0aCA9PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pIDogbnVsbFxyXG5cdFx0XHRpZiAocGFyYW1zW2tleV0gIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmICh0eXBlLmNhbGwocGFyYW1zW2tleV0pICE9PSBBUlJBWSkgcGFyYW1zW2tleV0gPSBbcGFyYW1zW2tleV1dXHJcblx0XHRcdFx0cGFyYW1zW2tleV0ucHVzaCh2YWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIHBhcmFtc1trZXldID0gdmFsdWVcclxuXHRcdH1cclxuXHRcdHJldHVybiBwYXJhbXNcclxuXHR9XHJcblx0bS5yb3V0ZS5idWlsZFF1ZXJ5U3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZ1xyXG5cdG0ucm91dGUucGFyc2VRdWVyeVN0cmluZyA9IHBhcnNlUXVlcnlTdHJpbmdcclxuXHRcclxuXHRmdW5jdGlvbiByZXNldChyb290KSB7XHJcblx0XHR2YXIgY2FjaGVLZXkgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdCk7XHJcblx0XHRjbGVhcihyb290LmNoaWxkTm9kZXMsIGNlbGxDYWNoZVtjYWNoZUtleV0pO1xyXG5cdFx0Y2VsbENhY2hlW2NhY2hlS2V5XSA9IHVuZGVmaW5lZFxyXG5cdH1cclxuXHJcblx0bS5kZWZlcnJlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpO1xyXG5cdFx0ZGVmZXJyZWQucHJvbWlzZSA9IHByb3BpZnkoZGVmZXJyZWQucHJvbWlzZSk7XHJcblx0XHRyZXR1cm4gZGVmZXJyZWRcclxuXHR9O1xyXG5cdGZ1bmN0aW9uIHByb3BpZnkocHJvbWlzZSwgaW5pdGlhbFZhbHVlKSB7XHJcblx0XHR2YXIgcHJvcCA9IG0ucHJvcChpbml0aWFsVmFsdWUpO1xyXG5cdFx0cHJvbWlzZS50aGVuKHByb3ApO1xyXG5cdFx0cHJvcC50aGVuID0gZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpLCBpbml0aWFsVmFsdWUpXHJcblx0XHR9O1xyXG5cdFx0cmV0dXJuIHByb3BcclxuXHR9XHJcblx0Ly9Qcm9taXoubWl0aHJpbC5qcyB8IFpvbG1laXN0ZXIgfCBNSVRcclxuXHQvL2EgbW9kaWZpZWQgdmVyc2lvbiBvZiBQcm9taXouanMsIHdoaWNoIGRvZXMgbm90IGNvbmZvcm0gdG8gUHJvbWlzZXMvQSsgZm9yIHR3byByZWFzb25zOlxyXG5cdC8vMSkgYHRoZW5gIGNhbGxiYWNrcyBhcmUgY2FsbGVkIHN5bmNocm9ub3VzbHkgKGJlY2F1c2Ugc2V0VGltZW91dCBpcyB0b28gc2xvdywgYW5kIHRoZSBzZXRJbW1lZGlhdGUgcG9seWZpbGwgaXMgdG9vIGJpZ1xyXG5cdC8vMikgdGhyb3dpbmcgc3ViY2xhc3NlcyBvZiBFcnJvciBjYXVzZSB0aGUgZXJyb3IgdG8gYmUgYnViYmxlZCB1cCBpbnN0ZWFkIG9mIHRyaWdnZXJpbmcgcmVqZWN0aW9uIChiZWNhdXNlIHRoZSBzcGVjIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZSBpbXBvcnRhbnQgdXNlIGNhc2Ugb2YgZGVmYXVsdCBicm93c2VyIGVycm9yIGhhbmRsaW5nLCBpLmUuIG1lc3NhZ2Ugdy8gbGluZSBudW1iZXIpXHJcblx0ZnVuY3Rpb24gRGVmZXJyZWQoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spIHtcclxuXHRcdHZhciBSRVNPTFZJTkcgPSAxLCBSRUpFQ1RJTkcgPSAyLCBSRVNPTFZFRCA9IDMsIFJFSkVDVEVEID0gNDtcclxuXHRcdHZhciBzZWxmID0gdGhpcywgc3RhdGUgPSAwLCBwcm9taXNlVmFsdWUgPSAwLCBuZXh0ID0gW107XHJcblxyXG5cdFx0c2VsZltcInByb21pc2VcIl0gPSB7fTtcclxuXHJcblx0XHRzZWxmW1wicmVzb2x2ZVwiXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklORztcclxuXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZltcInJlamVjdFwiXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdGlmICghc3RhdGUpIHtcclxuXHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH07XHJcblxyXG5cdFx0c2VsZi5wcm9taXNlW1widGhlblwiXSA9IGZ1bmN0aW9uKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrKSB7XHJcblx0XHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZChzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjayk7XHJcblx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWRUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNURUQpIHtcclxuXHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdG5leHQucHVzaChkZWZlcnJlZClcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdFx0fTtcclxuXHJcblx0XHRmdW5jdGlvbiBmaW5pc2godHlwZSkge1xyXG5cdFx0XHRzdGF0ZSA9IHR5cGUgfHwgUkVKRUNURUQ7XHJcblx0XHRcdG5leHQubWFwKGZ1bmN0aW9uKGRlZmVycmVkKSB7XHJcblx0XHRcdFx0c3RhdGUgPT09IFJFU09MVkVEICYmIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZVZhbHVlKSB8fCBkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHRoZW5uYWJsZSh0aGVuLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaywgbm90VGhlbm5hYmxlQ2FsbGJhY2spIHtcclxuXHRcdFx0aWYgKCgocHJvbWlzZVZhbHVlICE9IG51bGwgJiYgdHlwZS5jYWxsKHByb21pc2VWYWx1ZSkgPT09IE9CSkVDVCkgfHwgdHlwZW9mIHByb21pc2VWYWx1ZSA9PT0gRlVOQ1RJT04pICYmIHR5cGVvZiB0aGVuID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHQvLyBjb3VudCBwcm90ZWN0cyBhZ2FpbnN0IGFidXNlIGNhbGxzIGZyb20gc3BlYyBjaGVja2VyXHJcblx0XHRcdFx0XHR2YXIgY291bnQgPSAwO1xyXG5cdFx0XHRcdFx0dGhlbi5jYWxsKHByb21pc2VWYWx1ZSwgZnVuY3Rpb24odmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVybjtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdHN1Y2Nlc3NDYWxsYmFjaygpXHJcblx0XHRcdFx0XHR9LCBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVybjtcclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWU7XHJcblx0XHRcdFx0XHRcdGZhaWx1cmVDYWxsYmFjaygpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRcdGZhaWx1cmVDYWxsYmFjaygpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG5vdFRoZW5uYWJsZUNhbGxiYWNrKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGZpcmUoKSB7XHJcblx0XHRcdC8vIGNoZWNrIGlmIGl0J3MgYSB0aGVuYWJsZVxyXG5cdFx0XHR2YXIgdGhlbjtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHR0aGVuID0gcHJvbWlzZVZhbHVlICYmIHByb21pc2VWYWx1ZS50aGVuXHJcblx0XHRcdH1cclxuXHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IoZSk7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZTtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHRcdFx0XHRyZXR1cm4gZmlyZSgpXHJcblx0XHRcdH1cclxuXHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HO1xyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElORztcclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fSwgZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIHR5cGVvZiBzdWNjZXNzQ2FsbGJhY2sgPT09IEZVTkNUSU9OKSB7XHJcblx0XHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IHN1Y2Nlc3NDYWxsYmFjayhwcm9taXNlVmFsdWUpXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNUSU5HICYmIHR5cGVvZiBmYWlsdXJlQ2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBmYWlsdXJlQ2FsbGJhY2socHJvbWlzZVZhbHVlKTtcclxuXHRcdFx0XHRcdFx0c3RhdGUgPSBSRVNPTFZJTkdcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKTtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IGU7XHJcblx0XHRcdFx0XHRyZXR1cm4gZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChwcm9taXNlVmFsdWUgPT09IHNlbGYpIHtcclxuXHRcdFx0XHRcdHByb21pc2VWYWx1ZSA9IFR5cGVFcnJvcigpO1xyXG5cdFx0XHRcdFx0ZmluaXNoKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRmaW5pc2goUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9LCBmaW5pc2gsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKHN0YXRlID09PSBSRVNPTFZJTkcgJiYgUkVTT0xWRUQpXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblx0bS5kZWZlcnJlZC5vbmVycm9yID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0aWYgKHR5cGUuY2FsbChlKSA9PT0gXCJbb2JqZWN0IEVycm9yXVwiICYmICFlLmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkubWF0Y2goLyBFcnJvci8pKSB0aHJvdyBlXHJcblx0fTtcclxuXHJcblx0bS5zeW5jID0gZnVuY3Rpb24oYXJncykge1xyXG5cdFx0dmFyIG1ldGhvZCA9IFwicmVzb2x2ZVwiO1xyXG5cdFx0ZnVuY3Rpb24gc3luY2hyb25pemVyKHBvcywgcmVzb2x2ZWQpIHtcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKHZhbHVlKSB7XHJcblx0XHRcdFx0cmVzdWx0c1twb3NdID0gdmFsdWU7XHJcblx0XHRcdFx0aWYgKCFyZXNvbHZlZCkgbWV0aG9kID0gXCJyZWplY3RcIjtcclxuXHRcdFx0XHRpZiAoLS1vdXRzdGFuZGluZyA9PT0gMCkge1xyXG5cdFx0XHRcdFx0ZGVmZXJyZWQucHJvbWlzZShyZXN1bHRzKTtcclxuXHRcdFx0XHRcdGRlZmVycmVkW21ldGhvZF0ocmVzdWx0cylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHZhbHVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHR2YXIgZGVmZXJyZWQgPSBtLmRlZmVycmVkKCk7XHJcblx0XHR2YXIgb3V0c3RhbmRpbmcgPSBhcmdzLmxlbmd0aDtcclxuXHRcdHZhciByZXN1bHRzID0gbmV3IEFycmF5KG91dHN0YW5kaW5nKTtcclxuXHRcdGlmIChhcmdzLmxlbmd0aCA+IDApIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0YXJnc1tpXS50aGVuKHN5bmNocm9uaXplcihpLCB0cnVlKSwgc3luY2hyb25pemVyKGksIGZhbHNlKSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBkZWZlcnJlZC5yZXNvbHZlKFtdKTtcclxuXHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdH07XHJcblx0ZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtyZXR1cm4gdmFsdWV9XHJcblxyXG5cdGZ1bmN0aW9uIGFqYXgob3B0aW9ucykge1xyXG5cdFx0aWYgKG9wdGlvbnMuZGF0YVR5cGUgJiYgb3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCIpIHtcclxuXHRcdFx0dmFyIGNhbGxiYWNrS2V5ID0gXCJtaXRocmlsX2NhbGxiYWNrX1wiICsgbmV3IERhdGUoKS5nZXRUaW1lKCkgKyBcIl9cIiArIChNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxZTE2KSkudG9TdHJpbmcoMzYpO1xyXG5cdFx0XHR2YXIgc2NyaXB0ID0gJGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XHJcblxyXG5cdFx0XHR3aW5kb3dbY2FsbGJhY2tLZXldID0gZnVuY3Rpb24ocmVzcCkge1xyXG5cdFx0XHRcdHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XHJcblx0XHRcdFx0b3B0aW9ucy5vbmxvYWQoe1xyXG5cdFx0XHRcdFx0dHlwZTogXCJsb2FkXCIsXHJcblx0XHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiByZXNwXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0Lm9uZXJyb3IgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0c2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuXHJcblx0XHRcdFx0b3B0aW9ucy5vbmVycm9yKHtcclxuXHRcdFx0XHRcdHR5cGU6IFwiZXJyb3JcIixcclxuXHRcdFx0XHRcdHRhcmdldDoge1xyXG5cdFx0XHRcdFx0XHRzdGF0dXM6IDUwMCxcclxuXHRcdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiBKU09OLnN0cmluZ2lmeSh7ZXJyb3I6IFwiRXJyb3IgbWFraW5nIGpzb25wIHJlcXVlc3RcIn0pXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdFx0d2luZG93W2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZDtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRzY3JpcHQub25sb2FkID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0c2NyaXB0LnNyYyA9IG9wdGlvbnMudXJsXHJcblx0XHRcdFx0KyAob3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPiAwID8gXCImXCIgOiBcIj9cIilcclxuXHRcdFx0XHQrIChvcHRpb25zLmNhbGxiYWNrS2V5ID8gb3B0aW9ucy5jYWxsYmFja0tleSA6IFwiY2FsbGJhY2tcIilcclxuXHRcdFx0XHQrIFwiPVwiICsgY2FsbGJhY2tLZXlcclxuXHRcdFx0XHQrIFwiJlwiICsgYnVpbGRRdWVyeVN0cmluZyhvcHRpb25zLmRhdGEgfHwge30pO1xyXG5cdFx0XHQkZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpXHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dmFyIHhociA9IG5ldyB3aW5kb3cuWE1MSHR0cFJlcXVlc3Q7XHJcblx0XHRcdHhoci5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCwgdHJ1ZSwgb3B0aW9ucy51c2VyLCBvcHRpb25zLnBhc3N3b3JkKTtcclxuXHRcdFx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xyXG5cdFx0XHRcdFx0aWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIG9wdGlvbnMub25sb2FkKHt0eXBlOiBcImxvYWRcIiwgdGFyZ2V0OiB4aHJ9KTtcclxuXHRcdFx0XHRcdGVsc2Ugb3B0aW9ucy5vbmVycm9yKHt0eXBlOiBcImVycm9yXCIsIHRhcmdldDogeGhyfSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH07XHJcblx0XHRcdGlmIChvcHRpb25zLnNlcmlhbGl6ZSA9PT0gSlNPTi5zdHJpbmdpZnkgJiYgb3B0aW9ucy5kYXRhICYmIG9wdGlvbnMubWV0aG9kICE9PSBcIkdFVFwiKSB7XHJcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIiwgXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9wdGlvbnMuZGVzZXJpYWxpemUgPT09IEpTT04ucGFyc2UpIHtcclxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvKlwiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMuY29uZmlnID09PSBGVU5DVElPTikge1xyXG5cdFx0XHRcdHZhciBtYXliZVhociA9IG9wdGlvbnMuY29uZmlnKHhociwgb3B0aW9ucyk7XHJcblx0XHRcdFx0aWYgKG1heWJlWGhyICE9IG51bGwpIHhociA9IG1heWJlWGhyXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBkYXRhID0gb3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgfHwgIW9wdGlvbnMuZGF0YSA/IFwiXCIgOiBvcHRpb25zLmRhdGFcclxuXHRcdFx0aWYgKGRhdGEgJiYgKHR5cGUuY2FsbChkYXRhKSAhPSBTVFJJTkcgJiYgZGF0YS5jb25zdHJ1Y3RvciAhPSB3aW5kb3cuRm9ybURhdGEpKSB7XHJcblx0XHRcdFx0dGhyb3cgXCJSZXF1ZXN0IGRhdGEgc2hvdWxkIGJlIGVpdGhlciBiZSBhIHN0cmluZyBvciBGb3JtRGF0YS4gQ2hlY2sgdGhlIGBzZXJpYWxpemVgIG9wdGlvbiBpbiBgbS5yZXF1ZXN0YFwiO1xyXG5cdFx0XHR9XHJcblx0XHRcdHhoci5zZW5kKGRhdGEpO1xyXG5cdFx0XHRyZXR1cm4geGhyXHJcblx0XHR9XHJcblx0fVxyXG5cdGZ1bmN0aW9uIGJpbmREYXRhKHhock9wdGlvbnMsIGRhdGEsIHNlcmlhbGl6ZSkge1xyXG5cdFx0aWYgKHhock9wdGlvbnMubWV0aG9kID09PSBcIkdFVFwiICYmIHhock9wdGlvbnMuZGF0YVR5cGUgIT0gXCJqc29ucFwiKSB7XHJcblx0XHRcdHZhciBwcmVmaXggPSB4aHJPcHRpb25zLnVybC5pbmRleE9mKFwiP1wiKSA8IDAgPyBcIj9cIiA6IFwiJlwiO1xyXG5cdFx0XHR2YXIgcXVlcnlzdHJpbmcgPSBidWlsZFF1ZXJ5U3RyaW5nKGRhdGEpO1xyXG5cdFx0XHR4aHJPcHRpb25zLnVybCA9IHhock9wdGlvbnMudXJsICsgKHF1ZXJ5c3RyaW5nID8gcHJlZml4ICsgcXVlcnlzdHJpbmcgOiBcIlwiKVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSB4aHJPcHRpb25zLmRhdGEgPSBzZXJpYWxpemUoZGF0YSk7XHJcblx0XHRyZXR1cm4geGhyT3B0aW9uc1xyXG5cdH1cclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemVVcmwodXJsLCBkYXRhKSB7XHJcblx0XHR2YXIgdG9rZW5zID0gdXJsLm1hdGNoKC86W2Etel1cXHcrL2dpKTtcclxuXHRcdGlmICh0b2tlbnMgJiYgZGF0YSkge1xyXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdHZhciBrZXkgPSB0b2tlbnNbaV0uc2xpY2UoMSk7XHJcblx0XHRcdFx0dXJsID0gdXJsLnJlcGxhY2UodG9rZW5zW2ldLCBkYXRhW2tleV0pO1xyXG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2tleV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHVybFxyXG5cdH1cclxuXHJcblx0bS5yZXF1ZXN0ID0gZnVuY3Rpb24oeGhyT3B0aW9ucykge1xyXG5cdFx0aWYgKHhock9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5zdGFydENvbXB1dGF0aW9uKCk7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQoKTtcclxuXHRcdHZhciBpc0pTT05QID0geGhyT3B0aW9ucy5kYXRhVHlwZSAmJiB4aHJPcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIjtcclxuXHRcdHZhciBzZXJpYWxpemUgPSB4aHJPcHRpb25zLnNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuc2VyaWFsaXplIHx8IEpTT04uc3RyaW5naWZ5O1xyXG5cdFx0dmFyIGRlc2VyaWFsaXplID0geGhyT3B0aW9ucy5kZXNlcmlhbGl6ZSA9IGlzSlNPTlAgPyBpZGVudGl0eSA6IHhock9wdGlvbnMuZGVzZXJpYWxpemUgfHwgSlNPTi5wYXJzZTtcclxuXHRcdHZhciBleHRyYWN0ID0gaXNKU09OUCA/IGZ1bmN0aW9uKGpzb25wKSB7cmV0dXJuIGpzb25wLnJlc3BvbnNlVGV4dH0gOiB4aHJPcHRpb25zLmV4dHJhY3QgfHwgZnVuY3Rpb24oeGhyKSB7XHJcblx0XHRcdHJldHVybiB4aHIucmVzcG9uc2VUZXh0Lmxlbmd0aCA9PT0gMCAmJiBkZXNlcmlhbGl6ZSA9PT0gSlNPTi5wYXJzZSA/IG51bGwgOiB4aHIucmVzcG9uc2VUZXh0XHJcblx0XHR9O1xyXG5cdFx0eGhyT3B0aW9ucy5tZXRob2QgPSAoeGhyT3B0aW9ucy5tZXRob2QgfHwgJ0dFVCcpLnRvVXBwZXJDYXNlKCk7XHJcblx0XHR4aHJPcHRpb25zLnVybCA9IHBhcmFtZXRlcml6ZVVybCh4aHJPcHRpb25zLnVybCwgeGhyT3B0aW9ucy5kYXRhKTtcclxuXHRcdHhock9wdGlvbnMgPSBiaW5kRGF0YSh4aHJPcHRpb25zLCB4aHJPcHRpb25zLmRhdGEsIHNlcmlhbGl6ZSk7XHJcblx0XHR4aHJPcHRpb25zLm9ubG9hZCA9IHhock9wdGlvbnMub25lcnJvciA9IGZ1bmN0aW9uKGUpIHtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRlID0gZSB8fCBldmVudDtcclxuXHRcdFx0XHR2YXIgdW53cmFwID0gKGUudHlwZSA9PT0gXCJsb2FkXCIgPyB4aHJPcHRpb25zLnVud3JhcFN1Y2Nlc3MgOiB4aHJPcHRpb25zLnVud3JhcEVycm9yKSB8fCBpZGVudGl0eTtcclxuXHRcdFx0XHR2YXIgcmVzcG9uc2UgPSB1bndyYXAoZGVzZXJpYWxpemUoZXh0cmFjdChlLnRhcmdldCwgeGhyT3B0aW9ucykpLCBlLnRhcmdldCk7XHJcblx0XHRcdFx0aWYgKGUudHlwZSA9PT0gXCJsb2FkXCIpIHtcclxuXHRcdFx0XHRcdGlmICh0eXBlLmNhbGwocmVzcG9uc2UpID09PSBBUlJBWSAmJiB4aHJPcHRpb25zLnR5cGUpIHtcclxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCByZXNwb25zZS5sZW5ndGg7IGkrKykgcmVzcG9uc2VbaV0gPSBuZXcgeGhyT3B0aW9ucy50eXBlKHJlc3BvbnNlW2ldKVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiAoeGhyT3B0aW9ucy50eXBlKSByZXNwb25zZSA9IG5ldyB4aHJPcHRpb25zLnR5cGUocmVzcG9uc2UpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGRlZmVycmVkW2UudHlwZSA9PT0gXCJsb2FkXCIgPyBcInJlc29sdmVcIiA6IFwicmVqZWN0XCJdKHJlc3BvbnNlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpO1xyXG5cdFx0XHRcdGRlZmVycmVkLnJlamVjdChlKVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICh4aHJPcHRpb25zLmJhY2tncm91bmQgIT09IHRydWUpIG0uZW5kQ29tcHV0YXRpb24oKVxyXG5cdFx0fTtcclxuXHRcdGFqYXgoeGhyT3B0aW9ucyk7XHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlLCB4aHJPcHRpb25zLmluaXRpYWxWYWx1ZSk7XHJcblx0XHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZVxyXG5cdH07XHJcblxyXG5cdC8vdGVzdGluZyBBUElcclxuXHRtLmRlcHMgPSBmdW5jdGlvbihtb2NrKSB7XHJcblx0XHRpbml0aWFsaXplKHdpbmRvdyA9IG1vY2sgfHwgd2luZG93KTtcclxuXHRcdHJldHVybiB3aW5kb3c7XHJcblx0fTtcclxuXHQvL2ZvciBpbnRlcm5hbCB0ZXN0aW5nIG9ubHksIGRvIG5vdCB1c2UgYG0uZGVwcy5mYWN0b3J5YFxyXG5cdG0uZGVwcy5mYWN0b3J5ID0gYXBwO1xyXG5cclxuXHRyZXR1cm4gbVxyXG59KSh0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSk7XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZSAhPT0gbnVsbCAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBtO1xyXG5lbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiBtfSk7XHJcbiJdfQ==
