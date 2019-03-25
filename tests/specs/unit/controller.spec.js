require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))

const helpers = require('../../helpers')
const test = require('japa')

const { ioc } = require('@adonisjs/fold')

test.group('controller', group => {
  group.before(async () => {
    this.ioc = await helpers.setup(ioc)
    this.classMocker = require('../../mock/classes')(this.ioc)

    const { Model } = this.classMocker

    this.ioc.fake('App/Models/User', () =>
      class User extends Model {
        profile () {
          return this.hasOne('App/Models/Profile')
        }
      })

    this.ioc.fake('App/Models/Profile', () =>
      class Profile extends Model {
        user () {
          return this.belongsTo('App/Models/User')
        }
      })
  })

  group.beforeEach(async () => {
    const user = await this.ioc.use('App/Models/User').create({ email: '132', password: '132' })
    await this.ioc.use('App/Models/Profile').create({ user_id: user.id })
  })

  group.afterEach(async () => {
    await this.ioc.use('Database').truncate('profiles')
    await this.ioc.use('Database').truncate('users')
  })

  group.after(async () => {
    await this.ioc.use('Database').close()
    await helpers.cleanupTempDir()
  })

  test('should have applyExpand defined', assert => {
    const controller = new this.classMocker.Controller()

    assert.isDefined(controller.applyExpand)
  })

  test('should have verifyServiceResponse defined', assert => {
    const controller = new this.classMocker.Controller()

    assert.isDefined(controller.verifyServiceResponse)
  })

  test('applyExpand should handle a Model instance', async assert => {
    const { Controller } = this.classMocker

    const User = this.ioc.use('App/Models/User')

    const user = await User.first()
    const controller = new Controller()

    await controller.applyExpand({ data: user, expand: 'profile', whiteList: ['profile'] })
    assert.isDefined(user.$relations.profile)
  })

  test('applyExpand should not load property if it is listed on a blackList', async assert => {
    const { Controller } = this.classMocker

    const User = this.ioc.use('App/Models/User')

    const controller = new Controller()
    const user = await User.first()

    await controller.applyExpand({ data: user, expand: 'profile', blackList: ['profile'] })
    assert.strictEqual(user.$relations.profile, undefined)
  })

  test('applyExpand blackList should prevail if a property is also listed on a whiteList ', async assert => {
    const { Controller } = this.classMocker

    const User = this.ioc.use('App/Models/User')

    const controller = new Controller()
    const user = await User.first()

    await controller.applyExpand({ data: user, expand: 'profile', blackList: ['profile'], whilteList: ['profile'] })
    assert.strictEqual(user.$relations.profile, undefined)
  })

  test('applyExpand should handle a QueryBuilder instance', async assert => {
    const { Controller } = this.classMocker

    const User = this.ioc.use('App/Models/User')

    const controller = new Controller()
    const result = await controller.applyExpand({ data: User.query(), expand: 'profile', whilteList: ['profile'] })

    assert.isArray(result.rows)
  })
})
