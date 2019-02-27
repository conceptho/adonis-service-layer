const { ServiceProvider } = require('@adonisjs/fold');

class ServiceLayerProvider extends ServiceProvider {
  register() {
    // Making sure those dependencies are booted
    const iocDependencies = ['Validator', 'Database'];

    iocDependencies.forEach(dep => this.app.use(dep));

    this.app.bind('Conceptho/Models', () => {
      const Model = require('../models/Model');
      Model._bootIfNotBooted();

      return { Model };
    });

    this.app.bind('Conceptho/Exceptions', () => {
      const ErrorCodeException = require('../exceptions/ErrorCodeException');
      const defaultMessages = require('../exceptions/defaultMessages');

      return { ErrorCodeException, defaultMessages };
    });

    this.app.bind('Conceptho/Serializers', () => {
      const DefaultSerializer = require('../serializers/DefaultSerializer');

      return { DefaultSerializer };
    });

    this.app.bind('Conceptho/Controllers', () => {
      const Controller = require('../controllers/Controller');

      return { Controller };
    });

    this.app.bind('Conceptho/Middlewares', () => {
      const UseTransaction = require('../middlewares/UseTransaction');
      const HeaderPagination = require('../middlewares/UseTransaction');

      return { UseTransaction, HeaderPagination };
    });

    this.app.bind('Conceptho/Services', () => {
      const Service = require('../services/Service');
      const ServiceResponse = require('../services/ServiceResponse');

      return { Service, ServiceResponse };
    });
  }
}

module.exports = ServiceLayerProvider;
