/**
 * Created by HUI on 2017/2/22.
 */
const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require("fs");
const filePath = path.join(__dirname, '../../../public/tmp/paper_tmp')
const mongoose = require('mongoose');
const db = mongoose.connection;
const User = mongoose.model('User');
const Bank = mongoose.model('Bank');
const Paper = mongoose.model('Paper');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const upload = require('../../../servers/fileupload');
router.use(cookieParser());
router.use(session({
    secret: '12345',
    name: 'testapp',   //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    cookie: {maxAge: 365 * 24 * 60 * 60 * 1000},  //设置maxAge是ms，session和相应的cookie失效过期
    resave: false,
    saveUninitialized: true,
}));

//登录
router.post('/login', function (req, res, next) {
    // let md5 = crypto.createHash('md5');
    // md5.update(req.body.password);
    // let d = md5.digest('hex');
    let user_session = {
        username: req.body.username,
        password: req.body.password,
        role:'teacher'
    };
    User.find({username: req.body.username, password: req.body.password}, function (err, docs) {
        if (err) {
            res.end(err);
        } else {
            if (docs.length == 0) {
                res.render('login', {username: req.body.username, error: 'username or password is flase'})
            } else {

                user_session.user_id = docs[0]._id
                user_session.subject = docs[0].subject
                user_session.subject_default = docs[0].subject[0]
                req.session.user = user_session;
                res.redirect('/home')

            }
        }

    })
});

router.post('/setpassword', async function (req, res) {
    const oldPwd = req.body.oldPwd
    const newPwd = req.body.newPwd

    User.findOne({username: req.session.user.username}, function (err, doc) {
        if (err) {
            res.end(err)
        } else{
            if(doc.password === oldPwd){
                User.update({username: req.session.user.username}, {
                    $set: {password:newPwd}
                }, function (err, next) {
                    if (err) {
                        res.end(err);
                        return next();
                    }
                    res.render('password', {
                        title: '修改密码',
                        subject: req.session.user.subject,
                        subject_default: req.session.user.subject_default,
                        message:'修改成功'
                    });
                })
            }
            else{
                res.render('password', {
                    title: '修改密码',
                    subject: req.session.user.subject,
                    subject_default: req.session.user.subject_default,
                    message:'密码错误'
                });
            }

        }

    })


});

//下载试卷
router.get('/download/:filename', function (req, res) {
    let file = filePath + '/' + req.params.filename;
    res.download(file); // Set disposition and send it.
});
//下载exampaper
router.get('/csv/download', function (req, res) {
    let file = path.join(__dirname, '../../../public/example/example.csv')
    res.download(file); // Set disposition and send it.
});

//上传
router.post('/upload', upload.array('fileImg',6), function (req, res, next) {
    if (req.files) {
        console.log(req.files)
        res.status(200).send({message:req.files});
    }
});
//删除试卷
router.get('/paper/:id/delete', function (req, res, next) {
    Paper.findOne({_id: req.params.id}, function (err, doc) {
        if (err) {
            res.end('err', err);
            return next();
        }
        doc.remove();
        fs.unlink(path.join(filePath,doc.filename),function (err) {
            if(err){
                console.log(err)

            }else{
                console.log('deleted')
            }
        });
        res.redirect('/paper-bank')
    })
})
module.exports = router;