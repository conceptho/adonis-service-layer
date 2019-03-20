require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))

const helpers = require('../../helpers')
const test = require('japa')
const path = require('path')

const { setupResolver } = require('@adonisjs/sink')
const { ioc } = require('@adonisjs/fold')
const { pick } = require('lodash')

const userMock = require('../../mock/classes/User')

test.group('base model', group => {
  group.before(async () => {
    setupResolver()

    await helpers.cleanupTempDir()
    const tempDirPath = await helpers.createTempDir()
    const dbPath = path.join(tempDirPath, 'test.sqlite3')

    helpers.initializeIoc(ioc, dbPath)
    await helpers.createTables(ioc.use('Database'))
  })

  group.afterEach(async () => {
    await ioc.use('Database').truncate('profiles')
    await ioc.use('Database').truncate('users')
  })

  group.after(async () => {
    await ioc.use('Database').close()
    await helpers.cleanupTempDir()
  })

  test('should be able to define a model and query it', async assert => {
    const User = userMock(ioc)

    const modelData = { email: 'ahsirgashr', 'password': 'ahsiuasiuhga' }
    await User.create(modelData)
    const user = await User.first()

    assert.deepEqual(
      pick(user.toJSON(), Object.keys(modelData)), modelData)
  })

  test('should sanitize before save', async assert => {
    class User extends userMock(ioc) {
      static get sanitizeRules () {
        return {
          email: 'plural'
        }
      }
    }

    await User.create({ email: 'hi', password: 123 })
    const user = await User.first()

    assert.equal(user.toJSON().email, 'his')
  })

  test('should support soft delete', async assert => {
    const User = userMock(ioc)
    let user = await User.create({ email: 'hi', password: 123 })

    user = await User.first()
    assert.equal(user.toJSON().deleted, 0)

    await user.softDelete()

    user = await User.first()
    assert.equal(user.toJSON().deleted, 1)

    await user.undelete()

    user = await User.first()
    assert.equal(user.toJSON().deleted, 0)
  })
})
