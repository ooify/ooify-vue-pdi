<template>
    <div class="app-container">
        <el-form
            :model="queryParams"
            ref="queryRef"
            :inline="true"
            v-show="showSearch"
            label-width="68px">
            <el-form-item label="任务编号" prop="taskNo">
                <el-input
                    v-model="queryParams.taskNo"
                    placeholder="请输入任务编号"
                    clearable
                    @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="视频ID" prop="videoId">
                <el-input
                    v-model="queryParams.videoId"
                    placeholder="请输入视频ID"
                    clearable
                    @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="任务状态" prop="taskStatus">
                <el-select
                    v-model="queryParams.taskStatus"
                    placeholder="请选择任务状态"
                    clearable
                    style="width: 150px">
                    <el-option
                        v-for="dict in pdi_task_status"
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

        <!-- <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
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
        </el-row> -->

        <el-table v-loading="loading" :data="taskList" @selection-change="handleSelectionChange">
            <!-- <el-table-column type="selection" width="55" align="center" /> -->
            <el-table-column label="任务编号" align="center" prop="taskNo" />
            <!-- 视频显示列 -->
            <el-table-column label="视频" width="160" align="center">
                <template #default="{ row }">
                    <div class="video-preview" @click="openVideo(row.videoUrl)">
                        <img
                            :src="
                                row.videoUrl +
                                '?x-oss-process=video/snapshot,t_0,f_jpg,w_0,h_0,m_fast,ar_auto'
                            "
                            alt="缩略图"
                            class="thumbnail" />
                        <div class="play-overlay">
                            <el-icon size="32">
                                <VideoPlay />
                            </el-icon>
                        </div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="管道信息" align="center" width="120">
                <template #default="{ row }">
                    <el-button type="primary" link @click="openPipeInfoDialog(row)">查看</el-button>
                </template>
            </el-table-column>
            <!-- <el-table-column label="任务状态" align="center" prop="taskStatus">
                <template #default="scope">
                    <dict-tag :options="pdi_task_status" :value="scope.row.taskStatus" />
                </template>
            </el-table-column> -->
            <el-table-column label="耗时" align="center">
                <template #default="scope">
                    <span>{{ formatDuration(scope.row) }}</span>
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
                    <template v-if="scope.row.taskStatus === 0">
                        <el-button link type="info" disabled>排队中</el-button>
                        <el-button
                            link
                            type="primary"
                            icon="Delete"
                            @click="handleCancel(scope.row)">
                            取消
                        </el-button>
                    </template>
                    <template v-if="scope.row.taskStatus === 1">
                        <el-button link type="primary" disabled>
                            <el-icon class="custom-loading-icon">
                                <Loading />
                            </el-icon>
                            生成中
                        </el-button>
                        <el-button
                            link
                            type="primary"
                            icon="Delete"
                            @click="handleCancel(scope.row)">
                            取消
                        </el-button>
                    </template>
                    <template v-if="scope.row.taskStatus === 2">
                        <el-button
                            link
                            type="success"
                            icon="Download"
                            @click="handleDownload(scope.row.reportUrl)">
                            下载
                        </el-button>
                        <el-button
                            link
                            type="primary"
                            icon="Delete"
                            @click="handleDelete(scope.row)">
                            删除
                        </el-button>
                    </template>
                    <template v-if="scope.row.taskStatus === 3">
                        <el-button link type="danger" disabled>生成失败</el-button>
                        <el-button
                            link
                            type="primary"
                            icon="Delete"
                            @click="handleRetry(scope.row)">
                            重新生成
                        </el-button>
                    </template>
                    <template v-if="scope.row.taskStatus === 4">
                        <el-button link type="warning" disabled>已取消</el-button>
                    </template>
                </template>
            </el-table-column>
        </el-table>

        <pagination
            v-show="total > 0"
            :total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="getList" />

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

        <!-- 管道信息查看弹窗 -->
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
                    <el-button @click="pipeInfoDialogVisible = false">关闭</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup name="Task">
    import { listTask, getTask, delTask } from '@/api/pdi/doc'

    const { proxy } = getCurrentInstance()
    const { pdi_task_status } = proxy.useDict('pdi_task_status', 'pdi_is_delete')

    const taskList = ref([])
    const open = ref(false)
    const loading = ref(true)
    const showSearch = ref(true)
    const ids = ref([])
    const single = ref(true)
    const multiple = ref(true)
    const total = ref(0)
    const title = ref('')
    const daterangeStartTime = ref([])
    const daterangeEndTime = ref([])
    const daterangeCreateTime = ref([])

    const data = reactive({
        queryParams: {
            pageNum: 1,
            pageSize: 10,
            taskNo: null,
            videoId: null,
            taskStatus: null,
            startTime: null,
            endTime: null,
            createBy: null,
            isDeleted: null,
            createTime: null,
        },
    })

    const { queryParams } = toRefs(data)

    const formatDuration = (row) => {
        // 只有成功状态才显示耗时
        if (row.taskStatus !== 2) return ''

        const start = new Date(row.startTime).getTime()
        const end = new Date(row.endTime).getTime()

        if (isNaN(start) || isNaN(end)) return ''

        let diff = Math.floor((end - start) / 1000)

        const h = Math.floor(diff / 3600)
        diff %= 3600
        const m = Math.floor(diff / 60)
        const s = diff % 60

        if (h > 0) return `${h}小时${m}分${s}秒`
        if (m > 0) return `${m}分${s}秒`
        return `${s}秒`
    }

    /** 查询报告生成任务列表 */
    function getList() {
        loading.value = true
        queryParams.value.params = {}
        if (null != daterangeCreateTime && '' != daterangeCreateTime) {
            queryParams.value.params['beginCreateTime'] = daterangeCreateTime.value[0]
            queryParams.value.params['endCreateTime'] = daterangeCreateTime.value[1]
        }
        listTask(queryParams.value).then((response) => {
            taskList.value = response.rows
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
        daterangeStartTime.value = []
        daterangeEndTime.value = []
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
        title.value = '添加报告生成任务'
    }

    /** 删除按钮操作 */
    function handleDelete(row) {
        const _ids = row.id || ids.value
        proxy.$modal
            .confirm('是否确认删除编号为"' + _ids + '"的数据项？')
            .then(function () {
                return delTask(_ids)
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
    // 管道信息弹窗与表单
    const pipeInfoDialogVisible = ref(false)
    const pipeInfoForm = ref({})
    const currentPipeRowId = ref(null)

    // 打开管道信息表单弹窗
    const openPipeInfoDialog = (row) => {
        currentPipeRowId.value = row.id
        pipeInfoForm.value = { ...(parsePipeInfo(row.pipeInfo) || {}) }
        pipeInfoDialogVisible.value = true
    }
    const parsePipeInfo = (pipeInfo) => {
        try {
            return typeof pipeInfo === 'string' ? JSON.parse(pipeInfo) : pipeInfo
        } catch (e) {
            return {}
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

    .custom-loading-icon {
        animation: spin 1s linear infinite;
    }
</style>
