/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */
const cors = require('cors')

/**
 * Load cors to express
 * @param app
 * @param appConfig
 */
module.exports = function(app, appConfig) {
  const { oAuthConfig } = appConfig
  const { corsConfig } = oAuthConfig
  /**
   * Enable pre-flight options for the app.
   */
  app.options('*', cors()) // include before other routes
  /**
   * Set cors configuration for the oauth
   */
  app.use(cors(corsConfig))
}
