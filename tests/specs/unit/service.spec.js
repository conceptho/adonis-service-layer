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

  test('should be able to create a related model and return a service response', async assert => {
    const UserService = this.ioc.use('App/Services/UserService')

    const response = await UserService.create({ modelData: { email: 'test@test.com' } })

    assert.isTrue(response.constructor === ServiceResponse)
    assert.strictEqual(response.data.toJSON().email, 'test@test.com')
  })

  test('should validate model data before update or save', async assert => {
    const UserService = this.ioc.use('App/Services/UserService')

    const { error: caseOne } = await UserService.create({ modelData: { email: 'hehehe' } })
    assert.isTrue(caseOne.constructor === ValidationException)

    const { error: caseTwo } = await UserService.create({ modelData: { email: 'test@test.com' } })
    assert.isNull(caseTwo)
  })

  test('should implement findOrCreate', async assert => {
    const UserService = this.ioc.use('App/Services/UserService')
    const User = this.ioc.use('App/Models/User')

    const user = await User.query().where({ email: 'test@test.com ' }).first()
    assert.isNull(user)

    const { data: newUser } = await UserService.findOrCreate({ whereAttributes: { email: 'test@test.com' }, modelData: { email: 'test@test.com' } })
    assert.isNotNull(newUser)
    assert.strictEqual(newUser.email, 'test@test.com')

    const { data: existingUser } = await UserService.findOrCreate({ whereAttributes: { email: 'test@test.com' } })
    assert.deepEqual(pick(existingUser.toJSON(), Object.keys(newUser.toJSON())), newUser.toJSON())
  })
})
