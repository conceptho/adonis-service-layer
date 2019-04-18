const ServiceResponse = require('../services/ServiceResponse')
const { ServiceException } = require('../exceptions/runtime')

const { reduce, isEqual } = require('lodash')

module.exports = (Database, BaseRelation, Model) =>
  class Service {
    constructor (modelClass) {
      if (!(isEqual(modelClass.constructor, Model.constructor))) {
        throw new ServiceException(
          `Expected this service to handle a Model.
            Expected: ${Model.name}
            Given: ${modelClass.constructor.name}`
        )
      }

      this.$model = modelClass
    }

    /**
     * Creates and persists a new entity handled by this service in the database.
     *
     * @param {Object} param
     * @param {Model} param.model Model instance
     * @param {ServiceContext} param.trx Knex transaction
     */
    async create ({ model, serviceContext = {} }) {
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
    async findOrCreate ({ whereAttributes, modelData = whereAttributes, serviceContext, byActive = false }) {
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
    async update ({ model, serviceContext = {} }) {
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
    async delete ({ model, serviceContext = {} }, softDelete) {
      const callback = async ({ transaction }) => {
        if (softDelete) {
          await model.softDelete(transaction)
        } else {
          await model.delete(transaction)
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
    async undelete ({ model, serviceContext = {} }) {
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
    async find ({ whereAttributes, byActive = false }) {
      let query = this.$model.query().where(whereAttributes)

      if (byActive) {
        query = query.active()
      }

      return this.executeCallback(null, async () => query.firstOrFail())
    }

    /**
     * Returns a new QuryBuilder instance
     *
     * @param {*} param
     */
    query ({ byActive, serviceContext = {} } = {}) {
      const query = this.$model.query()

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
  }
