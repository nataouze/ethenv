// tslint:disable-next-line no-implicit-dependencies
import 'cross-fetch/polyfill';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import 'chai/register-should';
import 'mocha';
import {
    // ConnectivityEnvironment,
    // ConnectivityManager,
    // ConnectivityLoader,
    // DeploymentContextConfig,
    // MultiDeploymentContextsConfig,
    // ProviderConfig,
    // MultiProvidersConfig,
    DeploymentContextsConfigsArg,
    ProvidersConfigsArg,
} from '../src/types';
import Web3Environment from '../src/web3/Environment';
import Web3Manager from '../src/web3/Manager';
// import Web3Loader from '../src/web3/Loader';

import providersConf = require('./configs/providers.json');
import deploymentsConf = require('./configs/deployments.json');
// const mainnetDeploymentsConf = require('./configs/deployments.1.mainnet.json');
// const rinkebyDeploymentsConf = require('./configs/deployments.4.rinkeby.json');

function itShouldProvideWeb3Connectivity(providers?: ProvidersConfigsArg, deployments?: DeploymentContextsConfigsArg) {
    it('should provide web3 connectivity', async function () {
        const manager = await Web3Manager.get(providers, deployments);
        manager.should.be.instanceof(Web3Manager);
        const environment = await manager.getEnvironment();
        environment.should.be.instanceof(Web3Environment);
        const web3FromManager: Web3 = await manager.getWeb3();
        web3FromManager.should.be.instanceof(Web3);
        await web3FromManager.eth.getBalance('0xc974C5f0C5b0662E00a54139C039273608b74754');
        const web3FromEnvironment = await environment.getWeb3();
        web3FromEnvironment.should.be.instanceof(Web3);
        await web3FromEnvironment.eth.getBalance('0xc974C5f0C5b0662E00a54139C039273608b74754');
    });
}

function itShouldFailAtConnecting(providers?: ProvidersConfigsArg, deployments?: DeploymentContextsConfigsArg) {
    it('should fail at connecting', async function () {
        const manager = await Web3Manager.get(providers, deployments);
        manager.should.be.instanceof(Web3Manager);
        const environment = await manager.getEnvironment();
        environment.should.be.instanceof(Web3Environment);
        const web3 = await environment.getWeb3();
        expect(web3.eth.getBalance('0xc974C5f0C5b0662E00a54139C039273608b74754')).to.eventually.be.rejected;
    });
}

function itShoulProvideContracts(providers?: ProvidersConfigsArg, deployments?: DeploymentContextsConfigsArg) {
    it('should provide contracts', async function () {
        const manager = await Web3Manager.get(providers, deployments);
        manager.should.be.instanceof(Web3Manager);
        const environment = await manager.getEnvironment('1.mainnet');
        environment.should.be.instanceof(Web3Environment);
        const contractFromManager = await manager.getContract('MyInventory', '1.mainnet');
        contractFromManager.should.be.instanceof(Contract);
        const contractFromEnvironment = await environment.getContract('MyInventory');
        contractFromEnvironment.should.be.instanceof(Contract);
    });
}

describe('Web3EnvironmentsManagerLoader', function () {
    describe('default providers, single object multi network deployments', function () {
        // itShouldProvideWeb3Connectivity(providersConf, deploymentsConf);
    });
    describe('single object providers, single object multi network deployments', function () {
        itShouldFailAtConnecting(providersConf, deploymentsConf);
        // itShouldProvideContracts();
    });
});
