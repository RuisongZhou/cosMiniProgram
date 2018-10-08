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

//根据账户id获取账户信息
router.get('/administorator', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ADMINISTORATOR");
    let scoresCollection = await informationDB.getCollection("ADMINSCORES");
	collection.findOne({ id: params.id }, function (err, data) {
		if (data) {
			scoresCollection.findOne({ id: params.id }, function (err, scoresData) {
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
						scores: scoresData.scores
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

    let collection = await informationDB.getCollection("SCORES");
    let adminCollection = await informationDB.getCollection("ADMINSCORES");

	//在发送人积分表中加入数据
	adminCollection.findOne({ id: aDeal.sender }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			let senderScores = {
				_id: data._id,
				id: data.id,
				scores: data.scores,
				deals: data.deals
			}
			if (aDeal.score < 0) {
				res.status(200).json({ "code": "-2" })
			}
			else {
                senderScores.deals.push({"sender": aDeal.sender,"to": aDeal.to, "score": aDeal.score, "time": getDate()});

                if (aDeal.senderPermission == "3") {
                    adminCollection.save({
                        "_id": ObjectID(senderScores._id),
                        "id": senderScores.id,
                        "scores": senderScores.scores,
                        "deals": senderScores.deals
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
                            "_id": ObjectID(senderScores._id),
                            "id": senderScores.id,
                            "scores": senderScores.scores,
                            "deals": senderScores.deals
                        });
                    }
                }

                    //在收分人积分表中加入数据
                    if (acceptPermission == "2") {
                        adminCollection.findOne({ id: aDeal.to }, function (err, data) {
                            if (!data) {
                                res.status(400).json({ "code": "-1" })
                            } else {
                                let toScores = {
                                    _id: data._id,
                                    id: data.id,
                                    scores: data.scores,
                                    deals: data.deals
                                }
                    
                                toScores.deals.push({"sender": aDeal.sender,"to": aDeal.to, "score": aDeal.score, "time": getDate()});
                                toScores.scores = String(parseInt(toScores.scores) + parseInt(aDeal.score));
                    
                                adminCollection.save({
                                    "_id": ObjectID(toScores._id),
                                    "id": toScores.id,
                                    "scores": toScores.scores,
                                    "deals": toScores.deals
                                });
                            }
                        });
            
                        res.status(200).json({ "code": "1" })
                    }

                else if (acceptPermission == "1") {
                    collection.findOne({ id: aDeal.to }, function (err, data) {
                        if (!data) {
                            res.status(400).json({ "code": "-1" })
                        } else {
                            let toScores = {
                                _id: data._id,
                                id: data.id,
                                scores: data.scores,
                                deals: data.deals
                            }
                
                            toScores.deals.push({"sender": aDeal.sender,"to": aDeal.to, "score": aDeal.score, "time": getDate()});
                            toScores.scores = String(parseInt(toScores.scores) + parseInt(aDeal.score));
                
                            collection.save({
                                "_id": ObjectID(toScores._id),
                                "id": toScores.id,
                                "scores": toScores.scores,
                                "deals": toScores.deals
                            });
                        }
                    });
        
                    res.status(200).json({ "code": "1" })
                }

				
			}
		}
	});

});

//注册  
router.post('/register', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在UsearData中
	let UsearData = {
        username: data.username,
        name: data.name,
        password: data.password,
        community: data.community,
        tel: data.tel,
        permission: data.permission
	}

	//开始初始化数据库
	let collection = await informationDB.getCollection("ADMINISTORATOR");

	collection.findOne({ community: UsearData.community }, function (err, data) {
		if (!data) {
			collection.insertOne({
                username: data.username,
                name: data.name,
                password: data.password,
                community: data.community,
                tel: data.tel,
                permission: data.permission
			}, function () {
				res.status(200).json({ "code": "200" });
			})
		}
		else {
			res.status(200).json({ "code": "500" });
		}
	});

});

// 获取所有用户信息
router.get('/user/list', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("ADMINISTORATOR");
    let page = parseInt(params.page);
    collection.find({community: params.community}).sort(['_id', 1]).skip(page*20).limit(20).toArray(function (err, data) {
        // console.log(data);
        let total =  collection.find({community: params.community}).count();
        res.status(200).json({
            "total": total.toString(),
            "user": data
        });
    });
});

// 获取管理员列表
router.get('/user/getRegisterAdminList', urlencodedParser, async function (req, res, next) {
	let params = req.query;
    console.log(params);

    let collection = await informationDB.getCollection("ADMINISTORATOR");
    
    collection.findOne({ _id: ObjectID(params._id) }, function (err, data) {
        if (data) {
            if (params.permisson == "3") {
                collection.find({permisson: "2"}).sort(['_id', 1]).toArray(function (err, data) {
                    res.status(200).json({
                        "UsersInformation": data
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
router.post('/user/remove', urlencodedParser, async function (req, res, next) {
    let Id  =  req.body._id;

    console.log(Id);

    let collection = await informationDB.getCollection("ADMINISTORATOR");
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


// 批量删除用户 
router.post('/user/batchremove', urlencodedParser, async function (req, res, next) {
    let Ids  =  req.body.ids;
    var Idsarray = Ids.split(",");
    console.log(Idsarray);

    let collection = await informationDB.getCollection("ADMINISTORATOR");

    collection.remove({_id: {"$in": ObjectID(Idsarray)}},function () {
        res.status(200).json({ "msg": "delete success" });
        });

});

// 获取商品信息
router.get('/model/listpage', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("ADMINISTORATOR");
    let page = parseInt(params.page);
    collection.find().sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
        // console.log(data);
        let total =  collection.find().count();
        res.status(200).json({
            "total": total.toString(),
            "models": data
        });
    });
});


// 删除商品
router.post('/model/remove', urlencodedParser, async function (req, res, next) {
    let Id  =  req.body._id;

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
router.post('/model/batchremove', urlencodedParser, async function (req, res, next) {
    let Ids  =  req.body.ids;
    var Idsarray = Ids.split(",");
    console.log(Idsarray);

    let collection = await informationDB.getCollection("SHOP");

    collection.remove({_id: {"$in": ObjectID(Idsarray)}},function () {
        res.status(200).json({ "msg": "delete success" });
        });

});

// 获取核销商品信息
router.get('/model/confirmlistpage', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("ADMINISTORATOR");
    let page = parseInt(params.page);
    collection.find({status: "0"}).sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
        // console.log(data);
        let total =  collection.find({status: "0"}).count();
        res.status(200).json({
            "total": total.toString(),
            "models": data
        });
    });
});


//核销商品
router.post('/model/confirm', urlencodedParser, async function (req, res, next) {
    let orderNumber = req.id;
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
                status: "1"
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