const SERVICE_WORKER_FILE_PATH = './sw.js';

export function notificationUnsupported(): boolean {
  let unsupported = false;
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('showNotification' in ServiceWorkerRegistration.prototype)
  ) {
    unsupported = true;
  }
  return unsupported;
}

export function checkPermissionStateAndAct(
  onSubscribe: (subs: PushSubscription | null) => void,
): void {
  const state: NotificationPermission = Notification.permission;
  switch (state) {
    case 'denied':
      break;
    case 'granted':
      registerAndSubscribe(onSubscribe);
      break;
    case 'default':
      break;
  }
}

async function subscribe(onSubscribe: (subs: PushSubscription | null) => void): Promise<void> {
  navigator.serviceWorker.ready
    .then((registration: ServiceWorkerRegistration) => {
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          'BETvXTi2xVhQSj2lWNPuci7q57GTCgxwQMlJBpsG3EH-TsQHMnNpKd3NkVtR1Mu9tOIN_lBYhNM1gT8BgDPQUnY',
      });
    })
    .then((subscription: PushSubscription) => {
      console.info('Created subscription Object: ', subscription.toJSON());
      submitSubscription(subscription).then(_ => {
        onSubscribe(subscription);
      });
    })
    .catch(e => {
      console.error('Failed to subscribe cause of: ', e);
    });
}

async function submitSubscription(subscription: PushSubscription): Promise<void> {
  const endpointUrl = '/api/web-push/subscription';
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscription }),
  });
  const result = await res.json();
  console.log(result);
}

export async function registerAndSubscribe(
  onSubscribe: (subs: PushSubscription | null) => void,
): Promise<void> {
  try {
    await navigator.serviceWorker.register(SERVICE_WORKER_FILE_PATH);
    await subscribe(onSubscribe);
  } catch (e) {
    console.error('Failed to register service-worker: ', e);
  }
}

export async function sendWebPush(message: string | null): Promise<void> {
  const endPointUrl = '/api/web-push/send';
  const pushBody = {
    title: 'Test Push',
    body: message ?? 'This is a test push message',
    image: '',
    icon: '',
    url: 'https://google.com',
  };
  const res = await fetch(endPointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pushBody),
  });
  const result = await res.json();
  console.log(result);
}

export async function unsubscribe(onUnsubscribe?: () => void): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Отписка от подписки
      await subscription.unsubscribe();
      console.info('Unsubscribed successfully:', subscription.toJSON());

      // Удаление подписки с сервера (если нужно)
      await removeSubscription(subscription);

      // Вызов коллбэка для действий после отписки
      onUnsubscribe && onUnsubscribe();
    } else {
      console.warn('No subscription found to unsubscribe');
    }
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
  }
}

async function removeSubscription(subscription: PushSubscription): Promise<void> {
  const endpointUrl = '/api/web-push/remove-subscription';
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subscription }),
  });

  const result = await res.json();
  console.log(result);
}
