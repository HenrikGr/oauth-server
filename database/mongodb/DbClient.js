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
const { log, error} = require('@hgc-ab/debug-service')('repository:model:mongo:dbClient')

/**
 * Database connection string map
 * @type {{auth: string, account: string}}
 */
const connectionUrlMap = require('./dbConfig')

/**
 * Implements methods to connect to a Mongo server
 * to access a database and it's collections
 *
 * @example Instanciate an instance and connect to a collection
 * const dbClient = new DbClient('dbName')
 * await dbClient.connectCollectionName('dbName', 'collectionName')
 * 
 * or
 * 
 * await dbClient.connectCollectionName('collectionName')
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
     * Should contain supported databases only
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
   * Getter for the cached database instance
   * 
   * @returns {Db} The cached database instance
   */
  get db() {
    return this._db
  }

  /**
   * Setter to set the cached database instance
   * 
   * @param {Db} A database instance
   */
  set db(value) {
    this._db = value
  }

  /**
   * Connect to mongo and return a database instance
   *
   * @public
   * @param {String} dbName The database name
   * @returns {Promise<Db>} db instance
   */
  async connect(dbName) {
    try {
      log('connect: returning a db instance')
      const dbUrl = dbName ? this.dbConnectionUrlMap[dbName] : this.dbConnectionUrlMap[this.dbName]
      const client = await MongoClient.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: false,
      })

      return client.db(dbName)
    } catch (e) {
      error('connect: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Connect to specified mongo collection
   *
   * @public
   * @param {String} collectionName The collection name
   * @param {String} dbName The database name
   * @returns {Promise<Collection<DefaultSchema>>} collection instance
   */
  async connectCollection(collectionName, dbName) {
    try {
      log('connectCollection: ', collectionName)
      // Id db instance exist in cache - get the collection
      if (!dbName && this.db) {
        return this.db.collection(collectionName)
      } else {
        // Get a new db instance to the cache
        this.db = await this.connect(dbName)
        return this.db.collection(collectionName)
      }
    } catch (e) {
      error('connectCollection:', e.name, e.message)
      throw e
    }
  }
}

exports = module.exports = DbClient
