import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { HttpProvider, WebsocketProvider, AbstractSocketProvider } from 'web3-providers';
import { Environment, ProviderConfig, NetworkDeployments } from '../types';
import { Web3ModuleOptions } from 'web3-core';

export default class Web3Environment implements Environment {
    private cachedWeb3s: { [cacheKey: string]: Web3 } = {};

    /**
     * Constructor.
     * @param provider the provider configuration.
     * @param deployments the deployments configuration.
     */
    constructor(public readonly provider: ProviderConfig, public readonly deployments: NetworkDeployments) {}

    /**
     * Lazy loading Web3 instance.
     * @param options: optional argument for Web3 constructor. If defined, will override configuration values.
     */
    async getWeb3(options?: Web3ModuleOptions): Promise<Web3> {
        if (options === undefined) {
            options = this.provider.options || {};
        }
        const cacheKey = `${this.provider.url}.${JSON.stringify(options)}`;
        if (this.cachedWeb3s[cacheKey] === undefined) {
            this.cachedWeb3s[cacheKey] = new Web3(this.provider.url, null, options);
            console.log(`new connection established: '${cacheKey}'`);
        }
        return this.cachedWeb3s[cacheKey];
    }

    /**
     * Returns a Contract instance.
     * @param contractName the name of the deployment to retrieve.
     * @param options: optional argument for Web3 constructor. If defined, will override configuration values.
     * @param web3 optional Web3 instance to use for the contract creation. Will not be cached. If not defined, an instance will be created and cached.
     */
    async getContract(contractName: string, options?: Web3ModuleOptions, web3?: Web3): Promise<Contract> {
        console.log(this.deployments);
        const contract = this.deployments.contracts[contractName];

        if (web3 === undefined) {
            if (options === undefined) {
                options = this.provider.options || {};
            }
            let url = this.provider.url;

            if (this.provider.contracts !== undefined && this.provider.contracts[contractName] !== undefined) {
                const contractOverrides = this.provider.contracts[contractName];
                if (contractOverrides.url !== undefined) {
                    url = contractOverrides.url;
                }
                if (contractOverrides.options) {
                    options = contractOverrides.options;
                }
            }

            const cacheKey = `${url}.${JSON.stringify(options)}`;
            if (this.cachedWeb3s[cacheKey] === undefined) {
                this.cachedWeb3s[cacheKey] = new Web3(url, null, options);
                console.log(`new connection established: '${cacheKey}'`);
            }
            web3 = this.cachedWeb3s[cacheKey];
        }

        return new web3.eth.Contract(contract.abi, contract.address);
    }

    /**
     * For each cached Web3 instance, attempts to disconnect the provider and to delete the cache entry.
     */
    async shutdown(): Promise<void> {
        for (const [cacheKey, web3] of Object.entries(this.cachedWeb3s)) {
            try {
                console.log(`Disconnecting '${cacheKey}'`);
                if (web3.currentProvider instanceof HttpProvider) {
                    (web3.currentProvider as HttpProvider).disconnect();
                } else if (web3.currentProvider instanceof WebsocketProvider) {
                    (web3.currentProvider as WebsocketProvider).disconnect(null, null);
                } else {
                    (web3.currentProvider as AbstractSocketProvider).disconnect(null, null);
                }
                delete this.cachedWeb3s[cacheKey];
            } catch (e) {
                console.warn(`Error while trying to disconnect '${cacheKey}':`, e);
            }
        }
    }
}
