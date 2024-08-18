import dayjs from 'dayjs';
import debug, { Debug, Debugger } from 'debug';
import { Redis } from 'ioredis';

import { RedisClient } from 'ioredis/built/connectors/SentinelConnector/types';

export type ResourceData = { [key: string]: string | number | Buffer };
export type CachingError = Error;
export type SetResponse = [CachingError | null, ResourceData | null];
export type SetCache = (data: ResourceData) => Promise<SetResponse>;

/**
 * User Data = Protected
 * @todo - extend resource cache
 * - Authentication Caching
 * - User Document Caching
 */

/**
 * Redis Snapshot:
 *
 * test:{id}
 */

/**
 * @param RedisClient - redis
 * @param collection - string
 * @param hashes - string[]
 *
 */
class ResourceCache {
  constructor(
    client: Redis,
    collection: string,
    hashes: string[],
    TTL: number = 300
  ) {
    this.client = client;
    this.hashes = [...hashes, ...this.hashes];
    this.collection = collection;
    this.TTL = TTL;
    this.debug = require('debug')(`${collection}-cache`);
  }

  /**
   * Check Object for available hashes
   * @param obj ResourceData
   * @returns string[]
   */
  __hashesPresent(obj: ResourceData): string[] {
    return this.hashes.reduce((list: string[], hash: string) => {
      if (obj?.[hash]) list.push(obj[hash] as string);

      return list;
    }, []);
  }

  // Retrieve from cache
  __get = (params: ResourceData) =>
    new Promise(async (resolve) => {
      try {
        let found;
        if (params?.id) {
          found = await this.client
            .get(`${this.collection}:${params?.id}`)
            .then((rec) => {
              if (rec) {
                // Remove Redis Records Children
                return rec?.replace(/,\"__children.+"]/g, '');
              } else {
                null;
              }
            });
        } else {
          let childKeys: string[] = this.__hashesPresent(params);

          for (var i = 0; i < childKeys.length; i += 1) {
            // Attempt to locate record hash -> Callback(id) -> record
            found = this.client
              .hget(this.collection, childKeys[i])
              .then(async (topKey) => {
                if (topKey) {
                  var record = await this.client.get(topKey);
                  // Remove Redis Records Children
                  return record?.replace(/,\"__children.+"]/g, '');
                } else {
                  return null;
                }
              })
              .then((data) => data);

            // Break loop on record found;
            if (found) {
              found;
              break;
            }
          }
        }

        resolve(found ?? null);
      } catch (cacheGetError) {
        // Fault Tolerant: Default to DB query
        this.debug(`Error getting record from cache ${cacheGetError}`);
        resolve(null);
      }
    });

  // Add to cache After DB fetch
  __set: SetCache = (data: ResourceData) =>
    new Promise(async (resolve) => {
      let childKeys: string[] = this.__hashesPresent(data);

      var id = data?.id;

      if (!id) {
        resolve([
          { message: 'Resource is missing field(s): id' } as Error,
          null,
        ]);
      } else {
        // Top Level Key(Primary)
        let topLevelKey: string = `${this.collection}:${id}`;

        try {
          this.client
            .set(
              topLevelKey,
              JSON.stringify({ ...data, __children: childKeys })
            )
            // Top-Level TTL w/ Callback
            .then((_) => {
              this.debug(
                `${topLevelKey} expires at ${dayjs()
                  .add(this.TTL, 'seconds')
                  .format('MM/DD/YYYY hh:mm:ss a')}`
              );
              return this.client.expire(topLevelKey, this.TTL);
            })
            /**
             * Child Keys
             * @param string SetName/collection
             * @param string - hash
             * - HSET
             * - Points to ID(where resource lives).
             */
            .then((_) => {
              var multi = this.client.multi();

              childKeys.forEach((key) =>
                multi.hset(this.collection, key, topLevelKey)
              );

              return multi.exec((err, _) => {
                if (err) throw err;
              });
            })
            // Return Data from promise to send in response
            .then(() => {
              resolve([null, data]);
              this.debug(`${this.collection}-Cache -> Child: H/SET Success.`);
            });
        } catch (cachingErr) {
          // Clean up if failure occurs
          this.client.del(topLevelKey);

          // Return data for fault tolerance and error for debuging.
          resolve([cachingErr.message, data]);

          // Log for debugging
          this.debug(
            `${this.collection}-Cache -> Child: H/SET error ${cachingErr}`
          );
        }
      }
    });

  // Redis Client
  client: Redis;

  // Collection = key;
  collection: string;

  /**
   * Redis Record TTL
   * @default 6mins
   */
  TTL: number = 300;

  /**
   * Child Keys(hashes)
   * child-key -> collection+id -> record
   */
  hashes: string[] = [];

  // Scoped Debugging Collection Caches
  debug: Debugger;
}

export { ResourceCache };
