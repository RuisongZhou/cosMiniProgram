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

//获取商品信息
router.get('/shop', urlencodedParser, async function (req, res, next) {
	let params = req.query;
    console.log(params);
    let collection = await informationDB.getCollection("SHOP");
	if (params.describe == 'getGoods') {
        collection.find().toArray(function (err, data) {
            // console.log(data);
			res.status(200).json({
				"goods": data
			});
        });
	}
	else {
		res.status(400).json({ "code": "-1" });
	}
});

//增加商品
router.post('/shop/add', urlencodedParser, async function (req, res, next) {
    let good = {
		describe: req.body.describe,
		id: req.body.id,
        name: req.body.name,
        content: req.body.content,
        poster: req.body.poster,
        price: req.body.price
    }

    console.log(good);

    if (good.describe == 'AddGood') {
        let collection = await informationDB.getCollection("SHOP");
        collection.insertOne({
            name: good.name,
            content: good.content,
            poster: good.poster,
            price: good.price,
        }, function () {
            res.status(200).json({ "code": "1" });
        })
    }
    else {
        res.status(400).json({ "code": "-1" });
    }
});

//删除商品
router.post('/shop/delete', urlencodedParser, async function (req, res, next) {
    let good = {
		describe: req.body.describe,
		id: req.body.id,
        goodId: req.body.goodId
    }
    console.log(good);

    if (good.describe == 'DeleteGood') {
        let collection = await informationDB.getCollection("SHOP");
        collection.findOne({ _id: ObjectID(good.goodId) }, function (err, data) {
            if (!data) {
                res.status(400).json({ "code": "-1" })
            } else {
                if (good.id != data.poster) {
                    res.status(200).json({ "code": "-2" })
                }
                else {
                    collection.remove({_id: ObjectID(good.goodId), poster: good.id},function () {
                        res.status(200).json({ "code": "1" });
                     })
                }
            }
        });
    }
    else {
        res.status(400).json({ "code": "-1" });
    }
});

//修改商品信息
router.post('/shop/change', urlencodedParser, async function (req, res, next) {
    let good = {
		describe: req.body.describe,
        goodId: req.body.goodId,
        name: req.body.name,
        content: req.body.content,
        poster: req.body.poster,
        price: req.body.price
    }

    if (good.describe == 'ChangeGood') {
        let collection = await informationDB.getCollection("SHOP");
        collection.findOne({ _id: ObjectID(good.goodId) }, function (err, data) {
            if (!data) {
                res.status(400).json({ "code": "-1" })
            } else {
                if (good.poster != data.poster) {
                    res.status(200).json({ "code": "-2" })
                }
                else {
                    collection.save({
                        _id: ObjectID(good.goodId),
                        name: good.name,
                        content: good.content,
                        poster: good.poster,
                        price: good.price
                    },function () {
                        res.status(200).json({ "code": "1" })
                    });
                }
            }
        });
    }
    else {
        res.status(400).json({ "code": "-1" });
    }
});

function getNowFormatDate() {
	var date = new Date();
	var seperator1 = "-";
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var strDate = date.getDate();
	if (month >= 1 && month <= 9) {
		month = "0" + month;
	}
	if (strDate >= 0 && strDate <= 9) {
		strDate = "0" + strDate;
	}
	var currentdate = year + seperator1 + month + seperator1 + strDate;
	return currentdate;
}
module.exports = router;
