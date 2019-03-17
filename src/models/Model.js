const DefaultSerializer = require('../serializers/DefaultSerializer')
const ModelHook = require('../hooks/Model')

module.exports = (AdonisModel, Validator) => class Model extends AdonisModel {
  static boot () {
    super.boot()

    this.addHook('beforeUpdate', ModelHook(Validator).sanitize)
    this.addHook('beforeUpdate', ModelHook(Validator).updateModifiedDate)
  }

  static _bootIfNotBooted () {
    if (!this.$bootedBy) {
      this.$bootedBy = []
    }

    if (this.$bootedBy.indexOf(this.name) < 0) {
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

    if (affected > 0) {
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

  static validationRules () {
    return {}
  }

  static get sanitizeRules () {
    return {}
  }

  static get Serializer () {
    return DefaultSerializer
  }
}
