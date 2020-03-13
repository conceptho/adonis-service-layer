const test = require('japa')

const { ioc } = require('@adonisjs/fold')

test.group('base controller', group => {
  group.before(async () => {
    ioc.restore()

    const { Model } = use('Conceptho/Models')
    const { Controller } = use('Conceptho/Controllers')

    ioc.fake('App/Models/User', () =>
      class User extends Model {
        profile () {
          return this.hasOne('App/Models/Profile')
        }
      })

    ioc.fake('App/Models/Profile', () =>
      class Profile extends Model {
        user () {
          return this.belongsTo('App/Models/User')
        }
      })

    ioc.fake('App/Controllers/Controller', () =>
      Controller
    )
  })

  group.beforeEach(async () => {
    const user = await use('App/Models/User').create({ email: '132', password: '132' })
    await use('App/Models/Profile').create({ user_id: user.id })
  })

  group.afterEach(async () => {
    await use('Database').raw('delete from profiles')
    await use('Database').raw('delete from users')
  })

  test('should have applyExpand defined', assert => {
    const Controller = use('App/Controllers/Controller')
    const controllerInstance = new Controller()

    assert.isDefined(controllerInstance.applyExpand)
  })

  test('should have verifyServiceResponse defined', assert => {
    const Controller = use('App/Controllers/Controller')
    const controllerInstance = new Controller()

    assert.isDefined(controllerInstance.verifyServiceResponse)
  })

  test('applyExpand should handle a Model instance', async assert => {
    const Controller = use('App/Controllers/Controller')
    const User = use('App/Models/User')

    const user = await User.first()
    const controller = new Controller()

    await controller.applyExpand({ data: user, expand: 'profile', whiteList: ['profile'] })
    assert.isDefined(user.$relations.profile)
    assert.exists(user.$relations.profile)
  })

  test('applyExpand should handle a Model instance with ServiceContext', async assert => {
    const Controller = use('App/Controllers/Controller')
    const User = use('App/Models/User')
    const Database = use('Database')
    const ServiceContext = require('../../../src/services/ServiceContext')(Database)

    const user = await User.first()
    const controller = new Controller()
    const serviceContext = new ServiceContext({ ctx: {} })
    await serviceContext.init()
    await controller.applyExpand({ data: user, expand: 'profile', whiteList: ['profile'], serviceContext })
    assert.isDefined(user.$relations.profile)
    assert.exists(user.$relations.profile)
  })

  test('applyExpand should not load property if it is listed on a blackList', async assert => {
    const Controller = use('App/Controllers/Controller')
    const User = use('App/Models/User')

    const controller = new Controller()
    const user = await User.first()

    await controller.applyExpand({ data: user, expand: 'profile', blackList: ['profile'] })
    assert.strictEqual(user.$relations.profile, undefined)
  })

  test('applyExpand blackList should prevail if a property is also listed on a whiteList ', async assert => {
    const Controller = use('App/Controllers/Controller')
    const User = use('App/Models/User')

    const controller = new Controller()
    const user = await User.first()

    await controller.applyExpand({ data: user, expand: 'profile', blackList: ['profile'], whiteList: ['profile'] })
    assert.strictEqual(user.$relations.profile, undefined)
  })

  test('applyExpand should handle a QueryBuilder instance', async assert => {
    const Controller = use('App/Controllers/Controller')
    const User = use('App/Models/User')

    const controller = new Controller()
    const result = await controller.applyExpand({ data: User.query(), expand: 'profile', whiteList: ['profile'] }).fetch()

    assert.isArray(result.rows)
    assert.isDefined(result.rows[0].$relations.profile)
    assert.exists(result.rows[0].$relations.profile)
  })

  test('applyExpand should handle a QueryBuilder instance with ServiceContext', async assert => {
    const Controller = use('App/Controllers/Controller')
    const User = use('App/Models/User')
    const Profile = use('App/Models/Profile')
    const Database = use('Database')
    const ServiceContext = require('../../../src/services/ServiceContext')(Database)

    const controller = new Controller()
    const serviceContext = new ServiceContext({ ctx: {} })
    await serviceContext.init()
    const secondServiceContext = await (async () => {
      const serviceContext = new ServiceContext({ ctx: {} })
      await serviceContext.init()
      await Profile.query().transacting(serviceContext.transaction).delete()
      return serviceContext
    })()
    const result = await controller.applyExpand({ data: User.query(), expand: 'profile', whiteList: ['profile'], serviceContext }).fetch()
    const secondResult = await controller.applyExpand({ data: User.query(), expand: 'profile', whiteList: ['profile'], serviceContext: secondServiceContext }).fetch()
    await serviceContext.success()
    await secondServiceContext.success()
    assert.isArray(result.rows)
    assert.isArray(secondResult.rows)
    assert.isDefined(result.rows[0].$relations.profile)
    assert.isDefined(secondResult.rows[0].$relations.profile)
    assert.exists(result.rows[0].$relations.profile)
    assert.notExists(secondResult.rows[0].$relations.profile)
  })

  test('verifyServiceResponse should return data', async assert => {
    const { ServiceResponse } = use('Conceptho/Services')
    const Controller = use('App/Controllers/Controller')
    const controller = new Controller()
    const result = await controller.verifyServiceResponse({ serviceResponse: new ServiceResponse({ data: { working: true } }) })
    assert.deepEqual(result, { working: true })
  })

  test('verifyServiceResponse should return a exception with status 500', async assert => {
    assert.plan(1)
    const Controller = use('App/Controllers/Controller')
    const controller = new Controller()
    try {
      await controller.verifyServiceResponse({ serviceResponse: { working: false } })
    } catch (e) {
      const { code } = e
      assert.equal(code, 500)
    }
  })

  test('verifyServiceResponse should return a exception with status 400', async assert => {
    assert.plan(1)
    const { ServiceResponse } = use('Conceptho/Services')
    const Controller = use('App/Controllers/Controller')
    const controller = new Controller()
    try {
      await controller.verifyServiceResponse({ serviceResponse: new ServiceResponse({ error: { name: 'VALIDATION_EXCEPTION' } }) })
    } catch (e) {
      const { code } = e
      assert.equal(code, 400)
    }
  })
})
