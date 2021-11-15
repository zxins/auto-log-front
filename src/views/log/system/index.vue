<template>
  <div class="app-container">
    <div class="filter-container">
      <div class="filter-item time-container">
        日期:
        <el-date-picker
          v-model="indexDate"
          class="item-col"
          align="right"
          type="date"
          placeholder="选择日期"
          :picker-options="pickerOptions"
          @change="handlerDateChange"
        />
      </div>
      <div class="filter-item time-container">
        过滤条件:

        <el-select
          v-model="matchKey"
          class="item-col"
          placeholder="检索字段"
          clearable
          style="width: 120px"
        >
          <el-option v-for="item in fieldsDropMenu" :key="item" :label="item" :value="item"/>
        </el-select>
        <el-input
          v-model="matchValue"
          class="item-col"
          placeholder="请输入检索值"
          style="width: 200px;"
          clearable
          @keyup.enter.native="handleFilter"
        />

        <el-time-picker
          v-model="timeGte"
          class="item-col"
          placeholder="时间范围(≥)"
        />
        <el-time-picker
          v-model="timeLte"
          class="item-col"
          placeholder="时间范围(≤)"
        />
      </div>
      <!--    </div>-->
      <!--    <div class="filter-container">-->

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
      <el-checkbox-group v-model="checkboxVal">
        <el-checkbox v-for="row in formThead" :key="row" :label="row">
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
import waves from '@/directive/waves' // waves directive
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
      indexDate: '2021-11-13', // moment().startOf(`day`),
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
      matchValue: '',
      colNames: [],
      tableData: [],
      tableKey: 1,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        perPage: 50
      },
      listBody: {
        must: [],
        range: {
          '@timestamp': {}
        }
      },
      timeGte: '',
      timeLte: '',
      fieldsDropMenu: [], // 筛选条件下拉菜单
      formTheadOptions: [], // 表头选项
      checkboxVal: [], // checkboxVal 勾选框
      formThead: [], // 默认表头 Default header

      temp: {
        colNames: [],
        fields: []
      }
    }
  },
  watch: {
    checkboxVal(valArr) {
      this.colNames = this.formTheadOptions.filter(i => valArr.indexOf(i) >= 0)
      this.tableKey = this.tableKey + 1// 为了保证table 每次都会重渲 In order to ensure the table will be re-rendered each time
    }
  },
  created() {
    this.getFields()
    this.getList()
  },
  methods: {
    requestDateStr() {
      return moment(this.indexDate).format('yyyyMMDD')
    },
    requestBodyMatch() {
      this.listBody.must = []
      if (this.matchKey !== '' && this.matchValue !== '') {
        this.listBody.must.push([this.matchKey, this.matchValue])
      }
    },
    requestBodyRange() {
      if (this.timeGte !== '') {
        const date = moment(this.indexDate).format('yyyy-MM-DD')
        const time = moment(this.timeGte).format('HH:mm:ss')
        const datetime = date + ' ' + time
        this.listBody.range['@timestamp'].gte = moment(datetime).utc().valueOf() // @timestamp为UTC时间
      }
      if (this.timeLte !== '') {
        const date = moment(this.indexDate).format('yyyy-MM-DD')
        const time = moment(this.timeLte).format('HH:mm:ss')
        const datetime = date + ' ' + time
        this.listBody.range['@timestamp'].lte = moment(datetime).utc().valueOf()
      }
    },
    getFields() {
      this.listLoading = true
      const dateStr = this.requestDateStr()
      fetchFields(dateStr).then(res => {
        const result = res.r
        //  筛选条件下拉菜单
        const fields = []
        for (const k in result) {
          if (!k.startsWith('@ver')) { // 要不要过滤掉所有@开头的？
            fields.push(k)
          }
        }
        fields.sort()
        this.fieldsDropMenu = JSON.parse(JSON.stringify(fields))
        // 字段筛选下拉菜单，去除时间选项
        const indexOfAtTimeStamp = this.fieldsDropMenu.indexOf('@timestamp')
        indexOfAtTimeStamp !== -1 ? this.fieldsDropMenu.splice(indexOfAtTimeStamp, 1) : {}
        const indexOfTimeStamp = this.fieldsDropMenu.indexOf('timestamp')
        indexOfTimeStamp !== -1 ? this.fieldsDropMenu.splice(indexOfTimeStamp, 1) : {}

        // 固定表头筛选
        this.checkboxVal = JSON.parse(JSON.stringify(fields))
        this.formThead = JSON.parse(JSON.stringify(fields))
        this.formTheadOptions = JSON.parse(JSON.stringify(fields))

        // loading结束
        this.listLoading = false
      })
    },
    getList() {
      this.listLoading = true
      // URL参数
      const dateStr = moment(this.indexDate).format('yyyyMMDD')
      // post body - match
      this.requestBodyMatch()
      // post body - range 目前只算日期范围
      this.requestBodyRange()
      fetchHits(dateStr, this.listQuery, this.listBody).then(res => {
        const items = res.r.items
        const tableData = []
        items.forEach((item) => {
          if (Object.hasOwn(item._source, '@timestamp')) {
            item._source['@timestamp'] = moment(item._source['@timestamp']).format('yyyy-MM-DD HH:mm:ss')
          }
          if (Object.hasOwn(item._source, 'timestamp')) {
            item._source.timestamp = moment(item._source['timestamp']).format('yyyy-MM-DD HH:mm:ss')
          }
          tableData.push(item._source)
        })
        this.tableData = tableData
        this.colNames = this.formThead
        // this.colNames.sort()
        // this.temp.colNames = JSON.parse(JSON.stringify(this.colNames))
        this.total = res.r.totalCount
        this.listLoading = false
        if (res.r.items.length === 0) {
          this.$message.info('当前检索条件无数据')
        }
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getFields()
      this.getList()
    },
    handlerDateChange(date) {
      // console.log(date)
      this.handleFilter()
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-container {
  .filter-item {
    margin-right: 5px;

    .item-col {
      margin-right: 5px;
    }

    ::v-deep .el-date-editor {
      width: 150px;
    }
  }
}

</style>
