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
    await use('Database').raw(`truncate "profiles" , "users" restart identity`)
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

    await controller.applyExpand({ data: user, expand: 'profile', blackList: ['profile'], whilteList: ['profile'] })
    assert.strictEqual(user.$relations.profile, undefined)
  })

  test('applyExpand should handle a QueryBuilder instance', async assert => {
    const Controller = use('App/Controllers/Controller')
    const User = use('App/Models/User')

    const controller = new Controller()
    const result = await controller.applyExpand({ data: User.query(), expand: 'profile', whilteList: ['profile'] })

    assert.isArray(result.rows)
  })
})
