//module exports
declare module '@adonisjs/ignitor' {
    import { Ignitor } from "@adonisjs";
    const hooks: { before: Ignitor.Hooks, after: Ignitor.Hooks };
    const Ignitor: Ignitor;
    const Helpers: Ignitor.Helpers;
    export { hooks, Ignitor, Helpers };
}

declare module '@adonisjs/fold' {
    import { Fold } from "@adonisjs"
    const ioc : Fold.Ioc;
    const ServiceProvider : Fold.ServiceProvider;
    const registrar : Fold.Registrar;
    const resolver : Fold.Resolver;

    export { ioc, ServiceProvider, registrar, resolver }
}

declare namespace NE {
    /**
     * node-exceptions
     *
     * (c) Harminder Virk <virk@adonisjs.com>
     *
     * For the full copyright and license information, please view the LICENSE
     * file that was distributed with this source code.
    */

    /**
     * LogicalException is a netural class extend
     * the Error object.
     *
     * @class LogicalException
     */
    interface LogicalException extends Error {
        new(message: string, status?: number, code?: number, errShLink?: string): LogicalException; 
    }

    interface DomainException extends LogicalException { }
    interface InvalidArgumentException extends LogicalException { }
    interface RangeException extends LogicalException { }
    interface RuntimeException extends LogicalException { }
    interface HttpException extends LogicalException { }
}

declare module '@adonisjs/generic-exceptions' {
    interface LogicalException extends NE.LogicalException {}
    interface HttpException extends NE.HttpException {}

    interface InvalidArgumentException extends NE.InvalidArgumentException {
        /**
         * Throw an exception when there is a missing parameter
         *
         * @method missingParameter
         * @static
         *
         * @param  {String}         method
         * @param  {String}         parameterName
         * @param  {String|Number}  position
         *
         * @return {InvalidArgumentException}
         */
        missingParameter(method : string, parameterName : string, position : string | number): InvalidArgumentException;
            
        /**
         * Throw exception when the parameter received is invalid
         *
         * @method invalidParameter
         * @static
         *
         * @param  {String}         errorMessage
         * @param  {Mixed}          originalValue
         *
         * @return {InvalidArgumentException}
         */
        invalidParameter(errorMessage : string, originalValue : any): InvalidArgumentException;
            
        /**
         * Invoke instance of this class with a custom message
         * status and error code
         *
         * @method invoke
         *
         * @param  {String} message
         * @param  {Number} [status = 500]
         * @param  {String} [code = E_INVALID_ARGUMENT]
         *
         * @return {InvalidArgumentException}
         */
        invoke(message : string, status? : number, code? : string): InvalidArgumentException;
    }

    /**
     * Runtime exception is thrown when some unexpected behavior
     * is detected at rutime.
     *
     * @class RuntimeException
     */
    interface RuntimeException extends NE.RuntimeException {
        /**
         * Missing config exception is thrown when configuration
         * is not defined for a given key
         *
         * @method missingConfig
         *
         * @param  {String}      key
         * @param  {String}      configLocation
         *
         * @return {RuntimeException}
         */
        missingConfig(key : string, configLocation : string): RuntimeException;
            
        /**
         * This exception is raised when appKey is missing
         * inside the config file but required to make
         * some operation
         *
         * @method missingAppKey
         *
         * @param  {String}      provider - Name of the provider who want to use the app key
         *
         * @return {RuntimeException}
         */
        missingAppKey(provider : string): RuntimeException;
            
        /**
         * This exception is raised when environment variable
         * is not defined, but is required for app operation.
         *
         * @method missingEnvKey
         *
         * @param  {String}      environment variable name (e.g. `HOME` or `PATH`)
         *
         * @return {RuntimeException}
         */
        missingEnvKey(key : String): RuntimeException;
            
        /**
         * This exception is raised when configuration is not
         * complete for a given config file or key
         *
         * @method incompleteConfig
         *
         * @param  {Array}          missingKeys
         * @param  {String}         file
         * @param  {String}         forKey
         *
         * @return {RuntimeException}
         */
        incompleteConfig(missingKeys: Array<string>, file: string, forKey: string): RuntimeException;
            
        /**
         * Invoke instance of this class with a custom message
         * status and error code
         *
         * @method invoke
         *
         * @param  {String} message
         * @param  {Number} [status = 500]
         * @param  {String} [code = E_RUNTIME_ERROR]
         *
         * @return {RuntimeException}
         */
        invoke(message : string, status? : number, code? : string): RuntimeException;
    }

    const LogicalException: LogicalException
    const HttpException: HttpException;
    const InvalidArgumentException: InvalidArgumentException;
    const RuntimeException: RuntimeException;

    export { LogicalException, HttpException, InvalidArgumentException, RuntimeException };
}

declare module "@adonisjs/lucid/src/Exceptions" {
    import GE = require("@adonisjs/generic-exceptions");
    
    /**
     * Class to throw runtime exceptions
     * 
     * @class RuntimeException
     * @constructor
     */
    interface RuntimeException extends GE.RuntimeException{
            
        /**
         * This exception is raised when user is trying to use an
         * undefined database connection
         *
         * @method missingDatabaseConnection
         *
         * @param  {String}                  name
         *
         * @return {Object}
         */
        missingDatabaseConnection(name : string): RuntimeException;
            
        /**
         * This exception is raised when user is trying to query
         * relationships from an unsaved model instance
         *
         * @method unSavedModel
         *
         * @param  {String}     name
         *
         * @return {Object}
         */
        unSavedModel(name : string): RuntimeException;
            
        /**
         * This exception is raised when an undefined relation is
         * fetched or referenced within the code
         *
         * @method undefinedRelation
         *
         * @param  {String}          relation
         * @param  {String}          name
         *
         * @return {Object}
         */
        undefinedRelation(relation : string, name : string): RuntimeException;
            
        /**
         * This exception is raised when nested relationships are not
         * supported. `withCount` method is an example of same
         *
         * @method cannotNestRelation
         *
         * @param  {String}           relation
         * @param  {String}           parent
         * @param  {String}           method
         *
         * @return {Object}
         */
        cannotNestRelation(relation : string, parent : string, method : string): RuntimeException;

        /**
         * This exception is raised when you are trying to eagerload
         * relationship for multiple times
         *
         * @method overRidingRelation
         *
         * @param  {String}           relation
         *
         * @return {Object}
         */
        overRidingRelation(relation : string): RuntimeException;
            
        /**
         * This exception is raised when migrations are locked but
         * still someone is trying to migrate the database.
         *
         * @method migrationsAreLocked
         *
         * @param  {String}            lockTable
         *
         * @return {Object}
         */
        migrationsAreLocked(lockTable : string): RuntimeException;
    }

    /**
     * Class to lucid model related exceptions
     * 
     * @class ModelException
     * @constructor
     */
    interface ModelException extends GE.LogicalException{
        deletedInstance(name : string): ModelException;
    }

    /**
     * Exception thrown when a row is not found using
     * findOrFail style methods.
     * 
     * @class ModelNotFoundException
     * @constructor
     */
    interface ModelNotFoundException extends GE.LogicalException {
        raise(name : string): ModelNotFoundException;
    }

    /**
     * Class to throw exceptions related to model
     * relations
     * 
     * @class ModelRelationException
     * @constructor
     */
    interface ModelRelationException extends GE.LogicalException{  
        /**
         * This exception is raised when an unsupported method
         * is called on a model relation. Naturally `xxx` is
         * not a function will be thrown, but we want to
         * be more explicit that `xxx` is not a method
         * for `yyy` relation.
         *
         * @method unSupportedMethod
         *
         * @param  {String}          method
         * @param  {String}          relation
         *
         * @return {Object}
         */
        unSupportedMethod(method : string, relation : string): ModelRelationException;
            
        /**
         * This exception is raised when related model method is
         * executed for which the model needs to be persisted
         * but is not
         *
         * @method unsavedModelInstance
         *
         * @param  {String}             message
         *
         * @return {Object}
         */
        unsavedModelInstance(message : string): ModelRelationException;
            
        /**
         * Exception thrown when trying to set flags on pivot
         * model instance and when pivotModel is explicitly
         * defined
         *
         * @method pivotModelIsDefined
         *
         * @param  {String}            method
         *
         * @return {Object}
         */
        pivotModelIsDefined(method : string): ModelRelationException;
    }
    const RuntimeException: RuntimeException;
    const ModelException: ModelException;
    const ModelNotFoundException: ModelNotFoundException;
    const ModelRelationException: ModelRelationException;

    export { RuntimeException, ModelException, ModelNotFoundException, ModelRelationException };
}