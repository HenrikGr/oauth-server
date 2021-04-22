/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('/oauth2-server:middleware:statusHandler')

/**
 * Expose status middleware
 */
exports = module.exports = status

/**
 * Handle app status
 * @param options Optional settings
 * @param {Boolean} options.isClientSecretRequired Is client secret required
 * @return {(function(*, *, *): Promise<void>)|*}
 */
function status(options = {}) {
  return async function statusHandler(req, res, next) {
    logger.info('started with options: ', options)
    res.status(200).json({ status: 'ok'}).end()
  }
}
