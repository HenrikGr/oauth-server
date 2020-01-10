/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Configuration fo the oauth server
 */
const oAuthConfig = {
  endpoints: {
    root: process.env.ENDPOINT_ROOT || '/oauth',
    token: process.env.ENDPOINT_TOKEN || '/tokens',
    authorize: process.env.ENDPOINT_AUTHORIZE || '/authorize',
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
    authorizationCodeLifetime: 300,
    accessTokenLifetime: 1800
  }
}

module.exports = oAuthConfig
