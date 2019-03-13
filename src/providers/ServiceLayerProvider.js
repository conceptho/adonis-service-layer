const { ServiceProvider } = require('@adonisjs/fold');

class ServiceLayerProvider extends ServiceProvider {
  register() {
    /**
     * Adonis Deps
     */
    const QueryBuilder = use('@adonisjs/lucid/src/Lucid/QueryBuilder');
    const BaseRelation = use('@adonisjs/lucid/src/Lucid/Relations/BaseRelation');
    const Validator = use('Validator');
    const Database = use('Database');
    const AdonisModel = use('Model');

    this.app.bind('Conceptho/Exceptions', () => ({
      ErrorCodeException: require('../exceptions/ErrorCodeException'),
      defaultMessages: require('../exceptions/defaultMessages'),
    }));

    this.app.bind('Conceptho/Services', () => ({
      Service: require('../services/Service')(Database, BaseRelation, Validator),
      ServiceResponse: require('../services/ServiceResponse'),
    }));

    this.app.bind('Conceptho/Models', () => {
      const Model = require('../models/Model')(AdonisModel);
      Model._bootIfNotBooted();

      return { Model };
    });

    this.app.bind('Conceptho/Middlewares/UseTransaction', () => require('../middlewares/UseTransaction'));
    this.app.bind('Conceptho/Middlewares/HeaderPagination', () => require('../middlewares/HeaderPagination'));
    this.app.bind('Conceptho/Serializers', () => ({ DefaultSerializer: require('../serializers/DefaultSerializer') }));
    this.app.bind('Conceptho/Controllers', () => ({ Controller: require('../controllers/Controller')(QueryBuilder) }));
  }
}

module.exports = ServiceLayerProvider;
