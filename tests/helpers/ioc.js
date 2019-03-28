const { Config, Helpers } = require('@adonisjs/sink')
const { registrar } = require('@adonisjs/fold')
const { reduce } = require('lodash')
const path = require('path')

async function registerAdonis (ioc) {
  ioc.bind('Adonis/Src/Helpers', function () {
    return new Helpers(path.join(__dirname, '../'))
  })

  const providers = [
    path.join(__dirname, '../../node_modules/@adonisjs/framework/providers/AppProvider')
  ]

  ioc.bind('Adonis/Src/Model', () => {
    const AdonisModel = require('@adonisjs/lucid/src/Lucid/Model')
    AdonisModel._bootIfNotBooted()

    return AdonisModel
  })

  ioc.alias('Adonis/Src/Model', 'Model')

  await registrar
    .providers(providers)
    .registerAndBoot()
}

function registerDatabase (ioc, dbPath) {
  ioc.singleton('Adonis/Src/Database', () => {
    const DatabaseManager = require('@adonisjs/lucid/src/Database/Manager')

    const config = new Config()
    config.set('database', { connection: 'testing', testing: { client: 'sqlite', connection: { filename: dbPath } } })

    return new DatabaseManager(config)
  })

  ioc.bind('Adonis/Src/QueryBuilder', () =>
    require('@adonisjs/lucid/src/Lucid/QueryBuilder')
  )

  ioc.alias('Adonis/Src/Database', 'Database')
  ioc.alias('Adonis/Src/QueryBuilder', 'QueryBuilder')
}

function registerValidator (ioc) {
  ioc.singleton('Adonis/Src/Validator', () =>
    require('@adonisjs/validator/src/Validator')
  )

  ioc.alias('Adonis/Src/Validator', 'Validator')
}

function registerModels (ioc) {
  ioc.bind('Conceptho/Model', () => {
    const AdonisModel = require('@adonisjs/lucid/src/Lucid/Model')

    const Model = require('../../src/models/Model')(AdonisModel, ioc.use('Validator'))
    Model._bootIfNotBooted()

    return { Model }
  })
}

async function initializeIoc (ioc, dbPath) {
  const hasEmptyArgs = reduce(arguments, (res, value) => res && (value === undefined), true)

  if (hasEmptyArgs) {
    throw new Error(`Plese check ${this.name} args: ${arguments}`)
  }

  await registerAdonis(ioc)

  registerDatabase(ioc, dbPath)
  registerValidator(ioc)
  registerModels(ioc)

  return ioc
}

module.exports = {
  initializeIoc
}
