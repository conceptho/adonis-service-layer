'use strict'

/*
 * @conceptho/adonis-service-layer
 *
 * (c) Jordão Rosario <jordao.rosario@conceptho.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * Exporting a list of internal commands
 *
 * @type {Array}
 */
module.exports = {
  'conceptho:model': require('./Make/Model'),
  'conceptho:service': require('./Make/Service'),
  'conceptho:controller': require('./Make/Controller')
}
