
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const Koa = require('koa');
const logger = require('koa-logger');
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');
const koaRequest = require('koa-http-request');
const cors = require('@koa/cors');
const app = new Koa();

app.use(bodyParser());
app.use(cors());
app.use(koaRequest({
  dataType: 'json'
}));

app.use(async(ctx, next) => next().catch((err) => {
  if (err.status === 401) {
    ctx.status = 401;
    const errMessage = err.originalError
      ? err.originalError.message
      : err.message;
    ctx.body = {
      error: errMessage
    };
    ctx.set('X-Status-Reason', errMessage);
  } else {
    throw err;
  }
}));

// Logger
app.use(async(ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

if (process.env.NODE_ENV !== 'test') {
  app.use(logger());
}

router.get('/bitso/:id', async(ctx) => {
  const bitso = await ctx.get(`https://api.bitso.com/v3/ticker/?book=${ctx.params.id}_mxn`, null, {
    'User-Agent': 'koa-http-request'
  });
  ctx.body = bitso;
});
router.get('/coinlore/:id', async(ctx) => {
  const getId = id => {
    switch (id) {
      case 'btc':
        return 90;
      case 'eth':
        return 80;
      case 'xrp':
        return 58;
      default:
        return 90;
    }
  };
  const coinlore = await ctx.get(`https://api.coinlore.com/api/ticker/?id=${getId(ctx.params.id)}`, null, {
    'User-Agent': 'koa-http-request'
  });
  ctx.body = coinlore;
});
router.get('/coincap/:id', async(ctx) => {
  const coincap = await ctx.get('https://api.coincap.io/v2/markets', null, {
    'User-Agent': 'koa-http-request'
  });
  const data = coincap.data.filter(item => ctx.params.id.toUpperCase() === item.baseSymbol && item.exchangeId === 'acx');
  ctx.body = data;
});

app.use(router.routes());
app.use(router.allowedMethods());

module.exports = app;
