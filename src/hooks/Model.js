const { pick } = require('lodash')

module.exports = Validator => ({
  async sanitizeHook (modelInstance) {
    const toBeSanitized = pick(modelInstance.$attributes, Object.keys(modelInstance.constructor.sanitizeRules))
    const sanitizedData = Validator.sanitize(toBeSanitized, modelInstance.constructor.sanitizeRules)

    modelInstance.merge(sanitizedData)
  },

  async updatedAtHook (modelInstance) {
    modelInstance._setUpdatedAt(modelInstance.$attributes)
  }
})
