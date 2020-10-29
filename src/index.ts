import IPFS from 'ipfs'
import HttpApi from 'ipfs-http-server'
import HttpGateway from 'ipfs-http-gateway'

import dagJose from 'dag-jose'
// @ts-ignore
import multiformats from 'multiformats/basics'
// @ts-ignore
import legacy from 'multiformats/legacy'

import Healthcheck from "./healthcheck"

const IPFS_SWARM_TCP_PORT = process.env.IPFS_SWARM_TCP_PORT || 4011
const IPFS_SWARM_WS_PORT = process.env.IPFS_SWARM_WS_PORT || 4012

const IPFS_API_PORT = process.env.IPFS_API_PORT || 5011
const IPFS_GATEWAY_PORT = process.env.IPFS_GATEWAY_PORT || 9011

const HEALTHCHECK_PORT = process.env.HEALTHCHECK_PORT != null ? parseInt(process.env.HEALTHCHECK_PORT) : 8011

process.on('uncaughtException', (err) => {
    console.log(err) // just log for now
})

// setup dag-jose codec
multiformats.multicodec.add(dagJose)
const format = legacy(multiformats, dagJose.name)

IPFS.create({
    ipld: { formats: [format] },
    libp2p: {
        config: {
            dht: {
                enabled: true,
                clientMode: true,
            },
        },
    },
    config: {
        Addresses: {
            Swarm: [
                `/ip4/0.0.0.0/tcp/${IPFS_SWARM_TCP_PORT}`,
                `/ip4/0.0.0.0/tcp/${IPFS_SWARM_WS_PORT}/ws`,
            ],
            API: `/ip4/0.0.0.0/tcp/${IPFS_API_PORT}`,
            Gateway: `/ip4/0.0.0.0/tcp/${IPFS_GATEWAY_PORT}`,
        },
    },
}).then(async (ipfs) => {
    await new HttpApi(ipfs).start()
    console.log('IPFS API server listening on ' + IPFS_API_PORT)
    await new HttpGateway(ipfs).start()
    console.log('IPFS Gateway server listening on ' + IPFS_GATEWAY_PORT)

    const healthcheck = new Healthcheck(HEALTHCHECK_PORT, ipfs)
    healthcheck.start()
}).catch((e) => console.error(e))
