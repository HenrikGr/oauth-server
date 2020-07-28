/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Debug service
 * @type {debug.Debugger|*}
 */
const debugService = require('@hgc-ab/debug-service')('dbClient')

/**
 * Mongo client
 * @type {MongoClient}
 */
const MongoClient = require('mongodb').MongoClient

/**
 * Database configuration map
 * @type {{auth: string, account: string}}
 */
const connectionUrlMap = require('./config')


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
   * @param {String} dbName - The name of the database
   */
  constructor(dbName) {
    /**
     * Initial dbName
     * @type {String}
     */
    this.dbName = dbName

    /**
     * Database connection string map
     * @type {{auth: string, account: string}}
     */
    this.dbConnectionUrlMap = connectionUrlMap
  }

  /**
   * Check if dbName exist in the db connection string
   * 
   * @param {String} dbName - The database name
   */
  assertDbName(dbName) {
    if (dbName) {
      let isFound = false
      for (const prop in this.dbConnectionUrlMap) {
        if(prop === dbName.toLowerCase() ) {
          isFound = true
        }
      }

      if (!isFound) {
        throw new Error('Database connection string: The `dbName` is invalid ')
      }
    }
  }

  /**
   * Connect to mongo and return the connected client
   * 
   * @public
   * @param dbName The database name
   * @returns {Promise<MongoClient>} A connected dbClient intstance
   */
  async connect(dbName) {
    try {
      this.assertDbName(dbName)
      const dbUrl = dbName ? this.dbConnectionUrlMap[dbName] : this.dbConnectionUrlMap[this.dbName]
      return await MongoClient.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })

    } catch (e) {
      debugService('connectDb:', e.name, e.message)
      throw e
    }
  }

  // noinspection JSValidateJSDoc
  /**
   * Connect to specified mongo database and collection
   *
   * @public
   * @param collectionName The collection name
   * @param dbName The database name
   * @returns {Promise<Collection<DefaultSchema>>} a database collection
   */
  async connectCollection(collectionName, dbName) {
    try {
      /**
       * Connect the client to mongo
       * @type {MongoClient}
       */
      const client = await this.connect(dbName)

      /**
       * Get the database object
       * @type {Db}
       */
      const db = dbName ? client.db(dbName) : client.db(this.dbName)

      /**
       * Return the collection
       */
      return db.collection(collectionName)
    } catch (e) {
      debugService('connectCollection:', e.name, e.message)
      throw e
    }
  }

}


module.exports = DbClient
