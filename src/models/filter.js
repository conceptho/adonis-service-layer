const operatorMapping = {
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

module.exports = {
  helper (nameOperation) {
    const values = nameOperation.split(':')
    const operationKey = values[1] ? values[1].toLowerCase().trim() : 'eq'
    return ({ operation: operatorMapping[operationKey], name: values[0].trim() })
  }
}
