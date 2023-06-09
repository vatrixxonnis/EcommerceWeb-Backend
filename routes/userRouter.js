const express = require("express");
const mongoose = require("mongoose");
const userRouter = express.Router();
const crypto = require("node:crypto");
const user = require("../model/user");
const customer = require("../model/customer");
const { uuid } = require("uuidv4");

// Lấy thông tin tất cả người dùng
userRouter.get("", async (req, res) => {
  user
    .find({})
    .sort({ user_type: 1 })
    .then((users) => {
      return res.json(users);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});
// Lấy thông tin người dùng theo id
userRouter.get("/:id", async (req, res) => {
  let o_id = new mongoose.Types.ObjectId(req.params.id);
  user
    .findById(o_id)
    .then((user) => res.json(user))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Đăng nhập
userRouter.post("", async (req, res) => {
  let phone = req.body.phonenumber;
  let pass = req.body.password;
  await user
    .findOne({ phone_number: phone })
    .then((user) => {
      if (user) {
        let salt = user.salt; // get salt from user object
        let hash = crypto
          .pbkdf2Sync(pass, salt, 1000, 64, `sha512`)
          .toString(`hex`);
        if (user.password === hash) {
          return res
            .send({
              user_id: user.user_id,
              user_type: user.user_type,
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username,
              email: user.email,
              gender: user.gender,
              phone_number: user.phone_number,
              birth_date: user.birth_date,
              status: user.status,
            })
            .status(200);
        } else {
          return res.sendStatus(404);
        }
      } else {
        res.sendStatus(401);
      }
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Đăng ký tài khoản
userRouter.post("/regis", async (req, res) => {
  salt = crypto.randomBytes(16).toString("hex"); // create salt
  hash = crypto
    .pbkdf2Sync(req.body.password, salt, 1000, 64, `sha512`)
    .toString(`hex`);
  let user_id = uuid().slice(0, 11);
  let newUser = new user({
    user_id: user_id,
    user_type: "Customer",
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    username: req.body.last_name + req.body.first_name,
    password: hash,
    salt: salt,
    email: req.body.email,
    gender: req.body.gender,
    phone_number: req.body.phone,
  });
  let newCustomer = new customer({
    user_id: user_id,
    addresses: req.body.addresses,
  });
  await customer.insertMany(newCustomer);
  await user
    .insertMany(newUser)
    .then((user) => {
      if (user) {
        return res.sendStatus(200);
      } else {
        return res.sendStatus(404);
      }
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Đăng ký tài khoản
userRouter.post("/register", async (req, res) => {
  salt = crypto.randomBytes(16).toString("hex"); // create salt
  hash = crypto
    .pbkdf2Sync(req.body.password, salt, 1000, 64, `sha512`)
    .toString(`hex`);
  let newUser = new user({
    ...req.body,
    password: hash,
    salt: salt,
  });
  user
    .insertMany(newUser)
    .then((user) => {
      if (user) {
        return res.sendStatus(200);
      } else {
        return res.sendStatus(404);
      }
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});
// Cập nhật thông tin người dùng
userRouter.put("", async (req, res) => {
  if (req.body.name == null) return res.sendStatus(404);
  let full_name = req.body.name.trim().split(" ");
  let first_name = full_name.pop();
  let last_name = full_name.join(" ");
  user
    .findOneAndUpdate(
      { phone_number: req.body.phone },
      {
        $set: {
          email: req.body.email,
          gender: req.body.gender,
          phone_number: req.body.phone,
          first_name: first_name,
          last_name: last_name,
        },
      }
    )
    .then((user) => {
      if (user) {
        return res.sendStatus(200);
      } else {
        return res.sendStatus(404);
      }
    });
});
userRouter.put("/update/:id", async (req, res) => {
  try {
    salt = crypto.randomBytes(16).toString("hex"); // create salt
    hash = crypto
      .pbkdf2Sync(req.body.password, salt, 1000, 64, `sha512`)
      .toString(`hex`);
    const { id } = req.params;
    const userData = new user({
      ...req.body,
      password: hash,
      salt: salt,
    });
    const updatedUser = await user.findOneAndUpdate({ _id: id }, userData, {
      new: true,
    });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Thay đổi mật khẩu
userRouter.put("/changePassword", async (req, res) => {
  user.findOne({ phone_number: req.body.phone_number }).then((oneUser) => {
    if (oneUser) {
      let salt = oneUser.salt; // create salt
      let hash = crypto
        .pbkdf2Sync(req.body.password, salt, 1000, 64, `sha512`)
        .toString(`hex`);
      let newhash = crypto
        .pbkdf2Sync(req.body.newpass, salt, 1000, 64, `sha512`)
        .toString(`hex`);
      user
        .findOneAndUpdate(
          { phone_number: oneUser.phone_number, password: hash },
          { $set: { password: newhash } }
        )
        .then((user) => {
          if (user) {
            return res.sendStatus(200);
          } else {
            return res.sendStatus(404);
          }
        });
    } else {
      return res.sendStatus(404);
    }
  });
});

userRouter.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const response = await user.findByIdAndRemove(userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = userRouter;
