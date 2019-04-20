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
 * Make a new HTTP or Ws controller
 *
 * @class MakeController
 * @constructor
 */
class MakeController extends BaseCommand {
  /**
   * The command signature
   *
   * @method signature
   *
   * @return {String}
   */
  static get signature () {
    return `
    conceptho:controller
    { name: Name of the controller }
    { --resource: Create resourceful methods on the controller }
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
    return 'Make a new HTTP or Websocket channel controller'
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
  async handle ({ name }, { type, resource }) {
    await this.invoke(async () => {
      await this.ensureInProjectRoot()
      const resourceType = 'httpController'
      await this.generateBlueprint(resourceType, name, { resource })
    })
  }
}

module.exports = MakeController
