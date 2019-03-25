const ServiceResponse = require('../services/ServiceResponse')
const { ServiceException, ValidationException } = require('../exceptions/runtime')

module.exports = (Database, BaseRelation, Validator, Model) =>
  class Service {
    constructor (modelClass) {
      if (!(modelClass.prototype instanceof Model)) {
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
     */
    async create ({ modelData, trx }) {
      const { error, data, metaData } = await this.validateModelData({ modelData })

      if (!error) {
        let createdModel = null

        try {
          createdModel = await this.$model.create(data, trx)
        } catch (newError) {
          return new ServiceResponse({ error: newError, data: createdModel })
        }

        return new ServiceResponse({ data: createdModel })
      }

      return new ServiceResponse({ error, metaData })
    }

    /**
     * Finds an entity with given where clauses or creates it if it does not exists.
     */
    async findOrCreate ({ whereAttributes, modelData, transaction, byActive }) {
      const modelInstance = await this.query({ byActive, transaction })
        .where(whereAttributes)
        .first()

      if (modelInstance) {
        return new ServiceResponse({ error: false, data: modelInstance })
      }

      const { error, data, metaData } = await this.create({ modelData, transaction })

      if (!error) {
        return new ServiceResponse({ error, data })
      }

      return new ServiceResponse({ error, metaData })
    }

    async update ({ modelInstance, transaction }) {
      if (!(modelInstance instanceof this.$model)) {
        throw ServiceException(`
          Tried to update an object which is not handled by this Service.
            Expected: ${this.$model.constructor.name}
            Given: ${modelInstance.constructor.name}`
        )
      }

      const { success, data, metaData } = await this.validateModelData({ modelData: modelInstance })

      if (success) {
        await data.save(transaction)
        return new ServiceResponse({ success, data })
      }
      return new ServiceResponse({ success, metaData })
    }

    async delete ({ modelInstance, transaction, hardDelete = true }) {
      if (!(modelInstance instanceof this.$model)) {
        throw ServiceException(`
          Tried to delete an object which is not handled by this Service.
            Expected: ${this.$model.constructor.name}
            Given: ${modelInstance.constructor.name}`
        )
      }

      if (hardDelete) {
        return this.executeTransaction({
          transaction: async trx => modelInstance.delete(trx),
          trx: transaction
        })
      }
      return this.softDelete({ modelInstance, trx: transaction })
    }

    async undelete ({ model, trx = false }) {
      return this.executeTransaction({
        transaction: async trx => model.undelete(trx),
        trx
      })
    }

    async softDelete ({ model, trx }) {
      if (model.deleted === 1) {
        return new ServiceResponse(false, [
          {
            error: 'Entidade não encontrada',
            message: 'A entidade já foi deletada'
          }
        ])
      }

      return this.executeTransaction({
        transaction: async trx => model.safeDelete(trx),
        trx
      })
    }

    async executeTransaction ({ transaction, trx }) {
      try {
        const data = await transaction(trx)
        return new ServiceResponse(true, data)
      } catch (e) {
        const data = [
          {
            message: e.message,
            error: e
          }
        ]
        return new ServiceResponse(false, data)
      }
    }

    /**
     * Validate model data.
     * @returns {ServiceResponse} Response.
     */
    async validateModelData ({ modelData }) {
      const validationMessages = modelData.validationMessages || this.$model.validationMessages
      const validationRules = modelData.validationRules || this.$model.validationRules
      const validation = await Validator.validateAll(modelData, validationRules, validationMessages)

      // dirtyData

      if (validation.fails()) {
        const error = new ValidationException(`Validation failed for ${modelData}`)

        return new ServiceResponse({ error, metaData: validation.messages() })
      }

      return new ServiceResponse({ data: modelData })
    }

    async find ({ primaryKey, byActive }) {
      try {
        const query = !byActive
          ? this.$model.query().where('id', primaryKey)
          : this.$model.query()
            .where('id', primaryKey)
            .active()

        return query.first()
      } catch (notFound) {
        return false
      }
    }

    query ({ byActive, transaction } = {}) {
      const query = this.$model.query()
      if (transaction) {
        query.transacting(transaction)
      }
      return !byActive ? query : query.active()
    }

    checkResponses ({ responses = {}, data }) {
      let isOk = true
      const responsesData = {}
      const errors = {}

      for (const key in responses) {
        isOk = isOk && responses[key].isOk
        if (!responses[key].isOk) {
          errors[key] = responses[key].data
        }
        responsesData[key] = responses[key].data
      }
      return new ServiceResponse(isOk, isOk ? data || responsesData : errors, responsesData)
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
  }
