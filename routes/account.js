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
router.get('/account', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("ACCOUNT");
	let scoresCollection = await informationDB.getCollection("SCORES");
	collection.findOne({ id: params.id }, function (err, data) {
		if (data) {
			scoresCollection.findOne({ id: params.id }, function (err, scoresData) {
				if (!scoresData) {
					res.status(400).json({ "code": "-1" })
				} else {
					res.status(200).json({
						_id: data._id,
						id: data.id,
						nickName: data.nickName,
						name: data.name,
						gender: data.gender,
						access: data.access,
						headimg: data.headimg,
						tel: data.tel,
						college: data.college,
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

//根据账户昵称获取账户id
router.get('/account/id', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	let collection = await informationDB.getCollection("ACCOUNT");
	collection.findOne({ name: params.name }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			res.status(200).json({
				id: data.id
			});
		}
	});
});

//申请时发送账户信息
router.post('/account', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在UsearData中
	let UsearData = {
		id: req.body.id,
		nickName: req.body.nickName,
		name: req.body.name,
		gender: req.body.gender,
		headimg: req.body.headimg,
		tel: req.body.tel,
		college: req.body.college,
		access: 0
	}

	//开始初始化数据库
	let status = 0;
	let accountCollection = await informationDB.getCollection("ACCOUNT");
	//初始化账户表
	accountCollection.findOne({ id: UsearData.id }, function (err, data) {
		if (!data) {
			accountCollection.insertOne({
				id: UsearData.id,
				nickName: UsearData.nickName,
				name: UsearData.name,
				gender: UsearData.gender,
				headimg: UsearData.headimg,
				tel: UsearData.tel,
				college: UsearData.college,
				access: UsearData.access
			}, function () {
				status = 0;
			})
		}
		else {
			status = -1;
		}
	});

	let scoresCollection = await informationDB.getCollection("SCORES");
	//初始化积分表
	scoresCollection.findOne({ id: UsearData.id }, function (err, data) {
		if (!data) {
			scoresCollection.insertOne({
				id: UsearData.id,
				scores: "0"
			}, function () {
				status = 0;
			})
		}
		else {
			status = -1;
		}
	});

	let signsCollection = await informationDB.getCollection("SIGN");
	//初始化签到表
	signsCollection.findOne({ id: UsearData.id }, function (err, data) {
		if (!data) {
			signsCollection.insertOne({
				id: UsearData.id,
				lastSignTime: "",
				signNumber: "0",
				serialSignNumber: "0"
			}, function () {
				status = 0;
			})
		}
		else {
			status = -1;
		}
	});

	//判断是否初始化成功
	if (status != -1) {
		res.status(200).json({ "code": "1" });
	}
	else {
		res.status(400).json({ "code": "-1" });
	}


});

//根据账户id获取积分
router.get('/account/scores', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	let collection = await informationDB.getCollection("SCORES");
	collection.findOne({ id: params.id }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			res.status(200).json({
				scores: data.scores
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