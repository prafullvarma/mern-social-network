const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');

// load validator function
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

const User = require('../../models/User');

// @get /api/users/test | public access | testing
router.get('/test', (req, res) => res.send("it Works"));

// @post /api/users/register | public access | register a user |
router.post('/register', (req, res) => {
  const {errors, isValid} = validateRegisterInput(req.body);

  if(!isValid){
    return res.status(400).send({errors});
  }


  User.findOne({email: req.body.email})
    .then(user => {
      if(user){
        errors.email = "Email is already registered";
        return res.status(400).send(errors);
      }else{
        const avatar = gravatar.url(req.body.email, {
          s: '200', // Size
          r: 'pg', // Age Rating
          d: 'mm'
        });

        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          avatar: avatar
        });

        bcrypt.genSalt(10, (err, salt) => {
          if(err) throw err;
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if(err) throw err;
            newUser.password = hash;

            newUser.save()
              .then(user => res.send(user))
              .catch(err => res.status(404).send({"error":"User not registered properly"}));
          });

        });

      }
    })
    .catch(err => res.status(404).send({"error":err}) );

});

// @post /api/users/login | public access | login user & returning jsonwebtoken
router.post('/login', (req, res) => {

  const {errors, isValid} = validateLoginInput(req.body);

  if(!isValid){
    return res.status(400).send(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email: email}).then(user => {
    if(!user){
      errors.email = "User not found";
      return res.status(404).send(errors);
    }

    bcrypt.compare(password, user.password)
      .then(isMatch => {
        if(!isMatch){
          errors.password = "Password is incorrect";
          return res.status(400).send(errors);
        }else{
          // User matched
          const payload = {id: user._id, name: user.name, avatar: user.avatar} // JWT payload
          // Create token
          jwt.sign(
            payload,
            keys.secretKey,
            {expiresIn: 36000},
            (err, token) => {
              res.send({
                success: true,
                token: 'Bearer ' + token
              });
            }
          );

        }
      });

  });

});

module.exports = router;
