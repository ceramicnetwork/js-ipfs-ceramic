declare module 'ipfs-http-server' {
    export default class HttpApi {
        constructor(ipfs: IPFSApi, options?: Record<string, any>);

        start(): Promise<HttpApi>;

        stop(): Promise<HttpApi>;
    }
}

declare module 'ipfs-http-gateway' {
    export default class HttpGateway {
        constructor(ipfs: IPFSApi, options?: Record<string, any>);

        start(): Promise<HttpGateway>;

        stop(): Promise<HttpGateway>;
    }
}

