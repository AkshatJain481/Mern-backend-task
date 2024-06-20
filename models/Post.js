const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  mediaUrl: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ text: String, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' , required : true} }]
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema , 'posts');
