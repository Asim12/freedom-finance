var express = require("express");
const md5 = require("md5");
var router = express.Router();
const helper = require("../helper/customHelper");
const bip39 = require("bip39");

router.post('/sigin', async (req, res) => {
  if (req.body.phone_number && req.body.password) {

    let userObject = await helper.varifyCredentials(req.body.phone_number, req.body.password)
    console.log("🚀 ~ file: auth.js ~ line 11 ~ router.post ~ userObject", userObject)
    if (userObject) {
      let response = { data: userObject }
      res.status(200).send(response);
    } else {
      let response = {
        message: 'Invalid Credentials'
      }
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: 'Missing Data'
    }
    res.status(404).send(response);
  }
})

// router.post("/sigin", async (req, res) => {
//   if (req.body.email && req.body.password) {
//     let userObject = await helper.varifyCredentials(
//       req.body.email.trim().toLowerCase(),
//       req.body.password
//     );
//     if (userObject) {
//       let response = {
//         data: userObject,
//       };
//       res.status(200).send(response);
//     } else {
//       let response = {
//         message: "Invalid Credentials",
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

router.post("/sendOTPNumber", async (req, res) => {
  if (req.body.phone_number) {
    let check = await helper.sendNumberOtp(req.body.phone_number);
    console.log("🚀 ~ file: auth.js ~ line 35 ~ router.post ~ check", check)
    if (check.sid) {
      let response = {
        message: "Code Sent",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "Code Not Sent, Try Again.",
      };
      console.log("🚀 ~ file: auth.js ~ line 45 ~ router.post ~ response", response)
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: "Missing Data",
    };
    console.log("🚀 ~ file: auth.js ~ line 52 ~ router.post ~ response", response)
    res.status(404).send(response);
  }
});

router.post("/varifyOTPNumber", async (req, res) => {
  if (req.body.phone_number && req.body.code) {
    let check = await helper.varifyOtp(req.body.phone_number, req.body.code);
    if (check.status == "approved") {
      let response = {
        message: "Code Verified",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "Verification failed, Try Again.",
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

router.post("/sendOTPEmail", async (req, res) => {
  if (req.body.email) {
    let check = await helper.generateEmailConfirmationCodeSendIntoEmail(
      req.body.email
    );
    if (check == true) {
      let response = {
        message: "Code Has Been Sent to Your E-Mail",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "Code Not Sent, Try Again.",
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

router.post("/varifyOTPUsingEmail", async (req, res) => {
  if (req.body.email && req.body.code) {
    let check = await helper.codeVarifyEmail(req.body.email, req.body.code);
    console.log("assas", check);
    if (check > 0) {
      let response = {
        message: "Code Verified",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "Verification failed, Try Again.",
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

router.post("/RecoveryPhraseValidate", async (req, res) => {
  if (req.body.recoveryPhrase) {
    try {
      const validatePhrase = await bip39.validateMnemonic(req.body.recoveryPhrase)
      if (validatePhrase === false) {
        res.status(400).send({ message: 'Invalid Secret Recovery Phrase' });
      } else {
        let response = {
          recoveryPhrase: req.body.recoveryPhrase,
        };
        res.status(200).send(response);
      }

    } catch (error) {
      console.log("🚀 ~ file: auth.js ~ line 162 ~ router.post ~ error", error)
      res.status(400).send(error.message);
    }

  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
})

router.post("/createRecoveryPhrase", async (req, res) => {
  if (req.body.walletType) {
    let recoveryPhrase = bip39.generateMnemonic();
    let response = {
      recoveryPhrase,
    };
    console.log("🚀 ~ file: auth.js ~ line 153 ~ router.post ~ response", response)
    res.status(200).send(response);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post('/create_xrp_wallet', async (req, res) => {

  var walletDeatils = await helper.createXRPWallet();
});
router.post('/signup', async (req, res) => {

  console.log("🚀 ~ file: auth.js ~ line 167 ~ router.post ~ req.body", req.body)
  if (req.body.phone_number && req.body.password && req.body.recoveryPhrase) {
    let userObject = await helper.isUserAlreadyExists(req.body.phone_number)
    if (userObject == false) {
      var walletDeatils = await helper.createTrustWallet(req.body.recoveryPhrase);
      console.log("🚀 ~ file: auth.js ~ line 201 ~ router.post ~ walletDeatils", walletDeatils)
      if (walletDeatils == false) {
        let response = {
          message: 'Invalid Mnemonic Phrase'
        }
        return res.status(404).send(response);
      } else {
        let insertData = {
          password: md5(req.body.password.trim()),
          phone_number: req.body.phone_number,
          recoveryPhrase: walletDeatils.recoveryPhrase,
          walletAddress: walletDeatils.walletAddress,
          privateKey: walletDeatils.privateKey,
          walletAddressBTC: walletDeatils.walletAddressBTC,
          privateKeyBTC: walletDeatils.privateKeyBTC,
          walletAddressSOL: walletDeatils.walletAddressSOL,
          privateKeyXRP: walletDeatils.privateKeyXRP,
          walletAddressXRP: walletDeatils.walletAddressXRP,
          publicKeyXRP: walletDeatils.publicKeyXRP,
          walletSeedXRP: walletDeatils.walletSeedXRP,
          created_date: new Date()
        }

        let userId = await helper.saveUserData(insertData)
        // insertData.userId = userId;
        let response = { insertData }
        return res.status(200).send(response);
      }


    } else {
      let response = {
        message: 'Phone Number already exists!!!'
      }
      res.status(404).send(response);
    }
  } else {
    let response = {
      message: 'Missing Data'
    }
    res.status(404).send(response);
  }
})
// router.post("/signup", async (req, res) => {

//   if (req.body.email && req.body.password && req.body.recoveryPhrase) {
//     let userObject = await helper.isUserAlreadyExists(req.body.email);
//     if (userObject == false) {
//       var walletDeatils = await helper.createTrustWallet(
//         req.body.recoveryPhrase
//       );
//       if (walletDeatils == false) {
//         let response = {
//           message: "Invalid Mnemonic Phrase",
//         };
//         res.status(404).send(response);
//       } else {
//         let insertData = {
//           password: md5(req.body.password.trim()),
//           email: req.body.email.trim().toLowerCase(),
//           recoveryPhrase: walletDeatils.recoveryPhrase,
//           walletAddress: walletDeatils.walletAddress,
//           privateKey: walletDeatils.privateKey,
//           // recoveryPhraseBTC :   walletDeatils.recoveryPhraseBTC,
//           walletAddressBTC: walletDeatils.walletAddressBTC,
//           privateKeyBTC: walletDeatils.privateKeyBTC,
//           created_date: new Date(),
//         };

//         let userId = await helper.saveUserData(insertData);
//         // insertData.userId = userId;
//         let response = {
//           insertData,
//         };
//         res.status(200).send(response);
//       }
//     } else {
//       let response = {
//         message: "E-Mail Already Exists",
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

router.post("/resetPassword", async (req, res) => {
  if (req.body.user_id && req.body.oldPassword && req.body.newPassword) {
    let status = await helper.varifyPasswordAndUpdate(
      req.body.user_id,
      req.body.oldPassword,
      req.body.newPassword
    );
    if (status == true) {
      let response = {
        message: "Updated Successfully",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "Passwords Don’t Match, Update Failed ",
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

router.post("/forgetPassword", async (req, res) => {
  if (req.body.phone_number && req.body.password) {
    let status = await helper.updatePassword(req.body.phone_number, req.body.password);
    console.log("🚀 ~ file: auth.js ~ line 290 ~ router.post ~ status", status)
    if (status == true) {
      let response = {
        message: "Updated Successfully",
      };
      res.status(200).send(response);
    } else {
      let response = {
        message: "Passwords Don’t Match, Update Failed ",
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

router.post("/updateUserEmail", async (req, res) => {
  if (req.body.email && req.body.user_id) {
    console.log(req.body.user_id);
    console.log(req.body.email);
    let response = await helper.updateUserEmail(
      req.body.email,
      req.body.user_id
    );
    res.status(response.status).send(response);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/tokensSwitch", async (req, res) => {
  if (req.body.userId && req.body.tokenName) {
    helper.updateTheRecord(
      req.body.userId,
      req.body.tokenName,
      req.body.status
    );

    let response = {
      message: `we make the status : ${req.body.status}`,
    };
    res.status(200).send(response);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

router.post("/getUserToken", async (req, res) => {
  if (req.body.userId) {
    let data = await helper.getRecord(req.body.userId);

    let response = {
      data,
    };
    res.status(200).send(response);
  } else {
    let response = {
      message: "Missing Data",
    };
    res.status(404).send(response);
  }
});

module.exports = router;
