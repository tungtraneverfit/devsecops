const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { Resource } = require('@opentelemetry/resources'); // Import Resource
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions'); // Semantic attributes

require('dotenv').config();

const serviceName = process.env.APP_NAME || 'example-app';
const serviceVersion = process.env.SERVICE_VERSION || '1.0.2';
const deploymentEnvironment = process.env.APP_ENV || 'dev';
const traceExporterUrl = process.env.OTEL_EXPORTER_URL || 'http://localhost:4318/v1/traces';

// enable debug
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Exporter send trace to OpenTelemetry Collector
const traceExporter = new OTLPTraceExporter({
  url: traceExporterUrl,
});

console.log(process.env.OTEL_EXPORTER_URL)

// Create a resource
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: deploymentEnvironment,
});

// config SDK
const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  resource, // add SDK resource
});

// Start SDK
try {
  sdk.start();
  console.log('OpenTelemetry SDK initialized');
} catch (err) {
  console.error('Error initializing OpenTelemetry SDK:', err);
}

// Config when shutdown
process.on('SIGTERM', async () => {
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry SDK shut down successfully');
  } catch (err) {
    console.error('Error shutting down OpenTelemetry SDK:', err);
  } finally {
    process.exit(0);
  }
});