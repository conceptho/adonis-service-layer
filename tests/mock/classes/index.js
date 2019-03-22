module.exports = (ioc) => {
  const QueryBuilder = ioc.use('QueryBuilder')
  const { Model } = ioc.use('Conceptho/Model')

  return {
    Controller: require('./Controller')(Model, QueryBuilder),
    User: require('./User')(Model),
    Profile: require('./Profile')(Model),
    Model
  }
}
