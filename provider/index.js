const { ServiceProvider } = require('@adonisjs/fold')

class ServiceLayer extends ServiceProvider {
  register () {
    this.app.bind('Conceptho/ServiceLayer', () => {
      const Validator = this.app.use('Validator')
      const Database = this.app.use('Database')
      const ServiceResponse = require('../src/ServiceResponse')
      const service = (require('../src'))(Validator, Database)
      return {
        Service: service,
        ServiceResponse
      }
    })
  }
}

module.exports = ServiceLayer
