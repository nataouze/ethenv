import isEqual from 'lodash.isequal';
import { ConnectivityLoader, ProviderConfig, MultiProvidersConfig } from '../../src/types'

import defaultProviderConf = require('../environments/1337.localhost/Provider.json');
import localProviderConf1 = require('../environments/1337.localhost/Provider.json');
import localProviderConf2 = require('../environments/1337.localhost_2/Provider.json');
import localMultiProvidersConf = require('../environments/providers/LocalProviders.json');
import localMultiProviders1Conf = require('../environments/providers/LocalProviders.default1.json');
import localMultiProviders2Conf = require('../environments/providers/LocalProviders.default2.json');

import { createLocalFileServer } from '../static.server';

export function behavesLikeConnectivityLoader(loader: ConnectivityLoader) {

    describe('Like a ConnectivityLoader', function () {
        before(function () {
            createLocalFileServer('test/environments');
        });

        describe('loadEnvironment(), providers configuration only', function () {
            context('no argument (default provider)', function () {
                it('loads the default configuration properly', async function () {
                    const environment = await loader.loadEnvironment();
                    isEqual(environment.providerConfig, defaultProviderConf).should.be.true;
                });
            });
            context('from object', function () {
                it('loads the configuration properly', async function () {
                    const argument: ProviderConfig = localProviderConf1;
                    const environment = await loader.loadEnvironment(argument);
                    isEqual(environment.providerConfig, localProviderConf1).should.be.true;
                });
            });
            context('from url', function () {
                it('loads the configuration properly', async function () {
                    const argument: ProviderConfig = localProviderConf1;
                    const environment = await loader.loadEnvironment('http://localhost:9999/1337.localhost/Provider.json');
                    isEqual(environment.providerConfig, localProviderConf1).should.be.true;
                });
            });
        });
        describe('loadEnvironment(), providers configuration only', function () {
            context('no argument (default provider)', function () {
                it('loads the default configuration properly', async function () {
                    const environment = await loader.loadEnvironment();
                    isEqual(environment.providerConfig, defaultProviderConf).should.be.true;
                });
            });
            context('from object', function () {
                it('loads the configuration properly', async function () {
                    const argument: ProviderConfig = localProviderConf1;
                    const environment = await loader.loadEnvironment(argument);
                    isEqual(environment.providerConfig, localProviderConf1).should.be.true;
                });
            });
            context('from url', function () {
                it('loads the configuration properly', async function () {
                    const argument: ProviderConfig = localProviderConf1;
                    const environment = await loader.loadEnvironment('http://localhost:9999/1337.localhost/Provider.json');
                    isEqual(environment.providerConfig, localProviderConf1).should.be.true;
                });
            });
        });
    });
}
