const { ServiceProvider } = require('@adonisjs/fold');

class ServiceLayerProvider extends ServiceProvider {
  register() {
    this.app.bind('Conceptho/Exceptions', () => require('../exceptions'));
    this.app.bind('Conceptho/Serializers', () => require('../serializers'));
    this.app.bind('Conceptho/Controllers', () => require('../controllers'));

    this.app.bind('Conceptho/Models', () => {
      const models = require('../models');

      models.Model._bootIfNotBooted();

      return models;
    });

    this.app.bind('Conceptho/Middlewares', app => {
      // just making sure it is booted
      app.use('Database');

      return require('../middlewares');
    });

    this.app.bind('Conceptho/Services', app => {
      app.use('@adonisjs/lucid/src/Lucid/Relations/BaseRelation');
      app.use('Validator');

      return require('../services');
    });
  }
}

module.exports = ServiceLayerProvider;
