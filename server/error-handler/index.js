/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { NotFound, InternalServerError } = require('./errors')

module.exports = function(app) {

  /**
   * Error handler to catch system errors
   * Call next if there are an 404 errors
   */
  app.use((err, req, res, next) => {
    // No api handled the request and no system errors, that means 404 issue.
    if (!err) return next()

    // Internal system errors
    const error = new InternalServerError(err.message)
    return res.status(error.status || 500).json(error)
  })

  /**
   * Error handler for 404 errors
   */
  app.use('*', (req, res) => {
    const error = new NotFound('Resource not found')
    return res.status(error.status).json(error)
  })
}
