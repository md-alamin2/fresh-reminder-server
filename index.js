const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodsCollection = client.db("freshReminderDB").collection("foods");

    // foods related apis
    app.get("/foods", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.userEmail = email;
      }
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/foods", async (req, res) => {
      const result = await foodsCollection.find().toArray();
      res.send(result);
    });

    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // get nearly expired food
    app.get("/food/expiring-soon", async(req, res)=>{
      const today = new Date();
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(today.getDate() + 5);
      const query = {
        expiryDate:{
          $gte: today,
          $lte: fiveDaysLater
        }
      };
      const result = await foodsCollection.find(query).sort({ expiryDate: 1}).limit(6).toArray();
      res.send(result)
    })


    // food post api
    app.post("/foods", async (req, res) => {
      const food = req.body;
      const formattedFood ={
          ...food,
          expiryDate: new Date(food.expiryDate),
          addedDate: new Date(food.addedDate)
      }
      const result = await foodsCollection.insertOne(formattedFood);
      res.send(result);
    });

     // update single food
    app.put("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const food = req.body;
      const updatedFood={
        ...food,
        expiryDate: new Date(food.expiryDate),
        addedDate: new Date(food.addedDate)
      }
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updatedFood,
      };
      const result = await foodsCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // food patch api
    app.patch("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const noteData = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          noteData,
        },
      };
      const result = await foodsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // food delete api
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send(result);
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

app.get("/", async (req, res) => {
  res.send("Food Server is running");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
