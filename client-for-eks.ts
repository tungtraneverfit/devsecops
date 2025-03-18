import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from './proto/pets'
import express, { Request, Response } from 'express'
import { Pet } from './proto/petPackage/Pet'
import axios from 'axios';
import { HealthCheckResponse } from './proto/petPackage/HealthCheckResponse';
require('dotenv').config();

const app = express()

const host = process.env.HOST
const port = process.env.ALB_PORT
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const PORT = 4006
const PROTO_FILE = './proto/pets.proto'

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE))
const grpcObj = (grpc.loadPackageDefinition(packageDef) as unknown) as ProtoGrpcType

const client = new grpcObj.marketplace.HealthCheckService(
  `${host}:${port}`,
  // grpc.credentials.createInsecure()
  grpc.credentials.createSsl()
)

const healthCheck = () => {
  const healthCheckRequest = {};

  client.healthCheck(healthCheckRequest, (error, response) => {
    if (error) {
      console.error('Health check failed:', error);
    } else {
      console.log('Health check response:', response);
    }
  });
};

const healthCheckHTTP = async () => {
  try {
    const url = 'https://grpc-dev.abc.io.vn/api/healthcheck'
    const response = await axios.get(url);
    console.log(`HTTP Health check response from ${url}:`, response.data, response.status);
  } catch (error) {
    console.error('HTTP Health check failed for', error);
  }
};

const multiHealthcheck = async () => {
  try {
    await healthCheck();
    await healthCheckHTTP();

  } catch (error) {
    console.log(error)
  }
}

// const multiHealthcheck2 = async () => {
//   try {
//     await healthCheck();
//     await healthCheckHTTP();

//   } catch (error) {
//     console.log(error)
//   }
// }

const runMultipleUploads = async () => {
  const numberOfUploads = 10000;
  const uploadPromises: Promise<void>[] = [];

  for (let i = 0; i < numberOfUploads; i++) {
    uploadPromises.push(multiHealthcheck());
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  try {
    await Promise.all(uploadPromises);
    console.log("All uploads finished");
  } catch (error) {
    console.error("Error in one or more uploads:", error);
  }
}

// run concurrency style
runMultipleUploads()

// run sleep style
// setInterval(()=>{
//   healthCheck();
//   healthCheckHTTP();
// }, 100);

app.get('/', (req: Request, res: Response) => {
  res.send('home')
})

app.listen(3000, () => [
  console.log('client running on port: ', 3000)
])
