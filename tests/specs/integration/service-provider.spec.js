const test = require('japa')

test.group('service provider', group => {
  test('Conceptho/Models', assert => {
    const { Model } = use('Conceptho/Models')

    assert.isDefined(Model)
  })

  test('Conceptho/Exceptions', assert => {
    const { HttpCodeException, ServiceException } = use('Conceptho/Exceptions')

    assert.isDefined(HttpCodeException)
    assert.isDefined(ServiceException)
  })

  test('Conceptho/Services', assert => {
    const { Service, ServiceResponse } = use('Conceptho/Services')

    assert.isDefined(Service)
    assert.isDefined(ServiceResponse)
  })

  test('Conceptho/Serializers', assert => {
    const { DefaultSerializer } = use('Conceptho/Serializers')

    assert.isDefined(DefaultSerializer)
  })

  test('Conceptho/Controllers', assert => {
    const { Controller } = use('Conceptho/Controllers')

    assert.isDefined(Controller)
  })

  test('Conceptho/Middlewares', assert => {
    const HeaderPagination = use('Conceptho/Middlewares/HeaderPagination')

    assert.isDefined(HeaderPagination)
  })
})
