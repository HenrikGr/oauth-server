/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

const DbClient = require('./DbClient')
const { verifyHash } = require('@hgc-sdk/crypto')

const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('UserModel')

/**
 * UserModel
 */
class UserModel extends DbClient {
  constructor(dbName, accountCollectionName, credentialCollectionName, keyName) {
    super(dbName)
    this.accountCollectionName = accountCollectionName
  }

  async validateUserByPassword(username, password) {
    logger.verbose('validateUserByPassword:', `${username}`)

    try {
      const query = { username: username }
      let collection = await super.connectCollection(this.accountCollectionName)
      const user = await collection.findOne(query)
      if(!user) {
        return false
      }

      const credential = user['credentials']
      const isValid = await verifyHash(password, credential.password)

      if (!isValid) {
        return false
      }

      return {
        id: user._id.toString(),
        username: user.username,
        scope: user.scope,
      }

    } catch (e) {
      logger.error('validateUserByPassword: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to retrieve the user associated with the specified client
   * @param {object} client The client previously obtained through getClient
   * @returns {Promise<boolean|Object>}
   */
  async validateUserByClient(client) {
    try {
      logger.verbose(`validateUserByClient: user ${client.user.username} for ${client.name}`)

      const options = {}
      const { user: clientUser } = client
      const filter = { username: clientUser.username }

      const collection = await super.connectCollection(this.accountCollectionName)
      const user = await collection.findOne(filter, options)
      return !user
        ? false
        : {
          id: user['_id'].toString(),
          username: user['username'],
          scope: user['scope'],
        }
    } catch (e) {
      logger.error('getAccountFromClient: ', e.name, e.message)
      throw e
    }
  }

}

module.exports = UserModel
