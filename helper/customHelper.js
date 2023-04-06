var conn = require("../database/connection");
const objectId = require("mongodb").ObjectId;
const md5 = require("md5");
const ethers = require("ethers");
const bip39 = require("bip39");
var crypto = require("crypto");
const nodemailer = require("nodemailer");
const xrpl = require("xrpl")
const PUBLIC_SERVER = "wss://xrplcluster.com/"
//"wss://s.altnet.rippletest.net:51233" for XRP testnet
//twilio details
//const accountSid = 'AC446be32ee53c385a5123c0e54e528894'
//const authToken = '2ca5c750279349adfc7dec1250cbf17c';
const accountSid = 'ACe65e96b00a0aced222f7c58d29196bea'
const authToken = '736538910665b5167d973581514feb61';
const client = require('twilio')(accountSid, authToken);

const { ECPairFactory } = require("ecpair");
const ecc = require("tiny-secp256k1");
const ECPair = ECPairFactory(ecc);
const axios = require("axios");
const hdkey = require("hdkey");
const bitcoin = require("bitcoinjs-lib");
//PROVIDER_SOLANA=https://api.devnet.solana.com
//PROVIDER_SOLANA=https://api.mainnet-beta.solana.com

const solanaWeb3 = require('@solana/web3.js');
const { AccountLayout, TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token')
const connection = new solanaWeb3.Connection(`https://api.mainnet-beta.solana.com`);
//const connection = new solanaWeb3.Connection(`https://api.devnet.solana.com`);
const ed25519 = require('ed25519-hd-key')

var USDTABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "delegate",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "numTokens",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "tokenOwner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "numTokens",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "numTokens",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];
const satoshi = 100000000;
const Web3 = require("web3");
const { resolve } = require("dns");
const { Console } = require("console");
const { base58 } = require("ethers/lib/utils");

// const Web3Client = new Web3('https://speedy-nodes-nyc.moralis.io/1a2b3c4d5e6f1a2b3c4d5e6f/bsc/mainnet');
// const Web3Client = new Web3('https://speedy-nodes-nyc.moralis.io/defd019df2c0685181b50e9a/bsc/testnet')
/**
 *
 * My address
 * {
  private: '9c8f30701655f9afdc7f420776a113996b4fd7d6e4bce10d6623d8069bb25585',
  public: '029ba27a8d118be18a4ceb57ccfd9a555ff6c23b7c0a9784818b1d942de33a3676',
  address: 'BuymfX3aLJgQbQhtYQkeFUYXHenAsVCRXW',
  wif: '0000'
}
 *
 * Recevier Address{
  private: 'c1fa48b5ae27a94467fc75334dc46fdd7c12b69812ceb89933dbdb0d4506aea2',
  public: '03b024ea362bfe31870682905d3186dae6a756fb1525c439ab54df3c4b9da9fad7',
  address: 'CBrQMF7XYSCeww9yQD5Jz7ysngMn92aDad',
  wif: 'Buq6dztFxRvSvtDTUkRqkBFXgGbtP2HNVEmB99dbzwRXbJPjjZu6'
}
**/
module.exports = {
  varifyCredentials: (phone_number, password) => {
    return new Promise(resolve => {
      conn.then(async (db) => {

        let userObject = await db.collection('users').find({ phone_number: phone_number, password: md5(password) }).toArray()
        // console.log('userObject  ', userObject) 
        if (userObject.length > 0) {
          if (userObject[0]['walletAddress']) {
            var convertAddress = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
            var convertAddressWallet = convertAddress.update(userObject[0]['walletAddress'], 'hex', 'utf8')
            convertAddressWallet += convertAddress.final('utf8');
            // console.log('================================', convertAddressWallet);
          }

          if (userObject[0]['privateKey']) {
            console.log('userObject', userObject[0]['privateKey'])
            var convertAddresss = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
            var convertPrivateKey = convertAddresss.update(userObject[0]['privateKey'], 'hex', 'utf8')
            convertPrivateKey += convertAddresss.final('utf8');

          }

          if (userObject[0]['walletAddressBTC']) {
            var convertAddressBTC = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
            var convertAddressWalletBTC = convertAddressBTC.update(userObject[0]['walletAddressBTC'], 'hex', 'utf8')
            convertAddressWalletBTC += convertAddressBTC.final('utf8');
          }

          if (userObject[0]['privateKeyBTC']) {
            var convertAddressBTC = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
            var convertPrivateKeyBTC = convertAddressBTC.update(userObject[0]['privateKeyBTC'], 'hex', 'utf8')
            convertPrivateKeyBTC += convertAddressBTC.final('utf8');
            console.log("🚀 ~ file: customHelper.js ~ line 320 ~ conn.then ~ convertPrivateKeyBTC", convertPrivateKeyBTC)
            // console.log('================================',convertPrivateKeyBTC);
          }
          if (userObject[0]['walletAddressXRP']) {
            var convertAddressXRP = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
            var convertAddressWalletXRP = convertAddressXRP.update(userObject[0]['walletAddressXRP'], 'hex', 'utf8')
            convertAddressWalletXRP += convertAddressXRP.final('utf8');
            console.log("🚀 ~ file: customHelper.js ~ line 326 ~ conn.then ~ convertAddressWalletXRP", convertAddressWalletXRP)
          }

          if (userObject[0]['walletSeedXRP']) {
            var convertAddressXRP = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
            var convertwalletSeedXRP = convertAddressXRP.update(userObject[0]['walletSeedXRP'], 'hex', 'utf8')
            convertwalletSeedXRP += convertAddressXRP.final('utf8');
            console.log("🚀 ~ file: customHelper.js ~ line 332 ~ conn.then ~ convertwalletSeedXRP", convertwalletSeedXRP)
            
            // console.log('================================',convertwalletSeedXRP);
          }

          let returnObject = {
            _id: userObject[0]['_id'],
            email: userObject[0]['email'],
            phone_number: userObject[0]['phone_number'],
            walletAddress: (convertAddressWallet) ? convertAddressWallet : "",
            privateKey: (convertPrivateKey) ? convertPrivateKey : "",
            recoveryPhrase: userObject[0]['recoveryPhrase'],
            //recoveryPhraseBTC: userObject[0]['recoveryPhraseBTC'],
            walletAddressBTC: (convertAddressWalletBTC) ? convertAddressWalletBTC : "",
            privateKeyBTC: (convertPrivateKeyBTC) ? convertPrivateKeyBTC : "",
            walletAddressSOL: (userObject[0]['walletAddressSOL']) ? userObject[0]['walletAddressSOL'] : "",
            privateKeySOL: (userObject[0]['privateKeySOL']) ? userObject[0]['privateKeySOL'] : "",
            walletAddressXRP: (convertAddressWalletXRP) ? convertAddressWalletXRP : "",
            privateKeyXRP: (convertwalletSeedXRP) ? convertwalletSeedXRP : "",
            created_date: userObject[0]['created_date'],
          }
          resolve(returnObject)
        } else {
          resolve(false)
        }
      })
    })
  },

  isUserAlreadyExists: (phone_number) => {
    return new Promise(resolve => {
      conn.then(async (db) => {
        let count = await db.collection('users').countDocuments({ phone_number: phone_number });
        if (count > 0) {
          resolve(true)
        } else {

          resolve(false)
        }
      })
    })
  },
  //   varifyCredentials: (email, password) => {
  //     return new Promise((resolve) => {
  //       conn.then(async (db) => {
  //         let userObject = await db
  //           .collection("users")
  //           .find({ email: email, password: md5(password) })
  //           .toArray();
  //         // console.log('userObject  ', userObject)
  //         if (userObject.length > 0) {
  //           if (userObject[0]["walletAddress"]) {
  //             var convertAddress = crypto.createDecipher(
  //               "aes-128-cbc",
  //               "bcqr199logic"
  //             );
  //             var convertAddressWallet = convertAddress.update(
  //               userObject[0]["walletAddress"],
  //               "hex",
  //               "utf8"
  //             );
  //             convertAddressWallet += convertAddress.final("utf8");
  //             // console.log('================================', convertAddressWallet);
  //           }
  //           if (userObject[0]["privateKey"]) {
  //             console.log("userObject", userObject[0]["privateKey"]);
  //             var convertAddresss = crypto.createDecipher(
  //               "aes-128-cbc",
  //               "bcqr199logic"
  //             );
  //             var convertPrivateKey = convertAddresss.update(
  //               userObject[0]["privateKey"],
  //               "hex",
  //               "utf8"
  //             );
  //             convertPrivateKey += convertAddresss.final("utf8");
  //             // console.log('convertPrivateKey ================================', convertPrivateKey );
  //           }
  //           if (userObject[0]["walletAddressBTC"]) {
  //             var convertAddressBTC = crypto.createDecipher(
  //               "aes-128-cbc",
  //               "bcqr199logic"
  //             );
  //             var convertAddressWalletBTC = convertAddressBTC.update(
  //               userObject[0]["walletAddressBTC"],
  //               "hex",
  //               "utf8"
  //             );
  //             convertAddressWalletBTC += convertAddressBTC.final("utf8");
  //             // console.log('================================', convertAddressWalletBTC);
  //           }
  //           if (userObject[0]["privateKeyBTC"]) {
  //             var convertAddressBTC = crypto.createDecipher(
  //               "aes-128-cbc",
  //               "bcqr199logic"
  //             );
  //             var convertPrivateKeyBTC = convertAddressBTC.update(
  //               userObject[0]["privateKeyBTC"],
  //               "hex",
  //               "utf8"
  //             );
  //             // convertPrivateKeyBTC = convertPrivateKeyBTC+convertAddressBTC.final('utf8');
  //             // console.log('convertPrivateKeyBTC ================================',convertPrivateKeyBTC);
  //           }
  //           let returnObject = {
  //             _id: userObject[0]["_id"],
  //             email: userObject[0]["email"],
  //             phone_number: userObject[0]["phone_number"],
  //             walletAddress: convertAddressWallet ? convertAddressWallet : "",
  //             privateKey: convertPrivateKey ? convertPrivateKey : "",
  //             recoveryPhrase: userObject[0]["recoveryPhrase"],
  //             recoveryPhraseBTC: userObject[0]["recoveryPhraseBTC"],
  //             walletAddressBTC: convertAddressWalletBTC
  //               ? convertAddressWalletBTC
  //               : "",
  //             privateKeyBTC: convertPrivateKeyBTC ? convertPrivateKeyBTC : "",
  //             created_date: userObject[0]["created_date"],
  //           };
  //           resolve(returnObject);
  //         } else {
  //           resolve(false);
  //         }
  //       });
  //     });
  //   },

  //   isUserAlreadyExists: (phone_number) => {
  //     return new Promise(resolve => {
  //         conn.then(async (db) => {
  //             let count = await db.collection('users').countDocuments({ phone_number: phone_number });
  //             if (count > 0) {
  //                 resolve(true)
  //             } else {

  //                 resolve(false)
  //             }
  //         })
  //     })
  // },
  // isUserAlreadyExists: (email) => {
  //   return new Promise((resolve) => {
  //     conn.then(async (db) => {
  //       let email_new = email.trim().toLowerCase();
  //       let count = await db
  //         .collection("users")
  //         .countDocuments({ email: email_new });
  //       if (count > 0) {
  //         resolve(true);
  //       } else {
  //         resolve(false);
  //       }
  //     });
  //   });
  // },
  sendNumberOtp: (phone_number) => {
    return new Promise(resolve => {
      console.log(phone_number)
      //VA4978eb99f6320245000dad293353ebe5
      // client.verify.v2.services
      //           .create({friendlyName: 'My Verify Service'})
      //           .then(service => console.log(service.sid));
      client.verify.v2.services('VA01f65a6b7fa2a716f9edd3f4aeb11b3c').verifications
        .create({ to: phone_number, channel: 'sms' })
        .then(verification => {
          resolve(verification)
        }).catch(error => {
        });
    })
  },

  varifyOtp: (phone_number, code) => {
    return new Promise(resolve => {
      client.verify.services('VA01f65a6b7fa2a716f9edd3f4aeb11b3c')
        .verificationChecks
        .create({ to: phone_number, code: code })
        .then(verification_check =>
          // console.log(verification_check.status)
          resolve(verification_check)
        );
    })
  },

  saveUserData: (insertData) => {
    return new Promise((resolve) => {
      conn.then(async (db) => {
        let user = await db.collection("users").insertOne(insertData);

        resolve(user.insertedId.toString());
      });
    });
  },

  varifyPasswordAndUpdate: (user_id, oldPassword, newPassword) => {
    return new Promise((resolve) => {
      conn.then(async (db) => {
        let status = await db.collection("users").updateOne(
          {
            password: md5(oldPassword),
            _id: new objectId(user_id.toString()),
          },
          { $set: { password: md5(newPassword) } }
        );
        if (status.modifiedCount > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  },

  updatePassword: (phone_number, password) => {
    return new Promise((resolve) => {
      conn.then(async (db) => {
        let status = await db
          .collection("users")
          .updateOne({ phone_number: phone_number }, { $set: { password: md5(password) } });
        if (status.modifiedCount > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  },

  generateEmailConfirmationCodeSendIntoEmail: (email) => {
    return new Promise((resolve, reject) => {
      conn.then(async (db) => {
        let generatedNumber = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        let updateArry = {
          email_code: parseFloat(generatedNumber),
          code_generate_time: new Date(),
        };

        let where = { email: email };
        db.collection("signup_users_code").updateOne(
          where,
          { $set: updateArry },
          { upsert: true },
          (err, result) => {
            if (err) {
              resolve(false);
            } else {
              let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: "true",
                auth: {
                  user: "vyzmo.123.testing@gmail.com",
                  pass: "vyzmo.123.testing123",
                },
              });

              var info = transporter
                .sendMail({
                  from: "tex4736@gmail.com",
                  to: email,
                  subject: "no_reply",
                  html:
                    "<b>This is your Confirmation Code:" +
                    generatedNumber +
                    "</b>",
                })
                .catch((e) => {
                  resolve(false);
                  console.log(e);
                });
              console.log(info);
              console.log("email send Successfully!!!!");
              resolve(true);
            }
          }
        );
      });
    });
  },

  codeVarifyEmail: (email, code) => {
    return new Promise((resolve) => {
      conn.then((db) => {
        let currentTime = new Date();
        var dd = currentTime.setMinutes(currentTime.getMinutes() - 5);
        currentTime = new Date(dd);

        let match = {
          email: email.toString(),
          email_code: parseFloat(code),
          code_generate_time: { $gte: currentTime },
        };
        db.collection("signup_users_code").countDocuments(
          match,
          async (err, result) => {
            if (err) {
              resolve(false);
            } else {
              resolve(await result);
            }
          }
        );
      });
    });
  },


  validateXRPAddress: (walletAddress) => {
    return new Promise((resolve, reject) => {

      let check = xrpl.isValidAddress(walletAddress)
      if (check === true) {
        resolve(200);
      } else {
        resolve(400);
      }
    })
  },
  estimateFeeForXRPTransaction: (fromAddress, toAddress, amount) => {
    return new Promise(async (resolve) => {
      const xrpAmount = amount.toString();
      try {
        const client = new xrpl.Client(PUBLIC_SERVER)
        await client.connect()
        const prepared = await client.autofill({
          "TransactionType": "Payment",
          "Account": fromAddress,
          "Amount": xrpl.xrpToDrops(xrpAmount),
          "Destination": toAddress
        })
        resolve({ status: 200, message: "Success", estimatedGasFee: xrpl.dropsToXrp(prepared.Fee) });
      } catch (error) {
        resolve({ status: 400, message: "Error. Something Went Wrong", estimatedGasFee: false });
      }
    });
  },

  sendXRPTransaction: (privatekey, amount, fromAddress, toAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        const client = new xrpl.Client(PUBLIC_SERVER)
        await client.connect()
        const wallet = xrpl.Wallet.fromSeed(privatekey)

        const prepared = await client.autofill({
          "TransactionType": "Payment",
          "Account": fromAddress,
          "Amount": xrpl.xrpToDrops(amount.toString()),
          "Destination": toAddress
        });

        const signed = wallet.sign(prepared)
        const tx = await client.submitAndWait(signed.tx_blob)

        console.log("🚀 ~ file: customHelper.js ~ line 678 ~ returnnewPromise ~ signed.hash", signed.hash)

        console.log("🚀 ~ file: customHelper.js ~ line 680 ~ returnnewPromise ~ tx.result.meta.TransactionResult", tx.result.meta.TransactionResult)
        resolve({ status: 200, trasectionHash: signed.hash, message: "Success" });
      } catch (error) {
        resolve({ status: 404, message: error.message });
      }
    })
  },

  XRPTransactionHistory: (walletAddress) => {
    return new Promise(async (resolve) => {
      try {
        const client = new xrpl.Client(PUBLIC_SERVER)
        await client.connect()
        const trans = await client.request({
          "id": 2,
          "command": "account_tx",
          "account": walletAddress,
          "ledger_index_min": -1,
          "ledger_index_max": -1,
          "binary": false,
          "limit": 10,
          "forward": false
        });
        console.log("🚀 ~ file: customHelper.js ~ line 709 ~ returnnewPromise ~ trans", trans.result.transactions)
        resolve({ status: 200, detail: trans.result.transactions });
      } catch (error) {
        resolve({ status: 200, detail: [] });
      }
    })
  },

  createXRPWallet: () => {
    return new Promise(async (resolve) => {
      try {
        // const test_wallet = xrpl.Wallet.generate()
        // console.log("🚀 ~ file: customHelper.js ~ line 630 ~ returnnewPromise ~ test_wallet", test_wallet)
        // process.exit();
        // let check = xrpl.isValidAddress('rUGQnVQzzfCRZYeLB1wcJahHZ1357w3EzB')
        // process.exit();
        const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
        await client.connect()


        const wallet = xrpl.Wallet.fromSeed("sEdSKppwg8ZVvVTeuNXsF67KrcgRWCx")
        //process.exit();
        // const prepared = await client.autofill({
        //   "TransactionType": "Payment",
        //   "Account": 'rUGQnVQzzfCRZYeLB1wcJahHZ1357w3EzB',
        //   "Amount": xrpl.xrpToDrops("22"),
        //   "Destination": "rGDdoXuaZz1BPQbvoB9krPzK3qZ6jZSwqT"
        // })

        const test = await client.request({
          "id": 2,
          "command": "account_tx",
          "account": "rUGQnVQzzfCRZYeLB1wcJahHZ1357w3EzB",
          "ledger_index_min": -1,
          "ledger_index_max": -1,
          "binary": false,
          "limit": 2,
          "forward": false
        })
        //const max_ledger = prepared.LastLedgerSequence
        test.result.transactions

        process.exit();
        console.log("Prepared transaction instructions:", prepared)
        console.log("Transaction cost:", xrpl.dropsToXrp(prepared.Fee), "XRP")
        console.log("Transaction expires after ledger:", max_ledger)

        const signed = wallet.sign(prepared)
        console.log("Identifying hash:", signed.hash)
        console.log("Signed blob:", signed.tx_blob)
        const tx = await client.submitAndWait(signed.tx_blob)

        console.log("Transaction result:", tx.result.meta.TransactionResult)
        console.log("Balance changes:", JSON.stringify(xrpl.getBalanceChanges(tx.result.meta), null, 2))
        // Disconnect when done (If you omit this, Node.js won't end the process)
        client.disconnect()
      } catch (error) {
        resolve(false);
      }
    })
  },

  getXRPBalance: (walletAddress) => {
    return new Promise(async (resolve) => {
      let xrpAmount = 0;
      try {
        const client = new xrpl.Client(PUBLIC_SERVER)
        await client.connect()
        const response = await client.request({
          "command": "account_info",
          "account": walletAddress,
          "ledger_index": "validated"
        })
        let balData = xrpl.dropsToXrp(response.result.account_data.Balance)

        xrpAmount = balData;
        resolve({ xrpBal: xrpAmount, status: 200 });
      } catch (error) {
        resolve({ xrpBal: xrpAmount, status: 200 });
      }
    });
  },

  createTrustWallet: (recoveryPhrase) => {
    return new Promise(async (resolve) => {
      try {
        const seed = await bip39.mnemonicToSeed(recoveryPhrase); //creates seed buffer
        const root = hdkey.fromMasterSeed(seed);
        const BTCPrivateKey = root.privateKey.toString("hex");

        const keyPair = await ECPair.fromPrivateKey(
          Buffer.from(BTCPrivateKey, "hex")
        );
        const wif = keyPair.toWIF(Buffer.from(BTCPrivateKey, "hex"));
        const BTCwalletAddress = bitcoin.payments.p2wpkh({
          pubkey: keyPair.publicKey,
        });

        const derivePath = "m/44'/501'/0'/0'";
        const derivedSeed = ed25519.derivePath(derivePath, seed.toString('hex')).key;
        const keyPairSol = solanaWeb3.Keypair.fromSeed(derivedSeed)
        const walletAddressSOL = keyPairSol.publicKey.toString();
        const privateKeySOL = keyPairSol.secretKey.toString();
        // var addressSol = crypto.createCipher("aes-128-cbc", "bcqr199logic");
        // var walletAddressSOL = addressSol.update(
        //   keyPairSol.publicKey.toString(),
        //   "utf8",
        //   "hex"
        // );

        const accountDetail = await ethers.Wallet.fromMnemonic(recoveryPhrase);

        console.log({
          wallet: accountDetail.address,
          privateKey: accountDetail.privateKey,
        });
        var address = crypto.createCipher("aes-128-cbc", "bcqr199logic");
        var walletAddress = address.update(
          accountDetail.address,
          "utf8",
          "hex"
        );
        walletAddress += address.final("hex");

        var key = crypto.createCipher("aes-128-cbc", "bcqr199logic");
        var privateKey = key.update(accountDetail.privateKey, "utf8", "hex");
        privateKey += key.final("hex");

        var addressBTC = crypto.createCipher("aes-128-cbc", "bcqr199logic");
        var walletAddressBTC = addressBTC.update(
          BTCwalletAddress.address,
          "utf8",
          "hex"
        );
        walletAddressBTC += addressBTC.final("hex");

        var key = crypto.createCipher("aes-128-cbc", "bcqr199logic");
        var privateKeyBTC = key.update(BTCPrivateKey, "utf8", "hex");
        privateKeyBTC += key.final("hex");
        const xrp_wallet = xrpl.Wallet.generate();
        console.log("🚀 ~ file: customHelper.js ~ line 732 ~ returnnewPromise ~ xrp_wallet", xrp_wallet)

        let XrpKey = crypto.createCipher("aes-128-cbc", "bcqr199logic");

        let privateKeyXRP = XrpKey.update(xrp_wallet.privateKey, "utf8", "hex");
        privateKeyXRP += XrpKey.final("hex");
        let addressXRP = crypto.createCipher("aes-128-cbc", "bcqr199logic");
        let walletAddressXRP = addressXRP.update(xrp_wallet.classicAddress, "utf8", "hex");
        walletAddressXRP += addressXRP.final("hex");
        
        let PublicXRP = crypto.createCipher("aes-128-cbc", "bcqr199logic");
        let publicKeyXRP = PublicXRP.update(xrp_wallet.publicKey, "utf8", "hex");
        publicKeyXRP += PublicXRP.final("hex");
        
        let seedXRP = crypto.createCipher("aes-128-cbc", "bcqr199logic");
        let walletSeedXRP = seedXRP.update(xrp_wallet.seed, "utf8", "hex");
        walletSeedXRP += seedXRP.final("hex");

        let accountDetails = {
          recoveryPhrase: recoveryPhrase,
          walletAddress: walletAddress,
          privateKey: privateKey,
          walletAddressBTC: walletAddressBTC,
          privateKeyBTC: privateKeyBTC,
          walletAddressSOL: walletAddressSOL,
          privateKeySOL: privateKeySOL,
          privateKeyXRP: privateKeyXRP,
          walletAddressXRP: walletAddressXRP,
          publicKeyXRP: publicKeyXRP,
          walletSeedXRP: walletSeedXRP,
        };
        console.log("🚀 ~ file: customHelper.js ~ line 884 ~ returnnewPromise ~ accountDetails", accountDetails)
        resolve(accountDetails);
      } catch (error) {
        resolve(false);
      }
    });
  },

  getRecord: () => {
    return new Promise((resolve, reject) => {
      conn.then(async (db) => {
        let data = await db.collection("contract_address").find({}).toArray();
        resolve(data);
      });
    });
  },

  userTokenBalanceByContract: () => {
    return new Promise(async (resolve) => {
      try {
        const contract = await contractAddress;
        var balance = await contract.methods.balanceOf(walletAddress).call();
        var decimals = await contract.methods.decimals().call();
        balance = balance / 10 ** decimals;
        var symbol = await contract.methods.symbol().call();
        let response = {
          balance: balance.toString(),
          symbol: symbol,
        };
        resolve(response);
      } catch (error) {
        resolve(false);
      }
    });
  },

  getWalletAddressBalance: (walletAddress, contractAddress, Web3Client) => {
    return new Promise(async (resolve) => {
      try {
        let contract = new Web3Client.eth.Contract(
          USDTABI, //Abi
          contractAddress //contract address
        );
        let balance = await contract.methods.balanceOf(walletAddress).call();
        var decimals = await contract.methods.decimals().call();
        balance = balance / 10 ** decimals;
        resolve(balance);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  },

  calculateGassLimit: (
    senderWalletAddress,
    nonce,
    contractAddress,
    data,
    Web3Client
  ) => {
    return new Promise(async (resolve) => {
      var gaseLimit = await Web3Client.eth.estimateGas({
        from: senderWalletAddress,
        nonce: nonce,
        to: contractAddress,
        data: data,
      });
      const gassFeeEstimate = gaseLimit * 10;
      resolve(gassFeeEstimate);
    });
  },

  calculateGassLimitEstimate: (
    senderWalletAddress,
    nonce,
    contractAddress,
    data,
    Web3Client
  ) => {
    return new Promise(async (resolve) => {
      var gaseLimit = await Web3Client.eth.estimateGas({
        from: senderWalletAddress,
        nonce: nonce,
        to: contractAddress,
        data: data,
      }); // gwai
      const estimatePrice = gaseLimit / 10 ** 9; // Ether and BNB
      const gassEstimatePrice = estimatePrice * 30;
      resolve(gassEstimatePrice);
    });
  },

  countNonceAndData: (walletAddress, amount, receiverAddress, contract, Web3Client) => {
    return new Promise(async (resolve) => {
      //convert token to wei
      var decimals = await contract.methods.decimals().call();
      const amountIn_new = ((parseFloat(amount) * (10 ** parseFloat(decimals))))
      let amountInWith = await exponentialToDecimalInLibrary(amountIn_new)
      //this.exponentialToDecimal.apply()
      let convertedNumTokens = amountInWith.replaceAll(',', '')
      //let convertedNumTokens = Web3Client.utils.toWei(numTokens.toString(),"ether");
      // // make data for transfer
      const data = contract.methods.transfer(receiverAddress, convertedNumTokens).encodeABI();
      //make raw transaction

      // console.log('data', data)
      // Determine the nonce
      const count = await Web3Client.eth.getTransactionCount(walletAddress);
      // How many tokens do I have before sending?
      const nonce = Web3Client.utils.toHex(count);

      // var gaseLimit = await getGasLimit(walletAddress, nonce, data, process.env.SWERRI_TOKEN_ADDRESS)
      // const estimatePrice = (gaseLimit / 10 ** 9);
      let returnObject = {
        nonce: nonce,
        data: data,
      };
      resolve(returnObject);
    });
  },

  getContractAddressInstanse: (contractAddress, Web3Client) => {
    return new Promise((resolve) => {
      let contract = new Web3Client.eth.Contract(
        USDTABI, //abi
        contractAddress //contract address
      );

      console.log("getContractAddress ----");
      resolve(contract);
    });
  },

  getSwapInstanse: (contractAddress, Web3Client, abi) => {
    return new Promise((resolve) => {
      let contract = new Web3Client.eth.Contract(
        abi, //abi
        contractAddress //contract address
      );

      console.log("getContractAddress ----");
      resolve(contract);
    });
  },

  exponentialToDecimal: (exponential) => {
    return new Promise((resolve) => {

      let decimal = exponential.toString().toLowerCase();
      if (decimal.includes('e+')) {
        const exponentialSplitted = decimal.split('e+');
        let postfix = '';
        for (
          let i = 0;
          i <
          +exponentialSplitted[1] -
          (exponentialSplitted[0].includes('.') ? exponentialSplitted[0].split('.')[1].length : 0);
          i++
        ) {
          postfix += '0';
        }
        const addCommas = text => {
          let j = 3;
          let textLength = text.length;
          while (j < textLength) {
            text = `${text.slice(0, textLength - j)},${text.slice(textLength - j, textLength)}`;
            textLength++;
            j += 3 + 1;
          }
          return text;
        };
        decimal = addCommas(exponentialSplitted[0].replace('.', '') + postfix);
      }
      if (decimal.toLowerCase().includes('e-')) {
        const exponentialSplitted = decimal.split('e-');
        let prefix = '0.';
        for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
          prefix += '0';
        }
        decimal = prefix + exponentialSplitted[0].replace('.', '');
      }
      resolve(decimal.toString());
    });
  },

  //new
  transferTokenToOtherWallets: (
    gaseLimit,
    data,
    walletAddress,
    nonce,
    senderPrivateKey,
    contractAddress,
    Web3Client
  ) => {
    return new Promise(async (resolve) => {
      try {
        const gasLimit = Web3Client.utils.toHex(gaseLimit);
        const gasPrice = Web3Client.utils.toHex(20 * 1e9);
        const value = Web3Client.utils.toHex(Web3Client.utils.toWei('0', 'wei'));

        // Chain ID of Ropsten Test Net is 97, mainNet replace it to 56 for Main Net
        // var chainId = 97;
        var chainId = 56;
        var rawTransaction = {
          from: walletAddress,
          nonce: nonce,
          gasPrice: gasPrice,
          gasLimit: gasLimit,
          to: contractAddress,
          value: value,
          data: data,
          chainId: chainId,
        };
        // console.log('rawTransaction', rawTransaction)
        const signedTx = await Web3Client.eth.accounts.signTransaction(
          rawTransaction,
          senderPrivateKey
        );
        Web3Client.eth.sendSignedTransaction(signedTx.rawTransaction);

        // console.log('check', check)
        let reponseObject = {
          transactionHash: signedTx.transactionHash,
        };
        console.log("reponseObject", reponseObject);
        resolve(reponseObject);
      } catch (error) {
        resolve({ message: error });
      }
    });
  },

  getContractAddress: (symbol, providerType) => {
    return new Promise((resolve) => {
      conn.then(async (db) => {
        let data = await db
          .collection("contract_address")
          .findOne({ symbol: symbol, providerType: providerType });
        if (data) {
          resolve(data.contract_address);
        } else {
          resolve(false);
        }
      });
    });
  },

  addContractAddress: (symbol, contractAddress, providerType, type, url) => {
    return new Promise((resolve) => {
      conn.then(async (db) => {
        let insertObject = {
          contract_address: contractAddress,
          type: type,
          url: url,
          created_date: new Date(),
        };
        db.collection("contract_address").updateOne(
          { symbol: symbol, providerType: providerType },
          { $set: insertObject },
          { upsert: true }
        );
        console.log("done");
        resolve(true);
      });
    });
  },

  addCoin: (symbol, providerType, type, url) => {
    return new Promise((resolve) => {
      conn.then(async (db) => {
        let insertObject = {
          type: type,
          url: url,
          created_date: new Date(),
        };
        db.collection("contract_address").updateOne(
          { symbol: symbol, providerType: providerType },
          { $set: insertObject },
          { upsert: true }
        );
        resolve(true);
      });
    });
  },

  isContractAddressIsValid: (symbol, contract) => {
    return new Promise(async (resolve) => {
      try {
        let decimals = await contract.methods.decimals().call();
        let symbols = await contract.methods.symbol().call();
        console.log("decimals", decimals);
        console.log("symbols", symbols);
        if (symbols && decimals.length > 0) {
          resolve({ message: "Valid", status: 200 });
        } else {
          resolve({
            message:
              "Contract address is valid but not matched with your symbol!!!",
            status: 404,
          });
        }
      } catch {
        resolve({ message: "Contract Address Is Invalid", status: 404 });
      }
    });
  },

  estimateGasForEthTransaction: (
    fromAddress,
    toAddress,
    amount,
    Web3Client
  ) => {
    return new Promise(async (resolve) => {
      try {
        const count = await Web3Client.eth.getTransactionCount(
          fromAddress,
          "latest"
        );
        const nonce = Web3Client.utils.toHex(count);
        let etherValue = Web3Client.utils.toWei(amount.toString(), "ether");
        const transaction = {
          to: toAddress,
          value: etherValue,
          nonce: nonce,
        };
        const estimate = await Web3Client.eth.estimateGas(transaction);
        const estimatePrice = estimate / 10 ** 9;
        const balInEth = await Web3Client.eth.getBalance(fromAddress);
        const ethAmount = Web3Client.utils.fromWei(balInEth, "ether");

        if (estimatePrice + etherValue > ethAmount) {
          resolve({
            error: `Insufficient Funds`,
            status: 404,
          });
        } else {
          resolve({ estimatedGasFee: estimatePrice, status: 200 });
        }
      } catch (error) {
        resolve({ error: error, status: 404 });
      }
    });
  },

  updateUserEmail: (email, user_id) => {
    return new Promise((resolve) => {
      conn.then(async (db) => {
        db.collection("users").updateOne(
          { _id: new objectId(user_id) },
          { $set: { email: email } },
          async (error, result) => {
            if (error) {
              resolve({ status: 404, message: "Database Error" });
            } else {
              let status = await result;
              console.log(status);
              if (status.modifiedCount > 0) {
                resolve({ status: 200, message: "Your E-Mail Has Been Updated Successfully" });
              } else {
                resolve({ status: 404, message: "Your Email Has Already Been Updated" });
              }
            }
          }
        );
      });
    });
  },

  updateTheRecord: (userId, tokenName, status) => {
    return new Promise((resolve, reject) => {
      conn.then(async (db) => {
        db.collection("user_token").updateOne(
          { userId: userId, tokenName: tokenName },
          { $set: { status: status, last_updated_date: new Date() } },
          { upsert: true }
        );
        resolve(true);
      });
    });
  },

  getWebClient: (providerType) => {
    return new Promise((resolve) => {
      let provider = "";
      if (providerType == "ETH") {
        provider =
          "https://mainnet.infura.io/v3/76cb5401dc76458da87b1fbb1f8730fe";
      } else if (providerType == "BNB") {
        provider = "https://bsc-dataseed1.binance.org/"; //'https://speedy-nodes-nyc.moralis.io/defd019df2c0685181b50e9a/bsc/testnet'
      } else {
        console.log("Wrrong provider type");
        resolve(false);
      }
      const Web3Client = new Web3(provider);
      resolve(Web3Client);
    });
  },

  estimateFeeForBTCTransaction: (fromAddress, toAddress, amount) => {
    return new Promise(async (resolve) => {
      const amountIn = Number(amount) * satoshi;
      var newtx = {
        inputs: [{ addresses: [fromAddress] }],
        outputs: [{ addresses: [toAddress], value: amountIn }],
      };
      try {
        const transactionDetail = await axios.post(
          `https://api.blockcypher.com/v1/btc/main/txs/new?token=40fe436d313a412a9b94890d97cf0d84`,
          JSON.stringify(newtx)
        );
        const transactionData = transactionDetail.data;
        const feeInSatoshi = transactionData.tx.fees;
        const balInBTC = feeInSatoshi / satoshi;

        resolve({ status: 200, message: "Success", estimatedGasFee: balInBTC });
      } catch (error) {
        console.log(error.message);
        resolve({
          status: 400,
          message: "Error. Something Went Wrong",
          estimatedGasFee: false,
        });
      }
    });
  },

  validateBitcoinAddress: (toAddress) => {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `https://api.blockcypher.com/v1/btc/main/addrs/${toAddress}/balance?token=40fe436d313a412a9b94890d97cf0d84`
        )
        .then((responce) => {
          console.log(responce.status);
          resolve(responce.status);
        })
        .catch((err) => {
          console.log(err.response.data.error);
          resolve(err.response.status);
        });
    });
  },

  getSolWalletNfts: (walletAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        const wallet = new solanaWeb3.PublicKey(walletAddress);

        const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, { programId: TOKEN_PROGRAM_ID })
        let dataArray = [];
        if (tokenAccounts && tokenAccounts.value.length > 0) {
          tokenAccounts.value.forEach((tokenAccount) => {
            const accountData = AccountLayout.decode(tokenAccount.account.data);
            dataArray.push({ tokenAddress: accountData.mint.toString(), quantity: accountData.amount.toString() })
            console.log(`${accountData.mint}   ${accountData.amount}`);
          });
          resolve(dataArray);
        } else {
          resolve(dataArray);
        }
      } catch (error) {
        resolve([]);

      }
    });
  },

  transferSolanaNfts: (privatekey, mint, toWallet) => {
    return new Promise(async (resolve, reject) => {
      try {

        const usingSplit = privatekey.split(',');
        const secret_key = Uint8Array.from(usingSplit)
        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
        //const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');
        var from = solanaWeb3.Keypair.fromSecretKey(secret_key)
        const mintPublicKey = new solanaWeb3.PublicKey(mint);
        const destPublicKey = new solanaWeb3.PublicKey(toWallet);
        const ownerPublicKey = from.publicKey;

        const mintToken = new Token(
          connection,
          mintPublicKey,
          TOKEN_PROGRAM_ID,
          from.secretKey
        );


        // GET SOURCE ASSOCIATED ACCOUNT
        const associatedSourceTokenAddr = await Token.getAssociatedTokenAddress(
          mintToken.associatedProgramId,
          mintToken.programId,
          mintPublicKey,
          ownerPublicKey
        );
        // GET DESTINATION ASSOCIATED ACCOUNT
        const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
          mintToken.associatedProgramId,
          mintToken.programId,
          mintPublicKey,
          destPublicKey
        );
        const receiverAccount = await connection.getAccountInfo(
          associatedDestinationTokenAddr
        );
        const instructions = [];

        if (receiverAccount === null) {
          console.log("receiver account is null!");
          instructions.push(
            Token.createAssociatedTokenAccountInstruction(
              mintToken.associatedProgramId,
              mintToken.programId,
              mintPublicKey,
              associatedDestinationTokenAddr,
              destPublicKey,
              ownerPublicKey
            )
          );
        }
        instructions.push(
          Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            associatedSourceTokenAddr,
            associatedDestinationTokenAddr,
            ownerPublicKey,
            [],
            1
          )
        );
        // This transaction is sending the tokens
        let transaction = new solanaWeb3.Transaction();
        for (let i = 0; i < instructions.length; i++) {
          transaction.add(instructions[i]);
        }
        if (transaction) {
          var signature = await solanaWeb3.sendAndConfirmTransaction(
            connection,
            transaction,
            [from]
          );
          resolve({
            status: 200,
            trasectionHash: signature,
            message: "Success",
          });
        } else {
          console.log("Transaction error: transaction data is null");
          resolve({ status: 404, message: 'transaction data is null' });
        }

      } catch (error) {
        resolve({ status: 404, message: error.message });
      }
    })
  },

  sendSOLTrasection: (privatekey, amount, fromAddress, toAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        const secretKeyString = privatekey;
        const usingSplit = secretKeyString.split(',');
        const secret_key = Uint8Array.from(usingSplit)
        const recieverWallet = new solanaWeb3.PublicKey(toAddress);
        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
        //const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');

        var from = solanaWeb3.Keypair.fromSecretKey(secret_key)

        const amountInLamports = amount * solanaWeb3.LAMPORTS_PER_SOL;

        var transaction = new solanaWeb3.Transaction().add(
          solanaWeb3.SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: recieverWallet,
            lamports: amountInLamports
          })
        );
        var signature = await solanaWeb3.sendAndConfirmTransaction(
          connection,
          transaction,
          [from]
        );
        resolve({
          status: 200,
          trasectionHash: signature,
          message: "Success",
        });
      } catch (error) {
        resolve({ status: 404, message: error.message });
      }
    })
  },

  sendBTCTrasection: (privatekey, amount, fromAddress, toAddress) => {
    return new Promise(async (resolve, reject) => {
      try {
        const keyPair = await ECPair.fromPrivateKey(Buffer.from(privatekey, "hex"));
        const amountIn = amount * satoshi;
        var newtx = {
          inputs: [{ addresses: [fromAddress] }],
          outputs: [{ addresses: [toAddress], value: amountIn }],
        };

        const transactionDetail = await axios.post(
          `https://api.blockcypher.com/v1/btc/main/txs/new?token=40fe436d313a412a9b94890d97cf0d84`,
          JSON.stringify(newtx)
        );
        const tmptx = transactionDetail.data;
        tmptx.pubkeys = [];
        tmptx.signatures = tmptx.tosign.map(function (tosign, n) {
          tmptx.pubkeys.push(keyPair.publicKey.toString("hex"));
          return bitcoin.script.signature
            .encode(keyPair.sign(Buffer.from(tosign, "hex")), 0x01)
            .toString("hex")
            .slice(0, -2);
        });
        const finalTransaction = await axios.post(
          `https://api.blockcypher.com/v1/btc/main/txs/send?token=40fe436d313a412a9b94890d97cf0d84`,
          JSON.stringify(tmptx)
        );
        const transactionData = finalTransaction.data;
        const TransactionHash = transactionData.tx.hash;
        resolve({ status: 200, trasectionHash: TransactionHash, message: "Success" });
      } catch (error) {
        resolve({ status: 404, message: error.message });
      }
    });
  },

  getSolBalance: (walletAddress) => {
    return new Promise(async (resolve) => {
      try {
        const wallet = new solanaWeb3.PublicKey(walletAddress);
        const balance = await connection.getBalance(wallet);

        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL
        resolve({ solBal: solBalance, balanceInDollar: 0, status: 200 });
      } catch (error) {
        resolve({ solBal: 0, balanceInDollar: 0, status: 200 });
      }
    });
    return new Promise(async (resolve) => {
      let btcAmount = 0;
      try {
        const checkBal = await axios.get(
          `https://api.blockcypher.com/v1/btc/main/addrs/${walletAddress}/balance?token=40fe436d313a412a9b94890d97cf0d84`
        );
        const balData = checkBal.data;
        const balance = balData.final_balance;
        const balInBTC = balance / satoshi;
        btcAmount = balInBTC;
        resolve({ btcBal: btcAmount, status: 200 });
      } catch (error) {
        resolve({ btcBal: btcAmount, status: 200 });
      }
    });
  },


  // getBalancewithWallet: async (walletAddress) => {
  //   return new Promise(async (resolve, reject) => {
  //     let balance = await contract.methods.balanceOf(walletAddress).call();
  //     //get token decimals
  //     var decimals = await contract.methods.decimals().call();
  //     balance = balance / 10 ** decimals;
  //     if (numTokens > balance) {
  //       resolve({
  //         status: false,
  //         message: "Balance is not Enough",
  //       });
  //       // return res.status(400).json({ error: `You do not have enough ${symbol}. Kindly get more ${symbol}  to proceed.` });
  //     } else {
  //       resolve({
  //         status: true,
  //         message: "Balance is Enough",
  //       });
  //     }
  //   });
  // },

  getCryptoInUsd: (newSymbol) => {
    return new Promise(async (resolve, reject) => {
      let response;
      try {
        response = await axios.get(
          `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${newSymbol}`,
          {
            headers: {
              "X-CMC_PRO_API_KEY": "f9ee05ea-6612-4b59-8d6d-15d8cd1909a8",
            },
          }
        );
        let price = response.data.data[newSymbol].quote.USD.price;
        resolve(price);
      } catch (ex) {
        resolve(ex);
      }
    });
  },

  getContractName: (contractAddress) => {
    return new Promise((resolve) => {
      conn.then((db) => {
        db.collection("contract_address").findOne(
          { contract_address: contractAddress },
          async (err, result) => {
            if (err) {
              console.log("Database Error");
              resolve(false);
            } else {
              if (result) {
                let data = await result.symbol;
                console.log(data);
                resolve(data);
              } else {
                console.log("else");
                resolve(false);
              }
            }
          }
        );
      });
    });
  },
};

const exponentialToDecimalInLibrary = (exponential) => {
  return new Promise((resolve) => {

    let decimal = exponential.toString().toLowerCase();
    if (decimal.includes('e+')) {
      const exponentialSplitted = decimal.split('e+');
      let postfix = '';
      for (
        let i = 0;
        i <
        +exponentialSplitted[1] -
        (exponentialSplitted[0].includes('.') ? exponentialSplitted[0].split('.')[1].length : 0);
        i++
      ) {
        postfix += '0';
      }
      const addCommas = text => {
        let j = 3;
        let textLength = text.length;
        while (j < textLength) {
          text = `${text.slice(0, textLength - j)},${text.slice(textLength - j, textLength)}`;
          textLength++;
          j += 3 + 1;
        }
        return text;
      };
      decimal = addCommas(exponentialSplitted[0].replace('.', '') + postfix);
    }
    if (decimal.toLowerCase().includes('e-')) {
      const exponentialSplitted = decimal.split('e-');
      let prefix = '0.';
      for (let i = 0; i < +exponentialSplitted[1] - 1; i++) {
        prefix += '0';
      }
      decimal = prefix + exponentialSplitted[0].replace('.', '');
    }
    resolve(decimal.toString());
  });
}