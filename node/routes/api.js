var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var db = mongoose.connection;
var crypto = require('crypto');
var Joi = require('joi');
var Mock = require('mockjs');
var Random = Mock.Random;
var fs = require("fs");
var path = require("path");
var session = require('express-session');
var cookieParser = require('cookie-parser');
var filePath = path.join(__dirname, '../public/tmp');
var User = mongoose.model('User');
var Bank = mongoose.model('Bank');
var Paper = mongoose.model('Paper');

var officegen = require('officegen');
var fs = require('fs');
var docx = officegen('docx');

//初始化


router.use(cookieParser());
router.use(session({
    secret: '12345',
    name: 'testapp',   //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    cookie: {maxAge: 24 * 60 * 60 * 1000},  //设置maxAge是ms，session和相应的cookie失效过期
    resave: false,
    saveUninitialized: true,
}))
//登录认证
function authToken(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login')
    } else {
        next();
    }
}
//数组 m 中随机取出 n 个值
function randArray(m, len) {
    m.sort(function () {
        return Math.random() - 0.5;
    });
    return m.slice(0, len);
}
var level_select;
//抽取难度的概率控制
function level_random(level) {
    var rand = Math.random();
    if (rand <= 0.3) {
        level_select = "中"
    } else if (rand > 0.3 && rand <= 0.3 + (level * 0.7)) {
        level_select = "难"
    } else {
        level_select = "易"
    }

}
/* GET apis listing. */
router.get('/test', function (req, res, next) {
    if (req.session.user) {
        res.send(req.session.user.username + req.session.cookie.maxAge);

    } else {
        res.send('error');
    }
});

/**
 * 用户接口
 **/


//登录
router.post('/login', function (req, res, next) {
    var md5 = crypto.createHash('md5');
    md5.update(req.body.password);
    var d = md5.digest('hex');
    var user_session = {
        username: req.body.username,
        password: req.body.password
    }
    console.log(user_session)
    User.find({username: req.body.username, password: req.body.password}, function (err, docs) {
        if (err) {
            res.end(err);
        } else {
            if (docs.length == 0) {
                res.status(400).send({error: 'username or password is flase'});
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

//注销登录
router.get('/logout', function (req, res, next) {
    req.session.user = null;
    if (req.session.user == null) {
        res.redirect('/login')
    }
    else {
        res.status(400).send({error: "fail"})
    }
});

//更改密码
router.get('/back/find_userInfo/:username', function (req, res, next) {
    User.find({username: req.params.username}, function (err, doc) {
        if (err) {
            res.end(err)
        }
        console.log(doc)
        res.render('back/create_user', {title: '更新信息', userInfo: doc[0]});
    })
});

/**
 * 题库接口
 **/
//设置全局科目
router.get('/selectSubject', function (req, res, next) {
    if (req.session.user.subject_default = req.query.subject_default) {
        res.redirect('/home');
    }
});
//插入题目
router.post('/bank/create', function (req, res, next) {

    var schema = Joi.object().keys({
        subject: Joi.string().required(),
        type: Joi.string().required(),
        tips: Joi.string().required(),
        level: Joi.string().required(),
        public: Joi.boolean().required(),
        question: Joi.string().required(),
        answer: Joi.string().required(),
    });

    Joi.validate({
        subject: req.body.subject,
        type: req.body.type,
        tips: req.body.tips,
        level: req.body.level,
        public: req.body.public,
        question: req.body.question,
        answer: req.body.answer,
    }, schema, function (err, value) {
        if (err) {
            res.status(400).send(err);
        }
        else {
            var bank = new Bank({
                user_id: req.session.user.user_id,
                subject: req.body.subject,
                type: req.body.type,
                tips: req.body.tips,
                level: req.body.level,
                public: req.body.public,
                question: req.body.question,
                answer: req.body.answer,
            });

            bank.save(function (err, next) {
                debugger;
                if (err) {
                    res.end('error', err);
                    return next();
                }

                res.status(200).send({message: 'create success'});
            })
        }
    })
});

//删除题目
router.get('/bank/:id/delete', function (req, res, next) {

    Bank.findOne({_id: req.params.id}, function (err, doc) {
        if (err) {
            res.end('err', err);
            return next();
        }

        doc.remove();
        res.status(200).send(doc);
    })
});

//修改题目
router.post('/bank/:id/update', function (req, res, next) {
    var schema = Joi.object().keys({
        subject: Joi.string().required(),
        options: Joi.string().required(),
        question: Joi.string().required(),
        answer: Joi.string().required(),
        level: Joi.number().required()
    });
    Joi.validate({
        subject: req.body.subject,
        question: req.body.question,
        options: req.body.options,
        answer: req.body.answer,
        level: req.body.level,
    }, schema, function (err, value) {
        if (err) {
            res.status(400).send(err);
        }
        else {
            Bank.update({'_id': req.params.id}, {
                $set: {
                    subject: req.body.subject,
                    options: req.body.options,
                    question: req.body.question,
                    answer: req.body.answer,
                    level: req.body.level,
                }
            }, function (err, next) {
                if (err) {
                    res.ens('err', err);
                    return next();
                }
                res.status(200).send({message: ' update success'});


            })
        }
    })
});

//查询题库
router.get('/bank/:user_id/list', function (req, res, next) {
    Bank.find({user_id: req.params.user_id}, function (err, docs) {
        if (err) {
            res.end('err', err);
            return next();
        }

        res.status(200).send(message, 'delete success');

    })

});

//查询题目
router.get('/findQuestion/:q_id', function (req, res, next) {
    Bank.find({_id: req.params.q_id}, function (err, docs) {
        if (err) {
            res.end('err', err);
            return next();
        }

        res.status(200).send(docs);

    })

});

//题库分页
router.post('/bank/pagelist', function (req, res) {
    var count = 0;
    var page = req.body.page;
    var rows = req.body.rows;
    var user_id = req.body.user_id;
    console.log("page:" + page + ",rows:" + rows);

    var query = Bank.find({});
    query.skip((page - 1) * rows);
    query.limit("知识点11");
    if (user_id) {
        query.where('user_id', user_id);
    }
    //计算分页数据
    query.exec(function (err, rs) {
        if (err) {
            res.send(err);
        } else {
            //计算数据总数
            Bank.find(function (err, result) {
                jsonArray = {rows: rs, total: result.length / rows};
                res.json(jsonArray);
            });

        }
    });

});

//测试出卷新算法
router.post('/make_paper', function (req, res) {
    var type_num = [];
    var type1_list = [];
    var type2_list = [];
    var type3_list = [];
    var type4_list = [];
    var type5_list = [];
    var paper_list = [];
    var total_length = 0;
    var tips = req.body.tips; //用户指定的知识点
    var level = req.body.level; //用户指定的知识点
    var type_items = Object.keys(req.body.type_items); //用户指定的题型
    for (item in req.body.type_items) {
        type_num.push(req.body.type_items[item])  //用户指定的题型数量
        total_length = total_length + req.body.type_items[item]; //用户指定的题型数量总和
    }

    //每个题型循环一次
    for (let i = 0; i < type_items.length; i++) {
        (function (arg1) {
            Bank.find({tips: {$in: tips}, type: type_items[i]}, {"type": 1, "tips": 1, "level": 1}, //检索包含给定知识点的第i个题型
                function (err, docs) {
                    if (err) {
                        res.send(err);
                    }
                    else {
                        var M = docs.map(function (o) {
                            return o.tips;
                        });
                        var tips_selected = Array.from(new Set(M));//对检索出的知识点进行去重
                        if (tips_selected.length >= type_num[arg1]) {
                            var tipsByType = randArray(tips_selected, type_num[arg1]);

                        } else {
                            var tipsByType_arr = tips_selected;
                            var tipsByType = [];
                            for (var x = 1; x < parseInt(type_num[arg1] / tips_selected.length); x++) {
                                //知识点的个数少于对应提醒的提数
                                tipsByType_arr = tipsByType_arr.concat(tips_selected);
                            }

                            tipsByType = randArray(tips_selected, type_num[arg1] % tips_selected.length);
                            tipsByType = tipsByType_arr.concat(tipsByType);
                        }

                        for (var j = 0; j < type_num[arg1]; j++) {
                            (function (arg, arg4, arg5, list1, list2, list3, list4, list5) {
                                Bank.find({tips: tipsByType[i], type: type_items[arg1]}, {
                                    "type": 1,
                                    "tips": 1,
                                    "level": 1
                                }, function (err, docs) {
                                    if (err) {
                                        res.send(err);
                                    } else {
                                        level_random(level);
                                        Bank.find({
                                                tips: tipsByType[arg],
                                                type: type_items[arg5],
                                                level: level_select
                                            }, {
                                                "type": 1,
                                                "tips": 1,
                                                "level": 1,
                                                "question": 1,
                                                "answer": 1
                                            },
                                            function (err, docs) {
                                                if (docs.length > 0) {
                                                    var rdIndex = Math.ceil(Math.random() * (docs.length - 1));
                                                    var select_finally = docs[rdIndex];
                                                    var q_type = select_finally.type;
                                                    if (q_type == '选择题') {
                                                        list1.push(select_finally)
                                                    }
                                                    else if (q_type == '填空题') {
                                                        list2.push(select_finally)

                                                    }
                                                    else if (q_type == '判断题') {
                                                        list3.push(select_finally)

                                                    }
                                                    else if (q_type == '简答题') {
                                                        list4.push(select_finally)

                                                    }
                                                    else {
                                                        list5.push(select_finally)

                                                    }
                                                    arg4.push(select_finally);
                                                    if (arg + 1 == type_num[arg5]) {
                                                        console.log(select_finally.type)
                                                    }
                                                    if (arg4.length == total_length) {
                                                        console.log(list1.length)
                                                        console.log(list2.length)
                                                        console.log(list3.length)
                                                        console.log(list4.length)
                                                        console.log(list5.length)
                                                        var paper = new Paper({
                                                            user_id: req.session.user.user_id,
                                                            subject: req.session.user.subject_default,
                                                            tips: req.body.tips,
                                                            level: req.body.level,
                                                            data: paper_list,
                                                            date: new Date()
                                                        });
                                                        paper.save(function (err, next) {
                                                            if (err) {
                                                                res.end('error', err);
                                                                return next();
                                                            }
                                                            // fs.writeFile(filePath + '/' + paper.date + '.txt', paper_list, function (err) {
                                                            //     if (err) throw err;
                                                            //     console.log("File Saved !"); //文件被保存
                                                            // });
                                                            docx.on('finalize', function (written) {
                                                                console.log('Finish to create Word file.\nTotal bytes created: ' + written + '\n');
                                                            });

                                                            docx.on('error', function (err) {
                                                                console.log(err);
                                                            });
                                                            var arr_paper1 = [{}];
                                                            var arr_paper2 = [{}];
                                                            var arr_paper3 = [{}];
                                                            var arr_paper4 = [{}];
                                                            var arr_paper5 = [{}];

                                                            for (let i = 0; i < list1.length; i++) {
                                                                arr_paper1.push(
                                                                    {
                                                                        type: "dotlist"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        text: "dotlist1.",
                                                                        val: list1[i].question
                                                                    }
                                                                )
                                                            }
                                                            for (let i = 0; i < list2.length; i++) {
                                                                arr_paper2.push(
                                                                    {
                                                                        type: "dotlist"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        text: "dotlist1.",
                                                                        val:list2[i].question
                                                                    }
                                                                )
                                                            }
                                                            for (let i = 0; i < list3.length; i++) {
                                                                arr_paper3.push(
                                                                    {
                                                                        type: "dotlist"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        text: "dotlist1.",
                                                                        val: list3[i].question
                                                                    }
                                                                )
                                                            }
                                                            for (let i = 0; i < list4.length; i++) {
                                                                arr_paper4.push(
                                                                    {
                                                                        type: "dotlist"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        text: "dotlist1.",
                                                                        val: list4[i].question
                                                                    }
                                                                )
                                                            }
                                                            for (let i = 0; i < list5.length; i++) {
                                                                arr_paper5.push(
                                                                    {
                                                                        type: "dotlist"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        text: "dotlist1.",
                                                                        val:  list5[i].question
                                                                    }
                                                                )
                                                            }

                                                            var data_paper = [
                                                                [
                                                                    {align: 'right'},
                                                                    {
                                                                        type: "text",
                                                                        val: "Created"
                                                                    },
                                                                    {
                                                                        type: "text",
                                                                        val: " by YunTi",
                                                                        opt: {color: '000088'}
                                                                    },
                                                                ],

                                                                {
                                                                    type: "horizontalline"
                                                                },

                                                                [
                                                                    {align: 'center'},
                                                                    {
                                                                        type: "text",
                                                                        val: "XXX大学期末试卷("+req.session.user.subject_default+")",
                                                                        opt: {font_face: 'Arial', font_size: 30}
                                                                    }
                                                                ],

                                                                [
                                                                    {align: 'left'},
                                                                    {
                                                                        type: "text",
                                                                        val: "选择题",
                                                                        opt: {font_face: 'Arial', font_size: 20}
                                                                    }
                                                                ],
                                                                arr_paper1,
                                                                [
                                                                    {align: 'left'},
                                                                    {
                                                                        type: "text",
                                                                        val: "填空题",
                                                                        opt: {font_face: 'Arial', font_size: 20}
                                                                    }
                                                                ],
                                                                arr_paper2,
                                                                [
                                                                    {align: 'left'},
                                                                    {
                                                                        type: "text",
                                                                        val: "判断题",
                                                                        opt: {font_face: 'Arial', font_size: 20}
                                                                    }
                                                                ],
                                                                arr_paper3,
                                                                [
                                                                    {align: 'left'},
                                                                    {
                                                                        type: "text",
                                                                        val: "解答题",
                                                                        opt: {font_face: 'Arial', font_size: 20}
                                                                    }
                                                                ],
                                                                arr_paper4,
                                                                [
                                                                    {align: 'left'},
                                                                    {
                                                                        type: "text",
                                                                        val: "简答题",
                                                                        opt: {font_face: 'Arial', font_size: 20}
                                                                    }
                                                                ],
                                                                arr_paper5

                                                            ]

                                                            var pObj = docx.createByJson(data_paper);

                                                            var out = fs.createWriteStream(filePath + '/' + paper.date + '.docx');

                                                            out.on('error', function (err) {
                                                                console.log(err);
                                                            });
                                                            docx.generate(out);

                                                            res.status(200).send({
                                                                message: "ok",
                                                                data: paper_list,
                                                                length: paper_list.length
                                                            });
                                                        })
                                                    }
                                                }
                                                //todo 下载题目
                                                else {
                                                    Bank.find({
                                                        tips: tipsByType[arg],
                                                        type: type_items[arg5],
                                                    }, {
                                                        "type": 1,
                                                        "tips": 1,
                                                        "level": 1
                                                    }, function (err, doc) {
                                                        var rdIndex = Math.ceil(Math.random() * (doc.length - 1));
                                                        var select_finally = doc[rdIndex]
                                                        arg4.push(select_finally)
                                                        if (arg4.length == total_length) {
                                                            var paper = new Paper({
                                                                user_id: req.session.user.user_id,
                                                                subject: req.session.user.subject_default,
                                                                tips: req.body.tips,
                                                                level: req.body.level,
                                                                data: paper_list,
                                                                date: new Date()
                                                            });
                                                            paper.save(function (err, next) {
                                                                if (err) {
                                                                    res.end('error', err);
                                                                    return next();
                                                                }
                                                                fs.writeFile("bb.txt", paper_list, function (err) {
                                                                    if (err) throw err;
                                                                    console.log("File Saved !"); //文件被保存
                                                                });
                                                                res.status(200).send({
                                                                    message: "ok",
                                                                    data: paper_list,
                                                                    length: paper_list.length
                                                                });
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                    }

                                })

                            })(j, paper_list, arg1, type1_list, type2_list, type3_list, type4_list, type5_list)
                        }
                    }
                })

        })(i)
    }

});

//生成题目
//测试 20 -》 5  level 1.8
router.get('/createpaper/:num/:level', function (req, res, next) {
    var num = req.params.num;
    var level = req.params.level;
    var level_1 = Math.floor(num * ((level / 3) / 2));
    var level_2 = Math.floor(num / 2);
    var level_3 = num - level_1 - level_2;
    var arr1 = [];

    var p1 = all.getAll("选择题", "易", level_3, arr1);
    var p2 = all.getAll("选择题", "中", level_2, arr1);
    var p3 = all.getAll("选择题", "难", level_1, arr1);
    var p4 = all.getAll("简答题", "易", level_3, arr1);
    var p5 = all.getAll("简答题", "中", level_2, arr1);
    var p6 = all.getAll("简答题", "难", level_1, arr1);

    var sp = Promise.all([p1, p2, p3, p4, p5, p6]).then(function () {


        var M = arr1.map(function (o) {
            return o.tips
        })
        var set1 = Array.from(new Set(M))
        console.log(set1.length / 10)
        if (set1.length / 10 >= 0.6) {
            var paper = new Paper({
                subject: "物理",
                level: level,
                data: arr1
            });
            paper.save(function (err, next) {
                if (err) {
                    res.end("error");
                    return next();
                }

                res.json({message: "done", data: arr1})
            })

        }
        else {
            res.json({message: "done", data: set1.length / 10})
        }
    })

});
//下载试卷
router.get('/download/:filename', function (req, res, next) {
    var file = filePath + '/' + req.params.filename + '.docx';
    res.download(file); // Set disposition and send it.
});

//删除试卷
router.get('/paper/:id/delete', function (req, res, next) {
    Paper.findOne({_id: req.params.id}, function (err, doc) {
        if (err) {
            res.end('err', err);
            return next();
        }

        doc.remove();
        res.redirect('/paper-bank')
    })
})
//生成word


/**
 * root用户接口
 **/

//登陆
router.get('/back/login', function (req, res, next) {
    if (req.query.username == 'root' && req.query.password == '123456') {
        res.redirect('/back/dashboard ')
    }
    else {
        res.status(400).send({error: 'username or password is flase'});
    }

});
//创建用户
router.get('/register', function (req, res, next) {
    var subject = (req.query.subject).split(',');
    var md5 = crypto.createHash('md5');
    md5.update(req.query.password);
    var a = md5.digest('hex');

    var schema = Joi.object().keys({
        username: Joi.string().regex(/^[a-zA-Z0-9]{6,18}$/).required(),
        password: Joi.string().regex(/^[a-zA-Z0-9]{6,18}$/).required(),
    });
    Joi.validate({username: req.query.username, password: req.query.password}, schema, function (err, value) {
        if (err) {
            res.status(400).send(err);
        }
        else {
            User.find({username: req.query.username}, function (err, docs) {
                if (err) {
                    res.end(err)
                }
                else {
                    if (docs.length == 0) {
                        var user = new User({
                            username: req.query.username,
                            password: req.query.password,
                            subject: subject,
                            remarks: req.query.remarks
                        });

                        user.save(function (err, next) {
                            if (err) {
                                res.end("error");
                                return next();
                            }
                            // res.end()
                            res.redirect('/back/dashboard')


                        })
                    } else {
                        res.status(400).send({error: 'username is used'});
                    }

                }
            })
        }

    });

});
//更新用户信息
router.get('/back/update', function (req, res, next) {
    var subject = (req.query.subject).split(',');
    User.find({username: req.query.username}, function (err, doc) {
        if (err) {
            res.end(err)
        }
        User.update({username: req.query.username}, {
            $set: {
                password: req.query.password,
                subject: subject,
                remarks: req.query.remarks
            }
        }, function (err, next) {
            if (err) {
                res.end('err', err);
                return next();
            }
            res.redirect('/back/dashboard')
        })
    })
});
//删除用户
router.get('/back/delete/:username', function (req, res, next) {

    User.findOne({username: req.params.username}, function (err, doc) {
        if (err) {
            res.end('err', err);
            return next();
        }
        doc.remove();
        res.redirect('/back/dashboard')
    })
});


//修改题目难度
router.get('/back/find_question/:q_id', function (req, res, next) {
    Bank.find({_id: req.params.q_id}, function (err, doc) {
        if (err) {
            res.end(err)
        }
        console.log(doc)
        res.render('back/find_question', {title: '更新信息', qInfo: doc[0]});
    })
});

router.get('/back/update_qLevel/:q_id', function (req, res, next) {
    Bank.find({_id: req.params.q_id}, function (err, doc) {
        if (err) {
            res.end(err)
        }
        Bank.update({_id: req.params.q_id}, {
            $set: {
                level: req.query.level,
            }
        }, function (err, next) {
            if (err) {
                res.end('err', err);
                return next();
            }
            res.redirect('/back/question-manage')
        })
    })
});

/**
 * testAPI
 **/

//造数据
router.get('/addtestdata', function (req, res, next) {
    var data = Mock.mock({
        'list|10000': [{
            user_id: "582e96460522740cd397ccfa",
            "subject|1": ["物理", "高数", "英语"],
            "type|1": ["选择题", "判断题", "填空题", "简答题", "解答题"],
            tips: /知识点[0-4][0-9]/,
            "level|1": ["易", "中", "难"],
            "public|1": true,
            question: /云题题库:题目[a-z]+[A-Z]+[1-9]/,
            answer: /云题题库:答案[a-z]+[A-Z]+[1-9]/,
        }]
    });
    Bank.collection.insert(data.list, onInsert);
    function onInsert(err, docs) {
        if (err) {
            res.end("error");
            return next();
        } else {
            res.status(200).send({message: "done"});
        }
    }

});
module.exports = router;