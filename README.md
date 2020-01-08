# @hgc-ab/authorization-service

[![version](https://img.shields.io/npm/v/@hgc-ab/authorization-service.svg?style=flat-square)](http://npm.im/@hgc-ab/authorization-service)
[![downloads](https://img.shields.io/npm/dm/@hgc-ab/authorization-service.svg?style=flat-square)](http://npm-stat.com/charts.html?package=@hgc-ab/authorization-service&from=2020-01-07)
[![MIT License](https://img.shields.io/npm/l/@hgc-ab/authorization-service.svg?style=flat-square)](http://opensource.org/licenses/MIT)

# Authorization package 
The package contain an authorization service providing OAuth2 grant flows to authorize a user.

The grant flows supported today are;
- password
- refresh_token
- client_credential

## Usage

Install

```shell script
npm i @hgc-ab/authorization-service
```

This package uses .env variable to set;
- the connection string to the database,
- endpoint URI's,
- and debug flag


```shell script
# Set any value to enforce debugging
DEBUG=true
MONGO_DB_URI=mongodb://localhost:27017/auth?readPreference=primary&ssl=false
ENDPOINT_ROOT=/oauth
ENDPOINT_TOKEN=/tokens
ENDPOINT_AUTHORIZE=/authorize
```

The services uses default endpoints such as;
- /oauth/tokens
- /oauth/authorize

Note: .env files requires that you load them as early in your code as possible, see example below.

```javascript
require('dotenv').config()
const server = require('@hgc-ab/authorization-service')

// Export your authorization service
module.exports = server

```

## Node Application Metrics Dashboard
Node Application Metrics Dashboard (appmetrics-dash) provides a very easy-to-use web based dashboard to show the 
performance metrics of your running Node.js application.

To view your metrics on this server, you can check out the endpoint /appmetrics-dash/ on you host.


## License
MIT
