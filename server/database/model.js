/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */
const MongoError = require('mongodb').MongoError
const ObjectId = require('mongodb').ObjectId
const DbClient = require('./DbClient')
const debugService = require('@hgc-ab/debug-service')('repository:mongoDb')
const { isValidPassword } = require('@hgc-ab/crypto-service')

/**
 * Database connection client
 * @type {DbClient}
 */
const dbClient = new DbClient('auth')

/**
 * Assert a password against credentials
 *
 * @param {String} password - password
 * @param {Object} credential - credential object
 * @param {String} credential.password.salt - salted password
 * @params {String} credential.password.hash - hashed password
 */
function assertPassword(password, credential) {
  try {
    return isValidPassword(password, credential.password.salt, credential.password.hash)
  } catch (e) {
    debugService('assertPassword: ', e.name, e.message)
    // If invalid password - return false
    if (e.message === 'Invalid password') {
      return false
    } else {
      throw e
    }
  }
}

/**
 * Invoked to fetch client matching the clientId and clientSecret combination
 *
 * @param {String} clientId - The client id for the grant used
 * @param {String} [clientSecret] - The client secret for the grant used
 * @returns {Promise<boolean|Object>}
 */
async function getClient(clientId, clientSecret) {
  try {
    debugService('getClient:', `${clientId}:${clientSecret}`)
    const options = {}
    const query = { clientId: clientId }
    if (clientSecret) {
      query.clientSecret = clientSecret
    }

    const collection = await dbClient.connectCollection('clients')
    const client = await collection.findOne(query, options)
    if (!client) {
      return false
    } else {
      let { user } = client

      return {
        id: client._id.toString(),
        name: client.name,
        scope: client.scope,
        grants: client.grants,
        redirectUris: client.redirectUris,
        // accessTokenLifetime: 121,
        // refreshTokenLifetime: 121,
        user: {
          id: user._id.toString(),
          username: user.username,
        },
      }
    }
  } catch (e) {
    debugService('getClient: ', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to fetch a user and its credentials to validate
 * username/password combination
 *
 * @param {String} username - The username of the user
 * @param {String} password - The password of the user
 * @returns {Promise<boolean|Object>}
 */
async function getUser(username, password) {
  try {
    debugService('getUser:', `${username}`)
    const query = { username: username }

    // noinspection JSValidateJSDoc
    /**
     * Perform a left inner join to aggregate a result from users and credentials collection
     * @type {Collection<DefaultSchema>}
     */
    let collection = await dbClient.connectCollection('users')
    let aggResult = await collection
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'credentials',
            localField: 'username',
            foreignField: 'username',
            as: 'credentials',
          },
        },
      ])
      .toArray()

    if (!aggResult[0]) {
      return false
    }

    const user = aggResult[0]
    const credential = user.credentials[0]

    return assertPassword(password, credential)
      ? {
          id: user._id.toString(),
          username: user.username,
          scope: user.scope,
        }
      : false
  } catch (e) {
    debugService('getUser: ', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to retrieve the user associated with the specified client
 *
 * @param {Object} client - The client previously obtained through getClient
 * @returns {Promise<boolean|Object>}
 */
async function getUserFromClient(client) {
  try {
    debugService('getUserFromClient:', `user ${client.user.username} for ${client.name}`)
    const options = {}
    const filter = { username: client.user.username }

    const collection = await dbClient.connectCollection('users')
    const user = await collection.findOne(filter, options)
    return !user
      ? false
      : {
          id: user._id.toString(),
          username: user.username,
          scope: user.scope,
        }
  } catch (e) {
    debugService('getUserFromClient: ', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to save an access token and optionally
 * a refresh token depending on the grant type.
 *
 * @param {Object} token - The token object
 * @param {Object} client - The client associated with the token(s)
 * @param {Object} user - The user associated with the token(s)
 * @returns {Promise<boolean|Object>}
 */
async function saveToken(client, user, token) {
  try {
    debugService('saveToken:', `${token.accessToken} for ${client.name} and ${user.username}`)
    const now = new Date()
    const options = {}

    let collection = await dbClient.connectCollection('access_tokens')
    const accessToken = await collection.insertOne(
      {
        token: token.accessToken,
        scope: token.scope,
        expiresAt: token.accessTokenExpiresAt,
        client: {
          _id: ObjectId(client.id),
          name: client.name,
        },
        user: {
          _id: ObjectId(user.id),
          username: user.username,
        },
        updatedAt: now,
        createdAt: now,
      },
      options
    )

    if (token.refreshToken) {
      collection = await dbClient.connectCollection('refresh_tokens')
      const refreshToken = await collection.insertOne(
        {
          token: token.refreshToken,
          scope: token.scope,
          expiresAt: token.refreshTokenExpiresAt,
          client: {
            _id: ObjectId(client.id),
            name: client.name,
          },
          user: {
            _id: ObjectId(user.id),
            username: user.username,
          },
          updatedAt: now,
          createdAt: now,
        },
        options
      )
    }

    if (accessToken.insertedCount === 1) {
      return {
        ...token,
        client: {
          id: client.id,
          name: client.name,
          grants: client.grants,
          scope: client.scope,
          redirectUris: client.redirectUris,
          // accessTokenLifetime: 121,
          // refreshTokenLifetime: 121,
        },
        user: {
          id: user.id,
          username: user.username,
          scope: user.scope,
        },
      }
    }

    return false
  } catch (e) {
    debugService('saveToken: ', e.name, e.message)
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
    debugService('getAccessToken:', `${accessToken}`)
    const query = { token: accessToken }

    const collection = await dbClient.connectCollection('access_tokens')
    const aggResult = await collection
      .aggregate([
        { $match: query },
        { $unwind: '$client' },
        {
          $lookup: {
            from: 'clients',
            localField: 'client.name',
            foreignField: 'name',
            as: 'client',
          },
        },
        { $unwind: '$client' },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'users',
            localField: 'user.username',
            foreignField: 'username',
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ])
      .toArray()

    if (!aggResult[0]) {
      return false
    }

    const token = aggResult[0]
    const { user, client } = token

    return {
      accessToken: token.token,
      accessTokenExpiresAt: token.expiresAt,
      scope: token.scope,
      client: {
        id: client._id.toString(),
        name: client.name,
        grants: client.grants,
        scope: client.scope,
        redirectUris: client.redirectUris,
        // accessTokenLifetime: 121,
        // refreshTokenLifetime: 121,
      },
      user: {
        id: user._id.toString(),
        username: user.username,
        scope: user.scope,
      },
    }
  } catch (e) {
    debugService('getAccessToken:', e.name, e.message)
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
    debugService('getRefreshToken:', `${refreshToken}`)
    const query = { token: refreshToken }

    const collection = await dbClient.connectCollection('refresh_tokens')
    const aggResult = await collection
      .aggregate([
        { $match: query },
        { $unwind: '$client' },
        {
          $lookup: {
            from: 'clients',
            localField: 'client.name',
            foreignField: 'name',
            as: 'client',
          },
        },
        { $unwind: '$client' },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'users',
            localField: 'user.username',
            foreignField: 'username',
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ])
      .toArray()

    if (!aggResult[0]) {
      return false
    }

    const token = aggResult[0]
    const { user, client } = token

    return {
      refreshToken: token.token,
      refreshTokenExpiresAt: token.expiresAt,
      scope: token.scope,
      client: {
        id: client._id.toString(),
        name: client.name,
        grants: client.grants,
        scope: client.scope,
        redirectUris: client.redirectUris,
        // accessTokenLifetime: 121,
        // refreshTokenLifetime: 121,
      },
      user: {
        id: user._id.toString(),
        username: user.username,
        scope: user.scope,
      },
    }
  } catch (e) {
    debugService('getRefreshToken:', e.name, e.message)
    throw e
  }
}

/**
 * Revoke a access token
 *
 * @param {Object} token - The token object retrieved from getAccessToken
 * @param {String} token.accessToken - The access token
 * @returns {Promise<boolean>}
 */
async function revokeAccessToken(token) {
  try {
    const { accessToken, client, user } = token
    debugService('revokeAccessToken:', `${accessToken} for ${client.name}, ${user.username}`)
    const filter = { token: accessToken }
    const options = {}

    const collection = await dbClient.connectCollection('access_tokens')
    const result = await collection.deleteOne(filter, options)
    return Boolean(result.deletedCount === 1)
  } catch (e) {
    debugService('revokeAccessToken:', e.name, e.message)
    throw e
  }
}

/**
 * Revoke a refresh token
 *
 * @param {Object} token - The token object retrieved from getRefreshToken
 * @param {String} token.refreshToken - The refresh token
 * @returns {Promise<boolean>}
 */
async function revokeRefreshToken(token) {
  try {
    const { refreshToken, client, user } = token
    debugService('revokeRefreshToken:', `${refreshToken} for ${client.name}, ${user.username}`)
    const filter = { token: refreshToken }
    const options = {}

    const collection = await dbClient.connectCollection('refresh_tokens')
    const result = await collection.deleteOne(filter, options)
    return Boolean(result.deletedCount === 1)
  } catch (e) {
    debugService('revokeRefreshToken:', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to retrieve an existing authorization code previously saved through
 *
 * @param {String} authorizationCode - The authorization code
 * @returns {Promise<boolean|Object>}
 */
async function getAuthorizationCode(authorizationCode) {
  try {
    debugService('getAuthorizationCode: ', authorizationCode)
    const query = { code: authorizationCode }

    const collection = await dbClient.connectCollection('codes')
    const aggResult = await collection
      .aggregate([
        { $match: query },
        { $unwind: '$client' },
        {
          $lookup: {
            from: 'clients',
            localField: 'client.name',
            foreignField: 'name',
            as: 'client',
          },
        },
        { $unwind: '$client' },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'users',
            localField: 'user.username',
            foreignField: 'username',
            as: 'user',
          },
        },
        { $unwind: '$user' },
      ])
      .toArray()

    if (!aggResult[0]) {
      return false
    } else {
      const code = aggResult[0]
      const { user, client } = code

      return {
        code: code.code,
        scope: code.scope,
        redirectUri: code.redirectUri,
        expiresAt: code.expiresAt,
        client: {
          id: client._id.toString(),
          name: client.name,
          grants: client.grants,
          scope: client.scope,
          redirectUris: client.redirectUris,
          // accessTokenLifetime: 121,
          // refreshTokenLifetime: 121,
        },
        user: {
          id: user._id.toString(),
          username: user.username,
          scope: user.scope,
        },
      }
    }
  } catch (e) {
    debugService('getAuthorizationCode: ', e.name, e.message)
    throw e
  }
}

/**
 * Save authorization code
 *
 * @param {Object} code - The authorization code
 * @param {String} code.authorizationCode - generated authorization code
 * @param {String} code.scope - The validated scope
 * @param {String} code.redirectUri - The requested redirect uri
 * @param {Date} code.expiresAt - The expiration date of the code
 * @param {Object} client - The client associated with the authorization code
 * @param {Object} user - The user associated with the authorization code
 * @returns {Promise<boolean|Object>}
 */
async function saveAuthorizationCode(client, user, code) {
  try {
    debugService(
      'saveAuthorizationCode:',
      `${code.authorizationCode} for ${client.name}, ${user.username}`
    )
    const options = {}
    const now = new Date()

    const collection = await dbClient.connectCollection('codes')
    const result = await collection.insertOne(
      {
        code: code.authorizationCode,
        scope: code.scope,
        redirectUri: code.redirectUri,
        expiresAt: code.expiresAt,
        client: {
          _id: ObjectId(client.id),
          name: client.name,
        },
        user: {
          _id: ObjectId(user.id),
          username: user.username,
        },
        updatedAt: now,
        createdAt: now,
      },
      options
    )

    if (result.insertedCount === 1) {
      return {
        authorizationCode: result.ops[0].code,
        expiresAt: result.ops[0].expiresAt,
        redirectUri: result.ops[0].redirectUri,
        scope: result.ops[0].scope,
        client: {
          id: client.id,
          name: client.name,
          grants: client.grants,
          scope: client.scope,
          redirectUris: client.redirectUris,
          // accessTokenLifetime: 121,
          // refreshTokenLifetime: 121,
        },
        user: {
          id: user.id,
          username: user.username,
        },
      }
    }

    return false
  } catch (e) {
    debugService('saveAuthorizationCode: ', e.name, e.message)
    throw e
  }
}

/**
 * Invoked to remove an authorization code
 *
 * @param {Object} authorizationCode
 * @param {String} authorizationCode.code
 * @returns {Promise<boolean>}
 */
async function revokeAuthorizationCode(authorizationCode) {
  try {
    debugService('revokeAuthorizationCode:', `${authorizationCode.code}`)
    const options = {}
    const filter = { code: authorizationCode.code }

    const collection = await dbClient.connectCollection('codes')
    const result = await collection.deleteOne(filter, options)
    return Boolean(result.deletedCount === 1)
  } catch (e) {
    debugService('revokeAuthorizationCode: ', e.name, e.message)
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
    debugService('validateScope:', `client:${client.scope}, user:${user.scope}, requested:${scope}`)
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
      debugService('Invalid client: client scope(s) is not valid', client.scope)
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
        debugService('Invalid user: user scope(s) where not valid', user.scope)
      }

      debugService('validateScope:', userScope)
      return userScope
    } else {
      /**
       * Match the user scope vs the client scope
       * Match the requested scope vs the user scope
       * Return matched requested scope if any
       */

      let userScope = scopePartiallyMatch(user.scope, clientScopes)
      if (userScope === '') {
        debugService('Invalid user: user scope(s) where not valid', user.scope)
      }

      let requestScope = scopePartiallyMatch(scope, userScope)
      if (requestScope === '') {
        debugService('Invalid scope: requested scope is invalid', scope)
        return requestScope
      }

      debugService('validateScope:', requestScope)
      return requestScope
    }
  } catch (e) {
    debugService('validateScope - error: ', e.name, e.message)
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
    debugService('verifyScope: ', token.scope, scope)
    if (!token.scope) {
      return false
    }
    const requestedScopes = scope.split(' ')
    const authorizedScopes = token.scope.split(' ')
    debugService('verifyScope: requested scopes', requestedScopes)
    debugService('verifyScope: authorized scopes', authorizedScopes)

    /**
     * If token scope contains admin scope - allow all
     */
    if (!authorizedScopes.every(isNotAdminScope)) {
      debugService('authorized token scope contained admin')
      return true
    }

    debugService('validating authorized scope vs requested scope')
    return authorizedScopes.every((s) => requestedScopes.indexOf(s) >= 0)
  } catch (e) {
    debugService('verifyScope: ', e.name, e.message, e.errors)
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
