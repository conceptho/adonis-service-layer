const AdonisModel = use('Model');
const DefaultSerializer = require('../serializers/DefaultSerializer');

class Model extends AdonisModel {
  static boot() {
    super.boot();

    this.addHook('beforeUpdate', 'BeforeUpdateHook.updateDate');
  }

  static bootIfNotBooted() {
    if (!this.$bootedBy) {
      this.$bootedBy = [];
    }

    if (this.$bootedBy.includes(this.name)) {
      this.$bootedBy.push(this.name);

      this.boot();
    }
  }

  static scopeActive(query) {
    return query.andWhere({ deleted: 0 });
  }

  async softDelete(transaction) {
    this.deleted = 1;
    const affected = await this.save(transaction);

    if (affected) {
      this.freeze();
    }
  }

  async undelete(transaction) {
    if (this.hasOwnProperty('deleted')) {
      this.unfreeze();
      this.deleted = 0;

      const affected = await this.save(transaction);
      return !!affected;
    }

    return false;
  }

  static get relations() {
    return [];
  }

  static get validationRules() {
    return {};
  }

  static get validationMessages() {
    return {};
  }

  static get Serializer() {
    return DefaultSerializer;
  }
}

module.exports = Model;
