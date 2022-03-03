
var MongoClient = require('mongodb').MongoClient;
function connectionDatabase() {
    return new Promise((resolve, reject) => {
        var url = 'mongodb+srv://news_dev:0K0ts8DE7dQId0SI@cluster0.q7vm8.mongodb.net/liberty-wallet?retryWrites=true&w=majority';
        MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, async(err, client) => {
            if (err) {
                reject(err);
            } else {
                console.log('Mongo is conected!!');
                const db = client.db('freedom-finance');
                resolve(db);
            }
        });
    });
}
module.exports = connectionDatabase();