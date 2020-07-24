// tslint:disable-next-line no-implicit-dependencies
import 'cross-fetch/polyfill';
import {
    NetworkDeployments,
    MultiNetworksDeployments,
    // EnvironmentsManager,
    EnvironmentsManagerLoader,
    ProvidersConfiguration,
    DeploymentsConfig,
    ProvidersConfig,
    ProvidersConfigItem,
    DeploymentsConfigItem,
} from '../types';
import Web3EnvironmentsManager from './EnvironmentsManager';

export default class Web3EnvironmentsManagerLoader implements EnvironmentsManagerLoader {
    private readonly _providersDefaultConfig: ProvidersConfiguration = {
        defaultProvider: '1337.localhost',
        providers: { '1337': { localhost: { url: 'http://localhost:7545' } } },
    };
    private readonly _deploymentsDefaultConfig: MultiNetworksDeployments = {
        '1337': { localhost: { chainId: '1337', network: 'localhost', contracts: {} } },
    };
    public providers: ProvidersConfiguration;
    public deployments: MultiNetworksDeployments;

    /**
     * Loads the configurations and creates a new environments manager;
     * @param providers optional providers configuration(s). If the value is an array, the configurations will be merged in order from left to right. If not defined, a default value will be used.
     * @param deployments the deployments configuration(s). If the value is an array, the configurations will be merged in order from left to right. If not defined, a default value will be used.
     */
    async load(providers?: ProvidersConfig, deployments?: DeploymentsConfig): Promise<Web3EnvironmentsManager> {
        [this.providers, this.deployments] = await Promise.all([
            this._buildProvidersConfig(providers),
            this._buildNetworkDeploymentsConfig(deployments),
        ]);
        return new Web3EnvironmentsManager(this.providers, this.deployments);
    }

    private async _buildProvidersConfig(configs?: ProvidersConfig): Promise<ProvidersConfiguration> {
        if (Array.isArray(configs)) {
            configs = [this._providersDefaultConfig, ...configs];
        } else {
            configs = [this._providersDefaultConfig, configs];
        }
        const configurations: ProvidersConfiguration[] = await Promise.all<ProvidersConfiguration>(
            configs.map(
                (configItem: ProvidersConfigItem): Promise<ProvidersConfiguration> => {
                    if (typeof configItem === 'string') {
                        console.log(`fetching ${configItem}`);
                        return fetch(configItem)
                            .then((response: Response) => response.json())
                            .then((json: any) => json as ProvidersConfiguration)
                            .catch((e: any) => {
                                console.error(`error loading ${typeof configItem} config from ${configItem}`, e);
                                return ({} as any) as ProvidersConfiguration;
                            });
                    } else {
                        return Promise.resolve(configItem);
                    }
                }
            )
        );
        const result = configurations.reduce((prev, curr) => ({ ...prev, ...curr }));
        return result;
    }

    private _convertToMultiNetworksDeployments(networkDeployments: NetworkDeployments): MultiNetworksDeployments {
        const converted: MultiNetworksDeployments = {};
        converted[networkDeployments.chainId] = {};
        converted[networkDeployments.chainId][networkDeployments.network] = {
            chainId: networkDeployments.chainId,
            network: networkDeployments.network,
            contracts: networkDeployments.contracts,
        };
        return converted;
    }

    private async _buildNetworkDeploymentsConfig(configs?: DeploymentsConfig): Promise<MultiNetworksDeployments> {
        if (configs === undefined) {
            return {};
        }
        if (Array.isArray(configs)) {
            configs = [this._deploymentsDefaultConfig, ...configs];
        } else {
            configs = [this._deploymentsDefaultConfig, configs];
        }
        const configurations = await Promise.all<MultiNetworksDeployments>(
            configs.map(
                (configItem: DeploymentsConfigItem): Promise<MultiNetworksDeployments> => {
                    if (typeof configItem === 'string') {
                        console.log(`fetching ${typeof configItem} config from ${configItem}`);
                        return fetch(configItem as string)
                            .then((response: Response) => response.json())
                            .then((json: any) => {
                                if (json.chainId === undefined) {
                                    const fetched = json as MultiNetworksDeployments;
                                    return fetched;
                                } else {
                                    const fetched = json as NetworkDeployments;
                                    const converted = this._convertToMultiNetworksDeployments(fetched);
                                    return converted;
                                }
                            })
                            .catch((e: any) => {
                                console.error(`error loading ${typeof configItem} config from ${configItem}`, e);
                                return ({} as any) as MultiNetworksDeployments;
                            });
                    } else {
                        if (configItem.chainId === undefined) {
                            return Promise.resolve(configItem as MultiNetworksDeployments);
                        } else {
                            const conf = configItem as NetworkDeployments;
                            const converted = this._convertToMultiNetworksDeployments(conf);
                            return Promise.resolve(converted);
                        }
                    }
                }
            )
        );

        const result = configurations.reduce((prev, curr) => ({ ...prev, ...curr }));
        return result;
    }
}
