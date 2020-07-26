/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

require('dotenv').config()
require('appmetrics-dash').attach()

const appConfig = require('./config')
const http = require('http')
const express = require('express')

const app = express()
const server = http.createServer(app)

/**
 * Load necessary middleware
 */
require('./middleware')(app, appConfig)

/**
 * Load OAuth 2 server middleware
 */
require('./server/routes')(app, appConfig)

/**
 * Just a test api using this server as a resource server as well
 */
require('./api')(app, appConfig)

// Connect errors handler to the resource server api
require('./api/error-handler')(app, appConfig)

// Listen on incoming request
server.listen(appConfig.port, '0.0.0.0',function() {
  console.log(`${appConfig.appName} listening on: ${appConfig.port}`)
})

module.exports = server
