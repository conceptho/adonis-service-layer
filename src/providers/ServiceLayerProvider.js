const { ServiceProvider } = require('@adonisjs/fold')

class ServiceLayerProvider extends ServiceProvider {
  register () {
    this.registerModels()
    this.registerExceptions()
    this.registerServices()
    this.registerSerializers()
    this.registerControllers()
    this.registerMiddlewares()
  }

  registerModels () {
    this.app.bind('Conceptho/Models', () => {
      const Model = require('../models/Model')(use('Model'), use('Validator'))
      Model.bootIfNotBooted()

      return { Model }
    })
  }

  registerExceptions () {
    this.app.bind('Conceptho/Exceptions', () => ({
      HttpCodeException: require('../exceptions/http/HttpCodeException'),
      ServiceException: require('../exceptions/runtime/ServiceException'),
      ValidationException: require('../exceptions/runtime/ValidationException')
    }))
  }

  registerServices () {
    this.app.bind('Conceptho/Services', () => {
      const BaseRelation = use('@adonisjs/lucid/src/Lucid/Relations/BaseRelation')
      const { Model } = use('Conceptho/Models')

      return {
        Service: require('../services/Service')(use('Database'), BaseRelation, Model),
        ServiceResponse: require('../services/ServiceResponse')
      }
    })
  }

  registerSerializers () {
    this.app.bind('Conceptho/Serializers', () => ({
      DefaultSerializer: require('../serializers/DefaultSerializer')
    }))
  }

  registerControllers () {
    this.app.bind('Conceptho/Controllers', () => {
      const QueryBuilder = require('@adonisjs/lucid/src/Lucid/QueryBuilder')

      return {
        Controller: require('../controllers/Controller')(QueryBuilder)
      }
    })
  }

  registerMiddlewares () {
    this.app.bind('Conceptho/Middlewares/UseTransaction', () =>
      require('../middlewares/UseTransaction')
    )

    this.app.bind('Conceptho/Middlewares/HeaderPagination', () =>
      require('../middlewares/HeaderPagination')
    )
  }
}

module.exports = ServiceLayerProvider
