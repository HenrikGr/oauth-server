/**
 * @prettier
 * @copyright (c) 2021 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { log, error } = require('@hgc-ab/debug-service')('middleware')
const router = require('express').Router()

/**
 * Set up router, endpoints, middleware and attach the router to express
 * @param app
 * @param appConfig
 */
module.exports = function (app, appConfig) {

  router.route('/').all((req, res) => {
    log('status: UP')
    return res.status(200).json({ status: 'UP'})    
  })

  // Status handler
  app.use('/', router)
}
