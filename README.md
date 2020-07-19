# Ethereum enrionments manager

## Introduction

Cross-connectivity environment for javascript Ethereum clients. Can be used in browser and node.

### Requirements

-   Node `v11.x` is required to build the dependencies.

### Installation

```bash
yarn add eth-environments-manager
```

or

```bash
npm install eth-environments-manager
```

### Features

-   Load configuration files. Contracts configurations are compatible with the `--export-all` option of `buidler-deploy`.
-   Create a Web3 instance for a named environment.
-   Create a Web3 Contract instance for a named environment and a contract deployment name.
-   Create a Web3 Contract based on an externally-managed Web3 instance, for a named environment and a contract deployment name. For example when using an injected wallet. Compatible with Metamask and other wallets.
-   Disconnect provider connections.

### Interfaces

-   `EnvironmentsManager` - the Ethereum environments manager interface
-   `EnvironmentsManagerLoader` - the loader that assembles configurations and instantiates ``EnvironmentsManager`.

### Classes

-   `Web3Environments` - the Web3 implementation of `EnvironmentsManager`.
-   `Web3EnvironmentsLoader` - the Web3 implementation of `EnvironmentsManagerLoader`.

### Apis

```typescript
Web3Environments.getContract(contract, environment): Promise<Contract>
Web3Environments.getWeb3(environment): Promise<Web3>
Web3Environments.getWeb3Contract(contract, environment, web3): Promise<Contract>

Web3EnvironmentsLoader.loadEnvironmentsManager(): Promise(EnvironmentsManager);
```

### Configs

Both `EnvironmentsManager` and `EnvironmentsManagerLoader` takes config in the constructor.

-   Sample providers config file

```json
{
    "alchemy.rinkeby.http": "https://alchemy.mainnet",
    "alchemy.rinkeby.ws": "wss://alchemy.mainnet",
    "infura.rinkeby.http": "https://rinkeby.mainnet",
    "infura.rinkeby.ws": "wss://rinkeby.mainnet"
}
```

-   Sample environments config file

```json
{
    "mainnet.dev.http": {
        "chainId": "1",
        "network": "mainnet",
        "provider": "infura.mainnet.http",
        "options": {}
    },
    "mainnet.dev.ws": {
        "chainId": "1",
        "network": "mainnet",
        "provider": "infura.mainnet.ws",
        "options": {}
    },
    "rinkeby.dev.http": {
        "chainId": "4",
        "network": "rinkeby",
        "provider": "infura.rinkeby.http",
        "options": {}
    },
    "rinkeby.dev.ws": {
        "chainId": "4",
        "network": "rinkeby",
        "provider": "infura.rinkeby.ws",
        "options": {}
    }
}
```

-   Sample contracts config file.

```json
{
    "4": {
        "rinkeby": {
            "contracts": {
                "Contract1": {
                    "address": "0x1111111111111111111111111111111111111111",
                    "abi": []
                },
                "Contract2": {
                    "address": "0x2222222222222222222222222222222222222222",
                    "abi": []
                }
            }
        }
    }
}
```

### Usage

- Example

```typescript
import { Web3EnvironmentsLoader } from 'ethenv';
const loader = new Web3EnvironmentsLoader(config);
const web3Environments = await loader.loadEnvironmentsManager();
console.log(web3Environments.config);
const contract = await web3Environments.getContract('Bytes', 'localhost.http');
console.log(contract.address);
```

### Caveat

-   For `Web3Environments.getContract()` and `Web3EnvironmentsLoader.loadEnvironmentsManager()` to work in node.js, it is necessary to polyfill fetch api before bootstrapping. The suggested dependency to polyfill is `cross-fetch` https://www.npmjs.com/package/cross-fetch
