import IPFS from 'ipfs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { IPFSAPI as IpfsApi } from 'ipfs-core/dist/src/components'

import HttpApi from 'ipfs-http-server'
import HttpGateway from 'ipfs-http-gateway'

import dagJose from 'dag-jose'
// @ts-ignore
import multiformats from 'multiformats/basics'
// @ts-ignore
import legacy from 'multiformats/legacy'

import { createRepo } from 'datastore-s3'
import HealthcheckServer from './healthcheck-server'

const TCP_HOST = process.env.TCP_HOST || '0.0.0.0'

const IPFS_PATH = process.env.IPFS_PATH || 'ipfs'
const IPFS_S3_REPO_ENABLED = process.env.IPFS_S3_REPO_ENABLED === 'true'

const { AWS_BUCKET_NAME } = process.env
const { AWS_ACCESS_KEY_ID } = process.env
const { AWS_SECRET_ACCESS_KEY } = process.env
const { ANNOUNCE_ADDRESS_LIST } = process.env

const IPFS_SWARM_TCP_PORT = process.env.IPFS_SWARM_TCP_PORT || 4011
const IPFS_SWARM_WS_PORT = process.env.IPFS_SWARM_WS_PORT || 4012

const IPFS_API_PORT = process.env.IPFS_API_PORT || 5011
const IPFS_ENABLE_API = process.env.IPFS_ENABLE_API ? process.env.IPFS_ENABLE_API === 'true' : true

const IPFS_GATEWAY_PORT = process.env.IPFS_GATEWAY_PORT || 9011
const IPFS_ENABLE_GATEWAY = process.env.IPFS_ENABLE_GATEWAY ? process.env.IPFS_ENABLE_GATEWAY === 'true' : true

const IPFS_DHT_SERVER_MODE = process.env.IPFS_DHT_SERVER_MODE === 'true'

const IPFS_ENABLE_PUBSUB = process.env.IPFS_ENABLE_PUBSUB === 'true'
const IPFS_PUBSUB_TOPICS = process.env.IPFS_PUBSUB_TOPICS ? process.env.IPFS_PUBSUB_TOPICS.split(' ') : []

export default class IPFSServer {

    /**
     * Start js-ipfs instance with dag-jose enabled
     */
    static async start(): Promise<void> {
        const repo = IPFS_S3_REPO_ENABLED ? createRepo({
            path: IPFS_PATH,
        }, {
            bucket: AWS_BUCKET_NAME,
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }) : null

        // setup dag-jose codec
        multiformats.multicodec.add(dagJose)
        const format = legacy(multiformats, dagJose.name)

        const announceAddresses = ANNOUNCE_ADDRESS_LIST != null ? ANNOUNCE_ADDRESS_LIST.split(',') : []
        const ipfs: IpfsApi = await IPFS.create({
            repo,
            ipld: { formats: [format] },
            libp2p: {
                config: {
                    dht: {
                        enabled: true,
                        clientMode: !IPFS_DHT_SERVER_MODE,
                        randomWalk: false,
                    },
                    pubsub: {
                        enabled: IPFS_ENABLE_PUBSUB
                    },
                },
                addresses: {
                    announce: announceAddresses,
                }
            },
            config: {
                Addresses: {
                    Swarm: [
                        `/ip4/${TCP_HOST}/tcp/${IPFS_SWARM_TCP_PORT}`,
                        `/ip4/${TCP_HOST}/tcp/${IPFS_SWARM_WS_PORT}/ws`,
                    ],
                    ...IPFS_ENABLE_API && { API: `/ip4/${TCP_HOST}/tcp/${IPFS_API_PORT}` },
                    ...IPFS_ENABLE_GATEWAY && { Gateway: `/ip4/${TCP_HOST}/tcp/${IPFS_GATEWAY_PORT}` }
                    ,
                },
                API: {
                    HTTPHeaders: {
                        "Access-Control-Allow-Origin": [
                            "*"
                        ],
                        "Access-Control-Allow-Methods": [
                            "GET",
                            "POST"
                        ],
                        "Access-Control-Allow-Headers": [
                            "Authorization"
                        ],
                        "Access-Control-Expose-Headers": [
                            "Location"
                        ],
                        "Access-Control-Allow-Credentials": [
                            "true"
                        ]
                    }
                },
                Routing: {
                    Type: IPFS_DHT_SERVER_MODE ? 'dhtserver' : 'dhtclient',
                },
            },
        })

        if (IPFS_ENABLE_API) {
            await new HttpApi(ipfs).start()
            console.log('IPFS API server listening on ' + IPFS_API_PORT)
        }
        if (IPFS_ENABLE_GATEWAY) {
            await new HttpGateway(ipfs).start()
            console.log('IPFS Gateway server listening on ' + IPFS_GATEWAY_PORT)
        }

        IPFS_PUBSUB_TOPICS.forEach((topic: string) => {
            ipfs.pubsub.subscribe(topic)
        })

        HealthcheckServer.start(ipfs)
    }
}
