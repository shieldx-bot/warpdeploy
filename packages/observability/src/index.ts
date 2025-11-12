import { NodeSDK } from '@opentelemetry/sdk-node'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import {
    PeriodicExportingMetricReader,
    ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';

// chore: housekeeping touch – 2025-11-12


const sdk = new NodeSDK({
    tranceExporter: new ConsoleSpanExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'warpdeploy-observability-service',
    }),
    metricReaders: [
        new PeriodicExportingMetricReader({
            exporter: new ConsoleMetricExporter(),
        })
    ],





})
sdk.start()