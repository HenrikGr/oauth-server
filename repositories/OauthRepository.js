const MongoError = require('mongodb').MongoError
const ObjectId = require('mongodb').ObjectId
const { connectCollection } = require('./connection/connectionService')
const debugService = require('@hgc-ab/debug-service')
const cryptoService = require('@hgc-ab/crypto-service')

/**
 * An instance of the class implements access to
 * the provided database and collection (table).
 *
 * It provides methods to create, find,
 * update and delete a client in the database.
 *
 * There is also a connect method providing capability
 * to build aggregation pipelines and subscribe to events
 * on the database collection.
 *
 * @class
 */
class OauthRepository {
  /**
   * Create a new instance
   * @param {String} dbName - The name of the database
   */
  constructor(dbName = 'oauth') {
    /**
     * Database name
     * @type {string}
     */
    this.dbName = dbName
    /**
     * Database connection services
     * @type {connectCollection|(function(String, String=): Promise<Collection>)}
     */
    this.connectCollection = connectCollection
    /**
     *
     * @type {{setClientSecret: function(): string, isValidPassword: function(string, string, string): boolean, saltAndHashPassword: function(string): {salt: string, hash: string}, setClientId: function(): string}}
     */
    this.cryptoService = cryptoService
    /**
     * Debugging service using the collection name as namespace
     * @type {debug.Debugger|*}
     */
    this.debugService = debugService('oauthRepository')
  }

  /**
   * Assert a password against credentials
   *
   * @param {String} password - password
   * @param {Object} credential - credential object
   * @param {String} credential.password.salt - salted password
   * @params {String} credential.password.hash - hashed password
   */
  assertPassword(password, credential) {
    try {
      return this.cryptoService.isValidPassword(
        password,
        credential.password.salt,
        credential.password.hash
      )
    } catch (e) {
      this.debugService('assertPassword: ', e.name, e.message)
      // If invalid password - return false
      if (e.message === 'Invalid password') {
        return false
      } else {
        throw e
      }
    }
  }

  // noinspection JSValidateJSDoc
  /**
   * Connect to a collection
   *
   * @param {String} collectionName - The name of the collection
   * @returns {Promise<Collection<DefaultSchema>>}
   */
  async connect(collectionName) {
    return await this.connectCollection(this.dbName, collectionName)
  }

  /**
   * Invoked to fetch client matching the clientId and clientSecret combination
   * TODO: Ensure lifetimes for access and refresh token can be registered in the client
   *
   * @param {String} clientId - The client id for the grant used
   * @param {String} clientSecret - The client secret for the grant used
   * @returns {Promise<boolean|any>} - The client with an id property
   * @throws {MongoError|Error}
   */
  async getClient(clientId, clientSecret) {
    try {
      this.debugService('getClient:', `${clientId}: ${clientSecret}`)
      let query = { clientId: clientId }
      if (clientSecret) {
        query.clientSecret = clientSecret
      }

      let collection = await this.connect('clients')
      let client = await collection.findOne(query, {})
      if (!client) {
        return false
      }

      return {
        id: client._id.toString(),
        name: client.name,
        redirectUris: client.redirectUris,
        grants: client.grants,
        scope: client.scope,
        // accessTokenLifetime: 121,
        // refreshTokenLifetime: 121,
        user: {
          id: client.user._id.toString(),
          username: client.user.username,
        }
      }
    } catch (e) {
      this.debugService('getClient: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to fetch a user and its credentials to validate
   * username/password combination
   *
   * @param {String} username - The username of the user
   * @param {String} password - The password of the user
   * @returns {Object} user - The user or a false value
   * @throws {MongoError|Error}
   * @remarks Is required for the password grant.
   */
  async getUser(username, password) {
    try {
      this.debugService('getUser:', `${username}: ${password}`)
      let query = { username: username }

      // noinspection JSValidateJSDoc
      /**
       * Perform a left inner join to aggregate a result from users and credentials collection
       * @type {Collection<DefaultSchema>}
       */
      let collection = await this.connect('users')
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
      let user = aggResult[0]
      let credential = user.credentials[0]
      return this.assertPassword(password, credential) ? {
        id: user._id.toString(),
        username: user.username,
        scope: user.scope,
      } : false
    } catch (e) {
      this.debugService('getUser: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to retrieve the user associated with the specified client
   *
   * @param {Object} client - Client previously obtained through getClient
   * @param {String} client.user.username - username associated with the user
   * @returns {Object} user - The user associated with the client
   * @throws {MongoError|Error}
   * @remarks Is required for the client_credentials grant
   */
  async getUserFromClient(client) {
    try {
      this.debugService('getUserFromClient:', client.user.username)
      let query = { username: client.user.username }

      let collection = await this.connect('users')
      let user = await collection.findOne(query, {})
      return !user ? false : {
        id: user._id.toString(),
        username: user.username,
        scope: user.scope,
      }
    } catch (e) {
      this.debugService('getUserFromClient: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to save an access token and optionally
   * a refresh token depending on the grant type.
   *
   * @param {Object} token - The token object
   * @param {String} token.accessToken - The access token to be saved.
   * @param {Date} token.accessTokenExpiresAt - The expiry time of the access token.
   * @param {String} token.refreshToken - The refresh token to be saved.
   * @param {Date} token.refreshTokenExpiresAt - The expiry time of the refresh token.
   * @param {String} token.scope - The scope of the tokens
   * @param {Object} client - The client associated with the token(s)
   * @param {Object} user - The user associated with the token(s)
   * @returns {Object} object - An Object representing the token(s) and associated client and user
   * @throws {MongoError|Error}
   */
  async saveToken(token, client, user) {
    try {
      this.debugService('saveToken:', `${token.accessToken}`)

      let d = new Date()
      let collection = await this.connect('access_tokens')
      let accessToken = await collection.insertOne({
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
        updatedAt: d,
        createdAt: d
      })

      if (token.refreshToken) {
        collection = await this.connect('refresh_tokens')
        let refreshToken = await collection.insertOne({
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
          updatedAt: d,
          createdAt: d
        })
      }

      if (accessToken.insertedCount === 1) {
        return {
          ...token,
          client: { id: accessToken.ops[0].client._id },
          user: { id: accessToken.ops[0].user._id }
        }
      }

      return false
    } catch (e) {
      this.debugService('saveToken: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to fetch an access token and it's associated client and user
   * TODO: Ensure lifetimes for access and refresh token can be registered in the client
   *
   * @param {String} accessToken - The access token
   * @return {Object} The access token and associated client and user
   * @throws {MongoError|Error}
   */
  async getAccessToken(accessToken) {
    try {
      this.debugService('getAccessToken:', `${accessToken}`)
      let query = { token: accessToken }

      let collection = await this.connect('access_tokens')
      let aggResult = await collection
        .aggregate([
          { $match: query },
          { $unwind:"$client"},
          { $lookup: {
              from: 'clients',
              localField: 'client.name',
              foreignField: 'name',
              as: 'client',
            }},
          { $unwind: '$client'},
          { $unwind:"$user"},
          { $lookup: {
              from: 'users',
              localField: 'user.username',
              foreignField: 'username',
              as: 'user',
            }},
          { $unwind: '$user'},
        ])
        .toArray()

      if (!aggResult[0]) {
        return false
      }

      let token = aggResult[0]

      return {
        accessToken: token.token,
        accessTokenExpiresAt: token.expiresAt,
        scope: token.scope,
        client: {
          id: token.client._id.toString(),
          scope: token.client.scope,
          grants: token.client.grants,
          redirectUris: token.client.redirectUris,
          // accessTokenLifetime: 121,
          // refreshTokenLifetime: 121,
        },
        user: {
          id: token.user._id.toString(),
          scope: token.user.scope,
        },
      }
    } catch (e) {
      this.debugService('getAccessToken: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to fetch a refresh token and it's associated client and user
   * TODO: Ensure lifetimes for access and refresh token can be registered in the client
   *
   * @param {String} refreshToken - The refresh token to find
   * @return {Object} The refresh token and associated client and user
   * @throws {MongoError|Error}
   * @remarks Is required for the refresh_token grant
   */
  async getRefreshToken(refreshToken) {
    try {
      this.debugService('getRefreshToken: ', `${refreshToken}`)
      let query = { token: refreshToken }

      let collection = await this.connect('refresh_tokens')
      let aggResult = await collection
        .aggregate([
          { $match: query },
          { $unwind:"$client"},
          { $lookup: {
              from: 'clients',
              localField: 'client.name',
              foreignField: 'name',
              as: 'client',
            }},
          { $unwind: '$client'},
          { $unwind:"$user"},
          { $lookup: {
              from: 'users',
              localField: 'user.username',
              foreignField: 'username',
              as: 'user',
            }},
          { $unwind: '$user'},
        ])
        .toArray()

      if (!aggResult[0]) {
        return false
      }

      let token = aggResult[0]

      return {
        refreshToken: token.token,
        refreshTokenExpiresAt: token.expiresAt,
        scope: token.scope,
        client: {
          id: token.client._id.toString(),
          scope: token.client.scope,
          grants: token.client.grants,
          redirectUris: token.client.redirectUris,
          // accessTokenLifetime: 121,
          // refreshTokenLifetime: 121,
        },
        user: {
          id: token.user._id.toString(),
          scope: token.user.scope,
        },
      }
    } catch (e) {
      this.debugService('getRefreshToken: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Revoke a refresh token
   *
   * @param {Object} token - token object retrieved from getRefreshToken
   * @param {String} token.refreshToken - refresh token
   * @returns {boolean} - true if revoked
   * @throws {MongoError|Error}
   * @remarks Is called on refresh_token grant to revoke old refresh token
   */
  async revokeToken(token) {
    try {
      this.debugService('revokeToken:', token.refreshToken)
      let filter = { token: token.refreshToken }
      let collection = await this.connect('refresh_tokens')
      let result = await collection.deleteOne(filter)
      return Boolean(result.deletedCount === 1)
    } catch (e) {
      this.debugService('revokeToken: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to retrieve an existing authorization code previously saved through
   * TODO: Ensure lifetimes for access and refresh token can be registered in the client
   *
   * @param {string} authorizationCode
   * @returns {object} code model
   * @support authorization_code grant
   */
  async getAuthorizationCode(authorizationCode) {
    try {
      this.debugService('getAuthorizationCode: ', authorizationCode)
      let query = { code: authorizationCode }
      let collection = await this.connect('codes')
      let aggResult = await collection
        .aggregate([
          { $match: query },
          { $unwind:"$client"},
          { $lookup: {
              from: 'clients',
              localField: 'client.name',
              foreignField: 'name',
              as: 'client',
            }},
          { $unwind: '$client'},
          { $unwind:"$user"},
          { $lookup: {
              from: 'users',
              localField: 'user.username',
              foreignField: 'username',
              as: 'user',
            }},
          { $unwind: '$user'},
        ])
        .toArray()

      this.debugService('getAuthorizationCode - aggResult: ', aggResult[0])

      if (!aggResult[0]) {
        return false
      }

      let code = aggResult[0]

      return {
        code: code.code,
        scope: code.scope,
        redirectUri: code.redirectUri,
        expiresAt: code.expiresAt,
        client: {
          id: code.client._id.toString(),
          redirectUris: code.client.redirectUris,
          grants: code.client.grants,
          // accessTokenLifetime: 121,
          // refreshTokenLifetime: 121,
        },
        user: { ...code.user }
      }
    } catch (e) {
      this.debugService('getAuthorizationCode: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Save authorization code
   *
   * @param {Object} code model
   * @param {String} code.authorizationCode
   * @param {String} code.scope
   * @param {String} code.expiresAt
   * @param {object} client, The client associated with the authorization code
   * @param {user} user, The user associated with the authorization code
   * @returns {object} An object representing the authorization code and associated data.
   */
  async saveAuthorizationCode({ authorizationCode, scope, redirectUri, expiresAt }, client, user) {
    try {
      this.debugService('saveAuthorizationCode:', `${authorizationCode} ${scope}`)
      this.debugService('saveAuthorizationCode:', client)
      this.debugService('saveAuthorizationCode:', user)
      let d = new Date()
      let collection = await this.connect('codes')
      let code = await collection.insertOne({
        code: authorizationCode,
        scope: scope,
        redirectUri: redirectUri,
        expiresAt: expiresAt,
        client: {
          _id: ObjectId(client.id),
          name: client.name,
        },
        user: {
          _id: user._id,
          username: user.username,
        },
        updatedAt: d,
        createdAt: d,
      })

      return {
        authorizationCode: code.ops[0].code,
        expiresAt: code.ops[0].expiresAt,
        redirectUri: code.ops[0].redirectUri,
        scope: code.ops[0].scope,
        client: { id: client.id },
        user: {
          ...user
        }
      }
    } catch (e) {
      this.debugService('saveAuthorizationCode: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to remove an authorization code
   *
   * @param {Object} code
   * @returns {boolean} removed
   * @support authorization_code grant
   */
  async revokeAuthorizationCode(code) {
    try {
      this.debugService('revokeAuthorizationCode:', `${code.code}`)
      let filter = { code: code.code }
      let collection = await this.connect('codes')
      let result = await collection.deleteOne(filter)
      return Boolean(result.deletedCount === 1)
    } catch (e) {
      this.debugService('revokeAuthorizationCode: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Invoked to check if the requested scope is valid for a particular client/user combination.
   *
   * If the requested scope is not provided
   * 1. Validate the client scope(s) vs system scope(s), if no client scopes is found, return en
   * empty string (invalid).
   *
   * 2. Validate the user scope(s) vs the validated client scopes(s), return the valid user scope(s).
   *
   * If the requested scope(s) was available;
   * 1. Validate the requested scope(s) vs system scopes, if requested scope(s) where not found,
   * return an empty string, invalid
   *
   * 2. Validate the client scope(s) vs the requested scope(s), if no client scope(s) is found,
   * return en empty string (invalid).
   *
   * 3. Validate the user scope(s) vs the client scope(s), return the valid user scope(s)
   *
   * @param {Object} user - user
   * @param {String} user.scope scope(s) of the user to be validated
   * @param {Object} client - client
   * @param {String} client.scope - scope(s) of the client to be validated
   * @param {String} scope - requested scope to validate against
   * @returns {String} valid scopes
   * @public
   */
  async validateScope(user, client, scope) {
    try {
      this.debugService(
        `validateScope, user scope: ${user.scope}, client scope: ${client.scope}, requested: ${scope}`
      )
      let validScopes = ''

      // Get all scopes
      const VALID_SCOPES = ['profile', 'admin']

      // If no requested scope was in the authentication request
      if (scope === undefined) {
        // Filter out client scopes(s) from system scope(s)
        let clientFilteredScopes = client.scope
          .split(' ')
          .filter((s) => VALID_SCOPES.indexOf(s) >= 0)
          .join(' ')

        if (clientFilteredScopes === '') {
          this.debugService('client scope(s) where not found, ', client.scope)
          return clientFilteredScopes
        }

        // Filter out user scope(s) from filtered client scope(s)
        validScopes = user.scope
          .split(' ')
          .filter((s) => clientFilteredScopes.indexOf(s) >= 0)
          .join(' ')
      } else {
        // Filter out requested scope(s) from system scope(s)
        const requestFilteredScopes = scope
          .split(' ')
          .filter((s) => VALID_SCOPES.indexOf(s) >= 0)
          .join(' ')

        if (requestFilteredScopes === '') {
          this.debugService('requested scope(s) where not found in system scope(s), ', client.scope)
          return requestFilteredScopes
        }

        // Filter out client scope(s) from filtered request scope(s)
        const clientFilteredScopes = client.scope
          .split(' ')
          .filter((s) => requestFilteredScopes.indexOf(s) >= 0)
          .join(' ')

        if (clientFilteredScopes === '') {
          this.debugService('client scope(s) where not found in requested scope(s), ', client.scope)
          return clientFilteredScopes
        }

        // Filter out user scope(s) from filtered client scopes(s)
        validScopes = user.scope
          .split(' ')
          .filter((s) => clientFilteredScopes.indexOf(s) >= 0)
          .join(' ')
      }

      this.debugService('validateScope: result:', validScopes)
      return validScopes
    } catch (e) {
      this.debugService('validateScope: ', e.name, e.message, e.errors)
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
        this.debugService('verifyScope: no token scope', token)
        return false
      }
      const requestedScopes = scope.split(' ')
      const authorizedScopes = token.scope.split(' ')
      this.debugService('verifyScope: requested scopes', requestedScopes)
      this.debugService('verifyScope: authorized scopes', authorizedScopes)

      /**
       * If token scope contains admin scope - allow all
       */
      if (!authorizedScopes.every(this.isNotAdminScope)) {
        this.debugService('authorized token scope contained admin')
        return true
      }

      this.debugService('validating authorized scope vs requested scope')
      return authorizedScopes.every((s) => requestedScopes.indexOf(s) >= 0)
    } catch (e) {
      this.debugService('verifyScope: ', e.name, e.message, e.errors)
      throw e
    }
  }
}

module.exports = OauthRepository
