/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

/**
 * @typedef {Object} dbConnection
 * @property {String} mongoUrl - connection string
 * @property {Object} mongoOptions - optional settings for connection
 * @property {Boolean} mongoOptions.useNewUrlParser
 * @property {Boolean} mongoOptions.useUnifiedTopology
 */

/**
 * Database connection configuration
 * @type {dbConnection}
 */
const dbConfig = {
  mongoUrl: process.env.DB_AUTH_URI,
  mongoOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}

module.exports = dbConfig
