const test = require('japa')

const { ioc } = require('@adonisjs/fold')
const { pick, range } = require('lodash')

test.group('base schema', group => {
  group.before(async () => {
    ioc.restore()

    const Schema = use('Conceptho/Schema')

    ioc.bind('Migrations/UserProfilesSchema', () => (
      class UserProfileSchema extends Schema {
        async up () {
          return this.createPivotTable('user_profiles', 'users', 'profiles')
        }

        async down () {
          await this.dropTable('user_profiles')
        }
      }
    ))
  })

  test('the up command should be runned successfuly', async assert => {
    assert.plan(2)
    const UserProfileSchema = use('Migrations/UserProfilesSchema')
    const Migration = use('Adonis/Src/Migration')
    try {
      await Migration.up({ UserProfileSchema })
      assert.isTrue(true)
      await use('Database').table('user_profiles').select('*')
      assert.isTrue(true)
    } catch (e) {
    }
  }).timeout(5000)

  test('the down command should be runned successfuly', async assert => {
    assert.plan(2)
    const UserProfileSchema = use('Migrations/UserProfilesSchema')
    const Migration = use('Adonis/Src/Migration')
    try {
      await Migration.down({ UserProfileSchema })
      assert.isTrue(true)
      await use('Database').table('user_profiles').select('*')
    } catch (e) {
      assert.isTrue(true)
    }
  }).timeout(5000)

  group.afterEach(async () => {
    // await use('Database').raw('drop table if exists user_profiles')
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
})
