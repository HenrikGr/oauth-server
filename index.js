/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

require('appmetrics-dash').attach()
require('dotenv').config()

const appConfig = require('./config')
const http = require('http')
const express = require('express')

const app = express()
const server = http.createServer(app)

//Load necessary middleware
require('./server/middleware')(app, appConfig)

// Connect oauth server and its route handler to express
require('./server')(app, appConfig)

// Connect errors handler to the express app
require('./server/error-handler')(app, appConfig)

// Listen on incoming request
server.listen(appConfig.port, function() {
  console.log(`${appConfig.appName} listening on: http://localhost:${appConfig.port}`)
})

module.exports = server
