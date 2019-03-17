const { LogicalException } = require('@adonisjs/generic-exceptions')
const defaultMessages = require('./defaultMessages')

/**
 * Handle an error with given code, returning any payload to the response.
 */
class ErrorCodeException extends LogicalException {
  constructor (code, payload, message) {
    // super default args: message, status, code
    super(undefined, undefined, code)

    this.payload = payload
    this.message = message || defaultMessages[code]
  }

  handle ({ code, message, payload }, { response }) {
    return response.status(code).send({ message, payload })
  }
}

module.exports = ErrorCodeException
