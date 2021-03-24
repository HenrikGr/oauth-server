/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */
const ObjectId = require('mongodb').ObjectId
const DbClient = require('./DbClient')
const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('AccessTokenModel')

/**
 * ClientModel
 */
class AccessTokenModel extends DbClient {
  constructor (dbName, collectionName) {
    super(dbName)
    this.collectionName = collectionName
  }

  /**
   * Invoked to save an access token and optionally
   * a refresh token depending on the grant type.
   * @param {object} client The client associated with the token(s)
   * @param {object} user The user associated with the token(s)
   * @param {object} token The token object
   * @returns {Promise<boolean|object>}
   */
  async saveAccessToken(client, user, token) {
    logger.verbose(`saveAccessToken: ${token.accessToken} for ${client.name} and ${user.username}`)

    try {
      const now = new Date()
      const extendedDocument = {
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
        createdAt: now,
        updatedAt: now,
      }

      let collection = await super.connectCollection(this.collectionName)
      const accessToken = await collection.insertOne(extendedDocument)
      return Boolean(accessToken.insertedCount === 1)
    }
     catch (e) {
      logger.error('saveAccessToken: ', e.name, e.message)
      throw e
    }
  }

  async getAccessToken(accessToken) {
    logger.verbose(`getAccessToken: ${accessToken}`)

    try {
      const options = {}
      const query = { token: accessToken }
      const collection = await super.connectCollection(this.collectionName)
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

  /**
   * Revoke a access token
   * @param {object} token The token object retrieved from getAccessToken
   * @returns {Promise<boolean>}
   */
  async revokeAccessToken(token) {
    logger.verbose(`revokeAccessToken: ${token.accessToken} for ${token.client.name}, ${token.user.username}`)

    try {
      const filter = { token: token.accessToken }
      const options = {}

      const collection = await super.connectCollection(this.collectionName)
      const result = await collection.deleteOne(filter, options)
      return Boolean(result.deletedCount === 1)
    } catch (e) {
      logger.error('revokeAccessToken:', e.name, e.message)
      throw e
    }
  }

}

module.exports = AccessTokenModel
