var express  =  require('express');
var router   =  express.Router();
const helper =  require('../helper/customHelper')
const ethers =  require('ethers')
// require('dotenv').config();
const upload = require('../middleWare/upload');

const dotenv = require('dotenv')
dotenv.config();

const Web3   =  require('web3');
const Web3Client = new Web3('https://bsc-dataseed.binance.org')
// const Web3Client = new Web3('https://speedy-nodes-nyc.moralis.io/defd019df2c0685181b50e9a/bsc/testnet')

router.post('/calculateGassLimit', async (req, res) => {
    if(req.body.walletAddress && req.body.numTokens && req.body.symbol  && req.body.receiverAddress){
        let contractAddress = await helper.getContractAddress(req.body.symbol)

        if(contractAddress){
            let contract = await helper.getContractAddressInstanse(contractAddress)
            let response = await helper.countNonceAndData(req.body.walletAddress, req.body.numTokens, req.body.receiverAddress, contract)

            let nonce = response.nonce;
            let data  = response.data;

            let gaseLimit = await helper.calculateGassLimitEstimate(req.body.walletAddress, nonce, contractAddress, data)
            let responseGass = {
                gaseLimit  :   gaseLimit
            }
            res.status(200).send(responseGass);
        }else{
            let response = {
                message  :   'Contract address is not available against this symbol!!!'
            }
            res.status(404).send(response);
        }
    }else{
        let response = {
            message  :   'Payload missing!!!'
        }
        res.status(404).send(response);
    }
})


router.post('/sendToken', async(req, res) => {
    if(req.body.walletAddress && req.body.numTokens && req.body.symbol && req.body.receiverAddress && req.body.senderPrivateKey){

        let contractAddress = await helper.getContractAddress(req.body.symbol)
        if(contractAddress){
            let contract = await helper.getContractAddressInstanse(contractAddress)
            let response = await helper.countNonceAndData(req.body.walletAddress, req.body.numTokens, req.body.receiverAddress, contract)
            let nonce = response.nonce;
            let data  = response.data;            

            let gaseLimit = await helper.calculateGassLimit(req.body.walletAddress, nonce, contractAddress, data)
            
            console.log('gaseLimit', gaseLimit)
            let balance = await helper.getWalletAddressBalance(req.body.walletAddress, contractAddress)
            console.log('balance of wallet are =====', balance)

            if( balance <  req.body.numTokens ){
                let response = {
                    message  :   `Insufficient balance!!!`
                }
                res.status(404).send(response);
            }else{
        
                let trasctionData = await helper.transferTokenToOtherWallets(gaseLimit, data, req.body.walletAddress, nonce, req.body.senderPrivateKey, contractAddress)
                res.status(200).send(trasctionData);
            }
        }else{
            let response = {
                message  :   'Contract address is not available against this symbol!!!'
            }
            res.status(404).send(response);
        } 
    }else{

        let response = {
            message  :   'Payload missing!!!'
        }
        res.status(404).send(response);
    }
})


router.post('/getBalance', async(req, res) => {
    if(req.body.symbol && req.body.walletAddress){
        let contractAddress = await helper.getContractAddress(req.body.symbol)
        if(contractAddress.length > 0){
            let balance = await helper.getWalletAddressBalance(req.body.walletAddress, contractAddress)

            let response = {
                balance  :   balance
            }
            res.status(200).send(response);
        }else{

            let response = {
                message  :   'Payload missing!!!!!!'
            }
            res.status(404).send(response);
        }
    }else{

        let response = {
            message  :   'Payload missing!!!!!!'
        }
        res.status(404).send(response);
    }
})
 

router.post('/addNewToken', async (req, res) => {
    if(req.body.symbol && req.body.contractAddress){

        let contract    =  await helper.getContractAddressInstanse(req.body.contractAddress)
        let checkStatus =  await helper.isContractAddressIsValid(req.body.symbol, contract);

        console.log('checkStatus', checkStatus)
       
        helper.addContractAddress(req.body.symbol, req.body.contractAddress);
        res.status(checkStatus.status).send(checkStatus);
    }else{

        let response = {
            message  :   'Payload missing!!!'
        }
        res.status(404).send(response);
    }
})


router.post('/sendCoin', async(req, res) => {
    if(req.body.walletAddress && req.body.receiverAddress && req.body.amount && req.body.privateKey){
        let walletAddress = req.body.walletAddress
        let privateKey    = req.body.privateKey
        let receiverAddress = req.body.receiverAddress 
        let amount        = req.body.amount 

        const isvalid = Web3Client.utils.isAddress(receiverAddress);
        console.log(isvalid)
        if(!isvalid){   //Web3Client
            res.status(400).json({ error: `This wallet address is not valid. Kindly confirm the address and try again.` });
        }else{
            
            try{
                //get ether balance before transaction
                const ethBalance = await Web3Client.eth.getBalance(walletAddress)
                console.log(ethBalance)
                // convert amount to ether from wei
                const ethAmount = Web3Client.utils.fromWei(ethBalance, 'ether')
                //cgeck sending amount is greater then ether balance
                if (ethAmount > amount){
                    const count = await Web3Client.eth.getTransactionCount(walletAddress, 'latest')
                    let etherValue = Web3Client.utils.toWei(amount.toString(), 'ether');

                    const transaction = {
                        'to': receiverAddress,
                        'value': etherValue,
                        'gas': 30000,
                        'nonce': count,
                        // optional data field to send message or execute smart contract
                    };

                    const signedTx = await Web3Client.eth.accounts.signTransaction(transaction, privateKey);
                    Web3Client.eth.sendSignedTransaction(signedTx.rawTransaction);
                    // deductTransactionFee(walletDetail.user_id, feeInSwet)
                    return res.status(200).json({ transactionHash: signedTx.transactionHash });
               
                }else{

                    let response = {
                        message  : 'insufficent fund!!!'
                    }
                    res.status(404).send(response);
                }

            }catch(error){
                console.log(error)
                let response = {
                    message  : error
                }
                res.status(404).send(response);
            }
        }
    }else{

        let response = {
            message  :   'Payload missing!!!'
        }
        res.status(404).send(response);
    }
})


router.post('/calculateGassFeeCoin', async(req, res) => {
    if(req.body.walletAddress && req.body.receiverAddress  && req.body.amount){

        const isvalid = await Web3Client.utils.isAddress(req.body.receiverAddress);
        if (!isvalid){
            
            res.status(400).json({ error: `This wallet address is not valid. Kindly confirm the address and try again.` });
        }else{

            let fee = await  helper.estimateGasForEthTransaction(req.body.walletAddress, req.body.receiverAddress, req.body.amount);
            res.status(fee.status).send(fee);
        } 
    }else{

        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})


router.post('/getCoinBalance', async(req, res)=> {
    if(req.body.walletAddress){

        const ethBalance = await Web3Client.eth.getBalance(req.body.walletAddress)
        console.log(ethBalance)
        // convert amount to ether from wei
        const ethAmount = Web3Client.utils.fromWei(ethBalance, 'ether')
        let response = {
            balance  : ethAmount
        }
        res.status(200).send(response);
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})

module.exports = router;