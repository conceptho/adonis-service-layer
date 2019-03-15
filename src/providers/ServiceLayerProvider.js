const { ServiceProvider } = require('@adonisjs/fold');

class ServiceLayerProvider extends ServiceProvider {
  register() {
    this.app.bind('Conceptho/Middlewares/UseTransaction', () => require('../middlewares/UseTransaction'));
    this.app.bind('Conceptho/Middlewares/HeaderPagination', () => require('../middlewares/HeaderPagination'));

    this.app.bind('Conceptho/Models', () => {
      const Model = require('../models/Model');
      Model.bootIfNotBooted();

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

    this.app.bind('Conceptho/Services', () => {
      const Service = require('../services/Service');
      const ServiceResponse = require('../services/ServiceResponse');

      return { Service, ServiceResponse };
    });
  }
}

module.exports = ServiceLayerProvider;
