const DefaultSerializer = require('../serializers/DefaultSerializer')

const { pickBy, pick } = require('lodash')

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

    /**
     * Filter only records which delted equals zero.
     * @example
     * await User.query().active().fetch()
     * @param {Object} query This models query builder
     */
    static scopeActive (query) {
      return query.andWhere({ deleted: 0 })
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
    }

    async undelete (transaction) {
      this.unfreeze()
      this.deleted = 0

      const affected = await this.save(transaction)
      return !!affected
    }

    static get relations () {
      return []
    }

    static get validationRules () {
      return {}
    }

    static get validationMessages () {
      return {}
    }

    static get sanitizeRules () {
      return {}
    }

    static get Serializer () {
      return DefaultSerializer
    }

    async validate () {
      const { validationRules, validationMessages } = this.constructor
      let validation

      if (this.isNew) {
        validation = await Validator.validateAll(this.$attributes, validationRules, validationMessages)
      } else {
        const { $originalAttributes: originalModelData, $attributes: data } = this

        const dirtyData = pickBy(data, (value, key) => (originalModelData[key]) && (value !== originalModelData[key]))
        validation = await Validator.validateAll(dirtyData, pick(validationRules, Object.keys(dirtyData)), validationMessages)
      }

      if (validation.fails()) {
        return { error: true, messages: validation.messages() }
      }

      return { error: false }
    }
  }
