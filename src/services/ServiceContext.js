const { isFunction } = require('lodash')

module.exports = Database =>
  class ServiceContext {
    constructor ({ ctx }) {
      this.ctx = ctx
      this._successHooks = []
      this._errorHooks = []
      this._endHooks = []
      this.isFinished = false
    }

    async init () {
      this.transaction = await Database.beginTransaction()
    }

    onSuccess (callback) {
      this._successHooks.push(callback)
    }

    onError (callback) {
      this._errorHooks.push(callback)
    }

    onEnd (callback) {
      this._endHooks.push(callback)
    }

    async end () {
      const { transaction: trx, ctx, isFinished } = this

      if (isFinished) {
        throw new Error('ServiceContext already finished.')
      } else {
        await Promise.all(this._endHooks.map(value => isFunction(value) ? value({ trx, ctx }) : null))
        this.isFinished = true
      }
    }

    async success () {
      const { transaction: trx, ctx } = this

      await this.end()
      await Promise.all(this._successHooks.map(value => isFunction(value) ? value({ trx, ctx }) : null))
      if (this.transaction) {
        await this.transaction.commit()
      }
    }

    async error () {
      const { transaction: trx, ctx } = this

      await this.end()
      await Promise.all(this._errorHooks.map(value => isFunction(value) ? value({ trx, ctx }) : null))

      if (this.transaction) {
        await this.transaction.rollback()
      }
    }
  }
