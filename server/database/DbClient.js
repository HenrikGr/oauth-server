/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Module dependencies
 * @private
 */
const MongoClient = require('mongodb').MongoClient

/**
 * Module dependency
 * @private
 */
const debugService = require('@hgc-ab/debug-service')('repository:dbClient')

/**
 * Database connection string map
 * @type {{auth: string, account: string}}
 */
const connectionUrlMap = require('./dbConfig')

/**
 * DbClient class
 *
 * An instance of the class implements access to
 * the provided database and collection (table).
 *
 * It provides methods to connect to database and collection
 * in a mongo db environment
 *
 * @example
 * const dbClient = new DbClient('dbName')
 * dbClient.connectCollectionName('dbName', 'collectionName')
 * or
 * dbClient.connectCollectionName('collectionName')
 *
 * @class
 */
class DbClient {
  /**
   * create a DbClient instance
   *
   * @param {String} dbName The name of the database
   */
  constructor(dbName) {
    /**
     * Initial dbName
     *
     * @private
     * @type {String}
     */
    this.dbName = dbName

    /**
     * Database connection string map
     *
     * @private
     * @type {{auth: string, account: string}}
     */
    this.dbConnectionUrlMap = connectionUrlMap

    /**
     * Database instance cache
     *
     * @private
     * @type {Db}
     */
    this._db = null
  }

  /**
   * Gette for the cached database instance
   */
  get db() {
    return this._db
  }

  /**
   * Setter to set the cached database instance
   */
  set db(value) {
    this._db = value
  }

  /**
   * Connect to mongo and return a database instance
   *
   * @public
   * @param {String} dbName The database name
   * @returns {Promise<Db>} A db instance
   */
  async connect(dbName) {
    try {
      debugService('connect: returning a db instance')
      const dbUrl = dbName ? this.dbConnectionUrlMap[dbName] : this.dbConnectionUrlMap[this.dbName]
      const client = await MongoClient.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })

      return client.db(dbName)
    } catch (e) {
      debugService('connect: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Connect to specified mongo collection and database
   *
   * @public
   * @param {String} collectionName The collection name
   * @param {String} dbName The database name
   * @returns {Promise<Collection<DefaultSchema>>} a database collection
   */
  async connectCollection(collectionName, dbName) {
    try {
      debugService('connectCollection: ', collectionName)
      // Id db instance exist in cache - get the collection
      if (!dbName && this.db) {
        return this.db.collection(collectionName)
      } else {
        // Get a new db instance to the cache
        this.db = await this.connect(dbName)
        return this.db.collection(collectionName)
      }
    } catch (e) {
      debugService('connectCollection:', e.name, e.message)
      throw e
    }
  }
}

module.exports = DbClient
