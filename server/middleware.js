/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const debugService = require('@hgc-ab/debug-service')('middleware')
const oAuth2Server = require('./server')
const { Request, Response } = oAuth2Server


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
function authenticate(options = {}) {
  return async function authenticationHandler(req, res, next) {
    debugService('authenticate: started')
    const request = new Request(req)
    const response = new Response(res)
    debugService('authenticate: ', options)
    try {
      let token = await oAuth2Server.authenticate(request, response, options)
      // Attach the token to the request object
      Object.assign(req, { token: token })
      debugService('authenticate: ended gracefully')
      next()
    } catch (e) {
      debugService('authenticate:', e.name, e.message)
      return res
        .status(response.status)
        .json(response.body)
        .end()
    }
  }
}

/**
 * Authorizes an authorized code or implicit token
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
 * @param {Object} options - authorize handler options
 * @param {Boolean} options.allowEmptyState - Allow clients to specify an empty state
 * @param {Number} options.authorizationCodeLifetime - Lifetime of authorization codes in seconds
 * @param {Number} options.accessTokenLifetime - Lifetime of implicit grant access token in seconds
 * @returns {Function}
 */
function authorize(options = {}) {
  return async function authorizeHandler(req, res) {
    debugService('authorize: started')
    const request = new Request(req)
    const response = new Response(res)

    try {
      // noinspection JSUnresolvedFunction
      await oAuth2Server.authorize(request, response, options)
      debugService('authorize: ended gracefully')
      return res
        .status(response.status)
        .set(response.headers)
        .end()
    } catch (e) {
      debugService('authorize: ', e.name, e.message)
      return res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()
    }
  }
}

/**
 * Retrieves a new token for an authorized token request
 *
 * @param {Object} options - token handler options
 * @param {Number} options.accessTokenLifeTime - Lifetime of access tokens in seconds
 * @param {Number} options.refreshTokenLifetime - Lifetime of refresh tokens in seconds
 * @param {Object} options.requireClientAuthentication - Require a client secret
 * @returns {Function}
 * @throws {Error}
 */
function token(options = {}) {
  return async function tokenHandler(req, res) {
    debugService('token: started', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.token(request, response, options)
      debugService('token: ended gracefully')
      return res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()
    } catch (e) {
      debugService('token:', e.name, e.message)
      return res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()
    }
  }
}


/**
 * Introspect a token status
 *
 * @param options
 * @returns {Function}
 */
function introspect(options = {}) {
  return async function introspectionHandler(req, res, next) {
    debugService('introspect: started')
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.introspect(request, response, options)
      debugService('introspect: ended gracefully')
      return res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()

    } catch (e) {
      debugService('introspect:', e.name, e.message, response.status)
      return res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()
    }
  }
}

/**
 * Revoke a token
 * @param options
 * @return {Function}
 */
function revoke(options = {}) {
  return async function revokeHandler(req, res, next) {
    debugService('revoke: started')
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.revoke(request, response, options)
      debugService('revoke: ended gracefully')
      res
        .status(response.status)
        .set(response.headers)
        .end()

    } catch (e) {
      debugService('revoke:', e.name, e.message)
      res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()
    }
  }
}


module.exports = {
  authenticate,
  authorize,
  token,
  introspect,
  revoke
}
