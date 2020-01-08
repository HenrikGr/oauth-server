/**
 * @prettier
 * @copyright (c) 2019 - present, HGC-AB
 * @licence This source code is licensed under the MIT license described and found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * API Base Error
 * @param {number} status - errors status
 * @param {string} name - errors name
 * @param {string} message - errors message
 * @param {object} details - additional errors details, default {}
 * @constructor
 */
function APIError(status, name, message, details) {
  this.status = status
  this.name = name
  this.message = message
  // If not an empty details object
  if (!(Object.keys(details).length === 0 && details.constructor === Object)) {
    this.errors = details
  }
}
APIError.prototype = Object.create(Error.prototype)
APIError.prototype.constructor = APIError

/**
 * This response means that server could not understand the request due to invalid syntax.
 * @param {string} message - errors message
 * @param {object} details - additional errors details, default {}
 * @returns {object} - BadRequest errors object with status 400, name, message and details
 * @constructor
 */
function BadRequest(message, details = {}) {
  APIError.call(this, 400, 'BadRequest', message, details)
}
BadRequest.prototype = Object.create(APIError.prototype)

/**
 * The client must authenticate itself to get the requested response.
 * @param {string} message - errors message
 * @param {object} details - additional errors details, default {}
 * @returns {object} - Unauthorized errors object with status 401, name, message and details
 * @constructor
 */
function Unauthorized(message, details = {}) {
  APIError.call(this, 401, 'Unauthorized', message, details)
}
Unauthorized.prototype = Object.create(APIError.prototype)

/**
 * The client does not have access rights to the content, i.e. they are unauthorized, so server is
 * rejecting to give proper response. Unlike 401, the client's identity is known to the server
 * @param {string} message - errors message
 * @param {object} details - additional errors details, default {}
 * @returns {object} - Forbidden errors object with status 403, name, message and details
 * @constructor
 */
function Forbidden(message, details = {}) {
  APIError.call(this, 403, 'Forbidden', message, details)
}
Forbidden.prototype = Object.create(APIError.prototype)

/**
 * The server can not find requested resource.
 * In the browser, this means the URL is not recognized.
 * In an API, this can also mean that the endpoint is valid
 * but the resource itself does not exist.
 * Servers may also send this response instead of Forbidden to
 * hide the existence of a resource from an unauthorized client.
 * @param {string} message - errors message
 * @param {object} details - additional errors details, default {}
 * @returns {object} - NotFound errors object with status 404, name, message and details
 * @constructor
 */
function NotFound(message, details = {}) {
  APIError.call(this, 404, 'NotFound', message, details)
}
NotFound.prototype = Object.create(APIError.prototype)

/**
 * This response is sent when a request conflicts with the current state of the server.
 * @param {string} message - errors message
 * @param {object} details - additional errors details, default {}
 * @returns {object} - Conflict errors object with status 409, name, message and details
 * @constructor
 */
function Conflict(message, details = {}) {
  APIError.call(this, 409, 'Conflict', message, details)
}
Conflict.prototype = Object.create(APIError.prototype)

/**
 * This response would be sent when the requested content has been permanently deleted from server,
 * with no forwarding address. Clients are expected to remove their caches and links to the resource.
 * The HTTP specification intends this status code to be used for "limited-time, promotional services".
 * APIs should not feel compelled to indicate resources that have been deleted with this status code.
 * @param {string} message - errors message
 * @param {object} details - additional errors details, default {}
 * @returns {object} - Gone errors object with status 410, name, message and details
 * @constructor
 */
function Gone(message, details = {}) {
  APIError.call(this, 410, 'Gone', message, details)
}
Gone.prototype = Object.create(APIError.prototype)

/**
 * The server has encountered a situation it doesn't know how to handle.
 * @param {string} message - errors message
 * @param {object} details - additional errors details, default {}
 * @returns {object} - InternalServerError errors object with status 500, name, message and details
 * @constructor
 */
function InternalServerError(message, details = {}) {
  APIError.call(this, 500, 'InternalServerError', message, details)
}
InternalServerError.prototype = Object.create(APIError.prototype)

module.exports = {
  BadRequest: BadRequest,
  Unauthorized: Unauthorized,
  Forbidden: Forbidden,
  NotFound: NotFound,
  Conflict: Conflict,
  Gone: Gone,
  InternalServerError: InternalServerError
}
