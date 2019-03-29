const { Config, Helpers } = require('@adonisjs/sink')
const { registrar } = require('@adonisjs/fold')
const { reduce } = require('lodash')
const path = require('path')

async function registerProviders (ioc) {
  ioc.bind('Adonis/Src/Helpers', () => new Helpers(path.join(__dirname, '../')))

  ioc.bind('Adonis/Src/Model', () => {
    const AdonisModel = require('@adonisjs/lucid/src/Lucid/Model')
    AdonisModel._bootIfNotBooted()

    return AdonisModel
  })

  ioc.alias('Adonis/Src/Model', 'Model')

  const providers = [
    path.join(__dirname, '../../node_modules/@adonisjs/framework/providers/AppProvider'),
    path.join(__dirname, '../../src/providers/ServiceLayerProvider')
  ]

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

async function initializeIoc (ioc, dbPath) {
  const hasEmptyArgs = reduce(arguments, (res, value) => res && (value === undefined), true)

  if (hasEmptyArgs) {
    throw new Error(`Plese check ${this.name} args: ${arguments}`)
  }

  registerDatabase(ioc, dbPath)
  registerValidator(ioc)

  await registerProviders(ioc)

  return ioc
}

module.exports = {
  initializeIoc
}
