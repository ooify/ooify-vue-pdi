import request from '@/utils/request'

// 查询管道视频列表
export function listVideo(query) {
    return request({
        url: '/user/pdi/video/list',
        method: 'get',
        params: query,
    })
}

// 查询管道视频详细
export function getVideo(id) {
    return request({
        url: '/user/pdi/video/' + id,
        method: 'get',
    })
}

// 新增管道视频
export function addVideo(data) {
    return request({
        url: '/user/pdi/video',
        method: 'post',
        data: data,
    })
}

// reupload
export function reuploadVideo(id) {
    return request({
        url: '/user/pdi/video/reupload/' + id,
        method: 'post',
    })
}

// 修改管道视频
export function updateVideo(data) {
    return request({
        url: '/user/pdi/video',
        method: 'put',
        data: data,
    })
}

// 确认管道信息
export function confirmPipeInfo(id, pipInfo) {
    return request({
        url: '/user/pdi/video/confirm_pipe_info/' + id,
        method: 'post',
        data: pipInfo
    })
}

// 删除管道视频
export function delVideo(id) {
    return request({
        url: '/user/pdi/video/' + id,
        method: 'delete',
    })
}
