const logsAPI = require('@opentelemetry/api-logs')
const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs')
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http')
const { OpenTelemetryTransportV3 } = require('@opentelemetry/winston-transport')
const { Resource } = require('@opentelemetry/resources')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const winston = require('winston')
require('dotenv').config()

  // Initialize the Logger provider
const loggerProvider = new LoggerProvider({})

const otlpExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/logs',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add processor with the OTLP exporter
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(otlpExporter))

// Set the global logger provider
logsAPI.logs.setGlobalLoggerProvider(loggerProvider)

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({
            stack: true
        }),
        winston.format.metadata(),
        winston.format.json()
    ),
    defaultMeta: {
        service: 'winston-logger',
    },
    
    transports: [
        new OpenTelemetryTransportV3({
            loggerProvider,
            logAttributes: {
                'service.name': 'winston-logger',
            },
        }),
    ],
})

module.exports = logger
