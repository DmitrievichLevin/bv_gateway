const { redis } = require('../index');
import { v4 as uuidv4 } from 'uuid';
import { ResourceCache, ResourceData, SetResponse } from '../cache.interface';
import { DisconnectAll } from '..';

require('dotenv').config();

/**
 * Rules:
 * Each hash points to id!
 * Auto-set bearer token hash
 *
 * Auth Caching
 * hashes = [token, email, id]
 *
 *
 * 1. Check cache for pointer to data [...hashes] -> id -> data
 *      - Not Found:
 *          . set in reverse data : id : email
 *          . return data from db lookup
 *      - Found:
 *          . return cached data
 */

afterAll(() => {
  // Close Redis Clients
  return DisconnectAll();
});

describe('Cache Interface Tests', () => {
  // Test Data
  var testCollection = 'tests';
  var testObjs: any = [
    ['jack', 'pizza'],
    ['jill', 'eggs'],
  ].map(([name, food]) => ({ id: uuidv4(), name, favFood: food }));

  // Cache Controller Instance
  const Cache = new ResourceCache(
    redis,
    testCollection,
    ['name', 'favFood'],
    3
  );

  describe('Set Record(s)', () => {
    test('Successful SET records returns records', async () => {
      await Promise.all(testObjs.map((item: any) => Cache.__set(item))).then(
        (setRecords) => {
          // Resolved success responses
          var successResponse: Array<SetResponse> = testObjs.map(
            (item: ResourceData) => [null, item]
          );
          expect(setRecords).toEqual(successResponse);
        }
      );
    });

    test('Unsuccessful SET missing field(s): id', async () => {
      var badData = { name: 'john', favFood: 'apples' };
      await Cache.__set(badData).then((value) => {
        expect(value).toEqual([
          { message: 'Resource is missing field(s): id' } as Error,
          null,
        ]);
      });
    });
  });

  describe('GET Record(s)', () => {
    describe('GET Record(s) using Top-Level-Key: id', () => {
      test('Successful GET using id', async () => {
        await expect(Cache.__get({ id: testObjs[0].id })).resolves.toEqual(
          JSON.stringify(testObjs[0])
        );
      });
    });

    // GET Records after cache SET
    describe('Get Record(s) using hash', () => {
      test('Successful record get', async () => {
        await expect(Cache.__get({ name: 'jill' })).resolves.toEqual(
          JSON.stringify(testObjs[1])
        );
      });

      test('GET using unknown hash', async () => {
        await Cache.__get({ soda: 'Cola' }).then((value) => {
          expect(value).toBeNull();
        });
      });

      test('GET Expired Record', async () => {
        await new Promise((resolve) => {
          var to = setTimeout(() => {
            resolve({ name: 'jill' });
            to.unref();
          }, 4000);
        })
          .then((query) => Cache.__get(query as ResourceData))
          .then((data) => {
            expect(data).toBeUndefined();
          });
      });
    });
  });
});
