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

// 修改管道视频
export function updateVideo(data) {
    return request({
        url: '/user/pdi/video',
        method: 'put',
        data: data,
    })
}

// 删除管道视频
export function delVideo(id) {
    return request({
        url: '/user/pdi/video/' + id,
        method: 'delete',
    })
}
