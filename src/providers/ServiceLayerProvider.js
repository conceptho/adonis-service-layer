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
      ...require('../exceptions/http'),
      ...require('../exceptions/runtime')
    }))
  }

  registerServices () {
    this.app.bind('Conceptho/Services', () => {
      const BaseRelation = use('@adonisjs/lucid/src/Lucid/Relations/BaseRelation')
      const Logger = use('Logger')
      const Env = use('Env')
      const { Model } = use('Conceptho/Models')
      return {
        Service: require('../services/Service')(use('Database'), BaseRelation, Logger, Env, Model),
        ServiceResponse: require('../services/ServiceResponse'),
        ServiceContext: require('../services/ServiceContext')(this.app.use('Database'))
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
    this.app.bind('Conceptho/Middlewares/HeaderPagination', () =>
      require('../middlewares/HeaderPagination')
    )

    this.app.bind('Conceptho/Middlewares/UseServiceContext', () =>
      require('../middlewares/ServiceContext')(this.app.use('Database'))
    )
  }
}

module.exports = ServiceLayerProvider
