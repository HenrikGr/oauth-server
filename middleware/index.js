/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */
const debugService = require('@hgc-ab/debug-service')('http')

/**
 * Load middleware to express
 * @param app
 * @param appConfig
 */
module.exports = function(app, appConfig) {

  // Debug incoming request
  app.use((req, res, next) => {
    debugService(req.protocol + '://' + req.get('host') + req.originalUrl)
    next()
  })

  require('./helmet')(app, appConfig)
  require('./cors')(app, appConfig)
  require('./body-parser')(app, appConfig)
}
