# @hgc-ab/oauth-server

[![version](https://img.shields.io/npm/v/@hgc-ab/oauth-server.svg?style=flat-square)](http://npm.im/@hgc-ab/oauth-server)
[![downloads](https://img.shields.io/npm/dm/@hgc-ab/oauth-server.svg?style=flat-square)](http://npm-stat.com/charts.html?package=@hgc-ab/oauth-server&from=2020-01-22)
[![MIT License](https://img.shields.io/npm/l/@hgc-ab/oauth-server.svg?style=flat-square)](http://opensource.org/licenses/MIT)

# Purpose 
The repo contains an Oauth 2 Server to provide secure access to APIs via grants. 

#  Features
The model implemented support the following authorization flows;
 - password grant,
 - refresh_token grant,
 - client_credentials grant,
 - authorization_grant.

## Usage
You can either use it as a 
- standalone Node.js server, 
- run it in a docker container or as 
- a module integrated in your API Node.js server. 

## Standalone Node.js server

Installation
1. [Install Node.js][]
2. Clone this repo, git://github.com/henrikgr/oauth-server
3. cd into the app directory
4. Run `npm install` to install the app's dependencies
5. Run `npm start` to start the server


## Run in docker container

Install

## Install as a module

```shell script
npm i @hgc-ab/oauth-server
```

## TODO: How to use it in your API server

## Configuration

This package uses .env variable and the settings should be.

```shell script
# Set value to enforce debugging
DEBUG=@hgc-ab/oauth-server:*

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
