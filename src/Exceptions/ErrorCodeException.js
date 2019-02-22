import { LogicalException } from '@adonisjs/generic-exceptions';
import defaultMessages from './defaultMessages';

class ErrorCode extends LogicalException {
  constructor(code, payload, message) {
    // super default args: message, status, code
    super(undefined, undefined, code);

    this.payload = payload;
    this.message = message || defaultMessages[code];
  }

  handle({ code, message, payload }, { response }) {
    return response.status(code).send({ message, payload });
  }
}

export default ErrorCode;
