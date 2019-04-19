'use strict'
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled (value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
    function rejected (value) { try { step(generator['throw'](value)) } catch (e) { reject(e) } }
    function step (result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value) }).then(fulfilled, rejected) }
    step((generator = generator.apply(thisArg, _arguments || [])).next())
  })
}
const DefaultSerializer = require('../serializers/DefaultSerializer')
const { ValidationException } = require('../exceptions/runtime')
const { pick } = require('lodash')
module.exports = (AdonisModel, Validator) => class Model extends AdonisModel {
  constructor (modelData) {
    super()
    if (modelData) {
      this.fill(modelData)
    }
    return this
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
  static scopeActive (query) {
    return query.andWhere({ deleted: 0 })
  }
  softDelete (transaction) {
    return __awaiter(this, void 0, void 0, function * () {
      this.deleted = 1
      const affected = yield this.save(transaction)
      if (affected) {
        this.freeze()
      }
      return !!affected
    })
  }
  undelete (transaction) {
    return __awaiter(this, void 0, void 0, function * () {
      this.unfreeze()
      this.deleted = 0
      const affected = yield this.save(transaction)
      return !!affected
    })
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
  validate () {
    return __awaiter(this, void 0, void 0, function * () {
      const { validationRules, validationMessages } = this.constructor
      const validation = yield (this.isNew
        ? Validator.validateAll(this.$attributes, validationRules, validationMessages)
        : Validator.validateAll(this.dirty, pick(validationRules, Object.keys(this.dirty)), validationMessages))
      if (validation.fails()) {
        return { error: new ValidationException(`Validation failed for ${this.constructor.name}.`, validation.messages()) }
      }
      return { error: null }
    })
  }
  deleteWithinTransaction (trx) {
    return __awaiter(this, void 0, void 0, function * () {
      yield this.constructor.$hooks.before.exec('delete', this)
      const query = this.constructor.query()
      if (trx) {
        query.transacting(trx)
      }
      const affected = yield query
        .where(this.constructor.primaryKey, this.primaryKeyValue)
        .ignoreScopes()
        .delete()
      if (affected > 0) {
        this.freeze()
      }
      yield this.constructor.$hooks.after.exec('delete', this)
      return !!affected
    })
  }
}
// # sourceMappingURL=Model.js.map
