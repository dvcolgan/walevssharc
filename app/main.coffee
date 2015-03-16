m = require('mithril')
flux = require('client/flux')


m.route document.body, '/',
    '/': require('app/components/home')
    #'/ingredients': require('app/components/ingredient-list')
    #'/ingredients/create': require('app/components/ingredient-detail')
    #'/ingredients/:id': require('app/components/ingredient-detail')

    #'/recipes': require('app/components/recipe-list')
    #'/recipes/create': require('app/components/recipe-detail')
    #'/recipes/:id': require('app/components/recipe-detail')

    #'/customers': require('app/components/customer-list')
    #'/customers/create': require('app/components/customer-detail')
    #'/customers/:id': require('app/components/customer-detail')
    ##'/users/create': require('app/components/user-create')
    ##'/users/me': require('app/components/user-profile')
    ##'/users/change-password': require('app/components/password-change')
    #'/about': require('app/components/about')
    #'/login': require('app/components/login')
    #'/logout': require('app/components/logout')
    #'/404': require('app/components/404')
