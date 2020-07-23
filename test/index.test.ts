// tslint:disable-next-line no-implicit-dependencies
import 'cross-fetch/polyfill';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import 'chai/register-should';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { Environment, EnvironmentsManager, EnvironmentsManagerLoader } from '../src/types';
import Web3Environment from '../src/web3/Environment';
import Web3EnvironmentsManager from '../src/web3/EnvironmentsManager';
import Web3EnvironmentsManagerLoader from '../src/web3/EnvironmentsManagerLoader';

import providersConf from './configs/providers.json';
import deploymentsConf from './configs/deployments.json';
import mainnetDeploymentsConf from './configs/deployments.1.mainnet.json';
import rinkebyDeploymentsConf from './configs/deployments.4.rinkeby.json';

function itShouldProvideWeb3Connectivity() {
    it('should provide web3 connectivity', async function () {
        this.manager.should.not.be.undefined;
        this.manager.should.not.be.null;
        this.manager.should.be.instanceof(Web3EnvironmentsManager);
        const environment: Environment = await this.manager.getEnvironment();
        environment.should.not.be.undefined;
        environment.should.not.be.null;
        environment.should.be.instanceof(Web3Environment);
        const web3FromManager = await this.manager.getWeb3();
        web3FromManager.should.not.be.undefined;
        web3FromManager.should.not.be.null;
        web3FromManager.should.be.instanceof(Web3);
        await web3FromManager.eth.getBalance('0xc974C5f0C5b0662E00a54139C039273608b74754');
        const web3FromEnvironment = await environment.getWeb3();
        web3FromEnvironment.should.not.be.undefined;
        web3FromEnvironment.should.not.be.null;
        web3FromEnvironment.should.be.instanceof(Web3);
        await web3FromEnvironment.eth.getBalance('0xc974C5f0C5b0662E00a54139C039273608b74754');
    });
}

function itShouldFailAtConnecting() {
    it('should fail at connecting', async function () {
        this.manager.should.not.be.undefined;
        this.manager.should.not.be.null;
        this.manager.should.be.instanceof(Web3EnvironmentsManager);
        const environment: Environment = await this.manager.getEnvironment();
        environment.should.not.be.undefined;
        environment.should.not.be.null;
        environment.should.be.instanceof(Web3Environment);
        const web3 = await environment.getWeb3();
        expect(web3.eth.getBalance('0xc974C5f0C5b0662E00a54139C039273608b74754')).to.eventually.be.rejected;
    });
}

function itShoulProvideContracts() {
    it('should provide contracts', async function () {
        this.manager.should.not.be.undefined;
        this.manager.should.not.be.null;
        this.manager.should.be.instanceof(Web3EnvironmentsManager);
        const environment: Environment = await this.manager.getEnvironment('1.mainnet');
        environment.should.not.be.undefined;
        environment.should.not.be.null;
        environment.should.be.instanceof(Web3Environment);
        const contractFromManager = await this.manager.getContract('MyInventory', '1.mainnet');
        contractFromManager.should.not.be.undefined;
        contractFromManager.should.not.be.null;
        contractFromManager.should.be.instanceof(Contract);
        const contractFromEnvironment = await environment.getContract('MyInventory');
        contractFromEnvironment.should.not.be.undefined;
        contractFromEnvironment.should.not.be.null;
        contractFromEnvironment.should.be.instanceof(Contract);
    });
}

async function createLoader() {
    const loader: EnvironmentsManagerLoader = new Web3EnvironmentsManagerLoader();
    this.loader = loader;
}

describe('Web3EnvironmentsManagerLoader', function () {
    describe('default providers, single object multi network deployments', function () {
        before(createLoader);
        before(async function () {
            const manager: EnvironmentsManager = await this.loader.load(undefined, deploymentsConf);
            this.manager = manager;
        });
        itShouldProvideWeb3Connectivity();
    });
    describe('single object providers, single object multi network deployments', function () {
        before(createLoader);
        before(async function () {
            const manager: EnvironmentsManager = await this.loader.load(providersConf, deploymentsConf);
            this.manager = manager;
        });
        itShouldFailAtConnecting();
        // itShouldProvideContracts();
    });
});
