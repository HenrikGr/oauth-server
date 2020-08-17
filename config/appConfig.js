/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Package information such as version, etc.
 */
const pkg = require('../package')

/**
 * OAuth 2 configurations
 */
const oAuthConfig = require('../server/config')

/**
 * Application configuration
 * @type {Object}
 */
const appConfig = {
  appName: pkg.name,
  port: process.env.PORT || 6001,
  debug: !!process.env.DEBUG,
  environment: process.env.NODE_ENV || 'development',
  oAuthConfig: oAuthConfig,
}

module.exports = appConfig
