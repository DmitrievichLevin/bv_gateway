#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Module dependencies.
 */

import http from 'http';
import { director } from '../app';
import errorHandler from '../error/errorHandler';

require('dotenv').config();

const debug = require('debug')('http');

director
  .build()
  .then((app) => {
    /**
     * Get port from environment and store in Express.
     */
    const port = normalizePort(process.env.PORT || '3001');
    app.set('port', port);

    // Custom error handler
    app.use(errorHandler);

    /**
     * Create HTTP server.
     */

    const server = http.createServer(app);

    /**
     * Listen on provided port, on all network interfaces.
     */

    server.listen(port, () => {
      debug(`App listening on http://localhost:${port}`);
    });

    server.on('error', onError);
    server.on('listening', onListening);

    /**
     * Normalize a port into a number, string, or false.
     */

    function normalizePort(val: string) {
      const portNum = parseInt(val, 10);

      if (Number.isNaN(portNum)) {
        // named pipe
        return val;
      }

      if (portNum >= 0) {
        // port number
        return portNum;
      }

      return false;
    }

    /**
     * Event listener for HTTP server "error" event.
     */
    // eslint-disable-next-line no-undef
    function onError(error: NodeJS.ErrnoException) {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          debug(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          debug(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
      /**
       * Connect to MongoDB
       */
      try {
        require('../connections/mongo');
      } catch (e) {
        debug('Failed to connect to Mongo', e);
      }
    }
    return server;
  })
  .catch((err) => {
    debug(`Error starting sever`, err);
    process.exit(1);
  });
