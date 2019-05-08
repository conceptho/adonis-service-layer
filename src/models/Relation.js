const BelongsToMany = require('@adonisjs/lucid/src/Lucid/Relations/BelongsToMany')

/**
 * This is a Relation Class with the objective to define the
 * possibility to use always a pivot Table in relationshipis
 */

class Relation extends BelongsToMany {
  constructor (parentInstance, relatedModel, primaryKey, foreignKey, relatedPrimaryKey, relatedForeignKey, type = 'hasMany', pivotTable = '') {
    super(parentInstance, relatedModel, primaryKey, foreignKey, relatedPrimaryKey, relatedForeignKey)
    this.relationType = type
    if (pivotTable) {
      this.pivotTable(pivotTable)
    }
  }

  /**
   * Fetch related rows for a relationship
   *
   * @method fetch
   *
   * @alias first
   *
   * @return {Model}
   */
  async fetch () {
    if (this.relationType === 'hasOne' || this.relationType === 'belongsTo') {
      return super.first()
    } else {
      return super.fetch()
    }
  }
}

module.exports = Relation
