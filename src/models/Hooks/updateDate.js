module.exports = async (modelInstance) => {
  modelInstance._setUpdatedAt(modelInstance.$attributes)
}
