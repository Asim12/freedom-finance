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

const Web3   =  require('web3');
const { resolve } = require("dns");
// const Web3Client = new Web3('https://speedy-nodes-nyc.moralis.io/1a2b3c4d5e6f1a2b3c4d5e6f/bsc/mainnet');
const Web3Client = new Web3('https://speedy-nodes-nyc.moralis.io/defd019df2c0685181b50e9a/bsc/testnet')

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
                        var convertAddress = crypto.createDecipher('aes-128-cbc', 'bcqr199logic');
                        var convertPrivateKey = convertAddress.update(userObject[0]['privateKey'], 'hex', 'utf8')
                        convertPrivateKey += convertAddress.final('utf8');
                        console.log('================================',convertPrivateKey);
                    }
                
                    let returnObject = {
                        _id            :  userObject[0]['_id'],
                        email          :  userObject[0]['email'],
                        phone_number   :  userObject[0]['phone_number'],
                        walletAddress  :  (convertAddressWallet) ? convertAddressWallet : "",
                        privateKey     :  (convertPrivateKey) ? convertPrivateKey: "",
                        recoveryPhrase :  userObject[0]['recoveryPhrase'],
                        created_date   :  userObject[0]['created_date'],
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
                db.collection('users').insertOne(insertData)
                resolve(true);
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


    createTrustWallet : (walletType, mnemonic_input) => {
        return new Promise(async(resolve) => {
            let mnemonic ; 
            if(walletType == 'create_new'){

                mnemonic = bip39.generateMnemonic()  // for metamask type string bar disease sea primary author praise cash best marine ritual swap gauge
            }else{
                mnemonic = mnemonic_input ; 
            }
            let recoveryPhrase =  mnemonic
            try{
                const accountDetail = await ethers.Wallet.fromMnemonic(recoveryPhrase);
                var address        =  crypto.createCipher('aes-128-cbc', 'bcqr199logic');
                var walletAddress  =  address.update(accountDetail.address, 'utf8', 'hex')
                walletAddress += address.final('hex');
    
                var key         =  crypto.createCipher('aes-128-cbc', 'bcqr199logic');
                var privateKey  =  key.update(accountDetail.privateKey, 'utf8', 'hex')
                 
                privateKey += key.final('hex');
                let accountDetails = {
                    recoveryPhrase  :  recoveryPhrase,
                    walletAddress   :  walletAddress,
                    privateKey      :  privateKey
                }
                resolve(accountDetails)
            }catch(error){
                resolve(false)
            }
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


    getWalletAddressBalance : (walletAddress, contractAddress) => {
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

    calculateGassLimit : (senderWalletAddress, nonce, contractAddress, data) => {
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


    calculateGassLimitEstimate : (senderWalletAddress, nonce, contractAddress, data) => {
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

    countNonceAndData : ( walletAddress, numTokens, receiverAddress, contract) => {
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


    getContractAddressInstanse : (contractAddress) => {
        return new Promise ( resolve  => {

            let contract = new Web3Client.eth.Contract(
                USDTABI, //abi
                contractAddress //contract address
            );
            resolve(contract)
        })
    },

    //old
    transferTokenToOtherWallet : (walletAddress, receiverAddress, numTokens, senderPrivateKey, contractAddress) => {
        return new Promise(async(resolve) => {    
            try {
                let contract = new Web3Client.eth.Contract(
                    USDTABI, //abi
                    contractAddress //contract address
                );
                //convert token to wei
                let convertedNumTokens = Web3Client.utils.toWei(numTokens.toString());
                // // make data for transfer
                const data = contract.methods.transfer(receiverAddress, convertedNumTokens).encodeABI();
                //make raw transaction 


                // Determine the nonce
                const count = await Web3Client.eth.getTransactionCount(walletAddress)
                // How many tokens do I have before sending?
                const nonce = Web3Client.utils.toHex(count);
                console.log("🚀 ~ file: ether.controller.js ~ line 91 ~ makeRawTransaction ~ nonce", nonce)

                var gaseLimit = await Web3Client.eth.estimateGas({
                    "from" : walletAddress,
                    "nonce": nonce,
                    "to"   : contractAddress,
                    "data" : data
                });
                console.log("🚀 ~ file: ether.controller.js ~ line 93 ~ makeRawTransaction ~ gaseLimit", gaseLimit)
                const gasLimit = Web3Client.utils.toHex(gaseLimit);
                const gasPrice = Web3Client.utils.toHex(Web3Client.eth.gasPrice || Web3Client.utils.toHex(2 * 1e9));
                const value    = Web3Client.utils.toHex(Web3Client.utils.toWei('0', 'wei'));

                // Chain ID of Ropsten Test Net is 97, replace it to 56 for Main Net
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
                const signedTx = await Web3Client.eth.accounts.signTransaction(rawTransaction, senderPrivateKey);
                let cehck = await Web3Client.eth.sendSignedTransaction(signedTx.rawTransaction);
                console.log('rawTransaction==>> ', rawTransaction)
                console.log('cehck==>> ', cehck)
                console.log('cehck==>> ', cehck)
                let reponseObject = {
                    transactionHash: signedTx.transactionHash,
                    details : signedTx
                }
                console.log('reponseObject', reponseObject)
                resolve(reponseObject)
            } catch (error) {
                console.log("🚀 ~ file: ether.controller.js ~ line 79 ~ transferTokenToOtherWal ~ error", error)
                resolve({message : error})
            }
        })
    },


    //new 
    transferTokenToOtherWallets : (gaseLimit, data, walletAddress, nonce, senderPrivateKey, contractAddress) => {
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

    
    getContractAddress : (symbol) => {
        return new Promise (resolve => {
            conn.then(async(db) => {
                let data = await db.collection('contract_address').findOne({symbol : symbol })
                console.log('data  ====>>>>>>>> ', data)
                if(data){
                    resolve(data.contract_address)
                }else{
                    resolve(false)
                }
            })
        })
    },


    addContractAddress : (symbol, contractAddress) => {
        return new Promise(resolve => {
            conn.then(async(db) => {
                let insertObject = {
                    contract_address : contractAddress,
                    created_date     : new Date()
                }
                db.collection('contract_address').updateOne({ symbol : symbol}, {$set : insertObject}, {upsert: true})
                console.log('done')
                resolve(true);
            })
        })
    },


    isContractAddressIsValid : (symbol, contract) => {
        return new Promise(async(resolve) => {
            try{
                let decimals = await contract.methods.decimals().call();
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


    estimateGasForEthTransaction: (fromAddress, toAddress, amount) => {
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

    getRecord : (userId) => {
        return new Promise((resolve, reject) => {
            conn.then(async(db) => {
                let data = await db.collection('user_token').find({userId : userId}).toArray()
                resolve(data)
            })
        }) 
    },

}
