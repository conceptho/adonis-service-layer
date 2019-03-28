require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))

const helpers = require('../../helpers')
const test = require('japa')

const { ServiceException, ValidationException } = require('../../../src/exceptions/runtime')
const { ioc } = require('@adonisjs/fold')
const { pick } = require('lodash')

const ServiceResponse = require('../../../src/services/ServiceResponse')

test.group('base service', group => {
  group.before(async () => {
    this.ioc = await helpers.setup(ioc)
    this.classMocker = require('../../mock/classes')(this.ioc)

    const { Model } = this.classMocker

    this.ioc.fake('App/Models/User', () =>
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

    this.ioc.fake('App/Models/Profile', () =>
      class Profile extends Model {
        user () {
          return this.belongsTo('App/Models/User')
        }
      })

    this.ioc.fake('App/Services/UserService', () => {
      const { Service } = this.classMocker

      class UserService extends Service { }

      return new UserService(this.ioc.use('App/Models/User'))
    })
  })

  group.afterEach(async () => {
    await this.ioc.use('Database').truncate('profiles')
    await this.ioc.use('Database').truncate('users')
  })

  group.after(async () => {
    await this.ioc.use('Database').close()
    await helpers.cleanupTempDir()
  })

  test('should handle a valid model class', async assert => {
    const { Service, Model } = this.classMocker
    const User = this.ioc.use('App/Models/User')
    const AdonisModel = this.ioc.use('Adonis/Src/Model')

    const service = new Service(User)

    assert.isTrue(service.$model === User)
    assert.isTrue(service.$model.prototype instanceof Model)
    assert.isTrue(service.$model.prototype instanceof AdonisModel)

    class Test { }
    assert.throws(() => new Service(Test), ServiceException)
  })

  test('should be able to create a related model', async assert => {
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')

    const user = new User({ email: 'test@test.com' })
    const response = await UserService.create({ model: user })

    assert.isTrue(response.constructor === ServiceResponse)
    assert.strictEqual(response.data.toJSON().email, 'test@test.com')
  })

  test('should validate model data before update or save', async assert => {
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')

    const usera = new User({ email: 'hehehe' })
    const userb = new User({ email: 'test@test.com' })

    const { error: caseOne } = await UserService.create({ model: usera })
    assert.isTrue(caseOne.constructor === ValidationException)

    const { error: caseTwo } = await UserService.create({ model: userb })
    assert.isNull(caseTwo)
  })

  test('should implement find', async assert => {
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')
    const whereAttributes = { email: 'test@test.com' }

    const user = await User.query().where(whereAttributes).first()
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
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')
    const whereAttributes = { email: 'test@test.com' }

    const user = await User.query().where(whereAttributes).first()
    assert.isNull(user)

    const { data: newUser } = await UserService.findOrCreate({ whereAttributes })
    assert.isNotNull(newUser)
    assert.strictEqual(newUser.toJSON().email, 'test@test.com')

    const { data: existingUser } = await UserService.findOrCreate({ whereAttributes })
    assert.deepEqual(pick(existingUser.toJSON(), Object.keys(newUser.toJSON())), newUser.toJSON())
  })

  test('should implement update', async assert => {
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')

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
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')

    const { data: user } = await UserService.create({ model: new User({ password: 123 }) })

    await UserService.delete({ model: user }, true)
    assert.strictEqual(user.deleted, 1, 'soft deleted')

    await UserService.delete({ model: user })
    const { error: { name } } = await UserService.find({ whereAttributes: { id: user.id } })

    assert.strictEqual(name, 'ModelNotFoundException')
  })

  test('should implement undelete', async assert => {
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')

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
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')

    let { data: user } = await UserService.create({ model: new User({ password: 123 }) })
    await UserService.delete({ model: user }, true) // softDelete

    user = await UserService.query({ byActive: false }).first()
    assert.strictEqual(user.toJSON().password, '123', 'byActive false working')

    user = await UserService.query({ byActive: true }).first()
    assert.isNull(user, 'byActive true working')
  })

  test('should implement checkResponses', assert => {
    const UserService = this.ioc.use('App/Services/UserService')

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
