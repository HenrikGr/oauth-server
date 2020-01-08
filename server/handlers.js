/*
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const { oAuth2Server, Request, Response } = require('./index')


function token(options) {
  return function tokenHandler(req, res) {
    const request = new Request(req)
    const response = new Response(res)

    return oAuth2Server
      .token(request, response, options)
      .then(() => {
        res
          .status(200)
          .set(response.headers)
          .json(response.body)
          .end()
      })
      .catch(err => {
        res
          .status(err.status)
          .json(err)
          .end()
      })
  }
}

function authorize(options) {
  return function authorizeHandler(req, res)  {
    const request = new Request(req)
    const response = new Response(res)

    return oAuth2Server
      .authorize(request, response, options)
      .then(() => {
        res
          .status(response.status)
          .set(response.headers)
          .end()
      })
      .catch(err => {
        res
          .status(err.status)
          .json(err)
          .end()
      })
  }
}

function authenticate(options) {
  console.log('authenticate', options)

  return function authenticationHandler(req, res, next) {
    const request = new Request(req)
    const response = new Response(res)

    console.log('authenticate', options)

    return oAuth2Server
      .authenticate(request, response, options)
      .then(token => {
        Object.assign(req, { token })
        next()
      })
      .catch(err => {
        console.log('authenticate: error', err.name)
        res
          .status(err.status)
          .json(err)
          .end()
      })
  }
}


module.exports = {
  token: token,
  authorize: authorize,
  authenticate: authenticate
}
