// tslint:disable-next-line no-implicit-dependencies
import 'cross-fetch/polyfill';
import {
    ConnectivityLoader,
    DeploymentContextConfig,
    MultiDeploymentContextsConfig,
    ProviderConfig,
    MultiProvidersConfig,
    LoadableProvidersItem,
    ProvidersConfigsArg,
    LoadableDeploymentContextsItem,
    DeploymentContextsConfigsArg,
} from '../types';
import Web3Environment from './Environment';
import Web3Manager from './Manager';

import merge from 'lodash.merge';

import DefaultProviderConfig from '../configs/Provider.default.json';
import DefaultDeploymentContextConfig from '../configs/DeploymentContext.default.json';

/**
 * Web3 implementation of ConnectivityLoader.
 */
export default class Web3Loader implements ConnectivityLoader {
    private readonly _defaultProviderConfig: ProviderConfig = DefaultProviderConfig;

    // This default providers configuration will be included in the final configuration, but can be overriden.
    private readonly _defaultProvidersConfig: MultiProvidersConfig = {
        defaultProvider: '1337.localhost',
        providers: {
            '1337': {
                localhost: this._defaultProviderConfig,
            },
        },
    };

    private readonly _defaultDeploymentContextConfig: DeploymentContextConfig = DefaultDeploymentContextConfig;

    // This default deployments configuration will be included in the final configuration, but can be overriden.
    private readonly _defaultDeploymentContextsConfig: MultiDeploymentContextsConfig = {
        '1337': {
            localhost: this._defaultDeploymentContextConfig,
        },
    };

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
    async loadEnvironment(
        providerConfig?: ProviderConfig | string,
        deploymentContextConfig?: DeploymentContextConfig | string
    ): Promise<Web3Environment> {
        const providerToLoad: LoadableProvidersItem[] = [this._defaultProviderConfig];
        if (process.env.PROVIDER_URL || process.env.REACT_APP_PROVIDER_URL) {
            providerToLoad.push(process.env.PROVIDER_URL || process.env.REACT_APP_PROVIDER_URL);
        }
        if (providerConfig) {
            providerToLoad.push(providerConfig);
        }

        const deploymentContextToLoad: LoadableDeploymentContextsItem[] = [this._defaultDeploymentContextConfig];
        if (process.env.DEPLOYMENT_CONTEXT_URL || process.env.REACT_APP_DEPLOYMENT_CONTEXT_URL) {
            deploymentContextToLoad.push(process.env.DEPLOYMENT_CONTEXT_URL || process.env.REACT_APP_DEPLOYMENT_CONTEXT_URL);
        }
        if (deploymentContextConfig) {
            deploymentContextToLoad.push(deploymentContextConfig);
        }

        console.debug('Loading environment configurations...');
        const [providersConfig, deploymentContextsConfig] = await Promise.all([
            this._buildProvidersConfig(providerToLoad, true),
            this._buildNetworkDeploymentsConfig(deploymentContextToLoad),
        ]);
        console.debug('Environment configurations loaded');
        console.debug('Provider configuration:', JSON.stringify(providersConfig));
        console.debug('Deployment context configuration:', JSON.stringify(deploymentContextsConfig));

        const manager = new Web3Manager(providersConfig, deploymentContextsConfig);
        return manager.getEnvironment();
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
     *     - {PROVIDERS_URLS} or {REACT_APP_PROVIDERS_URLS} for Providers,
     *     - {DEPLOYMENT_CONTEXTS_URLS} or {REACT_APP_DEPLOYMENT_CONTEXTS_URLS} for DeploymentContexts,
     *   3. The configurations from the configuration argument, if provided.
     *
     * @param providersConfigs providers configuration to load.
     * @param deploymentContextsConfigs deployment contexts configuration to load.
     * @return the created connectivity manager.
     */
    async loadManager(
        providersConfigs?: ProvidersConfigsArg,
        deploymentContextsConfigs?: DeploymentContextsConfigsArg
    ): Promise<Web3Manager> {
        const providersToLoad: LoadableProvidersItem[] = [this._defaultProvidersConfig];
        if (process.env.PROVIDERS_URLS || process.env.REACT_APP_PROVIDERS_URLS) {
            providersToLoad.push(...(process.env.PROVIDERS_URLS || process.env.REACT_APP_PROVIDERS_URLS).split(' '));
        }
        if (Array.isArray(providersConfigs)) {
            providersToLoad.push(...providersConfigs);
        } else {
            providersToLoad.push(providersConfigs);
        }

        const deploymentContextsToLoad: LoadableDeploymentContextsItem[] = [this._defaultDeploymentContextsConfig];
        if (process.env.DEPLOYMENT_CONTEXTS_URLS || process.env.REACT_APP_DEPLOYMENT_CONTEXTS_URLS) {
            deploymentContextsToLoad.push(...(process.env.DEPLOYMENT_CONTEXTS_URLS || process.env.REACT_APP_DEPLOYMENT_CONTEXTS_URLS).split(' '));
        }
        if (Array.isArray(deploymentContextsConfigs)) {
            deploymentContextsToLoad.push(...deploymentContextsConfigs);
        } else {
            deploymentContextsToLoad.push(deploymentContextsConfigs);
        }

        console.debug('Loading environments configurations...');
        const [providersConfig, deploymentContextsConfig] = await Promise.all([
            this._buildProvidersConfig(providersToLoad, false),
            this._buildNetworkDeploymentsConfig(deploymentContextsToLoad),
        ]);
        console.debug('Environments configurations loaded');
        console.debug('Providers configuration:', JSON.stringify(providersConfig));
        console.debug('Deployment contexts configuration:', JSON.stringify(deploymentContextsConfig));

        const manager = new Web3Manager(providersConfig, deploymentContextsConfig);
        return manager;
    }

    private _convertToMultiProviders(providerConfig: ProviderConfig, makeDefault: boolean): MultiProvidersConfig {
        const providers = {};
        providers[providerConfig.chainId] = {};
        providers[providerConfig.chainId][providerConfig.name] = providerConfig;

        const converted: MultiProvidersConfig = { providers };
        if (makeDefault) {
            converted.defaultProvider = `${providerConfig.chainId}.${providerConfig.name}`;
        }
        return converted;
    }

    private async _buildProvidersConfig(
        configs: LoadableProvidersItem[],
        updateDefault: boolean
    ): Promise<MultiProvidersConfig> {
        const configurations: MultiProvidersConfig[] = await Promise.all<MultiProvidersConfig>(
            configs.map(
                (configItem: LoadableProvidersItem): Promise<MultiProvidersConfig> => {
                    if (typeof configItem === 'string') {
                        console.log(`fetching ${configItem}`);
                        return fetch(configItem)
                            .then((response: Response) => response.json())
                            .then((json: any) => {
                                const asSingle: ProviderConfig = json;
                                if (asSingle.name === undefined) {
                                    return json as MultiProvidersConfig;
                                }
                                const converted = this._convertToMultiProviders(asSingle, updateDefault);
                                return converted;
                            })
                            .catch((e: any) => {
                                console.error(`error loading ${typeof configItem} config from ${configItem}`, e);
                                const emptyConfig: MultiProvidersConfig = { providers: {} };
                                return emptyConfig;
                            });
                    } else {
                        const asSingle: ProviderConfig = configItem as any;
                        if (asSingle.name === undefined) {
                            return Promise.resolve(configItem as MultiProvidersConfig);
                        }
                        const converted = this._convertToMultiProviders(asSingle, updateDefault);
                        return Promise.resolve(converted);
                    }
                }
            )
        );
        const result = configurations.reduce((prev, curr) => merge(prev, curr));
        return result;
    }

    private _convertToMultiNetworksDeployments(
        deploymentContextConfig: DeploymentContextConfig
    ): MultiDeploymentContextsConfig {
        const converted: MultiDeploymentContextsConfig = {};
        converted[deploymentContextConfig.chainId] = {};
        converted[deploymentContextConfig.chainId][deploymentContextConfig.name] = deploymentContextConfig;
        return converted;
    }

    private async _buildNetworkDeploymentsConfig(
        configs: LoadableDeploymentContextsItem[]
    ): Promise<MultiDeploymentContextsConfig> {
        console.log(configs);
        const configurations = await Promise.all<MultiDeploymentContextsConfig>(
            configs.map(
                (configItem: LoadableDeploymentContextsItem): Promise<MultiDeploymentContextsConfig> => {
                    if (typeof configItem === 'string') {
                        console.log(`fetching ${typeof configItem} config from ${configItem}`);
                        return fetch(configItem as string)
                            .then((response: Response) => response.json())
                            .then((json: any) => {
                                const asSingle: DeploymentContextConfig = json;
                                if (asSingle.name === undefined) {
                                    return json as MultiDeploymentContextsConfig;
                                }
                                const converted = this._convertToMultiNetworksDeployments(asSingle);
                                return converted;
                            })
                            .catch((e: any) => {
                                console.error(`error loading ${typeof configItem} config from ${configItem}`, e);
                                const emptyConfig: MultiDeploymentContextsConfig = {};
                                return emptyConfig;
                            });
                    } else {
                        const asSingle: DeploymentContextConfig = configItem as any;
                        if (asSingle.name === undefined) {
                            return Promise.resolve(configItem as MultiDeploymentContextsConfig);
                        }
                        const converted = this._convertToMultiNetworksDeployments(asSingle);
                        return Promise.resolve(converted);
                    }
                }
            )
        );

        const result = configurations.reduce((prev, curr) => merge(prev, curr));
        return result;
    }
}
