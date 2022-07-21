import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import router from "./controllers/functionality.js";

dotenv.config({ path: ".env" });
const port = process.env.PORT;

const app = express();

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(router);

app.get("/", (req, res) => res.status(200).send("Hello World!"));
app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});

export default app;
