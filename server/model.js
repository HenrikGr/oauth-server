/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */
const { OauthRepository } = require('@hgc-ab/db-repositories')
const repo = new OauthRepository('auth')

/**
 * Model to inject into the oauth server
 */
module.exports = {
  getClient: (clientId, clientSecret) => {
    return repo.getClient(clientId, clientSecret)
  },
  getUser: (username, password) => {
    return repo.getUser(username, password)
  },
  getUserFromClient: client => {
    return repo.getUserFromClient(client)
  },
  saveToken: (token, client, user) => {
    return repo.saveToken(token, client, user)
  },
  getAccessToken: accessToken => {
    return repo.getAccessToken(accessToken)
  },
  getRefreshToken: refreshToken => {
    return repo.getRefreshToken(refreshToken)
  },
  revokeToken: token => {
    return repo.revokeToken(token)
  },
  revokeAuthorizationCode: code => {
    return repo.revokeAuthorizationCode(code)
  },
  getAuthorizationCode: code => {
    return repo.getAuthorizationCode(code)
  },
  saveAuthorizationCode: (code, client, user) => {
    return repo.saveAuthorizationCode(code, client, user)
  },
  validateScope: (client, user, scope) => {
    return repo.validateScope(user, client, scope)
  },
  verifyScope: (token, scope) => {
    return repo.verifyScope(token, scope)
  }
}
