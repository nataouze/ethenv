import { Web3Manager } from '..';

const myAddress = '0xabcabc';

(async () => {
    try {
        // Loads an environment manager with the default localhost configuration ('1337.localhost'),
        // then the configurations fetched from PROVIDERS_URLS and DEPLOYMENT_CONTEXTS_URLS environment variables, if any
        const manager = await Web3Manager.get();

        const smallLagOptions = {
            transactionConfirmationBlocks: 2
        }
        const bigLagOptions = {
            transactionConfirmationBlocks: 6
        }

        // Each managed environment will be created by one promise and reused by the others accessing the same environment.
        const multiNetworkBalances = await Promise.all([
            manager.getWeb3(/* will use the default provider, for example '1.mainnet' */).then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3(null /* default provider */, smallLagOptions).then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3(null /* default provider */, bigLagOptions).then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3('1.mainnet').then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3('1.mainnet', smallLagOptions).then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3('1.mainnet', bigLagOptions).then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3('4.rinkeby').then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3('4.rinkeby', smallLagOptions).then((web3) => web3.eth.getBalance(myAddress)),
            manager.getWeb3('4.rinkeby', bigLagOptions).then((web3) => web3.eth.getBalance(myAddress)),
            manager.getContract('DAI' /* default provider */).then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', null /* default provider */, smallLagOptions).then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', null /* default provider */, bigLagOptions).then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', '1.mainnet').then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', '1.mainnet', smallLagOptions).then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', '1.mainnet', bigLagOptions).then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', '4.rinkeby').then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', '4.rinkeby', smallLagOptions).then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            manager.getContract('DAI', '4.rinkeby', bigLagOptions).then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
        ]);
        console.log('balances', multiNetworkBalances);
        // await manager.shutdown(); // optional disconnection of all the environment
    } catch (e) {
        console.error('Error while retrieving user balance:', e);
    }
})().catch((reason) => {
    console.log('Unknown error:', reason);
});
