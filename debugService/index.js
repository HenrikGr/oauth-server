/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Debug service
 * @type {(function(String): *)|*}
 */
const debug = require('debug')
const config = require('../config')

if (config.debug) {
  require('debug').enable(`${config.appName}:*`)
}


/**
 * Debug services that writes to console when
 * DEBUG environment variable is set
 * @param {String} serviceName - name of the service
 * @returns {*}
 */
function debugService(serviceName) {
  return debug(`${config.appName}:${serviceName}`)
}

module.exports = debugService
