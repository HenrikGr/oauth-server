/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const Server = require('oauth2-server')
const { Request, Response } = Server
const model = require('./model')

// noinspection JSCheckFunctionSignatures
/**
 *
 * @type {OAuth2Server}
 */
const oAuth2Server = new Server({ model: model })

/**
 * Token handler for the token endpoint
 */
function token(options) {
  return async function tokenHandler(req, res) {
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.token(request, response, options)

      res
        .status(200)
        .set(response.headers)
        .json(response.body)
        .end()
    } catch (err) {
      res
        .status(err.status)
        .json(err)
        .end()
    }
  }
}

/**
 * Authorize handler function
 */
function authorize(options) {
  return async function authorizeHandler(req, res) {
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.authorize(request, response, options)

      res
        .status(response.status)
        .set(response.headers)
        .end()
    } catch (err) {
      res
        .status(err.status)
        .json(err)
        .end()
    }
  }
}

/**
 * Authenticate middleware function
 */
function authenticate(options) {
  return async function authenticationHandler(req, res, next) {
    const request = new Request(req)
    const response = new Response(res)

    try {
      let token1 = await oAuth2Server.authenticate(request, response, options)

      Object.assign(req, { token: token1 })
      next()
    } catch (err) {
      res
        .status(err.status)
        .json(err)
        .end()
    }
  }
}


module.exports = {
  token,
  authorize,
  authenticate
}
