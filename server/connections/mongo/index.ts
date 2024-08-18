import mongoose from 'mongoose';
require('dotenv').config();

// Enable Debugger in development ENV
mongoose.set('debug', process.env.NODE_ENV === 'development');

const debug = require('debug')('connection-mongo');

var mongoCon;

const MONGODB_URI = process.env.MONGODB_URI ?? '';

// Disable Connections if compiling routes
if (!process.env?.ROUTE_COMPILATION) {
  mongoCon = mongoose
    // Connect to DB
    .connect(MONGODB_URI, {
      serverApi: { version: '1', strict: false, deprecationErrors: true },
      dbName: process.env.MONGODB_NAME,
    })
    .then((con) => {
      debug('Connected to Mongo');
      return con;
    });
}

export default mongoCon;
