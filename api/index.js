/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { authenticate } = require('../server/middleware')
const router = require('express').Router()

/**
 * Set up routes to resource server api endpoints using the
 * authentication middleware to authenticate access tokens retrieved
 * by the authorization server
 *
 * @param app
 * @param appConfig
 */
module.exports = function(app, appConfig) {
  const { apiConfig } = appConfig

  router.route(apiConfig.info.uri).all(authenticate({scope: apiConfig.info.scope}), (req, res) => {
    res.status(200).json({ access: 'OK'}).end()
  })


  app.use(apiConfig.root, router)
}
