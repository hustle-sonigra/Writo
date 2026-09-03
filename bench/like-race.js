import http from 'k6/http';
import { check } from 'k6';

const TOKENS = JSON.parse(open('./tokens.json'));

export const options = {
  scenarios: {
    likes: {
      executor: 'per-vu-iterations',
      vus: __ENV.VUS ? parseInt(__ENV.VUS) : 50,
      iterations: 1,
      maxDuration: '30s',
    },
  },
};

export default function () {
  const res = http.post(`${__ENV.BASE}/post/${__ENV.POST_ID}/like`, null, {
    headers: { Cookie: `token=${TOKENS[__VU - 1]}` },
    redirects: 0,
  });
  check(res, { 'got 302': (r) => r.status === 302 });
}
