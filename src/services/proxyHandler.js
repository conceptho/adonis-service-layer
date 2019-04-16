const _ = require('lodash')
const _startCase = _.startCase
const _isFunction = _.isFunction
const _assign = _.assign

const getHandler = {
  get: function (target, name) {
    const action = target[`action${(_startCase(name)).replace(/\s/g, '')}`]
    if (_isFunction(action)) {
      return new Proxy(action, applyHandler)
    } else {
      return target[name]
    }
  }
}

const applyHandler = {
  apply: async function (target, thisArg, argumentsList) {
    console.log(thisArg)
    const onEntryFunctionsArray = thisArg['onEntryHooks']().map(v => thisArg[v]).filter(v => _isFunction(v))
    const onExitFunctionsArray = thisArg['onExitHooks']().map(v => thisArg[v]).filter(v => _isFunction(v))
    const resultOnEntryFunctions = await Promise.all(
      onEntryFunctionsArray.map(func => func(argumentsList))
    )
    const actionResult = await target(...argumentsList)
    const resultOnExitFunctions = await Promise.all(
      onExitFunctionsArray.map(func => func(argumentsList, actionResult))
    )
    _assign(actionResult.extraData, { resultOnEntryFunctions, resultOnExitFunctions })
    return actionResult
  }
}

module.exports = getHandler
