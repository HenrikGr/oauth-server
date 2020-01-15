/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const oauth = require('../db')

/**
 * Model to inject into the oauth server
 */
module.exports = {
  getClient: (clientId, clientSecret) => {
    return oauth.getClient(clientId, clientSecret)
  },
  getUser: (username, password) => {
    return oauth.getUser(username, password)
  },
  getUserFromClient: client => {
    return oauth.getUserFromClient(client)
  },
  saveToken: (token, client, user) => {
    return oauth.saveToken(token, client, user)
  },
  getAccessToken: accessToken => {
    return oauth.getAccessToken(accessToken)
  },
  getRefreshToken: refreshToken => {
    return oauth.getRefreshToken(refreshToken)
  },
  revokeToken: token => {
    return oauth.revokeToken(token)
  },
  revokeAuthorizationCode: code => {
    return oauth.revokeAuthorizationCode(code)
  },
  getAuthorizationCode: code => {
    return oauth.getAuthorizationCode(code)
  },
  saveAuthorizationCode: (code, client, user) => {
    return oauth.saveAuthorizationCode(code, client, user)
  },
  validateScope: (client, user, scope) => {
    return oauth.validateScope(user, client, scope)
  },
  verifyScope: (token, scope) => {
    return oauth.verifyScope(token, scope)
  }
}
