const ServiceResponse = require('../services/ServiceResponse')
const { ServiceException } = require('../exceptions/runtime')

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
    async create ({ model, trx }) {
      const { error: validationError } = await model.validate()

      if (!validationError) {
        try {
          await model.save(trx)
          return new ServiceResponse({ data: model })
        } catch (error) {
          return new ServiceResponse({ error })
        }
      }

      return new ServiceResponse({ error: validationError })
    }

    /**
     * Finds an entity with given where clauses or creates it if it does not exists.
     */
    async findOrCreate ({ whereAttributes, modelData = whereAttributes, trx, byActive = false }) {
      const { data: modelFound } = await this.find({ whereAttributes, byActive })

      if (modelFound) {
        return new ServiceResponse({ data: modelFound })
      }

      const newModel = new this.$model(modelData)
      const { error: createError, data: persisted } = await this.create({ model: newModel, trx })

      if (!createError) {
        return new ServiceResponse({ data: persisted })
      }

      return new ServiceResponse({ createError })
    }

    async update ({ model, trx }) {
      const { error: validationError } = await model.validate()

      if (!validationError) {
        try {
          await model.save(trx)
          return new ServiceResponse({ model })
        } catch (innerError) {
          return new ServiceResponse({ error: innerError })
        }
      }

      return new ServiceResponse({ error: validationError })
    }

    async delete ({ modelInstance, trx, hardDelete = true }) {
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
          trx: trx
        })
      }
      return this.softDelete({ modelInstance, trx: trx })
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

    async find ({ whereAttributes, byActive = false }) {
      try {
        let query = this.$model.query().where(whereAttributes)

        if (byActive) {
          query = query.active()
        }

        const data = await query.firstOrFail()

        return new ServiceResponse({ data })
      } catch (error) {
        return new ServiceResponse({ error })
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
