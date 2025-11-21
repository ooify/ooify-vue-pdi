import request from '@/utils/request'

// 查询报告生成任务列表
export function listTask(query) {
    return request({
        url: '/user/pdi/doc/list',
        method: 'get',
        params: query,
    })
}

// 查询报告生成任务详细
export function getTask(id) {
    return request({
        url: '/user/pdi/doc/' + id,
        method: 'get',
    })
}

// 删除报告生成任务
export function delTask(id) {
    return request({
        url: '/user/pdi/doc/' + id,
        method: 'delete',
    })
}

// 生成报告
export function generateReport(ids) {
    return request({
        url: '/user/pdi/doc/generate/' + ids,
        method: 'post',
    })
}
