import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

import type { HttpProvider } from 'web3-providers-http';
import type { WebsocketProvider } from 'web3-providers-ws';
const Http = require('web3-providers-http');
const Websocket = require('web3-providers-ws');
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
    async getWrappedProvider(options?: {}): Promise<Web3> {
        options = options || this.providerConfig.options || {};
        return this._getCachedWrappedProvider(this.providerConfig.url, options);
    }

    /**
     * Retrieve a cached Web3 instance.
     * @param options argument for the Web3 constructor. If provided, will override the configuration value.
     * @return promise for the retrieved Web3 instance.
     */
    async getWeb3(options?: {}): Promise<Web3> {
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
        if (typeof contract.abi === 'string') {
            const abi: any[] = require(`../../abis/${contract.abi}`);
            contract.abi = abi;
        }
        return new web3.eth.Contract(contract.abi, contract.address);
    }

    /**
     * Attempts to disconnect each cached provider, then clears the providers and wrapped providers caches.
     * @return promise after disconnection.
     */
    async shutdown(): Promise<void> {
        console.debug(`Disconnecting environment ${this.providerConfig.name} ...`);

        // Provider Cache
        const providerLockRelease = await this._providersCacheMutex.acquire();
        const wrappedProviderLockRelease = await this._wrappedProvidersCacheMutex.acquire();
        for (const [url, provider] of Object.entries(this.cachedProviders)) {
            try {
                console.debug(`Disconnecting provider for ${url} ...`);

                if (provider instanceof Http) {
                    provider.disconnect(null, null);
                } else if (provider instanceof Websocket) {
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
        providerLockRelease();
        wrappedProviderLockRelease();
        console.debug(`Environment ${this.providerConfig.name} disconnected`);
    }

    private async _getCachedProvider(url: string, options: {}): Promise<Provider> {
        if (this.cachedProviders[url] === undefined) {
            const providerLockRelease = await this._providersCacheMutex.acquire();
            try {
                if (this.cachedProviders[url] === undefined) {
                    if (url.indexOf('http://') !== -1 || url.indexOf('https://') !== -1) {
                        this.cachedProviders[url] = new Http(url, options) as Provider;
                    } else if (url.indexOf('ws://') !== -1) {
                        this.cachedProviders[url] = new Websocket(url, options) as Provider;
                    }
                    console.debug(`New provider cached with key '${url}'`);
                }
            } catch (e) {
                console.error(e);
            } finally {
                providerLockRelease();
            }
        }
        return this.cachedProviders[url];
    }

    private async _getCachedWrappedProvider(url: string, options?: {}): Promise<Web3> {
        const key = `${url}.${JSON.stringify(options)}`;
        if (this.cachedWrappedProviders[key] === undefined) {
            const wrappedProviderRelease = await this._wrappedProvidersCacheMutex.acquire();
            try {
                if (this.cachedWrappedProviders[key] === undefined) {
                    const provider = await this._getCachedProvider(url, options);
                    this.cachedWrappedProviders[key] = new Web3(provider);
                    console.debug(`New Web3 cached with key '${key}'`);
                }
            } catch (e) {
                console.error(e);
            } finally {
                wrappedProviderRelease();
            }
        }
        return this.cachedWrappedProviders[key];
    }
}
