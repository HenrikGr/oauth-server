/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('/oauth2-server:middleware:authenticationHandler')
const oAuth2Server = require('../server')
const { Request, Response } = oAuth2Server

/**
 * Expose authenticate middleware
 */
exports = module.exports = authenticate

/**
 * Authenticate a request to a protected resource
 *
 * A middleware function that authenticate a request
 * On successful authentication it will attach the token
 * on the request object and call next middleware
 *
 * @param {object} options Optional settings
 * @param {boolean} options.addAcceptedScopesHeader Add accepted scope in header
 * @param {boolean} options.addAuthorizedScopesHeader Add authorized scopes in header
 * @param {boolean} options.allowBearerTokensInQueryString Allow bearer token in query string
 * @return {(function(*=, *=, *): Promise<*|undefined>)|*}
 */
function authenticate(options = {}) {
  return async function authenticateHandler(req, res, next) {
    logger.info('started with options: ', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      const token = await oAuth2Server.authenticate(request, response, options)
      res.set(response.headers)
      Object.assign(req, { token: token })
      logger.info('ended gracefully')
      next()
    } catch (e) {
      logger.error(e.name, e.message)
      return res.set(response.headers).status(response.status).json(response.body).end()
    }
  }
}
