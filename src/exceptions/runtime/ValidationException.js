const ServiceException = require('./ServiceException')

class ValidationException extends ServiceException {
  constructor (message, errorMessages) {
    super(message)

    this.name = 'VALIDATION_EXCEPTION'
    this.errorMessages = errorMessages
  }
}

module.exports = ValidationException
