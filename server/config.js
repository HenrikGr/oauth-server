/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Configuration for the oauth server
 */
const oAuthConfig = {
  version: process.env.API_VERSION || '/v1',
  endpoints: {
    root: process.env.ENDPOINT_ROOT || '/oauth',
    token: process.env.ENDPOINT_TOKEN || '/tokens',
    authorize: process.env.ENDPOINT_AUTHORIZE || '/authorize',
    authenticate: process.env.ENDPOINT_AUTHENTICATE || '/authenticate',
  },
  tokenOptions: {
    accessTokenLifetime: process.env.accessTokenLifetime || 1800,
    refreshTokenLifetime: process.env.refreshTokenLifetime || 86400,
    requireClientAuthentication: {
      password: true,
      refresh_token: true
    }
  },
  authorizeOptions: {
    authorizationCodeLifetime: process.env.authorizationCodeLifetime || 300,
    accessTokenLifetime: process.env.accessTokenLifetime || 1800
  }
}

module.exports = oAuthConfig
