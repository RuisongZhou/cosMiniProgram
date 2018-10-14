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


//增加悬赏
router.post('/reward/add', urlencodedParser, async function (req, res, next) {
    let reward = {
        posterId: req.body.posterId,
        level: req.body.level,
        theme: req.body.theme,
        content: req.body.content,
        price: req.body.price,
        picture: req.body.picture,
        ddl: req.body.ddl
    }

    console.log(reward);

    let collection = await informationDB.getCollection("REWARD");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    
    accountCollection.findOne({ _id: reward.posterId }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "1" ,"msg": "没有此用户"});
        }
        else {
            collection.insertOne({
                poster: data,
                level: reward.level,
                theme: reward.theme,
                content: reward.content,
                price: reward.price,
                picture: reward.picture,
                ddl: reward.ddl,
                status: "0",
                completed: "0",
                time: getDate()
            }, function () {
                res.status(200).json({ "code": "1" });
            })
        }
    })

});

//增加悬赏
router.post('/reward/pick', urlencodedParser, async function (req, res, next) {
    let rewardPick = {
        pickerId: req.body.pickerId,
        rewardId: req.body.rewardId
    }

    console.log(rewardPick);

    let collection = await informationDB.getCollection("REWARDCONFIRM");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    
    accountCollection.findOne({ _id: reward.pickerId }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "1" ,"msg": "没有此用户"});
        }
        else {
            collection.insertOne({
                poster: data,
                level: reward.level,
                theme: reward.theme,
                content: reward.content,
                price: reward.price,
                picture: reward.picture,
                ddl: reward.ddl,
                status: "0",
                completed: "0",
                time: getDate()
            }, function () {
                res.status(200).json({ "code": "1" });
            })
        }
    })

});
module.exports = router;