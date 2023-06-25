const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.use(cors());
app.use(express.json());
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};
// MONGODB CODE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1nqrclq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
//important note : remove try function before vercel deploy
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const itemsCollection = client.db("grocery-store").collection("items");
    const cartCollection = client.db("grocery-store").collection("cart");

    // jwt code
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    //CRUD OPERATION ZONE .........................................................................!!

    // 1. Item  POST/CREATE
    app.post("/items", async (req, res) => {
      const items = req.body;
      console.log("new item", user);
      const result = await itemsCollection.insertOne(items);
      res.send(result);
    });

    // 2. Items GET/READ with Sorting
    app.get("/items", async (req, res) => {
      const cursor = itemsCollection.find(); // Limiting to 20 documents(false)
      const result = await cursor.toArray();
      res.send(result);
    });

    // 3. GET specific user by ID
    // app.get("/toys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log("fetching user", id);
    //   const query = { _id: new ObjectId(id) };
    //   const result = await theCollection.findOne(query);
    //   res.send(result);
    // });

    // 4. PUT/UPDATE user by ID
    // app.put("/toys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const user = req.body;
    //   console.log("updating user", id);
    //   const filter = { _id: new ObjectId(id) };
    //   const options = { upsert: true };
    //   const updatedUser = {
    //     $set: {
    //       name: user.name,
    //       img: user.img,
    //       sellerName: user.sellerName,
    //       sellerEmail: user.sellerEmail,
    //       subCategory: user.subCategory,
    //       price: user.price,
    //       rating: user.rating,
    //       quantity: user.quantity,
    //       description: user.description,
    //     },
    //   };
    //   const result = await theCollection.updateOne(
    //     filter,
    //     updatedUser,
    //     options
    //   );
    //   res.send(result);
    // });

    // 5. DELETE user by ID
    // app.delete("/toys/:id", async (req, res) => {
    //   const id = req.params.id;
    //   console.log("deleting user", id);
    //   const query = { _id: new ObjectId(id) };
    //   const result = await theCollection.deleteOne(query);
    //   res.send(result);
    // });

    // cart codes here ..................................................
    app.post("/cart", async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartCollection.insertOne(item);
      res.send(result);
    });

    app.get("/cart", verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden access" });
      }
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Deleting ", id);
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/cart/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Updating ", id);
      const query = { _id: ObjectId(id) };
      const updatedCartItem = req.body;

      try {
        const result = await cartCollection.updateOne(query, {
          $set: updatedCartItem,
        });
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).send({ error: true, message: "Internal server error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("grocery store runninng Alhamdulillah!");
});

// starting the server>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.listen(port, () => {
  console.log(`Alhamdulillah the server running at the ${port} port`);
});

// install the 7 brothers
// npm init --y
// npm i express
// npm i nodemon
// npm i cors
// npm i mongodb
// npm i dotenv
// npm i jsonwebtoken
// and "start":"nodemon index"

// .gitignore = node_modules /n .env
// DONT FORGET TO IMPORT OBJECT ID FROM MONGO const { ObjectId } = require("mongodb");
