const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 4000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k2pkm.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        await client.connect();
        const products = client.db("manufacturer").collection("products");
        console.log("Connected successfully to server");
    } finally {
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Manufactuerer server is running...");
});

app.listen(port, () => {
    console.log("Listening to port", port);
});