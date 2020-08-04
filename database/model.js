/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const OAuthModel = require('./mongodb/OAuthModel')
const { log, error } = require('@hgc-ab/debug-service')('repository:model')

/**
 * Oauth 2 MongoDb Model implementation
 * @type {OAuthModel}
 */
const oAuthModel = new OAuthModel('auth')

/**
 * Invoked to fetch client matching the clientId and clientSecret combination
 *
 * @param {String} clientId The client id for the grant used
 * @param {String} [clientSecret] The client secret for the grant used
 * @returns {Promise<boolean|Object>} The client or false if not found
 */
async function getClient(clientId, clientSecret) {
  try {
    return await oAuthModel.getClient(clientId, clientSecret)
  } catch (e) {
    error('getClient: ', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to fetch a user and its credentials to validate
 * username/password combination
 *
 * @param {String} username The username of the user
 * @param {String} password The password of the user
 * @returns {Promise<boolean|Object>}
 */
async function getUser(username, password) {
  try {
    return await oAuthModel.getUser(username, password)
  } catch (e) {
    error('getUser: ', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to retrieve the user associated with the specified client
 *
 * @param {Object} client The client previously obtained through getClient
 * @returns {Promise<boolean|Object>}
 */
async function getUserFromClient(client) {
  try {
    return await oAuthModel.getUserFromClient(client)
  } catch (e) {
    error('getUserFromClient: ', e.name, e.message)
    throw e
  }
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
  try {
    return await oAuthModel.saveToken(client, user, token)
  } catch (e) {
    error('saveToken: ', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to fetch an access token and it's associated client and user
 *
 * @param {String} accessToken - The access token
 * @returns {Promise<boolean|Object>}
 */
async function getAccessToken(accessToken) {
  try {
    return await oAuthModel.getAccessToken(accessToken)
  } catch (e) {
    error('getAccessToken:', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to fetch a refresh token and it's associated client and user
 *
 * @param {String} refreshToken - The refresh token to find
 * @returns {Promise<boolean|Object>}
 */
async function getRefreshToken(refreshToken) {
  try {
    return await oAuthModel.getRefreshToken(refreshToken)
  } catch (e) {
    error('getRefreshToken:', e.name, e.message)
    throw e
  }
}

/**
 * Revoke an access token
 *
 * @param {Object} token The token object retrieved from getAccessToken
 * @returns {Promise<boolean>}
 */
async function revokeAccessToken(token) {
  try {
    return await oAuthModel.revokeAccessToken(token)
  } catch (e) {
    error('revokeAccessToken:', e.name, e.message)
    throw e
  }
}

/**
 * Revoke a refresh token
 *
 * @param {Object} token The token object retrieved from getRefreshToken
 * @returns {Promise<boolean>}
 */
async function revokeRefreshToken(token) {
  try {
    return await oAuthModel.revokeRefreshToken(token)
  } catch (e) {
    error('revokeRefreshToken:', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to retrieve an existing authorization code 
 * previously saved through saveAuthorizationCode
 *
 * @param {String} authorizationCode The authorization code
 * @returns {Promise<boolean|Object>}
 */
async function getAuthorizationCode(authorizationCode) {
  try {
    return await oAuthModel.getAuthorizationCode(authorizationCode)
  } catch (e) {
    error('getAuthorizationCode: ', e.name, e.message)
    throw e
  }
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
  try {
    return await oAuthModel.saveAuthorizationCode(client, user, code)
  } catch (e) {
    error('saveAuthorizationCode: ', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to remove an authorization code
 *
 * @param {Object} code The authorization code object
 * @returns {Promise<boolean>}
 */
async function revokeAuthorizationCode(code) {
  try {
    return await oAuthModel.revokeAuthorizationCode(code)
  } catch (e) {
    error('revokeAuthorizationCode: ', e.name, e.message)
    throw e
  }
}

/**
 * Partially match scope with target scope
 *
 * @param {String} scope - The scope
 * @param {Array|String} targetScope - The target scope
 * @returns {String} Partially matched scope - if no match an empty string
 */
function scopePartiallyMatch(scope, targetScope) {
  return scope
    .split(' ')
    .filter((s) => targetScope.indexOf(s) >= 0)
    .join(' ')
}

/**
 * Match scope with target scope
 *
 * @param {String} scope - The scope
 * @param {Array} targetScope - The target scope
 * @returns {boolean|{String}} false if not a match
 */
function scopeMatch(scope, targetScope) {
  if (!scope.split(' ').every((s) => targetScope.indexOf(s) >= 0)) {
    return false
  }
  return scope
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
  try {
    log('validateScope:', `client:${client.scope}, user:${user.scope}, requested:${scope}`)
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
    if (clientScopes === '') {
      error('Invalid client: client scope(s) is not valid', client.scope)
      return clientScopes
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
      if (userScope === '') {
        error('Invalid user: user scope(s) where not valid', user.scope)
      } else {
        log('validateScope:', userScope)
      }

      return userScope
    } else {
      /**
       * Match the user scope vs the client scope
       * Match the requested scope vs the user scope
       * Return matched requested scope if any
       */
      let userScope = scopePartiallyMatch(user.scope, clientScopes)
      if (userScope === '') {
        error('Invalid user: user scope(s) where not valid', user.scope)
        return userScope
      }

      let requestScope = scopePartiallyMatch(scope, userScope)
      if (requestScope === '') {
        error('Invalid scope: requested scope is invalid', scope)
        return requestScope
      }

      log('validateScope:', requestScope)
      return requestScope
    }
  } catch (e) {
    error('validateScope - error: ', e.name, e.message)
    throw e
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
  try {
    log('verifyScope: ', token.scope, scope)
    if (!token.scope) {
      return false
    }
    const requestedScopes = scope.split(' ')
    const authorizedScopes = token.scope.split(' ')

    /**
     * If token scope contains admin scope - allow all
     */
    if (!authorizedScopes.every(isNotAdminScope)) {
      log('authorized token scope contained admin')
      return true
    }

    const result = authorizedScopes.every((s) => requestedScopes.indexOf(s) >= 0)
    log('validating authorized scope vs requested scope')
    return result
  } catch (e) {
    error('verifyScope: ', e.name, e.message, e.errors)
    throw e
  }
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
