export function getVideoInfo(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video')

        // 处理元数据加载完成
        video.onloadedmetadata = () => {
            // 立即释放对象 URL
            URL.revokeObjectURL(video.src)

            // 计算码率（bps）
            const fileSizeInBits = file.size * 8 // 将字节转换为比特
            const bitrate = fileSizeInBits / video.duration

            resolve({
                duration: video.duration,
                videoName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                // width: video.videoWidth,
                // height: video.videoHeight,
                // bitrate: Math.round(bitrate), // 四舍五入到整数
                resolution: `${video.videoWidth}x${video.videoHeight}`,
            })
        }

        // 处理加载错误
        video.onerror = (error) => {
            URL.revokeObjectURL(video.src)
            reject(new Error('无法加载视频元数据'))
        }

        // 设置视频源
        video.preload = 'metadata'
        video.src = URL.createObjectURL(file)
    })
}
/**
 * 从视频中截取中间一帧，返回 File（image/jpeg）
 */
export function captureMiddleFrame(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.src = URL.createObjectURL(file)
        video.muted = true
        video.playsInline = true

        video.onloadedmetadata = () => {
            const middleTime = video.duration / 2
            video.currentTime = middleTime
        }

        video.onseeked = () => {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            canvas.toBlob(
                (blob) => {
                    const originalName = file.name
                    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) // 去掉扩展名
                    const imageFile = new File([blob], baseName + '_thumbnail.jpg', {
                        type: 'image/jpeg',
                    })
                    URL.revokeObjectURL(video.src)
                    resolve(imageFile)
                },
                'image/jpeg',
                0.8
            )
        }

        video.onerror = (e) => reject(e)
    })
}
