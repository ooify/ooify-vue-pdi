<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="任务编号" prop="taskNo">
        <el-input
          v-model="queryParams.taskNo"
          placeholder="请输入任务编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="视频ID" prop="videoId">
        <el-input
          v-model="queryParams.videoId"
          placeholder="请输入视频ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="任务状态" prop="taskStatus">
        <el-select v-model="queryParams.taskStatus" placeholder="请选择任务状态" clearable>
          <el-option
            v-for="dict in pdi_task_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="开始时间" style="width: 308px">
        <el-date-picker
          v-model="daterangeStartTime"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="完成时间" style="width: 308px">
        <el-date-picker
          v-model="daterangeEndTime"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="创建者" prop="createBy">
        <el-input
          v-model="queryParams.createBy"
          placeholder="请输入创建者"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="是否删除" prop="isDeleted">
        <el-select v-model="queryParams.isDeleted" placeholder="请选择是否删除" clearable>
          <el-option
            v-for="dict in pdi_is_delete"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" style="width: 308px">
        <el-date-picker
          v-model="daterangeCreateTime"
          value-format="YYYY-MM-DD"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
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
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['pdi:task:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['pdi:task:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['pdi:task:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['pdi:task:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="taskList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="主键ID" align="center" prop="id" />
      <el-table-column label="任务编号" align="center" prop="taskNo" />
      <el-table-column label="视频ID" align="center" prop="videoId" />
      <el-table-column label="视频" align="center" prop="videoUrl" />
      <el-table-column label="管道信息" align="center" prop="pipeInfo" />
      <el-table-column label="任务状态" align="center" prop="taskStatus">
        <template #default="scope">
          <dict-tag :options="pdi_task_status" :value="scope.row.taskStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="报告文档" align="center" prop="reportUrl" />
      <el-table-column label="开始时间" align="center" prop="startTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="完成时间" align="center" prop="endTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="创建者" align="center" prop="createBy" />
      <el-table-column label="是否删除" align="center" prop="isDeleted">
        <template #default="scope">
          <dict-tag :options="pdi_is_delete" :value="scope.row.isDeleted"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['pdi:task:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['pdi:task:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改报告生成任务对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="taskRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="任务编号" prop="taskNo">
          <el-input v-model="form.taskNo" placeholder="请输入任务编号" />
        </el-form-item>
        <el-form-item label="视频ID" prop="videoId">
          <el-input v-model="form.videoId" placeholder="请输入视频ID" />
        </el-form-item>
        <el-form-item label="视频" prop="videoUrl">
          <file-upload v-model="form.videoUrl"/>
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

<script setup name="Task">
import { listTask, getTask, delTask, addTask, updateTask } from "@/api/pdi/task";

const { proxy } = getCurrentInstance();
const { pdi_task_status, pdi_is_delete } = proxy.useDict('pdi_task_status', 'pdi_is_delete');

const taskList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const daterangeStartTime = ref([]);
const daterangeEndTime = ref([]);
const daterangeCreateTime = ref([]);

const data = reactive({
  form: {},
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
  rules: {
    videoId: [
      { required: true, message: "视频ID不能为空", trigger: "blur" }
    ],
    videoUrl: [
      { required: true, message: "视频不能为空", trigger: "blur" }
    ],
    pipeInfo: [
      { required: true, message: "管道信息不能为空", trigger: "blur" }
    ],
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询报告生成任务列表 */
function getList() {
  loading.value = true;
  queryParams.value.params = {};
  if (null != daterangeStartTime && '' != daterangeStartTime) {
    queryParams.value.params["beginStartTime"] = daterangeStartTime.value[0];
    queryParams.value.params["endStartTime"] = daterangeStartTime.value[1];
  }
  if (null != daterangeEndTime && '' != daterangeEndTime) {
    queryParams.value.params["beginEndTime"] = daterangeEndTime.value[0];
    queryParams.value.params["endEndTime"] = daterangeEndTime.value[1];
  }
  if (null != daterangeCreateTime && '' != daterangeCreateTime) {
    queryParams.value.params["beginCreateTime"] = daterangeCreateTime.value[0];
    queryParams.value.params["endCreateTime"] = daterangeCreateTime.value[1];
  }
  listTask(queryParams.value).then(response => {
    taskList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    taskNo: null,
    videoId: null,
    videoUrl: null,
    pipeInfo: null,
    taskStatus: null,
    queuePosition: null,
    retryCount: null,
    errorMessage: null,
    flaskTaskId: null,
    reportUrl: null,
    ossObjectKey: null,
    startTime: null,
    endTime: null,
    createBy: null,
    isDeleted: null,
    remark: null,
    createTime: null,
    updateTime: null
  };
  proxy.resetForm("taskRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  daterangeStartTime.value = [];
  daterangeEndTime.value = [];
  daterangeCreateTime.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加报告生成任务";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getTask(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改报告生成任务";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["taskRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateTask(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addTask(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除报告生成任务编号为"' + _ids + '"的数据项？').then(function() {
    return delTask(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('pdi/task/export', {
    ...queryParams.value
  }, `task_${new Date().getTime()}.xlsx`)
}

getList();
</script>
