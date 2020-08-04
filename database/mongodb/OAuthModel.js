/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

const ObjectId = require('mongodb').ObjectId
const DbClient = require('./DbClient')
const { log, error } = require('@hgc-ab/debug-service')('repository:model:mongo')
const { isValidPassword } = require('@hgc-ab/crypto-service')

/**
 * Class respresenting a logical implementation
 * for the OAuth 2 Service Library Model
 *
 * @class
 */
class OAuthModel extends DbClient {
  constructor(dbName) {
    super(dbName)
  }

  /**
   * Assert a password against credentials
   *
   * @param {String} password The password to validate
   * @param {Object} credential The user credential object
   * @param {String} credential.password.salt salted password
   * @param {String} credential.password.hash hashed password
   */
  validatePassword(password, credential) {
    try {
      return isValidPassword(password, credential.password.salt, credential.password.hash)
    } catch (e) {
      error('validatePassword: ', e.name, e.message)
      // If invalid password - return false
      if (e.message === 'Invalid password') {
        return false
      } else {
        throw e
      }
    }
  }

  /**
   * Invoked to fetch client matching a clientId and clientSecret combination
   *
   * @param {String} clientId The client id
   * @param {String} [clientSecret] The client secret
   * @returns {Promise<boolean|Object>}
   */
  async getClient(clientId, clientSecret) {
    try {
      log('getClient:', `${clientId}:${clientSecret}`)
      const options = {}
      const query = { clientId: clientId }
      if (clientSecret) {
        query.clientSecret = clientSecret
      }

      const collection = await super.connectCollection('clients')
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
      error('getClient: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to fetch a user and validates its credentials
   *
   * @param {String} username The username
   * @param {String} password The password
   * @returns {Promise<boolean|Object>}
   */
  async getUser(username, password) {
    try {
      log('getUser:', `${username}`)
      const query = { username: username }

      /**
       * Perform a left inner join to aggregate a result from users and credentials collection
       * @type {Collection<DefaultSchema>}
       */
      let collection = await super.connectCollection('users')
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

      return this.validatePassword(password, credential)
        ? {
            id: user._id.toString(),
            username: user.username,
            scope: user.scope,
          }
        : false
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
  async getUserFromClient(client) {
    try {
      log('getUserFromClient:', `user ${client.user.username} for ${client.name}`)
      const options = {}
      const filter = { username: client.user.username }

      const collection = await super.connectCollection('users')
      const user = await collection.findOne(filter, options)
      return !user
        ? false
        : {
            id: user._id.toString(),
            username: user.username,
            scope: user.scope,
          }
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
  async saveToken(client, user, token) {
    try {
      log('saveToken:', `${token.accessToken} for ${client.name} and ${user.username}`)
      const now = new Date()
      const options = {}

      let collection = await super.connectCollection('access_tokens')
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
        collection = await super.connectCollection('refresh_tokens')
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
      error('saveToken: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to fetch an access token and it's associated client and user
   *
   * @param {String} accessToken The access token
   * @returns {Promise<boolean|Object>}
   */
  async getAccessToken(accessToken) {
    try {
      log('getAccessToken:', `${accessToken}`)
      const query = { token: accessToken }

      const collection = await super.connectCollection('access_tokens')
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
      error('getAccessToken:', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to fetch a refresh token and it's associated client and user
   *
   * @param {String} refreshToken The refresh token to find
   * @returns {Promise<boolean|Object>}
   */
  async getRefreshToken(refreshToken) {
    try {
      log('getRefreshToken:', `${refreshToken}`)
      const query = { token: refreshToken }

      const collection = await super.connectCollection('refresh_tokens')
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
      error('getRefreshToken:', e.name, e.message)
      throw e
    }
  }

  /**
   * Revoke a access token
   *
   * @param {Object} token The token object retrieved from getAccessToken
   * @returns {Promise<boolean>}
   */
  async revokeAccessToken(token) {
    try {
      const { accessToken, client, user } = token
      log('revokeAccessToken:', `${accessToken} for ${client.name}, ${user.username}`)
      const filter = { token: accessToken }
      const options = {}

      const collection = await super.connectCollection('access_tokens')
      const result = await collection.deleteOne(filter, options)
      return Boolean(result.deletedCount === 1)
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
  async revokeRefreshToken(token) {
    try {
      const { refreshToken, client, user } = token
      log('revokeRefreshToken:', `${refreshToken} for ${client.name}, ${user.username}`)
      const filter = { token: refreshToken }
      const options = {}

      const collection = await super.connectCollection('refresh_tokens')
      const result = await collection.deleteOne(filter, options)
      return Boolean(result.deletedCount === 1)
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
  async getAuthorizationCode(authorizationCode) {
    try {
      log('getAuthorizationCode: ', authorizationCode)
      const query = { code: authorizationCode }

      const collection = await super.connectCollection('codes')
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
  async saveAuthorizationCode(client, user, code) {
    try {
      log(
        'saveAuthorizationCode:',
        `${code.authorizationCode} for ${client.name}, ${user.username}`
      )
      const options = {}
      const now = new Date()

      const collection = await super.connectCollection('codes')
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
  async revokeAuthorizationCode(code) {
    try {
      log('revokeAuthorizationCode:', `${code.code}`)
      const options = {}
      const filter = { code: code.code }

      const collection = await super.connectCollection('codes')
      const result = await collection.deleteOne(filter, options)
      return Boolean(result.deletedCount === 1)
    } catch (e) {
      error('revokeAuthorizationCode: ', e.name, e.message)
      throw e
    }
  }
}

exports = module.exports = OAuthModel
