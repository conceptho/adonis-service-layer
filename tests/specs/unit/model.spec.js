const test = require('japa')

const { ioc } = require('@adonisjs/fold')
const { pick, range } = require('lodash')

test.group('base model', group => {
  group.before(async () => {
    ioc.restore()

    const { Model } = use('Conceptho/Models')

    ioc.fake('App/Models/User', () =>
      class User extends Model {
        profile () {
          return this.hasOne('App/Models/Profile')
        }

        posts () {
          return this.pivotRelation({ relatedModel: 'App/Models/Post', pivotTable: '_user_posts' })
        }

        address () {
          return this.pivotRelation({ relatedModel: 'App/Models/Address', type: 'hasOne', pivotTable: '_user_address' })
        }

        static get sanitizeRules () {
          return {
            password: 'plural'
          }
        }

        static get validationRules () {
          return {
            email: 'email'
          }
        }

        static get canBeFiltered () {
          return ['email', 'id']
        }
      })

    ioc.fake('App/Models/Profile', () =>
      class Profile extends Model {
        user () {
          return this.belongsTo('App/Models/User')
        }
      })

    ioc.fake('App/Models/Post', () => (
      class Post extends Model {
        user () {
          return this.pivotRelation({ relatedModel: 'App/Models/User', type: 'hasOne', pivotTable: '_user_posts' })
        }
      }
    ))

    ioc.fake('App/Models/Address', () => (
      class Address extends Model {
        user () {
          return this.pivotRelation({ relatedModel: 'App/Models/User', type: 'hasOne', pivotTable: '_user_address' })
        }
      }
    ))
  })

  group.afterEach(async () => {
    await Promise.all([
      use('Database').raw('delete from profiles'),
      use('Database').raw('delete from _user_posts'),
      use('Database').raw('delete from _user_address')
    ])
    await Promise.all([
      use('Database').raw('delete from posts'),
      use('Database').raw('delete from addresses'),
      use('Database').raw('delete from users')
    ])
    await use('Database').raw('ALTER TABLE users AUTO_INCREMENT=1')
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

  test('should be able to query related data using the pivotRelation', async assert => {
    const User = use('App/Models/User')
    const user = new User({ email: '1234' })
    const post = await user.posts().create({ comment: 'awesome' })
    await user.load('posts')
    await post.load('user')
    assert.deepEqual(pick(post.toJSON(), 'comment'), { comment: 'awesome' })
    assert.deepEqual(pick(user.toJSON().posts[0], 'comment'), { comment: 'awesome' })
  })

  const user1 = { id: 1, email: '1234@email.com' }
  const user2 = { id: 2, email: '5678@email.com' }
  const user3 = { id: 3, email: '91011@email.com' }
  const filterOperators = [
    { field: 'id', operator: 'eq', value: 1, arrayValues: [user1] },
    { field: 'id', operator: 'neq', value: 1, arrayValues: [user2, user3] },
    { field: 'email', operator: 'like', value: '1234', arrayValues: [user1] },
    { field: 'id', operator: 'gt', value: 1, arrayValues: [user2, user3] },
    { field: 'id', operator: 'gte', value: 1, arrayValues: [user1, user2, user3] },
    { field: 'id', operator: 'lt', value: 2, arrayValues: [user1] },
    { field: 'id', operator: 'lte', value: 2, arrayValues: [user1, user2] },
    { field: 'id', operator: 'in', value: '1,2', arrayValues: [user1, user2] },
    { field: 'id', operator: 'nin', value: '1,2', arrayValues: [user3] },
    { field: 'id', operator: 'between', value: '1,3', arrayValues: [user1, user2, user3] },
    { field: 'id', operator: 'nbetween', value: '1,3', arrayValues: [] }
  ]

  filterOperators.forEach(
    ({ field, operator, value, arrayValues }) => test(`should be able to query data using the scopeFilter with operator '${operator}'`, async assert => {
      const User = use('App/Models/User')
      await User.createMany([{ email: '1234@email.com' }, { email: '5678@email.com' }, { email: '91011@email.com' }])
      const filterData = {}
      filterData[`${field}:${operator}`] = value
      const searchedUsers = (await User.query().filter(filterData).fetch()).toJSON()
      assert.deepEqual(
        arrayValues,
        searchedUsers.map(user => pick(user, ['id', 'email']))
      )
    })
  )

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

  test('should implement validate', async assert => {
    const ValidationException = require('../../../src/exceptions/runtime/ValidationException')
    const User = use('App/Models/User')

    let user = new User({ email: 'test' })
    const { error: validationError } = await user.validate()

    assert.instanceOf(validationError, ValidationException)

    user = new User({ email: 'test@test.com' })
    const { error } = await user.validate()

    assert.isNull(error)
  })

  test('should support deleteWithinTransaction', async assert => {
    const Database = use('Database')
    const User = use('App/Models/User')

    let user
    let transaction

    user = await User.create({ email: 'hi' })
    assert.isNotNull(await User.query().where({ email: 'hi' }).first())

    transaction = await Database.beginTransaction()
    await user.deleteWithinTransaction(transaction)
    assert.isNotNull(await User.query().where({ email: 'hi' }).first())
    await transaction.commit()
    assert.isNull(await User.query().where({ email: 'hi' }).first())

    transaction = await Database.beginTransaction()
    user = await User.create({ email: 'hi' })
    await user.deleteWithinTransaction(transaction)
    await transaction.rollback()
    assert.isNotNull(await User.query().where({ email: 'hi' }).first())
  })
})
