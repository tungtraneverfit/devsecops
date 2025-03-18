import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { ProtoGrpcType } from './proto/pets'
import express, { Request, Response } from 'express'
import { Pet } from './proto/petPackage/Pet'
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
  'grpc-template-dev.abc.io:8443',
  // grpc.credentials.createInsecure(),
  grpc.credentials.createSsl()
)

app.get('/healthCheck', (req: Request, res: Response) => {
  try {
    const healthCheckRequest = {};
    client.healthCheck(healthCheckRequest, (error, response) => {
      if (error) {
        console.error('Health check failed:', error);
      } else {
        console.log('Health check response:', response);
        res.status(200).json({
          msg: 'get all success',
          data: response
        })
      }
    });
  } catch (error: any) {
    res.status(500).json(error.message)
  }
})

const healthCheckHTTP = async () => {
  try {
    const url = 'https://grpc-dev.abc.io.vn/api/healthcheck'
    const response = await axios.get(url);
    console.log(`HTTP Health check response from ${url}:`, response.data, response.status);
  } catch (error) {
    console.error('HTTP Health check failed for', error);
  }
};

app.get('/', (req: Request, res: Response) => {
  res.send('home')
})

app.listen(3000, () => [
  console.log('client running on port: ', 3000)
])
