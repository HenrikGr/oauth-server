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
const debugService = require('@hgc-ab/debug-service')('connectionService')

/**
 * Mongo client
 * @type {MongoClient}
 */
const MongoClient = require('mongodb').MongoClient

/**
 * Database configurations = 'auth
 *
 * @type {{auth: {dbConnection}, account: {dbConnection}}}
 */
const dbConfig = require('./config')


/**
 * Connect function to data source
 *
 * The native MongoDB driver does connection pooling for us, so we typically only want to
 * have one instance of the `Db` object returned from MongoClient#connect in our application.
 *
 * @public
 * @param {string} dbName - database name
 * @returns {Promise<Db>} - the database
 * @throws {MongoError|Error}
 */
async function connectDb(dbName = 'auth') {
  try {
    debugService('mongoUrl: ', dbConfig[dbName].mongoUrl)
    let client = await MongoClient.connect(dbConfig[dbName].mongoUrl, dbConfig[dbName].mongoOptions)
    return client.db(dbName)
  } catch (e) {
    debugService('connectDb:', e.name, e.message)
    throw e
  }
}

/**
 * Connect to specified database and collection
 *
 * @public
 * @param {String} dbName - database name
 * @param {String} collectionName - collection name
 * @returns {Promise<Collection>} - the collection
 * @throws {MongoError|Error}
 */
async function connectCollection(dbName, collectionName) {
  try {
    let db = await connectDb(dbName)
    return db.collection(collectionName)
  } catch (e) {
    debugService('connectCollection:', e.name, e.message)
    throw e
  }
}


module.exports = {
  connectDb,
  connectCollection,
}
