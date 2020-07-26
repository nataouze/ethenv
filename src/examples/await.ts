import { Web3Environment, Web3Manager } from '..';

const myAddress = '0xabcabc';

(async () => {
    // Without countracts
    try {
        // Loads a single environment with the default localhost configuration ('1337.localhost'),
        // then the configurations fetched from PROVIDER_URL and DEPLOYMENT_CONTEXT_URL environment variables, if any
        const environment = await Web3Environment.get();
        const web3 = await environment.getWeb3();
        const balance = await web3.eth.getBalance(myAddress);
        console.log('balance', balance);
    } catch (e) {
        console.error('Error while retrieving user balance:', e);
    }

    // With contracts
    try {
        // Loads a single environment with the default localhost configuration ('1337.localhost'),
        // then the configurations fetched from PROVIDER_URL and DEPLOYMENT_CONTEXT_URL environment variables, if any
        const environment = await Web3Environment.get();
        const [ethBalance, coin1Balance, coin2Balance] = await Promise.all([
            environment.getWeb3().then((web3) => web3.eth.getBalance(myAddress)),
            environment
                .getContract('Coin1')
                .then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            environment
                .getContract('Coin2')
                .then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
        ]);
        console.log('ETH', ethBalance, 'Coin1', coin1Balance, 'Coin2', coin2Balance);
    } catch (e) {
        console.error('Error while retrieving user balances:', e);
    }
})().catch((reason) => {
    console.log('Unknown error:', reason);
});
