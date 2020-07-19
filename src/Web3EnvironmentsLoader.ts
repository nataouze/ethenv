// tslint:disable-next-line no-implicit-dependencies
import 'cross-fetch/polyfill';
import {
    ContractsConfig,
    EnvironmentsConfig,
    ProvidersConfig,
    EnvironmentsManagerConfig,
    EnvironmentsManager,
    EnvironmentsManagerLoaderConfig,
    EnvironmentsManagerLoader,
} from './types';
import Web3Environments from './Web3Environments';
import { buildConfig } from './utils';

export default class Web3EnvironmentsLoader implements EnvironmentsManagerLoader {
    public readonly config: EnvironmentsManagerLoaderConfig;

    constructor(config: EnvironmentsManagerLoaderConfig) {
        this.config = config;
    }

    /**
     * Loads the configuration and instantiates an EnvironmentsManager.
     * @param config the configrations.
     */
    public async loadEnvironmentsManager(): Promise<EnvironmentsManager> {
        const [providers, environments, contracts] = await Promise.all([
            buildConfig<ProvidersConfig>(this.config.providers),
            buildConfig<EnvironmentsConfig>(this.config.environments),
            buildConfig<ContractsConfig>(this.config.contracts),
        ]);

        const environmentsManagerConfig: EnvironmentsManagerConfig = {
            providers,
            environments,
            contracts,
        };

        return new Web3Environments(environmentsManagerConfig);
    }
}
