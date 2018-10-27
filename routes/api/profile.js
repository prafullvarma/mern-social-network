const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

require('../../config/passport')(passport);

// @get /api/profile/test | public access | testing
router.get('/test', (req, res) => res.send("it Works"));

// @get /api/profile | private access | get current logged in user's details
router.get('/', passport.authenticate('jwt', {session: false}) , (req, res) => {
  const errors = {};

  Profile.findOne({user: req.user.id})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile){
        errors.noprofile = "There is no profile for this user";
        return res.status(404).send(errors);
      }else{
        return res.send(profile);
      }
    })
    .catch(err => res.status(400).send(err));
});

// @get /routes/api/all | public access | Get all profiles
router.get('/all', (req, res) => {
  const errors = {};

  Profile.find({})
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if(!profiles){
        errors.noprofile = "There are no profiles";
        return res.status(404).send(errors);
      }else{
        res.send(profiles);
      }
    })
    .catch(err => res.status(400).send({"profile":"Error while fetching profiles"}));
});

// @get /api/profile/handle/:handle | public access | Get profile by handle
router.get('/handle/:handle', (req, res) => {
  const handle = req.params.handle.trim();
  const errors = {};

  Profile.findOne({handle: handle})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile){
        errors.noprofile = "This handle does not exist";
        return res.status(404).send(errors);
      }
      res.send(profile);
    })
    .catch(err => res.status(400).send(errors));
    ;
});

// @get /api/profile/user/:user_id | public access | Get profile by user_id
router.get('/user/:user_id', (req, res) => {
  const user_id = req.params.user_id;
  const errors = {};

  Profile.findOne({user: user_id})
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if(!profile){
        errors.noprofile = "There is no profile with this id";
        return res.status(404).send(errors);
      }
      res.send(profile);
    })
    .catch(err => res.status(400).send({"profile":"There is no profile with this id"}));
    ;
});

// @post /api/profile | private access | create or edit user profile
router.post('/', passport.authenticate('jwt', {session: false}) , (req, res) => {

  const { errors, isValid } = validateProfileInput(req.body);

  if(!isValid){
    return res.status(400).json(errors);
  }

  const profileFields = {};

  profileFields.user = req.user.id;

  if(req.body.handle) profileFields.handle = req.body.handle;
  if(req.body.company) profileFields.company = req.body.company;
  if(req.body.website) profileFields.website = req.body.website;
  if(req.body.location) profileFields.location = req.body.location;
  if(req.body.bio) profileFields.bio = req.body.bio;
  if(req.body.status) profileFields.status = req.body.status;
  if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;
  // Skills - split into array
  if(typeof req.body.skills !== 'undefined'){
    profileFields.skills = req.body.skills.split(',');
    profileFields.skills = profileFields.skills.filter(skill=> skill.trim() !== '' );
  }

  profileFields.social = {};
  if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
  if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

  // Now after getting data we have to either create or update received info

  Profile.findOne({user: req.user.id})
    .then(profile => {
      if(profile){
        // Editing info

        Profile.findOneAndUpdate({user: req.user.id}, {$set: profileFields}, {new: true})
          .then(profile => res.send(profile))
          .catch(err => res.status(404).json(err));

      }else{
        // Creating info

        // Checking for handle

        Profile.findOne({handle: profileFields.handle})
          .then(profile => {
            if(profile){
              errors.handle = "The handle already exists";
              return res.status(400).send(errors);
            }

            // Now that handle is new we can save data
            const newProfile = new Profile(profileFields);

            newProfile.save()
              .then(profile => res.send(profile))
              .catch(err => res.statis(404).json(err));
          })


      }
    })

});

// @post /api/profile/experience | private access | to add experience
router.post('/experience', passport.authenticate('jwt', {session : false}), (req, res) => {

  const { errors, isValid } = validateExperienceInput(req.body);

  if(!isValid){
    return res.status(400).send(errors);
  }

  Profile.findOne({user : req.user.id}).then(profile => {
    const newExp = {
      title: req.body.title,
      company: req.body.company,
      location: req.body.location,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description
    }

    profile.experience.unshift(newExp);

    profile.save()
      .then(updatedProfile => res.send(updatedProfile))
      .catch(err => res.status(404).send(err));
  });
});

// @post /api/profile/education | private access | to add education
router.post('/education', passport.authenticate('jwt', {session : false}), (req, res) => {

  const { errors, isValid } = validateEducationInput(req.body);

  if(!isValid){
    return res.status(400).send(errors);
  }

  Profile.findOne({user : req.user.id}).then(profile => {
    const newEdu = {
      school: req.body.school,
      degree: req.body.degree,
      fieldofstudy: req.body.fieldofstudy,
      from: req.body.from,
      to: req.body.to,
      current: req.body.current,
      description: req.body.description
    }

    profile.education.unshift(newEdu);

    profile.save()
      .then(updatedProfile => res.send(updatedProfile))
      .catch(err => res.status(404).send(err));
  });
});

// @delete /api/profile/experience/:exp_id | private | Delete an experience from a profile
router.delete('/experience/:exp_id', passport.authenticate('jwt', {session : false}), (req, res) => {
  const exp_id = req.params.exp_id;

  Profile.findOne({user : req.user.id}).then(profile => {

    const removeIndex = profile.experience.map(exp=>exp.id).indexOf(exp_id);

    if(removeIndex<0){
      return res.status(404).send({"no experience": "Experience with this id does not exist"})
    }

    profile.experience.splice(removeIndex, 1);

    profile.save()
      .then(newProfile => res.send(newProfile))
      .catch(err => res.status(400).send(err));

  });
});

// @delete /api/profile/education/:edu_id | private | Delete education from a profile
router.delete('/education/:edu_id', passport.authenticate('jwt', {session : false}), (req, res) => {
  const edu_id = req.params.edu_id;

  Profile.findOne({user : req.user.id}).then(profile => {

    const removeIndex = profile.education.map(edu=>edu.id).indexOf(edu_id);

    if(removeIndex<0){
      return res.status(404).send({"no education": "Education item with this id does not exist"})
    }

    profile.education.splice(removeIndex, 1);

    profile.save()
      .then(newProfile => res.send(newProfile))
      .catch(err => res.status(400).send(err));

  });
});

// @delete /api/profile | private access | delete profile and user account
router.delete('/', passport.authenticate('jwt', {session: false}), (req, res) => {

  Profile.findOneAndRemove({user: req.user.id})
    .then(() => {
      User.findOneAndRemove({_id: req.user.id})
        .then(() => {
          res.send({"success" : "User deleted"});
        })
    })
    .catch(err => res.status(404).send(err));

});

module.exports = router;
