const DefaultSerializer = require('../serializers/DefaultSerializer')

const { ValidationException } = require('../exceptions/runtime')
const { pick } = require('lodash')

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
      const filterOptionsKeys = Object.keys(this.filterOptions)
      filters = pick(filters, filterOptionsKeys)
      const filterKeys = Object.keys(filters)
      return filterKeys.reduce((query, filterKey) => {
        const filterValue = filters[filterKey].replace(/(^>=|^<=|^<>|^>|^<)/, '')
        const filterOption = this.filterOptions[filterKey]
        const filterOperation = filters[filterKey].match(/(^>=|^<=|^<>|^>|^<)/)
        const operation = filterOption.type || (filterOperation ? filterOperation[0] : '=')
        const isLikeOperation = operation.toLowerCase().indexOf('like') >= 0
        return query.where(filterKey, operation, isLikeOperation ? `%${filterValue}%` : filterValue)
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
     * Object with options for the filter function in a query builder
     */
    static get filterOptions () {
      return {
        // The type value could be any comparison operator for sql including the LIKE
        id: { type: '=' }
      }
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
  }
