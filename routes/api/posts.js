const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

const validatePostInput = require('../../validation/post');

require('../../config/passport')(passport);

// @get /api/posts/test | public | testing
router.get('/test', (req, res) => res.send("it Works"));

// @get /api/posts | public | get all posts
router.get('/', (req, res) => {
  Post.find({})
    .sort({date: -1})
    .then(posts => {
      if(!posts){
        return res.status(400).send({"posts":"No Posts Available"});
      }
      res.send(posts);
    })
    .catch(err => res.status(400).send(err));
});

// @get /api/posts/:id | public | get a post by id
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      if(!post){
        return res.status(400).send({"post":"No Post with given id available"});
      }
      res.send(post);
    })
    .catch(err => res.status(400).send(err));
});


// @post /api/post | private | to create a post
router.post('/', passport.authenticate('jwt', {session: false}), (req, res) => {

  const { errors, isValid } = validatePostInput(req.body);

  if(!isValid){
    return res.status(400).send(errors);
  }

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id
  });

  newPost.save()
    .then(post => res.send(post))
    .catch(err => res.status(400).send(err));

});

// @delete /api/posts/:id | private | delete own post by its id
router.delete('/:id', passport.authenticate('jwt', {session : false}), (req, res) => {
  Profile.findOne({user : req.user.id})
  .then(profile => {
    Post.findById(req.params.id)
    .then(post => {
      if(!post) return res.status(400).send({"post":"Post with this id does not exist"});

      if(post.user.toString() !== req.user.id) return res.status(401).send({"authorization" : "User not authorized to delete this post"});

      post.remove().then(() => res.send({"post": "Post deleted successfully"})).catch(err=>res.status(404).send({"no-post":"No post found"}));
    })
    .catch(err => res.status(404).send(err));
  });
});

// @post /api/posts/like/:id | private | like a post
router.post('/like/:id', passport.authenticate('jwt', {session : false}), (req, res) => {
  Profile.findOne({user : req.user.id})
  .then(profile => {
    Post.findById(req.params.id)
    .then(post => {
      if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
        return res.status(400).send({"like": "You have already liked this post"});
      }
      post.likes.unshift({user : req.user.id});

      post.save().then(post => res.send(post));
    })
    .catch(err => res.status(404).send(err));
  });
});

// @post /api/posts/unlike/:id | private | unlike a post
router.post('/unlike/:id', passport.authenticate('jwt', {session : false}), (req, res) => {
  Profile.findOne({user : req.user.id})
  .then(profile => {
    Post.findById(req.params.id)
    .then(post => {
      if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
        return res.status(400).send({"unlike": "You have not liked this post, so you can't unlike it"});
      }

      const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
      post.likes.splice(removeIndex, 1);

      post.save().then(post => res.send(post));
    })
    .catch(err => res.status(404).send(err));
  });
});

// @post /api/posts/comment/:id | private | comment on a post
router.post('/comment/:id', passport.authenticate('jwt', {session : false}), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);

  if(!isValid){
    return res.status(400).send(errors);
  }

  Post.findById(req.params.id).then(post => {
    const newComment = {
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    };

    post.comments.unshift(newComment);

    post.save().then(post => res.send(post));
  })
  .catch(err => res.status(404).send(err));
});

// @delete /api/posts/comment/:id/:comment_id | private | delete a comment on a post
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', {session : false}), (req, res) => {
  Post.findById(req.params.id).then(post => {

    if(post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0){
      return res.status(400).send({"no-comment":"Comment with given id does not exist"});
    }

    const removeIndex = post.comments.map(comment => comment._id.toString()).indexOf(req.params.comment_id);
    post.comments.splice(removeIndex, 1);

    post.save().then(post => res.send(post));
  })
  .catch(err => res.status(404).send(err));
});


module.exports = router;
