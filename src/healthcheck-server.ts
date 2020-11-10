import os from 'os-utils'
import express from "express"
import { IPFSApi } from "./declarations"
import { toBoolean } from "./utils"

const HEALTHCHECK_ENABLED = 'HEALTHCHECK_ENABLED' in process.env? toBoolean(process.env.HEALTHCHECK_ENABLED) : false
const HEALTHCHECK_PORT = process.env.HEALTHCHECK_PORT != null ? parseInt(process.env.HEALTHCHECK_PORT) : 8011

export default class HealthcheckServer {

    static start(ipfs: IPFSApi): void {
        if (!HEALTHCHECK_ENABLED) {
            return
        }
        const app = express()

        app.get('/', async (req, res) => {
            if (!ipfs.isOnline()) {
                return res.status(503).send()
            }
            const cpuFree: number = await new Promise((resolve) => os.cpuFree(resolve))
            const memFree = os.freememPercentage()
            if (cpuFree < 0.05 || memFree < 0.20) {
                return res.status(503).send()
            }
            return res.status(200).send()
        })

        app.listen(HEALTHCHECK_PORT, () => {
            console.log(`Healthcheck server is listening on ${HEALTHCHECK_PORT}`)
        })
    }
}
