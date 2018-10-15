let express = require('express');
let informationDB = require('../models/information_db');
let router = express.Router();
let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false });
var ObjectID = require('mongodb').ObjectID;

// 跨域header设定
router.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});


//登录
router.post('/login', urlencodedParser, async function (req, res, next) {
    // console.log(req.body)
    let user = {
		username: req.body.username,
        password: req.body.password
    }

    console.log(user);

    let collection = await informationDB.getCollection("ADMINISTORATOR");

    collection.findOne({ username: user.username}, function (err, data) {
        if(data) {
            if (data.password === user.password) {
                if (data.access === 1) {
                    res.status(200).json({ "code": "200","description": "登录成功","user": data})
                }
                else {
                    res.status(500).json({ "code": "500","description": "等待认证"})
                }

            }
            else {
                res.status(500).json({ "code": "500","description": "密码错误"})
            }
        }
        else {
            res.status(500).json({ "code": "500","description": "查无此人"})
        }

    })

});


//根据username获取流水
router.get('/admin/deals', urlencodedParser, async function (req, res, next) {
	let params = req.query;
    let collection = await informationDB.getCollection("DEALS");
	collection.find({ "from.username": params.id }).toArray(function (err, sendData) {
        collection.find({ "to.id": params.id }).toArray(function (err, acceptData) {
			res.status(200).json({
                "sendDeals": sendData,
                "toDeals": acceptData
			});
        })
	});
});

//根据id获取用户流水
router.get('/user/deals', urlencodedParser, async function (req, res, next) {
	let params = req.query;
    let collection = await informationDB.getCollection("CONFIRMLIST");
	collection.find({ "model.poster": params.id }).toArray(function (err, getData) {
        collection.find({buyer: params.id}).toArray(function (err, buyData) {
			res.status(200).json({
                "getDeals": getData,
                "buyDeals": buyData
			});
        })
	});
});


//根据账户username获取账户信息
router.get('/administorator', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ADMINISTORATOR");
	collection.findOne({ username: params.username }, function (err, data) {
		if (data) {
            res.status(200).json({
                _id: data._id,
                username: data.username,
                name: data.name,
                password: data.password,
                community: data.community,
                tel: data.tel,
                permission: data.permission,
                scores: data.scores,
                access: data.access,
                college: data.college,  //新加，大学
                IDcard: data.IDcard,    //新加，身份证号
            });
		}
		else {
			res.status(400).json({ "code": "-1" })
		}
	});
});

//分配积分
router.post('/user/edit', urlencodedParser, async function (req, res, next) {
	let aDeal = {
        sender: req.body.sender,
        senderPermission: req.body.senderPermission,
        to: req.body.to,
        acceptPermission: req.body.acceptPermission,
		score: req.body.score
    }
    console.log(aDeal)

    let collection = await informationDB.getCollection("ACCOUNT");
    let adminCollection = await informationDB.getCollection("ADMINISTORATOR");
    let confirmCollection = await informationDB.getCollection("CONFIRMLIST");
    let dealsCollection = await informationDB.getCollection("DEALS");

	//在发送人积分表中加入数据
	adminCollection.findOne({ username: aDeal.sender }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			let senderScores = {
                _id: data._id,
                username: data.username,
                name: data.name,
                password: data.password,
                community: data.community,
                tel: data.tel,
                permission: data.permission,
                scores: data.scores,
                access: data.access,
                college: data.college,  //新加，大学
                IDcard: data.IDcard,    //新加，身份证号
			}
			if (aDeal.score < 0) {
				res.status(200).json({ "code": "-2" })
			}
			else {

                if (aDeal.senderPermission == "3") {
                    adminCollection.save({
                        _id: ObjectID(senderScores._id),
                        username: senderScores.username,
                        name: senderScores.name,
                        password: senderScores.password,
                        community: senderScores.community,
                        tel: senderScores.tel,
                        permission: senderScores.permission,
                        scores: senderScores.scores,
                        access: senderScores.access,
                        college: senderScores.college,  //新加，大学
                        IDcard: senderScores.IDcard,    //新加，身份证号
                    });
                }
                else if (aDeal.senderPermission == "2") {
                    let m_score = parseInt(senderScores.scores) - parseInt(aDeal.score);

                    if (m_score < 0) {
                        res.status(200).json({ "code": "-3" })
                    }
                    else {
                        senderScores.scores = String(m_score);
                        adminCollection.save({
                            _id: ObjectID(senderScores._id),
                            username: senderScores.username,
                            name: senderScores.name,
                            password: senderScores.password,
                            community: senderScores.community,
                            tel: senderScores.tel,
                            permission: senderScores.permission,
                            scores: senderScores.scores,
                            access: senderScores.access,
                            college: senderScores.college,  //新加，大学
                            IDcard: senderScores.IDcard,    //新加，身份证号
                        });
                    }
                }

                //在收分人积分表中加入数据
                if (aDeal.acceptPermission == "2") {
                    adminCollection.findOne({ username: aDeal.to }, function (err, acceptData) {
                        if (!acceptData) {
                            console.log(acceptData)
                            res.status(400).json({ "code": "-1" })
                        } else {
                            let toScores = {
                                _id: data._id,
                                username: data.username,
                                name: data.name,
                                password: data.password,
                                community: data.community,
                                tel: data.tel,
                                permission: data.permission,
                                scores: data.scores,
                                access: data.access
                            }
                
                            toScores.scores = String(parseInt(toScores.scores) + parseInt(aDeal.score));
                
                            adminScoreCollection.save({
                                _id: ObjectID(data._id),
                                username: toScores.username,
                                name: toScores.name,
                                password: toScores.password,
                                community: toScores.community,
                                tel: toScores.tel,
                                permission: toScores.permission,
                                scores: toScores.scores,
                                access: toScores.access,
                                college: senderScores.college,  //新加，大学
                                IDcard: senderScores.IDcard,    //新加，身份证号
                            });

                        }
                    });
        
                }

                else if (aDeal.acceptPermission == "1") {
                    collection.findOne({ id: aDeal.to }, function (err, userData) {
                        if (!userData) {
                            res.status(400).json({ "code": "-1" })
                        } else {
                            let toScores = {
                                _id: userData._id,
                                id: userData.id,
                                nickName: userData.nickName,
                                name: userData.name,
                                gender: userData.gender,
                                access: userData.access,
                                headimg: userData.headimg,
                                tel: userData.tel,
                                college: userData.college,
                                scores: userData.scores,
                                community: userData.community,
                                birthday: userData.birthday,
                                IDcard: userData.IDcard,
                                address: userData.address,
                                QQ: userData.QQ,
                                describe: userData.describe
                            }
                            toScores.scores = String(parseInt(toScores.scores) + parseInt(aDeal.score));
                
                            collection.save({
                                _id: toScores._id,
                                id: toScores.id,
                                nickName: toScores.nickName,
                                name: toScores.name,
                                gender: toScores.gender,
                                access: toScores.access,
                                headimg: toScores.headimg,
                                tel: toScores.tel,
                                college: toScores.college,
                                community: toScores.community,
                                scores: toScores.scores,
                                lockedScores: toScores.lockedScores,
                                willGetScores: toScores.willGetScores,
                                birthday: toScores.birthday,
                                IDcard: toScores.IDcard,
                                address: toScores.address,
                                QQ: toScores.QQ,
                                describe: toScores.describe
                            });
                        }
                    });
                }


                adminCollection.findOne({ username: aDeal.sender }, function (err, senderData) {
                    if (aDeal.acceptPermission == "2") {
                        adminCollection.findOne({ username: aDeal.to }, function (err, toData) {
                            dealsCollection.insertOne({
                                score: aDeal.score,
                                from: {
                                    username: senderData.username,
                                    name: senderData.name,
                                    community: senderData.community,
                                    tel: senderData.tel
                                },
                                to: {
                                    id: aDeal.to,
                                    name: toData.username,
                                    community: toData.community,
                                    tel: toData.tel
                                },
                                time: getDate()
            
                            }, function () {
                                res.status(200).json({ "code": "1" });
                            })
                        });
                    }
                    else if (aDeal.acceptPermission == "1") {
                        collection.findOne({ id: aDeal.to }, function (err, toData) {
                            dealsCollection.insertOne({
                                score: aDeal.score,
                                from: {
                                    username: senderData.username,
                                    name: senderData.username,
                                    community: senderData.community,
                                    tel: senderData.tel
                                },
                                to: {
                                    id: aDeal.to,
                                    name: toData.name,
                                    community: toData.college,
                                    tel: toData.tel
                                }
            
                            }, function () {
                                res.status(200).json({ "code": "1" });
                            })
                        });
                    }

                })
			}
		}
	});

});

//注册  
router.post('/register', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在UsearData中
	let UsearData = {
        username: req.body.username,
        name: req.body.name,
        password: req.body.password,
        community: req.body.community,
        tel: req.body.tel,
        permission: req.body.permission,
        access: 0,
        college: req.body.college,  //新加，大学
        IDcard: req.body.IDcard,    //新加，身份证号，
        scores: "0"
	}

    //开始初始化数据库
    console.log(UsearData)
    let collection = await informationDB.getCollection("ADMINISTORATOR");

    if (UsearData.username == "adminroot") {
        UsearData.permission = 3;
        UsearData.access = 1;
        UsearData.scores = "999";
    }

	collection.findOne({ username: UsearData.username }, function (err, data) {
		if (!data) {
			collection.insertOne({
                username: UsearData.username,
                name: UsearData.name,
                password: UsearData.password,
                community: UsearData.community,
                tel: UsearData.tel,
                permission: UsearData.permission,
                access: UsearData.access,
                scores: UsearData.scores,
                college: UsearData.college,  //新加，大学
                IDcard: UsearData.IDcard,    //新加，身份证号
			}, function () {
                res.status(200).json({ "code": "200" });
			})
		}
		else {
			res.status(200).json({ "code": "500" });
		}
    });
    


});


// 管理员认证
router.post('/admin/register', urlencodedParser, async function (req, res, next) {

    let username = req.body.username;
    let access = req.body.access;

    let collection = await informationDB.getCollection("ADMINISTORATOR");
    collection.findOne({ username: username }, function (err, data) {
        if (!data) {
            res.status(400).json({ "code": "-1" })
        } else {

            collection.save({
                _id: ObjectID(data._id),
                username: data.username,
                name: data.name,
                password: data.password,
                community: data.community,
                tel: data.tel,
                permission: data.permission,
                access: parseInt(access),
                scores: data.scores,
                college: data.college,  //新加，大学
                IDcard: data.IDcard,    //新加，身份证号
            },function () {
                res.status(200).json({ "code": "1" })
            });
        }
    });

});

// 用户认证
router.post('/user/register', urlencodedParser, async function (req, res, next) {

    let Id = req.body.id;
    let access = req.body.access;

    let collection = await informationDB.getCollection("ACCOUNT");
    collection.findOne({ id: Id }, function (err, data) {
        if (!data) {
            res.status(400).json({ "code": "-1" })
        } else {
            collection.save({
                _id: ObjectID(data._id),
				id: data.id,
				nickName: data.nickName,
				name: data.name,
				gender: data.gender,
				headimg: data.headimg,
				tel: data.tel,
                college: data.college,
                community: data.community,
                access: parseInt(access),
                scores: data.scores,
                lockedScores: data.lockedScores,
				willGetScores: data.willGetScores,
				community: data.community,
				birthday: data.birthday,
				IDcard: data.IDcard,
				address: data.address,
				QQ: data.QQ,
				describe: data.describe
            },function () {
                res.status(200).json({ "code": "1" })
            });
        }
    });

});


// 获取所有用户信息
router.get('/user/list', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ACCOUNT");
    let alldata = [];
    let page = parseInt(params.page);
    if (params.community == '' || params.community == '开发组'　|| params.community == '迷斯伍德动漫社') {
        collection.find({access: parseInt(params.access)}).sort(['_id', 1]).toArray(function (err, userdata) {
            // scoreCollection.find().sort(['_id', 1]).toArray(function (err, scoredata) {
            //     for (var i = 0; i<userdata.length;++i ) {
            //         var user = userdata[i].id;
            //         scoredata.filter((scoreuser) => {
            //             if(scoreuser.id == user){
            //                 userdata[i].scores = scoreuser.scores;
            //             }
            //         })
                    
            //     };
            // })
            res.status(200).json({
                "UsersInformation": userdata
            });
        });
    }
    else {
        if (params.name == '') {
            collection.find({college: params.community, access: parseInt(params.access)}).sort(['_id', 1]).toArray(function (err, userdata) {
                res.status(200).json({
                    "UsersInformation": userdata
                });
            });
        }
        else {
            collection.find({college: params.community, name: params.name, access: parseInt(params.access)}).sort(['_id', 1]).toArray(function (err, userdata) {
                res.status(200).json({
                    "UsersInformation": userdata
                });
            });
        }
    }
});

// 获取管理员列表
router.get('/admin/list', urlencodedParser, async function (req, res, next) {
	let params = req.query;
    console.log(params);

    let collection = await informationDB.getCollection("ADMINISTORATOR");
    
    collection.findOne({ username: params.username }, function (err, data) {
        if (data) {
            console.log(data)
            if (data.permission == '3') {
                if (params.name == '') {
                    collection.find({permission: '2',access: parseInt(params.access)}).sort(['_id', 1]).toArray(function (err, userdata) {
                        res.status(200).json({
                            "UsersInformation": userdata
                        });
                    });
                }
                else {
                    collection.find({permission: '2', name: params.name,access: parseInt(params.access)}).sort(['_id', 1]).toArray(function (err, userdata) {
                        res.status(200).json({
                            "UsersInformation": userdata
                        });
                    });
                }
            }
            else {
                res.status(200).json({
                    "UsersInformation": []
                });
            }
        }
        else {
            res.status(400).json({ "code": "-1" });
        }
    });

});

// 删除管理员
router.delete('/admin/remove', urlencodedParser, async function (req, res, next) {
    let username  =  req.body.username;

    console.log(req.body);

    let collection = await informationDB.getCollection("ADMINISTORATOR");
    collection.findOne({ username: username }, function (err, data) {
        if (!data) {
            res.status(400).json({ "code":"0","description": "not found" })
        } else {
            collection.remove({username: username},function () {
                res.status(200).json({ "code":"1", "description": "delete success" });
                });
        }
    });

});

// 删除用户 
router.delete('/user/remove', urlencodedParser, async function (req, res, next) {
    let Id  =  req.body.id;

    console.log(req.body);

    let collection = await informationDB.getCollection("ACCOUNT");
    collection.findOne({ id: Id }, function (err, data) {
        if (!data) {
            res.status(400).json({"code":"0", "description": "not found" })
        } else {
            collection.remove({id: Id},function () {
                res.status(200).json({ "code":"1" , "description": "delete success" });
                });
        }
    });

});


// 批量删除用户 
router.delete('/user/batchremove', urlencodedParser, async function (req, res, next) {
    let usernames  =  req.body.usernames;
    var usernameArray = usernames.split(",");
    console.log(usernameArray);

    let collection = await informationDB.getCollection("ADMINISTORATOR");

    collection.remove({username: {"$in": usernameArray}},function () {
        res.status(200).json({ "code": "1","description": "delete success" });
        });

});

// 获取商品信息
router.get('/model/listpage', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("SHOP");
    let page = parseInt(params.page) - 1;

    collection.find({shopKind: params.shopKind}).toArray(function (err, allData) {
        if (params.name == "") {
            collection.find({shopKind: params.shopKind}).sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
                res.status(200).json({
                    "total": allData.length,
                    "models": data
                });
            })
        }
        else {
            collection.find({shopKind: params.shopKind, theme: params.name}).sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
                res.status(200).json({
                    "total": allData.length,
                    "models": data
                });        
            })
        }

    })
});


// 删除商品
router.delete('/model/remove', urlencodedParser, async function (req, res, next) {
    let Id  =  req.body.id;

    console.log(Id);

    let collection = await informationDB.getCollection("SHOP");
    collection.findOne({ _id: ObjectID(Id) }, function (err, data) {
        if (!data) {
            res.status(400).json({ "code":"-1","description": "not found" })
        } else {
            collection.remove({_id: ObjectID(Id)},function () {
                res.status(200).json({ "code":"1","description": "delete success" });
                });
        }
    });

});

// 批量删除商品
router.delete('/model/batchremove', urlencodedParser, async function (req, res, next) {
    let Ids  =  req.body.ids;
    var Idsarray = Ids.split(",");
    console.log(Idsarray);
    for(var i=0;i<Idsarray.length;i++){
        Idsarray[i] = ObjectID(Idsarray[i]);
       }

    let collection = await informationDB.getCollection("SHOP");

    collection.remove({_id: {"$in": Idsarray}},function () {
        res.status(200).json({ "description": "delete success" });
        });

});

// 获取核销商品信息
router.get('/model/confirmlistpage', urlencodedParser, async function (req, res, next) {
    let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("CONFIRMLIST");
    let page = parseInt(params.page) - 1;
    collection.find({status: "0"}).toArray(function (err, allData) {
        if (params.orderNumber == "") {
            collection.find({status: "0"}).sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
                res.status(200).json({
                    "total": allData.length,
                    "models": data
                });
            })
        }
        else {
            collection.find({orderNumber: params.orderNumber,status: "0"}).sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
                res.status(200).json({
                    "total": allData.length,
                    "models": data
                });
            })
        }
    })
});

// 帖子置顶
router.post('/blogs/top', urlencodedParser, async function (req, res, next) {
    let Id = req.body.id;
    console.log(req.body)
    let collection = await informationDB.getCollection("POSTBLOGS");
    collection.findOne({_id: ObjectID(Id)}, function (err, data) {
        if (!data) {
            res.status(400).json({ "code": "-1" })
        } else {
            confirmCollection.save({
                _id: ObjectID(data._id),
                theme: data.theme,
                content: data.content,
                poster: data.poster,
                time: data.time,
                replyBlogsId: data.replyBlogsId,
                likeIds: data.likeIds,
                likePicture: data.likePicture,
                likenumber: data.likenumber,
                board: data.board,
                picture: data.picture,
                isTop: "1",
                isEssence: data.isEssence
            },function () {
                res.status(200).json({ "code": "1" })
            });
        }
    });
});

// 帖子精华
router.post('/blogs/essence', urlencodedParser, async function (req, res, next) {
    let Id = req.body.id;
    console.log(req.body)
    let collection = await informationDB.getCollection("POSTBLOGS");
    collection.findOne({_id: ObjectID(Id)}, function (err, data) {
        if (!data) {
            res.status(400).json({ "code": "-1" })
        } else {
            confirmCollection.save({
                _id: ObjectID(data._id),
                theme: data.theme,
                content: data.content,
                poster: data.poster,
                time: data.time,
                replyBlogsId: data.replyBlogsId,
                likeIds: data.likeIds,
                likePicture: data.likePicture,
                likenumber: data.likenumber,
                board: data.board,
                picture: data.picture,
                isTop: data.isTop,
                isEssence: "1"
            },function () {
                res.status(200).json({ "code": "1" })
            });
        }
    });
});




//核销商品
router.post('/model/confirm', urlencodedParser, async function (req, res, next) {
    let orderNumber = req.body.orderNumber;
    console.log(req.body)
    let confirmCollection = await informationDB.getCollection("CONFIRMLIST");
    confirmCollection.findOne({orderNumber: orderNumber}, function (err, data) {
        if (!data) {
            res.status(400).json({ "code": "-1" })
        } else {
            confirmCollection.save({
                _id: ObjectID(data._id),
                orderNumber: data.orderNumber,
                buyer: data.buyer,
                modelId: data.modelId,
                modelName: data.name,
                buyNumber: data.buyNumber,
                price: data.price,
                reMarks: data.reMarks,
                orderTime: data.orderTime,
                status: "1",
                model: data.model
            },function () {
                res.status(200).json({ "code": "1" })
            });
        }
    });
});

function getDate(){
	nowDate = new Date();
	var nowMonth = nowDate.getMonth()+1;
	nowDateArray = {
		year: nowDate.getFullYear(),
		month: nowMonth>9?nowMonth:"0"+nowMonth,
		day: nowDate.getDate()>9?nowDate.getDate() :"0"+nowDate.getDate(),
		hour: nowDate.getHours()>9?nowDate.getHours() :"0"+nowDate.getHours(),
		minutes: nowDate.getMinutes()>9?nowDate.getMinutes() :"0"+nowDate.getMinutes(),
		second: nowDate.getSeconds()>9?nowDate.getSeconds() :"0"+nowDate.getSeconds()
	}

    return nowDateArray ;
}

module.exports = router;