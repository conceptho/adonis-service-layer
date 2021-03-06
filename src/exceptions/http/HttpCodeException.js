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

  async handle (exceptionData = {}, ctx = {}) {
    const { code, message, payload } = exceptionData
    const { response, serviceContext } = ctx
    if (serviceContext) {
      await serviceContext.error()
    }
    return response.status(code).send({ message, payload })
  }
}

module.exports = HttpCodeException
