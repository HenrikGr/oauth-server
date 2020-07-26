/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const OAuth2Server = require('@hgc-ab/oauth-service')
const { Request, Response } = OAuth2Server

const model = require('./database/model')
const oAuth2Server = new OAuth2Server(model)

exports = module.exports = oAuth2Server
exports.Request = Request
exports.Response = Response
