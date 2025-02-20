const express = require('express');
const path = require('path');
const axios = require('axios');
const covalent = require('@covalenthq/client-sdk');
const {GoldRushClient} = require("@covalenthq/client-sdk");
const app = express();
const PORT = process.env.PORT || 5000;

// my account 0x66A51330b37938f414cBf09ebd2E1eB9c70051A1
// account 2 0x54BABF466A61447f3ea64d0EE80207C9ae458a02
const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const tether = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const appendBytes = "0x000000000000000000000000"
const uniswapV3Router = "0x000000000000000000000000E592427A0AEce92De3Edee1F18E0157C05861564"
const uniswapV2Router = "0x0000000000000000000000007a250d5630B4cF539739dF2C5dAcb4c659F2488D"
var user_address = ""

var key = "ckey_96476df6d859418b82a2eeda4fe"
const client = new GoldRushClient(key)


var total_gas_costs = 0
var total_pnl = 0
const holdings = {}

// https://ascopubs.org/doi/10.1200/jco.2007.25.18_suppl.18092
// Based on this source, a single session of chemotherapy is $1,112


// Serve static files from the front-end
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Express!' });
});

// Echo API route
app.get('/api/echo', async (req, res) => {
    const text = req.query.text;

    if (!text) {
        return res.status(400).json({ message: 'No text provided' });
    }

    try {
        user_address = text
        console.log(text)
        const transactions = await getAddressTransactions(text);
        processTransactions(transactions)
        console.log("total gas paid",total_gas_costs)

        // res.json(transactions);
    } catch (error) {
        res.status(500).json({message: error.message})
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const decodeSwapEvents = (log) => {

    var user_as_hex = user_address.slice(2);
    const user = appendBytes.concat(user_as_hex)
    console.log("log",log)
    for (const data of log.log_events){
        console.log("data",data)
        if(data.decoded.name == 'Transfer')
        {
            console.log(data.decoded.params)
            for(const param of data.decoded.params) {
                if (param.name == 'from') {
                    console.log('from',param.value)
                    if(param.value == user_address) {

                    }
                }
                // inflow
                if (param.name == 'to') {
                    console.log('to',param.value)
                    if(param.value == user_address) {

                    }
                }
                if (param.name == 'value') {
                    console.log('value',param.value)
                }
            }
        }
    }
}

const processTransactions = (transactions) => {
    //console.log(transactions)
    for (const tx of transactions) {
        try {
            for (const log of tx.log_events){
                if(log.decoded.name == 'Swap')
                {
                    // console.log(tx)
                    decodeSwapEvents(tx)
                    total_gas_costs += tx.gas_quote
                    break;
                }
            }
        } catch (error) {
            console.log("no logs for this transaction")
        }
        total_gas_costs += tx.gas_quote

    }

}

const getTokenBalances = async (address) => {
    try {
        const response = await client.BalanceService.getTokenBalancesForWalletAddress("eth-mainnet", walletAddress);
        return response.data.items; // Array of token holdings
    } catch (error) {
        console.error("Error fetching balances:", error);
        return [];
    }
}

const getAddressTransactions = async (address) => {


    //var url = "https://api.covalenthq.com/v1/1/address/" + address + "/transactions_v2/?page-number=0&page-size=100&quote-currency=USD&format=JSON&block-signed-at-asc=false&no-logs=false&key=" + key

    let pageSize = 100

    try {
        let transactions = [];
        let pageNumber = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            // Ensure API call is awaited
            const responseGenerator = client.TransactionService.getAllTransactionsForAddress(
                "eth-mainnet",
                address,
                { pageSize, pageNumber }
            );

            // Iterate over the AsyncGenerator
            for await (const response of responseGenerator) {
                console.log("PageNumber",pageNumber)
                if (!response || !response.data || !response.data.items) {
                    console.warn("Warning: Unexpected API response format:", response);
                    break; // Stop fetching if response format is unexpected
                }
                transactions = transactions.concat(response.data.items);
                pageNumber++; // Move to the next page
                if (response.data.current_page == 0) {
                    hasMoreData = false; // No more transactions
                }
            }
        }
        console.log("returning" +
            "")
        return transactions;
    } catch (error) {
        console.error("Error fetching Covalent transactions:", error);
        throw new Error("Failed to fetch transaction data for account");
    }

}