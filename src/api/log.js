import request from '@/utils/request'

export function fetchFields(dateStr) {
  return request({
    baseURL: 'http://127.0.0.1:3001/api/',
    url: `/auto_log/${dateStr}/mappings`,
    method: 'get'
  })
}

export function fetchHits(dateStr, params = {}, data = {}) {
  return request({
    baseURL: 'http://127.0.0.1:3001/api/',
    url: `/auto_log/${dateStr}/hits`,
    method: 'post',
    params: params,
    data
  })
}
