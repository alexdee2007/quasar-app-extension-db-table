<template>
  <q-dialog ref="dialog" no-backdrop-dismiss no-esc-dismiss @hide="onHide" @show="onShow" :maximized="$q.screen.lt.md">
    <dialog-layout ref="dialogLayout" :context="{label: 'Сортування', dialogWidth: '80vw' }">
      <div :style="sortStyle" class="q-pa-md">
        <div class="row q-col-gutter-md q-pb-md">
          <db-input
            type="select"
            v-model="form.field"
            class="col-xs-12 col-md-6"
            classic-style
            label="Колонка"
            :dict="fieldOptions"
            :options-dense="false"
            :validation="$v.form.field"
            />
          <div class="row col-xs-12 col-md-6">
            <db-input
              type="select"
              v-model="form.operator"
              class="col"
              classic-style
              right-stamp
              label="Напрямок"
              :dict="orderOptions"
              :options-dense="false"
              :validation="$v.form.operator"
              />
            <div>
              <q-btn icon="add" class="on-right" @click="addFilter" color="primary" rounded glossy size="md"><q-tooltip>Додати</q-tooltip></q-btn>
            </div>
          </div>
        </div>
        <q-scroll-area class="q-card q-pa-sm" :style="sortScrollAreaStyle">
          <q-chip v-for="(m, i) in memo" :key="i" removable @dblclick.native="revertFilter(i)" class="q-ma-xs" @remove="removeFilter(i)">
            {{ m }}
          </q-chip>
        </q-scroll-area>
        <q-icon name="info" color="grey-8"/>&nbsp;<small class="text-weight-thin">Подвійний клік - повернути з використання</small>
      </div>
      <template v-slot:footer>
        <q-toolbar class="bg-grey-9 text-white">
          <div class="col-md-6 text-left">
            <q-checkbox dark keep-color color="grey" label="Колонки за алфавітом" v-model="alphabetizeColumns" />
          </div>
          <q-space />
          <div class="col-md-6 text-right">
            <q-btn flat @click="clearFilter" label="Очистити" :disable="order.length === 0" />
            <q-btn @click="applyFilter" color="primary" label="Застосувати" :disable="JSON.stringify(order) === JSON.stringify($parent.sort.order)" />
          </div>
        </q-toolbar>
      </template>

    </dialog-layout>

  </q-dialog>
</template>

<script>

  // global
  import { find } from 'lodash';
  import { required } from 'vuelidate/lib/validators';

  // internal
  import { orderOptions } from '../data/operators';
  import fieldsMixin from '../mixins/fields';
  import DialogLayout from '../layouts/DialogLayout';

  export default {
    name: 'DbTableSort',
    mixins: [fieldsMixin],
    components: {
      DialogLayout
    },
    props: {
      model: String
    },
    data() {
      return {
        orderOptions,
        alphabetizeColumns: false,
        form: {
          field: '',
          operator: '',
        },
        memo: [],
        forms: [],
        order: []
      }
    },
    validations: {
      form: {
        field: {required},
        operator: {required}
      }
    },
    computed: {
      sortStyle() {
        return {
          height: this.$q.screen.lt.md ? '100%' : '50vh',
          minHeight: this.$q.screen.lt.md ? null : '300px !important'
        };
      },
      sortScrollAreaStyle() {
        return {
          height: this.$q.screen.lt.md ? 'calc(100vh - 340px)' : 'calc(100% - 100px)',
          minHeight: this.$q.screen.lt.md ? '150px !important' : null
        };
      },
      fieldOptions() {
        const filter = (field) => !field.multiple && field.sort !== false;
        let options = this.getFieldOptions(filter).map(option => {
          option.dsbl = find(this.forms, {field: option.key}) ? true : undefined;
          return option;
        });
        this.$parent.columns.map(col => {
          if (col.name.includes('.')) {
            options.push({
              value: col.label,
              key: col.name,
              stamp: col.name,
              dsbl: find(this.forms, {field: col.name}) ? true : undefined
            });
          }
        });
        if (this.alphabetizeColumns) {
          options = options.sort((a, b) => a.value.localeCompare(b.value));
        }
        return options;
      }
    },
    methods: {
      revertFilter(index) {
        const form = this.forms[index];
        this.form.field = form.field;
        this.form.operator = form.operator;
        this.removeFilter(index);
      },
      show() {
        this.$refs.dialog.show();
      },
      onShow() {
        this.forms = this.$parent.sort.forms.slice();
        this.order = this.$parent.sort.order.slice();
        this.forms.map(form => this.fillMemo(form));
      },
      onHide() {
        this.clearForm();
        this.clearFilter();
      },
      clearForm() {
        this.form.field = '';
        this.form.operator = '';
        this.$v.form.$reset();
      },
      clearFilter() {
        this.memo = [];
        this.order = [];
        this.forms = [];
      },
      applyFilter() {
        this.$parent.sort = {
          order: this.order.slice(),
          forms: this.forms.slice()
        };
        this.$parent.pagination.sortBy = '';
        this.$parent.pagination.descending = '';
        this.$parent.serverInteraction();
        this.$refs.dialog.hide();
      },
      addFilter() {
        this.$v.form.$touch(); // Валидация
        if (this.$v.form.$error) {
          return;
        }
        this.order.push(`${this.form.field} ${this.form.operator}`);
        this.forms.push({field: this.form.field, operator: this.form.operator});
        this.fillMemo(this.form);
        this.clearForm();
        this.$v.form.$reset();
      },
      fillMemo(form) {
        const field = find(this.fieldOptions, {key: form.field});
        const operator = find(orderOptions, {key: form.operator});
        this.memo.push(`${field.value} ${operator.value}`);
      },
      removeFilter(index) {
        this.memo.splice(index, 1);
        this.order.splice(index, 1);
        this.forms.splice(index, 1);
      }
    }
  }
</script>
