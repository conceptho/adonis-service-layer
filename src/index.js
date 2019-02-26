const BaseRelation = require('@adonisjs/lucid/src/Lucid/Relations/BaseRelation')
const ServiceResponse = require('./ServiceResponse')

module.exports = (Validator, Database) => {
  class Service {
    static get Model () {
      const model = use(this.modelName)
      model._bootIfNotBooted ()
      return model
    }

    static get modelName () {
      return 'Model'
    }

    static get Database () {
      return Database
    }

    static get Validator () {
      return Validator
    }

    static async create ({ modelData, trx }) {
      return this._validate({
        data: modelData,
        transaction: async (trx) => {
          return this.Model.create(modelData, trx)
        },
        trx
      })
    }

    static async findOrCreate ({ whereAttributes, data, trx, byActive }) {
      const find = await this.query({ byActive, trx }).where(whereAttributes).first()
      if (find) {
        return new ServiceResponse(true, find)
      } else {
        return this.create({ modelData: data, trx })
      }
    }

    static async update ({ model, trx }) {
      return this._validate({
        data: model,
        transaction: async (trx) => {
          await model.save(trx)
          return model
        },
        trx
      })
    }

    static async delete ({ model, trx, hardDelete = true }) {
      if (hardDelete) {
        return this._executeTransaction({
          transaction: async trx => {
            return model.delete(trx)
          },
          trx
        })
      } else {
        return this._safeDelete({ model, trx })
      }
    }

    static async undelete ({ model, trx = false }) {
      return this._executeTransaction({
        transaction: async trx => {
          return model.undelete(trx)
        },
        trx
      })
    }

    static async _safeDelete ({ model, trx }) {
      if (model.deleted === 1) {
        return new ServiceResponse(false, [{
          error: 'Entity not found',
          message: 'Entity already is deleted'
        }])
      }

      return this._executeTransaction({
        transaction: async trx => {
          return model.safeDelete(trx)
        },
        trx
      })
    }

    static async _executeTransaction ({ transaction, trx }) {
      try {
        let data = await transaction(trx)
        return new ServiceResponse(true, data)
      } catch (e) {
        const data = [{
          message: e.message,
          error: e
        }]
        return new ServiceResponse(false, data)
      }
    }

    static async validateData ({ modelData = {} }) {
      if (modelData instanceof Model) {
        if (modelData.constructor['validationRules']) {
          return this.validateAll(
            modelData.toJSON(),
            modelData.constructor.validationRules()
          )
        } else {
          return true
        }
      } else if (this.Model['validationRules']) {
        return this.validateAll(
          modelData,
          this.Model.validationRules()
        )
      } else {
        return true
      }
    }

    static async _validate ({ data, transaction, trx = false }) {
      const validation = await this.validateData({ modelData: data })
      if ((validation instanceof Object) && validation.fails()) {
        return new ServiceResponse(false, validation.messages())
      } else {
        return this._executeTransaction({ transaction, trx })
      }
    }

    static async find ({ primaryKey, userContext = {}, byActive }) {
      try {
        const query = (!byActive ? this.Model.query().where('id', primaryKey) : this.Model.query().where('id', primaryKey).active())
        return query.first()
      } catch (notFound) {
        return false
      }
    }

    static query ({ userContext = {}, byActive, trx } = {}) {
      const query = this.Model.query()
      if (trx) {
        query.transacting(trx)
      }
      return (!byActive ? query : query.active())
    }

    static checkResponses ({ responses = {}, data }) {
      let isOk = true
      let responsesData = {}
      let errors = {}
      for (let key in responses) {
        isOk = isOk && responses[key].isOk
        if (!responses[key].isOk) {
          errors[key] = responses[key].data
        }
        responsesData[key] = responses[key].data
      }
      return new ServiceResponse(isOk, isOk ? data || responsesData : errors, responsesData)
    }

    static async finalizeTransaction ({ isOk, trx, callbackAfterCommit = () => {}, restart = false }) {
      if (isOk) {
        await trx.commit()
        await callbackAfterCommit()
      } else {
        await trx.rollback()
      }
      if (restart) {
        trx = await this.Database.beginTransaction()
      }
      return trx
    }

    static applyTransactionToRelation ({ relation, trx }) {
      if (trx && relation instanceof BaseRelation) {
        relation.relatedQuery.transacting(trx)
      }
    }
  }

  return Service
}
