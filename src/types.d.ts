// import 'ethenv/types';
import Web3 from 'web3';
import { Web3ModuleOptions } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

// declare module 'ethenv/types' {

export interface ProviderConfig {
    url: string;
    options?: Web3ModuleOptions;
    contracts?: {
        [contractName: string]: {
            url?: string;
            options?: Web3ModuleOptions;
        };
    };
}

export interface ProvidersConfiguration {
    // provider's format: 'chainId.network'
    defaultProvider?: string; // can be overriden by DEFAULT_PROVIDER environment variable
    providers: { [chaindId: string]: { [network: string]: ProviderConfig } };
}

export interface NamedDeployments {
    [deploymentName: string]: {
        address: string;
        abi: AbiItem[];
        linkedData?: any;
    };
}

export interface NetworkDeployments {
    chainId: string;
    network: string;
    contracts: NamedDeployments;
}

export interface MultiNetworksDeployments {
    [chaindId: string]: { [network: string]: NamedDeployments };
}

export interface Environment {
    readonly provider: ProviderConfig;
    readonly deployments: NetworkDeployments;

    /**
     * Lazy loading Web3 instance.
     */
    getWeb3(options?: Web3ModuleOptions): Promise<Web3>;

    /**
     * Returns a Contract instance.
     * @param contractName the name of the deployment to retrieve.
     * @param options: optional argument for Web3 constructor. If defined, will override configuration values.
     * @param web3: if provided, this Web3 instance will be used to create the Contract, but will not be managed by this environment (for example a browser injected Web3 wallet).
     */
    getContract(contractName: string, options?: Web3ModuleOptions, web3?: Web3): Promise<Contract>;

    /**
     * For each cached Web3 instance, attempts to disconnect the provider and to delete the cache entry.
     */
    shutdown(): Promise<void>;
}

export interface EnvironmentsManager {
    readonly defaultProvider: string;
    readonly providers: ProvidersConfiguration;
    readonly deployments: MultiNetworksDeployments;

    /**
     * Lazy loaded managed Environment instance.
     * @param provider optional provider in format: chainId.network. If not defined, the default provider will be used.
     */
    getEnvironment(provider?: string): Promise<Environment>;

    /**
     * Lazy loaded managed Web3 instance. Creates a managed Environment if necessary.
     * @param provider optional provider in format: chainId.network. If not defined, the default provider will be used.
     * @param options: optional argument for Web3 constructor. If defined, will override configuration values.
     */
    getWeb3(provider?: string, options?: Web3ModuleOptions): Promise<Web3>;

    /**
     * Creates a Contract.
     * @param contractName the name of the contract deployment to retrieve.
     * @param provider optional provider in format: chainId.network. If not defined, the default provider will be used.
     * @param web3 optional Web3 instance to use for the contract creation. If not defined, will retrieve an instance from a managed environment.
     */
    getContract(contractName: string, provider?: string, web3?: Web3): Promise<Contract>;

    /**
     * Shuts down all the managed environments.
     */
    shutdown(): void;
}

export type DeploymentsConfigItem = NetworkDeployments | MultiNetworksDeployments | string; // strings will be fetched as urls
export type DeploymentsConfig = DeploymentsConfigItem | DeploymentsConfigItem[];
export type ProvidersConfigItem = ProvidersConfiguration | string; // strings will be fetched as urls
export type ProvidersConfig = ProvidersConfigItem | ProvidersConfigItem[];
export interface EnvironmentsManagerLoader {
    providers: ProvidersConfiguration;
    deployments: MultiNetworksDeployments;

    /**
     * Loads the configurations and creates a new environments manager;
     * @param providers optional providers configuration(s). If the value is an array, the configurations will be merged in order from left to right. If not defined, a default value will be used.
     * @param deployments the deployments configuration(s). If the value is an array, the configurations will be merged in order from left to right. If not defined, a default value will be used.
     */
    load(providers?: ProvidersConfig, deployments?: DeploymentsConfig): Promise<EnvironmentsManager>;
}
// }
