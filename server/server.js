/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const Server = require('oauth2-server')
const { Request, Response } = Server
const model = require('./model')


const oAuth2Server = new Server({ model })
console.log('new instance')

module.exports = {
  oAuth2Server,
  Request,
  Response
}