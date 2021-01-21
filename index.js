/*!
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Module dependency
 */
const dotenv = require('dotenv')

/**
 * Validate .env variables
 */
const result = dotenv.config()
if (result.error) {
  throw result.error
}

const http = require('http')
const express = require('express')

/**
 * App configuration
 */
const appConfig = require('./config/appConfig')

/**
 * Express.js app
 */
const app = express()

/**
 * Express based server
 */
const server = http.createServer(app)

/**
 * Load Express middleware
 */
require('./middleware')(app, appConfig)

/**
 * Load OAuth2 server middleware
 */
require('./server/routes')(app, appConfig)

// Connect errors handler for the resource server api
require('./error-handler')(app, appConfig)

/**
 * Listen on incoming request
 */
server.listen(appConfig.port, '0.0.0.0', function () {
  console.log(`${appConfig.appName} listening on: ${appConfig.port}`)
})

/**
 * Expose server
 * @public
 */
module.exports = server
