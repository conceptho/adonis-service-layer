const { pick } = require('lodash');

const sanitizeHook = Validator => (modelInstance) => {
  const toBeSanitized = pick(modelInstance.toJSON(), Object.keys(modelInstance.sanitizeRules));
  const sanitizedData = Validator.sanitize(toBeSanitized, modelInstance.sanitizeRules);

  modelInstance.merge(sanitizedData);
};

const ModelHook = Validator => ({
  sanitize: sanitizeHook(Validator),
});

module.exports = ModelHook;
