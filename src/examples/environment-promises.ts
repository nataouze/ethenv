import { Web3Environment, Web3Manager } from '..';

const myAddress = '0xabcabc';

// Loads a single environment with the default localhost configuration ('1337.localhost'),
// then the configurations fetched from PROVIDER_URL and DEPLOYMENT_CONTEXT_URL environment variables, if any
Web3Environment.get()
    .then((environment) => {
        return Promise.all([
            environment.getWeb3().then((web3) => web3.eth.getBalance(myAddress)),
            environment.getContract('Coin1').then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
            environment.getContract('Coin2').then((contract) => contract.methods['balanceOf(address)'](myAddress).call()),
        ]).then(([ethBalance, coin1Balance, coin2Balance]) => {
            console.log('ETH', ethBalance, 'Coin1', coin1Balance, 'Coin2', coin2Balance);
        }).catch((reason) => {
            console.error('Error while accessing data from Web3', reason);
        }).finally(() => environment.shutdown());
    })
    .catch((reason) => {
        console.error('Error while loading the environment configurations', reason);
    });

// Loads a single environment with the default localhost configuration ('1337.localhost'),
// then the configurations fetched from urls PROVIDER_URL and DEPLOYMENT_CONTEXT_URL if any
Web3Environment.get()
    .then((environment) => {
        return environment.getWeb3()
            .then((web3) => web3.eth.getBalance(myAddress))
            .then((balance) => {
                console.log('balance', balance);
            })
            .catch((reason) => {
                console.error('Error while accessing data from Web3', reason);
            })
            .finally(() => environment.shutdown());
    })
    .catch((reason) => {
        console.error('Error while loading the environment configurations', reason);
    });
