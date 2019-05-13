const { LogicalException } = require('@adonisjs/generic-exceptions')
const defaultMessages = require('./httpCodeMessages')

/**
 * Handle an error with given code, returning any payload to the response.
 */
class HttpCodeException extends LogicalException {
  /**
   * Create a new ErrorCodeException.
   * @param {number} code
   * @param {*} payload
   * @param {*} message
   */
  constructor (code, payload, message) {
    // super default args: message, status, code
    super(undefined, code, code)

    this.payload = payload
    this.message = message || defaultMessages[code]
  }

  async handle ({ code, message, payload }, { response, serviceCtx }) {
    if (serviceCtx) {
      await serviceCtx.error()
    }
    return response.status(code).send({ message, payload })
  }
}

module.exports = HttpCodeException
