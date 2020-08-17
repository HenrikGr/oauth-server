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
 * @public
 * @param {Object} options Optional settings
 * @param {Boolean} options.addAcceptedScopesHeader Add accepted scope in header
 * @param {Boolean} options.addAuthorizedScopesHeader Add authorized scopes in header
 * @param {Boolean} options.allowBearerTokensInQueryString Allow bearer token in query string
 */
function authenticate(options = {}) {
  return async function authenticateHandler(req, res, next) {
    log('authenticateHandler: started with options: ', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      const token = await oAuth2Server.authenticate(request, response, options)
      /**
       * Set updated response headers
       */
      res.set(response.headers)
      Object.assign(req, { token: token })
      log('authenticateHandler: ended gracefully')
      next()
    } catch (e) {
      error('authenticateHandler:', e.name, e.message)
      return res.set(response.headers).status(response.status).json(response.body)
    }
  }
}
