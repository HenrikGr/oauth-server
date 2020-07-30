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
const debugService = require('@hgc-ab/debug-service')('middleware')

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
 * Expose authorize middleware
 */
exports = module.exports = authorize

/**
 * Authorizes an access token request
 *
 * The authorization endpoint is used to interact with the resource
 * owner and obtain an authorization grant. The authorization server
 * MUST first verify the identity of the resource owner.
 *
 * By default it verifies the resource owner via a Bearer access token
 *
 * In order to use session to verify the identity of the resource owner
 * a custom authenticationHandler can be used by override the options ket
 * authenticationHandler.
 *
 * The custom authenticateHandler must implement a method called execute
 *
 * @example
 * options.authenticateHandler = {
 *   execute: function(request, response) {
 *     return request.session.user
 *   }
 * }
 *
 * @public
 * @param {Object} options Optional settings
 * @param {Object} options.authenticateHandler Custom authentication handler
 * @param {Boolean} options.allowEmptyState Allow clients to specify an empty state
 * @param {Number} options.authorizationCodeLifetime Lifetime of authorization codes in seconds
 * @param {Number} options.accessTokenLifetime Lifetime of implicit grant access token in seconds
 */
function authorize(options = {}) {
  return async function authorizeHandler(req, res) {
    debugService('authorizeHandler: started with options: ', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.authorize(request, response, options)
      debugService('authorizeHandler: ended gracefully')
      return res.status(response.status).set(response.headers).end()
    } catch (e) {
      debugService('authorizeHandler: ', e.name, e.message)
      return res.status(response.status).set(response.headers).json(response.body).end()
    }
  }
}
