const Controller = require('../../../src/controllers/Controller')

module.exports = ioc => {
  const QueryBuilder = ioc.use('QueryBuilder')

  return Controller(QueryBuilder)
}
