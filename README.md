# @hgc-ab/oauth-server

[![version](https://img.shields.io/npm/v/@hgc-ab/oauth-server.svg?style=flat-square)](http://npm.im/@hgc-ab/oauth-server)
[![downloads](https://img.shields.io/npm/dm/@hgc-ab/oauth-server.svg?style=flat-square)](http://npm-stat.com/charts.html?package=@hgc-ab/oauth-server&from=2020-01-22)
[![MIT License](https://img.shields.io/npm/l/@hgc-ab/oauth-server.svg?style=flat-square)](http://opensource.org/licenses/MIT)

An express.js implementation of an OAuth2 server using;

- @hgc-ab/oauth-service, an OAuth2 Library for Node.js,
- MongoDb - for the data model injected to the @hgc-ab/oauth-service library.

**Background**
The OAuth2 server introducing an authorization layer and separating the role of the client from that of the resource
owner.  In OAuth2, the client requests access to resources controlled by the resource owner and hosted by the resource server,
and is issued a different set of credentials than those of the resource owner.

Instead of using the resource owner's credentials to access protected resources, the client obtains an access token -- a string denoting a
specific scope, lifetime, and other access attributes.  Access tokens are issued to third-party clients by an authorization server with the
approval of the resource owner.  The client uses the access token to access the protected resources hosted by the resource server.

## Installation

Installation

1. [Install Node.js][]
2. Clone this repo, git://github.com/henrikgr/oauth-server
3. cd into the target directory
4. Run `npm install` to install the app's dependencies
5. Run `npm start` to start the server

## Configuration

This OAuth2 server uses .env variable, the settings should be.

```shell script
# Set value to enforce debugging
DEBUG=@hgc-ab/oauth-server:*

# Specify environment, development, production, test, etc
NODE_ENV=development

#
# OAuth2 server endpoints
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

## License

MIT
