/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described
 * and found in the LICENSE file in the root directory of this source tree.
 */

const debugService = require('../debugService')
const { connectCollection } = require('../db/mongo/connectionService')
const Oauth2Model = require('./Oauth2Model')

// Inject services to be used in the model
const oauth2Dependencies = {
  connectCollection: connectCollection,
  debugService: debugService('oauth2')
}

module.exports = new Oauth2Model(oauth2Dependencies)

