/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Mongo client
 * @type {MongoClient}
 */
const MongoClient = require('mongodb').MongoClient

/**
 * @type {dbConnection}
 */
const dbConfig = require('./config')

/**
 * Connect function to data source
 * The native MongoDB driver does connection pooling for us, so we typically only want to
 * have one instance of the `Db` object returned from MongoClient#connect in our application.
 * @returns {Promise<Db>}
 */
async function connectDb() {
  return MongoClient.connect(dbConfig.mongoUrl, dbConfig.mongoOptions)
    .then(client => client.db())
    .catch(e => {
      throw e
    })
}

/**
 * Connect to specified collection
 * @param {String} collectionName - collection name
 * @returns {Promise<Collection>}
 */
async function connectCollection(collectionName) {
  try {
    let db = await connectDb()
    return db.collection(collectionName)
  } catch (e) {
    throw e
  }
}

module.exports = {
  connectDb,
  connectCollection
}
