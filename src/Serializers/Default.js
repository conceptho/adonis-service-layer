const VanillaSerializer = require('@adonisjs/lucid/src/Lucid/Serializers/Vanilla');

class CustomSerializer extends VanillaSerializer {
  /**
   * Returns the json object for a given model instance
   *
   * @method _getRowJSON
   *
   * @param  {Model}    modelInstance
   *
   * @return {Object}
   *
   * @private
   */
  _getRowJSON(modelInstance) {
    const json = super._getRowJSON(modelInstance);

    // Delete meta & pivot fields
    delete json.__meta__;
    delete json.pivot;

    return json;
  }
}

module.exports = CustomSerializer;
