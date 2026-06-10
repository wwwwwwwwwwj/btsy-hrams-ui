import request from '@/utils/request';

export async function pageQueryPerson(params) {
  const res = await request.get('/hrams/query/persons', { params });
  if (res.data.code === 200) {
    return res.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function getQueryPersonDetail(personId) {
  const res = await request.get(`/hrams/query/persons/${personId}`);
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function fulltextSearch(keyword) {
  const res = await request.get('/hrams/search/fulltext', { params: { keyword } });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function reindexFulltext() {
  const res = await request.post('/hrams/search/reindex');
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}

export async function qaChat(question) {
  const res = await request.post('/hrams/qa/chat', { question });
  if (res.data.code === 200) {
    return res.data.data;
  }
  return Promise.reject(new Error(res.data.msg));
}
