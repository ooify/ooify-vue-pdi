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
                <el-button
                    type="primary"
                    plain
                    icon="UploadFilled"
                    @click="uploadDialog = true"
                    v-hasPermi="['serve:video:add']">
                    上传
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="info"
                    plain
                    icon="Document"
                    :disabled="multiple"
                    @click="handleDelete"
                    v-hasPermi="['serve:video:remove']">
                    生成
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
                        <img :src="row.thumbnailUrl" alt="缩略图" class="thumbnail" />
                        <div class="play-overlay">
                            <el-icon size="32">
                                <VideoPlay />
                            </el-icon>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="文件大小" align="center" prop="fileSize" />
            <el-table-column label="文件类型" align="center" prop="mimeType" />
            <el-table-column label="视频时长" align="center" prop="duration" />
            <el-table-column label="分辨率" align="center" prop="resolution" />
            <!-- <el-table-column label="管道信息" align="center" prop="pipeInfo" /> -->
            <el-table-column label="管道信息" align="center" width="120">
                <template #default="{ row }">
                    <el-popover placement="right" width="400" trigger="hover">
                        <template #reference>
                            <el-button type="primary" link>查看详情</el-button>
                        </template>
                        <div class="pipe-info-detail">
                            <div
                                v-for="(value, key) in parsePipeInfo(row.pipeInfo)"
                                :key="key"
                                class="info-item">
                                <span class="label">{{ formatLabel(key) }}:</span>
                                <span class="value">{{ value || '-' }}</span>
                            </div>
                        </div>
                    </el-popover>
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
                    <el-button
                        link
                        type="primary"
                        icon="Edit"
                        @click="handleUpdate(scope.row)"
                        v-hasPermi="['serve:video:edit']">
                        修改
                    </el-button>
                    <el-button
                        link
                        type="primary"
                        icon="Delete"
                        @click="handleDelete(scope.row)"
                        v-hasPermi="['serve:video:remove']">
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 视频播放弹窗 -->
        <el-dialog v-model="visible" :fullscreen="true" :show-close="true" @close="currentUrl = ''">
            <video
                v-if="currentUrl"
                :src="currentUrl"
                controls
                controlslist="nodownload"
                playsinline
                class="video-player" />
        </el-dialog>

        <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList" />

        <!-- 上传视频弹窗 -->
        <el-dialog title="上传视频" v-model="uploadDialog" width="90%" append-to-body>
            <!-- <span>Open the dialog from the center from the screen</span> -->
            <el-upload
                drag
                list-type="picture"
                :on-progress="uploadVideoProcess"
                :auto-upload="false"
                action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                multiple>
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                    Drop file here or
                    <em>click to upload</em>
                </div>
                <div class="el-upload__tip">jpg/png files with a size less than 500kb</div>
                <template #tip>
                    <el-button type="primary" @click="getPostSignatureInfo">上传到服务器</el-button>
                </template>
                <template #file="{ file }">
                    <el-progress v-if="file.status === 'uploading'" :percentage="file.percentage" />
                    <span v-else>{{ file.name }}</span>
                </template>
            </el-upload>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="uploadDialog = false">Cancel</el-button>
                    <el-button type="primary" @click="uploadDialog = false">Confirm</el-button>
                </div>
            </template>
        </el-dialog>
        <!-- 添加或修改管道视频对话框 -->
        <el-dialog :title="title" v-model="open" width="500px" append-to-body>
            <el-form ref="videoRef" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="视频名" prop="videoName">
                    <el-input v-model="form.videoName" placeholder="请输入视频文件名" />
                </el-form-item>
                <!-- <el-form-item label="视频URL" prop="videoUrl">
                    <file-upload v-model="form.videoUrl" />
                </el-form-item> -->

                <el-form-item label="文件大小" prop="fileSize">
                    <el-input v-model="form.fileSize" placeholder="请输入文件大小(字节)" />
                </el-form-item>
                <el-form-item label="视频时长" prop="duration">
                    <el-input v-model="form.duration" placeholder="请输入视频时长(秒)" />
                </el-form-item>
                <el-form-item label="分辨率" prop="resolution">
                    <el-input
                        v-model="form.resolution"
                        placeholder="请输入视频分辨率，如1920x1080" />
                </el-form-item>
                <el-form-item label="上传状态" prop="uploadStatus">
                    <el-select v-model="form.uploadStatus" placeholder="请选择上传状态">
                        <el-option
                            v-for="dict in pdi_upload_status"
                            :key="dict.value"
                            :label="dict.label"
                            :value="parseInt(dict.value)"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                    <el-button @click="cancel">取 消</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="Video">
    import { listVideo, getVideo, delVideo, addVideo, updateVideo } from '@/api/pdi/pdi'

    const { proxy } = getCurrentInstance()
    const { pdi_upload_status } = proxy.useDict('pdi_upload_status')
    import { getToken } from '@/utils/auth'

    const videoList = ref([])
    const open = ref(false)
    const loading = ref(true)
    const showSearch = ref(true)
    const ids = ref([])
    const single = ref(true)
    const multiple = ref(true)
    const total = ref(0)
    const title = ref('')
    const daterangeCreateTime = ref([])
    const uploadDialog = ref(false)
    const data = reactive({
        form: {},
        queryParams: {
            pageNum: 1,
            pageSize: 10,
            videoName: null,
            uploadStatus: null,
            createBy: null,
            createTime: null,
        },
        rules: {
            videoName: [
                {
                    required: true,
                    message: '视频文件名不能为空',
                    trigger: 'blur',
                },
            ],
            videoUrl: [{ required: true, message: '视频URL不能为空', trigger: 'blur' }],
            thumbnailUrl: [
                {
                    required: true,
                    message: '缩略图URL不能为空',
                    trigger: 'blur',
                },
            ],
            pipeInfo: [
                {
                    required: true,
                    message: '管道信息JSON结构化字段不能为空',
                    trigger: 'blur',
                },
            ],
            uploadStatus: [
                {
                    required: true,
                    message: '上传状态:0-上传中,1-上传成功,2-上传失败不能为空',
                    trigger: 'change',
                },
            ],
        },
        uploadFormData: {
            host: '',
            success_action_status: '',
            policy: '',
            x_oss_signature: '',
            x_oss_signature_version: 'OSS4-HMAC-SHA256',
            x_oss_credential: '',
            x_oss_date: '',
            key: '', // 文件名
            x_oss_security_token: '',
            callback: '', // 添加回调参数
            file: '', // file 必须为最后一个表单域
        },
    })

    const { queryParams, form, rules, uploadFormData } = toRefs(data)

    const parsePipeInfo = (pipeInfo) => {
        try {
            return typeof pipeInfo === 'string' ? JSON.parse(pipeInfo) : pipeInfo
        } catch (e) {
            return {}
        }
    }

    const formatLabel = (key) => {
        const labelMap = {
            task_name: '任务名称',
            inspection_location: '检查位置',
            inspection_date: '检查日期',
            start_manhole_id_end_manhole_id: '起止井号',
            inspection_direction: '检查方向',
            pipe_material: '管道材质',
            pipe_diameter: '管道管径',
            pipeline_type: '管道类型',
            inspection_unit: '检查单位',
            inspector: '检查员',
        }
        return labelMap[key] || key
    }

    // 上传进度
    const uploadVideoProcess = (event, file) => {
        videoFlag.value = true
        videoUploadPercent.value = Math.round(file.percentage)
    }

    const getPostSignatureInfo = () => {
        getPostSignature().then((res) => {
            if (res.code !== 200) {
                ElMessage.error(res.msg || '获取签名失败')
                return
            }
            uploadFormData.success_action_status = '200'
            uploadFormData.policy = res.data.policy
            uploadFormData.x_oss_signature = res.data.signature
            uploadFormData.x_oss_credential = res.data.x_oss_credential
            uploadFormData.x_oss_date = res.data.x_oss_date
            uploadFormData.key = res.data.dir // 文件名
            uploadFormData.x_oss_security_token = res.data.security_token
            uploadFormData.callback = res.data.callback // 添加回调参数
            uploadFormData.host = res.data.host
            // uploadFormData.file = ""; // file 必须为最后一个表单域
            console.log(res)
        })
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

    // 取消按钮
    function cancel() {
        open.value = false
        reset()
    }

    // 表单重置
    function reset() {
        form.value = {
            id: null,
            videoName: null,
            videoUrl: null,
            thumbnailUrl: null,
            fileSize: null,
            mimeType: null,
            duration: null,
            resolution: null,
            pipeInfo: null,
            uploadStatus: null,
            uploadError: null,
            createBy: null,
            remark: null,
            createTime: null,
            updateTime: null,
        }
        proxy.resetForm('videoRef')
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

    /** 新增按钮操作 */
    function handleAdd() {
        reset()
        open.value = true
        title.value = '添加管道视频'
    }

    /** 修改按钮操作 */
    function handleUpdate(row) {
        reset()
        const _id = row.id || ids.value
        getVideo(_id).then((response) => {
            form.value = response.data
            open.value = true
            title.value = '修改管道视频'
        })
    }

    /** 提交按钮 */
    function submitForm() {
        proxy.$refs['videoRef'].validate((valid) => {
            if (valid) {
                if (form.value.id != null) {
                    updateVideo(form.value).then((response) => {
                        proxy.$modal.msgSuccess('修改成功')
                        open.value = false
                        getList()
                    })
                } else {
                    addVideo(form.value).then((response) => {
                        proxy.$modal.msgSuccess('新增成功')
                        open.value = false
                        getList()
                    })
                }
            }
        })
    }

    /** 删除按钮操作 */
    function handleDelete(row) {
        const _ids = row.id || ids.value
        proxy.$modal
            .confirm('是否确认删除管道视频编号为"' + _ids + '"的数据项？')
            .then(function () {
                return delVideo(_ids)
            })
            .then(() => {
                getList()
                proxy.$modal.msgSuccess('删除成功')
            })
            .catch(() => {})
    }

    /** 导出按钮操作 */
    function handleExport() {
        proxy.download(
            'serve/video/export',
            {
                ...queryParams.value,
            },
            `video_${new Date().getTime()}.xlsx`
        )
    }

    const visible = ref(false)
    const currentUrl = ref('')

    const openVideo = (url) => {
        currentUrl.value = url
        visible.value = true
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
        height: 100vh;
        object-fit: contain;
        background: #000;
    }

    /* 移除弹窗默认内边距 */
    :deep(.el-dialog__body) {
        padding: 0;
        height: 100%;
        background: #000;
    }

    :deep(.el-dialog__header) {
        display: none;
    }
</style>
