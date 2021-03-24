/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Database connection strings map
 * @type {{UserDb: *, ApplicationDb: *, OAuthDb: *}}
 */
const connectionUrlMap = {
  OAuthDb: process.env.DB_OAUTH_URI,
  UserDb: process.env.DB_USER_URI,
  ApplicationDb: process.env.DB_APPLICATION_URI,
}

module.exports = connectionUrlMap
