/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const ClientModel = require('./mongodb/ClientModel')
const UserModel = require('./mongodb/UserModel')
const AccessTokenModel = require('./mongodb/AccessTokenModel')
const RefreshTokenModel = require('./mongodb/RefreshTokenModel')
const AuthorizationCodeModel = require('./mongodb/AuthorizationCodeModel')
const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('BaseModel')

const clientModel = new ClientModel('ApplicationDb', 'clients')
const userModel = new UserModel('UserDb', 'accounts', 'credentials', 'username')
const authorizationCodeModel = new AuthorizationCodeModel('OAuthDb', 'codes')
const accessTokenModel = new AccessTokenModel('OAuthDb', 'access_tokens')
const refreshTokenModel = new RefreshTokenModel('OAuthDb', 'refresh_tokens')

/**
 * Invoked to fetch client matching the clientId and clientSecret combination
 *
 * @param {String} clientId The client id for the grant used
 * @param {String} [clientSecret] The client secret for the grant used
 * @returns {Promise<boolean|Object>} The client or false if not found
 */
async function getClient(clientId, clientSecret) {
  logger.info(`getClient: ${clientId}`)
  return await clientModel.validateClientBySecrets(clientId, clientSecret)
}

/**
 * Invoked to fetch a user and its credentials
 * to validate username/password combination
 * @param {String} username The username of the user
 * @param {String} password The password of the user
 * @returns {Promise<boolean|Object>}
 */
async function getUser(username, password) {
  logger.info(`getUser: ${username}`)
  return await userModel.validateUserByPassword(username, password)
}

/**
 * Invoked to retrieve the user associated with the specified client
 *
 * @param {Object} client The client previously obtained through getClient
 * @returns {Promise<boolean|Object>}
 */
async function getUserFromClient(client) {
  logger.info(`getUserFromClient: ${client.name}`)
  return await userModel.validateUserByClient(client)
}

/**
 * Invoked to save an access token and optionally
 * a refresh token depending on the grant type.
 *
 * @param {Object} client The client associated with the token(s)
 * @param {Object} user The user associated with the token(s)
 * @param {Object} token The token object
 * @returns {Promise<boolean|Object>}
 */
async function saveToken(client, user, token) {
  logger.info(`saveToken: ${token.accessToken} for ${client.name} and ${user.username}`)
  const accessToken = await accessTokenModel.saveAccessToken(client, user, token)
  if (!accessToken) {
    return false
  }

  if (token.refreshToken) {
    const refreshToken = await refreshTokenModel.saveRefreshToken(client, user, token)

    if (!refreshToken) {
      return false
    }
  }

  return {
    ...token,
    client: {
      ...client,
    },
    user: {
      ...user,
    },
  }
}

/**
 * Invoked to fetch an access token and it's associated client and user
 *
 * @param {String} accessToken - The access token
 * @returns {Promise<boolean|Object>}
 */
async function getAccessToken(accessToken) {
  logger.info(`getAccessToken: ${accessToken}`)
  return await accessTokenModel.getAccessToken(accessToken)
}

/**
 * Invoked to fetch a refresh token and it's associated client and user
 *
 * @param {String} refreshToken - The refresh token to find
 * @returns {Promise<boolean|Object>}
 */
async function getRefreshToken(refreshToken) {
  logger.info(`getRefreshToken: ${refreshToken}`)
  return await refreshTokenModel.getRefreshToken(refreshToken)
}

/**
 * Revoke an access token
 *
 * @param {Object} token The token object retrieved from getAccessToken
 * @returns {Promise<boolean>}
 */
async function revokeAccessToken(token) {
  logger.info(`revokeAccessToken: ${token.accessToken}`)
  return await accessTokenModel.revokeAccessToken(token)
}

/**
 * Revoke a refresh token
 *
 * @param {Object} token The token object retrieved from getRefreshToken
 * @returns {Promise<boolean>}
 */
async function revokeRefreshToken(token) {
  logger.info(`revokeRefreshToken: ${token.refreshToken}`)
  return await refreshTokenModel.revokeRefreshToken(token)
}

/**
 * Invoked to retrieve an existing authorization code
 * previously saved through saveAuthorizationCode
 *
 * @param {string} authorizationCode The authorization code
 * @returns {Promise<boolean|Object>}
 */
async function getAuthorizationCode(authorizationCode) {
  logger.info(`getAuthorizationCode: ${authorizationCode}`)
  return await authorizationCodeModel.getAuthorizationCode(authorizationCode)
}

/**
 * Save authorization code
 *
 * @param {Object} client The client associated with the authorization code
 * @param {Object} user The user associated with the authorization code
 * @param {Object} code The authorization code object
 * @returns {Promise<boolean|Object>}
 */
async function saveAuthorizationCode(client, user, code) {
  logger.info(`saveAuthorizationCode: ${code.authorizationCode}`)
  return await authorizationCodeModel.saveAuthorizationCode(client, user, code)
}

/**
 * Invoked to remove an authorization code
 *
 * @param {Object} code The authorization code object
 * @returns {Promise<boolean>}
 */
async function revokeAuthorizationCode(code) {
  logger.info(`revokeAuthorizationCode: ${code.code}`)
  return await authorizationCodeModel.revokeAuthorizationCode(code)
}

/**
 * Match scope with target scope
 *
 * @param {String} scope - The scope
 * @param {Array} targetScope - The target scope
 * @param scope
 * @param targetScope
 * @return {boolean|*}
 */
function scopeMatch(scope, targetScope) {
  if (scope === '') {
    return false
  }

  if (!scope.split(' ').every((s) => targetScope.indexOf(s) >= 0)) {
    return false
  }
  return scope
}

/**
 * Partially match scope with target scope
 */
function scopePartiallyMatch(scope, targetScope) {
  if (scope === '') {
    return ''
  }

  return scope.split(' ').filter((s) => targetScope.indexOf(s) >= 0)
  //.join(' ')
}

/**
 * Validate scope for authentication request
 *
 * Authentication request occur before a access token is generated
 * and stored via saveToken model.
 *
 * The authorization code pass in a requested scope param, all other authentication
 * flows do not and the validation should
 * Validate requested scope is valid for a particular client/user combination.
 *
 * @param {Object} user - The user
 * @param {String} user.scope The scope of the user
 * @param {Object} client - The client
 * @param {String} client.scope - The scope of the client
 * @param {String} scope - requested scope to validate against
 * @returns {Promise<String|string>}
 */
async function validateScope(client, user, scope) {
  logger.info(`validateScope: client:${client.scope}, user:${user.scope}, requested:${scope}`)
  // Get all valid scopes
  const VALID_SCOPES = [
    'admin',
    'profile',
    'client:read',
    'client:write',
    'user:read',
    'user-write',
  ]

  /**
   * Match client scope vs valid scopes to check if client in invalid
   */
  let clientScopes = scopePartiallyMatch(client.scope, VALID_SCOPES)
  if (clientScopes.length === 0) {
    logger.error('Invalid client: client scope(s) is not valid', client.scope)
    return ''
  }

  /**
   * If no requested scope was in the authentication request
   */
  if (scope === undefined) {
    /**
     * Match the user scope vs the client scope
     * Return matched user scope if any
     */
    let userScope = scopePartiallyMatch(user.scope, clientScopes)
    if (userScope.length === 0) {
      logger.error('Invalid user: user scope(s) where not valid', user.scope)
    } else {
      logger.info('validateScope:', userScope.join(' '))
    }

    return userScope.join(' ')
  } else {
    /**
     * Match the user scope vs the client scope
     * Match the requested scope vs the user scope
     * Return matched requested scope if any
     */
    let userScope = scopePartiallyMatch(user.scope, clientScopes)
    if (userScope.length === 0) {
      logger.error('Invalid user: user scope(s) where not valid', user.scope)
      return ''
    }

    let requestScope = scopePartiallyMatch(scope, userScope)
    if (requestScope.length === 0) {
      logger.error('Invalid scope: requested scope is invalid', scope)
      return ''
    }

    logger.info('validateScope:', requestScope)
    return requestScope.join(' ')
  }
}

/**
 * Condition helper to check if authorized token scope contains admin
 *
 * @private
 * @param {String} scope - scope to validate
 * @returns {Boolean} true if scope is admin, else false
 */
function isNotAdminScope(scope) {
  return scope !== 'admin'
}

/**
 * Verify authorized access token scope(s) vs authentication scope(s)
 *
 * Invoked during request authentication to check if the provided access token
 * is authorized and valid the the request.
 *
 * @public
 * @param {Object} token - contains the authorized scope for the user
 * @param {String} token.scope - scope(s) in the token
 * @param {String} scope - the requested scope(s) used with authenticate
 * @returns {Boolean} true if token scope is included in the requested scope
 * @throws {Error}
 * @remarks Is used authenticate() middleware
 */
async function verifyScope(token, scope) {
  logger.info(`verifyScope: token scope:${token.scope}, requested scope:${scope}`)
  if (!token.scope) {
    return false
  }
  const requestedScopes = scope.split(' ')
  const authorizedScopes = token.scope.split(' ')

  /**
   * If token scope contains admin scope - allow all
   */
  if (!authorizedScopes.every(isNotAdminScope)) {
    logger.verbose('authorized token scope contained admin')
    return true
  }

  const result = authorizedScopes.every((s) => requestedScopes.indexOf(s) >= 0)
  logger.info('validating authorized scope vs requested scope')
  return result
}

/**
 * The data access model
 */
module.exports = {
  getClient,
  getUser,
  getUserFromClient,
  saveToken,
  getAccessToken,
  getRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  revokeAuthorizationCode,
  getAuthorizationCode,
  saveAuthorizationCode,
  validateScope,
  verifyScope,
}
