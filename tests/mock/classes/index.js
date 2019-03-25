const BaseRelation = require('@adonisjs/lucid/src/Lucid/Relations/BaseRelation')

module.exports = (ioc) => {
  const QueryBuilder = ioc.use('QueryBuilder')
  const Database = ioc.use('Database')
  const Validator = ioc.use('Validator')
  const { Model } = ioc.use('Conceptho/Model')

  return {
    Controller: require('./Controller')(Model, QueryBuilder),
    User: require('./User')(Model),
    Profile: require('./Profile')(Model),
    Service: require('./Service')(Database, BaseRelation, Validator, Model),
    Model
  }
}
