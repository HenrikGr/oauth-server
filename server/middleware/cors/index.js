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

  app.use(cors())
}
