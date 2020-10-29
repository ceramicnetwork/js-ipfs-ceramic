import os from 'os-utils'
import express from 'express'
import IpfsInstance from './declarations'

export default class Healthcheck {

    constructor(private _port = 8011, private _ipfs: IpfsInstance) {}

    start(): void {
        const app = express()

        app.get('/', async (req, res) => {
            if (!this._ipfs.isOnline()) {
                return res.status(503).send()
            }
            const cpuFree: number = await new Promise((resolve) => os.cpuFree(resolve))
            const memFree = os.freememPercentage()
            if (cpuFree < 0.05 || memFree < 0.20) {
                return res.status(503).send()
            }
            return res.status(200).send()
        })

        app.listen(this._port, () => {
            console.log(`Healthcheck server is listening on ${this._port}`)
        })
    }
}
