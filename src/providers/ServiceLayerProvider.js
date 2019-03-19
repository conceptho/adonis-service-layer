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

    /**
     * Service
     */
    this.app.bind('Conceptho/Models', () => {
      const model = require('../models/Model')(AdonisModel, Validator)
      model.bootIfNotBooted()

      return { Model: model }
    })

    this.app.bind('Conceptho/Exceptions', () => ({
      HttpCodeException: require('../exceptions/user/HttpCodeException'),
      ServiceException: require('../exceptions/runtime/ServiceException')
    }))

    this.app.bind('Conceptho/Services', () => {
      const Model = require('../models/Model')(AdonisModel, Validator)

      return {
        Service: require('../services/Service')(Database, BaseRelation, Validator, Model),
        ServiceResponse: require('../services/ServiceResponse')
      }
    })

    this.app.bind('Conceptho/Serializers', () => ({
      DefaultSerializer: require('../serializers/DefaultSerializer')
    }))

    this.app.bind('Conceptho/Controllers', () => ({
      Controller: require('../controllers/Controller')(QueryBuilder)
    }))

    this.app.bind('Conceptho/Middlewares/UseTransaction', () =>
      require('../middlewares/UseTransaction')
    )

    this.app.bind('Conceptho/Middlewares/HeaderPagination', () =>
      require('../middlewares/HeaderPagination')
    )
  }
}

module.exports = ServiceLayerProvider
