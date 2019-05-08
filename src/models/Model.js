const DefaultSerializer = require('../serializers/DefaultSerializer')

const { ValidationException } = require('../exceptions/runtime')
const { pick } = require('lodash')
const { helper: filterMapping } = require('./filter')
const Relation = require('./Relation')

module.exports = (AdonisModel, Validator) =>
  class Model extends AdonisModel {
    constructor (modelData) {
      super()

      if (modelData) {
        this.fill(modelData)
      }
    }

    static boot () {
      super.boot()

      const ModelHooks = require('../hooks/Model')(Validator)

      this.addHook('beforeSave', ModelHooks.sanitizeHook)
      this.addHook('beforeSave', ModelHooks.updatedAtHook)
    }

    static bootIfNotBooted () {
      if (!this.$bootedBy) {
        this.$bootedBy = []
      }

      if (this.$bootedBy.indexOf(this.name) < 0) {
        this.$bootedBy.push(this.name)

        this.boot()
      }
    }

    /**
     * Filter only records which delted equals zero.
     * @example
     * await User.query().active().fetch()
     * @param {Object} query This models query builder
     */
    static scopeActive (query) {
      return query.andWhere({ deleted: 0 })
    }

    static scopeFilter (query, filters) {
      const normalizedFilters = Object.keys(filters).map(key => {
        const info = filterMapping(key)
        info.value = filters[key]
        return info
      })
      return normalizedFilters.reduce((query, filterInfo) => {
        const { operation, value, name } = filterInfo
        if (this.canBeFiltered.indexOf(name) >= 0) {
          if (operation) {
            if (operation === 'BETWEEN') {
              return query.whereBetween(name, value.split(',', 2))
            } else if (operation === 'NOT BETWEEN') {
              return query.whereNotBetween(name, value.split(',', 2))
            } else if (operation === 'LIKE') {
              return query.where(name, operation, `%${value}%`)
            } else if (operation === 'IN') {
              return query.whereIn(name, value.split(','))
            } else if (operation === 'NOT IN') {
              return query.whereNotIn(name, value.split(','))
            } else {
              return query.where(name, operation, value)
            }
          }
        }
        return query
      }, query)
    }

    /**
     *
     * @param {Object} transaction Knex transaction
     */
    async softDelete (transaction) {
      this.deleted = 1
      const affected = await this.save(transaction)

      if (affected) {
        this.freeze()
      }

      return !!affected
    }

    async undelete (transaction) {
      this.unfreeze()
      this.deleted = 0

      const affected = await this.save(transaction)
      return !!affected
    }

    /**
     * Array of function names for the related models
     * @returns {Array}
     */
    static get relations () {
      return []
    }

    /**
     * Object with Validation rules for this Model
     * @returns {{}}
     */
    static get validationRules () {
      return {}
    }

    /**
     * Object with the validation messages for this Model
     * @returns {{}}
     */
    static get validationMessages () {
      return {}
    }

    /**
     * Object with the sanitization rules for this Model
     * @returns {{}}
     */
    static get sanitizeRules () {
      return {}
    }

    /**
     * Array with the attributes that can be filtered
     */
    static get canBeFiltered () {
      return ['id']
    }

    static get Serializer () {
      return DefaultSerializer
    }

    async validate () {
      const { validationRules, validationMessages } = this.constructor

      const validation = await (this.isNew
        ? Validator.validateAll(this.$attributes, validationRules, validationMessages)
        : Validator.validateAll(this.dirty, pick(validationRules, Object.keys(this.dirty)), validationMessages))

      if (validation.fails()) {
        return { error: new ValidationException(`Validation failed for ${this.constructor.name}.`, validation.messages()) }
      }

      return { error: null }
    }

    async deleteWithinTransaction (trx) {
      /**
       * Executing before hooks
       */
      await this.constructor.$hooks.before.exec('delete', this)

      const query = this.constructor.query()

      if (trx) {
        query.transacting(trx)
      }

      const affected = await query
        .where(this.constructor.primaryKey, this.primaryKeyValue)
        .ignoreScopes()
        .delete()

      /**
       * If model was delete then freeze it modifications
       */
      if (affected > 0) {
        this.freeze()
      }

      /**
       * Executing after hooks
       */
      await this.constructor.$hooks.after.exec('delete', this)
      return !!affected
    }

    /**
     * Returns an instance of @ref('BelongsTo') relation
     *
     * @method pivotRelation
     *
     * @param  {Class|String}      relatedModel
     * @param  {String}            foreignKey
     * @param  {String}            relatedForeignKey
     * @param  {String}            primaryKey
     * @param  {String}            relatedPrimaryKey
     * @param {String}             type
     * @param {String}             pivotTable
     *
     * @return {Relation}
     */
    pivotRelation ({ relatedModel, foreignKey, relatedForeignKey, primaryKey, relatedPrimaryKey, type, pivotTable }) {
      relatedModel = typeof (relatedModel) === 'string' ?
          use(relatedModel) :
          relatedModel

      foreignKey = foreignKey || this.constructor.foreignKey
      relatedForeignKey = relatedForeignKey || relatedModel.foreignKey
      primaryKey = primaryKey || this.constructor.primaryKey
      relatedPrimaryKey = relatedPrimaryKey || relatedModel.primaryKey
      return new Relation(this, relatedModel, primaryKey, foreignKey, relatedPrimaryKey, relatedForeignKey, type, pivotTable)
    }
  }
