const test = require('japa')

const { ioc } = require('@adonisjs/fold')

test.group('service provider', group => {
  group.before(async () => {
    ioc.restore()

    ioc.fake('Conceptho/ServiceProvider', () =>
      require('../../../src/providers/ServiceLayerProvider')
    )
  })

  test.failing('a', assert => {
    assert.fail()
  })
})
