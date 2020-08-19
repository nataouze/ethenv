import Web3Environment from './web3/Environment';

import provider from '../config/mainnet_1_provider.json';
import context from '../config/mainnet_1_context.json';

(async () => {
    const env = await Web3Environment.get(provider, context);
    const DAI = await env.getContract('DAI');
    const balance = await DAI.methods['balanceOf(address)']('0x5afc06c035619654927614fac6bc1c0413715e59').call();
    console.log(balance.toString());
})();
