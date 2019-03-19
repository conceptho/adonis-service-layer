class ServiceResponse {
  /**
   * Creates a new ServiceResponse
   */
  constructor ({ success, data, metaData }) {
    this.success = success
    this.data = data
    this.metaData = metaData
  }
}

module.exports = ServiceResponse
