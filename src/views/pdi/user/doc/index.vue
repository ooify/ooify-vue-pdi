<template>
    <div>
        <el-upload
            drag
            list-type="picture"
            :on-progress="uploadVideoProcess"
            :auto-upload="false"
            v-model:file-list="fileList"
            multiple>
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
                Drop file here or
                <em>click to upload</em>
            </div>
            <div class="el-upload__tip">jpg/png files with a size less than 500kb</div>

            <template #tip>
                {{ fileList }}
                <el-button
                    type="primary"
                    :disabled="fileList.length === 0"
                    @click="getPostSignatureInfo">
                    上传到服务器
                </el-button>
            </template>

            <template #file="{ file }">
                <el-progress v-if="file.status === 'uploading'" :percentage="file.percentage" />
                <span v-else>{{ file.name }}</span>
            </template>
        </el-upload>
    </div>
</template>

<script setup>
    import { ref, reactive } from 'vue'
    import { ElMessage } from 'element-plus'
    import { getToken } from '@/utils/auth'
    import { getVideoInfo, captureMiddleFrame } from '@/utils/video-tools'
    const { proxy } = getCurrentInstance()

    const headers = {
        Authorization: 'Bearer ' + getToken(),
    }
    // 上传状态控制
    const videoFlag = ref(false)
    const videoUploadPercent = ref(0)
    const isShowUploadVideo = ref(false)

    // 视频表单数据
    const videoForm = reactive({
        showVideoPath: '',
    })
    const fileList = ref([])

    const getPostSignatureInfo = async () => {
        console.log(fileList.value)
        console.log(fileList.value.length)
        if (fileList.value.length === 0) {
            ElMessage.error('请先选择文件')
            return
        }
        for (const fileItem of fileList.value) {
            const file = fileItem.raw
            console.log(fileItem)
            // 1️⃣ 获取视频信息
            const info = await getVideoInfo(file)
            console.log('视频信息:', info)
            fetch(import.meta.env.VITE_APP_BASE_API + '/user/pdi/video', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + getToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(info),
            })
                .then((response) => {
                    console.log(response)

                    if (!response.ok) {
                        throw new Error('获取签名失败')
                    }
                    return response.json()
                })
                .then((res) => {
                    const data = res.data
                    console.log(data)
                    let formData = new FormData()
                    formData.append('success_action_status', '200')
                    formData.append('policy', data.policy)
                    formData.append('x-oss-signature', data.signature)
                    formData.append('x-oss-signature-version', 'OSS4-HMAC-SHA256')
                    formData.append('x-oss-credential', data.x_oss_credential)
                    formData.append('x-oss-date', data.x_oss_date)
                    const timestamp = Date.now()
                    const fileNameParts = fileItem.name.split('.')
                    const fileExtension = fileNameParts.pop()
                    const fileNameWithoutExtension = fileNameParts.join('.')
                    const newFileName = `${fileNameWithoutExtension}_${timestamp}.${fileExtension}`
                    console.log(data.dir + newFileName)
                    formData.append('key', data.dir + newFileName) // 文件名
                    formData.append('x-oss-security-token', data.security_token)
                    formData.append('callback', data.callback) // 添加回调参数
                    formData.append('Content-Type', file.type)
                    formData.append('file', file) // file 必须为最后一个表单域

                    return fetch(data.host, {
                        method: 'POST',
                        body: formData,
                    })
                })
                .then((response) => {
                    if (response.ok) {
                        console.log(response)
                        if (response.status === 200) {
                            proxy.$modal.msgSuccess('上传成功')
                        } else {
                            proxy.$modal.msgError('上传失败')
                        }
                    } else {
                        console.log(response)
                        proxy.$modal.msgError('上传失败')
                    }
                })
                .catch((error) => {
                    console.log(error)
                    proxy.$modal.msgError('上传失败: ' + error.message)
                })
        }
        fileList.value = []
    }


    // 上传前校验
    const beforeUploadVideo = (file) => {
        const isVideo = [
            'video/mp4',
            'video/ogg',
            'video/flv',
            'video/avi',
            'video/wmv',
            'video/rmvb',
            'video/mov',
        ].includes(file.type)

        if (!isVideo) {
            ElMessage.error('请上传正确的视频格式')
            return false
        }

        const isLt500M = file.size / 1024 / 1024 < 500
        if (!isLt500M) {
            ElMessage.error('视频大小不能超过500MB')
            return false
        }

        isShowUploadVideo.value = false
        return true
    }
</script>

<style scoped></style>
