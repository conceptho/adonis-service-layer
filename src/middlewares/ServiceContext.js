
module.exports = Database => {
  const ServiceContext = require('../services/ServiceContext')(Database)

  class TransactionUsage {
    async handle (ctx, next) {
      const { response } = ctx

      const serviceContext = new ServiceContext({ ctx })
      await serviceContext.init()

      ctx.serviceContext = serviceContext
      ctx.trx = serviceContext.transaction

      await next()

      if (response.response.statusCode >= 400) {
        await serviceContext.error()
      } else {
        await serviceContext.success()
      }
    }
  }

  return new TransactionUsage()
}
