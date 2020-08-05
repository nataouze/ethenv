import Web3 from 'web3';
import { Web3ModuleOptions } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { Mutex } from 'async-mutex';
import {
    ConnectivityManager,
    ProvidersConfigsArg,
    MultiProvidersConfig,
    DeploymentContextsConfigsArg,
    MultiDeploymentContextsConfig,
} from '../types';
import Web3Environment, { Provider } from './Environment';
import Web3Loader from './Loader';

/**
 * Web3 implementation of ConnectivityManager.
 */
export default class Web3Manager implements ConnectivityManager {
    public cachedEnvironments: { [providerName: string]: Web3Environment } = {};

    private _cachedEnvironmentsMutex = new Mutex();

    /**
     * @constructor
     * @param providersConfig the providers configuration.
     * @param deploymentContextsConfig the deployments configuration.
     */
    constructor(
        public readonly providersConfig: MultiProvidersConfig,
        public readonly deploymentContextsConfig: MultiDeploymentContextsConfig
    ) {
        console.debug(`Web3Manager for environments ${Object.keys(this.providersConfig.providers).join(', ')} created`);
    }

    /**
     * Load the configurations and create a new connectivity manager.
     *
     * There are two types of configurations: Providers and DeploymentContexts. For each of them:
     * - Configurations can be loaded from configuration objects or string URLs pointing to a JSON configuration object.
     * - Configurations are loaded and merged sequentially (attributes can be overriden).
     * - Loading order:
     *   1. The default configuration for '1337.localhost',
     *   2. The URLs retrieved from the associated environment variable, if any:
     *     - {PROVIDERS_URLS} for Providers,
     *     - {DEPLOYMENT_CONTEXTS_URLS} for DeploymentContexts,
     *   3. The configurations from the configuration argument, if provided.
     *
     * @param providersConfigs providers configuration to load.
     * @param deploymentContextsConfigs deployment contexts configuration to load.
     * @return promise for the created connectivity manager.
     */
    static async get(
        providersConfigs?: ProvidersConfigsArg,
        deploymentContextsConfigs?: DeploymentContextsConfigsArg
    ): Promise<Web3Manager> {
        const loader = new Web3Loader();
        return loader.loadManager(providersConfigs, deploymentContextsConfigs);
    }

    /**
     * Retrieve a cached environment.
     * @param providerName provider name in format: 'chainId.contextName'. If not provided, the default provider name will be used.
     * @return promise for the retrieved environment.
     */
    async getEnvironment(providerName?: string): Promise<Web3Environment> {
        providerName = providerName || process.env.DEFAULT_PROVIDER || this.providersConfig.defaultProvider;
        return this._getCachedEnvironment(providerName);
    }

    /**
     * Retrieve a cached Web3 instance.
     * @param providerName provider name in format: 'chainId.contextName'. If not provided, the default provider name will be used.
     * @param options argument for the Web3 constructor. If provided, will override the configuration value.
     * @return promise for the retrieved Web3 instance.
     */
    async getWrappedProvider(providerName?: string, options?: Web3ModuleOptions): Promise<Web3> {
        const environment = await this.getEnvironment(providerName);
        return environment.getWrappedProvider(options);
    }

    /**
     * Retrieve a cached Web3 instance.
     * @param providerName provider name in format: 'chainId.contextName'. If not provided, the default provider name will be used.
     * @param options argument for the Web3 constructor. If provided, will override the configuration value.
     * @return promise for the retrieved Web3 instance.
     */
    async getWeb3(providerName?: string, options?: Web3ModuleOptions): Promise<Web3> {
        return this.getWrappedProvider(providerName, options);
    }

    /**
     * Create a Contract from a cached or provided Web3 instance.
     * @param contractName the name of the contract deployment to retrieve.
     * @param providerName provider name in format: 'chainId.contextName'. If not provided, the default provider name will be used.
     * @param options argument for the Web3 constructor. If defined, will override configuration values. Will be ignored if web3 is provided.
     * @param web3 Web3 instance to use for the contract creation. If not defined, will retrieve an instance from a managed environment.
     * @return promise for the created contract instance.
     */
    async getContract(contractName: string, providerName?: string, web3?: Web3): Promise<Contract> {
        const environment = await this.getEnvironment(providerName);
        return environment.getContract(contractName, web3);
    }

    /**
     * Shutdown all the cached environments.
     * @return promise fafter shutdowns.
     */
    async shutdown(): Promise<void> {
        await this._cachedEnvironmentsMutex.acquire();
        for (const [provider, environment] of Object.entries(this.cachedEnvironments)) {
            console.debug(`Shutting down environment '${provider}'...`);
            await environment.shutdown();
        }
        this.cachedEnvironments = {};
        await this._cachedEnvironmentsMutex.release();
        console.debug('All cached environments have been shutdown.');
    }

    private async _getCachedEnvironment(providerName: string): Promise<Web3Environment> {
        await this._cachedEnvironmentsMutex.acquire();
        if (this.cachedEnvironments[providerName] === undefined) {
            const [chainId, contextName] = providerName.split('.');
            console.debug(this.providersConfig);
            this.cachedEnvironments[providerName] = new Web3Environment(
                this.providersConfig.providers[chainId][contextName],
                this.deploymentContextsConfig[chainId][contextName]
            );
            console.debug(`New environment cached with key '${providerName}'`);
        }
        await this._cachedEnvironmentsMutex.release();
        return this.cachedEnvironments[providerName];
    }
}
