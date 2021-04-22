/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

const MongoClient = require('mongodb').MongoClient
const { createClientLogger } = require('@hgc-sdk/logger')
const logger = createClientLogger('DbClient')
const connectionUrlMap = require('./dbConfig')

/**
 * Implements methods to connect to a Mongo server
 * to access a database and it's collections
 */
class DbClient {
  /**
   * create a DbClient instance
   * @param {String} dbName The name of the database
   */
  constructor(dbName) {
    this.dbName = dbName
    this.dbConnectionUrlMap = connectionUrlMap
  }

  /**
   * Connect to mongo and return a database instance
   * @public
   * @returns {Promise<Db>} db instance
   */
  async connect() {
    try {
      logger.verbose('connect: to database: ', this.dbName)
      const dbUrl = this.dbConnectionUrlMap[this.dbName]
      const client = await MongoClient.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        //retryWrites: false,
      })

      return client.db(this.dbName)
    } catch (e) {
      logger.error('connect: ', e.name, e.message)
      throw e
    }
  }

  /**
   * Connect to specified mongo collection
   * @public
   * @param {String} collectionName The collection name
   * @returns {Promise<Collection<DefaultSchema>>} collection instance
   */
  async connectCollection(collectionName) {
    try {
      logger.verbose('connectCollection: ', collectionName)
      // Get a new db instance to the cache
      const db = await this.connect()
      return db.collection(collectionName)
    } catch (e) {
      logger.error('connectCollection:', e.name, e.message)
      throw e
    }
  }
}

exports = module.exports = DbClient
