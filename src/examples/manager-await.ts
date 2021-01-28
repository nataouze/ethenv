import { Web3Manager } from '..';

const myAddress = '0xabcabc';

(async () => {
    try {
        // Loads an environment manager with the default localhost configuration ('1337.localhost'),
        // then the configurations fetched from PROVIDERS_URLS and DEPLOYMENT_CONTEXTS_URLS environment variables, if any
        const manager = await Web3Manager.get();

        const mainnetWeb3 = await manager.getWeb3('1.mainnet');
        const mainnetSmallLag = Number(mainnetWeb3.defaultBlock) - 2;
        const mainnetBigLag = Number(mainnetWeb3.defaultBlock) - 10;

        const rinkebyWeb3 = await manager.getWeb3('4.rinkeby');
        const rinkebySmallLag = Number(rinkebyWeb3.defaultBlock) - 2;
        const rinkebyBigLag = Number(rinkebyWeb3.defaultBlock) - 10;

        const multiNetworkBalances = await Promise.all([
            manager.getWeb3(/* will use the default provider, or use env variable DEFAULT_PROVIDER, for example '1.mainnet' */).then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3(null /* default provider */).then((web3) => web3.eth.getBalance(myAddress, mainnetSmallLag)),
            manager.getWeb3(null /* default provider */).then((web3) => web3.eth.getBalance(myAddress, mainnetBigLag)),
            manager.getWeb3('1.mainnet').then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3('1.mainnet').then((web3) => web3.eth.getBalance(myAddress, mainnetSmallLag)),
            manager.getWeb3('1.mainnet').then((web3) => web3.eth.getBalance(myAddress, mainnetBigLag)),
            manager.getWeb3('4.rinkeby').then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3('4.rinkeby').then((web3) => web3.eth.getBalance(myAddress, rinkebySmallLag)),
            manager.getWeb3('4.rinkeby').then((web3) => web3.eth.getBalance(myAddress, rinkebyBigLag)),
            manager.getContract('DAI' /* default provider */).then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', null /* default provider */, await manager.getWeb3(null)).then((contract) => contract.methods['balanceOf(address)'](myAddress).call(mainnetSmallLag)),
            manager.getContract('DAI', null /* default provider */, await manager.getWeb3(null)).then((contract) => contract.methods['balanceOf(address)'](myAddress).call(mainnetBigLag)),
            manager.getContract('DAI', '1.mainnet').then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', '1.mainnet', await manager.getWeb3('1.mainnet')).then((contract) => contract.methods['balanceOf(address)'](myAddress).call(mainnetSmallLag)),
            manager.getContract('DAI', '1.mainnet', await manager.getWeb3('1.mainnet')).then((contract) => contract.methods['balanceOf(address)'](myAddress).call(mainnetBigLag)),
            manager.getContract('DAI', '4.rinkeby').then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', '4.rinkeby', await manager.getWeb3('4.rinkeby')).then((contract) => contract.methods['balanceOf(address)'](myAddress).call(rinkebySmallLag)),
            manager.getContract('DAI', '4.rinkeby', await manager.getWeb3('4.rinkeby')).then((contract) => contract.methods['balanceOf(address)'](myAddress).call(rinkebyBigLag)),
        ]);
        console.log('balances', multiNetworkBalances);
        // await manager.shutdown(); // optional disconnection of all the environments
    } catch (e) {
        console.error('Error while retrieving user balance:', e);
    }
})().catch((reason) => {
    console.log('Unknown error:', reason);
});
