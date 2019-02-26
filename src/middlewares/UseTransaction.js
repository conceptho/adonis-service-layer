const Database = use('Database');

class UseTransaction {
  async handle(ctx, next) {
    ctx.trx = await Database.beginTransaction();

    await next();

    const { response: { response: { statusCode } },
      trx } = ctx;

    if (statusCode >= 400) {
      await trx.rollback();
    } else {
      await trx.commit();
    }
  }
}

module.exports = UseTransaction;
