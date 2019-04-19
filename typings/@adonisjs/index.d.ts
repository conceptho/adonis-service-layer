import ioredis = require("ioredis");
import http = require("http");
import stream = require("stream");
import events = require("events");
import Bluebird = require("bluebird");
import GE = require("@adonisjs/generic-exceptions")

type WorkInProgress = any
type Omit<T, K extends keyof T> = T extends any ? Pick<T, Exclude<keyof T, K>> : never
type Overwrite<T, U> = Omit<T, Extract<keyof T, keyof U>> & U;

interface Macroable {
    /**
     * Define a macro to be attached to the class
     * `prototype`. Macros needs to be attached
     * only once and can be accessed on each
     * instance of class.
     *
     * @method macro
     * @static
     *
     * @param  {String}   name
     * @param  {Function} callback
     *
     * @throws {InvalidArgumentException} If callback is not a function
     *
     * @example
     * ```js
     * Request.macro('id', function () {
     *   this.uuid = this.uuid || uuid.v1()
     *   return this.uuid
     * })
     *
     * // usage
     * request.id()
     * ```
     */
    macro(name : string, callback : Function): void;

    /**
     * Return the callback method for a macro.
     *
     * @method getMacro
     * @static
     *
     * @param  {String} name
     *
     * @return {Function|Undefined}
     */
    getMacro(name : string): Function | undefined;

    /**
     * Returns a boolean indicating whether a macro
     * has been registered or not.
     *
     * @method hasMacro
     * @static
     *
     * @param  {String}  name
     *
     * @return {Boolean}
     */
    hasMacro(name : string): boolean;

    /**
     * Define a getter on the class prototype. You should
     * use getter over macro, when you want the property
     * to be evaluated everytime it is accessed.
     *
     * Singleton getters callback is only executed once.
     *
     * @method getter
     * @static
     *
     * @param  {String}   name
     * @param  {Function} callback
     * @param  {Boolean}  [singleton = false]
     *
     * @throws {InvalidArgumentException} If callback is not a function
     *
     * @example
     * ```
     * Request.getter('time', function () {
     *   return new Date().getTime()
     * })
     *
     * // get current time
     * request.time
     * ```
     */
    getter(name : string, callback : Function, singleton? : false): void;

    /**
     * Returns the callback method of getter.
     *
     * @method getGetter
     * @static
     *
     * @param  {String}  name
     *
     * @return {Callback}
     */
    getGetter(name : string): Function;

    /**
     * Returns a boolean indicating whether getter exists
     * or not.
     *
     * @method hasGetter
     * @static
     *
     * @param  {String}  name
     *
     * @return {Boolean}
     */
    hasGetter(name : string): boolean;

    /**
     * Getters and macros are defined on the class prototype.
     * If for any reason you want to remove them, you should
     * call this method.
     *
     * @method hydrate
     * @static
     */
    hydrate(): void;
}

/**
 * Manages configuration by recursively reading all
 * `.js` files from the `config` folder.
 *
 * @alias Config
 * @binding Adonis/Src/Config
 * @group Core
 * @singleton
 *
 * @class Config
 * @constructor
 *
 * @param {String} configPath Absolute path from where to load the config files from
 */
interface Config {
    /**
     *
     * @param configPath
     */
    new (configPath : string): Config;

    /**
     * Syncs the in-memory config store with the
     * file system. Ideally you should keep your
     * config static and never update the file
     * system on the fly.
     *
     * @method syncWithFileSystem
     *
     * @return {void}
     * @return
     */
    syncWithFileSystem(): void;

    /**
     * Get value for a given key from the config store. Nested
     * values can be accessed via (dot notation). Values
     * referenced with `self::` are further resolved.
     *
     * @method get
     *
     * @param  {String} key
     * @param  {Mixed} [defaultValue]
     *
     * @return {Mixed}
     *
     * @example
     * ```
     * Config.get('database.mysql')
     *
     * // referenced
     * {
     *   prodMysql: 'self::database.mysql'
     * }
     * Config.get('database.prodMysql')
     * ```
     * @param key
     * @param defaultValue?
     * @return
     */
    get(key : string, defaultValue? : any): any;

    /**
     * Merge default values with the resolved values.
     * This is to provide a default set of values
     * when it does not exists. This method uses
     * lodash `_.mergeWith` method.
     *
     * @method merge
     *
     * @param  {String}   key
     * @param  {Object}   defaultValues
     * @param  {Function} [customizer]
     *
     * @return {Object}
     *
     * @example
     * ```js
     * Config.merge('services.redis', {
     *   port: 6379,
     *   host: 'localhost'
     * })
     * ```
     * @param key
     * @param defaultValues
     * @param customizer?
     * @return
     */
    merge(key : string, defaultValues : Object, customizer? : Function): Object;

    /**
     * Update value for a given key inside the config store. If
     * value does not exists it will be created.
     *
     * ## Note
     * This method updates the value in memory and not on the
     * file system.
     *
     * @method set
     *
     * @param  {String} key
     * @param  {Mixed}  value
     *
     * @example
     * ```js
     * Config.set('database.mysql.host', '127.0.0.1')
     *
     * // later get the value
     * Config.get('database.mysql.host')
     * ```
     * @param key
     * @param value
     */
    set(key : string, value : any): void;
}

/**
 * Manages the application environment variables by
 * reading the `.env` file from the project root.
 *
 * If `.env` file is missing, an exception will be thrown
 * to supress the exception, pass `ENV_SILENT=true` when
 * starting the app.
 *
 * Can define different location by setting `ENV_PATH`
 * environment variable.
 *
 * @binding Adonis/Src/Env
 * @group Core
 * @alias Env
 * @singleton
 *
 * @class Env
 * @constructor
 */
interface Env {

    /**
     *
     * @param appRoot
     */
    new (appRoot : string): Env;

    /**
     * Replacing dynamic values inside .env file
     *
     * @method _interpolate
     *
     * @param  {String}     env
     * @param  {Object}     envConfig
     *
     * @return {String}
     *
     * @private
     * @param env
     * @param envConfig
     * @return
     */
    _interpolate(env : string, envConfig : any): string;

    /**
     * Load env file from a given location.
     *
     * @method load
     *
     * @param  {String}  filePath
     * @param  {Boolean} [overwrite = 'true']
     * @param  {String}  [encoding = 'utf8']
     *
     * @return {void}
     * @param filePath
     * @param overwrite?
     * @param encoding?
     * @return
     */
    load(filePath : string, overwrite? : true, encoding? : 'utf-8'): void;

    /**
     * Returns the path from where the `.env`
     * file should be loaded.
     *
     * @method getEnvPath
     *
     * @return {String}
     * @return
     */
    getEnvPath(): string;

    /**
     * Get value for a given key from the `process.env`
     * object.
     *
     * @method get
     *
     * @param  {String} key
     * @param  {Mixed} [defaultValue = null]
     *
     * @return {Mixed}
     *
     * @example
     * ```js
     * Env.get('CACHE_VIEWS', false)
     * ```
     * @param key
     * @param defaultValue?
     * @return
     */
    get(key : string, defaultValue? : any): any;

    /**
     * Get value for a given key from the `process.env`
     * object or throw an error if the key does not exist.
     *
     * @method getOrFail
     *
     * @param  {String} key
     *
     * @return {Mixed}
     *
     * @example
     * ```js
     * Env.getOrFail('MAIL_PASSWORD')
     * ```
     * @param key
     * @return
     */
    getOrFail(key : string): any;

    /**
     * Set value for a given key inside the `process.env`
     * object. If value exists, will be updated
     *
     * @method set
     *
     * @param  {String} key
     * @param  {Mixed} value
     *
     * @return {void}
     *
     * @example
     * ```js
     * Env.set('PORT', 3333)
     * ```
     * @param key
     * @param value
     * @return
     */
    set(key : string, value : any): void;
}

type EventListeners = string | string[] | Function

/**
 * Event class is used to fire events and bind
 * listeners for them.
 *
 * This class makes use of eventemitter2 module
 *
 * @binding Adonis/Src/Event
 * @alias Event
 * @singleton
 * @group Core
 *
 * @class Event
 * @singleton
 */
interface Event {
    /**
     *
     * @param Config
     * @return
     */
    new (Config : Config): Event;

    /**
     * Resolves a listener via Ioc Container
     *
     * @method _resolveListener
     *
     * @param  {String|Function}         listener
     *
     * @return {Function}
     *
     * @private
     * @param listener
     * @return
     */
    _resolveListener(listener : string | Function): Function;

    /**
     * Returns a list of listeners registered
     * for an event
     *
     * @method getListeners
     *
     * @param  {String}  event
     *
     * @return {Array}
     *
     * @example
     * ```js
     * Event.getListeners('http::start')
     * ```
     * @param event
     * @return
     */
    getListeners(event : string): Array<string | Function>;

    /**
     * Returns a boolean indicating whether an
     * event has listeners or not
     *
     * @method hasListeners
     *
     * @param  {String}     event
     *
     * @return {Boolean}
     *
     * @example
     * ```js
     * Event.hasListeners('http::start')
     * ```
     * @param event
     * @return
     */
    hasListeners(event : string): boolean;

    /**
     * Returns an array of listeners binded for any
     * event.
     *
     * @method listenersAny
     *
     * @return {Array}
     *
     * @example
     * ```js
     * Event.getListenersAny()
     * ```
     * @return
     */
    getListenersAny(): Array<string | Function>;

    /**
     * Returns a count of total listeners registered
     * for an event
     *
     * @method listenersCount
     *
     * @param  {String}       event
     *
     * @return {Number}
     *
     * @example
     * ```js
     * Event.listenersCount('http::start')
     * ```
     * @param event
     * @return
     */
    listenersCount(event : string): number;

    /**
     * Bind a listener for an event
     *
     * @method when
     * @alias on
     *
     * @param  {String} event
     * @param  {Array|String|Function} listeners
     *
     * @return {void}
     *
     * @example
     * ```js
     * // Closure
     * Event.when('http::start', () => {
     * })
     *
     * // IoC container binding
     * Event.when('http::start', 'Http.onStart')
     *
     * // Multiple listeners
     * Event.when('http::start', ['Http.onStart', 'Http.registerViewGlobals'])
     * ```
     * @param event
     * @param listeners
     * @return
     */
    when(event : string, listeners : EventListener): void;

    /**
     * Emits an event
     *
     * @method emit
     * @alias fire
     *
     * @param  {String}    event
     * @param  {...Spread}    args
     *
     * @return {void}
     *
     * @example
     * ```js
     * Event.emit('http::start', server)
     * ```
     * @param event
     * @param ...args
     * @return
     */
    emit(event : string, ...args : any[]): void;

    /**
     * Emit an event
     *
     * @method fire
     * @alias emit
     *
     * @param  {String}    event
     * @param  {...Spread}    args
     *
     * @return {void}
     * @param event
     * @param ...args
     * @return
     */
    fire(event : string, ...args : any[]): any;

    /**
     * Bind a listener only for x number of times
     *
     * @method times
     *
     * @param  {Number} number
     *
     * @chainable
     *
     * @example
     * ```js
     * Event
     *   .times(3)
     *   .when('user::registers', () => {
     *   })
     * ```
     * @param number
     * @return
     */
    times(number : number): Event;

    /**
     * Bind a listener for an event
     *
     * @method on
     * @alias when
     *
     * @param  {String} event
     * @param  {Array|String|Function} listeners - A single or multiple listeners
     *
     * @return {void}
     *
     * @example
     * ```js
     * Event.on('http::start', function () {
     * })
     * ```
     * @param event
     * @param listeners
     * @return
     */
    on(event : string, listeners : EventListener): void;

    /**
     * Bind listener for any event
     *
     * @method onAny
     * @alias any
     *
     * @param  {String|Function|Array} listeners
     *
     * @return {void}
     *
     * @example
     * ```js
     * Event.onAny(function (event, data) {
     * })
     * ```
     * @param listeners
     * @return
     */
    onAny(listeners : EventListener): void;

    /**
     * Bind listener for any event
     *
     * @method any
     * @alias onAny
     *
     * @param  {String|Function|Array} listeners
     *
     * @return {void}
     * @param listeners
     * @return
     */
    any(listeners : EventListener): void;

    /**
     * Bind a listener only for one time
     *
     * @method once
     *
     * @param  {String} event
     * @param  {Array|Function|String} listeners
     *
     * @return {void}
     *
     * @example
     * ```js
     * Event.once('user::registerred', function (user) {
     * })
     * ```
     * @param event
     * @param listeners
     * @return
     */
    once(event : string, listeners : EventListener): void;

    /**
     * Remove listener for a given event.
     *
     * @method off
     * @alias removeListener
     *
     * @param  {String} event
     * @param  {Function|Array|String} listeners
     *
     * @return {void}
     *
     * @example
     * ```js
     * Event.off('user::registerred', 'User.registered')
     *
     * // remove multiple listeners
     * Event.off('user::registerred', ['User.registered', 'Send.email'])
     * ```
     * @param event
     * @param listeners
     * @return
     */
    off(event : string, listeners : EventListener): void;

    /**
     * Removes listeners binded for any event
     *
     * @method offAny
     *
     * @param  {Function|String|Array} listeners
     *
     * @return {void}
     *
     * @example
     * ```js
     * Event.offAny('Http.onStart')
     * ```
     * @param listeners
     * @return
     */
    offAny(listeners : EventListener): void;

    /**
     * Removes listener for a given event
     *
     * @method removeListener
     * @alias off
     *
     * @param  {String}       event
     * @param  {Function|String|Array}       listeners
     *
     * @return {void}
     * @param event
     * @param listeners
     * @return
     */
    removeListener(event : string, listeners : EventListener): void;

    /**
     * Removes all listeners for a given event
     *
     * @method removeAllListeners
     *
     * @param  {String}           event
     *
     * @return {void}
     *
     * @example
     * ```js
     * Event.remvoeAllListeners('http::start')
     * ```
     * @param event
     * @return
     */
    removeAllListeners(event : string): void;

    /**
     * Update max listeners size which is set to 10
     * by default.
     *
     * @method setMaxListeners
     *
     * @param  {Number}        number
     *
     * @example
     * ```js
     * Event.setMaxListeners(20)
     * ```
     * @param number
     */
    setMaxListeners(number : number): void;

    /**
     * Instantiate faker object, to stop emitting
     * real events
     *
     * @method fake
     *
     * @return {void}
     * @return
     */
    fake(): void;

    /**
     * Restore faker object
     *
     * @method restore
     *
     * @return {void}
     * @return
     */
    restore(): void;
}

/**
 * This class is used to encrypt/decrypt values using a secure
 * key and also base64 `encode` and `decode` strings.
 *
 * @binding Adonis/Src/Encryption
 * @alias Encryption
 * @group Core
 * @singleton
 *
 * @class Encryption
 * @constructor
 */
interface Encryption {
    /**
     *
     * @param appKey
     * @param options
     */
    new (appKey : string, options : Object): Encryption;

    /**
     * Encrypt a string, number or an object
     *
     * @method encrypt
     *
     * @param  {Mixed} input
     *
     * @return {String}
     *
     * @example
     * ```js
     * Encryption.encrypt('hello world')
     * Encryption.encrypt({ name: 'virk' })
     * ```
     * @param input
     * @return
     */
    encrypt(input : any): string;

    /**
     * Decrypt encoded string
     *
     * @method decrypt
     *
     * @param  {String} cipherText
     *
     * @return {Mixed}
     *
     * @example
     * ```js
     * Encryption.decrypt(encryptedValue)
     * ```
     * @param cipherText
     * @return
     */
    decrypt(cipherText : string): any;

    /**
     * Base64 encode a string
     *
     * @method base64Encode
     *
     * @param  {String}     input
     *
     * @return {String}
     *
     * @example
     * ```js
     * Encryption.base64Encode('hello world')
     * ```
     * @param input
     * @return
     */
    base64Encode(input : string): string;

    /**
     * Decode a previously encoded base64 string or buffer
     *
     * @method base64Decode
     *
     * @param  {String|Buffer}     encodedText
     *
     * @return {String}
     *
     * @example
     * ```js
     * Encryption.base64Decode(encodedValue)
     * ```
     * @param encodedText
     * @return
     */
    base64Decode(encodedText : string | Buffer): string;
}

type ExceptionHandler = (error: any, ctx: Http.Context) => void

interface BaseExceptionHandler {
    new (): BaseExceptionHandler;

    /**
     * Handles the exception by sending a response
     *
     * @method handle
     *
     * @param  {Object} error
     * @param  {Object} ctx
     *
     * @return {Mixed}
     * @param error
     * @param ctx
     * @return
     */
    handle(error : Object, ctx : Http.Context): Promise<void>;

    /**
     * Reports the error by invoking report on the exception
     * or pulls a custom defined reporter
     *
     * @method report
     *
     * @param  {Object} error
     * @param  {Object} ctx
     *
     * @return {void}
     * @param error
     * @param ctx
     * @return
     */
    report(error: Object, ctx: { request: Http.Request, auth: Object }): Promise<void>;
}

/**
 * The exception class is used to bind listeners
 * for specific exceptions or add a wildcard to
 * handle all exceptions.
 *
 * This module is used by the HTTP server to pull
 * exception handlers and call them to handle
 * the error.
 *
 * @binding Adonis/Src/Exception
 * @group Http
 * @alias Exception
 * @singleton
 *
 * @class Exception
 * @constructor
 */
interface Exception {
    new(): Exception;
    /**
     * Clear the handlers and reporters object.
     *
     * @method clear
     *
     * @return {void}
     * @return
     */
    clear(): void;

    /**
     * Returns the custom exception handler if defined
     *
     * @method getHandler
     *
     * @param {String} name
     *
     * @returns {Function|Undefined}
     * @param name
     * @return
     */
    getHandler(name : string): Function | undefined;

    /**
     * Returns the reporter for a given exception. Will fallback
     * to wildcard reporter when defined
     *
     * @method getReporter
     *
     * @param  {String}   name - The exception name
     * @param  {Boolean} [ignoreWildcard = false] Do not return wildcard handler
     *
     * @return {Function|Undefined}
     *
     * @example
     * ```
     * Exception.getReporter('UserNotFoundException')
     * ```
     * @param name
     * @return
     */
    getReporter(name : string): Function | undefined;

    /**
     * Bind handler for a single exception
     *
     * @method handle
     *
     * @param  {String}   name
     * @param  {Function} callback
     *
     * @chainable
     *
     * ```js
     * Exception.handle('UserNotFoundException', async (error, { request, response }) => {
     *
     * })
     * ```
     * @param name
     * @param callback
     * @return
     */
    handle(name : string, callback : ExceptionHandler): Exception;

    /**
     * Binding reporter for a given exception
     *
     * @method report
     *
     * @param  {String}   name
     * @param  {Function} callback
     *
     * @chainable
     *
     * @example
     * ```js
     * Exception.report('UserNotFoundException', (error, { request }) => {
     *
     * })
     * ```
     * @param name
     * @param callback
     * @return
     */
    report(name : string, callback : ExceptionHandler): Exception;

    _handlers : {}
    _reporters : {}
}

declare class Hash {
    /**
     * Hash plain value using the given driver.
     *
     * @method make
     * @async
     *
     * @param  {String} value
     * @param  {Object} config
     *
     * @return {String}
     *
     * @example
     * ```js
     * const hashed = await Hash.make('my-secret-password')
     * ```
     */
    make(value: string, rounds?: number): Promise<string>

    /**
     * Verify an existing hash with the plain value. Though this
     * method returns a promise, it never rejects the promise
     * and this is just for the sake of simplicity, since
     * bcrypt errors are not something that you can act
     * upon.
     *
     * @method verify
     * @async
     *
     * @param  {String} value
     * @param  {String} hash
     *
     * @return {Boolean}
     *
     * @example
     * ```
     * const verified = await Hash.verify('password', 'existing-hash')
     * if (verified) {
     * }
     * ```
     */
    verify(value: string, hash: string): Promise<boolean>
}

type Loglevels = {
    emerg   : 0,
    alert   : 1,
    crit    : 2,
    error   : 3,
    warning : 4,
    notice  : 5,
    info    : 6,
    debug   : 7,
};
type LogLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * The logger class is used to record logs through-out the
 * application. The class instance is generated by the
 * @ref('LoggerFacade') class.
 *
 * @group Core
 *
 * @class Logger
 * @constructor
 */
declare class Logger {
    /**
   * Hash of log levels used by Logger
   * internally.
   *
   * @attribute levels
   *
   * @return {Object}
   */
    levels: Loglevels;
    /**
   * Returns the current level for the driver
   *
   * @attribute level
   *
   * @return {String}
   */
    level: string;
    log(level: LogLevel, message: string, ...options: any[]): void
    debug(message: string, ...options: any[]): void
    info(message: string, ...options: any[]): void
    notice(message: string, ...options: any[]): void
    warning(message: string, ...options: any[]): void
    error(message: string, ...options: any[]): void
    crit(message: string, ...options: any[]): void
    alert(message: string, ...options: any[]): void
    emerg(message: string, ...options: any[]): void
}

interface FileError {
    fieldName : string,
    clientName: string,
    message   : string,
    type      : string
}

interface FileInformation {
    clientName: string,
    extname   : string,
    fileName  : string,
    fieldName : string,
    tmpPath   : string,
    headers   : any,
    size      : number,
    type      : string,
    subtype   : string,
    status    : string,
    error     : FileError,
}

interface FileOptions {
    types?    : string[],
    extnames? : string[],
    size?     : string | number,
}

interface MoveOptions {
    name? : string,
}

type moveCallback = (file: File, index: number) => MoveOptions;

/**
 * File class holds information and behavior related to a single file
 * accessed using `request.file` or `request.multipart.file`. It let
 * you stream or save user uploaded file to a given location.
 *
 * @class File
 * @constructor
 */
declare interface File {

	/**
	 *
	 * @param readStream
	 * @param options
	 */
	new (readStream : stream, options : FileOptions): File;

	/**
	 * Pushes an error to the errors array and also
	 * set the file status to `error`.
	 *
	 * @method setError
	 *
	 * @param  {String}   message
	 * @param  {String}   type
	 *
	 * @return {void}
	 * @param message
	 * @param type
	 * @return
	 */
	setError(message : string, type : string): void;

	/**
	 * Set validation options on the file instance
	 *
	 * @method setOptions
	 *
	 * @param  {Object}   options
	 *
	 * @chainable
	 * @param options
	 * @return
	 */
	setOptions(options : FileOptions): this;

	/**
	 * Set a custom validate function. It will be called before
	 * the move operation
	 *
	 * @method validate
	 *
	 * @param  {Function} callback
	 *
	 * @chainable
	 * @param callback
	 * @return
	 */
	validate(callback : Function): this;

	/**
	 * Read the file into buffer.
	 *
	 * @method read
	 *
	 * @return {Promise}
	 * @return
	 */
	read(): Promise<any>;

	/**
	 * Moves file to the `tmp` directory. After this all
	 * file descriptors are closed and stream cannot be
	 * used any more.
	 *
	 * @method moveToTmp
	 *
	 * @package {Function} tmpNameFn
	 *
	 * @return {Promise}
	 * @param tmpNameFn
	 * @return
	 */
	moveToTmp(tmpNameFn : Function): Promise<any>;

	/**
	 * Moves file from tmp directory to the user
	 * defined location.
	 *
	 * @method move
	 *
	 * @param  {String} location
	 * @param  {Object} options
	 *
	 * @return {Promise}
	 * @param location
	 * @param options
	 * @return
	 */
	move(location : string, options? : MoveOptions): Promise<void>;

	/**
	 * Returns the error if any
	 *
	 * @method errors
	 *
	 * @return {Array}
	 * @return
	 */
	error(): Array<any>;

	/**
	 * Returns a boolean indicating whether
	 * file has been moved or not
	 *
	 * @method moved
	 *
	 * @return {Boolean}
	 * @return
	 */
	moved(): boolean;

	/**
	 * Returns JSON representation of the file
	 *
	 * @method toJSON
	 *
	 * @return {Object}
	 * @return
	 */
    toJSON(): FileInformation;

    /**
     * Access to multipart stream
     *
     * @attribute stream
     *
     * @type {Stream}
     */
    stream : stream;

	/**
	 * File size
	 *
	 * @attribute size
	 *
	 * @type {Number}
	 */
	size : number;

	/**
	 * The file name uploaded the end user
	 *
	 * @attribute clientName
	 *
	 * @type {String}
	 */
	clientName : string;

	/**
	 * File extension
	 *
	 * @attribute extname
	 *
	 * @type {String}
	 */
	extname : string;

	/**
	 * The field name using which file was
	 * uploaded
	 *
	 * @attribute fieldName
	 *
	 * @type {String}
	 */
    fieldName : string;

    /**
     * Upload file header
     *
     * @attribute headers
     *
     * @type {Object}
     */
    headers : object;

	/**
	 * File name after move
	 *
	 * @attribute fileName
	 *
	 * @type {String|Null}
	 */
	fileName : string;

	/**
	 * File tmp path after `moveToTmp` is
	 * called.
	 *
	 * @attribute tmpPath
	 *
	 * @type {String|Null}
	 */
	tmpPath : string;

	/**
	 * Marked as ended when stream is consued
	 *
	 * @type {Boolean}
	 */
	ended : boolean;

	/**
	 * The file main type.
	 *
	 * @attribute type
	 *
	 * @type {String}
	 */
	type : string;

	/**
	 * The file subtype.
	 *
	 * @type {String}
	 */
	subtype : string;

	/**
	 * valid statuses are - pending, consumed, moved, error
	 * Consumed is set when readable stream ends.
	 *
	 * @attribute status
	 *
	 * @type {String}
	 */
	status : string;
}

/**
 * FileJar is store to keep multiple files of same nature. For
 * uploading multiple files will be bundled as `Jar` and you
 * can call methods on this class to perform bulk operations.
 *
 * @class FileJar
 * @constructor
 */
declare interface FileJar {

	/**
	 *
	 * @param files
	 */
	new (files : File[]): FileJar;

	/**
	 * An array of files inside the file jar
	 *
	 * @method files
	 *
	 * @return {Array<File>}
	 */
	files : Array<File>;

	/**
	 * Add a new file to the store
	 *
	 * @method track
	 *
	 * @param  {File} file
	 *
	 * @return {void}
	 * @param file
	 * @return
	 */
	track(file : File): void;

	/**
	 * Return all files inside the Jar. Also this method
	 * will `toJSON` on each file instance before
	 * returning.
	 *
	 * To get an array of file instances, call `fileJar.files()`
	 *
	 * @method all
	 *
	 * @return {Array}
	 * @return
	 */
	all(): Array<FileInformation>;

	/**
	 * Returns an array of files that have been moved successfully.
	 * `file.toJSON()` is called before returing file.
	 *
	 * @method movedList
	 *
	 * @return {Array}
	 * @return
	 */
	movedList(): Array<FileInformation>;

	/**
	 * Returns a boolean indicating whether all files have been moved
	 * or not.
	 *
	 * @method movedAll
	 *
	 * @return {Boolean}
	 * @return
	 */
	movedAll(): boolean;

	/**
	 * Moves all files to the given location parallely
	 *
	 * @method moveAll
	 *
	 * @param  {String} location
	 * @param  {Function} callback
	 *
	 * @return {Promise}
	 *
	 * @example
	 * ```js
	 * fileJar.moveAll(Helpers.tmpPath('uploads'), function (file) {
	 *   return { name: new Date().getTime() }
	 * })
	 * ```
	 * @param location
	 * @param callback
	 * @return
	 */
	moveAll(location : string, callback? : moveCallback): Promise<void>;

	/**
	 * Returns an array errors occured during file move.
	 *
	 * @method errors
	 *
	 * @return {Array}
	 * @return
	 */
	errors(): Array<any>;
}

/**
 * Multipart class does all the heavy lifting of processing multipart
 * data and allows lazy access to the uploaded files. Ideally this
 * class is used by the BodyParser middleware but if `autoProcess`
 * is set to false, you can use this class manually to read file
 * streams and process them.
 *
 * @class Multipart
 * @constructor
 */
declare interface Multipart {

	/**
	 *
	 * @param request
	 * @param disableJar
	 */
    new (request : Http.Request, disableJar : boolean): Multipart;

    /**
     * Storing instance to file jar. Attaching as an helper
     * so that users using this class directly can use
     * some helper methods to know the upload status.
     *
     * This attribute is optional and disabled by the BodyParser
     * when bodyparser middleware using the multipart class
     * for autoProcessing all files.
     *
     * @type {FileJar}
     *
     * @attribute jar
     */
    jar : FileJar;

	/**
	 * Executed for each part in stream. Returning
	 * promise or consuming the stream will
	 * advance the process.
	 *
	 * @method onPart
	 *
	 * @param  {Stream} part
	 *
	 * @return {Promise}
	 * @param part
	 * @return
	 */
	onPart(part : stream): Promise<any>;

	/**
	 * Process files by going over each part of the stream. Files
	 * are ignored when there are no listeners listening for them.
	 *
	 * @method process
	 *
	 * @return {Promise}
	 * @return
	 */
	process(): Promise<void>;

	/**
	 * Add a listener to file. It is important to attach a callback and
	 * handle the processing of the file. Also only one listener can
	 * be added at a given point of time, since 2 parties processing
	 * a single file doesn't make much sense.
	 *
	 * @method file
	 *
	 * @param  {String}   name
	 * @param  {Object}   options
	 * @param  {Function} callback
	 *
	 * @chainable
	 * @param name
	 * @param options
	 * @param callback
	 * @return
	 */
    file(name: string, options: FileOptions, callback: (file: File) => any): Multipart;

	/**
	 * Attach a listener to get fields name/value. Callback
	 * will be executed for each field inside multipart
	 * form/data.
	 *
	 * @method field
	 *
	 * @param  {Function} callback
	 *
	 * @chainable
	 * @param callback
	 * @return
	 */
    field(callback: (name: string, value: string) => void): Multipart;
}

declare namespace Http {
    /**
     * A facade over Node.js HTTP `req` object, making it
     * easier and simpler to access request information.
     * You can access the original **req** object as
     * `request.request`
     *
     * @binding Adonis/Src/Request
     * @group Http
     *
     * @class Request
     * @constructor
     */
    interface Request extends Macroable {
        /**
         * Reference to native HTTP request object
         *
         * @attribute request
         * @type {Object}
         */
        request: Object

        /**
         * Reference to route params. This will be set by server
         * automatically once the route has been resolved.
         *
         * @attribute params
         * @type {Object}
         */
        params: Object

        /**
         * Reference to native HTTP response object
         *
         * @attribute response
         * @type {Object}
         */
        response: Object

        /**
         * Reference to config provider to read
         * http specific settings.
         *
         * @attribute Config
         * @type {Object}
         */
        Config: Object

        /**
         * The qs object
         *
         * @type {Object}
         */
        _qs: Object

        /**
         * Reference to request body
         *
         * @type {Object}
         */
        _body: Object

        /**
         * Reference to raw body
         *
         * @type {Object}
         */
        _raw: Object

        /**
          * A merged object of get and post
          *
          * @type {Object}
          */
        _all: Object

        /**
          *
          * @param request
          * @param response
          * @param Config
          */
        new (request : Object, response : Object, Config : Object): Request;

        /**
          * Returns a boolean indicating if user is a bad safari.
          * This method is used by the `fresh` method to address
          * a known bug in safari described [here](http://tech.vg.no/2013/10/02/ios7-bug-shows-white-page-when-getting-304-not-modified-from-server/)
          *
          * @method _isBadSafari
          *
          * @return {Boolean}
          *
          * @private
          * @return
          */
        _isBadSafari(): boolean;

        /**
         * Mutate request body, this method will
         * mutate the `all` object as well
         *
         * @method body
         *
         * @param  {Object} body
         *
         * @return {Object}
         */
        body: Object;

        /**
          * Returns query params from HTTP url.
          *
          * @method get
          *
          * @return {Object}
          *
          * @example
          * ```js
          * request.get()
          * ```
          * @return
          */
        get(): /* !this._qs */ Object;

        /**
          * Returns an object of request body. This method
          * does not parses the request body and instead
          * depends upon the body parser middleware
          * to set the private `_body` property.
          *
          * No it's not against the law of programming, since AdonisJs
          * by default is shipped with body parser middleware.
          *
          * @method post
          *
          * @return {Object}
          *
          * @example
          * ```js
          * request.body()
          * ```
          * @return
          */
        post(): /* !this.body */ Object;

        /**
          * Returns an object after merging {{#crossLink "Request/get"}}{{/crossLink}} and
          * {{#crossLink "Request/post"}}{{/crossLink}} values
          *
          * @method all
          *
          * @return {Object}
          *
          * @example
          * ```js
          * request.all()
          * ```
          * @return
          */
        all(): /* !this._all */ Object;

        /**
          * Returns request raw body
          *
          * @method raw
          *
          * @return {Object}
          * @return
          */
        raw(): /* !this._raw */ Object;

        /**
          * Returns an array of key/value pairs for the defined keys.
          * This method is super helpful when your HTML forms sends
          * an array of values and you want them as individual
          * objects to be saved directly via Lucid models.
          *
          * # Note
          * This method always returns a stable array by setting value for
          * `undefined` keys to `null`. For example your data payload has
          * 3 emails and 2 usernames, the final array will have 3
          * objects with all the emails and the last object will
          * have `username` set to `null`.
          *
          * @method collect
          *
          * @param  {Array} keys
          *
          * @return {Array}
          *
          * @example
          * ```js
          * // data {username: ['virk', 'nikk'], age: [26, 25]}
          * const users = request.collect(['username', 'age'])
          * // returns [{username: 'virk', age: 26}, {username: 'nikk', age: 25}]
          * ```
          * @param keys
          * @return
          */
        collect(keys : string[]): Object[];

        /**
          * Returns the value from the request body or
          * query string, but only for a single key.
          *
          * @method input
          *
          * @param {String} key
          * @param {Mixed}  [defaultValue]
          *
          * @return {Mixed} Actual value or the default value falling back to `null`
          * @param key
          * @param defaultValue?
          * @return
          */
        input(key : string, defaultValue? : any): any;

        /**
          * Returns everything from request body and query
          * string except the given keys.
          *
          * @param {Array} keys
          *
          * @method except
          *
          * @return {Object}
          *
          * @example
          * ```js
          * request.except(['username', 'age'])
          * ```
          * @param keys
          * @return
          */
        except(keys : string[]): Object;

        /**
          * Returns value for only given keys.
          *
          * @method only
          *
          * @param  {Array} keys
          *
          * @return {Object}
          *
          * @example
          * ```js
          * request.only(['username', 'age'])
          * ```
          * @param keys
          * @return
          */
        only(keys : string[]): Object;

        /**
          * Returns the http request method, it will give preference
          * to spoofed method when `http.allowMethodSpoofing` is
          * enabled inside the `config/app.js` file.
          *
          * Make use of {{#crossLink "Request/intended"}}{{/crossLink}} to
          * get the actual method.
          *
          * @method method
          *
          * @return {String} Request method always in uppercase
          * @return
          */
        method(): string;

        /**
          * Returns the intended method for HTTP request. This method
          * is useful when you have method spoofing enabled and wants
          * the actual request method.
          *
          * @method intended
          *
          * @return {String} Request method always in uppercase
          * @return
          */
        intended(): string;

        /**
          * Returns HTTP request headers.
          *
          * @method headers
          *
          * @return {Object}
          * @return
          */
        headers(): any;

        /**
          * Returns header value for a given key.
          *
          * @method header
          *
          * @param  {String} key
          * @param  {Mixed} [defaultValue]
          *
          * @return {Mixed} Actual value or the default value, falling back to `null`
          * @param key
          * @param defaultValue?
          * @return
          */
        header(key : string, defaultValue? : any): any;

        /**
          * Returns the most trusted ip address for a given
          * HTTP request.
          *
          * @method ip
          *
          * @param {Trust} [trust = Config.get('app.http.trustProxy')]
          *
          * @return {String}
          * @param trust?
          * @return
          */
        ip(trust? : boolean): string;

        /**
          * Returns an array of ips from most to the least trust one.
          * It will remove the default ip address, which can be
          * accessed via `ip` method.
          *
          * Also when trust is set to true, It will look into `X-Forwaded-For`
          * header to pull the ip address set by client or your proxy server.
          *
          * @method ips
          *
          * @param {Trust} [trust = Config.get('app.http.trustProxy')]
          *
          * @return {Array}
          * @param trust?
          * @return
          */
        ips(trust? : boolean): string[];

        /**
          * Returns the protocol for the request.
          *
          * @method protocol
          *
          * @param  {Trust} [trust = Config.get('app.http.trustProxy')]
          *
          * @return {String}
          * @param trust?
          * @return
          */
        protocol(trust? : boolean): string;

        /**
          * Returns a boolean indicating whether request is
          * on https or not
          *
          * @method secure
          *
          * @return {Boolean}
          * @return
          */
        secure(): boolean;

        /**
          * Returns an array of subdomains. It will exclude `www`
          * from the list.
          *
          * @method subdomains
          *
          * @param  {Trust}   [trust = Config.get('app.http.trustProxy')]
          * @param  {Number}  [offset = Config.get('app.http.subdomainOffset')]
          *
          * @return {Array}
          * @param trust?
          * @param offset?
          * @return
          */
        subdomains(trust? : boolean, offset? : number): string[];

        /**
          * Returns a boolean indicating whether request
          * is ajax or not.
          *
          * @method ajax
          *
          * @return {Boolean}
          * @return
          */
        ajax(): boolean;

        /**
          * Returns a boolean indicating whether request
          * is pjax or not.
          *
          * @method pjax
          *
          * @return {Boolean}
          * @return
          */
        pjax(): boolean;

        /**
          * Returns the hostname for the request
          *
          * @method hostname
          *
          * @param  {Mixed} [trust = Config.get('app.http.trustProxy')]
          *
          * @return {String}
          * @param trust?
          * @return
          */
        hostname(trust? : boolean): string;

        /**
          * Returns url without query string for the HTTP request.
          *
          * @method url
          *
          * @return {String}
          * @return
          */
        url(): string;

        /**
          * Returns originalUrl for the HTTP request.
          *
          * @method originalUrl
          *
          * @return {String}
          * @return
          */
        originalUrl(): string;

        /**
          *
          * @param types
          */
        is(types : string[]): void;

        /**
          * Returns the best accepted response type based from
          * the `Accept` header. If no `types` are provided
          * the return value will be array containing all
          * the `Accept` header values.
          *
          * @method accepts
          *
          * @param  {Array} [types]
          *
          * @return {String|Array}
          * @param types?
          * @return
          */
        accepts(types? : string[]): string | string[];

        /**
          * Similar to `accepts`, but always returns an array of
          * values from `Accept` header, starting from most
          * preferred from least.
          *
          * @method types
          *
          * @return {Array}
          * @return
          */
        types(): string[];

        /**
          * Returns request language based upon HTTP `Accept-Language`
          * header. This method will filter from the list of
          * acceptedLanguages array.
          *
          * @method language
          *
          * @param  {Array} [acceptedLanguages]
          *
          * @return {String}
          * @param acceptedLanguages?
          * @return
          */
        language(acceptedLanguages? : string[]): string;

        /**
          * Returns an array of request languages based on HTTP `Accept-Language`
          * header.
          *
          * @method languages
          *
          * @return {Array}
          * @return
          */
        languages(): string[];

        /**
          * Returns most preferred encoding based upon `Accept-Encoding`
          * header. This method will filter encodings based upon on
          * the acceptedEncodings string
          *
          * @method encoding
          *
          * @param  {Array} [acceptedEncodings]
          *
          * @return {String}
          * @param acceptedEncodings?
          * @return
          */
        encoding(acceptedEncodings? : string[]): string;

        /**
          * Returns an array of encodings based upon `Accept-Encoding`
          * header.
          *
          * @method encodings
          *
          * @return {Array}
          * @return
          */
        encodings(): string[];

        /**
          * Returns most preferred charset based upon the `Accept-Charset`
          * header. This method will filter from the list of acceptedCharsets
          * parameter.
          *
          * @method charset
          *
          * @param  {Array} acceptedCharsets
          *
          * @return {String}
          * @param acceptedCharsets
          * @return
          */
        charset(acceptedCharsets : string[]): string;

        /**
          * Returns an array of charsets based upon `Accept-Charset`
          * header.
          *
          * @method charsets
          *
          * @return {Array}
          * @return
          */
        charsets(): string[];

        /**
          * Returns a boolean indicating whether request has
          * body or not
          *
          * @method hasBody
          *
          * @return {Boolean}
          * @return
          */
        hasBody(): boolean;

        /**
          * Returns an object of all the cookies. Make sure always
          * to define the `secret` inside `config/app.js` file,
          * since all cookies are signed and encrypted.
          *
          * This method will make use of `app.secret` from the config
          * directory.
          *
          * @method cookies
          *
          * @return {Object}
          * @return
          */
        cookies(): { [key: string]: string };

        /**
          * Returns cookies without decrypting or unsigning them
          *
          * @method plainCookies
          *
          * @return {Object}
          * @return
          */
        plainCookies(): { [key: string]: string };

        /**
          * Returns cookie value for a given key.
          *
          * This method will make use of `app.secret` from the config
          * directory.
          *
          * @method cookie
          *
          * @param  {String} key
          * @param  {Mixed} [defaultValue]
          *
          * @return {Mixed}
          * @param key
          * @param defaultValue?
          * @return
          */
        cookie(key : string, defaultValue? : any): any;

        /**
          * Return raw value for a given key. Cookie will not be
          * encrypted or unsigned.
          *
          * @method plainCookie
          *
          * @param  {String}    key
          * @param  {Mixed}     [defaultValue]
          *
          * @return {Mixed}
          * @param key
          * @param defaultValue?
          * @return
          */
        plainCookie(key : string, defaultValue? : any): any;

        /**
          * Returns a boolean indicating whether request url
          * matches any of the given route formats.
          *
          * @method match
          *
          * @param  {Array} routes
          *
          * @return {Boolean}
          *
          * @example
          * ```js
          * request.match(['/user/:id', 'user/(+.)'])
          * ```
          * @param routes
          * @return
          */
        match(routes : string[]): boolean;

        /**
          * Returns the freshness of a response inside the client cache.
          * If client cache has the latest response, this method will
          * return true, otherwise it will return false.
          *
          *
          * Also when HTTP header Cache-Control: no-cache is present this method will return false everytime.
          *
          * @method fresh
          *
          * @return {Boolean}
          * @return
          */
        fresh(): boolean;

        /**
          * The opposite of {{#crossLink "Request/fresh"}}{{/crossLink}} method.
          *
          * @method stale
          *
          * @return {Boolean}
          * @return
          */
        stale(): boolean;

        /**
          * Returns the request format from the URL params
          *
          * @method format
          *
          * @return {String}
          * @return
          */
        format(): string;

        /**
         * Request macro to access a file from the uploaded
         * files.
         *
         * @example
	     * ```js
         * request.file('profile_images', {
         *       types: ['image'],
         *       size: '2mb',
         *   })
         * ```
         */
        file(name: string, options?: FileOptions): File & FileJar;

        multipart: Multipart;
    }

    /**
      * Abort exception is raised when `response.abortIf` or
      * `response.abortUnless` called.
      *
      * @class AbortException
      * @constructor
      */
    interface AbortException {
        /**
          * Handling the exception itself.
          *
          * @method handle
          *
          * @param  {Object} error
          * @param  {Object} options.response
          * @param  {Object} options.session
          *
          * @return {void}
          * @param error
          * @param undefined
          * @param session}
          * @return
          */
        handle(error : Object, options: Object): Promise<void>;

        /**
          * Return error object with body and status
          *
          * @method invoke
          *
          * @param  {String} [body = 'Request aborted']
          * @param  {Number} [status = 400]
          *
          * @return {AbortException}
          */
        invoke(body? : 'Request aborted', status? : 400): AbortException;

        /**
          *
          */
        body : string;
    }

    //node-res
    type nodeRes = {
        [key in
            'continue'                     |
            'switchingProtocols'           |
            'ok'                           |
            'created'                      |
            'accepted'                     |
            'nonAuthoritativeInformation'  |
            'noContent'                    |
            'resetContent'                 |
            'partialContent'               |
            'multipleChoices'              |
            'movedPermanently'             |
            'found'                        |
            'seeOther'                     |
            'notModified'                  |
            'useProxy'                     |
            'temporaryRedirect'            |
            'badRequest'                   |
            'unauthorized'                 |
            'paymentRequired'              |
            'forbidden'                    |
            'notFound'                     |
            'methodNotAllowed'             |
            'notAcceptable'                |
            'proxyAuthenticationRequired'  |
            'requestTimeout'               |
            'conflict'                     |
            'gone'                         |
            'lengthRequired'               |
            'preconditionFailed'           |
            'requestEntityTooLarge'        |
            'requestUriTooLong'            |
            'unsupportedMediaType'         |
            'requestedRangeNotSatisfiable' |
            'expectationFailed'            |
            'unprocessableEntity'          |
            'tooManyRequests'              |
            'internalServerError'          |
            'notImplemented'               |
            'badGateway'                   |
            'serviceUnavailable'           |
            'gatewayTimeout'               |
            'httpVersionNotSupported'
        ]: (content: any, generateEtag: string) => void
    };

    /**
      * A facade over Node.js HTTP `res` object, making it
      * easier and simpler to make HTTP response. You can
      * access the original **response** object as
      * `response.response`
      *
      * @binding Adonis/Src/Response
      * @group Http
      *
      * @class Response
      */
    interface Response extends Macroable, nodeRes {
        /**
          * Reference to adonisjs request
          *
          * @type {Request}
          */
        adonisRequest: Request;

        /**
          * Reference to native HTTP request object
          *
          * @attribute request
          * @type {Object}
          */
        request: Object;

        /**
          * Reference to native HTTP response object
          *
          * @attribute response
          * @type {Object}
          */
        response: Object;

        /**
          * Implicitly end the response. If you set it
          * to false, calling `response.end` will
          * end the response.
          *
          * @type {Boolean}
          */
        implicitEnd: boolean;

            /**
          * returns whether request has been
          * finished or not
          *
          * @attribute finished
          *
          * @return {Boolean}
          */
        finished: boolean;

            /**
          * returns whether request headers
          * have been sent or not
          *
          * @attribute headersSent
          *
          * @return {Boolean}
          */
        headersSent: boolean;

            /**
          * returns whether a request is pending
          * or not
          *
          * @attribute isPending
          *
          * @return {Boolean}
          */
        isPending: boolean;

        /**
          *
          * @param adonisRequest
          * @param Config
          */
        new (adonisRequest : Request, Config : Object): Response;

        /**
          * Returns a boolean indicating whether etag should be generated
          * for a request or not.
          *
          * @method _generateEtag
          *
          * @param  {Boolean}      setToTrue
          * @param  {Boolean}     hasBody
          *
          * @return {Boolean}
          *
          * @private
          * @param setToTrue
          * @param hasBody
          * @return
          */
        _generateEtag(setToTrue : boolean, hasBody : boolean): boolean;

        /**
          * Writes response to the res object
          *
          * @method _writeResponse
          *
          * @param  {String}       method
          * @param  {Mixed}       content
          * @param  {Array}       args
          *
          * @return {void}
          *
          * @private
          * @param method
          * @param content
          * @param args
          * @return
          */
        _writeResponse(method : string, content : any, args : Array<any>): void;

        /**
          * Sets the response body. If implicitEnd is set to `false`,
          * then it will end the response right away, otherwise
          * will store it to be sent later.
          *
          * @method _invoke
          *
          * @param  {String} method
          * @param  {Mixed} content
          * @param  {Array} args
          *
          * @return {void}
          *
          * @private
          * @param method
          * @param content
          * @param args
          * @return
          */
        _invoke(method : string, content : any, args : Array<any>): void;

        /**
          * Set the response status code.
          *
          * @method status
          *
          * @param  {Number} statusCode
          *
          * @chainable
          * @param statusCode
          * @return
          */
        status(statusCode : number): Response;

        /**
          * Set HTTP response header. Resetting same header
          * multiple times will append to the existing
          * value.
          *
          * @method header
          *
          * @param  {String} key
          * @param  {String} value
          *
          * @chainable
          * @param key
          * @param value
          * @return
          */
        header(key : string, value : string): Response;

        /**
          * Set HTTP response header only if it does not
          * exists already
          *
          * @method safeHeader
          *
          * @param  {String}   key
          * @param  {String}   value
          *
          * @chainable
          * @param key
          * @param value
          * @return
          */
        safeHeader(key : string, value : string): Response;

        /**
          * Remove the existing HTTP response header.
          *
          * @method removeHeader
          *
          * @param  {String}     key
          *
          * @chainable
          * @param key
          * @return
          */
        removeHeader(key : string): Response;

        /**
          * Returns the value of header for a given key.
          *
          * @method getHeader
          *
          * @param  {String}  key
          *
          * @return {Mixed}
          * @param key
          * @return
          */
        getHeader(key : string): string | void;

        /**
          * Stream a file to the client as HTTP response.
          *
          * Options are passed directly to [send](https://www.npmjs.com/package/send)
          *
          * @method download
          *
          * @param  {String} filePath
          * @param  {Object} options
          *
          * @return {void}
          * @param filePath
          * @param options
          * @return
          */
        download(filePath : string, options? : {}): void;

        /**
          * Force download the file by setting `Content-disposition`
          * header.
          *
          * @method attachment
          *
          * @param  {String}   filePath
          * @param  {String}   [name]
          * @param  {String}   [disposition]
          * @param  {Object}   [options = {}]
          *
          * @return {void}
          * @param filePath
          * @param name?
          * @param disposition?
          * @param options?
          * @return
          */
        attachment(filePath : string, name? : string, disposition? : string, options? : {}): void;

        /**
          * Set the `Location` header on HTTP response.
          *
          * @method location
          *
          * @param  {String} url
          *
          * @chainable
          * @param url
          * @return
          */
        location(url : string): Response;

        /**
          * Redirect the request by setting the `Location`
          * header and ending the response
          *
          * @method redirect
          *
          * @param  {String} url
          * @param  {Boolean} [sendParams = false]
          * @param  {Number} [status = 302]
          *
          * @return {void}
          * @param url
          * @param sendParams?
          * @param status?
          * @return
          */
        redirect(url : string, sendParams? : false, status? : 302): void;

        /**
          * Redirect to a specific route
          *
          * @method route
          *
          * @param  {String} routeNameOrHandler
          * @param  {Object} [data = {}]
          * @param  {String} [domain]
          * @param  {Boolean} [sendParams = false]
          * @param  {Number} [status = 302]
          *
          * @return {void}
          * @param routeNameOrHandler
          * @param data?
          * @param domain?
          * @param sendParams?
          * @param status?
          * @return
          */
        route(routeNameOrHandler : string, data? : {}, domain? : string, sendParams? : false, status? : 302): void;

        /**
          * Add the HTTP `Vary` header
          *
          * @method vary
          *
          * @param  {String} field
          *
          * @chainable
          * @param field
          * @return
          */
        vary(field : string): Response;

        /**
          * Sets the `Content-type` header based on the
          * type passed to this method.
          *
          * @method type
          *
          * @param  {String} type
          * @param  {String} [charset]
          *
          * @chainable
          * @param type
          * @param charset?
          * @return
          */
        type(type : string, charset? : string): Response;

        /**
          * Sets the response body for the HTTP request.
          *
          * @method send
          *
          * @param  {*} body
          * @param  {Boolean} generateEtag
          *
          * @return {void}
          * @param body
          * @param generateEtag
          * @return
          */
        send(body : any, generateEtag? : boolean): void;

        /**
          * Sets the response body for the HTTP request with
          * explicit `content-type` set to `application/json`.
          *
          * @method json
          *
          * @param  {Object} body
          * @param  {Boolean} generateEtag
          *
          * @return {void}
          * @param body
          * @param generateEtag
          * @return
          */
        json(body : any, generateEtag? : boolean): void;

        /**
          * Sets the response body for the HTTP request with
          * explicit `content-type` set to `text/javascript`.
          *
          * @method jsonp
          *
          * @param  {Object} body
          * @param  {String} [callbackFn = 'callback'] - Callback name.
          * @param  {Boolean} generateEtag
          *
          * @return {void}
          * @param body
          * @param callbackFn?
          * @param generateEtag
          * @return
          */
        jsonp(body : any, callbackFn? : Function, generateEtag? : boolean): void;

        /**
          * Ends the response by setting the `_lazyBody` as the
          * response body.
          *
          * @method end
          *
          * @return {void}
          * @return
          */
        end(): void;

        /**
          * Send cookie with the http response
          *
          * @method cookie
          *
          * @param  {String} key
          * @param  {Mixed} value
          * @param  {Object} [options = {}]
          *
          * @return {void}
          * @param key
          * @param value
          * @param options?
          * @return
          */
        cookie(key : string, value : any, options? : {}): void;

        /**
          * Set plain cookie HTTP response
          *
          * @method plainCookie
          *
          * @param  {String}    key
          * @param  {Mixed}    value
          * @param  {Object}    [options = {}]
          *
          * @return {void}
          * @param key
          * @param value
          * @param options?
          * @return
          */
        plainCookie(key : string, value : any, options? : {}): void;

        /**
          * Remove existing cookie using it's key
          *
          * @method clearCookie
          *
          * @param  {String}    key
          *
          * @param  {Object}    [options = {}]
          *
          * @return {void}
          * @param key
          * @param options?
          * @return
          */
        clearCookie(key : string, options? : {}): void;

        /**
          * Aborts the request (when expression is truthy) by throwing an exception.
          * Since AdonisJs allows exceptions to handle themselves, it simply makes
          * an response when handling itself.
          *
          * @method abortIf
          *
          * @param  {Mixed} expression
          * @param  {Number} status [status = 400]
          * @param  {Mixed} body [body = 'Request aborted']
          *
          * @return {void}
          *
          * @throws {AbortException} If expression is thruthy
          * @param expression
          * @param status
          * @param body
          * @return
          */
        abortIf(expression : any, status? : number, body? : any): void;

        /**
          * Aborts the request (when expression is falsy) by throwing an exception.
          * Since AdonisJs allows exceptions to handle themselves, it simply makes
          * an response when handling itself.
          *
          * @method abortUnless
          *
          * @param  {Mixed} expression
          * @param  {Number} status [status = 400]
          * @param  {Mixed} body [body = 'Request aborted']
          *
          * @return {void}
          *
          * @throws {AbortException} If expression is falsy
          * @param expression
          * @param status
          * @param body
          * @return
          */
        abortUnless(expression : any, status? : number, body? : any): void;
    }

    class Session {
        /**
         *
         * @param request
         * @param response
         * @param driverInstance
         * @param Config
         */
        new (request : Request, response : Response, driverInstance : Object, Config : Object): Session;

        /**
         * A boolean flag telling whether store has been
         * initiated or not
         *
         * @attribute initiated
         *
         * @return {Boolean}
         */
        initiated : boolean;

        /**
         * Instantiate session object
         *
         * @method instantiate
         *
         * @return {void}
         * @param freezed
         * @return
         */
        instantiate(freezed : boolean): Promise<void>;

        /**
         * Saves the final set of session values to the
         * driver instance
         *
         * @method commit
         *
         * @return {void}
         * @return
         */
        commit(): Promise<void>;

        /**
          * Put value to the existing key/value pairs
          *
          * @method put
          *
          * @param  {String} key
          * @param  {Mixed} value
          *
          * @return {void}
          *
          * @example
          * ```js
          * Store.put('name', 'virk')
          *
          * // saving object
          * Store.put('user', { username: 'virk', age: 27 })
          * ```
          * @param key
          * @param value
          * @return
          */
        put(key : string, value : any): void;

        /**
          * Returns value for a given key
          *
          * @method get
          *
          * @param  {String} key
          * @param  {Mixed} [defaultValue]
          *
          * @return {Mixed}
          *
          * @example
          * ```js
          * Store.get('username')
          *
          * // with default value
          * Store.get('username', 'virk')
          * ```
          * @param key
          * @param defaultValue?
          * @return
          */
        get(key : string, defaultValue? : any): any;

        /**
          * Increment value of a key.
          *
          * @method increment
          *
          * @param  {String}  key
          * @param  {Number}  [steps = 1]
          *
          * @return {void}
          *
          * @throws {Error} If the value are you incrementing is not a number
          *
          * @example
          * ```js
          * Store.increment('age')
          * ```
          * @param key
          * @param steps?
          * @return
          */
        increment(key : string, steps? : number): void;

        /**
          * Decrement value of a key
          *
          * @method decrement
          *
          * @param  {String}  key
          * @param  {Number}  [steps = 1]
          *
          * @return {void}
          *
          * @throws {Error} If the value are you decrementing is not a number
          *
          * @example
          * ```js
          * Store.decrement('age')
          * ```
          * @param key
          * @param steps?
          * @return
          */
        decrement(key : string, steps? : number): void;

        /**
          * Remove key/value pair from store
          *
          * @method forget
          *
          * @param  {String} key
          *
          * @return {void}
          *
          * @example
          * ```js
          * Store.forget('username')
          * Store.get('username') // null
          * ```
          * @param key
          * @return
          */
        forget(key : string): void;

        /**
          * Returns a cloned copy of existing values
          *
          * @method all
          *
          * @return {Object}
          * @return
          */
        all(): Object;

        /**
          * Returns value for a given key and removes
          * it from the store at the same time
          *
          * @method pull
          *
          * @param  {String} key
          * @param  {Mixed} [defaultValue]
          *
          * @return {Mixed}
          *
          * @example
          * ```js
          * const username = Store.pull('username')
          * Store.get('username') // null
          * ```
          * @param key
          * @param defaultValue?
          * @return
          */
        pull(key : string, defaultValue? : any): any;

        /**
          * Clears the existing values from store
          *
          * @method clear
          *
          * @return {void}
          * @return
          */
        clear(): void;

        /**
         * Flash entire request object to the session
         *
         * @method flashAll
         *
         * @chainable
         * @return
         */
        flashAll(): Session;

        /**
         * Flash only selected fields from request data to
         * the session
         *
         * @method flashOnly
         *
         * @param  {...Spread} fields
         *
         * @chainable
         * @param ...fields
         * @return
         */
        flashOnly(...fields : Array<string>): Session;

        /**
         * Flash request data to the session except
         * certain fields
         *
         * @method flashExcept
         *
         * @param  {...Spread} fields
         *
         * @chainable
         * @param ...fields
         * @return
         */
        flashExcept(...fields : Array<string>): Session;

        /**
         * Flash errors to the session
         *
         * @method withErrors
         *
         * @param  {Object}   errors
         *
         * @chainable
         * @param errors
         * @return
         */
        withErrors(errors : Object): Session;

        /**
         * Flash data to the session
         *
         * @method flash
         *
         * @param  {Object} data
         *
         * @chainable
         * @param data
         * @return
         */
        flash(data : Object): Session;

        /**
          * Returns json representation of object with
          * properly stringfied values
          *
          * @method toJSON
          *
          * @return {Object}
          * @return
          */
        toJSON(): { [key: string]: any };
    }

    /**
      * An instance of this class is passed to all route handlers
      * and middleware. Also different part of applications
      * can bind getters to this class.
      *
      * @binding Adonis/Src/HttpContext
      * @alias HttpContext
      * @group Http
      *
      * @class Context
      * @constructor
      *
      * @example
      * ```js
      * const Context = use('Context')
      *
      * Context.getter('view', function () {
      *   return new View()
      * }, true)
      *
      * // The last option `true` means the getter is singleton.
      * ```Object
      */
    interface Context extends Macroable {
        new (req : Object, res : Object): Context;

        auth       : Auth;
        params     : WorkInProgress;
        req        : http.IncomingMessage;
        res        : http.ServerResponse;
        request    : Http.Request;
        response   : Http.Response;
        session    : Http.Session;
        subdomains : WorkInProgress;
        view       : View;

        /**
         * Hydrate the context constructor
         *
         * @method hydrate
         *
         * @return {void}
         */
        hydrate(): void;

        /**
         * Define onReady callbacks to be executed
         * once the request context is instantiated
         *
         * @method onReady
         *
         * @param  {Function} fn
         *
         * @chainable
         */
        onReady(fn: Handler): this;
    }

    type Handler = (ctx: Context) => any
}

declare namespace Auth {
    /**
     * The base scheme is supposed to be extend by other
     * schemes.
     *
     * @class BaseScheme
     * @constructor
     * @module Lucid
     */
    interface BaseScheme {
        /**
         * The uid field name. Reads the `uid` from the config object
         *
         * @attribute uidField
         * @readOnly
         * @type {String}
         */
        uidField : string;

        /**
         * The password field name. Reads the `password` from the config object
         *
         * @attribute passwordField
         * @readOnly
         * @type {String}
         */
        passwordField : string;

        /**
         * The scheme field name. Reads the `scheme` from the config object
         *
         * @attribute scheme
         * @readOnly
         * @type {String}
         */
        scheme : string;

        /**
         * The primary key to be used to fetch the unique identifier value
         * for the current user.
         *
         * @attribute primaryKey
         * @readOnly
         * @type {String}
         */
        primaryKey : string;

        /**
         * The unique identifier value for the current user. The value relies on
         * primaryKey.
         *
         * @attribute primaryKeyValue
         * @readOnly
         * @type {String|Number}
         */
        primaryKeyValue : string | null;

        /**
         * Reference to the current user instance. The output value relies
         * on the serializer in use.
         *
         * @attribute user
         * @return {Mixed}
         */
        user : any;


        /**
         * Set the config and the serializer instance on scheme. This method
         * is invoked by the `Auth` facade to feed the current config and
         * serializer in use.
         *
         * @method setOptions
         *
         * @param  {Object}   config
         * @param  {Object}   serializerInstance
         *
         * @chainable
         * @param config
         * @param serializerInstance
         * @return
         */
        setOptions(config : Object, serializerInstance : Object): this;

        /**
         * Set http context on the scheme instance. This
         * method is called automatically by `Auth`
         * facade.
         *
         * @method setCtx
         *
         * @param  {Object}   ctx
         *
         * @chainable
         * @param ctx
         * @return
         */
        setCtx(ctx : Object): this;

        /**
         * Attach a callback to add runtime constraints
         * to the query builder.
         *
         * @method query
         *
         * @param  {Function} callback
         *
         * @chainable
         *
         * @example
         * ```js
         * auth.query((builder) => {
         *   builder.status('active')
         * }).attempt()
         * ```
         * @param callback
         * @return
         */
        query(callback : Function): this;

        /**
         * Validates the user credentials.
         *
         * This method will never login the user.
         *
         * @method validate
         * @async
         *
         * @param  {String}  uid
         * @param  {String}  password
         * @param  {Boolean} [returnUser = false]
         *
         * @return {Object|Boolean} - User object is returned when `returnUser` is set to true.
         *
         * @throws {UserNotFoundException}     If unable to find user with uid
         * @throws {PasswordMisMatchException} If password mismatches
         *
         * @example
         * ```js
         * try {
         *   await auth.validate(username, password)
         * } catch (error) {
         *   // Invalid credentials
         * }
         * ```
         * @param uid
         * @param password
         * @param returnUser?
         * @return
         */
        validate(uid : string, password : string, returnUser? : boolean): Promise<boolean>;

        /**
         *   * Returns the user logged in for the current request. This method will
         *   * call the `check` method internally.
         *   *
         *   * @method getUser
         *   * @async
         *   *
         *   * @return {Object}
         *   *
         *   * @example
         *   * ```js
         * *   await auth.getUser()
         *   * ```
         * @return
         */
        getUser(): Promise<Object>;

        /**
         * Returns the value of authorization header
         * or request payload token key value.
         *
         * This method will read the value of `Authorization` header, falling
         * back to `token` input field.
         *
         * @method getAuthHeader
         *
         * @return {String|Null}
         * @return
         */
        getAuthHeader(): string | null;

        /**
         * Raises UserNotFoundException exception and pass required data to it
         *
         * @method missingUserFor
         *
         * @param  {String|Number}    uidValue
         * @param  {String}           [uid=this._config.uid]
         * @param  {String}           [password=this._config.password]
         *
         * @return {UserNotFoundException}
         * @param uidValue
         * @param uid?
         * @param password?
         * @return
         */
        missingUserFor(uidValue : string | number, uid? : string, password? : string): any;

        /**
         * Raises PasswordMisMatchException exception and pass required data to it
         *
         * @method invalidPassword
         *
         * @param  {String}        message
         * @param  {String}        [password=this._config.password]
         *
         * @return {PasswordMisMatchException}
         * @param password?
         * @return
         */
        invalidPassword(password? : string): any;
    }

    /**
     * This scheme is extended by Jwt and API scheme, to share
     * common functionality.
     *
     * @constructor
     * @param {Encryption} Encryption
     */
    interface BaseTokenScheme extends BaseScheme {

        /**
         *
         * @param Encryption
         */
        new (Encryption : Encryption): BaseTokenScheme;

        /**
         * Revokes ( all/an array of multiple ) the tokens for currently logged in user.
         *
         * @method revokeTokens
         *
         * @param  {Array}              [tokens]
         * @param  {Boolean}            [deleteInstead = false]
         *
         * @return {Number}             Number of affected database rows
         *
         * @example
         * ```js
         * await auth.revokeTokens()
         * ```
         *
         * Revoke selected tokens
         * ```js
         * await auth.revokeTokens(['token1', 'token2'])
         * ```
         *
         * Delete instead of just revoking them
         * ```js
         * await auth.revokeTokens(null, true)
         * ```
         * @param tokens?
         * @param deleteInstead?
         * @return
         */
        revokeTokens(tokens? : Array<string> | null, deleteInstead? : boolean): Promise<number>;

        /**
         * Revokes ( all/an array of multiple ) the tokens for a given user.
         *
         * @method revokeTokensForUser
         *
         * @param  {User|Object}        user
         * @param  {Array}              [tokens]
         * @param  {Boolean}            [deleteInstead = false]
         *
         * @return {Number}             Number of affected database rows
         *
         * @example
         * ```js
         * const user = await User.find(1)
         * await auth.revokeTokensForUser(user)
         * ```
         *
         * Revoke selected tokens
         * ```js
         * const user = await User.find(1)
         * await auth.revokeTokensForUser(user, ['token1', 'token2'])
         * ```
         *
         * Delete instead of just revoking them
         * ```js
         * const user = await User.find(1)
         * await auth.revokeTokensForUser(user, null, true)
         * ```
         * @param user
         * @param tokens?
         * @param deleteInstead?
         * @return
         */
        revokeTokensForUser(user : any, tokens? : Array<string> | null, deleteInstead? : boolean): Promise<number>;

        /**
         * Lists all refresh tokens for currently logged in user.
         *
         * @method listTokens
         * @async
         *
         * @return {Array}
         * @return
         */
        listTokens(): Promise<Array<Object>>;
    }

    /**
     * This scheme allows to make use of Github style personal API tokens
     * to authenticate a user.
     *
     * The tokens for a give user are stored inside the database and user sends
     * a token inside the `Authorization` header as following.
     *
     * ```
     * Authorization=Bearer TOKEN
     * ```
     *
     * ### Note
     * Token will be encrypted using `EncryptionProvider` before sending it to the user.
     *
     * @class ApiScheme
     * @extends BaseScheme
     */
    interface ApiScheme extends BaseTokenScheme {
        /**
         * Attempt to valid the user credentials and then
         * generates a new token for it.
         *
         * This method invokes the `generate` method by passing
         * the user found with given credentials.
         *
         * @method attempt
         * @async
         *
         * @param  {String} uid
         * @param  {String} password
         *
         * @return {Object}
         *
         * @example
         * ```js
         * try {
         *   const token = auth.attempt(username, password)
         * } catch (error) {
         *   // Invalid credentials
         * }
         * ```
         * @param uid
         * @param password
         * @return
         */
        attempt(uid : string, password : string): Promise<Object>;

        /**
         * Generates a personal API token for a user. The user payload must
         * be valid as per the serializer in use.
         *
         * @method generate
         * @async
         *
         * @param  {Object} user
         *
         * @return {Object}
         * - `{ type: 'bearer', token: 'xxxxxxxx' }`
         *
         * @example
         * ```js
         * try {
         *   const user = await User.find(1)
         *   const token = await auth.generate(user)
         * } catch (error) {
         *   // Unexpected error
         * }
         * ```
         * @param user
         * @return
         */
        generate(user : Object): Promise<Object>;

        /**
         * Validates the API token by reading it from the request
         * header or using `token` input field as the fallback.
         *
         * Consider user as successfully authenticated, if this
         * method doesn't throws an exception.
         *
         * @method check
         * @async
         *
         * @return {void}
         *
         * @throws {InvalidApiToken} If token is missing or is invalid
         *
         * @example
         * ```js
         * try {
         *   await auth.check()
         * } catch (error) {
         *   // Invalid token
         * }
         * ```
         * @return
         */
        check(): Promise<boolean>;

        /**
         * List all API tokens for a given user
         *
         * @method listTokensForUser
         * @async
         *
         * @param {Object} user
         *
         * @return {Array}
         * @param user
         * @return
         */
        listTokensForUser(user : Object): Promise<Array<Object>>;

        /**
         * Login a user as a client. This method will set the
         * API token as a header on the request.
         *
         * Adonis testing engine uses this method.
         *
         * @method clientLogin
         * @async
         *
         * @param  {Function}    headerFn       - Method to set the header
         * @param  {Function}    sessionFn      - Method to set the session
         * @param  {Object}      tokenOrUser    - Pass the token or the user directly
         *
         * @return {void}
         * @param headerFn
         * @param sessionFn
         * @param tokenOrUser
         * @return
         */
        clientLogin(headerFn : HeaderFn, sessionFn : SessionFn, tokenOrUser : Object): Promise<void>;
    }

    /**
     * Authenticates a given HTTP request using [Basic Auth](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication) headers.
     *
     * @class BasicAuthScheme
     * @extends BaseScheme
     */
    interface BasicAuthScheme extends BaseScheme {
        /**
         * Check whether a user is logged in or
         * not.
         *
         * Consider user as successfully authenticated, if this
         * method doesn't throws an exception.
         *
         * @method check
         * @async
         *
         * @return {Boolean}
         *
         * @throws {InvalidBasicAuthException} If credentails are missing
         * @throws {UserNotFoundException}     If unable to find user with uid
         * @throws {PasswordMisMatchException} If password mismatches
         *
         * @example
         * ```js
         * try {
         *  await auth.check()
         * } catch (error) {
         *   // Missing or invalid credentials
         * }
         * ```
         * @return
         */
        check(): Promise<boolean>;

        /**
         * Login as a user by setting basic auth header
         * before the request reaches the server.
         *
         * Adonis testing engine uses this method.
         *
         * @param  {Function}    headerFn     - Method to set the header
         * @param  {Function}    sessionFn    - Method to set the session
         * @param  {String}      username
         * @param  {String}      password
         *
         * @method clientLogin
         * @async
         *
         * @return {void}
         * @param headerFn
         * @param sessionFn
         * @param username
         * @param password
         * @return
         */
        clientLogin(headerFn : HeaderFn, sessionFn : SessionFn, username : string, password : string): Promise<void>;
    }

    /**
     * This scheme allows to make use of JWT tokens to authenticate the user.
     *
     * The user sends a token inside the `Authorization` header as following.
     *
     * ```
     * Authorization=Bearer JWT-TOKEN
     * ```
     *
     * ### Note
     * Token will be encrypted using `EncryptionProvider` before sending it to the user.
     *
     * @class JwtScheme
     * @extends BaseScheme
     */
    interface JwtScheme extends BaseTokenScheme {

        /**
         *
         * @param Encryption
         */
        new (Encryption : Encryption): JwtScheme;

        /**
         * The jwt secret
         *
         * @attribute jwtSecret
         * @type {String|Null}
         * @readOnly
         */
        jwtSecret : string | null;

        /**
         * An object of jwt options directly
         * passed to `jsonwebtoken` library
         *
         * @attribute jwtOptions
         * @type {Object|Null}
         * @readOnly
         */
        jwtOptions : Object | null;

        /**
         * Instruct class to generate a refresh token
         * when generating the jwt token.
         *
         * @method withRefreshToken
         *
         * @chainable
         *
         * @example
         * ```js
         * await auth
         *   .withRefreshToken()
         *   .generate(user)
         *
         * // or
         * await auth
         *   .withRefreshToken()
         *   .attempt(username, password)
         * ```
         * @return
         */
        withRefreshToken(): JwtScheme;

        /**
         * When issuing a new JWT token from the refresh token, this class will
         * re-use the old refresh token.
         *
         * If you want, you can instruct the class to generate a new refresh token
         * as well and remove the existing one from the DB.
         *
         * @method newRefreshToken
         *
         * @chainable
         *
         * @example
         * ```js
         * await auth
         *   .newRefreshToken()
         *   .generateForRefreshToken(token)
         * ```
         * @return
         */
        newRefreshToken(): JwtScheme;

        /**
         * Attempt to valid the user credentials and then generate a JWT token.
         *
         * @method attempt
         * @async
         *
         * @param  {String} uid
         * @param  {String} password
         * @param  {Object|Boolean} [jwtPayload]  Pass true when want to attach user object in the payload
         *                                        or set a custom object.
         * @param  {Object}         [jwtOptions]  Passed directly to https://www.npmjs.com/package/jsonwebtoken
         *
         * @return {Object}
         * - `{ type: 'bearer', token: 'xxxx', refreshToken: 'xxxx' }`
         *
         * @example
         * ```js
         * try {
         *   const token = auth.attempt(username, password)
         * } catch (error) {
         *    // Invalid credentials
         * }
         * ```
         *
         * Attach user to the JWT payload
         * ```
         * auth.attempt(username, password, true)
         * ```
         *
         * Attach custom data object to the JWT payload
         * ```
         * auth.attempt(username, password, { ipAddress: '...' })
         * ```
         * @param uid
         * @param password
         * @param jwtPayload?
         * @param jwtOptions?
         * @return
         */
        attempt(uid : string, password : string, jwtPayload? : Object | boolean, jwtOptions? : Object): Promise<Object>;

        /**
         * Generates a jwt token for a given user. This method doesn't check the existence
         * of the user in the database.
         *
         * @method generate
         * @async
         *
         * @param  {Object} user
         * @param  {Object|Boolean} [jwtPayload]  Pass true when want to attach user object in the payload
         *                                        or set a custom object.
         * @param  {Object}         [jwtOptions]  Passed directly to https://www.npmjs.com/package/jsonwebtoken
         *
         * @return {Object}
         * - `{ type: 'bearer', token: 'xxxx', refreshToken: 'xxxx' }`
         *
         * @throws {RuntimeException} If jwt secret is not defined or user doesn't have a primary key value
         *
         * @example
         * ```js
         * try {
         *   await auth.generate(user)
         * } catch (error) {
         *   // Unexpected error
         * }
         * ```
         *
         * Attach user to the JWT payload
         * ```
         * auth.auth.generate(user, true)
         * ```
         *
         * Attach custom data object to the JWT payload
         * ```
         * auth.generate(user, { ipAddress: '...' })
         * ```
         * @param user
         * @param jwtPayload?
         * @param jwtOptions?
         * @return
         */
        generate(user : Object, jwtPayload? : Object | boolean, jwtOptions? : Object): Promise<Object>;

        /**
         * Generate a new JWT token using the refresh token.
         *
         * If chained with {{#crossLink "JwtScheme/newRefreshToken"}}{{/crossLink}},
         * this method will remove the existing refresh token from database and issues a new one.
         *
         * @method generateForRefreshToken
         * @async
         *
         * @param {String} refreshToken
         * @param  {Object|Boolean} [jwtPayload]  Pass true when want to attach user object in the payload
         *                                        or set a custom object.
         * @param  {Object}         [jwtOptions]  Passed directly to https://www.npmjs.com/package/jsonwebtoken
         *
         * @return {Object}
         * - `{ type: 'bearer', token: 'xxxx', refreshToken: 'xxxx' }`
         *
         * @example
         * ```js
         * await auth.generateForRefreshToken(refreshToken)
         *
         * // create a new refresh token too
         * await auth
         *   .newRefreshToken()
         *   .generateForRefreshToken(refreshToken)
         * ```
         * @param refreshToken
         * @param jwtPayload?
         * @param jwtOptions?
         * @return
         */
        generateForRefreshToken(refreshToken : string, jwtPayload? : Object | boolean, jwtOptions? : Object): Promise<Object>;

        /**
         * Check if user is authenticated for the current HTTP request or not. This
         * method will read the token from the `Authorization` header or fallbacks
         * to the `token` input field.
         *
         * Consider user as successfully authenticated, if this
         * method doesn't throws an exception.
         *
         * @method check
         * @async
         *
         * @return {Boolean}
         *
         * @example
         * ```js
         * try {
         *   await auth.check()
         * } catch (error) {
         *   // invalid jwt token
         * }
         * ```
         * @return
         */
        check(): Promise<boolean>;

        /**
         * List all refresh tokens for a given user.
         *
         * @method listTokensForUser
         * @async
         *
         * @param  {Object} user
         *
         * @return {Array}
         * @param user
         * @return
         */
        listTokensForUser(user : Object): Promise<Object>;

        /**
         * Login a user as a client. This method will set the
         * JWT token as a header on the request.
         *
         * @param  {Function}    headerFn     - Method to set the header
         * @param  {Function}    sessionFn    - Method to set the session
         * @param  {Object}      user         - User to login
         * @param  {Object}      [jwtOptions] - Passed directly to https://www.npmjs.com/package/jsonwebtoken
         *
         * @method clientLogin
         * @async
         *
         * @return {void}
         * @param headerFn
         * @param sessionFn
         * @param user
         * @return
         */
        clientLogin(headerFn : HeaderFn, sessionFn : SessionFn, user : Object): Promise<void>;
    }

    /**
     * This scheme allows to make use of `sessions` to authenticate
     * a user.
     *
     * The authentication is stateful and logged in user `id` is saved inside
     * cookies to maintain the state across multiple requests.
     *
     * @class SessionScheme
     * @extends BaseScheme
     */
    interface SessionScheme extends BaseScheme {

        /**
         *
         * @param Config
         */
        new (Config : Object): SessionScheme;


        /**
         * Reference to the value of `sessionKey` inside the config block.
         * Defaults to `adonis-auth`
         *
         * @attribute sessionKey
         * @readOnly
         * @return {String}
         */
        sessionKey : String;

        /**
         * Reference to the value of `rememberMeToken` inside the config block.
         * Defaults to `adonis-remember-token`
         *
         * @attribute rememberTokenKey
         * @readOnly
         * @return {String}
         */
        rememberTokenKey : string;

        /**
         * Instruct login API to remember the user for a given
         * duration. Defaults to `5years`.
         *
         * This method must be called before `login`, `loginViaId` or
         * `attempt` method.
         *
         * @method remember
         *
         * @param  {String|Number} [duration = 5y]
         *
         * @chainable
         *
         * @example
         * ```js
         * await auth.remember(true).login()
         *
         * // custom durating
         * await auth.remember('2y').login()
         * ```
         * @param duration?
         * @return
         */
        remember(duration? : string | number | boolean): this;

        /**
         * Attempt to login the user using `username` and `password`. An
         * exception will be raised when unable to find the user or
         * if password mis-matches.
         *
         * @method attempt
         * @async
         *
         * @param  {String} uid
         * @param  {String} password
         *
         * @return {Object}
         *
         * @throws {UserNotFoundException}     If unable to find user with uid
         * @throws {PasswordMisMatchException} If password mismatches
         *
         * @example
         * ```js
         * try {
         *   await auth.attempt(username, password)
         * } catch (error) {
         *   // Invalid credentials
         * }
         * ```
         * @param uid
         * @param password
         * @return
         */
        attempt(uid : string, password : string): Promise<Object>;

        /**
         * Login the user using the user object. An exception will be
         * raised if the same user is already logged in.
         *
         * The exception is raised to improve your code flow, since your code
         * should never try to login a same user twice.
         *
         * @method login
         *
         * @param  {Object} user
         * @async
         *
         * @return {Object}
         *
         * @example
         * ```js
         * try {
         *   await auth.login(user)
         * } catch (error) {
         *   // Unexpected error
         * }
         * ```
         * @param user
         * @return
         */
        login(user : Object): Promise<Object>;

        /**
         * Login a user with their unique id.
         *
         * @method loginViaId
         * @async
         *
         * @param  {Number|String}   id
         *
         * @return {Object}
         *
         * @throws {UserNotFoundException}     If unable to find user with id
         *
         * @example
         * ```js
         * try {
         *   await auth.loginViaId(1)
         * } catch (error) {
         *   // Unexpected error
         * }
         * ```
         * @param id
         * @return
         */
        loginViaId(id : number | string): Promise<Object>;

        /**
         * Logout a user by removing the required cookies. Also remember
         * me token will be deleted from the tokens table.
         *
         * @method logout
         * @async
         *
         * @return {void}
         *
         * @example
         * ```js
         * await auth.logout()
         * ```
         * @return
         */
        logout(): Promise<void>;

        /**
         * Check whether the user is logged in or not. If the user session
         * has been expired, but a valid `rememberMe` token exists, this
         * method will re-login the user.
         *
         * @method check
         * @async
         *
         * @return {Boolean}
         *
         * @throws {InvalidSessionException} If session is not valid anymore
         *
         * @example
         * ```js
         * try {
         *   await auth.check()
         * } catch (error) {
         *   // user is not logged
         * }
         * ```
         * @return
         */
        check(): Promise<boolean>;

        /**
         *   * Same as {{#crossLink "SessionScheme/check:method"}}{{/crossLink}},
         *   * but doesn't throw any exceptions. This method is useful for
         *   * routes, where login is optional.
         *   *
         *   * @method loginIfCan
         *   * @async
         *   *
         *   * @return {void}
         *   *
         *   * @example
         *   * ```js
         * *   await auth.loginIfCan()
         *   * ```
         * @return
         */
        loginIfCan(): Promise<void>;

        /**
         * Login a user as a client. This is required when
         * you want to set the session on a request that
         * will reach the Adonis server.
         *
         * Adonis testing engine uses this method.
         *
         * @method clientLogin
         * @async
         *
         * @param  {Function}    headerFn     - Method to set the header
         * @param  {Function}    sessionFn    - Method to set the session
         * @param  {Object}      user         - User to login
         *
         * @return {void}
         * @param headerFn
         * @param sessionFn
         * @param user
         * @return
         */
        clientLogin(headerFn : HeaderFn, sessionFn : SessionFn, user : Object): Promise<void>;
    }

    type HeaderFn = (key: string, value: string) => void;
    type SessionFn = (name: string, value: string) => void
}
type Auth = Auth.ApiScheme & Auth.BasicAuthScheme & Auth.JwtScheme & Auth.SessionScheme;

/**
  * This class defines a single route. It supports dynamic
  * **url segments**, **formats**, **middleware**
  * and **named routes**.
  *
  * Generally you will get the instance of the by calling
  * one of the route method on the @ref('RouteManager')
  * class.
  *
  * Example: `Route.get`, `Route.post`.
  *
  * @class Route
  * @group Http
  * @constructor
  *
  * @example
  * ```
  * const route = new Route('users', 'HomeController.index', ['GET'])
  * ```
  */
interface Route extends Macroable {

    /**
      *
      * @param route
      * @param handler
      * @param verbs
      */
    new (route : string, handler : string|Function, verbs : string[]): Route;

    /**
      * Define domain for the route. If domain is defined
      * then route will only resolve when domain matches.
      *
      * @method domain
      *
      * @param  {String}  domain
      *
      * @chainable
      *
      * @example
      * ```js
      * Route
      *   .get(...)
      *   .domain('blog.adonisjs.com')
      * ```
      * @param domain
      * @return
      */
    domain(domain : string): Route;

    /**
      * Define formats on a given route. Formats can be
      * used to do explicit content negotiation based
      * upon the url extension.
      *
      * @method formats
      *
      * @param  {Array}  formats
      * @param  {Boolean} [strict = false] - Strict flag will only allow route with format extension.
      *
      * @chainable
      *
      * @example
      * ```js
      * Route
      *   .get(...)
      *   .formats(['json', 'html'])
      * ```
      * @param formats
      * @param strict?
      * @return
      */
    formats(formats : string[], strict? : false): Route;

    /**
      * Give name to the route, easier to remember
      * and resolve later.
      *
      * @method as
      *
      * @param  {String} name
      *
      * @chainable
      *
      * @example
      * ```js
      * Route
      *   .get(...)
      *   .as('name')
      * ```
      * @param name
      * @return
      */
    as(name : string): Route;

    /**
      * Add middleware to the middleware queue to be executed
      * before the route handler is executed.
      *
      * Calling this method for the multiple times will `concat`
      * to the list of middleware.
      *
      * @method middleware
      *
      * @param  {...Spread} middleware
      *
      * @chainable
      *
      * @example
      * ```js
      * Route
      *   .get('...')
      *   .middleware('auth')
      *
      * // Or
      * Route
      *   .get('...')
      *   .middleware(['auth', 'acl'])
      *
      * // Also pure functions
      * Route
      *   .get('...')
      *   .middleware(async function () {
      *
      *   })
      * ```
      * @param ...middleware
      * @return
      */
    middleware(...middleware : Function[]): Route;
    middleware(middleware : string | string[]): Route;

    /**
      * Add a folder namespace to the route. Generally
      * used by the Route group to namespace a bunch of
      * routes that are all inside the same folder.
      *
      * @method namespace
      *
      * @param  {String} namespace
      *
      * @chainable
      *
      * @example
      * ```
      * Route
      *   .get(...)
      *   .namespace('Admin')
      * ```
      * @param namespace
      * @return
      */
    namespace(namespace : string): Route;

    /**
      * Add middleware to the front of the route. The method is
      * same as `middleware` instead just prepends instead of
      * append.
      *
      * @method prependMiddleware
      *
      * @param  {...Spread}       middleware
      *
      * @chainable
      * @param ...middleware
      * @return
      */
    prependMiddleware(...middleware : Function[]): Route
    prependMiddleware(middleware : string | string[]): Route

    /**
      * Prefix the route with some string. Generally
      * used by the Route group to prefix a bunch
      * of routes.
      *
      * @method prefix
      *
      * @param  {String} prefix
      *
      * @chainable
      *
      * @example
      * ```
      * Route
      *   .get(...)
      *   .prefix('api/v1')
      * ```
      * @param prefix
      * @return
      */
    prefix(prefix : string): Route;

    /**
      * Resolves the url by matching it against
      * the registered route and verbs. It will
      * return `null` when url does not belongs
      * to this route.
      *
      * @method resolve
      *
      * @param  {String} url
      * @param  {String} verb
      * @param  {String} [host] - Required only when route has subdomain
      *
      * @return {Object|Null}
      *
      * @example
      * ```js
      * // Register route
      * const route = new Route('make/:drink', 'DrinkController.make', ['GET'])
      *
      * // Resolve url
      * route.resolve('make/coffee', 'GET')
      *
      * // Returns
      * { url: 'make/coffee', params: ['coffee'] }
      * ```
      * @param url
      * @param verb
      * @param host?
      * @return
      */
    resolve(url: string, verb: 'string', host?: string): { url: string; params: string[]; subdomains: {} } | null

    /**
      * Returns the JSON representation of the route.
      *
      * @method toJSON
      *
      * @return {Object}
      * @return
      */
    toJSON(): {
        route: Route
        verbs: string[]
        handler: string | Http.Handler
        middleware: Array<string | Function>
        name: string
        domain?: RegExp
    }

    /**
     * Extend route class by adding a macro, which pushes a
     * middleware to the route middleware stack and
     * validates the request via validator
     * class
     */
    validator(validatorClass: string): Route;
}

declare namespace Route {
    class Brisk {
        /**
          * Sets the handler for brisk route.
          *
          * @method setHandler
          *
          * @param  {Function|String}   handler
          * @param  {Array}   verbs
          *
          * @return {Route}
          *
          * @throws {RuntimeException} If trying to re-define handler for the route
          * @param handler
          * @param verbs
          * @return
          */
        setHandler(handler: Function | string, verbs: string[]): Route

        /**
          * Render a view from the route
          *
          * @method render
          *
          * @param  {String} template
          * @param  {Object} data
          *
          * @return {Route}
          * @param template
          * @param data
          * @return
          */
        render(template: string, data?: {}): Route
    }

    class Group {
        /**
          * Add middleware to a group of routes.
          * Also see @ref('Route/middleware').
          *
          * @method middleware
          *
          * @param  {Array|String|Spread}   middleware
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .group()
          *   .middleware('auth')
          * ```
          * @param ...middleware
          * @return
          */
        middleware(middleware: string | string[]): Group
        middleware(...middleware: Function[]): Group

        /**
          * Namespace group of routes.
          * Also see @ref('Route/namespace')
          *
          * @method namespace
          *
          * @param  {String} namespace
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .group()
          *   .namespace('Admin')
          * ```
          * @param namespace
          * @return
          */
        namespace(namespace : string): Group;


        /**
          * Add formats to a group of routes.
          * Also see @ref('Route/formats')
          *
          * @method formats
          *
          * @param  {Array}   formats
          * @param  {Boolean} [strict = false]
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .group()
          *   .formats(['json', 'html'])
          * ```
          * @param formats
          * @param strict?
          * @return
          */
        formats(formats: string[], strict: false): Group

        /**
          * Prefix group of routes.
          * Also see @ref('Route/prefix')
          *
          * @method prefix
          *
          * @param  {String} prefix
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .group()
          *   .prefix('api/v1')
          * ```
          * @param prefix
          * @return
          */
        prefix(prefix: string): Group

        /**
          * Add domain to a group of routes.
          * Also see @ref('Route/domain')
          *
          * @method domain
          *
          * @param  {String} domain
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .group()
          *   .domain('blog.adonisjs.com')
          * ```
          * @param domain
          * @return
          */
        domain(domain: string): Group
    }

    class Resource {
        /**
          * Remove all routes from the resourceful list except the
          * one defined here.
          *
          * @method only
          *
          * @param  {Array} names
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .resource()
          *   .only(['store', 'update'])
          * ```
          * @param names
          * @return
          */
        only(names: string[]): Resource

        /**
          * Remove the routes define here from the resourceful list.
          *
          * @method except
          *
          * @param  {Array} names
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .resource()
          *   .except(['delete'])
          * ```
          * @param names
          * @return
          */
        except(names: string[]): Resource

        /**
          * Limit the number of routes to api only. In short
          * this method will remove `create` and `edit`
          * routes.
          *
          * @method apiOnly
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .resource()
          *   .apiOnly()
          * ```
          * @return
          */
        apiOnly(): Resource

        /**
          * Save middleware to be applied on the resourceful routes. This
          * method also let you define conditional middleware based upon
          * the route attributes.
          *
          * For example you want to apply `auth` middleware to the `store`,
          * `update` and `delete` routes and want other routes to be
          * publicly accessible. Same can be done by passing a
          * closure to this method and returning an array
          * of middleware to be applied.
          *
          * ## NOTE
          * The middleware closure will be executed for each route.
          *
          * @method middleware
          *
          * @param  {Array|Map} middleware
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .resource()
          *   .middleware(['auth'])
          *
          * // or use ES6 maps
          * Route
          *   .resource('user', 'UserController')
          *   .middleware(new Map([
          *     [['user.store', 'user.update', 'user.delete'], 'auth']
          *   ]))
          * ```
          * @param middleware
          * @return
          */
        middleware(middleware: string | string[]): Resource
        middleware(middleware: Map<string[], string>): Resource

        /**
          * Define route formats for all the routes inside
          * a resource.
          *
          * @method formats
          *
          * @param  {Array}   formats
          * @param  {Boolean} [strict = false]
          *
          * @chainable
          *
          * @example
          * ```js
          * Route
          *   .resource()
          *   .formats(['json'], true)
          * ```
          * @param formats
          * @param strict?
          */
        formats(formats: string[], strict: false): Resource

        /**
          * The name prefix is used to prefix the route names.
          * Generally used when resource is defined inside
          * the Route group
          *
          * @type {String}
          */
        prefix : string;

        /**
         * Adding resource macro to apply validator on
         * route resource
         */
        validator(validatorsMap: Map<string[], string[]>): Resource;
    }

    class Manager {
        /**
          * Create a new route and push it to the
          * routes store.
          *
          * @method route
          *
          * @param  {String}          route
          * @param  {Function|String} handler
          * @param  {Array}           verbs
          *
          * @return {Route}
          *
          * @example
          * ```js
          * Route.route('/', 'HomeController.render', ['GET'])
          * ```
          * @param route
          * @param handler
          * @param verbs
          * @return
          */
        route(route: string, handler: string | Http.Handler, verbs: string[]): Route

        /**
          * Create a new route with `GET` and `HEAD`
          * verbs.
          *
          * @method get
          *
          * @param  {String} route
          * @param  {Function|String} handler
          *
          * @return {Route}
          *
          * @example
          * ```js
          * Route.get('users', 'UserController.index')
          * ```
          * @param route
          * @param handler
          * @return
          */
        get(route: string, handler: string | Http.Handler): Route

        /**
          * Create a new route with `POST` verb.
          *
          * @method post
          *
          * @param  {String} route
          * @param  {Function|String} handler
          *
          * @return {Route}
          *
          * @example
          * ```js
          * Route.post('users', 'UserController.store')
          * ```
          * @param route
          * @param handler
          * @return
          */
        post(route: string, handler: string | Http.Handler): Route

        /**
          * Create a new route with `PUT` verb.
          *
          * @method put
          *
          * @param  {String} route
          * @param  {Function|String} handler
          *
          * @return {Route}
          *
          * @example
          * ```js
          * Route.put('users', 'UserController.update')
          * ```
          * @param route
          * @param handler
          * @return
          */
        put(route: string, handler: string | Http.Handler): Route

        /**
          * Create a new route with `PATCH` verb.
          *
          * @method patch
          *
          * @param  {String} route
          * @param  {Function|String} handler
          *
          * @return {Route}
          *
          * @example
          * ```js
          * Route.patch('users', 'UserController.update')
          * ```
          * @param route
          * @param handler
          * @return
          */
        patch(route: string, handler: string | Http.Handler): Route

        /**
          * Create a new route with `DELETE` verb.
          *
          * @method delete
          *
          * @param  {String} route
          * @param  {Function|String} handler
          *
          * @return {Route}
          *
          * @example
          * ```js
          * Route.delete('users', 'UserController.destroy')
          * ```
          * @param route
          * @param handler
          * @return
          */
        delete(route: string, handler: string | Http.Handler): Route

        /**
          * Create a route that response to all the following
          * HTTP verbs. Mostly required when creating a
          * wildcard route for the SPA apps.
          *
          * @method any
          *
          * @param  {String} route
          * @param  {Function|String} handler
          *
          * @return {Route}
          *
          * @example
          * ```js
          * Route.any('*', 'SpaController.render')
          * ```
          * @param route
          * @param handler
          * @return
          */
        any(route: string, handler: string | Http.Handler): Route

        /**
          * Create a route with `GET` and `HEAD`
          * verb, which renders a view by
          * chaining the `render` method.
          *
          * @method on
          *
          * @param  {String} route
          *
          * @return {Object} Object containing the render method
          *
          * @example
          * ```js
          * Route.on('/').render('welcome')
          * ```
          * @param route
          * @return
          */
        on(route: string): Brisk

        /**
          * Resolves and return the route that matches
          * the given **url**, **verb** and the **host**.
          * The Host is only matched when the route has
          * a domain attached to it.
          *
          * ## Note
          * The first matching route will be used. So make
          * sure the generic routes are created after the
          * static routes.
          *
          * @method match
          *
          * @param  {String} url
          * @param  {String} verb
          * @param  {String} [host = null]
          *
          * @return {Object|Null}
          *
          * @example
          * ```js
          * Route.match('users/1', 'GET')
          *
          * // returns { url: 'users/1', params: [1], route: <RouteInstance> }
          * ```
          * @param url
          * @param verb
          * @param host?
          * @return
          */
        match(url: string, verb: string, host?: string): Object | null


        /**
          * Create a new group to nested routes of
          * same behaviour.
          *
          * @method group
          *
          * @param  {String}   [name = null]
          * @param  {Function} callback
          *
          * @return {Object}          Instance of {{#crossLink "RouteGroup"}}{{/crossLink}}
          *
          * @example
          * ```js
          * Route.group(function () {
          *   Route.get('users', 'UsersController.index')
          * }).prefix('api/v1')
          * ```
          * @param name?
          * @param callback
          * @return
          */
        group(callback: Function): Group
        group(name: string, callback: Function): Group

        /**
          * Create an instance of resourceful routes, which
          * in turn will create a list of 7 restful routes.
          *
          * @method resource
          *
          * @param  {String} resource
          * @param  {String} controller
          *
          * @return {Object}          Instance of {{#crossLink "RouteResource"}}{{/crossLink}}
          * @param resource
          * @param controller
          * @return
          */
        resource(resouce: string, controller: string): Resource

        /**
          * Returns an array of all the registered route
          *
          * @method list
          *
          * @return {Array}
          * @return
          */
        list(): Route[]

        /**
          * Make url for a route.
          *
          * @method url
          *
          * @param  {String} urlOrName    - Url, route name or controller action
          * @param  {Object} [data = {}]  - Data object
          * @param  {String} [options]    - Other Options
          *
          * @return {String|Null}
          * @param routeNameOrHandler
          * @param data?
          * @param options?
          * @return
          */
        url(routeNameOrHandler: string, data?: {}, options?: string): string | null
    }

    /**
      * Route store is used to store registered routes as an
      * array. It is a singleton store to be exported and
      * used by an part of the application to store
      * routes.
      *
      * For example: @ref('RouteResource') makes
      * use of it to store multiple routes.
      *
      * @class RouteStore
      * @group Http
      * @static
      */
    interface Store {
        /**
          * Add a breakpoint to routes. All routes after the
          * breakpoint will be recorded seperately. Helpful
          * for `Route.group`.
          *
          * Also only one breakpoint at a time is allowed.
          *
          * @method breakpoint
          *
          * @param  {String}   name
          *
          * @return {void}
          * @param name
          * @return
          */
        breakpoint(name : string): void;

        /**
          * Returns a boolean indicating whether breakpoint
          * is enabled or not.
          *
          * @method hasBreakpoint
          *
          * @return {Boolean}
          * @return
          */
        hasBreakpoint(): boolean;

        /**
          * Returns the routes recorded during
          * breakpoint.
          *
          * @method breakpointRoutes
          *
          * @return {array}
          * @return
          */
        breakpointRoutes(): Route[];

        /**
          * Release the breakpoint.
          *
          * @method releaseBreakpoint
          *
          * @return {void}
          * @return
          */
        releaseBreakpoint(): void;

        /**
          * Add a route to the store
          *
          * @method add
          *
          * @param  {Route} route
          * @param route
          */
        add(route : any): Route;

        /**
          * Remove route from the store.
          *
          * @method remove
          *
          * @param  {Route} routeToRemove
          *
          * @return {void}
          * @param routeToRemove
          * @return
          */
        remove(routeToRemove : Route): void;

        /**
          * Clear all the routes store so far.
          *
          * @method clear
          *
          * @return {void}
          * @return
          */
        clear(): void;

        /**
          * Find a route with name or it's url
          *
          * @method find
          *
          * @param  {String} nameOrRoute
          * @param  {String} domain
          *
          * @return {Object|Null}
          * @param routeNameOrHandler
          * @param domain
          * @return
          */
        find(routeNameOrHandler : string, domain : string): Object | null;

        /**
          * Returns a list of stored routes.
          *
          * @method list
          *
          * @return {Array}
          * @return
          */
        list(): Route[];
    }
}

/**
  * The schema is used to define SQL table schemas. This makes
  * use of all the methods from http://knexjs.org/#Schema
  *
  * @binding Adonis/Src/Schema
  * @alias Schema
  * @group Database
  * @uses (['Adonis/Src/Database'])
  *
  * @class Schema
  * @constructor
  */
interface Schema {
    /**
      *
      * @param Database
      */
    new(Database: Database): Schema

    /**
      * Returns a boolean indicating if a table
      * already exists or not
      *
      * @method hasTable
      *
      * @param  {String}  tableName
      *
      * @return {Boolean}
      * @param tableName
      * @return
      */
    hasTable(tableName : string): boolean;

    /**
      * Returns a boolean indicating if a column exists
      * inside a table or not.
      *
      * @method hasColumn
      *
      * @param  {String}  tableName
      * @param  {String}  columnName
      *
      * @return {Boolean}
      * @param tableName
      * @param columnName
      * @return
      */
    hasColumn(tableName : string, columnName : string): boolean;

    /**
      *
      */
    connection : string;

    //chain.js
    /**
      * Create a new table.
      *
      * NOTE: This action is deferred
      *
      * @method createTable
      *
      * @param  {String}    tableName
      * @param  {Function}  callback
      *
      * @return {void}
      * @param tableName
      * @param callback
      * @return
      */
    create(table: string, callback: (table: Database.TableBuilder) => void) :void

    /**
      * Create a new table if not already exists.
      *
      * NOTE: This action is deferred
      *
      * @method createIfNotExists
      *
      * @param  {String}    tableName
      * @param  {Function}  callback
      *
      * @return {void}
      * @param tableName
      * @param callback
      * @return
      */
    createIfNotExists(tableName : string, callback: (table: Database.TableBuilder) => void): void;

    /**
      * Rename existing table.
      *
      * NOTE: This action is deferred
      *
      * @method rename
      *
      * @param  {String}    fromTable
      * @param  {String}    toTable
      *
      * @return {void}
      * @param fromTable
      * @param toTable
      * @return
      */
    rename(fromTable : string, toTable : string): void;

    /**
      * Drop existing table.
      *
      * NOTE: This action is deferred
      *
      * @method dropTable
      *
      * @param  {String}    tableName
      *
      * @return {void}
      * @param tableName
      * @return
      */
    drop(table: string) :void

    /**
      * Drop table only if it exists.
      *
      * NOTE: This action is deferred
      *
      * @method dropIfExists
      *
      * @param  {String}    tableName
      *
      * @return {void}
      * @param tableName
      * @return
      */
    dropIfExists(tableName : string): void;

    /**
      * Run a raw SQL statement
      *
      * @method raw
      *
      * @param  {String} statement
      *
      * @return {Object}
      *
      * @return {void}
      * @param statement
      * @return
      */
    raw(statement : string): /* !this */ void;

    /**
      * Schedule a method to be executed in sequence with migrations
      *
      * @method schedule
      *
      * @param  {Function} fn
      *
      * @return {void}
      * @param fn
      * @return
      */
    schedule(fn : Function): void;
}

type HttpServer = any // node Server instance

/**
  * The HTTP server class to start a new server and bind
  * the entire app around it.
  *
  * This class utilizes the Node.js core HTTP server.
  *
  * @binding Adonis/Src/Server
  * @alias Server
  * @singleton
  * @group Http
  *
  * @class Server
  */
interface Server {

    /**
      *
      * @param Context
      * @param Route
      * @param Logger
      * @param Exception
      */
    new (Context : Http.Context, Route : Route, Logger : Logger, Exception : Exception) : Server;

    /**
      * Register an array of global middleware to be called
      * for each route. If route does not exists, middleware
      * will never will called.
      *
      * Calling this method multiple times will concat to the
      * existing list
      *
      * @method registerGlobal
      *
      * @param  {Array}       middleware
      *
      * @chainable
      *
      * @throws {InvalidArgumentException} If middleware is not an array
      *
      * @example
      * ```js
      * Server.registerGlobal([
      *   'Adonis/Middleware/BodyParser',
      *   'Adonis/Middleware/Session'
      * ])
      * ```
      * @param middleware
      * @return
      */
    registerGlobal(middleware : string[]): Server;

    /**
      * Register server middleware to be called no matter
      * whether a route has been registered or not. The
      * great example is a middleware to serve static
      * resources from the `public` directory.
      *
      * @method use
      *
      * @param  {Array} middleware
      *
      * @chainable
      *
      * @throws {InvalidArgumentException} If middleware is not an array
      *
      * @example
      * ```js
      * Server.use(['Adonis/Middleware/Static'])
      * ```
      * @param middleware
      * @return
      */
    use(middleware : string[]): Server

    /**
      * Register named middleware. Calling this method for
      * multiple times will concat to the existing list.
      *
      * @method registerNamed
      *
      * @param  {Object}      middleware
      *
      * @chainable
      *
      * @throws {InvalidArgumentException} If middleware is not an object with key/value pair.
      *
      * @example
      * ```js
      * Server.registerNamed({
      *   auth: 'Adonis/Middleware/Auth'
      * })
      *
      * // use it on route later
      * Route
      *   .get('/profile', 'UserController.profile')
      *   .middleware(['auth'])
      *
      * // Also pass params
      * Route
      *   .get('/profile', 'UserController.profile')
      *   .middleware(['auth:basic'])
      * ```
      * @param middleware
      * @return
      */
    registerNamed(middleware : string[] | Object): Server;

    /**
      * Returns the http server instance. Also one can set
      * a custom http instance.
      *
      * @method getInstance
      *
      * @return {Object}
      * @return
      */
    getInstance(): HttpServer;

    /**
      * Set a custom http instance instead of using
      * the default one
      *
      * @method setInstance
      *
      * @param  {Object}    httpInstance
      *
      * @return {void}
      *
      * @example
      * ```js
      * const https = require('https')
      * Server.setInstance(https)
      * ```
      * @param httpInstance
      * @return
      */
    setInstance(httpInstance : HttpServer): void;

    /**
      * Handle method executed for each HTTP request and handles
      * the request lifecycle by performing following operations.
      *
      * 1. Call server level middleware
      * 2. Resolve route
      * 3. Call global middleware
      * 4. Call route middleware
      * 5. Execute route handler.
      *
      * Also if route is not found. All steps after that are not
      * executed and 404 exception is thrown.
      *
      * @method handle
      * @async
      *
      * @param  {Object} req
      * @param  {Object} res
      *
      * @return {void}
      * @param req
      * @param res
      * @return
      */
    handle(req : Object, res : Object): void;

    /**
      * Binds the exception handler to be used for handling HTTP
      * exceptions. If `namespace` is not provided, the server
      * will choose the conventional namespace
      *
      * @method bindExceptionHandler
      *
      * @param  {String}             [namespace]
      *
      * @chainable
      * @param namespace?
      * @return
      */
    bindExceptionHandler(namespace? : string): Server;

    /**
      * Listen on given host and port.
      *
      * @method listen
      *
      * @param  {String}   [host = localhost]
      * @param  {Number}   [port = 3333]
      * @param  {Function} [callback]
      *
      * @return {Object}
      * @param host?
      * @param port?
      * @param callback?
      * @return
      */
    listen(host? : 'localhost', port? : 3333, callback? : Function): HttpServer;

    /**
      * Closes the HTTP server
      *
      * @method close
      *
      * @param  {Function} callback
      *
      * @return {void}
      * @param callback
      * @return
      */
    close(callback : Function): void;
}

/**
  * View engine to be used for rendering views. It makes
  * use of Edge as the templating engine. Learn more
  * about edge [here](http://edge.adonisjs.com/)
  *
  * During HTTP request/response lifecycle, you should
  * make use of `view` instance to render views.
  *
  * @binding Adonis/Src/View
  * @singleton
  * @alias View
  * @group Http
  *
  * @class View
  * @constructor
  *
  * @example
  * ```js
  * Route.get('/', ({ view }) => {
  *   return view.render('home')
  * })
  * ```
  */
declare class View {
    engine: View.Engine
    /**
      * Base presenter to be extended when creating
      * presenters for views.
      *
      * @attribute BasePresenter
      */
    BasePresenter: View.BasePresenter;
    /**
      * Register global with the view engine.
      *
      * All parameters are directly
      * passed to http://edge.adonisjs.com/docs/globals#_adding_globals
      *
      *
      * @method global
      *
      * @param  {...Spread} params
      *
      * @return {void}
      */
    global(name: string, value: any): void
    /**
      * Share an object as locals with the view
      * engine.
      *
      * All parameters are directly
      * passed to http://edge.adonisjs.com/docs/data-locals#_locals
      *
      * @method share
      *
      * @param  {...Spread} params
      *
      * @return {Object}
      */
    share(locals: Object): View.Engine
    /**
      * Render a view from the `resources/views` directory.
      *
      * All parameters are directly
      * passed to http://edge.adonisjs.com/docs/getting-started#_rendering_template_files
      *
      * @method render
      *
      * @param  {...Spread} params
      *
      * @return {String}
      */
    render(view: string, data?: {}): string
    /**
      * Renders a plain string
      *
      * All parameters are directly
      * passed to http://edge.adonisjs.com/docs/getting-started#_rendering_plain_string
      *
      * @method renderString
      *
      * @param  {...Spread}  params
      *
      * @return {String}
      */
    renderString(statement: string, data?: {}): string
    /**
      * Pass presenter to the view while rendering
      *
      * @method presenter
      *
      * @param  {...Spread} params
      *
      * @return {Object}
      */
    presenter(presenter: string): View.Engine
    /**
      * Add a new tag to the view
      *
      * @method tag
      *
      * @param  {...Spread} params params
      *
      * @return {void}
      */
    tag(tag: View.Tag): void
}

declare namespace View {
    class Engine {
        new(): Template
        tag(tag: Tag): void
        configure(options: Object): void
        global(name: string, value: any): void
        registerViews(location: string): void
        registerPresenters(location: string): void
        renderString(statement: string, data?: {}): string
        compileString(statement: string, asFunction?: true): string
        render(view: string, data?: {}): string
        compile(view: string, asFunction?: true): string
        presenter(presenter: string): Engine
        share(locals: Object): Engine
    }

    /**
      * Template class is used to compile and render the
      * views. Each view file or view string will have
      * a single instance of template class.
      *
      * ## Compile Time
      * The first phase of the view is the compile time, here
      * the view string is converted into AST and further
      * processed into a compiled view, can be used saved
      * to a Javascript file.
      *
      * ## Runtime
      * Runtime is the another phase of a template, where the compiled
      * template is loaded and run. The runtime scope of the template
      * is bound to the template instance. Which means `this` will
      * have access to all the methods of this class.
      *
      * @class Template
      * @constructor
      */
    interface Template {
        /**
          * The view to be used in runtime
          *
          * @method runtimeViewName
          *
          * @return {String}
          */
        runtimeViewName : string;

        /**
          * Prepares the stack by adding the view file name
          * lineno and charno where the error has occured.
          *
          * @method _prepareStack
          *
          * @param  {String}      view
          * @param  {Object}      error
          *
          * @return {Object}
          *
          * @private
          * @param view
          * @param error
          * @return
          */
        _prepareStack(view : string, error : Object): Object;

        /**
          * Returns a new instance of context to be
          * used for running template.
          *
          * @method _makeContext
          *
          * @param  {Object}     data
          *
          * @return {Object}
          *
          * @private
          * @param data
          */
        _makeContext(data : Object): Object;

        /**
          * Add view name to the list of runtime views
          *
          * @method _addRunTimeView
          *
          * @param  {String}        view
          *
          * @private
          * @param view
          */
        _addRunTimeView(view : string): void;

        /**
          * Remove last view from the list of runtime view.
          * In short it calls `Array.pop()`
          *
          * @method _removeRunTimeView
          *
          * @return {void}
          *
          * @private
          * @return
          */
        _removeRunTimeView(): void;

        /**
          * Return the view from cache if cachining is
          * turned on.
          *
          * @method _getFromCache
          *
          * @param  {String}      view
          *
          * @return {String|Null}
          *
          * @private
          * @param view
          * @return
          */
        _getFromCache(view : string): string | null;

        /**
          * Save view to cache when caching is turned on
          *
          * @method _saveToCache
          *
          * @param  {String}     view
          * @param  {String}     output
          *
          * @return {void}
          *
          * @private
          * @param view
          * @param output
          * @return
          */
        _saveToCache(view : string, output : string): void;

        /**
          * Compile a view by loading it from the disk and
          * cache the view when caching is set to true.
          *
          * @method _compileView
          *
          * @param  {String}     view
          * @param  {Boolean}     [asFunction = true]
          *
          * @return {String}
          * @param view
          * @param asFunction?
          * @return
          */
        _compileView(view : string, asFunction? : true): string;

        /**
          * The presenter to be used when rendering
          * the view.
          *
          * @method presenter
          *
          * @param  {String}  presenter
          *
          * @chainable
          * @param presenter
          * @return
          */
        presenter(presenter : string): Template;

        /**
          * Share the locals to be used when rendering
          * the view.
          *
          * @method share
          *
          * @param  {Object} locals
          *
          * @chainable
          * @param locals
          * @return
          */
        share(locals : Object): Template;

        /**
          * The view to be compiled or to be
          * rendered later
          *
          * @method view
          *
          * @param  {String} viewName
          *
          * @chainable
          * @param viewName
          * @return
          */
        setView(viewName : string): Template;

        /**
          * Compiles a view by loading it from the
          * registered views path
          *
          * @method compile
          *
          * @param  {String} view
          * @param  {Boolean} [asFunction = true]
          *
          * @return {String}
          * @param view
          * @param asFunction?
          * @return
          */
        compile(view : string, asFunction? : true): string;

        /**
          * Compiles the string as a view.
          *
          * @method compileString
          *
          * @param  {String}      statement
          * @param  {Boolean}     asFunction
          *
          * @return {String}
          * @param statement
          * @param asFunction
          * @return
          */
        compileString(statement : string, asFunction : boolean): string;

        /**
          * Render a view by loading it from the disk
          *
          * @method render
          *
          * @param  {String} view
          * @param  {Object} data
          *
          * @return {String}
          * @param view
          * @param data
          * @return
          */
        render(view : string, data : Object): string;

        /**
          * Render a view via string
          *
          * @method renderString
          *
          * @param  {String}     statement
          * @param  {Object}     data
          *
          * @return {String}
          * @param statement
          * @param data
          * @return
          */
        renderString(statement : string, data : Object): string;

        /**
          * Render a view at runtime. The runtime view has
          * scope of it's parent template.
          *
          * @method runTimeRender
          *
          * @param  {String}      view
          *
          * @return {String}
          * @param view
          * @return
          */
        runTimeRender(view : string): string;

        /**
          * Create an islotated layer within the
          * rendering function
          *
          * @method isolate
          *
          * @param  {Function} callback
          *
          * @return {void}
          * @param callback
          * @return
          */
        isolate(callback : Function): void;

        /**
          * Creates a new runtime context.
          *
          * @method newContext
          *
          * @param  {Spread}   [props]
          *
          * @return {Object}
          * @param ...props
          * @return
          */
        newContext(...props : Object[]): Template;

        /**
          * Render the view with existing context. In short do not create
          * a new context and assume that `this.context` exists.
          *
          * @method renderWithContext
          *
          * @param  {String}          view
          *
          * @return {String}
          * @param view
          * @return
          */
        renderWithContext(view : string): string;
    }

    interface Tag {
        tagName: string
        compile(
            compiler: Object,
            lexer   : Object,
            buffer  : Object,
            options: {
                body  : string
                childs: any[]
                lineno: number
            }
        ): void
        run(Context: Context): void
    }

    /**
     * The base presenter class to be used for creating
     * custom presenters. It simply merges the data
     * and locals together and set `$data` property
     * to be consumed by context internally.
     *
     * @class BasePresenter
     */
    interface BasePresenter {
        $data : any;
    }

    /**
     * Runtime context used to run the compiled
     * templates. View **locals**, **globals**,
     * and **presenter** all are accessible
     * from the context.
     *
     * Values are resolved in following order.
     *
     * 1. Frames
     * 2. Presenter
     * 3. Data/Locals
     * 4. Globals
     *
     * @class Context
     *
     * @constructor
     */
    interface Context {

        /**
         * Pushes a new frame to the frames array.
         *
         * @method newFrame
         *
         * @return {void}
         * @return
         */
        newFrame(): void;

        /**
         * Sets the value on the most recent frame.
         *
         * @method setOnFrame
         *
         * @param  {String}   key
         * @param  {Mixed}   value
         *
         * @throws {Exception} If trying to set value without calling the `newFrame` method.
         * @param key
         * @param value
         */
        setOnFrame(key : string, value : any): void;

        /**
         * Clears the most recent frame.
         *
         * @method clearFrame
         *
         * @return {void}
         * @return
         */
        clearFrame(): void;

        /**
         * Access a child from the hash
         *
         * @method accessChild
         *
         * @param  {Array|Object}    hash
         * @param  {Array}    childs
         *
         * @return {Mixed}
         *
         * @example
         * ```
         * const users = [{username: 'foo'}]
         * const username = accessChild(users, ['0', 'username'])
         * ```
         * @param hash
         * @param childs
         * @param i
         * @return
         */
        accessChild(hash : Array<any> | Object, childs : Array<String>, i? : number): any;

        /**
         * Escapes the input by sanitizing HTML.
         *
         * @method escape
         *
         * @param  {String} input
         *
         * @return {String}
         * @param input
         * @return
         */
        escape(input : string): string;

        /**
         * Resolves a key in following order.
         *
         * 1. frame
         * 2. presenter
         * 3. presenter data/locals
         * 4. global
         *
         * @method resolve
         *
         * @param  {String} key
         *
         * @return {Mixed}
         * @param key
         * @return
         */
        resolve(key : string): any;

        /**
         * Calls a function and pass the arguments. Also the
         * function scope will be changed to context scope.
         *
         * @method callFn
         *
         * @param  {String} name
         * @param  {Array} args
         *
         * @return {Mixed}
         * @param name
         * @param args
         * @return
         */
        callFn(name : string, args : Array<any>): any;

        /**
         *
         * @param name
         * @param fn
         */
        macro(name : string, fn : Function): void;

        $viewName: string;
        $globals : Object;
        $presenter: BasePresenter;
    }
}

/**
  * DatabaseManager is a layer on top of @ref('Database') class. It
  * manages a pool of different database connections and proxy all
  * Database methods, so that it's easier to work with them.
  *
  * ```js
  * const Database = use('Database')
  *
  * // making query on default connection
  * await Database.table('users')
  *
  * // making query on selected connection
  * await Database.connection('mysql').table('users')
  * ```
  *
  * @binding Adonis/Src/Database
  * @singleton
  * @alias Database
  * @group Database
  * @uses (['Adonis/Src/Config'])
  *
  * @class DatabaseManager
  */
interface DatabaseManager {
    /**
      * Creates a new database connection for the config defined inside
      * `config/database` file. You just need to pass the key name or don't
      * pass any name to use the default connection.
      *
      * Also this method will reuse and returns the existing connections.
      *
      * @method connection
      *
      * @param  {String}   [name = Config.get('database.connection')]
      *
      * @return {Database}
      *
      * @throws {missingDatabaseConnection} If connection is not defined in config file.
      * @param name?
      * @return
      */
    connection(name? : string): Database;

    /**
      * Close all or selected db connections and remove them from pool.
      *
      * Note always use this method to close database connection and
      * never use the direct instance of database, since that will
      * cause memory leaks.
      *
      * @method close
      *
      * @param {String|Array} [names = *]
      *
      * @return {void}
      *
      * @example
      * ```js
      * // WRONG
      * const Db = Database.connection('mysql')
      * Db.close()
      * ```
      *
      * ```js
      * // RIGHT
      * Database.close('mysql')
      * ```
      * @param names?
      * @return
      */
    close(names? : string | Array<string>): void;
}

/**
  * The database class is a reference to knex for a single
  * connection. It has couple of extra methods over Database.
  *
  * Note: You don't instantiate this class directly but instead
  * make use of @ref('DatabaseManager')
  *
  * @class Database
  * @constructor
  * @group Database
  */
interface Database extends DatabaseManager, Database.Builder {
    /**
      * The schema builder instance to be used
      * for creating database schema.
      *
      * You should obtain a new schema instance for every
      * database operation and should never use stale
      * instances. For example
      *
      * @example
      * ```js
      * // WRONG
      * const schema = Database.schema
      * schema.createTable('users')
      * schema.createTable('profiles')
      * ```
      *
      * ```js
      * // RIGHT
      * Database.schema.createTable('users')
      * Database.schema.createTable('profiles')
      * ```
      *
      * @attribute schema
      *
      * @return {Object}
      */
    schema: Database.SchemaBuilder;

    /**
      * Returns the fn from knex instance
      *
      * @method fn
      *
      * @return {Object}
      */
    fn: Database.FunctionHelper;

    /**
      * Returns a trx object to be used for running queries
      * under transaction.
      *
      * @method beginTransaction
      * @async
      *
      * @return {Object}
      *
      * @example
      * ```js
      * const trx = await Database.beginTransaction()
      * await trx
      *   .table('users')
      *   .insert({ username: 'virk' })
      *
      * // or
      * Database
      *   .table('users')
      *   .transacting(trx)
      *   .insert({ username: 'virk' })
      * ```
      */
    beginTransaction(): Promise<Database.Transaction>;

    /**
      * Run a callback inside a transaction
      *
      * @param {Function} callback
      *
      * @method transaction
      *
      * @returns Object
      */
    transaction(callback: (trx: Database.Transaction) => void): void

    /**
      * Starts a global transaction, where all query builder
      * methods will be part of transaction automatically.
      *
      * Note: You must not use it in real world apart from when
      * writing tests.
      *
      * @method beginGlobalTransaction
      * @async
      *
      * @return {void}
      */
    beginGlobalTransaction(): Promise<void>

    /**
      * Rollbacks global transaction.
      *
      * @method rollbackGlobalTransaction
      *
      * @return {void}
      */
    rollbackGlobalTransaction(): void

    /**
      * Commits global transaction.
      *
      * @method commitGlobalTransaction
      *
      * @return {void}
      */
    commitGlobalTransaction(): void

    /**
      * Return a new instance of query builder
      *
      * @method query
      *
      * @return {Object}
      */
    query(): Database.Builder

    /**
      * Closes the database connection. No more queries
      * can be made after this.
      *
      * @method close
      *
      * @return {Promise}
      */
    close(): Promise<void>
}

declare namespace Database {
    type Direction = 'asc' | 'desc'
    type SimpleAny = number | string | Date
    type AggragationResult = Promise<Object[][]>
    type NumberResult = Promise<number>
    type NumberResults = Promise<number[]>

    type Callback = Function;
    type Client = Function;
    type Value = string | number | boolean | Date | Array<string> | Array<number> | Array<Date> | Array<boolean> | Buffer | Raw;
    type ValueMap = { [key: string]: Value | QueryInterface };
    type ColumnName = string | Raw | QueryInterface | {[key: string]: string };
    type TableName = string | Raw | QueryInterface;

    interface PaginationPages {
        total: number
        currentPage: number
        perPage: number
        lastPage: number
    }

    class PaginationResult<T> {
        pages: PaginationPages
        row: T[]
    }

    interface QueryInterface {
        select: Select;
        as: As;
        columns: Select;
        column: Select;
        from: Table;
        into: Table;
        table: Table;
        distinct: Distinct;

        // Joins
        join: Join;
        joinRaw: JoinRaw;
        innerJoin: Join;
        leftJoin: Join;
        leftOuterJoin: Join;
        rightJoin: Join;
        rightOuterJoin: Join;
        outerJoin: Join;
        fullOuterJoin: Join;
        crossJoin: Join;

        // Withs
        with: With;
        withRaw: WithRaw;
        withSchema: WithSchema;
        withWrapped: WithWrapped;

        // Wheres
        where: Where;
        andWhere: Where;
        orWhere: Where;
        whereNot: Where;
        andWhereNot: Where;
        orWhereNot: Where;
        whereRaw: WhereRaw;
        orWhereRaw: WhereRaw;
        andWhereRaw: WhereRaw;
        whereWrapped: WhereWrapped;
        havingWrapped: WhereWrapped;
        whereExists: WhereExists;
        orWhereExists: WhereExists;
        whereNotExists: WhereExists;
        orWhereNotExists: WhereExists;
        whereIn: WhereIn;
        orWhereIn: WhereIn;
        whereNotIn: WhereIn;
        orWhereNotIn: WhereIn;
        whereNull: WhereNull;
        orWhereNull: WhereNull;
        whereNotNull: WhereNull;
        orWhereNotNull: WhereNull;
        whereBetween: WhereBetween;
        orWhereBetween: WhereBetween;
        andWhereBetween: WhereBetween;
        whereNotBetween: WhereBetween;
        orWhereNotBetween: WhereBetween;
        andWhereNotBetween: WhereBetween;

        // Group by
        groupBy: GroupBy;
        groupByRaw: RawQueryBuilder;

        // Order by
        orderBy: OrderBy;
        orderByRaw: RawQueryBuilder;

        // Union
        union: Union;
        unionAll(callback: QueryCallback): QueryInterface;

        // Having
        having: Having;
        andHaving: Having;
        havingRaw: RawQueryBuilder;
        orHaving: Having;
        orHavingRaw: RawQueryBuilder;
        havingIn: HavingIn;

        // Clear
        clearSelect(): QueryInterface;
        clearWhere(): QueryInterface;

        // Paging
        offset(offset: number): QueryInterface;
        limit(limit: number): QueryInterface;

        // Aggregation
        count(columnName?: string): QueryInterface;
        countDistinct(columnName?: string): QueryInterface;
        min(columnName: string): QueryInterface;
        max(columnName: string): QueryInterface;
        sum(columnName: string): QueryInterface;
        sumDistinct(columnName: string): QueryInterface;
        avg(columnName: string): QueryInterface;
        avgDistinct(columnName: string): QueryInterface;
        increment(columnName: string, amount?: number): QueryInterface;
        decrement(columnName: string, amount?: number): QueryInterface;

        // Others
        first: Select;

        debug(enabled?: boolean): QueryInterface;
        pluck(column: string): QueryInterface;

        insert(data: any, returning?: string | string[]): QueryInterface;
        modify(callback: QueryCallbackWithArgs, ...args: any[]): QueryInterface;
        update(data: any, returning?: string | string[]): QueryInterface;
        update(columnName: string, value: Value, returning?: string | string[]): QueryInterface;
        returning(column: string | string[]): QueryInterface;

        del(returning?: string | string[]): QueryInterface;
        delete(returning?: string | string[]): QueryInterface;
        truncate(): QueryInterface;

        transacting(trx?: Transaction): QueryInterface;

        clone(): QueryInterface;
        toSQL(): Sql;
    }

    interface Transaction extends QueryInterface{
        savepoint(transactionScope: (trx: Transaction) => any): Bluebird<any>;
        commit(value?: any): QueryInterface;
        rollback(error?: any): QueryInterface;
    }

    interface As {
        (columnName: string): QueryInterface;
    }

    interface Select extends ColumnNameQueryBuilder {
        (aliases: { [alias: string]: string }): QueryInterface;
    }

    interface Table {
        (tableName: TableName): QueryInterface;
        (callback: Function): QueryInterface;
        (raw: Raw): QueryInterface;
    }

    interface Distinct extends ColumnNameQueryBuilder {
    }

    interface Join {
        (raw: Raw): QueryInterface;
        (tableName: TableName | QueryCallback, clause: (this: JoinClause, join: JoinClause) => void): QueryInterface;
        (tableName: TableName | QueryCallback, columns: { [key: string]: string | number | Raw }): QueryInterface;
        (tableName: TableName | QueryCallback, raw: Raw): QueryInterface;
        (tableName: TableName | QueryCallback, column1: string, column2: string): QueryInterface;
        (tableName: TableName | QueryCallback, column1: string, raw: Raw): QueryInterface;
        (tableName: TableName | QueryCallback, column1: string, operator: string, column2: string): QueryInterface;
    }

    interface JoinClause {
        on(raw: Raw): JoinClause;
        on(callback: QueryCallback): JoinClause;
        on(columns: { [key: string]: string | Raw }): JoinClause;
        on(column1: string, column2: string): JoinClause;
        on(column1: string, raw: Raw): JoinClause;
        on(column1: string, operator: string, column2: string | Raw): JoinClause;
        andOn(raw: Raw): JoinClause;
        andOn(callback: QueryCallback): JoinClause;
        andOn(columns: { [key: string]: string | Raw }): JoinClause;
        andOn(column1: string, column2: string): JoinClause;
        andOn(column1: string, raw: Raw): JoinClause;
        andOn(column1: string, operator: string, column2: string | Raw): JoinClause;
        orOn(raw: Raw): JoinClause;
        orOn(callback: QueryCallback): JoinClause;
        orOn(columns: { [key: string]: string | Raw }): JoinClause;
        orOn(column1: string, column2: string): JoinClause;
        orOn(column1: string, raw: Raw): JoinClause;
        orOn(column1: string, operator: string, column2: string | Raw): JoinClause;
        onIn(column1: string, values: any[]): JoinClause;
        andOnIn(column1: string, values: any[]): JoinClause;
        orOnIn(column1: string, values: any[]): JoinClause;
        onNotIn(column1: string, values: any[]): JoinClause;
        andOnNotIn(column1: string, values: any[]): JoinClause;
        orOnNotIn(column1: string, values: any[]): JoinClause;
        onNull(column1: string): JoinClause;
        andOnNull(column1: string): JoinClause;
        orOnNull(column1: string): JoinClause;
        onNotNull(column1: string): JoinClause;
        andOnNotNull(column1: string): JoinClause;
        orOnNotNull(column1: string): JoinClause;
        onExists(callback: QueryCallback): JoinClause;
        andOnExists(callback: QueryCallback): JoinClause;
        orOnExists(callback: QueryCallback): JoinClause;
        onNotExists(callback: QueryCallback): JoinClause;
        andOnNotExists(callback: QueryCallback): JoinClause;
        orOnNotExists(callback: QueryCallback): JoinClause;
        onBetween(column1: string, range: [any, any]): JoinClause;
        andOnBetween(column1: string, range: [any, any]): JoinClause;
        orOnBetween(column1: string, range: [any, any]): JoinClause;
        onNotBetween(column1: string, range: [any, any]): JoinClause;
        andOnNotBetween(column1: string, range: [any, any]): JoinClause;
        orOnNotBetween(column1: string, range: [any, any]): JoinClause;
        using(column: string | string[] | Raw | { [key: string]: string | Raw }): JoinClause;
        type(type: string): JoinClause;
    }

    interface JoinRaw {
        (tableName: string, binding?: Value): QueryInterface;
    }

    interface With extends WithRaw, WithWrapped {
    }

    interface WithRaw {
        (alias: string, raw: Raw): QueryInterface;
        (alias: string, sql: string, bindings?: Value[] | Object): QueryInterface;
    }

    interface WithSchema {
        (schema: string): QueryInterface;
    }

    interface WithWrapped {
        (alias: string, callback: (queryBuilder: QueryInterface) => any): QueryInterface;
    }

    interface Where extends WhereRaw, WhereWrapped, WhereNull {
        (raw: Raw): QueryInterface;
        (callback: QueryCallback): QueryInterface;
        (object: Object): QueryInterface;
        (columnName: string, value: Value | null): QueryInterface;
        (columnName: string, operator: string, value: Value | QueryInterface | null): QueryInterface;
        (left: Raw, operator: string, right: Value | QueryInterface | null): QueryInterface;
    }

    interface WhereRaw extends RawQueryBuilder {
        (condition: boolean): QueryInterface;
    }

    interface WhereWrapped {
        (callback: QueryCallback): QueryInterface;
    }

    interface WhereNull {
        (columnName: string): QueryInterface;
    }

    interface WhereIn {
        (columnName: string, values: Value[]): QueryInterface;
        (columnName: string, callback: QueryCallback): QueryInterface;
        (columnName: string, query: QueryInterface): QueryInterface;
    }

    interface WhereBetween {
        (columnName: string, range: [Value, Value]): QueryInterface;
    }

    interface WhereExists {
        (callback: QueryCallback): QueryInterface;
        (query: QueryInterface): QueryInterface;
    }

    interface WhereNull {
        (columnName: string): QueryInterface;
    }

    interface WhereIn {
        (columnName: string, values: Value[]): QueryInterface;
    }

    interface GroupBy extends RawQueryBuilder, ColumnNameQueryBuilder {
    }

    interface OrderBy {
        (columnName: string, direction?: string): QueryInterface;
    }

    interface Union {
        (callback: QueryCallback, wrap?: boolean): QueryInterface;
        (callbacks: QueryCallback[], wrap?: boolean): QueryInterface;
        (...callbacks: QueryCallback[]): QueryInterface;
        // (...callbacks: QueryCallback[], wrap?: boolean): QueryInterface;
    }

    interface Having extends RawQueryBuilder, WhereWrapped {
        (tableName: string, column1: string, operator: string, column2: string): QueryInterface;
    }

    interface HavingIn {
        (columnName: string, values: Value[]): QueryInterface;
    }

    // commons

    interface ColumnNameQueryBuilder {
        (...columnNames: ColumnName[]): QueryInterface;
        (columnNames: ColumnName[]): QueryInterface;
    }

    interface RawQueryBuilder {
        (sql: string, ...bindings: (Value | QueryInterface)[]): QueryInterface;
        (sql: string, bindings: (Value | QueryInterface)[] | ValueMap): QueryInterface;
        (raw: Raw): QueryInterface;
    }

    // Raw

    interface Raw extends events.EventEmitter {
        wrap(before: string, after: string): Raw;
    }

    interface RawBuilder {
        (value: Value): Raw;
        (sql: string, ...bindings: (Value | QueryInterface)[]): Raw;
        (sql: string, bindings: (Value | QueryInterface)[] | ValueMap): Raw;
    }

    //
    // QueryInterface
    //

    type QueryCallback = (this: QueryInterface, builder: QueryInterface) => void;
    type QueryCallbackWithArgs = (this: QueryInterface, builder: QueryInterface, ...args: any[]) => void;

    interface Sql {
        method: string;
        options: any;
        bindings: Value[];
        sql: string;
    }

    //
    // Schema builder
    //
    interface SchemaBuilder extends Bluebird<any> {
        createTable(tableName: string, callback: (tableBuilder: CreateTableBuilder) => any): SchemaBuilder;
        createTableIfNotExists(tableName: string, callback: (tableBuilder: CreateTableBuilder) => any): SchemaBuilder;
        alterTable(tableName: string, callback: (tableBuilder: CreateTableBuilder) => any): SchemaBuilder;
        renameTable(oldTableName: string, newTableName: string): Bluebird<void>;
        dropTable(tableName: string): SchemaBuilder;
        hasTable(tableName: string): Bluebird<boolean>;
        hasColumn(tableName: string, columnName: string): Bluebird<boolean>;
        table(tableName: string, callback: (tableBuilder: AlterTableBuilder) => any): Bluebird<void>;
        dropTableIfExists(tableName: string): SchemaBuilder;
        raw(statement: string): SchemaBuilder;
        withSchema(schemaName: string): SchemaBuilder;
    }

    interface TableBuilder {
        increments(columnName?: string): ColumnBuilder;
        bigIncrements(columnName?: string): ColumnBuilder;
        dropColumn(columnName: string): TableBuilder;
        dropColumns(...columnNames: string[]): TableBuilder;
        renameColumn(from: string, to: string): ColumnBuilder;
        integer(columnName: string): ColumnBuilder;
        bigInteger(columnName: string): ColumnBuilder;
        text(columnName: string, textType?: string): ColumnBuilder;
        string(columnName: string, length?: number): ColumnBuilder;
        float(columnName: string, precision?: number, scale?: number): ColumnBuilder;
        decimal(columnName: string, precision?: number | null, scale?: number): ColumnBuilder;
        boolean(columnName: string): ColumnBuilder;
        date(columnName: string): ColumnBuilder;
        dateTime(columnName: string): ColumnBuilder;
        time(columnName: string): ColumnBuilder;
        timestamp(columnName: string, standard?: boolean): ColumnBuilder;
        timestamps(useTimestampType?: boolean, makeDefaultNow?: boolean): ColumnBuilder;
        binary(columnName: string, length?: number): ColumnBuilder;
        enum(columnName: string, values: Value[]): ColumnBuilder;
        enu(columnName: string, values: Value[]): ColumnBuilder;
        json(columnName: string): ColumnBuilder;
        jsonb(columnName: string): ColumnBuilder;
        uuid(columnName: string): ColumnBuilder;
        comment(val: string): TableBuilder;
        specificType(columnName: string, type: string): ColumnBuilder;
        primary(columnNames: string[]): TableBuilder;
        index(columnNames: (string | Raw)[], indexName?: string, indexType?: string): TableBuilder;
        unique(columnNames: (string | Raw)[], indexName?: string): TableBuilder;
        foreign(column: string, foreignKeyName?: string): ForeignConstraintBuilder;
        foreign(columns: string[], foreignKeyName?: string): MultikeyForeignConstraintBuilder;
        dropForeign(columnNames: string[], foreignKeyName?: string): TableBuilder;
        dropUnique(columnNames: (string | Raw)[], indexName?: string): TableBuilder;
        dropPrimary(constraintName?: string): TableBuilder;
        dropIndex(columnNames: (string | Raw)[], indexName?: string): TableBuilder;
        dropTimestamps(): ColumnBuilder;
    }

    interface CreateTableBuilder extends TableBuilder {
    }

    interface AlterTableBuilder extends TableBuilder {
    }

    interface MySqlAlterTableBuilder extends AlterTableBuilder {
    }

    interface ColumnBuilder {
        index(indexName?: string): ColumnBuilder;
        primary(constraintName?: string): ColumnBuilder;
        unique(indexName?: string): ColumnBuilder;
        references(columnName: string): ReferencingColumnBuilder;
        onDelete(command: string): ColumnBuilder;
        onUpdate(command: string): ColumnBuilder;
        defaultTo(value: Value): ColumnBuilder;
        unsigned(): ColumnBuilder;
        notNullable(): ColumnBuilder;
        nullable(): ColumnBuilder;
        comment(value: string): ColumnBuilder;
        alter(): ColumnBuilder;
    }

    interface ForeignConstraintBuilder {
        references(columnName: string): ReferencingColumnBuilder;
    }

    interface MultikeyForeignConstraintBuilder {
        references(columnNames: string[]): ReferencingColumnBuilder;
    }

    interface PostgreSqlColumnBuilder extends ColumnBuilder {
        index(indexName?: string, indexType?: string): ColumnBuilder;
    }

    interface ReferencingColumnBuilder extends ColumnBuilder {
        inTable(tableName: string): ColumnBuilder;
    }

    interface AlterColumnBuilder extends ColumnBuilder {
    }

    interface MySqlAlterColumnBuilder extends AlterColumnBuilder {
        first(): AlterColumnBuilder;
        after(columnName: string): AlterColumnBuilder;
    }

    //
    // Configurations
    //
    interface ColumnInfo {
        defaultValue: Value;
        type: string;
        maxLength: number;
        nullable: boolean;
    }

    interface FunctionHelper {
        now(): Raw;
    }

    interface Builder {
        //MonkeyPatch.js
        returning(column: string | string[]): this
        from(table: string): this
        table(table: string): this
        into(table: string): this
        withOutPrefix(): this

        select(column: string): this
        select(...columns: string[]): this

        where(column: string, value: any): this
        where(column: string, operator: string, value: any): this
        where(condition: Object): this
        where(callback: QueryCallback): this
        where(subquery: this): this
        whereNot(column: string, value: any): this
        whereNot(column: string, operator: string, value: any): this
        whereNot(condition: Object): this
        whereNot(subquery: this): this
        whereIn(column: string, params: any[]): this
        whereIn(column: string, subquery: this): this
        whereNotIn(column: string, params: any[]): this
        whereNotIn(column: string, subquery: this): this
        whereNull(column: string): this
        whereNotNull(column: string): this
        whereExists(callback: Function): this
        whereNotExists(callback: Function): this
        whereBetween(column: string, params: number[]): this
        whereNotBetween(column: string, params: number[]): this
        whereRaw(exp: string, params?: Database.SimpleAny[]): this

        innerJoin(table: string, leftSideCondition: string, rightSideCondition: string): this
        innerJoin(table: string, callback: Function): this
        leftJoin(table: string, leftSideCondition: string, rightSideCondition: string): this
        leftOuterJoin(table: string, leftSideCondition: string, rightSideCondition: string): this
        rightJoin(table: string, leftSideCondition: string, rightSideCondition: string): this
        rightOuterJoin(table: string, leftSideCondition: string, rightSideCondition: string): this
        outerJoin(table: string, leftSideCondition: string, rightSideCondition: string): this
        fullOuterJoin(table: string, leftSideCondition: string, rightSideCondition: string): this
        crossJoin(table: string, leftSideCondition: string, rightSideCondition: string): this
        joinRaw(condition: string): this

        distinct(column: string): this
        groupBy(column: string): this
        groupByRaw(exp: string): this

        orderBy(column: string, direction?: Database.Direction): this
        orderByRaw(exp: string): this

        having(column: string, operator: string, value: any): this
        havingIn(column: string, params: any[]): this
        havingNotIn(column: string, params: any[]): this
        havingNull(column: string): this
        havingNotNull(column: string): this
        havingExists(subquery:this): this
        havingExists(callback: Function): this
        havingNotExists(subquery:this): this
        havingNotExists(callback: Function): this
        havingRaw(column: string, operator: string, value: Database.SimpleAny[]): this

        offset(offset: number): this
        limit(limit: number): this

        insert(row: Object): NumberResults
        insert(rows: Object[]): NumberResults
        returning(column: string): NumberResult

        update(column: string, value: Database.SimpleAny): NumberResult
        update(row: Object): NumberResult

        increment(column: string, value?: number): Promise<void>
        decrement(column: string, value?: number): Promise<void>

        delete(): NumberResult
        truncate(table: string): NumberResult

        forPage(page: number, limit?: number): Promise<Object[]>
        forPage<T>(page: number, limit?: number): Promise<T[]>
        paginate(page: number, limit?: number): Promise<Database.PaginationResult<Object>>
        paginate<T>(page: number, limit?: number): Promise<Database.PaginationResult<T>>

        count(): Database.AggragationResult
        count(column: string): Database.AggragationResult
        countDistinct(): Database.AggragationResult
        min(column: string): Database.AggragationResult
        max(column: string): Database.AggragationResult
        sum(column: string): Database.AggragationResult
        sumDistinct(column: string): Database.AggragationResult
        avg(column: string): Database.AggragationResult
        avgDistinct(column: string): Database.AggragationResult

        // helpers
        getCount(column?: string): NumberResult
        getCountDistinct(column?: string): NumberResult
        getMin(column: string): NumberResult
        getMax(colum: string): NumberResult
        getSum(column: string): NumberResult
        getSumDistinct(column: string): NumberResult
        getAvg(column: string): NumberResult
        getAvgDistinct(column: string): NumberResult

        last<T>(field?: string): Promise<T>;
        pluck<T>(colum: string): Promise<T[]>
        first<T>(): Promise<T>
        map<T, R>(callback: (row: T | Object) => R): Promise<R[]>
        reduce<T, S>(reducer: (acc: S, row: T) => S, initValue: S): Promise<S>

        clone(): this;
        columnInfo(): Promise<ColumnInfo>

        raw<T>(expression: string, params?: Database.SimpleAny[]): Promise<T[]>

        asCallback<T>(callback: (err: Object, rows: T[]) => void): void
        stream(callback: any): Object
        on(event: string, callback: Function): this
        toSQL(): Sql
        toString(): string

        then(callback: (response: any) => void): this
        catch(callback: (error: any) => void): this
    }
}

declare namespace Validator {
    interface ErrorMessage {
        message: string
        field: string
        validation: string
    }

    /**
      * Validation class to validate data with a rules
      * schema.
      *
      * @class Validation
      * @constructor
      */
    interface Validation {
        /**
          *
          * @param data
          * @param rules
          * @param messages
          * @param formatter
          */
        new (data : Object, rules : Object, messages : Object, formatter : Object): Validation;

        /**
          * Sets the error as a property on instance.
          *
          * @method _useErrors
          *
          * @param  {Array}   errors
          *
          * @return {void}
          * @param errors
          * @return
          */
        _useErrors(errors : Array<any>): void;

        /**
          * Marks the validation as executed, also makes sure
          * that not re-executing the validations
          *
          * @method _markAsExecuted
          *
          * @return {void}
          * @return
          */
        _markAsExecuted(): void;

        /**
          * Run validation on data using defined rules
          *
          * @method run
          *
          * @return {this}
          * @return
          */
        run(): this;

        /**
          * Run all validations, regardless of failures. The `run`
          * method on the opposite side stops at the first
          * validation
          *
          * @method runAll
          *
          * @return {this}
          * @return
          */
        runAll(): this;

        /**
          * Returns an array of validation messages
          * or null, if there are no errors
          *
          * @method messages
          *
          * @return {Array|Null}
          * @return
          */
        messages(): Array<ErrorMessage> | null;

        /**
          * Returns a boolean indicating if there are
          * validation errors
          *
          * @method fails
          *
          * @return {Boolean}
          * @return
          */
        fails(): boolean;

        _data           : Object
        _rules          : Object
        _messages       : Object
        _formatter      : Object
        _executed       : boolean;
        _errorMessages  : Array<any>;
    }

    interface Formatter {
        /**
         * Stores the error to errors stack
         *
         * @method addError
         *
         * @param {Object} error
         * @param {String} field
         * @param {String} validation
         * @param {Array} args
         *
         * @return {void}
         */
        addError(error: Object, field: String, validation: String, args?: Array<any>): void;

        /**
         * Returns an array of errors
         *
         * @method toJSON
         *
         * @return {Array}
         */
        toJSON(): Array<any>
    }

    type MessageHandler = (field: String, validation: String, args: Array<any>) => String;
    type Messages = { [key in string]: String | MessageHandler };
    type Validate = (data: Object, rules: Object, messages?: Validator.Messages, formatter?: Validator.Formatter) => Promise<Validation>;
    type Sanitize = (data: Object, rules: Object) => Object;
    type Formatters = { Vanilla: Validator.Formatter, JsonApi: Validator.Formatter };
    type ValidatorHandler = (data: Object, field: string, message: string, args: Array<any>, get: (obj: Object, path: string) => any) => Promise<any>;

    type Is = (data: string | number) => boolean;
    type IsRaw = {
        [key in
            'above' |
            'affirmative' |
            'afterOffsetOf' |
            'alpha' |
            'alphaNumeric' |
            'array' |
            'beforeOffsetOf' |
            'between' |
            'boolean' |
            'creditCard' |
            'date' |
            'dateFormat' |
            'email' |
            'empty' |
            'even' |
            'existy' |
            'falsy' |
            'future' |
            'inArray' |
            'inDateRange' |
            'intersectAll' |
            'intersectAny' |
            'ip' |
            'ipv4' |
            'ipv6' |
            'isDate' |
            'Isction' |
            'isNull' |
            'isNumber' |
            'isObject' |
            'isString' |
            'json' |
            'negative' |
            'odd' |
            'past' |
            'phone' |
            'positive' |
            'regex' |
            'same' |
            'sameType' |
            'sorted' |
            'today' |
            'tomorrow' |
            'truthy' |
            'under' |
            'url' |
            'yesterday'
        ]: Is
    }

    type Sanitizor = <T>(value: string, args?: Array<T>) => string;
    type SanitizorRaw = {
        [key in
            'normalizeEmail' |
            'stripTags' |
            'toBoolean' |
            'toNull' |
            'toInt' |
            'toDate' |
            'plural' |
            'singular' |
            'slug' |
            'escape' |
            'stripLinks' |
            'trim'
        ]: Sanitizor
    }

    /**
     * Since haye pipe expression cannot allow all the keywords, this
     * method helps in defining rules in a raw format.
     *
     * ## Note
     * When using `rule` method, you cannot make use of string expression
     * for that field. However, you can mix both for different fields.
     *
     * @param  {String}              name
     * @param  {Array|String|Number} args
     * @return {Object}
     *
     * @example
     * {
     *   username: [
     *    rule('required'),
     *    rule('alpha')
     *   ],
     *   email: 'email'
     * }
     */
    type RuleName =
        "required"           |
        "above"              |
        "accepted"           |
        "after"              |
        "afterOffsetOf"      |
        "alpha"              |
        "alphaNumeric"       |
        "array"              |
        "before"             |
        "beforeOffsetOf"     |
        "boolean"            |
        "confirmed"          |
        "date"               |
        "dateFormat"         |
        "different"          |
        "email"              |
        "endsWith"           |
        "equals"             |
        "in"                 |
        "includes"           |
        "integer"            |
        "ip"                 |
        "ipv4"               |
        "ipv6"               |
        "json"               |
        "max"                |
        "min"                |
        "notEquals"          |
        "notIn"              |
        "number"             |
        "object"             |
        "range"              |
        "regex"              |
        "required"           |
        "requiredIf"         |
        "requiredWhen"       |
        "requiredWithAll"    |
        "requiredWithAny"    |
        "requiredWithoutAll" |
        "requiredWithoutAny" |
        "same"               |
        "startsWith"         |
        "string"             |
        "under"              |
        "url"                |
        "unique";
    type Rule = (name: RuleName, args?: any) => Object;

    /**
     * Exception to throw when validation fails
     *
     * @class ValidationException
     */
    interface ValidationException extends GE.RuntimeException {
        validationFailed (messages: Array<string>): ValidationException;
    }

}

declare interface Validator {
    validateAll : Validator.Validate
    validate    : Validator.Validate
    sanitize    : Validator.Sanitize
    rule        : Validator.Rule;
    is          : Validator.IsRaw
    sanitizor   : Validator.SanitizorRaw
    formatters  : Validator.Formatters
    configure(options: Object): void
    extend(rule : string, fn : Validator.ValidatorHandler) : void
    ValidationException: Validator.ValidationException
}

declare namespace Ignitor {
    type callback = () => void;
    type validHooks = {
        [key in
            'providersRegistered' |
            'providersBooted' |
            'preloading' |
            'httpServer' |
            'aceCommand'
        ]: (callback: callback) => void;
    }

    /**
      * Hooks class is used to register hooks
      *
      * @class Hooks
      */
    interface Hooks extends validHooks {
        /**
          * Returns an array of registered hooks for
          * a given event. If no hooks are registered
          * an empty is returned
          *
          * @method get
          *
          * @param  {String} name
          *
          * @return {Array}
          * @param name
          * @return
          */
        get(name : string): Array<Function>;

        /**
          * Clear all registered hooks by redefining _hooks
          * private property
          *
          * @method clear
          *
          * @return {void}
          * @return
          */
        clear(): void;

        /**
          * Reference to registered hooks
          *
          * @attribute hooks
          *
          * @return {Object}
          */
        hooks : Object;
    }

    /**
      * This class returns absolute path to commonly
      * used AdonisJs directories.
      *
      * @namespace Adonis/Src/Helpers
      * @alias Helpers
      * @singleton
      * @group Core
      *
      * @class Helpers
      * @constructor
      */
    interface Helpers {
        /**
          * Returns path to the application root
          *
          * @method appRoot
          *
          * @param  {String}   [toFile = '']
          *
          * @return {String}
          * @param toFile?
          * @return
          */
        appRoot(toFile? : string): string;

        /**
          * Returns path to the public directory or a
          * specific file to the public directory.
          *
          * ## Note
          * This method does not check the existence of
          * file.
          *
          * @method publicPath
          *
          * @param  {String}   [toFile = '']
          *
          * @return {String}
          * @param toFile?
          * @return
          */
        publicPath(toFile? : string): string;

        /**
          * Returns path to the config directory.
          *
          * ## Note
          * This method does not check the existence of
          * file.
          *
          * @method configPath
          *
          * @return {String}
          * @return
          */
        configPath(): string;

        /**
          * Returns path to the resources directory or a
          * specific file to the resources directory.
          *
          * ## Note
          * This method does not check the existence of
          * file.
          *
          * @method resourcesPath
          *
          * @param  {String}   [toFile = '']
          *
          * @return {String}
          * @param toFile?
          * @return
          */
        resourcesPath(toFile? : string): string;

        /**
          * Returns path to the views directory or a
          * specific file to the views directory.
          *
          * ## Note
          * This method does not check the existence of
          * file.
          *
          * @method viewsPath
          *
          * @param  {String}   [toFile = '']
          *
          * @return {String}
          * @param toFile?
          * @return
          */
        viewsPath(toFile? : string): string;

        /**
          * Returns path to the database directory or a
          * specific file to the database directory.
          *
          * ## Note
          * This method does not check the existence of
          * file.
          *
          * @method databasePath
          *
          * @param  {String}   [toFile = '']
          *
          * @return {String}
          * @param toFile?
          * @return
          */
        databasePath(toFile? : string): string;

        /**
          * Returns path to the migrations directory or a
          * specific file to the migrations directory.
          *
          * ## Note
          * This method does not check the existence of
          * file.
          *
          * @method migrationsPath
          *
          * @param  {String}   [toFile = '']
          *
          * @return {String}
          * @param toFile?
          * @return
          */
        migrationsPath(toFile? : string): string;

        /**
          * Returns path to the seeds directory or a
          * specific file to the seeds directory.
          *
          * ## Note
          * This method does not check the existence of
          * file.
          *
          * @method seedsPath
          *
          * @param  {String}   [toFile = '']
          *
          * @return {String}
          * @param toFile?
          * @return
          */
        seedsPath(toFile? : string): string;

        /**
          * Returns path to the tmp directory or a
          * specific file to the tmp directory.
          *
          * ## Note
          * This method does not check the existence of
          * file.
          *
          * @method tmpPath
          *
          * @param  {String}   [toFile = '']
          *
          * @return {String}
          * @param toFile?
          * @return
          */
        tmpPath(toFile? : string): string;

        /**
          * Promisify callback style functions
          *
          * @method promisify
          *
          * @param  {Function} fn
          * @param  {Object}   options
          *
          * @return {Promise}
          * @param fn
          * @param options
          * @return
          */
        promisify<T>(fn : Function, options : any): Promise<T>;

        /**
          * Tells whether the process has been started by
          * ace command.
          *
          * @method isAceCommand
          *
          * @return {Boolean}
          * @return
          */
        isAceCommand(): boolean;
    }
}

interface Ignitor {
    new (fold: Object): Ignitor;
    /**
      * Preloads a file by appending it to the end
      * of the preloads list.
      *
      * @method preLoad
      *
      * @param  {String} filePath
      *
      * @chainable
      * @param filePath
      * @return
      */
    preLoad(filePath : string): this;

    /**
      * Preload a file after a given file. If the `afterFile`
      * is not matched, the file is appended to the end
      * of the list.
      *
      * @method preLoadAfter
      *
      * @param  {String}     afterFilePath
      * @param  {String}     filePath
      *
      * @chainable
      * @param afterFilePath
      * @param filePath
      * @return
      */
    preLoadAfter(afterFilePath : string, filePath : string): this;

    /**
      * Prepend file to the list of preloads before a given
      * file.
      *
      * If the `afterFile` is not matched, the file is appended
      * to the end of the list.
      *
      * @method preLoadBefore
      *
      * @param  {String}      afterFilePath
      * @param  {String}      filePath
      *
      * @chainable
      * @param afterFilePath
      * @param filePath
      * @return
      */
    preLoadBefore(afterFilePath : string, filePath : string): this;

    /**
      * Set application app root
      *
      * @method appRoot
      *
      * @param  {String} location
      *
      * @chainable
      * @param location
      * @return
      */
    appRoot(location : string): this;

    /**
      * Set the application file. This file exports
      * an array of providers, aceProviders, aliases
      * and commands.
      *
      * @method appFile
      *
      * @param  {String} location
      *
      * @chainable
      * @param location
      * @return
      */
    appFile(location : string): this;

    /**
      * Instructor ignitor to load and register
      * commands with ace before firing anything.
      *
      * @method loadCommands
      *
      * @chainable
      * @return
      */
    loadCommands(): this;

    /**
      * Sets up fire by performing following
      * operations in sequence.
      *
      * 1. Register helpers.
      * 2. Load hooks file ( if any ).
      * 3. Register providers.
      * 4. Boot providers.
      * 5. Defined Aliases.
      * 6. Load files to be preload.
      * 7. Start http server.
      *
      * @method fire
      *
      * @return {void}
      *
      * @throws {Error} If app root has not be defined
      * @return
      */
    fire(): Promise<void>;

    /**
      * This method will instruct ignitor to run
      * the websocket server along with the
      * http server
      *
      * @method wsServer
      *
      * @param  {Http.Server} [httpServer]
      *
      * @chainable
      * @param httpServer?
      * @return
      */
    wsServer(httpServer? : Server): this;

    /**
      * Starts the Adonis http server.
      *
      * @method fireHttpServer
      *
      * @param {Function} httpServerCallback
      *
      * @return {void}
      * @param httpServerCallback
      * @return
      */
    fireHttpServer(httpServerCallback? : Function): Promise<void>;

    /**
      * Runs the ace command
      *
      * @method fireAce
      *
      * @return {void}
      * @return
      */
    fireAce(): Promise<void>;

    /**
      * The app namespace registered with resolver
      * for autoloading directories
      *
      * @type {String|Null}
      */
    appNamespace : string | null;
}

declare namespace Fold {
    type IocHandler = (app: Ioc) => void;
    /**
      * Ioc container instance is used to register and fetch dependencies without
      * dealing with system paths. Also dependencies can be dependent upon each
      * other transparently, instead of consumer writing all the wiring code.
      * It has support for autoloading directories, defining aliases and
      * binding fakes. Check official documentation for that.
      *
      * ### Important Note
      * A single instance of this class needs to be used by the entire application.
      * The export method of the module makes sure to return the instantiated class,
      * so that you won't have to manage singleton instances and start using it
      * as `Ioc.bind`, `Ioc.make` etc directly.
      *
      * @class Ioc
      */
    interface Ioc {
        /**
          * Returns the namespace of an autoloaded directory when
          * subset of the namespace to be resolved matches. This function
          * matches the start of the string.
          *
          * ```
          * // Registered namespace: App
          * // Namespace to be resolved: App/Controllers/UsersController
          * 'App/Controllers/UsersController'.startsWith('App')
          * ```
          *
          * @method _getAutoloadedNamespace
          * @private
          *
          * @param  {String} namespace
          * @return {String}
          * @param namespace
          * @return
          */
        _getAutoloadedNamespace(namespace : string): string;

        /**
          * Returns whether a namespace has been registered
          * as a binding inside the IoC container or not.
          *
          * @method _isBinding
          * @private
          *
          * @param {String} name
          * @return {Boolean}
          * @param namespace
          * @return
          */
        _isBinding(namespace : string): boolean;

        /**
          * Returns whether the given namespace is registered as an alias
          * or not. It is does check whether the aliased namespace has
          * been registered to the IoC container or not.
          *
          * @method _isAlias
          * @private
          *
          * @param  {String}  namespace
          * @return {Boolean}
          * @param namespace
          * @return
          */
        _isAlias(namespace : string): boolean;

        /**
          * Returns a boolean indicating whether the namespace to
          * be resolved belongs to a autoloaded directory.
          *
          * @method _isAutoloadedPath
          * @private
          *
          * @param  {String}  namespace
          * @return {Boolean}
          * @param namespace
          * @return
          */
        _isAutoloadedPath(namespace : string): boolean;

        /**
          * Returns whether a given namespace has a manager
          * or not. Managers simply required to allow a
          * provider to be extended via Ioc container.
          *
          * @method _hasManager
          * @private
          *
          * @param  {String}  namespace
          * @return {Boolean}
          * @param namespace
          * @return
          */
        _hasManager(namespace : string): boolean;

        /**
          * Returns whether a fake for the given namespace
          * exists or not.
          *
          * @method _hasFake
          * @private
          *
          * @param  {String}  namespace
          * @return {Boolean}
          * @param namespace
          * @return
          */
        _hasFake(namespace : string): boolean;

        /**
          * Resolves a fake for a namespace when fake
          * is registered.
          *
          * @method _resolveFake
          * @private
          *
          * @param  {String} namespace
          * @return {Mixed}
          * @param namespace
          * @return
          */
        _resolveFake(namespace : string): any;

        /**
          * Resolves binding from the bindings map and returns the
          * evaluated value after calling the binding closure.
          *
          * It is important to call _isBinding before calling this
          * method to avoid exceptions being thrown.
          *
          * @method _resolveBinding
          * @private
          *
          * @param {String} namespace
          * @return {Mixed}
          * @param namespace
          * @return
          */
        _resolveBinding(namespace : string): any;

        /**
          * Returns path of an autoloaded namespace
          *
          * @method _getAutoloadedPath
          *
          * @param  {String}           namespace
          *
          * @return {String}
          *
          * @private
          * @param namespace
          * @return
          */
        _getAutoloadedPath(namespace : string): string;

        /**
          * Requires a file by resolving the autoloaded namespace. It
          * is important to call _isAutoloadedPath before calling
          * this method, to avoid exceptions been thrown.
          *
          * @method _resolveAutoloadedPath
          * @private
          *
          * @param  {String} namespace
          * @return {Mixed}
          * @param namespace
          * @return
          */
        _resolveAutoloadedPath(namespace : string): any;

        /**
          * Returns instance of an object if it is a valid
          * ES6 class. Also injects the dependencies
          * defined under static inject method.
          *
          * If `Item` is not a class, it will return the
          * input back as output.
          *
          * @method _makeInstanceOf
          * @private
          *
          * @param  {Mixed} Item
          * @return {Mixed}
          *
          * @example
          * ```
          * class Foo {
          *   static get inject () {
          *     return ['App/Bar']
          *   }
          *
          *   constructor (Bar) {
          *     this.Bar = Bar
          *   }
          * }
          *
          * Ioc._makeInstanceOf(Foo)
          * ```
          * @param Item
          * @return
          */
        _makeInstanceOf(Item : string): string;

        /**
          * Requires a file just like node.js native require.
          *
          * @private
          * @method _require
          *
          * @param {String} namespace
          * @return {Mixed}
          *
          * @throws Error when unable to load the module
          * @param namespace
          * @return
          */
        _require(namespace : string): any;

        /**
          * Returns a cloned copy of registered bindings.
          *
          * @method getBindings
          *
          * @return {Object}
          * @return
          */
        getBindings(): Object;

        /**
          * Returns a cloned copy of registered aliases.
          *
          * @method getBindings
          *
          * @return {Object}
          * @return
          */
        getAliases(): Object;

        /**
          * Returns a cloned copy of registered autoloaded
          * directories and their namespaces.
          *
          * @method getAutoloads
          *
          * @return {Object}
          * @return
          */
        getAutoloads(): Object;

        /**
          * Returns a cloned copy of managers.
          *
          * @method getManagers
          *
          * @return {Object}
          * @return
          */
        getManagers(): any;

        /**
          * Returns a map of fakes
          *
          * @method getFakes
          *
          * @return {Map}
          * @return
          */
        getFakes(): Object;

        /**
          * Registers an alias for a namespace. It is okay
          * if that namespace does not exists when alias
          * is defined.
          *
          * @method alias
          *
          * @param  {String} namespace
          * @param  {String} alias
          *
          * @example
          * ```
          * Ioc.alias('Adonis/Src/View', 'View')
          * ```
          * @param namespace
          * @param alias
          */
        alias(namespace : string, alias : string): void;

        /**
          * Autoloads a given directory within the given namespace.
          * Value of `pathTo` must be an absolute path, Also this
          * method does not check if the path exists or not.
          *
          * @method autoload
          *
          * @param  {String} pathTo
          * @param  {String} namespace
          *
          * @example
          * ```
          * Ioc.autoload(path.join(__dirname, './app'), 'App')
          * ```
          * @param pathTo
          * @param namespace
          */
        autoload(pathTo : string, namespace : string): void;

        /**
          * Binds a namespace to the Ioc container as a binding. Given
          * closure is a factory method, called everytime the binding
          * is resolved and return value of closure will be returned
          * back.
          *
          * @method bind
          *
          * @param {String} namespace
          * @param {Function} closure
          * @throws InvalidArgumentException if closure is not a function
          *
          * @example
          * ```
          * Ioc.bind('App/Foo', (app) => {
          *   const Config = app.use('Adonis/Src/Config')
          *
          *   class Foo {
          *     constructor (Config) {
          *     }
          *   }
          *
          *   return new Foo(Config)
          * })
          * ```
          * @param namespace
          * @param closure
          */
        bind(namespace : string, closure : IocHandler): void;

        /**
          * Similar to bind except it will bind the namespace as
          * a singleton and will call the closure only once.
          *
          * @method singleton
          *
          * @param {String} namespace
          * @param {Function} closure
          * @throws InvalidArgumentException if closure is not a function
          *
          * @example
          * ```
          * Ioc.singleton('App/Foo', (app) => {
          *   const Config = app.use('Adonis/Src/Config')
          *
          *   class Foo {
          *     constructor (Config) {
          *     }
          *   }
          *
          *   return new Foo(Config)
          * })
          * ```
          * @param namespace
          * @param closure
          */
        singleton(namespace : string, closure : IocHandler): void;

        /**
          * Registers a manager for a binding. Managers are registered
          * to tell Ioc container that binding can be extended by the
          * outside world using `Ioc.extend` method.
          *
          * It is okay to register the manager before registering the
          * actual binding.
          *
          * @method manager
          *
          * @param  {String} namespace
          * @param  {Mixed} bindingInterface
          * @throws {InvalidArgumentException} If bindingInterface does not have extend method.
          *
          * @example
          * ```
          * class Foo {
          *   static extend (driver, implmentation) {
          *     this.drivers[driver] = implementation
          *   }
          * }
          *
          * // Inside provider
          * this.manager('App/Foo', Foo)
          * ```
          *
          * @example
          * ```
          * Ioc.extend('App/Foo', 'my-driver', function (app) {
          *   const Config = app.use('Adonis/Src/Config')
          *   return new MyDriverClass(Config)
          * })
          * ```
          * @param namespace
          * @param bindingInterface
          */
        manager(namespace : string, bindingInterface : any): void;

        /**
          * Extends a binding by the calling the extend method
          * on the registered manager.
          *
          * @method extend
          *
          * @param  {String}    namespace
          * @param  {String}    key
          * @param  {Function}  closure
          * @param  {...Spread} [options]
          *
          * @throws {InvalidArgumentException} If binding is not supposed to be extended
          * @throws {InvalidArgumentException} If closure is not a function
          *
          * @example
          * ```
          * Ioc.extend('Adonis/Src/Session', 'mongo', () => {
          *   return new MongoDriver()
          * })
          * ```
          * @param ...args
          */
        extend(...args : Array<any>): void;

        /**
          * Executes all extend calls in sequence. Successfully
          * executed extend calls will be removed from the
          * array, so that they are not executed again.
          *
          * @method executeExtendCalls
          *
          * @return {void}
          * @return
          */
        executeExtendCalls(): void;

        /**
          * Registers a fake for a namespace, quite helpful
          * when writing tests.
          *
          * @method fake
          *
          * @param  {String} namespace
          * @param  {Function} closure
          *
          * @throws {InvalidArgumentException} If closure is not a function
          *
          * @example
          * ```
          * Ioc.fake('Adonis/Src/Lucid', function () {
          *   return FakeModel
          * })
          *
          * // Restore after testing
          * Ioc.restore('Adonis/Src/Lucid')
          * ```
          * @param namespace
          * @param closure
          */
        fake(namespace : string, closure : Function): void;

        /**
          * Registers a single fake for a namespace, quite helpful
          * when writing tests.
          *
          * @method singletonFake
          *
          * @param  {String} namespace
          * @param  {Function} closure
          *
          * @throws {InvalidArgumentException} If closure is not a function
          *
          * @example
          * ```
          * Ioc.singletonFake('Adonis/Src/Lucid', function () {
          *   return new FakeModel()
          * })
          *
          * // Restore after testing
          * Ioc.restore('Adonis/Src/Lucid')
          * ```
          * @param namespace
          * @param closure
          */
        singletonFake(namespace : string, closure : Function): void;

        /**
          * Restores fake(s).
          *
          * @method restore
          *
          * @param  {...Spread|Array} namespaces
          *
          * @example
          * ```
          * Ioc.restore('Adonis/Src/Lucid')
          * Ioc.restore('Adonis/Src/Lucid', 'Adonis/Src/Config')
          * Ioc.restore() // restore all
          * ```
          * @param ...namespaces
          */
        restore(...namespaces : Array<any>): void;

        /**
          * Attempts to resolve a namespace in following order.
          *
          * 1. Look for a registered fake.
          * 2. Look for a registered binding.
          * 3. Look for an alias, if found: Repeat step 1 with alias namespace.
          * 4. Look for an autoload module path.
          * 5. Fallback to native require method.
          *
          * @method use
          *
          * @param {String} namespace
          * @return {Mixed} resolved value
          *
          * @example
          * ```
          *  Ioc.use('View') // via alias
          *  Ioc.use('Adonis/Src/View') // via complete namespace
          *  Ioc.use('App/Http/Controllers/UsersController') // autoloaded namespace
          *  Ioc.use('lodash') // node module
          * ```
          * @param namespace
          * @return
          */
        use(namespace : string): any;

        /**
          * Works as same as the `use` method, but instead returns
          * an instance of the class when resolved value is a
          * ES6 class and not a registered binding. Bindings
          * registered via `Ioc.bind` are themselves
          * supposed to return the final value.
          *
          * Also you can pass a class object by reference to return
          * a automatically resolved instance.
          *
          * @method make
          *
          * @param  {String} namespace
          * @return {Mixed}
          *
          * @example
          * ```
          * class Foo {
          *   static get inject () {
          *     return ['App/Bar']
          *   }
          *
          *   constructor (bar) {
          *     this.bar = bar
          *   }
          * }
          *
          * const fooInstance = Ioc.make(Foo)
          * ```
          * @param namespace
          * @return
          */
        make(namespace : string): any;

        /**
          * Returns absolute path to a namespace
          *
          * @method getPath
          *
          * @param  {String} namespace
          *
          * @return {String}
          *
          * @throws {Exception} If namespace is not part of autoloaded directories.
          * @param namespace
          * @return
          */
        getPath(namespace : string): string;

        /**
          * Same as `make` but instead returns the instance of the object
          * with the check that a method exists on the resolved object.
          * If that method does not exists it will throw an exception.
          *
          * It is helpful for scanerios like Route controller binding.
          *
          * @method makeFunc
          *
          * @param  {String} pattern
          * @return {Object}
          *
          * @throws {InvalidArgumentException} If pattern is not a string with dot notation.
          * @throws {RuntimeException} If method on the given namespace is missing.
          *
          * @example
          * ```
          * Ioc.makeFunc('App/Http/Controllers/UsersController.index')
          * // returns
          * { instance: UsersControllerInstance, method: index }
          * // usage
          * instance[method].apply(instance, [...args])
          * ```
          * @param pattern
          * @return
          */
        makeFunc(pattern : string): Object;
    }

    /**
      * Service provider is the base class to be extended by all
      * the providers. Each provider can have register and boot
      * methods which are called by the Registrar class as
      * part of lifecycle hooks.
      *
      * @class ServiceProvider
      */
    interface ServiceProvider {
        /**
          *
          * @param Ioc
          * @return
          */
        new (Ioc : Ioc): ServiceProvider;

        /**
          * Reference to the Ioc container
          * @attribute app
          */
        app: Ioc;
    }

    /**
      * Registrar class is used to register and boot providers. This
      * should be done once and at the time of booting the app.
      *
      * @class Registrar
      */
    interface Registrar {
        /**
          * @param Ioc
          */
        new (Ioc : Ioc): Registrar;

        /**
          * Listen for registrar specific events
          *
          * @method on
          *
          * @param {string} name
          * @param {function} callback
          * @param name
          * @param callback
          */
        on(name : string, callback : Function): void;

        /**
          * Listen for registrar specific events
          * just for one time
          *
          * @method once
          *
          * @param {string} name
          * @param {function} callback
          * @param name
          * @param callback
          */
        once(name : string, callback : Function): void;

        /**
          * Remove a listener
          *
          * @method removeListener
          *
          * @param {string} name
          * @param {function} callback
          * @param name
          * @param callback
          */
        removeListener(name : string, callback : Function): void;

        /**
          * Event fires when all providers have been
          * registered
          *
          * @event providers:registered
          */
        PROVIDERS_REGISTERED : string;

        /**
          * Event fires when all providers have been
          * booted.
          *
          * @event providers:booted
          */
        PROVIDERS_BOOTED : string;

        /**
          * Loop over providers array and returns an instance
          * of each provider class. It will also require
          * the files in the process.
          *
          * @private
          *
          * @method _getProvidersInstance
          *
          * @param {Array} arrayOfProviders
          *
          * @return {Array}
          * @param arrayOfProviders
          */
        _getProvidersInstance(arrayOfProviders : Array<Object>): Array<Object>;

                    /**
          * Registers the providers by calling register method on
          * them. Providers that does not contain the register
          * method will be skipped.
          *
          * @private
          *
          * @method _registerProviders
          *
          * @param {Array} providers
          * @param providers
          */
        _registerProviders(providers : Array<Object>): void;

        /**
          * Boots the providers by calling boot method on them.
          * Providers that does have the boot method will be
          * skipped.
          *
          * @private
          *
          * @method _bootProviders
          *
          * @param {Array} providers
          *
          * @return {Promise}
          * @param providers
          * @return
          */
        _bootProviders(providers : Array<Object>): Promise<Object>;

        /**
          * Setting providers that will later be registered
          * and booted.
          *
          * @method providers
          *
          * @param  {Array} arrayOfProviders
          *
          * @chainable
          * @param arrayOfProviders
          * @return
          */
        providers(arrayOfProviders : Array<Object>): this;

        /**
          * Register providers earlier defined via the
          * `providers` method.
          *
          * @method register
          *
          * @return {void}
          * @return
          */
        register(): void;

        /**
          * Boot providers earlier defined via the
          * `providers` method.
          *
          * @method boot
          *
          * @return {void}
          * @return
          */
        boot(): Promise<void>;

        /**
          * Register and boot providers together
          *
          * @method registerAndBoot
          *
          * @return {void}
          * @return
          */
        registerAndBoot(): Promise<void>;

        _providers : Array<any>;
    }

    /**
      * This class will resolve a namespace or a pattern
      * from the IoC container. Think of it as a friend
      * to the IoC container for resolving namespaces
      * without worrying where they live.
      *
      * @class Resolver
      * @constructor
      */
    interface Resolver {
        /**
          * @param Ioc
          * @param directories
          * @param appNamespace
          * @param forDirectory
          */
        new (Ioc : Ioc, directories : Array<string>, appNamespace : string, forDirectory? : string): Resolver;

        /**
          * Translates a binding into a valid namespace, ready to
          * be resolved via Ioc container
          *
          * @method translate
          *
          * @param  {String}  binding
          *
          * @return {String}
          *
          * @example
          * ```js
          * resolver.for('httpControllers').translate('HomeController')
          * // returns - App/Controllers/HomeController
          * ```
          * @param binding
          * @return
          */
        translate(binding : string): string;

        /**
          * Returns path for a given namespace. This method only works
          * for autoloaded files and not providers.
          *
          * Also existence of a the file on the given path is not guaranteed.
          *
          * @method getPath
          *
          * @param  {String} binding
          *
          * @return {String}
          * @param binding
          * @return
          */
        getPath(binding : string): string;

        /**
          * Resolves the binding from the IoC container. This
          * method is a combination of `translate` and
          * `Ioc.make` function.
          *
          * @method resolve
          *
          * @param  {String} binding
          *
          * @return {Mixed}
          * @param binding
          * @return
          */
        resolve(binding : string): any;

        /**
          * Resolves a function by translating the binding and
          * then validating the existence of the method on
          * the binding object. Also if the `binding` param
          * is a function, it will be recognized and
          * returned.
          *
          * @method resolveFunc
          *
          * @param  {String}    binding
          *
          * @return {Object}
          * @param binding
          * @return
          */
        resolveFunc(binding : string): Object;
    }

    /**
      * ResolverManager is the public interface to
      * register directories and resolve them
      * later.
      *
      * The registering process needs to be only done once by
      * the application not by providers. Providers should
      * assume that the registering process is done in
      * advance and only call functions to resolve
      * bindings.
      *
      * @class ResolveManager
      * @static
      */
    interface ResolverManager {
        /**
          * @param Ioc
          */
        new (Ioc : Ioc): ResolverManager;

        /**
          * Returns instance of resolver.
          *
          * @method _getInstance
          *
          * @param  {String}     [forDir = null]
          *
          * @return {Resolver}
          *
          * @private
          * @param forDir?
          * @return
          */
        _getInstance(forDir? : string): Resolver;

        /**
          * Register directories to be used for making
          * namespaces
          *
          * @method directories
          *
          * @param  {Object}    dirs
          *
          * @chainable
          * @param dirs
          * @return
          */
        directories(dirs : Object): this;

        /**
          * Set app namespace to be used for making
          * complete namespaces from relative
          * namespaces.
          *
          * @method appNamespace
          *
          * @param  {String}     namespace
          *
          * @chainable
          * @param namespace
          * @return
          */
        appNamespace(namespace : string): this;

        /**
          * Returns the resolver instance specified
          * to translate namespace for a given
          * directory only.
          *
          * @method forDir
          *
          * @param  {String} forDir
          *
          * @return {Resolver}
          * @param forDir
          * @return
          */
        forDir(forDir : string): Resolver;

        /**
          * Translate binding using resolver translate
          * method.
          * @param ...params
          */
        translate(...params : Array<any>): any;

        /**
          * Resolve binding using resolver resolve
          * method.
          * @param ...params
          */
        resolve(...params : Array<any>): any;

        /**
          * Resolve binding using resolver resolveFunc
          * method.
          * @param ...params
          */
        resolveFunc(...params : Array<any>): any;
    }
}

declare namespace Lucid {
    /**
      * This class is used internally by @ref('Model') to add
      * hooks functionality.
      *
      * Hooks are executed in sequence for a given event.
      *
      * @class Hooks
      * @constructor
      */
    interface Hooks {
        /**
          * Adds a new handler for an event. Make sure to give
          * handler a unique name if planning to remove it
          * later at runtime
          *
          * @method addHandler
          *
          * @param  {String}   event
          * @param  {Function|String}   handler
          * @param  {String}   [name]
          *
          * @return {void}
          *
          * @example
          * ```
          * this.addHandler('create', async function () {
          * })
          * ```
          * @param event
          * @param handler
          * @param name?
          * @return
          */
        addHandler(event : string, handler : Function | string, name? : string): void;

        /**
          * Removes handler using it's name. This methods returns
          * void when successfully executed, otherwise an
          * exception is thrown.
          *
          * @method removeHandler
          *
          * @param  {String}      event
          * @param  {String}      name
          *
          * @return {void}
          *
          * @example
          * ```js
          * this.removeHandler('create', 'updatePassword')
          * ```
          *
          * @throws {InvalidArgumentException} If `name` is missing
          * @param event
          * @param name
          * @return
          */
        removeHandler(event : string, name : string): void;

        /**
          * Removes all handlers for a given event. This method
          * returns void when successfully executed, otherwise
          * an exception is thrown.
          *
          * @method removeAllHandlers
          *
          * @param  {String}          event
          *
          * @return {void}
          *
          * @example
          * ```
          * this.removeAllHandlers('create')
          * ```
          * @param event
          * @return
          */
        removeAllHandlers(event : string): void;

        /**
          * Execute hooks in sequence. If this method doesn't
          * throws an exception, means everything went fine.
          *
          * @method exec
          * @async
          *
          * @param  {String} event
          * @param  {Spread} ...args
          *
          * @return {void}
          * @param event
          * @param ...args
          * @return
          */
        exec(event: string, ...args: any[]): Promise<void>;
    }

    /**
      * The vanilla serailizer is the bare bones serializer
      * shipped with Lucid and is set as the default
      * serializer.
      *
      * @class VanillaSerializer
      * @constructor
      */
    interface VanillaSerializer {

        /**
          * The serializer rows. All rows should be instance
          * of Lucid model
          *
          * @attribute rows
          *
          * @type {Array}
          */
        rows: Array<Object>

        /**
          * The pagination meta data
          *
          * @attribute pages
          *
          * @type {Object}
          */
        pages: Object

        /**
          * A boolean indicating whether return output of
          * toJSON should be an array of an object.
          *
          * @attribute isOne
          *
          * @type {Boolean}
          */
        isOne: boolean

        /**
          *
          * @param rows
          * @param pages
          * @param isOne
          */
        new(rows: Array<Object>, pages?: null, isOne?: false): VanillaSerializer;

        /**
          * Add row to the list of rows. Make sure the row
          * is an instance of the same model as the other
          * model instances.
          *
          * @method addRow
          *
          * @param  {Model} row
          * @param row
          */
        addRow(row : Model): void;

        /**
          * Get first model instance
          *
          * @method first
          *
          * @return {Model}
          * @return
          */
        first(): Model;

        /**
          * Returns the row for the given index
          *
          * @method nth
          *
          * @param  {Number} index
          *
          * @return {Model|Null}
          * @param index
          * @return
          */
        nth(index : number): Model | null;

        /**
          * Get last model instance
          *
          * @method last
          *
          * @return {Model}
          * @return
          */
        last(): Model;

        /**
          * Returns the size of rows
          *
          * @method size
          *
          * @return {Number}
          * @return
          */
        size(): number;

        /**
          * Convert all rows/model instances to their JSON
          * representation
          *
          * @method toJSON
          *
          * @return {Array|Object}
          * @return
          */
        toJSON(): Array<Object> | Object;
    }

    type Serializer = VanillaSerializer;

    /**
      * The base model to share attributes with Lucid
      * model and the Pivot model.
      *
      * @class BaseModel
      * @constructor
      */
    class BaseModel {
        /**
          * Model hooks for different lifecycle
          * events
          *
          * @type {Object}
          */
        $hooks: Object;

        /**
          * List of global query listeners for the model.
          *
          * @type {Array}
          */
        $queryListeners: Function;

        /**
          * List of global query scopes. Chained before executing
          * query builder queries.
          */
        $globalScopes: Object;

        /**
          * We use the default query builder class to run queries, but as soon
          * as someone wants to add methods to the query builder via traits,
          * we need an isolated copy of query builder class just for that
          * model, so that the methods added via traits are not impacting
          * other models.
          */
        QueryBuilder: QueryBuilder;

        /**
          * Tells whether model instance is new or
          * persisted to database.
          *
          * @attribute isNew
          *
          * @return {Boolean}
          */
        isNew : boolean;

        /**
          * Returns a boolean indicating whether model
          * has been deleted or not
          *
          * @method isDeleted
          *
          * @return {Boolean}
          */
        isDeleted : boolean;

        /**
          * Set attributes on model instance in bulk.
          *
          * NOTE: Calling this method will remove the existing attributes.
          *
          * @method fill
          *
          * @param  {Object} attributes
          *
          * @return {void}
          * @param attributes
          * @return
          */
        fill(attributes : Object): void;

        /**
          * Merge attributes into on a model instance without
          * overriding existing attributes and their values
          *
          * @method fill
          *
          * @param  {Object} attributes
          *
          * @return {void}
          * @param attributes
          * @return
          */
        merge(attributes : Object): void;

        /**
          * Freezes the model instance for modifications
          *
          * @method freeze
          *
          * @return {void}
          * @return
          */
        freeze(): void;

        /**
          * Unfreezes the model allowing further modifications
          *
          * @method unfreeze
          *
          * @return {void}
          * @return
          */
        unfreeze(): void;

        /**
          * Converts model instance toJSON using the serailizer
          * toJSON method
          *
          * @method toJSON
          *
          * @return {Object}
          * @return
          */
        toJSON(): Object;

        /**
          * The attributes to be considered as dates. By default
          * @ref('Model.createdAtColumn') and @ref('Model.updatedAtColumn')
          * are considered as dates.
          *
          * @attribute dates
          *
          * @return {Array}
          *
          * @static
      */
        dates : Array<any>;

        /**
          * The attribute name for created at timestamp.
          *
          * @attribute createdAtColumn
          *
          * @return {String}
          *
          * @static
          */
        createdAtColumn : string | null;

        /**
          * The attribute name for updated at timestamp.
          *
          * @attribute updatedAtColumn
          *
          * @return {String}
          *
          * @static
          */
        updatedAtColumn : string | null;

        /**
          * The database connection to be used for
          * the model. Returning blank string will
          * use the `default` connection.
          *
          * @attribute connection
          *
          * @return {String}
          *
          * @static
          */
        connection : string;

        /**
          * The serializer to be used for serializing
          * data. The return value must always be a
          * ES6 class.
          *
          * By default Lucid uses @ref('VanillaSerializer')
          *
          * @attribute Serializer
          *
          * @return {Class}
          */
        Serializer : Serializer;

        /**
         * visible or hidden (one at a time) on your model
         */
        visible : Array<string>;
        hidden  : Array<string>;

        /**
          * This method is executed for all the date fields
          * with the field name and the value. The return
          * value gets saved to the database.
          *
          * Also if you have defined a setter for a date field
          * this method will not be executed for that field.
          *
          * @method formatDates
          *
          * @param  {String}    key
          * @param  {String|Date}    value
          *
          * @return {String}
          */
        formatDates(key : string, value : string | Date): string;

        /**
          * Resolves the serializer for the current model.
          *
          * If serializer is a string, then it is resolved using
          * the Ioc container, otherwise it is assumed that
          * a `class` is returned.
          *
          * @method resolveSerializer
          *
          * @returns {Class}
          */
        resolveSerializer(): Serializer;

        /**
          * This method is executed when toJSON is called on a
          * model or collection of models. The value received
          * will always be an instance of momentjs and return
          * value is used.
          *
          * NOTE: This method will not be executed when you define
          * a getter for a given field.
          *
          * format 'YYYY-MM-DD HH:mm:ss'
          *
          * @method castDates
          *
          * @param  {String}  key
          * @param  {Moment}  value
          *
          * @return {String}
          *
          * @static
          */
        castDates(key : string, value : any): string;

        /**
          * Method to be called only once to boot
          * the model.
          *
          * NOTE: This is called automatically by the IoC
          * container hooks when you make use of `use()`
          * method.
          *
          * @method boot
          *
          * @return {void}
          *
          * @static
          */
        boot(): void;

        /**
          * Hydrates model static properties by re-setting
          * them to their original value.
          *
          * @method hydrate
          *
          * @return {void}
          *
          * @static
          */
        hydrate(): void;

        //_instantiate
        $attributes          : Object
        $persisted           : Object
        $originalAttributes  : Object
        $relations           : Object
        $sideLoaded          : Object
        $parent              : Object
        $frozen              : boolean
        $visible             : Array<string>
        $hidden              : Array<string>
    }

    /**
      * Aggregrates to be added to the query
      * builder
      * method redirect Database.Builder
      */
    type aggregates =
        'sum'               |
        'sumDistinct'       |
        'avg'               |
        'avgDistinct'       |
        'min'               |
        'max'               |
        'count'             |
        'countDistinct'     |
        'getSum'            |
        'getSumDistinct'    |
        'getAvg'            |
        'getAvgDistinct'    |
        'getMin'            |
        'getMax'            |
        'getCount'          |
        'getCountDistinct'  |
        'pluck'             |
        'toSQL'             |
        'toString';

    /**
      * Query builder for the lucid models extended
      * by the @ref('Database') class.
      *
      * @class QueryBuilder
      * @constructor
      */
    interface QueryBuilder extends Pick<Database.Builder, aggregates> {
        /**
          *
          * @param Model
          * @param connection
          * @return
          */
        new (Model : Model, connection : Database): QueryBuilder;

        /**
          * Access of query formatter
          *
          * @method formatter
          *
          * @return {Object}
          * @return
          */
        formatter(): Object;

        /**
          * Instruct query builder to ignore all global
          * scopes.
          *
          * Passing `*` will ignore all scopes or you can
          * pass an array of scope names.
          *
          * @param {Array} [scopes = ['*']]
          *
          * @method ignoreScopes
          *
          * @chainable
          * @param scopes?
          * @return
          */
        ignoreScopes(scopes? : Array<string>): QueryBuilder;

        /**
          * Execute the query builder chain by applying global scopes
          *
          * @method fetch
          * @async
          *
          * @return {Serializer} Instance of model serializer
          * @return
          */
        fetch(): Promise<Serializer>;

        /**
          * Returns the first row from the database.
          *
          * @method first
          * @async
          *
          * @return {Model|Null}
          * @return
          */
        first(): Promise<Model>;

        /**
          * Returns the latest row from the database.
          *
          * @method last
          * @async
          *
          * @param  {String} field
          *
          * @return {Model|Null}
          * @param field
          * @return
          */
        last(field : string): Promise<Model>;

        /**
          * Throws an exception when unable to find the first
          * row for the built query
          *
          * @method firstOrFail
          * @async
          *
          * @return {Model}
          *
          * @throws {ModelNotFoundException} If unable to find first row
          * @return
          */
        firstOrFail(): Promise<Model>;

        /**
          * Paginate records, same as fetch but returns a
          * collection with pagination info
          *
          * @method paginate
          * @async
          *
          * @param  {Number} [page = 1]
          * @param  {Number} [limit = 20]
          *
          * @return {Serializer}
          * @param page?
          * @param limit?
          * @return
          */
        paginate(page? : 1, limit? : 20): Promise<Serializer>;

        /**
          * Bulk update data from query builder. This method will also
          * format all dates and set `updated_at` column
          *
          * @method update
          * @async
          *
          * @param  {Object|Model} valuesOrModelInstance
          *
          * @return {Promise}
          * @param valuesOrModelInstance
          * @return
          */
        update(valuesOrModelInstance : Object | Model): Database.NumberResult;

        /**
          * Deletes the rows from the database.
          *
          * @method delete
          * @async
          *
          * @return {Promise}
          * @return
          */
        delete(): Database.NumberResult;

        /**
          * Returns an array of primaryKeys
          *
          * @method ids
          * @async
          *
          * @return {Array}
          * @return
          */
        ids<T>(): Promise<T[]>;

        /**
          * Returns a pair of lhs and rhs. This method will not
          * eagerload relationships.
          *
          * @method pair
          * @async
          *
          * @param  {String} lhs
          * @param  {String} rhs
          *
          * @return {Object}
          * @param lhs
          * @param rhs
          * @return
          */
        pair(lhs : string, rhs : string): Promise<Object>;

        /**
          * Same as `pick` but inverse
          *
          * @method pickInverse
          * @async
          *
          * @param  {Number}    [limit = 1]
          *
          * @return {Collection}
          * @param limit?
          * @return
          */
        pickInverse(limit? : 1): Promise<Serializer>;

        /**
          * Pick x number of rows from the database
          *
          * @method pick
          * @async
          *
          * @param  {Number} [limit = 1]
          *
          * @return {Collection}
          * @param limit?
          * @return
          */
        pick(limit? : 1): Promise<Serializer>;

        /**
          * Eagerload relationships when fetching the parent
          * record
          *
          * @method with
          *
          * @param  {String}   relation
          * @param  {Function} [callback]
          *
          * @chainable
          * @param relation
          * @param callback?
          * @return
          */
        with(relation : string, callback? : Function): QueryBuilder;

        /**
          * Adds a check on there parent model to fetch rows
          * only where related rows exists or as per the
          * defined number
          *
          * @method has
          *
          * @param  {String}  relation
          * @param  {String}  expression
          * @param  {Mixed}   value
          *
          * @chainable
          * @param relation
          * @param expression
          * @param value
          * @return
          */
        has(relation : string, expression : string, value : any): QueryBuilder;

        /**
          * Similar to `has` but instead adds or clause
          *
          * @method orHas
          *
          * @param  {String} relation
          * @param  {String} expression
          * @param  {Mixed} value
          *
          * @chainable
          * @param relation
          * @param expression
          * @param value
          * @return
          */
        orHas(relation : string, expression : string, value : any): QueryBuilder;

        /**
          * Adds a check on the parent model to fetch rows where
          * related rows doesn't exists
          *
          * @method doesntHave
          *
          * @param  {String}   relation
          *
          * @chainable
          * @param relation
          * @return
          */
        doesntHave(relation : string): QueryBuilder;

        /**
          * Same as `doesntHave` but adds a `or` clause.
          *
          * @method orDoesntHave
          *
          * @param  {String}   relation
          *
          * @chainable
          * @param relation
          * @return
          */
        orDoesntHave(relation : string): QueryBuilder;

        /**
          * Adds a query constraint just like has but gives you
          * a chance to pass a callback to add more constraints
          *
          * @method whereHas
          *
          * @param  {String}   relation
          * @param  {Function} callback
          * @param  {String}   expression
          * @param  {String}   value
          *
          * @chainable
          * @param relation
          * @param callback
          * @param expression
          * @param value
          * @return
          */
        whereHas(relation : string, callback : Function, expression : string, value : string): QueryBuilder;

        /**
          * Same as `whereHas` but with `or` clause
          *
          * @method orWhereHas
          *
          * @param  {String}   relation
          * @param  {Function} callback
          * @param  {String}   expression
          * @param  {Mixed}   value
          *
          * @chainable
          * @param relation
          * @param callback
          * @param expression
          * @param value
          * @return
          */
        orWhereHas(relation : string, callback : Function, expression : string, value : any): QueryBuilder;

        /**
          * Opposite of `whereHas`
          *
          * @method whereDoesntHave
          *
          * @param  {String}        relation
          * @param  {Function}      callback
          *
          * @chainable
          * @param relation
          * @param callback
          * @return
          */
        whereDoesntHave(relation : string, callback : Function): QueryBuilder;

        /**
          * Same as `whereDoesntHave` but with `or` clause
          *
          * @method orWhereDoesntHave
          *
          * @param  {String}          relation
          * @param  {Function}        callback
          *
          * @chainable
          * @param relation
          * @param callback
          * @return
          */
        orWhereDoesntHave(relation : string, callback : Function): QueryBuilder;

        /**
          * Returns count of a relationship
          *
          * @method withCount
          *
          * @param  {String}   relation
          * @param  {Function} callback
          *
          * @chainable
          *
          * @example
          * ```js
          * query().withCount('profile')
          * query().withCount('profile as userProfile')
          * ```
          * @param relation
          * @param callback
          */
        withCount(relation : string, callback : Function): QueryBuilder;

        /**
          * Define fields to be visible for a single
          * query.
          *
          * Computed when `toJSON` is called
          *
          * @method setVisible
          *
          * @param  {Array}   fields
          *
          * @chainable
          * @param fields
          * @return
          */
        setVisible(fields : Array<string>): QueryBuilder;

        /**
          * Define fields to be hidden for a single
          * query.
          *
          * Computed when `toJSON` is called
          *
          * @method setHidden
          *
          * @param  {Array}   fields
          *
          * @chainable
          * @param fields
          * @return
          */
        setHidden(fields : Array<string>): QueryBuilder;

        /**
          * Relations to be eagerloaded
          *
          * @type {Object}
          */
        _eagerLoads : Object

        /**
          * The sideloaded data for this query
          *
          * @type {Array}
          */
        _sideLoaded : Array<string>;

        /**
          * Query level visible fields
          *
          * @type {Array}
          */
        _visibleFields : Array<string>;

        /**
          * Query level hidden fields
          *
          * @type {Array}
          */
        _hiddenFields : Array<string>;

        /**
          * Storing the counter for how many withCount queries
          * have been made by this query builder chain.
          *
          * This is required so that self joins have generate
          * unique table names
          *
          * @type {Number}
          */
        _withCountCounter : number;

        Model: Model;

        /**
          * Reference to database provider
          */
        db: Database;

        /**
          * Reference to query builder with pre selected table
          */
        query: Database.Builder;
    }

    namespace Relations {
        /**
          * methodList to be added to the query
          * method redirect Database.Builder
          */
        type methodsList =
            'increment'        |
            'decrement'        |
            'sum'              |
            'sumDistinct'      |
            'avg'              |
            'avgDistinct'      |
            'min'              |
            'max'              |
            'count'            |
            'countDistinct'    |
            'getSum'           |
            'getSumDistinct'   |
            'getAvg'           |
            'getAvgDistinct'   |
            'getMin'           |
            'getMax'           |
            'getCount'         |
            'getCountDistinct' |
            'truncate'         |
            'ids'              |
            'paginate'         |
            'pair'             |
            //'pluckFirst'       |
            //'pluckId'          |
            'pick'             |
            'pickInverse'      |
            'delete'           |
            'update'           |
            'first'            |
            'fetch'            |
            'toSQL'            |
            'toString';

        /**
          * Base relation is supposed to be extended by other
          * relations. It takes care of commonly required
          * stuff.
          *
          * @class BaseRelation
          * @constructor
          */
        interface BaseRelation extends QueryProxy {
            /**
              *
              * @param parentInstance
              * @param RelatedModel
              * @param primaryKey
              * @param foreignKey
              * @return
              */
            new(parentInstance: Lucid.Model, RelatedModel: Lucid.Model, primaryKey?: string, foreignKey?: string): BaseRelation;

            parentInstance : Lucid.Model
            RelatedModel   : Lucid.Model
            primaryKey     : string
            foreignKey     : string
            relatedQuery   : QueryProxy

            /**
              * Define a custom eagerload query.
              *
              * NOTE: Defining eagerload query leaves everything on you
              * to resolve the correct rows and they must be an array
              *
              * @method eagerLoadQuery
              *
              * @return {void}
              * @param fn
              * @return
              */
            eagerLoadQuery(fn: <T>(query: Object, fk: string, values: Array<T>) => void): void;

            /**
              * The primary table in relationship
              *
              * @attribute $primaryTable
              *
              * @return {String}
              */
            $primaryTable : string;

            /**
              * The foreign table in relationship
              *
              * @attribute $foreignTable
              *
              * @return {String}
              */
            $foreignTable : string;

            /**
              * Applies scopes on the related query. This is used when
              * the related query is used as subquery.
              *
              * @method applyRelatedScopes
              */
            applyRelatedScopes(): void;

            /**
              * Returns the eagerLoad query for the relationship
              *
              * @method eagerLoad
              * @async
              *
              * @param  {Array}          rows
              *
              * @return {Object}
              * @param rows
              * @return
              */
            eagerLoad(rows : Array<any>): Promise<Object>;

            /**
              * Load a single relationship from parent to child
              * model, but only for one row.
              *
              * @method load
              * @async
              *
              * @param  {String|Number}     value
              *
              * @return {Model}
              * @return
              */
            load(): Model|Object;

            /**
              * Columnize dot notated column name using the formatter
              *
              * @method columnize
              *
              * @param  {String}  column
              *
              * @return {String}
              * @param column
              * @return
              */
            columnize(column : string): string;
        }

        /**
          * The HasOne relationship defines a relation between
          * two models
          *
          * @class HasOne
          * @constructor
          */
        interface HasOne extends BaseRelation {
            /**
              * Returns an array of values to be used for running
              * whereIn query when eagerloading relationships.
              *
              * @method mapValues
              *
              * @param  {Array}  modelInstances - An array of model instances
              *
              * @return {Array}
              * @param modelInstances
              * @return
              */
            mapValues(modelInstances : Array<any>): Array<Object>;

            /**
              * Takes an array of related instances and returns an array
              * for each parent record.
              *
              * @method group
              *
              * @param  {Array} relatedInstances
              *
              * @return {Object} @multiple([key=String, values=Array, defaultValue=Null])
              * @param relatedInstances
              * @return
              */
            group(relatedInstances :  Array<any>): Object;

            /**
              * Fetch related rows for a relationship
              *
              * @method fetch
              *
              * @alias first
              *
              * @return {Model}
              * @return
              */
            fetch<T>(): Promise<T>;

            /**
              * Adds a where clause to limit the select search
              * to related rows only.
              *
              * @method relatedWhere
              *
              * @param  {Boolean}     count
              *
              * @return {Object}
              * @param count
              * @return
              */
            relatedWhere(count : boolean): Database.Builder;

            /**
              * Adds `on` clause to the innerjoin context. This
              * method is mainly used by HasManyThrough
              *
              * @method addWhereOn
              *
              * @param  {Object}   context
              * @param context
              */
            addWhereOn(context : any): Object;

            /**
              * Saves the related instance to the database. Foreign
              * key is set automatically.
              *
              * NOTE: This method will persist the parent model if
              * not persisted already.
              *
              * @method save
              *
              * @param  {Object}  relatedInstance
              * @param  {Object}  [trx]
              *
              * @return {Promise}
              * @param relatedInstance
              * @param trx?
              * @return
              */
            save(relatedInstance :Object, trx? : Database.Transaction): Promise<boolean>;

            /**
              * Creates the new related instance model and persist
              * it to database. Foreign key is set automatically.
              *
              * NOTE: This method will persist the parent model if
              * not persisted already.
              *
              * @method create
              * @param  {Object}  [trx]
              *
              * @param  {Object} payload
              *
              * @return {Promise}
              * @param payload
              * @param trx?
              * @return
              */
            create(payload : Object, trx? : Database.Transaction): Promise<Model>;

            /**
              * istanbul ignore next
              */
            createMany(): void;

            /**
              * istanbul ignore next
              */
            saveMany(): void;
        }

        /**
          * The BelongsTo relationship defines a relation between
          * two models
          *
          * @class BelongsTo
          * @constructor
          */
        interface BelongsTo extends BaseRelation{
            /**
              * Returns the first row for the related model
              *
              * @method first
              *
              * @return {Object|Null}
              * @return
              */
            first<T>(): Promise<T>;

            /**
              * Map values from model instances to an array. It is required
              * to make `whereIn` query when eagerloading results.
              *
              * @method mapValues
              *
              * @param  {Array}  modelInstances
              *
              * @return {Array}
              * @param modelInstances
              * @return
              */
            mapValues(modelInstances : Array<Object>): Array<Object>;

            /**
              * Groups related instances with their foriegn keys
              *
              * @method group
              *
              * @param  {Array} relatedInstances
              *
              * @return {Object} @multiple([key=String, values=Array, defaultValue=Null])
              * @param relatedInstances
              * @return
              */
            group(relatedInstances : Array<Object>): Object;

            /**
              * Overriding fetch to call first, since belongsTo
              * can never have many rows
              *
              * @method fetch
              * @async
              *
              * @return {Object}
              * @return
              */
            fetch<T>(): Promise<T>;

            /**
              * Adds a where clause to limit the select search
              * to related rows only.
              *
              * @method relatedWhere
              *
              * @param  {Boolean}     count
              * @param  {Integer}     counter
              *
              * @return {Object}
              * @param count
              * @param counter
              * @return
              */
            relatedWhere(count : boolean, counter : number): Database.Builder;

            /**
              * Adds `on` clause to the innerjoin context. This
              * method is mainly used by HasManyThrough
              *
              * @method addWhereOn
              *
              * @param  {Object}   context
              * @param context
              */
            addWhereOn(context : Object): void;

            /**
              * istanbul ignore next
              */
            create(): void;

            /**
              * istanbul ignore next
              */
            save(): void;

            /**
              * istanbul ignore next
              */
            createMany(): void;

            /**
              * istanbul ignore next
              */
            saveMany(): void;

            /**
              * Associate 2 models together, also this method will save
              * the related model if not already persisted
              *
              * @method associate
              * @async
              *
              * @param  {Object}  relatedInstance
              * @param  {Object}  [trx]
              *
              * @return {Promise}
              * @param relatedInstance
              * @param trx?
              * @return
              */
            associate(relatedInstance : Object, trx? : Database.Transaction): Promise<boolean>;
        }

        type pivotCallback = (Model:Model) => void;
        /**
          * BelongsToMany class builds relationship between
          * two models with the help of pivot table/model
          *
          * @class BelongsToMany
          * @constructor
          */
        interface BelongsToMany extends BaseRelation {
            /**
              *
              * @param parentInstance
              * @param relatedModel
              * @param primaryKey
              * @param foreignKey
              * @param relatedPrimaryKey
              * @param relatedForeignKey
              */
            new(parentInstance: Object, relatedModel: Object, primaryKey: string, foreignKey: string, relatedPrimaryKey: string, relatedForeignKey: string): BelongsToMany;

            relatedForeignKey: string
            relatedPrimaryKey: string
            relatedTableAlias: string

            /**
              * Returns the pivot table name. The pivot model is
              * given preference over the default table name.
              *
              * @attribute $pivotTable
              *
              * @return {String}
              */
            $pivotTable: string;

            /**
              * The pivot columns to be selected
              *
              * @attribute $pivotColumns
              *
              * @return {Array}
              */
            $pivotColumns : Array<string>;

            /**
              * The colums to be selected from the related
              * query
              *
              * @method select
              *
              * @param  {Array} columns
              *
              * @chainable
              * @param columns
              * @return
              */
            select(...columns : Array<string> ): this;

            /**
              * Define a fully qualified model to be used for
              * making pivot table queries and using defining
              * pivot table settings.
              *
              * @method pivotModel
              *
              * @param  {Model}   pivotModel
              *
              * @chainable
              * @param pivotModel
              * @return
              */
            pivotModel(pivotModel : Model): this;

            /**
              * Define the pivot table
              *
              * @method pivotTable
              *
              * @param  {String}   table
              *
              * @chainable
              * @param table
              * @return
              */
            pivotTable(table : string): this;

            /**
              * Make sure `created_at` and `updated_at` timestamps
              * are being used
              *
              * @method withTimestamps
              *
              * @chainable
              * @return
              */
            withTimestamps(): this;

            /**
              * Fields to be selected from pivot table
              *
              * @method withPivot
              *
              * @param  {Array}  fields
              *
              * @chainable
              * @param fields
              * @return
              */
            withPivot(fields : string | Array<string>): this;

            /**
              * Returns an array of values to be used for running
              * whereIn query when eagerloading relationships.
              *
              * @method mapValues
              *
              * @param  {Array}  modelInstances - An array of model instances
              *
              * @return {Array}
              * @param modelInstances
              * @return
              */
            mapValues(modelInstances : Object): Array<Object>;

            /**
              * Make a where clause on the pivot table
              *
              * @method whereInPivot
              *
              * @param  {String}     key
              * @param  {...Spread}  args
              *
              * @chainable
              * @param key
              * @param ...args
              * @return
              */
            whereInPivot(key : string, ...args : Array<any>): this;

            /**
              * Make a orWhere clause on the pivot table
              *
              * @method orWherePivot
              *
              * @param  {String}     key
              * @param  {...Spread}  args
              *
              * @chainable
              * @param key
              * @param ...args
              * @return
              */
            orWherePivot(key : string, ...args : Array<any>): this;

            /**
              * Make a andWhere clause on the pivot table
              *
              * @method andWherePivot
              *
              * @param  {String}     key
              * @param  {...Spread}  args
              *
              * @chainable
              * @param key
              * @param ...args
              * @return
              */
            andWherePivot(key : string, ...args : Array<any>): this;

            /**
              * Where clause on pivot table
              *
              * @method wherePivot
              *
              * @param  {String}    key
              * @param  {...Spread} args
              *
              * @chainable
              * @param key
              * @param ...args
              * @return
              */
            wherePivot(key : string, ...args : Array<any>): this;

            /**
              * Returns the eagerLoad query for the relationship
              *
              * @method eagerLoad
              * @async
              *
              * @param  {Array}          rows
              *
              * @return {Object}
              * @param rows
              * @return
              */
            eagerLoad(rows : Array<any>): Promise<Object>;

            /**
              * Method called when eagerloading for a single
              * instance
              *
              * @method load
              * @async
              *
              * @return {Promise}
              * @return
              */
            load(): Promise<Serializer>;

            /**
              * Fetch ids for the related model
              *
              * @method ids
              *
              * @return {Array}
              * @return
              */
            ids<T>(): Promise<T[]>;

            /**
              * Execute the query and setup pivot values
              * as a relation
              *
              * @method fetch
              * @async
              *
              * @return {Serializer}
              * @return
              */
            fetch(): Promise<Serializer>;

            /**
              * Groups related instances with their foriegn keys
              *
              * @method group
              *
              * @param  {Array} relatedInstances
              *
              * @return {Object} @multiple([key=String, values=Array, defaultValue=Null])
              * @param relatedInstances
              * @return
              */
            group(relatedInstances : Array<Object>): Object;

            /**
              * Returns the query for pivot table
              *
              * @method pivotQuery
              *
              * @param {Boolean} selectFields
              *
              * @return {Object}
              * @param selectFields
              * @return
              */
            pivotQuery(selectFields? : true): QueryBuilder;

            /**
              * Adds a where clause to limit the select search
              * to related rows only.
              *
              * @method relatedWhere
              *
              * @param  {Boolean}     count
              * @param  {Integer}     counter
              *
              * @return {Object}
              * @param count
              * @param counter
              * @return
              */
            relatedWhere(count : boolean, counter : number): Database.Builder;

            /**
              * Adds `on` clause to the innerjoin context. This
              * method is mainly used by HasManyThrough
              *
              * @method addWhereOn
              *
              * @param  {Object}   context
              * @param context
              */
            addWhereOn(context : Object): void;

            /**
              * Attach existing rows inside pivot table as a relationship
              *
              * @method attach
              *
              * @param  {Number|String|Array} references
              * @param  {Function} [pivotCallback]
              * @param  {trx} Transaction
              *
              * @return {Promise}
              * @param references
              * @param pivotCallback?
              * @param trx
              * @return
              */
            attach(references : Number | String | Array<String>, pivotCallback? : pivotCallback, trx? : Database.Transaction): Promise<Object>;

            /**
              * Delete related model rows in bulk and also detach
              * them from the pivot table.
              *
              * NOTE: This method will run 3 queries in total. First is to
              * fetch the related rows, next is to delete them and final
              * is to remove the relationship from pivot table.
              *
              * @method delete
              * @async
              *
              * @return {Number} Number of effected rows
              * @return
              */
            delete(): Database.NumberResult;

            /**
              * Update related rows
              *
              * @method update
              *
              * @param  {Object} values
              *
              * @return {Number}        Number of effected rows
              * @param values
              * @return
              */
            update(values : Object): Database.NumberResult;

            /**
              * Detach existing relations from the pivot table
              *
              * @method detach
              * @async
              *
              * @param  {Array}  references
              * @param  {Object} trx
              *
              * @return {Number}  The number of effected rows
              * @param references
              * @param trx
              * @return
              */
            detach(references : Array<String>, trx : Database.Transaction): number;

            /**
              * Calls `detach` and `attach` together.
              *
              * @method sync
              *
              * @param  {Number|String|Array} relatedPrimaryKeyValue
              * @param  {Function} [pivotCallback]
              *
              * @return {void}
              * @param references
              * @param pivotCallback?
              * @param trx
              * @return
              */
            sync(references : Number|String|Array<String>, pivotCallback? : pivotCallback, trx? : Database.Transaction): Promise<void>;

            /**
              * Save the related model instance and setup the relationship
              * inside pivot table
              *
              * @method save
              *
              * @param  {Object} relatedInstance
              * @param  {Function} pivotCallback
              *
              * @return {void}
              * @param relatedInstance
              * @param pivotCallback
              * @return
              */
            save(relatedInstance : Object, pivotCallback : pivotCallback): Promise<void>;

            /**
              * Save multiple relationships to the database. This method
              * will run queries in parallel
              *
              * @method saveMany
              * @async
              *
              * @param  {Array}    arrayOfRelatedInstances
              * @param  {Function} [pivotCallback]
              *
              * @return {void}
              * @param arrayOfRelatedInstances
              * @param pivotCallback?
              * @return
              */
            saveMany(arrayOfRelatedInstances : Array<Object>, pivotCallback? : pivotCallback): Promise<void>;

            /**
              * Creates a new related model instance and persist
              * the relationship inside pivot table
              *
              * @method create
              * @async
              *
              * @param  {Object}   row
              * @param  {Function} [pivotCallback]
              *
              * @return {Object}               Instance of related model
              * @param row
              * @param pivotCallback?
              * @return
              */
            create(row : Object, pivotCallback? : pivotCallback): Promise<Object>;

            /**
              * Creates multiple related relationships. This method will
              * call all queries in parallel
              *
              * @method createMany
              * @async
              *
              * @param  {Array}   rows
              * @param  {Function}   pivotCallback
              *
              * @return {Array}
              * @param rows
              * @param pivotCallback
              * @return
              */
            createMany(rows : Array<Object>, pivotCallback : pivotCallback): Promise<Array<Object>>;
        }

        /**
          * HasMany relationship instance is used to define a
          * has many relation. The instance of this class
          * is obtained via @ref(Model.hasMany) method.
          *
          * @class HasMany
          * @constructor
          */
        interface HasMany extends BaseRelation {
            /**
              * Returns an array of values to be used for running
              * whereIn query when eagerloading relationships.
              *
              * @method mapValues
              *
              * @param  {Array}  modelInstances - An array of model instances
              *
              * @return {Array}
              * @param modelInstances
              * @return
              */
            mapValues(modelInstances : Array<Object>): Array<Object>;

            /**
              * Takes an array of related instances and returns an array
              * for each parent record.
              *
              * @method group
              *
              * @param  {Array} relatedInstances
              *
              * @return {Object} @multiple([key=String, values=Array, defaultValue=Null])
              * @param relatedInstances
              * @return
              */
            group(relatedInstances : Array<Object>): Object;

            /**
              * Adds a where clause to limit the select search
              * to related rows only.
              *
              * @method relatedWhere
              *
              * @param  {Boolean}     count
              * @param  {Number}      counter
              *
              * @return {Object}
              * @param count
              * @param counter
              * @return
              */
            relatedWhere(count : boolean, counter : number): Database.Builder;

            /**
              * Adds `on` clause to the innerjoin context. This
              * method is mainly used by HasManyThrough
              *
              * @method addWhereOn
              *
              * @param  {Object}   context
              * @param context
              */
            addWhereOn(context : Object): void;

            /**
              * Saves the related instance to the database. Foreign
              * key is set automatically
              *
              * @method save
              *
              * @param  {Object}  relatedInstance
              * @param  {Object}  [trx]
              *
              * @return {Promise}
              * @param relatedInstance
              * @param trx?
              * @return
              */
            save(relatedInstance : Object, trx? : Database.Transaction): Promise<boolean>;

            /**
              * Creates the new related instance model and persist
              * it to database. Foreign key is set automatically
              *
              * @method create
              *
              * @param  {Object} payload
              * @param  {Object}  [trx]
              *
              * @return {Promise}
              * @param payload
              * @param trx?
              * @return
              */
            create(payload : Object, trx? : Database.Transaction): Promise<boolean>;

            /**
              * Creates an array of model instances in parallel
              *
              * @method createMany
              *
              * @param  {Array}   arrayOfPayload
              * @param  {Object}  [trx]
              *
              * @return {Array}
              * @param arrayOfPayload
              * @param trx?
              * @return
              */
            createMany(arrayOfPayload : Array<Object>, trx? : Database.Transaction): Promise<boolean>;

            /**
              * Creates an array of model instances in parallel
              *
              * @method createMany
              *
              * @param  {Array}   arrayOfRelatedInstances
              * @param  {Object}  [trx]
              *
              * @return {Array}
              * @param arrayOfRelatedInstances
              * @param trx?
              * @return
              */
            saveMany(arrayOfRelatedInstances : Array<Object>, trx? : Database.Transaction): Promise<boolean>;
        }

        /**
          * BelongsToMany class builds relationship between
          * two models with the help of pivot table/model
          *
          * @class BelongsToMany
          * @constructor
          */
        interface HasManyThrough extends BaseRelation {
            /**
              *
              * @param parentInstance
              * @param RelatedModel
              * @param relatedMethod
              * @param primaryKey
              * @param foreignKey
              */
            new(parentInstance: Object, RelatedModel: Object, relatedMethod: string, primaryKey: string, foreignKey: string): HasManyThrough;

            _relatedModelRelation : Object
            relatedQuery          : QueryProxy
            _relatedFields        : Array<string>
            _throughFields        : Array<string>
            _fields               : Array<string>

            /**
              * Select fields from the primary table
              *
              * @method select
              *
              * @param  {Array} columns
              *
              * @chainable
              * @param columns
              * @return
              */
            select(...columns: string[]): this;

            /**
              * Select fields from the through table.
              *
              * @method selectThrough
              *
              * @param  {Array}      columns
              *
              * @chainable
              * @param columns
              * @return
              */
            selectThrough(...columns: string[]): this;

            /**
              * Select fields from the related table
              *
              * @method selectRelated
              *
              * @param  {Array}      columns
              *
              * @chainable
              * @param columns
              * @return
              */
            selectRelated(...columns: string[]): this;

            /**
              * Returns an array of values to be used for running
              * whereIn query when eagerloading relationships.
              *
              * @method mapValues
              *
              * @param  {Array}  modelInstances - An array of model instances
              *
              * @return {Array}
              * @param modelInstances
              * @return
              */
            mapValues(modelInstances :  Array<Object>): Array<Object>;

            /**
              * Returns the eagerLoad query for the relationship
              *
              * @method eagerLoad
              * @async
              *
              * @param  {Array}          rows
              *
              * @return {Object}
              * @param rows
              * @return
              */
            eagerLoad(rows : Array<any>): Promise<Object>;

            /**
              * Takes an array of related instances and returns an array
              * for each parent record.
              *
              * @method group
              *
              * @param  {Array} relatedInstances
              *
              * @return {Object} @multiple([key=String, values=Array, defaultValue=Null])
              * @param relatedInstances
              * @return
              */
            group(relatedInstances : Array<Object>): Object;

            /**
              * Adds `on` clause to the innerjoin context. This
              * method is mainly used by HasManyThrough
              *
              * @method addWhereOn
              *
              * @param  {Object}   context
              * @param count
              * @return
              */
            relatedWhere(count : boolean): Database.Builder;

            /**
              * istanbul ignore next
              */
            create(): void;

            /**
              * istanbul ignore next
              */
            save(): void;

            /**
              * istanbul ignore next
              */
            createMany(): void;

            /**
              * istanbul ignore next
              */
            saveMany(): void;
        }
    }

    type QueryProxy = Overwrite<QueryBuilder, Overwrite<Database.QueryInterface, Database.Builder>>;
    type ModelEvent =
            "beforeCreate" |
            "afterCreate"  |
            "beforeUpdate" |
            "afterUpdate"  |
            "beforeSave"   |
            "afterSave"    |
            "beforeDelete" |
            "afterDelete"  |
            "afterFind"    |
            "afterFetch"   |
            "afterPaginate";

    /**
      * Lucid model is a base model and supposed to be
      * extended by other models.
      *
      * @binding Adonis/Src/Model
      * @alias Model
      * @group Database
      *
      * @class Model
      */
    interface Model extends BaseModel {
        new(): Model;
        [property: string]: any;

        /**
          * Returns an object of values dirty after persisting to
          * database or after fetching from database.
          *
          * @attribute dirty
          *
          * @return {Object}
          */
        dirty: any;

        /**
          * Tells whether model is dirty or not
          *
          * @attribute isDirty
          *
          * @return {Boolean}
          */
        isDirty: boolean;

        /**
          * Returns a boolean indicating if model is
          * child of a parent model
          *
          * @attribute hasParent
          *
          * @return {Boolean}
          */
        hasParent : boolean;

        /**
          * Insert values to the database. This method will
          * call before and after hooks for `create` and
          * `save` event.
          *
          * @method _insert
          * @async
          *
          * @param {Object} trx
          *
          * @return {Boolean}
          *
          * @private
          * @param trx
          * @return
          */
        _insert(trx : Database.Transaction): boolean;

        /**
          * Update model by updating dirty attributes to the database.
          *
          * @method _update
          * @async
          *
          * @param {Object} trx
          *
          * @return {Boolean}
          * @param trx
          * @return
          */
        _update(trx : Database.Transaction): boolean;

        /**
          * Set attribute on model instance. Setting properties
          * manually or calling the `set` function has no
          * difference.
          *
          * NOTE: this method will call the setter
          *
          * @method set
          *
          * @param  {String} name
          * @param  {Mixed} value
          *
          * @return {void}
          * @param name
          * @param value
          * @return
          */
        set(name : string, value : any): void;

        /**
          * Converts model to an object. This method will call getters,
          * cast dates and will attach `computed` properties to the
          * object.
          *
          * @method toObject
          *
          * @return {Object}
          * @return
          */
        toObject(): Object;

        /**
          * Persist model instance to the database. It will create
          * a new row when model has not been persisted already,
          * otherwise will update it.
          *
          * @method save
          * @async
          *
          * @param {Object} trx Transaction object to be used
          *
          * @return {Boolean} Whether or not the model was persisted
          * @param trx
          * @return
          */
        save(trx? : Database.Transaction): Promise<boolean>;

        /**
          * Deletes the model instance from the database. Also this
          * method will freeze the model instance for updates.
          *
          * @method delete
          * @async
          *
          * @return {Boolean}
          * @return
          */
        delete(): Promise<boolean>;

        /**
          * Perform required actions to newUp the model instance. This
          * method does not call setters since it is supposed to be
          * called after `fetch` or `find`.
          *
          * @method newUp
          *
          * @param  {Object} row
          *
          * @return {void}
          * @param row
          * @return
          */
        newUp(row : Object): void;

        /**
          * Sets a preloaded relationship on the model instance
          *
          * @method setRelated
          *
          * @param  {String}   key
          * @param  {Object|Array}   value
          *
          * @throws {RuntimeException} If trying to set a relationship twice.
          * @param key
          * @param value
          */
        setRelated(key : string, value : Object | Array<any>): void;

        /**
          * Returns the relationship value
          *
          * @method getRelated
          *
          * @param  {String}   key
          *
          * @return {Object}
          * @param key
          * @return
          */
        getRelated(key : string): Object;

        /**
          * Loads relationships and set them as $relations
          * attribute.
          *
          * To load multiple relations, call this method for
          * multiple times
          *
          * @method load
          * @async
          *
          * @param  {String}   relation
          * @param  {Function} callback
          *
          * @return {void}
          * @param relation
          * @param callback
          * @return
          */
        load(relation : string, callback : Function): Promise<void>;

        /**
          * Just like @ref('Model.load') but instead loads multiple relations for a
          * single model instance.
          *
          * @method loadMany
          * @async
          *
          * @param  {Object} eagerLoadMap
          *
          * @return {void}
          * @param eagerLoadMap
          * @return
          */
        loadMany(eagerLoadMap : Object): void;

        /**
          * Returns an instance of @ref('HasOne') relation.
          *
          * @method hasOne
          *
          * @param  {String|Class}  relatedModel
          * @param  {String}        primaryKey
          * @param  {String}        foreignKey
          *
          * @return {HasOne}
          * @param relatedModel
          * @param primaryKey
          * @param foreignKey
          * @return
          */
        hasOne(relatedModel : string | Model, primaryKey? : string, foreignKey? : string): Relations.HasOne;

        /**
          * Returns an instance of @ref('HasMany') relation
          *
          * @method hasMany
          *
          * @param  {String|Class}  relatedModel
          * @param  {String}        primaryKey
          * @param  {String}        foreignKey
          *
          * @return {HasMany}
          * @param relatedModel
          * @param primaryKey
          * @param foreignKey
          * @return
          */
        hasMany(relatedModel : string | Model, primaryKey? : string, foreignKey? : string): Relations.HasMany;

        /**
          * Returns an instance of @ref('BelongsTo') relation
          *
          * @method belongsTo
          *
          * @param  {String|Class}  relatedModel
          * @param  {String}        primaryKey
          * @param  {String}        foreignKey
          *
          * @return {BelongsTo}
          * @param relatedModel
          * @param primaryKey
          * @param foreignKey
          * @return
          */
        belongsTo(relatedModel : string | Model, primaryKey? : string, foreignKey? : string): Relations.BelongsTo;

        /**
          * Returns an instance of @ref('BelongsToMany') relation
          *
          * @method belongsToMany
          *
          * @param  {Class|String}      relatedModel
          * @param  {String}            foreignKey
          * @param  {String}            relatedForeignKey
          * @param  {String}            primaryKey
          * @param  {String}            relatedPrimaryKey
          *
          * @return {BelongsToMany}
          * @param relatedModel
          * @param foreignKey
          * @param relatedForeignKey
          * @param primaryKey
          * @param relatedPrimaryKey
          * @return
          */
        belongsToMany(relatedModel : Model | string, foreignKey? : string, relatedForeignKey? : string, primaryKey? : string, relatedPrimaryKey? : string): Relations.BelongsToMany;

        /**
          * Returns instance of @ref('HasManyThrough')
          *
          * @method manyThrough
          *
          * @param  {Class|String}    relatedModel
          * @param  {String}    relatedMethod
          * @param  {String}    primaryKey
          * @param  {String}    foreignKey
          *
          * @return {HasManyThrough}
          * @param relatedModel
          * @param relatedMethod
          * @param primaryKey
          * @param foreignKey
          * @return
          */
        manyThrough(relatedModel : Model | string, relatedMethod : string, primaryKey? : string, foreignKey? : string): Relations.HasManyThrough;

        /**
          * Reload the model instance in memory. Some may
          * not like it, but in real use cases no one
          * wants a new instance.
          *
          * @method reload
          *
          * @return {void}
          * @return
          */
        reload(): Promise<void>;

        /**
          * Boot model if not booted. This method is supposed
          * to be executed via IoC container hooks.
          *
          * @method _bootIfNotBooted
          *
          * @return {void}
          *
          * @private
          *
          * @static
          */
        _bootIfNotBooted(): void;

        /**
          * An array of methods to be called everytime
          * a model is imported via ioc container.
          *
          * @attribute iocHooks
          *
          * @return {Array}
          *
          * @static
          */
        iocHooks : Array<string>;

        /**
          * Making sure that `ioc.make` returns
          * the class object and not it's
          * instance
          *
          * @method makePlain
          *
          * @return {Boolean}
          */
        makePlain : boolean;

        /**
          * The primary key for the model. You can change it
          * to anything you want, just make sure that the
          * value of this key will always be unique.
          *
          * @attribute primaryKey
          *
          * @return {String} The default value is `id`
          *
          * @static
          */
        primaryKey : string;

        /**
          * The foreign key for the model. It is generated
          * by converting model name to lowercase and then
          * snake case and appending `_id` to it.
          *
          * @attribute foreignKey
          *
          * @return {String}
          *
          * @example
          * ```
          * User - user_id
          * Post - post_id
          * ``
          */
        foreignKey : string;

        /**
          * Tell Lucid whether primary key is supposed to be incrementing
          * or not. If `false` is returned then you are responsible for
          * setting the `primaryKeyValue` for the model instance.
          *
          * @attribute incrementing
          *
          * @return {Boolean}
          *
          * @static
          */
        incrementing : boolean;

        /**
          * Returns the value of primary key regardless of
          * the key name.
          *
          * @attribute primaryKeyValue
          *
          * @return {Mixed}
          */
        primaryKeyValue: any

        /**
          * The table name for the model. It is dynamically generated
          * from the Model name by pluralizing it and converting it
          * to lowercase.
          *
          * @attribute table
          *
          * @return {String}
          *
          * @static
          *
          * @example
          * ```
          * Model - User
          * table - users
          *
          * Model - Person
          * table - people
          * ```
          */
        table : string;

        /**
          * Get fresh instance of query builder for
          * this model.
          *
          * @method query
          *
          * @return {LucidQueryBuilder}
          *
          * @static
          */
        query(): QueryProxy;

        /**
          * Returns a query builder without any global scopes
          *
          * @method queryWithOutScopes
          *
          * @return {QueryBuilder}
          */
        queryWithOutScopes(): QueryProxy;

        /**
          * Define a query macro to be added to query builder.
          *
          * @method queryMacro
          *
          * @param  {String}   name
          * @param  {Function} fn
          *
          * @chainable
          */
        queryMacro(name: string, fn: (params: Object) => this): this;

        /**
          * Adds a new hook for a given event type.
          * @method addHook
          *
          * @param  {String} forEvent
          * beforeCreate     Before creating a new row.
          * afterCreate      After a new record is created.
          * beforeUpdate     Before updating a row.
          * afterUpdate      After a row has been updated.
          * beforeSave       This event occurs before creating or updating a new record.
          * afterSave        After a new record has been created or updated.
          * beforeDelete     Before removing a row.
          * afterDelete      After a row is removed.
          * afterFind        After a single row is fetched from the database.
          * afterFetch       After the fetch method is executed. The hook method receives an array of the model instances.
          * afterPaginate    After the paginate method is executed. The hook receives 2 arguments, where the first is the array of model instances and 2nd the pagination meta data.
          * @param  {Function|String|Array} handlers
          *
          * @chainable
          *
          * @static
          */
        addHook(forEvent: ModelEvent, handlers: ((params: any) => void) | String | Array<any>): this;

        /**
          * Adds the global scope to the model global scopes.
          *
          * You can also give name to the scope, since named
          * scopes can be removed when executing queries.
          *
          * @method addGlobalScope
          *
          * @param  {Function}     callback
          * @param  {String}       [name = null]
          *
          * @chainable
          */
        addGlobalScope(callback : Database.QueryCallback, name? : string): this;

        /**
          * Attach a listener to be called everytime a query on
          * the model is executed.
          *
          * @method onQuery
          *
          * @param  {Function} callback
          *
          * @chainable
          */
        onQuery(callback : Database.QueryCallback): this;

        /**
          * Adds a new trait to the model. Ideally it does a very
          * simple thing and that is to pass the model class to
          * your trait and you own it from there.
          *
          * @method addTrait
          *
          * @param  {Function|String} trait - A plain function or reference to IoC container string
          */
        addTrait(trait : string | Function, options?: {}): void;

        /**
          * Creates a new model instances from payload
          * and also persist it to database at the
          * same time.
          *
          * @method create
          *
          * @param  {Object} payload
          * @param  {Object} [trx]
          *
          * @return {Model} Model instance is returned
          */
        create(payload : Object, trx? : Database.Transaction): Promise<Model>;

        /**
          * Returns the latest row from the database.
          *
          * @method last
          * @async
          *
          * @param  {String} field
          *
          * @return {Model|Null}
          */
        last(field? : string): Promise<Model>;

        /**
          * Creates many instances of model in parallel.
          *
          * @method createMany
          *
          * @param  {Array} payloadArray
          * @param  {Object} [trx]
          *
          * @return {Array} Array of model instances is returned
          *
          * @throws {InvalidArgumentException} If payloadArray is not an array
          */
        createMany(payloadArray : Array<Object>, trx? : Database.Transaction): Promise<Array<Model>>;

        /**
          * Deletes all rows of this model (truncate table).
          *
          * @method truncate
          *
          * @return {Promise<void>}
          */
        truncate(): void;

        /**
          * Find a row using the primary key
          *
          * @method find
          * @async
          *
          * @param  {String|Number} value
          *
          * @return {Model|Null}
          */
        find(value : string | number): Promise<Model>;

        /**
          * Find a row using the primary key or
          * fail with an exception
          *
          * @method findByOrFail
          * @async
          *
          * @param  {String|Number}     value
          *
          * @return {Model}
          *
          * @throws {ModelNotFoundException} If unable to find row
          */
        findOrFail(value : string | number): Promise<Model>;

        /**
          * Find a model instance using key/value pair
          *
          * @method findBy
          * @async
          *
          * @param  {String} key
          * @param  {String|Number} value
          *
          * @return {Model|Null}
          */
        findBy(key : string, value : string | number): Promise<Model>;

        /**
          * Find a model instance using key/value pair or
          * fail with an exception
          *
          * @method findByOrFail
          * @async
          *
          * @param  {String}     key
          * @param  {String|Number}     value
          *
          * @return {Model}
          *
          * @throws {ModelNotFoundException} If unable to find row
          */
        findByOrFail(key : string, value : string | number): Promise<Model>;

        /**
          * Returns the first row. This method will add orderBy asc
          * clause
          *
          * @method first
          * @async
          *
          * @return {Model|Null}
          */
        first(): Promise<Model>;

        /**
          * Returns the first row or throw an exception.
          * This method will add orderBy asc clause.
          *
          * @method first
          * @async
          *
          * @return {Model}
          *
          * @throws {ModelNotFoundException} If unable to find row
          */
        firstOrFail(): Promise<Model>;

        /**
          * Find a row or create a new row when it doesn't
          * exists.
          *
          * @method findOrCreate
          * @async
          *
          * @param  {Object}     whereClause
          * @param  {Object}     payload
          * @param  {Object}     [trx]
          *
          * @return {Model}
          */
        findOrCreate(whereClause : Object, payload : Object, trx? : Database.Transaction): Promise<Model>;

        /**
          * Find row from database or returns an instance of
          * new one.
          *
          * @method findOrNew
          *
          * @param  {Object}  whereClause
          * @param  {Object}  payload
          *
          * @return {Model}
          */
        findOrNew(whereClause : Object, payload : Object): Promise<Model>;

        /**
          * Fetch everything from the database
          *
          * @method all
          * @async
          *
          * @return {Collection}
          */
        all(): Promise<Serializer>;

        /**
          * Select x number of rows
          *
          * @method pick
          * @async
          *
          * @param  {Number} [limit = 1]
          *
          * @return {Collection}
          */
        pick(limit? : 1): Promise<Serializer>;

        /**
          * Select x number of rows in inverse
          *
          * @method pickInverse
          * @async
          *
          * @param  {Number}    [limit = 1]
          *
          * @return {Collection}
          */
        pickInverse(limit? : 1): Promise<Serializer>;

        /**
          * Returns an array of ids.
          *
          * Note: this method doesn't allow eagerloading relations
          *
          * @method ids
          * @async
          *
          * @return {Array}
          */
        ids<T>(): Promise<T[]>;

        /**
          * Returns an object of key/value pairs.
          * This method will not eagerload relationships.
          * The lhs field is the object key, and rhs is the value.
          *
          * @method pair
          * @async
          *
          * @param  {String} lhs
          * @param  {String} rhs
          *
          * @return {Object}
          */
        pair(lhs : string, rhs : string): Promise<Object>;

        /**
          * Return a count of all model records.
          *
          * @method getCount
          *
          * @param  {String} columnName = '*'
          *
          * @return {Number}
          */
        getCount(columnName?: '*'): Promise<number>;

        /**
          * Return a distinct count of all model records.
          *
          * @method getCountDistinct
          *
          * @param  {String} columnName
          *
          * @return {Number}
          */
        getCountDistinct(columnName : string): Promise<number>;

        /**
          * Return the average of all values of columnName.
          *
          * @method getAvg
          *
          * @param  {String} columnName
          *
          * @return {Number}
          */
        getAvg(columnName : string): Promise<number>;

        /**
          * Return the average of all distinct values of columnName.
          *
          * @method getAvgDistinct
          *
          * @param  {String} columnName
          *
          * @return {Number}
          */
        getAvgDistinct(columnName : string): Promise<number>;

        /**
          * Return the minimum of all values of columnName.
          *
          * @method getMin
          *
          * @param  {String} columnName
          *
          * @return {Number}
          */
        getMin(columnName : string): Promise<number>;

        /**
          * Return the maximum of all values of columnName.
          *
          * @method getMax
          *
          * @param  {String} columnName
          *
          * @return {Number}
          */
        getMax(columnName : string): Promise<number>;

        /**
          * Return the sum of all values of columnName.
          *
          * @method getSum
          *
          * @param  {String} columnName
          *
          * @return {Number}
          */
        getSum(columnName : string): Promise<number>;

        /**
          * Return the sum of all distinct values of columnName.
          *
          * @method getSumDistinct
          *
          * @param  {String} columnName
          *
          * @return {Number}
          */
        getSumDistinct(columnName : string): Promise<number>;

        $booted : boolean;
    }

    /**
      * Pivot model is used when a pivot relationship
      * instance is created. If user defines a custom
      * `pivotModel` then this model is not used.
      *
      * This model is not compatable with the actual Lucid
      * model, but is somehow similar.
      *
      * @class PivotModel
      * @constructor
      */
    interface PivotModel extends BaseModel{
        new (): PivotModel;
        [property: string]: any;

        $table: string
        $withTimestamps: boolean
        $connection: Database

        /**
          * Perform required actions to newUp the model instance. This
          * method does not call setters since it is supposed to be
          * called after `fetch` or `find`.
          *
          * @method newUp
          *
          * @param  {Object} row
          *
          * @return {void}
          * @param row
          * @return
          */
        newUp(row : Object): void;

        /**
          * Converts model to an object. This method will cast dates.
          *
          * @method toObject
          *
          * @return {Object}
          * @return
          */
        toObject(): void;

        /**
          * Set attribute on model instance. Setting properties
          * manually or calling the `set` function has no
          * difference.
          *
          * Note this method will call the setter
          *
          * @method set
          *
          * @param  {String} name
          * @param  {Mixed} value
          *
          * @return {void}
          * @param name
          * @param value
          * @return
          */
        set(name : string, value : any): void;

        /**
          * Returns query builder instance for a given connection
          * and table
          *
          * @method query
          *
          * @param  {String} table
          * @param  {Object} connection
          *
          * @return {Object}
          * @param table
          * @param connection
          * @return
          */
        query(table : string, connection : Database): Database.Builder;

        /**
          * Save the model instance to the database.
          *
          * @method save
          * @async
          *
          * @param {Object} trx
          *
          * @return {void}
          * @param trx
          * @return
          */
        save(trx : Database.Transaction): void;
    }

    /**
     * Hooks into suite lifcycle and run database
     * queries inside transactions
     *
     * @method exports
     *
     * @param  {Object} suite
     *
     * @return {void}
     */
    type DatabaseTransactions = (suite: Suite) => void;
}

/**
  * Model factory to seed database using Lucid
  * models
  *
  * @class DatabaseFactory
  * @constructor
  */
interface DatabaseFactory {
    /**
      *
      * @param tableName
      * @param dataCallback
      */
    new (tableName : string, dataCallback : Function): DatabaseFactory;

    tableName        : string;
    dataCallback     : Function;
    _returningColumn : string;
    _connectio       : Database;

    /**
      * Returns the query builder instance for
      * a given connection
      *
      * @method _getQueryBuilder
      *
      * @return {Object}
      *
      * @private
      * @return
      */
    _getQueryBuilder(): Object;

    /**
      * Make a single instance of blueprint for a given
      * index. This method will evaluate the functions
      * in the return payload from blueprint.
      *
      * @method _makeOne
      * @async
      *
      * @param  {Number} index
      * @param  {Object} data
      *
      * @return {Object}
      *
      * @private
      * @param index
      * @param data
      */
    _makeOne(index : number, data : Object): Object;

    /**
      * Set table to used for the database
      * operations
      *
      * @method table
      *
      * @param  {String} tableName
      *
      * @chainable
      * @param tableName
      * @return
      */
    table(tableName : string): this;

    /**
      * Specify the returning column from the insert
      * query
      *
      * @method returning
      *
      * @param  {String}  column
      *
      * @chainable
      * @param column
      * @return
      */
    returning(column : string): this;

    /**
      * Specify the connection to be used on
      * the query builder
      *
      * @method connection
      *
      * @param  {String}   connection
      *
      * @chainable
      * @param connection
      * @return
      */
    connection(connection : string): this;

    /**
      * Make a single model instance with attributes
      * from blueprint fake values
      *
      * @method make
      * @async
      *
      * @param  {Object} data
      * @param  {Number} [index = 0]
      *
      * @return {Object}
      * @param data
      * @param index?
      * @return
      */
    make(data? : {}, index? : 0): Object;

    /**
      * Make x number of model instances with
      * fake data
      *
      * @method makeMany
      * @async
      *
      * @param  {Number} instances
      * @param  {Object} [data = {}]
      *
      * @return {Array}
      * @param instances
      * @param data?
      * @return
      */
    makeMany(instances : number, data? : {}): Promise<Object>;

    /**
      * Create model instance and persist to database
      * and then return it back
      *
      * @method create
      * @async
      *
      * @param  {Object} data
      *
      * @return {Object}
      * @param data
      * @param index
      * @return
      */
    create(data? : {}, index? : 0): Promise<Object>;

    /**
      * Persist multiple model instances to database and get
      * them back as an array
      *
      * @method createMany
      * @async
      *
      * @param  {Number}   numberOfRows
      * @param  {Object}   [data = {}]
      *
      * @return {Array}
      * @param numberOfRows
      * @param data?
      * @return
      */
    createMany(numberOfRows : number, data? : {}): Promise<Array<Object>>;

    /**
      * Truncate the database table
      *
      * @method reset
      * @async
      *
      * @return {Number}
      * @return
      */
    reset(): Promise<number>;
}

/**
  * Model factory to seed database using Lucid
  * models
  *
  * @class ModelFactory
  * @constructor
  */
interface ModelFactory {
    /**
      *
      * @param Model
      * @param dataCallback
      */
    new (Model : Lucid.Model, dataCallback : Function): ModelFactory;

    Model: Lucid.Model;
    dataCallback: Function;

    /**
      * New up a model with attributes
      *
      * @method _newup
      *
      * @param  {Object} attributes
      *
      * @return {Object}
      *
      * @private
      * @param attributes
      * @return
      */
    _newup(attributes : Object): Object;

    /**
      * Make a single instance of blueprint for a given
      * index. This method will evaluate the functions
      * in the return payload from blueprint.
      *
      * @method _makeOne
      * @async
      *
      * @param  {Number} index
      * @param  {Object} data
      *
      * @return {Object}
      *
      * @private
      * @param index
      * @param data
      */
    _makeOne(index : number, data : Object): Object;

    /**
      * Make a single model instance with attributes
      * from blueprint fake values
      *
      * @method make
      * @async
      *
      * @param  {Object} data
      * @param  {Number} [index = 0]
      *
      * @return {Object}
      * @param data
      * @param index?
      * @return
      */
    make(data : {}, index? : 0): Promise<Object>;

    /**
      * Make x number of model instances with
      * fake data
      *
      * @method makeMany
      * @async
      *
      * @param  {Number} instances
      * @param  {Object} [data = {}]
      *
      * @return {Array}
      * @param instances
      * @param data?
      * @return
      */
    makeMany(instances : number, data? : {}): Promise<Array<Object>>;

    /**
      * Create model instance and persist to database
      * and then return it back
      *
      * @method create
      * @async
      *
      * @param  {Object} data
      *
      * @return {Object}
      * @param data
      * @param index
      * @return
      */
    create(data? : {}, index? : 0): Promise<Object>;

    /**
      * Persist multiple model instances to database and get
      * them back as an array
      *
      * @method createMany
      * @async
      *
      * @param  {Number}   numberOfRows
      * @param  {Object}   [data = {}]
      *
      * @return {Array}
      * @param numberOfRows
      * @param data?
      * @return
      */
    createMany(numberOfRows : number, data? : {}): Promise<Array<Object>>;

    /**
      * Truncate the database table
      *
      * @method reset
      * @async
      *
      * @return {Number}
      * @return
      */
    reset(): Promise<number>;
}

/**
  * Factory class is used to define blueprints
  * and then get model or database factory
  * instances to seed the database.
  *
  * @binding Adonis/Src/Factory
  * @singleton
  * @alias Factory
  * @group Database
  *
  * @class Factory
  * @constructor
  */
interface Factory {
    new (): Factory;

    /**
      * Register a new blueprint with model or table name
      * and callback to be called to return the fake data
      * for model instance of table insert query.
      *
      * @method blueprint
      *
      * @param  {String}   name
      * @param  {Function} callback
      *
      * @chainable
      *
      * @example
      * ```js
      * Factory.blueprint('App/Model/User', (fake) => {
      *   return {
      *     username: fake.username(),
      *     password: async () => {
      *       return await Hash.make('secret')
      *     }
      *   }
      * })
      * ```
      * @param name
      * @param callback
      * @return
      */
    blueprint(name : string, callback : Function): this;

    /**
      * Returns the blueprint map with the map
      * and the callback.
      *
      * @method getBlueprint
      *
      * @param  {String}     name
      *
      * @return {Object}
      * @param name
      * @return
      */
    getBlueprint(name : string): Object;

    /**
      * Get model factory for a registered blueprint.
      *
      * @method model
      *
      * @param  {String} name
      *
      * @return {ModelFactory}
      * @param name
      * @return
      */
    model(name : string): ModelFactory;

    /**
      * Get database factory instance for a registered blueprint
      *
      * @method get
      *
      * @param  {String} name
      *
      * @return {DatabaseFactory}
      * @param name
      * @return
      */
    get(name : string): DatabaseFactory;

    /**
      * Clear all the registered blueprints.
      *
      * @method clear
      *
      * @return {void}
      * @return
      */
    clear(): void;
}

/**
  * Migration class is used to migrate the database by
  * calling actions defined inside schema class.
  *
  * @binding Adonis/Src/Migration
  * @singleton
  * @alias Migration
  * @group Database
  * @uses (['Adonis/Src/Config', 'Adonis/Src/Database'])
  *
  * @class Migration
  * @constructor
  */
interface Migration {

    /**
      *
      * @param Config
      * @param Database
      */
    new (Config : Config, Database : Database): Migration;

    db                 : Database;
    _migrationsTable   : string;
    _lockTable         : string;
    isKeepAliveEnabled : boolean;

    /**
      * Enable or disable keepAlive, which prevents the database connection from being closed.
      *
      * @method keepAlive
      *
      * @param {boolean}enabled
      *
      * @return {void}
      * @param enabled
      * @return
      */
    keepAlive(enabled?: true): void;

    /**
      * Migrate the database using defined schema
      *
      * @method up
      *
      * @param  {Object} schemas
      *
      * @return {Object}
      *
      * @throws {Error} If any of schema file throws exception
      * @param schemas
      * @param toSQL
      * @return
      */
    up(schemas : Object, toSQL : Boolean): Promise<Object>;

    /**
      * Rollback migrations to a given batch, latest
      * batch or the way upto to first batch.
      *
      * @method down
      *
      * @param  {Object} schemas
      * @param  {Number} batch
      * @param  {Boolean} toSQL
      *
      * @return {Object}
      *
      * @throws {Error} If something blows in schema file
      * @param schemas
      * @param batch
      * @param toSQL
      * @return
      */
    down(schemas : Object, batch : number, toSQL : boolean): Promise<Object>;

    /**
      * Returns the status of all the schemas
      *
      * @method status
      *
      * @param  {Object} schemas
      *
      * @return {Object}
      * @param schemas
      * @return
      */
    status(schemas : Object): Promise<Object>;
}

declare namespace Redis {
    /**
      * Redis class is used to call methods on a redis server.
      * This library creates a pool of connections and reuse
      * them.
      *
      * @namespace Adonis/Addons/Redis
      * @singleton
      * @alias Redis
      *
      * @class Redis
      * @constructor
      */
    interface Core {
        /**
          *
          * @param Config
          * @param Factory
          * @return
          */
        new (Config : ioredis.RedisOptions, Factory : RedisFactory): Redis;

        Config: ioredis.RedisOptions;
        Factory: RedisFactory;
        connectionPools: { [key: string]: RedisFactory };

        /**
          * Looks at the config file and tells if a
          * cluster connection to be created or
          * not
          *
          * @param   {Object}  config
          *
          * @return  {Boolean}
          *
          * @private
          * @param config
          * @return
          */
        _isCluster(config : ioredis.RedisOptions): boolean;

        /**
          * Closes a given redis connection by quitting
          * and removing it from the connectionsPool.
          *
          * @param   {String} connection
          *
          * @private
          * @param connection
          */
        _closeConnection(connection : string): void;

        /**
          * Returns instance of a new factory instance for
          * a given connection.
          *
          * @param  {String} [connection='']
          *
          * @return {RedisFactory}
          * @param connection?
          * @return
          */
        connection(connection? : string): RedisFactory;

        /**
          * Creates a connection using raw config and adds it to the
          * connection pool.
          *
          * @method namedConnection
          *
          * @param  {String}        name
          * @param  {Object}        config
          *
          * @return {RedisFactory}
          * @param name
          * @param config
          * @return
          */
        namedConnection(name : string, config : ioredis.RedisOptions): RedisFactory;

        /**
          * Returns a hash of connection pools
          *
          * @return {Object}
          *
          * @public
          * @return
          */
        getConnections(): Object;

        /**
          * Closes a single or number of redis connections
          *
          * @param  {Spread} connections
          *
          * @public
          * @param ...name
          * @return
          */
        quit(...name : Array<string>): Promise<string>;
    }

    interface RedisFactory {
        /**
          *
          * @param config
          * @param useCluster
          * @return
          */
        new (config : ioredis.RedisOptions, useCluster? : boolean): RedisFactory;

        /**
          * The main redis connection.
          *
          * @attribute connection
          *
          * @type {Object}
          */
        connection: Object;

        /**
          * The list of subscribers for different channels
          *
          * @type {Array}
          */
        subscribers: Array<Object>;

        /**
          * The list of psubscribers for different channels
          *
          * @type {Array}
          */
        psubscribers: Array<Object>

        /**
          * The connection for subscribers, this connection is created
          * automatically when you register a subscriber.
          */
        subscriberConnection: Object;

        /**
          * Creates a new redis connection
          *
          * @method connect
          *
          * @return {void}
          * @return
          */
        // connect(): void;

        /**
          * Subscribe to a channel
          *
          * @method subscribe
          * @async
          *
          * @param  {String}  channel
          * @param  {Function|String}  handler
          *
          * @return {void}
          * @param channel
          * @param handler
          * @return
          */
        subscribe(channel : string, handler : Function | string): Promise<void>;

        /**
          * Subscribe to a pattern on redis
          *
          * @method psubscribe
          * @async
          *
          * @param  {String}   pattern
          * @param  {Function|String}   handler
          *
          * @return {void}
          * @param pattern
          * @param handler
          * @return
          */
        psubscribe(pattern : string, handler : Function | string): Promise<void>;

        /**
          * Unsubscribe from a channel. If there are no subscribers for
          * any channels, this method will close the subscription
          * connection with redis.
          *
          * @method unsubscribe
          * @async
          *
          * @param  {String}    channel
          *
          * @return {String}   `OK` is return if unsubscribed
          * @param channel
          * @return
          */
        unsubscribe(channel : string): Promise<void>;

        /**
          * Unsubscribe from a pattern. If there are no subscribers for
          * any patterns, this method will close the subscription
          * connection with redis.
          *
          * @method punsubscribe
          * @async
          *
          * @param  {String}    pattern
          *
          * @return {String}   `OK` is return if unsubscribed
          * @param pattern
          * @return
          */
        punsubscribe(pattern : string): Promise<void>;

        /**
          * Closes redis connection
          *
          * @return {Promise}
          *
          * @public
          * @return
          */
        quit(): Promise<void>;
    }
}

type RedisFactory = Redis.RedisFactory & ioredis.Redis;
type Redis = Redis.Core & RedisFactory;

interface Drive {
    /**
      * Returns full path to the storage root directory
      *
      * @method _fullPath
      *
      * @param  {String}  relativePath
      *
      * @return {String}
      *
      * @private
      * @param relativePath
      * @return
      */
    _fullPath(relativePath : string): string;

    /**
      * Determine if a file or folder already exists
      *
      * @method exists
      * @async
      *
      * @param {String} location
      * @param location
      */
    exists(location : string): Promise<boolean>;

    /**
      * Returns file contents
      *
      * @method get
      * @async
      *
      * @param  {String} location
      * @param  {String|Object} [encoding]
      *
      * @return {String|Buffer}
      * @param location
      * @param encoding?
      * @return
      */
    get(location : string, encoding? : string | object): Promise<string|Buffer>;

    /**
      * Returns a read stream for a file location. This method
      * is same as `fs.createReadStream` but added for
      * convenience.
      *
      * @method getStream
      *
      * @param {String} location
      * @param {Object|String} options
      *
      * @return {ReadableStream}
      * @param location
      * @param options
      * @return
      */
    getStream(location : string, options : Object | string): ReadableStream;

    /**
      * Create a new file. This method will create
      * missing directories on the fly.
      *
      * @method put
      *
      * @param  {String} location
      * @param  {String|Buffer|Stream}  content
      * @param  {Object} [options = {}]
      *
      * @return {Boolean}
      * @param location
      * @param content
      * @param options?
      * @return
      */
    put(location : string, content : string | Buffer | stream, options? : Object): Promise<Boolean>;

    /**
      * Prepends content to the file
      *
      * @method prepend
      *
      * @param  {String} location
      * @param  {String|Buffer}  content
      * @param  {Object} [options = {}]
      *
      * @return {Boolean}
      * @param location
      * @param content
      * @param options?
      * @return
      */
    prepend(location : string, content : string | Buffer, options? : Object): Promise<boolean>;

    /**
      * Appends content to the file
      *
      * @method append
      *
      * @param  {String} location
      * @param  {String|Buffer|Stream}  content
      * @param  {Object} [options = {}]
      *
      * @return {Boolean}
      * @param location
      * @param content
      * @param options?
      * @return
      */
    append(location : string, content : string |  Buffer | stream, options? : Object): Promise<boolean>;

    /**
      * Delete existing file. This method will not
      * throw any exception if file doesn't exists
      *
      * @method delete
      *
      * @param  {String} location
      *
      * @return {Boolean}
      * @param location
      * @return
      */
    delete(location : string): boolean;

    /**
      * Move file to a new location
      *
      * @method move
      * @async
      *
      * @param  {String} src
      * @param  {String} dest
      * @param  {Object} options
      *
      * @return {Boolean}
      * @param src
      * @param dest
      * @param options
      * @return
      */
    move(src : string, dest : string, options : Object): boolean;

    /**
      * Copy a file to a location.
      *
      * @method copy
      * @async
      *
      * @param  {String} src
      * @param  {String} dest
      * @param  {Object} options
      *
      * @return {Boolean}
      * @param src
      * @param dest
      * @param options
      * @return
      */
    copy(src : string, dest : string, options : Object): boolean;

    /**
     * Register a custom driver.
     *
     * @param  {string} name
     * @param  {mixed} handler
     * @return {this}
     */
    extend(name: string, handler: any): Drive;

    /**
     * Get a disk instance.
     *
     * @param  {string} name
     * @return {object}
     */
    disk(name: string): any;
}


/**
  * The test suite is a group of tests under one file. Suite
  * let you define behavior and requirements of all the
  * tests under one file.
  *
  * @namespace Test/Suite
  *
  * @class Suite
  * @constructor
  */
interface Suite {
    /**
      * @param title
      */
    new (title : string): Suite;

    /**
      * Each suite is a japa group with some extras
      * on top of it.
      *
      * @type {Object} Japa group instance
      * @attribute group
      */
    group: Object;

    /**
      * List of traits to be executed before executing
      * suite tests
      *
      * @attribute traits
      *
      * @type {Array}
      */
    traits: Array<Object>

    /**
      * Suite context class to be used for adding getters
      * or macros to the context. A new instance of
      * context is passed to individual tests.
      *
      * @attribute Context
      *
      * @type {Context}
      */
    Context: Object;

    /**
      * Reference of base Request class, that should be extended
      * by other request clients.
      *
      * @type {BaseRequest}
      */
    Request: Object;

    /**
      * Reference to base response class, that should be extended
      * by other request clients to make response.
      *
      * @type {BaseResponse}
      */
    Response: Object;

    /**
      * Returns a boolean indicating whether a trait
      * exists or not.
      *
      * @method hasTrait
      *
      * @param  {String}  name
      *
      * @return {Boolean}
      * @param name
      * @return
      */
    hasTrait(name : string): boolean;

    /**
      * Hooks to be called before each test inside
      * the suite.
      *
      * @method beforeEach
      *
      * @param  {Function} callback
      *
      * @return {void}
      * @param callback
      * @return
      */
    beforeEach(callback : Function): void;

    /**
      * Hooks to be called after each test inside
      * the suite
      *
      * @method afterEach
      *
      * @param  {Function} callback
      *
      * @return {void}
      * @param callback
      * @return
      */
    afterEach(callback : Function): void;

    /**
      * Hooks to be called after all the tests inside
      * the suite has been ended.
      *
      * @method after
      *
      * @param  {Function} callback
      *
      * @return {void}
      * @param callback
      * @return
      */
    after(callback : Function): void;

    /**
      * Hooks to be called before any the tests inside
      * the suite has started.
      *
      * @method before
      *
      * @param  {Function} callback
      *
      * @return {void}
      * @param callback
      * @return
      */
    before(callback : Function): void;

    /**
      * Add a new test
      *
      * @method test
      *
      * @param  {String}   title
      * @param  {Function} callback
      *
      * @return {Object} Instance of japa test
      * @param title
      * @param callback
      * @return
      */
    test(title : string, callback : Function): Object;

    /**
      * Add a new regression test
      *
      * @method failing
      *
      * @param  {String}   title
      * @param  {Function} callback
      *
      * @return {Object} Instance of japa test
      * @param title
      * @param callback
      * @return
      */
    failing(title : string, callback : Function): Object;

    /**
      * Add a new test to be skipped
      *
      * @method skip
      *
      * @param  {String}   title
      * @param  {Function} callback
      *
      * @return {Object} Instance of japa test
      * @param title
      * @param callback
      * @return
      */
    skip(title : string, callback : Function): Object;

    /**
      * Timeout for all the tests inside the suite
      *
      * @method timeout
      *
      * @param  {Number} timeout
      *
      * @chainable
      * @param timeout
      * @return
      */
    timeout(timeout : number): this;

    /**
      * Add a new trait to the suite. Traits are executed
      * before any of the tests are executed inside the
      * suite.
      *
      * A trait can be a `plain function`, `a class`, or
      * reference to `ioc container binding`.
      *
      * Class and Ioc container binding should have a **handle**
      * method on it.
      *
      * @method trait
      *
      * @param  {Function|String|Class} action
      * @param  {Object} [options = {}]
      *
      * @return {void}
      * @param action
      * @param options?
      * @return
      */
    trait(action : Function | String | Object, options? : Object): void;
}


/**
 * Antl is public passing API to format values
 * and messages for a given locale
 *
 * @class Antl
 * @constructor
 *
 * @param {String} locale  The local for which values to be formatted
 * @param {Object} messages An object of messages. It should be loaded via a loader.
 */
interface Antl {

	/**
	 *
	 * @param locale
	 * @param messages
	 */
	new (locale : String, messages : Object): Antl;

	/**
	 * Switch to a different locale at runtime
	 *
	 * @method switchLocale
	 *
	 * @param {String} locale
	 *
	 * @return {void}
	 * @param locale
	 * @return
	 */
	switchLocale(locale : string): void;

	/**
	 * Same as @ref('Antl.switchLocale') but instead
	 * returns the reference to `this` for chaining
	 *
	 * @method forLocale
	 *
	 * @param {any} locale
	 *
	 * @chainable
	 * @param locale
	 * @return
	 */
	forLocale(locale : string): this;

		/**
	 * Formats a number using Intl.NumberFormat. Visit
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat to
	 * learn more about configuration options.
	 *
	 * @method formatNumber
	 *
	 * @param  {Number}     value
	 * @param  {Object}     [options]
	 * @param  {String}     [fallback] Fallback text when actual value is missing
	 *
	 * @return {String}
	 *
	 * @example
	 * ```js
	 * formatter
	 *   .formatNumber(1000, { style: 'currency', currency: 'usd' })
	 * ```
	 * @param value
	 * @param options?
	 * @param fallback?
	 * @return
	 */
	formatNumber(value : number, options? : Object, fallback? : string): string;

	/**
	 * Formats the date as per Intl.DateTimeFormat. Learn more about it
	 * at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
	 *
	 * @method formatDate
	 *
	 * @param  {String|Date|Number}   value
	 * @param  {Object}               options
	 * @param  {String}               fallback
	 *
	 * @return {String}
	 *
	 * @example
	 * ```js
	 * formatter
	 *   .formatDate(new Date())
	 * ```
	 * @param value
	 * @param options
	 * @param fallback
	 * @return
	 */
	formatDate(value : String|Date|Number, options : Object, fallback : string): string;

	/**
	 * Formats the date relative from the current timestamp. It is
	 * based on https://github.com/yahoo/intl-relativeformat.
	 *
	 * @method formatRelative
	 *
	 * @param  {Date|String|Number}       value
	 * @param  {Object}                   [options]
	 * @param  {String}                   [fallback]
	 *
	 * @return {String}
	 * @param value
	 * @param options?
	 * @param fallback?
	 * @return
	 */
	formatRelative(value : String|Date|Number, options? : Object, fallback? : string): string;

	/**
	 * Formats the number as a currency
	 *
	 * @method formatAmount
	 *
	 * @param  {Number}     value
	 * @param  {String}     currency
	 * @param  {Object}     [options]
	 * @param  {String}     [fallback]
	 *
	 * @return {String}
	 *
	 * @throws {InvalidArgumentException} If currency is missing
	 * @param value
	 * @param currency
	 * @param options?
	 * @param fallback?
	 * @return
	 */
	formatAmount(value : number, currency : string, options? : Object, fallback? : string): string;

	/**
	 * Formats a message using ICU messaging
	 * syntax
	 *
	 * @method formatMessage
	 *
	 * @param  {String}            message
	 * @param  {Object}            values
	 * @param  {Object|Array}      [formats]
	 *
	 * @return {String}
	 *
	 * @example
	 * ```js
	 * formatter
	 *   .formatMessage('Hello { username }', { username: 'virk' })
	 * ```
	 *
	 * @example
	 * ```js
	 * formatter
	 *   .formatMessage('Total { total, number, usd }', { total: 20 }, [formats.pass('usd', 'number')])
	 * ```
	 * @param message
	 * @param values
	 * @param formats?
	 * @return
	 */
	formatMessage(message : string, values : Object, formats? : Object | Array<any>): string;

	/**
	 * Returns raw message for a given key
	 *
	 * @method get
	 *
	 * @param  {String} key
	 * @param  {Mixed}  [defaultValue = null]
	 *
	 * @return {Mixed}
	 * @param key
	 * @param defaultValue?
	 * @return
	 */
	get(key : string, defaultValue? : any): any;

	/**
	 * Returns an array of locales available. This
	 * list is based of the messages defined.
	 *
	 * @method availableLocales
	 *
	 * @return {Array}
	 * @return
	 */
	availableLocales(): Array<any>;

	/**
	 * Returns a list of strings for the active
	 * locale and an optionally selected group.
	 *
	 * @method list
	 *
	 * @param  {String} [group]
	 *
	 * @return {Object}
	 * @param group?
	 * @return
	 */
	list(group? : string): Object;

	/**
	 * Returns a flat list of strings for the active
	 * locale and optionally for a group
	 *
	 * @method flatList
	 *
	 * @param  {String} [group]
	 *
	 * @return {Object}
	 * @param group?
	 * @return
	 */
	flatList(group? : string): Object;
}

/**
 * Formats is a store to set and get custom
 * formats.
 *
 * @class Formats
 * @constructor
 */
interface Formats {
	/**
	 * Reset registered format
	 *
	 * @method clear
	 *
	 * @return {void}
	 * @return
	 */
	clear(): void;

	/**
	 * Add a new custom format
	 *
	 * @method add
	 *
	 * @param  {String} name
	 * @param  {Object} options
	 *
	 * @example
	 * ```js
	 * format.add('amount', { style: 'currency' })
	 * ```
	 *
	 * @chainable
	 * @param name
	 * @param options
	 * @return
	 */
	add(name : string, options : Object): this;

	/**
	 * Get custom format by name
	 *
	 * @method get
	 *
	 * @param  {String} name
	 *
	 * @return {Object}
	 * @param name
	 * @return
	 */
	get(name : string): Object;

	/**
	 * Returns an object which can be passed to `formatMessage`
	 * in order to pass custom formats.
	 *
	 * @method pass
	 *
	 * @param  {String} format
	 * @param  {String} type
	 *
	 * @return {Object}
	 * @param format
	 * @param type
	 * @return
	 */
	pass(format : string, type : string): Object;
}

declare namespace AdonisNamespaces {
    type Command = 'Command' | 'Adonis/Src/Command'
    type Config = 'Config' | 'Adonis/Src/Config'
    type Database = 'Database' | 'Adonis/Src/Database'
    type Env = 'Env' | 'Adonis/Src/Env'
    type Event = 'Event' | 'Adonis/Src/Event'
    type Encryption = 'Encryption' | 'Adonis/Src/Encryption'
    type Exception = 'Exception' | 'Adonis/Src/Exception'
    type Factory = 'Factory' | 'Adonis/Src/Factory'
    type Hash = 'Hash' | 'Adonis/Src/Hash'
    type Helpers = 'Helpers' | 'Adonis/Src/Helpers'
    type Model = 'Model' | 'Adonis/Src/Model'
    type Lucid = 'Lucid' | 'Adonis/Src/Lucid'
    type Middleware = 'Middleware' | 'Adonis/Src/Middleware'
    type Route = 'Route' | 'Adonis/Src/Route'
    type Context = 'HttpContext' | 'Adonis/Src/HttpContext'
    type Schema = 'Schema' | 'Adonis/Src/Schema'
    type Server = 'Server' | 'Adonis/Src/Server'
    type View = 'View' | 'Adonis/Src/View'
    type Validator = 'Validator' | 'Adonis/Addons/Validator'
    type BaseExceptionHandler = 'BaseExceptionHandler' | "Adonis/Exceptions/BaseExceptionHandler"
    type Migration = 'Migration' | 'Adonis/Src/Migration'
    type Request = 'Adonis/Src/Request'
    type Response= 'Adonis/Src/Response'
    type Logger = 'Logger' | 'Adonis/Src/Logger'

    type Ws = 'Ws' | 'Adonis/Addons/Ws'
    type Redis = 'Redis' | 'Adonis/Addons/Redis'
    type Drive = 'Drive' | 'Adonis/Addons/Drive'
    type Test = 'Suite' | 'Test/Suite'
    type Antl = 'Antl' | 'Adonis/Addons/Antl'
    type AntlFormats = 'Antl/Formats' | 'Adonis/Addons/Antl/Formats'
    type DatabaseTransactions = 'DatabaseTransactions' | 'Adonis/Traits/DatabaseTransactions'
}

declare global {
    function use(namespace: string): any
    function use(namespace: AdonisNamespaces.Command): WorkInProgress
    function use(namespace: AdonisNamespaces.Config): Config
    function use(namespace: AdonisNamespaces.Database): Database
    function use(namespace: AdonisNamespaces.Env): Env
    function use(namespace: AdonisNamespaces.Event): Event
    function use(namespace: AdonisNamespaces.Encryption): Encryption
    function use(namespace: AdonisNamespaces.Exception): Exception
    function use(namespace: AdonisNamespaces.Factory): Factory
    function use(namespace: AdonisNamespaces.Hash): Hash
    function use(namespace: AdonisNamespaces.Helpers): Ignitor.Helpers
    function use(namespace: AdonisNamespaces.Lucid): WorkInProgress
    function use(namespace: AdonisNamespaces.Middleware): WorkInProgress
    function use(namespace: AdonisNamespaces.Route): Route.Manager
    function use(namespace: AdonisNamespaces.Schema): Schema
    function use(namespace: AdonisNamespaces.Server): Server
    function use(namespace: AdonisNamespaces.View): View
    function use(namespace: AdonisNamespaces.Ws): WorkInProgress
    function use(namespace: AdonisNamespaces.Validator): Validator
    function use(namespace: AdonisNamespaces.Model): Lucid.Model
    function use(namespace: AdonisNamespaces.Migration): Migration
    function use(namespace: AdonisNamespaces.Redis):Redis
    function use(namespace: AdonisNamespaces.Drive): Drive
    function use(namespace: AdonisNamespaces.Test): Suite
    function use(namespace: AdonisNamespaces.Context): Http.Context
    function use(namespace: AdonisNamespaces.Request): Http.Request
    function use(namespace: AdonisNamespaces.Response): Http.Response
    function use(namespace: AdonisNamespaces.BaseExceptionHandler): BaseExceptionHandler
    function use(namespace: AdonisNamespaces.Logger): Logger
    function use(namespace: AdonisNamespaces.Antl): Antl
    function use(namespace: AdonisNamespaces.AntlFormats): Formats
    function use(namespace: AdonisNamespaces.DatabaseTransactions): Lucid.DatabaseTransactions;

}

declare global {
    function make(namespace: AdonisNamespaces.Command): WorkInProgress
    function make(namespace: AdonisNamespaces.Config): Config
    function make(namespace: AdonisNamespaces.Database): Database
    function make(namespace: AdonisNamespaces.Env): Env
    function make(namespace: AdonisNamespaces.Event): Event
    function make(namespace: AdonisNamespaces.Encryption): Encryption
    function make(namespace: AdonisNamespaces.Exception): Exception
    function make(namespace: AdonisNamespaces.Factory): Factory
    function make(namespace: AdonisNamespaces.Hash): Hash
    function make(namespace: AdonisNamespaces.Helpers): Ignitor.Helpers
    function make(namespace: AdonisNamespaces.Lucid): WorkInProgress
    function make(namespace: AdonisNamespaces.Middleware): WorkInProgress
    function make(namespace: AdonisNamespaces.Route): Route.Manager
    function make(namespace: AdonisNamespaces.Schema): Schema
    function make(namespace: AdonisNamespaces.Server): Server
    function make(namespace: AdonisNamespaces.View): View
    function make(namespace: AdonisNamespaces.Ws): WorkInProgress
    function make(namespace: AdonisNamespaces.Validator): Validator
    function make(namespace: AdonisNamespaces.Model): Lucid.Model
    function make(namespace: AdonisNamespaces.Migration): Migration
    function make(namespace: AdonisNamespaces.Redis): Redis
    function make(namespace: AdonisNamespaces.Drive): Drive
    function make(namespace: AdonisNamespaces.Test): Suite
    function make(namespace: AdonisNamespaces.Context): Http.Context
    function make(namespace: AdonisNamespaces.Request): Http.Request
    function make(namespace: AdonisNamespaces.Response): Http.Response
    function make(namespace: AdonisNamespaces.BaseExceptionHandler): BaseExceptionHandler
    function make(namespace: AdonisNamespaces.Logger): Logger
    function make(namespace: AdonisNamespaces.Antl): Antl
    function make(namespace: AdonisNamespaces.AntlFormats): Formats
    function make(namespace: AdonisNamespaces.DatabaseTransactions): Lucid.DatabaseTransactions;

    const iocResolver : Fold.ResolverManager;
}
