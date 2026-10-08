import { r as createServerFn } from "./ssr.mjs";
import { m as createSsrRpc } from "./router-BxAYLhzp.mjs";
import { t as authMiddleware } from "./middleware-B5sin_vG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/qr-CcMR0d0O.js
var getProfile = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("04ec46f9c4e2356ef006105c81943d5f48ecc36864fd2ce3aa7c1ff9c675d013"));
var setPlan = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((plan) => plan).handler(createSsrRpc("613ae678b55634561d7171caeb4e49fdbdfbb9c5e4ef36e0751c8124cd9d616c"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("8d169fb410cae7f2556332b1068b2753247b017b10b9c2ad22e0f8498cde0c3a"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("93aadd82ebfd397bbc3e2c4878394e3b955e49db57c3bcdb8676cfbff1652617"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((name) => name.trim().slice(0, 60)).handler(createSsrRpc("8436fefec38152b20d2fa983723ee8301db72c486a1cde1ae633c63a9030c1b8"));
var saveQr = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("69ac40502483d8fa594411482ac993f050434831561e3f80607efb1868698a02"));
var listQr = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("0884078335048c21f45dd91d4dda22216428e2fb7660667c0dd2504e53349ed7"));
var getQr = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("a8f78243e4efe0a9217859355c82e06ade5d05c4019104f0ba8ecb29f49c0164"));
var duplicateQr = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("e06460425098ee95706f378708c5d309bc417a37d3c98c812e05578698777a27"));
var setQrActive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("ecfe062b72c7542c7c9dca22b931be1fec90ba9c537c82986007d7a7e5d90eda"));
var deleteQr = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("d5c23a631e044e0016516377106a2ec2d804bc9c8ecf8a89c5fe5a5413a0618e"));
var getQrStats = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("e73d24ba969937d6754e228505af5f8a01a4774c2ed85d62ec6abbde15468b37"));
//#endregion
export { getQrStats as a, setPlan as c, getQr as i, setQrActive as l, duplicateQr as n, listQr as o, getProfile as r, saveQr as s, deleteQr as t };
