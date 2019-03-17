/**
 * Inserts pagination info in the response header
 */
class HeaderPagination {
  async handle ({ request, response }, next) {
    await next()

    this.paginateOnHeader({
      response,
      request
    })
  }

  paginateOnHeader ({ response }) {
    const { lazyBody: { content: { pages, isOne } } } = response

    if (pages && !isOne) {
      response.header('X-Pagination-Current-Page', pages.page)
      response.header('X-Pagination-Page-Count', pages.lastPage)
      response.header('X-Pagination-Per-Page', pages.perPage)
      response.header('X-Pagination-Total-Count', pages.total)

      response.lazyBody.content.pages = null
    }
  }
}

module.exports = HeaderPagination
