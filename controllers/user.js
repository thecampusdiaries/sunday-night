const User = require('../models/user.js')
const Post = require('../models/post.js')

module.exports.getSignupForm = (req, res, next) => {
    res.render('user/signup.ejs')
}
module.exports.getLoginForm = (req, res) => {
    res.render('user/login.ejs')
}

module.exports.signup = async (req, res) => {
    try {
        let { username, email, password } = req.body
        pw = password
        const newUser = new User({ email, pw, username })
        newUser.profile.profileImage = {
            url: "https://res.cloudinary.com/duwrgtvqv/image/upload/v1719633471/default_picture.png",
            filename: "default_profile_picture"
        }
        const regUser = await User.register(newUser, password)
        req.login(regUser, (err) => {
            if (err) {
                return next(err)
            }
            req.flash("success", `@${username}, Welcome to Campus Diaries, KKWIEER`)
            res.render('user/edit.ejs', { user: regUser, fromSignUp: true, imgUrl: regUser.profile.profileImage.url });

        })
    } catch (err) {
        req.flash("error", err.message)
        res.redirect('/users/signup')
    }
}

module.exports.login = async (req, res) => {
    req.flash("success", `@${req.body.username}, Welcome back to Campus Diaries, KKWIEER!!`)
    url = res.locals.redirectUrl ? res.locals.redirectUrl : '/explore'
    res.redirect(url)
}

module.exports.logout = (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err)
        }
        req.flash("success", "You have been logged out successfully")
        return res.redirect('/explore')
    })
}

module.exports.showUser = async (req, res) => {
    const reqUser = await User.findById(req.params.userId);
    if (!reqUser) {
        req.flash('error', 'User not found !!')
        return res.redirect('/explore')
    }
    const posts = await Post.find({ owner: req.params.userId });
    return res.render('user/show.ejs', { user: reqUser, posts });
}

module.exports.renderEditProfileForm = async (req, res) => {
    const { userId } = req.params;
    const reqUser = await User.findById(userId);
    if (!reqUser) {
        req.flash('error', 'Cannot find that user!');
        return res.redirect('/');
    }
    let imgUrl = reqUser.profile.profileImage.url;
    imgUrl = imgUrl.replace('/upload', '/upload/w_250')
    res.render('user/edit.ejs', { user: reqUser, fromSignUp: false, imgUrl });
}

module.exports.editProfile = async (req, res) => {

    const { userId } = req.params;
    const { username, email, profile } = req.body.user;

    const existingUser = await User.findById(userId);

    if (!existingUser) {
        req.flash('error', 'User not found');
        return res.redirect('/explore');
    }

    if (username) existingUser.username = username;
    if (email) existingUser.email = email;
    if (profile && profile.bio) existingUser.profile.bio = profile.bio;

    if (req.file) {
        console.log('uploading new image');
        const url = req.file.path;
        const filename = req.file.filename;
        console.table([url, filename]);
        existingUser.profile.profileImage = { url, filename };
    }

    await existingUser.save();
    req.login(existingUser, (err) => {
        if (err) {
            req.flash('error', 'There was an error updating your session.');
            return res.redirect('/explore');
        }

        req.flash('success', 'Your Profile updated successfully!');
        return res.redirect(`/users/${userId}/profile`);
    });
};
