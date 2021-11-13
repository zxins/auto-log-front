<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-item time-container">
        <label>日期：</label>
        <el-date-picker
          v-model="indexDate"
          align="right"
          type="date"
          placeholder="选择日期"
          :picker-options="pickerOptions"
        />
      </div>

      <el-select v-model="matchKey" placeholder="检索字段" clearable style="width: 120px" class="filter-item">
        <el-option v-for="item in fields" :key="item" :label="item" :value="item"/>
      </el-select>
      <el-input
        v-model="matchValue"
        placeholder="请输入检索值"
        style="width: 200px;"
        class="filter-item"
        @keyup.enter.native="handleFilter"
      />

      <!--      <div class="filter-item time-container">-->
      <!--        <label>时间段：</label>-->
      <!--        <el-time-picker-->
      <!--          v-model="timeFrom"-->
      <!--          :picker-options="{ selectableRange: '00:00:00 - 23:59:59' }"-->
      <!--          placeholder="任意时间点"-->
      <!--        />-->
      <!--        &nbsp;-->
      <!--        <el-time-picker-->
      <!--          v-model="timeTo"-->
      <!--          :picker-options="pickerOptions"-->
      <!--          placeholder="任意时间点"-->
      <!--        />-->
      <!--      </div>-->

      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        @click="handleFilter"
      >
        {{ $t('table.search') }}
      </el-button>
    </div>
    <div class="filter-container">
      <el-checkbox-group v-model="colNames">
        <el-checkbox v-for="row in temp.colNames" :key="row" :label="row">
          {{ row }}
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <el-table :key="tableKey" :data="tableData" border fit highlight-current-row style="width: 100%">
      <el-table-column v-for="col in colNames" :key="col" :label="col">
        <template slot-scope="scope">
          {{ scope.row[col] }}
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.perPage"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { fetchFields, fetchHits } from '@/api/log'
import { fetchPv, createArticle, updateArticle } from '@/api/article'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import moment from 'moment'

export default {
  name: 'SystemLog',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      query: {
        time: moment().startOf(`day`),
        matchKey: '',
        matchValue: undefined
      },
      indexDate: moment().startOf(`day`),
      pickerOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now()
        },
        shortcuts: [{
          text: '今天',
          onClick(picker) {
            picker.$emit('pick', new Date())
          }
        }, {
          text: '昨天',
          onClick(picker) {
            const date = new Date()
            date.setTime(date.getTime() - 3600 * 1000 * 24)
            picker.$emit('pick', date)
          }
        }, {
          text: '一周前',
          onClick(picker) {
            const date = new Date()
            date.setTime(date.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', date)
          }
        }]
      },
      matchKey: '',
      matchValue: undefined,
      timeFrom: undefined,
      timeTo: undefined,
      colNames: [],
      tableData: [],
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        perPage: 10
      },
      listBody: {
        match: {}
      },
      fields: [],
      temp: {
        colNames: [],
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        status: 'published'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        type: [{ required: true, message: 'type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },
  watch: {
    matchKey: function(val) {
      this.listBody.match = {}
      this.listBody.match[val] = this.matchValue
    },
    matchValue: function(val) {
      this.listBody.match[this.matchKey] = val
    }
  },
  created() {
    this.getFields()
    this.getList()
  },
  methods: {
    getFields() {
      this.listLoading = true
      const dateStr = moment(this.indexDate).format('yyyyMMDD')
      fetchFields(dateStr).then(res => {
        const result = res.r
        const fields = []
        for (const k in result) {
          if (!k.startsWith('@')) {
            fields.push(k)
          }
        }
        fields.sort()
        this.fields = fields
        this.listLoading = false
      })
    },
    getList() {
      this.listLoading = true
      const dateStr = moment(this.indexDate).format('yyyyMMDD')
      fetchHits(dateStr, this.listQuery, this.listBody).then(res => {
        const items = res.r.items
        const tableData = []
        items.forEach((item) => {
          tableData.push(item._source)
        })
        this.tableData = tableData
        this.colNames = this.fields
        this.temp.colNames = JSON.parse(JSON.stringify(this.colNames))
        this.total = res.r.totalCount
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作成功',
        type: 'success'
      })
      row.status = status
    },
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        status: 'published',
        type: ''
      }
    },
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.temp.id = parseInt(Math.random() * 100) + 1024 // mock a id
          this.temp.author = 'vue-element-admin'
          createArticle(this.temp).then(() => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.timestamp = new Date(this.temp.timestamp)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          updateArticle(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row, index) {
      this.$notify({
        title: '成功',
        message: '删除成功',
        type: 'success',
        duration: 2000
      })
      this.list.splice(index, 1)
    },
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-container {
  .filter-item {
    margin-right: 5px;

    ::v-deep .el-date-editor {
      width: 150px;
    }
  }
}

</style>
