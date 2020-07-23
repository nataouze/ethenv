import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import {
    Environment,
    EnvironmentsManager,
    ProviderConfig,
    ProvidersConfiguration,
    MultiNetworksDeployments,
    NetworkDeployments,
    NamedDeployments,
} from '../types';
import Web3Environment from './Environment';
import { Web3ModuleOptions } from 'web3-core';

export default class Web3EnvironmentsManager implements EnvironmentsManager {
    public readonly defaultProvider: string;
    private managedEnvironments: { [provider: string]: Environment } = {};

    /**
     * Constructor.
     * @param providers the providers configuration.
     * @param deployments the deployments configuration.
     */
    constructor(
        public readonly providers: ProvidersConfiguration,
        public readonly deployments: MultiNetworksDeployments
    ) {
        this.defaultProvider = /* env DEFAULT_PROVIDER || */ providers.defaultProvider || '1337.localhost';
    }

    /**
     * Lazy loaded managed Environment instance.
     * @param provider optional provider in format: chainId.network. If not defined, the default provider will be used.
     */
    async getEnvironment(provider?: string): Promise<Environment> {
        if (provider === undefined) {
            provider = this.defaultProvider;
        }

        if (this.managedEnvironments[provider] === undefined) {
            const [chainId, network] = provider.split('.');
            const providerConf: ProviderConfig = this.providers.providers[chainId][network];
            const contracts: NamedDeployments = this.deployments[chainId][network];
            const deploymentsConf: NetworkDeployments = { chainId, network, contracts };
            this.managedEnvironments[provider] = new Web3Environment(providerConf, deploymentsConf);
        }
        return this.managedEnvironments[provider];
    }

    /**
     * Lazy loaded managed Web3 instance. Creates a managed Environment if necessary.
     * @param provider optional provider in format: chainId.network. If not defined, the default provider will be used.
     * @param options: optional argument for Web3 constructor. If defined, will override configuration values.
     */
    async getWeb3(provider?: string, options?: Web3ModuleOptions): Promise<Web3> {
        const environment = await this.getEnvironment(provider);
        return environment.getWeb3(options);
    }

    /**
     * Creates a Contract. Creates a managed environment if necessary.
     * @param contractName the name of the contract deployment to retrieve.
     * @param provider optional provider in format: chainId.network. If not defined, the default provider will be used.
     * @param web3 optional Web3 instance to use for the contract creation. If not defined, will retrieve an instance from a managed environment.
     */
    async getContract(
        contractName: string,
        provider?: string,
        options?: Web3ModuleOptions,
        web3?: Web3
    ): Promise<Contract> {
        const environment = await this.getEnvironment(provider);
        return environment.getContract(contractName, options, web3);
    }

    /**
     * Shuts down all the managed environments.
     */
    async shutdown(): Promise<void> {
        for (const [provider, environment] of Object.entries(this.managedEnvironments)) {
            console.log(`Shutting down environment for provider '${provider}'...`);
            await environment.shutdown();
        }
        console.log('All managed environments have been shut down.');
    }
}
