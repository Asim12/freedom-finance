var express = require("express");
var router = express.Router();
const helper = require("../helper/customHelper");
const ethers = require("ethers");
// require('dotenv').config();
const upload = require("../middleWare/upload");
var axios = require("axios");
const dotenv = require("dotenv");
const convert = require("ether-converter");

dotenv.config();
const Web3 = require("web3");
const abi = require("../Router2abi.json");

const { WETH, ChainId, Route, Router, Fetcher, Trade, TokenAmount, TradeType, Token, Percent } = require("@pancakeswap/sdk");
// const { WETH, ChainId, Route, Router, Fetcher, Trade, TokenAmount, TradeType, Token, Percent } = require('@pancakeswap-libs/sdk');
const pancakeSwapRouter2Address = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; //mainnet address

//0x10ED43C718714eb63d5aA57B78B54704E256024E router 2
//0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F router 1
const { JsonRpcProvider } = require("@ethersproject/providers");
//const provider = new JsonRpcProvider("https://bsc-dataseed1.binance.org/");
const provider = new JsonRpcProvider("https://bsc-dataseed.binance.org/");


router.post("/calculateGassLimit", async (req, res) => {
  if (
    req.body.walletAddress &&
    req.body.numTokens &&
    req.body.symbol &&
    req.body.receiverAddress &&
    req.body.providerType
  ) {
    let contractAddress = await helper.getContractAddress(
      req.body.symbol,
      req.body.providerType
    );

    if (contractAddress) {
      let Web3Client = await helper.getWebClient(req.body.providerType);
      let contract = await helper.getContractAddressInstanse(
        contractAddress,
        Web3Client
      );
      let response = await helper.countNonceAndData(req.body.walletAddress, req.body.numTokens, req.body.receiverAddress, contract, Web3Client);

      let nonce = response.nonce;
      let data = response.data;

      let gaseLimit = await helper.calculateGassLimitEstimate(
        req.body.walletAddress,
        nonce,
        contractAddress,
        data,
        Web3Client
      );
      let responseGass = {
        gaseLimit: gaseLimit,
      };
      res.status(200).send(responseGass);
    } else {
      let response = {
        message: "Contract Address Not available For This Symbol!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/sendToken", async (req, res) => {
  if (
    req.body.walletAddress &&
    req.body.numTokens &&
    req.body.symbol &&
    req.body.receiverAddress &&
    req.body.senderPrivateKey &&
    req.body.providerType
  ) {

    let contractAddress = await helper.getContractAddress(
      req.body.symbol,
      req.body.providerType
    );
    if (contractAddress) {
      let Web3Client = await helper.getWebClient(req.body.providerType);

      const balInEthM = await Web3Client.eth.getBalance(req.body.walletAddress)
      const ethAmountM = Web3Client.utils.fromWei(balInEthM, 'ether')
      if (Number(ethAmountM) < 0.005) {
        return res.status(400).json({ error: `Insufficient Funds For Transaction` });
      }

      let contract = await helper.getContractAddressInstanse(contractAddress, Web3Client);
      let response = await helper.countNonceAndData(req.body.walletAddress, req.body.numTokens, req.body.receiverAddress, contract, Web3Client);
      let nonce = response.nonce;
      let data = response.data;

      let gaseLimit = await helper.calculateGassLimit(req.body.walletAddress, nonce, contractAddress, data, Web3Client);

      console.log("gaseLimit", gaseLimit);
      let balance = await helper.getWalletAddressBalance(req.body.walletAddress, contractAddress, Web3Client);
      console.log("balance of wallet are =====", balance);

      if (balance < req.body.numTokens) {
        let response = { message: `Invalid Contract Address` };
        res.status(404).send(response);
      } else {
        let trasctionData = await helper.transferTokenToOtherWallets(gaseLimit, data, req.body.walletAddress, nonce, req.body.senderPrivateKey, contractAddress, Web3Client);
        res.status(200).send(trasctionData);
      }
    } else {
      let response = {
        message: "Contract Address Not available For This Symbol!!",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/getBalance", async (req, res) => {
  if (req.body.symbol && req.body.walletAddress && req.body.providerType) {

    let contractAddress = await helper.getContractAddress(
      req.body.symbol,
      req.body.providerType
    );
    if (contractAddress.length > 0) {
      let Web3Client = await helper.getWebClient(req.body.providerType);
      let balance = await helper.getWalletAddressBalance(
        req.body.walletAddress,
        contractAddress,
        Web3Client
      );
      let response = {
        balance: balance,
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "Missing Data",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/addNewToken", async (req, res) => {
  if (
    req.body.symbol &&
    req.body.providerType &&
    req.body.type &&
    req.body.url
  ) {
    let Web3Client = await helper.getWebClient(req.body.providerType);
    if (req.body.type == "token") {
      let contract = await helper.getContractAddressInstanse(
        req.body.contractAddress,
        Web3Client
      );
      let checkStatus = await helper.isContractAddressIsValid(
        req.body.symbol,
        contract
      );
      console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaa", checkStatus);
      helper.addContractAddress(
        req.body.symbol,
        req.body.contractAddress,
        req.body.providerType,
        req.body.type,
        req.body.url
      );
      res.status(checkStatus.status).send(checkStatus);
    } else if (req.body.type == "coin") {
      helper.addCoin(
        req.body.symbol,
        req.body.providerType,
        "coin",
        req.body.url
      );
      res.status(200).send({ message: "Added", status: 200 });
    } else {
      res.status(400).send({ message: "Invalid" });
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.get("/getUserToken", async (req, res) => {
  let data = await helper.getRecord();
  let response = {
    data,
  };
  res.status(200).send(response);
});

router.post("/sendCoin", async (req, res) => {
  if (
    req.body.walletAddress &&
    req.body.receiverAddress &&
    req.body.amount &&
    req.body.privateKey &&
    req.body.providerType
  ) {
    let walletAddress = req.body.walletAddress;
    let privateKey = req.body.privateKey;
    let receiverAddress = req.body.receiverAddress;
    let amount = req.body.amount;

    let Web3Client = await helper.getWebClient(req.body.providerType);

    const balInEthM = await Web3Client.eth.getBalance(req.body.walletAddress)
    const ethAmountM = Web3Client.utils.fromWei(balInEthM, 'ether')
    if (Number(ethAmountM) < 0.005) {
      return res.status(400).json({ error: `Insufficient Funds For Transaction` });
    }

    const isvalid = Web3Client.utils.isAddress(receiverAddress);
    console.log(isvalid);
    if (!isvalid) {
      //Web3Client
      res.status(400).json({
        error: `Please Confirm The Address, and Try Again. Kindly confirm the address and try again.`,
      });
    } else {
      try {
        //get ether balance before transaction
        const ethBalance = await Web3Client.eth.getBalance(walletAddress);
        console.log(ethBalance);
        // convert amount to ether from wei
        const ethAmount = Web3Client.utils.fromWei(ethBalance, "ether");
        //cgeck sending amount is greater then ether balance
        if (ethAmount > amount) {
          const count = await Web3Client.eth.getTransactionCount(
            walletAddress,
            "latest"
          );
          let etherValue = Web3Client.utils.toWei(amount.toString(), "ether");

          const transaction = {
            to: receiverAddress,
            value: etherValue,
            gas: 30000,
            nonce: count,
            // optional data field to send message or execute smart contract
          };

          const signedTx = await Web3Client.eth.accounts.signTransaction(
            transaction,
            privateKey
          );
          Web3Client.eth.sendSignedTransaction(signedTx.rawTransaction);
          // deductTransactionFee(walletDetail.user_id, feeInSwet)
          return res
            .status(200)
            .json({ transactionHash: signedTx.transactionHash });
        } else {
          let response = {
            message: "Insufficient Funds",
          };
          res.status(404).send(response);
        }
      } catch (error) {
        console.log(error);
        let response = {
          message: error,
        };
        res.status(404).send(response);
      }
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/calculateGassFeeCoin", async (req, res) => {
  if (
    req.body.walletAddress &&
    req.body.receiverAddress &&
    req.body.amount &&
    req.body.providerType
  ) {

    let Web3Client = await helper.getWebClient(req.body.providerType);
    if (Web3Client == false) {
      res.status(400).json({ error: `Invalid Provider!!` });
    }
    const isvalid = await Web3Client.utils.isAddress(req.body.receiverAddress);

    if (!isvalid) {

      res.status(400).json({
        error: `Please Confirm The Address, and Try Again. Kindly confirm the address and try again.`,
      });
    } else {
      let fee = await helper.estimateGasForEthTransaction(
        req.body.walletAddress,
        req.body.receiverAddress,
        req.body.amount,
        Web3Client
      );
      res.status(fee.status).send(fee);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/getCoinBalance", async (req, res) => {
  if (req.body.walletAddress && req.body.providerType) {
    try {
      let Web3Client = await helper.getWebClient(req.body.providerType);
      const ethBalance = await Web3Client.eth.getBalance(
        req.body.walletAddress
      );
      console.log(ethBalance);
      // convert amount to ether from wei
      const ethAmount = Web3Client.utils.fromWei(ethBalance, "ether");
      let response = {
        balance: ethAmount,
      };
      res.status(200).send(response);
    } catch (e) {
      res.status(404).send({ message: e });
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

//pancakeswap
router.post("/coinToTokenPrice", async (req, res) => {
  if (req.body.amount && req.body.toSymbol && req.body.providerType) {
    let etherAmount = parseFloat(req.body.amount);
    let toSymbol = req.body.toSymbol;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    console.log("========", contractAddress);
    if (contractAddress) {
      try {
        var tradeAmount = ethers.utils.parseEther(String(etherAmount));
        const chainId = ChainId.MAINNET;
        const weth = WETH[chainId];

        const tokenAddress = contractAddress;
        const swapToken = await Fetcher.fetchTokenData(
          chainId,
          tokenAddress,
          provider
        );
        console.log("swapToken", swapToken);
        const pair = await Fetcher.fetchPairData(swapToken, weth, provider);
        const route = await new Route([pair], weth);
        const trade = await new Trade(
          route,
          new TokenAmount(weth, tradeAmount),
          TradeType.EXACT_INPUT
        );
        const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
        const tokenPrice = route.midPrice.toSignificant(6);
        let finalPrice = Number(etherAmount) * Number(tokenPrice);
        let executionPrice = trade.executionPrice.toSignificant(6);
        finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

        console.log("1 token = ", tokenPriceInEth);
        console.log("total token by given by eth= ", finalPrice);
        console.log("Minimum received= ", executionPrice * etherAmount);

        const minimumReceived = executionPrice * etherAmount;
        const result = {
          tokenPriceInEth: tokenPriceInEth,
          tokenCalculate: finalPrice,
          minimumReceived: minimumReceived,
        };
        return res.status(200).json(result);
      } catch (error) {
        console.log(error.message);
        let response = {
          message: error,
        };
        res.status(404).send(response);
      }
    } else {
      let response = {
        message: "The Contract Address Provided Does Not Exist",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/coinToTokenSwap", async (req, res) => {
  if (
    req.body.privateKey &&
    req.body.toSymbol &&
    req.body.amount &&
    req.body.walletAddress &&
    req.body.providerType &&
    req.body.percentage
  ) {
    let privateKey = req.body.privateKey;
    let toSymbol = req.body.toSymbol;
    let etherAmount = req.body.amount;
    let walletAddress = req.body.walletAddress;

    let Web3Client = await helper.getWebClient(req.body.providerType);
    const balInEthM = await Web3Client.eth.getBalance(walletAddress)
    const ethAmountM = Web3Client.utils.fromWei(balInEthM, 'ether')
    if (Number(ethAmountM) < 0.005) {
      return res.status(400).json({ error: `Insufficient Funds For Transaction` });
    }
    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    if (contractAddress) {
      var tradeAmount = ethers.utils.parseEther(String(etherAmount));
      const chainId = ChainId.MAINNET;
      const weth = WETH[chainId];

      const addresses = {
        WBNB: weth.address,
        BUSD: contractAddress,
        PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
      };
      const [WBNB, BUSD] = await Promise.all(
        [addresses.WBNB, addresses.BUSD].map(
          (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
        )
      );
      const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);

      const route = await new Route([pair], WBNB);
      const trade = await new Trade(
        route,
        new TokenAmount(WBNB, tradeAmount),
        TradeType.EXACT_INPUT
      );

      const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
      const tokenPrice = route.midPrice.toSignificant(6);
      // set Tolerance 0.5%
      const slippageTolerance = new Percent(
        req.body.percentage ? req.body.percentage : "50",
        "10000"
      ); //10 bips 1 bip = 0.001%
      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
      //set path of token and ether
      const path = [weth.address, BUSD.address];
      const to = walletAddress;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const value = trade.inputAmount.raw;

      const singer = new ethers.Wallet(privateKey);

      const account = singer.connect(provider);
      const PANCAKE_ROUTER = new ethers.Contract(
        pancakeSwapRouter2Address,
        abi,
        account
      );
      try {
        const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
          String(amountOutMin),
          path,
          to,
          deadline,
          { value: String(value), gasPrice: 1.5e10 }
        );

        const receipt = await tx.wait();
        console.log(`Tx-hash: ${tx.hash}`);
        console.log(`Tx was mined in block: ${receipt.blockNumber}`);

        let response = {
          hash: tx.hash,
          blockNumber: receipt.blockNumber,
        };
        return res.status(200).json(response);
      } catch (error) {
        return res.status(400).json({ error: error.reason });
      }
    } else {
      let response = {
        message: "The Contract Address Provided Does Not Exist",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

// router.post("/coinToTokenSwap_testing", async (req, res) => {
//   if (
//     req.body.privateKey &&
//     req.body.toSymbol &&
//     req.body.amount &&
//     req.body.walletAddress &&
//     req.body.providerType &&
//     req.body.percentage
//   ) {
//     let privateKey = req.body.privateKey;
//     let toSymbol = req.body.toSymbol;
//     let etherAmount = req.body.amount;
//     let walletAddress = req.body.walletAddress;
//
//     let contractAddress = await helper.getContractAddress(
//       toSymbol,
//       req.body.providerType
//     );
//     if (contractAddress) {
//       var tradeAmount = ethers.utils.parseEther(String(etherAmount));
//       const chainId = ChainId.MAINNET;
//       const weth = WETH[chainId];
//
//       const addresses = {
//         WBNB: weth.address,
//         BUSD: contractAddress,
//         PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
//       };
//       const [WBNB, BUSD] = await Promise.all(
//         [addresses.WBNB, addresses.BUSD].map(
//           (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
//         )
//       );
//       const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);
//
//       const route = await new Route([pair], WBNB);
//       const trade = await new Trade(
//         route,
//         new TokenAmount(WBNB, tradeAmount),
//         TradeType.EXACT_INPUT
//       );
//
//       const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
//       const tokenPrice = route.midPrice.toSignificant(6);
//       // set Tolerance 0.5%
//       const slippageTolerance = new Percent(
//         req.body.percentage ? req.body.percentage : "50",
//         "10000"
//       ); //10 bips 1 bip = 0.001%
//       const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
//       // //set path of token and ether
//       // const path = [weth.address, BUSD.address];
//       // const to = walletAddress;
//       // const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
//       // const value = trade.inputAmount.raw;
//       //
//       // const singer = new ethers.Wallet(privateKey);
//       //
//       // const account = singer.connect(provider);
//       // const PANCAKE_ROUTER = new ethers.Contract(
//       //   pancakeSwapRouter2Address,
//       //   abi,
//       //   account
//       // );
//       try {
//         return res.status(200).json({ response: amountOutMin.toString() });
//       } catch (error) {
//         return res.status(400).json({ error: error.reason });
//       }
//     } else {
//       let response = {
//         message: "The Contract Address Provided Does Not Exist",
//       };
//       res.status(404).send(response);
//     }
//   } else {
//     let response = {
//       message: "Missing Data",
//     };
//     res.status(404).send(response);
//   }
// });

router.post("/tokenToTokenPrice1", async (req, res) => {
  if (
    req.body.amount &&
    req.body.toSymbol &&
    req.body.symbol &&
    req.body.providerType
  ) {
    let etherAmount = parseFloat(req.body.amount);
    let toSymbol = req.body.toSymbol;
    let fromSymbol = req.body.symbol;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    let fromcontractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    console.log("contractAddress", contractAddress);
    console.log("fromcontractAddress", fromcontractAddress);
    if (contractAddress && fromcontractAddress) {
      try {
        // chain id for test net
        const chainId = ChainId.MAINNET;
        //token address to swap
        var amountEth = ethers.utils.parseEther(String(etherAmount));
        const addresses = {
          WBNB: fromcontractAddress, //'0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
          BUSD: contractAddress, //'0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
          PANCAKE_ROUTER: pancakeSwapRouter2Address,
        };
        const [WBNB, BUSD] = await Promise.all(
          [addresses.WBNB, addresses.BUSD].map(
            (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
          )
        );
        //fetch ether through chain id
        const weth = WETH[chainId];
        const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);
        const route = new Route([pair], WBNB);
        const trade = new Trade(
          route,
          new TokenAmount(WBNB, String(amountEth)),
          TradeType.EXACT_INPUT
        );
        const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
        const tokenPrice = route.midPrice.toSignificant(6);
        let finalPrice = Number(etherAmount) * Number(tokenPrice);
        let executionPrice = trade.executionPrice.toSignificant(6);
        finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

        console.log("1 token = ", tokenPriceInEth);
        console.log("total token by given by eth= ", finalPrice);
        console.log("Minimum received= ", executionPrice * etherAmount);

        const minimumReceived = executionPrice * etherAmount;
        const result = {
          tokenPriceInEth: tokenPriceInEth,
          tokenCalculate: finalPrice,
          minimumReceived: minimumReceived,
        };
        return res.status(200).json(result);
      } catch (error) {
        console.log(error);
        let response = {
          message: error,
        };
        res.status(404).send(response);
      }
    } else {
      let response = {
        message: "The Contract Address Provided Does Not Exist",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenToTokenPriceMustafa", async (req, res) => {
  const { amount, toSymbol, symbol, providerType } = req.body;
  const swapTokenFrom = await helper.getContractAddress(symbol, providerType);
  const SwapTokenTo = await helper.getContractAddress(toSymbol, providerType);
  let Web3Client = await helper.getWebClient(providerType);
  let contract = await helper.getContractAddressInstanse(swapTokenFrom, Web3Client);
  var decimals = await contract.methods.decimals().call();
  let contract2 = await helper.getContractAddressInstanse(SwapTokenTo, Web3Client);
  var decimals2 = await contract2.methods.decimals().call();
  const amountIn_new = ((parseFloat(amount) * (10 ** parseFloat(decimals))))
  let amountInWith = await helper.exponentialToDecimal(amountIn_new)
  let amountIn = amountInWith.replaceAll(',', '')
  path = [swapTokenFrom, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', SwapTokenTo];

  let PANCAKE_ROUTER = await helper.getSwapInstanse(pancakeSwapRouter2Address, Web3Client, abi);
  const testing = await PANCAKE_ROUTER.methods.getAmountsOut(amountIn.toString(), path).call();
  let am = testing[2];
  am = (parseFloat(am) / 10 ** parseFloat(decimals2))
  console.log("🚀 ~ file: trasection.js ~ line 736 ~ router.post ~ am", am)
  console.log("🚀 ~ file: trasection.js ~ line 729 ~ router.post ~ testing", testing)
  //       var decimals = await contract.methods.decimals().call();
  // const singer = new ethers.Wallet(privateKey);

  // const account = singer.connect(provider);
  // const PANCAKE_ROUTER = new ethers.Contract(pancakeSwapRouter2Address, abi, account);
  // console.log("🚀 ~ file: trasection.js ~ line 730 ~ router.post ~ PANCAKE_ROUTER", PANCAKE_ROUTER)
  // const testing = await PANCAKE_ROUTER.getAmountsOut(amount.toString(), path)
  // console.log("🚀 ~ file: trasection.js ~ line 732 ~ router.post ~ testing", testing)

});

router.post("/tokenToTokenPriceM", async (req, res) => {
  const { amount, toSymbol, symbol, providerType } = req.body;

  if (amount && toSymbol && symbol && providerType) {
    try {
      const swapTokenFrom = await helper.getContractAddress(symbol, providerType);
      const SwapTokenTo = await helper.getContractAddress(toSymbol, providerType);
      let Web3Client = await helper.getWebClient(providerType);
      let contract = await helper.getContractAddressInstanse(swapTokenFrom, Web3Client);
      var decimals = await contract.methods.decimals().call();
      let contract2 = await helper.getContractAddressInstanse(SwapTokenTo, Web3Client);
      var decimals2 = await contract2.methods.decimals().call();
      const amountIn_new = ((parseFloat(amount) * (10 ** parseFloat(decimals))))
      let amountInWith = await helper.exponentialToDecimal(amountIn_new)
      let amountIn = amountInWith.replaceAll(',', '')
      let path = [swapTokenFrom, SwapTokenTo];

      if (toSymbol === 'LGBT' || symbol === 'LGBT') {
        path = [swapTokenFrom, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', SwapTokenTo];
      }

      let PANCAKE_ROUTER = await helper.getSwapInstanse(pancakeSwapRouter2Address, Web3Client, abi);
      const tokenPrices = await PANCAKE_ROUTER.methods.getAmountsOut(amountIn.toString(), path).call();

      const amNew = ((parseFloat(1) * (10 ** parseFloat(decimals))))
      let amountWith = await helper.exponentialToDecimal(amNew)
      let amnt = (amountWith.indexOf(',') > -1) ? amountWith.replaceAll(',', '') : amountWith;
      const toTokenPriceInFrom = await PANCAKE_ROUTER.methods.getAmountsOut(amnt.toString(), path).call();
      let minimumReceived = tokenPrices[1];
      let ethPriceInToken = toTokenPriceInFrom[1];
      if (toSymbol === 'LGBT' || symbol === 'LGBT') {
        minimumReceived = tokenPrices[2];
        ethPriceInToken = toTokenPriceInFrom[2];
      }

      minimumReceived = (parseFloat(minimumReceived) / 10 ** parseFloat(decimals2))
      console.log("🚀 ~ file: trasection.js ~ line 788 ~ router.post ~ minimumReceived", minimumReceived)
      ethPriceInToken = (parseFloat(ethPriceInToken) / 10 ** parseFloat(decimals2))
      console.log("🚀 ~ file: trasection.js ~ line 790 ~ router.post ~ ethPriceInToken", ethPriceInToken)

      const result = { tokenPriceInToken: ethPriceInToken, tokenCalculate: minimumReceived, minimumReceived: minimumReceived }
      return res.status(200).json(result);

      // const swapTokenFrom = await helper.getContractAddress(symbol, providerType);
      // const SwapTokenTo = await helper.getContractAddress(toSymbol, providerType);

      // let Web3Client = await helper.getWebClient(providerType);
      // let contract = await helper.getContractAddressInstanse(swapTokenFrom, Web3Client);
      // let contractto = await helper.getContractAddressInstanse(SwapTokenTo, Web3Client);
      // var decimals = await contract.methods.decimals().call();
      // const amountIn_new = ((parseFloat(amount) * (10 ** parseFloat(decimals))))
      // let amountInWith = await helper.exponentialToDecimal(amountIn_new)
      // let amountIn = amountInWith.replaceAll(',', '')

      // const chainId = ChainId.MAINNET;
      // const weth = WETH[chainId];
      // const swapTokenF = await Fetcher.fetchTokenData(chainId, swapTokenFrom, provider);
      // const swapTokenM = await Fetcher.fetchTokenData(chainId, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', provider);
      // const swapTokenT = await Fetcher.fetchTokenData(chainId, SwapTokenTo, provider);
      // let pair
      // if (toSymbol === 'LGBT' || symbol === 'LGBT') {
      //   pair = await Fetcher.fetchPairData(swapTokenF, swapTokenM, provider);
      // } else {
      //   pair = await Fetcher.fetchPairData(swapTokenF, swapTokenT, provider);
      // }
      // const route = new Route([pair], swapTokenF);
      // const trade = new Trade(route, new TokenAmount(swapTokenF, amountIn.toString()), TradeType.EXACT_INPUT);

      // let ethPriceInToken;
      // let ethPrice;
      // let executionPrice;
      // finalPrice = Number(amount) * ethPrice;

      // if (toSymbol === 'LGBT' || symbol === 'LGBT') {
      //   const pair2 = await Fetcher.fetchPairData(swapTokenM, swapTokenT, provider);
      //   let tAmount = route.midPrice.toSignificant(6)
      //   const route2 = new Route([pair2], swapTokenM);
      //   const amIn_new = ((parseFloat(tAmount) * (10 ** parseFloat(18))))
      //   let amInWith = await helper.exponentialToDecimal(amIn_new)

      //   const BNBAmount = parseInt(amInWith);
      //   const trade2 = new Trade(route2, new TokenAmount(swapTokenM, BNBAmount.toString()), TradeType.EXACT_INPUT);

      //   ethPriceInToken = Number(route.midPrice.invert().toSignificant(6)) * Number(route2.midPrice.invert().toSignificant(6));
      //   ethPrice = Number(amount) * Number(route2.midPrice.toSignificant(6));
      //   executionPrice = Number(trade.executionPrice.toSignificant(6)) * Number(trade2.executionPrice.toSignificant(6));
      //   finalPrice = Number(trade2.executionPrice.toSignificant(6)) * ethPrice;

      // } else {
      //   ethPriceInToken = Number(route.midPrice.invert().toSignificant(6));
      //   ethPrice = Number(route.midPrice.toSignificant(6));
      //   executionPrice = Number(trade.executionPrice.toSignificant(6));
      //   finalPrice = Number(amount) * ethPrice;
      // }

      // finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;
      // console.log(`1 ${symbol} = `, ethPriceInToken)
      // console.log(`total ${toSymbol} by given by ${symbol}= `, finalPrice)
      // console.log("Minimum received= ", executionPrice * Number(amount));
      // const minimumReceived = executionPrice * Number(amount);
      // const result = { tokenPriceInToken: ethPriceInToken, tokenCalculate: minimumReceived, minimumReceived: minimumReceived }
      // return res.status(200).json(result);

    } catch (error) {
      return res.status(400).json({ message: error });
    }

  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenApproveForSwap", async (req, res) => {

  const { walletAddress, privateKey, symbol, providerType } = req.body;
  if (walletAddress && privateKey && symbol && providerType) {

    let Web3Client = await helper.getWebClient(providerType);
    const balInEth = await Web3Client.eth.getBalance(walletAddress)
    const ethAmount = Web3Client.utils.fromWei(balInEth, 'ether')
    if (Number(ethAmount) < 0.005) {
      return res.status(400).json({ error: `You do not have enough BNB to transfer/buy/send/swap. Kindly get more BNB to proceed.` });
    }
    //get contract Instance
    const contractAddress = await helper.getContractAddress(symbol, providerType);
    let contract = await helper.getContractAddressInstanse(contractAddress, Web3Client);


    var decimals = await contract.methods.decimals().call();

    var amount = 1000000000000

    let approveAmount_new = (parseFloat(amount) * (10 ** parseFloat(decimals)))
    let amountInWith = await helper.exponentialToDecimal(approveAmount_new)
    let approveAmount = amountInWith.replaceAll(',', '')

    const data = contract.methods.approve(pancakeSwapRouter2Address, amount).encodeABI();
    // Determine the nonce
    const count = await Web3Client.eth.getTransactionCount(walletAddress)
    // How many tokens do I have before sending?
    const nonce = Web3Client.utils.toHex(count);
    var gaseLimit = await Web3Client.eth.estimateGas({
      "from": walletAddress,
      "to": contractAddress,
      "data": data
    });

    let trasctionData = await helper.transferTokenToOtherWallets(gaseLimit, data, walletAddress, nonce, privateKey, contractAddress, Web3Client)
    res.status(200).send(trasctionData);

  } else {
    let response = { message: "Missing Data" };
    res.status(404).send(response);
  }

}),

  router.post("/tokenToTokenSwapM", async (req, res) => {
    const { privateKey, toSymbol, symbol, amount, walletAddress, providerType, percentage } = req.body;

    if (privateKey && toSymbol && symbol && amount && walletAddress && providerType && percentage) {

      const swapTokenFrom = await helper.getContractAddress(symbol, providerType);
      const SwapTokenTo = await helper.getContractAddress(toSymbol, providerType);

      if (swapTokenFrom && SwapTokenTo) {
        let Web3Client = await helper.getWebClient(providerType);
        const balInEthM = await Web3Client.eth.getBalance(walletAddress)
        const ethAmountM = Web3Client.utils.fromWei(balInEthM, 'ether')
        if (Number(ethAmountM) < 0.005) {
          return res.status(400).json({ error: `Insufficient Funds For Transaction` });
        }
        let contract = await helper.getContractAddressInstanse(swapTokenFrom, Web3Client);
        var decimals = await contract.methods.decimals().call();
        const amountIn_new = ((parseFloat(amount) * (10 ** parseFloat(decimals))))
        let amountInWith = await helper.exponentialToDecimal(amountIn_new)
        let amountIn = amountInWith.replaceAll(',', '')

        const chainId = ChainId.MAINNET;
        const weth = WETH[chainId];

        const swapTokenF = await Fetcher.fetchTokenData(chainId, swapTokenFrom, provider);
        const swapTokenM = await Fetcher.fetchTokenData(chainId, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', provider);
        const swapTokenT = await Fetcher.fetchTokenData(chainId, SwapTokenTo, provider);
        let pair

        if (toSymbol === 'LGBT' || symbol === 'LGBT') {
          pair = await Fetcher.fetchPairData(swapTokenF, swapTokenM, provider);
        } else {
          pair = await Fetcher.fetchPairData(swapTokenF, swapTokenT, provider);
        }

        const route = new Route([pair], swapTokenF);
        const trade = new Trade(route, new TokenAmount(swapTokenF, amountIn.toString()), TradeType.EXACT_INPUT);
        let tAmount = route.midPrice.toSignificant(6)
        const slippageTolerance = new Percent(percentage ? percentage : "50", "10000"); //10 bips 1 bip = 0.001%

        let amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;

        let path = [swapTokenF.address, swapTokenT.address];

        if (toSymbol === 'LGBT' || symbol === 'LGBT') {
          const pair2 = await Fetcher.fetchPairData(swapTokenM, swapTokenT, provider);
          const route2 = new Route([pair2], swapTokenM);

          console.log("🚀 ~ file: trasection.js ~ line 836 ~ router.post ~ tAmount.toString()", tAmount.toString())

          const amIn_new = ((parseFloat(tAmount) * (10 ** parseFloat(18))))
          let amInWith = await helper.exponentialToDecimal(amIn_new)

          const BNBAmount = parseInt(amInWith);
          const trade2 = new Trade(route2, new TokenAmount(swapTokenM, BNBAmount.toString()), TradeType.EXACT_INPUT);
          path = [swapTokenF.address, swapTokenM.address, swapTokenT.address];
          amountOutMin = trade2.minimumAmountOut(slippageTolerance).raw;
        }

        const to = walletAddress;
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        const singer = new ethers.Wallet(privateKey);

        const account = singer.connect(provider);
        const PANCAKE_ROUTER = new ethers.Contract(pancakeSwapRouter2Address, abi, account);
        try {
          const tx = await PANCAKE_ROUTER.swapExactTokensForTokens(
            amountIn.toString(),
            amountOutMin.toString(),
            path,
            to,
            deadline,
            { gasPrice: 1.5e10, gasLimit: 1000000 }
          );

          const receipt = await tx.wait();
          console.log(`Tx-hash: ${tx.hash}`);
          console.log(`Tx was mined in block: ${receipt.blockNumber}`);
          let response = {
            hash: tx.hash,
            blockNumber: receipt.blockNumber,
          };
          return res.status(200).json(response);
        } catch (error) {
          return res.status(400).json({ error: error.reason });
        }
      } else {

      }
    } else {
      let response = { message: "Missing Data" };
      res.status(404).send(response);
    }
  });

router.post("/tokenToTokenPrice", async (req, res) => {
  if (
    req.body.amount &&
    req.body.toSymbol &&
    req.body.symbol &&
    req.body.providerType
  ) {
    let etherAmount = req.body.amount;
    let fromSymbol = req.body.symbol;
    let toSymbol = req.body.toSymbol;
    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    let fromcontractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    console.log("to-contractAddress----", contractAddress);
    console.log("fromcontractAddress----", fromcontractAddress);
    if (contractAddress && fromcontractAddress) {
      if (
        (toSymbol === "BUSD" && fromSymbol === "LGBT") ||
        (fromSymbol === "BUSD" && toSymbol === "LGBT")
      ) {
        try {
          let Web3Client = await helper.getWebClient(req.body.providerType);
          let contract = await helper.getContractAddressInstanse(contractAddress, Web3Client);
          var decimals = await contract.methods.decimals().call();
          const amountIn_new = ((parseFloat(etherAmount) * (10 ** parseFloat(decimals))))
          let amountInWith = await helper.exponentialToDecimal(amountIn_new)
          let amountIn = amountInWith.replaceAll(',', '')
          //var tradeAmount = ethers.utils.parseEther(String(amountIn));
          var tradeAmount = amountIn;


          console.log("tradeAmount  ---", tradeAmount);
          //process.exit(0);

          const chainId = ChainId.MAINNET;
          //console.log(chainId);
          const weth = WETH[chainId];
          //console.log(weth);
          const addresses = {
            WBNB: contractAddress,
            BUSD: weth.address,
            PANCAKE_ROUTER: pancakeSwapRouter2Address, //router 2 address
          };
          const [WBNB, BUSD] = await Promise.all(
            [addresses.WBNB, addresses.BUSD].map(
              (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, decimals)
            )
          );

          console.log("WBNB, BUSDWBNB, BUSDWBNB, BUSD ", WBNB, BUSD);
          const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);
          console.log("pppppppppppppppppppppppppppppppp", pair);
          const route = await new Route([pair], WBNB);
          console.log("================= route=========", route);
          const trade = await new Trade(
            route,
            new TokenAmount(WBNB, tradeAmount),
            TradeType.EXACT_INPUT
          );
          console.log("contractAddress==========================");
          const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
          console.log("tokenPriceInEth ---", tokenPriceInEth);
          const tokenPrice = route.midPrice.toSignificant(6);
          console.log("tokenPrice ---", tokenPrice);
          let finalPrice = Number(etherAmount) * Number(tokenPrice);
          console.log("finalPrice ---", finalPrice);
          finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;
          var tradeAmountNew = ethers.utils.parseEther(String(tokenPriceInEth));
          const tokenAddressNew = fromcontractAddress;
          const swapToken = await Fetcher.fetchTokenData(
            chainId,
            tokenAddressNew,
            provider
          );
          console.log("swapToken", swapToken);
          const pairnew = await Fetcher.fetchPairData(
            swapToken,
            weth,
            provider
          );
          const routenew = await new Route([pairnew], weth);
          const tradenew = await new Trade(
            routenew,
            new TokenAmount(weth, tradeAmountNew),
            TradeType.EXACT_INPUT
          );
          const tokenPriceInEthnew = route.midPrice.invert().toSignificant(6);
          const tokenPricenew = route.midPrice.toSignificant(6);
          let finalPricenew = Number(etherAmount) * Number(tokenPricenew);
          let executionPricenew = tradenew.executionPrice.toSignificant(6);
          finalPricenew =
            Math.round((finalPricenew + Number.EPSILON) * 100) / 100;

          console.log("1 token = ", tokenPriceInEthnew);
          console.log("total token by given by eth= ", finalPrice);
          console.log("Minimum received= ", executionPricenew * etherAmount);

          const minimumReceived = executionPricenew * etherAmount;
          const result = {
            tokenPriceInEth: tokenPriceInEth,
            tokenCalculate: finalPrice,
            minimumReceived: minimumReceived,
          };
          return res.status(200).json(result);
        } catch (error) {
          console.log(error.message);
          let response = {
            message: error,
          };
          res.status(404).send(response);
        }
      } else {
        try {
          const chainId = ChainId.MAINNET;
          const weth = WETH[chainId];
          let toSwapToken = await Fetcher.fetchTokenData(
            chainId,
            contractAddress,
            provider
          );
          // let toSwapToken = await ((toSymbol == "BUSD" && fromSymbol  == "LGBT") || (fromSymbol == "BUSD" &&   toSymbol== "LGBT") ) ?  weth : toTokens;
          const fromSwapToken = await Fetcher.fetchTokenData(
            chainId,
            fromcontractAddress,
            provider
          );
          var amountEth = ethers.utils.parseEther(String(etherAmount));
          //fetch ether through chain id

          const pair = await Fetcher.fetchPairData(
            toSwapToken,
            fromSwapToken,
            provider
          );
          const route = new Route([pair], toSwapToken);
          const trade = new Trade(
            route,
            new TokenAmount(toSwapToken, String(amountEth)),
            TradeType.EXACT_INPUT
          );
          const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
          const tokenPrice = route.midPrice.toSignificant(6);
          let finalPrice = Number(etherAmount) * Number(tokenPrice);
          let executionPrice = trade.executionPrice.toSignificant(6);
          finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

          console.log("1 token = ", tokenPriceInEth);
          console.log("total token by given by eth= ", finalPrice);
          console.log("Minimum received= ", executionPrice * etherAmount);
          const minimumReceived = executionPrice * etherAmount;
          const result = {
            tokenPriceInEth: tokenPriceInEth,
            tokenCalculate: finalPrice,
            minimumReceived: minimumReceived,
          };
          return res.status(200).json(result);
        } catch (error) {
          console.log(error);
          let response = {
            message: error,
          };
          res.status(404).send(response);
        }
      }
    } else {
      let response = {
        message: "The Contract Address Provided Does Not Exist",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenToTokenSwap", async (req, res) => {
  if (
    req.body.privateKey &&
    req.body.toSymbol &&
    req.body.symbol &&
    req.body.amount &&
    req.body.walletAddress &&
    req.body.providerType &&
    req.body.percentage
  ) {
    let privateKey = req.body.privateKey;
    let toSymbol = req.body.toSymbol;
    let etherAmount = req.body.amount;
    let walletAddress = req.body.walletAddress;
    let fromSymbol = req.body.symbol;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    let fromContractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    if (contractAddress && fromContractAddress) {
      if (
        (toSymbol === "BUSD" && fromSymbol === "LGBT") ||
        (fromSymbol === "BUSD" && toSymbol === "LGBT")
      ) {
        try {
          var tradeAmount = ethers.utils.parseEther(String(etherAmount));
          const chainId = ChainId.MAINNET;
          console.log("chainId ", chainId);
          const weth = WETH[chainId];

          console.log("weth ", weth);

          const addresses = {
            WBNB: fromContractAddress,
            BUSD: contractAddress,
            PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
          };
          const [WBNB, BUSD] = await Promise.all(
            [addresses.WBNB, addresses.BUSD].map(
              (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
            )
          ).catch((err) => {
            if (err) {
              console.log("Error Occur in Token to Token Swap");
              console.trace(err);
            }
          });
          console.log("WBNB, BUSD ----", WBNB, BUSD);
          const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);

          console.log("pair ----", pair);
          const route = await new Route([pair], WBNB);

          console.log("route  ---", route);
          const trade = await new Trade(
            route,
            new TokenAmount(WBNB, tradeAmount),
            TradeType.EXACT_INPUT
          );
          console.log("trade ----", trade);
          const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
          const tokenPrice = route.midPrice.toSignificant(6);
          // set Tolerance 0.5%
          const slippageTolerance = new Percent(
            req.body.percentage ? req.body.percentage : "50",
            "10000"
          ); //10 bips 1 bip = 0.001%
          const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
          const path = [WBNB.address, BUSD.address];
          const to = walletAddress;
          const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
          const value = trade.inputAmount.raw;

          const singer = new ethers.Wallet(privateKey);

          const account = singer.connect(provider);
          const PANCAKE_ROUTER = new ethers.Contract(
            pancakeSwapRouter2Address,
            abi,
            account
          );
          try {
            const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
              String(amountOutMin),
              path,
              to,
              deadline,
              { value: String(value), gasPrice: 1.5e10 }
            );

            const receipt = await tx.wait();
            console.log(`Tx-hash: ${tx.hash}`);
            console.log(`Tx was mined in block: ${receipt.blockNumber}`);

            let response = {
              hash: tx.hash,
              blockNumber: receipt.blockNumber,
            };
            return res.status(200).json(response);
          } catch (error) {
            return res.status(400).json({ error: error.reason });
          }
        } catch (e) {
          console.log(e);
          res.status(400).send({ message: e.message });
        }
      } else {
        try {
          const chainId = ChainId.MAINNET;
          const weth = WETH[chainId];
          let toSwapToken = await Fetcher.fetchTokenData(
            chainId,
            contractAddress,
            provider
          );
          // let toSwapToken = await ((toSymbol == "BUSD" && fromSymbol  == "LGBT") || (fromSymbol == "BUSD" &&   toSymbol== "LGBT") ) ?  weth : toTokens;
          const fromSwapToken = await Fetcher.fetchTokenData(
            chainId,
            fromcontractAddress,
            provider
          );
          var amountEth = ethers.utils.parseEther(String(etherAmount));
          //fetch ether through chain id

          const pair = await Fetcher.fetchPairData(
            toSwapToken,
            fromSwapToken,
            provider
          );
          const route = new Route([pair], toSwapToken);
          const trade = new Trade(
            route,
            new TokenAmount(toSwapToken, String(amountEth)),
            TradeType.EXACT_INPUT
          );
          const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
          const tokenPrice = route.midPrice.toSignificant(6);
          let finalPrice = Number(etherAmount) * Number(tokenPrice);
          let executionPrice = trade.executionPrice.toSignificant(6);
          finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

          console.log("1 token = ", tokenPriceInEth);
          console.log("total token by given by eth= ", finalPrice);
          console.log("Minimum received= ", executionPrice * etherAmount);
          const minimumReceived = executionPrice * etherAmount;
          const result = {
            tokenPriceInEth: tokenPriceInEth,
            tokenCalculate: finalPrice,
            minimumReceived: minimumReceived,
          };
          return res.status(200).json(result);
        } catch (error) {
          console.log(error);
          let response = {
            message: error,
          };
          res.status(404).send(response);
        }
      }
    } else {
      let response = {
        message: "The Contract Address Provided Does Not Exist",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenToCoinPrice", async (req, res) => {
  if (req.body.amount && req.body.fromSymbol && req.body.providerType) {
    let etherAmount = parseFloat(req.body.amount);
    let fromSymbol = req.body.fromSymbol;
    let contractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    console.log("contractAddress", contractAddress);
    if (contractAddress) {
      try {
        var tradeAmount = ethers.utils.parseEther(String(etherAmount));
        const chainId = ChainId.MAINNET;
        //console.log(chainId);
        const weth = WETH[chainId];
        //console.log(weth);
        const addresses = {
          WBNB: contractAddress,
          BUSD: weth.address,
          PANCAKE_ROUTER: pancakeSwapRouter2Address, //router 2 address
        };
        const [WBNB, BUSD] = await Promise.all(
          [addresses.WBNB, addresses.BUSD].map(
            (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
          )
        );

        const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);
        console.log("pppppppppppppppppppppppppppppppp");
        const route = await new Route([pair], WBNB);
        console.log("==========================");
        const trade = await new Trade(
          route,
          new TokenAmount(WBNB, tradeAmount),
          TradeType.EXACT_INPUT
        );
        console.log("contractAddress==========================");
        const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
        const tokenPrice = route.midPrice.toSignificant(6);
        let finalPrice = Number(etherAmount) * Number(tokenPrice);
        let executionPrice = trade.executionPrice.toSignificant(6);

        finalPrice = Math.round((finalPrice + Number.EPSILON) * 100) / 100;

        console.log("1 token = ", tokenPriceInEth);
        console.log("total token by given by eth= ", finalPrice);
        console.log("Minimum received= ", executionPrice * etherAmount);

        const minimumReceived = executionPrice * etherAmount;
        const result = {
          tokenPriceInEth: tokenPriceInEth,
          tokenCalculate: finalPrice,
          minimumReceived: minimumReceived,
        };
        return res.status(200).json(result);
      } catch (error) {
        console.log(error.message);
        let response = {
          message: error,
        };
        res.status(404).send(response);
      }
    } else {
      let response = {
        message: "The Contract Address Provided Does Not Exist",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/tokenToCoinSwap", async (req, res) => {
  if (
    req.body.privateKey &&
    req.body.fromSymbol &&
    req.body.amount &&
    req.body.walletAddress &&
    req.body.providerType
  ) {
    let privateKey = req.body.privateKey;
    let etherAmount = req.body.amount;
    let walletAddress = req.body.walletAddress;
    let fromSymbol = req.body.fromSymbol;
    let Web3Client = await helper.getWebClient(req.body.providerType);
    const balInEthM = await Web3Client.eth.getBalance(walletAddress)
    const ethAmountM = Web3Client.utils.fromWei(balInEthM, 'ether')
    if (Number(ethAmountM) < 0.005) {
      return res.status(400).json({ error: `Insufficient Funds For Transaction` });
    }
    let contractAddress = await helper.getContractAddress(
      fromSymbol,
      req.body.providerType
    );
    if (contractAddress) {
      var tradeAmount = ethers.utils.parseEther(String(etherAmount));
      const chainId = ChainId.MAINNET;
      const weth = WETH[chainId];

      const addresses = {
        WBNB: contractAddress,
        BUSD: weth.address,
        PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
      };
      const [WBNB, BUSD] = await Promise.all(
        [addresses.WBNB, addresses.BUSD].map(
          (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
        )
      );
      const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);

      const route = await new Route([pair], WBNB);
      const trade = await new Trade(
        route,
        new TokenAmount(WBNB, tradeAmount),
        TradeType.EXACT_INPUT
      );

      const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
      const tokenPrice = route.midPrice.toSignificant(6);
      // set Tolerance 0.5%
      const slippageTolerance = new Percent("50", "10000"); //10 bips 1 bip = 0.001%
      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
      //set path of token and ether
      console.log("WBNB.address ", WBNB.address);
      const path = [WBNB.address, BUSD.address];
      const to = walletAddress;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const value = trade.inputAmount.raw;

      const singer = new ethers.Wallet(privateKey);

      const account = singer.connect(provider);
      const PANCAKE_ROUTER = new ethers.Contract(
        pancakeSwapRouter2Address,
        abi,
        account
      );
      try {
        const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
          String(amountOutMin),
          path,
          to,
          deadline,
          { value: String(value), gasPrice: 1.5e10 }
        );

        const receipt = await tx.wait();
        console.log(`Tx-hash: ${tx.hash}`);
        console.log(`Tx was mined in block: ${receipt.blockNumber}`);

        let response = {
          hash: tx.hash,
          blockNumber: receipt.blockNumber,
        };
        return res.status(200).json(response);
      } catch (error) {
        return res.status(400).json({ error: error.reason });
      }
    } else {
      let response = {
        message: "The Contract Address Provided Does Not Exist",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

//combine api for swapping token_to_coin and coin_to_token
router.post("/Swapping", async (req, res) => {
  if (
    req.body.privateKey &&
    req.body.symbol &&
    req.body.amount &&
    req.body.walletAddress &&
    req.body.providerType &&
    req.body.swapType
  ) {
    let privateKey = req.body.privateKey;
    let toSymbol = req.body.symbol;
    let etherAmount = req.body.amount;
    let walletAddress = req.body.walletAddress;
    let swapType = req.body.swapType;

    let contractAddress = await helper.getContractAddress(
      toSymbol,
      req.body.providerType
    );
    if (contractAddress) {
      let Web3Client = await helper.getWebClient(req.body.providerType);
      const balInEthM = await Web3Client.eth.getBalance(walletAddress)
      const ethAmountM = Web3Client.utils.fromWei(balInEthM, 'ether')
      if (Number(ethAmountM) < 0.005) {
        return res.status(400).json({ error: `Insufficient Funds For Transaction` });
      }
      var tradeAmount = ethers.utils.parseEther(String(etherAmount));
      const chainId = ChainId.MAINNET;
      const weth = WETH[chainId];

      const addresses = {
        WBNB: swapType == "coin_to_token" ? weth.address : contractAddress, //weth.address,
        BUSD: swapType == "coin_to_token" ? contractAddress : weth.address, //contractAddress,
        PANCAKE_ROUTER: pancakeSwapRouter2Address, //pancakeswap router 2 mainnet
      };
      const [WBNB, BUSD] = await Promise.all(
        [addresses.WBNB, addresses.BUSD].map(
          (tokenAddress) => new Token(ChainId.MAINNET, tokenAddress, 18)
        )
      );
      const pair = await Fetcher.fetchPairData(WBNB, BUSD, provider);

      const route = await new Route([pair], WBNB);
      const trade = await new Trade(
        route,
        new TokenAmount(WBNB, tradeAmount),
        TradeType.EXACT_INPUT
      );

      const tokenPriceInEth = route.midPrice.invert().toSignificant(6);
      const tokenPrice = route.midPrice.toSignificant(6);
      // set Tolerance 0.5%
      const slippageTolerance = new Percent("50", "10000"); //10 bips 1 bip = 0.001%
      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
      //set path of token and ether
      const path = [addresses.WBNB, addresses.BUSD];
      const to = walletAddress;
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const value = trade.inputAmount.raw;

      const singer = new ethers.Wallet(privateKey);

      const account = singer.connect(provider);
      const PANCAKE_ROUTER = new ethers.Contract(
        pancakeSwapRouter2Address,
        abi,
        account
      );
      try {
        const tx = await PANCAKE_ROUTER.swapExactETHForTokens(
          String(amountOutMin),
          path,
          to,
          deadline,
          { value: String(value), gasPrice: 1.5e10 }
        );

        const receipt = await tx.wait();
        console.log(`Tx-hash: ${tx.hash}`);
        console.log(`Tx was mined in block: ${receipt.blockNumber}`);

        let response = {
          hash: tx.hash,
          blockNumber: receipt.blockNumber,
        };
        return res.status(200).json(response);
      } catch (error) {
        return res.status(400).json({ error: error.reason });
      }
    } else {
      let response = {
        message: "The Contract Address Provided Does Not Exist",
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

//BTC trasections
// test network  https://api.blockcypher.com/v1/bcy/test/
// live network  https://api.blockcypher.com/v1/btc/main/

router.post("/estimateBTCTransactionFee", async (req, res) => {
  if (req.body.fromAddress && req.body.toAddress && req.body.amount) {
    let status = await helper.validateBitcoinAddress(req.body.toAddress);
    let responce = await helper.getBalance(req.body.toAddress);
    if (status == 200 && responce.btcBal > Number(req.body.amount)) {
      let data = await helper.estimateFeeForBTCTransaction(
        req.body.fromAddress,
        req.body.toAddress,
        req.body.amount
      );
      res.status(data.status).send(data);
    } else {
      let response = {
        message: "Wallet Address Not Found, Or Insufficient Funds No history found- No History Found"
      };
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/sendBtcTrasection", async (req, res) => {
  if (req.body.fromAddress && req.body.toAddress && req.body.amount && req.body.privateKey) {
    let fromAddress = req.body.fromAddress;
    let toAddress = req.body.toAddress;
    let amount = parseFloat(req.body.amount);
    let privatekey = req.body.privateKey;

    let data = await helper.sendBTCTrasection(privatekey, amount, fromAddress, toAddress);
    res.status(data.status).send(data);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/BTCBalance", async (req, res) => {
  if (req.body.walletAddress && req.body.symbol) {
    let walletAddress = req.body.walletAddress;
    let symbol = req.body.symbol;
    let responce = await helper.getBalance(walletAddress);
    const btcInDollar = await helper.getCryptoInUsd(symbol);
    if (responce.btcBal > 0 && btcInDollar > 0) {
      let balanceInDollar = responce.btcBal * btcInDollar;
      responce.balanceInDollar = balanceInDollar;
    }
    res.status(responce.status).send(responce);
  } else {
    let response = { message: "Missing Data" };
    res.status(404).send(response);
  }
});

router.post("/XRPBalance", async (req, res) => {
  if (req.body.walletAddress && req.body.symbol) {
    let walletAddress = req.body.walletAddress;
    let symbol = req.body.symbol;
    let responce = await helper.getXRPBalance(walletAddress);
    const xrpInDollar = await helper.getCryptoInUsd(symbol);
    if (responce.xrpBal > 0 && xrpInDollar > 0) {
      let balanceInDollar = responce.xrpBal * xrpInDollar;
      responce.balanceInDollar = balanceInDollar;
    }
    res.status(responce.status).send(responce);
  } else {
    let response = { message: "Missing Data" };
    res.status(404).send(response);
  }
});

router.post("/estimateXRPTransactionFee", async (req, res) => {
  if (req.body.fromAddress && req.body.toAddress && req.body.amount) {

    let status = await helper.validateXRPAddress(req.body.toAddress);
    if (status === 400) {
      let response = { message: "Wallet Address Not Found" };
      res.status(404).send(response);
    } else {
      let responce = await helper.getXRPBalance(req.body.fromAddress);
      if (responce.xrpBal < Number(req.body.amount)) {
        let response = { message: "Insufficient Funds" };
        res.status(404).send(response);
      } else {
        let data = await helper.estimateFeeForXRPTransaction(req.body.fromAddress, req.body.toAddress, req.body.amout);
        res.status(data.status).send(data);
      }
    }

  } else {
    let response = { message: "Missing Data" };
    res.status(404).send(response);
  }
});

router.post("/sendXRPTransaction", async (req, res) => {
  if (req.body.fromAddress && req.body.toAddress && req.body.amount && req.body.privateKey) {

    let fromAddress = req.body.fromAddress;
    let toAddress = req.body.toAddress;
    let amount = parseFloat(req.body.amount);
    let privatekey = req.body.privateKey;

    let data = await helper.sendXRPTransaction(
      privatekey,
      amount,
      fromAddress,
      toAddress
    );
    res.status(data.status).send(data);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/getXRPtransaction", async (req, res) => {
  const { walletAddress, symbol } = req.body;
  if (symbol === 'XRP') {
    let status = await helper.validateXRPAddress(req.body.toAddress);
    if (status === 400) {
      let response = { message: "Wallet Address Not Found" };
      res.status(404).send(response);
    } else {
      let data = await helper.XRPTransactionHistory(walletAddress);
      res.status(data.status).send(data);
    }
  } else {
    return res.status(400).json({ error: 'request is not valid' });
  }
});

router.post("/transferSolNfts", async (req, res) => {
  const { privatekey, mint, toWallet } = req.body
  if (privatekey && mint && toWallet) {
    let data = await helper.transferSolanaNfts(privatekey, mint, toWallet);
    res.status(data.status).send(data);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/sendSolTrasection", async (req, res) => {
  if (req.body.fromAddress && req.body.toAddress && req.body.amount && req.body.privateKey) {

    let fromAddress = req.body.fromAddress;
    let toAddress = req.body.toAddress;
    let amount = parseFloat(req.body.amount);
    let privatekey = req.body.privateKey;

    let data = await helper.sendSOLTrasection(
      privatekey,
      amount,
      fromAddress,
      toAddress
    );
    res.status(data.status).send(data);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/SOLBalance", async (req, res) => {

  if (req.body.walletAddress && req.body.symbol) {
    let walletAddress = req.body.walletAddress;
    let symbol = req.body.symbol;
    let responce = await helper.getSolBalance(walletAddress);
    const solInDollar = await helper.getCryptoInUsd(symbol);
    if (responce.solBal > 0 && solInDollar > 0) {
      let balanceInDollar = responce.solBal * solInDollar;
      responce.balanceInDollar = balanceInDollar;
    }
    res.status(responce.status).send(responce);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/getSolanaWalletsNfts", async (req, res) => {
  if (req.body.walletAddress && req.body.symbol) {
    //let walletAddress = 'AdB9eL5XEXfv8R2kWjiYuCbTL3oyHGcUbZCBw96Q4CFZ';
    let walletAddress = req.body.walletAddress;
    const result = await helper.getSolWalletNfts(walletAddress);
    let i = 1;
    let total = result.length
    let nftDataArray = [];
    if (result.length > 0) {
      result.forEach(async (element) => {
        let response = null;
        try {
          response = await axios.get(`https://api.theblockchainapi.com/v1/solana/nft?mint_address=${element.tokenAddress}&network=mainnet-beta`, {
            headers: {
              'APISecretKey': 'rL5Fb8hvAKZHoso',
              'APIKeyId': '8gOeea8HNC2w4hT'
            },
          });
        } catch (error) {
          console.log("🚀 ~ file: trasection.js ~ line 1766 ~ result.forEach ~ error", error)
          response = null;
        }
        if (response) {
          console.log("🚀 ~ file: trasection.js ~ line 1772 ~ result.forEach ~ response", response)

          if (response.data.collection.collection_verified === 1) {
            nftDataArray.push(response.data)
          }
        }
        i++
        if (i > total) {
          return res.status(200).json(nftDataArray);
        }
      });
    } else {
      return res.status(200).json([]);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/getSolanaTrasections", async (req, res) => {

  const { walletAddress, symbol } = req.body;
  if (symbol === 'SOL') {
    try {
      let sendArray = [];
      const baseUrlSol = 'https://public-api.solscan.io';
      let api = `${baseUrlSol}/account/solTransfers?account=${walletAddress}&offset=0&limit=50`;
      const response = await axios.get(api);
      if (response.data.data.length > 0) {
        const transaction = response.data.data;
        if (transaction) {
          transaction.forEach(trans => {
            let balance = trans.lamport
            let fee = trans.fee
            let amount = balance / solanaWeb3.LAMPORTS_PER_SOL;
            let gasFee = fee / solanaWeb3.LAMPORTS_PER_SOL;
            var date = new Date(trans.blockTime * 1000).toISOString();
            let type = (trans.src === walletAddress) ? 'Received' : 'Send';

            let Data = {
              "date": date, "from": trans.src, "to": trans.dst, "gasPrice": gasFee,
              "amount": amount, "total": (amount + gasFee), "status": trans.status,
              "transactionHash": trans.txHash, "type": type
            };
            sendArray.push(Data)
          });
          return res.status(200).json({ data: sendArray });
        }
        return res.status(200).json({ data: [], message: response.data.message });
      }
      return res.status(200).json({ data: [], message: response.data.message });
    } catch (error) {

      return res.status(400).json({ error: error.message });
    }
  } else {

    return res.status(400).json({ error: 'request is not valid' });
  }
});

router.post("/getEtherTrasections", async (req, res) => {
  if (req.body.walletAddress && req.body.filter && req.body.type) {
    // txlist mean coins trasections and tokentx mean token trasections
    let type = (req.body.type = "coin") ? "txlist" : "tokentx";
    let walletAddress = req.body.walletAddress;
    let filter = req.body.filter;
    var data = JSON.stringify({
      inputs: [
        {
          addresses: ["bc1q5dl6esz96hvhal69eex7edmyqkmm9le9uvy07w"],
        },
      ],
      outputs: [
        {
          addresses: ["bc1q2vuncvvacqgfepnwwjlpalycgrs7atfqaqdf8w"],
          value: 30000000,
        },
      ],
    });
    var config = {
      method: "get",
      url: `https://api.etherscan.io/api?module=account&action=${type}&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=F6QQM17ZHNAT2SX9WJCCUNIX4RNBPVPPME`,
      //url: `https://api.etherscan.io/api?module=account&action=${type}&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=F6QQM17ZHNAT2SX9WJCCUNIX4RNBPVPPME`,
      //url : `https://api.etherscan.io/api?module=account&action=tokentx&address=0x4e83362442b8d1bec281594cea3050c8eb01311c&startblock=0&endblock=27025780&sort=asc&apikey=YourApiKeyToken`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios(config)
      .then(async (response) => {
        let trasectionData = JSON.parse(JSON.stringify(response.data));
        console.log(trasectionData);

        if (trasectionData) {
          let trasections = trasectionData.result;
          for (let iteration = 0; iteration < trasections.length; iteration++) {
            trasections[iteration]["gasPrice"] = convert(
              trasections[iteration]["gasPrice"],
              "gwei",
              "ether"
            );
          }
          if (filter == "send") {
            let sendTrasectionsHistory = trasections.filter(
              (item) => item.from === walletAddress
            );
            res.status(200).send({ data: sendTrasectionsHistory });
          } else if (filter == "receive") {
            let receiveTrasectionsHistory = trasections.filter(
              (item) => item.to === walletAddress
            );
            res.status(200).send({ data: receiveTrasectionsHistory });
          } else {
            res.status(200).send({ data: trasections });
          }
        } else {
          res.status(404).send({ message: "No history found" });
        }
      })
      .catch(function (error) {
        console.log(error);
        res.status(404).send({ message: error.message });
      });
  } else {
    res.status(404).send({ message: "Missing Data" });
  }
});


router.post("/getBSCTrasections", async (req, res) => {
  if (req.body.walletAddress && req.body.filter && req.body.type) {
    let walletAddress = req.body.walletAddress.toLowerCase();
    // txlist mean coins trasections and tokentx mean token trasections
    let type = (req.body.type = "coin") ? "txlist" : "tokentx";
    let filter = req.body.filter;
    var config = {
      method: "get",
      url: `https://api.bscscan.com/api?module=account&action=${type}&address=${walletAddress}&startblock=0&endblock=99999999&sort=asc&apikey=1IKGQ52VJDQ4AP87QTSD7YNQHVVU9CDHEE`,
      headers: {},
    };
    axios(config)
      .then(function (response) {
        let trasectionData = JSON.parse(JSON.stringify(response.data));

        if (trasectionData) {
          let trasections = trasectionData.result;
          for (let iteration = 0; iteration < trasections.length; iteration++) {
            trasections[iteration]["gasPrice"] = convert(
              trasections[iteration]["gasPrice"],
              "gwei",
              "ether"
            );
          }
          if (filter == "send") {
            let sendTrasectionsHistory = trasections.filter(
              (item) => item.from === walletAddress
            );
            res.status(200).send({ data: sendTrasectionsHistory });
          } else if (filter == "receive") {
            let receiveTrasectionsHistory = trasections.filter(
              (item) => item.to === walletAddress
            );
            console.log(receiveTrasectionsHistory);
            res.status(200).send({ data: receiveTrasectionsHistory });
          } else {
            res.status(200).send({ data: trasections });
          }
        } else {
          res.status(404).send({ message: "No history found" });
        }
      })
      .catch(function (error) {
        res.status(404).send({ message: error.message });
      });
  } else {
    res.status(404).send({ message: "Missing Data" });
  }
});

module.exports = router;
