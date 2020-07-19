import 'cross-fetch/polyfill';
// import {should} from 'chai';
import { expect } from 'chai';
import 'chai/register-should';
import Web3Environments from '../src/Web3Environments';
import Web3EnvironmentsLoader from '../src/Web3EnvironmentsLoader';
import contractsConf from './configs/contracts.json';
import localProvidersConf from './configs/providers.localhost.json';
import mainnetProvidersConf from './configs/providers.mainnet.json';
import rinkebyProvidersConf from './configs/providers.mainnet.json';
import prodEnvironmentsConf from './configs/environments.prod.json';
import devEnvironmentsConf from './configs/environments.dev.json';

function itShouldCreateWeb3Environments() {
    it('creates the Web3Environments successfully', async function () {
        const loader = new Web3EnvironmentsLoader(this.config);
        const web3Environments = await loader.loadEnvironmentsManager();
        console.log(web3Environments.config);
        web3Environments.should.not.be.undefined;
        web3Environments.should.not.be.null;
        web3Environments.should.be.instanceof(Web3Environments);
        // const contract = await web3Environments.getContract('Bytes', 'localhost.http');
        // console.log(contract.address);
    });
}

describe('Web3EnvironmentsLoader', function () {
    describe('all object configs', function () {
        before(async function () {
            this.config = {
                providers: [mainnetProvidersConf, rinkebyProvidersConf, localProvidersConf],
                environments: [prodEnvironmentsConf, devEnvironmentsConf],
                contracts: [contractsConf],
            };
        });

        itShouldCreateWeb3Environments();
    });
});
