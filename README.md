# @hgc-ab/oauth-server

[![version](https://img.shields.io/npm/v/@hgc-ab/oauth-server.svg?style=flat-square)](http://npm.im/@hgc-ab/oauth-server)
[![downloads](https://img.shields.io/npm/dm/@hgc-ab/oauth-server.svg?style=flat-square)](http://npm-stat.com/charts.html?package=@hgc-ab/oauth-server&from=2020-01-22)
[![MIT License](https://img.shields.io/npm/l/@hgc-ab/oauth-server.svg?style=flat-square)](http://opensource.org/licenses/MIT)

# Purpose 
The package contain an authorization service providing OAuth2 grant flows.

The grant flows supported today are;
- password
- refresh_token
- client_credential

## Usage

Install

```shell script
npm i @hgc-ab/oauth-server
```

This package uses .env variable and the default setting are shown below.

```shell script
# Set value to enforce debugging
DEBUG=@hgc-ab/*

# Specify environment, development, production, test, etc
NODE_ENV=development

# Connection string to the auth database
DB_AUTH_URI=mongodb://localhost:27017/auth?readPreference=primary&ssl=false

```

Note: .env files requires that you load them as early in your code as possible, see example below.

```javascript
require('dotenv').config()
const oAuthServer = require('@hgc-ab/oauth-server')

```

## Node Application Metrics Dashboard
Node Application Metrics Dashboard (appmetrics-dash) provides a very easy-to-use web based dashboard to show the 
performance metrics of your running Node.js application.

To view your metrics on this server, you can check out the endpoint /appmetrics-dash/ on you host.


## License
MIT
