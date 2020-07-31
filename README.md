# Ethereum environments manager

## Introduction

Manage providers and contracts through configuration and/or code for browser or node.

```javascript
const { Web3Manager } = require('ethenv');
const manager = await Web3Manager.get();
const contract = await manager.getContract('MyContract');
```
Cross-connectivity environment for javascript Ethereum clients. Can be used in browser and node.

### Requirements

-   Node `v11.x` is required to build the dependencies.

### Installation

```bash
yarn add ethenv
```

or

```bash
npm install ethenv
```

### Usage

```typescript
import {
    Web3Environment,
    Web3EnvironmentsManager,
    Web3EnvironmentsManagerLoader,
} from 'ethenv';

let loader = new Web3EnvironmentsManagerLoader();
let manager = await loader.load(); // loads the default configs (localhost)
let web3 = await manager.getWeb3();
// let environment = await manager.getEnvironment();
// let web3FromEnvironment = await environment.getWeb3();

let contract = await manager.getContract('HelloContract');
// let contractFromEnvironment = await environment.getContract('HelloContract');
```

### Configuration

Providers configuration:

```typescript
{
    defaultProvider: '1.mainnet', // chainId.network
    providers: {
        '1': {
            // chainId
            mainnet: {
                // network
                url: 'https://provider1.myapp_mainnet.com',
                options: {
                    transactionBlockTimeout: '50',
                },
                contracts: {
                    HelloContract: {
                        // provider attributes override by contract name
                        url: 'wss://provider2.myapp_mainnet.com',
                        options: {
                            // Warning: "transactionBlockTimeout" will not be kept from the parent
                            transactionConfirmationBlocks: '3',
                        },
                    },
                },
            },
        },
        '4': {
            // chainId
            rinkeby: {
                // network
                url: 'https://provider1.myapp_rinkeby.com',
            },
            rinkeby_qa: {
                // network
                url: 'https://provider2.myapp_rinkeby.com',
            },
        },
    },
}
```

Deployments configuration:

```typescript
{
    '1': {
        // chainId
        mainnet: {
            // network
            contracts: {
                HelloContract: {
                    address: '0x11',
                    abi: [],
                },
            },
        },
    },
    '4': {
        // chainId
        rinkeby: {
            // network
            contracts: {
                HelloContract: {
                    address: '0x22',
                    abi: [],
                },
            },
        },
        rinkeby_qa: {
            // network
            contracts: {
                HelloContract: {
                    address: '0x33',
                    abi: [],
                },
                TestContract: {
                    address: '0x44',
                    abi: [],
                },
            },
        },
    },
}
```

### Features

-   Load configuration files. Contracts configurations are compatible with the `--export-all` option of `buidler-deploy`.
-   Create cached Web3 instance.
-   Create a Contract instance from internally managed Web3 instance or an externally-managed Web3 instance.
-   Disconnect provider connections.

### Interfaces

-   `Environment` - an environment managing a pool of connections for a given network
-   `EnvironmentsManager` - an environments manager
-   `EnvironmentsManagerLoader` - a loader to instantiate an environments manager.

### Classes

-   `Web3Environment` - the Web3 implementation of `Environment`.
-   `Web3EnvironmentsManager` - the Web3 implementation of `EnvironmentsManager`.
-   `Web3EnvironmentsManagerLoader` - the Web3 implementation of `EnvironmentsManagerLoader`.

### Caveat

-   For `Web3Environments.getContract()` and `Web3EnvironmentsLoader.loadEnvironmentsManager()` to work in node.js, it is necessary to polyfill fetch api before bootstrapping. The suggested dependency to polyfill is `cross-fetch` https://www.npmjs.com/package/cross-fetch
