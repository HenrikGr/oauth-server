/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Module dependency
 * @private
 */
const { log, error } = require('@hgc-ab/debug-service')('middleware')

/**
 * Expose status middleware
 */
exports = module.exports = status

/**
 * Handle app status
 *
 * @param {Object} options Optional settings
 * @param {Boolean} options.isClientSecretRequired Is client secret required
 */
function status(options = {}) {
  return async function statusHandler(req, res, next) {
    log('statusHandler: started with options: ', options)
    return res.status(200).json({ status: 'ok'})
  }
}
