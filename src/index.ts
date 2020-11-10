import IPFSServer from "./ipfs-server"

process.on('uncaughtException', (err) => {
    console.log(err) // just log for now
})

IPFSServer.start().catch((e) => console.error(e))
