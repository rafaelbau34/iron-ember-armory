const pool = require("../db/pool");
const { body, validationResult } = require("express-validator");

exports.category_list = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM categories ORDER BY name ASC",
    );
    res.render("index", {
      title: "Iron & Ember Armory - Categories",
      categories: rows,
    });
  } catch (err) {
    next(err);
  }
};

exports.category_detail = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const categoryRes = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [categoryId],
    );
    if (categoryRes.rows.length === 0) {
      const err = new Error("Category not found");
      err.status = 404;
      return next(err);
    }
    const itemsRes = await pool.query(
      "SELECT * FROM items WHERE category_id = $1 ORDER BY name ASC",
      [categoryId],
    );

    res.render("category_detail", {
      title: categoryRes.rows[0].name,
      category: categoryRes.rows[0],
      items: itemsRes.rows,
    });
  } catch (err) {
    next(err);
  }
};

exports.category_create_get = (req, res) => {
  res.render("category_form", {
    title: "Create Category",
    category: {},
    errors: [],
  });
};

exports.category_create_post = [
  body("name", "Category name required").trim().isLength({ min: 1 }).escape(),
  body("description").trim().escape(),

  async (req, res, next) => {
    const errors = validationResult(req);
    const category = { name: req.body.name, description: req.body.description };

    if (!errors.isEmpty()) {
      res.render("Category_form", {
        title: "Create Category",
        category,
        errors: errors.array(),
      });
      return;
    }
    try {
      const { rows } = await pool.query(
        "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id",
        [category.name, category.description],
      );
      res.redirect(`/categories/${rows[0].id}`);
    } catch (err) {
      next(err);
    }
  },
];

exports.category_update_get = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [req.params.id],
    );
    if (rows.length === 0) {
      const err = new Error("Category not found");
      err.status = 404;
      return next(err);
    }
    res.render("category_form", {
      title: "Update Category",
      category: rows[0],
      errors: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.category_update_post = [
  body("name", "Category name required").trim().isLength({ min: 1 }).escape(),
  body("description").trim().escape(),
  body("admin_password", "Admin password required").trim().isLength({ min: 1 }),

  async (req, res, next) => {
    const errors = validationResult(req);
    const category = {
      id: req.params.id,
      name: req.body.name,
      description: req.body.description,
    };

    if (req.body.admin_password !== process.env.ADMIN_PASSWORD) {
      errors.errors.push({ msg: "Incorrect Admin Password" });
    }

    if (!errors.isEmpty()) {
      res.render("category_form", {
        title: "Update Category",
        category,
        errors: errors.array(),
      });
      return;
    }

    try {
      await pool.query(
        "UPDATE categories SET name = $1, description = $2 WHERE id = $3",
        [category.name, category.description, category.id],
      );
      res.redirect("/categories/${category.id");
    } catch (err) {
      next(err);
    }
  },
];

exports.category_delete_get = async (req, res, next) => {
  try {
    const categoryRes = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [req.params.id],
    );
    if (categoryRes.rows.length === 0) {
      res.redirect("/categories");
      return;
    }
    const itemsRes = await pool.query(
      "SELECT * FROM items WHERE category_id = $1",
      [req.params.id],
    );

    res.render("category_delete", {
      title: "Delete Category",
      category: categoryRes.rows[0],
      items: itemsRes.rows,
      error: null,
    });
  } catch (err) {
    next(err);
  }
};

exports.category_delete_post = async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const categoryRes = await pool.query(
      "SELECT * FROM categories WHERE id = $1",
      [categoryId],
    );
    const itemsRes = await pool.query(
      "SELECT * FROM items WHERE category_id = $1",
      [categoryId],
    );

    if (req.body.admin_password !== process.env.ADMIN_PASSWORD) {
      (res.render("category_delete"),
        {
          title: "Delete Category",
          category: categoryRes.rows[0],
          items: itemsRes.rows,
          error: "Incorrect Admin Password",
        });
      return;
    }

    if (itemsRes.rows.length > 0) {
      res.render("category_Delete", {
        title: "Delete Category",
        category: categoryRes.rows[0],
        items: itemsRes.rows,
        error:
          "Cannot delete category because it still contains items. Delete the items first.",
      });
      return;
    }

    await pool.query[("DELETE FROM categories WHERE id = $1", [categoryId])];
    res.redirect("/");
  } catch (err) {
    next(err);
  }
};
