const BaseRelation = use('@adonisjs/lucid/src/Lucid/Relations/BaseRelation');
const Database = use('Database');
const Model = require('Conceptho/Model');

const { ServiceResponse } = use('Conceptho/Services');
const { validateAll } = use('Validator');

class Service {
  constructor(model) {
    this.Model = model;
  }

  async create({ modelData, trx }) {
    return this.validate({
      data: modelData,
      transaction: async trx => this.Model.create(modelData, trx),
      trx,
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
      transaction: async trx => {
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

  async validateData({ modelData = {} }) {
    if (modelData instanceof Model) {
      if (modelData.constructor.validationRules) {
        return validateAll(modelData.toJSON(), modelData.constructor.validationRules());
      }
      return true;
    }
    if (this.Model.validationRules) {
      return validateAll(modelData, this.Model.validationRules());
    }
    return true;
  }

  async validate({ data, transaction, trx = false }) {
    const validation = await this.validateData({ modelData: data });
    if (validation instanceof Object && validation.fails()) {
      return new ServiceResponse(false, validation.messages());
    }
    return this.executeTransaction({ transaction, trx });
  }

  async find({ primaryKey, userContext = {}, byActive }) {
    try {
      const query = !byActive
        ? this.Model.query().where('id', primaryKey)
        : this.Model.query()
            .where('id', primaryKey)
            .active();
      return query.first();
    } catch (notFound) {
      return false;
    }
  }

  query({ userContext = {}, byActive, trx } = {}) {
    const query = this.Model.query();
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

  async finalizeTransaction({ isOk, trx, callbackAfterCommit = () => {}, restart = false }) {
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
