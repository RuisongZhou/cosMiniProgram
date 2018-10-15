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
        collection.find({shopKind: params.shopKind}).sort(['_id', 1]).toArray(function (err, data) {
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

//根据id获取商品信息
router.get('/shop/getById', urlencodedParser, async function (req, res, next) {
	let params = req.query;
    console.log(params);
    let collection = await informationDB.getCollection("SHOP");
	if (params.describe == 'getGoods') {
        collection.find({_id: ObjectID(params.id)}).sort(['_id', 1]).toArray(function (err, data) {
            // console.log(data);
			res.status(200).json({
				"good": data[0]
			});
        });
	}
	else {
		res.status(400).json({ "code": "-1" });
	}
});

//根据账户id获取商品信息
router.get('/user/model', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("SHOP");
    let confirmCollection = await informationDB.getCollection("CONFIRMLIST");
    collection.find({ poster: params.id }).sort(['_id', 1]).toArray(function (err, data) {
		if (data) {
            confirmCollection.find({ "model.poster": params.id }).sort(['_id', 1]).toArray(function (err, confirmData) {
				if (!confirmData) {
					res.status(400).json({ "code": "-1" })
				} else {
					res.status(200).json({
                        "model": data,
                        "confirm": confirmData
					});
				}
			});
		}
		else {
			res.status(400).json({ "code": "-1" })
		}

	});
});


// 获取个人核销商品信息
router.get('/shop/confirmlist', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("CONFIRMLIST");
    collection.find({buyer: params.id}).sort(['_id', 1]).toArray(function (err, data) {
        res.status(200).json({
            "total": data.length,
            "models": data
        });
    });
});


//增加商品
router.post('/shop/add', urlencodedParser, async function (req, res, next) {
    let good = {
		describe: req.body.describe,
        name: req.body.name,
        content: req.body.content,
        poster: req.body.poster,
        price: req.body.price,
        number: req.body.number,
        picture: req.body.picture,
        shopKind: req.body.shopKind,
        nickName: req.body.nickName,
        feature: req.body.feature
    }

    console.log(good);

    if (good.describe == 'AddGood') {
        let collection = await informationDB.getCollection("SHOP");
        collection.insertOne({
            name: good.name,
            content: good.content,
            poster: good.poster,
            price: good.price,
            number: good.number,
            picture: good.picture,
            shopKind: good.shopKind,
            nickName: good.nickName,
            feature: good.feature,
            time: getDate()
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
        number: req.body.number,
        picture: req.body.picture,
        shopKind: req.body.shopKind,
        nickName: req.body.nickName,
        feature: req.body.feature
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
                        number: good.number,
                        picture: good.picture,
                        shopKind: good.shopKind,
                        nickName: good.nickName,
                        time: data.time,
                        feature: good.feature
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
        buyer: req.body.buyer,
        buyerName: req.body.buyerName,
        modelId: req.body.modelId,
        buyNumber: req.body.buyNumber,
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
    let collection = await informationDB.getCollection("ACCOUNT");
    let adminCollection = await informationDB.getCollection("ADMINISTORATOR");
    let newsCollection = await informationDB.getCollection("NEWS");

    
    shopCollection.findOne({ _id: ObjectID(confirm.modelId) }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
            console.log(data)
            //发送消息
            accountCollection.findOne({ id: confirm.buyer }, function (err, userData) {
                if (!userData) {
                    res.status(200).json({ "code": "-1" , "msg": "查无此人"});
                }
                else {
                    newsCollection.insertOne({
                        toId: data.poster,
                        poster: userData,
                        read: "0",
                        option: "购买商品",
                        content: "购买商品",
                        time: getDate()
                    }, function () {
                        res.status(200).json({ "code": "1" });
                    })
                }
            })

            if (data.shopKind == "0") {
                adminCollection.findOne({ username: data.poster }, function (err, posterData) {
                    console.log(posterData)

                    confirmCollection.insertOne({
                        orderNumber: orderNumber,
                        buyer: confirm.buyer,
                        buyerName: confirm.buyerName, 
                        modelId: confirm.modelId,
                        buyNumber: confirm.buyNumber,
                        reMarks: confirm.reMarks,
                        orderTime: getDate(),
                        status: "0",
                        model: {
                            posterName:posterData.name,
                            poster: data.poster,
                            modelName: data.name,                                                                                      
                            content: data.content,                          
                            price: data.price,
                            picture: data.picture
                        }
                    }, function () {
                        // console.log(data)
                        collection.findOne({ id: confirm.buyer }, function (err, buyerdata) {
                            if (!data) {
                                res.status(400).json({ "code": "-1" })
                            } else {
                                let buyer = {
                                    _id: buyerdata._id,
                                    id: buyerdata.id,
                                    nickName: buyerdata.nickName,
                                    name: buyerdata.name,
                                    gender: buyerdata.gender,
                                    access: buyerdata.access,
                                    headimg: buyerdata.headimg,
                                    tel: buyerdata.tel,
                                    college: buyerdata.college,
                                    scores: buyerdata.scores
                                }
        
                                let m_score = parseInt(buyer.scores) - parseInt(data.price*confirm.buyNumber);
                                console.log(data.number,confirm.buyNumber)
                                if (m_score < 0) {
                                    res.status(200).json({ "msg": "买不起" })
                                }
                                else if (parseInt(data.number) < parseInt(confirm.buyNumber)) {
                                    res.status(200).json({ "msg": "没这么多" })
                                }
                                else {
                                    shopCollection.save({
                                        _id: ObjectID(data._id),
                                        name: data.name,
                                        content: data.content,
                                        poster: data.poster,
                                        price: data.price,
                                        number: String(parseInt(data.number)-parseInt(confirm.buyNumber)),
                                        picture: data.picture,
                                        shopKind: data.shopKind,
                                        nickName: data.nickName,
                                        feature: data.feature
                                    },function () {
                                        buyer.scores = String(m_score);
                                        collection.save({
                                            _id: ObjectID(buyer._id),
                                            id: buyer.id,
                                            nickName: buyer.nickName,
                                            name: buyer.name,
                                            gender: buyer.gender,
                                            access: buyer.access,
                                            headimg: buyer.headimg,
                                            tel: buyer.tel,
                                            college: buyer.college,
                                            scores: buyer.scores
                                        }, function () {
                                            if (data.shopKind == 1) {
                                                collection.findOne({ id: data.poster }, function (err, modelKeeperlData) {
                                                    if (!modelKeeperlData) {
                                                        res.status(400).json({ "code": "-1" })
                                                    } else {
                                                        let modelKeeper = {
                                                            _id: modelKeeperlData._id,
                                                            id: modelKeeperlData.id,
                                                            nickName: modelKeeperlData.nickName,
                                                            name: modelKeeperlData.name,
                                                            gender: buyerdata.gender,
                                                            access: modelKeeperlData.access,
                                                            headimg: modelKeeperlData.headimg,
                                                            tel: modelKeeperlData.tel,
                                                            college: modelKeeperlData.college,
                                                            scores: modelKeeperlData.scores
                                                        }
                                
                                                        let m_score = parseInt(modelKeeper.scores) + parseInt(data.price*confirm.buyNumber);
                                                        modelKeeper.scores = String(m_score);
                                                        collection.save({
                                                            _id: ObjectID(modelKeeperlData._id),
                                                            id: modelKeeperlData.id,
                                                            nickName: modelKeeperlData.nickName,
                                                            name: modelKeeperlData.name,
                                                            gender: buyerdata.gender,
                                                            access: modelKeeperlData.access,
                                                            headimg: modelKeeperlData.headimg,
                                                            tel: modelKeeperlData.tel,
                                                            college: modelKeeperlData.college,
                                                            scores: modelKeeperlData.scores
                                                        }, function () {
                                                            res.status(200).json({ "code": "1", "orderNumber": orderNumber })
                                                        })
                                                    }
                                                })
                                            }
                                            else {
                                                res.status(200).json({ "code": "1", "orderNumber": orderNumber })
                                            }
                                        });
                                    });
                                }
        
                            }
                        });
        
                    })
                })
            }
            else {
                collection.findOne({ id: data.poster }, function (err, posterData) {
                    console.log(posterData)
                    confirmCollection.insertOne({
                        orderNumber: orderNumber,
                        buyer: confirm.buyer,
                        buyerName: confirm.buyerName, 
                        modelId: confirm.modelId,
                        buyNumber: confirm.buyNumber,
                        reMarks: confirm.reMarks,
                        orderTime: getDate(),
                        status: "0",
                        model: {
                            posterName:posterData.name,
                            poster: data.poster,
                            modelName: data.name,                                                                                      
                            content: data.content,                          
                            price: data.price,
                            picture: data.picture
                        }
                    }, function () {
                        // console.log(data)
                        collection.findOne({ id: confirm.buyer }, function (err, buyerdata) {
                            if (!data) {
                                res.status(400).json({ "code": "-1" })
                            } else {
                                let buyer = {
                                    _id: buyerdata._id,
                                    id: buyerdata.id,
                                    nickName: buyerdata.nickName,
                                    name: buyerdata.name,
                                    gender: buyerdata.gender,
                                    access: buyerdata.access,
                                    headimg: buyerdata.headimg,
                                    tel: buyerdata.tel,
                                    college: buyerdata.college,
                                    scores: buyerdata.scores
                                }
        
                                let m_score = parseInt(buyer.scores) - parseInt(data.price*confirm.buyNumber);
                                console.log(data.number,confirm.buyNumber)
                                if (m_score < 0) {
                                    res.status(200).json({ "msg": "买不起" })
                                }
                                else if (parseInt(data.number) < parseInt(confirm.buyNumber)) {
                                    res.status(200).json({ "msg": "没这么多" })
                                }
                                else {
                                    shopCollection.save({
                                        _id: ObjectID(data._id),
                                        name: data.name,
                                        content: data.content,
                                        poster: data.poster,
                                        price: data.price,
                                        number: String(parseInt(data.number)-parseInt(confirm.buyNumber)),
                                        picture: data.picture,
                                        shopKind: data.shopKind,
                                        nickName: data.nickName,
                                        feature: data.feature
                                    },function () {
                                        buyer.scores = String(m_score);
                                        collection.save({
                                            _id: ObjectID(buyer._id),
                                            id: buyer.id,
                                            nickName: buyer.nickName,
                                            name: buyer.name,
                                            gender: buyer.gender,
                                            access: buyer.access,
                                            headimg: buyer.headimg,
                                            tel: buyer.tel,
                                            college: buyer.college,
                                            scores: buyer.scores
                                        }, function () {
                                            if (data.shopKind == 1) {
                                                collection.findOne({ id: data.poster }, function (err, modelKeeperlData) {
                                                    if (!modelKeeperlData) {
                                                        res.status(400).json({ "code": "-1" })
                                                    } else {
                                                        let modelKeeper = {
                                                            _id: modelKeeperlData._id,
                                                            id: modelKeeperlData.id,
                                                            nickName: modelKeeperlData.nickName,
                                                            name: modelKeeperlData.name,
                                                            gender: buyerdata.gender,
                                                            access: modelKeeperlData.access,
                                                            headimg: modelKeeperlData.headimg,
                                                            tel: modelKeeperlData.tel,
                                                            college: modelKeeperlData.college,
                                                            scores: modelKeeperlData.scores
                                                        }
                                
                                                        let m_score = parseInt(modelKeeper.scores) + parseInt(data.price*confirm.buyNumber);
                                                        modelKeeper.scores = String(m_score);
                                                        collection.save({
                                                            _id: ObjectID(modelKeeperlData._id),
                                                            id: modelKeeperlData.id,
                                                            nickName: modelKeeperlData.nickName,
                                                            name: modelKeeperlData.name,
                                                            gender: buyerdata.gender,
                                                            access: modelKeeperlData.access,
                                                            headimg: modelKeeperlData.headimg,
                                                            tel: modelKeeperlData.tel,
                                                            college: modelKeeperlData.college,
                                                            scores: modelKeeperlData.scores
                                                        }, function () {
                                                            res.status(200).json({ "code": "1", "orderNumber": orderNumber })
                                                        })
                                                    }
                                                })
                                            }
                                            else {
                                                res.status(200).json({ "code": "1", "orderNumber": orderNumber })
                                            }
                                        });
                                    });
                                }
        
                            }
                        });
        
                    })
                })
            }
		}
	});

});

// 获取个人核销商品信息
router.get('/shop/confirm', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("ADMINISTORATOR");
    collection.find({buyer: params.id}).sort(['_id', 1]).toArray(function (err, data) {
        // console.log(data);
        res.status(200).json({
            "total": data.length,
            "models": data
        });
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
