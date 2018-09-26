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

    db.collection.find({"userid":{"$in":["297","495"]}})

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



module.exports = router;