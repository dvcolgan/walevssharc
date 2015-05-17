engine = require('app/engine')
view = require('app/view')


m.module(document.body, view)

engine.goToRoom('Candy Room')
engine.doCommand('look')
