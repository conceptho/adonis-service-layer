const Service = require('../../../src/services/Service')

module.exports = (Database, BaseRelation, Validator, Model) =>
  Service(Database, BaseRelation, Validator, Model)
