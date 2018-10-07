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
        collection.find().sort(['_id', 1]).skip(params.page*10).limit(10).toArray(function (err, data) {
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
        price: req.body.price,
        number: req.body.number
    }

    console.log(good);

    if (good.describe == 'AddGood') {
        let collection = await informationDB.getCollection("SHOP");
        collection.insertOne({
            name: good.name,
            content: good.content,
            poster: good.poster,
            price: good.price,
            number: good.number
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
        price: req.body.price,
        number: req.body.number
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
                        price: good.price,
                        number: req.body.number
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

// 购买商品
router.post('/shop/buy', urlencodedParser, async function (req, res, next) {
    let confirm = {
		id: req.body.id,
        modelId: req.body.modelId,
        buyNumber: req.body.buyNumber,
        price: req.body.price,
        reMarks: req.body.reMarks
    }

    console.log(confirm);


    var orderNumber="";  //订单号
    for(var i=0;i<6;i++) //6位随机数，用以加在时间戳后面。
    {
        orderNumber += Math.floor(Math.random()*10);
    }
    orderNumber = new Date().getTime() + orderNumber;  //时间戳，用来生成订单号。

    let shopCollection = await informationDB.getCollection("SHOP");
    let confirmCollection = await informationDB.getCollection("CONFIRMLIST");

    shopCollection.findOne({ _id: ObjectID(confirm.modelId) }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
            confirmCollection.insertOne({
                orderNumber: orderNumber,
                buyer: confirm.buyer,
                modelId: confirm.modelId,
                modelName: data.name,
                buyNumber: confirm.buyNumber,
                price: confirm.price,
                reMarks: confirm.reMarks,
                orderTime: getDate(),
                status: "0"
            }, function () {
                shopCollection.save({
                    _id: ObjectID(data.goodId),
                    name: data.name,
                    content: data.content,
                    poster: data.poster,
                    price: data.price,
                    number: String(parseInt(data.body.number)-parseInt(buyNumber))
                },function () {
                    res.status(200).json({ "code": "1" })
                });
            })
		}
	});


});

function getDate(){
	nowDate = new Date();
	nowDateArray = {
		year: nowDate.getFullYear(),
		month: nowDate.getMonth()+1,
		day: nowDate.getDate(),
		hour: nowDate.getHours(),
		minutes: nowDate.getMinutes(),
		second: nowDate.getSeconds()
	}

    return nowDateArray ;
}

module.exports = router;
