// tslint:disable-next-line no-implicit-dependencies
import 'cross-fetch/polyfill';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import 'chai/register-should';
import 'mocha';

import Web3Environment from '../src/web3/Environment';
import Web3Manager from '../src/web3/Manager';
import Web3Loader from '../src/web3/Loader';

import {behavesLikeConnectivityLoader} from './behaviours';


describe('Web3EnvironmentsManagerLoader', function () {
    behavesLikeConnectivityLoader(new Web3Loader());
});
