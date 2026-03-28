const pool = require("../db/pool");
const { body, validationResult } = require("express-validator");

exports.item_detail = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT items.*, categories.name AS category_name 
      FROM items 
      JOIN categories ON items.category_id = categories.id 
      WHERE items.id = $1
    `,
      [req.params.id],
    );

    if (rows.length === 0) {
      const err = new Error("Item not found");
      err.status = 404;
      return next(err);
    }

    res.render("item_detail", { title: rows[0].name, item: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.item_create_get = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM categories ORDER BY name ASC",
    );
    res.render("item_form", {
      title: "Create Item",
      categories: rows,
      item: {},
      errors: [],
    });
  } catch (err) {
    next(err);
  }
};

exports.item_create_post = [
  body("name", "Item name required").trim().isLength({ min: 1 }).escape(),
  body("category_id", "Category required").trim().isLength({ min: 1 }).escape(),
  body("model_number").trim().escape(),
  body("description").trim().escape(),
  body("price", "Price must be a positive number").isFloat({ min: 0 }),
  body("stock_qty", "Stock must be an integer").isInt({ min: 0 }),

  async (req, res, next) => {
    const errors = validationResult(req);
    const item = {
      name: req.body.name,
      category_id: req.body.category_id,
      model_number: req.body.model_number,
      description: req.body.description,
      price: req.body.price,
      stock_qty: req.body.stock_qty,
    };
    if (!errors.isEmpty()) {
      const { rows } = await pool.query(
        "SELECT * FROM categories ORDER BY name ASC",
      );
      res.render("item_form", {
        title: "Create Item",
        categories: rows,
        item,
        errors: errors.array(),
      });
      return;
    }

    try {
      const { rows } = await pool.query(
        "INSERT INTO items (category_id, name, model_number, description, price, stock_qty) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          item.category_id,
          item.name,
          item.model_number,
          item.description,
          item.price,
          item.stock_qty,
        ],
      );
      res.redirect(`/items/${rows[0].id}`);
    } catch (err) {
      next(err);
    }
  },
];

exports.item_update_get = async (req, res, next) => {
  try {
    const itemRes = await pool.query("SELECT * FROM items WHERE id = $1", [
      req.params.id,
    ]);
    if (itemRes.rows.length === 0) {
      const err = new Error("Item not found");
      err.status = 404;
      return next(err);
    }

    const catRes = await pool.query(
      "SELECT * FROM categories ORDER BY name ASC",
    );

    res.render("item_form", {
      title: "Update item",
      categories: catRes.rows,
      item: itemRes.rows[0],
      errors: [],
    });
  } catch (err) {
    next(err);
  }
};

exports.item_update_post = [
  body("name", "Item name required").trim().isLength({ min: 1 }).escape(),
  body("category_id", "Category required").trim().isLength({ min: 1 }).escape(),
  body("model_number").trim().escape(),
  body("description").trim().escape(),
  body("price", "Price must be a positive number").isFloat({ min: 0 }),
  body("stock_qty", "Stock must be an integer").isInt({ min: 0 }),
  body("admin_password", "Admin password required").trim().isLength({ min: 1 }),

  async (req, res, next) => {
    const errors = validationResult(req);
    const item = {
      id: req.params.id,
      name: req.body.name,
      category_id: req.body.category_id,
      model_number: req.body.model_number,
      description: req.body.description,
      price: req.body.price,
      stock_qty: req.body.stock_qty,
    };

    if (req.body.admin_password !== process.env.ADMIN_PASSWORD) {
      errors.errors.push({ msg: "Incorrect Admin Password" });
    }

    if (!errors.isEmpty()) {
      const catRes = await pool.query(
        "SELECT * FROM categories ORDER BY name ASC",
      );
      res.render("item_form", {
        title: "Update Item",
        categories: catRes.rows,
        item,
        errors: errors.array(),
      });
      return;
    }

    try {
      await pool.query(
        "UPDATE items SET category_id = $1, name = $2, model_number = $3, description = $4, price = $5, stock_qty = $6 WHERE id = $7",
        [
          item.category_id,
          item.name,
          item.model_number,
          item.description,
          item.price,
          item.stock_qty,
          item.id,
        ],
      );
      res.redirect(`/items/${item.id}`);
    } catch (err) {
      next(err);
    }
  },
];

exports.item_delete_get = async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM items WHERE id = $1", [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.redirect("/");
    }
    res.render("item_delete", {
      title: "Delete Item",
      item: rows[0],
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

exports.item_delete_post = async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM items WHERE id = $1", [
      req.params.id,
    ]);

    if (req.body.admin_password !== process.env.ADMIN_PASSWORD) {
      res.render("item_delete", {
        title: "Delete Item",
        item: rows[0],
        error: "Incorrect Admin Password",
      });
      return;
    }

    await pool.query("DELETE FROM items WHERE id = $1", [req.params.id]);
    res.redirect(`/categories/${rows[0].category_id}`);
  } catch (err) {
    next(err);
  }
};
