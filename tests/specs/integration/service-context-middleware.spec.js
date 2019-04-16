const test = require('japa')
const supertest = require('supertest')
const Route = require('@adonisjs/framework/src/Route/Manager')

const { ioc } = require('@adonisjs/fold')

test.group('service context', group => {
  group.before(() => {
    ioc.restore()

    const { Model } = use('Conceptho/Models')
    ioc.fake('App/Models/User', () => class User extends Model { })

    const server = use('Server')

    server.registerNamed({ service: 'Conceptho/Middlewares/UseServiceContext' })
    server.listen('localhost', 3333)
  })

  group.after(() => {
    use('Server').close()
  })

  group.afterEach(() => {
  })

  test('service context should call hooks', async assert => {
    let errorCalled = false
    let successCalled = false

    Route.get('/1', ({ response, serviceCtx }) => {
      serviceCtx.onError(() => { errorCalled = true; return true })
      serviceCtx.onSuccess(() => { successCalled = true; return true })

      return response.status(400).send('oops')
    }).middleware('service')

    await supertest('http://localhost:3333').get('/1')

    assert.isTrue(errorCalled)
    assert.isFalse(successCalled)

    errorCalled = false
    successCalled = false

    Route.get('/2', ({ response, serviceCtx }) => {
      serviceCtx.onError(() => { errorCalled = true; return true })
      serviceCtx.onSuccess(() => { successCalled = true; return true })

      return response.status(200).send('ok')
    }).middleware('service')

    await supertest('http://localhost:3333').get('/2')

    assert.isFalse(errorCalled)
    assert.isTrue(successCalled)
  })

  test('should commit transaction on success', async assert => {
    const User = use('App/Models/User')

    Route.get('/3', async ({ response, serviceCtx }) => {
      await User.create({ email: 'aprias' }, serviceCtx.transaction)
      return response.status(200).send('ok')
    }).middleware('service')

    await supertest('http://localhost:3333').get('/3')
    assert.isNotNull(await User.query().where({ email: 'aprias' }).first())
  })

  test('should rollback transaction on error', async assert => {
    const User = use('App/Models/User')

    Route.get('/4', async ({ response, serviceCtx }) => {
      await User.create({ email: '111' }, serviceCtx.transaction)
      return response.status(400).send('oops')
    }).middleware('service')

    await supertest('http://localhost:3333').get('/4')
    assert.isNull(await User.query().where({ email: '111' }).first())
  })
})
