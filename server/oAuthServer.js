/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const debugService = require('@hgc-ab/debug-service')('oauthServer')
const Server = require('oauth2-server')
const { Request, Response } = Server
const model = require('./model')

// noinspection JSCheckFunctionSignatures
/**
 *
 * @type {OAuth2Server}
 */
const oAuth2Server = new Server({ model: model })

/**
 * Retrieves a new token for an authorized token request
 *
 * @param {Object} options - token handler options
 * @param {Number} options.accessTokenLifeTime - Lifetime of access tokens in seconds
 * @param {Number} options.refreshTokenLifetime - Lifetime of refresh tokens in seconds
 * @param {Object} options.requireClientAuthentication - Require a client secret
 * @returns {Function}
 * @throws {OAuthError|Error}
 */
function token(options) {
  return async function tokenHandler(req, res) {
    try {
      const request = new Request(req)
      const response = new Response(res)

      debugService('tokenHandler: Retrieves a new token')
      await oAuth2Server.token(request, response, options)
      debugService('tokenHandler: Token retrieved')

      res
        .status(200)
        .set(response.headers)
        .json(response.body)
        .end()
    } catch (e) {
      debugService('Error retrieving authorized token request', e.name, e.message)
      res
        .status(e.status)
        .json(e)
        .end()
    }
  }
}

/**
 * Authorizes a token request
 *
 * @param {Object} options - authorize handler options
 * @param {Boolean} options.allowEmptyState - Allow clients to specify an empty state
 * @param {Number} options.authorizationCodeLifetime - Lifetime of authorization codes in seconds
 * @param {Number} options.accessTokenLifetime - Lifetime of implicit grant access token in seconds
 * @returns {Function}
 */
function authorize(options) {

  // noinspection JSUndefinedPropertyAssignment
  /**
   * In order to retrieve the user associated with the request,
   * options.authenticateHandler should be supplied.
   *
   * The authenticateHandler has to be an object implementing a
   * handle(request, response) function that returns a user object.
   *
   * @type {{handle: (function(*, *): *)}}
   */
  options.authenticateHandler = {
    handle: function(request, response) {
      return request.session.user
    }
  }

  return async function authorizeHandler(req, res) {
    try {
      const request = new Request(req)
      const response = new Response(res)

      debugService('authorizeHandler: Authorize a token request')
      await oAuth2Server.authorize(request, response, options)
      debugService('authorizeHandler: Token request was authorized')

      res
        .status(response.status)
        .set(response.headers)
        .end()
    } catch (e) {
      debugService('Error authorize a token request: ', e.name, e.message)
      res
        .status(e.status)
        .json(e)
        .end()
    }
  }
}

/**
 * Authenticate a request
 *
 * A middleware function that authenticate a request to an API endpoint
 * On successful authentication it will attach the token on the request object
 * and call next middleware
 *
 * @param {Object} options - options
 * @returns {Function}
 */
function authenticate(options) {
  return async function authenticationHandler(req, res, next) {
    try {
      const request = new Request(req)
      const response = new Response(res)

      debugService('authenticate: Authenticate a request')
      let token = await oAuth2Server.authenticate(request, response, options)
      debugService('authenticate: Request authenticated')

      // Attach the token to the request object
      Object.assign(req, { token: token })
      next()

    } catch (err) {
      res
        .status(err.status)
        .json(err)
        .end()
    }
  }
}


module.exports = {
  token,
  authorize,
  authenticate
}
