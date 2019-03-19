require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))

const helpers = require('../helpers')
const test = require('japa')
const path = require('path')

const { ioc } = require('@adonisjs/fold')
const { pick } = require('lodash')

test.group('Model', group => {
  group.before(async () => {
    await helpers.cleanupTempDir()

    const tempDir = await helpers.setupTempDir()
    const dbLocation = path.join(tempDir, 'test.sqlite3')

    helpers.initializeIoc({ dbLocation })

    await helpers.createTables(ioc.use('Database'))
  })

  group.after(async () => {
    await ioc.use('Database').close()
    await helpers.cleanupTempDir()
  })

  group.afterEach(async () => {
    await ioc.use('Database').truncate('profiles')
    await ioc.use('Database').truncate('users')
  })

  test('should be able to define a model and query it', async assert => {
    class User extends ioc.use('Model') {
      static get createdAtColumn () {
        return null
      }

      static get updatedAtColumn () {
        return null
      }
    }

    const modelData = { email: 'ahsirgashr', 'password': 'ahsiuasiuhga' }
    await User.create(modelData)

    const res = (await User.query().first()).toJSON()
    assert.deepEqual(pick(res, Object.keys(modelData)), modelData)
  })
})
