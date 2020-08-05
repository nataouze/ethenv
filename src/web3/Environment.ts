import Web3 from 'web3';
import { Web3ModuleOptions } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { ProvidersModuleFactory, HttpProvider, WebsocketProvider } from 'web3-providers';
import { Mutex } from 'async-mutex';
import { ConnectivityEnvironment, DeploymentContextConfig, ProviderConfig } from '../types';
import Web3Loader from './Loader';

export type Provider = HttpProvider | WebsocketProvider;

/**
 * Web3 implementation of ConnectivityEnvironment.
 */
export default class Web3Environment implements ConnectivityEnvironment {
    public cachedProviders: { [url: string]: Provider } = {};
    public cachedWrappedProviders: { [key: string]: Web3 } = {};

    private _providersCacheMutex = new Mutex();
    private _wrappedProvidersCacheMutex = new Mutex();
    private _providersFactory = new ProvidersModuleFactory();

    /**
     * Constructor.
     * @param providerConfig the provider configuration.
     * @param deploymentContextConfig the deployment context configuration.
     */
    constructor(
        public readonly providerConfig: ProviderConfig,
        public readonly deploymentContextConfig: DeploymentContextConfig
    ) {
        console.debug(
            `Web3Environment for '${providerConfig.name}' created.`,
            `Supported contracts: ${Object.keys(deploymentContextConfig.contracts).join(', ')}`
        );
    }

    /**
     * Load the configurations and create a new connectivity environment.
     *
     * There are two types of configurations: Provider and DeploymentContext. For each of them:
     * - Configurations can be loaded from a configuration object or a string URL pointing to a JSON configuration object.
     * - Configurations are loaded and merged sequentially (attributes can be overriden).
     * - Loading order:
     *   1. The default configuration for '1337.localhost',
     *   2. The URL retrieved from the associated environment variable, if set:
     *     - {PROVIDER_URL} for Provider,
     *     - {DEPLOYMENT_CONTEXT_URL} for DeploymentContext,
     *   3. The configuration from the configuration argument, if provided.
     *
     * @param providerConfig provider configuration to load.
     * @param deploymentContextConfig deployment context configuration to load.
     * @return promise for the created connectivity environment.
     */
    static async get(
        providerConfig?: ProviderConfig | string,
        deploymentContextConfig?: DeploymentContextConfig | string
    ): Promise<Web3Environment> {
        const loader = new Web3Loader();
        return loader.loadEnvironment(providerConfig, deploymentContextConfig);
    }

    /**
     * Retrieve a cached Web3 instance.
     * @param options argument for the Web3 constructor. If provided, will override the configuration value.
     * @return promise for the retrieved Web3 instance.
     */
    async getWrappedProvider(options?: Web3ModuleOptions): Promise<Web3> {
        options = options || this.providerConfig.options || {};
        return this._getCachedWrappedProvider(this.providerConfig.url, options);
    }

    /**
     * Retrieve a cached Web3 instance.
     * @param options argument for the Web3 constructor. If provided, will override the configuration value.
     * @return promise for the retrieved Web3 instance.
     */
    async getWeb3(options?: Web3ModuleOptions): Promise<Web3> {
        return this.getWrappedProvider(options);
    }

    /**
     * Create a contract from a cached or provided Web3 instance.
     * @param contractName the name of the deployment to retrieve.
     * @param web3 Web3 instance to use for the contract creation. If not provided, a cached instance will be used.
     * @return promise for the created contract instance.
     */
    async getContract(contractName: string, web3?: Web3): Promise<Contract> {
        if (!web3) {
            const contractOverride = this.providerConfig.contracts
                ? this.providerConfig.contracts[contractName]
                : undefined;
            const url = contractOverride ? contractOverride.url : this.providerConfig.url;
            const options = (contractOverride ? contractOverride.options : this.providerConfig.options) || {};
            web3 = await this._getCachedWrappedProvider(url, options);
        }

        const contract = this.deploymentContextConfig.contracts[contractName];
        return new web3.eth.Contract(contract.abi, contract.address);
    }

    /**
     * Attempts to disconnect each cached provider, then clears the providers and wrapped providers caches.
     * @return promise after disconnection.
     */
    async shutdown(): Promise<void> {
        await this._providersCacheMutex.acquire();
        await this._wrappedProvidersCacheMutex.acquire();
        console.debug(`Disconnecting environment ${this.providerConfig.name} ...`);
        for (const [url, provider] of Object.entries(this.cachedProviders)) {
            try {
                console.debug(`Disconnecting provider for ${url} ...`);
                if (provider instanceof HttpProvider) {
                    provider.disconnect();
                } else if (provider instanceof WebsocketProvider) {
                    provider.disconnect(null, null);
                } else {
                    console.warn(`Unknown provider type for ${url}`);
                }
            } catch (e) {
                console.error(`Error while disconnecting ${url}:`, e);
            }
        }
        this.cachedProviders = {};
        this.cachedWrappedProviders = {};
        await this._providersCacheMutex.release();
        await this._wrappedProvidersCacheMutex.release();
        console.debug(`Environment ${this.providerConfig.name} disconnected`);
    }

    private async _getCachedProvider(url: string): Promise<Provider> {
        await this._providersCacheMutex.acquire();
        if (this.cachedProviders[url] === undefined) {
            this.cachedProviders[url] = this._providersFactory.createProviderResolver().resolve(url, null) as Provider;
            console.debug(`New provider cached with key '${url}'`);
        }
        await this._providersCacheMutex.release();
        return this.cachedProviders[url];
    }

    private async _getCachedWrappedProvider(url: string, options: Web3ModuleOptions): Promise<Web3> {
        const key = `${url}.${JSON.stringify(options)}`;
        await this._wrappedProvidersCacheMutex.acquire();
        if (this.cachedWrappedProviders[key] === undefined) {
            const provider = await this._getCachedProvider(url);
            this.cachedWrappedProviders[key] = new Web3(provider, null, options);
            console.debug(`New Web3 cached with key '${key}'`);
        }
        await this._wrappedProvidersCacheMutex.release();
        return this.cachedWrappedProviders[key];
    }
}
