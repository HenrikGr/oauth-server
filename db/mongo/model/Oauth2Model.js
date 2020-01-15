/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

const ObjectId = require('mongodb').ObjectId

/**
 * Oauth2 model
 *
 * @public
 * @class
 */
class Oauth2Model {
  constructor(dependencies) {
    this._connectCollection = dependencies.connectCollection
    this._debugService = dependencies.debugService
  }

  /**
   * Retrieve a client using a client id or a client id/client secret combination
   *
   * @public
   * @param {String} clientId - The client id
   * @param {String} clientSecret - The client secret
   * @returns {Object|Boolean} - a client entity with an id key instead of _id
   * @throws {MongoError|Error}
   * @remarks Is required for all grant types
   */
  async getClient(clientId, clientSecret) {
    try {
      // Create query
      let query = { clientId: clientId }
      if (clientSecret) {
        query.clientSecret = clientSecret
      }

      // Fetch the collection
      let collection = await this._connectCollection('clients')

      // get the client
      let client = await collection.findOne(query, {})
      if (!client) {
        return false
      }

      let result = {
        id: new ObjectId(client._id).toString(),
        name: client.name,
        scope: client.scope,
        redirectUris: client.redirectUris,
        grants: client.grants,
        user: client.username
      }

      this._debugService('getClient: result', result)
      return result
    } catch (e) {
      this._debugService('getClient: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Retrieve a user using a username/password combination.
   *
   * @public
   * @param {String} username - The username of the user to retrieve.
   * @param {String} password - The user’s password.
   * @returns {Object} user - The user entity found or a false value
   * @throws {MongoError|Error}
   * @remarks Is required if the password grant is used.
   */
  async getUser(username, password) {
    try {
      // Create query
      let query = { username: username }

      // Fetch the collection
      let collection = await this._connectCollection('users')

      // get the credential
      let user = await collection.findOne(query, {})
      if (!user) {
        return false
      }

      // Validate password
      // username indexed and unique?
      //const isPasswordOK = user.isValidPassword(password)
      //return !isPasswordOK ? false : user

      let result = {
        _id: new ObjectId(user._id).toString(),
        username: user.username,
        scope: user.scope
      }

      this._debugService('getUser: result', result)
      return result
    } catch (e) {
      this._debugService('getUser: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Invoked to retrieve the user associated with the specified client.
   *
   * @param {Object} client - Extended client previously obtained through getClient
   * @returns {Object} user - The user associated with the client
   * @throws {MongoError} throws MongoError on failure
   * @remarks This model function is required if the client_credentials grant is used.
   */
  async getUserFromClient(client) {
    try {
      // Create query
      let query = { username: client.user }

      // Fetch the collection
      let collection = await this._connectCollection('users')

      // get the user
      let user = await collection.findOne(query, {})

      let result = {
        _id: new ObjectId(user._id).toString(),
        username: user.username,
        scope: user.scope
      }

      this._debugService('getUserFromClient: result', result)
      return result
    } catch (e) {
      this._debugService('getUserFromClient: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Invoked to create an access token and optionally
   * a refresh token depending on the grant type.
   *
   * @param {Object} token - The token(s) to be saved.
   * @param {String} token.accessToken - The access token to be saved.
   * @param {Date} token.accessTokenExpiresAt - The expiry time of the access token.
   * @param {String} token.refreshToken - The refresh token to be saved.
   * @param {Date} token.refreshTokenExpiresAt - The expiry time of the refresh token.
   * @param {String} token.scope - The scope of the token
   * @param {Object} client - The client associated with the token(s).
   * @param {Object} user - The user associated with the token(s).
   * @returns {Object} object - An Object representing the token(s) and associated data.
   * @throws {MongoError} throws MongoError on failure
   */
  async saveToken(token, client, user) {
    try {
      // Set options to return the new document
      let options = { forceServerObjectId: false }

      // Fetch the collection
      let collection = await this._connectCollection('accesstokens')

      let data = {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        client: client.name,
        username: user.username,
        scope: token.scope,
        updatedAt: new Date(),
        createdAt: new Date()
      }

      // insert accessToken
      await collection.insertOne(data, options)

      if (token.refreshToken) {
        // Fetch the collection
        let collection = await this._connectCollection('refreshtokens')

        let data = {
          refreshToken: token.refreshToken,
          refreshTokenExpiresAt: token.refreshTokenExpiresAt,
          client: client.name,
          username: user.username,
          scope: token.scope,
          updatedAt: new Date(),
          createdAt: new Date()
        }

        // insert refreshToken
        await collection.insertOne(data, options)
      }

      let result = Object.assign(token, { client, user })

      this._debugService('saveToken: result', result)
      return result
    } catch (e) {
      this._debugService('saveToken: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Retrieve an existing access token
   *
   * @param {String} accessToken - The access token to find
   * @return {Object} a promise resolve into the found access token
   * @remarks Invoked during request authentication, authentication middleware
   */
  async getAccessToken(accessToken) {
    try {
      let query = { accessToken: accessToken }

      let collection = await this._connectCollection('accesstokens')

      let aggResult = await collection
        .aggregate([
          { $match: query },
          {
            $lookup: {
              from: 'clients',
              localField: 'client',
              foreignField: 'name',
              as: 'client_docs'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'username',
              foreignField: 'username',
              as: 'user_docs'
            }
          }
        ])
        .toArray()

      if (!aggResult) {
        return false
      }

      let token = aggResult[0]
      let client = token.client_docs[0]
      let user = token.user_docs[0]

      let result = {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        scope: token.scope,
        client: {
          id: client._id.toString(),
          scope: client.scope,
          redirectUris: client.redirectUris,
          grants: client.grants
        },
        user: user
      }

      this._debugService('getAccessToken: result', result)
      return result
    } catch (e) {
      this._debugService('getAccessToken: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Invoked to retrieve an existing access token
   * previously saved through saveToken
   *
   * @param {String} refreshToken - The access token to find
   * @return {Object} a promise resolve into the found access token
   * @remarks This model function is required if the refresh_token grant is used.
   */
  async getRefreshToken(refreshToken) {
    try {
      let query = { refreshToken: refreshToken }

      let collection = await this._connectCollection('refreshtokens')

      let aggResult = await collection
        .aggregate([
          { $match: query },
          {
            $lookup: {
              from: 'clients',
              localField: 'client',
              foreignField: 'name',
              as: 'client_docs'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'username',
              foreignField: 'username',
              as: 'user_docs'
            }
          }
        ])
        .toArray()

      if (!aggResult) {
        return false
      }

      let token = aggResult[0]
      let client = token.client_docs[0]
      let user = token.user_docs[0]

      let result = {
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        client: {
          id: client._id.toString(),
          scope: client.scope,
          redirectUris: client.redirectUris,
          grants: client.grants
        },
        user: user
      }

      this._debugService('getRefreshToken: result', result)
      return result
    } catch (e) {
      this._debugService('getRefreshToken: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Invoked to revoke a refresh token.
   * @param {object} token
   * @returns {boolean} removed
   * @remarks refresh_token grant
   */
  async revokeToken(token) {
    try {
      let query = { refreshToken: token.refreshToken }

      let collection = await this._connectCollection('refreshtokens')

      const result = await collection.findOneAndDelete(query, {})

      this._debugService('revokeToken: query', result.ok === 1)
      return Boolean(result.ok === 1)
    } catch (e) {
      this._debugService('revokeToken: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Invoked to retrieve an existing authorization code previously saved through
   *
   * @param {string} code
   * @returns {object} code model
   * @support authorization_code grant
   */
  async getAuthorizationCode(code) {
    // code should be used to find
    // if not found -- return false
    // the found code entity contains a client
    // that we need to extend
    //const extendedClient = Object.assign(codeFound.client, {
    //  id: codeFound.client.clientId
    // })
    // return Object.assign(codeFound, { client: extendedClient })
    return false
  }

  /**
   * Save authorization code
   *
   * @param {object } code model
   * @param {object} client, The client associated with the authorization code
   * @param {user} user, The user associated with the authorization code
   * @returns {object} An object representing the authorization code and associated data.
   */
  async saveAuthorizationCode(code, client, user) {
    try {
      return false
    } catch (e) {
      this._debugService('saveAuthorizationCode: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Invoked to remove an authorization code
   *
   * @param {object} code
   * @returns {boolean} removed
   * @remarks authorization_code grant
   */
  async revokeAuthorizationCode(code) {
    try {
      return false
    } catch (e) {
      this._debugService('revokeAuthorizationCode: ', e.name, e.message, e.errors)
      throw e
    }
  }

  /**
   * Invoked to check if the requested scope is valid for a particular client/user combination.
   *
   * If the requested scope is not provided
   *
   * 1. Validate the client scope(s) vs system scope(s), if no client scopes is found, return en
   * empty string (invalid).
   *
   * 2. Validate the user scope(s) vs the validated client scopes(s), return the valid user scope(s).
   *
   * If the requested scope(s) was available;
   *
   * 1. Validate the requested scope(s) vs system scopes, if requested scope(s) where not found,
   * return an empty string, invalid
   *
   * 2. Validate the client scope(s) vs the requested scope(s), if no client scope(s) is found,
   * return en empty string (invalid).
   *
   * 3. Validate the user scope(s) vs the client scope(s), return the valid user scope(s)
   *
   * @param {Object } user - user
   * @param {String} user.scope scope(s) of the user to be validated
   * @param {Object} client - client
   * @param {String} client.scope - scope(s) of the client to be validated
   * @param {String} scope - requested scope to validate against
   * @returns {String} valid scopes
   * @remarks If not implemented, used with client_credentials grant
   * @public
   */
  async validateScope(user, client, scope) {
    try {
      this._debugService(
        `validateScope: user :${user.scope}, client :${client.scope}, requested :${scope}`
      )
      let validScopes = ''

      // Get all scopes
      const collection = await this._connectCollection('scopes')
      const scopes = await collection.find({}).toArray()
      const VALID_SCOPES = scopes.map(scope => {
        return scope.name
      })

      // If no requested scope was in the authentication request
      if (scope === undefined) {
        // Filter out client scopes(s) from system scope(s)
        let clientFilteredScopes = client.scope
          .split(' ')
          .filter(s => VALID_SCOPES.indexOf(s) >= 0)
          .join(' ')

        if (clientFilteredScopes === '') {
          this._debugService('client scope(s) where not found, ', client.scope)
          return clientFilteredScopes
        }

        // Filter out user scope(s) from filtered client scope(s)
        validScopes = user.scope
          .split(' ')
          .filter(s => clientFilteredScopes.indexOf(s) >= 0)
          .join(' ')
      } else {
        // Filter out requested scope(s) from system scope(s)
        const requestFilteredScopes = scope
          .split(' ')
          .filter(s => VALID_SCOPES.indexOf(s) >= 0)
          .join(' ')

        if (requestFilteredScopes === '') {
          this._debugService(
            'requested scope(s) where not found in system scope(s), ',
            client.scope
          )
          return requestFilteredScopes
        }

        // Filter out client scope(s) from filtered request scope(s)
        const clientFilteredScopes = client.scope
          .split(' ')
          .filter(s => requestFilteredScopes.indexOf(s) >= 0)
          .join(' ')

        if (clientFilteredScopes === '') {
          this._debugService(
            'client scope(s) where not found in requested scope(s), ',
            client.scope
          )
          return clientFilteredScopes
        }

        // Filter out user scope(s) from filtered client scopes(s)
        validScopes = user.scope
          .split(' ')
          .filter(s => clientFilteredScopes.indexOf(s) >= 0)
          .join(' ')
      }

      this._debugService('validateScope: result:', validScopes)
      return validScopes
    } catch (e) {
      this._debugService('validateScope: ', e.name, e.message, e.errors)
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
  isNotAdminScope(scope) {
    return scope !== 'admin'
  }

  /**
   * Verify authorized access token scope(s) vs authentication scope(s)
   *
   * Invoked during request authentication to check if the provided access token
   * is authorized and valid the the request.
   *
   *
   * @public
   * @param {Object} token - contains the authorized scope for the user
   * @param {String} token.scope - scope(s) in the token
   * @param {String} scope - the requested scope(s) used with authenticate
   * @returns {Boolean} true if token scope is included in the requested scope
   * @throws {Error}
   * @remarks Is used authenticate() middleware
   */
  verifyScope(token, scope) {
    try {
      if (!token.scope) {
        this._debugService('verifyScope: no token scope', token)
        return false
      }
      const requestedScopes = scope.split(' ')
      const authorizedScopes = token.scope.split(' ')
      this._debugService('verifyScope: requested scopes', requestedScopes)
      this._debugService('verifyScope: authorized scopes', authorizedScopes)

      /**
       * If token scope contains admin scope - allow all
       */
      if (!authorizedScopes.every(this.isNotAdminScope)) {
        this._debugService('authorized token scope contained admin')
        return true
      }

      this._debugService('validating authorized scope vs requested scope')
      return authorizedScopes.every(s => requestedScopes.indexOf(s) >= 0)
    } catch (e) {
      this._debugService('verifyScope: ', e.name, e.message, e.errors)
      throw e
    }
  }
}

module.exports = Oauth2Model
