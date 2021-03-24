/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */
const ObjectId = require('mongodb').ObjectId
const DbClient = require('./DbClient')
const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('TokenModel')

/**
 * ClientModel
 */
class TokenModel extends DbClient {
  constructor (dbName, accessTokenCollectionName, refreshTokenCollectionName) {
    super(dbName)
    this.accessTokenCollectionName = accessTokenCollectionName
    this.refreshTokenCollectionName = refreshTokenCollectionName
  }

  /**
   * Invoked to save an access token and optionally
   * a refresh token depending on the grant type.
   * @param {object} client The client associated with the token(s)
   * @param {object} user The user associated with the token(s)
   * @param {object} token The token object
   * @returns {Promise<boolean|object>}
   */
  async saveToken(client, user, token) {
    try {
      logger.info('saveToken:', `${token.accessToken} for ${client.name} and ${user.username}`)
      const now = new Date()
      const options = {}

      let collection = await super.connectCollection(this.accessTokenCollectionName)
      const accessToken = await collection.insertOne(
        {
          token: token.accessToken,
          scope: token.scope,
          expiresAt: token.accessTokenExpiresAt,
          client: {
            _id: new ObjectId(client.id),
            name: client.name,
            grants: client.grants,
            scope: client.scope,
            redirectUris: client.redirectUris,
          },
          user: {
            _id: new ObjectId(user.id),
            username: user.username,
            scope: user.scope,
          },
          updatedAt: now,
          createdAt: now,
        },
        options
      )

      if (token.refreshToken) {
        collection = await super.connectCollection(this.refreshTokenCollectionName)
        const refreshToken = await collection.insertOne(
          {
            token: token.refreshToken,
            scope: token.scope,
            expiresAt: token.refreshTokenExpiresAt,
            client: {
              _id: new ObjectId(client.id),
              name: client.name,
              grants: client.grants,
              scope: client.scope,
              redirectUris: client.redirectUris,
            },
            user: {
              _id: new ObjectId(user.id),
              username: user.username,
              scope: user.scope,
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
            ...client
          },
          user: {
            ...user
          },
        }
      }

      return false
    } catch (e) {
      logger.error('saveToken: ', e.name, e.message)
      throw e
    }
  }

  async getAccessToken (accessToken) {
    try {
      logger.info('getAccessToken:', `${accessToken}`)
      const options = {}
      const query = { token: accessToken }

      const collection = await super.connectCollection(this.accessTokenCollectionName)
      const result = await collection.findOne(query, options)
      const { user, client } = result

      return {
        accessToken: result.token,
        accessTokenExpiresAt: result.expiresAt,
        scope: result.scope,
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
      logger.error('getAccessToken: ', e.name, e.message)
      throw e
    }
  }

  async getRefreshToken (refreshToken) {
    try {
      logger.info('getRefreshToken:', `${refreshToken}`)
      const options = {}
      const query = { token: refreshToken }

      const collection = await super.connectCollection(this.refreshTokenCollectionName)
      const result = await collection.findOne(query, options)
      const { user, client } = result

      return {
        refreshToken: result.token,
        refreshTokenExpiresAt: result.expiresAt,
        scope: result.scope,
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
      logger.error('getRefreshToken: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Revoke a access token
   * @param {object} token The token object retrieved from getAccessToken
   * @returns {Promise<boolean>}
   */
  async revokeAccessToken(token) {
    try {
      const { accessToken, client, user } = token
      logger.info('revokeAccessToken:', `${accessToken} for ${client.name}, ${user.username}`)
      const filter = { token: accessToken }
      const options = {}

      const collection = await super.connectCollection(this.accessTokenCollectionName)
      const result = await collection.deleteOne(filter, options)
      return Boolean(result.deletedCount === 1)
    } catch (e) {
      logger.error('revokeAccessToken:', e.name, e.message)
      throw e
    }
  }

  /**
   * Revoke a refresh token
   * @param {object} token The token object retrieved from getAccessToken
   * @returns {Promise<boolean>}
   */
  async revokeRefreshToken(token) {
    try {
      const { refreshToken, client, user } = token
      logger.info('revokeRefreshToken:', `${refreshToken} for ${client.name}, ${user.username}`)
      const filter = { token: refreshToken }
      const options = {}

      const collection = await super.connectCollection(this.refreshTokenCollectionName)
      const result = await collection.deleteOne(filter, options)
      return Boolean(result.deletedCount === 1)
    } catch (e) {
      logger.error('revokeRefreshToken:', e.name, e.message)
      throw e
    }
  }


}

module.exports = TokenModel
