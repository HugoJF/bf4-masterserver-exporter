import axios from "axios";
import express from 'express';
import {Registry, Gauge} from 'prom-client';

const app = express();
const port = process.env.PORT || 9464;

const register = new Registry();

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

// Create gauges per server
const inGamePlayers = new Gauge({
    name: 'bf4_in_game_players',
    help: 'Current players in BF4 server',
    labelNames: ['id', 'map', 'mode', 'country', 'region']
});
const inQueuePlayers = new Gauge({
    name: 'bf4_in_queue_players',
    help: 'Current players in queue in BF4 server',
    labelNames: ['id', 'map', 'mode', 'country', 'region']
});
const inSpectatorsPlayers = new Gauge({
    name: 'bf4_in_spectators_players',
    help: 'Current spectators in BF4 server',
    labelNames: ['id', 'map', 'mode', 'country', 'region']
});
const maxPlayers = new Gauge({
    name: 'bf4_max_players',
    help: 'Max players in BF4 server',
    labelNames: ['id', 'map', 'mode', 'country', 'region']
});
const info = new Gauge({
    name: 'bf4_server_info',
    help: 'BF4 server info',
    labelNames: ['id', 'name']
});

register.registerMetric(inGamePlayers);
register.registerMetric(inQueuePlayers);
register.registerMetric(inSpectatorsPlayers);
register.registerMetric(maxPlayers);
register.registerMetric(info);

async function updateMetrics() {
    const data = await getServers();
    const servers = data.servers;

    inGamePlayers.reset()
    inQueuePlayers.reset();
    inSpectatorsPlayers.reset();
    maxPlayers.reset();
    info.reset();

    for (const server of servers) {
        const labels = [server.gameId, server.currentMap, server.mode, server.country, server.region];

        console.log(server)

        inGamePlayers.labels(...labels).set(server.playerAmount);
        inQueuePlayers.labels(...labels).set(server.inQue);
        inSpectatorsPlayers.labels(...labels).set(server.inSpectator);
        maxPlayers.labels(...labels).set(server.maxPlayers);
        info.labels(server.gameId, server.prefix).set(1);
    }
}

// /metrics endpoint
app.get('/metrics', async (req, res) => {
    await updateMetrics();

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.listen(port, () => {
    console.log(`http://localhost:${port}/metrics`);
});