/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class FinalizeTransaction {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle(ctx, next) {
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

module.exports = FinalizeTransaction;
