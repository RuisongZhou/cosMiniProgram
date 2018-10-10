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
                    res.status(200).json({ "result": "0","message": "登录成功","user": data})
                }
                else {
                    res.status(400).json({ "result": "-1","message": "等待认证"})
                }

            }
            else {
                res.status(400).json({ "result": "-1","message": "密码错误"})
            }
        }
        else {
            res.status(400).json({ "result": "-1","message": "查无此人"})
        }

    })

});


//根据username获取流水
router.get('/user/deals', urlencodedParser, async function (req, res, next) {
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


//根据账户username获取账户信息
router.get('/administorator', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ADMINISTORATOR");
    let scoresCollection = await informationDB.getCollection("ADMINSCORES");
	collection.findOne({ username: params.username }, function (err, data) {
		if (data) {
			scoresCollection.findOne({ username: params.username }, function (err, scoresData) {
				if (!scoresData) {
					res.status(400).json({ "code": "-1" })
				} else {
					res.status(200).json({
                        _id: data._id,
                        username: data.username,
                        name: data.name,
                        password: data.password,
                        community: data.community,
                        tel: data.tel,
                        permission: data.permission,
                        scores: scoresData.scores,
                        access: data.access
					});
				}
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
    let scoresCollection = await informationDB.getCollection("SCORES");
    let adminScoreCollection = await informationDB.getCollection("ADMINSCORES");
    let adminCollection = await informationDB.getCollection("ADMINISTORATOR");
    let confirmCollection = await informationDB.getCollection("CONFIRMLIST");
    let dealsCollection = await informationDB.getCollection("DEALS");

	//在发送人积分表中加入数据
	adminScoreCollection.findOne({ username: aDeal.sender }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			let senderScores = {
				_id: data._id,
				username: data.username,
				scores: data.scores
			}
			if (aDeal.score < 0) {
				res.status(200).json({ "code": "-2" })
			}
			else {

                if (aDeal.senderPermission == "3") {
                    adminScoreCollection.save({
                        _id: ObjectID(senderScores._id),
                        username: senderScores.username,
                        scores: senderScores.scores
                    });
                }
                else if (aDeal.senderPermission == "2") {
                    let m_score = parseInt(senderScores.scores) - parseInt(aDeal.score);

                    if (m_score < 0) {
                        res.status(200).json({ "code": "-3" })
                    }
                    else {
                        senderScores.scores = String(m_score);
                        adminScoreCollection.save({
                            _id: ObjectID(senderScores._id),
                            username: senderScores.username,
                            scores: senderScores.scores
                        });
                    }
                }

                //在收分人积分表中加入数据
                if (aDeal.acceptPermission == "2") {
                    adminScoreCollection.findOne({ username: aDeal.to }, function (err, acceptData) {
                        if (!acceptData) {
                            console.log(acceptData)
                            res.status(400).json({ "code": "-1" })
                        } else {
                            let toScores = {
                                _id: acceptData._id,
                                username: acceptData.username,
                                scores: acceptData.scores
                            }
                
                            toScores.scores = String(parseInt(toScores.scores) + parseInt(aDeal.score));
                
                            adminScoreCollection.save({
                                _id: ObjectID(toScores._id),
                                username: toScores.username,
                                scores: toScores.scores
                            });

                        }
                    });
        
                }

                else if (aDeal.acceptPermission == "1") {
                    scoresCollection.findOne({ id: aDeal.to }, function (err, userData) {
                        if (!userData) {
                            res.status(400).json({ "code": "-1" })
                        } else {
                            let toScores = {
                                _id: userData._id,
                                id: userData.id,
                                scores: userData.scores
                            }
                            toScores.scores = String(parseInt(toScores.scores) + parseInt(aDeal.score));
                
                            scoresCollection.save({
                                _id: ObjectID(toScores._id),
                                id: toScores.id,
                                scores: toScores.scores
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
                                }
            
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
        access: 0
	}

    //开始初始化数据库
    console.log(UsearData)
    let collection = await informationDB.getCollection("ADMINISTORATOR");
    let scoresCollection = await informationDB.getCollection("ADMINSCORES");

	collection.findOne({ username: UsearData.username }, function (err, data) {
		if (!data) {
			collection.insertOne({
                username: UsearData.username,
                name: UsearData.name,
                password: UsearData.password,
                community: UsearData.community,
                tel: UsearData.tel,
                permission: UsearData.permission,
                access: UsearData.access
			}, function () {
					//初始化积分表
                scoresCollection.findOne({ username: UsearData.username }, function (err, data) {
                    if (!data) {
                        scoresCollection.insertOne({
                            username: UsearData.username,
                            scores: "0"
                        }, function () {
                            res.status(200).json({ "code": "200" });
                        })
                    }
                    else {
                        res.status(200).json({ "code": "500" });
                    }
                });
			})
		}
		else {
			res.status(200).json({ "code": "500" });
		}
    });
    


});


// 管理员认证
router.post('/user/register', urlencodedParser, async function (req, res, next) {

    let username = req.body.id;
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
                access: access
            },function () {
                res.status(200).json({ "code": "1" })
            });
        }
    });

});

// 用户认证
router.post('/admin/register', urlencodedParser, async function (req, res, next) {

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
				access: data.access
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
    let page = parseInt(params.page);
    collection.find({college: params.community}).sort(['_id', 1]).skip(page*20).limit(20).toArray(function (err, data) {
        console.log(data);
        collection.find({college: params.community}).toArray(function (err, allData) {
            res.status(200).json({
                "total": allData.length,
                "user": data
            });
        })
    });
});

// 获取管理员列表
router.get('/user/getRegisterAdminList', urlencodedParser, async function (req, res, next) {
	let params = req.query;
    console.log(params);

    let collection = await informationDB.getCollection("ADMINISTORATOR");
    
    collection.findOne({ username: params.username }, function (err, data) {
        if (data) {
            console.log(data)
            if (data.permission == '3') {
                collection.find({permission: '2'}).sort(['_id', 1]).toArray(function (err, userdata) {
                    res.status(200).json({
                        "UsersInformation": userdata
                    });
                });
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

// 删除用户 
router.delete('/user/remove', urlencodedParser, async function (req, res, next) {
    let username  =  req.body.username;

    console.log(req.body);

    let collection = await informationDB.getCollection("ADMINISTORATOR");
    collection.findOne({ username: username }, function (err, data) {
        if (!data) {
            res.status(400).json({ "msg": "not found" })
        } else {
            collection.remove({username: username},function () {
                res.status(200).json({ "msg": "delete success" });
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
        res.status(200).json({ "msg": "delete success" });
        });

});

// 获取商品信息
router.get('/model/listpage', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("SHOP");
    let page = parseInt(params.page);
    collection.find().sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
        collection.find().toArray(function (err, allData) {
            res.status(200).json({
                "total": allData.length,
                "models": data
            });
        })
    });
});


// 删除商品
router.delete('/model/remove', urlencodedParser, async function (req, res, next) {
    let Id  =  req.body.id;

    console.log(Id);

    let collection = await informationDB.getCollection("SHOP");
    collection.findOne({ _id: ObjectID(Id) }, function (err, data) {
        if (!data) {
            res.status(400).json({ "msg": "not found" })
        } else {
            collection.remove({_id: ObjectID(Id)},function () {
                res.status(200).json({ "msg": "delete success" });
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
        res.status(200).json({ "msg": "delete success" });
        });

});

// 获取核销商品信息
router.get('/model/confirmlistpage', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("CONFIRMLIST");
    let page = parseInt(params.page);
    collection.find({status: "0"}).sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
        // console.log(data);
        collection.find({status: "0"}).toArray(function (err, allData) {
            res.status(200).json({
                "total": allData.length,
                "models": data
            });
        })
    });
});


//核销商品
router.post('/model/confirm', urlencodedParser, async function (req, res, next) {
    let orderNumber = req.body.id;
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