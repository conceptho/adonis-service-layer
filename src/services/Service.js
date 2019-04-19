'use strict'
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled (value) { try { step(generator.next(value)) } catch (e) { reject(e) } }
    function rejected (value) { try { step(generator['throw'](value)) } catch (e) { reject(e) } }
    function step (result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value) }).then(fulfilled, rejected) }
    step((generator = generator.apply(thisArg, _arguments || [])).next())
  })
}
const ServiceResponse = require('../services/ServiceResponse')
const { ServiceException } = require('../exceptions/runtime')
const proxyHandler = require('./proxyHandler')
const { reduce } = require('lodash')
const util = require('util')
module.exports = (Database, BaseRelation, Logger, Env, Model) => {
  class Service {
    constructor () {
      return new Proxy(this, proxyHandler)
    }
    static get ModelName () {
      return 'Model'
    }
    static get hasModel () {
      return true
    }
    static get Model () {
      if (!this.$model) {
        this.$model = use(this.constructor.ModelName)
      }
      return this.$model
    }
    get Model () {
      return this.constructor.Model
    }
    static get iocHooks () {
      return ['_bootIfNotBooted']
    }
    static _bootIfNotBooted () {
      if (!this.$bootedBy) {
        this.$bootedBy = []
      }
      if (this.$bootedBy.indexOf(this.constructor.name) < 0) {
        this.$bootedBy.push(this.constructor.name)
        if (this.hasModel) {
          this.Model.boot()
          const modelInstance = new (this.Model)()
          if (!(modelInstance instanceof Model)) {
            throw new ServiceException(`Expected this service to handle a Model.
            Expected: ${Model.name}
            Given: ${this.Model.name}`)
          }
        }
      }
    }
    actionCreate ({ model, serviceContext = {} }) {
      return __awaiter(this, void 0, void 0, function * () {
        const { error } = yield model.validate()
        if (error) {
          return new ServiceResponse({ error })
        }
        return this.executeCallback(serviceContext, ({ transaction = false }) => __awaiter(this, void 0, void 0, function * () {
          yield model.save(transaction)
          return model
        }))
      })
    }
    actionFindOrCreate ({ whereAttributes, modelData = whereAttributes, serviceContext, byActive = false }) {
      return __awaiter(this, void 0, void 0, function * () {
        const { data: modelFound } = yield this.find({ whereAttributes, byActive })
        if (modelFound) {
          return new ServiceResponse({ data: modelFound })
        }
        const newModel = new this.Model(modelData)
        return this.create({ model: newModel, serviceContext })
      })
    }
    actionUpdate ({ model, serviceContext = {} }) {
      return __awaiter(this, void 0, void 0, function * () {
        const { error } = yield model.validate()
        if (error) {
          return new ServiceResponse({ error })
        }
        return this.executeCallback(serviceContext, ({ transaction }) => __awaiter(this, void 0, void 0, function * () {
          yield model.save(transaction)
          return model
        }))
      })
    }
    actionDelete ({ model, serviceContext = {} }, softDelete) {
      return __awaiter(this, void 0, void 0, function * () {
        const callback = ({ transaction }) => __awaiter(this, void 0, void 0, function * () {
          if (softDelete) {
            yield model.softDelete(transaction)
          } else {
            model.deleteWithinTransaction
              ? yield model.deleteWithinTransaction(transaction)
              : model.delete()
          }
          return model
        })
        return this.executeCallback(serviceContext, callback)
      })
    }
    actionUndelete ({ model, serviceContext = {} }) {
      return __awaiter(this, void 0, void 0, function * () {
        return this.executeCallback(serviceContext, ({ transaction }) => __awaiter(this, void 0, void 0, function * () {
          yield model.undelete(transaction)
          return model
        }))
      })
    }
    actionFind ({ whereAttributes, byActive = false }) {
      return __awaiter(this, void 0, void 0, function * () {
        let query = this.Model.query().where(whereAttributes)
        if (byActive) {
          query = query.active()
        }
        return this.executeCallback(null, () => __awaiter(this, void 0, void 0, function * () { return query.firstOrFail() }))
      })
    }
    query ({ byActive, serviceContext = {} } = {}) {
      const query = this.Model.query()
      if (serviceContext.transaction) {
        query.transacting(serviceContext.transaction)
      }
      return byActive ? query.active() : query
    }
    checkResponses ({ responses = [], data }) {
      const errors = reduce(responses, (res, value) => value.error ? [...res, value.error] : res, [])
      const responsesData = reduce(responses, (res, value) => value.data ? [...res, value.data] : [...res, null], [])
      return new ServiceResponse({
        error: errors.length ? errors : null,
        data: data || (responsesData.length ? responsesData : null)
      })
    }
    applyTransactionToRelation ({ relation, trx }) {
      if (trx && relation instanceof BaseRelation) {
        relation.relatedQuery.transacting(trx)
      }
    }
    executeCallback (serviceContext, callback) {
      return __awaiter(this, void 0, void 0, function * () {
        try {
          return new ServiceResponse({ data: yield callback(serviceContext) })
        } catch (error) {
          return new ServiceResponse({ error })
        }
      })
    }
    onEntryHooks () {
      return ['onEntry']
    }
    onExitHooks () {
      return ['onExit']
    }
    onEntry (argumentsList, target) {
      if (Env.get('SERVICE_DEBUG', false) === 'true') {
        Logger.info(`\n${target.name} onEntry\nargumentsList:\n${util.inspect(argumentsList, { colors: true, compact: false })}`)
        return true
      }
      return false
    }
    onExit (argumentsList, actionResult, target) {
      if (Env.get('SERVICE_DEBUG', false) === 'true') {
        Logger.info(`\n${target.name} onExit status: ${actionResult.error ? 'error' : 'success'}\nargumentsList:\n${util.inspect(argumentsList, { colors: true, compact: false })}\nactionResult:\n${util.inspect(actionResult, { colors: true, compact: false })}`)
        return true
      }
      return false
    }
  }
  return Service
}
// # sourceMappingURL=Service.js.map
