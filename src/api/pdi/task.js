import request from '@/utils/request'

// 查询报告生成任务列表
export function listTask(query) {
  return request({
    url: '/pdi/task/list',
    method: 'get',
    params: query
  })
}

// 查询报告生成任务详细
export function getTask(id) {
  return request({
    url: '/pdi/task/' + id,
    method: 'get'
  })
}

// 新增报告生成任务
export function addTask(data) {
  return request({
    url: '/pdi/task',
    method: 'post',
    data: data
  })
}

// 修改报告生成任务
export function updateTask(data) {
  return request({
    url: '/pdi/task',
    method: 'put',
    data: data
  })
}

// 删除报告生成任务
export function delTask(id) {
  return request({
    url: '/pdi/task/' + id,
    method: 'delete'
  })
}
