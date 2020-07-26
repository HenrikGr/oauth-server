/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const apiVersion = process.env.API_VERSION || '/v1'

/**
 * Configuration for the oauth server
 */
const oAuthConfig = {
  endpoints: {
    root: (process.env.ENDPOINT_ROOT || '/oauth') + apiVersion,
    token: process.env.ENDPOINT_TOKEN || '/tokens',
    authorize: process.env.ENDPOINT_AUTHORIZE || '/authorize',
    introspect: process.env.ENDPOINT_INTROSPECT || '/introspect',
    revoke: process.env.ENDPOINT_REVOKE || '/revoke',
  },
  tokenOptions: {
    accessTokenLifetime: process.env.ACCESS_TOKEN_LIFE_TIME,
    refreshTokenLifetime: process.env.REFRESH_TOKEN_LIFE_TIME,
  },
  authorizeOptions: {
    authorizationCodeLifetime: process.env.AUTHORIZATION_CODE_LIFE_TIME,
    accessTokenLifetime: process.env.ACCESS_TOKEN_LIFE_TIME,
    allowBearerTokensInQueryString: process.env.ALLOW_BEARER_TOKEN_QUERY_STRING,
  },
  authenticationOptions: {
    addAcceptedScopesHeader: true,
    addAuthorizedScopesHeader: true,
    allowBearerTokensInQueryString: false,
    requireClientAuthentication: {
      password: false,
      refresh_token: false
    }
  }
}

module.exports = oAuthConfig
