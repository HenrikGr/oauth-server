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
 * Expose token middleware
 */
exports = module.exports = token

/**
 * Retrieves a new token for an authorized token request
 *
 * @param {Object} options Optional settings
 * @param {Number} options.accessTokenLifeTime Lifetime of access tokens in seconds
 * @param {Number} options.refreshTokenLifetime Lifetime of refresh tokens in seconds
 * @param {Object} options.requireClientAuthentication Require a client secret
 * @param {Boolean} options.alwaysIssueNewRefreshToken Always isse a new refresh token
 * @param {Object} options.extendedGrantTypes Use extended grant types
 */
function token(options = {}) {
  return async function tokenHandler(req, res) {
    const request = new Request(req)
    const response = new Response(res)

    try {
      log('tokenHandler: started with options: ', options)
      await oAuth2Server.token(request, response, options)
      log('tokenHandler: ended gracefully')
      return res.set(response.headers).status(response.status).json(response.body)
    } catch (e) {
      error('tokenHandler:', e.name, e.message)
      return res.set(response.headers).status(response.status).json(response.body)
    }
  }
}