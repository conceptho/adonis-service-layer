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
class MakeModel extends BaseCommand {
  /**
   * The command signature
   *
   * @method signature
   *
   * @return {String}
   */
  static get signature () {
    return `
    conceptho:model
    { name: Name of the model }
    { -c, --controller: Generate resourceful controller for the model }
    { -s, --service: Generate service for the model }
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
  async handle ({ name }, { service, controller }) {
    await this.invoke(async () => {
      await this.ensureInProjectRoot()
      await this.generateBlueprint('model', name, {})

      if (controller) {
        await this.generateBlueprint('httpController', name, { resource: controller })
      }

      if (service) {
        await this.generateBlueprint('service', name, {})
      }
    })
  }
}

module.exports = MakeModel
