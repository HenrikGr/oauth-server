/**
 * @prettier
 * @copyright (c) 2020 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */


 /**
 * Database connection strings map for mongo atlas
 * @type {{auth: string, account: string}}
 */
const connectionUrlMap = {
    auth: process.env.DB_AUTH_URI,
    account: process.env.DB_ACCOUNT_URI,
  }
  
  module.exports = connectionUrlMap
  