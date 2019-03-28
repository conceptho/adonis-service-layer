const BaseRelation = require('@adonisjs/lucid/src/Lucid/Relations/BaseRelation')

const mocker = () => {
  const QueryBuilder = use('QueryBuilder')
  const Database = use('Database')
  const Validator = use('Validator')
  const { Model } = use('Conceptho/Model')

  return {
    Controller: require('./Controller')(Model, QueryBuilder),
    User: require('./User')(Model),
    Profile: require('./Profile')(Model),
    Service: require('./Service')(Database, BaseRelation, Validator, Model),
    Model
  }
}

module.exports = mocker()
