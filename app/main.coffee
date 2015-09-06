m = require('mithril')
engine = new(require('./engine'))()
view = require('app/view')(engine)


m.mount(document.body, view)
