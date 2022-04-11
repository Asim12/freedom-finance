var conn          =   require("../database/connection");
const objectId    =   require('mongodb').ObjectId;
const md5         =   require('md5')
const ethers      =   require('ethers');
const bip39       =   require('bip39')
var crypto        =   require('crypto');
const nodemailer  =   require("nodemailer");

//twilio details
const accountSid = 'AC446be32ee53c385a5123c0e54e528894'  
const authToken  = '2ca5c750279349adfc7dec1250cbf17c';   
const client     = require('twilio')(accountSid, authToken);

const { ECPairFactory } = require('ecpair');
const ecc = require('tiny-secp256k1')
const ECPair = ECPairFactory(ecc);
const axios = require('axios');
const hdkey = require('hdkey');
const bitcoin = require('bitcoinjs-lib')

var USDTABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
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
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "delegate",
                "type": "address"
            }
        ],
        "name": "allowance",
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
        "inputs": [
            {
                "internalType": "address",
                "name": "delegate",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "numTokens",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "tokenOwner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
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
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
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
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "numTokens",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "numTokens",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
const satoshi = 100000000; 
const Web3   =  require('web3');
const { resolve } = require("dns");
const { Console } = require("console");
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
    varifyCredentials : (email, password) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                console.log('email',  email)
                console.log('password',  password)
                let userObject = await db.collection('users').find({email : email , password : md5(password) }).toArray()

                console.log('userObject  ', userObject) 
                if(userObject.length > 0){
                    if(userObject[0]['walletAddress']){
                        var convertAddress = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
                        var convertAddressWallet = convertAddress.update(userObject[0]['walletAddress'], 'hex', 'utf8')
                        convertAddressWallet += convertAddress.final('utf8');
                        console.log('================================', convertAddressWallet);
                    }

                    if(userObject[0]['privateKey']){
                        console.log('userObject', userObject[0]['privateKey'])
                        var convertAddresss = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
                        var convertPrivateKey = convertAddresss.update(userObject[0]['privateKey'], 'hex', 'utf8')
                        // console.log('convertPrivateKey',convertPrivateKey)
                        // convertPrivateKey += convertAddresss.final('utf8');
                        console.log('convertPrivateKey ================================', convertPrivateKey );
                    }

                    if(userObject[0]['walletAddressBTC']){
                        var convertAddressBTC = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
                        var convertAddressWalletBTC = convertAddressBTC.update(userObject[0]['walletAddressBTC'], 'hex', 'utf8')
                        convertAddressWalletBTC += convertAddressBTC.final('utf8');
                        console.log('================================', convertAddressWalletBTC);
                    }

                    if(userObject[0]['privateKeyBTC']){
                        var convertAddressBTC = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
                        var convertPrivateKeyBTC = convertAddressBTC.update(userObject[0]['privateKeyBTC'], 'hex', 'utf8')
                        // convertPrivateKeyBTC += convertAddressBTC.final('utf8');
                        console.log('================================',convertPrivateKeyBTC);
                    }
                    let returnObject = {
                        _id            :  userObject[0]['_id'],
                        email          :  userObject[0]['email'],
                        phone_number   :  userObject[0]['phone_number'],
                        walletAddress  :  (convertAddressWallet) ? convertAddressWallet : "",
                        privateKey     :  (convertPrivateKey) ? convertPrivateKey: "",
                        recoveryPhrase :  userObject[0]['recoveryPhrase'],
                        recoveryPhraseBTC :  userObject[0]['recoveryPhraseBTC'],
                        walletAddressBTC  :  (convertPrivateKeyBTC) ? convertPrivateKeyBTC : "",
                        privateKeyBTC     :  (convertAddressWalletBTC) ? convertAddressWalletBTC: "",
                        created_date      :  userObject[0]['created_date'],
                    }
                    resolve(returnObject)
                }else{
                    resolve(false)
                }
            })
        })
    },

    isUserAlreadyExists : (email, phone_number) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let email_new  = (email.trim()).toLowerCase();
                let count = await db.collection('users').countDocuments({  '$or': [{email : email_new},{phone_number : phone_number}] });
                if(count > 0){

                    resolve(true)
                }else{

                    resolve(false)
                }
            })
        })
    },

    sendNumberOtp : (phone_number)=> {
        return new Promise(resolve => {
            console.log(phone_number)
            client.verify.services('VA4978eb99f6320245000dad293353ebe5') //service id
            .verifications
            .create({to: phone_number, channel: 'sms'})
            .then(verification => {
                resolve(verification)
            });
        })
    },

    varifyOtp : (phone_number, code) => {
        return new Promise(resolve => {

            client.verify.services('VA4978eb99f6320245000dad293353ebe5')
            .verificationChecks
            .create({to: phone_number, code: code})
            .then(verification_check => 
                // console.log(verification_check.status)
                resolve(verification_check)
                );
        })
    },

    saveUserData : (insertData) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let user = await db.collection('users').insertOne(insertData)

                resolve((user.insertedId).toString());
            })
        })
    },

    varifyPasswordAndUpdate : (user_id , oldPassword , newPassword) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let status = await db.collection('users').updateOne({password : md5(oldPassword), _id : new objectId(user_id.toString())}, {'$set' : {password : md5(newPassword) } })
                if(status.modifiedCount > 0){

                    resolve(true)
                }else{

                    resolve(false)
                }
            })
        })
    },

    updatePassword : (email , password) => {
        return new Promise(resolve => {
            conn.then(async(db) => {

                let status = await db.collection('users').updateOne({email : email}, {'$set' : {password : md5(password) } })
                if(status.modifiedCount > 0){

                    resolve(true)
                }else{

                    resolve(false)
                }
            })
        })
    },

    generateEmailConfirmationCodeSendIntoEmail: (email)=> {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {
                let generatedNumber = (Math.floor(100000 + Math.random() * 900000)).toString();
                let updateArry = {
                    'email_code'            :   parseFloat(generatedNumber),
                    'code_generate_time'    :   new Date()
                }

                let where = {'email' : email};
                db.collection('signup_users_code').updateOne(where, {$set: updateArry},{upsert: true}, (err, result) => {
                    if (err) {

                        resolve(false)
                    } else {
                        let transporter = nodemailer.createTransport({
                            service : 'gmail',
                            host    : 'smtp.gmail.com',
                            secure  : false, 
                            auth: {
                              user  : 'tex4736@gmail.com', 
                              pass  : '9YiRNkTndw67mQh#', 
                            },
                          });
                        
                          var info = transporter.sendMail({
                            from    : 'tex4736@gmail.com', 
                            to      :  email, 
                            subject : "no_reply", 
                            html    : "<b>This is your Confirmation Code:"+generatedNumber+"</b>", 

                        }).catch((e)=> {
                            
                            resolve(false);
                            console.log(e)
                        });
                        console.log(info)
                        console.log('email send Successfully!!!!')
                        resolve (true);
                    }
                })
            })
        })
    },

    codeVarifyEmail: (email, code)=> {
        return new Promise(resolve => {
            conn.then((db) => {
                let currentTime = new Date();
                var dd = currentTime.setMinutes(currentTime.getMinutes() - 5);
                currentTime = new Date(dd);

                let match = {
                    'email'                    :  email.toString(),
                    'email_code'               :  parseFloat(code),
                    'code_generate_time'       :  {'$gte' : currentTime}

                }
                db.collection('signup_users_code').countDocuments(match, async(err, result)=> {
                    if(err){
                        resolve(false)
                    }else{
    
                        resolve(await result)
                    }
                })
            })
        });
    },

    createTrustWallet : (recoveryPhrase) => {
        return new Promise(async(resolve) => {
            try{
                //bitcoin wallet Create
                //Define the network
                // const network = bitcoin.networks.bitcoin //mainnet
                const network = bitcoin.networks.testnet //testnet

                // Derivation path
                // const path = `m/49'/0'/0'/0` // mainnet
                const path = `m/49'/1'/0'/0` // testnet

                const seed = await bip39.mnemonicToSeed(recoveryPhrase); //creates seed buffer
                const root = hdkey.fromMasterSeed(seed)
                const BTCPrivateKey = root.privateKey.toString('hex');
                
                const keyPair = await ECPair.fromPrivateKey(Buffer.from(BTCPrivateKey, 'hex'))
                const wif = keyPair.toWIF(Buffer.from(BTCPrivateKey, 'hex'));
                const  BTCwalletAddress  = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });

                let btcWalletAddress = {
                    BTCPrivateKey,
                    walletAddressBTC : BTCwalletAddress.address,
                }
                console.log('btcWalletAddress: ', btcWalletAddress);

                const accountDetail = await ethers.Wallet.fromMnemonic(recoveryPhrase);

                var address        =  crypto.createCipher('aes-128-cbc', 'bcqr199logic');
                var walletAddress  =  address.update(accountDetail.address, 'utf8', 'hex')  
                walletAddress += address.final('hex');
    
                var key         =  crypto.createCipher('aes-128-cbc', 'bcqr199logic');
                var privateKey  =  key.update(accountDetail.privateKey, 'utf8', 'hex')
                privateKey += key.final('hex');


                var addressBTC        =  crypto.createCipher('aes-128-cbc', 'bcqr199logic');
                var walletAddressBTC  =  addressBTC.update(BTCwalletAddress.address, 'utf8', 'hex')
                walletAddressBTC += addressBTC.final('hex');
    
                var key         =  crypto.createCipher('aes-128-cbc', 'bcqr199logic');
                var privateKeyBTC  =  key.update(BTCPrivateKey, 'utf8', 'hex')

            
                let accountDetails = {
                    recoveryPhrase  :  recoveryPhrase,
                    walletAddress   :  walletAddress,
                    privateKey      :  privateKey,
                    walletAddressBTC   :  walletAddressBTC,
                    privateKeyBTC      :  privateKeyBTC,
                }
                resolve(accountDetails)
            }catch(error){
                resolve(false)
            }
        })
    },

    getRecord : () => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {
                let data = await db.collection('user_token').find({}).toArray()
                resolve(data)
            })
        }) 
    },


    userTokenBalanceByContract : () => {
        return new Promise ( async(resolve) => {
            try {
                const contract = await (contractAddress);
                var balance = await contract.methods.balanceOf(walletAddress).call();
                var decimals = await contract.methods.decimals().call();
                balance = (balance / (10 ** decimals));
                var symbol = await contract.methods.symbol().call();
                let response = {
                    balance : balance.toString(),
                    symbol : symbol
                }
                resolve(response)
            } catch (error) {
                resolve(false)
            }
        })
    },

    getWalletAddressBalance : (walletAddress, contractAddress, Web3Client) => {
        return new Promise(async(resolve) => {
            try {
                let contract = new Web3Client.eth.Contract(
                    USDTABI, //Abi
                    contractAddress //contract address
                );
                let balance = await contract.methods.balanceOf(walletAddress).call();
                console.log('balance helper', balance)
                var decimals = await contract.methods.decimals().call();
                balance = (balance / (10 ** decimals));
                resolve(balance)
            }catch(error){

                console.log(error)
                resolve(false)
            }
        })
    },

    calculateGassLimit : (senderWalletAddress, nonce, contractAddress, data, Web3Client) => {
        return new Promise(async(resolve) => {

            var gaseLimit = await Web3Client.eth.estimateGas({
                "from": senderWalletAddress,
                "nonce": nonce,
                "to": contractAddress,
                "data": data
            });
            const gassFeeEstimate =  gaseLimit * 50
            resolve(gassFeeEstimate);
        })
    }, 

    calculateGassLimitEstimate : (senderWalletAddress, nonce, contractAddress, data, Web3Client) => {
        return new Promise(async(resolve) => {

            var gaseLimit = await Web3Client.eth.estimateGas({
                "from": senderWalletAddress,
                "nonce": nonce,
                "to": contractAddress,
                "data": data
            }); // gwai 
            const estimatePrice     = (gaseLimit / 10 ** 9); // Ether and BNB
            const gassEstimatePrice = estimatePrice * 50
            resolve(gassEstimatePrice);
        })
    }, 

    countNonceAndData : ( walletAddress, numTokens, receiverAddress, contract, Web3Client) => {
        return new Promise(async(resolve) => {

            //convert token to wei
            let convertedNumTokens = Web3Client.utils.toWei(numTokens.toString(), 'ether');
            // // make data for transfer
            const data = contract.methods.transfer(receiverAddress, convertedNumTokens).encodeABI();
            //make raw transaction 

            // console.log('data', data)
            // Determine the nonce
            const count = await Web3Client.eth.getTransactionCount(walletAddress)
            // How many tokens do I have before sending?
            const nonce = Web3Client.utils.toHex(count);

            // var gaseLimit = await getGasLimit(walletAddress, nonce, data, process.env.SWERRI_TOKEN_ADDRESS)
            // const estimatePrice = (gaseLimit / 10 ** 9);
            let returnObject = {
                nonce : nonce,
                data  : data

            }
            resolve(returnObject)
        })
    },

    getContractAddressInstanse : (contractAddress, Web3Client) => {
        return new Promise ( resolve  => {

            let contract = new Web3Client.eth.Contract(
                USDTABI, //abi
                contractAddress //contract address
            );
            resolve(contract)
        })
    },

    //new 
    transferTokenToOtherWallets : (gaseLimit, data, walletAddress, nonce, senderPrivateKey, contractAddress, Web3Client) => {
        return new Promise(async(resolve) => {    
            try {
                const gasLimit = Web3Client.utils.toHex(gaseLimit);
                const gasPrice =Web3Client.utils.toHex(50 * 1e9);
                const value    = Web3Client.utils.toHex(Web3Client.utils.toWei('0', 'wei'));

                // Chain ID of Ropsten Test Net is 97, mainNet replace it to 56 for Main Net
                // var chainId = 97;
                var chainId = 56;
                var rawTransaction = {
                    "from": walletAddress,
                    "nonce": nonce,
                    "gasPrice": gasPrice,
                    "gasLimit": gasLimit,
                    "to": contractAddress,
                    "value": value,
                    "data": data,
                    "chainId": chainId
                };
                // console.log('rawTransaction', rawTransaction)
                const signedTx = await Web3Client.eth.accounts.signTransaction(rawTransaction, senderPrivateKey);
                Web3Client.eth.sendSignedTransaction(signedTx.rawTransaction);

                // console.log('check', check)
                let reponseObject = {
                    transactionHash : signedTx.transactionHash,
                }
                console.log('reponseObject', reponseObject)
                resolve(reponseObject)
            } catch (error) {
                console.log("🚀 ~ file: ether.controller.js ~ line 79 ~ transferTokenToOtherWal ~ error", error)
                resolve({message : error})
            }
        })
    },
    
    getContractAddress : (symbol ,providerType) => {
        return new Promise (resolve => {
            conn.then(async(db) => {
                let data = await db.collection('contract_address').findOne({symbol : symbol, providerType : providerType })
                if(data){
                    resolve(data.contract_address)
                }else{
                    resolve(false)
                }
            })
        })
    },

    addContractAddress : (symbol, contractAddress, providerType, type) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let insertObject = {
                    contract_address : contractAddress,
                    type             : type,
                    created_date     : new Date()
                }
                db.collection('contract_address').updateOne({ symbol : symbol, providerType: providerType}, {$set : insertObject}, {upsert: true})
                console.log('done')
                resolve(true);
            })
        })
    },

    addCoin : (symbol, providerType, type) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let insertObject = {
                    type             : type,
                    created_date     : new Date()
                }
                db.collection('contract_address').updateOne({ symbol : symbol, providerType: providerType}, {$set : insertObject}, {upsert: true})
                resolve(true);
            })
        })
    },

    isContractAddressIsValid : (symbol, contract) => {
        return new Promise(async(resolve) => {
            try{
                let decimals  = await contract.methods.decimals().call();
                let symbols   = await contract.methods.symbol().call();
                console.log('decimals', decimals)
                console.log('symbols', symbols)
                if(symbols == symbol && decimals.length > 0  ){
                    resolve({ message : 'Valid', status : 200 })
                }else{

                    resolve({ message : 'Contract address is valid but not matched with your symbol!!!', status : 404 })
                }
            }catch{
                resolve({ message : 'contract Address is not valid' , status : 404} )
            }
        })
    },

    estimateGasForEthTransaction: (fromAddress, toAddress, amount, Web3Client) => {
        return new Promise (async(resolve) => {
            try {
                const count = await Web3Client.eth.getTransactionCount(fromAddress, 'latest')
                const nonce = Web3Client.utils.toHex(count);
                let etherValue = Web3Client.utils.toWei(amount.toString(), 'ether');
                const transaction = {
                    'to': toAddress,
                    'value': etherValue,
                    'nonce': nonce,
                };
                const estimate = await Web3Client.eth.estimateGas(transaction);
                const estimatePrice = (estimate / 10 ** 9);
                const balInEth = await Web3Client.eth.getBalance(fromAddress)
                const ethAmount = Web3Client.utils.fromWei(balInEth, 'ether')
        
                if (estimatePrice + etherValue > ethAmount){

                    resolve({ error: `You do not have enough amount for further proceed`, status: 404 });
                }else{

                    resolve({ estimatedGasFee: estimatePrice,  status: 200 });
                }
            } catch (error) {

                console.log("🚀 ~ file: ether.controller.js ~ line 486 ~ estimateGasForEthTransaction ~ error", error)
                resolve({ error: error,  status: 404 });
            }
        })
    },

    updateUserEmail : (email, user_id) => {
        return new Promise (resolve => {
            conn.then(async(db) => {

                db.collection('users').updateOne({ _id : new objectId(user_id )}, {'$set' : {email : email}}, async(error, result) => {
                    if(error){

                        resolve({status : 404, message : "database have some issue!!!"})
                    }else{
                        let status = await result;
                        console.log(status)
                        if(status.modifiedCount > 0){

                            resolve({ status  : 200, message : "Email is updated!!" })
                        }else{

                            resolve({ status  : 404, message : "Email is already updated!!" })
                        }
                    }
                })
            })
        })
    },

    updateTheRecord : (userId, tokenName, status) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {
                db.collection('user_token').updateOne({userId : userId, tokenName : tokenName}, {'$set' : {status : status, last_updated_date : new Date() }}, {upsert : true})
                resolve(true)
            })
        }) 
    },

    // getRecord : (userId) => {
    //     return new Promise((resolve, reject) => {
    //         conn.then(async(db) => {
    //             let data = await db.collection('user_token').find({userId : userId}).toArray()
    //             resolve(data)
    //         })
    //     }) 
    // },

    getWebClient : (providerType) => {
        return new Promise(resolve => {
            let provider = '' ;
            if(providerType == "ETH"){
                provider = 'https://rinkeby.infura.io/v3/2b1eac7434014a04b279e24da8abc275'
            }else if(providerType == "BNB"){
                provider = 'https://bsc-dataseed1.binance.org/'//'https://speedy-nodes-nyc.moralis.io/defd019df2c0685181b50e9a/bsc/testnet'
            }else{

                console.log('Wrrong provider type')
                resolve(false)
            }
            const Web3Client = new Web3(provider)
            resolve(Web3Client);
        })
    },

    estimateFeeForBTCTransaction : (fromAddress, toAddress, amount) => {
        return new Promise(async(resolve) => {

            // const BLOCKCYPHER_URL= 'https://api.blockcypher.com/v1/bcy/test/'
            // BLOCKCYPHER_TOKEN=40fe436d313a412a9b94890d97cf0d84
            const amountIn = Number(amount) * satoshi
            var newtx = {
                inputs: [{ addresses: [fromAddress] }],
                outputs: [{ addresses: [toAddress], value: amountIn }]
            };
            try {
                const transactionDetail = await axios.post(`https://api.blockcypher.com/v1/bcy/test/txs/new?token=40fe436d313a412a9b94890d97cf0d84`, JSON.stringify(newtx));
                const transactionData = transactionDetail.data
                const feeInSatoshi = transactionData.tx.fees
                const balInBTC = feeInSatoshi / satoshi;
                               
                resolve({status:200, message : 'Success', estimatedGasFee : balInBTC})
            } catch (error) {
                console.log(error)
                resolve({status:400, message : 'Something went Wrrong!!!', estimatedGasFee : false})
            }
        })
    },

    validateBitcoinAddress:(toAddress) => {
        return new Promise((resolve, reject) => {
            axios.get(`https://api.blockcypher.com/v1/bcy/test/addrs/${toAddress}/balance?token=40fe436d313a412a9b94890d97cf0d84`).then((responce) => {
                console.log(responce.status)
                resolve(responce.status)

            }).catch((err) => {
                console.log( err.response.data.error)
                resolve(err.response.status)
            });
        })
    },

    sendBTCTrasection : (privatekey, amount, fromAddress, toAddress) => {
        return new Promise(async (resolve, reject) => {
            try {

                const keyPair = await ECPair.fromPrivateKey(Buffer.from(privatekey, 'hex'))
                const amountIn = amount * satoshi
                var newtx = {
                    inputs: [{ addresses: [fromAddress] }],
                    outputs: [{ addresses: [toAddress], value: amountIn }]
                };
        
                const transactionDetail = await axios.post(`https://api.blockcypher.com/v1/bcy/test/txs/new?token=40fe436d313a412a9b94890d97cf0d84`, JSON.stringify(newtx));
                const tmptx = transactionDetail.data
                tmptx.pubkeys = [];
                tmptx.signatures = tmptx.tosign.map(function (tosign, n) {
                    tmptx.pubkeys.push(keyPair.publicKey.toString('hex'));
                    return bitcoin.script.signature.encode(
                        keyPair.sign(Buffer.from(tosign, "hex")),
                        0x01,
                    ).toString("hex").slice(0, -2);
                });
                const finalTransaction = await axios.post(`https://api.blockcypher.com/v1/bcy/test/txs/send?token=40fe436d313a412a9b94890d97cf0d84`, JSON.stringify(tmptx))
                const transactionData = finalTransaction.data;
                const TransactionHash = transactionData.tx.hash;
                resolve({status: 200, trasectionHash : TransactionHash, message : 'Success'})
            } catch (error) {
        
                console.log("🚀 ~ file: bitcoin.controller.js ~ line 111 ~ exports.createBTCTransaction= ~ error", error)
                resolve({status : 404, message : error.message });
            }
        })
    },

    getBalance : (walletAddress) => {
        return new Promise(async(resolve) => {
            let btcAmount = 0;
            try {
                const checkBal =  await axios.get(`https://api.blockcypher.com/v1/bcy/test/addrs/${walletAddress}/balance?token=40fe436d313a412a9b94890d97cf0d84`);
                const balData  =  checkBal.data;
                const balance  =  balData.final_balance;
                const balInBTC =  balance / satoshi;
                btcAmount = balInBTC
                console.log("🚀 ~ file: bitcoin.controller.js ~ line 398 ~ exports.getBTCBalanceByUserId= ~ balInBTC", balInBTC)
                resolve({ 'btcBal': btcAmount, status: 200})
            } catch (error) {
                console.log("🚀 ~ file: ether.controller.js ~ line 906 ~ getEtherBalanceByUserId ~ error", error)
                resolve({ 'btcBal': btcAmount, status: 200})
            }
        })
    },

    getCryptoInUsd : (newSymbol) => {
        return new Promise(async (resolve, reject) => {
            let response;
            try {
                response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${newSymbol}`, {
                    headers: {
                        'X-CMC_PRO_API_KEY': 'f9ee05ea-6612-4b59-8d6d-15d8cd1909a8'
                    },
                });                
                let price = response.data.data[newSymbol].quote.USD.price ;
               resolve(price);
            } catch (ex) {
                resolve(ex)
            }
        })
    },

}
