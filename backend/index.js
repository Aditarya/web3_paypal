const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;
const ABI = require("./abi.json");

app.use(cors());
app.use(express.json());

function convertArrayToObjects(arr) {
  const dataArray = arr.map((transaction, index) => ({
    key: (arr.length + 1 - index).toString(),
    type: transaction[0],
    amount: transaction[1],
    message: transaction[2],
    address: `${transaction[3].slice(0,4)}...${transaction[3].slice(0,4)}`,
    subject: transaction[4],
  }));

  return dataArray.reverse();
}


app.get("/getNameAndBalance", async (req, res) => {
  const { userAddress } = req.query;

  const response = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0x13881",
    address: "0xda087FC1d463Ce2F52D2097eaf731F5696cea7bE",
    functionName: "getMyName",
    abi: ABI,
    params: { _user: userAddress },
  });
  const jsonResponseName = response.raw;

  const secResponse = await Moralis.EvmApi.balance.getNativeBalance({
    chain: "0x13881",
    address: userAddress,
  });
  const jsonResponseBal = (secResponse.raw.balance / 1e18).toFixed(2);

  const thirResponse = await Moralis.EvmApi.token.getTokenPrice({
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  });

  const jsonResponseDollars = (
    thirResponse.raw.usdPrice * jsonResponseBal
  ).toFixed(2);

  const fourResponse = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0x13881",
    address: "0xda087FC1d463Ce2F52D2097eaf731F5696cea7bE",
    functionName: "getMyHistory",
    abi: ABI,
    params: { _user: userAddress },
  });

  const jsonResponseHistory = convertArrayToObjects(fourResponse.raw);

  const fiveResponse = await Moralis.EvmApi.utils.runContractFunction({
    chain: "0x13881",
    address: "0xda087FC1d463Ce2F52D2097eaf731F5696cea7bE",
    functionName: "getMyRequests",
    abi: ABI,
    params: { _user: userAddress },
  });

  const jsonResponseRequests = fiveResponse.raw;

//0xE23717D2f532ccBA9F71A2C10811aA7b721C568D
//0xeCfB2DFA59c756b3c70f0c6730F966F74C57790b

  const jsonResponse = {
    name: jsonResponseName,
    balance: jsonResponseBal,
    dollars: jsonResponseDollars,
    history: jsonResponseHistory,
    requests: jsonResponseRequests,
  };




  return res.status(200).json(jsonResponse);
});

Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls from Moralis`);
  });
});