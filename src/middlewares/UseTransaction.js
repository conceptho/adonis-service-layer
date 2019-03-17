const Database = use('Database')

class UseTransaction {
  async begin (ctx) {
    ctx.trx = await Database.beginTransaction()
  }

  async finish ({ response: { response: { statusCode } }, trx }) {
    if (statusCode >= 400) {
      await trx.rollback()
    } else {
      await trx.commit()
    }
  }

  async handle (ctx, next) {
    await this.begin(ctx)

    await next()

    await this.finish(ctx)
  }
}

module.exports = UseTransaction
