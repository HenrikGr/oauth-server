/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { token, authorize, authenticate } = require('../handlers')
const router = require('express').Router()

module.exports = function(app, oAuthConfig) {
  router.route(oAuthConfig.endpoints.token).post(token(oAuthConfig.tokenOptions))

  router
    .route(oAuthConfig.endpoints.authorize)
    .get(authorize(oAuthConfig.authorizeOptions))
    .post(authorize(oAuthConfig.authorizeOptions))

  app.use(oAuthConfig.endpoints.root, router)
}
