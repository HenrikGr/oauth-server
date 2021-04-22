/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('/oauth2-server:middleware:introspectionHandler')
const oAuth2Server = require('../server')
const { Request, Response } = oAuth2Server

/**
 * Expose introspect middleware
 */
exports = module.exports = introspect

/**
 * Introspect a token status
 * @param options
 * @param {boolean} options.isClientSecretRequired Is client secret required
 * @return {(function(*=, *=, *): Promise<void>)|*}
 */
function introspect(options = {}) {
  return async function introspectHandler(req, res, next) {
    logger.info('started with options: ', options)
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.introspect(request, response, options)
      logger.info('ended gracefully')
      res.set(response.headers).status(response.status).json(response.body).end()
    } catch (e) {
      logger.error(e.name, e.message)
      res.set(response.headers).status(response.status).json(response.body).end()
    }
  }
}
