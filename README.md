#　动漫社微信小程序开发后台

## How to Use

- npm install
- npm start

## How to Modify

- 开启端口请在/bin/www中修改,将"xxxx"修改所需端口即可.

```js
var port = normalizePort(process.env.PORT || 'xxxx');
app.set('port', port);
```

- 数据库端口和相关设定位于/configs/config_set.json

```json
{
    "DATABASE_URL": "mongodb://localhost:27017",
    "DATABASE_NAME": "WWeChat",
}
```

- 数据库配置在mongo.conf文件配置