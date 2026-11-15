/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 251
(__unused_webpack_module, exports) {

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}


/***/ },

/***/ 961
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   M: () => (/* binding */ nativeCall)
/* harmony export */ });
// The native bridge is available only to the bundled, local application page.
function nativeCall(operation, args = {}) {
  if (!globalThis.InvoiceyNative?.call) throw new Error('The Android data service is unavailable. Restart the app.');
  const response = JSON.parse(globalThis.InvoiceyNative.call(operation, JSON.stringify(args)));
  if (!response.ok) throw new Error(response.error || 'The Android data operation failed.');
  return response.value;
}
const environment = nativeCall('env');


/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "c", 0, /* binding */ environment
/* harmony export */ ]);


/***/ },

/***/ 1
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  h: () => (/* binding */ buffer_Buffer)
});

// MODULE: ./node_modules/base64-js/index.js
var base64_js_namespaceFn = /*#__PURE__*/__webpack_require__.cw(function(module, exports) {


exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

});

// MODULE: ./node_modules/buffer/index.js
var buffer_namespaceFn = /*#__PURE__*/__webpack_require__.cw(function(module, exports) {
var __webpack_unused_export__;
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */



var base64 = (base64_js_namespaceFn())
var ieee754 = (ieee754_namespaceFn())
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
    : null

exports.hp = Buffer
__webpack_unused_export__ = SlowBuffer
exports.IS = 50

var K_MAX_LENGTH = 0x7fffffff
__webpack_unused_export__ = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayView(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof SharedArrayBuffer !== 'undefined' &&
      (isInstance(value, SharedArrayBuffer) ||
      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpreted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayView (arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    var copy = new Uint8Array(arrayView)
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
  }
  return fromArrayLike(arrayView)
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      if (pos + buf.length > buffer.length) {
        Buffer.from(buf).copy(buffer, pos)
      } else {
        Uint8Array.prototype.set.call(
          buffer,
          buf,
          pos
        )
      }
    } else if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    } else {
      buf.copy(buffer, pos)
    }
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.IS
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
      case 'latin1':
      case 'binary':
        return asciiWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF)
      ? 4
      : (firstByte > 0xDF)
          ? 3
          : (firstByte > 0xBF)
              ? 2
              : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
  for (var i = 0; i < bytes.length - 1; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUintLE =
Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUintBE =
Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUint8 =
Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUint16LE =
Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUint16BE =
Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUint32LE =
Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUint32BE =
Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUintLE =
Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUintBE =
Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUint8 =
Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUint16LE =
Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUint16BE =
Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUint32LE =
Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUint32BE =
Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

});

// EXTERNAL MODULE: ./node_modules/ieee754/index.js
var ieee754_namespaceFn = () => {
	return __webpack_require__(251);
};

;// ./node_modules/buffer/index.js
buffer_namespaceFn();

;// ./android/runtime/buffer.mjs

const originalToString = (buffer_namespaceFn().hp).prototype.toString;
const originalFrom = (buffer_namespaceFn().hp).from;
(buffer_namespaceFn().hp).prototype.toString = function(encoding, ...rest) {
  if (encoding === 'base64url') return originalToString.call(this, 'base64', ...rest).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return originalToString.call(this, encoding, ...rest);
};
(buffer_namespaceFn().hp).from = function(value, encoding, ...rest) {
  return originalFrom.call(this, value, encoding === 'base64url' ? 'base64' : encoding, ...rest);
};
const buffer_Buffer = (buffer_namespaceFn().hp);



/***/ },

/***/ 321
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _bridge_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(961);

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ env: { LEDGER_DATA_DIR: globalThis.INVOICEY_NODE_DATA_DIR || _bridge_mjs__WEBPACK_IMPORTED_MODULE_0__/* .environment */ .c.dataRoot, LEDGER_DB: globalThis.INVOICEY_NODE_DB || '', INVOICEY_ROOT: globalThis.INVOICEY_NODE_ROOT || '', INVOICEY_HOSTED: globalThis.INVOICEY_NODE_HOSTED || '', INVOICEY_CORS_ORIGIN: globalThis.INVOICEY_NODE_CORS || '', INVOICEY_COOKIE_SECURE: globalThis.INVOICEY_NODE_COOKIE_SECURE || '', HOST: globalThis.INVOICEY_NODE_HOST || '127.0.0.1', PORT: globalThis.INVOICEY_NODE_PORT || '4173' }, pid: globalThis.INVOICEY_NODE_HOSTED ? 'host' : 'android', cwd: () => '/app', platform: globalThis.INVOICEY_NODE_HOSTED ? 'host' : 'android' });

/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "A", 0, __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ ]);


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/concatenation wrap */
/******/ 	// wrap a concatenated module body as a lazy, memoized accessor; mod is
/******/ 	// set before the body runs so re-entrant calls (require cycles) observe
/******/ 	// the partial exports like Node.js
/******/ 	__webpack_require__.cw = (body) => {
/******/ 		var mod;
/******/ 		return () => {
/******/ 			if (body) {
/******/ 				var fn = body;
/******/ 				body = 0;
/******/ 				mod = { exports: {} };
/******/ 				fn.call(mod.exports, mod, mod.exports);
/******/ 			}
/******/ 			return mod.exports;
/******/ 		};
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	// define getter/value functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		if(Array.isArray(definition)) {
/******/ 			var i = 0;
/******/ 			while(i < definition.length) {
/******/ 				var key = definition[i++];
/******/ 				var binding = definition[i++];
/******/ 				var descriptor = binding === 0 ? { enumerable: true, value: definition[i++] } : { enumerable: true, get: binding };
/******/ 				if(!__webpack_require__.o(exports, key)) Object.defineProperty(exports, key, descriptor);
/******/ 			}
/******/ 		} else {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop));
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";

// EXTERNAL MODULE: ./android/runtime/buffer.mjs + 2 modules
var buffer = __webpack_require__(1);
// EXTERNAL MODULE: ./android/runtime/bridge.mjs
var bridge = __webpack_require__(961);
;// ./android/runtime/http.mjs


let handler, queue = Promise.resolve();
let sessionCookie = (0,bridge/* nativeCall */.M)('prefs.get', { key: 'invoicey_session' }) || '';
/* harmony default export */ const http = globalThis.INVOICEY_NODE_HTTP || ({ createServer(callback) { handler = callback; return { listen(port, host, ready) { ready?.(); }, address() { return { port: 4173 }; } }; } });

async function dispatch(url, options = {}) {
  const path = new URL(url, globalThis.location?.href || 'https://appassets.androidplatform.net').pathname + new URL(url, globalThis.location?.href || 'https://appassets.androidplatform.net').search;
  const payload = options.body instanceof Blob ? buffer/* Buffer */.h.from(await options.body.arrayBuffer()) : options.body instanceof ArrayBuffer || options.body instanceof Uint8Array ? buffer/* Buffer */.h.from(options.body) : buffer/* Buffer */.h.from(options.body || '');
  const headers = Object.fromEntries(new Headers(options.headers || {}).entries());
  if (sessionCookie) headers.cookie = sessionCookie;
  const request = { url: path, method: String(options.method || 'GET').toUpperCase(), headers, socket: { remoteAddress: 'android-local' }, async *[Symbol.asyncIterator]() { if (payload.length) yield payload; } };
  let status = 200, responseHeaders = {}, responseBytes, ended = false;
  const response = {
    setHeader(name, value) { responseHeaders[name.toLowerCase()] = String(value); },
    writeHead(code, extra = {}) { status = code; for (const [name, value] of Object.entries(extra)) this.setHeader(name, value); },
    end(body = '') { responseBytes = buffer/* Buffer */.h.from(body); ended = true; }
  };
  await handler(request, response);
  if (!ended) throw new Error('The local data service did not finish the request.');
  const cookie = responseHeaders['set-cookie'];
  if (cookie) {
    sessionCookie = /Max-Age=0(?:;|$)/i.test(cookie) ? '' : cookie.split(';')[0];
    (0,bridge/* nativeCall */.M)('prefs.set', { key: 'invoicey_session', value: sessionCookie });
    delete responseHeaders['set-cookie'];
  }
  return { status, headers: responseHeaders, body: responseBytes };
}
function internalRequest(url, options) {
  const operation = queue.then(() => dispatch(url, options));
  queue = operation.catch(() => {});
  return operation;
}


;// ./android/runtime/fs.mjs
/* unused harmony import specifier */ var nativeCall;


const constants = { W_OK: 2 };
function existsSync(path) { return (0,bridge/* nativeCall */.M)('fs.exists', { path }); }
function mkdirSync(path, options = {}) { return (0,bridge/* nativeCall */.M)('fs.mkdir', { path, recursive: !!options.recursive }); }
function readFileSync(path, options) { const bytes = buffer/* Buffer */.h.from((0,bridge/* nativeCall */.M)('fs.read', { path }), 'base64'); const encoding = typeof options === 'string' ? options : options?.encoding; return encoding ? bytes.toString(encoding) : bytes; }
function writeFileSync(path, data, options = {}) { const encoding = typeof options === 'string' ? options : options.encoding || 'utf8'; return (0,bridge/* nativeCall */.M)('fs.write', { path, data: buffer/* Buffer */.h.from(data, encoding).toString('base64'), flag: options.flag || 'w' }); }
function renameSync(from, to) { return (0,bridge/* nativeCall */.M)('fs.rename', { from, to }); }
function unlinkSync(path) { return (0,bridge/* nativeCall */.M)('fs.unlink', { path }); }
function readdirSync(path) { return (0,bridge/* nativeCall */.M)('fs.readdir', { path }); }
function copyFileSync(from, to) { return nativeCall('fs.copy', { from, to }); }
function realpathSync(path) { return (0,bridge/* nativeCall */.M)('fs.realpath', { path }); }
function accessSync(path, mode) { return (0,bridge/* nativeCall */.M)('fs.access', { path, mode }); }
function statSync(path) { const stat = (0,bridge/* nativeCall */.M)('fs.stat', { path }); return { ...stat, mtime: new Date(stat.modifiedAt || 0), mtimeMs: stat.modifiedAt || 0, isFile: () => !stat.isDirectory, isDirectory: () => !!stat.isDirectory }; }
function createReadStream(path) { return { pipe(response) { response.end(readFileSync(path)); } }; }


;// ./android/runtime/path.mjs
function normalize(value) {
  const segments = String(value).replace(/\\/g, '/').split('/'), result = [];
  for (const segment of segments) { if (!segment || segment === '.') continue; if (segment === '..') result.pop(); else result.push(segment); }
  return (String(value).startsWith('/') ? '/' : '') + result.join('/') || '.';
}
const path = {
  sep: '/',
  normalize,
  resolve(...parts) {
    let value = '/app';
    for (const part of parts) if (part) value = String(part).startsWith('/') ? String(part) : value + '/' + part;
    return normalize(value);
  },
  join(...parts) { return normalize(parts.filter(Boolean).join('/')); },
  dirname(value) { const p = normalize(value), i = p.lastIndexOf('/'); return i < 0 ? '.' : i === 0 ? '/' : p.slice(0, i); },
  basename(value, suffix) { const b = normalize(value).split('/').pop(); return suffix && b.endsWith(suffix) ? b.slice(0, -suffix.length) : b; },
  extname(value) { const b = this.basename(value), i = b.lastIndexOf('.'); return i <= 0 ? '' : b.slice(i); },
  relative(from, to) { const a = this.resolve(from).split('/').filter(Boolean), b = this.resolve(to).split('/').filter(Boolean); let index = 0; while (index < a.length && index < b.length && a[index] === b[index]) index++; return [...a.slice(index).map(() => '..'), ...b.slice(index)].join('/'); },
  isAbsolute(value) { return String(value).startsWith('/'); }
};
/* harmony default export */ const runtime_path = (path);

;// ./android/runtime/url.mjs
function fileURLToPath() { return '/app/server.mjs'; }


;// ./node_modules/@noble/hashes/utils.js
/**
 * Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
 * @param a - value to test
 * @returns `true` when the value is a Uint8Array-compatible view.
 * @example
 * Check whether a value is a Uint8Array-compatible view.
 * ```ts
 * isBytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function isBytes(a) {
    // Plain `instanceof Uint8Array` is too strict for some Buffer / proxy / cross-realm cases.
    // The fallback still requires a real ArrayBuffer view, so plain
    // JSON-deserialized `{ constructor: ... }` spoofing is rejected, and
    // `BYTES_PER_ELEMENT === 1` keeps the fallback on byte-oriented views.
    return (a instanceof Uint8Array ||
        (ArrayBuffer.isView(a) &&
            a.constructor.name === 'Uint8Array' &&
            'BYTES_PER_ELEMENT' in a &&
            a.BYTES_PER_ELEMENT === 1));
}
// Shared error-message prefix builder. Only called on throw paths, so assert
// success paths never pay for the string concatenation.
const atitle = (title) => (title ? `"${title}" ` : '');
/**
 * Asserts something is a non-negative integer.
 * @param n - number to validate
 * @param title - label included in thrown errors
 * @returns The validated number.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a non-negative integer option.
 * ```ts
 * anumber(32, 'length');
 * ```
 */
function anumber(n, title = '') {
    if (typeof n !== 'number')
        throw new TypeError(atitle(title) + 'expected number, got ' + typeof n);
    if (!Number.isSafeInteger(n) || n < 0)
        throw new RangeError(atitle(title) + 'expected integer >= 0, got ' + n);
    return n;
}
/**
 * Asserts something is a boolean.
 * @param value - value to validate
 * @param title - label included in thrown errors
 * @returns The validated boolean.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate a boolean option.
 * ```ts
 * abool(true, 'enableXOF');
 * ```
 */
function abool(value, title = '') {
    if (typeof value !== 'boolean')
        throw new TypeError(atitle(title) + 'expected boolean, got type=' + typeof value);
    return value;
}
/**
 * Asserts something is Uint8Array.
 * @param value - value to validate
 * @param length - optional exact length constraint
 * @param title - label included in thrown errors
 * @returns The validated byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate that a value is a byte array.
 * ```ts
 * abytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function abytes(value, length, title = '') {
    // Success path first: this runs at the start of every update() / digestInto(), and the
    // common `abytes(data)` form must not pay for length handling it does not use.
    if (isBytes(value) && (length === undefined || value.length === length))
        return value;
    // Error path: recompute freely to build the exact message.
    if (length !== undefined)
        anumber(length, 'length');
    const bytes = isBytes(value);
    const ofLen = length !== undefined ? ` of length ${length}` : '';
    const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
    const message = atitle(title) + 'expected Uint8Array' + ofLen + ', got ' + got;
    if (!bytes)
        throw new TypeError(message);
    throw new RangeError(message);
}
/**
 * Copies bytes into a fresh Uint8Array.
 * Buffer-style slices can alias the same backing store, so callers that need ownership should copy.
 * @param bytes - source bytes to clone
 * @returns Freshly allocated copy of `bytes`.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Clone a byte array before mutating it.
 * ```ts
 * const copy = copyBytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function copyBytes(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(abytes(bytes));
}
/**
 * Asserts something is a wrapped hash constructor.
 * @param h - hash constructor to validate
 * @throws On wrong argument types or invalid hash wrapper shape. {@link TypeError}
 * @throws On invalid hash metadata ranges or values. {@link RangeError}
 * @throws If the hash metadata allows empty outputs or block sizes. {@link Error}
 * @example
 * Validate a callable hash wrapper.
 * ```ts
 * import { ahash } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * ahash(sha256);
 * ```
 */
function ahash(h) {
    if (typeof h !== 'function' || typeof h.create !== 'function')
        throw new TypeError('expected hash wrapped by utils.createHasher');
    anumber(h.outputLen);
    anumber(h.blockLen);
    // HMAC and KDF callers treat these as real byte lengths; allowing zero lets fake wrappers pass
    // validation and can produce empty outputs instead of failing fast.
    if (h.outputLen < 1 || h.blockLen < 1)
        throw new Error('hash blockLen / outputLen must be >= 1');
}
const aobject = (value, label) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        throw new TypeError((label === 'object' ? '' : `"${label}" `) + 'expected object, got type=' + typeof value);
};
const aopts = (value, label) => {
    aobject(value, label);
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null)
        throw new TypeError(`"${label}" expected plain object`);
    // Object.assign() treats an own "__proto__" source key as a write to the target's legacy
    // prototype setter. Reject it before merging so inherited option values cannot be injected.
    if (Object.hasOwn(value, '__proto__'))
        throw new TypeError(`"${label}.__proto__" is not allowed`);
};
/**
 * Asserts a hash instance has not been destroyed or finished.
 * @param instance - hash instance to validate
 * @param checkFinished - whether to reject finalized instances
 * @throws If the hash instance has already been destroyed or finalized. {@link Error}
 * @example
 * Validate that a hash instance is still usable.
 * ```ts
 * import { aexists } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hash = sha256.create();
 * aexists(hash);
 * ```
 */
function aexists(instance, checkFinished = true) {
    // Runs on every update()/digestInto(); the flags are library-owned booleans, so only their
    // truthiness is checked - re-validating their type per call was pure hot-path overhead.
    if (instance.destroyed)
        throw new Error('hash was destroyed');
    if (checkFinished && instance.finished)
        throw new Error('digest() was already called');
}
/**
 * Asserts output is a sufficiently-sized byte array.
 * @param out - destination buffer
 * @param instance - hash instance providing output length
 * Oversized buffers are allowed; downstream code only promises to fill the first `outputLen` bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a caller-provided digest buffer.
 * ```ts
 * import { aoutput } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hash = sha256.create();
 * aoutput(new Uint8Array(hash.outputLen), hash);
 * ```
 */
function aoutput(out, instance) {
    abytes(out, undefined, 'output');
    // `outputLen` is a library-owned readonly number; the negated comparison keeps failing fast
    // when it is missing/NaN (comparisons with undefined/NaN are false) without an anumber() call.
    const min = instance.outputLen;
    if (!(out.length >= min)) {
        throw new RangeError('"output" expected length >= ' + min);
    }
}
/**
 * Casts a typed array view to Uint8Array.
 * @param arr - source typed array
 * @returns Uint8Array view over the same buffer.
 * @example
 * Reinterpret a typed array as bytes.
 * ```ts
 * u8(new Uint32Array([1, 2]));
 * ```
 */
function u8(arr) {
    return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
 * Casts a typed array view to Uint32Array.
 * `arr.byteOffset` must already be 4-byte aligned or the platform
 * Uint32Array constructor will throw.
 * @param arr - source typed array
 * @returns Uint32Array view over the same buffer.
 * @example
 * Reinterpret a byte array as 32-bit words.
 * ```ts
 * u32(new Uint8Array(8));
 * ```
 */
function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/**
 * Zeroizes typed arrays in place. Warning: JS provides no guarantees.
 * @param arrays - arrays to overwrite with zeros
 * @example
 * Zeroize sensitive buffers in place.
 * ```ts
 * clean(new Uint8Array([1, 2, 3]));
 * ```
 */
function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
    }
}
/**
 * Creates a DataView for byte-level manipulation.
 * @param arr - source typed array
 * @returns DataView over the same buffer region.
 * @example
 * Create a DataView over an existing buffer.
 * ```ts
 * createView(new Uint8Array(4));
 * ```
 */
function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
 * Rotate-right operation for uint32 values.
 * @param word - source word
 * @param shift - shift amount in bits
 * @returns Rotated word.
 * @example
 * Rotate a 32-bit word to the right.
 * ```ts
 * rotr(0x12345678, 8);
 * ```
 */
function rotr(word, shift) {
    return (word << (32 - shift)) | (word >>> shift);
}
/**
 * Rotate-left operation for uint32 values.
 * @param word - source word
 * @param shift - shift amount in bits
 * @returns Rotated word.
 * @example
 * Rotate a 32-bit word to the left.
 * ```ts
 * rotl(0x12345678, 8);
 * ```
 */
function rotl(word, shift) {
    return (word << shift) | ((word >>> (32 - shift)) >>> 0);
}
/** Whether the current platform is little-endian. */
const isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44)();
/**
 * Byte-swap operation for uint32 values.
 * @param word - source word
 * @returns Word with reversed byte order.
 * @example
 * Reverse the byte order of a 32-bit word.
 * ```ts
 * byteSwap(0x11223344);
 * ```
 */
function byteSwap(word) {
    return (((word << 24) & 0xff000000) |
        ((word << 8) & 0xff0000) |
        ((word >>> 8) & 0xff00) |
        ((word >>> 24) & 0xff));
}
/**
 * Conditionally byte-swaps one 32-bit word on big-endian platforms.
 * @param n - source word
 * @returns Original or byte-swapped word depending on platform endianness.
 * @example
 * Normalize a 32-bit word for host endianness.
 * ```ts
 * swap8IfBE(0x11223344);
 * ```
 */
const swap8IfBE = (/* unused pure expression or super */ null && (isLE
    ? (n) => n
    : (n) => byteSwap(n) >>> 0));
/**
 * Byte-swaps every word of a Uint32Array in place.
 * @param arr - array to mutate
 * @returns The same array after mutation; callers pass live state arrays here.
 * @example
 * Reverse the byte order of every word in place.
 * ```ts
 * byteSwap32(new Uint32Array([0x11223344]));
 * ```
 */
function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = byteSwap(arr[i]);
    }
    return arr;
}
/**
 * Conditionally byte-swaps a Uint32Array on big-endian platforms.
 * @param u - array to normalize for host endianness
 * @returns Original or byte-swapped array depending on platform endianness.
 *   On big-endian runtimes this mutates `u` in place via `byteSwap32(...)`.
 * @example
 * Normalize a word array for host endianness.
 * ```ts
 * swap32IfBE(new Uint32Array([0x11223344]));
 * ```
 */
const swap32IfBE = isLE
    ? (u) => u
    : byteSwap32;
// Built-in hex conversion https://caniuse.com/mdn-javascript_builtins_uint8array_fromhex
const hasHexBuiltin = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => 
// @ts-ignore
typeof Uint8Array.from([]).toHex === 'function' && typeof Uint8Array.fromHex === 'function')()));
// Array where index 0xf0 (240) is mapped to string 'f0'
const hexes = /* @__PURE__ */ (/* unused pure expression or super */ null && (Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))));
/**
 * Convert byte array to hex string.
 * Uses the built-in function when available and assumes it matches the tested
 * fallback semantics.
 * @param bytes - bytes to encode
 * @returns Lowercase hexadecimal string.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Convert bytes to lowercase hexadecimal.
 * ```ts
 * bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])); // 'cafe0123'
 * ```
 */
function bytesToHex(bytes) {
    abytes(bytes);
    // @ts-ignore
    if (hasHexBuiltin)
        return bytes.toHex();
    // pre-caching improves the speed 6x
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}
// Strict ASCII nibble parser: non-ASCII hex lookalikes are rejected as undefined.
// ASCII codes: '0'..'9' = 48..57, 'A'..'F' = 65..70, 'a'..'f' = 97..102.
// prettier-ignore
function asciiToBase16(ch) {
    return ch >= 48 && ch <= 57 ? ch - 48 // '2' => 50-48
        : ch >= 65 && ch <= 70 ? ch - (65 - 10) // 'B' => 66-(65-10)
            : ch >= 97 && ch <= 102 ? ch - (97 - 10) // 'b' => 98-(97-10)
                : undefined;
}
/**
 * Convert hex string to byte array. Uses built-in function, when available.
 * @param hex - hexadecimal string to decode
 * @returns Decoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Decode lowercase hexadecimal into bytes.
 * ```ts
 * hexToBytes('cafe0123'); // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
 * ```
 */
function hexToBytes(hex) {
    if (typeof hex !== 'string')
        throw new TypeError('hex string expected, got ' + typeof hex);
    if (hasHexBuiltin) {
        try {
            return Uint8Array.fromHex(hex);
        }
        catch (error) {
            if (error instanceof SyntaxError)
                throw new RangeError(error.message);
            throw error;
        }
    }
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
        throw new RangeError('hex string expected, got unpadded hex of length ' + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase16(hex.charCodeAt(hi)); // parse first char, multiply it by 16
        const n2 = asciiToBase16(hex.charCodeAt(hi + 1)); // parse second char
        if (n1 === undefined || n2 === undefined) {
            const char = hex[hi] + hex[hi + 1];
            throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array[ai] = n1 * 16 + n2; // example: 'A9' => 10*16 + 9
    }
    return array;
}
/**
 * Yields to the host task scheduler so timers, I/O, and rendering can make progress.
 * Uses the Web Scheduling API when available or `setTimeout` as a cross-platform fallback.
 * Host-task yields are much slower than microtasks (roughly 1ms with the timer fallback), so
 * async loops should use `asyncTick >= 10` to amortize scheduling overhead to about 10% while
 * still allowing other event-loop work to proceed.
 * @param onReject - optional cleanup invoked only if the host yield fails
 * @example
 * Yield to the next scheduler tick.
 * ```ts
 * await nextTick();
 * ```
 */
function nextTick(onReject) {
    const host = globalThis;
    if (typeof host.scheduler?.yield === 'function') {
        const promise = host.scheduler.yield();
        // Keep the original scheduler rejection; this handler exists only for cleanup.
        if (onReject)
            promise.catch(onReject);
        return promise;
    }
    return new Promise((resolve) => host.setTimeout(resolve, 0));
}
/**
 * Returns control to the host event loop every `tick` milliseconds to avoid blocking long loops.
 * @param iters - number of loop iterations to run
 * @param tick - maximum time slice in milliseconds
 * @param cb - callback executed on each iteration
 * @param onReject - optional cleanup invoked only if a host yield fails
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Run a loop that periodically yields back to the event loop.
 * ```ts
 * await asyncLoop(2, 0, () => {});
 * ```
 */
async function asyncLoop(iters, tick, cb, onReject) {
    anumber(iters, 'iters');
    anumber(tick, 'tick');
    if (typeof cb !== 'function')
        throw new TypeError('callback must be a function');
    // Callback is synchronous by contract; asyncLoop only yields between sync work windows.
    let ts = Date.now();
    for (let i = 0; i < iters; i++) {
        cb(i);
        // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
            continue;
        await nextTick(onReject);
        // Track only synchronous work time; scheduler delay after yielding is outside our budget.
        ts = Date.now();
    }
}
/**
 * Converts string to bytes using UTF8 encoding.
 * Built-in doesn't validate input to be string: we do the check.
 * Non-ASCII details are delegated to the platform `TextEncoder`.
 * @param str - string to encode
 * @returns UTF-8 encoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Encode a string as UTF-8 bytes.
 * ```ts
 * utf8ToBytes('abc'); // Uint8Array.from([97, 98, 99])
 * ```
 */
function utf8ToBytes(str) {
    if (typeof str !== 'string')
        throw new TypeError('string expected');
    const encoded = new TextEncoder().encode(str);
    try {
        // Copy into the current realm for Firefox extension contexts. Callers that own the returned
        // buffer can then wipe it independently of TextEncoder's temporary result.
        return new Uint8Array(encoded); // https://bugzil.la/1681809
    }
    finally {
        clean(encoded);
    }
}
/**
 * Helper for KDFs: consumes Uint8Array or string.
 * String inputs are UTF-8 encoded; byte-array inputs stay aliased to the caller buffer.
 * @param data - user-provided KDF input
 * @param errorTitle - label included in thrown errors
 * @returns Byte representation of the input.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Normalize KDF input to bytes.
 * ```ts
 * kdfInputToBytes('password');
 * ```
 */
function kdfInputToBytes(data, errorTitle = '') {
    if (typeof data === 'string')
        return utf8ToBytes(data);
    return abytes(data, undefined, errorTitle);
}
/**
 * Copies several Uint8Arrays into one.
 * @param arrays - arrays to concatenate
 * @returns Concatenated byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Concatenate multiple byte arrays.
 * ```ts
 * concatBytes(new Uint8Array([1]), new Uint8Array([2]));
 * ```
 */
function concatBytes(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
        const a = arrays[i];
        abytes(a);
        sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const a = arrays[i];
        res.set(a, pad);
        pad += a.length;
    }
    return res;
}
/**
 * Validates declared required and optional field types on a plain object.
 * This walks field schemas and formats detailed errors, so avoid it on hot paths; use direct
 * one-line guards such as `abytes()`, `abool()`, or `anumber()` instead.
 * @param object - object to validate
 * @param fields - map of required field names to expected types
 * @param optFields - map of optional field names to expected types
 * @param title - label included in thrown errors
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate required and optional option fields.
 * ```ts
 * validateObject({ N: 1024, dkLen: 32 }, { N: 'number' }, { dkLen: 'number' });
 * ```
 */
const validateObject = (object, fields = {}, optFields = {}, title = 'object') => {
    aobject(object, title);
    aobject(fields, 'fields');
    aobject(optFields, 'optFields');
    function checkField(fieldName, expectedType, isOpt) {
        const label = title === 'object' ? `param "${String(fieldName)}"` : `"${title}.${String(fieldName)}"`;
        // Config fields must be explicit own properties. Optional inherited values are rejected too
        // because callers keep reading the same options object after validation.
        const val = object[fieldName];
        // Runtime objects such as Field instances intentionally satisfy required method slots
        // via their shared prototype.
        if (!Object.hasOwn(object, fieldName) &&
            (isOpt ? val !== undefined : expectedType !== 'function')) {
            throw new TypeError(`${label} is invalid: expected own property`);
        }
        if (isOpt && val === undefined)
            return;
        const current = typeof val;
        if (current !== expectedType || val === null)
            throw new TypeError(`${label} is invalid: expected ${expectedType}, got ${current}`);
    }
    const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
    iter(fields, false);
    iter(optFields, true);
};
/**
 * Merges default options and passed options.
 * @param defaults - base option object
 * @param opts - user overrides
 * @param title - label included in thrown override errors
 * @returns Fresh merged option object with a null prototype.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Merge user overrides onto default options.
 * ```ts
 * checkOpts({ dkLen: 32 }, { asyncTick: 10 });
 * ```
 */
function checkOpts(defaults, opts, title = 'opts') {
    aopts(defaults, 'defaults');
    if (opts !== undefined)
        aopts(opts, title);
    // Callers read optional fields directly, so omitted values must not fall through to ambient
    // Object.prototype pollution (for example a forged `dkLen` changing SHAKE's default output).
    const merged = Object.assign(Object.create(null), defaults, opts);
    return merged;
}
/**
 * Creates a callable hash function from a stateful class constructor.
 * @param hashCons - hash constructor or factory
 * @param info - optional metadata such as DER OID
 * @returns Frozen callable hash wrapper with `.create()`.
 *   Wrapper construction eagerly calls `hashCons(undefined)` once to read
 *   `outputLen` / `blockLen`, so constructor side effects happen at module
 *   init time.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Wrap a stateful hash constructor into a callable helper.
 * ```ts
 * import { createHasher } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const wrapped = createHasher(sha256.create, { oid: sha256.oid });
 * wrapped(new Uint8Array([1]));
 * ```
 */
function createHasher(hashCons, info = {}) {
    if (typeof hashCons !== 'function')
        throw new TypeError('"hashCons" expected function, got type=' + typeof hashCons);
    info = checkOpts({}, info, 'info');
    const hashC = (msg, opts) => hashCons(opts)
        .update(msg)
        .digest();
    const tmp = hashCons(undefined);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.canXOF = tmp.canXOF;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
}
/**
 * Cryptographically secure PRNG backed by `crypto.getRandomValues`.
 * @param bytesLength - number of random bytes to generate
 * @returns Random bytes.
 * The platform `getRandomValues()` implementation still defines any
 * single-call length cap, and this helper rejects oversize requests
 * with a stable library `RangeError` instead of host-specific errors.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @throws If the current runtime does not provide `crypto.getRandomValues`. {@link Error}
 * @example
 * Generate a fresh random key or nonce.
 * ```ts
 * const key = randomBytes(16);
 * ```
 */
function randomBytes(bytesLength = 32) {
    // Match the repo's other length-taking helpers instead of relying on Uint8Array coercion.
    anumber(bytesLength, 'bytesLength');
    const cr = typeof globalThis === 'object' ? globalThis.crypto : null;
    if (typeof cr?.getRandomValues !== 'function')
        throw new Error('crypto.getRandomValues must be defined');
    // Web Cryptography API Level 2 §10.1.1:
    // if `byteLength > 65536`, throw `QuotaExceededError`.
    // Keep the guard explicit so callers can see the quota in code
    // instead of discovering it by reading the spec or host errors.
    // This wrapper surfaces the same quota as a stable library RangeError.
    if (bytesLength > 65536)
        throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
    return cr.getRandomValues(new Uint8Array(bytesLength));
}
/**
 * Creates OID metadata for NIST hashes with prefix `06 09 60 86 48 01 65 03 04 02`.
 * @param suffix - final OID byte for the selected hash.
 *   The helper accepts any byte even though only the documented NIST hash
 *   suffixes are meaningful downstream.
 * @returns Object containing the DER-encoded OID.
 * @example
 * Build OID metadata for a NIST hash.
 * ```ts
 * oidNist(0x01);
 * ```
 */
const oidNist = (suffix) => ({
    // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
    // Larger suffix values would need base-128 OID encoding and a different length byte.
    oid: Uint8Array.from([0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, suffix]),
});

;// ./node_modules/@noble/hashes/hmac.js
/**
 * HMAC: RFC2104 message authentication code.
 * @module
 */

/**
 * Internal class for HMAC.
 * Accepts any byte key, although RFC 2104 §3 recommends keys at least
 * `HashLen` bytes long.
 */
class _HMAC {
    oHash;
    iHash;
    blockLen;
    outputLen;
    canXOF = false;
    finished = false;
    destroyed = false;
    constructor(hash, key) {
        ahash(hash);
        abytes(key, undefined, 'key');
        this.iHash = hash.create();
        if (typeof this.iHash.update !== 'function')
            throw new Error('expected Hash instance');
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad = new Uint8Array(blockLen);
        // blockLen can be bigger than outputLen
        pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
        for (let i = 0; i < pad.length; i++)
            pad[i] ^= 0x36;
        this.iHash.update(pad);
        // By doing update (processing of the first block) of the outer hash here,
        // we can re-use it between multiple calls via clone.
        this.oHash = hash.create();
        // Undo internal XOR && apply outer XOR
        for (let i = 0; i < pad.length; i++)
            pad[i] ^= 0x36 ^ 0x5c;
        this.oHash.update(pad);
        clean(pad);
    }
    update(buf) {
        aexists(this);
        this.iHash.update(buf);
        return this;
    }
    digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        const buf = out.subarray(0, this.outputLen);
        // Reuse the first outputLen bytes for the inner digest; the outer hash consumes them before
        // overwriting that same prefix with the final tag, leaving any oversized tail untouched.
        this.iHash.digestInto(buf);
        this.oHash.update(buf);
        this.oHash.digestInto(buf);
        this.destroy();
    }
    digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
    }
    _cloneInto(to) {
        // Create new instance without calling constructor since the key
        // is already in state and we don't know it.
        to ||= Object.create(Object.getPrototypeOf(this), {});
        const { oHash, iHash, finished, destroyed, blockLen, outputLen, canXOF } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.canXOF = canXOF;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
    }
    clone() {
        return this._cloneInto();
    }
    destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
    }
}
const hmac = /* @__PURE__ */ (() => {
    const hmac_ = ((hash, key, message) => new _HMAC(hash, key).update(message).digest());
    hmac_.create = (hash, key) => new _HMAC(hash, key);
    return hmac_;
})();

;// ./node_modules/@noble/hashes/pbkdf2.js
/* unused harmony import specifier */ var pbkdf2_clean;
/* unused harmony import specifier */ var pbkdf2_asyncLoop;
/**
 * PBKDF (RFC 2898). Can be used to create a key from password and salt.
 * @module
 */

// prettier-ignore

// Common validation and per-call state setup for sync/async functions.
function pbkdf2Init(hash, _password, _salt, _opts) {
    ahash(hash);
    const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
    const { c, dkLen, asyncTick } = opts;
    anumber(c, 'c');
    anumber(dkLen, 'dkLen');
    anumber(asyncTick, 'asyncTick');
    if (c < 1)
        throw new Error('"c" (iterations) must be >= 1');
    // RFC 8018 §5.2 defines `dkLen` as "a positive integer".
    if (dkLen < 1)
        throw new Error('"dkLen" must be >= 1');
    // RFC 8018 §5.2 step 1 requires rejecting oversize `dkLen`
    // before allocating the destination buffer.
    if (dkLen > (2 ** 32 - 1) * hash.outputLen)
        throw new Error('derived key too long');
    const p = kdfInputToBytes(_password, 'password');
    try {
        const s = kdfInputToBytes(_salt, 'salt');
        try {
            // DK = PBKDF2(PRF, Password, Salt, c, dkLen);
            const DK = new Uint8Array(dkLen);
            const { iHash, oHash, outputLen } = hmac.create(hash, p);
            // Drive keyed hashes directly; the wrapper is only needed to initialize their HMAC midstates.
            const u = new Uint8Array(outputLen);
            const eng = pbkdf2Engine(iHash, oHash, s, u);
            return { c, dkLen, asyncTick, DK, outputLen, eng };
        }
        finally {
            // Uint8Array inputs belong to the caller; only wipe our UTF-8 conversion.
            if (typeof _salt === 'string')
                clean(s);
        }
    }
    finally {
        if (typeof _password === 'string')
            clean(p);
    }
}
// Per-call PRF driver writes U1 into both `u` and `Ti`, then later digests into `u`;
// shared by the sync and async variants.
function pbkdf2Engine(iHash, oHash, salt, u) {
    const counter = new Uint8Array(4);
    const view = createView(counter);
    // Full clones retain tree/config state; absorb salt before async yields without cloning input.
    const salted = iHash._cloneInto().update(salt);
    // u1() overwrites the worker before reading it. Seed from the outer midstate so a long salt
    // cannot pre-populate a tree stack that the first reset would abandon without wiping.
    const work = oHash._cloneInto();
    const iClone = iHash._cloneInto; // Capture before mixed feedback can materialize state tuples.
    const oClone = oHash._cloneInto;
    return {
        u1: (ti, Ti) => {
            view.setInt32(0, ti, false);
            salted._cloneInto(work).update(counter).digestInto(u);
            oHash._cloneInto(work).update(u).digestInto(u);
            Ti.set(u.subarray(0, Ti.length));
        },
        // Whole `F` inner loop for the sync variant: one optimized function owns the hot loop.
        rounds: (c, Ti) => {
            for (let ui = 1; ui < c; ui++) {
                iClone.call(iHash, work).update(u).digestInto(u);
                oClone.call(oHash, work).update(u).digestInto(u);
                for (let i = 0; i < Ti.length; i++)
                    Ti[i] ^= u[i];
            }
        },
        output: (DK) => {
            // Keyed templates and derived worker states are secret material.
            iHash.destroy();
            oHash.destroy();
            salted.destroy();
            work.destroy();
            // Shared sync/async cleanup point: wipe transient PRF state
            // while preserving the derived key buffer.
            clean(u);
            return DK;
        },
    };
}
/**
 * PBKDF2-HMAC: RFC 8018 key derivation function.
 * @param hash - hash function that would be used e.g. sha256
 * @param password - password from which a derived key is generated;
 *   JS string inputs are UTF-8 encoded first
 * @param salt - cryptographic salt; JS string inputs are UTF-8 encoded first
 * @param opts - PBKDF2 work factor and output settings. `dkLen`, if provided,
 *   must be `>= 1` per RFC 8018 §5.2. See {@link Pbkdf2Opt}.
 * @returns Derived key bytes.
 * @throws If the PBKDF2 iteration count or derived-key settings are invalid. {@link Error}
 * @example
 * PBKDF2-HMAC: RFC 2898 key derivation function.
 * ```ts
 * import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const key = pbkdf2(sha256, 'password', 'salt', { dkLen: 32, c: Math.pow(2, 18) });
 * ```
 */
function pbkdf2(hash, password, salt, opts) {
    const { c, dkLen, DK, outputLen, eng } = pbkdf2Init(hash, password, salt, opts);
    // DK = T1 + T2 + ⋯ + Tdklen/hlen
    for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += outputLen) {
        // Ti = F(Password, Salt, c, i)
        // The last Ti view can be shorter than hLen, which applies
        // RFC 8018 §5.2 step 4's T_l<0..r-1> truncation without extra copies.
        const Ti = DK.subarray(pos, pos + outputLen);
        // F(Password, Salt, c, i) = U1 ^ U2 ^ ⋯ ^ Uc
        // U1 = PRF(Password, Salt + INT_32_BE(i))
        eng.u1(ti, Ti);
        // Uc = PRF(Password, Uc−1); Ti ^= Uc
        eng.rounds(c, Ti);
    }
    return eng.output(DK);
}
/**
 * PBKDF2-HMAC: RFC 8018 key derivation function. Async version.
 * @param hash - hash function that would be used e.g. sha256
 * @param password - password from which a derived key is generated;
 *   JS string inputs are UTF-8 encoded first
 * @param salt - cryptographic salt; JS string inputs are UTF-8 encoded first
 * @param opts - PBKDF2 work factor and output settings. `dkLen`, if provided,
 *   must be `>= 1` per RFC 8018 §5.2. `asyncTick` is only a local
 *   scheduler-yield knob for this JS wrapper, not part of RFC 8018.
 *   See {@link Pbkdf2Opt}.
 * @returns Promise resolving to derived key bytes.
 * @throws If the PBKDF2 iteration count or derived-key settings are invalid. {@link Error}
 * @example
 * PBKDF2-HMAC: RFC 2898 key derivation function.
 * ```ts
 * import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const key = await pbkdf2Async(sha256, 'password', 'salt', { dkLen: 32, c: 500_000 });
 * ```
 * @example
 * Tune the async PBKDF2 scheduler for short UI tasks.
 * ```ts
 * import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const key = await pbkdf2Async(sha256, 'password', 'salt', {
 *   dkLen: 32,
 *   c: 32,
 *   asyncTick: 1,
 * });
 * ```
 */
async function pbkdf2Async(hash, password, salt, opts) {
    const { c, dkLen, asyncTick, DK, outputLen, eng } = pbkdf2Init(hash, password, salt, opts);
    // Reuse normal state destruction, then wipe the incomplete output if a host yield aborts.
    const abort = () => {
        eng.output(DK);
        pbkdf2_clean(DK);
    };
    // DK = T1 + T2 + ⋯ + Tdklen/hlen
    for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += outputLen) {
        // Ti = F(Password, Salt, c, i)
        // The last Ti view can be shorter than hLen, which applies
        // RFC 8018 §5.2 step 4's T_l<0..r-1> truncation without extra copies.
        const Ti = DK.subarray(pos, pos + outputLen);
        // F(Password, Salt, c, i) = U1 ^ U2 ^ ⋯ ^ Uc
        // U1 = PRF(Password, Salt + INT_32_BE(i))
        eng.u1(ti, Ti);
        await pbkdf2_asyncLoop(c - 1, asyncTick, () => {
            // Uc = PRF(Password, Uc−1)
            eng.rounds(2, Ti); // c=2 runs exactly one PRF iteration per callback.
        }, abort);
    }
    return eng.output(DK);
}

;// ./node_modules/@noble/hashes/_u64.js
const U32_MASK64 = /* @__PURE__ */ (() => BigInt(2 ** 32 - 1))();
const _32n = /* @__PURE__ */ BigInt(32);
// Split bigint into two 32-bit halves. With `le=true`, returned fields become `{ h: low, l: high
// }` to match little-endian word order rather than the property names.
function fromBig(n, le = false) {
    if (le)
        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
// Split bigint list into `[highWords, lowWords]` when `le=false`; with `le=true`, the first array
// holds the low halves because `fromBig(...)` swaps the semantic meaning of `h` and `l`.
function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}
// Combine explicit `(high, low)` 32-bit halves into a bigint; `>>> 0` normalizes signed JS
// bitwise results back to uint32 first, and little-endian callers must swap.
const toBig = (h, l) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
// Split a JS number into u32 halves without a BigInt allocation. Exact only for integers
// `0 <= n < 2**53`; callers use it on byte / bit counters, which JS length math caps far below
// that (an ArrayBuffer cannot exceed 2**53 - 1 bytes).
const fromNumH = (n) => (n / 2 ** 32) | 0;
const fromNumL = (n) => n >>> 0;
// Drop-in replacement for `view.setBigUint64(byteOffset, BigInt(n), isLE)` without the per-call
// BigInt allocation. Same `n < 2**53` precondition as `fromNumH`/`fromNumL`.
function setU64FromNum(view, byteOffset, n, isLE) {
    const h = fromNumH(n);
    const l = fromNumL(n);
    view.setUint32(byteOffset, isLE ? l : h, isLE);
    view.setUint32(byteOffset + 4, isLE ? h : l, isLE);
}
// High 32-bit half of a 64-bit logical right shift for `s` in `0..31`.
const shrSH = (h, _l, s) => h >>> s;
// Low 32-bit half of a 64-bit logical right shift, valid for `s` in `1..31`.
const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// High 32-bit half of a 64-bit right rotate, valid for `s` in `1..31`.
const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
// Low 32-bit half of a 64-bit right rotate, valid for `s` in `1..31`.
const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// High 32-bit half of a 64-bit right rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
// Low 32-bit half of a 64-bit right rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
// High 32-bit half of a 64-bit right rotate for `s === 32`; this is just the swapped low half.
const rotr32H = (_h, l) => l;
// Low 32-bit half of a 64-bit right rotate for `s === 32`; this is just the swapped high half.
const rotr32L = (h, _l) => h;
// 64-bit left rotates (rotl*) are not defined here: sha3.ts, their only consumer, keeps
// local copies so V8 inlines them into keccakP.
// Add two split 64-bit words and return the split `{ h, l }` sum.
// JS uses 32-bit signed integers for bitwise operations, so we cannot simply shift the carry out
// of the low sum and instead use division.
function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
}
// Addition with more than 2 elements
// Unmasked low-word accumulator for 3-way addition; pass the raw result into `add3H(...)`.
const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
// High-word finalize step for 3-way addition; `low` must be the untruncated output of `add3L(...)`.
const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
// Unmasked low-word accumulator for 4-way addition; pass the raw result into `add4H(...)`.
const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
// High-word finalize step for 4-way addition; `low` must be the untruncated output of `add4L(...)`.
const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
// Unmasked low-word accumulator for 5-way addition; pass the raw result into `add5H(...)`.
const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
// High-word finalize step for 5-way addition; `low` must be the untruncated output of `add5L(...)`.
const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
// prettier-ignore


;// ./node_modules/@noble/hashes/_md.js
/**
 * Internal Merkle-Damgard hash utils.
 * @module
 */


/**
 * Shared 32-bit conditional boolean primitive reused by SHA-256, SHA-1, and MD5 `F`.
 * Returns bits from `b` when `a` is set, otherwise from `c`.
 * The XOR form is equivalent to MD5's `F(X,Y,Z) = XY v not(X)Z` because the masked terms never
 * set the same bit.
 * @param a - selector word
 * @param b - word chosen when selector bit is set
 * @param c - word chosen when selector bit is clear
 * @returns Mixed 32-bit word.
 * @example
 * Combine three words with the shared 32-bit choice primitive.
 * ```ts
 * Chi(0xffffffff, 0x12345678, 0x87654321);
 * ```
 */
function Chi(a, b, c) {
    return (a & b) ^ (~a & c);
}
/**
 * Shared 32-bit majority primitive reused by SHA-256 and SHA-1.
 * Returns bits shared by at least two inputs.
 * @param a - first input word
 * @param b - second input word
 * @param c - third input word
 * @returns Mixed 32-bit word.
 * @example
 * Combine three words with the shared 32-bit majority primitive.
 * ```ts
 * Maj(0xffffffff, 0x12345678, 0x87654321);
 * ```
 */
function Maj(a, b, c) {
    return (a & b) ^ (a & c) ^ (b & c);
}
/**
 * Merkle-Damgard hash construction base class.
 * Could be used to create MD5, RIPEMD, SHA1, SHA2.
 * Accepts only byte-aligned `Uint8Array` input, even when the underlying spec describes bit
 * strings with partial-byte tails.
 * @param blockLen - internal block size in bytes
 * @param outputLen - digest size in bytes
 * @param padOffset - trailing length field size in bytes
 * @param isLE - whether length and state words are encoded in little-endian
 * @example
 * Use a concrete subclass to get the shared Merkle-Damgard update/digest flow.
 * ```ts
 * import { _SHA1 } from '@noble/hashes/legacy.js';
 * const hash = new _SHA1();
 * hash.update(new Uint8Array([97, 98, 99]));
 * hash.digest();
 * ```
 */
class HashMD {
    blockLen;
    outputLen;
    canXOF = false;
    padOffset;
    isLE;
    // For partial updates less than block size
    buffer;
    view;
    finished = false;
    length = 0;
    pos = 0;
    destroyed = false;
    constructor(blockLen, outputLen, padOffset, isLE) {
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
    }
    update(data) {
        aexists(this);
        abytes(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        let processed = false;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path only when there is no buffered partial block: `take === blockLen` implies
            // `this.pos === 0`, so we can process full blocks directly from the input view.
            if (take === blockLen) {
                const dataView = createView(data);
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(dataView, pos);
                processed = true;
                continue;
            }
            // When the whole input is buffered in one go (common for short messages), passing `data`
            // directly avoids allocating a subarray view.
            buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
                processed = true;
            }
        }
        this.length += data.length;
        // Shared schedule buffers only pick up input-derived words inside process(); if everything
        // was buffered without processing, there is nothing to zero.
        if (processed)
            this.roundClean();
        return this;
    }
    digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message, then zero-pad the rest of the block
        buffer[pos++] = 0b10000000;
        buffer.fill(0, pos);
        // we have less than padOffset left in buffer, so we cannot put length in
        // current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            buffer.fill(0);
        }
        // `padOffset` reserves the whole length field. For SHA-384/512 the high 64 bits stay zero from
        // the padding fill above, and JS will overflow before user input can make that half non-zero.
        // So we only need to write the low 64 bits here (`length * 8` only scales the exponent of an
        // integer below 2**53, so the split inside the helper stays exact).
        setU64FromNum(view, blockLen - 8, this.length * 8, isLE);
        this.process(view, 0);
        // The final block above is processed outside update(), so the shared message-schedule
        // buffers (e.g. SHA256_W) would otherwise retain input-derived words after digest().
        this.roundClean();
        // digest() passes our own `buffer` as `out`; reuse its cached view instead of allocating one.
        const oview = out === buffer ? view : createView(out);
        const len = this.outputLen;
        // NOTE: we do division by 4 later, which must be fused in single op with modulo by JIT
        const outLen = len / 4;
        const state = this.get();
        // Subclass-misconfiguration invariant: outputLen must be 32-bit aligned and fit the state.
        if (len % 4 || outLen > state.length)
            throw new Error('invalid outputLen');
        for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        // Copy before destroy(): subclasses wipe `buffer` during cleanup, but `digest()` must return
        // fresh bytes to the caller.
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneIntoMeta(to) {
        const { buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        // Only partial-block bytes need copying: when `length % blockLen === 0`, `pos === 0` and
        // later `update()` / `digestInto()` overwrite `to.buffer` from the start before reading it.
        if (pos)
            to.buffer.set(buffer); // Avoid a hot modulo guard.
        return to;
    }
    clone() {
        return this._cloneInto();
    }
}
/**
 * Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
 * Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
 */
/** Initial SHA256 state from RFC 6234 §6.1: the first 32 bits of the fractional parts of the
 * square roots of the first eight prime numbers. Exported as a shared table; callers must treat
 * it as read-only because constructors copy words from it by index. */
const SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);
/** Initial SHA224 state `H(0)` from RFC 6234 §6.1. Exported as a shared table; callers must
 * treat it as read-only because constructors copy words from it by index. */
const SHA224_IV = /* @__PURE__ */ Uint32Array.from([
    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4,
]);
/** Initial SHA384 state from RFC 6234 §6.3: eight RFC 64-bit `H(0)` words stored as sixteen
 * big-endian 32-bit halves. Derived from the fractional parts of the square roots of the ninth
 * through sixteenth prime numbers. Exported as a shared table; callers must treat it as read-only
 * because constructors copy halves from it by index. */
const SHA384_IV = /* @__PURE__ */ Uint32Array.from([
    0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4,
]);
/** Initial SHA512 state from RFC 6234 §6.3: eight RFC 64-bit `H(0)` words stored as sixteen
 * big-endian 32-bit halves. Derived from the fractional parts of the square roots of the first
 * eight prime numbers. Exported as a shared table; callers must treat it as read-only because
 * constructors copy halves from it by index. */
const SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
]);

;// ./node_modules/@noble/hashes/sha2.js
/* unused harmony import specifier */ var sha2_createHasher;
/* unused harmony import specifier */ var sha2_oidNist;
/**
 * SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
 * SHA256 is the fastest hash implementable in JS, even faster than Blake3.
 * Check out {@link https://www.rfc-editor.org/rfc/rfc4634 | RFC 4634} and
 * {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf | FIPS 180-4}.
 * @module
 */



/**
 * SHA-224 / SHA-256 round constants from RFC 6234 §5.1: the first 32 bits
 * of the cube roots of the first 64 primes (2..311).
 */
// prettier-ignore
const SHA256_K = /* @__PURE__ */ Uint32Array.from([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
/** Reusable SHA-224 / SHA-256 message schedule buffer `W_t` from RFC 6234 §6.2 step 1. */
const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
/** Internal SHA-224 / SHA-256 compression engine from RFC 6234 §6.2. */
class SHA2_32B extends HashMD {
    // We cannot use array here since array allows indexing by variable
    // which means optimizer/compiler cannot use registers.
    // Numeric initializers matter: starting the fields as `undefined` changes
    // V8's field representation and makes sha256 3x slower (measured).
    A = 0;
    B = 0;
    C = 0;
    D = 0;
    E = 0;
    F = 0;
    G = 0;
    H = 0;
    constructor(outputLen, IV) {
        super(64, outputLen, 8, false);
        this.A = IV[0] | 0;
        this.B = IV[1] | 0;
        this.C = IV[2] | 0;
        this.D = IV[3] | 0;
        this.E = IV[4] | 0;
        this.F = IV[5] | 0;
        this.G = IV[6] | 0;
        this.H = IV[7] | 0;
    }
    get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    _cloneInto(to) {
        (to ||= new this.constructor()).set(...this.get());
        return this._cloneIntoMeta(to);
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ (W15 >>> 3);
            const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ (W2 >>> 10);
            SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
        }
        // Compression function main loop, 64 rounds
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
            const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
            const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
            const T2 = (sigma0 + Maj(A, B, C)) | 0;
            H = G;
            G = F;
            F = E;
            E = (D + T1) | 0;
            D = C;
            C = B;
            B = A;
            A = (T1 + T2) | 0;
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        E = (E + this.E) | 0;
        F = (F + this.F) | 0;
        G = (G + this.G) | 0;
        H = (H + this.H) | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        clean(SHA256_W);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        clean(this.buffer);
    }
}
/** Internal SHA-256 hash class grounded in RFC 6234 §6.2. */
class _SHA256 extends SHA2_32B {
    constructor() {
        super(32, SHA256_IV);
    }
}
/** Internal SHA-224 hash class grounded in RFC 6234 §6.2 and §8.5. */
class _SHA224 extends SHA2_32B {
    constructor() {
        super(28, SHA224_IV);
    }
}
// SHA2-512 is slower than sha256 in js because u64 operations are slow.
// SHA-384 / SHA-512 round constants from RFC 6234 §5.2:
// 80 full 64-bit words split into high/low halves.
// prettier-ignore
const K512 = /* @__PURE__ */ (() => split([
    '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
    '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
    '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
    '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
    '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
    '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
    '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
    '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
    '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
    '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
    '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
    '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
    '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
    '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
    '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
    '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
    '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
    '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
    '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
    '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
].map(n => BigInt(n))))();
const SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
const SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
// Reusable high-half schedule buffer for the RFC 6234 §6.4 64-bit `W_t` words.
const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
// Reusable low-half schedule buffer for the RFC 6234 §6.4 64-bit `W_t` words.
const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
/** Internal SHA-384 / SHA-512 compression engine from RFC 6234 §6.4. */
class SHA2_64B extends HashMD {
    // We cannot use array here since array allows indexing by variable
    // which means optimizer/compiler cannot use registers.
    // h -- high 32 bits, l -- low 32 bits
    // Numeric initializers matter: starting the fields as `undefined` changes
    // V8's field representation and slows hashing down (measured on sha256).
    Ah = 0;
    Al = 0;
    Bh = 0;
    Bl = 0;
    Ch = 0;
    Cl = 0;
    Dh = 0;
    Dl = 0;
    Eh = 0;
    El = 0;
    Fh = 0;
    Fl = 0;
    Gh = 0;
    Gl = 0;
    Hh = 0;
    Hl = 0;
    constructor(outputLen, IV) {
        super(128, outputLen, 16, false);
        this.Ah = IV[0] | 0;
        this.Al = IV[1] | 0;
        this.Bh = IV[2] | 0;
        this.Bl = IV[3] | 0;
        this.Ch = IV[4] | 0;
        this.Cl = IV[5] | 0;
        this.Dh = IV[6] | 0;
        this.Dl = IV[7] | 0;
        this.Eh = IV[8] | 0;
        this.El = IV[9] | 0;
        this.Fh = IV[10] | 0;
        this.Fl = IV[11] | 0;
        this.Gh = IV[12] | 0;
        this.Gl = IV[13] | 0;
        this.Hh = IV[14] | 0;
        this.Hl = IV[15] | 0;
    }
    // prettier-ignore
    get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
    }
    _cloneInto(to) {
        (to ||= new this.constructor()).set(...this.get());
        return this._cloneIntoMeta(to);
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32((offset += 4));
        }
        for (let i = 16; i < 80; i++) {
            // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
            const W15h = SHA512_W_H[i - 15] | 0;
            const W15l = SHA512_W_L[i - 15] | 0;
            const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
            const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
            // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
            const W2h = SHA512_W_H[i - 2] | 0;
            const W2l = SHA512_W_L[i - 2] | 0;
            const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
            const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
            // SHA512_W[i] = s0 + s1 + SHA512_W[i - 7] + SHA512_W[i - 16];
            const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
            const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
            SHA512_W_H[i] = SUMh | 0;
            SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        // Compression function main loop, 80 rounds
        for (let i = 0; i < 80; i++) {
            // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
            const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
            const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
            //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const CHIh = (Eh & Fh) ^ (~Eh & Gh);
            const CHIl = (El & Fl) ^ (~El & Gl);
            // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
            // prettier-ignore
            const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
            const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
            const T1l = T1ll | 0;
            // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
            const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
            const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
            const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
            const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = add3L(T1l, sigma0l, MAJl);
            Ah = add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
        }
        // Add the compressed chunk to the current hash value
        ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
        clean(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        clean(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
/** Internal SHA-512 hash class grounded in RFC 6234 §6.3 and §6.4. */
class _SHA512 extends SHA2_64B {
    constructor() {
        super(64, SHA512_IV);
    }
}
/** Internal SHA-384 hash class grounded in RFC 6234 §6.3 and §6.4. */
class _SHA384 extends SHA2_64B {
    constructor() {
        super(48, SHA384_IV);
    }
}
/**
 * Truncated SHA512/256 and SHA512/224.
 * SHA512_IV is XORed with 0xa5a5a5a5a5a5a5a5, then used as "intermediary" IV of SHA512/t.
 * Then t hashes string to produce result IV.
 * See the repo-side derivation recipe in `test/misc/sha2-gen-iv.js`.
 * These IV literals are checked against that script rather than a dedicated
 * local RFC section.
 */
/** SHA-512/224 IV derived by the SHA-512/t recipe in `test/misc/sha2-gen-iv.js` and
 * stored as sixteen big-endian 32-bit halves. */
const T224_IV = /* @__PURE__ */ Uint32Array.from([
    0x8c3d37c8, 0x19544da2, 0x73e19966, 0x89dcd4d6, 0x1dfab7ae, 0x32ff9c82, 0x679dd514, 0x582f9fcf,
    0x0f6d2b69, 0x7bd44da8, 0x77e36f73, 0x04c48942, 0x3f9d85a8, 0x6a1d36c8, 0x1112e6ad, 0x91d692a1,
]);
/** SHA-512/256 IV derived by the SHA-512/t recipe in `test/misc/sha2-gen-iv.js` and
 * stored as sixteen big-endian 32-bit halves. */
const T256_IV = /* @__PURE__ */ Uint32Array.from([
    0x22312194, 0xfc2bf72c, 0x9f555fa3, 0xc84c64c2, 0x2393b86b, 0x6f53b151, 0x96387719, 0x5940eabd,
    0x96283ee2, 0xa88effe3, 0xbe5e1e25, 0x53863992, 0x2b0199fc, 0x2c85b8aa, 0x0eb72ddc, 0x81c52ca2,
]);
/** Internal SHA-512/224 hash class using the derived `T224_IV` and the shared
 * RFC 6234 §6.4 compression engine. */
class _SHA512_224 extends SHA2_64B {
    constructor() {
        super(28, T224_IV);
    }
}
/** Internal SHA-512/256 hash class using the derived `T256_IV` and the shared
 * RFC 6234 §6.4 compression engine. */
class _SHA512_256 extends SHA2_64B {
    constructor() {
        super(32, T256_IV);
    }
}
/**
 * SHA2-256 hash function from RFC 4634. In JS it's the fastest: even faster than Blake3. Some info:
 *
 * - Trying 2^128 hashes would get 50% chance of collision, using birthday attack.
 * - BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
 * - Each sha256 hash is executing 2^18 bit operations.
 * - Good 2024 ASICs can do 200Th/sec with 3500 watts of power, corresponding to 2^36 hashes/joule.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-256.
 * ```ts
 * sha256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha256 = /* @__PURE__ */ createHasher(() => new _SHA256(), 
/* @__PURE__ */ oidNist(0x01));
/**
 * SHA2-224 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-224.
 * ```ts
 * sha224(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (sha2_createHasher(() => new _SHA224(), 
/* @__PURE__ */ sha2_oidNist(0x04))));
/**
 * SHA2-512 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512.
 * ```ts
 * sha512(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha512 = /* @__PURE__ */ (/* unused pure expression or super */ null && (sha2_createHasher(() => new _SHA512(), 
/* @__PURE__ */ sha2_oidNist(0x03))));
/**
 * SHA2-384 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-384.
 * ```ts
 * sha384(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (sha2_createHasher(() => new _SHA384(), 
/* @__PURE__ */ sha2_oidNist(0x02))));
/**
 * SHA2-512/256 "truncated" hash function, with improved resistance to length extension attacks.
 * See the paper on {@link https://eprint.iacr.org/2010/548.pdf | truncated SHA512}.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512/256.
 * ```ts
 * sha512_256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha512_256 = /* @__PURE__ */ (/* unused pure expression or super */ null && (sha2_createHasher(() => new _SHA512_256(), 
/* @__PURE__ */ sha2_oidNist(0x06))));
/**
 * SHA2-512/224 "truncated" hash function, with improved resistance to length extension attacks.
 * See the paper on {@link https://eprint.iacr.org/2010/548.pdf | truncated SHA512}.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512/224.
 * ```ts
 * sha512_224(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha512_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (sha2_createHasher(() => new _SHA512_224(), 
/* @__PURE__ */ sha2_oidNist(0x05))));

;// ./node_modules/@noble/hashes/scrypt.js
/* unused harmony import specifier */ var scrypt_clean;
/* unused harmony import specifier */ var scrypt_swap32IfBE;
/* unused harmony import specifier */ var scrypt_asyncLoop;
/**
 * RFC 7914 Scrypt KDF. Can be used to create a key from password and salt.
 * @module
 */


// prettier-ignore

// The main Scrypt loop: uses Salsa extensively.
// Six versions of the function were tried, this is the fastest one.
// RFC 7914 §3 / §4 step 2 applies Salsa20/8 to one 16-word (64-byte) block
// after xor'ing two such blocks.
// The local `y*` snapshot keeps the xor input stable even when `out` aliases `prev` or `input`.
// prettier-ignore
function XorAndSalsa(prev, pi, input, ii, out, oi) {
    // Based on https://cr.yp.to/salsa20.html and RFC 7914's Salsa20/8 core.
    // Xor blocks
    let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
    let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
    let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
    let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
    let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
    let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
    let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
    let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
    // Save state to temporary variables (salsa)
    let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
    // Main loop (salsa)
    for (let i = 0; i < 8; i += 2) {
        x04 ^= rotl(x00 + x12 | 0, 7);
        x08 ^= rotl(x04 + x00 | 0, 9);
        x12 ^= rotl(x08 + x04 | 0, 13);
        x00 ^= rotl(x12 + x08 | 0, 18);
        x09 ^= rotl(x05 + x01 | 0, 7);
        x13 ^= rotl(x09 + x05 | 0, 9);
        x01 ^= rotl(x13 + x09 | 0, 13);
        x05 ^= rotl(x01 + x13 | 0, 18);
        x14 ^= rotl(x10 + x06 | 0, 7);
        x02 ^= rotl(x14 + x10 | 0, 9);
        x06 ^= rotl(x02 + x14 | 0, 13);
        x10 ^= rotl(x06 + x02 | 0, 18);
        x03 ^= rotl(x15 + x11 | 0, 7);
        x07 ^= rotl(x03 + x15 | 0, 9);
        x11 ^= rotl(x07 + x03 | 0, 13);
        x15 ^= rotl(x11 + x07 | 0, 18);
        x01 ^= rotl(x00 + x03 | 0, 7);
        x02 ^= rotl(x01 + x00 | 0, 9);
        x03 ^= rotl(x02 + x01 | 0, 13);
        x00 ^= rotl(x03 + x02 | 0, 18);
        x06 ^= rotl(x05 + x04 | 0, 7);
        x07 ^= rotl(x06 + x05 | 0, 9);
        x04 ^= rotl(x07 + x06 | 0, 13);
        x05 ^= rotl(x04 + x07 | 0, 18);
        x11 ^= rotl(x10 + x09 | 0, 7);
        x08 ^= rotl(x11 + x10 | 0, 9);
        x09 ^= rotl(x08 + x11 | 0, 13);
        x10 ^= rotl(x09 + x08 | 0, 18);
        x12 ^= rotl(x15 + x14 | 0, 7);
        x13 ^= rotl(x12 + x15 | 0, 9);
        x14 ^= rotl(x13 + x12 | 0, 13);
        x15 ^= rotl(x14 + x13 | 0, 18);
    }
    // Write output (salsa)
    out[oi++] = (y00 + x00) | 0;
    out[oi++] = (y01 + x01) | 0;
    out[oi++] = (y02 + x02) | 0;
    out[oi++] = (y03 + x03) | 0;
    out[oi++] = (y04 + x04) | 0;
    out[oi++] = (y05 + x05) | 0;
    out[oi++] = (y06 + x06) | 0;
    out[oi++] = (y07 + x07) | 0;
    out[oi++] = (y08 + x08) | 0;
    out[oi++] = (y09 + x09) | 0;
    out[oi++] = (y10 + x10) | 0;
    out[oi++] = (y11 + x11) | 0;
    out[oi++] = (y12 + x12) | 0;
    out[oi++] = (y13 + x13) | 0;
    out[oi++] = (y14 + x14) | 0;
    out[oi++] = (y15 + x15) | 0;
}
function BlockMix(input, ii, out, oi, r) {
    // The block B is `r` 128-byte chunks, i.e. `2r` 16-word (64-byte) Salsa blocks.
    let head = oi + 0;
    let tail = oi + 16 * r;
    for (let i = 0; i < 16; i++)
        out[tail + i] = input[ii + (2 * r - 1) * 16 + i]; // X ← B[2r−1]
    for (let i = 0; i < r; i++, head += 16, ii += 16) {
        // RFC 7914 §4 step 3 outputs `Y[0], Y[2], ...` first, then `Y[1], Y[3], ...`;
        // `head` and `tail` lay out those even/odd halves in place.
        XorAndSalsa(out, tail, input, ii, out, head); // head[i] = Salsa(blockIn[2*i] ^ tail[i-1])
        if (i > 0)
            tail += 16; // First iteration overwrites tmp value in tail
        // tail[i] = Salsa(blockIn[2*i+1] ^ head[i])
        XorAndSalsa(out, head, input, (ii += 16), out, tail);
    }
}
// 128*r*(N+p+1) for N=2**20, r=8, p=1: 1 GiB main table plus 2 KiB workspace.
const SCRYPT_DEFAULT_MAXMEM = 128 * 8 * (2 ** 20 + 1 + 1);
// Common prologue and epilogue for sync/async functions
function scryptInit(password, salt, _opts) {
    const opts = checkOpts({
        dkLen: 32,
        asyncTick: 10,
        maxmem: SCRYPT_DEFAULT_MAXMEM,
    }, _opts);
    const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = opts;
    anumber(N, 'N');
    anumber(r, 'r');
    anumber(p, 'p');
    anumber(dkLen, 'dkLen');
    anumber(asyncTick, 'asyncTick');
    anumber(maxmem, 'maxmem');
    if (onProgress !== undefined && typeof onProgress !== 'function')
        throw new Error('"onProgress" must be a function');
    // Without this, r=0 slips through: blockSize=0 turns the `p` upper bound into
    // Infinity and the failure surfaces later as a confusing pbkdf2 dkLen error.
    if (r < 1)
        throw new Error('"r" expected integer >= 1');
    const blockSize = 128 * r;
    const blockSize32 = blockSize / 4;
    // Max N is 2^32 (Integrify is 32-bit).
    // Real limit can be 2^22: some JS engines limit Uint8Array to 4GB.
    // Spec check `N >= 2^(blockSize / 8)` is not done for compat with popular libs,
    // which used incorrect r: 1, p: 8. Also, the check seems to be a spec error:
    // https://www.rfc-editor.org/errata_search.php?rfc=7914
    const pow32 = Math.pow(2, 32);
    if (N <= 1 || (N & (N - 1)) !== 0 || N > pow32)
        throw new Error('"N" expected a power of 2, and 2^1 <= N <= 2^32');
    if (p < 1 || p > ((pow32 - 1) * 32) / blockSize)
        throw new Error('"p" expected integer 1..((2^32 - 1) * 32) / (128 * r)');
    // RFC 7914 §2 defines `dkLen` as a positive integer.
    if (dkLen < 1 || dkLen > (pow32 - 1) * 32)
        throw new Error('"dkLen" expected integer 1..(2^32 - 1) * 32');
    // Include the shared `tmp` scratch block so `maxmem` matches noble's actual temporary allocation.
    // Node requires more headroom here, so this accounting is intentionally noble-specific.
    const memUsed = blockSize * (N + p + 1);
    if (memUsed > maxmem)
        throw new Error('"maxmem" limit was hit: memUsed(128*r*(N+p+1))=' + memUsed + ', maxmem=' + maxmem);
    // [B0...Bp−1] ← PBKDF2HMAC-SHA256(Passphrase, Salt, 1, blockSize*ParallelizationFactor)
    // Since it has only one iteration there is no reason to use async variant
    const B = pbkdf2(sha256, password, salt, { c: 1, dkLen: blockSize * p });
    const B32 = u32(B);
    // Re-used between parallel iterations. Array(iterations) of B
    const V = u32(new Uint8Array(blockSize * N));
    const tmp = u32(new Uint8Array(blockSize));
    let blockMixCb = () => { };
    if (onProgress) {
        const totalBlockMix = 2 * N * p;
        // Invoke callback if progress changes from 10.01 to 10.02
        // Allows to draw smooth progress bar on up to 8K screen
        const callbackPer = Math.max(Math.floor(totalBlockMix / 10000), 1);
        let blockMixCnt = 0;
        blockMixCb = () => {
            blockMixCnt++;
            if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix)) {
                // Wiping here instead of a try/catch around the main loops keeps them
                // try-free: measured ~1% slower at N=2^21 with the loops inside a try.
                // onProgress is the only user code that can throw mid-derivation.
                try {
                    onProgress(blockMixCnt / totalBlockMix);
                }
                catch (e) {
                    clean(B, V, tmp);
                    throw e;
                }
            }
        };
    }
    return { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick };
}
function scryptOutput(password, dkLen, B, V, tmp) {
    // Shared final PBKDF2-and-cleanup step: keep the derived key, wipe the scrypt workspace.
    const res = pbkdf2(sha256, password, B, { c: 1, dkLen });
    clean(B, V, tmp);
    return res;
}
/**
 * Scrypt KDF from RFC 7914. See {@link ScryptOpts}.
 * @param password - password or key material to derive from;
 *   JS string inputs are UTF-8 encoded first
 * @param salt - unique salt bytes or string; JS string inputs are UTF-8 encoded first
 * @param opts - Scrypt cost and memory parameters. `dkLen`, if provided,
 *   must be `>= 1` per RFC 7914 §2. See {@link ScryptOpts}.
 * @returns Derived key bytes.
 * @throws If the Scrypt cost, memory, or callback options are invalid. {@link Error}
 * @example
 * Derive a key with scrypt.
 * ```ts
 * scrypt('password', 'salt', { N: 2**18, r: 8, p: 1, dkLen: 32 });
 * ```
 * @example
 * Derive a key with small demo costs and progress/memory controls.
 * ```ts
 * const progressLog: number[] = [];
 * scrypt('password', 'salt', {
 *   N: 16,
 *   r: 8,
 *   p: 1,
 *   dkLen: 32,
 *   maxmem: 1024 * 1024,
 *   asyncTick: 10,
 *   onProgress(progress) {
 *     progressLog.push(progress);
 *   },
 * });
 * ```
 */
function scrypt(password, salt, opts) {
    const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb } = scryptInit(password, salt, opts);
    swap32IfBE(B32);
    for (let pi = 0; pi < p; pi++) {
        const Pi = blockSize32 * pi;
        for (let i = 0; i < blockSize32; i++)
            V[i] = B32[Pi + i]; // V[0] = B[i]
        for (let i = 0, pos = 0; i < N - 1; i++) {
            BlockMix(V, pos, V, (pos += blockSize32), r); // V[i] = BlockMix(V[i-1]);
            blockMixCb();
        }
        BlockMix(V, (N - 1) * blockSize32, B32, Pi, r); // Process last element
        blockMixCb();
        for (let i = 0; i < N; i++) {
            // First u32 of the last 64-byte block (u32 is LE)
            // RFC 7914 Integerify(X) uses the whole last 64-byte block, but mod N
            // only depends on the low word here because N is a power of two and
            // this implementation caps N at 2^32.
            // & (N - 1) is % N as N is a power of 2, N & (N - 1) = 0 is checked
            // above; >>> 0 for unsigned, input fits in u32.
            const j = (B32[Pi + blockSize32 - 16] & (N - 1)) >>> 0; // j = Integrify(X) % iterations
            // tmp = B ^ V[j]
            for (let k = 0; k < blockSize32; k++)
                tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
            BlockMix(tmp, 0, B32, Pi, r); // B = BlockMix(B ^ V[j])
            blockMixCb();
        }
    }
    swap32IfBE(B32);
    return scryptOutput(password, dkLen, B, V, tmp);
}
/**
 * Scrypt KDF from RFC 7914. Async version. See {@link ScryptOpts}.
 * @param password - password or key material to derive from;
 *   JS string inputs are UTF-8 encoded first
 * @param salt - unique salt bytes or string; JS string inputs are UTF-8 encoded first
 * @param opts - Scrypt cost and memory parameters. `dkLen`, if provided,
 *   must be `>= 1` per RFC 7914 §2. `asyncTick` is only a local
 *   scheduler-yield control for this JS wrapper, not part of RFC 7914.
 *   See {@link ScryptOpts}.
 * @returns Promise resolving to derived key bytes.
 * @throws If the Scrypt cost, memory, or callback options are invalid. {@link Error}
 * @example
 * Derive a key with scrypt asynchronously.
 * ```ts
 * await scryptAsync('password', 'salt', { N: 2**18, r: 8, p: 1, dkLen: 32 });
 * ```
 * @example
 * Derive a key asynchronously with small demo costs and progress/memory controls.
 * ```ts
 * await scryptAsync('password', 'salt', {
 *   N: 16,
 *   r: 8,
 *   p: 1,
 *   dkLen: 32,
 *   maxmem: 1024 * 1024,
 *   asyncTick: 1,
 *   onProgress(progress) {
 *     if (progress > 1) throw new Error('invalid progress');
 *   },
 * });
 * ```
 */
async function scryptAsync(password, salt, opts) {
    const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick } = scryptInit(password, salt, opts);
    // One failure handler covers both yield boundaries without putting the hot loops in a try block.
    const abort = () => scrypt_clean(B, V, tmp);
    scrypt_swap32IfBE(B32);
    for (let pi = 0; pi < p; pi++) {
        const Pi = blockSize32 * pi;
        for (let i = 0; i < blockSize32; i++)
            V[i] = B32[Pi + i]; // V[0] = B[i]
        let pos = 0;
        await scrypt_asyncLoop(N - 1, asyncTick, () => {
            BlockMix(V, pos, V, (pos += blockSize32), r); // V[i] = BlockMix(V[i-1]);
            blockMixCb();
        }, abort);
        BlockMix(V, (N - 1) * blockSize32, B32, Pi, r); // Process last element
        blockMixCb();
        await scrypt_asyncLoop(N, asyncTick, () => {
            // First u32 of the last 64-byte block (u32 is LE)
            // RFC 7914 Integerify(X) uses the whole last 64-byte block, but mod N
            // only depends on the low word here because N is a power of two and
            // this implementation caps N at 2^32.
            // & (N - 1) is % N as N is a power of 2, N & (N - 1) = 0 is checked
            // above; >>> 0 for unsigned, input fits in u32.
            const j = (B32[Pi + blockSize32 - 16] & (N - 1)) >>> 0; // j = Integrify(X) % iterations
            // tmp = B ^ V[j]
            for (let k = 0; k < blockSize32; k++)
                tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
            BlockMix(tmp, 0, B32, Pi, r); // B = BlockMix(B ^ V[j])
            blockMixCb();
        }, abort);
    }
    scrypt_swap32IfBE(B32);
    return scryptOutput(password, dkLen, B, V, tmp);
}

;// ./android/runtime/crypto.mjs




function crypto_randomBytes(length) { const bytes = new Uint8Array(length); globalThis.crypto.getRandomValues(bytes); return buffer/* Buffer */.h.from(bytes); }
function randomUUID() { const bytes = crypto_randomBytes(16); bytes[6] = bytes[6] & 15 | 64; bytes[8] = bytes[8] & 63 | 128; const hex = bytes.toString('hex'); return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20); }
function timingSafeEqual(a, b) { if (a.length !== b.length) throw new Error('Input buffers must have the same byte length.'); let difference = 0; for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i]; return difference === 0; }
function scryptSync(password, salt, length) {
  const p = buffer/* Buffer */.h.from(password), s = buffer/* Buffer */.h.from(salt);
  try { return buffer/* Buffer */.h.from((0,bridge/* nativeCall */.M)('crypto.scrypt', { password: p.toString('base64'), salt: s.toString('base64'), length }), 'base64'); }
  catch (error) { if (!/unsupported|unknown operation/i.test(error.message)) throw error; return buffer/* Buffer */.h.from(scrypt(p, s, { N: 16384, r: 8, p: 1, dkLen: length })); }
}
function createHash(algorithm) {
  if (algorithm !== 'sha256') throw new Error('Unsupported hash algorithm: ' + algorithm);
  const parts = [];
  return { update(value, encoding) { parts.push(buffer/* Buffer */.h.from(value, encoding)); return this; }, digest(encoding) { const result = buffer/* Buffer */.h.from(sha256(buffer/* Buffer */.h.concat(parts))); return encoding ? result.toString(encoding) : result; } };
}


;// ./android/runtime/async-hooks.mjs
// Requests are serialized by the HTTP adapter. Nested tenant operations preserve
// their parent context until the returned promise has settled.
class AsyncLocalStorage {
  getStore() { return this.store; }
  run(store, callback) {
    const previous = this.store; this.store = store;
    let result;
    try { result = callback(); } catch (error) { this.store = previous; throw error; }
    if (result?.then) return Promise.resolve(result).finally(() => { this.store = previous; });
    this.store = previous; return result;
  }
}


;// ./android/runtime/sqlite.mjs


const encode = value => value instanceof Uint8Array ? { __bytes: buffer/* Buffer */.h.from(value).toString('base64') } : value;
const decode = value => value && typeof value === 'object' && typeof value.__bytes === 'string' ? buffer/* Buffer */.h.from(value.__bytes, 'base64') : value;
class DatabaseSync {
  constructor(path) { this.handle = (0,bridge/* nativeCall */.M)('sqlite.open', { path }); }
  exec(sql) { return (0,bridge/* nativeCall */.M)('sqlite.exec', { handle: this.handle, sql }); }
  prepare(sql) {
    const handle = this.handle;
    return {
      all(...params) { return (0,bridge/* nativeCall */.M)('sqlite.all', { handle, sql, params: params.map(encode) }).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, decode(value)]))); },
      get(...params) { return this.all(...params)[0]; },
      run(...params) { return (0,bridge/* nativeCall */.M)('sqlite.run', { handle, sql, params: params.map(encode) }); }
    };
  }
  close() { ;(0,bridge/* nativeCall */.M)('sqlite.close', { handle: this.handle }); }
}


;// ./android/runtime/zlib.mjs


function deflateRawSync(data, options = {}) { return buffer/* Buffer */.h.from((0,bridge/* nativeCall */.M)('zlib.deflate', { data: buffer/* Buffer */.h.from(data).toString('base64'), level: options.level ?? 6 }), 'base64'); }
function inflateRawSync(data, options = {}) { return buffer/* Buffer */.h.from((0,bridge/* nativeCall */.M)('zlib.inflate', { data: buffer/* Buffer */.h.from(data).toString('base64'), maxOutputLength: options.maxOutputLength || 384 * 1024 * 1024 }), 'base64'); }


;// ./server/excel-backup.mjs
/* provided dependency */ var Buffer = __webpack_require__(1).h;



const MAX_XLSX_BYTES = 128 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 384 * 1024 * 1024;
const MAX_SHEET_ROWS = 1_048_576;
const CELL_TEXT_LIMIT = 30_000;
const ASSET_CHUNK_SIZE = 20_000;
const FORMAT_ID = 'itsme-invoicey-sqlite-xlsx-v1';

const BACKUP_TABLES = [
  'settings','app_metadata','sequences','companies','customers','suppliers','products','company_properties','resource_usage','services','projects',
  'invoices','invoice_items','payments','quotations','quotation_items','purchases','purchase_items',
  'supplier_payments','expenses','expense_categories','expense_attachments','stock_movements','partners','profit_shares','warranty_claims','warranty_claim_events','repair_intakes'
];

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let value = n;
    for (let k = 0; k < 8; k++) value = value & 1 ? (0xedb88320 ^ (value >>> 1)) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function xmlEscape(value) {
  return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/\r/g,'&#13;');
}

function xmlUnescape(value) {
  return String(value).replace(/&#x([0-9a-f]+);/gi,(_,hex)=>String.fromCodePoint(parseInt(hex,16)))
    .replace(/&#([0-9]+);/g,(_,number)=>String.fromCodePoint(Number(number)))
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
}

function colName(index) {
  let result = '';
  while (index > 0) {
    const remainder = (index - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    index = Math.floor((index - 1) / 26);
  }
  return result;
}

function attr(source, name) {
  const match = String(source).match(new RegExp('(?:^|\\s)' + name + '=\"([^\"]*)\"'));
  return match ? xmlUnescape(match[1]) : '';
}

function canonicalValue(value) {
  if (value === null || value === undefined) return ['null',''];
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return ['binary',Buffer.from(value).toString('base64')];
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('The database contains a non-finite number and cannot be backed up.');
    return ['number',value];
  }
  if (typeof value === 'bigint') return ['number',Number(value)];
  if (typeof value === 'boolean') return ['boolean',value];
  return ['text',String(value)];
}

function schemaHash(schema) {
  const description = schema.map(table => table.name + ':' + table.columns.map(column => column.name + ':' + column.type).join(',')).join('|');
  return createHash('sha256').update(description).digest('hex');
}

function dataHash(tables, schema) {
  const serial = schema.map(table => [
    table.name,
    (tables[table.name] || []).map(row => table.columns.map(column => canonicalValue(row[column.name])))
  ]);
  return createHash('sha256').update(JSON.stringify(serial)).digest('hex');
}

function workbookCell(address, value, nullMarker, assetPrefix, assets) {
  let current = value;
  if (current === null || current === undefined) current = nullMarker;
  else if (Buffer.isBuffer(current) || current instanceof Uint8Array) {
    current = addAsset(Buffer.from(current).toString('base64'),'base64',assetPrefix,assets);
  } else if (typeof current === 'number' || typeof current === 'bigint') {
    const number = Number(current);
    if (!Number.isFinite(number)) throw new Error('The database contains an invalid number.');
    return '<c r=\"' + address + '\"><v>' + String(number) + '</v></c>';
  } else if (typeof current === 'boolean') {
    return '<c r=\"' + address + '\" t=\"b\"><v>' + (current ? '1' : '0') + '</v></c>';
  } else {
    current = String(current);
    if (current.length > CELL_TEXT_LIMIT || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/.test(current) || current === nullMarker) {
      current = addAsset(current,'utf8-base64',assetPrefix,assets);
    }
  }
  return '<c r=\"' + address + '\" t=\"inlineStr\"><is><t xml:space=\"preserve\">' + xmlEscape(current) + '</t></is></c>';
}

function addAsset(text, encoding, prefix, assets) {
  const token = prefix + randomUUID() + '__';
  const encoded = encoding === 'base64' ? text : Buffer.from(text,'utf8').toString('base64');
  for (let offset = 0, part = 1; offset < encoded.length; offset += ASSET_CHUNK_SIZE, part++) {
    assets.push([token,part,encoding,encoded.slice(offset,offset + ASSET_CHUNK_SIZE)]);
  }
  if (!encoded.length) assets.push([token,1,encoding,'']);
  return token;
}

function sheetXml(headers, rows, nullMarker, assetPrefix, assets) {
  if (rows.length + 1 > MAX_SHEET_ROWS) throw new Error('This data set is too large for an Excel worksheet.');
  const allRows = [headers,...rows];
  const lastCol = colName(Math.max(headers.length,1));
  const xmlRows = allRows.map((row,rowIndex) => {
    const cells = row.map((value,columnIndex) => workbookCell(colName(columnIndex + 1) + (rowIndex + 1),value,nullMarker,assetPrefix,assets)).join('');
    return '<row r=\"' + (rowIndex + 1) + '\">' + cells + '</row>';
  }).join('');
  return '<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>' +
    '<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><dimension ref=\"A1:' + lastCol + Math.max(allRows.length,1) + '\"/><sheetViews><sheetView workbookViewId=\"0\"/></sheetViews><sheetFormatPr defaultRowHeight=\"15\"/><sheetData>' +
    xmlRows + '</sheetData><pageMargins left=\"0.35\" right=\"0.35\" top=\"0.5\" bottom=\"0.5\" header=\"0.2\" footer=\"0.2\"/></worksheet>';
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980,date.getFullYear());
  return { date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(), time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2) };
}

function zipCreate(entries) {
  if (entries.length > 0xffff) throw new Error('The workbook contains too many files.');
  const localParts = [];
  const directoryParts = [];
  let offset = 0;
  let expanded = 0;
  const stamp = dosDateTime();
  for (const [name,dataValue] of entries) {
    const nameBytes = Buffer.from(name,'utf8');
    const data = Buffer.isBuffer(dataValue) ? dataValue : Buffer.from(dataValue,'utf8');
    expanded += data.length;
    if (expanded > MAX_UNPACKED_BYTES) throw new Error('The Excel backup content exceeds the 384 MB uncompressed file limit.');
    const compressed = deflateRawSync(data,{level:6});
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4); local.writeUInt16LE(0x0800,6);
    local.writeUInt16LE(8,8); local.writeUInt16LE(stamp.time,10); local.writeUInt16LE(stamp.date,12);
    local.writeUInt32LE(checksum,14); local.writeUInt32LE(compressed.length,18); local.writeUInt32LE(data.length,22);
    local.writeUInt16LE(nameBytes.length,26); local.writeUInt16LE(0,28);
    localParts.push(local,nameBytes,compressed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50,0); central.writeUInt16LE(20,4); central.writeUInt16LE(20,6);
    central.writeUInt16LE(0x0800,8); central.writeUInt16LE(8,10); central.writeUInt16LE(stamp.time,12);
    central.writeUInt16LE(stamp.date,14); central.writeUInt32LE(checksum,16);
    central.writeUInt32LE(compressed.length,20); central.writeUInt32LE(data.length,24);
    central.writeUInt16LE(nameBytes.length,28); central.writeUInt16LE(0,30); central.writeUInt16LE(0,32);
    central.writeUInt16LE(0,34); central.writeUInt16LE(0,36); central.writeUInt32LE(0,38); central.writeUInt32LE(offset,42);
    directoryParts.push(central,nameBytes);
    offset += local.length + nameBytes.length + compressed.length;
  }
  const directory = Buffer.concat(directoryParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(0,4); end.writeUInt16LE(0,6);
  end.writeUInt16LE(entries.length,8); end.writeUInt16LE(entries.length,10);
  end.writeUInt32LE(directory.length,12); end.writeUInt32LE(offset,16); end.writeUInt16LE(0,20);
  const result = Buffer.concat([...localParts,directory,end]);
  if (result.length > MAX_XLSX_BYTES) throw new Error('The Excel backup would exceed the 128 MB file limit.');
  return result;
}

function createBackupWorkbook(tables, schema, backupInfo = '1.0.0') {
  const options=typeof backupInfo==='string'?{appVersion:backupInfo}:{...(backupInfo||{})};
  const appVersion=String(options.appVersion||'2.0.0');
  const tableNames = schema.map(table => table.name);
  for (const name of tableNames) if (!Array.isArray(tables[name])) throw new Error('Missing database table for Excel backup: ' + name);
  const nullMarker = '__ITS_INVOICEY_NULL_' + randomUUID() + '__';
  const assetPrefix = '__ITS_INVOICEY_DATA_' + randomUUID() + '_';
  const assets = [];
  const entries = [];
  const manifest = [
    ['format',FORMAT_ID],
    ['application','itsme invoicey'],
    ['companyId',String(options.companyId||'')],
    ['companyName',String(options.companyName||'')],
    ['version',String(appVersion)],
    ['createdAt',new Date().toISOString()],
    ['schemaHash',schemaHash(schema)],
    ['dataHash',dataHash(tables,schema)],
    ['nullMarker',nullMarker],
    ['assetPrefix',assetPrefix]
  ];
  const sheets = [{name:'Backup Manifest',headers:['Setting','Value'],rows:manifest}];
  for (const table of schema) sheets.push({name:table.name,headers:table.columns.map(column=>column.name),rows:tables[table.name].map(row=>table.columns.map(column=>row[column.name]))});
  sheets.push({name:'Backup Content',headers:['Token','Part','Encoding','Data'],rows:assets});

  const sheetFiles = [];
  for (let index = 0; index < sheets.length; index++) {
    const sheet = sheets[index];
    sheetFiles.push({name:sheet.name,path:'xl/worksheets/sheet' + (index + 1) + '.xml',xml:sheetXml(sheet.headers,sheet.rows,sheet.name==='Backup Manifest'?null:nullMarker,assetPrefix,assets)});
  }
  const contentSheet = sheetFiles.find(sheet=>sheet.name==='Backup Content');
  contentSheet.xml = sheetXml(['Token','Part','Encoding','Data'],assets,nullMarker,assetPrefix,[]);

  const relationships = sheetFiles.map((sheet,index)=>'<Relationship Id=\"rId' + (index + 1) + '\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet' + (index + 1) + '.xml\"/>').join('') +
    '<Relationship Id=\"rId' + (sheetFiles.length + 1) + '\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>';
  const workbookSheets = sheetFiles.map((sheet,index)=>'<sheet name=\"' + xmlEscape(sheet.name) + '\" sheetId=\"' + (index + 1) + '\" r:id=\"rId' + (index + 1) + '\"/>').join('');
  const contentTypes = '<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>' +
    sheetFiles.map(sheet=>'<Override PartName=\"/' + sheet.path + '\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>').join('') + '<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/><Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/></Types>';
  entries.push(['[Content_Types].xml',contentTypes]);
  entries.push(['_rels/.rels','<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/><Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/><Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/></Relationships>']);
  entries.push(['xl/workbook.xml','<?xml version=\"1.0\" encoding=\"UTF-8\"?><workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><bookViews><workbookView activeTab=\"0\"/></bookViews><sheets>' + workbookSheets + '</sheets><calcPr calcId=\"191029\"/></workbook>']);
  entries.push(['xl/_rels/workbook.xml.rels','<?xml version=\"1.0\" encoding=\"UTF-8\"?><Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">' + relationships + '</Relationships>']);
  entries.push(['xl/styles.xml','<?xml version=\"1.0\" encoding=\"UTF-8\"?><styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><fonts count=\"1\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts><fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills><borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs><cellXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/></cellXfs><cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles></styleSheet>']);
  entries.push(['docProps/core.xml','<?xml version=\"1.0\" encoding=\"UTF-8\"?><cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\"><dc:creator>itsme invoicey</dc:creator><dc:title>Business data backup</dc:title></cp:coreProperties>']);
  entries.push(['docProps/app.xml','<?xml version=\"1.0\" encoding=\"UTF-8\"?><Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\"><Application>itsme invoicey</Application></Properties>']);
  entries.push(...sheetFiles.map(sheet=>[sheet.path,sheet.xml]));
  return zipCreate(entries);
}

function zipRead(buffer) {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer || []);
  if (buffer.length < 22 || buffer.length > MAX_XLSX_BYTES) throw new Error('Choose a valid Excel backup file smaller than 128 MB.');
  const earliest = Math.max(0,buffer.length - 65_557);
  let endOffset = -1;
  for (let offset=buffer.length-22; offset>=earliest; offset--) {
    if (buffer.readUInt32LE(offset)===0x06054b50) { endOffset=offset; break; }
  }
  if (endOffset<0) throw new Error('This is not a complete Excel workbook.');
  const count = buffer.readUInt16LE(endOffset+10);
  const directorySize = buffer.readUInt32LE(endOffset+12);
  let cursor = buffer.readUInt32LE(endOffset+16);
  if (count===0xffff || directorySize===0xffffffff || cursor===0xffffffff || cursor+directorySize>endOffset) throw new Error('Excel ZIP64 backups are not supported by this version.');
  const files = new Map();
  let expanded = 0;
  for (let index=0; index<count; index++) {
    if (cursor+46>buffer.length || buffer.readUInt32LE(cursor)!==0x02014b50) throw new Error('The Excel backup contains a damaged ZIP directory.');
    const flags=buffer.readUInt16LE(cursor+8), method=buffer.readUInt16LE(cursor+10);
    const expectedCrc=buffer.readUInt32LE(cursor+16), compressedSize=buffer.readUInt32LE(cursor+20), size=buffer.readUInt32LE(cursor+24);
    const nameSize=buffer.readUInt16LE(cursor+28), extraSize=buffer.readUInt16LE(cursor+30), commentSize=buffer.readUInt16LE(cursor+32);
    const localOffset=buffer.readUInt32LE(cursor+42);
    const name=buffer.subarray(cursor+46,cursor+46+nameSize).toString('utf8');
    cursor += 46+nameSize+extraSize+commentSize;
    if (!name || name.includes('..') || name.startsWith('/') || name.includes('\\') || files.has(name)) throw new Error('The Excel backup contains an unsafe or duplicate file path.');
    if (flags&1 || (method!==0 && method!==8) || size>MAX_UNPACKED_BYTES) throw new Error('The Excel backup uses an unsupported or encrypted ZIP entry.');
    if (localOffset+30>buffer.length || buffer.readUInt32LE(localOffset)!==0x04034b50) throw new Error('The Excel backup contains a damaged file entry.');
    const localNameSize=buffer.readUInt16LE(localOffset+26), localExtraSize=buffer.readUInt16LE(localOffset+28);
    const dataOffset=localOffset+30+localNameSize+localExtraSize;
    if (dataOffset+compressedSize>buffer.length) throw new Error('The Excel backup has a truncated file entry.');
    expanded += size;
    if (expanded>MAX_UNPACKED_BYTES) throw new Error('The Excel backup expands beyond the safe import size.');
    const compressed=buffer.subarray(dataOffset,dataOffset+compressedSize);
    let data;
    try { data=method===0?Buffer.from(compressed):inflateRawSync(compressed,{maxOutputLength:MAX_UNPACKED_BYTES}); }
    catch { throw new Error('The Excel backup contains a corrupt compressed file.'); }
    if (data.length!==size || crc32(data)!==expectedCrc) throw new Error('The Excel backup failed its integrity check.');
    files.set(name,data.toString('utf8'));
  }
  return files;
}

function readTextElement(source, tag) {
  const match=String(source).match(new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)</'+tag+'>','i'));
  return match ? xmlUnescape(match[1]) : '';
}

function columnIndex(reference) {
  const letters=String(reference).match(/^[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) throw new Error('The Excel backup contains a cell without a valid address.');
  let result=0;
  for (const letter of letters) result=result*26+letter.charCodeAt(0)-64;
  if (!Number.isSafeInteger(result)||result<1||result>16_384) throw new Error('The Excel backup contains a cell outside the worksheet limits.');
  return result-1;
}

function parseSheet(xml, sharedStrings) {
  if (/<f\b/i.test(xml)) throw new Error('Backup sheets must not contain formulas. Download a fresh backup and try again.');
  const rows=[];
  const rowMatcher=/<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  let rowMatch;
  while ((rowMatch=rowMatcher.exec(xml))) {
    const row=[];
    const cellMatcher=/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/gi;
    let cellMatch;
    while ((cellMatch=cellMatcher.exec(rowMatch[1]))) {
      const address=attr(cellMatch[1],'r');
      const type=attr(cellMatch[1],'t');
      const body=cellMatch[2]||'';
      let value=null;
      if (type==='inlineStr') {
        value=[...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map(item=>xmlUnescape(item[1])).join('');
      } else {
        const raw=readTextElement(body,'v');
        if (type==='s') {
          const index=Number(raw);
          if (!Number.isInteger(index)||index<0||index>=sharedStrings.length) throw new Error('The Excel backup has an invalid shared string.');
          value=sharedStrings[index];
        } else if (type==='b') value=raw==='1';
        else if (type==='e') throw new Error('The Excel backup contains an Excel error cell.');
        else if (raw!=='') {
          if (type==='n'||type==='') {
            const number=Number(raw);
            if (!Number.isFinite(number)) throw new Error('The Excel backup contains an invalid numeric value.');
            value=number;
          } else value=xmlUnescape(raw);
        } else value='';
      }
      const index=columnIndex(address);
      if (Object.hasOwn(row,index)) throw new Error('The Excel backup contains duplicate cells.');
      row[index]=value;
    }
    rows.push(row);
    if (rows.length>MAX_SHEET_ROWS) throw new Error('The Excel backup contains too many worksheet rows.');
  }
  return rows;
}

function workbookContents(files) {
  const workbook=files.get('xl/workbook.xml');
  const relations=files.get('xl/_rels/workbook.xml.rels');
  if (!workbook||!relations||!files.has('[Content_Types].xml')||!files.has('_rels/.rels')) throw new Error('This file is not a complete .xlsx workbook.');
  const relationMap=new Map();
  for (const match of relations.matchAll(/<Relationship\b([^>]*?)\/?>(?:[\s\S]*?<\/Relationship>)?/gi)) {
    const id=attr(match[1],'Id'),target=attr(match[1],'Target'),type=attr(match[1],'Type');
    if (id && target && type?.endsWith('/worksheet')) relationMap.set(id,target);
  }
  const sharedStrings=files.has('xl/sharedStrings.xml')
    ? [...files.get('xl/sharedStrings.xml').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi)].map(match=>[...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map(item=>xmlUnescape(item[1])).join(''))
    : [];
  const sheets=new Map();
  for (const match of workbook.matchAll(/<sheet\b([^>]*?)\/?>(?:[\s\S]*?<\/sheet>)?/gi)) {
    const name=attr(match[1],'name'),relationshipId=attr(match[1],'r:id')||attr(match[1],'id'),target=relationMap.get(relationshipId);
    if (!name||!target||sheets.has(name)) throw new Error('The Excel backup contains a missing or duplicate worksheet.');
    const clean=target.replaceAll('\\','/');
    const filePath=clean.startsWith('/')?clean.slice(1):'xl/'+clean.replace(/^\.\//,'');
    const xml=files.get(filePath);
    if (!xml) throw new Error('The Excel backup is missing worksheet ' + name + '.');
    sheets.set(name,parseSheet(xml,sharedStrings));
  }
  return sheets;
}

function parseBackupWorkbook(input, schema, expectations = {}) {
  const files=zipRead(input);
  const sheets=workbookContents(files);
  const manifestRows=sheets.get('Backup Manifest');
  if (!manifestRows||!sheets.has('Backup Content')) throw new Error('Choose a backup file created by itsme invoicey.');
  const manifest=Object.fromEntries(manifestRows.slice(1).filter(row=>row?.[0]!==undefined).map(row=>[String(row[0]),row[1]===undefined?'':String(row[1])]));
  if (manifest.format!==FORMAT_ID||manifest.application!=='itsme invoicey') throw new Error('This is not a supported itsme invoicey backup.');
  if (manifest.schemaHash!==schemaHash(schema)) throw new Error('This backup uses a different or incompatible database version.');
  if(expectations.companyId){
    if(!manifest.companyId||manifest.companyId!==String(expectations.companyId))throw new Error('This Excel backup belongs to a different company. No records were restored.');
    if(!manifest.companyName)throw new Error('This Excel backup is missing its company name.');
    const expectedMajor=String(expectations.appVersion||'2.0.0').split('.')[0],backupMajor=String(manifest.version||'').split('.')[0];
    if(!/^\d+$/.test(backupMajor)||backupMajor!==expectedMajor)throw new Error('This Excel backup was created by an incompatible software version.');
  }
  if (!/^[a-f0-9]{64}$/i.test(manifest.dataHash||'')) throw new Error('The Excel backup is missing its integrity signature.');
  if (!/^__ITS_INVOICEY_NULL_[a-f0-9-]+__$/i.test(manifest.nullMarker||'')||!/^__ITS_INVOICEY_DATA_[a-f0-9-]+_$/i.test(manifest.assetPrefix||'')) throw new Error('The Excel backup has invalid content markers.');

  const expectedNames=new Set(['Backup Manifest','Backup Content',...schema.map(table=>table.name)]);
  if (sheets.size!==expectedNames.size||[...sheets.keys()].some(name=>!expectedNames.has(name))) throw new Error('The Excel backup has missing or unexpected worksheets.');
  const assets=new Map();
  const contentRows=sheets.get('Backup Content');
  if (!contentRows?.[0]||contentRows[0].slice(0,4).join('|')!=='Token|Part|Encoding|Data') throw new Error('The backup content worksheet has an invalid format.');
  for (const row of contentRows.slice(1)) {
    if (!row||row[0]===undefined) continue;
    const token=String(row[0]),part=Number(row[1]),encoding=String(row[2]),data=String(row[3]??'');
    if (!token.startsWith(manifest.assetPrefix)||!Number.isInteger(part)||part<1||!['base64','utf8-base64'].includes(encoding)) throw new Error('The backup content worksheet contains invalid data.');
    if (!assets.has(token)) assets.set(token,{encoding,parts:new Map()});
    const asset=assets.get(token);
    if (asset.encoding!==encoding||asset.parts.has(part)||data.length>ASSET_CHUNK_SIZE) throw new Error('The backup content worksheet contains duplicate or inconsistent data.');
    asset.parts.set(part,data);
  }
  for (const asset of assets.values()) {
    const sorted=[...asset.parts.keys()].sort((a,b)=>a-b);
    if (!sorted.length||sorted.some((number,index)=>number!==index+1)) throw new Error('The backup content worksheet is incomplete.');
  }
  const restoreAssets=new Map();
  for (const [token,asset] of assets) {
    const encoded=[...asset.parts].sort((a,b)=>a[0]-b[0]).map(([,part])=>part).join('');
    if (!/^(?:[A-Za-z0-9+/]*={0,2})$/.test(encoded)) throw new Error('The backup contains invalid encoded image or attachment data.');
    const bytes=Buffer.from(encoded,'base64');
    if (bytes.toString('base64')!==encoded) throw new Error('The backup contains damaged image or attachment data.');
    restoreAssets.set(token,asset.encoding==='base64'?bytes:bytes.toString('utf8'));
  }

  const tables={};
  for (const table of schema) {
    const rows=sheets.get(table.name);
    const expectedHeaders=table.columns.map(column=>column.name);
    if (!rows?.[0]||rows[0].length!==expectedHeaders.length||expectedHeaders.some((header,index)=>rows[0][index]!==header)) throw new Error('The worksheet for ' + table.name + ' does not match this application version.');
    tables[table.name]=[];
    for (const row of rows.slice(1)) {
      if (!row||row.every(value=>value===undefined||value===null||value==='')) continue;
      if (row.length>expectedHeaders.length) throw new Error('The worksheet for ' + table.name + ' contains unexpected data columns.');
      const record={};
      for (let index=0;index<expectedHeaders.length;index++) {
        let value=row[index]===undefined?'':row[index];
        if (value===manifest.nullMarker) value=null;
        else if (typeof value==='string'&&value.startsWith(manifest.assetPrefix)) {
          if (!restoreAssets.has(value)) throw new Error('The backup references missing image or attachment data.');
          value=restoreAssets.get(value);
        }
        const column=table.columns[index];
        if (value!==null&&(/INT|REAL|NUM|FLOA|DOUB/i.test(column.type))&&typeof value==='string'&&value.trim()!=='') {
          const number=Number(value);
          if (!Number.isFinite(number)) throw new Error('The ' + table.name + ' worksheet contains an invalid numeric value.');
          value=number;
        }
        record[column.name]=value;
      }
      tables[table.name].push(record);
    }
  }
  if (dataHash(tables,schema)!==manifest.dataHash) throw new Error('The backup data has changed or is damaged. No records were restored.');
  const companyRows=tables.companies||[];
  if (!companyRows.length||companyRows.filter(company=>Number(company.is_default)===1).length!==1) throw new Error('The backup must include exactly one company profile marked as the default.');
  if (tables.settings?.length!==1||Number(tables.settings[0].id)!==1) throw new Error('The backup does not contain a valid application settings record.');
  return {manifest,tables};
}

;// ./server/access-control.mjs
/* provided dependency */ var access_control_Buffer = __webpack_require__(1).h;





const stamp=()=>new Date().toISOString();
const scopes=['dashboard','customers','suppliers','products','company_properties','services','inventory','quotations','estimates','invoices','purchases','payments','expenses','profit','reports','partners','warranty_claims','companies','users','backup','records'];
const actions=['view','create','edit','delete','adjust','export','restore','manage','view_own'];
const emptyPermissions=()=>Object.fromEntries(scopes.map(scope=>[scope,Object.fromEntries(actions.map(action=>[action,false]))]));
function rolePermissions(role){
 const p=emptyPermissions(),allow=(scope,...acts)=>acts.forEach(action=>p[scope][action]=true);
 if(role==='company_admin'){for(const scope of scopes)for(const action of actions)p[scope][action]=true;p.companies.create=false;p.companies.delete=false;p.users.manage=true;p.backup.restore=true;p.records.delete=true;}
 if(role==='accountant'){for(const scope of ['dashboard','customers','suppliers','company_properties','invoices','purchases','payments','expenses','profit','reports','backup','partners','warranty_claims'])allow(scope,'view');for(const scope of ['payments','expenses','partners','company_properties'])allow(scope,'create','edit');allow('backup','create','export','restore');}
 if(role==='salesperson'){for(const scope of ['dashboard','customers','products','services','quotations','estimates','invoices'])allow(scope,'view','view_own');for(const scope of ['customers'])allow(scope,'create','edit');for(const scope of ['quotations','estimates','invoices'])allow(scope,'create','edit');}
 if(role==='storekeeper'){for(const scope of ['dashboard','products','company_properties','inventory','purchases','suppliers'])allow(scope,'view');allow('inventory','adjust');allow('purchases','create','edit');for(const action of ['create','edit'])allow('company_properties',action);}
 if(role==='manager'){for(const scope of scopes)for(const action of ['view','create','edit','adjust','export'])p[scope][action]=!['companies','users','records'].includes(scope);allow('users','view');allow('backup','view','export');}
 return p;
}
const access_control_scrypt=(value,salt)=>scryptSync(value,salt,64).toString('hex');
const safeName=value=>String(value||'Business').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^\.+|\.+$/g,'').slice(0,80)||'Business';
const validPassword=value=>typeof value==='string'&&value.length>=12&&value.length<=128;
const validUsername=value=>typeof value==='string'&&value.length>=3&&value.length<=120&&(/^[a-z0-9._-]{3,40}$/.test(value)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
const normalizeEmail=value=>String(value||'').trim().toLowerCase();
const validEmail=value=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
// The platform administrator has a separate, mandatory OTP sign-in path.
// Keep this identity server-side so ordinary company users never receive an
// administrator session merely by knowing the administrator credentials.
const ADMIN_ACCESS_USERNAME='dhameera';
const ADMIN_ACCESS_EMAIL='dhameera@hotmail.com';
const adminUsername=value=>{const name=String(value||'').trim().toLowerCase();return name===ADMIN_ACCESS_EMAIL?ADMIN_ACCESS_USERNAME:name};
const OTP_DIGITS=8;
const otpDigitsForPurpose=purpose=>purpose==='registration'?6:OTP_DIGITS;
const OTP_TTL_MS=5*60*1000;
const OTP_RESEND_COOLDOWN_MS=60*1000;
const OTP_MAX_ATTEMPTS=5;
const protectedAdmin=user=>!!user?.active&&String(user.username||'').toLowerCase()===ADMIN_ACCESS_USERNAME;
const normalizedBankDetails=value=>({bankName:String(value?.bankName??value?.bank_name??'').trim(),bankBranch:String(value?.bankBranch??value?.bank_branch??'').trim(),accountHolder:String(value?.accountHolder??value?.account_holder??'').trim(),bankAccountNumber:String(value?.bankAccountNumber??value?.bank_account_number??'').trim()});
const bankChangeSubject=(actor,companyId,value)=>'bank-change:'+actor.userId+':'+companyId+':'+createHash('sha256').update(JSON.stringify(normalizedBankDetails(value))).digest('hex');
const inertRecovery=()=>{const salt=crypto_randomBytes(16).toString('hex');return {salt,hash:access_control_scrypt(crypto_randomBytes(64).toString('hex'),salt)}};

class AccessControl {
 constructor({registryPath,dataRoot,onCompanyCreate=()=>{},onCompanyUpdate=()=>{},legacyProfile=null}){
  this.dataRoot=runtime_path.resolve(dataRoot);mkdirSync(this.dataRoot,{recursive:true});this.onCompanyCreate=onCompanyCreate;this.onCompanyUpdate=onCompanyUpdate;this.legacyProfile=legacyProfile;
  this.db=new DatabaseSync(registryPath);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
  this.db.exec(`CREATE TABLE IF NOT EXISTS companies(id TEXT PRIMARY KEY,name TEXT NOT NULL,profile_json TEXT NOT NULL,data_path TEXT NOT NULL,backup_dir TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,user_limit INTEGER NOT NULL DEFAULT 15,role_limits_json TEXT NOT NULL,modules_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,password_salt TEXT NOT NULL,password_hash TEXT NOT NULL,recovery_salt TEXT NOT NULL,recovery_hash TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,is_super INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',email_verified INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS memberships(company_id TEXT NOT NULL REFERENCES companies(id),user_id TEXT NOT NULL REFERENCES users(id),role TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,permissions_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(company_id,user_id));
  CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),active_company_id TEXT,expires_at TEXT NOT NULL,created_at TEXT NOT NULL,last_seen TEXT NOT NULL,user_agent TEXT NOT NULL DEFAULT '',ip_address TEXT NOT NULL DEFAULT '');
  CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,user_id TEXT,company_id TEXT,username TEXT NOT NULL,company_name TEXT NOT NULL,action TEXT NOT NULL,details TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);CREATE INDEX IF NOT EXISTS idx_audit_company_date ON audit(company_id,created_at);`);
  const userColumns=new Set(this.db.prepare('PRAGMA table_info(users)').all().map(column=>column.name));
  if(!userColumns.has('email'))this.db.exec("ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT ''");
  if(!userColumns.has('email_verified'))this.db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0');
  const sessionColumns=new Set(this.db.prepare('PRAGMA table_info(sessions)').all().map(column=>column.name));
  if(!sessionColumns.has('user_agent'))this.db.exec("ALTER TABLE sessions ADD COLUMN user_agent TEXT NOT NULL DEFAULT ''");
  if(!sessionColumns.has('ip_address'))this.db.exec("ALTER TABLE sessions ADD COLUMN ip_address TEXT NOT NULL DEFAULT ''");
  // Legacy global flags never prove that this session completed Admin Access.
  if(!sessionColumns.has('admin_verified_at'))this.db.exec("ALTER TABLE sessions ADD COLUMN admin_verified_at TEXT NOT NULL DEFAULT ''");
  this.sessionMetadata=true;
  this.db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_verified_email ON users(lower(email)) WHERE email<>'';
  CREATE TABLE IF NOT EXISTS auth_email_otps(subject TEXT NOT NULL,purpose TEXT NOT NULL,email TEXT NOT NULL,salt TEXT NOT NULL,code_hash TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,expires_at TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(subject,purpose));
  CREATE TABLE IF NOT EXISTS auth_email_verifications(token_hash TEXT PRIMARY KEY,subject TEXT NOT NULL,purpose TEXT NOT NULL,email TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_auth_email_otps_expiry ON auth_email_otps(expires_at);`);
  this.rate=new Map();this.failedLogins=new Map();
 }
 close(){this.db.close()}
 now(){return stamp()}
 scalar(sql,...args){return this.db.prepare(sql).get(...args)}
 all(sql,...args){return this.db.prepare(sql).all(...args)}
 run(sql,...args){return this.db.prepare(sql).run(...args)}
 txn(fn){this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r}catch(e){this.db.exec('ROLLBACK');throw e}}
 cookie(token){const crossSite=process.env.INVOICEY_HOSTED==='1',secure=crossSite&&process.env.INVOICEY_COOKIE_SECURE!=='0';return 'invoicey_session='+encodeURIComponent(token)+'; Path=/; HttpOnly; SameSite='+(secure?'None':'Lax')+(secure?'; Secure':'')+'; Max-Age=43200'}
 clearCookie(){const crossSite=process.env.INVOICEY_HOSTED==='1',secure=crossSite&&process.env.INVOICEY_COOKIE_SECURE!=='0';return 'invoicey_session=; Path=/; HttpOnly; SameSite='+(secure?'None':'Lax')+(secure?'; Secure':'')+'; Max-Age=0'}
 parseCookie(req){const value=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('invoicey_session='));if(!value)return '';try{return decodeURIComponent(value.slice(17))}catch{return ''}}
  allowedRate(req,key,max=8){const ip=String(req.socket?.remoteAddress||'local')+':'+key,now=Date.now(),entry=this.rate.get(ip)||{start:now,count:0};if(now-entry.start>900000){entry.start=now;entry.count=0}entry.count++;this.rate.set(ip,entry);return entry.count<=max}
  recordFailedLogin(req,username){const key=String(req.socket?.remoteAddress||'local')+':'+username,now=Date.now(),entry=this.failedLogins.get(key)||{start:now,count:0};if(now-entry.start>900000){entry.start=now;entry.count=0}entry.count++;this.failedLogins.set(key,entry);return entry.count}
  clearFailedLogin(req,username){this.failedLogins.delete(String(req.socket?.remoteAddress||'local')+':'+username)}
  emailOtpReady(){return globalThis.INVOICEY_EMAIL_READY===true&&typeof globalThis.INVOICEY_SEND_EMAIL==='function'}
  async sendEmailOtp(req,{subject,purpose,email}){
   if(!this.emailOtpReady())throw Object.assign(new Error('Email verification is not configured on this server yet.'),{status:503,publicMessage:'Email verification is not configured on this server yet.'});
   const existing=this.scalar('SELECT created_at FROM auth_email_otps WHERE subject=? AND purpose=?',subject,purpose),createdAt=existing?Date.parse(existing.created_at):0;
   if(createdAt&&Number.isFinite(createdAt)&&Date.now()-createdAt<OTP_RESEND_COOLDOWN_MS){const seconds=Math.max(1,Math.ceil((OTP_RESEND_COOLDOWN_MS-(Date.now()-createdAt))/1000));throw Object.assign(new Error(`Please wait ${seconds} seconds before requesting another code.`),{status:429})}
   if(!this.allowedRate(req,'email-otp:'+purpose+':'+subject,3))throw Object.assign(new Error('Too many code requests. Wait 15 minutes before trying again.'),{status:429});
   const digits=otpDigitsForPurpose(purpose),code=String(parseInt(crypto_randomBytes(4).toString('hex'),16)%(10**digits)).padStart(digits,'0'),salt=crypto_randomBytes(16).toString('hex'),at=this.now();
   this.run('DELETE FROM auth_email_otps WHERE expires_at<=?',at);
   this.run('INSERT INTO auth_email_otps(subject,purpose,email,salt,code_hash,attempts,expires_at,created_at) VALUES(?,?,?,?,?,0,?,?) ON CONFLICT(subject,purpose) DO UPDATE SET email=excluded.email,salt=excluded.salt,code_hash=excluded.code_hash,attempts=0,expires_at=excluded.expires_at,created_at=excluded.created_at',subject,purpose,email,salt,access_control_scrypt(code,salt),new Date(Date.now()+OTP_TTL_MS).toISOString(),at);
   try{await globalThis.INVOICEY_SEND_EMAIL({to:email,code,purpose})}catch(error){this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',subject,purpose);throw Object.assign(new Error('The email could not be sent. Check the server email settings and try again.'),{status:503,publicMessage:'The email could not be sent. Check the server email settings and try again.'})}
  }
  verifyEmailOtp(subject,purpose,email,code){
   const row=this.scalar('SELECT * FROM auth_email_otps WHERE subject=? AND purpose=? AND email=?',subject,purpose,email);
   if(!row||row.expires_at<this.now()||row.attempts>=OTP_MAX_ATTEMPTS){if(row)this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',subject,purpose);throw Object.assign(new Error('The verification code is invalid or expired. Request a new code.'),{status:400})}
   const digits=otpDigitsForPurpose(purpose);
   if(!new RegExp(`^\\d{${digits}}$`).test(String(code||''))){this.run('UPDATE auth_email_otps SET attempts=attempts+1 WHERE subject=? AND purpose=?',subject,purpose);throw Object.assign(new Error(`Enter the ${digits}-digit verification code from your email.`),{status:400})}
   this.run('UPDATE auth_email_otps SET attempts=attempts+1 WHERE subject=? AND purpose=?',subject,purpose);
   const expected=access_control_Buffer.from(row.code_hash,'hex'),actual=access_control_Buffer.from(access_control_scrypt(String(code||''),row.salt),'hex');
   if(!timingSafeEqual(expected,actual))throw Object.assign(new Error('The verification code is incorrect. Check it and try again.'),{status:400});
   return true;
  }
 auditRow(actor,companyId,action,details=''){
   const company=companyId?this.scalar('SELECT name FROM companies WHERE id=?',companyId):null;
   this.run('INSERT INTO audit(id,user_id,company_id,username,company_name,action,details,created_at) VALUES(?,?,?,?,?,?,?,?)',randomUUID(),actor?.userId||null,companyId||null,actor?.username||'System',company?.name||'',action,String(details||'').slice(0,1000),this.now());
 }
 status(actor=null){
  const n=this.scalar('SELECT count(*) n FROM users').n;
   if(!n){let legacyCompany=null;try{legacyCompany=typeof this.legacyProfile==='function'?this.legacyProfile():this.legacyProfile}catch{}return {setupRequired:true,authenticated:false,legacyCompany,emailOtpAvailable:this.emailOtpReady()};}
   if(!actor)return {setupRequired:false,authenticated:false,emailOtpAvailable:this.emailOtpReady()};
   if(actor.isSuper){const identity=this.scalar('SELECT email,email_verified FROM users WHERE id=?',actor.userId);return {setupRequired:false,authenticated:true,emailOtpAvailable:this.emailOtpReady(),managementOnly:true,canSwitchCompanies:false,user:{id:actor.userId,username:actor.username,displayName:actor.displayName,email:identity?.email||'',emailVerified:!!identity?.email_verified,isSuper:true,role:'super_admin'},company:null,companies:[],permissions:emptyPermissions()};}
   const companies=actor.isSuper?this.all('SELECT id,name,enabled,user_limit AS userLimit,modules_json FROM companies WHERE enabled=1 ORDER BY name').map(c=>({...c,modules:JSON.parse(c.modules_json),modules_json:undefined})):this.userCompanies(actor.userId),active=companies.find(c=>c.id===actor.activeCompanyId)||null;
   const visibleCompanies=actor.isSuper||this.canSwitchCompanies(actor)?companies:(active?[active]:[]);
  const membership=active?this.scalar('SELECT role,permissions_json FROM memberships WHERE company_id=? AND user_id=? AND active=1',active.id,actor.userId):null;
  let permissions=actor.isSuper?Object.fromEntries(scopes.map(scope=>[scope,Object.fromEntries(actions.map(a=>[a,true]))])):membership?JSON.parse(membership.permissions_json):emptyPermissions();
  if(membership&&!Object.prototype.hasOwnProperty.call(permissions,'company_properties')){permissions.company_properties=rolePermissions(membership.role).company_properties;this.run('UPDATE memberships SET permissions_json=?,updated_at=? WHERE company_id=? AND user_id=?',JSON.stringify(permissions),this.now(),active.id,actor.userId);}
  for(const scope of scopes)if(active?.modules?.[scope]===false)permissions[scope]=Object.fromEntries(actions.map(action=>[action,false]));
   const identity=this.scalar('SELECT email,email_verified FROM users WHERE id=?',actor.userId);
    return {setupRequired:false,authenticated:true,emailOtpAvailable:this.emailOtpReady(),user:{id:actor.userId,username:actor.username,displayName:actor.displayName,email:identity?.email||'',emailVerified:!!identity?.email_verified,isSuper:!!actor.isSuper,role:membership?.role|| (actor.isSuper?'super_admin':null)},company:active,companies:actor.isSuper?this.all('SELECT id,name,enabled,user_limit AS userLimit,modules_json FROM companies ORDER BY name').map(c=>({...c,modules:JSON.parse(c.modules_json),modules_json:undefined})):visibleCompanies,permissions};
 }
 primaryMembership(userId){return this.scalar('SELECT c.id,c.name,c.enabled,c.user_limit AS userLimit,c.modules_json,m.active FROM memberships m JOIN companies c ON c.id=m.company_id WHERE m.user_id=? ORDER BY m.created_at,m.rowid LIMIT 1',userId)}
 userCompanies(userId){const c=this.primaryMembership(userId);return c?.active&&c.enabled?[{id:c.id,name:c.name,enabled:c.enabled,userLimit:c.userLimit,modules:JSON.parse(c.modules_json)}]:[]}
 companyConfig(id){const row=this.scalar('SELECT * FROM companies WHERE id=? AND enabled=1',id);if(!row)return null;return {id:row.id,name:row.name,profile:JSON.parse(row.profile_json),dataPath:row.data_path,backupDir:row.backup_dir,userLimit:row.user_limit,roleLimits:JSON.parse(row.role_limits_json),modules:JSON.parse(row.modules_json),enabled:!!row.enabled}}
 updateProfile(actor,companyId,profile){this.requireCompanyAdmin(actor,companyId);const row=this.scalar('SELECT profile_json FROM companies WHERE id=?',companyId);if(!row)throw new Error('Company not found.');this.run('UPDATE companies SET name=?,profile_json=?,updated_at=? WHERE id=?',profile.name,JSON.stringify(profile),this.now(),companyId);return {success:true}}
 authenticate(req){
  const token=this.parseCookie(req);if(!token||token.length<32)return null;const hash=createHash('sha256').update(token).digest('hex');
  const session=this.scalar('SELECT s.*,u.username,u.display_name,u.active,u.is_super FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?',hash);
  if(!session||!session.active||session.expires_at<this.now()){if(session)this.run('DELETE FROM sessions WHERE token_hash=?',hash);return null}
  const isSuper=protectedAdmin(session)&&!!session.admin_verified_at;
  if(protectedAdmin(session)&&!isSuper){this.run('DELETE FROM sessions WHERE token_hash=?',hash);return null;}
  const assigned=this.primaryMembership(session.user_id);
  if(!isSuper&&(!assigned?.active||!assigned.enabled||assigned.id!==session.active_company_id)){this.run('DELETE FROM sessions WHERE token_hash=?',hash);return null;}
  if(isSuper&&session.active_company_id){this.run('UPDATE sessions SET active_company_id=NULL WHERE token_hash=?',hash);session.active_company_id=null;}
  this.run('UPDATE sessions SET expires_at=?,last_seen=? WHERE token_hash=?',new Date(Date.now()+12*3600000).toISOString(),this.now(),hash);
  const membership=session.active_company_id?this.scalar('SELECT active,role FROM memberships WHERE company_id=? AND user_id=?',session.active_company_id,session.user_id):null;
  if(session.active_company_id&&!session.is_super&&(!membership?.active||!this.scalar('SELECT enabled FROM companies WHERE id=?',session.active_company_id)?.enabled))return null;
  return {userId:session.user_id,username:session.username,displayName:session.display_name,isSuper,role:isSuper?'super_admin':membership?.role,activeCompanyId:session.active_company_id,sessionHash:hash};
 }
 createSession(userId,companyId,req=null,platformVerified=false){const token=crypto_randomBytes(32).toString('base64url'),hash=createHash('sha256').update(token).digest('hex'),at=this.now(),agent=String(req?.headers?.['user-agent']||'').slice(0,300),ip=String(req?.socket?.remoteAddress||'').slice(0,120);this.run('INSERT INTO sessions(token_hash,user_id,active_company_id,expires_at,created_at,last_seen,user_agent,ip_address,admin_verified_at) VALUES(?,?,?,?,?,?,?,?,?)',hash,userId,companyId,new Date(Date.now()+12*3600000).toISOString(),at,at,agent,ip,platformVerified?at:'');return {token,hash}}
 actorUser(id){return this.scalar('SELECT id AS userId,username,display_name AS displayName,is_super AS isSuper FROM users WHERE id=?',id)}
 isPlatformUser(user){return String(user?.username||'').toLowerCase()===ADMIN_ACCESS_USERNAME}
 async handleApi(req,url,body){
  const p=url.pathname,m=req.method;
  if(m==='POST'&&['/api/auth/setup','/api/auth/signup'].includes(p)&&String(body.password||'')!==String((p==='/api/auth/setup'?body.passwordConfirm:body.confirmPassword)||''))throw new Error('The password confirmations do not match.');
  if(m==='POST'&&p==='/api/auth/recover'&&String(body.newPassword||'')!==String(body.newPasswordConfirm||''))throw Object.assign(new Error('The password confirmations do not match.'),{status:400});
  if(m==='POST'&&p==='/api/auth/change-password'&&String(body.newPassword||'')!==String(body.newPasswordConfirm||''))throw new Error('The password confirmations do not match.');
  if(m==='POST'&&p==='/api/admin/users'&&body.password&&String(body.password)!==String(body.passwordConfirm||''))throw new Error('The password confirmations do not match.');
  if(m==='PUT'&&/^\/api\/admin\/users\/[^/]+$/.test(p)&&body.resetPassword&&String(body.newPassword||'')!==String(body.newPasswordConfirm||''))throw new Error('The password confirmations do not match.');
  if(m==='POST'&&p==='/api/admin/companies'&&body.admin?.password&&String(body.admin.password)!==String(body.admin.passwordConfirm||''))throw new Error('The password confirmations do not match.');
  if(process.env.INVOICEY_HOSTED==='1'&&m==='POST'&&['/api/auth/setup','/api/auth/signup','/api/admin/companies'].includes(p)&&body.backupDir)throw Object.assign(new Error('Hosted company storage is assigned by the server.'),{status:400});
  if(m==='GET'&&p==='/api/auth/status')return {body:{...this.status(this.authenticate(req)),securityVersion:'20261022-private-accounts-1'}};
   if(m==='POST'&&p==='/api/auth/email-otp/request'){
    if(!this.emailOtpReady())throw Object.assign(new Error('Email verification is not configured on this server yet.'),{status:503,publicMessage:'Email verification is not configured on this server yet.'});
    const purpose=String(body.purpose||'');
    if(purpose==='registration'){
     const email=normalizeEmail(body.email);if(!validEmail(email))throw new Error('Enter a valid email address.');
     if(this.scalar('SELECT id FROM users WHERE lower(email)=?',email))throw Object.assign(new Error('This email address is already connected to an account.'),{status:409});
     await this.sendEmailOtp(req,{subject:email,purpose,email});return {body:{success:true,message:'A verification code was sent to your email address.'}};
    }
    if(purpose==='password-reset'){
     const email=normalizeEmail(body.email);if(!validEmail(email))throw new Error('Enter a valid email address.');if(!this.allowedRate(req,'password-reset:'+email,5))throw Object.assign(new Error('Too many code requests. Wait 15 minutes before trying again.'),{status:429});
     const user=this.scalar('SELECT id,username,email,email_verified,active,is_super FROM users WHERE lower(email)=?',email)
      || (email===ADMIN_ACCESS_EMAIL?this.scalar('SELECT id,username,email,email_verified,active,is_super FROM users WHERE lower(username)=?',ADMIN_ACCESS_USERNAME):null);
     if(email===ADMIN_ACCESS_EMAIL&&!user){await this.sendEmailOtp(req,{subject:'platform-admin-bootstrap',purpose:'admin-setup',email:ADMIN_ACCESS_EMAIL});return {body:{success:true,message:'If the account has a verified email, a code has been sent.'}};}
     const targetEmail=protectedAdmin(user)?ADMIN_ACCESS_EMAIL:user?.email;
     if(user?.active&&validEmail(targetEmail)&&(protectedAdmin(user)||user.email_verified))await this.sendEmailOtp(req,{subject:user.id,purpose,email:targetEmail});
     return {body:{success:true,message:'If the account has a verified email, a code has been sent.'}};
    }
    if(purpose==='admin-login'){
     const username=adminUsername(body.username),password=String(body.password||''),user=this.scalar('SELECT * FROM users WHERE username=?',username),dummySalt='0123456789abcdef0123456789abcdef';
     if(!this.allowedRate(req,'admin-login-request:'+username,3))throw Object.assign(new Error('Too many code requests. Wait 15 minutes before trying again.'),{status:429});
     const hash=access_control_scrypt(password,user?.password_salt||dummySalt),expected=user?.password_hash||access_control_scrypt('__invalid-admin-password__',dummySalt),matches=timingSafeEqual(access_control_Buffer.from(hash,'hex'),access_control_Buffer.from(expected,'hex'));
     if(matches&&user?.active&&protectedAdmin(user))await this.sendEmailOtp(req,{subject:user.id,purpose,email:ADMIN_ACCESS_EMAIL});
     return {body:{success:true,message:'If the administrator details are valid, a one-time code was sent to the administrator email.'}};
    }
    if(purpose==='admin-user'||purpose==='company-admin'){
     const actor=this.authenticate(req);if(!actor)throw Object.assign(new Error('Sign in again before verifying an account email.'),{status:401});
     const email=normalizeEmail(body.email);if(!validEmail(email))throw new Error('Enter a valid email address.');
     let subject;
     if(purpose==='admin-user'){const companyId=String(body.companyId||actor.activeCompanyId||'');this.requireCompanyAdmin(actor,companyId);subject=`admin-user:${actor.userId}:${companyId}:${email}`}
     else{this.requireSuper(actor);subject=`${actor.userId}:company-admin:${email}`}
     if(email===ADMIN_ACCESS_EMAIL)throw Object.assign(new Error('The platform administrator email is reserved. Use a separate email for this company account.'),{status:403});
     if(this.scalar('SELECT id FROM users WHERE lower(email)=?',email))throw Object.assign(new Error('This email address is already connected to an account.'),{status:409});
     if(!this.allowedRate(req,'new-account-email:'+actor.userId,5))throw Object.assign(new Error('Too many code requests. Wait 15 minutes before trying again.'),{status:429});
     await this.sendEmailOtp(req,{subject,purpose,email});return {body:{success:true,message:'A verification code was sent to that email address.'}};
    }
    if(purpose==='email-change'){
     const actor=this.authenticate(req);if(!actor)throw Object.assign(new Error('Sign in again to update your recovery email.'),{status:401});
     if(!this.allowedRate(req,'email-change:'+actor.userId,5))throw Object.assign(new Error('Too many code requests. Wait 15 minutes before trying again.'),{status:429});
     const email=normalizeEmail(body.email),user=this.scalar('SELECT * FROM users WHERE id=?',actor.userId);
     if(!validEmail(email))throw new Error('Enter a valid email address.');
     const passwordMatches=timingSafeEqual(access_control_Buffer.from(access_control_scrypt(String(body.currentPassword||''),user.password_salt),'hex'),access_control_Buffer.from(user.password_hash,'hex'));
     if(!passwordMatches)throw Object.assign(new Error('Current password is incorrect.'),{status:400});
     if(this.scalar('SELECT id FROM users WHERE lower(email)=? AND id<>?',email,actor.userId))throw Object.assign(new Error('That email address is already connected to another account.'),{status:409});
     await this.sendEmailOtp(req,{subject:actor.userId,purpose,email});return {body:{success:true,message:'A verification code was sent to the new email address.'}};
    }
    if(purpose==='bank-change'){
     const actor=this.authenticate(req);if(!actor||!actor.activeCompanyId)throw Object.assign(new Error('Sign in again before changing bank details.'),{status:401});
     this.requireCompanyAdmin(actor,actor.activeCompanyId);if(!this.allowedRate(req,'bank-change:'+actor.userId+':'+actor.activeCompanyId,5))throw Object.assign(new Error('Too many code requests. Wait 15 minutes before trying again.'),{status:429});
     const user=this.scalar('SELECT * FROM users WHERE id=?',actor.userId);if(!user?.email_verified||!validEmail(user.email))throw Object.assign(new Error('Verify your account recovery email before changing bank details.'),{status:400});
     const passwordMatches=timingSafeEqual(access_control_Buffer.from(access_control_scrypt(String(body.currentPassword||''),user.password_salt),'hex'),access_control_Buffer.from(user.password_hash,'hex'));
     if(!passwordMatches)throw Object.assign(new Error('Current password is incorrect.'),{status:400});
     const subject=bankChangeSubject(actor,actor.activeCompanyId,body.bankDetails||{});await this.sendEmailOtp(req,{subject,purpose,email:user.email});return {body:{success:true,message:'A verification code was sent to your verified account email.'}};
    }
    throw new Error('Choose a supported email verification action.');
   }
  if(m==='POST'&&p==='/api/auth/email-otp/verify'){
   const purpose=String(body.purpose||''),email=normalizeEmail(body.email),code=String(body.otp||body.code||'');
   if(purpose!=='registration')throw Object.assign(new Error('This verification flow is not available.'),{status:400});
   if(!validEmail(email))throw new Error('Enter a valid email address.');
   this.verifyEmailOtp(email,purpose,email,code);
   const token=crypto_randomBytes(32).toString('base64url'),at=this.now(),expiresAt=new Date(Date.now()+OTP_TTL_MS).toISOString();
   this.run('DELETE FROM auth_email_verifications WHERE expires_at<=?',at);
   this.run('INSERT INTO auth_email_verifications(token_hash,subject,purpose,email,expires_at,created_at) VALUES(?,?,?,?,?,?)',createHash('sha256').update(token).digest('hex'),email,purpose,email,expiresAt,at);
   return {body:{success:true,verificationToken:token,expiresAt,message:'Email verified. Continue to create your password.'}};
  }
  if(m==='POST'&&p==='/api/auth/admin-otp/verify'){
   const username=adminUsername(body.username),password=String(body.password||''),user=this.scalar('SELECT * FROM users WHERE username=?',username),dummySalt='0123456789abcdef0123456789abcdef';
   if(!this.allowedRate(req,'admin-login-verify:'+username,8))throw Object.assign(new Error('Too many verification attempts. Wait 15 minutes before trying again.'),{status:429});
   const hash=access_control_scrypt(password,user?.password_salt||dummySalt),expected=user?.password_hash||access_control_scrypt('__invalid-admin-password__',dummySalt),matches=timingSafeEqual(access_control_Buffer.from(hash,'hex'),access_control_Buffer.from(expected,'hex'));
   if(!matches||!user?.active||!protectedAdmin(user))throw Object.assign(new Error('Administrator username or password is incorrect.'),{status:401});
   this.verifyEmailOtp(user.id,'admin-login',ADMIN_ACCESS_EMAIL,String(body.otp||''));this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',user.id,'admin-login');this.clearFailedLogin(req,username);
   const actor={userId:user.id,username:user.username,displayName:user.display_name,isSuper:true},ses=this.createSession(user.id,null,req,true);this.auditRow(actor,null,'auth.admin_login_otp');return {body:{...this.status({...actor,activeCompanyId:null}),success:true},cookie:this.cookie(ses.token)};
  }
  if(m==='POST'&&p==='/api/auth/setup'){
   if(this.scalar('SELECT id FROM users LIMIT 1'))throw Object.assign(new Error('Initial setup is already complete.'),{status:409});
   if(!this.allowedRate(req,'setup'))throw Object.assign(new Error('Too many setup attempts. Try again shortly.'),{status:429});
    const profile=body.company||{},name=String(profile.name||'').trim(),username=String(body.username||'').trim().toLowerCase(),displayName=String(body.displayName||'').trim(),password=body.password,accountEmail=normalizeEmail(body.accountEmail),emailOtp=String(body.emailOtp||''),superUsername=String(body.superUsername||'').trim().toLowerCase(),superPassword=body.superPassword,superDisplayName=String(body.superDisplayName||'Super Administrator').trim(),hasSeparateSuper=!!(superUsername||superPassword||body.superDisplayName);
    if(String(password||'')!==String(body.passwordConfirm||''))throw new Error('The password confirmations do not match.');
    if(!name||!username||!displayName||!validPassword(password)||!validUsername(username))throw new Error('Enter a company name, administrator name, valid username or email, and a password of at least 12 characters.');
    if(!validEmail(accountEmail))throw new Error('Enter a valid administrator email address.');this.verifyEmailOtp(accountEmail,'registration',accountEmail,emailOtp);
   if(username===ADMIN_ACCESS_USERNAME||accountEmail===ADMIN_ACCESS_EMAIL||hasSeparateSuper)throw Object.assign(new Error('Create a company account here. Platform administrator setup requires verification through Admin Access password recovery.'),{status:403});
   if(hasSeparateSuper){
    if(username===superUsername||!validUsername(superUsername)||!validPassword(superPassword))throw new Error('The optional software administrator details require a different valid username and a password of at least 12 characters.');
   }
   const companyId=randomUUID(),userId=randomUUID(),superUserId=hasSeparateSuper?randomUUID():userId,at=this.now(),passwordSalt=crypto_randomBytes(16).toString('hex'),superSalt=hasSeparateSuper?crypto_randomBytes(16).toString('hex'):passwordSalt,recovery=inertRecovery(),superRecovery=hasSeparateSuper?inertRecovery():recovery;
   const backupDir=runtime_path.join(this.dataRoot,companyId,'backups');this.validatePath(backupDir);
   const company={id:companyId,name,enabled:1,user_limit:15,role_limits:{company_admin:2,accountant:3,salesperson:10,storekeeper:10,manager:10,custom:10},modules:Object.fromEntries(scopes.map(s=>[s,true])),profile:{...profile,name},dataPath:runtime_path.join(this.dataRoot,companyId,'business.sqlite'),backupDir};
   mkdirSync(runtime_path.dirname(company.dataPath),{recursive:true});mkdirSync(backupDir,{recursive:true});
   try{this.onCompanyCreate(company,{isInitial:true});this.txn(()=>{
    this.run('INSERT INTO companies VALUES(?,?,?,?,?,?,?,?,?,?,?)',company.id,company.name,JSON.stringify(company.profile),company.dataPath,company.backupDir,1,15,JSON.stringify(company.role_limits),JSON.stringify(company.modules),at,at);
     this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',accountEmail,'registration');
     this.run('INSERT INTO users(id,username,display_name,password_salt,password_hash,recovery_salt,recovery_hash,active,is_super,created_at,updated_at,email,email_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',userId,username,displayName,passwordSalt,access_control_scrypt(password,passwordSalt),recovery.salt,recovery.hash,1,0,at,at,accountEmail,1);
    this.run('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)',companyId,userId,'company_admin',1,JSON.stringify(rolePermissions('company_admin')),at,at);
     if(hasSeparateSuper){this.run('INSERT INTO users(id,username,display_name,password_salt,password_hash,recovery_salt,recovery_hash,active,is_super,created_at,updated_at,email,email_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',superUserId,superUsername,superDisplayName,superSalt,access_control_scrypt(superPassword,superSalt),superRecovery.salt,superRecovery.hash,1,1,at,at,'',0);}
    const actor={userId,username,displayName,isSuper:false};this.auditRow(actor,companyId,'setup.completed');if(hasSeparateSuper)this.auditRow({userId:superUserId,username:superUsername,displayName:superDisplayName,isSuper:true},companyId,'super_admin.created');
   })}catch(error){throw error}
   const session=this.createSession(userId,companyId);return {body:{success:true,setupRequired:false,authenticated:true,user:{id:userId,username,displayName,isSuper:false,role:'company_admin'},company:{id:companyId,name},companies:[{id:companyId,name}],permissions:rolePermissions('company_admin'),superUsername:hasSeparateSuper?superUsername:''},cookie:this.cookie(session.token)};
  }
  if(m==='POST'&&p==='/api/auth/signup'){
   if(!this.scalar('SELECT id FROM users LIMIT 1'))throw Object.assign(new Error('Complete first-time setup before creating another account.'),{status:409});
   if(!this.allowedRate(req,'signup'))throw Object.assign(new Error('Too many account creation attempts. Try again shortly.'),{status:429});
    const profile=body.company||{},name=String(profile.name||'').trim(),username=String(body.username||'').trim().toLowerCase(),displayName=String(body.displayName||'').trim(),password=body.password,accountEmail=normalizeEmail(body.accountEmail),emailOtp=String(body.emailOtp||'');
    if(String(password||'')!==String(body.confirmPassword||''))throw new Error('The password confirmations do not match.');
    if(!name||name.length>160||!displayName||displayName.length>120||!/^[a-z0-9._-]{3,40}$/.test(username)||!validPassword(password))throw new Error('Enter a company name, your full name, a valid username, and a password of at least 12 characters.');
    if(!validEmail(accountEmail))throw new Error('Enter a valid account email address.');
    if(this.scalar('SELECT id FROM users WHERE username=?',username))throw Object.assign(new Error('That username is already in use. Choose another username.'),{status:409});if(this.scalar('SELECT id FROM users WHERE lower(email)=?',accountEmail))throw Object.assign(new Error('This email address is already connected to an account.'),{status:409});
   if(this.scalar('SELECT id FROM companies WHERE lower(name)=lower(?)',name))throw Object.assign(new Error('A business with that name already exists. Choose another name.'),{status:409});
   if(username===ADMIN_ACCESS_USERNAME||accountEmail===ADMIN_ACCESS_EMAIL)throw Object.assign(new Error('This identity is reserved for separate platform administration.'),{status:403});
   const verificationToken=String(body.verificationToken||''),verificationHash=verificationToken?createHash('sha256').update(verificationToken).digest('hex'):'';
   if(verificationToken){
    const verification=this.scalar('SELECT * FROM auth_email_verifications WHERE token_hash=? AND subject=? AND purpose=? AND email=?',verificationHash,accountEmail,'registration',accountEmail);
    if(!verification||verification.expires_at<this.now())throw Object.assign(new Error('Email verification expired. Request a new code.'),{status:400});
    this.run('DELETE FROM auth_email_verifications WHERE token_hash=?',verificationHash);
    this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',accountEmail,'registration');
   }else this.verifyEmailOtp(accountEmail,'registration',accountEmail,emailOtp);
   const companyId=randomUUID(),userId=randomUUID(),at=this.now(),passwordSalt=crypto_randomBytes(16).toString('hex'),recovery=inertRecovery(),backupDir=runtime_path.join(this.dataRoot,companyId,'backups'),dataPath=runtime_path.join(this.dataRoot,companyId,'business.sqlite'),roleLimits={company_admin:2,accountant:3,salesperson:10,storekeeper:10,manager:10,custom:10},modules=Object.fromEntries(scopes.map(s=>[s,true])),company={id:companyId,name,profile:{...profile,name},dataPath,backupDir,user_limit:15,role_limits:roleLimits,modules,enabled:1};
   mkdirSync(runtime_path.dirname(dataPath),{recursive:true});mkdirSync(backupDir,{recursive:true});this.onCompanyCreate(company,{isInitial:false});
    this.txn(()=>{this.run('INSERT INTO companies VALUES(?,?,?,?,?,?,?,?,?,?,?)',companyId,name,JSON.stringify(company.profile),dataPath,backupDir,1,15,JSON.stringify(roleLimits),JSON.stringify(modules),at,at);this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',accountEmail,'registration');this.run('INSERT INTO users(id,username,display_name,password_salt,password_hash,recovery_salt,recovery_hash,active,is_super,created_at,updated_at,email,email_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',userId,username,displayName,passwordSalt,access_control_scrypt(password,passwordSalt),recovery.salt,recovery.hash,1,0,at,at,accountEmail,1);this.run('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)',companyId,userId,'company_admin',1,JSON.stringify(rolePermissions('company_admin')),at,at);const actor={userId,username,displayName,isSuper:false};this.auditRow(actor,companyId,'auth.signup');this.auditRow(actor,companyId,'company.created',name)});
   const session=this.createSession(userId,companyId);return {body:{success:true,setupRequired:false,authenticated:true,user:{id:userId,username,displayName,isSuper:false,role:'company_admin'},company:{id:companyId,name},companies:[{id:companyId,name}],permissions:rolePermissions('company_admin')},cookie:this.cookie(session.token)};
  }
  if(m==='POST'&&p==='/api/auth/login'){
   if(!this.allowedRate(req,'login:'+String(body.username||'').toLowerCase()))throw Object.assign(new Error('Too many login attempts. Wait 15 minutes before trying again.'),{status:429});
   const username=String(body.username||'').trim().toLowerCase(),user=this.scalar('SELECT * FROM users WHERE username=?',username);
   const dummySalt='0123456789abcdef0123456789abcdef';const matches=user&&user.active&&timingSafeEqual(access_control_Buffer.from(access_control_scrypt(String(body.password||''),user.password_salt),'hex'),access_control_Buffer.from(user.password_hash,'hex'));
   if(!matches){access_control_scrypt(String(body.password||''),dummySalt);const failures=this.recordFailedLogin(req,username);if(failures===4&&user?.active&&user.email_verified&&validEmail(user.email)&&this.emailOtpReady()){try{await this.sendEmailOtp(req,{subject:user.id,purpose:'password-reset',email:user.email});}catch{}}const message=failures>=4?'Four failed sign-in attempts reached. Use “Forgot password?” to reset securely with the one-time code sent to your verified email.':'Username or password is incorrect.';throw Object.assign(new Error(message),{status:401})}
   this.clearFailedLogin(req,username);
   if(protectedAdmin(user))throw Object.assign(new Error('Administrator sign-in requires Admin Access and the one-time code sent to the administrator email.'),{status:403});
   const companies=this.userCompanies(user.id),company=companies[0]||null;
   if(!company)throw Object.assign(new Error('Your company account is inactive. Contact your company administrator.'),{status:403});
   if(body.companyId&&body.companyId!==company.id)throw Object.assign(new Error('This account belongs to a different company. Sign in with that company’s own account.'),{status:403});
   const actor={userId:user.id,username:user.username,displayName:user.display_name,isSuper:false};
   const ses=this.createSession(user.id,company?.id||null);this.auditRow(actor,company?.id,'auth.login');return {body:{...this.status({...actor,activeCompanyId:company?.id||null}),success:true},cookie:this.cookie(ses.token)};
  }
  const actor=this.authenticate(req);
   if(m==='POST'&&p==='/api/auth/email/confirm'){
    if(!actor)throw Object.assign(new Error('Sign in again to update your recovery email.'),{status:401});
    const email=normalizeEmail(body.email),code=String(body.emailOtp||'');if(!validEmail(email))throw new Error('Enter a valid email address.');
    if(this.scalar('SELECT id FROM users WHERE lower(email)=? AND id<>?',email,actor.userId))throw Object.assign(new Error('That email address is already connected to another account.'),{status:409});
    this.verifyEmailOtp(actor.userId,'email-change',email,code);
    this.txn(()=>{this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',actor.userId,'email-change');this.run('UPDATE users SET email=?,email_verified=1,updated_at=? WHERE id=?',email,this.now(),actor.userId);this.auditRow(actor,actor.activeCompanyId,'auth.email_verified',email)});
    return {body:{success:true,message:'Recovery email verified and saved.'}};
   }
  if(m==='POST'&&p==='/api/auth/recover-code')throw Object.assign(new Error('Recovery-code password reset is no longer supported. Use your verified account email.'),{status:410});
  if(m==='POST'&&p==='/api/auth/recover'){
   const email=normalizeEmail(body.email);if(!this.allowedRate(req,'recover:'+email,5))throw Object.assign(new Error('Too many recovery attempts. Wait 15 minutes before trying again.'),{status:429});
   const password=body.newPassword,user=validEmail(email)?(this.scalar('SELECT * FROM users WHERE lower(email)=?',email)||
    (email===ADMIN_ACCESS_EMAIL?this.scalar('SELECT * FROM users WHERE lower(username)=?',ADMIN_ACCESS_USERNAME):null)):null,targetEmail=protectedAdmin(user)?ADMIN_ACCESS_EMAIL:user?.email;
   if(String(password||'')!==String(body.newPasswordConfirm||''))throw Object.assign(new Error('The password confirmations do not match.'),{status:400});
   if(!user&&email===ADMIN_ACCESS_EMAIL){
    if(!validPassword(password))throw Object.assign(new Error('New password must contain at least 12 characters.'),{status:400});
    this.verifyEmailOtp('platform-admin-bootstrap','admin-setup',ADMIN_ACCESS_EMAIL,String(body.emailOtp||''));
    const id=randomUUID(),salt=crypto_randomBytes(16).toString('hex'),recovery=inertRecovery(),at=this.now();
    this.txn(()=>{this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?','platform-admin-bootstrap','admin-setup');this.run('INSERT INTO users(id,username,display_name,password_salt,password_hash,recovery_salt,recovery_hash,active,is_super,created_at,updated_at,email,email_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',id,ADMIN_ACCESS_USERNAME,'Platform administrator',salt,access_control_scrypt(password,salt),recovery.salt,recovery.hash,1,1,at,at,ADMIN_ACCESS_EMAIL,1);this.auditRow({userId:id,username:ADMIN_ACCESS_USERNAME},null,'auth.admin_provisioned');});
    return {body:{success:true,adminLoginRequired:true,message:'Administrator account secured. Continue through Admin Access with a new sign-in code.'},cookie:this.clearCookie()};
   }
   if(!user||!user.active||!validEmail(targetEmail)||(!protectedAdmin(user)&&!user.email_verified)||!validPassword(password))throw Object.assign(new Error('The account, email code or new password could not be verified.'),{status:400});
   this.verifyEmailOtp(user.id,'password-reset',targetEmail,String(body.emailOtp||''));
   const salt=crypto_randomBytes(16).toString('hex');this.txn(()=>{this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',user.id,'password-reset');this.run('UPDATE users SET password_salt=?,password_hash=?,updated_at=? WHERE id=?',salt,access_control_scrypt(password,salt),this.now(),user.id);if(protectedAdmin(user))this.run('UPDATE users SET email=?,email_verified=1,updated_at=? WHERE id=?',ADMIN_ACCESS_EMAIL,this.now(),user.id);this.run('DELETE FROM sessions WHERE user_id=?',user.id);this.auditRow({userId:user.id,username:user.username},null,'auth.password_recovered')});return {body:{success:true,adminLoginRequired:protectedAdmin(user),message:'Password reset. Sign in with the new password.'},cookie:this.clearCookie()};
  }
  if(m==='POST'&&p==='/api/auth/logout'){
   if(actor){this.auditRow(actor,actor.activeCompanyId,'auth.logout');this.run('DELETE FROM sessions WHERE token_hash=?',actor.sessionHash)}return {body:{success:true},cookie:this.clearCookie()};
  }
  if(!actor)throw Object.assign(new Error('Sign in to continue.'),{status:401});
  const platformResult=platformAdmin?.handle(req,url,body,actor);if(platformResult)return platformResult;
  if(m==='POST'&&p==='/api/auth/change-password'){
   const user=this.scalar('SELECT * FROM users WHERE id=?',actor.userId);if(!timingSafeEqual(access_control_Buffer.from(access_control_scrypt(String(body.currentPassword||''),user.password_salt),'hex'),access_control_Buffer.from(user.password_hash,'hex')))throw Object.assign(new Error('Current password is incorrect.'),{status:400});if(String(body.newPassword||'')!==String(body.newPasswordConfirm||''))throw new Error('The password confirmations do not match.');if(!validPassword(body.newPassword))throw new Error('New password must contain at least 12 characters.');
   const salt=crypto_randomBytes(16).toString('hex');this.txn(()=>{this.run('UPDATE users SET password_salt=?,password_hash=?,updated_at=? WHERE id=?',salt,access_control_scrypt(body.newPassword,salt),this.now(),actor.userId);this.run('DELETE FROM sessions WHERE user_id=? AND token_hash<>?',actor.userId,actor.sessionHash);this.auditRow(actor,actor.activeCompanyId,'auth.password_changed')});return {body:{success:true}};
  }
  if(m==='POST'&&p==='/api/auth/select-company'){
   throw Object.assign(new Error('Company switching is disabled. Platform administrators manage account access without opening private company records.'),{status:403});
  }
  if(m==='GET'&&p==='/api/admin/companies'){
   this.requireSuper(actor);return {body:this.all('SELECT c.id,c.name,c.enabled,c.user_limit AS userLimit,(SELECT count(*) FROM memberships m WHERE m.company_id=c.id AND m.active=1) AS userCount,c.role_limits_json,c.modules_json,c.created_at,c.updated_at FROM companies c ORDER BY c.created_at').map(c=>({...c,roleLimits:JSON.parse(c.role_limits_json),modules:JSON.parse(c.modules_json),role_limits_json:undefined,modules_json:undefined}))};
  }
  if(m==='POST'&&p==='/api/admin/companies'){
   this.requireSuper(actor);
   if(adminUsername(body.admin?.username)===ADMIN_ACCESS_USERNAME||normalizeEmail(body.admin?.email)===ADMIN_ACCESS_EMAIL)throw Object.assign(new Error('Platform administrators cannot belong to company workspaces.'),{status:403});
   if(this.scalar('SELECT id FROM users WHERE lower(username)=?',String(body.admin?.username||'').trim().toLowerCase()))throw Object.assign(new Error('Each company requires a separate user account. This username is already registered.'),{status:409});
   this.requireSuper(actor);const profile=body.company||{},name=String(profile.name||'').trim(),admin=body.admin||{};if(!name)throw new Error('Company name is required.');if(this.scalar('SELECT id FROM companies WHERE lower(name)=lower(?)',name))throw Object.assign(new Error('A business with that name already exists.'),{status:409});const adminUsername=String(admin.username||'').trim().toLowerCase(),adminPassword=String(admin.password||''),adminEmail=normalizeEmail(admin.email),adminEmailOtp=String(admin.emailOtp||''),user=this.scalar('SELECT * FROM users WHERE username=?',adminUsername),userId=user?.id||randomUUID();if(!/^[a-z0-9._-]{3,40}$/.test(adminUsername)||(!user&&!validPassword(adminPassword)))throw new Error('Add a company administrator with a valid username and a password of at least 12 characters.');if(user?.is_super)throw new Error('A super administrator account cannot also be a company administrator.');if(user&&(!user.email_verified||!validEmail(user.email)))throw new Error('This existing account needs a verified email before it can be added to a company.');if(!user){if(!validEmail(adminEmail))throw new Error('Enter the new company administrator’s email address.');if(this.scalar('SELECT id FROM users WHERE lower(email)=?',adminEmail))throw Object.assign(new Error('This email address is already connected to an account.'),{status:409});this.verifyEmailOtp(`${actor.userId}:company-admin:${adminEmail}`,'company-admin',adminEmail,adminEmailOtp)}const companyId=randomUUID(),at=this.now(),backupDir=runtime_path.join(this.dataRoot,companyId,'backups');this.validatePath(backupDir);const dataPath=runtime_path.join(this.dataRoot,companyId,'business.sqlite'),limits=body.roleLimits||{company_admin:2,accountant:3,salesperson:10,storekeeper:10,manager:10,custom:10},modules=body.modules||Object.fromEntries(scopes.map(s=>[s,true])),userLimit=Math.min(500,Math.max(1,Math.floor(Number(body.userLimit||15))));if(Number(body.userLimit||15)>500||Number(body.userLimit||15)<1)throw new Error('Maximum users must be between 1 and 500.');if(Number(limits.company_admin??2)<1)throw new Error('Allow at least one company administrator.');
   mkdirSync(runtime_path.dirname(dataPath),{recursive:true});mkdirSync(backupDir,{recursive:true});const company={id:companyId,name,profile:{...profile,name},dataPath,backupDir,role_limits:limits,modules,enabled:1,user_limit:userLimit};this.onCompanyCreate(company,{isInitial:false});
     this.txn(()=>{this.run('INSERT INTO companies VALUES(?,?,?,?,?,?,?,?,?,?,?)',companyId,name,JSON.stringify(company.profile),dataPath,backupDir,1,userLimit,JSON.stringify(limits),JSON.stringify(modules),at,at);if(!user){const salt=crypto_randomBytes(16).toString('hex'),recovery=inertRecovery();this.run('INSERT INTO users(id,username,display_name,password_salt,password_hash,recovery_salt,recovery_hash,active,is_super,created_at,updated_at,email,email_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',userId,adminUsername,String(admin.displayName||adminUsername),salt,access_control_scrypt(adminPassword,salt),recovery.salt,recovery.hash,1,0,at,at,adminEmail,1);this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',`${actor.userId}:company-admin:${adminEmail}`,'company-admin')}this.run('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)',companyId,userId,'company_admin',1,JSON.stringify(rolePermissions('company_admin')),at,at);this.auditRow(actor,companyId,'company.created',name);this.auditRow(actor,companyId,'company.admin_created',adminUsername)});return {body:{id:companyId,name,enabled:1,userLimit,roleLimits:limits,modules,administrator:{username:adminUsername,existingUser:!!user}}};
  }
  if(m==='PUT'&&p.startsWith('/api/admin/companies/')){
   this.requireSuper(actor);
   if(Object.keys(body).some(key=>!['enabled','userLimit','roleLimits','modules'].includes(key)))throw Object.assign(new Error('Platform controls manage access, allowances and features. Private company profiles must be edited by the company’s own administrator.'),{status:403});
   platformAdmin?.guardCompanyEdit(p.split('/').pop());
   this.requireSuper(actor);const companyId=p.split('/').pop(),existing=this.scalar('SELECT * FROM companies WHERE id=?',companyId);if(!existing)throw new Error('Company not found.');const name=String(body.name||existing.name).trim(),profile=body.profile||JSON.parse(existing.profile_json),userLimit=body.userLimit===undefined?existing.user_limit:Math.floor(Number(body.userLimit)),roleLimits=body.roleLimits||JSON.parse(existing.role_limits_json),modules=body.modules||JSON.parse(existing.modules_json),enabled=body.enabled===undefined?existing.enabled:(body.enabled?1:0);
   if(!name)throw new Error('Company name is required.');if(userLimit<1||userLimit>500||!Number.isFinite(userLimit))throw new Error('Maximum users must be between 1 and 500.');if(this.scalar('SELECT id FROM companies WHERE lower(name)=lower(?) AND id<>?',name,companyId))throw Object.assign(new Error('A business with that name already exists.'),{status:409});if(this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND active=1',companyId).n>userLimit)throw Object.assign(new Error('The new user limit is below this company’s active user count.'),{status:409});if(!platformAdmin&&existing.enabled&&!enabled&&this.scalar('SELECT count(*) n FROM companies WHERE enabled=1').n<=1)throw new Error('Keep at least one active company so the software administrators can continue managing the system.');
   this.run('UPDATE companies SET user_limit=?,role_limits_json=?,modules_json=?,enabled=?,updated_at=? WHERE id=?',userLimit,JSON.stringify(roleLimits),JSON.stringify(modules),enabled,this.now(),companyId);this.auditRow(actor,companyId,enabled?'company.updated':'company.disabled');return {body:{success:true}};
  }
  if(m==='GET'&&p==='/api/admin/roles'){
   this.requireCompanyAdmin(actor,actor.activeCompanyId);
   return {body:Object.fromEntries(['company_admin','accountant','salesperson','storekeeper','manager','custom'].map(role=>[role,rolePermissions(role)]))};
  }
  if(m==='GET'&&p==='/api/admin/users'){
    const companyId=String(url.searchParams.get('companyId')||actor.activeCompanyId||''),company=this.requireCompanyAdmin(actor,companyId);return {body:this.all(`SELECT u.id,u.username,u.display_name AS displayName,u.email,u.email_verified AS emailVerified,CASE WHEN u.active=1 AND m.active=1 THEN 1 ELSE 0 END AS active,m.role,m.permissions_json,m.created_at FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=? ORDER BY u.username`,companyId).map(u=>({...u,permissions:JSON.parse(u.permissions_json),permissions_json:undefined,created_at:undefined,companyId}))};
  }
  if(m==='POST'&&p==='/api/admin/users'){
   this.requireCompanyAdmin(actor,String(body.companyId||actor.activeCompanyId||''));
   if(adminUsername(body.username)===ADMIN_ACCESS_USERNAME||normalizeEmail(body.email)===ADMIN_ACCESS_EMAIL)throw Object.assign(new Error('Platform administrators cannot belong to company workspaces.'),{status:403});
   if(this.scalar('SELECT id FROM users WHERE lower(username)=?',String(body.username||'').trim().toLowerCase()))throw Object.assign(new Error('Use a separate account for each company. This username is already registered.'),{status:409});
   const companyId=String(body.companyId||actor.activeCompanyId||''),company=this.requireCompanyAdmin(actor,companyId),role=String(body.role||'custom');if(!['company_admin','accountant','salesperson','storekeeper','manager','custom'].includes(role))throw new Error('Choose a supported user role.');
   const total=this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND active=1',companyId).n;if(total>=company.user_limit)throw Object.assign(new Error('This company has reached its user limit.'),{status:409});const roleLimits=JSON.parse(company.role_limits_json),used=this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND role=? AND active=1',companyId,role).n;if(used>=(roleLimits[role]??company.user_limit))throw Object.assign(new Error('This role has reached its user limit.'),{status:409});
    const username=String(body.username||'').trim().toLowerCase(),password=body.password,email=normalizeEmail(body.email);if(!/^[a-z0-9._-]{3,40}$/.test(username))throw new Error('Enter a valid username.');const existing=this.scalar('SELECT * FROM users WHERE username=?',username),userId=existing?.id||randomUUID();if(!existing&&!validPassword(password))throw new Error('A new user password must contain at least 12 characters.');if(existing&&this.scalar('SELECT 1 FROM memberships WHERE company_id=? AND user_id=?',companyId,userId))throw Object.assign(new Error('This user already belongs to the selected company.'),{status:409});if(existing&&(!existing.email_verified||!validEmail(existing.email)))throw new Error('This account must verify its email before it can be added to a company.');if(!existing){if(!validEmail(email))throw new Error('Enter the new user’s email address.');if(this.scalar('SELECT id FROM users WHERE lower(email)=?',email))throw Object.assign(new Error('This email address is already connected to an account.'),{status:409});this.verifyEmailOtp(`admin-user:${actor.userId}:${companyId}:${email}`,'admin-user',email,String(body.emailOtp||''))}const salt=crypto_randomBytes(16).toString('hex'),recovery=inertRecovery(),at=this.now(),permissions=role==='custom'?body.permissions||emptyPermissions():{...rolePermissions(role),...(body.permissions||{})};
     this.txn(()=>{if(!existing){this.run('INSERT INTO users(id,username,display_name,password_salt,password_hash,recovery_salt,recovery_hash,active,is_super,created_at,updated_at,email,email_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',userId,username,String(body.displayName||username),salt,access_control_scrypt(password,salt),recovery.salt,recovery.hash,1,0,at,at,email,1);this.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',`admin-user:${actor.userId}:${companyId}:${email}`,'admin-user')}this.run('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)',companyId,userId,role,body.active===false?0:1,JSON.stringify(permissions),at,at);this.auditRow(actor,companyId,existing?'user.added_to_company':'user.created',username)});return {body:{id:userId,username,displayName:existing?.display_name||String(body.displayName||username),role,active:true,existingUser:!!existing}};
  }
  const userMatch=p.match(/^\/api\/admin\/users\/([^/]+)$/);
  if(userMatch&&m==='PUT'){
   this.requireCompanyAdmin(actor,String(body.companyId||actor.activeCompanyId||''));
   if(protectedAdmin(this.scalar('SELECT * FROM users WHERE id=?',userMatch[1])))throw Object.assign(new Error('Platform administrator credentials cannot be changed from a company account.'),{status:403});
   if(this.scalar('SELECT 1 FROM memberships WHERE user_id=? AND company_id<>?',userMatch[1],String(body.companyId||actor.activeCompanyId||'')))throw Object.assign(new Error('This legacy shared account requires an account separation review before its credentials or permissions can be changed.'),{status:409});
   const userId=userMatch[1],companyId=String(body.companyId||actor.activeCompanyId||''),company=this.requireCompanyAdmin(actor,companyId),membership=this.scalar('SELECT m.*,u.username FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=? AND m.user_id=?',companyId,userId);if(!membership)throw new Error('User not found.');if(body.resetPassword&&!validPassword(body.newPassword))throw new Error('The new password must contain at least 12 characters.');
   if(body.permissions){membership.permissions_json=JSON.stringify(body.permissions)}if(body.role){if(!['company_admin','accountant','salesperson','storekeeper','manager','custom'].includes(body.role))throw new Error('Choose a supported user role.');membership.role=String(body.role)}if(body.active!==undefined)membership.active=body.active?1:0;
   const roleLimits=JSON.parse(company.role_limits_json);if(membership.active){const total=this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND active=1 AND user_id<>?',companyId,userId).n;if(total>=company.user_limit)throw Object.assign(new Error('This company has reached its active user limit.'),{status:409});const used=this.scalar('SELECT count(*) n FROM memberships WHERE company_id=? AND active=1 AND role=? AND user_id<>?',companyId,membership.role,userId).n;if(used>=(roleLimits[membership.role]??company.user_limit))throw Object.assign(new Error('This role has reached its active user limit.'),{status:409});}
   const remainingAdmins=this.scalar("SELECT count(*) n FROM memberships WHERE company_id=? AND role='company_admin' AND active=1 AND user_id<>?",companyId,userId).n;if(remainingAdmins+(membership.active&&membership.role==='company_admin'?1:0)<1)throw new Error('Keep at least one active company administrator.');
   const displayName=body.displayName===undefined?null:String(body.displayName).trim();if(displayName!==null&&(!displayName||displayName.length>120))throw new Error('Enter a full name of 1 to 120 characters.');
   this.txn(()=>{this.run('UPDATE memberships SET role=?,active=?,permissions_json=?,updated_at=? WHERE company_id=? AND user_id=?',membership.role,membership.active,membership.permissions_json,this.now(),companyId,userId);if(displayName!==null)this.run('UPDATE users SET display_name=?,updated_at=? WHERE id=?',displayName,this.now(),userId);if(body.resetPassword){const salt=crypto_randomBytes(16).toString('hex');this.run('UPDATE users SET password_salt=?,password_hash=?,updated_at=? WHERE id=?',salt,access_control_scrypt(body.newPassword,salt),userId);this.run('DELETE FROM sessions WHERE user_id=?',userId)}this.auditRow(actor,companyId,'user.updated',membership.username)});return {body:{success:true}};
  }
  if(userMatch&&m==='DELETE'){
   this.requireCompanyAdmin(actor,String(body.companyId||actor.activeCompanyId||''));
   if(protectedAdmin(this.scalar('SELECT * FROM users WHERE id=?',userMatch[1])))throw Object.assign(new Error('The platform administrator cannot be removed from a company account.'),{status:403});
   const userId=userMatch[1],companyId=String(body.companyId||actor.activeCompanyId||''),company=this.requireCompanyAdmin(actor,companyId),membership=this.scalar('SELECT m.*,u.username FROM memberships m JOIN users u ON u.id=m.user_id WHERE company_id=? AND user_id=?',companyId,userId);if(!membership)throw new Error('User not found.');if(membership.role==='company_admin')throw new Error('Deactivate the administrator or promote another first.');this.txn(()=>{this.run('DELETE FROM memberships WHERE company_id=? AND user_id=?',companyId,userId);this.auditRow(actor,companyId,'user.removed',membership.username);if(!this.scalar('SELECT user_id FROM memberships WHERE user_id=? LIMIT 1',userId)){this.run('DELETE FROM sessions WHERE user_id=?',userId);this.run('DELETE FROM users WHERE id=?',userId)}});return {body:{success:true}};
  }
  if(m==='GET'&&p==='/api/admin/audit'){
   if(actor.isSuper)return {body:this.all("SELECT username,company_name AS companyName,action,'' AS details,created_at AS date FROM audit WHERE action LIKE 'company.%' OR action IN ('auth.admin_login_otp','auth.admin_provisioned') ORDER BY created_at DESC LIMIT 1000")};
   if(!actor.isSuper&&!this.isAdmin(actor,actor.activeCompanyId))throw Object.assign(new Error('Administrator access is required.'),{status:403});const requested=url.searchParams.get('companyId')||actor.activeCompanyId||null;if(!actor.isSuper&&requested!==actor.activeCompanyId)throw Object.assign(new Error('You can only view your company activity.'),{status:403});return {body:this.all('SELECT username,company_name AS companyName,action,details,created_at AS date FROM audit WHERE (? IS NULL OR company_id=?) ORDER BY created_at DESC LIMIT 1000',requested,requested)};
  }
  return null;
 }
 can(actor,scope,action='view'){
  if(!actor||actor.isSuper)return false;const c=this.scalar('SELECT * FROM companies WHERE id=? AND enabled=1',actor.activeCompanyId||'');if(!c||this.primaryMembership(actor.userId)?.id!==c.id||JSON.parse(c.modules_json)[scope]===false)return false;const m=this.scalar('SELECT permissions_json FROM memberships WHERE company_id=? AND user_id=? AND active=1',c.id,actor.userId);return !!m&&JSON.parse(m.permissions_json)?.[scope]?.[action]===true;
 }
 requireCompanyAdmin(actor,companyId){const c=this.scalar('SELECT * FROM companies WHERE id=? AND enabled=1',companyId);if(!c||!actor||actor.isSuper||actor.activeCompanyId!==companyId||this.primaryMembership(actor.userId)?.id!==companyId||!this.scalar('SELECT 1 FROM memberships WHERE company_id=? AND user_id=? AND active=1 AND role=\'company_admin\'',companyId,actor.userId))throw Object.assign(new Error('This action requires the administrator of this company.'),{status:403});return c}
  // Company credentials never change tenant. Platform administration has
  // account-management access only and cannot enter company workspaces.
  canSwitchCompanies(actor){return false}
  isAdmin(actor,companyId){return !!actor?.isSuper||!!this.scalar('SELECT 1 FROM memberships WHERE company_id=? AND user_id=? AND active=1 AND role IN (\'company_admin\',\'manager\')',companyId,actor?.userId)}
 requireSuper(actor){if(!actor.isSuper)throw Object.assign(new Error('Super administrator access is required.'),{status:403})}
 validatePath(dir,companyId=''){
  const invalid=message=>{throw Object.assign(new Error(message),{status:400})};
  if(!runtime_path.isAbsolute(dir))invalid('Choose a full backup folder path.');
  if(process.env.INVOICEY_HOSTED==='1'){
   const base=runtime_path.resolve(this.dataRoot,companyId||'.'),relative=runtime_path.relative(base,dir);
   if(!relative||relative.startsWith('..')||runtime_path.isAbsolute(relative)||(!companyId&&!/^([^/\\]+)[/\\]backups(?:[/\\]|$)/.test(relative)))invalid('Hosted backups must stay inside the selected company backup folder.');
   if(companyId&&!(relative==='backups'||relative.startsWith('backups'+runtime_path.sep)))invalid('Hosted backups must stay inside the selected company backup folder.');
  }
  if(process.env.INVOICEY_HOSTED==='1')globalThis.INVOICEY_VALIDATE_BACKUP_PATH?.(dir);
  mkdirSync(dir,{recursive:true});const full=realpathSync(dir);accessSync(full,constants.W_OK);return full;
 }
}


;// ./server.mjs
/* provided dependency */ var process = __webpack_require__(321).A;
/* provided dependency */ var server_Buffer = __webpack_require__(1).h;











const ROOT = globalThis.INVOICEY_NODE_ROOT || process.env.INVOICEY_ROOT || runtime_path.dirname(fileURLToPath("file:///C:/Users/Dhanushka%20Lakmal/Documents/Cordex/server.mjs"));
const DATA_DIR = process.env.LEDGER_DATA_DIR || runtime_path.join(ROOT, 'data');
mkdirSync(DATA_DIR, { recursive: true });
const dbPath = process.env.LEDGER_DB || runtime_path.join(DATA_DIR, 'ledgerly.sqlite');
const hadLegacyDatabase=existsSync(dbPath)&&statSync(dbPath).size>0;
const legacyDb = new DatabaseSync(dbPath);
const databaseContext=new AsyncLocalStorage();
const activeDatabase=()=>databaseContext.getStore()?.db||legacyDb;
const db={exec(sql){return activeDatabase().exec(sql)},prepare(sql){return {all(...args){return activeDatabase().prepare(sql).all(...args)},get(...args){return activeDatabase().prepare(sql).get(...args)},run(...args){return activeDatabase().prepare(sql).run(...args)}}}};
db.exec(readFileSync(runtime_path.join(ROOT, 'database', 'schema.sql'), 'utf8'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
const now = () => new Date().toISOString();
const today = () => now().slice(0, 10);
const id = () => randomUUID();
const q = (sql, ...args) => db.prepare(sql).all(...args);
const one = (sql, ...args) => db.prepare(sql).get(...args);
const run = (sql, ...args) => db.prepare(sql).run(...args);
class InputError extends Error {}
const required = (value, label) => {
  const v = String(value ?? '').trim();
  if (!v) throw new InputError(`${label} is required.`);
  return v;
};
const amount = (value, label, { zero = true } = {}) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || (!zero && n === 0)) throw new InputError(`${label} must be ${zero ? 'zero or greater' : 'greater than zero'}.`);
  return Math.round(n * 100) / 100;
};
const quantity = (value, label = 'Quantity') => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new InputError(`${label} must be greater than zero.`);
  return Math.round(n * 1000) / 1000;
};
const inTransaction = fn => {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
};
function addColumnIfMissing(table, column, definition) {
  const columns=q(`PRAGMA table_info(${table})`).map(row=>row.name);
  if(!columns.includes(column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
function migrateCompanyProfiles() {
  const stamp=now();
  db.exec(`CREATE TABLE IF NOT EXISTS company_properties(id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL DEFAULT 'Other',unit TEXT NOT NULL DEFAULT 'each',quantity REAL NOT NULL DEFAULT 1,purchase_cost REAL NOT NULL DEFAULT 0,purchase_date TEXT NOT NULL,condition TEXT NOT NULL DEFAULT 'Good',location TEXT NOT NULL DEFAULT '',serial_number TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_company_properties_name ON company_properties(name); CREATE TABLE IF NOT EXISTS resource_usage(id TEXT PRIMARY KEY,resource_id TEXT NOT NULL REFERENCES company_properties(id),project_key TEXT NOT NULL,usage_date TEXT NOT NULL,quantity REAL NOT NULL DEFAULT 1,notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_resource_usage_resource_date ON resource_usage(resource_id,usage_date); CREATE INDEX IF NOT EXISTS idx_resource_usage_project ON resource_usage(project_key);`);
  db.exec(`CREATE TABLE IF NOT EXISTS repair_intakes(id TEXT PRIMARY KEY,intake_number TEXT NOT NULL UNIQUE,request_id TEXT NOT NULL DEFAULT '',company_id TEXT NOT NULL REFERENCES companies(id),intake_type TEXT NOT NULL DEFAULT 'repair_goods',status TEXT NOT NULL DEFAULT 'received',source_document_type TEXT NOT NULL DEFAULT '',source_document_id TEXT NOT NULL DEFAULT '',customer_id TEXT REFERENCES customers(id),supplier_id TEXT REFERENCES suppliers(id),repair_agent_supplier_id TEXT REFERENCES suppliers(id),item_name TEXT NOT NULL,item_description TEXT NOT NULL DEFAULT '',serial_number TEXT NOT NULL DEFAULT '',fault_description TEXT NOT NULL,condition_on_receipt TEXT NOT NULL DEFAULT '',accessories TEXT NOT NULL DEFAULT '',received_at TEXT NOT NULL,received_by TEXT NOT NULL,received_contact TEXT NOT NULL DEFAULT '',location TEXT NOT NULL DEFAULT '',sent_for_repair_at TEXT NOT NULL DEFAULT '',sent_for_repair_by TEXT NOT NULL DEFAULT '',workflow_stages TEXT NOT NULL DEFAULT '["goods_received"]',inspection_notes TEXT NOT NULL DEFAULT '',repair_notes TEXT NOT NULL DEFAULT '',resolution TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL); CREATE UNIQUE INDEX IF NOT EXISTS idx_repair_intake_request ON repair_intakes(request_id) WHERE request_id <> ''; CREATE INDEX IF NOT EXISTS idx_repair_intake_company ON repair_intakes(company_id,received_at); CREATE INDEX IF NOT EXISTS idx_repair_intake_source ON repair_intakes(source_document_type,source_document_id);`);
  for(const [column,definition] of [['repair_agent_supplier_id','TEXT REFERENCES suppliers(id)'],['sent_for_repair_at',"TEXT NOT NULL DEFAULT ''"],['sent_for_repair_by',"TEXT NOT NULL DEFAULT ''"]])addColumnIfMissing('repair_intakes',column,definition);
  addColumnIfMissing('companies','document_color',"TEXT NOT NULL DEFAULT '#1f5fae'");
  addColumnIfMissing('companies','receiver_key',"TEXT NOT NULL DEFAULT ''");
  run("INSERT OR IGNORE INTO settings(id,company_name,currency,locale,email,phone,address,tax_number,updated_at) VALUES (1,'Meridian Supply Co.','LKR','en-LK','','','','',?)",stamp);
  if(!one('SELECT id FROM companies LIMIT 1')){
    const legacy=one('SELECT * FROM settings WHERE id=1');
    run('INSERT OR IGNORE INTO companies(id,name,address,contact_numbers,email,tax_number,is_default,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)','company-default',legacy.company_name,legacy.address,legacy.phone,legacy.email,legacy.tax_number,1,stamp,stamp);
  }
  for(const [table,columns] of Object.entries({
    invoices:[['company_id','TEXT REFERENCES companies(id)'],['subtotal','REAL NOT NULL DEFAULT 0'],['discount_amount','REAL NOT NULL DEFAULT 0'],['discount_rate','REAL NOT NULL DEFAULT 0'],['tax_rate','REAL NOT NULL DEFAULT 0'],['tax_amount','REAL NOT NULL DEFAULT 0'],['terms',"TEXT NOT NULL DEFAULT ''"]],
    quotations:[['company_id','TEXT REFERENCES companies(id)'],['document_type',"TEXT NOT NULL DEFAULT 'quotation'"],['subtotal','REAL NOT NULL DEFAULT 0'],['discount_amount','REAL NOT NULL DEFAULT 0'],['discount_rate','REAL NOT NULL DEFAULT 0'],['tax_rate','REAL NOT NULL DEFAULT 0'],['tax_amount','REAL NOT NULL DEFAULT 0'],['terms',"TEXT NOT NULL DEFAULT ''"]],
    purchases:[['company_id','TEXT REFERENCES companies(id)'],['terms',"TEXT NOT NULL DEFAULT ''"]]
  }))for(const [column,definition] of columns)addColumnIfMissing(table,column,definition);
  addColumnIfMissing('products','description',"TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing('invoices','project_key',"TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing('quotations','project_key',"TEXT NOT NULL DEFAULT ''");
  for(const [column,definition] of [
    ['project_key',"TEXT NOT NULL DEFAULT ''"],['quotation_id','TEXT REFERENCES quotations(id)'],['invoice_id','TEXT REFERENCES invoices(id)'],['customer_id','TEXT REFERENCES customers(id)'],['supplier_id','TEXT REFERENCES suppliers(id)'],['project_name',"TEXT NOT NULL DEFAULT ''"],['expense_type',"TEXT NOT NULL DEFAULT 'general'"],['worker_count','REAL NOT NULL DEFAULT 0'],['worker_names',"TEXT NOT NULL DEFAULT ''"],['working_days','REAL NOT NULL DEFAULT 0'],['working_hours','REAL NOT NULL DEFAULT 0'],['labour_rate','REAL NOT NULL DEFAULT 0'],['labour_rate_unit',"TEXT NOT NULL DEFAULT 'day'"],['additional_labour','REAL NOT NULL DEFAULT 0']
  ])addColumnIfMissing('expenses',column,definition);
  for(const [column,definition] of [
    ['source_document_type',"TEXT NOT NULL DEFAULT 'invoice'"],['source_document_id',"TEXT NOT NULL DEFAULT ''"],['workflow_stages',`TEXT NOT NULL DEFAULT '["goods_received"]'`],['goods_received_at',"TEXT NOT NULL DEFAULT ''"],['goods_received_by',"TEXT NOT NULL DEFAULT ''"],['goods_received_contact',"TEXT NOT NULL DEFAULT ''"],['inspection_notes',"TEXT NOT NULL DEFAULT ''"],['repair_notes',"TEXT NOT NULL DEFAULT ''"]
  ])addColumnIfMissing('warranty_claims',column,definition);
  for(const table of ['invoice_items','quotation_items'])for(const [column,definition] of [
    ['item_type',"TEXT NOT NULL DEFAULT 'product'"],['service_id','TEXT REFERENCES services(id)'],['item_code',"TEXT NOT NULL DEFAULT ''"],
    ['service_title',"TEXT NOT NULL DEFAULT ''"],['service_description',"TEXT NOT NULL DEFAULT ''"],['discount_percent','REAL NOT NULL DEFAULT 0'],['discount_amount','REAL NOT NULL DEFAULT 0']
  ])addColumnIfMissing(table,column,definition);
  const defaultCompany=one('SELECT id FROM companies WHERE is_default=1 ORDER BY created_at LIMIT 1')||one('SELECT id FROM companies ORDER BY created_at LIMIT 1');
  if(!defaultCompany)throw new Error('A default company profile could not be created.');
  run('UPDATE companies SET is_default=0 WHERE is_default<>0 AND id<>?',defaultCompany.id);
  run('UPDATE companies SET is_default=1 WHERE id=?',defaultCompany.id);
  for(const table of ['invoices','quotations','purchases'])run(`UPDATE ${table} SET company_id=? WHERE company_id IS NULL OR company_id=''`,defaultCompany.id);
  for(const table of ['invoices','quotations'])run(`UPDATE ${table} SET subtotal=total WHERE subtotal=0 AND total>0`);
  for(const table of ['invoices','quotations'])run(`UPDATE ${table} SET discount_rate=CASE WHEN (subtotal-COALESCE((SELECT SUM(discount_amount) FROM ${table==='invoices'?'invoice_items':'quotation_items'} WHERE ${table==='invoices'?'invoice_id':'quotation_id'}=${table}.id),0))>0 THEN MAX(0,discount_amount-COALESCE((SELECT SUM(discount_amount) FROM ${table==='invoices'?'invoice_items':'quotation_items'} WHERE ${table==='invoices'?'invoice_id':'quotation_id'}=${table}.id),0))*100.0/(subtotal-COALESCE((SELECT SUM(discount_amount) FROM ${table==='invoices'?'invoice_items':'quotation_items'} WHERE ${table==='invoices'?'invoice_id':'quotation_id'}=${table}.id),0)) ELSE 0 END WHERE discount_rate=0 AND subtotal>0 AND discount_amount>0`);
  const categoryStamp=now();
  for(const category of ['Labour','Materials','Transport','Delivery','Fuel','Equipment','Subcontractor','Repairs','Other'])run('INSERT OR IGNORE INTO expense_categories(id,name,created_at,updated_at) VALUES (?,?,?,?)',id(),category,categoryStamp,categoryStamp);
  for(const row of q('SELECT DISTINCT category FROM expenses'))if(row.category)run('INSERT OR IGNORE INTO expense_categories(id,name,created_at,updated_at) VALUES (?,?,?,?)',id(),row.category,categoryStamp,categoryStamp);
  for(const quote of q('SELECT * FROM quotations WHERE length(project_key)=0')){
    const projectKey=`QT-${quote.quote_date.slice(0,4)}-${String(quote.number.match(/(\d+)$/)?.[1]||quote.id.slice(0,6)).padStart(6,'0')}`;
    run('UPDATE quotations SET project_key=? WHERE id=?',projectKey,quote.id);
    if(quote.invoice_id)run('UPDATE invoices SET project_key=? WHERE id=?',projectKey,quote.invoice_id);
  }
  for(const inv of q('SELECT * FROM invoices WHERE length(project_key)=0'))run('UPDATE invoices SET project_key=? WHERE id=?',`PR-${inv.invoice_date.slice(0,4)}-${String(inv.number.match(/(\d+)$/)?.[1]||inv.id.slice(0,6)).padStart(6,'0')}`,inv.id);
  for(const doc of [...q('SELECT project_key AS key,customer_id,number AS title,quote_date AS date FROM quotations'),...q('SELECT project_key AS key,customer_id,number AS title,invoice_date AS date FROM invoices')])if(doc.key)run('INSERT OR IGNORE INTO projects(id,project_key,title,customer_id,created_at,updated_at) VALUES (?,?,?,?,?,?)',id(),doc.key,doc.title,doc.customer_id,stamp,stamp);
  for(const project of q('SELECT project_key FROM projects')){const match=project.project_key.match(/^(QT|PR)-(\d{4})-(\d+)$/);if(match){const sequence=`project:${match[1]}:${match[2]}`,value=Number(match[3]);run('INSERT OR IGNORE INTO sequences(name,value) VALUES (?,?)',sequence,value);run('UPDATE sequences SET value=MAX(value,?) WHERE name=?',value,sequence);}}
  run('UPDATE expenses SET project_key=COALESCE((SELECT project_key FROM invoices WHERE invoices.id=expenses.invoice_id),(SELECT project_key FROM quotations WHERE quotations.id=expenses.quotation_id),project_key) WHERE length(project_key)=0 AND (invoice_id IS NOT NULL OR quotation_id IS NOT NULL)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id); CREATE INDEX IF NOT EXISTS idx_quotations_company ON quotations(company_id); CREATE INDEX IF NOT EXISTS idx_purchases_company ON purchases(company_id); CREATE INDEX IF NOT EXISTS idx_invoice_items_type ON invoice_items(item_type); CREATE INDEX IF NOT EXISTS idx_quotation_items_type ON quotation_items(item_type); CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_key,expense_date); CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense ON expense_attachments(expense_id);');
}
const refreshInvoice = invoiceId => {
  const inv = one('SELECT total FROM invoices WHERE id = ?', invoiceId);
  if (!inv) return;
  const paid = one('SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE invoice_id = ?', invoiceId).total;
  run('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?', paid >= inv.total ? (paid > inv.total ? 'overpaid' : 'paid') : (paid > 0 ? 'partial' : 'open'), now(), invoiceId);
};
const refreshPurchase = purchaseId => {
  const purchase = one('SELECT total FROM purchases WHERE id = ?', purchaseId);
  if (!purchase) return;
  const paid = one('SELECT COALESCE(SUM(amount),0) AS total FROM supplier_payments WHERE purchase_id = ?', purchaseId).total;
  run('UPDATE purchases SET status = ?, updated_at = ? WHERE id = ?', paid >= purchase.total ? (paid > purchase.total ? 'overpaid' : 'paid') : (paid > 0 ? 'partial' : 'open'), now(), purchaseId);
};
const nextNumber = (kind, prefix) => {
  run('INSERT OR IGNORE INTO sequences(name,value) VALUES (?,0)', kind);
  run('UPDATE sequences SET value=value+1 WHERE name=?', kind);
  return `${prefix}-${String(one('SELECT value FROM sequences WHERE name=?', kind).value).padStart(5, '0')}`;
};
function nextProjectKey(prefix,date=today()) {
  const year=String(date).slice(0,4),sequence=`project:${prefix}:${year}`;
  run('INSERT OR IGNORE INTO sequences(name,value) VALUES (?,0)',sequence);
  let key='';
  do {run('UPDATE sequences SET value=value+1 WHERE name=?',sequence);key=`${prefix}-${year}-${String(one('SELECT value FROM sequences WHERE name=?',sequence).value).padStart(6,'0')}`;} while(one('SELECT id FROM projects WHERE project_key=?',key));
  return key;
}
function ensureProject(projectKey,title,customerId) {
  const stamp=now();
  run('INSERT INTO projects(id,project_key,title,customer_id,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(project_key) DO UPDATE SET title=CASE WHEN excluded.title<>\'\' THEN excluded.title ELSE projects.title END,customer_id=COALESCE(excluded.customer_id,projects.customer_id),updated_at=excluded.updated_at',id(),projectKey,title||'',customerId||null,stamp,stamp);
}

migrateCompanyProfiles();

function workspaceHasSavedData() {
  const populatedTables=['customers','suppliers','products','services','invoices','invoice_items','payments','quotations','quotation_items','purchases','purchase_items','supplier_payments','expenses','expense_categories','expense_attachments','projects','stock_movements','partners','profit_shares'];
  if(populatedTables.some(table=>Number(one(`SELECT COUNT(*) AS n FROM ${table}`).n)>0))return true;
  const profile=one("SELECT * FROM companies WHERE id='company-default'");
  if(one('SELECT COUNT(*) AS n FROM companies').n>1||profile&&(profile.name!=='Meridian Supply Co.'||profile.address||profile.logo_data||profile.bank_name||profile.bank_branch||profile.bank_account_number||profile.account_holder||profile.contact_numbers||profile.email||profile.website||profile.tax_number||profile.additional_info||profile.terms_conditions||profile.receiver_key))return true;
  const settings=one('SELECT * FROM settings WHERE id=1');
  return Boolean(settings&&(settings.company_name!=='Meridian Supply Co.'||settings.currency!=='LKR'||settings.locale!=='en-LK'||settings.email||settings.phone||settings.address||settings.tax_number));
}
function seedIfEmpty() {
  if(one("SELECT key FROM app_metadata WHERE key='demo_seeded'"))return;
  if(workspaceHasSavedData()){
    run("INSERT OR IGNORE INTO app_metadata(key,value) VALUES ('demo_seeded',?)",now());
    return;
  }
  inTransaction(()=>{
  if(one("SELECT key FROM app_metadata WHERE key='demo_seeded'"))return;
  if(workspaceHasSavedData()){
    run("INSERT OR IGNORE INTO app_metadata(key,value) VALUES ('demo_seeded',?)",now());
    return;
  }
  const stamp = now();
  run('INSERT OR REPLACE INTO settings(id,company_name,currency,locale,email,phone,address,tax_number,updated_at) VALUES (1,?,?,?,?,?,?,?,?)', 'Meridian Supply Co.', 'LKR', 'en-LK', 'hello@meridiansupply.lk', '+94 11 234 5678', '24 Flower Road, Colombo 07', '',stamp);
  run("UPDATE companies SET name='Meridian Supply Co.',address='24 Flower Road, Colombo 07',email='hello@meridiansupply.lk',contact_numbers='+94 11 234 5678',updated_at=? WHERE id='company-default'",stamp);
  const customers = [
    ['C-01','Ava Perera','+94 77 234 1100','ava@example.com','Colombo 05'],
    ['C-02','Coastline Studio','+94 71 822 4015','accounts@coastline.lk','Galle Fort, Galle'],
    ['C-03','The Sunday Market','+94 76 402 8021','hello@sundaymarket.lk','Kandy'],
    ['C-04','Maya Fernando','+94 77 841 9210','maya@example.com','Rajagiriya'],
    ['C-05','Cedar & Co.','+94 11 211 9032','finance@cedar.lk','Nugegoda']
  ];
  for (const [key,name,phone,email,address] of customers) run('INSERT INTO customers VALUES (?,?,?,?,?,?,?)', key,name,phone,email,address,stamp,stamp);
  const suppliers = [
    ['S-01','Lanka Craft Works','+94 11 672 0090','orders@lankacraft.lk','Maharagama'],
    ['S-02','Paper & Parcel','+94 77 331 0770','hello@paperparcel.lk','Colombo 03'],
    ['S-03','Goodwood Trading','+94 81 220 9012','sales@goodwood.lk','Kandy']
  ];
  for (const [key,name,phone,email,address] of suppliers) run('INSERT INTO suppliers VALUES (?,?,?,?,?,?,?)', key,name,phone,email,address,stamp,stamp);
  const products = [
    ['P-01','CR-100','Woven Carryall','Bags','each',42,10,2800,4900],
    ['P-02','HM-204','Linen Tea Towel','Home','each',68,16,780,1650],
    ['P-03','ST-018','Stoneware Mug','Ceramics','each',31,8,1250,2450],
    ['P-04','NW-330','Recycled Notebook','Stationery','each',12,15,420,980],
    ['P-05','WL-042','Cedar Candle','Home','each',27,8,1150,2200],
    ['P-06','BT-091','Bamboo Tray','Home','each',9,6,1850,3400]
  ];
  for (const [key,sku,name,category,unit,qty,reorder,cost,price] of products) run('INSERT INTO products(id,sku,name,category,unit,quantity,reorder_level,purchase_price,selling_price,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)', key,sku,name,category,unit,qty,reorder,cost,price,stamp,stamp);
  run('INSERT INTO services(id,code,title,description,unit_price,unit_cost,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)','SV-01','CONS-001','Business consultation','Planning, review and advisory services.',12500,3500,stamp,stamp);
  run('INSERT INTO services(id,code,title,description,unit_price,unit_cost,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)','SV-02','DES-002','Product photography','Studio product photography and edited image delivery.',8500,2400,stamp,stamp);
  const addInvoice = (number, customerId, days, status, lines, payment) => {
    const invId = id(); const date = new Date(Date.now() - days*864e5).toISOString().slice(0,10);
    const total = lines.reduce((sum,x)=>sum+x[1]*x[2],0);
    run('INSERT INTO invoices(id,number,customer_id,invoice_date,due_date,status,notes,total,quotation_id,created_at,updated_at,company_id,subtotal,discount_amount,tax_rate,tax_amount,terms) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', invId,number,customerId,date,new Date(Date.now()-(days-14)*864e5).toISOString().slice(0,10),status,'',total,null,stamp,stamp,'company-default',total,0,0,0,'');
    for (const [productId,qty,price] of lines) {
      const p = one('SELECT name,purchase_price FROM products WHERE id=?', productId);
      run("INSERT INTO invoice_items(id,invoice_id,product_id,description,quantity,unit_price,unit_cost,line_total,item_type,item_code) VALUES (?,?,?,?,?,?,?,?, 'product',?)",id(),invId,productId,p.name,qty,price,p.purchase_price,qty*price,one('SELECT sku FROM products WHERE id=?',productId).sku);
    }
    if (payment > 0) run('INSERT INTO payments VALUES (?,?,?,?,?,?,?,?,?)',id(),invId,customerId,payment,'Bank transfer','',date,'',stamp);
  };
  addInvoice('INV-00124','C-01',0,'partial',[['P-01',2,4900],['P-02',3,1650],['P-05',1,2200]],9000);
  addInvoice('INV-00123','C-02',3,'paid',[['P-03',4,2450],['P-04',5,980]],14700);
  addInvoice('INV-00122','C-04',9,'open',[['P-06',2,3400],['P-02',4,1650]],0);
  addInvoice('INV-00121','C-03',18,'paid',[['P-01',3,4900],['P-05',2,2200]],19100);
  const quoteId = id();
  run('INSERT INTO quotations(id,number,customer_id,quote_date,valid_until,status,notes,total,invoice_id,created_at,updated_at,company_id,subtotal,discount_amount,tax_rate,tax_amount,terms) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',quoteId,'QUO-00042','C-05',today(),new Date(Date.now()+14*864e5).toISOString().slice(0,10),'sent','Delivery within 5 business days.',14700,null,stamp,stamp,'company-default',14700,0,0,0,'');
  run("INSERT INTO quotation_items(id,quotation_id,product_id,description,quantity,unit_price,unit_cost,line_total,item_type,item_code) VALUES (?,?,?,?,?,?,?,?,'product',?)",id(),quoteId,'P-01','Woven Carryall',3,4900,2800,14700,'CR-100');
  const purchase = id(); const purchaseDate = new Date(Date.now()-10*864e5).toISOString().slice(0,10);
  run('INSERT INTO purchases(id,number,supplier_id,purchase_date,status,notes,total,created_at,updated_at,company_id,terms) VALUES (?,?,?,?,?,?,?,?,?,?,?)',purchase,'PUR-00038','S-01',purchaseDate,'partial','Spring restock',47000,stamp,stamp,'company-default','');
  for (const [productId,qty,cost] of [['P-01',5,2800],['P-02',20,780],['P-03',8,1250],['P-06',4,1850]])
    run('INSERT INTO purchase_items VALUES (?,?,?,?,?,?)',id(),purchase,productId,qty,cost,qty*cost);
  run('INSERT INTO supplier_payments VALUES (?,?,?,?,?,?,?,?,?)',id(),'S-01',purchase,20000,'Bank transfer','',purchaseDate,'',stamp);
  const expenses = [
    ['Studio rent','Rent',65000,2],['Packaging supplies','Packaging',8400,5],['Courier and delivery','Shipping',6200,8],['Electricity','Utilities',11200,16]
  ];
  for (const [desc,category,value,days] of expenses) run('INSERT INTO expenses(id,description,category,amount,expense_date,payment_method,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',id(),desc,category,value,new Date(Date.now()-days*864e5).toISOString().slice(0,10),'Bank transfer','',stamp,stamp);
  for(const row of q('SELECT DISTINCT category FROM expenses'))if(row.category)run('INSERT OR IGNORE INTO expense_categories(id,name,created_at,updated_at) VALUES (?,?,?,?)',id(),row.category,stamp,stamp);
  const partners = [['Nisha Jayawardena',60,'nisha@example.com'],['Kavindu Silva',40,'kavindu@example.com']];
  for (const [name,pct,email] of partners) run('INSERT INTO partners VALUES (?,?,?,?,?,?)',id(),name,pct,email,stamp,stamp);
  const movements = [
    ['P-01','Opening stock',45,2800,'','Opening balance'],['P-02','Opening stock',55,780,'','Opening balance'],['P-03','Opening stock',27,1250,'','Opening balance'],['P-04','Opening stock',17,420,'','Opening balance'],['P-05','Opening stock',30,1150,'','Opening balance'],['P-06','Opening stock',7,1850,'','Opening balance'],
    ['P-01','Stock in',5,2800,'PUR-00038','Opening restock'],['P-02','Stock in',20,780,'PUR-00038','Opening restock'],['P-03','Stock in',8,1250,'PUR-00038','Opening restock'],['P-06','Stock in',4,1850,'PUR-00038','Opening restock'],
    ['P-01','Sale',-8,2800,'INV-00124 / 123 / 121','Demo transactions'],['P-02','Sale',-7,780,'INV-00124 / 122','Demo transactions'],['P-03','Sale',-4,1250,'INV-00123','Demo transactions'],['P-04','Sale',-5,420,'INV-00123','Demo transactions'],['P-05','Sale',-3,1150,'INV-00124 / 121','Demo transactions'],['P-06','Sale',-2,1850,'INV-00122','Demo transactions']
  ];
  for (const [pid,type,qty,cost,ref,notes] of movements) run('INSERT INTO stock_movements VALUES (?,?,?,?,?,?,?,?,?)',id(),pid,type,qty,cost,ref,notes,today(),stamp);
  for (const kind of ['invoice','quotation','purchase']) run('INSERT OR IGNORE INTO sequences(name,value) VALUES (?,0)',kind);
  run("UPDATE sequences SET value=124 WHERE name='invoice'"); run("UPDATE sequences SET value=42 WHERE name='quotation'"); run("UPDATE sequences SET value=38 WHERE name='purchase'");
  for(const inv of q('SELECT * FROM invoices')){const key=`PR-${inv.invoice_date.slice(0,4)}-${String(inv.number.match(/(\d+)$/)?.[1]||'1').padStart(6,'0')}`;run('UPDATE invoices SET project_key=? WHERE id=?',key,inv.id);ensureProject(key,inv.number,inv.customer_id);}
  const quote=one('SELECT * FROM quotations WHERE id=?',quoteId),quoteKey=`QT-${quote.quote_date.slice(0,4)}-${String(quote.number.match(/(\d+)$/)?.[1]||'1').padStart(6,'0')}`;run('UPDATE quotations SET project_key=? WHERE id=?',quoteKey,quote.id);ensureProject(quoteKey,quote.number,quote.customer_id);
  run("INSERT INTO app_metadata(key,value) VALUES ('demo_seeded',?)",stamp);
  });
}
const backupFileName='itsme-invoicey-account-backup.invoicey';
function currentTenant(){return databaseContext.getStore()||null;}
function companyBackupDirectory(){return currentTenant()?.company?.backupDir||runtime_path.join(DATA_DIR,'companies','unassigned','backups');}
function tenantBackupName(){return safeName(currentTenant()?.company?.name||'Company')+'_Account_Backup.invoicey';}
function tenantBackupPath(){return runtime_path.join(companyBackupDirectory(),tenantBackupName());}
function tenantArchivePath(){return runtime_path.join(companyBackupDirectory(),'automatic-history');}
function backupSchema(){
  return BACKUP_TABLES.map(name=>({name,columns:q('PRAGMA table_info(\"'+name+'\")').map(column=>({name:column.name,type:column.type||''}))}));
}
function createCurrentWorkbook(){const schema=backupSchema(),tables=Object.fromEntries(schema.map(table=>[table.name,q('SELECT * FROM \"'+table.name+'\"')]));return createBackupWorkbook(tables,schema,{appVersion:'2.0.1',companyId:currentTenant()?.company?.id||'legacy',companyName:currentTenant()?.company?.name||'Company'});}
function retainBackup(sourcePath,prefix=safeName(currentTenant()?.company?.name||'Company')+'-automatic'){
  const archiveDir=tenantArchivePath();mkdirSync(archiveDir,{recursive:true});
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const file=runtime_path.join(archiveDir,prefix+'-'+stamp+'-'+randomUUID().slice(0,8)+'.invoicey-backup');
  writeFileSync(file,readFileSync(sourcePath),{flag:'wx'});
  const old=readdirSync(archiveDir).filter(name=>name.toLowerCase().endsWith('.invoicey-backup'))
    .map(name=>({name,modified:statSync(runtime_path.join(archiveDir,name)).mtimeMs})).sort((a,b)=>b.modified-a.modified);
  for(const candidate of old.slice(30))try{unlinkSync(runtime_path.join(archiveDir,candidate.name));}catch{}
  return file;
}
function snapshotCompanyDatabase(targetPath){
  mkdirSync(runtime_path.dirname(targetPath),{recursive:true});
  try{unlinkSync(targetPath);}catch{}
  const escaped=String(targetPath).replaceAll("'","''");
  db.exec(`PRAGMA wal_checkpoint(FULL); VACUUM INTO '${escaped}'`);
  const integrity=one(`PRAGMA integrity_check`);
  if(String(integrity?.integrity_check||'').toLowerCase()!=='ok')throw new Error('The company backup failed its integrity check.');
  return targetPath;
}
function writeAutomaticBackup(){
  const backupFilePath=tenantBackupPath();mkdirSync(runtime_path.dirname(backupFilePath),{recursive:true});
  const temporary=backupFilePath+'.'+process.pid+'.tmp';
  try{snapshotCompanyDatabase(temporary);renameSync(temporary,backupFilePath);try{retainBackup(backupFilePath)}catch(error){console.error('The latest automatic account backup history copy could not be retained:',error.message)}return backupFilePath;}
  catch(error){
    try{unlinkSync(temporary);}catch{}
    throw new Error('Business data was saved, but the private account backup could not be updated. '+error.message);
  }
}
// Rebuilding a full workbook after every single row change makes large
// companies progressively slower. Keep the safety net, but coalesce bursts of
// edits into one per-company backup. Explicit backup downloads and restore
// operations still write immediately.
const automaticBackupTimers=new Map();
function scheduleAutomaticBackup(){
  const tenant=currentTenant(),companyId=tenant?.company?.id;
  if(!companyId||automaticBackupTimers.has(companyId))return;
  const store=tenant;
  const timer=setTimeout(()=>{
    automaticBackupTimers.delete(companyId);
    if(!accessControl.companyConfig(companyId))return;
    try{databaseContext.run(store,()=>writeAutomaticBackup());}
    catch(error){console.error('The debounced automatic account backup could not be updated:',error.message);}
  },1000);
  automaticBackupTimers.set(companyId,timer);
}
function archiveCurrentBackup(){return writeAutomaticBackup()&&retainBackup(tenantBackupPath(),'before-restore');}
function backupStatus(){
  const backupFilePath=tenantBackupPath(),archiveDir=tenantArchivePath();
  try{const stat=statSync(backupFilePath);if(stat.isFile())return {fileName:runtime_path.basename(backupFilePath),updatedAt:stat.mtime.toISOString(),available:true};}catch{}
  const candidates=[backupFilePath];
  try{for(const name of readdirSync(archiveDir))if(name.endsWith('.invoicey-backup'))candidates.push(runtime_path.join(archiveDir,name));}catch{}
  const latest=candidates.flatMap(file=>{try{const stat=statSync(file);return stat.isFile()?[{file,modified:stat.mtime}]:[];}catch{return [];}})
    .sort((a,b)=>b.modified.getTime()-a.modified.getTime())[0];
  return latest?{fileName:runtime_path.relative(DATA_DIR,latest.file),updatedAt:latest.modified.toISOString(),available:true,format:'private-company-sqlite'}
    :{fileName:tenantBackupName(),updatedAt:'',available:false,format:'private-company-sqlite'};
}

function restoreCompanySnapshot(archivePath){
  const escaped=String(archivePath).replaceAll("'","''");
  let attached=false,transactionStarted=false,committed=false;
  try{
    db.exec(`ATTACH DATABASE '${escaped}' AS restore_source`);attached=true;
    const sourceTables=db.prepare("SELECT name FROM restore_source.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row=>row.name);
    if(!sourceTables.length)throw new InputError('The account backup does not contain a company database.');
    const expectedTenant=currentTenant()?.company?.id||'';
    const sourceTenant=db.prepare("SELECT value FROM restore_source.app_metadata WHERE key='tenant_id' LIMIT 1").get()?.value||'';
    if(!expectedTenant||sourceTenant!==expectedTenant)throw new InputError('This backup belongs to a different company account. No records were restored.');
    const currentTables=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row=>row.name));
    const tables=sourceTables.filter(name=>currentTables.has(name));
    if(!tables.includes('companies')||!tables.includes('settings'))throw new InputError('The account backup is incomplete or incompatible.');
    db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;');transactionStarted=true;
    for(const table of tables.slice().reverse())db.exec(`DELETE FROM "${table.replaceAll('"','""')}"`);
    for(const table of tables){
      const safe=table.replaceAll('"','""');
      const columns=db.prepare(`PRAGMA table_info("${safe}")`).all().map(column=>column.name).filter(Boolean);
      if(!columns.length)continue;
      const list=columns.map(column=>`"${String(column).replaceAll('"','""')}"`).join(',');
      db.exec(`INSERT INTO "${safe}" (${list}) SELECT ${list} FROM restore_source."${safe}"`);
    }
    db.exec('COMMIT; PRAGMA foreign_keys=ON;');transactionStarted=false;committed=true;
  }catch(error){
    if(transactionStarted)try{db.exec('ROLLBACK;');}catch{}
    try{db.exec('PRAGMA foreign_keys=ON;');}catch{}
    if(error instanceof InputError)throw error;
    throw new InputError('The account backup is invalid, unreadable, or incompatible.');
  }finally{if(attached)try{db.exec('DETACH DATABASE restore_source');}catch{} }
  if(!committed)throw new InputError('The account backup could not be restored.');
  platformAdmin?.invalidateUsage(currentTenant()?.company?.id);
  migrateCompanyProfiles();
  return {success:true,restoredAt:now(),backup:backupStatus()};
}

function bootstrap() {
  const tables = ['settings','companies','customers','suppliers','products','company_properties','resource_usage','services','invoices','invoice_items','payments','quotations','quotation_items','purchases','purchase_items','supplier_payments','expenses','expense_categories','projects','stock_movements','partners','profit_shares','warranty_claims','warranty_claim_events','repair_intakes'];
  return {...Object.fromEntries(tables.map(table => [table, q(`SELECT * FROM ${table}`)])),expense_attachments:q('SELECT id,expense_id,file_name,mime_type,size_bytes,created_at FROM expense_attachments'),expense_allocations:expenseAllocationRows(),expense_invoices:expenseInvoiceRows(),project_profit_settings:q('SELECT project_key FROM projects').map(project=>({project_key:project.project_key,company_share_percent:projectCompanyShare(project.project_key)}))};
}
function companyExists(companyId) {
  const idValue=required(companyId,'Company / entity');
  if(idValue!=='company-default'||!one('SELECT id FROM companies WHERE id=?',idValue))throw new InputError('Choose the active company profile. Each company has its own separate data workspace.');
  return idValue;
}
function documentTotals(lines,data) {
  const subtotal=Math.round(lines.reduce((s,x)=>s+x.line,0)*100)/100;
  const discountPercent=amount(data.discountPercent??0,'Discount percentage');
  const taxRate=amount(data.taxRate??0,'Tax rate');
  if(discountPercent>100)throw new InputError('Discount cannot be greater than 100%.');
  if(taxRate>100)throw new InputError('Tax rate cannot be greater than 100%.');
  const lineDiscounts=Math.round(lines.reduce((s,x)=>s+(x.discountAmount||0),0)*100)/100;
  const documentDiscount=Math.round((subtotal-lineDiscounts)*discountPercent)/100;
  const discountAmount=Math.round((lineDiscounts+documentDiscount)*100)/100;
  const taxAmount=Math.round((subtotal-discountAmount)*taxRate)/100;
  return {subtotal,discountPercent,discountAmount,taxRate,taxAmount,total:Math.round((subtotal-discountAmount+taxAmount)*100)/100};
}
const MAX_UPLOAD_IMAGE_BYTES=500*1024;
function companyFields(data,existingLogo='') {
  const name=required(data.name,'Company name');
  let logo=String(data.logoData||'');
  if(logo&&!/^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=\r\n]+$/.test(logo))throw new InputError('Upload a PNG, JPG, WebP or SVG logo.');
  if(logo.length>5_600_000)throw new InputError('The logo must be 4 MB or smaller.');
  if(logo){
    const [,format,encoded]=logo.match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,([A-Za-z0-9+/=\r\n]+)$/)||[];
    const image=server_Buffer.from(encoded.replace(/\s/g,''),'base64');
    if(!image.length)throw new InputError('The uploaded company logo is empty or invalid.');
    if(logo!==existingLogo&&image.length>MAX_UPLOAD_IMAGE_BYTES)throw new InputError('Company logos and uploaded images must be 500 KB or smaller.');
    if(format==='svg+xml'){
    const svg=image.toString('utf8');
    if(!/<svg\b/i.test(svg)||/<\s*(?:script|foreignObject|iframe|object|embed)\b|<!DOCTYPE|<!ENTITY|@import|\bon[a-z]+\s*=|(?:href|src)\s*=\s*["']\s*(?!#)|url\s*\(\s*["']?\s*(?!#)/i.test(svg))throw new InputError('This SVG contains active or external content. Save it as a clean logo SVG and try again.');
    }else{
      const valid=format==='png'
        ?image.length>=24&&image.subarray(0,8).equals(server_Buffer.from([137,80,78,71,13,10,26,10]))&&image.toString('ascii',12,16)==='IHDR'&&image.subarray(-12).toString('ascii',4,8)==='IEND'
        :format==='jpeg'
          ?image.length>=4&&image[0]===0xff&&image[1]===0xd8&&image[2]===0xff&&image[image.length-2]===0xff&&image[image.length-1]===0xd9
          :image.length>=12&&image.toString('ascii',0,4)==='RIFF'&&image.toString('ascii',8,12)==='WEBP'&&image.readUInt32LE(4)+8<=image.length;
      if(!valid)throw new InputError('The uploaded company logo is not a valid image file. Choose a PNG, JPG, WebP or SVG logo.');
    }
  }
  const color=String(data.documentColor||data.document_color||'#1f5fae').trim();
  if(!/^#[0-9a-fA-F]{6}$/.test(color))throw new InputError('Invoice color must be a valid six-digit hexadecimal color.');
  const receiverKey=String(data.receiverKey??data.receiver_key??'');
  if(receiverKey.length>256)throw new InputError('Receiver Key must be 256 characters or fewer.');
  return {
    name,address:String(data.address||''),logo_data:logo,bank_name:String(data.bankName||''),bank_branch:String(data.bankBranch||''),
    bank_account_number:String(data.bankAccountNumber||''),account_holder:String(data.accountHolder||''),contact_numbers:String(data.contactNumbers||''),
    email:String(data.email||''),website:String(data.website||''),tax_number:String(data.taxNumber||''),additional_info:String(data.additionalInfo||''),
    terms_conditions:String(data.termsConditions||''),document_color:color.toLowerCase(),receiver_key:receiverKey
  };
}
function saveCompany(data,companyId=null) {
  const existing=companyId?one('SELECT logo_data FROM companies WHERE id=?',companyId):null,f=companyFields(data,existing?.logo_data||''),stamp=now();
  if(companyId){if(!one('SELECT id FROM companies WHERE id=?',companyId))throw new InputError('Company profile not found.');
    run('UPDATE companies SET name=?,address=?,logo_data=?,bank_name=?,bank_branch=?,bank_account_number=?,account_holder=?,contact_numbers=?,email=?,website=?,tax_number=?,additional_info=?,terms_conditions=?,document_color=?,receiver_key=?,updated_at=? WHERE id=?',f.name,f.address,f.logo_data,f.bank_name,f.bank_branch,f.bank_account_number,f.account_holder,f.contact_numbers,f.email,f.website,f.tax_number,f.additional_info,f.terms_conditions,f.document_color,f.receiver_key,stamp,companyId);
  }else{companyId=id();run('INSERT INTO companies(id,name,address,logo_data,bank_name,bank_branch,bank_account_number,account_holder,contact_numbers,email,website,tax_number,additional_info,terms_conditions,document_color,receiver_key,is_default,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)',companyId,f.name,f.address,f.logo_data,f.bank_name,f.bank_branch,f.bank_account_number,f.account_holder,f.contact_numbers,f.email,f.website,f.tax_number,f.additional_info,f.terms_conditions,f.document_color,f.receiver_key,stamp,stamp);}
  return one('SELECT * FROM companies WHERE id=?',companyId);
}
function setDefaultCompany(companyId) {
  companyExists(companyId);return one('SELECT * FROM companies WHERE id=?',companyId);
}

function normalizeItems(items, kind) {
  if (!Array.isArray(items) || items.length === 0) throw new InputError('Add at least one line item.');
  const normalized=items.map(row => {
    const itemType=kind==='purchase'?'product':String(row.itemType||'product');
    if(!['product','service'].includes(itemType))throw new InputError('Choose Product or Service for each line.');
    const qty=quantity(row.quantity);
    const discountPercent=kind==='purchase'?0:amount(row.discountPercent??0,'Line discount percentage');
    if(discountPercent>100)throw new InputError('A line discount cannot be greater than 100%.');
    if(itemType==='service'){
      const serviceId=String(row.serviceId||'')||null,service=serviceId?one('SELECT * FROM services WHERE id=?',serviceId):null;
      if(serviceId&&!service)throw new InputError('One of the selected services no longer exists.');
      const title=required(row.serviceTitle||service?.title,'Service title');
      const price=amount(row.unitPrice??service?.unit_price??0,'Service charge');
      const cost=amount(row.unitCost??service?.unit_cost??0,'Service cost');
      const line=Math.round(qty*price*100)/100,discountAmount=Math.round(line*discountPercent)/100;
      return {itemType:'service',product:null,service,serviceId,title,description:String(row.serviceDescription??service?.description??''),code:String(service?.code||''),qty,price,cost,line,discountPercent,discountAmount};
    }
    const product=one('SELECT * FROM products WHERE id=?',required(row.productId,'Product'));
    if(!product)throw new InputError('One of the selected products no longer exists.');
    const price=amount(kind==='purchase'?(row.unitCost??product.purchase_price):(row.unitPrice??product.selling_price),kind==='purchase'?'Purchase price':'Selling price');
    const cost=kind==='purchase'?price:amount(row.unitCost??product.purchase_price,'Product cost');
    const line=Math.round(qty*price*100)/100,discountAmount=Math.round(line*discountPercent)/100;
    return {itemType:'product',product,service:null,serviceId:null,title:product.name,description:String(row.productDescription??product.description??''),code:product.sku,qty,price,cost,line,discountPercent,discountAmount};
  });
  if(kind==='invoice'){
    const requested=new Map();for(const line of normalized)if(line.itemType==='product')requested.set(line.product.id,(requested.get(line.product.id)||0)+line.qty);
    for(const line of normalized){if(line.itemType!=='product')continue;const total=requested.get(line.product.id);if(total===undefined)continue;if(total>line.product.quantity)throw new InputError(`Not enough ${line.product.name} in stock. Available: ${line.product.quantity}.`);requested.delete(line.product.id);}
  }
  return normalized;
}

function createInvoice(data, quotationId = null, inheritedProjectKey = null) {
  const customerId = required(data.customerId, 'Customer');
  if (!one('SELECT id FROM customers WHERE id=?',customerId)) throw new InputError('Select a valid customer.');
  const companyId=companyExists(data.companyId);
  const lines = normalizeItems(data.items,'invoice');
  const totals=documentTotals(lines,data),total=totals.total; const paid = amount(data.paidAmount ?? 0,'Amount received');
  const invoiceId = id(); const stamp = now(); const date = data.invoiceDate || today();
  const projectKey=required(inheritedProjectKey||data.projectKey||nextProjectKey('PR',date),'Project key');
  ensureProject(projectKey,data.projectName||'',customerId);
  run('INSERT INTO invoices(id,number,customer_id,invoice_date,due_date,status,notes,total,quotation_id,created_at,updated_at,company_id,subtotal,discount_amount,discount_rate,tax_rate,tax_amount,terms,project_key,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',invoiceId,nextNumber('invoice','INV'),customerId,date,data.dueDate || '',paid >= total ? (paid > total ? 'overpaid':'paid') : (paid > 0?'partial':'open'),String(data.notes||''),total,quotationId,stamp,stamp,companyId,totals.subtotal,totals.discountAmount,totals.discountPercent,totals.taxRate,totals.taxAmount,String(data.terms||''),projectKey,currentTenant()?.actor?.userId||'');
  for (const line of lines) {
    run('INSERT INTO invoice_items(id,invoice_id,product_id,description,quantity,unit_price,unit_cost,line_total,item_type,service_id,item_code,service_title,service_description,discount_percent,discount_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id(),invoiceId,line.product?.id||null,line.title,line.qty,line.price,line.cost,line.line,line.itemType,line.serviceId,line.code,line.itemType==='service'?line.title:'',line.itemType==='service'?line.description:'',line.discountPercent,line.discountAmount);
    if(line.itemType==='product'){
      run('UPDATE products SET quantity=quantity-?,updated_at=? WHERE id=?',line.qty,stamp,line.product.id);
      run('INSERT INTO stock_movements VALUES (?,?,?,?,?,?,?,?,?)',id(),line.product.id,'Sale',-line.qty,line.cost,one('SELECT number FROM invoices WHERE id=?',invoiceId).number,'Invoice sale',date,stamp);
    }
  }
  if (paid > 0) run('INSERT INTO payments VALUES (?,?,?,?,?,?,?,?,?)',id(),invoiceId,customerId,paid,data.paymentMethod||'Cash',String(data.paymentReference||''),date,String(data.paymentNotes||''),stamp);
  return one('SELECT * FROM invoices WHERE id=?',invoiceId);
}

function updateInvoice(data, invoiceId) {
  const old=one('SELECT * FROM invoices WHERE id=?',invoiceId);
  if(!old)throw new InputError('Invoice not found.');
  if(old.quotation_id)throw new InputError('This invoice was converted from a quotation and cannot be edited. Edit the quotation before conversion instead.');
  if(one('SELECT id FROM payments WHERE invoice_id=? LIMIT 1',invoiceId))throw new InputError('This invoice has payment history and cannot be edited. Create an adjustment invoice for changes after payment.');
  if(q('SELECT * FROM expenses').some(expense=>expenseTouchesInvoice(expense,invoiceId)))throw new InputError('This invoice has a linked expense and cannot be edited. Keep its financial history unchanged.');
  const companyId=companyExists(data.companyId);
  if(companyId!==old.company_id)throw new InputError('An invoice cannot be moved between companies.');
  const customerId=required(data.customerId,'Customer');
  if(!one('SELECT id FROM customers WHERE id=?',customerId))throw new InputError('Select a valid customer.');
  // Restore the original sale inside the surrounding transaction before
  // validating replacement lines. If validation fails, the transaction rolls
  // every stock movement back and leaves the invoice unchanged.
  for(const item of q("SELECT product_id,quantity FROM invoice_items WHERE invoice_id=? AND item_type='product'",invoiceId))adjustStock(item.product_id,Number(item.quantity),'Invoice edit reversal',`Restored stock while editing ${old.number}`,old.invoice_date);
  const lines=normalizeItems(data.items,'invoice');
  const totals=documentTotals(lines,data),total=totals.total,stamp=now(),date=data.invoiceDate||old.invoice_date;
  ensureProject(old.project_key,data.projectName||'',customerId);
  run('UPDATE invoices SET customer_id=?,invoice_date=?,due_date=?,status=?,notes=?,total=?,updated_at=?,company_id=?,subtotal=?,discount_amount=?,discount_rate=?,tax_rate=?,tax_amount=?,terms=?,project_key=? WHERE id=?',customerId,date,String(data.dueDate||''),'open',String(data.notes||''),total,stamp,companyId,totals.subtotal,totals.discountAmount,totals.discountPercent,totals.taxRate,totals.taxAmount,String(data.terms||''),old.project_key,invoiceId);
  run('DELETE FROM invoice_items WHERE invoice_id=?',invoiceId);
  for(const line of lines){
    run('INSERT INTO invoice_items(id,invoice_id,product_id,description,quantity,unit_price,unit_cost,line_total,item_type,service_id,item_code,service_title,service_description,discount_percent,discount_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id(),invoiceId,line.product?.id||null,line.title,line.qty,line.price,line.cost,line.line,line.itemType,line.serviceId,line.code,line.itemType==='service'?line.title:'',line.itemType==='service'?line.description:'',line.discountPercent,line.discountAmount);
    if(line.itemType==='product'){
      run('UPDATE products SET quantity=quantity-?,updated_at=? WHERE id=?',line.qty,stamp,line.product.id);
      run('INSERT INTO stock_movements VALUES (?,?,?,?,?,?,?,?,?)',id(),line.product.id,'Sale',-line.qty,line.cost,old.number,'Invoice edited',date,stamp);
    }
  }
  return one('SELECT * FROM invoices WHERE id=?',invoiceId);
}

function createPurchase(data) {
  const supplierId = required(data.supplierId,'Supplier');
  if (!one('SELECT id FROM suppliers WHERE id=?',supplierId)) throw new InputError('Select a valid supplier.');
  const companyId=companyExists(data.companyId);
  const lines = normalizeItems(data.items,'purchase');
  const total=lines.reduce((s,x)=>s+x.line,0), paid=amount(data.paidAmount??0,'Amount paid');
  const purchaseId=id(),stamp=now(),date=data.purchaseDate||today(),number=nextNumber('purchase','PUR');
  run('INSERT INTO purchases(id,number,supplier_id,purchase_date,status,notes,total,created_at,updated_at,company_id,terms,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',purchaseId,number,supplierId,date,paid>=total?(paid>total?'overpaid':'paid'):(paid>0?'partial':'open'),String(data.notes||''),total,stamp,stamp,companyId,String(data.terms||''),currentTenant()?.actor?.userId||'');
  for (const line of lines) {
    const product=one('SELECT * FROM products WHERE id=?',line.product.id); const newQty=product.quantity+line.qty;
    const avgCost=newQty>0?((product.quantity*product.purchase_price+line.qty*line.price)/newQty):line.price;
    run('INSERT INTO purchase_items VALUES (?,?,?,?,?,?)',id(),purchaseId,product.id,line.qty,line.price,line.line);
    run('UPDATE products SET quantity=?,purchase_price=?,updated_at=? WHERE id=?',newQty,avgCost,stamp,product.id);
    run('INSERT INTO stock_movements VALUES (?,?,?,?,?,?,?,?,?)',id(),product.id,'Purchase',line.qty,line.price,number,'Purchase receipt',date,stamp);
  }
  if (paid>0) run('INSERT INTO supplier_payments VALUES (?,?,?,?,?,?,?,?,?)',id(),supplierId,purchaseId,paid,data.paymentMethod||'Cash',String(data.paymentReference||''),date,String(data.paymentNotes||''),stamp);
  return one('SELECT * FROM purchases WHERE id=?',purchaseId);
}

function saveQuote(data, quotationId = null) {
  const customerId=required(data.customerId,'Customer');
  if (!one('SELECT id FROM customers WHERE id=?',customerId)) throw new InputError('Select a valid customer.');
  const companyId=companyExists(data.companyId);
  const lines=normalizeItems(data.items,'quotation'),totals=documentTotals(lines,data),total=totals.total,stamp=now();
  const documentType=String(data.documentType||'quotation');if(!['quotation','estimate'].includes(documentType))throw new InputError('Choose quotation or estimate.');
  const quoteStatus=String(data.status||'draft');if(!['draft','sent'].includes(quoteStatus)&&!quotationId)throw new InputError('Choose draft or sent for a new quotation.');
  let projectKey='';
  if (quotationId) {
    const old=one('SELECT * FROM quotations WHERE id=?',quotationId);
    if (!old) throw new InputError('Quotation not found.');
    if (old.invoice_id) throw new InputError('This quotation is linked to an invoice and can no longer be edited.');
    if (companyId!==old.company_id) throw new InputError('A quotation or estimate cannot be moved between companies.');
    if(data.status!==undefined&&!['draft','sent'].includes(quoteStatus))throw new InputError('A quotation status must be draft or sent.');
    projectKey=old.project_key;
    run('UPDATE quotations SET customer_id=?,document_type=?,quote_date=?,valid_until=?,status=?,notes=?,total=?,updated_at=?,company_id=?,subtotal=?,discount_amount=?,discount_rate=?,tax_rate=?,tax_amount=?,terms=?,project_key=? WHERE id=?',customerId,documentType,data.quoteDate||today(),String(data.validUntil||''),quoteStatus,String(data.notes||''),total,stamp,companyId,totals.subtotal,totals.discountAmount,totals.discountRate??totals.discountPercent,totals.taxRate,totals.taxAmount,String(data.terms||''),projectKey,quotationId);
    run('DELETE FROM quotation_items WHERE quotation_id=?',quotationId);
  } else {quotationId=id();projectKey=nextProjectKey('QT',data.quoteDate||today());}
  const number=quotationId && one('SELECT number FROM quotations WHERE id=?',quotationId)?.number || nextNumber(documentType==='estimate'?'estimate':'quotation',documentType==='estimate'?'EST':'QUO');
  if (!one('SELECT id FROM quotations WHERE id=?',quotationId)) run('INSERT INTO quotations(id,number,customer_id,document_type,quote_date,valid_until,status,notes,total,invoice_id,created_at,updated_at,company_id,subtotal,discount_amount,discount_rate,tax_rate,tax_amount,terms,project_key,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',quotationId,number,customerId,documentType,data.quoteDate||today(),String(data.validUntil||''),quoteStatus,String(data.notes||''),total,null,stamp,stamp,companyId,totals.subtotal,totals.discountAmount,totals.discountPercent,totals.taxRate,totals.taxAmount,String(data.terms||''),projectKey,currentTenant()?.actor?.userId||'');
  ensureProject(projectKey,String(data.projectName||''),customerId);
  for (const line of lines) run('INSERT INTO quotation_items(id,quotation_id,product_id,description,quantity,unit_price,unit_cost,line_total,item_type,service_id,item_code,service_title,service_description,discount_percent,discount_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id(),quotationId,line.product?.id||null,line.title,line.qty,line.price,line.cost,line.line,line.itemType,line.serviceId,line.code,line.itemType==='service'?line.title:'',line.itemType==='service'?line.description:'',line.discountPercent,line.discountAmount);
  return one('SELECT * FROM quotations WHERE id=?',quotationId);
}

function generatedProductSku(name, excludedId = '') {
  const base=String(name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24)||'PRODUCT';
  if(!one('SELECT id FROM products WHERE lower(sku)=lower(?) AND id<>? LIMIT 1',base,excludedId||''))return base;
  for(let suffix=2;suffix<10000;suffix++){
    const candidate=`${base}-${String(suffix).padStart(3,'0')}`;
    if(!one('SELECT id FROM products WHERE lower(sku)=lower(?) AND id<>? LIMIT 1',candidate,excludedId||''))return candidate;
  }
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}
function updateCatalog(table, data, itemId = null) {
  const stamp=now();
  if (table==='customers'||table==='suppliers') {
    const name=required(data.name,'Name'); const phone=String(data.phone||''),email=String(data.email||''),address=String(data.address||'');
    if (itemId) {
      if (!one(`SELECT id FROM ${table} WHERE id=?`,itemId)) throw new InputError('Record not found.');
      run(`UPDATE ${table} SET name=?,phone=?,email=?,address=?,updated_at=? WHERE id=?`,name,phone,email,address,stamp,itemId);
      return one(`SELECT * FROM ${table} WHERE id=?`,itemId);
    }
    const newId=id(); run(`INSERT INTO ${table}(id,name,phone,email,address,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`,newId,name,phone,email,address,stamp,stamp);
    return one(`SELECT * FROM ${table} WHERE id=?`,newId);
  }
  if (table==='products') {
    const previous=itemId?one('SELECT * FROM products WHERE id=?',itemId):null;
    if(itemId&&!previous)throw new InputError('Product not found.');
    const name=required(data.name,'Product name'),requestedSku=String(data.sku??'').trim(),sku=requestedSku||String(previous?.sku||'').trim()||generatedProductSku(name,itemId||''),category=String(data.category||'General'),unit=String(data.unit||'each'),reorder=amount(data.reorderLevel??5,'Reorder level'),cost=amount(data.purchasePrice??0,'Purchase price'),price=amount(data.sellingPrice??0,'Selling price');
    const duplicate=one('SELECT id FROM products WHERE lower(sku)=lower(?) AND id<>? LIMIT 1',sku,itemId||'');
    if(duplicate)throw new InputError(`SKU "${sku}" is already in use.`);
    const description=String(data.description||'');
    if (itemId) {
      run('UPDATE products SET sku=?,name=?,category=?,unit=?,reorder_level=?,purchase_price=?,selling_price=?,description=?,updated_at=? WHERE id=?',sku,name,category,unit,reorder,cost,price,description,stamp,itemId);
      if (data.quantity !== undefined && Number(data.quantity)!==previous.quantity) adjustStock(itemId,Number(data.quantity)-previous.quantity,'Stock correction','Product edit',today());
      return one('SELECT * FROM products WHERE id=?',itemId);
    }
    const initial=amount(data.quantity??0,'Opening stock'); const newId=id();
    run('INSERT INTO products(id,sku,name,category,unit,quantity,reorder_level,purchase_price,selling_price,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',newId,sku,name,category,unit,initial,reorder,cost,price,description,stamp,stamp);
    if (initial>0) run('INSERT INTO stock_movements VALUES (?,?,?,?,?,?,?,?,?)',id(),newId,'Opening stock',initial,cost,'','Opening balance',today(),stamp);
    return one('SELECT * FROM products WHERE id=?',newId);
  }
  if (table==='company_properties') {
    const existing=itemId?one('SELECT * FROM company_properties WHERE id=?',itemId):null;
    const propertyActor=typeof currentTenant==='function'?currentTenant()?.actor:null;
    if(propertyActor&&!accessControl.can(propertyActor,'profit','view'))data={...data,purchaseCost:existing?.purchase_cost??0};
    const name=required(data.name,'Property name'),category=String(data.category||'Other').trim()||'Other',unit=String(data.unit||'each').trim()||'each';
    const qty=amount(data.quantity??existing?.quantity??1,'Quantity'),cost=amount(data.purchaseCost??existing?.purchase_cost??0,'Purchase cost'),purchaseDate=String(data.purchaseDate||existing?.purchase_date||today()).trim(),condition=String(data.condition||existing?.condition||'Good').trim()||'Good',location=String(data.location??existing?.location??''),serialNumber=String(data.serialNumber??existing?.serial_number??''),notes=String(data.notes??existing?.notes??'');
    if(!['New','Good','Fair','Needs repair','Retired'].includes(condition))throw new InputError('Choose a valid property condition.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)||!Number.isFinite(Date.parse(purchaseDate))||new Date(purchaseDate+'T00:00:00Z').toISOString().slice(0,10)!==purchaseDate)throw new InputError('Enter a valid purchase date.');
    if(serialNumber&&one('SELECT id FROM company_properties WHERE lower(name)=lower(?) AND serial_number=? AND id<>? LIMIT 1',name,serialNumber,itemId||''))throw new InputError('A resource with this name and serial number already exists.');
    if(itemId){if(!existing)throw new InputError('Property not found.');run('UPDATE company_properties SET name=?,category=?,unit=?,quantity=?,purchase_cost=?,purchase_date=?,condition=?,location=?,serial_number=?,notes=?,updated_at=? WHERE id=?',name,category,unit,qty,cost,purchaseDate,condition,location,serialNumber,notes,stamp,itemId);return one('SELECT * FROM company_properties WHERE id=?',itemId);}
    const newId=id();run('INSERT INTO company_properties(id,name,category,unit,quantity,purchase_cost,purchase_date,condition,location,serial_number,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',newId,name,category,unit,qty,cost,purchaseDate,condition,location,serialNumber,notes,stamp,stamp);return one('SELECT * FROM company_properties WHERE id=?',newId);
  }
  if(table==='services'){
    const title=required(data.title,'Service title'),code=String(data.code||''),description=String(data.description||''),price=amount(data.unitPrice??0,'Service charge'),cost=amount(data.unitCost??0,'Service cost');
    if(itemId){if(!one('SELECT id FROM services WHERE id=?',itemId))throw new InputError('Service not found.');run('UPDATE services SET code=?,title=?,description=?,unit_price=?,unit_cost=?,updated_at=? WHERE id=?',code,title,description,price,cost,stamp,itemId);return one('SELECT * FROM services WHERE id=?',itemId);}
    const newId=id();run('INSERT INTO services(id,code,title,description,unit_price,unit_cost,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',newId,code,title,description,price,cost,stamp,stamp);return one('SELECT * FROM services WHERE id=?',newId);
  }
}

function adjustStock(productId, delta, movementType, notes, movementDate=today()) {
  const product=one('SELECT * FROM products WHERE id=?',productId); if (!product) throw new InputError('Product not found.');
  if (!Number.isFinite(delta)||delta===0) throw new InputError('Enter a non-zero quantity change.');
  const next=product.quantity+delta; if (next<0) throw new InputError(`That change would put ${product.name} below zero stock.`);
  const stamp=now(); run('UPDATE products SET quantity=?,updated_at=? WHERE id=?',next,stamp,productId);
  run('INSERT INTO stock_movements VALUES (?,?,?,?,?,?,?,?,?)',id(),productId,movementType,delta,product.purchase_price,'',String(notes||''),movementDate,stamp);
}

function saveExpenseAttachments(expenseId,attachments=[]){
  if(!Array.isArray(attachments))throw new InputError('Expense documents must be a list of files.');
  for(const file of attachments){
    const name=runtime_path.basename(String(file.name||'expense-document')).replace(/[\r\n"\\]/g,'_').slice(0,180),mime=String(file.type||'').toLowerCase();
    const allowed={'application/pdf':['pdf'],'image/jpeg':['jpg','jpeg'],'image/png':['png']},ext=name.split('.').pop().toLowerCase();
    if(!allowed[mime]?.includes(ext))throw new InputError('Expense documents must be PDF, JPG, JPEG or PNG files.');
    const data=String(file.data||'').match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
    if(!data||data[1].toLowerCase()!==mime)throw new InputError(`The file ${name} could not be read.`);
    const buffer=server_Buffer.from(data[2],'base64');if(!buffer.length||buffer.length>6*1024*1024)throw new InputError('Each expense document must be 6 MB or smaller.');if(mime.startsWith('image/')&&buffer.length>MAX_UPLOAD_IMAGE_BYTES)throw new InputError('Each uploaded image must be 500 KB or smaller.');
    const valid=mime==='application/pdf'?buffer.subarray(0,5).toString()==='%PDF-':mime==='image/png'?buffer.subarray(0,8).equals(server_Buffer.from([137,80,78,71,13,10,26,10])):buffer.subarray(0,3).equals(server_Buffer.from([255,216,255]));
    if(!valid)throw new InputError(`${name} does not appear to be a valid ${ext.toUpperCase()} file.`);
    run('INSERT INTO expense_attachments(id,expense_id,file_name,mime_type,size_bytes,file_data,created_at) VALUES (?,?,?,?,?,?,?)',id(),expenseId,name,mime,buffer.length,buffer,now());
  }
}
function deleteExpenseAttachment(attachmentId){
  const attachment=one('SELECT id,expense_id FROM expense_attachments WHERE id=?',String(attachmentId||''));
  if(!attachment)throw Object.assign(new Error('Expense bill or receipt was not found.'),{status:404});
  if(!one('SELECT id FROM expenses WHERE id=?',attachment.expense_id))throw Object.assign(new Error('The expense for this file no longer exists.'),{status:404});
  run('DELETE FROM expense_attachments WHERE id=?',attachment.id);
  return {success:true,id:attachment.id};
}
const EXPENSE_ALLOCATION_PREFIX='expense-allocations:';
const PROJECT_COMPANY_SHARE_PREFIX='project-company-share:';
function storedExpenseAllocations(expense){
  if(!expense)return [];
  const row=one('SELECT value FROM app_metadata WHERE key=?',EXPENSE_ALLOCATION_PREFIX+expense.id);
  if(row?.value){
    try{
      const parsed=JSON.parse(row.value);
      if(Array.isArray(parsed))return parsed.map(item=>({project_key:String(item.projectKey||item.project_key||'').trim(),amount:Number(item.amount)})).filter(item=>item.project_key&&Number.isFinite(item.amount)&&item.amount>0);
    }catch{}
  }
  return expense.project_key?[{project_key:expense.project_key,amount:Number(expense.amount)||0}]:[];
}
function expenseAllocationRows(){
  return q('SELECT * FROM expenses').flatMap(expense=>storedExpenseAllocations(expense).map(allocation=>({expense_id:expense.id,project_key:allocation.project_key,amount:allocation.amount})));
}
function normalizeExpenseAllocations(data,total,{documentProjectKey='',customerId=null}={}){
  let raw=Array.isArray(data.projectAllocations)?data.projectAllocations:[];
  if(!raw.length&&String(data.projectKey||'').trim())raw=[{projectKey:String(data.projectKey).trim(),amount:total}];
  if(raw.length>50)throw new InputError('One expense can be divided between no more than 50 projects.');
  const seen=new Set(),allocations=[];
  for(const item of raw){
    const projectKey=String(item?.projectKey||item?.project_key||'').trim();
    if(!projectKey)continue;
    if(seen.has(projectKey))throw new InputError('Each project can appear only once in an expense allocation.');
    const project=one('SELECT * FROM projects WHERE project_key=?',projectKey);
    if(!project)throw new InputError(`Project ${projectKey} was not found. Create its quotation or invoice before allocating an expense.`);
    const allocated=amount(item?.amount,'Project allocation',{zero:false});
    seen.add(projectKey);allocations.push({project_key:projectKey,amount:allocated});
  }
  if(documentProjectKey){
    if(allocations.length!==1||allocations[0].project_key!==documentProjectKey)throw new InputError('An expense linked to a quotation or invoice must be allocated entirely to that document’s project.');
  }
  if(allocations.length){
    const allocatedTotal=Math.round(allocations.reduce((sum,item)=>sum+item.amount,0)*100)/100;
    if(Math.abs(allocatedTotal-total)>0.009)throw new InputError(`Project allocations must total exactly ${total.toFixed(2)}. The current allocation is ${allocatedTotal.toFixed(2)}.`);
  }
  for(const allocation of allocations){
    const project=one('SELECT customer_id FROM projects WHERE project_key=?',allocation.project_key);
    if(customerId&&project?.customer_id&&project.customer_id!==customerId)throw new InputError(`Project ${allocation.project_key} belongs to another customer.`);
  }
  return allocations;
}
function saveExpenseAllocations(expenseId,allocations){
  const key=EXPENSE_ALLOCATION_PREFIX+expenseId;
  if(!allocations.length){run('DELETE FROM app_metadata WHERE key=?',key);return;}
  run('INSERT OR REPLACE INTO app_metadata(key,value) VALUES (?,?)',key,JSON.stringify(allocations.map(item=>({projectKey:item.project_key,amount:item.amount}))));
}
const EXPENSE_INVOICES_PREFIX='expense-invoices:';
function storedExpenseInvoices(expense){
  if(!expense)return [];
  const row=one('SELECT value FROM app_metadata WHERE key=?',EXPENSE_INVOICES_PREFIX+expense.id);
  if(row?.value){
    try{
      const parsed=JSON.parse(row.value),values=Array.isArray(parsed)?parsed:[];
      return [...new Set(values.map(item=>String(item?.invoiceId||item?.invoice_id||item||'').trim()).filter(invoiceId=>invoiceId&&one('SELECT id FROM invoices WHERE id=?',invoiceId)))];
    }catch{}
  }
  return expense.invoice_id?[expense.invoice_id]:[];
}
function expenseInvoiceRows(){
  return q('SELECT * FROM expenses').flatMap(expense=>storedExpenseInvoices(expense).map(invoice_id=>({expense_id:expense.id,invoice_id})));
}
function normalizeExpenseInvoices(data){
  if(data.projectAllocations||String(data.projectKey||'').trim())throw new InputError('Project allocation is no longer supported for expenses. Link one or more invoices instead.');
  if(data.quotationId)throw new InputError('Quotations are not billable documents and cannot be linked to expenses. Link invoices instead.');
  const raw=Array.isArray(data.invoiceIds)?data.invoiceIds:(String(data.invoiceId||'').trim()?[data.invoiceId]:[]);
  if(raw.length>50)throw new InputError('One expense can reference no more than 50 invoices.');
  const seen=new Set(),invoiceIds=[];
  for(const value of raw){
    const invoiceId=String(value||'').trim();
    if(!invoiceId)continue;
    if(seen.has(invoiceId))throw new InputError('Each invoice can appear only once on an expense.');
    if(!one('SELECT id FROM invoices WHERE id=?',invoiceId))throw new InputError('Select valid invoices.');
    seen.add(invoiceId);invoiceIds.push(invoiceId);
  }
  return invoiceIds;
}
function saveExpenseInvoices(expenseId,invoiceIds){
  const key=EXPENSE_INVOICES_PREFIX+expenseId;
  if(!invoiceIds.length){run('DELETE FROM app_metadata WHERE key=?',key);return;}
  run('INSERT OR REPLACE INTO app_metadata(key,value) VALUES (?,?)',key,JSON.stringify(invoiceIds.map(invoiceId=>({invoiceId}))));
}
function expenseTouchesInvoice(expense,invoiceId){return storedExpenseInvoices(expense).includes(invoiceId);}
function projectCompanyShare(projectKey){
  const value=Number(one('SELECT value FROM app_metadata WHERE key=?',PROJECT_COMPANY_SHARE_PREFIX+projectKey)?.value||0);
  return Number.isFinite(value)?Math.min(100,Math.max(0,value)):0;
}
function setProjectCompanyShare(projectKey,value){
  if(!one('SELECT project_key FROM projects WHERE project_key=?',projectKey))throw new InputError('Project not found.');
  const percentage=amount(value,'Company share percentage');
  if(percentage>100)throw new InputError('Company share percentage cannot exceed 100.');
  run('INSERT OR REPLACE INTO app_metadata(key,value) VALUES (?,?)',PROJECT_COMPANY_SHARE_PREFIX+projectKey,String(percentage));
  const lossLedger=lcRead();if(lossLedger.charges[projectKey]){lossLedger.charges[projectKey]={mode:'percentage',value:percentage};lcReconcile(lossLedger);lcSave(lossLedger);}
  return {projectKey,companySharePercent:percentage};
}
function expenseTouchesProject(expense,projectKey){return storedExpenseAllocations(expense).some(item=>item.project_key===projectKey);}
function createExpense(data, expenseId=null) {
  const expenseType=String(data.expenseType||'general');if(!['general','labour'].includes(expenseType))throw new InputError('Choose a valid expense type.');
  const description=required(data.description,'Description'),category=required(data.category||'Other','Category');
  if(!one('SELECT id FROM expense_categories WHERE name=?',category))throw new InputError('Choose an expense category from Expense Settings.');
  const invoiceIds=normalizeExpenseInvoices(data),invoiceRows=invoiceIds.map(invoiceId=>one('SELECT * FROM invoices WHERE id=?',invoiceId)),firstInvoice=invoiceRows[0]||null;
  let customerId=String(data.customerId||'')||null;
  if(!customerId&&invoiceIds.length===1)customerId=firstInvoice.customer_id;
  if(customerId&&!one('SELECT id FROM customers WHERE id=?',customerId))throw new InputError('Select a valid customer.');
  const supplierId=String(data.supplierId||'')||null;if(supplierId&&!one('SELECT id FROM suppliers WHERE id=?',supplierId))throw new InputError('Select a valid supplier.');
  const workers=amount(data.workerCount??0,'Resource quantity'),days=amount(data.workingDays??0,'Working days'),hours=amount(data.workingHours??0,'Working hours'),rate=amount(data.labourRate??0,'Resource rate'),additional=amount(data.additionalLabour??0,'Additional resource cost'),manual=amount(data.resourceTotal??data.amount??0,'Resource total'),rateUnit=String(data.labourRateUnit||'day');
  if(!['day','hour'].includes(rateUnit))throw new InputError('Choose a valid labour rate unit.');
  const calculated=expenseType==='labour'?Math.round(((rateUnit==='hour'?workers*hours:workers*days)*rate+additional)*100)/100:0;
  const value=expenseType==='labour'?amount(calculated||manual,'Resource total',{zero:false}):amount(data.amount,'Amount',{zero:false});
  const date=data.expenseDate||today(),stamp=now(),method=String(data.paymentMethod||'Cash'),notes=String(data.notes||'');let targetId=expenseId;
  if(expenseId){const previous=one('SELECT * FROM expenses WHERE id=?',expenseId);if(!previous)throw new InputError('Expense not found.');
    run('UPDATE expenses SET description=?,category=?,amount=?,expense_date=?,payment_method=?,notes=?,updated_at=?,project_key=?,quotation_id=?,invoice_id=?,customer_id=?,supplier_id=?,project_name=?,expense_type=?,worker_count=?,worker_names=?,working_days=?,working_hours=?,labour_rate=?,labour_rate_unit=?,additional_labour=? WHERE id=?',description,category,value,date,method,notes,stamp,'',null,invoiceIds.length===1?invoiceIds[0]:null,customerId,supplierId,'',expenseType,workers,String(data.workerNames||''),days,hours,rate,rateUnit,additional,expenseId);
  }else{targetId=id();run('INSERT INTO expenses(id,description,category,amount,expense_date,payment_method,notes,created_at,updated_at,project_key,quotation_id,invoice_id,customer_id,supplier_id,project_name,expense_type,worker_count,worker_names,working_days,working_hours,labour_rate,labour_rate_unit,additional_labour,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',targetId,description,category,value,date,method,notes,stamp,stamp,'',null,invoiceIds.length===1?invoiceIds[0]:null,customerId,supplierId,'',expenseType,workers,String(data.workerNames||''),days,hours,rate,rateUnit,additional,currentTenant()?.actor?.userId||'');}
  saveExpenseInvoices(targetId,invoiceIds);saveExpenseAttachments(targetId,data.attachments||[]);
  return {...one('SELECT * FROM expenses WHERE id=?',targetId),invoiceIds};
}

function saveExpenseCategory(data,categoryId=null){
  const name=required(data.name,'Category name'),stamp=now();
  if(categoryId){const old=one('SELECT * FROM expense_categories WHERE id=?',categoryId);if(!old)throw new InputError('Expense category not found.');run('UPDATE expenses SET category=? WHERE category=?',name,old.name);run('UPDATE expense_categories SET name=?,updated_at=? WHERE id=?',name,stamp,categoryId);return one('SELECT * FROM expense_categories WHERE id=?',categoryId);}
  const newId=id();run('INSERT INTO expense_categories(id,name,created_at,updated_at) VALUES (?,?,?,?)',newId,name,stamp,stamp);return one('SELECT * FROM expense_categories WHERE id=?',newId);
}

function createPayment(data, supplier=false) {
  const value=amount(data.amount,'Amount',{zero:false}),date=data.paymentDate||today(),stamp=now(),method=String(data.method||'Cash'),reference=String(data.reference||''),notes=String(data.notes||'');
  if (supplier) {
    const supplierId=required(data.supplierId,'Supplier'); if (!one('SELECT id FROM suppliers WHERE id=?',supplierId)) throw new InputError('Select a valid supplier.');
    const purchaseId=String(data.purchaseId||'')||null;
    if (purchaseId && !one('SELECT id FROM purchases WHERE id=? AND supplier_id=?',purchaseId,supplierId)) throw new InputError('Select a purchase for this supplier.');
    const paymentId=id(); run('INSERT INTO supplier_payments VALUES (?,?,?,?,?,?,?,?,?)',paymentId,supplierId,purchaseId,value,method,reference,date,notes,stamp); if (purchaseId) refreshPurchase(purchaseId); return one('SELECT * FROM supplier_payments WHERE id=?',paymentId);
  }
  const invoiceId=required(data.invoiceId,'Invoice'),invoice=one('SELECT * FROM invoices WHERE id=?',invoiceId); if (!invoice) throw new InputError('Select a valid invoice.');
  const paymentId=id(); run('INSERT INTO payments VALUES (?,?,?,?,?,?,?,?,?)',paymentId,invoiceId,invoice.customer_id,value,method,reference,date,notes,stamp); refreshInvoice(invoiceId); return one('SELECT * FROM payments WHERE id=?',paymentId);
}

function profitPurchaseUnitCost(productId,invoiceDate=''){
  const rows=q('SELECT pi.quantity,pi.unit_cost,p.purchase_date FROM purchase_items pi JOIN purchases p ON p.id=pi.purchase_id WHERE pi.product_id=?',productId);let quantity=0,value=0;
  for(const row of rows){if(invoiceDate&&row.purchase_date&&String(row.purchase_date).slice(0,10)>String(invoiceDate).slice(0,10))continue;const qty=Number(row.quantity)||0,unit=Number(row.unit_cost);if(qty>0&&Number.isFinite(unit)&&unit>0){quantity+=qty;value+=qty*unit;}}
  if(quantity>0)return {unitCost:value/quantity,source:'Purchase history'};
  const row=one('SELECT purchase_price FROM products WHERE id=?',productId),cost=Number(row?.purchase_price);return Number.isFinite(cost)&&cost>0?{unitCost:cost,source:'Product purchase cost'}:null;
}
function profitInvoiceLineCost(line,invoice){
  const stored=Number(line.unit_cost),selling=Number(line.unit_price)||0,isService=line.item_type==='service';
  const fallback=isService?(()=>{const row=one('SELECT unit_cost FROM services WHERE id=?',line.service_id),cost=Number(row?.unit_cost);return Number.isFinite(cost)&&cost>0?{unitCost:cost,source:'Service delivery cost'}:null;})():profitPurchaseUnitCost(line.product_id,invoice?.invoice_date);
  const valid=Number.isFinite(stored)&&stored>0,sameAsSelling=valid&&selling>0&&Math.abs(stored-selling)<0.005;
  if(valid&&!sameAsSelling)return {unitCost:stored,known:true};
  if(fallback)return {unitCost:fallback.unitCost,known:true};
  return {unitCost:0,known:false};
}
function profitInvoiceStats(invoice){
  const lines=q('SELECT * FROM invoice_items WHERE invoice_id=?',invoice.id),lineDiscounts=lines.reduce((sum,line)=>sum+Number(line.discount_amount||0),0),documentDiscount=Math.max(0,Number(invoice.discount_amount||0)-lineDiscounts),lineNetTotal=lines.reduce((sum,line)=>sum+Number(line.line_total||0)-Number(line.discount_amount||0),0);
  let sales=0,directCost=0,missing=0;
  for(const line of lines){const lineNet=Math.max(0,Number(line.line_total||0)-Number(line.discount_amount||0)),share=lineNetTotal>0?documentDiscount*lineNet/lineNetTotal:(lines.length?documentDiscount/lines.length:0),lineSales=Math.max(0,lineNet-share),cost=profitInvoiceLineCost(line,invoice);sales+=lineSales;if(cost.known)directCost+=(Number(line.quantity)||0)*cost.unitCost;else missing++;}
  return {sales,directCost,missing};
}
function createProfitShares(data) {
  const start=required(data.periodStart,'Period start'),end=required(data.periodEnd,'Period end'); if (end<start) throw new InputError('Period end must be on or after period start.');
  const partners=q('SELECT * FROM partners'); if (!partners.length) throw new InputError('Add a partner before calculating profit shares.');
  const allocated=partners.reduce((sum,p)=>sum+Number(p.share_percent),0);if(allocated>100)throw new InputError(`Partner percentages add up to ${allocated}%. Reduce them to 100% or less before calculating shares.`);
  const invoices=q('SELECT * FROM invoices WHERE invoice_date BETWEEN ? AND ?',start,end),projectProfit=new Map();let revenue=0,directCost=0;
  for(const invoice of invoices){const stats=profitInvoiceStats(invoice);revenue+=stats.sales;directCost+=stats.directCost;const key=invoice.project_key||'';projectProfit.set(key,(projectProfit.get(key)||0)+stats.sales-stats.directCost);}
  const expenses=q('SELECT * FROM expenses WHERE expense_date BETWEEN ? AND ?',start,end);for(const expense of expenses)for(const allocation of storedExpenseAllocations(expense))projectProfit.set(allocation.project_key,(projectProfit.get(allocation.project_key)||0)-Number(allocation.amount||0));
  const basis=revenue-directCost-expenses.reduce((sum,expense)=>sum+Number(expense.amount||0),0);
  const lossLedger=lcRead(),lossView=lcView(lossLedger);let companyRetained=0;for(const [key,profit] of projectProfit){const config=lossLedger.charges[key]||{mode:'percentage',value:projectCompanyShare(key)};companyRetained+=Math.min(Math.max(0,profit),config.mode==='fixed'?Number(config.value):Math.max(0,profit)*Number(config.value)/100);}
  const distributionRecovery=lossView.recoveries.filter(row=>row.source==='distributable'&&!row.reversedAt&&row.createdAt.slice(0,10)>=start&&row.createdAt.slice(0,10)<=end&&lcValid(lossLedger.confirmations.find(item=>item.id===row.confirmationId)||{},lossLedger)).reduce((sum,row)=>sum+row.amount/100,0);
  companyRetained=Math.round(companyRetained*100)/100;const distributable=Math.max(0,Math.round((Number(basis)-companyRetained-distributionRecovery)*100)/100);
  for (const p of partners) run('INSERT OR REPLACE INTO profit_shares VALUES (?,?,?,?,?,?,?,?)',id(),p.id,start,end,distributable,p.share_percent,distributable*p.share_percent/100,now());
  return { totalNetProfit:Number(basis),companyRetained,profitBasis:distributable,shares:q('SELECT ps.*,p.name AS partner_name FROM profit_shares ps JOIN partners p ON p.id=ps.partner_id WHERE period_start=? AND period_end=?',start,end) };
}

function cleanupProject(projectKey){
  if(!projectKey)return;
  const linked=one('SELECT (SELECT COUNT(*) FROM invoices WHERE project_key=?)+(SELECT COUNT(*) FROM quotations WHERE project_key=?)+(SELECT COUNT(*) FROM resource_usage WHERE project_key=?) AS n',projectKey,projectKey,projectKey).n||q('SELECT * FROM expenses').some(expense=>expenseTouchesProject(expense,projectKey));
  if(!linked){run('DELETE FROM projects WHERE project_key=?',projectKey);run('DELETE FROM app_metadata WHERE key=?',PROJECT_COMPANY_SHARE_PREFIX+projectKey);}
}
function deleteCustomer(customerId){
  if(!one('SELECT id FROM customers WHERE id=?',customerId))throw new InputError('Customer not found.');
  const projectKeys=q('SELECT project_key FROM projects WHERE customer_id=?',customerId).map(x=>x.project_key);
  for(const key of projectKeys){const linked=one('SELECT (SELECT COUNT(*) FROM invoices WHERE project_key=?)+(SELECT COUNT(*) FROM quotations WHERE project_key=?)+(SELECT COUNT(*) FROM resource_usage WHERE project_key=?) AS n',key,key,key).n||q('SELECT * FROM expenses').some(expense=>expenseTouchesProject(expense,key));if(linked)throw new InputError('This customer has linked documents, resource usage or expenses and cannot be deleted.');}
  for(const key of projectKeys)cleanupProject(key);
  const linked=one('SELECT (SELECT COUNT(*) FROM invoices WHERE customer_id=?)+(SELECT COUNT(*) FROM quotations WHERE customer_id=?)+(SELECT COUNT(*) FROM payments WHERE customer_id=?)+(SELECT COUNT(*) FROM expenses WHERE customer_id=?) AS n',customerId,customerId,customerId,customerId).n;
  if(linked)throw new InputError('This customer has linked documents, payments or expenses and cannot be deleted.');
  run('DELETE FROM customers WHERE id=?',customerId);return {success:true};
}
function deleteSupplier(supplierId){
  if(!one('SELECT id FROM suppliers WHERE id=?',supplierId))throw new InputError('Supplier not found.');
  const linked=one('SELECT (SELECT COUNT(*) FROM purchases WHERE supplier_id=?)+(SELECT COUNT(*) FROM supplier_payments WHERE supplier_id=?)+(SELECT COUNT(*) FROM expenses WHERE supplier_id=?) AS n',supplierId,supplierId,supplierId).n;
  if(linked)throw new InputError('This supplier has linked purchases, payments or expenses and cannot be deleted.');
  run('DELETE FROM suppliers WHERE id=?',supplierId);return {success:true};
}
function deleteProduct(productId){
  if(!one('SELECT id FROM products WHERE id=?',productId))throw new InputError('Product not found.');
  const linked=one('SELECT (SELECT COUNT(*) FROM invoice_items WHERE product_id=?)+(SELECT COUNT(*) FROM quotation_items WHERE product_id=?)+(SELECT COUNT(*) FROM purchase_items WHERE product_id=?)+(SELECT COUNT(*) FROM stock_movements WHERE product_id=?) AS n',productId,productId,productId,productId).n;
  if(linked)throw new InputError('This product has stock history or linked documents and cannot be deleted.');
  run('DELETE FROM products WHERE id=?',productId);return {success:true};
}
function saveResourceUsage(data, usageId = null) {
  const resourceId=required(data.resourceId,'Resource');
  if(!one('SELECT id FROM company_properties WHERE id=?',resourceId))throw new InputError('Choose a valid company resource.');
  const projectKey=required(data.projectKey,'Project / site');
  if(!one('SELECT project_key FROM projects WHERE project_key=?',projectKey))throw new InputError('Choose a valid project or site.');
  const actor=typeof currentTenant==='function'?currentTenant()?.actor:null;
  if(actor?.role==='salesperson'){
    const canUse=key=>one('SELECT id FROM invoices WHERE project_key=? AND created_by=? UNION ALL SELECT id FROM quotations WHERE project_key=? AND created_by=? LIMIT 1',key,actor.userId,key,actor.userId);
    const previous=usageId?one('SELECT project_key FROM resource_usage WHERE id=?',usageId):null;
    if(!canUse(projectKey)||previous&&!canUse(previous.project_key))throw Object.assign(new InputError('You can only record usage for your own projects.'),{status:403});
  }
  const usageDate=String(data.usageDate||today()).trim(),quantity=amount(data.quantity??1,'Usage quantity'),notes=String(data.notes||'').trim(),stamp=now();
  if(quantity<=0)throw new InputError('Usage quantity must be greater than zero.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(usageDate)||!Number.isFinite(Date.parse(usageDate))||new Date(usageDate+'T00:00:00Z').toISOString().slice(0,10)!==usageDate)throw new InputError('Enter a valid usage date.');
  if(one('SELECT id FROM resource_usage WHERE resource_id=? AND project_key=? AND usage_date=? AND quantity=? AND notes=? AND id<>? LIMIT 1',resourceId,projectKey,usageDate,quantity,notes,usageId||''))throw new InputError('This exact resource usage record already exists.');
  if(usageId){
    if(!one('SELECT id FROM resource_usage WHERE id=?',usageId))throw new InputError('Resource usage record not found.');
    run('UPDATE resource_usage SET resource_id=?,project_key=?,usage_date=?,quantity=?,notes=?,updated_at=? WHERE id=?',resourceId,projectKey,usageDate,quantity,notes,stamp,usageId);
    return one('SELECT * FROM resource_usage WHERE id=?',usageId);
  }
  const newId=id(data.id);run('INSERT INTO resource_usage(id,resource_id,project_key,usage_date,quantity,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)',newId,resourceId,projectKey,usageDate,quantity,notes,stamp,stamp);return one('SELECT * FROM resource_usage WHERE id=?',newId);
}
function deleteResourceUsage(usageId){
  if(!one('SELECT id FROM resource_usage WHERE id=?',usageId))throw new InputError('Resource usage record not found.');
  run('DELETE FROM resource_usage WHERE id=?',usageId);return {success:true};
}
function visibleProperty(row){
  const actor=currentTenant()?.actor;if(!actor||accessControl.can(actor,'profit','view'))return row;
  const {purchase_cost,...visible}=row;return visible;
}
function deleteProperty(propertyId){
  if(!one('SELECT id FROM company_properties WHERE id=?',propertyId))throw new InputError('Property not found.');
  if(one('SELECT id FROM resource_usage WHERE resource_id=? LIMIT 1',propertyId))throw new InputError('This resource has usage history. Remove its usage records first if you really need to delete it.');
  run('DELETE FROM company_properties WHERE id=?',propertyId);return {success:true};
}
function deleteService(serviceId){
  if(!one('SELECT id FROM services WHERE id=?',serviceId))throw new InputError('Service not found.');
  if(one('SELECT (SELECT COUNT(*) FROM invoice_items WHERE service_id=?)+(SELECT COUNT(*) FROM quotation_items WHERE service_id=?) AS n',serviceId,serviceId).n)throw new InputError('This service is used by a quotation or invoice and cannot be deleted.');
  run('DELETE FROM services WHERE id=?',serviceId);return {success:true};
}
function deleteExpense(expenseId){
  const expense=one('SELECT * FROM expenses WHERE id=?',expenseId);if(!expense)throw new InputError('Expense not found.');
  run('DELETE FROM app_metadata WHERE key=?',EXPENSE_INVOICES_PREFIX+expenseId);run('DELETE FROM app_metadata WHERE key=?',EXPENSE_ALLOCATION_PREFIX+expenseId);run('DELETE FROM expenses WHERE id=?',expenseId);return {success:true};
}
function deleteQuote(quotationId){
  const quote=one('SELECT * FROM quotations WHERE id=?',quotationId);if(!quote)throw new InputError('Quotation not found.');
  if(quote.invoice_id)throw new InputError('A quotation converted to an invoice cannot be deleted.');
  if(q('SELECT * FROM expenses').some(expense=>expense.quotation_id===quotationId))throw new InputError('This quotation has a legacy linked expense and cannot be deleted.');
  run('DELETE FROM quotations WHERE id=?',quotationId);cleanupProject(quote.project_key);return {success:true};
}
function deleteInvoice(invoiceId){
  const invoice=one('SELECT * FROM invoices WHERE id=?',invoiceId);if(!invoice)throw new InputError('Invoice not found.');
  if(invoice.quotation_id)throw new InputError('An invoice converted from a quotation cannot be deleted.');
  if(one('SELECT id FROM payments WHERE invoice_id=? LIMIT 1',invoiceId))throw new InputError('This invoice has payment history and cannot be deleted.');
  if(q('SELECT * FROM expenses').some(expense=>expenseTouchesInvoice(expense,invoiceId)))throw new InputError('This invoice has a linked expense and cannot be deleted.');
  if(one('SELECT id FROM profit_shares WHERE period_start<=? AND period_end>=? LIMIT 1',invoice.invoice_date,invoice.invoice_date))throw new InputError('A profit-share report includes this date, so the invoice cannot be deleted.');
  for(const item of q("SELECT product_id,quantity FROM invoice_items WHERE invoice_id=? AND item_type='product'",invoiceId))adjustStock(item.product_id,Number(item.quantity),'Invoice deleted',`Restored stock from ${invoice.number}`,invoice.invoice_date);
  run('DELETE FROM invoices WHERE id=?',invoiceId);cleanupProject(invoice.project_key);return {success:true};
}
function deletePurchase(purchaseId){
  const purchase=one('SELECT * FROM purchases WHERE id=?',purchaseId);if(!purchase)throw new InputError('Purchase not found.');
  if(one('SELECT id FROM supplier_payments WHERE purchase_id=? LIMIT 1',purchaseId))throw new InputError('This purchase has supplier payment history and cannot be deleted.');
  const lines=q('SELECT product_id,quantity,unit_cost FROM purchase_items WHERE purchase_id=?',purchaseId);
  for(const line of lines){
    const product=one('SELECT * FROM products WHERE id=?',line.product_id);if(!product)throw new InputError('A product on this purchase no longer exists.');
    const later=one("SELECT id FROM stock_movements WHERE product_id=? AND (created_at>? OR (created_at=? AND (reference<>? OR movement_type<>'Purchase'))) LIMIT 1",line.product_id,purchase.created_at,purchase.created_at,purchase.number);
    if(later)throw new InputError(`Stock for ${product.name} has changed since this purchase, so it cannot be safely reversed.`);
  }
  const grouped=new Map();for(const line of lines){const old=grouped.get(line.product_id)||{quantity:0,cost:0};old.quantity+=Number(line.quantity);old.cost+=Number(line.quantity)*Number(line.unit_cost);grouped.set(line.product_id,old);}
  for(const [productId,removed] of grouped){
    const product=one('SELECT * FROM products WHERE id=?',productId),priorQuantity=Number(product.quantity)-removed.quantity;
    if(priorQuantity<0)throw new InputError(`The stock for ${product.name} is below this purchase quantity and cannot be reversed.`);
    const priorCost=priorQuantity>0?Math.max(0,(Number(product.quantity)*Number(product.purchase_price)-removed.cost)/priorQuantity):0;
    const stamp=now();run('UPDATE products SET quantity=?,purchase_price=?,updated_at=? WHERE id=?',priorQuantity,Math.round(priorCost*10000)/10000,stamp,productId);
    run('INSERT INTO stock_movements VALUES (?,?,?,?,?,?,?,?,?)',id(),productId,'Purchase reversal',-removed.quantity,removed.quantity?removed.cost/removed.quantity:0,purchase.number,'Reversed purchase; original stock movement retained',today(),stamp);
  }
  run('DELETE FROM purchases WHERE id=?',purchaseId);return {success:true};
}
function deletePayment(paymentId,supplier=false){
  if(supplier){const payment=one('SELECT * FROM supplier_payments WHERE id=?',paymentId);if(!payment)throw new InputError('Supplier payment not found.');run('DELETE FROM supplier_payments WHERE id=?',paymentId);if(payment.purchase_id)refreshPurchase(payment.purchase_id);return {success:true};}
  const payment=one('SELECT * FROM payments WHERE id=?',paymentId);if(!payment)throw new InputError('Payment not found.');run('DELETE FROM payments WHERE id=?',paymentId);refreshInvoice(payment.invoice_id);return {success:true};
}
function deletePartner(partnerId){
  if(!one('SELECT id FROM partners WHERE id=?',partnerId))throw new InputError('Partner not found.');
  if(one('SELECT id FROM profit_shares WHERE partner_id=? LIMIT 1',partnerId))throw new InputError('This partner has saved profit-share records and cannot be deleted.');
  run('DELETE FROM partners WHERE id=?',partnerId);return {success:true};
}

function api(method, url, body) {
  const p=url.pathname;
  if (method==='GET'&&p==='/api/bootstrap') return bootstrap();
  if (method==='GET'&&p==='/api/backup/status') return backupStatus();
  if (method==='POST'&&p==='/api/companies') throw new InputError('Create another business from Administrator Control Panel. Each business receives its own database.');
  if (method==='PUT'&&p.startsWith('/api/companies/')&&p.endsWith('/default')) return setDefaultCompany(p.split('/')[3]);
  if (method==='PUT'&&p.startsWith('/api/companies/')) {
    const internalId=p.split('/').pop();if(internalId!=='company-default')throw new InputError('Company settings are separate for each business.');
    const previous=one('SELECT * FROM companies WHERE id=?',internalId);if(!previous)throw new InputError('Company profile not found.');const tenant=currentTenant(),before=normalizedBankDetails(previous),after=normalizedBankDetails(body),bankChanged=JSON.stringify(before)!==JSON.stringify(after);
    if(bankChanged){
      if(!tenant?.actor||!tenant.company?.id)throw Object.assign(new InputError('Sign in again before changing bank details.'),{status:401});
      const identity=accessControl.scalar('SELECT email,email_verified FROM users WHERE id=?',tenant.actor.userId);if(!identity?.email_verified||!validEmail(identity.email))throw new InputError('Verify your account recovery email before changing bank details.');
      const subject=bankChangeSubject(tenant.actor,tenant.company.id,after);accessControl.verifyEmailOtp(subject,'bank-change',identity.email,String(body.bankOtp||''));accessControl.run('DELETE FROM auth_email_otps WHERE subject=? AND purpose=?',subject,'bank-change');accessControl.auditRow(tenant.actor,tenant.company.id,'company.bank_details_changed');
    }
    const saved=saveCompany(body,internalId),c=saved;if(tenant){const profile={name:c.name,address:c.address,logoData:c.logo_data,bankName:c.bank_name,bankBranch:c.bank_branch,bankAccountNumber:c.bank_account_number,accountHolder:c.account_holder,contactNumbers:c.contact_numbers,email:c.email,website:c.website,taxNumber:c.tax_number,additionalInfo:c.additional_info,termsConditions:c.terms_conditions,documentColor:c.document_color,receiverKey:c.receiver_key,currency:one('SELECT currency FROM settings WHERE id=1')?.currency||'LKR',locale:one('SELECT locale FROM settings WHERE id=1')?.locale||'en-LK'};accessControl.updateProfile(tenant.actor,tenant.company.id,profile);tenant.company.name=c.name;tenant.company.profile=profile;}return saved;
  }
  if (method==='DELETE'&&p.startsWith('/api/companies/')) {
    throw new InputError('Use Administrator Control Panel to deactivate a business. Business data is retained for audit and backup.');
  }
  if(method==='PUT'&&p.startsWith('/api/projects/')&&p.endsWith('/company-share'))return setProjectCompanyShare(decodeURIComponent(p.split('/')[3]||''),body.companySharePercent);
  if (method==='POST'&&p==='/api/customers') return updateCatalog('customers',body);
  if (method==='PUT'&&p.startsWith('/api/customers/')) return updateCatalog('customers',body,p.split('/').pop());
  if (method==='DELETE'&&p.startsWith('/api/customers/')) return inTransaction(()=>deleteCustomer(p.split('/').pop()));
  if (method==='POST'&&p==='/api/suppliers') return updateCatalog('suppliers',body);
  if (method==='PUT'&&p.startsWith('/api/suppliers/')) return updateCatalog('suppliers',body,p.split('/').pop());
  if (method==='DELETE'&&p.startsWith('/api/suppliers/')) return inTransaction(()=>deleteSupplier(p.split('/').pop()));
  if (method==='POST'&&p==='/api/products') return updateCatalog('products',body);
  if (method==='PUT'&&p.startsWith('/api/products/')) return inTransaction(()=>updateCatalog('products',body,p.split('/').pop()));
  if (method==='DELETE'&&p.startsWith('/api/products/')) return inTransaction(()=>deleteProduct(p.split('/').pop()));
  if (method==='POST'&&p==='/api/properties') return inTransaction(()=>visibleProperty(updateCatalog('company_properties',body)));
  if (method==='PUT'&&p.startsWith('/api/properties/')) return inTransaction(()=>visibleProperty(updateCatalog('company_properties',body,p.split('/').pop())));
  if (method==='DELETE'&&p.startsWith('/api/properties/')) return inTransaction(()=>deleteProperty(p.split('/').pop()));
  if (method==='GET'&&p==='/api/resource-usage') {const actor=currentTenant()?.actor;return actor?.role==='salesperson'?q('SELECT * FROM resource_usage WHERE project_key IN (SELECT project_key FROM invoices WHERE created_by=? UNION SELECT project_key FROM quotations WHERE created_by=?) ORDER BY usage_date DESC,created_at DESC',actor.userId,actor.userId):q('SELECT * FROM resource_usage ORDER BY usage_date DESC,created_at DESC');}
  if (method==='POST'&&p==='/api/resource-usage') return inTransaction(()=>saveResourceUsage(body));
  if (method==='PUT'&&p.startsWith('/api/resource-usage/')) return inTransaction(()=>saveResourceUsage(body,p.split('/').pop()));
  if (method==='DELETE'&&p.startsWith('/api/resource-usage/')) return inTransaction(()=>deleteResourceUsage(p.split('/').pop()));
  if (method==='POST'&&p==='/api/services') return updateCatalog('services',body);
  if (method==='PUT'&&p.startsWith('/api/services/')) return updateCatalog('services',body,p.split('/').pop());
  if (method==='DELETE'&&p.startsWith('/api/services/')) return inTransaction(()=>deleteService(p.split('/').pop()));
  if (method==='POST'&&p==='/api/invoices') return inTransaction(()=>createInvoice(body));
  if (method==='PUT'&&p.startsWith('/api/invoices/')) return inTransaction(()=>updateInvoice(body,p.split('/').pop()));
  if (method==='DELETE'&&p.startsWith('/api/invoices/')) return inTransaction(()=>deleteInvoice(p.split('/').pop()));
  if (method==='POST'&&p==='/api/quotations') return inTransaction(()=>saveQuote(body));
  if (method==='PUT'&&p.startsWith('/api/quotations/')) return inTransaction(()=>saveQuote(body,p.split('/').pop()));
  if (method==='DELETE'&&p.startsWith('/api/quotations/')) return inTransaction(()=>deleteQuote(p.split('/').pop()));
  if (method==='POST'&&p.startsWith('/api/quotations/')&&p.endsWith('/convert')) return inTransaction(()=>{
    const quoteId=p.split('/')[3],quote=one('SELECT * FROM quotations WHERE id=?',quoteId); if(!quote) throw new InputError('Quotation not found.'); if(quote.invoice_id) throw new InputError('This quotation has already been converted.');
    const items=q('SELECT product_id AS productId,item_type AS itemType,service_id AS serviceId,service_title AS serviceTitle,service_description AS serviceDescription,item_code AS itemCode,description AS productDescription,quantity,unit_price AS unitPrice,unit_cost AS unitCost,discount_percent AS discountPercent FROM quotation_items WHERE quotation_id=?',quoteId);
    const invoice=createInvoice({customerId:quote.customer_id,companyId:quote.company_id,projectKey:quote.project_key,invoiceDate:body.invoiceDate||today(),notes:quote.notes,terms:body.terms??quote.terms,discountPercent:quote.discount_rate,taxRate:quote.tax_rate,paidAmount:body.paidAmount??0,paymentMethod:body.paymentMethod,items},quoteId,quote.project_key);
    run("UPDATE quotations SET status='accepted',invoice_id=?,updated_at=? WHERE id=?",invoice.id,now(),quoteId); return invoice;
  });
  if (method==='POST'&&p==='/api/purchases') return inTransaction(()=>createPurchase(body));
  if (method==='DELETE'&&p.startsWith('/api/purchases/')) return inTransaction(()=>deletePurchase(p.split('/').pop()));
  if (method==='POST'&&p==='/api/expenses') return inTransaction(()=>createExpense(body));
  if (method==='PUT'&&p.startsWith('/api/expenses/')) return inTransaction(()=>createExpense(body,p.split('/').pop()));
  if (method==='DELETE'&&p.startsWith('/api/expenses/')) return inTransaction(()=>deleteExpense(p.split('/').pop()));
  if (method==='DELETE'&&p.startsWith('/api/expense-attachments/')) return inTransaction(()=>deleteExpenseAttachment(p.split('/').pop()));
  if (method==='POST'&&p==='/api/expense-categories') return inTransaction(()=>saveExpenseCategory(body));
  if (method==='PUT'&&p.startsWith('/api/expense-categories/')) return inTransaction(()=>saveExpenseCategory(body,p.split('/').pop()));
  if (method==='DELETE'&&p.startsWith('/api/expense-categories/')) {const categoryId=p.split('/').pop(),category=one('SELECT * FROM expense_categories WHERE id=?',categoryId);if(!category)throw new InputError('Expense category not found.');if(one('SELECT id FROM expenses WHERE category=?',category.name))throw new InputError('This category is used by expenses and cannot be deleted.');run('DELETE FROM expense_categories WHERE id=?',categoryId);return {success:true};}
  if (method==='POST'&&p==='/api/payments') return createPayment(body,false);
  if (method==='POST'&&p==='/api/supplier-payments') return createPayment(body,true);
  if (method==='DELETE'&&p.startsWith('/api/payments/')) return inTransaction(()=>deletePayment(p.split('/').pop(),false));
  if (method==='DELETE'&&p.startsWith('/api/supplier-payments/')) return inTransaction(()=>deletePayment(p.split('/').pop(),true));
  if (method==='POST'&&p==='/api/stock-adjustments') return inTransaction(()=>{const delta=quantity(body.quantity)*(body.direction==='out'?-1:1);adjustStock(required(body.productId,'Product'),delta,body.direction==='out'?'Stock out':'Stock in',required(body.notes,'Reason'),body.date||today());return {success:true};});
  if (method==='POST'&&p==='/api/partners') { const name=required(body.name,'Partner name'),pct=amount(body.sharePercent,'Share percentage'); if(pct>100)throw new InputError('Share percentage cannot exceed 100.'); const partnerId=id(),stamp=now();run('INSERT INTO partners VALUES (?,?,?,?,?,?)',partnerId,name,pct,String(body.email||''),stamp,stamp);return one('SELECT * FROM partners WHERE id=?',partnerId); }
  if (method==='PUT'&&p.startsWith('/api/partners/')) {const partnerId=p.split('/').pop(),name=required(body.name,'Partner name'),pct=amount(body.sharePercent,'Share percentage');if(pct>100)throw new InputError('Share percentage cannot exceed 100.');if(!one('SELECT id FROM partners WHERE id=?',partnerId))throw new InputError('Partner not found.');run('UPDATE partners SET name=?,share_percent=?,email=?,updated_at=? WHERE id=?',name,pct,String(body.email||''),now(),partnerId);return one('SELECT * FROM partners WHERE id=?',partnerId);}
  if (method==='DELETE'&&p.startsWith('/api/partners/')) return inTransaction(()=>deletePartner(p.split('/').pop()));
  if (method==='POST'&&p==='/api/profit-shares/generate') return createProfitShares(body);
  if (method==='PUT'&&p==='/api/settings') {run('UPDATE settings SET currency=?,locale=?,updated_at=? WHERE id=1',required(body.currency,'Currency'),String(body.locale||'en-LK'),now());return one('SELECT * FROM settings WHERE id=1');}
  return { error: 'Not found' };
}

const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
async function readRequestBytes(req,limit){
  const chunks=[];let length=0;
  for await(const chunk of req){length+=chunk.length;if(length<=limit)chunks.push(chunk);}
  if(length>limit)throw new InputError('The request is too large. The maximum size is '+(limit/1024/1024)+' MB.');
  return server_Buffer.concat(chunks,length);
}
function restoreWorkbook(buffer){
  const schema=backupSchema();
  let parsed;
  try{parsed=parseBackupWorkbook(buffer,schema,{appVersion:'2.0.1',companyId:currentTenant()?.company?.id||'legacy',companyName:currentTenant()?.company?.name||'Company'});}catch(error){throw new InputError(error.message||'The Excel backup could not be validated.');}
  const companyRows=parsed.tables.companies||[];
  if(companyRows.length!==1||companyRows[0].id!=='company-default'||!companyRows[0].is_default)throw new InputError('This backup must contain only the currently selected company.');
  const before=createCurrentWorkbook();
  archiveCurrentBackup(before);
  try{
    inTransaction(()=>{
      db.exec('PRAGMA defer_foreign_keys=ON');
      for(const table of [...BACKUP_TABLES].reverse())db.exec('DELETE FROM \"'+table+'\"');
      for(const table of schema){
        const columns=table.columns.map(column=>'\"'+column.name+'\"'),placeholders=table.columns.map(()=>'?').join(',');
        const statement=db.prepare('INSERT INTO \"'+table.name+'\" ('+columns.join(',')+') VALUES ('+placeholders+')');
        for(const row of parsed.tables[table.name])statement.run(...table.columns.map(column=>row[column.name]));
      }
      const broken=q('PRAGMA foreign_key_check');
      if(broken.length)throw new Error('The workbook contains references to records that do not exist.');
    });
  }catch(error){if(error instanceof InputError)throw error;throw new InputError('The workbook is valid Excel but its records cannot be restored: '+error.message);}
  const counts=Object.fromEntries(BACKUP_TABLES.map(table=>[table,parsed.tables[table].length]));
  try{writeAutomaticBackup();}catch(error){throw new InputError('Records were restored, but the automatic Excel backup could not be updated. '+error.message);}
  return {success:true,restoredAt:now(),counts,backup:backupStatus()};
}
const tenantDatabases=new Map();
function databaseForCompany(company,{migrateLegacy=false}={}){
  if(tenantDatabases.has(company.id))return tenantDatabases.get(company.id);
  mkdirSync(runtime_path.dirname(company.dataPath),{recursive:true});
  if(!existsSync(company.dataPath)&&migrateLegacy&&hadLegacyDatabase){try{legacyDb.exec('PRAGMA wal_checkpoint(FULL)');legacyDb.exec('VACUUM INTO \''+company.dataPath.replaceAll("'","''")+'\'');}catch(error){throw new Error('The existing business records could not be copied safely. No old data was changed. '+error.message)}}
  const target=new DatabaseSync(company.dataPath);target.exec(readFileSync(runtime_path.join(ROOT,'database','schema.sql'),'utf8'));target.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  databaseContext.run({db:target,company,actor:null},()=>{
    migrateCompanyProfiles();
    for(const [table,column,definition] of [['invoices','created_by',"TEXT NOT NULL DEFAULT ''"],['quotations','created_by',"TEXT NOT NULL DEFAULT ''"],['expenses','created_by',"TEXT NOT NULL DEFAULT ''"],['purchases','created_by',"TEXT NOT NULL DEFAULT ''"]])addColumnIfMissing(table,column,definition);
    const p=company.profile||{},stamp=now();if(!one('SELECT id FROM companies WHERE id=?','company-default'))throw new Error('This company database has no company profile.');
    run('UPDATE companies SET name=?,address=?,logo_data=?,bank_name=?,bank_branch=?,bank_account_number=?,account_holder=?,contact_numbers=?,email=?,website=?,tax_number=?,additional_info=?,terms_conditions=?,document_color=?,receiver_key=?,is_default=1,updated_at=? WHERE id=?',company.name,String(p.address||''),String(p.logoData||''),String(p.bankName||''),String(p.bankBranch||''),String(p.bankAccountNumber||''),String(p.accountHolder||''),String(p.contactNumbers||''),String(p.email||''),String(p.website||''),String(p.taxNumber||''),String(p.additionalInfo||''),String(p.termsConditions||''),String(p.documentColor||'#1f5fae'),String(p.receiverKey??''),stamp,'company-default');
    run('UPDATE settings SET company_name=?,currency=?,locale=?,email=?,phone=?,address=?,tax_number=?,updated_at=? WHERE id=1',company.name,String(p.currency||'LKR'),String(p.locale||'en-LK'),String(p.email||''),String(p.contactNumbers||''),String(p.address||''),String(p.taxNumber||''),stamp);
    run("INSERT OR REPLACE INTO app_metadata(key,value) VALUES ('tenant_id',?)",company.id);
    if(one("SELECT value FROM app_metadata WHERE key='tenant_id'")?.value!==company.id)throw new Error('This database belongs to another company.');
  });tenantDatabases.set(company.id,target);return target;
}
function requiredScope(method,pathname,body={}){
  if(pathname==='/api/bootstrap')return {scope:'dashboard',action:'view'};if(pathname==='/api/backup/status'||pathname==='/api/backup/history')return {scope:'backup',action:'view'};if(pathname==='/api/backup/download')return {scope:'backup',action:'export'};if(pathname==='/api/backup.xlsx'||pathname==='/api/restore'||pathname==='/api/backup/restore-upload')return {scope:'backup',action:'restore'};if(pathname==='/api/backup/restore-history')return {scope:'backup',action:'restore'};if(pathname==='/api/backup/create')return {scope:'backup',action:'create'};if(pathname.startsWith('/api/expense-attachments/'))return {scope:'expenses',action:method==='DELETE'?'delete':'view'};
   const entries=[['customers','customers'],['suppliers','suppliers'],['products','products'],['properties','company_properties'],['resource-usage','company_properties'],['services','services'],['invoices','invoices'],['quotations','quotations'],['projects','profit'],['purchases','purchases'],['payments','payments'],['supplier-payments','payments'],['expenses','expenses'],['expense-categories','expenses'],['stock-adjustments','inventory'],['partners','partners'],['profit-shares','profit'],['warranty-claims','warranty_claims'],['repair-intakes','warranty_claims'],['companies','companies'],['settings','companies']],match=entries.find(([prefix])=>pathname.startsWith('/api/'+prefix));if(!match)return null;let scope=match[1],action=method==='GET'?'view':method==='POST'?'create':method==='PUT'?'edit':method==='DELETE'?'delete':'view';if(pathname==='/api/stock-adjustments')action='adjust';if(scope==='quotations'&&body.documentType==='estimate')scope='estimates';return {scope,action};
}
function filterBootstrap(snapshot,access,actor){
  const visible={...snapshot},scopes={customers:'customers',suppliers:'suppliers',products:'products',company_properties:'company_properties',resource_usage:'company_properties',services:'services',invoices:'invoices',invoice_items:'invoices',payments:'payments',quotations:'quotations',quotation_items:'quotations',purchases:'purchases',purchase_items:'purchases',supplier_payments:'payments',expenses:'expenses',expense_categories:'expenses',expense_attachments:'expenses',expense_allocations:'expenses',expense_invoices:'expenses',projects:'quotations',project_profit_settings:'profit',stock_movements:'inventory',partners:'partners',profit_shares:'profit',warranty_claims:'warranty_claims',warranty_claim_events:'warranty_claims',repair_intakes:'warranty_claims',companies:'companies',settings:'companies'};
  for(const [table,scope]of Object.entries(scopes))if(!access.can(actor,scope,'view'))visible[table]=[];
  const membership=access.status(actor).permissions;if(actor.role==='salesperson'){const own=snapshot.invoices.filter(row=>row.created_by===actor.userId),ids=new Set(own.map(row=>row.id));visible.invoices=own;visible.invoice_items=snapshot.invoice_items.filter(row=>ids.has(row.invoice_id));visible.payments=snapshot.payments.filter(row=>ids.has(row.invoice_id));const quotes=snapshot.quotations.filter(row=>row.created_by===actor.userId),qids=new Set(quotes.map(row=>row.id));visible.quotations=quotes;visible.quotation_items=snapshot.quotation_items.filter(row=>qids.has(row.quotation_id));const projectKeys=new Set([...own,...quotes].map(row=>row.project_key));visible.projects=snapshot.projects.filter(row=>projectKeys.has(row.project_key));visible.resource_usage=snapshot.resource_usage.filter(row=>projectKeys.has(row.project_key));}
  if(!membership.profit?.view){visible.products=visible.products.map(({purchase_price,...x})=>x);visible.services=visible.services.map(({unit_cost,...x})=>x);visible.invoice_items=visible.invoice_items.map(({unit_cost,...x})=>x);visible.quotation_items=visible.quotation_items.map(({unit_cost,...x})=>x);visible.purchase_items=visible.purchase_items.map(({unit_cost,...x})=>x);}
  // Resource users need only site names and keys for recording tool use.
  const allowedSites=actor.role==='salesperson'?visible.projects:snapshot.projects;
  if(!access.can(actor,'company_properties','view'))visible.resource_usage=[];
  visible.resource_sites=access.can(actor,'company_properties','view')?allowedSites.map(({project_key,title})=>({project_key,title})):[];
  if(!membership.profit?.view)visible.company_properties=visible.company_properties.map(({purchase_cost,...item})=>item);
  visible.companies=visible.companies.slice(0,1);return visible;
}
const accessControl=new AccessControl({registryPath:runtime_path.join(DATA_DIR,'access.sqlite'),dataRoot:runtime_path.join(DATA_DIR,'companies'),legacyProfile:()=>{if(!hadLegacyDatabase)return null;const c=one('SELECT * FROM companies WHERE is_default=1 LIMIT 1');if(!c||c.name==='Meridian Supply Co.'&&!c.email&&!c.address&&!c.logo_data)return null;return {name:c.name,address:c.address,logoData:c.logo_data,bankName:c.bank_name,bankBranch:c.bank_branch,bankAccountNumber:c.bank_account_number,accountHolder:c.account_holder,contactNumbers:c.contact_numbers,email:c.email,website:c.website,taxNumber:c.tax_number,additionalInfo:c.additional_info,termsConditions:c.terms_conditions,documentColor:c.document_color||'#1f5fae',receiverKey:c.receiver_key||'',currency:one('SELECT currency FROM settings WHERE id=1')?.currency||'LKR',locale:one('SELECT locale FROM settings WHERE id=1')?.locale||'en-LK'}},onCompanyCreate:(company,{isInitial=false}={})=>{const connection=databaseForCompany(company,{migrateLegacy:isInitial});databaseContext.run({db:connection,company,actor:null},()=>writeAutomaticBackup())},onCompanyUpdate:company=>{const cfg=accessControl.companyConfig(company.id);if(cfg){const connection=databaseForCompany(cfg);databaseContext.run({db:connection,company:cfg,actor:null},()=>saveCompany(cfg.profile,'company-default'));}}});
const platformAdmin=typeof globalThis.INVOICEY_CREATE_PLATFORM_ADMIN==='function'?globalThis.INVOICEY_CREATE_PLATFORM_ADMIN({access:accessControl,closeTenant:companyId=>{
  const timer=automaticBackupTimers.get(companyId);if(timer)clearTimeout(timer);automaticBackupTimers.delete(companyId);
  const connection=tenantDatabases.get(companyId);if(connection){connection.close();tenantDatabases.delete(companyId);}
}}):null;
const hostedCorsOrigins=String(process.env.INVOICEY_CORS_ORIGIN||'').split(',').map(value=>value.trim()).filter(Boolean);
const applyHostedCors=(req,res)=>{
  if(process.env.INVOICEY_HOSTED!=='1')return false;
  const origin=String(req.headers?.origin||'');
  const allowed=origin&&hostedCorsOrigins.includes(origin)?origin:'';
  if(allowed){res.setHeader('access-control-allow-origin',allowed);res.setHeader('access-control-allow-credentials','true');res.setHeader('access-control-allow-methods','GET,POST,PUT,DELETE,OPTIONS');res.setHeader('access-control-allow-headers','content-type, x-backup-filename');res.setHeader('access-control-expose-headers','content-disposition');res.setHeader('vary','Origin');}
  return Boolean(allowed);
};
const server=http.createServer(async(req,res)=>{
  let url;
  try{url=new URL(req.url,'http://127.0.0.1');decodeURIComponent(url.pathname)}catch{res.writeHead(400,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end('Invalid request URL.');return;}
  if(globalThis.INVOICEY_HTTP_GUARD?.(req,res,url))return;
  const corsAllowed=applyHostedCors(req,res);
  if(process.env.INVOICEY_HOSTED==='1'&&req.method==='OPTIONS'&&url.pathname.startsWith('/api/')){res.writeHead(corsAllowed?204:403);res.end();return;}
  if (url.pathname.startsWith('/api/')) {
    try {
      let body={}; if(req.method==='POST'&&url.pathname==='/api/backup/restore-upload'){body=await readRequestBytes(req,128*1024*1024);} else if (['POST','PUT','DELETE'].includes(req.method)&&url.pathname!=='/api/restore') { const request=await readRequestBytes(req,32*1024*1024);if(request.length){try{body=JSON.parse(request.toString('utf8'));}catch{throw new InputError('Request body must be valid JSON.');}} }
      const authResult=await accessControl.handleApi(req,url,body);
      if(authResult){if(authResult.cookie)res.setHeader('set-cookie',authResult.cookie);res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(authResult.body));return;}
      const actor=accessControl.authenticate(req);
      if(!actor)throw Object.assign(new Error('Sign in to continue.'),{status:401});
      if(actor.isSuper)throw Object.assign(new Error('Platform administration cannot access private company records, documents or backups.'),{status:403});
      const company=actor.activeCompanyId?accessControl.companyConfig(actor.activeCompanyId):null;
      if(!company)throw Object.assign(new Error('Select an active company before continuing.'),{status:403});
      const scope=requiredScope(req.method,url.pathname,body);
      if(scope&&!accessControl.can(actor,scope.scope,scope.action)){const canOpenAny=url.pathname==='/api/bootstrap'&&['dashboard','customers','suppliers','products','company_properties','services','inventory','quotations','estimates','invoices','purchases','payments','expenses','reports'].some(s=>accessControl.can(actor,s,'view'));if(!canOpenAny)throw Object.assign(new Error('Your account does not have permission to do that.'),{status:403});}
      if(req.method==='DELETE'&&!accessControl.can(actor,'records','delete'))throw Object.assign(new Error('Permanent deletion is restricted to administrators and is recorded.'),{status:403});
      if(['POST','PUT','DELETE'].includes(req.method)&&(/^\/api\/companies(?:\/|$)/.test(url.pathname)||url.pathname==='/api/settings'))accessControl.requireCompanyAdmin(actor,company.id);
      const tenantDb=databaseForCompany(company);
      return await databaseContext.run({db:tenantDb,company,actor},async()=>{
      if(actor.role==='salesperson'){
        const match=url.pathname.match(/^\/api\/(invoices|quotations)\/([^/]+)(?:\/convert)?$/);
        if(match){const record=one('SELECT created_by FROM '+match[1]+' WHERE id=?',match[2]);if(record&&record.created_by!==actor.userId)throw Object.assign(new Error('You can only access documents created by your own account.'),{status:403});}
        if(url.pathname==='/api/quotations'||url.pathname==='/api/invoices'){const linked=body.quotationId||body.invoiceId;if(linked){const record=one('SELECT created_by FROM '+(body.quotationId?'quotations':'invoices')+' WHERE id=?',linked);if(record&&record.created_by!==actor.userId)throw Object.assign(new Error('You can only access documents created by your own account.'),{status:403});}}
        if(req.method==='POST'&&url.pathname==='/api/invoices'&&body.projectKey&&one('SELECT id FROM projects WHERE project_key=?',String(body.projectKey))){const owned=one('SELECT id FROM invoices WHERE project_key=? AND created_by=? UNION ALL SELECT id FROM quotations WHERE project_key=? AND created_by=? LIMIT 1',String(body.projectKey),actor.userId,String(body.projectKey),actor.userId);if(!owned)throw Object.assign(new Error('You can only link documents to your own projects.'),{status:403});}
      }
      if((req.method==='GET'&&url.pathname==='/api/backup.xlsx')||(req.method==='POST'&&url.pathname==='/api/restore'))throw Object.assign(new Error('Excel backup and restore have been removed. Use the private account backup in Company Settings.'),{status:410});
      if(req.method==='GET'&&url.pathname==='/api/backup/download'){
        const file=writeAutomaticBackup(),bytes=readFileSync(file),name=tenantBackupName();
        res.writeHead(200,{'content-type':'application/octet-stream','content-length':bytes.length,'content-disposition':'attachment; filename="'+name+'"','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(bytes);return;
      }
      if(req.method==='GET'&&url.pathname==='/api/backup/status'){
        const result={...backupStatus(),companyId:company.id,companyName:company.name};res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(result));return;
      }
      if(req.method==='GET'&&url.pathname==='/api/backup/history'){
        const archiveDir=tenantArchivePath(),items=readdirSync(archiveDir).filter(name=>name.toLowerCase().endsWith('.invoicey-backup')).map(name=>{const s=statSync(runtime_path.join(archiveDir,name));return {fileName:name,updatedAt:s.mtime.toISOString(),kind:name.startsWith('before-restore')?'Recovery':name.startsWith('manual')?'Manual':'Automatic'}}).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,30);res.writeHead(200,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(items));return;
      }
      if(req.method==='POST'&&url.pathname==='/api/backup/create'){
        const current=writeAutomaticBackup(),file=retainBackup(current,'manual');accessControl.auditRow(actor,company.id,'backup.created',runtime_path.basename(file));const result={success:true,fileName:runtime_path.basename(file),backup:backupStatus(),format:'private-company-sqlite'};res.writeHead(200,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(result));return;
      }
      if(req.method==='POST'&&url.pathname==='/api/backup/restore-upload'){
        const originalName=String(req.headers['x-backup-filename']||'').trim();
        if(!originalName||runtime_path.basename(originalName)!==originalName||!/^.{1,180}\.invoicey(?:-backup)?$/i.test(originalName))throw new InputError('Choose a valid itsme invoicey account backup file.');
        if(!body?.length)throw new InputError('The selected backup file is empty.');
        const uploadPath=runtime_path.join(tenantArchivePath(),'.uploaded-'+randomUUID()+'.invoicey');
        mkdirSync(tenantArchivePath(),{recursive:true});
        writeFileSync(uploadPath,body,{flag:'wx'});
        try{
          archiveCurrentBackup();
          const result=restoreCompanySnapshot(uploadPath);
          accessControl.auditRow(actor,company.id,'backup.restored_from_device',originalName);
          res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(result));
        } finally {try{unlinkSync(uploadPath);}catch{}}
        return;
      }
      if(req.method==='POST'&&url.pathname==='/api/backup/restore-history'){
        const name=String(body.fileName||'');if(!name||runtime_path.basename(name)!==name||!name.toLowerCase().endsWith('.invoicey-backup'))throw new InputError('Choose a valid private account backup from this company’s history.');const archive=runtime_path.join(tenantArchivePath(),name);if(!existsSync(archive))throw new InputError('That company backup was not found.');archiveCurrentBackup();const result=restoreCompanySnapshot(archive);accessControl.auditRow(actor,company.id,'backup.restored',name);res.writeHead(200,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(result));return;
      }
      if(req.method==='GET'&&url.pathname.startsWith('/api/expense-attachments/')){const attachment=one('SELECT * FROM expense_attachments WHERE id=?',url.pathname.split('/').pop());if(!attachment){res.writeHead(404);res.end('Not found');return;}const safeFile=attachment.file_name.replace(/[\r\n"\\]/g,'_');res.writeHead(200,{'content-type':attachment.mime_type,'content-length':attachment.size_bytes,'content-disposition':`${attachment.mime_type==='application/pdf'?'attachment':'inline'}; filename="${safeFile}"`,'x-content-type-options':'nosniff','cache-control':'no-store'});res.end(attachment.file_data);return;}
      const result=platformAdmin?platformAdmin.runDocumentMutation(company,req.method,url,()=>api(req.method,url,body)):api(req.method,url,body);
      if (result?.error) {res.writeHead(404,{'content-type':'application/json'});res.end(JSON.stringify(result));return;}
      const filtered=url.pathname==='/api/bootstrap'?filterBootstrap(result,accessControl,actor):result;
      if(['POST','PUT','DELETE'].includes(req.method)){
        const auditEntity=url.pathname.split('/')[2]||'record',auditAction=auditEntity+'.'+req.method.toLowerCase();
        if(req.method==='DELETE')try{archiveCurrentBackup()}catch{}
        accessControl.auditRow(actor,company.id,auditAction,(result&&typeof result==='object'?(result.number||result.name||result.id||''):'')+' '+auditAction);
        scheduleAutomaticBackup();
      }
      res.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(filtered));
      });
    } catch(error) {const status=error.status|| (error instanceof InputError?400:500);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify({error:status>=500?(error.publicMessage||'The server could not complete this request.'):error.message||'Something went wrong.'}));if(status>=500)console.error(error);}
    return;
  }
  const requested=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const file=runtime_path.resolve(ROOT,'public',`.${requested}`);
  if(!file.startsWith(runtime_path.resolve(ROOT,'public')+runtime_path.sep)&&file!==runtime_path.resolve(ROOT,'public','index.html')){res.writeHead(403);res.end('Forbidden');return;}
  if(existsSync(file)&&!statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
  const target=existsSync(file)?file:runtime_path.join(ROOT,'public','index.html');
  const extension=runtime_path.extname(target).toLowerCase(),cacheControl=extension==='.html'?'no-cache':'public, max-age=300, stale-while-revalidate=60';
  res.writeHead(200,{'content-type':mime[extension]||'application/octet-stream','cache-control':cacheControl});const stream=createReadStream(target);stream.on?.('error',()=>res.end());try{stream.pipe(res)}catch{res.end()}
});
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
server.listen(port,host,()=>console.log(`Ledgerly is running at http://${host}:${server.address().port}`));

// Proforma invoices build on the existing quotation ledger.  They are marked
// in app_metadata so existing databases keep their SQLite check constraints
// and backup format, while still gaining a durable document state, advance
// payments, expense links and conversion history.
const INVOICEY_PROFORMA_PREFIX='proforma:';
const INVOICEY_PROFORMA_PAYMENT_PREFIX='proforma-payment:';
const INVOICEY_EXPENSE_PROFORMA_PREFIX='expense-proformas:';
const invoiceyParseJson=(value,fallback)=>{try{return JSON.parse(String(value||''))}catch{return fallback}};
function invoiceyIsProforma(idOrRow){const idValue=typeof idOrRow==='object'?idOrRow?.id:idOrRow;return !!idValue&&!!one('SELECT key FROM app_metadata WHERE key=?',INVOICEY_PROFORMA_PREFIX+idValue);}
function invoiceyProformaPaymentRows(){
  return q('SELECT key,value FROM app_metadata WHERE key LIKE ?',INVOICEY_PROFORMA_PAYMENT_PREFIX+'%').map(row=>({id:row.key.slice(INVOICEY_PROFORMA_PAYMENT_PREFIX.length),...invoiceyParseJson(row.value,{})})).filter(row=>row.quotationId&&Number(row.amount)>0);
}
function invoiceyExpenseProformaIds(expenseId){const row=one('SELECT value FROM app_metadata WHERE key=?',INVOICEY_EXPENSE_PROFORMA_PREFIX+expenseId);const parsed=invoiceyParseJson(row?.value,[]);return Array.isArray(parsed)?[...new Set(parsed.map(value=>String(value||'').trim()).filter(Boolean))]:[];}
function invoiceySaveExpenseProformaIds(expenseId,ids){const values=[...new Set((Array.isArray(ids)?ids:[]).map(value=>String(value||'').trim()).filter(Boolean))];if(!values.length){run('DELETE FROM app_metadata WHERE key=?',INVOICEY_EXPENSE_PROFORMA_PREFIX+expenseId);return [];}for(const value of values){const quote=one('SELECT id FROM quotations WHERE id=?',value);if(!quote||!invoiceyIsProforma(value))throw new InputError('Select valid proforma invoices.');}run('INSERT OR REPLACE INTO app_metadata(key,value) VALUES (?,?)',INVOICEY_EXPENSE_PROFORMA_PREFIX+expenseId,JSON.stringify(values));return values;}
function invoiceyProformaLayout(){return invoiceyParseJson(one('SELECT value FROM app_metadata WHERE key=?','document-layout')?.value,{headerText:'',headerAlign:'left',footerText:'',showBank:true});}
function invoiceyMigrateProformaMetadata(){db.exec('CREATE INDEX IF NOT EXISTS idx_app_metadata_document_layout ON app_metadata(key)');}
const invoiceyBaseMigrateCompanyProfiles=migrateCompanyProfiles;
migrateCompanyProfiles=function(){invoiceyBaseMigrateCompanyProfiles();invoiceyMigrateProformaMetadata();};
invoiceyMigrateProformaMetadata();
const invoiceyBaseBootstrap=bootstrap;
bootstrap=function(){
  const snapshot=invoiceyBaseBootstrap();
  snapshot.quotations=snapshot.quotations.map(row=>invoiceyIsProforma(row.id)?{...row,document_kind:'proforma'}:row);
  snapshot.proforma_payments=invoiceyProformaPaymentRows();
  snapshot.expense_proformas=q('SELECT key,value FROM app_metadata WHERE key LIKE ?',INVOICEY_EXPENSE_PROFORMA_PREFIX+'%').map(row=>({expenseId:row.key.slice(INVOICEY_EXPENSE_PROFORMA_PREFIX.length),proformaIds:invoiceyParseJson(row.value,[])}));
  snapshot.document_layout=invoiceyProformaLayout();
  return snapshot;
};
const invoiceyBaseFilterBootstrap=filterBootstrap;
filterBootstrap=function(snapshot,access,actor){
  const visible=invoiceyBaseFilterBootstrap(snapshot,access,actor);
  if(!access.can(actor,'payments','view'))visible.proforma_payments=[];
  if(!access.can(actor,'expenses','view'))visible.expense_proformas=[];
  return visible;
};
const invoiceyBaseRequiredScope=requiredScope;
requiredScope=function(method,pathname,body={}){
  if(pathname.startsWith('/api/proforma-payments'))return {scope:'payments',action:method==='GET'?'view':method==='DELETE'?'delete':'create'};
  if(pathname==='/api/company-document-settings')return {scope:'companies',action:method==='GET'?'view':'edit'};
  return invoiceyBaseRequiredScope(method,pathname,body);
};
const invoiceyBaseApi=api;
api=function(method,url,body={}){
  const pathname=url.pathname;
  if(method==='PUT'&&pathname==='/api/company-document-settings'){
    const layout={headerText:String(body.headerText||'').slice(0,500),headerAlign:['left','center','right'].includes(String(body.headerAlign))?String(body.headerAlign):'left',footerText:String(body.footerText||'').slice(0,500),showBank:body.showBank!==false};
    run('INSERT OR REPLACE INTO app_metadata(key,value) VALUES (?,?)','document-layout',JSON.stringify(layout));return layout;
  }
  if(method==='POST'&&pathname==='/api/proforma-payments'){
    const quotationId=required(body.quotationId,'Proforma invoice'),quote=one('SELECT * FROM quotations WHERE id=?',quotationId);
    if(!quote||!invoiceyIsProforma(quote))throw new InputError('Select a valid proforma invoice.');
    if(quote.invoice_id)throw new InputError('This proforma invoice has already been converted to an invoice.');
    const value=amount(body.amount,'Advance payment',{zero:false}),paid=invoiceyProformaPaymentRows().filter(row=>row.quotationId===quotationId&&!row.invoiceId).reduce((sum,row)=>sum+Number(row.amount||0),0);
    if(paid+value>Number(quote.total)+0.005)throw new InputError('The advance payment cannot be greater than the proforma balance.');
    const payment={id:id(),quotationId,customerId:quote.customer_id,amount:value,method:String(body.method||'Cash'),reference:String(body.reference||''),paymentDate:String(body.paymentDate||today()),notes:String(body.notes||''),createdAt:now()};
    run('INSERT INTO app_metadata(key,value) VALUES (?,?)',INVOICEY_PROFORMA_PAYMENT_PREFIX+payment.id,JSON.stringify(payment));return payment;
  }
  if(method==='DELETE'&&pathname.startsWith('/api/proforma-payments/')){
    const paymentId=pathname.split('/').pop(),row=one('SELECT value FROM app_metadata WHERE key=?',INVOICEY_PROFORMA_PAYMENT_PREFIX+paymentId),payment=invoiceyParseJson(row?.value,null);
    if(!payment)throw new InputError('Proforma payment not found.');
    if(payment.invoiceId)throw new InputError('This advance payment was already applied to the final invoice.');
    run('DELETE FROM app_metadata WHERE key=?',INVOICEY_PROFORMA_PAYMENT_PREFIX+paymentId);return {success:true};
  }
  if((method==='POST'||method==='PUT')&&(pathname==='/api/quotations'||/^\/api\/quotations\/[^/]+$/.test(pathname))){
    const quoteId=method==='PUT'?pathname.split('/').pop():'';
    const previous=quoteId?one('SELECT * FROM quotations WHERE id=?',quoteId):null,requested=String(body.documentType||'')==='proforma'||String(body.documentKind||'')==='proforma';
    if(requested&&(!previous||!invoiceyIsProforma(previous.id)))throw new InputError('Create a quotation first, then use Convert to proforma invoice.');
    if(previous&&invoiceyIsProforma(previous.id)&&!requested)throw new InputError('A proforma invoice must remain a proforma invoice until it is converted.');
    const normalized={...body,documentType:requested?'quotation':body.documentType};
    const result=invoiceyBaseApi(method,url,normalized),savedId=result?.id||quoteId;
    if(requested||previous&&invoiceyIsProforma(previous.id))run('INSERT OR REPLACE INTO app_metadata(key,value) VALUES (?,?)',INVOICEY_PROFORMA_PREFIX+savedId,JSON.stringify({createdAt:now()}));
    return savedId?{...result,document_kind:invoiceyIsProforma(savedId)?'proforma':''}:result;
  }
  if((method==='POST'||method==='PUT')&&(pathname==='/api/expenses'||/^\/api\/expenses\/[^/]+$/.test(pathname))){
    const result=invoiceyBaseApi(method,url,body),ids=invoiceySaveExpenseProformaIds(result.id,body.proformaIds);
    if(ids.length===1){const quote=one('SELECT project_key FROM quotations WHERE id=?',ids[0]);if(quote?.project_key)run('UPDATE expenses SET project_key=? WHERE id=? AND length(project_key)=0',quote.project_key,result.id);}
    return {...result,proformaIds:ids};
  }
  if(method==='POST'&&/^\/api\/quotations\/[^/]+\/convert$/.test(pathname)){
    const quoteId=pathname.split('/')[3],quote=one('SELECT * FROM quotations WHERE id=?',quoteId);
    if(body.targetDocument==='proforma')return inTransaction(()=>{
      if(!quote)throw new InputError('Quotation not found.');
      if(quote.invoice_id)throw new InputError('This document already has a final invoice.');
      if(invoiceyIsProforma(quote.id))throw new InputError('This quotation is already a proforma invoice.');
      const advance=amount(body.paidAmount||0,'Advance payment');
      if(advance>Number(quote.total)+0.005)throw new InputError('The advance payment cannot exceed the document total.');
      run('INSERT INTO app_metadata(key,value) VALUES (?,?)',INVOICEY_PROFORMA_PREFIX+quoteId,JSON.stringify({createdAt:now(),sourceQuotationNumber:quote.number}));
      if(advance>0)api('POST',new URL('/api/proforma-payments',url),{quotationId:quoteId,amount:advance,method:body.paymentMethod||'Cash',paymentDate:body.invoiceDate||today(),reference:body.reference||''});
      return {...quote,document_kind:'proforma'};
    });
    if(quote&&invoiceyIsProforma(quote.id)){
      const result=invoiceyBaseApi(method,url,{...body,paidAmount:0});
      const advances=invoiceyProformaPaymentRows().filter(row=>row.quotationId===quoteId&&!row.invoiceId);
      for(const advance of advances){const paymentId=id();run('INSERT INTO payments VALUES (?,?,?,?,?,?,?,?,?)',paymentId,result.id,quote.customer_id,Number(advance.amount),advance.method||'Cash',advance.reference||'',advance.paymentDate||today(),advance.notes||'',now());run('UPDATE app_metadata SET value=? WHERE key=?',JSON.stringify({...advance,invoiceId:result.id,appliedAt:now()}),INVOICEY_PROFORMA_PAYMENT_PREFIX+advance.id);}
      for(const row of q('SELECT id FROM expenses')){const ids=invoiceyExpenseProformaIds(row.id);if(ids.includes(quoteId)){const invoiceIds=storedExpenseInvoices(one('SELECT * FROM expenses WHERE id=?',row.id));saveExpenseInvoices(row.id,[...new Set([...invoiceIds,result.id])]);}}
      refreshInvoice(result.id);return result;
    }
  }
  return invoiceyBaseApi(method,url,body);
};

// Loss coverage is a profit allocation ledger in the current tenant database.
// Existing business documents remain the source of revenue and expense facts.
const LC_KEY='finance-loss-coverage-v1';
const lcCents=value=>Math.round(Number(value)*100);
function lcRead(){const row=one('SELECT value FROM app_metadata WHERE key=?',LC_KEY);return row?JSON.parse(row.value):{losses:[],recoveries:[],confirmations:[],incomes:[],charges:{},policy:{enabled:false,mode:'percentage',value:0,source:'company'},audit:[]};}
function lcSave(ledger){run('INSERT OR REPLACE INTO app_metadata(key,value) VALUES (?,?)',LC_KEY,JSON.stringify(ledger));}
function lcMoney(value,label='Amount'){const number=Number(value);if(!Number.isFinite(number)||number<0||number>1e12)throw new InputError(label+' must be a valid non-negative amount.');return lcCents(number);}
function lcAdmin(){const tenant=currentTenant();accessControl.requireCompanyAdmin(tenant.actor,tenant.company.id);}
function lcAudit(ledger,action,reference){ledger.audit.push({id:id(),action,reference,actor:currentTenant()?.actor?.userId,at:now()});}
function lcProjectFacts(key,ledger){
  const project=one('SELECT * FROM projects WHERE project_key=?',key);if(!project)throw new InputError('Project not found.');
  const invoices=q('SELECT * FROM invoices WHERE project_key=? ORDER BY id',key);let revenue=0,cost=0,missing=0;const evidence=[];
  for(const invoice of invoices){const stats=profitInvoiceStats(invoice),paid=Number(one('SELECT COALESCE(SUM(amount),0) AS amount FROM payments WHERE invoice_id=?',invoice.id).amount);revenue+=lcCents(stats.sales);cost+=lcCents(stats.directCost);missing+=stats.missing;evidence.push({id:invoice.id,total:lcCents(invoice.total),revenue:lcCents(stats.sales),cost:lcCents(stats.directCost),missing:stats.missing,paid:lcCents(paid)});}
  let expenses=0;const expenseEvidence=[];
  for(const expense of q('SELECT * FROM expenses ORDER BY id')){const saved=storedExpenseAllocations(expense);let value=0;if(saved.length)value=saved.filter(row=>row.project_key===key).reduce((sum,row)=>sum+lcCents(row.amount),0);else{const keys=[...new Set([...storedExpenseInvoices(expense).map(invoiceId=>one('SELECT project_key FROM invoices WHERE id=?',invoiceId)?.project_key),...invoiceyExpenseProformaIds(expense.id).map(quoteId=>one('SELECT project_key FROM quotations WHERE id=?',quoteId)?.project_key)].filter(Boolean))];const index=keys.indexOf(key),total=lcCents(expense.amount);if(index>=0)value=Math.floor(total/keys.length)+(index<total%keys.length?1:0);}if(value){expenses+=value;expenseEvidence.push({id:expense.id,amount:value});}}
  const profit=revenue-cost-expenses,config=ledger.charges[key]||{mode:'percentage',value:projectCompanyShare(key)},positive=Math.max(0,profit),company=Math.min(positive,config.mode==='fixed'?lcCents(config.value):Math.round(positive*Number(config.value)/100));
  return {kind:'project',key,title:project.title||key,invoices:evidence,revenue,cost,expenses,profit,company,distributable:positive-company,missing,fullyPaid:invoices.length>0&&evidence.every(row=>row.paid>=row.total),signature:JSON.stringify({invoices:evidence.map(({paid,...rest})=>rest),expenseEvidence,config})};
}
function lcFacts(kind,key,ledger){if(kind==='project')return lcProjectFacts(key,ledger);const income=ledger.incomes.find(row=>row.id===key&&!row.voidedAt);if(!income)throw new InputError('Income record not found.');return {kind:'income',key,title:income.reference,revenue:income.amount,cost:income.cost,expenses:0,profit:income.amount-income.cost,company:Math.max(0,income.amount-income.cost),distributable:0,missing:0,fullyPaid:true,invoices:[],signature:JSON.stringify(income)};}
function lcValid(confirmation,ledger){try{const facts=lcFacts(confirmation.kind,confirmation.key,ledger);return facts.fullyPaid&&!facts.missing&&facts.signature===confirmation.signature&&confirmation.payments.every(saved=>(facts.invoices.find(row=>row.id===saved.id)?.paid??-1)>=saved.paid);}catch{return false;}}
function lcReconcile(ledger){for(const entry of ledger.recoveries.filter(row=>!row.reversedAt)){const confirmation=ledger.confirmations.find(row=>row.id===entry.confirmationId);if(!confirmation||!lcValid(confirmation,ledger)){entry.reversedAt=now();entry.reversalReason='Source profit, cost or payment changed; confirm again before recovery.';lcAudit(ledger,'recovery.reversed',entry.id);}}}
function lcView(ledger){const active=ledger.recoveries.filter(row=>!row.reversedAt&&lcValid(ledger.confirmations.find(item=>item.id===row.confirmationId)||{},ledger));const losses=ledger.losses.map(loss=>({...loss,recovered:active.filter(row=>row.lossId===loss.id).reduce((sum,row)=>sum+row.amount,0)})).map(loss=>({...loss,outstanding:loss.amount-loss.recovered}));const sources=[...q('SELECT project_key FROM projects').map(row=>lcProjectFacts(row.project_key,ledger)),...ledger.incomes.filter(row=>!row.voidedAt).map(row=>lcFacts('income',row.id,ledger))].map(source=>{const recoveries=active.filter(row=>row.kind===source.kind&&row.key===source.key),fromCompany=recoveries.filter(row=>row.source==='company').reduce((sum,row)=>sum+row.amount,0),fromDistribution=recoveries.filter(row=>row.source==='distributable').reduce((sum,row)=>sum+row.amount,0);return {...source,confirmation:ledger.confirmations.find(row=>row.kind===source.kind&&row.key===source.key&&lcValid(row,ledger))?.id||'',fromCompany,fromDistribution,companyAvailable:Math.max(0,source.company-fromCompany),distributionAvailable:Math.max(0,source.distributable-fromDistribution)};});return {policy:ledger.policy,losses,recoveries:ledger.recoveries,audit:ledger.audit,charges:ledger.charges,sources,totals:{losses:losses.reduce((sum,row)=>sum+row.amount,0),recovered:active.reduce((sum,row)=>sum+row.amount,0),outstanding:losses.reduce((sum,row)=>sum+row.outstanding,0),companyCharges:sources.reduce((sum,row)=>sum+row.company,0),companyAvailable:sources.reduce((sum,row)=>sum+row.companyAvailable,0)},canManage:(()=>{try{lcAdmin();return true;}catch{return false;}})()};}
function lcAllocate(ledger,body,automatic=false){
  const kind=body.kind==='income'?'income':'project',key=String(body.key||''),confirmation=ledger.confirmations.find(row=>row.kind===kind&&row.key===key&&lcValid(row,ledger));if(!confirmation)throw new InputError('Complete and confirm the source profit first. Project invoices must be fully paid and all direct costs recorded.');
  const source=body.source==='distributable'?'distributable':'company',facts=lcFacts(kind,key,ledger),used=ledger.recoveries.filter(row=>!row.reversedAt&&row.kind===kind&&row.key===key&&row.source===source).reduce((sum,row)=>sum+row.amount,0),available=Math.max(0,(source==='company'?facts.company:facts.distributable)-used),view=lcView(ledger),outstanding=view.totals.outstanding;
  let requested=automatic?0:lcMoney(body.amount);if(automatic){const policy=ledger.policy,profit=Math.max(0,facts.profit);requested=policy.mode==='fixed'?lcCents(policy.value):Math.round(profit*Number(policy.value)/100);requested=Math.min(requested,available,outstanding);}else if(requested>available||requested>outstanding)throw new InputError('Recovery exceeds available profit or the outstanding loss balance.');
  if(requested<=0){if(automatic)return [];throw new InputError('Recovery must be greater than zero.');}
  const requestId=String(body.requestId||'');if(!automatic&&!requestId)throw new InputError('A unique request reference is required.');if(ledger.recoveries.some(row=>row.requestId===requestId&&requestId))throw new InputError('This recovery request has already been processed.');
  const batch=id(),created=[];let remaining=requested;const targets=body.lossId?view.losses.filter(row=>row.id===body.lossId):view.losses;if(body.lossId&&(!targets.length||targets[0].outstanding<remaining))throw new InputError('The selected loss does not have enough outstanding balance.');
  for(const loss of targets){const value=Math.min(remaining,loss.outstanding);if(value<=0)continue;const row={id:id(),batch,requestId,confirmationId:confirmation.id,kind,key,invoiceIds:facts.invoices.map(item=>item.id),lossId:loss.id,source,amount:value,automatic,createdAt:now(),actor:currentTenant()?.actor?.userId};ledger.recoveries.push(row);created.push(row);remaining-=value;if(!remaining)break;}lcAudit(ledger,'recovery.allocated',batch);return created;
}
const lcPreviousApi=api;
api=function(method,url,body={}){
  const path=url.pathname;if(path.startsWith('/api/loss-coverage')){
    const actor=currentTenant()?.actor;if(method==='GET'){if(!accessControl.can(actor,'profit','view'))throw Object.assign(new Error('Profit viewing permission is required.'),{status:403});return lcView(lcRead());}
    lcAdmin();return inTransaction(()=>{const ledger=lcRead();lcReconcile(ledger);let result;
      if(path==='/api/loss-coverage/losses'&&method==='POST'){const value=lcMoney(body.amount);if(!value)throw new InputError('Loss must be greater than zero.');const reason=required(body.reason,'Loss reason'),projectKey=String(body.projectKey||''),invoiceId=String(body.invoiceId||'');if(projectKey&&!one('SELECT project_key FROM projects WHERE project_key=?',projectKey))throw new InputError('Project not found.');if(invoiceId&&!one('SELECT id FROM invoices WHERE id=?',invoiceId))throw new InputError('Invoice not found.');if(projectKey&&invoiceId&&one('SELECT project_key FROM invoices WHERE id=?',invoiceId).project_key!==projectKey)throw new InputError('Invoice belongs to a different project.');const reference=required(body.requestId,'Request reference');if(ledger.losses.some(row=>row.requestId===reference))throw new InputError('This loss has already been recorded.');result={id:id(),requestId:reference,amount:value,reason,date:body.date||today(),projectKey,invoiceId,createdAt:now()};ledger.losses.push(result);lcAudit(ledger,'loss.recorded',result.id);}
      else if(path==='/api/loss-coverage/policy'&&method==='PUT'){const value=Number(body.value);if(!['percentage','fixed'].includes(body.mode)||!['company','distributable'].includes(body.source)||!Number.isFinite(value)||value<0||body.mode==='percentage'&&value>100)throw new InputError('Enter a valid recovery policy.');ledger.policy={enabled:body.enabled===true,mode:body.mode,value,source:body.source};result=ledger.policy;lcAudit(ledger,'policy.updated','default');}
      else if(path==='/api/loss-coverage/charges'&&method==='PUT'){const key=required(body.key,'Project'),value=Number(body.value);lcProjectFacts(key,ledger);if(!['fixed','percentage'].includes(body.mode)||!Number.isFinite(value)||value<0||body.mode==='percentage'&&value>100)throw new InputError('Enter valid company charges.');ledger.charges[key]={mode:body.mode,value};lcReconcile(ledger);result=ledger.charges[key];lcAudit(ledger,'charges.updated',key);}
      else if(path==='/api/loss-coverage/income'&&method==='POST'){const reference=required(body.reference,'Income reference');if(ledger.incomes.some(row=>row.reference===reference))throw new InputError('This income reference already exists.');result={id:id(),reference,amount:lcMoney(body.amount),cost:lcMoney(body.cost||0),date:body.date||today(),createdAt:now()};ledger.incomes.push(result);lcAudit(ledger,'income.recorded',result.id);}
      else if(path==='/api/loss-coverage/confirm'&&method==='POST'){const kind=body.kind==='income'?'income':'project',key=required(body.key,'Source'),facts=lcFacts(kind,key,ledger);if(!facts.fullyPaid||facts.missing||facts.profit<=0)throw new InputError('Confirm only profitable completed work with fully paid invoices and recorded costs.');if(ledger.confirmations.some(row=>row.kind===kind&&row.key===key&&lcValid(row,ledger)))throw new InputError('Profit is already confirmed.');const confirmation={id:id(),kind,key,signature:facts.signature,payments:facts.invoices.map(row=>({id:row.id,paid:row.paid})),at:now(),actor:currentTenant()?.actor?.userId};ledger.confirmations.push(confirmation);if(ledger.policy.enabled)lcAllocate(ledger,{kind,key,source:ledger.policy.source,requestId:'auto:'+confirmation.id},true);result=confirmation;lcAudit(ledger,'profit.confirmed',confirmation.id);}
      else if(path==='/api/loss-coverage/manual-cover'&&method==='POST'){
        const requestId=required(body.requestId,'Request reference'),lossId=required(body.lossId,'Loss');
        if(ledger.recoveries.some(row=>row.manualRequestId===requestId))throw new InputError('This coverage has already been saved.');
        if(!Array.isArray(body.contributions)||!body.contributions.length||body.contributions.length>50)throw new InputError('Select between one and 50 project or invoice contributions.');
        const seen=new Set();result=[];ledger.policy.enabled=false;
        for(const contribution of body.contributions){
          const invoiceId=String(contribution.invoiceId||''),invoice=invoiceId?one('SELECT * FROM invoices WHERE id=?',invoiceId):null;
          if(invoiceId&&!invoice)throw new InputError('Invoice not found.');
          const key=invoice?invoice.project_key:required(contribution.projectKey,'Project');
          if(!key||seen.has(key))throw new InputError('Use only one contribution per project in this coverage.');seen.add(key);
          const facts=lcProjectFacts(key,ledger),amount=lcMoney(contribution.amount);
          if(amount<=0||!facts.fullyPaid||facts.missing)throw new InputError('Enter a positive amount from fully paid work with recorded costs.');
          const view=lcView(ledger),source=view.sources.find(row=>row.kind==='project'&&row.key===key),used=source.fromCompany+source.fromDistribution;
          if(amount>Math.max(0,facts.profit-used))throw new InputError('Coverage exceeds the remaining project profit.');
          if(invoice&&amount>Math.max(0,lcCents(profitInvoiceStats(invoice).sales-profitInvoiceStats(invoice).directCost)-facts.expenses-used))throw new InputError('Coverage exceeds the remaining profit available from this invoice.');
          let confirmation=ledger.confirmations.find(row=>row.kind==='project'&&row.key===key&&lcValid(row,ledger));
          if(!confirmation){confirmation={id:id(),kind:'project',key,signature:facts.signature,payments:facts.invoices.map(row=>({id:row.id,paid:row.paid})),at:now(),actor:currentTenant()?.actor?.userId};ledger.confirmations.push(confirmation);}
          let remaining=amount;
          for(const [pool,available] of [['company',source.companyAvailable],['distributable',source.distributionAvailable]]){
            const value=Math.min(remaining,available);if(!value)continue;
            const entries=lcAllocate(ledger,{kind:'project',key,source:pool,lossId,amount:value/100,requestId:requestId+':'+key+':'+pool});
            for(const entry of entries){entry.manualRequestId=requestId;entry.selectedInvoiceId=invoiceId;entry.coverageDate=body.date||today();result.push(entry);}remaining-=value;
          }
        }
        lcAudit(ledger,'loss.manually-covered',requestId);
      }
      else if(path==='/api/loss-coverage/recoveries'&&method==='POST')result=lcAllocate(ledger,body);
      else if(path==='/api/loss-coverage/reverse'&&method==='POST'){const row=ledger.recoveries.find(item=>item.id===body.id);if(!row||row.reversedAt)throw new InputError('Active recovery not found.');row.reversedAt=now();row.reversalReason=required(body.reason,'Reversal reason');result=row;lcAudit(ledger,'recovery.reversed',row.id);}
      else if(path==='/api/loss-coverage/income-void'&&method==='POST'){const row=ledger.incomes.find(item=>item.id===body.id&&!item.voidedAt);if(!row)throw new InputError('Income not found.');row.voidedAt=now();row.voidReason=required(body.reason,'Void reason');lcReconcile(ledger);result=row;lcAudit(ledger,'income.voided',row.id);}
      else throw new InputError('Unknown loss coverage action.');lcSave(ledger);return {result,summary:lcView(ledger)};
    });
  }
  const result=lcPreviousApi(method,url,body);if(['POST','PUT','DELETE'].includes(method)&&!path.startsWith('/api/backup')){const ledger=lcRead();if(ledger.recoveries.length){lcReconcile(ledger);lcSave(ledger);}}return result;
};
const lcPreviousScope=requiredScope;
requiredScope=function(method,path,body){if(path.startsWith('/api/loss-coverage'))return null;return lcPreviousScope(method,path,body);};
const lcPreviousBootstrap=bootstrap;
bootstrap=function(){const result=lcPreviousBootstrap();if(accessControl.can(currentTenant()?.actor,'profit','view'))result.loss_coverage=lcView(lcRead());return result;};

 // Repair intake is a separate, company-scoped non-stock ledger. It is used
 // for goods received for repair or warranty work when the item is not an
 // inventory product. Creating an intake never changes stock or invoice data.
 const REPAIR_INTAKE_STATUSES=['received','under_inspection','repairing','ready','returned','closed','rejected'];
 const repairText=(value,max=5000)=>String(value||'').trim().slice(0,max);
 const repairWorkflowStages=value=>{let stages=[];try{stages=Array.isArray(value)?value:JSON.parse(String(value||'[]'));}catch{}const allowed=['goods_received','repair','inspection'];return [...new Set(stages.map(stage=>String(stage)).filter(stage=>allowed.includes(stage)))];};
 function repairIntakeAdmin(){const tenant=currentTenant();accessControl.requireCompanyAdmin(tenant.actor,tenant.company.id);}
 function repairSourceDetails(body){
   const type=String(body.sourceDocumentType||'').trim(),sourceId=repairText(body.sourceDocumentId,180);
   if(!type&&!sourceId)return {sourceType:'',sourceId:'',customerId:body.customerId||null,supplierId:body.supplierId||null};
   if(!['quotation','proforma','invoice','purchase'].includes(type))throw new InputError('Choose a quotation, proforma invoice, final invoice or purchase as the linked source.');
   if(!sourceId)throw new InputError('Choose the linked source document.');
   const table=type==='invoice'?'invoices':type==='purchase'?'purchases':'quotations',source=one(`SELECT * FROM ${table} WHERE id=?`,sourceId);if(!source)throw new InputError('The selected source document was not found.');
   return {sourceType:type,sourceId,customerId:source.customer_id||body.customerId||null,supplierId:source.supplier_id||body.supplierId||null};
 }
 function repairIntakeCreate(body){
   const requestId=repairText(body.requestId,180),existing=requestId?one('SELECT * FROM repair_intakes WHERE request_id=?',requestId):null;if(existing)return existing;
   const itemName=required(body.itemName,'Goods / item name'),faultDescription=required(body.faultDescription,'Fault / problem description'),receivedAt=repairText(body.receivedAt,80),receivedBy=required(body.receivedBy,'Received by');if(!receivedAt)throw new InputError('Received date and time are required.');
   const intakeType=['repair_goods','warranty_intake'].includes(String(body.intakeType||''))?String(body.intakeType):'repair_goods',status=REPAIR_INTAKE_STATUSES.includes(String(body.status||''))?String(body.status):'received',stages=repairWorkflowStages(body.workflowStages||['goods_received']);if(!stages.length)throw new InputError('Select at least one process stage: goods received, repair or inspection.');
    const repairAgentSupplierId=repairText(body.repairAgentSupplierId,180)||null;if(repairAgentSupplierId&&!one('SELECT id FROM suppliers WHERE id=?',repairAgentSupplierId))throw new InputError('The selected repair centre was not found in Suppliers.');
    const source=repairSourceDetails(body),stamp=now(),intakeId=id(),intakeNumber=nextNumber('repair-intake','GRR'),companyId=one('SELECT id FROM companies WHERE is_default=1 LIMIT 1')?.id||'company-default';
    run('INSERT INTO repair_intakes(id,intake_number,request_id,company_id,intake_type,status,source_document_type,source_document_id,customer_id,supplier_id,repair_agent_supplier_id,item_name,item_description,serial_number,fault_description,condition_on_receipt,accessories,received_at,received_by,received_contact,location,sent_for_repair_at,sent_for_repair_by,workflow_stages,inspection_notes,repair_notes,resolution,notes,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',intakeId,intakeNumber,requestId,companyId,intakeType,status,source.sourceType,source.sourceId,source.customerId,source.supplierId,repairAgentSupplierId,itemName,repairText(body.itemDescription),repairText(body.serialNumber,180),faultDescription,repairText(body.conditionOnReceipt,1000),repairText(body.accessories,1000),receivedAt,receivedBy,repairText(body.receivedContact,80),repairText(body.location,240),repairText(body.sentForRepairAt,80),repairText(body.sentForRepairBy,160),JSON.stringify(stages),repairText(body.inspectionNotes),repairText(body.repairNotes),repairText(body.resolution,1000),repairText(body.notes),currentTenant()?.actor?.userId||'',stamp,stamp);
   return one('SELECT * FROM repair_intakes WHERE id=?',intakeId);
 }
 function repairIntakeUpdate(intakeId,body){
   const intake=one('SELECT * FROM repair_intakes WHERE id=?',intakeId);if(!intake)throw new InputError('Repair intake not found.');
   const requestId=repairText(body.requestId,180),repeat=requestId&&requestId!==intake.request_id?one('SELECT * FROM repair_intakes WHERE request_id=?',requestId):null;if(repeat)return repeat;
   const status=Object.prototype.hasOwnProperty.call(body,'status')?String(body.status||''):intake.status;if(!REPAIR_INTAKE_STATUSES.includes(status))throw new InputError('Choose a valid repair intake status.');
   const stages=Object.prototype.hasOwnProperty.call(body,'workflowStages')?repairWorkflowStages(body.workflowStages):repairWorkflowStages(intake.workflow_stages);if(!stages.length)throw new InputError('Select at least one process stage.');
    const repairAgentSupplierId=Object.prototype.hasOwnProperty.call(body,'repairAgentSupplierId')?repairText(body.repairAgentSupplierId,180)||null:intake.repair_agent_supplier_id||null;if(repairAgentSupplierId&&!one('SELECT id FROM suppliers WHERE id=?',repairAgentSupplierId))throw new InputError('The selected repair centre was not found in Suppliers.');
    const stamp=now(),values=[status,repairText(body.receivedAt??intake.received_at,80),repairText(body.receivedBy??intake.received_by,160),repairText(body.receivedContact??intake.received_contact,80),repairText(body.location??intake.location,240),repairAgentSupplierId,repairText(body.sentForRepairAt??intake.sent_for_repair_at,80),repairText(body.sentForRepairBy??intake.sent_for_repair_by,160),JSON.stringify(stages),repairText(body.inspectionNotes??intake.inspection_notes),repairText(body.repairNotes??intake.repair_notes),repairText(body.resolution??intake.resolution,1000),repairText(body.notes??intake.notes),requestId||intake.request_id,stamp,intake.id];
    run('UPDATE repair_intakes SET status=?,received_at=?,received_by=?,received_contact=?,location=?,repair_agent_supplier_id=?,sent_for_repair_at=?,sent_for_repair_by=?,workflow_stages=?,inspection_notes=?,repair_notes=?,resolution=?,notes=?,request_id=?,updated_at=? WHERE id=?',...values);return one('SELECT * FROM repair_intakes WHERE id=?',intake.id);
 }
 const repairPreviousApi=api;
 api=function(method,url,body={}){
   const path=url.pathname;
   if(path.startsWith('/api/repair-intakes')){
     if(method==='GET'){
       if(path==='/api/repair-intakes')return q('SELECT * FROM repair_intakes ORDER BY received_at DESC,created_at DESC');
       const intake=one('SELECT * FROM repair_intakes WHERE id=?',path.split('/').pop());if(!intake)throw new InputError('Repair intake not found.');return intake;
     }
     repairIntakeAdmin();
     return inTransaction(()=>{if(method==='POST'&&path==='/api/repair-intakes')return repairIntakeCreate(body);if(method==='PUT'&&/^\/api\/repair-intakes\/[^/]+$/.test(path))return repairIntakeUpdate(path.split('/').pop(),body);throw new InputError('Unknown repair intake action.');});
   }
   return repairPreviousApi(method,url,body);
 };

 // Warranty claims are a separate, company-scoped service ledger. Creating a
// claim never edits the original invoice, payment, or stock records. A
// replacement consumes stock exactly once when the resolution is saved; a
// refund and warranty service bill remain auditable settlement facts on the
// claim itself.
const WARRANTY_STATUSES=['opened','under_review','approved','repaired','replaced','refunded','rejected','closed'];
const warrantyAmount=(value,label='Amount')=>{const number=Number(value||0);if(!Number.isFinite(number)||number<0||number>1e12)throw new InputError(label+' must be a valid non-negative amount.');return Math.round(number*100)/100;};
const warrantyText=(value,max=2000)=>String(value||'').trim().slice(0,max);
const warrantyWorkflowStages=value=>{let stages=[];try{stages=Array.isArray(value)?value:JSON.parse(String(value||'[]'));}catch{}const allowed=['goods_received','repair','inspection'];return [...new Set(stages.map(stage=>String(stage)).filter(stage=>allowed.includes(stage)))];};
function warrantyAdmin(){const tenant=currentTenant();accessControl.requireCompanyAdmin(tenant.actor,tenant.company.id);}
function warrantyClaimEvents(claimId){return q('SELECT * FROM warranty_claim_events WHERE claim_id=? ORDER BY created_at ASC,id ASC',claimId);}
function warrantyAddEvent(claim,eventType,fromStatus,toStatus,amountValue,notes){run('INSERT INTO warranty_claim_events(id,claim_id,event_type,from_status,to_status,amount,notes,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)',id(),claim.id,eventType,fromStatus||'',toStatus||'',warrantyAmount(amountValue||0),warrantyText(notes,4000),currentTenant()?.actor?.userId||'',now());}
function warrantyInvoiceItem(invoiceId,itemId){return one('SELECT ii.*,i.number AS invoice_number,i.customer_id AS invoice_customer_id,i.invoice_date,i.status AS invoice_status FROM invoice_items ii JOIN invoices i ON i.id=ii.invoice_id WHERE ii.id=? AND ii.invoice_id=?',itemId,invoiceId);}
function warrantyCreateClaim(body){
  const requestId=warrantyText(body.requestId,180),existing=requestId?one('SELECT * FROM warranty_claims WHERE request_id=?',requestId):null;if(existing)return existing;
  const sourceType=['quotation','proforma','invoice'].includes(String(body.sourceDocumentType||''))?String(body.sourceDocumentType):'invoice',sourceId=required(body.sourceDocumentId||body.invoiceId,'Source document');
  let invoiceId=sourceType==='invoice'?sourceId:'';
  if(sourceType!=='invoice'){const source=one('SELECT * FROM quotations WHERE id=?',sourceId);if(!source)throw new InputError('The selected quotation or proforma invoice was not found.');invoiceId=source.invoice_id||'';if(!invoiceId)throw new InputError('Convert the selected quotation or proforma invoice to a final invoice before starting a warranty claim.');}
  const invoice=one('SELECT * FROM invoices WHERE id=?',invoiceId);if(!invoice)throw new InputError('Final invoice not found.');
  const itemId=required(body.invoiceItemId,'Invoice product'),item=warrantyInvoiceItem(invoiceId,itemId);if(!item)throw new InputError('The selected product is not on that invoice.');
  if(item.item_type!=='product'||!item.product_id)throw new InputError('Warranty claims can only be started for an invoiced inventory product.');
  const claimQuantity=quantity(body.claimQuantity??1);if(claimQuantity>Number(item.quantity)+0.000001)throw new InputError('Claim quantity cannot exceed the invoiced quantity.');
  const claimed=Number(one("SELECT COALESCE(SUM(claim_quantity),0) AS quantity FROM warranty_claims WHERE invoice_item_id=? AND status<>'rejected'",itemId)?.quantity||0);if(claimed+claimQuantity>Number(item.quantity)+0.000001)throw new InputError('The invoiced quantity has already been covered by existing warranty claims.');
  const workflowStages=warrantyWorkflowStages(body.workflowStages);if(!workflowStages.length)throw new InputError('Select at least one process stage: goods received, repair or inspection.');
  const goodsReceivedAt=String(body.goodsReceivedAt||'').trim(),goodsReceivedBy=warrantyText(body.goodsReceivedBy,160),goodsReceivedContact=warrantyText(body.goodsReceivedContact,80);if(workflowStages.includes('goods_received')&&(!goodsReceivedAt||!goodsReceivedBy))throw new InputError('Goods received date/time and received by are required when that stage is selected.');
  const issue=required(body.issue,'Warranty issue'),claimId=id(),claimNumber=nextNumber('warranty-claim','WCL'),stamp=now(),values=[claimId,claimNumber,requestId,invoice.id,item.id,invoice.customer_id,item.product_id,claimQuantity,String(body.claimDate||today()),String(body.warrantyUntil||''),issue,warrantyText(body.notes,5000),'opened',warrantyAmount(body.serviceBillAmount,'Warranty service bill'),warrantyText(body.serviceBillReference,180),String(body.serviceBillDate||''),'','',null,0,'',0,'','','',sourceType,sourceId,JSON.stringify(workflowStages),goodsReceivedAt,goodsReceivedBy,goodsReceivedContact,warrantyText(body.inspectionNotes,5000),warrantyText(body.repairNotes,5000),'',currentTenant()?.actor?.userId||'',stamp,stamp];
  run('INSERT INTO warranty_claims(id,claim_number,request_id,invoice_id,invoice_item_id,customer_id,product_id,claim_quantity,claim_date,warranty_until,issue,notes,status,service_bill_amount,service_bill_reference,service_bill_date,resolution_type,resolution_date,replacement_product_id,replacement_quantity,replacement_movement_id,refund_amount,refund_method,refund_reference,refund_date,source_document_type,source_document_id,workflow_stages,goods_received_at,goods_received_by,goods_received_contact,inspection_notes,repair_notes,resolution_request_id,created_by,created_at,updated_at) VALUES ('+values.map(()=>'?').join(',')+')',...values);
  const claim=one('SELECT * FROM warranty_claims WHERE id=?',claimId);warrantyAddEvent(claim,'claim_opened','','opened',0,issue);return claim;
}
function warrantyDeductReplacementStock(claim,productId,quantityValue){
  const product=one('SELECT * FROM products WHERE id=?',productId);if(!product)throw new InputError('Replacement product not found.');const quantityNumber=quantity(quantityValue);if(product.id!==claim.product_id)throw new InputError('Replacement must use the same invoiced product.');if(Number(product.quantity)<quantityNumber)throw new InputError(`Not enough ${product.name} in stock for this replacement.`);
  const movementId=id(),stamp=now(),next=Number(product.quantity)-quantityNumber;run('UPDATE products SET quantity=?,updated_at=? WHERE id=?',next,stamp,product.id);run('INSERT INTO stock_movements(id,product_id,movement_type,quantity,unit_cost,reference,notes,movement_date,created_at) VALUES (?,?,?,?,?,?,?,?,?)',movementId,product.id,'Warranty replacement',-quantityNumber,product.purchase_price,claim.claim_number,'Replacement issued against warranty claim',today(),stamp);return movementId;
}
function warrantyUpdateClaim(claimId,body){
  const claim=one('SELECT * FROM warranty_claims WHERE id=?',claimId);if(!claim)throw new InputError('Warranty claim not found.');
  const requestId=warrantyText(body.requestId,180),repeat=requestId?one('SELECT * FROM warranty_claims WHERE resolution_request_id=?',requestId):null;if(repeat)return repeat;
  if(claim.status==='closed')throw new InputError('A closed warranty claim cannot be changed.');
  const status=String(body.status||claim.status);if(!WARRANTY_STATUSES.includes(status))throw new InputError('Choose a valid warranty claim status.');
  if(status==='closed'&&!['repaired','replaced','refunded','rejected'].includes(claim.status))throw new InputError('Complete the repair, replacement, refund or rejection before closing the claim.');
  const item=one('SELECT * FROM invoice_items WHERE id=?',claim.invoice_item_id);if(!item)throw new InputError('The original invoice product no longer exists.');
  let serviceBill=Object.prototype.hasOwnProperty.call(body,'serviceBillAmount')?warrantyAmount(body.serviceBillAmount,'Warranty service bill'):Number(claim.service_bill_amount||0),serviceReference=Object.prototype.hasOwnProperty.call(body,'serviceBillReference')?warrantyText(body.serviceBillReference,180):claim.service_bill_reference||'',serviceDate=Object.prototype.hasOwnProperty.call(body,'serviceBillDate')?String(body.serviceBillDate||''):claim.service_bill_date||'';
  let resolutionType=claim.resolution_type||'',resolutionDate=claim.resolution_date||'',replacementProductId=claim.replacement_product_id||null,replacementQuantity=Number(claim.replacement_quantity||0),replacementMovementId=claim.replacement_movement_id||'',refundAmount=Number(claim.refund_amount||0),refundMethod=claim.refund_method||'',refundReference=claim.refund_reference||'',refundDate=claim.refund_date||'';
  if(status==='repaired'){resolutionType='repair';resolutionDate=String(body.resolutionDate||today());}
  if(status==='replaced'){
    resolutionType='replacement';resolutionDate=String(body.resolutionDate||today());replacementProductId=String(body.replacementProductId||claim.product_id);replacementQuantity=quantity(body.replacementQuantity??claim.claim_quantity);if(replacementProductId!==claim.product_id)throw new InputError('Replacement must use the same invoiced product.');if(replacementQuantity>Number(claim.claim_quantity)+0.000001)throw new InputError('Replacement quantity cannot exceed the claim quantity.');if(!replacementMovementId)replacementMovementId=warrantyDeductReplacementStock(claim,replacementProductId,replacementQuantity);
  }
  if(status==='refunded'){
    resolutionType='refund';resolutionDate=String(body.resolutionDate||today());refundAmount=Object.prototype.hasOwnProperty.call(body,'refundAmount')?warrantyAmount(body.refundAmount,'Refund amount'):refundAmount;if(refundAmount<=0)throw new InputError('Enter the refund amount.');const maxRefund=Math.round(Number(item.line_total||0)*(Number(claim.claim_quantity)/Math.max(Number(item.quantity),0.000001)*100))/100;if(refundAmount>maxRefund+0.005)throw new InputError('Refund cannot exceed the selected invoiced line value.');refundMethod=warrantyText(body.refundMethod,80);refundReference=warrantyText(body.refundReference,180);refundDate=String(body.refundDate||today());
  }
  const notes=Object.prototype.hasOwnProperty.call(body,'notes')?warrantyText(body.notes,5000):claim.notes||'',workflowStages=Object.prototype.hasOwnProperty.call(body,'workflowStages')?warrantyWorkflowStages(body.workflowStages):warrantyWorkflowStages(claim.workflow_stages),goodsReceivedAt=Object.prototype.hasOwnProperty.call(body,'goodsReceivedAt')?String(body.goodsReceivedAt||''):claim.goods_received_at||'',goodsReceivedBy=Object.prototype.hasOwnProperty.call(body,'goodsReceivedBy')?warrantyText(body.goodsReceivedBy,160):claim.goods_received_by||'',goodsReceivedContact=Object.prototype.hasOwnProperty.call(body,'goodsReceivedContact')?warrantyText(body.goodsReceivedContact,80):claim.goods_received_contact||'',inspectionNotes=Object.prototype.hasOwnProperty.call(body,'inspectionNotes')?warrantyText(body.inspectionNotes,5000):claim.inspection_notes||'',repairNotes=Object.prototype.hasOwnProperty.call(body,'repairNotes')?warrantyText(body.repairNotes,5000):claim.repair_notes||'';if(!workflowStages.length)throw new InputError('Select at least one process stage.');if(workflowStages.includes('goods_received')&&(!goodsReceivedAt||!goodsReceivedBy))throw new InputError('Goods received date/time and received by are required when that stage is selected.');const stamp=now();run('UPDATE warranty_claims SET status=?,notes=?,service_bill_amount=?,service_bill_reference=?,service_bill_date=?,resolution_type=?,resolution_date=?,replacement_product_id=?,replacement_quantity=?,replacement_movement_id=?,refund_amount=?,refund_method=?,refund_reference=?,refund_date=?,workflow_stages=?,goods_received_at=?,goods_received_by=?,goods_received_contact=?,inspection_notes=?,repair_notes=?,resolution_request_id=?,updated_at=? WHERE id=?',status,notes,serviceBill,serviceReference,serviceDate,resolutionType,resolutionDate,replacementProductId,replacementQuantity,replacementMovementId,refundAmount,refundMethod,refundReference,refundDate,JSON.stringify(workflowStages),goodsReceivedAt,goodsReceivedBy,goodsReceivedContact,inspectionNotes,repairNotes,requestId,stamp,claim.id);
  const saved=one('SELECT * FROM warranty_claims WHERE id=?',claim.id);if(status!==claim.status)warrantyAddEvent(saved,'status_changed',claim.status,status,status==='refunded'?refundAmount:status==='replaced'?replacementQuantity:serviceBill,body.eventNotes||notes);else if(serviceBill!==Number(claim.service_bill_amount||0))warrantyAddEvent(saved,'service_bill_recorded',claim.status,claim.status,serviceBill,serviceReference);return saved;
}
const warrantyPreviousApi=api;
api=function(method,url,body={}){
  const path=url.pathname;
  if(path.startsWith('/api/warranty-claims')){
    const actor=currentTenant()?.actor;
    if(method==='GET'){
      if(path==='/api/warranty-claims')return {claims:q('SELECT * FROM warranty_claims ORDER BY claim_date DESC,created_at DESC'),events:q('SELECT * FROM warranty_claim_events ORDER BY created_at ASC,id ASC')};
      const claim=one('SELECT * FROM warranty_claims WHERE id=?',path.split('/').pop());if(!claim)throw new InputError('Warranty claim not found.');return {...claim,events:warrantyClaimEvents(claim.id)};
    }
    warrantyAdmin();
    return inTransaction(()=>{
      if(method==='POST'&&path==='/api/warranty-claims')return warrantyCreateClaim(body);
      if(method==='PUT'&&/^\/api\/warranty-claims\/[^/]+$/.test(path))return warrantyUpdateClaim(path.split('/').pop(),body);
      throw new InputError('Unknown warranty claim action.');
    });
  }
  return warrantyPreviousApi(method,url,body);
};
const warrantyPreviousScope=requiredScope;
requiredScope=function(method,path,body){if(path.startsWith('/api/warranty-claims'))return {scope:'warranty_claims',action:method==='GET'?'view':method==='PUT'?'edit':'create'};return warrantyPreviousScope(method,path,body);};
const warrantyPreviousBootstrap=bootstrap;
bootstrap=function(){const result=warrantyPreviousBootstrap();result.warranty_claims=q('SELECT * FROM warranty_claims ORDER BY claim_date DESC,created_at DESC');result.warranty_claim_events=q('SELECT * FROM warranty_claim_events ORDER BY created_at ASC,id ASC');return result;};
const warrantyPreviousFilterBootstrap=filterBootstrap;
filterBootstrap=function(snapshot,access,actor){const visible=warrantyPreviousFilterBootstrap(snapshot,access,actor);if(!access.can(actor,'warranty_claims','view')){visible.warranty_claims=[];visible.warranty_claim_events=[];}return visible;};

;// ./android/runtime/entry.mjs




const originalFetch = globalThis.fetch.bind(globalThis);
async function localFetch(url, options = {}) {
  const target = url instanceof Request ? url.url : String(url);
  const parsed = new URL(target, globalThis.location.href);
  if (!parsed.pathname.startsWith('/api/') || parsed.origin !== globalThis.location.origin) return originalFetch(url, options);
  if (url instanceof Request) options = { method: url.method, headers: url.headers, body: ['GET', 'HEAD'].includes(url.method) ? undefined : await url.arrayBuffer(), ...options };
  const result = await internalRequest(target, options);
  return new Response(result.body, { status: result.status, headers: result.headers });
}
globalThis.fetch = localFetch;
globalThis.InvoiceyBackend = {
  ready: true,
  fetch: localFetch,
  async request({ method = 'GET', path, body, bodyBase64, headers = {} }) {
    const result = await internalRequest(path, { method, headers, body: bodyBase64 ? buffer/* Buffer */.h.from(bodyBase64, 'base64') : body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
    return { ...result, body: result.body.toString('base64') };
  }
};


})();

/******/ })()
;

