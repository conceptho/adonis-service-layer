const { ServiceProvider } = require('@adonisjs/fold')

class ServiceLayerProvider extends ServiceProvider {
  register () {
    /**
     * Adonis Deps
     */
    const QueryBuilder = use('@adonisjs/lucid/src/Lucid/QueryBuilder')
    const BaseRelation = use('@adonisjs/lucid/src/Lucid/Relations/BaseRelation')

    const Validator = use('Validator')
    const Database = use('Database')
    const AdonisModel = use('Model')

    this.registerModels(AdonisModel, Validator)
    this.registerExceptions()
    this.registerServices(Database, BaseRelation, Validator)
    this.registerSerializers()

    const { Model } = this.app.use('Conceptho/Models')

    this.registerControllers(Model, QueryBuilder)
    this.registerMiddlewares()
  }

  registerModels (AdonisModel, Validator) {
    this.app.bind('Conceptho/Models', () => {
      const Model = require('../models/Model')(AdonisModel, Validator)
      Model.bootIfNotBooted()

      return { Model }
    })
  }

  registerExceptions () {
    this.app.bind('Conceptho/Exceptions', () => ({
      HttpCodeException: require('../exceptions/http/HttpCodeException'),
      ServiceException: require('../exceptions/runtime/ServiceException')
    }))
  }

  registerServices (Database, BaseRelation, Validator) {
    this.app.bind('Conceptho/Services', () => {
      const { Model } = this.app.use('Conceptho/Models')

      return {
        Service: require('../services/Service')(Database, BaseRelation, Validator, Model),
        ServiceResponse: require('../services/ServiceResponse')
      }
    })
  }

  registerSerializers () {
    this.app.bind('Conceptho/Serializers', () => ({
      DefaultSerializer: require('../serializers/DefaultSerializer')
    }))
  }

  registerControllers (ConcepthoModel, QueryBuilder) {
    this.app.bind('Conceptho/Controllers', () => ({
      Controller: require('../controllers/Controller')(ConcepthoModel, QueryBuilder)
    }))
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
