
# SQLChop http proxy

This project provide a [HTTP reverse proxy](https://en.wikipedia.org/wiki/Reverse_proxy) with [SQLChop](http://sqlchop.chaitin.com) inside.

It is also an example project to demonstrate how to use SQLChop to intercept SQL injection attack and let go all requests that is normal.

这个一个 [HTTP 反向代理](https://en.wikipedia.org/wiki/Reverse_proxy)，它内置了 [SQLChop](http://sqlchop.chaitin.com) 作为 SQL 注入检测模块，可以拦截 SQL 注入流量而放行正常流量。

## Build

```bash
$ git clone git@github.com:chaitin/sqlchop-http-proxy.git
$ cd sqlchop-http-proxy
$ npm install
```

## Usage

```bash
$ npm start http://${your_upstream_server}
```

