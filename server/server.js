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
const OAuth2Server = require('@hgc-ab/oauth-service')

/**
 * Module dependency
 * @public
 */
const { Request, Response } = OAuth2Server

/**
 * Database access model
 * @private
 */
const model = require('../database/model')

/**
 * OAuth 2 Server
 * @ublic
 */
const oAuth2Server = new OAuth2Server(model)

/**
 * Expose OAuth 2 server instance
 */
exports = module.exports = oAuth2Server
exports.Request = Request
exports.Response = Response
