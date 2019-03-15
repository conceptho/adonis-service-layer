const { LogicalException } = require('@adonisjs/generic-exceptions');

class ServiceErrorException extends LogicalException {
  constructor(message, payload) {
    // super default args: message, status, code
    super();

    this.message = message
    this.payload = payload
  }

  handle({ message, payload }, { response }) {
    return response.status(500).send({ message, payload });
  }
}

module.exports = ServiceErrorException;
