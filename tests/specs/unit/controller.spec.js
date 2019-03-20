require('@adonisjs/lucid/lib/iocResolver').setFold(require('@adonisjs/fold'))

const helpers = require('../../helpers')
const test = require('japa')

const { setupResolver } = require('@adonisjs/sink')
const { ioc } = require('@adonisjs/fold')

const controllerMock = require('../../mock/classes/Controller')

test.group('controller', group => {
  group.before(async () => {
    setupResolver()
    helpers.initializeIoc(ioc)
  })

  test('should have applyExpand defined', assert => {
    const controller = new (controllerMock(ioc))()

    assert.isDefined(controller.applyExpand)
  })

  test('should have verifyServiceResponse defined', assert => {
    const controller = new (controllerMock(ioc))()

    assert.isDefined(controller.verifyServiceResponse)
  })
})
