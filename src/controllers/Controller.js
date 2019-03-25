const ServiceResponse = require('../services/ServiceResponse')
const HttpCodeException = require('../exceptions/http/HttpCodeException')

module.exports = (ConcepthoModel, QueryBuilder) => {
  /**
   *  Default Controller
   */
  return class Controller {
    /**
     * Expand the relations of a model
     */
    async applyExpand ({ data, expand, blackList = [], whiteList = [] }) {
      let expandArray = expand
      let expandedData = data

      if (typeof expandArray === 'string') {
        expandArray = expandArray.replace(/ /g, '').split(',')
      }

      if (expandArray && expandArray instanceof Array) {
        expandArray = [...new Set(expandArray)].filter(value => !blackList.includes(value) && whiteList.includes(value))

        if (expandedData instanceof ConcepthoModel) {
          return data.loadMany(expandArray)
        }

        if (expandedData instanceof QueryBuilder) {
          for (const i in expandArray) {
            expandedData = expandedData.with(expandArray[i])
          }

          return expandedData.fetch()
        }
      }
    }

    /**
     * Verify a response returned by a Service.
     */
    async verifyServiceResponse ({ response, serviceResponse, callback = async () => { } }) {
      const { error, data } = serviceResponse

      if (serviceResponse instanceof ServiceResponse) {
        if (!error) {
          if (data) {
            await callback(data)

            return data
          }

          return response.noContent()
        }

        throw new HttpCodeException(400, data)
      }

      throw new HttpCodeException(500, data)
    }
  }
}
