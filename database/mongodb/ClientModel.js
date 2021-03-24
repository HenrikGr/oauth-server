/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

const DbClient = require('./DbClient')
const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('ClientModel')

/**
 * ClientModel
 */
class ClientModel extends DbClient {
  constructor(dbName, collectionName) {
    super(dbName)
    this.collectionName = collectionName
  }

  /**
   * Invoked to fetch client matching a clientId and clientSecret combination
   * @param {string} clientId The client id
   * @param {string} [clientSecret] The client secret
   * @returns {Promise<boolean|Object>}
   */
  async validateClientBySecrets(clientId, clientSecret) {
    try {
      logger.verbose('validateClientBySecrets:', `${clientId}`)
      const options = {}
      const query = { clientId: clientId }
      if (clientSecret) {
        query.clientSecret = clientSecret
      }

      const collection = await super.connectCollection(this.collectionName)
      const client = await collection.findOne(query, options)
      if (!client) {
        return false
      } else {
        let { _id, name, scope, grants, redirectUris, user } = client

        return {
          id: _id.toString(),
          name: name,
          scope: scope,
          grants: grants,
          redirectUris: redirectUris,
          // accessTokenLifetime: 121,
          // refreshTokenLifetime: 121,
          user: {
            id: user._id.toString(),
            username: user.username,
            scope: user.scope,
          },
        }
      }
    } catch (e) {
      logger.error('validateClientBySecrets: ', e.name, e.message)
      throw e
    }
  }
}

module.exports = ClientModel
