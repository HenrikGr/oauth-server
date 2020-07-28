/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

const apiVersion = process.env.API_VERSION || '/v1'

/**
 * Configuration for the resource server api endpoints
 */
const apiConfig = {
  root: process.env.ENDPOINT_API || '/api' + apiVersion,
  status: {
    uri: '/status',
    scope: ''
  },
  secret: {
    uri: '/secret',
    scope: 'profile'
  }
}

module.exports = apiConfig
