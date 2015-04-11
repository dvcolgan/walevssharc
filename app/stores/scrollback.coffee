flux = require('app/flux')


module.exports = flux.createStore
    init: ->
        @previousMessages = []
        @currentMessage = ''
        @typer = null
        notify = @notify
        @makeTyper = (text, speed=8) ->
            i = 0
            typeLoop = ->
                i++
                notify()
                if i < text.length - 1
                    setTimeout(typeLoop, speed)
            setTimeout(typeLoop, speed)

            return ->
                return text[..i]
    
    onPrint: (message) ->
        if @currentMessage != ''
            @previousMessages.push(@currentMessage)
        @currentMessage = message
        @typer = new @makeTyper(message)
        @notify()

    getPreviousMessages: -> @previousMessages

    getTypingMessage: -> if @typer? then @typer() else ''

    getCurrentMessage: -> @currentMessage
