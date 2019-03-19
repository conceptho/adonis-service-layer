const DefaultSerializer = require('../serializers/DefaultSerializer')

module.exports = (AdonisModel, Validator) => class Model extends AdonisModel {
  static boot () {
    super.boot()

    const ModelHook = require('../hooks/Model')(Validator)

    this.addHook('beforeUpdate', ModelHook.sanitize)
    this.addHook('beforeUpdate', ModelHook.updateModifiedDate)
  }

  static bootIfNotBooted () {
    AdonisModel._bootIfNotBooted()

    if (!this.$bootedBy) {
      this.$bootedBy = []
    }

    if (this.$bootedBy.includes(this.name)) {
      this.$bootedBy.push(this.name)

      this.boot()
    }
  }

  static scopeActive (query) {
    return query.andWhere({ deleted: 0 })
  }

  async softDelete (transaction) {
    this.deleted = 1
    const affected = await this.save(transaction)

    if (affected) {
      this.freeze()
    }
  }

  async undelete (transaction) {
    if (this.hasOwnProperty('deleted')) {
      this.unfreeze()
      this.deleted = 0

      const affected = await this.save(transaction)
      return !!affected
    }

    return false
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
}
