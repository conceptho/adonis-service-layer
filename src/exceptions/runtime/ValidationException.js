const ServiceException = require('./ServiceException')

class ValidationException extends ServiceException {
  constructor (message) {
    super(message)

    this.name = 'VALIDATION_EXCEPTION'
  }
}

module.exports = ValidationException
