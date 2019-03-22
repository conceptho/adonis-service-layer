require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))

const helpers = require('../../helpers')
const test = require('japa')

const { ioc } = require('@adonisjs/fold')

test.group('controller', group => {
  group.before(async () => {
    this.ioc = await helpers.setup(ioc)
    this.classMocker = require('../../mock/classes')(this.ioc)

    const { Model } = this.classMocker

    this.ioc.fake('App/Models/User', () => class User extends Model {
      profile () {
        return this.hasOne('App/Models/Profile')
      }
    })

    this.ioc.fake('App/Models/Profile', () => class Profile extends Model {
      user () {
        return this.belongsTo('App/Models/User')
      }
    })
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
    const Profile = this.ioc.use('App/Models/Profile')

    let user = await User.create({ email: '132', password: '132' })
    await Profile.create({ user_id: user.id })

    user = await User.first()
    const controller = new Controller()

    await controller.applyExpand({ data: user, expand: 'profile', whiteList: ['profile'] })
    assert.isDefined(user.$relations.profile)
  })

  test.failing('applyExpand should handle a QueryBuilder instance')
})
