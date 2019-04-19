const DefaultSerializer = require('../serializers/DefaultSerializer')

const { ValidationException } = require('../exceptions/runtime')
const { pick } = require('lodash')

module.exports = (AdonisModel: any, Validator: any) =>
    class Model extends AdonisModel {
        constructor (modelData: any) {
            super()

            if (modelData) {
                this.fill(modelData)
            }
            return this
        }

        static boot () {
            super.boot()

            const ModelHooks = require('../hooks/Model')(Validator)

            this.addHook('beforeSave', ModelHooks.sanitizeHook)
            this.addHook('beforeSave', ModelHooks.updatedAtHook)
        }

        static bootIfNotBooted () {
            if (!this.$bootedBy) {
                this.$bootedBy = []
            }

            if (this.$bootedBy.indexOf(this.name) < 0) {
                this.$bootedBy.push(this.name)

                this.boot()
            }
        }

        /**
         * Filter only records which delted equals zero.
         * @example
         * await User.query().active().fetch()
         * @param {Object} query This models query builder
         */
        static scopeActive (query: any) {
            return query.andWhere({ deleted: 0 })
        }

        /**
         *
         * @param {Object} transaction Knex transaction
         */
        async softDelete (transaction: any) {
            this.deleted = 1
            const affected = await this.save(transaction)

            if (affected) {
                this.freeze()
            }

            return !!affected
        }

        async undelete (transaction: any) {
            this.unfreeze()
            this.deleted = 0

            const affected = await this.save(transaction)
            return !!affected
        }

        static get relations () {
            return []
        }

        static get validationRules () {
            return {}
        }

        static get validationMessages () {
            return {}
        }

        static get sanitizeRules () {
            return {}
        }

        static get Serializer () {
            return DefaultSerializer
        }

        async validate () {
            const { validationRules, validationMessages } = (this.constructor as typeof Model)

            const validation = await (this.isNew
                ? Validator.validateAll(this.$attributes, validationRules, validationMessages)
                : Validator.validateAll(this.dirty, pick(validationRules, Object.keys(this.dirty)), validationMessages))

            if (validation.fails()) {
                return { error: new ValidationException(`Validation failed for ${this.constructor.name}.`, validation.messages()) }
            }

            return { error: null }
        }

        async deleteWithinTransaction (trx: any) {
            /**
             * Executing before hooks
             */
            await (this.constructor as typeof Model).$hooks.before.exec('delete', this)

            const query = (this.constructor as typeof Model).query()

            if (trx) {
                query.transacting(trx)
            }

            const affected = await query
                .where((this.constructor as typeof Model).primaryKey, this.primaryKeyValue)
                .ignoreScopes()
                .delete()

            /**
             * If model was delete then freeze it modifications
             */
            if (affected > 0) {
                this.freeze()
            }

            /**
             * Executing after hooks
             */
            await (this.constructor as typeof Model).$hooks.after.exec('delete', this)
            return !!affected
        }
    }
