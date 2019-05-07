module.exports = {
  helper: nameOperation => {
    const values = nameOperation.split(':')
    return ({ operation: values[1] ? values[1].toLowerCase().trim() : 'eq', name: values[0] })
  },
  operatorMapping: {
    eq: '=',
    neq: '<>',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    like: 'LIKE',
    in: 'IN',
    between: 'BETWEEN'
  }
}
