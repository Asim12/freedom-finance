var express  =  require('express');
var router   =  express.Router();
const helper =  require('../helper/customHelper')
const ethers =  require('ethers')
// require('dotenv').config();
const upload = require('../middleWare/upload');

const dotenv = require('dotenv')
dotenv.config();

const Web3       =  require('web3');
// const Web3Client = new Web3('https://bsc-dataseed.binance.org') // mainnet
// const Web3Client = new Web3('https://speedy-nodes-nyc.moralis.io/defd019df2c0685181b50e9a/bsc/testnet') // testnet
//https://rinkeby.infura.io/v3/

const {WETH, ChainId, Route, Router, Fetcher, Trade, TokenAmount, TradeType, Token, Percent } = require('@pancakeswap-libs/sdk'); 
const {JsonRpcProvider} =   require("@ethersproject/providers");
const provider          =   new JsonRpcProvider('https://bsc-dataseed1.binance.org/'); // mainnet
const abi               =   require('../Router2abi.json')
const pancakeSwapRouter2Address  = '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F'; //mainnet address


router.post('/calculateGassLimit', async (req, res) => {
    if(req.body.walletAddress && req.body.numTokens && req.body.symbol  && req.body.receiverAddress && req.body.providerType){
        let contractAddress = await helper.getContractAddress(req.body.symbol, req.body.providerType)

        if(contractAddress){

            let Web3Client = await helper.getWebClient(req.body.providerType)
            let contract = await helper.getContractAddressInstanse(contractAddress, Web3Client)
            let response = await helper.countNonceAndData(req.body.walletAddress, req.body.numTokens, req.body.receiverAddress, contract, Web3Client)

            let nonce = response.nonce;
            let data  = response.data;

            let gaseLimit = await helper.calculateGassLimitEstimate(req.body.walletAddress, nonce, contractAddress, data, Web3Client)
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
    if(req.body.walletAddress && req.body.numTokens && req.body.symbol && req.body.receiverAddress && req.body.senderPrivateKey && req.body.providerType){

        let contractAddress = await helper.getContractAddress(req.body.symbol, req.body.providerType)
        if(contractAddress){
            let Web3Client = await helper.getWebClient(req.body.providerType)

            let contract = await helper.getContractAddressInstanse(contractAddress, Web3Client)
            let response = await helper.countNonceAndData(req.body.walletAddress, req.body.numTokens, req.body.receiverAddress, contract, Web3Client)
            let nonce = response.nonce;
            let data  = response.data;            

            let gaseLimit = await helper.calculateGassLimit(req.body.walletAddress, nonce, contractAddress, data, Web3Client)
            
            console.log('gaseLimit', gaseLimit)
            let balance = await helper.getWalletAddressBalance(req.body.walletAddress, contractAddress, Web3Client)
            console.log('balance of wallet are =====', balance)

            if( balance <  req.body.numTokens ){
                let response = {
                    message  :   `Insufficient balance!!!`
                }
                res.status(404).send(response);
            }else{
        
                let trasctionData = await helper.transferTokenToOtherWallets(gaseLimit, data, req.body.walletAddress, nonce, req.body.senderPrivateKey, contractAddress, Web3Client)
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
    if(req.body.symbol && req.body.walletAddress && req.body.providerType){
        let contractAddress = await helper.getContractAddress(req.body.symbol, req.body.providerType)
        if(contractAddress.length > 0){
            let Web3Client = await helper.getWebClient(req.body.providerType)
            let balance = await helper.getWalletAddressBalance(req.body.walletAddress, contractAddress, Web3Client)

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
    if(req.body.symbol && req.body.contractAddress  && req.body.providerType){

        let Web3Client  =  await helper.getWebClient(req.body.providerType)
        let contract    =  await helper.getContractAddressInstanse(req.body.contractAddress, Web3Client)
        let checkStatus =  await helper.isContractAddressIsValid(req.body.symbol, contract);

        console.log('checkStatus', checkStatus)
       
        helper.addContractAddress(req.body.symbol, req.body.contractAddress, req.body.providerType);
        res.status(checkStatus.status).send(checkStatus);
    }else{

        let response = {
            message  :   'Payload missing!!!'
        }
        res.status(404).send(response);
    }
})


router.post('/sendCoin', async(req, res) => {
    if(req.body.walletAddress && req.body.receiverAddress && req.body.amount && req.body.privateKey && req.body.providerType){
        let walletAddress = req.body.walletAddress
        let privateKey    = req.body.privateKey
        let receiverAddress = req.body.receiverAddress 
        let amount        = req.body.amount 

        let Web3Client = await helper.getWebClient(req.body.providerType)
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
    if(req.body.walletAddress && req.body.receiverAddress  && req.body.amount  && req.body.providerType){
        
        let Web3Client = await helper.getWebClient(req.body.providerType)
        const isvalid = await Web3Client.utils.isAddress(req.body.receiverAddress);
        if (!isvalid){
            
            res.status(400).json({ error: `This wallet address is not valid. Kindly confirm the address and try again.` });
        }else{

            let fee = await  helper.estimateGasForEthTransaction(req.body.walletAddress, req.body.receiverAddress, req.body.amount, Web3Client);
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
    if(req.body.walletAddress && req.body.providerType){

        let Web3Client = await helper.getWebClient(req.body.providerType)
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



//pancakeswap 
router.post('/coinToTokenPrice', async(req, res) => {
    if(req.body.amount && req.body.toSymbol && req.body.providerType){
        let etherAmount  = parseFloat(req.body.amount) 
        let toSymbol = req.body.toSymbol
       
        let contractAddress = await helper.getContractAddress(toSymbol, req.body.providerType)
        if(contractAddress){
            try{
                var tradeAmount = ethers.utils.parseEther(String(etherAmount));
                const chainId = ChainId.MAINNET
                const weth = WETH[chainId];
            
                const addresses = {
                    WBNB: weth.address,
                    BUSD: contractAddress,
                    PANCAKE_ROUTER: pancakeSwapRouter2Address // router 2 address
                }
                const [WBNB, BUSD] = await Promise.all(
                    [addresses.WBNB, addresses.BUSD].map(tokenAddress => (
                    new Token(
                        ChainId.MAINNET,
                        tokenAddress,
                        18
                    )
                )));
                const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider)
                console.log('asssssssssssssss')

                const route = await new Route([pair], WBNB)
                const trade = await new Trade(route, new TokenAmount(WBNB, tradeAmount), TradeType.EXACT_INPUT)
                console.log('------ppppppppppppppp')
                // console.log('trade', trade)

                const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
                const tokenPrice = route.midPrice.toSignificant(6);
                let finalPrice = Number(etherAmount) * Number(tokenPrice);
                let executionPrice = trade.executionPrice.toSignificant(6)
                
                finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;
        
                console.log("1 token = ", tokenPriceInEth)
                console.log("total token by given by eth= ", finalPrice)
                console.log("Minimum received= ", executionPrice * etherAmount)
        
                const minimumReceived = executionPrice * etherAmount
                const result = {
                    tokenPriceInEth: tokenPriceInEth,
                    tokenCalculate: finalPrice,
                    minimumReceived: minimumReceived 
                }
                return res.status(200).json(result);
            }catch(error){
                console.log(error)
                let response = {
                    message  : error
                }
                res.status(404).send(response);
            }
        }else{

            let response = {
                message  : 'Contract address not exists!!!'
            }
            res.status(404).send(response);
        }
    }else{
        let response = {
            message  : 'Payload Missing!!!'
        }
        res.status(404).send(response);
    }
})


router.post('/coinToTokenSwap', async(req, res) => {
    if(req.body.privateKey && req.body.toSymbol && req.body.amount && req.body.walletAddress && req.body.providerType){
        
        let privateKey     =    req.body.privateKey 
        let toSymbol       =    req.body.toSymbol
        let etherAmount    =    req.body.amount
        let walletAddress  =    req.body.walletAddress

        let contractAddress = await helper.getContractAddress(toSymbol, req.body.providerType)
        if(contractAddress){
            var tradeAmount = ethers.utils.parseEther(String(etherAmount));
            const chainId = ChainId.MAINNET
            const weth = WETH[chainId];
            
            const addresses = {
                WBNB: weth.address,
                BUSD: contractAddress,
                PANCAKE_ROUTER: pancakeSwapRouter2Address   //pancakeswap router 2 mainnet
            }
            const [WBNB, BUSD] = await Promise.all(
                [addresses.WBNB, addresses.BUSD].map(tokenAddress => (
                new Token(
                    ChainId.MAINNET,
                    tokenAddress,
                    18
                )
            )));
            const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider)

            const route = await new Route([pair], WBNB)
            const trade = await new Trade(route, new TokenAmount(WBNB, tradeAmount), TradeType.EXACT_INPUT)

            const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
            const tokenPrice = route.midPrice.toSignificant(6);
            // set Tolerance 0.5%
            const slippageTolerance = new Percent('50', "10000"); //10 bips 1 bip = 0.001%
            const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
            //set path of token and ether
            const path = [weth.address, BUSD.address];
            const to = walletAddress;
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
            const value = trade.inputAmount.raw;
        
            const singer = new ethers.Wallet(privateKey);
        
            const account = singer.connect(provider);
            const PANCAKE_ROUTER = new ethers.Contract(pancakeSwapRouter2Address, abi, account);
            try {
                const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
                    String(amountOutMin),
                    path,
                    to,
                    deadline,
                    { value: String(value), gasPrice: 20e9 }
                );

                const receipt = await tx.wait();
                console.log(`Tx-hash: ${tx.hash}`)
                console.log(`Tx was mined in block: ${receipt.blockNumber}`)

                let response = {
                    hash         : tx.hash,
                    blockNumber  : receipt.blockNumber
                }
                return res.status(200).json(response);
            } catch (error) {
                return res.status(400).json({ error: error.reason });
            }
        }else{
            let response = {
                message  : 'Contract Address not exists!!!'
            }
            res.status(404).send(response);
        }
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})


router.post('/tokenToTokenPrice', async(req, res) => {
    if(req.body.amount && req.body.toSymbol && req.body.symbol && req.body.providerType){
        let etherAmount  =  parseFloat(req.body.amount) 
        let toSymbol     =  req.body.toSymbol
        let fromSymbol   =  req.body.symbol
       
        let contractAddress     = await helper.getContractAddress(toSymbol, req.body.providerType)
        let fromcontractAddress = await helper.getContractAddress(fromSymbol)
        if(contractAddress && fromcontractAddress){
            try{
                var tradeAmount = ethers.utils.parseEther(String(etherAmount));
                const chainId = ChainId.MAINNET
                const weth = WETH[chainId];
            
                const addresses = {
                    WBNB: fromcontractAddress,//weth.address,
                    BUSD: contractAddress,
                    PANCAKE_ROUTER: pancakeSwapRouter2Address // router 2 address
                }
                const [WBNB, BUSD] = await Promise.all(
                    [addresses.WBNB, addresses.BUSD].map(tokenAddress => (
                    new Token(
                        ChainId.MAINNET,
                        tokenAddress,
                        18
                    )
                )));
            
                const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider)
                const route = await new Route([pair], WBNB)
                const trade = await new Trade(route, new TokenAmount(WBNB, tradeAmount), TradeType.EXACT_INPUT)
                console.log('------ppppppppppppppp')
                // console.log('trade', trade)

                const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
                const tokenPrice = route.midPrice.toSignificant(6);
                let finalPrice = Number(etherAmount) * Number(tokenPrice);
                let executionPrice = trade.executionPrice.toSignificant(6)
                
                finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;
        
                console.log("1 token = ", tokenPriceInEth)
                console.log("total token by given by eth= ", finalPrice)
                console.log("Minimum received= ", executionPrice * etherAmount)
        
                const minimumReceived = executionPrice * etherAmount
                const result = {
                    tokenPriceInEth: tokenPriceInEth,
                    tokenCalculate: finalPrice,
                    minimumReceived: minimumReceived 
                }
                return res.status(200).json(result);
            }catch(error){
                console.log(error)
                let response = {
                    message  : error
                }
                res.status(404).send(response);
            }
        }else{

            let response = {
                message  : 'Contract address not exists!!!'
            }
            res.status(404).send(response);
        }
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})


router.post('/tokenToTokenSwap', async(req, res) => {
    if(req.body.privateKey && req.body.toSymbol && req.body.symbol && req.body.amount && req.body.walletAddress && req.body.providerType){
        let privateKey     =    req.body.privateKey 
        let toSymbol       =    req.body.toSymbol
        let etherAmount    =    req.body.amount
        let walletAddress  =    req.body.walletAddress
        let fromSymbol     =    req.body.symbol

        let contractAddress     = await helper.getContractAddress(toSymbol, req.body.providerType)
        let fromContractAddress = await helper.getContractAddress(fromSymbol, req.body.providerType)
        if(contractAddress && fromContractAddress){
            var tradeAmount = ethers.utils.parseEther(String(etherAmount));
            const chainId = ChainId.MAINNET
            const weth = WETH[chainId];
            
            const addresses = {
                WBNB: fromContractAddress,
                BUSD: contractAddress,
                PANCAKE_ROUTER: pancakeSwapRouter2Address   //pancakeswap router 2 mainnet
            }
            const [WBNB, BUSD] = await Promise.all(
                [addresses.WBNB, addresses.BUSD].map(tokenAddress => (
                new Token(
                    ChainId.MAINNET,
                    tokenAddress,
                    18
                )
            )));
            const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider)

            const route = await new Route([pair], WBNB)
            const trade = await new Trade(route, new TokenAmount(WBNB, tradeAmount), TradeType.EXACT_INPUT)

            const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
            const tokenPrice = route.midPrice.toSignificant(6);
            // set Tolerance 0.5%
            const slippageTolerance = new Percent('50', "10000"); //10 bips 1 bip = 0.001%
            const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
            //set path of token and ether
            console.log('WBNB.address ', WBNB.address)
            console.log('WBNB.address ', WBNB.address)
            const path = [WBNB.address, BUSD.address];
            const to = walletAddress;
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
            const value = trade.inputAmount.raw;
        
            const singer = new ethers.Wallet(privateKey);
        
            const account = singer.connect(provider);
            const PANCAKE_ROUTER = new ethers.Contract(pancakeSwapRouter2Address, abi, account);
            try {
                const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
                    String(amountOutMin),
                    path,
                    to,
                    deadline,
                    { value: String(value), gasPrice: 20e9 }
                );

                const receipt = await tx.wait();
                console.log(`Tx-hash: ${tx.hash}`)
                console.log(`Tx was mined in block: ${receipt.blockNumber}`)

                let response = {
                    hash         : tx.hash,
                    blockNumber  : receipt.blockNumber
                }
                return res.status(200).json(response);
            } catch (error) {
                return res.status(400).json({ error: error.reason });
            }
        }else{
            let response = {
                message  : 'Contract Address not exists!!!'
            }
            res.status(404).send(response);
        }
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})


router.post('/tokenToCoinPrice', async(req, res) => {
    if(req.body.amount && req.body.fromSymbol && req.body.providerType){
        let etherAmount  =  parseFloat(req.body.amount) 
        let fromSymbol   =  req.body.fromSymbol
       
        let contractAddress = await helper.getContractAddress(fromSymbol, req.body.providerType)
       
        if(contractAddress){
            try{
                var tradeAmount = ethers.utils.parseEther(String(etherAmount));
                const chainId = ChainId.MAINNET
                const weth = WETH[chainId];
            
                const addresses = {
                    WBNB: contractAddress,
                    BUSD: weth.address,
                    PANCAKE_ROUTER: pancakeSwapRouter2Address  //router 2 address
                }
                const [WBNB, BUSD] = await Promise.all(
                    [addresses.WBNB, addresses.BUSD].map(tokenAddress => (
                    new Token(
                        ChainId.MAINNET,
                        tokenAddress,
                        18
                    )
                )));
                const pair  = await Fetcher.fetchPairData(WBNB, BUSD, provider)
                const route = await new Route([pair], WBNB)
                const trade = await new Trade(route, new TokenAmount(WBNB, tradeAmount), TradeType.EXACT_INPUT)

                const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
                const tokenPrice = route.midPrice.toSignificant(6);
                let finalPrice = Number(etherAmount) * Number(tokenPrice);
                let executionPrice = trade.executionPrice.toSignificant(6)
                
                finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;
        
                console.log("1 token = ", tokenPriceInEth)
                console.log("total token by given by eth= ", finalPrice)
                console.log("Minimum received= ", executionPrice * etherAmount)
        
                const minimumReceived = executionPrice * etherAmount
                const result = {
                    tokenPriceInEth: tokenPriceInEth,
                    tokenCalculate: finalPrice,
                    minimumReceived: minimumReceived 
                }
                return res.status(200).json(result);
            }catch(error){
                console.log(error)
                let response = {
                    message  : error
                }
                res.status(404).send(response);
            }
        }else{

            let response = {
                message  : 'Contract address not exists!!!'
            }
            res.status(404).send(response);
        }
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})


router.post('/tokenToCoinSwap', async(req, res) => {
    if(req.body.privateKey && req.body.fromSymbol && req.body.amount && req.body.walletAddress && req.body.providerType){
        let privateKey     =    req.body.privateKey 
        let etherAmount    =    req.body.amount
        let walletAddress  =    req.body.walletAddress
        let fromSymbol     =    req.body.fromSymbol

        let contractAddress     = await helper.getContractAddress(fromSymbol,req.body.providerType)
        if(contractAddress){
            var tradeAmount = ethers.utils.parseEther(String(etherAmount));
            const chainId = ChainId.MAINNET
            const weth = WETH[chainId];
            
            const addresses = {
                WBNB: contractAddress, 
                BUSD: weth.address,
                PANCAKE_ROUTER: pancakeSwapRouter2Address   //pancakeswap router 2 mainnet
            }
            const [WBNB, BUSD] = await Promise.all(
                [addresses.WBNB, addresses.BUSD].map(tokenAddress => (
                new Token(
                    ChainId.MAINNET,
                    tokenAddress,
                    18
                )
            )));
            const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider)

            const route = await new Route([pair], WBNB)
            const trade = await new Trade(route, new TokenAmount(WBNB, tradeAmount), TradeType.EXACT_INPUT)

            const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
            const tokenPrice = route.midPrice.toSignificant(6);
            // set Tolerance 0.5%
            const slippageTolerance = new Percent('50', "10000"); //10 bips 1 bip = 0.001%
            const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
            //set path of token and ether
            console.log('WBNB.address ', WBNB.address)
            const path = [WBNB.address, BUSD.address];
            const to = walletAddress;
            const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
            const value = trade.inputAmount.raw;
        
            const singer = new ethers.Wallet(privateKey);
        
            const account = singer.connect(provider);
            const PANCAKE_ROUTER = new ethers.Contract(pancakeSwapRouter2Address, abi, account);
            try {
                const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
                    String(amountOutMin),
                    path,
                    to,
                    deadline,
                    { value: String(value), gasPrice: 20e9 }
                );

                const receipt = await tx.wait();
                console.log(`Tx-hash: ${tx.hash}`)
                console.log(`Tx was mined in block: ${receipt.blockNumber}`)

                let response = {
                    hash         : tx.hash,
                    blockNumber  : receipt.blockNumber
                }
                return res.status(200).json(response);
            } catch (error) {
                return res.status(400).json({ error: error.reason });
            }
        }else{
            let response = {
                message  : 'Contract Address not exists!!!'
            }
            res.status(404).send(response);
        }
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})


//BTC trasections
router.post('/estimateBTCTransactionFee', async(req, res) => {
    if( req.body.fromAddress && req.body.toAddress && req.body.amount ){

        let status = await helper.validateBitcoinAddress(req.body.toAddress)
        if(status == 200){

            let data=  await helper.estimateFeeForBTCTransaction(req.body.fromAddress, req.body.toAddress, req.body.amount);
            res.status(data.status).send(data)
        }else{
            let response = {
                message  : 'wallet address is not valid'
            }
            res.status(404).send(response);
        }
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})



router.post('/sendBtcTrasection', async (req, res) => {

    if(req.body.fromAddress && req.body.toAddress && req.body.amount && req.body.privateKey){ 
        let fromAddress =   req.body.fromAddress 
        let toAddress   =   req.body.toAddress 
        let amount      =   parseFloat(req.body.amount) 
        let privatekey  =   req.body.privateKey 
        
        let data = await helper.sendBTCTrasection(privatekey, amount, fromAddress, toAddress);
        res.status(data.status).send(data);
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})


router.post('/BTCBalance', async(req, res) => {
    if(req.body.walletAddress && req.body.symbol){
        let walletAddress =  req.body.walletAddress;
        let symbol        =  req.body.symbol;
        let responce      =  await helper.getBalance(walletAddress);
        const btcInDollar =  await helper.getCryptoInUsd(symbol);
        if((responce.btcBal) > 0  && btcInDollar > 0){

            let balanceInDollar      = responce.btcBal * btcInDollar
            responce.balanceInDollar = balanceInDollar
        }
        res.status(responce.status).send(responce)
    }else{
        let response = {
            message  : 'Payload Missing'
        }
        res.status(404).send(response);
    }
})


// exports.createBtcWalletByUserId = async (user_id, recoveryPhrase) => {
//     const btcWallet = await btcWalletInfoModules.findOne({ user_id: user_id })
//     if (!btcWallet) {
//         try {
//             const seed = await bip39.mnemonicToSeed(recoveryPhrase); //creates seed buffer
//             const root = hdkey.fromMasterSeed(seed)
//             const masterPrivateKey = root.privateKey.toString('hex');
//             console.log('masterPrivateKey: ' + masterPrivateKey);

//             var cipherPrivateKey = CryptoJS.AES.encrypt(masterPrivateKey, process.env.ENCRYPT_SECRET_KEY).toString();

//             const keyPair = await ECPair.fromPrivateKey(Buffer.from(masterPrivateKey, 'hex'))
//             const wif = keyPair.toWIF(Buffer.from(masterPrivateKey, 'hex'));
//             const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });

//             let newBTCWallet = new btcWalletInfoModules({
//                 user_id: user_id, wif_address: wif, wallet_address: address,
//                 privateAddress: cipherPrivateKey, public_address: keyPair.publicKey
//             });

//             const saveData = await newBTCWallet.save();

//             var result = { "walletAddress": saveData.wallet_address, "privateKey": masterPrivateKey }
//             return { "status": 200, "data": result }

//         } catch (err) {
//             return { "status": 400, "error": err.message }
//         }
//     } else {
//         return { "status": 400, "error": 'wallet is already created' }
//     }
// }

// exports.createBTCtestnetWallet = async (req, res) => {
//     // const seed = await bip39.mnemonicToSeed('finish reward kite mixture enjoy industry inform celery harbor sudden eternal tail'); //creates seed buffer
//     // const root = hdkey.fromMasterSeed(seed)
//     // const masterPrivateKey = root.privateKey.toString('hex');
//     // console.log('masterPrivateKey: ' + masterPrivateKey);

//     // const keyPair = await ECPair.fromPrivateKey(Buffer.from(masterPrivateKey, 'hex'))
//     // const wif = keyPair.toWIF(Buffer.from(masterPrivateKey, 'hex'));
//     // console.log("🚀 ~ file: bitcoin.controller.js ~ line 71 ~ exports.createBTCtestnetWal ~ wif", wif)
//     // const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey });
//     // console.log("🚀 ~ file: bitcoin.controller.js ~ line 72 ~ exports.createBTCtestnetWal ~ address", address)

//     const { user_id } = req.body
//     try {
//         const walletsAPi = await axios.post(`${process.env.BLOCKCYPHER_URL}addrs?token=${process.env.BLOCKCYPHER_TOKEN}`);
//         const walletDetail = walletsAPi.data
//         var cipherPrivateKey = CryptoJS.AES.encrypt(walletDetail.private, process.env.ENCRYPT_SECRET_KEY).toString();

//         let newBTCWallet = new btcWalletInfoModules({
//             user_id: user_id, wif_address: walletDetail.wif, wallet_address: walletDetail.address,
//             privateAddress: cipherPrivateKey, public_address: walletDetail.public
//         });
//         const saveData = await newBTCWallet.save();

//         return res.status(200).json({ wallet_address: saveData.wallet_address, private_key: walletDetail.private });

//     } catch (error) {
//         console.log("🚀 ~ file: bitcoin.controller.js ~ line 73 ~ exports.createBTCtestnetWal ~ error", error)
//         return res.status(400).json({ error: error.message });
//     }


// }


// exports.estimateBTCTransactionFee = async (req, res) => {

//     const { fromAddress, toAddress, amount, symbol } = req.body;

//     if (fromAddress && toAddress && amount && symbol) {

//         const feeInSwet = req.feeInSwet
//         estimateFeeForBTCTransaction(symbol, fromAddress, toAddress, amount, feeInSwet, res);
//     } else {

//         return res.status(400).json({ error: 'All fields are required' });
//     }
// }

// exports.createAndBroadcastBTCTransaction = async (req, res) => {
//     const { fromAddress, toAddress, amount, symbol } = req.body;

//     if (fromAddress && toAddress && amount && symbol) {
//         const feeInSwet = req.feeInSwet
//         const walletDetail = req.walletDetail;
//         sendBtcTransaction(symbol, fromAddress, toAddress, amount, walletDetail, feeInSwet, res)

//     } else {
//         return res.status(400).json({ error: 'All fields are required' });
//     }
// }

// exports.BTCTransactionForMobile = async (req, res) => {
//     const { fromAddress, phoneNumber, amount, isRegistered, symbol } = req.body;
//     const feeInSwet = req.feeInSwet
//     const walletDetail = req.walletDetail;
//     const user = await User.findOne({ phoneNumber });
//     if (!user) {
//         return res.status(400).json({ error: `Sorry…! This phone number does not exist. Kindly register and proceed to log in..` });
//     } else {
//         const user_id = user._id
//         const toWalletDetail = await btcWalletInfoModules.findOne({ user_id: user_id });
//         const toAddress = toWalletDetail.wallet_address
//         if (isRegistered === false) {
//             const { password } = req.body;
//             const result = await sendInvitationOnMobile(phoneNumber, amount, symbol, password, fromAddress)
//             if (result.status === 400) return res.status(400).json({ error: result.message });
//         }
//         sendBtcTransaction(symbol, fromAddress, toAddress, amount, walletDetail, feeInSwet, res)
//     }

// }
// exports.EstimateTransactionFeeForMobileEth = async (req, res) => {

//     const { fromAddress, phoneNumber, amount, symbol } = req.body;

//     if (fromAddress && phoneNumber && amount && symbol) {
//         const feeInSwet = req.feeInSwet
//         const user = await User.findOne({ phoneNumber });
//         if (!user) return res.status(400).json({ error: `Sorry…! This phone number does not exist. Kindly register and proceed to log in..` });

//         const user_id = user._id
//         const toWalletDetail = await btcWalletInfoModules.findOne({ user_id: user_id });
//         const toAddress = toWalletDetail.wallet_address
//         await estimateFeeForBTCTransaction(symbol, fromAddress, toAddress, amount, feeInSwet, res);

//     } else {
//         return res.status(400).json({ error: `All fields required` });
//     }

// }

// const estimateFeeForBTCTransaction = async (symbol, fromAddress, toAddress, amount, feeInSwet, res) => {

//     const amountIn = Number(amount) * satoshi
//     var newtx = {
//         inputs: [{ addresses: [fromAddress] }],
//         outputs: [{ addresses: [toAddress], value: amountIn }]
//     };
//     try {
//         const transactionDetail = await axios.post(`${process.env.BLOCKCYPHER_URL}txs/new?token=${process.env.BLOCKCYPHER_TOKEN}`, JSON.stringify(newtx));
//         const transactionData = transactionDetail.data
//         const feeInSatoshi = transactionData.tx.fees
//         const balInBTC = feeInSatoshi / satoshi;

//         return res.status(200).json({ estimatedGasFee: balInBTC, symbol: symbol, transactionFee: feeInSwet });

//     } catch (error) {

//         console.log("🚀 ~ file: bitcoin.controller.js ~ line 187 ~ estimateFeeForBTCTransaction ~ error", error)
//         return res.status(400).json({ error: error.message });
//     }

// }


// const sendBtcTransaction = async (symbol, fromAddress, toAddress, amount, walletDetail, feeInSwet, res) => {

//     try {
//         let privatekey = await decryptWalletPrivateKey(walletDetail.privateAddress);
//         const keyPair = await ECPair.fromPrivateKey(Buffer.from(privatekey, 'hex'))

//         const amountIn = amount * satoshi
//         var newtx = {
//             inputs: [{ addresses: [fromAddress] }],
//             outputs: [{ addresses: [toAddress], value: amountIn }]
//         };

//         const transactionDetail = await axios.post(`${process.env.BLOCKCYPHER_URL}txs/new?token=${process.env.BLOCKCYPHER_TOKEN}`, JSON.stringify(newtx));
//         const tmptx = transactionDetail.data
//         tmptx.pubkeys = [];
//         tmptx.signatures = tmptx.tosign.map(function (tosign, n) {
//             tmptx.pubkeys.push(keyPair.publicKey.toString('hex'));
//             return bitcoin.script.signature.encode(
//                 keyPair.sign(Buffer.from(tosign, "hex")),
//                 0x01,
//             ).toString("hex").slice(0, -2);
//         });

//         const finalTransaction = await axios.post(`${process.env.BLOCKCYPHER_URL}txs/send?token=${process.env.BLOCKCYPHER_TOKEN}`, JSON.stringify(tmptx))

//         const transactionData = finalTransaction.data;
//         const TransactionHash = transactionData.tx.hash;

//         deductTransactionFee(walletDetail.user_id, feeInSwet)

//         sendNotificationToApp(fromAddress, toAddress, amount, symbol);

//         addCount(walletDetail.user_id)

//         return res.status(200).json({ transactionHash: TransactionHash });


//     } catch (error) {
//         console.log("🚀 ~ file: bitcoin.controller.js ~ line 111 ~ exports.createBTCTransaction= ~ error", error)
//         return res.status(400).json({ error: error.message });

//     }

// }

// exports.btcCheckBalanceMiddleWare = async (req, res, next) => {

//     const { fromAddress, amount } = req.body;
//     if (fromAddress && amount) {
//         try {
//             const checkBal = await axios.get(`${process.env.BLOCKCYPHER_URL}addrs/${fromAddress}/balance?token=${process.env.BLOCKCYPHER_TOKEN}`);
//             const balData = checkBal.data;
//             const balance = balData.final_balance;
//             const balInBTC = balance / satoshi;
//             console.log("🚀 ~ file: bitcoin.controller.js ~ line 151 ~ exports.btcTransactionMiddleWare= ~ balInBTC", balInBTC)

//             if (balInBTC < Number(amount)) {
//                 return res.status(400).json({ error: `You do not have enough BTC. Kindly get more BTC to proceed.` });
//             } else {
//                 return next();
//             }

//         } catch (error) {
//             console.log("🚀 ~ file: bitcoin.controller.js ~ line 157 ~ exports.btcTransactionMiddleWare= ~ error", error)
//             return res.status(400).json({ error: error.message });
//         }

//     } else {
//         return res.status(400).json({ error: 'All fields are required' });
//     }

// }
// exports.getTestBTC = async (req, res) => {

//     let data = { "address": "BuymfX3aLJgQbQhtYQkeFUYXHenAsVCRXW", "amount": 500000 }
//     try {
//         const responce = await axios.post('https://api.blockcypher.com/v1/bcy/test/faucet?token=40fe436d313a412a9b94890d97cf0d84', JSON.stringify(data))
//         return res.status(200).json({ data: responce.data });

//     } catch (error) {
//         console.log("🚀 ~ file: bitcoin.controller.js ~ line 180 ~ exports.getTestBTC= ~ error", error)
//         return res.status(400).json({ error: error.message });
//     }

// }

// const sendNotificationToApp = async (sender, receiver, amount, symbol) => {
//     try {
//         const recevierWallets = await btcWalletInfoModules.findOne({ wallet_address: receiver })
//         if (recevierWallets) {
//             const user_id = recevierWallets.user_id
//             let users = await User.findOne({ _id: user_id });
//             if (users) {
//                 const fcmid = users.fcmToken
//                 if (fcmid) {
//                     const data = {
//                         'title': `Received ${symbol}`, 'message': `You received ${amount} ${symbol} from ${sender} this wallet Address`,
//                         'fcmToken': fcmid
//                     }
//                     let newNotification = new Notifications({
//                         user_id: user_id, title: `Received ${symbol}`,
//                         message: `You received ${amount} ${symbol} from ${sender} this wallet Address`,
//                         fcmToken: fcmid
//                     });
//                     const newdata = await newNotification.save();

//                     sendNotifications(data, newdata)
//                 }
//             }
//         }
//     } catch (error) {
//         console.log("🚀 ~ file: bitcoin.controller.js ~ line 257 ~ sendNotificationToApp ~ error", error)


//     }
// }

// exports.validateBitcoinAddress = async (req, res, next) => {
//     const { toAddress } = req.body;
//     if (toAddress) {
//         axios.get(`${process.env.BLOCKCYPHER_URL}addrs/${toAddress}/balance?token=${process.env.BLOCKCYPHER_TOKEN}`).then((responce) => {
//             return next();

//         }).catch((err) => {
//             return res.status(400).json({ error: err.response.data.error });
//         });
//     } else {
//         return res.status(400).json({ error: 'All fields are required' });
//     }

// }


// exports.transactionBTCMiddleware = async (req, res, next) => {
//     const { user_id } = req.body;
//     //get wallet deail against user id
//     const walletDetail = await btcWalletInfoModules.findOne({ user_id: user_id });
//     if (!walletDetail)
//         return res.status(400).json({ error: "Your BTC wallet does not exist" });
//     req.walletDetail = walletDetail;
//     next();
// }


// exports.BTCTransactionDetail = async (req, res) => {
//     const { user_id, walletAddress, symbol } = req.body;

//     //const walletAddress = 'BuymfX3aLJgQbQhtYQkeFUYXHenAsVCRXW';
//     if (walletAddress && symbol) {
//         let sendArray = [];
//         try {
//             const transactionDetail = await axios.get(`${process.env.BLOCKCYPHER_URL}addrs/${walletAddress}/full?token=${process.env.BLOCKCYPHER_TOKEN}`);
//             const transactions = transactionDetail.data.txs

//             if (transactions) {
//                 transactions.forEach(trans => {
//                     let type = (trans.inputs[0].addresses[0] === walletAddress) ? 'Send' : 'Received';
//                     let amount = (trans.outputs[0].value / satoshi)
//                     let fees = (trans.fees / satoshi)

//                     var transactionHash = trans.hash
//                     let Data = {
//                         "confirmedDate": trans.confirmed, "transactionHash": transactionHash, "receivedDate": trans.received,
//                         "amount": amount, "fee": fees, "blockHash": trans.block_hash, "from": trans.inputs[0].addresses[0],
//                         "to": trans.outputs[0].addresses[0], "type": type, "confirmations": trans.confirmations
//                     };
//                     sendArray.push(Data)
//                 });
//                 return res.status(200).json({ history: sendArray });
//             }

//         } catch (error) {
//             return res.status(200).json({ history: [], message: 'Data not found' });
//         }
//     } else {

//         return res.status(400).json({ error: `Required all fields` });
//     }
// }

// exports.getBTCBalanceByUserId = async (symbol, user_id) => {

//     let btcAmount = 0.00;
//     let balanceInDollar = 0.00;
//     try {
//         let btcWallet = await btcWalletInfoModules.findOne({ user_id: user_id });
//         if (btcWallet) {
//             let walletAddress = btcWallet.wallet_address;

//             const checkBal = await axios.get(`${process.env.BLOCKCYPHER_URL}addrs/${walletAddress}/balance?token=${process.env.BLOCKCYPHER_TOKEN}`);
//             const balData = checkBal.data;
//             const balance = balData.final_balance;
//             const balInBTC = balance / satoshi;
//             btcAmount = balInBTC
//             console.log("🚀 ~ file: bitcoin.controller.js ~ line 398 ~ exports.getBTCBalanceByUserId= ~ balInBTC", balInBTC)

//             balanceInDollar = btcAmount
//             if (balInBTC > 0) {
//                 const btcInDollar = await getCryptoInUsd('bitcoin', symbol)
//                 const Bindollar = (btcInDollar[symbol] === undefined) ? 1 : btcInDollar[symbol]
//                 balanceInDollar = Bindollar * balInBTC

//             }
//         }
//         return { 'btcBal': btcAmount, 'btcBalInDollar': balanceInDollar }

//     } catch (error) {
//         console.log("🚀 ~ file: ether.controller.js ~ line 906 ~ getEtherBalanceByUserId ~ error", error)
//         return { 'btcBal': btcAmount, 'btcBalInDollar': balanceInDollar }

//     }

// }



module.exports = router;