/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class HeaderPagination {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */

  async handle({ request, response }, next) {
    await next();

    this.paginateOnHeader({
      response,
      request,
    });
  }

  paginateOnHeader({ response }) {
    const { lazyBody: { content: { pages, isOne } } } = response;

    if (pages && !isOne) {
      response.header('X-Pagination-Current-Page', pages.page);
      response.header('X-Pagination-Page-Count', pages.lastPage);
      response.header('X-Pagination-Per-Page', pages.perPage);
      response.header('X-Pagination-Total-Count', pages.total);

      response.lazyBody.content.pages = null;
    }
  }
}

module.exports = HeaderPagination;
