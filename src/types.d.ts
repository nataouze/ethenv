import Web3 from 'web3';
import { Web3ModuleOptions } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';

export interface ProvidersConfig {
    [provider: string]: string;
}

export interface ContractsConfig {
    [chaindId: string]: {
        [network: string]: {
            [contract: string]: {
                address: string;
                abi: AbiItem[];
            };
        };
    };
}

export interface EnvironmentsConfig {
    [environment: string]: {
        chainId: string;
        network: string;
        provider: string;
        options: Web3ModuleOptions;
    };
}

export interface EnvironmentsManagerConfig {
    providers: ProvidersConfig;
    environments: EnvironmentsConfig;
    contracts: ContractsConfig;
}

/**
 *
 */
export interface EnvironmentsManager {
    readonly config: EnvironmentsManagerConfig;

    /**
     * Instantiates or retrieves a cached Web3 Contract instance.
     * @param contract the name of the contract to instantiate.
     * @param environment the name of the environment in which to retrieve the contract information.
     */
    getContract(contract: string, environment: string): Promise<Contract>;

    /**
     * Instantiates or retrieves a cached Web3 instance.
     * @param environment the name of the environment for which to instantiate the returned Web3 instance.
     */
    getWeb3(environment: string): Promise<Web3>;

    /**
     * Instantiates a Web3 contract through an externally managed Web3 instance.
     * The Web3 instance will not be cached.
     * @param contract the name of the contract to retrieve.
     * @param environment the name of the environment in which to retrieve the contract information.
     * @param web3 an externally managed Web3 instance which will be used to create the returned Web3 Contract instance.
     */
    getWeb3Contract(contract: string, environment: string, web3: Web3): Promise<Contract>;
}

export interface EnvironmentsManagerLoaderConfig {
    providers: ProvidersConfig[] | string[];
    environments: EnvironmentsConfig[] | string[];
    contracts: ContractsConfig[] | string[];
}

export interface EnvironmentsManagerLoader {
    readonly config: EnvironmentsManagerLoaderConfig;

    /**
     * Loads the configuration and instantiates an EnvironmentsManager.
     * @param config the configrations.
     */
    loadEnvironmentsManager(config: EnvironmentsManagerLoaderConfig): Promise<EnvironmentsManager>;
}
