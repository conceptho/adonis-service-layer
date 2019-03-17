class ServiceResponse {
  constructor (isOk, data, metaData = {}) {
    this.isOk = isOk
    this.data = data
    this.metaData = metaData
  }
}

module.exports = ServiceResponse
