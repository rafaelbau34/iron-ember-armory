require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const indexRouter = require("./routes/index");
const categoriesRouter = require("./routes/categories");
const itemsRouter = require("./routes/items");

app.use("/", indexRouter);
app.use("/categories", categoriesRouter);
app.use("/items", itemsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { error: err, title: "Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);
