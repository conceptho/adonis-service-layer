const test = require('japa')

const { ioc } = require('@adonisjs/fold')
const { pick, range } = require('lodash')

test.group('base model', group => {
  group.before(async () => {
    ioc.restore()

    const { Model } = require('../../mock/classes')

    ioc.fake('App/Models/User', () =>
      class User extends Model {
        profile () {
          return this.hasOne('App/Models/Profile')
        }

        static get sanitizeRules () {
          return {
            password: 'plural'
          }
        }
      })

    ioc.fake('App/Models/Profile', () =>
      class Profile extends Model {
        user () {
          return this.belongsTo('App/Models/User')
        }
      })
  })

  group.afterEach(async () => {
    await use('Database').truncate('profiles')
    await use('Database').truncate('users')
  })

  test('should be able to define a model and query it', async assert => {
    const User = use('App/Models/User')

    const modelData = { email: 'ahsirgashr', password: 'ahsirgashrs' }

    await User.create(modelData)
    const user = await User.first()
    assert.deepEqual(pick(user.toJSON(), Object.keys(modelData)), modelData)
  })

  test('should be able to query related data', async assert => {
    const User = use('App/Models/User')
    const Profile = use('App/Models/Profile')

    const user = await User.create({ email: '1234' })
    await Profile.create({ user_id: user.id })

    const userProfile = await user.profile().fetch()
    assert.deepEqual(pick(userProfile.toJSON(), 'user_id'), { user_id: user.id })
  })

  test('should sanitize before save', async assert => {
    const User = use('App/Models/User')

    await User.create({ email: 'hi', password: 'hi' })
    const user = await User.first()
    assert.equal(user.toJSON().password, 'his')
  })

  test('should support soft delete', async assert => {
    const User = use('App/Models/User')
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
    const User = use('App/Models/User')

    await Promise.all(range(0, 19).map(v =>
      User.create({ email: `${v}`, password: `${v}`, deleted: 1 })
    ))

    await User.create({ email: `${1}`, password: `${1}`, deleted: 0 })

    const [count] = await User.query().active().count()
    assert.equal(count['count(*)'], 1)
  })

  test('should implement static get method relations', assert =>
    assert.isArray(use('App/Models/User').relations)
  )

  test('should implement static get method validationRules', assert =>
    assert.isObject(use('App/Models/User').validationRules)
  )
})
