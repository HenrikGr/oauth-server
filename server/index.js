/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { token, authorize, authenticate } = require('./oAuthServer')
const router = require('express').Router()

/**
 * Set up routes and connect the router with express
 * @param app
 * @param appConfig
 */
module.exports = function(app, appConfig) {
  const { oAuthConfig } = appConfig
  const { endpoints, tokenOptions, authorizeOptions } = oAuthConfig

  router.route(endpoints.token).post(token(tokenOptions))

  router
    .route(endpoints.authorize)
    .get(authorize(authorizeOptions))
    .post(authorize(authorizeOptions))

  app.use(oAuthConfig.endpoints.root, router)
}
