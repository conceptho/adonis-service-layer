const ServiceResponse = require('../services/ServiceResponse')
const { ServiceException } = require('../exceptions/runtime')

const { reduce, isEqual } = require('lodash')

module.exports = (Database, BaseRelation, Validator, Model) =>
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
     * @param {Transaction} param.trx Knex transaction
     */
    async create ({ model, trx }) {
      const { error } = await model.validate()

      if (error) {
        return new ServiceResponse({ error })
      }

      return this.executeCallback(async () => {
        await model.save(trx)

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
    async findOrCreate ({ whereAttributes, modelData = whereAttributes, trx, byActive = false }) {
      const { data: modelFound } = await this.find({ whereAttributes, byActive })

      if (modelFound) {
        return new ServiceResponse({ data: modelFound })
      }

      const newModel = new this.$model(modelData)
      return this.create({ model: newModel, trx })
    }

    /**
     * Updates an entity
     *
     * @param {Object} param
     * @param {Model} param.model Model instance
     * @param {Transaction} param.trx Knex transaction
     */
    async update ({ model, trx }) {
      const { error } = await model.validate()

      if (error) {
        return new ServiceResponse({ error })
      }

      return this.executeCallback(async () => {
        await model.save(trx)

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
    async delete ({ model, trx }, softDelete) {
      const callback = async () => {
        if (softDelete) {
          await model.softDelete(trx)
        } else {
          await model.delete(trx)
        }

        return model
      }

      return this.executeCallback(callback)
    }

    /**
     *  Undelete a model if it supports softDelete
     *
     * @param {Object} param
     */
    async undelete ({ model, trx = false }) {
      return this.executeCallback(async () => {
        await model.undelete(trx)

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

      return this.executeCallback(async () => query.firstOrFail())
    }

    /**
     * Returns a new QuryBuilder instance
     *
     * @param {*} param
     */
    query ({ byActive, trx } = {}) {
      const query = this.$model.query()

      if (trx) {
        query.transacting(trx)
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

    async finalizeTransaction ({ isOk, trx, callbackAfterCommit = () => { }, restart = false }) {
      if (isOk) {
        await trx.commit()
        await callbackAfterCommit()
      } else {
        await trx.rollback()
      }
      if (restart) {
        trx = await Database.beginTransaction()
      }
      return trx
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
     * @param {*} trx Knex transaction
     * @returns {ServiceResponse}
     */
    async executeCallback (callback, trx) {
      try {
        return new ServiceResponse({ data: await callback(trx) })
      } catch (error) {
        return new ServiceResponse({ error })
      }
    }
  }
