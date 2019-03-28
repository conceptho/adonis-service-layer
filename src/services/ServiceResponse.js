class ServiceResponse {
  /**
   * Creates a new ServiceResponse
   */
  constructor ({ error, data, metaData }) {
    this.error = error || null
    this.data = data || null
    this.metaData = metaData || null
  }
}

module.exports = ServiceResponse
