<template>
  <div class="q-layout-padding" :style="{paddingBottom: $q.screen.lt.md ? '88px' : '' }">

    <div class="row q-pb-sm">
      <template v-if="!noQuickSearch" >
        <db-input v-model="quickSearch" clearable classic-style hide-bottom-space :debounce="debounce" placeholder="Пошук" style="min-width: 100px" class="col text-uppercase">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-if="quickSearch" v-slot:append>
            <q-icon name="cancel" @click.stop="quickSearch = null" class="cursor-pointer" />
          </template>
        </db-input>
        <slot name="extra-search" :initTable="initTable" />
      </template>
    </div>

    <q-table
      ref="table"
      row-key="id"
      :class="{'bg-grey-1':true, 'table-selected': !$q.screen.lt.md && selected.length, 'q-table__no-selection': selection === 'none'}"
      :selection="selection"
      :grid="$q.screen.lt.md"
      :title="title"
      :data="data"
      :visible-columns="visibleColumns"
      :pagination.sync="pagination"
      :columns="columns"
      :selected.sync="selected"
      :separator="separator"
      :loading="loading"
      :filter="quickSearch"
      :selected-rows-label="()=>{}"
      @request="onRequest"
      table-style="max-height: calc(100vh - 220px)"
      virtual-scroll
      :virtual-scroll-slice-size="60"
      :virtual-scroll-item-size="41"
      :rows-per-page-options="$q.screen.lt.md ? [10]: [0]"
      hide-bottom
      >

      <template v-slot:top="props">
        <q-slide-transition>
          <div v-if="!selected.length || $q.screen.lt.md" class="flex flex-center full-width">
            <q-btn
              v-if="addRow && !$q.screen.lt.md"
              icon="add"
              color="pink-13"
              @click="addRow"
              rounded
              class="on-right"
              label="Додати"
              />
            <q-btn
              color="primary"
              class="on-right"
              flat
              round
              icon="refresh"
              @click="serverInteraction()"
              ><q-tooltip>Оновити</q-tooltip>
            </q-btn>
            <q-btn
              v-if="filterWhere"
              color="primary"
              class="on-right"
              :flat="filter.where.length === 0 && !filter.sql"
              round
              icon="filter_list"
              @click="$refs.dialogFilter.show()"
              ><q-tooltip>Фільтр</q-tooltip>
            </q-btn>
            <q-btn
              v-if="filterSort"
              color="primary"
              class="on-right"
              :flat="sort.order.length === 0"
              round
              icon="sort"
              @click="$refs.dialogSort.show()"
              ><q-tooltip>Сортування</q-tooltip>
            </q-btn>
            <q-btn color="primary" flat round icon="more_vert" >
              <q-menu>
                <q-list link>
                  <q-item v-if="visibleColumnOptions.length" clickable v-close-popup @click.native="openColumnsDialog">
                    <q-item-section avatar>
                      <q-icon name="view_column" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Колонки</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click.native="openGridsDialog">
                    <q-item-section avatar>
                      <q-icon name="view_module" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Сітка</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click.native="openExportDialog">
                    <q-item-section avatar>
                      <q-icon name="file_download" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Експорт</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <q-space />
            <template v-if="$refs.table && props.pagination.rowsNumber">
              <span class="q-table__bottom-item">{{ $q.lang.table.pagination($refs.table.firstRowIndex + 1, Math.min(props.pagination.page*props.pagination.rowsPerPage, props.pagination.rowsNumber), props.pagination.rowsNumber) }}</span>
              <q-btn :color="$refs.table.color" round icon="first_page" dense flat :disable="props.isFirstPage" @click="$refs.table.setPagination({page: 1})" />
              <q-btn :color="$refs.table.color" round icon="chevron_left" dense flat :disable="props.isFirstPage" @click="props.prevPage" />
              <q-btn :color="$refs.table.color" round icon="chevron_right" dense flat :disable="props.isLastPage" @click="props.nextPage" />
              <q-btn class="on-left" :color="$refs.table.color" round icon="last_page" dense flat :disable="props.isLastPage" @click="$refs.table.setPagination({page: props.pagesNumber})" />
            </template>
            <template v-else>
              <q-icon :name="$q.iconSet.table.warning" size="sm" class="q-mr-sm"/>
              {{ quickSearch ? $q.lang.table.noResults: loading ? $q.lang.table.loading : $q.lang.table.noData }}
            </template>
          </div>
        </q-slide-transition>

        <q-slide-transition>
          <div v-if="selected.length && !$q.screen.lt.md" class="flex flex-center full-width">
            <slot name="table-actions" :selected="selected" />
            <q-space />
            <div class="text-subtitle2">{{ $q.lang.table.selectedRecords(selected.length) }}</div>
            <q-btn
              class="on-right"
              flat
              round
              icon="close"
              @click="selected = []">
              <q-tooltip>Зняти вибір</q-tooltip>
            </q-btn>
          </div>
        </q-slide-transition>

        <q-dialog v-model="selectedDialog" seamless position="bottom">
          <q-card class="full-width" dark>
            <q-card-section class="row items-center no-wrap">
              <slot v-if="selected.length" name="table-actions" :selected="selected" />
              <q-space />
              <div class="text-caption">{{ $q.lang.table.selectedRecords(selected.length) }}</div>
              <q-btn flat round icon="close" @click="selected = []">
                <q-tooltip>Зняти вибір</q-tooltip>
              </q-btn>
            </q-card-section>
          </q-card>
        </q-dialog>

      </template>

      <template v-slot:body="props">
        <q-tr
          :class="classRow(props)"
          @click.native="rowClick(props)"
          :props="props">
          <q-td v-if="selection !== 'none'" auto-width style="padding-top:0px; padding-bottom:0px;">
            <q-checkbox v-model="props.selected" />
          </q-td>
          <q-td v-for="(col, key) in props.cols" :key="col.name" :props="props" :style="{whiteSpace: col.wrap ? 'normal' : ''}">
            <slot :name="`column-${col.name}`" :props="props" :col="col">
              <q-icon v-if="col.type==='boolean' && col.value" name="check" color="primary" />
              <q-icon v-else-if="col.type==='boolean' && !col.value" name="clear" color="light" />
              <template v-else>
                {{ col.value }}
              </template>
            </slot>
          </q-td>
        </q-tr>
      </template>

      <template v-slot:item="props">
        <div
          class="q-table__grid-item col-xs-12 col-sm-6 col-md-4 col-lg-3"
          :class="{'q-table__grid-item--selected': props.selected === true}"
          @click="rowClick(props)"
          >
          <div class="q-table__grid-item-card q-table__card" :class="classRow(props)">
            <template v-if="selection !== 'none'">
              <div class="q-table__grid-item-row">
                <q-checkbox dense v-model="props.selected" />
              </div>
              <q-separator />
            </template>
            <div v-for="(col, key) in props.cols" class="q-table__grid-item-row">
              <div class="q-table__grid-item-title">{{ col.label }}</div>
              <div class="q-table__grid-item-value">{{ col.value }}</div>
            </div>
          </div>
        </div>
      </template>

      <template slot="pagination" slot-scope="props">
        <span class="q-table__bottom-item">{{ $q.lang.table.pagination($refs.table.firstRowIndex + 1, Math.min(props.pagination.page*props.pagination.rowsPerPage, props.pagination.rowsNumber), props.pagination.rowsNumber) }}</span>
        <q-btn :color="$refs.table.color" round icon="first_page" dense flat :disable="props.isFirstPage" @click="$refs.table.setPagination({page: 1})" />
        <q-btn :color="$refs.table.color" round icon="chevron_left" dense flat :disable="props.isFirstPage" @click="props.prevPage" />
        <q-btn :color="$refs.table.color" round icon="chevron_right" dense flat :disable="props.isLastPage" @click="props.nextPage" />
        <q-btn class="on-left" :color="$refs.table.color" round icon="last_page" dense flat :disable="props.isLastPage" @click="$refs.table.setPagination({page: props.pagesNumber})" />
      </template>

    </q-table>

    <db-table-sort
      v-if="filterSort"
      ref="dialogSort"
      :model="model"
      />
    <db-table-filter
      v-if="filterWhere"
      ref="dialogFilter"
      :model="model"
      />

    <q-page-sticky v-if="$q.screen.lt.md && addRow && !selected.length" position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="pink-13" @click="addRow">
        <q-tooltip>Додати</q-tooltip>
      </q-btn>
    </q-page-sticky>

  </div>
</template>

<script>

  // global
  import { exportFile } from 'quasar';
  import { find, set } from 'lodash';
  import moment from 'moment';

  // app
  import modelApi from 'src/api/model';

  //internal
  import fieldsMixin from '../mixins/fields';
  import DbTableSort from '../dialogs/DbTableSort';
  import DbTableFilter from '../dialogs/DbTableFilter';

  export default {
    name: 'DbTableData',
    mixins: [fieldsMixin],
    components: {
      DbTableSort,
      DbTableFilter
    },
    props: {
      title: {
        type: String,
        required: true
      },
      fields: {
        type: Array,
        required: true
      },
      model: {
        type: String,
        required: true
      },
      initWhere: {
        type: Object,
        default: () => {
          return {}
        }
      },
      defaultSort: {
        type: Object,
        default: () => {
          return {
            sortBy: 'id',
            descending: false
          }
        }
      },
      include: {
        type: [Object, Array],
        default: () => {
          return {}
        }
      },
      filterWhere: {
        type: Boolean,
        default: true
      },
      filterSort: {
        type: Boolean,
        default: true
      },
      selection: {
        type: String,
        default: 'single'
      },
      gridStyle: {
        type: String,
        default: 'horizontal'
      },
      addRow: {
        type: Function
      },
      classRow: {
        type: Function,
        default: function () {
          return 'cursor-pointer';
        }
      },
      noQuickSearch: Boolean
    },
    data() {
      return {
        tableFields: this.fields,
        loading: false,
        quickSearch: null,
        tableMode: 'server',
        data: [],
        tableData: [],
        selected: [],
        filterTab: 'filter',
        separator: this.gridStyle,
        pagination: {
          sortBy: this.defaultSort.sortBy,
          descending: this.defaultSort.descending,
          page: 1,
          rowsPerPage: this.$q.screen.lt.md ? 10 : this.$store.getters.ROWS_LIMIT,
          rowsNumber: 0
        },
        filter: {
          where: [],
          forms: [],
          sql: ''
        },
        sort: {
          order: [],
          forms: []
        }
      }
    },
    computed: {
      selectedDialog() {
        return this.$q.screen.lt.md && !!this.selected.length;
      },
      debounce() {
        return this.tableMode === 'server' ? 800 : 300;
      },
      rowsLimit() {
        return this.$store.getters.ROWS_LIMIT;
      },
      visibleColumns: {
        get() {
          return this.tableFields.filter(field => field.visible).map(field => field.name);
        },
        set(value) {
          this.tableFields = this.tableFields.map(field => {
            field.visible = value.includes(field.name) || field.required ? true : false;
            return field;
          });
        }
      },
      visibleColumnOptions() {
        return this.columns.filter(col => !col.required && !col.hidden).map(col => ({
            value: col.name,
            label: col.label
          }));
      },
      columns() {
        const columns = [];
        this.tableFields.forEach(tableField => {
          const modelField = this.getFieldObj(tableField.name);
          let column = {
            name: tableField.name,
            prepend: tableField.prepend,
            field: tableField.field !== undefined ? tableField.field : tableField.name,
            label: tableField.label !== undefined ? tableField.label : modelField.label,
            align: tableField.align !== undefined ? tableField.align : 'left',
            sortable: tableField.sortable !== undefined ? tableField.sortable : true,
            required: tableField.required ? true : false,
            hidden: tableField.hidden ? true : false,
            wrap: tableField.wrap ? true : false,
            type: tableField.type !== undefined ? tableField.type : modelField.type,
            dict: tableField.dict !== undefined ? tableField.dict : (modelField.dict !== undefined ? `${modelField.dict}&language=${modelField.language ? modelField.language : 'UK'}` : undefined),
            sort: tableField.sort,
            format: tableField.format
          };
          if (column.type === 'date' && !column.format) {
            column.format = val => val ? moment(val, 'DD.MM.YYYY').format('DD.MM.YYYY') : '';
          }
          if (['datetime', 'date'].includes(column.type) && column.sortable && !column.sort) {
            column.sort = (a, b) => (a && a.trim()) ? moment(a, 'DD.MM.YYYY HH:mm:ss') - moment(b, 'DD.MM.YYYY HH:mm:ss') : -1;
          }
          if (column.type === 'boolean' && column.sortable && !column.sort) {
            column.sort = (a, b) => a - b;
          }
          if (column.type === 'select' && this.$store.getters.DICTS[column.dict]) {
            if (!column.format) {
              column.format = (val) => {
                const v = this.$store.getters.DICT(column.dict).find(v => v.key === val);
                return v ? v.value : val;
              }
            }

            // Сортировка спр. поля по значению а не ключу (откл. - производительность на больших данных ??? )
            /*
             if (column.sortable && !column.sort) {
             column.sort = (a, b) => {
             const a1 = this.$store.state.getters.DICT(column.dict).find(v => v.key === a);
             const b1 = this.$store.state..getters.DICT(column.dict).find(v => v.key === b);
             return (a1 ? a1.value : a).localeCompare(b1 ? b1.value : b);
             }
             }
             */

          }

          if (column.type === 'text' && column.sortable && !column.sort) {
            column.sort = (a, b) => a.localeCompare(b);
          }

          columns.push(column);
        });
        if (!find(columns, {name: 'id'})) {
          columns.push({name: 'id', hidden: true});
        }
        return columns;
      },
      columnsFilter() {
        return this.columns.map(field => field.name);
      }
    },
    methods: {
      rowClick(props) {
        this.selected = this.selection === 'none' ? [] : this.$refs.table.isRowSelected(props.key)
            ? this.selected.filter(row => row.id !== props.key)
            : [props.row];
        this.$emit('row-click', props.row);
      },
      openColumnsDialog() {
        this.$q.dialog({
          title: 'Налаштування колонок',
          message: 'Оберіть колонки для відображення у поточній таблиці',
          options: {
            type: 'checkbox',
            model: this.visibleColumns.slice(),
            inline: false,
            items: this.visibleColumnOptions
          },
          ok: 'Застосувати',
          cancel: 'Скасувати'
        }).onOk(data => {
          this.visibleColumns = data;
        });
      },
      openGridsDialog() {
        this.$q.dialog({
          title: 'Налаштування сітки',
          message: 'Оберіть стиль розподілу комірок у поточній таблиці',
          options: {
            type: 'radio',
            model: this.separator,
            items: [
              {label: 'Горизонтальний', dense: true, value: 'horizontal'},
              {label: 'Вертикальний', value: 'vertical'},
              {label: 'Комірки', value: 'cell'},
              {label: 'Без роздільника', value: 'none'}
            ]
          },
          ok: 'Застосувати',
          cancel: 'Скасувати'
        }).onOk(data => {
          this.separator = data;
        });
      },
      openExportDialog() {
        this.$q.dialog({
          title: 'Налаштування експорту',
          message: 'Оберіть колонки для експорту даних в Excel',
          options: {
            type: 'checkbox',
            model: this.columnsFilter.filter(field => this.getFieldObj(field).export !== false),
            items: this.getFieldOptions((field) => field.export !== false).map(val => ({
                label: val.value,
                value: val.key
              }))
          },
          ok: 'Виконати',
          cancel: 'Скасувати'
        }).onOk(data => {
          data.length && this.exportData(data);
        });
      },
      onRequest( {pagination}) {
        if (this.tableMode === 'server') {
          this.serverInteraction(pagination);
        } else {
          this.clientInteraction(pagination);
      }
      },
      filterMethod() {
        let cellValue = this.$refs.table.getCellValue;
        return this.quickSearch ? this.tableData.filter(row => this.columns.some(col => (cellValue(col, row) + '').toLowerCase().indexOf(this.quickSearch.toLowerCase()) !== -1)) : this.tableData;
      },
      searchWhere() {
        if (this.quickSearch && this.tableMode === 'server') {
          let terms = `/${this.quickSearch}/i`;
          let where = {or: []};
          this.columns.forEach((col, i) => {
            if (col.name.includes('.')) {
              where.or.push(set({}, col.name, {regexp: terms}));
            } else {
              where.or.push({[col.name]: {regexp: terms}});
            }
          });
          return where;
        }
        return {};
      },
      async initTable() {
        try {
          await this.setTableMode();
          await this.serverInteraction();
        } catch (err) {
          console.error(err);
        }
      },
      async setTableMode() {
        try {
          this.loading = true;
          this.selected = [];
          const count = await modelApi.count(this.model, this.initWhere);
          if (count > this.rowsLimit) {
            this.tableMode = 'server';
          } else {
            this.tableMode = 'client';
          }
        } catch (err) {
          console.error(err);
        } finally {
          this.loading = false;
        }
      },
      async exportData(fields = this.columnsFilter) {
        try {
          this.$q.loading.show({message: 'Завантаження'});
          let filter = {where: {and: []}};
          filter.fields = fields;
          filter.where.and = filter.where.and.concat(this.initWhere, this.searchWhere(), this.filter.where); // filter where
          filter.where.sql = this.filter.sql;
          let {descending, sortBy} = this.$refs.table.computedPagination;
          if (sortBy) {
            let sortOrder = descending ? 'desc' : 'asc';
            filter.order = [`${sortBy} ${sortOrder}`];
          } else if (this.sort.order.length) {
            filter.order = this.sort.order.slice();
          }
          filter.allRows = true;
          let data = await modelApi.find(this.model, filter);
          var csvContent = this.builHtmlTable(fields, data);
          const status = exportFile(`${this.model}Export.xls`, csvContent, 'application/vnd.ms-excel');
          if (status !== true) {
            this.$q.notify({message: 'Браузер відхилив завантаження файла...', color: 'negative', icon: 'warning'})
          }
        } catch (err) {
          console.error(err);
        } finally {
          this.$q.loading.hide();
      }
      },
      builHtmlTable(fields, data) {
        let tbl = [];
        tbl.push('<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><style type="text/css">.th{background-color: "#c1c1c1"}td{mso-number-format:"\@"}</style></head><body><table border="1"><thead><tr>');
        fields.map(fieldName => {
          const modelField = this.modelObj.fields[fieldName];
          if (modelField) {
            tbl.push('<th class="th">');
            tbl.push(modelField.label || fieldName);
            tbl.push('</th>');
          }
        });
        tbl.push('</tr></thead><tbody>');

        data.map(row => {
          tbl.push('<tr>');
          fields.map(fieldName => {
            const modelField = this.modelObj.fields[fieldName];
            let dictName = '';
            if (modelField) {
              tbl.push('<td>');
              if (row[fieldName] !== null) {
                if (modelField.dict) {
                  dictName = `${modelField.dict}&language=${modelField.language ? modelField.language : 'UK'}`;
                }
                if (modelField.type === 'select' && this.$store.getters.DICTS[dictName] && modelField.multiple === true) {
                  let vals = [];
                  row[fieldName].map(val => {
                    const v = this.$store.getters.DICT(dictName).find(v => v.key === val);
                    vals.push(v ? v.value : val);
                  });
                  tbl.push(vals.join());
                } else if (modelField.type === 'select' && this.$store.getters.DICTS[dictName]) {
                  const v = this.$store.getters.DICT(dictName).find(v => v.key === row[fieldName]);
                  tbl.push(v ? v.value : row[fieldName]);
                } else if (modelField.type === 'date') {
                  tbl.push(moment(row[fieldName], 'DD.MM.YYYY').format('DD.MM.YYYY'));
                } else if (modelField.type === 'boolean') {
                  const v = this.$store.getters.DICT(`BOOL&language=${modelField.language ? modelField.language : 'UK'}`).find(v => v.value === String(row[fieldName]));
                  tbl.push(v ? v.label : row[fieldName]);
                } else {
                  tbl.push(row[fieldName]);
                }
              }
              tbl.push('</td>');
            }
          });
          tbl.push('</tr>');
        });

        tbl.push('</tbody></table>');
        return tbl.join('');
      },
      clientInteraction(pagination = this.$refs.table.computedPagination) {
        this.pagination = pagination;
        let table = this.$refs.table;
        let rows = this.tableData.slice();
        let {descending, page, rowsPerPage, sortBy} = pagination;
        if (this.quickSearch) {
          rows = this.filterMethod();
        }

        if (!this.sort.order.length && !sortBy) {
          sortBy = this.defaultSort.sortBy;
          descending = this.defaultSort.descending;
        }

        if (sortBy) {
          rows = table.sortMethod(rows, sortBy, descending);
          // сбрасываем сорт.фильтр
          this.sort.order = [];
          this.sort.forms = [];
        }

        this.pagination.rowsNumber = rows.length;
        if (rowsPerPage) {
          rows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
        }
        this.data = rows;
        // this.selected = [];
      },
      async serverInteraction(pagination = this.$refs.table.computedPagination) {
        try {
          this.loading = true;
          this.pagination = pagination;
          let {descending, page, rowsPerPage, sortBy} = pagination;

          let filter = {where: {and: []}};
          filter.fields = this.columnsFilter; // filter fields
          filter.where.and = filter.where.and.concat(this.initWhere, this.searchWhere(), this.filter.where); // filter where
          filter.where.sql = this.filter.sql;
          filter.include = this.include;
          // сорт.фильтр
          if (this.sort.order.length && !sortBy) {
            filter.order = this.sort.order.slice();
          }

          // skip, limit, order by
          if (this.tableMode === 'server') {
            filter.skip = (page - 1) * rowsPerPage;
            filter.limit = rowsPerPage;

            if (!this.sort.order.length && !sortBy) {
              sortBy = this.defaultSort.sortBy;
              descending = this.defaultSort.descending;
            }

            const sortOrder = descending ? 'desc' : 'asc';
            const field = find(this.tableFields, {name: sortBy});
            if (field && field.remoteSortBy) {
              filter.order = field.remoteSortBy.map(col => `${col} ${sortOrder}`).join();
            } else {
              filter.order = `${sortBy} ${sortOrder}`;
            }
            // сбрасываем сорт.фильтр
            this.sort.order = [];
            this.sort.forms = [];

          }

          const data = await modelApi.find(this.model, filter);

          // Update selected rows data
          const selectedKeys = this.selected.map(row => row.id);
          const updatedSelectedRows = data.filter(row => selectedKeys.includes(row.id));
          const updatedSelectedKeys = updatedSelectedRows.map(row => row.id);
          this.selected = this.selected.filter(row => !updatedSelectedKeys.includes(row.id));

          if (this.tableMode === 'client') { // client mode
            this.tableData = data;
            this.data = [];
            this.clientInteraction(pagination);
          } else { // server mode
            this.pagination.rowsNumber = await modelApi.count(this.model, filter.where);
            this.tableData = [];
            this.data = data;
          }

          this.$nextTick(() => {
            this.selected = this.selected.concat(updatedSelectedRows);
          });

        } catch (err) {
          console.error(err);
        } finally {
          this.loading = false;
      }
      }
    },
    mounted() {
      this.initTable();
    }
  }
</script>

<style lang="stylus">



</style>
