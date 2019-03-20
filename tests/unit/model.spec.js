require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))

const helpers = require('../helpers')
const test = require('japa')
const path = require('path')

const { setupResolver } = require('@adonisjs/sink')
const { ioc } = require('@adonisjs/fold')
const { pick } = require('lodash')

const getUserClass = () => {
  const { Model } = ioc.use('Model')

  return class User extends Model { }
}

test.group('base model', group => {
  group.before(async () => {
    setupResolver()

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
    const User = getUserClass()

    const modelData = { email: 'ahsirgashr', 'password': 'ahsiuasiuhga' }
    await User.create(modelData)
    const user = await User.first()

    assert.deepEqual(
      pick(user.toJSON(), Object.keys(modelData)), modelData,
      'the created model should match the passed model data'
    )
  })

  test('should sanitize before save', async assert => {
    class User extends getUserClass() {
      static get sanitizeRules () {
        return {
          email: 'plural'
        }
      }
    }

    await User.create({ email: 'hi', password: 123 })
    const user = await User.first()

    assert.equal(user.toJSON().email, 'his', 'defined sanitize rule should be applied (plural)')
  })

  test('should support soft delete', async assert => {
    const User = getUserClass()
    let user = await User.create({ email: 'hi', password: 123 })

    user = await User.first()
    assert.equal(user.toJSON().deleted, 0, 'default value for deleted is zero (false)')

    await user.softDelete()

    user = await User.first()
    assert.equal(user.toJSON().deleted, 1, 'after soft delete expect deleted to be 1 (true)')

    await user.undelete()

    user = await User.first()
    assert.equal(user.toJSON().deleted, 0, 'after undelete expect deleted to be 0 (false)')
  })
})
