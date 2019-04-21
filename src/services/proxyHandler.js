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
    const onEntryFunctionsArray = thisArg['onEntryHooks']().map(v => thisArg[v]).filter(v => _isFunction(v))
    const onExitFunctionsArray = thisArg['onExitHooks']().map(v => thisArg[v]).filter(v => _isFunction(v))
    const resultOnEntryFunctions = await Promise.all(
      onEntryFunctionsArray.map(func => func(argumentsList, target))
    )
    const targetWithBind = (target.bind(thisArg))
    let actionResult = targetWithBind.constructor.name === 'AsyncFunction'
      ? await targetWithBind(...argumentsList)
      : targetWithBind(...argumentsList)
    if (actionResult instanceof Promise) {
      actionResult = await actionResult
    }
    const resultOnExitFunctions = await Promise.all(
      onExitFunctionsArray.map(func => func(argumentsList, actionResult, target))
    )
    const info = {}
    info[`${target.name}MetaData`] = { resultOnEntryFunctions, resultOnExitFunctions }
    actionResult.metaData = actionResult.metaData || {}
    _assign(actionResult.metaData, info)
    return actionResult
  }
}

module.exports = getHandler
