const { pick } = require('lodash')

const sanitizeHook = Validator => async (modelInstance) => {
  const toBeSanitized = pick(modelInstance.toJSON(), Object.keys(modelInstance.sanitizeRules))
  const sanitizedData = Validator.sanitize(toBeSanitized, modelInstance.sanitizeRules)

  modelInstance.merge(sanitizedData)
}

const updateModifiedDate = async (modelInstance) => {
  modelInstance._setUpdatedAt(modelInstance.$attributes)
}

module.exports = Validator => ({
  sanitize: sanitizeHook(Validator),
  updateModifiedDate
})
