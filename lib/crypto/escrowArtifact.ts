// Auto-generated artifact for ExplomateEscrowV2
export const ESCROW_V2_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_adminTreasury",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "tourist",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "touristAmount",
        "type": "uint256"
      }
    ],
    "name": "Refunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "guideAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "adminAmount",
        "type": "uint256"
      }
    ],
    "name": "Released",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Rescued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newTreasury",
        "type": "address"
      }
    ],
    "name": "TreasuryUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "COMMISSION_BPS",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "adminTreasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "bookings",
    "outputs": [
      {
        "internalType": "address",
        "name": "tourist",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "enum ExplomateEscrowV2.BookingStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "guide",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "emergencyRescue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "getBooking",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "tourist",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "guide",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "enum ExplomateEscrowV2.BookingStatus",
            "name": "status",
            "type": "uint8"
          }
        ],
        "internalType": "struct ExplomateEscrowV2.Booking",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "bookingId",
        "type": "bytes32"
      }
    ],
    "name": "release",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_adminTreasury",
        "type": "address"
      }
    ],
    "name": "setAdminTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const ESCROW_V2_BYTECODE = "0x608060405234801561001057600080fd5b5060405161100e38038061100e83398101604081905261002f91610142565b338061005657604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b61005f816100f2565b5060017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00556001600160a01b0381166100cd5760405162461bcd60e51b815260206004820152601060248201526f496e76616c696420747265617375727960801b604482015260640161004d565b600180546001600160a01b0319166001600160a01b0392909216919091179055610172565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b60006020828403121561015457600080fd5b81516001600160a01b038116811461016b57600080fd5b9392505050565b610e8d806101816000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c8063bbacc18711610071578063bbacc1871461013d578063bc94f7f81461019d578063c9e75cb5146101bd578063d687d0b3146101d0578063e5eb9584146101e3578063f2fde38b146101f657600080fd5b806367d42a8b146100b9578063715018a6146100ce5780637249fbb6146100d65780638da5cb5b146100e95780638f9d3c0e1461011357806396cad0db1461012a575b600080fd5b6100cc6100c7366004610c32565b610209565b005b6100cc6103d6565b6100cc6100e4366004610c32565b6103ea565b6000546001600160a01b03165b6040516001600160a01b0390911681526020015b60405180910390f35b61011c6103e881565b60405190815260200161010a565b6001546100f6906001600160a01b031681565b61018c61014b366004610c32565b6002602081905260009182526040909120805460018201549282015460038301546004909301546001600160a01b0392831694831693919092169160ff1685565b60405161010a959493929190610c83565b6101b06101ab366004610c32565b610544565b60405161010a9190610cc1565b6100cc6101cb366004610d2d565b6105ff565b6100cc6101de366004610d4f565b61069a565b6100cc6101f1366004610d8b565b610771565b6100cc610204366004610d2d565b6109eb565b610211610a26565b60008181526002602052604090206001600482015460ff16600381111561023a5761023a610c4b565b146102795760405162461bcd60e51b815260206004820152600a6024820152694e6f742061637469766560b01b60448201526064015b60405180910390fd5b80546001600160a01b031633148061029d575060018101546001600160a01b031633145b806102b257506000546001600160a01b031633145b6102f55760405162461bcd60e51b8152602060048201526014602482015273556e617574686f72697a65642072656c6561736560601b6044820152606401610270565b60048101805460ff1916600217905560038101546000906127109061031d906103e890610de5565b6103279190610e02565b9050600081836003015461033b9190610e24565b6001840154600285015491925061035f916001600160a01b03908116911683610a42565b600154600284015461037e916001600160a01b03918216911684610a42565b604080518281526020810184905285917f086f561142bc4bdbe9350bd28b5eb74b4b2a64b0c54d97c83bea294393d8beb8910160405180910390a25050506103d36001600080516020610e3883398151915255565b50565b6103de610a77565b6103e86000610aa4565b565b6103f2610a26565b60008181526002602052604090206001600482015460ff16600381111561041b5761041b610c4b565b146104555760405162461bcd60e51b815260206004820152600a6024820152694e6f742061637469766560b01b6044820152606401610270565b80546001600160a01b031633148061047757506000546001600160a01b031633145b6104b95760405162461bcd60e51b8152602060048201526013602482015272155b985d5d1a1bdc9a5e9959081c99599d5b99606a1b6044820152606401610270565b60048101805460ff1916600390811790915581549082015460028301546104ee926001600160a01b0391821692911690610a42565b817f1535ab411323bb41ad642ccf14068bbd78818ed38dd9b4421c927cc6eeb07e2d826003015460405161052491815260200190565b60405180910390a2506103d36001600080516020610e3883398151915255565b6105736040805160a0810182526000808252602082018190529181018290526060810182905290608082015290565b600082815260026020818152604092839020835160a08101855281546001600160a01b0390811682526001830154811693820193909352928101549091169282019290925260038083015460608301526004830154919291608084019160ff909116908111156105e5576105e5610c4b565b60038111156105f6576105f6610c4b565b90525092915050565b610607610a77565b6001600160a01b0381166106505760405162461bcd60e51b815260206004820152601060248201526f496e76616c696420747265617375727960801b6044820152606401610270565b600180546001600160a01b0319166001600160a01b0383169081179091556040517f7dae230f18360d76a040c81f050aa14eb9d6dc7901b20fc5d855e2a20fe814d190600090a250565b6106a2610a77565b6106aa610a26565b6001600160a01b0382166106f45760405162461bcd60e51b8152602060048201526011602482015270125b9d985b1a59081c9958da5c1a595b9d607a1b6044820152606401610270565b6107086001600160a01b0384168383610a42565b816001600160a01b0316836001600160a01b03167f3af790fafda720819b2fc6e15090606e81154e0ac9a92d38ecad006d99d20ecc8360405161074d91815260200190565b60405180910390a361076c6001600080516020610e3883398151915255565b505050565b610779610a26565b60008481526002602052604081206004015460ff16600381111561079f5761079f610c4b565b146107dd5760405162461bcd60e51b815260206004820152600e60248201526d426f6f6b696e672065786973747360901b6044820152606401610270565b6001600160a01b0383166108235760405162461bcd60e51b815260206004820152600d60248201526c496e76616c696420677569646560981b6044820152606401610270565b6001600160a01b0382166108695760405162461bcd60e51b815260206004820152600d60248201526c24b73b30b634b2103a37b5b2b760991b6044820152606401610270565b600081116108ae5760405162461bcd60e51b81526020600482015260126024820152710416d6f756e74206d757374206265203e20360741b6044820152606401610270565b6108c36001600160a01b038316333084610af4565b6040805160a0810182523381526001600160a01b0385811660208084019182528683168486019081526060850187815260016080870181815260008d815260029586905298909820875181549088166001600160a01b03199182161782559551818301805491891691881691909117905592519383018054949096169390941692909217909355516003808401919091559351600483018054949593949193909260ff199092169190849081111561097d5761097d610c4b565b021790555050604080516001600160a01b0385811682526020820185905286169250339187917f3b57f71368ad1e9c529271d947f57e4f712a4b2366c5a8787716958f196aac43910160405180910390a46109e56001600080516020610e3883398151915255565b50505050565b6109f3610a77565b6001600160a01b038116610a1d57604051631e4fbdf760e01b815260006004820152602401610270565b6103d381610aa4565b610a2e610b2a565b6002600080516020610e3883398151915255565b610a4f8383836001610b5a565b61076c57604051635274afe760e01b81526001600160a01b0384166004820152602401610270565b6000546001600160a01b031633146103e85760405163118cdaa760e01b8152336004820152602401610270565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b610b02848484846001610bc0565b6109e557604051635274afe760e01b81526001600160a01b0385166004820152602401610270565b600080516020610e38833981519152546002036103e857604051633ee5aeb560e01b815260040160405180910390fd5b60405163a9059cbb60e01b60008181526001600160a01b038616600452602485905291602083604481808b5af192506001600051148316610bb4578383151615610ba7573d6000823e3d81fd5b6000873b113d1516831692505b60405250949350505050565b6040516323b872dd60e01b60008181526001600160a01b038781166004528616602452604485905291602083606481808c5af192506001600051148316610c20578383151615610c13573d6000823e3d81fd5b6000883b113d1516831692505b60405250600060605295945050505050565b600060208284031215610c4457600080fd5b5035919050565b634e487b7160e01b600052602160045260246000fd5b60048110610c7f57634e487b7160e01b600052602160045260246000fd5b9052565b6001600160a01b0386811682528581166020830152841660408201526060810183905260a08101610cb76080830184610c61565b9695505050505050565b81516001600160a01b039081168252602080840151821690830152604080840151909116908201526060808301519082015260808083015160a0830191610d0a90840182610c61565b5092915050565b80356001600160a01b0381168114610d2857600080fd5b919050565b600060208284031215610d3f57600080fd5b610d4882610d11565b9392505050565b600080600060608486031215610d6457600080fd5b610d6d84610d11565b9250610d7b60208501610d11565b9150604084013590509250925092565b60008060008060808587031215610da157600080fd5b84359350610db160208601610d11565b9250610dbf60408601610d11565b9396929550929360600135925050565b634e487b7160e01b600052601160045260246000fd5b8082028115828204841417610dfc57610dfc610dcf565b92915050565b600082610e1f57634e487b7160e01b600052601260045260246000fd5b500490565b81810381811115610dfc57610dfc610dcf56fe9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00a2646970667358221220a8983a6787db8010833c01b4f5cd8db0e207f5493c82911e47ff35756a786d1c64736f6c63430008140033";

export default {
  abi: ESCROW_V2_ABI,
  bytecode: ESCROW_V2_BYTECODE,
};
