require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))

const helpers = require('../../helpers')
const test = require('japa')

const { ioc } = require('@adonisjs/fold')
const { pick, range } = require('lodash')

test.group('base model', group => {
  group.before(async () => {
    this.ioc = await helpers.setup(ioc)
    this.classMocker = require('../../mock/classes')(this.ioc)
  })

  group.afterEach(async () => {
    await this.ioc.use('Database').truncate('profiles')
    await this.ioc.use('Database').truncate('users')
  })

  group.after(async () => {
    await this.ioc.use('Database').close()
    await helpers.cleanupTempDir()
  })

  test('should be able to define a model and query it', async assert => {
    const User = this.classMocker.User

    const modelData = { email: 'ahsirgashr', 'password': 'ahsiuasiuhga' }
    await User.create(modelData)
    const user = await User.first()

    assert.deepEqual(pick(user.toJSON(), Object.keys(modelData)), modelData)
  })

  test.failing('should be able to query related data')

  test('should sanitize before save', async assert => {
    class User extends this.classMocker.User {
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
    const User = this.classMocker.User
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

  test('should implement scope active', async assert => {
    const User = this.classMocker.User

    await Promise.all(range(0, 18).map(v =>
      User.create({ email: `${v}`, password: `${v}`, deleted: 1 })
    ))

    await User.create({ email: `${1}`, password: `${1}`, deleted: 0 })

    const [count] = await User.query().active().count()
    assert.equal(count['count(*)'], 1)
  })

  test('should implement static get method relations', assert =>
    assert.isDefined(this.classMocker.User.relations)
  )

  test('should implement static get method validationRules', assert =>
    assert.isDefined(this.classMocker.User.validationRules)
  )

  test('should implement static get method validationMessages', assert =>
    assert.isDefined(this.classMocker.User.validationRules)
  )
})
