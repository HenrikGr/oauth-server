# @hgc-ab/oauth-server

[![version](https://img.shields.io/npm/v/@hgc-ab/oauth-server.svg?style=flat-square)](http://npm.im/@hgc-ab/oauth-server)
[![downloads](https://img.shields.io/npm/dm/@hgc-ab/oauth-server.svg?style=flat-square)](http://npm-stat.com/charts.html?package=@hgc-ab/oauth-server&from=2020-01-22)
[![MIT License](https://img.shields.io/npm/l/@hgc-ab/oauth-server.svg?style=flat-square)](http://opensource.org/licenses/MIT)

An express.js implementation of an OAuth 2 Server using;
 - @hgc-ab/oauth-service, an Oauth 2 Library for Node.js,
 - Mongo Db - for the data model injected to the @hgc-ab/oauth-service library,     


# Installation

Installation
1. [Install Node.js][]
2. Clone this repo, git://github.com/henrikgr/oauth-server
3. cd into the app directory
4. Run `npm install` to install the app's dependencies
5. Run `npm start` to start the server


## Configuration

This oauth-server uses .env variable, the settings should be.

```shell script
# Set value to enforce debugging
DEBUG=@hgc-ab/oauth-server:*

# Specify environment, development, production, test, etc
NODE_ENV=development

#
# Oauth 2 server endpoints
#
API_VERSION=/v1
ENDPOINT_ROOT=/oauth
ENDPOINT_TOKEN=/tokens
ENDPOINT_AUTHORIZE=/authorize
ENDPOINT_INTROSPECT=/introspect
ENDPOINT_REVOKE=/revoke

# Connection string to the auth database
DB_AUTH_URI=mongodb://localhost:27017/auth?readPreference=primary&ssl=false

```
Note: .env files requires that you load them as early in your code as possible, see example below.

```javascript
// server.js
require('dotenv').config()
const OAuth2Server = require('@hgc-ab/oauth-service')
const { Request, Response } = OAuth2Server

const model = require('./database/model')
const oAuth2Server = new OAuth2Server(model)

exports = module.exports = oAuth2Server
exports.Request = Request
exports.Response = Response
```

## Middleware
You need to create your own Express.js middleware for the OAuth 2 endpoints, for example:

```javascript
// middleware.js
const oAuth2Server = require('./server')
const { Request, Response } = oAuth2Server


// Authorization endpoint, used by the client to obtain authorization grant from the resource owner.
function authorize() {
  return async function authorizeHandler(req, res) {
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.authorize(request, response, options)
      return res
        .status(response.status)
        .set(response.headers)
        .end()
    } catch (e) {
      return res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()
    }
  }
}

// Token endpoint, used by the client to exchange an authorization grant for an access token, typically 
// together with client authentication
function token(options) {
  return async function tokenHandler(req, res) {
    const request = new Request(req)
    const response = new Response(res)

    try {
      await oAuth2Server.token(request, response, options)
      return res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()
    } catch (e) {
      return res
        .status(response.status)
        .set(response.headers)
        .json(response.body)
        .end()
    }
  }
}
```


## Node Application Metrics Dashboard
Node Application Metrics Dashboard (appmetrics-dash) provides a very easy-to-use web based dashboard to show the 
performance metrics of your running Node.js application.

To view your metrics on this server, you can check out the endpoint /appmetrics-dash/ on you host.


## License
MIT
