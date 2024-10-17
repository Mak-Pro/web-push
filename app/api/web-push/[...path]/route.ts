import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:maksprocode@gmail.com',
  'BETvXTi2xVhQSj2lWNPuci7q57GTCgxwQMlJBpsG3EH-TsQHMnNpKd3NkVtR1Mu9tOIN_lBYhNM1gT8BgDPQUnY',
  'bPW9F-sTwjvtfPKpcDcPWF29HOquHo9oeeEWOhtN8es',
);
let subscription: PushSubscription;

export async function POST(request: any) {
  const { pathname } = new URL(request.url);
  switch (pathname) {
    case '/api/web-push/subscription':
      return setSubscription(request);
    case '/api/web-push/send':
      return sendPush(request);
    default:
      return notFoundApi();
  }
}

async function setSubscription(request: any) {
  const body: { subscription: PushSubscription } = await request.json();
  subscription = body.subscription;
  return new Response(JSON.stringify({ message: 'Subscription set.' }), {});
}

async function sendPush(request: any) {
  console.log(subscription, 'subs');
  const body = await request.json();
  const pushPayload = JSON.stringify(body);
  await webpush.sendNotification(subscription as any, pushPayload);
  return new Response(JSON.stringify({ message: 'Push sent.' }), {});
}

async function notFoundApi() {
  return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 404,
  });
}
