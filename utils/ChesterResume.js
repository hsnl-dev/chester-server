const Web3 = require('web3');
const {ETHEREUM_URL} = require('../config');
const web3 = new Web3(ETHEREUM_URL);
const account = web3.eth.accounts.decrypt(
  require('../0x4d416C071305B9549AC31325d3CB9Fd0C235E5F9.json'),
  'hsnl33564'
);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultChain = 'goerli';
web3.eth.defaultHardfork = 'istanbul';

const contractAddress = '0x565c34D70da18cE2168Ca08A3941d4Af0b12F4Cd';

const abi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "Database",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "traceID",
				"type": "string"
			},
			{
				"internalType": "bytes32",
				"name": "dataHash",
				"type": "bytes32"
			}
		],
		"name": "append",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "traceID",
				"type": "string"
			}
		],
		"name": "query",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const deploy = async () => {
  const contract = new web3.eth.Contract(abi);
  const receipt = await contract
    .deploy({
      data: ''
    }).send({
      from: account.address,
      gas: '4700000'
    });
  console.log(receipt.options.address);
  return receipt;
};

const append = async (trace_id, hash) => {
  try {
    const contract = new web3.eth.Contract(abi, contractAddress);
    const receipt = await contract.methods
      .append(trace_id, hash)
      .send({
        from: account.address,
        gas: '4700000'
      });
    return Promise.resolve(receipt);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

const query = async (trace_id) => {
  try {
    const contract = new web3.eth.Contract(abi, contractAddress);
    const receipt = await contract.methods
      .query(trace_id)
      .call();
    return Promise.resolve(receipt);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

module.exports = {deploy, append, query};