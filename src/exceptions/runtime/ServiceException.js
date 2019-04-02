class ServiceException extends Error {
  constructor (message) {
    super(message)

    this.name = 'SERVICE_BACKEND_ERR'
  }
}

module.exports = ServiceException
