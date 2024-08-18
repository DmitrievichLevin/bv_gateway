import { Redis as RedisType } from 'ioredis';
import { isProd } from '../../constants';
require('dotenv').config();

const Redis = require('ioredis');

const mainDebug = require('debug')('redis-main');
const subDebug = require('debug')('redis-subscribed');

/**
 * Publish Channel
 */
var redisClient: RedisType;

/**
 * Subscribe Channel
 */
var redisSubscribed: RedisType;

// Disable Connections if compiling routes
if (!process.env?.ROUTE_COMPILATION) {
  const redisCreds = isProd
    ? {
        host: 'your-redis-server-hostname',
        port: 'your-redis-server-port',
        password: 'your-redis-password', // If applicable
      }
    : undefined;

  redisClient = new Redis(redisCreds);
  redisSubscribed = new Redis(redisCreds);

  redisClient.on('ready', () => {
    // configure keyspaces event and specify expiring events with "Ex"
    redisClient.config('SET', 'notify-keyspace-events', 'Ex');

    // subscribe to the
    redisSubscribed.subscribe('__keyevent@0__:expired');

    // listen for expiring event messages
    redisSubscribed.on('message', async (channel, message) => {
      subDebug(`Expired Key Event: ${message}`);

      // retrieve key and value from shadowkey
      const [key, value] = message.split(':');
      /**
       * Maybe?
       * Atomicity in deleting record + pointers
       * Link - (https://stackoverflow.com/questions/59600698/an-alternative-to-redis-transactions-for-atomicity-in-node)
       */
      var record = await redisClient.get(message);

      if (record) {
        // Child Keys
        var children = JSON.parse(record).__children;

        var multi = redisClient.multi();

        // Iterate multi Del
        children.forEach((item: string) => multi.hdel(key, item));

        // Execute multi del
        multi.exec(function (err, _) {
          /**
           * If err is null, it means Redis successfully attempted
           * the operation.
           */

          if (err) {
            subDebug(`DEL Error: ${message} -> children ${err}`);
          } else {
            subDebug(`DEL Success: ${message} -> children`);
          }
        });
      }
    });
  });
}

/**
 * Disconnect Redis Clients
 * - main
 * - subscribed
 */
const DisconnectAll = async () => {
  await redisClient.disconnect();
  await redisSubscribed.disconnect();
  mainDebug('Disconnected Redis Clients.');
};

export { redisClient as redis, DisconnectAll };
