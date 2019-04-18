const ServiceResponse = require('../services/ServiceResponse')
// const { ServiceException } = require('../exceptions/runtime')
const proxyHandler = require('./proxyHandler')

const { reduce } = require('lodash')
const util = require('util')

module.exports = (Database, BaseRelation, Logger, Env) => {
  class Service {
    constructor () {
      return new Proxy(this, proxyHandler)
    }

    get ModelName () {
      return 'Model'
    }

    get Model () {
      if (!this.$model) {
        this.$model = use(this.ModelName)
      }
      return this.$model
    }

    /**
     * An array of methods to be called everytime
     * a model is imported via ioc container.
     *
     * @attribute iocHooks
     *
     * @return {Array}
     *
     * @static
     */
    get iocHooks () {
      return ['_bootIfNotBooted']
    }

    _bootIfNotBooted () {
      if (!this.$bootedBy) {
        this.$bootedBy = []
      }

      if (this.$bootedBy.indexOf(this.constructor.name) < 0) {
        this.$bootedBy.push(this.constructor.name)
        this.Model.boot()
      }
    }

    /**
     * Creates and persists a new entity handled by this service in the database.
     *
     * @param {Object} param
     * @param {Model} param.model Model instance
     * @param {ServiceContext} param.trx Knex transaction
     */
    async actionCreate ({ model, serviceContext = {} }) {
      const { error } = await model.validate()

      if (error) {
        return new ServiceResponse({ error })
      }

      return this.executeCallback(serviceContext, async ({ transaction }) => {
        await model.save(transaction)

        return model
      })
    }

    /**
     * Finds an entity with given where clauses or creates it if it does not exists.
     *
     * @param {Object} param
     * @param {Object} whereAttributes Values to look for
     * @param {Object} modelData If entity is not found, create a new matching this modelData. Defaults to whereAttributes
     * @param {Transaction} param.trx Knex transaction
     * @param {Object} params.byActive If true, filter only active records
     */
    async actionFindOrCreate ({ whereAttributes, modelData = whereAttributes, serviceContext, byActive = false }) {
      const { data: modelFound } = await this.find({ whereAttributes, byActive })

      if (modelFound) {
        return new ServiceResponse({ data: modelFound })
      }

      const newModel = new this.$model(modelData)
      return this.create({ model: newModel, serviceContext })
    }

    /**
     * Updates an entity
     *
     * @param {Object} param
     * @param {Model} param.model Model instance
     * @param {Transaction} param.trx Knex transaction
     */
    async actionUpdate ({ model, serviceContext = {} }) {
      const { error } = await model.validate()

      if (error) {
        return new ServiceResponse({ error })
      }

      return this.executeCallback(serviceContext, async ({ transaction }) => {
        await model.save(transaction)

        return model
      })
    }

    /**
     * Deletes an entity
     *
     * @param {Object} param
     * @param {Model} param.model Model instance
     * @param {Boolean} softDelete If true, performs a soft delete. Defaults to false
     * @throws {ServiceException} If model doesnt support softDelete and it is required
     */
    async actionDelete ({ model, serviceContext = {} }, softDelete) {
      const callback = async ({ transaction }) => {
        if (softDelete) {
          await model.softDelete(transaction)
        } else {
          model.deleteWithinTransaction
            ? await model.deleteWithinTransaction(transaction)
            : model.delete()
        }

        return model
      }

      return this.executeCallback(serviceContext, callback)
    }

    /**
     *  Undelete a model if it supports softDelete
     *
     * @param {Object} param
     */
    async actionUndelete ({ model, serviceContext = {} }) {
      return this.executeCallback(serviceContext, async ({ transaction }) => {
        await model.undelete(transaction)

        return model
      })
    }

    /**
     * Finds an entity if it exists and returns it.
     *
     * @param {Object} params
     * @param {Object} params.whereAttributes Values to look for
     * @param {Object} params.byActive If true, filter only active records
     * @returns {ServiceResponse} Response
     */
    async actionFind ({ whereAttributes, byActive = false }) {
      let query = this.Model.query().where(whereAttributes)

      if (byActive) {
        query = query.active()
      }

      return this.executeCallback(null, async () => query.firstOrFail())
    }

    /**
     * Returns a new QueryBuilder instance
     *
     * @param {*} param
     */
    query ({ byActive, serviceContext = {} } = {}) {
      const query = this.Model.query()

      if (serviceContext.transaction) {
        query.transacting(serviceContext.transaction)
      }

      return byActive ? query.active() : query
    }

    /**
     * Reduces all given `ServiceResponse`s in a single `ServiceResponse`,
     * where error is an array of `Error`s or `null` if none was found.
     * If `data` is present, return it as the `ServiceResponse` data,
     * otherwise `data` is an array of objects.
     *
     * @returns {ServiceResponse} result
     */
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

    /**
     * Wraps a callback with a try/catch block and returns a ServiceResponse.
     *
     * @param {Function} callback
     * @param {*} serviceContext Knex transaction
     * @returns {ServiceResponse}
     */
    async executeCallback (serviceContext, callback) {
      try {
        return new ServiceResponse({ data: await callback(serviceContext) })
      } catch (error) {
        return new ServiceResponse({ error })
      }
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
      }
    }

    onExit (argumentsList, actionResult, target) {
      if (Env.get('SERVICE_DEBUG', false) === 'true') {
        Logger.info(`\n${target.name} onExit status: ${actionResult.error ? 'error' : 'success'}\nargumentsList:\n${util.inspect(argumentsList, { colors: true, compact: false })}\nactionResult:\n${util.inspect(actionResult, { colors: true, compact: false })}`)
      }
    }
  }

  return Service
}
