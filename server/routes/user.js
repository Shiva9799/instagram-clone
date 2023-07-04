const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireLogin = require('../middleware/requireLogin');
const Post = mongoose.model("Post");
const User = mongoose.model("User");

router.get('/user/:id', requireLogin, (req, res) => {
  User.findOne({ _id: req.params.id })
    .select("-password")
    .populate("followers", "_id name")
    .populate("following", "_id name")
    .exec()
    .then(user => {
      Post.find({ postedBy: req.params.id })
        .populate("postedBy", "_id name")
        .exec()
        .then(posts => {
          res.json({ user, posts });
        })
        .catch(err => {
          return res.status(422).json({ error: err });
        });
    })
    .catch(err => {
      return res.status(404).json({ error: "User not found" });
    });
});

router.put('/follow', requireLogin, async (req, res) => {
  try {
    const userToFollow = await User.findByIdAndUpdate(
      req.body.followId,
      { $push: { followers: req.user._id } },
      { new: true }
    );

    const currentUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { following: req.body.followId } },
      { new: true }
    ).select("-password");

    res.json(currentUser);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

router.put('/unfollow', requireLogin, async (req, res) => {
  try {
    const userToUnfollow = await User.findByIdAndUpdate(
      req.body.unfollowId,
      { $pull: { followers: req.user._id } },
      { new: true }
    );

    const currentUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { following: req.body.unfollowId } },
      { new: true }
    ).select("-password");

    res.json(currentUser);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

router.put('/updatepic', requireLogin, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: { pic: req.body.pic } },
    { new: true }
  )
    .select("-password")
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      res.status(422).json({ error: "Cannot update profile picture" });
    });
});


router.post('/search-users', (req, res) => {
  let userPattern = new RegExp("^" + req.body.query);
  User.find({ email: { $regex: userPattern } })
    .select("_id email")
    .then(user => {
      res.json({ user });
    })
    .catch(err => {
      console.log(err);
    });
});

module.exports = router;
