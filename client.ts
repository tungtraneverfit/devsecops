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
const randomNumber = Math.random();

const packageDef = protoLoader.loadSync(path.resolve(__dirname, PROTO_FILE))
const grpcObj = (grpc.loadPackageDefinition(packageDef) as unknown) as ProtoGrpcType

const grpcClient = new grpcObj.marketplace.HealthCheckService(
  'devops-demo-app-dev-service:90',
  grpc.credentials.createInsecure(),
  // grpc.credentials.createSsl()
)

app.get('/demo/grpc-client', (req: Request, res: Response) => {
  try {
    const healthCheckRequest = {};
    grpcClient.healthCheck(healthCheckRequest, (error, response) => {
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

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    "random": randomNumber,
    "region": process.env.REGION
  })
})

app.get('/demo/client-healthcheck', (req: Request, res: Response) => {
  res.status(200).json({
    "random": randomNumber,
    "region": process.env.REGION
  })
})

app.get('/client-healthcheck', (req: Request, res: Response) => {
  res.status(200).json({
    "random": randomNumber,
    "region": process.env.REGION
  })
})

app.listen(3000, () => [
  console.log('client running on port: ', 3000)
])
