const {createClient} = require('redis')

const redisClient = createClient({
    username: 'default',
    password: 'V4sQUJI9hlRZbKGRC2o9kBBpXu9N9MhN',
    socket: {
        host: 'redis-11322.crce281.ap-south-1-3.ec2.cloud.redislabs.com',
        port: 11322
    }
});

module.exports = redisClient;

// redisClient.js
// const { createClient } = require('redis');

// const redisClient = createClient({
//     url: process.env.REDIS_URL, // use env (IMPORTANT)
//     socket: {
//         reconnectStrategy: (retries) => {
//             console.log('Retrying Redis...', retries);
//             return Math.min(retries * 100, 3000);
//         }
//     }
// });

// // ✅ prevent crash
// redisClient.on('error', (err) => {
//     console.error('Redis Error:', err.message);
// });

// redisClient.on('connect', () => console.log('Redis connected'));

// module.exports = redisClient;