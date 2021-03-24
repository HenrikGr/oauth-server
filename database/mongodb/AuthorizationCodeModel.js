/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

const ObjectId = require('mongodb').ObjectId
const DbClient = require('./DbClient')
const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('AuthorizationCodeModel')

/**
 * AuthorizationCodeModel
 */
class AuthorizationCodeModel extends DbClient {
  constructor(dbName, collectionName) {
    super(dbName)
    this.collectionName = collectionName
  }

  /**
   * Save authorization code
   * @param {object} client The client associated with the authorization code
   * @param {object} user The user associated with the authorization code
   * @param {object} code The authorization code object
   * @returns {Promise<boolean|Object>}
   */
  async saveAuthorizationCode(client, user, code) {
    logger.verbose(`saveAuthorizationCode: ${code.authorizationCode} for ${client.name}, ${user.username}`)

    try {
      const options = {}
      const now = new Date()

      const collection = await super.connectCollection(this.collectionName)
      const result = await collection.insertOne(
        {
          code: code.authorizationCode,
          scope: code.scope,
          redirectUri: code.redirectUri,
          expiresAt: code.expiresAt,
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
            scope: user.scope,
          },
        }
      }

      return false
    } catch (e) {
      logger.error('saveAuthorizationCode: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to retrieve an existing authorization code
   * previously saved through saveAuthorizationCode
   * @param {String} authorizationCode The authorization code
   * @returns {Promise<boolean|Object>}
   */
  async getAuthorizationCode(authorizationCode) {
    logger.verbose('getAuthorizationCode: ', authorizationCode)

    try {
      const options = {}
      const query = { code: authorizationCode }

      const collection = await super.connectCollection(this.collectionName)
      const code = await collection.findOne(query, options)
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
    } catch (e) {
      logger.error('getAuthorizationCode: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to remove an authorization code
   * @param {Object} code The authorization code object
   * @returns {Promise<boolean>}
   */
  async revokeAuthorizationCode(code) {
    logger.verbose(`revokeAuthorizationCode: ${code.code}`)

    try {
      const options = {}
      const filter = { code: code.code }

      const collection = await super.connectCollection(this.collectionName)
      const result = await collection.deleteOne(filter, options)
      return Boolean(result.deletedCount === 1)
    } catch (e) {
      logger.error('revokeAuthorizationCode: ', e.name, e.message)
      throw e
    }
  }

}

module.exports = AuthorizationCodeModel
