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
const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('/oauth2-server:middleware:revokeHandlerHandler')

/**
 * Module dependency
 * @private
 */
const oAuth2Server = require('../server')

/**
 * Module dependency
 * @private
 */
const { Request, Response } = oAuth2Server

/**
 * Expose revoke middleware
 */
exports = module.exports = revoke

/**
 * Revoke a token
 *
 * @param {Object} options Optional settings
 * @param {Boolean} options.isClientSecretRequired Is client secret required
 */
function revoke(options = {}) {
  return async function revokeHandler(req, res, next) {
    logger.info('started with options: ', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.revoke(request, response, options)
      logger.info('ended gracefully')
      res.set(response.headers).status(response.status).json(null).end()
    } catch (e) {
      logger.error(e.name, e.message)
      res.set(response.headers).status(response.status).json(null).end()
    }
  }
}
