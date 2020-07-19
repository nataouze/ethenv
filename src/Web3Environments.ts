import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { HttpProvider, WebsocketProvider, AbstractSocketProvider } from 'web3-providers';
import { EnvironmentsManager, EnvironmentsManagerConfig } from './types';

interface Web3Cache {
    [environment: string]: Web3;
}

interface ContractsCache {
    [deploymentKey: string]: Contract;
}

export default class Web3Environments implements EnvironmentsManager {
    public readonly config: EnvironmentsManagerConfig;
    private web3Cache: Web3Cache;
    private contractsCache: ContractsCache;

    constructor(config: EnvironmentsManagerConfig) {
        this.config = config;
        this.web3Cache = {};
        this.contractsCache = {};
    }

    /**
     * Instantiates or retrieves a cached Web3 Contract instance.
     * @param contract the name of the contract to instantiate.
     * @param environment the name of the environment in which to retrieve the contract information.
     */
    public async getContract(contract: string, environment: string): Promise<Contract> {
        const deploymentKey = `${environment}.${contract}`;
        if (this.contractsCache[deploymentKey] === undefined) {
            const web3 = await this.getWeb3(environment);
            const environmentConfig = this.config.environments[environment];
            const contractConfig = this.config.contracts[environmentConfig.chainId][environmentConfig.network][
                contract
            ];
            const web3Contract = new web3.eth.Contract(contractConfig.abi, contractConfig.address);
            this.contractsCache[deploymentKey] = web3Contract;
            return web3Contract;
        } else {
            return this.contractsCache[deploymentKey];
        }
    }

    /**
     * Instantiates or retrieves a cached Web3 instance.
     * @param environment the name of the environment for which to instantiate the returned Web3 instance.
     */
    public async getWeb3(environment: string): Promise<Web3> {
        const environmentConfig = this.config.environments[environment];
        let web3 = this.web3Cache[environment];
        if (web3 === undefined) {
            const providerUrl = this.config.providers[environmentConfig.provider];
            console.log(`Creating new Web3 instance for url ${providerUrl}`);
            web3 = new Web3(providerUrl, null, environmentConfig.options);
        }
        const chainId = await web3.shh.net.getId();
        if (environmentConfig.chainId !== `${chainId}`) {
            throw new Error(
                `chainId in config '${environmentConfig.chainId}' does not match the network '${chainId}' for environment '${environment}'.`
            );
        }
        return web3;
    }

    /**
     * Instantiates a Web3 contract through an externally managed Web3 instance.
     * The Web3 instance and the contract will not be cached will not be cached.
     * @param contract the name of the contract to retrieve.
     * @param environment the name of the environment in which to retrieve the contract information.
     * @param web3 an externally managed Web3 instance which will be used to create the returned Web3 Contract instance.
     */
    public async getWeb3Contract(contract: string, environment: string, web3: Web3): Promise<Contract> {
        const environmentConfig = this.config.environments[environment];
        const contractConfig = this.config.contracts[environmentConfig.chainId][environmentConfig.network][contract];
        const web3Contract = new web3.eth.Contract(contractConfig.abi, contractConfig.address);
        return web3Contract;
    }

    /**
     * Disconnects a cached Web3 instance.
     * If there is no Web3 instance cached for this environment, this function does nothing.
     * @param environment the name of the environment to disconnect.
     */
    public disconnect(environment: string): void {
        const web3 = this.web3Cache[environment];
        if (web3 !== undefined) {
            try {
                if (web3.currentProvider instanceof HttpProvider) {
                    const provider = web3.currentProvider as HttpProvider;
                    console.log(`Disconnecting HTTP connection for environment '${environment}'.`);
                    provider.disconnect();
                } else if (web3.currentProvider instanceof WebsocketProvider) {
                    const provider = web3.currentProvider as WebsocketProvider;
                    console.log(`Disconnecting WS connection for environment '${environment}'.`);
                    provider.disconnect(null, null);
                } else {
                    const provider = web3.currentProvider as AbstractSocketProvider;
                    console.log(`Disconnecting unknown connection for environment '${environment}'.`);
                    provider.disconnect(null, null);
                }
                delete this.web3Cache[environment];
            } catch (e) {
                console.warn(`Error while trying to disconnect connection for environment '${environment}'.`, e);
            }
        }
    }

    /**
     * Disconnects all the cached Web3 instances.
     */
    public disconnectAll(): void {
        const providers = Object.keys(this.web3Cache);
        for (const provider of providers) {
            this.disconnect(provider);
        }
        console.log('All providers disconnected.');
    }
}
