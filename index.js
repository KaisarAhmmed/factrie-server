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

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "UnAuthorized access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const productsCollectoin = client
            .db("manufacturer")
            .collection("products");
        const userCollection = client.db("manufacturer").collection("users");
        const orderCollection = client.db("manufacturer").collection("orders");

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({
                email: requester,
            });
            if (requesterAccount.role === "admin") {
                next();
            } else {
                res.status(403).send({ message: "forbidden" });
            }
        };

        app.get("/products", async (req, res) => {
            const query = {};
            const products = await productsCollectoin
                .find(query)
                .sort({ _id: -1 })
                .toArray();
            res.send(products);
        });

        //Get all users
        app.get("/users", verifyJWT, async (req, res) => {
            const query = {};
            const users = await userCollection
                .find(query)
                .sort({ _id: -1 })
                .toArray();
            res.send(users);
        });

        app.post("/products", async (req, res) => {
            const product = req.body;
            const result = await productsCollectoin.insertOne(product);
            res.send(result);
        });

        //update product stock
        app.put("/product/:id", async (req, res) => {
            const id = req.params.id;
            const updatedProduct = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    stock: updatedProduct.stock,
                },
            };
            const result = await productsCollectoin.updateOne(
                filter,
                updatedDoc,
                options
            );
            res.send(result);
        });

        //get orders data
        app.get("/get-orders/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { buyerEmail: email };
            const products = await orderCollection
                .find(query)
                .sort({ _id: -1 })
                .toArray();
            res.send(products);
        });

        app.post("/place-order", async (req, res) => {
            const orderInfo = req.body;
            const result = await orderCollection.insertOne(orderInfo);
            res.send(result);
        });

        app.get("/product-detail/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const detail = await productsCollectoin.findOne(query);
            res.send(detail);
        });

        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const data = await userCollection.findOne(query);

            res.send(data);
        });

        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };

            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            const token = jwt.sign(
                { email: email },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1h" }
            );
            res.send({ result, token });
        });

        app.put("/update-user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };

            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.send(result);
        });
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
