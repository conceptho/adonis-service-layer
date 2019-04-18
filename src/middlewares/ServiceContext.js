
module.exports = Database => {
  const ServiceContext = require('../services/ServiceContext')(Database)

  class TransactionUsage {
    async handle (ctx, next) {
      const { response } = ctx

      const serviceCtx = new ServiceContext({ ctx })
      await serviceCtx.init()

      ctx.serviceCtx = serviceCtx
      ctx.trx = serviceCtx.transaction

      await next()

      if (response.response.statusCode >= 400) {
        await serviceCtx.error()
      } else {
        await serviceCtx.success()
      }
    }
  }

  return new TransactionUsage()
}
