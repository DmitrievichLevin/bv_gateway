import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import logger from 'morgan';
var compression = require('compression');
import { AppBuilder } from './builder/builder';
require('dotenv').config();

const debug = require('debug')('App.tsx');

const director = new AppBuilder();

director
  .bridge(logger, 'dev')
  // File Input as Raw Bytes For MicroService
  .bridge(express.raw, {
    type: 'multipart/form-data',
    limit: '50mb',
  })
  .bridge(express.urlencoded, { extended: false })
  .bridge(express.json)
  .bridge(compression)
  .bridge(cookieParser)
  .bridge(helmet)
  .bridge(cors, {
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    origin: true,
    credentials: true,
    exposedHeaders: [
      'Authorization',
      'Date',
      'Transfer-Encoding',
      'Content-Length',
    ],
  })
  .bridge(compression);

export { director };
