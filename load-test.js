import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL || 'http://localhost:3001'}/api/`);

  check(res, {
    'HTTP 200': (r) => r.status === 200,
  });

  sleep(1);
}
