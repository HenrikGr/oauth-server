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
const logger = createClientLogger('/oauth2-server:middleware:authorizationHandler')

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
 * @param {object} options Optional settings
 * @param {object} options.authenticateHandler Custom authentication handler
 * @param {boolean} options.allowEmptyState Allow clients to specify an empty state
 * @param {number} options.authorizationCodeLifetime Lifetime of authorization codes in seconds
 * @param {number} options.accessTokenLifetime Lifetime of implicit grant access token in seconds
 * @return {(function(*=, *=): Promise<*|undefined>)|*}
 */
function authorize(options = {}) {
  return async function authorizeHandler(req, res) {
    logger.info('started with options: ', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.authorize(request, response, options)
      logger.info('ended gracefully')
      return res.set(response.headers).status(response.status).end()
    } catch (e) {
      logger.error(e.name, e.message)
      return res.set(response.headers).status(response.status).json(response.body).end()
    }
  }
}
