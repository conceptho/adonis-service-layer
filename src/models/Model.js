const DefaultSerializer = require('../serializers/DefaultSerializer')
const { pick } = require('lodash')
const { helper: helperFilterMapping } = require('./filter')

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
        const info = this.filterMapping(key)
        info.value = filters[key]
        return info
      })
      return normalizedFilters.reduce((query, filterInfo) => {
        const { operation, value, name } = filterInfo
        if (this.canBeFiltered.indexOf(name) >= 0) {
          return this.addQueryOperation(query, operation, name, value)
        }
        return query
      }, query)
    }

    static scopeSortBy (query, orderByData) {
      const orderBy = orderByData
        ? {
          key: orderByData.split(':')[0],
          value: orderByData.split(':').length > 1 ? orderByData.split(':')[1] : 'asc'
        }
        : {
          key: 'created_at',
          value: 'desc'
        }

      return query.orderBy(orderBy.key, orderBy.value)
    }

    static addQueryOperation (query, operation, name, value) {
      if (operation === 'BETWEEN' && value) {
        return query.whereBetween(name, value.split(',', 2))
      } else if (operation === 'NOT BETWEEN') {
        return query.whereNotBetween(name, value.split(',', 2))
      } else if (operation === 'LIKE') {
        return query.where(name, operation, `%${value}%`)
      } else if (operation === 'IN') {
        return query.whereIn(name, value.split(','))
      } else if (operation === 'NOT IN') {
        return query.whereNotIn(name, value.split(','))
      } else if (operation === 'IS NULL' && (value === 'false' || value === 'true')) {
        return value === 'true' ? query.whereNull(name) : query.whereNotNull(name)
      } else {
        return query.where(name, operation, value)
      }
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

    static filterMapping (nameOperation) {
      return helperFilterMapping(nameOperation)
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
        return { error: validation.messages() }
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
