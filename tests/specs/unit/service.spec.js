const test = require('japa')

const { ValidationException } = require('../../../src/exceptions/runtime')
const { ioc } = require('@adonisjs/fold')
const { pick } = require('lodash')

const ServiceResponse = require('../../../src/services/ServiceResponse')

test.group('base service', group => {
  group.before(async () => {
    ioc.restore()

    const { Model, Service } = require('../../mock/classes')

    ioc.fake('App/Models/User', () =>
      class User extends Model {
        static get validationRules () {
          return {
            email: 'email'
          }
        }

        static get validationMessages () {
          return {
            'email.email': 'Invalid e-mail :('
          }
        }

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

    ioc.fake('App/Services/UserService', () => {
      class UserService extends Service { }

      return new UserService(use('App/Models/User'))
    })
  })

  group.afterEach(async () => {
    await use('Database').truncate('profiles')
    await use('Database').truncate('users')
  })

  test('should handle a valid model class', async assert => {
    const User = use('App/Models/User')
    const userService = use('App/Services/UserService')

    assert.isTrue(userService.$model.constructor === User.constructor)
  })

  test('should be able to create a related model', async assert => {
    const User = use('App/Models/User')
    const UserService = use('App/Services/UserService')

    const user = new User({ email: 'test@test.com' })

    const { data: { email } } = await UserService.create({ model: user })

    assert.strictEqual(email, 'test@test.com')
  })

  test('should validate model data before update or save', async assert => {
    const User = use('App/Models/User')
    const UserService = use('App/Services/UserService')

    const usera = new User({ email: 'hehehe' })
    const userb = new User({ email: 'test@test.com' })

    const { error: errorOne } = await UserService.create({ model: usera })
    assert.isTrue(errorOne.constructor === ValidationException)

    const { error: errorTwo } = await UserService.create({ model: userb })
    assert.isNull(errorTwo)
  })

  test('should implement find', async assert => {
    const User = use('App/Models/User')
    const UserService = use('App/Services/UserService')

    const whereAttributes = { email: 'test@test.com' }

    const { data: user } = await UserService.find({ whereAttributes })
    assert.isNull(user)

    await UserService.create({ model: new User(whereAttributes) })

    const { data: newUser } = await UserService.find({ whereAttributes })
    assert.isNotNull(newUser)
    assert.strictEqual(newUser.toJSON().email, 'test@test.com')

    await UserService.delete({ model: newUser }, true)

    const { error: { name } } = await UserService.find({ whereAttributes, byActive: true })
    assert.strictEqual(name, 'ModelNotFoundException')

    const { data: unexistentUser, error: { name: notFound } } = await UserService.find({ whereAttributes: { email: 'oops' } })
    assert.isNull(unexistentUser)
    assert.strictEqual(notFound, 'ModelNotFoundException')
  })

  test('should implement findOrCreate', async assert => {
    const UserService = use('App/Services/UserService')

    const whereAttributes = { email: 'test@test.com' }

    const { data: user } = await UserService.find({ whereAttributes })
    assert.isNull(user)

    const { data: newUser } = await UserService.findOrCreate({ whereAttributes })
    assert.isNotNull(newUser)
    assert.strictEqual(newUser.email, 'test@test.com')

    const { data: existingUser } = await UserService.findOrCreate({ whereAttributes })
    assert.deepEqual(pick(existingUser.toJSON(), Object.keys(newUser.toJSON())), newUser.toJSON())
  })

  test('should implement update', async assert => {
    const User = use('App/Models/User')
    const UserService = use('App/Services/UserService')

    const { data: user } = await UserService.create({ model: new User({ password: 123 }) })
    assert.strictEqual(user.password, 123)

    user.password = 321

    await UserService.update({ model: user })
    assert.strictEqual(user.password, 321)

    user.email = 'abcd'

    const { error } = await UserService.update({ model: user })
    assert.strictEqual(error.constructor, ValidationException)
    assert.isUndefined(user.email)
  })

  test('should implement delete', async assert => {
    const User = use('App/Models/User')
    const UserService = use('App/Services/UserService')

    const { data: user } = await UserService.create({ model: new User({ password: 123 }) })

    await UserService.delete({ model: user }, true)
    assert.strictEqual(user.deleted, 1, 'soft deleted')

    await UserService.delete({ model: user })
    const { error: { name } } = await UserService.find({ whereAttributes: { id: user.id } })

    assert.strictEqual(name, 'ModelNotFoundException')
  })

  test('should implement undelete', async assert => {
    const User = use('App/Models/User')
    const UserService = use('App/Services/UserService')

    const { data: user } = await UserService.create({ model: new User({ password: 123 }) })

    await UserService.delete({ model: user }, true)
    assert.strictEqual(user.deleted, 1)

    await UserService.undelete({ model: user })
    assert.strictEqual(user.deleted, 0)

    await UserService.delete({ model: user }, false)

    const { error: { name: errorName } } = await UserService.find({ whereAttributes: { id: user.id } })
    assert.strictEqual(errorName, 'ModelNotFoundException')
  })

  test('should be able to query data', async assert => {
    const User = use('App/Models/User')
    const UserService = use('App/Services/UserService')

    let { data: user } = await UserService.create({ model: new User({ password: 123 }) })
    await UserService.delete({ model: user }, true) // softDelete

    user = await UserService.query({ byActive: false }).first()
    assert.strictEqual(user.toJSON().password, '123', 'byActive false working')

    user = await UserService.query({ byActive: true }).first()
    assert.isNull(user, 'byActive true working')
  })

  test('should implement checkResponses', assert => {
    const UserService = use('App/Services/UserService')

    let responses = [
      new ServiceResponse({ error: new ValidationException('example validation') }),
      new ServiceResponse({ error: new ValidationException('example validation 2'), data: 2 })
    ]

    const { error, data } = UserService.checkResponses({ responses })
    assert.lengthOf(error, 2)
    assert.lengthOf(data, 2)

    assert.strictEqual(data[1], 2)
    assert.isNull(data[0])

    responses = [
      new ServiceResponse({ data: 'value' }),
      new ServiceResponse({ data: { a: 'value' } })
    ]

    const { error: errors, data: datas } = UserService.checkResponses({ responses })
    assert.strictEqual(datas[0], 'value')
    assert.deepEqual(datas[1], { a: 'value' })
    assert.isNull(errors)
  })
})
