import { config } from "dotenv";
// import { BotCaption } from "./constants";
import * as fs from 'fs';
import { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
config();

// if (!process.env.RPC_URL) {
//   throw new Error(BotCaption.InvaildRPC_URL);
// }
if (!process.env.RPC_URL) {
  throw new Error("RPC_URL environment variable is missing");
}

const connection = new Connection(process.env.RPC_URL, "confirmed");

async function fetchTradableTokens(): Promise<void> {
  try {
    const response = await fetch("https://api.jup.ag/tokens/v1/mints/tradable");
    const allTradableResponse: any = await response.json();
    console.log(allTradableResponse);
    const token_address: any[] = allTradableResponse;
    const dataString = JSON.stringify(allTradableResponse, null, 2);
    fs.writeFileSync('./all_tokens.txt', dataString);

    for (let i = 0; i < token_address.length; i++) {
      await processToken(token_address[i]);
    }
  } catch (error: any) {
    console.error("Error fetching data:", error);
  }
}

async function processToken(tokenAddress: any) {
  try {
    const accounts = await connection.getParsedProgramAccounts(
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      {
        filters: [
          {
            dataSize: 165, // size of account (bytes)
          },
          {
            memcmp: {
              offset: 0, // number of bytes
              bytes: tokenAddress, // Ensure this is a base58 encoded string
            },
          },
        ],
      }
    );
   // console.log(JSON.stringify(accounts[1], null, 2));
    const uniqueHolders = new Set();
    let cnt = 0;
    accounts.forEach((account) => {
      const parsedAccountInfo = account.account.data;
      if ("parsed" in parsedAccountInfo) {
        const tokenBalance =
          parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
        if (tokenBalance > 0) {
          uniqueHolders.add(parsedAccountInfo["parsed"]["info"]["owner"]);
          cnt++;
        }
      }
    });
    
    if(cnt >= 500) {
      console.log(tokenAddress, ":", cnt);
      const filePath = 'tokens.txt';
      fs.appendFile(filePath, tokenAddress, "utf8", (err) => {});
      fs.appendFile(filePath, ":", "utf8", (err) => {});
      fs.appendFile(filePath, String(cnt), "utf8", (err) => {});
      fs.appendFile(filePath, "\n", "utf8", (err) => {});
      // console.log(":");
      // console.log(cnt);
    }
    // const dataString = JSON.stringify(allTradableResponse, null, 2);
    // fs.writeFileSync('./example.txt', dataString);
  } catch (error) {
    console.error("Error processing token:", error);
  }
}

fetchTradableTokens();
