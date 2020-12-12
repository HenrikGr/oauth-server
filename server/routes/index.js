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
const router = require('express').Router()

/**
 * Module dependency
 * @private
 */
const authorize = require('../middleware/authorize')

/**
 * Module dependency
 * @private
 */
const token = require('../middleware/token')

/**
 * Module dependency
 * @private
 */
const introspect = require('../middleware/introspect')

/**
 * Module dependency
 * @private
 */
const revoke = require('../middleware/revoke')

/**
 * Set up router, endpoints, middleware and attach the router to express
 * @param app
 * @param appConfig
 */
module.exports = function (app, appConfig) {
  const { oAuthConfig } = appConfig
  const { endpoints, tokenOptions, authorizeOptions } = oAuthConfig

  /**
   * Endpoint to request access tokens for an authorized request
   */
  router.route(endpoints.token).post(token(tokenOptions))

  /**
   * Endpoint to authorize a request for an access token
   */
  router
    .route(endpoints.authorize)
    .get(authorize(authorizeOptions))
    .post(authorize(authorizeOptions))

  /**
   * Endpoint to introspect an access token status
   */
  router.route(endpoints.introspect).post(introspect())

  /**
   * Endpoint to revoke token
   */
  router.route(endpoints.revoke).post(revoke())

  // Connect the endpoints to the root endpoint and express.js
  app.use(oAuthConfig.endpoints.root, router)
}
