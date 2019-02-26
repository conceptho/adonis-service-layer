class ServiceResponse {
  constructor (isOk, data, extraData = {}) {
    this.isOk = isOk
    this.data = data
    this.extraData = extraData
  }
}

module.exports = ServiceResponse
