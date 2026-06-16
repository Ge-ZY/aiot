<template>
  <div class="system-page">
    <div class="page-header">
      <div>
        <h2>用户管理</h2>
        <p class="page-desc">为用户分配角色并绑定可访问的厂区</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">新增用户</el-button>
    </div>

    <div class="panel">
      <el-table :data="users" stripe>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="displayName" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="130">
          <template #default="{ row }">
            <el-tag size="small">{{ getRoleName(row.roleCode) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定厂区" min-width="200">
          <template #default="{ row }">
            <template v-if="row.roleCode === 'HQ_ADMIN'">
              <span class="text-muted">全部厂区</span>
            </template>
            <template v-else-if="row.factoryNames.length">
              <el-tag
                v-for="name in row.factoryNames"
                :key="name"
                size="small"
                class="factory-tag"
              >
                {{ name }}
              </el-tag>
            </template>
            <span v-else class="text-warn">未绑定</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleSimulateLogin(row)">模拟登录</el-button>
            <el-button
              v-if="row.username !== 'admin'"
              type="danger"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="姓名" prop="displayName">
          <el-input v-model="form.displayName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="角色" prop="roleCode">
          <el-select v-model="form.roleCode" style="width: 100%;" @change="onRoleChange">
            <el-option
              v-for="r in roles"
              :key="r.code"
              :label="r.name"
              :value="r.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="form.roleCode !== 'HQ_ADMIN'"
          label="绑定厂区"
          prop="factoryIds"
        >
          <el-select
            v-model="form.factoryIds"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择可访问厂区"
            style="width: 100%;"
          >
            <el-option
              v-for="f in FACTORY_OPTIONS"
              :key="f.id"
              :label="`${f.name}${f.region ? `（${f.region}）` : ''}`"
              :value="f.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-else label="绑定厂区">
          <span class="text-muted">总负责人默认可访问全部厂区</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { RoleCode } from '@/constants/permissions'
import {
  useRbacStore,
  FACTORY_OPTIONS,
  type ManagedUser,
} from '@/stores/rbac'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const rbacStore = useRbacStore()
const userStore = useUserStore()
const { users, roles } = storeToRefs(rbacStore)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  displayName: '',
  phone: '',
  roleCode: 'FACTORY_PRODUCTION' as RoleCode,
  factoryIds: [] as string[],
  enabled: true,
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请选择角色', trigger: 'change' }],
  factoryIds: [
    {
      validator: (_rule, value, callback) => {
        if (form.roleCode !== 'HQ_ADMIN' && (!value || value.length === 0)) {
          callback(new Error('非总负责人至少绑定一个厂区'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

const getRoleName = (code: RoleCode) => roles.value.find((r) => r.code === code)?.name ?? code

const resetForm = () => {
  form.username = ''
  form.displayName = ''
  form.phone = ''
  form.roleCode = 'FACTORY_PRODUCTION'
  form.factoryIds = []
  form.enabled = true
}

const openCreate = () => {
  isEdit.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row: ManagedUser) => {
  isEdit.value = true
  editingId.value = row.id
  form.username = row.username
  form.displayName = row.displayName
  form.phone = row.phone
  form.roleCode = row.roleCode
  form.factoryIds = [...row.factoryIds]
  form.enabled = row.enabled
  dialogVisible.value = true
}

const onRoleChange = () => {
  if (form.roleCode === 'HQ_ADMIN') {
    form.factoryIds = []
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  const factoryNames = rbacStore.getFactoryNames(form.factoryIds)

  if (isEdit.value && editingId.value) {
    rbacStore.updateUser(editingId.value, {
      displayName: form.displayName,
      phone: form.phone,
      roleCode: form.roleCode,
      factoryIds: form.roleCode === 'HQ_ADMIN' ? [] : [...form.factoryIds],
      factoryNames: form.roleCode === 'HQ_ADMIN' ? [] : factoryNames,
      enabled: form.enabled,
    })
    ElMessage.success('用户已更新')
  } else {
    const exists = users.value.some((u) => u.username === form.username)
    if (exists) {
      ElMessage.error('用户名已存在')
      return
    }
    rbacStore.addUser({
      username: form.username,
      displayName: form.displayName,
      phone: form.phone,
      roleCode: form.roleCode,
      factoryIds: form.roleCode === 'HQ_ADMIN' ? [] : [...form.factoryIds],
      factoryNames: form.roleCode === 'HQ_ADMIN' ? [] : factoryNames,
      enabled: form.enabled,
    })
    ElMessage.success('用户已创建')
  }
  dialogVisible.value = false
}

const handleDelete = async (row: ManagedUser) => {
  await ElMessageBox.confirm(`确定删除用户「${row.displayName}」？`, '提示', { type: 'warning' })
  rbacStore.removeUser(row.id)
  ElMessage.success('已删除')
}

const handleSimulateLogin = (row: ManagedUser) => {
  if (!row.enabled) {
    ElMessage.warning('该用户已停用')
    return
  }
  userStore.loginAsUser(row.id)
  ElMessage.success(`已模拟登录：${row.displayName}（${getRoleName(row.roleCode)}）`)
  router.push('/farm')
}
</script>

<style scoped>
.system-page {
  padding: 20px 24px 32px;
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #303133;
}

.page-desc {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.factory-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}

.text-muted {
  color: #909399;
  font-size: 13px;
}

.text-warn {
  color: #e6a23c;
  font-size: 13px;
}
</style>
