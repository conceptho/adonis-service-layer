import { Redis, Fold } from "@adonisjs";
//https://github.com/helnokaly/adonis-cache
declare namespace Cache {
    interface Repository {
        /**
         * 
         * @param store 
         * @return  
         */
        new(store: any): Repository;

        /**
         * Set the event dispatcher instance.
         * 
         * @param  {Adonis/Src/Event}  events
         * @return {void}
         * @param events 
         * @return  
         */
        setEventDispatcher(events: Event): void;

        /**
         * Determine if an item exists in the cache.
         * 
         * @param  {string}  key
         * @return {Promise<boolean>}
         * @param key 
         */
        has(key: string): Promise<boolean>;

        /**
         * Retrieve an item from the cache by key.
         * 
         * @param  {string}  key
         * @param  {mixed}   defaultValue
         * @return {Promise<mixed>}
         * @param key 
         * @param defaultValue 
         */
        get(key: string, defaultValue?: any): Promise<any>;

        /**
         * Retrieve multiple items from the cache by key.
         * 
         * Items not found in the cache will have a null value.
         * 
         * @param  {Array<string>}  keys
         * @return {Promise<object>}
         * @param keys 
         */
        many(keys: Array<string>): Promise<object>;

        /**
         * Retrieve an item from the cache and delete it.
         * 
         * @param  {string}  key
         * @param  {mixed}   default
         * @return {Promise<mixed>}
         * @param key 
         * @param defaultValue 
         */
        pull(key: string, defaultValue?: any): Promise<any>;

        /**
         * Store an item in the cache.
         * 
         * @param  {string}          key
         * @param  {mixed}           value
         * @param  {Date|float|int}  minutes
         * @return {Promise<void>}
         * @param key 
         * @param value 
         * @param minutes 
         */
        put(key: string, value: any, minutes?: Date | number): Promise<void>;

        /**
         * Store multiple items in the cache for a given number of minutes.
         * 
         * @param  {object}  values
         * @param  {Date|float|int}  minutes
         * @return {Promise<void>}
         * @param values 
         * @param minutes 
         */
        putMany(values: object, minutes: Date | number): Promise<void>;

        /**
         * Store an item in the cache if the key does not exist.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @param  {DateTime|float|int}  minutes
         * @return {Promise<boolean>}
         * @param key 
         * @param value 
         * @param minutes 
         * @return  
         */
        add(key: string, value: any, minutes: Date | number): Promise<boolean>;

        /**
         * Increment the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {int}  value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         */
        increment(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Decrement the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}  value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         */
        decrement(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Store an item in the cache indefinitely.
         * 
         * @param   {string}  key
         * @param   {mixed}   value
         * @return  {void}
         * @param key 
         * @param value 
         * @return  
         */
        forever(key: string, value: any): Promise<void>;

        /**
         * Get an item from the cache, or store the default value.
         * 
         * @param  {string}          key
         * @param  {Date|float|int}  minutes
         * @param  {function}          closure
         * @return {Promise<mixed>}
         * @param key 
         * @param minutes 
         * @param closure 
         */
        remember(key: string, minutes: Date | number, closure: Function): Promise<any>;

        /**
         * Get an item from the cache, or store the default value forever.
         * 
         * @param  {string}          key
         * @param  {function}        closure
         * @return {Promise<mixed>}
         * @param key 
         * @param closure 
         */
        sear(key: string, closure: Function): Promise<any>;

        /**
         * Get an item from the cache, or store the default value forever.
         * 
         * @param  {string}    key
         * @param  {function}  closure
         * @return {Promise<mixed>}
         * @param key 
         * @param closure 
         */
        rememberForever(key: string, closure: Function): Promise<any>;

        /**
         * Remove an item from the cache.
         * 
         * @param  {string}  key
         * @return {Promise<boolean>}
         * @param key 
         */
        forget(key: string): Promise<boolean>;

        /**
         * Begin executing a new tags operation if the store supports it.
         * 
         * @param  {Array<string>}  names
         * @return {TaggedCache}
         * 
         * @throws {BadMethodCallException}
         * @param names 
         * @return  
         */
        tags(names: Array<string>): TaggedCache;

        /**
         * Format the key for a cache item.
         * 
         * @param  {string}  key
         * @return {Promise<string>}
         * @param key 
         * @return  
         */
        _itemKey(key: string): Promise<string>;

        /**
         * Remove all items from the cache.
         * 
         * @return {Promise<void>}
         */
        flush(): Promise<void>;

        /**
         * Get the cache store implementation.
         * 
         * @return {Store}
         * @return  
         */
        getStore(): any;
    }

    interface DatabaseStore {
        /**
         * 
         * @param connection 
         * @param tableName 
         * @param prefix 
         */
        new(connection: any, tableName: string, prefix: string): DatabaseStore;

        /**
         * Retrieve an item from the cache by key.
         * 
         * @param  {string} key
         * @return {Promise<mixed>}
         * @param key 
         */
        get(key: string): Promise<any>;

        /**
         * Retrieve multiple items from the cache by key.
         * 
         * Items not found in the cache will have a null value.
         * 
         * @param  {Array<string>}  keys
         * @return {Promise<object>}
         * @param keys 
         * @return  
         */
        many(keys: Array<string>): Promise<object>;

        /**
         * Store an item in the cache for a given number of minutes.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @param  {int}     minutes
         * @return {Promise<void>}
         * @param key 
         * @param value 
         * @param minutes 
         */
        put(key: string, value: any, minutes?: number): Promise<void>;

        /**
         * Store multiple items in the cache for a given number of minutes.
         * 
         * @param  {object}  values
         * @param  {int}     minutes
         * @return {Promise<void>}
         * @param object 
         * @param minutes 
         */
        putMany(object: any, minutes: any): Promise<void>;

        /**
         * Increment the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         * @return  
         */
        increment(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Decrement the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         * @return  
         */
        decrement(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Store an item in the cache indefinitely.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<void>}
         * @param key 
         * @param value 
         */
        forever(key: string, value: any): Promise<void>;

        /**
         * Remove an item from the cache.
         * 
         * @param  {string}  key
         * @return {Promise<boolean>}
         * @param key 
         * @return  
         */
        forget(key: string): Promise<boolean>;

        /**
         * Remove all items from the cache.
         * 
         * @return {Promise<void>}
         */
        flush(): Promise<void>;

        /**
         * Get the underlying database connection.
         * 
         * @return {Object} database connection
         * @return  
         */
        getConnection(): Object;

        /**
         * Get the cache key prefix.
         * 
         * @return {string}
         * @return  
         */
        getPrefix(): string;
    }

    /**
     * 
     */
    interface TagSet {

        /**
         * 
         * @param store 
         * @param names 
         * @return  
         */
        new(store: any, names: Array<string>): TagSet;

        /**
         * Reset all tags in the set.
         * 
         * @return {Promise<void>}
         */
        reset(): Promise<void>;

        /**
         * Get the unique tag identifier for a given tag.
         * 
         * @param  {string}  name
         * @return {Promise<string>}
         * @param name 
         */
        tagId(name: string): Promise<string>;

        /**
         * Get a unique namespace that changes when any of the tags are flushed.
         * 
         * @return {Promise<string>}
         */
        getNamespace(): Promise<string>;

        /**
         * Reset the tag and return the new tag identifier.
         * 
         * @param  {string}  name
         * @return {Promise<string>}
         * @param name 
         */
        resetTag(name: string): Promise<string>;

        /**
         * Get the tag identifier key for a given tag.
         * 
         * @param  {string}  name
         * @return {string}
         * @param name 
         * @return  
         */
        tagKey(name: string): string;

        /**
         * Get all of the tag names in the set.
         * 
         * @return {array}
         * @return  
         */
        getNames(): Array<string>;
    }

    interface TaggableStore {
        /**
         * Begin executing a new tags operation.
         *
         * @param  {array|mixed}  names
         * @return {TaggedCache}
         */
        tags(names: Array<string> | string): TaggedCache;
    }

    interface TaggedCache {
        /**
         * 
         * @param store 
         * @param tags 
         * @return  
         */
        new(store: any, tags: TagSet): TaggedCache;

        /**
         * Increment the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<void>}
         * @param key 
         * @param value 
         */
        increment(key: string, value?: 1): Promise<void>;

        /**
         * Increment the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<void>}
         * @param key 
         * @param value 
         */
        decrement(key: string, value?: 1): Promise<void>;

        /**
         * Remove all items from the cache.
         * 
         * @return {Promise<void>}
         */
        flush(): Promise<void>;

        /**
         * Get a fully qualified key for a tagged item.
         * 
         * @param  {string}  key
         * @return {Promise<string>}
         * @param key 
         * @return  
         */
        taggedItemKey(key: string): Promise<string>;
    }

    interface NullStore extends TaggableStore {
        new(): NullStore;

        /**
         * Retrieve an item from the cache by key.
         * 
         * @param  {string}  key
         * @return {Promise<mixed>}
         * @param key 
         */
        get(key: string): Promise<any>;

        /**
         * Retrieve multiple items from the cache by key.
         * 
         * Items not found in the cache will have a null value.
         * 
         * @param  {Array<string>}  keys
         * @return {Promise<object>}
         * @param keys 
         * @return  
         */
        many(keys: Array<string>): Promise<object>;

        /**
         * Store an item in the cache for a given number of minutes.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @param  {float|int}  minutes
         * @return {Promise<void>}
         * @param key 
         * @param value 
         * @param minutes 
         */
        put(key: string, value: any, minutes: Date | number): Promise<void>;

        /**
         * Store multiple items in the cache for a given number of minutes.
         * 
         * @param  {object}  object
         * @param  {int}     minutes
         * @return {Promise<void>}
         * @param object 
         * @param minutes 
         */
        putMany(object: Object, minutes: Date | number): Promise<void>;

        /**
         * Increment the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         * @return  
         */
        increment(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Decrement the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         * @return  
         */
        decrement(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Store an item in the cache indefinitely.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<void>}
         * @param key 
         * @param value 
         */
        forever(key: string, value: any): Promise<void>;

        /**
         * Remove an item from the cache.
         * 
         * @param  {string}  key
         * @return {Promise<boolean>}
         * @param key 
         * @return  
         */
        forget(key: string): Promise<boolean>;

        /**
         * Remove all items from the cache.
         * 
         * @return {Promise<void>}
         */
        flush(): Promise<void>;

        /**
         * Get the cache key prefix.
         * 
         * @return {string}
         * @return  
         */
        getPrefix(): string;
    }

    interface ObjectStore {
        /**
         * 
         */
        new(): ObjectStore;

        /**
         * Retrieve an item from the cache by key.
         * 
         * @param  {string} key
         * @return {Promise<mixed>}
         * @param key 
         */
        get(key: string): Promise<any>;

        /**
         * Retrieve multiple items from the cache by key.
         * 
         * Items not found in the cache will have a null value.
         * 
         * @param  {Array<string>}  keys
         * @return {Promise<object>}
         * @param keys 
         * @return  
         */
        many(keys: Array<string>): Promise<object>;

        /**
         * Store an item in the cache for a given number of minutes.
         * 
         * @param  {string}  key
         * @param  {mixed}     value
         * @param  {int}     minutes
         * @return {Promise<void>}
         * @param key 
         * @param value 
         * @param minutes 
         * @return  
         */
        put(key: string, value: any, minutes?: number): Promise<void>;

        /**
         * Store multiple items in the cache for a given number of minutes.
         * 
         * @param  {object}  object
         * @param  {int}     minutes
         * @return {Promise<void>}
         * @param object 
         * @param minutes 
         * @return  
         */
        putMany(object: any, minutes: any): Promise<void>;

        /**
         * Increment the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         * @return  
         */
        increment(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Decrement the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         * @return  
         */
        decrement(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Store an item in the cache indefinitely.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<void>}
         * @param key 
         * @param value 
         * @return  
         */
        forever(key: string, value: any): Promise<void>;

        /**
         * Remove an item from the cache.
         * 
         * @param  {string}  key
         * @return {Promise<boolean>}
         * @param key 
         * @return  
         */
        forget(key: string): Promise<boolean>;

        /**
         * Remove all items from the cache.
         * 
         * @return {Promise<void>}
         * @return  
         */
        flush(): Promise<void>;

        /**
         * Get the cache key prefix.
         * 
         * @return string
         * @return  
         */
        getPrefix(): string;
    }

    interface RedisTaggedCache extends TaggedCache {
        new(): RedisTaggedCache;

        /**
         * Store an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @param  {Date|float|int}  minutes
         * @return {Promise<void>}
         * @param key 
         * @param value 
         * @param minutes 
         */
        put(key: string, value: any, minutes?: Date | number): Promise<void>;

        /**
         * Store an item in the cache indefinitely.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<void>}
         * @param key 
         * @param value 
         */
        forever(key: string, value: any): Promise<void>;

        /**
         * Remove all items from the cache.
         * 
         * @return {Promise<void>}
         */
        flush(): Promise<void>;
    }

    interface RedisStore {
        /**
         * 
         * @param Redis 
         * @param prefix 
         * @param connection 
         */
        new(Redis: Redis, prefix: string, connection: any): RedisStore;

        /**
         * Retrieve an item from the cache by key.
         * 
         * @param  {string} key
         * @return {Promise<mixed>}
         * @param key 
         */
        get(key: string): Promise<any>;

        /**
         * Retrieve multiple items from the cache by key.
         * 
         * Items not found in the cache will have a null value.
         * 
         * @param  {Array<string>}  keys
         * @return {Promise<array>}
         * @param keys 
         * @return  
         */
        many(keys: Array<string>): Promise<Array<any>>;

        /**
         * Store an item in the cache for a given number of minutes.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @param  {int}     minutes
         * @return {Promise<void>}
         * @param key 
         * @param value 
         * @param minutes 
         */
        put(key: string, value: any, minutes?: Date | number): Promise<void>;

        /**
         * Store multiple items in the cache for a given number of minutes.
         * 
         * @param  {object}  object
         * @param  {int}     minutes
         * @return {Promise<void>}
         * @param object 
         * @param minutes 
         */
        putMany(object: Object, minutes: Date | number): Promise<void>;

        /**
         * Increment the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         * @return  
         */
        increment(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Decrement the value of an item in the cache.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<int|boolean>}
         * @param key 
         * @param value 
         * @return  
         */
        decrement(key: string, value?: 1): Promise<number | boolean>;

        /**
         * Store an item in the cache indefinitely.
         * 
         * @param  {string}  key
         * @param  {mixed}   value
         * @return {Promise<void>}
         * @param key 
         * @param value 
         */
        forever(key: string, value: any): Promise<void>;

        /**
         * Remove an item from the cache.
         * 
         * @param  {string}  key
         * @return {Promise<boolean>}
         * @param key 
         * @return  
         */
        forget(key: string): Promise<boolean>;

        /**
         * Remove all items from the cache.
         * 
         * @return {Promise<void>}
         */
        flush(): Promise<void>;

        /**
         * Begin executing a new tags operation.
         * 
         * @param  array|mixed  $names
         * @return {RedisTaggedCache}
         * @param names 
         * @return  
         */
        tags(names: Array<string> | string): RedisTaggedCache;

        /**
         * Get the Redis connection instance
         * 
         * @return {Object}
         * @return  
         */
        connection(): Object;

        /**
         * Set the connection name to be used
         * 
         * @param {string} connection
         * @return {void}
         * @param connection 
         * @return  
         */
        setConnection(connection: string): void;

        /**
         * Get the Redis database instance
         * 
         * @return {object}
         * @return  
         */
        getRedis(): Redis;

        /**
         * Get the cache key prefix
         * 
         * @return {string}
         * @return  
         */
        getPrefix(): string;

        /**
         * Set the cache key prefix
         * 
         * @param {string} prefix
         * @return {void}
         * @param prefix 
         * @return  
         */
        setPrefix(prefix: string): void;
    }

    interface CacheManager {
        new(app: Fold.Ioc): CacheManager;

        /**
         * Get a cache store instance by name.
         * 
         * @param  {string|null}  name
         * @return {mixed}
         * @param name 
         * @return  
         */
        store(name: string): any;
        store(name: "database"): DatabaseStore;
        store(name: "null"): NullStore;
        store(name: "object"): ObjectStore;
        store(name: "redis"): RedisStore;

        /**
         * Get a cache driver instance.
         * 
         * @param  {string}  driver
         * @return {mixed}
         * @param driver 
         * @return  
         */
        driver(driver: string): any;

        /**
         * Create an instance of the Null cache driver.
         * 
         * @return {Repository}
         * @private
         * @return  
         */
        _createNullDriver(): Repository;

        /**
         * Create an instance of the object cache driver.
         * 
         * @return {Repository}
         * @private
         * @return  
         */
        _createObjectDriver(): Repository;

        /**
         * Create an instance of the Redis cache driver.
         * 
         * @param  {object}  config
         * @return {Repository}
         * @private
         * @param config 
         * @return  
         */
        _createRedisDriver(config: object): Repository;

        /**
         * Create an instance of the database cache driver.
         * 
         * @param  {object}  config
         * @return {Repository}
         * @private
         * @param config 
         * @return  
         */
        _createDatabaseDriver(config: object): Repository;

        /**
         * Create a new cache repository with the given implementation.
         * 
         * @param  {Store}  store
         * @return {Repository}
         * @param store 
         * @return  
         */
        repository(store: any): Repository;

        /**
         * Get the cache prefix.
         * 
         * @param  {object}  config
         * @return {string}
         * @private
         * @param config 
         * @return  
         */
        _getPrefix(config: object): string;

        /**
         * Get the cache connection configuration.
         * 
         * @param  {string}  name
         * @return {object}
         * @private
         * @param name 
         * @return  
         */
        _getConfig(name: string): object;

        /**
         * Get the default cache driver name.
         * 
         * @return {string}
         * @return  
         */
        getDefaultDriver(): string;

        /**
         * Set the default cache driver name.
         * 
         * @param  {string}  name
         * @return {void}
         * @param name 
         * @return  
         */
        setDefaultDriver(name: string): void;

        /**
         * Register a custom driver creator Closure.
         * 
         * @param  {string}    driver
         * @param  {function}  closure
         * @return {this}
         * @param driver 
         * @param closure 
         * @return  
         */
        extend(driver: string, closure: Function): this;
    }
}

type Cache = Cache.CacheManager & Cache.Repository;

declare namespace AdonisNamespaces {
    type Cache = 'Cache' | 'Adonis/Addons/Cache';
}

declare global {
    function use(namespace: AdonisNamespaces.Cache): Cache
    function make(namespace: AdonisNamespaces.Cache): Cache
}
