'use strict'

/*
 * @conceptho/adonis-service-layer
 *
 * (c) Jordão Rosario <jordao.rosario@conceptho.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const _ = require('lodash')
const pluralize = require('pluralize')
const generators = exports = module.exports = {}

generators.model = {
  /**
   * Returns data object for the model
   * template file
   *
   * @method getData
   *
   * @param  {String} name
   *
   * @return {Object}
   */
  getData (name) {
    return {
      name: this.getFileName(name)
    }
  },

  /**
   * Returns the model file name
   *
   * @method getFileName
   *
   * @param  {String}    name
   *
   * @return {String}
   */
  getFileName (name, appPath) {
    name = name.replace(/model/ig, '')
    return `${pluralize.singular(_.upperFirst(_.camelCase(name)))}`
  },

  /**
   * Returns file path to the model file
   *
   * @method getFilePath
   *
   * @param  {String}    name
   * @param  {Object}    options
   *
   * @return {String}
   */
  getFilePath (name, options) {
    const baseName = path.basename(name)
    const normalizedName = name.replace(baseName, this.getFileName(baseName))
    return path.join(options.appRoot, options.appDir, options.dirs.models, normalizedName) + '.js'
  }
}

generators.service = {
  /**
   * Returns data object for the service
   * template file
   *
   * @method getData
   *
   * @param  {String} name
   * @param  {Object} flags
   * @param  {Object} options
   *
   * @return {Object}
   */
  getData (name, flags) {
    return {
      name: this.getFileName(name),
      modelName: flags.modelName || name
    }
  },

  /**
   * Returns the model file name
   *
   * @method getFileName
   *
   * @param  {String}    name
   *
   * @return {String}
   */
  getFileName (name, appPath) {
    name = name.replace(/service/ig, '')
    return `${pluralize.singular(_.upperFirst(_.camelCase(name)))}`
  },

  /**
   * Returns file path to the model file
   *
   * @method getFilePath
   *
   * @param  {String}    name
   * @param  {Object}    options
   *
   * @return {String}
   */
  getFilePath (name, options) {
    const baseName = path.basename(name)
    const normalizedName = name.replace(baseName, this.getFileName(baseName))
    return path.join(options.appRoot, options.appDir, options.dirs.models, normalizedName) + '.js'
  }
}

generators.httpController = {
  /**
   * Returns the data to be sent to the controller
   * template
   *
   * @method getData
   *
   * @param  {String} name
   * @param  {Object} flags
   *
   * @return {Object}
   */
  getData (name, flags) {
    return {
      name: this.getFileName(name),
      resource: !!flags.resource,
      resourceName: this.getResourceName(name),
      resourceNamePlural: pluralize(this.getResourceName(name))
    }
  },

  /**
   * Returns file name for controller.
   *
   * @method getFileName
   *
   * @param  {String}    name
   *
   * @return {String}
   */
  getFileName (name) {
    name = name.replace(/controller/ig, '')
    return `${pluralize.singular(_.upperFirst(_.camelCase(name)))}Controller`
  },

  /**
   * Returns name of resource from controller name.
   *
   * @method getResourceName
   *
   * @param  {String}    name
   *
   * @return {String}
   */
  getResourceName (name) {
    return this.getFileName(name).replace('Controller', '').toLowerCase()
  },

  /**
   * Returns path to the controller file
   *
   * @method getFilePath
   *
   * @param  {String}    name
   * @param  {Object}    options
   *
   * @return {String}
   */
  getFilePath (name, options) {
    const baseName = path.basename(name)
    const normalizedName = name.replace(baseName, this.getFileName(baseName))
    return path.join(options.appRoot, options.appDir, options.dirs.httpControllers, normalizedName) + '.js'
  }
}
