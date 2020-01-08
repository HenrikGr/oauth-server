/*
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */


module.exports = function(app, config) {

  require('./helmet')(app, config)

  require('./cors')(app, config)

  require('./body-parser')(app, config)
}
