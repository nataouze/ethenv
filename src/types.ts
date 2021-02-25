// tslint:disable-next-line no-implicit-dependencies

// export type DeploymentContextConfig = Export;
// export type MultiDeploymentContextsConfig = MultiExport;

export interface DeploymentContextConfig {
    chainId: string;
    name: string;
    accounts?: { [accountName: string]: string };
    contracts?: {
        [contractName: string]: {
            address: string;
            abi: any[] | string;
        };
    };
}

export interface MultiDeploymentContextsConfig {
    [chaindId: string]: { [network: string]: DeploymentContextConfig };
}

export interface ProviderConfig {
    chainId: string;
    name: string;
    url: string; // http or ws(s) connection endpoint
    options?: any; // wrapped provider constructor options
    contracts?: {
        // overrides by contract, name same as in deployment context
        [contractName: string]: {
            url?: string; // default url override
            options?: any; // default options override
        };
    };
}

export interface MultiProvidersConfig {
    defaultProvider?: string; // format: 'chainId.contextName'
    providers: { [chaindId: string]: { [network: string]: ProviderConfig } };
}

export interface ConnectivityEnvironment {
    readonly deploymentContextConfig: DeploymentContextConfig;
    readonly providerConfig: ProviderConfig;

    cachedProviders: { [url: string]: any };
    cachedWrappedProviders: { [key: string]: any };

    /**
     * Retrieve a cached wrapped provider instance.
     * @param options argument for the wrapped provider constructor. If provided, will override the configuration value.
     * @return promise for the retrieved wrapped provider instance.
     */
    getWrappedProvider(options?: any): Promise<any>;

    /**
     * Create a contract from a cached or provided wrapped provider instance.
     * @param contractName the name of the deployment to retrieve.
     * @param options argument for the wrapped provider constructor. If provided, will override configuration values. Will be ignored if wrappedProvider is provided.
     * @param wrappedProvider wrapped provider instance to use for the contract creation. If not provided, a cached instance will be used.
     * @return promise for the created contract instance.
     */
    getContract(contractName: string, wrappedProvider?: any): Promise<any>;

    /**
     * Attempts to disconnect each cached provider, then clears the providers and wrapped providers caches.
     * @return promise after disconnection.
     */
    shutdown(): Promise<void>;
}

export interface ConnectivityManager {
    readonly deploymentContextsConfig: MultiDeploymentContextsConfig;
    readonly providersConfig: MultiProvidersConfig;

    cachedEnvironments: { [providerName: string]: ConnectivityEnvironment };

    /**
     * Retrieve a cached environment.
     * @param providerName provider name in format: 'chainId.contextName'. If not provided, the default provider name will be used.
     * @return promise for the retrieved environment.
     */
    getEnvironment(providerName?: string): Promise<any>;

    /**
     * Retrieve a cached wrapped provider instance.
     * @param providerName provider name in format: 'chainId.contextName'. If not provided, the default provider name will be used.
     * @param options argument for the wrapped provider constructor. If provided, will override the configuration value.
     * @return promise for the retrieved wrapped provider instance.
     */
    getWrappedProvider(providerName?: string, options?: any): Promise<any>;

    /**
     * Create a Contract from a cached or provided wrapped provider instance.
     * @param contractName the name of the contract deployment to retrieve.
     * @param providerName provider name in format: 'chainId.contextName'. If not provided, the default provider name will be used.
     * @param options argument for the wrapped provider constructor. If defined, will override configuration values. Will be ignored if wrappedProvider is provided.
     * @param wrappedProvider wrapped provider instance to use for the contract creation. If not defined, will retrieve an instance from a managed environment.
     * @return promise for the created contract instance.
     */
    getContract(contractName: string, providerName: string, wrappedProvider?: any): Promise<any>;

    /**
     * Shutdown all the cached environments.
     * @return {Promise<void>} promise fafter shutdowns.
     */
    shutdown(): Promise<void>;
}

export type LoadableDeploymentContextsItem = DeploymentContextConfig | MultiDeploymentContextsConfig | string;
export type DeploymentContextsConfigsArg = LoadableDeploymentContextsItem | LoadableDeploymentContextsItem[];

export type LoadableProvidersItem = ProviderConfig | MultiProvidersConfig | string;
export type ProvidersConfigsArg = LoadableProvidersItem | LoadableProvidersItem[];

export interface ConnectivityLoader {
    /**
     * Load the configurations and create a new connectivity environment.
     *
     * There are two types of configurations: Provider and DeploymentContext. For each of them:
     * - Configurations can be loaded from a configuration object or a string URL pointing to a JSON configuration object.
     * - Configurations are loaded and merged sequentially (attributes can be overriden).
     * - Loading order:
     *   1. The default configuration for '1337.localhost',
     *   2. The URL retrieved from the associated environment variable, if set:
     *     - {PROVIDER_URL} or {REACT_APP_PROVIDER_URL} for Provider,
     *     - {DEPLOYMENT_CONTEXT_URL} or {REACT_APP_DEPLOYMENT_CONTEXT_URL} for DeploymentContext,
     *   3. The configuration from the configuration argument, if provided.
     *
     * @param providerConfig provider configuration to load.
     * @param deploymentContextConfig deployment context configuration to load.
     * @return the created connectivity environment.
     */
    loadEnvironment(
        providerConfig?: ProviderConfig | string,
        deploymentContextConfig?: DeploymentContextConfig | string
    ): Promise<ConnectivityEnvironment>;

    /**
     * Load the configurations and create a new connectivity manager.
     *
     * There are two types of configurations: Providers and DeploymentContexts. For each of them:
     * - Configurations can be loaded from configuration objects or string URLs pointing to a JSON configuration object.
     * - Configurations are loaded and merged sequentially (attributes can be overriden).
     * - Loading order:
     *   1. The default configuration for '1337.localhost',
     *   2. The URLs retrieved from the associated environment variable, if any:
     *     - {PROVIDERS_URLS} or {REACT_APP_PROVIDERS_URLS} for Providers,
     *     - {DEPLOYMENT_CONTEXTS_URLS} or {REACT_APP_DEPLOYMENT_CONTEXTS_URLS} for DeploymentContexts,
     *   3. The configurations from the configuration argument, if provided.
     *
     * @param providersConfigs providers configuration(s) to load.
     * @param deploymentContextsConfigs deployment context(s) configuration(s) to load.
     * @return the created connectivity manager.
     */
    loadManager(
        providersConfigs?: ProvidersConfigsArg,
        deploymentContextsConfigs?: DeploymentContextsConfigsArg
    ): Promise<ConnectivityManager>;
}
