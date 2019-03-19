const path = require('path')
const fs = require('fs-extra')

const { ioc } = require('@adonisjs/fold')
const { Config } = require('@adonisjs/sink')

module.exports = {
  createTables (db) {
    return Promise.all([
      db.schema.createTable('users', table => {
        table.increments()
        table.string('email').notNullable()
        table.string('password').notNullable()
        table.boolean('deleted').defaultTo(false)
      }),
      db.schema.createTable('profiles', table => {
        table.increments()
        table.integer('user_id').notNullable().references('id').inTable('users')
        table.boolean('deleted').defaultTo(false)
      })
    ])
  },

  async setupTempDir () {
    const tempDirPath = path.join(__dirname, '../temp')
    await fs.ensureDir(tempDirPath)

    return tempDirPath
  },

  async cleanupTempDir () {
    const tempDirPath = path.join(__dirname, '../temp')

    await fs.remove(tempDirPath)
  },

  initializeIoc ({ dbLocation }) {
    // Database
    ioc.singleton('Adonis/Src/Database', () => {
      const DatabaseManager = require('@adonisjs/lucid/src/Database/Manager')

      const config = new Config()
      config.set('database', {
        connection: 'testing', testing: { client: 'sqlite', connection: { filename: dbLocation } }
      })

      return new DatabaseManager(config)
    })
    ioc.alias('Adonis/Src/Database', 'Database')

    // Validator
    ioc.singleton('Adonis/Src/Validator', () =>
      require('@adonisjs/validator/src/Validator')
    )
    ioc.alias('Adonis/Src/Validator', 'Validator')

    // Model
    ioc.singleton('Conceptho/Model', () => {
      const AdonisModel = require('@adonisjs/lucid/src/Lucid/Model')

      const Model = require('../src/models/Model')(AdonisModel, ioc.use('Validator'))
      Model.bootIfNotBooted()

      return Model
    })
    ioc.alias('Conceptho/Model', 'Model')
  }
}
