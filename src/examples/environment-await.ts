import { Web3Environment } from '..';

const myAddress = '0xabcabc';

(async () => {
    // Without countracts, without options
    try {
        // Loads a single environment with the default localhost configuration ('1337.localhost'),
        // then the configurations fetched from PROVIDER_URL and DEPLOYMENT_CONTEXT_URL environment variables, if any
        const environment = await Web3Environment.get();
        // Creates the default provider and wraps a Web3 instance with default options around it
        const web3 = await environment.getWeb3();
        const balance = await web3.eth.getBalance(myAddress);
        console.log('balance', balance);
        // await environment.shutdown(); // optional disconnection
    } catch (e) {
        console.error('Error while retrieving user balance:', e);
    }

     // Without countracts, with options
     try {
        // Loads a single environment with the default localhost configuration ('1337.localhost'),
        // then the configurations fetched from PROVIDER_URL and DEPLOYMENT_CONTEXT_URL environment variables, if any
        const environment = await Web3Environment.get();
        // Creates the default provider and wraps a Web3 instance with the default options
        const web3 = await environment.getWeb3();
        // Reuses the default provider and wraps a new Web3 instance with the supplied options
        const beforeTestWeb3 = await environment.getWeb3({
            defaultBlock: 255
        });
        // Reuses the default provider and wraps a new Web3 instance with the supplied options
        const afterTestWeb3 = await environment.getWeb3({
            defaultBlock: 298
        });
        const [balanceBeforeTest, balanceAfterTest, currentBalance] = await Promise.all([
            beforeTestWeb3.eth.getBalance(myAddress),
            afterTestWeb3.eth.getBalance(myAddress),
            web3.eth.getBalance(myAddress),
        ]);
        console.log('balances', balanceBeforeTest, balanceAfterTest, currentBalance);
        // await environment.shutdown(); // optional disconnection
    } catch (e) {
        console.error('Error while retrieving user balances:', e);
    }

    // With contracts
    try {
        // Loads a single environment with the default localhost configuration ('1337.localhost'),
        // then the configurations fetched from PROVIDER_URL and DEPLOYMENT_CONTEXT_URL environment variables, if any
        const environment = await Web3Environment.get();
        // The default provider configuration can be overidden by contract, which can be overriden by user code.
        // The rule of thumb: everything is lazy-loaded and what can be reused will be reused.
        // - There is alway at most 1 provider per connection url,
        // - There can be up to several Web3 instances wrapped around the same provider if they use different options,
        const userOptionsOverride = {};
        const [ethBalance, coin1Balance, coin2Balance] = await Promise.all([
            environment.getWeb3().then((web3) => web3.eth.getBalance(myAddress)),
            environment
                .getContract('Coin1')
                .then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            environment
                .getContract('Coin2', await environment.getWeb3(userOptionsOverride))
                .then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
        ]);
        console.log('ETH', ethBalance, 'Coin1', coin1Balance, 'Coin2', coin2Balance);
        // await environment.shutdown(); // optional disconnection
    } catch (e) {
        console.error('Error while retrieving user balances:', e);
    }
})().catch((reason) => {
    console.log('Unknown error:', reason);
});
