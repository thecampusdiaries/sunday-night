const Post = require('../models/post.js')

module.exports.index = async (req, res) => {
    const allPosts = await Post.find({});
    res.render('post/index.ejs', { allPosts });
}

module.exports.renderNewForm = (req, res) => {
    res.render('post/new.ejs');
}

module.exports.createPost = async (req, res, next) => {
    const url = req.file.path
    const filename = req.file.filename
    const newPost = new Post(req.body.post);
    newPost.owner = req.user._id
    newPost.image = { url, filename }
    await newPost.save();
    req.flash("success", "New Post Created Successfully !!")
    res.redirect('/explore');
}

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    let post = await Post.findById(id);
    if (!post) {
        req.flash("error", "The post you are trying to edit does not exist.")
        res.redirect('/explore')
    }
    let imgUrl = post.image.url;
    imgUrl = imgUrl.replace('/upload', '/upload/w_250')
    res.render('post/edit.ejs', { post, imgUrl });
}

module.exports.updatePost = async (req, res) => {
    let { id } = req.params;
    let post = await Post.findByIdAndUpdate(id, { ...req.body.post });
    if (req.file) {
        const url = req.file.path
        const filename = req.file.filename
        console.table([url, filename])
        post.image = { url, filename }
        await post.save()
    }
    await post.save();
    req.flash("success", "Post Updated Successfully !!")
    res.redirect(`/explore/${id}`);
}

module.exports.deletePost = async (req, res) => {
    let { id } = req.params;
    await Post.findByIdAndDelete(id);
    console.log(`${id} deleted !!`);
    req.flash("success", "Post Deleted Successfully !!")
    res.redirect('/explore');
}

module.exports.showPost = async (req, res) => {
    let { id } = req.params;
    const post = await Post.findById(id)
        .populate({
            path: "comments",
            populate: {
                path: "author",
            }
        })
        .populate('owner');

    if (!post) {
        req.flash("error", "The post you are trying to access does not exist.")
        res.redirect('/explore')
    }
    res.render('post/show.ejs', { post });
}

module.exports.likePost = async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);
    const userId = req.user._id;

    if (!post) {
        req.flash('error', 'Cannot find that post!');
        return res.redirect('/explore');
    }

    const likedIndex = post.likedBy.indexOf(userId);

    if (likedIndex === -1) {    // If user has not liked the post yet, like it
        post.likes += 1;
        post.likedBy.push(userId);
    } else {    // If user has already liked the post, unlike it
        post.likes -= 1;
        post.likedBy.splice(likedIndex, 1);
    }
    await post.save();
    res.redirect(`/explore/${id}`);
}