/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

require('dotenv').config()

/**
 * Package information such as version, etc.
 */
const pkg = require('../package')

/**
 * OAuth 2 configurations
 */
const oAuthConfig = require('../server/config')

/**
 * API configurations
 */
const apiConfig = require('../api/config')

/**
 * Application configuration
 * @type {Object}
 */
const config = {
  appName: pkg.name,
  port: process.env.PORT || 6001,
  debug: !!process.env.DEBUG,
  environment: process.env.NODE_ENV || 'development',
  oAuthConfig: oAuthConfig,
  apiConfig: apiConfig
}

module.exports = config
