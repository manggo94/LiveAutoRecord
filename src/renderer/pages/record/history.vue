<template>
  <div class="lar-page">
    <div class="lar-control">
      <Button type="primary" icon="ios-arrow-back"  @click="$router.back()">
        返回
      </Button>
      <Button type="primary" icon="md-sync"  @click="reloadPage">
        刷新
      </Button>
      <Button type="primary" icon="md-options" @click="showColumnsSetting = true">
        表头配置
      </Button>
    </div>

    <BetterTable ref="betterTable" :columns="tableColumns" :actions="actions" :data="tableData" :async-load="loadData" />

    <modal-columns-setting :uniqueId="$route.name" v-model="showColumnsSetting" :columns="columns" />
  </div>
</template>

<script>
  import moment from 'moment'
  import { ipcRenderer as ipc } from 'electron-better-ipc'
  import db from '@/db'
  import config from '@/modules/config'
  import { noticeError } from '@/helper'
  import { Platform, RecordLogStatus, IPCMsg } from 'const'

  export default {
    name: 'history',
    data () {
      return {
        showColumnsSetting: false,

        columns: [
          {
            title: 'ID',
            key: 'id',
            width: 80,
            sortable: true
          },
          {
            title: '平台',
            key: 'platformCN',
            width: 80,
            sortable: true,
            render: (h, params) => this.genLinkTag(h, params, Platform[params.row.platform], params.row.getModel().url.origin)
          },
          {
            title: '地址',
            key: 'address',
            width: 100,
            sortable: true,
            render: (h, params) => this.genLinkTag(h, params, params.row.address, params.row.getModel().url.href)
          },
          {
            title: '别称',
            key: 'alias',
            minWidth: 140,
            sortable: true
          },
          {
            title: '主播名',
            key: 'owner',
            minWidth: 140,
            sortable: true
          },
          {
            title: '直播标题',
            key: 'title',
            minWidth: 150,
            sortable: true
          },
          {
            title: '画质',
            key: 'quality',
            width: 90,
            sortable: true
          },
          {
            title: '线路',
            key: 'circuit',
            width: 120,
            sortable: true
          },
          {
            title: '开始时间',
            key: 'createdTime',
            width: 150,
            sortable: true
          },
          {
            title: '停止时间',
            key: 'stoppedTime',
            width: 150,
            sortable: true
          },
          {
            title: '文件',
            key: 'file',
            minWidth: 180,
            sortable: true
          },
          {
            title: '操作',
            key: 'actions',
            minWidth: 130
          }
        ],
        actions: [
          {
            attrs: { title: '播放' },
            props: { icon: 'md-play' },
            loading: ({ row }) => row.getStatus(RecordLogStatus.ReadyToPlay),
            disabled: ({ row }) => !row.exist,
            click: this.openPlayer
          },
          {
            attrs: { title: '在文件夹中打开' },
            props: { icon: 'ios-folder-open' },
            disabled: ({ row }) => !row.exist,
            click: this.openSaveFolder
          },
          {
            attrs: { title: '移除' },
            props: { type: 'error', icon: 'md-trash' },
            loading: ({ row }) => row.getStatus(RecordLogStatus.Removing),
            click: this.removeRecordLog
          }
        ],
        recordLogs: []
      }
    },
    computed: {
      tableColumns () {
        return this.columns.filter(column => !config.hiddenColumns[this.$route.name].includes(column.key))
      },
      tableData () {
        return this.recordLogs.map(recordLog => {
          let data = recordLog.toJSON()
          data.getModel = () => recordLog
          data.getStatus = recordLog.getStatus
          data.createdTime = moment(recordLog.createdAt).format('YYYY-MM-DD HH:mm:ss')
          if (recordLog.stoppedAt) data.stoppedTime = moment(recordLog.stoppedAt).format('YYYY-MM-DD HH:mm:ss')
          return data
        })
      }
    },
    methods: {
      genLinkTag (h, params, text, href) {
        return h('a', {
          on: {
            click: () => this.$electron.shell.openExternal(href)
          }
        }, text)
      },
      async loadData (page, pageSize, sortData) {
        let sort = ['id', 'desc']
        if (sortData) {
          switch (sortData.key) {
            case 'platformCN':
              sort[0] = 'platform'
              break
            case 'createdTime':
              sort[0] = 'createdAt'
              break
            case 'stoppedTime':
              sort[0] = 'stoppedAt'
              break
          }
          sort[1] = sortData.order
        }

        let { count, rows } = await db.RecordLog.findAndCountAll({
          offset: (page - 1) * pageSize,
          limit: pageSize,
          order: [sort],
          where: {
            platform: this.$route.params.platform,
            address: this.$route.params.address
          }
        })

        this.recordLogs = rows
        return count
      },

      // Actions
      // =============================================================================

      reloadPage () {
        this.$refs.betterTable.changePage(this.$refs.betterTable.page)
      },
      async openPlayer ({ row }) {
        let recordLog = row.getModel()
        recordLog.setStatus(RecordLogStatus.ReadyToPlay, true)
        await ipc.callMain(IPCMsg.CreatePlayer, recordLog.file)
        recordLog.setStatus(RecordLogStatus.ReadyToPlay, false)
      },
      openSaveFolder ({ row }) {
        this.$electron.shell.showItemInFolder(row.file)
      },
      removeRecordLog ({ row }) {
        let recordLog = row.getModel()
        let onOk = async () => {
          recordLog.setStatus(RecordLogStatus.Removing, true)
          try {
            await recordLog.destroy()
            this.$refs.betterTable.asyncDataAmount--
            this.reloadPage()
          } catch (err) {
            noticeError(err, '移除录播失败')
          }
          recordLog.setStatus(RecordLogStatus.Removing, false)
        }

        if (!recordLog.exist) {
          onOk()
          return
        }

        this.$Modal.confirm({
          title: '警告: 该操作不可逆',
          content: `<p>是否确认移除ID为 <b>${recordLog.id}</b> 的记录?</p><p>注: 不包括磁盘文件</p>`,
          onOk
        })
      }
    }
  }
</script>

<style scoped>
  .better-table {
    height: calc(100% - 48px);
  }
</style>
