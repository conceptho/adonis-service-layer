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

        if (expandedData instanceof QueryBuilder) {
          // TODO Verirficar este caso
          for (const i in expandArray) {
            expandedData = expandedData.with(expandArray[i])
          }

          return expandedData.fetch()
        }

        return data.loadMany(expandArray)
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

    async verifyViewServiceResponse ({
      response,
      serviceResponse,
      redirectParamWhenIsOk = 'back',
      redirectParamWhenItsNot = 'back',
      callbackWhenIsNotOk = async () => {},
      callbackWhenIsOk = async () => {} }) {
      try {
        await this.verifyServiceResponse({ response, serviceResponse, callbackWhenIsOk })
        return response.redirect(redirectParamWhenIsOk)
      } catch (e) {
        await callbackWhenIsNotOk(serviceResponse.data)
        return response.status(e.code).redirect(redirectParamWhenItsNot)
      }
    }
  }
}
