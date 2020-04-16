<template>
  <q-dialog ref="dialog" no-backdrop-dismiss no-esc-dismiss @hide="onHide" @show="onShow" :maximized="$q.screen.lt.md">
    <db-dialog-layout ref="dialogLayout" :context="{dialogWidth: '80vw'}">
      <template v-slot:header>
        <q-toolbar class="bg-primary text-white">
          <q-tabs v-model="$parent.filterTab" shrink stretch dense>
            <q-tab name="filter" label="Фільтр" default />
            <q-tab name="sql" label="SQL" />
          </q-tabs>
          <q-space />
          <q-btn dense flat @click="$refs.dialog.hide()">
            <q-icon name="close" />
          </q-btn>
        </q-toolbar>
      </template>
      <div :style="filterTabStyle" class="q-pa-md">
        <div v-if="$parent.filterTab === 'filter'" class="fit">
          <div class="row q-col-gutter-md items-start q-pb-md">
            <db-input
              type="select"
              v-model="form.field"
              class="col-xs-12 col-md-4"
              classic-style
              label="Колонка"
              :dict="fieldOptions"
              :cascade="cascadeFields"
              cascade-mixed
              :options-dense="false"
              :validation="$v.form.field"
              @input="form.operator=null; clearValues();"
              />
            <db-input
              type="select"
              v-model="form.operator"
              class="col-xs-12 col-md-4"
              classic-style
              right-stamp
              label="Оператор"
              :dict="operatorOptions"
              :options-dense="false"
              :validation="$v.form.operator"
              @input="clearValues"
              />
            <div class="row col-xs-12 col-md-4 items-end">

              <div class="col">
                <div class="row">

                  <db-input
                    v-if="multipleValues"
                    :type="textValues ? 'text' : fieldType"
                    v-model="form.multipleValue"
                    class="col"
                    classic-style
                    label="Значення"
                    multiple
                    right-stamp
                    option-stamp="key"
                    key="field-multiple-value"
                    :options-dense="false"
                    :dict="fieldObj.dict"
                    :sort-options="alphabetizeDicts ? (a, b) => a.value.localeCompare(b.value) : undefined"
                    :cascade="fieldObj.cascade"
                    :upper-case="false"
                    :validation="$v.form.multipleValue"
                    />

                  <db-input
                    v-else="!multipleValues"
                    :type="textValues ? 'text' : fieldType"
                    v-model="form.value"
                    class="col"
                    classic-style
                    :label="betweenValues ? 'З':'Значення'"
                    right-stamp
                    option-stamp="key"
                    key="field-single-value"
                    :disable="disableValues"
                    :options-dense="false"
                    :dict="fieldObj.dict"
                    :sort-options="alphabetizeDicts ? (a, b) => a.value.localeCompare(b.value) : undefined"
                    :cascade="fieldObj.cascade"
                    :upper-case="false"
                    :validation="$v.form.value"
                    />

                </div>
                <div v-if="betweenValues" class="row">
                  <db-input
                    :type="textValues ? 'text' : fieldType"
                    v-model="form.value2"
                    class="col"
                    classic-style
                    label="По"
                    right-stamp
                    option-stamp="key"
                    key="field-second-value"
                    :options-dense="false"
                    :dict="fieldObj.dict"
                    :sort-options="alphabetizeDicts ? (a, b) => a.value.localeCompare(b.value) : undefined"
                    :cascade="fieldObj.cascade"
                    :upper-case="false"
                    :validation="$v.form.value2"
                    />
                </div>
              </div>
              <div class="on-right q-field--with-bottom">
                <q-btn icon="add" key="single-button" @click="addFilter" color="primary" rounded glossy size="md"><q-tooltip>Додати</q-tooltip></q-btn>
              </div>
            </div>
          </div>
          <q-scroll-area class="q-card q-pa-sm" :style="filterScrollAreaStyle">
            <q-chip v-for="(m, i) in memo" :key="i" removable @dblclick.native="revertFilter(i)" class="q-ma-xs" @remove="removeFilter(i)">
              {{ m }}
            </q-chip>
          </q-scroll-area>
          <q-icon name="info" color="grey-8"/>&nbsp;<small class="text-weight-thin">Подвійний клік - повернути з використання</small>
        </div>

        <div v-if="$parent.filterTab === 'sql'" class="fit">
          <small class="text-weight-bold">SELECT ... FROM ... WHERE</small>
          <div class="scroll q-card q-mt-sm q-px-sm" @click="$refs.sql.focus()" :style="sqlScrollAreaStyle">
            <q-input dense v-model="sql" type="textarea" borderless  autogrow ref="sql"/>
          </div>
        </div>
      </div>
      <template v-slot:footer>
        <q-toolbar class="bg-grey-9 text-white">
          <div class="col-md-6 text-left" v-if="$parent.filterTab === 'filter'">
            <q-checkbox dark keep-color color="grey" label="Колонки за алфавітом" v-model="alphabetizeColumns" />
            <q-checkbox dark keep-color color="grey" label="Довідники за алфавітом" v-model="alphabetizeDicts" />
          </div>
          <q-space />
          <div class="col-md-6 text-right" v-if="$parent.filterTab === 'filter'">
            <q-btn flat @click="getSqlWhere" label="SQL" :disable="where.length === 0" />
            <q-btn flat @click="clearFilter" label="Очистити" :disable="where.length === 0" />
            <q-btn color="primary" @click="applyFilter" label="Застосувати" :disable="JSON.stringify(where) === JSON.stringify($parent.filter.where)" />
          </div>
          <div class="col text-right" v-if="$parent.filterTab === 'sql'">
            <q-btn flat @click="clearSql" label="Очистити" :disable="sql === ''" />
            <q-btn color="primary" @click="applySql" label="Застосувати" :disable="sql === $parent.filter.sql" />
          </div>
        </q-toolbar>
      </template>

    </db-dialog-layout>
  </q-dialog>
</template>

<script>

  // global
  import { find, isEmpty, map } from 'lodash';
  import { singularize } from 'inflection';

  // app
  import * as models from 'src/models';

  // internal
  import { required, requiredIf } from 'vuelidate/lib/validators';
  import fieldsMixin from '../mixins/fields';

  import {  whereOptions, multipleWhereOptions } from '../data/operators';

  export default {
    name: 'DbTableFilter',
    mixins: [fieldsMixin],
    props: {
      model: Function
    },
    data() {
      return {
        alphabetizeColumns: false,
        alphabetizeDicts: false,
        form: {
          field: null,
          operator: null,
          value: null,
          value2: null,
          multipleValue: []
        },
        sql: '',
        memo: [],
        where: [],
        forms: []
      }
    },
    validations: {
      form: {
        field: {required},
        operator: {required},
        value: {required: requiredIf(form => ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'nlike', 'between', 'nbetween', 'regexp', '$contlike', '$ncontlike'].includes(form.operator))},
        value2: {required: requiredIf(form => ['between', 'nbetween'].includes(form.operator))},
        multipleValue: {required: requiredIf(form => ['inq', 'nin', '$eq', '$neq', '$inq', '$nin', '$contains', '$ncontains'].includes(form.operator))}
      }
    },
    computed: {
      filterTabStyle() {
        return {
          height: this.$q.screen.lt.md ? '100%' : '50vh',
          minHeight: this.$q.screen.lt.md ? null : '300px !important'
        };
      },
      filterScrollAreaStyle() {
        return {
          height: this.$q.screen.lt.md
              ? 'calc(100vh - 415px)'
              : `calc(100% - ${['between', 'nbetween'].includes(this.form.operator) ? '160px' : '100px' })`,
          minHeight: this.$q.screen.lt.md ? '150px !important' : null
        };
      },
      sqlScrollAreaStyle() {
        return {
          height: this.$q.screen.lt.md ? 'calc(100vh - 196px)' : 'calc(100% - 50px)',
          minHeight: this.$q.screen.lt.md ? '150px !important' : null
        };
      },
      fieldType() {
        return this.form.field ? this.fieldObj.type : 'text';
      },
      cascadeFields() {
        return this.model.relations.length > 0;
      },
      textValues() {
        return ['text', 'textarea', 'email', 'tel', 'number'].includes(this.fieldType) || ['like', 'nlike', 'regexp', '$contlike', '$ncontlike'].includes(this.form.operator);
      },
      betweenValues() {
        return ['between', 'nbetween'].includes(this.form.operator);
      },
      multipleValues() {
        return ['inq', 'nin', '$eq', '$neq', '$inq', '$nin', '$contains', '$ncontains'].includes(this.form.operator);
      },
      operatorOptions() {
        return this.fieldObj.multiple ? multipleWhereOptions : this.fieldObj.type === 'boolean' ? this.$store.getters.DICTS[`BOOL&language=${this.fieldObj.language ? this.fieldObj.language : 'UK'}`] : whereOptions;
      },
      disableValues() {
        return this.fieldObj.type === 'boolean' || [null, 'null', 'nnull', '$null', '$nnull'].includes(this.form.operator);
      },
      fieldOptions() {


        let options = this.getFieldOptions(field => field.filter !== false);

        this.$parent.columns.map(col => {

          if (col.model) {
            options.push({
              value: col.label,
              key: col.name,
              stamp: col.name,
              prepend: col.prepend,
              model: col.model
            });
          }
        });

        const iterator = (relation, prevKey, prevLabel) => {

          if (['hasMany', 'hasOne'].includes(relation.type)) {

            let model = relation.model;

            if (model) {
              const newKey = prevKey ? `${prevKey}.${relation.name}` : relation.name;
              const newLabel = prevLabel ? `${prevLabel}.${model.title}` : model.title;
              
              options.push({
                value: newLabel,
                key: `${newKey}.*`,
                stamp: newKey,
                model
              });

              this.getFieldOptions((field) => field.filter !== false, model).map((opt) => {
                options.push({
                  value: `${newLabel}.${opt.value}`,
                  key: `${newKey}.${opt.key}`,
                  stamp: `${newKey}.${opt.key}`,
                });
              });

              /*
               this.$store.getters.MODELS_RELATIONS[relation.modelTo] && this.$store.getters.MODELS_RELATIONS[relation.modelTo].map(relation => {
               return iterator(relation, newKey, newLabel);
               });
               */
            }
          }
        }
        /*
         this.$store.getters.MODELS_RELATIONS[this.model] && this.$store.getters.MODELS_RELATIONS[this.model].map(relation => {
         iterator(relation);
         });
         */
        this.model.relations().map(relation => iterator(relation));

        if (this.alphabetizeColumns) {
          options = options.sort((a, b) => a.value.localeCompare(b.value));
        }

        return options;
      }
    },
    methods: {
      getSelectOptions(field) {
        let options = [];
        const dictName = `${field.dict}&language=${field.language ? field.language : 'UK'}`;
        this.$store.getters.DICTS[dictName] && this.$store.getters.DICT(dictName).forEach(val => {
          options.push({key: val.key, value: val.value, stamp: val.key});
        });
        return options;
      },
      getOperatorOptions(field) {
        return field.multiple ? multipleWhereOptions : field.type === 'boolean' ? this.$store.getters.DICTS[`BOOL&language=${field.language ? field.language : 'UK'}`] : whereOptions;
      },
      revertFilter(index) {
        const form = this.forms[index];
        this.form.field = form.field;
        this.form.operator = form.operator;
        this.$nextTick(() => {
          this.form.value = form.value;
          this.form.value2 = form.value2;
          this.form.multipleValue = form.multipleValue;
          this.removeFilter(index);
        });

      },
      show() {
        this.$refs.dialog.show();
      },
      onShow() {
        this.sql = this.$parent.filter.sql;
        this.forms = this.$parent.filter.forms.slice();
        this.where = this.$parent.filter.where.slice();
        this.forms.map(form => this.fillMemo(form));
        if (this.where.length !== 0) {
          this.$parent.filterTab = 'filter';
        } else if (this.sql !== '') {
          this.$parent.filterTab = 'sql';
        }
      },
      onHide() {
        this.clearForm();
        this.clearFilter();
        this.clearSql();
      },
      clearValues() {
        this.form.value = null;
        this.form.value2 = null;
        this.form.multipleValue = [];
      },
      clearForm() {
        this.form.field = null;
        this.form.operator = null;
        this.form.value = null;
        this.form.value2 = null;
        this.form.multipleValue = [];
        this.$v.$reset();
      },
      clearFilter() {
        this.memo = [];
        this.where = [];
        this.forms = [];
      },
      clearSql() {
        this.sql = '';
      },
      applySql() {
        this.$parent.filter = {
          where: [],
          forms: [],
          sql: this.sql
        }
        this.clearFilter();
        this.$parent.serverInteraction();
        this.$refs.dialog.hide();
      },
      applyFilter() {
        this.$parent.filter = {
          where: this.where.slice(),
          forms: this.forms.slice(),
          sql: ''
        }
        this.clearSql();
        this.$parent.serverInteraction();
        this.$refs.dialog.hide();
      },
      async getSqlWhere() {
        try {
          this.$q.loading.show({message: 'Завантаження'});
          this.sql = await this.$api.router.getSqlWhere(this.model, this.where);
          this.$parent.filterTab = 'sql';
        } catch (err) {
          console.error(err);
        } finally {
          this.$q.loading.hide();
        }
      },
      addFilter() {
        this.$v.$touch();
        if (this.$v.$error) {
          return;
        }
        this.where.push(this.buildFilter(this.form));
        this.forms.push({field: this.form.field, operator: this.form.operator, value: this.form.value, value2: this.form.value2, multipleValue: this.form.multipleValue});
        this.fillMemo(this.form);
        this.$nextTick(() => {
          this.clearForm();
        });
        this.$v.$reset();
      },
      buildFilter( {field, operator, value, value2, multipleValue}) {
        let where = {};
        if (operator === 'eq') {
          where = {[field]: value};
        } else if (['false', 'true'].includes(operator)) {
          where = {[field]: operator};
        } else if (operator === 'null') {
          where = {[field]: null};
        } else if (operator === 'nnull') {
          where = {[field]: {neq: null}};
        } else if (['inq', 'nin', '$eq', '$neq', '$inq', '$nin', '$contains', '$ncontains'].includes(operator)) {
          where = {[field]: {[operator]: multipleValue}};
        } else if (operator === 'between') {
          where = {[field]: {'between': [value, value2]}};
        } else if (operator === 'nbetween') {
          where = {'or': [{[field]: {lt: value}}, {[field]: {gt: value2}}]};
        } else {
          where = {[field]: {[operator]: value}};
        }
        return where;
      },
      fillMemo( {field, operator, value, value2, multipleValue}) {

        const splittedField = field.split('.').reverse();
        const fieldName = splittedField.shift();
        const model = models[singularize(splittedField.shift() || '')];

        const fieldObj = this.model.getField(fieldName);
        const fieldLabel = find(this.fieldOptions, {key: field}).value;
        const operatorLabel = find(this.getOperatorOptions(fieldObj), {key: operator}).value;

        let valueLabel;
        if (['false', 'true', 'null', 'nnull', '$null', '$nnull'].includes(operator)) {
          valueLabel = '';
        } else if (fieldObj.type === 'select' && fieldObj.dict && typeof fieldObj.dict !== 'function' && !['like', 'nlike', 'regexp', '$contlike', '$ncontlike'].includes(operator)) {
          if (['inq', 'nin', '$eq', '$neq', '$inq', '$nin', '$contains', '$ncontains'].includes(operator)) {
            const values = multipleValue.map(v => find(this.getSelectOptions(fieldObj), {key: v}));
            valueLabel = `(${values.map(v => v.value).join()})`;
          } else if (['between', 'nbetween'].includes(operator)) {
            valueLabel = `${find(this.getSelectOptions(fieldObj), {key: value}).value} та ${find(this.getSelectOptions(fieldObj), {key: value2}).value}`;
          } else {
            valueLabel = find(this.getSelectOptions(fieldObj), {key: value}).value;
          }
        } else {
          if (['inq', 'nin', '$eq', '$neq', '$inq', '$nin', '$contains', '$ncontains'].includes(operator)) {
            valueLabel = `(${multipleValue.join()})`;
          } else if (['between', 'nbetween'].includes(operator)) {
            valueLabel = `${value} та ${value2}`;
          } else {
            valueLabel = value;
          }
        }
        this.memo.push(`${fieldLabel} ${operatorLabel} ${valueLabel}`)
      },
      removeFilter(index) {
        this.memo.splice(index, 1);
        this.where.splice(index, 1);
        this.forms.splice(index, 1);
      }
    }
  }
</script>
