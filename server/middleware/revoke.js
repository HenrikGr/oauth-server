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
const { log, error} = require('@hgc-ab/debug-service')('middleware')

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
    log('revokeHandler: started with options: ', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.revoke(request, response, options)
      log('revokeHandler: ended gracefully')
      return res.status(response.status).set(response.headers).end()
    } catch (e) {
      error('revokeHandler:', e.name, e.message)
      return res.status(response.status).set(response.headers).json(response.body).end()
    }
  }
}
