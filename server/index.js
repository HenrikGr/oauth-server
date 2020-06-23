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

  router.route(endpoints.authenticate).post(authenticate({scope: 'admin'}), (req, res) => {
    console.log('Authenticate success: ', req.token)
    res
      .status(300).json(req.token).end()
  })

  app.use(oAuthConfig.endpoints.root, router)
}
