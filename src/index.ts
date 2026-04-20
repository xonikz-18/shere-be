import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors';
import registerRoute from './routes/register.route.js';
import loginRoute from './routes/login.route.js';
import postRoute from './routes/post.route.js';
import borrowRequestRoute from './routes/borrow-request.route.js';
import messageRoute from './routes/message.route.js';
import authRoute from './routes/auth.route.js';
import otpRoute from './routes/otp.route.js';
import { serveStatic } from '@hono/node-server/serve-static';


const app = new Hono()

app.use('*', cors({ origin: 'http://localhost:4200' }))

app.get('/', (c) => c.text('Hello Hono!'))

app.route('/auth', registerRoute)
app.route('/auth', loginRoute)
app.route('/api', postRoute)
app.route('/api', borrowRequestRoute)
app.route('/api', messageRoute)
app.route('/auth', authRoute);
app.route('/api/otp', otpRoute) 
app.use('/uploads/*', serveStatic({ root: './' }));
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})