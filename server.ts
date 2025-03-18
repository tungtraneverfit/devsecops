import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import { Empty } from './proto/petPackage/Empty'
import { PetList } from './proto/petPackage/PetList'
import { ProtoGrpcType } from './proto/pets'
import { PetServiceHandlers } from './proto/petPackage/PetService'
import { Pet } from './proto/petPackage/Pet'
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import http from 'http';
import { HealthCheckResponse } from './proto/petPackage/HealthCheckResponse';
import winston from 'winston';
import { trace, context, Span, SpanContext } from '@opentelemetry/api';
const logger = require('./logger')

const app = express()
const tracer = trace.getTracer('healthcheck-tracer');

const PORT = 4006
const PROTO_FILE = './proto/pets.proto'
const randomNumber = Math.random();

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE))
const grpcObj = (grpc.loadPackageDefinition(packageDef) as unknown) as ProtoGrpcType
// const petPackage = grpcObj.petPackage
const marketplace = grpcObj.marketplace

let serverStartTime;
serverStartTime = new Date();
const serverStart = serverStartTime ? serverStartTime.toISOString() : null;

const server = new grpc.Server(app)
const pets = [
  { id: '1', name: 'Alaska', description: 'Description 1' },
  { id: '2', name: 'Husky', description: 'Description 2' }
]

const petList: PetList = {
  pets
}

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(`Your server as started on port ${port}`);
    server.start()
  })

server.addService(marketplace.HealthCheckService.service, {
  healthCheck: (call: grpc.ServerUnaryCall<Empty, HealthCheckResponse>, callback: any) => {
    // logger.info('grpc healthcheck');
    callback(null, { status: 'this is response from grpc server' });
  },
})

const httpServer = http.createServer(app);

httpServer.listen(4005, () => {
  serverStartTime = new Date();
  // logger.info(randomNumber)
  logger.info('HTTP Server running on port 4005');
});

app.get('/demo/healthcheck', (req, res) => {
  const currentTime = new Date().toISOString();

  // start span
  tracer.startActiveSpan('healthcheck-span', (span: any) => {
    // write trace log (event) to span
    span.addEvent('Healthcheck API hit', {
      timestamp: new Date().toISOString(),
    });

    // Write trace attribute to span
    span.setAttribute('log.message', 'app healthcheck');
    span.addEvent('Logging completed');

    res.json({
      "msg": "socket v1",
      "random": randomNumber,
      "app_region": process.env.APP_REGION,
      "app_name": process.env.APP_NAME,
      "current_time": currentTime,
      "server_start_time": serverStart,
    });

    // End span
    span.end();
  });
});

async function retrieveNumber(index: number) {
  return tracer.startActiveSpan("retrieve number", async span => {
    span.setAttribute("app.numbers.index", index);
    // activities that also create spans
    const result = 5// and they set the result
    span.end();
    return result;
  });
}

// demo otel trace
app.get('/demo/hello-trace', async (req, res) => {
  const currentTime = new Date().toISOString();
  const number = await retrieveNumber(5);
  logger.info('Hello trace');
  const number2 = await retrieveNumber(6);
  res.json({
    "msg": "socket v1",
    "random": randomNumber,
    "app_region": process.env.APP_REGION,
    "app_name": process.env.APP_NAME,
    "current_time": currentTime,
    "server_start_time": serverStart,
    "number": number,
    "number2": number2
  });
});


app.get('/demo/apm-test', (req, res) => {
  const currentTime = new Date().toISOString();

  // Start a span
  tracer.startActiveSpan('apm-span', (span: any) => {
    logger.info('Amp API called');
    console.log('Log from console: Amp API called');
    // write trace log (event) to span
    span.addEvent('apm API hit', {
      timestamp: new Date().toISOString(),
    });

    span.setAttribute('log.message', 'app test trace');
    span.addEvent('Logging completed');

    res.json({
      "msg": "socket v1",
      "random": randomNumber,
      "app_region": process.env.APP_REGION,
      "app_name": process.env.APP_NAME,
      "current_time": currentTime,
      "server_start_time": serverStart,
    });

    // End span
    span.end();
  });
});


app.get('/healthcheck', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log("app healthcheck");
  res.json({
    "msg": "socket v1",
    "random": randomNumber,
    "app_region": process.env.APP_REGION,
    "app_name": process.env.APP_NAME,
    "current_time": currentTime,
    "server_start_time": serverStart
  });
});

app.get('/demo/stickiness', (req, res) => {
  const currentTime = new Date().toISOString();

  res.json({
    "random": randomNumber,
    "app_region": process.env.APP_REGION,
    "app_name": "stickiness function",
  });
});

app.get('/demo/ready', (req, res) => {
  console.log("socket ready");
  res.json({
    "msg": "socket ready"
  });
});

// API shutdown
app.get('/demo/kill-me', (req, res) => {
  console.log("socket shutdown");
  res.json({
    "msg": "socket shutdown"
  });
  process.exit(0);
});

app.get('/demo/grpc-server', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log("socket healthcheck");
  res.json({
    "msg": "hello iam grpc server",
  });
});

app.get('/demo/grpc-server/healthcheck', (req, res) => {
  const currentTime = new Date().toISOString();
  console.log("socket healthcheck");
  res.json({
    "random": randomNumber,
    "app_region": process.env.APP_REGION,
    "app_name": "grpc server",
    "current_time": currentTime,
    "server_start_time": serverStart
  });
});



// Add more routes here to apm-demo, logging, and error handling

app.use((req, res, next) => {
  const requestId = uuidv4();

  logger.info({
    message: 'Incoming Request',
    method: req.method,
    path: req.path,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.on('finish', () => {
    logger.info({
      message: 'Request Processed',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    });
  });

  next();
});

//Debug Logging - Use debug logging during development for troubleshooting:
app.get('/apm-demo/debug', (req, res) => {
  try {
    logger.debug({
      message: 'Accessing root endpoint',
    });

    // Route logic...
  } catch (error) {
    logger.error({
      message: 'Error in root endpoint',
    });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Warning Logging - Log non-critical issues that require attention:
app.get('/apm-demo/warning', (req, res) => {
  logger.warn({
    message: '404 Route Accessed',
  });

  res.status(404).json({
    error: 'Not Found',
  });
});

// Error Logging - Capture and log critical errors with full context:
app.get('/amp-demo/error', (req, res) => {
  try {
    throw new Error('Authentication Failed');
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        message: 'User Authentication Error',
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.error({
        message: 'Unknown error occurred',
        error: String(error),
      });
    }

    res.status(401).json({
      error: 'Unauthorized',
    });
  }
});
