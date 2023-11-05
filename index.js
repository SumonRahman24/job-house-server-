const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// middlewares
const logger = (req, res, next) => {
  console.log("mylogger = ", req.host, req.originalUrl);
  next();
};

const verrifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.satus(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }

    console.log("decoded =", decoded);
    req.user = decoded;
    next();
  });
};

//connect mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@job-house.p1cwnsp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbConnect = async () => {
  try {
    client.connect();
    console.log("DB Connected Successfully✅");
  } catch (error) {
    console.log(error.name, error.message);
  }
};
dbConnect();

const jobsCollection = client.db("jobHouse").collection("jobs");
// const jobsCollection = client.db("jobHouse").collection("jobs");

// jwt auth apis route
app.post("/jwt", (req, res) => {
  const user = req.body;
  console.log("user of token email", user);

  // create token
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRECT, {
    expiresIn: "24h",
  });

  // store token
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .send({ success: true });
});

app.post("/logout", (req, res) => {
  //get user
  const user = req.body;
  console.log("logout user =", user);
  //clean cookie in client
  res.clearCookie("token", { maxAge: 0 }).send({ success: true });
});

// jobs apis route
app.get("/jobs", async (req, res) => {
  const cursor = jobsCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

app.get("/jobs/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const query = { _id: new ObjectId(id) };
  console.log(query);
  const result = await jobsCollection.findOne(query);
  console.log(result);
});

app.get("/jobs/:category", async (req, res) => {
  const category = req.params.category;
  const query = { category: category };
  const cursor = jobsCollection.find(query);
  const result = await cursor.toArray();
  res.send(result);
});

// home apis route
app.get("/", (req, res) => {
  res.send("server is running...");
});

app.listen(port, () => {
  console.log(`server is running successfully at http://${port}`);
});
