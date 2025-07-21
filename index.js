import * as opentelemetry from '@opentelemetry/sdk-node';
import {PrometheusExporter} from '@opentelemetry/exporter-prometheus';
import {metrics} from '@opentelemetry/api';
import axios from "axios";

async function getServers() {
    const response = await axios.get('https://api.gametools.network/bf4/servers', {
        params: {
            name: '',
            experiencename: '',
            lang: 'en',
            region: 'sam',
            platform: 'pc',
            service: undefined,
            limit: 250,
        },
    });

    return response.data;
}

const exporter = new PrometheusExporter({port: 9464}, () => {
    console.log('Prometheus scrape endpoint: http://localhost:9464/metrics');
});

const sdk = new opentelemetry.NodeSDK({
    metricReader: exporter,
});

sdk.start()
console.log('OpenTelemetry SDK started');

// Use OpenTelemetry API to create meter and counter
const meter = metrics.getMeter('bf4-server-metrics');
const inGamePlayers = meter.createGauge('bf4_in_game_players', {
    description: 'Current player count across all servers',
});
const inQueuePlayers = meter.createGauge('bf4_in_queue_players', {
    description: 'Current player count across all servers',
});
const inSpectatorPlayers = meter.createGauge('bf4_in_spectators_players', {
    description: 'Current player count across all servers',
});

async function update() {
    const data = await getServers()
    const servers = data.servers;

    console.log(data);

    servers.forEach(server => {
        const attributes = {
            id: server.gameId,
            name: server.prefix,
            mode: server.mode,
            map: server.currentMap,
            country: server.country,
            region: server.region,
            maxPlayers: server.maxPlayers,
        }

        inQueuePlayers.record(server.inQue, attributes);
        inSpectatorPlayers.record(server.inSpectator, attributes);
        inGamePlayers.record(server.playerAmount, attributes)
    })
}

void update();
setInterval(update, 5 * 60_000);