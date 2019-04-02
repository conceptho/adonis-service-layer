const databaseHelper = require('./database')
const iocHelper = require('./ioc')
const tempHelper = require('./temp')
const path = require('path')

const { setupResolver } = require('@adonisjs/sink')

async function setup (ioc) {
  setupResolver()

  await tempHelper.cleanupTempDir()

  const tempDirPath = await tempHelper.createTempDir()
  const dbPath = path.join(tempDirPath, 'test.sqlite3')

  await iocHelper.initializeIoc(ioc, dbPath)
  await databaseHelper.createTables(ioc)

  return ioc
}

module.exports = {
  setup,
  ...tempHelper
}
