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
const { log, error } = require('@hgc-ab/debug-service')('middleware')

/**
 * Module dependency
 * @private
 */
const oAuth2Server = require('../server')

/**
 * Module dependency
 * @private
 */
const { Request, Response } = oAuth2Server

/**
 * Expose introspect middleware
 */
exports = module.exports = introspect

/**
 * Introspect a token status
 *
 * @param {Object} options Optional settings
 * @param {Boolean} options.isClientSecretRequired Is client secret required
 */
function introspect(options = {}) {
  return async function introspectHandler(req, res, next) {
    log('introspectHandler: started with options: ', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.introspect(request, response, options)
      log('introspectHandler: ended gracefully')
      return res.set(response.headers).status(response.status).json(response.body)
    } catch (e) {
      error('introspectHandler:', e.name, e.message, response.status)
      return res.set(response.headers).status(response.status).json(response.body)
    }
  }
}