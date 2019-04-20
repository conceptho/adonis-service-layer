'use strict'

/*
 * @conceptho/adonis-service-layer
 *
 * (c) Jordão Rosario <jordao.rosario@conceptho.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const BaseCommand = require('./Base')

/**
 * Make a new lucid model
 *
 * @class MakeModel
 * @constructor
 */
class MakeService extends BaseCommand {
  /**
   * The command signature
   *
   * @method signature
   *
   * @return {String}
   */
  static get signature () {
    return `
    conceptho:service
    { name: Name of the Service }
    { -mn?=@value, --modelName?=@value: Name of the model for this Service }
    `
  }

  /**
   * The command description
   *
   * @method description
   *
   * @return {String}
   */
  static get description () {
    return 'Make a new lucid model'
  }

  /**
   * Handle method executed by ace
   *
   * @method handle
   *
   * @param  {String} options.name
   * @param  {String} options.type
   *
   * @return {void}
   */
  async handle ({ name }, { modelName }) {
    await this.invoke(async () => {
      await this.ensureInProjectRoot()
      await this.generateBlueprint('service', name, { modelName })
    })
  }
}

module.exports = MakeService
