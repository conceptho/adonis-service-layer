// Adonis dependant
const Database = use('Database');
const BaseRelation = use('@adonisjs/lucid/src/Lucid/Relations/BaseRelation');
const { validateAll } = use('Validator');

const Model = require('../models/Model');
const ServiceResponse = require('../services/ServiceResponse');
const ServiceErrorException = require('../exceptions/ServiceErrorException')

/**
 * Base Service
 * A Service must refer to a Model which inherits from Conceptho/Models/Model
 */
class Service {
  constructor(model) {
    if (!(model instanceof Model)) {
      throw 'Tried to create a Service that does not handle a Conceptho/Models/Model'
    }

    this.$model = model;
  }

  async create(model, transaction) {
    return this.validate({
      data: model,
      transaction: async trx => this.$model.create(model, trx),
      trx: transaction,
    });
  }

  async findOrCreate({ whereAttributes, data, trx, byActive }) {
    const find = await this.query({ byActive, trx })
      .where(whereAttributes)
      .first();

    if (find) {
      return new ServiceResponse(true, find);
    }

    return this.create({ modelData: data, trx });
  }

  async update({ model, trx }) {
    return this.validate({
      data: model,
      transaction: async (trx) => {
        await model.save(trx);
        return model;
      },
      trx,
    });
  }

  async delete({ model, trx, hardDelete = true }) {
    if (hardDelete) {
      return this.executeTransaction({
        transaction: async trx => model.delete(trx),
        trx,
      });
    }
    return this.softDelete({ model, trx });
  }

  async undelete({ model, trx = false }) {
    return this.executeTransaction({
      transaction: async trx => model.undelete(trx),
      trx,
    });
  }

  async softDelete({ model, trx }) {
    if (model.deleted === 1) {
      return new ServiceResponse(false, [
        {
          error: 'Entidade não encontrada',
          message: 'A entidade já foi deletada',
        },
      ]);
    }

    return this.executeTransaction({
      transaction: async trx => model.safeDelete(trx),
      trx,
    });
  }

  async executeTransaction({ transaction, trx }) {
    try {
      const data = await transaction(trx);
      return new ServiceResponse(true, data);
    } catch (e) {
      const data = [
        {
          message: e.message,
          error: e,
        },
      ];
      return new ServiceResponse(false, data);
    }
  }

  async validateModel(modelData) {
    const data = modelData || {}

    if (data instanceof this.$model) {
      return validateAll(data, this.$model.validationRules, this.$model.validationMessages);
    }

    throw new ServiceErrorException(
      `Provided model instance is not handled by this service.
        Expected: ${this.$model.constructor.name}
        Found: ${data.constructor.name}`
    )
  }

  async validate(model, transaction, trx = false) {
    const validation = await this.validateModel(model);

    if (validation instanceof Object && validation.fails()) {
      return new ServiceResponse(false, undefined, validation.messages());
    }

    return this.executeTransaction({ transaction, trx });
  }

  async find({ primaryKey, userContext = {}, byActive }) {
    try {
      const query = !byActive
        ? this.$model.query().where('id', primaryKey)
        : this.$model.query()
          .where('id', primaryKey)
          .active();

      return query.first();
    } catch (notFound) {
      return false;
    }
  }

  query({ userContext = {}, byActive, trx } = {}) {
    const query = this.$model.query();
    if (trx) {
      query.transacting(trx);
    }
    return !byActive ? query : query.active();
  }

  checkResponses({ responses = {}, data }) {
    let isOk = true;
    const responsesData = {};
    const errors = {};

    for (const key in responses) {
      isOk = isOk && responses[key].isOk;
      if (!responses[key].isOk) {
        errors[key] = responses[key].data;
      }
      responsesData[key] = responses[key].data;
    }
    return new ServiceResponse(isOk, isOk ? data || responsesData : errors, responsesData);
  }

  async finalizeTransaction({ isOk, trx, callbackAfterCommit = () => { }, restart = false }) {
    if (isOk) {
      await trx.commit();
      await callbackAfterCommit();
    } else {
      await trx.rollback();
    }
    if (restart) {
      trx = await Database.beginTransaction();
    }
    return trx;
  }

  applyTransactionToRelation({ relation, trx }) {
    if (trx && relation instanceof BaseRelation) {
      relation.relatedQuery.transacting(trx);
    }
  }
}

module.exports = Service;
