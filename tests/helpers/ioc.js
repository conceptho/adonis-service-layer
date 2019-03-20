const { Config } = require('@adonisjs/sink')

const registerDatabase = (ioc, dbPath) => {
  if (dbPath) {
    ioc.singleton('Adonis/Src/Database', () => {
      const DatabaseManager = require('@adonisjs/lucid/src/Database/Manager')

      const config = new Config()
      config.set('database', { connection: 'testing', testing: { client: 'sqlite', connection: { filename: dbPath } } })

      return new DatabaseManager(config)
    })
    ioc.alias('Adonis/Src/Database', 'Database')
  }

  ioc.bind('Adonis/Src/QueryBuilder', () =>
    require('@adonisjs/lucid/src/Lucid/QueryBuilder')
  )

  ioc.alias('Adonis/Src/QueryBuilder', 'QueryBuilder')
}

const registerValidator = (ioc) => {
  ioc.singleton('Adonis/Src/Validator', () =>
    require('@adonisjs/validator/src/Validator')
  )

  ioc.alias('Adonis/Src/Validator', 'Validator')
}

const registerModels = (ioc) => {
  ioc.bind('Conceptho/Model', () => {
    const AdonisModel = require('@adonisjs/lucid/src/Lucid/Model')

    const Model = require('../../src/models/Model')(AdonisModel, ioc.use('Validator'))
    Model._bootIfNotBooted()

    return { Model }
  })
}

const initializeIoc = async (ioc, dbPath) => {
  registerDatabase(ioc, dbPath)
  registerValidator(ioc)
  registerModels(ioc)
}

module.exports = {
  initializeIoc
}
