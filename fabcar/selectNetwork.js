'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Hyperledger Fabric Sample Query Program
 */

var hfc = require('fabric-client');
var path = require('path');
var fs = require('fs');

var options = {
    wallet_path: path.join(__dirname, './network/creds'),
    user_id: 'admin',
    channel_id: 'fabcar',
    chaincode_id: 'fabcar',
    network_url: 'grpcs://nb8a11e31170043fa949375ac599c4a18-org1-peer1.us2.blockchain.ibm.com:31002',
    tls_cert: {
        pem: fs.readFileSync(path.join(__dirname, './network/tls') + '/peer.cert').toString()
    }
};

var channel = {};
var client = null;

Promise.resolve().then(() => {
    console.log("Create a client and set the wallet location");
    client = new hfc();
    return hfc.newDefaultKeyValueStore({ path: options.wallet_path });
}).then((wallet) => {
    console.log("Set wallet path, and associate user ", options.user_id, " with application");
    client.setStateStore(wallet);
    return client.getUserContext(options.user_id, true);
}).then((user) => {
    console.log("Check user is enrolled, and set a query URL in the network");
    if (user === undefined || user.isEnrolled() === false) {
        console.error("User not defined, or not enrolled - error");
    }
    channel = client.newChannel(options.channel_id);
    channel.addPeer(client.newPeer(options.network_url, {
        pem: options.tls_cert.pem
    }));
    return;
}).then(() => {
    console.log("Make query");
    var transaction_id = client.newTransactionID();
    console.log("Assigning transaction_id: ", transaction_id._transaction_id);

    // queryCar - requires 1 argument, ex: args: ['CAR4'],
    // queryAllCars - requires no arguments , ex: args: [''],
    const request = {
        chaincodeId: options.chaincode_id,
        txId: transaction_id,
        fcn: 'queryCar',
        args: ['CAR10']
    };
    return channel.queryByChaincode(request);
}).then((query_responses) => {
    console.log("returned from query");
    if (!query_responses.length) {
        console.log("No payloads were returned from query");
    } else {
        console.log("Query result count = ", query_responses.length)
    }
    if (query_responses[0] instanceof Error) {
        console.error("error from query = ", query_responses[0]);
    }
    console.log("Response is ", query_responses[0].toString());
}).catch((err) => {
    console.error("Caught Error", err);
});
