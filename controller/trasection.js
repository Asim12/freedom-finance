var express  =  require('express');
var router   =  express.Router();
const helper =  require('../helper/customHelper')
const ethers =  require('ethers')
// require('dotenv').config();
const upload = require('../middleWare/upload');

const dotenv = require('dotenv')
dotenv.config();

const Web3   =  require('web3');
const Web3Client = new Web3('https://bsc-dataseed.binance.org') // mainnet
// const Web3Client = new Web3('https://speedy-nodes-nyc.moralis.io/defd019df2c0685181b50e9a/bsc/testnet') // testnet


const {WETH, ChainId, Route, Router, Fetcher, Trade, TokenAmount, TradeType, Token, Percent } = require('@pancakeswap-libs/sdk'); 
const {JsonRpcProvider} =   require("@ethersproject/providers");
const provider          =   new JsonRpcProvider('https://bsc-dataseed1.binance.org/'); // mainnet
const abi               =   require('../Router2abi.json')
const pancakeSwapRouter2Address  = '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F'; //mainnet address

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




//pancakeswap 
router.post('/coinToTokenPrice', async(req, res) => {
    if(req.body.amount && req.body.toSymbol){
        let etherAmount  = parseFloat(req.body.amount) 
        let toSymbol = req.body.toSymbol
       
        let contractAddress = await helper.getContractAddress(toSymbol)
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
    if(req.body.privateKey && req.body.toSymbol && req.body.amount && req.body.walletAddress){
        
        let privateKey     =    req.body.privateKey 
        let toSymbol       =    req.body.toSymbol
        let etherAmount    =    req.body.amount
        let walletAddress  =    req.body.walletAddress

        let contractAddress = await helper.getContractAddress(toSymbol)
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
    if(req.body.amount && req.body.toSymbol && req.body.symbol){
        let etherAmount  =  parseFloat(req.body.amount) 
        let toSymbol     =  req.body.toSymbol
        let fromSymbol   =  req.body.symbol
       
        let contractAddress     = await helper.getContractAddress(toSymbol)
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
    if(req.body.privateKey && req.body.toSymbol && req.body.symbol && req.body.amount && req.body.walletAddress){
        let privateKey     =    req.body.privateKey 
        let toSymbol       =    req.body.toSymbol
        let etherAmount    =    req.body.amount
        let walletAddress  =    req.body.walletAddress
        let fromSymbol     =    req.body.symbol

        let contractAddress     = await helper.getContractAddress(toSymbol)
        let fromContractAddress = await helper.getContractAddress(fromSymbol)
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
    if(req.body.amount && req.body.fromSymbol){
        let etherAmount  =  parseFloat(req.body.amount) 
        let fromSymbol   =  req.body.fromSymbol
       
        let contractAddress = await helper.getContractAddress(fromSymbol)
       
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
    if(req.body.privateKey && req.body.fromSymbol && req.body.amount && req.body.walletAddress){
        let privateKey     =    req.body.privateKey 
        let etherAmount    =    req.body.amount
        let walletAddress  =    req.body.walletAddress
        let fromSymbol     =    req.body.fromSymbol

        let contractAddress     = await helper.getContractAddress(fromSymbol)
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


module.exports = router;