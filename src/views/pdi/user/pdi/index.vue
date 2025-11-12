<template>
    <div class="app-container">
        <el-form
            :model="queryParams"
            ref="queryRef"
            :inline="true"
            v-show="showSearch"
            label-width="68px">
            <el-form-item label="上传状态" prop="uploadStatus">
                <el-select
                    v-model="queryParams.uploadStatus"
                    style="width: 150px"
                    placeholder="请选择上传状态"
                    clearable>
                    <el-option
                        v-for="dict in pdi_upload_status"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value" />
                </el-select>
            </el-form-item>
            <el-form-item label="创建时间" style="width: 308px">
                <el-date-picker
                    v-model="daterangeCreateTime"
                    value-format="YYYY-MM-DD"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"></el-date-picker>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="UploadFilled" @click="uploadDialog = true">
                    上传
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="info"
                    plain
                    icon="Document"
                    :disabled="multiple"
                    @click="handleDelete">
                    生成
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="danger"
                    plain
                    icon="Delete"
                    :disabled="multiple"
                    @click="handleDelete">
                    删除
                </el-button>
            </el-col>

            <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
        <el-table v-loading="loading" :data="videoList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />

            <!-- 视频显示列 -->
            <el-table-column label="视频" width="160" align="center">
                <template #default="{ row }">
                    <div class="video-preview" @click="openVideo(row.videoUrl)">
                        <template v-if="row.thumbnailUrl">
                            <img :src="row.thumbnailUrl" alt="缩略图" class="thumbnail" />
                            <div class="play-overlay">
                                <el-icon size="32">
                                    <VideoPlay />
                                </el-icon>
                            </div>
                        </template>
                        <template v-else>
                            <el-skeleton animated>
                                <template #template>
                                    <el-skeleton-item
                                        variant="image"
                                        class="thumbnail skeleton-thumb" />
                                </template>
                            </el-skeleton>
                        </template>
                    </div>
                </template>
            </el-table-column>
            <el-table-column
                label="文件大小"
                align="center"
                prop="fileSize"
                :formatter="formatFileSize" />
            <el-table-column label="文件类型" align="center" prop="mimeType" />
            <el-table-column label="视频时长" align="center" prop="duration">
                <template #default="{ row }">
                    <span>{{ row.duration }}s</span>
                </template>
            </el-table-column>
            <el-table-column label="分辨率" align="center" prop="resolution" />
            <!-- <el-table-column label="管道信息" align="center" prop="pipeInfo" /> -->
            <el-table-column label="管道信息" align="center" width="120">
                <template #default="{ row }">
                    <el-button type="primary" link @click="openPipeInfoDialog(row)">查看</el-button>
                </template>
            </el-table-column>
            <el-table-column label="上传状态" align="center" prop="uploadStatus">
                <template #default="scope">
                    <dict-tag :options="pdi_upload_status" :value="scope.row.uploadStatus" />
                </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="180">
                <template #default="scope">
                    <span>
                        {{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
                <template #default="scope">
                    <template v-if="scope.row.uploadStatus === 0">
                        <el-button
                            link
                            type="info"
                            disabled
                            icon="Loading"
                            @click="handleGenerate(scope.row)">
                            上传中
                        </el-button>
                    </template>
                    <template v-else-if="scope.row.uploadStatus === 1">
                        <el-button
                            link
                            type="primary"
                            icon="Document"
                            @click="handleGenerate(scope.row)">
                            生成
                        </el-button>
                    </template>
                    <template v-else-if="scope.row.uploadStatus === 2">
                        <el-button
                            link
                            type="warning"
                            icon="Refresh"
                            @click="handleReupload(scope.row)">
                            重新上传
                        </el-button>
                    </template>
                    <template v-else-if="scope.row.uploadStatus === 3">
                        <el-button
                            link
                            type="success"
                            icon="Select"
                            @click="openPipeInfoDialog(scope.row)">
                            确认
                        </el-button>
                    </template>
                    <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 视频播放弹窗 -->
        <el-dialog
            v-model="visible"
            width="80%"
            :fullscreen="false"
            :show-close="true"
            @close="currentUrl = ''">
            <video
                v-if="currentUrl"
                :src="currentUrl"
                controls
                controlslist="nodownload"
                playsinline
                class="video-player" />
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="visible = false">关闭窗口</el-button>
                </div>
            </template>
        </el-dialog>

        <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList" />

        <!-- 上传视频弹窗 -->
        <el-dialog title="上传视频" v-model="uploadDialog" width="90%" append-to-body>
            <el-upload
                drag
                list-type="picture"
                :auto-upload="false"
                :on-change="handleFileChange"
                accept="video/*"
                v-model:file-list="fileList"
                multiple>
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                    将文件拖到此处，或
                    <em>点击上传</em>
                </div>
                <div class="el-upload__tip">mp4/avi 等文件必须小于 500MB</div>
                <template #file="{ file }">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
                        <el-progress
                            v-if="file.status === 'uploading'"
                            :percentage="file.percentage || 0" />
                        <span>{{ file.name }}</span>
                        <el-button type="danger" link @click="removeFile(file)">删除</el-button>
                    </div>
                </template>
            </el-upload>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="uploadDialog = false">取消</el-button>
                    <el-button
                        type="primary"
                        :disabled="fileList.length === 0"
                        @click="uploadToOSS">
                        上传到服务器
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 管道信息查看/编辑弹窗 -->
        <el-dialog
            v-model="pipeInfoDialogVisible"
            title="管道信息"
            :width="isMobile ? '95%' : '600px'"
            append-to-body>
            <el-form :model="pipeInfoForm" label-width="120px">
                <el-form-item label="任务名称">
                    <el-input v-model="pipeInfoForm.task_name" placeholder="任务名称" />
                </el-form-item>
                <el-form-item label="检查位置">
                    <el-input v-model="pipeInfoForm.inspection_location" placeholder="检查位置" />
                </el-form-item>
                <el-form-item label="检查日期">
                    <el-input v-model="pipeInfoForm.inspection_date" placeholder="检查日期" />
                </el-form-item>
                <el-form-item label="起止井号">
                    <el-input
                        v-model="pipeInfoForm.start_manhole_id_end_manhole_id"
                        placeholder="起止井号" />
                </el-form-item>
                <el-form-item label="检查方向">
                    <el-input v-model="pipeInfoForm.inspection_direction" placeholder="检查方向" />
                </el-form-item>
                <el-form-item label="管道材质">
                    <el-input v-model="pipeInfoForm.pipe_material" placeholder="管道材质" />
                </el-form-item>
                <el-form-item label="管道管径">
                    <el-input v-model="pipeInfoForm.pipe_diameter" placeholder="管道管径" />
                </el-form-item>
                <el-form-item label="管道类型">
                    <el-input v-model="pipeInfoForm.pipeline_type" placeholder="管道类型" />
                </el-form-item>
                <el-form-item label="检查单位">
                    <el-input v-model="pipeInfoForm.inspection_unit" placeholder="检查单位" />
                </el-form-item>
                <el-form-item label="检查员">
                    <el-input v-model="pipeInfoForm.inspector" placeholder="检查员" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="pipeInfoDialogVisible = false">取消</el-button>
                    <el-button type="success" @click="confirmPipeInfoAction">确认</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="Video">
    import {
        listVideo,
        delVideo,
        addVideo,
        confirmPipeInfo,
        reuploadVideo,
        updateVideo,
    } from '@/api/pdi/pdi'
    import { getVideoInfo } from '@/utils/video-tools'
    import { getToken } from '@/utils/auth'

    const { proxy } = getCurrentInstance()
    const { pdi_upload_status } = proxy.useDict('pdi_upload_status')

    const videoList = ref([])
    const loading = ref(true)
    const showSearch = ref(true)
    const ids = ref([])
    const single = ref(true)
    const multiple = ref(true)
    const total = ref(0)
    const daterangeCreateTime = ref([])
    const uploadDialog = ref(false)

    const fileList = ref([])
    const uploadProgressMap = ref({}) // { [videoId]: percent } or fallback by temp key

    // 管道信息弹窗与表单
    const pipeInfoDialogVisible = ref(false)
    const pipeInfoForm = ref({})
    const currentPipeRowId = ref(null)

    const data = reactive({
        form: {},
        queryParams: {
            pageNum: 1,
            pageSize: 10,
            videoName: null,
            createBy: null,
            createTime: null,
        },
    })

    const { queryParams } = toRefs(data)

    const parsePipeInfo = (pipeInfo) => {
        try {
            return typeof pipeInfo === 'string' ? JSON.parse(pipeInfo) : pipeInfo
        } catch (e) {
            return {}
        }
    }

    const formatFileSize = (row) => {
        const size = Number(row.fileSize)

        if (size < 1024) return size + ' B'
        else if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
        else if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB'
        else return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }

    // 选择文件时校验（视频格式与大小限制 500MB）
    const handleFileChange = (uploadFile, uploadFiles) => {
        const allowedTypes = [
            'video/mp4',
            'video/ogg',
            'video/flv',
            'video/avi',
            'video/wmv',
            'video/rmvb',
            'video/mov',
            'video/webm',
            'video/mpeg',
        ]
        const invalids = []
        fileList.value = uploadFiles.filter((f) => {
            const raw = f.raw || f
            const isTypeOk = raw && allowedTypes.includes(raw.type)
            const isSizeOk = raw && raw.size / 1024 / 1024 < 500
            const ok = !!(isTypeOk && isSizeOk)
            if (!ok) invalids.push(f.name)
            return ok
        })
        if (invalids.length) {
            proxy.$modal.msgError('以下文件已移除（格式或大小非法）：' + invalids.join(', '))
        }
    }
    const removeFile = (file) => {
        const idx = fileList.value.findIndex((f) => f.uid === file.uid)
        if (idx > -1) fileList.value.splice(idx, 1)
    }

    // 打开管道信息表单弹窗
    const openPipeInfoDialog = (row) => {
        currentPipeRowId.value = row.id
        pipeInfoForm.value = { ...(parsePipeInfo(row.pipeInfo) || {}) }
        pipeInfoDialogVisible.value = true
    }

    // 确认管道信息（用于状态=3）
    const confirmPipeInfoAction = async () => {
        getList()
        if (!currentPipeRowId.value) return
        const payload = JSON.stringify(pipeInfoForm.value || {})
        await confirmPipeInfo(currentPipeRowId.value, payload)
        proxy.$modal.msgSuccess('更改管道信息成功')
        pipeInfoDialogVisible.value = false
        getList()
    }
    const uploadToOSS = async () => {
        uploadDialog.value = false
        if (fileList.value.length === 0) {
            proxy.$modal.msgError('请先选择文件')
            return
        }
        for (const fileItem of fileList.value) {
            const file = fileItem.raw
            // 1️⃣ 获取视频信息
            const info = await getVideoInfo(file)
            addVideo(info).then((res) => {
                if (!res.code || res.code !== 200) {
                    proxy.$modal.msgError(res.msg || '获取签名失败')
                    return
                }
                const data = res.data
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
                formData.append('key', data.dir + newFileName) // 文件名
                formData.append('x-oss-security-token', data.security_token)
                formData.append('callback', data.callback) // 添加回调参数
                formData.append('Content-Type', file.type)
                formData.append('file', file) // file 必须为最后一个表单域
                getList()
                fetch(data.host, {
                    method: 'POST',
                    body: formData,
                })
                    .then((response) => {
                        if (response.ok) {
                            if (response.status === 200) {
                                getList()
                                proxy.$modal.msgSuccess('上传成功')
                            } else {
                                proxy.$modal.msgError('上传失败')
                            }
                        } else {
                            proxy.$modal.msgError('上传失败')
                        }
                    })
                    .catch((error) => {
                        proxy.$modal.msgError('上传失败: ' + error.message)
                    })
            })
        }
        fileList.value = []
        getList()
    }

    /** 查询管道视频列表 */
    function getList() {
        loading.value = true
        queryParams.value.params = {}
        if (null != daterangeCreateTime && '' != daterangeCreateTime) {
            queryParams.value.params['beginCreateTime'] = daterangeCreateTime.value[0]
            queryParams.value.params['endCreateTime'] = daterangeCreateTime.value[1]
        }
        listVideo(queryParams.value).then((response) => {
            videoList.value = response.rows
            total.value = response.total
            loading.value = false
        })
    }

    /** 搜索按钮操作 */
    function handleQuery() {
        queryParams.value.pageNum = 1
        getList()
    }

    /** 重置按钮操作 */
    function resetQuery() {
        daterangeCreateTime.value = []
        proxy.resetForm('queryRef')
        handleQuery()
    }

    // 多选框选中数据
    function handleSelectionChange(selection) {
        ids.value = selection.map((item) => item.id)
        single.value = selection.length != 1
        multiple.value = !selection.length
    }

    /** 删除按钮操作 */
    function handleDelete(row) {
        const _ids = row.id || ids.value
        proxy.$modal
            .confirm('是否确认删除所选的数据项？')
            .then(function () {
                return delVideo(_ids)
            })
            .then(() => {
                getList()
                proxy.$modal.msgSuccess('删除成功')
            })
            .catch(() => {})
    }

    const visible = ref(false)
    const currentUrl = ref('')
    const isMobile = ref(false)
    onMounted(() => {
        const updateIsMobile = () => {
            isMobile.value = window.innerWidth < 768
        }
        updateIsMobile()
        window.addEventListener('resize', updateIsMobile)
    })
    onBeforeUnmount(() => {
        window.removeEventListener('resize', () => {})
    })

    const openVideo = (url) => {
        currentUrl.value = url
        visible.value = true
    }

    // 生成占位（仅输出日志）
    const handleGenerate = (row) => {
        console.log('生成任务，视频ID：', row.id)
        // 预留生成逻辑
    }

    // 重新上传：调用后端接口获取签名后直传
    const handleReupload = async (row) => {
        try {
            const res = await reuploadVideo(row.id)
            if (res.code !== 200) {
                proxy.$modal.msgError('获取签名失败：' + (res.msg || ''))
                return
            }
            // console.log(res)
            const data = res.data
            // 这里假设后端返回的数据中包含必须直传信息，与 addVideo 返回一致
            // 并且需要重新上传的源文件不在本地；通常重传需要后端重新回源，或前端仍持有文件。
            // 若后端返回需要的文件信息不在前端，此处仅触发直传流程的占位（无法真正上传本地文件）。
            // 可选：仅触发状态更新或提示后端进行服务端重传。
            let formData = new FormData()
            formData.append('success_action_status', '200')
            formData.append('policy', data.policy)
            formData.append('x-oss-signature', data.signature)
            formData.append('x-oss-signature-version', 'OSS4-HMAC-SHA256')
            formData.append('x-oss-credential', data.x_oss_credential)
            formData.append('x-oss-date', data.x_oss_date)
            formData.append('key', data.key || (data.dir ? data.dir + (data.fileName || '') : '')) // 尽力拼接
            formData.append('x-oss-security-token', data.security_token)
            formData.append('callback', data.callback)
            if (data.file instanceof File) {
                formData.append('file', data.file)
            } else {
                // 无法获取原文件时，提示用户重新选择文件上传
                proxy.$modal.msgWarning('无法直接重传，请在上传弹窗中重新选择视频后上传')
                return
            }
            await postToOssWithProgress(data.host, formData, (percent) => {
                uploadProgressMap.value[row.id] = percent
            })
            proxy.$modal.msgSuccess('重传完成')
            getList()
        } catch (e) {
            proxy.$modal.msgError('重传失败，请稍后再试')
        }
    }

    getList()
</script>
<style scoped>
    .video-preview {
        position: relative;
        width: 140px;
        height: 80px;
        cursor: pointer;
        border-radius: 4px;
        overflow: hidden;
    }

    .thumbnail {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .skeleton-thumb {
        width: 100%;
        height: 100%;
        display: block;
    }

    .play-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
        opacity: 0;
        transition: opacity 0.3s;
        /*color: white;*/
        color: var(--el-color-primary);
    }

    .video-preview:hover .play-overlay {
        opacity: 1;
    }

    /* 移动端始终显示播放按钮 */
    @media (max-width: 768px) {
        .play-overlay {
            opacity: 1;
            background: rgba(0, 0, 0, 0.2);
        }

        .video-preview {
            width: 120px;
            height: 68px;
        }
    }

    .video-player {
        width: 100%;
        height: 70vh;
        object-fit: contain;
    }

    /* 恢复默认头部与内边距，适配常规对话框 */
</style>
